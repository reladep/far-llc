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
  if (value >= 1000) return `$${Math.round(value / 1000).toLocaleString()}K AUM`;
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

export interface RecentAlert {
  id: string;
  crd: number;
  firmName: string;
  alertType: string;
  severity: string;
  title: string;
  summary: string;
  detectedAt: string;
}

export interface WatchedFirm {
  crd: number;
  name: string;
}

export default async function AlertsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch subscriptions, digest prefs, and recent alerts in parallel
  const [
    { data: subs },
    { data: prefs },
  ] = await Promise.all([
    supabaseAdmin
      .from('alert_subscriptions')
      .select('id, crd, alert_types, notify_email, notify_in_app, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('user_alert_preferences')
      .select('digest_frequency')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const digestFrequency = prefs?.digest_frequency || 'weekly';
  const crds = (subs || []).map((s: any) => s.crd);

  // Join firm names + meta + recent alerts
  let firmData: any[] = [];
  let nameData: any[] = [];
  let recentAlerts: RecentAlert[] = [];

  if (crds.length > 0) {
    const [
      { data: firms },
      { data: names },
      { data: alerts },
    ] = await Promise.all([
      supabaseAdmin
        .from('firmdata_current')
        .select('crd, main_office_city, main_office_state, aum')
        .in('crd', crds),
      supabaseAdmin
        .from('firm_names')
        .select('crd, display_name')
        .in('crd', crds),
      supabaseAdmin
        .from('firm_alerts')
        .select('id, crd, alert_type, severity, title, summary, detected_at')
        .in('crd', crds)
        .order('detected_at', { ascending: false })
        .limit(60), // fetch extra for dedup headroom
    ]);

    firmData = firms || [];
    nameData = names || [];

    const nameMap = new Map((nameData).map((n: any) => [n.crd, n.display_name as string]));

    // Dedup by crd + alert_type + normalized title
    const seen = new Set<string>();
    recentAlerts = (alerts || [])
      .filter((a: any) => {
        const key = `${a.crd}:${a.alert_type}:${a.title.toLowerCase().trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 20)
      .map((a: any) => ({
        id: a.id,
        crd: a.crd,
        firmName: nameMap.get(a.crd) || `CRD #${a.crd}`,
        alertType: a.alert_type,
        severity: a.severity,
        title: a.title,
        summary: a.summary || '',
        detectedAt: a.detected_at,
      }));
  }

  const nameMap = new Map((nameData).map((n: any) => [n.crd, n.display_name as string]));
  const firmMap = new Map((firmData).map((f: any) => [f.crd, f]));

  const watchedFirms: { crd: number; name: string }[] = crds.map(crd => ({
    crd,
    name: nameMap.get(crd) || `CRD #${crd}`,
  }));

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

  return (
    <AlertsPanel
      subs={alertSubs}
      digestFrequency={digestFrequency}
      recentAlerts={recentAlerts}
      watchedFirms={watchedFirms}
    />
  );
}
