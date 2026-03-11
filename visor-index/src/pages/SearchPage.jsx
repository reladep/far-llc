import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

const MOCK_FIRMS = [
  { id: 1, name: 'Meridian Wealth Advisors', location: 'New York, NY', aum: '$2.4B', clients: 312, type: 'RIA · Fee-only', score: 84, scoreColor: '#2DBD74', conflict: false, flags: [] },
  { id: 2, name: 'Clearwater Planning Group', location: 'Austin, TX', aum: '$418M', clients: 312, type: 'RIA · Fee-only', score: 58, scoreColor: '#F59E0B', conflict: true, flags: ['Insurance commissions'] },
  { id: 3, name: 'Rockbridge Family Partners', location: 'New York, NY', aum: '$2.1B', clients: 84, type: 'MFO · Fee-only', score: 91, scoreColor: '#2DBD74', conflict: false, flags: [] },
  { id: 4, name: 'Verity Institutional Advisors', location: 'Boston, MA', aum: '$18.4B', clients: 214, type: 'RIA · Institutional', score: 87, scoreColor: '#2DBD74', conflict: false, flags: [] },
  { id: 5, name: 'Harborview Wealth Partners', location: 'Chicago, IL', aum: '$3.8B', clients: 214, type: 'RIA · Fee-based', score: 41, scoreColor: '#EF4444', conflict: true, flags: ['PE ownership', '3 referral arrangements'] },
  { id: 6, name: 'Meridian First Wealth', location: 'Denver, CO', aum: '$182M', clients: 890, type: 'RIA · Subscription', score: 82, scoreColor: '#2DBD74', conflict: false, flags: [] },
  { id: 7, name: 'Waverly Capital Advisors', location: 'Boston, MA', aum: '$890M', clients: 203, type: 'RIA · Fee-based', score: 63, scoreColor: '#F59E0B', conflict: true, flags: ['Referral arrangements'] },
  { id: 8, name: 'Summit Ridge Capital', location: 'San Francisco, CA', aum: '$1.2B', clients: 156, type: 'RIA · Fee-only', score: 79, scoreColor: '#2DBD74', conflict: false, flags: [] },
]

const SORT_OPTIONS = ['Best Match', 'Visor Score', 'AUM (High-Low)', 'AUM (Low-High)', 'Clients']
const QUICK_FILTERS = ['Fee-only', 'Fiduciary', 'No minimum', 'Under $500K min', '$1M+ AUM', 'Conflict-free', 'Top scored']

function scoreColor(v) {
  if (v < 40) return '#EF4444'
  if (v < 65) return '#F59E0B'
  return '#2DBD74'
}

function FilterCheckbox({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 14, height: 14, border: `1px solid ${checked ? '#1A7A4A' : '#CAD8D0'}`,
        background: checked ? '#1A7A4A' : '#fff',
        display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
        transition: 'all 0.15s',
      }}
    >
      {checked && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
    </div>
  )
}

export default function SearchPage() {
  const [query, setQuery] = useState('Fee-only advisors, New York')
  const [activeTags, setActiveTags] = useState(['Fee-only'])
  const [scoreMin, setScoreMin] = useState(30)
  const [sortBy, setSortBy] = useState('Best Match')
  const [savedFirms, setSavedFirms] = useState([])
  const [feeFilters, setFeeFilters] = useState(['Fee-only'])
  const [aumFilters, setAumFilters] = useState(['$100M – $500M', '$500M – $2B'])
  const [typeFilters, setTypeFilters] = useState(['RIA (independent)'])

  const toggleTag = t => setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  const toggleFilter = (list, setList, val) => setList(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])
  const toggleSave = id => setSavedFirms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const filteredFirms = MOCK_FIRMS.filter(f => f.score >= scoreMin)

  return (
    <div style={{ background: '#F6F8F7', fontFamily: 'DM Sans, sans-serif', minHeight: '100vh' }}>
      <Nav />

      {/* ── PINNED SEARCH BAR ── */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 400,
        background: '#0A1C2A', borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '14px 56px',
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              padding: '0 14px',
            }}>
              <svg width="15" height="15" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 15 15"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="13.5" y2="13.5"/></svg>
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search firm name, advisor, city, or ZIP…"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#fff', fontSize: 14, padding: '11px 0',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 12 }}>✕ Clear</button>
              )}
            </div>
            <button style={{
              background: '#1A7A4A', color: '#fff', border: 'none',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '0 24px', height: 44, cursor: 'pointer', transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#22995E'}
              onMouseLeave={e => e.currentTarget.style.background = '#1A7A4A'}
            >Search</button>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
              {filteredFirms.length.toLocaleString()} results
            </span>
          </div>

          {/* Quick filters */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginRight: 4 }}>Quick:</span>
            {QUICK_FILTERS.map(t => (
              <button key={t} onClick={() => toggleTag(t)} style={{
                fontSize: 10, padding: '4px 12px', cursor: 'pointer',
                border: `1px solid ${activeTags.includes(t) ? '#2DBD74' : 'rgba(255,255,255,0.15)'}`,
                background: activeTags.includes(t) ? 'rgba(45,189,116,0.12)' : 'transparent',
                color: activeTags.includes(t) ? '#2DBD74' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.15s',
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PAGE BODY ── */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 56px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>

        {/* ── FILTER PANEL ── */}
        <aside>
          <div style={{ background: '#fff', border: '1px solid #CAD8D0', borderTop: '2px solid #0C1810', position: 'sticky', top: 136 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #CAD8D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0C1810' }}>Filters</span>
              <button onClick={() => { setFeeFilters([]); setAumFilters([]); setTypeFilters([]); setScoreMin(0) }}
                style={{ fontSize: 10, color: '#5A7568', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>
            </div>

            {/* Fee Structure */}
            <FilterGroup label="Fee Structure">
              {[['Fee-only', 1204], ['Fee-based', 892], ['Commission-based', 418], ['Flat / subscription', 333]].map(([l, c]) => (
                <FilterRow key={l} label={l} count={c} checked={feeFilters.includes(l)} onChange={() => toggleFilter(feeFilters, setFeeFilters, l)} />
              ))}
            </FilterGroup>

            <div style={{ borderTop: '1px solid #E6F4ED' }} />

            {/* Score Range */}
            <FilterGroup label="Visor Score™ Range">
              <div style={{ padding: '0 0 4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#5A7568', marginBottom: 8 }}>
                  <span>{scoreMin}</span><span>100</span>
                </div>
                <input type="range" min={0} max={100} value={scoreMin} onChange={e => setScoreMin(+e.target.value)}
                  style={{ width: '100%' }} />
              </div>
            </FilterGroup>

            <div style={{ borderTop: '1px solid #E6F4ED' }} />

            {/* AUM */}
            <FilterGroup label="Firm AUM">
              {[['Under $100M', 341], ['$100M – $500M', 628], ['$500M – $2B', 512], ['$2B+', 204]].map(([l, c]) => (
                <FilterRow key={l} label={l} count={c} checked={aumFilters.includes(l)} onChange={() => toggleFilter(aumFilters, setAumFilters, l)} />
              ))}
            </FilterGroup>

            <div style={{ borderTop: '1px solid #E6F4ED' }} />

            {/* Firm Type */}
            <FilterGroup label="Firm Type">
              {[['RIA (independent)', 1847], ['Multi-family office', 142], ['OCIO', 88], ['Bank-affiliated', 334]].map(([l, c]) => (
                <FilterRow key={l} label={l} count={c} checked={typeFilters.includes(l)} onChange={() => toggleFilter(typeFilters, setTypeFilters, l)} />
              ))}
            </FilterGroup>

            <div style={{ borderTop: '1px solid #E6F4ED' }} />

            {/* Conflict */}
            <FilterGroup label="Conflict Screening">
              {[['No referral arrangements', 982], ['No 12b-1 fees', 1204], ['No disciplinary history', 2491]].map(([l, c]) => (
                <FilterRow key={l} label={l} count={c} checked={false} onChange={() => {}} />
              ))}
            </FilterGroup>
          </div>
        </aside>

        {/* ── RESULTS ── */}
        <div>
          {/* Sort bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#5A7568' }}>
              <strong style={{ color: '#0C1810' }}>{filteredFirms.length.toLocaleString()}</strong> results · Fee-only advisors · New York
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <span style={{ color: '#5A7568' }}>Sort by:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                border: '1px solid #CAD8D0', background: '#fff', fontSize: 11, color: '#0C1810',
                padding: '5px 10px', outline: 'none', cursor: 'pointer',
              }}>
                {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Result cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#CAD8D0' }}>
            {filteredFirms.map(firm => (
              <div key={firm.id} style={{
                background: '#fff', display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 0,
              }}>
                <div style={{ padding: '20px 24px', borderRight: '1px solid #E6F4ED' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <Link to={`/firm/${firm.id}`} style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 700, color: '#0C1810', textDecoration: 'none', display: 'block', marginBottom: 3 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#1A7A4A'}
                        onMouseLeave={e => e.currentTarget.style.color = '#0C1810'}
                      >
                        {firm.name}
                      </Link>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5A7568' }}>{firm.type} · {firm.location} · {firm.aum} AUM · {firm.clients} clients</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {firm.conflict && (
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C0392B', background: '#FEF3F2', padding: '3px 8px' }}>
                          ⚑ Flags
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conflict flags */}
                  {firm.flags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                      {firm.flags.map(f => (
                        <span key={f} style={{ fontSize: 9, color: '#C0392B', background: '#FEF3F2', padding: '2px 8px', border: '1px solid rgba(192,57,43,0.15)' }}>{f}</span>
                      ))}
                    </div>
                  )}

                  {/* Score mini bars */}
                  <div style={{ display: 'flex', gap: 20 }}>
                    {[['Fee Transparency', 91], ['Regulatory', 96], ['Conflict', 67]].map(([label, v]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9, color: '#5A7568' }}>{label}</span>
                        <div style={{ width: 40, height: 2, background: '#E6F4ED' }}>
                          <div style={{ width: v + '%', height: '100%', background: scoreColor(v) }} />
                        </div>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: scoreColor(v) }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: score + actions */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 120 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, color: firm.scoreColor, lineHeight: 1 }}>{firm.score}</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#5A7568', marginTop: 2 }}>Visor Score™</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                    <Link to={`/firm/${firm.id}`} style={{
                      display: 'block', textAlign: 'center', padding: '7px',
                      background: '#0C1810', color: '#fff', fontSize: 10, fontWeight: 600,
                      letterSpacing: '0.08em', textDecoration: 'none', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1A7A4A'}
                      onMouseLeave={e => e.currentTarget.style.background = '#0C1810'}
                    >View Profile</Link>
                    <button onClick={() => toggleSave(firm.id)} style={{
                      display: 'block', width: '100%', padding: '6px',
                      background: savedFirms.includes(firm.id) ? '#E6F4ED' : 'transparent',
                      border: '1px solid #CAD8D0', fontSize: 10,
                      color: savedFirms.includes(firm.id) ? '#1A7A4A' : '#5A7568',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {savedFirms.includes(firm.id) ? '✓ Saved' : '+ Save'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <button style={{
              border: '1px solid #CAD8D0', background: '#fff', color: '#0C1810',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '12px 32px', cursor: 'pointer',
            }}>Load more results</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ label, children }) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}

function FilterRow({ label, count, checked, onChange }) {
  return (
    <div onClick={onChange} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div style={{
        width: 14, height: 14, border: `1px solid ${checked ? '#1A7A4A' : '#CAD8D0'}`,
        background: checked ? '#1A7A4A' : '#fff', display: 'grid', placeItems: 'center',
        flexShrink: 0, transition: 'all 0.15s',
      }}>
        {checked && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: 12, color: '#2E4438', flex: 1 }}>{label}</span>
      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5A7568' }}>{count.toLocaleString()}</span>
    </div>
  )
}
