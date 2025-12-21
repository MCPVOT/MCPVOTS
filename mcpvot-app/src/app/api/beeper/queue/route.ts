/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                     BEEPER MINT QUEUE - HIGH TRAFFIC READY                   ║
 * ║                                                                               ║
 * ║  Production-ready queue management for BEEPER NFT minting                    ║
 * ║  Handles concurrent requests, rate limiting, and position tracking           ║
 * ║                                                                               ║
 * ║  For production: Replace with Redis for distributed queue                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// QUEUE CONFIGURATION
// =============================================================================

const QUEUE_CONFIG = {
  maxConcurrent: 5,           // Max simultaneous mints
  requestsPerMinute: 10,      // Rate limit per address
  avgProcessingTime: 8,       // Seconds per mint
  cleanupInterval: 60000,     // Clean old entries every 60s
  maxQueueSize: 1000,         // Max queue length
};

// =============================================================================
// IN-MEMORY QUEUE (Replace with Redis for production)
// =============================================================================

interface QueueEntry {
  address: string;
  fid?: number;
  joinedAt: number;
  status: 'waiting' | 'processing' | 'completed' | 'failed';
  position: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// Global queue state
const mintQueue: Map<string, QueueEntry> = new Map();
const rateLimits: Map<string, RateLimitEntry> = new Map();
let processingCount = 0;
let nextPosition = 1;

// =============================================================================
// QUEUE HELPERS
// =============================================================================

function getQueuePosition(address: string): { position: number; total: number } {
  const entry = mintQueue.get(address.toLowerCase());
  
  if (!entry) {
    return { position: 0, total: mintQueue.size };
  }
  
  // Count how many are ahead of this address
  let ahead = 0;
  for (const [, e] of mintQueue) {
    if (e.position < entry.position && e.status === 'waiting') {
      ahead++;
    }
  }
  
  return { position: ahead + 1, total: mintQueue.size };
}

function checkRateLimit(address: string): { allowed: boolean; retryAfter?: number } {
  const key = address.toLowerCase();
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  
  const entry = rateLimits.get(key);
  
  if (!entry) {
    rateLimits.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }
  
  // Reset window if expired
  if (now - entry.windowStart > windowMs) {
    rateLimits.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }
  
  // Check rate limit
  if (entry.count >= QUEUE_CONFIG.requestsPerMinute) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Increment counter
  entry.count++;
  return { allowed: true };
}

function cleanupQueue() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  for (const [key, entry] of mintQueue) {
    if (now - entry.joinedAt > maxAge && entry.status !== 'processing') {
      mintQueue.delete(key);
    }
  }
  
  // Clean old rate limit entries
  for (const [key, entry] of rateLimits) {
    if (now - entry.windowStart > 60000) {
      rateLimits.delete(key);
    }
  }
}

// Periodic cleanup
setInterval(cleanupQueue, QUEUE_CONFIG.cleanupInterval);

// =============================================================================
// GET - Check queue status
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json(
      { error: 'Address required' },
      { status: 400 }
    );
  }
  
  const key = address.toLowerCase();
  const entry = mintQueue.get(key);
  
  if (!entry) {
    // Not in queue - check if can join
    const rateCheck = checkRateLimit(key);
    
    if (!rateCheck.allowed) {
      return NextResponse.json({
        inQueue: false,
        canJoin: false,
        rateLimited: true,
        retryAfter: rateCheck.retryAfter,
        queueLength: mintQueue.size,
      });
    }
    
    // Calculate estimated wait if they join
    const estimatedWait = Math.ceil(
      (mintQueue.size / QUEUE_CONFIG.maxConcurrent) * QUEUE_CONFIG.avgProcessingTime
    );
    
    return NextResponse.json({
      inQueue: false,
      canJoin: mintQueue.size < QUEUE_CONFIG.maxQueueSize,
      position: mintQueue.size + 1,
      total: mintQueue.size + 1,
      estimatedWait,
      queueLength: mintQueue.size,
    });
  }
  
  // Already in queue
  const { position, total } = getQueuePosition(key);
  const estimatedWait = Math.ceil(
    (position / QUEUE_CONFIG.maxConcurrent) * QUEUE_CONFIG.avgProcessingTime
  );
  
  return NextResponse.json({
    inQueue: true,
    status: entry.status,
    position,
    total,
    estimatedWait,
    joinedAt: entry.joinedAt,
  });
}

// =============================================================================
// POST - Join queue
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, fid } = body;
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address required' },
        { status: 400 }
      );
    }
    
    const key = address.toLowerCase();
    
    // Check if already in queue
    const existing = mintQueue.get(key);
    if (existing && existing.status !== 'completed' && existing.status !== 'failed') {
      const { position, total } = getQueuePosition(key);
      
      return NextResponse.json({
        success: false,
        error: 'Already in queue',
        position,
        total,
        status: existing.status,
      });
    }
    
    // Check rate limit
    const rateCheck = checkRateLimit(key);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limited', 
          retryAfter: rateCheck.retryAfter,
        },
        { status: 429 }
      );
    }
    
    // Check queue size
    if (mintQueue.size >= QUEUE_CONFIG.maxQueueSize) {
      return NextResponse.json(
        { error: 'Queue full, please try again later' },
        { status: 503 }
      );
    }
    
    // Add to queue
    const entry: QueueEntry = {
      address: key,
      fid: fid || undefined,
      joinedAt: Date.now(),
      status: 'waiting',
      position: nextPosition++,
    };
    
    mintQueue.set(key, entry);
    
    const { position, total } = getQueuePosition(key);
    const estimatedWait = Math.ceil(
      (position / QUEUE_CONFIG.maxConcurrent) * QUEUE_CONFIG.avgProcessingTime
    );
    
    return NextResponse.json({
      success: true,
      position,
      total,
      estimatedWait,
      queueId: entry.position,
    });
    
  } catch (error) {
    console.error('[Queue] Error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Leave queue
// =============================================================================

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json(
      { error: 'Address required' },
      { status: 400 }
    );
  }
  
  const key = address.toLowerCase();
  const deleted = mintQueue.delete(key);
  
  return NextResponse.json({
    success: deleted,
    message: deleted ? 'Removed from queue' : 'Not in queue',
  });
}

// =============================================================================
// PATCH - Update queue status (internal use)
// =============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, status } = body;
    
    // Verify internal API key
    const authHeader = request.headers.get('x-internal-key');
    if (authHeader !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const key = address.toLowerCase();
    const entry = mintQueue.get(key);
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Not in queue' },
        { status: 404 }
      );
    }
    
    // Update status
    entry.status = status;
    
    // Update processing count
    if (status === 'processing') {
      processingCount++;
    } else if (status === 'completed' || status === 'failed') {
      processingCount = Math.max(0, processingCount - 1);
    }
    
    return NextResponse.json({
      success: true,
      status: entry.status,
    });
    
  } catch (error) {
    console.error('[Queue] PATCH Error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
