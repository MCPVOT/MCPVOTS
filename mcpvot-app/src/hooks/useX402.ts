'use client';

import { useCallback, useRef, useState } from 'react';
import { base } from 'viem/chains';
import { useAccount, useWalletClient } from 'wagmi';
import { encodePayment } from 'x402/schemes';

// USDC contract address on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// ============================================================================
// SECURITY CONSTANTS - x402 Payment Validation
// ============================================================================

// Allowed payment recipients (treasury addresses)
const ALLOWED_RECIPIENTS = [
    '0x824ea259c1e92f0c5dc1d85dcbb80290b90be7fa', // mcpvot.eth Treasury (lowercase)
];

// Allowed networks (CAIP-2 format and legacy)
const ALLOWED_NETWORKS = [
    'eip155:8453',      // Base Mainnet (V2)
    'eip155:84532',     // Base Sepolia (V2)
    'base',             // Base Mainnet (V1 legacy)
    'base-sepolia',     // Base Sepolia (V1 legacy)
];

// Timeout bounds (in seconds)
const MIN_TIMEOUT_SECONDS = 30;      // Minimum 30 seconds
const MAX_TIMEOUT_SECONDS = 3600;    // Maximum 1 hour

// Payment amount bounds (in USDC atomic units - 6 decimals)
const MAX_PAYMENT_AMOUNT = BigInt(1000_000_000); // $1000 USDC max per transaction

interface X402PaymentRequirements {
    scheme: string;
    network: string;
    maxAmountRequired: string;
    maxTimeoutSeconds: number;
    payTo: string | string[];
    asset?: string;
    description?: string;
    extra?: Record<string, unknown>;
}

interface X402PaymentPayload {
    x402Version: number;
    scheme: string;
    network: string;
    payload: {
        signature: string;
        authorization: {
            from: string;
            to: string;
            value: string;
            validAfter: string;
            validBefore: string;
            nonce: string;
        };
    };
}

interface TransferPermit {
    from: string;
    to: string;
    value: bigint;
    validAfter: bigint;
    validBefore: bigint;
    nonce: `0x${string}`;
    signature: string;
    v: number;
    r: `0x${string}`;
    s: `0x${string}`;
}

interface FacilitatorReceipt {
    id: string;
    timestamp: string;
    payer: string;
    usdAmount: number;
    usdcAtomicAmount: string;
    status: "queued" | "processed" | "failed";
    memo: string;
}

interface X402Result {
    success: boolean;
    message?: string;
    error?: string;
    receipt?: FacilitatorReceipt;
    payout?: Record<string, unknown>;
    conversion?: Record<string, unknown>;
    settlementTxHash?: string;
    txHash?: string;
    txLink?: string;
}

interface UseX402Options {
    onSuccess?: (result: X402Result) => void;
    onError?: (error: Error) => void;
    autoSign?: boolean; // Auto-trigger signature when 402 received
    token?: 'VOT' | 'MAXX'; // Token type to purchase (default: VOT)
}

interface UseX402Return {
    isProcessing: boolean;
    requirements: X402PaymentRequirements | null;
    initiatePayment: (amount: string, recipient: string, token?: 'VOT' | 'MAXX') => Promise<X402Result | void>;
    submitPayment: (permit: TransferPermit) => Promise<X402Result>;
    error: string | null;
    reset: () => void;
    signAndSubmit: () => Promise<X402Result | void>; // Combined sign + submit
}

export function useX402(endpoint: string, options: UseX402Options = {}): UseX402Return {
    const { onSuccess, onError, autoSign = true, token: defaultToken = 'VOT' } = options;
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [isProcessing, setIsProcessing] = useState(false);
    const [requirements, setRequirements] = useState<X402PaymentRequirements | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Store pending request data for auto-sign flow (now includes token)
    const pendingRequestRef = useRef<{ amount: string; recipient: string; token: 'VOT' | 'MAXX' } | null>(null);

    const generatePermitNonce = useCallback(() => {
        if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
            throw new Error('Secure random generator unavailable in this environment.');
        }
        const randomBytes = new Uint8Array(32);
        crypto.getRandomValues(randomBytes);
        return `0x${Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
    }, []);

    /**
     * Sign USDC transfer authorization using EIP-712 typed data
     * This triggers the wallet popup for user approval
     * 
     * SECURITY: Validates payTo, amount, timeout, and network against allowlists
     */
    const signTransferAuthorization = useCallback(async (
        paymentRequirements: X402PaymentRequirements
    ): Promise<TransferPermit> => {
        console.log('🔐 [x402] Requesting wallet signature...');
        console.log('🔐 [x402] Address:', address);
        console.log('🔐 [x402] WalletClient available:', !!walletClient);
        
        if (!address || !address.startsWith("0x")) {
            console.error('[x402] No address available');
            throw new Error("Connect a wallet to sign the x402 permit.");
        }

        if (!walletClient) {
            console.error('[x402] No walletClient available - mobile WebView issue?');
            // On mobile WebView, walletClient might take longer to initialize
            throw new Error("Wallet not ready. Please wait a moment and try again.");
        }

        // Log wallet client details for debugging mobile issues
        console.log('🔐 [x402] WalletClient chain:', walletClient.chain?.name);
        console.log('🔐 [x402] WalletClient account:', walletClient.account?.address);

        // SECURITY: Validate network against allowlist
        const network = paymentRequirements.network;
        if (!ALLOWED_NETWORKS.includes(network)) {
            console.error(`[x402 SECURITY] Rejected unknown network: ${network}`);
            throw new Error(`Unsupported network: ${network}. Expected Base mainnet or testnet.`);
        }

        let permitValue: bigint;
        try {
            const normalized = paymentRequirements.maxAmountRequired ?? "0";
            permitValue = BigInt(normalized);
        } catch (parseError) {
            console.error('[x402] Failed to parse payment amount:', parseError);
            throw new Error("Invalid facilitator payment amount.");
        }

        if (permitValue <= 0n) {
            throw new Error("Facilitator expects a positive payment amount.");
        }

        // SECURITY: Validate maximum payment amount ($1000 USDC cap)
        if (permitValue > MAX_PAYMENT_AMOUNT) {
            console.error(`[x402 SECURITY] Rejected excessive amount: ${permitValue.toString()} > ${MAX_PAYMENT_AMOUNT.toString()}`);
            throw new Error(`Payment amount exceeds maximum allowed ($1000 USDC). Requested: $${(Number(permitValue) / 1_000_000).toFixed(2)}`);
        }

        const payToField = Array.isArray(paymentRequirements.payTo) ? paymentRequirements.payTo[0] : paymentRequirements.payTo;
        if (typeof payToField !== "string" || !payToField.startsWith("0x")) {
            throw new Error("Facilitator instructions missing payTo destination.");
        }

        // SECURITY: Validate payTo against allowed treasury addresses
        const normalizedPayTo = payToField.toLowerCase();
        if (!ALLOWED_RECIPIENTS.includes(normalizedPayTo)) {
            console.error(`[x402 SECURITY] Rejected unknown recipient: ${payToField}`);
            throw new Error(`Unknown payment recipient. Expected MCPVOT treasury address.`);
        }

        const nowSeconds = Math.floor(Date.now() / 1000);
        
        // SECURITY: Validate and clamp timeout within safe bounds
        const rawTimeout = Number(paymentRequirements.maxTimeoutSeconds ?? 300);
        const timeoutSeconds = Math.max(MIN_TIMEOUT_SECONDS, Math.min(MAX_TIMEOUT_SECONDS, rawTimeout));
        if (rawTimeout !== timeoutSeconds) {
            console.warn(`[x402] Timeout clamped: ${rawTimeout}s → ${timeoutSeconds}s (bounds: ${MIN_TIMEOUT_SECONDS}-${MAX_TIMEOUT_SECONDS}s)`);
        }
        
        const validAfterSeconds = Math.max(0, nowSeconds - 60); // Valid from 1 minute ago (clock drift tolerance)
        const validBeforeSeconds = nowSeconds + timeoutSeconds;
        const validAfter = BigInt(validAfterSeconds);
        const validBefore = BigInt(validBeforeSeconds);
        const nonce = generatePermitNonce();

        // EIP-712 domain for USDC on Base (Circle's FiatTokenV2 standard)
        // Circle USDC uses "USD Coin" as name() and "2" as version()
        const domain = {
            name: "USD Coin",
            version: "2",
            chainId: base.id,
            verifyingContract: USDC_ADDRESS as `0x${string}`
        } as const;

        const message = {
            from: address,
            to: payToField,
            value: permitValue,
            validAfter,
            validBefore,
            nonce
        } as const;

        console.log('📝 [x402] Signing TransferWithAuthorization:', {
            from: address,
            to: payToField,
            value: permitValue.toString(),
            validAfter: validAfter.toString(),
            validBefore: validBefore.toString()
        });

        // SIMPLIFIED: Just use walletClient.signTypedData() directly like the old working version
        // All the complex chain switching logic was causing "Invalid network" errors
        // The wallet will handle network switching via its own UI if needed
        
        // This triggers the wallet popup!
        const signature = await walletClient.signTypedData({
            account: address as `0x${string}`,
            domain,
            primaryType: "TransferWithAuthorization",
            types: {
                TransferWithAuthorization: [
                    { name: "from", type: "address" },
                    { name: "to", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "validAfter", type: "uint256" },
                    { name: "validBefore", type: "uint256" },
                    { name: "nonce", type: "bytes32" }
                ]
            },
            message
        });

        console.log('✅ [x402] Signature obtained');

        const signatureBody = signature.slice(2);
        const r = `0x${signatureBody.slice(0, 64)}` as `0x${string}`;
        const s = `0x${signatureBody.slice(64, 128)}` as `0x${string}`;
        const recoveryParam = parseInt(signatureBody.slice(128, 130), 16);
        if (Number.isNaN(recoveryParam)) {
            throw new Error("Unable to derive recovery parameter from signature.");
        }
        const v = recoveryParam >= 27 ? recoveryParam : recoveryParam + 27;

        return {
            ...message,
            from: address,
            to: payToField,
            signature,
            r,
            s,
            v
        };
    }, [address, walletClient, generatePermitNonce]);

    const encodePaymentHeader = useCallback((permit: TransferPermit, paymentRequirements: X402PaymentRequirements) => {
        // x402 V2 Protocol - Use PAYMENT-SIGNATURE header format
        const X402_VERSION = 2;

        // CRITICAL: The encodePayment function from x402/schemes ONLY accepts legacy network names
        // like "base", "base-sepolia" - NOT CAIP-2 format like "eip155:8453"
        // Convert CAIP-2 format back to legacy for the encoder
        let legacyNetwork = paymentRequirements.network;
        if (paymentRequirements.network === 'eip155:8453') {
            legacyNetwork = 'base';
        } else if (paymentRequirements.network === 'eip155:84532') {
            legacyNetwork = 'base-sepolia';
        }

        const paymentPayload: X402PaymentPayload = {
            x402Version: X402_VERSION,
            scheme: paymentRequirements.scheme,
            // Use LEGACY network name for encodePayment compatibility
            network: legacyNetwork,
            payload: {
                signature: permit.signature,
                authorization: {
                    from: permit.from,
                    to: permit.to,
                    value: permit.value.toString(),
                    validAfter: permit.validAfter.toString(),
                    validBefore: permit.validBefore.toString(),
                    nonce: permit.nonce
                }
            }
        };

        const base64 = encodePayment(paymentPayload);
        return `x402 ${base64}`; // V2 format: "x402 <base64>" instead of "base64:<base64>"
    }, []);

    /**
     * Submit payment with signed permit
     */
    const submitPayment = useCallback(async (permit: TransferPermit): Promise<X402Result> => {
        if (!requirements) {
            throw new Error("No payment requirements available.");
        }

        const pendingData = pendingRequestRef.current;
        if (!pendingData) {
            throw new Error("No pending request data available.");
        }

        setIsProcessing(true);
        setError(null);

        try {
            const paymentHeader = encodePaymentHeader(permit, requirements);

            console.log('📤 [x402] Submitting payment with signature...');

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // x402 V2: Use PAYMENT-SIGNATURE header
                    'Payment-Signature': paymentHeader
                },
                body: JSON.stringify({
                    usdAmount: pendingData.amount,
                    walletAddress: pendingData.recipient,
                    token: pendingData.token, // CRITICAL: Pass token type (VOT or MAXX)
                    timestamp: new Date().toISOString()
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ [x402] Payment successful:', result);
                setIsProcessing(false);
                setRequirements(null);
                pendingRequestRef.current = null;
                onSuccess?.(result);
                return result;
            } else {
                throw new Error(result.error || 'Payment submission failed');
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Payment submission failed';
            console.error('❌ [x402] Payment failed:', errorMsg);
            setError(errorMsg);
            setIsProcessing(false);
            onError?.(err instanceof Error ? err : new Error(errorMsg));
            throw err;
        }
    }, [requirements, endpoint, encodePaymentHeader, onSuccess, onError]);

    /**
     * Combined sign and submit - convenience method
     */
    const signAndSubmit = useCallback(async (): Promise<X402Result | void> => {
        if (!requirements) {
            throw new Error("No payment requirements available. Call initiatePayment first.");
        }

        try {
            console.log('🔄 [x402] Starting sign and submit flow...');
            const permit = await signTransferAuthorization(requirements);
            return await submitPayment(permit);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Sign and submit failed';
            setError(errorMsg);
            setIsProcessing(false);
            onError?.(err instanceof Error ? err : new Error(errorMsg));
            throw err;
        }
    }, [requirements, signTransferAuthorization, submitPayment, onError]);

    /**
     * Initiate payment - sends initial request
     * If 402 is returned, automatically triggers wallet signature if autoSign is true
     */
    const initiatePayment = useCallback(async (amount: string, recipient: string, token: 'VOT' | 'MAXX' = defaultToken): Promise<X402Result | void> => {
        if (!address) {
            throw new Error("Wallet address not available for facilitator payment.");
        }

        // SIMPLIFIED: No pre-flight network check - the wallet will handle this
        // The EIP-712 signature includes chainId: base.id, so wallet knows what network
        console.log('🚀 [x402] Starting payment (wallet will handle network if needed)...');

        setIsProcessing(true);
        setError(null);
        
        // Store request data for later use (including token!)
        pendingRequestRef.current = { amount, recipient, token };

        try {
            console.log(`🚀 [x402] Initiating ${token} payment request...`);
            
            const requestPayload = {
                usdAmount: amount,
                walletAddress: recipient,
                token: token, // CRITICAL: Include token type!
                timestamp: new Date().toISOString()
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestPayload)
            });

            if (response.status === 402) {
                // Payment required - extract requirements
                const data = await response.json();
                console.log('💳 [x402] Payment required, got requirements:', data.paymentRequirements);
                
                setRequirements(data.paymentRequirements);
                
                // Auto-sign if enabled - this triggers wallet popup!
                if (autoSign && data.paymentRequirements) {
                    console.log('🔐 [x402] Auto-sign enabled, requesting wallet signature...');
                    
                    try {
                        console.log('🔐 [x402] Calling signTransferAuthorization...');
                        const permit = await signTransferAuthorization(data.paymentRequirements);
                        console.log('✅ [x402] Got permit:', { from: permit.from, to: permit.to, value: permit.value?.toString() });
                        
                        // Submit with signature
                        console.log('🔐 [x402] Encoding payment header...');
                        const paymentHeader = encodePaymentHeader(permit, data.paymentRequirements);
                        console.log('✅ [x402] Payment header encoded');
                        
                        console.log(`📤 [x402 V2] Submitting signed ${token} payment to ${endpoint}...`);
                        const submitResponse = await fetch(endpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                // x402 V2: Use PAYMENT-SIGNATURE header
                                'Payment-Signature': paymentHeader
                            },
                            body: JSON.stringify({
                                usdAmount: amount,
                                walletAddress: recipient,
                                token: token, // CRITICAL: Include token type!
                                timestamp: new Date().toISOString()
                            })
                        });
                        
                        console.log(`📤 [x402] Submit response status: ${submitResponse.status}`);
                        const result = await submitResponse.json();
                        console.log(`📤 [x402] Submit response body:`, result);
                        
                        if (submitResponse.ok && result.success) {
                            console.log(`✅ [x402] ${token} Payment complete:`, result);
                            setIsProcessing(false);
                            setRequirements(null);
                            pendingRequestRef.current = null;
                            onSuccess?.(result);
                            return result;
                        } else {
                            throw new Error(result.error || 'Payment failed after signature');
                        }
                    } catch (signError) {
                        const errorMsg = signError instanceof Error ? signError.message : 'Signature failed';
                        console.error('❌ [x402] Signature/submit failed:', errorMsg);
                        setError(errorMsg);
                        setIsProcessing(false);
                        onError?.(new Error(errorMsg));
                        throw new Error(errorMsg);
                    }
                }
                
                // If not auto-sign, just set requirements and wait for manual signAndSubmit
                return;
            } else if (response.ok) {
                // Direct success (shouldn't happen with proper x402 flow)
                const result = await response.json();
                console.log('✅ [x402] Direct success:', result);
                setIsProcessing(false);
                pendingRequestRef.current = null;
                onSuccess?.(result);
                return result;
            } else {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(errorData.error || 'Payment initiation failed');
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Payment initiation failed';
            setError(errorMsg);
            setIsProcessing(false);
            pendingRequestRef.current = null;
            onError?.(err instanceof Error ? err : new Error(errorMsg));
            throw err;
        }
    }, [address, endpoint, autoSign, signTransferAuthorization, encodePaymentHeader, onSuccess, onError, defaultToken]);

    const reset = useCallback(() => {
        setIsProcessing(false);
        setRequirements(null);
        setError(null);
        pendingRequestRef.current = null;
    }, []);

    return {
        isProcessing,
        requirements,
        initiatePayment,
        submitPayment,
        signAndSubmit,
        error,
        reset
    };
}