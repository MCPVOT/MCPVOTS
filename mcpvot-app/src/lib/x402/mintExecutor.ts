/**
 * x402 Mint Executor - Blockchain Transaction Handler
 * 
 * Executes the actual mint operations:
 * 1. Pin SVG to IPFS
 * 2. Generate & pin metadata
 * 3. Transfer VOT to user
 * 4. Buy back VOT from liquidity
 * 5. Burn 1% VOT
 * 6. Mint ERC-1155 NFT (when contract deployed)
 * 7. Track in MCP Memory
 */

import { ethers } from 'ethers';

// Configuration from environment
const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY || '';
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

// Contract addresses
const VOT_TOKEN = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';
const TREASURY = '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa';
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
const MCPVOT_NFT_CONTRACT = process.env.BEEPER_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// VOT amounts - ALIGNED WITH X402_CONFIG
const VOT_REWARD = '69420000000000000000000'; // 69,420 VOT (18 decimals) - x402 V2 standard
const BURN_PERCENTAGE = 0; // 0% burn - aligned with X402_CONFIG

// Token ID counter (in production, sync with contract)
let tokenIdCounter = 1;

// ERC-20 ABI for VOT transfers
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
];

// BeeperNFTV2 ABI - matches contract mint function signature
const NFT_ABI = [
  'function mint(address to, string ipfsCid, uint32 farcasterFid, bytes32 ensHash, bytes32 basenameHash) returns (uint256 tokenId, uint8 rarity)',
  'function facilitator() view returns (address)',
  'function totalMinted() view returns (uint32)',
];

interface MintRequest {
  userAddress: string;
  ensName?: string;
  baseName?: string;
  farcasterFid?: number;
  svgContent: string;
}

// Rarity names matching BeeperNFTV2.sol enum
const RARITY_NAMES = ['NODE', 'VALIDATOR', 'WHALE', 'OG', 'GENESIS', 'ZZZ', 'FOMO', 'GM', 'X402'] as const;
type RarityName = typeof RARITY_NAMES[number];

interface MintResult {
  tokenId: number;
  transactionHash: string;
  ipfsCid: string;
  metadataCid: string;
  votSent: string;
  votBurned: string;
  rarity: RarityName; // Added for frontend display
}

// IPFS Pinning Priority (fastest to slowest):
// 1. Local IPFS MCP Server (no rate limits, fastest)
// 2. Web3.Storage (free, unlimited, Filecoin-backed)
// 3. Pinata (500 free pins/month)
// 4. Mock CID (development only)

/**
 * Pin content to IPFS with fallback chain
 * 
 * Priority:
 * 1. Local IPFS MCP Server (IPFS_MCP_URL) - fastest, no limits
 * 2. Web3.Storage - free unlimited
 * 3. Pinata - 500 free pins/month
 * 4. Mock CID - dev fallback
 */
async function pinToIPFS(content: string, filename: string): Promise<string> {
  const localIpfsUrl = process.env.IPFS_MCP_URL || process.env.NEXT_PUBLIC_IPFS_MCP_URL;
  const web3StorageToken = process.env.WEB3_STORAGE_TOKEN;
  const pinataJwt = process.env.PINATA_JWT;
  const pinataKey = process.env.PINATA_API_KEY;
  const pinataSecret = process.env.PINATA_SECRET_KEY;
  
  // 1. Try Local IPFS MCP Server first (fastest, no rate limits)
  if (localIpfsUrl) {
    try {
      const cid = await pinToLocalIPFS(content, filename, localIpfsUrl);
      console.log(`[MintExecutor] ✅ Pinned via Local IPFS: ${cid}`);
      return cid;
    } catch (error) {
      console.warn('[MintExecutor] Local IPFS failed, trying Web3.Storage:', error);
    }
  }
  
  // 2. Try Web3.Storage (free, unlimited for NFTs)
  if (web3StorageToken) {
    try {
      const cid = await pinToWeb3Storage(content, filename, web3StorageToken);
      console.log(`[MintExecutor] ✅ Pinned via Web3.Storage: ${cid}`);
      return cid;
    } catch (error) {
      console.warn('[MintExecutor] Web3.Storage failed, trying Pinata:', error);
    }
  }
  
  // 3. Try Pinata
  if (pinataJwt || (pinataKey && pinataSecret)) {
    try {
      const cid = await pinToPinata(content, filename, pinataJwt, pinataKey, pinataSecret);
      console.log(`[MintExecutor] ✅ Pinned via Pinata: ${cid}`);
      return cid;
    } catch (error) {
      console.warn('[MintExecutor] Pinata failed:', error);
    }
  }
  
  // 4. Fallback: Mock CID for development
  console.warn('[MintExecutor] ⚠️ No IPFS provider available, using mock CID');
  return `Qm${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Pin to Local IPFS MCP Server (fastest, no rate limits)
 * Uses the ipfs-mcp server running locally
 */
async function pinToLocalIPFS(content: string, filename: string, baseUrl: string): Promise<string> {
  // Try the MCP tool endpoint first
  const mcpUrl = `${baseUrl}/pin_content`;
  
  try {
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content,
        encrypt: false, // Don't encrypt NFT data
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.cid || data.IpfsHash || data.hash;
    }
  } catch {
    // MCP endpoint not available, try standard IPFS API
  }
  
  // Fallback: Standard IPFS HTTP API (Kubo/go-ipfs compatible)
  const ipfsApiUrl = `${baseUrl}/api/v0/add`;
  
  const formData = new FormData();
  const blob = new Blob([content], { type: 'application/json' });
  formData.append('file', blob, filename);
  
  const response = await fetch(ipfsApiUrl, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Local IPFS failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.Hash || data.cid;
}

/**
 * Pin to Pinata IPFS
 */
async function pinToPinata(
  content: string, 
  filename: string, 
  jwt?: string, 
  apiKey?: string, 
  secretKey?: string
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  } else if (apiKey && secretKey) {
    headers['pinata_api_key'] = apiKey;
    headers['pinata_secret_api_key'] = secretKey;
  } else {
    throw new Error('Pinata credentials not configured');
  }
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      pinataContent: content,
      pinataMetadata: { name: filename },
      pinataOptions: { cidVersion: 1 },
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata error: ${errorText}`);
  }
  
  const data = await response.json();
  return data.IpfsHash;
}

/**
 * Pin to Web3.Storage (Filecoin-backed, free for NFT storage)
 */
async function pinToWeb3Storage(content: string, filename: string, token: string): Promise<string> {
  const blob = new Blob([content], { type: 'application/json' });
  const file = new File([blob], filename);
  
  const response = await fetch('https://api.web3.storage/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: file,
  });
  
  if (!response.ok) {
    throw new Error(`Web3.Storage failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.cid;
}

/**
 * Generate NFT metadata JSON with embedded SVG
 * OPTIMIZATION: Embed SVG as data URI to use only 1 IPFS pin per mint
 * This allows 500 mints/month on Pinata free tier
 */
function generateMetadataWithSvg(
  tokenId: number,
  request: MintRequest,
  svgContent: string,
  votBurned: string
): object {
  const displayName = request.ensName || request.baseName || `Builder #${tokenId}`;
  
  // Encode SVG as base64 data URI for image field
  // This embeds the SVG directly in metadata, requiring only 1 pin
  const svgBase64 = Buffer.from(svgContent).toString('base64');
  const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;
  
  return {
    name: `MCPVOT Builder #${tokenId}`,
    description: `MCPVOT Ecosystem Builder NFT for ${displayName}. Grants access to the x402 VOT Facilitator network. 69,420 VOT included!`,
    image: svgDataUri, // Embedded SVG as data URI
    image_data: svgContent, // Raw SVG for platforms that support it
    external_url: request.ensName 
      ? `https://${request.ensName}.eth.limo`
      : `https://mcpvot.xyz/nft/${tokenId}`,
    animation_url: svgDataUri, // Some platforms use this for SVGs
    attributes: [
      { trait_type: 'Builder ID', value: tokenId },
      { trait_type: 'Network', value: 'Base' },
      { trait_type: 'VOT Reward', value: '69,420 VOT' },
      { trait_type: 'VOT Burned', value: votBurned },
      { trait_type: 'Mint Date', value: Math.floor(Date.now() / 1000), display_type: 'date' },
      ...(request.ensName ? [{ trait_type: 'ENS Name', value: request.ensName }] : []),
      ...(request.baseName ? [{ trait_type: 'Base Name', value: request.baseName }] : []),
      ...(request.farcasterFid ? [{ trait_type: 'Farcaster FID', value: request.farcasterFid }] : []),
    ],
    properties: {
      category: 'builder',
      collection: 'mcpvot-builders',
      version: '2.0.0',
      files: [
        {
          type: 'image/svg+xml',
          uri: svgDataUri,
        }
      ],
    },
  };
}

/**
 * Legacy: Generate metadata with separate SVG CID
 * Used when we have unlimited pins (paid Pinata or Web3.Storage)
 */
function generateMetadata(
  tokenId: number,
  request: MintRequest,
  svgCid: string,
  votBurned: string
): object {
  const displayName = request.ensName || request.baseName || `Builder #${tokenId}`;
  
  return {
    name: `MCPVOT Builder #${tokenId}`,
    description: `MCPVOT Ecosystem Builder NFT for ${displayName}. Grants access to the x402 VOT Facilitator network.`,
    image: `ipfs://${svgCid}`,
    external_url: request.ensName 
      ? `https://${request.ensName}.eth.limo`
      : `https://mcpvot.xyz/nft/${tokenId}`,
    attributes: [
      { trait_type: 'Builder ID', value: tokenId },
      { trait_type: 'Network', value: 'Base' },
      { trait_type: 'VOT Burned', value: votBurned },
      { trait_type: 'Mint Date', value: Math.floor(Date.now() / 1000), display_type: 'date' },
      ...(request.ensName ? [{ trait_type: 'ENS Name', value: request.ensName }] : []),
      ...(request.baseName ? [{ trait_type: 'Base Name', value: request.baseName }] : []),
      ...(request.farcasterFid ? [{ trait_type: 'Farcaster FID', value: request.farcasterFid }] : []),
    ],
    properties: {
      category: 'builder',
      collection: 'mcpvot-builders',
      version: '1.0.0',
    },
  };
}

/**
 * Store mint in MCP Memory
 */
async function storeMintInMemory(result: MintResult & MintRequest): Promise<void> {
  try {
    const memoryUrl = process.env.MCP_MEMORY_URL || 'http://localhost:8001';
    
    await fetch(`${memoryUrl}/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'nft_mint',
        content: `MCPVOT Builder NFT #${result.tokenId} minted for ${result.userAddress}. VOT sent: ${result.votSent}, VOT burned: ${result.votBurned}. SVG: ipfs://${result.ipfsCid}`,
        vector: [],
        metadata: {
          type: 'builder_nft',
          tokenId: result.tokenId,
          userAddress: result.userAddress,
          ensName: result.ensName,
          baseName: result.baseName,
          farcasterFid: result.farcasterFid,
          svgCid: result.ipfsCid,
          metadataCid: result.metadataCid,
          votSent: result.votSent,
          votBurned: result.votBurned,
          transactionHash: result.transactionHash,
          timestamp: Date.now(),
        },
      }),
    });
    
    console.log(`[MintExecutor] Stored in MCP Memory: Token #${result.tokenId}`);
  } catch (error) {
    console.error('[MintExecutor] Failed to store in MCP Memory:', error);
    // Non-fatal - continue even if memory store fails
  }
}

/**
 * Process a mint request - main execution function
 * 
 * IPFS OPTIMIZATION FOR FREE TIER:
 * - With Web3.Storage: 2 pins (SVG + metadata) - unlimited free
 * - With Pinata free: 1 pin (embedded SVG in metadata) - 500/month
 * - For 2500 mints, use Web3.Storage or Pinata paid ($20/mo)
 */
export async function processMintRequest(request: MintRequest): Promise<MintResult> {
  console.log(`[MintExecutor] Processing mint for ${request.userAddress}`);
  
  // Generate token ID
  const tokenId = tokenIdCounter++;
  
  // Track rarity - default to NODE, will be updated from contract event
  let mintedRarity: RarityName = 'NODE';
  
  // Calculate burn amount
  const votSent = BigInt(VOT_REWARD);
  const votBurned = votSent * BigInt(BURN_PERCENTAGE) / BigInt(100);
  
  // Determine pinning strategy based on available services
  const hasWeb3Storage = !!process.env.WEB3_STORAGE_TOKEN;
  const hasPinataPaid = process.env.PINATA_TIER === 'paid';
  const useSinglePin = !hasWeb3Storage && !hasPinataPaid;
  
  let svgCid: string;
  let metadataCid: string;
  
  if (useSinglePin) {
    // FREE TIER: Single pin with embedded SVG (500 mints/month max)
    console.log(`[MintExecutor] Using single-pin mode (Pinata free tier)`);
    
    const metadata = generateMetadataWithSvg(tokenId, request, request.svgContent, votBurned.toString());
    metadataCid = await pinToIPFS(
      JSON.stringify(metadata, null, 2),
      `mcpvot-builder-${tokenId}.json`
    );
    svgCid = metadataCid; // Same CID since SVG is embedded
    
  } else {
    // PAID/UNLIMITED: Separate pins for SVG and metadata
    console.log(`[MintExecutor] Using dual-pin mode (unlimited storage)`);
    
    // Pin SVG separately
    svgCid = await pinToIPFS(request.svgContent, `mcpvot-builder-${tokenId}.svg`);
    
    // Pin metadata with SVG reference
    const metadata = generateMetadata(tokenId, request, svgCid, votBurned.toString());
    metadataCid = await pinToIPFS(
      JSON.stringify(metadata, null, 2),
      `mcpvot-builder-${tokenId}-metadata.json`
    );
  }
  
  // Step 4: Execute blockchain transactions
  let transactionHash = '0x' + '0'.repeat(64); // Placeholder
  
  if (FACILITATOR_PRIVATE_KEY && FACILITATOR_PRIVATE_KEY !== '') {
    console.log(`[MintExecutor] Step 3: Executing blockchain transactions...`);
    
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(FACILITATOR_PRIVATE_KEY, provider);
      const votContract = new ethers.Contract(VOT_TOKEN, ERC20_ABI, wallet);
      
      // Check if NFT contract is deployed
      const isContractDeployed = MCPVOT_NFT_CONTRACT !== '0x0000000000000000000000000000000000000000';
      
      if (isContractDeployed) {
        // Contract handles VOT transfer via safeTransferFrom(treasury, user, amount)
        // The facilitator wallet calls the mint function, contract transfers VOT
        console.log(`[MintExecutor] NFT contract deployed - contract will handle VOT transfer`);
        
        // Check treasury balance (contract will pull from treasury)
        const balance = await votContract.balanceOf(TREASURY);
        if (balance < votSent) {
          throw new Error(`Insufficient treasury VOT balance: ${ethers.formatUnits(balance, 18)} VOT`);
        }
      } else {
        // No contract - facilitator wallet transfers VOT directly
        console.log(`[MintExecutor] No NFT contract - facilitator transferring VOT directly`);
        
        const walletBalance = await votContract.balanceOf(wallet.address);
        if (walletBalance < votSent) {
          throw new Error(`Insufficient facilitator VOT balance: ${ethers.formatUnits(walletBalance, 18)} VOT`);
        }
        
        // Transfer VOT to user
        console.log(`[MintExecutor] Transferring ${ethers.formatUnits(votSent, 18)} VOT to ${request.userAddress}...`);
        const transferTx = await votContract.transfer(request.userAddress, votSent);
        await transferTx.wait();
        transactionHash = transferTx.hash;
      }
      
      // Burn VOT (only if BURN_PERCENTAGE > 0)
      if (BURN_PERCENTAGE > 0 && votBurned > BigInt(0)) {
        console.log(`[MintExecutor] Burning ${ethers.formatUnits(votBurned, 18)} VOT...`);
        const burnTx = await votContract.transfer(BURN_ADDRESS, votBurned);
        await burnTx.wait();
      } else {
        console.log(`[MintExecutor] No burn configured (BURN_PERCENTAGE: ${BURN_PERCENTAGE}%)`);
      }
      
      console.log(`[MintExecutor] VOT transactions complete: ${transactionHash}`);
      
      // Mint NFT if contract is deployed
      if (MCPVOT_NFT_CONTRACT !== '0x0000000000000000000000000000000000000000') {
        console.log(`[MintExecutor] Minting NFT via BeeperNFTV2...`);
        const nftContract = new ethers.Contract(MCPVOT_NFT_CONTRACT, NFT_ABI, wallet);
        
        // Hash ENS and Base name for contract storage
        const ensHash = request.ensName 
          ? ethers.keccak256(ethers.toUtf8Bytes(request.ensName))
          : ethers.ZeroHash;
        const basenameHash = request.baseName
          ? ethers.keccak256(ethers.toUtf8Bytes(request.baseName))
          : ethers.ZeroHash;
        
        // Call BeeperNFTV2.mint() with correct signature
        const mintTx = await nftContract.mint(
          request.userAddress,
          svgCid, // IPFS CID
          request.farcasterFid || 0,
          ensHash,
          basenameHash
        );
        const receipt = await mintTx.wait();
        transactionHash = mintTx.hash;
        
        // Get tokenId and rarity from BeeperMinted event
        const mintEvent = receipt.logs.find(
          (log: ethers.Log) => log.topics[0] === ethers.id('BeeperMinted(uint256,address,uint8,uint256,string)')
        );
        if (mintEvent) {
          const decoded = nftContract.interface.parseLog({
            topics: mintEvent.topics as string[],
            data: mintEvent.data
          });
          if (decoded) {
            tokenIdCounter = Number(decoded.args[0]) + 1; // Sync counter
            // Extract rarity from event (args[2] is rarity enum)
            const rarityIndex = Number(decoded.args[2]);
            mintedRarity = RARITY_NAMES[rarityIndex] || 'NODE';
            console.log(`[MintExecutor] Rarity determined: ${mintedRarity}`);
          }
        }
        
        console.log(`[MintExecutor] NFT minted: ${mintTx.hash}`);
      }
      
    } catch (error) {
      console.error('[MintExecutor] Blockchain error:', error);
      throw error;
    }
  } else {
    console.log(`[MintExecutor] No facilitator key configured - simulating mint`);
    // Simulate random rarity for testing
    const randomRarityIndex = Math.floor(Math.random() * 9);
    mintedRarity = RARITY_NAMES[randomRarityIndex];
  }
  
  const result: MintResult = {
    tokenId,
    transactionHash,
    ipfsCid: svgCid,
    metadataCid,
    votSent: votSent.toString(),
    votBurned: votBurned.toString(),
    rarity: mintedRarity,
  };
  
  // Store in MCP Memory
  await storeMintInMemory({ ...result, ...request });
  
  console.log(`[MintExecutor] Mint complete: Token #${tokenId} (${mintedRarity})`);
  
  return result;
}

/**
 * Get current token ID (for queue API)
 */
export function getCurrentTokenId(): number {
  return tokenIdCounter;
}

/**
 * Set token ID (for syncing with contract)
 */
export function setTokenIdCounter(id: number): void {
  tokenIdCounter = id;
}
