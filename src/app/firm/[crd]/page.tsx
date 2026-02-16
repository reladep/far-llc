import type { Metadata } from 'next';
import { Button, Badge, Card, CardContent } from '@/components/ui';

// Sample data based on Supabase schema - firmdata_current
const sampleFirm = {
  crd: 123456,
  primary_business_name: 'Meridian Wealth Management',
  main_office_city: 'New York',
  main_office_state: 'NY',
  main_office_street_1: '123 Wall Street',
  main_office_street_2: 'Suite 2100',
  main_office_zip: '10005',
  main_phone_number: '(212) 555-0100',
  website: 'www.meridianwealth.com',
  aum: 500000000,
  aum_discretionary: 450000000,
  aum_non_discretionary: 50000000,
  employee_total: 25,
  employee_investment: 18,
  client_hnw_number: 450,
  client_non_hnw_number: 1200,
  legal_structure: 'Corporation',
  services_financial_planning: 'Yes',
  services_portfolio_management: 'Yes',
  services_pension_consulting: 'Yes',
  private_fund_advisor: 'Yes',
  latest_adv_filing: '2025-12-31',
};

// Sample data - firmdata_feetiers
const feeTiers = [
  { min_aum: 0, max_aum: 1000000, fee_pct: 1.25 },
  { min_aum: 1000000, max_aum: 5000000, fee_pct: 1.00 },
  { min_aum: 5000000, max_aum: 10000000, fee_pct: 0.85 },
  { min_aum: 10000000, max_aum: null, fee_pct: 0.65 },
];

// Sample data - firmdata_profile_text
const profileText = {
  business_profile: 'Meridian Wealth Management provides comprehensive financial planning and investment management services to high-net-worth individuals and families. Our fiduciary commitment ensures we always act in our clients\' best interests. We believe in a disciplined, data-driven approach to wealth management that focuses on long-term growth and risk management.',
  notable_characteristics: 'Specialized in serving entrepreneurs and business owners. Offerings include estate planning coordination and tax-efficient investment strategies.',
  client_base: 'Primarily high-net-worth individuals and families, with a focus on business owners and executives.',
  wealth_tier: 'Ultra High Net Worth',
  investment_philosophy: 'We believe in a diversified, evidence-based approach that balances risk and reward while minimizing costs.',
  specialty_strategies: 'Tax-loss harvesting, concentrated stock positions, philanthropic giving strategies',
};

export async function generateMetadata({
  params,
}: {
  params: { crd: string };
}): Promise<Metadata> {
  return {
    title: `${sampleFirm.primary_business_name} - FAR`,
    description: `View detailed profile, fees, services, and reviews for ${sampleFirm.primary_business_name}. SEC-registered investment advisor.`,
  };
}

function formatAUM(value: number): string {
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

export default function FirmProfilePage({
  params,
}: {
  params: { crd: string };
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-slate-500">
        <a href="/" className="hover:text-slate-700">Home</a>
        {' / '}
        <a href="/search" className="hover:text-slate-700">Search</a>
        {' / '}
        <span className="text-slate-900">{sampleFirm.primary_business_name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-green-100 flex items-center justify-center text-green-700 text-xl font-bold">
            M
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {sampleFirm.primary_business_name}
            </h1>
            <p className="text-sm text-slate-500">
              {sampleFirm.main_office_city}, {sampleFirm.main_office_state} · CRD #{sampleFirm.crd}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="primary">Fee-Only</Badge>
              <Badge>Fiduciary</Badge>
              <Badge>Financial Planning</Badge>
              <Badge>Estate Planning</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Compare</Button>
          <Button>Request Info</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Assets Under Management" value={formatAUM(sampleFirm.aum)} />
        <StatBox label="Fee Structure" value="Fee-Only" />
        <StatBox label="Min Investment" value="$1M" />
        <StatBox label="Team Size" value={`${sampleFirm.employee_total} employees`} />
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-slate-200">
        <div className="flex gap-0 overflow-x-auto">
          <TabButton label="Overview" active />
          <TabButton label="Services" />
          <TabButton label="Fees" />
          <TabButton label="Disclosures" />
          <TabButton label="Reviews" />
        </div>
      </div>

      {/* Tab Content: Overview */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">About</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {profileText.business_profile}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Services</h2>
              <ul className="grid grid-cols-2 gap-2">
                {[
                  'Financial Planning',
                  'Portfolio Management',
                  'Retirement Planning',
                  'Tax Strategy',
                  'Estate Planning',
                  'Insurance Planning',
                ].map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-600">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Fee Schedule</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 text-slate-500 font-medium">AUM Range</th>
                      <th className="text-right py-2 text-slate-500 font-medium">Annual Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeTiers.map((tier, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-3 text-slate-600">
                          ${(tier.min_aum / 1000000).toFixed(0)}M - {tier.max_aum ? `$${(tier.max_aum / 1000000).toFixed(0)}M` : 'All'}
                        </td>
                        <td className="py-3 text-right font-medium text-slate-900">
                          {tier.fee_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Contact</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p>{sampleFirm.main_office_street_1}</p>
                {sampleFirm.main_office_street_2 && <p>{sampleFirm.main_office_street_2}</p>}
                <p>{sampleFirm.main_office_city}, {sampleFirm.main_office_state} {sampleFirm.main_office_zip}</p>
                <p className="mt-2 text-green-600">{sampleFirm.website}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Facts</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Founded</span>
                  <span className="text-slate-900">2008</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Legal Structure</span>
                  <span className="text-slate-900">{sampleFirm.legal_structure}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SEC Registered</span>
                  <span className="text-green-600">Yes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last ADV Filing</span>
                  <span className="text-slate-900">{sampleFirm.latest_adv_filing}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Similar Firms</h3>
              <p className="text-xs text-slate-500">
                Similar firm recommendations will appear here.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
