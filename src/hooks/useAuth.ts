'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthState {
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ loading: false, error: null });

  const login = useCallback(
    async (email: string, password: string) => {
      setState({ loading: true, error: null });
      try {
        const res = await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Invalid email or password');
        }
        router.push('/dashboard');
        router.refresh();
      } catch (err) {
        setState({
          loading: false,
          error: err instanceof Error ? err.message : 'Login failed',
        });
      }
    },
    [router]
  );

  const signup = useCallback(
    async (email: string, password: string, fullName: string) => {
      setState({ loading: true, error: null });
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Signup failed');
        }
        router.push('/dashboard');
        router.refresh();
      } catch (err) {
        setState({
          loading: false,
          error: err instanceof Error ? err.message : 'Signup failed',
        });
      }
    },
    [router]
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    setState({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to send reset email');
      setState({ loading: false, error: null });
      return true;
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : 'Request failed',
      });
      return false;
    }
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = '/api/auth/signin/google';
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }, [router]);

  return {
    ...state,
    login,
    signup,
    requestPasswordReset,
    loginWithGoogle,
    logout,
  };
}
