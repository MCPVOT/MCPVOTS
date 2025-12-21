/**
 * SVG Machine Types
 * 
 * Comprehensive type definitions for the SVG IPFS ENS Machine
 */

// =============================================================================
// CYBERPUNK RANK SYSTEM
// =============================================================================

export type CyberpunkRank = 
  | 'GHOST'
  | 'NETRUNNER'
  | 'CHROME_JOCKEY'
  | 'EDGE_LORD'
  | 'VOID_WALKER'
  | 'CIRCUIT_BREAKER'
  | 'QUANTUM_GHOST'
  | 'ZERO_DAY'
  | 'SINGULARITY';

// =============================================================================
// EDITION TYPES - Based on Asset Holdings
// =============================================================================

export type EditionType = 
  | 'warplet'      // Warplet NFT holder - premium animated edition
  | 'ethermax'     // MAXX token holder - matrix terminal style
  | 'vot-whale'    // 1M+ VOT holder - legendary edition
  | 'builder'      // Has minted before - loyalty edition
  | 'farcaster'    // Has Farcaster profile - social edition
  | 'base'         // Default edition for everyone
  | 'custom';      // Custom template

export type RarityTier = 
  | 'common'       // Base edition
  | 'uncommon'     // 10K+ VOT or Farcaster user
  | 'rare'         // 100K+ VOT or Builder
  | 'epic'         // 1M+ VOT or MAXX holder
  | 'legendary'    // 10M+ VOT or Warplet holder
  | 'mythic';      // OG (has all: Warplet + MAXX + VOT + Farcaster)

// =============================================================================
// ASSET DETECTION
// =============================================================================

export interface AssetHoldings {
  // Tokens
  vot: {
    balance: bigint;
    balanceFormatted: string;
  };
  maxx: {
    balance: bigint;
    balanceFormatted: string;
  };
  
  // NFTs
  warpletNFT: {
    owned: boolean;
    tokenIds: number[];
    imageUri?: string;
  };
  
  // Builder status
  builderNFT: {
    owned: boolean;
    mintCount: number;
    tier?: 'genesis' | 'pioneer' | 'architect' | 'legend';
  };
  
  // Social
  farcaster: {
    hasFID: boolean;
    fid?: number;
    username?: string;
    pfpUrl?: string;
  };
  
  // ENS/Basename
  identity: {
    ensName?: string;
    basename?: string;
    primaryName?: string;
  };
}

export interface AssetDetectionResult {
  address: string;
  holdings: AssetHoldings;
  qualifiedEditions: EditionType[];
  recommendedEdition: EditionType;
  rarityTier: RarityTier;
  score: number; // 0-100 for rarity calculation
}

// =============================================================================
// SVG GENERATION
// =============================================================================

export interface SVGGenerationConfig {
  edition: EditionType;
  rarity: RarityTier;
  
  // Dimensions
  width: number;
  height: number;
  
  // Visual options
  animated: boolean;
  includeDataRain: boolean;
  includeCircuits: boolean;
  includeGauges: boolean;
  includeScanlines: boolean;
  includeGlitch: boolean;
  
  // Colors (auto-set by edition or custom)
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  
  // User data to embed
  userData: SVGUserData;
  
  // LLM enhancement
  useLLM: boolean;
  llmModel?: 'free' | 'paid';
}

export interface SVGUserData {
  // Identity
  address: string;
  ensName?: string;
  basename?: string;
  nickname?: string;
  bio?: string;
  displayName?: string;
  
  // Avatar
  avatarUri?: string;
  warpletImageUri?: string;
  
  // Social
  farcasterUsername?: string;
  farcasterFid?: number;
  twitter?: string;
  github?: string;
  
  // Token balances (for display)
  votBalance?: string;
  maxxBalance?: string;
  
  // Holdings (detailed balances)
  holdings?: {
    votBalance?: string;
    maxxBalance?: string;
    hasWarplet?: boolean;
    hasFarcaster?: boolean;
    eth?: number;
    vot?: number;
    maxx?: number;
  };
  
  // Rank system
  rank?: CyberpunkRank;
  hasWarplet?: boolean;
  hasFarcaster?: boolean;
  
  // Custom data
  customFields?: Record<string, string>;
}

export interface SVGGenerationResult {
  success: boolean;
  svg: string;
  edition: EditionType;
  rarity: RarityTier;
  llmEnhanced: boolean;
  model?: string;
  tokensUsed?: number;
  error?: string;
}

// =============================================================================
// IPFS & METADATA
// =============================================================================

export interface IPFSPinRequest {
  content: string;
  contentType: 'svg' | 'html' | 'json' | 'metadata';
  metadata: {
    name: string;
    edition: EditionType;
    owner: string;
    tokenId?: string;
    keyvalues?: Record<string, string>;
  };
}

export interface IPFSPinResult {
  success: boolean;
  cid: string;
  ipfsUrl: string;       // ipfs://Qm...
  gatewayUrl: string;    // https://gateway.pinata.cloud/ipfs/Qm...
  web3Url?: string;      // web3://mcpvot.eth/tokenURI/1
  provider: 'mcp' | 'pinata' | 'web3storage' | 'local';
  error?: string;
}

export interface NFTMetadata {
  // ERC-1155 / ERC-721 standard
  name: string;
  description: string;
  image: string;           // ipfs://CID or data:image/svg+xml;base64,...
  external_url: string;    // https://mcpvot.xyz/nft/{tokenId}
  animation_url?: string;  // For animated SVGs
  
  // Attributes (OpenSea standard)
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date';
  }>;
  
  // Properties
  properties: {
    category: 'image' | 'video' | 'audio' | 'html';
    edition: EditionType;
    rarity: RarityTier;
    files: Array<{
      type: string;
      uri: string;
    }>;
  };
  
  // MCPVOT specific
  mcpvot: {
    version: string;
    network: 'base';
    chainId: 8453;
    votBurned: string;
    mintTxHash: string;
    createdAt: string;
    llmEnhanced: boolean;
    llmModel?: string;
  };
}

// =============================================================================
// ERC-4804 WEB3 URL
// =============================================================================

export interface ERC4804Config {
  // Contract addresses
  contractAddress: string;
  resolverAddress?: string;
  
  // ENS names
  ensName?: string;
  basename?: string;
  
  // Resource paths
  basePath: string;
  
  // MIME types
  defaultMimeType: string;
}

export interface Web3URLRequest {
  // Parsed from web3://contract/path
  contractAddress: string;
  path: string;
  query?: Record<string, string>;
  
  // Resolved
  resourceType: 'tokenURI' | 'image' | 'metadata' | 'html' | 'custom';
  tokenId?: string;
}

export interface Web3URLResponse {
  success: boolean;
  mimeType: string;
  content: string | Buffer;
  contentEncoding?: 'base64' | 'utf-8';
  headers?: Record<string, string>;
  error?: string;
}

// =============================================================================
// MINT FLOW
// =============================================================================

export interface MintRequest {
  // User
  address: string;
  
  // Edition (auto-detected or manual)
  edition?: EditionType;
  forceEdition?: boolean;
  
  // Customization
  userData: Partial<SVGUserData>;
  
  // Payment (from x402)
  quoteId: string;
  paymentSignature: string;
  usdcAmount: string;
  
  // Options
  useLLM?: boolean;
  customColors?: Partial<SVGGenerationConfig['colors']>;
}

export interface MintResult {
  success: boolean;
  
  // Token info
  tokenId: string;
  edition: EditionType;
  rarity: RarityTier;
  
  // IPFS
  svgCid: string;
  metadataCid: string;
  ipfsUrl: string;
  
  // Web3 URLs (ERC-4804)
  web3Urls: {
    tokenURI: string;    // web3://mcpvot-builder.eth/tokenURI/{id}
    image: string;       // web3://mcpvot-builder.eth/image/{id}
    metadata: string;    // web3://mcpvot-builder.eth/metadata/{id}
  };
  
  // ENS
  ensContenthash?: string;  // For user to set on their ENS
  
  // Transaction
  mintTxHash: string;
  votBurned: string;
  votSent: string;
  
  // LLM
  llmEnhanced: boolean;
  llmModel?: string;
  
  // Error
  error?: string;
}

// =============================================================================
// EDITION TEMPLATES
// =============================================================================

export interface EditionTemplate {
  id: EditionType;
  name: string;
  description: string;
  
  // Requirements
  requirements: {
    minVOT?: string;
    minMAXX?: string;
    requireWarplet?: boolean;
    requireFarcaster?: boolean;
    requireBuilder?: boolean;
  };
  
  // Visual
  previewUrl: string;
  defaultColors: SVGGenerationConfig['colors'];
  
  // Features
  features: string[];
  animations: string[];
  
  // Rarity multiplier
  rarityBonus: number; // 0-100
}

// =============================================================================
// CONTRACTS
// =============================================================================

export const CONTRACTS = {
  // Tokens
  VOT: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07' as const,
  MAXX: '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467' as const,
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
  WETH: '0x4200000000000000000000000000000000000006' as const,
  
  // Treasury
  TREASURY: '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa' as const,
  
  // NFTs (TBD - deploy ERC-1155)
  BUILDER_NFT: '0x0000000000000000000000000000000000000000' as const,
  WARPLET_NFT: '0x0000000000000000000000000000000000000000' as const, // Get actual address
  
  // ENS
  ENS_REGISTRY: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const,
  ENS_RESOLVER: '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63' as const,
  
  // Base-specific
  BASE_REGISTRAR: '0x03c4738ee98ae44591e1a4a4f3cab6641d95dd9a' as const,
} as const;

export const CHAIN_CONFIG = {
  chainId: 8453,
  name: 'Base',
  rpc: 'https://mainnet.base.org',
  explorer: 'https://basescan.org',
} as const;
