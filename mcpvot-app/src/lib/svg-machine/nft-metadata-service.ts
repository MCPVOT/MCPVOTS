/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  MCPVOT NFT Metadata Service                                              ║
 * ║  ERC-1155 + ERC-4804 + IPFS Integration                                   ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Standards Implemented:                                                   ║
 * ║  - ERC-1155: Multi-Token Standard for NFTs                               ║
 * ║  - ERC-4804: Web3 URL Protocol (web3://contract/path)                    ║
 * ║  - EIP-5219: Token ID Encoding                                            ║
 * ║  - EIP-7700: ENS Cross-Chain Resolver                                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 * Flow: SVG Template → OpenRouter Enhancement → IPFS Pin → Metadata → NFT Mint
 */

import { pinToIPFS } from '../ipfs-service';
import { callOpenRouter, enhanceSVGTemplate, type TemplateCategory } from '../openrouter-service';
import { RANK_CONFIG, calculateRank } from './templates/animations';
import type { SVGUserData as UserData } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const NFT_CONFIG = {
  // Contract addresses on Base
  contracts: {
    mcpvotBuilder: process.env.MCPVOT_BUILDER_NFT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9', // BeeperNFTV3 - ERC-1155 with On-Chain SVG
    votToken: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07', // VOT Token
  },
  
  // Base chain info
  chain: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
  },
  
  // IPFS gateways for fallback resolution
  ipfsGateways: [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
  ],
  
  // Collection metadata
  collection: {
    name: 'MCPVOT Builder Cards',
    symbol: 'MCPVOT-BC',
    description: 'Cyberpunk-themed identity cards for Web3 builders in the MCPVOT ecosystem. Each card reflects your on-chain rank based on VOT, MAXX, and social credentials.',
    externalUrl: 'https://mcpvot.xyz',
    feeRecipient: process.env.FEE_RECIPIENT || '0x...',
    sellerFeeBasisPoints: 250, // 2.5% royalty
  },
};

// ============================================================================
// TYPES
// ============================================================================

export interface MintRequest {
  userData: UserData;
  templateId: string;
  templateCategory: TemplateCategory;
  customPrompt?: string;
  svgContent: string;
}

export interface MintResult {
  success: boolean;
  tokenId?: string;
  metadata?: ERC1155Metadata;
  ipfs: {
    svgCid?: string;
    metadataCid?: string;
    svgUrl?: string;
    metadataUrl?: string;
  };
  erc4804?: {
    web3Url: string;
    resolverUrl: string;
  };
  error?: string;
}

/**
 * ERC-1155 Metadata Standard
 * @see https://eips.ethereum.org/EIPS/eip-1155#metadata
 */
export interface ERC1155Metadata {
  // Required
  name: string;
  description: string;
  image: string; // IPFS URI of SVG
  
  // Recommended
  decimals?: number;
  properties?: Record<string, unknown>;
  
  // OpenSea compatibility
  external_url?: string;
  animation_url?: string;
  background_color?: string;
  
  // MCPVOT specific attributes
  attributes: ERC1155Attribute[];
}

export interface ERC1155Attribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date';
}

// ============================================================================
// RANK & ATTRIBUTES CALCULATOR
// ============================================================================

/**
 * Generate NFT attributes from user data for marketplace display
 */
function generateAttributes(userData: UserData, templateId: string, category: TemplateCategory): ERC1155Attribute[] {
  const rank = calculateRank({
    votBalance: userData.holdings?.votBalance,
    maxxBalance: userData.holdings?.maxxBalance,
    hasWarplet: userData.holdings?.hasWarplet,
    hasFarcaster: userData.holdings?.hasFarcaster,
    hasEns: !!userData.ensName,
    hasBasename: !!userData.basename,
  });
  
  const rankConfig = RANK_CONFIG[rank];
  
  const attributes: ERC1155Attribute[] = [
    // Core identity
    { trait_type: 'Rank', value: rankConfig.name },
    { trait_type: 'Rank Level', value: rankConfig.level, display_type: 'number' },
    { trait_type: 'Template', value: templateId },
    { trait_type: 'Category', value: category },
    
    // Holdings (numeric for filtering)
    { trait_type: 'VOT Balance', value: parseInt(userData.holdings?.votBalance || '0'), display_type: 'number' },
    { trait_type: 'MAXX Balance', value: parseInt(userData.holdings?.maxxBalance || '0'), display_type: 'number' },
    
    // Credentials (boolean as 1/0)
    { trait_type: 'Has Warplet', value: userData.holdings?.hasWarplet ? 'Yes' : 'No' },
    { trait_type: 'Has Farcaster', value: userData.holdings?.hasFarcaster ? 'Yes' : 'No' },
    { trait_type: 'Has ENS', value: userData.ensName ? 'Yes' : 'No' },
    { trait_type: 'Has Basename', value: userData.basename ? 'Yes' : 'No' },
    
    // Timestamps
    { trait_type: 'Minted', value: Math.floor(Date.now() / 1000), display_type: 'date' },
  ];
  
  // Add identity name if available
  if (userData.ensName) {
    attributes.push({ trait_type: 'ENS Name', value: userData.ensName });
  }
  if (userData.basename) {
    attributes.push({ trait_type: 'Basename', value: userData.basename });
  }
  if (userData.displayName) {
    attributes.push({ trait_type: 'Display Name', value: userData.displayName });
  }
  
  return attributes;
}

/**
 * Generate dynamic description using OpenRouter
 */
async function generateDescription(userData: UserData, category: TemplateCategory): Promise<string> {
  try {
    const rank = calculateRank({
      votBalance: userData.holdings?.votBalance,
      maxxBalance: userData.holdings?.maxxBalance,
      hasWarplet: userData.holdings?.hasWarplet,
      hasFarcaster: userData.holdings?.hasFarcaster,
      hasEns: !!userData.ensName,
      hasBasename: !!userData.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    const prompt = `Generate a short, impactful description (max 200 chars) for an NFT profile card.
Builder: ${userData.displayName || userData.ensName || 'Anonymous'}
Rank: ${rankConfig.name} (${rankConfig.title})
Category: ${category}
VOT: ${userData.holdings?.votBalance || 0}

Make it cyberpunk themed and reference their rank.`;

    const result = await callOpenRouter({
      prompt,
      taskType: 'generate_bio',
      templateCategory: category,
    });
    
    if (result.success && result.content) {
      return result.content.slice(0, 300);
    }
  } catch {
    console.warn('[NFT Metadata] Description generation failed, using default');
  }
  
  // Fallback description
  const rank = calculateRank({
    votBalance: userData.holdings?.votBalance,
    maxxBalance: userData.holdings?.maxxBalance,
    hasWarplet: userData.holdings?.hasWarplet,
    hasFarcaster: userData.holdings?.hasFarcaster,
    hasEns: !!userData.ensName,
    hasBasename: !!userData.basename,
  });
  return `${RANK_CONFIG[rank].icon} ${RANK_CONFIG[rank].name} Builder Card | ${userData.displayName || 'Anonymous'} | MCPVOT Ecosystem`;
}

// ============================================================================
// ERC-4804 WEB3 URL GENERATION
// ============================================================================

/**
 * Generate ERC-4804 compliant Web3 URL
 * Format: web3://[contract]:[chainId]/[path]
 * @see https://eips.ethereum.org/EIPS/eip-4804
 */
function generateWeb3Url(contractAddress: string, tokenId: string, chainId: number = 8453): string {
  return `web3://${contractAddress}:${chainId}/tokenURI/${tokenId}`;
}

/**
 * Generate IPFS content-addressed URI
 * Format: ipfs://[CID] or ipfs://[CID]/[path]
 */
function generateIPFSUri(cid: string, path?: string): string {
  return path ? `ipfs://${cid}/${path}` : `ipfs://${cid}`;
}

/**
 * Generate ERC-4804 resolver URL for ENS integration
 * This allows ENS contenthash to resolve to our NFT
 */
function generateResolverUrl(cid: string): string {
  return `ipfs://${cid}`;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Create ERC-1155 metadata for an NFT
 */
export async function createNFTMetadata(
  userData: UserData,
  svgCid: string,
  templateId: string,
  category: TemplateCategory,
  tokenId: string
): Promise<ERC1155Metadata> {
  const description = await generateDescription(userData, category);
  const attributes = generateAttributes(userData, templateId, category);
  const rank = calculateRank({
    votBalance: userData.holdings?.votBalance,
    maxxBalance: userData.holdings?.maxxBalance,
    hasWarplet: userData.holdings?.hasWarplet,
    hasFarcaster: userData.holdings?.hasFarcaster,
    hasEns: !!userData.ensName,
    hasBasename: !!userData.basename,
  });
  const rankConfig = RANK_CONFIG[rank];
  
  return {
    name: `${rankConfig.icon} ${userData.displayName || 'Builder'} | ${category.toUpperCase()} #${tokenId}`,
    description,
    image: generateIPFSUri(svgCid),
    decimals: 0,
    external_url: `${NFT_CONFIG.collection.externalUrl}/nft/${tokenId}`,
    background_color: rankConfig.color.replace('#', ''),
    attributes,
    properties: {
      rank: rank,
      rankLevel: rankConfig.level,
      category,
      templateId,
      minter: userData.address,
      chain: 'Base',
      standard: 'ERC-1155',
      erc4804: true,
    },
  };
}

/**
 * Full mint pipeline: SVG → IPFS → Metadata → Ready for ERC-1155
 */
export async function prepareMint(request: MintRequest): Promise<MintResult> {
  const { userData, templateId, templateCategory, customPrompt, svgContent } = request;
  
  console.log(`[NFT Mint] Starting mint prep for ${userData.displayName || userData.address}`);
  
  try {
    // Step 1: Optionally enhance SVG with OpenRouter
    let finalSvg = svgContent;
    if (customPrompt) {
      console.log('[NFT Mint] Enhancing SVG with OpenRouter...');
      const enhanced = await enhanceSVGTemplate(
        svgContent,
        customPrompt,
        templateCategory,
        {
          ensName: userData.ensName,
          edition: 'base',
        }
      );
      
      if (enhanced.success && enhanced.content) {
        finalSvg = enhanced.content;
        console.log(`[NFT Mint] SVG enhanced with ${enhanced.model}`);
      }
    }
    
    // Step 2: Pin SVG to IPFS
    console.log('[NFT Mint] Pinning SVG to IPFS...');
    const svgPin = await pinToIPFS(finalSvg, {
      name: `mcpvot-${templateId}-${Date.now()}.svg`,
      keyvalues: {
        type: 'svg',
        template: templateId,
        category: templateCategory,
        address: userData.address || '',
      },
    });
    
    if (!svgPin.success || !svgPin.cid) {
      throw new Error(`SVG pin failed: ${svgPin.error}`);
    }
    
    console.log(`[NFT Mint] SVG pinned: ${svgPin.cid}`);
    
    // Step 3: Generate token ID (deterministic from content)
    const tokenId = generateTokenId(userData.address || '0x0', templateId, svgPin.cid);
    
    // Step 4: Create metadata
    console.log('[NFT Mint] Creating ERC-1155 metadata...');
    const metadata = await createNFTMetadata(
      userData,
      svgPin.cid,
      templateId,
      templateCategory,
      tokenId
    );
    
    // Step 5: Pin metadata to IPFS
    console.log('[NFT Mint] Pinning metadata to IPFS...');
    const metadataPin = await pinToIPFS(JSON.stringify(metadata, null, 2), {
      name: `mcpvot-metadata-${tokenId}.json`,
      keyvalues: {
        type: 'metadata',
        tokenId,
        template: templateId,
      },
    });
    
    if (!metadataPin.success || !metadataPin.cid) {
      throw new Error(`Metadata pin failed: ${metadataPin.error}`);
    }
    
    console.log(`[NFT Mint] Metadata pinned: ${metadataPin.cid}`);
    
    // Step 6: Generate ERC-4804 URLs
    const web3Url = generateWeb3Url(NFT_CONFIG.contracts.mcpvotBuilder, tokenId);
    const resolverUrl = generateResolverUrl(metadataPin.cid);
    
    return {
      success: true,
      tokenId,
      metadata,
      ipfs: {
        svgCid: svgPin.cid,
        metadataCid: metadataPin.cid,
        svgUrl: `${NFT_CONFIG.ipfsGateways[0]}${svgPin.cid}`,
        metadataUrl: `${NFT_CONFIG.ipfsGateways[0]}${metadataPin.cid}`,
      },
      erc4804: {
        web3Url,
        resolverUrl,
      },
    };
    
  } catch (error) {
    console.error('[NFT Mint] Error:', error);
    return {
      success: false,
      ipfs: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate deterministic token ID from inputs
 * Uses keccak256-like approach but simplified for client-side
 */
function generateTokenId(address: string, templateId: string, svgCid: string): string {
  // Simple hash-like approach - in production use proper keccak256
  const input = `${address.toLowerCase()}-${templateId}-${svgCid}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Return positive number as string
  return Math.abs(hash).toString();
}

/**
 * Get collection-level metadata (OpenSea storefront)
 */
export function getCollectionMetadata(): Record<string, unknown> {
  return {
    name: NFT_CONFIG.collection.name,
    description: NFT_CONFIG.collection.description,
    image: 'ipfs://QmYourCollectionImage', // Replace with actual CID
    external_link: NFT_CONFIG.collection.externalUrl,
    seller_fee_basis_points: NFT_CONFIG.collection.sellerFeeBasisPoints,
    fee_recipient: NFT_CONFIG.collection.feeRecipient,
  };
}

/**
 * Validate metadata against ERC-1155 standard
 */
export function validateMetadata(metadata: ERC1155Metadata): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!metadata.name) errors.push('Missing required field: name');
  if (!metadata.description) errors.push('Missing required field: description');
  if (!metadata.image) errors.push('Missing required field: image');
  if (!metadata.image.startsWith('ipfs://')) errors.push('Image must be IPFS URI');
  if (!Array.isArray(metadata.attributes)) errors.push('attributes must be an array');
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    NFT_CONFIG, generateAttributes, generateIPFSUri,
    generateResolverUrl, generateTokenId, generateWeb3Url
};

