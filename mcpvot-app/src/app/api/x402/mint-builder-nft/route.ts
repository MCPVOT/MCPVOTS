import { generateVOTHTMLPage, type VOTPageData } from '@/lib/svg-machine/templates/vot-html-page';
import {
    CONTRACTS,
    X402_CONFIG,
    X402PaymentRequest,
    X402PaymentResponse
} from '@/lib/x402-vot-facilitator';
import { getMintQueue, QUEUE_CONFIG } from '@/lib/x402/mintQueue';
import {
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
    
    // Rate limiting check (SECURITY: Uses Vercel KV for persistence across cold starts)
    const clientIP = getClientIP(request.headers);
    const rateLimit = await checkCombinedRateLimitAsync(body.userAddress, clientIP);
    
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
    
    // Auto-generate HTML if not provided (for AI agents calling directly)
    let svgContent = body.svgContent;
    if (!svgContent) {
      console.log(`[${requestId}] Auto-generating VOT HTML page for ${body.userAddress}`);
      
      const pageData: VOTPageData = {
        address: body.userAddress,
        ensName: body.ensName || null,
        basename: body.baseName || null,
        farcasterUsername: body.farcasterUsername || null,
        farcasterFid: body.farcasterFid || null,
        category: body.template || 'mcpvot',
        tokenId: Date.now(),
        holdings: {
          vot: 69420,
          maxx: 0,
          eth: 0,
        },
        rank: 'BUILDER',
        level: 1,
        displayName: body.ensName || body.baseName || `Builder-${body.userAddress.slice(0, 8)}`,
      };
      
      svgContent = generateVOTHTMLPage(pageData);
      console.log(`[${requestId}] Generated ${svgContent.length} bytes of HTML`);
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
        svgContent: svgContent, // Use auto-generated or provided content
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

// GET - VOT Builder service info and queue stats
export async function GET() {
  const queue = getMintQueue();
  const stats = queue.getStats();
  
  return NextResponse.json({
    service: {
      name: 'VOT Builder - IPFS Site Service',
      description: 'Create your decentralized IPFS site + receive 69,420 VOT tokens',
      network: 'Base',
      chainId: X402_CONFIG.CHAIN_ID,
    },
    pricing: {
      price: '$1.00 USDC',
      priceRaw: X402_CONFIG.MINT_PRICE_USDC,
      votReward: '69,420 VOT tokens sent to your wallet',
      shareBonus: '10,000 VOT (FIP-2) for sharing',
      totalVOT: '79,420 VOT per $1 payment',
      burnRate: '0% (builder-first model)',
    },
    deliverables: {
      svgSite: 'Custom animated SVG site pinned to IPFS (permanent)',
      votTokens: '69,420 VOT sent directly to your wallet',
      metadata: 'JSON metadata for your site',
      gateway: 'Access via ipfs.io/ipfs/{cid}',
    },
    queue: {
      pending: stats.totalQueued,
      processing: stats.processing,
      completedToday: stats.completed,
      estimatedWaitSeconds: Math.ceil(stats.estimatedWaitMs / 1000),
      processInterval: `${QUEUE_CONFIG.PROCESS_INTERVAL_MS / 1000}s per request`,
      message: stats.totalQueued > 0 
        ? `${stats.totalQueued} builders ahead in queue. ~${Math.ceil(stats.estimatedWaitMs / 1000)}s wait.`
        : '✅ Queue empty! Your site will be created immediately.',
    },
    contracts: {
      votToken: CONTRACTS.VOT_TOKEN,
      maxxToken: CONTRACTS.MAXX_TOKEN,
      treasury: CONTRACTS.VOT_TREASURY,
      usdc: CONTRACTS.USDC_BASE,
    },
    features: [
      '⚡ Gasless - we pay all transaction fees',
      '🦖 69,420 VOT reward per $1 payment',
      '🎁 +10,000 VOT share bonus (FIP-2)',
      '📦 Permanent IPFS storage (free via Web3.Storage)',
      '🎨 100+ SVG templates (10 categories)',
      '🤖 AI-enhanced personalization',
      '👤 ENS/Basename/Farcaster identity support',
      '🌐 Access via ipfs.io gateway',
    ],
    templates: {
      categories: ['vot', 'maxx', 'warplet', 'mcpvot', 'base', 'farcaster', 'ens', 'defi', 'gaming', 'minimal'],
      count: 100,
      note: 'Provide template category or leave empty for random selection',
    },
    stats: {
      totalCreated: stats.completed,
    },
    endpoints: {
      create: 'POST /api/x402/mint-builder-nft',
      queueStatus: 'GET /api/x402/queue?wallet=0x...',
      cancel: 'DELETE /api/x402/queue?wallet=0x...',
    },
    forAgents: {
      note: 'AI agents can create their web3 presence with minimal input - we auto-generate everything!',
      autoGeneration: 'If svgContent is empty, we generate a custom VOT Machine HTML page using the template category',
      examplePayload: {
        userAddress: '0xYourWallet (required)',
        ensName: 'optional.eth (enhances personalization)',
        baseName: 'optional.base.eth (enhances personalization)',
        farcasterFid: 12345, // optional
        template: 'mcpvot', // optional: vot, maxx, warplet, base, farcaster, ens, defi, gaming, minimal, mcpvot
        svgContent: '(optional - leave empty for auto-generation from template)'
      },
      minimalPayload: {
        userAddress: '0xYourWallet',
        // That's it! We handle everything else
      }
    }
  }, { headers: CORS_HEADERS });
}
