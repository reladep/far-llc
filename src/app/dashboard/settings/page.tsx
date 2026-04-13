import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import SettingsPanel from './SettingsPanel';

export const metadata: Metadata = {
  title: 'Settings - Visor Index',
};

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('location_city, location_state, age, net_worth_range, occupation, has_existing_advisor, max_fee_pct, services_wanted, onboarding_completed')
    .eq('user_id', user.id)
    .single();

  const { data: alertPrefs } = await supabaseAdmin
    .from('user_alert_preferences')
    .select('digest_frequency, digest_hour')
    .eq('user_id', user.id)
    .single();

  return (
    <SettingsPanel
      email={user.email ?? ''}
      createdAt={user.created_at}
      profile={profile}
      alertPrefs={alertPrefs}
    />
  );
}
