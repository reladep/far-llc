import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import MatchesPanel from './MatchesPanel';

export const metadata: Metadata = {
  title: 'Matches - Visor Index',
};

export default async function MatchesPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user's match profile with saved results
  // Try with results columns first; fall back if migration hasn't run yet
  let profile: Record<string, unknown> | null = null;
  const { data: full, error } = await supabaseAdmin
    .from('user_match_profiles')
    .select('answers, updated_at, results, results_saved_at')
    .eq('user_id', user.id)
    .single();

  if (!error) {
    profile = full;
  } else {
    // results columns may not exist yet — fetch without them
    const { data: basic } = await supabaseAdmin
      .from('user_match_profiles')
      .select('answers, updated_at')
      .eq('user_id', user.id)
      .single();
    profile = basic;
  }

  return (
    <MatchesPanel
      answers={(profile?.answers ?? null) as never}
      updatedAt={(profile?.updated_at as string) ?? null}
      savedResults={(profile?.results ?? null) as never}
      resultsSavedAt={(profile?.results_saved_at as string) ?? null}
    />
  );
}
