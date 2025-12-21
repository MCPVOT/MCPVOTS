'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

interface PriceData {
    price: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    marketCap: number;
    priceEth: number;
    ethPrice: number;
}

interface GasData {
    gasPrice: {
        gwei: number;
        wei: number;
    };
    estimates: {
        transfer: { costEth: number };
        swap: { costEth: number };
        contract: { costEth: number };
    };
}

interface BalanceData {
    balances: {
        eth: { eth: number; usd: number };
        maxx: { raw: number; formatted: string; usd: number };
    };
}

interface WebSocketTrade {
    type: string;
    amount: number;
    price: number;
    profit: number;
    timestamp: number;
}

interface TradingData {
    stats: {
        totalTrades: number;
        winRate: number;
        totalProfit: number;
        totalVolume: number;
    };
    recentTrades: Array<{
        type: string;
        amount: number;
        price: number;
        profit: number;
        timestamp: number;
    }>;
}

interface BurnStatsData {
    totalBurned: number;
    burnCount: number;
    lastBurn?: {
        amount: number;
        transactionHash: string;
        burnedAt: string;
    } | null;
}

export function useLiveData() {
    const { address, isConnected } = useAccount();
    const [prices, setPrices] = useState<PriceData | null>(null);
    const [gas, setGas] = useState<GasData | null>(null);
    const [balance, setBalance] = useState<BalanceData | null>(null);
    const [trading, setTrading] = useState<TradingData | null>(null);
    const [burnStats, setBurnStats] = useState<BurnStatsData | null>(null);
    const [isWsConnected, setIsWsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // WebSocket connection
    useEffect(() => {
        const connectWebSocket = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) return;

            try {
                wsRef.current = new WebSocket('ws://localhost:8080'); wsRef.current.onopen = () => {
                    console.log('WebSocket connected');
                    setIsWsConnected(true);
                };

                wsRef.current.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        if (message.type === 'tick' && message.data) {
                            const data = message.data;

                            // Update prices if available
                            if (data.prices && Object.keys(data.prices).length > 0) {
                                // Convert WebSocket price format to our PriceData format
                                const wsPrices = data.prices;
                                if (wsPrices.maxx !== undefined) {
                                    setPrices(prev => ({
                                        price: wsPrices.maxx || prev?.price || 0,
                                        priceChange24h: wsPrices.maxx_change_24h || prev?.priceChange24h || 0,
                                        volume24h: wsPrices.volume_24h || prev?.volume24h || 0,
                                        liquidity: wsPrices.liquidity || prev?.liquidity || 0,
                                        marketCap: wsPrices.market_cap || prev?.marketCap || 0,
                                        priceEth: wsPrices.price_eth || prev?.priceEth || 0,
                                        ethPrice: wsPrices.eth_price || wsPrices.eth_usd || prev?.ethPrice || 3200,
                                    }));
                                }
                            }

                            // Update balances if available
                            if (data.balances && Object.keys(data.balances).length > 0) {
                                const wsBalances = data.balances;
                                setBalance(prev => ({
                                    balances: {
                                        eth: {
                                            eth: wsBalances.eth || prev?.balances.eth.eth || 0,
                                            usd: wsBalances.eth_usd || prev?.balances.eth.usd || 0
                                        },
                                        maxx: {
                                            raw: wsBalances.maxx || prev?.balances.maxx.raw || 0,
                                            formatted: wsBalances.maxx_formatted || prev?.balances.maxx.formatted || '0',
                                            usd: wsBalances.maxx_usd || prev?.balances.maxx.usd || 0
                                        }
                                    }
                                }));
                            }

                            // Update trading data if available
                            if (data.recent_trades && data.recent_trades.length > 0) {
                                const trades: WebSocketTrade[] = data.recent_trades;
                                const totalTrades = trades.length;
                                const profitableTrades = trades.filter((t: WebSocketTrade) => t.profit > 0).length;
                                const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
                                const totalProfit = trades.reduce((sum: number, t: WebSocketTrade) => sum + (t.profit || 0), 0);
                                const totalVolume = trades.reduce((sum: number, t: WebSocketTrade) => sum + (t.amount || 0), 0);

                                setTrading({
                                    stats: {
                                        totalTrades,
                                        winRate,
                                        totalProfit,
                                        totalVolume
                                    },
                                    recentTrades: trades.slice(-10).map((t: WebSocketTrade) => ({
                                        type: t.type || 'unknown',
                                        amount: t.amount || 0,
                                        price: t.price || 0,
                                        profit: t.profit || 0,
                                        timestamp: t.timestamp || Date.now()
                                    }))
                                });
                            }
                        }
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };

                wsRef.current.onclose = () => {
                    console.log('WebSocket disconnected');
                    setIsWsConnected(false);

                    // Attempt to reconnect after 5 seconds
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, 5000);
                };

                wsRef.current.onerror = (error) => {
                    // Only log WebSocket errors in development, suppress in production
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('WebSocket connection failed (expected in demo mode):', error);
                    }
                    setIsWsConnected(false);
                };

            } catch (error) {
                // Only log connection errors in development, suppress in production
                if (process.env.NODE_ENV === 'development') {
                    console.warn('WebSocket server not available (expected in demo mode):', error);
                }
                setIsWsConnected(false);
                // Don't retry connection in demo mode
                if (process.env.NODE_ENV !== 'development') {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, 5000);
                }
            }
        };

        connectWebSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    // Fallback polling for data not available via WebSocket
    useEffect(() => {
        // Only poll if WebSocket is not connected or for gas data
        if (!isWsConnected) {
            const fetchPrices = async () => {
                try {
                    // Fetch VOT token data from DEXScreener API
                    const votResponse = await fetch(
                        'https://api.dexscreener.com/latest/dex/tokens/0xFB7a83abe4F4A4E51c77B92E521390B769ff6467'
                    );
                    const votData = await votResponse.json();

                    // Fetch ETH price from our API endpoint
                    const ethResponse = await fetch('/api/eth-price');
                    const ethData = await ethResponse.json();
                    const ethPrice = ethData.success ? ethData.data.price : 3200;

                    if (votData.pairs && votData.pairs.length > 0) {
                        const pair = votData.pairs[0];
                        const votPriceUsd = parseFloat(pair.priceUsd || '0');
                        const priceEth = votPriceUsd > 0 && ethPrice > 0 ? votPriceUsd / ethPrice : 0;

                        setPrices({
                            price: votPriceUsd,
                            priceChange24h: parseFloat(pair.priceChange?.h24 || '0'),
                            volume24h: parseFloat(pair.volume?.h24 || '0'),
                            liquidity: parseFloat(pair.liquidity?.usd || '0'),
                            marketCap: parseFloat(pair.marketCap || '0'),
                            priceEth: priceEth,
                            ethPrice: ethPrice
                        });
                    } else {
                        // Set fallback with real ETH price
                        setPrices({
                            price: 0.0000001,
                            priceChange24h: 2.5,
                            volume24h: 50000,
                            liquidity: 100000,
                            marketCap: 500000,
                            priceEth: 0,
                            ethPrice: ethPrice
                        });
                    }
                } catch (error) {
                    console.error('Failed to fetch VOT prices:', error);
                    // Set fallback prices if fetch fails
                    setPrices(prev => prev ?? {
                        price: 0.0000001,
                        priceChange24h: 2.5,
                        volume24h: 50000,
                        liquidity: 100000,
                        marketCap: 500000,
                        priceEth: 0,
                        ethPrice: 3200 // Fallback ETH price
                    });
                }
            };

            fetchPrices();
            const priceInterval = setInterval(fetchPrices, 30000);
            return () => clearInterval(priceInterval);
        }
    }, [isWsConnected]);

    // Always poll for gas prices (not available via WebSocket) - reduced frequency
    useEffect(() => {
        const fetchGas = async () => {
            try {
                const response = await fetch('/api/gas');
                const data = await response.json();
                if (data.success) {
                    setGas(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch gas:', error);
            }
        };

        fetchGas();
        // Reduced polling frequency from 10s to 60s
        const interval = setInterval(fetchGas, 60000);
        return () => clearInterval(interval);
    }, []);

    // Always poll for ETH price (ensure it's always available)
    useEffect(() => {
        const fetchEthPrice = async () => {
            try {
                const response = await fetch('/api/eth-price');
                const data = await response.json();
                if (data.success && data.data.price) {
                    // Update ETH price in prices state
                    setPrices(prev => prev ? { ...prev, ethPrice: data.data.price } : null);
                }
            } catch (error) {
                console.error('Failed to fetch ETH price:', error);
            }
        };

        fetchEthPrice();
        // Poll every 60 seconds
        const interval = setInterval(fetchEthPrice, 60000);
        return () => clearInterval(interval);
    }, []);

    // Poll for balance when wallet is connected (fallback) - reduced frequency
    const balanceFetchedRef = useRef(false);

    useEffect(() => {
        if (!isConnected || !address) {
            balanceFetchedRef.current = false;
            return;
        }

        const fetchBalance = async () => {
            try {
                const response = await fetch(`/api/balance?address=${address}`);
                const data = await response.json();
                if (data.success && !balanceFetchedRef.current) { // Only set if not already fetched
                    balanceFetchedRef.current = true;
                    // USD calculations will be done on the frontend when rendering
                    setBalance(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch balance:', error);
            }
        };

        fetchBalance();
        // Reduced polling frequency from 30s to 120s to prevent rate limiting
        const interval = setInterval(fetchBalance, 120000);
        return () => clearInterval(interval);
    }, [address, isConnected]); // Removed 'prices' to prevent excessive re-polling when prices update

    // Fallback polling for trading data
    const tradingFetchedRef = useRef(false);

    useEffect(() => {
        if (!isWsConnected) {
            const fetchTrading = async () => {
                try {
                    const response = await fetch('/api/trading');
                    const data = await response.json();
                    if (data.success && !tradingFetchedRef.current) { // Only set if not already fetched
                        tradingFetchedRef.current = true;
                        setTrading(data.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch trading data:', error);
                }
            };

            fetchTrading();
            const interval = setInterval(fetchTrading, 60000);
            return () => clearInterval(interval);
        }
    }, [isWsConnected]); // Safe dependencies - no 'trading' to prevent infinite re-polling

    // Poll burn statistics so homepage can display live burn totals
    useEffect(() => {
        const fetchBurnStats = async () => {
            try {
                const response = await fetch('/api/burn-stats');
                const data = await response.json();

                if (data.success) {
                    setBurnStats({
                        totalBurned: typeof data.data.totalBurned === 'number' ? data.data.totalBurned : Number(data.data.totalBurned ?? 0),
                        burnCount: typeof data.data.burnCount === 'number' ? data.data.burnCount : Number(data.data.burnCount ?? 0),
                        lastBurn: data.data.lastBurn
                            ? {
                                amount: Number(data.data.lastBurn.amount ?? 0),
                                transactionHash: data.data.lastBurn.transactionHash,
                                burnedAt: data.data.lastBurn.burnedAt
                            }
                            : null
                    });
                }
            } catch (error) {
                console.error('Failed to fetch burn stats:', error);
            }
        };

        fetchBurnStats();
        const interval = setInterval(fetchBurnStats, 60000);
        return () => clearInterval(interval);
    }, []);

    const isLoading = !prices || !gas;

    return {
        prices,
        gas,
        balance,
        trading,
        burnStats,
        loading: isLoading,
        isConnected,
        isWsConnected
    };
}
