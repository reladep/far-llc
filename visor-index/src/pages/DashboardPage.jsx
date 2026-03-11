import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

const SAVED_FIRMS = [
  { name: 'SCS Capital Management', city: 'Boston', state: 'MA', aum: '$43.1B',  vvs: 88, saved: 'Mar 1, 2026' },
  { name: 'Commonwealth',           city: 'Waltham', state: 'MA', aum: '$210.0B', vvs: 79, saved: 'Feb 28, 2026' },
  { name: 'JFG Wealth Management',  city: 'Denver',  state: 'CO', aum: '$1.2B',   vvs: 84, saved: 'Feb 28, 2026' },
  { name: '1650 Wealth Management', city: 'Lighthouse Point', state: 'FL', aum: '$112M', vvs: 71, saved: 'Feb 25, 2026' },
  { name: 'Bison Wealth',           city: 'Atlanta', state: 'GA', aum: '$2.8B',   vvs: 76, saved: 'Feb 25, 2026' },
  { name: '180 Wealth Advisors',    city: 'Federal Way', state: 'WA', aum: '$1.1B', vvs: 82, saved: 'Feb 24, 2026' },
]

const ALERTS = [
  { name: 'SCS Capital Management', meta: 'Boston, MA · $43.1B AUM',   freq: 'Weekly' },
  { name: 'Commonwealth',           meta: 'Waltham, MA · $210.0B AUM', freq: 'Daily' },
  { name: 'JFG Wealth Management',  meta: 'Denver, CO · $1.2B AUM',    freq: 'Monthly' },
  { name: 'Bison Wealth',           meta: 'Atlanta, GA · $2.8B AUM',   freq: 'Weekly' },
]

const FREQS = ['Daily', 'Weekly', 'Monthly', 'Quarterly']
const NOTIFS = [
  { title: 'Watchlist alerts', sub: 'Email when a watched firm files a change matching your alert types', on: true },
  { title: 'Weekly digest', sub: 'Sunday summary of changes across your saved firms', on: true },
  { title: 'Score updates', sub: 'When VVS scores for saved firms change by more than 5 points', on: true },
  { title: 'Product announcements', sub: 'New features and platform updates', on: false },
]

function vvsColor(v) { return v >= 85 ? '#1A7A4A' : v >= 70 ? '#C97A0A' : '#C0392B' }
function vvsBg(v)    { return v >= 85 ? '#E6F4ED' : v >= 70 ? '#FEF3C7' : '#FEF3F2' }

function Toggle({ on, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 36, height: 20, borderRadius: 10,
      background: on ? '#1A7A4A' : '#CAD8D0',
      position: 'relative', cursor: 'pointer', flexShrink: 0,
      transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 19 : 3,
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s',
      }}/>
    </div>
  )
}

export default function DashboardPage() {
  const [panel, setPanel] = useState('saved')
  const [sortKey, setSortKey] = useState('date')
  const [selected, setSelected] = useState(new Set())
  const [firms, setFirms] = useState(SAVED_FIRMS)
  const [alerts, setAlerts] = useState(ALERTS)
  const [alertFreqs, setAlertFreqs] = useState(() => Object.fromEntries(ALERTS.map((a, i) => [i, a.freq])))
  const [editing, setEditing] = useState(false)
  const [notifs, setNotifs] = useState(NOTIFS.map(n => n.on))

  const toggleSel = id => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const sortedFirms = [...firms].sort((a, b) => {
    if (sortKey === 'vvs') return b.vvs - a.vvs
    if (sortKey === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  const SB_ITEMS = [
    { id: 'saved',   icon: '◈', label: 'Saved Firms',       count: firms.length },
    { id: 'alerts',  icon: '◯', label: 'Alerts',            count: alerts.length },
    { id: 'billing', icon: '◎', label: 'Account & Billing', count: null },
  ]

  return (
    <div style={{ background: '#F6F8F7', fontFamily: 'DM Sans, sans-serif', minHeight: '100vh' }}>
      <Nav />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 56px)', marginTop: 56 }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ background: '#0A1C2A', padding: '32px 0', display: 'flex', flexDirection: 'column', position: 'sticky', top: 56, height: 'calc(100vh - 56px)' }}>
          {/* Identity */}
          <div style={{ padding: '0 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Dashboard</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Maxwell Test</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#2DBD74', marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2DBD74' }}/>Annual Access
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Renews Mar 1, 2027</div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '16px 0' }}>
            {SB_ITEMS.map(item => (
              <button key={item.id} onClick={() => setPanel(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '12px 24px', background: 'none', border: 'none',
                cursor: 'pointer', transition: 'all 0.15s',
                background: panel === item.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                borderLeft: `2px solid ${panel === item.id ? '#2DBD74' : 'transparent'}`,
              }}>
                <span style={{ fontSize: 14, color: panel === item.id ? '#2DBD74' : 'rgba(255,255,255,0.3)' }}>{item.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: panel === item.id ? '#fff' : 'rgba(255,255,255,0.5)', flex: 1, textAlign: 'left' }}>{item.label}</span>
                {item.count !== null && (
                  <span style={{
                    fontSize: 10, fontFamily: 'DM Mono, monospace',
                    background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)',
                    padding: '2px 7px', borderRadius: 2,
                  }}>{item.count}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Footer links */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/search"    style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>→ Search advisors</Link>
            <Link to="/negotiate" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>→ Negotiate fees</Link>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ padding: '40px 48px', overflowY: 'auto' }}>

          {/* ── SAVED FIRMS PANEL ── */}
          {panel === 'saved' && (
            <div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 700, color: '#0C1810', marginBottom: 4 }}>Saved Firms</h1>
              <p style={{ fontSize: 13, color: '#5A7568', marginBottom: 24 }}>Firms you've bookmarked. Click any row to view the full profile.</p>
              <div style={{ height: 1, background: '#CAD8D0', marginBottom: 20 }}/>

              {/* Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: '#5A7568', marginRight: 4 }}>Sort</span>
                  {[['date', 'Date saved'], ['vvs', 'VVS Score'], ['aum', 'AUM'], ['name', 'A–Z']].map(([k, l]) => (
                    <button key={k} onClick={() => setSortKey(k)} style={{
                      fontSize: 11, padding: '5px 12px', cursor: 'pointer',
                      border: '1px solid',
                      borderColor: sortKey === k ? '#1A7A4A' : '#CAD8D0',
                      background: sortKey === k ? '#E6F4ED' : '#fff',
                      color: sortKey === k ? '#1A7A4A' : '#5A7568',
                      transition: 'all 0.15s',
                    }}>{l}</button>
                  ))}
                </div>
                {selected.size >= 2 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to="/compare" style={{
                      fontSize: 11, fontWeight: 600, padding: '7px 16px',
                      background: '#0C1810', color: '#fff', textDecoration: 'none',
                    }}>Compare Selected ({selected.size})</Link>
                    <button onClick={() => setSelected(new Set())} style={{
                      fontSize: 11, padding: '7px 12px', border: '1px solid #CAD8D0',
                      background: '#fff', cursor: 'pointer', color: '#5A7568',
                    }}>Clear</button>
                  </div>
                )}
              </div>

              {/* Firm list */}
              <div style={{ border: '1px solid #CAD8D0', borderTop: '2px solid #0C1810' }}>
                {sortedFirms.map((firm, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '28px 1fr auto auto auto',
                    gap: 0, alignItems: 'center',
                    borderBottom: i < sortedFirms.length - 1 ? '1px solid #E6F4ED' : 'none',
                    background: selected.has(i) ? '#F0F9F4' : '#fff',
                    transition: 'background 0.15s',
                  }}>
                    <div style={{ padding: '14px 8px 14px 14px' }}>
                      <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSel(i)}
                        style={{ accentColor: '#1A7A4A', cursor: 'pointer' }} />
                    </div>
                    <div style={{ padding: '14px 0' }}>
                      <Link to={`/firm/${i}`} style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 700, color: '#0C1810', textDecoration: 'none', display: 'block', marginBottom: 2 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#1A7A4A'}
                        onMouseLeave={e => e.currentTarget.style.color = '#0C1810'}
                      >{firm.name}</Link>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5A7568' }}>{firm.city}, {firm.state} · {firm.aum} AUM</span>
                    </div>
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 700,
                        color: vvsColor(firm.vvs), background: vvsBg(firm.vvs),
                        width: 40, height: 40, display: 'grid', placeItems: 'center',
                      }}>{firm.vvs}</div>
                    </div>
                    <div style={{ padding: '14px 16px', fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5A7568' }}>{firm.saved}</div>
                    <div style={{ padding: '14px 16px', display: 'flex', gap: 6 }}>
                      <Link to={`/firm/${i}`} style={{
                        fontSize: 10, fontWeight: 600, padding: '5px 12px',
                        background: '#0C1810', color: '#fff', textDecoration: 'none',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1A7A4A'}
                        onMouseLeave={e => e.currentTarget.style.background = '#0C1810'}
                      >View →</Link>
                      <button onClick={() => setFirms(f => f.filter((_, j) => j !== i))} style={{
                        fontSize: 10, padding: '5px 10px',
                        border: '1px solid #CAD8D0', background: '#fff', color: '#5A7568',
                        cursor: 'pointer',
                      }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ALERTS PANEL ── */}
          {panel === 'alerts' && (
            <div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 700, color: '#0C1810', marginBottom: 4 }}>Alerts</h1>
              <p style={{ fontSize: 13, color: '#5A7568', marginBottom: 24 }}>Monitor firms for filing changes. Toggle alert frequency per firm.</p>
              <div style={{ height: 1, background: '#CAD8D0', marginBottom: 20 }}/>

              <div style={{ border: '1px solid #CAD8D0', borderTop: '2px solid #0C1810', marginBottom: 16 }}>
                {alerts.map((alert, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: i < alerts.length - 1 ? '1px solid #E6F4ED' : 'none',
                    background: '#fff',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 700, color: '#0C1810', marginBottom: 3 }}>{alert.name}</div>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5A7568' }}>{alert.meta}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {FREQS.map(f => (
                        <button key={f} onClick={() => setAlertFreqs(prev => ({ ...prev, [i]: f }))} style={{
                          fontSize: 10, padding: '4px 10px', cursor: 'pointer',
                          border: '1px solid',
                          borderColor: alertFreqs[i] === f ? '#1A7A4A' : '#CAD8D0',
                          background: alertFreqs[i] === f ? '#E6F4ED' : '#fff',
                          color: alertFreqs[i] === f ? '#1A7A4A' : '#5A7568',
                        }}>{f}</button>
                      ))}
                      <button onClick={() => setAlerts(a => a.filter((_, j) => j !== i))} style={{
                        marginLeft: 8, fontSize: 11, color: '#5A7568', background: 'none', border: 'none', cursor: 'pointer',
                      }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setPanel('saved')} style={{
                fontSize: 11, fontWeight: 600, padding: '9px 20px',
                border: '1px solid #CAD8D0', background: '#fff', color: '#0C1810',
                cursor: 'pointer',
              }}>+ Add from Saved Firms</button>
            </div>
          )}

          {/* ── BILLING PANEL ── */}
          {panel === 'billing' && (
            <div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 700, color: '#0C1810', marginBottom: 4 }}>Account & Billing</h1>
              <p style={{ fontSize: 13, color: '#5A7568', marginBottom: 24 }}>Your plan, payment, invoices, and account settings.</p>
              <div style={{ height: 1, background: '#CAD8D0', marginBottom: 24 }}/>

              {/* Plan card */}
              <div style={{ background: '#0A1C2A', padding: '24px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Current Plan</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Annual Access <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 400, color: '#2DBD74' }}>$199 / yr</span></div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Renews March 1, 2027</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#2DBD74' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2DBD74' }}/>Active
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to="/pricing" style={{ fontSize: 11, fontWeight: 600, padding: '9px 20px', background: '#1A7A4A', color: '#fff', textDecoration: 'none', textAlign: 'center' }}>Upgrade to Concierge</Link>
                  <button style={{ fontSize: 11, padding: '8px 20px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Cancel Plan</button>
                </div>
              </div>

              {/* Payment + Invoices + Settings in cards */}
              {[
                {
                  title: 'Payment Method', action: 'Update',
                  content: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ background: '#E6F4ED', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#1A7A4A' }}>VISA</div>
                      <div>
                        <div style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', color: '#0C1810' }}>•••• •••• •••• 4242</div>
                        <div style={{ fontSize: 11, color: '#5A7568' }}>Expires 09 / 2028</div>
                      </div>
                    </div>
                  )
                },
              ].map(card => (
                <BillingCard key={card.title} title={card.title} action={card.action}>
                  <div style={{ padding: '16px 20px' }}>{card.content}</div>
                </BillingCard>
              ))}

              {/* Invoices */}
              <BillingCard title="Invoice History">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E6F4ED' }}>
                      {['Description', 'Date', 'Amount', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A7568' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[['Annual Access — 2026', 'Mar 1, 2026', '$199.00'], ['Annual Access — 2025', 'Mar 1, 2025', '$199.00'], ['30-Day Access', 'Jan 14, 2025', '$99.00']].map(([desc, date, amt]) => (
                      <tr key={desc} style={{ borderBottom: '1px solid #E6F4ED' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0C1810' }}>{desc}</td>
                        <td style={{ padding: '12px 16px', color: '#5A7568', fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{date}</td>
                        <td style={{ padding: '12px 16px', color: '#0C1810', fontFamily: 'DM Mono, monospace' }}>{amt}</td>
                        <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1A7A4A', background: '#E6F4ED', padding: '3px 8px' }}>Paid</span></td>
                        <td style={{ padding: '12px 16px' }}><button style={{ fontSize: 10, color: '#5A7568', background: 'none', border: '1px solid #CAD8D0', padding: '4px 10px', cursor: 'pointer' }}>↓ PDF</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </BillingCard>

              {/* Account Settings */}
              <BillingCard title="Account Settings" action={editing ? 'Cancel' : 'Edit'} onAction={() => setEditing(e => !e)}>
                <div style={{ padding: '0 20px' }}>
                  {editing ? (
                    <>
                      {[['Name', 'text', 'Maxwell Test'], ['Email', 'email', 'maxwell@example.com'], ['New Password', 'password', '']].map(([l, t, v]) => (
                        <div key={l} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', borderBottom: '1px solid #E6F4ED', padding: '10px 0' }}>
                          <span style={{ fontSize: 11, color: '#5A7568' }}>{l}</span>
                          <input type={t} defaultValue={v} placeholder={t === 'password' ? 'Leave blank to keep current' : ''} style={{ border: '1px solid #CAD8D0', padding: '7px 10px', fontSize: 12, outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
                        </div>
                      ))}
                      <div style={{ padding: '14px 0', display: 'flex', gap: 8 }}>
                        <button onClick={() => setEditing(false)} style={{ fontSize: 11, fontWeight: 600, padding: '8px 20px', background: '#0C1810', color: '#fff', border: 'none', cursor: 'pointer' }}>Save Changes</button>
                        <button onClick={() => setEditing(false)} style={{ fontSize: 11, padding: '8px 16px', border: '1px solid #CAD8D0', background: '#fff', cursor: 'pointer', color: '#5A7568' }}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    [['Name', 'Maxwell Test'], ['Email', 'maxwell@example.com'], ['Password', '••••••••••'], ['Member since', 'March 1, 2025']].map(([l, v]) => (
                      <div key={l} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', borderBottom: '1px solid #E6F4ED', padding: '12px 0', fontSize: 13 }}>
                        <span style={{ color: '#5A7568' }}>{l}</span>
                        <span style={{ color: v.includes('•') ? '#B0C4BA' : '#0C1810' }}>{v}</span>
                      </div>
                    ))
                  )}
                </div>
              </BillingCard>

              {/* Notifications */}
              <BillingCard title="Email Notifications">
                <div>
                  {NOTIFS.map((n, i) => (
                    <div key={n.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < NOTIFS.length - 1 ? '1px solid #E6F4ED' : 'none' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0C1810', marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: '#5A7568' }}>{n.sub}</div>
                      </div>
                      <Toggle on={notifs[i]} onChange={() => setNotifs(prev => prev.map((v, j) => j === i ? !v : v))} />
                    </div>
                  ))}
                </div>
              </BillingCard>

              <button style={{ fontSize: 11, color: '#5A7568', background: 'none', border: 'none', cursor: 'pointer', marginTop: 16, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#C0392B'}
                onMouseLeave={e => e.currentTarget.style.color = '#5A7568'}
              >
                Request account deletion →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function BillingCard({ title, action, onAction, children }) {
  return (
    <div style={{ border: '1px solid #CAD8D0', background: '#fff', marginBottom: 12 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #E6F4ED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0C1810', letterSpacing: '0.04em' }}>{title}</span>
        {action && <button onClick={onAction} style={{ fontSize: 11, color: '#1A7A4A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{action}</button>}
      </div>
      {children}
    </div>
  )
}
