/**
 * MCPVOT Ecosystem Constants
 * 
 * Centralized configuration for the x402 VOT ecosystem.
 * All contract addresses, URLs, and configuration values.
 */

// =============================================================================
// CONTRACT ADDRESSES (Base Mainnet)
// =============================================================================

export const CONTRACTS = {
  /** VOT Token - Clanker deployed 2025-11-11 */
  VOT: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07' as const,
  
  /** MAXX Token */
  MAXX: '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467' as const,
  
  /** Treasury/Creator wallet */
  TREASURY: '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa' as const,
  
  /** Clanker Factory (Base) */
  CLANKER_FACTORY: '0x5c93F69DdD9c53667c52eBc434C5134fe5D7CB8b' as const,
  
  /** Clanker LP Locker */
  CLANKER_LOCKER: '0x5c93F69DdD9c53667c52eBc434C5134fe5D7CB8b' as const,
} as const;

// =============================================================================
// ECOSYSTEM URLS
// =============================================================================

export const URLS = {
  /** Main website */
  WEBSITE: 'https://mcpvot.xyz',
  
  /** Farcaster Mini-App */
  FARCASTER_MINIAPP: 'https://farcaster.xyz/miniapps/FAiT-TnY9rUm/x402vot',
  
  /** Farcaster Mini-App ID */
  FARCASTER_MINIAPP_ID: 'FAiT-TnY9rUm',
  
  /** Warpcast profile */
  WARPCAST: 'https://warpcast.com/mcpvot',
  
  /** DexScreener */
  DEXSCREENER: 'https://dexscreener.com/base/0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
  
  /** BaseScan VOT */
  BASESCAN_VOT: 'https://basescan.org/token/0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
  
  /** Pinata Gateway (default) */
  PINATA_GATEWAY: 'https://ipfs.io/ipfs/',
} as const;

// =============================================================================
// VOT MACHINE RANKS & TIERS
// =============================================================================

export const VOT_RANKS = {
  SINGULARITY: { min: 1_000_000, color: '#FFD700', emoji: '🌟' },
  ARCHITECT: { min: 500_000, color: '#E5E4E2', emoji: '🏛️' },
  VOID_WALKER: { min: 100_000, color: '#9400D3', emoji: '🌀' },
  CIPHER: { min: 50_000, color: '#00CED1', emoji: '🔐' },
  CIRCUIT: { min: 10_000, color: '#00FF00', emoji: '⚡' },
  NETRUNNER: { min: 1_000, color: '#00BFFF', emoji: '🏃' },
  GHOST: { min: 0, color: '#808080', emoji: '👻' },
} as const;

export type VOTRank = keyof typeof VOT_RANKS;

/**
 * Get rank based on VOT balance
 */
export function getVOTRank(balance: number): VOTRank {
  if (balance >= VOT_RANKS.SINGULARITY.min) return 'SINGULARITY';
  if (balance >= VOT_RANKS.ARCHITECT.min) return 'ARCHITECT';
  if (balance >= VOT_RANKS.VOID_WALKER.min) return 'VOID_WALKER';
  if (balance >= VOT_RANKS.CIPHER.min) return 'CIPHER';
  if (balance >= VOT_RANKS.CIRCUIT.min) return 'CIRCUIT';
  if (balance >= VOT_RANKS.NETRUNNER.min) return 'NETRUNNER';
  return 'GHOST';
}

// =============================================================================
// CLANKER TOKENOMICS
// =============================================================================

export const CLANKER_CONFIG = {
  /** Total supply */
  TOTAL_SUPPLY: 100_000_000_000,
  
  /** LP allocation (70%) */
  LP_ALLOCATION: 0.70,
  
  /** Vault allocation (30%) */
  VAULT_ALLOCATION: 0.30,
  
  /** Creator fee */
  CREATOR_FEE: 0.01,
  
  /** Clanker fee */
  CLANKER_FEE: 0.002,
  
  /** Total fee */
  TOTAL_FEE: 0.012,
  
  /** Vault unlock date */
  VAULT_UNLOCK: new Date('2026-05-17T00:00:00Z'),
  
  /** Deployment date */
  DEPLOYED_AT: new Date('2025-11-11T00:00:00Z'),
  
  /** Deployer Farcaster */
  DEPLOYER_FARCASTER: '@mcpvot',
  
  /** Deployer FID */
  DEPLOYER_FID: 950234,
} as const;

// =============================================================================
// AI MODEL CONFIG
// =============================================================================

export const AI_MODELS = {
  /** Primary model - FREE with 256K context */
  PRIMARY: 'kwaipilot/kat-coder-pro:free',
  
  /** Fast fallback */
  FAST: 'x-ai/grok-4.1-fast:free',
  
  /** Quality fallback */
  QUALITY: 'nvidia/llama-3.1-nemotron-ultra-253b:free',
  
  /** All free models in fallback order */
  FREE_CHAIN: [
    'kwaipilot/kat-coder-pro:free',
    'x-ai/grok-4.1-fast:free',
    'nvidia/llama-3.1-nemotron-ultra-253b:free',
  ],
} as const;

// =============================================================================
// API VERSION
// =============================================================================

export const API_VERSION = '2.0.0';

// =============================================================================
// EXPORT ECOSYSTEM INFO (for API responses)
// =============================================================================

export const ECOSYSTEM_INFO = {
  vot: CONTRACTS.VOT,
  maxx: CONTRACTS.MAXX,
  treasury: CONTRACTS.TREASURY,
  miniApp: URLS.FARCASTER_MINIAPP,
} as const;
