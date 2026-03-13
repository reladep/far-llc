'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AlertSub } from './page';

interface AlertsPanelProps {
  subs: AlertSub[];
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  fee_change: 'Fees',
  aum_change: 'AUM',
  disclosure: 'Disclosures',
  news: 'News',
  client_count_change: 'Clients',
  employee_change: 'Staff',
};

const CSS = `
  .ap-wrap {
    --navy:#0A1C2A; --navy-2:#0F2538;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568; --rule:#CAD8D0;
    --red:#DC2626;
    --serif:'Cormorant Garamond',serif; --sans:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
  }
  .ap-title { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--ink); letter-spacing:-.02em; margin-bottom:4px; }
  .ap-sub { font-size:13px; color:var(--ink-3); margin-bottom:24px; }
  .ap-divider { height:1px; background:var(--rule); margin-bottom:24px; }

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
    font-family:var(--mono); font-size:8px; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
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
  .alert-remove:hover { color:var(--red); }
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

  /* empty */
  .ap-empty { padding:48px 24px; text-align:center; background:#fff; border:1px solid var(--rule); }
  .ap-empty-title { font-family:var(--serif); font-size:18px; font-weight:700; color:var(--ink); margin-bottom:6px; }
  .ap-empty-sub { font-size:13px; color:var(--ink-3); }
`;

export default function AlertsPanel({ subs: initialSubs }: AlertsPanelProps) {
  const [subs, setSubs] = useState(initialSubs);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const router = useRouter();

  const handleRemove = async (id: string, crd: number) => {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/user/alerts/subscriptions?crd=${crd}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setSubs(prev => prev.filter(s => s.id !== id));
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setRemovingId(null);
    }
  };

  const handleToggle = async (id: string, crd: number, field: 'notifyEmail' | 'notifyInApp', current: boolean) => {
    // Optimistic update
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
      // revert on failure
      setSubs(prev => prev.map(s => s.id === id ? { ...s, [field]: current } : s));
    }
  };

  return (
    <div className="ap-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="ap-title">Alerts</div>
      <div className="ap-sub">Monitor firms for filing changes. Toggle notification preferences per firm.</div>
      <div className="ap-divider" />

      {subs.length === 0 ? (
        <div className="ap-empty">
          <div className="ap-empty-title">No alerts set</div>
          <div className="ap-empty-sub">Add firms from your saved list to start monitoring them.</div>
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

              {/* Email / In-app toggle */}
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
