'use client';

import { getUserByFid } from '@/lib/neynar-server';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface TokenMetrics {
    name: string;
    symbol: string;
    change24h: number;
    marketCap: string | number;
    volume24h: string | number;
    castCount?: number;
    sentiment?: string;
    creatorFid?: number;
}

interface CreatorProfile {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    power_badge?: boolean;
}

interface TokenCardProps {
    token: TokenMetrics;
    onUserClick?: (fid: number) => void;
}

export default function FarcasterTokenCard({ token, onUserClick }: TokenCardProps) {
    const [creator, setCreator] = useState<CreatorProfile | null>(null);

    useEffect(() => {
        let cancelled = false;

        const syncCreator = async () => {
            try {
                if (!token.creatorFid) {
                    if (!cancelled) {
                        setCreator(null);
                    }
                    return;
                }

                const user = await getUserByFid(token.creatorFid);
                if (!cancelled) {
                    setCreator(user);
                }
            } catch (error) {
                console.error('Failed to load creator:', error);
            }
        };

        void syncCreator();

        return () => {
            cancelled = true;
        };
    }, [token.creatorFid]);

    return (
        <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/50 transition-all">
            {/* Token Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h4 className="text-lg font-bold text-purple-400">{token.name}</h4>
                    <p className="text-xs text-gray-400">{token.symbol}</p>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-mono ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                    </p>
                    <p className="text-xs text-gray-500">24h</p>
                </div>
            </div>

            {/* Creator Card (Neynar powered) */}
            {creator && (
                <div
                    className="flex items-center gap-2 p-2 bg-purple-900/20 rounded-lg cursor-pointer hover:bg-purple-900/30 transition-colors"
                    onClick={() => onUserClick?.(creator.fid)}
                >
                    <Image
                        src={creator.pfp_url}
                        alt={creator.username}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                        unoptimized
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                            {creator.display_name}
                        </p>
                        <p className="text-xs text-gray-400">@{creator.username}</p>
                    </div>
                    {creator.power_badge && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                            ⚡
                        </span>
                    )}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="bg-black/20 rounded p-2">
                    <p className="text-gray-500">Market Cap</p>
                    <p className="text-purple-300 font-mono">{token.marketCap}</p>
                </div>
                <div className="bg-black/20 rounded p-2">
                    <p className="text-gray-500">Volume</p>
                    <p className="text-purple-300 font-mono">{token.volume24h}</p>
                </div>
                <div className="bg-black/20 rounded p-2">
                    <p className="text-gray-500">Casts</p>
                    <p className="text-blue-300 font-mono">{token.castCount || 0}</p>
                </div>
                <div className="bg-black/20 rounded p-2">
                    <p className="text-gray-500">Sentiment</p>
                    <p className="font-mono">{token.sentiment || '🟡'}</p>
                </div>
            </div>
        </div>
    );
}
