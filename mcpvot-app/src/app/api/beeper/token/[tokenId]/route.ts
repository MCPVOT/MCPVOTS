/**
 * BEEPER NFT On-Chain Data API
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  GET /api/beeper/token/[tokenId] - Fetch on-chain data via ERC-4804      ║
 * ║  Returns: rarity, minter, SVG, metadata - all from Base L2 directly      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import {
    fetchBeeperMetadataUri,
    fetchBeeperSvg,
    fetchBeeperTokenData,
    getBaseScanTokenUrl,
    getOpenSeaUrl,
    getWeb3Url,
    parseMetadataUri,
} from '@/lib/beeper/erc4804-fetcher';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId: tokenIdStr } = await params;
    const tokenId = parseInt(tokenIdStr, 10);
    
    if (isNaN(tokenId) || tokenId < 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token ID',
      }, { status: 400 });
    }

    // Fetch token data from chain
    const tokenData = await fetchBeeperTokenData(tokenId);
    
    if (!tokenData || !tokenData.exists) {
      return NextResponse.json({
        success: false,
        error: `Token #${tokenId} does not exist`,
      }, { status: 404 });
    }

    // Check if SVG is requested
    const includeSvg = request.nextUrl.searchParams.get('svg') === 'true';
    const includeMetadata = request.nextUrl.searchParams.get('metadata') === 'true';

    let svgData: string | null = null;
    let metadata: Record<string, unknown> | null = null;

    if (includeSvg) {
      svgData = await fetchBeeperSvg(tokenId);
    }

    if (includeMetadata) {
      const uri = await fetchBeeperMetadataUri(tokenId);
      if (uri) {
        metadata = parseMetadataUri(uri);
      }
    }

    return NextResponse.json({
      success: true,
      tokenId,
      data: {
        ...tokenData,
        // Add computed URLs
        web3Url: getWeb3Url(tokenId),
        openSeaUrl: getOpenSeaUrl(tokenId),
        baseScanUrl: getBaseScanTokenUrl(tokenId),
      },
      svg: svgData,
      metadata,
      // Timestamps
      fetchedAt: new Date().toISOString(),
      source: 'ERC-4804 on-chain',
    });

  } catch (error) {
    console.error('[API] Error fetching token data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
