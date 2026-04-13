import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';

// GET /api/alerts/firm/[crd] — alerts for a firm (authenticated)
export async function GET(
  request: NextRequest,
  { params }: { params: { crd: string } }
) {
  const blocked = checkRateLimit(request, '/api/alerts/firm', { limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const crd = parseInt(params.crd);
  if (isNaN(crd)) {
    return NextResponse.json({ error: 'Invalid CRD' }, { status: 400 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const type = url.searchParams.get('type'); // optional filter

  let query = supabase
    .from('firm_alerts')
    .select('id, crd, alert_type, severity, title, summary, detail, detected_at, source')
    .eq('crd', crd)
    .order('detected_at', { ascending: false });

  if (type) {
    query = query.eq('alert_type', type);
  }

  // Fetch extra to account for duplicates we'll filter out
  query = query.limit(limit * 3);
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Dedup by alert_type + normalized title — keep the most recent
  const seen = new Set<string>();
  const deduped = (data || []).filter(alert => {
    const key = `${alert.alert_type}:${alert.title.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);

  return NextResponse.json({ alerts: deduped });
}
