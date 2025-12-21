'use client';

import { useSentiment } from '@/hooks/useSentiment';

interface SentimentDisplayProps {
    token?: string;
    compact?: boolean;
    showRecentCasts?: boolean;
    refreshInterval?: number; // in milliseconds
}

export function SentimentDisplay({
    token = 'VOT',
    compact = false,
    showRecentCasts = true,
    refreshInterval = 30000 // 30 seconds
}: SentimentDisplayProps) {
    const { sentiment, loading, error } = useSentiment(token, refreshInterval);

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment.toLowerCase()) {
            case 'bullish':
            case 'positive':
                return 'text-green-400';
            case 'bearish':
            case 'negative':
                return 'text-red-400';
            default:
                return 'text-yellow-400';
        }
    };

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment.toLowerCase()) {
            case 'bullish':
            case 'positive':
                return '📈';
            case 'bearish':
            case 'negative':
                return '📉';
            default:
                return '➡️';
        }
    };

    if (loading) {
        return (
            <div className="sentiment-loading">
                <div className="animate-pulse flex items-center gap-2">
                    <div className="w-4 h-4 bg-sky-400/30 rounded"></div>
                    <span className="text-sm text-slate-400">Analyzing sentiment...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sentiment-error">
                <span className="text-sm text-red-400">Sentiment analysis unavailable</span>
            </div>
        );
    }

    if (!sentiment) {
        return (
            <div className="sentiment-no-data">
                <span className="text-sm text-slate-400">No sentiment data available</span>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="sentiment-compact flex items-center gap-2">
                <span className="text-lg">{getSentimentIcon(sentiment.overallSentiment)}</span>
                <div className="flex flex-col">
                    <span className={`text-sm font-semibold ${getSentimentColor(sentiment.overallSentiment)}`}>
                        {sentiment.overallSentiment.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400">
                        {sentiment.castCount} casts
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="sentiment-display space-y-4">
            {/* Overall Sentiment */}
            <div className="sentiment-header flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{getSentimentIcon(sentiment.overallSentiment)}</span>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-100">
                            {token} Sentiment
                        </h3>
                        <p className={`text-sm ${getSentimentColor(sentiment.overallSentiment)}`}>
                            {sentiment.overallSentiment.toUpperCase()} • Score: {sentiment.score.toFixed(2)}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-400">
                        {sentiment.castCount} total casts
                    </div>
                    <div className="text-xs text-slate-500">
                        {sentiment.positiveCount} positive • {sentiment.negativeCount} negative
                    </div>
                </div>
            </div>

            {/* Sentiment Breakdown */}
            <div className="sentiment-breakdown grid grid-cols-3 gap-4">
                <div className="sentiment-metric">
                    <div className="text-2xl text-green-400">↗️</div>
                    <div className="text-lg font-semibold text-slate-100">{sentiment.positiveCount}</div>
                    <div className="text-xs text-slate-400">Positive</div>
                </div>
                <div className="sentiment-metric">
                    <div className="text-2xl text-red-400">↘️</div>
                    <div className="text-lg font-semibold text-slate-100">{sentiment.negativeCount}</div>
                    <div className="text-xs text-slate-400">Negative</div>
                </div>
                <div className="sentiment-metric">
                    <div className="text-2xl text-yellow-400">➡️</div>
                    <div className="text-lg font-semibold text-slate-100">
                        {sentiment.castCount - sentiment.positiveCount - sentiment.negativeCount}
                    </div>
                    <div className="text-xs text-slate-400">Neutral</div>
                </div>
            </div>

            {/* Recent Casts */}
            {showRecentCasts && sentiment.recentCasts.length > 0 && (
                <div className="recent-casts">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">Recent Mentions</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {sentiment.recentCasts.slice(0, 5).map((cast, index) => (
                            <div key={index} className="recent-cast p-3 bg-black/20 rounded border border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-400">@{cast.author}</span>
                                    <span className={`text-xs ${getSentimentColor(cast.sentiment)}`}>
                                        {cast.sentiment}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-300 line-clamp-2">{cast.text}</p>
                                <div className="text-xs text-slate-500 mt-1">
                                    {new Date(cast.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
