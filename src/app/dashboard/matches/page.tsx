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

  // Fetch user's match profile
  const { data: profile } = await supabaseAdmin
    .from('user_match_profiles')
    .select('answers, updated_at')
    .eq('user_id', user.id)
    .single();

  return (
    <MatchesPanel
      answers={profile?.answers ?? null}
      updatedAt={profile?.updated_at ?? null}
    />
  );
}
