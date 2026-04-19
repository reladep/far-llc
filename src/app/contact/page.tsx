import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ContactPageClient } from '@/components/contact/ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact — Visor Index',
  description: 'Get in touch with the Visor Index team. Questions about our data, methodology, or enterprise access.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactPageClient />
    </Suspense>
  );
}
