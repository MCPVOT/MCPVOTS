import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '512',
          height: '512',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
          borderRadius: '128px',
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,204,0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
            display: 'flex',
          }}
        />
        
        {/* Main icon circle */}
        <div
          style={{
            width: '380px',
            height: '380px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00ffcc 0%, #00ccaa 50%, #009988 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 60px rgba(0,255,204,0.5)',
          }}
        >
          {/* Inner dark circle */}
          <div
            style={{
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* VOT text */}
            <span
              style={{
                fontSize: '120px',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00ffcc 0%, #ff6600 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '-4px',
              }}
            >
              VOT
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
