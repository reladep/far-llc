import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import SaveFirmButton from '@/components/firms/SaveFirmButton';
import FeeCalculator from '@/components/firms/FeeCalculator';
import FirmAlerts from '@/components/firms/FirmAlerts';
import RegulatoryDisclosures from '@/components/firms/RegulatoryDisclosures';
import FirmLogo from '@/components/firms/FirmLogo';
import ScoreRing from '@/components/firms/ScoreRing';
import AnimatedBarChart, { type BarData } from '@/components/firms/AnimatedBarChart';
import SectionNav from '@/components/firms/SectionNav';
import { getFirmScore } from '@/lib/scores';

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

export async function generateMetadata({
  params,
}: {
  params: { crd: string };
}): Promise<Metadata> {
  const { firmData, displayName } = await getFirmData(params.crd);
  const name = displayName || firmData?.primary_business_name || 'Firm';
  return {
    title: `${name} — Visor Index`,
    description: `View detailed profile, fees, services, and Visor Score™ for ${name}. SEC-registered investment advisor.`,
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
  return `$${value.toLocaleString()}`;
}

function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

// ─── Presentational helpers ───────────────────────────────────────────────────
function scoreColor(score: number): string {
  return score >= 70 ? '#2DBD74' : score >= 50 ? '#F59E0B' : '#EF4444';
}

const FEE_TYPE_LABELS: Record<string, string> = {
  range: 'AUM-based',
  flat_percentage: 'Flat fee',
  maximum_only: 'AUM-based (max)',
  minimum_only: 'AUM-based (min)',
  capped: 'Capped',
  not_disclosed: 'Negotiated',
};

const SECTION_NAV = [
  { id: 'vvs', label: 'Visor Score™' },
  { id: 'fees', label: 'Fee Schedule' },
  { id: 'aum', label: 'AUM & Growth' },
  { id: 'clients', label: 'Clients' },
  { id: 'regulatory', label: 'Regulatory' },
  { id: 'news', label: 'News' },
];

const PAGE_CSS = `
  .vfp-breadcrumb, .vfp-page {
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568;
    --rule:#CAD8D0; --rule-2:#B0C4BA;
    --red:#EF4444; --amber:#F59E0B;
    --serif:'Cormorant Garamond',serif;
    --sans:'DM Sans',sans-serif;
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
    font-size:11px; color:rgba(255,255,255,.3);
    font-family:var(--sans);
  }
  .vfp-bc-trail a { color:rgba(255,255,255,.3); text-decoration:none; transition:color .15s; }
  .vfp-bc-trail a:hover { color:rgba(255,255,255,.7); }
  .vfp-bc-sep { opacity:.3; }
  .vfp-bc-current { color:rgba(255,255,255,.6); }
  .vfp-bc-actions { display:flex; align-items:center; gap:8px; }
  .vfp-bc-compare {
    display:inline-flex; align-items:center; gap:7px;
    font-family:var(--sans); font-size:11px; font-weight:600;
    background:var(--green); color:#fff;
    padding:7px 16px; border:none; cursor:pointer;
    transition:background .2s; letter-spacing:.04em; text-decoration:none;
  }
  .vfp-bc-compare:hover { background:var(--green-2); }

  .vfp-page {
    padding-top:96px; max-width:1200px; margin:0 auto;
    padding-left:56px; padding-right:56px; padding-bottom:120px;
  }
  .vfp-hero {
    background:var(--navy);
    margin:0 -56px; padding:48px 56px 0;
    border-bottom:1px solid rgba(255,255,255,.06);
    position:relative; overflow:hidden;
  }
  .vfp-hero::before {
    content:''; position:absolute; top:-40px; right:120px;
    width:500px; height:400px;
    background:radial-gradient(ellipse,rgba(26,122,74,.1) 0%,transparent 70%);
    pointer-events:none;
  }
  .vfp-hero-top {
    display:grid; grid-template-columns:auto 1fr auto;
    gap:32px; align-items:center;
    padding-bottom:32px;
    border-bottom:1px solid rgba(255,255,255,.06);
  }
  .vfp-logo-mark {
    width:72px; height:72px;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.1);
    display:grid; place-items:center; flex-shrink:0;
  }
  .vfp-logo-initials {
    font-family:var(--serif); font-size:26px; font-weight:700;
    color:rgba(255,255,255,.3); letter-spacing:.04em;
  }
  .vfp-firm-name {
    font-family:var(--serif); font-size:clamp(26px,3.2vw,40px);
    font-weight:700; color:#fff; line-height:1.1;
    letter-spacing:-.02em; margin-bottom:10px;
  }
  .vfp-badges { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
  .vfp-badge {
    font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase;
    padding:3px 10px; border:1px solid rgba(255,255,255,.12);
    color:rgba(255,255,255,.45);
  }
  .vfp-badge.green { border-color:rgba(45,189,116,.35); color:var(--green-3); background:rgba(45,189,116,.07); }
  .vfp-meta-row { display:flex; align-items:center; gap:20px; flex-wrap:wrap; }
  .vfp-meta-item { display:flex; align-items:center; gap:6px; font-size:12px; color:rgba(255,255,255,.35); }
  .vfp-meta-item a { color:rgba(255,255,255,.35); text-decoration:none; transition:color .15s; }
  .vfp-meta-item a:hover { color:rgba(255,255,255,.8); }
  .vfp-score-block {
    display:flex; flex-direction:column; align-items:center; gap:0;
    padding-left:32px; border-left:1px solid rgba(255,255,255,.07);
  }
  .vfp-score-label {
    font-size:9px; font-weight:600; letter-spacing:.16em; text-transform:uppercase;
    color:rgba(255,255,255,.3); margin-top:8px; text-align:center;
  }
  .vfp-stats-row {
    display:grid; grid-template-columns:repeat(5,1fr);
    border-top:1px solid rgba(255,255,255,.06);
  }
  .vfp-stat {
    padding:20px 24px; border-right:1px solid rgba(255,255,255,.06);
  }
  .vfp-stat:last-child { border-right:none; }
  .vfp-stat-label {
    font-size:9px; font-weight:600; letter-spacing:.18em; text-transform:uppercase;
    color:rgba(255,255,255,.25); margin-bottom:6px;
  }
  .vfp-stat-val {
    font-family:var(--serif); font-size:26px; font-weight:700;
    color:#fff; line-height:1; letter-spacing:-.02em;
  }
  .vfp-stat-val em { font-style:normal; color:var(--green-3); font-size:.75em; }
  .vfp-stat-sub { font-size:10px; color:rgba(255,255,255,.25); margin-top:4px; font-family:var(--mono); }

  .vfp-body {
    display:grid; grid-template-columns:1fr 300px;
    gap:48px; padding-top:48px;
  }
  .vfp-section { margin-bottom:48px; }
  .vfp-section-head {
    display:flex; align-items:baseline; justify-content:space-between;
    margin-bottom:24px; padding-bottom:14px;
    border-bottom:1px solid var(--rule);
  }
  .vfp-section-title {
    font-family:var(--serif); font-size:22px; font-weight:700;
    color:var(--ink); letter-spacing:-.01em;
  }
  .vfp-section-meta { font-size:11px; color:var(--ink-3); font-family:var(--mono); }

  /* VVS Score section */
  .vfp-vvs-overall {
    display:grid; grid-template-columns:auto 1fr;
    gap:32px; align-items:center;
    padding:28px 32px; background:#fff; border:1px solid var(--rule);
    margin-bottom:20px;
  }
  .vfp-vvs-big { font-family:var(--serif); font-size:72px; font-weight:700; line-height:1; letter-spacing:-.04em; }
  .vfp-vvs-big-label { font-size:11px; color:var(--ink-3); margin-top:6px; letter-spacing:.06em; }
  .vfp-vvs-rank {
    font-size:13px; color:var(--ink-3); line-height:1.7;
    border-left:2px solid var(--green); padding-left:20px;
  }
  .vfp-vvs-rank strong { color:var(--ink); font-weight:600; }
  .vfp-vvs-bars { display:flex; flex-direction:column; gap:0; }
  .vfp-bar-row {
    display:grid; grid-template-columns:160px 1fr 48px;
    align-items:center; gap:16px;
    padding:14px 0; border-bottom:1px solid var(--rule);
  }
  .vfp-bar-row:last-child { border-bottom:none; }
  .vfp-bar-label { font-size:12px; color:var(--ink-2); font-weight:500; display:flex; align-items:center; }
  .vfp-bar-track { height:4px; background:var(--rule); position:relative; }
  .vfp-bar-fill { height:100%; transition:width 1s ease; }
  .vfp-bar-val { font-family:var(--mono); font-size:13px; font-weight:500; text-align:right; }
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
  .vfp-fee-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
  .vfp-fee-card { background:#fff; border:1px solid var(--rule); padding:22px 26px; }
  .vfp-fee-card-label { font-size:9px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--ink-3); margin-bottom:10px; }
  .vfp-fee-card-val { font-family:var(--serif); font-size:28px; font-weight:700; color:var(--ink); line-height:1; margin-bottom:4px; letter-spacing:-.02em; }
  .vfp-fee-card-sub { font-size:12px; color:var(--ink-3); line-height:1.6; }
  .vfp-fee-table { background:#fff; border:1px solid var(--rule); margin-bottom:20px; }
  .vfp-fee-table-head {
    display:grid; grid-template-columns:1fr 1fr 1fr;
    padding:10px 20px; border-bottom:1px solid var(--rule); background:var(--white);
  }
  .vfp-fee-table-head span { font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); }
  .vfp-fee-row {
    display:grid; grid-template-columns:1fr 1fr 1fr;
    padding:14px 20px; border-bottom:1px solid var(--rule); align-items:center;
  }
  .vfp-fee-row:last-child { border-bottom:none; }
  .vfp-fee-row span { font-size:13px; color:var(--ink-2); }
  .vfp-fee-rate { font-family:var(--mono); font-size:13px; color:var(--ink); font-weight:500; }
  .vfp-fee-note { font-size:11px; color:var(--ink-3); }

  /* AUM chart wrap */
  .vfp-aum-wrap { background:#fff; border:1px solid var(--rule); overflow:hidden; }
  .vfp-aum-head { display:grid; grid-template-columns:repeat(3,1fr); border-bottom:1px solid var(--rule); }
  .vfp-aum-stat { padding:18px 24px; border-right:1px solid var(--rule); }
  .vfp-aum-stat:last-child { border-right:none; }
  .vfp-aum-stat-label { font-size:9px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--ink-3); margin-bottom:6px; }
  .vfp-aum-stat-val { font-family:var(--serif); font-size:24px; font-weight:700; color:var(--ink); line-height:1; }
  .vfp-aum-stat-delta { display:inline-flex; align-items:center; gap:4px; font-size:11px; margin-top:4px; font-family:var(--mono); }
  .vfp-aum-stat-delta.up { color:var(--green); }
  .vfp-aum-stat-delta.dn { color:var(--red); }
  .vfp-chart-divider { border-top:1px solid var(--rule); }
  .vfp-aum-footer {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 24px; border-top:1px solid var(--rule);
    font-size:10px; color:var(--ink-3);
  }

  /* Clients */
  .vfp-client-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .vfp-client-card { background:#fff; border:1px solid var(--rule); padding:24px 28px; }
  .vfp-client-card-label { font-size:9px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--ink-3); margin-bottom:10px; }
  .vfp-client-card-val { font-family:var(--serif); font-size:32px; font-weight:700; color:var(--ink); line-height:1; margin-bottom:6px; letter-spacing:-.02em; }
  .vfp-client-card-sub { font-size:12px; color:var(--ink-3); line-height:1.6; }
  .vfp-client-breakdown { background:#fff; border:1px solid var(--rule); margin-top:16px; }
  .vfp-client-bd-head { padding:16px 24px; border-bottom:1px solid var(--rule); font-size:11px; font-weight:600; color:var(--ink-3); letter-spacing:.06em; text-transform:uppercase; }
  .vfp-client-type-row {
    display:grid; grid-template-columns:1fr auto 120px;
    align-items:center; gap:16px;
    padding:12px 24px; border-bottom:1px solid var(--rule);
  }
  .vfp-client-type-row:last-child { border-bottom:none; }
  .vfp-client-type-name { font-size:13px; color:var(--ink-2); }
  .vfp-client-type-pct { font-family:var(--mono); font-size:12px; color:var(--ink-3); }
  .vfp-client-type-bar { height:3px; background:var(--rule); }
  .vfp-client-type-fill { height:100%; background:var(--green-2); border-radius:1px; }

  /* Sidebar */
  .vfp-sidebar { position:sticky; top:160px; display:flex; flex-direction:column; gap:16px; align-self:start; }
  .vfp-scard { background:#fff; border:1px solid var(--rule); overflow:hidden; }
  .vfp-scard-head {
    padding:14px 20px; border-bottom:1px solid var(--rule);
    font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-3);
  }
  .vfp-scard-body { padding:20px; }
  .vfp-sfield {
    display:flex; justify-content:space-between; align-items:baseline;
    padding:8px 0; border-bottom:1px solid var(--rule);
  }
  .vfp-sfield:last-child { border-bottom:none; }
  .vfp-sfield-label { font-size:11px; color:var(--ink-3); }
  .vfp-sfield-val { font-family:var(--mono); font-size:11px; color:var(--ink-2); font-weight:500; text-align:right; }
  .vfp-sfield-val a { color:var(--green); text-decoration:none; transition:color .15s; }
  .vfp-sfield-val a:hover { color:var(--green-2); }

  .vfp-similar { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--rule); text-decoration:none; transition:opacity .15s; }
  .vfp-similar:last-child { border-bottom:none; }
  .vfp-similar:hover { opacity:.7; }
  .vfp-similar-initials {
    width:32px; height:32px; flex-shrink:0;
    background:var(--white); border:1px solid var(--rule);
    display:grid; place-items:center;
    font-family:var(--serif); font-size:12px; font-weight:700; color:var(--ink-3);
  }
  .vfp-similar-info { flex:1; min-width:0; }
  .vfp-similar-name { font-size:12px; font-weight:600; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .vfp-similar-meta { font-size:10px; color:var(--ink-3); margin-top:1px; }
  .vfp-similar-score { font-family:var(--serif); font-size:18px; font-weight:700; flex-shrink:0; color:var(--ink-3); }

  .vfp-cta-card { background:var(--navy); border:none; border-top:2px solid var(--green-3); overflow:hidden; }
  .vfp-cta-body { padding:24px; }
  .vfp-cta-eyebrow {
    font-size:9px; font-weight:700; letter-spacing:.18em; text-transform:uppercase;
    color:var(--green-3); margin-bottom:12px; display:flex; align-items:center; gap:6px;
  }
  .vfp-cta-h { font-family:var(--serif); font-size:20px; font-weight:700; color:#fff; line-height:1.25; margin-bottom:10px; }
  .vfp-cta-sub { font-size:12px; color:rgba(255,255,255,.38); line-height:1.6; margin-bottom:20px; }
  .vfp-cta-btn {
    display:flex; align-items:center; justify-content:center; gap:8px;
    width:100%; background:var(--green); color:#fff;
    font-family:var(--sans); font-size:13px; font-weight:600;
    padding:12px; text-decoration:none; border:none; cursor:pointer;
    transition:background .2s;
  }
  .vfp-cta-btn:hover { background:var(--green-2); }
  .vfp-cta-trust { font-size:10px; color:rgba(255,255,255,.2); text-align:center; margin-top:10px; line-height:1.5; }

  @media (max-width:900px) {
    .vfp-breadcrumb { padding:0 20px; }
    .vfp-page { padding-left:20px; padding-right:20px; }
    .vfp-hero { margin:0 -20px; padding:32px 20px 0; }
    .vfp-hero-top { grid-template-columns:auto 1fr; }
    .vfp-score-block { display:none; }
    .vfp-stats-row { grid-template-columns:repeat(3,1fr); }
    .vfp-body { grid-template-columns:1fr; gap:32px; }
    .vfp-sidebar { position:static; }
    .vfp-fee-grid { grid-template-columns:1fr; }
    .vfp-client-grid { grid-template-columns:1fr; }
  }
`;

// ─── Page Component ───────────────────────────────────────────────────────────
export default async function FirmPage({ params }: { params: { crd: string } }) {
  const {
    firmData, displayName, logoKey, feeTiers, feesAndMins,
    profileText, website, growth, clientBreakdown, firmScore, error,
  } = await getFirmData(params.crd);

  const firmDisplayName = displayName || firmData?.primary_business_name || 'Unknown Firm';

  // ── Not found ──
  if (error || !firmData) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 56px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
            Firm Not Found
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 24 }}>
            We couldn&apos;t find a firm with CRD #{params.crd}
          </p>
          <Link href="/search" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', background: 'var(--green)', color: '#fff',
            textDecoration: 'none', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
          }}>
            ← Back to Search
          </Link>
        </div>
      </>
    );
  }

  const firm = firmData;

  // ── Auth ──
  const authSupabase = createSupabaseServerClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  let isSaved = false;
  if (user) {
    const { data: fav } = await authSupabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('crd', params.crd)
      .maybeSingle();
    isSaved = !!fav;
  }

  // ── Not authenticated ──
  if (!user) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 56px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 40, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
            {firmDisplayName}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 40 }}>
            {firm.main_office_city}, {firm.main_office_state}
          </p>
          <div style={{
            maxWidth: 420, margin: '0 auto', padding: '32px',
            background: '#fff', border: '1px solid var(--rule)',
          }}>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 9, fontWeight: 600,
              letterSpacing: '.18em', textTransform: 'uppercase',
              color: 'var(--green-3)', marginBottom: 16,
            }}>
              Free access required
            </p>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 8, fontFamily: 'var(--serif)' }}>
              Create a free account to view this firm&apos;s full profile
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 24, lineHeight: 1.6 }}>
              Access fee schedules, Visor Score™, growth history, and regulatory disclosures — all from SEC filings.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/auth/signup" style={{
                flex: 1, display: 'block', textAlign: 'center',
                padding: '10px', background: 'var(--green)', color: '#fff',
                textDecoration: 'none', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
              }}>
                Get Started Free
              </Link>
              <Link href="/auth/login" style={{
                flex: 1, display: 'block', textAlign: 'center',
                padding: '10px', background: 'none',
                border: '1px solid var(--rule)', color: 'var(--ink-2)',
                textDecoration: 'none', fontFamily: 'var(--sans)', fontSize: 13,
              }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Computed stats (preserve data logic) ──
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
  let aumStats = { currentAum: 0, fiveYearDeltaAbs: 0, fiveYearDeltaPct: 0, avgAnnualPct: 0 };
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
      const n = years.length - 1;
      const avgAnnualPct = n > 0 && years[0].aum > 0
        ? (Math.pow(latest.aum / years[0].aum, 1 / n) - 1) * 100 : 0;

      aumStats = {
        currentAum: latest.aum,
        fiveYearDeltaAbs,
        fiveYearDeltaPct,
        avgAnnualPct,
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
  }

  // ── Hero badges ──
  const heroBadges: Array<{ label: string; green: boolean }> = [
    { label: 'Fiduciary', green: true },
  ];
  if (feesAndMins?.fee_structure_type) heroBadges.push({ label: feeTypeDisplay, green: false });
  if (firm.legal_structure) heroBadges.push({ label: firm.legal_structure, green: false });
  if (profileText?.firm_character) {
    heroBadges.push({ label: profileText.firm_character.split(',')[0].trim(), green: false });
  }

  // ── Score ──
  const finalScore: number = (firmScore as unknown as Record<string, number>)?.final_score ?? 0;

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
    { label: 'Derivatives Risk', score: fs.derivatives_score ?? 0, tip: 'Flags use of complex instruments like options, swaps, or leverage in client portfolios.' },
  ] : [];

  // ── Fee tier table ──
  const sortedFeeTiers = feeTiers
    ? [...feeTiers].sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'))
    : [];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      {/* Fixed breadcrumb bar */}
      <div className="vfp-breadcrumb">
        <div className="vfp-breadcrumb-i">
          <div className="vfp-bc-trail">
            <Link href="/search">Search</Link>
            <span className="vfp-bc-sep">›</span>
            {firm.main_office_city && firm.main_office_state && (
              <>
                <Link href={`/search?state=${firm.main_office_state}`}>
                  {firm.main_office_city} · {firm.main_office_state}
                </Link>
                <span className="vfp-bc-sep">›</span>
              </>
            )}
            <span className="vfp-bc-current">{firmDisplayName}</span>
          </div>
          <div className="vfp-bc-actions">
            <SaveFirmButton crd={firm.crd} initialSaved={isSaved} />
            <Link href={`/compare?add=${firm.crd}`} className="vfp-bc-compare">
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 11 11">
                <rect x="1" y="4" width="3" height="6" /><rect x="4.5" y="2" width="3" height="8" /><rect x="8" y="5" width="3" height="5" />
              </svg>
              Add to Compare
            </Link>
          </div>
        </div>
      </div>

      {/* Page shell */}
      <div className="vfp-page">

        {/* ── HERO BAND ── */}
        <div className="vfp-hero">
          <div className="vfp-hero-top">

            {/* Logo mark */}
            {logoKey ? (
              <div className="vfp-logo-mark" style={{ padding: 8 }}>
                <FirmLogo logoKey={logoKey} firmName={firmDisplayName} size="lg" />
              </div>
            ) : (
              <div className="vfp-logo-mark">
                <span className="vfp-logo-initials">
                  {firmDisplayName.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            {/* Identity */}
            <div>
              <h1 className="vfp-firm-name">{firmDisplayName}</h1>
              <div className="vfp-badges">
                {heroBadges.map((b, i) => (
                  <span key={i} className={`vfp-badge${b.green ? ' green' : ''}`}>{b.label}</span>
                ))}
              </div>
              <div className="vfp-meta-row">
                {firm.main_office_city && (
                  <span className="vfp-meta-item">
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 11 11">
                      <circle cx="5.5" cy="4.5" r="2" /><path d="M1 10c0-2.5 2-4.5 4.5-4.5S10 7.5 10 10" />
                    </svg>
                    {firm.main_office_city}, {firm.main_office_state}
                  </span>
                )}
                {website?.website && (
                  <span className="vfp-meta-item">
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 11 11">
                      <circle cx="5.5" cy="5.5" r="4.5" /><path d="M1 5.5h9M5.5 1c-1.4 1.5-2.2 3-2.2 4.5s.8 3 2.2 4.5M5.5 1c1.4 1.5 2.2 3 2.2 4.5S6.9 8.5 5.5 10" />
                    </svg>
                    <a href={website.website.startsWith('http') ? website.website : `https://${website.website}`}
                      target="_blank" rel="noopener noreferrer">
                      {website.website.replace(/^https?:\/\//, '')}
                    </a>
                  </span>
                )}
                <span className="vfp-meta-item">
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 11 11">
                    <path d="M5.5 1v1M5.5 9v1M1 5.5h1M9 5.5h1" /><circle cx="5.5" cy="5.5" r="2.5" />
                  </svg>
                  CRD #{firm.crd}
                </span>
              </div>
            </div>

            {/* Score ring */}
            {finalScore > 0 ? (
              <div className="vfp-score-block">
                <ScoreRing score={finalScore} />
                <div className="vfp-score-label">Visor Score™</div>
              </div>
            ) : (
              <div className="vfp-score-block">
                <div style={{
                  width: 120, height: 120,
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>N/A</span>
                </div>
                <div className="vfp-score-label">Visor Score™</div>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="vfp-stats-row">
            <div className="vfp-stat">
              <div className="vfp-stat-label">Assets Under Management</div>
              <div className="vfp-stat-val">{formatAUM(firm.aum)}</div>
              {aumStats.avgAnnualPct > 0 && (
                <div className="vfp-stat-sub">↑ {aumStats.avgAnnualPct.toFixed(1)}% avg annual</div>
              )}
            </div>
            <div className="vfp-stat">
              <div className="vfp-stat-label">Avg. Client Size</div>
              <div className="vfp-stat-val">
                {avgClientSize ? formatAUM(avgClientSize) : '—'}
              </div>
              {totalClients > 0 && (
                <div className="vfp-stat-sub">{totalClients.toLocaleString()} total clients</div>
              )}
            </div>
            <div className="vfp-stat">
              <div className="vfp-stat-label">AUM per Inv. Pro</div>
              <div className="vfp-stat-val">
                {aumPerInvPro ? formatAUM(aumPerInvPro) : '—'}
              </div>
              {firm.employee_investment && (
                <div className="vfp-stat-sub">{firm.employee_investment} advisory staff</div>
              )}
            </div>
            <div className="vfp-stat">
              <div className="vfp-stat-label">Minimum Account Size</div>
              <div className="vfp-stat-val">
                {minAccount ? formatAUM(minAccount) : '—'}
              </div>
              {minFee && (
                <div className="vfp-stat-sub">Min fee {formatCurrency(minFee)}</div>
              )}
            </div>
            <div className="vfp-stat">
              <div className="vfp-stat-label">Employees</div>
              <div className="vfp-stat-val">{firm.employee_total ?? '—'}</div>
              {firm.employee_investment && (
                <div className="vfp-stat-sub">{firm.employee_investment} investment staff</div>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION NAV ── */}
        <SectionNav sections={SECTION_NAV} />

        {/* ── BODY ── */}
        <div className="vfp-body">

          {/* ══ MAIN COLUMN ══ */}
          <main>

            {/* ── VISOR VALUE SCORE ── */}
            <div className="vfp-section" id="vvs">
              <div className="vfp-section-head">
                <span className="vfp-section-title">Visor Value Score™</span>
                <span className="vfp-section-meta">Based on Form ADV filing · SEC data</span>
              </div>

              {finalScore > 0 && fs ? (
                <>
                  <div className="vfp-vvs-overall">
                    <div>
                      <div className="vfp-vvs-big" style={{ color: scoreColor(finalScore) }}>
                        {Math.round(finalScore)}
                      </div>
                      <div className="vfp-vvs-big-label">out of 100</div>
                    </div>
                    <div className="vfp-vvs-rank">
                      Score is derived from <strong>8 weighted metrics</strong> across fee transparency,
                      conflict-of-interest disclosures, AUM growth, and client service capacity —
                      all sourced from SEC Form ADV filings.
                    </div>
                  </div>

                  <div className="vfp-vvs-bars">
                    {vvsBars.map((b) => (
                      <div key={b.label} className="vfp-bar-row">
                        <div className="vfp-bar-label">
                          {b.label}
                          <span className="vfp-info-tip" title={b.tip}>ⓘ</span>
                        </div>
                        <div className="vfp-bar-track">
                          <div
                            className="vfp-bar-fill"
                            style={{ width: `${b.score}%`, background: scoreColor(b.score) }}
                          />
                        </div>
                        <div className="vfp-bar-val" style={{ color: scoreColor(b.score) }}>
                          {Math.round(b.score)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
                <span className="vfp-section-title">Fee Schedule</span>
                <span className="vfp-section-meta">Disclosed in ADV Part 2A · Item 5</span>
              </div>

              {/* Info cards */}
              <div className="vfp-fee-grid">
                <div className="vfp-fee-card">
                  <div className="vfp-fee-card-label">Fee Structure</div>
                  <div className="vfp-fee-card-val">{feeTypeDisplay}</div>
                  <div className="vfp-fee-card-sub">
                    {feesAndMins?.notes
                      ? feesAndMins.notes.slice(0, 120) + (feesAndMins.notes.length > 120 ? '…' : '')
                      : 'Annual percentage of assets under management. All fees are negotiable.'}
                  </div>
                </div>
                <div className="vfp-fee-card">
                  <div className="vfp-fee-card-label">Minimum Annual Fee</div>
                  <div className="vfp-fee-card-val">
                    {minFee ? formatCurrency(minFee) : minAccount ? `${formatAUM(minAccount)} min AUM` : '—'}
                  </div>
                  <div className="vfp-fee-card-sub">
                    {minAccount ? `Effective minimum given ${formatAUM(minAccount)} account minimum` : 'Contact firm for minimum requirements'}
                  </div>
                </div>
              </div>

              {/* Fee tier table */}
              {sortedFeeTiers.length > 0 && (
                <div className="vfp-fee-table">
                  <div className="vfp-fee-table-head">
                    <span>AUM tier</span>
                    <span>Annual rate</span>
                    <span>Notes</span>
                  </div>
                  {sortedFeeTiers.map((tier, i) => (
                    <div key={i} className="vfp-fee-row">
                      <span>
                        {formatCurrency(parseInt(tier.min_aum || '0'))} –{' '}
                        {tier.max_aum ? formatCurrency(tier.max_aum) : '∞'}
                      </span>
                      <span className="vfp-fee-rate">
                        {tier.fee_pct != null ? `${tier.fee_pct}%` : 'Negotiated'}
                      </span>
                      <span className="vfp-fee-note" />
                    </div>
                  ))}
                </div>
              )}

              {/* Fee calculator widget */}
              <FeeCalculator
                feeTiers={feeTiers}
                crd={String(firm.crd)}
                firmAum={firm.aum}
                industryOnly={!feeTiers || feeTiers.length === 0}
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
                      <div className="vfp-aum-stat-val">{formatAUM(aumStats.currentAum)}</div>
                      {aumStats.fiveYearDeltaPct !== 0 && (
                        <div className={`vfp-aum-stat-delta ${aumStats.fiveYearDeltaPct >= 0 ? 'up' : 'dn'}`}>
                          {aumStats.fiveYearDeltaPct >= 0 ? '↑' : '↓'} {Math.abs(aumStats.fiveYearDeltaPct).toFixed(1)}% over period
                        </div>
                      )}
                    </div>
                    <div className="vfp-aum-stat">
                      <div className="vfp-aum-stat-label">Total Growth (Period)</div>
                      <div className="vfp-aum-stat-val">
                        {aumStats.fiveYearDeltaAbs >= 0 ? '+' : ''}{formatAUM(Math.abs(aumStats.fiveYearDeltaAbs))}
                      </div>
                      <div className={`vfp-aum-stat-delta ${aumStats.fiveYearDeltaPct >= 0 ? 'up' : 'dn'}`}>
                        {aumStats.fiveYearDeltaPct >= 0 ? '↑' : '↓'} {Math.abs(aumStats.fiveYearDeltaPct).toFixed(0)}% since start
                      </div>
                    </div>
                    <div className="vfp-aum-stat">
                      <div className="vfp-aum-stat-label">Avg. Annual Growth</div>
                      <div className="vfp-aum-stat-val">{aumStats.avgAnnualPct.toFixed(1)}%</div>
                      <div className={`vfp-aum-stat-delta ${aumStats.avgAnnualPct >= 0 ? 'up' : 'dn'}`}>
                        CAGR over filing period
                      </div>
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
                  <span className="vfp-section-meta">As of latest ADV filing</span>
                </div>

                <div className="vfp-client-grid">
                  <div className="vfp-client-card">
                    <div className="vfp-client-card-label">Total Clients</div>
                    <div className="vfp-client-card-val">{totalClients.toLocaleString()}</div>
                    <div className="vfp-client-card-sub">
                      {avgClientSize
                        ? `Avg. ${formatAUM(avgClientSize)} per client`
                        : 'Based on SEC ADV filing'}
                    </div>
                  </div>
                  <div className="vfp-client-card">
                    <div className="vfp-client-card-label">AUM per Client</div>
                    <div className="vfp-client-card-val">
                      {avgClientSize ? formatAUM(avgClientSize) : '—'}
                    </div>
                    <div className="vfp-client-card-sub">
                      Total AUM divided by reported client count
                    </div>
                  </div>
                </div>

                {clientTypeRows.length > 0 && (
                  <div className="vfp-client-breakdown">
                    <div className="vfp-client-bd-head">Client Type Breakdown</div>
                    {clientTypeRows.map((row, i) => (
                      <div key={i} className="vfp-client-type-row">
                        <div className="vfp-client-type-name">{row.name}</div>
                        <div className="vfp-client-type-pct">{row.pct.toFixed(0)}%</div>
                        <div className="vfp-client-type-bar">
                          <div className="vfp-client-type-fill" style={{ width: `${row.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── REGULATORY ── */}
            <div className="vfp-section" id="regulatory">
              <div className="vfp-section-head">
                <span className="vfp-section-title">Regulatory History</span>
                <span className="vfp-section-meta">IAPD · SEC EDGAR · FINRA BrokerCheck</span>
              </div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <RegulatoryDisclosures firmData={firm as any} />
            </div>

            {/* ── NEWS & ALERTS ── */}
            <div className="vfp-section" id="news">
              <div className="vfp-section-head">
                <span className="vfp-section-title">Activity &amp; News</span>
                <span className="vfp-section-meta">SEC filings · Industry news</span>
              </div>
              <FirmAlerts crd={firm.crd} />
            </div>

          </main>

          {/* ══ SIDEBAR ══ */}
          <aside className="vfp-sidebar">

            {/* Contact */}
            <div className="vfp-scard">
              <div className="vfp-scard-head">Contact</div>
              <div className="vfp-scard-body" style={{ padding: '16px 20px' }}>
                {(firm.main_office_street_1 || firm.main_office_city) && (
                  <div className="vfp-sfield">
                    <span className="vfp-sfield-label">Address</span>
                    <span className="vfp-sfield-val" style={{ lineHeight: 1.6 }}>
                      {firm.main_office_street_1 && <>{firm.main_office_street_1}<br /></>}
                      {firm.main_office_city}, {firm.main_office_state} {firm.main_office_zip}
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

            {/* Filing details */}
            <div className="vfp-scard">
              <div className="vfp-scard-head">Filing Details</div>
              <div className="vfp-scard-body" style={{ padding: '16px 20px' }}>
                <div className="vfp-sfield">
                  <span className="vfp-sfield-label">CRD Number</span>
                  <span className="vfp-sfield-val">{firm.crd}</span>
                </div>
                <div className="vfp-sfield">
                  <span className="vfp-sfield-label">Filing type</span>
                  <span className="vfp-sfield-val">Form ADV</span>
                </div>
                {firm.latest_adv_filing && (
                  <div className="vfp-sfield">
                    <span className="vfp-sfield-label">Last amended</span>
                    <span className="vfp-sfield-val">{firm.latest_adv_filing}</span>
                  </div>
                )}
                <div className="vfp-sfield">
                  <span className="vfp-sfield-label">Registration</span>
                  <span className="vfp-sfield-val">SEC (federal)</span>
                </div>
                {firm.legal_structure && (
                  <div className="vfp-sfield">
                    <span className="vfp-sfield-label">Legal structure</span>
                    <span className="vfp-sfield-val">{firm.legal_structure}</span>
                  </div>
                )}
                <div className="vfp-sfield">
                  <span className="vfp-sfield-label">Private fund advisor</span>
                  <span className="vfp-sfield-val">{firm.private_fund_advisor === 'Y' ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Similar firms (placeholder) */}
            <div className="vfp-scard">
              <div className="vfp-scard-head">Similar Firms</div>
              <div className="vfp-scard-body" style={{ padding: '12px 20px' }}>
                {[
                  { label: 'Explore by state', meta: `${firm.main_office_state} · Similar AUM`, href: `/search?state=${firm.main_office_state}` },
                  { label: 'Explore by size', meta: `AUM range · ${feeTypeDisplay}`, href: `/search` },
                ].map((item, i) => (
                  <Link key={i} href={item.href} className="vfp-similar">
                    <div className="vfp-similar-initials">→</div>
                    <div className="vfp-similar-info">
                      <div className="vfp-similar-name">{item.label}</div>
                      <div className="vfp-similar-meta">{item.meta}</div>
                    </div>
                  </Link>
                ))}
                <div style={{ paddingTop: 12, paddingBottom: 4, fontSize: 10, color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--mono)' }}>
                  Curated similar firms coming soon
                </div>
              </div>
            </div>

            {/* CTA — Negotiate */}
            <div className="vfp-scard vfp-cta-card">
              <div className="vfp-cta-body">
                <div className="vfp-cta-eyebrow">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <polygon points="5,1 9,3 9,7 5,9 1,7 1,3" stroke="#2DBD74" strokeWidth="1" fill="none" />
                  </svg>
                  Visor Negotiate
                </div>
                <div className="vfp-cta-h">
                  See how much you could save
                </div>
                <div className="vfp-cta-sub">
                  Fees are negotiable. Our guide shows you exactly what to say — and what to ask for.
                </div>
                <Link href={`/negotiate`} className="vfp-cta-btn">
                  Start Negotiating
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 12 12">
                    <path d="M2 6h8M7 3l3 3-3 3" />
                  </svg>
                </Link>
                <div className="vfp-cta-trust">Free · No account upgrade required</div>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </>
  );
}
