/**
 * Dynamic Frame Image Generator for MCPVOT
 * Creates beautiful, animated-style images for each Frame step
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const step = searchParams.get('step') || 'home';
    const tier = searchParams.get('tier') || '';
    const holder = searchParams.get('holder') === 'true';

    let content;

    switch (step) {
        case 'home':
            content = (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '40px'
                }}>
                    <div style={{
                        fontSize: 40,
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: 10,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                        🎮 MCPVOT
                    </div>
                    <div style={{
                        fontSize: 20,
                        color: 'rgba(255,255,255,0.9)',
                        textAlign: 'center',
                        marginBottom: 15
                    }}>
                        Animated Intelligence Dashboard NFTs
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: 15,
                        marginTop: 10
                    }}>
                        <div style={{ fontSize: 15, color: '#00ff88' }}>⚡ Real-time Data</div>
                        <div style={{ fontSize: 15, color: '#ff6b00' }}>🔥 VOT Burns</div>
                        <div style={{ fontSize: 15, color: '#ff00ff' }}>💎 33,333 Supply</div>
                    </div>
                </div>
            );
            break;

        case 'select':
            content = (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    padding: '40px'
                }}>
                    <div style={{
                        fontSize: 30,
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: 20
                    }}>
                        Choose Your NFT Tier
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        width: '80%'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(0,255,136,0.2)',
                            border: '2px solid #00ff88',
                            borderRadius: 8,
                            padding: 10
                        }}>
                            <div style={{ fontSize: 25, marginRight: 10 }}>⚡</div>
                            <div style={{ fontSize: 18, color: 'white', flex: 1 }}>Basic - Standard Data</div>
                            <div style={{ fontSize: 20, color: '#00ff88' }}>$2</div>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(255,107,0,0.2)',
                            border: '2px solid #ff6b00',
                            borderRadius: 8,
                            padding: 10
                        }}>
                            <div style={{ fontSize: 25, marginRight: 10 }}>💎</div>
                            <div style={{ fontSize: 18, color: 'white', flex: 1 }}>Premium - Enhanced Intel</div>
                            <div style={{ fontSize: 20, color: '#ff6b00' }}>$2</div>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(255,0,255,0.2)',
                            border: '2px solid #ff00ff',
                            borderRadius: 8,
                            padding: 10
                        }}>
                            <div style={{ fontSize: 25, marginRight: 10 }}>🌟</div>
                            <div style={{ fontSize: 18, color: 'white', flex: 1 }}>Legendary - Full Access</div>
                            <div style={{ fontSize: 20, color: '#ff00ff' }}>$2</div>
                        </div>
                    </div>
                </div>
            );
            break;

        case 'mint':
            const tierColors = {
                basic: { bg: '#00ff88', text: '⚡ BASIC' },
                premium: { bg: '#ff6b00', text: '💎 PREMIUM' },
                legendary: { bg: '#ff00ff', text: '🌟 LEGENDARY' }
            };
            const tierInfo = tierColors[tier as keyof typeof tierColors] || tierColors.basic;

            content = (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${tierInfo.bg}20 0%, ${tierInfo.bg}60 100%)`,
                    padding: '40px'
                }}>
                    <div style={{
                        fontSize: 70,
                        fontWeight: 'bold',
                        color: tierInfo.bg,
                        marginBottom: 30
                    }}>
                        {tierInfo.text}
                    </div>
                    <div style={{
                        fontSize: 45,
                        color: 'white',
                        textAlign: 'center',
                        marginBottom: 40
                    }}>
                        Mint Your Dashboard NFT
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 15,
                        background: 'rgba(0,0,0,0.3)',
                        padding: 30,
                        borderRadius: 16
                    }}>
                        <div style={{ fontSize: 28, color: 'white' }}>💰 Price: $2 USDC</div>
                        <div style={{ fontSize: 28, color: 'white' }}>🔥 $1 → VOT Burn</div>
                        <div style={{ fontSize: 28, color: 'white' }}>💼 $1 → Treasury</div>
                        {holder && (
                            <div style={{ fontSize: 28, color: '#ffd700' }}>⭐ Warpcast Holder: +50% Burn!</div>
                        )}
                    </div>
                </div>
            );
            break;

        case 'stats':
            content = (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    padding: '40px'
                }}>
                    <div style={{
                        fontSize: 60,
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: 40
                    }}>
                        🔥 VOT Burn Statistics
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: 30,
                        width: '90%',
                        justifyContent: 'space-around'
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: 'rgba(0,255,136,0.1)',
                            border: '2px solid #00ff88',
                            borderRadius: 16,
                            padding: 30
                        }}>
                            <div style={{ fontSize: 50, color: '#00ff88', marginBottom: 10 }}>1,234</div>
                            <div style={{ fontSize: 25, color: 'white' }}>Total NFTs</div>
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: 'rgba(255,107,0,0.1)',
                            border: '2px solid #ff6b00',
                            borderRadius: 16,
                            padding: 30
                        }}>
                            <div style={{ fontSize: 50, color: '#ff6b00', marginBottom: 10 }}>567,890</div>
                            <div style={{ fontSize: 25, color: 'white' }}>VOT Burned</div>
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: 'rgba(255,0,255,0.1)',
                            border: '2px solid #ff00ff',
                            borderRadius: 16,
                            padding: 30
                        }}>
                            <div style={{ fontSize: 50, color: '#ff00ff', marginBottom: 10 }}>$2,468</div>
                            <div style={{ fontSize: 25, color: 'white' }}>Treasury</div>
                        </div>
                    </div>
                </div>
            );
            break;

        case 'dashboard':
            content = (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
                    padding: '40px'
                }}>
                    <div style={{
                        fontSize: 50,
                        fontWeight: 'bold',
                        color: '#00ff88',
                        marginBottom: 30,
                        textAlign: 'center'
                    }}>
                        📊 LIVE DASHBOARD
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                        flex: 1
                    }}>
                        <div style={{
                            display: 'flex',
                            gap: 20,
                            height: '40%'
                        }}>
                            <div style={{
                                flex: 1,
                                background: 'rgba(0,255,136,0.1)',
                                border: '2px solid #00ff88',
                                borderRadius: 12,
                                padding: 20,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}>
                                <div style={{ fontSize: 25, color: '#00ff88', marginBottom: 10 }}>⛽ GAS</div>
                                <div style={{ fontSize: 40, color: 'white' }}>0.001 Gwei</div>
                            </div>
                            <div style={{
                                flex: 1,
                                background: 'rgba(255,107,0,0.1)',
                                border: '2px solid #ff6b00',
                                borderRadius: 12,
                                padding: 20,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}>
                                <div style={{ fontSize: 25, color: '#ff6b00', marginBottom: 10 }}>💰 VOT</div>
                                <div style={{ fontSize: 40, color: 'white' }}>$0.000812</div>
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: 20,
                            height: '40%'
                        }}>
                            <div style={{
                                flex: 1,
                                background: 'rgba(255,0,255,0.1)',
                                border: '2px solid #ff00ff',
                                borderRadius: 12,
                                padding: 20,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}>
                                <div style={{ fontSize: 25, color: '#ff00ff', marginBottom: 10 }}>📦 BLOCK</div>
                                <div style={{ fontSize: 40, color: 'white' }}>#12,345,678</div>
                            </div>
                            <div style={{
                                flex: 1,
                                background: 'rgba(100,200,255,0.1)',
                                border: '2px solid #64c8ff',
                                borderRadius: 12,
                                padding: 20,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}>
                                <div style={{ fontSize: 25, color: '#64c8ff', marginBottom: 10 }}>⚡ STATUS</div>
                                <div style={{ fontSize: 40, color: '#00ff88' }}>LIVE</div>
                            </div>
                        </div>
                    </div>
                </div>
            );
            break;

        case 'success':
            content = (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    padding: '40px'
                }}>
                    <div style={{
                        fontSize: 100,
                        marginBottom: 30
                    }}>
                        ✅
                    </div>
                    <div style={{
                        fontSize: 60,
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: 20
                    }}>
                        NFT Minted Successfully!
                    </div>
                    <div style={{
                        fontSize: 35,
                        color: 'rgba(255,255,255,0.9)',
                        textAlign: 'center'
                    }}>
                        Your dashboard is now live
                    </div>
                </div>
            );
            break;

        default:
            content = (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#1a1a2e',
                    color: 'white',
                    fontSize: 60
                }}>
                    MCPVOT
                </div>
            );
    }

    return new ImageResponse(
        content,
        {
            width: 600,
            height: 600,
        }
    );
}
