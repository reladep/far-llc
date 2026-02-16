import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Button, Badge, Card, CardContent } from '@/components/ui';

// Create server-side Supabase client
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

  return {
    firmData: firmData as FirmData | null,
    feeTiers: feeTiers as FeeTier[] | null,
    profileText: profileText as ProfileText | null,
    website: website as Website | null,
    growth: growth as GrowthRecord[] | null,
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
  const { firmData, feeTiers, profileText, website, growth, error } = await getFirmData(params.crd);

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
          <Button variant="outline">Save Firm</Button>
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
                    <a href={`https://${website.website}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                      {website.website}
                    </a>
                  </p>
                )}
              </address>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Firm Growth History */}
      {growth && growth.length > 0 && (() => {
        const parsed = growth
          .map(g => ({ date: g.date_submitted || '', aum: parseAUM(g.aum), employees: g.employee_total_calc, clients: g.client_total_or_calc }))
          .filter(g => g.aum != null);
        const maxAum = Math.max(...parsed.map(g => g.aum!), 1);
        if (parsed.length === 0) return null;
        return (
          <Card className="mt-8">
            <CardContent>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Firm Growth History</h2>
              <div className="space-y-3">
                {parsed.map((g, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-slate-500">{g.date}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded flex items-center px-2"
                        style={{ width: `${Math.max((g.aum! / maxAum) * 100, 2)}%` }}
                      >
                        <span className="text-xs text-white font-medium whitespace-nowrap">
                          {formatCurrency(g.aum)}
                        </span>
                      </div>
                    </div>
                    {g.employees && (
                      <span className="text-xs text-slate-400 shrink-0">{g.employees} emp</span>
                    )}
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
