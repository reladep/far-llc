import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/alerts/digest
 *
 * Digest delivery endpoint — called by a daily cron job (~7am UTC).
 * For each user with alert subscriptions and email notifications enabled:
 *   1. Check their digest frequency preference
 *   2. If it's time to send (daily=every day, weekly=Mondays, monthly=1st)
 *   3. Gather undelivered firm_alerts for their subscribed firms
 *   4. Build a grouped summary and log the digest
 *
 * The actual email sending is stubbed — replace with Resend/Postmark/SES.
 */

const CRON_SECRET = process.env.CRON_SECRET;

const ALERT_TYPE_LABELS: Record<string, string> = {
  fee_change: 'Fee Change',
  aum_change: 'AUM Change',
  client_count_change: 'Client Change',
  employee_change: 'Staff Change',
  disclosure: 'Disclosure',
  news: 'News',
  score_change: 'Score Change',
  asset_allocation_change: 'Allocation Change',
};

const SEVERITY_EMOJI: Record<string, string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};

interface DigestFirmGroup {
  crd: number;
  firmName: string;
  alerts: {
    type: string;
    severity: string;
    title: string;
    summary: string;
    detected_at: string;
  }[];
}

interface UserDigest {
  userId: string;
  email: string;
  frequency: string;
  firms: DigestFirmGroup[];
  periodStart: string;
  periodEnd: string;
}

function shouldSendDigest(frequency: string, now: Date): boolean {
  if (frequency === 'none') return false;
  if (frequency === 'daily') return true;
  if (frequency === 'weekly') return now.getUTCDay() === 1; // Monday
  if (frequency === 'monthly') return now.getUTCDate() === 1;
  return false;
}

function getDigestWindow(frequency: string, now: Date): { start: Date; end: Date } {
  const end = new Date(now);
  const start = new Date(now);

  if (frequency === 'daily') {
    start.setUTCDate(start.getUTCDate() - 1);
  } else if (frequency === 'weekly') {
    start.setUTCDate(start.getUTCDate() - 7);
  } else if (frequency === 'monthly') {
    start.setUTCMonth(start.getUTCMonth() - 1);
  }

  return { start, end };
}

function buildDigestHtml(digest: UserDigest): string {
  const totalAlerts = digest.firms.reduce((sum, f) => sum + f.alerts.length, 0);
  const periodLabel = digest.frequency === 'daily' ? 'Daily'
    : digest.frequency === 'weekly' ? 'Weekly' : 'Monthly';

  let html = `
    <div style="font-family:'Inter',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0C1810;">
      <div style="background:#0A1C2A;padding:28px 32px;">
        <div style="font-family:'DM Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#2DBD74;margin-bottom:8px;">
          Visor Index
        </div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:700;color:#fff;">
          Your ${periodLabel} Alert Digest
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:6px;">
          ${totalAlerts} alert${totalAlerts !== 1 ? 's' : ''} across ${digest.firms.length} firm${digest.firms.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div style="padding:24px 32px;background:#F6F8F7;">
  `;

  for (const firm of digest.firms) {
    html += `
      <div style="background:#fff;border:1px solid #CAD8D0;margin-bottom:16px;padding:20px;">
        <div style="font-size:14px;font-weight:600;color:#0C1810;margin-bottom:12px;">
          ${firm.firmName}
          <span style="font-family:'DM Mono',monospace;font-size:10px;color:#5A7568;margin-left:8px;">CRD #${firm.crd}</span>
        </div>
    `;

    for (const alert of firm.alerts) {
      const emoji = SEVERITY_EMOJI[alert.severity] || '';
      const typeLabel = ALERT_TYPE_LABELS[alert.type] || alert.type;
      html += `
        <div style="padding:8px 0;border-top:1px solid #CAD8D0;">
          <div style="font-size:12px;color:#5A7568;margin-bottom:2px;">
            ${emoji} ${typeLabel}
          </div>
          <div style="font-size:13px;font-weight:500;color:#0C1810;">
            ${alert.title}
          </div>
          ${alert.summary ? `<div style="font-size:12px;color:#5A7568;margin-top:2px;">${alert.summary}</div>` : ''}
        </div>
      `;
    }

    html += `
        <div style="margin-top:12px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://visorindex.com'}/firm/${firm.crd}"
             style="font-size:11px;font-weight:600;color:#1A7A4A;text-decoration:none;border:1px solid #CAD8D0;padding:6px 14px;">
            View Firm Profile →
          </a>
        </div>
      </div>
    `;
  }

  html += `
      </div>
      <div style="padding:20px 32px;background:#0A1C2A;font-size:11px;color:rgba(255,255,255,0.3);">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://visorindex.com'}/dashboard/alerts"
           style="color:#2DBD74;text-decoration:none;">Manage alert preferences</a>
        &nbsp;·&nbsp; Visor Index
      </div>
    </div>
  `;

  return html;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const digests: UserDigest[] = [];

  // 1. Get all users who have email-enabled subscriptions
  const { data: emailUsers } = await supabaseAdmin
    .from('alert_subscriptions')
    .select('user_id')
    .eq('notify_email', true);

  if (!emailUsers || emailUsers.length === 0) {
    return NextResponse.json({ message: 'No email subscribers', digests_sent: 0 });
  }

  const uniqueUserIds = Array.from(new Set(emailUsers.map(u => u.user_id)));

  // 2. Get digest preferences for these users
  const { data: prefs } = await supabaseAdmin
    .from('user_alert_preferences')
    .select('user_id, digest_frequency')
    .in('user_id', uniqueUserIds);

  const prefMap = new Map<string, string>();
  prefs?.forEach(p => prefMap.set(p.user_id, p.digest_frequency));

  // 3. Get user emails from auth
  const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  const emailMap = new Map<string, string>();
  authUsers?.forEach(u => { if (u.email) emailMap.set(u.id, u.email); });

  // 4. For each user, check if it's time to send their digest
  for (const userId of uniqueUserIds) {
    const frequency = prefMap.get(userId) || 'weekly'; // default weekly
    if (!shouldSendDigest(frequency, now)) continue;

    const email = emailMap.get(userId);
    if (!email) continue;

    const { start, end } = getDigestWindow(frequency, now);

    // Check if we already sent this digest
    const { data: existing } = await supabaseAdmin
      .from('alert_digest_log')
      .select('id')
      .eq('user_id', userId)
      .eq('digest_type', frequency)
      .eq('period_start', start.toISOString())
      .maybeSingle();

    if (existing) continue; // Already sent

    // Get user's subscriptions
    const { data: subs } = await supabaseAdmin
      .from('alert_subscriptions')
      .select('crd, alert_types')
      .eq('user_id', userId)
      .eq('notify_email', true);

    if (!subs || subs.length === 0) continue;

    // Get alerts in the digest window for subscribed firms
    const subCrds = subs.map(s => s.crd);
    const { data: windowAlerts } = await supabaseAdmin
      .from('firm_alerts')
      .select('id, crd, alert_type, severity, title, summary, detected_at')
      .in('crd', subCrds)
      .gte('detected_at', start.toISOString())
      .lt('detected_at', end.toISOString())
      .order('detected_at', { ascending: false });

    if (!windowAlerts || windowAlerts.length === 0) continue;

    // Filter alerts by user's subscribed types per firm
    const subMap = new Map<number, string[]>();
    subs.forEach(s => subMap.set(s.crd, s.alert_types || []));

    const filteredAlerts = windowAlerts.filter(a =>
      subMap.get(a.crd)?.includes(a.alert_type)
    );

    if (filteredAlerts.length === 0) continue;

    // Get firm names
    const alertCrds = Array.from(new Set(filteredAlerts.map(a => a.crd)));
    const [{ data: firmNames }, { data: displayNames }] = await Promise.all([
      supabaseAdmin.from('firmdata_current').select('crd, legal_name').in('crd', alertCrds),
      supabaseAdmin.from('firm_names').select('crd, display_name').in('crd', alertCrds),
    ]);

    const nameMap = new Map<number, string>();
    firmNames?.forEach(f => nameMap.set(f.crd, f.legal_name));
    displayNames?.forEach(f => { if (f.display_name) nameMap.set(f.crd, f.display_name); });

    // Group alerts by firm
    const firmGroups = new Map<number, DigestFirmGroup>();
    for (const alert of filteredAlerts) {
      if (!firmGroups.has(alert.crd)) {
        firmGroups.set(alert.crd, {
          crd: alert.crd,
          firmName: nameMap.get(alert.crd) || `CRD #${alert.crd}`,
          alerts: [],
        });
      }
      firmGroups.get(alert.crd)!.alerts.push({
        type: alert.alert_type,
        severity: alert.severity,
        title: alert.title,
        summary: alert.summary || '',
        detected_at: alert.detected_at,
      });
    }

    digests.push({
      userId,
      email,
      frequency,
      firms: Array.from(firmGroups.values()),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    });
  }

  // 5. Send digests and log them
  let digestsSent = 0;
  for (const digest of digests) {
    const _html = buildDigestHtml(digest);

    // TODO: Replace with actual email sending (Resend, Postmark, SES)
    // await sendEmail({
    //   to: digest.email,
    //   subject: `Visor Index: ${digest.firms.length} firm${digest.firms.length !== 1 ? 's' : ''} with updates`,
    //   html,
    // });

    console.log(`[Digest] Would send ${digest.frequency} digest to ${digest.email}: ${digest.firms.length} firms, ${digest.firms.reduce((s, f) => s + f.alerts.length, 0)} alerts`);

    // Log the digest
    await supabaseAdmin.from('alert_digest_log').insert({
      user_id: digest.userId,
      digest_type: digest.frequency,
      period_start: digest.periodStart,
      period_end: digest.periodEnd,
      event_count: digest.firms.reduce((s, f) => s + f.alerts.length, 0),
      firm_count: digest.firms.length,
    });

    digestsSent++;
  }

  return NextResponse.json({
    message: 'Digest processing complete',
    users_checked: uniqueUserIds.length,
    digests_sent: digestsSent,
    digests_skipped: uniqueUserIds.length - digestsSent,
  });
}
