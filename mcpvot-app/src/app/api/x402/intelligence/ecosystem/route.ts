/**
 * x402-Gated Ecosystem Intelligence API
 * 
 * Returns real-time MCPVOT ecosystem metrics including:
 * - Trading statistics
 * - Burn analytics
 * - Active system streams
 * 
 * Price: $0.02 USDC per query
 */

import type { PaymentContext } from '@/lib/x402/middleware';
import { withX402Payment } from '@/lib/x402/middleware';
import { checkRateLimit, getRateLimitStatus } from '@/lib/x402/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

// VOT token address for burn tracking
const VOT_TOKEN_ADDRESS = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';

async function fetchBurnStats(): Promise<Record<string, unknown>> {
    try {
        // Fetch burn events from Basescan
        const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || process.env.ETHERSCAN_API_KEY;
        if (!BASESCAN_API_KEY) {
            return { 
                totalBurned: 0, 
                burnCount: 0, 
                error: 'Basescan API not configured' 
            };
        }

        const response = await fetch(
            `https://api.basescan.org/api?module=account&action=tokentx&contractaddress=${VOT_TOKEN_ADDRESS}&address=${BURN_ADDRESS}&sort=desc&apikey=${BASESCAN_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`Basescan API error: ${response.status}`);
        }

        const data = await response.json();
        const burns = data.result || [];

        let totalBurned = BigInt(0);
        for (const tx of burns.slice(0, 100)) {
            totalBurned += BigInt(tx.value || 0);
        }

        const lastBurn = burns[0];

        return {
            totalBurned: (Number(totalBurned) / 1e18).toFixed(2),
            burnCount: burns.length,
            lastBurnAmount: lastBurn ? (Number(BigInt(lastBurn.value)) / 1e18).toFixed(2) : 0,
            lastBurnTime: lastBurn ? new Date(parseInt(lastBurn.timeStamp) * 1000).toISOString() : null,
            lastBurnTx: lastBurn?.hash || null,
        };
    } catch (error) {
        console.error('[Ecosystem] Burn stats error:', error);
        return { 
            totalBurned: 0, 
            burnCount: 0, 
            error: (error as Error).message 
        };
    }
}

async function fetchTradingStats(): Promise<Record<string, unknown>> {
    // These would come from your trading database in production
    // For now, return live ecosystem status
    return {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalVolume: 0,
        totalGasCost: 0,
        totalPnL: 0,
        successRate: 0,
        note: 'Connect trading database for live metrics',
    };
}

async function handler(request: NextRequest, context?: PaymentContext) {
    try {
        const wallet = context?.payment?.payer ?? context?.walletAddress;
        if (wallet && !checkRateLimit(wallet)) {
            const status = getRateLimitStatus(wallet);
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded',
                    message: `Maximum ${status.limit} requests per minute.`,
                    resetInSeconds: Math.ceil(status.resetInMs / 1000)
                },
                { status: 429 }
            );
        }

        // Fetch data in parallel
        const [burnStats, tradingStats] = await Promise.all([
            fetchBurnStats(),
            fetchTradingStats(),
        ]);

        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                trading: tradingStats,
                burns: burnStats,
                latestTrades: [],
                ecosystem: {
                    totalValue: 0,
                    activeStreams: ['TRADING', 'BURNS', 'ANALYTICS', 'LIQUIDITY'],
                    status: 'LIVE',
                },
            },
            meta: {
                apiVersion: '1.0.0',
                provider: 'MCPVOT x402 Intelligence',
                paymentVerified: true,
                price: '$0.02 USDC',
                gasless: true,
            },
        };

        return NextResponse.json(response, {
            status: 200,
            headers: {
                'Cache-Control': 'private, max-age=60',
                'X-Payment-Received': 'true',
            },
        });
    } catch (error) {
        console.error('[x402/ecosystem] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch ecosystem data', details: (error as Error).message },
            { status: 503 }
        );
    }
}

// Export with x402 payment wrapper
export const GET = withX402Payment('ecosystem-intelligence', handler);
export const POST = withX402Payment('ecosystem-intelligence', handler);
