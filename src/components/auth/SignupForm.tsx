'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from './AuthLayout';

export function SignupForm() {
  const auth = useAuth();
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
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          required
        />

        {error && <p className="text-sm text-error">{error}</p>}

        <Button type="submit" className="w-full" disabled={auth.loading}>
          {auth.loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
