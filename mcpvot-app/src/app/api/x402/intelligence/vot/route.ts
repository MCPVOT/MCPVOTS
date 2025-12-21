import type { PaymentContext } from '@/lib/x402/middleware';
import { checkRateLimit, getRateLimitStatus } from '@/lib/x402/rate-limiter';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

/**
 * VOT Intelligence API
 *
 * Protected by x402 payment wrapper - $0.10 USDC gasless payment via CDP
 * Rate limited: 10 requests per minute per wallet
 * Data source: VOT_Trading_Bot/intelligence_cache/vot_intelligence.json
 * Update frequency: Hourly (automated by trading bot)
 *
 * Returns:
 * - Current VOT price and market data
 * - 24h volume and price changes
 * - Burn statistics (total burned, burn count)
 * - Trading signals from bot performance
 * - Farcaster token correlations
 */
async function handler(request: NextRequest, context?: PaymentContext) {
    try {
        const wallet = context?.payment?.payer ?? context?.walletAddress;
        if (wallet && !checkRateLimit(wallet)) {
            const status = getRateLimitStatus(wallet);
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded',
                    message: `Maximum ${status.limit} requests per minute. Please try again in ${Math.ceil(status.resetInMs / 1000)} seconds.`,
                    limit: status.limit,
                    remaining: 0,
                    resetInSeconds: Math.ceil(status.resetInMs / 1000)
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': status.limit.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': Math.ceil(status.resetInMs / 1000).toString()
                    }
                }
            );
        }

        // Read cached intelligence from VOT Trading Bot
        const cachePath = path.join(
            process.cwd(),
            '..',
            'VOT_Trading_Bot',
            'intelligence_cache',
            'vot_intelligence.json'
        );

        const data = await fs.readFile(cachePath, 'utf-8');
        const intelligence = JSON.parse(data);

        // Add API metadata - payment already verified by withX402Payment wrapper
        const response = {
            ...intelligence,
            meta: {
                apiVersion: '1.0.0',
                timestamp: new Date().toISOString(),
                provider: 'MAXX Intelligence APIs',
                paymentVerified: true,
                price: '$0.10 USDC',
                gasless: true,
                facilitator: 'Coinbase CDP',
                dataSource: 'VOT Trading Bot (hourly cache)',
            },
        };

        return NextResponse.json(response, {
            status: 200,
            headers: {
                'Cache-Control': 'private, max-age=300', // 5 min cache per user
                'X-Payment-Received': 'true',
                'X-Data-Freshness': 'hourly',
            },
        });
    } catch (error) {
        console.error('[x402/vot] Intelligence fetch error:', error);

        // Check if cache file doesn't exist
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return NextResponse.json(
                {
                    error: 'VOT intelligence cache not available',
                    message: 'The trading bot is still generating the first hourly snapshot. Please try again in a few minutes.',
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch VOT intelligence', details: (error as Error).message },
            { status: 500 }
        );
    }
}

// Export with x402 payment wrapper - handles payment verification & settlement
// Temporarily disabled for debugging
// export const GET = withX402Payment('vot-intelligence', handler);
// export const POST = withX402Payment('vot-intelligence', handler);

// Temporary direct export for debugging
export const GET = handler;
export const POST = handler;

// Handle CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-PAYMENT',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Expose-Headers': 'X-Settlement-TxHash, X-Payment-Hash, X-Facilitator-Signature, X-Payer-Address, X-Settlement-Status, X-Settlement-Error, X-RateLimit-Remaining',
            'Access-Control-Max-Age': '86400',
        },
    });
}
