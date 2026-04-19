'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Input, PasswordInput } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from './AuthLayout';

export function SignupForm() {
  const auth = useAuth();
  const searchParams = useSearchParams();

  // Store intended plan from pricing page so checkout can use it after onboarding
  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan && ['trial', 'consumer', 'enterprise'].includes(plan)) {
      localStorage.setItem('intended_plan', plan);
    }
  }, [searchParams]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    auth.signup(email, password, fullName);
  };

  const error = localError || auth.error;

  return (
    <AuthLayout variant="signup">
      <h1 className="auth-form-title">Create an account</h1>
      <p className="auth-form-sub">Start finding the right financial advisor</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          showStrength
          required
        />
        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          required
        />

        {error && <p className="text-sm text-error">{error}</p>}

        <Button type="submit" className="w-full !rounded-none !bg-[#1A7A4A] hover:!bg-[#22995E] !h-[46px] !text-[12px] !font-semibold !tracking-[0.1em] !uppercase !font-[var(--sans)]" disabled={auth.loading}>
          {auth.loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
