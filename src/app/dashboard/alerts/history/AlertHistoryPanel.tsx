'use client';

import { useState, useEffect, useCallback } from 'react';
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

  .ah-feed { border:1px solid var(--rule); display:flex; flex-direction:column; }
  .ah-event {
    background:#fff; padding:14px 20px;
    border-bottom:1px solid var(--rule); transition:background .1s;
  }
  .ah-event:last-child { border-bottom:none; }
  .ah-event:hover { background:#f7faf8; }
  .ah-event-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
  .ah-event-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .ah-event-type {
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.08em; text-transform:uppercase; color:var(--ink-3);
  }
  .ah-event-time {
    font-family:var(--mono); font-size:10px; color:var(--rule); margin-left:auto;
  }
  .ah-event-title { font-size:13px; font-weight:500; color:var(--ink); margin-bottom:2px; }
  .ah-event-firm {
    font-size:11px; color:var(--ink-3); text-decoration:none; transition:color .12s;
  }
  .ah-event-firm:hover { color:var(--green); }
  .ah-event-summary { font-size:12px; color:var(--ink-3); margin-top:4px; }

  .ah-load-more {
    display:block; width:100%; padding:12px;
    font-size:11px; font-family:var(--sans); font-weight:600;
    letter-spacing:.04em; text-transform:uppercase;
    background:#fff; border:1px solid var(--rule); border-top:none;
    color:var(--ink-3); cursor:pointer; transition:all .12s;
  }
  .ah-load-more:hover { background:var(--white); color:var(--ink); }
  .ah-load-more:disabled { opacity:.5; cursor:default; }

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

interface AlertHistoryPanelProps {
  watchedFirms: WatchedFirm[];
}

export default function AlertHistoryPanel({ watchedFirms }: AlertHistoryPanelProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCrd = searchParams.get('crd') ? Number(searchParams.get('crd')) : null;
  const initialType = searchParams.get('type') || null;
  const initialSeverity = searchParams.get('severity') || null;

  const [firmFilter, setFirmFilter] = useState<number | null>(initialCrd);
  const [typeFilter, setTypeFilter] = useState<string | null>(initialType);
  const [severityFilter, setSeverityFilter] = useState<string | null>(initialSeverity);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildParams = useCallback((crd: number | null, type: string | null, severity: string | null, cur: string | null) => {
    const params = new URLSearchParams({ limit: '20' });
    if (crd) params.set('crd', String(crd));
    if (type) params.set('type', type);
    if (severity) params.set('severity', severity);
    if (cur) params.set('cursor', cur);
    return params;
  }, []);

  const updateURL = useCallback((crd: number | null, type: string | null, severity: string | null) => {
    const params = new URLSearchParams();
    if (crd) params.set('crd', String(crd));
    if (type) params.set('type', type);
    if (severity) params.set('severity', severity);
    const qs = params.toString();
    router.replace(`/dashboard/alerts/history${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [router]);

  const fetchAlerts = useCallback(async (crd: number | null, type: string | null, severity: string | null, cur: string | null, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const params = buildParams(crd, type, severity, cur);
      const res = await fetch(`/api/user/alerts/feed?${params}`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (append) {
        setAlerts(prev => [...prev, ...data.alerts]);
      } else {
        setAlerts(data.alerts);
      }
      setCursor(data.next_cursor);
      setHasMore(data.has_more);
    } catch { /* silently fail */ }
    setLoading(false);
    setLoadingMore(false);
  }, [buildParams]);

  // Initial load
  useEffect(() => {
    fetchAlerts(initialCrd, initialType, initialSeverity, null, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setAlerts([]);
    setCursor(null);
    setHasMore(false);
    updateURL(crd, type, severity);
    fetchAlerts(crd, type, severity, null, false);
  };

  const clearFilters = () => {
    setFirmFilter(null);
    setTypeFilter(null);
    setSeverityFilter(null);
    setAlerts([]);
    setCursor(null);
    setHasMore(false);
    updateURL(null, null, null);
    fetchAlerts(null, null, null, null, false);
  };

  const hasActiveFilters = firmFilter !== null || typeFilter !== null || severityFilter !== null;

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
          {loading ? 'Loading…' : `${alerts.length} event${alerts.length !== 1 ? 's' : ''}${hasMore ? '+' : ''}`}
        </span>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="db-loading">
          <div className="db-spinner" />
          <div className="db-loading-text">Loading alerts…</div>
        </div>
      ) : alerts.length === 0 ? (
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
          <div className="ah-feed">
            {alerts.map(alert => (
              <div key={alert.id} className="ah-event">
                <div className="ah-event-header">
                  <span
                    className="ah-event-dot"
                    style={{ background: SEVERITY_COLORS[alert.severity] || '#CAD8D0' }}
                  />
                  <span className="ah-event-type">
                    {ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}
                  </span>
                  <span className="ah-event-time">{formatDate(alert.detectedAt)}</span>
                </div>
                <div className="ah-event-title">{alert.title}</div>
                <Link href={`/firm/${alert.crd}`} className="ah-event-firm">
                  {alert.firmName}
                </Link>
                {alert.summary && (
                  <div className="ah-event-summary">{alert.summary}</div>
                )}
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              className="ah-load-more"
              onClick={() => fetchAlerts(firmFilter, typeFilter, severityFilter, cursor, true)}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
