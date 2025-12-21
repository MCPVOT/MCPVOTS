/**
 * Farcaster Social Verification for Extra VOT Bonus
 * 
 * After minting a VOT Machine NFT (MCPVOT Builder Collection), users can:
 * 1. Follow @mcpvot on Farcaster
 * 2. Share their mint (cast about it)
 * 3. Receive extra 10,000 VOT bonus!
 * 
 * Verification Flow:
 * 1. User mints NFT → gets 69,420 VOT
 * 2. User clicks "Claim Bonus" button
 * 3. System verifies follow + share via Neynar
 * 4. If verified, sends extra 10,000 VOT
 * 
 * Requirements:
 * - User must have Farcaster FID linked
 * - Must follow @mcpvot (FID: TBD)
 * - Must have cast containing mint transaction or NFT
 * - One bonus claim per mint transaction
 * 
 * Naming:
 * - VOT Machine = IPFS SVG Website Builder (ERC-4804)
 * - MCPVOT Builder Collection = The NFT collection
 * - x402 VOT Facilitator = Payment layer
 */

import { NeynarAPIClient } from '@neynar/nodejs-sdk';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const SOCIAL_CONFIG = {
  // MCPVOT Farcaster account
  mcpvotFid: process.env.MCPVOT_FARCASTER_FID || '0', // Set this in env
  mcpvotUsername: 'mcpvot',
  
  // Bonus amounts
  followBonus: 5000,      // VOT for following
  shareBonus: 5000,       // VOT for sharing
  totalBonus: 10000,      // Total bonus
  
  // Verification requirements
  requireFollow: true,
  requireShare: true,
  shareMustContain: ['mint', 'VOT', 'MCPVOT', 'vot machine', 'builder', 'nft', 'x402'],
  
  // Time limits
  shareLookbackHours: 24, // Only look at casts from last 24 hours
  claimExpirationHours: 168, // 7 days to claim bonus after mint
};

// ============================================================================
// NEYNAR CLIENT
// ============================================================================

let neynarClient: NeynarAPIClient | null = null;

function getNeynarClient(): NeynarAPIClient {
  if (!neynarClient) {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      throw new Error('NEYNAR_API_KEY not configured');
    }
    neynarClient = new NeynarAPIClient({ apiKey });
  }
  return neynarClient;
}

// ============================================================================
// VERIFICATION TYPES
// ============================================================================

export interface VerificationResult {
  success: boolean;
  followVerified: boolean;
  shareVerified: boolean;
  shareCastHash?: string;
  bonusAmount: number;
  error?: string;
}

export interface ClaimRequest {
  fid: number;
  walletAddress: string;
  mintTransactionHash: string;
  tokenId?: number;
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verify if a user follows @mcpvot
 */
export async function verifyFollow(userFid: number): Promise<boolean> {
  try {
    const client = getNeynarClient();
    const mcpvotFid = parseInt(SOCIAL_CONFIG.mcpvotFid);
    
    if (mcpvotFid === 0) {
      console.warn('[Social] MCPVOT FID not configured, skipping follow verification');
      return true; // Allow if not configured
    }
    
    // Check if user follows MCPVOT
    // Using the user bulk endpoint to check following relationship
    const response = await client.fetchBulkUsers({
      fids: [userFid],
      viewerFid: mcpvotFid,
    });
    
    if (response.users && response.users.length > 0) {
      const user = response.users[0];
      // Check viewer_context for following status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewerContext = (user as any).viewer_context;
      return viewerContext?.following === true;
    }
    
    return false;
  } catch (error) {
    console.error('[Social] Follow verification error:', error);
    return false;
  }
}

/**
 * Verify if user has shared/cast about their mint
 */
export async function verifyShare(
  userFid: number,
  mintTxHash?: string,
  tokenId?: number
): Promise<{ verified: boolean; castHash?: string }> {
  try {
    const client = getNeynarClient();
    
    // Fetch user's recent casts
    const response = await client.fetchFeed({
      feedType: 'filter',
      filterType: 'fids',
      fids: [userFid],
      limit: 50,
    });
    
    if (!response.casts || response.casts.length === 0) {
      return { verified: false };
    }
    
    const lookbackTime = Date.now() - (SOCIAL_CONFIG.shareLookbackHours * 60 * 60 * 1000);
    
    for (const cast of response.casts) {
      // Check if cast is within lookback period
      const castTime = new Date(cast.timestamp).getTime();
      if (castTime < lookbackTime) continue;
      
      const text = cast.text.toLowerCase();
      
      // Check if cast contains required keywords
      const hasKeyword = SOCIAL_CONFIG.shareMustContain.some(
        keyword => text.includes(keyword.toLowerCase())
      );
      
      if (!hasKeyword) continue;
      
      // Bonus: Check for specific transaction hash or token ID
      if (mintTxHash && text.includes(mintTxHash.toLowerCase())) {
        return { verified: true, castHash: cast.hash };
      }
      
      if (tokenId && text.includes(`#${tokenId}`)) {
        return { verified: true, castHash: cast.hash };
      }
      
      // Accept cast with any required keyword
      if (hasKeyword) {
        return { verified: true, castHash: cast.hash };
      }
    }
    
    return { verified: false };
  } catch (error) {
    console.error('[Social] Share verification error:', error);
    return { verified: false };
  }
}

/**
 * Full verification for bonus claim
 */
export async function verifySocialActions(
  request: ClaimRequest
): Promise<VerificationResult> {
  const result: VerificationResult = {
    success: false,
    followVerified: false,
    shareVerified: false,
    bonusAmount: 0,
  };
  
  try {
    // Verify follow
    if (SOCIAL_CONFIG.requireFollow) {
      result.followVerified = await verifyFollow(request.fid);
    } else {
      result.followVerified = true;
    }
    
    // Verify share
    if (SOCIAL_CONFIG.requireShare) {
      const shareResult = await verifyShare(
        request.fid,
        request.mintTransactionHash,
        request.tokenId
      );
      result.shareVerified = shareResult.verified;
      result.shareCastHash = shareResult.castHash;
    } else {
      result.shareVerified = true;
    }
    
    // Calculate bonus
    if (result.followVerified && result.shareVerified) {
      result.success = true;
      result.bonusAmount = SOCIAL_CONFIG.totalBonus;
    } else if (result.followVerified) {
      result.success = true;
      result.bonusAmount = SOCIAL_CONFIG.followBonus;
    } else if (result.shareVerified) {
      result.success = true;
      result.bonusAmount = SOCIAL_CONFIG.shareBonus;
    } else {
      result.error = 'Please follow @mcpvot and share your mint to claim the bonus';
    }
    
    return result;
  } catch (error) {
    console.error('[Social] Verification error:', error);
    return {
      ...result,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Generate share intent URL for Warpcast
 * Creates an engaging, shareable message with FIP-2 parent_url for threading
 */
export function generateShareIntent(params: {
  mintTxHash: string;
  tokenId?: number;
  rarityTier?: string;
  votReceived?: number;
}): string {
  // Build engaging share message
  const lines: string[] = [];
  
  // Main announcement
  if (params.tokenId) {
    lines.push(`🎉 Just minted VOT Machine NFT #${params.tokenId}!`);
  } else {
    lines.push(`🎉 Just minted a VOT Machine NFT on @mcpvot!`);
  }
  lines.push('');
  
  // Stats - make it visual and engaging
  lines.push(`💰 Received: ${params.votReceived?.toLocaleString() || '69,420'} VOT`);
  
  if (params.rarityTier) {
    // Add rarity emoji based on tier
    const rarityEmojis: Record<string, string> = {
      'NODE': '🔷',
      'VALIDATOR': '✅',
      'WHALE': '🐋',
      'OG': '👑',
      'GENESIS': '🌟',
      'ZZZ': '💤',
      'FOMO': '🔥',
      'GM': '☀️',
      'X402': '⚡',
    };
    const emoji = rarityEmojis[params.rarityTier.toUpperCase()] || '�';
    lines.push(`${emoji} Rarity: ${params.rarityTier}`);
  }
  
  lines.push('');
  
  // Transaction link
  lines.push(`🔗 TX: basescan.org/tx/${params.mintTxHash.slice(0, 10)}...`);
  
  // Token page if available
  if (params.tokenId) {
    lines.push(`🌐 View: mcpvot.xyz/${params.tokenId}`);
  }
  
  lines.push('');
  
  // Call to action
  lines.push('🚀 Mint yours: mcpvot.xyz');
  lines.push('');
  
  // Hashtags for discoverability
  lines.push('#MCPVOT #VOT #x402 #Base #NFT');
  
  const text = encodeURIComponent(lines.join('\n'));
  
  // Include embed for rich preview
  const embedUrl = params.tokenId 
    ? `https://mcpvot.xyz/${params.tokenId}` 
    : `https://basescan.org/tx/${params.mintTxHash}`;
  
  return `https://warpcast.com/~/compose?text=${text}&embeds[]=${encodeURIComponent(embedUrl)}`;
}

/**
 * Generate follow intent URL for Warpcast
 */
export function generateFollowIntent(): string {
  return `https://warpcast.com/${SOCIAL_CONFIG.mcpvotUsername}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

const socialVerification = {
  verifyFollow,
  verifyShare,
  verifySocialActions,
  generateShareIntent,
  generateFollowIntent,
  SOCIAL_CONFIG,
};

export default socialVerification;
