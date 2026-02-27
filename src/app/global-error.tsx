'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Something went wrong</h2>
            <button onClick={reset} style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
