import {
    checkCombinedRateLimit,
    getClientIP,
    getRateLimitHeaders
} from '@/lib/x402/rateLimit';
import { ethers } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';

const VOT_TOKEN_ADDRESS = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const TREASURY_ADDRESS = '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa';
const GECKO_POOL_ADDRESS = '0xb7730dd50a401a0e57c7438e6d532b6aeccea33254834f4ebfe8311e46f2ce2c';
const GECKO_API = 'https://api.geckoterminal.com/api/v2';
const MIN_VOT_INVENTORY = ethers.parseUnits('10000', 18);
const SUPPORTED_USDC_AMOUNTS = [1, 10, 100, 1000];

const ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external',
    'function authorizationState(address authorizer, bytes32 nonce) view returns (bool)'
];

async function getVOTPriceUSD(): Promise<number> {
    try {
        const response = await fetch(
            `${GECKO_API}/networks/base/pools/${GECKO_POOL_ADDRESS}`,
            { headers: { 'Accept': 'application/json' } }
        );
        if (response.ok) {
            const data = await response.json();
            const price = parseFloat(data.data?.attributes?.base_token_price_usd);
            if (price && price > 0) {
                console.log(`[x402] VOT price: $${price}`);
                return price;
            }
        }
        throw new Error('Could not fetch VOT price');
    } catch (error) {
        console.error('Price fetch error:', error);
        throw new Error('Failed to get real VOT price');
    }
}

function decodePaymentHeader(paymentHeader: string): { permit: { from: string; to: string; value: string; validAfter: string; validBefore: string; nonce: string; signature: string; }; } | null {
    try {
        // x402 V2: Handle "x402 <base64>" format
        // x402 V1: Handle "base64:<base64>" format  
        // Legacy: Handle raw base64
        let base64Data = paymentHeader;
        if (paymentHeader.startsWith('x402 ')) {
            base64Data = paymentHeader.slice(5); // Remove "x402 " prefix (v2)
        } else if (paymentHeader.startsWith('base64:')) {
            base64Data = paymentHeader.slice(7); // Remove "base64:" prefix (v1)
        }
        
        const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        
        // V2 format: { x402Version: 2, scheme, network, payload: { signature, authorization } }
        if (parsed.x402Version === 2 && parsed.payload?.authorization && parsed.payload?.signature) {
            console.log('[x402 V2] Decoded payment header:', { version: parsed.x402Version, network: parsed.network });
            return {
                permit: {
                    from: parsed.payload.authorization.from,
                    to: parsed.payload.authorization.to,
                    value: parsed.payload.authorization.value,
                    validAfter: parsed.payload.authorization.validAfter,
                    validBefore: parsed.payload.authorization.validBefore,
                    nonce: parsed.payload.authorization.nonce,
                    signature: parsed.payload.signature
                }
            };
        }
        
        // V1 format: { payload: { authorization, signature } } (without x402Version)
        if (parsed.payload?.authorization && parsed.payload?.signature) {
            console.log('[x402 V1] Decoded legacy payment header');
            return {
                permit: {
                    from: parsed.payload.authorization.from,
                    to: parsed.payload.authorization.to,
                    value: parsed.payload.authorization.value,
                    validAfter: parsed.payload.authorization.validAfter,
                    validBefore: parsed.payload.authorization.validBefore,
                    nonce: parsed.payload.authorization.nonce,
                    signature: parsed.payload.signature
                }
            };
        }
        
        // Legacy format: { permit: {...} }
        if (parsed.permit) return parsed;
        return null;
    } catch (error) {
        console.error('[x402] Failed to decode payment header:', error);
        return null;
    }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const requestId = `buy-vot-${Date.now().toString(36)}`;
    
    try {
        // x402 V2: Accept both PAYMENT-SIGNATURE (v2) and X-PAYMENT (v1 legacy) headers
        const paymentHeader = req.headers.get('Payment-Signature') || 
                              req.headers.get('payment-signature') ||
                              req.headers.get('X-PAYMENT') || 
                              req.headers.get('x-payment');
        const body = await req.json();
        const { usdcAmount = '1', walletAddress, usdAmount } = body;
        const requestedAmount = usdAmount || usdcAmount;

        if (!walletAddress) {
            return NextResponse.json({ success: false, error: 'Wallet address is required' }, { status: 400 });
        }
        if (!ethers.isAddress(walletAddress)) {
            return NextResponse.json({ success: false, error: 'Invalid wallet address format' }, { status: 400 });
        }

        // Rate limiting check (SECURITY: Added per Security Analysis Report)
        const clientIP = getClientIP(req.headers);
        const rateLimit = checkCombinedRateLimit(walletAddress, clientIP);
        
        if (!rateLimit.allowed) {
            console.warn(`[${requestId}] Rate limit exceeded for ${walletAddress} (limited by: ${rateLimit.limitedBy})`);
            return NextResponse.json({ 
                success: false, 
                error: 'Rate limit exceeded. Please wait 1 minute.',
                retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
            }, { 
                status: 429,
                headers: getRateLimitHeaders(rateLimit)
            });
        }

        const usdcAmountNum = parseFloat(requestedAmount);
        if (isNaN(usdcAmountNum) || usdcAmountNum <= 0 || usdcAmountNum > 10000) {
            return NextResponse.json({ success: false, error: 'Invalid USDC amount' }, { status: 400 });
        }

        if (!SUPPORTED_USDC_AMOUNTS.includes(usdcAmountNum)) {
            console.warn(`[x402] Non-standard amount ${usdcAmountNum}`);
        }

        if (!paymentHeader) {
            console.log(`[x402] Payment required for ${usdcAmountNum} USDC from ${walletAddress}`);
            const usdcAtomicAmount = ethers.parseUnits(usdcAmountNum.toString(), 6).toString();
            
            // x402 V2: Use CAIP-2 network format and standardized PAYMENT-REQUIRED header
            const paymentRequirements = {
                scheme: 'exact',
                network: 'eip155:8453', // V2 CAIP-2 format for Base Mainnet
                maxAmountRequired: usdcAtomicAmount,
                asset: USDC_ADDRESS,
                payTo: TREASURY_ADDRESS,
                maxTimeoutSeconds: 300,
                description: `Purchase VOT tokens with ${usdcAmountNum} USDC`,
                extra: { 
                    resourceId: `vot-buy-${usdcAmountNum}usd`, 
                    usdcAmount: usdcAmountNum, 
                    walletAddress, 
                    chainId: 8453, 
                    timestamp: new Date().toISOString() 
                }
            };
            
            return NextResponse.json({
                error: 'Payment Required',
                message: 'Signature required to authorize USDC transfer',
                paymentRequirements,
                instructions: { 
                    step1: 'Sign the EIP-712 USDC transfer authorization', 
                    step2: 'Include signed permit in Payment-Signature header (x402 V2)', 
                    step3: 'Resend request' 
                }
            }, { 
                status: 402,
                headers: { 
                    // x402 V2: Use standardized PAYMENT-REQUIRED header
                    'Payment-Required': JSON.stringify(paymentRequirements),
                    // Legacy headers for V1 compatibility
                    'X-Payment-Required': 'true', 
                    'X-Payment-Scheme': 'exact', 
                    'X-Payment-Network': 'eip155:8453', // V2 CAIP-2 format
                    'X-Payment-Amount': usdcAtomicAmount, 
                    'X-Payment-Asset': USDC_ADDRESS, 
                    'X-Payment-PayTo': TREASURY_ADDRESS 
                }
            });
        }

        console.log(`[x402] Buy VOT: ${usdcAmountNum} USDC for ${walletAddress}`);
        const paymentData = decodePaymentHeader(paymentHeader);
        if (!paymentData || !paymentData.permit) {
            return NextResponse.json({ success: false, error: 'Invalid payment header format' }, { status: 400 });
        }

        const { permit } = paymentData;
        if (permit.from.toLowerCase() !== walletAddress.toLowerCase()) {
            return NextResponse.json({ success: false, error: 'Payment signature does not match wallet' }, { status: 403 });
        }
        if (permit.to.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) {
            return NextResponse.json({ success: false, error: 'Payment must go to treasury' }, { status: 403 });
        }

        const permitAmount = BigInt(permit.value);
        const expectedAmount = ethers.parseUnits(usdcAmountNum.toString(), 6);
        if (permitAmount < expectedAmount) {
            return NextResponse.json({ success: false, error: `Insufficient payment. Expected ${expectedAmount}, got ${permitAmount}` }, { status: 400 });
        }

        const now = Math.floor(Date.now() / 1000);
        if (BigInt(permit.validBefore) < BigInt(now)) {
            return NextResponse.json({ success: false, error: 'Payment authorization expired' }, { status: 400 });
        }

        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org');
        const privateKeyRaw = process.env.PRIVATE_KEY || process.env.X402_PAYMENT_PRIVATE_KEY || process.env.SERVER_PRIVATE_KEY || process.env.MINTING_WALLET_PRIVATE_KEY;
        if (!privateKeyRaw) throw new Error('Facilitator wallet not configured');
        
        const wallet = new ethers.Wallet(privateKeyRaw.trim(), provider);
        console.log(`[x402] Facilitator: ${wallet.address}`);

        const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
        const votContract = new ethers.Contract(VOT_TOKEN_ADDRESS, ERC20_ABI, wallet);

        console.log(`[x402] Executing USDC transfer: ${usdcAmountNum} USDC`);
        const signature = permit.signature.startsWith('0x') ? permit.signature.slice(2) : permit.signature;
        const r = `0x${signature.slice(0, 64)}`;
        const s = `0x${signature.slice(64, 128)}`;
        let v = parseInt(signature.slice(128, 130), 16);
        if (v < 27) v += 27;

        console.log('[x402] TransferWithAuth params:', JSON.stringify({ from: permit.from, to: permit.to, value: permit.value, validAfter: permit.validAfter, validBefore: permit.validBefore, nonce: permit.nonce, v, r, s }));

        try {
            try {
                const authState = await usdcContract.authorizationState(permit.from, permit.nonce);
                console.log(`[x402] Auth state: ${authState}`);
                if (authState === true) {
                    return NextResponse.json({ success: false, error: 'Authorization already used. Try again.', code: 'NONCE_ALREADY_USED' }, { status: 400 });
                }
            } catch { console.log('[x402] Could not check auth state'); }

            const usdcTx = await usdcContract.transferWithAuthorization(permit.from, permit.to, permit.value, permit.validAfter, permit.validBefore, permit.nonce, v, r, s);
            const usdcReceipt = await usdcTx.wait();
            console.log(`[x402] USDC transferred: ${usdcReceipt.hash}`);
        } catch (usdcError: unknown) {
            console.error('[x402] USDC transfer failed:', usdcError);
            let errorMessage = 'USDC transfer failed';
            let errorCode = 'TRANSFER_FAILED';
            const errObj = usdcError as Record<string, unknown>;
            if (errObj.reason) {
                const reason = String(errObj.reason);
                if (reason.includes('invalid signature')) { errorCode = 'INVALID_SIGNATURE'; errorMessage = 'Invalid signature. Domain: name="USD Coin", version="2", chainId=8453'; }
                else if (reason.includes('authorization is used')) { errorCode = 'NONCE_USED'; errorMessage = 'Authorization already used.'; }
                else if (reason.includes('not yet valid')) { errorCode = 'NOT_VALID_YET'; errorMessage = 'Authorization not yet valid.'; }
                else if (reason.includes('expired')) { errorCode = 'EXPIRED'; errorMessage = 'Authorization expired.'; }
                else errorMessage = reason;
            }
            return NextResponse.json({ success: false, error: errorMessage, code: errorCode, debug: { from: permit.from, to: permit.to, value: permit.value, validAfter: permit.validAfter, validBefore: permit.validBefore, now, v, r, s } }, { status: 400 });
        }

        console.log(`[x402] Fetching VOT price...`);
        const votPriceUSD = await getVOTPriceUSD();
        const votAmountToSend = usdcAmountNum / votPriceUSD;
        const votAmountWei = ethers.parseUnits(votAmountToSend.toFixed(18), 18);
        console.log(`[x402] Rate: 1 VOT = $${votPriceUSD} -> ${votAmountToSend.toFixed(4)} VOT`);

        const votBalance = await votContract.balanceOf(wallet.address);
        const votBalanceFormatted = ethers.formatUnits(votBalance, 18);
        console.log(`[x402] VOT balance: ${votBalanceFormatted}`);

        if (votBalance < votAmountWei) {
            console.error(`[x402] VOT insufficient! Need ${votAmountToSend.toFixed(4)}, have ${votBalanceFormatted}`);
            return NextResponse.json({ success: false, error: 'VOT inventory depleted - USDC received, VOT pending', usdcReceived: true, required: votAmountToSend.toFixed(4), available: votBalanceFormatted }, { status: 503 });
        }

        console.log(`[x402] Sending ${votAmountToSend.toFixed(4)} VOT to ${walletAddress}`);
        const votTx = await votContract.transfer(walletAddress, votAmountWei);
        const votReceipt = await votTx.wait();
        console.log(`[x402] VOT transferred: ${votReceipt.hash}`);

        const remainingBalance = await votContract.balanceOf(wallet.address);
        const remainingFormatted = ethers.formatUnits(remainingBalance, 18);
        const lowInventory = remainingBalance < MIN_VOT_INVENTORY;

        return NextResponse.json({
            success: true,
            votAmount: votAmountToSend.toFixed(4),
            usdcAmount: usdcAmountNum.toString(),
            votPriceUSD,
            exchangeRate: `1 VOT = $${votPriceUSD}`,
            settlementTxHash: votReceipt.hash,
            txHash: votReceipt.hash,
            txLink: `https://basescan.org/tx/${votReceipt.hash}`,
            recipient: walletAddress,
            facilitator: wallet.address,
            executionMethod: 'x402_eip3009_transfer',
            priceSource: 'GeckoTerminal',
            receipt: { id: `vot-${Date.now()}-${walletAddress.slice(-6)}`, timestamp: new Date().toISOString(), payer: walletAddress, usdAmount: usdcAmountNum, status: 'processed' },
            network: { name: 'Base', chainId: 8453, explorer: 'https://basescan.org' },
            inventory: { remaining: parseFloat(remainingFormatted), lowWarning: lowInventory },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[x402] Buy VOT failed:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org');
        const privateKeyRaw = process.env.PRIVATE_KEY || process.env.X402_PAYMENT_PRIVATE_KEY || process.env.SERVER_PRIVATE_KEY || process.env.MINTING_WALLET_PRIVATE_KEY;
        let inventoryStatus = null;
        let currentPrice = null;
        try { currentPrice = await getVOTPriceUSD(); } catch { currentPrice = 'unavailable'; }
        
        if (privateKeyRaw) {
            const wallet = new ethers.Wallet(privateKeyRaw.trim(), provider);
            const votContract = new ethers.Contract(VOT_TOKEN_ADDRESS, ERC20_ABI, provider);
            const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
            const votBalance = await votContract.balanceOf(wallet.address);
            const usdcBalance = await usdcContract.balanceOf(wallet.address);
            inventoryStatus = { facilitatorAddress: wallet.address, votBalance: parseFloat(ethers.formatUnits(votBalance, 18)), usdcBalance: parseFloat(ethers.formatUnits(usdcBalance, 6)), lowInventory: votBalance < MIN_VOT_INVENTORY };
        }

        return NextResponse.json({
            status: 'active',
            endpoint: '/api/x402/buy-vot',
            description: 'x402 VOT Facilitator - Gasless VOT Distribution',
            currentPrice: { votPriceUSD: currentPrice, source: 'GeckoTerminal' },
            eip3009_domain: { name: 'USD Coin', version: '2', chainId: 8453, verifyingContract: USDC_ADDRESS },
            inventory: inventoryStatus,
            contracts: { votToken: VOT_TOKEN_ADDRESS, usdc: USDC_ADDRESS, treasury: TREASURY_ADDRESS },
            network: { name: 'Base', chainId: 8453 },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json({ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
