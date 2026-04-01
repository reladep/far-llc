'use client';

import Link from 'next/link';
import { ReactNode, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
);

const CSS = `
  :root {
    --navy: #172438; --navy-2: #0A1C2A;
    --green: #1A7A4A; --green-2: #22995E; --green-3: #2DBD74;
    --bg: #F6F8F7; --ink: #0C1810; --ink-2: #2E4438; --ink-3: #5A7568; --rule: #CAD8D0;
    --serif: 'Cormorant Garamond', serif; --sans: 'DM Sans', sans-serif; --mono: 'DM Mono', monospace;
  }

  .auth-page {
    display: flex; align-items: center; justify-content: center;
    min-height: calc(100vh - 64px); background: var(--bg); padding: 48px 20px;
  }

  .auth-form-wrap { width: 100%; max-width: 400px; }

  .auth-form-card {
    background: #fff; border: 0.5px solid var(--rule); border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
    padding: 36px 32px;
  }
  .auth-form-title {
    font-family: var(--serif); font-size: 28px; font-weight: 700;
    color: var(--ink); margin: 0 0 4px; letter-spacing: -.02em;
  }
  .auth-form-sub {
    font-size: 13px; color: var(--ink-3); margin: 0 0 28px;
    font-family: var(--sans);
  }

  /* Override ui/Input styles inside auth */
  .auth-form-card .flex.flex-col.gap-1\\.5 label {
    font-family: var(--sans); font-size: 11px; font-weight: 600;
    letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3);
  }
  .auth-form-card input[type="email"],
  .auth-form-card input[type="password"],
  .auth-form-card input[type="text"] {
    border-radius: 0 !important; border: 1px solid var(--rule) !important;
    background: var(--bg) !important; font-family: var(--mono) !important;
    font-size: 13px !important; color: var(--ink) !important;
    padding: 10px 14px !important; height: auto !important;
    transition: border-color .15s !important;
  }
  .auth-form-card input:focus {
    border-color: var(--green-3) !important;
    box-shadow: none !important; outline: none !important;
    ring: none !important;
  }
  .auth-form-card input::placeholder { color: var(--rule) !important; }

  /* Override ui/Button styles inside auth */
  .auth-form-card button[type="submit"] {
    border-radius: 0 !important; background: var(--green) !important;
    font-family: var(--sans) !important; font-size: 12px !important;
    font-weight: 600 !important; letter-spacing: .1em !important;
    text-transform: uppercase !important; height: 46px !important;
    transition: background .15s !important;
  }
  .auth-form-card button[type="submit"]:hover:not(:disabled) {
    background: var(--green-2) !important;
  }

  .auth-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
  .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--rule); }
  .auth-divider span { font-size: 11px; color: var(--ink-3); font-family: var(--sans); }

  .auth-google {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
    background: #fff; border: 1px solid var(--rule); color: var(--ink); padding: 11px;
    font-size: 13px; font-family: var(--sans); font-weight: 500;
    cursor: pointer; transition: border-color 0.15s; text-decoration: none;
  }
  .auth-google:hover { border-color: var(--ink-3); }

  .auth-footer {
    text-align: center; margin-top: 20px; font-size: 13px; color: var(--ink-3);
    font-family: var(--sans);
  }
  .auth-footer a { color: var(--green); font-weight: 600; text-decoration: none; }
  .auth-footer a:hover { text-decoration: underline; }

  .auth-legal {
    text-align: center; margin-top: 16px; font-size: 10px; color: var(--rule);
    font-family: var(--sans); line-height: 1.6;
  }
  .auth-legal a { color: var(--ink-3); text-decoration: none; border-bottom: 1px solid var(--rule); }

  /* Forgot password link */
  .auth-form-card .flex.justify-end a {
    font-family: var(--sans); font-size: 11px; color: var(--green);
    text-decoration: none; font-weight: 500;
  }
  .auth-form-card .flex.justify-end a:hover { text-decoration: underline; }

  /* Error text */
  .auth-form-card .text-sm.text-error,
  .auth-form-card .text-error {
    font-family: var(--sans); font-size: 12px;
  }

  /* ── Mobile ────────────────────────────────────────────────── */
  @media (max-width: 768px) {
    .auth-page { padding: 32px 16px; }
    .auth-form-card { padding: 28px 20px; }
  }
`;

interface AuthLayoutProps {
  variant: 'login' | 'signup';
  children: ReactNode;
}

export function AuthLayout({ variant, children }: AuthLayoutProps) {
  const isLogin = variant === 'login';

  const handleGoogleLogin = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  return (
    <>
      <style suppressHydrationWarning>{CSS}</style>
      <div className="auth-page">
        <div className="auth-form-wrap">
          <div className="auth-form-card">
            {children}
          </div>

          <div className="auth-divider"><span>or</span></div>

          <button onClick={handleGoogleLogin} className="auth-google" type="button">
            {GOOGLE_SVG}
            Continue with Google
          </button>

          <div className="auth-footer">
            {isLogin ? (
              <p>Don&apos;t have an account? <Link href="/auth/signup">Sign up</Link></p>
            ) : (
              <p>Already have an account? <Link href="/auth/login">Sign in</Link></p>
            )}
          </div>

          <div className="auth-legal">
            <Link href="/terms">Terms</Link> and{' '}
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </>
  );
}
