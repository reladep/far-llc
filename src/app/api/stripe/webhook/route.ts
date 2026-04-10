import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const obj = event.data.object as unknown as Record<string, any>;
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(obj);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(obj);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(obj);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(obj);
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Stripe moved period fields onto subscription items in recent API versions.
// Fall back to the subscription object for backward compatibility.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPeriod(sub: Record<string, any>): { start: number | null; end: number | null } {
  const item = sub.items?.data?.[0];
  const start = item?.current_period_start ?? sub.current_period_start ?? null;
  const end = item?.current_period_end ?? sub.current_period_end ?? null;
  return { start, end };
}

function tsToIso(seconds: number | null): string | null {
  if (!seconds || typeof seconds !== 'number') return null;
  return new Date(seconds * 1000).toISOString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCheckoutComplete(session: Record<string, any>) {
  const userId = session.metadata?.supabase_user_id;
  const planTier = session.metadata?.plan_tier;
  if (!userId || !planTier) return;

  // Only handle one-time trial payments here.
  // Subscription checkouts are handled by invoice.paid.
  if (session.mode !== 'payment') return;

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  await supabaseAdmin.from('subscriptions').insert({
    user_id: userId,
    stripe_customer_id: session.customer as string,
    stripe_checkout_session_id: session.id,
    plan_tier: 'trial',
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: trialEndsAt.toISOString(),
    trial_ends_at: trialEndsAt.toISOString(),
  });

  await syncUserPlanTier(userId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInvoicePaid(invoice: Record<string, any>) {
  // In newer API versions, subscription moved to parent.subscription_details.subscription
  const subscriptionId =
    (invoice.subscription as string) ||
    (invoice.parent?.subscription_details?.subscription as string) ||
    null;

  if (!subscriptionId) return;

  const sub = await stripe.subscriptions.retrieve(subscriptionId) as Record<string, any>;
  const userId = sub.metadata?.supabase_user_id;
  const planTier = sub.metadata?.plan_tier;
  if (!userId || !planTier) return;

  const { start, end } = getPeriod(sub);

  const { error: upsertError } = await supabaseAdmin.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: subscriptionId,
    plan_tier: planTier,
    status: 'active',
    current_period_start: tsToIso(start),
    current_period_end: tsToIso(end),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' });

  if (upsertError) {
    console.error('[invoice.paid] subscriptions upsert error:', upsertError);
  }

  await syncUserPlanTier(userId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(subscription: Record<string, any>) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) return;

  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'expired',
    unpaid: 'past_due',
  };

  const { start, end } = getPeriod(subscription);

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: statusMap[subscription.status] || subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: tsToIso(start),
      current_period_end: tsToIso(end),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  await syncUserPlanTier(userId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionDeleted(subscription: Record<string, any>) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) return;

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  await syncUserPlanTier(userId);
}

/**
 * Recalculate the user's effective plan_tier and write to user_profiles.
 * Priority: enterprise > consumer > trial (active only) > none
 */
async function syncUserPlanTier(userId: string) {
  const { data: subs } = await supabaseAdmin
    .from('subscriptions')
    .select('plan_tier, status, trial_ends_at')
    .eq('user_id', userId)
    .in('status', ['active', 'past_due']);

  const tierPriority: Record<string, number> = { enterprise: 3, consumer: 2, trial: 1 };
  let effectiveTier = 'none';

  for (const sub of subs || []) {
    // Expire stale trials
    if (sub.plan_tier === 'trial' && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date()) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('plan_tier', 'trial')
        .eq('status', 'active');
      continue;
    }

    const priority = tierPriority[sub.plan_tier] || 0;
    const currentPriority = tierPriority[effectiveTier] || 0;
    if (priority > currentPriority) {
      effectiveTier = sub.plan_tier;
    }
  }

  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .upsert({
      user_id: userId,
      plan_tier: effectiveTier,
      subscription_status: effectiveTier === 'none' ? 'inactive' : 'active',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (profileError) {
    console.error('[syncUserPlanTier] user_profiles upsert error:', profileError);
  }
}
