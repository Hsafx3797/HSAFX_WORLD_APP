import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'HSAFX Tools - 446+ Free Online Developer Tools';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: 'white',
            marginBottom: 16,
            letterSpacing: '-0.02em',
          }}
        >
          HSAFX Tools
        </div>
        <div
          style={{
            fontSize: 32,
            color: 'rgba(255,255,255,0.85)',
            maxWidth: 800,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          446+ Free Online Developer Tools
        </div>
        <div
          style={{
            fontSize: 20,
            color: 'rgba(255,255,255,0.6)',
            marginTop: 24,
          }}
        >
          Fast • Secure • Privacy-Focused
        </div>
      </div>
    ),
    { ...size },
  );
}
