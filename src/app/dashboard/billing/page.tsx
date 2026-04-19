import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import BillingClient from './BillingClient';

export const metadata: Metadata = {
  title: 'Account & Billing - Visor Index',
};

export default async function BillingPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const email = user.email ?? '';
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  const nameFallback = email
    .split('@')[0]
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  // Fetch plan tier and subscription data
  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabaseAdmin
      .from('user_profiles')
      .select('plan_tier, stripe_customer_id')
      .eq('user_id', user.id)
      .single(),
    supabaseAdmin
      .from('subscriptions')
      .select('plan_tier, status, current_period_end, cancel_at_period_end, trial_ends_at')
      .eq('user_id', user.id)
      .in('status', ['active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <BillingClient
      email={email}
      memberSince={memberSince}
      nameFallback={nameFallback}
      planTier={(profile?.plan_tier as string) || 'none'}
      subscription={subscription}
      hasStripeCustomer={!!profile?.stripe_customer_id}
    />
  );
}
