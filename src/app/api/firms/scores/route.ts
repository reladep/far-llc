import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
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