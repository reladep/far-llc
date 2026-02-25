# FAR Competitor Analysis — Website Features
_Last updated: 2026-02-20_

## FAR's Current Features (Baseline)
- Search/compare RIA firms by name, state, AUM
- Firm profiles with SEC-verified data (AUM history, client counts, fee schedules)
- Fee calculator widget (tiered bracket calculation, industry average comparison, growth projections)
- Negotiate page (flat %, tiered %, dollar fee input modes)
- Logo scraping (45% coverage)

---

## Competitor Breakdown

### 1. SmartAsset / SmartAdvisor Match
**Model:** Lead-gen marketplace — matches consumers with up to 3 pre-screened fiduciary advisors

**Key Features:**
- Short questionnaire/quiz (5-7 questions: zip code, investable assets, goals, timeline)
- Match with up to 3 advisors based on location + assets + willingness to take new clients
- Advisor profiles with credentials, specialties, firm info
- "Live Connection" — facilitates phone intros between advisor and consumer
- Concierge service for booking appointments
- City/state landing pages for SEO (every major metro has a dedicated page)
- Educational content hub (articles, calculators, guides)
- Retirement calculator, tax calculator, mortgage calculator (multiple free tools)

**UX Patterns Worth Noting:**
- Quiz-first funnel — homepage CTA goes straight to questionnaire, not search
- Social proof: "15% more money in retirement" stat prominently displayed
- City-level SEO pages drive organic traffic
- Minimal friction — no account creation required to get matches

**What FAR Doesn't Have:**
- ⭐ Quiz/assessment-based matching funnel
- ⭐ City/state SEO landing pages
- Multiple financial calculators (retirement, tax, mortgage)
- Concierge/booking system
- Educational content hub

---

### 2. AdvisorFinder
**Model:** Self-serve search + assessment matching (non-lead-gen, user controls contact)

**Key Features:**
- 5-step assessment: Life Stage → Industry → Service Needed → Meeting Preference → Financial Details
- Industry-specific advisor filtering (Healthcare, Military/Veterans, Technology, Business Owners)
- Specialty categories: Crypto, Alternative Investments, Estate Planning, Tax Consulting, Insurance, Advise-Only
- Detailed advisor profiles: credentials, specialties, typical client profile, fee structure
- User reviews/testimonials on advisor profiles
- User controls who sees their info (privacy-first — explicitly called out as differentiator)
- "Browse advisors from any firm" messaging (independence)

**UX Patterns Worth Noting:**
- Assessment is visual and step-based (progress indicator: 1-2-3-4-5)
- Life stage framing makes it relatable (not just "how much money do you have?")
- Industry niche pages double as SEO + trust signals
- Privacy messaging is prominent ("Those other services just sell your data")

**What FAR Doesn't Have:**
- ⭐ Life stage-based assessment flow
- ⭐ Industry/niche filtering (healthcare, tech, military, etc.)
- ⭐ User reviews on firm/advisor profiles
- Meeting preference capture (virtual vs. in-person)
- Privacy-first messaging

---

### 3. SEC IAPD (adviserinfo.sec.gov)
**Model:** Government regulatory database — raw data lookup

**Key Features:**
- Search by firm name, individual name, or CRD number
- Full Form ADV Part 1 and Part 2 (brochure) available as PDF
- Disclosure history (regulatory actions, complaints)
- Registration status and history
- Branch office locations

**UX Patterns Worth Noting:**
- Purely functional, zero UX polish — this is FAR's opportunity
- Data is comprehensive but impenetrable to average consumer
- No comparison, no filtering, no visualization

**What FAR Doesn't Have:**
- ⭐ Disclosure/disciplinary history display
- ⭐ Registration status timeline
- Direct links to source ADV PDFs
- Branch office location data

---

### 4. FINRA BrokerCheck
**Model:** Government regulatory lookup for brokers + advisors

**Key Features:**
- Search by firm or individual
- Employment history timeline
- Licensing/registration details
- Disclosure events: customer complaints, regulatory actions, arbitrations
- "Broker report" downloadable PDF
- Educational section: "What to ask your advisor"

**UX Patterns Worth Noting:**
- Timeline visualization of employment history
- Disclosure events shown with severity/category
- "Red flags" are surfaced prominently
- Guides/checklists for consumers

**What FAR Doesn't Have:**
- ⭐ Disclosure/complaint history (biggest gap)
- ⭐ Employment history timeline for individuals
- ⭐ "What to ask your advisor" educational content
- Downloadable firm reports

---

### 5. Zoe Financial (now findanadvisor.com)
**Model:** Vetted fiduciary matching service

**Key Features:**
- Goal-based matching questionnaire
- Curated/vetted advisor network (not all advisors, only approved ones)
- Reviews/testimonials on platform (integrated with Trustpilot)
- Advisor profiles with specialties, minimums, fee ranges
- Free initial consultation facilitation
- "Concierge" matching team

**UX Patterns Worth Noting:**
- Premium/curated positioning — "we vet so you don't have to"
- Strong social proof (Trustpilot reviews prominently displayed)
- Clean, modern design with trust signals throughout

**What FAR Doesn't Have:**
- ⭐ Goal-based matching questionnaire
- Third-party review integration (Trustpilot, etc.)
- Curated "vetted" badge system

---

### 6. NAPFA (Find an Advisor)
**Model:** Professional association directory (fee-only fiduciaries)

**Key Features:**
- Search by zip code / location
- Filter by specialties, compensation type
- Save advisors to favorites
- Send contact preferences to multiple advisors at once
- Print/email advisor lists
- Advisor profiles with NAPFA membership verification

**UX Patterns Worth Noting:**
- "Favorites" feature for comparison shopping
- Batch contact — send your info to multiple advisors at once
- Association badge = trust signal

**What FAR Doesn't Have:**
- ⭐ Save to favorites / comparison list
- Batch contact capability
- Professional association badge/verification indicators

---

### 7. Harness Wealth (harness.co)
**Model:** Matching + tax/financial planning services

**Key Features:**
- Advisor matching based on needs assessment
- Tax planning services bundled
- Net worth dashboard after sign-up
- Specialization in tech/startup equity compensation (RSUs, options)

**What FAR Doesn't Have:**
- Niche equity compensation tools
- Bundled service offerings

---

## Prioritized Feature Recommendations for FAR

### Tier 1 — High Impact, High Feasibility (Build Now)

| # | Feature | Impact | Feasibility | Notes |
|---|---------|--------|-------------|-------|
| 1 | **Disclosure/Complaint History** | 🔴 Critical | ✅ Have data (SEC) | Every competitor surfaces this. FAR's biggest gap. Pull from Form ADV Part 1, Item 11. Consumers care about red flags more than anything. |
| 2 | **Save & Compare (Favorites)** | 🟠 High | ✅ Easy to build | Let users save firms to a list and compare side-by-side. NAPFA, BrokerCheck all have this. Basic feature table: fees, AUM, clients, disclosures. |
| 3 | **City/State SEO Landing Pages** | 🟠 High | ✅ Have data | Auto-generate "/advisors/new-york" pages. SmartAsset's biggest organic traffic driver. FAR has the data — just needs templated pages with top firms by state/city. |
| 4 | **"What to Look For" Educational Content** | 🟡 Medium | ✅ Easy | Checklists, guides, "questions to ask your advisor." BrokerCheck and SmartAsset both have this. Builds trust + SEO. |
| 5 | **Firm Comparison Tool** | 🟠 High | ✅ Have data | Select 2-3 firms → side-by-side comparison table (fees, AUM, clients, growth, disclosures). No competitor does this well with real data. |

### Tier 2 — High Impact, Moderate Effort (Build Next)

| # | Feature | Impact | Feasibility | Notes |
|---|---------|--------|-------------|-------|
| 6 | **Quiz/Assessment Matching Flow** | 🟠 High | 🟡 Moderate | SmartAsset and AdvisorFinder's core UX. Questions: portfolio size, life stage, location, needs → filtered results. Different from lead-gen — FAR shows data, not referrals. |
| 7 | **Industry/Niche Filtering** | 🟡 Medium | 🟡 Moderate | Filter by advisor specialty (retirement, tech, healthcare, estate planning). Would need to parse ADV Part 2 brochures for specialties. AdvisorFinder's key differentiator. |
| 8 | **Downloadable Firm Report (PDF)** | 🟡 Medium | ✅ Easy | One-click "Download Report" for any firm — compiled fee data, AUM history, disclosures, comparison to peers. BrokerCheck has this. Great for consumers doing due diligence. |
| 9 | **AUM History Chart** | 🟡 Medium | ✅ Have data | Visual timeline of firm AUM growth. You likely have historical data — chart it. Shows growth trajectory and stability. |
| 10 | **Fee Percentile Ranking** | 🟡 Medium | ✅ Have data | "This firm's fees are in the Xth percentile for firms managing $Y–$Z." You already have industry averages — extend to percentile display. |

### Tier 3 — Differentiators (FAR's Moat)

| # | Feature | Impact | Feasibility | Notes |
|---|---------|--------|-------------|-------|
| 11 | **Fee Negotiation Score/Signal** | 🔴 Critical | 🟡 Moderate | NO competitor does this. Show whether a firm's fees are negotiable based on data patterns (fee changes over time, tier structures, deviation from peers). This is FAR's core thesis — lean into it hard. |
| 12 | **"Fee Alert" — Price Drop / Change Notifications** | 🟠 High | 🟡 Moderate | Alert users when a firm they're watching changes their fee schedule. Unique to FAR. Ties into the alerts MVP you're already planning. |
| 13 | **Firm Growth Signals** | 🟡 Medium | ✅ Have data | Badge system: "Growing Fast" (AUM ↑ >20% YoY), "Stable" (consistent), "Declining" (AUM ↓). Visual trust signals no one else provides. |
| 14 | **Client Concentration Score** | 🟡 Medium | ✅ Have data | Avg AUM per client, client count trends. Flags firms that are too concentrated or losing clients. Unique data-driven insight. |
| 15 | **"True Cost" Calculator** | 🟠 High | 🟡 Moderate | Extend fee calculator: include estimated fund expenses, trading costs, wrap fees where data available. Show total all-in cost. Nobody does this transparently. |

---

## Quick Wins (< 1 Day Each)
1. Add disclosure count badge to firm profiles (pull from existing data)
2. Add "Share this firm" button (social/link sharing)
3. Add "Print/Save" for firm profiles
4. Firm profile breadcrumbs (Home → State → City → Firm)
5. "Similar Firms" section at bottom of each profile (same state, similar AUM range)

## SEO Opportunities
- City pages: "/advisors/new-york-ny" — list top firms, avg fees, local stats
- State pages: "/advisors/california" — aggregate state data
- "Best advisors for [niche]" pages
- Fee comparison pages: "Average financial advisor fees in [state]"
- Educational guides: "How to check your advisor's background", "Are advisor fees negotiable?"

---

## Key Takeaway

**Nobody combines SEC-verified data + fee transparency + negotiation tools in one place.** SmartAsset owns lead-gen matching. BrokerCheck owns regulatory lookup. AdvisorFinder owns the self-serve assessment. But none of them let you deeply compare fees, see if they're negotiable, and understand the true cost — which is FAR's entire thesis.

**Priority order:** Disclosures → Compare/Favorites → SEO Pages → Quiz Flow → Fee Negotiation Score

The moat is in the data interpretation layer — not just showing the data (SEC already does that), but making it *meaningful* for consumers.
