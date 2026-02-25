'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

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
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" onClick={handleToggle} disabled={loading}>
        {loading ? '...' : saved ? 'Saved ✓' : 'Save Firm'}
      </Button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
