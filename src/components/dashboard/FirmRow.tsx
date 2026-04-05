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
  /** Content rendered after the score ring (e.g. match %, date, actions) */
  trailing?: ReactNode;
  /** Extra CSS classes on the row */
  className?: string;
}

/* ── Helpers ── */

const CIRC = 2 * Math.PI * 15; // r=15 → ~94.25

function scoreColor(v: number): string {
  return v >= 70 ? '#2DBD74' : v >= 50 ? '#F59E0B' : '#EF4444';
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

  /* Mini score ring */
  .fr-ring { position:relative; width:36px; height:36px; flex-shrink:0; }
  .fr-ring svg { transform:rotate(-90deg); }
  .fr-ring-label {
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    font-family:var(--serif); font-size:12px; font-weight:700; line-height:1;
  }
  .fr-ring-na {
    width:36px; height:36px; flex-shrink:0;
    display:grid; place-items:center;
    font-family:var(--serif); font-size:10px; color:var(--ink-3);
    background:var(--white); border-radius:50%;
  }
`;

/* ── Component ── */

export default function FirmRow({ firm, leading, trailing, className }: FirmRowProps) {
  const location = [firm.city, firm.state].filter(Boolean).join(', ');

  const renderScore = () => {
    if (firm.visorScore == null) {
      return <div className="fr-ring-na">—</div>;
    }
    const s = Math.min(Math.max(Math.round(firm.visorScore), 0), 100);
    const col = scoreColor(s);
    const offset = CIRC * (1 - s / 100);
    return (
      <span className="fr-ring">
        <svg width="36" height="36" viewBox="0 0 38 38">
          <circle cx="19" cy="19" r="15" fill="none" stroke="rgba(0,0,0,.06)" strokeWidth="3" />
          <circle cx="19" cy="19" r="15" fill="none" stroke={col} strokeWidth="3"
            strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className="fr-ring-label" style={{ color: col }}>{s}</span>
      </span>
    );
  };

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
      {renderScore()}
      {trailing}
    </div>
  );
}
