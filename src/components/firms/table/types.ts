import type { ReactNode } from 'react';

/** A single column definition for the firm table */
export interface FirmTableColumn<T> {
  /** Unique key for this column, used for sort state */
  key: string;
  /** Header label text (uppercase mono) */
  label: string;
  /** CSS width for grid-template-columns, e.g. '90px' */
  width: string;
  /** Render cell content given firm data */
  renderCell: (firm: T) => ReactNode;
  /** Whether this column is sortable. Default true */
  sortable?: boolean;
  /** Cell alignment: 'left' | 'center' | 'right'. Default 'center' */
  align?: 'left' | 'center' | 'right';
}

/** Mobile data strip item */
export interface MobileDataItem<T> {
  label: string;
  renderValue: (firm: T) => ReactNode;
}

/** Sort state */
export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

/** Firm info extracted by the consumer for the built-in info column */
export interface FirmInfo {
  name: string;
  city: string;
  state: string;
  logoKey?: string | null;
  /** Optional extra content below location (badges, description) */
  extra?: ReactNode;
}

/** Gate CTA configuration */
export interface GateConfig {
  eyebrowText: string;
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Number of preview rows to show behind blur. Default 4 */
  previewCount?: number;
}
