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

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (saved) {
        const res = await fetch(`/api/user/saved-firms/${crd}`, { method: 'DELETE' });
        if (res.ok) setSaved(false);
      } else {
        const res = await fetch('/api/user/saved-firms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crd }),
        });
        if (res.ok) setSaved(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleToggle} disabled={loading}>
      {loading ? '...' : saved ? 'Saved ✓' : 'Save Firm'}
    </Button>
  );
}
