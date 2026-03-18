import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { getFirmScores } from '@/lib/scores';
import StateDirectoryClient, { type StateFirm } from './StateDirectoryClient';

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
  return `$${Math.round(value).toLocaleString()}`;
}

async function getStateFirms(stateCode: string): Promise<StateFirm[]> {
  const { data } = await supabase
    .from('firmdata_current')
    .select('crd, primary_business_name, main_office_city, aum, employee_total, employee_investment')
    .eq('main_office_state', stateCode.toUpperCase())
    .order('aum', { ascending: false, nullsFirst: false });

  if (!data || data.length === 0) return [];

  const crds = data.map(f => f.crd);
  const { data: firmNames } = await supabase
    .from('firm_names')
    .select('crd, display_name')
    .in('crd', crds);

  const nameMap = new Map(firmNames?.map(n => [n.crd, n.display_name]) || []);

  // Fetch firm scores
  const scoreMap = await getFirmScores(crds);

  return (data || []).map(firm => ({
    ...firm,
    display_name: nameMap.get(firm.crd) || null,
    final_score: scoreMap.get(firm.crd)?.final_score ?? null,
    stars: scoreMap.get(firm.crd)?.stars ?? null
  })) as StateFirm[];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const code = params.slug.toUpperCase();
  const name = STATE_NAMES[code] || params.slug;
  return {
    title: `Financial Advisors in ${name} — Visor Index`,
    description: `Browse and compare SEC-registered investment advisory firms in ${name}. View fees, AUM, Visor scores, and more.`,
  };
}

export default async function StateDirectoryPage({ params }: { params: { slug: string } }) {
  const code = params.slug.toUpperCase();
  const stateName = STATE_NAMES[code];

  if (!stateName) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif", background: '#F6F8F7' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#0C1810', marginBottom: 8 }}>
            State not found
          </h1>
          <p style={{ fontSize: 14, color: '#5A7568', marginBottom: 20 }}>
            The state &quot;{params.slug}&quot; was not recognized.
          </p>
          <Link href="/directory" style={{ fontSize: 13, color: '#1A7A4A', textDecoration: 'none',
            fontWeight: 600, borderBottom: '1px solid #CAD8D0' }}>
            ← Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const firms = await getStateFirms(code);
  const totalAUM = firms.reduce((sum, f) => sum + (f.aum || 0), 0);

  return (
    <StateDirectoryClient
      stateCode={code}
      stateName={stateName}
      firms={firms}
      totalAUM={totalAUM}
    />
  );
}
