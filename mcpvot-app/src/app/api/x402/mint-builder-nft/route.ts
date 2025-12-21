import {
    CONTRACTS,
    X402_CONFIG,
    X402PaymentRequest,
    X402PaymentResponse
} from '@/lib/x402-vot-facilitator';
import { getMintQueue, QUEUE_CONFIG } from '@/lib/x402/mintQueue';
import {
    checkCombinedRateLimit,
    getClientIP,
    getRateLimitHeaders
} from '@/lib/x402/rateLimit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * x402 VOT Facilitator - Mint Builder NFT API
 * 
 * POST /api/x402/mint-builder-nft
 * 
 * FLOW:
 * 1. User pays $1 USDC → x402 Facilitator
 * 2. Request added to queue (rate limit: 1 at a time)
 * 3. Shows "X MCPVOTs ahead of you..."
 * 4. When processed: VOT transfer + burn + NFT mint
 * 5. User signs ONCE - we pay all gas
 * 
 * NEW: Queue-based processing for API rate limits
 */

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// NOTE: pinToIPFS and storeMintInMemory functions moved to mintExecutor.ts
// Queue system handles all processing via the mintQueue module

export async function POST(request: NextRequest): Promise<NextResponse<X402PaymentResponse>> {
  const requestId = `mint-nft-${Date.now().toString(36)}`;
  
  try {
    const body: X402PaymentRequest = await request.json();
    
    // Validate request
    if (!body.userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address required' },
        { status: 400 }
      );
    }
    
    // Rate limiting check (SECURITY: Added per Security Analysis Report)
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkCombinedRateLimit(body.userAddress, clientIP);
    
    if (!rateLimit.allowed) {
      console.warn(`[${requestId}] Rate limit exceeded for ${body.userAddress} (limited by: ${rateLimit.limitedBy})`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please wait 1 minute.',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
        } as X402PaymentResponse,
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit)
        }
      );
    }
    
    if (!body.svgContent) {
      return NextResponse.json(
        { success: false, error: 'SVG content required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    console.log('[x402 Mint] Adding to queue for:', body.userAddress);
    
    // NEW: Add to queue instead of processing immediately
    const queue = getMintQueue();
    
    try {
      const queueItem = queue.addToQueue({
        userAddress: body.userAddress,
        ensName: body.ensName,
        baseName: body.baseName,
        farcasterFid: body.farcasterFid,
        svgContent: body.svgContent,
      });
      
      const stats = queue.getStats();
      const aheadOfYou = Math.max(0, queueItem.position - 1 + (stats.processing ? 1 : 0));
      
      // Generate queue message
      let queueMessage: string;
      if (aheadOfYou === 0) {
        queueMessage = '🎯 You\'re next! Your MCPVOT will be minted shortly...';
      } else if (aheadOfYou === 1) {
        queueMessage = '⏳ 1 MCPVOT ahead of you in the queue...';
      } else {
        queueMessage = `⏳ ${aheadOfYou} MCPVOTs ahead of you in the queue...`;
      }
      
      console.log(`[x402 Mint] Queued: ${queueItem.id} at position ${queueItem.position}`);
      
      // Return queued status (202 Accepted)
      return NextResponse.json({
        success: true,
        queued: true,
        queueId: queueItem.id,
        position: queueItem.position,
        aheadOfYou,
        estimatedWaitSeconds: Math.ceil((aheadOfYou + 1) * QUEUE_CONFIG.PROCESS_INTERVAL_MS / 1000),
        message: queueMessage,
        checkStatusUrl: `/api/x402/queue?wallet=${body.userAddress}`,
        note: 'Your mint request is in the queue. Check status at the URL above.',
      } as X402PaymentResponse, { 
        status: 202,
        headers: CORS_HEADERS
      });
      
    } catch (queueError) {
      const errorMsg = queueError instanceof Error ? queueError.message : 'Queue error';
      
      // Check if already in queue
      if (errorMsg.includes('already have a pending')) {
        const position = queue.getQueuePosition(body.userAddress);
        return NextResponse.json({
          success: false,
          error: errorMsg,
          existingQueueId: position.item?.id,
          position: position.position,
          aheadOfYou: position.aheadOfYou,
          message: position.message,
        } as X402PaymentResponse, { 
          status: 409, // Conflict
          headers: CORS_HEADERS
        });
      }
      
      throw queueError;
    }
    
    /* 
    // OLD DIRECT PROCESSING CODE - NOW HANDLED BY QUEUE
    // Step 1: Generate token ID
    const tokenId = nextTokenId++;
    console.log('[x402 Mint] Token ID:', tokenId);
    
    // Step 2: Pin SVG to IPFS
    const svgFilename = `mcpvot-builder-${tokenId}.svg`;
    const svgCid = await pinToIPFS(body.svgContent, svgFilename);
    console.log('[x402 Mint] SVG pinned:', svgCid);
    
    // Step 3: Generate NFT preview (thumbnail for marketplaces)
    const previewSvg = generateNFTPreviewSVG(
      body.ensName || `Builder #${tokenId}`,
      tokenId,
      body.ensName
    );
    const previewCid = await pinToIPFS(previewSvg, `mcpvot-builder-${tokenId}-preview.svg`);
    console.log('[x402 Mint] Preview pinned:', previewCid);
    
    // Step 4: Calculate VOT amounts
    const votSent = X402_CONFIG.VOT_REWARD;
    const votBurned = calculateBurnAmount(BigInt(votSent)).toString();
    console.log('[x402 Mint] VOT sent:', votSent, 'Burned:', votBurned);
    
    // Step 5: Generate metadata
    const metadata = generateBuilderMetadata(
      tokenId,
      {
        address: body.userAddress,
        ensName: body.ensName,
        farcasterFid: body.farcasterFid,
      },
      previewCid, // Use preview as main image
      '', // Will be set after pinning metadata
      {
        hash: '0x' + 'pending', // Would be real tx hash
        blockNumber: 0, // Would be real block
        votSent,
        votBurned,
      }
    );
    
    // Step 6: Pin metadata to IPFS
    const metadataCid = await pinToIPFS(
      JSON.stringify(metadata, null, 2),
      `mcpvot-builder-${tokenId}-metadata.json`
    );
    console.log('[x402 Mint] Metadata pinned:', metadataCid);
    
    // Update metadata with CID
    metadata.mintInfo.metadataCid = metadataCid;
    metadata.mintInfo.svgCid = svgCid;
    
    // Step 7: Store in MCP Memory
    await storeMintInMemory(metadata);
    
    // Step 8: Execute blockchain transactions
    // TODO: Implement real blockchain transactions:
    // - Transfer USDC from user to facilitator
    // - Transfer VOT from treasury to user
    // - Buy back VOT from liquidity
    // - Burn 1% VOT
    // - Mint ERC-1155 NFT
    // - All in one gasless transaction via paymaster
    
    // Return pending status until contract is deployed
    // Transaction hash will come from the actual mint transaction
    const pendingTxHash = `0x${'0'.repeat(64)}`; // Placeholder until real tx
    
    console.log('[x402 Mint] Data prepared! Token ID:', tokenId, '(awaiting contract deployment)');
    
    return NextResponse.json({
      success: true,
      transactionHash: pendingTxHash,
      tokenId,
      ipfsCid: svgCid,
      metadataCid,
      votSent,
      votBurned,
    });
    */
    
  } catch (error) {
    console.error('[x402 Mint] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Minting failed',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// GET - Collection info and queue stats
export async function GET() {
  const queue = getMintQueue();
  const stats = queue.getStats();
  
  return NextResponse.json({
    collection: {
      name: 'BEEPER NFT Collection',
      symbol: 'BEEPER',
      standard: 'ERC-1155',
      network: 'Base',
      chainId: X402_CONFIG.CHAIN_ID,
    },
    pricing: {
      mintPrice: '$0.25 USDC',
      mintPriceRaw: X402_CONFIG.MINT_PRICE_USDC,
      votReward: '69,420 VOT',
      shareBonus: '10,000 VOT (FIP-2)',
      burnRate: '0% (builder-first model)',
      votBurned: '0 VOT per mint - NO BURNS',
    },
    queue: {
      pending: stats.totalQueued,
      processing: stats.processing,
      completedToday: stats.completed,
      estimatedWaitSeconds: Math.ceil(stats.estimatedWaitMs / 1000),
      processInterval: `${QUEUE_CONFIG.PROCESS_INTERVAL_MS / 1000}s per mint`,
      message: stats.totalQueued > 0 
        ? `${stats.totalQueued} BEEPERs in queue. ~${Math.ceil(stats.estimatedWaitMs / 1000)}s wait.`
        : '✅ Queue empty! Your mint will start immediately.',
    },
    contracts: {
      beeperNFT: process.env.NEXT_PUBLIC_BEEPER_CONTRACT || CONTRACTS.MCPVOT_BUILDER_NFT,
      votToken: CONTRACTS.VOT_TOKEN,
      maxxToken: CONTRACTS.MAXX_TOKEN,
      treasury: CONTRACTS.VOT_TREASURY,
      usdc: CONTRACTS.USDC_BASE,
    },
    features: [
      '⚡ Gasless minting (x402 facilitator pays gas)',
      '🦖 69,420 VOT reward per mint',
      '🎁 +10,000 VOT share bonus (FIP-2)',
      '🎲 VRF-based 9-tier rarity system',
      '🔒 Future staking hooks ready',
      '📦 IPFS metadata storage',
      '🤖 MAXX/VOT trader bot integration',
      '👤 ENS/Basename/Farcaster identity',
    ],
    rarity: {
      tiers: ['NODE (45%)', 'VALIDATOR (25%)', 'WHALE (15%)', 'OG (8%)', 'GENESIS (4%)', 'ZZZ (2%)', 'FOMO (0.7%)', 'GM (0.25%)', 'X402 (0.05%)'],
      note: 'Rarity determined by on-chain VRF after mint',
    },
    stats: {
      totalMinted: stats.completed,
      maxSupply: 69420,
    },
    endpoints: {
      mint: 'POST /api/x402/mint-builder-nft',
      queueStatus: 'GET /api/x402/queue?wallet=0x...',
      cancel: 'DELETE /api/x402/queue?wallet=0x...',
    },
  }, { headers: CORS_HEADERS });
}
