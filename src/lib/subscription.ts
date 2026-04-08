import { supabaseAdmin } from './supabase-admin';
import { TIER_LIMITS } from './stripe';
import type { PlanTier } from './stripe';

/**
 * Get the user's current effective plan tier from user_profiles.
 * Returns 'none' if no active subscription.
 */
export async function getUserPlanTier(userId: string): Promise<PlanTier | 'none'> {
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('plan_tier')
    .eq('user_id', userId)
    .single();
  return (data?.plan_tier as PlanTier | 'none') ?? 'none';
}

/**
 * Check if a user's trial has expired.
 */
export async function isTrialExpired(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('trial_ends_at, status')
    .eq('user_id', userId)
    .eq('plan_tier', 'trial')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return false;
  if (data.status === 'expired') return true;
  if (data.trial_ends_at && new Date(data.trial_ends_at) < new Date()) return true;
  return false;
}

/**
 * Get the user's active subscription record (most recent active).
 */
export async function getActiveSubscription(userId: string) {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/**
 * Get the limit for a specific feature based on the user's tier.
 */
export function getTierLimit(tier: PlanTier | 'none', feature: keyof typeof TIER_LIMITS.trial) {
  if (tier === 'none') return 0;
  return TIER_LIMITS[tier][feature];
}
