'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import type { AlertSub, RecentAlert } from './page';
import '@/components/dashboard/dashboard.css';

interface AlertsPanelProps {
  subs: AlertSub[];
  digestFrequency: string;
  recentAlerts: RecentAlert[];
}

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

const SEVERITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#2DBD74',
};

const CSS = `
  /* ── Digest preferences ── */
  .ap-digest { background:#fff; border:1px solid var(--rule); padding:20px; margin-bottom:24px; }
  .ap-digest-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .ap-digest-label {
    font-family:var(--mono); font-size:10px; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3);
  }
  .ap-freq-group { display:flex; gap:0; border:1px solid var(--rule); }
  .ap-freq-btn {
    font-size:11px; font-weight:600; letter-spacing:.04em;
    font-family:var(--sans); padding:7px 14px; cursor:pointer;
    background:#fff; border:none; border-right:1px solid var(--rule);
    color:var(--ink-3); transition:all .12s; white-space:nowrap;
  }
  .ap-freq-btn:last-child { border-right:none; }
  .ap-freq-btn:hover:not(.on) { background:var(--white); color:var(--ink); }
  .ap-freq-btn.on { background:var(--navy); color:#fff; }
  .ap-digest-note {
    font-size:12px; color:var(--ink-3); font-family:var(--sans); margin-top:8px;
  }

  /* ── Recent events feed ── */
  .ap-feed { margin-bottom:24px; }
  .ap-feed-list { border:1px solid var(--rule); display:flex; flex-direction:column; }
  .ap-event {
    background:#fff; padding:14px 18px;
    border-bottom:1px solid var(--rule); transition:background .1s;
  }
  .ap-event:last-child { border-bottom:none; }
  .ap-event:hover { background:#f7faf8; }
  .ap-event-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
  .ap-event-dot {
    width:6px; height:6px; border-radius:50%; flex-shrink:0;
  }
  .ap-event-type {
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.08em; text-transform:uppercase; color:var(--ink-3);
  }
  .ap-event-time {
    font-family:var(--mono); font-size:10px; color:var(--rule); margin-left:auto;
  }
  .ap-event-title { font-size:13px; font-weight:500; color:var(--ink); margin-bottom:2px; }
  .ap-event-firm {
    font-size:11px; color:var(--ink-3); text-decoration:none; transition:color .12s;
  }
  .ap-event-firm:hover { color:var(--green); }
  .ap-event-summary { font-size:12px; color:var(--ink-3); margin-top:4px; }

  /* ── Load more ── */
  .ap-load-more {
    display:block; width:100%; padding:10px;
    font-size:11px; font-family:var(--sans); font-weight:600;
    letter-spacing:.04em; text-transform:uppercase;
    background:#fff; border:1px solid var(--rule); border-top:none;
    color:var(--ink-3); cursor:pointer; transition:all .12s;
  }
  .ap-load-more:hover { background:var(--white); color:var(--ink); }
  .ap-load-more:disabled { opacity:.5; cursor:default; }

  /* ── Subscriptions list ── */
  .alerts-list { border:1px solid var(--rule); display:flex; flex-direction:column; }
  .alert-row {
    background:#fff;
    display:grid;
    grid-template-columns:1fr auto auto;
    align-items:center;
    gap:20px;
    padding:14px 18px;
    border-bottom:1px solid var(--rule);
    transition:background .1s;
  }
  .alert-row:last-child { border-bottom:none; }
  .alert-row:hover { background:#f7faf8; }
  .alert-firm-name { font-size:13px; font-weight:600; color:var(--ink); margin-bottom:2px; text-decoration:none; display:block; }
  .alert-firm-name:hover { color:var(--green); }
  .alert-firm-meta { font-family:var(--mono); font-size:10px; color:var(--ink-3); margin-bottom:6px; }
  .alert-types { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; }
  .alert-type-tag {
    font-family:var(--mono); font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
    padding:2px 6px; background:var(--white); border:1px solid var(--rule); color:var(--ink-3);
  }

  /* notify toggle group */
  .notify-group { display:flex; gap:0; border:1px solid var(--rule); }
  .notify-btn {
    font-size:10px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
    font-family:var(--sans); padding:6px 12px; cursor:pointer;
    background:#fff; border:none; border-right:1px solid var(--rule);
    color:var(--ink-3); transition:all .12s; white-space:nowrap;
  }
  .notify-btn:last-child { border-right:none; }
  .notify-btn:hover:not(.on) { background:var(--white); color:var(--ink); }
  .notify-btn.on { background:var(--navy); color:#fff; }

  /* remove */
  .alert-remove {
    font-size:11px; background:none; border:none; color:var(--rule);
    cursor:pointer; font-family:var(--sans); transition:color .12s; padding:0 4px;
  }
  .alert-remove:hover { color:#DC2626; }
  .alert-remove:disabled { opacity:.4; cursor:default; }

  /* add row */
  .ap-add-row { margin-top:12px; }
  .ap-add-btn {
    font-size:11px; font-family:var(--sans); font-weight:500;
    background:none; border:1px solid var(--rule); color:var(--ink-3);
    padding:8px 16px; cursor:pointer; transition:all .12s; text-decoration:none;
    display:inline-block;
  }
  .ap-add-btn:hover { border-color:var(--green); color:var(--green); }

  /* mobile */
  @media(max-width:640px){
    .alert-row { grid-template-columns:1fr; gap:10px; }
    .notify-group { justify-self:start; }
    .notify-btn { padding:10px 16px; font-size:12px; }
    .alert-remove { justify-self:start; padding:6px 10px; font-size:14px; }
    .ap-freq-group { flex-wrap:wrap; }
    .ap-freq-btn { padding:10px 16px; }
    .ap-load-more { padding:14px; font-size:13px; }
  }
`;

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DIGEST_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'none', label: 'Off' },
];

export default function AlertsPanel({ subs: initialSubs, digestFrequency: initialFreq, recentAlerts }: AlertsPanelProps) {
  const [subs, setSubs] = useState(initialSubs);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState(initialFreq);
  const alerts = recentAlerts;
  const router = useRouter();
  const { toast } = useToast();

  const handleRemove = async (id: string, crd: number) => {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/user/alerts/subscriptions?crd=${crd}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setSubs(prev => prev.filter(s => s.id !== id));
        toast('Alert removed', {
          undo: async () => {
            await fetch('/api/user/alerts/subscriptions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ crd }),
              credentials: 'include',
            });
            router.refresh();
          },
        });
        router.refresh();
      } else {
        toast('Failed to remove alert', { type: 'error' });
      }
    } catch {
      toast('Network error', { type: 'error' });
    } finally {
      setRemovingId(null);
    }
  };

  const handleToggle = async (id: string, crd: number, field: 'notifyEmail' | 'notifyInApp', current: boolean) => {
    setSubs(prev => prev.map(s => s.id === id ? { ...s, [field]: !current } : s));
    try {
      await fetch('/api/user/alerts/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          crd,
          [field === 'notifyEmail' ? 'notify_email' : 'notify_in_app']: !current,
        }),
      });
    } catch {
      setSubs(prev => prev.map(s => s.id === id ? { ...s, [field]: current } : s));
    }
  };

  const handleFrequencyChange = async (newFreq: string) => {
    const oldFreq = frequency;
    setFrequency(newFreq);
    try {
      const res = await fetch('/api/user/alerts/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ digest_frequency: newFreq }),
      });
      if (res.ok) toast('Digest preference updated');
      else { setFrequency(oldFreq); toast('Failed to update preference', { type: 'error' }); }
    } catch {
      setFrequency(oldFreq);
      toast('Network error', { type: 'error' });
    }
  };

  const DIGEST_NOTE: Record<string, string> = {
    daily: 'You\u2019ll receive a summary email every morning.',
    weekly: 'You\u2019ll receive a summary email every Monday.',
    monthly: 'You\u2019ll receive a summary email on the 1st of each month.',
    none: 'Email digests are paused. You\u2019ll still see alerts in your dashboard.',
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="db-panel-eyebrow">Monitoring</div>
      <div className="db-panel-title">Alerts</div>
      <div className="db-panel-sub">Monitor firms for changes. Get notified via email digest or in-app.</div>
      <div className="db-panel-divider" />

      {/* Digest frequency */}
      <div className="ap-digest">
        <div className="ap-digest-header">
          <span className="ap-digest-label">Email Digest</span>
        </div>
        <div className="ap-freq-group">
          {DIGEST_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`ap-freq-btn${frequency === opt.value ? ' on' : ''}`}
              onClick={() => handleFrequencyChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="ap-digest-note">{DIGEST_NOTE[frequency]}</div>
      </div>

      {/* Recent events preview */}
      {alerts.length > 0 && (
        <div className="ap-feed">
          <div className="db-toolbar">
            <span className="db-section-label">Recent Activity</span>
          </div>
          <div className="ap-feed-list">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="ap-event">
                <div className="ap-event-header">
                  <span
                    className="ap-event-dot"
                    style={{ background: SEVERITY_COLORS[alert.severity] || '#CAD8D0' }}
                  />
                  <span className="ap-event-type">
                    {ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}
                  </span>
                  <span className="ap-event-time">{timeAgo(alert.detectedAt)}</span>
                </div>
                <div className="ap-event-title">{alert.title}</div>
                <Link href={`/firm/${alert.crd}`} className="ap-event-firm">
                  {alert.firmName}
                </Link>
                {alert.summary && (
                  <div className="ap-event-summary">{alert.summary}</div>
                )}
              </div>
            ))}
          </div>
          <Link href="/dashboard/alerts/history" className="db-view-all">
            View All Alerts →
          </Link>
        </div>
      )}

      {/* Subscriptions */}
      <div className="db-toolbar" style={{ marginTop: alerts.length > 0 ? 24 : 0 }}>
        <span className="db-section-label">Watched Firms</span>
        {subs.length > 0 && <span className="db-section-count">{subs.length} / 25</span>}
      </div>

      {subs.length === 0 ? (
        <div className="db-empty">
          <div className="db-empty-title">No firms watched</div>
          <div className="db-empty-sub">Add firms from your saved list to start monitoring them for changes.</div>
          <Link href="/dashboard/saved-firms" className="db-empty-link">Browse Saved Firms</Link>
        </div>
      ) : (
        <div className="alerts-list">
          {subs.map(sub => (
            <div key={sub.id} className="alert-row">
              <div>
                <Link href={`/firm/${sub.crd}`} className="alert-firm-name">{sub.name}</Link>
                {sub.meta && <div className="alert-firm-meta">{sub.meta}</div>}
                {sub.alertTypes.length > 0 && (
                  <div className="alert-types">
                    {sub.alertTypes.map(t => (
                      <span key={t} className="alert-type-tag">
                        {ALERT_TYPE_LABELS[t] || t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="notify-group">
                <button
                  className={`notify-btn${sub.notifyEmail ? ' on' : ''}`}
                  onClick={() => handleToggle(sub.id, sub.crd, 'notifyEmail', sub.notifyEmail)}
                  title="Email notifications"
                >
                  Email
                </button>
                <button
                  className={`notify-btn${sub.notifyInApp ? ' on' : ''}`}
                  onClick={() => handleToggle(sub.id, sub.crd, 'notifyInApp', sub.notifyInApp)}
                  title="In-app notifications"
                >
                  In-App
                </button>
              </div>

              <button
                className="alert-remove"
                disabled={removingId === sub.id}
                onClick={() => handleRemove(sub.id, sub.crd)}
                title="Remove alert"
                aria-label={`Remove alert for ${sub.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="ap-add-row">
        <Link href="/dashboard/saved-firms" className="ap-add-btn">
          + Add from Saved Firms
        </Link>
      </div>
    </div>
  );
}
