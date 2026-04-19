import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Favicon: green "V" wordmark on navy background
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#0A1C2A',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2DBD74',
          fontWeight: 700,
          fontFamily: 'serif',
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
        }}
      >
        V
      </div>
    ),
    { ...size },
  );
}
