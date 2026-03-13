'use client';

import { useState } from 'react';
import Link from 'next/link';

interface BillingClientProps {
  email: string;
  memberSince: string;
  nameFallback: string;
}

const CSS = `
  .bl-wrap {
    --navy:#0A1C2A; --navy-2:#0F2538;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568; --rule:#CAD8D0;
    --amber:#B45309; --amber-pale:#FEF3C7; --red:#DC2626;
    --serif:'Cormorant Garamond',serif; --sans:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
  }
  .bl-title { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--ink); letter-spacing:-.02em; margin-bottom:4px; }
  .bl-sub { font-size:13px; color:var(--ink-3); margin-bottom:24px; }
  .bl-divider { height:1px; background:var(--rule); margin-bottom:24px; }

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
  .plan-eyebrow { font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.3); margin-bottom:7px; font-family:var(--mono); }
  .plan-name { font-family:var(--serif); font-size:24px; font-weight:700; color:#fff; display:flex; align-items:baseline; gap:12px; margin-bottom:4px; }
  .plan-price { font-family:var(--mono); font-size:13px; color:rgba(255,255,255,.35); }
  .plan-renew { font-family:var(--mono); font-size:10px; color:rgba(255,255,255,.3); margin-bottom:10px; }
  .plan-status {
    display:inline-flex; align-items:center; gap:5px;
    font-family:var(--mono); font-size:9px; color:var(--green-3);
    background:rgba(45,189,116,.1); border:1px solid rgba(45,189,116,.2); padding:3px 9px;
  }
  .plan-dot { width:5px; height:5px; background:var(--green-3); border-radius:50%; animation:bl-pulse 2s infinite; }
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

  /* payment */
  .pay-row { display:flex; align-items:center; justify-content:space-between; }
  .card-chip { display:flex; align-items:center; gap:12px; }
  .card-mark {
    width:36px; height:23px; background:var(--navy);
    display:grid; place-items:center;
    font-family:var(--mono); font-size:7px; font-weight:700; color:rgba(255,255,255,.6); letter-spacing:.05em;
  }
  .card-num { font-family:var(--mono); font-size:13px; color:var(--ink); }
  .card-exp { font-family:var(--mono); font-size:10px; color:var(--ink-3); }

  /* invoices */
  .inv-table { width:100%; border-collapse:collapse; }
  .inv-table th {
    font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
    color:var(--ink-3); padding:8px 0; border-bottom:1px solid var(--rule); text-align:left; font-family:var(--sans);
  }
  .inv-table td {
    font-size:12px; padding:11px 0; border-bottom:1px solid var(--rule);
    font-family:var(--mono); color:var(--ink-2);
  }
  .inv-table tr:last-child td { border-bottom:none; }
  .inv-table td.inv-desc { font-family:var(--sans); font-size:13px; color:var(--ink); }
  .inv-badge { font-size:9px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; padding:2px 7px; background:var(--green-pale); color:var(--green); }
  .inv-dl { font-size:11px; color:var(--ink-3); background:none; border:none; cursor:pointer; font-family:var(--sans); transition:color .12s; }
  .inv-dl:hover { color:var(--green); }

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

  /* danger */
  .danger-link {
    font-size:11px; background:none; border:none; color:var(--ink-3);
    cursor:pointer; font-family:var(--sans); padding:14px 0 0; display:block; transition:color .12s;
  }
  .danger-link:hover { color:var(--red); }
`;

const NOTIFS = [
  { key: 'watchlist', title: 'Watchlist alerts', sub: 'Email when a watched firm files a change matching your alert types', defaultOn: true },
  { key: 'digest',    title: 'Weekly digest',    sub: 'Sunday summary of changes across your saved firms', defaultOn: true },
  { key: 'scores',    title: 'Score updates',    sub: 'When VVS scores for saved firms change by more than 5 points', defaultOn: true },
  { key: 'product',   title: 'Product announcements', sub: 'New features and platform updates', defaultOn: false },
];

export default function BillingClient({ email, memberSince, nameFallback }: BillingClientProps) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(nameFallback);
  const [emailInput, setEmailInput] = useState(email);
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFS.map(n => [n.key, n.defaultOn]))
  );

  const toggleNotif = (key: string) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bl-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="bl-title">Account &amp; Billing</div>
      <div className="bl-sub">Your plan, payment, invoices, and account settings.</div>
      <div className="bl-divider" />

      {/* Plan card */}
      <div className="plan-card">
        <div>
          <div className="plan-eyebrow">Current Plan</div>
          <div className="plan-name">
            Annual Access
            <span className="plan-price">$199 / yr</span>
          </div>
          <div className="plan-renew">Renews March 1, 2027</div>
          <div className="plan-status">
            <span className="plan-dot" />
            Active
          </div>
        </div>
        <div className="plan-btns">
          <Link href="/pricing" className="plan-btn up">Upgrade to Concierge</Link>
          <button className="plan-btn cancel">Cancel Plan</button>
        </div>
      </div>

      {/* Payment method */}
      <div className="bcard">
        <div className="bcard-hd">
          <div className="bcard-title">Payment Method</div>
          <button className="bcard-edit">Update</button>
        </div>
        <div className="bcard-body">
          <div className="pay-row">
            <div className="card-chip">
              <div className="card-mark">VISA</div>
              <div>
                <div className="card-num">•••• •••• •••• 4242</div>
                <div className="card-exp">Expires 09 / 2028</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice history */}
      <div className="bcard">
        <div className="bcard-hd">
          <div className="bcard-title">Invoice History</div>
        </div>
        <div className="bcard-body flush">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[
                { desc: 'Annual Access — 2026', date: 'Mar 1, 2026', amount: '$199.00' },
                { desc: 'Annual Access — 2025', date: 'Mar 1, 2025', amount: '$199.00' },
                { desc: '30-Day Access',         date: 'Jan 14, 2025', amount: '$99.00' },
              ].map((inv, i) => (
                <tr key={i}>
                  <td className="inv-desc">{inv.desc}</td>
                  <td>{inv.date}</td>
                  <td>{inv.amount}</td>
                  <td><span className="inv-badge">Paid</span></td>
                  <td><button className="inv-dl">↓ PDF</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              <label className="tog">
                <input
                  type="checkbox"
                  checked={notifs[n.key]}
                  onChange={() => toggleNotif(n.key)}
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
