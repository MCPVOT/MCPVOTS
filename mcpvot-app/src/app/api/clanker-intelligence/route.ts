import { mcp_maxx_memory_store_memory } from '@/lib/mcp-memory-client';
import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface MarketData {
    symbol?: string;
    name?: string;
    address?: string;
    price_usd?: number;
    volume_24h?: number;
    price_change_24h?: number;
    market_cap?: number;
    liquidity_usd?: number;
    dex?: string;
    pair_address?: string;
    chain?: string;
    quote_token?: string;
    error?: string;
    closest_matches?: Array<{
        symbol?: string;
        name?: string;
        market_cap?: number;
    }>;
}

interface SentimentAnalysis {
    average_sentiment: number;
    sentiment_distribution: { positive: number; neutral: number; negative: number };
    total_engagement: { likes: number; recasts: number; replies: number };
    engagement_per_cast?: {
        likes: number;
        recasts: number;
        replies: number;
    };
}

interface SocialIntelligence {
    total_mentions: number;
    unique_authors: number;
    time_window: string;
    casts: unknown[]; // Complex Farcaster cast structure
    sentiment_analysis: SentimentAnalysis;
    error?: string;
}

interface TopicData {
    topic: string;
    count: number;
}

interface AuthorData {
    fid: number;
    cast_count: number;
}

interface TrendingAnalysis {
    total_trending_casts?: number;
    top_topics?: TopicData[];
    top_authors?: AuthorData[];
    total_engagement?: { likes: number; recasts: number; replies: number };
    engagement_rate?: {
        likes_per_cast: number;
        recasts_per_cast: number;
        replies_per_cast: number;
    };
    error?: string;
}

interface PlatformUser {
    fid: number;
    username?: string;
    display_name?: string;
    follower_count: number;
    verified: boolean;
}

interface PlatformUsers {
    total_platform_users?: number;
    top_users?: PlatformUser[];
    total_followers?: number;
    error?: string;
}

interface IntelligenceSummary {
    overall_sentiment: string;
    social_engagement_level: string;
    market_attention: string;
    recommendations: string[];
    key_metrics: {
        market_cap?: number;
        total_mentions: number;
        unique_authors: number;
        platform_users?: number;
    };
}

interface IntelligenceData {
    marketData: MarketData;
    socialData: SocialIntelligence;
    trendingData: TrendingAnalysis;
    platformUsers: PlatformUsers;
}

interface ClankerIntelligence {
    token_symbol: string;
    analysis_timestamp: string;
    market_data: MarketData;
    social_intelligence: SocialIntelligence;
    trending_analysis: TrendingAnalysis;
    platform_users: PlatformUsers;
    intelligence_summary: IntelligenceSummary;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tokenSymbol = searchParams.get('symbol') || 'clanker';
        const timeWindow = searchParams.get('timeWindow') || '24h';

        console.log(`🔍 Fetching Clanker intelligence for ${tokenSymbol} (${timeWindow})`);

        // Get Clanker token market data
        const marketData = await getClankerMarketData(tokenSymbol);

        // Get Farcaster social intelligence
        const socialData = await getClankerSocialIntelligence(tokenSymbol, timeWindow);

        // Get trending analysis
        const trendingData = await getClankerTrendingAnalysis();

        // Get platform user analysis
        const platformUsers = await getClankerPlatformUsers();

        // Combine intelligence
        const intelligence: ClankerIntelligence = {
            token_symbol: tokenSymbol.toUpperCase(),
            analysis_timestamp: new Date().toISOString(),
            market_data: marketData,
            social_intelligence: socialData,
            trending_analysis: trendingData,
            platform_users: platformUsers,
            intelligence_summary: generateIntelligenceSummary({
                marketData,
                socialData,
                trendingData,
                platformUsers
            })
        };

        // Store intelligence in MCP memory for persistence
        try {
            // Create a comprehensive content summary for memory storage
            const contentSummary = `
CLANKER INTELLIGENCE REPORT - ${intelligence.token_symbol}
Analysis Timestamp: ${intelligence.analysis_timestamp}

MARKET DATA:
- Symbol: ${intelligence.market_data.symbol || 'N/A'}
- Price: $${intelligence.market_data.price_usd?.toFixed(6) || 'N/A'}
- Market Cap: $${intelligence.market_data.market_cap?.toLocaleString() || 'N/A'}
- 24h Volume: $${intelligence.market_data.volume_24h?.toLocaleString() || 'N/A'}
- Liquidity: $${intelligence.market_data.liquidity_usd?.toLocaleString() || 'N/A'}

SOCIAL INTELLIGENCE:
- Total Mentions: ${intelligence.social_intelligence.total_mentions || 0}
- Unique Authors: ${intelligence.social_intelligence.unique_authors || 0}
- Average Sentiment: ${intelligence.social_intelligence.sentiment_analysis?.average_sentiment?.toFixed(2) || 'N/A'}

TRENDING ANALYSIS:
- Trending Casts: ${intelligence.trending_analysis.total_trending_casts || 0}
- Top Topics: ${intelligence.trending_analysis.top_topics?.slice(0, 3).map((t: TopicData) => t.topic).join(', ') || 'N/A'}

PLATFORM USERS:
- Total Platform Users: ${intelligence.platform_users.total_platform_users || 0}
- Total Followers: ${intelligence.platform_users.total_followers?.toLocaleString() || 'N/A'}

SUMMARY:
- Overall Sentiment: ${intelligence.intelligence_summary.overall_sentiment}
- Social Engagement: ${intelligence.intelligence_summary.social_engagement_level}
- Market Attention: ${intelligence.intelligence_summary.market_attention}
- Recommendations: ${intelligence.intelligence_summary.recommendations?.join('; ') || 'None'}
            `.trim();

            // Create vector embedding (simple approach using key metrics)
            const vectorFeatures = [
                intelligence.market_data.price_usd || 0,
                intelligence.market_data.market_cap || 0,
                intelligence.market_data.volume_24h || 0,
                intelligence.market_data.liquidity_usd || 0,
                intelligence.social_intelligence.total_mentions || 0,
                intelligence.social_intelligence.unique_authors || 0,
                intelligence.social_intelligence.sentiment_analysis?.average_sentiment || 0,
                intelligence.trending_analysis.total_trending_casts || 0,
                intelligence.platform_users.total_platform_users || 0,
                intelligence.platform_users.total_followers || 0
            ];

            // Normalize and pad vector to 384 dimensions (expected by MCP memory)
            const normalizedVector = vectorFeatures.map(v => Math.min(v / 1000000, 1)); // Simple normalization
            while (normalizedVector.length < 384) {
                normalizedVector.push(0);
            }

            // Store in MCP memory
            await mcp_maxx_memory_store_memory({
                content: contentSummary,
                vector: normalizedVector,
                category: "clanker_intelligence",
                metadata: {
                    token_symbol: intelligence.token_symbol,
                    analysis_timestamp: intelligence.analysis_timestamp,
                    market_cap: intelligence.market_data.market_cap,
                    total_mentions: intelligence.social_intelligence.total_mentions,
                    unique_authors: intelligence.social_intelligence.unique_authors,
                    overall_sentiment: intelligence.intelligence_summary.overall_sentiment,
                    social_engagement: intelligence.intelligence_summary.social_engagement_level,
                    market_attention: intelligence.intelligence_summary.market_attention,
                    recommendations: intelligence.intelligence_summary.recommendations
                }
            });

            console.log(`🧠 Stored Clanker intelligence for ${intelligence.token_symbol} in MCP memory`);

        } catch (memoryError) {
            console.error('Failed to store intelligence in MCP memory:', memoryError);
            // Continue with response even if memory storage fails
        }

        return NextResponse.json(intelligence);
    } catch (error) {
        console.error('Clanker intelligence API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch Clanker intelligence',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

async function getClankerMarketData(symbol: string): Promise<MarketData> {
    try {
        // Search for Clanker token on DexScreener
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
            `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(symbol)}`,
            { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`DexScreener API error: ${response.status}`);
        }

        const data = await response.json();
        const pairs = data.pairs || [];

        // Find exact match
        const clankerPair = pairs.find((pair: unknown) => {
            const p = pair as { baseToken?: { symbol?: string } };
            return p.baseToken?.symbol?.toUpperCase() === symbol.toUpperCase();
        });

        if (clankerPair) {
            const p = clankerPair as {
                baseToken: { symbol: string; name: string; address: string };
                priceUsd?: string;
                volume?: { h24?: string };
                priceChange?: { h24?: string };
                marketCap?: string;
                liquidity?: { usd?: string };
                dexId?: string;
                pairAddress?: string;
                chainId?: string;
                quoteToken?: { symbol?: string };
            };
            return {
                symbol: p.baseToken.symbol,
                name: p.baseToken.name,
                address: p.baseToken.address,
                price_usd: parseFloat(p.priceUsd || '0'),
                volume_24h: parseFloat(p.volume?.h24 || '0'),
                price_change_24h: parseFloat(p.priceChange?.h24 || '0'),
                market_cap: parseFloat(p.marketCap || '0'),
                liquidity_usd: parseFloat(p.liquidity?.usd || '0'),
                dex: p.dexId,
                pair_address: p.pairAddress,
                chain: p.chainId,
                quote_token: p.quoteToken?.symbol
            };
        }

        // Return closest matches if no exact match
        return {
            error: 'Token not found',
            closest_matches: pairs.slice(0, 3).map((pair: unknown) => {
                const p = pair as { baseToken?: { symbol?: string; name?: string }; marketCap?: string };
                return {
                    symbol: p.baseToken?.symbol,
                    name: p.baseToken?.name,
                    market_cap: p.marketCap
                };
            })
        };
    } catch (error) {
        console.error('Market data fetch error:', error);
        return { error: 'Failed to fetch market data' };
    }
}

async function getClankerSocialIntelligence(symbol: string, timeWindow: string): Promise<SocialIntelligence> {
    try {
        // Use Neynar MCP for social intelligence
        const mcpEndpoint = process.env.NEXT_PUBLIC_MCP_ENDPOINT || 'http://localhost:3001/mcp';

        // Search for Clanker mentions
        const searchQueries = [
            symbol,
            `${symbol} token`,
            `@${symbol}`,
            `$${symbol}`
        ];

        const allCasts: unknown[] = [];
        const uniqueAuthors = new Set<number>();

        for (const query of searchQueries) {
            try {
                const response = await fetch(mcpEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: Date.now(),
                        method: 'tools/call',
                        params: {
                            name: 'mcp_neynar_search_farcaster_casts',
                            arguments: { query, limit: 25 }
                        }
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    const casts = result.result?.casts || [];
                    allCasts.push(...casts);

                    // Track unique authors
                    casts.forEach((cast: Cast) => {
                        if (cast.author?.fid) {
                            uniqueAuthors.add(cast.author.fid);
                        }
                    });
                }
            } catch (queryError) {
                console.warn(`Query failed for "${query}":`, queryError);
            }
        }

        // Remove duplicates
        const uniqueCasts = allCasts.filter((cast, index, self) => {
            const c = cast as { hash?: string };
            return index === self.findIndex(s => (s as { hash?: string }).hash === c.hash);
        });

        // Analyze sentiment
        const sentimentAnalysis = analyzeSentiment(uniqueCasts);

        return {
            total_mentions: uniqueCasts.length,
            unique_authors: uniqueAuthors.size,
            time_window: timeWindow,
            casts: uniqueCasts.slice(0, 10), // Return top 10 for display
            sentiment_analysis: sentimentAnalysis
        };
    } catch (error) {
        console.error('Social intelligence error:', error);
        return {
            error: 'Failed to fetch social data',
            total_mentions: 0,
            unique_authors: 0,
            time_window: timeWindow,
            casts: [],
            sentiment_analysis: {
                average_sentiment: 0,
                sentiment_distribution: { positive: 0, neutral: 0, negative: 0 },
                total_engagement: { likes: 0, recasts: 0, replies: 0 }
            }
        };
    }
}

async function getClankerTrendingAnalysis(): Promise<TrendingAnalysis> {
    try {
        const mcpEndpoint = process.env.NEXT_PUBLIC_MCP_ENDPOINT || 'http://localhost:3001/mcp';

        const response = await fetch(mcpEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: 'mcp_neynar_search_farcaster_casts',
                    arguments: {
                        query: 'clanker',
                        limit: 50
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Trending analysis failed: ${response.status}`);
        }

        const result = await response.json();
        const casts = result.result?.casts || [];

        // Analyze trending patterns
        const topics: { [key: string]: number } = {};
        const authors: { [key: number]: number } = {};
        const totalEngagement = { likes: 0, recasts: 0, replies: 0 };

        casts.forEach((cast: unknown) => {
            const c = cast as { text?: string; author?: { fid?: number }; reactions?: { likes_count?: number; recasts_count?: number }; replies?: { count?: number } };
            // Extract hashtags
            const text = c.text || '';
            const hashtags = text.match(/#\w+/g) || [];
            hashtags.forEach((tag: string) => {
                topics[tag] = (topics[tag] || 0) + 1;
            });

            // Track authors
            const fid = c.author?.fid;
            if (fid) {
                authors[fid] = (authors[fid] || 0) + 1;
            }

            // Engagement metrics
            const reactions = c.reactions || {};
            totalEngagement.likes += reactions.likes_count || 0;
            totalEngagement.recasts += reactions.recasts_count || 0;
            totalEngagement.replies += c.replies?.count || 0;
        });

        // Get top topics and authors
        const topTopics = Object.entries(topics)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        const topAuthors = Object.entries(authors)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        return {
            total_trending_casts: casts.length,
            top_topics: topTopics.map(([topic, count]) => ({ topic, count })),
            top_authors: topAuthors.map(([fid, count]) => ({ fid: parseInt(fid), cast_count: count })),
            total_engagement: totalEngagement,
            engagement_rate: casts.length > 0 ? {
                likes_per_cast: totalEngagement.likes / casts.length,
                recasts_per_cast: totalEngagement.recasts / casts.length,
                replies_per_cast: totalEngagement.replies / casts.length
            } : undefined
        };
    } catch (error) {
        console.error('Trending analysis error:', error);
        return { error: 'Failed to fetch trending data' };
    }
}

async function getClankerPlatformUsers(): Promise<PlatformUsers> {
    try {
        const mcpEndpoint = process.env.NEXT_PUBLIC_MCP_ENDPOINT || 'http://localhost:3001/mcp';

        // Search for platform-related users
        const queries = ['clanker.world', 'clanker bot', '@clanker'];

        const platformUsers: PlatformUser[] = [];

        for (const query of queries) {
            try {
                const response = await fetch(mcpEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: Date.now(),
                        method: 'tools/call',
                        params: {
                            name: 'mcp_neynar_search_farcaster_casts',
                            arguments: { query, limit: 20 }
                        }
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    const casts = result.result?.casts || [];

                    // Extract unique authors
                    casts.forEach((cast: unknown) => {
                        const c = cast as { author?: { fid?: number; username?: string; display_name?: string; follower_count?: number; verified?: boolean } };
                        const author = c.author;
                        if (author && !platformUsers.find(u => u.fid === author.fid)) {
                            platformUsers.push({
                                fid: author.fid || 0,
                                username: author.username,
                                display_name: author.display_name,
                                follower_count: author.follower_count || 0,
                                verified: author.verified || false
                            });
                        }
                    });
                }
            } catch (queryError) {
                console.warn(`Platform user query failed for "${query}":`, queryError);
            }
        }

        // Sort by follower count
        platformUsers.sort((a, b) => b.follower_count - a.follower_count);

        return {
            total_platform_users: platformUsers.length,
            top_users: platformUsers.slice(0, 10),
            total_followers: platformUsers.reduce((sum, user) => sum + user.follower_count, 0)
        };
    } catch (error) {
        console.error('Platform users error:', error);
        return { error: 'Failed to fetch platform users' };
    }
}

function analyzeSentiment(casts: unknown[]) {
    if (!casts.length) {
        return {
            average_sentiment: 0,
            sentiment_distribution: { positive: 0, neutral: 0, negative: 0 },
            total_engagement: { likes: 0, recasts: 0, replies: 0 }
        };
    }

    const positiveKeywords = ['bullish', 'moon', 'pump', 'buy', 'long', 'hodl', 'diamond', 'gem', '🚀', '💎', '🔥'];
    const negativeKeywords = ['bearish', 'dump', 'sell', 'short', 'scam', 'rug', 'shit', 'trash', '📉', '💩'];

    let totalSentiment = 0;
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const totalEngagement = { likes: 0, recasts: 0, replies: 0 };

    casts.forEach(cast => {
        const c = cast as { text?: string; reactions?: { likes_count?: number; recasts_count?: number }; replies?: { count?: number } };
        const text = (c.text || '').toLowerCase();

        const posScore = positiveKeywords.reduce((count, keyword) =>
            count + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0);
        const negScore = negativeKeywords.reduce((count, keyword) =>
            count + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0);

        const sentiment = posScore - negScore;
        totalSentiment += sentiment;

        if (sentiment > 0) sentimentCounts.positive++;
        else if (sentiment < 0) sentimentCounts.negative++;
        else sentimentCounts.neutral++;

        // Engagement
        const reactions = c.reactions || {};
        totalEngagement.likes += reactions.likes_count || 0;
        totalEngagement.recasts += reactions.recasts_count || 0;
        totalEngagement.replies += c.replies?.count || 0;
    });

    return {
        average_sentiment: totalSentiment / casts.length,
        sentiment_distribution: sentimentCounts,
        total_engagement: totalEngagement,
        engagement_per_cast: {
            likes: totalEngagement.likes / casts.length,
            recasts: totalEngagement.recasts / casts.length,
            replies: totalEngagement.replies / casts.length
        }
    };
}

interface Cast {
    hash?: string;
    author?: { fid?: number };
    text?: string;
    reactions?: { likes_count?: number; recasts_count?: number };
    replies?: { count?: number };
    verified?: boolean;
    follower_count?: number;
    display_name?: string;
    username?: string;
}

function generateIntelligenceSummary(data: IntelligenceData) {
    const { marketData, socialData, platformUsers } = data;

    let overallSentiment = 'NEUTRAL';
    let socialEngagement = 'LOW';
    let marketAttention = 'MINIMAL';

    // Analyze market data
    const marketCap = marketData.market_cap || 0;
    if (marketCap > 1000000) marketAttention = 'HIGH';
    else if (marketCap > 100000) marketAttention = 'MODERATE';

    // Analyze social data
    const mentions = socialData.total_mentions || 0;
    if (mentions > 200) socialEngagement = 'HIGH';
    else if (mentions > 50) socialEngagement = 'MODERATE';

    const avgSentiment = socialData.sentiment_analysis?.average_sentiment || 0;
    if (avgSentiment > 0.5) overallSentiment = 'POSITIVE';
    else if (avgSentiment < -0.5) overallSentiment = 'NEGATIVE';

    // Generate recommendations
    const recommendations = [];
    if (mentions < 10) {
        recommendations.push('� Limited social discussion');
    }

    return {
        overall_sentiment: overallSentiment,
        social_engagement_level: socialEngagement,
        market_attention: marketAttention,
        recommendations,
        key_metrics: {
            market_cap: marketData.market_cap,
            total_mentions: mentions,
            unique_authors: socialData.unique_authors,
            platform_users: platformUsers.total_platform_users
        }
    };
}
