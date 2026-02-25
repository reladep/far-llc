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
      className="text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : 'Remove'}
    </button>
  );
}
