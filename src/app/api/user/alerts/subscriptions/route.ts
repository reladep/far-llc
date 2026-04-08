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

const TIER_LIMITS: Record<string, number> = {
  trial: 0,
  consumer: 25,
  enterprise: 100,
};
const DEFAULT_LIMIT = 0;

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

  // Check subscription limit (skip if this is an update to an existing sub)
  const { count: existingCount } = await supabaseAdmin
    .from('alert_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('plan_tier')
    .eq('user_id', user.id)
    .maybeSingle();

  const tier = (profile?.plan_tier as string) || 'none';
  const limit = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || DEFAULT_LIMIT;

  if (limit === 0) {
    return NextResponse.json(
      { error: 'Alert subscriptions require a paid plan. Upgrade to Consumer for 25 firm alerts.' },
      { status: 403 },
    );
  }

  // Allow upsert if user already has this CRD subscribed (updating preferences)
  const { data: existingSub } = await supabaseAdmin
    .from('alert_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('crd', crd)
    .maybeSingle();

  if (!existingSub && (existingCount ?? 0) >= limit) {
    return NextResponse.json(
      { error: `Subscription limit reached (${limit} firms). Upgrade your plan for more.` },
      { status: 403 },
    );
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
