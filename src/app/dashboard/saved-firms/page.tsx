import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import RemoveFirmButton from '@/components/firms/RemoveFirmButton';

export const metadata: Metadata = {
  title: 'Saved Firms - FAR',
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

  // First get the favorites
  const { data: favorites, error: favError } = await supabaseAdmin
    .from('user_favorites')
    .select('id, crd, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (favError) {
    console.error('Favorites error:', favError);
  }

  // Then fetch the firm data separately
  const crds = (favorites || []).map(f => f.crd);
  let firms: Record<string, any> = {};
  
  if (crds.length > 0) {
    const { data: firmData } = await supabaseAdmin
      .from('firmdata_current')
      .select('crd, primary_business_name, main_office_city, main_office_state, aum')
      .in('crd', crds);
    
    if (firmData) {
      firms = firmData.reduce((acc, f) => { acc[f.crd] = f; return acc; }, {} as Record<string, any>);
    }
  }

  const firmsList = (favorites || []).map(fav => ({
    ...fav,
    firmdata_current: firms[fav.crd] || null
  }));

  const firmsToDisplay = firmsList || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Saved Firms</h1>
      <p className="mt-1 text-slate-500">Firms you&apos;ve bookmarked for later.</p>

      {firmsToDisplay.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-slate-500">No saved firms yet. Browse advisors to save firms you&apos;re interested in.</p>
          <Link href="/search" className="mt-4 inline-block text-green-600 hover:underline font-medium">
            Browse Firms →
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {firmsToDisplay.map((fav: any) => {
            const firm = fav.firmdata_current;
            const name = firm?.primary_business_name || `CRD #${fav.crd}`;
            const location = [firm?.main_office_city, firm?.main_office_state].filter(Boolean).join(', ');
            const savedDate = new Date(fav.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            });

            return (
              <Card key={fav.id}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <Link href={`/firm/${fav.crd}`} className="text-lg font-semibold text-slate-900 hover:text-green-600 transition-colors">
                        {name}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        {location && <span>{location}</span>}
                        {firm?.aum && <span>AUM: {formatAUM(firm.aum)}</span>}
                        <span>Saved {savedDate}</span>
                      </div>
                    </div>
                    <RemoveFirmButton crd={fav.crd} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
