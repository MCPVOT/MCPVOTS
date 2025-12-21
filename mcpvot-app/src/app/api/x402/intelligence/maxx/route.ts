import type { PaymentContext } from '@/lib/x402/middleware';
import { withX402Payment } from '@/lib/x402/middleware';
import { checkRateLimit, getRateLimitStatus } from '@/lib/x402/rate-limiter';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

/**
 * MAXX Intelligence API
 *
 * Protected by x402 payment wrapper - $0.10 USDC gasless payment via CDP
 * Rate limited: 10 requests per minute per wallet
 * Data source: VOT_Trading_Bot/intelligence_cache/maxx_intelligence.json
 * Update frequency: Hourly (automated by trading bot)
 *
 * Returns:
 * - Real-time MAXX price from Birdeye API
 * - Market cap and liquidity data
 * - Burn analytics (total burned, burn addresses)
 * - 24h trading volume and price changes
 * - Historical performance metrics
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

        const cachePath = path.join(
            process.cwd(),
            '..',
            'VOT_Trading_Bot',
            'intelligence_cache',
            'maxx_intelligence.json'
        );

        const data = await fs.readFile(cachePath, 'utf-8');
        const intelligence = JSON.parse(data);

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
                dataSource: 'Birdeye API + Trading Bot Cache',
            },
        };

        return NextResponse.json(response, {
            status: 200,
            headers: {
                'Cache-Control': 'private, max-age=300',
                'X-Payment-Received': 'true',
                'X-Data-Freshness': 'hourly',
            },
        });
    } catch (error) {
        console.error('[x402/maxx] Intelligence fetch error:', error);

        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return NextResponse.json(
                {
                    error: 'MAXX intelligence cache not available',
                    message: 'Cache file is being generated. Please try again shortly.',
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch MAXX intelligence', details: (error as Error).message },
            { status: 500 }
        );
    }
}

// Export with x402 payment wrapper
export const GET = withX402Payment('maxx-intelligence', handler);
export const POST = withX402Payment('maxx-intelligence', handler);
