import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const blocked = checkRateLimit(request, '/api/firms/scores', { limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const crdsParam = searchParams.get('crds');
  
  if (!crdsParam) {
    return NextResponse.json({ error: 'CRDs parameter required' }, { status: 400 });
  }
  
  const crds = crdsParam.split(',').map(crd => parseInt(crd)).filter(crd => !isNaN(crd));
  
  if (crds.length === 0) {
    return NextResponse.json({ error: 'Valid CRDs required' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('firm_scores')
    .select('*')
    .in('crd', crds);
  
  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
  
  return NextResponse.json({ scores: data });
}