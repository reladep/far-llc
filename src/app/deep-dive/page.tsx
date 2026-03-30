'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';

// ── Turnstile site key (public) ──────────────────────────────────────────────
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

// ── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
  .dd-page {
    --navy:#0a1c2a; --navy-2:#0F2538;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568;
    --rule:#CAD8D0;
    --serif:'Cormorant Garamond',serif;
    --sans:'DM Sans',sans-serif;
    --mono:'DM Mono',monospace;
  }

  /* Hero */
  .dd-hero { background:var(--navy); padding:80px 0 64px; position:relative; overflow:hidden; }
  .dd-hero::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
               linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size:72px 72px; pointer-events:none;
  }
  .dd-hero-inner { max-width:1200px; margin:0 auto; padding:0 24px; position:relative; }
  .dd-kicker { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
  .dd-kicker::before, .dd-kicker::after { content:''; width:28px; height:1.5px; background:linear-gradient(90deg, #2DBD74, transparent); }
  .dd-kicker::after { background:linear-gradient(270deg, #2DBD74, transparent); }
  .dd-kicker span { font-family:var(--mono); font-size:10px; font-weight:500; letter-spacing:.18em; text-transform:uppercase; color:var(--green-3); }
  .dd-heading { font-family:var(--serif); font-size:clamp(36px,5vw,56px); font-weight:300; color:#fff; line-height:1.15; margin:0; }
  .dd-sub { color:rgba(255,255,255,.5); font-size:15px; line-height:1.65; max-width:600px; margin-top:16px; font-family:var(--sans); }

  /* Body */
  .dd-body { max-width:1200px; margin:0 auto; padding:64px 24px 80px; display:grid; grid-template-columns:1fr 420px; gap:64px; }

  /* Pillars card */
  .dd-pillars-card {
    background:#fff; border:1px solid var(--rule); overflow:hidden; margin-bottom:48px;
  }
  .dd-pillars-header {
    padding:14px 24px; border-bottom:1px solid var(--rule); background:var(--white);
    font-family:var(--sans); font-size:9px; font-weight:600; letter-spacing:.14em;
    text-transform:uppercase; color:var(--ink-3);
  }
  .dd-pillars { display:flex; flex-direction:column; gap:0; padding:0 24px; }
  .dd-pillar {
    display:grid; grid-template-columns:48px 1fr; gap:16px; align-items:start;
    padding:24px 0; border-bottom:1px solid var(--rule);
  }
  .dd-pillar:last-child { border-bottom:none; }
  .dd-pillar-icon {
    width:48px; height:48px; border-radius:50%;
    display:grid; place-items:center; flex-shrink:0;
  }
  .dd-pillar-num { font-family:var(--mono); font-size:18px; font-weight:500; }
  .dd-pillar-title { font-family:var(--sans); font-size:18px; font-weight:700; color:var(--ink); margin-bottom:6px; }
  .dd-pillar-desc { font-family:var(--sans); font-size:14px; color:var(--ink-3); line-height:1.65; margin-bottom:10px; }
  .dd-pillar-items { display:flex; flex-wrap:wrap; gap:6px; }
  .dd-pillar-tag {
    font-family:var(--mono); font-size:10px; letter-spacing:.08em;
    padding:3px 8px; border:1px solid var(--rule); color:var(--ink-3);
  }

  /* Trust */
  .dd-trust {
    display:flex; align-items:flex-start; gap:16px;
    padding:20px 24px; border:1px solid var(--rule); border-left:3px solid var(--green);
    background:var(--white);
    font-family:var(--sans); font-size:13px; color:var(--ink-3); line-height:1.65;
  }
  .dd-trust-icon {
    width:32px; height:32px; border-radius:50%; background:var(--green-pale);
    display:grid; place-items:center; flex-shrink:0;
  }
  .dd-trust strong { color:var(--ink-2); }

  /* Form card */
  .dd-form-card { background:#fff; border:1px solid var(--rule); border-top:3px solid var(--green-3); position:sticky; top:120px; }
  .dd-form-header {
    padding:20px 24px; border-bottom:1px solid var(--rule);
    background:var(--navy); color:#fff;
  }
  .dd-form-header-title { font-family:var(--sans); font-size:15px; font-weight:700; margin-bottom:4px; }
  .dd-form-header-sub { font-family:var(--sans); font-size:13px; color:rgba(255,255,255,.5); }
  .dd-form { padding:24px; display:flex; flex-direction:column; gap:20px; }
  .dd-field { display:flex; flex-direction:column; gap:6px; }
  .dd-label { font-family:var(--sans); font-size:9px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); }
  .dd-input, .dd-select, .dd-textarea {
    border:1px solid var(--rule); background:var(--white); padding:11px 14px;
    font-size:13px; font-family:var(--sans); color:var(--ink); outline:none;
    transition:border-color .15s;
  }
  .dd-input:focus, .dd-select:focus, .dd-textarea:focus { border-color:var(--green-3); }
  .dd-select {
    appearance:none; cursor:pointer;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%235A7568' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 14px center; padding-right:36px;
  }
  .dd-textarea { min-height:100px; resize:vertical; }
  .dd-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .dd-checks { display:flex; flex-direction:column; gap:8px; }
  .dd-check {
    display:flex; align-items:center; gap:8px; cursor:pointer;
    font-family:var(--sans); font-size:13px; color:var(--ink-2);
  }
  .dd-check input { accent-color:var(--green); width:14px; height:14px; cursor:pointer; }
  .dd-radio-group { display:flex; gap:16px; }
  .dd-radio {
    display:flex; align-items:center; gap:6px; cursor:pointer;
    font-family:var(--sans); font-size:13px; color:var(--ink-2);
  }
  .dd-radio input { accent-color:var(--green); width:14px; height:14px; cursor:pointer; }
  .dd-submit {
    background:var(--green); color:#fff; border:none; padding:14px;
    font-family:var(--sans); font-size:13px; font-weight:600; letter-spacing:.06em;
    text-transform:uppercase; cursor:pointer; transition:background .15s;
  }
  .dd-submit:hover { background:var(--green-2); }
  .dd-submit:disabled { opacity:.6; cursor:not-allowed; }
  .dd-form-trust {
    display:flex; align-items:center; justify-content:center; gap:6px;
    font-family:var(--mono); font-size:10px; color:var(--ink-3); text-align:center; margin-top:-8px;
  }
  .dd-form-trust svg { flex-shrink:0; }
  .dd-error {
    font-family:var(--sans); font-size:13px; color:#EF4444; text-align:center;
    padding:8px; border:1px solid rgba(239,68,68,.2); background:rgba(239,68,68,.04);
  }

  .dd-success {
    padding:32px 24px; text-align:center;
  }
  .dd-success-icon {
    width:48px; height:48px; border-radius:50%; background:var(--green-pale);
    display:grid; place-items:center; margin:0 auto 16px;
  }
  .dd-success-title { font-family:var(--sans); font-size:18px; font-weight:700; color:var(--ink); margin-bottom:8px; }
  .dd-success-sub { font-family:var(--sans); font-size:13px; color:var(--ink-3); line-height:1.6; }

  /* Turnstile widget */
  .dd-captcha { display:flex; justify-content:center; }

  /* Mobile sticky CTA */
  .dd-mobile-cta {
    display:none; position:fixed; bottom:0; left:0; right:0; z-index:500;
    padding:12px 20px; background:var(--navy); border-top:1px solid rgba(255,255,255,.08);
    backdrop-filter:blur(12px);
  }
  .dd-mobile-cta a {
    display:flex; align-items:center; justify-content:center; gap:8px;
    width:100%; padding:14px; background:var(--green); color:#fff;
    font-family:var(--sans); font-size:13px; font-weight:600; letter-spacing:.06em;
    text-transform:uppercase; text-decoration:none; transition:background .15s;
  }
  .dd-mobile-cta a:hover { background:var(--green-2); }

  /* Responsive */
  @media (max-width:900px) {
    .dd-body { grid-template-columns:1fr; gap:40px; }
    .dd-form-card { position:static; }
    .dd-row { grid-template-columns:1fr; }
    .dd-mobile-cta { display:block; }
    .dd-page { padding-bottom:72px; }
  }
`;

const SERVICES = [
  { id: 'search', label: 'Advisor Search & Introductions' },
  { id: 'diligence', label: 'Due Diligence Review' },
  { id: 'negotiation', label: 'Fee Negotiation Support' },
  { id: 'monitoring', label: 'Ongoing Monitoring & Analysis' },
  { id: 'other', label: 'Other' },
];

const AUM_RANGES = [
  'Under $500K',
  '$500K – $1M',
  '$1M – $5M',
  '$5M – $10M',
  '$10M – $25M',
  '$25M+',
  'Prefer not to say',
];

export default function DeepDivePage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    aum: AUM_RANGES[2],
    services: ['diligence'] as string[],
    otherDetail: '',
    hasAdvisor: '' as '' | 'yes' | 'no',
    advisorName: '',
    message: '',
  });

  const toggleService = (id: string) => {
    setForm(f => ({
      ...f,
      services: f.services.includes(id)
        ? f.services.filter(s => s !== id)
        : [...f.services, id],
    }));
  };

  // Render Turnstile widget once script loads
  const renderTurnstile = useCallback(() => {
    if (!turnstileRef.current || !TURNSTILE_SITE_KEY) return;
    if (turnstileRef.current.children.length > 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).turnstile?.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(null),
      theme: 'light',
    });
  }, []);

  useEffect(() => {
    // If turnstile script already loaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).turnstile) renderTurnstile();
  }, [renderTurnstile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError('Please complete the captcha verification.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          turnstileToken: turnstileToken || 'no-captcha-configured',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="dd-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad"
          strategy="afterInteractive"
          onReady={renderTurnstile}
        />
      )}

      {/* Hero */}
      <div className="dd-hero">
        <div className="dd-hero-inner">
          <div className="dd-kicker">
            <span>Customized Analysis</span>
          </div>
          <h1 className="dd-heading">Go beyond the advisor sales pitch</h1>
          <p className="dd-sub">
            Our team conducts custom due diligence that goes deeper than what any database can surface — investment process reviews, background checks, fee benchmarking, and ongoing monitoring.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="dd-body">
        {/* Left column — content */}
        <div>
          {/* How it works */}
          <div className="dd-pillars-card">
          <div className="dd-pillars-header">How It Works</div>
          <div className="dd-pillars">
            <div className="dd-pillar">
              <div className="dd-pillar-icon" style={{ background: 'rgba(26,122,74,.10)' }}>
                <span className="dd-pillar-num" style={{ color: 'var(--green)' }}>01</span>
              </div>
              <div>
                <div className="dd-pillar-title">Advisor Search & Introductions</div>
                <div className="dd-pillar-desc">
                  Not sure you have the right advisor — or looking for one? We narrow the field based on your specific situation: asset level, financial goals, tax complexity, location, and service needs. Then we facilitate introductions so you start on the right foot.
                </div>
                <div className="dd-pillar-items">
                  <span className="dd-pillar-tag">Curated shortlist</span>
                  <span className="dd-pillar-tag">Comparison analysis</span>
                  <span className="dd-pillar-tag">Fit assessment</span>
                  <span className="dd-pillar-tag">Warm introductions</span>
                </div>
              </div>
            </div>

            <div className="dd-pillar">
              <div className="dd-pillar-icon" style={{ background: 'rgba(26,122,74,.08)' }}>
                <span className="dd-pillar-num" style={{ color: 'var(--green)' }}>02</span>
              </div>
              <div>
                <div className="dd-pillar-title">Due Diligence Review</div>
                <div className="dd-pillar-desc">
                  A comprehensive review of the firm beyond self-reported filings. We audit the investment process, run background checks on key personnel, interpret regulatory history, and benchmark fees against true peers — not just averages.
                </div>
                <div className="dd-pillar-items">
                  <span className="dd-pillar-tag">Investment process audit</span>
                  <span className="dd-pillar-tag">Background checks</span>
                  <span className="dd-pillar-tag">Regulatory interpretation</span>
                  <span className="dd-pillar-tag">Fee benchmarking</span>
                  <span className="dd-pillar-tag">Custody & compliance</span>
                </div>
              </div>
            </div>

            <div className="dd-pillar">
              <div className="dd-pillar-icon" style={{ background: 'rgba(26,122,74,.08)' }}>
                <span className="dd-pillar-num" style={{ color: 'var(--green)' }}>03</span>
              </div>
              <div>
                <div className="dd-pillar-title">Fee Negotiation Support</div>
                <div className="dd-pillar-desc">
                  Know what to ask for, what&apos;s realistic, and what levers you have. We prepare a negotiation brief based on the firm&apos;s actual fee data, peer comparisons, and your account size.
                </div>
                <div className="dd-pillar-items">
                  <span className="dd-pillar-tag">Negotiation brief</span>
                  <span className="dd-pillar-tag">Target rates</span>
                  <span className="dd-pillar-tag">Talking points</span>
                  <span className="dd-pillar-tag">Peer fee data</span>
                </div>
              </div>
            </div>

            <div className="dd-pillar">
              <div className="dd-pillar-icon" style={{ background: 'rgba(34,153,94,.12)' }}>
                <span className="dd-pillar-num" style={{ color: 'var(--green-2)' }}>04</span>
              </div>
              <div>
                <div className="dd-pillar-title">Ongoing Monitoring & Analysis</div>
                <div className="dd-pillar-desc">
                  The relationship doesn&apos;t end after onboarding. We help you monitor your advisor relationship over time — tracking investment performance, fee competitiveness versus industry trends, regulatory changes, and key personnel shifts so you always know where you stand.
                </div>
                <div className="dd-pillar-items">
                  <span className="dd-pillar-tag">Performance tracking</span>
                  <span className="dd-pillar-tag">Fee trend analysis</span>
                  <span className="dd-pillar-tag">Regulatory alerts</span>
                  <span className="dd-pillar-tag">Annual review</span>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Trust */}
          <div className="dd-trust">
            <div className="dd-trust-icon">
              <svg width="14" height="14" fill="none" stroke="var(--green)" strokeWidth="1.5" viewBox="0 0 14 14">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 1.5L2.5 3.5v3c0 3.5 4.5 6 4.5 6s4.5-2.5 4.5-6v-3L7 1.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 7l1.5 1.5L9 5.5" />
              </svg>
            </div>
            <div>
              <strong>Our team combines wealth management experience, institutional due diligence frameworks, and fee benchmarking data from thousands of firms on the Visor Index.</strong> Every engagement is custom — no templates, no automated reports. We work directly with you to answer the questions that matter most.
            </div>
          </div>
        </div>

        {/* Right column — form */}
        <div>
          <div className="dd-form-card">
            <div className="dd-form-header">
              <div className="dd-form-header-title">Request a Consultation</div>
              <div className="dd-form-header-sub">We&apos;ll respond within 1 business day</div>
            </div>

            {submitted ? (
              <div className="dd-success">
                <div className="dd-success-icon">
                  <svg width="20" height="20" fill="none" stroke="var(--green)" strokeWidth="2" viewBox="0 0 20 20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 10l4 4 8-8" />
                  </svg>
                </div>
                <div className="dd-success-title">Request Received</div>
                <div className="dd-success-sub">
                  Thank you. A member of our team will reach out within 1 business day to discuss your needs and scope the engagement.
                </div>
              </div>
            ) : (
              <form className="dd-form" onSubmit={handleSubmit}>
                <div className="dd-row">
                  <div className="dd-field">
                    <label className="dd-label">Full Name</label>
                    <input
                      className="dd-input"
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="dd-field">
                    <label className="dd-label">Email</label>
                    <input
                      className="dd-input"
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="dd-row">
                  <div className="dd-field">
                    <label className="dd-label">Phone (optional)</label>
                    <input
                      className="dd-input"
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  <div className="dd-field">
                    <label className="dd-label">Investable Assets</label>
                    <select
                      className="dd-select"
                      value={form.aum}
                      onChange={e => setForm(f => ({ ...f, aum: e.target.value }))}
                    >
                      {AUM_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* Existing advisor */}
                <div className="dd-field">
                  <label className="dd-label">Do You Have an Existing Advisor?</label>
                  <div className="dd-radio-group">
                    <label className="dd-radio">
                      <input
                        type="radio"
                        name="hasAdvisor"
                        value="yes"
                        checked={form.hasAdvisor === 'yes'}
                        onChange={() => setForm(f => ({ ...f, hasAdvisor: 'yes' }))}
                      />
                      Yes
                    </label>
                    <label className="dd-radio">
                      <input
                        type="radio"
                        name="hasAdvisor"
                        value="no"
                        checked={form.hasAdvisor === 'no'}
                        onChange={() => setForm(f => ({ ...f, hasAdvisor: 'no', advisorName: '' }))}
                      />
                      No
                    </label>
                  </div>
                </div>

                {form.hasAdvisor === 'yes' && (
                  <div className="dd-field">
                    <label className="dd-label">Advisor / Firm Name</label>
                    <input
                      className="dd-input"
                      type="text"
                      placeholder="e.g. Commonwealth Financial Network"
                      value={form.advisorName}
                      onChange={e => setForm(f => ({ ...f, advisorName: e.target.value }))}
                    />
                  </div>
                )}

                {/* Services */}
                <div className="dd-field">
                  <label className="dd-label">Services Needed</label>
                  <div className="dd-checks">
                    {SERVICES.map(s => (
                      <label key={s.id} className="dd-check">
                        <input
                          type="checkbox"
                          checked={form.services.includes(s.id)}
                          onChange={() => toggleService(s.id)}
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>

                {form.services.includes('other') && (
                  <div className="dd-field">
                    <label className="dd-label">Please Describe</label>
                    <input
                      className="dd-input"
                      type="text"
                      placeholder="What else can we help with?"
                      value={form.otherDetail}
                      onChange={e => setForm(f => ({ ...f, otherDetail: e.target.value }))}
                    />
                  </div>
                )}

                <div className="dd-field">
                  <label className="dd-label">Tell Us About Your Situation</label>
                  <textarea
                    className="dd-textarea"
                    placeholder="What questions do you have? What are you trying to evaluate or decide?"
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  />
                </div>

                {/* Turnstile captcha */}
                {TURNSTILE_SITE_KEY && (
                  <div className="dd-captcha" ref={turnstileRef} />
                )}

                {error && <div className="dd-error">{error}</div>}

                <button type="submit" className="dd-submit" disabled={sending}>
                  {sending ? 'Submitting...' : 'Request Consultation'}
                </button>
                <div className="dd-form-trust">
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 10 10">
                    <rect x="1.5" y="4.5" width="7" height="5" rx="1" />
                    <path d="M3 4.5V3a2 2 0 014 0v1.5" />
                  </svg>
                  Your information is confidential and never shared
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      {!submitted && (
        <div className="dd-mobile-cta">
          <a href="#dd-form" onClick={(e) => {
            e.preventDefault();
            document.querySelector('.dd-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}>
            Request Consultation
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 12 12">
              <path d="M2 6h8M7 3l3 3-3 3" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
