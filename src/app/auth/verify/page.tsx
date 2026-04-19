import type { Metadata } from 'next';
import { Suspense } from 'react';
import VerifyClient from './VerifyClient';

export const metadata: Metadata = {
  title: 'Check your email',
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyClient />
    </Suspense>
  );
}
