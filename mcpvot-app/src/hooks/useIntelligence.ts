"use client";

import { useEffect, useState } from 'react';

export interface IntelligenceData {
    trading: {
        totalTrades: number;
        successfulTrades: number;
        failedTrades: number;
        totalVolume: number;
        totalGasCost: number;
        totalPnL: number;
        successRate: number;
    };
    burns: {
        totalBurned: number;
        burnCount: number;
        lastBurnAmount: number;
        lastBurnTime: string;
    };
    latestTrades: Array<{
        type: string;
        timestamp: string;
        maxxAmount: number;
        ethAmount: number;
        price: number;
        gasUsed: number;
    }>;
    ecosystem: {
        totalValue: number;
        activeStreams: string[];
        status: string;
    };
}

export function useIntelligence() {
    const [data, setData] = useState<IntelligenceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchIntelligence = async () => {
            try {
                const response = await fetch('/api/intelligence');
                if (!response.ok) {
                    throw new Error('Failed to fetch intelligence data');
                }
                const result = await response.json();
                if (result.success) {
                    setData(result.data);
                    setError(null);
                } else {
                    setError(result.error || 'Unknown error');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchIntelligence();

        // Refresh every 30 seconds
        const interval = setInterval(fetchIntelligence, 30000);

        return () => clearInterval(interval);
    }, []);

    return { data, isLoading, error };
}
