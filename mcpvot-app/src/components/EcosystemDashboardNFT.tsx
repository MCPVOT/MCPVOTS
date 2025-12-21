/**
 * X402 MCPVOT Ecosystem Dashboard - NFT EDITION
 * Visually stunning CRT terminal with animations
 * Works in Farcaster Mini Apps AND web
 * NFT-quality animated dashboard
 */

'use client';

import { useFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface FarcasterSDK {
    actions: {
        ready: () => void;
    };
}

declare global {
    interface Window {
        sdk?: FarcasterSDK;
    }
}

export default function EcosystemDashboardNFT() {
    const { isInMiniApp } = useFarcasterContext();
    const [typedLines, setTypedLines] = useState<number>(0);
    const [scanProgress, setScanProgress] = useState(0);

    useEffect(() => {
        // Signal Farcaster that app is ready
        if (isInMiniApp && typeof window !== 'undefined' && window.sdk) {
            window.sdk.actions.ready();
        }
    }, [isInMiniApp]);

    // Typing animation
    useEffect(() => {
        if (typedLines < 40) {
            const timer = setTimeout(() => {
                setTypedLines(prev => prev + 1);
            }, 60);
            return () => clearTimeout(timer);
        }
    }, [typedLines]);

    // Scanning progress
    useEffect(() => {
        if (scanProgress < 100) {
            const timer = setTimeout(() => {
                setScanProgress(prev => Math.min(prev + 1, 100));
            }, 30);
            return () => clearTimeout(timer);
        }
    }, [scanProgress]);

    return (
        <div className="relative min-h-screen bg-black overflow-hidden">
            {/* Animated grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00FFFF10_1px,transparent_1px),linear-gradient(to_bottom,#00FFFF10_1px,transparent_1px)] bg-[size:4rem_4rem] animate-pulse opacity-30" />

            {/* Radial glow from center */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,0.15)_0%,transparent_50%)]" />

            {/* CRT Scanlines Overlay */}
            <div className="absolute inset-0 pointer-events-none z-[100]">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,255,255,0.05)_50%)] bg-[length:100%_4px] animate-scan" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[length:3px_100%]" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen p-4 md:p-6 font-mono">
                <div className="max-w-6xl mx-auto">

                    {/* Header with Warplet */}
                    <div className="mb-6 md:mb-8 border-2 border-[#00FFFF]/60 rounded-lg p-4 md:p-6 bg-black/90 backdrop-blur-md shadow-[0_0_40px_rgba(0,255,255,0.3),inset_0_0_20px_rgba(0,255,255,0.1)]">
                        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-4">
                            {/* Warplet VOT Mascot */}
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 blur-3xl bg-cyan-400/50 rounded-full animate-pulse" />
                                <div className="absolute inset-0 blur-xl bg-cyan-300/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                                <Image
                                    src="/warplet_VOT.png"
                                    alt="Warplet VOT"
                                    width={120}
                                    height={120}
                                    className="relative drop-shadow-[0_0_40px_rgba(0,255,255,1)] animate-bounce-slow"
                                    priority
                                />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 mb-2">
                                    <div className="w-4 h-4 rounded-full bg-[#00FF88] animate-pulse shadow-[0_0_25px_rgba(0,255,136,1)]" />
                                    <h1 className="text-2xl md:text-4xl font-bold tracking-wider uppercase text-[#00FFFF] drop-shadow-[0_0_25px_rgba(0,255,255,1)] leading-tight">
                                        &gt; X402 MCPVOT ECOSYSTEM
                                    </h1>
                                </div>
                                <p className="text-[#00FF88] text-xs md:text-sm drop-shadow-[0_0_15px_rgba(0,255,136,0.8)]">
                                    &gt; Intelligence NFT Dashboard • Powered by MCP + IPFS + Neynar
                                </p>
                            </div>
                        </div>

                        {/* AGI Initialization */}
                        {typedLines >= 1 && (
                            <div className="space-y-1 text-xs md:text-sm">
                                {typedLines >= 2 && <p className="text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,0.8)]">&gt; Initializing x402 payment protocol...</p>}
                                {typedLines >= 4 && <p className="text-[#00FFFF]/80">&gt; Connected to 5 intelligence APIs</p>}
                                {typedLines >= 6 && <p className="text-[#00FFFF]/80">&gt; ERC-8004 Trustless Agent: <span className="text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,1)]">VERIFIED ✓</span></p>}
                                {typedLines >= 8 && <p className="text-[#00FFFF]/80">&gt; Farcaster Mini App: <span className="text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,1)]">ACTIVE ✓</span></p>}
                                {typedLines >= 10 && <p className="text-[#00FFFF]/80">&gt; Neynar Intelligence: <span className="text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,1)]">STREAMING ✓</span></p>}
                            </div>
                        )}

                        {/* Progress Bar */}
                        {typedLines >= 12 && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="text-[#00FFFF]/70">&gt; Ecosystem Analysis</span>
                                    <span className="text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,0.8)]">{scanProgress}%</span>
                                </div>
                                <div className="h-2 bg-[#00FFFF]/10 rounded-full overflow-hidden border border-[#00FFFF]/30">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#00FFFF] via-[#00FF88] to-[#FF8800] shadow-[0_0_20px_rgba(0,255,255,0.8)] transition-all duration-300"
                                        style={{ width: `${scanProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* X402 Intelligence Grid */}
                    {typedLines >= 14 && (
                        <div className="mb-6 md:mb-8">
                            <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#00FFFF] tracking-wider drop-shadow-[0_0_20px_rgba(0,255,255,0.9)]">
                                &gt; X402 INTELLIGENCE NETWORK
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                {[
                                    { name: 'VOT Intelligence', icon: '🔥', desc: '$VOT burn analytics & price tracking' },
                                    { name: 'MAXX Intelligence', icon: '💎', desc: 'MAXX token metrics & ecosystem' },
                                    { name: 'Farcaster Ecosystem', icon: '📱', desc: 'Neynar-powered social analytics' },
                                    { name: 'Clanker Intelligence', icon: '🤖', desc: 'clanker.world token discovery' },
                                    { name: 'Token Comparison', icon: '📊', desc: 'Multi-token comparative engine' },
                                    { name: 'NFT Mint Engine', icon: '🎨', desc: 'Intelligence NFT minting hub' },
                                ].map((service, idx) => (
                                    typedLines >= (16 + idx * 2) && (
                                        <div
                                            key={idx}
                                            className="border-2 border-[#00FFFF]/40 rounded-lg p-3 md:p-4 bg-black/90 hover:bg-[#00FFFF]/5 transition-all duration-300 hover:border-[#00FFFF]/90 hover:shadow-[0_0_35px_rgba(0,255,255,0.5)] group cursor-pointer backdrop-blur-sm"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform">{service.icon}</span>
                                                    <h3 className="font-bold text-sm md:text-base text-[#00FFFF] group-hover:drop-shadow-[0_0_15px_rgba(0,255,255,1)] transition-all">
                                                        {service.name}
                                                    </h3>
                                                </div>
                                                <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse shadow-[0_0_15px_rgba(0,255,136,1)]" />
                                            </div>
                                            <p className="text-xs text-[#00FFFF]/70">{service.desc}</p>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tokenomics Showcase */}
                    {typedLines >= 30 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                            <div className="border-2 border-[#00FFFF] rounded-lg p-3 md:p-4 bg-black/90 shadow-[0_0_40px_rgba(0,255,255,0.6),inset_0_0_20px_rgba(0,255,255,0.1)] backdrop-blur-sm">
                                <h3 className="font-bold text-sm md:text-base mb-3 text-[#00FFFF] flex items-center gap-2">
                                    <span className="text-xl md:text-2xl">🔥</span> $VOT Burn Mechanism
                                </h3>
                                <div className="space-y-2 text-xs text-[#00FFFF]/80">
                                    <div className="flex justify-between">
                                        <span>API Cost:</span>
                                        <span className="text-[#00FF88] font-bold">$0.002 VOT</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Burn Rate:</span>
                                        <span className="text-[#FF8800] font-bold">100%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>IPFS Registry:</span>
                                        <span className="text-[#00FF88] font-bold">Permanent</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-2 border-[#00FF88] rounded-lg p-3 md:p-4 bg-black/90 shadow-[0_0_40px_rgba(0,255,136,0.6),inset_0_0_20px_rgba(0,255,136,0.1)] backdrop-blur-sm">
                                <h3 className="font-bold text-sm md:text-base mb-3 text-[#00FF88] flex items-center gap-2">
                                    <span className="text-xl md:text-2xl">💎</span> Intelligence NFT Tiers
                                </h3>
                                <div className="space-y-2 text-xs text-[#00FFFF]/80">
                                    <div className="flex justify-between">
                                        <span>Genesis (1-100):</span>
                                        <span className="text-[#FFD700] font-bold">10x Boost</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Elite (101-500):</span>
                                        <span className="text-[#00FFFF] font-bold">5x Boost</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Standard (501+):</span>
                                        <span className="text-[#00FF88] font-bold">2x Boost</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-2 border-[#FF8800] rounded-lg p-3 md:p-4 bg-black/90 shadow-[0_0_40px_rgba(255,136,0,0.6),inset_0_0_20px_rgba(255,136,0,0.1)] backdrop-blur-sm">
                                <h3 className="font-bold text-sm md:text-base mb-3 text-[#FF8800] flex items-center gap-2">
                                    <span className="text-xl md:text-2xl">🤖</span> Agent Revenue Split
                                </h3>
                                <div className="space-y-2 text-xs text-[#00FFFF]/80">
                                    <div className="flex justify-between">
                                        <span>NFT Holders:</span>
                                        <span className="text-[#00FF88] font-bold">40%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Development:</span>
                                        <span className="text-[#00FFFF] font-bold">30%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Burn Forever:</span>
                                        <span className="text-[#FF8800] font-bold">30%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Links */}
                    {typedLines >= 35 && (
                        <div className="flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm pb-8">
                            <a href="https://github.com/MCPVOT" className="text-[#00FFFF]/80 hover:text-[#00FFFF] transition-all drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] hover:drop-shadow-[0_0_25px_rgba(0,255,255,1)] hover:scale-110">
                                &gt; GitHub
                            </a>
                            <span className="text-[#00FF88]/40">•</span>
                            <a href="https://x402scan.com" className="text-[#00FFFF]/80 hover:text-[#00FFFF] transition-all drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] hover:drop-shadow-[0_0_25px_rgba(0,255,255,1)] hover:scale-110">
                                &gt; x402scan
                            </a>
                            <span className="text-[#00FF88]/40">•</span>
                            <a href="/.well-known/agent-registration.json" className="text-[#00FF88]/80 hover:text-[#00FF88] transition-all drop-shadow-[0_0_10px_rgba(0,255,136,0.5)] hover:drop-shadow-[0_0_25px_rgba(0,255,136,1)] hover:scale-110">
                                &gt; Agent Registry
                            </a>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 100%; }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(5deg); }
                }
                .animate-scan {
                    animation: scan 8s linear infinite;
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
