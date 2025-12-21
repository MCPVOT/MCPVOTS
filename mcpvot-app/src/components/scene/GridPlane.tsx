'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface GridPlaneProps {
    size?: number;
    divisions?: number;
    color?: string;
    opacity?: number;
    animated?: boolean;
}

export default function GridPlane({
    size = 50,
    divisions = 50,
    color = '#00d4ff',
    opacity = 0.15,
    animated = true,
}: GridPlaneProps) {
    const gridRef = useRef<THREE.GridHelper>(null);

    useFrame(({ clock }) => {
        if (!gridRef.current || !animated) return;

        // Subtle pulse animation
        const pulse = Math.sin(clock.getElapsedTime() * 0.5) * 0.1 + 0.9;
        gridRef.current.material.opacity = opacity * pulse;
    });

    return (
        <>
            {/* Main grid */}
            <gridHelper
                ref={gridRef}
                args={[size, divisions, color, color]}
                position={[0, -5, 0]}
            />

            {/* Fog effect for depth */}
            <fog attach="fog" args={['#0a0a0f', 10, 50]} />
        </>
    );
}
