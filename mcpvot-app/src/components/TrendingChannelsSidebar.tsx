'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface TrendingChannel {
    id: string;
    name: string;
    url: string;
    imageUrl: string;
    followerCount: number;
    description?: string;
}

interface TrendingChannelsResponse {
    success: boolean;
    channels: TrendingChannel[];
}

export default function TrendingChannelsSidebar() {
    const [channels, setChannels] = useState<TrendingChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [source, setSource] = useState<'neynar' | 'fallback' | null>(null);

    useEffect(() => {
        const fetchTrendingChannels = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/neynar/trending-channels?limit=8');
                const data: TrendingChannelsResponse = await response.json();

                if (data.success && data.channels) {
                    setChannels(data.channels);
                    setSource((data as unknown as { source?: 'neynar' | 'fallback' }).source ?? null);
                } else {
                    setError('Failed to load trending channels');
                }
            } catch (err) {
                console.error('Error fetching trending channels:', err);
                setError('Network error loading channels');
            } finally {
                setLoading(false);
            }
        };

        fetchTrendingChannels();
        // Refresh every 5 minutes (matches API cache)
        const interval = setInterval(fetchTrendingChannels, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                    <span className="text-xl">🔥</span> Trending Channels
                </h3>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-16 bg-gray-800/50 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const hideCard = source === 'fallback' || channels.length === 0;

    if (error || hideCard) {
        return null;
    }

    return (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
            <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                <span className="text-xl">🔥</span> Trending Channels
            </h3>

            <div className="space-y-2">
                {channels.map((channel, index) => (
                    <motion.a
                        key={channel.id}
                        href={channel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="block group"
                    >
                        <div className="flex items-center gap-3 p-3 bg-gray-800/40 hover:bg-purple-900/20 border border-purple-500/20 hover:border-purple-400/50 rounded-lg transition-all duration-200">
                            {/* Channel Image */}
                            <div className="flex-shrink-0 relative w-12 h-12">
                                <Image
                                    src={channel.imageUrl || '/default-channel.png'}
                                    alt={channel.name}
                                    fill
                                    sizes="48px"
                                    className="rounded-full border-2 border-purple-400/50 group-hover:border-purple-300 object-cover"
                                />
                            </div>

                            {/* Channel Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white text-sm truncate">
                                        {channel.name}
                                    </span>
                                    {index < 3 && (
                                        <span className="text-xs">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>👥 {formatFollowers(channel.followerCount)}</span>
                                </div>
                                {channel.description && (
                                    <p className="text-xs text-gray-500 truncate mt-1">
                                        {channel.description}
                                    </p>
                                )}
                            </div>

                            {/* Arrow */}
                            <div className="flex-shrink-0 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </motion.a>
                ))}
            </div>

            {channels.length === 0 && !loading && (
                <p className="text-sm text-gray-500 text-center py-4">
                    No trending channels found
                </p>
            )}
        </div>
    );
}

function formatFollowers(count: number): string {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
}
