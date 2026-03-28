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
import { getFirmScore, getFirmScores } from '@/lib/scores';

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
interface SimilarFirm {
  crd: number;
  name: string;
  city: string | null;
  state: string;
  aum: number | null;
  score: number | null;
}

// ─── New: Similar Firms query ─────────────────────────────────────────────────
async function getSimilarFirms(crd: number, state: string, aum: number | null): Promise<SimilarFirm[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase.from('firmdata_current')
    .select('crd, primary_business_name, main_office_city, aum')
    .eq('main_office_state', state)
    .neq('crd', crd)
    .not('aum', 'is', null)
    .order('aum', { ascending: false })
    .limit(8);
  if (aum) q = q.gte('aum', aum * 0.2).lte('aum', aum * 5);
  const { data } = await q;
  if (!data?.length) return [];
  const crds = data.map((f: { crd: number }) => f.crd);
  const { data: names } = await supabase.from('firm_names').select('crd, display_name').in('crd', crds);
  const nameMap = new Map(
    names?.map((n: { crd: number; display_name: string | null }) => [n.crd, n.display_name]) ?? []
  );
  const scoreMap = await getFirmScores(crds);
  return data.slice(0, 4).map((f: {
    crd: number; primary_business_name: string | null; main_office_city: string | null; aum: number | null;
  }) => ({
    crd: f.crd,
    name: (nameMap.get(f.crd) as string | null) || f.primary_business_name || 'Unknown',
    city: f.main_office_city,
    state,
    aum: f.aum,
    score: (scoreMap.get(f.crd) as { final_score?: number } | undefined)?.final_score ?? null,
  }));
}

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
  aumPerPro: string | null;
  minAccount: string | null;
  employees: string | null;
  invStaff: string | null;
}

async function getStatPercentiles(firm: FirmData, totalClients: number, avgClientSize: number | null, aumPerInvPro: number | null, minAccount: number | null): Promise<StatPercentiles> {
  const result: StatPercentiles = { aum: null, avgClient: null, aumPerPro: null, minAccount: null, employees: null, invStaff: null };

  // Run all percentile queries in parallel
  const queries: Array<{ key: keyof StatPercentiles; col: string; val: number | null; table?: string }> = [
    { key: 'aum', col: 'aum', val: firm.aum },
    { key: 'employees', col: 'employee_total', val: firm.employee_total },
    { key: 'invStaff', col: 'employee_investment', val: firm.employee_investment },
  ];

  const promises = queries.map(async (q) => {
    if (q.val == null) return;
    const [{ count: below }, { count: total }] = await Promise.all([
      supabase.from('firmdata_current').select('*', { count: 'exact', head: true }).lt(q.col, q.val).not(q.col, 'is', null),
      supabase.from('firmdata_current').select('*', { count: 'exact', head: true }).not(q.col, 'is', null),
    ]);
    if (total && total > 0) {
      const pct = Math.round(((below ?? 0) / total) * 100);
      result[q.key] = pct >= 50 ? `Top ${100 - pct}%` : `Bottom ${pct + 1}%`;
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
  return `$${Math.round(value).toLocaleString()}`;
}

function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${Math.round(value).toLocaleString()}`;
}

// ─── Presentational helpers ───────────────────────────────────────────────────
function scoreColor(score: number): string {
  // Works for both 0-10 sub-scores and 0-100 overall scores
  const s = score <= 10 ? score * 10 : score;
  return s >= 80 ? 'var(--green-3)' : s >= 50 ? 'var(--amber)' : 'var(--red)';
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
  { id: 'about',      label: 'About' },
  { id: 'vvs',        label: 'Visor Score™' },
  { id: 'fees',       label: 'Fee Schedule' },
  { id: 'aum',        label: 'AUM & Growth' },
  { id: 'clients',    label: 'Clients' },
  { id: 'allocation', label: 'Allocation' },
  { id: 'regulatory', label: 'Regulatory' },
  { id: 'news',       label: 'News' },
  { id: 'personnel',  label: 'Key Personnel' },
];

const PAGE_CSS = `
  .vfp-breadcrumb, .vfp-page {
    --navy:#172438; --navy-2:#0F2538;
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
  .vfp-bc-actions { display:flex; align-items:center; gap:10px; padding-left:16px; border-left:1px solid rgba(255,255,255,.08); }
  .vfp-bc-compare {
    display:inline-flex; align-items:center; gap:7px;
    font-family:var(--sans); font-size:11px; font-weight:600;
    background:var(--green-3); color:#fff;
    padding:8px 18px; border:none; cursor:pointer; border-radius:3px;
    transition:background .2s; letter-spacing:.04em; text-decoration:none;
  }
  .vfp-bc-compare:hover { background:var(--green-2); }

  .vfp-page {
    padding-top:40px; max-width:1200px; margin:0 auto;
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
  .vfp-meta-item { display:flex; align-items:center; gap:5px; font-family:var(--mono); font-size:11px; color:rgba(255,255,255,.6); }
  .vfp-meta-item a { color:rgba(255,255,255,.6); text-decoration:none; transition:color .15s; }
  .vfp-meta-item a:hover { color:#fff; }

  .vfp-stat-score { display:flex; flex-direction:column; }
  .vfp-stats-row {
    display:grid; grid-template-columns:repeat(6,1fr);
    border-top:0.5px solid rgba(255,255,255,.1);
  }
  .vfp-stat {
    padding:14px 18px; border-right:0.5px solid rgba(255,255,255,.08);
  }
  .vfp-stat:last-child { border-right:none; }
  .vfp-stat-label {
    font-family:var(--sans); font-size:9px; font-weight:600; letter-spacing:.1em; text-transform:uppercase;
    color:rgba(255,255,255,.7); margin-bottom:5px;
  }
  .vfp-stat-val {
    font-family:var(--serif); font-size:26px; font-weight:700;
    color:#fff; line-height:1; letter-spacing:-.02em;
  }
  .vfp-stat-val em { font-style:normal; color:var(--green-3); font-size:.75em; }
  .vfp-stat-sub { font-size:10px; color:rgba(255,255,255,.55); margin-top:4px; font-family:var(--mono); }
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
  .vfp-section-meta { font-size:10px; color:var(--ink-3); font-family:var(--mono); letter-spacing:.02em; }

  /* VVS Score section */
  .vfp-vvs-overall {
    display:grid; grid-template-columns:auto 1fr;
    gap:20px; align-items:flex-start;
    padding:20px; background:#fff; border:0.5px solid var(--rule); border-radius:10px;
    box-shadow:0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
    margin-bottom:14px;
  }
  .vfp-vvs-big { font-family:var(--serif); font-size:64px; font-weight:700; line-height:1; letter-spacing:-.04em; }
  .vfp-vvs-big-label { font-family:var(--sans); font-size:11px; color:var(--ink-3); margin-top:2px; letter-spacing:.06em; }
  .vfp-vvs-rank {
    font-size:12.5px; color:var(--ink-2); line-height:1.65;
    max-width:420px;
  }
  .vfp-vvs-rank strong { color:var(--ink); font-weight:600; }
  .vfp-vvs-bars { display:flex; flex-direction:column; gap:0; }
  .vfp-bar-row {
    display:grid; grid-template-columns:140px 1fr 36px;
    align-items:center; gap:16px;
    padding:8px 0; border-bottom:0.5px solid rgba(0,0,0,.04);
  }
  .vfp-bar-row:last-child { border-bottom:none; }
  .vfp-bar-label { font-family:var(--sans); font-size:12px; color:var(--ink-2); font-weight:500; display:flex; align-items:center; }
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
  .vfp-fee-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
  .vfp-fee-card { background:#fff; border:0.5px solid var(--rule); border-radius:10px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03); }
  .vfp-fee-card-label { font-family:var(--sans); font-size:10px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--ink-3); margin-bottom:10px; }
  .vfp-fee-card-val { font-family:var(--serif); font-size:28px; font-weight:700; color:var(--ink); line-height:1; margin-bottom:4px; letter-spacing:-.02em; }
  .vfp-fee-card-sub { font-family:var(--mono); font-size:12px; color:var(--ink-3); line-height:1.6; }
  .vfp-fee-table { background:#fff; border:0.5px solid var(--rule); border-radius:10px; margin-bottom:20px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03); }
  .vfp-fee-table-head {
    display:grid; grid-template-columns:1fr 1fr 1fr;
    padding:10px 20px; border-bottom:1px solid var(--rule); background:var(--white);
  }
  .vfp-fee-table-head span { font-family:var(--sans); font-size:10px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); }
  .vfp-fee-row {
    display:grid; grid-template-columns:1fr 1fr 1fr;
    padding:14px 20px; border-bottom:1px solid var(--rule); align-items:center;
  }
  .vfp-fee-row:last-child { border-bottom:none; }
  .vfp-fee-row span { font-family:var(--sans); font-size:13px; color:var(--ink-2); }
  .vfp-fee-rate { font-family:var(--mono); font-size:13px; color:var(--ink); font-weight:500; }
  .vfp-fee-note { font-size:11px; color:var(--ink-3); }

  /* AUM chart wrap */
  .vfp-aum-wrap { background:#fff; border:0.5px solid var(--rule); border-radius:9px; overflow:hidden; }
  .vfp-aum-head { display:grid; grid-template-columns:repeat(3,1fr); border-bottom:1px solid var(--rule); }
  .vfp-aum-stat { padding:11px 13px; border-right:1px solid var(--rule); background:var(--white); border-radius:0; }
  .vfp-aum-stat:last-child { border-right:none; }
  .vfp-aum-stat-label { font-family:var(--sans); font-size:10px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--ink-3); margin-bottom:6px; }
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
  .vfp-client-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; }
  .vfp-client-card { padding:12px 0; border-bottom:0.5px solid var(--rule); }
  .vfp-client-card:nth-child(odd) { padding-right:20px; border-right:0.5px solid var(--rule); }
  .vfp-client-card:nth-child(even) { padding-left:20px; }
  .vfp-client-card-label { font-family:var(--sans); font-size:8px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); margin-bottom:4px; }
  .vfp-client-card-val { font-family:var(--serif); font-size:28px; font-weight:700; color:var(--ink); line-height:1; margin-bottom:3px; letter-spacing:-.02em; }
  .vfp-client-card-sub { font-family:var(--mono); font-size:10px; color:var(--ink-3); line-height:1.6; }
  .vfp-client-breakdown { margin-top:16px; overflow:hidden; }
  .vfp-client-bd-head { font-family:var(--sans); font-size:8px; font-weight:600; color:var(--ink-3); letter-spacing:.14em; text-transform:uppercase; margin-bottom:8px; }
  .vfp-client-type-row {
    display:grid; grid-template-columns:1fr auto 100px;
    align-items:center; gap:12px;
    padding:10px 0; border-bottom:0.5px solid rgba(0,0,0,.05);
  }
  .vfp-client-type-row:last-child { border-bottom:none; }
  .vfp-client-type-name { font-family:var(--sans); font-size:13px; color:var(--ink-2); }
  .vfp-client-type-pct { font-family:var(--mono); font-size:12px; color:var(--ink-3); }
  .vfp-client-type-bar { height:3px; background:var(--rule); }
  .vfp-client-type-fill { height:100%; background:var(--green-2); border-radius:1px; }

  /* Asset Allocation */
  .vfp-alloc-bar { display:flex; height:8px; border-radius:4px; overflow:hidden; gap:1px; margin-bottom:12px; }
  .vfp-alloc-bar-seg { height:100%; transition:width .6s ease; min-width:2px; }
  .vfp-alloc-bar-seg:first-child { border-radius:4px 0 0 4px; }
  .vfp-alloc-bar-seg:last-child { border-radius:0 4px 4px 0; }
  .vfp-alloc-row {
    display:grid; grid-template-columns:10px 1fr auto;
    align-items:center; gap:10px;
    padding:8px 0; border-bottom:0.5px solid rgba(0,0,0,.05);
  }
  .vfp-alloc-row:last-child { border-bottom:none; }
  .vfp-alloc-dot { width:8px; height:8px; border-radius:2px; }
  .vfp-alloc-label { font-family:var(--sans); font-size:13px; color:var(--ink-2); }
  .vfp-alloc-pct { font-family:var(--mono); font-size:12px; color:var(--ink-3); text-align:right; }

  /* Sidebar */
  .vfp-sidebar { position:sticky; top:108px; display:flex; flex-direction:column; gap:16px; align-self:start; }
  .vfp-scard { overflow:hidden; }
  .vfp-scard-head {
    padding-bottom:8px; border-bottom:0.5px solid var(--rule);
    font-family:var(--sans); font-size:8px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3);
    margin-bottom:10px;
  }
  .vfp-scard-body { padding:0; }
  .vfp-scard-elevated { background:#fff; border:0.5px solid var(--rule); border-radius:10px; padding:12px 20px; }
  .vfp-sfield {
    display:flex; justify-content:space-between; align-items:baseline;
    padding:8px 0; border-bottom:0.5px solid var(--rule);
  }
  .vfp-sfield:last-child { border-bottom:none; }
  .vfp-sfield-label { font-family:var(--sans); font-size:11px; color:var(--ink-3); }
  .vfp-sfield-val { font-family:var(--mono); font-size:11px; color:var(--ink-2); font-weight:500; text-align:right; }
  .vfp-sfield-val a { color:var(--green); text-decoration:none; transition:color .15s; }
  .vfp-sfield-val a:hover { color:var(--green-2); }

  .vfp-similar { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:0.5px solid var(--rule); text-decoration:none; transition:opacity .15s; }
  .vfp-similar:last-child { border-bottom:none; }
  .vfp-similar:hover { opacity:.7; }
  .vfp-similar-initials {
    width:32px; height:32px; flex-shrink:0; border-radius:6px;
    background:var(--white); border:0.5px solid var(--rule);
    display:grid; place-items:center;
    font-family:var(--serif); font-size:12px; font-weight:700; color:var(--ink-3);
  }
  .vfp-similar-info { flex:1; min-width:0; }
  .vfp-similar-name { font-family:var(--sans); font-size:12px; font-weight:600; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .vfp-similar-meta { font-family:var(--mono); font-size:10px; color:var(--ink-3); margin-top:1px; }
  .vfp-similar-score { font-family:var(--serif); font-size:18px; font-weight:700; flex-shrink:0; color:var(--ink-3); }

  .vfp-cta-card { background:var(--navy); border:none; border-radius:10px; overflow:hidden; }
  .vfp-cta-body { padding:24px; }
  .vfp-cta-eyebrow {
    font-size:10px; font-weight:700; letter-spacing:.18em; text-transform:uppercase;
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

  /* Gated view */
  .vfp-gate-blur {
    pointer-events:none; user-select:none; position:relative;
  }
  .vfp-gate-blur::after {
    content:''; position:absolute; inset:0;
    backdrop-filter:blur(5px); -webkit-backdrop-filter:blur(5px);
    -webkit-mask-image:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.2) 6%,rgba(0,0,0,1) 18%);
    mask-image:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.2) 6%,rgba(0,0,0,1) 18%);
    pointer-events:none; z-index:2;
  }
  .vfp-gate-preview-data {
    filter:blur(6px); pointer-events:none; user-select:none;
  }
  .vfp-gate-cta {
    position:absolute; top:60px; left:50%; transform:translateX(-50%);
    width:calc(100% - 48px); max-width:520px;
    background:#fff; border:1px solid var(--rule); border-top:2px solid var(--navy);
    box-shadow:0 32px 80px rgba(10,28,42,.13),0 4px 20px rgba(10,28,42,.07);
    padding:40px 44px; text-align:center; z-index:50;
  }
  .vfp-gate-lock {
    width:48px; height:48px; background:var(--navy);
    display:grid; place-items:center; margin:0 auto 20px;
  }
  .vfp-gate-list {
    text-align:left; margin:0 auto 24px; max-width:320px;
    display:flex; flex-direction:column; gap:10px;
  }
  .vfp-gate-list-item {
    display:flex; align-items:center; gap:10px;
    font-size:12px; color:var(--ink-2); font-family:var(--sans);
  }
  .vfp-gate-check {
    width:16px; height:16px; background:rgba(45,189,116,.1);
    display:grid; place-items:center; flex-shrink:0;
  }
  .vfp-gate-email-row { display:flex; border:1px solid var(--rule); margin-bottom:14px; }
  .vfp-gate-email-input {
    flex:1; border:none; background:var(--white); outline:none;
    font-family:var(--mono); font-size:13px; color:var(--ink); padding:12px 14px;
  }
  .vfp-gate-submit {
    background:var(--green); color:#fff; border:none; padding:12px 20px;
    font-family:var(--sans); font-size:12px; font-weight:600;
    letter-spacing:.1em; text-transform:uppercase; cursor:pointer;
    transition:background .15s; white-space:nowrap;
  }
  .vfp-gate-submit:hover { background:var(--green-2); }
  .vfp-gate-google {
    width:100%; display:flex; align-items:center; justify-content:center; gap:10px;
    background:#fff; border:1px solid var(--rule); color:var(--ink); padding:11px;
    font-size:13px; cursor:pointer; transition:border-color .15s;
    margin-bottom:14px; font-family:var(--sans); text-decoration:none;
  }
  .vfp-gate-google:hover { border-color:var(--ink-3); }
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
    .vfp-fee-grid { grid-template-columns:1fr; }
    .vfp-client-grid { grid-template-columns:1fr; }
    .vfp-client-card:nth-child(odd) { border-right:none; padding-right:0; }
    .vfp-client-card:nth-child(even) { padding-left:0; }
    .vfp-gate-cta { padding:28px 24px; width:calc(100% - 24px); top:40px; }
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
    .vfp-tab-bar { overflow-x:auto; -webkit-overflow-scrolling:touch; gap:0; }
    .vfp-tab { white-space:nowrap; flex-shrink:0; }
    .vfp-score-grid { grid-template-columns:1fr 1fr; }
    .vfp-aum-stats { grid-template-columns:1fr 1fr; }
    .vfp-client-grid { grid-template-columns:1fr; }
    .vfp-fee-grid { grid-template-columns:1fr; }
    .vfp-fee-card { padding:16px; }
    .vfp-similar-grid { grid-template-columns:1fr; }
    .vfp-gate-cta { padding:24px 16px; width:calc(100% - 16px); top:20px; }
    .vfp-breadcrumb { padding:0 12px; }
    .vfp-breadcrumb-i { gap:4px; }
    .vfp-bc-trail { font-size:10px; gap:4px; }
    .vfp-bc-actions { gap:4px; }
    .vfp-gate-nav { margin:0 -16px; }
    .vfp-gate-nav-inner { padding:0 16px; }
  }
`;

// ─── Page Component ───────────────────────────────────────────────────────────
export default async function FirmPage({ params }: { params: { crd: string } }) {
  const {
    firmData, displayName, logoKey, feeTiers, feesAndMins,
    profileText, website, growth, clientBreakdown, assetAllocation, firmScore, error,
  } = await getFirmData(params.crd);

  const firmDisplayName = displayName || firmData?.primary_business_name || 'Unknown Firm';

  // ── Not found ──
  if (error || !firmData) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
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
      ? getSimilarFirms(firm.crd, firm.main_office_state, firm.aum)
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
    { label: 'Derivatives Risk', score: fs.derivatives_score ?? 0, tip: 'Flags use of complex instruments like options, swaps, or leverage in client portfolios.' },
  ] : [];

  // ── Fee tier table ──
  const sortedFeeTiers = feeTiers
    ? [...feeTiers].sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'))
    : [];

  // ── Active sections for nav (filter out unavailable sections) ──
  // ── Allocation rows ──
  const ALLOC_LABELS: Record<string, { label: string; color: string }> = {
    public_equity:    { label: 'Public Equity',       color: '#22995E' },
    private_equity:   { label: 'Private Equity',      color: '#1A7A4A' },
    ig_corp_bonds:    { label: 'IG Corporate Bonds',  color: '#4B8ECC' },
    non_ig_corp_bonds:{ label: 'Non-IG Corp Bonds',   color: '#7AA8D4' },
    us_govt_bonds:    { label: 'US Government Bonds',  color: '#2E6BAD' },
    us_muni_bonds:    { label: 'Municipal Bonds',     color: '#5BA0D9' },
    cash:             { label: 'Cash & Equivalents',   color: '#B0C4BA' },
    derivatives:      { label: 'Derivatives',          color: '#F59E0B' },
    other:            { label: 'Other',                color: '#8FA69A' },
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

  // ── GATED VIEW (unauthenticated) ─────────────────────────────────────────────
  if (!user) {
    const truncatedAbout = profileText?.business_profile
      ? profileText.business_profile.slice(0, 280) + '…'
      : 'This SEC-registered investment adviser provides fiduciary wealth management services. Create a free account to read the full profile, including investment philosophy, fee structure, and regulatory history.';

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

        {/* Breadcrumb (simplified — no Save/Compare) */}
        <div className="vfp-breadcrumb">
          <div className="vfp-breadcrumb-i">
            <div className="vfp-bc-trail">
              <Link href="/search">Search</Link>
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
          </div>
        </div>

        <div className="vfp-page">

          {/* ── GATED CONTENT ── */}
          <div style={{ position: 'relative', minHeight: 700, marginTop: 24 }}>

            {/* Blurred preview sections */}
            <div className="vfp-gate-blur">

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

              {/* Visor Score preview */}
              <div className="vfp-section" style={{ marginTop: 40 }}>
                <div className="vfp-section-head">
                  <span className="vfp-section-title">Visor Value Score™</span>
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
              {/* Lock icon */}
              <div className="vfp-gate-lock">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <h2 style={{
                fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600,
                color: 'var(--navy)', marginTop: 16, lineHeight: 1.3,
                textAlign: 'center',
              }}>
                Unlock {firmDisplayName.split(' ').slice(0, 3).join(' ')}&apos;s full profile
              </h2>

              <p style={{
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
                marginTop: 6, textAlign: 'center', letterSpacing: '.03em',
              }}>
                Free forever · No credit card required
              </p>

              {/* Feature list */}
              <div className="vfp-gate-list">
                <div className="vfp-gate-list-item">
                  <span className="vfp-gate-check">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  Visor Score™ breakdown (8 dimensions)
                </div>
                <div className="vfp-gate-list-item">
                  <span className="vfp-gate-check">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  Interactive fee calculator
                </div>
                <div className="vfp-gate-list-item">
                  <span className="vfp-gate-check">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  AUM &amp; client growth charts
                </div>
                <div className="vfp-gate-list-item">
                  <span className="vfp-gate-check">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  Regulatory &amp; disciplinary history
                </div>
                <div className="vfp-gate-list-item">
                  <span className="vfp-gate-check">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  Side-by-side firm comparison
                </div>
                <div className="vfp-gate-list-item">
                  <span className="vfp-gate-check">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  Similar firms in your state
                </div>
              </div>

              {/* Email + submit row */}
              <div className="vfp-gate-email-row">
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="vfp-gate-email-input"
                  readOnly
                  tabIndex={-1}
                />
                <Link href="/auth/signup" className="vfp-gate-submit">
                  View Profile
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.08em' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
              </div>

              {/* Google OAuth */}
              <Link href="/auth/signup" className="vfp-gate-google">
                <svg width="16" height="16" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Link>

              {/* Trust line */}
              <p style={{
                fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
                textAlign: 'center', marginTop: 14, letterSpacing: '.02em',
              }}>
                Free forever · No credit card ·{' '}
                <Link href="/terms" style={{ color: 'var(--green)', textDecoration: 'underline', textDecorationColor: 'rgba(26,122,74,.3)' }}>Terms</Link>
                {' · '}
                <Link href="/privacy" style={{ color: 'var(--green)', textDecoration: 'underline', textDecorationColor: 'rgba(26,122,74,.3)' }}>Privacy</Link>
              </p>
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
            </div>

          </div>

          {/* Stats row */}
          <div className="vfp-stats-row">
            <div className="vfp-stat">
              <div className="vfp-stat-label">AUM</div>
              <div className="vfp-stat-val">{formatAUM(firm.aum)}</div>
              <div className="vfp-stat-sub">
                {aumStats.avgAnnualPct > 0 ? `↑ ${aumStats.avgAnnualPct.toFixed(1)}% avg annual` : 'Assets under management'}
              </div>
            </div>
            <div className="vfp-stat">
              <div className="vfp-stat-label">Avg. Client Size</div>
              <div className="vfp-stat-val">{avgClientSize ? formatAUM(avgClientSize) : '—'}</div>
              <div className="vfp-stat-sub">{totalClients > 0 ? `${totalClients.toLocaleString()} total clients` : 'Per client average'}</div>
            </div>
            <div className="vfp-stat">
              <div className="vfp-stat-label">AUM / Inv. Pro</div>
              <div className="vfp-stat-val">{aumPerInvPro ? formatAUM(aumPerInvPro) : '—'}</div>
              <div className="vfp-stat-sub">{firm.employee_investment ? `${firm.employee_investment} advisory staff` : 'Per investment professional'}</div>
            </div>
            <div className="vfp-stat">
              <div className="vfp-stat-label">Min. Account</div>
              <div className="vfp-stat-val">{minAccount ? formatAUM(minAccount) : '—'}</div>
              <div className="vfp-stat-sub">{minFee ? `Min fee ${formatCurrency(minFee)}` : 'No minimum disclosed'}</div>
            </div>
            <div className="vfp-stat">
              <div className="vfp-stat-label">Employees</div>
              <div className="vfp-stat-val">{firm.employee_total ?? '—'}</div>
              <div className="vfp-stat-sub">{firm.employee_investment ? `${firm.employee_investment} investment staff` : 'Total headcount'}</div>
            </div>
            <div className="vfp-stat vfp-stat-score">
              <div className="vfp-stat-label">Visor Score™</div>
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
                <div>
                  {profileText.business_profile && (
                    <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.9, margin: 0, maxWidth: 620, fontFamily: 'var(--sans)' }}>
                      {profileText.business_profile}
                    </p>
                  )}
                  {profileText.investment_philosophy && (
                    <div style={{
                      marginTop: profileText.business_profile ? 24 : 0,
                      paddingTop: profileText.business_profile ? 20 : 0,
                      borderTop: profileText.business_profile ? '0.5px solid var(--rule)' : 'none',
                    }}>
                      <div style={{
                        fontSize: 9, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase' as const,
                        color: 'var(--ink-3)', marginBottom: 8, fontFamily: 'var(--sans)',
                      }}>
                        Investment Philosophy
                      </div>
                      <p style={{ fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0, maxWidth: 560, fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
                        {profileText.investment_philosophy}
                      </p>
                    </div>
                  )}
                </div>
                {/* Classification badges + client tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  {heroBadges.map((b, i) => b.href ? (
                    <Link key={`b-${i}`} href={b.href} style={{
                      fontFamily: 'var(--sans)', fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const,
                      padding: '3px 8px', borderRadius: 3, textDecoration: 'none',
                      background: b.green ? 'var(--green-pale)' : 'transparent',
                      color: b.green ? 'var(--green)' : 'var(--ink-3)',
                      border: b.green ? '0.5px solid rgba(26,122,74,.25)' : '0.5px solid var(--rule)',
                    }}>{b.label}</Link>
                  ) : (
                    <span key={`b-${i}`} style={{
                      fontFamily: 'var(--sans)', fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const,
                      padding: '3px 8px', border: '0.5px solid var(--rule)', color: 'var(--ink-3)', borderRadius: 3,
                    }}>{b.label}</span>
                  ))}
                  {(profileText.specialty_strategies || profileText.client_base) &&
                    [profileText.specialty_strategies, profileText.client_base, profileText.wealth_tier]
                      .filter(Boolean)
                      .flatMap(s => s!.split(',').map(t => t.trim()))
                      .slice(0, 6)
                      .map((tag, i) => (
                        <span key={`t-${i}`} style={{
                          fontFamily: 'var(--sans)', fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const,
                          padding: '3px 8px', border: '0.5px solid var(--rule)', color: 'var(--ink-3)', borderRadius: 3,
                        }}>{tag}</span>
                      ))
                  }
                </div>
              </div>
            )}

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
                      {scoreRank ? (
                        <>
                          Ranked <strong>#{scoreRank.rank.toLocaleString()}</strong> of{' '}
                          <strong>{scoreRank.total.toLocaleString()}</strong> scored firms nationally ·{' '}
                          <strong>Top {Math.ceil((scoreRank.rank / scoreRank.total) * 100)}%</strong>{' '}
                          of all SEC-registered advisors. Score derived from 8 weighted metrics across fee transparency, conflict disclosures, AUM growth, and service capacity.
                        </>
                      ) : (
                        <>
                          Score is derived from <strong>8 weighted metrics</strong> across fee transparency,
                          conflict-of-interest disclosures, AUM growth, and client service capacity —
                          all sourced from SEC Form ADV filings.
                        </>
                      )}
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
                  <span className="vfp-section-meta">{totalClients > 0 ? `${totalClients.toLocaleString()} total · ` : ''}As of latest ADV filing</span>
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

            {/* ── ASSET ALLOCATION ── */}
            {allocRows.length > 0 && (
              <div className="vfp-section" id="allocation">
                <div className="vfp-section-head">
                  <span className="vfp-section-title">Asset Allocation</span>
                  <span className="vfp-section-meta">Form ADV · Self-reported</span>
                </div>

                {/* Stacked bar */}
                <div className="vfp-alloc-bar">
                  {allocRows.map(r => (
                    <div
                      key={r.key}
                      className="vfp-alloc-bar-seg"
                      style={{ width: `${r.pct}%`, background: r.color }}
                      title={`${r.label}: ${r.pct.toFixed(1)}%`}
                    />
                  ))}
                </div>

                {/* Legend rows */}
                {allocRows.map(r => (
                  <div key={r.key} className="vfp-alloc-row">
                    <div className="vfp-alloc-dot" style={{ background: r.color }} />
                    <div className="vfp-alloc-label">{r.label}</div>
                    <div className="vfp-alloc-pct">{r.pct.toFixed(1)}%</div>
                  </div>
                ))}
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

            {/* ── KEY PERSONNEL ── */}
            <div className="vfp-section" id="personnel">
              <div className="vfp-section-head">
                <span className="vfp-section-title">Key Personnel</span>
                <span className="vfp-section-meta">{firm.employee_total ? `${firm.employee_total} employees · ` : ''}ADV Part 1 · Schedule A</span>
              </div>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 20 }}>
                  <div style={{ padding: '16px 24px 16px 0', borderRight: '0.5px solid var(--rule)', borderBottom: '0.5px solid var(--rule)' }}>
                    <div className="vfp-client-card-label">Total Employees</div>
                    <div className="vfp-client-card-val">{firm.employee_total ?? '—'}</div>
                  </div>
                  <div style={{ padding: '16px 0 16px 24px', borderBottom: '0.5px solid var(--rule)' }}>
                    <div className="vfp-client-card-label">Investment Staff</div>
                    <div className="vfp-client-card-val">{firm.employee_investment ?? '—'}</div>
                  </div>
                </div>
                <div style={{ background: 'var(--white)', border: '0.5px dashed var(--rule-2)', borderRadius: 6, padding: '12px 13px', display: 'flex', gap: 12, marginTop: 16 }}>
                  <div style={{
                    width: 32, height: 32, background: '#fff', border: '0.5px solid var(--rule)',
                    display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: 4,
                  }}>
                    <svg width="12" height="12" fill="none" stroke="var(--ink-3)" strokeWidth="1.4" viewBox="0 0 12 12">
                      <circle cx="6" cy="6" r="5" /><path d="M6 4v2.5L7.5 8" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 500, color: 'var(--ink-2)', marginBottom: 4 }}>
                      Ownership &amp; principal data coming soon
                    </div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 10.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                      Individual principal names, roles, and ownership percentages from ADV Schedule A will be available in an upcoming release.
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </main>

          {/* ══ SIDEBAR ══ */}
          <aside className="vfp-sidebar">

            {/* CTA — Negotiate (top of sidebar, most prominent) */}
            <div className="vfp-cta-card">
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

            {/* Similar firms */}
            <div className="vfp-scard">
              <div className="vfp-scard-head">Similar Firms</div>
              <div className="vfp-scard-body">
                {similarFirms.length > 0 ? similarFirms.map((sf) => (
                  <Link key={sf.crd} href={`/firm/${sf.crd}`} className="vfp-similar">
                    <div className="vfp-similar-initials">{sf.name.slice(0, 2).toUpperCase()}</div>
                    <div className="vfp-similar-info">
                      <div className="vfp-similar-name">{sf.name}</div>
                      <div className="vfp-similar-meta">{sf.city}, {sf.state} · {formatAUM(sf.aum)}</div>
                    </div>
                    {sf.score != null && (
                      <div className="vfp-similar-score" style={{ color: scoreColor(sf.score) }}>
                        {Math.round(sf.score)}
                      </div>
                    )}
                  </Link>
                )) : (
                  <>
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
                  </>
                )}
              </div>
            </div>

            {/* Contact — flat */}
            <div className="vfp-scard">
              <div className="vfp-scard-head">Contact</div>
              <div className="vfp-scard-body">
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

            {/* Filing details — flat */}
            <div className="vfp-scard">
              <div className="vfp-scard-head">Filing Details</div>
              <div className="vfp-scard-body">
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

          </aside>
        </div>
      </div>
    </>
  );
}
