/**
 * Social Verification API for Extra VOT Bonus
 * 
 * POST /api/social/verify-bonus
 * 
 * Verifies Farcaster follow + share and sends extra 10,000 VOT bonus
 */

import {
    generateFollowIntent,
    generateShareIntent,
    SOCIAL_CONFIG,
    verifySocialActions,
    type ClaimRequest,
} from '@/lib/social-verification';
import { NextRequest, NextResponse } from 'next/server';

// Track claimed bonuses (in production, use a database)
const claimedBonuses = new Map<string, { timestamp: number; amount: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'verify': {
        const { fid, walletAddress, mintTransactionHash, tokenId } = body as ClaimRequest & { action: string };
        
        if (!fid || !walletAddress || !mintTransactionHash) {
          return NextResponse.json(
            { error: 'Missing required fields: fid, walletAddress, mintTransactionHash' },
            { status: 400 }
          );
        }
        
        // Check if already claimed
        const claimKey = `${walletAddress.toLowerCase()}_${mintTransactionHash.toLowerCase()}`;
        if (claimedBonuses.has(claimKey)) {
          return NextResponse.json({
            success: false,
            error: 'Bonus already claimed for this mint',
            previousClaim: claimedBonuses.get(claimKey),
          });
        }
        
        // Verify social actions
        const result = await verifySocialActions({ fid, walletAddress, mintTransactionHash, tokenId });
        
        if (result.success && result.bonusAmount > 0) {
          // Record the claim
          claimedBonuses.set(claimKey, {
            timestamp: Date.now(),
            amount: result.bonusAmount,
          });
          
          // TODO: Actually send the VOT bonus via smart contract
          // For now, return success and let the frontend handle the transaction
          
          return NextResponse.json({
            success: true,
            verified: true,
            followVerified: result.followVerified,
            shareVerified: result.shareVerified,
            shareCastHash: result.shareCastHash,
            bonusAmount: result.bonusAmount,
            message: `🎉 Congratulations! You earned ${result.bonusAmount.toLocaleString()} bonus VOT!`,
            // Include share intent for users who haven't shared yet
            shareIntent: !result.shareVerified ? generateShareIntent({ mintTxHash: mintTransactionHash, tokenId }) : undefined,
          });
        }
        
        return NextResponse.json({
          success: false,
          verified: false,
          followVerified: result.followVerified,
          shareVerified: result.shareVerified,
          error: result.error || 'Verification incomplete',
          // Include intents for missing actions
          followIntent: !result.followVerified ? generateFollowIntent() : undefined,
          shareIntent: !result.shareVerified ? generateShareIntent({ mintTxHash: mintTransactionHash, tokenId }) : undefined,
          requirements: {
            follow: {
              required: SOCIAL_CONFIG.requireFollow,
              verified: result.followVerified,
              bonus: SOCIAL_CONFIG.followBonus,
            },
            share: {
              required: SOCIAL_CONFIG.requireShare,
              verified: result.shareVerified,
              bonus: SOCIAL_CONFIG.shareBonus,
              keywords: SOCIAL_CONFIG.shareMustContain,
            },
          },
        });
      }
      
      case 'generate-intents': {
        const { mintTransactionHash, tokenId, rarityTier, votReceived } = body;
        
        return NextResponse.json({
          success: true,
          followIntent: generateFollowIntent(),
          shareIntent: generateShareIntent({
            mintTxHash: mintTransactionHash || '0x...',
            tokenId,
            rarityTier,
            votReceived,
          }),
        });
      }
      
      case 'status': {
        const { walletAddress, mintTransactionHash } = body;
        
        if (!walletAddress || !mintTransactionHash) {
          return NextResponse.json(
            { error: 'Missing walletAddress or mintTransactionHash' },
            { status: 400 }
          );
        }
        
        const claimKey = `${walletAddress.toLowerCase()}_${mintTransactionHash.toLowerCase()}`;
        const claim = claimedBonuses.get(claimKey);
        
        return NextResponse.json({
          claimed: !!claim,
          claim: claim || null,
        });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Valid actions: verify, generate-intents, status' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Social Verification API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Social Verification for VOT Bonus',
    version: '1.0.0',
    description: 'Verify Farcaster follow + share to claim extra 10,000 VOT bonus after minting',
    config: {
      followBonus: SOCIAL_CONFIG.followBonus,
      shareBonus: SOCIAL_CONFIG.shareBonus,
      totalBonus: SOCIAL_CONFIG.totalBonus,
      requirements: {
        follow: SOCIAL_CONFIG.requireFollow,
        share: SOCIAL_CONFIG.requireShare,
        shareKeywords: SOCIAL_CONFIG.shareMustContain,
      },
      timeouts: {
        shareLookbackHours: SOCIAL_CONFIG.shareLookbackHours,
        claimExpirationHours: SOCIAL_CONFIG.claimExpirationHours,
      },
    },
    endpoints: {
      'POST /api/social/verify-bonus': {
        actions: {
          verify: {
            description: 'Verify follow + share and claim bonus',
            body: {
              action: 'verify',
              fid: 'number (Farcaster ID)',
              walletAddress: 'string',
              mintTransactionHash: 'string',
              tokenId: 'number (optional)',
            },
          },
          'generate-intents': {
            description: 'Generate Warpcast intent URLs for follow/share',
            body: {
              action: 'generate-intents',
              mintTransactionHash: 'string',
              tokenId: 'number (optional)',
              rarityTier: 'string (optional)',
              votReceived: 'number (optional)',
            },
          },
          status: {
            description: 'Check if bonus was already claimed',
            body: {
              action: 'status',
              walletAddress: 'string',
              mintTransactionHash: 'string',
            },
          },
        },
      },
    },
  });
}
