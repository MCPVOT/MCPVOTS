/**
 * x402 Intelligence Showcase - Premium AI Query Dashboard
 * Displays 6 intelligence endpoints with x402 gasless USDC payments
 * Terminal-style cyberpunk aesthetic matching MCPVOT design
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

interface IntelligenceEndpoint {
    id: string;
    name: string;
    description: string;
    price: string;
    priceUsd: number;
    symbol: string; // Cuneiform/ancient symbol
    gradient: string;
    borderGlow: string;
    endpoint: string;
    tier: string;
    burn: string;
}

const INTELLIGENCE_ENDPOINTS: IntelligenceEndpoint[] = [
    {
        id: 'farcaster',
        name: 'FARCASTER',
        description: 'Social Ecosystem Intelligence',
        price: '$0.30',
        priceUsd: 0.30,
        symbol: '𒀀', // Cuneiform A
        gradient: 'from-purple-500 via-pink-500 to-orange-500',
        borderGlow: 'rgba(168, 85, 247, 0.6)',
        endpoint: '/api/x402/intelligence/farcaster',
        tier: 'PREMIUM',
        burn: '15% VOT'
    },
    {
        id: 'vot',
        name: 'VOT PROTOCOL',
        description: 'Trading & Burn Analytics',
        price: '$0.10',
        priceUsd: 0.10,
        symbol: '𒀁', // Cuneiform E
        gradient: 'from-cyan-500 via-blue-500 to-purple-500',
        borderGlow: 'rgba(6, 182, 212, 0.6)',
        endpoint: '/api/x402/intelligence/vot',
        tier: 'BASIC',
        burn: '5% VOT'
    },
    {
        id: 'maxx',
        name: 'MAXX BURN',
        description: 'Market Intelligence & Burns',
        price: '$0.30',
        priceUsd: 0.30,
        symbol: '𒀂', // Cuneiform I
        gradient: 'from-orange-500 via-red-500 to-pink-500',
        borderGlow: 'rgba(249, 115, 22, 0.6)',
        endpoint: '/api/x402/intelligence/maxx',
        tier: 'PREMIUM',
        burn: '15% VOT'
    },
    {
        id: 'clanker',
        name: 'CLANKER',
        description: 'Token Creation Analytics',
        price: '$0.30',
        priceUsd: 0.30,
        symbol: '⟡', // Pentagon symbol
        gradient: 'from-green-500 via-emerald-500 to-teal-500',
        borderGlow: 'rgba(16, 185, 129, 0.6)',
        endpoint: '/api/x402/intelligence/clanker',
        tier: 'PREMIUM',
        burn: '15% VOT'
    },
    {
        id: 'x402loop',
        name: 'x402 LOOP',
        description: 'Deep Protocol Analysis',
        price: '$0.30',
        priceUsd: 0.30,
        symbol: '𒀃', // Cuneiform U
        gradient: 'from-blue-500 via-indigo-500 to-violet-500',
        borderGlow: 'rgba(99, 102, 241, 0.6)',
        endpoint: '/api/x402/intelligence/x402loop',
        tier: 'LEGENDARY',
        burn: '90% VOT'
    },
    {
        id: 'base-full',
        name: 'BASE FULL',
        description: 'Complete Chain Intelligence',
        price: '$0.30',
        priceUsd: 0.30,
        symbol: '𒀄', // Cuneiform AŠ
        gradient: 'from-yellow-500 via-orange-500 to-red-500',
        borderGlow: 'rgba(234, 179, 8, 0.6)',
        endpoint: '/api/x402/intelligence/base-full',
        tier: 'LEGENDARY',
        burn: '90% VOT'
    }
];

export default function X402IntelligenceShowcase() {
    const { isConnected } = useAccount();
    const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
    const [isQuerying, setIsQuerying] = useState(false);
    const [queryResult, setQueryResult] = useState<Record<string, unknown> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const closeTimeoutRef = useRef<number | null>(null);

    const handleQuery = async (endpoint: IntelligenceEndpoint) => {
        // ensure any previous close animation is reset
        if (closeTimeoutRef.current) {
            window.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsClosing(false);
        if (!isConnected) {
            setError('Please connect your wallet first');
            return;
        }

        setSelectedEndpoint(endpoint.id);
        setIsQuerying(true);
        setError(null);
        setQueryResult(null);

        try {
            // TODO: Implement x402 payment flow here
            // For now, just show the endpoint info
            await new Promise(resolve => setTimeout(resolve, 1000));

            setQueryResult({
                endpoint: endpoint.name,
                price: endpoint.price,
                status: 'Ready to query',
                message: 'x402 payment flow will be implemented here'
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Query failed');
        } finally {
            setIsQuerying(false);
        }
    };

    // cleanup any pending timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                window.clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
            }
        };
    }, []);

    return (
        <div className="relative group">
            {/* Outer glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-[#00FFFF]/30 via-[#00FF88]/30 to-[#FF8800]/30 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

            <div className="relative bg-gradient-to-br from-[#000d0d] via-[#001a1a] to-[#000d0d] border-2 border-[#00FFFF]/70 rounded-2xl p-8 shadow-[0_0_80px_rgba(0,255,255,0.4)] overflow-hidden">
                {/* Terminal scanlines */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.05) 0px, transparent 1px, transparent 2px, rgba(0, 255, 255, 0.05) 3px)',
                    }}
                />

                {/* CRT flicker effect */}
                <div className="absolute inset-0 bg-[#00FFFF]/5 animate-pulse pointer-events-none" />

                {/* Header */}
                <div className="mb-8 pb-6 border-b-2 border-[#00FFFF]/40 relative">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-4xl animate-pulse">▶</span>
                                <h2 className="text-4xl md:text-5xl font-mono font-extrabold text-[#00FFFF] drop-shadow-[0_0_30px_rgba(0,255,255,1)] tracking-tight">
                                    X402 INTELLIGENCE
                                </h2>
                            </div>
                            <p className="text-lg md:text-xl font-mono text-[#00FF88] uppercase tracking-widest pl-14 drop-shadow-[0_0_15px_rgba(0,255,136,0.8)]">
                                &gt; Gasless AI Queries • Real-time Data
                            </p>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-3 bg-[#00FFFF]/15 border-2 border-[#00FFFF]/60 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.4)]">
                            <div className="w-4 h-4 rounded-full bg-[#00FF88] animate-pulse shadow-[0_0_20px_rgba(0,255,136,1)]" />
                            <span className="text-xl font-mono font-bold text-[#00FFFF] uppercase tracking-wider">ONLINE</span>
                        </div>
                    </div>
                </div>

                {/* Intelligence Grid - NFT Card Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {INTELLIGENCE_ENDPOINTS.map((endpoint, index) => (
                        <button
                            key={endpoint.id}
                            onClick={() => handleQuery(endpoint)}
                            disabled={isQuerying}
                            style={{
                                animationDelay: `${index * 0.1}s`
                            }}
                            className="nft-card group relative overflow-hidden bg-black/95 border-2 border-[#00FFFF]/40 rounded-lg p-0 hover:scale-[1.02] hover:border-[#00FFFF]/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-left animate-float-in shadow-[0_0_30px_rgba(0,255,255,0.2)]"
                        >
                            {/* Card inner container */}
                            <div className="relative bg-black/95 rounded-lg p-6 h-full border border-[#00FFFF]/20">
                                {/* Terminal scanlines effect */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.08] rounded-lg"
                                    style={{
                                        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.05) 0px, transparent 1px, transparent 2px, rgba(0, 255, 255, 0.05) 3px)',
                                    }}
                                />

                                {/* Subtle gradient overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${endpoint.gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 rounded-lg`} />

                                <div className="relative z-10 flex flex-col h-full">
                                    {/* Ancient Symbol - Large and centered */}
                                    <div className="flex-1 flex items-center justify-center mb-4">
                                        <div className="relative">
                                            <div className="text-8xl font-bold text-[#00FFFF] drop-shadow-[0_0_25px_rgba(0,255,255,0.6)] group-hover:scale-110 transition-transform duration-300">
                                                {endpoint.symbol}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Name Badge */}
                                    <div className="text-center mb-4">
                                        <h3 className="text-xl font-mono font-bold uppercase tracking-wider text-[#00FFFF] drop-shadow-[0_0_15px_rgba(0,255,255,0.6)] mb-1">
                                            {endpoint.name}
                                        </h3>
                                        <p className="text-xs font-mono text-[#00FFFF]/60 uppercase tracking-widest">
                                            {endpoint.description}
                                        </p>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        {/* Price */}
                                        <div className="flex-1 bg-black/60 border border-[#00FFFF]/30 rounded px-2 py-2 text-center">
                                            <div className="text-[10px] font-mono text-[#00FFFF]/50 uppercase mb-0.5">Price</div>
                                            <div className="text-lg font-mono font-bold text-[#00FF88]">
                                                {endpoint.price}
                                            </div>
                                        </div>

                                        {/* Tier */}
                                        <div className="flex-1 bg-black/60 border border-[#00FFFF]/30 rounded px-2 py-2 text-center">
                                            <div className="text-[10px] font-mono text-[#00FFFF]/50 uppercase mb-0.5">Tier</div>
                                            <div className="text-xs font-mono font-bold text-[#00FFFF] uppercase">
                                                {endpoint.tier}
                                            </div>
                                        </div>

                                        {/* Burn */}
                                        <div className="flex-1 bg-black/60 border border-[#00FFFF]/30 rounded px-2 py-2 text-center">
                                            <div className="text-[10px] font-mono text-[#00FFFF]/50 uppercase mb-0.5">Burn</div>
                                            <div className="text-xs font-mono font-bold text-[#FF8800]">
                                                {endpoint.burn}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Query Button - appears on hover */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <div className="px-4 py-2 bg-[#00FFFF]/10 border border-[#00FFFF]/40 rounded hover:bg-[#00FFFF]/20 hover:border-[#00FFFF]/60 transition-all text-center">
                                            <span className="text-sm font-mono font-bold text-[#00FFFF] uppercase tracking-wider">
                                                {isQuerying && selectedEndpoint === endpoint.id ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="animate-spin">⟳</span> PROCESSING
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center justify-center gap-2">
                                                        ▶ QUERY NOW
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Loading overlay */}
                            {isQuerying && selectedEndpoint === endpoint.id && (
                                <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center rounded-2xl">
                                    <div className="text-center">
                                        <div className="w-16 h-16 border-4 border-[#00FFFF]/30 border-t-[#00FFFF] rounded-full animate-spin mx-auto mb-4" />
                                        <div className="text-xl font-mono font-bold text-[#00FFFF] animate-pulse">
                                            QUERYING...
                                        </div>
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Result Display - Terminal Style */}
                {(queryResult || error) && (
                    <div className="mb-8 relative group">
                        <div className="absolute -inset-1 bg-[#00FF88]/30 rounded-xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />

                        <div className={`relative bg-black/95 border-2 border-[#00FF88]/60 rounded-xl p-6 shadow-[0_0_40px_rgba(0,255,136,0.4)] overflow-hidden result-panel ${isClosing ? 'result-hide' : 'result-show'}`}>
                            {/* Terminal scanlines */}
                            <div
                                className="absolute inset-0 pointer-events-none opacity-10 animate-scanline-green"
                            />

                            <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-[#00FF88]/40">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl animate-pulse">{error ? '⚠' : '●'}</span>
                                    <h3 className="text-2xl md:text-3xl font-mono font-black text-[#00FF88] uppercase tracking-wider drop-shadow-[0_0_25px_rgba(0,255,136,1)]">
                                        &gt; {error ? 'ERROR' : 'QUERY RESULT'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => {
                                        // animate hide first, then clear states
                                        setIsClosing(true);
                                        // wait for transition to complete before clearing
                                        if (closeTimeoutRef.current) {
                                            window.clearTimeout(closeTimeoutRef.current);
                                        }
                                        closeTimeoutRef.current = window.setTimeout(() => {
                                            setQueryResult(null);
                                            setError(null);
                                            setSelectedEndpoint(null);
                                            setIsClosing(false);
                                            closeTimeoutRef.current = null;
                                        }, 280);
                                    }}
                                    className="close-button px-5 py-2 text-base font-mono font-bold uppercase tracking-wider bg-[#FF8800]/20 border-2 border-[#FF8800]/60 rounded-lg text-[#FF8800] hover:bg-[#FF8800]/30 hover:border-[#FF8800] hover:shadow-[0_0_20px_rgba(255,136,0,0.6)] transition-all drop-shadow-[0_0_15px_rgba(255,136,0,0.6)]"
                                >
                                    CLOSE
                                </button>
                            </div>

                            {error ? (
                                <p className="text-lg md:text-xl font-mono text-[#FF8800] drop-shadow-[0_0_15px_rgba(255,136,0,0.6)] leading-relaxed">
                                    ❌ {error}
                                </p>
                            ) : (
                                <pre className="text-base md:text-lg font-mono text-[#00FFFF] whitespace-pre-wrap leading-relaxed drop-shadow-[0_0_10px_rgba(0,255,255,0.6)] overflow-x-auto">
                                    {JSON.stringify(queryResult, null, 2)}
                                </pre>
                            )}
                        </div>
                    </div>
                )}

                {/* Info Footer */}
                <div className="mt-6 pt-4 border-t-2 border-[#00FFFF]/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                        <div className="bg-[#00FFFF]/5 border-2 border-[#00FFFF]/40 rounded-lg p-4 hover:border-[#00FFFF]/60 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all">
                            <div className="text-base font-mono text-[#00FF88]/70 uppercase mb-2 tracking-widest">Security</div>
                            <div className="text-xl font-mono text-[#00FFFF] font-bold drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">Buffer Decoding</div>
                        </div>
                        <div className="bg-[#00FFFF]/5 border-2 border-[#00FFFF]/40 rounded-lg p-4 hover:border-[#00FFFF]/60 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all">
                            <div className="text-base font-mono text-[#00FF88]/70 uppercase mb-2 tracking-widest">Rate Limit</div>
                            <div className="text-xl font-mono text-[#00FFFF] font-bold drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">10 Req/Min</div>
                        </div>
                        <div className="bg-[#00FFFF]/5 border-2 border-[#00FFFF]/40 rounded-lg p-4 hover:border-[#00FFFF]/60 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all">
                            <div className="text-base font-mono text-[#00FF88]/70 uppercase mb-2 tracking-widest">Cache</div>
                            <div className="text-xl font-mono text-[#00FFFF] font-bold drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">5 Min Fresh</div>
                        </div>
                    </div>

                    {/* Security Badges */}
                    <div className="flex flex-wrap gap-3 justify-center">
                        <div className="flex items-center gap-2 px-5 py-3 bg-black/80 border-2 border-[#00FFFF]/40 rounded-lg hover:scale-105 transition-transform cursor-default shadow-[0_0_20px_rgba(0,255,255,0.25)]">
                            <span className="text-2xl">🔐</span>
                            <span className="text-base md:text-lg font-mono font-bold uppercase tracking-widest text-[#00FFFF] drop-shadow-[0_0_15px_rgba(0,255,255,1)]">
                                EIP-3009 GASLESS
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-5 py-3 bg-black/80 border-2 border-[#00FF88]/40 rounded-lg hover:scale-105 transition-transform cursor-default shadow-[0_0_20px_rgba(0,255,136,0.25)]">
                            <span className="text-2xl">⚡</span>
                            <span className="text-base md:text-lg font-mono font-bold uppercase tracking-widest text-[#00FF88] drop-shadow-[0_0_15px_rgba(0,255,136,1)]">
                                CDP VERIFIED
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-5 py-3 bg-black/80 border-2 border-[#FF8800]/40 rounded-lg hover:scale-105 transition-transform cursor-default shadow-[0_0_20px_rgba(255,136,0,0.25)]">
                            <span className="text-2xl">🛡️</span>
                            <span className="text-base md:text-lg font-mono font-bold uppercase tracking-widest text-[#FF8800] drop-shadow-[0_0_15px_rgba(255,136,0,1)]">
                                NON-CUSTODIAL
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-5 py-3 bg-black/80 border-2 border-[#00FFFF]/40 rounded-lg hover:scale-105 transition-transform cursor-default shadow-[0_0_20px_rgba(0,255,255,0.25)]">
                            <span className="text-2xl">🔄</span>
                            <span className="text-base md:text-lg font-mono font-bold uppercase tracking-widest text-[#00FFFF] drop-shadow-[0_0_15px_rgba(0,255,255,1)]">
                                HOURLY UPDATES
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes float-in {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes border-flow {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }
                @keyframes symbol-pulse {
                    0%, 100% {
                        filter: drop-shadow(0 0 40px rgba(0, 255, 255, 0.8));
                    }
                    50% {
                        filter: drop-shadow(0 0 60px rgba(0, 255, 255, 1));
                    }
                }
                .animate-float-in {
                    animation: float-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    opacity: 0;
                }
                .animate-symbol-pulse {
                    animation: symbol-pulse 3s ease-in-out infinite;
                }
                /* Result panel show/hide transitions to eliminate abrupt layout jumps */
                .result-panel {
                    transition: transform 240ms cubic-bezier(.2,.9,.2,1), opacity 240ms cubic-bezier(.2,.9,.2,1);
                    will-change: transform, opacity;
                }
                .result-show {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                    pointer-events: auto;
                }
                .result-hide {
                    transform: translateY(12px) scale(0.99);
                    opacity: 0;
                    pointer-events: none;
                }
                /* Close button: subtle press animation */
                .close-button {
                    transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
                }
                .close-button:active {
                    transform: translateY(1px) scale(0.992);
                }
            `}</style>
        </div>
    );
}

