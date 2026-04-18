// Sentry config for server-side code (API routes, server components, middleware).
// Runs in Node.js runtime on Vercel server functions.

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    // Lower sampling in prod to control costs; 100% in dev for visibility.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Only capture meaningful errors — drop noisy abort/timeout events
    ignoreErrors: [
      'AbortError',
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
    ],
  });
}
