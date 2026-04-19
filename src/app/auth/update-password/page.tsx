'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, PasswordInput } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'waiting' | 'ready' | 'invalid'>('waiting');

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // If the user already has a session (e.g. they followed the email link
    // and Supabase exchanged the token on load), we can accept password updates immediately.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus((s) => (s === 'waiting' ? 'ready' : s));
    });

    // Listen for Supabase to fire PASSWORD_RECOVERY after token exchange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setStatus('ready');
      }
    });

    // Give the hash-parse a generous window. If nothing has happened after 6s,
    // the link is likely expired or malformed — tell the user.
    const timeoutId = setTimeout(() => {
      setStatus((s) => (s === 'waiting' ? 'invalid' : s));
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      toast('Password updated successfully', { type: 'success' });
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Set new password</h1>
        <p className="text-sm text-slate-500 text-center mt-1">
          Enter your new password below
        </p>

        {status === 'waiting' && (
          <div
            style={{
              marginTop: 32,
              padding: '24px 16px',
              textAlign: 'center',
              fontSize: 13,
              color: '#5A7568',
              fontFamily: 'var(--sans)',
            }}
          >
            Verifying your reset link…
          </div>
        )}

        {status === 'invalid' && (
          <div
            style={{
              marginTop: 32,
              padding: 16,
              background: '#FCECEC',
              border: '1px solid #E8C4C4',
              fontSize: 13,
              color: '#8B2626',
              fontFamily: 'var(--sans)',
              lineHeight: 1.55,
            }}
          >
            This password reset link is invalid or has expired.{' '}
            <a href="/auth/reset-password" style={{ color: '#1A7A4A', fontWeight: 500 }}>
              Request a new one
            </a>.
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <PasswordInput
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              showStrength
              required
            />
            <PasswordInput
              label="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              required
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
