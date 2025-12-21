/**
 * x402 Rate Limiting Utility
 * 
 * Shared rate limiting logic for all x402 endpoints.
 * Uses in-memory store with fallback for serverless environments.
 * 
 * @recommended Migrate to Redis/Vercel KV for production persistence
 */

// Rate limit configuration
export const RATE_LIMIT_CONFIG = {
    WINDOW_MS: 60000,      // 1 minute window
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
 * Combined rate limit check for both wallet and IP
 * Returns the most restrictive result
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
