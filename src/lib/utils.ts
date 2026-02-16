import { type ClassValue } from 'clsx';

/** Merge class names (placeholder until clsx + tailwind-merge installed) */
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

/** Format currency */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: value >= 1_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

/** Format AUM */
export function formatAUM(aum: number): string {
  if (aum >= 1_000_000_000) return `$${(aum / 1_000_000_000).toFixed(1)}B`;
  if (aum >= 1_000_000) return `$${(aum / 1_000_000).toFixed(1)}M`;
  if (aum >= 1_000) return `$${(aum / 1_000).toFixed(0)}K`;
  return `$${aum}`;
}

/** Generate firm slug */
export function firmSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
