# FAR Design System Specification

**Version:** 1.0  
**Date:** February 13, 2026  
**Author:** Design Director  
**Brand:** Modern, Analytics, Minimal, Sleek

---

## 1. Color Palette

### Primary Colors (Forest Green)

```css
:root {
  /* Forest Green - Primary */
  --color-primary-50: #f0fdf4;
  --color-primary-100: #dcfce7;
  --color-primary-200: #bbf7d0;
  --color-primary-300: #86efac;
  --color-primary-400: #4ade80;
  --color-primary-500: #22c55e;
  --color-primary-600: #16a34a;
  --color-primary-700: #15803d;
  --color-primary-800: #166534;
  --color-primary-900: #14532d;
  
  /* Primary default */
  --color-primary: var(--color-primary-600);
  --color-primary-hover: var(--color-primary-700);
  --color-primary-active: var(--color-primary-800);
}
```

### Secondary Colors (Slate)

```css
/* Slate - Neutral */
--color-secondary-50: #f8fafc;
--color-secondary-100: #f1f5f9;
--color-secondary-200: #e2e8f0;
--color-secondary-300: #cbd5e1;
--color-secondary-400: #94a3b8;
--color-secondary-500: #64748b;
--color-secondary-600: #475569;
--color-secondary-700: #334155;
--color-secondary-800: #1e293b;
--color-secondary-900: #0f172a;
--color-secondary-950: #020617;

--color-secondary: var(--color-secondary-700);
--color-secondary-foreground: #ffffff;
```

### Semantic Colors

```css
/* Success */
--color-success-50: #f0fdf4;
--color-success-100: #dcfce7;
--color-success-500: #22c55e;
--color-success-600: #16a34a;
--color-success-700: #15803d;

/* Warning */
--color-warning-50: #fffbeb;
--color-warning-100: #fef3c7;
--color-warning-500: #f59e0b;
--color-warning-600: #d97706;

/* Error */
--color-error-50: #fef2f2;
--color-error-100: #fee2e2;
--color-error-500: #ef4444;
--color-error-600: #dc2626;

/* Info */
--color-info-50: #eff6ff;
--color-info-100: #dbeafe;
--color-info-500: #3b82f6;
--color-info-600: #2563eb;
```

### Dark Mode

```css
.dark {
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-tertiary: #334155;
  
  --color-text-primary: #f8fafc;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
  
  --color-border: #334155;
}
```

### Background (Default Light)

```css
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #f1f5f9;
  
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  
  --color-border: #e2e8f0;
  --color-border-hover: #cbd5e1;
}
```

---

## 2. Typography

### Font Recommendations

| Use Case | Font | Weight | Size |
|----------|------|--------|------|
| Headings | **Inter** | 600-700 | - |
| Body | **Inter** | 400-500 | - |
| Data/Numbers | **JetBrains Mono** | 400-500 | - |
| Display | **Inter** | 700-800 | - |

### Type Scale (9 Levels)

```css
:root {
  /* Display - Hero headlines */
  --text-display-xl: 4rem;      /* 64px, line-height: 1.1, letter-spacing: -0.02em */
  --text-display-lg: 3rem;     /* 48px, line-height: 1.1, letter-spacing: -0.02em */
  --text-display-md: 2.25rem;  /* 36px, line-height: 1.2 */
  
  /* Heading */
  --text-heading-xl: 1.875rem; /* 30px, line-height: 1.3 */
  --text-heading-lg: 1.5rem;   /* 24px, line-height: 1.4 */
  --text-heading-md: 1.25rem;  /* 20px, line-height: 1.4 */
  --text-heading-sm: 1.125rem; /* 18px, line-height: 1.5 */
  
  /* Body */
  --text-body-lg: 1.125rem;    /* 18px, line-height: 1.6 */
  --text-body-md: 1rem;         /* 16px, line-height: 1.6 */
  --text-body-sm: 0.875rem;    /* 14px, line-height: 1.5 */
  
  /* Caption */
  --text-caption: 0.75rem;     /* 12px, line-height: 1.5 */
  --text-overline: 0.625rem;   /* 10px, line-height: 1.5, letter-spacing: 0.1em */
}
```

### Font Weights

```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

---

## 3. Spacing System (8px Grid)

```css
:root {
  /* Base unit */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### Common Patterns

```css
/* Section padding */
--section-padding-y: var(--space-16);
--section-padding-x: var(--space-6);

/* Card padding */
--card-padding: var(--space-6);
--card-padding-sm: var(--space-4);

/* Gap between elements */
--gap-xs: var(--space-2);
--gap-sm: var(--space-3);
--gap-md: var(--space-4);
--gap-lg: var(--space-6);
--gap-xl: var(--space-8);
```

---

## 4. Layout Breakpoints

```css
:root {
  /* Mobile first */
  --breakpoint-xs: 0;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### Responsive Grid

```css
/* Container */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1400px;
```

### Responsive Type

```css
@media (max-width: 640px) {
  --text-display-xl: 2.5rem;
  --text-display-lg: 2rem;
  --text-display-md: 1.75rem;
}
```

---

## 5. Component Specifications

### 5.1 Button

```css
/* Base */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-family: 'Inter', sans-serif;
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  border-radius: var(--radius-md);
  transition: all 150ms ease;
  cursor: pointer;
  border: none;
  white-space: nowrap;
}

/* Primary */
.btn-primary {
  background: var(--color-primary);
  color: white;
}
.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
}
.btn-primary:active {
  transform: translateY(0);
  box-shadow: none;
}

/* Secondary */
.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
.btn-secondary:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-hover);
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
}
.btn-ghost:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

/* Sizes */
.btn-sm { padding: var(--space-2) var(--space-3); font-size: var(--text-caption); }
.btn-md { padding: var(--space-3) var(--space-5); }
.btn-lg { padding: var(--space-4) var(--space-6); font-size: var(--text-body-md); }

/* States */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Loading */
.btn-loading {
  position: relative;
  color: transparent;
}
.btn-loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

### 5.2 Input

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: 'Inter', sans-serif;
  font-size: var(--text-body-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  transition: all 150ms ease;
}
.input::placeholder {
  color: var(--color-text-muted);
}
.input:hover {
  border-color: var(--color-border-hover);
}
.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}
.input:disabled {
  background: var(--color-bg-tertiary);
  cursor: not-allowed;
}

/* With Icon */
.input-icon-left {
  padding-left: var(--space-10);
}
.input-icon-right {
  padding-right: var(--space-10);
}
```

### 5.3 Card

```css
.card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--card-padding);
  transition: all 200ms ease;
}
.card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.card-flat {
  box-shadow: none;
}
.card-interactive {
  cursor: pointer;
}
```

### 5.4 Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
}
.badge-primary {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-primary-700);
}
.badge-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}
.badge-success {
  background: var(--color-success-100);
  color: var(--color-success-700);
}
.badge-warning {
  background: var(--color-warning-100);
  color: var(--color-warning-600);
}
.badge-error {
  background: var(--color-error-100);
  color: var(--color-error-600);
}
```

### 5.5 Rating

```css
.rating {
  display: inline-flex;
  gap: var(--space-1);
}
.rating-star {
  width: 20px;
  height: 20px;
  color: var(--color-warning-500);
}
.rating-star-empty {
  color: var(--color-border);
}
.rating-value {
  margin-left: var(--space-2);
  font-size: var(--text-body-sm);
  color: var(--color-text-secondary);
}
```

### 5.6-30. Additional Components

See full component library in `/components` directory.

| # | Component | Variants |
|---|-----------|----------|
| 6 | Select | default, with-search, multi-select |
| 7 | Checkbox | default, indeterminate |
| 8 | Radio | default, card-style |
| 9 | Toggle | default |
| 10 | Tooltip | light, dark |
| 11 | Modal | sm, md, lg, fullscreen |
| 12 | Drawer | left, right |
| 13 | Dropdown | default, with-search |
| 14 | Tabs | underline, pills, card |
| 15 | Accordion | default, with-icon |
| 16 | Table | default, striped, sortable |
| 17 | Pagination | default, minimal |
| 18 | Skeleton | text, card, table |
| 19 | Toast | success, error, warning, info |
| 20 | Avatar | sm, md, lg, xl, with-status |
| 21 | Divider | horizontal, vertical |
| 22 | EmptyState | default, with-action |
| 23 | Image | default, lazy, with-placeholder |
| 24 | IconButton | sm, md, lg |
| 25 | SearchInput | default, with-filters |
| 26 | StatBox | default, with-trend, with-comparison |
| 27 | ComparisonTable | default, highlight-diff |
| 28 | FilterPanel | default, collapsible |
| 29 | ReviewCard | default, compact |
| 30 | PricingCard | default, featured |

---

## 6. Animation Guidelines

### Easing Curves

```css
/* Standard */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Bouncy */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Smooth */
--ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
```

### Duration

```css
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;
```

### Common Animations

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scale In */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Usage

```css
.animate-fade-in {
  animation: fadeIn var(--duration-300) var(--ease-default);
}
.animate-slide-up {
  animation: slideUp var(--duration-300) var(--ease-default);
}
.animate-scale-in {
  animation: scaleIn var(--duration-200) var(--ease-bounce);
}

/* Stagger children */
.stagger-children > * {
  animation: slideUp var(--duration-300) var(--ease-default) backwards;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
```

---

## 7. Accessibility (WCAG AA)

### Requirements

| Standard | Level |
|----------|-------|
| Contrast Ratio | 4.5:1 (text), 3:1 (UI) |
| Focus Indicators | Visible focus ring |
| Keyboard Nav | All interactive elements accessible |
| Screen Readers | Proper ARIA labels |
| Motion | Respect `prefers-reduced-motion` |
| Text Resize | Support up to 200% zoom |

### Focus Styles

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Remove default focus for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Design Tokens (JSON)

```json
{
  "color": {
    "primary": {
      "50": "#f0fdf4",
      "100": "#dcfce7",
      "200": "#bbf7d0",
      "300": "#86efac",
      "400": "#4ade80",
      "500": "#22c55e",
      "600": "#16a34a",
      "700": "#15803d",
      "800": "#166534",
      "900": "#14532d"
    },
    "secondary": {
      "50": "#f8fafc",
      "100": "#f1f5f9",
      "200": "#e2e8f0",
      "300": "#cbd5e1",
      "400": "#94a3b8",
      "500": "#64748b",
      "600": "#475569",
      "700": "#334155",
      "800": "#1e293b",
      "900": "#0f172a",
      "950": "#020617"
    }
  },
  "font": {
    "family": {
      "sans": "Inter, system-ui, sans-serif",
      "mono": "JetBrains Mono, monospace"
    },
    "size": {
      "display-xl": "4rem",
      "display-lg": "3rem",
      "display-md": "2.25rem",
      "heading-xl": "1.875rem",
      "heading-lg": "1.5rem",
      "heading-md": "1.25rem",
      "heading-sm": "1.125rem",
      "body-lg": "1.125rem",
      "body-md": "1rem",
      "body-sm": "0.875rem",
      "caption": "0.75rem",
      "overline": "0.625rem"
    },
    "weight": {
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    }
  },
  "space": {
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem",
    "20": "5rem",
    "24": "6rem"
  },
  "radius": {
    "none": "0",
    "sm": "0.125rem",
    "md": "0.375rem",
    "lg": "0.5rem",
    "xl": "0.75rem",
    "2xl": "1rem",
    "full": "9999px"
  },
  "shadow": {
    "sm": "0 1px 2px rgba(0, 0, 0, 0.05)",
    "md": "0 4px 6px rgba(0, 0, 0, 0.07)",
    "lg": "0 10px 15px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px rgba(0, 0, 0, 0.15)"
  },
  "transition": {
    "duration": {
      "75": "75ms",
      "100": "100ms",
      "150": "150ms",
      "200": "200ms",
      "300": "300ms"
    },
    "ease": {
      "default": "cubic-bezier(0.4, 0, 0.2, 1)",
      "in": "cubic-bezier(0.4, 0, 1, 1)",
      "out": "cubic-bezier(0, 0, 0.2, 1)",
      "in-out": "cubic-bezier(0.4, 0, 0.2, 1)"
    }
  }
}
```

---

## 9. CSS Variables Export

```css
/* FAR Design System - CSS Variables */

/* Colors - Primary (Forest Green) */
:root {
  --color-primary-50: #f0fdf4;
  --color-primary-100: #dcfce7;
  --color-primary-200: #bbf7d0;
  --color-primary-300: #86efac;
  --color-primary-400: #4ade80;
  --color-primary-500: #22c55e;
  --color-primary-600: #16a34a;
  --color-primary-700: #15803d;
  --color-primary-800: #166534;
  --color-primary-900: #14532d;
  
  --color-primary: var(--color-primary-600);
  --color-primary-hover: var(--color-primary-700);
  --color-primary-active: var(--color-primary-800);
  
  /* Colors - Secondary (Slate) */
  --color-secondary-50: #f8fafc;
  --color-secondary-100: #f1f5f9;
  --color-secondary-200: #e2e8f0;
  --color-secondary-300: #cbd5e1;
  --color-secondary-400: #94a3b8;
  --color-secondary-500: #64748b;
  --color-secondary-600: #475569;
  --color-secondary-700: #334155;
  --color-secondary-800: #1e293b;
  --color-secondary-900: #0f172a;
  
  /* Colors - Semantic */
  --color-success-500: #22c55e;
  --color-success-600: #16a34a;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  --color-error-500: #ef4444;
  --color-error-600: #dc2626;
  --color-info-500: #3b82f6;
  --color-info-600: #2563eb;
  
  /* Colors - Background */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #f1f5f9;
  
  /* Colors - Text */
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  
  /* Colors - Border */
  --color-border: #e2e8f0;
  --color-border-hover: #cbd5e1;
  
  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  
  /* Border Radius */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #0f172a;
    --color-bg-secondary: #1e293b;
    --color-bg-tertiary: #334155;
    --color-text-primary: #f8fafc;
    --color-text-secondary: #94a3b8;
    --color-text-muted: #64748b;
    --color-border: #334155;
    --color-border-hover: #475569;
  }
}
```

---

*End of Design System Specification*
