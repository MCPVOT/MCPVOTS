/**
 * API Route: GET /api/beeper/wallet/[address]
 * 
 * Fetches all BEEPER NFTs owned by a wallet address
 * Uses ERC-4804 compatible on-chain data fetching
 */

import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const BEEPER_CONTRACT = (process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9').trim() as `0x${string}`;

// Contract ABI for BeeperNFTV3
const BEEPER_ABI = parseAbi([
  'function totalMinted() view returns (uint32)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function uri(uint256 tokenId) view returns (string)',
  'function tokenRarity(uint256 tokenId) view returns (uint8)',
  'function tokenMinter(uint256 tokenId) view returns (address)',
  'function getSvgData(uint256 tokenId) view returns (string)',
]);

// Rarity tier mapping
const RARITY_TIERS = [
  'node', 'validator', 'staker', 'whale', 'og', 
  'genesis', 'zzz', 'fomo', 'gm', 'x402'
];

// Create viem client
const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

interface NFTSummary {
  tokenId: number;
  rarity: string;
  rarityTier: number;
  balance: number;
  imageUrl: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Get total minted to know the range of token IDs
    let totalMinted = 0;
    try {
      totalMinted = await client.readContract({
        address: BEEPER_CONTRACT as `0x${string}`,
        abi: BEEPER_ABI,
        functionName: 'totalMinted',
      });
    } catch (e) {
      console.error('Error fetching totalMinted:', e);
      // Fallback: check first 100 tokens
      totalMinted = 100;
    }

    console.log(`[Wallet API] Checking ${totalMinted} tokens for wallet ${address}`);

    // Check balance for each token ID
    const ownedNFTs: NFTSummary[] = [];
    
    // Batch read for efficiency (check all token IDs)
    for (let tokenId = 1; tokenId <= Number(totalMinted); tokenId++) {
      try {
        const balance = await client.readContract({
          address: BEEPER_CONTRACT as `0x${string}`,
          abi: BEEPER_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`, BigInt(tokenId)],
        });

        if (Number(balance) > 0) {
          // This wallet owns this token - fetch details
          let rarity = 'node';
          let rarityTier = 0;

          try {
            rarityTier = await client.readContract({
              address: BEEPER_CONTRACT as `0x${string}`,
              abi: BEEPER_ABI,
              functionName: 'tokenRarity',
              args: [BigInt(tokenId)],
            });
            rarity = RARITY_TIERS[rarityTier] || 'node';
          } catch {
            // Rarity function may not exist
          }

          ownedNFTs.push({
            tokenId,
            rarity,
            rarityTier,
            balance: Number(balance),
            imageUrl: `/api/beeper/nft/${tokenId}/image`,
          });
        }
      } catch (e) {
        // Token may not exist, continue
        console.log(`Token ${tokenId} check failed:`, e);
      }
    }

    return NextResponse.json({
      success: true,
      address,
      totalOwned: ownedNFTs.length,
      nfts: ownedNFTs,
      contract: BEEPER_CONTRACT,
      chain: 'base',
      chainId: 8453,
    });

  } catch (error) {
    console.error('Error in wallet NFT API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet NFTs' },
      { status: 500 }
    );
  }
}
