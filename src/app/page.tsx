import { HomePageClient } from '@/components/home/HomePageClient';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://visorindex.com/#organization',
  name: 'Visor Index',
  url: 'https://visorindex.com',
  logo: 'https://visorindex.com/visor_logo.png',
  description:
    'Independent intelligence on SEC-registered investment advisors. Search, compare, and evaluate advisors with transparent data on fees, AUM, services, and Visor Index™ Scores.',
  sameAs: [
    // Add social profiles here as they come online
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'hello@visorindex.com',
      areaServed: 'US',
      availableLanguage: 'en',
    },
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://visorindex.com/#website',
  url: 'https://visorindex.com',
  name: 'Visor Index',
  publisher: { '@id': 'https://visorindex.com/#organization' },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://visorindex.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <HomePageClient />
    </>
  );
}
