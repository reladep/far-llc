'use client';

import { cn } from '@/lib/utils';
import type { FirmTableColumn, SortState } from './types';

interface FirmTableHeaderProps<T> {
  logoWidth: string;
  columns: FirmTableColumn<T>[];
  sortState: SortState;
  onSort: (key: string) => void;
}

function sortArrow(sortState: SortState, key: string): string {
  if (sortState.key !== key) return '↕';
  return sortState.direction === 'desc' ? '↓' : '↑';
}

export default function FirmTableHeader<T>({
  logoWidth,
  columns,
  sortState,
  onSort,
}: FirmTableHeaderProps<T>) {
  const gridTemplate = `${logoWidth} 1fr ${columns.map(c => c.width).join(' ')}`;

  return (
    <div
      className="hidden md:grid items-center mb-0 border border-transparent"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {/* Logo spacer */}
      <div style={{ width: parseInt(logoWidth) }} />

      {/* Firm name header */}
      <button
        onClick={() => onSort('alpha')}
        className={cn(
          'px-3 flex items-center gap-1 transition-colors cursor-pointer',
          sortState.key === 'alpha' ? 'text-[#2DBD74]' : 'text-[#5A7568] hover:text-[#0C1810]'
        )}
      >
        <span className="text-[10px] uppercase tracking-[0.08em] font-semibold font-mono">Firm</span>
        <span className="text-[10px]">{sortArrow(sortState, 'alpha')}</span>
      </button>

      {/* Data columns */}
      {columns.map(col => {
        const sortable = col.sortable !== false;
        const isActive = sortState.key === col.key;
        const align = col.align ?? 'center';

        return (
          <button
            key={col.key}
            onClick={sortable ? () => onSort(col.key) : undefined}
            className={cn(
              'flex items-center gap-1 transition-colors',
              align === 'center' && 'justify-center',
              align === 'right' && 'justify-end',
              align === 'left' && 'justify-start',
              sortable && 'cursor-pointer',
              !sortable && 'cursor-default',
              isActive ? 'text-[#2DBD74]' : 'text-[#5A7568] hover:text-[#0C1810]'
            )}
          >
            <span className="text-[10px] uppercase tracking-[0.08em] font-semibold font-mono">{col.label}</span>
            {sortable && <span className="text-[10px]">{sortArrow(sortState, col.key)}</span>}
          </button>
        );
      })}
    </div>
  );
}
