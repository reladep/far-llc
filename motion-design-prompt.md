# FAR Motion Design Specification

## Role
You are a Motion Designer at Apple. Design all interactions for the FAR website.

---

## 1. Page Load Sequence

### Homepage
| Element | Animation | Duration | Easing | Delay |
|---------|-----------|----------|--------|-------|
| Navbar | Fade in | 300ms | ease-out | 0ms |
| Hero text (line 1) | Fade up 20px | 600ms | ease-out | 100ms |
| Hero text (line 2) | Fade up 20px | 600ms | ease-out | 200ms |
| Hero subtext | Fade up 20px | 600ms | ease-out | 300ms |
| Search bar | Scale from 0.95 + fade | 500ms | spring(1, 80, 10) | 400ms |
| Hero tags | Stagger fade up | 400ms each | ease-out | 500ms + 50ms stagger |
| Featured firms | Stagger fade up | 300ms each | ease-out | 800ms + 80ms stagger |
| Value props | Stagger fade up | 300ms each | ease-out | 1200ms + 100ms stagger |

### Search Results
| Element | Animation | Duration | Easing | Delay |
|---------|-----------|----------|--------|-------|
| Filters sidebar | Slide in from left | 300ms | ease-out | 0ms |
| Results count | Fade in | 200ms | ease-out | 100ms |
| Firm cards | Stagger fade up | 300ms each | ease-out | 200ms + 60ms stagger |
| Pagination | Fade in | 200ms | ease-out | after cards |

### Firm Profile
| Element | Animation | Duration | Easing | Delay |
|---------|-----------|----------|--------|-------|
| Profile header | Fade in | 300ms | ease-out | 0ms |
| Stat boxes | Stagger scale + fade | 300ms each | ease-out | 100ms + 50ms stagger |
| Tab content | Fade in | 300ms | ease-out | 200ms |
| Sidebar | Slide in from right | 300ms | ease-out | 300ms |

---

## 2. Scroll Behaviors

### Navbar
- **Default:** Height 80px, background transparent
- **On scroll (past 50px):** 
  - Shrink to 64px over 300ms ease-out
  - Background fades to solid (#ffffff) over 200ms
  - Box-shadow appears (shadow-sm)
- **On scroll up (while scrolled down):**
  - Slides down into view (translateY: -100% → 0)
  - 200ms ease-out

### Hero Section
- **Parallax:** Background subtle movement at 0.5x scroll speed
- **Text:** Fades out after scrolling 400px (opacity 1 → 0 over 200ms)

### Section Reveals
- **Trigger:** When section enters viewport (rootMargin: -100px)
- **Animation:** Fade up 30px + fade in
- **Duration:** 500ms ease-out
- **Stagger:** 100ms between sibling elements

### Sticky Elements
- **Filter sidebar:** Pins to top after scrolling past its position
- **Pin animation:** Smooth 200ms transition

---

## 3. Hover States

### Buttons
- **Default:** No transform
- **Hover:** 
  - translateY: -2px over 150ms ease-out
  - Box-shadow grows (shadow-md → shadow-lg)
  - Background darkens 10%
- **Active:** 
  - translateY: 0
  - Box-shadow reduces
  - Scale: 0.98

### Cards (Firm Cards, etc.)
- **Hover:**
  - Border color transitions to primary (#16a34a)
  - translateY: -4px over 200ms ease-out
  - Shadow grows (shadow-md → shadow-xl)
  - Scale: 1.02
- **Focus-visible:** 2px primary outline with 2px offset

### Links
- **Hover:**
  - Color transitions to primary (200ms)
  - Underline grows from left (width 0 → 100% over 200ms)

### Icons
- **Hover:** 
  - Scale: 1.1 over 150ms
  - Color to primary

### Tags/Badges
- **Hover:**
  - Background opacity increases
  - Slight scale: 1.05

---

## 4. Click Transitions

### Page Transitions
- **Exit:** Fade out 150ms
- **Enter:** Fade in 200ms
- **Total:** ~350ms (overlapped)

### Modal Opens
- **Overlay:** 
  - Fade in 200ms ease-out
  - Background rgba(0,0,0,0) → rgba(0,0,0,0.5)
- **Content:** 
  - Scale from 0.95 → 1
  - Fade in
  - 300ms spring(1, 80, 12)

### Modal Closes
- **Reverse of open:** ~250ms total

### Drawers (Mobile Menu)
- **Open:** Slide in from right, 300ms ease-out
- **Close:** Slide out, 250ms ease-in

### Tabs
- **Switch:** Content crossfade 200ms
- **Indicator:** Slide to active tab, 200ms ease-out

### Accordions
- **Expand:** Height auto, 300ms ease-out
- **Collapse:** Height auto, 250ms ease-in

---

## 5. Gesture Support

### Mobile Touch
- **Swipe to close:** Modal/drawer closes on swipe down (threshold: 100px)
- **Swipe between tabs:** Horizontal swipe navigation
- **Pull to refresh:** On search results (if applicable)

### Pinch (Future)
- **Image zoom:** Pinch to zoom on firm images (future feature)

---

## 6. Easing Reference

```typescript
const easings = {
  // Standard
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Spring (iOS-style)
  'spring-1': 'cubic-bezier(1, 80, 10)',   // Fast snap
  'spring-2': 'cubic-bezier(1, 80, 12)',   // Standard
  'spring-3': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy
  
  // Smooth
  'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
};
```

---

## 7. Durations Reference

| Type | Duration | Use Case |
|------|----------|----------|
| Micro | 75-100ms | Tooltips, tiny movements |
| Quick | 150-200ms | Button hover, small interactions |
| Standard | 200-300ms | Cards, modals, standard transitions |
| Medium | 400-500ms | Page elements, staggers |
| Slow | 600-800ms | Hero animations, major reveals |

---

## 8. Performance

- Use `transform` and `opacity` only for animations
- Use `will-change: transform, opacity` on animated elements
- Use `GPU` acceleration (translate3d) for movement
- Avoid animating: width, height, top, left (use transform)
- Respect `prefers-reduced-motion`

---

## 9. Implementation

Create these files in `/Users/alex/.openclaw/workspace/far/src/`:

1. **Animation utilities:**
   - `src/lib/animations.ts` — Easing functions, durations, helper classes
   - `src/lib/hooks/useScrollAnimation.ts` — Scroll-triggered animations
   - `src/lib/hooks/useStagger.ts` — Stagger animation utility

2. **Animation components:**
   - `src/components/ui/FadeIn.tsx` — Fade in on viewport entry
   - `src/components/ui/StaggerGroup.tsx` — Staggered children
   - `src/components/ui/Parallax.tsx` — Parallax wrapper
   - `src/components/ui/SlideIn.tsx` — Slide in animations

3. **Page animations:**
   - Update existing page components with enter animations

4. **Micro-interactions:**
   - `src/components/ui/HoverCard.tsx` — Card with hover effects
   - Update Button, Card, Badge with hover states in their component files

5. **Page transitions:**
   - `src/components/ui/PageTransition.tsx` — Page wrapper with transitions

---

## 10. CSS Classes to Add

```css
/* Animations */
.animate-fade-in { animation: fadeIn var(--duration-standard) var(--ease-out) forwards; }
.animate-fade-up { animation: fadeUp var(--duration-medium) var(--ease-out) forwards; }
.animate-scale-in { animation: scaleIn var(--duration-standard) var(--spring-2) forwards; }
.animate-slide-in-right { animation: slideInRight var(--duration-standard) var(--ease-out) forwards; }
.animate-slide-in-left { animation: slideInLeft var(--duration-standard) var(--ease-out) forwards; }

/* Hover states */
.hover-lift { transition: transform var(--duration-quick) var(--ease-out), box-shadow var(--duration-quick) var(--ease-out); }
.hover-lift:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

/* Stagger */
.stagger-children > * { animation: fadeUp var(--duration-medium) var(--ease-out) backwards; }
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
/* ... */
```

Add to globals.css and update components accordingly.
