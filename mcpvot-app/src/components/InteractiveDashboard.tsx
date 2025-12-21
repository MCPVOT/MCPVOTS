'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// Interactive holographic data orbs
function HolographicOrbs() {
    const groupRef = useRef<THREE.Group>(null);
    const [orbs] = useState(() =>
        Array.from({ length: 6 }, (_, i) => ({ // Increased to 6 for better distribution
            id: i,
            position: [
                (Math.cos(i * Math.PI / 3) * 6), // Better circular distribution
                Math.sin(i * 0.5) * 2 - 0.5,
                -Math.sin(i * Math.PI / 3) * 6
            ] as [number, number, number],
            color: ['#00ffcc', '#60a5fa', '#fb923c', '#a855f7', '#ef4444', '#10b981'][i], // Added green
            speed: 0.3 + Math.random() * 0.4,
            scale: 0.25 + Math.random() * 0.3,
        }))
    );

    useFrame((state) => {
        if (!groupRef.current) return;
        groupRef.current.children.forEach((child, i) => {
            const orb = child as THREE.Mesh;
            orb.position.y += Math.sin(state.clock.elapsedTime * orbs[i].speed + i) * 0.005;
            orb.rotation.x += 0.01;
            orb.rotation.y += 0.015;

            // Pulse effect
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.2;
            orb.scale.setScalar(orbs[i].scale * pulse);
        });
    });

    return (
        <group ref={groupRef}>
            {orbs.map((orb) => (
                <mesh key={orb.id} position={orb.position}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshBasicMaterial
                        color={orb.color}
                        transparent
                        opacity={0.7}
                        wireframe
                    />
                    <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[0.8, 12, 12]} />
                        <meshBasicMaterial
                            color={orb.color}
                            transparent
                            opacity={0.3}
                            blending={THREE.AdditiveBlending}
                        />
                    </mesh>
                </mesh>
            ))}
        </group>
    );
}

// Cyberpunk data streams
function DataStreams() {
    const groupRef = useRef<THREE.Group>(null);
    const [streams] = useState(() =>
        Array.from({ length: 10 }, (_, i) => ({ // Increased to 10 for better coverage
            id: i,
            position: [
                (Math.cos(i * Math.PI / 5) * 5), // Circular distribution
                Math.sin(i * 0.3) * 1.5 - 0.5,
                -Math.sin(i * Math.PI / 5) * 12 // Further back for depth
            ] as [number, number, number],
            color: i % 2 === 0 ? '#00ffcc' : '#60a5fa',
        }))
    );

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        groupRef.current.children.forEach((child) => {
            const stream = child as THREE.Mesh;
            stream.position.z += delta * 2;
            if (stream.position.z > 3) {
                stream.position.z = -15;
            }
        });
    });

    return (
        <group ref={groupRef}>
            {streams.map((stream) => (
                <mesh key={stream.id} position={stream.position}>
                    <planeGeometry args={[0.05, 2]} />
                    <meshBasicMaterial
                        color={stream.color}
                        transparent
                        opacity={0.8}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ))}
        </group>
    );
}

// Interactive grid floor
function CyberGrid({ onGridClick }: { onGridClick?: () => void }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            const material = meshRef.current.material as THREE.ShaderMaterial;
            material.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    const material = useMemo(() => {
        const shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                varying vec2 vUv;
                varying vec3 vPosition;

                float grid(vec2 uv, float scale) {
                    vec2 grid = fract(uv * scale);
                    float line = min(
                        smoothstep(0.0, 0.02, grid.x),
                        smoothstep(0.0, 0.02, grid.y)
                    );
                    line += min(
                        smoothstep(0.98, 1.0, grid.x),
                        smoothstep(0.98, 1.0, grid.y)
                    );
                    return line;
                }

                void main() {
                    vec2 uv = vUv;
                    float gridPattern = grid(uv, 12.0); // Increased density for better mobile visibility

                    // Mouse interaction
                    float mouseDist = distance(uv, uMouse + 0.5);
                    float mouseEffect = smoothstep(0.3, 0.0, mouseDist);

                    // Animated waves
                    float wave = sin(uv.x * 20.0 + uTime * 2.0) * 0.5 + 0.5;
                    wave *= sin(uv.y * 15.0 + uTime * 1.5) * 0.5 + 0.5;

                    vec3 color = mix(
                        vec3(0.0, 0.05, 0.1),
                        vec3(0.0, 0.8, 0.6),
                        gridPattern * (0.5 + wave * 0.3 + mouseEffect * 0.5)
                    );

                    gl_FragColor = vec4(color, 0.8);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
        });
        return shaderMaterial;
    }, []);

    return (
        <mesh
            ref={meshRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -2, 0]}
            onClick={onGridClick}
        >
            <planeGeometry args={[25, 25, 32, 32]} /> {/* Increased size for better coverage */}
            <primitive object={material} />
        </mesh>
    );
}

// Floating UI panels
function FloatingPanels() {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!groupRef.current) return;
        groupRef.current.children.forEach((child, i) => {
            const panel = child as THREE.Mesh;
            panel.position.y += Math.sin(state.clock.elapsedTime * 0.5 + i * Math.PI / 3) * 0.001; // Slower, more subtle movement
            panel.rotation.z = Math.sin(state.clock.elapsedTime * 0.3 + i * Math.PI / 3) * 0.02;
        });
    });

    return (
        <group ref={groupRef}>
            {Array.from({ length: 4 }).map((_, i) => ( // Increased to 4 panels
                <mesh key={i} position={[
                    (i % 2 === 0 ? -1 : 1) * (3 + i * 0.5), // Better spacing
                    0.5 + i * 0.3,
                    -6 - i * 1.5
                ]}>
                    <planeGeometry args={[1.8, 1.0]} />
                    <meshBasicMaterial
                        color="#00ffcc"
                        transparent
                        opacity={0.15}
                        side={THREE.DoubleSide}
                    />
                    <lineSegments>
                        <edgesGeometry args={[new THREE.PlaneGeometry(1.8, 1.0)]} />
                        <lineBasicMaterial color="#00ffcc" transparent opacity={0.6} />
                    </lineSegments>
                </mesh>
            ))}
        </group>
    );
}

interface InteractiveDashboardProps {
    onGridClick?: () => void;
    showParticles?: boolean;
}

export default function InteractiveDashboard({
    onGridClick,
    showParticles = true
}: InteractiveDashboardProps) {
    return (
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
            <Canvas
                camera={{ position: [0, 2, 6], fov: 60 }}
                gl={{ antialias: true, alpha: true }}
                style={{
                    background: 'transparent',
                    width: '100%',
                    height: '100%'
                }}
            >
                <ambientLight intensity={0.3} />
                <directionalLight position={[2, 4, 2]} intensity={0.8} color="#00ffcc" />
                <pointLight position={[0, 5, -5]} intensity={0.6} color="#60a5fa" />
                <pointLight position={[-3, 3, -3]} intensity={0.4} color="#fb923c" />

                <CyberGrid onGridClick={onGridClick} />
                <HolographicOrbs />
                <DataStreams />
                <FloatingPanels />

                {showParticles && (
                    <>
                        {/* Import and use existing particle systems */}
                        <mesh position={[0, 0, -10]}>
                            <sphereGeometry args={[0.1, 8, 8]} />
                            <meshBasicMaterial color="#00ffcc" transparent opacity={0.6} />
                        </mesh>
                    </>
                )}
            </Canvas>
        </div>
    );
}
