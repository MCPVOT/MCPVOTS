'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    BarChart3,
    Check,
    Clock,
    Coins,
    Copy,
    ExternalLink,
    Flame,
    Globe,
    Lock,
    RefreshCw,
    Sparkles,
    TrendingUp,
    Unlock,
    Wallet,
    Zap
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// Types
interface BurnStats {
    totalBurned: number;
    burnCount: number;
    burnRate: number;
    burned24h: number;
    burned7d: number;
    burned30d: number;
    lastBurnTime: string | null;
    circulatingSupply: number;
    maxSupply: number;
    burnedPercentage: number;
    tokenomics: {
        lpAllocation: number;
        vaultAllocation: number;
        vaultUnlockDate: string;
        fullyVestedDate: string;
        deployDate: string;
        totalFee: number;
        clankerFee: number;
        protocolFee: number;
    };
    facilitator: {
        burnPerTransaction: number;
        maxxBonusVOT: number;
        treasuryGasCover: number;
    };
    source: string;
    timestamp: string;
}

interface ApiResponse {
    success: boolean;
    data: BurnStats;
    token: {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        chain: string;
        chainId: number;
    };
}

// Format large numbers
const formatNumber = (num: number, decimals = 2): string => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(decimals)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
};

// Format date
const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
};

// Time until date
const getTimeUntil = (dateStr: string): string => {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return 'Unlocked';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 30) return `${Math.floor(days / 30)} months`;
    return `${days} days`;
};

export default function TokenomicsPage() {
    const [burnStats, setBurnStats] = useState<BurnStats | null>(null);
    const [token, setToken] = useState<ApiResponse['token'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchBurnStats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/x402/burn-stats');
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data: ApiResponse = await response.json();
            
            if (data.success) {
                setBurnStats(data.data);
                setToken(data.token);
                setError(null);
            } else {
                throw new Error('Failed to fetch burn stats');
            }
        } catch (err) {
            console.error('Error fetching burn stats:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBurnStats();
        
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchBurnStats, 60000);
        return () => clearInterval(interval);
    }, [fetchBurnStats]);

    const copyAddress = async () => {
        if (token?.address) {
            await navigator.clipboard.writeText(token.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { duration: 0.4, ease: 'easeOut' }
        },
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    if (loading && !burnStats) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex items-center justify-center safe-top safe-bottom">
                <motion.div 
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="w-16 h-16 border-4 border-[#00FF88]/30 border-t-[#00FF88] rounded-full animate-spin" />
                    <p className="text-[#00FF88] font-orbitron text-sm">Loading VOT Tokenomics...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] safe-top safe-bottom">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00FF88]/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/3 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-10">
                {/* Header */}
                <motion.header 
                    className="text-center mb-8 md:mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="relative">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00FFFF] p-[2px]">
                                <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                                    <Coins className="w-6 h-6 md:w-8 md:h-8 text-[#00FF88]" />
                                </div>
                            </div>
                            <motion.div 
                                className="absolute -top-1 -right-1 w-4 h-4 bg-[#00FF88] rounded-full"
                                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-orbitron font-bold bg-gradient-to-r from-[#00FF88] via-[#00FFFF] to-[#00FF88] bg-clip-text text-transparent">
                            VOT Tokenomics
                        </h1>
                    </div>
                    
                    <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto mb-4">
                        Deflationary token powering the MCPVOT ecosystem • x402 Protocol • Clanker Deployed
                    </p>

                    {/* Token Address Badge */}
                    {token && (
                        <motion.button
                            onClick={copyAddress}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/30 hover:border-[#00FF88]/60 transition-all group touch-target"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Globe className="w-4 h-4 text-[#00FF88]" />
                            <span className="text-xs md:text-sm font-mono text-gray-300">
                                {token.address.slice(0, 6)}...{token.address.slice(-4)}
                            </span>
                            <AnimatePresence mode="wait">
                                {copied ? (
                                    <motion.div
                                        key="check"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <Check className="w-4 h-4 text-[#00FF88]" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="copy"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <Copy className="w-4 h-4 text-gray-400 group-hover:text-[#00FF88] transition-colors" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    )}
                </motion.header>

                {/* Error State */}
                {error && (
                    <motion.div 
                        className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p>{error}</p>
                        <button 
                            onClick={fetchBurnStats}
                            className="mt-2 text-sm underline hover:text-red-300"
                        >
                            Retry
                        </button>
                    </motion.div>
                )}

                {burnStats && (
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        {/* Hero Burn Stats */}
                        <motion.div 
                            variants={cardVariants}
                            className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-orange-500/10 via-red-500/10 to-yellow-500/10 border border-orange-500/30 p-6 md:p-8"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-xl bg-orange-500/20">
                                        <Flame className="w-6 h-6 md:w-8 md:h-8 text-orange-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-orbitron font-bold text-orange-400">
                                            🔥 Total Burned
                                        </h2>
                                        <p className="text-sm text-gray-400">Deflationary Burns</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                    <div className="text-center md:text-left">
                                        <p className="text-3xl md:text-5xl font-bold text-white font-mono">
                                            {formatNumber(burnStats.totalBurned)}
                                        </p>
                                        <p className="text-xs md:text-sm text-gray-400 mt-1">VOT Burned Forever</p>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <p className="text-2xl md:text-4xl font-bold text-orange-400 font-mono">
                                            {burnStats.burnCount}
                                        </p>
                                        <p className="text-xs md:text-sm text-gray-400 mt-1">Burn Events</p>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <p className="text-2xl md:text-4xl font-bold text-yellow-400 font-mono">
                                            {burnStats.burnedPercentage.toFixed(4)}%
                                        </p>
                                        <p className="text-xs md:text-sm text-gray-400 mt-1">Supply Burned</p>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <p className="text-2xl md:text-4xl font-bold text-red-400 font-mono">
                                            {burnStats.facilitator.burnPerTransaction}%
                                        </p>
                                        <p className="text-xs md:text-sm text-gray-400 mt-1">Per x402 Buy</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Supply & Distribution Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Supply Card */}
                            <motion.div 
                                variants={cardVariants}
                                className="rounded-2xl bg-gradient-to-br from-[#001a1a]/80 to-[#000d0d]/90 border border-[#00FF88]/30 p-5 md:p-6 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2.5 rounded-lg bg-[#00FF88]/10">
                                        <BarChart3 className="w-5 h-5 text-[#00FF88]" />
                                    </div>
                                    <h3 className="text-lg font-orbitron font-semibold text-[#00FF88]">
                                        Supply Metrics
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-black/30">
                                        <span className="text-gray-400 text-sm">Max Supply</span>
                                        <span className="text-white font-mono font-semibold">
                                            {formatNumber(burnStats.maxSupply, 0)} VOT
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-black/30">
                                        <span className="text-gray-400 text-sm">Circulating</span>
                                        <span className="text-[#00FF88] font-mono font-semibold">
                                            {formatNumber(burnStats.circulatingSupply, 0)} VOT
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-black/30">
                                        <span className="text-gray-400 text-sm">Burned</span>
                                        <span className="text-orange-400 font-mono font-semibold">
                                            {formatNumber(burnStats.totalBurned, 0)} VOT
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Burn Progress</span>
                                            <span>{burnStats.burnedPercentage.toFixed(4)}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-black/50 overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(burnStats.burnedPercentage * 100, 100)}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Distribution Card */}
                            <motion.div 
                                variants={cardVariants}
                                className="rounded-2xl bg-gradient-to-br from-[#1a1a00]/80 to-[#0d0d00]/90 border border-yellow-500/30 p-5 md:p-6 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2.5 rounded-lg bg-yellow-500/10">
                                        <Wallet className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <h3 className="text-lg font-orbitron font-semibold text-yellow-400">
                                        Distribution
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-black/30 border border-[#00FF88]/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-[#00FF88]" />
                                                <span className="text-white font-semibold">Liquidity Pool</span>
                                            </div>
                                            <span className="text-2xl font-bold text-[#00FF88]">
                                                {burnStats.tokenomics.lpAllocation}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">Clanker DEX Liquidity</p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-black/30 border border-purple-500/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-4 h-4 text-purple-400" />
                                                <span className="text-white font-semibold">Vaulted</span>
                                            </div>
                                            <span className="text-2xl font-bold text-purple-400">
                                                {burnStats.tokenomics.vaultAllocation}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Unlock: {formatDate(burnStats.tokenomics.vaultUnlockDate)}</span>
                                            <span className="text-purple-400">{getTimeUntil(burnStats.tokenomics.vaultUnlockDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Fee Structure & x402 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            {/* Fee Breakdown */}
                            <motion.div 
                                variants={cardVariants}
                                className="rounded-2xl bg-gradient-to-br from-[#1a0020]/80 to-[#0d000d]/90 border border-purple-500/30 p-5 md:p-6 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 rounded-lg bg-purple-500/10">
                                        <TrendingUp className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-orbitron font-semibold text-purple-400">
                                        Clanker Fees
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Protocol Fee</span>
                                        <span className="text-purple-300 font-mono">{burnStats.tokenomics.protocolFee}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Clanker Fee</span>
                                        <span className="text-purple-300 font-mono">{burnStats.tokenomics.clankerFee}%</span>
                                    </div>
                                    <div className="h-px bg-purple-500/30 my-2" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-semibold">Total Fee</span>
                                        <span className="text-purple-400 font-mono font-bold">{burnStats.tokenomics.totalFee}%</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* x402 Facilitator */}
                            <motion.div 
                                variants={cardVariants}
                                className="rounded-2xl bg-gradient-to-br from-[#001a20]/80 to-[#000d10]/90 border border-cyan-500/30 p-5 md:p-6 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 rounded-lg bg-cyan-500/10">
                                        <Zap className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <h3 className="text-lg font-orbitron font-semibold text-cyan-400">
                                        x402 Protocol
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Burn/Purchase</span>
                                        <span className="text-orange-400 font-mono font-bold">
                                            🔥 {burnStats.facilitator.burnPerTransaction}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">MAXX Bonus</span>
                                        <span className="text-cyan-300 font-mono">
                                            +{formatNumber(burnStats.facilitator.maxxBonusVOT, 0)} VOT
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Gas Cover</span>
                                        <span className="text-green-400 font-mono">
                                            ${burnStats.facilitator.treasuryGasCover}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Timeline */}
                            <motion.div 
                                variants={cardVariants}
                                className="rounded-2xl bg-gradient-to-br from-[#0a1a0a]/80 to-[#050d05]/90 border border-green-500/30 p-5 md:p-6 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 rounded-lg bg-green-500/10">
                                        <Clock className="w-5 h-5 text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-orbitron font-semibold text-green-400">
                                        Timeline
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Deploy Date</span>
                                        <span className="text-green-300 font-mono text-sm">
                                            {formatDate(burnStats.tokenomics.deployDate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1">
                                            <Unlock className="w-3 h-3 text-yellow-400" />
                                            <span className="text-gray-400 text-sm">Vault Unlock</span>
                                        </div>
                                        <span className="text-yellow-300 font-mono text-sm">
                                            {formatDate(burnStats.tokenomics.vaultUnlockDate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 text-purple-400" />
                                            <span className="text-gray-400 text-sm">Fully Vested</span>
                                        </div>
                                        <span className="text-purple-300 font-mono text-sm">
                                            {formatDate(burnStats.tokenomics.fullyVestedDate)}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Time-based Burns */}
                        <motion.div 
                            variants={cardVariants}
                            className="rounded-2xl bg-gradient-to-br from-[#1a0a0a]/80 to-[#0d0505]/90 border border-red-500/30 p-5 md:p-6 backdrop-blur-sm"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-red-500/10">
                                        <Activity className="w-5 h-5 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-orbitron font-semibold text-red-400">
                                        Burn Activity
                                    </h3>
                                </div>
                                <motion.button
                                    onClick={fetchBurnStats}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors touch-target"
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    <span className="hidden md:inline">Refresh</span>
                                </motion.button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl bg-black/30 text-center">
                                    <p className="text-2xl md:text-3xl font-bold text-white font-mono">
                                        {formatNumber(burnStats.burned24h)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">24H Burns</p>
                                </div>
                                <div className="p-4 rounded-xl bg-black/30 text-center">
                                    <p className="text-2xl md:text-3xl font-bold text-white font-mono">
                                        {formatNumber(burnStats.burned7d)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">7D Burns</p>
                                </div>
                                <div className="p-4 rounded-xl bg-black/30 text-center">
                                    <p className="text-2xl md:text-3xl font-bold text-white font-mono">
                                        {formatNumber(burnStats.burned30d)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">30D Burns</p>
                                </div>
                                <div className="p-4 rounded-xl bg-black/30 text-center">
                                    <p className="text-sm md:text-base font-mono text-gray-300">
                                        {burnStats.lastBurnTime 
                                            ? new Date(burnStats.lastBurnTime).toLocaleDateString()
                                            : 'N/A'
                                        }
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Last Burn</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Links */}
                        <motion.div 
                            variants={cardVariants}
                            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
                        >
                            <a 
                                href={`https://basescan.org/token/${token?.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all touch-target"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span className="text-sm font-semibold">Basescan</span>
                            </a>
                            <a 
                                href={`https://dexscreener.com/base/${token?.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all touch-target"
                            >
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-sm font-semibold">DEXScreener</span>
                            </a>
                            <a 
                                href={`https://dune.com/queries/${burnStats.source === 'dune' ? '6177826' : ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all touch-target"
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span className="text-sm font-semibold">Dune</span>
                            </a>
                            <a 
                                href="https://warpcast.com/~/channel/mcpvot"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all touch-target"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-semibold">Warpcast</span>
                            </a>
                        </motion.div>

                        {/* Footer */}
                        <motion.footer 
                            variants={cardVariants}
                            className="text-center pt-6 pb-4"
                        >
                            <p className="text-xs text-gray-500">
                                Data source: {burnStats.source === 'dune' ? 'Dune Analytics' : 'Fallback'} • 
                                Last updated: {new Date(burnStats.timestamp).toLocaleTimeString()} • 
                                Query ID: {burnStats.source === 'dune' ? '6177826' : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-600 mt-2">
                                Built on Base • Powered by x402 Protocol • Clanker Deployed
                            </p>
                        </motion.footer>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
