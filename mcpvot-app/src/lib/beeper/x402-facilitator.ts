/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                     x402 V2 FACILITATOR - BEEPER INTEGRATION                 ║
 * ║                                                                               ║
 * ║  Handles VOT token transfers for BEEPER mint operations:                     ║
 * ║  - 69,420 VOT mint reward                                                    ║
 * ║  - 10,000 VOT share + follow bonus                                           ║
 * ║                                                                               ║
 * ║  Base Network Gas Configuration:                                             ║
 * ║  - Uses Base-optimized gas settings                                          ║
 * ║  - EIP-1559 support for predictable fees                                     ║
 * ║  - Priority fee for fast confirmations                                       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { createPublicClient, createWalletClient, formatEther, http, parseAbi, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// =============================================================================
// CONFIGURATION
// =============================================================================

// VOT Token on Base Mainnet - OFFICIAL ADDRESS
// Clean env var to remove any trailing whitespace/newlines from Vercel
const VOT_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_VOT_TOKEN || '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07').trim();
// Read env vars at runtime for Vercel serverless compatibility
// Check multiple possible env var names for facilitator private key
function getFacilitatorPrivateKey(): string | undefined {
  const rawKey = process.env.BEEPER_FACILITATOR_PRIVATE_KEY || 
                 process.env.FACILITATOR_PRIVATE_KEY || 
                 process.env.SERVER_PRIVATE_KEY;
  if (!rawKey) return undefined;
  
  // Clean the key: remove whitespace, quotes, and ensure proper format
  let key = rawKey.trim().replace(/^["']|["']$/g, '');
  
  // Remove 0x prefix if present (we'll add it back)
  if (key.startsWith('0x')) {
    key = key.slice(2);
  }
  
  // Validate it's a 64-character hex string (32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    console.error('[x402-facilitator] Invalid private key format, length:', key.length);
    return undefined;
  }
  
  return `0x${key}`;
}
function getBaseRpcUrl(): string {
  return process.env.BASE_RPC_URL || 'https://mainnet.base.org';
}

// VOT Token ABI (ERC20)
const VOT_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]);

// Base Network Gas Settings (EIP-1559)
// Based on maxx_trader_fix.py analysis:
// - Base mainnet typically needs ~0.001-0.1 gwei
// - Priority fee: 0.001-0.01 gwei for fast confirmations
// - ERC20 transfers need ~65,000 gas (use 100,000 for safety)
const BASE_GAS_CONFIG = {
  maxFeePerGas: 100_000_000n,        // 0.1 gwei max fee (safe for Base)
  maxPriorityFeePerGas: 1_000_000n,  // 0.001 gwei priority (fast confirmation)
  gasLimit: 100_000n,                // Standard ERC20 transfer limit
};

// =============================================================================
// CLIENT SETUP
// =============================================================================

const publicClient = createPublicClient({
  chain: base,
  transport: http(getBaseRpcUrl()),
});

// =============================================================================
// FACILITATOR WALLET
// =============================================================================

function getFacilitatorWallet() {
  const privateKey = getFacilitatorPrivateKey();
  if (!privateKey) {
    throw new Error('FACILITATOR_PRIVATE_KEY not configured');
  }
  
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(getBaseRpcUrl()),
  });
  
  return { account, walletClient };
}

// =============================================================================
// VOT TOKEN OPERATIONS
// =============================================================================

/**
 * Get facilitator VOT balance
 */
export async function getFacilitatorBalance(): Promise<{ vot: string; eth: string }> {
  const { account } = getFacilitatorWallet();
  
  const [votBalance, ethBalance] = await Promise.all([
    publicClient.readContract({
      address: VOT_TOKEN_ADDRESS as `0x${string}`,
      abi: VOT_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    }) as Promise<bigint>,
    publicClient.getBalance({ address: account.address }),
  ]);
  
  return {
    vot: formatEther(votBalance),
    eth: formatEther(ethBalance),
  };
}

/**
 * Send VOT tokens to recipient
 * Used for both mint rewards and share bonuses
 */
export async function sendVOTTokens(
  to: string,
  amount: number,
  reason: 'mint_reward' | 'share_bonus'
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const { account, walletClient } = getFacilitatorWallet();
    
    // Convert amount to wei (18 decimals)
    const amountWei = parseEther(amount.toString());
    
    console.log(`[x402V2] Sending ${amount} VOT to ${to} (${reason})`);
    console.log(`[x402V2] Amount in wei: ${amountWei.toString()}`);
    
    // Check facilitator balance
    const balance = await publicClient.readContract({
      address: VOT_TOKEN_ADDRESS as `0x${string}`,
      abi: VOT_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    }) as bigint;
    
    if (balance < amountWei) {
      console.error(`[x402V2] Insufficient VOT balance: ${formatEther(balance)} < ${amount}`);
      return {
        success: false,
        error: `Insufficient facilitator VOT balance: ${formatEther(balance)}`,
      };
    }
    
    // Get dynamic gas prices from Base (like maxx_trader_fix.py)
    const block = await publicClient.getBlock({ blockTag: 'latest' });
    
    const baseFee = block.baseFeePerGas || 0n;
    // Add 20% headroom to base fee (matches trading bot)
    const baseFeeWithHeadroom = baseFee + (baseFee * 20n / 100n);
    
    // Use dynamic gas or fallback to config
    const priorityFee = BASE_GAS_CONFIG.maxPriorityFeePerGas;
    const maxFee = baseFeeWithHeadroom + priorityFee > BASE_GAS_CONFIG.maxFeePerGas 
      ? baseFeeWithHeadroom + priorityFee 
      : BASE_GAS_CONFIG.maxFeePerGas;
    
    console.log(`[x402V2] Gas: baseFee=${baseFee}, maxFee=${maxFee}, priorityFee=${priorityFee}`);
    
    // Build and send transaction
    const txHash = await walletClient.writeContract({
      address: VOT_TOKEN_ADDRESS as `0x${string}`,
      abi: VOT_ABI,
      functionName: 'transfer',
      args: [to as `0x${string}`, amountWei],
      gas: BASE_GAS_CONFIG.gasLimit,
      maxFeePerGas: maxFee,
      maxPriorityFeePerGas: priorityFee,
    });
    
    console.log(`[x402V2] Transaction sent: ${txHash}`);
    
    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });
    
    if (receipt.status === 'success') {
      console.log(`[x402V2] Transaction confirmed in block ${receipt.blockNumber}`);
      return {
        success: true,
        txHash,
      };
    } else {
      console.error(`[x402V2] Transaction failed: ${receipt.status}`);
      return {
        success: false,
        txHash,
        error: 'Transaction reverted',
      };
    }
    
  } catch (error) {
    console.error('[x402V2] sendVOTTokens error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send mint reward (69,420 VOT)
 */
export async function sendMintReward(to: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
  return sendVOTTokens(to, 69420, 'mint_reward');
}

/**
 * Send share bonus (10,000 VOT)
 */
export async function sendShareBonus(to: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
  return sendVOTTokens(to, 10000, 'share_bonus');
}

// =============================================================================
// NFT MINTING
// =============================================================================

// BeeperNFTV3 Contract Address
const BEEPER_NFT_CONTRACT = process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9';

// BeeperNFTV3 ABI (mint function with MintParams struct)
const BEEPER_NFT_ABI = parseAbi([
  'function mint((address to, string svgData, string ipfsCid, uint32 farcasterFid, string ensName, string basename, string tagline) params) external returns (uint256 tokenId, uint8 rarity)',
  'function tokenCounter() view returns (uint256)',
  'function facilitator() view returns (address)',
  'function owner() view returns (address)',
]);

/**
 * Mint BEEPER NFT via facilitator wallet
 * This is the REAL on-chain mint function
 */
export async function mintBeeperNFT(
  to: string,
  svgData: string,
  ipfsCid: string,
  farcasterFid: number,
  ensName: string,
  basename: string,
  tagline: string
): Promise<{ success: boolean; txHash?: string; tokenId?: number; rarity?: number; error?: string }> {
  try {
    const { account, walletClient } = getFacilitatorWallet();
    
    console.log(`[x402V2] Minting BEEPER NFT to ${to}`);
    console.log(`[x402V2] FID: ${farcasterFid}, ENS: ${ensName || 'none'}, Basename: ${basename || 'none'}`);
    
    // Verify facilitator is authorized
    const contractFacilitator = await publicClient.readContract({
      address: BEEPER_NFT_CONTRACT as `0x${string}`,
      abi: BEEPER_NFT_ABI,
      functionName: 'facilitator',
    }) as `0x${string}`;
    
    if (contractFacilitator.toLowerCase() !== account.address.toLowerCase()) {
      console.error(`[x402V2] Facilitator mismatch! Contract expects: ${contractFacilitator}, we have: ${account.address}`);
      return {
        success: false,
        error: `Facilitator address mismatch. Expected: ${contractFacilitator}`,
      };
    }
    
    // Get dynamic gas prices
    const block = await publicClient.getBlock({ blockTag: 'latest' });
    const baseFee = block.baseFeePerGas || 0n;
    const baseFeeWithHeadroom = baseFee + (baseFee * 20n / 100n);
    const priorityFee = BASE_GAS_CONFIG.maxPriorityFeePerGas;
    const maxFee = baseFeeWithHeadroom + priorityFee > BASE_GAS_CONFIG.maxFeePerGas 
      ? baseFeeWithHeadroom + priorityFee 
      : BASE_GAS_CONFIG.maxFeePerGas;
    
    console.log(`[x402V2] Gas: baseFee=${baseFee}, maxFee=${maxFee}, priorityFee=${priorityFee}`);
    
    // Build MintParams struct
    const mintParams = {
      to: to as `0x${string}`,
      svgData,
      ipfsCid,
      farcasterFid,
      ensName: ensName || '',
      basename: basename || '',
      tagline: tagline || '',
    };
    
    console.log(`[x402V2] Calling mint with params:`, {
      to: mintParams.to,
      svgDataLength: mintParams.svgData.length,
      ipfsCid: mintParams.ipfsCid,
      farcasterFid: mintParams.farcasterFid,
      ensName: mintParams.ensName,
      basename: mintParams.basename,
      tagline: mintParams.tagline,
    });
    
    // Estimate gas for the mint (SVG data can be large)
    let gasEstimate: bigint;
    try {
      gasEstimate = await publicClient.estimateContractGas({
        address: BEEPER_NFT_CONTRACT as `0x${string}`,
        abi: BEEPER_NFT_ABI,
        functionName: 'mint',
        args: [mintParams],
        account: account.address,
      });
      // Add 20% buffer
      gasEstimate = gasEstimate + (gasEstimate * 20n / 100n);
      console.log(`[x402V2] Estimated gas: ${gasEstimate}`);
    } catch (gasError) {
      console.error(`[x402V2] Gas estimation failed:`, gasError);
      // Use higher gas limit for SVG storage
      gasEstimate = 500_000n;
    }
    
    // Execute mint transaction
    const txHash = await walletClient.writeContract({
      address: BEEPER_NFT_CONTRACT as `0x${string}`,
      abi: BEEPER_NFT_ABI,
      functionName: 'mint',
      args: [mintParams],
      gas: gasEstimate,
      maxFeePerGas: maxFee,
      maxPriorityFeePerGas: priorityFee,
    });
    
    console.log(`[x402V2] Mint transaction sent: ${txHash}`);
    
    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });
    
    if (receipt.status === 'success') {
      console.log(`[x402V2] Mint confirmed in block ${receipt.blockNumber}`);
      
      // Get token ID from logs (Transfer event)
      // In ERC1155, look for TransferSingle event
      const tokenId = receipt.logs[0]?.topics[3] 
        ? parseInt(receipt.logs[0].topics[3], 16)
        : 0;
      
      return {
        success: true,
        txHash,
        tokenId,
        rarity: 0, // Will be determined by contract
      };
    } else {
      console.error(`[x402V2] Mint transaction reverted`);
      return {
        success: false,
        txHash,
        error: 'Transaction reverted',
      };
    }
    
  } catch (error) {
    console.error('[x402V2] mintBeeperNFT error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * Check if facilitator is properly configured and funded
 */
export async function checkFacilitatorHealth(): Promise<{
  configured: boolean;
  funded: boolean;
  votBalance: string;
  ethBalance: string;
  address?: string;
  error?: string;
}> {
  try {
    const privateKey = getFacilitatorPrivateKey();
    if (!privateKey) {
      return {
        configured: false,
        funded: false,
        votBalance: '0',
        ethBalance: '0',
        error: 'Facilitator private key not configured',
      };
    }
    
    const { account } = getFacilitatorWallet();
    const { vot, eth } = await getFacilitatorBalance();
    
    // Need at least 100K VOT and 0.001 ETH for gas
    const isFunded = parseFloat(vot) >= 100000 && parseFloat(eth) >= 0.001;
    
    return {
      configured: true,
      funded: isFunded,
      votBalance: vot,
      ethBalance: eth,
      address: account.address,
    };
    
  } catch (error) {
    return {
      configured: false,
      funded: false,
      votBalance: '0',
      ethBalance: '0',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export const x402V2Facilitator = {
  sendVOTTokens,
  sendMintReward,
  sendShareBonus,
  mintBeeperNFT,
  getFacilitatorBalance,
  checkFacilitatorHealth,
  config: {
    votToken: VOT_TOKEN_ADDRESS,
    nftContract: BEEPER_NFT_CONTRACT,
    baseRpc: getBaseRpcUrl(),
    gasConfig: BASE_GAS_CONFIG,
  },
};

export default x402V2Facilitator;
