import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const PRICE_IDS = {
  trial: process.env.STRIPE_PRICE_TRIAL!,
  consumer: process.env.STRIPE_PRICE_CONSUMER!,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
} as const;

export type PlanTier = 'trial' | 'consumer' | 'enterprise';

export const TIER_LIMITS = {
  trial:      { alert_subscriptions: 0,   digest_frequency: null,     api_access: false },
  consumer:   { alert_subscriptions: 25,  digest_frequency: 'weekly', api_access: false },
  enterprise: { alert_subscriptions: 100, digest_frequency: 'daily',  api_access: true  },
} as const;
