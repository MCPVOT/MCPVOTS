/**
 * BEEPER NFT User Preview API
 * 
 * Generates a personalized SVG preview for the connected user
 * Shows their actual identity data (ENS, Basename, Farcaster) with predicted tokenId
 */

import type { DinoRarity } from '@/lib/beeper/banner-generator';
import { generateBeeperBannerV3 } from '@/lib/beeper/banner-generator-v3';
import { fetchBeeperUserData } from '@/lib/beeper/identity-service';
import { getNextTokenId } from '@/lib/beeper/x402-facilitator';
import { NextRequest, NextResponse } from 'next/server';

const RARITIES: DinoRarity[] = ['node', 'validator', 'staker', 'whale', 'og', 'genesis', 'zzz', 'fomo', 'gm', 'x402'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const address = searchParams.get('address');
    const rarity = searchParams.get('rarity') || 'node';
    
    if (!fid && !address) {
      return NextResponse.json({ error: 'FID or address required' }, { status: 400 });
    }
    
    // Fetch user data
    const fidNumber = fid ? parseInt(fid, 10) : 0;
    const userData = await fetchBeeperUserData(fidNumber, address || undefined);
    
    if (!userData) {
      return NextResponse.json({ error: 'Could not fetch user data' }, { status: 404 });
    }
    
    // Get predicted tokenId from contract
    let predictedTokenId = 0;
    try {
      predictedTokenId = await getNextTokenId();
    } catch (e) {
      console.warn('[UserPreview] Could not get predicted tokenId:', e);
    }
    
    // Validate rarity
    const validRarity: DinoRarity = RARITIES.includes(rarity as DinoRarity) 
      ? (rarity as DinoRarity) 
      : 'node';
    
    // Generate the real SVG using banner-generator-v3
    const svg = generateBeeperBannerV3(
      {
        address: userData.address,
        fid: userData.fid,
        farcasterUsername: userData.farcasterUsername,
        farcasterDisplayName: userData.farcasterDisplayName,
        ensName: userData.ensName,
        basename: userData.basename,
        tokenId: predictedTokenId,
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
        // Short cache since tokenId can change
        'Cache-Control': 'public, max-age=30',
      },
    });
    
  } catch (error) {
    console.error('[UserPreview API] Error:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
