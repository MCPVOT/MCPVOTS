'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface Cast {
    id: string;
    text: string;
    author: {
        fid: number;
        username: string;
        displayName: string;
    };
    timestamp: string;
    embeds?: Array<{
        url: string;
        metadata?: {
            title?: string;
            description?: string;
            image?: string;
        };
    }>;
    sentiment?: {
        score: number;
        label: 'positive' | 'negative' | 'neutral';
        confidence: number;
    };
}

interface CastFeedProps {
    channel?: string;
    limit?: number;
    showSentiment?: boolean;
}

interface NeynarCast {
    hash: string;
    text: string;
    timestamp: string;
    author: {
        fid: number;
        username?: string;
        display_name?: string;
    };
    embeds?: unknown[];
}

interface RemoteCast {
    hash?: string;
    id?: string;
    text?: string;
    timestamp?: string;
    published_at?: string;
    body?: {
        text?: string;
        embeds?: unknown[];
    };
    author?: {
        fid?: number;
        username?: string;
        display_name?: string;
        profile?: {
            displayName?: string;
        };
        viewer_context?: {
            fid?: number;
            username?: string;
        };
    };
    embeds?: unknown[];
}

export function CastFeed({ channel = 'mcpvot', limit = 10, showSentiment = true }: CastFeedProps) {
    const [casts, setCasts] = useState<Cast[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const analyzeSentiment = useCallback(async (text: string) => {
        try {
            const response = await fetch('/api/farcaster/sentiment/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Sentiment analysis failed:', error);
        }
        return null;
    }, []);

    const fetchCasts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/farcaster/casts?channel=${encodeURIComponent(channel)}&limit=${limit}`);

            if (!response.ok) {
                let message = `Farcaster feed error: ${response.status}`;
                try {
                    const errorBody = await response.json();
                    if (errorBody?.error) {
                        message = typeof errorBody.error === 'string'
                            ? errorBody.error
                            : JSON.stringify(errorBody.error);
                    }
                } catch (parseError) {
                    console.warn('Failed to parse Neynar error payload:', parseError);
                }
                throw new Error(message);
            }

            const data = await response.json();
            const responseSource = data.source ?? 'unknown';

            // Transform API response to Cast interface
            let fetchedCasts: Cast[] = [];
            if (Array.isArray(data.casts) && data.casts.length > 0) {
                fetchedCasts = data.casts.map((cast: RemoteCast, index: number) => {
                    const derivedId = cast.hash || cast.id || cast.timestamp || cast.published_at || `${channel}-${index}`;
                    return {
                        id: derivedId,
                        text: cast.text ?? cast.body?.text ?? '',
                        author: {
                            fid: cast.author?.fid ?? cast.author?.viewer_context?.fid ?? 0,
                            username: cast.author?.username || cast.author?.viewer_context?.username || 'unknown',
                            displayName: cast.author?.display_name || cast.author?.profile?.displayName || cast.author?.username || 'Unknown'
                        },
                        timestamp: cast.timestamp ?? cast.published_at ?? new Date().toISOString(),
                        embeds: cast.embeds || cast.body?.embeds || []
                    };
                });
            } else if (Array.isArray(data.result?.casts)) {
                fetchedCasts = data.result.casts.map((cast: NeynarCast) => ({
                    id: cast.hash,
                    text: cast.text,
                    author: {
                        fid: cast.author.fid,
                        username: cast.author.username || 'unknown',
                        displayName: cast.author.display_name || cast.author.username || 'Unknown'
                    },
                    timestamp: cast.timestamp,
                    embeds: cast.embeds || []
                }));
            }

            if (fetchedCasts.length === 0 && responseSource === 'none') {
                console.warn('No Farcaster data available. Confirm Warpcast or Neynar API keys are configured.');
                // Don't throw error, just return empty array
            }

            // Analyze sentiment for each cast if enabled
            if (showSentiment && fetchedCasts.length > 0) {
                const castsWithSentiment = await Promise.all(
                    fetchedCasts.map(async (cast: Cast) => {
                        const sentiment = await analyzeSentiment(cast.text);
                        return {
                            ...cast,
                            sentiment: sentiment ? {
                                score: sentiment.score,
                                label: sentiment.sentiment,
                                confidence: sentiment.confidence
                            } : undefined
                        };
                    })
                );
                fetchedCasts = castsWithSentiment;
            }

            setCasts(fetchedCasts);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch casts from Neynar:', error);
            // Fallback to empty array on error
            setCasts([]);
            if (error instanceof Error && /no farcaster data available/i.test(error.message)) {
                setError('Farcaster API not configured. Add Neynar API key to enable social data.');
            } else if (error instanceof Error && /service unavailable/i.test(error.message)) {
                setError('Farcaster service unavailable. Check network connectivity or retry shortly.');
            } else if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Failed to load Farcaster data');
            }
        } finally {
            setLoading(false);
        }
    }, [channel, limit, showSentiment, analyzeSentiment]);

    useEffect(() => {
        fetchCasts();
    }, [fetchCasts]);

    const getSentimentIcon = (sentiment?: { score: number; label: string; confidence: number }) => {
        if (!sentiment) return null;

        switch (sentiment.label) {
            case 'positive':
                return '🟢';
            case 'negative':
                return '🔴';
            default:
                return '🟡';
        }
    };

    const getSentimentColor = (sentiment?: { score: number; label: string; confidence: number }) => {
        if (!sentiment) return 'text-slate-400';

        switch (sentiment.label) {
            case 'positive':
                return 'text-green-400';
            case 'negative':
                return 'text-red-400';
            default:
                return 'text-yellow-400';
        }
    };

    return (
        <div className="cast-feed space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <span className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400/70">
                    Farcaster Channel // {channel.toUpperCase()}
                </span>
                <button
                    type="button"
                    onClick={fetchCasts}
                    disabled={loading}
                    className="self-start rounded-xl border border-sky-500/40 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-sky-300 transition hover:border-sky-300 hover:text-sky-100 disabled:opacity-60"
                >
                    {loading ? 'Refreshing…' : 'Refresh Feed'}
                </button>
            </div>

            {loading && <div className="cast-feed-loading">Loading mission updates...</div>}

            {!loading && error && (
                <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
                    Unable to load Farcaster activity. {error}
                </div>
            )}

            {!loading && !error && casts.length === 0 && (
                <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-slate-300/80">
                    No casts detected for this channel yet. Share your mission progress on Farcaster to ignite the feed.
                </div>
            )}

            {casts.map((cast) => (
                <div key={cast.id} className="cast-item">
                    <div className="cast-item__header">
                        <div className="flex items-center gap-2">
                            <span className="cast-author">@{cast.author.username}</span>
                            {showSentiment && cast.sentiment && (
                                <div className="flex items-center gap-1">
                                    <span className="text-sm">{getSentimentIcon(cast.sentiment)}</span>
                                    <span className={`text-xs ${getSentimentColor(cast.sentiment)}`}>
                                        {cast.sentiment.label}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        ({cast.sentiment.score.toFixed(1)})
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="cast-timestamp">
                            {new Date(cast.timestamp).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="cast-content">{cast.text}</div>
                    {cast.embeds?.map((embed, index) => (
                        <div key={index} className="cast-embed">
                            {embed.metadata?.image && (
                                <Image
                                    src={embed.metadata.image}
                                    alt={embed.metadata.title || 'Cast embed'}
                                    width={400}
                                    height={200}
                                    className="cast-embed__image"
                                />
                            )}
                            {embed.metadata?.title && (
                                <div className="cast-embed__title">{embed.metadata.title}</div>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
