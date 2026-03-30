'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ── FAQ Data ── */
const faqColumns: { q: string; a: string }[][] = [
  [
    {
      q: 'Is Visor affiliated with any advisory firms?',
      a: 'No. Visor is entirely independent. We do not accept payments from advisory firms, do not receive referral fees, and have no commercial relationships with any firm in our database. Our only revenue is from user subscriptions.',
    },
    {
      q: 'Where does the data come from?',
      a: "All underlying data comes from SEC IAPD and Form ADV filings — public regulatory documents every registered investment advisor must file. Visor's contribution is the scoring, benchmarking, trend analysis, and intelligence layer built on top of that raw data.",
    },
    {
      q: 'How current is the data?',
      a: 'We refresh from SEC filings monthly. Most firms file their ADV annually, with amendments filed on a rolling basis. Filing dates are shown on every profile so you always know the data vintage.',
    },
    {
      q: "What's included in the Concierge tier?",
      a: 'Concierge is a customized engagement tailored to your situation. It can include advisor search and introductions, custom due diligence and background checks, fee benchmarking, and ongoing monitoring. You start by submitting a consultation request, and our team scopes the engagement to your needs.',
    },
  ],
  [
    {
      q: 'Can I really search for free?',
      a: "Yes. You can search any of the 14,280 firms in our database without an account. You'll see the firm name, location, AUM, and basic structure. Full VVS scores, sub-metrics, fee schedules, conflict details, and comparison tools require access.",
    },
    {
      q: 'Does the 30-day plan auto-renew?',
      a: "No. The 30-day plan is a one-time charge with no auto-renewal. Access expires after 30 days. If you want to continue, you can upgrade to Annual at any point — we'll credit the days remaining.",
    },
    {
      q: 'Is this useful if I already have an advisor?',
      a: "Especially then. Many existing clients find the fee benchmarking most valuable — seeing where their current advisor's fees rank gives them context for a real conversation. The Negotiate tool builds you a word-for-word fee reduction script.",
    },
    {
      q: 'Do you cover state-registered advisors?',
      a: 'Currently Visor covers all SEC-registered investment advisors (firms managing $100M+ in assets). State-registered advisors are on our roadmap for 2025. The SEC-registered universe covers the vast majority of assets under professional management.',
    },
  ],
];

/* ── Styles ── */
const CSS = `
  .pp {
    --navy: #0a1c2a;
    --navy-2: #0F2538;
    --navy-3: #162F45;
    --green: #1A7A4A;
    --green-2: #22995E;
    --green-3: #2DBD74;
    --white: #F6F8F7;
    --ink: #0C1810;
    --ink-2: #2E4438;
    --ink-3: #5A7568;
    --rule: #CAD8D0;
    --serif: 'Cormorant Garamond', serif;
    --sans: 'DM Sans', sans-serif;
    --mono: 'DM Mono', monospace;
  }

  /* Animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: none; }
  }
  .pp-anim       { opacity: 0; animation: fadeUp .6s ease forwards; }
  .pp-d1         { animation-delay: .1s; }
  .pp-d2         { animation-delay: .2s; }
  .pp-d3         { animation-delay: .3s; }
  @media (prefers-reduced-motion: reduce) {
    .pp-anim { opacity: 1; animation: none; }
  }

  /* Container */
  .pp-container { max-width: 1200px; margin: 0 auto; padding: 0 48px; }

  /* Eyebrow */
  .pp-eyebrow {
    font-family: var(--mono); font-size: 10px; font-weight: 700;
    letter-spacing: .18em; text-transform: uppercase;
    display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
  }
  .pp-eyebrow::before {
    content: ''; width: 20px; height: 1px; display: inline-block;
  }

  /* Section heading */
  .pp-heading {
    font-family: var(--serif); font-weight: 700;
    letter-spacing: -.02em; line-height: 1.1;
  }

  /* ── HERO ── */
  .pp-hero {
    background: var(--navy); padding: 112px 0 0; overflow: hidden; position: relative;
  }
  .pp-hero-glow {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 60% 80% at 50% 120%, rgba(26,122,74,.12) 0%, transparent 70%);
  }
  .pp-hero .pp-container { position: relative; z-index: 1; }
  .pp-hero .pp-eyebrow { color: var(--green-3); }
  .pp-hero .pp-eyebrow::before { background: var(--green-3); }
  .pp-hero-h1 {
    font-family: var(--serif); font-size: clamp(36px, 4.5vw, 56px);
    font-weight: 700; line-height: 1.02; color: #fff;
    letter-spacing: -.03em; margin-bottom: 20px; max-width: 720px;
  }
  .pp-hero-h1 em { font-style: italic; color: var(--green-3); }
  .pp-hero-sub {
    font-size: 15px; color: rgba(255,255,255,.4); line-height: 1.7;
    max-width: 520px; margin-bottom: 32px;
  }

  /* ROI bar */
  .pp-roi {
    border-top: 1px solid rgba(255,255,255,.06);
    padding: 24px 0; display: grid; grid-template-columns: repeat(3,1fr); gap: 0;
  }
  .pp-roi-cell { padding: 0 32px; border-right: 1px solid rgba(255,255,255,.06); }
  .pp-roi-cell:first-child { padding-left: 0; }
  .pp-roi-cell:last-child { padding-right: 0; border-right: none; }
  .pp-roi-num {
    font-family: var(--serif); font-size: 38px; font-weight: 700;
    color: var(--green-3); line-height: 1; letter-spacing: -.02em; margin-bottom: 6px;
  }
  .pp-roi-label { font-size: 12px; color: rgba(255,255,255,.35); line-height: 1.5; max-width: 200px; }
  .pp-roi-cite { font-family: var(--mono); font-size: 10px; color: rgba(255,255,255,.18); margin-top: 6px; }

  /* ── PLANS ── */
  .pp-plans { padding: 56px 0; background: var(--white); }
  .pp-plans-header { text-align: center; margin-bottom: 36px; }
  .pp-plans-header .pp-eyebrow { justify-content: center; color: var(--green); }
  .pp-plans-header .pp-eyebrow::before { background: var(--green); }
  .pp-plans-header .pp-heading { font-size: 40px; color: var(--ink); margin-bottom: 12px; }
  .pp-plans-header p { font-size: 14px; color: var(--ink-3); max-width: 420px; margin: 0 auto; line-height: 1.6; }

  /* Card grid */
  .pp-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--rule); border: 1px solid var(--rule); }

  /* Card base */
  .pp-card { padding: 36px 32px; display: flex; flex-direction: column; position: relative; }
  .pp-card-label {
    font-size: 10px; font-weight: 700; letter-spacing: .2em;
    text-transform: uppercase; margin-bottom: 20px;
  }
  .pp-card-price { margin-bottom: 6px; }
  .pp-card-price span {
    font-family: var(--serif); font-size: 52px; font-weight: 700;
    letter-spacing: -.03em; line-height: 1;
  }
  .pp-card-price sup { font-size: 22px; vertical-align: super; font-weight: 400; margin-right: 1px; }
  .pp-card-note { font-family: var(--mono); font-size: 10px; margin-bottom: 20px; }
  .pp-card-desc { font-size: 13px; line-height: 1.6; margin-bottom: 24px; min-height: 52px; }
  .pp-card-rule { height: 1px; margin: 0 0 24px; }
  .pp-card-features { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; flex: 1; }
  .pp-card-features li { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; line-height: 1.4; }
  .pp-card-cta {
    display: block; text-align: center; text-decoration: none;
    font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
    padding: 14px 24px; transition: all .15s; margin-top: auto;
  }
  .pp-card-cta:focus-visible { outline: 2px solid var(--green-3); outline-offset: 2px; }

  /* 30-day card */
  .pp-card--30 { background: #fff; }
  .pp-card--30 .pp-card-label { color: var(--ink-3); }
  .pp-card--30 .pp-card-price span { color: var(--ink); }
  .pp-card--30 .pp-card-note { color: var(--ink-3); }
  .pp-card--30 .pp-card-desc { color: var(--ink-3); }
  .pp-card--30 .pp-card-rule { background: var(--rule); }
  .pp-card--30 .pp-card-features li { color: var(--ink-2); }
  .pp-card--30 .pp-card-cta { border: 1px solid var(--rule); color: var(--ink); background: none; }
  .pp-card--30 .pp-card-cta:hover { border-color: var(--ink-3); background: var(--white); }

  /* Annual card */
  .pp-card--annual { background: var(--navy); }
  .pp-card--annual .pp-card-label { color: rgba(255,255,255,.35); position: relative; z-index: 1; }
  .pp-card--annual .pp-card-price span { color: #fff; position: relative; z-index: 1; }
  .pp-card--annual .pp-card-note { color: rgba(255,255,255,.35); position: relative; z-index: 1; }
  .pp-card--annual .pp-card-desc { color: rgba(255,255,255,.45); position: relative; z-index: 1; }
  .pp-card--annual .pp-card-rule { background: rgba(255,255,255,.07); position: relative; z-index: 1; }
  .pp-card--annual .pp-card-features { position: relative; z-index: 1; }
  .pp-card--annual .pp-card-features li { color: rgba(255,255,255,.6); }
  .pp-card--annual .pp-card-cta {
    background: var(--green-3); color: var(--navy); border: none;
    position: relative; z-index: 1;
  }
  .pp-card--annual .pp-card-cta:hover { background: #38d98a; }
  .pp-card-glow {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(26,122,74,.15) 0%, transparent 60%);
  }
  .pp-card-badge {
    position: absolute; top: -1px; right: 28px; z-index: 1;
    font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    background: var(--green-3); color: var(--navy); padding: 5px 12px;
  }

  /* Concierge card */
  .pp-card--concierge { background: var(--navy-3); }
  .pp-card--concierge .pp-card-label { color: rgba(255,255,255,.35); }
  .pp-card--concierge .pp-card-price span { font-size: 44px; color: #fff; }
  .pp-card--concierge .pp-card-note { color: rgba(255,255,255,.35); }
  .pp-card--concierge .pp-card-desc { color: rgba(255,255,255,.45); }
  .pp-card--concierge .pp-card-rule { background: rgba(255,255,255,.07); }
  .pp-card--concierge .pp-card-features li { color: rgba(255,255,255,.6); }
  .pp-card--concierge .pp-card-cta {
    border: 1px solid rgba(255,255,255,.2); color: rgba(255,255,255,.8); background: none;
  }
  .pp-card--concierge .pp-card-cta:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.3); }

  .pp-concierge-badge {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px; background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08); margin-bottom: 20px;
  }
  .pp-concierge-icon {
    width: 36px; height: 36px; background: rgba(45,189,116,.12);
    border: 1px solid rgba(45,189,116,.2);
    display: grid; place-items: center; flex-shrink: 0;
  }
  .pp-concierge-badge strong { display: block; font-size: 12px; font-weight: 600; color: rgba(255,255,255,.8); margin-bottom: 2px; }
  .pp-concierge-badge span { font-family: var(--mono); font-size: 10px; color: rgba(255,255,255,.35); }

  .pp-plans-note {
    text-align: center; font-size: 12px; color: var(--ink-3);
    margin-top: 20px; font-family: var(--mono);
  }

  /* ── WHAT'S INSIDE ── */
  .pp-inside { padding: 48px 0; background: var(--navy); }
  .pp-inside .pp-eyebrow { color: rgba(255,255,255,.3); }
  .pp-inside .pp-eyebrow::before { background: rgba(255,255,255,.2); }
  .pp-inside .pp-heading { font-size: 36px; color: #fff; margin-bottom: 0; }
  .pp-feat-grid {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 1px; background: rgba(255,255,255,.05); margin-top: 32px;
  }
  .pp-feat-cell {
    padding: 24px; background: var(--navy); transition: background .15s;
  }
  .pp-feat-cell:hover { background: var(--navy-2); }
  .pp-feat-icon { font-size: 18px; margin-bottom: 14px; }
  .pp-feat-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.85); margin-bottom: 6px; }
  .pp-feat-desc { font-size: 12px; color: rgba(255,255,255,.35); line-height: 1.6; }
  .pp-feat-tag {
    display: inline-block; margin-top: 10px;
    font-family: var(--mono); font-size: 10px;
    padding: 2px 8px; color: var(--green-3);
    border: 1px solid rgba(45,189,116,.25); letter-spacing: .06em;
  }

  /* ── COMPARISON TABLE ── */
  .pp-compare { padding: 48px 0; background: var(--white); }
  .pp-compare .pp-eyebrow { color: var(--green); }
  .pp-compare .pp-eyebrow::before { background: var(--green); }
  .pp-compare .pp-heading { font-size: 36px; color: var(--ink); margin-bottom: 8px; }
  .pp-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin-top: 32px; }
  .pp-table {
    width: 100%; border-collapse: collapse; min-width: 600px;
  }
  .pp-table th {
    padding: 14px 20px; font-size: 10px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--ink-3); border-bottom: 2px solid var(--ink); text-align: center;
  }
  .pp-table th:first-child { text-align: left; width: 40%; }
  .pp-table th.pp-th-featured { color: var(--green); border-bottom-color: var(--green); }
  .pp-table th span {
    font-family: var(--mono); font-size: 11px; font-weight: 400;
    text-transform: none; letter-spacing: 0;
  }
  .pp-table th.pp-th-featured span { color: var(--green); }
  .pp-table td {
    padding: 13px 20px; border-bottom: 1px solid var(--rule);
    font-size: 13px; color: var(--ink-2);
  }
  .pp-table tbody tr:hover td { background: #f0f4f2; }
  .pp-table td:not(:first-child) {
    text-align: center; font-family: var(--mono); font-size: 12px;
  }
  .pp-table .pp-table-section {
    font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    color: var(--ink-3); background: var(--white); padding: 24px 20px 13px;
  }
  .pp-table tr:has(.pp-table-section):hover td { background: var(--white); }
  .pp-table .pp-check { font-size: 16px; color: var(--green); }
  .pp-table .pp-dash { color: var(--rule); }
  .pp-table .pp-val-green { font-weight: 600; color: var(--green); }

  /* ── FAQ ── */
  .pp-faq { padding: 48px 0; background: var(--white); border-top: 1px solid var(--rule); }
  .pp-faq .pp-eyebrow { color: var(--green); }
  .pp-faq .pp-eyebrow::before { background: var(--green); }
  .pp-faq .pp-heading { font-size: 36px; color: var(--ink); margin-bottom: 8px; }
  .pp-faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 48px; margin-top: 32px; }
  .pp-faq-item { padding: 18px 0; border-bottom: 1px solid var(--rule); }
  .pp-faq-q {
    font-size: 14px; font-weight: 600; color: var(--ink); cursor: pointer;
    display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
    background: none; border: none; width: 100%; text-align: left; padding: 0;
    font-family: inherit; line-height: 1.4;
  }
  .pp-faq-q:focus-visible { outline: 2px solid var(--green-3); outline-offset: 2px; }
  .pp-faq-chevron {
    color: var(--ink-3); font-size: 12px; flex-shrink: 0; margin-top: 2px;
    transition: transform .2s; display: inline-block;
  }
  .pp-faq-a { font-size: 13px; color: var(--ink-3); line-height: 1.7; margin-top: 10px; }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .pp-container { padding: 0 24px; }

    /* Hero */
    .pp-hero { padding: 80px 0 0; }
    .pp-hero-sub { margin-bottom: 24px; }
    .pp-roi { grid-template-columns: 1fr; gap: 20px; padding: 20px 0; }
    .pp-roi-cell { padding: 0; border-right: none; border-bottom: 1px solid rgba(255,255,255,.06); padding-bottom: 20px; }
    .pp-roi-cell:last-child { border-bottom: none; padding-bottom: 0; }
    .pp-roi-num { font-size: 32px; }

    /* Cards */
    .pp-plans { padding: 40px 0; }
    .pp-plans-header { margin-bottom: 28px; }
    .pp-cards { grid-template-columns: 1fr; }
    .pp-card { padding: 28px 24px; }
    .pp-card-desc { min-height: auto; }
    .pp-card-badge { right: 20px; }

    /* What's Inside */
    .pp-inside { padding: 40px 0; }
    .pp-feat-grid { grid-template-columns: 1fr; margin-top: 24px; }

    /* Comparison */
    .pp-compare { padding: 40px 0; }
    .pp-table-wrap { margin: 24px -24px 0; padding: 0 24px; }

    /* FAQ */
    .pp-faq { padding: 40px 0; }
    .pp-faq-grid { grid-template-columns: 1fr; gap: 0; }
  }

  @media (max-width: 480px) {
    .pp-container { padding: 0 20px; }
    .pp-hero-h1 { font-size: 32px; }
    .pp-plans-header .pp-heading { font-size: 32px; }
    .pp-table-wrap { margin: 32px -20px 0; padding: 0 20px; }
  }
`;

/* ── SVG Checkmarks ── */
function CheckGreen() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M2.5 7L5.5 10L11.5 4" stroke="var(--green-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckInk() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M2.5 7L5.5 10L11.5 4" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Table helpers ── */
function TC({ val }: { val: string }) {
  const isCheck = val === '✓';
  const isDash = val === '—';
  return (
    <td className={isCheck ? 'pp-check' : isDash ? 'pp-dash' : ''}>
      {val}
    </td>
  );
}

function TCGreen({ val }: { val: string }) {
  return <td className="pp-val-green">{val}</td>;
}

/* ── Main Component ── */
export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(
    'Is Visor affiliated with any advisory firms?'
  );

  const toggleFaq = (q: string) => {
    setOpenFaq((prev) => (prev === q ? null : q));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="pp">

        {/* ── HERO ── */}
        <section className="pp-hero">
          <div className="pp-hero-glow" />
          <div className="pp-container">
            <div className="pp-eyebrow pp-anim">Pricing</div>

            <h1 className="pp-hero-h1 pp-anim pp-d1">
              You&rsquo;re probably paying<br />
              <em>too much</em> already.
            </h1>

            <p className="pp-hero-sub pp-anim pp-d2">
              The average investor overpays their advisor by $8,400 a year. Over 20 years, that&rsquo;s $680,000
              in lost compounding. Visor costs less than one month of that overcharge.
            </p>

            <div className="pp-roi pp-anim pp-d3">
              <div className="pp-roi-cell">
                <div className="pp-roi-num">0.38%</div>
                <div className="pp-roi-label">Average fee overcharge above what the market bears, per year</div>
                <div className="pp-roi-cite">Source: Visor analysis of 14,280 SEC ADV filings · Feb 2025</div>
              </div>
              <div className="pp-roi-cell">
                <div className="pp-roi-num">$8,400</div>
                <div className="pp-roi-label">Annual overpayment for a $2.2M portfolio at average overcharge rate</div>
                <div className="pp-roi-cite">Based on national median HNW portfolio · Cerulli Associates 2024</div>
              </div>
              <div className="pp-roi-cell">
                <div className="pp-roi-num">83&times;</div>
                <div className="pp-roi-label">Return on Visor&rsquo;s annual plan vs. average annual fee savings identified</div>
                <div className="pp-roi-cite">$199 annual plan vs. $16,600 avg. first-year savings identified</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING CARDS ── */}
        <section id="plans" className="pp-plans">
          <div className="pp-container">
            <div className="pp-plans-header">
              <div className="pp-eyebrow">Plans</div>
              <h2 className="pp-heading">Three ways in.</h2>
              <p>Search any advisor free. Unlock full intelligence when you&rsquo;re ready.</p>
            </div>

            <div className="pp-cards">
              {/* 30-Day */}
              <div className="pp-card pp-card--30">
                <div className="pp-card-label">30-Day Access</div>
                <div className="pp-card-price"><span><sup>$</sup>99</span></div>
                <div className="pp-card-note">one-time · no auto-renew</div>
                <p className="pp-card-desc">
                  Full platform access for investors in early-stage research. No recurring billing, no surprises.
                </p>
                <div className="pp-card-rule" />
                <ul className="pp-card-features">
                  {[
                    'Visor Index Score™ for every firm',
                    'All six sub-metric breakdowns',
                    'Historical AUM trend data',
                    'Conflict flags & disclosures',
                    'Advisor comparison tool',
                    'Unlimited firm searches',
                    'Fee benchmarking tool',
                  ].map((f) => (
                    <li key={f}><CheckInk />{f}</li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="pp-card-cta">Get 30-Day Access</Link>
              </div>

              {/* Annual */}
              <div className="pp-card pp-card--annual">
                <div className="pp-card-glow" />
                <div className="pp-card-badge">Most Popular</div>
                <div className="pp-card-label">Annual Access</div>
                <div className="pp-card-price"><span><sup>$</sup>199</span></div>
                <div className="pp-card-note">per year · ~$0.55 per day</div>
                <p className="pp-card-desc">
                  For investors who want year-round monitoring and full platform access as their situation evolves.
                </p>
                <div className="pp-card-rule" />
                <ul className="pp-card-features">
                  {[
                    'Everything in 30-Day Access',
                    '12 months of full access',
                    'Filing change alerts',
                    'Personalized advisor matching quiz',
                    'Export & download capability',
                    'Priority email support',
                  ].map((f) => (
                    <li key={f}><CheckGreen />{f}</li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="pp-card-cta">Get Annual Access</Link>
              </div>

              {/* Concierge */}
              <div className="pp-card pp-card--concierge">
                <div className="pp-card-label">Concierge</div>
                <div className="pp-card-price"><span>Custom</span></div>
                <div className="pp-card-note">tailored engagement · includes annual access</div>
                <p className="pp-card-desc">
                  For investors who want expert due diligence, advisor vetting, and ongoing guidance beyond the data.
                </p>
                <div className="pp-concierge-badge">
                  <div className="pp-concierge-icon">
                    <svg width="14" height="14" fill="none" stroke="rgba(45,189,116,.7)" strokeWidth="1.3" strokeLinecap="round" viewBox="0 0 14 14">
                      <polygon points="7,1 13,4 13,10 7,13 1,10 1,4" fill="none" />
                    </svg>
                  </div>
                  <div>
                    <strong>Customized Analysis</strong>
                    <span>Tailored to your specific situation</span>
                  </div>
                </div>
                <div className="pp-card-rule" />
                <ul className="pp-card-features">
                  {[
                    'Everything in Annual Access',
                    'Custom due diligence & background checks',
                    'Advisor search & introductions',
                    'Fee negotiation benchmarking',
                    'Ongoing monitoring & analysis',
                    'Dedicated research team support',
                  ].map((f) => (
                    <li key={f}><CheckGreen />{f}</li>
                  ))}
                </ul>
                <Link href="/deep-dive" className="pp-card-cta">Request a Consultation</Link>
              </div>
            </div>

            <p className="pp-plans-note">
              Search any advisor free — no account required. Full profiles unlock when you&rsquo;re ready.
            </p>
          </div>
        </section>

        {/* ── WHAT'S INSIDE ── */}
        <section className="pp-inside">
          <div className="pp-container">
            <div className="pp-eyebrow">What&rsquo;s Inside</div>
            <h2 className="pp-heading">Built on data no one else publishes.</h2>

            <div className="pp-feat-grid">
              {[
                { icon: '◈', title: 'Visor Index Score™', desc: 'Proprietary composite across six weighted dimensions: fees, conflicts, AUM growth, client retention, regulatory history, and structure.', tag: 'Exclusive' },
                { icon: '⬡', title: 'Fee Benchmarking', desc: "See exactly where any advisor's fee schedule lands against national, regional, and peer-size percentiles — sourced from SEC ADV filings.", tag: 'All plans' },
                { icon: '△', title: 'Conflict Intelligence', desc: 'Every compensation arrangement, affiliated broker-dealer, referral fee, and 12b-1 relationship — disclosed, flagged, and scored.', tag: 'All plans' },
                { icon: '◯', title: 'AUM Growth Trends', desc: 'Multi-year AUM trajectory, client count evolution, and account size trends derived from every annual ADV filing on record.', tag: 'All plans' },
                { icon: '⊞', title: 'Advisor Comparison', desc: 'Side-by-side scoring, fee schedules, AUM, conflict profiles, and personnel — across up to four firms simultaneously.', tag: 'All plans' },
                { icon: '◎', title: 'Filing Change Alerts', desc: "Get notified when a firm you're watching files an amended ADV — ownership changes, new conflicts, fee revisions, and more.", tag: 'Annual +' },
              ].map((feat) => (
                <div key={feat.title} className="pp-feat-cell">
                  <div className="pp-feat-icon">{feat.icon}</div>
                  <div className="pp-feat-title">{feat.title}</div>
                  <div className="pp-feat-desc">{feat.desc}</div>
                  <span className="pp-feat-tag">{feat.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section className="pp-compare">
          <div className="pp-container">
            <div className="pp-eyebrow">Feature Breakdown</div>
            <h2 className="pp-heading">Everything, compared.</h2>

            <div className="pp-table-wrap">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>30-Day<br /><span>$99</span></th>
                    <th className="pp-th-featured">Annual<br /><span>$199</span></th>
                    <th>Concierge<br /><span>Custom</span></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Core Access */}
                  <tr><td colSpan={4} className="pp-table-section">Core Access</td></tr>
                  {[
                    ['Visor Index Score™',               '✓','✓','✓'],
                    ['Six sub-metric scores',             '✓','✓','✓'],
                    ['Full fee schedule',                 '✓','✓','✓'],
                    ['Conflict flags & disclosures',      '✓','✓','✓'],
                    ['Unlimited firm searches',           '✓','✓','✓'],
                    ['Advisor comparison (up to 4)',      '✓','✓','✓'],
                    ['Fee benchmarking & negotiate tool', '✓','✓','✓'],
                    ['State directory access',            '✓','✓','✓'],
                  ].map(([feature, c1, c2, c3]) => (
                    <tr key={feature}>
                      <td>{feature}</td>
                      <TC val={c1} /><TC val={c2} /><TC val={c3} />
                    </tr>
                  ))}

                  {/* Annual Plan Extras */}
                  <tr><td colSpan={4} className="pp-table-section">Annual Plan Extras</td></tr>
                  <tr>
                    <td>Access duration</td>
                    <td>30 days</td>
                    <TCGreen val="12 months" />
                    <TCGreen val="12 months" />
                  </tr>
                  {[
                    ['Filing change alerts',        '—','✓','✓'],
                    ['Personalized matching quiz',  '—','✓','✓'],
                    ['Data export & download',      '—','✓','✓'],
                    ['Priority email support',      '—','✓','✓'],
                  ].map(([feature, c1, c2, c3]) => (
                    <tr key={feature}>
                      <td>{feature}</td>
                      <TC val={c1} /><TC val={c2} /><TC val={c3} />
                    </tr>
                  ))}

                  {/* Concierge Extras */}
                  <tr><td colSpan={4} className="pp-table-section">Concierge Extras</td></tr>
                  {[
                    ['Custom due diligence & background checks','—','—','✓'],
                    ['Advisor search & introductions',          '—','—','✓'],
                    ['Fee negotiation benchmarking',            '—','—','✓'],
                    ['Ongoing monitoring & analysis',           '—','—','✓'],
                    ['Dedicated research team support',         '—','—','✓'],
                  ].map(([feature, c1, c2, c3]) => (
                    <tr key={feature}>
                      <td>{feature}</td>
                      <TC val={c1} /><TC val={c2} /><TC val={c3} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="pp-faq">
          <div className="pp-container">
            <div className="pp-eyebrow">FAQ</div>
            <h2 className="pp-heading">Common questions.</h2>

            <div className="pp-faq-grid">
              {faqColumns.map((col, ci) => (
                <div key={ci}>
                  {col.map((item) => (
                    <div key={item.q} className="pp-faq-item">
                      <button
                        className="pp-faq-q"
                        onClick={() => toggleFaq(item.q)}
                        aria-expanded={openFaq === item.q}
                      >
                        <span>{item.q}</span>
                        <span
                          className="pp-faq-chevron"
                          style={{ transform: openFaq === item.q ? 'rotate(180deg)' : 'none' }}
                        >▾</span>
                      </button>
                      {openFaq === item.q && (
                        <div className="pp-faq-a">{item.a}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
