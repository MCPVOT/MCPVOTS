'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// CRT Monitor Screen Effect - Main terminal display
function CRTMonitor() {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    const material = useMemo(() => {
        const shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(1920, 1080) },
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
                uniform vec2 uResolution;
                varying vec2 vUv;
                varying vec3 vPosition;

                // Classic CRT scanlines
                float scanline(vec2 uv, float time) {
                    float scan = sin(uv.y * 800.0 - time * 120.0) * 0.5 + 0.5;
                    return smoothstep(0.8, 1.0, scan) * 0.15;
                }

                // Horizontal sync lines (like old TVs)
                float hsync(vec2 uv, float time) {
                    float h = sin(uv.x * 400.0 + time * 60.0) * 0.5 + 0.5;
                    return smoothstep(0.95, 1.0, h) * 0.08;
                }

                // Pixel grid effect
                float pixelGrid(vec2 uv) {
                    vec2 pixelated = floor(uv * vec2(320.0, 240.0)) / vec2(320.0, 240.0);
                    float grid = length(uv - pixelated) * 1000.0;
                    return smoothstep(0.0, 1.0, grid) * 0.05;
                }

                // Terminal text simulation
                float terminalText(vec2 uv, float time) {
                    float text = 0.0;

                    // Simulate scrolling terminal lines
                    for (float i = 0.0; i < 8.0; i++) {
                        float lineY = fract(uv.y * 12.0 - time * 0.2 - i * 0.1);
                        float line = smoothstep(0.02, 0.0, abs(lineY - 0.5)) * 0.8;

                        // Add some "characters" with varying brightness
                        float chars = sin(uv.x * 50.0 + i * 2.0) * sin(uv.x * 30.0 + time * 3.0 + i);
                        chars = smoothstep(-0.3, 0.3, chars);

                        text += line * chars * 0.3;
                    }

                    return text;
                }

                // VHS-style color bleeding
                vec3 colorBleed(vec3 color, vec2 uv) {
                    float bleed = sin(uv.x * 200.0 + uTime * 50.0) * 0.01;
                    color.r += bleed;
                    color.b -= bleed * 0.5;
                    return color;
                }

                // Screen curvature effect
                vec2 screenCurve(vec2 uv) {
                    uv = uv * 2.0 - 1.0;
                    float curve = dot(uv, uv) * 0.05;
                    uv *= 1.0 + curve;
                    return uv * 0.5 + 0.5;
                }

                void main() {
                    vec2 uv = vUv;
                    uv = screenCurve(uv);

                    // Base dark terminal background
                    vec3 color = vec3(0.02, 0.05, 0.08);

                    // Add terminal text effect
                    float text = terminalText(uv, uTime);
                    color += vec3(0.0, 0.8, 0.4) * text;

                    // Add scanlines
                    float scan = scanline(uv, uTime);
                    color += vec3(0.0, 0.3, 0.1) * scan;

                    // Add horizontal sync
                    float hsync_effect = hsync(uv, uTime);
                    color += vec3(0.1, 0.0, 0.2) * hsync_effect;

                    // Add pixel grid
                    float grid = pixelGrid(uv);
                    color += vec3(0.0, 0.2, 0.0) * grid;

                    // Add subtle flicker
                    float flicker = sin(uTime * 60.0) * 0.02 + 0.98;
                    color *= flicker;

                    // Color bleeding effect
                    color = colorBleed(color, uv);

                    // Vignette effect
                    float vignette = 1.0 - length(uv - 0.5) * 0.5;
                    color *= vignette;

                    gl_FragColor = vec4(color, 0.92);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
        });
        return shaderMaterial;
    }, []);

    return (
        <mesh position={[0, 0, -2]} rotation={[0, 0, 0]}>
            <planeGeometry args={[16, 10]} />
            <primitive object={material} ref={materialRef} />
        </mesh>
    );
}

// Terminal Border Frame - Like old CRT monitor bezel (OPTIMIZED)
function TerminalFrame() {
    return (
        <group>
            {/* Main frame - REDUCED segments from 32 to 16 */}
            <mesh position={[0, 0, -1.8]}>
                <ringGeometry args={[8.2, 8.5, 16]} />
                <meshBasicMaterial color="#1a1a1a" transparent opacity={0.9} />
            </mesh>

            {/* Inner bezel - REDUCED segments from 32 to 16 */}
            <mesh position={[0, 0, -1.9]}>
                <ringGeometry args={[7.8, 8.2, 16]} />
                <meshBasicMaterial color="#0a0a0a" transparent opacity={0.95} />
            </mesh>

            {/* Corner brackets for retro look */}
            {[
                [-7.5, 4.5, -1.7] as [number, number, number],
                [7.5, 4.5, -1.7] as [number, number, number],
                [-7.5, -4.5, -1.7] as [number, number, number],
                [7.5, -4.5, -1.7] as [number, number, number]
            ].map((pos, i) => (
                <mesh key={i} position={pos}>
                    <boxGeometry args={[0.3, 0.3, 0.1]} />
                    <meshBasicMaterial color="#333333" />
                </mesh>
            ))}
        </group>
    );
}

// Floating data streams - like old terminal printouts (OPTIMIZED)
function DataStreams() {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        groupRef.current.children.forEach((child, i) => {
            child.position.y -= delta * (0.5 + i * 0.2);
            if (child.position.y < -6) {
                child.position.y = 8;
            }
        });
    });

    // REDUCED from 6 to 3 streams for better performance
    return (
        <group ref={groupRef}>
            {Array.from({ length: 3 }).map((_, i) => (
                <mesh key={i} position={[(i - 1) * 3, 6 + i * 2, -1.5]}>
                    <planeGeometry args={[1.5, 0.1]} />
                    <meshBasicMaterial
                        color="#00ff88"
                        transparent
                        opacity={0.7}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ))}
        </group>
    );
}

// Retro cursor blink effect
function TerminalCursor() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            const blink = Math.floor(state.clock.elapsedTime * 2) % 2;
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = blink * 0.8 + 0.2;
        }
    });

    return (
        <mesh ref={meshRef} position={[6.5, -3.8, -1.5]}>
            <planeGeometry args={[0.1, 0.3]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.8} />
        </mesh>
    );
}

// Command prompt simulation
function CommandPrompt() {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    const material = useMemo(() => {
        const shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec2 vUv;

                void main() {
                    vec2 uv = vUv;

                    // Create command prompt text effect
                    float text = 0.0;

                    // MCPVOT prompt
                    if (uv.x > 0.1 && uv.x < 0.4 && uv.y > 0.3 && uv.y < 0.7) {
                        // Simulate "MCPVOT>" text
                        float chars = sin(uv.x * 40.0) * sin(uv.y * 20.0 + uTime);
                        text = smoothstep(0.0, 0.5, chars) * 0.8;
                    }

                    // Blinking underscore cursor
                    float cursor = step(0.85, fract(uTime * 2.0)) * 0.8;
                    if (uv.x > 0.42 && uv.x < 0.45 && uv.y > 0.4 && uv.y < 0.6) {
                        text += cursor;
                    }

                    vec3 color = vec3(0.0, 0.9, 0.3) * text;
                    gl_FragColor = vec4(color, text * 0.9);
                }
            `,
            transparent: true,
        });
        return shaderMaterial;
    }, []);

    return (
        <mesh position={[-6, -4, -1.5]}>
            <planeGeometry args={[4, 0.8]} />
            <primitive object={material} ref={materialRef} />
        </mesh>
    );
}

// Ambient terminal lighting
function TerminalLighting() {
    return (
        <group>
            {/* Main screen glow */}
            <pointLight position={[0, 0, 1]} intensity={0.5} color="#00ff88" distance={15} />

            {/* Corner accent lights */}
            <pointLight position={[-7, 4, 0]} intensity={0.3} color="#0088ff" distance={8} />
            <pointLight position={[7, 4, 0]} intensity={0.3} color="#ff4400" distance={8} />
            <pointLight position={[-7, -4, 0]} intensity={0.3} color="#ff0088" distance={8} />
            <pointLight position={[7, -4, 0]} intensity={0.3} color="#8800ff" distance={8} />

            {/* Subtle ambient fill */}
            <ambientLight intensity={0.1} color="#002200" />
        </group>
    );
}

// Status indicators - like old computer LEDs
function StatusLEDs() {
    const leds = [
        { pos: [-7.2, 4.2, -1.6] as [number, number, number], color: '#00ff00', blink: 1 }, // Power
        { pos: [-6.8, 4.2, -1.6] as [number, number, number], color: '#ffff00', blink: 2 }, // HDD
        { pos: [-6.4, 4.2, -1.6] as [number, number, number], color: '#ff0000', blink: 0 }, // Error
    ];

    return (
        <group>
            {leds.map((led, i) => (
                <StatusLED key={i} position={led.pos} color={led.color} blinkSpeed={led.blink} />
            ))}
        </group>
    );
}

function StatusLED({ position, color, blinkSpeed }: { position: [number, number, number], color: string, blinkSpeed: number }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current && blinkSpeed > 0) {
            const blink = Math.sin(state.clock.elapsedTime * blinkSpeed) * 0.5 + 0.5;
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + blink * 0.7;
        }
    });

    // REDUCED sphere geometry from 8x8 to 4x4 for better performance
    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[0.05, 4, 4]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
    );
}

// Cable management - retro computer cables (OPTIMIZED)
function Cables() {
    // REDUCED from 3 cables to 1 for better performance
    return (
        <group>
            {/* Power cable */}
            <mesh position={[-8, -2, -2]} rotation={[0, 0, Math.PI / 4]}>
                <cylinderGeometry args={[0.02, 0.02, 4, 4]} />
                <meshBasicMaterial color="#000000" />
            </mesh>
        </group>
    );
}

export default function ThreeBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            <Canvas
                camera={{ position: [0, 0, 10], fov: 45 }}
                gl={{
                    antialias: false, // Disable antialiasing for pixelated retro look + performance
                    alpha: true,
                    powerPreference: 'low-power' // Optimize for battery/performance
                }}
                frameloop="demand" // Only render when needed (PERFORMANCE BOOST)
                className="pointer-events-none"
                style={{ background: 'transparent' }}
                dpr={[1, 1.5]} // Limit device pixel ratio for better performance
            >
                {/* Lighting setup */}
                <TerminalLighting />

                {/* Main terminal components */}
                <TerminalFrame />
                <CRTMonitor />
                <CommandPrompt />
                <TerminalCursor />
                <StatusLEDs />
                <Cables />

                {/* Dynamic elements */}
                <DataStreams />
            </Canvas>

            {/* Subtle glow layers to make the 3D scene feel present even behind bright UI */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_28%_18%,rgba(34,211,238,0.28),transparent_55%),radial-gradient(at_72%_82%,rgba(59,130,246,0.24),transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-35 bg-[repeating-linear-gradient(135deg,rgba(34,197,94,0.08)_0,rgba(34,197,94,0.08)_2px,transparent_2px,transparent_6px)]" />
        </div>
    );
}
