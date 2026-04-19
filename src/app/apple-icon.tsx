import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Apple touch icon: branded V on navy
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A1C2A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2DBD74',
          fontFamily: 'serif',
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
        }}
      >
        <div style={{ fontSize: 140, fontWeight: 700, lineHeight: 1 }}>V</div>
      </div>
    ),
    { ...size },
  );
}
