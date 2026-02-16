'use client';

import type { Firm } from '@/types';
import { FirmCard } from '@/components/firms/FirmCard';
import { Button } from '@/components/ui';

interface SearchResultsProps {
  results: Firm[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  sort: string;
  onSortChange: (sort: 'relevance' | 'aum' | 'fees' | 'rating') => void;
  onPageChange: (page: number) => void;
}

const PAGE_SIZE = 20;

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'aum', label: 'AUM (High → Low)' },
  { value: 'fees', label: 'Fees (Low → High)' },
  { value: 'rating', label: 'Rating' },
];

export function SearchResults({
  results,
  total,
  page,
  loading,
  error,
  sort,
  onSortChange,
  onPageChange,
}: SearchResultsProps) {
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-error font-medium">Something went wrong</p>
        <p className="text-sm text-text-muted mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">
          {loading ? 'Searching...' : `${total.toLocaleString()} results`}
        </p>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as 'relevance' | 'aum' | 'fees' | 'rating')}
          className="h-9 rounded-lg border border-border bg-bg-primary px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-secondary-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-semibold text-text-primary">No results found</p>
          <p className="text-sm text-text-muted mt-1">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((firm) => (
            <FirmCard key={firm.crd} firm={firm} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-text-secondary px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
