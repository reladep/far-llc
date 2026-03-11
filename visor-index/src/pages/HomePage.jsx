import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

// ── Score animation helpers ───────────────────────────
function scoreColor(v) {
  if (v < 40) return '#EF4444'
  if (v < 65) return '#F59E0B'
  return '#2DBD74'
}
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }

// ── Calculator helpers ────────────────────────────────
const RATES = { g: 0.072, a: 0.058, r: 0.041 }
function fmt(v) { return v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : '$' + Math.round(v / 1000) + 'K' }
function series(p, y, r) { return Array.from({ length: y + 1 }, (_, i) => p * Math.pow(1 + r, i)) }

// ── Use Case data ────────────────────────────────────
const UC_DATA = [
  {
    persona: 'High Net Worth', situation: 'Searching for a multi-family office',
    tag: 'High Net Worth · $5M+',
    desc: 'You need more than a financial advisor. You need a firm that manages complexity across generations.',
    sub: 'Multi-family offices are opaque by design. Visor Index surfaces ownership structures, institutional AUM concentration, conflict arrangements, and fee benchmarks that MFOs rarely volunteer.',
    query: 'Multi-family offices · $500M+ AUM · fee-only · New York', count: '147 results',
    firm: 'Rockbridge Family Partners', meta: 'MFO · New York, NY · $2.1B AUM · Est. 1998',
    score: 91, scoreColor: '#2DBD74',
    metrics: [['Ownership Stability', 97, '#2DBD74'], ['Fee Transparency', 94, '#2DBD74'], ['Conflict Exposure', 88, '#2DBD74'], ['Regulatory Compliance', 96, '#2DBD74']],
    finding: { label: 'Key Finding', flag: false, text: 'Ownership unchanged for <strong>26 years</strong>. No third-party referral arrangements disclosed. Fee structure is <strong>flat retainer only</strong> — no AUM percentage, no hidden incentives.' },
  },
  {
    persona: 'Recently Married', situation: 'Finding your first financial planner together',
    tag: 'Recently Married · Household $250K–$1M',
    desc: "You're combining finances for the first time and want someone you can genuinely trust — not just tolerate.",
    sub: 'New couples are a high-value target for advisors who generate revenue from product placement. Visor Index flags compensation structures before you walk in the door.',
    query: 'Fee-only financial planners · CFP · under $500K minimum · Austin', count: '83 results',
    firm: 'Clearwater Planning Group', meta: 'RIA · Austin, TX · 312 clients · CFP certified',
    score: 58, scoreColor: '#F59E0B',
    metrics: [['Regulatory Compliance', 91, '#2DBD74'], ['Conflict Exposure', 24, '#EF4444'], ['Fee Transparency', 77, '#2DBD74'], ['AUM Growth', 61, '#F59E0B']],
    finding: { label: '⚑ Conflict Flag', flag: true, text: 'Advisor receives <strong>insurance product commissions</strong> from three carriers. Disclosed in ADV Part 2A Item 10 — but not mentioned on their website or in initial consultations.' },
  },
  {
    persona: 'Endowment / Foundation', situation: 'Selecting an OCIO partner',
    tag: 'Endowment / Foundation · $10M–$500M',
    desc: 'Your board needs a defensible OCIO selection process — not a gut feeling and a handshake.',
    sub: 'Visor Index gives investment committees an objective, data-driven shortlist with documented rationale — built from the same regulatory filings your auditors trust.',
    query: 'OCIO providers · institutional clients · $50M+ AUM minimum', count: '62 results',
    firm: 'Verity Institutional Advisors', meta: 'RIA · Boston, MA · $18.4B AUM · Institutional focus',
    score: 87, scoreColor: '#2DBD74',
    metrics: [['Regulatory Compliance', 99, '#2DBD74'], ['Ownership Stability', 93, '#2DBD74'], ['Conflict Exposure', 71, '#F59E0B'], ['AUM Growth', 84, '#2DBD74']],
    finding: { label: 'Key Finding', flag: false, text: 'Zero disciplinary actions in <strong>14 years</strong>. AUM grown from $4.1B to $18.4B — entirely organic, no acquisition-driven spikes. Passes institutional-grade conflict screening.' },
  },
  {
    persona: 'New Investor', situation: 'Getting serious about investing for the first time',
    tag: 'New Investor · $50K–$250K',
    desc: "You're ready to get serious — but you don't know what you don't know about who you're hiring.",
    sub: "Most new investors can't evaluate an advisor's regulatory record. Visor Index translates the SEC filing into plain language, so you know exactly what you're getting into.",
    query: 'Fee-only RIAs · no minimum · fiduciary · Denver', count: '211 results',
    firm: 'Meridian First Wealth', meta: 'RIA · Denver, CO · 890 clients · No minimum',
    score: 82, scoreColor: '#2DBD74',
    metrics: [['Fee Transparency', 95, '#2DBD74'], ['Conflict Exposure', 89, '#2DBD74'], ['Regulatory Compliance', 93, '#2DBD74'], ['Client Retention', 68, '#F59E0B']],
    finding: { label: 'Key Finding', flag: false, text: 'Flat subscription fee — <strong>$150/month</strong>, no AUM percentage. No commission arrangements of any kind. Conflict score of 89 puts them in the <strong>top 6%</strong> for independence.' },
  },
  {
    persona: 'Sudden Wealth', situation: "Recently inherited and looking for a trusted partner",
    tag: 'Sudden Wealth · Inheritance or Liquidity Event',
    desc: "You've come into significant money quickly. Everyone wants to help — and that's exactly when you need to be most careful.",
    sub: 'Sudden wealth events attract advisors with commission-based models. Visor Index identifies who is truly independent versus who profits from steering your assets into specific products.',
    query: 'Wealth management · inheritance specialists · fiduciary · Chicago', count: '94 results',
    firm: 'Harborview Wealth Partners', meta: 'RIA · Chicago, IL · $3.8B AUM · 214 clients',
    score: 41, scoreColor: '#EF4444',
    metrics: [['Regulatory Compliance', 86, '#2DBD74'], ['Conflict Exposure', 18, '#EF4444'], ['Fee Transparency', 52, '#F59E0B'], ['Ownership Stability', 29, '#EF4444']],
    finding: { label: '⚑ Multiple Flags', flag: true, text: 'Firm sold to private equity <strong>18 months ago</strong>. Three referral compensation arrangements active. Conflict score of 18 places them in the <strong>bottom 4%</strong> nationally.' },
  },
  {
    persona: 'Already Have an Advisor', situation: "Already working with an advisor — want to know how they rank",
    tag: 'Current Client · Any Portfolio Size',
    desc: "You have an advisor. Things seem fine. But you've never actually checked the record.",
    sub: "Most investors never benchmark their current advisor — because until now, there was no easy way to do it. Visor Index scores your advisor against 40,000+ peers so you know exactly where you stand.",
    query: 'Waverly Capital Advisors · Boston, MA', count: 'Profile found',
    firm: 'Waverly Capital Advisors', meta: 'RIA · Boston, MA · $890M AUM · 203 clients',
    score: 63, scoreColor: '#F59E0B',
    metrics: [['Regulatory Compliance', 88, '#2DBD74'], ['Fee Transparency', 61, '#F59E0B'], ['Conflict Exposure', 34, '#EF4444'], ['Ownership Stability', 58, '#F59E0B']],
    finding: { label: '⚑ Below National Median', flag: true, text: 'Conflict score of 34 ranks in the <strong>bottom 22%</strong> nationally. Two undisclosed referral arrangements found in ADV Part 2A. National median Visor Score for similar-sized RIAs: <strong>74</strong>.' },
  },
]

// ── Firms for logo bar ────────────────────────────────
const FIRMS = ['Vanguard', 'Fidelity', 'Merrill Lynch', 'Schwab', 'Morgan Stanley', 'Baird', 'Northern Trust', 'Edelman', 'Bernstein', 'Cetera']

// ── VVS Metrics ────────────────────────────────────────
const VVS_METRICS = [
  { name: 'Regulatory Compliance', val: 96, color: '#2DBD74' },
  { name: 'Fee Transparency',      val: 91, color: '#2DBD74' },
  { name: 'AUM Growth Trajectory', val: 88, color: '#2DBD74' },
  { name: 'Conflict of Interest',  val: 67, color: '#F59E0B' },
  { name: 'Ownership Stability',   val: 82, color: '#2DBD74' },
  { name: 'Client Retention',      val: 79, color: '#2DBD74' },
]
const VVS_PILLARS = [
  { name: 'Conflict of Interest Exposure', w: '22%', bg: '#1A7A4A' },
  { name: 'Regulatory Compliance',         w: '20%', bg: '#22995E' },
  { name: 'Fee Transparency',              w: '18%', bg: '#2DBD74' },
  { name: 'AUM Growth Trajectory',         w: '15%', bg: '#5A7568' },
  { name: 'Ownership Stability',           w: '13%', bg: '#B0C4BA' },
  { name: 'Client Retention Proxy',        w: '12%', bg: '#CAD8D0' },
]

// ── Reveal hook ───────────────────────────────────────
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const els = el.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
  return ref
}

export default function HomePage() {
  const pageRef = useReveal()

  // ── Hero score animation ───────────────────────────
  const SCORE = 84
  const RING_R = 100
  const CIRC = 2 * Math.PI * RING_R

  const introRingRef  = useRef(null)
  const introBigRef   = useRef(null)
  const cardRingRef   = useRef(null)
  const cardBigRef    = useRef(null)
  const instrumentRef = useRef(null)
  const stageRef      = useRef(null)
  const [cardVisible, setCardVisible] = useState(false)
  const [tickersVisible, setTickersVisible] = useState(false)
  const [barsAnimate, setBarsAnimate] = useState(false)

  useEffect(() => {
    const stage    = stageRef.current
    const intro    = introRingRef.current
    const introBig = introBigRef.current
    const instrument = instrumentRef.current
    if (!stage || !intro || !instrument) return

    // Position stage over hero instrument
    function positionStage() {
      const rect = instrument.getBoundingClientRect()
      stage.style.left   = rect.left + 'px'
      stage.style.top    = rect.top + 'px'
      stage.style.width  = rect.width + 'px'
      stage.style.height = rect.height + 'px'
      stage.style.opacity = '1'
    }

    // Phase 1: count up
    function phase1() {
      positionStage()
      let start = null
      const dur = 1900
      function step(ts) {
        if (!start) start = ts
        const p = Math.min((ts - start) / dur, 1)
        const e = easeOutCubic(p)
        const v = Math.round(e * SCORE)
        const col = scoreColor(v)
        if (introBig) { introBig.textContent = v; introBig.style.color = col }
        if (intro) {
          intro.style.stroke = col
          intro.style.strokeDashoffset = String(CIRC - CIRC * (v / 100))
        }
        if (p < 1) requestAnimationFrame(step)
        else setTimeout(phase2, 700)
      }
      requestAnimationFrame(step)
    }

    // Phase 2: morph into card slot
    function phase2() {
      setCardVisible(true)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const cardRing = cardRingRef.current
        if (!cardRing) return
        const slotRect  = cardRing.getBoundingClientRect()
        stage.style.transition = 'left 0.85s cubic-bezier(0.76,0,0.24,1), top 0.85s cubic-bezier(0.76,0,0.24,1), width 0.85s cubic-bezier(0.76,0,0.24,1), height 0.85s cubic-bezier(0.76,0,0.24,1), opacity 0.85s ease'
        stage.style.left    = slotRect.left + 'px'
        stage.style.top     = slotRect.top + 'px'
        stage.style.width   = slotRect.width + 'px'
        stage.style.height  = slotRect.height + 'px'
        stage.style.opacity = '0'
        setTimeout(phase3, 900)
      }))
    }

    // Phase 3: tickers + bars
    function phase3() {
      stage.style.display = 'none'
      setTickersVisible(true)
      setTimeout(() => setBarsAnimate(true), 150)
    }

    const t = setTimeout(phase1, 400)
    return () => clearTimeout(t)
  }, [])

  // ── Calculator ────────────────────────────────────
  const [portVal, setPortVal] = useState(500000)
  const [yearVal, setYearVal] = useState(20)
  const calcResults = useCallback(() => {
    const gs = series(portVal, yearVal, RATES.g)
    const as = series(portVal, yearVal, RATES.a)
    const rs = series(portVal, yearVal, RATES.r)
    return { gs, as, rs }
  }, [portVal, yearVal])

  const { gs, as, rs } = calcResults()
  const gap = gs[yearVal] - rs[yearVal]

  // SVG chart path builder
  const chartSvg = useCallback(() => {
    const W = 960, H = 220, pL = 64, pR = 16, pT = 10, pB = 28
    const cW = W - pL - pR, cH = H - pT - pB
    const all = [...gs, ...as, ...rs]
    const minV = portVal * 0.95, maxV = Math.max(...all) * 1.04
    const xP = i => pL + (i / yearVal) * cW
    const yP = v => pT + cH - ((v - minV) / (maxV - minV)) * cH
    const pathLine = s => s.map((v, i) => (i ? 'L' : 'M') + xP(i).toFixed(1) + ',' + yP(v).toFixed(1)).join(' ')
    const pathArea = s => pathLine(s) + ' L' + xP(yearVal).toFixed(1) + ',' + (pT + cH) + ' L' + pL + ',' + (pT + cH) + ' Z'

    let grid = '', xL = ''
    for (let i = 0; i <= 4; i++) {
      const v = minV + (maxV - minV) * (i / 4), yy = yP(v).toFixed(1)
      grid += `<line x1="${pL}" y1="${yy}" x2="${W - pR}" y2="${yy}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`
      grid += `<text x="${pL - 6}" y="${parseFloat(yy) + 4}" text-anchor="end" font-size="9.5" fill="rgba(255,255,255,0.25)" font-family="DM Mono,monospace">${fmt(v)}</text>`
    }
    const step = Math.max(1, Math.floor(yearVal / 5))
    for (let i = 0; i <= yearVal; i += step)
      xL += `<text x="${xP(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="9.5" fill="rgba(255,255,255,0.2)" font-family="DM Mono,monospace">Yr ${i}</text>`

    const dot = (s, c) => `<circle cx="${xP(yearVal).toFixed(1)}" cy="${yP(s[yearVal]).toFixed(1)}" r="4" fill="${c}" stroke="rgba(10,28,42,0.8)" stroke-width="2"/>`

    return `<defs>
      <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2DBD74" stop-opacity="0.1"/><stop offset="100%" stop-color="#2DBD74" stop-opacity="0"/></linearGradient>
      <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#D97706" stop-opacity="0.07"/><stop offset="100%" stop-color="#D97706" stop-opacity="0"/></linearGradient>
      <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EF4444" stop-opacity="0.05"/><stop offset="100%" stop-color="#EF4444" stop-opacity="0"/></linearGradient>
    </defs>
    ${grid}${xL}
    <path d="${pathArea(rs)}" fill="url(#gr)"/>
    <path d="${pathArea(as)}" fill="url(#ga)"/>
    <path d="${pathArea(gs)}" fill="url(#gg)"/>
    <path d="${pathLine(rs)}" fill="none" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="5,3"/>
    <path d="${pathLine(as)}" fill="none" stroke="#D97706" stroke-width="1.5" stroke-dasharray="5,3"/>
    <path d="${pathLine(gs)}" fill="none" stroke="#2DBD74" stroke-width="2"/>
    ${dot(gs, '#2DBD74')}${dot(as, '#D97706')}${dot(rs, '#EF4444')}`
  }, [gs, as, rs, portVal, yearVal])

  // ── Use Case tab ──────────────────────────────────
  const [ucIdx, setUcIdx] = useState(0)
  const uc = UC_DATA[ucIdx]

  return (
    <div ref={pageRef} style={{ background: '#0A1C2A', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>
      <Nav />

      {/* ── CINEMATIC SCORE STAGE ── */}
      <div
        ref={stageRef}
        style={{
          position: 'fixed', zIndex: 600,
          background: '#0A1C2A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <svg width="220" height="220" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
            <circle
              ref={introRingRef}
              cx="110" cy="110" r="100"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC}
              transform="rotate(-90 110 110)"
              style={{ transition: 'stroke 0.2s' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span ref={introBigRef} style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 56, fontWeight: 700, lineHeight: 1, color: scoreColor(0) }}>0</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Visor Score™</span>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '120px 0 80px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-55%)',
          width: 700, height: 700,
          background: 'radial-gradient(ellipse, rgba(26,122,74,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
          backgroundSize: '72px 72px',
        }} />

        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 56px', position: 'relative', zIndex: 2 }}>
          {/* Eyebrow */}
          <div className="reveal" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#2DBD74', marginBottom: 40, justifyContent: 'center',
          }}>
            <span style={{ width: 24, height: 1, background: '#2DBD74', display: 'inline-block' }}/>
            Wealth Intelligence · No Paid Placement · Just the Data · Personalized
            <span style={{ width: 24, height: 1, background: '#2DBD74', display: 'inline-block' }}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 80, alignItems: 'center' }}>
            {/* Left */}
            <div>
              <h1 className="reveal d1" style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(36px, 4.5vw, 62px)', fontWeight: 700,
                lineHeight: 1.08, letterSpacing: '-0.02em', color: '#fff', marginBottom: 24,
              }}>
                Know who manages<br />your wealth —{' '}
                <em style={{ fontStyle: 'italic', color: '#2DBD74' }}>before<br />you hand it over.</em>
              </h1>
              <p className="reveal d2" style={{
                fontSize: 16, fontWeight: 300, color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.75, maxWidth: 480, marginBottom: 40,
              }}>
                Search, compare, track, and negotiate — across thousands of firms managing trillions in assets.
              </p>
              <div className="reveal d3" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <Link to="/search" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.75)',
                  fontSize: 14, fontWeight: 500, padding: '14px 28px', textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 14 14"><circle cx="6" cy="6" r="4"/><line x1="9" y1="9" x2="13" y2="13"/></svg>
                  Search Advisors Free
                </Link>
                <Link to="/pricing" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#1A7A4A', color: '#fff',
                  fontSize: 14, fontWeight: 600, padding: '14px 28px', textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#22995E'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1A7A4A'}
                >
                  Get Full Access →
                </Link>
              </div>
              <div className="reveal d4" style={{
                marginTop: 32, paddingTop: 28,
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 12, color: 'rgba(255,255,255,0.35)',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2DBD74', flexShrink: 0 }}/>
                14,280 SEC-registered RIAs indexed · $48.2T in AUM covered · Updated quarterly from EDGAR
              </div>
            </div>

            {/* Right: Score Card */}
            <div ref={instrumentRef} className="reveal d2" style={{ position: 'relative' }}>
              {/* Ticker A */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                padding: '8px 14px', marginBottom: 8, fontSize: 10, fontFamily: 'DM Mono, monospace',
                color: 'rgba(255,255,255,0.3)', display: 'flex', gap: 16,
                opacity: tickersVisible ? 1 : 0,
                transform: tickersVisible ? 'none' : 'translateY(8px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}>
                <span>NEW FILING: Meridian Wealth Advisors · ADV Part 2A</span>
                <span style={{ color: '#2DBD74' }}>↑ Score updated</span>
              </div>

              {/* Score card */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderTop: '2px solid #2DBD74',
                opacity: cardVisible ? 1 : 0,
                transform: cardVisible ? 'none' : 'translateY(16px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
              }}>
                {/* Card header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Meridian Wealth Advisors</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Mono, monospace' }}>SEC RIA · New York, NY · $2.4B AUM</div>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(45,189,116,0.12)', color: '#2DBD74', padding: '3px 8px' }}>
                    VERIFIED
                  </div>
                </div>

                {/* Ring slot */}
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div ref={cardRingRef} style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
                    <svg width="88" height="88" viewBox="0 0 88 88">
                      <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
                      <circle
                        cx="44" cy="44" r="38"
                        fill="none" strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={2 * Math.PI * 38 - 2 * Math.PI * 38 * (SCORE / 100)}
                        transform="rotate(-90 44 44)"
                        stroke={scoreColor(SCORE)}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span ref={cardBigRef} style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700, lineHeight: 1, color: scoreColor(SCORE) }}>{SCORE}</span>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Score</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Percentile Rank</div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>Top 8% nationally</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>of 40,000+ registered firms</div>
                  </div>
                </div>

                {/* Sub-metric bars */}
                <div style={{ padding: '16px 20px' }}>
                  {[
                    { name: 'Regulatory Compliance', val: 96, color: '#2DBD74', id: 'bar1' },
                    { name: 'Fee Transparency',      val: 91, color: '#2DBD74', id: 'bar2' },
                    { name: 'Conflict Exposure',     val: 67, color: '#F59E0B', id: 'bar3' },
                    { name: 'AUM Growth',            val: 88, color: '#2DBD74', id: 'bar4' },
                  ].map((bar, i) => (
                    <div key={bar.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < 3 ? 8 : 0 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', flex: 1 }}>{bar.name}</span>
                      <div style={{ width: 80, height: 3, background: 'rgba(255,255,255,0.08)', position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          position: 'absolute', left: 0, top: 0, height: '100%',
                          background: bar.color,
                          width: barsAnimate ? bar.val + '%' : '0%',
                          transition: `width 0.8s cubic-bezier(0.33,1,0.68,1) ${i * 130}ms`,
                        }} />
                      </div>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: bar.color, width: 20, textAlign: 'right', flexShrink: 0 }}>{bar.val}</span>
                    </div>
                  ))}
                </div>

                {/* Lock strip */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="10" height="12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3" viewBox="0 0 10 12"><rect x="1" y="5" width="8" height="7" rx="1"/><path d="M3 5V3.5a2 2 0 0 1 4 0V5"/></svg>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>2 more metrics · Full history · Conflict detail</span>
                  </div>
                  <Link to="/pricing" style={{ fontSize: 10, fontWeight: 600, color: '#2DBD74', textDecoration: 'none', letterSpacing: '0.06em' }}>Unlock →</Link>
                </div>
              </div>

              {/* Ticker B */}
              <div style={{
                marginTop: 8, padding: '8px 14px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: 16, fontSize: 9, fontFamily: 'DM Mono, monospace',
                opacity: tickersVisible ? 1 : 0,
                transform: tickersVisible ? 'none' : 'translateY(8px)',
                transition: 'opacity 0.4s ease 0.25s, transform 0.4s ease 0.25s',
              }}>
                {['CA: 2,849 firms', 'NY: 1,842 firms', 'TX: 1,248 firms', 'FL: 1,124 firms', 'IL: 842 firms'].map(t => (
                  <span key={t} style={{ color: 'rgba(255,255,255,0.25)' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGO BAR ── */}
      <div style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 0', overflow: 'hidden' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginBottom: 16 }}>
          Firms We Review
        </div>
        <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)' }}>
          <div className="marquee-track" style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
            {[...FIRMS, ...FIRMS].map((firm, i) => (
              <span key={i} style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {firm}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STAKES ── */}
      <section style={{ padding: '96px 0', background: '#F6F8F7' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 56px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start', marginBottom: 48 }}>
            <div>
              <div className="reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 16 }}>
                <span style={{ width: 20, height: 1, background: 'currentColor', display: 'inline-block' }}/>
                Why This Decision Matters
              </div>
              <h2 className="reveal d1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0C1810', marginBottom: 16 }}>
                Choose the wrong advisor<br/>and it <em style={{ fontStyle: 'italic', color: '#1A7A4A' }}>compounds</em><br/>for decades.
              </h2>
              <p className="reveal d2" style={{ fontSize: 14, color: '#5A7568', lineHeight: 1.75 }}>
                Research suggests investor outcomes vary meaningfully based on advice quality, fees, taxes, and behavioral discipline. Over time, even small annual gaps can compound into millions.
              </p>
            </div>
            <div className="reveal d1">
              <div style={{ padding: '32px', background: '#0C1810', color: '#fff' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 56, fontWeight: 700, color: '#2DBD74', lineHeight: 1 }}>{fmt(gap)}</div>
                <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
                  Estimated difference · {fmt(portVal)} portfolio · {yearVal} years
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8, lineHeight: 1.65 }}>
                  Illustrative estimated outcome gap between stronger and weaker advisor-led investor results.
                </div>
              </div>
            </div>
          </div>

          {/* Calculator */}
          <div className="reveal d1" style={{ background: '#0C1810', padding: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 24 }}>
              {[
                { label: 'Starting Portfolio', val: fmt(portVal), min: 100000, max: 5000000, step: 50000, value: portVal, onChange: e => setPortVal(+e.target.value), lo: '$100K', hi: '$5M' },
                { label: 'Time Horizon', val: yearVal + (yearVal === 1 ? ' year' : ' years'), min: 5, max: 30, step: 1, value: yearVal, onChange: e => setYearVal(+e.target.value), lo: '5 yrs', hi: '30 yrs' },
              ].map(ctrl => (
                <div key={ctrl.label}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>{ctrl.label}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{ctrl.val}</div>
                  <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={ctrl.value} onChange={ctrl.onChange} style={{ width: '100%', marginBottom: 6 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Mono, monospace' }}>
                    <span>{ctrl.lo}</span><span>{ctrl.hi}</span>
                  </div>
                </div>
              ))}
            </div>

            <svg viewBox="0 0 960 220" preserveAspectRatio="none" style={{ width: '100%', height: 160, display: 'block', marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: chartSvg() }} />

            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              {[['#2DBD74', 'Stronger outcome ~7.2% net'], ['#D97706', 'Mid outcome ~5.8% net'], ['#EF4444', 'Weaker outcome ~4.1% net']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />{l}
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Stronger Outcome', val: fmt(gs[yearVal]), color: '#2DBD74', delta: '+' + fmt(gs[yearVal] - portVal) },
                { label: 'Mid Case',          val: fmt(as[yearVal]), color: '#D97706', delta: '+' + fmt(as[yearVal] - portVal) },
                { label: 'Weaker Outcome',    val: fmt(rs[yearVal]), color: '#EF4444', delta: '+' + fmt(rs[yearVal] - portVal) },
              ].map(o => (
                <div key={o.label} style={{ background: '#0C1810', padding: '16px 20px' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>{o.label}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 700, color: o.color }}>{o.val}</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{o.delta}</div>
                </div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: 10, color: '#5A7568', marginTop: 14, lineHeight: 1.7 }}>
            * Illustrative model only. Not a guarantee of performance or investment advice. Actual results vary based on market conditions, taxes, fees, asset allocation, and investor behavior.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '96px 0', background: '#F6F8F7', borderTop: '1px solid #CAD8D0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 56px' }}>
          <div className="reveal" style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 12 }}>How It Works</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 700, color: '#0C1810', marginBottom: 12 }}>
              Institutional-grade diligence — end to end.
            </h2>
            <p style={{ fontSize: 14, color: '#5A7568', maxWidth: 560 }}>
              Search, score, compare, and monitor — everything you need to make the most important financial decision of your life.
            </p>
          </div>

          <div className="reveal d1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#CAD8D0' }}>
            {[
              ['01', 'Search any advisor or firm', 'Find firms by name, city, AUM, minimums, fee structure, and other SEC-disclosed attributes.'],
              ['02', 'Review the Visor Value Score™', 'One composite score plus factor grades — fees, conflicts, compliance, growth, and ownership stability.'],
              ['03', 'Compare & shortlist', 'Side-by-side comparisons and a curated shortlist workflow, built for real diligence.'],
              ['04', 'Track material changes', 'Automated alerts monitor filings for fee changes, ownership shifts, disciplinary disclosures, and other updates.'],
              ['05', 'Negotiate from data', 'Benchmark advisory fees using one of the most comprehensive industry fee datasets — giving you leverage and clarity.'],
              ['06', 'Personalize your selection', 'Run our matching questionnaire for a curated shortlist tailored to your portfolio size, goals, and preferences.'],
            ].map(([num, title, body]) => (
              <div key={num} style={{ background: '#fff', padding: '32px 28px' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500, color: '#2DBD74', marginBottom: 16 }}>{num}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 700, color: '#0C1810', marginBottom: 10 }}>{title}</div>
                <p style={{ fontSize: 13, color: '#5A7568', lineHeight: 1.7 }}>{body}</p>
              </div>
            ))}
          </div>

          <div className="reveal d2" style={{ marginTop: 32, textAlign: 'center' }}>
            <Link to="/pricing" style={{ fontSize: 13, color: '#1A7A4A', textDecoration: 'none', fontWeight: 500 }}>See plans & access tiers →</Link>
          </div>
        </div>
      </section>

      {/* ── PROOF STRIP ── */}
      <div style={{ background: '#0C1810', padding: '48px 56px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)' }}>
          {[
            ['40K+', 'Advisors indexed', 'Every US-registered RIA'],
            ['500+', 'Data points per firm', 'Per filing, per year'],
            ['Quarterly', 'SEC EDGAR sync', 'Always current'],
            ['Zero', 'Paid placements', 'Rankings never for sale'],
          ].map(([val, l1, l2]) => (
            <div key={val} className="reveal" style={{ background: '#0C1810', padding: '28px 24px' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{val}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>{l1}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{l2}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── VVS SECTION ── */}
      <section style={{ padding: '96px 0', background: '#F6F8F7' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 56px' }}>
          <div className="reveal" style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 12 }}>The Intelligence Layer</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 700, color: '#0C1810' }}>
              The <em style={{ fontStyle: 'italic', color: '#1A7A4A' }}>Visor Value Score™</em><br/>— our proprietary edge.
            </h2>
          </div>

          <div className="reveal d1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
            {/* VVS card */}
            <div style={{ background: '#fff', border: '1px solid #CAD8D0', borderTop: '2px solid #0C1810' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #CAD8D0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 700, color: '#0C1810' }}>Meridian Wealth Advisors</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5A7568', marginTop: 3 }}>SEC RIA · New York, NY · $2.4B AUM</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, color: '#1A7A4A' }}>84</div>
                  <div style={{ fontSize: 10, color: '#5A7568' }}>/ 100</div>
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #CAD8D0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8, color: '#2E4438' }}>
                  <span>Visor Value Score™</span><span style={{ fontWeight: 600, color: '#1A7A4A' }}>84 / 100</span>
                </div>
                <div style={{ height: 4, background: '#E6F4ED', marginBottom: 8 }}>
                  <div style={{ width: '84%', height: '100%', background: '#1A7A4A' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#5A7568' }}>
                  <span>Percentile rank</span><span style={{ fontWeight: 600, color: '#0C1810' }}>Top 8% of 40,000+ firms</span>
                </div>
              </div>
              <div style={{ padding: '16px 24px' }}>
                {VVS_METRICS.map(m => (
                  <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #E6F4ED' }}>
                    <span style={{ fontSize: 12, color: '#2E4438' }}>{m.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 500, color: '#0C1810' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, display: 'inline-block' }}/>
                      {m.val}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 24px', background: '#F6F8F7', borderTop: '1px solid #CAD8D0', fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#5A7568' }}>
                Derived exclusively from SEC EDGAR filings · Updated quarterly · Not investment advice
              </div>
            </div>

            {/* VVS explanation */}
            <div>
              <p style={{ fontSize: 14, color: '#5A7568', lineHeight: 1.75, marginBottom: 24 }}>
                500+ SEC ADV data points. One score, 0–100. Every advisor in the country. Built entirely on public regulatory data — not influenced by the industry we evaluate.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 16px', background: '#E6F4ED', marginBottom: 28, fontSize: 12, color: '#1A7A4A', fontWeight: 500 }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 13 13"><polygon points="6.5,1 8,5 12,5.4 9.2,8 10.1,12 6.5,10 2.9,12 3.8,8 1,5.4 5,5"/></svg>
                Exclusive to Visor Index — not on BrokerCheck, Morningstar, or anywhere else.
              </div>
              <div style={{ marginBottom: 24 }}>
                {VVS_PILLARS.map(p => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, background: p.bg, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#2E4438', flex: 1 }}>{p.name}</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500, color: '#0C1810' }}>{p.w}</span>
                  </div>
                ))}
              </div>
              <Link to="#" style={{ fontSize: 12, color: '#1A7A4A', textDecoration: 'none', fontWeight: 500 }}>Read the full methodology →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '96px 0', background: '#0A1C2A' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 56px' }}>
          <div className="reveal" style={{ marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
              <span style={{ width: 20, height: 1, background: 'currentColor', display: 'inline-block' }}/>
              Access
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 700, color: '#fff' }}>
              Three ways to find the right advisor.
            </h2>
          </div>

          <div className="reveal d1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)' }}>
            {[
              {
                label: '30-Day Access', price: '99', period: '/ 30 days', featured: false, concierge: false,
                desc: 'Full platform access for investors in early-stage research. No recurring billing.',
                features: ['Full Visor Value Score™ for every firm', 'All six sub-metric scores', 'Historical AUM trend data', 'Conflict flags and disclosures', 'Advisor comparison tool', 'Unlimited firm searches'],
                cta: 'Get 30-Day Access', ctaStyle: 'outline',
              },
              {
                label: 'Annual Access', price: '199', period: '/ year', featured: true, concierge: false,
                desc: 'For investors who want ongoing monitoring and the full picture — year-round.',
                features: ['Everything in 30-Day Access', '12 months of full access', 'Filing change alerts', 'Personalized advisor matching', 'Export and download capability', 'Priority email support'],
                cta: 'Get Annual Access', ctaStyle: 'primary', badge: 'Most Popular',
              },
              {
                label: 'Concierge', price: '599', period: 'one-time', featured: false, concierge: true,
                desc: 'For investors who want expert guidance alongside the data.',
                features: ['Everything in Annual Access', '3 personalized advisor recommendations', 'Custom shortlist with written rationale', 'Fee negotiation benchmarking report', 'Follow-up Q&A via email'],
                cta: 'Book Concierge', ctaStyle: 'white',
              },
            ].map(tier => (
              <div key={tier.label} style={{
                background: tier.featured ? '#0F2538' : tier.concierge ? '#162F45' : '#0A1C2A',
                borderTop: tier.featured ? '2px solid #2DBD74' : '2px solid rgba(255,255,255,0.08)',
                padding: 32, position: 'relative',
              }}>
                {tier.badge && (
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2DBD74', marginBottom: 12 }}>{tier.badge}</div>
                )}
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{tier.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 700, color: '#fff' }}><sup style={{ fontSize: 20 }}>$</sup>{tier.price}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{tier.period}</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, marginBottom: 24 }}>{tier.desc}</p>
                {tier.concierge && (
                  <div style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', marginBottom: 24, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" viewBox="0 0 13 13"><path d="M2 2.5C2 2 2.5 1.5 3 1.5h1.5l1 2.5L4 5.5s.5 2 2 3.5 3.5 2 3.5 2l1.5-1.5 2.5 1V12c0 .5-.5 1-1 1C5 13 2 7.5 2 2.5z"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 2 }}>1-on-1 Strategy Call</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>60-minute session with our team</div>
                    </div>
                  </div>
                )}
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                      <span style={{ color: '#2DBD74', flexShrink: 0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <a href="#" style={{
                  display: 'block', textAlign: 'center', padding: '13px 24px',
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                  textDecoration: 'none', transition: 'all 0.2s',
                  background: tier.ctaStyle === 'primary' ? '#1A7A4A' : tier.ctaStyle === 'white' ? '#fff' : 'transparent',
                  color: tier.ctaStyle === 'white' ? '#0C1810' : '#fff',
                  border: tier.ctaStyle === 'outline' ? '1px solid rgba(255,255,255,0.2)' : 'none',
                }}>
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>
          <p className="reveal d2" style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Search any advisor free — no account required. Full profile unlocks when you're ready.
          </p>
        </div>
      </section>

      {/* ── USE CASE SELECTOR ── */}
      <section style={{ padding: '96px 0', background: '#F6F8F7' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 56px' }}>
          <div className="reveal" style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 12 }}>Who It's For</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 700, color: '#0C1810' }}>
              Built for every investor.<br/><em style={{ fontStyle: 'italic', color: '#1A7A4A' }}>Calibrated to your situation.</em>
            </h2>
          </div>

          <div className="reveal d1" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 1, background: '#CAD8D0' }}>
            {/* Tab list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {UC_DATA.map((u, i) => (
                <button key={i} onClick={() => setUcIdx(i)} style={{
                  display: 'flex', flexDirection: 'column', gap: 3,
                  padding: '18px 20px', textAlign: 'left', cursor: 'pointer', border: 'none',
                  background: ucIdx === i ? '#fff' : '#F6F8F7',
                  borderLeft: ucIdx === i ? '3px solid #1A7A4A' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: ucIdx === i ? '#0C1810' : '#2E4438' }}>{u.persona}</span>
                  <span style={{ fontSize: 11, color: ucIdx === i ? '#5A7568' : '#5A7568', lineHeight: 1.4 }}>{u.situation}</span>
                  {ucIdx === i && <span style={{ fontSize: 11, color: '#1A7A4A', marginTop: 2 }}>→</span>}
                </button>
              ))}
            </div>

            {/* Panel */}
            <div style={{ background: '#fff', padding: '32px' }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                color: '#5A7568', background: '#F6F8F7', padding: '4px 10px', display: 'inline-block', marginBottom: 16,
              }}>{uc.tag}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 700, color: '#0C1810', marginBottom: 10 }}>{uc.desc}</div>
              <p style={{ fontSize: 13, color: '#5A7568', lineHeight: 1.7, marginBottom: 24 }}>{uc.sub}</p>

              {/* Search sim */}
              <div style={{ background: '#F6F8F7', border: '1px solid #CAD8D0', padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, fontSize: 11 }}>
                <span style={{ color: '#5A7568', fontWeight: 600 }}>{uc.query.startsWith('Looking') ? 'Looking up' : 'Search'}</span>
                <span style={{ color: '#0C1810', flex: 1 }}>{uc.query}</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#2DBD74', background: '#E6F4ED', padding: '2px 8px' }}>{uc.count}</span>
              </div>

              {/* Firm card */}
              <div style={{ border: '1px solid #CAD8D0', borderTop: '2px solid #0C1810', marginBottom: 16 }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #E6F4ED', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 700, color: '#0C1810' }}>{uc.firm}</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#5A7568', marginTop: 3 }}>{uc.meta}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 700, color: uc.scoreColor }}>{uc.score}</div>
                    <div style={{ fontSize: 9, color: '#5A7568' }}>Visor Score™</div>
                  </div>
                </div>
                <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {uc.metrics.map(([name, val, color]) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }}/>
                      <span style={{ color: '#5A7568', flex: 1 }}>{name}</span>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, color: '#0C1810' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finding */}
              <div style={{
                padding: '14px 16px',
                background: uc.finding.flag ? '#FEF3F2' : '#E6F4ED',
                borderLeft: `3px solid ${uc.finding.flag ? '#EF4444' : '#1A7A4A'}`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: uc.finding.flag ? '#EF4444' : '#1A7A4A', marginBottom: 6 }}>{uc.finding.label}</div>
                <div style={{ fontSize: 12, color: uc.finding.flag ? '#7F1D1D' : '#0C1810', lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: uc.finding.text }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '96px 0 0', background: '#0A1C2A', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 56px', textAlign: 'center' }}>
          <div className="reveal" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 20 }}>
            Make the Decision
          </div>
          <h2 className="reveal d1" style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(32px,4vw,56px)', fontWeight: 700,
            lineHeight: 1.08, letterSpacing: '-0.02em', color: '#fff', marginBottom: 40,
          }}>
            You're about to hand<br />someone your <em style={{ fontStyle: 'italic', color: '#2DBD74' }}>life savings.</em><br />Know the score first.
          </h2>
          <div className="reveal d2" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/pricing" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#1A7A4A', color: '#fff', fontSize: 14, fontWeight: 600,
              padding: '16px 36px', textDecoration: 'none', transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#22995E'}
              onMouseLeave={e => e.currentTarget.style.background = '#1A7A4A'}
            >
              Get Full Access
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 14 14"><line x1="2" y1="7" x2="12" y2="7"/><polyline points="8,3 12,7 8,11"/></svg>
            </Link>
            <Link to="/search" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)',
              fontSize: 14, fontWeight: 500, padding: '16px 36px', textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            >
              Search Advisors Free
            </Link>
          </div>
        </div>

        {/* Skyline */}
        <div style={{ marginTop: 64 }}>
          <svg viewBox="0 0 1120 160" fill="none" style={{ width: '100%', display: 'block' }}>
            <defs>
              <linearGradient id="sfade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="60%" stopColor="#0A1C2A" stopOpacity="0"/>
                <stop offset="100%" stopColor="#0A1C2A" stopOpacity="1"/>
              </linearGradient>
            </defs>
            <line x1="0" y1="152" x2="1120" y2="152" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
            <rect x="0" y="118" width="40" height="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
            <rect x="44" y="96" width="54" height="56" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
            <rect x="102" y="60" width="48" height="92" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6"/>
            <line x1="126" y1="60" x2="126" y2="48" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
            <rect x="154" y="82" width="64" height="70" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
            <rect x="222" y="38" width="50" height="114" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.6"/>
            <line x1="247" y1="38" x2="247" y2="26" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
            <rect x="276" y="68" width="58" height="84" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
            <rect x="338" y="48" width="44" height="104" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
            <rect x="386" y="78" width="66" height="74" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
            <rect x="456" y="32" width="52" height="120" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.6"/>
            <line x1="482" y1="32" x2="482" y2="20" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
            <rect x="512" y="86" width="58" height="66" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
            <rect x="574" y="64" width="44" height="88" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
            <rect x="622" y="100" width="64" height="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
            <rect x="690" y="118" width="50" height="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4"/>
            <rect x="744" y="106" width="60" height="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4"/>
            <rect x="808" y="124" width="72" height="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4"/>
            <rect x="884" y="112" width="56" height="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4"/>
            <rect x="944" y="128" width="60" height="24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.4"/>
            <rect x="1008" y="136" width="70" height="16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.4"/>
            <rect x="0" y="0" width="1120" height="160" fill="url(#sfade)"/>
          </svg>
        </div>
      </section>

      <Footer />
    </div>
  )
}
