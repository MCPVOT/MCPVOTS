'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Animated 3D NFT with sci-fi retro gaming aesthetic
 * Semi-pixelated design with neon glows and VOT branding
 */
function AnimatedNFTObject({ rarity }: { rarity: 'basic' | 'premium' | 'legendary' }) {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);

    // Color schemes by rarity
    const rarityColors = {
        basic: { primary: '#00ff88', secondary: '#00ccff', accent: '#1a472a' },
        premium: { primary: '#ff6b00', secondary: '#ffaa00', accent: '#4a2400' },
        legendary: { primary: '#ff00ff', secondary: '#00ffff', accent: '#4a004a' },
    };

    const colors = rarityColors[rarity];

    useFrame(({ clock }) => {
        if (!groupRef.current) return;

        // Rotation animation
        groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.3;
        groupRef.current.rotation.y = clock.elapsedTime * 0.5;
        groupRef.current.rotation.z = Math.cos(clock.elapsedTime * 0.3) * 0.2;

        // Floating animation
        groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.5;

        // Pulsing effect
        if (meshRef.current) {
            meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * 0.1);
        }
    });

    return (
        <group ref={groupRef}>
            {/* Core geometric shape - octahedron */}
            <mesh ref={meshRef}>
                <octahedronGeometry args={[1, 0]} />
                <meshPhongMaterial
                    color={colors.primary}
                    emissive={colors.primary}
                    emissiveIntensity={0.5}
                    wireframe={false}
                    shininess={100}
                />
            </mesh>

            {/* Wireframe overlay */}
            <mesh>
                <octahedronGeometry args={[1.05, 0]} />
                <meshBasicMaterial
                    color={colors.secondary}
                    wireframe={true}
                    transparent={true}
                    opacity={0.6}
                />
            </mesh>

            {/* Glowing aura particles */}
            <GlowingParticles color={colors.primary} />

            {/* Data stream rings */}
            <DataStreamRings color={colors.secondary} />
        </group>
    );
}

/**
 * Glowing particle effect around the NFT
 */
function GlowingParticles({ color }: { color: string }) {
    const pointsRef = useRef<THREE.Points>(null);

    const particleCount = 100;
    const positions = useMemo(() => {
        const generated = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            const theta = (i / particleCount) * Math.PI * 2;
            const phi = ((i * 13) % particleCount) / particleCount * Math.PI;
            const radius = 2 + ((i * 7) % particleCount) / particleCount;

            generated[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
            generated[i * 3 + 1] = Math.cos(phi) * radius;
            generated[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
        }
        return generated;
    }, [particleCount]);

    useFrame(({ clock }) => {
        if (!pointsRef.current?.geometry) return;
        const positionAttribute = pointsRef.current.geometry.getAttribute('position');

        for (let i = 0; i < particleCount; i++) {
            const angle = clock.elapsedTime + (i / particleCount) * Math.PI * 2;
            const radius = 1 + Math.sin(clock.elapsedTime * 0.5 + i) * 0.5;

            const x = positions[i * 3] + Math.cos(angle) * 0.01 * radius;
            const y = positions[i * 3 + 1] + Math.sin(angle) * 0.01 * radius;
            const z = positions[i * 3 + 2] + Math.cos(angle * 0.5) * 0.01 * radius;

            (positionAttribute.array as Float32Array)[i * 3] = x;
            (positionAttribute.array as Float32Array)[i * 3 + 1] = y;
            (positionAttribute.array as Float32Array)[i * 3 + 2] = z;
        }
        positionAttribute.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.05} color={color} transparent opacity={0.7} sizeAttenuation />
        </points>
    );
}

/**
 * Animated data stream rings
 */
function DataStreamRings({ color }: { color: string }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        groupRef.current.children.forEach((child, i) => {
            child.rotation.z = clock.elapsedTime * (0.5 + i * 0.2);
        });
    });

    return (
        <group ref={groupRef}>
            {[0, 1, 2].map((i) => (
                <mesh key={i} rotation={[Math.PI / 2, 0, i * (Math.PI / 1.5)]}>
                    <torusGeometry args={[1.3 + i * 0.3, 0.1, 16, 32]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.7 - i * 0.15}
                    />
                </mesh>
            ))}
        </group>
    );
}

/**
 * Main NFT Viewer with retro UI
 */
export default function AnimatedNFTViewer({
    tokenId = 0,
    rarity = 'basic' as const,
    size = 300,
}: {
    tokenId?: number;
    rarity?: 'basic' | 'premium' | 'legendary';
    size?: number;
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    const rarityConfig = {
        basic: { name: 'Basic Agent', color: '#00ff88', textColor: 'text-green-400' },
        premium: { name: 'Premium Agent', color: '#ff6b00', textColor: 'text-orange-400' },
        legendary: { name: 'Legendary', color: '#ff00ff', textColor: 'text-pink-400' },
    };

    const config = rarityConfig[rarity];

    return (
        <div
            ref={containerRef}
            className="relative rounded-lg overflow-hidden"
            style={{
                width: size,
                height: size,
                '--nft-color': config.color,
                border: `2px solid var(--nft-color)`,
                boxShadow: `0 0 20px ${config.color}60, inset 0 0 20px ${config.color}20`,
                background: '#000a1a',
            } as React.CSSProperties}
        >
            {/* Canvas container */}
            <Canvas
                camera={{ position: [0, 0, 3], fov: 50 }}
                style={{ background: 'transparent' }}
            >
                {/* Lighting */}
                <ambientLight intensity={0.4} color={config.color} />
                <pointLight position={[5, 5, 5]} intensity={1} color={config.color} />
                <pointLight position={[-5, -5, -5]} intensity={0.6} color="#00ccff" />

                {/* NFT Object */}
                <AnimatedNFTObject rarity={rarity} />

                {/* Controls */}
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={false}
                    maxPolarAngle={Math.PI}
                    minPolarAngle={0}
                />
            </Canvas>

            {/* Retro UI Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Scan lines effect */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.15) 0px,
              rgba(0, 0, 0, 0.15) 1px,
              transparent 1px,
              transparent 2px
            )`,
                        pointerEvents: 'none',
                    }}
                />

                {/* Corner brackets */}
                <div
                    className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2"
                    style={{ borderColor: 'var(--nft-color)' }}
                />
                <div
                    className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2"
                    style={{ borderColor: 'var(--nft-color)' }}
                />
                <div
                    className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2"
                    style={{ borderColor: 'var(--nft-color)' }}
                />
                <div
                    className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2"
                    style={{ borderColor: 'var(--nft-color)' }}
                />
            </div>

            {/* Info Panel */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
                {/* Top Info */}
                <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-opacity-70" style={{ color: 'var(--nft-color)' }}>
                        ERC-1155
                    </div>
                    <div className={`text-sm font-bold font-mono ${config.textColor}`}>
                        #{tokenId + 1}
                    </div>
                </div>

                {/* Center Badge */}
                <div className="text-center">
                    <div
                        className="inline-block px-3 py-1 rounded border font-mono text-xs uppercase tracking-wider font-bold"
                        style={{
                            borderColor: 'var(--nft-color)',
                            color: 'var(--nft-color)',
                            background: `${config.color}15`,
                            boxShadow: `0 0 10px ${config.color}40`,
                        }}
                    >
                        {config.name}
                    </div>
                </div>

                {/* Bottom Info */}
                <div className="text-right">
                    <div className="text-xs font-mono uppercase tracking-wider text-opacity-70" style={{ color: 'var(--nft-color)' }}>
                        MCPVOT
                    </div>
                    <div className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--nft-color)' }}>
                        v2.0
                    </div>
                </div>
            </div>
        </div>
    );
}
