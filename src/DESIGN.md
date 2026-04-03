# Visor Index — Design System Reference

Canonical design reference for all Visor Index UI. **Claude Code must consult this file before writing or modifying any UI.** When `tokens.css` conflicts with this document, this document wins.

---

> **Token System Status**
>
> `styles/tokens.css` and `globals.css` are **stale** — they reference Inter, JetBrains Mono, Slate grays, and Tailwind greens. None of these match the actual site.
> Actual pages hardcode the correct values in scoped `<style>` blocks and inline styles.
> `components/ui/Button.tsx` still uses old tokens (wrong green, rounded corners) — do not use it for branded CTAs.
> Until tokens are reconciled, **use the hex values in this document**, not CSS variables from `tokens.css`.

---

## Colors

### Brand palette

| Name | Hex | Usage |
|------|-----|-------|
| `navy` | `#0A1C2A` | Dark section backgrounds, hero, page bg (Search) |
| `navy-2` | `#0F2538` | Cards on dark backgrounds, gate card bg, footer bg |
| `navy-header` | `#172438` | Header background |
| `green` | `#1A7A4A` | Primary action — buttons, links, CTA backgrounds |
| `green-2` | `#22995E` | Hover state for primary green |
| `green-3` | `#2DBD74` | Accent — active tabs, highlights, eyebrow text, score fills |
| `green-pale` | `#E6F4ED` | Selected/active state background (light theme) |
| `bg` | `#F6F8F7` | Light section background |
| `white` | `#FFFFFF` | Card backgrounds |
| `ink` | `#0C1810` | Primary text (light sections) |
| `ink-2` | `#2E4438` | Secondary dark text |
| `ink-3` | `#5A7568` | Muted text, labels, secondary on light |
| `rule` | `#CAD8D0` | Borders, dividers, placeholder tones |
| `red` | `#EF4444` | Error, risk indicators |
| `amber` | `#F59E0B` | Warning indicators |

### Borders on dark backgrounds

| Opacity | Value | Usage |
|---------|-------|-------|
| Subtle | `white/[0.06]` or `rgba(255,255,255,.06)` | Section dividers, nav borders |
| Medium | `white/[0.08]` | Input borders, filter sidebar |
| Strong | `white/[0.10]` | Card borders, firm comparison bar |

### Tinted backgrounds

| Color | Value | Usage |
|-------|-------|-------|
| Green tint | `rgba(45,189,116,.04-.06)` | Hover rows, selected states |
| Green border | `rgba(26,122,74,.2)` | Selected chips, highlight borders |
| Red tint | `rgba(239,68,68,.06-.08)` | Risk tags, over-paying indicators |
| Amber tint | `rgba(245,158,11,.06-.08)` | Warning tags |

---

## Typography

### Font stack

Loaded in `layout.tsx` via `next/font/google`:

| Role | Family | CSS Variable | Notes |
|------|--------|-------------|-------|
| Serif | Cormorant Garamond | `--font-serif` | Headings, large numbers, scores |
| Sans | Inter | `--font-sans` | Body text, buttons, labels |
| Mono | DM Mono | `--font-mono` | Data values, step numbers, metadata |

> **Note:** Many pages reference `'DM Sans', sans-serif` in scoped styles, but DM Sans is **not loaded** in `layout.tsx`. See Tech Debt section.

### Type scale

| Role | Font | Size | Weight | Extras |
|------|------|------|--------|--------|
| Hero heading | serif | `clamp(28px, 7vw, 42px)` to `clamp(42px, 6vw, 76px)` | 700 | `tracking: -0.025em`, `line-height: 1.05` |
| Section heading | serif | `clamp(30px, 4vw, 48px)` | 700 | `tracking: -0.02em`, `line-height: 1.1` |
| Card/section title | serif | 17–19px | 700 | — |
| Stat value (large) | serif | 22–26px | 700 | — |
| Eyebrow label | mono or sans | 9–11px | 600–700 | `uppercase`, `tracking: 0.14–0.25em` |
| Body | sans | 14–15px | 400 | `line-height: 1.7` |
| Small body | sans | 13px | 400–500 | — |
| Button text | sans | 12–13px | 600 | `uppercase`, `tracking: 0.1em` |
| Data label | mono or sans | 10–11px | 500–600 | `uppercase`, `tracking: 0.08–0.18em` |
| Tiny metadata | mono | 9–10px | 400–500 | — |

---

## Spacing & Layout

### Containers

| Context | Max width | Padding |
|---------|-----------|---------|
| `.container-page` | 1400px | `px-4` / `sm:px-6` / `lg:px-8` |
| Compare page | 1200px | `px-48px` (custom) |
| Narrow prose | 800px | — |
| Forms | 560px | — |
| Gate cards | 480px | — |

### Section padding

| Context | Padding |
|---------|---------|
| Light sections | `py-16 md:py-20` |
| Dark CTA sections | `py-[72px] md:py-[88px]` |
| Hero sections | `pb-16 pt-20 md:pb-24 md:pt-28` |

### Breakpoints

| Name | Width | Notes |
|------|-------|-------|
| Mobile | < 640px | Default, single column |
| sm | 640px | Minor layout shifts |
| md | 768px | Major layout changes (grid cols, sidebar) |
| lg | 1024px | Sidebar visible, full desktop layout |

---

## Components

### Buttons / CTAs

**Primary:**
- Background: `#1A7A4A`, hover: `#22995E`
- Text: white, 12–13px, semibold, uppercase, `tracking: 0.1em`
- Padding: `10–14px` vertical, `22–28px` horizontal
- **No border-radius**
- Transition: `background 0.15s`

**Secondary (light bg):**
- Border: `1px solid #CAD8D0`
- Color: `#5A7568`, hover border: `#5A7568`
- **No border-radius**

**Secondary (dark bg):**
- Border: `1px solid white/10`
- Color: `white/60`, hover: `white`, hover border: `white/30`

> Do NOT use `<Button>` from `components/ui/Button.tsx` for branded CTAs — it uses stale tokens and rounded corners. Use inline styles or Tailwind classes with the values above.

### Cards

**Data cards (light sections):**
- Background: `#fff`
- Border: `0.5px solid #CAD8D0`
- Border-radius: `10px`
- Shadow: `0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03)`

**Step/form cards:**
- Background: `#fff`
- Border: `1px solid #CAD8D0`
- **No border-radius**

### Gate overlay (unauthenticated)

**Blurred content behind gate:**
- `pointer-events: none`, `user-select: none`
- `filter: blur(1.5–2px)`
- `max-height: 500–600px`, `overflow: hidden`
- Mask: `linear-gradient(to bottom, #000 40–55%, transparent 100%)`

**Gate card:**
- Background: `#0F2538`
- Border: `1px solid rgba(255,255,255,.09)`
- Border-top: `2px solid #1A7A4A`
- Shadow: `0 8px 48px rgba(0,0,0,0.5)`
- Max-width: `480px`, centered absolute, `z-index: 30`
- Padding: `36px 40px 32px` (desktop), `28px 20px` (mobile)

**Gate card content:**
- Eyebrow: 9px mono, 700, uppercase, `tracking: 0.2em`, color `#2DBD74`
- Headline: serif, `clamp(22px, 2.5vw, 30px)`, 700, white, `tracking: -0.02em`
- Body: 13px sans, `white/55`, `line-height: 1.7`
- CTAs: primary + secondary button pattern (see above), `padding: 12px 28px`

### Section headers

Standard pattern: **eyebrow label** above **serif heading**.

- Eyebrow: 11px, semibold, uppercase, `tracking: 0.25em`, color `#2DBD74`
- Heading: serif, `clamp()` responsive, 700
- Color: `#0C1810` on light backgrounds, `white` on dark

---

## Transitions & Animation

| Context | Duration | Easing |
|---------|----------|--------|
| Hover (color, bg, border) | 0.15s | `ease` (default) |
| Button hover | 0.15s | `ease` |
| Score/bar fill | 0.6–1s | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Section reveal (scroll) | 0.7s | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Card fade-in stagger | 0.35s each, 50–80ms gap | `ease-out` |
| Benchmark/comparison bars | 0.9s | `cubic-bezier(0.16, 1, 0.3, 1)` |

> **Reduced motion:** All animations and transitions must be disabled when `prefers-reduced-motion: reduce` is active.

---

## DO / DON'T

| DO | DON'T |
|----|-------|
| Use hex values from this doc | Use CSS vars from `tokens.css` |
| Serif (`font-serif`) for headings and scores | Sans for headings |
| **No border-radius** on buttons/CTAs | `rounded-lg` or `rounded-md` on buttons |
| `#1A7A4A` for primary green | `bg-primary` (maps to wrong Tailwind green) |
| `#F6F8F7` for light section bg | `bg-secondary` (maps to Slate) |
| `#0C1810` for primary text | `text-primary` (maps to wrong color) |
| 9–11px mono/sans eyebrows, uppercase | 12px+ sans eyebrows, mixed case |
| `clamp()` for responsive headings | Fixed `px` heading sizes |
| `0.5px` borders on light cards | `2px` borders on light cards |
| `py-16 md:py-20` for section padding | `py-24 md:py-32` (too spacious) |
| Inline styles or Tailwind for branded CTAs | `<Button>` component (stale tokens) |
| `#5A7568` for muted text | `text-muted` or `text-secondary` Tailwind classes |

---

## Known Tech Debt

- **`tokens.css` is stale** — needs full rewrite to match the actual palette (navy, green, ink values). Currently references Inter, JetBrains Mono, Slate grays, and Tailwind greens.
- **`Button.tsx` uses old token system** — renders with wrong green (`bg-primary` = Tailwind green-600), rounded corners, and wrong font size. Needs migration to match branded CTA spec.
- **DM Sans is not loaded** — many pages reference `'DM Sans', sans-serif` in scoped `<style>` blocks, but only Inter is loaded in `layout.tsx`. Either add `DM_Sans` to `next/font/google` imports or remove DM Sans references and standardize on Inter.
- **`globals.css` responsive helpers** — `.text-responsive-h1` etc. reference Tailwind theme values that don't exist in the current config.
