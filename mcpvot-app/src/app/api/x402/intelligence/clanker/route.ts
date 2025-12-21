import type { PaymentContext } from '@/lib/x402/middleware';
import { withX402Payment } from '@/lib/x402/middleware';
import { checkRateLimit, getRateLimitStatus } from '@/lib/x402/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Clanker Intelligence API
 *
 * Protected by x402 payment wrapper - $0.30 USDC gasless payment via CDP
 * Rate limited: 10 requests per minute per wallet
 * Data source: x402 Intelligence Server (http://localhost:8000/api/intelligence/clanker)
 * Update frequency: Real-time via Python intelligence system
 *
 * Returns:
 * - Comprehensive Clanker token market data
 * - Trending tokens analysis from Neynar
 * - DexScreener market metrics (price, volume, liquidity)
 * - Top performing Clanker tokens
 * - Risk assessment and token analysis
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

        // Query x402 Intelligence Server
        const intelligenceServerUrl = process.env.X402_INTELLIGENCE_SERVER_URL || 'http://localhost:8000';
        const response = await fetch(`${intelligenceServerUrl}/api/intelligence/clanker`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Intelligence server returned ${response.status}: ${response.statusText}`);
        }

        const intelligence = await response.json();

        const enrichedResponse = {
            ...intelligence,
            meta: {
                apiVersion: '1.0.0',
                timestamp: new Date().toISOString(),
                provider: 'MCPVOT x402 Intelligence',
                paymentVerified: true,
                price: '$0.30 USDC',
                gasless: true,
                facilitator: 'Coinbase CDP',
                dataSource: 'x402 Intelligence Server (Neynar + DexScreener)',
                tokensAnalyzed: intelligence.trending_tokens?.length || 0,
            },
        };

        return NextResponse.json(enrichedResponse, {
            status: 200,
            headers: {
                'Cache-Control': 'private, max-age=300',
                'X-Payment-Received': 'true',
                'X-Data-Source': 'x402-intelligence-server',
            },
        });
    } catch (error) {
        console.error('[x402/clanker] Intelligence fetch error:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch Clanker intelligence',
                message: 'Unable to connect to x402 Intelligence Server. Ensure it is running on port 8000.',
                details: (error as Error).message,
            },
            { status: 503 }
        );
    }
}

// Export with x402 payment wrapper
export const GET = withX402Payment('clanker-intelligence', handler);
export const POST = withX402Payment('clanker-intelligence', handler);
