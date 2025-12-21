/**
 * X402 MCPVOT Ecosystem Dashboard
 * Terminal-style retro cyberpunk design matching EpicIntelligenceDashboard
 * Animated AGI response with CRT scanlines and typing effects
 */

'use client';

import { useEffect, useState } from 'react';

interface ApiService {
    name: string;
    endpoint: string;
    description: string;
    status: 'operational' | 'loading';
}

export default function EcosystemDashboard() {
    const [typedLines, setTypedLines] = useState<number>(0);
    const [scanProgress, setScanProgress] = useState(0);
    const [activeSection, setActiveSection] = useState(0);

    const services: ApiService[] = [
        { name: 'VOT Intelligence', endpoint: '/api/vot-intelligence', description: 'Real-time $VOT burn analytics & price tracking', status: 'operational' },
        { name: 'MAXX Intelligence', endpoint: '/api/maxx-intelligence', description: 'MAXX token metrics & ecosystem data', status: 'operational' },
        { name: 'Farcaster Ecosystem', endpoint: '/api/farcaster-intelligence', description: 'Social protocol integration & cast analytics', status: 'operational' },
        { name: 'Token Comparison', endpoint: '/api/token-compare', description: 'Multi-token comparative analysis engine', status: 'operational' },
        { name: 'NFT Mint Engine', endpoint: '/api/x402/mint', description: 'Intelligence NFT minting with staking rewards', status: 'operational' },
    ];

    // AGI typing animation
    useEffect(() => {
        if (typedLines < 30) {
            const timer = setTimeout(() => {
                setTypedLines(prev => prev + 1);
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [typedLines]);

    // Scanning progress animation
    useEffect(() => {
        if (scanProgress < 100) {
            const timer = setTimeout(() => {
                setScanProgress(prev => Math.min(prev + 2, 100));
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [scanProgress]);

    // Section rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSection(prev => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-black text-[#00FFFF] font-mono p-6 relative overflow-hidden">
            {/* Animated Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00FFFF10_1px,transparent_1px),linear-gradient(to_bottom,#00FFFF10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#00FFFF05] via-transparent to-[#00FF8805]" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Header - AGI Response */}
                <div className="mb-8 border-2 border-[#00FFFF]/60 rounded-lg p-6 bg-black/90 backdrop-blur-sm shadow-[0_0_40px_rgba(0,255,255,0.3)]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-3 h-3 rounded-full bg-[#00FF88] animate-pulse shadow-[0_0_20px_rgba(0,255,136,1)]" />
                        <h1 className="text-2xl font-bold tracking-wider uppercase drop-shadow-[0_0_20px_rgba(0,255,255,1)]">
                            &gt; X402 MCPVOT ECOSYSTEM
                        </h1>
                    </div>

                    {typedLines >= 1 && (
                        <div className="space-y-1 text-sm animate-fade-in">
                            {typedLines >= 2 && <p className="text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,0.8)]">&gt; Initializing intelligence protocols...</p>}
                            {typedLines >= 4 && <p className="text-[#00FFFF]/80">&gt; Connected to 5 x402 payment-gated APIs</p>}
                            {typedLines >= 6 && <p className="text-[#00FFFF]/80">&gt; ERC-8004 Trustless Agent Registry: <span className="text-[#00FF88]">COMPLIANT</span></p>}
                            {typedLines >= 8 && <p className="text-[#00FFFF]/80">&gt; Farcaster Frame Protocol: <span className="text-[#00FF88]">OPTIMIZED</span></p>}
                        </div>
                    )}

                    {/* Scanning Progress */}
                    {typedLines >= 10 && (
                        <div className="mt-4 animate-fade-in">
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="text-[#00FFFF]/70">&gt; Ecosystem Scan</span>
                                <span className="text-[#00FF88]">{scanProgress}%</span>
                            </div>
                            <div className="h-2 bg-[#00FFFF]/10 rounded-full overflow-hidden border border-[#00FFFF]/30">
                                <div
                                    className="h-full bg-gradient-to-r from-[#00FFFF] to-[#00FF88] shadow-[0_0_20px_rgba(0,255,255,0.8)] transition-all duration-500"
                                    style={{ width: `${scanProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* X402 API Services Grid */}
                {typedLines >= 12 && (
                    <div className="mb-8 animate-fade-in">
                        <h2 className="text-xl font-bold mb-4 text-[#00FFFF] tracking-wider drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">
                            &gt; X402 PAYMENT-GATED INTELLIGENCE
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.map((service, idx) => (
                                typedLines >= (14 + idx * 2) && (
                                    <div
                                        key={idx}
                                        className="border-2 border-[#00FFFF]/40 rounded-lg p-4 bg-black/80 hover:bg-[#00FFFF]/5 transition-all hover:border-[#00FFFF]/80 hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] group animate-fade-in"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-[#00FFFF] group-hover:drop-shadow-[0_0_15px_rgba(0,255,255,1)]">{service.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse shadow-[0_0_10px_rgba(0,255,136,1)]" />
                                                <span className="text-[10px] text-[#00FF88] uppercase tracking-wider">Live</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-[#00FFFF]/70 mb-2">{service.description}</p>
                                        <div className="text-[10px] text-[#00FF88]/60 font-mono">{service.endpoint}</div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* Rotating Feature Sections */}
                {typedLines >= 24 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in">
                        {/* VOT Tokenomics */}
                        <div className={`border-2 rounded-lg p-4 bg-black/80 transition-all duration-500 ${activeSection === 0
                            ? 'border-[#00FFFF] shadow-[0_0_40px_rgba(0,255,255,0.5)]'
                            : 'border-[#00FFFF]/30'
                            }`}>
                            <h3 className="font-bold mb-3 text-[#00FFFF] flex items-center gap-2">
                                <span className="text-lg">�</span> $VOT Burn Mechanism
                            </h3>
                            <div className="space-y-2 text-xs text-[#00FFFF]/80">
                                <div className="flex justify-between">
                                    <span>API Query Cost:</span>
                                    <span className="text-[#00FF88]">$0.002 VOT</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Burn Rate:</span>
                                    <span className="text-[#FF8800]">100%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>IPFS Registry:</span>
                                    <span className="text-[#00FF88]">Permanent</span>
                                </div>
                            </div>
                        </div>

                        {/* NFT Staking */}
                        <div className={`border-2 rounded-lg p-4 bg-black/80 transition-all duration-500 ${activeSection === 1
                            ? 'border-[#00FF88] shadow-[0_0_40px_rgba(0,255,136,0.5)]'
                            : 'border-[#00FFFF]/30'
                            }`}>
                            <h3 className="font-bold mb-3 text-[#00FF88] flex items-center gap-2">
                                <span className="text-lg">💎</span> Intelligence NFT Tiers
                            </h3>
                            <div className="space-y-2 text-xs text-[#00FFFF]/80">
                                <div className="flex justify-between">
                                    <span>Genesis (1-100):</span>
                                    <span className="text-[#FFD700]">10x Multiplier</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Elite (101-500):</span>
                                    <span className="text-[#00FFFF]">5x Multiplier</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Standard (501+):</span>
                                    <span className="text-[#00FF88]">2x Multiplier</span>
                                </div>
                            </div>
                        </div>

                        {/* Agent Rewards */}
                        <div className={`border-2 rounded-lg p-4 bg-black/80 transition-all duration-500 ${activeSection === 2
                            ? 'border-[#FF8800] shadow-[0_0_40px_rgba(255,136,0,0.5)]'
                            : 'border-[#00FFFF]/30'
                            }`}>
                            <h3 className="font-bold mb-3 text-[#FF8800] flex items-center gap-2">
                                <span className="text-lg">🤖</span> Agent Revenue Split
                            </h3>
                            <div className="space-y-2 text-xs text-[#00FFFF]/80">
                                <div className="flex justify-between">
                                    <span>NFT Holders:</span>
                                    <span className="text-[#00FF88]">40%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Development:</span>
                                    <span className="text-[#00FFFF]">30%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Burn Forever:</span>
                                    <span className="text-[#FF8800]">30%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Agent Discovery & Compliance */}
                {typedLines >= 26 && (
                    <div className="border-2 border-[#00FFFF]/60 rounded-lg p-6 bg-black/90 backdrop-blur-sm shadow-[0_0_40px_rgba(0,255,255,0.3)] animate-fade-in">
                        <h2 className="text-xl font-bold mb-4 text-[#00FFFF] tracking-wider drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">
                            &gt; AGENT DISCOVERY PROTOCOL
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="text-center p-3 bg-[#00FFFF]/5 border border-[#00FFFF]/30 rounded">
                                <div className="text-2xl mb-2">⛓️</div>
                                <div className="text-sm font-bold text-[#00FFFF]">On-Chain Registry</div>
                                <div className="text-[10px] text-[#00FFFF]/60 mt-1">Base ERC-8004</div>
                            </div>
                            <div className="text-center p-3 bg-[#00FF88]/5 border border-[#00FF88]/30 rounded">
                                <div className="text-2xl mb-2">🔍</div>
                                <div className="text-sm font-bold text-[#00FF88]">x402scan.com</div>
                                <div className="text-[10px] text-[#00FF88]/60 mt-1">Marketplace Discovery</div>
                            </div>
                            <div className="text-center p-3 bg-[#FF8800]/5 border border-[#FF8800]/30 rounded">
                                <div className="text-2xl mb-2">�</div>
                                <div className="text-sm font-bold text-[#FF8800]">Direct HTTP</div>
                                <div className="text-[10px] text-[#FF8800]/60 mt-1">/.well-known/</div>
                            </div>
                        </div>

                        <div className="text-xs text-[#00FFFF]/70 space-y-1 mt-4">
                            <p>&gt; ERC-8004 Compliant: <span className="text-[#00FF88]">16/16 checks passed</span></p>
                            <p>&gt; Agent Registration: <span className="text-[#00FFFF]">/.well-known/agent-registration.json</span></p>
                            <p>&gt; Verification Script: <span className="text-[#00FF88]">scripts/verify-erc8004-compliance.mjs</span></p>
                        </div>
                    </div>
                )}

                {/* Footer Links */}
                {typedLines >= 28 && (
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs animate-fade-in">
                        <a href="https://github.com/MCPVOT" target="_blank" rel="noopener noreferrer"
                            className="font-mono text-[#00FFFF]/80 hover:text-[#00FFFF] transition-colors tracking-wider uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] hover:drop-shadow-[0_0_20px_rgba(0,255,255,1)]">
                            &gt; GitHub
                        </a>
                        <span className="text-[#00FF88]/40">•</span>
                        <a href="https://x402scan.com" target="_blank" rel="noopener noreferrer"
                            className="font-mono text-[#00FFFF]/80 hover:text-[#00FFFF] transition-colors tracking-wider uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] hover:drop-shadow-[0_0_20px_rgba(0,255,255,1)]">
                            &gt; x402scan
                        </a>
                        <span className="text-[#00FF88]/40">•</span>
                        <a href="https://mcpvot.xyz" target="_blank" rel="noopener noreferrer"
                            className="font-mono text-[#00FFFF]/80 hover:text-[#00FFFF] transition-colors tracking-wider uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] hover:drop-shadow-[0_0_20px_rgba(0,255,255,1)]">
                            &gt; mcpvot.xyz
                        </a>
                        <span className="text-[#00FF88]/40">•</span>
                        <a href="/.well-known/agent-registration.json" target="_blank" rel="noopener noreferrer"
                            className="font-mono text-[#00FF88]/80 hover:text-[#00FF88] transition-colors tracking-wider uppercase drop-shadow-[0_0_10px_rgba(0,255,136,0.5)] hover:drop-shadow-[0_0_20px_rgba(0,255,136,1)]">
                            &gt; Agent Registry
                        </a>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
