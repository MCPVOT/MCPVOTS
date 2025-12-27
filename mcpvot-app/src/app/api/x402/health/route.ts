/**
 * Health Check API for VOT Builder Services
 * 
 * GET /api/x402/health
 * 
 * Returns status of all critical services:
 * - Neon PostgreSQL connection
 * - Rate limit stats
 * - Queue status
 * - Token counter
 */

import { dbHealthCheck, getTokenCounter, initDbTables, isDbAvailable } from '@/lib/x402/dbStore';
import { getMintQueue } from '@/lib/x402/mintQueue';
import { getRateLimitStats } from '@/lib/x402/rateLimit';
import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Initialize DB tables if needed
    await initDbTables();
    
    // Check Neon Postgres
    const dbStatus = await dbHealthCheck();
    
    // Get token counter
    const tokenCounter = await getTokenCounter();
    
    // Get queue stats
    const queue = getMintQueue();
    const queueStats = queue.getStats();
    
    // Get in-memory rate limit stats
    const rateLimitStats = getRateLimitStats();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      
      services: {
        neonPostgres: {
          configured: isDbAvailable(),
          connected: dbStatus.available,
          latencyMs: dbStatus.latencyMs,
          error: dbStatus.error,
          note: !isDbAvailable() 
            ? '⚠️ DATABASE_URL not configured - using in-memory fallback (resets on cold start)'
            : '✅ Persistent rate limiting active (Neon PostgreSQL)',
        },
        
        queue: {
          pending: queueStats.totalQueued,
          processing: queueStats.processing,
          completed: queueStats.completed,
          failed: queueStats.failed,
          avgWaitTimeMs: queueStats.avgWaitTimeMs,
          estimatedWaitMs: queueStats.estimatedWaitMs,
        },
        
        tokenCounter: {
          current: tokenCounter,
          source: isDbAvailable() ? 'neon-postgres' : 'in-memory',
        },
        
        rateLimiting: {
          mode: isDbAvailable() ? 'persistent (Neon PostgreSQL)' : 'in-memory (resets on cold start)',
          inMemoryStats: rateLimitStats,
        },
      },
      
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV || 'local',
        region: process.env.VERCEL_REGION || 'unknown',
      },
      
      mcpMemoryRef: '#376 - VOT Builder Improvements',
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
