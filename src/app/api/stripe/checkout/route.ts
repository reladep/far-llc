import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe, PRICE_IDS } from '@/lib/stripe';
import type { PlanTier } from '@/lib/stripe';
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tier } = (await request.json()) as { tier: PlanTier };

  if (!tier || !PRICE_IDS[tier]) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  // Get or create Stripe customer
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabaseAdmin
      .from('user_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id);
  }

  const isOneTime = tier === 'trial';
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', '') || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: isOneTime ? 'payment' : 'subscription',
    line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
    success_url: `${origin}/dashboard/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?checkout=canceled`,
    metadata: {
      supabase_user_id: user.id,
      plan_tier: tier,
    },
    ...(isOneTime ? {} : {
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_tier: tier,
        },
      },
    }),
  });

  return NextResponse.json({ url: session.url });
}
