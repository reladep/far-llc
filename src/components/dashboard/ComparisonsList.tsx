'use client';

import Link from 'next/link';
import type { UserComparison } from '@/types';
import { Card, Button } from '@/components/ui';

interface ComparisonsListProps {
  comparisons: UserComparison[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export function ComparisonsList({ comparisons, loading, onDelete }: ComparisonsListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-secondary-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">No comparisons yet.</p>
        <p className="text-text-muted text-xs mt-1">
          Compare firms side-by-side to find the best fit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comparisons.map((comp) => (
        <Card key={comp.id} variant="default" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/compare?ids=${comp.firm_crds.join(',')}`}
                className="font-medium text-text-primary hover:text-primary transition-colors"
              >
                {comp.name}
              </Link>
              <p className="text-xs text-text-muted mt-0.5">
                {comp.firm_crds.length} firms · Created{' '}
                {new Date(comp.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/compare?ids=${comp.firm_crds.join(',')}`}>View</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(comp.id)}>
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
