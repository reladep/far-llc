-- =============================================================
-- 004_alerts_mvp.sql — Alerts MVP schema
-- Tables: firm_snapshots, news_articles, firm_alerts, alert_subscriptions
-- =============================================================

-- 1. Firm snapshots — periodic copies of key firm fields for diffing
CREATE TABLE public.firm_snapshots (
  id bigserial PRIMARY KEY,
  crd bigint NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  aum bigint,
  total_accounts bigint,
  total_employees int,
  fee_tiers jsonb,               -- copy of fee schedule at snapshot time
  discretionary_aum bigint,
  non_discretionary_aum bigint,
  created_at timestamptz DEFAULT now(),
  UNIQUE(crd, snapshot_date)
);

CREATE INDEX idx_firm_snapshots_crd ON public.firm_snapshots(crd);

-- 2. News articles — scraped from Google News RSS per firm
CREATE TABLE public.news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crd bigint NOT NULL,            -- matched firm
  title text NOT NULL,
  url text NOT NULL,
  source text,                    -- e.g. 'Bloomberg', 'RIABiz'
  published_at timestamptz,
  snippet text,                   -- article excerpt
  relevance_score numeric(3,2),   -- LLM confidence 0-1
  matched_keywords text[],
  ingested_at timestamptz DEFAULT now(),
  UNIQUE(crd, url)
);

CREATE INDEX idx_news_articles_crd ON public.news_articles(crd);
CREATE INDEX idx_news_articles_published ON public.news_articles(published_at DESC);

-- 3. Firm alerts — the actual alert events
CREATE TYPE public.alert_type AS ENUM (
  'fee_change',
  'aum_change',
  'client_count_change',
  'employee_change',
  'disclosure',
  'news',
  'asset_allocation_change'
);

CREATE TYPE public.alert_severity AS ENUM ('low', 'medium', 'high');

CREATE TABLE public.firm_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crd bigint NOT NULL,
  alert_type public.alert_type NOT NULL,
  severity public.alert_severity DEFAULT 'medium',
  title text NOT NULL,
  summary text,                   -- human-readable description
  detail jsonb,                   -- structured data (old_value, new_value, etc.)
  news_article_id uuid REFERENCES public.news_articles(id),
  detected_at timestamptz DEFAULT now(),
  source text DEFAULT 'system'    -- 'edgar_rss', 'adv_diff', 'news_scraper'
);

CREATE INDEX idx_firm_alerts_crd ON public.firm_alerts(crd);
CREATE INDEX idx_firm_alerts_type ON public.firm_alerts(alert_type);
CREATE INDEX idx_firm_alerts_detected ON public.firm_alerts(detected_at DESC);

-- 4. Alert subscriptions — user preferences per firm
CREATE TABLE public.alert_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  crd bigint NOT NULL,
  alert_types public.alert_type[] DEFAULT ARRAY['fee_change','aum_change','disclosure','news']::public.alert_type[],
  notify_email boolean DEFAULT true,
  notify_in_app boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, crd)
);

CREATE INDEX idx_alert_subs_user ON public.alert_subscriptions(user_id);

-- 5. User notification log — tracks delivery to users
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id uuid REFERENCES public.firm_alerts(id) ON DELETE CASCADE,
  channel text DEFAULT 'in_app',  -- 'in_app', 'email'
  read boolean DEFAULT false,
  delivered_at timestamptz DEFAULT now(),
  read_at timestamptz,
  UNIQUE(user_id, alert_id, channel)
);

CREATE INDEX idx_user_notifications_user ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_unread ON public.user_notifications(user_id, read) WHERE read = false;

-- =============================================================
-- RLS Policies
-- =============================================================

-- firm_snapshots: public read (same as firmdata)
ALTER TABLE public.firm_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "firm_snapshots_public_read" ON public.firm_snapshots FOR SELECT USING (true);

-- news_articles: public read (free = 7 days, paid = all — enforced in API)
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_articles_public_read" ON public.news_articles FOR SELECT USING (true);

-- firm_alerts: public read
ALTER TABLE public.firm_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "firm_alerts_public_read" ON public.firm_alerts FOR SELECT USING (true);

-- alert_subscriptions: users manage their own
ALTER TABLE public.alert_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alert_subs_read_own" ON public.alert_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "alert_subs_insert_own" ON public.alert_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alert_subs_update_own" ON public.alert_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "alert_subs_delete_own" ON public.alert_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- user_notifications: users read their own
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_read_own" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
