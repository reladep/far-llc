import { Link } from 'react-router-dom'

const COLS = [
  {
    title: 'Platform',
    links: [
      { label: 'Search Advisors', to: '/search' },
      { label: 'Firm Directory',  to: '/directory' },
      { label: 'Compare Firms',   to: '/compare' },
      { label: 'Negotiate Fees',  to: '/negotiate' },
      { label: 'Dashboard',       to: '/dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',           to: '#' },
      { label: 'Blog',            to: '/blog' },
      { label: 'Methodology',     to: '#' },
      { label: 'Pricing',         to: '/pricing' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', to: '#' },
      { label: 'Privacy Policy',   to: '#' },
      { label: 'Disclaimer',       to: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{
      background: '#060F17',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '56px 56px 32px',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, auto)', gap: 64, marginBottom: 48 }}>
          {/* Brand col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 24, height: 24, display: 'grid', placeItems: 'center',
                border: '1px solid rgba(45,189,116,0.3)',
                clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
                background: 'rgba(26,122,74,0.1)',
              }}>
                <svg width="9" height="10" viewBox="0 0 10 12" fill="none">
                  <path d="M5 0L9.33 2.5V7.5L5 10L0.67 7.5V2.5L5 0Z" fill="#2DBD74" opacity="0.7"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                Visor <em style={{ fontStyle: 'normal', color: '#2DBD74' }}>Index</em>
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.75, maxWidth: 220 }}>
              Independent intelligence on every SEC-registered RIA. No paid placement. No conflicts.
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 16 }}>
              Data sourced from SEC IAPD & EDGAR.<br />
              Not investment advice.
            </p>
          </div>

          {/* Link cols */}
          {COLS.map(col => (
            <div key={col.title}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.25)', marginBottom: 16,
              }}>
                {col.title}
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
                      onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
            © 2025 Visor Index LLC. All rights reserved.
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(45,189,116,0.4)',
          }}>
            Know Before You Trust
          </span>
        </div>
      </div>
    </footer>
  )
}
