# FAR Scaling Roadmap — Path to $1M ARR

_Last updated: 2026-02-17_

**Target:** 5,000 users × $200/yr = $1M ARR

---

## Key Metrics

| Metric | Target |
|--------|--------|
| CAC | < $30 |
| LTV | $600 ($200 × 3yr) |
| Viral Coefficient | > 1.1 |
| Quiz → Paid Conversion | 3-5% |
| Monthly Churn | < 5% |

---

## Phase 1 — Months 1-3 (Foundation → $10K MRR)

### 1. Advisor Alerts (Advisor Tracking)
**Status:** 🔴 Not started
**What:** Monitor any advisor — get notified on SEC filing changes, AUM shifts, fee changes, disclosure events.
**Why:** Quick to build (you already ingest SEC data), creates recurring engagement, sticky retention loop. Users come back weekly.
**Revenue:** $5-10/month add-on or included in paid tier.
**Build:** Email + in-app notifications. Automated diff detection on SEC data ingestion. Dashboard at `/dashboard/alerts`.

### 2. Fee Negotiator Tool
**Status:** 🔴 Not started
**What:** User enters current advisor's fee → FAR shows market rate + generates talking points/PDF for negotiation.
**Why:** High value, highly shareable ("my advisor is overcharging me!"). Core of the "Negotiate" in DNA framework.
**Moat:** SEC data is the source of truth for "market rate."
**Build:** Simple form → compare to firm median → generated PDF with negotiation script.

### 3. Referral Engine
**Status:** 🔴 Not started
**What:** Users refer friends → both get 1 month free ($20 value). Unique referral links, tracked in-app.
**Why:** Viral coefficient > 1 = compounding growth. Lowest CAC channel.
**Build:** Referral link generation, tracking, reward fulfillment.

---

## Phase 2 — Months 4-6 (Growth → $50K MRR)

### 4. Advisor Match Quiz
**Status:** 🔴 Not started
**What:** 30-second quiz: "Find your perfect advisor." Inputs: location, assets, goals. Outputs: top 3 matches.
**Why:** High-intent lead capture. Converts casual browsers to users. Shareable on social.
**Data:** NerdWallet/Policygenius convert 3-5% of quiz users.
**Build:** 5-question flow → matching algorithm → top 3 recommendations.

### 5. State-of-Market Report
**Status:** 🔴 Not started
**What:** Quarterly report: average fees by state, fastest-growing firms, fee trends, industry consolidation.
**Why:** Media pickup, backlinks, authority. Gated by email = lead magnet.
**Build:** 10-page PDF from existing data. Gated download. Promoted on social + PR.

---

## Phase 3 — Months 7-12 (Moat → $83K MRR = $1M ARR)

### 6. Verified Reviews
**Status:** 🔴 Not started
**What:** User-submitted, moderated reviews from verified clients. Glassdoor for wealth management.
**Why:** Network effects = hard to replicate. Massive trust signal.
**Build:** Review form → moderation queue → public on firm profiles.

### 7. Wealth Transfer Content Hub
**Status:** 🔴 Not started
**What:** Content hub targeting $100T generational wealth transfer. Guides: "How to inherit wealth," "Questions for your inherited advisor."
**Why:** SEO domination. "Wealth transfer" search volume growing 40% YoY. Long-tail keywords.
**Build:** Blog + guides + "find advisor" CTAs.

### 8. Flat-Fee Advisor Directory
**Status:** 🔴 Not started
**What:** Curated, filterable directory of flat-fee/fee-only advisors (vs. AUM-based).
**Why:** Growing anti-AUM-fee movement. Clear differentiation.
**Build:** Flag firms with flat-fee structures in DB. Primary filter on search.

### 9. Advisor CRM Connect (Enterprise)
**Status:** 🔴 Not started
**What:** Advisors claim profiles, respond to leads/reviews, integrate with CRM. $1,000/yr enterprise tier.
**Why:** B2B revenue stream. Advisors pay for leads + visibility.
**Build:** "Claim your profile" flow → lead inbox → CRM integrations (HubSpot, Salesforce).

---

## Pricing Model (Beta — Updated 2026-02-17)

| Tier | Price | Includes |
|------|-------|----------|
| **Data Access** | $20/mo (paid annually = $240/yr) | Full platform: search, compare, alerts, fee data, SEC-verified |
| **Advisory Intro** | $50/mo (paid annually = $600/yr) | Tier 1 + 1-on-1 intro call + curated 3-firm list + annual check-in |
| **Full Advisory** | Custom (scope-dependent) | Tier 2 + portfolio reviews, asset allocation, join meetings |

**Note:** Tier 3 is Alex's time — scales with value delivered, not software seats.

**Affiliate revenue (future):** Lawyers, accountants, brokerages, real estate, insurance — only if genuinely useful.

---

## Immediate Action Items

- [ ] Build Advisor Alerts (Phase 1, Priority #1)
- [ ] Arrow key navigation on search
- [ ] Full data integrity audit
- [ ] Decide annual vs. monthly pricing
- [ ] Revisit logo strategy
