'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';

interface VOTLogoProps {
    size?: number;
    color?: string;
    animated?: boolean;
}

/**
 * VOTLogo - Animated 3D VOT token logo using React Three Fiber
 * Features glowing effects, rotation, and cyberpunk styling
 */
export default function VOTLogo({
    size = 1,
    color = '#00ff41',
    animated = true
}: VOTLogoProps) {
    const groupRef = useRef<THREE.Group>(null);
    const textRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const particlesRef = useRef<THREE.Points>(null);
    const ringRefs = useRef<(THREE.Mesh | null)[]>([]);

    // Set ring refs
    const setRingRef = (index: number) => (ref: THREE.Mesh | null) => {
        ringRefs.current[index] = ref;
    };

    // Particle system for background effect
    const [particles] = useState(() => {
        const count = 100;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            // Create particles in a sphere around the logo
            const radius = 2 + Math.random() * 1;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Cyberpunk colors
            const colorOptions = ['#00ff41', '#ff8c00', '#00d4ff', '#ff0080'];
            const selectedColor = new THREE.Color(colorOptions[Math.floor(Math.random() * colorOptions.length)]);
            colors[i * 3] = selectedColor.r;
            colors[i * 3 + 1] = selectedColor.g;
            colors[i * 3 + 2] = selectedColor.b;
        }

        return { positions, colors };
    });

    useFrame(({ clock }) => {
        if (!animated) return;

        const time = clock.getElapsedTime();

        // Rotate the entire logo group
        if (groupRef.current) {
            groupRef.current.rotation.y = time * 0.5;
            groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
        }

        // Pulse the main text
        if (textRef.current) {
            const pulse = 1 + Math.sin(time * 3) * 0.1;
            textRef.current.scale.setScalar(pulse);
        }

        // Glow effect
        if (glowRef.current) {
            const glowIntensity = 0.3 + Math.sin(time * 2) * 0.2;
            (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glowIntensity;
        }

        // Rotate particles
        if (particlesRef.current) {
            particlesRef.current.rotation.y = time * 0.2;
            particlesRef.current.rotation.x = time * 0.1;
        }

        // Animate orbital rings
        ringRefs.current.forEach((ring, i) => {
            if (ring) {
                ring.rotation.z = time * (0.3 + i * 0.1);
            }
        });
    });

    return (
        <group ref={groupRef} scale={size}>
            {/* Background particle field */}
            <points ref={particlesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[particles.positions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        args={[particles.colors, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.02}
                    vertexColors
                    transparent
                    opacity={0.6}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Main VOT text - using a simple box as placeholder for 3D text */}
            <mesh ref={textRef} position={[0, 0, 0]}>
                <boxGeometry args={[1.5, 0.3, 0.1]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.2}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Glowing aura */}
            <mesh ref={glowRef} position={[0, 0, 0]}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.3}
                    side={THREE.BackSide}
                />
            </mesh>

            {/* Orbital rings */}
            {[1.2, 1.5, 1.8].map((radius, i) => (
                <mesh key={i} ref={setRingRef(i)} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[radius, 0.02, 8, 32]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={0.1}
                        transparent
                        opacity={0.7 - i * 0.2}
                    />
                </mesh>
            ))}

            {/* Point lights for dramatic effect */}
            <pointLight position={[2, 2, 2]} intensity={0.5} color={color} />
            <pointLight position={[-2, -2, -2]} intensity={0.3} color="#ff8c00" />
        </group>
    );
}
