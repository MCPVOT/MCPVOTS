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
                    background: 'linear-gradient(135deg, #000000 0%, #0a1515 50%, #000000 100%)',
                    fontFamily: 'monospace',
                    position: 'relative',
                }}
            >
                {/* Grid pattern overlay */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `
                            linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                    }}
                />

                {/* Top bar */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '50px',
                        background: 'rgba(0,0,0,0.9)',
                        borderBottom: '1px solid #00ffcc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 40px',
                    }}
                >
                    <span style={{ color: '#00ffcc', fontSize: '16px', fontWeight: 'bold' }}>MCPVOT.ETH</span>
                    <span style={{ color: '#ffffff', fontSize: '14px' }}>AI Powered Web3 Analytics on Base</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00ff00' }} />
                        <span style={{ color: '#00ffcc', fontSize: '12px' }}>LIVE</span>
                    </div>
                </div>

                {/* Main content */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '80px 40px 40px',
                    }}
                >
                    {/* Logo/Title */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '40px 60px',
                            border: '3px solid #ff6600',
                            borderRadius: '16px',
                            background: 'rgba(0,10,10,0.95)',
                            marginBottom: '30px',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '72px',
                                fontWeight: 'bold',
                                color: '#00ffcc',
                                textShadow: '0 0 30px rgba(0,255,204,0.5)',
                                letterSpacing: '4px',
                            }}
                        >
                            x402VOT
                        </span>
                        <span style={{ fontSize: '20px', color: '#ff6600', letterSpacing: '12px', marginTop: '8px' }}>
                            FACILITATOR
                        </span>
                        <span style={{ fontSize: '14px', color: '#00ffcc', marginTop: '16px', opacity: 0.8 }}>
                            GASLESS • AI POWERED • BASE CHAIN
                        </span>
                    </div>

                    {/* Protocol badges */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '30px' }}>
                        {['x402', 'EIP-3009', 'ERC-1155', 'AI INTEL'].map((badge, i) => (
                            <div
                                key={badge}
                                style={{
                                    padding: '10px 24px',
                                    border: `2px solid ${i % 2 === 0 ? '#00ffcc' : '#ff6600'}`,
                                    borderRadius: '25px',
                                    background: i % 2 === 0 ? 'rgba(0,255,204,0.1)' : 'rgba(255,102,0,0.1)',
                                }}
                            >
                                <span style={{ color: i % 2 === 0 ? '#00ffcc' : '#ff6600', fontSize: '14px', fontWeight: 'bold' }}>
                                    {badge}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contract address bar */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '70px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '16px 40px',
                        background: 'rgba(0,0,0,0.95)',
                        border: '2px solid #00ffcc',
                        borderRadius: '12px',
                    }}
                >
                    <span style={{ color: '#ff6600', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                        $VOT TOKEN ON BASE
                    </span>
                    <span style={{ color: '#ffffff', fontSize: '16px', letterSpacing: '1px' }}>
                        0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07
                    </span>
                </div>

                {/* Bottom bar */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '40px',
                        background: 'rgba(0,0,0,0.95)',
                        borderTop: '1px solid #00ffcc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '40px',
                    }}
                >
                    <span style={{ color: '#00ffcc', fontSize: '12px' }}>mcpvot.xyz</span>
                    <span style={{ color: '#ffffff', fontSize: '12px' }}>Farcaster Mini App</span>
                    <span style={{ color: '#ff6600', fontSize: '12px' }}>v2.2</span>
                </div>

                {/* Corner accents */}
                <div style={{ position: 'absolute', top: '50px', left: 0, width: '60px', height: '60px', borderLeft: '4px solid #00ffcc', borderBottom: '4px solid #00ffcc' }} />
                <div style={{ position: 'absolute', top: '50px', right: 0, width: '60px', height: '60px', borderRight: '4px solid #00ffcc', borderBottom: '4px solid #00ffcc' }} />
                <div style={{ position: 'absolute', bottom: '40px', left: 0, width: '60px', height: '60px', borderLeft: '4px solid #ff6600', borderTop: '4px solid #ff6600' }} />
                <div style={{ position: 'absolute', bottom: '40px', right: 0, width: '60px', height: '60px', borderRight: '4px solid #ff6600', borderTop: '4px solid #ff6600' }} />
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
