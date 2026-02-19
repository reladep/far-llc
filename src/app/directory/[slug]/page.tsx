import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, Badge } from '@/components/ui';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington D.C.', FL: 'Florida',
  GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
  IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
  MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', PR: 'Puerto Rico',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas',
  UT: 'Utah', VT: 'Vermont', VA: 'Virginia', VI: 'Virgin Islands', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

interface StateFirm {
  crd: number;
  primary_business_name: string | null;
  main_office_city: string | null;
  aum: number | null;
  employee_total: number | null;
  employee_investment: number | null;
}

async function getStateFirms(stateCode: string) {
  const { data } = await supabase
    .from('firmdata_current')
    .select('crd, primary_business_name, main_office_city, aum, employee_total, employee_investment')
    .eq('main_office_state', stateCode.toUpperCase())
    .order('aum', { ascending: false, nullsFirst: false });

  return (data || []) as StateFirm[];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const code = params.slug.toUpperCase();
  const name = STATE_NAMES[code] || params.slug;
  return {
    title: `Financial Advisors in ${name} — FAR`,
    description: `Browse and compare SEC-registered investment advisory firms in ${name}. View fees, AUM, and more.`,
  };
}

export default async function StateDirectoryPage({ params }: { params: { slug: string } }) {
  const code = params.slug.toUpperCase();
  const stateName = STATE_NAMES[code];

  if (!stateName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">State not found</h1>
          <p className="mt-2 text-text-secondary">The state &quot;{params.slug}&quot; was not recognized.</p>
          <Link href="/directory" className="mt-4 inline-block text-primary hover:text-primary-700 font-medium">
            ← Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const firms = await getStateFirms(code);
  const totalAUM = firms.reduce((sum, f) => sum + (f.aum || 0), 0);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-bg-primary border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <Link href="/directory" className="text-sm text-primary hover:text-primary-700 font-medium mb-4 inline-block">
            ← All States
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
            Financial Advisors in {stateName}
          </h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-secondary">
            <span><strong className="text-text-primary">{firms.length}</strong> firms</span>
            <span><strong className="text-text-primary">{formatAUM(totalAUM)}</strong> total AUM</span>
          </div>
        </div>
      </section>

      {/* Firm List */}
      <section className="mx-auto max-w-5xl px-4 py-8">
        {firms.length === 0 ? (
          <p className="text-text-secondary text-center py-12">No firms found in {stateName}.</p>
        ) : (
          <div className="space-y-3">
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 text-xs font-medium text-text-tertiary uppercase tracking-wider">
              <div className="col-span-5">Firm</div>
              <div className="col-span-2 text-right">AUM</div>
              <div className="col-span-2">City</div>
              <div className="col-span-2 text-right">Employees</div>
              <div className="col-span-1"></div>
            </div>

            {firms.map((firm) => (
              <Link key={firm.crd} href={`/firm/${firm.crd}`}>
                <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="sm:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5">
                        <p className="font-semibold text-text-primary text-sm truncate">
                          {firm.primary_business_name || 'Unknown Firm'}
                        </p>
                        <p className="text-xs text-text-tertiary sm:hidden mt-0.5">
                          {firm.main_office_city || ''} · {formatAUM(firm.aum)}
                        </p>
                      </div>
                      <div className="hidden sm:block col-span-2 text-right">
                        <p className="text-sm font-medium text-text-primary">{formatAUM(firm.aum)}</p>
                      </div>
                      <div className="hidden sm:block col-span-2">
                        <p className="text-sm text-text-secondary truncate">{firm.main_office_city || 'N/A'}</p>
                      </div>
                      <div className="hidden sm:block col-span-2 text-right">
                        <p className="text-sm text-text-secondary">{firm.employee_total?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div className="hidden sm:block col-span-1 text-right">
                        <span className="text-text-tertiary">›</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
