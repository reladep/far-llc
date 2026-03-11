import { useRef, useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

const TARGET = 84
function scoreColor(v) { return v < 40 ? '#EF4444' : v < 65 ? '#F59E0B' : '#2DBD74' }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }

const METRICS = [
  { name: 'Regulatory Compliance', val: 96, color: '#2DBD74' },
  { name: 'Fee Transparency', val: 91, color: '#2DBD74' },
  { name: 'AUM Growth Trajectory', val: 88, color: '#2DBD74' },
  { name: 'Conflict of Interest Exposure', val: 67, color: '#F59E0B', flag: true },
  { name: 'Ownership Stability', val: 82, color: '#2DBD74' },
  { name: 'Client Retention Proxy', val: 79, color: '#2DBD74' },
]

const AUM_DATA = [1280, 1480, 1720, 1920, 2100]
const AUM_YEARS = [2020, 2021, 2022, 2023, 2024]

const CLIENT_TYPES = [
  { name: 'Individuals (non-HNW)', pct: 28 },
  { name: 'High Net Worth Individuals', pct: 51 },
  { name: 'Charitable / Non-Profit', pct: 14 },
  { name: 'Corporations / Entities', pct: 7 },
]

const SECTIONS = [
  ['vvs', 'VVS Score'],
  ['fees', 'Fees'],
  ['aum', 'AUM & Growth'],
  ['clients', 'Clients'],
  ['regulatory', 'Regulatory'],
  ['personnel', 'Personnel'],
]

export default function FirmProfile() {
  const { id } = useParams()
  const ringRef = useRef(null)
  const numRef = useRef(null)
  const [barsAnim, setBarsAnim] = useState(false)
  const [activeSection, setActiveSection] = useState('vvs')
  const [score, setScore] = useState(0)

  const r = 52, circ = 2 * Math.PI * r

  useEffect(() => {
    window.scrollTo(0, 0)
    const ring = ringRef.current, num = numRef.current
    if (!ring || !num) return
    ring.style.strokeDasharray = circ
    ring.style.strokeDashoffset = circ
    ring.style.stroke = scoreColor(0)
    num.textContent = '0'
    let start = null
    const t = setTimeout(() => {
      function step(ts) {
        if (!start) start = ts
        const p = Math.min((ts - start) / 1600, 1), e = easeOutCubic(p), v = Math.round(e * TARGET)
        const c = scoreColor(v)
        ring.style.stroke = c
        ring.style.strokeDashoffset = circ - circ * (v / 100)
        num.textContent = v
        num.style.color = c
        setScore(v)
        if (p < 1) requestAnimationFrame(step)
        else setBarsAnim(true)
      }
      requestAnimationFrame(step)
    }, 400)
    return () => clearTimeout(t)
  }, [])

  // AUM chart
  const aMin = Math.min(...AUM_DATA) * 0.95, aMax = Math.max(...AUM_DATA) * 1.05
  const cW = 520, cH = 140, pL = 64, pR = 16, pT = 8, pB = 24
  const xP = i => pL + (i / (AUM_DATA.length - 1)) * (cW - pL - pR)
  const yP = v => pT + (cH - pT - pB) - ((v - aMin) / (aMax - aMin)) * (cH - pT - pB)
  const linePath = AUM_DATA.map((v, i) => `${i ? 'L' : 'M'}${xP(i).toFixed(1)},${yP(v).toFixed(1)}`).join(' ')
  const areaPath = linePath + ` L${xP(AUM_DATA.length - 1).toFixed(1)},${(pT + cH - pB).toFixed(1)} L${pL},${(pT + cH - pB).toFixed(1)} Z`

  return (
    <div style={{ background: 'var(--white)', minHeight: '100vh' }}>
      <Nav />

      {/* Breadcrumb */}
      <div style={{
        position: 'fixed', top: 'var(--nav-h)', left: 0, right: 0, zIndex: 400,
        background: 'rgba(10,28,42,0.94)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 56px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Home</Link>
            <span style={{ opacity: 0.3 }}>›</span>
            <Link to="/directory" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Directory</Link>
            <span style={{ opacity: 0.3 }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Rockbridge Family Partners</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, background: 'var(--green)', color: '#fff', padding: '7px 16px', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>
              + Compare
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '7px 14px', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              ♡ Save
            </button>
          </div>
        </div>
      </div>

      {/* Firm hero band */}
      <div style={{ background: 'var(--navy)', marginTop: 'calc(var(--nav-h) + 40px)', padding: '48px 56px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: 120, width: 500, height: 400, background: 'radial-gradient(ellipse,rgba(26,122,74,.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Top row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 32, alignItems: 'center', paddingBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Logo mark */}
            <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>RF</span>
            </div>

            {/* Name + meta */}
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 10 }}>
                Rockbridge Family Partners
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {['Fee-Only', 'Multi-Family Office', 'Fiduciary'].map(b => (
                  <span key={b} style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 10px', border: '1px solid rgba(45,189,116,0.35)', color: 'var(--green-3)', background: 'rgba(45,189,116,0.07)' }}>{b}</span>
                ))}
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 10px', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' }}>SEC Registered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                {[
                  { icon: '📍', text: 'New York, NY' },
                  { icon: '💼', text: '$2.4B AUM' },
                  { icon: '👥', text: '82 clients' },
                  { icon: '📅', text: 'Est. 1998' },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                    <span style={{ opacity: 0.6 }}>{icon}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Score ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingLeft: 32, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ position: 'relative', width: 120, height: 120 }}>
                <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={60} cy={60} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                  <circle cx={60} cy={60} r={r} fill="none" strokeWidth={8} strokeLinecap="round" ref={ringRef}
                    style={{ strokeDasharray: circ, strokeDashoffset: circ, transition: 'stroke-dashoffset 0.05s', stroke: '#EF4444' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span ref={numRef} style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em', color: '#fff', transition: 'color 0.3s' }}>0</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>/ 100</span>
                </div>
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 10, textAlign: 'center' }}>
                Visor Value Score™
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green-3)', marginTop: 4 }}>Top 8% nationally</div>
            </div>
          </div>

          {/* Key stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'Assets Under Management', val: '$2.4B', sub: '+12.4% YoY' },
              { label: 'Total Clients', val: '82', sub: 'HNW & institutional' },
              { label: 'Min. Investment', val: '$5M', sub: 'per relationship' },
              { label: 'Regulatory Record', val: 'Clean', sub: '0 actions, 26 years' },
            ].map(({ label, val, sub }) => (
              <div key={label} style={{ padding: '20px 24px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>{val}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky section nav */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--rule)', position: 'sticky', top: 'calc(var(--nav-h) + 40px)', zIndex: 300 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 56px', display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
          {SECTIONS.map(([id, label]) => (
            <button key={id} onClick={() => setActiveSection(id)} style={{
              fontSize: 12, fontWeight: activeSection === id ? 600 : 500,
              color: activeSection === id ? 'var(--green)' : 'var(--ink-3)',
              textDecoration: 'none', padding: '14px 20px', whiteSpace: 'nowrap',
              borderBottom: activeSection === id ? '2px solid var(--green)' : '2px solid transparent',
              background: 'none', border: 'none', borderBottom: activeSection === id ? '2px solid var(--green)' : '2px solid transparent',
              cursor: 'pointer', letterSpacing: '0.02em', fontFamily: 'var(--sans)',
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 56px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 48, paddingTop: 48 }}>

          {/* Main content */}
          <div>

            {/* VVS Section */}
            {activeSection === 'vvs' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 14, borderBottom: '1px solid var(--rule)' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>Visor Value Score™</div>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>Updated Feb 2025</span>
                </div>

                {/* Overall score */}
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 32, alignItems: 'center', padding: '28px 32px', background: '#fff', border: '1px solid var(--rule)', marginBottom: 20 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 72, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em', color: 'var(--green)' }}>{TARGET}</div>
                  <div style={{ borderLeft: '2px solid var(--green)', paddingLeft: 20 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7 }}>
                      <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Top 8% of 40,000+ SEC-registered firms nationally.</strong>
                      {' '}Scores are computed quarterly from SEC ADV filing data across six weighted sub-metrics.
                    </div>
                  </div>
                </div>

                {/* Sub-metric bars */}
                <div style={{ background: '#fff', border: '1px solid var(--rule)' }}>
                  {METRICS.map(({ name, val, color, flag }, i) => (
                    <div key={name} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 48px', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: i < METRICS.length - 1 ? '1px solid var(--rule)' : 'none' }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>
                        {name}
                        {flag && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#DC2626', padding: '2px 6px', border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.05)', marginLeft: 8, verticalAlign: 'middle' }}>Review</span>}
                      </div>
                      <div style={{ height: 4, background: 'var(--rule)', position: 'relative', overflow: 'visible' }}>
                        <div style={{ height: '100%', width: barsAnim ? val + '%' : '0%', background: color, transition: 'width 0.9s ease', transitionDelay: i * 0.1 + 's' }} />
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, textAlign: 'right', color: color }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '10px 24px', background: 'var(--green-pale)', fontSize: 10, color: 'var(--ink-3)', borderTop: '1px solid var(--rule)', lineHeight: 1.5 }}>
                  Derived exclusively from SEC EDGAR filings · Updated quarterly · Not investment advice
                </div>
              </div>
            )}

            {/* Fees Section */}
            {activeSection === 'fees' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 14, borderBottom: '1px solid var(--rule)' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>Fee Structure</div>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>ADV Part 2A · Item 5</span>
                </div>
                {[
                  { label: 'Fee Type', val: 'Asset-Based (AUM %)', note: 'Flat retainer option available for institutional clients' },
                  { label: 'Negotiability', val: 'Negotiable on request', note: 'Per ADV disclosure' },
                ].map(row => (
                  <div key={row.label} style={{ background: '#fff', border: '1px solid var(--rule)', borderBottom: 'none', padding: '18px 24px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5 }}>{row.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{row.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{row.note}</div>
                  </div>
                ))}
                {/* Fee tiers */}
                <div style={{ background: '#fff', border: '1px solid var(--rule)' }}>
                  <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--rule)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Disclosed Fee Schedule</div>
                  {[
                    { tier: 'First $5M', rate: '1.50%' },
                    { tier: '$5M – $10M', rate: '1.25%' },
                    { tier: '$10M – $25M', rate: '1.00%' },
                    { tier: '$25M+', rate: '0.75%' },
                  ].map(({ tier, rate }) => (
                    <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 24px', borderBottom: '1px solid var(--rule)' }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{tier}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{rate}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, padding: '12px 16px', borderLeft: '2px solid var(--amber)', background: 'rgba(245,158,11,0.05)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 4 }}>Fee Note</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#C97A0A' }}>Above median:</strong> This firm's blended rate is above the peer median at the $10M asset level.{' '}
                    <Link to="/negotiate" style={{ color: 'var(--green)', fontWeight: 600 }}>Negotiate with data →</Link>
                  </div>
                </div>
              </div>
            )}

            {/* AUM Section */}
            {activeSection === 'aum' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 14, borderBottom: '1px solid var(--rule)' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>AUM & Growth</div>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>5-Year History</span>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--rule)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid var(--rule)' }}>
                    {[
                      { label: 'Current AUM', val: '$2.4B', delta: '+12.4%', up: true },
                      { label: '3-Year CAGR', val: '+8.7%', sub: 'Organic growth' },
                      { label: 'Since 2020', val: '+87%', sub: '$1.28B → $2.4B' },
                    ].map(({ label, val, delta, sub, up }) => (
                      <div key={label} style={{ padding: '18px 24px', borderRight: '1px solid var(--rule)' }}>
                        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>{label}</div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{val}</div>
                        {(delta || sub) && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginTop: 4, fontFamily: 'var(--mono)', color: up ? 'var(--green)' : 'var(--ink-3)' }}>{delta || sub}</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '24px 32px 16px', height: 180 }}>
                    <svg viewBox={`0 0 ${cW} ${cH}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2DBD74" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#2DBD74" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[1, 1.5, 2, 2.5].map(v => {
                        const y = yP(v * 1000)
                        return <line key={v} x1={pL} y1={y} x2={cW - pR} y2={y} stroke="var(--rule)" strokeWidth={1} />
                      })}
                      <path d={areaPath} fill="url(#ag)" />
                      <path d={linePath} fill="none" stroke="var(--green-3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      {AUM_DATA.map((v, i) => (
                        <g key={i}>
                          <circle cx={xP(i)} cy={yP(v)} r={4} fill="var(--green)" stroke="#fff" strokeWidth={2} />
                          <text x={xP(i)} y={cH - 4} textAnchor="middle" fontSize={9} fill="var(--ink-3)" fontFamily="DM Mono, monospace">{AUM_YEARS[i]}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Clients Section */}
            {activeSection === 'clients' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 14, borderBottom: '1px solid var(--rule)' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>Client Profile</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {[
                    { label: 'Total Clients', val: '82', sub: 'As of Feb 2025 ADV' },
                    { label: 'Avg. Assets / Client', val: '$29.3M', sub: 'Estimated blended average' },
                  ].map(({ label, val, sub }) => (
                    <div key={label} style={{ background: '#fff', border: '1px solid var(--rule)', padding: '24px 28px' }}>
                      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 700, color: 'var(--ink)', lineHeight: 1, marginBottom: 6 }}>{val}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--rule)' }}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--rule)', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Client Type Breakdown</div>
                  {CLIENT_TYPES.map(({ name, pct }) => (
                    <div key={name} style={{ display: 'grid', gridTemplateColumns: '1fr auto 120px', alignItems: 'center', gap: 16, padding: '12px 24px', borderBottom: '1px solid var(--rule)' }}>
                      <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{name}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>{pct}%</div>
                      <div style={{ height: 3, background: 'var(--rule)' }}>
                        <div style={{ width: pct + '%', height: '100%', background: 'var(--green-2)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regulatory Section */}
            {activeSection === 'regulatory' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 14, borderBottom: '1px solid var(--rule)' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>Regulatory & Compliance</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'var(--green-pale)', border: '1px solid rgba(26,122,74,0.15)', marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(26,122,74,0.12)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 18 }}>✓</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Clean Regulatory Record — No Disciplinary Actions</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Zero reportable events in 26 years of SEC registration. Exceeds 94th percentile for compliance integrity.</div>
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--rule)', marginBottom: 16 }}>
                  {[
                    { label: 'SEC Registration Date', val: '1998' },
                    { label: 'CRD Number', val: '#123456' },
                    { label: 'Form ADV Filed', val: 'February 14, 2025' },
                    { label: 'States of Registration', val: 'NY, CT, NJ, FL, CA + 12 others' },
                    { label: 'Disciplinary Actions', val: 'None' },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '13px 24px', borderBottom: '1px solid var(--rule)' }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: val === 'None' ? 'var(--green)' : 'var(--ink)' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personnel Section */}
            {activeSection === 'personnel' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 14, borderBottom: '1px solid var(--rule)' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>Ownership & Personnel</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--rule)', marginBottom: 16 }}>
                  {[
                    { name: 'James Rockbridge', role: 'Founder & Managing Partner', pct: '68%', badge: 'Founder' },
                    { name: 'Sarah Chen', role: 'Partner & CIO', pct: '22%' },
                    { name: 'Thomas O\'Brien', role: 'Partner', pct: '10%' },
                  ].map(({ name, role, pct, badge }) => (
                    <div key={name} style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', alignItems: 'center', gap: 24, padding: '16px 24px', borderBottom: '1px solid var(--rule)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{role}</div>
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink-2)', fontWeight: 500 }}>{pct}</div>
                      {badge && <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', background: 'var(--green-pale)', color: 'var(--green)', border: '1px solid rgba(26,122,74,0.15)' }}>{badge}</span>}
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px 16px', background: 'var(--green-pale)', border: '1px solid rgba(26,122,74,0.15)', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                  Ownership unchanged for 26+ years. No private equity involvement. This structure scores highly on the Ownership Stability sub-metric.
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Quick actions */}
            <div style={{ background: 'var(--navy)', padding: 20, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button style={{ padding: 11, background: 'var(--green)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', fontFamily: 'var(--sans)' }}>Save Firm</button>
                <Link to="/compare" style={{ display: 'block', textAlign: 'center', padding: 10, background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 11, textDecoration: 'none', fontFamily: 'var(--sans)' }}>Compare</Link>
                <button style={{ padding: 10, background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--sans)' }}>Set Alert</button>
              </div>
            </div>
            {/* Filing info */}
            <div style={{ background: '#fff', border: '1px solid var(--rule)', padding: 20, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }}>Filing Info</div>
              {[['SEC CRD', '#123456'], ['Form ADV Date', 'Feb 14, 2025'], ['Status', 'Active'], ['Jurisdiction', 'Multi-state'], ['Employees', '42']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--green-pale)', fontSize: 12 }}>
                  <span style={{ color: 'var(--ink-3)' }}>{l}</span>
                  <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            {/* Peer ranking */}
            <div style={{ background: 'var(--green-pale)', border: '1px solid rgba(26,122,74,0.2)', padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 10 }}>Peer Ranking</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 700, color: 'var(--green)', lineHeight: 1, marginBottom: 6 }}>Top 8%</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.6 }}>Among 40,000+ SEC-registered RIAs nationally. Ranks #1 in conflict score for NY multi-family offices.</div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
