import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1284',
          height: '2778',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #000000 0%, #0a0a1a 100%)',
          padding: '60px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '60px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00ffcc 0%, #009988 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#000' }}>V</span>
            </div>
            <span style={{ fontSize: '48px', fontWeight: 800, color: '#fff' }}>MCPVOT</span>
          </div>
          <span style={{ fontSize: '28px', color: '#00ffcc' }}>x402</span>
        </div>
        
        {/* Main card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,204,0.1) 0%, rgba(0,0,0,0.5) 100%)',
            borderRadius: '40px',
            border: '2px solid rgba(0,255,204,0.3)',
            padding: '60px',
            marginBottom: '40px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: '32px', color: '#888', marginBottom: '20px' }}>VOT Balance</span>
          <span style={{ fontSize: '72px', fontWeight: 800, color: '#00ffcc', marginBottom: '20px' }}>
            1,234,567.89
          </span>
          <span style={{ fontSize: '28px', color: '#666' }}>≈ $12,345.67 USD</span>
        </div>
        
        {/* Stats grid */}
        <div
          style={{
            display: 'flex',
            gap: '30px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '30px',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span style={{ fontSize: '24px', color: '#888', marginBottom: '15px' }}>24h Volume</span>
            <span style={{ fontSize: '36px', fontWeight: 700, color: '#fff' }}>$89.2K</span>
          </div>
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '30px',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span style={{ fontSize: '24px', color: '#888', marginBottom: '15px' }}>Price</span>
            <span style={{ fontSize: '36px', fontWeight: 700, color: '#00ff88' }}>+12.5%</span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '30px', marginBottom: '60px' }}>
          <div
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #00ffcc 0%, #00ccaa 100%)',
              borderRadius: '25px',
              padding: '35px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '32px', fontWeight: 700, color: '#000' }}>Buy VOT</span>
          </div>
          <div
            style={{
              flex: 1,
              background: 'transparent',
              borderRadius: '25px',
              border: '3px solid #00ffcc',
              padding: '35px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '32px', fontWeight: 700, color: '#00ffcc' }}>Sell VOT</span>
          </div>
        </div>
        
        {/* Recent activity */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '30px',
            padding: '40px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '30px' }}>
            Recent Activity
          </span>
          
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '25px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '24px', color: '#fff' }}>x402 Purchase</span>
                <span style={{ fontSize: '20px', color: '#666' }}>2 min ago</span>
              </div>
              <span style={{ fontSize: '24px', color: '#00ffcc' }}>+{i * 1000} VOT</span>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '40px',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '24px', color: '#666' }}>Powered by</span>
          <span style={{ fontSize: '24px', color: '#ff6600', fontWeight: 700 }}>Base</span>
        </div>
      </div>
    ),
    {
      width: 1284,
      height: 2778,
    }
  );
}
