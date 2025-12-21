/**
 * OpenSea Collection Management API
 * 
 * Endpoints:
 * - POST /api/opensea/collection (action=refresh) - Refresh collection on OpenSea
 * - POST /api/opensea/collection (action=metadata) - Generate & pin collection metadata
 * - GET /api/opensea/collection - Get collection status
 * 
 * Fixes "collection not active" issue on OpenSea
 */

import { NextRequest, NextResponse } from 'next/server';

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || process.env.NEXT_PUBLIC_OPENSEA_API_KEY;
const PINATA_JWT = process.env.PINATA_JWT;
const BEEPER_CONTRACT = process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9';
const CHAIN = 'base';

// OpenSea API Base URL
const OPENSEA_API_BASE = 'https://api.opensea.io/api/v2';

// Collection metadata for OpenSea
const COLLECTION_METADATA = {
  name: "BEEPER NFT",
  description: "BEEPER NFT - x402 V2 Protocol on Base. AI-enhanced identity NFTs with 10 VRF-determined rarity tiers. Gasless minting powered by the x402 Facilitator. Each BEEPER includes: personalized AI tagline, Sumerian hieroglyphic identity markers, on-chain SVG artwork, and 69,420 VOT token reward. Built by MCPVOT.",
  image: "ipfs://QmYourCollectionImageCID", // TODO: Replace with actual collection image
  banner_image: "ipfs://QmYourBannerImageCID", // TODO: Replace with actual banner
  external_link: "https://mcpvot.xyz/beeper",
  seller_fee_basis_points: 250, // 2.5% royalty
  fee_recipient: "0x1234567890123456789012345678901234567890", // TODO: Replace with your royalty address
  collaborators: [],
};

/**
 * GET - Check collection status on OpenSea
 */
export async function GET() {
  try {
    if (!OPENSEA_API_KEY) {
      return NextResponse.json(
        { error: 'OpenSea API key not configured', hint: 'Set OPENSEA_API_KEY in .env' },
        { status: 500 }
      );
    }

    const headers = {
      'Accept': 'application/json',
      'X-API-KEY': OPENSEA_API_KEY,
    };

    // Try multiple approaches to find the collection
    const results: Record<string, unknown> = {};

    // 1. Try by contract address
    try {
      const contractUrl = `${OPENSEA_API_BASE}/chain/${CHAIN}/contract/${BEEPER_CONTRACT}`;
      const contractRes = await fetch(contractUrl, { headers });
      results.contract = {
        status: contractRes.status,
        data: contractRes.ok ? await contractRes.json() : await contractRes.text(),
      };
    } catch (e) {
      results.contract = { error: String(e) };
    }

    // 2. Try listing NFTs from contract
    try {
      const nftsUrl = `${OPENSEA_API_BASE}/chain/${CHAIN}/contract/${BEEPER_CONTRACT}/nfts?limit=5`;
      const nftsRes = await fetch(nftsUrl, { headers });
      results.nfts = {
        status: nftsRes.status,
        data: nftsRes.ok ? await nftsRes.json() : await nftsRes.text(),
      };
    } catch (e) {
      results.nfts = { error: String(e) };
    }

    // 3. Try known collection slugs
    const slugs = ['beeper-nft', 'beeper', 'beeper-nft-v2', 'x402-beeper'];
    for (const slug of slugs) {
      try {
        const collectionUrl = `${OPENSEA_API_BASE}/collections/${slug}`;
        const collectionRes = await fetch(collectionUrl, { headers });
        if (collectionRes.ok) {
          results.collection = {
            slug,
            status: collectionRes.status,
            data: await collectionRes.json(),
          };
          break;
        }
      } catch (e) {
        // Continue trying other slugs
      }
    }

    return NextResponse.json({
      success: true,
      contract: BEEPER_CONTRACT,
      chain: CHAIN,
      opensea_url: `https://opensea.io/assets/${CHAIN}/${BEEPER_CONTRACT}`,
      results,
      suggestions: [
        'If collection not found, call POST with action=refresh to trigger indexing',
        'If metadata incorrect, update contractURI() in smart contract',
        'OpenSea indexing can take 24-48 hours for new contracts',
      ],
    });

  } catch (error) {
    console.error('[OpenSea Collection] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST - Refresh collection or generate metadata
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'refresh': {
        // Trigger OpenSea to re-index the contract
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

        // Refresh all NFTs we know about (trigger re-indexing)
        const refreshResults: Array<{ tokenId: number; status: number; success: boolean }> = [];
        
        // Try refreshing tokens 1-10 to kickstart collection indexing
        for (let tokenId = 1; tokenId <= 10; tokenId++) {
          try {
            const refreshUrl = `${OPENSEA_API_BASE}/chain/${CHAIN}/contract/${BEEPER_CONTRACT}/nfts/${tokenId}/refresh`;
            const res = await fetch(refreshUrl, {
              method: 'POST',
              headers,
            });
            refreshResults.push({
              tokenId,
              status: res.status,
              success: res.status === 200 || res.status === 202,
            });
          } catch {
            refreshResults.push({ tokenId, status: 0, success: false });
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Collection refresh triggered. OpenSea will re-index shortly.',
          contract: BEEPER_CONTRACT,
          chain: CHAIN,
          refreshResults,
          note: 'Full indexing may take 24-48 hours. Individual NFT refreshes should be faster.',
        });
      }

      case 'metadata': {
        // Generate and pin collection metadata to IPFS
        if (!PINATA_JWT) {
          return NextResponse.json(
            { error: 'Pinata JWT not configured for IPFS pinning' },
            { status: 500 }
          );
        }

        // Pin collection metadata to IPFS
        const pinResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PINATA_JWT}`,
          },
          body: JSON.stringify({
            pinataContent: COLLECTION_METADATA,
            pinataMetadata: {
              name: 'BEEPER_NFT_Collection_Metadata',
            },
          }),
        });

        if (!pinResponse.ok) {
          const errorText = await pinResponse.text();
          return NextResponse.json(
            { error: 'Failed to pin metadata', details: errorText },
            { status: 500 }
          );
        }

        const pinData = await pinResponse.json();

        return NextResponse.json({
          success: true,
          message: 'Collection metadata pinned to IPFS',
          ipfsCid: pinData.IpfsHash,
          ipfsUrl: `ipfs://${pinData.IpfsHash}`,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${pinData.IpfsHash}`,
          metadata: COLLECTION_METADATA,
          nextStep: 'Update contractURI() in smart contract to return this IPFS CID, then call refresh action',
        });
      }

      case 'register': {
        // Try to register/submit collection to OpenSea
        // Note: OpenSea doesn't have a public API for this, but we can try their submission form
        return NextResponse.json({
          success: false,
          message: 'OpenSea does not have a public API for collection registration',
          manual_steps: [
            '1. Go to https://opensea.io/assets/base/' + BEEPER_CONTRACT,
            '2. OpenSea should auto-detect the contract',
            '3. If not showing, mint at least one NFT to trigger indexing',
            '4. Use the "refresh" action to force re-indexing',
            '5. Wait 24-48 hours for full collection indexing',
          ],
          submit_form: 'https://opensea.io/collection/create',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: refresh, metadata, or register' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[OpenSea Collection] POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
