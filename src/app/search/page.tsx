import type { Metadata } from 'next';
import SearchClient from './SearchClient';

export const metadata: Metadata = {
  title: 'Search Advisors — Visor Index',
  description:
    'Search 10,000+ SEC-registered investment advisors by location, AUM, fee structure, services, and Visor Index™ Score. Transparent, independent data.',
  alternates: { canonical: 'https://visorindex.com/search' },
  openGraph: {
    type: 'website',
    url: 'https://visorindex.com/search',
    siteName: 'Visor Index',
    title: 'Search Advisors — Visor Index',
    description:
      'Search 10,000+ SEC-registered investment advisors by location, AUM, fee structure, services, and Visor Index™ Score.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search Advisors — Visor Index',
    description:
      'Search 10,000+ SEC-registered investment advisors by location, AUM, fees, services, and scores.',
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
