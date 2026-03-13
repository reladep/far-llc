import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getFirmScores } from '@/lib/scores';
import SavedFirmsPanel from './SavedFirmsPanel';

export const metadata: Metadata = {
  title: 'Saved Firms - Visor Index',
};

function formatAUM(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

export default async function SavedFirmsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch favorites
  const { data: favorites, error: favError } = await supabaseAdmin
    .from('user_favorites')
    .select('id, crd, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (favError) {
    console.error('Favorites error:', favError);
  }

  const crds = (favorites || []).map(f => f.crd);
  let firms: Record<string, any> = {};

  if (crds.length > 0) {
    const [{ data: firmData }, { data: nameData }] = await Promise.all([
      supabaseAdmin
        .from('firmdata_current')
        .select('crd, primary_business_name, main_office_city, main_office_state, aum')
        .in('crd', crds),
      supabaseAdmin
        .from('firm_names')
        .select('crd, display_name')
        .in('crd', crds),
    ]);
    const nameMap = new Map((nameData || []).map(n => [n.crd, n.display_name]));

    if (firmData) {
      firms = firmData.reduce((acc, f) => {
        acc[f.crd] = { ...f, display_name: nameMap.get(f.crd) || null };
        return acc;
      }, {} as Record<string, any>);
    }
  }

  // Fetch VVS scores for all saved firms
  const scoreMap = crds.length > 0 ? await getFirmScores(crds) : new Map();

  const firmsList = (favorites || []).map(fav => ({
    ...fav,
    firmdata_current: firms[fav.crd] || null,
  }));

  // Build typed array for SavedFirmsPanel
  const firmsForPanel = firmsList.map(fav => {
    const firm = fav.firmdata_current;
    const scoreEntry = (scoreMap.get(fav.crd) as { final_score?: number } | undefined);
    return {
      crd: fav.crd,
      name: firm?.display_name || firm?.primary_business_name || `CRD #${fav.crd}`,
      city: (firm?.main_office_city as string | null) ?? null,
      state: (firm?.main_office_state as string | null) ?? null,
      aum: formatAUM(firm?.aum ?? null),
      vvs: scoreEntry?.final_score != null ? Math.round(scoreEntry.final_score) : null,
      savedAt: new Date(fav.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
      savedTs: new Date(fav.created_at).getTime(),
    };
  });

  return <SavedFirmsPanel firms={firmsForPanel} />;
}
