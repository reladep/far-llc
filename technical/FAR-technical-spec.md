# FAR Technical Specification

**Version:** 1.0  
**Date:** February 13, 2026  
**Author:** Principal Architect  
**Platform:** Vercel / Next.js

---

## 1. Site Map

```
far.com (root)
├── /
│   ├── Homepage (hero, search, featured, value prop)
│   ├── How It Works (/how-it-works)
│   ├── About (/about)
│   ├── Contact (/contact)
│   └── Pricing (/pricing)
│
├── /search (search results)
│   ├── Filter API endpoint
│   └── Pagination
│
├── /firm/[crd] (firm profile)
│   ├── /firm/[crd]/reviews
│   └── /firm/[crd]/compare
│
├── /compare (comparison tool)
│   └── Compare 2-4 firms
│
├── /directory (browse all)
│   ├── /directory/[specialty]
│   ├── /directory/[location]
│   └── /directory/[fee-structure]
│
├── /blog (content/SEO)
│   ├── /blog/[slug]
│   └── /blog/category/[category]
│
├── /guides (educational)
│   ├── /guides/how-to-choose-advisor
│   └── /guides/[slug]
│
├── /disclosures
│   ├── /disclosures/privacy
│   ├── /disclosures/terms
│   └── /disclosures/disclaimer
│
├── /api (internal)
│   ├── /api/auth/[...nextauth]
│   ├── /api/firms
│   ├── /api/search
│   ├── /api/user/favorites
│   ├── /api/user/comparisons
│   ├── /api/reviews
│   ├── /api/leads
│   ├── /api/stripe/webhook
│   └── /api/stripe/checkout
│
└── /app (dashboard - authenticated)
    ├── /app/dashboard
    ├── /app/saved-firms
    ├── /app/comparisons
    ├── /app/alerts
    ├── /app/settings
    └── /app/billing
```

---

## 2. User Flows

### Flow A: Consumer Search → Compare → Connect
```
1. Land on homepage
2. Enter search query or browse featured
3. Apply filters (fee, AUM, location, specialty)
4. View firm card → click to profile
5. "Compare" → add to comparison
6. Compare 2-4 firms side-by-side
7. "Save" → create account (optional)
8. "Request Info" → fill lead form
9. Submit → confirmation + email
```

### Flow B: B2B Research → Subscription
```
1. Land on homepage
2. Navigate to /pricing
3. View plan options
4. Select plan → Stripe checkout
5. Create account
6. Access dashboard
7. Save firms, create comparisons
8. Set up alerts (new firms matching criteria)
9. Export data (CSV/API access)
```

### Flow C: Firm Claim Profile → Advertising
```
1. Firm discovers FAR via search
2. Navigate to their profile page
3. "Claim This Profile" button
4. Submit verification (email, phone)
5. Access firm dashboard
6. Pay for featured placement / subscription
7. Upload logo, respond to reviews
8. View leads/inquiries
```

---

## 3. Data Models

### Core Tables (Supabase)

```sql
-- Users (extends Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Firm Favorites
CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  crd BIGINT REFERENCES public.firmdata_current(crd),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, crd)
);

-- Saved Comparisons
CREATE TABLE public.user_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  name TEXT,
  firm_crds BIGINT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Alerts
CREATE TABLE public.user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  name TEXT,
  criteria JSONB, -- { fee_max: "1%", aum_min: 1000000, states: ["NY", "CA"] }
  notify_email BOOLEAN DEFAULT true,
  notify_push BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Firm Reviews
CREATE TABLE public.firm_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crd BIGINT REFERENCES public.firmdata_current(crd),
  user_id UUID REFERENCES public.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  verified_client BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lead Submissions
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crd BIGINT REFERENCES public.firmdata_current(crd),
  user_id UUID REFERENCES public.users(id),
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, contacted, closed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subscription Plans
CREATE TABLE public.plans (
  id TEXT PRIMARY KEY, -- free, starter, pro, enterprise
  name TEXT NOT NULL,
  price_monthly INTEGER, -- in cents
  price_yearly INTEGER,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subscription Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  plan_id TEXT REFERENCES public.plans(id),
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active', -- active, canceled, past_due
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Firm Advertising
CREATE TABLE public.firm_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crd BIGINT REFERENCES public.firmdata_current(crd),
  tier TEXT DEFAULT 'none', -- none, featured, promoted
  stripe_product_id TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Views (Read from existing tables)

```sql
-- Firm Search Result View
CREATE VIEW public.firm_search AS
SELECT
  c.crd,
  c.primary_business_name,
  c.main_office_city,
  c.main_office_state,
  c.aum,
  c.services_financial_planning,
  m.tag_1,
  m.tag_2,
  m.tag_3,
  w.website,
  l.logo_key,
  p.business_profile,
  p.notable_characteristics,
  p.tags_confidence,
  (SELECT AVG(r.rating) FROM firm_reviews r WHERE r.crd = c.crd) as avg_rating,
  (SELECT COUNT(*) FROM firm_reviews r WHERE r.crd = c.crd) as review_count,
  a.tier as ad_tier
FROM firmdata_current c
LEFT JOIN firmdata_manual m ON c.crd = m.crd
LEFT JOIN firmdata_website w ON c.crd = w.crd
LEFT JOIN firm_logos l ON c.crd = l.crd
LEFT JOIN firmdata_profile_text p ON c.crd = p.crd
LEFT JOIN firm_ads a ON c.crd = a.crd;
```

---

## 4. API Requirements

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/firms | List firms (paginated, filterable) |
| GET | /api/firms/[crd] | Single firm details |
| GET | /api/search | Full-text search |
| GET | /api/reviews | Firm reviews |
| POST | /api/leads | Submit lead/inquiry |
| GET | /api/plans | Subscription plans |

### Authenticated Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PUT/DELETE | /api/user/favorites | Manage saved firms |
| GET/POST/PUT/DELETE | /api/user/comparisons | Manage comparisons |
| GET/POST/PUT/DELETE | /api/user/alerts | Manage alerts |
| POST | /api/reviews | Submit review |
| POST | /api/stripe/checkout | Create checkout session |
| POST | /api/stripe/webhook | Stripe webhook handler |

### Edge Cases

- Rate limiting: 100 req/min IP-based, 1000 req/min auth
- Bot detection: Challenge suspicious traffic (Cloudflare Turnstile)
- Webhook security: Verify Stripe signatures

---

## 5. Component Inventory (30+)

### Layout Components
1. **Header** - Logo, nav, search, auth buttons
2. **Footer** - Links, newsletter, legal
3. **NavBar** - Main navigation
4. **Breadcrumbs** - Page hierarchy
5. **Container** - Max-width wrapper
6. **Grid** - Responsive grid system
7. **Section** - Page section wrapper

### Navigation
8. **Pagination** - Page numbers + prev/next
9. **FilterSidebar** - Collapsible filters
10. **SortDropdown** - Sort options
11. **SearchBar** - Search input + button

### Cards
12. **FirmCard** - Firm listing in grid
13. **FeaturedFirmCard** - Highlighted card
14. **ComparisonCard** - Comparison table row
15. **ReviewCard** - User review
16. **BlogCard** - Blog post preview
17. **PricingCard** - Plan tier card

### Forms
18. **Input** - Text input field
19. **Select** - Dropdown select
20. **Checkbox** - Filter checkbox
21. **SearchInput** - Search with autocomplete
22. **LeadForm** - Contact/inquiry form
23. **AuthForm** - Sign in / sign up
24. **ReviewForm** - Submit review

### Display
25. **StatBox** - Metric display (AUM, fees)
26. **Badge** - Tag, status, tier
27. **Rating** - Star rating
28. **Avatar** - User/ firm avatar
29. **EmptyState** - No results
30. **LoadingState** - Skeleton/spinner
31. **Toast** - Notification
32. **Modal** - Dialog overlay
33. **Tooltip** - Hover info

### Actions
34. **Button** - Primary, secondary, ghost
35. **IconButton** - Icon-only action
36. **FavoriteButton** - Save/unsave
37. **CompareCheckbox** - Add to compare
38. **ShareButton** - Share firm/profile
39. **ExportButton** - Export data

---

## 6. Page Templates

### Homepage
- Hero: Search bar + popular tags
- Featured firms carousel
- Value proposition section
- How it works (3 steps)
- Testimonials
- CTA: Browse / Pricing

### Search Results
- Filter sidebar (collapsible on mobile)
- Results count + sort
- Firm grid (3 columns desktop)
- Pagination
- "Load more" button

### Firm Profile
- Header: Logo, name, location, CTAs
- Tabs: Overview, Services, Disclosures, Reviews
- Stats grid: AUM, fees, clients
- About section
- Team (if available)
- Similar firms

### Comparison Tool
- Select firms to compare (search + add)
- Comparison table (2-4 columns)
- Highlight differences
- Export comparison (PDF/CSV)

### Dashboard
- Sidebar navigation
- Saved firms list
- Saved comparisons
- Active alerts
- Account settings

### Pricing
- Plan comparison table
- Feature checklist
- FAQ accordion
- Checkout flow

---

## 7. Technical Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + CSS Modules
- **Components:** Radix UI (accessible primitives)
- **State:** React Query (server state), Zustand (client)
- **Forms:** React Hook Form + Zod
- **Auth:** NextAuth.js + Supabase Auth

### Backend
- **Runtime:** Next.js API Routes (Edge)
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Search:** pgvector (full-text + embeddings)
- **File Storage:** Supabase Storage

### Infrastructure (Vercel)
- **Deployment:** Vercel (automatic)
- **Edge Functions:** Vercel Edge
- **CDN:** Vercel Edge Network
- **Analytics:** Vercel Analytics
- **Monitoring:** Sentry

### Security
- **Bot Protection:** Cloudflare Turnstile
- **Rate Limiting:** Upstash (Redis)
- **Secrets:** Vercel Environment Variables
- **CSP:** Strict Content Security Policy

### Payments
- **Provider:** Stripe
- **Products:** Subscriptions + one-time
- **Webhooks:** Stripe CLI for local dev

---

## 8. Performance Budgets

| Metric | Target | Critical |
|--------|--------|----------|
| LCP (Largest Contentful Paint) | < 1.2s | < 2.5s |
| FID (First Input Delay) | < 50ms | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.25 |
| TTFB (Time to First Byte) | < 400ms | < 800ms |
| Total JS | < 150KB | < 300KB |
| Total CSS | < 50KB | < 100KB |
| Images (above fold) | < 100KB | < 200KB |
| Time to Interactive | < 2s | < 4s |

### Strategies
- Static generation (SSG) for marketing pages
- ISR (Incremental Static Regeneration) for firm profiles
- Streaming for search results
- Image optimization (next/image, WebP/AVIF)
- Font subsetting + display: swap
- Code splitting by route

---

## 9. SEO Structure

### URL Patterns

| Page | URL Pattern |
|------|-------------|
| Homepage | `/` |
| Firm profile | `/firm/[crd]-[slug]` |
| Directory by specialty | `/advisors/[specialty]` |
| Directory by location | `/advisors/[state]-[city]` |
| Comparison | `/compare?crds=123,456` |
| Blog | `/blog/[slug]` |
| Guides | `/guides/[slug]` |

### Meta Templates

```typescript
// Firm Profile
{
  title: '{firmName} - {city}, {state} | FAR',
  description: '{firmName} - ${aum} AUM, {feeStructure} fee. {notableCharacteristics}. {reviewCount} reviews.',
  canonical: 'https://far.com/firm/{crd}-{slug}',
  ogImage: 'https://far.com/og/firm/{crd}.png'
}

// Blog Post
{
  title: '{title} | FAR Blog',
  description: '{excerpt}',
  canonical: 'https://far.com/blog/{slug}',
  ogImage: 'https://far.com/og/blog/{slug}.png'
}
```

### Sitemap
- Auto-generate from database (firm pages)
- Static pages in /pages
- Blog posts dynamic
- Weekly rebuild via cron

### Structured Data
- Organization schema on all pages
- Product/Service for pricing
- FAQPage for guides
- BreadcrumbList for navigation
- Review/Rating for firm profiles

### Robots.txt
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /app/
Disallow: /dashboard
Sitemap: https://far.com/sitemap.xml
```

---

## 10. Anti-Bot / Anti-Scraping

### Cloudflare Integration
- Turnstile on all forms
- Bot fight mode (challenge suspicious)
- Rate limiting rules
- WAF rules for known scrapers

### Application Layer
- Fingerprinting (session, behavioral)
- Request throttling
- API key required for bulk access
- IP reputation scoring

### Data Protection
- No full data dumps via API
- Pagination limits
- Watermark screenshots
- Legal: DMCA, ToS enforcement
