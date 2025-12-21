/**
 * Farcaster Service - FIP-2 Integration for VOT Machine
 * 
 * Features:
 * - Share Button (user-initiated, NOT auto-cast)
 * - Social Feed Widget (read-only)
 * - FIP-2 parent_url for Zapper indexing
 * 
 * MCP Memory ID: 203
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export const WARPLET_CONTRACT = '0x699727F9E01A822EFdcf7333073f0461e5914b4E';
export const VOT_TOKEN = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';
export const BASE_CHAIN_ID = 8453;

// FIP-2 Parent URL formats
export const FIP2_URLS = {
  // Collection-level feed (all VOT Machine NFTs)
  collection: `chain://eip155:${BASE_CHAIN_ID}/erc1155:${WARPLET_CONTRACT}`,
  
  // Token-level feed (specific NFT)
  token: (tokenId: number) => 
    `chain://eip155:${BASE_CHAIN_ID}/erc1155:${WARPLET_CONTRACT}/${tokenId}`,
  
  // ERC-4804 web3:// format (decentralized)
  web3: (tokenId: number) => 
    `web3://${WARPLET_CONTRACT}/${tokenId}`,
};

// =============================================================================
// SHARE ON FARCASTER (User-Initiated)
// =============================================================================

export interface ShareOptions {
  tokenId: number;
  holderName?: string;
  votReceived?: number;
  customMessage?: string;
  rarityTier?: string;
}

/**
 * Generate Warpcast compose URL for sharing
 * Opens in new tab - user controls when/if to post
 */
export function getWarpcastShareUrl(options: ShareOptions): string {
  const { tokenId, holderName, votReceived, customMessage, rarityTier } = options;
  
  // Build engaging share text with FIP-2 threading
  const lines: string[] = [];
  
  // Custom message first if provided
  if (customMessage) {
    lines.push(customMessage);
    lines.push('');
  }
  
  // Main announcement - more engaging
  lines.push(`🎉 Just minted my VOT Machine NFT #${tokenId}!`);
  lines.push('');
  
  // Stats block
  if (votReceived) {
    lines.push(`💰 Received: ${votReceived.toLocaleString()} VOT`);
  }
  
  if (rarityTier) {
    lines.push(`🎲 Rarity: ${rarityTier}`);
  }
  
  if (holderName) {
    lines.push(`👤 Builder: ${holderName}`);
  }
  
  lines.push('');
  lines.push(`🌐 View: mcpvot.xyz/${tokenId}`);
  lines.push('');
  
  // Call to action - encourage interaction
  lines.push('🔥 Get your own: mcpvot.xyz');
  lines.push('');
  lines.push('#VOTMachine #x402 #Base #NFT #MCPVOT');
  
  const text = lines.join('\n');
  const parentUrl = FIP2_URLS.token(tokenId);
  
  // Warpcast compose URL with FIP-2 parent_url for threading
  const params = new URLSearchParams({
    text,
    'embeds[]': `https://mcpvot.xyz/${tokenId}`,
  });
  
  // Add parent_url for FIP-2 threading (enables Zapper-style indexing)
  return `https://warpcast.com/~/compose?${params.toString()}&parentUrl=${encodeURIComponent(parentUrl)}`;
}

/**
 * Open share dialog in new window
 */
export function shareOnFarcaster(options: ShareOptions): void {
  const url = getWarpcastShareUrl(options);
  window.open(url, '_blank', 'width=600,height=700');
}

// =============================================================================
// SOCIAL FEED WIDGET (Read-Only via Neynar)
// =============================================================================

export interface FarcasterCast {
  hash: string;
  author: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl?: string;
  };
  text: string;
  timestamp: string;
  reactions: {
    likes: number;
    recasts: number;
  };
  replies: {
    count: number;
  };
}

export interface SocialFeedResponse {
  casts: FarcasterCast[];
  nextCursor?: string;
  error?: string;
}

/**
 * Fetch casts for a specific NFT token
 * Uses FIP-2 parent_url to find all casts about this token
 */
export async function fetchTokenSocialFeed(
  tokenId: number,
  options?: {
    limit?: number;
    cursor?: string;
  }
): Promise<SocialFeedResponse> {
  const parentUrl = FIP2_URLS.token(tokenId);
  
  try {
    const params = new URLSearchParams({
      parent_url: parentUrl,
      limit: String(options?.limit || 25),
    });
    
    if (options?.cursor) {
      params.set('cursor', options.cursor);
    }
    
    // Call our API route (which has the Neynar key)
    const response = await fetch(`/api/farcaster/feed?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Farcaster] Feed fetch error:', error);
    return {
      casts: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch casts for the entire VOT Machine collection
 */
export async function fetchCollectionSocialFeed(
  options?: {
    limit?: number;
    cursor?: string;
  }
): Promise<SocialFeedResponse> {
  const parentUrl = FIP2_URLS.collection;
  
  try {
    const params = new URLSearchParams({
      parent_url: parentUrl,
      limit: String(options?.limit || 50),
    });
    
    if (options?.cursor) {
      params.set('cursor', options.cursor);
    }
    
    const response = await fetch(`/api/farcaster/feed?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Farcaster] Collection feed error:', error);
    return {
      casts: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// FARCASTER FRAME HELPERS
// =============================================================================

export interface FrameMetadata {
  version: string;
  image: string;
  buttons: FrameButton[];
  postUrl?: string;
  inputText?: string;
}

export interface FrameButton {
  label: string;
  action: 'post' | 'post_redirect' | 'link' | 'mint' | 'tx';
  target?: string;
}

/**
 * Generate Frame meta tags for embedding in HTML
 */
export function generateFrameMetaTags(frame: FrameMetadata): string {
  const tags = [
    `<meta property="fc:frame" content="${frame.version}" />`,
    `<meta property="fc:frame:image" content="${frame.image}" />`,
  ];
  
  frame.buttons.forEach((button, index) => {
    const i = index + 1;
    tags.push(`<meta property="fc:frame:button:${i}" content="${button.label}" />`);
    tags.push(`<meta property="fc:frame:button:${i}:action" content="${button.action}" />`);
    if (button.target) {
      tags.push(`<meta property="fc:frame:button:${i}:target" content="${button.target}" />`);
    }
  });
  
  if (frame.postUrl) {
    tags.push(`<meta property="fc:frame:post_url" content="${frame.postUrl}" />`);
  }
  
  if (frame.inputText) {
    tags.push(`<meta property="fc:frame:input:text" content="${frame.inputText}" />`);
  }
  
  return tags.join('\n    ');
}

/**
 * Generate VOT Machine minting Frame
 */
export function generateMintFrame(tokenId?: number): FrameMetadata {
  const baseUrl = 'https://mcpvot.xyz';
  
  return {
    version: 'vNext',
    image: tokenId 
      ? `${baseUrl}/api/og/${tokenId}`
      : `${baseUrl}/api/og/mint-preview`,
    buttons: [
      {
        label: '🔮 Preview',
        action: 'post',
        target: `${baseUrl}/api/frame/preview`,
      },
      {
        label: '✏️ Customize',
        action: 'post',
        target: `${baseUrl}/api/frame/customize`,
      },
      {
        label: '💎 Mint $1',
        action: 'tx',
        target: `${baseUrl}/api/frame/mint`,
      },
    ],
    postUrl: `${baseUrl}/api/frame/action`,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format timestamp for display
 */
export function formatCastTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// =============================================================================
// EXPORTS
// =============================================================================

const farcasterService = {
  // URLs
  FIP2_URLS,
  WARPLET_CONTRACT,
  VOT_TOKEN,
  BASE_CHAIN_ID,
  
  // Share functions
  getWarpcastShareUrl,
  shareOnFarcaster,
  
  // Feed functions
  fetchTokenSocialFeed,
  fetchCollectionSocialFeed,
  
  // Frame functions
  generateFrameMetaTags,
  generateMintFrame,
  
  // Utilities
  formatCastTime,
  truncateAddress,
};

export default farcasterService;
