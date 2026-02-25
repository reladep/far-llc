# MEMORY.md — Long-term memory for Maxwell

_Last updated: 2026-02-16_

## About Alex

- VP of Research at large wealth management firm
- Asset allocator for UHNW clients ($50M+ to billionaires)
- Based in Manhattan, NYC
- Married ~2 years, wife is dermatologist with growing social media brand

## FAR, LLC — Alex's Company

**Mission:** "Bringing the Footnotes to the Frontpage" — making buried regulatory filing data transparent for consumers.

**Core value propositions:**
- Transparent fee structures (fees are negotiable!)
- SEC data (verified, not self-reported)
- Help consumers negotiate fees

**DNA Framework:**
- Diligence = search/compare
- Negotiate = fee negotiation help
- Analyze = ongoing performance tracking

**Market opportunity:** $100T in wealth transfer from Baby Boomers over next decade

**Revenue model:**
- Current: Free tier + paid subscriptions
- Future: Sponsored profiles (firms pay)

**Desired data to add:**
- Firm valuations (revenue, EBITDA, multiples)
- M&A metrics (employees, revenue/employee)

**Statistical approach for missing data:** Bayesian hierarchical models

## Current Status

- Supabase connected to frontend
- Search page working with real data
- Firm profiles showing real data
- **Fee calculator widget live on all firm profiles**
  - Tiered bracket calculation, industry average comparison, growth projections
  - Industry averages computed from 207 firms / 5,412 fee tiers
- **Alerts MVP complete** (built 2/20)
  - Schema: `firm_snapshots`, `news_articles`, `firm_alerts`, `alert_subscriptions`, `user_notifications`
  - Workers: EDGAR RSS poller, ADV diff checker, news scraper, SEC enforcement, industry news
  - Running stats: 1,945 firms, 2,776+ articles, 1,500+ alerts, 1,000+ snapshots
  - **Issue**: Fuzzy matching producing false positives (generic firm names like CRD 158369 matching 30+ articles). Needs tightening.
  - APIs: `/api/alerts/firm/[crd]`, `/api/alerts/news/[crd]`, user alerts/subscriptions
  - Frontend: `FirmAlerts.tsx` component on firm profile pages
  - Cron jobs: EDGAR (15min), ADV Diff (6hr), News Scraper (hourly), SEC Enforcement (hourly), Industry News (hourly)
  - Free tier = last 7 days, paid = full history
- **Directory page updated** (2/21): Now displays `display_name` from firm_names table alongside primary business name
- **RegulatoryDisclosures.tsx deployed** (2/22): New disclosure badge + accordion component on firm profiles with severity-coded sections
- **Firm scores worker created** (2/22): Calculates composite scores (fee competitiveness, AUM growth, client growth, advisor bandwidth, etc.) - pending table creation
- Logo scraping in test phase (45% hit rate)
- Dev server running at localhost:3001
- **Issues:**
  - Fuzzy matching producing false positives (generic firm names like CRD 158369 matching 30+ articles). Needs tightening.
  - ADV Diff Checker generating ~1126 false positives per run (58% of firms showing "fee schedule changed" - unrealistic, needs threshold tuning)

## Daily Self Review Rules (as of 2/23/2026)

During daily reviews, Maxwell will:
1. **Past due tasks:** Remind Alex of any incomplete tasks past their deadline
2. **3 days out:** Remind Alex of tasks due within 3 days
3. **Daily until done:** Continue reminding on each day until completed

## Notes

- Product roadmap updated with proprietary data strategy:
  - Litigation, alerts, disclosure scores, growth tags for Day 1
  - Focus on data abstraction to create moat
  - Incremental workflows for progressive momentum
- Alerts MVP delivered — workers running via cron, frontend component live
- Two-tier pricing model: Consumer $200/yr, Enterprise $1K/yr (annual vs monthly TBD)

## Command Center — Personal Task Board

**Purpose:** Personal kanban task board for Alex's productivity — separate from FAR business.

**Location:** localhost:3333 (Next.js app in `/Users/alex/.openclaw/workspace/command-center`)

**Tech:** Next.js with tasks.json backing store, local dev server.

**Status:** Running on Mac mini, accessible at http://localhost:3333

## Standing Proactive Tasks (approved 2/18)

Alex approved these as low-risk autonomous work to rotate through during heartbeats/morning briefs:

**Research & Data**
- Competitor analysis: SmartAsset, AdvisorInfo, BrokerCheck — feature gaps, UX patterns, pricing
- Pricing benchmarks for FAR's consumer/enterprise tiers (comparable SaaS in fintech/wealth)
- Industry reports: wealth transfer trends, RIA M&A activity, fee compression data

**Organization & Maintenance**
- Codebase cleanup and documentation updates
- Memory file consolidation, keep MEMORY.md current
- Command Center task board — prioritize and update tasks
- Git commit and push completed work

Flag findings that warrant action; don't just file them away.
