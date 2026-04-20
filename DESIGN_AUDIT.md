# Visor Index — Design Consistency Audit
**Date:** 2026-04-19
**Scope:** 22 pages (public + auth + dashboard) at 3 breakpoints (mobile 375px, tablet 768px, desktop 1440px)
**Method:** Source code extraction of CSS tokens + visual spot-check at each breakpoint
**Auditor:** Design consultant review against canonical `DESIGN.md` + `tokens.css`

---

## Executive Summary

**Overall design-system health: 7/10.** The codebase has a strong design-token foundation (navy/green palette, serif+sans+mono trio, 0-radius flat aesthetic) and ~85% of pages conform. But there are ~30 files with measurable drift that will be visible to any user moving between sections.

**The top five issues, in order of user-visible impact:**

1. **Hero section padding is inconsistent across pages** — ranges from 44px (Contact) to 120px (How It Works) on top. Users jumping between pages feel a "jump."
2. **Three non-canonical greens are in production** — `#38d98a`, `#1f8f55`, and `#0a1c2e` appear in 12 files, mostly on CTAs and hover states.
3. **Border-radius rhythm is broken in pockets** — the flat (0-radius) aesthetic is violated by the auth card (10px), compare/search cards (10px), negotiate cards (10px), and several Tailwind `rounded-md`/`rounded-lg` buttons.
4. **Two different styling systems coexist** — reset/update password pages use Tailwind + slate colors; everything else uses CSS-in-JS + brand tokens. Password flow visibly differs from Login/Signup.
5. **Container max-widths fragment across pages** — 560/680/800/900/960/1040/1100/1200px all in use. Pages don't "line up" against a consistent baseline.

**Total work estimate to address all findings:** 2-3 days of focused design cleanup, 80% of which can be done by search-and-replace on color and radius values.

---

## Part 1 — Canonical Design Tokens (the source of truth)

From `src/styles/tokens.css` and `DESIGN.md`:

### Colors
| Token | Hex | Use |
|---|---|---|
| `--navy` | `#0A1C2A` | Hero backgrounds, dark sections |
| `--navy-2` | `#0F2538` | Cards on dark backgrounds |
| `--green` | `#1A7A4A` | Primary CTAs, buttons |
| `--green-2` | `#22995E` | CTA hover state |
| `--green-3` | `#2DBD74` | Accents on navy, eyebrows, score fills |
| `--green-pale` | `#E6F4ED` | Selected/active backgrounds |
| `--bg` | `#F6F8F7` | Light section backgrounds |
| `--ink` | `#0C1810` | Primary body text |
| `--ink-2` | `#2E4438` | Secondary text |
| `--ink-3` | `#5A7568` | Muted text, labels |
| `--rule` | `#CAD8D0` | Borders, dividers |

### Typography
- **Serif:** Cormorant Garamond (h1/h2, large numbers, scores)
- **Sans:** Inter (body, buttons, labels)
- **Mono:** DM Mono (data values, eyebrows, metadata)

### Spec constants
- **Button border-radius:** `0` (mandatory — flat)
- **Form input border-radius:** `0`
- **Card border-radius:** `0` (or `10px` for data cards — less prescriptive)
- **Hero backgrounds:** navy (`#0A1C2A`) with optional radial glow
- **Eyebrow text:** 10px DM Mono, `--green-3` on dark, `--ink-3` on light
- **Canonical container widths:** 1400 / 1200 / 800 / 560 / 480

---

## Part 2 — Cross-Page Diff Matrix

### Hero section comparison

| Page | Top padding | Bottom padding | H1 scale | Eyebrow color | Alignment |
|---|---|---|---|---|---|
| Home | 72px | 80px | clamp(28, 7vw, 42) | `#2DBD74` | centered |
| Pricing | **112px** | 0 | **clamp(36, 4.5vw, 56)** | `#2DBD74` | **left** |
| About | **44px** | 32px | clamp(28, 7vw, 42) | `#2DBD74` | centered |
| How It Works | **120px** | **80px** | **clamp(32, 4.5vw, 52)** | `rgba(255,255,255,.35)` | centered |
| Contact | **44px** | **36px** | clamp(32, 4vw, 42) | `#2DBD74` | **left** |
| Deep Dive | **80px** | **64px** | **clamp(36, 5vw, 56)** | `#2DBD74` | **left** |
| Match | 44px | 52px | clamp(28, 7vw, 42) | `#2DBD74` | centered |
| Directory | 44px | 52px | clamp(28, 7vw, 42) | `#2DBD74` | centered |
| Negotiate | 44px | 52px | clamp(28, 7vw, 42) | `#2DBD74` | centered |

**Drift observations:**
- **Top padding range: 44–120px** (2.7× spread). No rhyme to this — visually jarring when navigating between pages.
- **H1 scale range: clamp(28,7vw,42) through clamp(36,5vw,56).** Three different "sizes of hero" exist: compact (Home/About/Match/Directory/Negotiate), medium (Contact), and large (Pricing/How It Works/Deep Dive).
- **Eyebrow color:** How It Works uses `rgba(255,255,255,.35)` (white-muted) instead of `--green-3` (`#2DBD74`). Sole outlier.
- **Alignment mix:** Pricing, Contact, Deep Dive are left-aligned. Everything else is centered. Neither is wrong, but the mix feels ad-hoc.

### Container max-width comparison

| Page | Main container width |
|---|---|
| Home | 800px |
| Pricing | 1200px |
| About | 800px |
| How It Works | **840px** |
| Contact | **900px** |
| Deep Dive | 1200px |
| Match | **560px** |
| Directory | **1100px** |
| Negotiate | 1200px |
| Compare | **960px** |
| Firm profile | **680px** (sidebar) + main |
| Choose Plan | **1040px** |
| Auth pages | 400px |

**Drift observations:**
- 10 distinct widths in use: 400, 560, 680, 800, 840, 900, 960, 1040, 1100, 1200.
- DESIGN.md prescribes only 5 widths: 1400 / 1200 / 800 / 560 / 480.
- `/how-it-works` uses 840, `/contact` uses 900, `/compare` uses 960, `/choose-plan` uses 1040, `/directory` uses 1100 — all *between* canonical widths for no structural reason.

### Card border-radius comparison

| Location | Radius | Conforms to `0` spec? |
|---|---|---|
| Home, Pricing, About, How It Works, Deep Dive cards | `0` | ✓ |
| Auth card (LoginForm, SignupForm) | **`10px`** | ✗ |
| Negotiate cards | **`10px`** | ✗ |
| Compare firm cards | **`10px`** | ✗ |
| Search result cards | **`10px`** | ✗ |
| Dashboard cards (Overview, Saved Firms) | `0` | ✓ |
| Error/info callouts (update-password, verify) | `0` mostly, but `rounded-md` Tailwind in 3 places | partial |
| Billing, Alerts panels | `0` | ✓ |
| **MobileNav "Get Access" CTA** | **`rounded-md` (6px)** | ✗ |
| **Header "Get Access" CTA** | `0` | ✓ |

**Drift observations:**
- **The same CTA ("Get Access") has different radius in Header vs MobileNav.** Mobile users see a rounded button; desktop users see flat. Direct contradiction.
- Auth card at 10px feels "warmer" but breaks the editorial flat aesthetic used everywhere else.
- 4 out of ~12 user-facing page types have 10px card radius despite spec saying `0`.

### Button styles comparison

| Location | Radius | Padding | Font size | Text transform |
|---|---|---|---|---|
| Home primary CTA | 0 | 15px 36px | 14px | none |
| Pricing primary CTA | 0 | 14px 24px | 12px | uppercase |
| About primary CTA | 0 | 8px 32px | 12px | uppercase |
| How It Works CTA | 0 | 14px 32px | 12px | uppercase |
| Contact primary CTA | 0 | 12px 24px | 11px | uppercase |
| Deep Dive CTA | 0 | 14px | 13px | uppercase |
| Match quiz "Continue" | 0 | 10px 28px | 12px | none |
| Directory primary CTA | 0 | 12px 28px | 13px | uppercase |
| Auth "Sign In" | 0 | 46px height | 12px | uppercase |
| MobileNav "Get Access" | **6px** | 12px 16px | 11px | uppercase |

**Drift observations:**
- **Button padding has 8 distinct variations** (14×32, 15×36, 14×24, 10×28, 8×32, 12×24, 12×28, 46h). No pattern.
- Home button is the only non-uppercase primary CTA.
- Home button uses 14px font size; everything else is 11–13px.
- MobileNav is the only CTA with a border-radius.

### Typography drift

| Surface | Label | Canonical | Actual (highest drift) |
|---|---|---|---|
| Password reset page | `text-slate-900` / `text-slate-500` | `#0C1810` / `#5A7568` | **Wrong palette entirely** |
| Update password page | `text-red-600` | `#EF4444` | **Wrong palette** (tailwind slate+red vs brand ink+error) |
| Firm not found page | `#D24A4A` error | `#EF4444` | Off-brand error red |
| Dashboard error boundary | `#D24A4A` | `#EF4444` | Same off-brand red |

### Styling methodology

**85% of the codebase uses CSS-in-JS** via `<style dangerouslySetInnerHTML>` with brand tokens.

**~5% uses Tailwind with slate/red/gray utility colors:**
- `/auth/reset-password/page.tsx` — `text-slate-900`, `text-slate-500`, `bg-green-600`
- `/auth/update-password/page.tsx` — mixed; partially fixed but still uses `text-red-600` for errors
- `/app/error.tsx` — `bg-green-600 hover:bg-green-700`
- `/app/layout.tsx` body — `bg-bg-primary text-text-primary` (these are Tailwind tokens but route to slate, not brand ink)

**Result:** Password reset/update pages look foreign next to Login/Signup. Users who request a password reset visibly leave the "Visor design system" and enter a Tailwind-default screen.

---

## Part 3 — Responsive Behavior (Mobile/Tablet Observations)

From screenshots at each breakpoint:

### What works
- **Header collapses cleanly** to hamburger at 1024px breakpoint across all pages.
- **Hero copy remains readable** at 375px — Cormorant Garamond scales gracefully with `clamp()`.
- **Pricing tiers stack vertically** at tablet and mobile without overflow.
- **Search filter sidebar** collapses to a top bar on mobile.
- **Firm profile gate** renders consistently at all 3 widths.

### What breaks
- **Home hero fills ~90% of mobile viewport** — users see the headline but no product screenshot without scrolling. Consider compacting or moving the score card above the fold.
- **"Firms We Review" logo marquee** has visibly broken logos on mobile (some render as gray boxes because the min-dimension filter isn't strict enough at small sizes).
- **Match quiz** max-width of 560px means it already IS narrow on desktop — on tablet (768px) there's an unnatural gap of whitespace on either side of the form card.
- **Pricing feature comparison table** becomes a horizontal scroll on mobile. Readable but cramped. Consider converting to stacked cards below a breakpoint.
- **Compare page 4-column table** overflows horizontally on mobile. The UX expectation is "compare side-by-side" but on a phone only one column is visible at a time.

### Dashboard responsive
- Dashboard sidebar (240px fixed) disappears at the `lg` breakpoint and becomes a top bar — works.
- Dashboard panels (Saved Firms, Alerts, Matches) render well at 768px but the multi-column grids (row = 28px 1fr 36px 28px 90px auto) can clip on 375px mobile. Minor but visible.

---

## Part 4 — Page-by-Page Scorecard

| Page | Hero | Container | Cards | Buttons | Palette | Overall |
|---|---|---|---|---|---|---|
| Home | ✓ | ✓ | ✓ | **14px font** | #0a1c2e variant, #1f8f55 | 7/10 |
| Pricing | **112px top** | ✓ | ✓ | ✓ | #38d98a hover | 8/10 |
| About | ✓ | ✓ | ✓ | ✓ | ✓ | 9/10 |
| How It Works | **120px top** | **840px** | ✓ | ✓ | **white eyebrow** | 7/10 |
| Contact | **44px, left-align** | **900px** | ✓ | ✓ | ✓ | 7/10 |
| Deep Dive | **80px, left** | ✓ | ✓ | ✓ | ✓ | 8/10 |
| Match | ✓ | **560px** | N/A | ✓ | ✓ | 9/10 |
| Directory | ✓ | **1100px** | ✓ | ✓ | ✓ | 8/10 |
| Negotiate | ✓ | ✓ | **10px radius** | ✓ | ✓ | 8/10 |
| Compare | ✓ | **960px** | **10px radius** | ✓ | ✓ | 7/10 |
| Firm profile | ✓ | **680px** | ✓ | ✓ | ✓ | 8/10 |
| Search | ✓ | 1200px | **10px radius** | ✓ | ✓ | 8/10 |
| Auth Login | ✓ | ✓ | **10px radius** | ✓ | ✓ | 8/10 |
| Auth Signup | ✓ | ✓ | **10px radius** | ✓ | ✓ | 8/10 |
| Auth Verify | ✓ | ✓ | ✓ | ✓ | **#D24A4A error** | 8/10 |
| Auth Reset Password | — | ✓ | N/A | **Tailwind slate** | **off-system** | **4/10** |
| Auth Update Password | — | ✓ | N/A | **Tailwind slate** | **mixed** | **5/10** |
| Onboarding | ✓ | ✓ | ✓ | ✓ | ✓ | 9/10 |
| Choose Plan | — | **1040px** | ✓ | ✓ | ✓ | 8/10 |
| Dashboard Overview | — | ✓ | ✓ | ✓ | **#f7faf8 hover** | 8/10 |
| Dashboard Saved Firms | — | ✓ | ✓ | ✓ | **#f7faf8 hover** | 8/10 |
| Dashboard Alerts | — | ✓ | ✓ | ✓ | **#f7faf8 hover** | 8/10 |
| Dashboard Billing | — | ✓ | ✓ | ✓ | **#38d98a hover** | 7/10 |

---

## Part 5 — Improvement Proposal

### Phase 1 — Color cleanup (2 hours, mechanical)

Global find-and-replace:

| Find | Replace | Files affected |
|---|---|---|
| `#38d98a` | `var(--green-2)` / `#22995E` | 6 |
| `#1f8f55` | `var(--green-2)` / `#22995E` | 3 |
| `#0a1c2e` | `var(--navy)` / `#0A1C2A` | 3 |
| `#f7faf8` | `var(--bg)` / `#F6F8F7` | 5 |
| `#edf0ef` | `var(--green-pale)` / `#E6F4ED` | 2 |
| `#f0f2f1` | `var(--bg)` / `#F6F8F7` | 2 |
| `#D24A4A` | `#EF4444` | 2 |
| `text-slate-900` | `text-ink` (or migrate to CSS-in-JS) | 2 |
| `text-slate-500` | `text-ink-3` | 2 |
| `text-red-600` | `text-error` | 1 |

**Deliverable:** Zero off-brand hex colors across `/src/`.

### Phase 2 — Hero standardization (4 hours)

Create a shared `HeroSection` component that accepts `{ eyebrow, title, subtitle, align }` and encapsulates the canonical hero:

```css
.hero {
  background: #0A1C2A;
  padding: 72px 48px 80px;  /* desktop */
  padding: 56px 24px 64px;  /* tablet */
  padding: 44px 20px 52px;  /* mobile */
}
.hero-inner {
  max-width: 800px;  /* narrow prose */
  margin: 0 auto;    /* centered */
}
.hero-inner.wide {
  max-width: 1200px;  /* use only for pricing, deep-dive */
}
.hero h1 {
  font-family: var(--font-serif);
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 300;
  color: #fff;
  line-height: 1.08;
}
```

Migrate all 9 pages to use it. Home stays custom (it's the marketing front door and needs bespoke treatment — that's fine).

**Deliverable:** One hero component, three padding scales (mobile/tablet/desktop), two width variants (narrow/wide). Ends the 44-vs-120px jump.

### Phase 3 — Button standardization (3 hours)

Fix `/src/components/ui/Button.tsx` to become the canonical button. Enforce:
- `border-radius: 0`
- Three sizes: sm (padding 8×20, font 11px), md (12×28, 12px), lg (14×32, 13px)
- Two variants: primary (green bg) + secondary (outline)
- All lowercase unless caller passes `uppercase` prop
- **One exception:** Home hero uses `lg` + 14px font (largest primary CTA on site); keep as-is since it's the most important action

Then audit all `<button>` and `<Link className="btn-like">` patterns and migrate to `<Button>`:
- Header "Get Access" — already CSS, migrate to `<Button size="sm">`
- MobileNav "Get Access" — **currently has `rounded-md` — fix to match Header**
- ~30 instances across pages with inline button styling

**Deliverable:** One Button API. Zero rounded button corners across the site. Consistent spacing on CTAs.

### Phase 4 — Card radius standardization (2 hours)

Decision required (pick one):

**Option A: 0-radius everywhere** (matches current spec exactly)
- Change auth card, negotiate cards, compare/search cards, firm profile sidebar to `border-radius: 0`
- Pros: Pure editorial aesthetic, consistent
- Cons: Auth card will feel stark

**Option B: 10px for interactive cards, 0 for page sections**
- Formalize: "cards you can click/hover" get 10px; "structural sections" get 0
- Document in DESIGN.md
- Pros: Softer feel for interactive surfaces
- Cons: Judgment calls required

I recommend **Option A** to match the editorial/institutional feel of the brand. The warmth of 10px contradicts the "Bloomberg terminal" aesthetic the rest of the site projects.

### Phase 5 — Container width cleanup (1 hour)

Migrate the six non-canonical widths to the five canonical ones:

| Page | Current | Proposed |
|---|---|---|
| How It Works | 840 | **800** (narrow prose) |
| Contact | 900 | **800** (narrow prose) |
| Compare | 960 | **1200** (data-heavy) |
| Choose Plan | 1040 | **1200** |
| Directory | 1100 | **1200** |
| Firm profile | 680 | **800** (for the sidebar column only) |

**Deliverable:** Five widths in use. Pages line up against each other.

### Phase 6 — Migrate password reset/update off Tailwind (2 hours)

Port `/auth/reset-password/page.tsx` and `/auth/update-password/page.tsx` to the same `AuthLayout` component used by Login/Signup. Kill all `text-slate-*`, `bg-green-600`, `text-red-600` usage.

**Deliverable:** All auth flows share the same visual system. Users never "leave Visor" during password reset.

### Phase 7 — Mobile polish (3 hours)

- Tighten home hero padding on mobile — H1 currently eats 90% of the fold
- Fix the "Firms We Review" logo marquee — add a stricter min-width filter so broken/tiny logos don't render
- Convert pricing feature table on mobile to stacked cards at `max-width: 640px`
- Compare page: add a "pick primary firm" mobile state so users see one firm column at a time with a selector to swap

---

## Part 6 — Design System Documentation Updates

As part of this work, update `DESIGN.md` with:

1. **Canonical container widths list** (explicitly enumerate the 5 allowed values)
2. **Hero padding spec** (desktop/tablet/mobile breakpoints)
3. **Button variants** (sm/md/lg, primary/secondary) with example markup
4. **Card radius decision** (once Phase 4 option is picked)
5. **"When to use Tailwind vs CSS-in-JS"** rule — currently the boundary is accidental, not intentional

Add a new `DESIGN_TOKENS_USAGE.md` with:
- The 10 canonical hex values and where each is used
- Forbidden colors (list the drift hex values so future devs don't reintroduce them)
- A linting rule or pre-commit hook idea to prevent new off-brand colors

---

## Summary Table

| Phase | Effort | Impact | Priority |
|---|---|---|---|
| 1 — Color cleanup | 2h | High | **Do first** |
| 2 — Hero standardization | 4h | High | **Do first** |
| 3 — Button standardization | 3h | High | Do second |
| 4 — Card radius decision | 2h | Medium | Do third |
| 5 — Container widths | 1h | Medium | Do third |
| 6 — Password flow migration | 2h | Medium | Do fourth |
| 7 — Mobile polish | 3h | Medium | Do fourth |
| **Total** | **~17h / 2-3 days** | | |

After these phases, every page should score 9+/10 on the scorecard. The design system will be genuinely enforced rather than aspirational.

---

## Screenshots Referenced

Available in the preview session but not embedded here:
- Desktop (1440×900): home, pricing, about, how-it-works, search, firm gated, match, negotiate, compare, directory, auth login, auth signup
- Tablet (768×1024): home, pricing, auth login
- Mobile (375×812): home, auth login

Run `npm run dev` and visit each URL at the three breakpoints to visually confirm findings.
