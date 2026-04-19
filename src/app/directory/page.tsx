import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import DirectoryClient, { type StateCount } from './DirectoryClient';

export const metadata: Metadata = {
  title: 'Advisor Directory by State — Visor Index',
  description: 'Browse SEC-registered investment advisors by state. Find and compare financial advisors near you.',
  alternates: { canonical: '/directory' },
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

async function getStateCounts(): Promise<StateCount[]> {
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

export default async function DirectoryPage() {
  const states = await getStateCounts();
  const totalFirms = states.reduce((sum, s) => sum + s.count, 0);

  return <DirectoryClient states={states} totalFirms={totalFirms} />;
}
