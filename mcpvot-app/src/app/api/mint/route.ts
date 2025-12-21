/**
 * NFT Mint API Route
 * 
 * Flow: SVG Generation → IPFS Pin → Metadata → IPFS Pin → Contract Mint
 * 
 * Supports:
 * - x402 payment verification
 * - ERC-1155 compliant metadata
 * - IPFS pinning via Pinata/Web3.Storage
 * - ERC-4804 content-addressed URIs
 */

import { prepareMint, type MintRequest, type MintResult } from '@/lib/svg-machine/nft-metadata-service';
import { generateSVG } from '@/lib/svg-machine/svg-generator';
import type { SVGUserData as UserData } from '@/lib/svg-machine/types';
import { ethers, InterfaceAbi } from 'ethers';
import { NextResponse } from 'next/server';

const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const RECIPIENT_ADDRESS = '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa';
const MINT_PRICE_USDC = 2000000; // 2 USDC with 6 decimals
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const NFT_CONTRACT_ABI: InterfaceAbi = [
  'function mint(address to, uint256 id, uint256 amount, bytes data) external',
  'function mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data) external',
  'function uri(uint256 id) external view returns (string)',
  'function setURI(uint256 id, string uri) external',
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
];

// GET: Return payment requirements for x402
export async function GET() {
  const paymentRequirements = {
    x402Version: 1,
    accepts: [{
      scheme: 'exact',
      network: 'base',
      maxAmountRequired: MINT_PRICE_USDC.toString(),
      resource: '/api/mint',
      description: 'Mint MCPVOT Builder NFT - SVG Dashboard',
      payTo: RECIPIENT_ADDRESS,
      asset: USDC_CONTRACT_ADDRESS,
    }]
  };

  return NextResponse.json(paymentRequirements);
}

// POST: Process mint request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      userAddress, 
      templateId = 'mcpvot-dashboard',
      templateCategory = 'mcpvot',
      userData,
      customPrompt,
      skipMint = false // For testing pipeline without contract interaction
    } = body;

    if (!userAddress) {
      return NextResponse.json(
        { error: 'userAddress is required' },
        { status: 400 }
      );
    }

    // Step 1: Prepare user data for SVG generation
    const svgUserData: UserData = userData || {
      address: userAddress,
      ensName: null,
      basename: null,
      farcasterUsername: null,
      farcasterFid: null,
      holdings: {
        vot: 0,
        maxx: 0,
        eth: 0,
      },
      rank: 'GHOST',
      level: 1,
    };

    // Step 2: Generate SVG
    let svgContent: string;
    try {
      svgContent = await generateSVG(templateId, svgUserData);
    } catch {
      // Fallback to a simple SVG if generator fails
      svgContent = generateFallbackSVG(svgUserData);
    }

    // Step 3: Build mint request
    const mintRequest: MintRequest = {
      userData: {
        address: svgUserData.address,
        ensName: svgUserData.ensName || undefined,
        basename: svgUserData.basename || undefined,
        farcasterUsername: svgUserData.farcasterUsername || undefined,
        displayName: svgUserData.ensName || svgUserData.basename || 
          `${svgUserData.address.slice(0, 6)}...${svgUserData.address.slice(-4)}`,
        rank: svgUserData.rank || 'GHOST',
        holdings: {
          vot: svgUserData.holdings?.vot || 0,
          maxx: svgUserData.holdings?.maxx || 0,
          eth: svgUserData.holdings?.eth || 0,
        },
      },
      templateId,
      templateCategory,
      svgContent,
      customPrompt,
    };

    // Step 4: Run full mint pipeline (SVG → IPFS → Metadata → IPFS)
    const pipelineResult: MintResult = await prepareMint(mintRequest);

    if (!pipelineResult.success) {
      return NextResponse.json(
        { 
          error: 'Mint pipeline failed', 
          details: pipelineResult.error 
        },
        { status: 500 }
      );
    }

    // Step 5: If skipMint, return pipeline result without contract interaction
    if (skipMint) {
      return NextResponse.json({
        success: true,
        pipeline: pipelineResult,
        message: 'Pipeline completed (skip mint mode)',
      });
    }

    // Step 6: Mint NFT on-chain
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const signer = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY!, provider);
    const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

    // Use token ID from pipeline
    const tokenId = BigInt(pipelineResult.tokenId || '0');

    // Mint with metadata URI
    const metadataURI = pipelineResult.ipfs?.metadataUrl || `ipfs://${pipelineResult.ipfs?.metadataCid}`;
    const tx = await nftContract.mint(
      userAddress,
      tokenId,
      1, // amount
      ethers.toUtf8Bytes(metadataURI) // data contains metadata URI
    );
    
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      tokenId: tokenId.toString(),
      transactionHash: receipt.hash,
      pipeline: {
        svgCID: pipelineResult.ipfs?.svgCid,
        metadataCID: pipelineResult.ipfs?.metadataCid,
        erc4804URI: pipelineResult.erc4804?.web3Url,
      },
      metadata: pipelineResult.metadata,
    });

  } catch (error: unknown) {
    console.error('[Mint API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Fallback SVG generator
function generateFallbackSVG(userData: UserData): string {
  const displayName = userData.ensName || userData.basename || 
    `${userData.address.slice(0, 6)}...${userData.address.slice(-4)}`;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00ff88"/>
      <stop offset="100%" style="stop-color:#00d4ff"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="url(#accent)" stroke-width="2"/>
  <text x="200" y="180" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="24">MCPVOT</text>
  <text x="200" y="220" text-anchor="middle" fill="url(#accent)" font-family="monospace" font-size="16">${displayName}</text>
  <text x="200" y="260" text-anchor="middle" fill="#666666" font-family="monospace" font-size="12">Rank: ${userData.rank || 'GHOST'}</text>
  <text x="200" y="350" text-anchor="middle" fill="#333333" font-family="monospace" font-size="10">Builder NFT</text>
</svg>`;
}
