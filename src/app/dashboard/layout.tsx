import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import DashboardShell from './DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Sidebar badge counts + plan tier (parallel)
  const [{ count: savedCount }, { count: alertCount }, { count: matchCount }, { data: profile }] = await Promise.all([
    supabaseAdmin
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabaseAdmin
      .from('alert_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabaseAdmin
      .from('user_match_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabaseAdmin
      .from('user_profiles')
      .select('plan_tier')
      .eq('user_id', user.id)
      .single(),
  ]);

  const planTier = profile?.plan_tier || 'none';

  const PLAN_LABELS: Record<string, string> = {
    none: 'No Plan',
    trial: 'Trial Access',
    consumer: 'Consumer',
    enterprise: 'Enterprise',
  };
  const planLabel = PLAN_LABELS[planTier] || 'Free';

  return (
    <DashboardShell
      userEmail={user.email ?? ''}
      savedCount={savedCount ?? 0}
      alertCount={alertCount ?? 0}
      matchCount={matchCount ?? 0}
      planLabel={planLabel}
    >
      {children}
    </DashboardShell>
  );
}
