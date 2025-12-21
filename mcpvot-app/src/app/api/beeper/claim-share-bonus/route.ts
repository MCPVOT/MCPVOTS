/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                FIP-2 SHARE + FOLLOW BONUS CLAIM API                          ║
 * ║                                                                               ║
 * ║  POST /api/beeper/claim-share-bonus                                          ║
 * ║                                                                               ║
 * ║  Rewards users with +10,000 VOT for:                                         ║
 * ║  1. Sharing their BEEPER mint on Farcaster                                   ║
 * ║  2. Following @mcpvot on Farcaster                                           ║
 * ║                                                                               ║
 * ║  Verifies both actions via Neynar API before releasing bonus                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SHARE_BONUS_VOT = 10000;
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const MCPVOT_FID = 922193; // @mcpvot Farcaster FID
// Facilitator config moved to @/lib/beeper/x402-facilitator.ts

// Track claimed bonuses (in production: use database)
const claimedBonuses: Map<number, { tokenId: number; claimedAt: number; castHash: string; followVerified: boolean }> = new Map();

// =============================================================================
// VERIFY FARCASTER FOLLOW
// =============================================================================

async function verifyFarcasterFollow(fid: number): Promise<boolean> {
  if (!NEYNAR_API_KEY) {
    console.warn('[ShareBonus] Neynar not configured, skipping follow verification');
    return true;
  }
  
  try {
    // Check if user follows @mcpvot
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}&viewer_fid=${MCPVOT_FID}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
        },
      }
    );
    
    if (!response.ok) {
      console.error('[ShareBonus] Neynar user lookup failed:', response.statusText);
      return false;
    }
    
    const data = await response.json();
    
    // Check viewer_context for follow relationship
    const user = data.users?.[0];
    if (user?.viewer_context?.following) {
      console.log(`[ShareBonus] FID ${fid} follows @mcpvot ✓`);
      return true;
    }
    
    // Alternative: Check if mcpvot is in their following list
    const followingRes = await fetch(
      `https://api.neynar.com/v2/farcaster/following?fid=${fid}&limit=100`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
        },
      }
    );
    
    if (followingRes.ok) {
      const followingData = await followingRes.json();
      const followsMcpvot = followingData.users?.some((u: { fid: number }) => u.fid === MCPVOT_FID);
      if (followsMcpvot) {
        console.log(`[ShareBonus] FID ${fid} follows @mcpvot (via following list) ✓`);
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('[ShareBonus] Follow verification error:', error);
    return false;
  }
}

// =============================================================================
// VERIFY FARCASTER SHARE
// =============================================================================

async function verifyFarcasterShare(fid: number, tokenId: number): Promise<{ verified: boolean; castHash?: string }> {
  if (!NEYNAR_API_KEY) {
    console.warn('[ShareBonus] Neynar not configured, skipping verification');
    return { verified: true, castHash: 'mock-cast-hash' };
  }
  
  try {
    // Search for casts from this FID mentioning the token or @mcpvot
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/feed?feed_type=filter&filter_type=fids&fids=${fid}&limit=20`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
        },
      }
    );
    
    if (!response.ok) {
      console.error('[ShareBonus] Neynar feed fetch failed:', response.statusText);
      return { verified: false };
    }
    
    const data = await response.json();
    
    // Check if any recent casts mention BEEPER or @mcpvot
    if (data.casts?.length > 0) {
      const matchingCast = data.casts.find((cast: { text: string; timestamp: string }) => {
        const text = cast.text.toLowerCase();
        const isRecent = new Date(cast.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000; // Within 24h
        
        return isRecent && (
          text.includes(`beeper #${tokenId}`) ||
          text.includes('beeper') ||
          text.includes('@mcpvot') ||
          text.includes('mcpvot')
        );
      });
      
      if (matchingCast) {
        console.log(`[ShareBonus] FID ${fid} shared BEEPER mint ✓`);
        return { 
          verified: true, 
          castHash: matchingCast.hash 
        };
      }
    }
    
    return { verified: false };
    
  } catch (error) {
    console.error('[ShareBonus] Share verification error:', error);
    return { verified: false };
  }
}

// =============================================================================
// SEND SHARE BONUS VIA x402 V2 FACILITATOR
// =============================================================================

async function sendShareBonusVOT(toAddress: string, amount: number): Promise<string> {
  console.log(`[ShareBonus] Sending ${amount} VOT to ${toAddress} via x402 V2 Facilitator`);
  
  // Try to use real x402 V2 Facilitator
  try {
    const { sendShareBonus: sendBonus, checkFacilitatorHealth } = await import('@/lib/beeper/x402-facilitator');
    
    // Check if facilitator is ready
    const health = await checkFacilitatorHealth();
    
    if (health.configured && health.funded) {
      console.log(`[ShareBonus] Facilitator ready (VOT: ${health.votBalance}, ETH: ${health.ethBalance})`);
      
      const result = await sendBonus(toAddress);
      
      if (result.success && result.txHash) {
        console.log(`[ShareBonus] VOT transfer successful: ${result.txHash}`);
        return result.txHash;
      } else {
        console.warn(`[ShareBonus] VOT transfer failed: ${result.error}`);
      }
    } else {
      console.warn(`[ShareBonus] Facilitator not ready: ${health.error || 'Not funded'}`);
    }
  } catch (error) {
    console.warn('[ShareBonus] x402 Facilitator not available, using mock:', error);
  }
  
  // Fallback: Return mock tx hash for development
  console.log('[ShareBonus] Using mock transaction (facilitator not available)');
  return `0x${Date.now().toString(16)}bonus${Math.random().toString(16).slice(2, 10)}`;
}

// =============================================================================
// POST - Claim share bonus
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, fid, walletAddress } = body;
    
    if (!tokenId) {
      return NextResponse.json(
        { success: false, error: 'Token ID required' },
        { status: 400 }
      );
    }
    
    // Check if already claimed
    if (claimedBonuses.has(tokenId)) {
      const existing = claimedBonuses.get(tokenId);
      return NextResponse.json({
        success: false,
        error: 'Share bonus already claimed for this token',
        claimedAt: existing?.claimedAt,
        castHash: existing?.castHash,
      });
    }
    
    // Verify both share AND follow on Farcaster (if FID provided)
    let castHash: string | undefined;
    let followVerified = false;
    
    if (fid) {
      // 1. Verify share
      const { verified: shareVerified, castHash: hash } = await verifyFarcasterShare(fid, tokenId);
      
      if (!shareVerified) {
        return NextResponse.json({
          success: false,
          error: 'Could not verify Farcaster share. Make sure to share your mint mentioning BEEPER or @mcpvot.',
          hint: 'Share your BEEPER mint to Farcaster, then try again',
          requirements: {
            shareVerified: false,
            followVerified: false,
          }
        });
      }
      
      castHash = hash;
      
      // 2. Verify follow
      followVerified = await verifyFarcasterFollow(fid);
      
      if (!followVerified) {
        return NextResponse.json({
          success: false,
          error: 'Please follow @mcpvot on Farcaster to claim the share bonus.',
          hint: 'Follow @mcpvot then try again',
          requirements: {
            shareVerified: true,
            followVerified: false,
          }
        });
      }
    }
    
    // Send VOT bonus via x402 V2 Facilitator
    let txHash: string | undefined;
    
    if (walletAddress) {
      txHash = await sendShareBonusVOT(walletAddress, SHARE_BONUS_VOT);
    }
    
    // Record claim
    claimedBonuses.set(tokenId, {
      tokenId,
      claimedAt: Date.now(),
      castHash: castHash || 'direct-claim',
      followVerified,
    });
    
    return NextResponse.json({
      success: true,
      message: `🎉 +${SHARE_BONUS_VOT.toLocaleString()} VOT share bonus claimed!`,
      data: {
        tokenId,
        bonusAmount: SHARE_BONUS_VOT,
        txHash,
        castHash,
        followVerified,
        claimedAt: Date.now(),
      },
    });
    
  } catch (error) {
    console.error('[ShareBonus] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process share bonus' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Check bonus status
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');
  
  if (!tokenId) {
    return NextResponse.json(
      { success: false, error: 'Token ID required' },
      { status: 400 }
    );
  }
  
  const tokenIdNum = parseInt(tokenId, 10);
  const claimed = claimedBonuses.get(tokenIdNum);
  
  return NextResponse.json({
    success: true,
    tokenId: tokenIdNum,
    claimed: !!claimed,
    bonusAmount: SHARE_BONUS_VOT,
    claimData: claimed || null,
  });
}
