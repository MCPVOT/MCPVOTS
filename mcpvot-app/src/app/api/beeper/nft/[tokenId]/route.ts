/**
 * API Route: GET /api/beeper/nft/[tokenId]
 * 
 * Fetches NFT metadata from on-chain contract and IPFS
 * Supports ERC-1155 standard
 */

import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const BEEPER_CONTRACT = (process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9').trim() as `0x${string}`;
const IPFS_GATEWAY = 'https://ipfs.io/ipfs';

// Contract ABI for BeeperNFTV3 - MUST match deployed contract functions
const BEEPER_ABI = [
  {
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "name": "uri",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "name": "exists",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    // getTokenData returns: (minter, rarity, shared, farcasterFid, mintTimestamp, ensName, basename, tagline)
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "name": "getTokenData",
    "outputs": [
      { "name": "minter", "type": "address" },
      { "name": "rarity", "type": "uint8" },
      { "name": "shared", "type": "bool" },
      { "name": "farcasterFid", "type": "uint32" },
      { "name": "mintTimestamp", "type": "uint48" },
      { "name": "ensName", "type": "string" },
      { "name": "basename", "type": "string" },
      { "name": "tagline", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "name": "getSvg",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
] as const;

// Rarity tier mapping - matches contract enum Rarity { NODE, VALIDATOR, STAKER, WHALE, OG, GENESIS, ZZZ, FOMO, GM, X402 }
const RARITY_TIERS = [
  'node',      // 0
  'validator', // 1
  'staker',    // 2
  'whale',     // 3
  'og',        // 4
  'genesis',   // 5
  'zzz',       // 6
  'fomo',      // 7
  'gm',        // 8
  'x402',      // 9
];

// Create viem client
const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId: tokenIdStr } = await params;
    const tokenId = BigInt(tokenIdStr);

    // Check if token exists
    let tokenExists = false;
    try {
      tokenExists = await client.readContract({
        address: BEEPER_CONTRACT as `0x${string}`,
        abi: BEEPER_ABI,
        functionName: 'exists',
        args: [tokenId],
      });
    } catch {
      // If exists function doesn't exist, try to get URI
      tokenExists = true;
    }

    if (!tokenExists) {
      return NextResponse.json(
        { error: 'Token does not exist' },
        { status: 404 }
      );
    }

    // Fetch token URI
    let tokenUri = '';
    try {
      tokenUri = await client.readContract({
        address: BEEPER_CONTRACT as `0x${string}`,
        abi: BEEPER_ABI,
        functionName: 'uri',
        args: [tokenId],
      });
    } catch (e) {
      console.error('Error fetching token URI:', e);
    }

    // Fetch token data using getTokenData() - returns all token info at once
    // Returns: (minter, rarity, shared, farcasterFid, mintTimestamp, ensName, basename, tagline)
    let rarity = 'node';
    let rarityTier = 0;
    let owner = '';
    let tokenData: {
      minter: string;
      rarity: number;
      shared: boolean;
      farcasterFid: number;
      mintTimestamp: number;
      ensName: string;
      basename: string;
      tagline: string;
    } | null = null;

    try {
      const result = await client.readContract({
        address: BEEPER_CONTRACT as `0x${string}`,
        abi: BEEPER_ABI,
        functionName: 'getTokenData',
        args: [tokenId],
      });
      
      // Result is a tuple: [minter, rarity, shared, fid, timestamp, ens, basename, tagline]
      tokenData = {
        minter: result[0],
        rarity: Number(result[1]),
        shared: result[2],
        farcasterFid: Number(result[3]),
        mintTimestamp: Number(result[4]),
        ensName: result[5],
        basename: result[6],
        tagline: result[7],
      };
      
      rarityTier = tokenData.rarity;
      rarity = RARITY_TIERS[rarityTier] || 'node';
      owner = tokenData.minter;
      
      console.log(`[NFT API] Token #${tokenId} - Rarity: ${rarity} (tier ${rarityTier}), Minter: ${owner}`);
    } catch (e) {
      console.error('Error fetching token data via getTokenData:', e);
    }

    // Fetch on-chain SVG if available
    let svgData = '';
    try {
      svgData = await client.readContract({
        address: BEEPER_CONTRACT as `0x${string}`,
        abi: BEEPER_ABI,
        functionName: 'getSvg',
        args: [tokenId],
      });
      console.log(`[ERC-4804] ✓ On-chain SVG fetched via getSvg() - ${svgData.length} chars`);
    } catch (e) {
      console.log('getSvg not available or failed:', e);
    }

    // Fetch metadata from tokenURI
    let metadata = null;
    let onChainImage = null;
    
    if (tokenUri) {
      try {
        // Handle different URI formats (ERC-4804 compatible)
        let metadataUrl = tokenUri;
        
        // Priority 1: Handle base64 encoded JSON (fully on-chain)
        if (tokenUri.startsWith('data:application/json;base64,')) {
          console.log('[ERC-4804] Parsing base64 JSON tokenURI');
          const base64Data = tokenUri.replace('data:application/json;base64,', '');
          metadata = JSON.parse(Buffer.from(base64Data, 'base64').toString());
          
          // If image is also base64 encoded SVG, keep it as-is (on-chain)
          if (metadata.image?.startsWith('data:image/svg+xml')) {
            onChainImage = metadata.image;
            console.log('[ERC-4804] On-chain SVG detected in metadata.image');
          }
        }
        // Priority 2: Handle raw JSON data URI
        else if (tokenUri.startsWith('data:application/json,')) {
          console.log('[ERC-4804] Parsing raw JSON tokenURI');
          const jsonData = decodeURIComponent(tokenUri.replace('data:application/json,', ''));
          metadata = JSON.parse(jsonData);
          
          if (metadata.image?.startsWith('data:image/svg+xml')) {
            onChainImage = metadata.image;
          }
        }
        // Priority 3: Handle IPFS URIs
        else if (tokenUri.startsWith('ipfs://')) {
          metadataUrl = tokenUri.replace('ipfs://', `${IPFS_GATEWAY}/`);
        }

        // Fetch from HTTP/IPFS gateway if not already parsed
        if (!metadata && metadataUrl.startsWith('http')) {
          const response = await fetch(metadataUrl, { 
            next: { revalidate: 3600 } // Cache for 1 hour
          });
          if (response.ok) {
            metadata = await response.json();
          }
        }
      } catch (e) {
        console.error('Error fetching/parsing metadata:', e);
      }
    }

    // Build response
    const nftData = {
      tokenId: Number(tokenId),
      owner,
      rarity,
      rarityTier,
      // Include full on-chain data if available
      onChainData: tokenData ? {
        shared: tokenData.shared,
        farcasterFid: tokenData.farcasterFid,
        mintTimestamp: tokenData.mintTimestamp,
        ensName: tokenData.ensName,
        basename: tokenData.basename,
        tagline: tokenData.tagline,
      } : null,
      metadata: metadata || {
        name: `BEEPER NFT #${tokenId}`,
        description: `BEEPER MACHINE // x402 V2 Builder NFT - ${rarity.toUpperCase()} Rarity`,
        image: onChainImage || `https://mcpvot.xyz/social/beeper-dinos/beeper-${rarity}.svg`,
        attributes: [
          { trait_type: 'Rarity', value: rarity.toUpperCase() },
          { trait_type: 'Rarity Tier', value: rarityTier },
          ...(tokenData?.farcasterFid ? [{ trait_type: 'Farcaster FID', value: tokenData.farcasterFid }] : []),
          ...(tokenData?.ensName ? [{ trait_type: 'ENS Name', value: tokenData.ensName }] : []),
          ...(tokenData?.basename ? [{ trait_type: 'Basename', value: tokenData.basename }] : []),
        ],
      },
      svgData: svgData || null,
      onChainImage: onChainImage || null,
      // Construct correct dino SVG URL based on on-chain rarity
      dinoSvgUrl: `https://mcpvot.xyz/social/beeper-dinos/beeper-${rarity}.svg`,
      tokenUri,
      contract: BEEPER_CONTRACT,
      chain: 'base',
      chainId: 8453,
      source: svgData ? 'getSvgData' : onChainImage ? 'tokenURI-base64' : tokenUri?.startsWith('data:') ? 'tokenURI-data' : 'ipfs',
    };

    return NextResponse.json(nftData);

  } catch (error) {
    console.error('Error in NFT API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT data' },
      { status: 500 }
    );
  }
}
