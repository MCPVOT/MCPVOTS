'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

interface HolographicGridProps {
    size?: number;
    divisions?: number;
    colors?: { primary: string; secondary: string };
    animated?: boolean;
    transparency?: number;
}

/**
 * HolographicGrid - Retro tech grid with neon glow
 * Dark theme with high contrast neon lines
 */
export default function HolographicGrid({
    size = 30,
    divisions = 30,
    colors = { primary: '#00d4ff', secondary: '#ff8c00' },
    animated = true,
    transparency = 0.6,
}: HolographicGridProps) {
    const gridRef = useRef<THREE.LineSegments>(null);
    const materialRef = useRef<THREE.LineBasicMaterial>(null);

    const gridGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const vertices: number[] = [];

        const step = size / divisions;
        const halfSize = size / 2;

        // Create grid lines
        for (let i = 0; i <= divisions; i++) {
            const pos = -halfSize + i * step;

            // X-direction lines
            vertices.push(-halfSize, 0, pos, halfSize, 0, pos);

            // Z-direction lines
            vertices.push(pos, 0, -halfSize, pos, 0, halfSize);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        return geometry;
    }, [size, divisions]);

    useFrame(({ clock }) => {
        if (!animated || !materialRef.current) return;

        // Pulse effect
        const pulse = Math.sin(clock.getElapsedTime() * 0.5) * 0.2 + 0.8;
        materialRef.current.opacity = transparency * pulse;
    });

    return (
        <group position={[0, -3, 0]} rotation={[0, 0, 0]}>
            <lineSegments ref={gridRef} geometry={gridGeometry}>
                <lineBasicMaterial
                    ref={materialRef}
                    color={colors.primary}
                    transparent
                    opacity={transparency}
                    blending={THREE.AdditiveBlending}
                />
            </lineSegments>

            {/* Accent lines in secondary color */}
            <lineSegments geometry={gridGeometry}>
                <lineBasicMaterial
                    color={colors.secondary}
                    transparent
                    opacity={transparency * 0.3}
                    blending={THREE.AdditiveBlending}
                />
            </lineSegments>

            {/* Atmospheric fog */}
            <fog attach="fog" args={['#0a0a0f', 5, 40]} />
        </group>
    );
}
