import type { Metadata } from 'next';
import { TermsPageClient } from '@/components/terms/TermsPageClient';

export const metadata: Metadata = {
  title: 'Terms of Service — Visor Index',
  description:
    'Terms of Service and Legal Disclosures for Visor Index. Read our terms before using the platform.',
};

export default function TermsPage() {
  return <TermsPageClient />;
}
