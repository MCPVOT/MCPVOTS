/**
 * OpenSea API Integration
 * 
 * Endpoints:
 * - GET /api/opensea?action=nft&tokenId=123 - Get NFT details
 * - GET /api/opensea?action=collection - Get collection stats
 * - POST /api/opensea (action=refresh) - Refresh NFT metadata on OpenSea
 * 
 * Uses OpenSea API v2: https://docs.opensea.io/reference/api-overview
 */

import { NextRequest, NextResponse } from 'next/server';

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || process.env.NEXT_PUBLIC_OPENSEA_API_KEY;
// MCP_OPENSEA_API_KEY available for future use: process.env.MCP_OPENSEA_API_KEY
const BEEPER_CONTRACT = (process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9').trim();
const CHAIN = 'base';

// OpenSea API Base URL
const OPENSEA_API_BASE = 'https://api.opensea.io/api/v2';

/**
 * GET - Fetch NFT or collection data from OpenSea
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'nft';
    const tokenId = searchParams.get('tokenId');
    
    if (!OPENSEA_API_KEY) {
      return NextResponse.json(
        { error: 'OpenSea API key not configured' },
        { status: 500 }
      );
    }

    const headers = {
      'Accept': 'application/json',
      'X-API-KEY': OPENSEA_API_KEY,
    };

    switch (action) {
      case 'nft': {
        if (!tokenId) {
          return NextResponse.json(
            { error: 'tokenId is required for nft action' },
            { status: 400 }
          );
        }
        
        // Fetch single NFT - https://docs.opensea.io/reference/get_nft
        const nftUrl = `${OPENSEA_API_BASE}/chain/${CHAIN}/contract/${BEEPER_CONTRACT}/nfts/${tokenId}`;
        const nftResponse = await fetch(nftUrl, { headers });
        
        if (!nftResponse.ok) {
          const errorText = await nftResponse.text();
          console.error('[OpenSea] NFT fetch error:', nftResponse.status, errorText);
          
          // If 404, NFT may not be indexed yet
          if (nftResponse.status === 404) {
            return NextResponse.json({
              success: false,
              error: 'NFT not yet indexed on OpenSea. Please wait a few minutes after minting.',
              tokenId,
              contract: BEEPER_CONTRACT,
              chain: CHAIN,
              opensea_url: `https://opensea.io/assets/${CHAIN}/${BEEPER_CONTRACT}/${tokenId}`,
            });
          }
          
          return NextResponse.json(
            { error: `OpenSea API error: ${nftResponse.status}` },
            { status: nftResponse.status }
          );
        }
        
        const nftData = await nftResponse.json();
        
        return NextResponse.json({
          success: true,
          nft: nftData.nft,
          opensea_url: `https://opensea.io/assets/${CHAIN}/${BEEPER_CONTRACT}/${tokenId}`,
        });
      }
      
      case 'collection': {
        // Fetch collection stats - https://docs.opensea.io/reference/get_collection
        const collectionUrl = `${OPENSEA_API_BASE}/collections/beeper-nft`;
        const collectionResponse = await fetch(collectionUrl, { headers });
        
        if (!collectionResponse.ok) {
          // Try by contract address if collection slug doesn't work
          const byContractUrl = `${OPENSEA_API_BASE}/chain/${CHAIN}/contract/${BEEPER_CONTRACT}`;
          const byContractResponse = await fetch(byContractUrl, { headers });
          
          if (!byContractResponse.ok) {
            return NextResponse.json(
              { error: 'Collection not found on OpenSea' },
              { status: 404 }
            );
          }
          
          const contractData = await byContractResponse.json();
          return NextResponse.json({
            success: true,
            collection: contractData,
            type: 'contract',
          });
        }
        
        const collectionData = await collectionResponse.json();
        return NextResponse.json({
          success: true,
          collection: collectionData,
          type: 'collection',
        });
      }
      
      case 'list': {
        // List all NFTs in collection
        const listUrl = `${OPENSEA_API_BASE}/chain/${CHAIN}/contract/${BEEPER_CONTRACT}/nfts?limit=50`;
        const listResponse = await fetch(listUrl, { headers });
        
        if (!listResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to list NFTs' },
            { status: listResponse.status }
          );
        }
        
        const listData = await listResponse.json();
        return NextResponse.json({
          success: true,
          nfts: listData.nfts,
          next: listData.next,
        });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: nft, collection, or list' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[OpenSea] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Refresh NFT metadata on OpenSea
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tokenId } = body;
    
    if (!OPENSEA_API_KEY) {
      return NextResponse.json(
        { error: 'OpenSea API key not configured' },
        { status: 500 }
      );
    }
    
    if (action !== 'refresh') {
      return NextResponse.json(
        { error: 'Invalid action. Use: refresh' },
        { status: 400 }
      );
    }
    
    if (!tokenId) {
      return NextResponse.json(
        { error: 'tokenId is required' },
        { status: 400 }
      );
    }
    
    // Refresh metadata - https://docs.opensea.io/reference/refresh_nft
    const refreshUrl = `${OPENSEA_API_BASE}/chain/${CHAIN}/contract/${BEEPER_CONTRACT}/nfts/${tokenId}/refresh`;
    
    const refreshResponse = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'X-API-KEY': OPENSEA_API_KEY,
      },
    });
    
    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('[OpenSea] Refresh error:', refreshResponse.status, errorText);
      
      // OpenSea returns 202 for successful refresh request
      if (refreshResponse.status === 202 || refreshResponse.status === 200) {
        return NextResponse.json({
          success: true,
          message: 'Metadata refresh requested. OpenSea will update shortly.',
          tokenId,
          opensea_url: `https://opensea.io/assets/${CHAIN}/${BEEPER_CONTRACT}/${tokenId}`,
        });
      }
      
      return NextResponse.json(
        { error: `OpenSea refresh error: ${refreshResponse.status}`, details: errorText },
        { status: refreshResponse.status }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Metadata refresh requested successfully',
      tokenId,
      opensea_url: `https://opensea.io/assets/${CHAIN}/${BEEPER_CONTRACT}/${tokenId}`,
    });
    
  } catch (error) {
    console.error('[OpenSea] Refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
