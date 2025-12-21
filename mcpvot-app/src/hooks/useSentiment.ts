'use client';

import { useCallback, useEffect, useState } from 'react';

interface SentimentData {
    token: string;
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
    score: number;
    castCount: number;
    positiveCount: number;
    negativeCount: number;
    recentCasts: Array<{
        text: string;
        sentiment: string;
        score: number;
        timestamp: string;
        author: string;
    }>;
}

export function useSentiment(token: string = 'VOT', refreshInterval: number = 30000) {
    const [sentiment, setSentiment] = useState<SentimentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSentiment = useCallback(async () => {
        try {
            setError(null);
            const response = await fetch(
                `/api/farcaster/sentiment?token=${token}&limit=20&hours=24`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch sentiment data');
            }

            const data = await response.json();
            setSentiment(data.sentiment);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchSentiment();

        if (refreshInterval > 0) {
            const interval = setInterval(fetchSentiment, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchSentiment, refreshInterval]);

    return {
        sentiment,
        loading,
        error,
        refetch: fetchSentiment
    };
}
