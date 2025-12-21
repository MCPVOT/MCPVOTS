import { NextRequest, NextResponse } from 'next/server';

/**
 * OpenSea Metadata Refresh API
 * 
 * Triggers OpenSea to re-fetch metadata for a specific token or entire collection
 * 
 * POST /api/opensea/refresh
 * Body: { tokenId?: number, refreshAll?: boolean }
 * 
 * OpenSea API docs: https://docs.opensea.io/reference/refresh_nft
 */

const BEEPER_CONTRACT = '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9';
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || '';

interface RefreshRequest {
  tokenId?: number;
  refreshAll?: boolean;
}

interface OpenSeaResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<OpenSeaResponse>> {
  try {
    const body: RefreshRequest = await request.json();
    const { tokenId, refreshAll } = body;

    if (!tokenId && !refreshAll) {
      return NextResponse.json(
        { success: false, error: 'Provide tokenId or refreshAll: true' },
        { status: 400 }
      );
    }

    // OpenSea API endpoint for Base chain
    const baseUrl = 'https://api.opensea.io/api/v2/chain/base/contract';
    
    if (tokenId !== undefined) {
      // Refresh specific token
      const refreshUrl = `${baseUrl}/${BEEPER_CONTRACT}/nfts/${tokenId}/refresh`;
      
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(OPENSEA_API_KEY && { 'X-API-KEY': OPENSEA_API_KEY }),
        },
      });

      if (response.ok) {
        console.log(`[OpenSea] Refreshed token #${tokenId}`);
        return NextResponse.json({
          success: true,
          message: `Token #${tokenId} metadata refresh triggered`,
        });
      } else {
        const errorText = await response.text();
        console.error(`[OpenSea] Refresh failed: ${errorText}`);
        return NextResponse.json(
          { success: false, error: `OpenSea API error: ${response.status}` },
          { status: response.status }
        );
      }
    }

    if (refreshAll) {
      // Note: OpenSea doesn't have a "refresh all" endpoint
      // You need to call refresh for each tokenId
      // This is a placeholder for batch refresh logic
      return NextResponse.json({
        success: true,
        message: 'Batch refresh not available. Use tokenId for individual refreshes.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('[OpenSea] Refresh error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET: Return collection info and how to activate
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    collection: {
      name: 'BEEPER NFT',
      symbol: 'BEEPER-V2',
      contract: BEEPER_CONTRACT,
      chain: 'base',
      chainId: 8453,
      standard: 'ERC-1155',
    },
    opensea: {
      collectionUrl: `https://opensea.io/collection/beeper-v2`,
      contractUrl: `https://opensea.io/assets/base/${BEEPER_CONTRACT}`,
      status: 'Pending first mint',
    },
    assets: {
      logo: 'https://mcpvot.xyz/opensea/beeper-collection-logo.svg',
      banner: 'https://mcpvot.xyz/opensea/beeper-collection-banner.svg',
      contractMetadata: 'https://mcpvot.xyz/opensea/contract-metadata.json',
    },
    activation: {
      steps: [
        '1. Mint first NFT via https://mcpvot.xyz/beeper',
        '2. OpenSea auto-indexes ERC-1155 contracts on Base within ~5 minutes',
        '3. Visit https://opensea.io/collection/beeper-v2',
        '4. Click "Edit collection" to customize logo, banner, description',
        '5. Set royalties (2.5% recommended)',
        '6. Verify contract ownership via wallet signature',
      ],
      note: 'OpenSea does not have a public API to create collections. Must use their UI after first mint.',
    },
  });
}
