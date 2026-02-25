# download_optimize_zip_from_csv.py
# Reads a CSV (crd, primary_business_name, website), finds a firm logo, saves as {crd}.webp,
# writes a manifest CSV + report-card CSV into the logos folder, and prints progress with ETA.
# Filters out press/award/regulator/platform badges, rasterizes SVG -> WebP, and blacklists
# known bad logos (e.g., WordPress + BrokerCheck) via perceptual hash (dHash).

import argparse
import os
import csv
import time
import subprocess
import tempfile
from collections import Counter
from io import BytesIO
from urllib.parse import urljoin, urlparse

import requests
import pandas as pd
from bs4 import BeautifulSoup
from PIL import Image, UnidentifiedImageError

HEADERS = {"User-Agent": "Mozilla/5.0 (FAR Logo Bot)"}

# ---------------------------
# Exclusions / allowlists
# ---------------------------

PRESS_BADGE_KEYWORDS = [
    "press", "featured", "as-seen", "as_seen", "media", "award", "awards", "recognition",
    "ranking", "rankings", "accolade", "best", "top", "list",
    "usa-today", "usatoday", "statista", "shook", "inc5000", "inc-5000",
    "forbes", "bloomberg", "barrons", "wsj", "nytimes", "cnbc", "cnn",
]

REGULATOR_BADGE_KEYWORDS = [
    "brokercheck", "finra",
    "adviserinfo", "adviserinfo.sec.gov",
    "sec.gov", "form-adv", "formadv", "investmentadviser",
    "ria", "iard",
]

# Explicit publisher/platform domains that should never be accepted as firm logos
BAD_PUBLISHER_NETLOCS = {
    "cnn.com", "www.cnn.com",
    "cnbc.com", "www.cnbc.com",
    "nytimes.com", "www.nytimes.com",
    "barrons.com", "www.barrons.com",
    "wsj.com", "www.wsj.com",
    "usatoday.com", "www.usatoday.com",
    "statista.com", "www.statista.com",
    "forbes.com", "www.forbes.com",
    "bloomberg.com", "www.bloomberg.com",
    "domainmarket.imgix.net",
}

# Known website-builder / legit asset CDNs (allowable)
ALLOWED_THIRD_PARTY_CDNS = {
    # FMG / Twenty Over Ten / Advisor sites
    "static.fmgsuite.com",
    "static.twentyoverten.com",
    "cdn.zephyrcms.com",
    "transform.octanecdn.com",
    "focus-financial.transforms.svdcdn.com",

    # Squarespace
    "images.squarespace-cdn.com",
    "static1.squarespace.com",
    "static.squarespace.com",

    # Wix
    "static.wixstatic.com",
    "static.parastorage.com",

    # GoDaddy Website Builder
    "img1.wsimg.com",

    # Webflow
    "cdn.prod.website-files.com",
    "uploads-ssl.webflow.com",

    # Duda
    "lirp.cdn-website.com",

    # Showit
    "static.showit.co",

    # WordPress CDN (special rule below)
    "i0.wp.com", "i1.wp.com", "i2.wp.com",
}

# Hard-bad URL substrings observed in manifest + common bad assets
HARD_BAD_URL_SUBSTRINGS = [
    "pwa-app/logo-default.png",
    "logo-default.png",
    "domainmarket",
    "s0.wp.com/i/webclip.png",
    "webclip.png",

    # BrokerCheck/FINRA badges
    "brokercheck",
    "finra",

    # WordPress default/logo assets
    "wp-includes/images/w-logo",
    "w-logo-blue",
    "wordpress-logo",
    "wpcom-mark",
]

# If URL contains any of these, reject as non-firm logo even if hosted on firm domain
HARD_BAD_KEYWORDS = [
    "wordpress",                 # catches many WP powered-by artifacts
    "wp-content/plugins",        # powered-by / widget assets
    "carousel",                  # press logos frequently served in carousels
]

# ---------------------------
# Image blacklist (dHash)
# ---------------------------

# dHash references computed from known bad examples (WordPress + BrokerCheck)
BAD_DHASHES = {
    "wordpress": 0xC88696925B49ECEC,
    "brokercheck": 0x9D9D9D8D8C9C6D64,
}
BAD_HASH_MAX_DISTANCE = 6  # lower = stricter, higher = more aggressive

def dhash_from_pil(img: Image.Image, hash_size: int = 8) -> int:
    # No numpy dependency: compare adjacent pixels in grayscale resized image
    img = img.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    pixels = list(img.getdata())
    width = hash_size + 1

    h = 0
    for row in range(hash_size):
        offset = row * width
        for col in range(hash_size):
            left = pixels[offset + col]
            right = pixels[offset + col + 1]
            h = (h << 1) | (1 if right > left else 0)
    return h

def hamming64(a: int, b: int) -> int:
    return (a ^ b).bit_count()

def is_blacklisted_image(img: Image.Image) -> tuple[bool, str]:
    h = dhash_from_pil(img)
    for label, ref in BAD_DHASHES.items():
        if hamming64(h, ref) <= BAD_HASH_MAX_DISTANCE:
            return True, label
    return False, ""

# ---------------------------
# Helpers
# ---------------------------

def normalize_host(host: str) -> str:
    host = (host or "").lower().strip()
    return host[4:] if host.startswith("www.") else host

def base_domain_simple(host: str) -> str:
    h = normalize_host(host)
    parts = [p for p in h.split(".") if p]
    return ".".join(parts[-2:]) if len(parts) >= 2 else h

def same_site_family(site_host: str, asset_host: str) -> bool:
    sh = normalize_host(site_host)
    ah = normalize_host(asset_host)
    return ah == sh or ah.endswith("." + sh)

def is_press_badge(s: str) -> bool:
    u = (s or "").lower()
    return any(k in u for k in PRESS_BADGE_KEYWORDS)

def is_regulator_badge(s: str) -> bool:
    u = (s or "").lower()
    return any(k in u for k in REGULATOR_BADGE_KEYWORDS)

def is_hard_bad_url(u: str) -> bool:
    ul = (u or "").lower()
    if any(x in ul for x in HARD_BAD_URL_SUBSTRINGS):
        return True
    if any(k in ul for k in HARD_BAD_KEYWORDS):
        return True
    if is_press_badge(ul):
        return True
    if is_regulator_badge(ul):
        return True
    return False

def allow_candidate_for_site(candidate_url: str, site_url: str) -> bool:
    """Hard gate: only allow first-party or known CDNs, with special WP handling."""
    try:
        site_host = urlparse(site_url).netloc
        cand = urlparse(candidate_url)
        cand_host = normalize_host(cand.netloc)
        cand_path = (cand.path or "").lower()
    except Exception:
        return False

    if not cand_host:
        return False

    if cand_host in {normalize_host(x) for x in BAD_PUBLISHER_NETLOCS}:
        return False

    if is_hard_bad_url(candidate_url):
        return False

    # First-party: allow
    if same_site_family(site_host, cand_host):
        return True

    # Known CDNs: allow, with special WP rule
    if cand_host in {normalize_host(x) for x in ALLOWED_THIRD_PARTY_CDNS}:
        if cand_host.endswith("wp.com"):
            # Allow i0.wp.com only if firm base domain appears in the path
            site_base = base_domain_simple(site_host)
            return site_base in cand_path
        return True

    return False

def normalize_site_url(website: str) -> str:
    website = (website or "").strip()
    if not website:
        return ""
    if not website.startswith("http"):
        website = "https://" + website
    return website

def safe_request(url: str):
    try:
        return requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
    except Exception:
        return None

def get_content_type(resp) -> str:
    if not resp:
        return ""
    return (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()

def url_looks_svg(url: str) -> bool:
    return (url or "").lower().split("?")[0].endswith(".svg")

def score_candidate(u: str) -> tuple:
    ul = (u or "").lower()
    regulator_penalty = 3 if is_regulator_badge(ul) else 0
    press_penalty = 2 if is_press_badge(ul) else 0
    ext_rank = 0 if ul.endswith(".svg") else 1 if ul.endswith(".png") else 2
    brand_bonus = 0 if any(t in ul for t in ["logo", "brand", "header", "nav"]) else 1
    return (regulator_penalty, press_penalty, ext_rank, brand_bonus)

# ---------------------------
# HTML extraction
# ---------------------------

HEADER_SELECTORS = [
    "header", "nav",
    ".site-header", ".header", "#header",
    ".navbar", ".navbar-brand", ".topbar", ".top-bar",
    ".branding", ".brand", ".logo", "#logo"
]

IMG_HINT_SELECTORS = ["logo", "brand"]

def extract_candidates_from_soup(soup: BeautifulSoup, site_url: str) -> list[str]:
    candidates: list[str] = []

    def harvest(container):
        if not container:
            return
        for img in container.find_all("img"):
            src = img.get("src") or ""
            if not src:
                continue

            full = urljoin(site_url, src)

            if is_hard_bad_url(full):
                continue
            if not allow_candidate_for_site(full, site_url):
                continue

            # Skip very small images (usually icons/badges)
            try:
                w = int(img.get("width") or 0)
                h = int(img.get("height") or 0)
                if (w and w < 64) or (h and h < 64):
                    continue
            except Exception:
                pass

            alt_lower = (img.get("alt") or "").lower()
            class_lower = " ".join(img.get("class") or []).lower()
            src_lower = src.lower()

            if (
                any(h in src_lower for h in IMG_HINT_SELECTORS)
                or any(h in alt_lower for h in IMG_HINT_SELECTORS)
                or any(h in class_lower for h in IMG_HINT_SELECTORS)
            ):
                candidates.append(full)

    # 1) Header-first search
    for sel in HEADER_SELECTORS:
        node = soup.select_one(sel)
        harvest(node)

    # 2) If none, broaden to whole page (still filtered)
    if not candidates:
        harvest(soup)

    # 3) <link rel=icon> / apple-touch icons (filtered fallback)
    if not candidates:
        for link in soup.find_all("link"):
            rel = " ".join(link.get("rel") or []).lower()
            if any(k in rel for k in ["icon", "shortcut icon", "apple-touch-icon", "mask-icon"]):
                href = link.get("href")
                if not href:
                    continue
                full = urljoin(site_url, href)
                if is_hard_bad_url(full):
                    continue
                if not allow_candidate_for_site(full, site_url):
                    continue
                candidates.append(full)

    candidates = list(dict.fromkeys(candidates))
    candidates.sort(key=score_candidate)
    return candidates

def find_logo_candidates(site_url: str) -> list[str]:
    site_url = normalize_site_url(site_url)
    if not site_url:
        return []

    # Homepage parse
    resp = safe_request(site_url)
    candidates: list[str] = []
    if resp and resp.status_code == 200 and (resp.text or "").strip():
        soup = BeautifulSoup(resp.text, "html.parser")
        candidates = extract_candidates_from_soup(soup, site_url)

    # Favicon as LAST RESORT (first-party only)
    parsed = urlparse(site_url)
    favicon_url = f"{parsed.scheme}://{parsed.netloc}/favicon.ico"
    fav: list[str] = []
    if allow_candidate_for_site(favicon_url, site_url) and not is_hard_bad_url(favicon_url):
        fav_resp = safe_request(favicon_url)
        if fav_resp and fav_resp.status_code == 200 and get_content_type(fav_resp).startswith("image/"):
            fav = [favicon_url]

    # Candidates first, favicon last
    return list(dict.fromkeys(candidates + fav))

# ---------------------------
# SVG rasterization
# ---------------------------

def rasterize_svg_to_png_bytes(svg_bytes: bytes, output_width: int = 512) -> bytes | None:
    # Try CairoSVG first
    try:
        import cairosvg  # type: ignore
        return cairosvg.svg2png(bytestring=svg_bytes, output_width=output_width)
    except Exception:
        pass

    # Fallback: rsvg-convert
    try:
        with tempfile.NamedTemporaryFile(suffix=".svg", delete=False) as f_in:
            f_in.write(svg_bytes)
            in_path = f_in.name
        out_path = in_path.replace(".svg", ".png")

        cmd = ["rsvg-convert", "-w", str(output_width), "-o", out_path, in_path]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        with open(out_path, "rb") as f_out:
            png_bytes = f_out.read()

        try:
            os.remove(in_path)
            os.remove(out_path)
        except Exception:
            pass

        return png_bytes
    except Exception:
        return None

def load_image(image_bytes: bytes) -> Image.Image:
    img = Image.open(BytesIO(image_bytes))
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA")
    return img

def save_webp(img: Image.Image, output_path: str):
    img.save(output_path, format="WEBP", quality=90, method=6)

# ---------------------------
# Reporting / progress
# ---------------------------

def write_report_card(report_path: str, status_list: list[str]):
    total = len(status_list)
    counts = Counter(status_list)

    preferred_order = [
        "success",
        "svg_rasterized_success",
        "bad_logo_blacklisted",
        "skipped_exists",
        "no_logo_found",
        "non_image_response",
        "download_failed",
        "svg_rasterized_failed",
        "bad_row_missing_crd",
        "error",
    ]

    rows = []
    for status in preferred_order:
        if status in counts:
            c = counts[status]
            rows.append([status, c, round((c / total) * 100, 2) if total else 0.0])

    for status, c in sorted(counts.items()):
        if status not in preferred_order:
            rows.append([status, c, round((c / total) * 100, 2) if total else 0.0])

    with open(report_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["status", "count", "pct_of_total"])
        w.writerows(rows)

def fmt_hhmmss(seconds: float) -> str:
    seconds = max(0, int(seconds))
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h:d}h {m:02d}m {s:02d}s"
    return f"{m:d}m {s:02d}s"

def print_progress(i_done: int, total: int, start_ts: float, last_status: str, cadence: int):
    elapsed = time.time() - start_ts
    rate = (i_done / elapsed) if elapsed > 0 else 0.0
    remaining = total - i_done
    eta = (remaining / rate) if rate > 0 else float("inf")
    pct = (i_done / total) * 100 if total else 0.0
    rate_min = rate * 60.0
    print(
        f"[{i_done}/{total} | {pct:.1f}%] "
        f"elapsed {fmt_hhmmss(elapsed)} | "
        f"rate {rate_min:.1f} firms/min | "
        f"ETA {fmt_hhmmss(eta) if eta != float('inf') else 'n/a'} | "
        f"last={last_status} | every={cadence}"
    )

# ---------------------------
# Main
# ---------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True)
    parser.add_argument("--name-col", default="primary_business_name")
    parser.add_argument("--url-col", default="website")
    parser.add_argument("--id-col", default="crd")
    parser.add_argument("--out-dir", default="logos")
    parser.add_argument("--manifest", default="logo_manifest.csv")
    parser.add_argument("--report", default="logo_report_card.csv")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--progress-every", type=int, default=100)
    parser.add_argument("--svg-width", type=int, default=512)
    args = parser.parse_args()

    df = pd.read_csv(args.csv, encoding="utf-8-sig")
    if args.limit:
        df = df.head(args.limit)

    base_dir = os.path.dirname(os.path.abspath(args.csv))
    output_dir = os.path.join(base_dir, args.out_dir)
    os.makedirs(output_dir, exist_ok=True)

    manifest_path = os.path.join(output_dir, args.manifest)
    report_path = os.path.join(output_dir, args.report)

    total = len(df)
    start_ts = time.time()

    print(f"Starting logo run: {total} firms")
    print(f"Output folder: {output_dir}")

    manifest_rows = []
    statuses_for_report = []

    records = df.to_dict("records")

    for idx, row in enumerate(records, start=1):
        crd = str(row.get(args.id_col, "")).strip()
        name = str(row.get(args.name_col, "")).strip()
        website = str(row.get(args.url_col, "")).strip()

        if not crd or crd.lower() == "nan":
            status = "bad_row_missing_crd"
            manifest_rows.append([crd, name, website, status, "", ""])
            statuses_for_report.append(status)
            if args.progress_every and (idx % args.progress_every == 0):
                print_progress(idx, total, start_ts, status, args.progress_every)
            continue

        output_path = os.path.join(output_dir, f"{crd}.webp")

        if os.path.exists(output_path):
            status = "skipped_exists"
            manifest_rows.append([crd, name, website, status, "", ""])
            statuses_for_report.append(status)
            if args.progress_every and (idx % args.progress_every == 0):
                print_progress(idx, total, start_ts, status, args.progress_every)
            continue

        site_url = normalize_site_url(website)
        candidates = find_logo_candidates(site_url)

        if not candidates:
            status = "no_logo_found"
            manifest_rows.append([crd, name, website, status, "", ""])
            statuses_for_report.append(status)
            if args.progress_every and (idx % args.progress_every == 0):
                print_progress(idx, total, start_ts, status, args.progress_every)
            continue

        final_status = None
        final_source = ""
        final_error = ""

        for cand_url in candidates:
            final_source = cand_url

            if is_hard_bad_url(cand_url):
                final_status = "error"
                final_error = "blocked_by_hard_bad_filter"
                continue
            if not allow_candidate_for_site(cand_url, site_url):
                final_status = "error"
                final_error = "blocked_by_domain_gate"
                continue

            resp = safe_request(cand_url)
            if not resp:
                final_status = "download_failed"
                final_error = "request_failed"
                continue

            if resp.status_code != 200 or not resp.content:
                final_status = "download_failed"
                final_error = f"http_{resp.status_code}"
                continue

            ctype = get_content_type(resp)

            if not ctype.startswith("image/") and not url_looks_svg(cand_url):
                final_status = "non_image_response"
                final_error = f"content_type={ctype or 'unknown'}"
                continue

            try:
                if url_looks_svg(cand_url) or ctype == "image/svg+xml":
                    png_bytes = rasterize_svg_to_png_bytes(resp.content, output_width=args.svg_width)
                    if not png_bytes:
                        final_status = "svg_rasterized_failed"
                        final_error = "svg_rasterize_failed"
                        continue

                    img = load_image(png_bytes)
                    bad, label = is_blacklisted_image(img)
                    if bad:
                        final_status = "bad_logo_blacklisted"
                        final_error = f"image_blacklisted={label}"
                        continue

                    save_webp(img, output_path)
                    final_status = "svg_rasterized_success"
                    final_error = ""
                    break

                img = load_image(resp.content)
                bad, label = is_blacklisted_image(img)
                if bad:
                    final_status = "bad_logo_blacklisted"
                    final_error = f"image_blacklisted={label}"
                    continue

                save_webp(img, output_path)
                final_status = "success"
                final_error = ""
                break

            except UnidentifiedImageError:
                final_status = "error"
                final_error = f"unidentified_image content_type={ctype or 'unknown'}"
                continue
            except Exception as e:
                final_status = "error"
                final_error = str(e)[:300]
                continue

        if not final_status:
            final_status = "error"
            final_error = "unknown_failure"

        manifest_rows.append([crd, name, website, final_status, final_source, final_error])
        statuses_for_report.append(final_status)

        if args.progress_every and (idx % args.progress_every == 0):
            print_progress(idx, total, start_ts, final_status, args.progress_every)

    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["crd", "firm_name", "website", "status", "logo_source", "error"])
        w.writerows(manifest_rows)

    write_report_card(report_path, statuses_for_report)

    elapsed = time.time() - start_ts
    print("\nDone.")
    print(f"Elapsed:  {fmt_hhmmss(elapsed)}")
    print(f"Logos:    {output_dir}")
    print(f"Manifest: {manifest_path}")
    print(f"Report:   {report_path}")

if __name__ == "__main__":
    main()
