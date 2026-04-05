import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly', 'none'];

// GET /api/user/alerts/preferences — get user's digest preferences
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('user_alert_preferences')
    .select('digest_frequency')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    digest_frequency: data?.digest_frequency || 'weekly',
  });
}

// POST /api/user/alerts/preferences — update digest frequency
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { digest_frequency } = body;

  if (!digest_frequency || !VALID_FREQUENCIES.includes(digest_frequency)) {
    return NextResponse.json(
      { error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}` },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from('user_alert_preferences')
    .upsert({
      user_id: user.id,
      digest_frequency,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ digest_frequency });
}
