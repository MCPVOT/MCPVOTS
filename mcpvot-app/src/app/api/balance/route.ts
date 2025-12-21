import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for balance data
interface CachedBalanceData {
    address: string;
    balances: {
        eth: {
            wei: number;
            eth: number;
            usd: number;
        };
        maxx: {
            raw: number;
            formatted: string;
            usd: number;
        };
    };
    network: string;
    timestamp: number;
}

const balanceCache = new Map<string, { data: CachedBalanceData; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({
                success: false,
                error: 'Wallet address required',
                timestamp: Date.now()
            }, { status: 400 });
        }

        // Check cache first
        const cacheKey = address.toLowerCase();
        const cached = balanceCache.get(cacheKey);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
            console.log(`Balance cache hit for ${address}`);
            return NextResponse.json({
                success: true,
                data: cached.data,
                cached: true,
                timestamp: now
            });
        }

        // Base mainnet RPC endpoint
        const baseRpcUrl = 'https://mainnet.base.org';

        // Get ETH balance
        const ethBalanceResponse = await fetch(baseRpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [address, 'latest'],
                id: 1
            }),
            next: { revalidate: 30 }
        });

        if (!ethBalanceResponse.ok) {
            throw new Error('ETH balance RPC request failed');
        }

        const ethBalanceData = await ethBalanceResponse.json();

        if (ethBalanceData.error) {
            throw new Error(ethBalanceData.error.message);
        }

        const ethBalanceWei = parseInt(ethBalanceData.result, 16);
        const ethBalance = ethBalanceWei / 1e18; // Convert wei to ETH

        // MAXX token contract address
        const maxxContractAddress = '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467';

        // Get MAXX token balance
        let maxxBalance = 0;
        let maxxDecimals = 18;

        try {
            // Get decimals
            const decimalsResponse = await fetch(baseRpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_call',
                    params: [{
                        to: maxxContractAddress,
                        data: '0x313ce567' // decimals() function signature
                    }, 'latest'],
                    id: 2
                })
            });

            if (decimalsResponse.ok) {
                const decimalsData = await decimalsResponse.json();
                if (!decimalsData.error) {
                    maxxDecimals = parseInt(decimalsData.result, 16);
                }
            }

            // Get MAXX balance
            const balanceResponse = await fetch(baseRpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_call',
                    params: [{
                        to: maxxContractAddress,
                        data: `0x70a08231000000000000000000000000${address.slice(2)}` // balanceOf(address)
                    }, 'latest'],
                    id: 3
                })
            });

            if (balanceResponse.ok) {
                const balanceData = await balanceResponse.json();
                if (!balanceData.error) {
                    const maxxBalanceRaw = parseInt(balanceData.result, 16);
                    maxxBalance = maxxBalanceRaw / Math.pow(10, maxxDecimals);
                }
            }
        } catch (error) {
            console.log('MAXX balance fetch failed:', error);
        }

        const resultData = {
            address,
            balances: {
                eth: {
                    wei: ethBalanceWei,
                    eth: ethBalance,
                    usd: 0 // Will be calculated on frontend with ETH price
                },
                maxx: {
                    raw: maxxBalance,
                    formatted: maxxBalance.toFixed(4),
                    usd: 0 // Will be calculated on frontend with MAXX price
                }
            },
            network: 'Base Mainnet',
            timestamp: Date.now()
        };

        // Cache the result
        balanceCache.set(cacheKey, {
            data: resultData,
            timestamp: now
        });

        return NextResponse.json({
            success: true,
            data: resultData
        });

    } catch (error) {
        console.error('Balance API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch balance data',
            timestamp: Date.now()
        }, { status: 500 });
    }
}
