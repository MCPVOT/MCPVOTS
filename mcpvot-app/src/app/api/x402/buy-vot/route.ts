import { ethers } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';

// VOT Token Contract Address (Base)
const VOT_TOKEN_ADDRESS = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Uniswap V2 Router for VOT purchase
const UNISWAP_ROUTER = '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24'; // Base Uniswap V2 Router
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // Base WETH

// ERC20 ABI
const ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
];

// Uniswap V2 Router ABI
const UNISWAP_ROUTER_ABI = [
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { usdcAmount = '1', walletAddress } = body;

        if (!walletAddress) {
            return NextResponse.json({
                success: false,
                error: 'Wallet address is required'
            }, { status: 400 });
        }

        console.log(`🔷 x402 Buy VOT: ${usdcAmount} USDC for ${walletAddress}`);

        // Initialize provider
        const provider = new ethers.JsonRpcProvider(
            process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
        );

        // Initialize wallet for facilitator
        // Check multiple env vars for backwards compatibility
        const privateKey = process.env.PRIVATE_KEY 
            || process.env.X402_PAYMENT_PRIVATE_KEY 
            || process.env.SERVER_PRIVATE_KEY
            || process.env.MINTING_WALLET_PRIVATE_KEY;
        if (!privateKey) {
            console.error('[x402] Facilitator wallet not configured. Checked: PRIVATE_KEY, X402_PAYMENT_PRIVATE_KEY, SERVER_PRIVATE_KEY, MINTING_WALLET_PRIVATE_KEY');
            throw new Error('Facilitator wallet not configured - set PRIVATE_KEY or X402_PAYMENT_PRIVATE_KEY in Vercel');
        }
        const wallet = new ethers.Wallet(privateKey, provider);

        // Try calling VOT Trading Bot for optimal execution
        try {
            const botResponse = await fetch('http://localhost:8765/api/optimal-buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usdcAmount,
                    recipient: walletAddress,
                    purpose: 'x402_purchase'
                })
            });

            if (botResponse.ok) {
                const result = await botResponse.json();
                console.log(`✅ VOT purchased via Trading Bot: ${result.votAmount} VOT`);
                
                return NextResponse.json({
                    success: true,
                    votAmount: result.votAmount,
                    txHash: result.txHash,
                    recipient: walletAddress,
                    executionMethod: 'trading_bot'
                });
            }
        } catch {
            console.log('⚠️ Trading Bot unavailable, using direct swap...');
        }

        // Fallback: Direct Uniswap swap
        const router = new ethers.Contract(UNISWAP_ROUTER, UNISWAP_ROUTER_ABI, wallet);
        const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);

        const usdcAmountWei = ethers.parseUnits(usdcAmount, 6); // USDC has 6 decimals

        // Check USDC balance
        const usdcBalance = await usdcContract.balanceOf(wallet.address);
        if (usdcBalance < usdcAmountWei) {
            return NextResponse.json({
                success: false,
                error: 'Insufficient USDC balance in facilitator wallet'
            }, { status: 400 });
        }

        // Ensure router allowance
        const currentAllowance = await usdcContract.allowance(wallet.address, UNISWAP_ROUTER);
        if (currentAllowance < usdcAmountWei) {
            const approveTx = await usdcContract.approve(UNISWAP_ROUTER, usdcAmountWei);
            await approveTx.wait();
        }

        // Path: USDC -> WETH -> VOT
        const path = [USDC_ADDRESS, WETH_ADDRESS, VOT_TOKEN_ADDRESS];

        // Calculate minimum VOT amount out (1% slippage)
        const amountsOut = await router.getAmountsOut(usdcAmountWei, path);
        const votAmount = amountsOut[amountsOut.length - 1];
        const minVOTAmount = (votAmount * BigInt(99)) / BigInt(100); // 1% slippage

        // Execute swap
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
        const tx = await router.swapExactTokensForTokens(
            usdcAmountWei,
            minVOTAmount,
            path,
            walletAddress, // Send VOT directly to user
            deadline
        );

        const receipt = await tx.wait();
        const votAmountFormatted = ethers.formatUnits(votAmount, 18);

        console.log(`✅ VOT purchased: ${votAmountFormatted} VOT - TX: ${receipt.hash}`);

        return NextResponse.json({
            success: true,
            votAmount: votAmountFormatted,
            txHash: receipt.hash,
            recipient: walletAddress,
            executionMethod: 'direct_swap',
            path: path.map(addr => addr.toLowerCase()),
            gasUsed: receipt.gasUsed.toString()
        });

    } catch (error) {
        console.error('❌ x402 Buy VOT failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

// GET endpoint for status check
export async function GET() {
    return NextResponse.json({
        status: 'active',
        endpoint: '/api/x402/buy-vot',
        description: 'x402 Payment Facilitator - Converts USDC to VOT',
        supported_methods: ['POST'],
        required_params: {
            walletAddress: 'string - Recipient wallet address',
            usdcAmount: 'string - Amount in USDC (default: 1)'
        }
    });
}
