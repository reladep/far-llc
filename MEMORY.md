# MEMORY.md — Long-term memory for Maxwell

_Last updated: 2026-03-14_

## System Info
- OpenClaw version: **2026.3.2** (updated from 2026.2.14 on 3/5/2026)
- Running on: Alex's Mac mini (Darwin 25.2.0, arm64)
- Dev server: localhost:3001

## About Alex

- VP of Research at large wealth management firm
- Asset allocator for UHNW clients ($50M+ to billionaires)
- Based in Manhattan, NYC
- Married ~2 years, wife is dermatologist with growing social media brand

## FAR, LLC — Alex's Company

**NOTE (March 2026):** Project formally called "FAR" is now branded as **Visor Index**. FAR Research LLC remains the legal entity, but the product is now called "Visor Index".

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
  - Workers: EDGAR RSS poller, ADV diff checker, news scraper
  - Running stats: 1,945 firms, 2,776+ articles, 1,500+ alerts, 1,000+ snapshots
  - **Issue**: Fuzzy matching producing false positives (generic firm names like CRD 158369 matching 30+ articles). Needs tightening.
  - APIs: `/api/alerts/firm/[crd]`, `/api/alerts/news/[crd]`, user alerts/subscriptions
  - Frontend: `FirmAlerts.tsx` component on firm profile pages
  - Cron jobs: EDGAR (15min), ADV Diff (6hr), News Scraper (hourly)
  - Free tier = last 7 days, paid = full history
  - **Resolved (3/1):** RIA M&A cron job removed — worker file didn't exist
- **Directory page updated** (2/21): Now displays `display_name` from firm_names table alongside primary business name
- **RegulatoryDisclosures.tsx deployed** (2/22): New disclosure badge + accordion component on firm profiles with severity-coded sections
- **Firm scores worker created** (2/22): Calculates composite scores (fee competitiveness, AUM growth, client growth, advisor bandwidth, etc.) — pending table creation
  - ⚠️ **Methodology needs revision:** Derivatives backwards, missing data = 0 penalty too harsh, growth dead zones, pure AUM bias. Needs rewrite before production.
- **/match and /match/results pages built** (2/25): 8-step questionnaire for user-to-firm matching with ranked results, match %, reason badges, Visor Score, and estimated fees
- **Visor Index static landing page** (3/4): Added `visor-index-homepage-live.html` and `visor_logo.png` to far/ repo — static HTML landing page for Visor Index product
- Logo scraping in test phase (45% hit rate)
- Dev server running at localhost:3001
- **Visor Index React/Vite Frontend (3/10):** New separate frontend created in `far/visor-index/` with:
  - Vite + React setup with multiple pages: Home, Dashboard, Search, Directory, Firm Profile, Compare, Negotiate, Pricing, Blog
  - Components: ScoreRing, Nav, Footer, useReveal hook
  - Running in parallel to Next.js frontend (dual frontend strategy)
- **Guide/Insights Page (3/13):** New content hub at `/guide`
  - Full listing page with client-side filtering (All/Editorial/Guides/Data Reports)
  - Navy featured hero, 3-col post grid, type tags, load-more (+6)
  - Newsletter signup strip
  - 10 static posts, detail page stubs
  - Auth-protected via middleware
- **Issues:**
  - Fuzzy matching producing false positives (generic firm names like CRD 158369 matching 30+ articles). Needs tightening.
  - ADV Diff Checker generating ~554 false positives per run (55% of firms showing "fee schedule changed" - unrealistic, needs threshold tuning)
  - RIA M&A Poller cron job failing — `workers/ria-ma.js` doesn't exist. Needs removal or worker creation.

- **Resolved Issues:**
  - Industry News Poller (2/26): `workers/industry-news.js` didn't exist, cron job removed
  - SEC Enforcement Poller (2/27): `workers/sec-enforcement.js` didn't exist, cron job removed
  - RIA M&A (3/1): Worker didn't exist, cron job removed

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
- **Blog ideas added (2/27):**
  - The $100T Transparency Gap (wealth transfer + Visor Index marketing)
  - Your Advisor Has a Criminal Record (disclosure data analysis) — most publishable soonest
  - The Fee Negotiation Nobody Has (fee negotiation)

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
