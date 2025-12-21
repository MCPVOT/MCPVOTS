/**
 * x402 Mint Queue API
 * 
 * GET  /api/x402/queue - Get queue status and position
 * POST /api/x402/queue - Add to mint queue
 * DELETE /api/x402/queue - Cancel pending request
 * 
 * Shows "8 MCPVOTs ahead of you in the queue..." style messages
 */

import { getMintQueue, QUEUE_CONFIG } from '@/lib/x402/mintQueue';
import { checkCombinedRateLimit, getClientIP, getRateLimitHeaders } from '@/lib/x402/rateLimit';
import { NextRequest, NextResponse } from 'next/server';

// CORS headers for cross-origin requests
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/x402/queue
 * 
 * Query params:
 * - wallet: User's wallet address (required)
 * 
 * Returns queue position and estimated wait time
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    
    const queue = getMintQueue();
    
    // If no wallet, return general queue stats
    if (!wallet) {
      const stats = queue.getStats();
      
      return NextResponse.json({
        success: true,
        queue: {
          totalPending: stats.totalQueued,
          processing: stats.processing,
          completedToday: stats.completed,
          avgWaitTime: `${Math.ceil(stats.avgWaitTimeMs / 1000)} seconds`,
          estimatedWait: `${Math.ceil(stats.estimatedWaitMs / 1000)} seconds`,
        },
        config: {
          maxQueueSize: QUEUE_CONFIG.MAX_QUEUE_SIZE,
          processInterval: `${QUEUE_CONFIG.PROCESS_INTERVAL_MS / 1000} seconds`,
          concurrentLimit: QUEUE_CONFIG.CONCURRENT_LIMIT,
        },
        message: stats.totalQueued > 0 
          ? `${stats.totalQueued} MCPVOTs in the queue. ~${Math.ceil(stats.estimatedWaitMs / 1000)}s wait.`
          : '✅ Queue is empty! Your mint will start immediately.',
      }, { headers: CORS_HEADERS });
    }
    
    // Validate wallet address
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    // Get position for specific wallet
    const position = queue.getQueuePosition(wallet);
    
    return NextResponse.json({
      success: true,
      wallet,
      found: position.found,
      position: position.position,
      status: position.status,
      aheadOfYou: position.aheadOfYou,
      estimatedWait: position.estimatedWaitMs > 0 
        ? `${Math.ceil(position.estimatedWaitMs / 1000)} seconds`
        : 'Ready',
      estimatedWaitMs: position.estimatedWaitMs,
      message: position.message,
      // Include full item data for completed items
      item: position.item ? {
        id: position.item.id,
        status: position.item.status,
        createdAt: position.item.createdAt,
        startedAt: position.item.startedAt,
        completedAt: position.item.completedAt,
        // Result data (populated when completed)
        tokenId: position.item.tokenId,
        transactionHash: position.item.transactionHash,
        ipfsCid: position.item.ipfsCid,
        metadataCid: position.item.metadataCid,
        votSent: position.item.votSent,
        votBurned: position.item.votBurned,
        rarity: position.item.rarity,
      } : undefined,
      // Convenience result object for completed mints
      result: position.status === 'completed' && position.item ? {
        tokenId: position.item.tokenId,
        transactionHash: position.item.transactionHash,
        ipfsCid: position.item.ipfsCid,
        metadataCid: position.item.metadataCid,
        votSent: position.item.votSent,
        votBurned: position.item.votBurned,
        rarity: position.item.rarity,
        openSeaUrl: position.item.tokenId 
          ? `https://opensea.io/assets/base/${process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x0'}/${position.item.tokenId}`
          : undefined,
        ipfsUrl: position.item.ipfsCid 
          ? `https://ipfs.io/ipfs/${position.item.ipfsCid}`
          : undefined,
      } : undefined,
    }, { headers: CORS_HEADERS });
    
  } catch (error) {
    console.error('[x402/queue] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get queue status' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /api/x402/queue
 * 
 * Add a new mint request to the queue
 * 
 * Body:
 * - userAddress: string (required)
 * - svgContent: string (required)
 * - ensName?: string
 * - baseName?: string
 * - farcasterFid?: number
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.userAddress) {
      return NextResponse.json(
        { success: false, error: 'userAddress is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    if (!body.svgContent) {
      return NextResponse.json(
        { success: false, error: 'svgContent is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.userAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    // Rate limiting
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkCombinedRateLimit(body.userAddress, clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please wait before submitting another request.',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        { status: 429, headers: { ...CORS_HEADERS, ...getRateLimitHeaders(rateLimit) } }
      );
    }
    
    // Add to queue
    const queue = getMintQueue();
    
    try {
      const item = queue.addToQueue({
        userAddress: body.userAddress,
        ensName: body.ensName,
        baseName: body.baseName,
        farcasterFid: body.farcasterFid,
        svgContent: body.svgContent,
      });
      
      const stats = queue.getStats();
      
      // Generate position message
      let message: string;
      if (item.position === 1 && stats.processing === 0) {
        message = '🎯 You\'re first in line! Minting will start shortly...';
      } else if (item.position === 1) {
        message = '⏳ 1 MCPVOT ahead of you in the queue...';
      } else {
        message = `⏳ ${item.position - 1} MCPVOTs ahead of you in the queue...`;
      }
      
      return NextResponse.json({
        success: true,
        queued: true,
        queueId: item.id,
        position: item.position,
        aheadOfYou: Math.max(0, item.position - 1 + (stats.processing ? 1 : 0)),
        estimatedWait: `${Math.ceil((item.position * QUEUE_CONFIG.PROCESS_INTERVAL_MS) / 1000)} seconds`,
        message,
        checkStatusUrl: `/api/x402/queue?wallet=${body.userAddress}`,
      }, { status: 202, headers: CORS_HEADERS }); // 202 Accepted
      
    } catch (queueError) {
      const errorMessage = queueError instanceof Error ? queueError.message : 'Failed to add to queue';
      
      // Check if it's a "already in queue" error
      if (errorMessage.includes('already have a pending')) {
        const position = queue.getQueuePosition(body.userAddress);
        return NextResponse.json({
          success: false,
          error: errorMessage,
          existingPosition: position.position,
          message: position.message,
        }, { status: 409, headers: CORS_HEADERS }); // 409 Conflict
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
  } catch (error) {
    console.error('[x402/queue] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process queue request' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * DELETE /api/x402/queue
 * 
 * Cancel a pending request
 * 
 * Query params:
 * - wallet: User's wallet address (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'wallet parameter is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    const queue = getMintQueue();
    const cancelled = queue.cancelRequest(wallet);
    
    if (cancelled) {
      return NextResponse.json({
        success: true,
        cancelled: true,
        message: '✅ Your mint request has been cancelled.',
      }, { headers: CORS_HEADERS });
    } else {
      return NextResponse.json({
        success: false,
        cancelled: false,
        message: 'No pending request found to cancel.',
      }, { status: 404, headers: CORS_HEADERS });
    }
    
  } catch (error) {
    console.error('[x402/queue] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel request' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
