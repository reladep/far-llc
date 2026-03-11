import { Link, useLocation } from 'react-router-dom'

export default function Nav() {
  const { pathname } = useLocation()

  const navLinks = [
    { label: 'Search', path: '/search' },
    { label: 'Compare', path: '/compare' },
    { label: 'Negotiate', path: '/negotiate' },
    { label: 'Directory', path: '/directory' },
    { label: 'Pricing', path: '/pricing' },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
      padding: '0 56px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(10,28,42,0.92)',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{
        maxWidth: 1120, margin: '0 auto', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 26, height: 26, display: 'grid', placeItems: 'center',
            border: '1px solid rgba(45,189,116,0.4)',
            clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
            background: 'rgba(26,122,74,0.15)', flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="rgba(45,189,116,0.8)" strokeWidth="1.2" strokeLinecap="round">
              <polygon points="6,1 11,3.5 11,8.5 6,11 1,8.5 1,3.5" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Visor <em style={{ fontStyle: 'normal', color: 'var(--green-3)' }}>Index</em>
          </span>
        </Link>

        {/* Nav links */}
        <ul style={{ display: 'flex', gap: 28, listStyle: 'none' }}>
          {navLinks.map(({ label, path }) => (
            <li key={path}>
              <Link to={path} style={{
                fontSize: 12,
                color: pathname.startsWith(path) ? '#fff' : 'rgba(255,255,255,0.4)',
                textDecoration: 'none', letterSpacing: '0.04em', transition: 'color 0.15s',
              }}>{label}</Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/dashboard" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}>
            Log in
          </Link>
          <Link to="/pricing" style={{
            fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'var(--green)', color: '#fff',
            padding: '8px 20px', textDecoration: 'none', transition: 'background 0.2s',
          }}>Get Access</Link>
        </div>
      </div>
    </nav>
  )
}
