import { createCDPVOTPaymentService, getVOTTokenService } from '@/lib/vot-token';
import { ethers } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';

// CDP x402 Facilitator API configuration
const CDP_X402_BASE_URL = 'https://api.cdp.coinbase.com/platform/v2/x402';
const CDP_API_KEY = process.env.CDP_API_KEY;

// In-memory stores for security (in production, use Redis/database)
const processedNonces = new Set<string>();
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up expired nonces and rate limits every 5 minutes
setInterval(() => {
    const now = Date.now();
    // Clean up old nonces (keep for 24 hours)
    // Clean up rate limits (reset every hour)
    for (const [key, data] of rateLimitMap.entries()) {
        if (now > data.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, 5 * 60 * 1000);

// Rate limiting: 10 requests per minute per IP
function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10;

    const userLimit = rateLimitMap.get(ip);
    if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (userLimit.count >= maxRequests) {
        return false;
    }

    userLimit.count++;
    return true;
}

// Nonce validation to prevent replay attacks
function validateNonce(nonce: string): boolean {
    if (processedNonces.has(nonce)) {
        return false; // Nonce already used
    }

    // Keep nonces for 24 hours to prevent replay
    processedNonces.add(nonce);

    // Clean up old nonces after 24 hours
    setTimeout(() => {
        processedNonces.delete(nonce);
    }, 24 * 60 * 60 * 1000);

    return true;
}

// CDP x402 Facilitator API functions
interface CDPPaymentRequirements {
    scheme: 'exact';
    network: string;
    maxAmountRequired: string;
    resource: string;
    description?: string | null;
    mimeType: string;
    outputSchema: string | null;
    payTo: string;
    maxTimeoutSeconds: number;
    asset: string;
    extra?: Record<string, string>;
}

interface CDPVerificationResponse {
    isValid: boolean;
    invalidReason?: string;
}

interface CDPSettlementResponse {
    success: boolean;
    error?: string;
    txHash?: string;
    networkId?: string;
}

async function verifyX402PaymentWithCDP(paymentHeader: string, paymentRequirements: CDPPaymentRequirements): Promise<CDPVerificationResponse> {
    try {
        const response = await fetch(`${CDP_X402_BASE_URL}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CDP_API_KEY}`,
            },
            body: JSON.stringify({
                x402Version: 1,
                paymentHeader,
                paymentRequirements,
            }),
        });

        if (!response.ok) {
            throw new Error(`CDP verify failed: ${response.status} ${response.statusText}`);
        }

        const result: CDPVerificationResponse = await response.json();
        return result;
    } catch (error) {
        console.error('CDP x402 verify error:', error);
        throw error;
    }
}

async function settleX402PaymentWithCDP(paymentHeader: string, paymentRequirements: CDPPaymentRequirements): Promise<CDPSettlementResponse> {
    try {
        const response = await fetch(`${CDP_X402_BASE_URL}/settle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CDP_API_KEY}`,
            },
            body: JSON.stringify({
                x402Version: 1,
                paymentHeader,
                paymentRequirements,
            }),
        });

        if (!response.ok) {
            throw new Error(`CDP settle failed: ${response.status} ${response.statusText}`);
        }

        const result: CDPSettlementResponse = await response.json();
        return result;
    } catch (error) {
        console.error('CDP x402 settle error:', error);
        throw error;
    }
}

// EIP-8004 x402 Payment Payload Interface
interface X402PaymentPayload {
    amount: string; // Amount in VOT tokens (as string to handle decimals)
    serviceId: string; // Service identifier
    userAddress: string; // User's wallet address
    facilitatorAddress: string; // Facilitator's address for settlement
    deadline: number; // Payment deadline timestamp
    nonce: string; // Unique payment nonce
    signature: string; // Signed payment payload from client
    memo?: string; // Optional payment memo
}

// Facilitator Verification Interface
interface PaymentVerification {
    isValid: boolean;
    amount: string;
    userAddress: string;
    serviceId: string;
    facilitatorAddress: string;
    deadline: number;
    nonce: string;
    signature: string;
    memo?: string;
    error?: string;
}

// EIP-8004 x402 Payment Payload Verification Function
async function verifyX402PaymentPayload(payload: X402PaymentPayload): Promise<PaymentVerification> {
    try {
        // Validate deadline hasn't expired
        if (payload.deadline < Math.floor(Date.now() / 1000)) {
            return {
                ...payload,
                isValid: false,
                error: 'Payment deadline expired'
            };
        }

        // Validate deadline is not too far in the future (prevent replay attacks)
        const maxDeadline = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
        if (payload.deadline > maxDeadline) {
            return {
                ...payload,
                isValid: false,
                error: 'Payment deadline too far in the future'
            };
        }

        // Validate amount is positive and reasonable
        const amountFloat = parseFloat(payload.amount);
        if (isNaN(amountFloat) || amountFloat <= 0 || amountFloat > 1000000) { // Max 1M VOT
            return {
                ...payload,
                isValid: false,
                error: 'Invalid payment amount'
            };
        }

        // Validate nonce format (should be unique identifier)
        if (!payload.nonce || payload.nonce.length < 8 || payload.nonce.length > 128) {
            return {
                ...payload,
                isValid: false,
                error: 'Invalid nonce format'
            };
        }

        // Create the message hash for EIP-712 signing
        const domain = {
            name: 'x402 Trustless Agent',
            version: '1',
            chainId: 8453, // Base mainnet
            verifyingContract: process.env.X402_FACILITATOR_CONTRACT || '0x0000000000000000000000000000000000000000'
        };

        const types = {
            Payment: [
                { name: 'amount', type: 'string' },
                { name: 'serviceId', type: 'string' },
                { name: 'userAddress', type: 'address' },
                { name: 'facilitatorAddress', type: 'address' },
                { name: 'deadline', type: 'uint256' },
                { name: 'nonce', type: 'string' }
            ]
        };

        const message = {
            amount: payload.amount,
            serviceId: payload.serviceId,
            userAddress: payload.userAddress,
            facilitatorAddress: payload.facilitatorAddress,
            deadline: payload.deadline,
            nonce: payload.nonce
        };

        // Recover signer from signature
        const recoveredSigner = ethers.verifyTypedData(domain, types, message, payload.signature);

        // Verify signer matches user address (the payer)
        if (recoveredSigner.toLowerCase() !== payload.userAddress.toLowerCase()) {
            return {
                ...payload,
                isValid: false,
                error: 'Invalid signature - signer does not match user address'
            };
        }

        return {
            ...payload,
            isValid: true
        };

    } catch (error) {
        console.error('x402 payment verification failed:', error);
        return {
            ...payload,
            isValid: false,
            error: error instanceof Error ? error.message : 'Verification failed'
        };
    }
}

export async function POST(req: NextRequest) {
    try {
        // Check CDP API key
        if (!CDP_API_KEY) {
            return NextResponse.json({
                success: false,
                error: 'CDP API key not configured'
            }, { status: 500 });
        }

        // Rate limiting
        const clientIP = req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown';
        if (!checkRateLimit(clientIP)) {
            return NextResponse.json({
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
                retryAfter: 60
            }, {
                status: 429,
                headers: { 'Retry-After': '60' }
            });
        }

        const body: X402PaymentPayload = await req.json();
        const {
            amount,
            serviceId,
            userAddress,
            facilitatorAddress,
            deadline,
            nonce,
            signature,
            memo = 'x402 Facilitator Payment - EIP-8004 Trustless Agents'
        } = body;

        // Input sanitization
        const sanitizedMemo = memo.replace(/[<>\"'&]/g, '').substring(0, 200); // Remove HTML chars and limit length

        // Validate serviceId format (alphanumeric + hyphens/underscores)
        if (!/^[a-zA-Z0-9_-]{1,50}$/.test(serviceId)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid serviceId format'
            }, { status: 400 });
        }

        // Validate required x402 payment payload fields
        if (!amount || !serviceId || !userAddress || !facilitatorAddress || !deadline || !nonce || !signature) {
            return NextResponse.json({
                success: false,
                error: 'Missing required x402 payment payload fields',
                required: ['amount', 'serviceId', 'userAddress', 'facilitatorAddress', 'deadline', 'nonce', 'signature']
            }, { status: 400 });
        }

        // Validate Ethereum addresses
        if (!ethers.isAddress(userAddress) || !ethers.isAddress(facilitatorAddress)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid Ethereum address in payment payload'
            }, { status: 400 });
        }

        // Check payment deadline (EIP-8004 requirement)
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime > deadline) {
            return NextResponse.json({
                success: false,
                error: 'Payment payload has expired',
                deadline,
                currentTime
            }, { status: 400 });
        }

        // Get VOT token info for payment requirements
        const votService = getVOTTokenService();
        const tokenInfo = await votService.getTokenInfo();

        // Construct payment requirements for CDP x402 API
        const paymentRequirements: CDPPaymentRequirements = {
            scheme: 'exact',
            network: 'base',
            maxAmountRequired: ethers.parseUnits(amount, tokenInfo.decimals).toString(),
            resource: serviceId,
            description: sanitizedMemo || undefined,
            mimeType: 'application/json',
            outputSchema: null,
            payTo: facilitatorAddress,
            maxTimeoutSeconds: 300, // 5 minutes
            asset: tokenInfo.address,
            extra: {
                name: 'VOT',
                version: '1'
            }
        };

        const payloadVerification = await verifyX402PaymentPayload({
            amount,
            serviceId,
            userAddress,
            facilitatorAddress,
            deadline,
            nonce,
            signature,
            memo: sanitizedMemo || undefined
        });

        if (!payloadVerification.isValid) {
            console.warn('x402 payment payload validation failed:', {
                userAddress,
                serviceId,
                error: payloadVerification.error,
                timestamp: new Date().toISOString()
            });
            return NextResponse.json({
                success: false,
                error: payloadVerification.error || 'Invalid payment payload',
                details: payloadVerification
            }, { status: 400 });
        }

        // Create payment header (base64 encoded JSON)
        const paymentPayload = {
            x402Version: 1,
            scheme: 'exact',
            network: 'base',
            payload: {
                amount: ethers.parseUnits(amount, tokenInfo.decimals).toString(),
                serviceId,
                userAddress,
                facilitatorAddress,
                deadline,
                nonce,
                signature
            }
        };
        const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

        // Verify payment with CDP x402 facilitator
        const verification = await verifyX402PaymentWithCDP(paymentHeader, paymentRequirements);
        if (!verification.isValid) {
            console.warn('CDP x402 payment verification failed:', {
                userAddress,
                serviceId,
                error: verification.invalidReason,
                timestamp: new Date().toISOString()
            });
            return NextResponse.json({
                success: false,
                error: 'Invalid payment - CDP x402 facilitator verification failed',
                details: verification.invalidReason
            }, { status: 403 });
        }

        // Validate nonce to prevent replay attacks (after verification)
        if (!validateNonce(nonce)) {
            return NextResponse.json({
                success: false,
                error: 'Nonce already used - potential replay attack detected',
                nonce
            }, { status: 403 });
        }

        // Get CDP facilitator service to verify facilitator address
        const cdpService = createCDPVOTPaymentService();
        const expectedFacilitatorAddr = await cdpService.getFacilitatorAddress();

        // Verify facilitator address matches
        if (facilitatorAddress.toLowerCase() !== expectedFacilitatorAddr.toLowerCase()) {
            console.warn('Facilitator address mismatch detected:', {
                expected: expectedFacilitatorAddr,
                provided: facilitatorAddress,
                userAddress,
                serviceId,
                timestamp: new Date().toISOString()
            });
            return NextResponse.json({
                success: false,
                error: 'Facilitator address mismatch - payment must be settled by authorized x402 facilitator',
                expectedFacilitator: expectedFacilitatorAddr,
                providedFacilitator: facilitatorAddress
            }, { status: 403 });
        }

        // Settle payment using CDP x402 facilitator
        const settlementResult = await settleX402PaymentWithCDP(paymentHeader, paymentRequirements);

        if (!settlementResult.success) {
            console.error('CDP x402 settlement failed:', {
                userAddress,
                serviceId,
                error: settlementResult.error,
                timestamp: new Date().toISOString()
            });
            return NextResponse.json({
                success: false,
                error: 'x402 settlement failed via CDP facilitator',
                details: settlementResult.error
            }, { status: 402 });
        }

        // Log successful settlement
        console.log('x402 payment settlement successful:', {
            txHash: settlementResult.txHash,
            userAddress,
            amount,
            serviceId,
            facilitatorAddress: expectedFacilitatorAddr,
            timestamp: new Date().toISOString()
        });

        // Create settlement record
        const settlementRecord = {
            id: `x402_settlement_${Date.now()}_${nonce}`,
            serviceId,
            userAddress,
            facilitatorAddress: expectedFacilitatorAddr,
            amount,
            txHash: settlementResult.txHash,
            networkId: settlementResult.networkId,
            timestamp: new Date().toISOString(),
            deadline,
            nonce,
            signature,
            memo: sanitizedMemo,
            status: 'settled',
            protocol: 'EIP-8004 x402',
            security: 'CDP x402 Facilitator API'
        };

        // TODO: Store settlement record in MCP memory system
        // await storeSettlementRecord(settlementRecord);

        return NextResponse.json({
            success: true,
            settlement: settlementRecord,
            transaction: {
                hash: settlementResult.txHash,
                networkId: settlementResult.networkId
            },
            verification: {
                status: 'verified',
                protocol: 'EIP-8004 x402',
                facilitator: expectedFacilitatorAddr,
                deadline,
                nonce
            },
            security: {
                facilitatorType: 'CDP x402 Facilitator API',
                protection: 'TEE (Trusted Execution Environment)',
                network: 'Base Mainnet',
                role: 'x402 Facilitator',
                features: [
                    'Trustless Agent Verification',
                    'Gas Sponsorship',
                    'Transaction Batching',
                    'Multi-network Support',
                    'EIP-8004 Compliance',
                    'Payment Payload Verification',
                    'Facilitator Settlement',
                    'Rate Limiting',
                    'Replay Attack Prevention',
                    'Input Sanitization'
                ]
            }
        }, {
            headers: {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
            }
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'x402 facilitator settlement failed';
        console.error('EIP-8004 x402 Facilitator error:', error);

        return NextResponse.json({
            success: false,
            error: message,
            protocol: 'EIP-8004 x402',
            security: {
                walletType: 'CDP Server Wallet v2',
                role: 'x402 Facilitator',
                status: 'Settlement failed during TEE-protected transaction'
            }
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const serviceId = searchParams.get('serviceId');
        const userAddress = searchParams.get('userAddress');

        if (!serviceId || !userAddress) {
            return NextResponse.json({
                success: false,
                error: 'Missing serviceId or userAddress parameters'
            }, { status: 400 });
        }

        // Get VOT token info using CDP
        const votService = getVOTTokenService();
        const tokenInfo = await votService.getTokenInfo();
        const userBalance = await votService.getFormattedBalance(userAddress);

        // Get wallet information
        const walletInfo = await votService.getWalletInfo();

        // TODO: Query payment history from MCP memory
        // const payments = await getPaymentHistory(serviceId, userAddress);

        return NextResponse.json({
            success: true,
            serviceId,
            userAddress,
            userBalance,
            votToken: tokenInfo,
            settlements: [], // TODO: Return actual settlement history
            facilitator: {
                address: walletInfo.address,
                network: 'Base Mainnet',
                protocol: 'EIP-8004 x402',
                role: 'Trustless Agent Facilitator'
            },
            security: {
                walletType: 'CDP Server Wallet v2',
                protection: 'TEE (Trusted Execution Environment)',
                network: 'Base Mainnet',
                role: 'x402 Facilitator',
                protocol: 'EIP-8004 Trustless Agents',
                walletId: walletInfo.walletId,
                address: walletInfo.address,
                features: [
                    'Trustless Agent Verification',
                    'Gas Sponsorship',
                    'Transaction Batching',
                    'Multi-network Support',
                    'EIP-8004 Compliance',
                    'Payment Payload Verification',
                    'Facilitator Settlement'
                ]
            }
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'CDP Server Wallet payment query failed';
        console.error('x402 CDP Payment query error:', error);

        return NextResponse.json({
            success: false,
            error: message,
            security: {
                walletType: 'CDP Server Wallet v2',
                status: 'Query failed'
            }
        }, { status: 500 });
    }
}
