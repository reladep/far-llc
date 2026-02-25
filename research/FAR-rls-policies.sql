-- ============================================================
-- FAR RLS Policies - Phase 2
-- User tier: Public (logged out) vs Paid (authenticated)
-- ============================================================

-- First, enable RLS on all tables
ALTER TABLE firm_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmdata_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmdata_feesandmins ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmdata_feetiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmdata_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmdata_growth_annual_bench ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmdata_growth_rate_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmdata_manual ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmdata_profile_text ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmdata_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmdata_website ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmdata_aum_segment_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 1. FIRM_LOGOS - All Public
-- ============================================================
DROP POLICY IF EXISTS "firm_logos_public_read" ON firm_logos;
CREATE POLICY "firm_logos_public_read" ON firm_logos
FOR SELECT USING (true);

-- ============================================================
-- 2. FIRMDATA_AUM_SEGMENT_STATS - All Private (analytics)
-- ============================================================
-- Only authenticated (paid) users can see AUM segment stats
DROP POLICY IF EXISTS "aum_segment_stats_paid_only" ON firmdata_aum_segment_stats;
CREATE POLICY "aum_segment_stats_paid_only" ON firmdata_aum_segment_stats
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- ============================================================
-- 3. FIRMDATA_CURRENT - Mixed
-- ============================================================
-- Create a view for public columns only
DROP VIEW IF EXISTS firmdata_current_public;
CREATE VIEW firmdata_current_public AS
SELECT 
  crd,
  filingid,
  sec_number,
  primary_business_name,
  private_residence_flag,
  latest_adv_filing,
  legal_entity_identifier,
  main_office_city,
  main_office_state,
  number_of_offices,
  services_financial_planning,
  services_mgr_selection,
  services_pension_consulting,
  services_port_management_bdcs,
  services_port_management_individuals,
  services_port_management_institutional,
  services_port_management_pooled,
  employee_total,
  employee_investment,
  legal_structure,
  -- State presence flags (public info)
  state_ak, state_al, state_ar, state_az, state_ca, state_co, state_ct,
  state_dc, state_de, state_fl, state_ga, state_hi, state_ia, state_id,
  state_il, state_in, state_ks, state_ky, state_la, state_ma, state_md,
  state_me, state_mi, state_mn, state_mo, state_ms, state_mt, state_nc,
  state_nd, state_ne, state_nh, state_nj, state_nm, state_nv, state_ny,
  state_oh, state_ok, state_or, state_pa, state_ri, state_sc, state_sd,
  state_tn, state_tx, state_ut, state_va, state_vt, state_wa, state_wi, state_wv
FROM firmdata_current;

-- Public can read from view
DROP POLICY IF EXISTS "firmdata_current_public_read" ON firmdata_current_public;
CREATE POLICY "firmdata_current_public_read" ON firmdata_current_public
FOR SELECT USING (true);

-- Full table: paid users only
DROP POLICY IF EXISTS "firmdata_current_paid_only" ON firmdata_current;
CREATE POLICY "firmdata_current_paid_only" ON firmdata_current
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- ============================================================
-- 4. FIRMDATA_FEESANDMINS - Private (proprietary extraction)
-- ============================================================
DROP POLICY IF EXISTS "feesandmins_paid_only" ON firmdata_feesandmins;
CREATE POLICY "feesandmins_paid_only" ON firmdata_feesandmins
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- ============================================================
-- 5. FIRMDATA_FEETIERS - Private (fee schedules)
-- ============================================================
DROP POLICY IF EXISTS "feetiers_paid_only" ON firmdata_feetiers;
CREATE POLICY "feetiers_paid_only" ON firmdata_feetiers
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- ============================================================
-- 6. FIRMDATA_GROWTH - Private (historical data)
-- ============================================================
DROP POLICY IF EXISTS "growth_paid_only" ON firmdata_growth;
CREATE POLICY "growth_paid_only" ON firmdata_growth
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- ============================================================
-- 7. FIRMDATA_GROWTH_ANNUAL_BENCH - Private (benchmarks)
-- ============================================================
DROP POLICY IF EXISTS "growth_annual_bench_paid_only" ON firmdata_growth_annual_bench;
CREATE POLICY "growth_annual_bench_paid_only" ON firmdata_growth_annual_bench
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- ============================================================
-- 8. FIRMDATA_GROWTH_RATE_RANKINGS - Private (proprietary rankings)
-- ============================================================
DROP POLICY IF EXISTS "growth_rankings_paid_only" ON firmdata_growth_rate_rankings;
CREATE POLICY "growth_rankings_paid_only" ON firmdata_growth_rate_rankings
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- ============================================================
-- 9. FIRMDATA_MANUAL - Private (manual overrides)
-- ============================================================
DROP POLICY IF EXISTS "manual_paid_only" ON firmdata_manual;
CREATE POLICY "manual_paid_only" ON firmdata_manual
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- ============================================================
-- 10. FIRMDATA_PROFILE_TEXT - Mixed
-- ============================================================
-- Create view for public columns
DROP VIEW IF EXISTS firmdata_profile_text_public;
CREATE VIEW firmdata_profile_text_public AS
SELECT 
  crd,
  firm_name
FROM firmdata_profile_text;

-- Public view
DROP POLICY IF EXISTS "profile_text_public_read" ON firmdata_profile_text_public;
CREATE POLICY "profile_text_public_read" ON firmdata_profile_text_public
FOR SELECT USING (true);

-- Full table: paid only
DROP POLICY IF EXISTS "profile_text_paid_only" ON firmdata_profile_text;
CREATE POLICY "profile_text_paid_only" ON firmdata_profile_text
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- ============================================================
-- 11. FIRMDATA_SUMMARY - Private (AI-generated)
-- ============================================================
DROP POLICY IF EXISTS "summary_paid_only" ON firmdata_summary;
CREATE POLICY "summary_paid_only" ON firmdata_summary
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- ============================================================
-- 12. FIRMDATA_WEBSITE - Mixed
-- ============================================================
-- Create view for public columns
DROP VIEW IF EXISTS firmdata_website_public;
CREATE VIEW firmdata_website_public AS
SELECT 
  crd,
  primary_business_name
FROM firmdata_website;

-- Public view
DROP POLICY IF EXISTS "website_public_read" ON firmdata_website_public;
CREATE POLICY "website_public_read" ON firmdata_website_public
FOR SELECT USING (true);

-- Full table: paid only
DROP POLICY IF EXISTS "website_paid_only" ON firmdata_website;
CREATE POLICY "website_paid_only" ON firmdata_website
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- ============================================================
-- NOTES:
-- ============================================================
-- 1. Users table must have 'subscription_tier' column with values: 'free', 'paid'
-- 2. Use public views in frontend for non-authenticated users
-- 3. Use full tables for authenticated paid users
-- 4. You'll need a users table with subscription_tier column
-- ============================================================
