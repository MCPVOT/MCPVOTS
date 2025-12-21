'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

interface DigitalNoiseProps {
    intensity?: number;
    speed?: number;
    color?: string;
}

/**
 * DigitalNoise - Subtle digital interference effect
 * Adds retro tech glitch aesthetic
 */
export default function DigitalNoise({
    intensity = 0.15,
    speed = 0.5,
    color = '#00ff41',
}: DigitalNoiseProps) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;

        if (meshRef.current.material instanceof THREE.ShaderMaterial) {
            meshRef.current.material.uniforms.uTime.value = clock.getElapsedTime() * speed;
        }
    });

    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color(color) },
                uIntensity: { value: intensity },
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
                uniform vec3 uColor;
                uniform float uIntensity;
                uniform float uTime;
                varying vec2 vUv;

                // Simple noise function
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                void main() {
                    // Create digital noise pattern
                    vec2 noiseCoord = vUv * 100.0 + uTime;
                    float noise = random(floor(noiseCoord));

                    // Reduce noise to small flecks
                    noise = step(0.98, noise);

                    // Add scanline interference
                    float scanline = step(0.99, random(vec2(vUv.y * 50.0, uTime)));

                    float alpha = (noise + scanline * 0.3) * uIntensity;

                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });
    }, [color, intensity]);

    return (
        <mesh ref={meshRef} position={[0, 0, -1.9]}>
            <planeGeometry args={[20, 20]} />
            <primitive object={shaderMaterial} attach="material" />
        </mesh>
    );
}
