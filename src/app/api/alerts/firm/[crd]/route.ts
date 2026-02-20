import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/alerts/firm/[crd] — public alerts for a firm
export async function GET(
  request: NextRequest,
  { params }: { params: { crd: string } }
) {
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
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq('alert_type', type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alerts: data });
}
