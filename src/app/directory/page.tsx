import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, Badge } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Advisor Directory by State — FAR',
  description: 'Browse SEC-registered investment advisors by state. Find and compare financial advisors near you.',
};

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

async function getStateCounts() {
  const { data } = await supabase
    .from('firmdata_current')
    .select('main_office_state');

  if (!data) return [];

  const counts: Record<string, number> = {};
  data.forEach((d) => {
    const st = d.main_office_state;
    if (st && STATE_NAMES[st]) {
      counts[st] = (counts[st] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([code, count]) => ({ code, name: STATE_NAMES[code], count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return n.toLocaleString();
}

export default async function DirectoryPage() {
  const states = await getStateCounts();
  const totalFirms = states.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-bg-primary border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20 text-center">
          <Badge className="mb-4">Directory</Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
            Browse Advisors by State
          </h1>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            Explore {totalFirms.toLocaleString()} SEC-registered investment advisory firms across {states.length} states.
          </p>
        </div>
      </section>

      {/* State Grid */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {states.map((state) => (
            <Link key={state.code} href={`/directory/${state.code.toLowerCase()}`}>
              <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{state.name}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{state.count} firm{state.count !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-lg text-text-tertiary">›</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
