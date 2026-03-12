'use client';

import { useState } from 'react';

interface SaveFirmButtonProps {
  crd: number;
  initialSaved: boolean;
}

export default function SaveFirmButton({ crd, initialSaved }: SaveFirmButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setError(null);
    try {
      if (saved) {
        const res = await fetch(`/api/user/saved-firms/${crd}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) setSaved(false);
        else {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        onClick={handleToggle}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.04em',
          padding: '6px 14px',
          background: saved ? 'rgba(45,189,116,.07)' : 'transparent',
          border: saved ? '1px solid rgba(45,189,116,.3)' : '1px solid rgba(255,255,255,.12)',
          color: saved ? '#2DBD74' : 'rgba(255,255,255,.5)',
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.6 : 1,
          transition: 'all .2s',
        }}
      >
        <svg width="11" height="11" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" viewBox="0 0 11 11">
          <path d="M2 1.5h7a.5.5 0 0 1 .5.5v7.5l-4-2.5L1.5 9.5V2a.5.5 0 0 1 .5-.5Z" />
        </svg>
        {loading ? '…' : saved ? 'Saved' : 'Save Firm'}
      </button>
      {error && (
        <span style={{ fontSize: 10, color: '#EF4444', fontFamily: "'DM Mono', monospace" }}>
          {error}
        </span>
      )}
    </div>
  );
}
