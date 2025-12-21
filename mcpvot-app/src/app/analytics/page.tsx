'use client';

import { useEffect, useState } from 'react';

interface FarcasterSignal {
    castHash: string;
    authorFid: number;
    text: string;
    timestamp: string;
    engagement: {
        likes: number;
        recasts: number;
        replies: number;
    };
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
}

interface FarcasterSummary {
    positive: number;
    negative: number;
    neutral: number;
    total: number;
}

interface OnChainSummary {
    transactionCount: number;
}

interface AnalyticsData {
    farcaster: {
        signals: FarcasterSignal[];
        summary: FarcasterSummary;
        cid?: string;
    };
    onchain: {
        signals: unknown[];
        summary: OnChainSummary;
        cid?: string;
    };
    combined: {
        totalSignals: number;
        timestamp: string;
        version: string;
    };
}

interface PurchaseDecision {
    shouldBuy: boolean;
    amount: number;
    confidence: number;
    signals: Array<{
        type: string;
        strength: number;
        reason: string;
        timestamp: string;
    }>;
    reasoning: string;
}

interface PurchaseAnalysis {
    analysis: PurchaseDecision;
    lastPurchaseTime: string | null;
}

export default function AnalyticsDashboard() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [purchaseAnalysis, setPurchaseAnalysis] = useState<PurchaseAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
        fetchPurchaseAnalysis();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // Use admin token for demo - in production, use proper auth
            const response = await fetch('/api/warplet-feed', {
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'demo-token'}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAnalytics(data.data);
            } else {
                console.warn('Analytics fetch failed:', response.status);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        }
    };

    const fetchPurchaseAnalysis = async () => {
        try {
            const response = await fetch('/api/vot-purchase');
            if (response.ok) {
                const data = await response.json();
                setPurchaseAnalysis(data.data);
            } else {
                console.warn('Purchase analysis fetch failed:', response.status);
            }
        } catch (err) {
            console.error('Error fetching purchase analysis:', err);
        } finally {
            setLoading(false);
        }
    };

    const triggerPurchaseAnalysis = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/vot-purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'demo-token'}`
                },
                body: JSON.stringify({ action: 'analyze' })
            });

            if (response.ok) {
                const data = await response.json();
                setPurchaseAnalysis(data.data);
                await fetchAnalytics(); // Refresh analytics too
            } else {
                setError('Failed to trigger purchase analysis');
            }
        } catch (err) {
            setError('Error triggering purchase analysis');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Warplet Analytics Dashboard</h1>
                    <div className="text-center">Loading analytics...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Warplet Analytics Dashboard</h1>

                {error && (
                    <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Purchase Analysis Section */}
                <div className="bg-gray-800 rounded-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">VOT Purchase Analysis</h2>
                        <button
                            onClick={triggerPurchaseAnalysis}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
                        >
                            {loading ? 'Analyzing...' : 'Run Analysis'}
                        </button>
                    </div>

                    {purchaseAnalysis && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-700 p-4 rounded">
                                    <div className="text-sm text-gray-400">Should Buy</div>
                                    <div className={`text-2xl font-bold ${purchaseAnalysis.analysis.shouldBuy ? 'text-green-400' : 'text-red-400'}`}>
                                        {purchaseAnalysis.analysis.shouldBuy ? 'YES' : 'NO'}
                                    </div>
                                </div>
                                <div className="bg-gray-700 p-4 rounded">
                                    <div className="text-sm text-gray-400">Purchase Amount</div>
                                    <div className="text-2xl font-bold text-blue-400">
                                        ${purchaseAnalysis.analysis.amount.toFixed(2)}
                                    </div>
                                </div>
                                <div className="bg-gray-700 p-4 rounded">
                                    <div className="text-sm text-gray-400">Confidence</div>
                                    <div className="text-2xl font-bold text-purple-400">
                                        {(purchaseAnalysis.analysis.confidence * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-700 p-4 rounded">
                                <div className="text-sm text-gray-400 mb-2">Reasoning</div>
                                <div className="text-white">{purchaseAnalysis.analysis.reasoning}</div>
                            </div>

                            {purchaseAnalysis.analysis.signals.length > 0 && (
                                <div className="bg-gray-700 p-4 rounded">
                                    <div className="text-sm text-gray-400 mb-2">Signals Detected</div>
                                    <div className="space-y-2">
                                        {purchaseAnalysis.analysis.signals.map((signal, index) => (
                                            <div key={index} className="flex justify-between items-center">
                                                <span className="text-white">{signal.reason}</span>
                                                <span className={`px-2 py-1 rounded text-xs ${signal.type === 'sentiment' ? 'bg-green-600' :
                                                        signal.type === 'engagement' ? 'bg-blue-600' : 'bg-purple-600'
                                                    }`}>
                                                    {signal.type} ({(signal.strength * 100).toFixed(0)}%)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {purchaseAnalysis.lastPurchaseTime && (
                                <div className="bg-gray-700 p-4 rounded">
                                    <div className="text-sm text-gray-400">Last Purchase</div>
                                    <div className="text-white">
                                        {new Date(purchaseAnalysis.lastPurchaseTime).toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Analytics Overview */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Farcaster Analytics */}
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Farcaster Analytics</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gray-700 p-3 rounded text-center">
                                        <div className="text-2xl font-bold text-green-400">
                                            {analytics.farcaster.summary?.positive || 0}
                                        </div>
                                        <div className="text-sm text-gray-400">Positive</div>
                                    </div>
                                    <div className="bg-gray-700 p-3 rounded text-center">
                                        <div className="text-2xl font-bold text-red-400">
                                            {analytics.farcaster.summary?.negative || 0}
                                        </div>
                                        <div className="text-sm text-gray-400">Negative</div>
                                    </div>
                                    <div className="bg-gray-700 p-3 rounded text-center">
                                        <div className="text-2xl font-bold text-gray-400">
                                            {analytics.farcaster.summary?.neutral || 0}
                                        </div>
                                        <div className="text-sm text-gray-400">Neutral</div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400">
                                    Total Signals: {analytics.farcaster.signals?.length || 0}
                                </div>
                            </div>
                        </div>

                        {/* On-chain Analytics */}
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">On-chain Analytics</h2>
                            <div className="space-y-4">
                                <div className="bg-gray-700 p-4 rounded">
                                    <div className="text-sm text-gray-400">Transaction Count</div>
                                    <div className="text-2xl font-bold text-blue-400">
                                        {analytics.onchain.summary?.transactionCount || 0}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400">
                                    Total Signals: {analytics.onchain.signals?.length || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Signals */}
                {analytics?.farcaster.signals && analytics.farcaster.signals.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-6 mt-8">
                        <h2 className="text-xl font-semibold mb-4">Recent Farcaster Signals</h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {analytics.farcaster.signals.slice(0, 10).map((signal: FarcasterSignal, index: number) => (
                                <div key={index} className="bg-gray-700 p-4 rounded">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-sm text-gray-400">
                                            FID: {signal.authorFid} • {new Date(signal.timestamp).toLocaleString()}
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs ${signal.sentiment === 'positive' ? 'bg-green-600' :
                                                signal.sentiment === 'negative' ? 'bg-red-600' : 'bg-gray-600'
                                            }`}>
                                            {signal.sentiment}
                                        </div>
                                    </div>
                                    <div className="text-white mb-2 line-clamp-2">{signal.text}</div>
                                    <div className="flex gap-4 text-sm text-gray-400">
                                        <span>❤️ {signal.engagement.likes}</span>
                                        <span>🔄 {signal.engagement.recasts}</span>
                                        <span>💬 {signal.engagement.replies}</span>
                                    </div>
                                    {signal.topics && signal.topics.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                            {signal.topics.map((topic: string, topicIndex: number) => (
                                                <span key={topicIndex} className="bg-blue-600 px-2 py-1 rounded text-xs">
                                                    #{topic}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
