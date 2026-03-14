import type { Metadata } from 'next';
import { AboutPageClient } from '@/components/about/AboutPageClient';

export const metadata: Metadata = {
  title: 'About — Visor Index',
  description:
    'We are on your side. Visor Index gives you the data, analysis, and tools to find, evaluate, negotiate with, and track the right wealth partner on your terms.',
};

export default function AboutPage() {
  return <AboutPageClient />;
}
