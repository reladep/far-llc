'use client';

import { useState } from 'react';
import Link from 'next/link';
import RemoveFirmButton from '@/components/firms/RemoveFirmButton';

export interface SavedFirm {
  crd: number;
  name: string;
  city: string | null;
  state: string | null;
  aum: string;
  vvs: number | null;
  savedAt: string;
  savedTs: number;
}

interface SavedFirmsPanelProps {
  firms: SavedFirm[];
}

type SortKey = 'date' | 'vvs' | 'aum' | 'name';

function vvsClass(v: number): string {
  return v >= 85 ? 'hi' : v >= 70 ? 'mid' : 'lo';
}

function parseAUMVal(s: string): number {
  const n = parseFloat(s.replace(/[$,BMK]/g, ''));
  if (s.includes('B')) return n * 1e9;
  if (s.includes('M')) return n * 1e6;
  return n || 0;
}

const CSS = `
  .sf-wrap {
    --navy:#0A1C2A; --navy-2:#0F2538;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568; --rule:#CAD8D0;
    --serif:'Cormorant Garamond',serif; --sans:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
  }
  .sf-title { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--ink); letter-spacing:-.02em; margin-bottom:4px; }
  .sf-sub { font-size:13px; color:var(--ink-3); margin-bottom:24px; }
  .sf-divider { height:1px; background:var(--rule); margin-bottom:24px; }

  /* toolbar */
  .sf-toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; gap:12px; flex-wrap:wrap; }
  .sf-sort-group { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  .sf-sort-label { font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-3); font-family:var(--sans); }
  .sf-sort-btn {
    font-size:11px; font-family:var(--sans); padding:5px 11px;
    background:#fff; border:1px solid var(--rule); color:var(--ink-3);
    cursor:pointer; transition:all .12s;
  }
  .sf-sort-btn:hover:not(.on) { border-color:var(--ink-3); color:var(--ink); }
  .sf-sort-btn.on { background:var(--navy); color:#fff; border-color:var(--navy); }

  /* compare bar */
  .sf-cmp-bar { display:none; align-items:center; gap:8px; }
  .sf-cmp-bar.show { display:flex; }
  .sf-cmp-btn {
    font-size:11px; font-family:var(--sans); font-weight:600;
    padding:6px 14px; cursor:pointer; border:none; transition:all .12s;
  }
  .sf-cmp-btn.go { background:var(--green); color:#fff; }
  .sf-cmp-btn.go:hover { background:var(--green-2); }
  .sf-cmp-btn.clear { background:none; border:1px solid var(--rule); color:var(--ink-3); }
  .sf-cmp-btn.clear:hover { border-color:var(--ink-3); color:var(--ink); }

  /* firm list */
  .firm-list { border:1px solid var(--rule); background:var(--rule); display:flex; flex-direction:column; gap:1px; }
  .firm-row {
    background:#fff;
    display:grid;
    grid-template-columns:28px 1fr 42px 100px 80px;
    align-items:center;
    gap:12px;
    padding:13px 16px;
    transition:background .1s;
    cursor:pointer;
  }
  .firm-row:hover { background:#f7faf8; }
  .firm-check input { accent-color:var(--green); width:14px; height:14px; cursor:pointer; }
  .firm-info {}
  .firm-name { font-size:13px; font-weight:600; color:var(--ink); margin-bottom:2px; text-decoration:none; display:block; }
  .firm-name:hover { color:var(--green); }
  .firm-meta { font-family:var(--mono); font-size:10px; color:var(--ink-3); display:flex; gap:8px; flex-wrap:wrap; }
  .vvs-dot {
    width:28px; height:28px; border-radius:50%;
    display:grid; place-items:center;
    font-family:var(--serif); font-size:11px; font-weight:700; flex-shrink:0;
  }
  .vvs-dot.hi { background:var(--green-pale); color:var(--green); }
  .vvs-dot.mid { background:#FEF3C7; color:#B45309; }
  .vvs-dot.lo  { background:#FEE2E2; color:#DC2626; }
  .vvs-dot.na  { background:var(--white); color:var(--ink-3); font-size:9px; }
  .firm-date { font-family:var(--mono); font-size:10px; color:var(--ink-3); text-align:right; }
  .firm-actions { display:flex; justify-content:flex-end; gap:6px; opacity:0; transition:opacity .12s; }
  .firm-row:hover .firm-actions { opacity:1; }
  .f-btn {
    font-size:10px; font-family:var(--sans); padding:3px 9px;
    background:none; border:1px solid var(--rule); color:var(--ink-3);
    cursor:pointer; white-space:nowrap; transition:all .12s;
    text-decoration:none; display:inline-block; line-height:1.5;
  }
  .f-btn:hover { border-color:var(--green); color:var(--green); }

  /* empty state */
  .sf-empty { padding:48px 24px; text-align:center; background:#fff; border:1px solid var(--rule); }
  .sf-empty-title { font-family:var(--serif); font-size:18px; font-weight:700; color:var(--ink); margin-bottom:6px; }
  .sf-empty-sub { font-size:13px; color:var(--ink-3); margin-bottom:16px; }
  .sf-empty-link {
    display:inline-block; font-size:11px; font-weight:600;
    letter-spacing:.07em; text-transform:uppercase;
    background:var(--green); color:#fff; padding:8px 18px; text-decoration:none;
  }
  .sf-empty-link:hover { background:var(--green-2); }

  /* mobile: stack columns */
  @media(max-width:640px){
    .firm-row { grid-template-columns:20px 1fr 36px; }
    .firm-date,.firm-actions { display:none; }
  }
`;

export default function SavedFirmsPanel({ firms }: SavedFirmsPanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Sort
  const sorted = [...firms].sort((a, b) => {
    if (sortKey === 'vvs') return (b.vvs ?? -1) - (a.vvs ?? -1);
    if (sortKey === 'aum') return parseAUMVal(b.aum) - parseAUMVal(a.aum);
    if (sortKey === 'name') return a.name.localeCompare(b.name);
    return b.savedTs - a.savedTs; // date
  });

  const toggleSelect = (crd: number, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(crd); else next.delete(crd);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const compareHref = `/compare?crds=${Array.from(selected).join(',')}`;

  const sorts: { key: SortKey; label: string }[] = [
    { key: 'date', label: 'Date saved' },
    { key: 'vvs',  label: 'VVS Score' },
    { key: 'aum',  label: 'AUM' },
    { key: 'name', label: 'A–Z' },
  ];

  return (
    <div className="sf-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="sf-title">Saved Firms</div>
      <div className="sf-sub">Firms you&apos;ve bookmarked. Click any row to view the full profile.</div>
      <div className="sf-divider" />

      {/* Toolbar */}
      <div className="sf-toolbar">
        <div className="sf-sort-group">
          <span className="sf-sort-label">Sort</span>
          {sorts.map(s => (
            <button
              key={s.key}
              className={`sf-sort-btn${sortKey === s.key ? ' on' : ''}`}
              onClick={() => setSortKey(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className={`sf-cmp-bar${selected.size >= 2 ? ' show' : ''}`}>
          <Link href={compareHref} className="sf-cmp-btn go">Compare Selected</Link>
          <button className="sf-cmp-btn clear" onClick={clearSelection}>Clear</button>
        </div>
      </div>

      {/* Firm list */}
      {firms.length === 0 ? (
        <div className="sf-empty">
          <div className="sf-empty-title">No saved firms yet</div>
          <div className="sf-empty-sub">Search advisors and bookmark any firm to track it here.</div>
          <Link href="/search" className="sf-empty-link">Search Advisors</Link>
        </div>
      ) : (
        <div className="firm-list">
          {sorted.map(firm => (
            <div key={firm.crd} className="firm-row">
              {/* Checkbox */}
              <div className="firm-check" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.has(firm.crd)}
                  onChange={e => toggleSelect(firm.crd, e.target.checked)}
                />
              </div>

              {/* Info */}
              <div className="firm-info">
                <Link href={`/firm/${firm.crd}`} className="firm-name">
                  {firm.name}
                </Link>
                <div className="firm-meta">
                  {(firm.city || firm.state) && (
                    <span>{[firm.city, firm.state].filter(Boolean).join(', ')}</span>
                  )}
                  <span>{firm.aum} AUM</span>
                </div>
              </div>

              {/* VVS dot */}
              {firm.vvs != null ? (
                <div className={`vvs-dot ${vvsClass(firm.vvs)}`}>{firm.vvs}</div>
              ) : (
                <div className="vvs-dot na">—</div>
              )}

              {/* Date */}
              <div className="firm-date">{firm.savedAt}</div>

              {/* Actions */}
              <div className="firm-actions" onClick={e => e.stopPropagation()}>
                <Link href={`/firm/${firm.crd}`} className="f-btn">
                  View →
                </Link>
                <RemoveFirmButton crd={firm.crd} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
