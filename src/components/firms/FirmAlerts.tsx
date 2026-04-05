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

/** Decode HTML entities, strip tags, emojis, and clean up API text */
function sanitizeText(raw: string): string {
  if (!raw) return '';
  let text = raw;
  for (let i = 0; i < 2; i++) {
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;?/g, ' ');
  }
  text = text.replace(/<[^>]*>/g, '').replace(/<[^>]*$/g, '');
  // Strip emoji characters
  text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '');
  text = text.replace(/\s{2,}/g, ' ').trim();
  return text;
}

/** Check if snippet is essentially the same as the title */
function isSnippetRedundant(title: string, snippet: string): boolean {
  const cleanTitle = sanitizeText(title).toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanSnippet = sanitizeText(snippet).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleanSnippet || !cleanTitle) return true;
  return cleanSnippet.startsWith(cleanTitle) || cleanTitle.startsWith(cleanSnippet) ||
    cleanSnippet === cleanTitle;
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

/** Group consecutive alerts of the same type into collapsed groups */
interface AlertGroup {
  type: 'single' | 'collapsed';
  alerts: FirmAlert[];
}

function groupAlerts(alerts: FirmAlert[]): AlertGroup[] {
  // Group all alerts with the same type + normalized title (not just consecutive)
  const buckets = new Map<string, FirmAlert[]>();
  const order: string[] = [];
  for (const alert of alerts) {
    const key = `${alert.alert_type}:${alert.title.toLowerCase().trim()}`;
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)!.push(alert);
  }

  const groups: AlertGroup[] = [];
  for (const key of order) {
    const bucket = buckets.get(key)!;
    if (bucket.length >= 3) {
      groups.push({ type: 'collapsed', alerts: bucket });
    } else {
      for (const alert of bucket) {
        groups.push({ type: 'single', alerts: [alert] });
      }
    }
  }
  return groups;
}

const CSS = `
  .fa-card {
    background:#fff; border:0.5px solid var(--rule); border-radius:9px; overflow:hidden;
  }
  .fa-tabs {
    display:flex; gap:0; padding:0 20px;
    border-bottom:1px solid var(--rule);
  }
  .fa-tab {
    font-family:var(--sans); font-size:13px; font-weight:500;
    padding:10px 14px; border:none; background:none; cursor:pointer; color:var(--ink-3);
    border-bottom:2px solid transparent; margin-bottom:-1px;
    transition:color .15s, border-color .15s;
  }
  .fa-tab:hover { color:var(--ink-2); }
  .fa-tab.active { color:var(--ink); border-bottom-color:var(--green); }
  .fa-tab-count {
    font-family:var(--mono); font-size:10px; color:var(--ink-3); margin-left:4px;
  }
  .fa-body { padding:0 20px; }
  .fa-empty {
    padding:32px 0; text-align:center;
    font-family:var(--mono); font-size:10px; color:var(--ink-3);
  }
  .fa-item {
    display:grid; grid-template-columns:1fr auto;
    gap:12px; align-items:start;
    padding:14px 0; border-bottom:1px solid var(--rule);
    transition:background .12s; margin:0 -20px; padding-left:20px; padding-right:20px;
  }
  .fa-item:last-child { border-bottom:none; }
  .fa-item:hover { background:var(--white); }
  .fa-item-meta { display:flex; align-items:center; gap:8px; margin-bottom:5px; }
  .fa-badge {
    font-family:var(--mono); font-size:10px; font-weight:600; letter-spacing:.12em;
    text-transform:uppercase; padding:2px 7px; border:1px solid var(--rule);
    color:var(--ink-3);
  }
  .fa-severity {
    font-family:var(--mono); font-size:10px; font-weight:600; letter-spacing:.10em;
    text-transform:uppercase; padding:2px 7px;
    border:1px solid currentColor; border-radius:0;
  }
  .fa-title { font-family:var(--sans); font-size:13px; color:var(--ink); font-weight:500; line-height:1.4; }
  .fa-summary { font-family:var(--sans); font-size:13px; color:var(--ink-3); margin-top:3px; line-height:1.6; }
  .fa-date { font-family:var(--mono); font-size:10px; color:var(--ink-3); white-space:nowrap; margin-top:2px; }

  /* Collapsed group */
  .fa-collapsed {
    display:grid; grid-template-columns:1fr auto;
    gap:12px; align-items:center;
    padding:12px 20px; border-bottom:1px solid var(--rule);
    margin:0 -20px; cursor:pointer; transition:background .12s;
  }
  .fa-collapsed:hover { background:var(--white); }
  .fa-collapsed-left { display:flex; align-items:center; gap:10px; }
  .fa-collapsed-count {
    font-family:var(--mono); font-size:10px; font-weight:600; color:#fff;
    background:var(--ink-3); min-width:18px; height:18px; border-radius:9px;
    display:inline-flex; align-items:center; justify-content:center; padding:0 6px;
  }
  .fa-collapsed-label { font-family:var(--sans); font-size:13px; color:var(--ink-2); }
  .fa-collapsed-range { font-family:var(--mono); font-size:10px; color:var(--ink-3); }

  /* News items */
  .fa-news-item {
    display:grid; grid-template-columns:1fr auto;
    gap:12px; align-items:start;
    padding:14px 20px; border-bottom:1px solid var(--rule);
    text-decoration:none; transition:background .12s;
    margin:0 -20px;
  }
  .fa-news-item:last-child { border-bottom:none; }
  .fa-news-item:hover { background:var(--white); }
  .fa-news-title { font-family:var(--sans); font-size:13px; color:var(--ink); font-weight:500; line-height:1.45; margin-bottom:4px; }
  .fa-news-snippet { font-family:var(--sans); font-size:13px; color:var(--ink-3); line-height:1.6; margin-bottom:4px; }
  .fa-news-source { font-family:var(--mono); font-size:10px; color:var(--ink-3); }
  .fa-arrow { font-size:12px; color:var(--ink-3); margin-top:2px; }

  /* Footer */
  .fa-footer {
    display:flex; align-items:center; justify-content:center;
    padding:8px 24px; border-top:1px solid var(--rule);
    font-family:var(--mono); font-size:10px; color:var(--ink-3);
  }

  /* Loading */
  .fa-spinner {
    padding:32px 0; text-align:center; font-family:var(--mono); font-size:10px; color:var(--ink-3);
  }
`;

export default function FirmAlerts({ crd }: { crd: number }) {
  const [alerts, setAlerts] = useState<FirmAlert[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'filings' | 'news' | 'ownership'>('all');
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);

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
      <div>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="fa-card">
          <div className="fa-spinner">Loading activity...</div>
        </div>
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
  // Client-side dedup safety net for news
  const dedupedNews = (() => {
    const seen = new Set<string>();
    return news.filter(a => {
      const key = a.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();
  const newsItems = showNews ? dedupedNews : [];
  const alertsToShow = tab === 'news' ? [] : filteredAlerts;
  const alertGroups = groupAlerts(alertsToShow);

  const totalCount = alerts.length + dedupedNews.length;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fa-card">
        {/* Tab row */}
        <div className="fa-tabs">
          {(['all', 'filings', 'news', 'ownership'] as const).map(t => {
            const counts: Record<string, number> = {
              all: totalCount,
              filings: alerts.filter(a => ['disclosure', 'fee_change', 'aum_change'].includes(a.alert_type)).length,
              news: dedupedNews.length,
              ownership: alerts.filter(a => ['employee_change', 'client_count_change'].includes(a.alert_type)).length,
            };
            const labels: Record<string, string> = {
              all: 'All',
              filings: 'SEC Filings',
              news: 'News',
              ownership: 'Ownership',
            };
            return (
              <button key={t} className={`fa-tab${tab === t ? ' active' : ''}`} onClick={() => { setTab(t); setExpandedGroup(null); }}>
                {labels[t]}
                {counts[t] > 0 && <span className="fa-tab-count">({counts[t]})</span>}
              </button>
            );
          })}
        </div>

        <div className="fa-body">
          {/* Alert items */}
          {alertGroups.length === 0 && newsItems.length === 0 ? (
            <div className="fa-empty">No activity in this category.</div>
          ) : (
            <>
              {alertGroups.map((group, gi) => {
                if (group.type === 'collapsed') {
                  const first = group.alerts[0];
                  const last = group.alerts[group.alerts.length - 1];
                  const isExpanded = expandedGroup === gi;
                  const sevColor = SEVERITY_COLORS[first.severity] || '#5A7568';

                  return (
                    <div key={`group-${gi}`}>
                      <div className="fa-collapsed" onClick={() => setExpandedGroup(isExpanded ? null : gi)}>
                        <div className="fa-collapsed-left">
                          <span className="fa-badge">
                            {ALERT_TYPE_LABELS[first.alert_type] || first.alert_type}
                          </span>
                          {first.severity && (
                            <span className="fa-severity" style={{ color: sevColor }}>
                              {first.severity}
                            </span>
                          )}
                          <span className="fa-collapsed-count">{group.alerts.length}</span>
                          <span className="fa-collapsed-label">{first.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="fa-collapsed-range">{timeAgo(last.detected_at)} – {timeAgo(first.detected_at)}</span>
                          <svg
                            width="12" height="12" fill="none" stroke="var(--ink-3)" strokeWidth="1.5"
                            viewBox="0 0 12 12"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}
                          >
                            <path d="M2 4l4 4 4-4" />
                          </svg>
                        </div>
                      </div>
                      {isExpanded && group.alerts.map((alert) => {
                        const aSevColor = SEVERITY_COLORS[alert.severity] || '#5A7568';
                        return (
                          <div key={alert.id} className="fa-item">
                            <div>
                              <div className="fa-item-meta">
                                <span className="fa-badge">
                                  {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                                </span>
                                {alert.severity && (
                                  <span className="fa-severity" style={{ color: aSevColor }}>
                                    {alert.severity}
                                  </span>
                                )}
                              </div>
                              <div className="fa-title">{sanitizeText(alert.title)}</div>
                              {alert.summary && <div className="fa-summary">{sanitizeText(alert.summary)}</div>}
                            </div>
                            <div className="fa-date">{timeAgo(alert.detected_at)}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Single alert
                const alert = group.alerts[0];
                const sevColor = SEVERITY_COLORS[alert.severity] || '#5A7568';
                return (
                  <div key={alert.id} className="fa-item">
                    <div>
                      <div className="fa-item-meta">
                        <span className="fa-badge">
                          {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                        </span>
                        {alert.severity && (
                          <span className="fa-severity" style={{ color: sevColor }}>
                            {alert.severity}
                          </span>
                        )}
                      </div>
                      <div className="fa-title">{sanitizeText(alert.title)}</div>
                      {alert.summary && <div className="fa-summary">{sanitizeText(alert.summary)}</div>}
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
                    <div className="fa-item-meta" style={{ marginBottom: 5 }}>
                      <span className="fa-badge">News</span>
                    </div>
                    <div className="fa-news-title">{sanitizeText(article.title)}</div>
                    {article.snippet && !isSnippetRedundant(article.title, article.snippet) && (
                      <div className="fa-news-snippet">{sanitizeText(article.snippet)}</div>
                    )}
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

        <div className="fa-footer">Source: SEC EDGAR filings · Industry news aggregation</div>
      </div>
    </div>
  );
}
