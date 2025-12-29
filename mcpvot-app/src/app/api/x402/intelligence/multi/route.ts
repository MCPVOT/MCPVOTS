import type { PaymentContext } from '@/lib/x402/middleware';
import { withX402Payment } from '@/lib/x402/middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Multi-Token Intelligence API - x402 PAID VERSION ($0.10)
 *
 * Analyze up to 5 tokens in a single request
 * 50% discount vs individual queries (5 x $0.05 = $0.25 → $0.10)
 *
 * PROFITABLE: $0.10 USDC per batch
 * - Gas cost: ~$0.001 (Base L2)
 * - API costs: ~$0.01 (5 DexScreener calls)
 * - Profit margin: ~$0.089 per request
 */

const MAX_TOKENS = 5;

// Popular Base ecosystem tokens for quick lookup
const KNOWN_TOKENS: Record<string, string> = {
    'CLANKER': '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb',
    'DEGEN': '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
    'VOT': '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
    'MAXX': '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467',
    'HIGHER': '0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe',
    'BUILD': '0x3C281A39944a2319aA653D81Cfd93Ca10983D234',
    'MOXIE': '0x8C9037D1Ef5c6D1f6816278C7AAF5491d24CD527',
    'ENJOY': '0xa6B280B42CB0b7c4a4F789ec6cCC3a7b52CfEdcF',
    'BRETT': '0x532f27101965dd16442E59d40670FaF5eBB142E4',
    'TOSHI': '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4',
    'AERO': '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
};

interface TokenData {
    symbol: string;
    name: string;
    address: string;
    price_usd: number;
    volume_24h: number;
    price_change_24h: number;
    market_cap: number;
    liquidity_usd: number;
    chain: string;
}

// Fetch single token data from DexScreener
async function fetchTokenData(symbolOrAddress: string): Promise<TokenData | { error: string; query: string }> {
    try {
        const isAddress = symbolOrAddress.startsWith('0x') && symbolOrAddress.length === 42;
        let searchQuery = symbolOrAddress;

        if (!isAddress && KNOWN_TOKENS[symbolOrAddress.toUpperCase()]) {
            searchQuery = KNOWN_TOKENS[symbolOrAddress.toUpperCase()];
        }

        const response = await fetch(
            `https://api.dexscreener.com/latest/dex/search?q=${searchQuery}`,
            { signal: AbortSignal.timeout(8000) }
        );

        if (!response.ok) {
            return { error: `DexScreener error: ${response.status}`, query: symbolOrAddress };
        }

        const data = await response.json();
        const pairs = data.pairs || [];

        // Filter to Base chain only
        const basePairs = pairs.filter((p: Record<string, unknown>) =>
            (p.chainId as string)?.toLowerCase() === 'base'
        );

        if (basePairs.length === 0) {
            return { error: 'Not found on Base', query: symbolOrAddress };
        }

        // Get highest liquidity pair
        const bestPair = basePairs.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
            parseFloat((b.liquidity as Record<string, unknown>)?.usd as string || '0') -
            parseFloat((a.liquidity as Record<string, unknown>)?.usd as string || '0')
        )[0];

        const baseToken = bestPair.baseToken as Record<string, string>;

        return {
            symbol: baseToken?.symbol || symbolOrAddress,
            name: baseToken?.name || 'Unknown',
            address: baseToken?.address,
            price_usd: parseFloat(bestPair.priceUsd || '0'),
            volume_24h: parseFloat((bestPair.volume as Record<string, string>)?.h24 || '0'),
            price_change_24h: parseFloat((bestPair.priceChange as Record<string, string>)?.h24 || '0'),
            market_cap: parseFloat(bestPair.marketCap || bestPair.fdv || '0'),
            liquidity_usd: parseFloat((bestPair.liquidity as Record<string, string>)?.usd || '0'),
            chain: 'base',
        };
    } catch (error) {
        return { error: (error as Error).message, query: symbolOrAddress };
    }
}

async function handler(
    request: NextRequest,
    context: PaymentContext
): Promise<NextResponse> {
    try {
        const body = await request.json().catch(() => ({}));
        const symbols: string[] = body.symbols || body.addresses || [];

        // Validate input
        if (!Array.isArray(symbols) || symbols.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Missing or invalid "symbols" array in request body',
                example: { symbols: ['CLANKER', 'DEGEN', 'VOT', 'HIGHER', 'BUILD'] },
            }, { status: 400 });
        }

        if (symbols.length > MAX_TOKENS) {
            return NextResponse.json({
                success: false,
                error: `Maximum ${MAX_TOKENS} tokens per request`,
                requested: symbols.length,
            }, { status: 400 });
        }

        // Fetch all tokens in parallel
        const results = await Promise.all(
            symbols.map(sym => fetchTokenData(sym))
        );

        // Separate successful and failed results
        const tokens: TokenData[] = [];
        const errors: Array<{ query: string; error: string }> = [];

        for (const result of results) {
            if ('error' in result) {
                errors.push({ query: result.query, error: result.error });
            } else {
                tokens.push(result);
            }
        }

        // Calculate portfolio summary
        const totalMarketCap = tokens.reduce((sum, t) => sum + t.market_cap, 0);
        const totalVolume = tokens.reduce((sum, t) => sum + t.volume_24h, 0);
        const avgPriceChange = tokens.length > 0
            ? tokens.reduce((sum, t) => sum + t.price_change_24h, 0) / tokens.length
            : 0;

        // Sort by market cap (highest first)
        tokens.sort((a, b) => b.market_cap - a.market_cap);

        return NextResponse.json({
            success: true,
            x402_payment: {
                amount_usdc: context.paymentReceived || '0.10',
                payer: context.payerAddress,
                resource: 'multi-token-intelligence',
                discount: '50% vs individual queries',
            },
            summary: {
                tokens_analyzed: tokens.length,
                failed_queries: errors.length,
                total_market_cap_usd: totalMarketCap,
                total_volume_24h_usd: totalVolume,
                avg_price_change_24h: avgPriceChange.toFixed(2) + '%',
                timestamp: new Date().toISOString(),
            },
            tokens,
            errors: errors.length > 0 ? errors : undefined,
            data_source: 'DexScreener',
            chain: 'base',
        });
    } catch (error) {
        console.error('[x402/multi] Handler error:', error);
        return NextResponse.json({
            success: false,
            error: 'Multi-token analysis failed',
            details: (error as Error).message,
        }, { status: 500 });
    }
}

export const POST = withX402Payment('multi-token-intelligence', handler);

// Also support GET with query params
async function getHandler(
    request: NextRequest,
    context: PaymentContext
): Promise<NextResponse> {
    const url = new URL(request.url);
    const symbolsParam = url.searchParams.get('symbols') || url.searchParams.get('addresses');

    if (!symbolsParam) {
        return NextResponse.json({
            success: false,
            error: 'Missing "symbols" query parameter',
            example: '/api/x402/intelligence/multi?symbols=CLANKER,DEGEN,VOT',
        }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);

    // Create a mock request with the body
    const mockBody = JSON.stringify({ symbols });
    const mockRequest = new NextRequest(request.url, {
        method: 'POST',
        body: mockBody,
        headers: request.headers,
    });

    return handler(mockRequest, context);
}

export const GET = withX402Payment('multi-token-intelligence', getHandler);
