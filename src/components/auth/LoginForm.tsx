'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    auth.login(email, password);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-text-primary text-center">Welcome back</h1>
      <p className="text-sm text-text-secondary text-center mt-1">
        Sign in to your account
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

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-bg-primary px-2 text-text-muted">or</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={auth.loginWithGoogle}
      >
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
