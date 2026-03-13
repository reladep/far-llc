'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RemoveFirmButtonProps {
  crd: number;
}

export default function RemoveFirmButton({ crd }: RemoveFirmButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/saved-firms/${crd}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="f-btn remove"
      style={{
        fontSize: 10,
        padding: '3px 9px',
        background: 'none',
        border: '1px solid var(--rule)',
        color: loading ? 'var(--rule)' : 'var(--ink-3)',
        cursor: loading ? 'default' : 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all .12s',
        fontFamily: 'var(--sans)',
        opacity: loading ? 0.5 : 1,
      }}
      onMouseEnter={e => {
        if (!loading) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#DC2626';
          (e.currentTarget as HTMLButtonElement).style.color = '#DC2626';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--rule)';
        (e.currentTarget as HTMLButtonElement).style.color = loading ? 'var(--rule)' : 'var(--ink-3)';
      }}
    >
      {loading ? '…' : 'Remove'}
    </button>
  );
}
