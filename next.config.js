/** @type {import('next').NextConfig} */
const supabaseHostname = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').hostname;
  } catch {
    return 'placeholder.supabase.co';
  }
})();

// ── Content Security Policy ──────────────────────────────────────────────────
// Allow-lists every third party we depend on (Stripe, Turnstile, Sentry, Supabase).
// 'unsafe-inline' is currently required for Next.js's inline hydration scripts and
// <style dangerouslySetInnerHTML> patterns used across the app. Swap to nonce-based
// CSP post-launch if we want stricter protection against injected scripts.
const supabaseWildcard = `https://${supabaseHostname} https://*.supabase.co https://*.supabase.in wss://${supabaseHostname} wss://*.supabase.co`;
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://js.stripe.com',
    'https://challenges.cloudflare.com',
    'https://*.sentry.io',
    'https://*.ingest.sentry.io',
    'https://vercel.live',
  ],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'media-src': ["'self'"],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://challenges.cloudflare.com',
    'https://*.sentry.io',
    'https://*.ingest.sentry.io',
    supabaseWildcard,
  ].flatMap((s) => s.split(' ')),
  'frame-src': [
    "'self'",
    'https://js.stripe.com',
    'https://hooks.stripe.com',
    'https://challenges.cloudflare.com',
  ],
  'worker-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};
const cspHeader = Object.entries(cspDirectives)
  .map(([key, values]) => (values.length === 0 ? key : `${key} ${values.join(' ')}`))
  .join('; ');

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: cspHeader },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
