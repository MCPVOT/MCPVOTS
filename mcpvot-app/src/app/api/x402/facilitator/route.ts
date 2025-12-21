/**
 * x402 Unified Token Facilitator
 * 
 * Handles both VOT and MAXX token distribution via x402 payments
 * 
 * VOT FLOW (INSTANT DELIVERY!):
 * 1. User pays USDC via x402 → Treasury receives USDC
 * 2. IMMEDIATELY send VOT to user (full amount from inventory!)
 * 3. Treasury swaps: USDC → WETH → VOT (to replenish)
 * 4. Treasury burns 1% VOT from swapped amount (not from user!)
 * 
 * MAXX FLOW (uses native ETH, not WETH):
 * 1. User pays USDC via x402 → Treasury receives USDC
 * 2. Swap: USDC → ETH (native) → MAXX (via Kyber)
 * 3. Send MAXX to user
 * 4. BONUS: Send 10,000 VOT from treasury to user
 * 
 * CORS ENABLED: For IPFS-hosted HTML pages to call this API
 */

import { ethers } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// CORS HEADERS - Required for IPFS-hosted HTML pages to call this API
// =============================================================================
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
};

// Handle CORS preflight requests
export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Helper function to add CORS headers to all responses
function corsResponse<T>(data: T, options?: { status?: number }) {
    return NextResponse.json(data, { 
        status: options?.status || 200, 
        headers: CORS_HEADERS 
    });
}

// Token Addresses (Base Mainnet) - CORRECT ADDRESSES
const VOT_TOKEN_ADDRESS = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';  // VOT token
const MAXX_TOKEN_ADDRESS = '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467'; // MAXX token (correct)
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';        // USDC (6 decimals)
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';        // WETH (for VOT swaps)
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';         // Native ETH (for MAXX swaps)
const TREASURY_ADDRESS = '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa';   // mcpvot.eth

// Pool Addresses (for price lookup)
const VOT_WETH_POOL = '0xb7730dd50a401a0e57c7438e6d532b6aeccea33254834f4ebfe8311e46f2ce2c';  // VOT/WETH Uniswap V4
const MAXX_ETH_POOL = '0x11bb2563a35b46d4086eec991dd5f374d8122a69e7998da1706454d4ee298148';  // MAXX/ETH pool

// Kyber Aggregator
const KYBER_API = 'https://aggregator-api.kyberswap.com/base/api/v1';

// Config
const VOT_BURN_PERCENTAGE = 1; // 1% burn on VOT purchases
const MAXX_VOT_BONUS = ethers.parseUnits('10000', 18); // 10,000 VOT bonus for MAXX purchases
const SUPPORTED_AMOUNTS = [1, 10, 100, 1000];

// Gas & Rate Limiting Config
const MIN_GAS_BUFFER_ETH = 0.01; // Minimum 0.01 ETH (~$25) for gas
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 200; // Delay between API calls to avoid rate limits

// Retry helper with exponential backoff
async function executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = MAX_RETRIES
): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            console.warn(`[x402] ${operationName} attempt ${attempt}/${maxRetries} failed:`, lastError.message);
            if (attempt < maxRetries) {
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    throw new Error(`${operationName} failed after ${maxRetries} attempts: ${lastError?.message}`);
}

// Rate-limited fetch wrapper
async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
    await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS));
    return fetch(url, options);
}

// Gas buffer check
async function checkGasBuffer(provider: ethers.Provider): Promise<{ hasEnough: boolean; balance: bigint; required: bigint }> {
    const balance = await provider.getBalance(TREASURY_ADDRESS);
    const required = ethers.parseEther(MIN_GAS_BUFFER_ETH.toString());
    return {
        hasEnough: balance >= required,
        balance,
        required
    };
}

const ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function burn(uint256 amount)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external',
    'function authorizationState(address authorizer, bytes32 nonce) view returns (bool)'
];

const WETH_ABI = [
    ...ERC20_ABI,
    'function deposit() payable',
    'function withdraw(uint256 amount)'
];

// Price APIs
async function getTokenPriceUSD(token: 'VOT' | 'MAXX'): Promise<number> {
    const pool = token === 'VOT' ? VOT_WETH_POOL : MAXX_ETH_POOL;
    try {
        const response = await fetch(
            `https://api.geckoterminal.com/api/v2/networks/base/pools/${pool}`,
            { headers: { 'Accept': 'application/json' } }
        );
        if (response.ok) {
            const data = await response.json();
            const price = parseFloat(data.data?.attributes?.base_token_price_usd);
            if (price && price > 0) {
                console.log(`[x402] ${token} price: $${price}`);
                return price;
            }
        }
        throw new Error(`Could not fetch ${token} price`);
    } catch (error) {
        console.error(`Price fetch error for ${token}:`, error);
        throw new Error(`Failed to get ${token} price`);
    }
}

// Kyber swap helper with retry and rate limiting
// Kyber headers that WORK (from kyber_client.py)
const KYBER_HEADERS = {
    'X-Client-Id': 'x402-facilitator',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Origin': 'https://kyberswap.com',
    'Referer': 'https://kyberswap.com/'
};

async function getKyberQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
): Promise<{ amountOut: bigint; routerAddress: string; data: string; transactionValue?: string; priceImpact?: number }> {
    return executeWithRetry(async () => {
        // Build route URL with ALL required params (from working kyber_client.py)
        const routeParams = new URLSearchParams({
            tokenIn,
            tokenOut,
            amountIn: amountIn.toString(),
            gasInclude: 'true',           // Critical for accurate gas estimation
            onlySinglePath: 'true',       // Simpler paths = fewer failures
            onlyDirectPools: 'true',      // Direct pools more reliable
            excludeRFQSources: 'true'     // RFQ can timeout/fail
        });
        
        console.log(`[x402] Kyber route: ${KYBER_API}/routes?${routeParams.toString()}`);
        
        const routeResp = await rateLimitedFetch(
            `${KYBER_API}/routes?${routeParams.toString()}`,
            { headers: KYBER_HEADERS }
        );
        
        if (!routeResp.ok) {
            const errorText = await routeResp.text();
            if (routeResp.status === 429) {
                throw new Error('Kyber rate limited - will retry');
            }
            throw new Error(`Kyber route failed (${routeResp.status}): ${errorText}`);
        }
        
        const routeData = await routeResp.json();
        if (!routeData.data?.routeSummary) {
            console.error('[x402] Kyber route response:', JSON.stringify(routeData, null, 2));
            throw new Error('No Kyber route found');
        }
        
        const route = routeData.data.routeSummary;
        const priceImpact = parseFloat(route.priceImpact || '0');
        
        // Warn on high price impact
        if (priceImpact > 0.05) {
            console.warn(`[x402] High price impact: ${(priceImpact * 100).toFixed(2)}%`);
        }
        
        console.log(`[x402] Kyber route found: ${route.amountIn} ${tokenIn} → ${route.amountOut} ${tokenOut}`);
        
        // Build swap tx with ALL required params (from working kyber_client.py)
        const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 min deadline
        
        const buildBody = {
            routeSummary: route,
            sender: TREASURY_ADDRESS,
            recipient: TREASURY_ADDRESS,
            slippageTolerance: 500,         // 5% slippage
            source: 'x402-facilitator',     // Critical: identifies our client
            deadline: deadline,              // Critical: prevents stale tx
            enableGasEstimation: true       // Critical: accurate gas
        };
        
        console.log(`[x402] Kyber build request with deadline ${deadline}`);
        
        const buildResp = await rateLimitedFetch(`${KYBER_API}/route/build`, {
            method: 'POST',
            headers: KYBER_HEADERS,
            body: JSON.stringify(buildBody)
        });
        
        if (!buildResp.ok) {
            const buildError = await buildResp.text();
            if (buildResp.status === 429) {
                throw new Error('Kyber rate limited - will retry');
            }
            // Try legacy encode fallback
            console.warn(`[x402] Build failed (${buildResp.status}): ${buildError}, trying legacy encode...`);
            return await legacyKyberEncode(route, tokenIn, tokenOut, amountIn);
        }
        
        const buildData = await buildResp.json();
        if (!buildData.data) {
            console.error('[x402] Kyber build response:', JSON.stringify(buildData, null, 2));
            throw new Error('No Kyber tx data');
        }
        
        console.log(`[x402] Kyber build success. Router: ${buildData.data.routerAddress}`);
        if (buildData.data.transactionValue) {
            console.log(`[x402] TransactionValue for ETH swap: ${buildData.data.transactionValue}`);
        }
        
        return {
            amountOut: BigInt(route.amountOut),
            routerAddress: buildData.data.routerAddress,
            data: buildData.data.data,
            transactionValue: buildData.data.transactionValue, // For native ETH swaps!
            priceImpact
        };
    }, 'getKyberQuote');
}

// Kyber route type for type safety
interface KyberRouteSummary {
    amountIn: string;
    amountOut: string;
    priceImpact?: string;
    gas?: string;
    [key: string]: unknown;
}

// Legacy encode fallback (from kyber_client.py)
async function legacyKyberEncode(
    route: KyberRouteSummary,
    tokenIn: string,
    _tokenOut: string, // Prefixed with underscore as unused in fallback
    amountIn: bigint
): Promise<{ amountOut: bigint; routerAddress: string; data: string; transactionValue?: string; priceImpact?: number }> {
    console.log('[x402] Using legacy Kyber encode fallback...');
    
    const routerAddress = '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5'; // Base Kyber router
    
    // Minimal output with 10% slippage
    const minOut = BigInt(route.amountOut) * 90n / 100n;
    
    // For legacy fallback, use a simpler approach - just fail with info
    // The modern API should work with proper headers/params
    console.error('[x402] Legacy encode reached - this indicates Kyber API issues');
    console.error(`[x402] Route: ${route.amountIn} → ${route.amountOut}, minOut: ${minOut.toString()}`);
    
    // Return a minimal structure that will likely fail but provide debug info
    // The real fix is to ensure modern API works with proper headers
    const txValue = tokenIn.toLowerCase() === ETH_ADDRESS.toLowerCase() ? amountIn.toString() : undefined;
    
    return {
        amountOut: BigInt(route.amountOut),
        routerAddress,
        data: '0x', // Empty data - will fail but logs will show we hit fallback
        transactionValue: txValue,
        priceImpact: parseFloat(route.priceImpact || '0')
    };
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
    } catch {
        return null;
    }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Rate limiting - simple in-memory store (resets on cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per wallet

function checkRateLimit(walletAddress: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const key = walletAddress.toLowerCase();
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
    }
    
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return { allowed: false, remaining: 0 };
    }
    
    record.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

export async function POST(req: NextRequest) {
    const requestId = `x402-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    console.log(`[${requestId}] x402 Facilitator request received`);
    
    try {
        // x402 V2: Accept both PAYMENT-SIGNATURE (v2) and X-PAYMENT (v1 legacy) headers
        const paymentHeader = req.headers.get('Payment-Signature') || 
                              req.headers.get('payment-signature') ||
                              req.headers.get('X-PAYMENT') || 
                              req.headers.get('x-payment');
        const body = await req.json();
        const { 
            usdcAmount = '1', 
            walletAddress, 
            token = 'VOT' // 'VOT' or 'MAXX'
        } = body;

        // Validate wallet address
        if (!walletAddress || !ethers.isAddress(walletAddress)) {
            console.warn(`[${requestId}] Invalid wallet address: ${walletAddress}`);
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid wallet address' 
            }, { status: 400 });
        }

        // Rate limiting check
        const rateLimit = checkRateLimit(walletAddress);
        if (!rateLimit.allowed) {
            console.warn(`[${requestId}] Rate limit exceeded for ${walletAddress}`);
            return NextResponse.json({ 
                success: false, 
                error: 'Rate limit exceeded. Please wait 1 minute.',
                retryAfter: 60
            }, { 
                status: 429,
                headers: {
                    'Retry-After': '60',
                    'X-RateLimit-Remaining': '0'
                }
            });
        }

        const tokenType = token.toUpperCase() as 'VOT' | 'MAXX';
        if (!['VOT', 'MAXX'].includes(tokenType)) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid token type. Use VOT or MAXX' 
            }, { status: 400 });
        }

        const usdcAmountNum = parseFloat(usdcAmount);
        if (isNaN(usdcAmountNum) || usdcAmountNum <= 0 || usdcAmountNum > 10000) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid USDC amount (1-10000)' 
            }, { status: 400 });
        }

        // Request logging (no IP/personal data for privacy)
        console.log(`[${requestId}] Request: wallet=${walletAddress.slice(0,10)}..., token=${tokenType}, amount=$${usdcAmountNum}`);

        // 402 Payment Required - x402 V2 spec compliant response
        if (!paymentHeader) {
            const usdcAtomicAmount = ethers.parseUnits(usdcAmountNum.toString(), 6).toString();
            console.log(`[${requestId}] Returning 402 Payment Required for ${tokenType}`);
            
            // x402 V2 spec compliant response with CAIP-2 network format
            return NextResponse.json({
                x402Version: 2, // Updated to V2
                error: 'Payment Required',
                accepts: [{
                    scheme: 'exact',
                    network: 'eip155:8453', // V2 CAIP-2 format for Base
                    maxAmountRequired: usdcAtomicAmount,
                    resource: `https://mcpvot.vercel.app/api/x402/facilitator`,
                    description: `Purchase ${tokenType} tokens - MCPVOT x402 Facilitator`,
                    mimeType: 'application/json',
                    payTo: TREASURY_ADDRESS,
                    maxTimeoutSeconds: 300,
                    asset: USDC_ADDRESS,
                    extra: {
                        name: 'USD Coin',
                        version: '2',
                        token: tokenType,
                        tokenAddress: tokenType === 'VOT' ? VOT_TOKEN_ADDRESS : MAXX_TOKEN_ADDRESS,
                        usdcAmount: usdcAmountNum,
                        walletAddress,
                        burnPct: tokenType === 'VOT' ? VOT_BURN_PERCENTAGE : 0,
                        votBonus: tokenType === 'MAXX' ? '10000' : '0',
                        facilitator: 'MCPVOT x402 CDP',
                        features: tokenType === 'VOT' 
                            ? ['instant-delivery', '1%-burn', 'gasless']
                            : ['kyber-swap', '10k-vot-bonus', 'gasless']
                    }
                }],
                // V2 format for paymentRequirements
                paymentRequirements: {
                    scheme: 'exact',
                    network: 'eip155:8453', // V2 CAIP-2 format
                    maxAmountRequired: usdcAtomicAmount,
                    asset: USDC_ADDRESS,
                    payTo: TREASURY_ADDRESS,
                    maxTimeoutSeconds: 300,
                    description: `x402 ${tokenType} Facilitator - ${usdcAmountNum} USDC`,
                    extra: { 
                        token: tokenType,
                        usdcAmount: usdcAmountNum, 
                        walletAddress,
                        burnPct: tokenType === 'VOT' ? VOT_BURN_PERCENTAGE : 0,
                        votBonus: tokenType === 'MAXX' ? '10000' : '0'
                    }
                }
            }, { 
                status: 402,
                headers: {
                    // x402 V2: Use standardized PAYMENT-REQUIRED header
                    'Payment-Required': JSON.stringify({
                        scheme: 'exact',
                        network: 'eip155:8453',
                        maxAmountRequired: usdcAtomicAmount,
                        asset: USDC_ADDRESS,
                        payTo: TREASURY_ADDRESS
                    }),
                    // Legacy headers for V1 compatibility
                    'X-Payment-Required': 'true',
                    'X-Payment-Token': tokenType,
                    'X-Payment-Amount': usdcAtomicAmount,
                    'X-Payment-Network': 'eip155:8453',
                    'X-402-Version': '2'
                }
            });
        }

        // Decode payment
        const paymentData = decodePaymentHeader(paymentHeader);
        if (!paymentData?.permit) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid payment header' 
            }, { status: 400 });
        }

        const { permit } = paymentData;

        // Validate permit - ensure from is user, not treasury
        if (permit.from.toLowerCase() !== walletAddress.toLowerCase()) {
            console.error(`[x402] Permit from mismatch: permit.from=${permit.from}, walletAddress=${walletAddress}`);
            return NextResponse.json({ 
                success: false, 
                error: 'Payment signature mismatch - permit.from must be user wallet' 
            }, { status: 403 });
        }

        // CRITICAL: Prevent self-transfer exploit (from == to)
        if (permit.from.toLowerCase() === permit.to.toLowerCase()) {
            console.error(`[x402] CRITICAL: Self-transfer detected! from=${permit.from}, to=${permit.to}`);
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid payment: self-transfer not allowed' 
            }, { status: 403 });
        }

        // Validate permit.to is treasury
        if (permit.to.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) {
            console.error(`[x402] Invalid recipient: permit.to=${permit.to}, expected=${TREASURY_ADDRESS}`);
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid payment recipient' 
            }, { status: 403 });
        }

        // Setup provider and wallet
        const provider = new ethers.JsonRpcProvider(
            process.env.INFURA_BASE_ENDPOINT || 
            process.env.NEXT_PUBLIC_BASE_RPC_URL || 
            'https://mainnet.base.org'
        );
        
        // Check multiple possible env var names for the treasury private key
        const privateKey = process.env.TREASURY_PRIVATE_KEY || 
                          process.env.SERVER_PRIVATE_KEY ||  // Vercel uses this name
                          process.env.PRIVATE_KEY || 
                          process.env.BASE_WALLET_PRIVATE_KEY;
        if (!privateKey) {
            console.error('[x402] CRITICAL: No treasury private key found in env vars');
            console.error('[x402] Checked: TREASURY_PRIVATE_KEY, SERVER_PRIVATE_KEY, PRIVATE_KEY, BASE_WALLET_PRIVATE_KEY');
            throw new Error('Treasury wallet not configured - missing SERVER_PRIVATE_KEY env var');
        }
        
        const wallet = new ethers.Wallet(privateKey.trim(), provider);
        console.log(`[x402] Facilitator: ${wallet.address}`);

        // Contracts
        const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
        const votContract = new ethers.Contract(VOT_TOKEN_ADDRESS, ERC20_ABI, wallet);
        const maxxContract = new ethers.Contract(MAXX_TOKEN_ADDRESS, ERC20_ABI, wallet);
        const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, wallet);

        // Execute USDC transfer from user
        console.log(`[x402] Processing ${usdcAmountNum} USDC for ${tokenType}`);
        
        // CRITICAL VALIDATION: Prevent self-transfer bug!
        // The permit.from should be the USER's wallet, not the treasury
        if (permit.from.toLowerCase() === wallet.address.toLowerCase()) {
            console.error(`[x402] CRITICAL: Self-transfer detected! permit.from=${permit.from} equals treasury=${wallet.address}`);
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid payment: cannot transfer from treasury to treasury. Check wallet connection.' 
            }, { status: 400 });
        }
        
        // Also validate permit.to is treasury
        if (permit.to.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) {
            console.error(`[x402] CRITICAL: Invalid destination! permit.to=${permit.to} should be ${TREASURY_ADDRESS}`);
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid payment destination' 
            }, { status: 400 });
        }
        
        console.log(`[x402] Transfer: ${permit.from} → ${permit.to} (${permit.value} atomic USDC)`);
        
        const sig = permit.signature.startsWith('0x') ? permit.signature.slice(2) : permit.signature;
        const r = `0x${sig.slice(0, 64)}`;
        const s = `0x${sig.slice(64, 128)}`;
        let v = parseInt(sig.slice(128, 130), 16);
        if (v < 27) v += 27;

        const usdcTx = await usdcContract.transferWithAuthorization(
            permit.from, permit.to, permit.value,
            permit.validAfter, permit.validBefore, permit.nonce,
            v, r, s
        );
        const usdcReceipt = await usdcTx.wait();
        console.log(`[x402] USDC received: ${usdcReceipt.hash}`);

        const usdcWei = ethers.parseUnits(usdcAmountNum.toString(), 6);
        const results: {
            token: string;
            usdcAmount: number;
            tokenAmount: string;
            burnAmount?: string;
            votBonus?: string;
            txHashes: string[];
            recipient: string;
        } = {
            token: tokenType,
            usdcAmount: usdcAmountNum,
            tokenAmount: '0',
            txHashes: [usdcReceipt.hash],
            recipient: walletAddress
        };

        if (tokenType === 'VOT') {
            // ============================================
            // VOT FLOW: INSTANT DELIVERY!
            // 1. Calculate VOT amount based on current price
            // 2. IMMEDIATELY send VOT to user from treasury inventory
            // 3. Treasury swaps USDC → WETH → VOT (to replenish) - NON-BLOCKING
            // 4. Treasury burns 1% from swapped VOT (NOT from user's amount!)
            // ============================================
            
            // Step 1: Get VOT price and calculate amount for user
            const votPrice = await getTokenPriceUSD('VOT');
            const votAmountForUser = ethers.parseUnits(
                (usdcAmountNum / votPrice).toFixed(18), 
                18
            );
            console.log(`[x402] VOT price: $${votPrice}, User gets: ${ethers.formatUnits(votAmountForUser, 18)} VOT`);
            
            // Step 2: Check treasury has enough VOT inventory
            const treasuryVotBalance = await votContract.balanceOf(wallet.address);
            console.log(`[x402] Treasury VOT balance: ${ethers.formatUnits(treasuryVotBalance, 18)}`);
            
            if (treasuryVotBalance < votAmountForUser) {
                return NextResponse.json({
                    success: false,
                    error: 'Insufficient VOT inventory',
                    message: 'Treasury needs to replenish VOT. Try again in a few minutes.',
                    available: ethers.formatUnits(treasuryVotBalance, 18),
                    requested: ethers.formatUnits(votAmountForUser, 18)
                }, { status: 503 });
            }
            
            // Step 3: IMMEDIATELY send VOT to user (INSTANT!)
            console.log(`[x402] 📤 INSTANT: Sending ${ethers.formatUnits(votAmountForUser, 18)} VOT to ${walletAddress}...`);
            const sendTx = await votContract.transfer(walletAddress, votAmountForUser);
            const sendReceipt = await sendTx.wait();
            console.log(`[x402] ✅ VOT sent to user: ${sendReceipt.hash}`);
            results.txHashes.push(sendReceipt.hash);
            results.tokenAmount = ethers.formatUnits(votAmountForUser, 18);
            
            // ============================================
            // TREASURY REPLENISHMENT (NON-BLOCKING for user!)
            // User already got their VOT - now we replenish
            // ============================================
            let replenishSuccess = false;
            let replenishError = '';
            const swapTxHashes: string[] = [];
            let burnAmount = 0n;
            
            try {
                // Check USDC balance first
                const treasuryUsdcBalance = await usdcContract.balanceOf(wallet.address);
                console.log(`[x402] Treasury USDC balance: ${ethers.formatUnits(treasuryUsdcBalance, 6)}`);
                
                if (treasuryUsdcBalance < usdcWei) {
                    throw new Error(`Insufficient USDC for replenishment: have ${ethers.formatUnits(treasuryUsdcBalance, 6)}, need ${ethers.formatUnits(usdcWei, 6)}`);
                }
                
                // *** CRITICAL FIX: Track balances BEFORE swaps ***
                const wethBalanceBefore = await wethContract.balanceOf(wallet.address);
                const votBalanceBefore = await votContract.balanceOf(wallet.address);
                console.log(`[x402] Treasury balances BEFORE replenish: WETH=${ethers.formatEther(wethBalanceBefore)}, VOT=${ethers.formatUnits(votBalanceBefore, 18)}`);
                
                // Step 4: Treasury replenishes - Swap USDC → WETH
                console.log('[x402] 🔄 Treasury replenishing: USDC → WETH...');
                console.log(`[x402] Kyber quote request: ${USDC_ADDRESS} → ${WETH_ADDRESS}, amount: ${usdcWei.toString()}`);
                
                const usdcToWethQuote = await getKyberQuote(USDC_ADDRESS, WETH_ADDRESS, usdcWei);
                console.log(`[x402] Kyber route found. Router: ${usdcToWethQuote.routerAddress}`);
                
                // Approve USDC for Kyber
                const usdcAllowance = await usdcContract.allowance(wallet.address, usdcToWethQuote.routerAddress);
                console.log(`[x402] USDC allowance: ${ethers.formatUnits(usdcAllowance, 6)}`);
                
                if (usdcAllowance < usdcWei) {
                    console.log('[x402] Approving USDC for Kyber...');
                    const approveTx = await usdcContract.approve(usdcToWethQuote.routerAddress, ethers.MaxUint256);
                    await approveTx.wait();
                    console.log('[x402] USDC approved');
                }
                
                // Execute USDC → WETH swap
                console.log('[x402] Executing USDC → WETH swap...');
                const swapTx1 = await wallet.sendTransaction({
                    to: usdcToWethQuote.routerAddress,
                    data: usdcToWethQuote.data,
                    gasLimit: 500000 // Increased gas limit
                });
                const swapReceipt1 = await swapTx1.wait();
                console.log(`[x402] ✅ USDC → WETH: ${swapReceipt1?.hash}`);
                swapTxHashes.push(swapReceipt1?.hash || '');

                // *** CRITICAL FIX: Calculate ACTUAL WETH received (not total balance) ***
                const wethBalanceAfterSwap1 = await wethContract.balanceOf(wallet.address);
                const wethReceived = wethBalanceAfterSwap1 - wethBalanceBefore;
                console.log(`[x402] WETH balance after swap: ${ethers.formatEther(wethBalanceAfterSwap1)}`);
                console.log(`[x402] WETH actually received from swap: ${ethers.formatEther(wethReceived)}`);
                
                if (wethReceived <= 0n) {
                    throw new Error(`WETH swap returned 0 - Before: ${ethers.formatEther(wethBalanceBefore)}, After: ${ethers.formatEther(wethBalanceAfterSwap1)}`);
                }

                // Step 5: Swap WETH → VOT via Kyber (replenish treasury)
                // *** CRITICAL FIX: Use only the WETH we received, not total balance ***
                console.log('[x402] 🔄 Treasury replenishing: WETH → VOT...');
                console.log(`[x402] Kyber quote request: ${WETH_ADDRESS} → ${VOT_TOKEN_ADDRESS}, amount: ${wethReceived.toString()}`);
                
                const wethToVotQuote = await getKyberQuote(WETH_ADDRESS, VOT_TOKEN_ADDRESS, wethReceived);
                console.log(`[x402] Kyber route found. Router: ${wethToVotQuote.routerAddress}`);
                
                // Approve WETH for Kyber
                const wethAllowance = await wethContract.allowance(wallet.address, wethToVotQuote.routerAddress);
                console.log(`[x402] WETH allowance: ${ethers.formatEther(wethAllowance)}`);
                
                if (wethAllowance < wethReceived) {
                    console.log('[x402] Approving WETH for Kyber...');
                    const approveTx = await wethContract.approve(wethToVotQuote.routerAddress, ethers.MaxUint256);
                    await approveTx.wait();
                    console.log('[x402] WETH approved');
                }
                
                // Execute WETH → VOT swap
                console.log('[x402] Executing WETH → VOT swap...');
                const swapTx2 = await wallet.sendTransaction({
                    to: wethToVotQuote.routerAddress,
                    data: wethToVotQuote.data,
                    gasLimit: 500000 // Increased gas limit
                });
                const swapReceipt2 = await swapTx2.wait();
                console.log(`[x402] ✅ WETH → VOT: ${swapReceipt2?.hash}`);
                swapTxHashes.push(swapReceipt2?.hash || '');

                // *** CRITICAL FIX: Calculate ACTUAL VOT received (not estimated) ***
                const votBalanceAfterSwap = await votContract.balanceOf(wallet.address);
                const votActuallyReceived = votBalanceAfterSwap - votBalanceBefore;
                console.log(`[x402] VOT balance after swap: ${ethers.formatUnits(votBalanceAfterSwap, 18)}`);
                console.log(`[x402] VOT actually received from swap: ${ethers.formatUnits(votActuallyReceived, 18)}`);
                console.log(`[x402] VOT estimated was: ${ethers.formatUnits(wethToVotQuote.amountOut, 18)}`);

                if (votActuallyReceived <= 0n) {
                    throw new Error(`WETH→VOT swap returned 0 VOT - Before: ${ethers.formatUnits(votBalanceBefore, 18)}, After: ${ethers.formatUnits(votBalanceAfterSwap, 18)}`);
                }

                // Step 6: Treasury burns 1% from ACTUAL VOT received (NOT estimated!)
                burnAmount = (votActuallyReceived * BigInt(VOT_BURN_PERCENTAGE)) / 100n;
                
                console.log(`[x402] 🔥 Treasury burning ${ethers.formatUnits(burnAmount, 18)} VOT (1% of ${ethers.formatUnits(votActuallyReceived, 18)} received)...`);
                const burnTx = await votContract.burn(burnAmount);
                const burnReceipt = await burnTx.wait();
                console.log(`[x402] ✅ VOT burned: ${burnReceipt.hash}`);
                swapTxHashes.push(burnReceipt.hash);
                
                replenishSuccess = true;
                console.log(`[x402] ✅ Treasury replenishment complete! VOT replenished: ${ethers.formatUnits(votActuallyReceived, 18)}, burned: ${ethers.formatUnits(burnAmount, 18)}`);
                
            } catch (replenishErr) {
                replenishError = replenishErr instanceof Error ? replenishErr.message : 'Unknown replenish error';
                console.error(`[x402] ⚠️ Treasury replenishment failed: ${replenishError}`);
                console.error('[x402] User already received VOT - replenishment will be retried manually');
            }
            
            // Add replenish tx hashes to results
            results.txHashes.push(...swapTxHashes);
            results.burnAmount = replenishSuccess 
                ? ethers.formatUnits(burnAmount, 18) + ' (treasury burn, user got full amount!)'
                : `0 (replenishment pending: ${replenishError})`;

        } else {
            // ============================================
            // MAXX FLOW: USDC → ETH (native) → MAXX + 10,000 VOT bonus
            // MAXX uses native ETH, NOT WETH!
            // ============================================
            
            // Gas buffer check - MAXX needs more gas for multiple swaps
            const gasCheck = await checkGasBuffer(provider);
            if (!gasCheck.hasEnough) {
                console.warn(`[x402] ⚠️ Low gas buffer: ${ethers.formatEther(gasCheck.balance)} ETH (need ${ethers.formatEther(gasCheck.required)})`);
                // Continue anyway but log warning - don't block users
            }
            
            // Step 1: Swap USDC → ETH (native) via Kyber
            console.log('[x402] MAXX: Swapping USDC → ETH (native)...');
            const usdcToEthQuote = await getKyberQuote(USDC_ADDRESS, ETH_ADDRESS, usdcWei);
            
            // Track balances BEFORE swaps (critical for calculating actual received amounts!)
            const maxxBalanceBefore = await maxxContract.balanceOf(wallet.address);
            const ethBalanceBefore = await provider.getBalance(wallet.address);
            console.log(`[x402] MAXX balance BEFORE swaps: ${ethers.formatUnits(maxxBalanceBefore, 18)}`);
            console.log(`[x402] ETH balance BEFORE swaps: ${ethers.formatEther(ethBalanceBefore)}`);
            
            const usdcAllowance = await usdcContract.allowance(wallet.address, usdcToEthQuote.routerAddress);
            if (usdcAllowance < usdcWei) {
                console.log('[x402] Approving USDC for Kyber...');
                const approveTx = await usdcContract.approve(usdcToEthQuote.routerAddress, ethers.MaxUint256);
                await approveTx.wait();
            }
            
            const swapTx1 = await wallet.sendTransaction({
                to: usdcToEthQuote.routerAddress,
                data: usdcToEthQuote.data,
                gasLimit: 500000 // Increased for reliability
            });
            const swapReceipt1 = await swapTx1.wait();
            console.log(`[x402] ✅ USDC → ETH: ${swapReceipt1?.hash}`);
            results.txHashes.push(swapReceipt1?.hash || '');

            // Get ETH balance AFTER swap and calculate how much we ACTUALLY received
            const ethBalanceAfterSwap = await provider.getBalance(wallet.address);
            console.log(`[x402] Treasury ETH after USDC→ETH: ${ethers.formatEther(ethBalanceAfterSwap)}`);
            
            // CRITICAL: Only use the ETH we received from this swap, NOT the entire balance!
            // The previous code used entire balance which drained treasury of pre-existing ETH!
            const ethReceivedFromSwap = ethBalanceAfterSwap - ethBalanceBefore;
            console.log(`[x402] ETH received from USDC swap: ${ethers.formatEther(ethReceivedFromSwap)}`);
            
            if (ethReceivedFromSwap <= 0n) {
                throw new Error(`USDC→ETH swap returned 0 ETH. Before: ${ethers.formatEther(ethBalanceBefore)}, After: ${ethers.formatEther(ethBalanceAfterSwap)}`);
            }
            
            // Use ONLY the ETH from the swap for the next swap
            const ethToSwap = ethReceivedFromSwap;
            console.log(`[x402] ETH to swap for MAXX: ${ethers.formatEther(ethToSwap)}`);

            // Step 2: Swap ETH (native) → MAXX via Kyber
            console.log('[x402] MAXX: Swapping ETH → MAXX...');
            const ethToMaxxQuote = await getKyberQuote(ETH_ADDRESS, MAXX_TOKEN_ADDRESS, ethToSwap);
            
            // ETH swap needs value sent with tx (native ETH)
            // Use transactionValue from quote if available (from kyber_client.py pattern)
            const txValue = ethToMaxxQuote.transactionValue 
                ? BigInt(ethToMaxxQuote.transactionValue)
                : ethToSwap;
            
            console.log(`[x402] ETH→MAXX tx value: ${ethers.formatEther(txValue)}`);
            
            const swapTx2 = await wallet.sendTransaction({
                to: ethToMaxxQuote.routerAddress,
                data: ethToMaxxQuote.data,
                value: txValue,  // Send native ETH with tx
                gasLimit: 500000 // Increased gas limit for complex swaps
            });
            const swapReceipt2 = await swapTx2.wait();
            console.log(`[x402] ✅ ETH → MAXX: ${swapReceipt2?.hash}`);
            results.txHashes.push(swapReceipt2?.hash || '');

            // Get ACTUAL MAXX balance after swap (not quote amount!)
            const actualMaxxBalance = await maxxContract.balanceOf(wallet.address);
            console.log(`[x402] MAXX balance after swap: ${ethers.formatUnits(actualMaxxBalance, 18)}`);
            
            // Calculate how much MAXX we actually received from this swap
            // CRITICAL: Only send the difference, NOT the entire treasury balance!
            const maxxReceived = actualMaxxBalance - maxxBalanceBefore;
            console.log(`[x402] MAXX received from swap: ${ethers.formatUnits(maxxReceived, 18)}`);
            
            if (maxxReceived <= 0n) {
                throw new Error(`ETH→MAXX swap returned 0 MAXX - check Kyber route. Before: ${ethers.formatUnits(maxxBalanceBefore, 18)}, After: ${ethers.formatUnits(actualMaxxBalance, 18)}`);
            }

            // Step 3: Send ONLY the swapped MAXX to user (not entire balance!)
            console.log(`[x402] 📤 Sending ${ethers.formatUnits(maxxReceived, 18)} MAXX to ${walletAddress}...`);
            const sendMaxxTx = await maxxContract.transfer(walletAddress, maxxReceived);
            const sendMaxxReceipt = await sendMaxxTx.wait();
            console.log(`[x402] ✅ MAXX sent: ${sendMaxxReceipt.hash}`);
            results.txHashes.push(sendMaxxReceipt.hash);
            results.tokenAmount = ethers.formatUnits(maxxReceived, 18);

            // Step 4: BONUS - Send 10,000 VOT to user
            console.log(`[x402] 🎁 Sending 10,000 VOT bonus to ${walletAddress}...`);
            const votBalance = await votContract.balanceOf(wallet.address);
            
            if (votBalance >= MAXX_VOT_BONUS) {
                const bonusTx = await votContract.transfer(walletAddress, MAXX_VOT_BONUS);
                const bonusReceipt = await bonusTx.wait();
                results.txHashes.push(bonusReceipt.hash);
                results.votBonus = '10000';
                console.log(`[x402] ✅ VOT bonus sent: ${bonusReceipt.hash}`);
            } else {
                console.warn(`[x402] ⚠️ Insufficient VOT for bonus (have: ${ethers.formatUnits(votBalance, 18)}, need: 10000)`);
                results.votBonus = '0 (insufficient treasury balance)';
            }
        }

        // For MAXX: settlementTxHash = MAXX transfer (token delivery)
        // For VOT: settlementTxHash = VOT transfer to user
        // We want to show the main token delivery, not the bonus
        let settlementTxHash = '';
        let bonusTxHash = '';
        
        if (tokenType === 'MAXX' && results.txHashes.length >= 2) {
            // MAXX flow: [USDC, USDC→ETH swap, ETH→MAXX swap, MAXX transfer, VOT bonus]
            // The MAXX transfer is second to last (before VOT bonus)
            if (results.votBonus && results.votBonus !== '0 (insufficient treasury balance)') {
                settlementTxHash = results.txHashes[results.txHashes.length - 2]; // MAXX transfer
                bonusTxHash = results.txHashes[results.txHashes.length - 1]; // VOT bonus
            } else {
                settlementTxHash = results.txHashes[results.txHashes.length - 1]; // MAXX transfer (no bonus)
            }
        } else if (results.txHashes.length > 0) {
            settlementTxHash = results.txHashes[results.txHashes.length - 1];
        }
        
        // Generate receipt ID from TX hash
        const receiptId = settlementTxHash 
            ? `x402-${settlementTxHash.slice(0, 10)}-${Date.now().toString(36)}`
            : `x402-pending-${Date.now().toString(36)}`;
        
        return NextResponse.json({
            success: true,
            ...results,
            settlementTxHash, // Primary TX for UI display (MAXX/VOT transfer)
            bonusTxHash: bonusTxHash || null, // VOT bonus TX (MAXX flow only)
            txHash: settlementTxHash, // Alias for compatibility
            receipt: {
                id: receiptId,
                hash: settlementTxHash,
                bonusHash: bonusTxHash || null,
                timestamp: new Date().toISOString(),
                token: tokenType,
                amount: results.tokenAmount,
                recipient: walletAddress
            },
            flow: tokenType === 'VOT'
                ? `USDC(${usdcAmountNum}) → INSTANT VOT to user → Treasury replenishes + burns 1%`
                : `USDC(${usdcAmountNum}) → ETH → MAXX → Send + 10K VOT bonus`,
            treasury: TREASURY_ADDRESS,
            network: { name: 'Base', chainId: 8453 },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[x402] Facilitator error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const requestedToken = (searchParams.get('token') || 'VOT').toUpperCase() as 'VOT' | 'MAXX';

    try {
        const [votPrice, maxxPrice] = await Promise.all([
            getTokenPriceUSD('VOT').catch(() => null),
            getTokenPriceUSD('MAXX').catch(() => null)
        ]);

        const provider = new ethers.JsonRpcProvider(
            process.env.INFURA_BASE_ENDPOINT || 'https://mainnet.base.org'
        );
        
        let inventory = null;
        const privateKey = process.env.TREASURY_PRIVATE_KEY || 
                          process.env.SERVER_PRIVATE_KEY ||  // Vercel uses this name
                          process.env.PRIVATE_KEY;
        
        if (privateKey) {
            const wallet = new ethers.Wallet(privateKey.trim(), provider);
            const votContract = new ethers.Contract(VOT_TOKEN_ADDRESS, ERC20_ABI, provider);
            const maxxContract = new ethers.Contract(MAXX_TOKEN_ADDRESS, ERC20_ABI, provider);
            const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
            const ethBal = await provider.getBalance(wallet.address);
            
            const [votBal, maxxBal, usdcBal] = await Promise.all([
                votContract.balanceOf(wallet.address),
                maxxContract.balanceOf(wallet.address),
                usdcContract.balanceOf(wallet.address)
            ]);
            
            inventory = {
                treasury: wallet.address,
                vot: parseFloat(ethers.formatUnits(votBal, 18)),
                maxx: parseFloat(ethers.formatUnits(maxxBal, 18)),
                maxxNote: 'MAXX inventory = 0 is expected (swapped on-demand from user USDC)',
                usdc: parseFloat(ethers.formatUnits(usdcBal, 6)),
                eth: parseFloat(ethers.formatEther(ethBal))
            };
        }
        
        // Gas health check
        const ethBalance = inventory?.eth || 0;
        const gasHealth = {
            balance: ethBalance,
            status: ethBalance >= MIN_GAS_BUFFER_ETH ? 'healthy' : 'low',
            minRequired: MIN_GAS_BUFFER_ETH,
            estimatedTxRemaining: Math.floor(ethBalance / 0.001), // ~0.001 ETH per tx
            warning: ethBalance < MIN_GAS_BUFFER_ETH ? 'Replenish treasury ETH for gas' : null
        };

        // x402scan compatible response
        return NextResponse.json({
            // x402 standard fields
            x402Version: 1,
            status: 'active',
            name: 'MCPVOT x402 Facilitator',
            description: 'Unified Token Facilitator for VOT & MAXX tokens on Base. Gasless, instant delivery.',
            requestedToken, // Token requested via query param
            
            // x402scan required fields
            endpoint: 'https://mcpvot.vercel.app/api/x402/facilitator',
            supported: {
                kinds: [
                    { scheme: 'exact', network: 'base' }
                ]
            },
            
            // Token info
            tokens: {
                VOT: {
                    address: VOT_TOKEN_ADDRESS,
                    name: 'VOT Intelligence Token',
                    symbol: 'VOT',
                    decimals: 18,
                    currentPrice: votPrice,
                    features: ['instant-delivery', '1%-burn', 'gasless'],
                    flow: 'USDC → INSTANT VOT to user → Treasury replenishes + burns 1%'
                },
                MAXX: {
                    address: MAXX_TOKEN_ADDRESS,
                    name: 'MAXX Token',
                    symbol: 'MAXX',
                    decimals: 18,
                    currentPrice: maxxPrice,
                    features: ['kyber-swap', '10k-vot-bonus', 'gasless'],
                    flow: 'USDC → ETH → MAXX → User + 10K VOT bonus'
                }
            },
            
            // Facilitator details
            facilitator: {
                name: 'MCPVOT x402 CDP',
                type: 'token-swap-facilitator',
                treasury: TREASURY_ADDRESS,
                network: 'base',
                chainId: 8453,
                asset: USDC_ADDRESS,
                assetSymbol: 'USDC'
            },
            
            // Inventory (optional, for transparency)
            inventory,
            gasHealth,
            
            // Usage
            usage: {
                method: 'POST',
                endpoint: '/api/x402/facilitator',
                body: {
                    usdAmount: 'string (e.g., "1", "10", "100")',
                    walletAddress: 'string (0x...)',
                    token: 'VOT | MAXX'
                },
                headers: {
                    'X-PAYMENT': 'base64 encoded payment payload (after 402 response)'
                }
            },
            
            // Links
            links: {
                documentation: 'https://github.com/MCPVOT',
                basescan: `https://basescan.org/address/${TREASURY_ADDRESS}`,
                app: 'https://mcpvot.xyz'
            },
            
            supportedAmounts: SUPPORTED_AMOUNTS,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json({ 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown' 
        }, { status: 500 });
    }
}
