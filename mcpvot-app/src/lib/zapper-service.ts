/**
 * Zapper GraphQL API Service
 * 
 * Free API for Farcaster Profile, Portfolio, Token Rankings, NFT Rankings
 * Docs: https://build.zapper.xyz/docs
 * 
 * Features:
 * - Farcaster Profile resolution (FID, username, connected addresses)
 * - Portfolio data (token balances, NFTs, app positions)
 * - Token Rankings (trending by social graph)
 * - NFT Collection Rankings (trending by social graph)
 */

const ZAPPER_API_URL = 'https://public.zapper.xyz/graphql';
const ZAPPER_API_KEY = process.env.ZAPPER_API_KEY || process.env.NEXT_PUBLIC_ZAPPER_API_KEY;

// Rate limiting helper
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // 200ms between requests

async function rateLimitedFetch(query: string, variables: Record<string, unknown> = {}) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    
    lastRequestTime = Date.now();
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    if (ZAPPER_API_KEY) {
        headers['x-zapper-api-key'] = ZAPPER_API_KEY;
    }
    
    const response = await fetch(ZAPPER_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
    });
    
    if (!response.ok) {
        throw new Error(`Zapper API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
}

// ==================== TYPES ====================

export interface FarcasterMetadata {
    displayName: string | null;
    description: string | null;
    imageUrl: string | null;
    warpcast: string | null;
}

export interface FarcasterProfile {
    username: string;
    fid: number;
    metadata: FarcasterMetadata;
    custodyAddress: string;
    connectedAddresses: string[];
}

export interface TokenBalance {
    symbol: string;
    tokenAddress: string;
    balance: number;
    balanceUSD: number;
    price: number;
    imgUrlV2: string | null;
    name: string;
    network: {
        name: string;
    };
}

export interface PortfolioData {
    totalBalanceUSD: number;
    tokens: TokenBalance[];
    totalCount: number;
}

export interface RankedToken {
    id: string;
    chainId: number;
    tokenAddress: string;
    token: {
        address: string;
        name: string;
        symbol: string;
        priceData: {
            price: number;
        } | null;
    } | null;
    buyCount: number;
    buyerCount: number;
    buyerCount24h: number;
}

export interface RankedNFTCollection {
    id: string;
    collectionAddress: string;
    chainId: number;
    collection?: {
        name: string;
        imageUrl: string | null;
        floorPrice: number | null;
    };
}

export interface PageInfo {
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
}

// ==================== QUERIES ====================

const FARCASTER_PROFILE_QUERY = `
query GetFarcasterProfile($fid: Int, $username: String) {
    farcasterProfile(fid: $fid, username: $username) {
        username
        fid
        metadata {
            displayName
            description
            imageUrl
            warpcast
        }
        custodyAddress
        connectedAddresses
    }
}
`;

const PORTFOLIO_QUERY = `
query TokenBalances($addresses: [Address!]!, $first: Int) {
    portfolioV2(addresses: $addresses) {
        tokenBalances {
            totalBalanceUSD
            byToken(first: $first) {
                totalCount
                edges {
                    node {
                        symbol
                        tokenAddress
                        balance
                        balanceUSD
                        price
                        imgUrlV2
                        name
                        network {
                            name
                        }
                    }
                }
            }
        }
    }
}
`;

const TOKEN_RANKING_QUERY = `
query TokenRanking($first: Int, $after: String, $fid: Int) {
    tokenRanking(first: $first, after: $after, fid: $fid) {
        pageInfo {
            hasPreviousPage
            hasNextPage
            startCursor
            endCursor
        }
        edges {
            cursor
            node {
                id
                chainId
                tokenAddress
                token {
                    address
                    name
                    symbol
                    priceData {
                        price
                    }
                }
                buyCount
                buyerCount
                buyerCount24h
            }
        }
    }
}
`;

const NFT_RANKING_QUERY = `
query NftRanking($first: Int, $after: String, $fid: Int) {
    nftRanking(first: $first, after: $after, fid: $fid) {
        pageInfo {
            hasPreviousPage
            hasNextPage
            startCursor
            endCursor
        }
        edges {
            cursor
            node {
                id
                collectionAddress
                chainId
            }
        }
    }
}
`;

// ==================== API FUNCTIONS ====================

/**
 * Get Farcaster profile by FID or username
 */
export async function getFarcasterProfile(
    options: { fid?: number; username?: string }
): Promise<FarcasterProfile | null> {
    if (!options.fid && !options.username) {
        throw new Error('Either fid or username is required');
    }
    
    try {
        const data = await rateLimitedFetch(FARCASTER_PROFILE_QUERY, {
            fid: options.fid || null,
            username: options.username || null,
        });
        
        return data.data?.farcasterProfile || null;
    } catch (error) {
        console.error('Error fetching Farcaster profile:', error);
        return null;
    }
}

/**
 * Get portfolio data for addresses
 */
export async function getPortfolio(
    addresses: string[],
    first: number = 20
): Promise<PortfolioData | null> {
    if (!addresses.length) {
        return null;
    }
    
    try {
        const data = await rateLimitedFetch(PORTFOLIO_QUERY, {
            addresses,
            first,
        });
        
        const portfolio = data.data?.portfolioV2?.tokenBalances;
        if (!portfolio) return null;
        
        return {
            totalBalanceUSD: portfolio.totalBalanceUSD || 0,
            tokens: portfolio.byToken?.edges?.map((e: { node: TokenBalance }) => e.node) || [],
            totalCount: portfolio.byToken?.totalCount || 0,
        };
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        return null;
    }
}

/**
 * Get Farcaster user's full portfolio (profile + balances)
 */
export async function getFarcasterPortfolio(
    options: { fid?: number; username?: string },
    tokenLimit: number = 20
): Promise<{ profile: FarcasterProfile; portfolio: PortfolioData } | null> {
    const profile = await getFarcasterProfile(options);
    if (!profile) return null;
    
    const allAddresses = [
        profile.custodyAddress,
        ...profile.connectedAddresses,
    ].filter(Boolean);
    
    const portfolio = await getPortfolio(allAddresses, tokenLimit);
    if (!portfolio) return null;
    
    return { profile, portfolio };
}

/**
 * Get trending token rankings (optionally personalized by FID)
 */
export async function getTokenRankings(options: {
    first?: number;
    after?: string | null;
    fid?: number;
} = {}): Promise<{
    tokens: RankedToken[];
    pageInfo: PageInfo;
} | null> {
    try {
        const data = await rateLimitedFetch(TOKEN_RANKING_QUERY, {
            first: options.first || 10,
            after: options.after || null,
            fid: options.fid || null,
        });
        
        const ranking = data.data?.tokenRanking;
        if (!ranking) return null;
        
        return {
            tokens: ranking.edges?.map((e: { node: RankedToken }) => e.node) || [],
            pageInfo: ranking.pageInfo,
        };
    } catch (error) {
        console.error('Error fetching token rankings:', error);
        return null;
    }
}

/**
 * Get trending NFT collection rankings (optionally personalized by FID)
 */
export async function getNFTRankings(options: {
    first?: number;
    after?: string | null;
    fid?: number;
} = {}): Promise<{
    collections: RankedNFTCollection[];
    pageInfo: PageInfo;
} | null> {
    try {
        const data = await rateLimitedFetch(NFT_RANKING_QUERY, {
            first: options.first || 10,
            after: options.after || null,
            fid: options.fid || null,
        });
        
        const ranking = data.data?.nftRanking;
        if (!ranking) return null;
        
        return {
            collections: ranking.edges?.map((e: { node: RankedNFTCollection }) => e.node) || [],
            pageInfo: ranking.pageInfo,
        };
    } catch (error) {
        console.error('Error fetching NFT rankings:', error);
        return null;
    }
}

/**
 * Check if an address holds VOT token
 */
export async function checkVOTHolding(address: string): Promise<{
    holds: boolean;
    balance: number;
    balanceUSD: number;
} | null> {
    const VOT_ADDRESS = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07'.toLowerCase();
    
    try {
        const portfolio = await getPortfolio([address], 100);
        if (!portfolio) return null;
        
        const votToken = portfolio.tokens.find(
            t => t.tokenAddress.toLowerCase() === VOT_ADDRESS
        );
        
        return {
            holds: !!votToken,
            balance: votToken?.balance || 0,
            balanceUSD: votToken?.balanceUSD || 0,
        };
    } catch (error) {
        console.error('Error checking VOT holding:', error);
        return null;
    }
}

/**
 * Get holder multiplier based on ecosystem holdings
 * Used for adaptive NFT tier system
 */
export async function getHolderMultiplier(
    options: { fid?: number; address?: string }
): Promise<{
    multiplier: number;
    holdings: {
        hasVOT: boolean;
        hasMAXX: boolean;
        hasFarcaster: boolean;
        hasBasename: boolean;
        hasENS: boolean;
    };
    totalScore: number;
} | null> {
    const MAXX_ADDRESS = '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467'.toLowerCase();
    const VOT_ADDRESS = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07'.toLowerCase();
    
    try {
        let addresses: string[] = [];
        let hasFarcaster = false;
        
        // Get addresses from Farcaster if FID provided
        if (options.fid) {
            const profile = await getFarcasterProfile({ fid: options.fid });
            if (profile) {
                hasFarcaster = true;
                addresses = [profile.custodyAddress, ...profile.connectedAddresses];
            }
        } else if (options.address) {
            addresses = [options.address];
        }
        
        if (!addresses.length) return null;
        
        // Get portfolio
        const portfolio = await getPortfolio(addresses, 100);
        if (!portfolio) return null;
        
        // Check holdings
        const hasVOT = portfolio.tokens.some(
            t => t.tokenAddress.toLowerCase() === VOT_ADDRESS
        );
        const hasMAXX = portfolio.tokens.some(
            t => t.tokenAddress.toLowerCase() === MAXX_ADDRESS
        );
        
        // TODO: Check ENS and Basename via separate APIs
        const hasENS = false; // Placeholder - integrate with ENS resolver
        const hasBasename = false; // Placeholder - integrate with Base resolver
        
        // Calculate score (adaptive multiplier system)
        let score = 1.0; // Base multiplier
        
        if (hasFarcaster) score += 0.5;  // +50% for Farcaster
        if (hasVOT) score += 1.0;        // +100% for VOT
        if (hasMAXX) score += 0.5;       // +50% for MAXX
        if (hasENS) score += 0.25;       // +25% for ENS
        if (hasBasename) score += 0.25;  // +25% for Basename
        
        return {
            multiplier: score,
            holdings: {
                hasVOT,
                hasMAXX,
                hasFarcaster,
                hasBasename,
                hasENS,
            },
            totalScore: score,
        };
    } catch (error) {
        console.error('Error calculating holder multiplier:', error);
        return null;
    }
}

const zapperService = {
    getFarcasterProfile,
    getPortfolio,
    getFarcasterPortfolio,
    getTokenRankings,
    getNFTRankings,
    checkVOTHolding,
    getHolderMultiplier,
};

export default zapperService;
