/**
 * Postgres Store - Persistent Storage for Serverless (Neon DB)
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  SOLVES: In-memory state lost on Vercel cold starts                      ║
 * ║                                                                          ║
 * ║  Uses: Neon PostgreSQL (free tier: 0.5GB, auto-suspend)                  ║
 * ║                                                                          ║
 * ║  Features:                                                               ║
 * ║  - Persistent rate limiting across serverless invocations                ║
 * ║  - Queue state that survives cold starts                                 ║
 * ║  - Token counter synchronization                                         ║
 * ║  - Automatic fallback to in-memory for local dev                         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 * 
 * MCP Memory Reference: #376 (VOT Builder Improvements)
 */

import postgres from 'postgres';

// Database connection (lazy initialization)
let sql: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (!sql && process.env.DATABASE_URL) {
    sql = postgres(process.env.DATABASE_URL, { ssl: 'verify-full' });
  }
  return sql;
}

// TTL values (in seconds)
export const DB_TTL = {
  RATE_LIMIT: 60,           // 1 minute for rate limits
  QUEUE_ITEM: 3600,         // 1 hour for queue items
  COMPLETED_ITEM: 86400,    // 24 hours for completed items
} as const;

/**
 * Check if Postgres is available
 * Falls back to in-memory for local development without DB
 */
export function isDbAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * Initialize database tables (run once on startup)
 */
export async function initDbTables(): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    // Rate limits table with auto-expiry
    await db`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 1,
        expires_at TIMESTAMPTZ NOT NULL
      )
    `;

    // Token counter table
    await db`
      CREATE TABLE IF NOT EXISTS token_counter (
        id TEXT PRIMARY KEY DEFAULT 'main',
        value INTEGER NOT NULL DEFAULT 1
      )
    `;

    // Initialize token counter if not exists
    await db`
      INSERT INTO token_counter (id, value) 
      VALUES ('main', 1) 
      ON CONFLICT (id) DO NOTHING
    `;

    // Queue items table
    await db`
      CREATE TABLE IF NOT EXISTS queue_items (
        id TEXT PRIMARY KEY,
        user_address TEXT NOT NULL,
        ens_name TEXT,
        base_name TEXT,
        farcaster_fid INTEGER,
        svg_content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        position INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        token_id INTEGER,
        tx_hash TEXT,
        ipfs_cid TEXT,
        metadata_cid TEXT,
        vot_sent TEXT,
        vot_burned TEXT,
        rarity TEXT,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT
      )
    `;

    // Index for user lookups
    await db`
      CREATE INDEX IF NOT EXISTS idx_queue_user ON queue_items(user_address)
    `;
    await db`
      CREATE INDEX IF NOT EXISTS idx_queue_status ON queue_items(status)
    `;

    console.log('[DbStore] ✅ Database tables initialized');
  } catch (error) {
    console.error('[DbStore] Failed to initialize tables:', error);
  }
}

// ============================================================================
// RATE LIMITING FUNCTIONS
// ============================================================================

/**
 * Increment rate limit counter for wallet
 * Returns current count and remaining requests
 */
export async function incrementWalletRateLimit(
  wallet: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): Promise<{ count: number; remaining: number; allowed: boolean }> {
  const db = getDb();
  if (!db) {
    // Fallback handled by rateLimit.ts
    return { count: 0, remaining: maxRequests, allowed: true };
  }

  const key = `wallet:${wallet.toLowerCase()}`;
  const expiresAt = new Date(Date.now() + windowSeconds * 1000);

  try {
    // Clean up expired entries first
    await db`DELETE FROM rate_limits WHERE expires_at < NOW()`;

    // Upsert rate limit entry
    const result = await db`
      INSERT INTO rate_limits (key, count, expires_at)
      VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE 
          WHEN rate_limits.expires_at < NOW() THEN 1
          ELSE rate_limits.count + 1
        END,
        expires_at = CASE
          WHEN rate_limits.expires_at < NOW() THEN ${expiresAt}
          ELSE rate_limits.expires_at
        END
      RETURNING count
    `;

    const count = result[0]?.count ?? 1;
    return {
      count,
      remaining: Math.max(0, maxRequests - count),
      allowed: count <= maxRequests,
    };
  } catch (error) {
    console.error('[DbStore] Rate limit error:', error);
    // Fail open - allow request if DB fails
    return { count: 0, remaining: maxRequests, allowed: true };
  }
}

/**
 * Increment rate limit counter for IP (Sybil protection)
 */
export async function incrementIPRateLimit(
  ip: string,
  maxRequests: number = 50,
  windowSeconds: number = 60
): Promise<{ count: number; remaining: number; allowed: boolean }> {
  const db = getDb();
  if (!db) {
    return { count: 0, remaining: maxRequests, allowed: true };
  }

  const key = `ip:${ip}`;
  const expiresAt = new Date(Date.now() + windowSeconds * 1000);

  try {
    await db`DELETE FROM rate_limits WHERE expires_at < NOW()`;

    const result = await db`
      INSERT INTO rate_limits (key, count, expires_at)
      VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE 
          WHEN rate_limits.expires_at < NOW() THEN 1
          ELSE rate_limits.count + 1
        END,
        expires_at = CASE
          WHEN rate_limits.expires_at < NOW() THEN ${expiresAt}
          ELSE rate_limits.expires_at
        END
      RETURNING count
    `;

    const count = result[0]?.count ?? 1;
    return {
      count,
      remaining: Math.max(0, maxRequests - count),
      allowed: count <= maxRequests,
    };
  } catch (error) {
    console.error('[DbStore] IP rate limit error:', error);
    return { count: 0, remaining: maxRequests, allowed: true };
  }
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  wallet: string,
  ip: string | null
): Promise<{
  wallet: { count: number; ttl: number };
  ip: { count: number; ttl: number } | null;
}> {
  const db = getDb();
  if (!db) {
    return { wallet: { count: 0, ttl: 0 }, ip: null };
  }

  try {
    const walletKey = `wallet:${wallet.toLowerCase()}`;
    const walletResult = await db`
      SELECT count, EXTRACT(EPOCH FROM (expires_at - NOW()))::integer as ttl
      FROM rate_limits 
      WHERE key = ${walletKey} AND expires_at > NOW()
    `;

    let ipStatus = null;
    if (ip) {
      const ipKey = `ip:${ip}`;
      const ipResult = await db`
        SELECT count, EXTRACT(EPOCH FROM (expires_at - NOW()))::integer as ttl
        FROM rate_limits 
        WHERE key = ${ipKey} AND expires_at > NOW()
      `;
      ipStatus = {
        count: ipResult[0]?.count ?? 0,
        ttl: ipResult[0]?.ttl ?? 0,
      };
    }

    return {
      wallet: {
        count: walletResult[0]?.count ?? 0,
        ttl: walletResult[0]?.ttl ?? 0,
      },
      ip: ipStatus,
    };
  } catch (error) {
    console.error('[DbStore] Get rate limit status error:', error);
    return { wallet: { count: 0, ttl: 0 }, ip: null };
  }
}

// ============================================================================
// TOKEN COUNTER FUNCTIONS
// ============================================================================

/**
 * Get current token ID counter
 */
export async function getTokenCounter(): Promise<number> {
  const db = getDb();
  if (!db) {
    return 1; // Default for local dev
  }

  try {
    const result = await db`SELECT value FROM token_counter WHERE id = 'main'`;
    return result[0]?.value ?? 1;
  } catch (error) {
    console.error('[DbStore] Get token counter error:', error);
    return 1;
  }
}

/**
 * Increment and get next token ID (atomic)
 */
export async function getNextTokenId(): Promise<number> {
  const db = getDb();
  if (!db) {
    return Date.now(); // Use timestamp for local dev
  }

  try {
    const result = await db`
      UPDATE token_counter 
      SET value = value + 1 
      WHERE id = 'main'
      RETURNING value
    `;
    return result[0]?.value ?? Date.now();
  } catch (error) {
    console.error('[DbStore] Increment token counter error:', error);
    return Date.now();
  }
}

/**
 * Set token counter (for syncing with contract)
 */
export async function setTokenCounter(value: number): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db`
      UPDATE token_counter SET value = ${value} WHERE id = 'main'
    `;
    console.log(`[DbStore] Token counter set to ${value}`);
  } catch (error) {
    console.error('[DbStore] Set token counter error:', error);
  }
}

// ============================================================================
// QUEUE FUNCTIONS
// ============================================================================

/**
 * Store a queue item
 */
export async function storeQueueItem(
  id: string,
  item: {
    userAddress: string;
    ensName?: string;
    baseName?: string;
    farcasterFid?: number;
    svgContent: string;
    status?: string;
    position?: number;
  }
): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db`
      INSERT INTO queue_items (id, user_address, ens_name, base_name, farcaster_fid, svg_content, status, position)
      VALUES (
        ${id}, 
        ${item.userAddress}, 
        ${item.ensName ?? null}, 
        ${item.baseName ?? null}, 
        ${item.farcasterFid ?? null}, 
        ${item.svgContent},
        ${item.status ?? 'pending'},
        ${item.position ?? 0}
      )
    `;
  } catch (error) {
    console.error('[DbStore] Store queue item error:', error);
  }
}

/**
 * Get a queue item
 */
export async function getQueueItem(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const result = await db`SELECT * FROM queue_items WHERE id = ${id}`;
    return result[0] ?? null;
  } catch (error) {
    console.error('[DbStore] Get queue item error:', error);
    return null;
  }
}

/**
 * Update queue item status
 */
export async function updateQueueItem(
  id: string,
  updates: {
    status?: string;
    startedAt?: Date;
    completedAt?: Date;
    tokenId?: number;
    txHash?: string;
    ipfsCid?: string;
    metadataCid?: string;
    votSent?: string;
    votBurned?: string;
    rarity?: string;
    retryCount?: number;
    lastError?: string;
  }
): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db`
      UPDATE queue_items SET
        status = COALESCE(${updates.status ?? null}, status),
        started_at = COALESCE(${updates.startedAt ?? null}, started_at),
        completed_at = COALESCE(${updates.completedAt ?? null}, completed_at),
        token_id = COALESCE(${updates.tokenId ?? null}, token_id),
        tx_hash = COALESCE(${updates.txHash ?? null}, tx_hash),
        ipfs_cid = COALESCE(${updates.ipfsCid ?? null}, ipfs_cid),
        metadata_cid = COALESCE(${updates.metadataCid ?? null}, metadata_cid),
        vot_sent = COALESCE(${updates.votSent ?? null}, vot_sent),
        vot_burned = COALESCE(${updates.votBurned ?? null}, vot_burned),
        rarity = COALESCE(${updates.rarity ?? null}, rarity),
        retry_count = COALESCE(${updates.retryCount ?? null}, retry_count),
        last_error = COALESCE(${updates.lastError ?? null}, last_error)
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('[DbStore] Update queue item error:', error);
  }
}

/**
 * Store completed mint for user lookup
 */
export async function storeCompletedMint(
  wallet: string,
  mintData: Record<string, unknown>
): Promise<void> {
  const db = getDb();
  if (!db) return;

  // Store in queue_items with completed status
  if (mintData.id) {
    await updateQueueItem(String(mintData.id), {
      status: 'completed',
      completedAt: new Date(),
      ...mintData,
    });
  }
}

/**
 * Get user's most recent completed mint
 */
export async function getUserCompletedMint(
  wallet: string
): Promise<Record<string, unknown> | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const result = await db`
      SELECT * FROM queue_items 
      WHERE user_address = ${wallet.toLowerCase()} 
        AND status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 1
    `;
    return result[0] ?? null;
  } catch (error) {
    console.error('[DbStore] Get user completed mint error:', error);
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Health check for DB connection
 */
export async function dbHealthCheck(): Promise<{
  available: boolean;
  latencyMs: number;
  error?: string;
}> {
  const db = getDb();
  if (!db) {
    return { available: false, latencyMs: 0, error: 'DATABASE_URL not configured' };
  }

  const start = Date.now();

  try {
    await db`SELECT 1`;
    return { available: true, latencyMs: Date.now() - start };
  } catch (error) {
    return {
      available: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clear rate limits for a wallet (admin function)
 */
export async function clearRateLimits(wallet: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    const key = `wallet:${wallet.toLowerCase()}`;
    await db`DELETE FROM rate_limits WHERE key = ${key}`;
    console.log(`[DbStore] Cleared rate limits for ${wallet}`);
  } catch (error) {
    console.error('[DbStore] Clear rate limits error:', error);
  }
}

/**
 * Clean up expired rate limits (call periodically)
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  try {
    const result = await db`
      DELETE FROM rate_limits WHERE expires_at < NOW()
      RETURNING key
    `;
    return result.length;
  } catch (error) {
    console.error('[DbStore] Cleanup error:', error);
    return 0;
  }
}
