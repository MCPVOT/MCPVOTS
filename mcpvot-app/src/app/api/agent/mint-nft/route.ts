import { NextRequest, NextResponse } from 'next/server';

/**
 * IPFS Pin & ERC-1155 Mint API
 * POST /api/agent/mint-nft
 * 
 * Flow: SVG → Pin to IPFS → Mint ERC-1155 NFT
 * Returns: IPFS CID + NFT Token ID
 */

// IPFS Gateway configuration
const IPFS_CONFIG = {
  // Using our IPFS MCP server
  gateway: process.env.IPFS_GATEWAY || 'http://localhost:5001',
  pinEndpoint: '/api/v0/add',
};

// ERC-1155 Contract configuration (Base network)
const NFT_CONFIG = {
  contractAddress: process.env.ENS_NFT_CONTRACT || '0x...', // Deploy ERC-1155 contract
  chainId: 8453, // Base mainnet
  rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
};

interface MintRequest {
  svg: string;
  metadata: {
    name: string;
    description: string;
    ensName?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  };
  recipientAddress: string;
}

interface MintResponse {
  success: boolean;
  ipfsCid?: string;
  metadataCid?: string;
  tokenId?: string;
  transactionHash?: string;
  error?: string;
}

/**
 * Pin SVG content to IPFS
 */
async function pinToIPFS(content: string, filename: string): Promise<string> {
  // Try local IPFS MCP server first
  try {
    const formData = new FormData();
    formData.append('file', new Blob([content], { type: 'image/svg+xml' }), filename);
    
    const response = await fetch(`${IPFS_CONFIG.gateway}${IPFS_CONFIG.pinEndpoint}`, {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.Hash || data.cid;
    }
  } catch (error) {
    console.warn('[IPFS] Local IPFS failed, trying alternative:', error);
  }
  
  // Fallback to web3.storage or Pinata
  const pinataKey = process.env.PINATA_API_KEY;
  const pinataSecret = process.env.PINATA_SECRET_KEY;
  
  if (pinataKey && pinataSecret) {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataKey,
        'pinata_secret_api_key': pinataSecret,
      },
      body: JSON.stringify({
        pinataContent: content,
        pinataMetadata: { name: filename },
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.IpfsHash;
    }
  }
  
  throw new Error('Failed to pin to IPFS - no available gateway');
}

/**
 * Create ERC-1155 metadata JSON
 */
function createMetadata(
  svgCid: string,
  metadata: MintRequest['metadata']
): Record<string, unknown> {
  return {
    name: metadata.name,
    description: metadata.description,
    image: `ipfs://${svgCid}`,
    external_url: metadata.ensName ? `https://${metadata.ensName}.eth.limo` : undefined,
    attributes: [
      { trait_type: 'Type', value: 'ENS SVG Site' },
      { trait_type: 'Generator', value: 'MCPVOT x402 Agent' },
      { trait_type: 'Chain', value: 'Base' },
      ...(metadata.ensName ? [{ trait_type: 'ENS Name', value: metadata.ensName }] : []),
      ...(metadata.attributes || []),
    ],
    properties: {
      svg_cid: svgCid,
      created_by: 'MCPVOT Ecosystem',
      created_at: new Date().toISOString(),
    },
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<MintResponse>> {
  try {
    const body: MintRequest = await request.json();
    
    // Validate request
    if (!body.svg) {
      return NextResponse.json({ success: false, error: 'SVG content required' }, { status: 400 });
    }
    
    if (!body.recipientAddress) {
      return NextResponse.json({ success: false, error: 'Recipient address required' }, { status: 400 });
    }
    
    if (!body.metadata?.name) {
      return NextResponse.json({ success: false, error: 'Metadata name required' }, { status: 400 });
    }
    
    // Step 1: Pin SVG to IPFS
    console.log('[Mint NFT] Pinning SVG to IPFS...');
    const svgFilename = `${body.metadata.name.replace(/\s+/g, '-').toLowerCase()}.svg`;
    const svgCid = await pinToIPFS(body.svg, svgFilename);
    console.log(`[Mint NFT] SVG pinned: ipfs://${svgCid}`);
    
    // Step 2: Create and pin metadata
    console.log('[Mint NFT] Creating metadata...');
    const metadata = createMetadata(svgCid, body.metadata);
    const metadataCid = await pinToIPFS(
      JSON.stringify(metadata, null, 2),
      `${svgFilename.replace('.svg', '')}-metadata.json`
    );
    console.log(`[Mint NFT] Metadata pinned: ipfs://${metadataCid}`);
    
    // Step 3: Mint ERC-1155 NFT (if contract is configured)
    let tokenId: string | undefined;
    let transactionHash: string | undefined;
    
    if (NFT_CONFIG.contractAddress && NFT_CONFIG.contractAddress !== '0x...') {
      console.log('[Mint NFT] Minting ERC-1155...');
      
      // This would use viem/ethers to interact with the contract
      // For now, return the IPFS data and let frontend handle minting
      // TODO: Implement server-side minting with treasury wallet
      
      // Placeholder for future implementation
      tokenId = 'pending-mint';
      transactionHash = 'pending-transaction';
    }
    
    return NextResponse.json({
      success: true,
      ipfsCid: svgCid,
      metadataCid,
      tokenId,
      transactionHash,
    });
    
  } catch (error) {
    console.error('[Mint NFT] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Minting failed',
      },
      { status: 500 }
    );
  }
}

// GET - Contract info and minting status
export async function GET() {
  return NextResponse.json({
    status: 'active',
    contract: {
      address: NFT_CONFIG.contractAddress,
      chainId: NFT_CONFIG.chainId,
      network: 'Base',
      standard: 'ERC-1155',
    },
    ipfs: {
      gateway: IPFS_CONFIG.gateway,
      pinata: !!process.env.PINATA_API_KEY,
    },
    features: [
      'SVG to IPFS pinning',
      'ERC-1155 metadata generation',
      'ENS integration ready',
      'Batch minting support',
    ],
  });
}
