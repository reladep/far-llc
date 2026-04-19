import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/user/alerts/feed
 *
 * Paginated alert feed for all firms a user is subscribed to.
 * Supports cursor-based pagination and firm filtering.
 *
 * Query params:
 *   limit    — max results (default 20, max 100)
 *   cursor   — ISO timestamp cursor (detected_at of last item)
 *   crd      — filter to a single firm
 *   type     — filter by alert_type (e.g. fee_change, news)
 *   severity — filter by severity (high, medium, low)
 */
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 2000);
  const cursor = url.searchParams.get('cursor');
  const crdFilter = url.searchParams.get('crd');
  const typeFilter = url.searchParams.get('type');
  const severityFilter = url.searchParams.get('severity');

  // Get user's subscribed CRDs
  const { data: subs } = await supabaseAdmin
    .from('alert_subscriptions')
    .select('crd')
    .eq('user_id', user.id);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ alerts: [], has_more: false });
  }

  let crds = subs.map(s => s.crd);

  // Apply firm filter if provided
  if (crdFilter) {
    const filterCrd = parseInt(crdFilter);
    if (!crds.includes(filterCrd)) {
      return NextResponse.json({ alerts: [], has_more: false });
    }
    crds = [filterCrd];
  }

  // Build query
  let query = supabaseAdmin
    .from('firm_alerts')
    .select('id, crd, alert_type, severity, title, summary, detected_at')
    .in('crd', crds)
    .order('detected_at', { ascending: false })
    .limit((limit + 1) * 10); // fetch extra for dedup headroom (duplicates can be heavy)

  if (cursor) {
    query = query.lt('detected_at', cursor);
  }
  if (typeFilter) {
    query = query.eq('alert_type', typeFilter);
  }
  if (severityFilter) {
    query = query.eq('severity', severityFilter);
  }

  const { data: alerts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Dedup by crd + alert_type + normalized title — keep the most recent
  const seen = new Set<string>();
  const deduped = (alerts || []).filter(a => {
    const key = `${a.crd}:${a.alert_type}:${a.title.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const hasMore = deduped.length > limit;
  const page = deduped.slice(0, limit);

  // Resolve firm names
  const alertCrds = Array.from(new Set(page.map(a => a.crd)));
  const { data: names } = await supabaseAdmin
    .from('firm_names')
    .select('crd, display_name')
    .in('crd', alertCrds.length > 0 ? alertCrds : [0]);

  const nameMap = new Map((names || []).map((n: any) => [n.crd, n.display_name as string]));

  const result = page.map(a => ({
    id: a.id,
    crd: a.crd,
    firmName: nameMap.get(a.crd) || `CRD #${a.crd}`,
    alertType: a.alert_type,
    severity: a.severity,
    title: a.title,
    summary: a.summary || '',
    detectedAt: a.detected_at,
  }));

  return NextResponse.json({
    alerts: result,
    has_more: hasMore,
    next_cursor: hasMore && page.length > 0 ? page[page.length - 1].detected_at : null,
  });
}
