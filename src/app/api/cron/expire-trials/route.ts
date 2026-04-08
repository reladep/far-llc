import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find active trials past their expiry
  const { data: expiredTrials } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('plan_tier', 'trial')
    .eq('status', 'active')
    .lt('trial_ends_at', new Date().toISOString());

  if (!expiredTrials || expiredTrials.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  // Batch expire
  const trialIds = expiredTrials.map(t => t.id);
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .in('id', trialIds);

  // Recalculate plan_tier for each affected user
  const userIds = Array.from(new Set(expiredTrials.map(t => t.user_id)));
  for (const userId of userIds) {
    const { data: activeSubs } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_tier')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (!activeSubs || activeSubs.length === 0) {
      await supabaseAdmin
        .from('user_profiles')
        .update({
          plan_tier: 'none',
          subscription_status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }
  }

  return NextResponse.json({ expired: expiredTrials.length });
}
