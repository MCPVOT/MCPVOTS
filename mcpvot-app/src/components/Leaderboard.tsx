'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function Leaderboard() {
    const [showPopup, setShowPopup] = useState(false);

    // Leaderboard data query
    const { data: leaderboard } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => [
            { rank: 1, address: '0x1234...5678', totalMined: 1250.5, reputation: 98.5, rewards: 250 },
            { rank: 2, address: '0xabcd...efgh', totalMined: 1180.2, reputation: 95.2, rewards: 200 },
            { rank: 3, address: '0x9876...4321', totalMined: 1050.8, reputation: 92.1, rewards: 150 },
            { rank: 4, address: '0x1111...2222', totalMined: 980.3, reputation: 89.7, rewards: 120 },
            { rank: 5, address: '0x3333...4444', totalMined: 920.7, reputation: 87.3, rewards: 100 },
            { rank: 6, address: '0x5555...6666', totalMined: 875.4, reputation: 85.1, rewards: 90 },
            { rank: 7, address: '0x7777...8888', totalMined: 820.9, reputation: 82.8, rewards: 80 },
            { rank: 8, address: '0x9999...aaaa', totalMined: 780.2, reputation: 80.5, rewards: 70 },
            { rank: 9, address: '0xbbbb...cccc', totalMined: 745.6, reputation: 78.2, rewards: 60 },
            { rank: 10, address: '0xdddd...eeee', totalMined: 710.3, reputation: 75.9, rewards: 50 },
        ],
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-green-400/30 pb-3 mb-4">
                <h2 className="text-green-400 font-mono text-lg font-bold tracking-wide text-center">
                    [WELCOME TO MCPVOTS]
                </h2>
            </div>

            {/* Welcome Message */}
            <div className="bg-gray-900 border border-green-400/30 rounded-lg p-6 animate-fade-in">
                <div className="flex items-center mb-6">
                    <div className="h-6 w-6 text-green-400 animate-pulse mr-3">⚡</div>
                    <h2 className="text-green-400 font-mono text-xl font-bold tracking-wide animate-glow">
                        WELCOME TO MCPVOTS
                    </h2>
                </div>

                <div className="p-4 bg-green-900/20 border border-green-400/30 rounded">
                    <h3 className="text-green-400 font-mono text-sm font-bold mb-2 tracking-wide">
                        TOP PERFORMERS
                    </h3>
                    <p className="text-green-400/70 font-mono text-sm">
                        Compete with other miners to earn VOTS rewards and climb the rankings! Top 10 miners receive bonus rewards every week.
                    </p>
                </div>
            </div>

            {/* Rankings */}
            <div className="bg-gray-900 border border-green-400/30 rounded-lg p-6">
                <div className="border-b border-green-400/30 pb-3 mb-4">
                    <h3 className="text-green-400 font-mono text-lg font-bold tracking-wide">
                        [RANKINGS]
                    </h3>
                </div>

                <div className="space-y-3">
                    {leaderboard?.map((miner, index) => {
                        const isTopThree = miner.rank <= 3;
                        return (
                            <div
                                key={miner.rank}
                                className={`flex items-center justify-between p-4 rounded border transition-all duration-300 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-400/10 transform hover:scale-[1.02] animate-slide-in ${isTopThree
                                        ? 'bg-green-900/10 border-green-400/30 animate-glow-subtle'
                                        : 'bg-gray-800 border-green-400/20'
                                    }`}
                                style={{
                                    animationDelay: `${100 * index}ms`,
                                    animationFillMode: 'both'
                                }}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded border ${isTopThree ? 'border-green-400/50 bg-green-900/20' : 'border-green-400/30 bg-gray-700'
                                        }`}>
                                        <span className={`text-lg font-bold ${isTopThree ? 'text-green-400' : 'text-green-400/70'
                                            }`}>
                                            {miner.rank}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-green-400 font-mono text-lg font-bold">
                                                #{miner.rank}
                                            </span>
                                            {isTopThree && (
                                                <span className="px-2 py-1 text-xs font-mono font-bold bg-green-400/20 text-green-400 border border-green-400/50 rounded tracking-wide">
                                                    TOP {miner.rank}
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-mono text-xs text-green-400/60">{miner.address}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-green-400 font-mono font-bold">
                                        {miner.totalMined.toFixed(2)} VOTS
                                    </div>
                                    <div className="text-green-400/50 font-mono text-xs">MINED</div>
                                </div>

                                <div className="text-right">
                                    <div className="text-emerald-400 font-mono font-bold">
                                        {miner.reputation.toFixed(1)}%
                                    </div>
                                    <div className="text-green-400/50 font-mono text-xs">REPUTATION</div>
                                </div>

                                <div className="text-right">
                                    <div className="text-lime-400 font-mono font-bold">
                                        {miner.rewards.toFixed(2)}
                                    </div>
                                    <div className="text-green-400/50 font-mono text-xs">REWARDS</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Ranking System */}
            <div className="bg-gray-900 border border-green-400/30 rounded-lg p-6">
                <div className="border-b border-green-400/30 pb-3 mb-4">
                    <h3 className="text-green-400 font-mono text-lg font-bold tracking-wide">
                        [RANKING SYSTEM]
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-gray-800 border border-green-400/20 rounded">
                        <strong className="text-green-400 font-mono text-sm font-bold block mb-1">
                            MINING VOLUME
                        </strong>
                        <span className="text-green-400/70 font-mono text-xs">
                            Total VOTS mined over time
                        </span>
                    </div>

                    <div className="p-3 bg-gray-800 border border-green-400/20 rounded">
                        <strong className="text-green-400 font-mono text-sm font-bold block mb-1">
                            REPUTATION
                        </strong>
                        <span className="text-green-400/70 font-mono text-xs">
                            Based on successful transactions and community standing
                        </span>
                    </div>

                    <div className="p-3 bg-gray-800 border border-green-400/20 rounded">
                        <strong className="text-green-400 font-mono text-sm font-bold block mb-1">
                            REWARDS
                        </strong>
                        <span className="text-green-400/70 font-mono text-xs">
                            Bonus VOTS earned from leaderboard position
                        </span>
                    </div>
                </div>
            </div>

            {/* Base Network Insight Popup */}
            {showPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-orange-400/20 rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-xs font-mono text-orange-300">BASE NETWORK INSIGHT</div>
                            <button
                                onClick={() => setShowPopup(false)}
                                className="text-orange-400/60 hover:text-orange-400 text-xs font-mono"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2 text-sm font-mono text-green-300">
                            {[
                                "Base: avg-block-time 2.1s, tx/s 72",
                                "Active validators: 21",
                                "Gas price median: 8 gwei",
                                "Top token movers: VOTS, USDC, WETH"
                            ].map((insight, i) => (
                                <div key={i} className="flex items-center space-x-2 opacity-90">
                                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                                    <div className="truncate">{insight}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Message */}
            <div className="text-center">
                <p className="text-green-400/60 font-mono text-sm">
                    Rankings update every 5 minutes. Keep mining to climb the leaderboard!
                </p>
            </div>
        </div>
    );
}
