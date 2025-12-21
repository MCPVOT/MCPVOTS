/**
 * BEEPER NFT Preview API
 * 
 * Generates a real SVG preview using the actual banner generator
 * Used for showing example NFTs in the mint card
 */

import type { DinoRarity } from '@/lib/beeper/banner-generator';
import { generateBeeperBannerV3 } from '@/lib/beeper/banner-generator-v3';
import { NextRequest, NextResponse } from 'next/server';

// Example users for preview
const PREVIEW_USERS = {
  vitalik: {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    fid: 5650,
    farcasterUsername: 'vitalik',
    farcasterDisplayName: 'Vitalik Buterin',
    ensName: 'vitalik.eth',
    basename: 'vitalik.base.eth',
    tokenId: 1,
  },
  jesse: {
    address: '0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1',
    fid: 99,
    farcasterUsername: 'jessepollak',
    farcasterDisplayName: 'Jesse Pollak',
    ensName: 'jesse.eth',
    basename: 'jesse.base.eth',
    tokenId: 42,
  },
  mcpvot: {
    address: '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa',
    fid: 1396524,
    farcasterUsername: 'mcpvot',
    farcasterDisplayName: 'MCPVOT',
    ensName: 'mcpvot.eth',
    basename: 'mcpvot.base.eth',
    tokenId: 777,
  },
};

const RARITIES: DinoRarity[] = ['node', 'validator', 'staker', 'whale', 'og', 'genesis', 'zzz', 'fomo', 'gm', 'x402'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user') || 'vitalik';
    const rarity = searchParams.get('rarity') || 'node';
    
    // Get user data
    const userData = PREVIEW_USERS[user as keyof typeof PREVIEW_USERS] || PREVIEW_USERS.vitalik;
    
    // Validate rarity
    const validRarity: DinoRarity = RARITIES.includes(rarity as DinoRarity) ? (rarity as DinoRarity) : 'node';
    
    // Generate the real SVG using banner-generator-v3
    const svg = generateBeeperBannerV3(
      {
        address: userData.address,
        fid: userData.fid,
        farcasterUsername: userData.farcasterUsername,
        farcasterDisplayName: userData.farcasterDisplayName,
        ensName: userData.ensName,
        basename: userData.basename,
        tokenId: userData.tokenId,
      },
      {
        rarity: validRarity,
        width: 900,
        height: 240,
      }
    );
    
    // Return as SVG
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
    
  } catch (error) {
    console.error('[Preview API] Error:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
