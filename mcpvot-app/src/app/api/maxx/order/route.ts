/**
 * MAXX Token Quote API
 * Returns quote for USDC → MAXX conversion via x402 facilitator
 */

import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MIN_USD = 1;
const MAX_USD = 1000;
const QUOTE_TTL_SECONDS = 20;

// MAXX Token Address (Base Mainnet)
const MAXX_TOKEN_ADDRESS = '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467';
const MAXX_POOL_ADDRESS = '0x11bb2563a35b46d4086eec991dd5f374d8122a69e7998da1706454d4ee298148';

interface QuotePayload {
    usdAmount: number;
    tokenAmount: number;
    pricePerTokenUsd: number;
    vaultGasCoverUsd: number;
    expiresAt: string;
    priceSource?: string;
    votBonus?: number;
}

async function fetchMAXXPrice(): Promise<{ priceUsd: number; source: string } | null> {
    // Try GeckoTerminal first
    try {
        const geckoUrl = `https://api.geckoterminal.com/api/v2/networks/base/pools/${MAXX_POOL_ADDRESS}`;
        const response = await fetch(geckoUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });

        if (response.ok) {
            const data = await response.json();
            const price = parseFloat(data.data?.attributes?.base_token_price_usd);
            if (price && price > 0) {
                console.log(`[MAXX Quote] GeckoTerminal price: $${price}`);
                return { priceUsd: price, source: 'geckoterminal' };
            }
        }
    } catch (error) {
        console.warn('[MAXX Quote] GeckoTerminal failed:', error);
    }

    // Try Birdeye
    try {
        const birdeyeUrl = `https://public-api.birdeye.so/defi/price?address=${MAXX_TOKEN_ADDRESS}`;
        const apiKey = process.env.BIRDEYE_API_KEY;
        if (apiKey) {
            const response = await fetch(birdeyeUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-API-KEY': apiKey
                },
                cache: 'no-store'
            });

            if (response.ok) {
                const data = await response.json();
                const price = parseFloat(data.data?.value);
                if (price && price > 0) {
                    console.log(`[MAXX Quote] Birdeye price: $${price}`);
                    return { priceUsd: price, source: 'birdeye' };
                }
            }
        }
    } catch (error) {
        console.warn('[MAXX Quote] Birdeye failed:', error);
    }

    // Try DexScreener
    try {
        const dexUrl = `https://api.dexscreener.com/latest/dex/tokens/${MAXX_TOKEN_ADDRESS}`;
        const response = await fetch(dexUrl, {
            method: 'GET',
            cache: 'no-store'
        });

        if (response.ok) {
            const data = await response.json();
            const pairs = data.pairs || [];
            if (pairs.length > 0) {
                const price = parseFloat(pairs[0].priceUsd);
                if (price && price > 0) {
                    console.log(`[MAXX Quote] DexScreener price: $${price}`);
                    return { priceUsd: price, source: 'dexscreener' };
                }
            }
        }
    } catch (error) {
        console.warn('[MAXX Quote] DexScreener failed:', error);
    }

    return null;
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const rawUsd = url.searchParams.get('usdAmount');
        const usdAmount = rawUsd ? parseFloat(rawUsd) : MIN_USD;

        if (isNaN(usdAmount) || usdAmount < MIN_USD || usdAmount > MAX_USD) {
            return NextResponse.json({
                success: false,
                error: `USD amount must be between ${MIN_USD} and ${MAX_USD}`
            }, { status: 400 });
        }

        // Fetch MAXX price
        const priceData = await fetchMAXXPrice();
        
        if (!priceData) {
            return NextResponse.json({
                success: false,
                error: 'Unable to fetch MAXX price from any source'
            }, { status: 503 });
        }

        const { priceUsd, source } = priceData;
        
        // Calculate MAXX amount
        const tokenAmount = usdAmount / priceUsd;
        
        // Generate quote
        const expiresAt = new Date(Date.now() + QUOTE_TTL_SECONDS * 1000).toISOString();
        
        const quote: QuotePayload = {
            usdAmount,
            tokenAmount,
            pricePerTokenUsd: priceUsd,
            vaultGasCoverUsd: 0.05, // Treasury covers gas
            expiresAt,
            priceSource: source,
            votBonus: 10000 // 10,000 VOT bonus with every MAXX purchase!
        };

        return NextResponse.json({
            success: true,
            quote,
            quoteId: randomUUID(),
            token: 'MAXX',
            tokenAddress: MAXX_TOKEN_ADDRESS,
            poolAddress: MAXX_POOL_ADDRESS,
            network: 'base',
            bonusInfo: '🎁 Every MAXX purchase includes 10,000 VOT bonus!'
        });

    } catch (error) {
        console.error('[MAXX Quote] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to generate MAXX quote'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // For now, redirect to GET for quote generation
    // The actual purchase is handled by /api/x402/facilitator with token=MAXX
    const url = new URL(request.url);
    return GET(new Request(url.toString().replace('?', '?') + '&method=POST'));
}
