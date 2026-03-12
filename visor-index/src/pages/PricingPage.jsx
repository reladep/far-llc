import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

const TABLE_ROWS = [
  { section: 'Core Access' },
  { label: 'Visor Value Score™', t1: true, t2: true, t3: true },
  { label: 'Six sub-metric scores', t1: true, t2: true, t3: true },
  { label: 'Full fee schedule', t1: true, t2: true, t3: true },
  { label: 'Conflict flags & disclosures', t1: true, t2: true, t3: true },
  { label: 'Unlimited firm searches', t1: true, t2: true, t3: true },
  { label: 'Advisor comparison (up to 4)', t1: true, t2: true, t3: true },
  { label: 'Fee benchmarking & negotiate tool', t1: true, t2: true, t3: true },
  { label: 'State directory access', t1: true, t2: true, t3: true },
  { section: 'Annual Plan Extras' },
  { label: 'Access duration', t1: '30 days', t2: '12 months', t3: '12 months', highlight: [false, true, true] },
  { label: 'Filing change alerts', t1: false, t2: true, t3: true },
  { label: 'Personalized matching quiz', t1: false, t2: true, t3: true },
  { label: 'Data export & download', t1: false, t2: true, t3: true },
  { label: 'Priority email support', t1: false, t2: true, t3: true },
  { section: 'Concierge Extras' },
  { label: '60-min 1-on-1 strategy call', t1: false, t2: false, t3: true },
  { label: '3 personalized recommendations', t1: false, t2: false, t3: true },
  { label: 'Custom shortlist + written rationale', t1: false, t2: false, t3: true },
  { label: 'Fee negotiation benchmarking report', t1: false, t2: false, t3: true },
  { label: 'Follow-up Q&A via email', t1: false, t2: false, t3: true },
]

const FEATURES = [
  { icon: '◈', title: 'Visor Value Score™', desc: 'Proprietary composite across six weighted dimensions: fees, conflicts, AUM growth, client retention, regulatory history, and structure.', tag: 'Exclusive' },
  { icon: '⬡', title: 'Fee Benchmarking', desc: 'See exactly where any advisor\'s fee schedule lands against national, regional, and peer-size percentiles — sourced from SEC ADV filings.', tag: 'All plans' },
  { icon: '△', title: 'Conflict Intelligence', desc: 'Every compensation arrangement, affiliated broker-dealer, referral fee, and 12b-1 relationship — disclosed, flagged, and scored.', tag: 'All plans' },
  { icon: '◯', title: 'AUM Growth Trends', desc: 'Multi-year AUM trajectory, client count evolution, and account size trends derived from every annual ADV filing on record.', tag: 'All plans' },
  { icon: '⊞', title: 'Advisor Comparison', desc: 'Side-by-side scoring, fee schedules, AUM, conflict profiles, and personnel — across up to four firms simultaneously.', tag: 'All plans' },
  { icon: '◎', title: 'Filing Change Alerts', desc: 'Get notified when a firm you\'re watching files an amended ADV — ownership changes, new conflicts, fee revisions, and more.', tag: 'Annual +' },
]

const FAQS = [
  { q: 'Is Visor affiliated with any advisory firms?', a: 'No. Visor is entirely independent. We do not accept payments from advisory firms, do not receive referral fees, and have no commercial relationships with any firm in our database. Our only revenue is from user subscriptions.' },
  { q: 'Where does the data come from?', a: "All underlying data comes from SEC IAPD and Form ADV filings — public regulatory documents every registered investment advisor must file. Visor's contribution is the scoring, benchmarking, trend analysis, and intelligence layer built on top of that raw data." },
  { q: 'How current is the data?', a: 'We refresh from SEC filings monthly. Most firms file their ADV annually, with amendments filed on a rolling basis. Filing dates are shown on every profile so you always know the data vintage.' },
  { q: "What's the Concierge session like?", a: 'A 60-minute call with our research team where we walk through your situation — AUM, goals, advisor preferences, geography — and translate that into a shortlist of three vetted recommendations with written rationale and fee context for each.' },
  { q: 'Can I really search for free?', a: "Yes. You can search any of the 14,280 firms in our database without an account. You'll see the firm name, location, AUM, and basic structure. Full VVS scores, sub-metrics, fee schedules, conflict details, and comparison tools require access." },
  { q: 'Does the 30-day plan auto-renew?', a: "No. The 30-day plan is a one-time charge with no auto-renewal. Access expires after 30 days. If you want to continue, you can upgrade to Annual at any point — we'll credit the days remaining." },
  { q: 'Is this useful if I already have an advisor?', a: "Especially then. Many existing clients find the fee benchmarking most valuable — seeing where their current advisor's fees rank gives them context for a real conversation. The Negotiate tool builds you a word-for-word fee reduction script." },
  { q: 'Do you cover state-registered advisors?', a: "Currently Visor covers all SEC-registered investment advisors (firms managing $100M+ in assets). State-registered advisors are on our roadmap for 2025." },
]

function CellVal({ val, highlight }) {
  if (val === true) return <span style={{ color: '#1A7A4A', fontSize: 14 }}>✓</span>
  if (val === false) return <span style={{ color: '#CAD8D0' }}>—</span>
  return <span style={{ fontSize: 12, color: highlight ? '#1A7A4A' : '#5A7568', fontWeight: highlight ? 600 : 400 }}>{val}</span>
}

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div style={{ background: '#F6F8F7', fontFamily: 'DM Sans, sans-serif' }}>
      <Nav />

      {/* ── HERO ── */}
      <section style={{ background: '#0A1C2A', padding: '120px 56px 80px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Pricing</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 700, lineHeight: 1.06, letterSpacing: '-0.02em', color: '#fff', marginBottom: 20 }}>
            You're probably paying<br /><em style={{ fontStyle: 'italic', color: '#2DBD74' }}>too much</em> already.
          </h1>
          <p style={{ fontSize: 16, fontWeight: 300, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, maxWidth: 540, margin: '0 auto 48px' }}>
            The average investor overpays their advisor by $8,400 a year. Over 20 years, that's $680,000 in lost compounding. Visor costs less than one month of that overcharge.
          </p>

          {/* ROI bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)', maxWidth: 900, margin: '0 auto' }}>
            {[
              ['0.38%', 'Average fee overcharge above what the market bears, per year', 'Visor analysis of 14,280 SEC ADV filings · Feb 2025'],
              ['$8,400', 'Annual overpayment for a $2.2M portfolio at average overcharge rate', 'Based on national median HNW portfolio · Cerulli 2024'],
              ['83×', 'Return on Visor\'s annual plan vs. average annual fee savings identified', '$199 annual plan vs. $16,600 avg. first-year savings identified'],
            ].map(([val, label, source]) => (
              <div key={val} style={{ background: '#0A1C2A', padding: '28px 24px' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 700, color: '#2DBD74', marginBottom: 12 }}>{val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 8 }}>{label}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{source}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section id="plans" style={{ padding: '80px 56px', background: '#F6F8F7' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 12 }}>Plans</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 700, color: '#0C1810', marginBottom: 10 }}>Three ways in.</h2>
            <p style={{ fontSize: 14, color: '#5A7568' }}>Search any advisor free. Unlock full intelligence when you're ready.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#CAD8D0' }}>
            {[
              {
                label: '30-Day Access', price: '99', sub: 'one-time · no auto-renew', featured: false, concierge: false,
                desc: 'Full platform access for investors in early-stage research. No recurring billing, no surprises.',
                features: ['Visor Value Score™ for every firm', 'All six sub-metric breakdowns', 'Historical AUM trend data', 'Conflict flags & disclosures', 'Advisor comparison tool', 'Unlimited firm searches', 'Fee benchmarking tool'],
                ctaLabel: 'Get 30-Day Access', ctaPrimary: false,
              },
              {
                label: 'Annual Access', price: '199', sub: 'per year · ~$0.55 per day', featured: true, concierge: false,
                desc: 'For investors who want year-round monitoring and full platform access as their situation evolves.',
                features: ['Everything in 30-Day Access', '12 months of full access', 'Filing change alerts', 'Personalized advisor matching quiz', 'Export & download capability', 'Priority email support'],
                ctaLabel: 'Get Annual Access', ctaPrimary: true, badge: 'Most Popular',
              },
              {
                label: 'Concierge', price: '599', sub: 'one-time · includes annual access', featured: false, concierge: true,
                desc: 'For investors who want expert eyes on their situation alongside the data.',
                features: ['Everything in Annual Access', '3 personalized advisor recommendations', 'Custom shortlist with written rationale', 'Fee negotiation benchmarking report', 'Follow-up Q&A via email'],
                ctaLabel: 'Book Concierge', ctaPrimary: false,
              },
            ].map(tier => (
              <div key={tier.label} style={{
                background: '#fff',
                borderTop: tier.featured ? '2px solid #1A7A4A' : '2px solid #0C1810',
                padding: 32, position: 'relative',
              }}>
                {tier.badge && (
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1A7A4A', marginBottom: 8 }}>{tier.badge}</div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 12 }}>{tier.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 700, color: '#0C1810', lineHeight: 1 }}>
                    <sup style={{ fontSize: 22 }}>$</sup>{tier.price}
                  </span>
                </div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5A7568', marginBottom: 16 }}>{tier.sub}</div>
                <p style={{ fontSize: 13, color: '#5A7568', lineHeight: 1.65, marginBottom: 20 }}>{tier.desc}</p>

                {tier.concierge && (
                  <div style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#E6F4ED', marginBottom: 20, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, background: 'rgba(26,122,74,0.1)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <svg width="13" height="13" fill="none" stroke="#1A7A4A" strokeWidth="1.3" strokeLinecap="round" viewBox="0 0 14 14">
                        <path d="M2 3C2 2.4 2.5 2 3 2h1.5l1 2.5-1.5 1.5s.5 2 2 3.5S9.5 11.5 9.5 11.5L11 10l2.5 1V12.5c0 .6-.5 1-1 1C5 13.5 2 8 2 3z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#0C1810', marginBottom: 2 }}>1-on-1 Strategy Call</div>
                      <div style={{ fontSize: 11, color: '#5A7568' }}>60-minute session with our research team</div>
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #E6F4ED', marginBottom: 20 }} />

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#2E4438', lineHeight: 1.4 }}>
                      <span style={{ color: '#1A7A4A', flexShrink: 0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>

                <a href="#" style={{
                  display: 'block', textAlign: 'center', padding: '13px',
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                  textDecoration: 'none', transition: 'all 0.2s',
                  background: tier.ctaPrimary ? '#1A7A4A' : 'transparent',
                  color: tier.ctaPrimary ? '#fff' : '#0C1810',
                  border: tier.ctaPrimary ? 'none' : '1px solid #CAD8D0',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = tier.ctaPrimary ? '#22995E' : '#E6F4ED'}
                  onMouseLeave={e => e.currentTarget.style.background = tier.ctaPrimary ? '#1A7A4A' : 'transparent'}
                >
                  {tier.ctaLabel}
                </a>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#5A7568', marginTop: 20, fontFamily: 'DM Mono, monospace' }}>
            Search any advisor free — no account required. Full profiles unlock when you're ready.
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '72px 56px', background: '#0A1C2A' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
            <span style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.2)', display: 'inline-block' }}/>
            What's Inside
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 48 }}>
            Built on data no one else publishes.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)' }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: '#0F2538', padding: '28px 24px' }}>
                <div style={{ fontSize: 20, color: '#2DBD74', marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{f.title}</div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 16 }}>{f.desc}</p>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: f.tag === 'Exclusive' ? '#2DBD74' : 'rgba(255,255,255,0.3)',
                  background: f.tag === 'Exclusive' ? 'rgba(45,189,116,0.1)' : 'rgba(255,255,255,0.05)',
                  padding: '3px 8px',
                }}>{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ padding: '72px 56px', background: '#F6F8F7' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 12 }}>
            <span style={{ width: 16, height: 1, background: 'currentColor', display: 'inline-block' }}/>Feature Breakdown
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, color: '#0C1810', marginBottom: 36 }}>Everything, compared.</h2>

          <div style={{ border: '1px solid #CAD8D0', borderTop: '2px solid #0C1810' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #CAD8D0' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', width: '40%', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A7568' }}>Feature</th>
                  {[['30-Day', '$99'], ['Annual', '$199'], ['Concierge', '$599']].map(([t, p], i) => (
                    <th key={t} style={{
                      padding: '14px 16px', textAlign: 'center',
                      fontSize: 11, fontWeight: 700, color: i === 1 ? '#1A7A4A' : '#0C1810',
                      borderLeft: '1px solid #CAD8D0',
                      background: i === 1 ? '#E6F4ED' : 'transparent',
                    }}>
                      {t}<br/>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 400, color: i === 1 ? '#1A7A4A' : '#5A7568' }}>{p}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row, i) => row.section ? (
                  <tr key={i} style={{ background: '#F6F8F7', borderTop: '1px solid #CAD8D0' }}>
                    <td colSpan={4} style={{ padding: '8px 20px', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5A7568' }}>{row.section}</td>
                  </tr>
                ) : (
                  <tr key={i} style={{ borderTop: '1px solid #E6F4ED' }}>
                    <td style={{ padding: '11px 20px', color: '#2E4438', fontSize: 12 }}>{row.label}</td>
                    {['t1', 't2', 't3'].map((t, j) => (
                      <td key={t} style={{ padding: '11px 16px', textAlign: 'center', borderLeft: '1px solid #E6F4ED', background: j === 1 ? 'rgba(26,122,74,0.02)' : 'transparent' }}>
                        <CellVal val={row[t]} highlight={row.highlight?.[j]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '72px 56px', background: '#F6F8F7', borderTop: '1px solid #CAD8D0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 12 }}>
            <span style={{ width: 16, height: 1, background: 'currentColor', display: 'inline-block' }}/>FAQ
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, color: '#0C1810', marginBottom: 36 }}>Common questions.</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {[FAQS.slice(0, 4), FAQS.slice(4)].map((col, ci) => (
              <div key={ci}>
                {col.map((faq, i) => {
                  const idx = ci * 4 + i
                  const isOpen = openFaq === idx
                  return (
                    <div key={faq.q} style={{ borderBottom: '1px solid #CAD8D0', marginBottom: 0 }}>
                      <button onClick={() => setOpenFaq(isOpen ? -1 : idx)} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        width: '100%', padding: '16px 0', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left', gap: 16,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#0C1810', lineHeight: 1.4 }}>{faq.q}</span>
                        <span style={{ fontSize: 14, color: '#5A7568', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                      </button>
                      {isOpen && (
                        <div style={{ paddingBottom: 16, fontSize: 13, color: '#5A7568', lineHeight: 1.75 }}>{faq.a}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FREE SEARCH CTA ── */}
      <section style={{ padding: '56px', background: '#0C1810' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 40 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Start free</div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                Search any advisor.<br />No account required.
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>14,280 firms indexed. Full intelligence unlocks when you're ready.</p>
            </div>
            <Link to="/search" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#1A7A4A', color: '#fff', fontSize: 13, fontWeight: 600,
              padding: '16px 36px', textDecoration: 'none', flexShrink: 0,
              transition: 'background 0.2s', letterSpacing: '0.04em',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#22995E'}
              onMouseLeave={e => e.currentTarget.style.background = '#1A7A4A'}
            >
              Search Advisors →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
