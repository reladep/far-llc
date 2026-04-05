'use client';

import { useState } from 'react';

interface SaveFirmButtonProps {
  crd: number;
  initialSaved: boolean;
  initialWatching?: boolean;
}

export default function SaveFirmButton({ crd, initialSaved, initialWatching = false }: SaveFirmButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [watching, setWatching] = useState(initialWatching);
  const [loading, setLoading] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setError(null);
    try {
      if (saved) {
        const res = await fetch(`/api/user/saved-firms/${crd}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
          setSaved(false);
          // Also remove alert subscription when unsaving
          if (watching) {
            await fetch(`/api/user/alerts/subscriptions?crd=${crd}`, { method: 'DELETE', credentials: 'include' });
            setWatching(false);
          }
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to remove');
        }
      } else {
        const res = await fetch('/api/user/saved-firms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crd }),
          credentials: 'include',
        });
        if (res.ok) setSaved(true);
        else {
          const data = await res.json();
          setError(data.error || 'Failed to save');
        }
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleWatch = async () => {
    if (!saved) return; // Must save first
    setWatchLoading(true);
    setError(null);
    try {
      if (watching) {
        const res = await fetch(`/api/user/alerts/subscriptions?crd=${crd}`, {
          method: 'DELETE', credentials: 'include',
        });
        if (res.ok) setWatching(false);
        else {
          const data = await res.json();
          setError(data.error || 'Failed to remove alert');
        }
      } else {
        const res = await fetch('/api/user/alerts/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crd }),
          credentials: 'include',
        });
        if (res.ok) setWatching(true);
        else {
          const data = await res.json();
          setError(data.error || 'Failed to add alert');
        }
      }
    } catch {
      setError('Network error');
    } finally {
      setWatchLoading(false);
    }
  };

  const btnStyle = (active: boolean) => ({
    display: 'inline-flex' as const, alignItems: 'center' as const, gap: 6,
    fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.04em',
    padding: '6px 14px',
    background: active ? 'rgba(45,189,116,.07)' : 'transparent',
    border: active ? '1px solid rgba(45,189,116,.3)' : '1px solid rgba(255,255,255,.12)',
    color: active ? '#2DBD74' : 'rgba(255,255,255,.5)',
    cursor: 'pointer' as const,
    transition: 'all .2s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleToggle}
          disabled={loading}
          style={{ ...btnStyle(saved), opacity: loading ? 0.6 : 1 }}
        >
          <svg width="11" height="11" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" viewBox="0 0 11 11">
            <path d="M2 1.5h7a.5.5 0 0 1 .5.5v7.5l-4-2.5L1.5 9.5V2a.5.5 0 0 1 .5-.5Z" />
          </svg>
          {loading ? '…' : saved ? 'Saved' : 'Save Firm'}
        </button>
        {saved && (
          <button
            onClick={handleWatch}
            disabled={watchLoading}
            style={{ ...btnStyle(watching), opacity: watchLoading ? 0.6 : 1 }}
            title={watching ? 'Alerts enabled — click to disable' : 'Enable alerts for this firm'}
          >
            <svg width="12" height="12" fill={watching ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" viewBox="0 0 16 16">
              <path d="M8 1.5c-2.5 0-4.5 2-4.5 4.5v3l-1 1.5h11l-1-1.5v-3c0-2.5-2-4.5-4.5-4.5Z" />
              <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" />
            </svg>
            {watchLoading ? '…' : 'Alerts'}
          </button>
        )}
      </div>
      {error && (
        <span style={{ fontSize: 10, color: '#EF4444', fontFamily: "'DM Mono', monospace" }}>
          {error}
        </span>
      )}
    </div>
  );
}
