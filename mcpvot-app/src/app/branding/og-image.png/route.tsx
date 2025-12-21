import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '1200px',
                    height: '630px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #050505 0%, #0a1a1a 50%, #050505 100%)',
                    fontFamily: 'monospace',
                    position: 'relative',
                }}
            >
                {/* Grid pattern */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `
                            linear-gradient(rgba(0, 255, 204, 0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 204, 0.02) 1px, transparent 1px)
                        `,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Top tagline bar */}
                <div
                    style={{
                        position: 'absolute',
                        top: '60px',
                        display: 'flex',
                        padding: '12px 50px',
                        background: 'rgba(0,10,10,0.9)',
                        border: '2px solid #00ffcc',
                        borderRadius: '8px',
                    }}
                >
                    <span style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold', letterSpacing: '4px' }}>
                        AI POWERED WEB3 ANALYTICS
                    </span>
                </div>

                {/* Main logo section */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '50px 80px',
                        background: 'rgba(0,10,10,0.95)',
                        border: '3px solid #ff6600',
                        borderRadius: '20px',
                        marginTop: '40px',
                    }}
                >
                    <span
                        style={{
                            fontSize: '64px',
                            fontWeight: 'bold',
                            color: '#00ffcc',
                            textShadow: '0 0 40px rgba(0,255,204,0.6)',
                        }}
                    >
                        MCPVOT
                    </span>
                    <span style={{ fontSize: '24px', color: '#ff6600', marginTop: '4px' }}>.ETH</span>
                    <span style={{ fontSize: '14px', color: '#00ffcc', marginTop: '16px', opacity: 0.7 }}>
                        x402 INTELLIGENCE
                    </span>
                </div>

                {/* Left decoration */}
                <div
                    style={{
                        position: 'absolute',
                        left: '100px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            border: '3px solid #00ffcc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.5)',
                        }}
                    >
                        <span style={{ color: '#00ffcc', fontSize: '28px', fontWeight: 'bold' }}>x402</span>
                    </div>
                    <span style={{ color: '#00ffcc', fontSize: '10px', marginTop: '12px', opacity: 0.6 }}>PROTOCOL</span>
                </div>

                {/* Right decoration */}
                <div
                    style={{
                        position: 'absolute',
                        right: '100px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            border: '3px solid #ff6600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.5)',
                        }}
                    >
                        <span style={{ color: '#ff6600', fontSize: '28px', fontWeight: 'bold' }}>BASE</span>
                    </div>
                    <span style={{ color: '#00ffcc', fontSize: '10px', marginTop: '12px', opacity: 0.6 }}>CHAIN 8453</span>
                </div>

                {/* VOT Contract Address */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '14px 50px',
                        background: 'rgba(0,10,10,0.95)',
                        border: '2px solid #ff6600',
                        borderRadius: '10px',
                    }}
                >
                    <span style={{ color: '#ff6600', fontSize: '12px', fontWeight: 'bold' }}>VOT TOKEN ON BASE</span>
                    <span style={{ color: '#ffffff', fontSize: '15px', marginTop: '6px', letterSpacing: '0.5px' }}>
                        0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07
                    </span>
                </div>

                {/* Protocol badges */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '50px',
                        display: 'flex',
                        gap: '20px',
                    }}
                >
                    {[
                        { label: 'EIP-3009', color: '#00ffcc' },
                        { label: 'GASLESS', color: '#00ffcc' },
                        { label: 'ERC-1155', color: '#ff6600' },
                        { label: 'AI INTEL', color: '#ff6600' },
                    ].map((badge) => (
                        <div
                            key={badge.label}
                            style={{
                                padding: '8px 20px',
                                border: `2px solid ${badge.color}`,
                                borderRadius: '20px',
                                background: badge.color === '#00ffcc' ? 'rgba(0,255,204,0.1)' : 'rgba(255,102,0,0.1)',
                            }}
                        >
                            <span style={{ color: badge.color, fontSize: '12px', fontWeight: 'bold' }}>{badge.label}</span>
                        </div>
                    ))}
                </div>

                {/* Corner accents */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '80px', height: '5px', background: '#00ffcc' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '80px', background: '#00ffcc' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '5px', background: '#00ffcc' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '5px', height: '80px', background: '#00ffcc' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '80px', height: '5px', background: '#ff6600' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '5px', height: '80px', background: '#ff6600' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '80px', height: '5px', background: '#ff6600' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '5px', height: '80px', background: '#ff6600' }} />
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
