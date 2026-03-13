import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import AlertsPanel from './AlertsPanel';

export const metadata: Metadata = {
  title: 'Alerts - Visor Index',
};

function formatAUM(value: number | null): string {
  if (!value) return '';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B AUM`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M AUM`;
  return `$${value.toLocaleString()} AUM`;
}

export interface AlertSub {
  id: string;
  crd: number;
  name: string;
  meta: string;
  notifyEmail: boolean;
  notifyInApp: boolean;
  alertTypes: string[];
}

export default async function AlertsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch alert subscriptions
  const { data: subs } = await supabaseAdmin
    .from('alert_subscriptions')
    .select('id, crd, alert_types, notify_email, notify_in_app, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const crds = (subs || []).map((s: any) => s.crd);

  // Join firm names + meta
  const [{ data: firmData }, { data: nameData }] = crds.length > 0
    ? await Promise.all([
        supabaseAdmin
          .from('firmdata_current')
          .select('crd, main_office_city, main_office_state, aum')
          .in('crd', crds),
        supabaseAdmin
          .from('firm_names')
          .select('crd, display_name')
          .in('crd', crds),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];

  const nameMap = new Map((nameData || []).map((n: any) => [n.crd, n.display_name as string]));
  const firmMap = new Map((firmData || []).map((f: any) => [f.crd, f]));

  const alertSubs: AlertSub[] = (subs || []).map((s: any) => {
    const firm = firmMap.get(s.crd);
    const displayName = nameMap.get(s.crd) || `CRD #${s.crd}`;
    const location = firm
      ? [firm.main_office_city, firm.main_office_state].filter(Boolean).join(', ')
      : '';
    const aumStr = firm ? formatAUM(firm.aum) : '';
    const meta = [location, aumStr].filter(Boolean).join(' · ');

    return {
      id: s.id,
      crd: s.crd,
      name: displayName,
      meta,
      notifyEmail: s.notify_email,
      notifyInApp: s.notify_in_app,
      alertTypes: s.alert_types || [],
    };
  });

  return <AlertsPanel subs={alertSubs} />;
}
