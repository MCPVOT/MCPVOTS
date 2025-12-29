/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                  BEEPER MINT WITH x402 USDC PAYMENT                          ║
 * ║                                                                               ║
 * ║  POST /api/beeper/mint-with-payment                                           ║
 * ║                                                                               ║
 * ║  Flow:                                                                        ║
 * ║  1. User requests mint → Returns 402 with USDC payment requirements           ║
 * ║  2. User signs ERC-2612 permit for $0.25 USDC                                 ║
 * ║  3. User resubmits with Payment-Signature header                              ║
 * ║  4. Facilitator pulls USDC from user wallet                                   ║
 * ║  5. Facilitator mints NFT and sends 69,420 VOT reward                         ║
 * ║                                                                               ║
 * ║  x402 Protocol V2 - USDC TransferWithAuthorization                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// =============================================================================
// CONFIGURATION
// =============================================================================

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const TREASURY_ADDRESS = '0x824ea259c1e92f0c5dc1d85dcbb80290b90be7fa'; // mcpvot.eth

// Mint price in atomic units (6 decimals for USDC)
const MINT_PRICE_ATOMIC = '250000'; // $0.25 USDC = 250000 atomic units
const MINT_PRICE_USD = 0.25;

// USDC ABI for TransferWithAuthorization
const USDC_ABI = parseAbi([
  'function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external',
  'function balanceOf(address account) view returns (uint256)',
]);

// Get RPC URL with fallbacks
function getBaseRpcUrl(): string {
  if (process.env.BASE_RPC_URL) return process.env.BASE_RPC_URL;
  if (process.env.ALCHEMY_BASE_URL) return process.env.ALCHEMY_BASE_URL;
  return 'https://mainnet.base.org';
}

// Clean and validate private key from env vars
function getFacilitatorPrivateKey(): `0x${string}` | null {
  const rawKey = process.env.BEEPER_FACILITATOR_PRIVATE_KEY || 
                 process.env.FACILITATOR_PRIVATE_KEY || 
                 process.env.SERVER_PRIVATE_KEY;
  if (!rawKey) return null;
  
  // Clean the key: remove whitespace, quotes, and ensure proper format
  let key = rawKey.trim().replace(/^["']|["']$/g, '');
  
  // Remove 0x prefix if present (we'll add it back)
  if (key.startsWith('0x')) {
    key = key.slice(2);
  }
  
  // Validate it's a 64-character hex string (32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    console.error('[x402] Invalid private key format, length:', key.length);
    return null;
  }
  
  return `0x${key}`;
}

// Create clients
const publicClient = createPublicClient({
  chain: base,
  transport: http(getBaseRpcUrl()),
});

// =============================================================================
// x402 PAYMENT REQUIREMENTS
// =============================================================================

function generatePaymentRequirements(): {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
  payTo: string;
  asset: string;
  description: string;
} {
  return {
    scheme: 'exact',
    network: 'eip155:8453', // Base mainnet
    maxAmountRequired: MINT_PRICE_ATOMIC,
    maxTimeoutSeconds: 300, // 5 minutes
    payTo: TREASURY_ADDRESS,
    asset: `eip155:8453/erc20:${USDC_ADDRESS}`,
    description: 'BEEPER NFT Mint - $0.25 USDC',
  };
}

// =============================================================================
// VERIFY AND EXECUTE PAYMENT
// =============================================================================

interface PaymentAuthorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
  signature: string;
}

async function verifyAndExecutePayment(
  authorization: PaymentAuthorization
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  console.log('[x402] Verifying payment authorization...');
  
  // Validate payment amount
  const paymentValue = BigInt(authorization.value);
  const expectedValue = BigInt(MINT_PRICE_ATOMIC);
  
  if (paymentValue < expectedValue) {
    return { success: false, error: `Insufficient payment: ${paymentValue} < ${expectedValue}` };
  }
  
  // Validate recipient
  if (authorization.to.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) {
    return { success: false, error: 'Invalid payment recipient' };
  }
  
  // Validate timing
  const now = Math.floor(Date.now() / 1000);
  const validAfter = parseInt(authorization.validAfter);
  const validBefore = parseInt(authorization.validBefore);
  
  if (now < validAfter) {
    return { success: false, error: 'Payment not yet valid' };
  }
  if (now > validBefore) {
    return { success: false, error: 'Payment expired' };
  }
  
  // Check user has enough USDC
  const userBalance = await publicClient.readContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [authorization.from as `0x${string}`],
  });
  
  if (BigInt(userBalance as bigint) < paymentValue) {
    return { success: false, error: `Insufficient USDC balance. Need $${MINT_PRICE_USD}` };
  }
  
  // Execute TransferWithAuthorization using facilitator wallet
  const facilitatorKey = getFacilitatorPrivateKey();
  if (!facilitatorKey) {
    console.error('[x402] No valid facilitator key found in env vars');
    return { success: false, error: 'Facilitator not configured' };
  }
  
  try {
    const account = privateKeyToAccount(facilitatorKey);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(getBaseRpcUrl()),
    });
    
    // Parse signature components
    const sig = authorization.signature.startsWith('0x') 
      ? authorization.signature.slice(2) 
      : authorization.signature;
    const r = `0x${sig.slice(0, 64)}` as `0x${string}`;
    const s = `0x${sig.slice(64, 128)}` as `0x${string}`;
    const vHex = sig.slice(128, 130);
    let v = parseInt(vHex, 16);
    if (v < 27) v += 27;
    
    console.log(`[x402] Executing transferWithAuthorization...`);
    console.log(`  From: ${authorization.from}`);
    console.log(`  To: ${authorization.to}`);
    console.log(`  Value: ${authorization.value} (${MINT_PRICE_USD} USDC)`);
    
    const txHash = await walletClient.writeContract({
      address: USDC_ADDRESS as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'transferWithAuthorization',
      args: [
        authorization.from as `0x${string}`,
        authorization.to as `0x${string}`,
        BigInt(authorization.value),
        BigInt(authorization.validAfter),
        BigInt(authorization.validBefore),
        authorization.nonce as `0x${string}`,
        v,
        r,
        s,
      ],
    });
    
    console.log(`[x402] USDC transfer submitted: ${txHash}`);
    
    // Wait for confirmation with extended timeout
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash,
      timeout: 120_000, // 2 minutes
    });
    
    if (receipt.status === 'success') {
      console.log(`[x402] USDC payment confirmed!`);
      return { success: true, txHash };
    } else {
      return { success: false, error: 'USDC transfer failed' };
    }
    
  } catch (error) {
    console.error('[x402] Payment execution failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Payment failed' 
    };
  }
}

// =============================================================================
// POST HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;
    
    // Check for Payment-Signature header (x402 V2)
    const paymentHeader = request.headers.get('Payment-Signature') || request.headers.get('x-payment');
    
    // If no payment signature, return 402 Payment Required
    if (!paymentHeader) {
      console.log('[x402] No payment signature, returning 402...');
      
      return NextResponse.json({
        success: false,
        error: 'Payment required',
        paymentRequirements: generatePaymentRequirements(),
      }, { status: 402 });
    }
    
    // Parse payment header
    console.log('[x402] Payment signature received, verifying...');
    
    let paymentData;
    try {
      // Remove "x402 " prefix if present (V2 format: "x402 <base64>")
      let base64Data = paymentHeader;
      if (paymentHeader.startsWith('x402 ')) {
        base64Data = paymentHeader.slice(5);
      } else if (paymentHeader.startsWith('base64:')) {
        base64Data = paymentHeader.slice(7);
      }
      
      // Decode base64 payment header
      const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
      paymentData = JSON.parse(decoded);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment header format',
      }, { status: 400 });
    }
    
    // Extract authorization from x402 payload
    const authorization: PaymentAuthorization = {
      from: paymentData.payload?.authorization?.from || walletAddress,
      to: paymentData.payload?.authorization?.to || TREASURY_ADDRESS,
      value: paymentData.payload?.authorization?.value || MINT_PRICE_ATOMIC,
      validAfter: paymentData.payload?.authorization?.validAfter || '0',
      validBefore: paymentData.payload?.authorization?.validBefore || String(Math.floor(Date.now() / 1000) + 300),
      nonce: paymentData.payload?.authorization?.nonce || '0x0',
      signature: paymentData.payload?.signature || '',
    };
    
    // Verify and execute USDC payment
    const paymentResult = await verifyAndExecutePayment(authorization);
    
    if (!paymentResult.success) {
      return NextResponse.json({
        success: false,
        error: paymentResult.error,
      }, { status: 402 });
    }
    
    console.log(`[x402] Payment successful: ${paymentResult.txHash}`);
    
    // Now execute the actual mint
    try {
      const { mintBeeperNFT, sendMintReward } = await import('@/lib/beeper/x402-facilitator');
      const { fetchBeeperUserData } = await import('@/lib/beeper/identity-service');
      const { generateBeeperBannerV3: generateBeeperBanner } = await import('@/lib/beeper/banner-generator-v3');
      
      // Fetch user data
      const userData = await fetchBeeperUserData(0, authorization.from);
      
      if (!userData) {
        return NextResponse.json({
          success: false,
          error: 'Could not fetch user data',
        }, { status: 400 });
      }
      
      // Generate banner
      const svgContent = generateBeeperBanner(userData, { theme: 'matrix' });
      
      // Pin to IPFS (simplified)
      const svgCid = `Qm${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
      
      // Execute on-chain mint
      const mintResult = await mintBeeperNFT(
        authorization.from,
        svgContent,
        svgCid,
        userData.farcasterFid || 0,
        userData.ensName || '',
        userData.basename || '',
        'BEEPER NFT'
      );
      
      if (!mintResult.success) {
        return NextResponse.json({
          success: false,
          error: mintResult.error || 'Mint failed',
        }, { status: 500 });
      }
      
      // Send VOT reward
      const rewardResult = await sendMintReward(authorization.from);
      
      console.log(`[x402] Mint complete! TokenID: ${mintResult.tokenId}, Rarity: ${mintResult.rarity}`);
      
      return NextResponse.json({
        success: true,
        receipt: {
          id: `beeper-${mintResult.tokenId}`,
          payer: authorization.from,
          usdAmount: MINT_PRICE_USD,
          usdcTxHash: paymentResult.txHash,
        },
        tokenId: mintResult.tokenId,
        rarity: mintResult.rarity,
        txHash: mintResult.txHash,
        svgCid: svgCid,
        votReward: rewardResult.success ? 69420 : 0,
        votTxHash: rewardResult.txHash,
      });
      
    } catch (mintError) {
      const errorMessage = mintError instanceof Error ? mintError.message : 'Unknown mint error';
      const errorStack = mintError instanceof Error ? mintError.stack : '';
      console.error('[x402] Mint failed after payment:', errorMessage);
      console.error('[x402] Error stack:', errorStack);
      return NextResponse.json({
        success: false,
        error: `Mint failed: ${errorMessage}`,
        paymentTxHash: paymentResult.txHash, // Include so user can get refund if needed
      }, { status: 500 });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[x402] Request failed:', errorMessage);
    console.error('[x402] Error stack:', errorStack);
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

// =============================================================================
// GET - Stats and info
// =============================================================================

export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: '/api/beeper/mint-with-payment',
    protocol: 'x402 V2',
    mintPrice: `$${MINT_PRICE_USD} USDC`,
    votReward: 69420,
    payTo: TREASURY_ADDRESS,
    asset: USDC_ADDRESS,
    network: 'Base (8453)',
  });
}
