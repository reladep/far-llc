import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import SaveFirmButton from '@/components/firms/SaveFirmButton';
import FeeCalculator from '@/components/firms/FeeCalculator';
import FirmAlerts from '@/components/firms/FirmAlerts';
import RegulatoryDisclosures from '@/components/firms/RegulatoryDisclosures';
import FirmLogo from '@/components/firms/FirmLogo';
import ScoreRing from '@/components/firms/ScoreRing';
import AnimatedBarChart, { type BarData } from '@/components/firms/AnimatedBarChart';
import SectionNav from '@/components/firms/SectionNav';
import ExpandableText from '@/components/firms/ExpandableText';
import AnimatedBars from '@/components/firms/AnimatedBars';
import AnimatedRows from '@/components/firms/AnimatedRows';
import { getFirmScore } from '@/lib/scores';
import { getSimilarFirms, type SimilarFirm } from '@/lib/similar-firms';

// ─── Supabase client ──────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Interfaces (data layer — untouched) ─────────────────────────────────────
interface FirmData {
  crd: number;
  primary_business_name: string | null;
  main_office_city: string | null;
  main_office_state: string | null;
  main_office_street_1: string | null;
  main_office_street_2: string | null;
  main_office_zip: string | null;
  main_phone_number: string | null;
  aum: number | null;
  aum_discretionary: number | null;
  aum_non_discretionary: number | null;
  employee_total: number | null;
  employee_investment: number | null;
  client_hnw_number: number | null;
  client_non_hnw_number: number | null;
  client_pension_number: number | null;
  client_charitable_number: number | null;
  client_corporations_number: number | null;
  client_pooled_vehicles_number: number | null;
  client_other_number: number | null;
  client_banks_number: number | null;
  client_bdc_number: number | null;
  client_govt_number: number | null;
  client_insurance_number: number | null;
  client_investment_cos_number: number | null;
  client_other_advisors_number: number | null;
  client_swf_number: number | null;
  legal_structure: string | null;
  services_financial_planning: string | null;
  services_mgr_selection: string | null;
  services_pension_consulting: string | null;
  services_port_management_individuals: string | null;
  services_port_management_institutional: string | null;
  services_port_management_pooled: string | null;
  private_fund_advisor: string | null;
  latest_adv_filing: string | null;
}

interface FeeTier {
  min_aum: string | null;
  max_aum: number | null;
  fee_pct: number | null;
}

interface ProfileText {
  business_profile: string | null;
  notable_characteristics: string | null;
  client_base: string | null;
  wealth_tier: string | null;
  investment_philosophy: string | null;
  specialty_strategies: string | null;
  firm_character: string | null;
  service_model: string | null;
}

interface Website {
  website: string | null;
}

interface FeesAndMins {
  fee_structure_type: string | null;
  fee_range_min: string | null;
  fee_range_max: string | null;
  minimum_fee: string | null;
  minimum_account_size: string | null;
  maximum_fee_dollar: string | null;
  notes: string | null;
}

interface GrowthRecord {
  aum: string | null;
  employee_total_calc: string | null;
  client_total_or_calc: string | null;
  date_submitted: string | null;
}

interface AssetAllocation {
  cash: number | null;
  derivatives: number | null;
  ig_corp_bonds: number | null;
  non_ig_corp_bonds: number | null;
  public_equity: number | null;
  private_equity: number | null;
  us_govt_bonds: number | null;
  us_muni_bonds: number | null;
  other: number | null;
}

interface ClientBreakdown {
  hnw: number | null;
  non_hnw: number | null;
  pension: number | null;
  charitable: number | null;
  corporations: number | null;
  pooled_vehicles: number | null;
  other: number | null;
}

// ─── Data fetching (untouched) ────────────────────────────────────────────────
async function getFirmData(crd: string) {
  const { data: firmData, error: firmError } = await supabase
    .from('firmdata_current')
    .select('*')
    .eq('crd', crd)
    .single();

  const { data: feeTiers } = await supabase
    .from('firmdata_feetiers')
    .select('min_aum, max_aum, fee_pct')
    .eq('crd', crd);

  const { data: feesAndMins } = await supabase
    .from('firmdata_feesandmins')
    .select('fee_structure_type, fee_range_min, fee_range_max, minimum_fee, minimum_account_size, maximum_fee_dollar, notes')
    .eq('crd', crd)
    .single();

  const { data: profileText } = await supabase
    .from('firmdata_profile_text')
    .select('*')
    .eq('crd', crd)
    .single();

  const { data: website } = await supabase
    .from('firmdata_website')
    .select('website')
    .eq('crd', crd)
    .single();

  const { data: growth } = await supabase
    .from('firmdata_growth')
    .select('aum, employee_total_calc, client_total_or_calc, date_submitted')
    .eq('crd', crd)
    .order('date_submitted', { ascending: true });

  const { data: firmName } = await supabase
    .from('firm_names')
    .select('display_name')
    .eq('crd', crd)
    .single();

  const { data: firmLogo } = await supabase
    .from('firm_logos')
    .select('logo_key')
    .eq('crd', crd)
    .eq('has_logo', true)
    .single();

  // Parse asset allocation from firm data
  const assetAllocation: AssetAllocation | null = firmData ? {
    cash: firmData.asset_allocation_cash ? parseFloat(firmData.asset_allocation_cash) : null,
    derivatives: firmData.asset_allocation_derivatives ? parseFloat(firmData.asset_allocation_derivatives) : null,
    ig_corp_bonds: firmData.asset_allocation_ig_corp_bonds ? parseFloat(firmData.asset_allocation_ig_corp_bonds) : null,
    non_ig_corp_bonds: firmData.asset_allocation_non_ig_corp_bonds ? parseFloat(firmData.asset_allocation_non_ig_corp_bonds) : null,
    public_equity: firmData.asset_allocation_public_equity_direct ? parseFloat(firmData.asset_allocation_public_equity_direct) : null,
    private_equity: firmData.asset_allocation_private_equity_direct ? parseFloat(firmData.asset_allocation_private_equity_direct) : null,
    us_govt_bonds: firmData.asset_allocation_us_govt_bonds ? parseFloat(firmData.asset_allocation_us_govt_bonds) : null,
    us_muni_bonds: firmData.asset_allocation_us_muni_bonds ? parseFloat(firmData.asset_allocation_us_muni_bonds) : null,
    other: firmData.asset_allocation_other ? parseFloat(firmData.asset_allocation_other) : null,
  } : null;

  // Parse client breakdown
  const clientBreakdown: ClientBreakdown | null = firmData ? {
    hnw: firmData.client_hnw_number,
    non_hnw: firmData.client_non_hnw_number,
    pension: firmData.client_pension_number,
    charitable: firmData.client_charitable_number,
    corporations: firmData.client_corporations_number,
    pooled_vehicles: firmData.client_pooled_vehicles_number,
    other: null,
  } : null;

  // Get firm score
  const firmScore = await getFirmScore(parseInt(crd));

  return {
    firmData: firmData as FirmData | null,
    displayName: firmName?.display_name as string | null,
    logoKey: firmLogo?.logo_key as string | null,
    feeTiers: feeTiers as FeeTier[] | null,
    feesAndMins: feesAndMins as FeesAndMins | null,
    profileText: profileText as ProfileText | null,
    website: website as Website | null,
    growth: growth as GrowthRecord[] | null,
    assetAllocation,
    clientBreakdown,
    firmScore,
    error: firmError
  };
}

// ─── New types ────────────────────────────────────────────────────────────────
// ─── Similar Firms: uses shared multi-dimensional similarity algorithm ───────
// (see lib/similar-firms.ts)

// ─── New: Score percentile query ──────────────────────────────────────────────
async function getScorePercentile(score: number): Promise<{ rank: number; total: number } | null> {
  const [{ count: above }, { count: total }] = await Promise.all([
    supabase.from('firm_scores').select('*', { count: 'exact', head: true }).gt('final_score', score),
    supabase.from('firm_scores').select('*', { count: 'exact', head: true }).not('final_score', 'is', null),
  ]);
  if (!total) return null;
  return { rank: (above ?? 0) + 1, total };
}

// ─── New: Stat percentiles query ──────────────────────────────────────────────
interface StatPercentiles {
  aum: string | null;
  avgClient: string | null;
  clientsPerAdvisor: string | null;
  minAccount: string | null;
  employees: string | null;
  invStaff: string | null;
}

async function getStatPercentiles(firm: FirmData, totalClients: number, avgClientSize: number | null, aumPerInvPro: number | null, minAccount: number | null): Promise<StatPercentiles> {
  const result: StatPercentiles = { aum: null, avgClient: null, clientsPerAdvisor: null, minAccount: null, employees: null, invStaff: null };

  // Run all percentile queries in parallel against firmdata_percentiles view
  const queries: Array<{ key: keyof StatPercentiles; col: string; val: number | null }> = [
    { key: 'aum', col: 'aum', val: firm.aum },
    { key: 'employees', col: 'employee_total', val: firm.employee_total },
    { key: 'invStaff', col: 'employee_investment', val: firm.employee_investment },
    { key: 'clientsPerAdvisor', col: 'clients_per_advisor', val: (totalClients > 0 && firm.employee_investment && firm.employee_investment > 0) ? totalClients / firm.employee_investment : null },
  ];

  const promises = queries.map(async (q) => {
    if (q.val == null) return;
    const [{ count: below }, { count: total }] = await Promise.all([
      supabase.from('firmdata_percentiles').select('*', { count: 'exact', head: true }).lt(q.col, q.val).not(q.col, 'is', null),
      supabase.from('firmdata_percentiles').select('*', { count: 'exact', head: true }).not(q.col, 'is', null),
    ]);
    if (total && total > 0) {
      const rawPct = Math.round(((below ?? 0) / total) * 100);
      // For clients-per-advisor, higher is worse (more stretched), so invert
      const pct = q.key === 'clientsPerAdvisor' ? (100 - rawPct) : rawPct;
      const topPct = Math.max(100 - pct, 1); // clamp to at least 1%
      const bottomPct = Math.max(pct, 1);
      result[q.key] = pct >= 50 ? `Top ${topPct}%` : `Bottom ${bottomPct}%`;
    }
  });

  await Promise.all(promises);
  return result;
}

export async function generateMetadata({
  params,
}: {
  params: { crd: string };
}): Promise<Metadata> {
  const { firmData, displayName } = await getFirmData(params.crd);
  const name = displayName || firmData?.primary_business_name || 'Firm';
  const location = firmData?.main_office_city && firmData?.main_office_state
    ? `${firmData.main_office_city}, ${firmData.main_office_state}`
    : null;
  const title = `${name} — Visor Index`;
  const description = location
    ? `${name} · ${location}. View detailed profile, Visor Index™ Score, fees, services, and regulatory history. SEC-registered investment advisor (CRD #${params.crd}).`
    : `View detailed profile, Visor Index™ Score, fees, services, and regulatory history for ${name}. SEC-registered investment advisor (CRD #${params.crd}).`;
  const url = `https://visorindex.com/firm/${params.crd}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      url,
      siteName: 'Visor Index',
      title,
      description,
      // Uses default site-wide opengraph-image from app/opengraph-image.tsx
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

// ─── Utility functions (data layer — untouched) ───────────────────────────────
function parseAUM(value: string | null): number | null {
  if (!value) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function formatCurrency(value: number | null): string {
  if (value == null) return 'N/A';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000).toLocaleString()}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

// ─── Presentational helpers ───────────────────────────────────────────────────
function scoreColor(score: number): string {
  // Works for both 0-10 sub-scores and 0-100 overall scores
  const s = score <= 10 ? score * 10 : score;
  return s >= 80 ? 'var(--green-3)' : s >= 50 ? 'var(--amber)' : 'var(--red)';
}

const FEE_TYPE_LABELS: Record<string, string> = {
  range: 'AUM-Based',
  tiered: 'Tiered',
  flat_percentage: 'Flat Fee',
  maximum_only: 'AUM-Based (Max)',
  minimum_only: 'AUM-Based (Min)',
  capped: 'Capped',
  not_disclosed: 'Negotiated',
};

const SECTION_NAV = [
  { id: 'about',      label: 'About' },
  { id: 'vvs',        label: 'Visor Index™' },
  { id: 'fees',       label: 'Fees & Pricing' },
  { id: 'aum',        label: 'AUM & Growth' },
  { id: 'clients',    label: 'Clients' },
  { id: 'allocation', label: 'Allocation' },
  { id: 'regulatory', label: 'Regulatory' },
  { id: 'news',       label: 'News' },
  { id: 'personnel',  label: 'Key Personnel' },
];

const PAGE_CSS = `
  .vfp-breadcrumb, .vfp-page {
    --navy:#0A1C2A; --navy-2:#0F2538;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568;
    --rule:#CAD8D0; --rule-2:#B0C4BA;
    --red:#EF4444; --amber:#F59E0B;
    --serif:'Cormorant Garamond',serif;
    --sans:'Inter',sans-serif;
    --mono:'DM Mono',monospace;
  }
  .vfp-breadcrumb {
    position:fixed; top:56px; left:0; right:0; z-index:400;
    background:rgba(10,28,42,0.88); backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(255,255,255,0.06);
    padding:0 56px;
  }
  .vfp-breadcrumb-i {
    max-width:1200px; margin:0 auto; height:40px;
    display:flex; align-items:center; justify-content:space-between;
  }
  .vfp-bc-trail {
    display:flex; align-items:center; gap:8px;
    font-size:9px; color:rgba(255,255,255,.3);
    font-family:var(--sans); letter-spacing:.02em;
  }
  .vfp-bc-trail a { color:rgba(255,255,255,.3); text-decoration:none; transition:color .15s; }
  .vfp-bc-trail a:hover { color:rgba(255,255,255,.7); }
  .vfp-bc-sep { opacity:.3; }
  .vfp-bc-current { color:rgba(255,255,255,.6); }
  .vfp-bc-actions { display:flex; align-items:center; gap:10px; padding-left:16px; border-left:1px solid rgba(255,255,255,.08); }
  .vfp-bc-compare {
    display:inline-flex; align-items:center; gap:6px;
    font-family:var(--sans); font-size:11px; font-weight:600;
    background:transparent; color:rgba(255,255,255,.5);
    padding:6px 14px; border:1px solid rgba(255,255,255,.12); cursor:pointer; border-radius:0;
    transition:all .2s; letter-spacing:.04em; text-decoration:none;
  }
  .vfp-bc-compare:hover { border-color:rgba(45,189,116,.3); color:#2DBD74; }
  .vfp-hero-actions { display:none; }

  .vfp-page {
    padding-top:48px; max-width:1200px; margin:0 auto;
    padding-left:56px; padding-right:56px; padding-bottom:0;
    overflow-x:hidden; background:var(--navy);
  }
  .vfp-hero {
    background:var(--navy);
    margin:0 -56px; padding:16px 56px 0;
    border-bottom:1px solid rgba(255,255,255,.06);
    position:relative; overflow:hidden;
  }
  .vfp-hero::before {
    content:''; position:absolute; top:-40px; right:120px;
    width:500px; height:400px;
    background:radial-gradient(ellipse,rgba(26,122,74,.1) 0%,transparent 70%);
    pointer-events:none;
  }
  /* Hero top: logo | identity | score */
  .vfp-hero-top {
    display:flex; align-items:stretch; gap:0;
    padding-bottom:14px; border-bottom:1px solid rgba(255,255,255,.1);
  }
  .vfp-logo-col {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding-right:24px; border-right:1px solid rgba(255,255,255,.1);
    flex-shrink:0;
  }
  .vfp-logo-mark {
    width:64px; height:64px;
    display:grid; place-items:center; flex-shrink:0;
  }
  .vfp-logo-initials {
    font-family:var(--serif); font-size:24px; font-weight:700;
    color:rgba(255,255,255,.3); letter-spacing:.04em;
  }
  .vfp-hero-text { flex:1; min-width:0; max-width:680px; padding:2px 24px; display:flex; flex-direction:column; justify-content:center; }
  .vfp-firm-name {
    font-family:var(--sans); font-size:clamp(26px,3.2vw,38px);
    font-weight:700; color:#fff; line-height:1.1;
    letter-spacing:-.02em; margin-bottom:6px;
  }
  .vfp-meta-row { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  .vfp-meta-item { display:flex; align-items:center; gap:5px; font-family:var(--mono); font-size:10px; color:rgba(255,255,255,.6); }
  .vfp-meta-item a { color:rgba(255,255,255,.6); text-decoration:none; transition:color .15s; }
  .vfp-meta-item a:hover { color:#fff; }

  .vfp-stats-row {
    display:grid; grid-template-columns:repeat(6,1fr);
    border-top:0.5px solid rgba(255,255,255,.1);
  }
  .vfp-stat {
    padding:12px 18px; border-right:0.5px solid rgba(255,255,255,.08);
    transition:background .15s;
    display:flex; flex-direction:column; align-items:center; justify-content:flex-start; text-align:center;
  }
  .vfp-stat:hover { background:rgba(255,255,255,.04); }
  .vfp-stat:last-child { border-right:none; }
  .vfp-stat-label {
    font-family:var(--sans); font-size:9px; font-weight:600; letter-spacing:.1em; text-transform:uppercase;
    color:rgba(255,255,255,.7); margin-bottom:6px;
  }
  .vfp-stat-val {
    font-family:var(--serif); font-size:26px; font-weight:700;
    color:#fff; line-height:1; letter-spacing:-.02em;
    min-height:56px; display:flex; align-items:center; justify-content:center;
  }
  .vfp-stat-val em { font-style:normal; color:var(--green-3); font-size:.75em; }
  .vfp-stat-sub { font-size:10px; color:rgba(255,255,255,.55); margin-top:auto; padding-top:6px; font-family:var(--mono); }
  .vfp-stat-sub em { font-style:normal; color:var(--green-3); }

  .vfp-body {
    display:grid; grid-template-columns:1fr 280px;
    gap:48px; padding-top:20px;
    background:var(--white); margin:0 -56px; padding-left:56px; padding-right:56px; padding-bottom:60px;
  }
  .vfp-body > main { min-width:0; overflow-wrap:break-word; word-wrap:break-word; }
  .vfp-section { margin-bottom:28px; scroll-margin-top:140px; }
  .vfp-section-head {
    display:flex; align-items:baseline; justify-content:space-between;
    margin-bottom:14px; padding-bottom:8px;
    border-bottom:0.5px solid var(--rule);
  }
  .vfp-section-title {
    font-family:var(--sans); font-size:18px; font-weight:700;
    color:var(--ink); letter-spacing:-.01em;
  }
  .vfp-section-meta { font-size:10px; color:var(--ink-3); font-family:var(--mono); }

  /* About card */
  .vfp-about-card {
    background:#fff; border:0.5px solid var(--rule); border-radius:10px;
    box-shadow:0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
    overflow:hidden; padding:20px;
  }

  /* VVS Score section */
  .vfp-vvs-card {
    background:#fff; border:0.5px solid var(--rule); border-radius:10px;
    box-shadow:0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
    overflow:hidden;
  }
  .vfp-vvs-overall {
    display:grid; grid-template-columns:auto 1fr;
    gap:20px; align-items:flex-start;
    padding:20px; border-bottom:0.5px solid var(--rule);
  }
  .vfp-vvs-bars-wrap { padding:16px 20px; }
  .vfp-vvs-big { font-family:var(--serif); font-size:64px; font-weight:700; line-height:1; letter-spacing:-.04em; }
  .vfp-vvs-big-label { font-family:var(--sans); font-size:9px; color:var(--ink-3); margin-top:2px; letter-spacing:.08em; }
  .vfp-vvs-rank {
    font-size:13px; color:var(--ink-2); line-height:1.65;
  }
  .vfp-vvs-rank strong { color:var(--ink); font-weight:600; }
  .vfp-vvs-bars { display:flex; flex-direction:column; gap:0; }
  .vfp-bar-row {
    display:grid; grid-template-columns:140px 1fr 36px;
    align-items:center; gap:16px;
    padding:8px 0; border-bottom:0.5px solid rgba(0,0,0,.04);
  }
  .vfp-bar-row:last-child { border-bottom:none; }
  .vfp-bar-label { font-family:var(--sans); font-size:13px; color:var(--ink-2); font-weight:500; display:flex; align-items:center; }
  .vfp-bar-track { height:3px; background:var(--rule); border-radius:2px; position:relative; overflow:hidden; }
  .vfp-bar-fill { height:100%; border-radius:2px; transition:width 1s ease; }
  .vfp-bar-val { font-family:var(--mono); font-size:12px; font-weight:500; text-align:right; }
  .vfp-info-tip {
    display:inline-flex; align-items:center; justify-content:center;
    font-size:10px; color:var(--ink-3); cursor:default;
    margin-left:5px; opacity:.5; position:relative;
  }
  .vfp-info-tip:hover { opacity:1; }
  .vfp-info-tip:hover::after {
    content:attr(title);
    position:absolute; left:50%; bottom:calc(100% + 6px);
    transform:translateX(-50%);
    background:var(--ink); color:#fff;
    font-size:11px; line-height:1.5; padding:8px 12px;
    width:220px; white-space:normal;
    font-family:var(--sans); font-weight:400; letter-spacing:0;
    pointer-events:none; z-index:20;
    border-top:2px solid var(--green-3);
  }

  /* Fees */
  .vfp-fee-unified {
    background:#fff; border:0.5px solid var(--rule); border-radius:10px;
    box-shadow:0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
    overflow:hidden; margin-bottom:14px;
  }
  .vfp-fee-grid { display:grid; grid-template-columns:1fr 1fr; }
  .vfp-fee-card-label { font-family:var(--sans); font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); margin-bottom:10px; }
  .vfp-fee-card-val { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--ink); line-height:1; margin-bottom:4px; letter-spacing:-.02em; }
  .vfp-fee-card-sub { font-family:var(--sans); font-size:13px; color:var(--ink-3); line-height:1.6; }
  .vfp-fee-tier {
    display:flex; justify-content:space-between; align-items:center;
    padding:9px 20px;
    transition:background .12s;
  }
  .vfp-fee-tier:nth-child(odd) { background:var(--white); }
  .vfp-fee-tier:hover { background:rgba(45,189,116,.03); }
  .vfp-fee-tier-label { font-family:var(--sans); font-size:13px; color:var(--ink-2); }
  .vfp-fee-rate { font-family:var(--mono); font-size:13px; font-weight:600; color:var(--ink); }

  /* AUM chart wrap */
  .vfp-aum-wrap { background:#fff; border:0.5px solid var(--rule); border-radius:9px; overflow:hidden; }
  .vfp-aum-head { display:grid; grid-template-columns:repeat(3,1fr); border-bottom:1px solid var(--rule); }
  .vfp-aum-stat { padding:11px 13px; border-right:1px solid var(--rule); background:#fff; border-radius:0; text-align:center; }
  .vfp-aum-stat:last-child { border-right:none; }
  .vfp-aum-stat-label { font-family:var(--sans); font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); margin-bottom:6px; }
  .vfp-aum-stat-val { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--ink); line-height:1; }
  .vfp-aum-stat-delta { display:inline-flex; align-items:center; gap:4px; font-size:10px; margin-top:4px; font-family:var(--mono); }
  .vfp-aum-stat-delta.up { color:var(--green); }
  .vfp-aum-stat-delta.dn { color:var(--red); }
  .vfp-aum-stat-sub { font-family:var(--mono); font-size:10px; color:var(--ink-3); margin-top:4px; }
  .vfp-chart-divider { border-top:1px solid var(--rule); }
  .vfp-aum-footer {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 24px; border-top:1px solid var(--rule);
    font-size:10px; color:var(--ink-3); font-family:var(--mono);
  }

  /* Clients */
  .vfp-client-wrap { background:#fff; border:0.5px solid var(--rule); border-radius:9px; overflow:hidden; }
  .vfp-client-head { display:grid; grid-template-columns:repeat(3,1fr); border-bottom:1px solid var(--rule); }
  .vfp-client-stat { padding:11px 13px; border-right:1px solid var(--rule); background:#fff; text-align:center; }
  .vfp-client-stat:last-child { border-right:none; }
  .vfp-client-card-label { font-family:var(--sans); font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); margin-bottom:4px; }
  .vfp-client-card-val { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--ink); line-height:1; margin-bottom:3px; letter-spacing:-.02em; }
  .vfp-client-card-sub { font-family:var(--mono); font-size:10px; color:var(--ink-3); line-height:1.6; }
  .vfp-client-breakdown { padding:16px 20px 0; overflow:hidden; }
  .vfp-client-bd-head { font-family:var(--sans); font-size:9px; font-weight:600; color:var(--ink-3); letter-spacing:.14em; text-transform:uppercase; margin-bottom:8px; }
  .vfp-client-footer {
    display:flex; align-items:center; justify-content:center;
    padding:10px 24px; border-top:1px solid var(--rule); margin-top:16px;
    font-size:10px; color:var(--ink-3); font-family:var(--mono);
  }
  .vfp-client-type-row {
    display:grid; grid-template-columns:1fr auto 100px;
    align-items:center; gap:12px;
    padding:10px 4px; margin:0 -4px; border-bottom:0.5px solid rgba(0,0,0,.05);
    transition:background .12s; border-radius:3px;
  }
  .vfp-client-type-row:hover { background:var(--white); }
  .vfp-client-type-row:last-child { border-bottom:none; }
  .vfp-client-type-name { font-family:var(--sans); font-size:13px; color:var(--ink-2); }
  .vfp-client-type-pct { font-family:var(--mono); font-size:12px; color:var(--ink-3); }
  .vfp-client-type-bar { height:3px; background:var(--rule); }
  .vfp-client-type-fill { height:100%; background:var(--green-2); border-radius:1px; }

  /* Asset Allocation */
  .vfp-alloc-wrap { background:#fff; border:0.5px solid var(--rule); border-radius:9px; overflow:visible; }
  .vfp-alloc-inner { padding:16px 20px 0; }
  .vfp-alloc-bar { display:flex; height:8px; border-radius:4px; overflow:visible; gap:1px; margin-bottom:12px; }
  .vfp-alloc-bar-seg { height:100%; transition:width .6s ease, opacity .15s; min-width:2px; position:relative; cursor:default; }
  .vfp-alloc-bar-seg:first-child { border-radius:4px 0 0 4px; }
  .vfp-alloc-bar-seg:last-child { border-radius:0 4px 4px 0; }
  .vfp-alloc-bar-seg:hover { opacity:.8; }
  .vfp-alloc-bar-seg:hover::after {
    content:attr(data-tip);
    position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%);
    background:var(--ink); color:#fff; font-family:var(--sans); font-size:10px; font-weight:500;
    padding:4px 8px; border-radius:3px; white-space:nowrap; pointer-events:none; z-index:10;
  }
  .vfp-alloc-row {
    display:grid; grid-template-columns:10px 1fr 60px auto;
    align-items:center; gap:10px;
    padding:8px 4px; margin:0 -4px; border-bottom:0.5px solid rgba(0,0,0,.05);
    transition:background .12s; border-radius:3px; cursor:default;
  }
  .vfp-alloc-row:last-child { border-bottom:none; }
  .vfp-alloc-row:hover { background:var(--white); }
  .vfp-alloc-row:hover .vfp-alloc-dot { transform:scale(1.4); transition:transform .15s; }
  .vfp-alloc-dot { width:8px; height:8px; border-radius:50%; }
  .vfp-alloc-label { font-family:var(--sans); font-size:13px; color:var(--ink-2); }
  .vfp-alloc-bar-mini { height:3px; background:var(--rule); border-radius:1px; overflow:hidden; }
  .vfp-alloc-fill-mini { height:100%; border-radius:1px; transition:width .7s cubic-bezier(0.25,0.46,0.45,0.94); }
  .vfp-alloc-pct { font-family:var(--mono); font-size:12px; color:var(--ink-3); text-align:right; }
  .vfp-alloc-footer {
    display:flex; align-items:center; justify-content:center;
    padding:10px 24px; border-top:1px solid var(--rule); margin-top:16px;
    font-size:10px; color:var(--ink-3); font-family:var(--mono);
  }

  /* Key Personnel */
  .vfp-personnel-wrap { background:#fff; border:0.5px solid var(--rule); border-radius:9px; overflow:hidden; }
  .vfp-personnel-head { display:grid; grid-template-columns:repeat(3,1fr); border-bottom:1px solid var(--rule); }
  .vfp-personnel-stat { padding:11px 13px; border-right:1px solid var(--rule); background:#fff; text-align:center; }
  .vfp-personnel-stat:last-child { border-right:none; }
  .vfp-personnel-soon {
    display:flex; gap:12px; padding:16px 20px;
    background:var(--white); margin:16px 20px 0; border-radius:6px;
  }
  .vfp-personnel-soon-icon {
    width:32px; height:32px; background:#fff; border:0.5px solid var(--rule);
    display:grid; place-items:center; flex-shrink:0; border-radius:50%;
  }
  .vfp-personnel-soon-title { font-family:var(--sans); font-size:13px; font-weight:500; color:var(--ink-2); margin-bottom:4px; }
  .vfp-personnel-soon-sub { font-family:var(--sans); font-size:13px; color:var(--ink-3); line-height:1.55; }
  .vfp-personnel-footer {
    display:flex; align-items:center; justify-content:center;
    padding:10px 24px; border-top:1px solid var(--rule); margin-top:16px;
    font-size:10px; color:var(--ink-3); font-family:var(--mono);
  }
  @media (max-width:900px) {
    .vfp-personnel-head { grid-template-columns:1fr 1fr; }
    .vfp-personnel-stat:nth-child(3) { grid-column:1/-1; border-right:none; border-top:1px solid var(--rule); }
  }

  /* Tag hover states */
  .vfp-tag-class {
    transition:background .15s, border-color .15s, transform .15s; cursor:default;
  }
  .vfp-tag-class:hover { background:rgba(26,122,74,.1) !important; border-color:rgba(26,122,74,.35) !important; }
  a.vfp-tag-class { cursor:pointer; }
  .vfp-tag-spec {
    transition:background .15s, border-color .15s, color .15s, transform .15s;
  }
  .vfp-tag-spec:hover { background:var(--white); border-color:var(--ink-3) !important; color:var(--ink-2) !important; }

  /* Sidebar */
  .vfp-sidebar { position:sticky; top:108px; display:flex; flex-direction:column; gap:16px; align-self:start; }
  .vfp-scard {
    background:#fff; border:0.5px solid var(--rule); border-radius:10px;
    overflow:hidden;
  }
  .vfp-scard-head {
    display:flex; align-items:baseline; justify-content:space-between;
    padding:14px 16px 10px; border-bottom:0.5px solid var(--rule);
  }
  .vfp-scard-title {
    font-family:var(--sans); font-size:14px; font-weight:700; color:var(--ink); letter-spacing:-.01em;
  }
  .vfp-scard-meta {
    font-family:var(--mono); font-size:9px; color:var(--ink-3); letter-spacing:.02em;
  }
  .vfp-scard-body { padding:4px 16px 12px; }
  .vfp-sfield {
    display:flex; flex-direction:column; gap:2px;
    padding:9px 0; border-bottom:0.5px solid var(--rule);
  }
  .vfp-sfield:last-child { border-bottom:none; }
  .vfp-sfield-label { font-family:var(--mono); font-size:9px; font-weight:600; color:var(--ink-3); text-transform:uppercase; letter-spacing:.08em; }
  .vfp-sfield-val { font-family:var(--sans); font-size:13px; color:var(--ink); font-weight:500; line-height:1.5; }
  .vfp-sfield-val a { color:var(--green); text-decoration:none; transition:color .15s; }
  .vfp-sfield-val a:hover { color:var(--green-2); text-decoration:underline; }
  /* Inline variant for short key-value pairs */
  .vfp-sfield-inline {
    flex-direction:row; justify-content:space-between; align-items:baseline; gap:0;
  }
  .vfp-sfield-inline .vfp-sfield-label { text-transform:none; font-family:var(--sans); font-size:12px; font-weight:400; letter-spacing:0; }
  .vfp-sfield-inline .vfp-sfield-val { font-family:var(--mono); font-size:11px; color:var(--ink-2); text-align:right; }

  .vfp-similar-table { width:100%; border-collapse:collapse; }
  .vfp-similar-row { cursor:pointer; transition:background .15s; }
  .vfp-similar-row:hover { background:rgba(0,0,0,.015); }
  .vfp-similar-row td { border-top:0.5px solid var(--rule); padding:12px 0; vertical-align:middle; }
  .vfp-similar-row:first-child td { border-top:none; }
  .vfp-similar-cell-info { padding-left:16px !important; padding-right:12px !important; position:relative; }
  .vfp-similar-cell-score {
    width:56px; text-align:center; padding-right:12px !important; padding-left:8px !important;
    border-left:0.5px solid var(--rule);
  }
  .vfp-mini-ring {
    position:relative; width:38px; height:38px; display:inline-block;
  }
  .vfp-mini-ring svg { transform:rotate(-90deg); }
  .vfp-mini-ring-label {
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    font-family:var(--serif); font-size:13px; font-weight:700; line-height:1;
  }
  .vfp-similar-name { font-family:var(--sans); font-size:13px; font-weight:600; color:var(--ink); line-height:1.35; }
  .vfp-similar-loc { font-family:var(--sans); font-size:11px; color:var(--ink-3); margin-top:2px; }
  .vfp-similar-why { font-family:var(--mono); font-size:9px; color:var(--green); margin-top:3px; letter-spacing:.03em; }

  /* Contact quick actions (mobile) */
  .vfp-contact-actions {
    display:none; padding:12px 16px; border-bottom:0.5px solid var(--rule);
  }
  .vfp-contact-actions-row { display:flex; gap:8px; }
  .vfp-contact-action {
    flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;
    padding:10px 8px; border-radius:8px; border:0.5px solid var(--rule);
    text-decoration:none; color:var(--ink-2); font-family:var(--sans); font-size:10px; font-weight:500;
    transition:background .15s, border-color .15s;
  }
  .vfp-contact-action:hover { background:rgba(45,189,116,.04); border-color:var(--green); }
  .vfp-contact-action svg { flex-shrink:0; }

  /* Filing link */
  .vfp-filing-link {
    display:flex; align-items:center; justify-content:center; gap:6px;
    padding:10px 0 2px; font-family:var(--mono); font-size:11px; color:var(--green);
    text-decoration:none; transition:color .15s;
  }
  .vfp-filing-link:hover { color:var(--green-2); text-decoration:underline; }

  /* Data accuracy notice — sits inside Filing Details card */
  .vfp-accuracy {
    font-size:11px; color:var(--ink-3); font-family:var(--sans);
    border-top:1px solid var(--rule); margin-top:12px; padding-top:12px;
    line-height:1.45;
  }
  .vfp-accuracy-link {
    color:var(--green); text-decoration:none; font-weight:500;
    transition:color .12s;
  }
  .vfp-accuracy-link:hover { text-decoration:underline; }

  .vfp-cta-card { background:var(--navy); border:none; overflow:hidden; }
  .vfp-cta-body { padding:24px; }
  .vfp-cta-eyebrow {
    font-size:9px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
    color:var(--green-3); margin-bottom:12px; display:flex; align-items:center; gap:6px;
  }
  .vfp-cta-h { font-family:var(--serif); font-size:18px; font-weight:700; color:#fff; line-height:1.25; margin-bottom:10px; }
  .vfp-cta-sub { font-size:13px; color:rgba(255,255,255,.38); line-height:1.6; margin-bottom:20px; font-family:var(--sans); }
  .vfp-cta-btn {
    display:flex; align-items:center; justify-content:center; gap:8px;
    width:100%; background:var(--green); color:#fff;
    font-family:var(--sans); font-size:13px; font-weight:600;
    padding:12px; text-decoration:none; border:none; cursor:pointer;
    transition:background .2s;
  }
  .vfp-cta-btn:hover { background:var(--green-2); }
  .vfp-cta-trust { font-size:10px; color:rgba(255,255,255,.2); text-align:center; margin-top:10px; line-height:1.5; font-family:var(--mono); }

  /* Gated view */
  .vfp-gate-blur {
    pointer-events:none; user-select:none; position:relative;
    filter:blur(1.5px); max-height:600px; overflow:hidden;
    mask-image:linear-gradient(to bottom, #000 55%, transparent 100%);
    -webkit-mask-image:linear-gradient(to bottom, #000 55%, transparent 100%);
  }
  .vfp-gate-preview-data {
    pointer-events:none; user-select:none;
  }
  .vfp-gate-cta {
    position:absolute; top:180px; left:50%; transform:translateX(-50%);
    width:calc(100% - 48px); max-width:480px;
    background:#0F2538; border:1px solid rgba(255,255,255,.09); border-top:2px solid #1A7A4A;
    box-shadow:0 8px 48px rgba(0,0,0,0.5);
    padding:36px 40px; text-align:left; z-index:30;
  }
  .vfp-gc-eyebrow {
    display:flex; align-items:center; gap:8px; margin-bottom:16px;
    font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:#2DBD74;
  }
  .vfp-gc-eyebrow svg { width:12px; height:12px; }
  .vfp-gc-headline {
    font-family:'Cormorant Garamond', serif; font-size:clamp(22px, 2.5vw, 30px);
    font-weight:700; line-height:1.2; letter-spacing:-.02em; color:#fff; margin-bottom:12px;
  }
  .vfp-gc-sub {
    font-size:13px; color:rgba(255,255,255,.55); line-height:1.7;
    border-top:1px solid rgba(255,255,255,.06); padding-top:16px; margin-bottom:24px;
  }
  .vfp-gc-ctas { display:flex; gap:12px; flex-wrap:wrap; }
  .vfp-gc-cta-primary {
    display:inline-flex; align-items:center; padding:12px 28px;
    background:#1A7A4A; color:#fff; font-size:13px; font-weight:600;
    text-decoration:none; transition:background .15s;
  }
  .vfp-gc-cta-primary:hover { background:#22995E; }
  .vfp-gc-cta-secondary {
    display:inline-flex; align-items:center; padding:12px 28px;
    border:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.6);
    font-size:13px; text-decoration:none; transition:all .15s;
  }
  .vfp-gc-cta-secondary:hover { border-color:rgba(255,255,255,.3); color:#fff; }
  .vfp-gate-nav {
    background:var(--white); border-bottom:1px solid var(--rule);
    margin:0 -56px; display:flex; overflow-x:auto;
  }
  .vfp-gate-nav-inner { max-width:1200px; margin:0 auto; padding:0 56px; display:flex; }
  .vfp-gate-tab {
    font-size:12px; font-weight:500; color:var(--ink-3); padding:14px 20px;
    white-space:nowrap; letter-spacing:.02em; border-bottom:2px solid transparent;
    font-family:var(--sans);
  }
  .vfp-gate-tab.active { font-weight:600; color:var(--green); border-bottom-color:var(--green); }

  @media (max-width:900px) {
    .vfp-breadcrumb { padding:0 20px; }
    .vfp-page { padding-left:20px; padding-right:20px; }
    .vfp-hero { margin:0 -20px; padding:20px 20px 0; }
    .vfp-stat-score .vfp-stat-val { font-size:22px; }
    .vfp-stats-row { grid-template-columns:repeat(3,1fr); }
    .vfp-body { grid-template-columns:1fr; gap:32px; }
    .vfp-sidebar { position:static; }
    .vfp-sidebar-contact { order:-1; }
    .vfp-contact-actions { display:block; }
    .vfp-contact-fields-desktop { display:none; }
    .vfp-fee-grid { grid-template-columns:1fr; }
    .vfp-client-grid { grid-template-columns:1fr; }
    .vfp-client-card:nth-child(odd) { border-right:none; padding-right:0; }
    .vfp-client-card:nth-child(even) { padding-left:0; }
    .vfp-gate-cta { padding:28px 24px; width:calc(100% - 24px); top:120px; }
    .vfp-gate-nav { margin:0 -20px; }
    .vfp-gate-nav-inner { padding:0 20px; }
  }

  @media (max-width:640px) {
    .vfp-page { padding-left:16px; padding-right:16px; }
    .vfp-hero { margin:0 -16px; padding:24px 16px 0; }
    .vfp-logo-col { display:none; }
    .vfp-firm-name { font-size:20px; }
    .vfp-badge { font-size:8px; padding:2px 6px; }
    .vfp-meta-line { gap:8px; }
    .vfp-meta-item { font-size:10px; }
    .vfp-stats-row { grid-template-columns:repeat(2,1fr); gap:0; }
    .vfp-stat { padding:14px 16px; }
    .vfp-stat-label { font-size:7px; letter-spacing:.06em; }
    .vfp-stat-val { font-size:20px; }
    .vfp-stat-sub { font-size:8px; }
    .vfp-score-grid { grid-template-columns:1fr 1fr; }
    .vfp-aum-stats { grid-template-columns:1fr 1fr; }
    .vfp-client-grid { grid-template-columns:1fr; }
    .vfp-fee-grid { grid-template-columns:1fr; }
    .vfp-fee-card { padding:16px; }
    .vfp-similar-grid { grid-template-columns:1fr; }
    .vfp-gate-cta { padding:28px 20px; width:calc(100% - 32px); max-width:calc(100% - 32px); top:100px; }
    .vfp-gc-ctas { flex-wrap:nowrap; }
    .vfp-gc-cta-primary, .vfp-gc-cta-secondary { padding:12px 16px; font-size:12px; white-space:nowrap; }
    .vfp-breadcrumb { padding:0 12px; }
    .vfp-breadcrumb-i { gap:4px; }
    .vfp-bc-trail { font-size:10px; gap:4px; }
    .vfp-bc-sep, .vfp-bc-current { display:none; }
    .vfp-bc-trail a:not(:first-child) { display:none; }
    .vfp-bc-actions { display:none; }
    .vfp-hero-actions { display:flex; align-items:center; gap:10px; margin-top:12px; }
    .vfp-gate-nav { margin:0 -16px; }
    .vfp-gate-nav-inner { padding:0 16px; }

    /* AUM & Client stat headers: stack on mobile */
    .vfp-aum-head, .vfp-client-head { grid-template-columns:1fr; }
    .vfp-aum-stat, .vfp-client-stat { border-right:none; border-bottom:1px solid var(--rule); }
    .vfp-aum-stat:last-child, .vfp-client-stat:last-child { border-bottom:none; }
    .vfp-aum-stat-val, .vfp-client-card-val { font-size:22px; }

    /* Chart overflow */
    .vfp-chart-body { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  }
`;

// ─── Page Component ───────────────────────────────────────────────────────────
export default async function FirmPage({ params }: { params: { crd: string } }) {
  const {
    firmData, displayName, logoKey, feeTiers, feesAndMins,
    profileText, website, growth, clientBreakdown, assetAllocation, firmScore, error,
  } = await getFirmData(params.crd);

  const rawFirmName = displayName || firmData?.primary_business_name || 'Unknown Firm';
  const firmDisplayName = rawFirmName === rawFirmName.toUpperCase()
    ? rawFirmName
        .replace(/,?\s*(LLC|LLP|INC|LP|CO|CORP|PC)\.?$/i, '')
        .split(/\s+/)
        .map(w => w.length <= 3 ? w.toUpperCase() : w.charAt(0) + w.slice(1).toLowerCase())
        .join(' ')
        .trim()
    : rawFirmName;
  const firmTitleCase = firmDisplayName;

  // ── Not found ──
  if (error || !firmData) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
        <section className="vfp-hero" style={{ paddingBottom: 36 }}>
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500,
              letterSpacing: '0.18em', textTransform: 'uppercase' as const,
              color: '#2DBD74', marginBottom: 8,
            }}>CRD #{params.crd}</div>
            <h1 style={{
              fontFamily: 'var(--serif)', fontSize: 'clamp(28px, 4vw, 38px)',
              fontWeight: 300, color: '#fff', lineHeight: 1.1, margin: 0,
            }}>
              Firm not found.
            </h1>
          </div>
        </section>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' }}>
          <div style={{
            background: '#fff', border: '1px solid var(--rule)', padding: 32,
          }}>
            <p style={{
              fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6,
              fontFamily: 'var(--sans)', margin: '0 0 8px',
            }}>
              We couldn&apos;t locate a firm with this CRD number. The firm may have been deregistered or the number may be incorrect.
            </p>
            <p style={{
              fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6,
              fontFamily: 'var(--sans)', margin: '0 0 24px',
            }}>
              Try searching by firm name instead, or verify the CRD number on{' '}
              <a href="https://adviserinfo.sec.gov" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 500 }}>
                SEC IAPD
              </a>.
            </p>
            <Link href="/search" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', background: 'var(--green)', color: '#fff',
              textDecoration: 'none', fontFamily: 'var(--sans)', fontSize: 11,
              fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
              borderRadius: 0,
            }}>
              Search advisors →
            </Link>
          </div>
        </div>
      </>
    );
  }

  const firm = firmData;

  // ── Auth ──
  const authSupabase = createSupabaseServerClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  let isSaved = false;
  let isWatching = false;
  if (user) {
    const [{ data: fav }, { data: alertSub }] = await Promise.all([
      authSupabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('crd', params.crd)
        .maybeSingle(),
      supabaseAdmin
        .from('alert_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('crd', params.crd)
        .maybeSingle(),
    ]);
    isSaved = !!fav;
    isWatching = !!alertSub;
  }

  // ── Computed stats (needed for both gated + authenticated views) ──
  const totalClients = [
    firm.client_hnw_number, firm.client_non_hnw_number, firm.client_pension_number,
    firm.client_charitable_number, firm.client_corporations_number, firm.client_pooled_vehicles_number,
    firm.client_other_number, firm.client_banks_number, firm.client_bdc_number,
    firm.client_govt_number, firm.client_insurance_number, firm.client_investment_cos_number,
    firm.client_other_advisors_number, firm.client_swf_number,
  ].reduce((sum, v) => (sum || 0) + (v || 0), 0) as number;

  const avgClientSize = totalClients > 0 && firm.aum
    ? firm.aum / totalClients : null;
  const aumPerInvPro = firm.employee_investment && firm.employee_investment > 0 && firm.aum
    ? firm.aum / firm.employee_investment : null;
  const minAccount = feesAndMins?.minimum_account_size
    ? parseFloat(feesAndMins.minimum_account_size) : null;
  const minFee = feesAndMins?.minimum_fee
    ? parseFloat(feesAndMins.minimum_fee) : null;

  const feeTypeDisplay = feesAndMins?.fee_structure_type
    ? (FEE_TYPE_LABELS[feesAndMins.fee_structure_type] || feesAndMins.fee_structure_type)
    : 'Not disclosed';

  // ── Growth chart data (preserve data logic) ──
  let aumBars: BarData[] = [];
  let clientBars: BarData[] = [];
  let aumStats = { currentAum: 0, fiveYearDeltaAbs: 0, fiveYearDeltaPct: 0, avgAnnualPct: 0, threeYearCagr: 0 };
  let showGrowthSection = false;

  if (growth && growth.length > 0) {
    const byYear = new Map<number, { year: number; dateObj: Date; aum: number; clients: number | null }>();
    growth.forEach(g => {
      const aum = parseAUM(g.aum);
      const clients = g.client_total_or_calc ? parseInt(g.client_total_or_calc.replace(/,/g, '')) : null;
      const parts = (g.date_submitted || '').split('/');
      if (parts.length !== 3 || aum == null) return;
      const dateObj = new Date(+parts[2], +parts[0] - 1, +parts[1]);
      const year = dateObj.getFullYear();
      if (!byYear.has(year) || dateObj.getTime() > byYear.get(year)!.dateObj.getTime()) {
        byYear.set(year, { year, dateObj, aum, clients });
      }
    });
    const years = Array.from(byYear.values())
      .sort((a, b) => a.year - b.year)
      .slice(-10);

    if (years.length >= 3) {
      showGrowthSection = true;
      const maxAum = Math.max(...years.map(y => y.aum), 1);
      const maxClients = Math.max(...years.filter(y => y.clients != null).map(y => y.clients!), 1);

      aumBars = years.map((y, i) => {
        const prev = years[i - 1];
        const pctChange = prev ? ((y.aum - prev.aum) / prev.aum * 100) : null;
        return {
          label: String(y.year),
          fraction: y.aum / maxAum,
          topLabel: formatAUM(y.aum),
          delta: pctChange != null ? `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(0)}%` : undefined,
          deltaPositive: pctChange != null ? pctChange >= 0 : undefined,
          color: '#22995E',
        };
      });

      clientBars = years.map((y, i) => {
        const prev = years[i - 1];
        const pctChange = (prev && y.clients != null && prev.clients != null)
          ? ((y.clients - prev.clients) / prev.clients * 100) : null;
        return {
          label: String(y.year),
          fraction: y.clients != null ? y.clients / maxClients : 0,
          topLabel: y.clients != null ? y.clients.toLocaleString() : '—',
          delta: pctChange != null ? `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(0)}%` : undefined,
          deltaPositive: pctChange != null ? pctChange >= 0 : undefined,
          color: '#4B8ECC',
        };
      });

      const latest = years[years.length - 1];
      const oldest5 = years.length >= 6 ? years[years.length - 6] : years[0];
      const fiveYearDeltaAbs = latest.aum - oldest5.aum;
      const fiveYearDeltaPct = oldest5.aum > 0 ? (fiveYearDeltaAbs / oldest5.aum * 100) : 0;
      // Full-period CAGR (for the growth section)
      const n = years.length - 1;
      const avgAnnualPct = n > 0 && years[0].aum > 0
        ? (Math.pow(latest.aum / years[0].aum, 1 / n) - 1) * 100 : 0;
      // 3-year CAGR (for the hero stat)
      const threeYearAgo = years.length >= 4 ? years[years.length - 4] : years[0];
      const threeYearN = years.length >= 4 ? 3 : years.length - 1;
      const threeYearCagr = threeYearN > 0 && threeYearAgo.aum > 0
        ? (Math.pow(latest.aum / threeYearAgo.aum, 1 / threeYearN) - 1) * 100 : 0;

      aumStats = {
        currentAum: latest.aum,
        fiveYearDeltaAbs,
        fiveYearDeltaPct,
        avgAnnualPct,
        threeYearCagr,
      };
    }
  }

  // ── Client breakdown for section ──
  const clientTypeRows: Array<{ name: string; count: number; pct: number }> = [];
  if (clientBreakdown && totalClients > 0) {
    const entries = [
      { name: 'High net worth individuals', count: clientBreakdown.hnw },
      { name: 'Families / family offices', count: clientBreakdown.non_hnw },
      { name: 'Foundations & endowments', count: clientBreakdown.charitable },
      { name: 'Pension plans', count: clientBreakdown.pension },
      { name: 'Corporations', count: clientBreakdown.corporations },
      { name: 'Pooled investment vehicles', count: clientBreakdown.pooled_vehicles },
    ].filter(e => e.count != null && e.count > 0) as Array<{ name: string; count: number }>;
    const entryTotal = entries.reduce((s, e) => s + e.count, 0) || 1;
    entries.forEach(e => clientTypeRows.push({ name: e.name, count: e.count, pct: e.count / entryTotal * 100 }));
    clientTypeRows.sort((a, b) => b.pct - a.pct);
  }

  // ── Hero badges ──
  const heroBadges: Array<{ label: string; green: boolean; href?: string }> = [
    { label: 'Fiduciary', green: true, href: '/search?type=ria' },
  ];
  if (feesAndMins?.fee_structure_type) {
    const feeFilterMap: Record<string, string> = { 'range': 'range', 'tiered': 'tiered', 'flat_percentage': 'flat_percentage', 'capped': 'capped' };
    const feeParam = feeFilterMap[feesAndMins.fee_structure_type];
    heroBadges.push({ label: feeTypeDisplay, green: false, href: feeParam ? `/search?fee=${feeParam}` : undefined });
  }
  if (firm.legal_structure) heroBadges.push({ label: firm.legal_structure, green: false });
  if (profileText?.firm_character) {
    heroBadges.push({ label: profileText.firm_character.split(',')[0].trim(), green: false });
  }

  // ── Score ──
  const finalScore: number = (firmScore as unknown as Record<string, number>)?.final_score ?? 0;

  // ── New: Similar firms + score percentile + stat percentiles (parallel) ──
  const [similarFirms, scoreRank, statPct] = await Promise.all([
    firm.main_office_state
      ? getSimilarFirms({ supabase, crd: firm.crd, state: firm.main_office_state, aum: firm.aum, firmRow: firm as unknown as Record<string, any> })
      : Promise.resolve([]),
    finalScore > 0 ? getScorePercentile(finalScore) : Promise.resolve(null),
    getStatPercentiles(firm, totalClients, avgClientSize, aumPerInvPro, minAccount),
  ]);

  // ── VVS bars data ──
  const fs = firmScore as unknown as Record<string, number> | null;
  const vvsBars = fs ? [
    { label: 'Disclosure Quality', score: fs.disclosure_score ?? 0, tip: 'Measures completeness and clarity of ADV filings, including brochure quality and update frequency.' },
    { label: 'Fee Transparency', score: fs.fee_transparency_score ?? 0, tip: 'Assesses how explicitly the firm discloses its fee structure, tiers, and any additional costs.' },
    { label: 'Fee Competitiveness', score: fs.fee_competitiveness_score ?? 0, tip: 'Benchmarks the firm\'s stated fees against peers of similar AUM and client type.' },
    { label: 'Conflict-Free', score: fs.conflict_free_score ?? 0, tip: 'Evaluates disclosed conflicts of interest including referral arrangements and third-party compensation.' },
    { label: 'AUM Growth', score: fs.aum_growth_score ?? 0, tip: 'Measures AUM growth rate over 3 and 5 years relative to peer median.' },
    { label: 'Client Growth', score: fs.client_growth_score ?? 0, tip: 'Tracks net new client additions year-over-year as a signal of firm health.' },
    { label: 'Advisor Bandwidth', score: fs.advisor_bandwidth_score ?? 0, tip: 'Ratio of clients to advisory staff. Lower ratios indicate more attentive service capacity.' },
    { label: 'Investment Mix', score: fs.derivatives_score ?? 0, tip: 'Flags use of complex instruments like options, swaps, or leverage in client portfolios.' },
  ] : [];

  // ── Fee tier table ──
  const sortedFeeTiers = feeTiers
    ? [...feeTiers].sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'))
    : [];

  // ── Active sections for nav (filter out unavailable sections) ──
  // ── Allocation rows ──
  const ALLOC_LABELS: Record<string, { label: string; color: string }> = {
    public_equity:    { label: 'Individual Stocks',                    color: '#22995E' },
    private_equity:   { label: 'Private Equity',                      color: '#1A7A4A' },
    ig_corp_bonds:    { label: 'IG Corporate Bonds',                  color: '#4B8ECC' },
    non_ig_corp_bonds:{ label: 'Non-IG Corp Bonds',                   color: '#7AA8D4' },
    us_govt_bonds:    { label: 'US Treasury Bonds',                   color: '#2E6BAD' },
    us_muni_bonds:    { label: 'US Municipal Bonds',                  color: '#5BA0D9' },
    cash:             { label: 'Cash & Equivalents',                  color: '#B0C4BA' },
    derivatives:      { label: 'Funds, ETFs, and Alternatives', color: '#F59E0B' },
    other:            { label: 'Other',                               color: '#8FA69A' },
  };

  const allocRows: Array<{ key: string; label: string; pct: number; color: string }> = [];
  if (assetAllocation) {
    for (const [key, meta] of Object.entries(ALLOC_LABELS)) {
      const val = assetAllocation[key as keyof AssetAllocation];
      if (val != null && val > 0) {
        allocRows.push({ key, label: meta.label, pct: val, color: meta.color });
      }
    }
    allocRows.sort((a, b) => b.pct - a.pct);
  }

  const activeSections = SECTION_NAV.filter(s =>
    !(s.id === 'about' && !profileText?.business_profile && !profileText?.investment_philosophy) &&
    !(s.id === 'aum' && !showGrowthSection) &&
    !(s.id === 'allocation' && allocRows.length === 0)
  );

  // ── JSON-LD Structured Data ──────────────────────────────────────────────────
  const firmJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    '@id': `https://visorindex.com/firm/${firm.crd}`,
    name: firmTitleCase,
    url: `https://visorindex.com/firm/${firm.crd}`,
    ...(website?.website && { sameAs: [website.website] }),
    ...(profileText?.business_profile && { description: profileText.business_profile.slice(0, 500) }),
    ...(firm.main_phone_number && { telephone: firm.main_phone_number }),
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'SEC CRD',
      value: String(firm.crd),
    },
    ...(firm.main_office_city && firm.main_office_state && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: [firm.main_office_street_1, firm.main_office_street_2].filter(Boolean).join(', ') || undefined,
        addressLocality: firm.main_office_city,
        addressRegion: firm.main_office_state,
        postalCode: firm.main_office_zip || undefined,
        addressCountry: 'US',
      },
    }),
    ...(firm.aum != null && {
      aggregateRating: undefined, // placeholder slot — no ratings data yet
    }),
    provider: {
      '@type': 'Organization',
      name: 'Visor Index',
      url: 'https://visorindex.com',
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Search', item: 'https://visorindex.com/search' },
      ...(firm.main_office_state ? [{
        '@type': 'ListItem' as const,
        position: 2,
        name: firm.main_office_state,
        item: `https://visorindex.com/directory/${firm.main_office_state.toLowerCase()}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: firm.main_office_state ? 3 : 2,
        name: firmTitleCase,
        item: `https://visorindex.com/firm/${firm.crd}`,
      },
    ],
  };

  const jsonLdScript = (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(firmJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );

  // ── GATED VIEW (unauthenticated) ─────────────────────────────────────────────
  if (!user) {
    const truncatedAbout = profileText?.business_profile
      ? profileText.business_profile.slice(0, 280) + '…'
      : 'This SEC-registered investment adviser provides fiduciary wealth management services. Create a free account to read the full profile, including investment philosophy, fee structure, and regulatory history.';

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
        {jsonLdScript}

        {/* Breadcrumb hidden for gated view */}

        <div className="vfp-page">

          {/* ── GATED CONTENT ── */}
          <div style={{ position: 'relative', minHeight: 700, marginTop: 24 }}>

            {/* Blurred preview sections */}
            <div className="vfp-gate-blur">

              {/* Hero preview */}
              <div className="vfp-hero">
                <div className="vfp-hero-top">
                  <div className="vfp-logo-col">
                    <div className="vfp-logo-mark">
                      <FirmLogo logoKey={logoKey} firmName={firmDisplayName} size="lg" className="!h-[64px] !w-[64px] !text-xl" />
                    </div>
                  </div>
                  <div className="vfp-hero-text">
                    <h1 className="vfp-firm-name">{firmDisplayName}</h1>
                    <div className="vfp-meta-row">
                      {firm.main_office_city && (
                        <span className="vfp-meta-item">
                          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 11 11">
                            <circle cx="5.5" cy="4.5" r="2" /><path d="M1 10c0-2.5 2-4.5 4.5-4.5S10 7.5 10 10" />
                          </svg>
                          {firm.main_office_city}, {firm.main_office_state}
                        </span>
                      )}
                      <span className="vfp-meta-item">
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 11 11">
                          <path d="M5.5 1v1M5.5 9v1M1 5.5h1M9 5.5h1" /><circle cx="5.5" cy="5.5" r="2.5" />
                        </svg>
                        CRD #{firm.crd}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="vfp-stats-row">
                  <div className="vfp-stat">
                    <div className="vfp-stat-label">AUM</div>
                    <div className="vfp-stat-val">{formatAUM(firm.aum)}</div>
                  </div>
                  <div className="vfp-stat">
                    <div className="vfp-stat-label">Min. Account</div>
                    <div className="vfp-stat-val">{minAccount ? formatAUM(minAccount) : '—'}</div>
                  </div>
                  <div className="vfp-stat">
                    <div className="vfp-stat-label">Avg. Client Size</div>
                    <div className="vfp-stat-val">{avgClientSize ? formatAUM(avgClientSize) : '—'}</div>
                  </div>
                  <div className="vfp-stat">
                    <div className="vfp-stat-label">Employees</div>
                    <div className="vfp-stat-val">{firm.employee_total ?? '—'}</div>
                  </div>
                </div>
              </div>

              {/* About preview */}
              <div className="vfp-section" style={{ paddingTop: 32 }}>
                <div className="vfp-section-head">
                  <span className="vfp-section-title">About</span>
                  <span className="vfp-section-meta">Derived from ADV Part 2A</span>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--rule)', padding: '24px 28px' }}>
                  <p className="vfp-gate-preview-data" style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.75, margin: 0 }}>
                    {truncatedAbout}
                  </p>
                </div>
              </div>

              {/* Visor Index preview */}
              <div className="vfp-section" style={{ marginTop: 40 }}>
                <div className="vfp-section-head">
                  <span className="vfp-section-title">Visor Index Score™</span>
                  <span className="vfp-section-meta">Composite of 8 dimensions</span>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--rule)', padding: '24px 28px' }}>
                  <div className="vfp-gate-preview-data" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {(vvsBars.length > 0 ? vvsBars.slice(0, 4) : [
                      { label: 'Disclosure Quality', score: 72 },
                      { label: 'Fee Transparency', score: 85 },
                      { label: 'Fee Competitiveness', score: 64 },
                      { label: 'Conflict-Free', score: 78 },
                    ]).map((bar, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', width: 140, flexShrink: 0 }}>{bar.label}</span>
                        <div style={{ flex: 1, height: 8, background: 'var(--rule)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${bar.score}%`, height: '100%', background: 'var(--green-3)', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)', width: 24, textAlign: 'right' }}>{bar.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fee Schedule preview */}
              <div className="vfp-section" style={{ marginTop: 40 }}>
                <div className="vfp-section-head">
                  <span className="vfp-section-title">Fee Schedule</span>
                  <span className="vfp-section-meta">{feeTypeDisplay}</span>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--rule)', padding: '24px 28px' }}>
                  <div className="vfp-gate-preview-data">
                    {sortedFeeTiers.length > 0 ? (
                      <table style={{ width: '100%', fontSize: 12, fontFamily: 'var(--mono)', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                            <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--ink-3)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em' }}>AUM Range</th>
                            <th style={{ textAlign: 'right', padding: '8px 0', color: 'var(--ink-3)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em' }}>Annual Fee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedFeeTiers.slice(0, 4).map((tier, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--rule)' }}>
                              <td style={{ padding: '10px 0', color: 'var(--ink-2)' }}>
                                {formatAUM(parseInt(tier.min_aum || '0'))} – {tier.max_aum ? formatAUM(tier.max_aum) : '∞'}
                              </td>
                              <td style={{ textAlign: 'right', padding: '10px 0', color: 'var(--ink)' }}>
                                {tier.fee_pct ? `${(tier.fee_pct * 100).toFixed(2)}%` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.75, margin: 0 }}>
                        Fee schedule details are available in the full profile. Create a free account to view tiered fee breakdowns and use our interactive fee calculator.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* AUM & Growth preview */}
              <div className="vfp-section" style={{ marginTop: 40 }}>
                <div className="vfp-section-head">
                  <span className="vfp-section-title">AUM &amp; Growth</span>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--rule)', padding: '24px 28px' }}>
                  <div className="vfp-gate-preview-data" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Current AUM</div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--navy)', marginTop: 4 }}>{formatAUM(firm.aum)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Avg Annual Growth</div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--green)', marginTop: 4 }}>
                        {aumStats.avgAnnualPct > 0 ? `${aumStats.avgAnnualPct.toFixed(1)}%` : '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Total Clients</div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--navy)', marginTop: 4 }}>
                        {totalClients > 0 ? totalClients.toLocaleString() : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regulatory preview */}
              <div className="vfp-section" style={{ marginTop: 40, paddingBottom: 32 }}>
                <div className="vfp-section-head">
                  <span className="vfp-section-title">Regulatory &amp; Disciplinary</span>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--rule)', padding: '24px 28px' }}>
                  <p className="vfp-gate-preview-data" style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.75, margin: 0 }}>
                    Regulatory disclosure history, disciplinary events, and compliance record details are available in the full profile view.
                  </p>
                </div>
              </div>
            </div>

            {/* ── CTA OVERLAY CARD ── */}
            <div className="vfp-gate-cta">
              <div className="vfp-gc-eyebrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                UNLOCK FULL PROFILE
              </div>
              <h2 className="vfp-gc-headline">
                Everything you need to know about {firmTitleCase}.
              </h2>
              <p className="vfp-gc-sub">
                Get Visor Index scores, fee breakdowns, growth trends, regulatory history, firm alerts, and more when you sign up today.
              </p>
              <div className="vfp-gc-ctas">
                <Link href="/auth/signup" className="vfp-gc-cta-primary">Get Full Access →</Link>
                <Link href="/pricing" className="vfp-gc-cta-secondary">View Pricing</Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      {jsonLdScript}

      {/* Fixed breadcrumb bar */}
      <div className="vfp-breadcrumb">
        <div className="vfp-breadcrumb-i">
          <div className="vfp-bc-trail">
            <Link href="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 14 }}>←</span> Search
            </Link>
            <span className="vfp-bc-sep">›</span>
            {firm.main_office_city && firm.main_office_state && (
              <>
                <Link href={`/search?city=${encodeURIComponent(firm.main_office_city)}&state=${encodeURIComponent(firm.main_office_state)}`}>
                  {firm.main_office_city} · {firm.main_office_state}
                </Link>
                <span className="vfp-bc-sep">›</span>
              </>
            )}
            <span className="vfp-bc-current">{firmDisplayName}</span>
          </div>
          <div className="vfp-bc-actions">
            <SaveFirmButton crd={firm.crd} initialSaved={isSaved} initialWatching={isWatching} />
            <Link href={`/compare?add=${firm.crd}`} className="vfp-bc-compare">
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 11 11">
                <rect x="1" y="4" width="3" height="6" /><rect x="4.5" y="2" width="3" height="8" /><rect x="8" y="5" width="3" height="5" />
              </svg>
              Compare
            </Link>
          </div>
        </div>
      </div>

      {/* Page shell */}
      <div className="vfp-page">

        {/* ── HERO BAND ── */}
        <div className="vfp-hero">
          <div className="vfp-hero-top">

            {/* Logo column */}
            <div className="vfp-logo-col">
              <div className="vfp-logo-mark">
                <FirmLogo logoKey={logoKey} firmName={firmDisplayName} size="lg" className="!h-[64px] !w-[64px] !text-xl" />
              </div>
            </div>

            {/* Identity: 2 lines */}
            <div className="vfp-hero-text">
              <h1 className="vfp-firm-name">{firmDisplayName}</h1>
              <div className="vfp-meta-row">
                {firm.main_office_city && (
                  <span className="vfp-meta-item">
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 11 11">
                      <circle cx="5.5" cy="4.5" r="2" /><path d="M1 10c0-2.5 2-4.5 4.5-4.5S10 7.5 10 10" />
                    </svg>
                    {firm.main_office_city}, {firm.main_office_state}
                  </span>
                )}
                {website?.website && (
                  <span className="vfp-meta-item">
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 11 11">
                      <circle cx="5.5" cy="5.5" r="4.5" /><path d="M1 5.5h9M5.5 1c-1.4 1.5-2.2 3-2.2 4.5s.8 3 2.2 4.5M5.5 1c1.4 1.5 2.2 3 2.2 4.5S6.9 8.5 5.5 10" />
                    </svg>
                    <a href={website.website.startsWith('http') ? website.website : `https://${website.website}`}
                      target="_blank" rel="noopener noreferrer">
                      {website.website.replace(/^https?:\/\//, '')}
                    </a>
                  </span>
                )}
                <span className="vfp-meta-item">
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 11 11">
                    <path d="M5.5 1v1M5.5 9v1M1 5.5h1M9 5.5h1" /><circle cx="5.5" cy="5.5" r="2.5" />
                  </svg>
                  CRD #{firm.crd}
                </span>
              </div>

              {/* Mobile action buttons — hidden on desktop where breadcrumb has them */}
              <div className="vfp-hero-actions">
                <SaveFirmButton crd={firm.crd} initialSaved={isSaved} initialWatching={isWatching} />
                <Link href={`/compare?add=${firm.crd}`} className="vfp-bc-compare">
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 11 11">
                    <rect x="1" y="4" width="3" height="6" /><rect x="4.5" y="2" width="3" height="8" /><rect x="8" y="5" width="3" height="5" />
                  </svg>
                  Compare
                </Link>
              </div>
            </div>

          </div>

          {/* Stats row */}
          <div className="vfp-stats-row">
            <div className="vfp-stat">
              <div className="vfp-stat-label">AUM</div>
              <div className="vfp-stat-val">{formatAUM(firm.aum)}</div>
              <div className="vfp-stat-sub">
                {aumStats.threeYearCagr > 0
                  ? `↑ ${aumStats.threeYearCagr.toFixed(1)}% 3yr avg annual`
                  : statPct.aum
                    ? statPct.aum + ' of firms'
                    : 'Assets under management'}
              </div>
            </div>
            <div className="vfp-stat">
              <div className="vfp-stat-label">Min. Account</div>
              <div className="vfp-stat-val">{minAccount ? formatAUM(minAccount) : '—'}</div>
              <div className="vfp-stat-sub">{minFee ? `Min fee ${formatCurrency(minFee)}` : minAccount ? 'No minimum fee disclosed' : 'No minimum disclosed'}</div>
            </div>
            <div className="vfp-stat">
              <div className="vfp-stat-label">Avg. Client Size</div>
              <div className="vfp-stat-val">{avgClientSize ? formatAUM(avgClientSize) : '—'}</div>
              <div className="vfp-stat-sub">{totalClients > 0 ? `${totalClients.toLocaleString()} total clients` : 'Per client average'}</div>
            </div>
            <div className="vfp-stat">
              <div className="vfp-stat-label">Clients / Inv. Pro</div>
              <div className="vfp-stat-val">
                {totalClients > 0 && firm.employee_investment && firm.employee_investment > 0
                  ? Math.round(totalClients / firm.employee_investment)
                  : '—'}
              </div>
              <div className="vfp-stat-sub">{statPct.clientsPerAdvisor ? statPct.clientsPerAdvisor + ' of firms' : 'Client-to-advisor ratio'}</div>
            </div>
            <div className="vfp-stat">
              <div className="vfp-stat-label">Employees</div>
              <div className="vfp-stat-val">{firm.employee_total ?? '—'}</div>
              <div className="vfp-stat-sub">{firm.employee_investment ? `${firm.employee_investment} investment staff` : 'Total headcount'}</div>
            </div>
            <div className="vfp-stat vfp-stat-score">
              <div className="vfp-stat-label">Visor Index™</div>
              {finalScore > 0 ? (
                <ScoreRing score={finalScore} />
              ) : (
                <div className="vfp-stat-val">—</div>
              )}
              <div className="vfp-stat-sub">{scoreRank ? `Top ${Math.ceil((scoreRank.rank / scoreRank.total) * 100)}%` : 'Out of 100'}</div>
            </div>
          </div>
        </div>

        {/* ── SECTION NAV ── */}
        <SectionNav sections={activeSections} />

        {/* ── BODY ── */}
        <div className="vfp-body">

          {/* ══ MAIN COLUMN ══ */}
          <main>

            {/* ── ABOUT ── */}
            {(profileText?.business_profile || profileText?.investment_philosophy) && (
              <div className="vfp-section" id="about">
                <div className="vfp-section-head">
                  <span className="vfp-section-title">About</span>
                  <span className="vfp-section-meta">Derived from ADV Part 2A</span>
                </div>
                <div className="vfp-about-card">
                  {profileText.business_profile && (
                    <ExpandableText
                      text={profileText.business_profile}
                      maxLines={4}
                      style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.9, margin: 0, fontFamily: 'var(--sans)' }}
                    >
                      {/* Firm Classification */}
                      <div style={{ marginTop: 16 }}>
                        <div style={{
                          fontSize: 8, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase' as const,
                          color: 'var(--ink-3)', marginBottom: 6, fontFamily: 'var(--sans)',
                        }}>
                          Firm Classification
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {heroBadges.map((b, i) => b.href ? (
                            <Link key={`b-${i}`} href={b.href} className="vfp-tag-class" style={{
                              fontFamily: 'var(--sans)', fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const,
                              padding: '3px 8px', borderRadius: 3, textDecoration: 'none',
                              background: b.green ? 'var(--green-pale)' : 'rgba(26,122,74,.04)',
                              color: b.green ? 'var(--green)' : 'var(--green)',
                              border: '0.5px solid rgba(26,122,74,.2)',
                            }}>{b.label}</Link>
                          ) : (
                            <span key={`b-${i}`} className="vfp-tag-class" style={{
                              fontFamily: 'var(--sans)', fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const,
                              padding: '3px 8px', borderRadius: 3,
                              background: 'rgba(26,122,74,.04)', color: 'var(--green)',
                              border: '0.5px solid rgba(26,122,74,.2)',
                            }}>{b.label}</span>
                          ))}
                        </div>
                      </div>

                      {/* Specialties & Client Focus */}
                      {(profileText.specialty_strategies || profileText.client_base || profileText.wealth_tier) && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{
                            fontSize: 8, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase' as const,
                            color: 'var(--ink-3)', marginBottom: 6, fontFamily: 'var(--sans)',
                          }}>
                            Specialties &amp; Client Focus
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {[profileText.specialty_strategies, profileText.client_base, profileText.wealth_tier]
                              .filter(Boolean)
                              .flatMap(s => s!.split(',').map(t => t.trim()))
                              .slice(0, 6)
                              .map((tag, i) => {
                                const slug = tag.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
                                return (
                                  <Link key={`t-${i}`} href={`/search?tag=${slug}`} className="vfp-tag-spec" style={{
                                    fontFamily: 'var(--sans)', fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const,
                                    padding: '3px 8px', border: '0.5px solid var(--rule)', color: 'var(--ink-3)', borderRadius: 3,
                                    textDecoration: 'none', transition: 'border-color .15s, color .15s',
                                  }}>{tag}</Link>
                                );
                              })
                            }
                          </div>
                        </div>
                      )}
                    </ExpandableText>
                  )}
                </div>
              </div>
            )}

            {/* ── VISOR VALUE SCORE ── */}
            <div className="vfp-section" id="vvs">
              <div className="vfp-section-head">
                <span className="vfp-section-title">Visor Index Score™</span>
                <span className="vfp-section-meta">Based on Form ADV filing · SEC data</span>
              </div>

              {finalScore > 0 && fs ? (
                <div className="vfp-vvs-card">
                  <div className="vfp-vvs-overall">
                    <div>
                      <div className="vfp-vvs-big" style={{ color: scoreColor(finalScore) }}>
                        {Math.round(finalScore)}
                      </div>
                      <div className="vfp-vvs-big-label">out of 100</div>
                    </div>
                    <div className="vfp-vvs-rank">
                      {scoreRank && (
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 8, fontFamily: 'var(--sans)' }}>
                          {(() => {
                            const pct = Math.ceil((scoreRank.rank / scoreRank.total) * 100);
                            return pct <= 50
                              ? `Top ${Math.max(pct, 1)}% of Wealth Firms on Visor Index`
                              : `Bottom ${Math.max(100 - pct + 1, 1)}% of Wealth Firms on Visor Index`;
                          })()}
                        </div>
                      )}
                      <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, fontFamily: 'var(--sans)' }}>
                        Score derived from a proprietary methodology across regulatory disclosures, fee transparency, firm structure, growth, investment offering, and service capacity.
                      </div>
                    </div>
                  </div>
                  <div className="vfp-vvs-bars-wrap">
                    <AnimatedBars bars={vvsBars.map(b => ({ ...b, color: scoreColor(b.score) }))} />
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '40px 32px', background: '#fff', border: '1px solid var(--rule)',
                  textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 13,
                }}>
                  Score not yet available for this firm
                </div>
              )}
            </div>

            {/* ── FEE SCHEDULE ── */}
            <div className="vfp-section" id="fees">
              <div className="vfp-section-head">
                <span className="vfp-section-title">Fees &amp; Pricing</span>
                <span className="vfp-section-meta">Disclosed in ADV Part 2A · Item 5</span>
              </div>

              <FeeCalculator
                feeTiers={feeTiers}
                crd={String(firm.crd)}
                firmAum={firm.aum}
                industryOnly={(!feeTiers || feeTiers.length === 0) && !(feesAndMins?.fee_range_min && feesAndMins?.fee_range_max && avgClientSize) && !(feesAndMins?.fee_range_max && avgClientSize)}
                feeTypeDisplay={feeTypeDisplay}
                feeNotes={feesAndMins?.notes ?? null}
                minAccount={minAccount}
                minFee={minFee}
                sortedFeeTiers={sortedFeeTiers}
                feeRangeMin={feesAndMins?.fee_range_min ? parseFloat(feesAndMins.fee_range_min) : null}
                feeRangeMax={feesAndMins?.fee_range_max ? parseFloat(feesAndMins.fee_range_max) : null}
                avgClientSize={avgClientSize}
              />
            </div>

            {/* ── AUM & GROWTH ── */}
            {showGrowthSection && (
              <div className="vfp-section" id="aum">
                <div className="vfp-section-head">
                  <span className="vfp-section-title">AUM &amp; Client Growth</span>
                  <span className="vfp-section-meta">Annual · SEC ADV filings</span>
                </div>

                <div className="vfp-aum-wrap">
                  <div className="vfp-aum-head">
                    <div className="vfp-aum-stat">
                      <div className="vfp-aum-stat-label">Current AUM</div>
                      <div className="vfp-aum-stat-val">{formatAUM(firm.aum ?? aumStats.currentAum)}</div>
                      <div className="vfp-aum-stat-sub">Total · latest filing</div>
                    </div>
                    <div className="vfp-aum-stat">
                      <div className="vfp-aum-stat-label">Total Growth (Period)</div>
                      <div className="vfp-aum-stat-val">
                        {aumStats.fiveYearDeltaAbs >= 0 ? '+' : ''}{formatAUM(Math.abs(aumStats.fiveYearDeltaAbs))}
                      </div>
                      <div className={`vfp-aum-stat-delta ${aumStats.fiveYearDeltaPct >= 0 ? 'up' : 'dn'}`}>
                        {aumStats.fiveYearDeltaPct >= 0 ? '↑' : '↓'} {Math.abs(aumStats.fiveYearDeltaPct).toFixed(0)}% over period
                      </div>
                    </div>
                    <div className="vfp-aum-stat">
                      <div className="vfp-aum-stat-label">Avg. Annual Growth</div>
                      <div className="vfp-aum-stat-val">{aumStats.avgAnnualPct.toFixed(1)}%</div>
                      <div className="vfp-aum-stat-sub">CAGR over filing period</div>
                    </div>
                  </div>

                  {/* AUM bar chart */}
                  <AnimatedBarChart
                    bars={aumBars}
                    title="AUM Growth"
                    subtitle={`Annual (last ${aumBars.length} years)`}
                  />

                  {/* Client growth bar chart */}
                  {clientBars.some(b => b.fraction > 0) && (
                    <div className="vfp-chart-divider">
                      <AnimatedBarChart
                        bars={clientBars}
                        title="Client Growth"
                        subtitle={`Annual (last ${clientBars.length} years)`}
                      />
                    </div>
                  )}

                  <div className="vfp-aum-footer">
                    <span>Source: SEC Form ADV filings · Reported annually</span>
                    <span>Discretionary AUM</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── CLIENTS ── */}
            {totalClients > 0 && (
              <div className="vfp-section" id="clients">
                <div className="vfp-section-head">
                  <span className="vfp-section-title">Client Count &amp; Composition</span>
                  <span className="vfp-section-meta">{totalClients > 0 ? `${totalClients.toLocaleString()} total · ` : ''}As of latest ADV filing</span>
                </div>

                <div className="vfp-client-wrap">
                  <div className="vfp-client-head">
                    <div className="vfp-client-stat">
                      <div className="vfp-client-card-label">Total Clients</div>
                      <div className="vfp-client-card-val">{totalClients.toLocaleString()}</div>
                      <div className="vfp-client-card-sub">As of latest ADV filing</div>
                    </div>
                    <div className="vfp-client-stat">
                      <div className="vfp-client-card-label">AUM per Client</div>
                      <div className="vfp-client-card-val">{avgClientSize ? formatAUM(avgClientSize) : '—'}</div>
                      <div className="vfp-client-card-sub">Total AUM ÷ client count</div>
                    </div>
                    <div className="vfp-client-stat">
                      <div className="vfp-client-card-label">AUM per Inv. Pro</div>
                      <div className="vfp-client-card-val">
                        {firm.employee_investment && firm.employee_investment > 0 && firm.aum
                          ? formatAUM(firm.aum / firm.employee_investment)
                          : '—'}
                      </div>
                      <div className="vfp-client-card-sub">{firm.employee_investment ?? 0} investment staff</div>
                    </div>
                  </div>

                  {clientTypeRows.length > 0 && (
                    <div className="vfp-client-breakdown">
                      <div className="vfp-client-bd-head">Client Type Breakdown</div>
                      <AnimatedRows>
                        {clientTypeRows.map((row, i) => (
                          <div key={i} className="vfp-client-type-row" style={{ transitionDelay: `${i * 60}ms` }}>
                            <div className="vfp-client-type-name">{row.name}</div>
                            <div className="vfp-client-type-pct">{row.pct.toFixed(0)}%</div>
                            <div className="vfp-client-type-bar">
                              <div className="vfp-client-type-fill" style={{ width: `${row.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </AnimatedRows>
                    </div>
                  )}

                  <div className="vfp-client-footer">Source: SEC Form ADV · Reported by registrant</div>
                </div>
              </div>
            )}

            {/* ── ASSET ALLOCATION ── */}
            {allocRows.length > 0 && (
              <div className="vfp-section" id="allocation">
                <div className="vfp-section-head">
                  <span className="vfp-section-title">Asset Allocation</span>
                  <span className="vfp-section-meta">Form ADV · Self-reported</span>
                </div>

                <div className="vfp-alloc-wrap">
                  <div className="vfp-alloc-inner">
                    {/* Stacked bar */}
                    <div className="vfp-alloc-bar">
                      {allocRows.map(r => (
                        <div
                          key={r.key}
                          className="vfp-alloc-bar-seg"
                          style={{ width: `${r.pct}%`, background: r.color }}
                          data-tip={`${r.label}: ${r.pct.toFixed(1)}%`}
                        />
                      ))}
                    </div>

                    {/* Legend rows */}
                    <AnimatedRows>
                      {allocRows.map((r, i) => (
                        <div key={r.key} className="vfp-alloc-row" style={{ transitionDelay: `${i * 60}ms` }}>
                          <div className="vfp-alloc-dot" style={{ background: r.color }} />
                          <div className="vfp-alloc-label">{r.label}</div>
                          <div className="vfp-alloc-bar-mini">
                            <div className="vfp-alloc-fill-mini" style={{ width: `${r.pct}%`, background: r.color }} />
                          </div>
                          <div className="vfp-alloc-pct">{r.pct.toFixed(1)}%</div>
                        </div>
                      ))}
                    </AnimatedRows>
                  </div>

                  <div className="vfp-alloc-footer">Source: Form ADV · Self-reported by registrant</div>
                </div>
              </div>
            )}

            {/* ── REGULATORY ── */}
            <div className="vfp-section" id="regulatory">
              <div className="vfp-section-head">
                <span className="vfp-section-title">Regulatory History</span>
                <span className="vfp-section-meta">IAPD · SEC EDGAR · FINRA BrokerCheck</span>
              </div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <RegulatoryDisclosures firmData={firm as any} crd={firm.crd} />
            </div>

            {/* ── NEWS & ALERTS ── */}
            <div className="vfp-section" id="news">
              <div className="vfp-section-head">
                <span className="vfp-section-title">Activity &amp; News</span>
                <span className="vfp-section-meta">SEC filings · Industry news</span>
              </div>
              <FirmAlerts crd={firm.crd} />
            </div>

            {/* ── KEY PERSONNEL ── */}
            <div className="vfp-section" id="personnel">
              <div className="vfp-section-head">
                <span className="vfp-section-title">Key Personnel</span>
                <span className="vfp-section-meta">{firm.employee_total ? `${firm.employee_total} employees · ` : ''}ADV Part 1 · Schedule A</span>
              </div>
              <div className="vfp-personnel-wrap">
                <div className="vfp-personnel-head">
                  <div className="vfp-personnel-stat">
                    <div className="vfp-client-card-label">Total Employees</div>
                    <div className="vfp-client-card-val">{firm.employee_total ?? '—'}</div>
                    <div className="vfp-client-card-sub">{statPct.employees ? `${statPct.employees} of firms` : 'Firm-wide headcount'}</div>
                  </div>
                  <div className="vfp-personnel-stat">
                    <div className="vfp-client-card-label">Investment Staff</div>
                    <div className="vfp-client-card-val">{firm.employee_investment ?? '—'}</div>
                    <div className="vfp-client-card-sub">{statPct.invStaff ? `${statPct.invStaff} of firms` : 'Licensed investment professionals'}</div>
                  </div>
                  <div className="vfp-personnel-stat">
                    <div className="vfp-client-card-label">Clients per Inv. Pro</div>
                    <div className="vfp-client-card-val">
                      {totalClients > 0 && firm.employee_investment && firm.employee_investment > 0
                        ? Math.round(totalClients / firm.employee_investment)
                        : '—'}
                    </div>
                    <div className="vfp-client-card-sub">{statPct.clientsPerAdvisor ? `${statPct.clientsPerAdvisor} of firms` : 'Total clients ÷ investment staff'}</div>
                  </div>
                </div>

                <div className="vfp-personnel-soon">
                  <div className="vfp-personnel-soon-icon">
                    <svg width="12" height="12" fill="none" stroke="var(--ink-3)" strokeWidth="1.4" viewBox="0 0 12 12">
                      <circle cx="6" cy="6" r="5" /><path d="M6 4v2.5L7.5 8" />
                    </svg>
                  </div>
                  <div>
                    <div className="vfp-personnel-soon-title">Ownership &amp; principal data coming soon</div>
                    <div className="vfp-personnel-soon-sub">
                      Individual principal names, roles, and ownership percentages from ADV Schedule A will be available in an upcoming release.
                    </div>
                  </div>
                </div>

                <div className="vfp-personnel-footer">Source: SEC Form ADV Part 1 · Schedule A</div>
              </div>
            </div>

          </main>

          {/* ══ SIDEBAR ══ */}
          <aside className="vfp-sidebar">

            {/* CTA — Deep Dive Analysis */}
            <div className="vfp-cta-card">
              <div className="vfp-cta-body">
                <div className="vfp-cta-eyebrow">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <polygon points="5,1 9,3 9,7 5,9 1,7 1,3" stroke="#2DBD74" strokeWidth="1" fill="none" />
                  </svg>
                  Deep Dive Analysis
                </div>
                <div className="vfp-cta-h">
                  Go beyond the public filings
                </div>
                <div className="vfp-cta-sub">
                  Our analysts conduct custom due diligence — investment process reviews, background checks, fee benchmarking, and more.
                </div>
                <Link href="/deep-dive" className="vfp-cta-btn">
                  Request a Consultation
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 12 12">
                    <path d="M2 6h8M7 3l3 3-3 3" />
                  </svg>
                </Link>
                <div className="vfp-cta-trust">Available to all paid subscribers · Tailored to your needs</div>
              </div>
            </div>

            {/* Contact */}
            <div className="vfp-scard vfp-sidebar-contact">
              <div className="vfp-scard-head">
                <span className="vfp-scard-title">Contact</span>
                <span className="vfp-scard-meta">Main office</span>
              </div>
              {/* Quick actions — visible on mobile only */}
              <div className="vfp-contact-actions">
                <div className="vfp-contact-actions-row">
                  {firm.main_phone_number && (
                    <a href={`tel:${firm.main_phone_number}`} className="vfp-contact-action">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                      Call
                    </a>
                  )}
                  {website?.website && (
                    <a href={website.website.startsWith('http') ? website.website : `https://${website.website}`} target="_blank" rel="noopener noreferrer" className="vfp-contact-action">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                      Website
                    </a>
                  )}
                  {(firm.main_office_street_1 || firm.main_office_city) && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent([firm.main_office_street_1, firm.main_office_city, firm.main_office_state, firm.main_office_zip].filter(Boolean).join(', '))}`} target="_blank" rel="noopener noreferrer" className="vfp-contact-action">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      Directions
                    </a>
                  )}
                </div>
              </div>
              {/* Full contact fields — hidden on mobile */}
              <div className="vfp-scard-body vfp-contact-fields-desktop">
                {(firm.main_office_street_1 || firm.main_office_city) && (
                  <div className="vfp-sfield">
                    <span className="vfp-sfield-label">Address</span>
                    <span className="vfp-sfield-val">
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent([firm.main_office_street_1, firm.main_office_city, firm.main_office_state, firm.main_office_zip].filter(Boolean).join(', '))}`}
                        target="_blank" rel="noopener noreferrer"
                      >
                        {firm.main_office_street_1 && <>{firm.main_office_street_1}, </>}
                        {firm.main_office_city}, {firm.main_office_state} {firm.main_office_zip}
                      </a>
                    </span>
                  </div>
                )}
                {firm.main_phone_number && (
                  <div className="vfp-sfield">
                    <span className="vfp-sfield-label">Phone</span>
                    <span className="vfp-sfield-val">
                      <a href={`tel:${firm.main_phone_number}`}>{firm.main_phone_number}</a>
                    </span>
                  </div>
                )}
                {website?.website && (
                  <div className="vfp-sfield">
                    <span className="vfp-sfield-label">Website</span>
                    <span className="vfp-sfield-val">
                      <a
                        href={website.website.startsWith('http') ? website.website : `https://${website.website}`}
                        target="_blank" rel="noopener noreferrer"
                      >
                        {website.website.replace(/^https?:\/\//, '')} ↗
                      </a>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Similar firms */}
            <div className="vfp-scard">
              <div className="vfp-scard-head">
                <span className="vfp-scard-title">Similar Firms</span>
                <span className="vfp-scard-meta">Visor Index</span>
              </div>
              {similarFirms.length > 0 ? (
                <table className="vfp-similar-table">
                  <tbody>
                    {similarFirms.map((sf) => {
                      const titleName = sf.name.replace(/\b\w+/g, w => {
                        const lower = w.toLowerCase();
                        return ['and','of','the','for','in','on','at','to','by','llc','llp'].includes(lower)
                          ? lower : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
                      });
                      const titleCity = sf.city?.replace(/\b\w+/g, w => w.charAt(0) + w.slice(1).toLowerCase());
                      return (
                        <tr key={sf.crd} className="vfp-similar-row">
                          <td className="vfp-similar-cell-info">
                            <Link href={`/firm/${sf.crd}`} style={{ textDecoration: 'none', display: 'block' }}>
                              <div className="vfp-similar-name">{titleName}</div>
                              <div className="vfp-similar-loc">{titleCity}, {sf.state} · {formatAUM(sf.aum)}</div>
                              {sf.reason && <div className="vfp-similar-why">{sf.reason}</div>}
                            </Link>
                          </td>
                          <td className="vfp-similar-cell-score">
                            <Link href={`/firm/${sf.crd}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
                              {sf.score != null ? (() => {
                                const s = Math.round(sf.score!);
                                const col = s >= 70 ? '#2DBD74' : s >= 50 ? '#F59E0B' : '#EF4444';
                                const circ = 2 * Math.PI * 15;
                                const offset = circ * (1 - s / 100);
                                return (
                                  <span className="vfp-mini-ring">
                                    <svg width="38" height="38" viewBox="0 0 38 38">
                                      <circle cx="19" cy="19" r="15" fill="none" stroke="rgba(0,0,0,.06)" strokeWidth="3" />
                                      <circle cx="19" cy="19" r="15" fill="none" stroke={col} strokeWidth="3"
                                        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
                                    </svg>
                                    <span className="vfp-mini-ring-label" style={{ color: col }}>{s}</span>
                                  </span>
                                );
                              })() : <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--serif)', fontSize: 13 }}>—</span>}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="vfp-scard-body">
                  {[
                    { label: 'Explore by state', meta: `${firm.main_office_state} · Similar AUM`, href: `/search?state=${firm.main_office_state}` },
                    { label: 'Explore by size', meta: `AUM range · ${feeTypeDisplay}`, href: `/search` },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '12px 0', borderTop: i > 0 ? '0.5px solid var(--rule)' : 'none' }}>
                      <Link href={item.href} style={{ textDecoration: 'none' }}>
                        <div className="vfp-similar-name">{item.label}</div>
                        <div className="vfp-similar-loc">{item.meta}</div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filing details */}
            <div className="vfp-scard">
              <div className="vfp-scard-head">
                <span className="vfp-scard-title">Filing Details</span>
                <span className="vfp-scard-meta">SEC EDGAR</span>
              </div>
              <div className="vfp-scard-body">
                <div className="vfp-sfield vfp-sfield-inline">
                  <span className="vfp-sfield-label">CRD Number</span>
                  <span className="vfp-sfield-val">{firm.crd}</span>
                </div>
                {firm.latest_adv_filing && (
                  <div className="vfp-sfield vfp-sfield-inline">
                    <span className="vfp-sfield-label">Last amended</span>
                    <span className="vfp-sfield-val">{firm.latest_adv_filing}</span>
                  </div>
                )}
                {firm.legal_structure && (
                  <div className="vfp-sfield vfp-sfield-inline">
                    <span className="vfp-sfield-label">Legal structure</span>
                    <span className="vfp-sfield-val">{firm.legal_structure}</span>
                  </div>
                )}
                <div className="vfp-sfield vfp-sfield-inline">
                  <span className="vfp-sfield-label">Private fund advisor</span>
                  <span className="vfp-sfield-val">{firm.private_fund_advisor === 'Y' ? 'Yes' : 'No'}</span>
                </div>
                <a
                  href={`https://advfm.sec.gov/IAPD/Content/Common/crd_iapd_Brochure.aspx?BRCHR_VRSN_ID=${firm.crd}`}
                  target="_blank" rel="noopener noreferrer"
                  className="vfp-filing-link"
                >
                  View on SEC EDGAR ↗
                </a>
                <div className="vfp-accuracy">
                  Something look off? <Link href="/contact?subject=Data+correction" className="vfp-accuracy-link">Let us know</Link> and we&apos;ll review it promptly.
                </div>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </>
  );
}
