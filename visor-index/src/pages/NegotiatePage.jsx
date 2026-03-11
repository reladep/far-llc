import { useState, useEffect } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

const PEER = { p25: 0.0072, med: 0.0100, p75: 0.0130 }
const GROSS = 0.07
const YEARS = 20

function fmtPct(r) { return (r * 100).toFixed(2) + '%' }
function fmt(n) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return '$' + Math.round(n).toLocaleString()
}
function growNet(a, g, fr, y) { return a * Math.pow(1 + g - fr, y) }

function Card({ children, accent, style }) {
  const borderTop = accent === 'green' ? '2px solid var(--green)' : accent === 'amber' ? '2px solid var(--amber)' : '2px solid var(--ink)'
  return (
    <div style={{ background: '#fff', border: '1px solid var(--rule)', borderTop, ...style }}>
      {children}
    </div>
  )
}

function SectionNum({ n }) {
  return (
    <div style={{ width: 26, height: 26, flexShrink: 0, background: 'var(--navy)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--green-3)', fontFamily: 'var(--mono)' }}>{n}</div>
  )
}

export default function NegotiatePage() {
  const [aum, setAum] = useState(1000000)
  const [aumInput, setAumInput] = useState('1,000,000')
  const [feeType, setFeeType] = useState('pct')
  const [feePct, setFeePct] = useState('')
  const [feeFlat, setFeeFlat] = useState('')
  const [client, setClient] = useState('individual')
  const [hasAdvisor, setHasAdvisor] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)

  function handleAumInput(e) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    const val = parseInt(raw) || 0
    setAum(val)
    setAumInput(val.toLocaleString())
  }

  function calcResults() {
    let fee = 0
    if (feeType === 'pct') {
      const r = parseFloat(feePct) / 100
      fee = aum * r
    } else {
      fee = parseFloat(feeFlat.replace(/[^0-9.]/g, '')) || 0
    }
    if (!fee || !aum) return

    const blended = fee / aum
    const { p25, med, p75 } = PEER
    const askRate = Math.max(p25, blended - 0.003)
    const deltaAnnual = fee - aum * med
    const bps = Math.round((blended - med) * 10000)

    // Position on track (p25=3%, med=50%, p75=97%)
    const span = p75 - p25
    const pctPos = Math.min(Math.max(((blended - p25) / span) * 94 + 3, 0), 100)

    const vYou = growNet(aum, GROSS, blended, YEARS)
    const vMed = growNet(aum, GROSS, med, YEARS)
    const vP25 = growNet(aum, GROSS, p25, YEARS)
    const savings20 = vP25 - vYou

    const position = blended < p25 ? 'Below P25 — excellent rate'
      : blended <= med ? 'Below median — competitive'
      : blended <= p75 ? 'Above median — room to negotiate'
      : 'Well above peers — strong case to negotiate'

    setResults({ fee, blended, askRate, deltaAnnual, bps, pctPos, vYou, vMed, vP25, savings20, position, p25, med, p75 })
    setShowResults(true)
  }

  const playbook = results ? [
    {
      title: 'Start with data',
      quote: `"I've been reviewing fee benchmarks from SEC-registered advisors comparable to yours. The median for my AUM tier is ${fmtPct(results.med)}, with the most competitive advisors at ${fmtPct(results.p25)}. I'd like to discuss aligning closer to that."`,
      label: 'Opening',
    },
    {
      title: 'Name the number',
      quote: `"Based on what I've found, I'd like to propose a rate of ${fmtPct(results.askRate)}. That's within the range of comparable advisors managing similar portfolios."`,
      label: 'The Ask',
    },
    {
      title: 'Use relationship leverage',
      quote: `"I'm considering consolidating additional assets here — potentially bringing my total to ${fmt(aum * 1.3)}. Would a rate of ${fmtPct(results.askRate)} make sense at that level?"`,
      label: 'Leverage',
    },
  ] : []

  return (
    <div style={{ background: 'var(--white)', minHeight: '100vh' }}>
      <Nav />

      {/* Hero */}
      <div style={{ background: 'var(--navy)', paddingTop: 'var(--nav-h)', padding: `var(--nav-h) 0 52px`, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '44px 48px 0' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--green-3)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 1, background: 'var(--green-3)', display: 'inline-block' }} />
            Fee Negotiation Tool
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 42, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.06, marginBottom: 12 }}>
            Negotiate fees with<br /><em style={{ fontStyle: 'italic', color: 'var(--green-3)' }}>data behind you.</em>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.75, maxWidth: 500 }}>
            See how your advisory fee compares to industry benchmarks — and get a custom negotiation playbook.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 48px 100px' }}>

        {/* Step 1: Inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <SectionNum n="01" />
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>Your fee details</div>
        </div>

        <Card accent="ink">
          <div style={{ padding: '28px 32px' }}>
            {/* AUM + fee grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 7 }}>Portfolio Value (AUM)</div>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--rule)', background: 'var(--white)' }}>
                  <span style={{ padding: '0 14px', fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink-3)', borderRight: '1px solid var(--rule)', lineHeight: '46px' }}>$</span>
                  <input value={aumInput} onChange={handleAumInput}
                    style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink)', padding: '11px 14px', background: 'none' }} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 7 }}>Fee Type</div>
                <div style={{ display: 'flex', border: '1px solid var(--rule)' }}>
                  {[['pct', '% of AUM'], ['flat', 'Flat Annual'], ['hourly', 'Hourly']].map(([v, l]) => (
                    <button key={v} onClick={() => setFeeType(v)} style={{
                      flex: 1, textAlign: 'center', padding: '10px 6px', fontSize: 11, fontWeight: feeType === v ? 600 : 400,
                      color: feeType === v ? '#fff' : 'var(--ink-3)',
                      background: feeType === v ? 'var(--navy)' : 'var(--white)',
                      border: 'none', borderRight: '1px solid var(--rule)', cursor: 'pointer',
                      fontFamily: 'var(--sans)', transition: 'all 0.15s',
                    }}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fee input */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 7 }}>
                {feeType === 'pct' ? 'Annual Fee Rate (%)' : feeType === 'flat' ? 'Annual Fee ($)' : 'Hourly Rate ($)'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--rule)', background: 'var(--white)' }}>
                {feeType !== 'pct' && <span style={{ padding: '0 14px', fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink-3)', borderRight: '1px solid var(--rule)', lineHeight: '46px' }}>$</span>}
                <input
                  value={feeType === 'pct' ? feePct : feeFlat}
                  onChange={e => feeType === 'pct' ? setFeePct(e.target.value) : setFeeFlat(e.target.value)}
                  placeholder={feeType === 'pct' ? '1.00' : '10,000'}
                  style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink)', padding: '11px 14px', background: 'none' }}
                />
                {feeType === 'pct' && <span style={{ padding: '0 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', borderLeft: '1px solid var(--rule)', height: 46, display: 'flex', alignItems: 'center' }}>%</span>}
              </div>
            </div>

            {/* Client type */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 7 }}>Client Type</div>
              <div style={{ display: 'flex', border: '1px solid var(--rule)' }}>
                {[['individual', 'Individual'], ['household', 'Household / Joint'], ['trust', 'Trust / Entity']].map(([v, l]) => (
                  <button key={v} onClick={() => setClient(v)} style={{
                    flex: 1, textAlign: 'center', padding: '10px 8px', fontSize: 12, fontWeight: client === v ? 600 : 400,
                    color: client === v ? '#fff' : 'var(--ink-3)',
                    background: client === v ? 'var(--navy)' : 'var(--white)',
                    border: 'none', borderRight: '1px solid var(--rule)', cursor: 'pointer',
                    fontFamily: 'var(--sans)', transition: 'all 0.15s',
                  }}>{l}</button>
                ))}
              </div>
            </div>

            <button onClick={calcResults} style={{
              width: '100%', background: 'var(--green)', color: '#fff',
              border: 'none', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase', padding: '15px 24px',
              cursor: 'pointer', transition: 'background 0.15s',
            }}>
              Analyze My Fee →
            </button>
          </div>
        </Card>

        {/* Results */}
        {showResults && results && (
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 36 }}>

            {/* Benchmark */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <SectionNum n="02" />
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Benchmark comparison</div>
              </div>
              <Card accent="green">
                <div style={{ padding: '28px 32px' }}>
                  {/* Track */}
                  <div style={{ position: 'relative', height: 8, background: 'linear-gradient(to right, #2DBD74, #F59E0B, #EF4444)', borderRadius: 4, margin: '20px 0 8px' }}>
                    {/* Peer dots */}
                    {[
                      { pct: 3, label: fmtPct(results.p25), sub: 'P25' },
                      { pct: 50, label: fmtPct(results.med), sub: 'Median' },
                      { pct: 97, label: fmtPct(results.p75), sub: 'P75' },
                    ].map(d => (
                      <div key={d.sub} style={{ position: 'absolute', left: d.pct + '%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', border: '2px solid rgba(0,0,0,0.2)' }} />
                        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: 'var(--ink)' }}>{d.label}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)' }}>{d.sub}</div>
                        </div>
                      </div>
                    ))}
                    {/* You dot */}
                    <div style={{ position: 'absolute', left: results.pctPos + '%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--navy)', border: '2px solid #fff', boxShadow: '0 0 0 2px var(--navy)' }} />
                      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>{fmtPct(results.blended)}</div>
                        <div style={{ fontSize: 9, color: 'var(--ink-3)' }}>You</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 40 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', background: 'var(--green-pale)', padding: '8px 16px', border: '1px solid rgba(26,122,74,0.2)', display: 'inline-block' }}>
                      {results.position}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--rule)', marginTop: 24 }}>
                    {[
                      { label: 'You pay annually', val: fmt(results.fee), sub: fmtPct(results.blended) + ' blended' },
                      { label: 'Peer median pays', val: fmt(aum * results.med), sub: fmtPct(results.med) + ' blended', highlight: results.deltaAnnual > 0 },
                      { label: `${results.bps >= 0 ? '+' : ''}${results.bps} bps vs median`, val: fmt(Math.abs(results.deltaAnnual)), sub: results.deltaAnnual > 0 ? 'above peer median' : 'below peer median', flag: results.bps > 0 },
                    ].map((c, i) => (
                      <div key={i} style={{ background: '#fff', padding: '20px 24px' }}>
                        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>{c.label}</div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, color: c.flag ? 'var(--amber)' : 'var(--ink)', lineHeight: 1, marginBottom: 3 }}>{c.val}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{c.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* 20-year impact */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <SectionNum n="03" />
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>20-year cost of your current fee</div>
              </div>
              <Card accent="ink">
                <div style={{ padding: '28px 32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--rule)' }}>
                    {[
                      { label: 'At your current fee', val: fmt(results.vYou), rate: fmtPct(results.blended) },
                      { label: 'At peer median', val: fmt(results.vMed), rate: fmtPct(results.med) },
                      { label: 'At best-quartile (P25)', val: fmt(results.vP25), rate: fmtPct(results.p25), best: true },
                    ].map((c, i) => (
                      <div key={i} style={{ background: c.best ? 'var(--green-pale)' : '#fff', padding: '20px 24px' }}>
                        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>{c.label}</div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, color: c.best ? 'var(--green)' : 'var(--ink)', lineHeight: 1, marginBottom: 3 }}>{c.val}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{c.rate}</div>
                        {c.best && <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, marginTop: 6 }}>That's {fmt(results.savings20)} more</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 12, padding: '10px 0', borderTop: '1px solid var(--rule)', fontStyle: 'italic' }}>
                    Assumes 7% gross annual return on a {fmt(aum)} portfolio over 20 years.
                  </div>
                </div>
              </Card>
            </div>

            {/* Playbook */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <SectionNum n="04" />
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Your negotiation playbook</div>
                <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: 'var(--green)', background: 'var(--green-pale)', padding: '3px 10px', border: '1px solid rgba(26,122,74,0.2)' }}>
                  Ask for: {fmtPct(results.askRate)}
                </div>
              </div>
              <Card accent="amber">
                <div style={{ padding: '28px 32px' }}>
                  {playbook.map((p, i) => (
                    <div key={i} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: i < playbook.length - 1 ? '1px solid var(--rule)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--amber)', fontWeight: 700 }}>0{i + 1}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', background: 'var(--rule)', padding: '2px 8px' }}>{p.label}</span>
                        <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{p.title}</span>
                      </div>
                      <div style={{ background: 'rgba(10,28,42,0.03)', border: '1px solid var(--rule)', borderLeft: '2px solid var(--amber)', padding: '12px 16px', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7 }}>
                        {p.quote}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
