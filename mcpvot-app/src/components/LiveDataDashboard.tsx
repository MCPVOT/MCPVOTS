'use client';

import { useLiveData } from '@/hooks/useLiveData';

interface DataCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: string;
    loading?: boolean;
}

function DataCard({ title, value, change, changeLabel, icon, loading }: DataCardProps) {
    if (loading) {
        return (
            <div className="bg-gray-900/80 border border-green-400/30 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-6 bg-gray-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/80 border border-green-400/30 rounded-lg p-4 hover:border-green-400/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <span className="text-green-400/70 text-xs font-mono">{title}</span>
                {icon && <span className="text-green-400/50">{icon}</span>}
            </div>
            <div className="text-green-400 font-bold text-lg font-mono">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {change !== undefined && changeLabel && (
                <div className={`text-xs font-mono mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(2)}{changeLabel}
                </div>
            )}
        </div>
    );
}

export default function LiveDataDashboard() {
    const { prices, gas, balance, trading, burnStats, loading, isConnected } = useLiveData();

    if (!isConnected) {
        return (
            <div className="text-center text-green-400/50 text-sm font-mono">
                Connect wallet to view live data
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Price Data */}
            <div className="grid grid-cols-2 gap-3">
                <DataCard
                    title="MAXX Price"
                    value={prices ? `$${prices.price.toFixed(6)}` : 'Loading...'}
                    change={prices?.priceChange24h}
                    changeLabel="%"
                    icon="💎"
                    loading={loading}
                />
                <DataCard
                    title="24h Volume"
                    value={prices ? `$${(prices.volume24h / 1000).toFixed(1)}K` : 'Loading...'}
                    icon="📊"
                    loading={loading}
                />
            </div>

            {/* Gas Data */}
            <div className="grid grid-cols-2 gap-3">
                <DataCard
                    title="Gas Price"
                    value={gas ? `${gas.gasPrice.gwei.toFixed(2)} gwei` : 'Loading...'}
                    icon="⛽"
                    loading={loading}
                />
                <DataCard
                    title="Transfer Cost"
                    value={gas ? `$${gas.estimates.transfer.costEth.toFixed(4)}` : 'Loading...'}
                    icon="💸"
                    loading={loading}
                />
            </div>

            {/* Balance Data */}
            {balance && (
                <div className="grid grid-cols-2 gap-3">
                    <DataCard
                        title="ETH Balance"
                        value={`${balance.balances.eth.eth.toFixed(4)} ETH`}
                        icon="💰"
                        loading={false}
                    />
                    <DataCard
                        title="MAXX Balance"
                        value={`${balance.balances.maxx.formatted} MAXX`}
                        icon="🪙"
                        loading={false}
                    />
                </div>
            )}

            {/* Trading Data */}
            <div className="grid grid-cols-2 gap-3">
                <DataCard
                    title="Win Rate"
                    value={trading ? `${trading.stats.winRate.toFixed(1)}%` : 'Loading...'}
                    icon="🏆"
                    loading={loading}
                />
                <DataCard
                    title="Total Trades"
                    value={trading ? trading.stats.totalTrades : 'Loading...'}
                    icon="📈"
                    loading={loading}
                />
            </div>

            {/* Burn Stats */}
            <div className="grid grid-cols-2 gap-3">
                <DataCard
                    title="VOT Burned"
                    value={burnStats ? `${burnStats.totalBurned.toFixed(2)} VOT` : 'Loading...'}
                    icon="🔥"
                    loading={burnStats === null}
                />
                <DataCard
                    title="Burn Events"
                    value={burnStats ? burnStats.burnCount : 'Loading...'}
                    icon="🧨"
                    loading={burnStats === null}
                />
            </div>

            {/* Recent Trades */}
            {trading && trading.recentTrades.length > 0 && (
                <div className="bg-gray-900/80 border border-green-400/30 rounded-lg p-4">
                    <div className="text-green-400/70 text-xs font-mono mb-3">Recent Trades</div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {trading.recentTrades.slice(0, 3).map((trade, index) => (
                            <div key={index} className="flex justify-between items-center text-xs font-mono">
                                <span className={`capitalize ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                    {trade.type}
                                </span>
                                <span className="text-green-400/70">
                                    {trade.amount.toFixed(3)} @ ${trade.price.toFixed(6)}
                                </span>
                                <span className={trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                                    {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(4)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
