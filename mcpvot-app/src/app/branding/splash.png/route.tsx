import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200',
          height: '1200',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #000000 0%, #0a0a1a 50%, #000000 100%)',
        }}
      >
        {/* Top glow */}
        <div
          style={{
            position: 'absolute',
            top: '100px',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse, rgba(0,255,204,0.2) 0%, transparent 70%)',
            filter: 'blur(60px)',
            display: 'flex',
          }}
        />
        
        {/* Logo circle */}
        <div
          style={{
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00ffcc 0%, #00ccaa 50%, #009988 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 80px rgba(0,255,204,0.5)',
            marginBottom: '60px',
          }}
        >
          <div
            style={{
              width: '340px',
              height: '340px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '100px',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00ffcc 0%, #ff6600 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '-3px',
              }}
            >
              VOT
            </span>
          </div>
        </div>
        
        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-2px',
              marginBottom: '20px',
            }}
          >
            MCPVOT
          </span>
          <span
            style={{
              fontSize: '36px',
              fontWeight: 600,
              color: '#00ffcc',
              letterSpacing: '4px',
              textTransform: 'uppercase',
            }}
          >
            x402 Intelligence
          </span>
        </div>
        
        {/* Bottom glow */}
        <div
          style={{
            position: 'absolute',
            bottom: '150px',
            width: '400px',
            height: '200px',
            background: 'radial-gradient(ellipse, rgba(255,102,0,0.15) 0%, transparent 70%)',
            filter: 'blur(50px)',
            display: 'flex',
          }}
        />
        
        {/* Loading indicator */}
        <div
          style={{
            marginTop: '80px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00ffcc', display: 'flex' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00ccaa', display: 'flex' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#009988', display: 'flex' }} />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 1200,
    }
  );
}
