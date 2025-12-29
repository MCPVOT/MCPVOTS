/**
 * ERC-4804 On-Chain Data Fetcher for BEEPER NFTs
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Uses web3:// URLs (EIP-4804) to fetch data directly from Base L2        ║
 * ║  No external APIs needed - 100% on-chain data retrieval                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

// Contract addresses
const BEEPER_CONTRACT = '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9';

// Rarity mapping (matches contract enum)
const RARITY_NAMES = [
  'NODE',      // 0
  'VALIDATOR', // 1
  'STAKER',    // 2
  'WHALE',     // 3
  'OG',        // 4
  'GENESIS',   // 5
  'ZZZ',       // 6
  'FOMO',      // 7
  'GM',        // 8
  'X402',      // 9
] as const;

const RARITY_GLYPHS = ['𒇻', '𒁹', '𒋼', '𒄠', '𒀭', '𒆳', '𒌋', '𒀯', '𒆷', '𒈗'];

// ABI for reading contract data - includes both getSvg and svg function names
const BEEPER_READ_ABI = parseAbi([
  'function uri(uint256 tokenId) view returns (string)',
  'function svg(uint256 tokenId) view returns (string)',
  'function getSvg(uint256 tokenId) view returns (string)',
  'function getTokenData(uint256 tokenId) view returns (address minter, uint8 rarity, uint48 mintTimestamp, uint32 farcasterFid, string ensName, string basename, string tagline)',
  'function exists(uint256 tokenId) view returns (bool)',
  'function tokenCounter() view returns (uint256)',
]);

// Create client
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

export interface BeeperTokenData {
  tokenId: number;
  exists: boolean;
  minter: string;
  rarity: number;
  rarityName: string;
  rarityGlyph: string;
  mintTimestamp: number;
  farcasterFid: number;
  ensName: string;
  basename: string;
  tagline: string;
  svgData?: string;
  metadataUri?: string;
}

/**
 * Fetch token data using ERC-4804 compatible on-chain calls
 * This is the direct contract read method
 */
export async function fetchBeeperTokenData(tokenId: number): Promise<BeeperTokenData | null> {
  try {
    // Try to get token data directly (will fail if doesn't exist)
    // This is more reliable than exists() for ERC-1155
    let tokenData: [string, number, bigint, number, string, string, string];
    
    try {
      tokenData = await publicClient.readContract({
        address: BEEPER_CONTRACT as `0x${string}`,
        abi: BEEPER_READ_ABI,
        functionName: 'getTokenData',
        args: [BigInt(tokenId)],
      }) as [string, number, bigint, number, string, string, string];
    } catch (error) {
      // Token doesn't exist or error reading
      console.log(`[ERC4804] Token ${tokenId} not found or error:`, error);
      return null;
    }

    const [minter, rarity, mintTimestamp, farcasterFid, ensName, basename, tagline] = tokenData;

    return {
      tokenId,
      exists: true,
      minter,
      rarity,
      rarityName: RARITY_NAMES[rarity] || 'UNKNOWN',
      rarityGlyph: RARITY_GLYPHS[rarity] || '?',
      mintTimestamp: Number(mintTimestamp),
      farcasterFid,
      ensName,
      basename,
      tagline,
    };
  } catch (error) {
    console.error(`[ERC4804] Error fetching token ${tokenId}:`, error);
    return null;
  }
}

/**
 * Fetch raw SVG data via ERC-4804 (web3://contract/svg/tokenId)
 * Tries multiple function names for compatibility
 */
export async function fetchBeeperSvg(tokenId: number): Promise<string | null> {
  // Try getSvg first (newer contracts)
  try {
    const svgData = await publicClient.readContract({
      address: BEEPER_CONTRACT as `0x${string}`,
      abi: BEEPER_READ_ABI,
      functionName: 'getSvg',
      args: [BigInt(tokenId)],
    }) as string;

    if (svgData && svgData.includes('<svg')) {
      console.log(`[ERC4804] ✓ SVG fetched via getSvg() - ${svgData.length} chars`);
      return svgData;
    }
  } catch {
    // getSvg not available, try svg()
  }

  // Try svg() (older contracts)
  try {
    const svgData = await publicClient.readContract({
      address: BEEPER_CONTRACT as `0x${string}`,
      abi: BEEPER_READ_ABI,
      functionName: 'svg',
      args: [BigInt(tokenId)],
    }) as string;

    if (svgData && svgData.includes('<svg')) {
      console.log(`[ERC4804] ✓ SVG fetched via svg() - ${svgData.length} chars`);
      return svgData;
    }
  } catch (error) {
    console.error(`[ERC4804] Error fetching SVG for token ${tokenId}:`, error);
  }

  // Fallback: Try parsing from tokenURI
  try {
    const uri = await fetchBeeperMetadataUri(tokenId);
    if (uri) {
      const metadata = parseMetadataUri(uri);
      if (metadata?.image && typeof metadata.image === 'string') {
        // Handle base64 encoded SVG in image field
        if (metadata.image.startsWith('data:image/svg+xml;base64,')) {
          const base64 = metadata.image.replace('data:image/svg+xml;base64,', '');
          const svg = Buffer.from(base64, 'base64').toString('utf-8');
          if (svg.includes('<svg')) {
            console.log(`[ERC4804] ✓ SVG extracted from tokenURI metadata - ${svg.length} chars`);
            return svg;
          }
        }
        // Handle raw SVG data URI
        if (metadata.image.startsWith('data:image/svg+xml,')) {
          const svg = decodeURIComponent(metadata.image.replace('data:image/svg+xml,', ''));
          if (svg.includes('<svg')) {
            console.log(`[ERC4804] ✓ SVG extracted from data URI - ${svg.length} chars`);
            return svg;
          }
        }
      }
    }
  } catch {
    // Fallback also failed
  }

  return null;
}

/**
 * Fetch full metadata URI (data:application/json;base64,...)
 */
export async function fetchBeeperMetadataUri(tokenId: number): Promise<string | null> {
  try {
    const uri = await publicClient.readContract({
      address: BEEPER_CONTRACT as `0x${string}`,
      abi: BEEPER_READ_ABI,
      functionName: 'uri',
      args: [BigInt(tokenId)],
    }) as string;

    return uri;
  } catch (error) {
    console.error(`[ERC4804] Error fetching URI for token ${tokenId}:`, error);
    return null;
  }
}

/**
 * Parse metadata from data URI
 */
export function parseMetadataUri(uri: string): Record<string, unknown> | null {
  try {
    if (!uri.startsWith('data:application/json;base64,')) {
      return null;
    }
    const base64 = uri.replace('data:application/json;base64,', '');
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch (error) {
    console.error('[ERC4804] Error parsing metadata URI:', error);
    return null;
  }
}

/**
 * Get total minted count
 */
export async function getTotalMinted(): Promise<number> {
  try {
    const count = await publicClient.readContract({
      address: BEEPER_CONTRACT as `0x${string}`,
      abi: BEEPER_READ_ABI,
      functionName: 'tokenCounter',
    }) as bigint;

    return Number(count);
  } catch (error) {
    console.error('[ERC4804] Error fetching token counter:', error);
    return 0;
  }
}

/**
 * Build web3:// URL for direct access (EIP-4804)
 */
export function getWeb3Url(tokenId: number, path: 'svg' | 'uri' = 'svg'): string {
  return `web3://${BEEPER_CONTRACT}:8453/${path}/${tokenId}`;
}

/**
 * Get OpenSea URL for token
 */
export function getOpenSeaUrl(tokenId: number): string {
  return `https://opensea.io/assets/base/${BEEPER_CONTRACT}/${tokenId}`;
}

/**
 * Get BaseScan URL for token
 */
export function getBaseScanTokenUrl(tokenId: number): string {
  return `https://basescan.org/token/${BEEPER_CONTRACT}?a=${tokenId}`;
}
