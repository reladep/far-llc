import type { Metadata } from 'next';
import { Suspense } from 'react';
import PricingPage from './PricingPage';

export const metadata: Metadata = {
  title: 'Pricing — Visor Index',
  description: 'Simple, transparent pricing. Full intelligence into advisory fees, conflicts, and scores.',
  alternates: { canonical: '/pricing' },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PricingPage />
    </Suspense>
  );
}
