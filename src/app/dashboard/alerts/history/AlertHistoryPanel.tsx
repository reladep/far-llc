'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { WatchedFirm } from './page';
import '@/components/dashboard/dashboard.css';

interface AlertEvent {
  id: string;
  crd: number;
  firmName: string;
  alertType: string;
  severity: string;
  title: string;
  summary: string;
  detectedAt: string;
}

const ALERT_TYPE_OPTIONS = [
  { value: 'fee_change', label: 'Fees' },
  { value: 'aum_change', label: 'AUM' },
  { value: 'disclosure', label: 'Disclosures' },
  { value: 'news', label: 'News' },
  { value: 'client_count_change', label: 'Clients' },
  { value: 'employee_change', label: 'Staff' },
  { value: 'score_change', label: 'Score' },
  { value: 'asset_allocation_change', label: 'Allocation' },
];

const SEVERITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const SEVERITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#2DBD74',
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  fee_change: 'Fees',
  aum_change: 'AUM',
  disclosure: 'Disclosures',
  news: 'News',
  client_count_change: 'Clients',
  employee_change: 'Staff',
  score_change: 'Score',
  asset_allocation_change: 'Allocation',
};

type SortKey = 'date' | 'date_asc' | 'firm' | 'firm_desc' | 'type' | 'type_desc' | 'severity_high' | 'severity_low';

const CSS = `
  .ah-filters {
    background:#fff; border:1px solid var(--rule); padding:16px 20px;
    margin-bottom:16px; display:flex; flex-wrap:wrap; gap:14px; align-items:flex-end;
  }
  .ah-filter-group { display:flex; flex-direction:column; gap:4px; }
  .ah-filter-label {
    font-family:var(--mono); font-size:9px; font-weight:600;
    letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3);
  }
  .ah-filter-row { display:flex; gap:0; border:1px solid var(--rule); }
  .ah-filter-btn {
    font-size:11px; font-weight:500; font-family:var(--sans);
    padding:6px 12px; cursor:pointer; background:#fff;
    border:none; border-right:1px solid var(--rule);
    color:var(--ink-3); transition:all .12s; white-space:nowrap;
  }
  .ah-filter-btn:last-child { border-right:none; }
  .ah-filter-btn:hover:not(.on) { background:var(--white); color:var(--ink); }
  .ah-filter-btn.on { background:var(--navy); color:#fff; }
  .ah-clear {
    font-size:11px; font-family:var(--sans); font-weight:500;
    color:var(--ink-3); background:none; border:1px solid var(--rule);
    padding:6px 12px; cursor:pointer; transition:all .12s;
    align-self:flex-end;
  }
  .ah-clear:hover { border-color:var(--ink-3); color:var(--ink); }

  /* Firm select dropdown */
  .ah-firm-select {
    font-size:11px; font-family:var(--sans); font-weight:500;
    padding:6px 28px 6px 10px; background:#fff; border:1px solid var(--rule);
    color:var(--ink-3); cursor:pointer; transition:all .12s;
    appearance:none; -webkit-appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235A7568' stroke-width='1.2' fill='none'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 8px center;
  }
  .ah-firm-select:hover { border-color:var(--ink-3); color:var(--ink); }
  .ah-firm-select:focus { outline:none; border-color:var(--green); }

  /* Table grid */
  .ah-table { border:1px solid var(--rule); display:flex; flex-direction:column; }

  /* Column header row */
  .ah-header-row {
    display:grid; grid-template-columns:110px 1fr 90px 80px;
    border-bottom:1px solid var(--rule); background:var(--white);
  }
  .ah-col-btn {
    display:flex; align-items:center; justify-content:flex-start; gap:4px;
    padding:8px 14px; cursor:pointer; border:none; background:none;
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.08em; text-transform:uppercase;
    color:var(--ink-3); transition:color .12s; white-space:nowrap;
  }
  .ah-col-btn:hover { color:var(--ink); }
  .ah-col-btn.active { color:var(--green); }
  .ah-col-btn.center { justify-content:center; }
  .ah-col-arrow { font-size:10px; }

  /* Event rows */
  .ah-row {
    display:grid; grid-template-columns:110px 1fr 90px 80px;
    align-items:start; background:#fff; padding:0;
    border-bottom:1px solid var(--rule); transition:background .1s;
  }
  .ah-row:last-child { border-bottom:none; }
  .ah-row:hover { background:#f7faf8; }
  .ah-cell { padding:12px 14px; font-size:12px; color:var(--ink-3); }
  .ah-cell-date { font-family:var(--mono); font-size:10px; color:var(--rule); padding-top:14px; }
  .ah-cell-main { padding:12px 14px; }
  .ah-event-title { font-size:13px; font-weight:500; color:var(--ink); margin-bottom:2px; }
  .ah-event-firm {
    font-size:11px; color:var(--ink-3); text-decoration:none; transition:color .12s;
  }
  .ah-event-firm:hover { color:var(--green); }
  .ah-event-summary { font-size:12px; color:var(--ink-3); margin-top:4px; line-height:1.5; }
  .ah-cell-type {
    display:flex; align-items:center; justify-content:center; gap:6px; padding-top:14px;
  }
  .ah-type-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .ah-type-label {
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.08em; text-transform:uppercase; color:var(--ink-3);
  }
  .ah-cell-severity {
    padding-top:14px; font-family:var(--mono); font-size:10px;
    font-weight:600; letter-spacing:.08em; text-transform:uppercase;
    text-align:center;
  }

  /* Pagination */
  .ah-pagination {
    display:flex; flex-direction:column; align-items:center;
    gap:12px; padding-top:20px; margin-top:8px; border-top:1px solid var(--rule);
  }
  .ah-page-nums { display:flex; align-items:center; gap:3px; }
  .ah-page-btn {
    height:28px; width:28px; display:flex; align-items:center; justify-content:center;
    border:1px solid var(--rule); background:#fff; color:var(--ink-3);
    font-size:11px; cursor:pointer; transition:all .12s; font-family:var(--sans);
  }
  .ah-page-btn:hover:not(.on):not(:disabled) { border-color:var(--ink-3); color:var(--ink); }
  .ah-page-btn.on { border-color:rgba(45,189,116,.5); background:rgba(45,189,116,.08); color:var(--green); }
  .ah-page-btn:disabled { opacity:.2; cursor:not-allowed; }
  .ah-page-ellipsis {
    height:28px; width:28px; display:flex; align-items:center; justify-content:center;
    font-size:11px; color:var(--rule);
  }
  .ah-per-page { display:flex; align-items:center; gap:8px; }
  .ah-per-label {
    font-family:var(--mono); font-size:10px; letter-spacing:.12em;
    text-transform:uppercase; color:var(--ink-3);
  }
  .ah-per-btn {
    height:24px; padding:0 8px; font-size:11px; border:1px solid var(--rule);
    background:#fff; color:var(--ink-3); cursor:pointer; transition:all .12s;
    font-family:var(--sans);
  }
  .ah-per-btn:hover:not(.on) { border-color:var(--ink-3); color:var(--ink); }
  .ah-per-btn.on { border-color:rgba(45,189,116,.4); background:rgba(45,189,116,.07); color:var(--green); }
  .ah-count {
    font-family:var(--mono); font-size:11px; color:var(--ink-3);
  }

  .ah-back {
    display:inline-flex; align-items:center; gap:6px;
    font-size:11px; font-family:var(--sans); font-weight:500;
    color:var(--ink-3); text-decoration:none; transition:color .12s;
    margin-bottom:16px;
  }
  .ah-back:hover { color:var(--green); }

  @media(max-width:640px){
    .ah-filters { flex-direction:column; align-items:stretch; }
    .ah-filter-row { flex-wrap:wrap; }
    .ah-filter-btn { padding:8px 14px; font-size:12px; }
    .ah-header-row { display:none; }
    .ah-row {
      display:flex; flex-direction:column; gap:0; padding:12px 16px;
    }
    .ah-cell { padding:0; }
    .ah-cell-date { padding:0; margin-bottom:6px; }
    .ah-cell-main { padding:0; }
    .ah-cell-type { padding:0; margin-top:8px; }
    .ah-cell-severity { padding:0; margin-top:4px; }
    .ah-page-btn { height:36px; width:36px; font-size:13px; }
  }
`;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

const SEVERITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

interface AlertHistoryPanelProps {
  watchedFirms: WatchedFirm[];
}

export default function AlertHistoryPanel({ watchedFirms }: AlertHistoryPanelProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCrd = searchParams.get('crd') ? Number(searchParams.get('crd')) : null;
  const initialType = searchParams.get('type') || null;
  const initialSeverity = searchParams.get('severity') || null;

  const [allAlerts, setAllAlerts] = useState<AlertEvent[]>([]);
  const [firmFilter, setFirmFilter] = useState<number | null>(initialCrd);
  const [typeFilter, setTypeFilter] = useState<string | null>(initialType);
  const [severityFilter, setSeverityFilter] = useState<string | null>(initialSeverity);
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchAllAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/alerts/feed?limit=2000', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setAllAlerts(data.alerts || []);
    } catch { /* silently fail */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllAlerts();
  }, [fetchAllAlerts]);

  const updateURL = useCallback((crd: number | null, type: string | null, severity: string | null) => {
    const params = new URLSearchParams();
    if (crd) params.set('crd', String(crd));
    if (type) params.set('type', type);
    if (severity) params.set('severity', severity);
    const qs = params.toString();
    router.replace(`/dashboard/alerts/history${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [router]);

  // Client-side filtering
  const filteredAlerts = useMemo(() => {
    let result = allAlerts;
    if (firmFilter !== null) result = result.filter(a => a.crd === firmFilter);
    if (typeFilter) result = result.filter(a => a.alertType === typeFilter);
    if (severityFilter) result = result.filter(a => a.severity === severityFilter);
    return result;
  }, [allAlerts, firmFilter, typeFilter, severityFilter]);

  // Client-side sorting
  const sortedAlerts = useMemo(() => {
    const arr = [...filteredAlerts];
    switch (sortBy) {
      case 'date':
        return arr.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
      case 'date_asc':
        return arr.sort((a, b) => new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime());
      case 'firm':
        return arr.sort((a, b) => a.firmName.localeCompare(b.firmName));
      case 'firm_desc':
        return arr.sort((a, b) => b.firmName.localeCompare(a.firmName));
      case 'type':
        return arr.sort((a, b) => a.alertType.localeCompare(b.alertType));
      case 'type_desc':
        return arr.sort((a, b) => b.alertType.localeCompare(a.alertType));
      case 'severity_high':
        return arr.sort((a, b) => (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3));
      case 'severity_low':
        return arr.sort((a, b) => (SEVERITY_RANK[b.severity] ?? 3) - (SEVERITY_RANK[a.severity] ?? 3));
      default:
        return arr;
    }
  }, [filteredAlerts, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedAlerts.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const pageSlice = sortedAlerts.slice(startIdx, startIdx + perPage);

  const handleFilter = (key: 'firm' | 'type' | 'severity', value: number | string | null) => {
    let crd = firmFilter;
    let type = typeFilter;
    let severity = severityFilter;
    if (key === 'firm') crd = value as number | null;
    if (key === 'type') type = value as string | null;
    if (key === 'severity') severity = value as string | null;
    setFirmFilter(crd);
    setTypeFilter(type);
    setSeverityFilter(severity);
    setCurrentPage(1);
    updateURL(crd, type, severity);
  };

  const clearFilters = () => {
    setFirmFilter(null);
    setTypeFilter(null);
    setSeverityFilter(null);
    setCurrentPage(1);
    updateURL(null, null, null);
  };

  const hasActiveFilters = firmFilter !== null || typeFilter !== null || severityFilter !== null;

  // Build truncated page list: 1 ... 4 5 [6] 7 8 ... 78
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
    const delta = 2;
    const left = Math.max(2, safePage - delta);
    const right = Math.min(totalPages - 1, safePage + delta);
    pages.push(1);
    if (left > 2) pages.push('ellipsis-start');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('ellipsis-end');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  }, [safePage, totalPages]);

  const sortCol = (high: SortKey, low: SortKey) => {
    const isHigh = sortBy === high;
    setSortBy(isHigh ? low : high);
  };

  const colActive = (high: SortKey, low: SortKey) => sortBy === high || sortBy === low;
  const colArrow = (high: SortKey, low: SortKey) => {
    if (sortBy === high) return '↓';
    if (sortBy === low) return '↑';
    return '↕';
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <Link href="/dashboard/alerts" className="ah-back">← Back to Alerts</Link>

      <div className="db-panel-eyebrow">Monitoring</div>
      <div className="db-panel-title">Alert History</div>
      <div className="db-panel-sub">Browse all alert events across your watched firms.</div>
      <div className="db-panel-divider" />

      {/* Filters */}
      <div className="ah-filters">
        {watchedFirms.length > 1 && (
          <div className="ah-filter-group">
            <span className="ah-filter-label">Firm</span>
            {watchedFirms.length <= 6 ? (
              <div className="ah-filter-row">
                <button
                  className={`ah-filter-btn${firmFilter === null ? ' on' : ''}`}
                  onClick={() => handleFilter('firm', null)}
                >
                  All
                </button>
                {watchedFirms.map(f => (
                  <button
                    key={f.crd}
                    className={`ah-filter-btn${firmFilter === f.crd ? ' on' : ''}`}
                    onClick={() => handleFilter('firm', f.crd)}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            ) : (
              <select
                className="ah-firm-select"
                value={firmFilter ?? ''}
                onChange={e => handleFilter('firm', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">All Firms ({watchedFirms.length})</option>
                {watchedFirms.map(f => (
                  <option key={f.crd} value={f.crd}>{f.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="ah-filter-group">
          <span className="ah-filter-label">Type</span>
          <div className="ah-filter-row">
            <button
              className={`ah-filter-btn${typeFilter === null ? ' on' : ''}`}
              onClick={() => handleFilter('type', null)}
            >
              All
            </button>
            {ALERT_TYPE_OPTIONS.map(t => (
              <button
                key={t.value}
                className={`ah-filter-btn${typeFilter === t.value ? ' on' : ''}`}
                onClick={() => handleFilter('type', t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ah-filter-group">
          <span className="ah-filter-label">Severity</span>
          <div className="ah-filter-row">
            <button
              className={`ah-filter-btn${severityFilter === null ? ' on' : ''}`}
              onClick={() => handleFilter('severity', null)}
            >
              All
            </button>
            {SEVERITY_OPTIONS.map(s => (
              <button
                key={s.value}
                className={`ah-filter-btn${severityFilter === s.value ? ' on' : ''}`}
                onClick={() => handleFilter('severity', s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <button className="ah-clear" onClick={clearFilters}>Clear Filters</button>
        )}
      </div>

      {/* Results header */}
      <div className="db-toolbar">
        <span className="db-section-label">
          {loading ? 'Loading…' : `${sortedAlerts.length} event${sortedAlerts.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="db-loading">
          <div className="db-spinner" />
          <div className="db-loading-text">Loading alerts…</div>
        </div>
      ) : sortedAlerts.length === 0 ? (
        <div className="db-empty">
          <div className="db-empty-title">No alerts found</div>
          <div className="db-empty-sub">
            {hasActiveFilters
              ? 'No events match your current filters. Try adjusting or clearing them.'
              : 'No alert events have been detected for your watched firms yet.'}
          </div>
          {hasActiveFilters && (
            <button className="db-empty-link" onClick={clearFilters} style={{ border: 'none', cursor: 'pointer' }}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="ah-table">
            {/* Column headers with sort */}
            <div className="ah-header-row">
              <button
                className={`ah-col-btn${colActive('date', 'date_asc') ? ' active' : ''}`}
                onClick={() => sortCol('date', 'date_asc')}
              >
                <span>Date</span>
                <span className="ah-col-arrow">{colArrow('date', 'date_asc')}</span>
              </button>
              <button
                className={`ah-col-btn${colActive('firm', 'firm_desc') ? ' active' : ''}`}
                onClick={() => sortCol('firm', 'firm_desc')}
              >
                <span>Event</span>
                <span className="ah-col-arrow">{colArrow('firm', 'firm_desc')}</span>
              </button>
              <button
                className={`ah-col-btn center${colActive('type', 'type_desc') ? ' active' : ''}`}
                onClick={() => sortCol('type', 'type_desc')}
              >
                <span>Type</span>
                <span className="ah-col-arrow">{colArrow('type', 'type_desc')}</span>
              </button>
              <button
                className={`ah-col-btn center${colActive('severity_high', 'severity_low') ? ' active' : ''}`}
                onClick={() => sortCol('severity_high', 'severity_low')}
              >
                <span>Severity</span>
                <span className="ah-col-arrow">{colArrow('severity_high', 'severity_low')}</span>
              </button>
            </div>

            {/* Rows */}
            {pageSlice.map(alert => (
              <div key={alert.id} className="ah-row">
                <div className="ah-cell ah-cell-date">
                  {formatDate(alert.detectedAt)}
                </div>
                <div className="ah-cell-main">
                  <div className="ah-event-title">{alert.title}</div>
                  <Link href={`/firm/${alert.crd}`} className="ah-event-firm">
                    {alert.firmName}
                  </Link>
                  {alert.summary && (
                    <div className="ah-event-summary">{alert.summary}</div>
                  )}
                </div>
                <div className="ah-cell ah-cell-type">
                  <span
                    className="ah-type-dot"
                    style={{ background: SEVERITY_COLORS[alert.severity] || '#CAD8D0' }}
                  />
                  <span className="ah-type-label">
                    {ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}
                  </span>
                </div>
                <div className="ah-cell ah-cell-severity" style={{ color: SEVERITY_COLORS[alert.severity] || 'var(--ink-3)' }}>
                  {alert.severity}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {sortedAlerts.length > 0 && (
            <div className="ah-pagination">
              {totalPages > 1 && (
                <div className="ah-page-nums">
                  <button
                    className="ah-page-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                  >
                    ←
                  </button>
                  {pageNumbers.map((page, idx) =>
                    typeof page === 'string' ? (
                      <span key={page} className="ah-page-ellipsis">…</span>
                    ) : (
                      <button
                        key={page}
                        className={`ah-page-btn${page === safePage ? ' on' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    className="ah-page-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                  >
                    →
                  </button>
                </div>
              )}

              <div className="ah-per-page">
                <span className="ah-per-label">Per page</span>
                {([25, 50, 100] as const).map(n => (
                  <button
                    key={n}
                    className={`ah-per-btn${perPage === n ? ' on' : ''}`}
                    onClick={() => { setPerPage(n); setCurrentPage(1); }}
                  >
                    {n}
                  </button>
                ))}
                <span className="ah-count">
                  {startIdx + 1}–{Math.min(startIdx + perPage, sortedAlerts.length)} of {sortedAlerts.length}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
