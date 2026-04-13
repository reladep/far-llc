import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/onboarding/', '/choose-plan/', '/checkout/', '/auth/'],
      },
      // Block aggressive AI/scraper bots entirely
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'ClaudeBot', 'Bytespider', 'PetalBot'],
        disallow: '/',
      },
    ],
    sitemap: 'https://visorindex.com/sitemap.xml',
  };
}
