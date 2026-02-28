import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ crd: string }> }
) {
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