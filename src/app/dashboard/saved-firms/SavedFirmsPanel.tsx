'use client';

import { useState } from 'react';
import Link from 'next/link';
import RemoveFirmButton from '@/components/firms/RemoveFirmButton';
import FirmRow, { FIRM_ROW_CSS } from '@/components/dashboard/FirmRow';
import type { FirmRowData } from '@/components/dashboard/FirmRow';
import '@/components/dashboard/dashboard.css';

export interface SavedFirm {
  crd: number;
  name: string;
  city: string | null;
  state: string | null;
  aum: string;
  vvs: number | null;
  savedAt: string;
  savedTs: number;
  watching: boolean;
}

interface SavedFirmsPanelProps {
  firms: SavedFirm[];
}

type SortKey = 'date' | 'vvs' | 'aum' | 'name';

function parseAUMVal(s: string): number {
  const n = parseFloat(s.replace(/[$,BMK]/g, ''));
  if (s.includes('B')) return n * 1e9;
  if (s.includes('M')) return n * 1e6;
  return n || 0;
}

const CSS = `
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

  /* Saved firms row layout */
  .sf-row { grid-template-columns:28px 1fr 36px 28px 100px 100px; cursor:pointer; }
  .sf-check input { accent-color:var(--green); width:14px; height:14px; cursor:pointer; }
  .sf-watch-btn {
    background:none; border:none; cursor:pointer; padding:2px;
    color:var(--rule); transition:color .12s; display:flex; align-items:center;
  }
  .sf-watch-btn:hover { color:var(--green); }
  .sf-watch-btn.on { color:var(--green); }
  .sf-watch-btn:disabled { opacity:.4; cursor:default; }
  .sf-date { font-family:var(--mono); font-size:10px; color:var(--ink-3); text-align:right; }
  .sf-actions { display:flex; justify-content:flex-end; gap:6px; opacity:0; transition:opacity .12s; }
  .sf-row:hover .sf-actions { opacity:1; }
  .sf-btn {
    font-size:10px; font-family:var(--sans); padding:3px 9px;
    background:none; border:1px solid var(--rule); color:var(--ink-3);
    cursor:pointer; white-space:nowrap; transition:all .12s;
    text-decoration:none; display:inline-block; line-height:1.5;
  }
  .sf-btn:hover { border-color:var(--green); color:var(--green); }

  /* mobile */
  @media(max-width:640px){
    .sf-row { grid-template-columns:20px 1fr 36px 28px; }
    .sf-date,.sf-actions { display:none; }
  }
`;

export default function SavedFirmsPanel({ firms }: SavedFirmsPanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [watchSet, setWatchSet] = useState<Set<number>>(
    () => new Set(firms.filter(f => f.watching).map(f => f.crd))
  );
  const [watchLoading, setWatchLoading] = useState<number | null>(null);

  const handleWatchToggle = async (crd: number) => {
    const isWatching = watchSet.has(crd);
    setWatchLoading(crd);
    try {
      if (isWatching) {
        const res = await fetch(`/api/user/alerts/subscriptions?crd=${crd}`, {
          method: 'DELETE', credentials: 'include',
        });
        if (res.ok) setWatchSet(prev => { const next = new Set(prev); next.delete(crd); return next; });
      } else {
        const res = await fetch('/api/user/alerts/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crd }),
          credentials: 'include',
        });
        if (res.ok) setWatchSet(prev => new Set(prev).add(crd));
      }
    } catch { /* silently fail */ }
    setWatchLoading(null);
  };

  const sorted = [...firms].sort((a, b) => {
    if (sortKey === 'vvs') return (b.vvs ?? -1) - (a.vvs ?? -1);
    if (sortKey === 'aum') return parseAUMVal(b.aum) - parseAUMVal(a.aum);
    if (sortKey === 'name') return a.name.localeCompare(b.name);
    return b.savedTs - a.savedTs;
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
    { key: 'vvs',  label: 'Visor Index' },
    { key: 'aum',  label: 'AUM' },
    { key: 'name', label: 'A–Z' },
  ];

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: FIRM_ROW_CSS + CSS }} />

      <div className="db-panel-eyebrow">Your Watchlist</div>
      <div className="db-panel-title">Saved Firms</div>
      <div className="db-panel-sub">Firms you&apos;ve bookmarked. Click any row to view the full profile.</div>
      <div className="db-panel-divider" />

      {/* Toolbar */}
      <div className="db-toolbar">
        <div className="db-sort-group">
          <span className="db-sort-label">Sort</span>
          {sorts.map(s => (
            <button
              key={s.key}
              className={`db-sort-btn${sortKey === s.key ? ' on' : ''}`}
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
        <div className="db-empty">
          <div className="db-empty-title">No saved firms yet</div>
          <div className="db-empty-sub">Search advisors and bookmark any firm to track it here.</div>
          <Link href="/search" className="db-empty-link">Search Advisors</Link>
        </div>
      ) : (
        <div className="fr-list">
          {sorted.map(firm => {
            const rowData: FirmRowData = {
              crd: firm.crd,
              name: firm.name,
              city: firm.city,
              state: firm.state,
              aum: firm.aum,
              visorScore: firm.vvs,
            };
            return (
              <FirmRow
                key={firm.crd}
                firm={rowData}
                className="sf-row"
                leading={
                  <div className="sf-check" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(firm.crd)}
                      onChange={e => toggleSelect(firm.crd, e.target.checked)}
                    />
                  </div>
                }
                trailing={
                  <>
                    <div onClick={e => e.stopPropagation()}>
                      <button
                        className={`sf-watch-btn${watchSet.has(firm.crd) ? ' on' : ''}`}
                        onClick={() => handleWatchToggle(firm.crd)}
                        disabled={watchLoading === firm.crd}
                        title={watchSet.has(firm.crd) ? 'Alerts enabled — click to disable' : 'Enable alerts'}
                        aria-label={`Toggle alerts for ${firm.name}`}
                      >
                        <svg width="14" height="14" fill={watchSet.has(firm.crd) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" viewBox="0 0 16 16">
                          <path d="M8 1.5c-2.5 0-4.5 2-4.5 4.5v3l-1 1.5h11l-1-1.5v-3c0-2.5-2-4.5-4.5-4.5Z" />
                          <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" />
                        </svg>
                      </button>
                    </div>
                    <div className="sf-date">{firm.savedAt}</div>
                    <div className="sf-actions" onClick={e => e.stopPropagation()}>
                      <Link href={`/firm/${firm.crd}`} className="sf-btn">
                        View →
                      </Link>
                      <RemoveFirmButton crd={firm.crd} />
                    </div>
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
