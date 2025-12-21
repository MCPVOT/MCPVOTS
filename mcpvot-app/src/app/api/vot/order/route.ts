import { mcp_maxx_memory_store_memory } from '@/lib/mcp-memory-client';
import { VOT_TOKEN_ADDRESS } from '@/lib/vot-token';
import { randomUUID } from 'crypto';
import { ethers } from 'ethers';
import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { join } from 'path';
import { isAddress } from 'viem';

export const runtime = 'nodejs';

const MIN_USD = 1;
const MAX_USD = 1000;
const DEFAULT_PRICE_USD = 0.015; // Fallback per VOT in USD if market data unavailable
const QUOTE_TTL_SECONDS = 20;
const DEXSCREENER_TOKEN_URL = `https://api.dexscreener.com/latest/dex/tokens/${VOT_TOKEN_ADDRESS}`;
const DEXSCREENER_PAIR_URL = process.env.DEXSCREENER_PAIR_ADDRESS
    ? `https://api.dexscreener.com/latest/dex/pairs/base/${process.env.DEXSCREENER_PAIR_ADDRESS}`
    : null;
const BIRDEYE_PRICE_URL = 'https://public-api.birdeye.so/defi/price';
const COINGECKO_ETH_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
const GECKOTERMINAL_POOL_ADDRESS = process.env.GECKOTERMINAL_POOL_ADDRESS
    || process.env.VOT_PRICE_POOL_ADDRESS
    || process.env.VOT_PRICE_PAIR_ADDRESS
    || process.env.DEXSCREENER_PAIR_ADDRESS
    || 'b7730dd50a401a0e57c7438e6d532b6aeccea33254834f4ebfe8311e46f2ce2c';  // Default VOT/WETH pool
const GECKOTERMINAL_POOL_URL = GECKOTERMINAL_POOL_ADDRESS
    ? `https://api.geckoterminal.com/api/v2/networks/base/pools/${GECKOTERMINAL_POOL_ADDRESS}`
    : null;
const INTELLIGENCE_CACHE_PATH = join(
    process.cwd(),
    '..',
    'VOT_Trading_Bot',
    'intelligence_cache',
    'vot_intelligence.json'
);

interface QuotePayload {
    usdAmount: number;
    votAmount: number;
    pricePerVotUsd: number;
    vaultGasCoverUsd: number;
    expiresAt: string;
    tokenAmount: number;
    pricePerTokenUsd: number;
    priceSource?: string;
}

type DexscreenerPricing = {
    priceUsd: number | null;
    priceNative: number | null;
};

async function fetchDexscreenerPricing(): Promise<DexscreenerPricing | null> {
    const urls = [DEXSCREENER_TOKEN_URL, DEXSCREENER_PAIR_URL].filter((url): url is string => Boolean(url));

    for (const url of urls) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                cache: 'no-store'
            });

            if (!response.ok) {
                continue;
            }

            const payload = await response.json();
            const pairs: Array<Record<string, unknown>> = Array.isArray(payload?.pairs) ? payload.pairs : [];
            const primary = pairs[0];
            if (!primary) {
                // If token endpoint returns no pairs, try the Dexscreener search endpoint
                try {
                    const searchUrl = `https://api.dexscreener.com/latest/dex/search?q=${VOT_TOKEN_ADDRESS}`;
                    const searchResp = await fetch(searchUrl, { method: 'GET', cache: 'no-store' });
                    if (searchResp.ok) {
                        const searchPayload = await searchResp.json();
                        const results: Array<Record<string, unknown>> = Array.isArray(searchPayload?.pairs) ? searchPayload.pairs : [];
                        // Attempt to find a pair matching the token address or base chain
                        const found = results.find((r) => {
                            const pair = (r as Record<string, unknown>)['pair'] as Record<string, unknown> | undefined;
                            const tokenA = String((pair?.address0 as unknown as string) || '').toLowerCase();
                            const tokenB = String((pair?.address1 as unknown as string) || '').toLowerCase();
                            return tokenA === VOT_TOKEN_ADDRESS.toLowerCase() || tokenB === VOT_TOKEN_ADDRESS.toLowerCase();
                        });
                        if (found) {
                            const rawPriceUsd = typeof found.priceUsd === 'string' ? parseFloat(found.priceUsd) : Number(found?.priceUsd ?? NaN);
                            const rawPriceNative = typeof found.priceNative === 'string' ? parseFloat(found.priceNative) : Number(found?.priceNative ?? NaN);
                            const priceUsd = Number.isFinite(rawPriceUsd) && rawPriceUsd > 0 ? rawPriceUsd : null;
                            const priceNative = Number.isFinite(rawPriceNative) && rawPriceNative > 0 ? rawPriceNative : null;
                            if (priceUsd || priceNative) {
                                return { priceUsd, priceNative };
                            }
                        }
                    }
                } catch (innerErr) {
                    console.warn('[VOT Order] Dexscreener search fallback failed:', innerErr);
                }
                continue;
            }

            const rawPriceUsd = typeof primary.priceUsd === 'string' ? parseFloat(primary.priceUsd) : Number(primary?.priceUsd ?? NaN);
            const rawPriceNative = typeof primary.priceNative === 'string' ? parseFloat(primary.priceNative) : Number(primary?.priceNative ?? NaN);

            const priceUsd = Number.isFinite(rawPriceUsd) && rawPriceUsd > 0 ? rawPriceUsd : null;
            const priceNative = Number.isFinite(rawPriceNative) && rawPriceNative > 0 ? rawPriceNative : null;

            if (!priceUsd && !priceNative) {
                continue;
            }

            return { priceUsd, priceNative };
        } catch (error) {
            console.warn('[VOT Order] Dexscreener price fetch failed:', { url, error });
        }
    }

    return null;
}

async function fetchOnChainPairPrice(): Promise<number | null> {
    try {
        const pairAddress = (process.env.VOT_PRICE_PAIR_ADDRESS || process.env.DEXSCREENER_PAIR_ADDRESS);
        if (!pairAddress) return null;
        const rpc = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
        const provider = new ethers.JsonRpcProvider(rpc as string);
        const pairAbi = [
            'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
            'function token0() view returns (address)',
            'function token1() view returns (address)'
        ];
        const erc20Abi = ['function decimals() view returns (uint8)'];
        const pair = new ethers.Contract(pairAddress, pairAbi, provider);
        const [reserve0, reserve1] = await pair.getReserves();
        const token0 = (await pair.token0()) as string;
        const token1 = (await pair.token1()) as string;

        // Determine which side is VOT
        const votAddr = VOT_TOKEN_ADDRESS.toLowerCase();
        const token0addr = token0.toLowerCase();
        const token1addr = token1.toLowerCase();

        let votReserve: bigint;
        let otherReserve: bigint;
        let otherAddr: string;
        if (token0addr === votAddr) {
            votReserve = BigInt(reserve0.toString());
            otherReserve = BigInt(reserve1.toString());
            otherAddr = token1addr;
        } else if (token1addr === votAddr) {
            votReserve = BigInt(reserve1.toString());
            otherReserve = BigInt(reserve0.toString());
            otherAddr = token0addr;
        } else {
            // Pair does not involve VOT
            return null;
        }

        // Fetch decimals
        const tokenVot = new ethers.Contract(VOT_TOKEN_ADDRESS, erc20Abi, provider);
        const tokenOther = new ethers.Contract(otherAddr, erc20Abi, provider);
        const votDecimals: number = Number(await tokenVot.decimals());
        const otherDecimals: number = Number(await tokenOther.decimals());

        // Convert reserves to floating-point values in human units
        const votNormalized = Number(votReserve) / Math.pow(10, votDecimals);
        const otherNormalized = Number(otherReserve) / Math.pow(10, otherDecimals);

        if (votNormalized === 0) return null;

        // If other token is a stablecoin (6 or 18 decimals) try to detect it's USDC-like USD
        // We'll use a heuristic: if otherDecimals === 6, it's likely USDC/USDT; treat as USD directly
        if (otherDecimals === 6) {
            const priceUsd = otherNormalized / votNormalized;
            return Number.isFinite(priceUsd) && priceUsd > 0 ? priceUsd : null;
        }

        // If other token is native (18 decimals), convert via ETH -> USD rate
        if (otherDecimals === 18) {
            const ethPrice = await fetchEthPriceUsd();
            if (!ethPrice) return null;
            const priceUsd = (otherNormalized / votNormalized) * ethPrice;
            return Number.isFinite(priceUsd) && priceUsd > 0 ? priceUsd : null;
        }

        return null;
    } catch (error) {
        console.warn('[VOT Order] On-chain pair price fetch failed:', error);
        return null;
    }
}

async function fetchBirdeyePrice(): Promise<number | null> {
    const apiKey = process.env.BIRDEYE_API_KEY;
    if (!apiKey) {
        return null;
    }

    try {
        const url = new URL(BIRDEYE_PRICE_URL);
        url.searchParams.set('address', VOT_TOKEN_ADDRESS);
        url.searchParams.set('chain', 'base');

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-KEY': apiKey
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            return null;
        }

        const payload = await response.json();
        const priceValue = payload?.data?.price;
        const priceNumber = typeof priceValue === 'string' ? parseFloat(priceValue) : Number(priceValue ?? NaN);
        return Number.isFinite(priceNumber) && priceNumber > 0 ? priceNumber : null;
    } catch (error) {
        console.warn('[VOT Order] Birdeye price fetch failed:', error);
        return null;
    }
}

async function fetchGeckoTerminalPrice(): Promise<number | null> {
    if (!GECKOTERMINAL_POOL_URL) {
        return null;
    }

    try {
        const response = await fetch(GECKOTERMINAL_POOL_URL, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            return null;
        }

        const payload = await response.json();
        // GeckoTerminal public API uses base_token_price_usd
        const priceValue = payload?.data?.attributes?.base_token_price_usd;
        const priceNumber = typeof priceValue === 'string' ? parseFloat(priceValue) : Number(priceValue ?? NaN);
        if (Number.isFinite(priceNumber) && priceNumber > 0) {
            console.log(`[VOT Order] GeckoTerminal price: $${priceNumber}`);
            return priceNumber;
        }
        return null;
    } catch (error) {
        console.warn('[VOT Order] GeckoTerminal price fetch failed:', error);
        return null;
    }
}

async function fetchEthPriceUsd(): Promise<number | null> {
    try {
        const response = await fetch(COINGECKO_ETH_PRICE_URL, {
            method: 'GET',
            cache: 'no-store'
        });
        if (!response.ok) {
            return null;
        }
        const payload = await response.json();
        const value = payload?.ethereum?.usd;
        const priceNumber = typeof value === 'string' ? parseFloat(value) : Number(value ?? NaN);
        return Number.isFinite(priceNumber) && priceNumber > 0 ? priceNumber : null;
    } catch (error) {
        console.warn('[VOT Order] CoinGecko ETH price fetch failed:', error);
        return null;
    }
}

async function fetchCoinGeckoTokenPrice(): Promise<number | null> {
    try {
        // Try supported platforms that could have the token listed.
        const platforms = ['base', 'ethereum'];
        for (const platform of platforms) {
            try {
                const url = `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${VOT_TOKEN_ADDRESS}&vs_currencies=usd`;
                const resp = await fetch(url, { method: 'GET', cache: 'no-store' });
                if (!resp.ok) continue;
                const json = await resp.json();
                const key = Object.keys(json)[0];
                const price = json?.[key]?.usd;
                const priceNum = typeof price === 'string' ? parseFloat(price) : Number(price ?? NaN);
                if (Number.isFinite(priceNum) && priceNum > 0) return priceNum;
            } catch (err) {
                console.warn('[VOT Order] CoinGecko token price fetch failed for platform', platform, err);
                continue;
            }
        }
    } catch (err) {
        console.warn('[VOT Order] CoinGecko token price fetch error', err);
    }
    return null;
}

async function fetchCachedIntelligencePrice(): Promise<number | null> {
    try {
        const file = await readFile(INTELLIGENCE_CACHE_PATH, 'utf-8');
        const data = JSON.parse(file) as {
            token_address?: string;
            summary?: { price?: number; timestamp?: number | string };
            full_analysis?: { market_data?: { price?: number }; token_address?: string };
            metadata?: { timestamp?: number | string };
        };

        // Verify intelligence is for the active VOT token; if mismatch, ignore
        const cachedToken = (data.token_address || data.full_analysis?.token_address || '').toString().toLowerCase();
        if (cachedToken && cachedToken !== VOT_TOKEN_ADDRESS.toLowerCase()) {
            console.warn('[VOT Order] Intelligence cache token mismatch; ignoring cached intel', cachedToken);
            return null;
        }

        const summaryPrice = typeof data?.summary?.price === 'number' ? data.summary.price : null;
        // Accept both numeric epoch timestamps and ISO strings
        const summaryTimestampRaw = data?.summary?.timestamp ?? data?.metadata?.timestamp ?? null;
        let summaryTimestamp: number | null = null;
        if (typeof summaryTimestampRaw === 'number') {
            summaryTimestamp = summaryTimestampRaw;
        } else if (typeof summaryTimestampRaw === 'string') {
            const parsed = Date.parse(summaryTimestampRaw);
            if (!Number.isNaN(parsed)) summaryTimestamp = Math.floor(parsed / 1000);
        }
        const freshSeconds = Number(process.env.INTELLIGENCE_CACHE_FRESH_SECONDS ?? '120');
        if (summaryPrice && summaryPrice > 0) {
            if (summaryTimestamp && (Date.now() / 1000 - summaryTimestamp) > freshSeconds) {
                // stale
            } else {
                return summaryPrice;
            }
        }

        const analysisPrice = typeof data?.full_analysis?.market_data?.price === 'number'
            ? data.full_analysis.market_data.price
            : null;

        if (analysisPrice && analysisPrice > 0) {
            return analysisPrice;
        }

        return null;
    } catch (error) {
        console.warn('[VOT Order] Intelligence cache price fetch failed:', error);
        return null;
    }
}

async function resolveVotPriceUsd(): Promise<{ price: number; source: string }> {
    // PRIORITY: GeckoTerminal first (most reliable for VOT)
    const geckoTerminalPrice = await fetchGeckoTerminalPrice();
    if (geckoTerminalPrice) {
        return { price: geckoTerminalPrice, source: 'geckoterminal' };
    }

    // Then try DexScreener
    const dexPricing = await fetchDexscreenerPricing();
    if (dexPricing?.priceUsd) {
        return { price: dexPricing.priceUsd, source: 'dexscreener' };
    }

    const birdeyePrice = await fetchBirdeyePrice();
    if (birdeyePrice) {
        return { price: birdeyePrice, source: 'birdeye' };
    }

    const cachedPrice = await fetchCachedIntelligencePrice();
    if (cachedPrice) {
        return { price: cachedPrice, source: 'intelligence_cache' };
    }

    // Try on-chain pair price from a configured pair address
    const onchainPrice = await fetchOnChainPairPrice();
    if (onchainPrice) {
        return { price: onchainPrice, source: 'onchain_pair' };
    }

    if (dexPricing?.priceNative) {
        const ethPriceUsd = await fetchEthPriceUsd();
        if (ethPriceUsd) {
            return { price: dexPricing.priceNative * ethPriceUsd, source: 'dexscreener_native_ratio' };
        }
    }

    // Try CoinGecko token price as another fallback
    const coinGeckoPrice = await fetchCoinGeckoTokenPrice();
    if (coinGeckoPrice) {
        return { price: coinGeckoPrice, source: 'coingecko' };
    }

    // If fallback quotes are disabled in the environment, error early
    const disallowFallback = String(process.env.DISALLOW_FALLBACK_QUOTES || '').toLowerCase() === 'true';
    if (disallowFallback) {
        throw new Error('VOT price not available from market data sources; fallback quotes are disabled');
    }

    console.warn('[VOT Order] Falling back to default VOT price.');
    try {
        await mcp_maxx_memory_store_memory({
            content: JSON.stringify({
                event: 'vot_price_fallback_used',
                defaultPrice: DEFAULT_PRICE_USD,
                timestamp: new Date().toISOString()
            }),
            vector: [],
            category: 'vot_trading',
            metadata: { source: 'resolveVotPriceUsd' }
        });
    } catch {
        // ignore logging errors
    }

    return { price: DEFAULT_PRICE_USD, source: 'fallback' };
}

async function createQuote(usdAmount: number): Promise<QuotePayload> {
    const { price: pricePerVotUsd, source: priceSource } = await resolveVotPriceUsd();
    if (priceSource !== 'dexscreener' && priceSource !== 'birdeye' && priceSource !== 'onchain_pair') {
        console.warn('[VOT Order] Non-market price source used:', priceSource);
    }
    const votAmount = parseFloat((usdAmount / pricePerVotUsd).toFixed(4));
    const vaultGasCoverUsd = parseFloat((Math.max(usdAmount * 0.005, 0.05)).toFixed(2));
    const expiresAt = new Date(Date.now() + QUOTE_TTL_SECONDS * 1000).toISOString();

    return {
        usdAmount,
        votAmount,
        pricePerVotUsd,
        vaultGasCoverUsd,
        expiresAt,
        tokenAmount: votAmount,
        pricePerTokenUsd: pricePerVotUsd,
        priceSource
    };
}

function validateAmount(amount: number) {
    if (Number.isNaN(amount)) {
        throw new Error('Amount must be a number');
    }
    if (amount < MIN_USD || amount > MAX_USD) {
        throw new Error(`Amount must be between ${MIN_USD} and ${MAX_USD} USD`);
    }
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const usdAmountParam = url.searchParams.get('usdAmount');
        const usdAmount = usdAmountParam ? parseFloat(usdAmountParam) : MIN_USD;
        validateAmount(usdAmount);

        const quote = await createQuote(usdAmount);
        return NextResponse.json({ success: true, quote });
    } catch (error) {
        console.error('[VOT Order] Quote error:', error);
        const message = error instanceof Error ? error.message : 'Unable to create quote';
        return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const usdAmount = parseFloat(body?.usdAmount);
        const walletAddress = typeof body?.walletAddress === 'string' ? body.walletAddress : undefined;
        const farcasterFid = typeof body?.farcasterFid === 'number' ? body.farcasterFid : undefined;
        const source = typeof body?.source === 'string' ? body.source : 'web';

        validateAmount(usdAmount);
        if (!walletAddress) {
            throw new Error('walletAddress is required');
        }

        if (!isAddress(walletAddress)) {
            throw new Error('walletAddress is not a valid address');
        }

        const quote = await createQuote(usdAmount);

        const settlementReference = randomUUID();
        const settlementRequest = {
            facilitator: 'cdp',
            reference: settlementReference,
            expiresInSeconds: QUOTE_TTL_SECONDS,
            requestedAt: new Date().toISOString(),
            status: 'pending' as const
        };

        const memoryId = await mcp_maxx_memory_store_memory({
            content: JSON.stringify({
                type: 'vot_quote_requested',
                usdAmount: quote.usdAmount,
                votAmount: quote.votAmount,
                tokenAmount: quote.tokenAmount,
                pricePerVotUsd: quote.pricePerVotUsd,
                pricePerTokenUsd: quote.pricePerTokenUsd,
                walletAddress,
                farcasterFid,
                settlementReference,
                facilitator: settlementRequest.facilitator,
                status: settlementRequest.status,
                requestedAt: settlementRequest.requestedAt,
                expiresAt: quote.expiresAt,
                source
            }),
            vector: new Array(64).fill(0),
            category: 'vot_orders',
            metadata: {
                walletAddress,
                farcasterFid,
                settlementReference,
                usdAmount: quote.usdAmount,
                status: settlementRequest.status,
                source
            }
        });

        const memory = memoryId
            ? { status: 'stored' as const, id: memoryId }
            : { status: 'offline' as const };

        return NextResponse.json({ success: true, quote, settlementRequest, memory });
    } catch (error) {
        console.error('[VOT Order] Request error:', error);
        const message = error instanceof Error ? error.message : 'Unable to start order';
        return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
}
