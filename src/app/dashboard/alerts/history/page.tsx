import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import AlertHistoryPanel from './AlertHistoryPanel';

export const metadata: Metadata = {
  title: 'Alert History - Visor Index',
};

export interface WatchedFirm {
  crd: number;
  name: string;
}

export default async function AlertHistoryPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get subscribed firms for filter options
  const { data: subs } = await supabaseAdmin
    .from('alert_subscriptions')
    .select('crd')
    .eq('user_id', user.id);

  const crds = (subs || []).map((s: any) => s.crd);

  let watchedFirms: WatchedFirm[] = [];
  if (crds.length > 0) {
    const { data: names } = await supabaseAdmin
      .from('firm_names')
      .select('crd, display_name')
      .in('crd', crds);

    const nameMap = new Map((names || []).map((n: any) => [n.crd, n.display_name as string]));
    watchedFirms = crds.map(crd => ({
      crd,
      name: nameMap.get(crd) || `CRD #${crd}`,
    }));
  }

  return <AlertHistoryPanel watchedFirms={watchedFirms} />;
}
