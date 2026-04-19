'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        fontFamily: 'var(--font-sans, Inter, sans-serif)',
      }}
    >
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono, DM Mono, monospace)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#D24A4A',
            marginBottom: 12,
          }}
        >
          Dashboard Error
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif, Cormorant Garamond, serif)',
            fontSize: 32,
            fontWeight: 300,
            color: '#0C1810',
            lineHeight: 1.1,
            margin: '0 0 12px',
          }}
        >
          Something went wrong in your dashboard.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: '#5A7568',
            lineHeight: 1.55,
            margin: '0 0 24px',
          }}
        >
          We&apos;ve logged this error and our team has been notified. You can try
          reloading the page or return to your dashboard home.
        </p>
        {error.digest && (
          <p
            style={{
              fontFamily: 'var(--font-mono, DM Mono, monospace)',
              fontSize: 11,
              color: '#5A7568',
              marginBottom: 20,
            }}
          >
            Error ID: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '10px 20px',
              background: '#1A7A4A',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: '#0C1810',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              border: '1px solid #CAD8D0',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
