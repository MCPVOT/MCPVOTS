import type { PaymentContext } from '@/lib/x402/middleware';
import { withX402Payment } from '@/lib/x402/middleware';
import { checkRateLimit, getRateLimitStatus } from '@/lib/x402/rate-limiter';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

/**
 * Farcaster Ecosystem Intelligence API
 *
 * Protected by x402 payment wrapper - $0.10 USDC gasless payment via CDP
 * Rate limited: 10 requests per minute per wallet
 * Data source: VOT_Trading_Bot/intelligence_cache/farcaster_ecosystem.json
 * Update frequency: Hourly (automated by trading bot)
 *
 * Returns:
 * - 10+ Farcaster tokens tracked (DEGEN, HIGHER, BUILD, etc.)
 * - Market data for each token (price, volume, market cap)
 * - Token correlations and ecosystem trends
 * - Top performers and laggards
 * - Aggregated ecosystem metrics
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
            'farcaster_ecosystem.json'
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
                dataSource: 'VOT Trading Bot (hourly Farcaster aggregation)',
                tokensTracked: intelligence.tokens?.length || 0,
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
        console.error('[x402/farcaster] Intelligence fetch error:', error);

        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return NextResponse.json(
                {
                    error: 'Farcaster ecosystem cache not available',
                    message: 'Cache file is being generated. Please try again shortly.',
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch Farcaster intelligence', details: (error as Error).message },
            { status: 500 }
        );
    }
}

// Export with x402 payment wrapper
export const GET = withX402Payment('farcaster-ecosystem', handler);
export const POST = withX402Payment('farcaster-ecosystem', handler);
