-- Add results column to store saved match results snapshot
ALTER TABLE public.user_match_profiles
  ADD COLUMN IF NOT EXISTS results JSONB,
  ADD COLUMN IF NOT EXISTS results_saved_at TIMESTAMPTZ;
