import type { Metadata } from 'next';
import { PrivacyPageClient } from '@/components/privacy/PrivacyPageClient';

export const metadata: Metadata = {
  title: 'Privacy Policy — Visor Index',
  description:
    'How Visor Index collects, uses, and protects your personal information. Read our Privacy Policy.',
};

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}
