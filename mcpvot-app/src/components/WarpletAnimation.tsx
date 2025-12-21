'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// Create particle data once
function createParticleData(count: number) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const theta = Math.random() * Math.PI * 2;
        const radius = 1 + Math.random() * 4;

        positions[i3] = Math.cos(theta) * radius;
        positions[i3 + 1] = (Math.random() - 0.5) * 3;
        positions[i3 + 2] = Math.sin(theta) * radius;

        const color = new THREE.Color().setHSL(0.5 + Math.random() * 0.2, 1, 0.6);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }

    return { positions, colors };
}

// Create energy beam particles shooting outward
function createEnergyBeams(count: number) {
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3] = 0;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = 0;

        const theta = (i / count) * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        velocities.push(
            new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.sin(phi) * Math.sin(theta),
                Math.cos(phi)
            ).multiplyScalar(0.1)
        );
    }

    return { positions, velocities };
}

// Create stable ambient particles
function createStableParticles(count: number) {
    return new Float32Array(Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * 8));
}

// Animated WARPLET Portal Effect
function WarpletPortal({ phase }: { phase: 'materialize' | 'stable' | 'dematerialize' }) {
    const portalRef = useRef<THREE.Mesh>(null);
    const particlesRef = useRef<THREE.Points>(null);
    const ringsRef = useRef<THREE.Group>(null);
    const beamsRef = useRef<THREE.Points>(null);
    const dnaHelixRef = useRef<THREE.Group>(null);

    const particleCount = 3000;
    const beamCount = 500;

    // Particle positions - memoized to prevent re-generation
    const { positions: particlePositions, colors: particleColors } = useMemo(
        () => createParticleData(particleCount),
        [particleCount]
    );

    const { positions: beamPositions, velocities: beamVelocities } = useMemo(
        () => createEnergyBeams(beamCount),
        [beamCount]
    );

    const stableParticlePositions = useMemo(() => createStableParticles(100), []);

    useFrame((state) => {
        const time = state.clock.elapsedTime;

        // Portal expansion and quantum flux
        if (portalRef.current) {
            // Smooth expansion: 0 → 1.2 → 1.0
            let scale = 1;
            if (phase === 'materialize') {
                scale = Math.min(1.2, time * 0.6);
            } else if (phase === 'stable') {
                scale = 1 + Math.sin(time * 2) * 0.05; // Gentle pulsing
            } else {
                scale = Math.max(0, 1 - (time - 5) * 0.8); // Shrink
            }
            portalRef.current.scale.setScalar(scale);
            portalRef.current.rotation.z = time * 0.5;
            portalRef.current.rotation.x = Math.sin(time * 0.3) * 0.2;
        }

        // Animate particles spiraling inward
        if (particlesRef.current) {
            const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const theta = (i / particleCount) * Math.PI * 2 + time;
                const radius = 1 + Math.sin(time + i * 0.1) * 2;

                positions[i3] = Math.cos(theta) * radius;
                positions[i3 + 1] = Math.sin(time * 2 + i * 0.05) * 2;
                positions[i3 + 2] = Math.sin(theta) * radius;
            }

            particlesRef.current.geometry.attributes.position.needsUpdate = true;
            particlesRef.current.rotation.y = time * 0.2;
        }

        // Rotate energy rings
        if (ringsRef.current) {
            ringsRef.current.rotation.x = time * 0.3;
            ringsRef.current.rotation.y = time * 0.5;
        }

        // Energy beams shooting outward during stable phase
        if (beamsRef.current && phase === 'stable') {
            const positions = beamsRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < beamCount; i++) {
                const i3 = i * 3;
                const velocity = beamVelocities[i];
                positions[i3] += velocity.x;
                positions[i3 + 1] += velocity.y;
                positions[i3 + 2] += velocity.z;

                // Reset if too far
                const dist = Math.sqrt(positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2);
                if (dist > 8) {
                    positions[i3] = 0;
                    positions[i3 + 1] = 0;
                    positions[i3 + 2] = 0;
                }
            }
            beamsRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // DNA Helix rotation
        if (dnaHelixRef.current) {
            dnaHelixRef.current.rotation.y = time * 0.8;
            dnaHelixRef.current.rotation.z = Math.sin(time * 0.5) * 0.3;
        }
    });

    return (
        <>
            {/* Main Portal Torus */}
            <mesh ref={portalRef} position={[0, 0, 0]}>
                <torusGeometry args={[3, 0.3, 32, 100]} />
                <meshStandardMaterial
                    color="#00FFFF"
                    emissive="#00FFFF"
                    emissiveIntensity={2}
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Spiraling Particles */}
            <points ref={particlesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particleCount}
                        array={particlePositions}
                        itemSize={3}
                        args={[particlePositions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={particleCount}
                        array={particleColors}
                        itemSize={3}
                        args={[particleColors, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.05}
                    vertexColors
                    transparent
                    opacity={0.8}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Energy Rings */}
            <group ref={ringsRef}>
                {[1.5, 2.5, 3.5, 4.5].map((radius, i) => (
                    <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[radius, radius + 0.08, 64]} />
                        <meshBasicMaterial
                            color={i === 0 ? '#FF8800' : i === 1 ? '#00FFFF' : i === 2 ? '#FFD700' : '#FF6600'}
                            transparent
                            opacity={0.4}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                ))}
            </group>

            {/* Energy Beams shooting outward */}
            <points ref={beamsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={beamCount}
                        array={beamPositions}
                        itemSize={3}
                        args={[beamPositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.15}
                    color="#FFD700"
                    transparent
                    opacity={0.9}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* DNA Helix structure */}
            <group ref={dnaHelixRef}>
                {Array.from({ length: 40 }).map((_, i) => {
                    const t = (i / 40) * Math.PI * 4;
                    const radius = 1.5;
                    return (
                        <mesh
                            key={i}
                            position={[
                                Math.cos(t) * radius,
                                (i / 40) * 6 - 3,
                                Math.sin(t) * radius
                            ]}
                        >
                            <sphereGeometry args={[0.08, 16, 16]} />
                            <meshStandardMaterial
                                color={i % 2 === 0 ? '#00FFFF' : '#FF8800'}
                                emissive={i % 2 === 0 ? '#00FFFF' : '#FF8800'}
                                emissiveIntensity={1.5}
                            />
                        </mesh>
                    );
                })}
            </group>

            {/* Dimensional rift particles */}
            {phase === 'stable' && (
                <points position={[0, 0, 0]}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={100}
                            array={stableParticlePositions}
                            itemSize={3}
                            args={[stableParticlePositions, 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        size={0.2}
                        color="#FFFFFF"
                        transparent
                        opacity={0.6}
                        blending={THREE.AdditiveBlending}
                    />
                </points>
            )}

            {/* Enhanced Lighting */}
            <pointLight position={[0, 0, 5]} intensity={3} color="#00FFFF" />
            <pointLight position={[0, 0, -5]} intensity={2} color="#FF8800" />
            <pointLight position={[5, 0, 0]} intensity={1.5} color="#FFD700" />
            <pointLight position={[-5, 0, 0]} intensity={1.5} color="#FF6600" />
            <ambientLight intensity={0.5} />
            <hemisphereLight intensity={0.3} color="#00FFFF" groundColor="#FF8800" />
        </>
    );
}

interface WarpletAnimationProps {
    onComplete: () => void;
    fid?: number;
    username?: string;
    walletAddress?: string;
}

export default function WarpletAnimation({ onComplete, fid, username, walletAddress }: WarpletAnimationProps) {
    const [phase, setPhase] = useState<'materialize' | 'stable' | 'dematerialize'>('materialize');
    const [glyphIndex, setGlyphIndex] = useState(0);

    const ANCIENT_GLYPHS = fid ? [
        `⟡ FID ${fid} DETECTED ⟡`,
        `𒀀 𒀁 𒀂 INITIALIZING WARPLET MATRIX`,
        `א ב ג LOADING DIMENSIONAL GATEWAY FOR @${username || 'AGENT'}`,
        `ⵣ ⵥ ⵦ CALIBRATING NEURAL SUBSTRATE`,
        `δ ε ζ ESTABLISHING QUANTUM LINK`,
        walletAddress ? `🔐 WALLET ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} VERIFIED` : '🔐 VERIFYING CREDENTIALS',
        `𒈓 𒀭 ΩARPLET NEXUS ONLINE`,
    ] : [
        '𒀀 𒀁 𒀂 INITIALIZING WARPLET MATRIX',
        'א ב ג LOADING DIMENSIONAL GATEWAY',
        'ⵣ ⵥ ⵦ CALIBRATING NEURAL SUBSTRATE',
        'δ ε ζ ESTABLISHING QUANTUM LINK',
        '𒈓 𒀭 ΩARPLET ONLINE',
    ];

    useEffect(() => {
        // Materialize phase: 2s (portal expands)
        const materializeTimer = setTimeout(() => {
            setPhase('stable');
        }, 2000);

        // Stable phase: 4s (EPIC effects + FID display)
        const stableTimer = setTimeout(() => {
            setPhase('dematerialize');
        }, 6000);

        // Dematerialize phase: 2s graceful fade then complete
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 8000);

        return () => {
            clearTimeout(materializeTimer);
            clearTimeout(stableTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    // Cycle ancient glyphs during stable phase
    useEffect(() => {
        if (phase !== 'stable') return;

        const glyphTimer = setInterval(() => {
            setGlyphIndex(prev => (prev + 1) % ANCIENT_GLYPHS.length);
        }, 600);

        return () => clearInterval(glyphTimer);
    }, [phase, ANCIENT_GLYPHS.length]);

    return (
        <div className={`fixed inset-0 z-50 bg-black transition-opacity duration-2000 ${phase === 'dematerialize' ? 'opacity-0' : 'opacity-100'
            }`}>
            {/* 3D WARPLET Portal */}
            <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
                <WarpletPortal phase={phase} />
            </Canvas>

            {/* Overlay Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* Top: WARPLET Title */}
                <div className={`transition-all duration-1000 ${phase === 'materialize' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                    }`}>
                    <h1 className="font-mono text-6xl md:text-8xl font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] via-[#FF8800] to-[#FFD700] animate-pulse">
                        Ω-A WARPLET
                    </h1>
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className="w-3 h-3 rounded-full bg-[#00FF88] animate-pulse shadow-[0_0_20px_rgba(0,255,136,0.8)]"></div>
                        <span className="font-mono text-sm text-[#00FFFF] uppercase tracking-[0.3em]">
                            EPIC 1/1 INTELLIGENCE TERMINAL
                        </span>
                    </div>
                </div>

                {/* Center: Holographic HUD with FID Data */}
                {fid && phase === 'stable' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative animate-fade-in">
                            {/* HUD Frame */}
                            <div className="relative border-2 border-[#00FFFF]/60 bg-black/40 backdrop-blur-lg p-8 rounded-xl shadow-[0_0_60px_rgba(0,255,255,0.6)]">
                                {/* FID Badge */}
                                <div className="text-center mb-4">
                                    <div className="inline-block px-6 py-2 bg-gradient-to-r from-[#00FFFF]/20 to-[#FF8800]/20 border border-[#00FFFF]/50 rounded-full">
                                        <span className="font-mono text-2xl font-bold text-[#00FFFF] tracking-wider">
                                            FID: {fid}
                                        </span>
                                    </div>
                                </div>

                                {/* User Info */}
                                {username && (
                                    <div className="text-center mb-3">
                                        <span className="font-mono text-lg text-[#FF8800] tracking-wide">
                                            @{username}
                                        </span>
                                    </div>
                                )}

                                {/* Wallet Address */}
                                {walletAddress && (
                                    <div className="text-center">
                                        <span className="font-mono text-sm text-[#FFD700] tracking-wider">
                                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                        </span>
                                    </div>
                                )}

                                {/* Data streams */}
                                <div className="mt-4 pt-4 border-t border-[#00FFFF]/30 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-xs text-[#00FF88]/70 mb-1">STATUS</div>
                                        <div className="font-mono text-sm text-[#00FF88]">VERIFIED</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#00FFFF]/70 mb-1">TIER</div>
                                        <div className="font-mono text-sm text-[#00FFFF]">EPIC 1/1</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#FF8800]/70 mb-1">ACCESS</div>
                                        <div className="font-mono text-sm text-[#FF8800]">GRANTED</div>
                                    </div>
                                </div>
                            </div>

                            {/* Corner accents */}
                            <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-[#00FFFF] animate-pulse"></div>
                            <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-[#FF8800] animate-pulse"></div>
                            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 border-[#FFD700] animate-pulse"></div>
                            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-[#00FFFF] animate-pulse"></div>
                        </div>
                    </div>
                )}

                {/* Bottom: Ancient Glyph Status */}
                <div className={`absolute bottom-20 transition-all duration-500 ${phase === 'stable' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <div className="px-8 py-4 border-2 border-[#00FFFF]/40 bg-black/60 backdrop-blur-sm rounded-lg">
                        <div className="font-mono text-lg text-[#00FF88] flex items-center gap-3">
                            <span className="text-2xl animate-pulse">⟡</span>
                            <span className="tracking-wide">{ANCIENT_GLYPHS[glyphIndex]}</span>
                            <span className="text-2xl animate-pulse">⟡</span>
                        </div>
                    </div>
                </div>

                {/* Scan lines overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                    <div className="absolute w-full h-px bg-[#00FFFF] animate-scan"></div>
                </div>

                {/* Corner brackets */}
                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner, i) => (
                    <div
                        key={corner}
                        className={`absolute ${corner.includes('top') ? 'top-8' : 'bottom-8'} ${corner.includes('left') ? 'left-8' : 'right-8'
                            } w-12 h-12 border-2 border-[#00FFFF]/60 ${corner === 'top-left' ? 'border-r-0 border-b-0' :
                                corner === 'top-right' ? 'border-l-0 border-b-0' :
                                    corner === 'bottom-left' ? 'border-r-0 border-t-0' :
                                        'border-l-0 border-t-0'
                            } animate-pulse`}
                        style={{ animationDelay: `${i * 0.2}s` }}
                    />
                ))}
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { top: 0%; }
                    100% { top: 100%; }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
            `}</style>
        </div>
    );
}
