/**
 * Farcaster Mini App Notification Sender
 * 
 * Rate limits per FIP-2 specification:
 * - 1 notification per 30 seconds per token
 * - 100 notifications per day per token
 * 
 * If rate limits are exceeded, notifications will be silently dropped
 * and the notification token may be invalidated by Farcaster clients.
 */

import { getNotificationTokens, NotificationToken } from './farcasterNotificationStore';

interface NotificationPayload {
    title: string;
    body: string;
    targetUrl: string;
    notificationId?: string;
}

interface NotificationResult {
    success: boolean;
    sent: number;
    failed: number;
    rateLimited: number;
}

interface RateLimitEntry {
    lastSent: number;
    dailyCount: number;
    dailyReset: number;
}

// In-memory rate limit tracking (per token)
const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 30 * 1000; // 30 seconds
const DAILY_LIMIT = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

function checkRateLimit(token: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const entry = rateLimitMap.get(token);

    if (!entry) {
        return { allowed: true };
    }

    // Reset daily count if day has passed
    if (now > entry.dailyReset) {
        entry.dailyCount = 0;
        entry.dailyReset = now + DAY_MS;
    }

    // Check 30-second window
    if (now - entry.lastSent < RATE_LIMIT_WINDOW_MS) {
        return { allowed: false, reason: 'Rate limit: 1 per 30 seconds' };
    }

    // Check daily limit
    if (entry.dailyCount >= DAILY_LIMIT) {
        return { allowed: false, reason: 'Rate limit: 100 per day' };
    }

    return { allowed: true };
}

function updateRateLimit(token: string) {
    const now = Date.now();
    const entry = rateLimitMap.get(token);

    if (entry) {
        entry.lastSent = now;
        entry.dailyCount++;
    } else {
        rateLimitMap.set(token, {
            lastSent: now,
            dailyCount: 1,
            dailyReset: now + DAY_MS,
        });
    }
}

async function sendToToken(
    tokenEntry: NotificationToken,
    payload: NotificationPayload
): Promise<{ success: boolean; rateLimited: boolean }> {
    const { token, url } = tokenEntry;

    // Check rate limit
    const rateCheck = checkRateLimit(token);
    if (!rateCheck.allowed) {
        console.log(`[notification] Rate limited for token: ${rateCheck.reason}`);
        return { success: false, rateLimited: true };
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notificationId: payload.notificationId || crypto.randomUUID(),
                title: payload.title,
                body: payload.body,
                targetUrl: payload.targetUrl,
                tokens: [token],
            }),
        });

        if (response.ok) {
            updateRateLimit(token);
            return { success: true, rateLimited: false };
        }

        // Handle specific error responses
        const data = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
            console.warn('[notification] Server rate limited us');
            return { success: false, rateLimited: true };
        }

        console.error('[notification] Failed to send:', data);
        return { success: false, rateLimited: false };
    } catch (error) {
        console.error('[notification] Network error:', error);
        return { success: false, rateLimited: false };
    }
}

/**
 * Send a notification to a specific user by FID
 */
export async function sendNotificationToUser(
    fid: number,
    payload: NotificationPayload
): Promise<NotificationResult> {
    const tokens = await getNotificationTokens(fid);

    if (tokens.length === 0) {
        return { success: false, sent: 0, failed: 0, rateLimited: 0 };
    }

    let sent = 0;
    let failed = 0;
    let rateLimited = 0;

    for (const tokenEntry of tokens) {
        const result = await sendToToken(tokenEntry, payload);
        if (result.success) {
            sent++;
        } else if (result.rateLimited) {
            rateLimited++;
        } else {
            failed++;
        }
    }

    return {
        success: sent > 0,
        sent,
        failed,
        rateLimited,
    };
}

/**
 * Broadcast notification to multiple users
 * Use sparingly - this can quickly hit rate limits
 */
export async function broadcastNotification(
    fids: number[],
    payload: NotificationPayload
): Promise<{ total: number; results: NotificationResult[] }> {
    const results: NotificationResult[] = [];

    for (const fid of fids) {
        const result = await sendNotificationToUser(fid, payload);
        results.push(result);
        
        // Small delay between users to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
        total: fids.length,
        results,
    };
}

/**
 * Get rate limit status for a token
 */
export function getRateLimitStatus(token: string): {
    canSend: boolean;
    nextAllowedAt: number;
    dailyRemaining: number;
} {
    const entry = rateLimitMap.get(token);
    const now = Date.now();

    if (!entry) {
        return {
            canSend: true,
            nextAllowedAt: now,
            dailyRemaining: DAILY_LIMIT,
        };
    }

    const nextAllowedAt = entry.lastSent + RATE_LIMIT_WINDOW_MS;
    const dailyRemaining = Math.max(0, DAILY_LIMIT - entry.dailyCount);
    const canSend = now >= nextAllowedAt && dailyRemaining > 0;

    return {
        canSend,
        nextAllowedAt,
        dailyRemaining,
    };
}
