import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { firms } = body;

  if (!Array.isArray(firms) || firms.length === 0) {
    return NextResponse.json({ error: 'Firms array is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('user_match_profiles')
    .update({
      results: firms,
      results_saved_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
