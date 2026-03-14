import type { Metadata } from 'next';
import { DisclosuresPageClient } from '@/components/disclosures/DisclosuresPageClient';

export const metadata: Metadata = {
  title: 'Disclosures — Visor Index',
  description:
    'Regulatory status, data source disclosures, compensation model, and analytical methodology disclosures for Visor Index.',
};

export default function DisclosuresPage() {
  return <DisclosuresPageClient />;
}
