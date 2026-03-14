'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from './AuthLayout';

export function LoginForm() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    auth.login(email, password);
  };

  return (
    <AuthLayout variant="login">
      <h1 className="auth-form-title">Welcome back</h1>
      <p className="auth-form-sub">Sign in to your account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <div className="flex justify-end">
          <Link
            href="/auth/reset-password"
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {auth.error && (
          <p className="text-sm text-error">{auth.error}</p>
        )}

        <Button type="submit" className="w-full" disabled={auth.loading}>
          {auth.loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </AuthLayout>
  );
}
