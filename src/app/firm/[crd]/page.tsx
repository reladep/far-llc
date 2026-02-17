import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Button, Badge, Card, CardContent } from '@/components/ui';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import SaveFirmButton from '@/components/firms/SaveFirmButton';

// Create server-side Supabase client for data queries
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
}

interface Website {
  website: string | null;
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
    other: null, // Could calculate from other fields if needed
  } : null;

  return {
    firmData: firmData as FirmData | null,
    feeTiers: feeTiers as FeeTier[] | null,
    profileText: profileText as ProfileText | null,
    website: website as Website | null,
    growth: growth as GrowthRecord[] | null,
    assetAllocation,
    clientBreakdown,
    error: firmError
  };
}

export async function generateMetadata({
  params,
}: {
  params: { crd: string };
}): Promise<Metadata> {
  const { firmData } = await getFirmData(params.crd);
  const name = firmData?.primary_business_name || 'Firm';
  
  return {
    title: `${name} - FAR`,
    description: `View detailed profile, fees, services, and reviews for ${name}. SEC-registered investment advisor.`,
  };
}

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
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 text-center">
      <p className="text-xl md:text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function TabButton({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-green-600 text-green-700'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

export default async function FirmPage({ params }: { params: { crd: string } }) {
  const { firmData, feeTiers, profileText, website, growth, assetAllocation, clientBreakdown, error } = await getFirmData(params.crd);

  if (error || !firmData) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-slate-900">Firm Not Found</h1>
          <p className="mt-2 text-slate-500">We couldn&apos;t find a firm with CRD #{params.crd}</p>
          <Link href="/search">
            <Button variant="outline" className="mt-4">Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  const firm = firmData;

  // Auth gating: show teaser if not authenticated
  const authSupabase = createSupabaseServerClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  // Check if firm is saved by this user
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

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center py-20">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {firm.primary_business_name}
          </h1>
          <p className="mt-2 text-slate-500">
            {firm.main_office_city}, {firm.main_office_state}
          </p>
          <div className="mt-8 p-6 bg-slate-50 rounded-xl max-w-md mx-auto">
            <p className="text-slate-700 font-medium">
              Create a free account to view the full firm profile, fee schedules, and detailed analytics.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/auth/signup">
                <Button>Get Started Free</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-4">
        <a href="/search" className="hover:text-green-600">Search</a>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{firm.primary_business_name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {firm.primary_business_name}
          </h1>
          <p className="mt-1 text-slate-500">
            {firm.main_office_city}, {firm.main_office_state} • CRD #{firm.crd}
          </p>
        </div>
        <div className="flex gap-2">
          <SaveFirmButton crd={firm.crd} initialSaved={isSaved} />
          <Button variant="primary">Compare</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatBox label="AUM" value={formatAUM(firm.aum)} />
        <StatBox label="Discretionary AUM" value={formatAUM(firm.aum_discretionary)} />
        <StatBox label="Employees" value={firm.employee_total?.toLocaleString() || 'N/A'} />
        <StatBox label="Investment Pros" value={firm.employee_investment?.toLocaleString() || 'N/A'} />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6 overflow-x-auto">
        <div className="flex gap-0 -mb-px">
          <TabButton label="Overview" active />
          <TabButton label="Fees" />
          <TabButton label="Services" />
          <TabButton label="Disclosures" />
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Firm Profile */}
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">About</h2>
              {profileText?.business_profile ? (
                <p className="text-slate-600 leading-relaxed">{profileText.business_profile}</p>
              ) : (
                <p className="text-slate-500 italic">No profile available</p>
              )}
            </CardContent>
          </Card>

          {/* Investment Philosophy */}
          {profileText?.investment_philosophy && (
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Investment Philosophy</h2>
                <p className="text-slate-600 leading-relaxed">{profileText.investment_philosophy}</p>
              </CardContent>
            </Card>
          )}

          {/* Client Base */}
          {profileText?.client_base && (
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Client Base</h2>
                <p className="text-slate-600 leading-relaxed">{profileText.client_base}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Facts */}
          <Card>
            <CardContent>
              <h3 className="font-semibold text-slate-900 mb-4">Quick Facts</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Legal Structure</dt>
                  <dd className="text-slate-900 font-medium">{firm.legal_structure || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">SEC File Date</dt>
                  <dd className="text-slate-900 font-medium">{firm.latest_adv_filing || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Private Fund Advisor</dt>
                  <dd className="text-slate-900 font-medium">{firm.private_fund_advisor === 'Y' ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardContent>
              <h3 className="font-semibold text-slate-900 mb-4">Services</h3>
              <div className="flex flex-wrap gap-2">
                {firm.services_financial_planning === 'Y' && <Badge variant="primary">Financial Planning</Badge>}
                {firm.services_mgr_selection === 'Y' && <Badge>Manager Selection</Badge>}
                {firm.services_pension_consulting === 'Y' && <Badge>Pension Consulting</Badge>}
                {firm.services_port_management_individuals === 'Y' && <Badge>Portfolio Mgmt (Individuals)</Badge>}
                {firm.services_port_management_institutional === 'Y' && <Badge>Portfolio Mgmt (Institutional)</Badge>}
                {firm.services_port_management_pooled === 'Y' && <Badge>Portfolio Mgmt (Pooled)</Badge>}
              </div>
            </CardContent>
          </Card>

          {/* Fee Schedule with Visualization */}
          {feeTiers && feeTiers.length > 0 && (() => {
            const sorted = [...feeTiers].sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'));
            const maxFee = Math.max(...sorted.filter(t => t.fee_pct != null).map(t => t.fee_pct!), 0);
            return (
              <Card>
                <CardContent>
                  <h3 className="font-semibold text-slate-900 mb-4">Fee Schedule</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 text-slate-500 font-medium">AUM Range</th>
                        <th className="text-right py-2 text-slate-500 font-medium">Fee %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((tier, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2 text-slate-600">
                            {formatCurrency(parseInt(tier.min_aum || '0'))} – {tier.max_aum ? formatCurrency(tier.max_aum) : '∞'}
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: maxFee > 0 && tier.fee_pct ? `${(tier.fee_pct / maxFee) * 100}%` : '0%' }}
                                />
                              </div>
                              <span className="text-slate-900 font-medium w-12 text-right">
                                {tier.fee_pct != null ? `${tier.fee_pct}%` : 'N/A'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })()}

          {/* Contact */}
          <Card>
            <CardContent>
              <h3 className="font-semibold text-slate-900 mb-4">Contact</h3>
              <address className="not-italic text-sm text-slate-600 space-y-2">
                {firm.main_office_street_1 && (
                  <p>{firm.main_office_street_1}{firm.main_office_street_2 && `, ${firm.main_office_street_2}`}</p>
                )}
                <p>
                  {firm.main_office_city}, {firm.main_office_state} {firm.main_office_zip}
                </p>
                {firm.main_phone_number && (
                  <p>
                    <a href={`tel:${firm.main_phone_number}`} className="text-green-600 hover:underline">
                      {firm.main_phone_number}
                    </a>
                  </p>
                )}
                {website?.website && (
                  <p>
                    <a 
                      href={website.website.startsWith('http') ? website.website : `https://${website.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-green-600 hover:underline"
                    >
                      {website.website.replace(/^https?:\/\//, '')}
                    </a>
                  </p>
                )}
              </address>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Firm Growth History - Annual, last 10 years */}
      {growth && growth.length > 0 && (() => {
        // Parse all records and group by year, keeping the latest record for each year
        const byYear = new Map<number, { date: string; dateObj: Date; aum: number; clients: number | null; employees: string; year: number }>();
        
        growth.forEach(g => {
          const aum = parseAUM(g.aum);
          const clients = g.client_total_or_calc ? parseInt(g.client_total_or_calc.replace(/,/g, '')) : null;
          const parts = (g.date_submitted || '').split('/');
          if (parts.length !== 3 || aum == null) return;
          
          const dateObj = new Date(+parts[2], +parts[0] - 1, +parts[1]);
          const year = dateObj.getFullYear();
          
          // Keep the latest record for each year
          if (!byYear.has(year) || dateObj.getTime() > byYear.get(year)!.dateObj.getTime()) {
            byYear.set(year, {
              date: g.date_submitted || '',
              dateObj,
              aum,
              clients,
              employees: g.employee_total_calc || '',
              year
            });
          }
        });
        
        // Convert to array, sort by year, limit to last 10 years
        const years = Array.from(byYear.values())
          .sort((a, b) => a.year - b.year)
          .slice(-10);
        
        // Only show if we have at least 3 years of data
        if (years.length < 3) return null;
        
        // Calculate derived metrics for each year
        const dataWithMetrics = years.map(y => ({
          year: y.year,
          aum: y.aum,
          clients: y.clients,
          avgClientSize: y.clients && y.clients > 0 ? y.aum / y.clients : null
        }));
        
        const maxAum = Math.max(...dataWithMetrics.map(d => d.aum), 1);
        const maxClients = Math.max(...dataWithMetrics.filter(d => d.clients).map(d => d.clients!), 1);
        const maxAvgSize = Math.max(...dataWithMetrics.filter(d => d.avgClientSize).map(d => d.avgClientSize!), 1);
        
        // Helper to format average client size
        const formatAvgSize = (val: number | null) => {
          if (val == null) return 'N/A';
          if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
          if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
          if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
          return `$${val.toFixed(0)}`;
        };
        
        const numYears = dataWithMetrics.length;
        const chartHeight = 160;
        
        return (
          <Card className="mt-8">
            <CardContent>
              {/* AUM Growth Chart */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">AUM Growth</h2>
                <span className="text-xs text-slate-400">Annual (last {numYears} years)</span>
              </div>
              
              <div className="mb-6 border-b border-slate-200 pb-6">
                <div className="flex justify-between items-end">
                  {dataWithMetrics.map((d, i) => {
                    const barHeight = Math.max((d.aum / maxAum) * chartHeight, 8);
                    const prevAum = dataWithMetrics[i-1]?.aum;
                    const pctChange = i > 0 && prevAum ? ((d.aum - prevAum) / prevAum * 100) : null;
                    
                    return (
                      <div key={d.year} className="flex flex-col items-center flex-1 min-w-0">
                        <span className="text-[10px] font-medium text-green-700 mb-1 whitespace-nowrap truncate max-w-full">
                          {formatCurrency(d.aum)}
                        </span>
                        <div className="w-full flex flex-col items-center" style={{ height: chartHeight }}>
                          <div className="flex-1" />
                          <div
                            className="w-6 sm:w-8 md:w-10 bg-green-500 rounded-t shadow-sm hover:bg-green-600 transition-colors cursor-default"
                            style={{ height: barHeight }}
                            title={`${d.year}: ${formatCurrency(d.aum)}`}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 mt-2">{d.year}</span>
                        <span className={`text-[9px] h-[12px] ${pctChange !== null ? (pctChange >= 0 ? 'text-green-600' : 'text-red-500') : 'text-transparent'}`}>
                          {pctChange !== null ? `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(0)}%` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Client Growth Chart */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Client Growth</h2>
              </div>
              
              <div className="mb-6 border-b border-slate-200 pb-6">
                <div className="flex justify-between items-end">
                  {dataWithMetrics.map((d, i) => {
                    const barHeight = d.clients ? Math.max((d.clients / maxClients) * chartHeight, 8) : 0;
                    const prevClients = dataWithMetrics[i-1]?.clients;
                    const pctChange = i > 0 && d.clients && prevClients 
                      ? ((d.clients - prevClients) / prevClients * 100) 
                      : null;
                    
                    return (
                      <div key={d.year} className="flex flex-col items-center flex-1 min-w-0">
                        <span className="text-[10px] font-medium text-blue-700 mb-1 whitespace-nowrap truncate max-w-full">
                          {d.clients ? d.clients.toLocaleString() : '—'}
                        </span>
                        <div className="w-full flex flex-col items-center" style={{ height: chartHeight }}>
                          <div className="flex-1" />
                          {d.clients && (
                            <div
                              className="w-6 sm:w-8 md:w-10 bg-blue-500 rounded-t shadow-sm hover:bg-blue-600 transition-colors cursor-default"
                              style={{ height: barHeight }}
                              title={`${d.year}: ${d.clients?.toLocaleString()} clients`}
                            />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 mt-2">{d.year}</span>
                        <span className={`text-[9px] h-[12px] ${pctChange !== null ? (pctChange >= 0 ? 'text-green-600' : 'text-red-500') : 'text-transparent'}`}>
                          {pctChange !== null ? `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(0)}%` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Average Client Size Chart */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Avg Client Size</h2>
              </div>
              
              <div>
                <div className="flex justify-between items-end">
                  {dataWithMetrics.map((d, i) => {
                    const barHeight = d.avgClientSize ? Math.max((d.avgClientSize / maxAvgSize) * chartHeight, 8) : 0;
                    const prevAvg = dataWithMetrics[i-1]?.avgClientSize;
                    const pctChange = i > 0 && d.avgClientSize && prevAvg
                      ? ((d.avgClientSize - prevAvg) / prevAvg * 100)
                      : null;
                    
                    return (
                      <div key={d.year} className="flex flex-col items-center flex-1 min-w-0">
                        <span className="text-[10px] font-medium text-purple-700 mb-1 whitespace-nowrap truncate max-w-full">
                          {d.avgClientSize ? formatAvgSize(d.avgClientSize) : '—'}
                        </span>
                        <div className="w-full flex flex-col items-center" style={{ height: chartHeight }}>
                          <div className="flex-1" />
                          {d.avgClientSize && (
                            <div
                              className="w-6 sm:w-8 md:w-10 bg-purple-500 rounded-t shadow-sm hover:bg-purple-600 transition-colors cursor-default"
                              style={{ height: barHeight }}
                              title={`${d.year}: ${formatAvgSize(d.avgClientSize)} avg per client`}
                            />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 mt-2">{d.year}</span>
                        <span className={`text-[9px] h-[12px] ${pctChange !== null ? (pctChange >= 0 ? 'text-green-600' : 'text-red-500') : 'text-transparent'}`}>
                          {pctChange !== null ? `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(0)}%` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Asset Allocation */}
      {assetAllocation && (() => {
        const categories = [
          { key: 'public_equity', label: 'Public Equity', value: assetAllocation.public_equity, color: 'bg-blue-500' },
          { key: 'private_equity', label: 'Private Equity', value: assetAllocation.private_equity, color: 'bg-indigo-500' },
          { key: 'ig_corp_bonds', label: 'Inv. Grade Bonds', value: assetAllocation.ig_corp_bonds, color: 'bg-green-500' },
          { key: 'non_ig_corp_bonds', label: 'High Yield Bonds', value: assetAllocation.non_ig_corp_bonds, color: 'bg-yellow-500' },
          { key: 'us_govt_bonds', label: 'US Gov\'t Bonds', value: assetAllocation.us_govt_bonds, color: 'bg-emerald-500' },
          { key: 'us_muni_bonds', label: 'Municipal Bonds', value: assetAllocation.us_muni_bonds, color: 'bg-teal-500' },
          { key: 'cash', label: 'Cash', value: assetAllocation.cash, color: 'bg-slate-400' },
          { key: 'derivatives', label: 'Derivatives', value: assetAllocation.derivatives, color: 'bg-purple-500' },
          { key: 'other', label: 'Other', value: assetAllocation.other, color: 'bg-gray-500' },
        ].filter(c => c.value !== null && c.value > 0).sort((a, b) => (b.value || 0) - (a.value || 0));
        
        if (categories.length === 0) return null;
        
        const total = categories.reduce((sum, c) => sum + (c.value || 0), 0);
        const maxValue = Math.max(...categories.map(c => c.value || 0));
        
        return (
          <Card className="mt-8">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Asset Allocation</h2>
                <span className="text-xs text-slate-400">{categories.length} categories</span>
              </div>
              
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat.key} className="flex items-center gap-3">
                    <span className="w-28 text-xs font-medium text-slate-600 shrink-0">{cat.label}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                      <div
                        className={`h-full ${cat.color} rounded flex items-center px-2`}
                        style={{ width: `${((cat.value || 0) / maxValue) * 100}%` }}
                      >
                        <span className="text-xs text-white font-medium whitespace-nowrap">
                          {cat.value}%
                        </span>
                      </div>
                    </div>
                    <span className="w-12 text-xs text-slate-500 text-right shrink-0">
                      {((cat.value || 0) / total * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Client Breakdown */}
      {clientBreakdown && (() => {
        const totalClients = (clientBreakdown.hnw || 0) + (clientBreakdown.non_hnw || 0) + 
          (clientBreakdown.pension || 0) + (clientBreakdown.charitable || 0) + 
          (clientBreakdown.corporations || 0) + (clientBreakdown.pooled_vehicles || 0);
        
        if (totalClients === 0) return null;
        
        const categories = [
          { key: 'hnw', label: 'High Net Worth', value: clientBreakdown.hnw, color: 'bg-blue-500' },
          { key: 'non_hnw', label: 'Non-HNW Individuals', value: clientBreakdown.non_hnw, color: 'bg-sky-400' },
          { key: 'pension', label: 'Pension Plans', value: clientBreakdown.pension, color: 'bg-green-500' },
          { key: 'corporations', label: 'Corporations', value: clientBreakdown.corporations, color: 'bg-purple-500' },
          { key: 'charitable', label: 'Charitable Orgs', value: clientBreakdown.charitable, color: 'bg-pink-500' },
          { key: 'pooled_vehicles', label: 'Pooled Vehicles', value: clientBreakdown.pooled_vehicles, color: 'bg-orange-500' },
        ].filter(c => c.value !== null && c.value > 0).sort((a, b) => (b.value || 0) - (a.value || 0));
        
        if (categories.length === 0) return null;
        
        const maxValue = Math.max(...categories.map(c => c.value || 0));
        
        return (
          <Card className="mt-8">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Client Breakdown</h2>
                <span className="text-xs text-slate-400">{totalClients.toLocaleString()} total clients</span>
              </div>
              
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat.key} className="flex items-center gap-3">
                    <span className="w-28 text-xs font-medium text-slate-600 shrink-0">{cat.label}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                      <div
                        className={`h-full ${cat.color} rounded flex items-center px-2`}
                        style={{ width: `${((cat.value || 0) / maxValue) * 100}%` }}
                      >
                        <span className="text-xs text-white font-medium whitespace-nowrap">
                          {cat.value?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span className="w-12 text-xs text-slate-500 text-right shrink-0">
                      {((cat.value || 0) / totalClients * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
