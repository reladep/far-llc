# FAR Content Prompt - Codex Implementation

## Role
You are a Conversion Copywriter at Ogilvy. Write all copy for the FAR website (wealth management directory platform).

## Brand Voice
**Professional** — Trustworthy, data-driven, expert. Speaks to financially sophisticated consumers who want clarity and transparency.

## Target Audience
- **Primary:** Fee-conscious, data-driven consumers looking for wealth management firms
- **Secondary:** High-net-worth individuals, business owners, FIRE seekers
- **Tertiary:** B2B (RIA firms researching competitors)

## Goal
**Conversion** — Get users to search, compare, and ultimately connect with wealth management firms. Build trust through transparency.

---

## Deliverables

### 1. Homepage

**Hero Section**
- Headline (6 words): "Find Your Perfect Wealth Advisor"
- Subhead (15 words): "Compare fees, services, and specialties. Make informed financial decisions with confidence."
- CTA: "Start Searching" / "Browse Advisors"

**Feature Sections (3 blocks)**

1. **Search & Compare**
   - Headline: "Search Thousands of Advisors"
   - Description: "Filter by fee structure, AUM, location, and specialties. View detailed profiles with transparent pricing."

2. **Verified Data**
   - Headline: "Trust Verified Information"
   - Description: "Data sourced directly from SEC filings. Firm profiles include credentials, disclosures, and performance metrics."

3. **Connect Directly**
   - Headline: "Your Money, Your Choice"
   - Description: "Request info directly from firms. Read reviews from verified clients. Make decisions on your terms."

**Social Proof**
- Testimonial framework: "[Name], [City] — 'FAR helped me find an advisor who actually understood my situation. Saved weeks of research.'"
- Stats: "15,000+ advisors profiled", "500K+ annual searches", "Free for consumers"

**FAQ (8 questions)**
1. How much does FAR cost? — Free for users. Firms pay for premium features.
2. How do you verify advisor data? — All data from SEC Form ADV filings.
3. Can I trust the reviews? — Reviews are from verified clients who submitted through our platform.
4. What's a fiduciary? — A legal obligation to act in your best interest.
5. Fee-only vs fee-based — Fee-only = no commissions. Fee-based = both fees and commissions.
6. How do I compare firms? — Use our comparison tool to view side-by-side.
7. Is my information secure? — Yes, we never share your data without consent.
8. How do I get started? — Search by location or specialty, then request info.

**Footer**
- Navigation: Home, Browse, Compare, About, Pricing, Blog, Contact
- Social: Twitter, LinkedIn
- Legal: Privacy Policy, Terms of Service, Disclaimer

---

### 2. Search Results Page

**Hero/Filter Section**
- Headline: "Browse [X] Financial Advisors"
- Subhead: "Filter by fee, AUM, location, and specialty to find your match."

**Results Header**
- "[X] advisors found" + sort dropdown (Relevance, AUM, Fees, Rating)

**No results state**
- "No advisors match your criteria. Try broadening your filters."

---

### 3. Firm Profile Page

**Profile Header**
- Firm name, location, "Request Info" CTA, "Save" CTA, "Compare" CTA

**Key Stats (6 items)**
- AUM, Fee Structure, Min Investment, Founded, Team Size, Credentials

**About Section**
- Business description (from ADV)

**Services**
- List of services offered

**Disclosures**
- Regulatory disclosures from SEC

---

### 4. Comparison Page

**Header**
- Headline: "Compare Advisors Side-by-Side"
- Subhead: "Select up to 4 firms to compare key metrics."

**Comparison Table**
- Rows: AUM, Fees, Min Investment, Location, Services, Credentials, Ratings
- Highlight differences in green

---

### 5. Pricing Page

**Header**
- Headline: "Simple, Transparent Pricing"
- Subhead: "Choose the plan that fits your needs."

**Plans**

1. **Free**
   - Price: $0
   - Features: Search, View profiles, Compare (2 firms), Save 5 firms

2. **Pro** (Featured)
   - Price: $19/month
   - Features: Everything in Free + Compare (4 firms), Unlimited saves, Email alerts, Export data

3. **Enterprise**
   - Price: Custom
   - Features: API access, Bulk data, Dedicated support

**FAQ**
1. Can I cancel anytime? — Yes, cancel anytime.
2. Is there a free trial? — 14-day free trial on Pro.
3. What payment methods? — All major cards + PayPal.

---

### 6. About Page

**Hero**
- Headline: "Making Financial Advice Transparent"
- Subhead: "FAR helps consumers find the right advisor through data, not marketing."

**Mission**
- "We believe everyone deserves access to quality financial advice. Our platform puts data in your hands."

**How It Works**
1. We aggregate public SEC data
2. We verify and structure it
3. You make informed decisions

---

## Formatting Requirements

- Headlines: H1 for main hero, H2 for sections
- Body: 16px, readable line-height
- CTA buttons: Action-oriented text
- Stats: Use real numbers (we'll populate)
- Tone: Confident, clear, no jargon

## Implementation

Update the following files in `/Users/alex/.openclaw/workspace/far/`:

1. `src/app/page.tsx` — Homepage
2. `src/app/search/page.tsx` — Search results
3. `src/app/firm/[crd]/page.tsx` — Firm profile
4. `src/app/compare/page.tsx` — Comparison
5. `src/app/pricing/page.tsx` — Pricing
6. `src/app/about/page.tsx` — About

Keep existing component structure, replace text content only. Don't break existing Tailwind classes.
