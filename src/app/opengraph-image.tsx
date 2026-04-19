import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Visor Index — See Your Advisor Clearly';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Default site-wide OG image for social sharing
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A1C2A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          color: '#fff',
          fontFamily: 'serif',
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 18,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#2DBD74',
            fontWeight: 500,
          }}
        >
          Visor Index
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.05,
              fontWeight: 300,
              letterSpacing: '-0.02em',
              maxWidth: 900,
            }}
          >
            See your advisor <span style={{ fontStyle: 'italic', color: '#2DBD74' }}>clearly</span>.
          </div>
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'sans-serif',
              maxWidth: 820,
            }}
          >
            Independent intelligence on SEC-registered investment advisors — fees, services, and Visor Index™ Scores.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'sans-serif',
            fontSize: 18,
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          <div>visorindex.com</div>
          <div style={{ fontFamily: 'monospace', fontSize: 14, letterSpacing: '0.18em' }}>
            INDEPENDENT · TRANSPARENT · ACCOUNTABLE
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
