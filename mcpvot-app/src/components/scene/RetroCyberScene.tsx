'use client';

import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import DigitalNoise from './DigitalNoise';
import HolographicGrid from './HolographicGrid';
import NFTHologram from './NFTHologram';
import ScanlineEffect from './ScanlineEffect';

interface RetroCyberSceneProps {
    showNFT?: boolean;
    nftTelemetry?: {
        gasPrice: number;
        tradingVolume: number;
        networkLoad: number;
    };
    darkMode?: boolean;
}

/**
 * RetroCyberScene - Complete retro cyberpunk 3D environment
 * Dark theme with high contrast green, orange, light blue neon
 * Modular and functional, not just visual
 */
export default function RetroCyberScene({
    showNFT = false,
    nftTelemetry,
    darkMode = true,
}: RetroCyberSceneProps) {
    return (
        <div className="absolute inset-0 w-full h-full">
            <Canvas
                className="w-full h-full"
                gl={{
                    alpha: true,
                    antialias: true,
                    powerPreference: 'high-performance',
                }}
                dpr={[1, 2]}
            >
                <Suspense fallback={null}>
                    {/* Camera setup */}
                    <PerspectiveCamera makeDefault position={[0, 3, 10]} fov={60} />

                    {/* Camera controls - subtle, not distracting */}
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 2}
                        autoRotate
                        autoRotateSpeed={0.3}
                    />

                    {/* Lighting - dark with neon accents */}
                    <ambientLight intensity={darkMode ? 0.1 : 0.3} />
                    <pointLight position={[10, 10, 10]} intensity={0.3} color="#00d4ff" />
                    <pointLight position={[-10, 5, -10]} intensity={0.2} color="#ff8c00" />
                    <pointLight position={[0, -5, 5]} intensity={0.15} color="#00ff41" />

                    {/* Starfield background */}
                    <Stars
                        radius={100}
                        depth={50}
                        count={2000}
                        factor={4}
                        saturation={0}
                        fade
                        speed={0.5}
                    />

                    {/* Holographic grid floor */}
                    <HolographicGrid
                        size={30}
                        divisions={30}
                        colors={{ primary: '#00d4ff', secondary: '#ff8c00' }}
                        animated
                        transparency={0.6}
                    />

                    {/* NFT Data Visualization (functional) */}
                    {showNFT && nftTelemetry && (
                        <NFTHologram
                            tokenId="live"
                            telemetry={nftTelemetry}
                            color="#00d4ff"
                        />
                    )}

                    {/* Retro CRT effects */}
                    <ScanlineEffect
                        color="#00ff41"
                        intensity={0.2}
                        speed={2.0}
                    />

                    {/* Digital noise/interference */}
                    <DigitalNoise
                        intensity={0.1}
                        speed={0.5}
                        color="#00ff41"
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
