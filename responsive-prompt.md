# FAR Responsive Design Prompt

## Role
You are a Responsive Design Specialist. Plan and implement responsive behavior for FAR.

## Breakpoints
- **Mobile:** 375px (default)
- **Tablet:** 640px (sm)
- **Laptop:** 768px (md)
- **Desktop:** 1024px (lg)
- **Wide:** 1440px (xl)

---

## Responsive Requirements by Page

### 1. Homepage

**Navbar:**
- Desktop: Horizontal links, logo left, auth buttons right
- Tablet: Horizontal links, compact
- Mobile: Logo + hamburger menu → full-screen drawer from right

**Hero:**
- Desktop: Centered, max-width 800px
- Mobile: Full-width, reduced padding, smaller font sizes
- Search bar: Full-width on mobile

**Featured Firms:**
- Desktop: 3-column grid
- Tablet: 2-column
- Mobile: 1-column stack

**Value Props:**
- Desktop: 3-column horizontal
- Tablet: 2-column
- Mobile: 1-column stack

**Footer:**
- Desktop: 4-column grid
- Tablet: 2-column
- Mobile: 1-column stack, collapsible sections

---

### 2. Search Results

**Layout:**
- Desktop: Sidebar filters left (280px), results right
- Tablet: Collapsible sidebar overlay
- Mobile: Full-width filters in drawer/modal, results below

**Results Grid:**
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column

**Pagination:**
- Desktop: Full pagination (1 2 3 ... 10)
- Mobile: Simple "Load More" button

---

### 3. Firm Profile

**Layout:**
- Desktop: 2-column (content left 2/3, sidebar right 1/3)
- Tablet: 2-column, narrower sidebar
- Mobile: 1-column, sidebar moves below content

**Tabs:**
- Desktop: Horizontal tabs
- Mobile: Scrollable horizontal or accordion

**Stats Grid:**
- Desktop: 3x2 grid
- Tablet: 2x3
- Mobile: 2x3 or stack

---

### 4. Comparison

**Table:**
- Desktop: Full table with all columns
- Tablet: Horizontal scroll with sticky first column
- Mobile: Card-based comparison (one firm per card, swipeable)

---

### 5. Dashboard

**Layout:**
- Desktop: Sidebar left (240px), content right
- Tablet/Mobile: Bottom tab bar OR hamburger → drawer

**Grid:**
- Desktop: Dashboard widgets in grid
- Mobile: 1-column stack

---

### 6. Pricing

**Cards:**
- Desktop: 3 cards horizontal
- Tablet: 3 cards, compact
- Mobile: 1-column stack, featured card highlighted

---

## Typography Scale

| Element | Desktop | Laptop | Tablet | Mobile |
|---------|---------|--------|--------|--------|
| H1 (Display) | 48px | 40px | 36px | 32px |
| H2 | 36px | 32px | 28px | 24px |
| H3 | 24px | 22px | 20px | 18px |
| Body | 16px | 16px | 15px | 14px |
| Small | 14px | 14px | 13px | 12px |

---

## Spacing

| Element | Desktop | Tablet | Mobile |
|---------|--------|--------|--------|
| Section padding | 80px | 60px | 40px |
| Container max | 1280px | 100% | 100% |
| Grid gap | 24px | 20px | 16px |
| Card padding | 24px | 20px | 16px |

---

## Implementation

Create/update these files in `/Users/alex/.openclaw/workspace/far/src/`:

1. **Tailwind config:**
   - Update `tailwind.config.ts` with responsive font sizes and spacing

2. **Layout components:**
   - `src/components/layout/MobileNav.tsx` — Mobile hamburger + drawer
   - `src/components/layout/ResponsiveGrid.tsx` — Grid that adapts columns

3. **Update pages:**
   - `src/app/page.tsx` — Responsive homepage
   - `src/app/search/page.tsx` — Responsive search
   - `src/app/firm/[crd]/page.tsx` — Responsive profile
   - `src/app/compare/page.tsx` — Responsive comparison
   - `src/app/dashboard/layout.tsx` — Responsive dashboard
   - `src/components/layout/Header.tsx` — Responsive navbar with mobile menu

4. **Utility components:**
   - `src/components/ui/Hide.tsx` — Hide on specific breakpoints
   - `src/components/ui/Show.tsx` — Show on specific breakpoints
   - `src/components/ui/ResponsiveGrid.tsx` — Column control

5. **Update globals.css:**
   - Add any responsive utilities needed

---

## Mobile-First Approach

Write CSS/Tailwind mobile-first (default), then add `md:`, `lg:`, `xl:` overrides.

Example:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* content */}
</div>
```

---

## Touch Targets

- Minimum touch target: 44x44px on mobile
- Buttons: min-height 44px
- Form inputs: min-height 44px
- Links: min padding 12px

---

## Images

- Use `next/image` for automatic responsive behavior
- Art direction: Different crops for mobile vs desktop where appropriate
- Lazy loading on below-fold images

---

## Implementation Priority

1. Header + Mobile Nav (highest)
2. Homepage responsive
3. Search results responsive
4. Firm profile responsive
5. Comparison responsive
6. Dashboard responsive
7. Pricing responsive
