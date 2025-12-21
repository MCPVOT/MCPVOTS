'use client';

import { Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';

interface TelemetryData {
    gasPrice: number;
    tradingVolume: number;
    networkLoad: number;
}

interface NFTHologramProps {
    tokenId: string;
    telemetry?: TelemetryData;
    color?: string;
}

function DataSphere({ telemetry, color = '#00d4ff' }: { telemetry?: TelemetryData; color?: string }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;

        // Rotation animation
        meshRef.current.rotation.y = clock.getElapsedTime() * 0.3;

        // Pulse based on telemetry data
        const pulse = telemetry
            ? 1 + (telemetry.networkLoad / 100) * 0.3
            : 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1;

        meshRef.current.scale.setScalar(pulse);
    });

    return (
        <mesh
            ref={meshRef}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
        >
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
                color={hovered ? '#00ff41' : color}
                emissive={color}
                emissiveIntensity={hovered ? 1 : 0.5}
                wireframe
                transparent
                opacity={0.8}
            />
        </mesh>
    );
}

function OrbitingParticles({ count = 50, color = '#00d4ff' }: { count?: number; color?: string }) {
    const particlesRef = useRef<THREE.Points>(null);

    const positions = useState(() => {
        const posArray = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = 2 + Math.random() * 0.5;
            posArray[i * 3] = Math.cos(angle) * radius;
            posArray[i * 3 + 1] = (Math.random() - 0.5) * 2;
            posArray[i * 3 + 2] = Math.sin(angle) * radius;
        }
        return posArray;
    })[0];

    useFrame(({ clock }) => {
        if (!particlesRef.current) return;
        particlesRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial size={0.05} color={color} transparent opacity={0.6} />
        </points>
    );
}

function DataBars({ telemetry }: { telemetry?: TelemetryData }) {
    if (!telemetry) return null;

    const bars: Array<{ value: number; position: [number, number, number]; color: string }> = [
        { value: telemetry.gasPrice / 100, position: [-2, 0, 0], color: '#00ff41' },
        { value: telemetry.tradingVolume / 100000, position: [0, 0, 0], color: '#00d4ff' },
        { value: telemetry.networkLoad / 100, position: [2, 0, 0], color: '#ff8c00' },
    ];

    return (
        <group position={[0, -2, 0]}>
            {bars.map((bar, i) => (
                <Float key={i} speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                    <mesh position={bar.position}>
                        <boxGeometry args={[0.4, bar.value * 2, 0.4]} />
                        <meshStandardMaterial
                            color={bar.color}
                            emissive={bar.color}
                            emissiveIntensity={0.5}
                            transparent
                            opacity={0.7}
                        />
                    </mesh>
                </Float>
            ))}
        </group>
    );
}

export default function NFTHologram({ telemetry, color = '#00d4ff' }: NFTHologramProps) {
    return (
        <group position={[0, 0, 0]}>
            {/* Central data sphere */}
            <DataSphere telemetry={telemetry} color={color} />

            {/* Orbiting particles */}
            <OrbitingParticles count={100} color={color} />

            {/* Data bars */}
            <DataBars telemetry={telemetry} />

            {/* Ambient lighting */}
            <pointLight position={[0, 0, 0]} intensity={0.5} color={color} />
            <ambientLight intensity={0.2} />
        </group>
    );
}
