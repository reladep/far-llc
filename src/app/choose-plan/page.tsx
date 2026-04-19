'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CSS = `
  .cp-page {
    --green: #1A7A4A;
    --green-2: #22995E;
    --green-3: #2DBD74;
    --navy: #0A1C2A;
    --ink: #0C1810;
    --ink-2: #2E4438;
    --ink-3: #5A7568;
    --rule: #CAD8D0;
    --rule-soft: #E5E9E6;
    --bg: #F6F8F7;
    --serif: 'Cormorant Garamond', Georgia, serif;
    --sans: 'Inter', system-ui, sans-serif;
    --mono: 'DM Mono', 'SF Mono', Menlo, monospace;
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--sans);
    color: var(--ink);
  }

  /* ---- Top bar: minimal, functional ---- */
  .cp-topbar {
    height: 56px;
    border-bottom: 1px solid var(--rule-soft);
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
  }
  .cp-wordmark {
    font-family: var(--serif);
    font-size: 18px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.01em;
    text-decoration: none;
  }
  .cp-step {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .cp-step strong {
    color: var(--ink);
    font-weight: 600;
  }
  .cp-step-sep {
    display: inline-block;
    width: 1px;
    height: 10px;
    background: var(--rule);
    margin: 0 12px;
    vertical-align: middle;
  }

  /* ---- Main ---- */
  .cp-main {
    max-width: 1040px;
    margin: 0 auto;
    padding: 72px 32px 96px;
  }

  .cp-heading {
    text-align: center;
    margin-bottom: 56px;
  }
  .cp-eyebrow {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-bottom: 14px;
  }
  .cp-h1 {
    font-family: var(--serif);
    font-size: clamp(32px, 4vw, 44px);
    font-weight: 700;
    letter-spacing: -.02em;
    line-height: 1.1;
    color: var(--ink);
    margin: 0 0 14px;
  }
  .cp-sub {
    font-size: 14px;
    color: var(--ink-3);
    line-height: 1.6;
    max-width: 520px;
    margin: 0 auto;
  }

  /* ---- Grid ---- */
  .cp-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    align-items: stretch;
  }

  .cp-card-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
  }
  /* Recommended label — above card */
  .cp-recommended {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
    height: 18px;
  }
  .cp-rec-spacer {
    height: 28px;
  }
  .cp-rec-line {
    display: block;
    width: 18px;
    height: 1px;
    background: var(--green);
  }
  .cp-rec-text {
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--green);
  }

  .cp-card {
    background: #fff;
    border: 1px solid var(--rule-soft);
    padding: 36px 28px 28px;
    display: flex;
    flex-direction: column;
    flex: 1;
    position: relative;
    transition: border-color .15s, box-shadow .15s, transform .15s;
  }
  .cp-card-wrap.featured .cp-card {
    border-color: var(--rule);
    box-shadow:
      0 1px 3px rgba(10,28,42,.04),
      0 18px 48px rgba(10,28,42,.08);
  }
  .cp-card-wrap.featured .cp-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--green);
  }
  .cp-card-wrap:not(.featured):hover .cp-card {
    border-color: var(--rule);
    box-shadow: 0 1px 3px rgba(10,28,42,.03), 0 8px 24px rgba(10,28,42,.04);
  }

  .cp-tier-label {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-bottom: 18px;
  }

  .cp-price-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 4px;
  }
  .cp-dollar {
    font-family: var(--serif);
    font-size: 22px;
    font-weight: 600;
    color: var(--ink-2);
  }
  .cp-amount {
    font-family: var(--serif);
    font-size: 52px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -.025em;
    line-height: 1;
  }
  .cp-period {
    font-family: var(--sans);
    font-size: 13px;
    color: var(--ink-3);
    margin-left: 4px;
  }

  .cp-billing {
    font-family: var(--sans);
    font-size: 12px;
    color: var(--ink-3);
    margin-bottom: 22px;
  }

  .cp-tagline {
    font-size: 13px;
    line-height: 1.55;
    color: var(--ink-2);
    margin-bottom: 22px;
    padding-bottom: 22px;
    border-bottom: 1px solid var(--rule-soft);
  }

  /* ---- Tabular feature list ---- */
  .cp-features {
    list-style: none;
    padding: 0;
    margin: 0 0 28px;
    display: flex;
    flex-direction: column;
    gap: 11px;
    flex: 1;
  }
  .cp-feature {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-family: var(--mono);
    font-size: 11px;
    gap: 12px;
  }
  .cp-feature-label {
    letter-spacing: .08em;
    text-transform: uppercase;
    font-weight: 500;
    color: var(--ink-3);
  }
  .cp-feature-value {
    color: var(--ink);
    font-weight: 500;
    text-align: right;
  }
  .cp-feature-value.muted {
    color: #A8B8AE;
  }

  /* ---- CTAs ---- */
  .cp-cta {
    display: block;
    width: 100%;
    text-align: center;
    font-family: var(--sans);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    padding: 14px 20px;
    border: 1px solid var(--rule);
    background: #fff;
    color: var(--ink-2);
    cursor: pointer;
    transition: border-color .15s, color .15s, background .15s;
  }
  .cp-cta:hover {
    border-color: var(--ink-2);
    color: var(--ink);
  }
  .cp-cta.primary {
    background: var(--green);
    border-color: var(--green);
    color: #fff;
  }
  .cp-cta.primary:hover {
    background: var(--green-2);
    border-color: var(--green-2);
  }
  .cp-cta:disabled {
    opacity: .55;
    cursor: wait;
  }

  /* ---- Trust row ---- */
  .cp-trust {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0;
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--ink-3);
    padding: 40px 0 24px;
  }
  .cp-trust-sep {
    display: inline-block;
    width: 3px;
    height: 3px;
    background: var(--rule);
    border-radius: 50%;
    margin: 0 18px;
    vertical-align: middle;
  }

  /* ---- Footer ---- */
  .cp-foot {
    text-align: center;
    font-size: 13px;
    color: var(--ink-3);
    padding-top: 24px;
    border-top: 1px solid var(--rule-soft);
    max-width: 640px;
    margin: 0 auto;
    line-height: 1.6;
  }
  .cp-foot a {
    color: var(--green);
    text-decoration: none;
    font-weight: 500;
  }
  .cp-foot a:hover { text-decoration: underline; }

  /* ---- Responsive ---- */
  @media (max-width: 860px) {
    .cp-grid {
      grid-template-columns: 1fr;
      gap: 16px;
      padding-top: 8px;
    }
    .cp-recommended {
      justify-content: flex-start;
    }
    .cp-rec-line {
      display: none;
    }
    .cp-main { padding: 48px 20px 72px; }
    .cp-heading { margin-bottom: 36px; }
    .cp-topbar { padding: 0 20px; }
    .cp-trust {
      flex-wrap: wrap;
      gap: 8px 0;
    }
    .cp-trust-sep { margin: 0 12px; }
  }
`;

type Feature = { label: string; value: string; muted?: boolean };

const TRIAL_FEATURES: Feature[] = [
  { label: 'Access',    value: 'Full platform' },
  { label: 'Duration',  value: '14 days' },
  { label: 'Alerts',    value: 'Basic' },
  { label: 'Digest',    value: 'Weekly' },
  { label: 'API',       value: '—', muted: true },
  { label: 'Support',   value: 'Email' },
];

const CONSUMER_FEATURES: Feature[] = [
  { label: 'Access',    value: 'Full platform' },
  { label: 'Duration',  value: '1 year' },
  { label: 'Alerts',    value: 'All types' },
  { label: 'Digest',    value: 'Daily' },
  { label: 'API',       value: '—', muted: true },
  { label: 'Support',   value: 'Priority' },
];

const ENTERPRISE_FEATURES: Feature[] = [
  { label: 'Access',    value: 'Full platform' },
  { label: 'Duration',  value: '1 year' },
  { label: 'Alerts',    value: 'Unlimited' },
  { label: 'Digest',    value: 'Real-time' },
  { label: 'API',       value: 'Included' },
  { label: 'Support',   value: 'Dedicated' },
];

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
  const [autoRedirecting, setAutoRedirecting] = useState(false);

  // Auto-trigger checkout if user came from pricing with a pre-selected plan
  useEffect(() => {
    const intendedPlan = localStorage.getItem('intended_plan');
    if (intendedPlan && ['trial', 'consumer', 'enterprise'].includes(intendedPlan)) {
      localStorage.removeItem('intended_plan');
      setAutoRedirecting(true);
      goToCheckout(intendedPlan).then((url) => {
        if (url) window.location.href = url;
        else setAutoRedirecting(false);
      });
    }
  }, []);

  const handleSelect = async (tier: string) => {
    setLoading(tier);
    const url = await goToCheckout(tier);
    if (url) window.location.href = url;
    else setLoading(null);
  };

  if (autoRedirecting) {
    return (
      <div className="cp-page">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="cp-topbar">
          <Link href="/" className="cp-wordmark">Visor Index</Link>
          <div className="cp-step">Step <strong>2</strong><span className="cp-step-sep" />Billing</div>
        </div>
        <div style={{ textAlign: 'center', paddingTop: '30vh', fontFamily: "'DM Mono', monospace", color: '#5A7568', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}>
          Taking you to checkout…
        </div>
      </div>
    );
  }

  return (
    <div className="cp-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="cp-topbar">
        <Link href="/" className="cp-wordmark">Visor Index</Link>
        <div className="cp-step">
          Step <strong>2</strong> / 3
          <span className="cp-step-sep" />
          Billing
        </div>
      </div>

      <main className="cp-main">
        <div className="cp-grid">
          {/* Trial */}
          <div className="cp-card-wrap">
            <div className="cp-rec-spacer" />
            <div className="cp-card">
              <div className="cp-tier-label">Trial</div>
              <div className="cp-price-row">
                <span className="cp-dollar">$</span>
                <span className="cp-amount">99</span>
              </div>
              <div className="cp-billing">One-time &middot; No auto-renew</div>
              <div className="cp-tagline">
                Full platform access for two weeks. Ideal for evaluating before committing.
              </div>
              <ul className="cp-features">
                {TRIAL_FEATURES.map((f) => (
                  <li key={f.label} className="cp-feature">
                    <span className="cp-feature-label">{f.label}</span>
                    <span className={`cp-feature-value${f.muted ? ' muted' : ''}`}>{f.value}</span>
                  </li>
                ))}
              </ul>
              <button
                className="cp-cta"
                onClick={() => handleSelect('trial')}
                disabled={loading === 'trial'}
              >
                {loading === 'trial' ? 'Loading…' : 'Start Trial'}
              </button>
            </div>
          </div>

          {/* Consumer — featured */}
          <div className="cp-card-wrap featured">
            <div className="cp-recommended">
              <span className="cp-rec-line" />
              <span className="cp-rec-text">Recommended</span>
              <span className="cp-rec-line" />
            </div>
            <div className="cp-card">
              <div className="cp-tier-label">Consumer</div>
              <div className="cp-price-row">
                <span className="cp-dollar">$</span>
                <span className="cp-amount">199</span>
                <span className="cp-period">/ year</span>
              </div>
              <div className="cp-billing">Billed annually</div>
              <div className="cp-tagline">
                Year-round research, monitoring, and advisor matching for serious individual investors.
              </div>
              <ul className="cp-features">
                {CONSUMER_FEATURES.map((f) => (
                  <li key={f.label} className="cp-feature">
                    <span className="cp-feature-label">{f.label}</span>
                    <span className={`cp-feature-value${f.muted ? ' muted' : ''}`}>{f.value}</span>
                  </li>
                ))}
              </ul>
              <button
                className="cp-cta primary"
                onClick={() => handleSelect('consumer')}
                disabled={loading === 'consumer'}
              >
                {loading === 'consumer' ? 'Loading…' : 'Continue with Consumer'}
              </button>
            </div>
          </div>

          {/* Enterprise */}
          <div className="cp-card-wrap">
            <div className="cp-rec-spacer" />
            <div className="cp-card">
              <div className="cp-tier-label">Enterprise</div>
              <div className="cp-price-row">
                <span className="cp-dollar">$</span>
                <span className="cp-amount">499</span>
                <span className="cp-period">/ year</span>
              </div>
              <div className="cp-billing">Billed annually</div>
              <div className="cp-tagline">
                Scale, API access, and dedicated support for power users, teams, and firms.
              </div>
              <ul className="cp-features">
                {ENTERPRISE_FEATURES.map((f) => (
                  <li key={f.label} className="cp-feature">
                    <span className="cp-feature-label">{f.label}</span>
                    <span className={`cp-feature-value${f.muted ? ' muted' : ''}`}>{f.value}</span>
                  </li>
                ))}
              </ul>
              <button
                className="cp-cta"
                onClick={() => handleSelect('enterprise')}
                disabled={loading === 'enterprise'}
              >
                {loading === 'enterprise' ? 'Loading…' : 'Continue with Enterprise'}
              </button>
            </div>
          </div>
        </div>

        <div className="cp-trust">
          Secure checkout by Stripe
          <span className="cp-trust-sep" />
          Cancel anytime
          <span className="cp-trust-sep" />
          No setup fees
        </div>

        <div className="cp-foot">
          Managing a fund or firm with custom needs?{' '}
          <Link href="/contact">Talk to sales →</Link>
        </div>
      </main>
    </div>
  );
}
