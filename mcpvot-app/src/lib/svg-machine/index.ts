/**
 * SVG IPFS ENS Machine - Core Module
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MCPVOT x402 SVG MACHINE                                                  ║
 * ║  ERC-4804 (Web3 URL) | ERC-1155 | EIP-5219 | EIP-7700 Compliant          ║
 * ║                                                                           ║
 * ║  Flow: Asset Detection → Edition Selection → LLM Enhancement →           ║
 * ║        SVG Generation → IPFS Pin → Metadata DB → NFT Mint                ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 * 
 * Standards:
 * - ERC-4804: Web3 URL (web3://contract/path)
 * - ERC-1155: Multi-Token Standard
 * - EIP-5219: Contract Resource Requests
 * - EIP-7700: Cross-chain ENS Resolution
 * - EIP-3668: CCIP-Read (Off-chain data)
 */

// TODO: Implement these modules for full SVG Machine functionality
// export * from './asset-detector';
// export * from './edition-manager';
// export * from './ipfs-pinner';
// export * from './metadata-db';
// export * from './erc4804-resolver';
export * from './types';

// SVG Generator - Dynamic SVG generation from templates
export {
    generateRandomSVG, generateSVG, getTemplate, listTemplates,
    templateRegistry
} from './svg-generator';

// VOT Machine Base Template - Canonical 6-trait NFT template
export {
    VOT_MACHINE_TEMPLATE, countActiveTraits, generateVotMachineBaseSVG, getTierFromTraits, hydrateSVGTemplate, type TraitName,
    type UserTraits,
    type VotMachineSVGInput
} from './templates/vot-machine-base';

// NFT Metadata Service - ERC-1155 compliant metadata generation and IPFS pinning
export {
    NFT_CONFIG, createNFTMetadata, getCollectionMetadata, prepareMint, validateMetadata, type ERC1155Metadata,
    type MintRequest,
    type MintResult
} from './nft-metadata-service';

// Cyberpunk Rank System
export {
    RANK_THRESHOLDS, getRankColor,
    getRankFromHoldings,
    getRankGlow,
    getRankInfo,
    getRankTitle, type CyberpunkRank,
    type RankThreshold
} from './cyberpunk-palette';

// Re-export animation rank system (alternative)
export {
    RANK_CONFIG, calculateRank,
    generateRankBadge, type CyberpunkRank as AnimationRank,
    type RankMetadata
} from './templates/animations';

// Re-export OpenRouter agent for LLM enhancement
export { OPENROUTER_MODELS, OpenRouterAgent } from '../openrouter-agent';

// Re-export OpenRouter service for IPFS content generation
export {
    VOT_MACHINE_TEMPLATE as VOT_MACHINE_CONFIG, formatERC4804URI,
    generateDataURI, generateIPFSContent, type IPFSContentType
} from '../openrouter-service';

// Version
export const SVG_MACHINE_VERSION = '2.3.0';
