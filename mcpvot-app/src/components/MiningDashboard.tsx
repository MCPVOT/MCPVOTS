'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useWebSocketData } from '../lib/useWebSocketData';

export default function MiningDashboard() {
    const [miningRate, setMiningRate] = useState(0.001);
    const [totalMined, setTotalMined] = useState(0);
    const [isMining, setIsMining] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const { address } = useAccount();
    const { data: balance } = useBalance({ address });
    const { data: wsData, isConnected } = useWebSocketData();

    // Mining stats query - now uses real WebSocket data
    const { data: miningStats } = useQuery({
        queryKey: ['mining-stats', address],
        queryFn: async () => {
            // Use real data from WebSocket if available
            if (!address) return { miningRate: 0, totalMined: 0, status: 'inactive', lastUpdate: new Date().toISOString() };

            // Use real data from WebSocket if available
            if (wsData) {
                return {
                    miningRate: (wsData.maxx_balance || 0) * 0.1, // MAXX balance * 0.1 as mining rate
                    totalMined: wsData.maxx_balance || 0,
                    status: wsData.state === 'HOLD' ? 'active' : 'inactive',
                    lastUpdate: new Date().toISOString(),
                    portfolioValue: ((wsData.eth_balance || 0) * (wsData.eth_usd || 0)) + ((wsData.maxx_balance || 0) * (wsData.maxx_usd || 0)),
                    currentPrice: wsData.maxx_usd || 0,
                    ethPrice: wsData.eth_usd || 0,
                    deltaPercent: wsData.delta_anchor || 0
                };
            }

            // No fallback data - show zeros when disconnected
            return {
                miningRate: 0,
                totalMined: 0,
                status: 'inactive',
                lastUpdate: new Date().toISOString(),
                portfolioValue: 0,
                currentPrice: 0,
                ethPrice: 0,
                deltaPercent: 0
            };
        },
        enabled: !!address,
        refetchInterval: 5000,
    });

    // Update mining stats
    useEffect(() => {
        if (!miningStats) return;
        // Defer state updates to avoid synchronous setState inside effect
        const id = setTimeout(() => {
            setMiningRate(miningStats.miningRate);
            setTotalMined(miningStats.totalMined);
            setLastUpdate(new Date(miningStats.lastUpdate));
        }, 0);
        return () => clearTimeout(id);
    }, [miningStats]);

    // Auto-mine when active
    useEffect(() => {
        if (isMining) {
            const interval = setInterval(() => {
                setTotalMined(prev => prev + miningRate);
                setLastUpdate(new Date());
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isMining, miningRate]);

    const toggleMining = () => {
        setIsMining(!isMining);
    };

    const portfolioValue = miningStats?.portfolioValue;
    const ethPrice = miningStats?.ethPrice; // may be undefined when no live data

    // Display helpers to avoid showing hard-coded fallbacks
    // Display helpers intentionally omitted to avoid unused helper lint warnings

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-400">
                    {isConnected ? 'Live Trading Data' : 'Waiting for Trading System Connection'}
                </span>
            </div>

            {/* Header */}
            <div className="border-b border-green-400/30 pb-3 mb-4">
                <h2 className="text-green-400 font-mono text-lg font-bold tracking-wide text-center">
                    [MCPVOT MINING DASHBOARD]
                </h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* ETH Balance */}
                <div className="bg-gray-900 border border-green-400/30 rounded-lg p-4 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/10">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="h-5 w-5 text-green-400 animate-pulse">Ξ</div>
                        <div className="text-green-400/70 font-mono text-xs font-bold tracking-wide">ETH BALANCE</div>
                    </div>
                    <div className="text-green-400 font-mono text-lg font-bold">
                        {wsData?.eth_balance?.toFixed(4) || balance?.formatted || '0.0000'} {balance?.symbol || 'ETH'}
                    </div>
                    <div className="text-green-400/60 font-mono text-xs">
                        {(wsData?.eth_balance != null && ethPrice != null) ? (`$${((wsData.eth_balance) * ethPrice).toFixed(2)} USD`) : '—'}
                    </div>
                </div>

                {/* MAXX Price */}
                <div className="bg-gray-900 border border-green-400/30 rounded-lg p-4 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/10">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="h-5 w-5 text-green-400 animate-pulse">💎</div>
                        <div className="text-green-400/70 font-mono text-xs font-bold tracking-wide">MAXX PRICE</div>
                    </div>
                    <div className="text-green-400 font-mono text-lg font-bold">
                        {wsData?.maxx_usd != null ? `$${wsData.maxx_usd.toFixed(7)}` : '—'}
                    </div>
                    <div className={`text-xs font-mono ${(wsData?.delta_anchor || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {wsData?.delta_anchor != null ? `${wsData.delta_anchor >= 0 ? '+' : ''}${wsData.delta_anchor.toFixed(2)}%` : '—'}
                    </div>
                </div>

                {/* Mining Rate */}
                <div className="relative bg-gray-900 border border-green-400/30 rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/10 hover:border-green-400/40">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="h-5 w-5 text-green-400 animate-pulse">⚡</div>
                        <div className="text-green-400/80 font-mono text-xs font-bold tracking-wide">MINING RATE</div>
                    </div>
                    <div className="text-green-400 font-mono text-lg font-bold">
                        {miningRate.toFixed(4)} MAXX/min
                    </div>
                </div>

                {/* Total Mined */}
                <div className="bg-gray-900 border border-green-400/30 rounded-lg p-4 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/10">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="h-5 w-5 text-green-400 animate-pulse">⛏️</div>
                        <div className="text-green-400/70 font-mono text-xs font-bold tracking-wide">TOTAL MINED</div>
                    </div>
                    <div className="text-green-400 font-mono text-lg font-bold">
                        {totalMined.toFixed(2)} MAXX
                    </div>
                    <div className="text-green-400/60 font-mono text-xs">
                        {(wsData?.maxx_usd != null) ? (`$${(totalMined * wsData.maxx_usd).toFixed(2)} USD`) : '—'}
                    </div>
                </div>

                {/* Portfolio Overview */}
                <div className="bg-gray-900 border border-green-400/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-green-400 font-mono text-sm font-bold tracking-wide">PORTFOLIO OVERVIEW</h3>
                        <div className={`px-3 py-1 rounded text-xs font-mono font-bold ${wsData?.state === 'HOLD' ? 'bg-green-400/20 text-green-400' : 'bg-blue-400/20 text-blue-400'}`}>
                            [{wsData?.state || 'UNKNOWN'}]
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-green-400/70 font-mono text-xs">TOTAL VALUE</div>
                            <div className="text-green-400 font-mono text-xl font-bold">{portfolioValue != null ? `$${portfolioValue.toFixed(2)}` : '—'}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-green-400/70 font-mono text-xs">ETH HOLDINGS</div>
                            <div className="text-green-400 font-mono text-xl font-bold">{wsData?.eth_balance != null ? `${wsData.eth_balance.toFixed(4)} ETH` : '—'}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-green-400/70 font-mono text-xs">MAXX HOLDINGS</div>
                            <div className="text-green-400 font-mono text-xl font-bold">{wsData?.maxx_balance != null ? `${wsData.maxx_balance.toFixed(2)} MAXX` : '—'}</div>
                        </div>
                    </div>
                </div>

                {/* Main Mining Interface */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Mining Controls */}
                    <div className="lg:col-span-2 bg-gray-900 border border-green-400/30 rounded-lg p-6">
                        <div className="border-b border-green-400/30 pb-3 mb-4">
                            <h2 className="text-green-400 font-mono text-lg font-bold tracking-wide">
                                [MCPVOT MINING DASHBOARD]
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {/* Status */}
                            <div className="flex justify-between items-center p-4 bg-gray-800 border border-green-400/20 rounded">
                                <span className="text-green-400/80 font-mono text-sm font-bold">STATUS</span>
                                <span className={`px-3 py-1 rounded text-xs font-mono font-bold tracking-wide ${wsData?.state === 'HOLD'
                                    ? 'bg-green-400/20 text-green-400 border border-green-400/50'
                                    : 'bg-blue-400/20 text-blue-400 border border-blue-400/50'
                                    }`}>
                                    [{wsData?.state || 'UNKNOWN'}]
                                </span>
                            </div>

                            {/* Last Action */}
                            <div className="flex justify-between items-center p-4 bg-gray-800 border border-green-400/20 rounded">
                                <span className="text-green-400/80 font-mono text-sm font-bold">LAST ACTION</span>
                                <span className="text-green-400/60 font-mono text-sm">
                                    {wsData?.last_action_type || 'None'} at {wsData?.last_action_usd != null ? `$${wsData.last_action_usd.toFixed(7)}` : '—'}
                                </span>
                            </div>

                            {/* Last Update */}
                            <div className="flex justify-between items-center p-4 bg-gray-800 border border-green-400/20 rounded">
                                <span className="text-green-400/80 font-mono text-sm font-bold">LAST UPDATE</span>
                                <span className="text-green-400/60 font-mono text-sm">
                                    {lastUpdate.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={toggleMining}
                                className={`flex-1 font-mono text-sm font-bold tracking-wide px-6 py-3 rounded border transition-all duration-200 ${isMining
                                    ? 'bg-red-400/10 hover:bg-red-400/20 text-red-400 border-red-400/50 hover:border-red-400/70'
                                    : 'bg-green-400/10 hover:bg-green-400/20 text-green-400 border-green-400/50 hover:border-green-400/70'
                                    }`}
                            >
                                [{isMining ? 'PAUSE' : 'START'} MINING]
                            </button>
                            <button className="flex-1 bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 border border-emerald-400/50 hover:border-emerald-400/70 font-mono text-sm font-bold tracking-wide px-6 py-3 rounded transition-all duration-200">
                                [STAKE MAXX]
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-gray-900 border border-green-400/30 rounded-lg p-6">
                        <div className="border-b border-green-400/30 pb-3 mb-4">
                            <h2 className="text-green-400 font-mono text-lg font-bold tracking-wide">
                                [RECENT ACTIVITY]
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {wsData?.recent_wallet_trades && wsData.recent_wallet_trades.length > 0 ? (
                                wsData.recent_wallet_trades.slice(0, 5).map((trade: { value?: number; hash?: string; to?: string }, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-800 border border-green-400/20 rounded hover:border-green-400/40 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className={`text-lg ${trade.to === address?.toLowerCase() ? 'text-green-400' : 'text-red-400'}`}>
                                                {trade.to === address?.toLowerCase() ? '→' : '←'}
                                            </span>
                                            <div>
                                                <p className="text-green-400/90 font-mono text-sm font-bold">
                                                    {trade.value != null ? `${trade.value.toFixed(1)}M MAXX` : '—'}
                                                </p>
                                                <p className="text-green-400/60 font-mono text-xs">
                                                    {trade.hash ? `${trade.hash.slice(0, 6)}...` : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-green-400/50 font-mono text-sm py-4">
                                    No recent activity
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Intelligence Features */}
                <div className="bg-gray-900 border border-green-400/30 rounded-lg p-6">
                    <div className="border-b border-green-400/30 pb-3 mb-4">
                        <h2 className="text-green-400 font-mono text-lg font-bold tracking-wide text-center">
                            [UNIQUE AI DATA INTELLIGENCE - NO OTHER PLATFORM OFFERS THIS LEVEL]
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            {
                                icon: '🌐',
                                title: 'BASE NETWORK INSIGHTS',
                                desc: 'Real-time Base blockchain analytics, gas optimization, and network health monitoring',
                                color: 'green'
                            },
                            {
                                icon: '🤖',
                                title: 'AGENT PERFORMANCE',
                                desc: 'AI agent success rates, transaction efficiency, and predictive performance metrics',
                                color: 'blue'
                            },
                            {
                                icon: '📈',
                                title: 'MARKET INTELLIGENCE',
                                desc: 'Advanced market analysis, trend prediction, and arbitrage opportunities',
                                color: 'emerald'
                            },
                            {
                                icon: '💬',
                                title: 'SOCIAL SENTIMENT',
                                desc: 'Real-time social media analysis and sentiment tracking for market movements',
                                color: 'lime'
                            },
                            {
                                icon: '🔮',
                                title: 'PREDICTIVE ANALYTICS',
                                desc: 'Machine learning predictions for price movements and market trends',
                                color: 'green-500'
                            },
                            {
                                icon: '🌍',
                                title: 'ECONOMIC INDICATORS',
                                desc: 'Macro-economic data analysis and its impact on crypto markets',
                                color: 'emerald-500'
                            },
                            {
                                icon: '🎯',
                                title: 'SMART AGENT DISCOVERY',
                                desc: 'AI-powered agent matching and recommendation system for optimal performance',
                                color: 'lime-500'
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className={`bg-linear-to-br from-gray-900/30 to-gray-800/30 border border-green-400/30 rounded-lg p-4 hover:border-green-400/70 transition-all duration-300 hover:shadow-lg`}
                            >
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className={`w-3 h-3 bg-${feature.color}-400 rounded-full animate-pulse`} />
                                    <span className={`text-${feature.color}-400 font-mono text-sm font-bold tracking-wide`}>
                                        {feature.title}
                                    </span>
                                </div>
                                <p className="text-green-400/70 font-mono text-xs">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
