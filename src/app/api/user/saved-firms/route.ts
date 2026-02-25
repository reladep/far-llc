import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .select('id, crd, notes, created_at, firmdata_current(primary_business_name, main_office_city, main_office_state, aum)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  console.log('[SAVE FIRM] ENV CHECK:', {
    URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0,20),
    KEY_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    KEY_VALUE: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0,30)
  });
  
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { crd } = body;

  if (!crd) {
    return NextResponse.json({ error: 'CRD is required' }, { status: 400 });
  }

  // Use admin client to bypass RLS
  console.log('[SAVE FIRM] Inserting:', { user_id: user.id, crd: Number(crd) });
  
  const { data, error } = await supabaseAdmin
    .from('user_favorites')
    .insert({ user_id: user.id, crd: Number(crd) })
    .select()
    .single();

  if (error) {
    console.error('[SAVE FIRM] Error:', JSON.stringify(error));
    return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 });
  }
  
  console.log('[SAVE FIRM] Success:', data);

  return NextResponse.json(data);
}
