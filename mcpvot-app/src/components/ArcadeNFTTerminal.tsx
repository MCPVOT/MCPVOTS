'use client';

import { useIntelligenceStreams } from '@/hooks/useIntelligenceStreams';
import { Float, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';

interface LiveSnapshot {
    gasPrice: string;
    votPrice: string;
    blockStatus: string;
    timestamp: string;
}

interface ArcadeNFTTerminalProps {
    tokenId: number;
    rarity: 'root' | 'operator' | 'sentinel' | 'architekt' | 'legendary';
    width?: number;
    height?: number;
}

export default function ArcadeNFTTerminal({
    tokenId,
    rarity,
    width = 400,
    height = 500
}: ArcadeNFTTerminalProps) {
    const streams = useIntelligenceStreams();
    const { realtime, vot, trading, marquee, connection, status } = streams;

    const liveSnapshot: LiveSnapshot = useMemo(() => {
        const gasValue = realtime.gasGwei !== undefined && realtime.gasGwei !== null
            ? realtime.gasGwei.toFixed(2)
            : '---';
        const votValue = vot.priceUsd !== undefined && vot.priceUsd !== null
            ? vot.priceUsd.toFixed(4)
            : '0.00';
        const blockState = trading.strategyState
            ? trading.strategyState.toUpperCase()
            : connection.httpHealthy
                ? 'LIVE'
                : 'SYNCING';

        return {
            gasPrice: gasValue,
            votPrice: votValue,
            blockStatus: blockState,
            timestamp: new Date().toISOString().slice(11, 19),
        };
    }, [connection.httpHealthy, realtime.gasGwei, trading.strategyState, vot.priceUsd]);

    const terminalLines = useMemo((): string[] => {
        const lines: string[] = [
            `> STREAM STATE ${status.toUpperCase()}`,
            connection.ws.trading ? '> TRADING WS ONLINE' : '> TRADING WS OFFLINE',
            connection.ws.analytics ? '> ANALYTICS WS ONLINE' : '> ANALYTICS WS OFFLINE',
            connection.httpHealthy ? '> HTTP STREAM HEALTHY' : '> HTTP STREAM DEGRADED',
        ];

        const marqueeLines = [...marquee.items]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 4)
            .map(item => `> ${item.label}: ${item.message}`);

        lines.push(...marqueeLines);
        return lines.slice(-6);
    }, [connection.httpHealthy, connection.ws.analytics, connection.ws.trading, marquee.items, status]);

    // Color schemes by rarity
    const colors = {
        root: { primary: '#00ff88', secondary: '#00cc66', glow: '#00ff88' },
        operator: { primary: '#ff6b00', secondary: '#ff8800', glow: '#ffaa00' },
        sentinel: { primary: '#ff00ff', secondary: '#ff66ff', glow: '#ff00ff' },
        architekt: { primary: '#ff0000', secondary: '#ff3333', glow: '#ff0000' },
        legendary: { primary: '#ffaa00', secondary: '#ffcc00', glow: '#ffaa00' }
    };

    const colorScheme = colors[rarity];

    return (
        <div className="arcade-nft-terminal" style={{ width, height }}>
            {/* Arcade Cabinet Border */}
            <div className="arcade-frame">
                <div className="frame-top">
                    <div className="corner-led left"></div>
                    <div className="title-marquee">
                        <span className="marquee-text">AGENT #{tokenId.toString().padStart(5, '0')}</span>
                    </div>
                    <div className="corner-led right"></div>
                </div>

                {/* Main Screen Area */}
                <div className="arcade-screen">
                    {/* Animated Dashboard NFT - Full Intelligence Display */}
                    <div className="nft-dashboard">
                        {/* Top: 3D Hologram Core */}
                        <div className="hologram-section">
                            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                                <ambientLight intensity={0.3} />
                                <pointLight position={[10, 10, 10]} intensity={0.8} color={colorScheme.primary} />
                                <pointLight position={[-10, -10, -10]} intensity={0.5} color={colorScheme.secondary} />

                                {/* Animated NFT Core - Tier-Specific Geometries */}
                                <Float
                                    speed={rarity === 'legendary' ? 3 : 2}
                                    rotationIntensity={rarity === 'legendary' ? 1.2 : 0.8}
                                    floatIntensity={0.5}
                                >
                                    {/* ROOT TIER - Basic wireframe cube + octahedron */}
                                    {rarity === 'root' && (
                                        <>
                                            <mesh scale={1.3}>
                                                <boxGeometry args={[2, 2, 2]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.primary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={0.6}
                                                    wireframe
                                                />
                                            </mesh>
                                            <mesh scale={0.9} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                                                <octahedronGeometry args={[1, 0]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.primary}
                                                    transparent
                                                    opacity={0.4}
                                                />
                                            </mesh>
                                        </>
                                    )}

                                    {/* OPERATOR TIER - Dual torus rings + icosahedron */}
                                    {rarity === 'operator' && (
                                        <>
                                            <mesh scale={1.5} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                                                <torusGeometry args={[1.2, 0.2, 12, 32]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.primary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={0.8}
                                                    transparent
                                                    opacity={0.7}
                                                />
                                            </mesh>
                                            <mesh scale={1.5} rotation={[Math.PI / 2, Math.PI / 3, 0]}>
                                                <torusGeometry args={[1.2, 0.2, 12, 32]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.secondary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={0.8}
                                                    transparent
                                                    opacity={0.7}
                                                />
                                            </mesh>
                                            <mesh scale={0.8}>
                                                <icosahedronGeometry args={[1, 1]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.primary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={1}
                                                    wireframe
                                                />
                                            </mesh>
                                        </>
                                    )}

                                    {/* SENTINEL TIER - Dodecahedron + torus knot + icosahedron core */}
                                    {rarity === 'sentinel' && (
                                        <>
                                            <mesh scale={1.6}>
                                                <dodecahedronGeometry args={[1, 0]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.primary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={0.7}
                                                    wireframe
                                                />
                                            </mesh>
                                            <mesh scale={1.2} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                                                <torusKnotGeometry args={[0.8, 0.2, 64, 16]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.secondary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={0.9}
                                                    transparent
                                                    opacity={0.6}
                                                />
                                            </mesh>
                                            <mesh scale={0.6}>
                                                <icosahedronGeometry args={[1, 2]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.primary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={1.3}
                                                />
                                            </mesh>
                                        </>
                                    )}

                                    {/* ARCHITEKT TIER - High-poly icosahedron + octahedron + dodecahedron */}
                                    {rarity === 'architekt' && (
                                        <>
                                            <mesh scale={1.7}>
                                                <icosahedronGeometry args={[1, 3]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.primary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={0.8}
                                                    wireframe
                                                    transparent
                                                    opacity={0.9}
                                                />
                                            </mesh>
                                            <mesh scale={1.3} rotation={[Math.PI / 6, Math.PI / 6, Math.PI / 6]}>
                                                <octahedronGeometry args={[1, 2]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.secondary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={0.9}
                                                    transparent
                                                    opacity={0.5}
                                                />
                                            </mesh>
                                            <mesh scale={0.7}>
                                                <dodecahedronGeometry args={[1, 1]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.primary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={1.5}
                                                />
                                            </mesh>
                                        </>
                                    )}

                                    {/* LEGENDARY TIER - Complex nested with torus knot + bright core */}
                                    {rarity === 'legendary' && (
                                        <>
                                            <mesh scale={2.2}>
                                                <icosahedronGeometry args={[1, 4]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.primary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={1}
                                                    wireframe
                                                    transparent
                                                    opacity={0.95}
                                                />
                                            </mesh>
                                            <mesh scale={1.6} rotation={[0, Math.PI / 4, 0]}>
                                                <torusKnotGeometry args={[1, 0.3, 128, 32, 3, 7]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.secondary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={1.2}
                                                    transparent
                                                    opacity={0.8}
                                                />
                                            </mesh>
                                            <mesh scale={1}>
                                                <dodecahedronGeometry args={[1, 2]} />
                                                <meshStandardMaterial
                                                    color={colorScheme.primary}
                                                    emissive={colorScheme.glow}
                                                    emissiveIntensity={1.8}
                                                />
                                            </mesh>
                                            <mesh scale={0.5}>
                                                <sphereGeometry args={[1, 32, 32]} />
                                                <meshStandardMaterial
                                                    color="#ffffff"
                                                    emissive="#ffffff"
                                                    emissiveIntensity={2.5}
                                                />
                                            </mesh>
                                        </>
                                    )}
                                </Float>

                                {/* Orbiting Data Particles - Density varies by rarity */}
                                <DataParticles color={colorScheme.primary} rarity={rarity} />

                                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
                            </Canvas>

                            {/* Scan Line Effect */}
                            <div className="scanline"></div>

                            {/* Hologram Overlay Text */}
                            <div className="hologram-text">
                                <div className="hologram-label">AGENT #{tokenId.toString().padStart(5, '0')}</div>
                                <div className="hologram-status pulse">ACTIVE</div>
                            </div>
                        </div>

                        {/* Middle: Live Intelligence Dashboard */}
                        <div className="intelligence-panel">
                            <div className="panel-header">
                                <span className="blink">◉</span> INTELLIGENCE FEED
                            </div>

                            {/* Real-time Metrics Grid */}
                            <div className="metrics-grid">
                                <div className="metric-card">
                                    <div className="metric-icon">⛽</div>
                                    <div className="metric-content">
                                        <div className="metric-label">BASE GAS</div>
                                        <div className="metric-value glow">{liveSnapshot.gasPrice}</div>
                                        <div className="metric-unit">GWEI</div>
                                    </div>
                                    <div className="metric-trend">↗ +2%</div>
                                </div>

                                <div className="metric-card">
                                    <div className="metric-icon">🔷</div>
                                    <div className="metric-content">
                                        <div className="metric-label">VOT PRICE</div>
                                        <div className="metric-value glow">${liveSnapshot.votPrice}</div>
                                        <div className="metric-unit">USD</div>
                                    </div>
                                    <div className="metric-trend">↗ +5%</div>
                                </div>

                                <div className="metric-card">
                                    <div className="metric-icon">⛓</div>
                                    <div className="metric-content">
                                        <div className="metric-label">STREAM</div>
                                        <div className="metric-value">{liveSnapshot.blockStatus}</div>
                                        <div className="metric-unit">BASE</div>
                                    </div>
                                    <div className="metric-trend">⏱ LIVE</div>
                                </div>

                                <div className="metric-card">
                                    <div className="metric-icon">🎯</div>
                                    <div className="metric-content">
                                        <div className="metric-label">STATUS</div>
                                        <div className="metric-value pulse">{rarity.toUpperCase()}</div>
                                        <div className="metric-unit">ACCESS</div>
                                    </div>
                                    <div className="metric-trend">✓ OK</div>
                                </div>
                            </div>

                            {/* Data Stream Terminal */}
                            <div className="data-stream">
                                <div className="stream-header">
                                    <span className="stream-icon">▶</span>
                                    <span>DATA STREAM</span>
                                    <span className="stream-time">{liveSnapshot.timestamp}</span>
                                </div>
                                <div className="stream-content">
                                    {terminalLines.map((line, i) => (
                                        <div key={i} className="stream-line fade-in">
                                            <span className="stream-cursor">›</span> {line}
                                        </div>
                                    ))}
                                    <div className="stream-line">
                                        <span className="stream-cursor blink">›</span>
                                        <span className="cursor-blink">_</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Access Info */}
                        <div className="access-footer">
                            <div className="access-badge">
                                <span className="badge-icon">🔓</span>
                                <span className="badge-text">INTELLIGENCE ACCESS GRANTED</span>
                            </div>
                            <div className="powered-by">
                                <span>POWERED BY</span>
                                <span className="glow"> x402</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Arcade Controls */}
                <div className="arcade-controls">
                    <div className="control-panel">
                        <div className="status-indicator">
                            <span className="status-dot pulse"></span>
                            <span className="status-text">{rarity.toUpperCase()}</span>
                        </div>
                        <div className="token-id">
                            ID: #{tokenId.toString().padStart(5, '0')}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .arcade-nft-terminal {
                    position: relative;
                    font-family: 'Courier New', monospace;
                    user-select: none;
                }

                .arcade-frame {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
                    border: 3px solid ${colorScheme.primary};
                    border-radius: 12px;
                    box-shadow:
                        0 0 20px ${colorScheme.glow}33,
                        inset 0 0 30px #00000066;
                    padding: 8px;
                    position: relative;
                    overflow: hidden;
                }

                .frame-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: linear-gradient(180deg, #1a1a2e 0%, #0a0a0f 100%);
                    border: 1px solid ${colorScheme.primary}66;
                    border-radius: 6px;
                    margin-bottom: 8px;
                }

                .corner-led {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: ${colorScheme.primary};
                    box-shadow: 0 0 10px ${colorScheme.glow};
                    animation: led-pulse 2s ease-in-out infinite;
                }

                @keyframes led-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .title-marquee {
                    flex: 1;
                    text-align: center;
                    overflow: hidden;
                }

                .marquee-text {
                    color: ${colorScheme.primary};
                    font-size: 14px;
                    font-weight: bold;
                    letter-spacing: 3px;
                    text-shadow: 0 0 10px ${colorScheme.glow};
                }

                .arcade-screen {
                    position: relative;
                    width: 100%;
                    height: calc(100% - 80px);
                    background: #000000;
                    border: 2px solid ${colorScheme.primary}44;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: inset 0 0 30px ${colorScheme.glow}22;
                }

                .nft-hologram {
                    width: 100%;
                    height: 60%;
                    position: relative;
                }

                .scanline {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: ${colorScheme.primary}88;
                    box-shadow: 0 0 10px ${colorScheme.glow};
                    animation: scan 3s linear infinite;
                }

                @keyframes scan {
                    0% { top: 0%; }
                    100% { top: 100%; }
                }

                .data-terminal {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 40%;
                    background: linear-gradient(180deg, transparent 0%, #000000ee 20%);
                    padding: 12px;
                    overflow: hidden;
                }

                .terminal-header {
                    color: ${colorScheme.primary};
                    font-size: 10px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    letter-spacing: 2px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .blink {
                    animation: blink 1s step-end infinite;
                }

                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }

                .data-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                    margin-bottom: 10px;
                }

                .data-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    line-height: 1.4;
                }

                .label {
                    color: ${colorScheme.primary}aa;
                    font-weight: bold;
                }

                .value {
                    color: ${colorScheme.primary};
                    font-weight: bold;
                }

                .value.glow {
                    color: ${colorScheme.glow};
                    text-shadow: 0 0 8px ${colorScheme.glow};
                    animation: data-pulse 2s ease-in-out infinite;
                }

                @keyframes data-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                .terminal-feed {
                    border-top: 1px solid ${colorScheme.primary}33;
                    padding-top: 6px;
                    max-height: 50px;
                    overflow: hidden;
                }

                .terminal-line {
                    color: ${colorScheme.primary}cc;
                    font-size: 9px;
                    line-height: 1.3;
                    margin-bottom: 2px;
                }

                .fade-in {
                    animation: fade-in 0.5s ease-out;
                }

                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .arcade-controls {
                    margin-top: 8px;
                    padding: 8px 12px;
                    background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
                    border: 1px solid ${colorScheme.primary}66;
                    border-radius: 6px;
                }

                .control-panel {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: ${colorScheme.primary};
                }

                .status-dot.pulse {
                    animation: pulse 1.5s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        box-shadow: 0 0 5px ${colorScheme.glow}, 0 0 10px ${colorScheme.glow}66;
                    }
                    50% {
                        box-shadow: 0 0 15px ${colorScheme.glow}, 0 0 25px ${colorScheme.glow}aa;
                    }
                }

                .status-text {
                    color: ${colorScheme.primary};
                    font-size: 10px;
                    font-weight: bold;
                    letter-spacing: 1px;
                }

                .token-id {
                    color: ${colorScheme.primary}aa;
                    font-size: 10px;
                    font-weight: bold;
                    letter-spacing: 1px;
                }
            `}</style>
        </div>
    );
}

// Orbiting Data Particles Component - Density increases with rarity
function DataParticles({
    color,
    rarity
}: {
    color: string;
    rarity: 'root' | 'operator' | 'sentinel' | 'architekt' | 'legendary';
}) {
    const particleCounts = {
        root: 30,
        operator: 60,
        sentinel: 100,
        architekt: 150,
        legendary: 250
    };
    const particleCount = particleCounts[rarity];

    // Generate particles once with useMemo to avoid Math.random() during render
    const particles = useMemo(() => {
        const result: Array<{ x: number; y: number; z: number }> = [];
        const heightSpread = rarity === 'legendary' ? 4 : 3;
        const radiusSpread = rarity === 'legendary' ? 1.5 : 0.8;

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 2.5 + ((i * 7) % particleCount) / particleCount * radiusSpread;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = (((i * 11) % particleCount) / particleCount - 0.5) * heightSpread;

            result.push({ x, y, z });
        }
        return result;
    }, [particleCount, rarity]);

    const particleSize = rarity === 'legendary' ? 0.05 : 0.03;
    const emissiveIntensity = rarity === 'legendary' ? 2 : 1.2;

    return (
        <group rotation={[0, 0, 0]}>
            {particles.map((pos, i) => (
                <mesh key={i} position={[pos.x, pos.y, pos.z]}>
                    <sphereGeometry args={[particleSize, 8, 8]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={emissiveIntensity}
                    />
                </mesh>
            ))}
        </group>
    );
}
