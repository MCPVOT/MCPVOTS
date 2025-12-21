'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

interface ScanlineEffectProps {
    color?: string;
    intensity?: number;
    speed?: number;
}

/**
 * ScanlineEffect - Retro CRT scanline overlay
 * Creates that classic terminal screen aesthetic
 */
export default function ScanlineEffect({
    color = '#00ff41',
    intensity = 0.3,
    speed = 2.0,
}: ScanlineEffectProps) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;

        // Animate scanline position
        const offset = (clock.getElapsedTime() * speed) % 1;
        if (meshRef.current.material instanceof THREE.ShaderMaterial) {
            meshRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
            meshRef.current.material.uniforms.uOffset.value = offset;
        }
    });

    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color(color) },
                uIntensity: { value: intensity },
                uTime: { value: 0 },
                uOffset: { value: 0 },
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
                uniform float uOffset;
                varying vec2 vUv;

                void main() {
                    // Create scanline pattern
                    float scanline = sin((vUv.y + uOffset) * 200.0) * 0.5 + 0.5;
                    scanline = pow(scanline, 3.0);

                    // Add flicker effect
                    float flicker = sin(uTime * 10.0) * 0.05 + 0.95;

                    // Combine effects
                    float alpha = scanline * uIntensity * flicker;

                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });
    }, [color, intensity]);

    return (
        <mesh ref={meshRef} position={[0, 0, -2]}>
            <planeGeometry args={[20, 20]} />
            <primitive object={shaderMaterial} attach="material" />
        </mesh>
    );
}
