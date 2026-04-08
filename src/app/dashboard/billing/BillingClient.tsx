'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import '@/components/dashboard/dashboard.css';

interface SubscriptionData {
  plan_tier: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_ends_at: string | null;
}

interface BillingClientProps {
  email: string;
  memberSince: string;
  nameFallback: string;
  planTier: string;
  subscription: SubscriptionData | null;
  hasStripeCustomer: boolean;
}

const CSS = `
  /* plan card */
  .plan-card {
    background:var(--navy); padding:28px 30px; margin-bottom:14px;
    display:flex; align-items:center; justify-content:space-between; gap:24px;
    position:relative; overflow:hidden;
  }
  .plan-card::before {
    content:''; position:absolute; right:-40px; top:-40px;
    width:160px; height:160px; border-radius:50%;
    background:radial-gradient(circle,rgba(26,122,74,.2) 0%,transparent 70%);
  }
  .plan-eyebrow { font-size:10px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.3); margin-bottom:7px; font-family:var(--mono); }
  .plan-name { font-family:var(--serif); font-size:24px; font-weight:700; color:#fff; display:flex; align-items:baseline; gap:12px; margin-bottom:4px; }
  .plan-price { font-family:var(--mono); font-size:13px; color:rgba(255,255,255,.35); }
  .plan-renew { font-family:var(--mono); font-size:10px; color:rgba(255,255,255,.3); margin-bottom:10px; }
  .plan-status {
    display:inline-flex; align-items:center; gap:5px;
    font-family:var(--mono); font-size:10px; color:var(--green-3);
    background:rgba(45,189,116,.1); border:1px solid rgba(45,189,116,.2); padding:3px 9px;
  }
  .plan-status.warn { color:#F59E0B; background:rgba(245,158,11,.1); border-color:rgba(245,158,11,.2); }
  .plan-dot { width:5px; height:5px; background:var(--green-3); border-radius:50%; animation:bl-pulse 2s infinite; }
  .plan-dot.warn { background:#F59E0B; }
  @keyframes bl-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  .plan-btns { display:flex; flex-direction:column; gap:7px; z-index:1; }
  .plan-btn {
    font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
    padding:9px 20px; cursor:pointer; text-align:center; font-family:var(--sans);
    text-decoration:none; display:block; transition:all .12s; white-space:nowrap; border:none;
  }
  .plan-btn.up { background:var(--green-3); color:var(--navy); }
  .plan-btn.up:hover { background:#38d98a; }
  .plan-btn.cancel { background:none; border:1px solid rgba(255,255,255,.15); color:rgba(255,255,255,.4); }
  .plan-btn.cancel:hover { border-color:rgba(255,255,255,.3); color:rgba(255,255,255,.65); }

  /* choose plan grid */
  .choose-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--rule); border:1px solid var(--rule); margin-bottom:14px; }
  .choose-card { background:#fff; padding:24px 20px; display:flex; flex-direction:column; }
  .choose-card.featured { background:var(--navy); }
  .choose-tier { font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; margin-bottom:12px; font-family:var(--mono); }
  .choose-card .choose-tier { color:var(--ink-3); }
  .choose-card.featured .choose-tier { color:rgba(255,255,255,.35); }
  .choose-amount { font-family:var(--serif); font-size:36px; font-weight:700; margin-bottom:4px; }
  .choose-card .choose-amount { color:var(--ink); }
  .choose-card.featured .choose-amount { color:#fff; }
  .choose-note { font-family:var(--mono); font-size:10px; margin-bottom:14px; }
  .choose-card .choose-note { color:var(--ink-3); }
  .choose-card.featured .choose-note { color:rgba(255,255,255,.35); }
  .choose-desc { font-size:12px; line-height:1.5; margin-bottom:18px; flex:1; }
  .choose-card .choose-desc { color:var(--ink-3); }
  .choose-card.featured .choose-desc { color:rgba(255,255,255,.45); }
  .choose-cta {
    display:block; text-align:center; text-decoration:none; font-size:11px;
    font-weight:600; letter-spacing:.06em; text-transform:uppercase; padding:11px 16px;
    cursor:pointer; transition:all .12s; font-family:var(--sans); border:none; width:100%;
  }
  .choose-card .choose-cta { border:1px solid var(--rule); color:var(--ink); background:none; }
  .choose-card .choose-cta:hover { border-color:var(--ink-3); background:var(--white); }
  .choose-card.featured .choose-cta { background:var(--green-3); color:var(--navy); }
  .choose-card.featured .choose-cta:hover { background:#38d98a; }

  /* billing cards */
  .bcard { background:#fff; border:1px solid var(--rule); margin-bottom:14px; }
  .bcard-hd {
    padding:14px 20px; border-bottom:1px solid var(--rule);
    display:flex; align-items:center; justify-content:space-between;
  }
  .bcard-title { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-3); font-family:var(--sans); }
  .bcard-edit {
    font-size:11px; background:none; border:1px solid var(--rule); color:var(--ink-3);
    padding:4px 12px; cursor:pointer; font-family:var(--sans); transition:all .12s;
  }
  .bcard-edit:hover { border-color:var(--ink-3); color:var(--ink); }
  .bcard-body { padding:18px 20px; }
  .bcard-body.flush { padding:0 20px; }
  .bcard-empty { font-size:13px; color:var(--ink-3); font-family:var(--sans); }

  /* account rows */
  .acct-row { display:flex; align-items:baseline; padding:10px 0; border-bottom:1px solid var(--rule); }
  .acct-row:last-child { border-bottom:none; }
  .acct-lbl { font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-3); width:150px; flex-shrink:0; font-family:var(--sans); }
  .acct-val { font-size:13px; color:var(--ink); font-family:var(--mono); }
  .acct-val.dim { color:var(--ink-3); }
  .acct-input {
    font-family:var(--mono); font-size:13px; color:var(--ink);
    border:none; border-bottom:1px solid var(--rule); background:none;
    padding:2px 0; outline:none; transition:border-color .15s; width:220px;
  }
  .acct-input:focus { border-color:var(--green); }
  .acct-save-row { display:flex; gap:8px; margin-top:14px; }
  .acct-btn { font-size:11px; font-family:var(--sans); font-weight:600; padding:6px 14px; cursor:pointer; border:none; transition:all .12s; }
  .acct-btn.save { background:var(--green); color:#fff; }
  .acct-btn.save:hover { background:var(--green-2); }
  .acct-btn.cancel { background:none; border:1px solid var(--rule); color:var(--ink-3); }
  .acct-btn.cancel:hover { border-color:var(--ink-3); color:var(--ink); }

  /* notifications */
  .notif-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 0; border-bottom:1px solid var(--rule);
  }
  .notif-row:last-child { border-bottom:none; }
  .notif-title { font-size:13px; font-weight:500; color:var(--ink); margin-bottom:2px; }
  .notif-sub { font-size:11px; color:var(--ink-3); }

  /* toggle switch */
  .tog { position:relative; display:inline-block; width:34px; height:18px; flex-shrink:0; }
  .tog input { opacity:0; width:0; height:0; }
  .tog-track {
    position:absolute; cursor:pointer; inset:0;
    background:var(--rule); transition:background .2s; border-radius:18px;
  }
  .tog-track::before {
    content:''; position:absolute;
    width:12px; height:12px; left:3px; bottom:3px;
    background:#fff; border-radius:50%; transition:transform .2s;
  }
  .tog input:checked + .tog-track { background:var(--green); }
  .tog input:checked + .tog-track::before { transform:translateX(16px); }

  /* success banner */
  .checkout-success {
    background:rgba(45,189,116,.08); border:1px solid rgba(45,189,116,.2);
    padding:14px 20px; margin-bottom:14px; display:flex; align-items:center; gap:10px;
  }
  .checkout-success-icon { color:var(--green-3); font-size:16px; flex-shrink:0; }
  .checkout-success-text { font-size:13px; color:var(--ink); font-family:var(--sans); }
  .checkout-success-text strong { font-weight:600; }

  /* danger */
  .danger-link {
    font-size:11px; background:none; border:none; color:var(--ink-3);
    cursor:pointer; font-family:var(--sans); padding:14px 0 0; display:block; transition:color .12s;
  }
  .danger-link:hover { color:#DC2626; }

  /* mobile */
  @media(max-width:640px){
    .plan-card { flex-direction:column; align-items:stretch; gap:16px; }
    .plan-btns { flex-direction:row; }
    .choose-grid { grid-template-columns:1fr; }
    .acct-row { flex-direction:column; gap:4px; }
    .acct-lbl { width:auto; }
  }
`;

const PLAN_INFO: Record<string, { name: string; price: string }> = {
  trial: { name: 'Trial', price: '$99' },
  consumer: { name: 'Consumer', price: '$199 / yr' },
  enterprise: { name: 'Enterprise', price: '$499 / yr' },
};

const NOTIFS = [
  { key: 'watchlist', title: 'Watchlist alerts', sub: 'Email when a watched firm files a change matching your alert types', defaultOn: true },
  { key: 'digest',    title: 'Weekly digest',    sub: 'Sunday summary of changes across your saved firms', defaultOn: true },
  { key: 'scores',    title: 'Score updates',    sub: 'When Visor Index scores for saved firms change by more than 5 points', defaultOn: true },
  { key: 'product',   title: 'Product announcements', sub: 'New features and platform updates', defaultOn: false },
];

async function callStripeAction(endpoint: string, body?: object) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  }
}

export default function BillingClient({ email, memberSince, nameFallback, planTier, subscription, hasStripeCustomer }: BillingClientProps) {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get('checkout');
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(nameFallback);
  const [emailInput, setEmailInput] = useState(email);
  const [loading, setLoading] = useState<string | null>(null);
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFS.map(n => [n.key, n.defaultOn]))
  );

  const toggleNotif = (key: string) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCheckout = async (tier: string) => {
    setLoading(tier);
    await callStripeAction('/api/stripe/checkout', { tier });
    setLoading(null);
  };

  const handlePortal = async () => {
    setLoading('portal');
    await callStripeAction('/api/stripe/portal');
    setLoading(null);
  };

  const info = PLAN_INFO[planTier];
  const isCanceling = subscription?.cancel_at_period_end;

  const renewDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="db-panel-eyebrow">Settings</div>
      <div className="db-panel-title">Account &amp; Billing</div>
      <div className="db-panel-sub">Your plan, payment, invoices, and account settings.</div>
      <div className="db-panel-divider" />

      {checkoutStatus === 'success' && (
        <div className="checkout-success">
          <span className="checkout-success-icon">✓</span>
          <div className="checkout-success-text">
            <strong>Payment confirmed.</strong> Your plan is now active. It may take a moment to reflect below.
          </div>
        </div>
      )}

      {/* No plan — show selection */}
      {planTier === 'none' && (
        <>
          <div style={{ marginBottom: 14, fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>
            A plan is required to access the platform. Choose one below to get started.
          </div>
          <div className="choose-grid">
            <div className="choose-card">
              <div className="choose-tier">Trial</div>
              <div className="choose-amount"><sup style={{ fontSize: 18 }}>$</sup>99</div>
              <div className="choose-note">2 weeks · one-time</div>
              <div className="choose-desc">Full platform access for two weeks. No auto-renew.</div>
              <button className="choose-cta" onClick={() => handleCheckout('trial')} disabled={loading === 'trial'}>
                {loading === 'trial' ? 'Loading...' : 'Start Your Trial'}
              </button>
            </div>
            <div className="choose-card featured">
              <div className="choose-tier">Consumer</div>
              <div className="choose-amount"><sup style={{ fontSize: 18 }}>$</sup>199</div>
              <div className="choose-note">per year · ~$0.55/day</div>
              <div className="choose-desc">Year-round research, monitoring, and advisor matching.</div>
              <button className="choose-cta" onClick={() => handleCheckout('consumer')} disabled={loading === 'consumer'}>
                {loading === 'consumer' ? 'Loading...' : 'Get Consumer Access'}
              </button>
            </div>
            <div className="choose-card">
              <div className="choose-tier">Enterprise</div>
              <div className="choose-amount"><sup style={{ fontSize: 18 }}>$</sup>499</div>
              <div className="choose-note">per year</div>
              <div className="choose-desc">Scale, speed, and deeper integration for power users.</div>
              <button className="choose-cta" onClick={() => handleCheckout('enterprise')} disabled={loading === 'enterprise'}>
                {loading === 'enterprise' ? 'Loading...' : 'Get Enterprise Access'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Active plan card */}
      {planTier !== 'none' && info && (
        <div className="plan-card">
          <div>
            <div className="plan-eyebrow">Current Plan</div>
            <div className="plan-name">
              {info.name}
              <span className="plan-price">{info.price}</span>
            </div>
            {planTier === 'trial' && trialDaysLeft !== null && (
              <div className="plan-renew">{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining</div>
            )}
            {planTier !== 'trial' && renewDate && (
              <div className="plan-renew">{isCanceling ? 'Access until' : 'Renews'} {renewDate}</div>
            )}
            {isCanceling ? (
              <div className="plan-status warn">
                <span className="plan-dot warn" />
                Canceling at period end
              </div>
            ) : (
              <div className="plan-status">
                <span className="plan-dot" />
                Active
              </div>
            )}
          </div>
          <div className="plan-btns">
            {planTier === 'trial' && (
              <button className="plan-btn up" onClick={() => handleCheckout('consumer')} disabled={loading === 'consumer'}>
                {loading === 'consumer' ? 'Loading...' : 'Upgrade to Consumer'}
              </button>
            )}
            {planTier === 'consumer' && (
              <button className="plan-btn up" onClick={() => handleCheckout('enterprise')} disabled={loading === 'enterprise'}>
                {loading === 'enterprise' ? 'Loading...' : 'Upgrade to Enterprise'}
              </button>
            )}
            {hasStripeCustomer && planTier !== 'trial' && (
              <button className="plan-btn cancel" onClick={handlePortal} disabled={loading === 'portal'}>
                {loading === 'portal' ? 'Loading...' : 'Manage Plan'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payment & Invoices — link to Stripe Portal */}
      {hasStripeCustomer && (
        <div className="bcard">
          <div className="bcard-hd">
            <div className="bcard-title">Payment &amp; Invoices</div>
            <button className="bcard-edit" onClick={handlePortal} disabled={loading === 'portal'}>
              {loading === 'portal' ? 'Loading...' : 'Manage'}
            </button>
          </div>
          <div className="bcard-body">
            <div className="bcard-empty">
              Update payment method, view invoices, and manage billing through Stripe.
            </div>
          </div>
        </div>
      )}

      {/* Account settings */}
      <div className="bcard">
        <div className="bcard-hd">
          <div className="bcard-title">Account Settings</div>
          <button className="bcard-edit" onClick={() => setEditing(e => !e)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        <div className="bcard-body flush">
          {!editing ? (
            <>
              <div className="acct-row"><div className="acct-lbl">Name</div><div className="acct-val">{nameFallback}</div></div>
              <div className="acct-row"><div className="acct-lbl">Email</div><div className="acct-val">{email}</div></div>
              <div className="acct-row"><div className="acct-lbl">Password</div><div className="acct-val dim">••••••••••</div></div>
              <div className="acct-row"><div className="acct-lbl">Member since</div><div className="acct-val dim">{memberSince}</div></div>
            </>
          ) : (
            <>
              <div className="acct-row">
                <div className="acct-lbl">Name</div>
                <input className="acct-input" value={nameInput} onChange={e => setNameInput(e.target.value)} />
              </div>
              <div className="acct-row">
                <div className="acct-lbl">Email</div>
                <input className="acct-input" type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
              </div>
              <div className="acct-row">
                <div className="acct-lbl">New Password</div>
                <input className="acct-input" type="password" placeholder="Leave blank to keep current" />
              </div>
              <div className="acct-save-row">
                <button className="acct-btn save" onClick={() => setEditing(false)}>Save Changes</button>
                <button className="acct-btn cancel" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Email notifications */}
      <div className="bcard">
        <div className="bcard-hd">
          <div className="bcard-title">Email Notifications</div>
        </div>
        <div className="bcard-body flush">
          {NOTIFS.map(n => (
            <div key={n.key} className="notif-row">
              <div>
                <div className="notif-title">{n.title}</div>
                <div className="notif-sub">{n.sub}</div>
              </div>
              <label className="tog" aria-label={`Toggle ${n.title}`}>
                <input
                  type="checkbox"
                  checked={notifs[n.key]}
                  onChange={() => toggleNotif(n.key)}
                  aria-label={n.title}
                />
                <span className="tog-track" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <button className="danger-link">Request account deletion →</button>
    </div>
  );
}
