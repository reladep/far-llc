import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guide — Visor Index',
};

export default function GuideDetailPage({ params }: { params: { slug: string } }) {
  return (
    <div
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '120px 24px 80px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: '#5A7568',
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}
      >
        Guide · Coming soon
      </p>
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
          fontWeight: 700,
          color: '#0C1810',
          marginBottom: 16,
        }}
      >
        {params.slug.replace(/-/g, ' ')}
      </h1>
      <p style={{ fontSize: 14, color: '#5A7568', lineHeight: 1.65 }}>
        Full article coming soon.
      </p>
    </div>
  );
}
