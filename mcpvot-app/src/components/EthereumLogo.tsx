'use client';

import { Float } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function EthereumGeometry() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <mesh ref={meshRef}>
                {/* Simple Ethereum-inspired geometry */}
                <octahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                    color="#627EEA"
                    emissive="#627EEA"
                    emissiveIntensity={0.2}
                    transparent
                    opacity={0.8}
                />
            </mesh>
            {/* Inner glow */}
            <mesh scale={0.8}>
                <octahedronGeometry args={[1, 0]} />
                <meshBasicMaterial
                    color="#627EEA"
                    transparent
                    opacity={0.3}
                />
            </mesh>
        </Float>
    );
}

interface EthereumLogoProps {
    size?: number;
    className?: string;
}

export default function EthereumLogo({ size = 64, className = "" }: EthereumLogoProps) {
    return (
        <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
            <Canvas
                camera={{ position: [0, 0, 3], fov: 50 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.5} />
                <pointLight position={[2, 2, 2]} intensity={1} color="#627EEA" />
                <EthereumGeometry />
            </Canvas>
        </div>
    );
}
