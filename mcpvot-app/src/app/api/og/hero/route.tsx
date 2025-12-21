import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#000000',
                    backgroundImage: 'linear-gradient(135deg, #000000 0%, #0a1628 30%, #001433 70%, #000000 100%)',
                    position: 'relative',
                }}
            >
                {/* Outer pixel border frame with double cyan glow */}
                <div
                    style={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        right: 16,
                        bottom: 16,
                        border: '3px solid #06b6d4',
                        boxShadow: '0 0 30px rgba(6, 182, 212, 0.6), inset 0 0 30px rgba(6, 182, 212, 0.2)',
                        display: 'flex',
                    }}
                />

                {/* Inner darker frame */}
                <div
                    style={{
                        position: 'absolute',
                        top: 28,
                        left: 28,
                        right: 28,
                        bottom: 28,
                        border: '1px solid rgba(6, 182, 212, 0.4)',
                        display: 'flex',
                    }}
                />

                {/* Retro corner brackets - top left */}
                <div
                    style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        width: 80,
                        height: 80,
                        borderTop: '5px solid #22d3ee',
                        borderLeft: '5px solid #22d3ee',
                        display: 'flex',
                        boxShadow: '0 0 15px rgba(34, 211, 238, 0.8)',
                    }}
                />
                {/* top right */}
                <div
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 80,
                        height: 80,
                        borderTop: '5px solid #60a5fa',
                        borderRight: '5px solid #60a5fa',
                        display: 'flex',
                        boxShadow: '0 0 15px rgba(96, 165, 250, 0.8)',
                    }}
                />
                {/* bottom left */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        width: 80,
                        height: 80,
                        borderBottom: '5px solid #22d3ee',
                        borderLeft: '5px solid #22d3ee',
                        display: 'flex',
                        boxShadow: '0 0 15px rgba(34, 211, 238, 0.8)',
                    }}
                />
                {/* bottom right */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        width: 80,
                        height: 80,
                        borderBottom: '5px solid #60a5fa',
                        borderRight: '5px solid #60a5fa',
                        display: 'flex',
                        boxShadow: '0 0 15px rgba(96, 165, 250, 0.8)',
                    }}
                />

                {/* Main content */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '50px',
                        zIndex: 10,
                    }}
                >
                    {/* Boot sequence header */}
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 13,
                            color: '#22d3ee',
                            fontFamily: 'monospace',
                            letterSpacing: '0.3em',
                            marginBottom: 20,
                            opacity: 0.9,
                        }}
                    >
                        ▌ SYSTEM BOOT SEQUENCE ▌
                    </div>

                    {/* VOT LOGO placeholder - using text since we can't load SVG */}
                    <div
                        style={{
                            display: 'flex',
                            width: 140,
                            height: 140,
                            marginBottom: 25,
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '4px solid #60a5fa',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(96, 165, 250, 0.2) 0%, transparent 70%)',
                            boxShadow: '0 0 40px rgba(96, 165, 250, 0.6), inset 0 0 30px rgba(96, 165, 250, 0.3)',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 64,
                                fontWeight: 900,
                                color: '#60a5fa',
                                textShadow: '0 0 20px rgba(96, 165, 250, 1)',
                                fontFamily: 'monospace',
                            }}
                        >
                            VOT
                        </span>
                    </div>

                    {/* Main title - MCPVOT */}
                    <h1
                        style={{
                            fontSize: 80,
                            fontWeight: 900,
                            color: '#22d3ee',
                            margin: '0 0 8px 0',
                            padding: 0,
                            letterSpacing: '0.25em',
                            textShadow: '0 0 30px rgba(34, 211, 238, 0.8), 0 0 60px rgba(34, 211, 238, 0.4)',
                            fontFamily: 'monospace',
                        }}
                    >
                        MCPVOT
                    </h1>

                    {/* Contract address */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: 25,
                        }}
                    >
                        <p
                            style={{
                                fontSize: 11,
                                color: '#60a5fa',
                                margin: '0 0 6px 0',
                                fontFamily: 'monospace',
                                letterSpacing: '0.35em',
                                opacity: 0.9,
                            }}
                        >
                            VOT TOKEN CONTRACT (BASE)
                        </p>
                        <p
                            style={{
                                fontSize: 13,
                                color: '#93c5fd',
                                margin: 0,
                                fontFamily: 'monospace',
                                letterSpacing: '0.12em',
                                opacity: 0.8,
                            }}
                        >
                            0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07
                        </p>
                    </div>

                    {/* Status indicator */}
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 14,
                            color: '#4ade80',
                            fontFamily: 'monospace',
                            letterSpacing: '0.25em',
                            marginBottom: 30,
                            padding: '8px 20px',
                            border: '1px solid rgba(74, 222, 128, 0.4)',
                            background: 'rgba(74, 222, 128, 0.1)',
                            boxShadow: '0 0 20px rgba(74, 222, 128, 0.3)',
                        }}
                    >
                        ▌ BASE NETWORK ACTIVE ▌
                    </div>

                    {/* Three system chips */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 12,
                            marginBottom: 30,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                padding: '10px 24px',
                                background: 'rgba(74, 222, 128, 0.15)',
                                border: '1px solid rgba(74, 222, 128, 0.4)',
                                fontSize: 11,
                                color: '#4ade80',
                                fontFamily: 'monospace',
                                letterSpacing: '0.25em',
                            }}
                        >
                            BASENAME
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                padding: '10px 24px',
                                background: 'rgba(96, 165, 250, 0.15)',
                                border: '1px solid rgba(96, 165, 250, 0.4)',
                                fontSize: 11,
                                color: '#60a5fa',
                                fontFamily: 'monospace',
                                letterSpacing: '0.25em',
                            }}
                        >
                            FARCASTER
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                padding: '10px 24px',
                                background: 'rgba(251, 146, 60, 0.15)',
                                border: '1px solid rgba(251, 146, 60, 0.4)',
                                fontSize: 11,
                                color: '#fb923c',
                                fontFamily: 'monospace',
                                letterSpacing: '0.25em',
                            }}
                        >
                            VOT HUD
                        </div>
                    </div>

                    {/* Terminal output */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            fontSize: 12,
                            color: '#93c5fd',
                            fontFamily: 'monospace',
                            lineHeight: 1.6,
                            opacity: 0.8,
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            padding: '16px 24px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            width: '90%',
                            maxWidth: 800,
                        }}
                    >
                        <div style={{ display: 'flex', marginBottom: 4 }}>
                            <span style={{ color: '#4ade80', marginRight: 8 }}>$</span>
                            <span>initialize_mcpvot_ecosystem</span>
                        </div>
                        <div style={{ display: 'flex', color: '#60a5fa', opacity: 0.7 }}>
                            &gt; MCPVOT initialized • Token: VOT • Status: LIVE
                        </div>
                        <div style={{ display: 'flex', color: '#60a5fa', opacity: 0.7 }}>
                            &gt; Sync: Farcaster ↔ Neynar ↔ Base identity mesh
                        </div>
                        <div style={{ display: 'flex', color: '#22d3ee', marginTop: 4 }}>
                            &gt; Awaiting connection...
                        </div>
                    </div>
                </div>

                {/* Scanline effect - retro CRT */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage:
                            'repeating-linear-gradient(0deg, rgba(96, 165, 250, 0.05) 0px, rgba(96, 165, 250, 0.05) 1px, transparent 1px, transparent 2px)',
                        pointerEvents: 'none',
                        display: 'flex',
                        opacity: 0.6,
                    }}
                />
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
