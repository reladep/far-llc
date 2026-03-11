import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

function scoreColor(v) { return v < 40 ? '#EF4444' : v < 65 ? '#F59E0B' : '#2DBD74' }

const FIRMS_DATA = [
  {
    id: 0, initials: 'RF', name: 'Rockbridge Family Partners', city: 'New York, NY',
    aum: '$2.1B', clients: 82, founded: 1998, type: 'Family Office · MFO',
    vvs: 91, metrics: [97, 94, 88, 96, 93, 85],
    feeType: 'Flat Retainer', minInvest: '$5M', employees: 34,
    tiers: [{max:5e6,rate:.015},{max:10e6,rate:.0125},{max:25e6,rate:.01},{max:Infinity,rate:.0075}],
    growth: [1200,1380,1560,1720,1890,2100], // $M
    disclosure: 'Clean record · 0 actions in 26 years',
    conflictScore: 88,
  },
  {
    id: 1, initials: 'MV', name: 'Meridian Vantage Advisors', city: 'Boston, MA',
    aum: '$890M', clients: 214, founded: 2008, type: 'RIA · Wealth Mgmt',
    vvs: 74, metrics: [82, 78, 61, 91, 77, 71],
    feeType: 'AUM-based', minInvest: '$1M', employees: 18,
    tiers: [{max:5e6,rate:.0125},{max:10e6,rate:.01},{max:25e6,rate:.009},{max:Infinity,rate:.007}],
    growth: [480, 560, 630, 710, 790, 890],
    disclosure: '1 action · Fully resolved',
    conflictScore: 61,
  },
  {
    id: 2, initials: 'AP', name: 'Ashford Private Wealth', city: 'Chicago, IL',
    aum: '$1.4B', clients: 156, founded: 2003, type: 'RIA · HNW',
    vvs: 68, metrics: [76, 71, 44, 88, 62, 68],
    feeType: 'AUM-based', minInvest: '$2M', employees: 26,
    tiers: [{max:5e6,rate:.014},{max:10e6,rate:.0115},{max:25e6,rate:.0095},{max:Infinity,rate:.0072}],
    growth: [820, 920, 1050, 1160, 1280, 1400],
    disclosure: '2 actions · 1 pending',
    conflictScore: 44,
  },
]

const METRIC_LABELS = [
  'Conflict Exposure', 'Regulatory Compliance', 'Fee Transparency',
  'AUM Growth', 'Ownership Stability', 'Client Retention',
]

const SECTION_IDS = ['vvs', 'aum', 'clients', 'fees', 'regulatory']

function calcFee(firm, aum) {
  let f = 0, r = aum, p = 0
  for (const t of firm.tiers) {
    const s = Math.min(r, t.max - p)
    if (s <= 0) break
    f += s * t.rate; r -= s; p = t.max
    if (r <= 0) break
  }
  return f
}

function fmt(n) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return '$' + Math.round(n).toLocaleString()
}

function MiniRing({ score, size = 48 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - circ * (score / 100)
  const color = scoreColor(score)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: size * 0.3, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  )
}

export default function ComparePage() {
  const [firms, setFirms] = useState(FIRMS_DATA)
  const [aum, setAum] = useState(5000000)
  const [aumInput, setAumInput] = useState('5,000,000')
  const [activeSection, setActiveSection] = useState('vvs')

  const best = firms.reduce((a, b) => a.vvs > b.vvs ? a : b)

  const fees = firms.map(f => calcFee(f, aum))
  const blds = fees.map(f => f / aum)
  const minFee = Math.min(...fees)
  const PEER = 0.0102

  function handleAumInput(e) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    const val = parseInt(raw) || 5000000
    setAum(val)
    setAumInput(val.toLocaleString())
  }

  const sections = {
    vvs: (
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 24, paddingBottom: 12, borderBottom: '2px solid var(--ink)' }}>
          Visor Value Score™
        </div>
        {/* Score row */}
        <div style={{ display: 'grid', gridTemplateColumns: '188px repeat(3,1fr)', borderBottom: '1px solid var(--rule)', padding: '16px 0', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Overall Score</div>
          {firms.map(f => (
            <div key={f.id} style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <MiniRing score={f.vvs} size={52} />
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: scoreColor(f.vvs), lineHeight: 1 }}>{f.vvs}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', marginTop: 2 }}>/ 100</div>
              </div>
            </div>
          ))}
        </div>
        {/* Metric rows */}
        {METRIC_LABELS.map((label, mi) => (
          <div key={label} style={{ display: 'grid', gridTemplateColumns: '188px repeat(3,1fr)', borderBottom: '1px solid var(--rule)', padding: '12px 0', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', paddingRight: 16, borderRight: '1px solid var(--rule)' }}>{label}</div>
            {firms.map(f => {
              const v = f.metrics[mi]
              const maxV = Math.max(...firms.map(x => x.metrics[mi]))
              const isBest = v === maxV
              return (
                <div key={f.id} style={{ padding: '0 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 3, background: 'var(--rule)', overflow: 'hidden' }}>
                      <div style={{ width: v + '%', height: '100%', background: scoreColor(v) }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: isBest ? scoreColor(v) : 'var(--ink-3)', width: 26, textAlign: 'right' }}>{v}</span>
                    {isBest && <span style={{ fontSize: 9, color: 'var(--green)', fontWeight: 700 }}>★</span>}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    ),
    aum: (
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 24, paddingBottom: 12, borderBottom: '2px solid var(--ink)' }}>
          AUM & Growth
        </div>
        {[
          { label: 'Total AUM', vals: firms.map(f => f.aum) },
          { label: 'Client Count', vals: firms.map(f => f.clients.toLocaleString()) },
          { label: 'Founded', vals: firms.map(f => f.founded) },
          { label: 'Employees', vals: firms.map(f => f.employees) },
        ].map(row => (
          <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '188px repeat(3,1fr)', borderBottom: '1px solid var(--rule)', alignItems: 'center' }}>
            <div style={{ padding: '14px 0', fontSize: 12, color: 'var(--ink-3)', borderRight: '1px solid var(--rule)', paddingRight: 16 }}>{row.label}</div>
            {row.vals.map((v, i) => (
              <div key={i} style={{ padding: '14px 20px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>{v}</div>
            ))}
          </div>
        ))}
        {/* AUM Growth mini chart */}
        <div style={{ marginTop: 24, background: '#fff', border: '1px solid var(--rule)', padding: '20px 24px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 16 }}>5-Year AUM Trajectory ($M)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {firms.map(f => (
              <div key={f.id}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>{f.initials}</div>
                <svg viewBox="0 0 120 50" style={{ width: '100%', height: 50, overflow: 'visible' }}>
                  {f.growth.map((v, i) => {
                    const minG = Math.min(...f.growth), maxG = Math.max(...f.growth)
                    const x = (i / (f.growth.length - 1)) * 110 + 5
                    const y = 45 - ((v - minG) / (maxG - minG)) * 35
                    return i === 0 ? null : (
                      <line key={i}
                        x1={(((i-1) / (f.growth.length - 1)) * 110 + 5)}
                        y1={45 - ((f.growth[i-1] - minG) / (maxG - minG)) * 35}
                        x2={x} y2={y}
                        stroke="var(--green-3)" strokeWidth={1.5} />
                    )
                  })}
                  {f.growth.map((v, i) => {
                    const minG = Math.min(...f.growth), maxG = Math.max(...f.growth)
                    const x = (i / (f.growth.length - 1)) * 110 + 5
                    const y = 45 - ((v - minG) / (maxG - minG)) * 35
                    return <circle key={i} cx={x} cy={y} r={2} fill="var(--green)" />
                  })}
                </svg>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
                  {f.growth[0]}M → {f.growth[f.growth.length-1]}M
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    fees: (
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 24, paddingBottom: 12, borderBottom: '2px solid var(--ink)' }}>
          Fee Analysis
        </div>
        {/* AUM input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px 20px', background: 'var(--green-pale)', border: '1px solid rgba(26,122,74,0.15)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Your AUM</span>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--rule)', background: '#fff', flex: '0 0 220px' }}>
            <span style={{ padding: '0 14px', fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink-3)', borderRight: '1px solid var(--rule)', lineHeight: '44px' }}>$</span>
            <input
              value={aumInput}
              onChange={handleAumInput}
              style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink)', padding: '10px 14px', background: 'none' }}
            />
          </div>
          <input type="range" min={500000} max={50000000} step={500000} value={aum}
            onChange={e => { setAum(+e.target.value); setAumInput((+e.target.value).toLocaleString()) }}
            style={{ flex: 1, accentColor: 'var(--green)' }}
          />
        </div>
        {firms.map((f, i) => {
          const fee = fees[i], bld = blds[i]
          const barW = Math.min((bld * 100) / 1.6 * 100, 100)
          const abovePeer = bld > PEER
          const cheapest = fee === minFee
          return (
            <div key={f.id} style={{ marginBottom: 12, background: '#fff', border: '1px solid var(--rule)', borderLeft: cheapest ? '3px solid var(--green)' : '1px solid var(--rule)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{f.name}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: cheapest ? 'var(--green)' : abovePeer ? 'var(--amber)' : 'var(--ink)' }}>{fmt(fee)}/yr</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{(bld * 100).toFixed(3)}%</span>
                </div>
              </div>
              <div style={{ height: 6, background: 'var(--rule)', marginBottom: 8, overflow: 'hidden' }}>
                <div style={{ width: barW + '%', height: '100%', background: cheapest ? 'var(--green)' : abovePeer ? 'var(--amber)' : 'var(--green-2)', transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-3)' }}>
                <span>{cheapest ? '✓ Lowest of the group' : abovePeer ? `↑ ${((bld - PEER) * 100).toFixed(2)}% above peer median` : `↓ ${((PEER - bld) * 100).toFixed(2)}% below peer median`}</span>
                <span>Peer median: {(PEER * 100).toFixed(2)}%</span>
              </div>
            </div>
          )
        })}
        {/* Projection table */}
        {[10, 20].map(yr => {
          const vals = firms.map(f => {
            const bld = calcFee(f, aum) / aum
            return aum * Math.pow(1 + 0.07 - bld, yr)
          })
          const best = Math.max(...vals)
          return (
            <div key={yr} style={{ marginTop: 20, background: '#fff', border: '1px solid var(--rule)' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--rule)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                Projected Portfolio Value — {yr} Years (7% gross)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--rule)' }}>
                {firms.map((f, i) => (
                  <div key={f.id} style={{ background: '#fff', padding: '16px 20px' }}>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>{f.name}</div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: vals[i] === best ? 'var(--green)' : 'var(--ink)', lineHeight: 1 }}>{fmt(vals[i])}</div>
                    {vals[i] === best && <div style={{ fontSize: 9, color: 'var(--green)', fontWeight: 700, marginTop: 3 }}>Best outcome</div>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    ),
    regulatory: (
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 24, paddingBottom: 12, borderBottom: '2px solid var(--ink)' }}>
          Regulatory & Disclosures
        </div>
        {[
          { label: 'Regulatory Status', vals: ['Active · In Good Standing', 'Active · In Good Standing', 'Active · 1 Pending'] },
          { label: 'Disclosure History', vals: firms.map(f => f.disclosure) },
          { label: 'Conflict Score', vals: firms.map(f => f.conflictScore) },
          { label: 'Referral Arrangements', vals: ['None disclosed', '2 arrangements', '3 arrangements'] },
        ].map(row => (
          <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '188px repeat(3,1fr)', borderBottom: '1px solid var(--rule)', alignItems: 'center' }}>
            <div style={{ padding: '14px 0', fontSize: 12, color: 'var(--ink-3)', borderRight: '1px solid var(--rule)', paddingRight: 16 }}>{row.label}</div>
            {row.vals.map((v, i) => (
              <div key={i} style={{ padding: '14px 20px' }}>
                {row.label === 'Conflict Score' ? (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: scoreColor(v) }}>{v}</span>
                ) : (
                  <span style={{ fontSize: 12, color: String(v).includes('Pending') || String(v).includes('3 arr') ? 'var(--red)' : 'var(--ink-2)' }}>{v}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  }

  return (
    <div style={{ background: 'var(--white)', minHeight: '100vh' }}>
      <Nav />

      {/* Page header */}
      <div style={{ background: 'var(--navy)', paddingTop: 'var(--nav-h)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 48px 0' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--green-3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 1, background: 'var(--green-3)', display: 'inline-block' }} />
            Compare Firms
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>Side-by-Side Comparison</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>Scores, fees, AUM, and regulatory records — compared in full.</div>

          {/* Jump nav */}
          <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '0 -48px', padding: '0 48px' }}>
            {SECTION_IDS.map(id => (
              <button key={id} onClick={() => setActiveSection(id)} style={{
                fontSize: 11, fontWeight: 500, color: activeSection === id ? 'var(--green-3)' : 'rgba(255,255,255,0.3)',
                padding: '11px 20px 11px 0', marginRight: 4, background: 'none', border: 'none',
                borderBottom: activeSection === id ? '2px solid var(--green-3)' : '2px solid transparent',
                cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}>{id === 'vvs' ? 'VVS Score' : id.charAt(0).toUpperCase() + id.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky firm header */}
      <div style={{
        position: 'sticky', top: 'var(--nav-h)', zIndex: 400,
        background: 'var(--navy)', borderBottom: '2px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflowX: 'auto',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '188px repeat(4,1fr)', maxWidth: 1200, margin: '0 auto', padding: '0 48px', minWidth: 700 }}>
          <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Metric</span>
          </div>
          {firms.map(f => (
            <div key={f.id} style={{
              padding: '14px 20px', borderRight: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: 10, minWidth: 0,
              position: 'relative',
            }}>
              {f.id === best.id && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--green-3)' }} />}
              <div style={{ width: 28, height: 28, flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', fontFamily: 'var(--serif)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{f.initials}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{f.name}</div>
              <button onClick={() => setFirms(firms.filter(x => x.id !== f.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
            </div>
          ))}
          {firms.length < 4 && (
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', opacity: 0.35 }}>
              <div style={{ width: 20, height: 20, border: '1px solid rgba(255,255,255,0.5)', display: 'grid', placeItems: 'center' }}>
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 10 10"><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></svg>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Add a firm</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 48px 80px', overflowX: 'auto' }}>
        {sections[activeSection] || sections.vvs}
      </div>

      <Footer />
    </div>
  )
}
