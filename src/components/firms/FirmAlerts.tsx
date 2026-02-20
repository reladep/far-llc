'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle, Badge } from '@/components/ui';

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
  fee_change: '💰 Fee Change',
  aum_change: '📊 AUM Change',
  client_count_change: '👥 Client Change',
  employee_change: '🏢 Employee Change',
  disclosure: '📋 Disclosure',
  news: '📰 News',
  asset_allocation_change: '📈 Allocation Change',
};

const SEVERITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-blue-100 text-blue-800',
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

export default function FirmAlerts({ crd }: { crd: number }) {
  const [alerts, setAlerts] = useState<FirmAlert[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'alerts' | 'news'>('alerts');

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
      <Card padding="md" className="mt-6">
        <div className="h-32 animate-pulse rounded-lg bg-secondary-100" />
      </Card>
    );
  }

  if (!hasContent) return null;

  return (
    <Card padding="md" className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <CardTitle>Activity & News</CardTitle>
        <div className="flex gap-1">
          <button
            onClick={() => setTab('alerts')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              tab === 'alerts'
                ? 'bg-brand-primary text-white'
                : 'text-text-muted hover:bg-secondary-100'
            }`}
          >
            Alerts {alerts.length > 0 && `(${alerts.length})`}
          </button>
          <button
            onClick={() => setTab('news')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              tab === 'news'
                ? 'bg-brand-primary text-white'
                : 'text-text-muted hover:bg-secondary-100'
            }`}
          >
            News {news.length > 0 && `(${news.length})`}
          </button>
        </div>
      </div>

      {tab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No alerts yet for this firm.</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 pb-3 border-b border-border-subtle last:border-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium">
                      {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[alert.severity]}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary">{alert.title}</p>
                  {alert.summary && (
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{alert.summary}</p>
                  )}
                </div>
                <span className="text-[10px] text-text-tertiary whitespace-nowrap mt-1">
                  {timeAgo(alert.detected_at)}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-3">
          {news.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No news articles found.</p>
          ) : (
            news.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block pb-3 border-b border-border-subtle last:border-0 last:pb-0 hover:bg-secondary-50 -mx-2 px-2 py-1 rounded transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary line-clamp-2">{article.title}</p>
                    {article.snippet && (
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{article.snippet}</p>
                    )}
                    <p className="text-[10px] text-text-tertiary mt-1">
                      {article.source && <span>{article.source} · </span>}
                      {article.published_at && timeAgo(article.published_at)}
                    </p>
                  </div>
                  <span className="text-text-muted text-xs mt-0.5">↗</span>
                </div>
              </a>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
