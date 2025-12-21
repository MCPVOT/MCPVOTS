'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    ChevronRight,
    Clock,
    Crown,
    ExternalLink,
    Filter,
    ImageIcon,
    RefreshCw,
    Search,
    Sparkles,
    TrendingUp,
    Users
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface RankedToken {
    id: string;
    chainId: number;
    tokenAddress: string;
    token: {
        address: string;
        name: string;
        symbol: string;
        priceData: {
            price: number;
        } | null;
    } | null;
    buyCount: number;
    buyerCount: number;
    buyerCount24h: number;
}

interface RankedNFT {
    id: string;
    collectionAddress: string;
    chainId: number;
}

interface PageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

interface RankingsData {
    tokens: {
        tokens: RankedToken[];
        pageInfo: PageInfo;
    } | null;
    nfts: {
        collections: RankedNFT[];
        pageInfo: PageInfo;
    } | null;
}

const formatPrice = (price: number): string => {
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.0001) return `$${price.toFixed(6)}`;
    return `$${price.toExponential(2)}`;
};

const getChainName = (chainId: number): string => {
    switch (chainId) {
        case 1: return 'Ethereum';
        case 8453: return 'Base';
        case 10: return 'Optimism';
        case 42161: return 'Arbitrum';
        case 137: return 'Polygon';
        default: return `Chain ${chainId}`;
    }
};

const getChainColor = (chainId: number): string => {
    switch (chainId) {
        case 1: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        case 8453: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        case 10: return 'text-red-400 bg-red-500/10 border-red-500/30';
        case 42161: return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
        case 137: return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
        default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
};

export default function RankingsPage() {
    const [rankings, setRankings] = useState<RankingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fid, setFid] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'tokens' | 'nfts'>('tokens');

    const fetchRankings = useCallback(async (fidValue?: string) => {
        try {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams({ type: 'rankings', limit: '20' });
            if (fidValue) params.set('fid', fidValue);
            
            const response = await fetch(`/api/farcaster/intelligence?${params}`);
            const data = await response.json();
            
            if (data.success) {
                setRankings(data.data);
            } else {
                setError(data.error || 'Failed to fetch rankings');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRankings();
    }, [fetchRankings]);

    const handleFidSearch = () => {
        if (fid.trim()) {
            fetchRankings(fid.trim());
        } else {
            fetchRankings();
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] safe-top safe-bottom">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-10">
                {/* Header */}
                <motion.header 
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-[2px]">
                            <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-purple-400" />
                            </div>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-orbitron font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Social Rankings
                        </h1>
                    </div>
                    
                    <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto mb-6">
                        Real-time token & NFT rankings based on Farcaster social graph activity
                    </p>

                    {/* FID Search */}
                    <div className="flex items-center justify-center gap-2 max-w-md mx-auto mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={fid}
                                onChange={(e) => setFid(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFidSearch()}
                                placeholder="Enter Farcaster FID for personalized rankings..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 transition-colors"
                            />
                        </div>
                        <motion.button
                            onClick={handleFidSearch}
                            className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors"
                            whileTap={{ scale: 0.95 }}
                        >
                            <Filter className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                            onClick={() => fetchRankings(fid || undefined)}
                            disabled={loading}
                            className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            whileTap={{ scale: 0.95 }}
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </motion.button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => setActiveTab('tokens')}
                            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                                activeTab === 'tokens'
                                    ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                                    : 'bg-black/30 border border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Tokens
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('nfts')}
                            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                                activeTab === 'nfts'
                                    ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                                    : 'bg-black/30 border border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                NFTs
                            </span>
                        </button>
                    </div>
                </motion.header>

                {/* Error State */}
                {error && (
                    <motion.div 
                        className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p>{error}</p>
                    </motion.div>
                )}

                {/* Loading State */}
                {loading && !rankings && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                            <p className="text-gray-400">Loading rankings...</p>
                        </div>
                    </div>
                )}

                {/* Token Rankings */}
                <AnimatePresence mode="wait">
                    {activeTab === 'tokens' && rankings?.tokens && (
                        <motion.div
                            key="tokens"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-yellow-400" />
                                    Trending Tokens
                                    {fid && <span className="text-sm text-purple-400">(FID: {fid})</span>}
                                </h2>
                                <span className="text-sm text-gray-500">
                                    {rankings.tokens.tokens.length} tokens
                                </span>
                            </div>

                            <div className="grid gap-3">
                                {rankings.tokens.tokens.map((token, index) => (
                                    <motion.div
                                        key={token.id}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="visible"
                                        transition={{ delay: index * 0.05 }}
                                        className="p-4 rounded-xl bg-gradient-to-r from-black/50 to-black/30 border border-gray-800 hover:border-purple-500/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Rank */}
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                                                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                index === 1 ? 'bg-gray-400/20 text-gray-300' :
                                                index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-gray-800 text-gray-500'
                                            }`}>
                                                #{index + 1}
                                            </div>

                                            {/* Token Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-white truncate">
                                                        {token.token?.name || 'Unknown'}
                                                    </h3>
                                                    <span className="text-sm text-gray-500">
                                                        {token.token?.symbol || '???'}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getChainColor(token.chainId)}`}>
                                                        {getChainName(token.chainId)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 font-mono truncate">
                                                    {token.tokenAddress}
                                                </p>
                                            </div>

                                            {/* Stats */}
                                            <div className="hidden md:flex items-center gap-6">
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-white">
                                                        {token.buyCount.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Buys</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-purple-400">
                                                        {token.buyerCount.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Buyers</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-green-400">
                                                        {token.buyerCount24h.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">24h</p>
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="text-right">
                                                <p className="text-lg font-mono text-white">
                                                    {token.token?.priceData?.price 
                                                        ? formatPrice(token.token.priceData.price)
                                                        : 'N/A'
                                                    }
                                                </p>
                                            </div>

                                            {/* Link */}
                                            <a
                                                href={`https://dexscreener.com/${token.chainId === 8453 ? 'base' : 'ethereum'}/${token.tokenAddress}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>

                                        {/* Mobile Stats */}
                                        <div className="md:hidden flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                                            <div className="flex items-center gap-1 text-sm">
                                                <Activity className="w-4 h-4 text-gray-500" />
                                                <span className="text-white">{token.buyCount}</span>
                                                <span className="text-gray-500">buys</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                <span className="text-purple-400">{token.buyerCount}</span>
                                                <span className="text-gray-500">buyers</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                <span className="text-green-400">{token.buyerCount24h}</span>
                                                <span className="text-gray-500">24h</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {rankings.tokens.pageInfo.hasNextPage && (
                                <div className="text-center pt-4">
                                    <button className="px-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors">
                                        Load More <ChevronRight className="inline w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* NFT Rankings */}
                    {activeTab === 'nfts' && rankings?.nfts && (
                        <motion.div
                            key="nfts"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-blue-400" />
                                    Trending NFT Collections
                                    {fid && <span className="text-sm text-blue-400">(FID: {fid})</span>}
                                </h2>
                                <span className="text-sm text-gray-500">
                                    {rankings.nfts.collections.length} collections
                                </span>
                            </div>

                            <div className="grid gap-3">
                                {rankings.nfts.collections.map((collection, index) => (
                                    <motion.div
                                        key={collection.id}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="visible"
                                        transition={{ delay: index * 0.05 }}
                                        className="p-4 rounded-xl bg-gradient-to-r from-black/50 to-black/30 border border-gray-800 hover:border-blue-500/30 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Rank */}
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                                                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                index === 1 ? 'bg-gray-400/20 text-gray-300' :
                                                index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-gray-800 text-gray-500'
                                            }`}>
                                                #{index + 1}
                                            </div>

                                            {/* Collection Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <ImageIcon className="w-5 h-5 text-blue-400" />
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getChainColor(collection.chainId)}`}>
                                                        {getChainName(collection.chainId)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 font-mono truncate mt-1">
                                                    {collection.collectionAddress}
                                                </p>
                                            </div>

                                            {/* Link */}
                                            <a
                                                href={`https://opensea.io/assets/${collection.chainId === 8453 ? 'base' : 'ethereum'}/${collection.collectionAddress}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {rankings.nfts.pageInfo.hasNextPage && (
                                <div className="text-center pt-4">
                                    <button className="px-6 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors">
                                        Load More <ChevronRight className="inline w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <motion.footer 
                    className="text-center pt-8 pb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <p className="text-xs text-gray-500">
                        Powered by Zapper GraphQL API • Real-time Farcaster social graph rankings
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        Enter a Farcaster FID to see personalized rankings based on social connections
                    </p>
                </motion.footer>
            </div>
        </div>
    );
}
