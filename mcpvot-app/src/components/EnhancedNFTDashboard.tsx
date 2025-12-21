'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface NFTTelemetryData {
    tokenId: string;
    owner?: string;
    tier?: 'Basic' | 'Premium' | 'Legendary';
    stakingPower?: number;
    rewardsEarned?: number;
    dataAccess?: string[];
    mintDate?: string;
    lastActivity?: string;
}

// Rotating holographic NFT visualization with retro arcade effects
function HolographicNFT({ tier = 'Basic' }: { tier: string }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const particlesRef = useRef<THREE.Points>(null);

    // Pre-generate stable random values
    const [heightOffsets] = useState(() =>
        Array.from({ length: 50 }, () => (Math.random() - 0.5) * 3)
    );

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
        }
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
        if (particlesRef.current) {
            particlesRef.current.rotation.y = -state.clock.elapsedTime * 0.3;
        }
    });

    const getTierColor = useCallback(() => {
        switch (tier) {
            case 'Legendary': return new THREE.Color(0xffd700);
            case 'Premium': return new THREE.Color(0x9d4edd);
            default: return new THREE.Color(0x00ffcc);
        }
    }, [tier]);

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: getTierColor() },
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            void main() {
                vUv = uv;
                vPosition = position;
                vNormal = normal;
                vec3 pos = position;
                pos.x += sin(position.y * 3.0 + uTime) * 0.05;
                pos.y += cos(position.z * 3.0 + uTime) * 0.05;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;

            // Pixelated retro effect
            vec2 pixelate(vec2 uv, float pixels) {
                return floor(uv * pixels) / pixels;
            }

            // Scanline effect
            float scanline(vec2 uv, float lines) {
                return sin(uv.y * lines + uTime * 2.0) * 0.5 + 0.5;
            }

            void main() {
                vec2 pixelUv = pixelate(vUv, 20.0);
                float scan = scanline(vUv, 50.0);
                float pulse = 0.5 + 0.5 * sin(uTime * 2.0);

                // Edge glow
                float edge = smoothstep(0.45, 0.5, length(vUv - 0.5));

                // Fresnel effect for holographic look
                vec3 viewDirection = normalize(cameraPosition - vPosition);
                float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);

                vec3 color = uColor * (0.7 + pulse * 0.3) * (0.8 + scan * 0.2);
                color += fresnel * uColor * 0.5;

                // Retro pixelation
                float pixelMask = step(0.3, fract(pixelUv.x * 10.0)) * step(0.3, fract(pixelUv.y * 10.0));
                color *= 0.8 + pixelMask * 0.2;

                gl_FragColor = vec4(color, 1.0 - edge * 0.3);
            }
        `,
        transparent: true,
    }), [getTierColor]);

    // Particle orbit for retro arcade feel
    const particleGeometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(50 * 3);

        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const radius = 2;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = heightOffsets[i];
            positions[i * 3 + 2] = Math.sin(angle) * radius;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geo;
    }, [heightOffsets]);

    return (
        <group>
            <mesh ref={meshRef}>
                <boxGeometry args={[1.5, 2, 0.1]} />
                <primitive object={material} ref={materialRef} />
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(1.5, 2, 0.1)]} />
                    <lineBasicMaterial color={getTierColor()} linewidth={2} />
                </lineSegments>
            </mesh>
            <points ref={particlesRef} geometry={particleGeometry}>
                <pointsMaterial
                    color={getTierColor()}
                    size={0.05}
                    transparent
                    opacity={0.6}
                />
            </points>
        </group>
    );
}

export default function EnhancedNFTDashboard({ tokenId }: { tokenId: string }) {
    const [nftData, setNftData] = useState<NFTTelemetryData>({
        tokenId,
        tier: 'Premium',
        stakingPower: 2.5,
        rewardsEarned: 1247.82,
        dataAccess: ['Farcaster Intel', 'IPFS Vault', 'Trading Signals'],
        mintDate: '2025-10-15',
        lastActivity: '2 hours ago',
    });

    const [glitchActive, setGlitchActive] = useState(false);

    // Generate stable barcode pattern
    const [barcodePattern] = useState(() =>
        Array.from({ length: 32 }).map(() => ({
            height: 20 + Math.random() * 80,
            opacity: 0.3 + Math.random() * 0.7,
        }))
    );

    useEffect(() => {
        // Simulate data refresh with glitch effect
        const interval = setInterval(() => {
            setGlitchActive(true);
            setTimeout(() => {
                setNftData(prev => ({
                    ...prev,
                    rewardsEarned: prev.rewardsEarned! + Math.random() * 10,
                }));
                setGlitchActive(false);
            }, 200);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="nft-dashboard">
            {/* Header with Subject ID */}
            <div className="nft-dashboard__header">
                <div className="nft-dashboard__id">
                    <span className="nft-dashboard__label">SUBJECT</span>
                    <span className="nft-dashboard__value">x420-{tokenId}</span>
                </div>
                <div className="nft-dashboard__status">
                    <span className="status-indicator status-indicator--active"></span>
                    <span className="nft-dashboard__label">ONLINE</span>
                </div>
            </div>

            <div className="nft-dashboard__grid">
                {/* 3D NFT Visualization */}
                <div className="nft-dashboard__visual">
                    <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1} color="#00ffcc" />
                        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#fb923c" />
                        <HolographicNFT tier={nftData.tier || 'Basic'} />
                    </Canvas>
                    <div className="nft-dashboard__visual-overlay">
                        <div className="scan-line"></div>
                    </div>
                </div>

                {/* Data Panels */}
                <div className="nft-dashboard__panels">
                    {/* Identity Panel */}
                    <div className={`data-panel ${glitchActive ? 'data-panel--glitch' : ''}`}>
                        <div className="data-panel__row">
                            <span className="data-panel__label">TIER</span>
                            <span className={`data-panel__value tier-badge tier-badge--${nftData.tier?.toLowerCase()}`}>
                                {nftData.tier?.toUpperCase()}
                            </span>
                        </div>
                        <div className="data-panel__row">
                            <span className="data-panel__label">INCEPTION DATE</span>
                            <span className="data-panel__value">{nftData.mintDate}</span>
                        </div>
                        <div className="data-panel__row">
                            <span className="data-panel__label">LAST ACTIVITY</span>
                            <span className="data-panel__value">{nftData.lastActivity}</span>
                        </div>
                    </div>

                    {/* Staking Stats */}
                    <div className="data-panel">
                        <div className="data-panel__row">
                            <span className="data-panel__label">STAKING POWER</span>
                            <span className="data-panel__value data-panel__value--highlight">
                                {nftData.stakingPower}x MULTIPLIER
                            </span>
                        </div>
                        <div className="data-panel__row">
                            <span className="data-panel__label">REWARDS EARNED</span>
                            <span className="data-panel__value data-panel__value--success">
                                {nftData.rewardsEarned?.toFixed(2)} VOT
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-bar__fill" style={{ width: '67%' }}></div>
                        </div>
                    </div>

                    {/* Access Permissions */}
                    <div className="data-panel">
                        <div className="data-panel__header">
                            <span className="data-panel__label">MCP DATA ACCESS</span>
                        </div>
                        <div className="access-list">
                            {nftData.dataAccess?.map((access, index) => (
                                <div key={index} className="access-item">
                                    <span className="access-item__icon">►</span>
                                    <span className="access-item__text">{access}</span>
                                    <span className="access-item__status">GRANTED</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Threat Assessment / Stats */}
                    <div className="data-panel">
                        <div className="data-panel__header">
                            <span className="data-panel__label">PERFORMANCE METRICS</span>
                        </div>
                        <div className="metrics-grid">
                            <div className="metric-item">
                                <span className="metric-item__label">UPTIME</span>
                                <span className="metric-item__value">98.7%</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-item__label">EFFICIENCY</span>
                                <span className="metric-item__value">★★★★</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-item__label">TRADES</span>
                                <span className="metric-item__value">142</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fingerprint/Barcode Footer */}
            <div className="nft-dashboard__footer">
                <div className="barcode">
                    {barcodePattern.map((bar, i) => (
                        <div
                            key={i}
                            className="barcode__line"
                            style={{
                                height: `${bar.height}%`,
                                opacity: bar.opacity,
                            }}
                        />
                    ))}
                </div>
                <div className="nft-dashboard__signature">
                    <span>MCPVOT NFT TELEMETRY SYSTEM v2.0</span>
                    <span className="nft-dashboard__hash">0x{tokenId.padStart(40, '0').substring(0, 8)}...{tokenId.padEnd(40, 'f').substring(32, 40)}</span>
                </div>
            </div>
        </div>
    );
}
