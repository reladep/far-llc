# FAR, LLC — News Alerts Feature Spec

**Author:** FAR Product Team
**Date:** 2026-02-19
**Status:** Draft
**Version:** 1.0

---

## Executive Summary

FAR makes SEC/regulatory data about RIA firms transparent for consumers. News Alerts extends this by surfacing real-time events — enforcement actions, fee changes, M&A, personnel moves — tied to specific firms. No competitor does firm-specific alerting well. This is a defensible moat.

The approach: ingest from free regulatory feeds + Google News RSS (all free, ~$10/mo total infrastructure). No paid news APIs needed — the moat is in SEC data nobody else surfaces, not repackaged Benzinga headlines.

---

## 1. Data Sources

### 1.1 SEC EDGAR (Primary — MVP)

| Feed | URL | Format | Update Frequency | Cost |
|------|-----|--------|-------------------|------|
| Full-Text Search RSS | `https://efts.sec.gov/LATEST/search-index?q=...&dateRange=custom&startdt=...&enddt=...` | JSON | Real-time | **Free** |
| EDGAR RSS (company filings) | `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=...&type=...&dateb=&owner=include&count=40&search_text=&action=getcompany&output=atom` | Atom/XML | ~15 min delay | **Free** |
| EDGAR Full-Text Search API | `https://efts.sec.gov/LATEST/search-index` | JSON | Near real-time | **Free** |
| SEC Enforcement Actions RSS | `https://www.sec.gov/rss/litigation/litreleases.xml` | RSS/XML | Daily | **Free** |
| SEC Administrative Proceedings | `https://www.sec.gov/rss/litigation/admin.xml` | RSS/XML | Daily | **Free** |
| IAPD (Investment Adviser Public Disclosure) | `https://api.sec.gov/...` | JSON | Daily bulk | **Free** |

**Key filings to monitor:**
- **Form ADV** — firm registration, fee schedules, AUM, disciplinary history, personnel
- **Form ADV-W** — firm withdrawal (shutting down or switching regulators)
- **Form ADV-E** — surprise examination reports
- **Form D** — private fund offerings
- **Form PF** — private fund reporting (large advisers)

**Rate limits:** SEC EDGAR allows 10 requests/second with a User-Agent header identifying your app. No API key needed. Must include contact email in User-Agent.

**Opinion:** This is the single best free data source in fintech. Most competitors don't even parse it properly. Our MVP should nail EDGAR before touching anything else.

### 1.2 Google News RSS (Primary News Source — MVP)

| Provider | Coverage | Pricing | Rate Limits | Quality |
|----------|----------|---------|-------------|---------|
| **Google News RSS** | Aggregated news from all publishers | **Free** | ~100 req/hr (stagger to avoid throttling) | High for RIA-specific queries with good search terms |

**How it works:**
```
https://news.google.com/rss/search?q="Firm+Name"+investment+advisor&hl=en-US
```

**Targeted query patterns:**
- `"Firm Name" SEC enforcement`
- `"Firm Name" lawsuit OR complaint`
- `"CIO Name" leaves OR joins OR appointed`
- `"Firm Name" acquired OR merger`

**What it catches that EDGAR doesn't:**
- Press coverage of lawsuits and settlements
- Executive moves reported by trade pubs (RIABiz, InvestmentNews, Citywire)
- Local news coverage of firm events
- M&A announcements before SEC filings

**Noise management:** Run results through a cheap LLM pass (Gemini Flash or gpt-4o-mini) to confirm: "Is this article actually about [Firm X, CRD #Y] the RIA?" Costs pennies per classification.

**Why not paid APIs (Benzinga, NewsAPI, etc.):**
- Most RIA firms don't make mainstream financial news — those APIs are built for tracking Apple/Tesla, not a $500M RIA in Connecticut
- Signal-to-noise ratio would be terrible at $500-1K/mo
- The high-value data (SEC actions, fee changes, AUM shifts) comes from EDGAR, not news outlets
- If demand emerges for broader news coverage later, paid APIs can be added as Tier 3

### 1.3 GlobeNewsWire RSS (Supplemental — Free)

| Source | Access | Format | Cost |
|--------|--------|--------|------|
| GlobeNewsWire RSS | Public RSS feeds | XML | **Free** |

Catches press releases for larger firms (M&A announcements, leadership changes). Low effort to add alongside Google News RSS.

### 1.4 FINRA BrokerCheck

| Source | Access | Format | Cost |
|--------|--------|--------|------|
| BrokerCheck website | Scraping (no official API) | HTML | **Free** (legally gray) |
| FINRA Gateway API | Undocumented, used by BrokerCheck frontend | JSON | **Free** (unofficial) |
| FINRA Data bulk download | `https://www.finra.org/about/data` | CSV | **Free** (limited datasets) |

**Reality check:** FINRA has no public alerting API. BrokerCheck's internal API (`https://api.brokercheck.finra.org/search/firm?query=...`) is undocumented but functional. We can poll it for disclosure/complaint changes, but it's fragile. Build a resilient scraper with retry logic and change detection.

**Opinion:** Don't build the FINRA integration until Tier 2. It's unreliable and the data overlaps significantly with Form ADV disclosures already in EDGAR.

### 1.5 State Regulatory Actions

| Source | Coverage | Access | Cost |
|--------|----------|--------|------|
| NASAA (North American Securities Administrators Association) | Aggregated state actions | Website scraping | **Free** |
| Individual state regulators | Per-state enforcement | Varies wildly (some RSS, most HTML) | **Free** |

**Opinion:** State regulatory data is a mess. 50+ jurisdictions with no standard format. Defer to Tier 3. For MVP/Tier 2, SEC + FINRA covers the vast majority of meaningful actions against RIAs.

---

## 2. Event Categories (Taxonomy)

### 2.1 Category Definitions

```typescript
enum AlertCategory {
  // Regulatory
  ENFORCEMENT_ACTION = 'enforcement_action',       // SEC/FINRA/state enforcement
  REGULATORY_FILING = 'regulatory_filing',          // ADV amendments, ADV-W, etc.
  COMPLIANCE_DEFICIENCY = 'compliance_deficiency',  // Exam findings, deficiency letters
  REGISTRATION_CHANGE = 'registration_change',      // New registration, withdrawal, state changes

  // Business Events
  MERGER_ACQUISITION = 'merger_acquisition',        // M&A activity
  KEY_PERSONNEL_CHANGE = 'key_personnel_change',    // CCO, CEO, portfolio manager changes
  OFFICE_CHANGE = 'office_change',                  // New offices, closures, relocations
  AUM_CHANGE = 'aum_change',                        // Significant AUM increases/decreases

  // Financial
  FEE_CHANGE = 'fee_change',                        // Advisory fee changes
  COMPENSATION_CHANGE = 'compensation_change',      // Compensation structure changes

  // Legal
  LITIGATION = 'litigation',                        // Lawsuits, arbitration
  COMPLAINT = 'complaint',                          // Client complaints
  DISCLOSURE = 'disclosure',                        // DRP disclosures (regulatory, criminal, civil)
}
```

### 2.2 Severity Levels

```typescript
enum AlertSeverity {
  CRITICAL = 'critical',   // Enforcement action, fraud charges, firm shutdown
  HIGH = 'high',           // Litigation, significant fee increases, key personnel departure
  MEDIUM = 'medium',       // AUM changes, office moves, routine ADV amendments
  LOW = 'low',             // Minor filing updates, routine registrations
  INFO = 'info',           // FYI — press mentions, industry news tangentially related
}
```

### 2.3 Detection Rules (MVP — Keyword/Regex)

| Category | Detection Signal | Source |
|----------|-----------------|--------|
| `ENFORCEMENT_ACTION` | Filing in SEC litigation RSS; keywords: "cease and desist", "bar", "suspension", "civil penalty" | SEC RSS |
| `REGULATORY_FILING` | Form type = ADV, ADV-W, ADV-E in EDGAR | EDGAR |
| `FEE_CHANGE` | ADV Part 2A amendment + diff in Item 5 (Fees and Compensation) | EDGAR ADV |
| `AUM_CHANGE` | ADV Item 5.F change > 20% from last filing | EDGAR ADV |
| `KEY_PERSONNEL_CHANGE` | ADV Schedule A/B changes (control persons) | EDGAR ADV |
| `REGISTRATION_CHANGE` | ADV-W filing (withdrawal) or new ADV filing | EDGAR |
| `MERGER_ACQUISITION` | ADV Item 1.M (successor firm), or news keywords: "acquired by", "merger", "acquires" | EDGAR + News |
| `LITIGATION` | ADV DRP amendments; news keywords: "lawsuit", "sued", "arbitration" | EDGAR + News |
| `COMPLIANCE_DEFICIENCY` | SEC exam results (typically not in EDGAR — usually from news/press releases) | News |

---

## 3. Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Data Sources                          │
│     SEC EDGAR     │  Google News RSS  │  GlobeNewsWire  │
└──────┬────────────┴────────┬──────────┴───────┬─────────┘
       │                    │                   │
       ▼                    ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│              Ingestion Workers (Cron)                    │
│  edgar-worker  │  google-news-worker  │  rss-worker     │
│  (every 15m)   │    (every 30m)       │  (every 30m)    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Classification Pipeline                     │
│                                                          │
│  Stage 1: Dedup → Already seen? Skip.                   │
│  Stage 2: Firm Match → CRD lookup, fuzzy name match     │
│  Stage 3: Categorize → Keyword/regex (Tier 1)           │
│                         LLM classification (Tier 2)      │
│  Stage 4: Score → Severity + relevance scoring           │
│  Stage 5: Store → Insert into alerts table               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Notification Dispatcher                     │
│  Check subscriptions → Filter by tier → Deliver          │
│  Email (Resend) │ Push (web-push) │ Webhook (enterprise) │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              API Layer (Next.js API Routes)              │
│  /api/alerts │ /api/alerts/feed │ /api/alerts/subscribe  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              UI (Next.js Frontend)                       │
│  Firm Profile Alerts │ /alerts Feed │ Nav Badges         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Ingestion Workers

Workers run as standalone Node.js scripts triggered by cron (or Supabase Edge Functions if we want serverless). For MVP, use Vercel Cron or a simple cron on the server.

```typescript
// workers/edgar-worker.ts (pseudocode)
async function runEdgarWorker() {
  // 1. Fetch recent filings from EDGAR full-text search
  const filings = await fetchEdgarFilings({
    formTypes: ['ADV', 'ADV-W', 'ADV-E', 'ADV/A'],
    dateRange: 'last_24h',
  });

  // 2. Fetch enforcement actions
  const enforcements = await fetchEdgarRSS([
    'https://www.sec.gov/rss/litigation/litreleases.xml',
    'https://www.sec.gov/rss/litigation/admin.xml',
  ]);

  // 3. Dedup against existing alerts
  const newItems = await dedup([...filings, ...enforcements]);

  // 4. Match to firms in our DB
  const matched = await matchToFirms(newItems);

  // 5. Classify and store
  for (const item of matched) {
    const classified = await classify(item);
    await storeAlert(classified);
  }
}
```

**Cron schedule:**
| Worker | Frequency | MVP | Tier 2 | Tier 3 |
|--------|-----------|-----|--------|--------|
| `edgar-worker` | Every 15 min | ✅ | ✅ | ✅ |
| `edgar-adv-diff-worker` | Every 6 hours | ✅ | ✅ | ✅ |
| `google-news-worker` | Every 30 min | ✅ | ✅ | ✅ |
| `rss-worker` (GlobeNewsWire) | Every 30 min | ❌ | ✅ | ✅ |
| `finra-worker` | Every 1 hour | ❌ | ❌ | ✅ |
| `notification-dispatcher` | Every 5 min | ❌ | ✅ | ✅ |
| `state-regulatory-worker` | Every 24 hours | ❌ | ❌ | ✅ |

### 3.3 Firm Matching Logic

This is the hardest part. An article mentioning "Goldman Sachs Asset Management" needs to match to CRD #114214. An SEC filing for "GSAM Holdings LLC" needs to match too.

**Matching strategy (ordered by confidence):**

1. **CRD Number** (exact match, confidence: 1.0) — EDGAR filings include CRD in structured data
2. **SEC File Number** (exact match, confidence: 1.0) — 801-XXXXX maps to a specific RIA
3. **Firm legal name** (exact match, confidence: 0.95) — Direct DB lookup
4. **Firm DBA/trade name** (exact match, confidence: 0.9) — From ADV Item 1.B
5. **Fuzzy name match** (confidence: 0.5–0.85) — Levenshtein distance / trigram similarity
6. **Key personnel name + context** (confidence: 0.4–0.7) — Person mentioned + financial context
7. **Address match** (supplemental, confidence boost: +0.1) — Same city/state as known firm

```typescript
interface FirmMatch {
  firmId: string;
  crdNumber: string;
  confidence: number; // 0.0 - 1.0
  matchMethod: 'crd' | 'sec_file_number' | 'legal_name' | 'dba_name' | 'fuzzy_name' | 'personnel' | 'address';
}

// Minimum confidence to auto-assign: 0.7
// Between 0.4-0.7: flag for manual review
// Below 0.4: discard match
const CONFIDENCE_THRESHOLD_AUTO = 0.7;
const CONFIDENCE_THRESHOLD_REVIEW = 0.4;
```

**Fuzzy matching implementation:** Use PostgreSQL `pg_trgm` extension (already available in Supabase):

```sql
-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create index for fuzzy firm name matching
CREATE INDEX idx_firms_name_trgm ON firms USING gin (firm_name gin_trgm_ops);
CREATE INDEX idx_firms_dba_trgm ON firms USING gin (dba_name gin_trgm_ops);

-- Query: find firms matching a name with similarity > 0.3
SELECT id, firm_name, crd_number,
       similarity(firm_name, 'Goldman Sachs Asset Mgmt') AS sim_score
FROM firms
WHERE firm_name % 'Goldman Sachs Asset Mgmt'
ORDER BY sim_score DESC
LIMIT 5;
```

### 3.4 Classification Pipeline

**Tier 1 (MVP): Keyword/Regex**

```typescript
const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    category: 'enforcement_action',
    severity: 'critical',
    patterns: [
      /cease\s+and\s+desist/i,
      /civil\s+penalty/i,
      /barred?\s+from/i,
      /suspended?\s+from/i,
      /fraud/i,
      /violation\s+of\s+section/i,
      /investment\s+advisers?\s+act/i,
    ],
    sources: ['sec_litigation', 'sec_admin'],
  },
  {
    category: 'fee_change',
    severity: 'high',
    patterns: [
      /fee\s+schedule/i,
      /advisory\s+fee/i,
      /management\s+fee/i,
      /compensation.*change/i,
    ],
    formTypes: ['ADV/A'], // Only on ADV amendments
    requiresDiff: true,   // Must detect actual change in Item 5
  },
  {
    category: 'aum_change',
    severity: 'medium',
    detect: (current: ADVData, previous: ADVData) => {
      const pctChange = Math.abs(current.aum - previous.aum) / previous.aum;
      return pctChange > 0.2; // >20% change
    },
  },
  // ... more rules
];
```

**Tier 2: LLM Classification**

For news articles and ambiguous filings, use an LLM to classify:

```typescript
async function classifyWithLLM(item: RawAlert): Promise<Classification> {
  const prompt = `You are classifying a financial news item about a Registered Investment Advisor (RIA) firm.

Given the following text, classify it into exactly one category and assign a severity.

Categories: ${Object.values(AlertCategory).join(', ')}
Severities: critical, high, medium, low, info

Text: "${item.title} — ${item.summary}"

Respond in JSON:
{
  "category": "...",
  "severity": "...",
  "confidence": 0.0-1.0,
  "reasoning": "one sentence"
}`;

  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cheap + fast enough for classification
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  return JSON.parse(result.choices[0].message.content);
}
```

**Cost estimate for LLM classification:** ~$0.15 per 1,000 articles with gpt-4o-mini (avg 500 input tokens + 100 output tokens per classification).

### 3.5 Storage Schema

```sql
-- ============================================
-- ALERTS: Core alert/event records
-- ============================================
CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source identification
  source          TEXT NOT NULL,           -- 'edgar', 'benzinga', 'google_news', 'finra', 'globenewswire'
  source_id       TEXT NOT NULL,           -- Unique ID from source (filing accession number, article ID, etc.)
  source_url      TEXT,                    -- Link to original source
  
  -- Content
  title           TEXT NOT NULL,
  summary         TEXT,                    -- Short summary (max 500 chars)
  body            TEXT,                    -- Full text (if available)
  
  -- Classification
  category        TEXT NOT NULL,           -- AlertCategory enum value
  severity        TEXT NOT NULL DEFAULT 'info', -- AlertSeverity enum value
  confidence      NUMERIC(3,2) DEFAULT 1.0,    -- Classification confidence (0.00 - 1.00)
  classified_by   TEXT NOT NULL DEFAULT 'keyword', -- 'keyword', 'llm', 'manual'
  
  -- Firm association
  firm_id         UUID REFERENCES firms(id),
  crd_number      TEXT,
  match_confidence NUMERIC(3,2),          -- Firm matching confidence
  match_method    TEXT,                    -- How firm was matched
  
  -- Metadata
  published_at    TIMESTAMPTZ NOT NULL,   -- When the event occurred / was published
  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Filing-specific (nullable, for EDGAR)
  form_type       TEXT,                    -- 'ADV', 'ADV-W', 'ADV/A', etc.
  accession_number TEXT,                   -- SEC accession number
  filing_date     DATE,
  
  -- Scoring (Tier 2+)
  relevance_score NUMERIC(5,2) DEFAULT 0, -- Computed relevance score
  materiality_score NUMERIC(5,2) DEFAULT 0, -- How material is this event (Tier 3)
  
  -- Status
  status          TEXT NOT NULL DEFAULT 'active', -- 'active', 'archived', 'retracted', 'duplicate'
  reviewed        BOOLEAN DEFAULT FALSE,
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate ingestion
  UNIQUE(source, source_id)
);

-- Indexes
CREATE INDEX idx_alerts_firm_id ON alerts(firm_id);
CREATE INDEX idx_alerts_firm_published ON alerts(firm_id, published_at DESC);
CREATE INDEX idx_alerts_category ON alerts(category);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_published_at ON alerts(published_at DESC);
CREATE INDEX idx_alerts_source ON alerts(source);
CREATE INDEX idx_alerts_crd ON alerts(crd_number);
CREATE INDEX idx_alerts_status ON alerts(status) WHERE status = 'active';

-- ============================================
-- ALERT_SUBSCRIPTIONS: User -> Firm subscriptions
-- ============================================
CREATE TABLE alert_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  
  -- Notification preferences
  notify_email    BOOLEAN DEFAULT FALSE,
  notify_push     BOOLEAN DEFAULT FALSE,
  notify_in_app   BOOLEAN DEFAULT TRUE,
  
  -- Filters
  min_severity    TEXT DEFAULT 'low',      -- Only alert on this severity or above
  categories      TEXT[],                  -- NULL = all categories; or subset
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, firm_id)
);

CREATE INDEX idx_alert_subs_user ON alert_subscriptions(user_id);
CREATE INDEX idx_alert_subs_firm ON alert_subscriptions(firm_id);

-- ============================================
-- ALERT_DELIVERIES: Delivery tracking
-- ============================================
CREATE TABLE alert_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id        UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES alert_subscriptions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Delivery
  channel         TEXT NOT NULL,           -- 'email', 'push', 'in_app', 'webhook'
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  
  -- Tracking
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ,
  clicked_at      TIMESTAMPTZ,
  
  error_message   TEXT,
  retry_count     INT DEFAULT 0,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliveries_alert ON alert_deliveries(alert_id);
CREATE INDEX idx_deliveries_user ON alert_deliveries(user_id);
CREATE INDEX idx_deliveries_status ON alert_deliveries(status) WHERE status = 'pending';
CREATE INDEX idx_deliveries_sub ON alert_deliveries(subscription_id);

-- ============================================
-- ALERT_READS: Track which alerts a user has seen
-- ============================================
CREATE TABLE alert_reads (
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id        UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, alert_id)
);

-- ============================================
-- INGESTION_LOG: Track worker runs for debugging
-- ============================================
CREATE TABLE alert_ingestion_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker          TEXT NOT NULL,           -- 'edgar-worker', 'news-worker', etc.
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  items_fetched   INT DEFAULT 0,
  items_new       INT DEFAULT 0,
  items_matched   INT DEFAULT 0,
  error_message   TEXT,
  metadata        JSONB
);

CREATE INDEX idx_ingestion_log_worker ON alert_ingestion_log(worker, started_at DESC);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_reads ENABLE ROW LEVEL SECURITY;

-- Alerts: anyone can read active alerts
CREATE POLICY "alerts_read" ON alerts
  FOR SELECT USING (status = 'active');

-- Subscriptions: users can only manage their own
CREATE POLICY "subs_select" ON alert_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subs_insert" ON alert_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subs_update" ON alert_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "subs_delete" ON alert_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Deliveries: users can only see their own
CREATE POLICY "deliveries_select" ON alert_deliveries
  FOR SELECT USING (auth.uid() = user_id);

-- Reads: users can only manage their own
CREATE POLICY "reads_select" ON alert_reads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reads_insert" ON alert_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3.6 ADV Diffing Strategy

The highest-value alerts come from detecting *changes* between ADV filings. When a firm files an ADV amendment, we diff against the previous version:

```typescript
interface ADVDiff {
  firmId: string;
  crdNumber: string;
  previousFilingDate: Date;
  currentFilingDate: Date;
  changes: ADVChange[];
}

interface ADVChange {
  section: string;     // 'Item 5.A' (fees), 'Item 5.F' (AUM), 'Schedule A' (control persons)
  field: string;
  previousValue: any;
  currentValue: any;
  changeType: 'added' | 'removed' | 'modified';
  alertCategory: AlertCategory;
  severity: AlertSeverity;
}

// Priority sections to diff:
// Item 1.M  — Successor firm info (M&A)
// Item 5.A  — Advisory fee schedules
// Item 5.F  — AUM
// Item 5.G  — Number of clients
// Item 11   — Disciplinary information
// Schedule A — Direct owners and executive officers
// Schedule B — Indirect owners
// DRP pages — Disclosure Reporting Pages
```

---

## 4. Tiered Rollout

### Tier 1 — MVP

**Scope:** SEC EDGAR + Google News RSS, keyword/LLM classification, display on firm profiles.

**What ships:**
- `edgar-worker` running every 15 minutes, ingesting filings + enforcement actions
- `edgar-adv-diff-worker` running every 6 hours, diffing ADV amendments
- `google-news-worker` running every 30 minutes, pulling firm-specific news via RSS
- Keyword/regex classification for EDGAR filings
- Lightweight LLM pass (Gemini Flash) for Google News articles — confirms firm match and classifies (~$5/mo)
- Firm matching by CRD number, exact legal name, and basic fuzzy matching
- `alerts` table populated
- Alert feed component on firm profile pages (last 7 days for free, all for paid)
- Basic `/api/alerts?firmId=X` endpoint
- No notifications, no subscriptions, no personalized feed

**What it proves:**
- Pipeline works end-to-end
- Data quality is sufficient from free sources
- Users actually look at alerts on firm profiles
- Foundation for Tier 2

**Estimated effort:** 3-4 weeks (1 engineer)
**Monthly cost: ~$50** (existing Supabase/Vercel + pennies in LLM classification)

### Tier 2 — Subscriptions + Notifications

**Scope:** Add subscriptions, email notifications, personalized feed, GlobeNewsWire.

**What ships:**
- GlobeNewsWire RSS worker (press releases — free)
- Enhanced LLM classification with relevance scoring
- Fuzzy firm name matching via `pg_trgm`
- Subscription system (user subscribes to firms)
- Email notifications via Resend (already in stack presumably)
- `/api/alerts/feed` — personalized feed based on subscriptions
- `/api/alerts/subscribe` and `/api/alerts/unsubscribe`
- Dedicated `/alerts` page with filterable feed
- Alert badges in navigation
- Relevance scoring (combination of severity, recency, source quality)
- Paid tier: full history, email notifications, export to CSV

**Estimated effort:** 5-6 weeks (1-2 engineers)
**Monthly cost: ~$75** (existing infra + Resend for emails + LLM classification)

### Tier 3 — Intelligence Platform

**Scope:** Curated feed, push notifications, cross-firm analytics, enterprise features. Paid APIs only if demand warrants.

**What ships:**
- FINRA BrokerCheck integration
- State regulatory action ingestion (top 10 states first)
- *Optional:* Benzinga or NewsAPI integration if users demand broader news coverage
- Push notifications (web-push)
- Materiality scoring (LLM-assessed impact severity)
- Cross-firm pattern detection ("3 firms in same city all had fee increases this quarter")
- Curated weekly digest emails
- Enterprise: webhook integrations, API access, bulk alert export
- Admin dashboard for manual review/curation
- Alert deduplication across sources (same event from Benzinga + SEC = one alert)

**Estimated effort:** 8-10 weeks (2 engineers)

---

## 5. API Endpoints

### 5.1 GET `/api/alerts`

Fetch alerts for a specific firm.

```typescript
// Request
GET /api/alerts?firmId=uuid&page=1&limit=20&category=enforcement_action&severity=high&since=2026-01-01

// Response
{
  "alerts": [
    {
      "id": "uuid",
      "title": "SEC Charges XYZ Advisors with Misleading Fee Disclosures",
      "summary": "The SEC announced charges against...",
      "category": "enforcement_action",
      "severity": "critical",
      "source": "sec_litigation",
      "sourceUrl": "https://www.sec.gov/litigation/...",
      "publishedAt": "2026-02-18T14:30:00Z",
      "firmId": "uuid",
      "crdNumber": "123456",
      "formType": null,
      "isRead": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "hasMore": true
  }
}

// Access control:
// - Free users: only alerts from last 7 days
// - Paid users: full history
// - Unauthenticated: last 3 alerts only (teaser)
```

### 5.2 GET `/api/alerts/feed`

Personalized alert feed based on user subscriptions.

```typescript
// Request (authenticated)
GET /api/alerts/feed?page=1&limit=50&categories=enforcement_action,fee_change&minSeverity=medium

// Response
{
  "alerts": [...], // Same alert shape as above, across all subscribed firms
  "pagination": {...},
  "subscriptionCount": 12 // Number of firms user follows
}

// Sorting: by publishedAt DESC, with critical/high severity boosted
// Requires: paid tier
```

### 5.3 POST `/api/alerts/subscribe`

```typescript
// Request (authenticated)
POST /api/alerts/subscribe
{
  "firmId": "uuid",
  "notifyEmail": true,
  "notifyPush": false,
  "minSeverity": "medium",
  "categories": null  // null = all categories
}

// Response
{
  "subscription": {
    "id": "uuid",
    "firmId": "uuid",
    "notifyEmail": true,
    "notifyPush": false,
    "minSeverity": "medium",
    "categories": null,
    "createdAt": "2026-02-19T15:00:00Z"
  }
}

// Limits:
// - Free: 3 firm subscriptions, in-app only
// - Paid: 50 firm subscriptions, email + push
// - Enterprise: unlimited, + webhooks
```

### 5.4 DELETE `/api/alerts/subscribe`

```typescript
// Request (authenticated)
DELETE /api/alerts/subscribe
{
  "firmId": "uuid"
}

// Response
{ "success": true }
```

### 5.5 POST `/api/alerts/mark-read`

```typescript
// Request (authenticated)
POST /api/alerts/mark-read
{
  "alertIds": ["uuid1", "uuid2"]
}

// Response
{ "markedRead": 2 }
```

### 5.6 GET `/api/alerts/stats` (Tier 2+)

```typescript
// Request
GET /api/alerts/stats?firmId=uuid

// Response
{
  "firmId": "uuid",
  "totalAlerts": 47,
  "last30Days": 5,
  "bySeverity": { "critical": 1, "high": 3, "medium": 12, "low": 20, "info": 11 },
  "byCategory": { "regulatory_filing": 25, "enforcement_action": 1, ... },
  "lastAlertAt": "2026-02-18T14:30:00Z"
}
```

---

## 6. UI Components

### 6.1 Firm Profile — Alert Feed

Location: Below existing firm data on `/firms/[crd]` page.

```
┌─────────────────────────────────────────────────┐
│  📢 Recent Alerts                    [Subscribe]│
│                                                  │
│  🔴 CRITICAL — Feb 18, 2026                     │
│  SEC Charges XYZ Advisors with Misleading        │
│  Fee Disclosures                                 │
│  Source: SEC Litigation Release                   │
│                                                  │
│  🟡 MEDIUM — Feb 15, 2026                       │
│  Form ADV Amendment Filed — Fee Schedule Updated │
│  Advisory fees increased from 1.0% to 1.25%     │
│  Source: SEC EDGAR                                │
│                                                  │
│  🟢 LOW — Feb 10, 2026                          │
│  Annual ADV Amendment Filed                       │
│  Source: SEC EDGAR                                │
│                                                  │
│  [Show more] (paid users)                        │
│  ── Free users see last 7 days ──               │
│  🔒 Unlock full alert history — Upgrade          │
└─────────────────────────────────────────────────┘
```

**Component:** `<FirmAlertFeed firmId={firm.id} />`

### 6.2 Dedicated `/alerts` Page (Tier 2+)

Full-page curated news feed for subscribed firms.

```
┌─────────────────────────────────────────────────────────────┐
│  📢 Your Alerts                                    [Filters]│
│                                                              │
│  Filters: [All Categories ▾] [All Severities ▾] [7d ▾]     │
│                                                              │
│  TODAY                                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔴 XYZ Advisors — SEC Enforcement Action               ││
│  │ SEC charges firm with misleading fee disclosures...     ││
│  │ 2 hours ago · SEC Litigation Release                    ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🟡 ABC Wealth Management — AUM Change                  ││
│  │ AUM decreased 28% from $2.1B to $1.5B                  ││
│  │ 5 hours ago · EDGAR ADV Filing                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  YESTERDAY                                                   │
│  ...                                                         │
│                                                              │
│  Not following any firms yet? [Browse Firms]                 │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Nav Badge

```
[Home] [Search] [Alerts 🔴3] [Account]
```

Badge shows count of unread alerts since last visit. Paid users only (free users see the alerts page but no badge/notification).

### 6.4 Subscription Toggle

On firm profile header:

```
┌────────────────────────────────────────────┐
│  Vanguard Group Inc.    CRD# 105958        │
│  AUM: $7.2T  |  Clients: 30M+             │
│                                             │
│  [🔔 Follow this Firm]  ← toggle button   │
│  or                                         │
│  [🔔 Following ✓] [⚙️]  ← with settings  │
└────────────────────────────────────────────┘
```

Settings popover: email on/off, min severity, category filters.

---

## 7. Monetization

### 7.1 Tier Breakdown

| Feature | Free | Paid ($19/mo) | Enterprise (custom) |
|---------|------|---------------|---------------------|
| Alerts on firm profiles | Last 7 days | Full history | Full history |
| Alert categories visible | All | All | All |
| Firm subscriptions | 3 firms | 50 firms | Unlimited |
| In-app notifications | ✅ | ✅ | ✅ |
| Email notifications | ❌ | ✅ | ✅ |
| Push notifications | ❌ | ✅ | ✅ |
| Personalized `/alerts` feed | ❌ | ✅ | ✅ |
| Export alerts (CSV) | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ |
| Webhook integrations | ❌ | ❌ | ✅ |
| Bulk alerts (portfolio) | ❌ | ❌ | ✅ |
| Weekly digest email | ❌ | ✅ | ✅ |

### 7.2 Conversion Funnel

1. User finds firm profile via search (organic SEO)
2. Sees alert feed — last 7 days free
3. Wants to follow the firm → signs up (free)
4. Hits 3-firm limit or wants email notifications → upgrades to paid
5. RIA compliance firms / due diligence shops → enterprise

**Opinion:** The free tier should be generous enough to demonstrate value. Showing alerts on firm profiles is the hook. The paywall should feel like "I want MORE of this" not "I can't see anything."

---

## 8. Competitive Analysis

### 8.1 Current Landscape

| Platform | Firm-Specific Alerts | News Feed | Regulatory Monitoring | Price |
|----------|---------------------|-----------|----------------------|-------|
| **FINRA BrokerCheck** | ❌ None | ❌ None | Static disclosures only | Free |
| **SEC IAPD** | ❌ None | ❌ None | Static data only | Free |
| **SmartAsset** | ❌ None | Generic articles | ❌ None | Free (lead gen) |
| **AdvisorInfo** | ❌ None | ❌ None | Static profiles | Free |
| **Wealthminder** | ❌ None | ❌ None | Basic alerts (defunct?) | Free |
| **RIA in a Box** | Compliance alerts (for RIAs) | Industry news | Regulatory tracking | $500+/mo (B2B) |
| **Advyzon/Orion** | ❌ (portfolio tools) | ❌ | ❌ | $5K+/mo |

### 8.2 The Gap

**Nobody does firm-specific, consumer-facing alerts.** Period.

- BrokerCheck shows disclosures but has no alerting — you'd have to manually check a firm's page every week
- SmartAsset writes generic "how to find an advisor" content, not firm-specific intelligence
- RIA in a Box does compliance monitoring but it's B2B (for the RIAs themselves) at enterprise pricing
- SEC EDGAR has all the data but is utterly unusable for consumers

### 8.3 FAR's Differentiation

1. **Firm-specific alerts tied to CRD numbers** — no one else does this for consumers
2. **ADV diff detection** — automatically surfacing fee increases, AUM drops, personnel changes from filing data
3. **Cross-source correlation** — SEC filing + news article + FINRA disclosure = comprehensive view
4. **Consumer-friendly language** — translating "Form ADV/A Item 5.E amendment" into "Fee schedule increased from 1.0% to 1.25%"
5. **Free tier with real value** — unlike compliance tools that start at $500/mo

This is a genuine moat. The data is public but the aggregation + matching + presentation layer is hard to replicate well.

---

## 9. Estimated Costs

### 9.1 API / Data Source Costs

| Source | MVP | Tier 2 | Tier 3 |
|--------|-----|--------|--------|
| SEC EDGAR | $0 | $0 | $0 |
| Google News RSS | $0 | $0 | $0 |
| GlobeNewsWire RSS | — | $0 | $0 |
| FINRA BrokerCheck | — | — | $0 (scraping) |
| Benzinga (optional) | — | — | $499/mo (only if demand warrants) |
| **Subtotal** | **$0/mo** | **$0/mo** | **$0-499/mo** |

### 9.2 LLM Classification Costs

Using gpt-4o-mini at ~$0.15/1K input + $0.60/1M output tokens:

| Scale | Articles/day | Monthly cost |
|-------|-------------|-------------|
| MVP (EDGAR + Google News) | ~300 items | ~$5/mo (LLM for news confirmation) |
| Tier 2 (+ GlobeNewsWire) | ~400 items | ~$7/mo |
| Tier 3 (+ FINRA + state) | ~600 items | ~$12/mo |

**Key insight:** LLM costs scale with *ingestion volume*, not user count. Whether you have 1K or 100K users, you classify the same articles. This is extremely cheap.

### 9.3 Infrastructure Costs

| Component | MVP | Tier 2 | Tier 3 |
|-----------|-----|--------|--------|
| Supabase (Pro) | $25/mo (already paying) | $25/mo | $25/mo |
| Vercel (Pro) | $20/mo (already paying) | $20/mo | $20/mo |
| Worker hosting (if not Vercel cron) | $0 | $5/mo (Fly.io) | $20/mo |
| Resend (email) | $0 | $20/mo (up to 50K emails) | $80/mo |
| Redis (alert dedup cache) | $0 | $0 (Upstash free) | $10/mo |
| **Subtotal** | **~$45/mo** | **~$70/mo** | **~$155/mo** |

### 9.4 Total Monthly Costs

| Tier | Data | LLM | Infra | **Total** |
|------|------|-----|-------|-----------|
| MVP | $0 | $5 | $45 | **~$50/mo** |
| Tier 2 | $0 | $7 | $70 | **~$77/mo** |
| Tier 3 | $0-499 | $12 | $155 | **~$167-666/mo** |

**Break-even at Tier 2:** $77/mo ÷ $19/user/mo = **5 paid users.** Trivially achievable.

**The key insight:** By using free data sources (EDGAR + Google News RSS), the entire alerts feature runs at near-zero marginal cost. The moat isn't in paying for data — it's in the aggregation, matching, and presentation layer.

---

## 10. Implementation Timeline

### MVP (Tier 1) — 3-4 Weeks

| Week | Deliverable |
|------|-------------|
| 1 | Database schema, EDGAR worker (filing ingestion), basic classification rules |
| 2 | ADV diff worker, Google News RSS worker, LLM confirmation pipeline |
| 3 | Firm matching (CRD + name + fuzzy), alert storage pipeline |
| 4 | API endpoint (`GET /api/alerts`), firm profile alert feed component, deploy |

**Prerequisites:** Existing firm data in Supabase with CRD numbers populated.

### Tier 2 — 5-6 Weeks (after MVP)

| Week | Deliverable |
|------|-------------|
| 1 | GlobeNewsWire RSS worker, enhanced classification pipeline |
| 2 | Relevance scoring, advanced fuzzy matching tuning |
| 3 | Subscription system, `/api/alerts/subscribe`, `/api/alerts/feed` |
| 4 | Email notification dispatcher (Resend), notification preferences |
| 5 | `/alerts` page UI, nav badges, subscription toggle on firm profiles |
| 6 | Paywall enforcement, paid tier integration, testing |

### Tier 3 — 8-10 Weeks (after Tier 2)

| Week | Deliverable |
|------|-------------|
| 1-2 | FINRA BrokerCheck integration, cross-source deduplication |
| 3-4 | State regulatory workers (top 10 states), push notifications |
| 5-6 | Materiality scoring, cross-firm pattern detection |
| 7-8 | Enterprise features: webhooks, API access, bulk export |
| 9-10 | Admin dashboard, curated digest emails, polish |

### Total: ~17-20 weeks from start to full platform

---

## Appendix A: Open Questions

1. **ADV parsing:** Do we parse the XML/SGML structured data from EDGAR, or use the full-text search API? Structured parsing is more reliable but requires understanding the ADV schema deeply.

2. **Historical backfill:** Should MVP include historical alerts (backfill from EDGAR going back 1-2 years) or start fresh? Recommendation: backfill last 90 days for MVP to have content at launch.

3. **Alert quality threshold:** What's our minimum confidence for showing alerts? Recommendation: 0.7 for auto-display, 0.4-0.7 for manual review queue.

4. **Firm coverage:** Do we alert on all ~15,000 SEC-registered RIAs or only firms already in our database? Recommendation: all firms — alerts drive discovery of firms not yet in our DB.

5. **ADV diff granularity:** How deep do we diff ADV amendments? Item-level? Field-level? Recommendation: start with key items (5.A fees, 5.F AUM, 11 disclosures, Schedule A personnel) and expand.

## Appendix B: SEC EDGAR API Reference

```
# Full-text search (filings)
GET https://efts.sec.gov/LATEST/search-index?q="investment+adviser"&dateRange=custom&startdt=2026-02-18&enddt=2026-02-19&forms=ADV,ADV-W

# Company filings by CRD (via SEC file number)
GET https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=&CIK=801-12345&type=ADV&dateb=&owner=include&count=40&search_text=&action=getcompany&output=atom

# EDGAR company search
GET https://efts.sec.gov/LATEST/search-index?q=%22firm+name%22&forms=ADV

# Litigation releases RSS
GET https://www.sec.gov/rss/litigation/litreleases.xml

# Administrative proceedings RSS  
GET https://www.sec.gov/rss/litigation/admin.xml

# Required headers
User-Agent: FAR-LLC alerts@far.com
```

## Appendix C: File Structure

```
/app
  /api
    /alerts
      route.ts              # GET /api/alerts?firmId=X
      /feed
        route.ts            # GET /api/alerts/feed
      /subscribe
        route.ts            # POST & DELETE /api/alerts/subscribe
      /mark-read
        route.ts            # POST /api/alerts/mark-read
      /stats
        route.ts            # GET /api/alerts/stats?firmId=X
  /alerts
    page.tsx                # /alerts — personalized feed page
  /firms/[crd]
    # Existing firm profile — add FirmAlertFeed component
/components
  /alerts
    FirmAlertFeed.tsx       # Alert list on firm profile
    AlertCard.tsx           # Individual alert card
    AlertFeed.tsx           # Full-page alert feed
    AlertFilters.tsx        # Category/severity/date filters
    SubscribeButton.tsx     # Follow/unfollow firm toggle
    AlertBadge.tsx          # Nav notification badge
/workers
  edgar-worker.ts           # SEC EDGAR filing ingestion
  edgar-adv-diff-worker.ts  # ADV amendment diffing
  google-news-worker.ts     # Google News RSS ingestion
  rss-worker.ts             # GlobeNewsWire RSS (Tier 2+)
  finra-worker.ts           # FINRA BrokerCheck polling (Tier 3)
  notification-dispatcher.ts # Send email/push notifications
/lib
  /alerts
    classify.ts             # Classification pipeline
    match-firm.ts           # Firm matching logic
    dedup.ts                # Deduplication
    score.ts                # Relevance/materiality scoring
    parse-adv.ts            # ADV filing parser + differ
```
