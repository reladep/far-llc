import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Visor Index',
    short_name: 'Visor',
    description:
      'Independent intelligence on SEC-registered investment advisors. Transparent data on fees, AUM, services, and scores.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F8F7',
    theme_color: '#0A1C2A',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
