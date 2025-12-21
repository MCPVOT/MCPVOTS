'use client';

import { createIntelligenceMachine, IntelligenceMachineState } from '@/lib/state/intelligenceMachine';
import { useWebSocketData } from '@/lib/useWebSocketData';
import { useQuery } from '@tanstack/react-query';
import { useMachine } from '@xstate/react';
import { useEffect, useMemo, useRef } from 'react';
import { useLiveData } from './useLiveData';

interface IntelligenceSummary {
    overall_sentiment: string;
    social_engagement_level: string;
    market_attention: string;
    recommendations: string[];
    key_metrics: {
        market_cap?: number;
        total_mentions: number;
        unique_authors: number;
        platform_users?: number;
    };
}

interface IntelligenceResponse {
    token_symbol: string;
    analysis_timestamp: string;
    intelligence_summary: IntelligenceSummary;
    trending_analysis?: {
        top_topics?: Array<{ topic: string; count: number }>;
        top_authors?: Array<{ fid: number; cast_count: number }>;
        total_trending_casts?: number;
    };
    social_intelligence?: {
        sentiment_analysis?: {
            average_sentiment: number;
        };
    };
}

interface X402AgentSummary {
    success: boolean;
    type: string;
    data?: {
        totalAgents?: number;
        agents?: Array<{
            id: number;
            reputation?: { rating?: number };
            metadata?: Record<string, unknown>;
        }>;
        note?: string;
    };
}

type MarqueeTone = 'positive' | 'neutral' | 'negative' | 'warning';

export interface MarqueeItem {
    label: string;
    message: string;
    tone: MarqueeTone;
    timestamp: number;
    source?: string;
}

export interface IntelligenceStreams {
    status: IntelligenceMachineState;
    connection: {
        ws: {
            trading: boolean;
            analytics: boolean;
        };
        httpHealthy: boolean;
        lastHttpSuccessAt: number | null;
        lastWsConnectedAt: number | null;
    };
    realtime: {
        gasGwei?: number;
        transferCostEth?: number;
        networkPressure?: number;
    };
    vot: {
        priceUsd?: number | null;
        priceChange24h?: number | null;
        liquidityUsd?: number | null;
        volume24hUsd?: number | null;
        totalBurned?: number | null;
        lastBurnHash?: string | null;
    };
    trading: {
        strategyState?: string;
        winRate?: number | null;
        totalTrades?: number | null;
        recentProfitUsd?: number | null;
    };
    intelligence: {
        summary?: IntelligenceSummary;
        trendingTopics: Array<{ topic: string; count: number }>;
        socialSentiment?: number;
        analysisTimestamp?: string;
    };
    marquee: {
        items: MarqueeItem[];
        loading: boolean;
    };
    x402: {
        totalAgents?: number;
        highlightAgent?: {
            id: number;
            rating?: number;
            metadata?: Record<string, unknown>;
        } | null;
    };
    loading: boolean;
    errors: {
        intelligence?: string | null;
        x402?: string | null;
    };
    refetch: {
        intelligence: () => Promise<unknown>;
        x402: () => Promise<unknown>;
    };
}

function toTone(sentiment: number | undefined): MarqueeTone {
    if (typeof sentiment !== 'number') return 'neutral';
    if (sentiment > 0.5) return 'positive';
    if (sentiment < -0.5) return 'negative';
    return 'neutral';
}

export function useIntelligenceStreams(): IntelligenceStreams {
    const machine = useMemo(() => createIntelligenceMachine(), []);
    const [machineState, send] = useMachine(machine);

    const liveData = useLiveData();
    const tradingWs = useWebSocketData();

    const httpHealthyRef = useRef<boolean | null>(null);

    const intelligenceQuery = useQuery<IntelligenceResponse, Error>({
        queryKey: ['intelligence-report', 'vot'],
        queryFn: async () => {
            const response = await fetch('/api/clanker-intelligence?symbol=vot&timeWindow=24h');
            if (!response.ok) {
                throw new Error(`Intelligence fetch failed with ${response.status}`);
            }
            return response.json();
        },
        refetchInterval: 60_000,
        staleTime: 30_000,
    });

    const x402Query = useQuery<X402AgentSummary, Error>({
        queryKey: ['x402-agent-summary'],
        queryFn: async () => {
            const response = await fetch('/api/x402/agent-data?type=agents');
            if (!response.ok) {
                throw new Error(`x402 fetch failed with ${response.status}`);
            }
            return response.json();
        },
        refetchInterval: 120_000,
        staleTime: 60_000,
    });

    // WebSocket connectivity signals
    useEffect(() => {
        if (tradingWs.isConnected || liveData.isWsConnected) {
            send({ type: 'WS_CONNECTED' });
        } else {
            send({ type: 'WS_DISCONNECTED' });
        }
    }, [tradingWs.isConnected, liveData.isWsConnected, send]);

    // HTTP health signals
    useEffect(() => {
        const queriesOk = !intelligenceQuery.isError && !x402Query.isError;
        const prev = httpHealthyRef.current;
        if (queriesOk) {
            if (prev === false || prev === null) {
                send({ type: 'HTTP_SUCCESS' });
            }
        } else if (queriesOk === false && prev !== false) {
            send({ type: 'HTTP_FAILURE' });
        }
        httpHealthyRef.current = queriesOk;
    }, [intelligenceQuery.isError, x402Query.isError, send]);

    const marqueeItems: MarqueeItem[] = useMemo(() => {
        const fallbackTimestamp = machineState.context.lastWsConnectedAt ?? machineState.context.lastHttpSuccessAt ?? 0;
        const items: MarqueeItem[] = [];
        const summary = intelligenceQuery.data?.intelligence_summary;
        const sentimentScore = intelligenceQuery.data?.social_intelligence?.sentiment_analysis?.average_sentiment;
        if (summary) {
            items.push({
                label: 'INTEL',
                message: `${summary.overall_sentiment} sentiment // ${summary.market_attention} market`,
                tone: toTone(sentimentScore),
                timestamp: Date.parse(intelligenceQuery.data?.analysis_timestamp ?? '') || fallbackTimestamp,
                source: 'clanker-intelligence',
            });
        }
        if (liveData.gas) {
            items.push({
                label: 'GAS',
                message: `Base ${liveData.gas.gasPrice.gwei.toFixed(2)} gwei // Tx $${liveData.gas.estimates.transfer.costEth.toFixed(4)}`,
                tone: liveData.gas.gasPrice.gwei > 20 ? 'warning' : 'neutral',
                timestamp: fallbackTimestamp,
                source: 'ws-8080',
            });
        }
        if (liveData.burnStats) {
            items.push({
                label: 'VOT',
                message: `Burn total ${liveData.burnStats.totalBurned.toFixed(2)} VOT // events ${liveData.burnStats.burnCount}`,
                tone: 'positive',
                timestamp: liveData.burnStats.lastBurn?.burnedAt ? Date.parse(liveData.burnStats.lastBurn.burnedAt) : fallbackTimestamp,
                source: 'burn-stats',
            });
        }
        if (tradingWs.data?.state) {
            items.push({
                label: 'BOT',
                message: `${tradingWs.data.state} // Δ anchor ${tradingWs.data.delta_anchor.toFixed(4)}`,
                tone: tradingWs.data.delta_anchor >= 0 ? 'positive' : 'negative',
                timestamp: tradingWs.data.timestamp ? Date.parse(tradingWs.data.timestamp) : fallbackTimestamp,
                source: 'trading-ws',
            });
        }
        const totalAgents = x402Query.data?.data?.totalAgents;
        if (typeof totalAgents === 'number') {
            items.push({
                label: 'x402',
                message: `${totalAgents} agents onboarded // kiosk ready`,
                tone: 'neutral',
                timestamp: fallbackTimestamp,
                source: 'x402-registry',
            });
        }
        return items;
    }, [intelligenceQuery.data, liveData.gas, liveData.burnStats, tradingWs.data, x402Query.data, machineState.context.lastHttpSuccessAt, machineState.context.lastWsConnectedAt]);

    const highlightAgent = useMemo(() => {
        const agents = x402Query.data?.data?.agents;
        if (!Array.isArray(agents) || agents.length === 0) {
            return null;
        }
        const sorted = [...agents].sort((a, b) => (b.reputation?.rating ?? 0) - (a.reputation?.rating ?? 0));
        return sorted[0] ?? null;
    }, [x402Query.data]);

    return {
        status: machineState.value as IntelligenceMachineState,
        connection: {
            ws: {
                trading: tradingWs.isConnected,
                analytics: liveData.isWsConnected,
            },
            httpHealthy: !intelligenceQuery.isError && !x402Query.isError,
            lastHttpSuccessAt: machineState.context.lastHttpSuccessAt,
            lastWsConnectedAt: machineState.context.lastWsConnectedAt,
        },
        realtime: {
            gasGwei: liveData.gas?.gasPrice.gwei,
            transferCostEth: liveData.gas?.estimates.transfer.costEth,
            networkPressure: tradingWs.data?.gas_price_gwei,
        },
        vot: {
            priceUsd: liveData.prices?.price ?? tradingWs.data?.maxx_usd ?? null,
            priceChange24h: liveData.prices?.priceChange24h ?? null,
            liquidityUsd: liveData.prices?.liquidity ?? null,
            volume24hUsd: liveData.prices?.volume24h ?? null,
            totalBurned: liveData.burnStats?.totalBurned ?? null,
            lastBurnHash: liveData.burnStats?.lastBurn?.transactionHash ?? null,
        },
        trading: {
            strategyState: tradingWs.data?.state,
            winRate: liveData.trading?.stats.winRate ?? null,
            totalTrades: liveData.trading?.stats.totalTrades ?? null,
            recentProfitUsd: tradingWs.data?.delta_since_last ?? null,
        },
        intelligence: {
            summary: intelligenceQuery.data?.intelligence_summary,
            trendingTopics: intelligenceQuery.data?.trending_analysis?.top_topics ?? [],
            socialSentiment: intelligenceQuery.data?.social_intelligence?.sentiment_analysis?.average_sentiment,
            analysisTimestamp: intelligenceQuery.data?.analysis_timestamp,
        },
        marquee: {
            items: marqueeItems,
            loading: intelligenceQuery.isLoading || x402Query.isLoading,
        },
        x402: {
            totalAgents: x402Query.data?.data?.totalAgents,
            highlightAgent: highlightAgent
                ? {
                    id: highlightAgent.id,
                    rating: highlightAgent.reputation?.rating,
                    metadata: highlightAgent.metadata,
                }
                : null,
        },
        loading:
            liveData.loading ||
            intelligenceQuery.isLoading ||
            x402Query.isLoading,
        errors: {
            intelligence: intelligenceQuery.error?.message ?? null,
            x402: x402Query.error?.message ?? null,
        },
        refetch: {
            intelligence: intelligenceQuery.refetch,
            x402: x402Query.refetch,
        },
    };
}
