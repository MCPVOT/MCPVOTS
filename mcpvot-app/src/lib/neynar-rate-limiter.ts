/**
 * Neynar API Rate Limiter
 * 
 * Rate limits based on Neynar subscription plans:
 * - Starter: 300 RPM (5 RPS) per endpoint, 500 RPM global
 * - Growth: 600 RPM (10 RPS) per endpoint, 1000 RPM global  
 * - Scale: 1200 RPM (20 RPS) per endpoint, 2000 RPM global
 * 
 * Special endpoints:
 * - cast/search: 60/120/240 RPM (Starter/Growth/Scale)
 * - frame/validate: 5k/10k/20k RPM
 * - signer endpoints: 3k/6k/12k RPM
 */

export type NeynarPlan = 'starter' | 'growth' | 'scale';

interface RateLimitConfig {
    globalRpm: number;
    defaultRpm: number;
    searchRpm: number;
    validateRpm: number;
    signerRpm: number;
}

const PLAN_LIMITS: Record<NeynarPlan, RateLimitConfig> = {
    starter: {
        globalRpm: 500,
        defaultRpm: 300,
        searchRpm: 60,
        validateRpm: 5000,
        signerRpm: 3000,
    },
    growth: {
        globalRpm: 1000,
        defaultRpm: 600,
        searchRpm: 120,
        validateRpm: 10000,
        signerRpm: 6000,
    },
    scale: {
        globalRpm: 2000,
        defaultRpm: 1200,
        searchRpm: 240,
        validateRpm: 20000,
        signerRpm: 12000,
    },
};

interface RequestTracker {
    timestamps: number[];
    lastCleanup: number;
}

interface RateLimitResult {
    allowed: boolean;
    waitMs: number;
    remaining: number;
    resetAt: number;
}

export class NeynarRateLimiter {
    private plan: NeynarPlan;
    private limits: RateLimitConfig;
    private globalTracker: RequestTracker;
    private endpointTrackers: Map<string, RequestTracker>;
    private readonly windowMs = 60000; // 1 minute window

    constructor(plan: NeynarPlan = 'starter') {
        this.plan = plan;
        this.limits = PLAN_LIMITS[plan];
        this.globalTracker = { timestamps: [], lastCleanup: Date.now() };
        this.endpointTrackers = new Map();
    }

    /**
     * Get the rate limit for a specific endpoint
     */
    private getEndpointLimit(endpoint: string): number {
        if (endpoint.includes('cast/search')) {
            return this.limits.searchRpm;
        }
        if (endpoint.includes('frame/validate')) {
            return this.limits.validateRpm;
        }
        if (endpoint.includes('signer')) {
            return this.limits.signerRpm;
        }
        return this.limits.defaultRpm;
    }

    /**
     * Clean old timestamps from tracker
     */
    private cleanTracker(tracker: RequestTracker): void {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        tracker.timestamps = tracker.timestamps.filter(t => t > cutoff);
        tracker.lastCleanup = now;
    }

    /**
     * Check if request is allowed and track it
     */
    checkAndTrack(endpoint: string): RateLimitResult {
        const now = Date.now();
        const endpointLimit = this.getEndpointLimit(endpoint);

        // Get or create endpoint tracker
        if (!this.endpointTrackers.has(endpoint)) {
            this.endpointTrackers.set(endpoint, { timestamps: [], lastCleanup: now });
        }
        const endpointTracker = this.endpointTrackers.get(endpoint)!;

        // Clean old timestamps periodically
        if (now - this.globalTracker.lastCleanup > 1000) {
            this.cleanTracker(this.globalTracker);
        }
        if (now - endpointTracker.lastCleanup > 1000) {
            this.cleanTracker(endpointTracker);
        }

        // Check global limit (exclude validate/signer endpoints per Neynar docs)
        const countsTowardGlobal = !endpoint.includes('validate') && !endpoint.includes('signer');
        const globalCount = this.globalTracker.timestamps.length;
        const endpointCount = endpointTracker.timestamps.length;

        // Calculate remaining capacity
        const globalRemaining = this.limits.globalRpm - globalCount;
        const endpointRemaining = endpointLimit - endpointCount;

        // Check if either limit is exceeded
        const globalExceeded = countsTowardGlobal && globalRemaining <= 0;
        const endpointExceeded = endpointRemaining <= 0;

        if (globalExceeded || endpointExceeded) {
            // Calculate wait time until oldest request expires
            const oldestGlobal = this.globalTracker.timestamps[0] || now;
            const oldestEndpoint = endpointTracker.timestamps[0] || now;
            const waitUntil = Math.min(oldestGlobal, oldestEndpoint) + this.windowMs;
            const waitMs = Math.max(0, waitUntil - now);

            return {
                allowed: false,
                waitMs,
                remaining: Math.min(globalRemaining, endpointRemaining),
                resetAt: waitUntil,
            };
        }

        // Track this request
        if (countsTowardGlobal) {
            this.globalTracker.timestamps.push(now);
        }
        endpointTracker.timestamps.push(now);

        return {
            allowed: true,
            waitMs: 0,
            remaining: Math.min(globalRemaining - 1, endpointRemaining - 1),
            resetAt: now + this.windowMs,
        };
    }

    /**
     * Wait if rate limited, then allow request
     */
    async waitAndTrack(endpoint: string): Promise<RateLimitResult> {
        let result = this.checkAndTrack(endpoint);
        
        while (!result.allowed) {
            console.log(`[Neynar Rate Limit] Waiting ${result.waitMs}ms for ${endpoint}`);
            await new Promise(resolve => setTimeout(resolve, result.waitMs + 100)); // Add 100ms buffer
            result = this.checkAndTrack(endpoint);
        }

        return result;
    }

    /**
     * Get current rate limit status
     */
    getStatus(): {
        plan: NeynarPlan;
        globalUsed: number;
        globalLimit: number;
        endpoints: Record<string, { used: number; limit: number }>;
    } {
        this.cleanTracker(this.globalTracker);
        
        const endpoints: Record<string, { used: number; limit: number }> = {};
        for (const [endpoint, tracker] of this.endpointTrackers) {
            this.cleanTracker(tracker);
            endpoints[endpoint] = {
                used: tracker.timestamps.length,
                limit: this.getEndpointLimit(endpoint),
            };
        }

        return {
            plan: this.plan,
            globalUsed: this.globalTracker.timestamps.length,
            globalLimit: this.limits.globalRpm,
            endpoints,
        };
    }

    /**
     * Update plan (e.g., if user upgrades)
     */
    setPlan(plan: NeynarPlan): void {
        this.plan = plan;
        this.limits = PLAN_LIMITS[plan];
    }
}

// Singleton instance
let rateLimiterInstance: NeynarRateLimiter | null = null;

export function getNeynarRateLimiter(plan?: NeynarPlan): NeynarRateLimiter {
    if (!rateLimiterInstance) {
        // Default to 'growth' plan - adjust based on your subscription
        rateLimiterInstance = new NeynarRateLimiter(plan || 'growth');
    }
    return rateLimiterInstance;
}

/**
 * Decorator for rate-limited API calls
 */
export async function withRateLimit<T>(
    endpoint: string,
    apiCall: () => Promise<T>
): Promise<T> {
    const limiter = getNeynarRateLimiter();
    await limiter.waitAndTrack(endpoint);
    return apiCall();
}
