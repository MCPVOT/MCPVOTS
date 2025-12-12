import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';
import { getNeynarRateLimiter, NeynarPlan } from './neynar-rate-limiter';

// MCPVOT-style direct API calls for better reliability
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2/farcaster';
const NEYNAR_PLAN: NeynarPlan = (process.env.NEYNAR_PLAN as NeynarPlan) || 'growth';

// Types for Farcaster data
export interface Author {
    object: string;
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    custody_address: string;
    profile: Profile;
    follower_count: number;
    following_count: number;
    verifications: string[];
    verified_addresses: VerifiedAddresses;
    verified_accounts: VerifiedAccount[];
    power_badge: boolean;
}

export interface Profile {
    bio: { text: string; mentioned_profiles?: unknown[] };
}

export interface VerifiedAddresses {
    eth_addresses: string[];
}

export interface VerifiedAccount {
    platform: string;
    username: string;
}

export interface Channel {
    id: string;
    name: string;
    description: string;
    image_url: string;
    follower_count: number;
}

export interface Reactions {
    likes_count: number;
    recasts_count: number;
    likes: Array<{ fid: number; fname: string }>;
    recasts: Array<{ fid: number; fname: string }>;
}

export interface Replies {
    count: number;
}

export interface ViewerContext {
    liked: boolean;
    recast: boolean;
}

export interface Embed {
    url?: string;
    cast_id?: { fid: number; hash: string };
}

export interface Cast {
    object: string;
    hash: string;
    author: Author;
    thread_hash: string;
    parent_hash: string | null;
    parent_url: string | null;
    root_parent_url: string | null;
    parent_author: Author | null;
    text: string;
    timestamp: string;
    embeds: Embed[];
    channel: Channel | null;
    reactions: Reactions;
    replies: Replies;
    mentioned_profiles: Author[];
    viewer_context: ViewerContext;
}

export interface User {
    object: string;
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    custody_address: string;
    profile: Profile;
    follower_count: number;
    following_count: number;
    verifications: string[];
    verified_addresses: VerifiedAddresses;
    verified_accounts: VerifiedAccount[];
    power_badge: boolean;
}

export interface FeedResponse {
    casts: Cast[];
}

export interface SearchUsersResponse {
    result: {
        users: User[];
    };
}

export interface SearchCastsResponse {
    result: {
        casts: Cast[];
    };
}

export interface TrendingChannelsResponse {
    channels: Channel[];
}

export interface NotificationsResponse {
    notifications: Notification[];
}

export interface Notification {
    type: string;
    id: string;
    timestamp: string;
    actor: Author;
    content: unknown;
}

export class NeynarService {
    private client: NeynarAPIClient;
    private initialized: boolean = false;
    private rateLimiter = getNeynarRateLimiter(NEYNAR_PLAN);

    constructor() {
        if (!NEYNAR_API_KEY) {
            throw new Error('NEYNAR_API_KEY environment variable is required');
        }

        const config = new Configuration({
            apiKey: NEYNAR_API_KEY,
        });

        this.client = new NeynarAPIClient(config);
    }

    /**
     * Rate-limited fetch wrapper with retry logic
     */
    private async rateLimitedFetch(endpoint: string, options?: RequestInit): Promise<Response> {
        // Wait for rate limit
        await this.rateLimiter.waitAndTrack(endpoint);
        
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'api_key': NEYNAR_API_KEY!,
                ...options?.headers,
            },
        });

        // Handle rate limit errors (429)
        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
            console.warn(`[Neynar] Rate limited on ${endpoint}, waiting ${retryAfter}s`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return this.rateLimitedFetch(endpoint, options);
        }

        return response;
    }

    /**
     * Get current rate limit status
     */
    getRateLimitStatus() {
        return this.rateLimiter.getStatus();
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;
        this.initialized = true;
    }

    /**
     * Get user information by FID using direct API (MCPVOT pattern)
     */
    async getUserByFid(fid: number, viewerFid?: number): Promise<User> {
        try {
            const url = `${NEYNAR_BASE_URL}/user/bulk?fids=${fid}${viewerFid ? `&viewer_fid=${viewerFid}` : ''}`;
            const response = await this.rateLimitedFetch(url);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.users[0];
        } catch (error) {
            console.error('Failed to get user by FID:', error);
            throw error;
        }
    }

    /**
     * Search for users using direct API
     */
    async searchUsers(query: string, limit: number = 10): Promise<User[]> {
        try {
            const url = `${NEYNAR_BASE_URL}/user/search?q=${encodeURIComponent(query)}&limit=${limit}`;
            const response = await this.rateLimitedFetch(url);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data: SearchUsersResponse = await response.json();
            return data.result.users || [];
        } catch (error) {
            console.error('Failed to search users:', error);
            throw error;
        }
    }

    /**
     * Get user's casts using direct API
     */
    async getUserCasts(fid: number, limit: number = 10): Promise<Cast[]> {
        try {
            const url = `${NEYNAR_BASE_URL}/casts?fid=${fid}&limit=${limit}`;
            const response = await this.rateLimitedFetch(url);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.casts || [];
        } catch (error) {
            console.error('Failed to get user casts:', error);
            throw error;
        }
    }

    /**
     * Get feed for a user using direct API (MCPVOT pattern)
     */
    async getFeed(fid: number, limit: number = 25, viewerFid?: number): Promise<FeedResponse> {
        try {
            const url = `${NEYNAR_BASE_URL}/feed/following?fid=${fid}&limit=${limit}&with_recasts=true${viewerFid ? `&viewer_fid=${viewerFid}` : ''}`;
            const response = await this.rateLimitedFetch(url);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to get feed:', error);
            throw error;
        }
    }

    /**
     * Search for casts using direct API (RATE LIMITED - lower RPM!)
     */
    async searchCasts(query: string, limit: number = 10): Promise<SearchCastsResponse> {
        try {
            // Note: cast/search has much lower rate limits (60/120/240 RPM)
            const url = `${NEYNAR_BASE_URL}/cast/search?q=${encodeURIComponent(query)}&limit=${limit}`;
            const response = await this.rateLimitedFetch(url);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data: SearchCastsResponse = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to search casts:', error);
            throw error;
        }
    }

    /**
     * Get trending channels using direct API
     */
    async getTrendingChannels(limit: number = 10): Promise<Channel[]> {
        try {
            const url = `${NEYNAR_BASE_URL}/feed/channels/trending?limit=${limit}`;
            const response = await this.rateLimitedFetch(url);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data: TrendingChannelsResponse = await response.json();
            return data.channels || [];
        } catch (error) {
            console.error('Failed to get trending channels:', error);
            throw error;
        }
    }

    /**
     * Get notifications for a user using direct API
     */
    async getNotifications(fid: number, limit: number = 20): Promise<Notification[]> {
        try {
            const url = `${NEYNAR_BASE_URL}/notifications?fid=${fid}&limit=${limit}`;
            const response = await this.rateLimitedFetch(url);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data: NotificationsResponse = await response.json();
            return data.notifications || [];
        } catch (error) {
            console.error('Failed to get notifications:', error);
            throw error;
        }
    }

    /**
     * Fetch casts from a specific channel using direct API (MCPVOT pattern)
     */
    async getChannelCasts(channelId: string, limit: number = 25): Promise<FeedResponse> {
        try {
            const url = `${NEYNAR_BASE_URL}/feed/channels?channel_ids=${channelId}&limit=${limit}`;
            const response = await this.rateLimitedFetch(url);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to get channel casts:', error);
            throw error;
        }
    }
}

// Singleton instance
let neynarService: NeynarService | null = null;

export function getNeynarService(): NeynarService {
    if (!neynarService) {
        neynarService = new NeynarService();
    }
    return neynarService;
}
