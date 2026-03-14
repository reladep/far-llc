'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
);

const CSS = `
  .auth-split { display: grid; grid-template-columns: 1fr 1fr; min-height: calc(100vh - 64px); }
  .auth-brand {
    background: #0a1c2a; position: relative; overflow: hidden;
    display: flex; flex-direction: column; justify-content: center; padding: 64px 56px;
  }
  .auth-brand::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 72px 72px;
  }
  .auth-brand-inner { position: relative; max-width: 420px; }
  .auth-brand-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 48px; text-decoration: none; }
  .auth-brand-logo svg { flex-shrink: 0; }
  .auth-brand-logo span { font-size: 16px; font-weight: 600; color: #fff; letter-spacing: -0.02em; }
  .auth-brand-logo .green { color: #2DBD74; margin-left: 2px; font-weight: 700; }
  .auth-quote {
    font-family: 'Cormorant Garamond', serif; font-size: clamp(28px, 3vw, 38px);
    font-weight: 300; color: #fff; line-height: 1.25; margin: 0 0 40px;
  }
  .auth-quote em { font-style: italic; color: #2DBD74; }
  .auth-bullets { list-style: none; padding: 0; margin: 0 0 40px; display: flex; flex-direction: column; gap: 14px; }
  .auth-bullet { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.6); }
  .auth-check { width: 18px; height: 18px; border-radius: 50%; background: rgba(45,189,116,0.15); display: grid; place-items: center; flex-shrink: 0; }
  .auth-trust { font-size: 11px; color: rgba(255,255,255,0.3); line-height: 1.5; }

  .auth-form-panel {
    display: flex; align-items: center; justify-content: center; padding: 48px 40px;
    background: #fff;
  }
  .auth-form-wrap { width: 100%; max-width: 380px; }
  .auth-form-title { font-size: 24px; font-weight: 700; color: #0a1c2a; margin: 0 0 4px; }
  .auth-form-sub { font-size: 14px; color: #5A7568; margin: 0 0 32px; }

  .auth-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
  .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: #E5E7EB; }
  .auth-divider span { font-size: 12px; color: #94A3B8; }

  .auth-google {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
    background: #fff; border: 1px solid #CAD8D0; color: #0C1810; padding: 11px;
    font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 500;
    cursor: pointer; transition: border-color 0.15s; text-decoration: none;
  }
  .auth-google:hover { border-color: #5A7568; }

  .auth-footer { text-align: center; margin-top: 24px; font-size: 13px; color: #5A7568; }
  .auth-footer a { color: #1A7A4A; font-weight: 500; text-decoration: none; }
  .auth-footer a:hover { text-decoration: underline; }

  @media (max-width: 768px) {
    .auth-split { grid-template-columns: 1fr; }
    .auth-brand { padding: 32px 24px; min-height: auto; }
    .auth-quote { font-size: 24px; margin-bottom: 24px; }
    .auth-bullets { margin-bottom: 24px; }
    .auth-form-panel { padding: 32px 24px; }
  }
`;

const CHECK_ICON = (
  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#2DBD74" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

interface AuthLayoutProps {
  variant: 'login' | 'signup';
  children: ReactNode;
}

export function AuthLayout({ variant, children }: AuthLayoutProps) {
  const isLogin = variant === 'login';

  return (
    <>
      <style suppressHydrationWarning>{CSS}</style>
      <div className="auth-split">
        {/* Brand panel */}
        <div className="auth-brand">
          <div className="auth-brand-inner">
            <Link href="/" className="auth-brand-logo">
              <svg width="32" height="36" viewBox="0 0 20 22" fill="none">
                <path d="M10 1L1 4.5V10C1 15.5 4.8 19.7 10 21C15.2 19.7 19 15.5 19 10V4.5L10 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" opacity="0.35" />
                <path d="M10 3.5L3 6.2V10.5C3 14.8 6.1 18.2 10 19.2C13.9 18.2 17 14.8 17 10.5V6.2L10 3.5Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" fill="none" opacity="0.2" />
                <path d="M6.5 7L10 14.5L13.5 7" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span>Visor<span className="green">Index</span></span>
            </Link>

            <h2 className="auth-quote">
              {isLogin
                ? <>Know the score before you hand over your <em>life savings.</em></>
                : <>Start finding the <em>right advisor</em> for your situation.</>
              }
            </h2>

            <ul className="auth-bullets">
              <li className="auth-bullet"><span className="auth-check">{CHECK_ICON}</span> 40,000+ advisors indexed</li>
              <li className="auth-bullet"><span className="auth-check">{CHECK_ICON}</span> 500+ data points per firm</li>
              <li className="auth-bullet"><span className="auth-check">{CHECK_ICON}</span> Zero paid placements</li>
              <li className="auth-bullet"><span className="auth-check">{CHECK_ICON}</span> Free to search, free to compare</li>
            </ul>

            <p className="auth-trust">No advisor has ever paid to appear here or influence their score.</p>
          </div>
        </div>

        {/* Form panel */}
        <div className="auth-form-panel">
          <div className="auth-form-wrap">
            {children}

            <div className="auth-divider"><span>or</span></div>

            <Link href="/auth/signup" className="auth-google">
              {GOOGLE_SVG}
              Continue with Google
            </Link>

            <div className="auth-footer">
              {isLogin ? (
                <p>Don&apos;t have an account? <Link href="/auth/signup">Sign up</Link></p>
              ) : (
                <p>Already have an account? <Link href="/auth/login">Sign in</Link></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
