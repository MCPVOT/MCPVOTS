/**
 * x402 VOT Facilitator - NFT Minting System
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MCPVOT BUILDER NFT COLLECTION - x402 FACILITATOR                        ║
 * ║                                                                          ║
 * ║  FLOW:                                                                   ║
 * ║  1. User pays $1 USDC via x402 Facilitator                              ║
 * ║  2. Facilitator sends 10,000 VOT bonus to user                          ║
 * ║  3. System buys back VOT from liquidity (amount by spot price)          ║
 * ║  4. Burns 1% of buyback (deflationary)                                  ║
 * ║  5. Mints unique ERC-1155 NFT with SVG site preview                     ║
 * ║  6. User signs ONCE - we pay all gas (gasless)                          ║
 * ║                                                                          ║
 * ║  NFT METADATA:                                                           ║
 * ║  - ENS Name & Records                                                    ║
 * ║  - Base Network Records                                                  ║
 * ║  - Farcaster App ID                                                      ║
 * ║  - SVG Site Preview                                                      ║
 * ║  - Builder Address                                                       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// Contract Addresses (Base Network)
export const CONTRACTS = {
  // VOT Token
  VOT_TOKEN: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
  
  // MAXX Token  
  MAXX_TOKEN: '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467',
  
  // VOT Treasury (Facilitator)
  VOT_TREASURY: '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa',
  
  // USDC on Base
  USDC_BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  
  // Dead address for burns
  BURN_ADDRESS: '0x000000000000000000000000000000000000dEaD',
  
  // Uniswap V3 Router on Base
  UNISWAP_ROUTER: '0x2626664c2603336E57B271c5C0b26F421741e481',
  
  // Base Paymaster (gasless)
  BASE_PAYMASTER: '0x2FAF487A4414Fe77e2327F0bf4AE2a264a776AD2',
  
  // BeeperNFTV3 Contract (ERC-1155 with On-Chain SVG)
  // Deployed Dec 18, 2025 to Base mainnet
  MCPVOT_BUILDER_NFT: '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9',
  
  // ENS Registry (Ethereum - read via Base bridge)
  ENS_REGISTRY: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  
  // Base Name Registry
  BASE_NAME_REGISTRY: '0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5',
  
  // Warplet NFT Collection (for holder verification)
  WARPLET_NFT: '0x235783c2A7B0d1A82bbd5435C8e8c3c38C4A71F3',
} as const;

// x402 Facilitator Configuration
export const X402_CONFIG = {
  // Price in USDC (6 decimals) - $0.25 to match BeeperNFTV2.sol
  MINT_PRICE_USDC: 250_000, // $0.25 USDC
  
  // VOT bonus tokens to send (18 decimals) - 69,420 VOT to match BeeperNFTV2.sol
  VOT_REWARD: '69420000000000000000000', // 69,420 VOT
  
  // Share bonus (FIP-2) - 10,000 VOT
  SHARE_BONUS: '10000000000000000000000', // 10,000 VOT
  
  // Burn percentage (0% - builder-first model, no burns)
  BURN_PERCENTAGE: 0,
  
  // x402 Gateway
  GATEWAY_URL: 'https://x402-proxy.t54.ai',
  
  // Chain ID (Base)
  CHAIN_ID: 8453,
} as const;

// 8-Tier NFT System Configuration
export const NFT_TIERS = {
  MCPVOT: { level: 0, emoji: '🔷', color: '#00d4ff', name: 'MCPVOT' },      // Base tier
  MAXX: { level: 1, emoji: '🟠', color: '#ff9500', name: 'MAXX' },          // Holds MAXX tokens
  Warplet: { level: 2, emoji: '🌀', color: '#00ff88', name: 'WARPLET' },    // Owns Warplet NFT
  ENS: { level: 3, emoji: '🔵', color: '#00d4ff', name: 'ENS' },            // Has .eth name
  Base: { level: 4, emoji: '🔷', color: '#0052ff', name: 'BASE' },          // Has .base.eth
  Farcaster: { level: 5, emoji: '🟣', color: '#00d4ff', name: 'FARCASTER' },// Has FID
  Architek: { level: 6, emoji: '🏛️', color: '#ffd700', name: 'ARCHITEK' },  // 3+ identities
  Oracle: { level: 7, emoji: '🔮', color: '#ff00ff', name: 'ORACLE' },      // ALL verified
} as const;

export type NFTTierName = keyof typeof NFT_TIERS;

// NFT Collection Configuration
export const NFT_CONFIG = {
  name: 'MCPVOT Builder Collection',
  symbol: 'MCPVOT-BUILDER',
  description: 'VOT Machine NFT - Interactive landing page NFTs. Each NFT is a unique AI-generated SVG site viewable at mcpvot.xyz/{tokenId}.',
  maxSupply: 10000,
  currentSupply: 0, // Track via contract
  tiers: NFT_TIERS,
} as const;

// Builder NFT Metadata Structure (matches MCPVOTBuilderNFT.sol)
export interface BuilderNFTMetadata {
  // Core Info
  tokenId: number;
  name: string;
  description: string;
  image: string; // IPFS CID of SVG
  animation_url?: string; // Optional animated version
  external_url: string;
  
  // Builder Info (enhanced with identity verification)
  builder: {
    address: string;
    ensName?: string;
    baseName?: string;
    farcasterFid?: number;
    farcasterUsername?: string;
    isWarpletHolder: boolean;
  };
  
  // ENS Records
  ensRecords?: {
    avatar?: string;
    description?: string;
    url?: string;
    email?: string;
    twitter?: string;
    github?: string;
    discord?: string;
    telegram?: string;
  };
  
  // Base Records
  baseRecords?: {
    basename?: string;
    baseAvatar?: string;
    keywords?: string[];
  };
  
  // NFT Attributes (OpenSea compatible)
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: 'number' | 'boost_percentage' | 'date';
  }>;
  
  // Transaction Info
  mintInfo: {
    timestamp: number;
    transactionHash: string;
    blockNumber: number;
    usdcPaid: string;
    votReceived: string;
    votBurned: string;
    svgCid: string;
    metadataCid: string;
  };
  
  // Properties
  properties: {
    category: 'builder';
    collection: 'mcpvot-builders';
    version: string;
    generator: 'x402-facilitator';
  };
}

// x402 Payment Request
export interface X402PaymentRequest {
  userAddress: string;
  ensName?: string;
  baseName?: string;
  farcasterFid?: number;
  hasWarplet?: boolean;
  hasMAXX?: boolean;
  svgContent: string;
  customMetadata?: Record<string, string>;
}

// x402 Payment Response
export interface X402PaymentResponse {
  success: boolean;
  transactionHash?: string;
  tokenId?: number;
  ipfsCid?: string;
  metadataCid?: string;
  votSent?: string;
  votBurned?: string;
  tier?: NFTTierName;
  error?: string;
}

/**
 * Calculate NFT tier based on identity verifications
 */
export function calculateTier(params: {
  hasENS: boolean;
  hasBaseName: boolean;
  hasFarcaster: boolean;
  hasWarplet: boolean;
  hasMAXX: boolean;
}): NFTTierName {
  const { hasENS, hasBaseName, hasFarcaster, hasWarplet, hasMAXX } = params;
  
  // Count verified identities
  const identityCount = [hasENS, hasBaseName, hasFarcaster, hasWarplet, hasMAXX]
    .filter(Boolean).length;
  
  // Oracle tier: ALL identities verified (5/5)
  if (hasENS && hasBaseName && hasWarplet && hasFarcaster && hasMAXX) {
    return 'Oracle';
  }
  
  // Architek tier: 3+ identity verifications
  if (identityCount >= 3) {
    return 'Architek';
  }
  
  // Farcaster tier
  if (hasFarcaster) {
    return 'Farcaster';
  }
  
  // Base tier: Has .base.eth name
  if (hasBaseName) {
    return 'Base';
  }
  
  // ENS tier: Has .eth name
  if (hasENS) {
    return 'ENS';
  }
  
  // Warplet holder tier
  if (hasWarplet) {
    return 'Warplet';
  }
  
  // MAXX holder tier
  if (hasMAXX) {
    return 'MAXX';
  }
  
  // Default: MCPVOT base tier
  return 'MCPVOT';
}

/**
 * Generate NFT metadata for a builder
 */
export function generateBuilderMetadata(
  tokenId: number,
  builder: BuilderNFTMetadata['builder'],
  svgCid: string,
  metadataCid: string,
  mintTx: {
    hash: string;
    blockNumber: number;
    votSent: string;
    votBurned: string;
  },
  ensRecords?: BuilderNFTMetadata['ensRecords'],
  baseRecords?: BuilderNFTMetadata['baseRecords']
): BuilderNFTMetadata {
  const displayName = builder.ensName || builder.farcasterUsername || 
    `Builder #${tokenId}`;
  
  return {
    tokenId,
    name: `MCPVOT Builder #${tokenId} - ${displayName}`,
    description: `Exclusive MCPVOT Ecosystem Builder NFT for ${displayName}. This NFT grants access to the x402 VOT/MAXX facilitator network and includes a unique SVG site preview.`,
    image: `ipfs://${svgCid}`,
    external_url: builder.ensName 
      ? `https://${builder.ensName}.eth.limo`
      : `https://mcpvot.eth.limo/builder/${tokenId}`,
    
    builder,
    ensRecords,
    baseRecords,
    
    attributes: [
      { trait_type: 'Builder ID', value: tokenId },
      { trait_type: 'Category', value: 'Builder' },
      { trait_type: 'Network', value: 'Base' },
      { trait_type: 'Collection', value: 'MCPVOT Builders' },
      { trait_type: 'VOT Burned', value: mintTx.votBurned },
      { trait_type: 'Mint Date', value: Math.floor(Date.now() / 1000), display_type: 'date' },
      ...(builder.ensName ? [{ trait_type: 'ENS Name', value: builder.ensName }] : []),
      ...(builder.farcasterUsername ? [{ trait_type: 'Farcaster', value: `@${builder.farcasterUsername}` }] : []),
      ...(baseRecords?.basename ? [{ trait_type: 'Basename', value: baseRecords.basename }] : []),
    ],
    
    mintInfo: {
      timestamp: Date.now(),
      transactionHash: mintTx.hash,
      blockNumber: mintTx.blockNumber,
      usdcPaid: X402_CONFIG.MINT_PRICE_USDC.toString(),
      votReceived: mintTx.votSent,
      votBurned: mintTx.votBurned,
      svgCid,
      metadataCid,
    },
    
    properties: {
      category: 'builder',
      collection: 'mcpvot-builders',
      version: '1.0.0',
      generator: 'x402-facilitator',
    },
  };
}

/**
 * Calculate VOT burn amount (1%)
 */
export function calculateBurnAmount(votAmount: bigint): bigint {
  return (votAmount * BigInt(X402_CONFIG.BURN_PERCENTAGE)) / 100n;
}

/**
 * Generate SVG preview thumbnail for NFT
 */
export function generateNFTPreviewSVG(
  builderName: string,
  tokenId: number,
  ensName?: string
): string {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#000000"/>
      <stop offset="100%" stop-color="#001a1a"/>
    </linearGradient>
    <pattern id="circuit" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 5 5 L 45 5 M 5 5 L 5 25 M 45 5 L 45 15" stroke="#00ffcc" stroke-width="0.5" fill="none" opacity="0.1"/>
      <circle cx="5" cy="5" r="2" fill="#00ffcc" opacity="0.2"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="400" fill="url(#bgGrad)"/>
  <rect width="400" height="400" fill="url(#circuit)"/>
  
  <!-- Border -->
  <rect x="10" y="10" width="380" height="380" fill="none" stroke="#00ffcc" stroke-width="2" rx="10">
    <animate attributeName="stroke-opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
  </rect>
  
  <!-- Header -->
  <rect x="20" y="20" width="360" height="50" fill="#000" stroke="#00ffcc" stroke-width="1"/>
  <text x="200" y="52" font-family="'Courier New', monospace" font-size="20" fill="#00ffcc" text-anchor="middle" filter="url(#glow)">
    MCPVOT BUILDER
  </text>
  
  <!-- Token ID -->
  <text x="200" y="100" font-family="'Courier New', monospace" font-size="48" fill="#ff6600" text-anchor="middle" font-weight="bold">
    #${tokenId.toString().padStart(4, '0')}
  </text>
  
  <!-- Builder Name -->
  <rect x="40" y="130" width="320" height="60" fill="#000a0a" stroke="#00ffcc" stroke-width="1"/>
  <text x="200" y="168" font-family="'Courier New', monospace" font-size="18" fill="#ffffff" text-anchor="middle">
    ${builderName.length > 20 ? builderName.slice(0, 17) + '...' : builderName}
  </text>
  
  <!-- ENS Badge -->
  ${ensName ? `
  <rect x="120" y="210" width="160" height="30" fill="#0052ff" rx="5"/>
  <text x="200" y="230" font-family="'Courier New', monospace" font-size="12" fill="#ffffff" text-anchor="middle">
    ${ensName}.eth
  </text>
  ` : ''}
  
  <!-- Stats -->
  <g transform="translate(40, 260)">
    <rect width="150" height="40" fill="#000" stroke="#00ffcc" stroke-width="1"/>
    <text x="75" y="15" font-family="'Courier New', monospace" font-size="10" fill="#00ffcc" text-anchor="middle">VOT RECEIVED</text>
    <text x="75" y="32" font-family="'Courier New', monospace" font-size="14" fill="#00ff00" text-anchor="middle">100,000</text>
  </g>
  <g transform="translate(210, 260)">
    <rect width="150" height="40" fill="#000" stroke="#ff6600" stroke-width="1"/>
    <text x="75" y="15" font-family="'Courier New', monospace" font-size="10" fill="#ff6600" text-anchor="middle">VOT BURNED</text>
    <text x="75" y="32" font-family="'Courier New', monospace" font-size="14" fill="#ff0066" text-anchor="middle">1,000 🔥</text>
  </g>
  
  <!-- Network Badge -->
  <g transform="translate(140, 320)">
    <rect width="120" height="30" fill="#0052ff" rx="15"/>
    <text x="60" y="20" font-family="'Courier New', monospace" font-size="12" fill="#ffffff" text-anchor="middle">
      BASE NETWORK
    </text>
  </g>
  
  <!-- Footer -->
  <text x="200" y="380" font-family="'Courier New', monospace" font-size="10" fill="#00ffcc" text-anchor="middle" opacity="0.6">
    x402 VOT FACILITATOR • ERC-1155
  </text>
  
  <!-- Animated particles -->
  <circle r="2" fill="#00ffcc">
    <animateMotion path="M 50,200 Q 200,100 350,200 Q 200,300 50,200" dur="4s" repeatCount="indefinite"/>
  </circle>
  <circle r="2" fill="#ff6600">
    <animateMotion path="M 350,200 Q 200,300 50,200 Q 200,100 350,200" dur="5s" repeatCount="indefinite"/>
  </circle>
</svg>`;
}

// MCPVOTBuilderNFT ABI (matches contracts/MCPVOTBuilderNFT.sol)
export const MCPVOT_BUILDER_NFT_ABI = [
  // Mint function with full metadata
  {
    name: 'mint',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'farcasterFid', type: 'uint256' },
      { name: 'farcasterUsername', type: 'string' },
      { name: 'votBurned', type: 'uint256' },
      { name: 'ipfsCid', type: 'string' },
      { name: 'svgContent', type: 'string' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  // Get builder data
  {
    name: 'getBuilderData',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'builder', type: 'address' },
          { name: 'ensName', type: 'string' },
          { name: 'baseName', type: 'string' },
          { name: 'farcasterFid', type: 'uint256' },
          { name: 'farcasterUsername', type: 'string' },
          { name: 'votBurned', type: 'uint256' },
          { name: 'ipfsCid', type: 'string' },
          { name: 'svgContent', type: 'string' },
          { name: 'mintTimestamp', type: 'uint256' },
          { name: 'isWarpletHolder', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  // Get builder tier
  {
    name: 'getBuilderTier',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  // Check Warplet holder status
  {
    name: 'isWarpletHolder',
    type: 'function',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  // Get mints by builder
  {
    name: 'getMintsByBuilder',
    type: 'function',
    inputs: [{ name: 'builder', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  // Render SVG
  {
    name: 'renderSVG',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  // URI (OpenSea compatible)
  {
    name: 'uri',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  // Contract URI (collection metadata)
  {
    name: 'contractURI',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'pure',
  },
  // EIP-4804 resolve mode
  {
    name: 'resolveMode',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  // Total supply
  {
    name: 'totalSupply',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  // Owner
  {
    name: 'owner',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

// Legacy ERC-1155 ABI (for compatibility)
export const ERC1155_MINT_ABI = [
  {
    name: 'mint',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'setURI',
    type: 'function',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'uri', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'uri',
    type: 'function',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    name: 'totalSupply',
    type: 'function',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// VOT Token ABI (for transfer and burn)
export const VOT_TOKEN_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

// Export all utilities
const x402VotFacilitator = {
  CONTRACTS,
  X402_CONFIG,
  NFT_CONFIG,
  generateBuilderMetadata,
  calculateBurnAmount,
  generateNFTPreviewSVG,
  MCPVOT_BUILDER_NFT_ABI,
  ERC1155_MINT_ABI,
  VOT_TOKEN_ABI,
};

export default x402VotFacilitator;
