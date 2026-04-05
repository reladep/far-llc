-- =============================================================
-- 007_alert_digests.sql — Digest preferences + subscription limits
-- Adds digest frequency to user preferences, tracks digest sends,
-- and prepares for tier-based subscription limits.
-- =============================================================

-- 1. User alert preferences — one row per user for global settings
CREATE TABLE public.user_alert_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_frequency text NOT NULL DEFAULT 'weekly'
    CHECK (digest_frequency IN ('daily', 'weekly', 'monthly', 'none')),
  digest_day smallint DEFAULT 1
    CHECK (digest_day BETWEEN 0 AND 6),  -- 0=Sun, 1=Mon ... for weekly
  digest_time time DEFAULT '07:00',      -- preferred delivery time (UTC)
  updated_at timestamptz DEFAULT now()
);

-- RLS: users manage their own preferences
ALTER TABLE public.user_alert_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs_read_own" ON public.user_alert_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prefs_insert_own" ON public.user_alert_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prefs_update_own" ON public.user_alert_preferences FOR UPDATE USING (auth.uid() = user_id);

-- 2. Digest log — tracks each digest email sent to prevent duplicates
CREATE TABLE public.alert_digest_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_type text NOT NULL,           -- 'daily', 'weekly', 'monthly'
  period_start timestamptz NOT NULL,   -- start of the digest window
  period_end timestamptz NOT NULL,     -- end of the digest window
  event_count int NOT NULL DEFAULT 0,
  firm_count int NOT NULL DEFAULT 0,
  sent_at timestamptz DEFAULT now()
);

CREATE INDEX idx_digest_log_user ON public.alert_digest_log(user_id);
CREATE UNIQUE INDEX idx_digest_log_dedup ON public.alert_digest_log(user_id, digest_type, period_start);

ALTER TABLE public.alert_digest_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "digest_log_read_own" ON public.alert_digest_log FOR SELECT USING (auth.uid() = user_id);

-- 3. Add score_change alert type to the enum
ALTER TYPE public.alert_type ADD VALUE IF NOT EXISTS 'score_change';

-- 4. Add snapshot columns for score tracking
ALTER TABLE public.firm_snapshots
  ADD COLUMN IF NOT EXISTS visor_score numeric(5,1),
  ADD COLUMN IF NOT EXISTS disclosure_count int,
  ADD COLUMN IF NOT EXISTS fee_range_min numeric(5,3),
  ADD COLUMN IF NOT EXISTS fee_range_max numeric(5,3);

-- 5. Index for efficient event detection queries
CREATE INDEX IF NOT EXISTS idx_firm_alerts_crd_detected
  ON public.firm_alerts(crd, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_articles_crd_ingested
  ON public.news_articles(crd, ingested_at DESC);
