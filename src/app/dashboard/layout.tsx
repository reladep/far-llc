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

  // Sidebar badge counts (parallel)
  const [{ count: savedCount }, { count: alertCount }] = await Promise.all([
    supabaseAdmin
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabaseAdmin
      .from('alert_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  return (
    <DashboardShell
      userEmail={user.email ?? ''}
      savedCount={savedCount ?? 0}
      alertCount={alertCount ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
