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
      q: "What's the Concierge session like?",
      a: 'A 60-minute call with our research team where we walk through your situation — AUM, goals, advisor preferences, geography — and translate that into a shortlist of three vetted recommendations with written rationale and fee context for each.',
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

/* ── SVG Checkmarks ── */
function CheckGreen() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <path d="M2.5 7L5.5 10L11.5 4" stroke="#2DBD74" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckInk() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <path d="M2.5 7L5.5 10L11.5 4" stroke="#1A7A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Table cell helper ── */
function TableCell({ val }: { val: string }) {
  const isCheck = val === '✓';
  const isDash = val === '—';
  return (
    <td
      style={{
        padding: '13px 20px',
        textAlign: 'center',
        fontFamily: "'DM Mono', monospace",
        borderBottom: '1px solid #CAD8D0',
        fontSize: isCheck ? 16 : 12,
        color: isCheck ? '#1A7A4A' : isDash ? '#CAD8D0' : '#2E4438',
      }}
    >
      {val}
    </td>
  );
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
      <style suppressHydrationWarning>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: none; }
        }
        .pricing-anim          { opacity: 0; animation: fadeUp .6s ease forwards; }
        .pricing-d1            { animation-delay: .1s; }
        .pricing-d2            { animation-delay: .2s; }
        .pricing-d3            { animation-delay: .3s; }
        .feat-cell             { transition: background .15s; }
        .feat-cell:hover       { background: #0F2538 !important; }
        .pc-cta-outline:hover  { border-color: #5A7568 !important; background: #F6F8F7 !important; }
        .pc-cta-primary:hover  { background: #38d98a !important; }
        .pc-cta-concierge:hover{ background: rgba(255,255,255,.06) !important; border-color: rgba(255,255,255,.3) !important; }
        .fc-cta-btn:hover      { background: #38d98a !important; }
        .compare-tr:hover td   { background: #f0f4f2; }
      `}</style>

      <div style={{ paddingTop: 52 }}>

        {/* ── HERO ── */}
        <section style={{ background: '#0A1C2A', padding: '80px 0 0', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 80% at 50% 120%, rgba(26,122,74,.12) 0%, transparent 70%)',
          }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 1 }}>

            {/* Eyebrow */}
            <div className="pricing-anim" style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.24em', textTransform: 'uppercase',
              color: '#2DBD74', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 20, height: 1, background: '#2DBD74', display: 'inline-block' }} />
              Pricing
            </div>

            {/* Headline */}
            <h1 className="pricing-anim pricing-d1" style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(36px, 4.5vw, 56px)',
              fontWeight: 700, lineHeight: 1.02, color: '#fff',
              letterSpacing: '-.03em', marginBottom: 20, maxWidth: 720,
            }}>
              You&rsquo;re probably paying<br />
              <em style={{ fontStyle: 'italic', color: '#2DBD74' }}>too much</em> already.
            </h1>

            {/* Sub */}
            <p className="pricing-anim pricing-d2" style={{
              fontSize: 15, color: 'rgba(255,255,255,.4)', lineHeight: 1.7,
              maxWidth: 520, marginBottom: 48,
            }}>
              The average investor overpays their advisor by $8,400 a year. Over 20 years, that&rsquo;s $680,000
              in lost compounding. Visor costs less than one month of that overcharge.
            </p>

            {/* ROI Bar */}
            <div className="pricing-anim pricing-d3" style={{
              borderTop: '1px solid rgba(255,255,255,.06)',
              paddingTop: 32, paddingBottom: 32,
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0,
            }}>
              <div style={{ padding: '0 32px 0 0', borderRight: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 38, fontWeight: 700, color: '#2DBD74', lineHeight: 1, letterSpacing: '-.02em', marginBottom: 6 }}>0.38%</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', lineHeight: 1.5, maxWidth: 200 }}>Average fee overcharge above what the market bears, per year</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,.18)', marginTop: 6 }}>Source: Visor analysis of 14,280 SEC ADV filings · Feb 2025</div>
              </div>
              <div style={{ padding: '0 32px', borderRight: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 38, fontWeight: 700, color: '#2DBD74', lineHeight: 1, letterSpacing: '-.02em', marginBottom: 6 }}>$8,400</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', lineHeight: 1.5, maxWidth: 200 }}>Annual overpayment for a $2.2M portfolio at average overcharge rate</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,.18)', marginTop: 6 }}>Based on national median HNW portfolio · Cerulli Associates 2024</div>
              </div>
              <div style={{ padding: '0 0 0 32px' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 38, fontWeight: 700, color: '#2DBD74', lineHeight: 1, letterSpacing: '-.02em', marginBottom: 6 }}>83×</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', lineHeight: 1.5, maxWidth: 200 }}>Return on Visor&rsquo;s annual plan vs. average annual fee savings identified</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,.18)', marginTop: 6 }}>$199 annual plan vs. $16,600 avg. first-year savings identified</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING CARDS ── */}
        <section id="plans" style={{ padding: '80px 0', background: '#F6F8F7' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>

            {/* Section header */}
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase',
                color: '#1A7A4A', marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>Plans</div>
              <h2 style={{
                fontFamily: "'Cormorant Garamond',serif", fontSize: 40, fontWeight: 700,
                color: '#0C1810', letterSpacing: '-.02em', marginBottom: 12,
              }}>Three ways in.</h2>
              <p style={{ fontSize: 14, color: '#5A7568', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
                Search any advisor free. Unlock full intelligence when you&rsquo;re ready.
              </p>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#CAD8D0', border: '1px solid #CAD8D0' }}>

              {/* ── 30-Day ── */}
              <div style={{ background: '#fff', padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 20 }}>
                  30-Day Access
                </div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 700, color: '#0C1810', letterSpacing: '-.03em', lineHeight: 1 }}>
                    <sup style={{ fontSize: 22, verticalAlign: 'super', fontWeight: 400, marginRight: 1 }}>$</sup>99
                  </span>
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#5A7568', marginBottom: 20 }}>one-time · no auto-renew</div>
                <p style={{ fontSize: 13, color: '#5A7568', lineHeight: 1.6, marginBottom: 24, minHeight: 52 }}>
                  Full platform access for investors in early-stage research. No recurring billing, no surprises.
                </p>
                <div style={{ height: 1, background: '#CAD8D0', margin: '0 0 24px' }} />
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, flex: 1 }}>
                  {[
                    'Visor Value Score™ for every firm',
                    'All six sub-metric breakdowns',
                    'Historical AUM trend data',
                    'Conflict flags & disclosures',
                    'Advisor comparison tool',
                    'Unlimited firm searches',
                    'Fee benchmarking tool',
                  ].map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#2E4438', lineHeight: 1.4 }}>
                      <CheckInk />{f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className="pc-cta-outline"
                  style={{
                    display: 'block', textAlign: 'center', textDecoration: 'none',
                    fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
                    padding: '14px 24px', border: '1px solid #CAD8D0', color: '#0C1810',
                    background: 'none', transition: 'all .15s', marginTop: 'auto',
                  }}
                >
                  Get 30-Day Access
                </Link>
              </div>

              {/* ── Annual (featured) ── */}
              <div style={{ background: '#0A1C2A', padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(26,122,74,.15) 0%, transparent 60%)',
                }} />
                {/* Most Popular badge */}
                <div style={{
                  position: 'absolute', top: -1, right: 28, zIndex: 1,
                  fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
                  background: '#2DBD74', color: '#0A1C2A', padding: '5px 12px',
                }}>
                  Most Popular
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 20, position: 'relative', zIndex: 1 }}>
                  Annual Access
                </div>
                <div style={{ marginBottom: 6, position: 'relative', zIndex: 1 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 700, color: '#fff', letterSpacing: '-.03em', lineHeight: 1 }}>
                    <sup style={{ fontSize: 22, verticalAlign: 'super', fontWeight: 400, marginRight: 1 }}>$</sup>199
                  </span>
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 20, position: 'relative', zIndex: 1 }}>per year · ~$0.55 per day</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.6, marginBottom: 24, minHeight: 52, position: 'relative', zIndex: 1 }}>
                  For investors who want year-round monitoring and full platform access as their situation evolves.
                </p>
                <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '0 0 24px', position: 'relative', zIndex: 1 }} />
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, flex: 1, position: 'relative', zIndex: 1 }}>
                  {[
                    'Everything in 30-Day Access',
                    '12 months of full access',
                    'Filing change alerts',
                    'Personalized advisor matching quiz',
                    'Export & download capability',
                    'Priority email support',
                  ].map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.4 }}>
                      <CheckGreen />{f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className="pc-cta-primary"
                  style={{
                    display: 'block', textAlign: 'center', textDecoration: 'none',
                    fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
                    padding: '14px 24px', background: '#2DBD74', color: '#0A1C2A',
                    border: 'none', transition: 'all .15s', marginTop: 'auto',
                    position: 'relative', zIndex: 1,
                  }}
                >
                  Get Annual Access
                </Link>
              </div>

              {/* ── Concierge ── */}
              <div style={{ background: '#162F45', padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 20 }}>
                  Concierge
                </div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 700, color: '#fff', letterSpacing: '-.03em', lineHeight: 1 }}>
                    <sup style={{ fontSize: 22, verticalAlign: 'super', fontWeight: 400, marginRight: 1 }}>$</sup>599
                  </span>
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 20 }}>one-time · includes annual access</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.6, marginBottom: 24, minHeight: 52 }}>
                  For investors who want expert eyes on their situation alongside the data.
                </p>
                {/* Concierge call badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.08)', marginBottom: 20,
                }}>
                  <div style={{
                    width: 36, height: 36, background: 'rgba(45,189,116,.12)',
                    border: '1px solid rgba(45,189,116,.2)',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <svg width="14" height="14" fill="none" stroke="rgba(45,189,116,.7)" strokeWidth="1.3" strokeLinecap="round" viewBox="0 0 14 14">
                      <path d="M2 3C2 2.4 2.5 2 3 2h1.5l1 2.5-1.5 1.5s.5 2 2 3.5S9.5 11.5 9.5 11.5L11 10l2.5 1V12.5c0 .6-.5 1-1 1C5 13.5 2 8 2 3z" />
                    </svg>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.8)', marginBottom: 2 }}>1-on-1 Strategy Call</strong>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,.35)' }}>60-minute session with our research team</span>
                  </div>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '0 0 24px' }} />
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, flex: 1 }}>
                  {[
                    'Everything in Annual Access',
                    '3 personalized advisor recommendations',
                    'Custom shortlist with written rationale',
                    'Fee negotiation benchmarking report',
                    'Follow-up Q&A via email',
                  ].map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.4 }}>
                      <CheckGreen />{f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className="pc-cta-concierge"
                  style={{
                    display: 'block', textAlign: 'center', textDecoration: 'none',
                    fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
                    padding: '14px 24px', border: '1px solid rgba(255,255,255,.2)',
                    color: 'rgba(255,255,255,.8)', background: 'none',
                    transition: 'all .15s', marginTop: 'auto',
                  }}
                >
                  Book Concierge
                </Link>
              </div>

            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#5A7568', marginTop: 20, fontFamily: "'DM Mono',monospace" }}>
              Search any advisor free — no account required. Full profiles unlock when you&rsquo;re ready.
            </p>
          </div>
        </section>

        {/* ── WHAT YOU GET ── */}
        <section style={{ padding: '72px 0', background: '#0A1C2A' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,.3)', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 16, height: 1, background: 'rgba(255,255,255,.2)', display: 'inline-block' }} />
              What&rsquo;s Inside
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 700,
              color: '#fff', letterSpacing: '-.02em', lineHeight: 1.1, marginBottom: 0,
            }}>
              Built on data no one else publishes.
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'rgba(255,255,255,.05)', marginTop: 48 }}>
              {[
                { icon: '◈', title: 'Visor Value Score™', desc: 'Proprietary composite across six weighted dimensions: fees, conflicts, AUM growth, client retention, regulatory history, and structure.', tag: 'Exclusive' },
                { icon: '⬡', title: 'Fee Benchmarking', desc: "See exactly where any advisor's fee schedule lands against national, regional, and peer-size percentiles — sourced from SEC ADV filings.", tag: 'All plans' },
                { icon: '△', title: 'Conflict Intelligence', desc: 'Every compensation arrangement, affiliated broker-dealer, referral fee, and 12b-1 relationship — disclosed, flagged, and scored.', tag: 'All plans' },
                { icon: '◯', title: 'AUM Growth Trends', desc: 'Multi-year AUM trajectory, client count evolution, and account size trends derived from every annual ADV filing on record.', tag: 'All plans' },
                { icon: '⊞', title: 'Advisor Comparison', desc: 'Side-by-side scoring, fee schedules, AUM, conflict profiles, and personnel — across up to four firms simultaneously.', tag: 'All plans' },
                { icon: '◎', title: 'Filing Change Alerts', desc: "Get notified when a firm you're watching files an amended ADV — ownership changes, new conflicts, fee revisions, and more.", tag: 'Annual +' },
              ].map((feat) => (
                <div key={feat.title} className="feat-cell" style={{ padding: '28px 28px', background: '#0A1C2A' }}>
                  <div style={{ fontSize: 18, marginBottom: 14 }}>{feat.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.85)', marginBottom: 6 }}>{feat.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', lineHeight: 1.6 }}>{feat.desc}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 10,
                    fontFamily: "'DM Mono',monospace", fontSize: 10,
                    padding: '2px 8px', color: '#2DBD74',
                    border: '1px solid rgba(45,189,116,.25)', letterSpacing: '.06em',
                  }}>{feat.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section style={{ padding: '72px 0', background: '#F6F8F7' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase',
              color: '#1A7A4A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 16, height: 1, background: '#1A7A4A', display: 'inline-block' }} />
              Feature Breakdown
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 700,
              color: '#0C1810', letterSpacing: '-.02em', lineHeight: 1.1, marginBottom: 8,
            }}>
              Everything, compared.
            </h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 48 }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#5A7568', borderBottom: '2px solid #0C1810', textAlign: 'left', width: '40%' }}>Feature</th>
                  <th style={{ padding: '14px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#5A7568', borderBottom: '2px solid #0C1810', textAlign: 'center' }}>
                    30-Day<br /><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>$99</span>
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#1A7A4A', borderBottom: '2px solid #1A7A4A', textAlign: 'center' }}>
                    Annual<br /><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#1A7A4A' }}>$199</span>
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#5A7568', borderBottom: '2px solid #0C1810', textAlign: 'center' }}>
                    Concierge<br /><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>$599</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Section: Core Access */}
                <tr>
                  <td colSpan={4} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#5A7568', background: '#F6F8F7', padding: '24px 20px 13px', borderBottom: '1px solid #CAD8D0' }}>
                    Core Access
                  </td>
                </tr>
                {[
                  ['Visor Value Score™',               '✓','✓','✓'],
                  ['Six sub-metric scores',             '✓','✓','✓'],
                  ['Full fee schedule',                 '✓','✓','✓'],
                  ['Conflict flags & disclosures',      '✓','✓','✓'],
                  ['Unlimited firm searches',           '✓','✓','✓'],
                  ['Advisor comparison (up to 4)',      '✓','✓','✓'],
                  ['Fee benchmarking & negotiate tool', '✓','✓','✓'],
                  ['State directory access',            '✓','✓','✓'],
                ].map(([feature, c1, c2, c3]) => (
                  <tr key={feature} className="compare-tr">
                    <td style={{ padding: '13px 20px', fontSize: 13, color: '#2E4438', borderBottom: '1px solid #CAD8D0' }}>{feature}</td>
                    <TableCell val={c1} />
                    <TableCell val={c2} />
                    <TableCell val={c3} />
                  </tr>
                ))}

                {/* Section: Annual Plan Extras */}
                <tr>
                  <td colSpan={4} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#5A7568', background: '#F6F8F7', padding: '24px 20px 13px', borderBottom: '1px solid #CAD8D0' }}>
                    Annual Plan Extras
                  </td>
                </tr>
                <tr className="compare-tr">
                  <td style={{ padding: '13px 20px', fontSize: 13, color: '#2E4438', borderBottom: '1px solid #CAD8D0' }}>Access duration</td>
                  <td style={{ padding: '13px 20px', textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 12, color: '#2E4438', borderBottom: '1px solid #CAD8D0' }}>30 days</td>
                  <td style={{ padding: '13px 20px', textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: '#1A7A4A', borderBottom: '1px solid #CAD8D0' }}>12 months</td>
                  <td style={{ padding: '13px 20px', textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: '#1A7A4A', borderBottom: '1px solid #CAD8D0' }}>12 months</td>
                </tr>
                {[
                  ['Filing change alerts',        '—','✓','✓'],
                  ['Personalized matching quiz',  '—','✓','✓'],
                  ['Data export & download',      '—','✓','✓'],
                  ['Priority email support',      '—','✓','✓'],
                ].map(([feature, c1, c2, c3]) => (
                  <tr key={feature} className="compare-tr">
                    <td style={{ padding: '13px 20px', fontSize: 13, color: '#2E4438', borderBottom: '1px solid #CAD8D0' }}>{feature}</td>
                    <TableCell val={c1} />
                    <TableCell val={c2} />
                    <TableCell val={c3} />
                  </tr>
                ))}

                {/* Section: Concierge Extras */}
                <tr>
                  <td colSpan={4} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#5A7568', background: '#F6F8F7', padding: '24px 20px 13px', borderBottom: '1px solid #CAD8D0' }}>
                    Concierge Extras
                  </td>
                </tr>
                {[
                  ['60-min 1-on-1 strategy call',            '—','—','✓'],
                  ['3 personalized recommendations',         '—','—','✓'],
                  ['Custom shortlist + written rationale',   '—','—','✓'],
                  ['Fee negotiation benchmarking report',    '—','—','✓'],
                  ['Follow-up Q&A via email',                '—','—','✓'],
                ].map(([feature, c1, c2, c3]) => (
                  <tr key={feature} className="compare-tr">
                    <td style={{ padding: '13px 20px', fontSize: 13, color: '#2E4438', borderBottom: '1px solid #CAD8D0' }}>{feature}</td>
                    <TableCell val={c1} />
                    <TableCell val={c2} />
                    <TableCell val={c3} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ padding: '72px 0', background: '#F6F8F7', borderTop: '1px solid #CAD8D0' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase',
              color: '#1A7A4A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 16, height: 1, background: '#1A7A4A', display: 'inline-block' }} />
              FAQ
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 700,
              color: '#0C1810', letterSpacing: '-.02em', lineHeight: 1.1, marginBottom: 8,
            }}>
              Common questions.
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 64px', marginTop: 48 }}>
              {faqColumns.map((col, ci) => (
                <div key={ci}>
                  {col.map((item) => (
                    <div key={item.q} style={{ padding: '24px 0', borderBottom: '1px solid #CAD8D0' }}>
                      <div
                        style={{
                          fontSize: 14, fontWeight: 600, color: '#0C1810',
                          marginBottom: openFaq === item.q ? 10 : 0,
                          cursor: 'pointer', display: 'flex',
                          justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                        }}
                        onClick={() => toggleFaq(item.q)}
                      >
                        <span style={{ lineHeight: 1.4 }}>{item.q}</span>
                        <span style={{
                          color: '#5A7568', fontSize: 12, flexShrink: 0, marginTop: 2,
                          transition: 'transform .2s', display: 'inline-block',
                          transform: openFaq === item.q ? 'rotate(180deg)' : 'none',
                        }}>▾</span>
                      </div>
                      {openFaq === item.q && (
                        <div style={{ fontSize: 13, color: '#5A7568', lineHeight: 1.7 }}>
                          {item.a}
                        </div>
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
