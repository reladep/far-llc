import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
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

  return (
    <BillingClient
      email={email}
      memberSince={memberSince}
      nameFallback={nameFallback}
    />
  );
}
