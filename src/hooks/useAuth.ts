'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

const supabase = createSupabaseBrowserClient();

interface AuthState {
  loading: boolean;
  error: string | null;
  user: User | null;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ loading: false, error: null, user: null });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setState((s) => ({ ...s, user: data.user }));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, user: session?.user ?? null }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setState((s) => ({ ...s, loading: false, error: error.message }));
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    },
    [router]
  );

  const signup = useCallback(
    async (email: string, password: string, fullName: string) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setState((s) => ({ ...s, loading: false, error: error.message }));
      } else {
        router.push('/onboarding');
        router.refresh();
      }
    },
    [router]
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) {
      setState((s) => ({ ...s, loading: false, error: error.message }));
      return false;
    }
    setState((s) => ({ ...s, loading: false }));
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }, [router]);

  return {
    ...state,
    login,
    signup,
    requestPasswordReset,
    logout,
  };
}
