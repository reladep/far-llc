'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function VerifyClient() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createSupabaseBrowserClient();

  const handleResend = async () => {
    if (!email) {
      setErrorMsg('No email on file — return to signup.');
      setResendStatus('error');
      return;
    }
    setResendStatus('sending');
    setErrorMsg('');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      setErrorMsg(error.message);
      setResendStatus('error');
    } else {
      setResendStatus('sent');
    }
  };

  return (
    <AuthLayout variant="signup">
      <h1 className="auth-form-title">Check your email</h1>
      <p className="auth-form-sub">
        {email ? (
          <>We sent a verification link to <strong>{email}</strong>.</>
        ) : (
          'We sent you a verification link.'
        )}{' '}
        Click it to activate your account.
      </p>

      <div
        style={{
          background: '#F6F8F7',
          border: '1px solid #CAD8D0',
          padding: 16,
          fontSize: 13,
          color: '#2E4438',
          lineHeight: 1.55,
          marginBottom: 20,
          fontFamily: 'var(--sans)',
        }}
      >
        Didn&apos;t get it? Check your spam folder, or resend the verification link below.
      </div>

      <button
        type="button"
        onClick={handleResend}
        disabled={resendStatus === 'sending' || resendStatus === 'sent'}
        style={{
          width: '100%',
          height: 46,
          background: resendStatus === 'sent' ? '#CAD8D0' : '#1A7A4A',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontFamily: 'var(--sans)',
          border: 'none',
          cursor: resendStatus === 'sent' ? 'default' : 'pointer',
          opacity: resendStatus === 'sending' ? 0.6 : 1,
          marginBottom: 16,
        }}
      >
        {resendStatus === 'sending'
          ? 'Sending…'
          : resendStatus === 'sent'
            ? 'Email sent'
            : 'Resend verification email'}
      </button>

      {errorMsg && (
        <p style={{ fontSize: 13, color: '#D24A4A', marginBottom: 12, fontFamily: 'var(--sans)' }}>
          {errorMsg}
        </p>
      )}

      <div
        style={{
          fontSize: 12,
          color: '#5A7568',
          textAlign: 'center',
          fontFamily: 'var(--sans)',
          marginTop: 4,
        }}
      >
        Wrong email?{' '}
        <Link href="/auth/signup" style={{ color: '#1A7A4A', textDecoration: 'none', fontWeight: 500 }}>
          Go back to signup
        </Link>
      </div>
    </AuthLayout>
  );
}
