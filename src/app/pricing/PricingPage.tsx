'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/* ── FAQ Data ── */
const faqColumns: { q: string; a: string }[][] = [
  [
    {
      q: 'Is Visor affiliated with any advisory firms?',
      a: 'We do not accept payments from advisory firms, do not receive referral fees, and have no commercial relationships with any firm in our database. Our only revenue today is from user subscriptions.',
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
      q: 'What is Customized Analysis?',
      a: 'Customized Analysis is a service add-on available to any paid subscriber. It includes custom due diligence, background checks, advisor introductions, fee benchmarking, and ongoing monitoring. Submit a consultation request from any firm profile or our deep-dive page, and our team will scope the engagement to your needs.',
    },
  ],
  [
    {
      q: 'Can I really search for free?',
      a: "Yes. You can search any of the 14,280 firms in our database without an account. You'll see the firm name, location, AUM, and basic structure. Full Visor Index Scores, sub-metrics, fee schedules, conflict details, and comparison tools require access.",
    },
    {
      q: 'How does the Trial work?',
      a: "The Trial is a $99, two-week, one-time charge with no auto-renewal. You get full platform access for 14 days. If you upgrade to Consumer during your trial, we'll credit your remaining days toward the annual plan.",
    },
    {
      q: "What's the difference between Consumer and Enterprise?",
      a: 'Consumer gives you the core platform with 25 firm alert subscriptions and weekly or monthly digests. Enterprise adds 100 alert subscriptions, daily digests, API access, bulk compare, priority data refresh, export and reporting tools, and dedicated support.',
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
    --sans: 'Inter', sans-serif;
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
    cursor: pointer; width: 100%; font-family: inherit; border: none;
  }
  .pp-card-cta:disabled, .pp-cta-btn:disabled, .pp-sticky-cta:disabled {
    opacity: 0.6; cursor: wait;
  }
  .pp-card-cta:focus-visible { outline: 2px solid var(--green-3); outline-offset: 2px; }

  /* checkout cancel banner */
  .pp-cancel-banner {
    max-width: 780px; margin: 0 auto 24px; padding: 14px 20px;
    background: rgba(245,158,11,.06); border: 1px solid rgba(245,158,11,.2);
    display: flex; align-items: center; gap: 10px;
  }
  .pp-cancel-icon { color: #F59E0B; font-size: 16px; flex-shrink: 0; }
  .pp-cancel-text { font-size: 13px; color: var(--ink); font-family: var(--sans); }

  /* Trial card */
  .pp-card--trial { background: #fff; }
  .pp-card--trial .pp-card-label { color: var(--ink-3); }
  .pp-card--trial .pp-card-price span { color: var(--ink); }
  .pp-card--trial .pp-card-note { color: var(--ink-3); }
  .pp-card--trial .pp-card-desc { color: var(--ink-3); }
  .pp-card--trial .pp-card-rule { background: var(--rule); }
  .pp-card--trial .pp-card-features li { color: var(--ink-2); }
  .pp-card--trial .pp-card-cta { border: 1px solid var(--rule); color: var(--ink); background: none; }
  .pp-card--trial .pp-card-cta:hover { border-color: var(--ink-3); background: var(--white); }

  /* Consumer card */
  .pp-card--consumer { background: var(--navy); }
  .pp-card--consumer .pp-card-label { color: rgba(255,255,255,.35); position: relative; z-index: 1; }
  .pp-card--consumer .pp-card-price span { color: #fff; position: relative; z-index: 1; }
  .pp-card--consumer .pp-card-note { color: rgba(255,255,255,.35); position: relative; z-index: 1; }
  .pp-card--consumer .pp-card-desc { color: rgba(255,255,255,.45); position: relative; z-index: 1; }
  .pp-card--consumer .pp-card-rule { background: rgba(255,255,255,.07); position: relative; z-index: 1; }
  .pp-card--consumer .pp-card-features { position: relative; z-index: 1; }
  .pp-card--consumer .pp-card-features li { color: rgba(255,255,255,.6); }
  .pp-card--consumer .pp-card-cta {
    background: var(--green-3); color: var(--navy); border: none;
    position: relative; z-index: 1;
  }
  .pp-card--consumer .pp-card-cta:hover { background: #38d98a; }
  .pp-card-glow {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(26,122,74,.15) 0%, transparent 60%);
  }
  .pp-card-badge {
    position: absolute; top: -1px; right: 28px; z-index: 1;
    font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    background: var(--green-3); color: var(--navy); padding: 5px 12px;
  }

  /* Enterprise card */
  .pp-card--enterprise { background: var(--navy-3); }
  .pp-card--enterprise .pp-card-label { color: rgba(255,255,255,.35); }
  .pp-card--enterprise .pp-card-price span { color: #fff; }
  .pp-card--enterprise .pp-card-note { color: rgba(255,255,255,.35); }
  .pp-card--enterprise .pp-card-desc { color: rgba(255,255,255,.45); }
  .pp-card--enterprise .pp-card-rule { background: rgba(255,255,255,.07); }
  .pp-card--enterprise .pp-card-features li { color: rgba(255,255,255,.6); }
  .pp-card--enterprise .pp-card-cta {
    border: 1px solid rgba(255,255,255,.3); color: #fff; background: rgba(255,255,255,.1);
  }
  .pp-card--enterprise .pp-card-cta:hover { background: rgba(255,255,255,.15); border-color: rgba(255,255,255,.5); }

  .pp-plans-note {
    text-align: center; font-size: 12px; color: var(--ink-3);
    margin-top: 20px; font-family: var(--mono);
  }

  /* ── CTA BLOCK ── */
  .pp-cta-block { padding: 56px 0; background: var(--navy); text-align: center; }
  .pp-cta-block .pp-eyebrow { justify-content: center; color: var(--green-3); }
  .pp-cta-block .pp-eyebrow::before { background: var(--green-3); }
  .pp-cta-block .pp-heading { font-size: 36px; color: #fff; margin-bottom: 8px; }
  .pp-cta-sub { font-size: 14px; color: rgba(255,255,255,.4); margin-bottom: 28px; }
  .pp-cta-btns { display: flex; justify-content: center; gap: 12px; }
  .pp-cta-btn {
    display: inline-block; text-align: center; text-decoration: none;
    font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
    padding: 14px 28px; transition: all .15s;
  }
  .pp-cta-btn:focus-visible { outline: 2px solid var(--green-3); outline-offset: 2px; }
  .pp-cta-btn--primary { background: var(--green-3); color: var(--navy); border: none; }
  .pp-cta-btn--primary:hover { background: #38d98a; }
  .pp-cta-btn--secondary { background: none; border: 1px solid rgba(255,255,255,.25); color: rgba(255,255,255,.7); }
  .pp-cta-btn--secondary:hover { border-color: rgba(255,255,255,.4); color: #fff; }

  /* ── STICKY BAR ── */
  .pp-sticky {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    background: var(--navy); border-top: 1px solid rgba(255,255,255,.08);
    padding: 12px 0;
    transform: translateY(100%); transition: transform .3s ease;
    pointer-events: none;
  }
  .pp-sticky.visible { transform: translateY(0); pointer-events: auto; }
  .pp-sticky-inner {
    max-width: 1200px; margin: 0 auto; padding: 0 48px;
    display: flex; align-items: center; justify-content: center; gap: 20px;
  }
  .pp-sticky-label {
    font-family: var(--sans); font-size: 13px; font-weight: 500; color: rgba(255,255,255,.6);
  }
  .pp-sticky-label strong { color: #fff; font-weight: 600; }
  .pp-sticky-cta {
    display: inline-block; text-align: center; text-decoration: none;
    font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
    padding: 10px 22px; background: var(--green-3); color: var(--navy); border: none;
    transition: background .15s;
  }
  .pp-sticky-cta:hover { background: #38d98a; }

  /* ── TABLE SCROLL HINT ── */
  .pp-table-hint {
    display: none; text-align: center;
    font-family: var(--mono); font-size: 10px; letter-spacing: .08em;
    color: var(--ink-3); margin-bottom: 8px;
  }
  .pp-table-wrap { position: relative; }
  .pp-table-wrap::after {
    content: ''; display: none;
    position: absolute; top: 0; right: 0; bottom: 0; width: 40px;
    background: linear-gradient(to right, transparent, var(--white));
    pointer-events: none;
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

    /* Comparison */
    .pp-compare { padding: 40px 0; }
    .pp-table-wrap { margin: 24px -24px 0; padding: 0 24px; }
    .pp-table-hint { display: block; }
    .pp-table-wrap::after { display: block; }

    /* CTA block */
    .pp-cta-block { padding: 40px 0; }
    .pp-cta-btns { flex-direction: column; align-items: center; gap: 10px; }
    .pp-cta-btn { width: 100%; max-width: 280px; }

    /* Sticky bar */
    .pp-sticky-inner { padding: 0 24px; }
    .pp-sticky-label { display: none; }

    /* FAQ */
    .pp-faq { padding: 40px 0; }
    .pp-faq-grid { grid-template-columns: 1fr; gap: 0; }
  }

  @media (max-width: 480px) {
    .pp-container { padding: 0 20px; }
    .pp-hero-h1 { font-size: 32px; }
    .pp-plans-header .pp-heading { font-size: 32px; }
    .pp-table-wrap { margin: 32px -20px 0; padding: 0 20px; }
    .pp-sticky-inner { padding: 0 20px; }
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
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutCanceled = searchParams.get('checkout') === 'canceled';
  const [openFaq, setOpenFaq] = useState<string | null>(
    'Is Visor affiliated with any advisory firms?'
  );
  const [plansPast, setPlansPast] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const plansRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);

  const stickyVisible = plansPast && !faqVisible;

  const toggleFaq = (q: string) => {
    setOpenFaq((prev) => (prev === q ? null : q));
  };

  const handlePlanClick = useCallback(async (tier: string) => {
    if (!user) {
      router.push(`/auth/signup?plan=${tier}`);
      return;
    }
    setCheckoutLoading(tier);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setCheckoutLoading(null);
    }
  }, [user, router]);

  useEffect(() => {
    const plansEl = plansRef.current;
    const faqEl = faqRef.current;
    if (!plansEl || !faqEl) return;

    const plansObs = new IntersectionObserver(
      ([entry]) => setPlansPast(!entry.isIntersecting),
      { threshold: 0 }
    );
    const faqObs = new IntersectionObserver(
      ([entry]) => setFaqVisible(entry.isIntersecting),
      { threshold: 0 }
    );

    plansObs.observe(plansEl);
    faqObs.observe(faqEl);
    return () => { plansObs.disconnect(); faqObs.disconnect(); };
  }, []);

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
                <div className="pp-roi-cite">$199 Consumer plan vs. $16,600 avg. first-year savings identified</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING CARDS ── */}
        <section id="plans" className="pp-plans" ref={plansRef}>
          <div className="pp-container">
            {checkoutCanceled && (
              <div className="pp-cancel-banner">
                <span className="pp-cancel-icon">!</span>
                <div className="pp-cancel-text">Checkout was canceled. No charge was made. Pick a plan when you&rsquo;re ready.</div>
              </div>
            )}
            <div className="pp-plans-header">
              <div className="pp-eyebrow">Plans</div>
              <h2 className="pp-heading">Choose your level of access.</h2>
              <p>Search any advisor free. Unlock full intelligence when you&rsquo;re ready.</p>
            </div>

            <div className="pp-cards">
              {/* Trial */}
              <div className="pp-card pp-card--trial">
                <div className="pp-card-label">Trial</div>
                <div className="pp-card-price"><span><sup>$</sup>99</span></div>
                <div className="pp-card-note">2 weeks · one-time · no auto-renew</div>
                <p className="pp-card-desc">
                  Full platform access for two weeks. Low commitment, full capability. Upgrade to Consumer anytime.
                </p>
                <div className="pp-card-rule" />
                <ul className="pp-card-features">
                  {[
                    'Visor Index Score for every firm',
                    'All six sub-metric breakdowns',
                    'Conflict flags & disclosures',
                    'Fee benchmarking & negotiate tool',
                    'Advisor comparison tool',
                    'Unlimited firm searches',
                    '14-day full access window',
                  ].map((f) => (
                    <li key={f}><CheckInk />{f}</li>
                  ))}
                </ul>
                <button className="pp-card-cta" onClick={() => handlePlanClick('trial')} disabled={checkoutLoading === 'trial'}>
                  {checkoutLoading === 'trial' ? 'Loading...' : 'Start Your Trial'}
                </button>
              </div>

              {/* Consumer */}
              <div className="pp-card pp-card--consumer">
                <div className="pp-card-glow" />
                <div className="pp-card-badge">Best Value</div>
                <div className="pp-card-label">Consumer</div>
                <div className="pp-card-price"><span><sup>$</sup>199</span></div>
                <div className="pp-card-note">per year · ~$0.55 per day</div>
                <p className="pp-card-desc">
                  Year-round research, monitoring, and advisor matching — the core product for serious investors.
                </p>
                <div className="pp-card-rule" />
                <ul className="pp-card-features">
                  {[
                    'Everything in Trial',
                    '25 firm alert subscriptions',
                    'Weekly & monthly digest emails',
                    'Personalized advisor matching quiz',
                    'Full platform access year-round',
                    'Priority email support',
                  ].map((f) => (
                    <li key={f}><CheckGreen />{f}</li>
                  ))}
                </ul>
                <button className="pp-card-cta" onClick={() => handlePlanClick('consumer')} disabled={checkoutLoading === 'consumer'}>
                  {checkoutLoading === 'consumer' ? 'Loading...' : 'Get Consumer Access'}
                </button>
              </div>

              {/* Enterprise */}
              <div className="pp-card pp-card--enterprise">
                <div className="pp-card-label">Enterprise</div>
                <div className="pp-card-price"><span><sup>$</sup>499</span></div>
                <div className="pp-card-note">per year</div>
                <p className="pp-card-desc">
                  For power users and institutions who need scale, speed, and deeper integration.
                </p>
                <div className="pp-card-rule" />
                <ul className="pp-card-features">
                  {[
                    'Everything in Consumer',
                    '100 firm alert subscriptions',
                    'Daily digest frequency',
                    'API access',
                    'Bulk compare (unlimited)',
                    'Priority data refresh',
                    'Export & reporting tools',
                    'Dedicated support',
                  ].map((f) => (
                    <li key={f}><CheckGreen />{f}</li>
                  ))}
                </ul>
                <button className="pp-card-cta" onClick={() => handlePlanClick('enterprise')} disabled={checkoutLoading === 'enterprise'}>
                  {checkoutLoading === 'enterprise' ? 'Loading...' : 'Get Enterprise Access'}
                </button>
              </div>
            </div>

            <p className="pp-plans-note">
              Search any advisor free — no account required. Full profiles unlock when you&rsquo;re ready.
            </p>
          </div>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section className="pp-compare">
          <div className="pp-container">
            <div className="pp-eyebrow">Feature Breakdown</div>
            <h2 className="pp-heading">Everything, compared.</h2>

            <div className="pp-table-hint">Swipe to compare all plans &rarr;</div>
            <div className="pp-table-wrap">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Trial<br /><span>$99 / 2wk</span></th>
                    <th className="pp-th-featured">Consumer<br /><span>$199 / yr</span></th>
                    <th>Enterprise<br /><span>$499 / yr</span></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Core Access */}
                  <tr><td colSpan={4} className="pp-table-section">Core Access</td></tr>
                  {[
                    ['Visor Index Score',                '✓','✓','✓'],
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

                  {/* Consumer Plan Extras */}
                  <tr><td colSpan={4} className="pp-table-section">Consumer Plan Extras</td></tr>
                  <tr>
                    <td>Access duration</td>
                    <td>14 days</td>
                    <TCGreen val="12 months" />
                    <TCGreen val="12 months" />
                  </tr>
                  <tr>
                    <td>Firm alert subscriptions</td>
                    <td className="pp-tc">—</td>
                    <TCGreen val="25" />
                    <TCGreen val="100" />
                  </tr>
                  {[
                    ['Filing change alerts',        '—','✓','✓'],
                    ['Personalized matching quiz',  '—','✓','✓'],
                    ['Weekly & monthly digests',    '—','✓','✓'],
                    ['Priority email support',      '—','✓','✓'],
                  ].map(([feature, c1, c2, c3]) => (
                    <tr key={feature}>
                      <td>{feature}</td>
                      <TC val={c1} /><TC val={c2} /><TC val={c3} />
                    </tr>
                  ))}

                  {/* Enterprise Extras */}
                  <tr><td colSpan={4} className="pp-table-section">Enterprise Extras</td></tr>
                  {[
                    ['Daily digest frequency',       '—','—','✓'],
                    ['API access',                   '—','—','✓'],
                    ['Bulk compare (unlimited)',      '—','—','✓'],
                    ['Priority data refresh',        '—','—','✓'],
                    ['Export & reporting tools',      '—','—','✓'],
                    ['Dedicated support',             '—','—','✓'],
                  ].map(([feature, c1, c2, c3]) => (
                    <tr key={feature}>
                      <td>{feature}</td>
                      <TC val={c1} /><TC val={c2} /><TC val={c3} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#5A7568', marginTop: 16, fontFamily: 'var(--sans)' }}>
              Need deeper analysis? <Link href="/deep-dive" style={{ color: '#2DBD74', textDecoration: 'none' }}>Customized Analysis</Link> is available as a service add-on for any paid subscriber.
            </p>
          </div>
        </section>

        {/* ── CTA BLOCK ── */}
        <section className="pp-cta-block">
          <div className="pp-container">
            <div className="pp-eyebrow">Ready?</div>
            <h2 className="pp-heading" style={{ fontSize: 36, color: '#fff', marginBottom: 8 }}>Start with the plan that fits.</h2>
            <p className="pp-cta-sub">Search free. Upgrade when you&rsquo;re ready.</p>
            <div className="pp-cta-btns">
              <button className="pp-cta-btn pp-cta-btn--primary" onClick={() => handlePlanClick('consumer')} disabled={checkoutLoading === 'consumer'}>
                {checkoutLoading === 'consumer' ? 'Loading...' : 'Get Consumer Access'}
              </button>
              <button className="pp-cta-btn pp-cta-btn--secondary" onClick={() => handlePlanClick('trial')} disabled={checkoutLoading === 'trial'}>
                {checkoutLoading === 'trial' ? 'Loading...' : 'Start Your Trial'}
              </button>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="pp-faq" ref={faqRef}>
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

        {/* ── STICKY BAR ── */}
        <div className={`pp-sticky${stickyVisible ? ' visible' : ''}`}>
          <div className="pp-sticky-inner">
            <span className="pp-sticky-label"><strong>Consumer</strong> &middot; $199/yr</span>
            <button className="pp-sticky-cta" onClick={() => handlePlanClick('consumer')} disabled={checkoutLoading === 'consumer'}>
              {checkoutLoading === 'consumer' ? 'Loading...' : 'Get Consumer Access'}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
