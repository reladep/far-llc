'use client';

import type { Firm } from '@/types';
import { FirmCard } from '@/components/firms/FirmCard';
import { Button } from '@/components/ui';

interface SavedFirmsListProps {
  firms: Firm[];
  loading: boolean;
  onRemove: (crd: number) => void;
}

export function SavedFirmsList({ firms, loading, onRemove }: SavedFirmsListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-secondary-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (firms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">No saved firms yet.</p>
        <p className="text-text-muted text-xs mt-1">
          Browse the directory and save firms you're interested in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {firms.map((firm) => (
        <div key={firm.crd} className="relative group">
          <FirmCard firm={firm} />
          <Button
            variant="danger"
            size="sm"
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              onRemove(firm.crd);
            }}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}
