import type { Metadata } from 'next';
import PricingPage from './PricingPage';

export const metadata: Metadata = {
  title: 'Pricing — Visor Index',
  description: 'Simple, transparent pricing. Full intelligence into advisory fees, conflicts, and scores.',
};

export default function Page() {
  return <PricingPage />;
}
