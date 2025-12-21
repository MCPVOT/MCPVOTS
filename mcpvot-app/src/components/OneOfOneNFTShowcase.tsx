'use client';

import { Float, Html, OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Vector3Tuple } from 'three';

interface OneOfOneNFT {
    id: string;
    name: string;
    codename: string;
    status: 'available' | 'minted' | 'reserved';
    image: string;
    highlight: string;
    position: Vector3Tuple;
    rotation: Vector3Tuple;
    mintedBy?: string;
    mintedAt?: string;
}

interface FarcasterReportResponse {
    success: boolean;
    reportText?: string;
    generatedAt?: string | null;
    refreshedAt?: string | null;
    error?: string;
    message?: string;
}

const ONE_OF_ONE_COLLECTION: OneOfOneNFT[] = [
    {
        id: 'base-nexus',
        name: 'BASE NEXUS',
        codename: 'Ω-01',
        status: 'available',
        image: '/warplet_VOT.png',
        highlight: '#00FFFF',
        position: [-1.65, 0.05, 0],
        rotation: [-0.05, 0.25, 0.02],
    },
    {
        id: 'farcaster-oracle',
        name: 'FARCASTER ORACLE',
        codename: 'Ω-02',
        status: 'minted',
        image: '/videoframe_4307.png',
        highlight: '#00FF88',
        position: [0, 0.25, -0.1],
        rotation: [0.02, 0, 0],
        mintedBy: '@warp.eth',
        mintedAt: '2025-10-31T21:17:00Z',
    },
    {
        id: 'warpcast-homage',
        name: 'WARPCAST HOMAGE',
        codename: 'Ω-03',
        status: 'reserved',
        image: '/videoframe_6394.png',
        highlight: '#FF8800',
        position: [1.65, 0.05, 0],
        rotation: [-0.05, -0.25, -0.02],
    },
];

const STATUS_LABEL: Record<OneOfOneNFT['status'], string> = {
    available: 'AVAILABLE',
    minted: 'MINTED',
    reserved: 'RESERVED',
};

interface OneOfOneNFTShowcaseProps {
    compact?: boolean;
}

function formatTimestamp(timestamp: string | null | undefined): string {
    if (!timestamp) {
        return 'UNKNOWN';
    }

    try {
        return new Date(timestamp).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    } catch (error) {
        console.warn('Failed to format timestamp', error);
        return timestamp;
    }
}

function OneOfOneCard({ nft }: { nft: OneOfOneNFT }) {
    const texture = useTexture(nft.image);

    return (
        <Float speed={1.2} rotationIntensity={0.45} floatIntensity={0.75} position={nft.position} rotation={nft.rotation}>
            <group>
                <mesh position={[0, 0, -0.045]}>
                    <planeGeometry args={[1.55, 2.25]} />
                    <meshBasicMaterial color={nft.highlight} transparent opacity={0.22} />
                </mesh>

                <mesh position={[0, 0, -0.03]}>
                    <planeGeometry args={[1.5, 2.2]} />
                    <meshBasicMaterial color={nft.highlight} transparent opacity={0.12} />
                </mesh>

                <mesh>
                    <planeGeometry args={[1.45, 2.15]} />
                    <meshStandardMaterial map={texture} roughness={0.35} metalness={0.1} />
                </mesh>

                <Html
                    position={[0, -1.35, 0]}
                    transform
                    distanceFactor={1}
                    className="pointer-events-none select-none"
                >
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-[0.6rem] font-mono tracking-[0.35em] uppercase text-[#00FFFF]/80 bg-black/70 border border-[#00FFFF]/30 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(0,255,255,0.4)]">
                            {nft.codename}
                        </div>
                        <div className="text-sm md:text-base font-orbitron tracking-[0.25em] uppercase text-[#FFFFFF] drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">
                            {nft.name}
                        </div>
                        <div className="text-[0.55rem] font-mono tracking-[0.35em] uppercase text-[#00FF88]/80">
                            {STATUS_LABEL[nft.status]}
                        </div>
                        {nft.status === 'minted' && (
                            <div className="text-[0.5rem] font-mono tracking-[0.25em] text-[#00FF88]/70">
                                {nft.mintedBy} • {formatTimestamp(nft.mintedAt)}
                            </div>
                        )}
                        {nft.status === 'reserved' && (
                            <div className="text-[0.5rem] font-mono tracking-[0.25em] text-[#FF8800]/70">
                                WARPLET OG QUEUE
                            </div>
                        )}
                    </div>
                </Html>
            </group>
        </Float>
    );
}

function NeonScene({ nfts }: { nfts: OneOfOneNFT[] }) {
    return (
        <group>
            <color attach="background" args={['#02040A']} />
            <ambientLight intensity={0.2} />
            <spotLight
                color="#00FFFF"
                position={[0, 4.2, 4.5]}
                intensity={2.4}
                distance={18}
                angle={0.8}
                penumbra={0.6}
                castShadow
            />
            <pointLight color="#00FF88" position={[-4, 2, -3]} intensity={1.6} distance={12} />
            <pointLight color="#FF8800" position={[4, 2, -3]} intensity={1.4} distance={12} />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
                <planeGeometry args={[12, 12, 32, 32]} />
                <meshStandardMaterial color="#020915" metalness={0.8} roughness={0.1} />
            </mesh>

            <group position={[0, 0, 0]}>
                {nfts.map((nft) => (
                    <OneOfOneCard key={nft.id} nft={nft} />
                ))}
            </group>

            <OrbitControls
                enablePan={false}
                enableZoom={false}
                autoRotate
                autoRotateSpeed={0.5}
                minPolarAngle={Math.PI / 3.5}
                maxPolarAngle={Math.PI / 2.2}
            />
            <PerspectiveCamera makeDefault fov={42} position={[0, 1.8, 6]} />
        </group>
    );
}

export default function OneOfOneNFTShowcase({ compact = false }: OneOfOneNFTShowcaseProps) {
    const [reportStatus, setReportStatus] = useState<'loading' | 'error' | 'ready'>('loading');
    const [reportLines, setReportLines] = useState<string[]>([]);
    const [reportTimestamp, setReportTimestamp] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadReport = async () => {
            try {
                const response = await fetch('/api/farcaster-ecosystem-report', { cache: 'no-store' });
                const payload = (await response.json()) as FarcasterReportResponse;

                if (!response.ok || !payload.success || !payload.reportText) {
                    if (isMounted) {
                        setReportLines([]);
                        setReportTimestamp(null);
                        setReportStatus('error');
                    }
                    return;
                }

                const sanitized = payload.reportText
                    .replace(/\r\n/g, '\n')
                    .split('\n')
                    .map((line) => line.trimEnd())
                    .filter((line) => line.length > 0);

                if (isMounted) {
                    setReportLines(sanitized);
                    setReportTimestamp(payload.generatedAt ?? payload.refreshedAt ?? null);
                    setReportStatus('ready');
                }
            } catch (error) {
                console.error('Failed to load Farcaster ecosystem report for showcase:', error);
                if (isMounted) {
                    setReportLines([]);
                    setReportTimestamp(null);
                    setReportStatus('error');
                }
            }
        };

        loadReport();

        return () => {
            isMounted = false;
        };
    }, []);

    const mintedCount = useMemo(() => ONE_OF_ONE_COLLECTION.filter((item) => item.status === 'minted').length, []);
    const totalSupply = ONE_OF_ONE_COLLECTION.length;
    const mintedPercentage = Math.round((mintedCount / Math.max(totalSupply, 1)) * 100);
    const displayedReport = useMemo(() => reportLines.slice(0, compact ? 4 : 7), [reportLines, compact]);

    return (
        <section
            className={`relative overflow-hidden rounded-2xl border border-[#00FFFF]/30 bg-black/80 backdrop-blur-xl shadow-[0_0_50px_rgba(0,255,255,0.25)] ${compact ? 'h-[420px]' : 'h-[540px] md:h-[600px]'
                }`}
        >
            <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.15),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(0,255,255,0.2),rgba(0,0,0,0)_45%,rgba(0,255,136,0.18)_60%,rgba(255,136,0,0.12)_85%)]" />
            </div>

            <div className="absolute inset-0 [mask-image:radial-gradient(circle_at_center,#000_78%,transparent)] pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,255,0.12)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-40" />
            </div>

            <Suspense
                fallback={
                    <div className="absolute inset-0 flex items-center justify-center text-[#00FFFF]/70 font-mono tracking-[0.35em] uppercase">
                        Initializing Legendary Vault…
                    </div>
                }
            >
                <Canvas dpr={[1, 1.5]} gl={{ antialias: true }} className="rounded-2xl">
                    <NeonScene nfts={ONE_OF_ONE_COLLECTION} />
                </Canvas>
            </Suspense>

            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 md:p-8">
                <div className="flex items-center justify-between">
                    <div className="bg-black/60 border border-[#00FFFF]/40 rounded-xl px-4 py-3 font-mono text-[#00FFFF]/80 uppercase tracking-[0.25em] shadow-[0_0_20px_rgba(0,255,255,0.35)]">
                        <div className="text-[0.6rem]">LEGENDARY SUPPLY</div>
                        <div className="text-lg md:text-xl text-[#00FFFF] drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">{mintedCount}/{totalSupply}</div>
                        <div className="text-[0.55rem] text-[#00FFFF]/60">{mintedPercentage}% SEALED</div>
                    </div>
                    <div className="hidden md:flex gap-3">
                        {ONE_OF_ONE_COLLECTION.map((nft) => (
                            <div
                                key={nft.id}
                                className="bg-black/50 border border-[#00FFFF]/20 rounded-lg px-3 py-2 font-mono text-[0.55rem] uppercase tracking-[0.35em] text-[#00FFFF]/70"
                            >
                                {nft.codename}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="bg-black/60 border border-[#00FFFF]/30 rounded-lg px-4 py-3 max-w-sm font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[#00FFFF]/70">
                        <div className="text-[#00FF88]/80">Warplet Access Required</div>
                        <div className="mt-1 text-[#00FFFF]/60">One mint locks rarity metadata forever.</div>
                    </div>
                    <div className="bg-black/65 border border-[#00FFFF]/30 rounded-xl px-4 py-3 font-mono text-[0.55rem] uppercase tracking-[0.3em] text-[#00FFFF]/70 shadow-[0_0_18px_rgba(0,255,255,0.25)]">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[#00FFFF]/80">FARCASTER INTEL</span>
                            <span className="text-[#00FFFF]/50">{formatTimestamp(reportTimestamp)}</span>
                        </div>
                        <div className="mt-2 space-y-1 text-[#00FFFF]/60 max-h-[8.5rem] overflow-hidden">
                            {reportStatus === 'loading' && <div>&gt; compiling warp signals…</div>}
                            {reportStatus === 'error' && <div className="text-[#FF4D8D]">&gt; farcaster feed offline</div>}
                            {reportStatus === 'ready' &&
                                displayedReport.map((line, index) => (
                                    <div key={`report-line-${index}`} className="truncate">
                                        &gt; {line}
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
