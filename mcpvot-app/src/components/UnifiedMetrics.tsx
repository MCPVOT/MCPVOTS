'use client';

import StatusTicker, { type StatusIndicator } from '@/components/StatusTicker';
import { useIntelligenceStreams } from '@/hooks/useIntelligenceStreams';

interface UnifiedMetricsProps {
    compact?: boolean;
    showTicker?: boolean;
}

type TrendDirection = 'up' | 'down' | undefined;

interface MetricCard {
    label: string;
    value: string;
    unit?: string;
    trend?: TrendDirection;
    icon: string;
}

const indicatorHintMap: Record<string, string> = {
    connecting: 'CONNECTING',
    live: 'LIVE',
    degraded: 'DEGRADED',
    offline: 'OFFLINE',
};

const trendIcon = (trend: TrendDirection) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return null;
};

const formatNumber = (value: number | null | undefined, fractionDigits = 2) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '---';
    }
    return value.toFixed(fractionDigits);
};

const formatUsd = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '---';
    }
    if (Math.abs(value) >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toFixed(2);
};

const sentimentFromSummary = (sentiment?: string) => {
    return sentiment ? sentiment.toUpperCase() : '---';
};

const toIndicatorState = (state: string): 'online' | 'offline' | 'degraded' | 'connecting' => {
    if (state === 'live') return 'online';
    if (state === 'degraded') return 'degraded';
    if (state === 'offline') return 'offline';
    return 'connecting';
};

export default function UnifiedMetrics({ compact = false, showTicker = true }: UnifiedMetricsProps) {
    const streams = useIntelligenceStreams();
    const { realtime, trading, vot, intelligence, marquee, connection, status } = streams;

    const gasTrend: TrendDirection =
        realtime.gasGwei !== null && realtime.gasGwei !== undefined
            ? realtime.gasGwei < 50
                ? 'up'
                : 'down'
            : undefined;

    const winRateTrend: TrendDirection =
        trading.winRate !== null && trading.winRate !== undefined
            ? trading.winRate > 50
                ? 'up'
                : 'down'
            : undefined;

    const volumeTrend: TrendDirection =
        vot.priceChange24h !== null && vot.priceChange24h !== undefined
            ? vot.priceChange24h >= 0
                ? 'up'
                : 'down'
            : undefined;

    const sentimentTrend: TrendDirection =
        intelligence.socialSentiment !== null && intelligence.socialSentiment !== undefined
            ? intelligence.socialSentiment > 0.1
                ? 'up'
                : intelligence.socialSentiment < -0.1
                    ? 'down'
                    : undefined
            : undefined;

    const metrics: MetricCard[] = [
        {
            label: 'GAS',
            value: formatNumber(realtime.gasGwei, 2),
            unit: realtime.gasGwei !== null && realtime.gasGwei !== undefined ? 'GWEI' : undefined,
            trend: gasTrend,
            icon: '⛽',
        },
        {
            label: 'WIN RATE',
            value: formatNumber(trading.winRate, 1),
            unit: trading.winRate !== null && trading.winRate !== undefined ? '%' : undefined,
            trend: winRateTrend,
            icon: '🎯',
        },
        {
            label: 'VOLUME',
            value: formatUsd(vot.volume24hUsd),
            unit: vot.volume24hUsd !== null && vot.volume24hUsd !== undefined ? 'USD' : undefined,
            trend: volumeTrend,
            icon: '💎',
        },
        {
            label: 'SENTIMENT',
            value: sentimentFromSummary(intelligence.summary?.overall_sentiment),
            trend: sentimentTrend,
            icon: '📊',
        },
        {
            label: 'VOT BURNED',
            value: formatNumber(vot.totalBurned ?? null, 2),
            unit: vot.totalBurned !== null && vot.totalBurned !== undefined ? 'VOT' : undefined,
            icon: '🔥',
        },
    ];

    if (compact) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {metrics.map((metric) => (
                    <div key={metric.label} className="cyber-chip text-center">
                        <div className="text-xs text-cyan-400/70 uppercase tracking-wider">
                            {metric.icon} {metric.label}
                        </div>
                        <div className="text-lg font-bold text-cyan-300">
                            {metric.value}
                            {metric.unit && <span className="text-sm ml-1">{metric.unit}</span>}
                        </div>
                        {metric.trend && (
                            <div className={`text-xs ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                {trendIcon(metric.trend)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    const statusIndicators: StatusIndicator[] = [
        {
            label: 'WS • TRADING',
            status: connection.ws.trading ? 'online' : 'offline',
        },
        {
            label: 'WS • ANALYTICS',
            status: connection.ws.analytics ? 'online' : 'offline',
        },
        {
            label: 'HTTP • APIs',
            status: connection.httpHealthy ? 'online' : 'offline',
        },
        {
            label: 'STREAM STATE',
            status: toIndicatorState(status),
            hint: indicatorHintMap[status] ?? status.toUpperCase(),
        },
    ];

    if (showTicker) {
        return (
            <div className="space-y-4">
                <StatusTicker
                    items={marquee.items}
                    loading={marquee.loading}
                    statusIndicators={statusIndicators}
                    accent="blue"
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {metrics.map((metric) => (
                        <div key={metric.label} className="identity-badge">
                            <div className="identity-badge__meta">
                                <div className="identity-badge__meta-chip">
                                    {metric.icon} {metric.label}
                                </div>
                            </div>
                            <div className="identity-badge__value">
                                {metric.value}
                                {metric.unit && <span className="text-sm opacity-75 ml-1">{metric.unit}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
                <div key={metric.label} className="cyber-card cyber-card--blue">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-orbitron-tight text-cyan-400">
                            {metric.icon} {metric.label}
                        </span>
                        {metric.trend && (
                            <span className={`text-lg ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                {trendIcon(metric.trend)}
                            </span>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-cyan-300 font-orbitron">
                        {metric.value}
                        {metric.unit && <span className="text-sm ml-1 opacity-75">{metric.unit}</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}
