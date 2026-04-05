'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

/* ── Types ── */

export interface FirmRowData {
  crd: number;
  name: string;
  displayName?: string;
  city: string | null;
  state: string | null;
  aum: string;
  visorScore: number | null;
}

interface FirmRowProps {
  firm: FirmRowData;
  /** Content rendered before the firm info (e.g. checkbox) */
  leading?: ReactNode;
  /** Content rendered after the Visor dot (e.g. match %, date, actions) */
  trailing?: ReactNode;
  /** Extra CSS classes on the row */
  className?: string;
}

/* ── Helpers ── */

function visorClass(v: number): string {
  return v >= 85 ? 'hi' : v >= 70 ? 'mid' : 'lo';
}

/* ── Styles ── */

export const FIRM_ROW_CSS = `
  .fr-list { border:1px solid var(--rule); background:var(--rule); display:flex; flex-direction:column; gap:1px; }
  .fr-row {
    background:#fff; display:grid; align-items:center; gap:12px; padding:13px 16px;
    transition:background .1s; text-decoration:none;
  }
  .fr-row:hover { background:#f7faf8; }
  .fr-name { font-size:13px; font-weight:600; color:var(--ink); margin-bottom:2px; text-decoration:none; display:block; }
  .fr-name:hover { color:var(--green); }
  .fr-meta { font-family:var(--mono); font-size:10px; color:var(--ink-3); display:flex; gap:8px; flex-wrap:wrap; }
  .fr-aum { font-family:var(--mono); font-size:11px; color:var(--ink-3); text-align:right; }
  .fr-visor-dot {
    width:28px; height:28px; border-radius:50%;
    display:grid; place-items:center;
    font-family:var(--serif); font-size:11px; font-weight:700; flex-shrink:0;
  }
  .fr-visor-dot.hi  { background:var(--green-pale); color:var(--green); }
  .fr-visor-dot.mid { background:#FEF3C7; color:#B45309; }
  .fr-visor-dot.lo  { background:#FEE2E2; color:#DC2626; }
  .fr-visor-dot.na  { background:var(--white); color:var(--ink-3); font-size:10px; }
`;

/* ── Component ── */

export default function FirmRow({ firm, leading, trailing, className }: FirmRowProps) {
  const location = [firm.city, firm.state].filter(Boolean).join(', ');

  return (
    <div className={`fr-row${className ? ` ${className}` : ''}`}>
      {leading}
      <div>
        <Link href={`/firm/${firm.crd}`} className="fr-name">
          {firm.displayName || firm.name}
        </Link>
        <div className="fr-meta">
          {location && <span>{location}</span>}
          {firm.aum && <span>{firm.aum} AUM</span>}
        </div>
      </div>
      {firm.visorScore != null ? (
        <div className={`fr-visor-dot ${visorClass(firm.visorScore)}`}>{firm.visorScore}</div>
      ) : (
        <div className="fr-visor-dot na">—</div>
      )}
      {trailing}
    </div>
  );
}
