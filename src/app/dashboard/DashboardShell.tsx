'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail: string;
  savedCount: number;
  alertCount: number;
}

const NAV = [
  { label: 'Saved Firms',       href: '/dashboard/saved-firms', icon: '◈', countKey: 'saved' as const },
  { label: 'Alerts',            href: '/dashboard/alerts',      icon: '◯', countKey: 'alert' as const },
  { label: 'Account & Billing', href: '/dashboard/billing',     icon: '◎', countKey: null },
];

const CSS = `
  .db-wrap {
    --navy:#0A1C2A; --navy-2:#0F2538;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568; --rule:#CAD8D0;
    --serif:'Cormorant Garamond',serif; --sans:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
  }
  .db-page { display:flex; min-height:calc(100vh - 52px); }

  /* ── SIDEBAR ── */
  .db-sidebar {
    width:240px; flex-shrink:0;
    position:sticky; top:52px;
    height:calc(100vh - 52px);
    background:#fff; border-right:1px solid var(--rule);
    display:flex; flex-direction:column; overflow-y:auto;
    transition:transform .25s;
  }

  /* user identity */
  .db-id { padding:24px 20px 20px; border-bottom:1px solid var(--rule); }
  .db-eyebrow {
    font-size:10px; font-weight:700; letter-spacing:.2em; text-transform:uppercase;
    color:var(--ink-3); font-family:var(--mono); margin-bottom:6px;
  }
  .db-name {
    font-family:var(--serif); font-size:20px; font-weight:700;
    color:var(--ink); line-height:1.1; margin-bottom:10px;
    word-break:break-all;
  }
  .db-plan {
    display:inline-flex; align-items:center; gap:5px;
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.1em; text-transform:uppercase;
    color:var(--green); background:var(--green-pale);
    border:1px solid rgba(26,122,74,.2); padding:3px 9px;
  }
  .db-plan-dot { width:5px; height:5px; background:var(--green); border-radius:50%; }

  /* nav */
  .db-nav { padding:12px; display:flex; flex-direction:column; gap:4px; flex:1; }
  .db-nav-item {
    display:flex; align-items:center; gap:12px;
    padding:13px 14px;
    border:1px solid transparent; border-radius:0;
    text-decoration:none; transition:all .15s;
    color:var(--ink-3); font-size:13px; font-weight:500;
    font-family:var(--sans); background:none; width:100%;
    cursor:pointer; text-align:left;
  }
  .db-nav-item:hover { background:var(--white); border-color:var(--rule); color:var(--ink); }
  .db-nav-item.active {
    background:var(--green-pale); border-color:rgba(26,122,74,.25);
    color:var(--green); font-weight:600; border-left:3px solid var(--green);
  }
  .db-nav-icon { font-size:14px; flex-shrink:0; width:20px; text-align:center; color:inherit; }
  .db-nav-label { flex:1; }
  .db-nav-count {
    font-family:var(--mono); font-size:10px; font-weight:600;
    background:var(--rule); color:var(--ink-3); padding:2px 6px;
  }
  .db-nav-item.active .db-nav-count { background:rgba(26,122,74,.15); color:var(--green); }

  /* sidebar footer */
  .db-sb-footer { padding:16px 20px; border-top:1px solid var(--rule); }
  .db-sb-link {
    display:block; font-size:11px; color:var(--ink-3);
    text-decoration:none; margin-bottom:4px; transition:color .12s;
    font-family:var(--sans);
  }
  .db-sb-link:hover { color:var(--green); }

  /* main content */
  .db-main { flex:1; min-width:0; padding:36px 48px 80px; }

  /* mobile hamburger trigger */
  .db-mobile-trigger {
    display:none; align-items:center; gap:8px;
    font-size:11px; font-weight:600; font-family:var(--sans); letter-spacing:.04em;
    color:var(--ink-3); background:none;
    border:1px solid var(--rule); padding:7px 14px;
    cursor:pointer; margin-bottom:24px; transition:all .15s;
  }
  .db-mobile-trigger:hover { border-color:var(--ink-3); color:var(--ink); }

  /* backdrop */
  .db-backdrop {
    display:none; position:fixed; inset:0; z-index:49; background:rgba(0,0,0,.45);
  }
  .db-backdrop.show { display:block; }

  /* mobile breakpoint */
  @media(max-width:767px){
    .db-sidebar {
      position:fixed; top:0; left:0; z-index:50;
      height:100vh; transform:translateX(-100%);
    }
    .db-sidebar.open { transform:translateX(0); }
    .db-main { padding:16px 16px 80px; }
    .db-mobile-trigger { display:flex; }
  }
`;

export default function DashboardShell({
  children,
  userEmail,
  savedCount,
  alertCount,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Display name: everything before '@', capitalised
  const displayName = userEmail
    ? userEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'My Account';

  const countFor = (key: 'saved' | 'alert' | null) => {
    if (key === 'saved') return savedCount;
    if (key === 'alert') return alertCount;
    return null;
  };

  return (
    <div className="db-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Mobile backdrop */}
      <div
        className={`db-backdrop${sidebarOpen ? ' show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="db-page">
        {/* ── SIDEBAR ── */}
        <aside className={`db-sidebar${sidebarOpen ? ' open' : ''}`}>
          {/* User identity */}
          <div className="db-id">
            <div className="db-eyebrow">Dashboard</div>
            <div className="db-name">{displayName}</div>
            <div className="db-plan">
              <span className="db-plan-dot" />
              Annual Access
            </div>
          </div>

          {/* Nav items */}
          <nav className="db-nav">
            {NAV.map(item => {
              const isActive = pathname.startsWith(item.href);
              const count = countFor(item.countKey);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`db-nav-item${isActive ? ' active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="db-nav-icon">{item.icon}</span>
                  <span className="db-nav-label">{item.label}</span>
                  {count !== null && count > 0 && (
                    <span className="db-nav-count">{count}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer links */}
          <div className="db-sb-footer">
            <Link href="/search" className="db-sb-link">→ Search advisors</Link>
            <Link href="/negotiate" className="db-sb-link">→ Negotiate fees</Link>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="db-main">
          {/* Mobile trigger */}
          <button
            className="db-mobile-trigger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 14 14">
              <path d="M1 3h12M1 7h12M1 11h12" strokeLinecap="round" />
            </svg>
            Menu
          </button>

          {children}
        </main>
      </div>
    </div>
  );
}
