/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                  CLAIM BONUS PERSISTENT STORE                                 ║
 * ║                                                                               ║
 * ║  Postgres-backed storage for BEEPER share bonus claims                       ║
 * ║  Replaces in-memory Map to survive Vercel deployments                        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import type { Sql } from 'postgres';

// =============================================================================
// DATABASE CONNECTION (Lazy initialized to prevent build-time URL parsing)
// =============================================================================

let _sql: Sql | null = null;

function getSql(): Sql | null {
  if (_sql) return _sql;
  
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) return null;
  
  // Dynamic import to prevent build-time execution
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require('postgres') as typeof import('postgres').default;
  
  _sql = postgres(postgresUrl, {
    ssl: 'require',
    max: 3, // Connection pool size for serverless
    idle_timeout: 20,
    connect_timeout: 10,
  });
  
  return _sql;
}

const useDb = typeof process !== 'undefined' && !!(process.env.POSTGRES_URL || process.env.VERCEL_POSTGRES_REST_URL || process.env.VERCEL_POSTGRES_URL);

// =============================================================================
// TYPES
// =============================================================================

export interface ClaimBonusRecord {
  tokenId: number;
  walletAddress: string;
  claimedAt: number;
  castHash: string;
  followVerified: boolean;
  txHash?: string;
  fid?: number;
}

// In-memory fallback for local development (still useful for dev)
const memoryStore = new Map<number, ClaimBonusRecord>();

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

let dbInitialized = false;

async function ensureDb() {
  const sql = getSql();
  if (!useDb || !sql || dbInitialized) return;
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS beeper_claim_bonuses (
        token_id INTEGER PRIMARY KEY,
        wallet_address TEXT NOT NULL,
        claimed_at BIGINT NOT NULL,
        cast_hash TEXT NOT NULL,
        follow_verified BOOLEAN DEFAULT FALSE,
        tx_hash TEXT,
        fid INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    // Create index for wallet lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_beeper_claims_wallet 
      ON beeper_claim_bonuses(wallet_address);
    `;
    
    dbInitialized = true;
    console.log('[ClaimBonusStore] Database initialized');
  } catch (error) {
    console.error('[ClaimBonusStore] DB init error:', error);
    throw error;
  }
}

// =============================================================================
// STORE OPERATIONS
// =============================================================================

/**
 * Check if a token has already claimed the bonus
 */
export async function hasClaimedBonus(tokenId: number): Promise<ClaimBonusRecord | null> {
  const sql = getSql();
  if (useDb && sql) {
    await ensureDb();
    
    try {
      const result = await sql`
        SELECT token_id, wallet_address, claimed_at, cast_hash, follow_verified, tx_hash, fid
        FROM beeper_claim_bonuses 
        WHERE token_id = ${tokenId}
        LIMIT 1
      `;
      
      if (result.length > 0) {
        const row = result[0];
        return {
          tokenId: row.token_id as number,
          walletAddress: row.wallet_address as string,
          claimedAt: Number(row.claimed_at),
          castHash: row.cast_hash as string,
          followVerified: row.follow_verified as boolean,
          txHash: row.tx_hash as string | undefined,
          fid: row.fid as number | undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('[ClaimBonusStore] hasClaimedBonus error:', error);
      // Fallback to memory on error
      return memoryStore.get(tokenId) || null;
    }
  }
  
  // Memory fallback for local dev
  return memoryStore.get(tokenId) || null;
}

/**
 * Record a new bonus claim
 */
export async function recordBonusClaim(record: ClaimBonusRecord): Promise<boolean> {
  const sql = getSql();
  if (useDb && sql) {
    await ensureDb();
    
    try {
      await sql`
        INSERT INTO beeper_claim_bonuses 
        (token_id, wallet_address, claimed_at, cast_hash, follow_verified, tx_hash, fid)
        VALUES 
        (${record.tokenId}, ${record.walletAddress}, ${record.claimedAt}, ${record.castHash}, ${record.followVerified}, ${record.txHash || null}, ${record.fid || null})
        ON CONFLICT (token_id) DO NOTHING
      `;
      
      console.log(`[ClaimBonusStore] Recorded claim for token #${record.tokenId}`);
      return true;
    } catch (error) {
      console.error('[ClaimBonusStore] recordBonusClaim error:', error);
      // Store in memory as fallback
      memoryStore.set(record.tokenId, record);
      return true;
    }
  }
  
  // Memory fallback
  memoryStore.set(record.tokenId, record);
  return true;
}

/**
 * Get all claims for a wallet address
 */
export async function getClaimsByWallet(walletAddress: string): Promise<ClaimBonusRecord[]> {
  const sql = getSql();
  if (useDb && sql) {
    await ensureDb();
    
    try {
      const result = await sql`
        SELECT token_id, wallet_address, claimed_at, cast_hash, follow_verified, tx_hash, fid
        FROM beeper_claim_bonuses 
        WHERE LOWER(wallet_address) = LOWER(${walletAddress})
        ORDER BY claimed_at DESC
      `;
      
      return result.map(row => ({
        tokenId: row.token_id as number,
        walletAddress: row.wallet_address as string,
        claimedAt: Number(row.claimed_at),
        castHash: row.cast_hash as string,
        followVerified: row.follow_verified as boolean,
        txHash: row.tx_hash as string | undefined,
        fid: row.fid as number | undefined,
      }));
    } catch (error) {
      console.error('[ClaimBonusStore] getClaimsByWallet error:', error);
      return [];
    }
  }
  
  // Memory fallback - filter by wallet
  return Array.from(memoryStore.values())
    .filter(r => r.walletAddress.toLowerCase() === walletAddress.toLowerCase());
}

/**
 * Get total claim statistics
 */
export async function getClaimStats(): Promise<{ totalClaims: number; totalVOT: number }> {
  const SHARE_BONUS_VOT = 10000;
  const sql = getSql();
  
  if (useDb && sql) {
    await ensureDb();
    
    try {
      const result = await sql`
        SELECT COUNT(*) as total_claims FROM beeper_claim_bonuses
      `;
      
      const totalClaims = Number(result[0]?.total_claims || 0);
      return {
        totalClaims,
        totalVOT: totalClaims * SHARE_BONUS_VOT,
      };
    } catch (error) {
      console.error('[ClaimBonusStore] getClaimStats error:', error);
      return { totalClaims: memoryStore.size, totalVOT: memoryStore.size * SHARE_BONUS_VOT };
    }
  }
  
  return { 
    totalClaims: memoryStore.size, 
    totalVOT: memoryStore.size * SHARE_BONUS_VOT 
  };
}
