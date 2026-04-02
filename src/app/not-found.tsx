import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: '#F6F8F7',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* 404 number */}
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 80,
          fontWeight: 700,
          color: '#CAD8D0',
          lineHeight: 1,
          marginBottom: 8,
          letterSpacing: '-0.04em',
        }}>
          404
        </p>

        {/* Heading */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28,
          fontWeight: 700,
          color: '#0C1810',
          marginBottom: 10,
        }}>
          Page not found
        </h1>

        {/* Body */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: '#5A7568',
          lineHeight: 1.7,
          marginBottom: 32,
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Primary CTA */}
        <Link
          href="/search"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 28px',
            background: '#1A7A4A',
            color: '#fff',
            textDecoration: 'none',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.04em',
            transition: 'background 0.15s',
          }}
        >
          ← Back to Search
        </Link>

        {/* Quick nav links */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          marginTop: 24,
        }}>
          {[
            { label: 'Compare', href: '/compare' },
            { label: 'Match', href: '/match' },
            { label: 'Directory', href: '/directory' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: '#5A7568',
                textDecoration: 'none',
                borderBottom: '1px solid #CAD8D0',
                paddingBottom: 1,
                transition: 'color 0.15s',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
