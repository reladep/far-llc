'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import type { SearchFilters as Filters } from '@/lib/search';

const FEE_TYPES = [
  'Fee-Only',
  'Fee-Based',
  'Commission',
  'Hourly',
  'Flat Fee',
];

const AUM_RANGES: { label: string; value: [number, number] }[] = [
  { label: 'Under $1M', value: [0, 1_000_000] },
  { label: '$1M – $100M', value: [1_000_000, 100_000_000] },
  { label: '$100M – $1B', value: [100_000_000, 1_000_000_000] },
  { label: '$1B+', value: [1_000_000_000, Infinity] },
];

const SPECIALTIES = [
  'Retirement Planning',
  'Tax Planning',
  'Estate Planning',
  'Investment Management',
  'Insurance',
  'College Planning',
  'Small Business',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

interface SearchFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
}

function toggleArrayItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export function SearchFilters({ filters, onChange, onClear }: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    feeTypes: true,
    aum: true,
    specialties: true,
    states: false,
  });

  const toggleSection = (key: string) =>
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }));

  const activeCount =
    filters.feeTypes.length +
    filters.states.length +
    filters.specialties.length +
    (filters.aumRange ? 1 : 0);

  return (
    <aside className="w-full space-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Filters{activeCount > 0 && ` (${activeCount})`}
        </h3>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-xs text-primary hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Fee Type */}
      <FilterSection
        title="Fee Type"
        expanded={expandedSections.feeTypes}
        onToggle={() => toggleSection('feeTypes')}
      >
        {FEE_TYPES.map((ft) => (
          <CheckboxItem
            key={ft}
            label={ft}
            checked={filters.feeTypes.includes(ft)}
            onChange={() => onChange({ ...filters, feeTypes: toggleArrayItem(filters.feeTypes, ft) })}
          />
        ))}
      </FilterSection>

      {/* AUM Range */}
      <FilterSection
        title="Firm AUM"
        expanded={expandedSections.aum}
        onToggle={() => toggleSection('aum')}
      >
        {AUM_RANGES.map((r) => (
          <CheckboxItem
            key={r.label}
            label={r.label}
            checked={
              filters.aumRange !== null &&
              filters.aumRange[0] === r.value[0] &&
              filters.aumRange[1] === r.value[1]
            }
            onChange={() =>
              onChange({
                ...filters,
                aumRange:
                  filters.aumRange?.[0] === r.value[0] && filters.aumRange?.[1] === r.value[1]
                    ? null
                    : r.value,
              })
            }
          />
        ))}
      </FilterSection>

      {/* Specialties */}
      <FilterSection
        title="Specialty"
        expanded={expandedSections.specialties}
        onToggle={() => toggleSection('specialties')}
      >
        {SPECIALTIES.map((s) => (
          <CheckboxItem
            key={s}
            label={s}
            checked={filters.specialties.includes(s)}
            onChange={() =>
              onChange({ ...filters, specialties: toggleArrayItem(filters.specialties, s) })
            }
          />
        ))}
      </FilterSection>

      {/* States */}
      <FilterSection
        title="State"
        expanded={expandedSections.states}
        onToggle={() => toggleSection('states')}
      >
        <div className="max-h-48 overflow-y-auto space-y-1">
          {US_STATES.map((st) => (
            <CheckboxItem
              key={st}
              label={st}
              checked={filters.states.includes(st)}
              onChange={() =>
                onChange({ ...filters, states: toggleArrayItem(filters.states, st) })
              }
            />
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}

/* ── Internal helpers ── */

function FilterSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border pb-3 mb-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-2 text-sm font-medium text-text-primary hover:text-primary"
      >
        {title}
        <span className="text-xs text-text-muted">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
}

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer py-1 text-sm text-text-secondary hover:text-text-primary">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary-400"
      />
      {label}
    </label>
  );
}
