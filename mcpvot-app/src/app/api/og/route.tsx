import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Extract dynamic parameters
        const title = searchParams.get('title') || 'Farcaster Feed';
        const subtitle = searchParams.get('subtitle') || '3D Social Experience with x402 Micropayments';
        const castCount = searchParams.get('casts') || '0';
        const user = searchParams.get('user') || 'Anonymous';

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
                        backgroundColor: '#000',
                        backgroundImage: 'radial-gradient(circle at 25px 25px, #0a0a0a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #0a0a0a 2%, transparent 0%)',
                        backgroundSize: '100px 100px',
                        position: 'relative',
                    }}
                >
                    {/* Cyber grid overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 247, 255, .05) 25%, rgba(0, 247, 255, .05) 26%, transparent 27%, transparent 74%, rgba(0, 247, 255, .05) 75%, rgba(0, 247, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 247, 255, .05) 25%, rgba(0, 247, 255, .05) 26%, transparent 27%, transparent 74%, rgba(0, 247, 255, .05) 75%, rgba(0, 247, 255, .05) 76%, transparent 77%, transparent)',
                            backgroundSize: '50px 50px',
                            opacity: 0.3,
                        }}
                    />

                    {/* Retro scanlines */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px)',
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Main content */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '40px',
                            zIndex: 10,
                        }}
                    >
                        {/* Logo placeholder - would be SVG in production */}
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 120,
                                fontWeight: 900,
                                letterSpacing: '-0.05em',
                                color: '#00f7ff',
                                textShadow: '0 0 20px rgba(0, 247, 255, 0.8), 0 0 40px rgba(0, 247, 255, 0.4)',
                                marginBottom: '40px',
                                fontFamily: 'monospace',
                            }}
                        >
                            🌟 {title}
                        </div>

                        {/* Subtitle */}
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 32,
                                color: '#8b5cf6',
                                marginBottom: '60px',
                                fontFamily: 'monospace',
                                textShadow: '0 0 10px rgba(139, 92, 246, 0.6)',
                            }}
                        >
                            {subtitle}
                        </div>

                        {/* Stats row */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '60px',
                                fontSize: 24,
                                fontFamily: 'monospace',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ color: '#00f7ff', marginBottom: '8px' }}>CASTS</div>
                                <div style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>{castCount}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ color: '#ff6b6b', marginBottom: '8px' }}>x402</div>
                                <div style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>PAID</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ color: '#4ecdc4', marginBottom: '8px' }}>3D</div>
                                <div style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>READY</div>
                            </div>

                            {user !== 'Anonymous' && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ color: '#8b5cf6', marginBottom: '8px' }}>USER</div>
                                    <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>@{user}</div>
                                </div>
                            )}
                        </div>

                        {/* Border frame */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '20px',
                                left: '20px',
                                right: '20px',
                                bottom: '20px',
                                border: '2px solid rgba(0, 247, 255, 0.3)',
                                borderRadius: '8px',
                                pointerEvents: 'none',
                            }}
                        />

                        {/* Corner accents */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '20px',
                                left: '20px',
                                width: '40px',
                                height: '40px',
                                borderTop: '4px solid #00f7ff',
                                borderLeft: '4px solid #00f7ff',
                                boxShadow: '0 0 20px rgba(0, 247, 255, 0.6)',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                width: '40px',
                                height: '40px',
                                borderTop: '4px solid #8b5cf6',
                                borderRight: '4px solid #8b5cf6',
                                boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: '20px',
                                width: '40px',
                                height: '40px',
                                borderBottom: '4px solid #8b5cf6',
                                borderLeft: '4px solid #8b5cf6',
                                boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '20px',
                                right: '20px',
                                width: '40px',
                                height: '40px',
                                borderBottom: '4px solid #00f7ff',
                                borderRight: '4px solid #00f7ff',
                                boxShadow: '0 0 20px rgba(0, 247, 255, 0.6)',
                            }}
                        />
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (error) {
        console.error('OG Image generation error:', error);
        return new Response('Failed to generate image', { status: 500 });
    }
}
