'use client';

import { useState, useEffect } from 'react';

interface FirmAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  summary: string;
  detail: Record<string, unknown>;
  detected_at: string;
  source: string;
}

interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string;
  snippet: string;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  fee_change: 'Fee Change',
  aum_change: 'AUM Change',
  client_count_change: 'Client Change',
  employee_change: 'Employee Change',
  disclosure: 'Disclosure',
  news: 'News',
  asset_allocation_change: 'Allocation Change',
};

const SEVERITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#1A7A4A',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const CSS = `
  .fa-wrap {
    --green:#1A7A4A; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568;
    --rule:#CAD8D0; --amber:#F59E0B; --red:#EF4444;
    --serif:'Cormorant Garamond',serif; --sans:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
  }
  .fa-tabs {
    display:flex; gap:4px; margin-bottom:20px;
    border-bottom:1px solid var(--rule); padding-bottom:0;
  }
  .fa-tab {
    font-family:var(--sans); font-size:11px; font-weight:600; letter-spacing:.04em;
    padding:8px 14px; border:none; background:none; cursor:pointer; color:var(--ink-3);
    border-bottom:2px solid transparent; margin-bottom:-1px;
    transition:color .15s, border-color .15s;
  }
  .fa-tab:hover { color:var(--ink-2); }
  .fa-tab.active { color:var(--ink); border-bottom-color:var(--green); }
  .fa-empty {
    padding:32px 0; text-align:center;
    font-family:var(--mono); font-size:12px; color:var(--ink-3);
  }
  .fa-item {
    display:grid; grid-template-columns:1fr auto;
    gap:12px; align-items:start;
    padding:14px 0; border-bottom:1px solid var(--rule);
  }
  .fa-item:last-child { border-bottom:none; }
  .fa-item-meta { display:flex; align-items:center; gap:8px; margin-bottom:5px; }
  .fa-badge {
    font-family:var(--mono); font-size:8px; font-weight:600; letter-spacing:.12em;
    text-transform:uppercase; padding:2px 7px; border:1px solid currentColor;
    border-radius:0;
  }
  .fa-severity {
    font-family:var(--mono); font-size:8px; font-weight:600; letter-spacing:.10em;
    text-transform:uppercase; padding:2px 7px;
    border-radius:2px;
  }
  .fa-title { font-size:13px; color:var(--ink); font-weight:500; line-height:1.4; }
  .fa-summary { font-size:11px; color:var(--ink-3); margin-top:3px; line-height:1.6; }
  .fa-date { font-family:var(--mono); font-size:10px; color:var(--ink-3); white-space:nowrap; margin-top:2px; }
  .fa-news-item {
    display:grid; grid-template-columns:1fr auto;
    gap:12px; align-items:start;
    padding:14px 0; border-bottom:1px solid var(--rule);
    text-decoration:none; transition:opacity .15s;
  }
  .fa-news-item:last-child { border-bottom:none; }
  .fa-news-item:hover { opacity:.7; }
  .fa-news-title { font-size:13px; color:var(--ink); font-weight:500; line-height:1.45; margin-bottom:4px; }
  .fa-news-snippet { font-size:11px; color:var(--ink-3); line-height:1.6; margin-bottom:4px; }
  .fa-news-source { font-family:var(--mono); font-size:10px; color:var(--ink-3); }
  .fa-arrow { font-size:12px; color:var(--ink-3); margin-top:2px; }
  .fa-spinner {
    padding:32px 0; text-align:center; font-family:var(--mono); font-size:11px; color:var(--ink-3);
  }
`;

export default function FirmAlerts({ crd }: { crd: number }) {
  const [alerts, setAlerts] = useState<FirmAlert[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'filings' | 'news' | 'ownership'>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [alertsRes, newsRes] = await Promise.all([
        fetch(`/api/alerts/firm/${crd}?limit=10`),
        fetch(`/api/alerts/news/${crd}?limit=10`),
      ]);

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }
      if (newsRes.ok) {
        const data = await newsRes.json();
        setNews(data.articles || []);
      }
      setLoading(false);
    }
    load();
  }, [crd]);

  const hasContent = alerts.length > 0 || news.length > 0;

  if (loading) {
    return (
      <div className="fa-wrap">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="fa-spinner">Loading activity…</div>
      </div>
    );
  }

  if (!hasContent) return null;

  const filteredAlerts = tab === 'all'
    ? alerts
    : tab === 'filings'
    ? alerts.filter(a => ['disclosure', 'fee_change', 'aum_change'].includes(a.alert_type))
    : tab === 'ownership'
    ? alerts.filter(a => ['employee_change', 'client_count_change'].includes(a.alert_type))
    : [];

  const showNews = tab === 'all' || tab === 'news';
  const newsItems = showNews ? news : [];
  const alertsToShow = tab === 'news' ? [] : filteredAlerts;

  return (
    <div className="fa-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Tab row */}
      <div className="fa-tabs">
        {(['all', 'filings', 'news', 'ownership'] as const).map(t => {
          const labels: Record<string, string> = {
            all: `All${alerts.length + news.length > 0 ? ` (${alerts.length + news.length})` : ''}`,
            filings: 'SEC Filings',
            news: `News${news.length > 0 ? ` (${news.length})` : ''}`,
            ownership: 'Ownership',
          };
          return (
            <button key={t} className={`fa-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* Alert items */}
      {alertsToShow.length === 0 && newsItems.length === 0 ? (
        <div className="fa-empty">No activity in this category.</div>
      ) : (
        <>
          {alertsToShow.map((alert) => {
            const sevColor = SEVERITY_COLORS[alert.severity] || '#5A7568';
            return (
              <div key={alert.id} className="fa-item">
                <div>
                  <div className="fa-item-meta">
                    <span className="fa-badge" style={{ color: 'var(--ink-3)', borderColor: 'var(--rule)' }}>
                      {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                    </span>
                    {alert.severity && (
                      <span
                        className="fa-severity"
                        style={{
                          background: sevColor + '18',
                          color: sevColor,
                        }}
                      >
                        {alert.severity}
                      </span>
                    )}
                  </div>
                  <div className="fa-title">{alert.title}</div>
                  {alert.summary && <div className="fa-summary">{alert.summary}</div>}
                </div>
                <div className="fa-date">{timeAgo(alert.detected_at)}</div>
              </div>
            );
          })}

          {/* News items */}
          {newsItems.map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="fa-news-item"
            >
              <div>
                <div className="fa-news-title">{article.title}</div>
                {article.snippet && <div className="fa-news-snippet">{article.snippet}</div>}
                <div className="fa-news-source">
                  {article.source && <span>{article.source} · </span>}
                  {article.published_at && timeAgo(article.published_at)}
                </div>
              </div>
              <span className="fa-arrow">↗</span>
            </a>
          ))}
        </>
      )}
    </div>
  );
}
