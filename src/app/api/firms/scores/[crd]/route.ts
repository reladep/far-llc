import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ crd: string }> }
) {
  const blocked = checkRateLimit(request, '/api/firms/scores/crd', { limit: 30, windowMs: 60_000 });
  if (blocked) return blocked;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { crd } = await params;
  const crdNumber = parseInt(crd);

  if (isNaN(crdNumber)) {
    return NextResponse.json({ error: 'Invalid CRD' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('firm_scores')
    .select('*')
    .eq('crd', crdNumber)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No record found
      return NextResponse.json({ score: null });
    }
    console.error('Supabase error:', error);
    return NextResponse.json({ error: 'Failed to fetch score' }, { status: 500 });
  }
  
  return NextResponse.json({ score: data });
}