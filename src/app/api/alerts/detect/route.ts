import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/alerts/detect
 *
 * Event detection endpoint — meant to be called by a daily cron job.
 * Diffs current firm data against the last snapshot for all firms
 * that have at least one subscriber, creates firm_alerts for changes,
 * and takes a new snapshot.
 *
 * Protected by a secret key in the Authorization header.
 */

const CRON_SECRET = process.env.CRON_SECRET;

// Thresholds for triggering alerts
const SCORE_CHANGE_THRESHOLD = 5;     // absolute points
const AUM_CHANGE_THRESHOLD = 0.05;    // 5% relative change
const EMPLOYEE_CHANGE_THRESHOLD = 0.1; // 10% relative change

interface FirmCurrent {
  crd: number;
  aum: number | null;
  total_accounts: number | null;
  employee_total: number | null;
  discretionary_aum: number | null;
  non_discretionary_aum: number | null;
  // Disclosure flags
  disclosure_firm_suspension_revoked: string | null;
  disclosure_firm_sec_cftc_violations: string | null;
  disclosure_firm_sec_cftc_monetary_penalty: string | null;
  disclosure_firm_felony_conviction: string | null;
  disclosure_firm_court_ruling_violation: string | null;
  disclosure_firm_current_regulatory_proceedings: string | null;
}

interface Snapshot {
  crd: number;
  aum: number | null;
  total_accounts: number | null;
  total_employees: number | null;
  visor_score: number | null;
  discretionary_aum: number | null;
  non_discretionary_aum: number | null;
  disclosure_count: number | null;
}

interface AlertInsert {
  crd: number;
  alert_type: string;
  severity: string;
  title: string;
  summary: string;
  detail: Record<string, unknown>;
  source: string;
}

function pctChange(oldVal: number, newVal: number): number {
  if (oldVal === 0) return newVal > 0 ? 1 : 0;
  return (newVal - oldVal) / Math.abs(oldVal);
}

function formatAUM(val: number): string {
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${Math.round(val / 1000)}K`;
}

const DISCLOSURE_FIELDS = [
  'disclosure_firm_suspension_revoked',
  'disclosure_firm_sec_cftc_violations',
  'disclosure_firm_sec_cftc_monetary_penalty',
  'disclosure_firm_felony_conviction',
  'disclosure_firm_court_ruling_violation',
  'disclosure_firm_current_regulatory_proceedings',
] as const;

function countDisclosures(firm: FirmCurrent): number {
  return DISCLOSURE_FIELDS.filter(f => firm[f] && firm[f] !== 'N').length;
}

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const alerts: AlertInsert[] = [];
  const snapshotInserts: Record<string, unknown>[] = [];

  // 1. Get all CRDs that have at least one subscriber
  const { data: subscribedCrds } = await supabaseAdmin
    .from('alert_subscriptions')
    .select('crd')
    .limit(5000);

  if (!subscribedCrds || subscribedCrds.length === 0) {
    return NextResponse.json({ message: 'No subscriptions to process', alerts_created: 0 });
  }

  const uniqueCrds = [...new Set(subscribedCrds.map(s => s.crd))];

  // 2. Fetch current firm data for all subscribed CRDs
  const { data: currentFirms } = await supabaseAdmin
    .from('firmdata_current')
    .select('crd, aum, total_accounts, employee_total, discretionary_aum, non_discretionary_aum, disclosure_firm_suspension_revoked, disclosure_firm_sec_cftc_violations, disclosure_firm_sec_cftc_monetary_penalty, disclosure_firm_felony_conviction, disclosure_firm_court_ruling_violation, disclosure_firm_current_regulatory_proceedings')
    .in('crd', uniqueCrds);

  // 3. Fetch current scores
  const { data: currentScores } = await supabaseAdmin
    .from('firm_scores')
    .select('crd, final_score')
    .in('crd', uniqueCrds);

  // 4. Fetch most recent snapshot for each CRD
  const { data: lastSnapshots } = await supabaseAdmin
    .from('firm_snapshots')
    .select('crd, aum, total_accounts, total_employees, visor_score, discretionary_aum, non_discretionary_aum, disclosure_count')
    .in('crd', uniqueCrds)
    .order('snapshot_date', { ascending: false });

  // Build lookup maps
  const firmMap = new Map<number, FirmCurrent>();
  currentFirms?.forEach(f => firmMap.set(f.crd, f));

  const scoreMap = new Map<number, number>();
  currentScores?.forEach(s => { if (s.final_score != null) scoreMap.set(s.crd, s.final_score); });

  // Only keep the most recent snapshot per CRD
  const snapMap = new Map<number, Snapshot>();
  lastSnapshots?.forEach(s => { if (!snapMap.has(s.crd)) snapMap.set(s.crd, s); });

  // 5. Detect news articles ingested since last run (last 25 hours to overlap)
  const newsCutoff = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const { data: recentNews } = await supabaseAdmin
    .from('news_articles')
    .select('id, crd, title, source, snippet')
    .in('crd', uniqueCrds)
    .gte('ingested_at', newsCutoff);

  // Create news alerts (dedup by normalized title per CRD)
  if (recentNews && recentNews.length > 0) {
    // Check for existing news alerts in the last 48h to avoid duplicates
    const newsCrds = [...new Set(recentNews.map(a => a.crd))];
    const dupCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: existingNewsAlerts } = await supabaseAdmin
      .from('firm_alerts')
      .select('crd, title')
      .in('crd', newsCrds)
      .eq('alert_type', 'news')
      .gte('detected_at', dupCutoff);

    const existingKeys = new Set(
      (existingNewsAlerts || []).map(a => `${a.crd}:${a.title.toLowerCase().trim()}`)
    );

    // Also dedup within the current batch
    const batchKeys = new Set<string>();
    for (const article of recentNews) {
      const key = `${article.crd}:${article.title.toLowerCase().trim()}`;
      if (existingKeys.has(key) || batchKeys.has(key)) continue;
      batchKeys.add(key);

      alerts.push({
        crd: article.crd,
        alert_type: 'news',
        severity: 'low',
        title: article.title,
        summary: article.snippet || `New article from ${article.source || 'news source'}`,
        detail: { news_article_id: article.id, source: article.source },
        source: 'news_scraper',
      });
    }
  }

  // 6. Diff each firm against its last snapshot
  for (const crd of uniqueCrds) {
    const firm = firmMap.get(crd);
    if (!firm) continue;

    const snap = snapMap.get(crd);
    const score = scoreMap.get(crd) ?? null;
    const disclosureCount = countDisclosures(firm);

    if (snap) {
      // AUM change
      if (firm.aum != null && snap.aum != null && snap.aum > 0) {
        const change = pctChange(snap.aum, firm.aum);
        if (Math.abs(change) >= AUM_CHANGE_THRESHOLD) {
          const direction = change > 0 ? 'increased' : 'decreased';
          const pct = Math.abs(Math.round(change * 100));
          alerts.push({
            crd,
            alert_type: 'aum_change',
            severity: pct >= 20 ? 'high' : pct >= 10 ? 'medium' : 'low',
            title: `AUM ${direction} ${pct}%`,
            summary: `AUM ${direction} from ${formatAUM(snap.aum)} to ${formatAUM(firm.aum)} (${pct}% change)`,
            detail: { old_value: snap.aum, new_value: firm.aum, pct_change: Math.round(change * 10000) / 100 },
            source: 'adv_diff',
          });
        }
      }

      // Employee change
      if (firm.employee_total != null && snap.total_employees != null && snap.total_employees > 0) {
        const change = pctChange(snap.total_employees, firm.employee_total);
        if (Math.abs(change) >= EMPLOYEE_CHANGE_THRESHOLD) {
          const direction = change > 0 ? 'increased' : 'decreased';
          const pct = Math.abs(Math.round(change * 100));
          alerts.push({
            crd,
            alert_type: 'employee_change',
            severity: pct >= 25 ? 'high' : 'medium',
            title: `Staff ${direction} ${pct}%`,
            summary: `Employee count ${direction} from ${snap.total_employees} to ${firm.employee_total}`,
            detail: { old_value: snap.total_employees, new_value: firm.employee_total, pct_change: Math.round(change * 10000) / 100 },
            source: 'adv_diff',
          });
        }
      }

      // Client count change
      if (firm.total_accounts != null && snap.total_accounts != null && snap.total_accounts > 0) {
        const change = pctChange(snap.total_accounts, firm.total_accounts);
        if (Math.abs(change) >= 0.1) {
          const direction = change > 0 ? 'grew' : 'declined';
          const pct = Math.abs(Math.round(change * 100));
          alerts.push({
            crd,
            alert_type: 'client_count_change',
            severity: pct >= 20 ? 'high' : 'medium',
            title: `Client count ${direction} ${pct}%`,
            summary: `Total accounts ${direction} from ${snap.total_accounts.toLocaleString()} to ${firm.total_accounts.toLocaleString()}`,
            detail: { old_value: snap.total_accounts, new_value: firm.total_accounts, pct_change: Math.round(change * 10000) / 100 },
            source: 'adv_diff',
          });
        }
      }

      // Score change
      if (score != null && snap.visor_score != null) {
        const delta = score - snap.visor_score;
        if (Math.abs(delta) >= SCORE_CHANGE_THRESHOLD) {
          const direction = delta > 0 ? 'improved' : 'declined';
          alerts.push({
            crd,
            alert_type: 'score_change',
            severity: Math.abs(delta) >= 15 ? 'high' : 'medium',
            title: `Visor Index Score ${direction} by ${Math.abs(Math.round(delta))} points`,
            summary: `Score moved from ${Math.round(snap.visor_score)} to ${Math.round(score)}`,
            detail: { old_value: snap.visor_score, new_value: score, delta: Math.round(delta) },
            source: 'score_recalc',
          });
        }
      }

      // Disclosure changes
      if (snap.disclosure_count != null && disclosureCount > snap.disclosure_count) {
        const newCount = disclosureCount - snap.disclosure_count;
        alerts.push({
          crd,
          alert_type: 'disclosure',
          severity: 'high',
          title: `${newCount} new disclosure${newCount > 1 ? 's' : ''} reported`,
          summary: `Firm now has ${disclosureCount} active disclosure flags (was ${snap.disclosure_count})`,
          detail: { old_count: snap.disclosure_count, new_count: disclosureCount },
          source: 'adv_diff',
        });
      }
    }

    // Build new snapshot
    snapshotInserts.push({
      crd,
      snapshot_date: new Date().toISOString().split('T')[0],
      aum: firm.aum,
      total_accounts: firm.total_accounts,
      total_employees: firm.employee_total,
      visor_score: score,
      discretionary_aum: firm.discretionary_aum,
      non_discretionary_aum: firm.non_discretionary_aum,
      disclosure_count: disclosureCount,
    });
  }

  // 7. Insert alerts (skip duplicates via dedup check)
  let alertsCreated = 0;
  if (alerts.length > 0) {
    // Batch insert alerts
    const { data: inserted, error: alertErr } = await supabaseAdmin
      .from('firm_alerts')
      .insert(alerts)
      .select('id, crd, alert_type');

    if (alertErr) {
      console.error('Alert insert error:', alertErr);
    } else {
      alertsCreated = inserted?.length ?? 0;

      // 8. Create user_notifications for each subscriber
      if (inserted && inserted.length > 0) {
        const notifications: { user_id: string; alert_id: string; channel: string }[] = [];

        // Get all subscriptions grouped by CRD
        const alertCrds = [...new Set(inserted.map(a => a.crd))];
        const { data: subs } = await supabaseAdmin
          .from('alert_subscriptions')
          .select('user_id, crd, alert_types, notify_email, notify_in_app')
          .in('crd', alertCrds);

        for (const alert of inserted) {
          const matchingSubs = subs?.filter(s =>
            s.crd === alert.crd &&
            s.alert_types?.includes(alert.alert_type)
          ) ?? [];

          for (const sub of matchingSubs) {
            if (sub.notify_in_app) {
              notifications.push({ user_id: sub.user_id, alert_id: alert.id, channel: 'in_app' });
            }
            // Email notifications are handled by the digest system, not here
          }
        }

        if (notifications.length > 0) {
          const { error: notifErr } = await supabaseAdmin
            .from('user_notifications')
            .upsert(notifications, { onConflict: 'user_id,alert_id,channel', ignoreDuplicates: true });

          if (notifErr) {
            console.error('Notification insert error:', notifErr);
          }
        }
      }
    }
  }

  // 9. Upsert new snapshots
  if (snapshotInserts.length > 0) {
    const { error: snapErr } = await supabaseAdmin
      .from('firm_snapshots')
      .upsert(snapshotInserts, { onConflict: 'crd,snapshot_date' });

    if (snapErr) {
      console.error('Snapshot upsert error:', snapErr);
    }
  }

  return NextResponse.json({
    message: 'Detection complete',
    firms_checked: uniqueCrds.length,
    alerts_created: alertsCreated,
    snapshots_updated: snapshotInserts.length,
    news_alerts: recentNews?.length ?? 0,
  });
}
