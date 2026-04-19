import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';

/**
 * Stripe Checkout success landing page.
 *
 * This page is hit immediately after a successful payment, BEFORE the Stripe
 * webhook has necessarily finished updating the DB. We avoid the race condition
 * by pulling the session directly from Stripe, verifying it's paid, and
 * updating the user_profiles.plan_tier synchronously before redirecting.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect('/dashboard');
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  try {
    // Fetch the session from Stripe — source of truth
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription', 'line_items'],
    });

    // Confirm this session belongs to the current user
    const sessionUserId = session.metadata?.supabase_user_id;
    if (sessionUserId && sessionUserId !== user.id) {
      redirect('/dashboard');
    }

    // Confirm payment actually went through
    const isPaid = session.payment_status === 'paid' || session.status === 'complete';
    if (!isPaid) {
      redirect('/choose-plan?checkout=pending');
    }

    const planTier = session.metadata?.plan_tier as string | undefined;
    if (!planTier) {
      redirect('/dashboard');
    }

    // Sync DB immediately — don't wait for the webhook
    if (session.mode === 'payment') {
      // One-time trial payment
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      await supabaseAdmin.from('subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: session.customer as string,
        stripe_checkout_session_id: session.id,
        plan_tier: 'trial',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: trialEndsAt.toISOString(),
        trial_ends_at: trialEndsAt.toISOString(),
      }, { onConflict: 'stripe_checkout_session_id' });
    } else if (session.mode === 'subscription' && session.subscription) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = session.subscription as any;
      const item = sub.items?.data?.[0];
      const start = item?.current_period_start ?? sub.current_period_start ?? null;
      const end = item?.current_period_end ?? sub.current_period_end ?? null;

      await supabaseAdmin.from('subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        stripe_checkout_session_id: session.id,
        plan_tier: planTier,
        status: 'active',
        current_period_start: start ? new Date(start * 1000).toISOString() : null,
        current_period_end: end ? new Date(end * 1000).toISOString() : null,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
      }, { onConflict: 'stripe_subscription_id' });
    }

    // Upsert denormalized plan_tier on user_profiles
    // (row may not exist yet since onboarding now happens AFTER payment)
    await supabaseAdmin
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        plan_tier: planTier,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
  } catch (err) {
    console.error('[checkout/success] sync error:', err);
    // Fall through — middleware will route the user to the right next step
  }

  // Check if the user has completed onboarding yet
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/onboarding?welcome=1');
  }

  redirect('/dashboard/billing?checkout=success');
}
