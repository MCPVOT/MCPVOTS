/**
 * API: Get User's Beeper NFTs
 * 
 * Fetches all BEEPER NFTs owned by a wallet address
 * Returns token IDs, rarity, IPFS CIDs, and mint transaction
 */

import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const BEEPER_CONTRACT = (process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9').trim() as `0x${string}`;

// Simplified ABI for ERC-1155
const BEEPER_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'uri',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// Base client
const baseClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    // Get total supply to know max token ID
    let totalSupply: bigint;
    try {
      totalSupply = await baseClient.readContract({
        address: BEEPER_CONTRACT as `0x${string}`,
        abi: BEEPER_ABI,
        functionName: 'totalSupply',
      });
    } catch {
      totalSupply = BigInt(1000); // Default to checking first 1000 tokens
    }

    const maxTokenId = Number(totalSupply) > 0 ? Number(totalSupply) : 1000;
    const ownedTokens: Array<{
      tokenId: number;
      balance: number;
      uri?: string;
      rarity?: string;
      svgCid?: string;
    }> = [];

    // Check ownership of tokens (batch check in groups of 50)
    const batchSize = 50;
    for (let start = 1; start <= maxTokenId; start += batchSize) {
      const end = Math.min(start + batchSize - 1, maxTokenId);
      
      const balancePromises = [];
      for (let tokenId = start; tokenId <= end; tokenId++) {
        balancePromises.push(
          baseClient.readContract({
            address: BEEPER_CONTRACT as `0x${string}`,
            abi: BEEPER_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`, BigInt(tokenId)],
          }).catch(() => BigInt(0))
        );
      }

      const balances = await Promise.all(balancePromises);
      
      for (let i = 0; i < balances.length; i++) {
        const balance = Number(balances[i]);
        if (balance > 0) {
          const tokenId = start + i;
          ownedTokens.push({
            tokenId,
            balance,
          });
        }
      }

      // Stop early if we've found tokens and no more in recent batch
      if (ownedTokens.length > 0 && balances.every(b => b === BigInt(0))) {
        break;
      }
    }

    // Fetch metadata for owned tokens
    for (const token of ownedTokens) {
      try {
        const uri = await baseClient.readContract({
          address: BEEPER_CONTRACT as `0x${string}`,
          abi: BEEPER_ABI,
          functionName: 'uri',
          args: [BigInt(token.tokenId)],
        });
        
        token.uri = uri;
        
        // Parse IPFS URI to get CID
        if (uri.startsWith('ipfs://')) {
          const cid = uri.replace('ipfs://', '').split('/')[0];
          token.svgCid = cid;
        }
        
        // Try to fetch metadata for rarity
        if (token.svgCid) {
          try {
            const metadataRes = await fetch(`https://ipfs.io/ipfs/${token.svgCid}`);
            if (metadataRes.ok) {
              const metadata = await metadataRes.json();
              token.rarity = metadata.attributes?.find((a: { trait_type: string }) => a.trait_type === 'Rarity')?.value || 'node';
            }
          } catch {
            token.rarity = 'node'; // Default rarity
          }
        }
      } catch (err) {
        console.error(`Failed to fetch URI for token ${token.tokenId}:`, err);
      }
    }

    return NextResponse.json({
      address,
      contract: BEEPER_CONTRACT,
      tokens: ownedTokens,
      count: ownedTokens.length,
    });

  } catch (error) {
    console.error('[Beeper NFTs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}
