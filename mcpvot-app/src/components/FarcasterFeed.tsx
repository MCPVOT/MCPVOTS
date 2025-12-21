'use client';

import { useFarcasterIdentity } from '@/lib/farcaster-auth';
import { useFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
// Server-side name resolution via API avoids bundling server-only libs into client bundle
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Float, Text } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAccount } from 'wagmi';
import { FarcasterAuthButton } from './FarcasterAuthButton';

interface Cast {
    hash: string;
    text: string;
    author: {
        fid: number;
        username: string;
        display_name: string;
        pfp_url?: string;
    };
    timestamp: string;
    reactions: {
        likes_count: number;
        recasts_count: number;
    };
    replies: {
        count: number;
    };
}

interface FeedResponse {
    casts: Cast[];
}

// Retro Game Dashboard 3D Scene Component
function FarcasterScene({ castCount }: { castCount: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const gaugeRefs = useRef<(THREE.Mesh | null)[]>([]);
    const pixelRefs = useRef<(THREE.Mesh | null)[]>([]);

    // Retro game color palette (memoized to avoid recreation on every render)
    const retroColors = useMemo(() => ({
        neonGreen: "#39ff14",
        electricBlue: "#00ffff",
        brightOrange: "#ff4500",
        cyberYellow: "#ffff00",
        retroPurple: "#8a2be2"
    }), []);

    // Generate pixel art data nodes
    const pixelNodes = useMemo(() => {
        return Array.from({ length: castCount }, (_, i) => {
            const angle = (i / Math.max(castCount, 8)) * Math.PI * 2;
            const radius = 2 + (i % 4) * 0.5;
            return {
                id: i,
                position: [
                    Math.cos(angle) * radius,
                    Math.sin(angle * 0.5) * 0.8,
                    Math.sin(angle) * radius
                ] as [number, number, number],
                color: Object.values(retroColors)[i % Object.values(retroColors).length],
                scale: 0.8 + (i % 3) * 0.2
            };
        });
    }, [castCount, retroColors]);

    // Generate dashboard gauges
    const gauges = useMemo(() => {
        return [
            { label: "CASTS", value: castCount, max: 100, color: retroColors.neonGreen },
            { label: "ENGAGEMENT", value: Math.min(castCount * 2.5, 100), max: 100, color: retroColors.electricBlue },
            { label: "TRENDING", value: Math.min(castCount * 1.8, 100), max: 100, color: retroColors.cyberYellow },
            { label: "REACH", value: Math.min(castCount * 3.2, 100), max: 100, color: retroColors.brightOrange }
        ];
    }, [castCount, retroColors]);

    // Generate floating particles (pre-calculated to avoid Math.random in render)
    const floatingParticles = useMemo(() => {
        return Array.from({ length: 20 }, (_, i) => {
            // Use deterministic but varied positions based on index
            const seed = i * 0.618; // Golden ratio for good distribution
            const x = (Math.sin(seed * 2.4) - 0.5) * 15;
            const y = Math.cos(seed * 3.7) * 4 - 2;
            const z = (Math.sin(seed * 1.3) - 0.5) * 10 - 3;

            return {
                id: i,
                position: [x, y, z] as [number, number, number],
                color: Object.values(retroColors)[i % Object.values(retroColors).length]
            };
        });
    }, [retroColors]);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005;
        }

        // Animate pixel nodes
        pixelRefs.current.forEach((pixel, i) => {
            if (pixel) {
                pixel.rotation.x += 0.01;
                pixel.rotation.y += 0.015;
                pixel.position.y += Math.sin(state.clock.elapsedTime + i) * 0.002;
            }
        });

        // Animate gauges
        gaugeRefs.current.forEach((gauge, i) => {
            if (gauge) {
                gauge.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.1;
            }
        });
    });

    return (
        <>
            {/* Retro CRT monitor effect */}
            <fog attach="fog" args={['#000814', 8, 20]} />

            {/* Dashboard base platform */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
                <cylinderGeometry args={[8, 8, 0.2, 32]} />
                <meshStandardMaterial
                    color="#1a1a2e"
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Retro grid background */}
            <mesh position={[0, 0, -5]}>
                <planeGeometry args={[25, 15]} />
                <meshBasicMaterial
                    color="#000814"
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Pixel art data nodes */}
            <group ref={groupRef}>
                {pixelNodes.map((node) => (
                    <group key={`pixel-${node.id}`}>
                        {/* Main pixel cube */}
                        <mesh
                            ref={(el) => (pixelRefs.current[node.id] = el)}
                            position={node.position}
                            scale={[node.scale, node.scale, node.scale]}
                        >
                            <boxGeometry args={[0.3, 0.3, 0.3]} />
                            <meshStandardMaterial
                                color={node.color}
                                emissive={node.color}
                                emissiveIntensity={0.3}
                                metalness={0.5}
                                roughness={0.3}
                            />
                        </mesh>

                        {/* Pixel trail effect */}
                        <mesh position={[node.position[0], node.position[1], node.position[2] + 0.2]}>
                            <boxGeometry args={[0.1, 0.1, 0.8]} />
                            <meshBasicMaterial
                                color={node.color}
                                transparent
                                opacity={0.4}
                            />
                        </mesh>
                    </group>
                ))}
            </group>

            {/* Dashboard Gauges */}
            {gauges.map((gauge, i) => {
                const angle = (i / gauges.length) * Math.PI * 2;
                const radius = 4;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;

                return (
                    <group key={`gauge-${i}`} position={[x, 0.5, z]}>
                        {/* Gauge base */}
                        <mesh rotation={[0, angle, 0]}>
                            <cylinderGeometry args={[0.8, 0.8, 0.1, 16]} />
                            <meshStandardMaterial
                                color="#2a2a4e"
                                metalness={0.7}
                                roughness={0.3}
                            />
                        </mesh>

                        {/* Gauge ring */}
                        <mesh
                            ref={(el) => (gaugeRefs.current[i] = el)}
                            rotation={[0, angle, 0]}
                            position={[0, 0.06, 0]}
                        >
                            <ringGeometry args={[0.6, 0.7, 32]} />
                            <meshStandardMaterial
                                color={gauge.color}
                                emissive={gauge.color}
                                emissiveIntensity={0.2}
                            />
                        </mesh>

                        {/* Gauge needle */}
                        <mesh rotation={[0, angle, (gauge.value / gauge.max) * Math.PI - Math.PI / 2]}>
                            <boxGeometry args={[0.02, 0.02, 0.5]} />
                            <meshStandardMaterial color="#ff0000" />
                        </mesh>

                        {/* Gauge label */}
                        <Text
                            position={[0, -1.2, 0]}
                            fontSize={0.15}
                            color={gauge.color}
                            anchorX="center"
                            anchorY="middle"
                            font="/fonts/inter-mono.woff"
                        >
                            {`${gauge.label}\n${Math.round(gauge.value)}%`}
                        </Text>
                    </group>
                );
            })}

            {/* Central holographic display */}
            <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.3}>
                <group position={[0, 2, 0]}>
                    {/* Display screen */}
                    <mesh>
                        <boxGeometry args={[3, 1.5, 0.1]} />
                        <meshStandardMaterial
                            color="#001122"
                            emissive="#001122"
                            emissiveIntensity={0.1}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>

                    {/* Display content */}
                    <Text
                        position={[0, 0.2, 0.06]}
                        fontSize={0.25}
                        color={retroColors.neonGreen}
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/inter-mono.woff"
                    >
                        {`FARCASTER DASHBOARD\nACTIVE CASTS: ${castCount}`}
                    </Text>

                    {/* Status indicators */}
                    <group position={[-1, -0.3, 0.06]}>
                        <mesh position={[0, 0, 0]}>
                            <sphereGeometry args={[0.05, 8, 8]} />
                            <meshStandardMaterial
                                color={castCount > 0 ? retroColors.neonGreen : "#666666"}
                                emissive={castCount > 0 ? retroColors.neonGreen : "#666666"}
                                emissiveIntensity={0.5}
                            />
                        </mesh>
                        <Text
                            position={[0.2, 0, 0]}
                            fontSize={0.1}
                            color={retroColors.electricBlue}
                            anchorX="left"
                            anchorY="middle"
                            font="/fonts/inter-mono.woff"
                        >
                            STATUS
                        </Text>
                    </group>
                </group>
            </Float>

            {/* Retro arcade elements */}
            <group position={[0, -1, -3]}>
                {/* Arcade cabinet base */}
                <mesh>
                    <boxGeometry args={[6, 0.5, 2]} />
                    <meshStandardMaterial
                        color="#4a4a4a"
                        metalness={0.6}
                        roughness={0.4}
                    />
                </mesh>

                {/* Control panel */}
                <mesh position={[0, 0.3, 0.8]}>
                    <boxGeometry args={[4, 0.8, 0.2]} />
                    <meshStandardMaterial
                        color="#2a2a2a"
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>

                {/* Neon trim */}
                <mesh position={[0, 0.3, 0.9]}>
                    <boxGeometry args={[4.2, 0.05, 0.05]} />
                    <meshStandardMaterial
                        color={retroColors.cyberYellow}
                        emissive={retroColors.cyberYellow}
                        emissiveIntensity={0.8}
                    />
                </mesh>
            </group>

            {/* Floating data particles */}
            {floatingParticles.map((particle) => (
                <mesh key={`particle-${particle.id}`} position={particle.position}>
                    <sphereGeometry args={[0.02, 4, 4]} />
                    <meshBasicMaterial
                        color={particle.color}
                        transparent
                        opacity={0.6}
                    />
                </mesh>
            ))}

            {/* Retro gaming lighting */}
            <ambientLight intensity={0.3} color="#ffffff" />
            <pointLight position={[5, 5, 5]} intensity={0.8} color={retroColors.electricBlue} />
            <pointLight position={[-5, 3, -5]} intensity={0.6} color={retroColors.cyberYellow} />
            <spotLight
                position={[0, 8, 0]}
                angle={0.6}
                penumbra={0.5}
                intensity={0.5}
                color={retroColors.neonGreen}
                castShadow
            />

            {/* CRT scanlines effect */}
            <mesh position={[0, 0, 4]}>
                <planeGeometry args={[25, 15]} />
                <meshBasicMaterial
                    color="#000000"
                    transparent
                    opacity={0.03}
                    wireframe
                />
            </mesh>
        </>
    );
}

export default function FarcasterFeed() {
    const { fid: currentFid } = useFarcasterIdentity();
    const { address, isConnected } = useAccount();
    const { isInMiniApp, user: farcasterUser } = useFarcasterContext();
    const [feed, setFeed] = useState<FeedResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fid, setFid] = useState<string>('');
    const [baseName, setBaseName] = useState<string | null>(null);
    const [resolvingBaseName, setResolvingBaseName] = useState(false);

    // Resolve Base name via local API
    useEffect(() => {
        const fetchBaseName = async () => {
            if (!address) {
                setBaseName(null);
                return;
            }

            setResolvingBaseName(true);
            try {
                const res = await fetch(`/api/resolve-basename?address=${address}`);
                if (!res.ok) {
                    setBaseName(null);
                    return;
                }
                const payload = await res.json();
                setBaseName(payload.baseName ?? null);
            } catch (error) {
                console.error('[FarcasterFeed] Failed to resolve basename:', error);
                setBaseName(null);
            } finally {
                setResolvingBaseName(false);
            }
        };

        fetchBaseName();
    }, [address]);

    // Auto-set FID from Farcaster user if available
    useEffect(() => {
        if (farcasterUser?.fid && !fid) {
            setFid(farcasterUser.fid.toString());
        }
    }, [farcasterUser, fid]);

    const fetchFeed = async () => {
        if (!fid.trim()) {
            setError('Please enter a Farcaster FID');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // In a real implementation, this would require x402 payment first
            const response = await fetch(`/api/farcaster/feed?fid=${fid}&limit=10&viewer_fid=${currentFid}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch feed: ${response.status}`);
            }

            const data = await response.json();
            setFeed(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch feed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen retro-grid-bg text-slate-100 font-mono overflow-hidden" style={{ backgroundColor: '#0a0e18' }}>
            {/* Terminal-style overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80" />

            {/* Scanlines effect */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-cyan-500/5 to-transparent bg-repeat" style={{ backgroundSize: '100% 2px' }} />
            </div>

            {/* 3D Background Scene */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                    <FarcasterScene castCount={feed?.casts?.length || 0} />
                </Canvas>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 max-w-4xl mx-auto p-6">
                <div className="bg-black/40 border border-cyan-500/30 rounded-lg shadow-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-cyan-400">
                            🌟 Farcaster Feed Terminal
                        </h1>
                        <div className="flex items-center gap-4">
                            {/* Farcaster Connection Status */}
                            <div className="flex items-center gap-2 px-3 py-1 bg-black/60 border border-cyan-400/40 rounded-lg">
                                <div className={`w-2 h-2 rounded-full ${isInMiniApp ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                                <span className="text-xs text-cyan-300">
                                    {isInMiniApp ? 'FARCASTER' : 'WEB'}
                                </span>
                            </div>
                            <FarcasterAuthButton />
                        </div>
                    </div>

                    {!isConnected ? (
                        <div className="text-center py-8">
                            <p className="text-slate-300 mb-4">Connect your wallet to access Farcaster feeds</p>
                            <ConnectButton />
                        </div>
                    ) : (
                        <>
                            {/* User Info Bar */}
                            <div className="mb-6 p-4 bg-black/60 border border-cyan-500/30 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm">
                                            <span className="text-cyan-400">Wallet:</span>
                                            <span className="text-slate-300 ml-2">
                                                {resolvingBaseName ? 'Resolving...' : baseName ? `${baseName}` : `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                                            </span>
                                        </div>
                                        {farcasterUser && (
                                            <div className="text-sm">
                                                <span className="text-cyan-400">Farcaster:</span>
                                                <span className="text-slate-300 ml-2">@{farcasterUser.username}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        FID: {farcasterUser?.fid || 'Not Connected'}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="fid" className="block text-sm font-medium text-cyan-400 mb-2">
                                    Target Farcaster User FID
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="fid"
                                        value={fid}
                                        onChange={(e) => setFid(e.target.value)}
                                        placeholder="Enter FID (e.g., 12345) or leave empty for your feed"
                                        className="flex-1 px-3 py-2 bg-black/60 border border-cyan-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-100 placeholder-slate-500 backdrop-blur-sm"
                                    />
                                    <button
                                        onClick={fetchFeed}
                                        disabled={loading}
                                        className="px-4 py-2 bg-cyan-600/80 hover:bg-cyan-500/80 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-cyan-400/30"
                                    >
                                        {loading ? 'Loading...' : 'Fetch Feed'}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Enter any Farcaster user&apos;s FID to view their feed, or leave empty to view recent casts
                                </p>
                            </div>                            {error && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 text-red-200 rounded backdrop-blur-sm">
                                    {error}
                                </div>
                            )}

                            {feed && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-cyan-400 border-b border-cyan-500/30 pb-2">
                                        Feed for FID {fid || 'Recent Casts'}
                                    </h2>

                                    {feed.casts.length === 0 ? (
                                        <p className="text-slate-400">No casts found</p>
                                    ) : (
                                        feed.casts.map((cast) => (
                                            <div key={cast.hash} className="border border-cyan-500/20 rounded-lg p-4 bg-black/40 backdrop-blur-sm">
                                                <div className="flex items-center gap-3 mb-3">
                                                    {cast.author.pfp_url && (
                                                        <Image
                                                            src={cast.author.pfp_url}
                                                            alt={cast.author.username}
                                                            width={40}
                                                            height={40}
                                                            className="w-10 h-10 rounded-full border border-cyan-400/30"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-cyan-300">
                                                            {cast.author.display_name || cast.author.username}
                                                        </p>
                                                        <p className="text-sm text-slate-400">
                                                            @{cast.author.username} • FID: {cast.author.fid}
                                                        </p>
                                                    </div>
                                                </div>

                                                <p className="text-slate-200 mb-3">{cast.text}</p>

                                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                                    <span>❤️ {cast.reactions.likes_count}</span>
                                                    <span>🔄 {cast.reactions.recasts_count}</span>
                                                    <span>💬 {cast.replies.count}</span>
                                                    <span className="ml-auto">
                                                        {new Date(cast.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            <div className="mt-6 p-4 bg-black/60 border border-cyan-500/30 rounded-lg backdrop-blur-sm">
                                <h3 className="font-semibold text-cyan-400 mb-2">x402 Payment Integration</h3>
                                <p className="text-sm text-slate-300">
                                    This feed access requires x402 micropayments. In a full implementation,
                                    users would pay a small amount of VOT tokens to access premium Farcaster content.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
