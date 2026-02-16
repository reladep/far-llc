'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export function PasswordResetForm() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await auth.requestPasswordReset(email);
    if (success) setSent(true);
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center text-primary text-xl">
          ✉
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Check your email</h1>
        <p className="text-sm text-text-secondary mt-2">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent password reset instructions.
        </p>
        <Link
          href="/auth/login"
          className="inline-block mt-6 text-sm text-primary hover:underline font-medium"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-text-primary text-center">Reset your password</h1>
      <p className="text-sm text-text-secondary text-center mt-1">
        Enter your email and we&apos;ll send reset instructions.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        {auth.error && <p className="text-sm text-error">{auth.error}</p>}

        <Button type="submit" className="w-full" disabled={auth.loading}>
          {auth.loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link href="/auth/login" className="text-primary hover:underline font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
