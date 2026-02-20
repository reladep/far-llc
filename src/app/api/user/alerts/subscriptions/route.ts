import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/user/alerts/subscriptions — list user's alert subscriptions
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('alert_subscriptions')
    .select('id, crd, alert_types, notify_email, notify_in_app, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscriptions: data });
}

// POST /api/user/alerts/subscriptions — subscribe to alerts for a firm
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { crd, alert_types, notify_email, notify_in_app } = body;

  if (!crd) {
    return NextResponse.json({ error: 'CRD is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('alert_subscriptions')
    .upsert({
      user_id: user.id,
      crd,
      alert_types: alert_types || ['fee_change', 'aum_change', 'disclosure', 'news'],
      notify_email: notify_email ?? true,
      notify_in_app: notify_in_app ?? true,
    }, { onConflict: 'user_id,crd' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscription: data }, { status: 201 });
}

// DELETE /api/user/alerts/subscriptions — unsubscribe
export async function DELETE(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const crd = url.searchParams.get('crd');

  if (!crd) {
    return NextResponse.json({ error: 'CRD is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('alert_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('crd', parseInt(crd));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
