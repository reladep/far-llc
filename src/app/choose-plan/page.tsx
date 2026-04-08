'use client';

import { useState } from 'react';
import Link from 'next/link';

const CSS = `
  .cp-page {
    --green: #1A7A4A; --green-accent: #2DBD74; --green-3: #2DBD74;
    --navy: #0A1C2A; --ink: #0C1810; --ink-3: #5A7568;
    --rule: #CAD8D0; --white: #F6F8F7;
    --serif: 'Cormorant Garamond', serif;
    --sans: 'DM Sans', sans-serif;
    --mono: 'DM Mono', monospace;
    min-height: 100vh; background: var(--white);
  }

  .cp-header {
    width: 100%; background: var(--navy);
    padding: 36px 24px 28px; text-align: center;
  }
  .cp-header-kicker {
    font-family: var(--mono); font-size: 10px; font-weight: 600;
    letter-spacing: .18em; text-transform: uppercase;
    color: var(--green-accent); margin-bottom: 8px;
  }
  .cp-header-title {
    font-family: var(--serif); font-size: 28px; font-weight: 700;
    color: #fff; letter-spacing: -.01em; margin-bottom: 4px;
  }
  .cp-header-sub {
    font-family: var(--sans); font-size: 13px;
    color: rgba(255,255,255,.4);
  }

  .cp-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: var(--rule); border: 1px solid var(--rule);
    max-width: 820px; margin: 36px auto 48px;
  }

  .cp-card { background: #fff; padding: 28px 24px; display: flex; flex-direction: column; }
  .cp-card.featured { background: var(--navy); }

  .cp-tier {
    font-size: 10px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; margin-bottom: 12px; font-family: var(--mono);
  }
  .cp-card .cp-tier { color: var(--ink-3); }
  .cp-card.featured .cp-tier { color: rgba(255,255,255,.35); }

  .cp-badge {
    display: inline-block; font-family: var(--mono); font-size: 9px;
    font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
    background: var(--green-accent); color: var(--navy);
    padding: 3px 8px; margin-bottom: 12px;
  }

  .cp-amount { font-family: var(--serif); font-size: 40px; font-weight: 700; margin-bottom: 4px; }
  .cp-card .cp-amount { color: var(--ink); }
  .cp-card.featured .cp-amount { color: #fff; }

  .cp-note { font-family: var(--mono); font-size: 10px; margin-bottom: 14px; }
  .cp-card .cp-note { color: var(--ink-3); }
  .cp-card.featured .cp-note { color: rgba(255,255,255,.35); }

  .cp-desc { font-size: 13px; line-height: 1.55; margin-bottom: 20px; flex: 1; }
  .cp-card .cp-desc { color: var(--ink-3); }
  .cp-card.featured .cp-desc { color: rgba(255,255,255,.45); }

  .cp-cta {
    display: block; text-align: center; text-decoration: none;
    font-size: 11px; font-weight: 600; letter-spacing: .06em;
    text-transform: uppercase; padding: 12px 16px;
    cursor: pointer; transition: all .12s; font-family: var(--sans);
    border: none; width: 100%;
  }
  .cp-card .cp-cta { border: 1px solid var(--rule); color: var(--ink); background: none; }
  .cp-card .cp-cta:hover { border-color: var(--ink-3); background: var(--white); }
  .cp-card.featured .cp-cta { background: var(--green-3); color: var(--navy); }
  .cp-card.featured .cp-cta:hover { background: #38d98a; }
  .cp-cta:disabled { opacity: 0.6; cursor: wait; }

  .cp-footer {
    text-align: center; padding-bottom: 48px;
    font-family: var(--sans); font-size: 12px; color: var(--ink-3);
  }
  .cp-footer a { color: var(--green); text-decoration: none; }
  .cp-footer a:hover { text-decoration: underline; }

  @media (max-width: 640px) {
    .cp-grid { grid-template-columns: 1fr; margin: 24px 16px 36px; }
    .cp-header { padding: 28px 16px 22px; }
    .cp-header-title { font-size: 24px; }
  }
`;

async function goToCheckout(tier: string): Promise<string | null> {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier }),
  });
  const data = await res.json();
  return data.url || null;
}

export default function ChoosePlanPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (tier: string) => {
    setLoading(tier);
    const url = await goToCheckout(tier);
    if (url) {
      window.location.href = url;
    } else {
      setLoading(null);
    }
  };

  return (
    <div className="cp-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="cp-header">
        <div className="cp-header-kicker">Almost There</div>
        <div className="cp-header-title">Choose your plan</div>
        <div className="cp-header-sub">Select a plan to access the full platform.</div>
      </div>

      <div className="cp-grid">
        <div className="cp-card">
          <div className="cp-tier">Trial</div>
          <div className="cp-amount"><sup style={{ fontSize: 20 }}>$</sup>99</div>
          <div className="cp-note">2 weeks &middot; one-time &middot; no auto-renew</div>
          <div className="cp-desc">Full platform access for two weeks. Low commitment, full capability.</div>
          <button className="cp-cta" onClick={() => handleSelect('trial')} disabled={loading === 'trial'}>
            {loading === 'trial' ? 'Loading...' : 'Start Your Trial'}
          </button>
        </div>

        <div className="cp-card featured">
          <div className="cp-badge">Best Value</div>
          <div className="cp-tier">Consumer</div>
          <div className="cp-amount"><sup style={{ fontSize: 20 }}>$</sup>199</div>
          <div className="cp-note">per year &middot; ~$0.55/day</div>
          <div className="cp-desc">Year-round research, monitoring, and advisor matching for serious investors.</div>
          <button className="cp-cta" onClick={() => handleSelect('consumer')} disabled={loading === 'consumer'}>
            {loading === 'consumer' ? 'Loading...' : 'Get Consumer Access'}
          </button>
        </div>

        <div className="cp-card">
          <div className="cp-tier">Enterprise</div>
          <div className="cp-amount"><sup style={{ fontSize: 20 }}>$</sup>499</div>
          <div className="cp-note">per year</div>
          <div className="cp-desc">Scale, speed, and deeper integration for power users and institutions.</div>
          <button className="cp-cta" onClick={() => handleSelect('enterprise')} disabled={loading === 'enterprise'}>
            {loading === 'enterprise' ? 'Loading...' : 'Get Enterprise Access'}
          </button>
        </div>
      </div>

      <div className="cp-footer">
        Questions? See our <Link href="/pricing">full pricing breakdown</Link>.
      </div>
    </div>
  );
}
