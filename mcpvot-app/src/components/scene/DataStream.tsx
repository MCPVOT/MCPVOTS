'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface DataStreamProps {
    count?: number;
    speed?: number;
    colors?: string[];
}

/**
 * DataStream - Retro data visualization with flowing particles
 * Represents real-time data flowing through the system
 */
export default function DataStream({
    count = 50,
    speed = 1.0,
    colors = ['#00ff41', '#ff8c00', '#00d4ff'],
}: DataStreamProps) {
    const meshRef = useRef<THREE.Points>(null);
    const velocitiesRef = useRef<Float32Array | null>(null);

    // Initialize particle system
    useEffect(() => {
        if (!meshRef.current) return;

        const geometry = meshRef.current.geometry as THREE.BufferGeometry;
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const particleColors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Position particles in a stream pattern
            const angle = (i / count) * Math.PI * 4;
            const radius = 3 + (i % 3) * 0.5;

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            // Velocity for flowing animation
            velocities[i * 3] = (Math.random() - 0.5) * 0.5;
            velocities[i * 3 + 1] = 0.5 + Math.random() * 0.5;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

            // Assign colors from palette
            const colorIndex = i % colors.length;
            const color = new THREE.Color(colors[colorIndex]);
            particleColors[i * 3] = color.r;
            particleColors[i * 3 + 1] = color.g;
            particleColors[i * 3 + 2] = color.b;

            // Size variation
            sizes[i] = 0.05 + Math.random() * 0.1;
        }

        // Set geometry attributes
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Store velocities in ref
        velocitiesRef.current = velocities;
    }, [count, colors]);

    // Animate particles in flowing pattern
    useFrame((state, delta) => {
        if (!meshRef.current || !velocitiesRef.current) return;

        const geometry = meshRef.current.geometry;
        const positions = geometry.attributes.position;
        const velocities = velocitiesRef.current;

        if (!positions) return;

        const positionsArray = positions.array as Float32Array;

        for (let i = 0; i < count; i++) {
            // Flow particles upward in streams
            positionsArray[i * 3] += velocities[i * 3] * speed * delta;
            positionsArray[i * 3 + 1] += velocities[i * 3 + 1] * speed * delta * 2;
            positionsArray[i * 3 + 2] += velocities[i * 3 + 2] * speed * delta;

            // Wrap around when particles go too high
            if (positionsArray[i * 3 + 1] > 5) {
                positionsArray[i * 3 + 1] = -5;
            }

            // Keep particles in bounds
            if (Math.abs(positionsArray[i * 3]) > 10) {
                positionsArray[i * 3] *= 0.9;
            }
            if (Math.abs(positionsArray[i * 3 + 2]) > 10) {
                positionsArray[i * 3 + 2] *= 0.9;
            }
        }

        positions.needsUpdate = true;
    });

    return (
        <points ref={meshRef}>
            <pointsMaterial
                size={0.1}
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}
