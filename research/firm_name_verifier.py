import re
import json
import time
import random
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple

import pandas as pd
import requests
import tldextract
from bs4 import BeautifulSoup
from rapidfuzz import fuzz
import extruct
from w3lib.html import get_base_url


# ----------------------------
# 1) Normalization + matching
# ----------------------------

LEGAL_SUFFIXES = [
    "llc","l.l.c","inc","incorporated","corp","corporation","co","company","ltd","limited",
    "lp","l.p","llp","l.l.p","pllc","p.l.l.c","pc","p.c","plc","p.l.c"
]

COMMON_NORMALIZATIONS = [
    (r"\b&\b", "and"),
    (r"\badvisers\b", "advisors"),
    (r"\bmgmt\b", "management"),
    (r"\bwm\b", "wealth management"),
]

GENERIC_WORDS = set([
    # optional, used only for a secondary comparison if needed
    "the","of","and","for","a","an","group","partners","capital","wealth","management","advisors","advisor"
])

def normalize_name(s: str, strip_legal: bool = True) -> str:
    if not isinstance(s, str):
        return ""
    s = s.strip().lower()
    for pattern, repl in COMMON_NORMALIZATIONS:
        s = re.sub(pattern, repl, s)
    s = re.sub(r"[^\w\s]", " ", s)         # remove punctuation
    s = re.sub(r"\s+", " ", s).strip()

    if strip_legal:
        parts = [p for p in s.split() if p not in LEGAL_SUFFIXES]
        s = " ".join(parts)

    return s

def name_similarity(a: str, b: str) -> int:
    """0-100 fuzz score using token_sort_ratio for robustness."""
    if not a or not b:
        return 0
    return int(fuzz.token_sort_ratio(a, b))

def domain_from_url(url: str) -> str:
    try:
        ext = tldextract.extract(url)
        if ext.domain and ext.suffix:
            return f"{ext.domain}.{ext.suffix}"
    except Exception:
        pass
    return ""


# ----------------------------
# 2) Web fetch + extraction
# ----------------------------

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; FARNameVerifier/1.0; +https://example.com/bot)"
}

def fetch_html(url: str, timeout: int = 20) -> Tuple[Optional[str], Optional[str], Optional[int]]:
    try:
        r = requests.get(url, headers=DEFAULT_HEADERS, timeout=timeout, allow_redirects=True)
        ctype = (r.headers.get("Content-Type") or "").lower()
        if r.status_code >= 400:
            return None, r.url, r.status_code
        if "text/html" not in ctype and "application/xhtml+xml" not in ctype:
            return None, r.url, r.status_code
        return r.text, r.url, r.status_code
    except Exception:
        return None, None, None

def extract_candidates(html: str, final_url: str) -> Dict[str, List[str]]:
    soup = BeautifulSoup(html, "lxml")

    candidates: Dict[str, List[str]] = {
        "title": [],
        "og_site_name": [],
        "og_title": [],
        "h1": [],
        "h2": [],
        "logo_alt": [],
        "footer_text_snippet": [],
        "jsonld_org_name": [],
        "jsonld_org_legalName": [],
    }

    # title
    if soup.title and soup.title.get_text(strip=True):
        candidates["title"].append(soup.title.get_text(" ", strip=True))

    # og tags
    for prop, key in [("og:site_name", "og_site_name"), ("og:title", "og_title")]:
        tag = soup.find("meta", attrs={"property": prop})
        if tag and tag.get("content"):
            candidates[key].append(tag["content"].strip())

    # headers
    for h in soup.find_all("h1")[:3]:
        txt = h.get_text(" ", strip=True)
        if txt:
            candidates["h1"].append(txt)
    for h in soup.find_all("h2")[:3]:
        txt = h.get_text(" ", strip=True)
        if txt:
            candidates["h2"].append(txt)

    # logo alt (best-effort: img alt near header)
    # you can make this smarter by looking for "logo" in class/id/src.
    for img in soup.find_all("img")[:20]:
        alt = (img.get("alt") or "").strip()
        src = (img.get("src") or "").lower()
        cls = " ".join(img.get("class") or []).lower()
        if alt and ("logo" in src or "logo" in cls or "logo" in alt.lower()):
            candidates["logo_alt"].append(alt)

    # footer snippet
    footer = soup.find("footer")
    if footer:
        txt = footer.get_text(" ", strip=True)
        if txt:
            candidates["footer_text_snippet"].append(txt[:240])

    # JSON-LD org extraction
    try:
        base_url = get_base_url(html, final_url)
        data = extruct.extract(html, base_url=base_url, syntaxes=["json-ld"])
        for item in data.get("json-ld", []) or []:
            # item may be dict or list
            items = item if isinstance(item, list) else [item]
            for it in items:
                if not isinstance(it, dict):
                    continue
                t = it.get("@type")
                # @type could be list or string
                types = set([x.lower() for x in (t if isinstance(t, list) else [t]) if isinstance(x, str)])
                if "organization" in types or "financialservice" in types or "localbusiness" in types:
                    if isinstance(it.get("name"), str):
                        candidates["jsonld_org_name"].append(it["name"].strip())
                    if isinstance(it.get("legalName"), str):
                        candidates["jsonld_org_legalName"].append(it["legalName"].strip())
    except Exception:
        pass

    # de-dup & clean empties
    for k, vals in candidates.items():
        cleaned = []
        seen = set()
        for v in vals:
            v = re.sub(r"\s+", " ", v).strip()
            if len(v) < 2:
                continue
            if v.lower() in seen:
                continue
            seen.add(v.lower())
            cleaned.append(v)
        candidates[k] = cleaned

    return candidates


# ----------------------------
# 3) Scoring + classification
# ----------------------------

@dataclass
class VerificationResult:
    crd: Optional[str]
    website_input: str
    website_final: Optional[str]
    http_status: Optional[int]
    display_name: str
    adv_official_name: str
    display_vs_adv_similarity: int

    best_brand_candidate: Optional[str]
    best_brand_source: Optional[str]
    brand_match_to_display: int
    brand_match_to_adv: int

    best_legal_candidate: Optional[str]
    legal_match_to_adv: int

    score: int
    status: str  # Verified / Likely / Needs Review / Conflict
    evidence_json: str

def score_result(display_name: str,
                 adv_official_name: str,
                 candidates: Dict[str, List[str]]) -> Tuple[int, str, str, int, int, str, int, int, str]:
    display_norm = normalize_name(display_name, strip_legal=False)
    adv_norm = normalize_name(adv_official_name, strip_legal=False)
    display_adv_sim = name_similarity(normalize_name(display_name), normalize_name(adv_official_name))

    # prioritize brand-like fields
    brand_sources = ["og_site_name", "title", "og_title", "h1", "logo_alt", "h2"]
    legal_sources = ["jsonld_org_legalName", "footer_text_snippet", "jsonld_org_name"]

    best_brand = (None, None, 0, 0)  # (candidate, source, match_to_display, match_to_adv)
    for src in brand_sources:
        for cand in candidates.get(src, []):
            cand_norm = normalize_name(cand, strip_legal=False)
            m_disp = name_similarity(cand_norm, display_norm)
            m_adv = name_similarity(cand_norm, adv_norm)
            if m_disp > best_brand[2]:
                best_brand = (cand, src, m_disp, m_adv)

    best_legal = (None, None, 0)  # (candidate, source, match_to_adv)
    for src in legal_sources:
        for cand in candidates.get(src, []):
            cand_norm = normalize_name(cand, strip_legal=False)
            m_adv = name_similarity(cand_norm, adv_norm)
            if m_adv > best_legal[2]:
                best_legal = (cand, src, m_adv)

    # scoring (simple, deterministic)
    score = 0
    # strong website brand match
    if best_brand[2] >= 92:
        score += 50
    elif best_brand[2] >= 85:
        score += 35
    elif best_brand[2] >= 75:
        score += 20

    # structured org name corroboration
    org_names = candidates.get("jsonld_org_name", [])
    org_best = 0
    for o in org_names:
        org_best = max(org_best, name_similarity(normalize_name(o, strip_legal=False), display_norm))
    if org_best >= 90:
        score += 20
    elif org_best >= 80:
        score += 10

    # legal name corroboration (adv)
    if best_legal[2] >= 90:
        score += 15
    elif best_legal[2] >= 80:
        score += 10

    # if display and ADV are already extremely similar (name-only backstop)
    if display_adv_sim >= 92:
        score += 10

    # conflict heuristics: website brand strongly matches ADV but not display
    conflict = False
    if best_brand[3] >= 92 and best_brand[2] <= 70:
        conflict = True
    # another conflict: website brand is strong but points to a different name (not ADV, not display)
    # (we can only partially detect this without a third reference; leave as review via low score)

    if conflict:
        status = "Conflict"
    elif score >= 70:
        status = "Verified"
    elif score >= 50:
        status = "Likely"
    elif score >= 30:
        status = "Needs Review"
    else:
        status = "Needs Review"

    evidence = {
        "candidates": candidates,
        "best_brand": {"candidate": best_brand[0], "source": best_brand[1], "match_to_display": best_brand[2], "match_to_adv": best_brand[3]},
        "best_legal": {"candidate": best_legal[0], "source": best_legal[1], "match_to_adv": best_legal[2]},
        "display_adv_similarity": display_adv_sim,
    }

    return (
        score,
        status,
        best_brand[0] or None,
        best_brand[2],
        best_brand[3],
        best_brand[1] or None,
        best_legal[2],
        display_adv_sim,
        json.dumps(evidence, ensure_ascii=False)
    )


# ----------------------------
# 4) Orchestrator for CSV
# ----------------------------

def ensure_scheme(url: str) -> str:
    url = (url or "").strip()
    if not url:
        return url
    if not re.match(r"^https?://", url, flags=re.I):
        return "https://" + url
    return url

def verify_row(row: pd.Series,
               display_col: str,
               adv_col: str,
               website_col: str,
               crd_col: Optional[str] = None,
               sleep_range: Tuple[float, float] = (0.7, 1.6)) -> VerificationResult:
    display_name = str(row.get(display_col, "") or "").strip()
    adv_name = str(row.get(adv_col, "") or "").strip()
    website = ensure_scheme(str(row.get(website_col, "") or "").strip())
    crd = str(row.get(crd_col, "")).strip() if crd_col else None

    display_adv_sim = name_similarity(normalize_name(display_name), normalize_name(adv_name))

    html, final_url, status = (None, None, None)
    candidates: Dict[str, List[str]] = {k: [] for k in [
        "title","og_site_name","og_title","h1","h2","logo_alt","footer_text_snippet","jsonld_org_name","jsonld_org_legalName"
    ]}

    if website:
        html, final_url, status = fetch_html(website)
        if html and final_url:
            candidates = extract_candidates(html, final_url)

        # politeness
        time.sleep(random.uniform(*sleep_range))

    score, status_label, best_brand, brand_to_display, brand_to_adv, best_brand_source, legal_to_adv, display_adv_sim2, evidence_json = score_result(
        display_name, adv_name, candidates
    )

    # prefer computed display_adv_sim2 to keep consistent with scoring function
    return VerificationResult(
        crd=crd,
        website_input=website,
        website_final=final_url,
        http_status=status,
        display_name=display_name,
        adv_official_name=adv_name,
        display_vs_adv_similarity=display_adv_sim2,
        best_brand_candidate=best_brand,
        best_brand_source=best_brand_source,
        brand_match_to_display=brand_to_display,
        brand_match_to_adv=brand_to_adv,
        best_legal_candidate=candidates.get("jsonld_org_legalName", [None])[0] if candidates.get("jsonld_org_legalName") else None,
        legal_match_to_adv=legal_to_adv,
        score=score,
        status=status_label,
        evidence_json=evidence_json
    )

def run_verification(input_csv: str,
                     output_csv: str,
                     display_col: str = "display_name",
                     adv_col: str = "adv_official_name",
                     website_col: str = "website",
                     crd_col: Optional[str] = "crd",
                     limit: Optional[int] = None) -> None:
    df = pd.read_csv(input_csv)
    if limit:
        df = df.head(limit).copy()

    results: List[VerificationResult] = []
    for i, row in df.iterrows():
        res = verify_row(row, display_col, adv_col, website_col, crd_col=crd_col)
        results.append(res)

        if (i + 1) % 25 == 0:
            print(f"Processed {i+1} rows...")

    out_df = pd.DataFrame([asdict(r) for r in results])
    out_df.to_csv(output_csv, index=False)
    print(f"Done. Wrote: {output_csv}")


if __name__ == "__main__":
    run_verification(
        input_csv="firm_names_22126.csv",  # <-- change to your actual filename
        output_csv="firm_name_verification_results.csv",
        display_col="display_name",
        adv_col="adv_official_name",
        website_col="website",
        crd_col="crd",
        limit=None
    )