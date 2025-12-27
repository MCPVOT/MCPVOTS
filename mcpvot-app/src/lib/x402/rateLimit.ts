/**
 * x402 Rate Limiting Utility
 * 
 * Shared rate limiting logic for all x402 endpoints.
 * 
 * ARCHITECTURE (MCP Memory #376):
 * - Primary: Neon PostgreSQL for persistent rate limiting (survives cold starts)
 * - Fallback: In-memory store for local development without DB
 * 
 * @updated Dec 2025 - Added Neon Postgres integration
 */

import {
    getRateLimitStatus,
    incrementIPRateLimit,
    incrementWalletRateLimit,
    isDbAvailable,
} from './dbStore';

// Rate limit configuration
export const RATE_LIMIT_CONFIG = {
    WINDOW_MS: 60000,       // 1 minute window
    WINDOW_SECONDS: 60,     // Same in seconds for DB
    MAX_REQUESTS: 10,       // 10 requests per window per wallet
    MAX_IP_REQUESTS: 50,    // 50 requests per window per IP (Sybil protection)
    CLEANUP_INTERVAL: 300000, // Clean up old entries every 5 minutes
};

// Rate limit store with timestamp tracking
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory stores (will reset on serverless cold start)
// For production: Use Redis, Vercel KV, or Upstash
const walletRateLimitStore = new Map<string, RateLimitEntry>();
const ipRateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
    const now = Date.now();
    if (now - lastCleanup < RATE_LIMIT_CONFIG.CLEANUP_INTERVAL) {
        return;
    }
    
    lastCleanup = now;
    
    for (const [key, entry] of walletRateLimitStore.entries()) {
        if (entry.resetTime <= now) {
            walletRateLimitStore.delete(key);
        }
    }
    
    for (const [key, entry] of ipRateLimitStore.entries()) {
        if (entry.resetTime <= now) {
            ipRateLimitStore.delete(key);
        }
    }
}

/**
 * Check rate limit for a wallet address
 * Uses Neon Postgres if available, falls back to in-memory
 */
export async function checkWalletRateLimitAsync(walletAddress: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
}> {
    // Try Neon Postgres first (production)
    if (isDbAvailable()) {
        const result = await incrementWalletRateLimit(
            walletAddress,
            RATE_LIMIT_CONFIG.MAX_REQUESTS,
            RATE_LIMIT_CONFIG.WINDOW_SECONDS
        );
        return {
            allowed: result.allowed,
            remaining: result.remaining,
            resetAt: Date.now() + RATE_LIMIT_CONFIG.WINDOW_MS,
        };
    }
    
    // Fallback to in-memory (local dev)
    return checkWalletRateLimit(walletAddress);
}

/**
 * Check rate limit for a wallet address (synchronous - in-memory only)
 * Kept for backwards compatibility
 */
export function checkWalletRateLimit(walletAddress: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
} {
    cleanupExpiredEntries();
    
    const now = Date.now();
    const key = walletAddress.toLowerCase();
    const record = walletRateLimitStore.get(key);
    
    // No existing record or window expired
    if (!record || record.resetTime <= now) {
        const resetAt = now + RATE_LIMIT_CONFIG.WINDOW_MS;
        walletRateLimitStore.set(key, { count: 1, resetTime: resetAt });
        return {
            allowed: true,
            remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS - 1,
            resetAt
        };
    }
    
    // Window still active - check count
    if (record.count >= RATE_LIMIT_CONFIG.MAX_REQUESTS) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: record.resetTime
        };
    }
    
    // Increment and allow
    record.count++;
    return {
        allowed: true,
        remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS - record.count,
        resetAt: record.resetTime
    };
}

/**
 * Check rate limit for an IP address (Sybil protection)
 * Uses Neon Postgres if available, falls back to in-memory
 */
export async function checkIPRateLimitAsync(clientIP: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
}> {
    // Try Neon Postgres first (production)
    if (isDbAvailable()) {
        const result = await incrementIPRateLimit(
            clientIP,
            RATE_LIMIT_CONFIG.MAX_IP_REQUESTS,
            RATE_LIMIT_CONFIG.WINDOW_SECONDS
        );
        return {
            allowed: result.allowed,
            remaining: result.remaining,
            resetAt: Date.now() + RATE_LIMIT_CONFIG.WINDOW_MS,
        };
    }
    
    // Fallback to in-memory (local dev)
    return checkIPRateLimit(clientIP);
}

/**
 * Check rate limit for an IP address (synchronous - in-memory only)
 * Kept for backwards compatibility
 */
export function checkIPRateLimit(clientIP: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
} {
    cleanupExpiredEntries();
    
    const now = Date.now();
    const key = clientIP.toLowerCase();
    const record = ipRateLimitStore.get(key);
    
    if (!record || record.resetTime <= now) {
        const resetAt = now + RATE_LIMIT_CONFIG.WINDOW_MS;
        ipRateLimitStore.set(key, { count: 1, resetTime: resetAt });
        return {
            allowed: true,
            remaining: RATE_LIMIT_CONFIG.MAX_IP_REQUESTS - 1,
            resetAt
        };
    }
    
    if (record.count >= RATE_LIMIT_CONFIG.MAX_IP_REQUESTS) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: record.resetTime
        };
    }
    
    record.count++;
    return {
        allowed: true,
        remaining: RATE_LIMIT_CONFIG.MAX_IP_REQUESTS - record.count,
        resetAt: record.resetTime
    };
}

/**
 * Combined rate limit check for both wallet and IP (ASYNC - uses Vercel KV)
 * Returns the most restrictive result
 * 
 * @recommended Use this in production for persistent rate limiting
 */
export async function checkCombinedRateLimitAsync(
    walletAddress: string,
    clientIP: string | null
): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    limitedBy: 'wallet' | 'ip' | null;
}> {
    const walletLimit = await checkWalletRateLimitAsync(walletAddress);
    
    if (!walletLimit.allowed) {
        return {
            ...walletLimit,
            limitedBy: 'wallet'
        };
    }
    
    if (clientIP) {
        const ipLimit = await checkIPRateLimitAsync(clientIP);
        if (!ipLimit.allowed) {
            return {
                ...ipLimit,
                limitedBy: 'ip'
            };
        }
        
        // Return the more restrictive remaining count
        return {
            allowed: true,
            remaining: Math.min(walletLimit.remaining, ipLimit.remaining),
            resetAt: Math.max(walletLimit.resetAt, ipLimit.resetAt),
            limitedBy: null
        };
    }
    
    return {
        ...walletLimit,
        limitedBy: null
    };
}

/**
 * Combined rate limit check for both wallet and IP (SYNC - in-memory only)
 * Returns the most restrictive result
 * 
 * @deprecated Use checkCombinedRateLimitAsync for production
 */
export function checkCombinedRateLimit(
    walletAddress: string,
    clientIP: string | null
): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    limitedBy: 'wallet' | 'ip' | null;
} {
    const walletLimit = checkWalletRateLimit(walletAddress);
    
    if (!walletLimit.allowed) {
        return {
            ...walletLimit,
            limitedBy: 'wallet'
        };
    }
    
    if (clientIP) {
        const ipLimit = checkIPRateLimit(clientIP);
        if (!ipLimit.allowed) {
            return {
                ...ipLimit,
                limitedBy: 'ip'
            };
        }
        
        // Return the more restrictive remaining count
        return {
            allowed: true,
            remaining: Math.min(walletLimit.remaining, ipLimit.remaining),
            resetAt: Math.max(walletLimit.resetAt, ipLimit.resetAt),
            limitedBy: null
        };
    }
    
    return {
        ...walletLimit,
        limitedBy: null
    };
}

/**
 * Extract client IP from request headers
 */
export function getClientIP(headers: Headers): string | null {
    // Vercel/Cloudflare headers
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    
    // Direct connection
    const realIP = headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }
    
    // Cloudflare specific
    const cfIP = headers.get('cf-connecting-ip');
    if (cfIP) {
        return cfIP;
    }
    
    return null;
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(limit: { remaining: number; resetAt: number }): Record<string, string> {
    return {
        'X-RateLimit-Limit': RATE_LIMIT_CONFIG.MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': limit.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(limit.resetAt / 1000).toString(),
        'Retry-After': Math.ceil((limit.resetAt - Date.now()) / 1000).toString()
    };
}

/**
 * Get current rate limit stats (for monitoring)
 */
export function getRateLimitStats(): {
    walletEntries: number;
    ipEntries: number;
    lastCleanup: number;
} {
    return {
        walletEntries: walletRateLimitStore.size,
        ipEntries: ipRateLimitStore.size,
        lastCleanup
    };
}

/**
 * Get rate limit status from KV (for monitoring dashboard)
 */
export async function getRateLimitStatusFromKV(
    wallet: string,
    ip: string | null
): Promise<{
    dbAvailable: boolean;
    wallet: { count: number; ttl: number };
    ip: { count: number; ttl: number } | null;
}> {
    const status = await getRateLimitStatus(wallet, ip);
    return {
        dbAvailable: isDbAvailable(),
        ...status,
    };
}
