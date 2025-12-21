/**
 * Server-side Neynar API client
 * For intelligence gathering and cron jobs
 */

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2';

export async function searchCasts(query: string, options: { limit?: number } = {}) {
    const params = new URLSearchParams({
        q: query,
        limit: String(options.limit || 25)
    });

    const response = await fetch(`${NEYNAR_BASE_URL}/farcaster/cast/search?${params}`, {
        headers: {
            'api_key': NEYNAR_API_KEY,
            'Content-Type': 'application/json'
        },
        next: { revalidate: 900 } // Cache for 15 minutes
    });

    if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status}`);
    }

    return response.json();
}

export async function fetchFeed(channel: string, options: { limit?: number } = {}) {
    const params = new URLSearchParams({
        channel_id: channel,
        limit: String(options.limit || 25)
    });

    const response = await fetch(`${NEYNAR_BASE_URL}/farcaster/feed/channels?${params}`, {
        headers: {
            'api_key': NEYNAR_API_KEY
        },
        next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
        throw new Error(`Neynar feed error: ${response.status}`);
    }

    return response.json();
}

export async function getUserByFid(fid: number) {
    const response = await fetch(`${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${fid}`, {
        headers: {
            'api_key': NEYNAR_API_KEY
        },
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
        throw new Error(`Neynar user error: ${response.status}`);
    }

    const data = await response.json();
    return data.users?.[0];
}

export async function getCastByHash(hash: string) {
    const params = new URLSearchParams({ identifier: hash, type: 'hash' });

    const response = await fetch(`${NEYNAR_BASE_URL}/farcaster/cast?${params}`, {
        headers: {
            'api_key': NEYNAR_API_KEY
        },
        next: { revalidate: 600 }
    });

    if (!response.ok) {
        throw new Error(`Neynar cast error: ${response.status}`);
    }

    return response.json();
}
