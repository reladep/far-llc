'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { FirmTableColumn, MobileDataItem, SortState, FirmInfo, GateConfig } from './types';
import FirmTableHeader from './FirmTableHeader';
import FirmTableRow from './FirmTableRow';
import FirmTableGate from './FirmTableGate';

const TABLE_CSS = `
@keyframes firmRowFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.firm-row-stagger {
  animation: firmRowFadeIn 0.35s ease-out both;
}
@media (prefers-reduced-motion: reduce) {
  .firm-row-stagger { animation: none; }
}
`;

interface FirmTableProps<T> {
  firms: T[];
  columns: FirmTableColumn<T>[];
  getKey: (firm: T) => number | string;
  getFirmInfo: (firm: T) => FirmInfo;
  renderDetail: (firm: T, isAuthed: boolean | null, isSaved: boolean) => ReactNode;
  mobileData: MobileDataItem<T>[];
  /** Sort comparator — used for uncontrolled sort mode */
  sortComparator?: (state: SortState, a: T, b: T) => number;
  /** Default sort state — used for uncontrolled sort mode */
  defaultSort?: SortState;
  /** Controlled sort state — when provided, table skips internal sorting */
  sortState?: SortState;
  /** Called when user clicks a column header in controlled sort mode */
  onSortChange?: (state: SortState) => void;
  gate?: GateConfig | null;
  isAuthed: boolean | null;
  savedKeys?: Set<number | string>;
  logoWidth?: string;
  displayCount?: number;
  loading?: boolean;
  className?: string;
}

export default function FirmTable<T>({
  firms,
  columns,
  getKey,
  getFirmInfo,
  renderDetail,
  mobileData,
  sortComparator,
  defaultSort,
  sortState: externalSortState,
  onSortChange,
  gate,
  isAuthed,
  savedKeys,
  logoWidth = '56px',
  displayCount,
  loading,
  className,
}: FirmTableProps<T>) {
  const isControlledSort = externalSortState !== undefined;
  const [internalSortState, setInternalSortState] = useState<SortState>(
    defaultSort ?? { key: '', direction: 'desc' }
  );
  const activeSortState = isControlledSort ? externalSortState : internalSortState;
  const [expandedKey, setExpandedKey] = useState<number | string | null>(null);

  const sortedFirms = useMemo(() => {
    if (isControlledSort) return firms; // consumer handles sorting
    if (!sortComparator) return firms;
    const arr = [...firms];
    arr.sort((a, b) => sortComparator(activeSortState, a, b));
    return arr;
  }, [firms, isControlledSort, activeSortState, sortComparator]);

  const displayFirms = displayCount ? sortedFirms.slice(0, displayCount) : sortedFirms;
  const gatedFirms = gate ? displayFirms.slice(0, gate.previewCount ?? 4) : displayFirms;

  const gridTemplate = `${logoWidth} 1fr ${columns.map(c => c.width).join(' ')}`;

  function handleSort(key: string) {
    const prev = activeSortState;
    const next: SortState = prev.key === key
      ? { key, direction: prev.direction === 'desc' ? 'asc' : 'desc' }
      : { key, direction: key === 'alpha' ? 'asc' : 'desc' };

    if (isControlledSort && onSortChange) {
      onSortChange(next);
    } else {
      setInternalSortState(next);
    }
  }

  function toggleExpand(key: number | string) {
    setExpandedKey(prev => prev === key ? null : key);
  }

  if (loading) {
    return (
      <div className={cn('py-20 text-center', className)}>
        <style dangerouslySetInnerHTML={{ __html: TABLE_CSS }} />
        <div className="h-7 w-7 border-2 border-[#CAD8D0] border-t-[#2DBD74] rounded-full animate-spin mx-auto" />
        <p className="text-[13px] text-[#5A7568] mt-4 font-sans">Loading…</p>
      </div>
    );
  }

  if (firms.length === 0) {
    return (
      <div className={cn('py-16 text-center', className)}>
        <style dangerouslySetInnerHTML={{ __html: TABLE_CSS }} />
        <p className="font-serif text-[22px] font-bold text-[#0C1810] mb-2">No results found</p>
        <p className="text-[13px] text-[#5A7568] font-sans">Try adjusting your search criteria.</p>
      </div>
    );
  }

  const rowList = (firmsToRender: T[]) => (
    <div className="border border-[#CAD8D0] border-t-0 bg-[#CAD8D0] flex flex-col gap-[1px]">
      {firmsToRender.map((firm, i) => {
        const key = getKey(firm);
        return (
          <FirmTableRow
            key={key}
            firm={firm}
            index={i}
            gridTemplate={gridTemplate}
            firmInfo={getFirmInfo(firm)}
            columns={columns}
            mobileData={mobileData}
            isExpanded={expandedKey === key}
            onToggle={() => toggleExpand(key)}
            renderDetail={() =>
              renderDetail(firm, isAuthed, savedKeys?.has(key) ?? false)
            }
            logoWidth={logoWidth}
          />
        );
      })}
    </div>
  );

  return (
    <div className={className}>
      <style dangerouslySetInnerHTML={{ __html: TABLE_CSS }} />

      <FirmTableHeader
        logoWidth={logoWidth}
        columns={columns}
        sortState={activeSortState}
        onSort={handleSort}
      />

      {gate ? (
        <FirmTableGate config={gate}>
          {rowList(gatedFirms)}
        </FirmTableGate>
      ) : (
        rowList(displayFirms)
      )}
    </div>
  );
}
