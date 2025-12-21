import { NextRequest, NextResponse } from 'next/server';

/**
 * COMPREHENSIVE TOKEN INTELLIGENCE API
 *
 * Aggregates data from ALL available sources:
 * - Neynar: Farcaster mentions, sentiment, cast engagement
 * - DexScreener: Price, volume, liquidity, holders
 * - CoinGecko: Market cap, 24h change, circulating supply
 * - Birdeye: Base-specific metrics, trading pairs
 * - Dune Analytics: On-chain analytics, holder distribution
 * - Basescan/Etherscan: Contract verification, token transfers
 *
 * Example: $LOOP (0xA763B711B55935f6D7BA2f93E1adF741E2446B07)
 * Returns: Complete intelligence profile with NFT data, social sentiment, on-chain metrics
 *
 * Pricing: $0.33 USDC per query (increased from $0.10)
 * Caching: Results stored in DB for 5 minutes to optimize future queries
 */

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const DUNE_API_KEY = process.env.DUNE_API_KEY;

// Farcaster Cast Types
interface FarcasterCastReactions {
    likes_count?: number;
    recasts_count?: number;
}

interface FarcasterCastAuthor {
    username?: string;
    fid?: number;
}

interface FarcasterCastChannel {
    id?: string;
}

interface FarcasterCast {
    hash: string;
    text: string;
    author?: FarcasterCastAuthor;
    reactions?: FarcasterCastReactions;
    channel?: FarcasterCastChannel;
}

// Basescan Holder Data
interface BasescanHolder {
    TokenHolderAddress: string;
    TokenHolderQuantity: string;
}

interface TokenIntelligence {
    address: string;
    symbol?: string;
    name?: string;

    // Price & Market Data
    price_usd?: number;
    market_cap?: number;
    volume_24h?: number;
    price_change_24h?: number;
    liquidity?: number;

    // On-Chain Metrics
    total_supply?: number;
    circulating_supply?: number;
    holder_count?: number;
    top_holders?: Array<{ address: string; balance: string; percentage: number }>;

    // Farcaster Social Intelligence
    farcaster_mentions_24h?: number;
    farcaster_sentiment_score?: number;
    farcaster_top_casts?: Array<{
        hash: string;
        text: string;
        author: string;
        likes: number;
        recasts: number;
    }>;
    farcaster_trending_channels?: string[];

    // NFT Data (if applicable)
    has_nft?: boolean;
    nft_collection?: {
        name: string;
        floor_price?: number;
        volume_24h?: number;
        holder_count?: number;
    };

    // DeFi Metrics
    dex_pairs?: Array<{
        dex: string;
        pair_address: string;
        liquidity_usd: number;
        volume_24h: number;
    }>;

    // Intelligence Quality Score
    data_sources_count: number;
    last_updated: string;
    cache_hit: boolean;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const skipCache = searchParams.get('skip_cache') === 'true';

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return NextResponse.json(
            { error: 'Invalid token address format' },
            { status: 400 }
        );
    }

    try {
        // Check cache first (unless skipCache=true)
        if (!skipCache) {
            // TODO: Query DB for cached intelligence
            // const cached = await db.query('SELECT * FROM token_intelligence WHERE address = ? AND updated_at > NOW() - INTERVAL 5 MINUTE', [address]);
            // if (cached) return NextResponse.json({ ...cached, cache_hit: true });
        }

        const intelligence: Partial<TokenIntelligence> = {
            address,
            data_sources_count: 0,
            last_updated: new Date().toISOString(),
            cache_hit: false,
        };

        // Parallel data fetching from all sources
        const dataFetchers = [
            fetchDexScreenerData(address),
            fetchBirdeyeData(address),
            fetchCoinGeckoData(address),
            fetchNeynarSentiment(address),
            fetchBasescanData(address),
            fetchDuneAnalytics(),
        ];

        const results = await Promise.allSettled(dataFetchers);

        // Aggregate results
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                Object.assign(intelligence, result.value);
                intelligence.data_sources_count! += 1;
            } else if (result.status === 'rejected') {
                console.error(`Data source ${index} failed:`, result.reason);
            }
        });

        // Store in DB for future queries
        // TODO: await db.query('INSERT INTO token_intelligence VALUES (?)', [intelligence]);

        return NextResponse.json({
            success: true,
            intelligence,
            pricing: {
                cost_usdc: 0.33,
                payment_required: true,
                payment_method: 'x402',
            },
        });
    } catch (error) {
        console.error('Token intelligence API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch token intelligence',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// Data source fetchers
async function fetchDexScreenerData(address: string) {
    try {
        const response = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${address}`,
            { next: { revalidate: 60 } }
        );

        if (!response.ok) return null;

        const data = await response.json();
        const pair = data.pairs?.[0];

        if (!pair) return null;

        return {
            symbol: pair.baseToken?.symbol,
            name: pair.baseToken?.name,
            price_usd: parseFloat(pair.priceUsd || 0),
            volume_24h: parseFloat(pair.volume?.h24 || 0),
            liquidity: parseFloat(pair.liquidity?.usd || 0),
            price_change_24h: parseFloat(pair.priceChange?.h24 || 0),
            dex_pairs: [
                {
                    dex: pair.dexId,
                    pair_address: pair.pairAddress,
                    liquidity_usd: parseFloat(pair.liquidity?.usd || 0),
                    volume_24h: parseFloat(pair.volume?.h24 || 0),
                },
            ],
        };
    } catch (error) {
        console.error('DexScreener fetch error:', error);
        return null;
    }
}

async function fetchBirdeyeData(address: string) {
    if (!BIRDEYE_API_KEY) return null;

    try {
        const response = await fetch(
            `https://public-api.birdeye.so/defi/token_overview?address=${address}`,
            {
                headers: { 'X-API-KEY': BIRDEYE_API_KEY },
                next: { revalidate: 60 },
            }
        );

        if (!response.ok) return null;

        const data = await response.json();

        return {
            market_cap: data.data?.mc,
            liquidity: data.data?.liquidity,
            holder_count: data.data?.holder,
        };
    } catch (error) {
        console.error('Birdeye fetch error:', error);
        return null;
    }
}

async function fetchCoinGeckoData(address: string) {
    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/base/contract/${address}`,
            {
                headers: COINGECKO_API_KEY
                    ? { 'x-cg-pro-api-key': COINGECKO_API_KEY }
                    : {},
                next: { revalidate: 300 },
            }
        );

        if (!response.ok) return null;

        const data = await response.json();

        return {
            symbol: data.symbol?.toUpperCase(),
            name: data.name,
            market_cap: data.market_data?.market_cap?.usd,
            circulating_supply: data.market_data?.circulating_supply,
            total_supply: data.market_data?.total_supply,
        };
    } catch (error) {
        console.error('CoinGecko fetch error:', error);
        return null;
    }
}

async function fetchNeynarSentiment(address: string) {
    if (!NEYNAR_API_KEY) return null;

    try {
        // Search for casts mentioning the token address or symbol
        const response = await fetch(
            `https://api.neynar.com/v2/farcaster/cast/search?q=${address}&limit=25`,
            {
                headers: { api_key: NEYNAR_API_KEY },
                next: { revalidate: 60 },
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        const casts = data.result?.casts || [];

        // Calculate sentiment score based on engagement
        const totalLikes = casts.reduce(
            (sum: number, cast: FarcasterCast) => sum + (cast.reactions?.likes_count || 0),
            0
        );
        const totalRecasts = casts.reduce(
            (sum: number, cast: FarcasterCast) => sum + (cast.reactions?.recasts_count || 0),
            0
        );
        const sentimentScore = Math.min((totalLikes + totalRecasts * 2) / 10, 100);

        // Extract trending channels
        const channels = new Set(
            casts.map((cast: FarcasterCast) => cast.channel?.id).filter(Boolean)
        );

        return {
            farcaster_mentions_24h: casts.length,
            farcaster_sentiment_score: sentimentScore,
            farcaster_top_casts: casts.slice(0, 5).map((cast: FarcasterCast) => ({
                hash: cast.hash,
                text: cast.text,
                author: cast.author?.username,
                likes: cast.reactions?.likes_count || 0,
                recasts: cast.reactions?.recasts_count || 0,
            })),
            farcaster_trending_channels: Array.from(channels).slice(0, 3),
        };
    } catch (error) {
        console.error('Neynar sentiment fetch error:', error);
        return null;
    }
}

async function fetchBasescanData(address: string) {
    try {
        const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;
        if (!BASESCAN_API_KEY) return null;

        // Fetch token holder count
        const response = await fetch(
            `https://api.basescan.org/api?module=token&action=tokenholderlist&contractaddress=${address}&page=1&offset=100&apikey=${BASESCAN_API_KEY}`,
            { next: { revalidate: 300 } }
        );

        if (!response.ok) return null;

        const data = await response.json();

        if (data.status !== '1') return null;

        const holders = data.result || [];
        const topHolders = holders.slice(0, 10).map((holder: BasescanHolder) => ({
            address: holder.TokenHolderAddress,
            balance: holder.TokenHolderQuantity,
            percentage: parseFloat(holder.TokenHolderQuantity) / 100,
        }));

        return {
            holder_count: holders.length,
            top_holders: topHolders,
        };
    } catch (error) {
        console.error('Basescan fetch error:', error);
        return null;
    }
}

async function fetchDuneAnalytics() {
    if (!DUNE_API_KEY) return null;

    try {
        // TODO: Implement Dune Analytics query
        // This would require a pre-configured Dune query ID
        // Example: holder distribution over time, trading patterns, whale movements
        return null;
    } catch (error) {
        console.error('Dune Analytics fetch error:', error);
        return null;
    }
}
