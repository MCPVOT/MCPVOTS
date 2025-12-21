import { withX402Payment } from '@/lib/x402/middleware';
import { sanitizeError, validateTokenList } from '@/lib/x402/validation';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

/**
 * Token Comparison Intelligence API
 *
 * Protected by x402 payment wrapper - $0.10 USDC gasless payment via CDP
 * Data source: VOT_Trading_Bot/intelligence_cache/*.json (multiple files)
 * Update frequency: Hourly (automated by trading bot)
 *
 * Query Parameters:
 * - tokens: Comma-separated token symbols (default: VOT,MAXX)
 *   Example: ?tokens=VOT,MAXX,DEGEN
 *
 * Returns:
 * - Side-by-side comparison of requested tokens
 * - Relative performance metrics
 * - Top performer identification
 * - Aggregated market cap and volume
 * - AI-powered insights
 */
async function handler(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tokensParam = searchParams.get('tokens') || 'VOT,MAXX';

        // Validate and sanitize token inputs
        const tokens = validateTokenList(tokensParam);

        if (tokens.length === 0) {
            return NextResponse.json(
                {
                    error: 'No valid tokens provided',
                    message: 'Please provide valid token symbols from the allowed list',
                    allowedTokens: ['VOT', 'MAXX', 'DEGEN', 'HIGHER', 'BUILD', 'ENJOY', 'TN100X', 'MOXIE', 'WILD', 'HAM'],
                },
                { status: 400 }
            );
        }

        // Read all intelligence files
        const cacheDir = path.join(
            process.cwd(),
            '..',
            'VOT_Trading_Bot',
            'intelligence_cache'
        );

        const comparisons: Array<{
            token: string;
            data: {
                marketCap?: number;
                volume24h?: number;
                priceChange24h?: number;
                [key: string]: unknown;
            };
        }> = [];
        const notFound: string[] = [];

        for (const token of tokens) {
            const filename = `${token.toLowerCase()}_intelligence.json`;
            const filePath = path.join(cacheDir, filename);

            try {
                const data = await fs.readFile(filePath, 'utf-8');
                comparisons.push({
                    token,
                    data: JSON.parse(data),
                });
            } catch {
                // Token not found - track for response
                notFound.push(token);
            }
        }

        if (comparisons.length === 0) {
            return NextResponse.json(
                {
                    error: 'No tokens found',
                    message: `None of the requested tokens (${tokens.join(', ')}) are available in the intelligence cache.`,
                    allowedTokens: ['VOT', 'MAXX', 'DEGEN', 'HIGHER', 'BUILD'],
                },
                { status: 404 }
            );
        }

        // Calculate comparison metrics
        const totalMarketCap = comparisons.reduce(
            (sum, t) => sum + (t.data.marketCap || 0),
            0
        );

        const totalVolume = comparisons.reduce(
            (sum, t) => sum + (t.data.volume24h || 0),
            0
        );

        const avgPriceChange = comparisons.reduce(
            (sum, t) => sum + (t.data.priceChange24h || 0),
            0
        ) / comparisons.length;

        // Find top performer
        const topPerformer = comparisons.reduce((best, current) => {
            const currentChange = current.data.priceChange24h || 0;
            const bestChange = best.data.priceChange24h || 0;
            return currentChange > bestChange ? current : best;
        }, comparisons[0]);

        const response = {
            tokens: comparisons,
            comparison: {
                topPerformer: topPerformer.token,
                topPerformerChange: topPerformer.data.priceChange24h,
                totalMarketCap,
                totalVolume24h: totalVolume,
                averagePriceChange24h: avgPriceChange,
                tokensCompared: comparisons.length,
            },
            notFound: notFound.length > 0 ? notFound : undefined,
            meta: {
                apiVersion: '1.0.0',
                timestamp: new Date().toISOString(),
                provider: 'MAXX Intelligence APIs',
                paymentVerified: true,
                price: '$0.10 USDC',
                gasless: true,
                facilitator: 'Coinbase CDP',
                dataSource: 'VOT Trading Bot (aggregated cache)',
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
        console.error('[x402/compare] Intelligence comparison error:', error);

        return NextResponse.json(
            { error: sanitizeError(error, process.env.NODE_ENV === 'development') },
            { status: 500 }
        );
    }
}

// Export with x402 payment wrapper
export const GET = withX402Payment('token-compare', handler);
export const POST = withX402Payment('token-compare', handler);
