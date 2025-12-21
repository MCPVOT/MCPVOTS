/**
 * MCPVOT NFT API - Dynamic SVG/HTML NFT Generation
 * 
 * GET /api/nft/:tokenId - Returns NFT metadata JSON
 * GET /api/nft/:tokenId?format=svg - Returns raw SVG image (simple card)
 * GET /api/nft/:tokenId?format=html - Returns FULL HTML page (VOT Machine style)
 * GET /api/nft/:tokenId?format=base64 - Returns base64 encoded SVG
 */

import { calculateRarity, generateNFTMetadataJSON, generateVOTNFT, NFTMetadata } from '@/lib/svg-nft-generator';
import { NextRequest, NextResponse } from 'next/server';

// NFT Database Record - queried from MCP Memory or blockchain
interface NFTRecord {
  tokenId: string;
  owner: string;
  votAmount: string;
  txHash: string;
  timestamp: string;
}

async function getNFTFromDatabase(tokenId: string): Promise<NFTRecord | null> {
  // Query MCP Memory for NFT data
  const memoryUrl = process.env.MCP_MEMORY_URL || 'http://localhost:8001';
  
  try {
    const response = await fetch(`${memoryUrl}/list?category=nft_mint&limit=1000`);
    if (response.ok) {
      const data = await response.json();
      const memories = data.memories || [];
      
      // Find the NFT by tokenId
      for (const memory of memories) {
        try {
          const content = JSON.parse(memory.content);
          if (content.tokenId?.toString() === tokenId) {
            return {
              tokenId,
              owner: content.mintInfo?.builder || content.builder?.address || '0x0',
              votAmount: content.mintInfo?.votReceived || '100000',
              txHash: content.mintInfo?.transactionHash || '0x0',
              timestamp: content.mintInfo?.timestamp ? new Date(content.mintInfo.timestamp * 1000).toISOString() : new Date().toISOString(),
            };
          }
        } catch {
          continue;
        }
      }
    }
  } catch (error) {
    console.error('[NFT API] MCP Memory query failed:', error);
  }
  
  // NFT not found
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Validate tokenId
    if (!tokenId || !/^\d+$/.test(tokenId)) {
      return NextResponse.json(
        { error: 'Invalid token ID. Must be a positive integer.' },
        { status: 400 }
      );
    }

    // Fetch NFT data
    const nftRecord = await getNFTFromDatabase(tokenId);
    
    if (!nftRecord) {
      return NextResponse.json(
        { error: 'NFT not found', tokenId },
        { status: 404 }
      );
    }

    // Calculate rarity
    const rarity = calculateRarity(nftRecord.votAmount);
    
    const metadata: NFTMetadata = {
      ...nftRecord,
      rarity,
    };

    // Return based on format
    switch (format) {
      case 'html': {
        // Generate FULL HTML page (VOT Machine style) with LLM uniqueness
        const ctx: VOTMachineContext = {
          tokenId: parseInt(tokenId),
          category: 'warplet',
          userAddress: nftRecord.owner,
        };
        
        // Get LLM-generated uniqueness (or fallback to deterministic)
        let uniqueness;
        try {
          uniqueness = await generateVOTMachineUniqueness(ctx);
        } catch {
          // Fallback - use without LLM enhancement
          uniqueness = undefined;
        }
        
        const pageData: VOTPageData = {
          address: nftRecord.owner,
          tokenId: parseInt(tokenId),
          category: 'warplet',
          uniqueness,
          holdings: {
            votBalance: parseInt(nftRecord.votAmount) || 0,
            maxxBalance: 0,
            hasWarplet: true,
            hasFarcaster: false,
          },
          mintDate: new Date(nftRecord.timestamp),
        };
        
        const html = generateVOTHTMLPage(pageData, {
          showBootSequence: true,
          animationSpeed: 'normal',
        });
        
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      case 'svg': {
        const svg = generateVOTNFT(metadata);
        return new NextResponse(svg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }

      case 'base64': {
        const svg = generateVOTNFT(metadata);
        const base64 = Buffer.from(svg).toString('base64');
        return NextResponse.json({
          tokenId,
          format: 'base64',
          contentType: 'image/svg+xml',
          data: `data:image/svg+xml;base64,${base64}`,
        });
      }

      case 'json':
      default: {
        const metadataJSON = generateNFTMetadataJSON(metadata);
        return NextResponse.json(metadataJSON, {
          headers: {
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }
  } catch (error) {
    console.error('NFT API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate NFT', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
