import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://visorindex.com';

// 50 states + DC + territories — matches /directory/[slug] routes
const STATE_SLUGS = [
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'dc', 'fl',
  'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me',
  'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh',
  'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'pr',
  'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'vi', 'wa',
  'wv', 'wi', 'wy',
];

// Cap firm pages at 40k to stay under Google's 50k-URL sitemap limit
// If you exceed this, switch to generateSitemaps() for chunked sitemaps
const MAX_FIRMS = 40_000;

async function fetchFirmCrds(): Promise<number[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];

    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('firmdata_current')
      .select('crd')
      .order('aum', { ascending: false, nullsFirst: false })
      .limit(MAX_FIRMS);

    if (error) {
      console.error('[sitemap] Failed to fetch firms:', error.message);
      return [];
    }
    return (data ?? []).map((r) => r.crd).filter((crd): crd is number => typeof crd === 'number');
  } catch (err) {
    console.error('[sitemap] Unexpected error:', err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static public pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/match`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/deep-dive`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/negotiate`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/directory`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/disclosures`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  // State directory pages (~53 URLs)
  const directoryPages: MetadataRoute.Sitemap = STATE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/directory/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Firm profile pages (up to 40k URLs)
  const crds = await fetchFirmCrds();
  const firmPages: MetadataRoute.Sitemap = crds.map((crd) => ({
    url: `${BASE_URL}/firm/${crd}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...directoryPages, ...firmPages];
}
