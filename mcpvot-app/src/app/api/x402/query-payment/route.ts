/**
 * x402 Agent Intelligence Query Payment Handler
 *
 * Economics:
 * - Per Query: $0.10 USDC
 * - Convert ALL $0.10 USDC → WETH → VOT
 *   - 50% VOT → Burn 🔥
 *   - 50% VOT → NFT Mining Rewards Pool (Treasury)
 *
 * Treasury: 0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa
 */

import { ethers } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';

// Constants
const QUERY_FEE_USDC = 0.10; // $0.10 per query
const TREASURY_WALLET = '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa';
const BURN_PERCENTAGE = 50; // 50% of VOT burned

// Base mainnet addresses
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
const VOT_ADDRESS = process.env.NEXT_PUBLIC_VOT_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
const UNISWAP_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481'; // Uniswap V3 Router on Base

// ABIs
const USDC_ABI = [
    'function transfer(address to, uint256 amount) external returns (bool)',
    'function balanceOf(address account) external view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)'
];

const VOT_ABI = [
    'function burn(uint256 amount) external',
    'function balanceOf(address account) external view returns (uint256)',
    'function transfer(address to, uint256 amount) external returns (bool)'
];

const ROUTER_ABI = [
    'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut)'
];

interface QueryPaymentRequest {
    agentId: string;
    agentAddress: string;
    queryType: string;
    paymentSignature: string;
    timestamp: number;
}

interface PaymentResult {
    success: boolean;
    queryId: string;
    treasuryUSDC: number;
    votPurchased: number;
    votBurned: number;
    votToMining: number;
    txHash?: string;
    error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: QueryPaymentRequest = await request.json();
        const { agentId, agentAddress, queryType, paymentSignature, timestamp } = body;

        console.log(`[x402-payment] Processing query from agent ${agentId}`);

        // Verify payment signature
        const isValid = await verifyPaymentSignature(agentAddress, paymentSignature, timestamp);
        if (!isValid) {
            return NextResponse.json({
                success: false,
                error: 'Invalid payment signature'
            }, { status: 401 });
        }

        // Process payment allocation
        const result = await processPaymentAllocation(agentId);

        // Record in database
        await recordQueryPayment({
            agentId,
            agentAddress,
            queryType,
            amount: QUERY_FEE_USDC,
            timestamp: new Date().toISOString(),
            ...result
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('[x402-payment] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Payment processing failed'
        }, { status: 500 });
    }
}

async function verifyPaymentSignature(
    agentAddress: string,
    signature: string,
    timestamp: number
): Promise<boolean> {
    try {
        // Verify timestamp is recent (within 5 minutes)
        const now = Date.now();
        if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
            console.error('[x402-payment] Timestamp expired');
            return false;
        }

        // Verify signature
        const message = `x402 Query Payment: ${QUERY_FEE_USDC} USDC at ${timestamp}`;
        const messageHash = ethers.hashMessage(message);
        const recoveredAddress = ethers.recoverAddress(messageHash, signature);

        if (recoveredAddress.toLowerCase() !== agentAddress.toLowerCase()) {
            console.error('[x402-payment] Signature mismatch');
            return false;
        }

        return true;
    } catch (error) {
        console.error('[x402-payment] Signature verification error:', error);
        return false;
    }
}

async function processPaymentAllocation(agentId: string): Promise<PaymentResult> {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
        const wallet = new ethers.Wallet(process.env.TREASURY_PRIVATE_KEY!, provider);

        // Calculate total (in USDC wei - 6 decimals)
        const totalAmount = ethers.parseUnits(QUERY_FEE_USDC.toString(), 6);

        console.log(`[x402-payment] Converting ${ethers.formatUnits(totalAmount, 6)} USDC → WETH → VOT`);

        // Step 1: Swap ALL $0.10 USDC → WETH → VOT via Uniswap
        const votPurchased = await swapUSDCtoVOT(wallet, totalAmount);
        console.log(`[x402-payment] Purchased ${ethers.formatUnits(votPurchased, 18)} VOT`);

        // Step 2: Burn 50% of VOT
        const burnAmount = votPurchased / BigInt(2);
        const votContract = new ethers.Contract(VOT_ADDRESS, VOT_ABI, wallet);
        const burnTx = await votContract.burn(burnAmount);
        await burnTx.wait();
        console.log(`[x402-payment] Burned ${ethers.formatUnits(burnAmount, 18)} VOT`);

        // Step 3: Transfer remaining 50% to mining rewards pool (Treasury)
        const miningAmount = votPurchased - burnAmount;
        const miningTx = await votContract.transfer(TREASURY_WALLET, miningAmount);
        await miningTx.wait();
        console.log(`[x402-payment] Transferred ${ethers.formatUnits(miningAmount, 18)} VOT to treasury mining pool`);

        const queryId = `${agentId}-${Date.now()}`;

        return {
            success: true,
            queryId,
            treasuryUSDC: 0, // No USDC kept, all converted to VOT
            votPurchased: parseFloat(ethers.formatUnits(votPurchased, 18)),
            votBurned: parseFloat(ethers.formatUnits(burnAmount, 18)),
            votToMining: parseFloat(ethers.formatUnits(miningAmount, 18)),
            txHash: miningTx.hash
        };

    } catch (error) {
        console.error('[x402-payment] Allocation error:', error);
        throw error;
    }
}

async function swapUSDCtoVOT(
    wallet: ethers.Wallet,
    usdcAmount: bigint
): Promise<bigint> {
    try {
        const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
        const routerContract = new ethers.Contract(UNISWAP_ROUTER, ROUTER_ABI, wallet);

        // Step 1: Approve router to spend USDC
        const approveTx = await usdcContract.approve(UNISWAP_ROUTER, usdcAmount);
        await approveTx.wait();

        // Step 2: Swap USDC → WETH
        const usdcToWethParams = {
            tokenIn: USDC_ADDRESS,
            tokenOut: WETH_ADDRESS,
            fee: 500, // 0.05% fee tier for USDC/WETH
            recipient: wallet.address,
            amountIn: usdcAmount,
            amountOutMinimum: 0, // Accept any amount (can add slippage protection)
            sqrtPriceLimitX96: 0
        };

        const swapTx1 = await routerContract.exactInputSingle(usdcToWethParams);
        const receipt1 = await swapTx1.wait();
        console.log(`[x402-payment] Swapped USDC → WETH, tx: ${receipt1.hash}`);

        // Get WETH balance
        const wethContract = new ethers.Contract(WETH_ADDRESS, USDC_ABI, wallet);
        const wethBalance = await wethContract.balanceOf(wallet.address);
        console.log(`[x402-payment] WETH balance: ${ethers.formatUnits(wethBalance, 18)}`);

        // Step 3: Approve router to spend WETH
        const approveWethTx = await wethContract.approve(UNISWAP_ROUTER, wethBalance);
        await approveWethTx.wait();

        // Step 4: Swap WETH → VOT
        const wethToVotParams = {
            tokenIn: WETH_ADDRESS,
            tokenOut: VOT_ADDRESS,
            fee: 3000, // 0.3% fee tier for WETH/VOT
            recipient: wallet.address,
            amountIn: wethBalance,
            amountOutMinimum: 0, // Accept any amount
            sqrtPriceLimitX96: 0
        };

        const swapTx2 = await routerContract.exactInputSingle(wethToVotParams);
        const receipt2 = await swapTx2.wait();
        console.log(`[x402-payment] Swapped WETH → VOT, tx: ${receipt2.hash}`);

        // Get final VOT balance
        const votContract = new ethers.Contract(VOT_ADDRESS, VOT_ABI, wallet);
        const votBalance = await votContract.balanceOf(wallet.address);

        return votBalance;

    } catch (error) {
        console.error('[x402-payment] Swap error:', error);
        throw new Error('Failed to swap USDC → WETH → VOT');
    }
}

async function recordQueryPayment(data: {
    agentId: string;
    agentAddress: string;
    queryType: string;
    amount: number;
    timestamp: string;
    treasuryUSDC: number;
    votPurchased: number;
    votBurned: number;
    votToMining: number;
    txHash?: string;
}) {
    try {
        // TODO: Store in database
        // For now, just log
        console.log('[x402-payment] Query payment recorded:', data);

        // Could use sqlite, postgres, or write to MCP memory
        // await db.insert('query_payments', data);

    } catch (error) {
        console.error('[x402-payment] Database error:', error);
        // Don't throw - payment succeeded even if recording failed
    }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Return query payment info and statistics
        const searchParams = request.nextUrl.searchParams;
        const agentId = searchParams.get('agentId');

        const stats = {
            queryFee: QUERY_FEE_USDC,
            treasuryWallet: TREASURY_WALLET,
            allocation: {
                treasuryUSDC: QUERY_FEE_USDC / 2,
                votConversion: QUERY_FEE_USDC / 2,
                burnPercentage: BURN_PERCENTAGE,
                miningPercentage: 100 - BURN_PERCENTAGE
            },
            flow: [
                'Agent pays $0.10 USDC',
                '$0.05 USDC → Treasury (USDC reserve)',
                '$0.05 USDC → Convert to VOT',
                '50% VOT → Burn 🔥',
                '50% VOT → Mining Rewards Pool'
            ]
        };

        if (agentId) {
            // TODO: Return agent-specific stats
            // const agentStats = await getAgentQueryStats(agentId);
            return NextResponse.json({
                ...stats,
                agentId,
                // agentStats
            });
        }

        return NextResponse.json(stats);

    } catch (error) {
        console.error('[x402-payment] Error fetching stats:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch query payment stats'
        }, { status: 500 });
    }
}
