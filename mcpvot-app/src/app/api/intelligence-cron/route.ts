import { NextResponse } from 'next/server';

// Type definitions
interface FarcasterCastAuthor {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
}

interface FarcasterCastReactions {
    likes_count?: number;
    recasts_count?: number;
}

interface FarcasterCastReplies {
    count?: number;
}

interface FarcasterCast {
    hash: string;
    text: string;
    author: FarcasterCastAuthor;
    reactions?: FarcasterCastReactions;
    replies?: FarcasterCastReplies;
    timestamp: string;
}

interface ExtractedToken {
    address: string;
    symbol: string;
    mentionedBy: string;
    castHash: string;
    timestamp: string;
}

interface TrendingCast {
    hash: string;
    text: string;
    author: {
        fid: number;
        username: string;
        displayName: string;
        pfp: string;
    };
    engagement: number;
    timestamp: string;
}

interface IntelligenceData {
    tokens: ExtractedToken[];
    casts: TrendingCast[];
    timestamp: string;
}

/**
 * Intelligence Cron Job - Runs every 15 minutes
 * Fetches trending tokens from clanker.world + Farcaster
 * Stores in IPFS + caches in DB
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');

    // Verify cron secret
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('🤖 Starting intelligence cron job...');

        // 1. Fetch trending clanker tokens
        const clankerTokens = await fetchTrendingClankerTokens();

        // 2. Fetch Farcaster trending casts
        const trendingCasts = await fetchTrendingCasts();

        // 3. Store in IPFS
        const ipfsCID = await storeInIPFS({
            tokens: clankerTokens,
            casts: trendingCasts,
            timestamp: new Date().toISOString()
        });

        // 4. Cache in database
        await cacheInDatabase(ipfsCID, clankerTokens, trendingCasts);

        console.log('✅ Intelligence cron complete:', ipfsCID);

        return NextResponse.json({
            success: true,
            ipfsCID,
            tokensFound: clankerTokens.length,
            castsFound: trendingCasts.length
        });
    } catch (error) {
        console.error('❌ Intelligence cron error:', error);
        return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
    }
}

async function fetchTrendingClankerTokens() {
    const neynar = await import('@/lib/neynar-server');

    // Search for clanker token mentions in last 24h
    const searches = ['clanker', '$DEGEN', '$HIGHER', 'warpcast token'];
    const tokens: ExtractedToken[] = [];

    for (const query of searches) {
        try {
            const result = await neynar.searchCasts(query, { limit: 50 });

            if (result?.casts) {
                // Extract token addresses from casts
                const extractedTokens = result.casts
                    .map((cast: FarcasterCast) => extractTokenFromCast(cast))
                    .filter(Boolean) as ExtractedToken[];

                tokens.push(...extractedTokens);
            }
        } catch (err) {
            console.warn(`⚠️ Search failed for ${query}:`, err);
        }
    }

    // Deduplicate by address
    const uniqueTokens = Array.from(
        new Map(tokens.map(t => [t.address.toLowerCase(), t])).values()
    );

    return uniqueTokens.slice(0, 20); // Top 20
}

async function fetchTrendingCasts() {
    const neynar = await import('@/lib/neynar-server');

    try {
        // Get trending casts from Base/DeFi channels
        const channels = ['base', 'defi', 'clanker'];
        const allCasts: FarcasterCast[] = [];

        for (const channel of channels) {
            const result = await neynar.fetchFeed(channel, { limit: 25 });
            if (result?.casts) {
                allCasts.push(...result.casts);
            }
        }

        // Sort by engagement (likes + recasts + replies)
        return allCasts
            .map((cast): TrendingCast => ({
                hash: cast.hash,
                text: cast.text,
                author: {
                    fid: cast.author.fid,
                    username: cast.author.username,
                    displayName: cast.author.display_name,
                    pfp: cast.author.pfp_url
                },
                engagement: (cast.reactions?.likes_count || 0) +
                    (cast.reactions?.recasts_count || 0) +
                    (cast.replies?.count || 0),
                timestamp: cast.timestamp
            }))
            .sort((a, b) => b.engagement - a.engagement)
            .slice(0, 50);
    } catch (error) {
        console.error('Failed to fetch trending casts:', error);
        return [];
    }
}

function extractTokenFromCast(cast: FarcasterCast): ExtractedToken | null {
    const text = cast.text || '';

    // Extract Ethereum addresses (0x...)
    const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
    if (!addressMatch) return null;

    // Extract token symbol if mentioned
    const symbolMatch = text.match(/\$([A-Z]+)/);

    return {
        address: addressMatch[0],
        symbol: symbolMatch?.[1] || 'UNKNOWN',
        mentionedBy: cast.author.username,
        castHash: cast.hash,
        timestamp: cast.timestamp
    };
}

async function storeInIPFS(data: IntelligenceData) {
    const response = await fetch('http://localhost:5001/api/v0/add', {
        method: 'POST',
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('IPFS storage failed');
    }

    const result = await response.json();
    return result.Hash;
}

async function cacheInDatabase(ipfsCID: string, tokens: ExtractedToken[], casts: TrendingCast[]) {
    const postgres = (await import('postgres')).default;
    const sql = postgres(process.env.POSTGRES_URL, {
        ssl: 'require'
    });

    try {
        // Store IPFS reference
        await sql`
        INSERT INTO intelligence_cache (ipfs_cid, token_count, cast_count, created_at)
        VALUES (${ipfsCID}, ${tokens.length}, ${casts.length}, NOW())
      `;

        // Cache tokens for fast access
        for (const token of tokens) {
            await sql`
          INSERT INTO trending_tokens (address, symbol, mentioned_by, cast_hash, cached_at)
          VALUES (${token.address}, ${token.symbol}, ${token.mentionedBy}, ${token.castHash}, NOW())
          ON CONFLICT (address) DO UPDATE
          SET cached_at = NOW(), mentioned_by = ${token.mentionedBy}
        `;
        }
    } finally {
        await sql.end();
    }
}
