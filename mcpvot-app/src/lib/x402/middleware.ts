/**
 * x402 Payment Middleware
 *
 * Wraps API route handlers to enforce payment via EIP-3009 USDC permits.
 * Handles CDP facilitator verification, rate limiting, and cryptographic receipts.
 * Now includes Coinbase Embedded Wallets support with useX402 hook.
 *
 * Security hardened November 2025.
 */

import { generateJwt as generateCdpJwt } from '@coinbase/cdp-sdk/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getAddress } from 'viem';
import { decodePayment } from 'x402/schemes';
import type { ExactEvmPayload, PaymentPayload, PaymentRequirements as X402PaymentRequirements } from 'x402/types';
import { useFacilitator as createFacilitatorClient } from 'x402/verify';

// Coinbase Embedded Wallets support

// USDC contract on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export const DEFAULT_X402_PAYTO = normalizePayToAddress(
    process.env.SERVER_WALLET_ADDRESS ||
    process.env.NEXT_PUBLIC_SERVER_WALLET ||
    process.env.TREASURY_WALLET,
    '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa'
);

function normalizePayToAddress(value: string | undefined | null, fallback: string): string {
    const candidate = (value ?? fallback).trim();
    try {
        return getAddress(candidate);
    } catch (error) {
        if (value) {
            console.warn('[x402] Invalid payTo address provided in environment; falling back to default.', error);
        }
        return getAddress(fallback);
    }
}

// Default to Coinbase Developer Platform (CDP) facilitator for production integrations
// This is the CDN-backed endpoint used by the cdp APIs
const DEFAULT_FACILITATOR_URL = 'https://api.cdp.coinbase.com/x402/facilitator/v2';

// Embedded Wallets configuration
const EMBEDDED_WALLETS_ENABLED = process.env.NEXT_PUBLIC_EMBEDDED_WALLETS_ENABLED === 'true';
const EMBEDDED_WALLETS_PROJECT_ID = process.env.NEXT_PUBLIC_EMBEDDED_WALLETS_PROJECT_ID;

let facilitatorFallbackLogged = false;
let facilitatorDomainRewriteLogged = false;

const normalizeFacilitatorUrl = (url?: string | null): string => {
    const trimmed = (url ?? '').trim();
    const candidate = trimmed.length > 0 ? trimmed : DEFAULT_FACILITATOR_URL;
    let sanitized = candidate.replace(/\/+$/, '');

    try {
        const parsed = new URL(sanitized);
        const hostname = parsed.hostname.toLowerCase();

        if (hostname === 'facilitator.x402.org') {
            if (!facilitatorDomainRewriteLogged) {
                console.warn('[x402] facilitator.x402.org is deprecated or offline. Rewriting to https://facilitator.x402.rs.');
                facilitatorDomainRewriteLogged = true;
            }
            parsed.hostname = 'facilitator.x402.rs';
            sanitized = parsed.toString().replace(/\/+$/, '');
        } else if (hostname === 'api.cdp.coinbase.com') {
            if (!parsed.pathname || !parsed.pathname.includes('/x402/facilitator')) {
                parsed.pathname = '/x402/facilitator/v2';
            }
            sanitized = parsed.toString().replace(/\/+$/, '');
        } else {
            sanitized = parsed.toString().replace(/\/+$/, '');
        }

        return sanitized;
    } catch {
        return DEFAULT_FACILITATOR_URL;
    }
};

const resolveFacilitatorUrl = (): string => {
    // Allow an explicit override to force the CDP hosted facilitator even if other envs point elsewhere
    if (process.env.X402_FORCE_CDP === 'true') {
        if ((process.env.X402_DEBUG_MIDDLEWARE === 'true') || (process.env.X402_DEBUG_FACILITATOR === 'true')) {
            console.info('[x402] X402_FORCE_CDP=true, forcing CDP facilitator endpoint:', DEFAULT_FACILITATOR_URL);
        }
        return DEFAULT_FACILITATOR_URL;
    }
    const configuredUrl =
        process.env.CDP_FACILITATOR_URL ||
        process.env.VITE_FACILITATOR_URL ||
        process.env.FACILITATOR_URL ||
        process.env.X402_FACILITATOR_URL ||
        process.env.NEXT_PUBLIC_FACILITATOR_URL;

    if (configuredUrl && configuredUrl.trim().length > 0) {
        return normalizeFacilitatorUrl(configuredUrl);
    }

    if (!facilitatorFallbackLogged) {
        console.warn('[x402] Facilitator URL missing in environment. Falling back to default facilitator.');
        facilitatorFallbackLogged = true;
    }

    // NOTE: We intentionally ignore process.env.DEFAULT_FACILITATOR_URL to avoid silently falling
    // back to older/3rd-party facilitator instances unless a specific FACILITATOR_URL or CDP env
    // variable is explicitly configured. This ensures CDP remains the safe default hosting surface.
    const fallbackOverride = process.env.NEXT_PUBLIC_FACILITATOR_FALLBACK;

    const resolved = normalizeFacilitatorUrl(fallbackOverride ?? DEFAULT_FACILITATOR_URL);
    if ((process.env.X402_DEBUG_MIDDLEWARE === 'true') || (process.env.X402_DEBUG_FACILITATOR === 'true')) {
        console.info('[x402] Resolved facilitator URL:', resolved);
    }
    return resolved;
};

// Rate limiting (10 requests/minute per wallet)
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds
const RATE_LIMIT_MAX = 10;

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

// Type helpers for safer casting in middleware
type FetchWithPaymentFn = (url: string, options?: RequestInit) => Promise<Response>;
type NextRequestWithNextUrl = NextRequest & { nextUrl?: { pathname?: string; search?: string } };

// Resource pricing configuration
export type SupportedHttpMethod = 'GET' | 'POST';

export interface ResourceSchemaField {
    type?: string;
    required?: boolean | string[];
    description?: string;
    enum?: string[];
    properties?: Record<string, ResourceSchemaField>;
}

export interface ResourceSchema {
    input: {
        type: 'http';
        method: SupportedHttpMethod;
        bodyType?: 'json' | 'form-data' | 'multipart-form-data' | 'text' | 'binary';
        queryParams?: Record<string, ResourceSchemaField>;
        bodyFields?: Record<string, ResourceSchemaField>;
        headerFields?: Record<string, ResourceSchemaField>;
    };
    output?: Record<string, unknown>;
}

export interface ResourceConfig {
    name: string;
    costUSDC: number; // In USDC units (e.g., 0.10, 1.00)
    cacheTTL: number; // Cache time-to-live in seconds
    votBurnPercent: number; // Percentage of payment to burn as VOT
    description?: string;
    endpoint?: string;
    method?: SupportedHttpMethod;
    mimeType?: string;
    schema?: ResourceSchema;
    assetSymbol?: string;
    maxTimeoutSeconds?: number;
    payer?: string;
    payTo?: string;
    extra?: Record<string, string>;
}

const RESOURCE_CONFIGS: Record<string, ResourceConfig> = {
    // ==========================================
    // VOT TOKEN PURCHASES (Primary Offering)
    // ==========================================
    'vot-buy-1usd': {
        name: 'Buy $1 VOT',
        costUSDC: 1.00,
        cacheTTL: 0,
        votBurnPercent: 1,
        description: 'Gasless purchase: Pay $1 USDC → Receive VOT tokens instantly. 1% burn on treasury replenishment.',
        endpoint: '/api/x402/facilitator?token=VOT',
        method: 'POST',
        mimeType: 'application/json',
        maxTimeoutSeconds: 20,
        payTo: DEFAULT_X402_PAYTO,
        schema: {
            input: {
                type: 'http',
                method: 'POST',
                bodyType: 'json',
                bodyFields: {
                    memo: { type: 'string', description: 'Optional memo for audit trail.' }
                }
            },
            output: {
                success: { type: 'boolean', description: 'True if VOT delivered successfully.' },
                receipt: { type: 'object', description: 'Payment receipt with txHash and VOT amount.' },
                votAmount: { type: 'string', description: 'Amount of VOT tokens delivered.' }
            }
        }
    },
    'vot-buy-10usd': {
        name: 'Buy $10 VOT',
        costUSDC: 10.00,
        cacheTTL: 0,
        votBurnPercent: 1,
        description: 'Gasless purchase: Pay $10 USDC → Receive VOT tokens instantly. 1% burn on treasury replenishment.',
        endpoint: '/api/x402/facilitator?token=VOT',
        method: 'POST',
        mimeType: 'application/json',
        maxTimeoutSeconds: 20,
        payTo: DEFAULT_X402_PAYTO,
        schema: {
            input: {
                type: 'http',
                method: 'POST',
                bodyType: 'json',
                bodyFields: {
                    memo: { type: 'string', description: 'Optional memo for audit trail.' }
                }
            },
            output: {
                success: { type: 'boolean', description: 'True if VOT delivered successfully.' },
                receipt: { type: 'object', description: 'Payment receipt with txHash and VOT amount.' },
                votAmount: { type: 'string', description: 'Amount of VOT tokens delivered.' }
            }
        }
    },
    'vot-buy-100usd': {
        name: 'Buy $100 VOT',
        costUSDC: 100.00,
        cacheTTL: 0,
        votBurnPercent: 1,
        description: 'Gasless purchase: Pay $100 USDC → Receive VOT tokens instantly. 1% burn on treasury replenishment.',
        endpoint: '/api/x402/facilitator?token=VOT',
        method: 'POST',
        mimeType: 'application/json',
        maxTimeoutSeconds: 30,
        payTo: DEFAULT_X402_PAYTO,
        schema: {
            input: {
                type: 'http',
                method: 'POST',
                bodyType: 'json',
                bodyFields: {
                    memo: { type: 'string', description: 'Optional memo for audit trail.' }
                }
            },
            output: {
                success: { type: 'boolean', description: 'True if VOT delivered successfully.' },
                receipt: { type: 'object', description: 'Payment receipt with txHash and VOT amount.' },
                votAmount: { type: 'string', description: 'Amount of VOT tokens delivered.' }
            }
        }
    },
    // ==========================================
    // MAXX TOKEN PURCHASES 
    // ==========================================
    'maxx-buy-1usd': {
        name: 'Buy $1 MAXX',
        costUSDC: 1.00,
        cacheTTL: 0,
        votBurnPercent: 0,
        description: 'Gasless purchase: Pay $1 USDC → Receive MAXX tokens + 10,000 VOT bonus!',
        endpoint: '/api/x402/facilitator?token=MAXX',
        method: 'POST',
        mimeType: 'application/json',
        maxTimeoutSeconds: 30,
        payTo: DEFAULT_X402_PAYTO,
        schema: {
            input: {
                type: 'http',
                method: 'POST',
                bodyType: 'json',
                bodyFields: {
                    memo: { type: 'string', description: 'Optional memo for audit trail.' }
                }
            },
            output: {
                success: { type: 'boolean', description: 'True if MAXX delivered successfully.' },
                receipt: { type: 'object', description: 'Payment receipt with txHash and token amounts.' },
                maxxAmount: { type: 'string', description: 'Amount of MAXX tokens delivered.' },
                votBonus: { type: 'string', description: '10,000 VOT bonus included.' }
            }
        }
    },
    'maxx-buy-10usd': {
        name: 'Buy $10 MAXX',
        costUSDC: 10.00,
        cacheTTL: 0,
        votBurnPercent: 0,
        description: 'Gasless purchase: Pay $10 USDC → Receive MAXX tokens + 10,000 VOT bonus!',
        endpoint: '/api/x402/facilitator?token=MAXX',
        method: 'POST',
        mimeType: 'application/json',
        maxTimeoutSeconds: 30,
        payTo: DEFAULT_X402_PAYTO,
        schema: {
            input: {
                type: 'http',
                method: 'POST',
                bodyType: 'json',
                bodyFields: {
                    memo: { type: 'string', description: 'Optional memo for audit trail.' }
                }
            },
            output: {
                success: { type: 'boolean', description: 'True if MAXX delivered successfully.' },
                receipt: { type: 'object', description: 'Payment receipt with txHash and token amounts.' },
                maxxAmount: { type: 'string', description: 'Amount of MAXX tokens delivered.' },
                votBonus: { type: 'string', description: '10,000 VOT bonus included.' }
            }
        }
    },
    'maxx-buy-100usd': {
        name: 'Buy $100 MAXX',
        costUSDC: 100.00,
        cacheTTL: 0,
        votBurnPercent: 0,
        description: 'Gasless purchase: Pay $100 USDC → Receive MAXX tokens + 10,000 VOT bonus!',
        endpoint: '/api/x402/facilitator?token=MAXX',
        method: 'POST',
        mimeType: 'application/json',
        maxTimeoutSeconds: 45,
        payTo: DEFAULT_X402_PAYTO,
        schema: {
            input: {
                type: 'http',
                method: 'POST',
                bodyType: 'json',
                bodyFields: {
                    memo: { type: 'string', description: 'Optional memo for audit trail.' }
                }
            },
            output: {
                success: { type: 'boolean', description: 'True if MAXX delivered successfully.' },
                receipt: { type: 'object', description: 'Payment receipt with txHash and token amounts.' },
                maxxAmount: { type: 'string', description: 'Amount of MAXX tokens delivered.' },
                votBonus: { type: 'string', description: '10,000 VOT bonus included.' }
            }
        }
    },
    // ==========================================
    // VOT MACHINE NFT MINTING
    // ==========================================
    'vot-machine-nft': {
        name: 'Mint VOT Machine NFT',
        costUSDC: 1.00,
        cacheTTL: 0,
        votBurnPercent: 1,
        description: 'Mint a unique VOT Machine Builder NFT. Pay $1 USDC → Receive 100,000 VOT + ERC-1155 NFT with your identity.',
        endpoint: '/api/x402/mint-builder-nft',
        method: 'POST',
        mimeType: 'application/json',
        maxTimeoutSeconds: 60,
        payTo: DEFAULT_X402_PAYTO,
        schema: {
            input: {
                type: 'http',
                method: 'POST',
                bodyType: 'json',
                bodyFields: {
                    walletAddress: { type: 'string', required: true, description: 'Recipient wallet address.' },
                    fid: { type: 'number', description: 'Optional Farcaster FID for identity.' },
                    ensName: { type: 'string', description: 'Optional ENS/Basename for identity.' }
                }
            },
            output: {
                success: { type: 'boolean', description: 'True if NFT minted successfully.' },
                tokenId: { type: 'number', description: 'ERC-1155 token ID of minted NFT.' },
                votAmount: { type: 'string', description: '100,000 VOT tokens delivered.' },
                nftMetadata: { type: 'object', description: 'NFT metadata including IPFS CID.' }
            }
        }
    }
};

function resolveResourceUrl(resourceId: string, endpoint?: string): string {
    if (!endpoint) {
        return `urn:x402:${resourceId}`;
    }

    if (/^https?:\/\//i.test(endpoint)) {
        return endpoint;
    }

    const baseUrl =
        process.env.X402_RESOURCE_BASE_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined) ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
        'https://mcpvot.xyz';

    try {
        return new URL(endpoint, baseUrl).toString();
    } catch {
        return endpoint;
    }
}

export function buildPaymentRequirements(resourceId: string, resourceConfig: ResourceConfig): X402PaymentRequirements {
    const maxAmountAtomic = BigInt(Math.floor(resourceConfig.costUSDC * 1e6));

    return {
        scheme: 'exact',
        network: 'base',
        maxAmountRequired: maxAmountAtomic.toString(),
        resource: resolveResourceUrl(resourceId, resourceConfig.endpoint),
        description: resourceConfig.description ?? resourceConfig.name,
        mimeType: resourceConfig.mimeType ?? 'application/json',
        payTo: normalizePayToAddress(resourceConfig.payTo, DEFAULT_X402_PAYTO).toLowerCase(),
        maxTimeoutSeconds: resourceConfig.maxTimeoutSeconds ?? 300,
        asset: USDC_ADDRESS,
        outputSchema: resourceConfig.schema?.output,
        extra: {
            resourceId,
            resourceName: resourceConfig.name,
            votBurnPercent: resourceConfig.votBurnPercent,
            tokenSymbol: resourceConfig.assetSymbol ?? 'USDC',
            cacheTTL: resourceConfig.cacheTTL,
            ...(resourceConfig.extra ?? {})
        }
    };
}

type SettlementStatus = 'settled' | 'pending';

export interface PaymentContext {
    paymentPayload: PaymentPayload;
    paymentRequirements: X402PaymentRequirements;
    resourceId: string;
    walletAddress: string;
    settlementTxHash?: string;
    paymentHash?: string;
    facilitatorSignature?: string;
    settlementStatus: SettlementStatus;
    settlementError?: string;
    payment: {
        payer: string;
        authorization: ExactEvmPayload['authorization'];
    };
}

function normalizeFacilitatorError(reason: unknown): string {
    if (reason instanceof Error) {
        return reason.message;
    }

    if (typeof reason === 'string') {
        return reason;
    }

    try {
        return JSON.stringify(reason);
    } catch {
        return String(reason);
    }
}

function facilitatorErrorIndicatesAlreadySettled(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('already settled') || normalized.includes('duplicate settlement');
}

function facilitatorErrorIsRecoverable(message: string): boolean {
    const normalized = message.toLowerCase();
    const recoverablePatterns = [
        '500',
        '502',
        '503',
        '504',
        'internal server error',
        'bad gateway',
        'gateway timeout',
        'temporarily unavailable',
        'temporary failure',
        'timeout',
        'rate limited',
        'network error',
        'failed to settle payment'
    ];

    return recoverablePatterns.some((pattern) => normalized.includes(pattern));
}

/**
 * Check rate limit for a wallet address
 */
function checkRateLimit(walletAddress?: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = (walletAddress ?? 'unknown').toLowerCase();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || now >= entry.resetTime) {
        // Start new rate limit window
        entry = {
            count: 0,
            resetTime: now + RATE_LIMIT_WINDOW
        };
        rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    const allowed = entry.count < RATE_LIMIT_MAX;
    const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);

    if (allowed) {
        entry.count += 1;
    }

    // Cleanup old entries (every 100 requests)
    if (rateLimitStore.size > 100) {
        for (const [addr, e] of rateLimitStore.entries()) {
            if (now >= e.resetTime) {
                rateLimitStore.delete(addr);
            }
        }
    }

    return {
        allowed,
        remaining,
        resetTime: Math.ceil((entry.resetTime - now) / 1000) // seconds
    };
}

/**
 * Decode payment header (base64-encoded x402 payment payload)
 *
 * Security hardening:
 * - Supports optional Bearer/base64: prefixes
 * - Utilizes official x402 decodePayment helper for strict schema validation
 */
function decodePaymentHeader(headerValue: string): PaymentPayload | null {
    try {
        // Strip optional "Bearer " prefix (case-insensitive)
        let base64Payload = headerValue;
        const bearerMatch = /^bearer\s+/i.exec(headerValue);
        if (bearerMatch) {
            base64Payload = headerValue.slice(bearerMatch[0].length);
        }

        if (base64Payload.startsWith('base64:')) {
            base64Payload = base64Payload.slice('base64:'.length);
        }

        const payload = decodePayment(base64Payload);
        if (payload.scheme !== 'exact' || payload.network !== 'base') {
            console.error('[x402] Unsupported payment payload received:', payload.scheme, payload.network);
            return null;
        }

        if (!('authorization' in payload.payload)) {
            console.error('[x402] Missing authorization in payment payload');
            return null;
        }

        return payload;
    } catch (error) {
        console.error('[x402] Payment header decode failed:', error);
        return null;
    }
}

/**
 * Verify payment with CDP facilitator
 *
 * In production, this would call the Coinbase Developer Platform API
 * to verify the EIP-3009 permit signature and settle on-chain.
 *
 * This middleware performs basic client-side validation and delegates verification
 * and settlement to the configured CDP facilitator. No mock or fallback settlement
 * is allowed in production; an explicit facilitator must be configured.
 */
async function verifyPaymentWithCDP(
    paymentPayload: PaymentPayload,
    paymentRequirements: X402PaymentRequirements,
    resourceConfig: ResourceConfig
): Promise<{
    verified: boolean;
    status?: SettlementStatus;
    settlementTxHash?: string;
    paymentHash?: string;
    facilitatorSignature?: string;
    payer?: string;
    error?: string;
}> {
    try {
        const facilitatorUrl = resolveFacilitatorUrl();

        const authorization = (paymentPayload.payload as ExactEvmPayload).authorization;
        // resourceConfig may be used by custom verification logic in the future; mark as used to satisfy linters
        void resourceConfig;
        const paymentHash = authorization?.nonce;
        const payerAddress = authorization?.from;
        const assetAddress = (paymentPayload.payload as ExactEvmPayload).asset || USDC_ADDRESS;

        // Facilitator URL MUST be configured. No mocks or fallbacks allowed.
        if (!facilitatorUrl) {
            console.error('[x402] CDP facilitator URL not configured. Rejecting payment.');
            return {
                verified: false,
                error: 'Facilitator unavailable - configuration required',
                paymentHash,
                payer: payerAddress
            };
        }

        // Basic client-side sanity checks for EIP-3009 authorization
        // - Must target the configured payTo address
        // - Must use USDC asset
        // - Must meet the min value for the resource
        // - Must be within validAfter/validBefore if present
        try {
            const expectedPayTo = (paymentRequirements.payTo || DEFAULT_X402_PAYTO).toLowerCase();
            const authTo = (authorization?.to || '').toLowerCase();
            const authValue = BigInt(authorization?.value || '0');
            const requiredValue = BigInt(paymentRequirements.maxAmountRequired || '0');

            if (!authTo || authTo !== expectedPayTo) {
                return {
                    verified: false,
                    error: `authorization.to must match facilitator payTo address (${expectedPayTo})`,
                    paymentHash,
                    payer: payerAddress
                };
            }

            if (!assetAddress || assetAddress.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
                return {
                    verified: false,
                    error: `authorization asset must be USDC (${USDC_ADDRESS})`,
                    paymentHash,
                    payer: payerAddress
                };
            }

            if (authValue < requiredValue) {
                return {
                    verified: false,
                    error: `authorization value ${authValue} below required ${requiredValue}`,
                    paymentHash,
                    payer: payerAddress
                };
            }

            const now = Math.floor(Date.now() / 1000);
            const validAfter = authorization?.validAfter ? Number(authorization.validAfter) : undefined;
            const validBefore = authorization?.validBefore ? Number(authorization.validBefore) : undefined;
            if (validAfter && now < validAfter) {
                return {
                    verified: false,
                    error: `authorization not yet valid (validAfter=${validAfter})`,
                    paymentHash,
                    payer: payerAddress
                };
            }
            if (validBefore && now > validBefore) {
                return {
                    verified: false,
                    error: `authorization expired (validBefore=${validBefore})`,
                    paymentHash,
                    payer: payerAddress
                };
            }
        } catch (sanityErr) {
            return {
                verified: false,
                error: `authorization validation failed: ${normalizeFacilitatorError(sanityErr)}`,
                paymentHash,
                payer: payerAddress
            };
        }
        // Optional extended debug logging to aid reproduction of payment errors
        const x402Debug = (process.env.X402_DEBUG_MIDDLEWARE === 'true');
        const sanitizeAuthForLog = (auth: { [k: string]: unknown } | undefined) => ({
            from: auth?.from?.toLowerCase?.() || auth?.from,
            to: auth?.to?.toLowerCase?.() || auth?.to,
            value: auth?.value ? String(auth.value) : undefined,
            nonce: typeof auth?.nonce === 'string' ? (auth.nonce.length > 12 ? `${auth.nonce.slice(0, 6)}...${auth.nonce.slice(-6)}` : auth.nonce) : undefined,
            validAfter: auth?.validAfter,
            validBefore: auth?.validBefore,
            signaturePreview: typeof auth?.signature === 'string' ? `${auth.signature.slice(0, 10)}...` : undefined
        });
        const sanitizeReqForLog = (req: { [k: string]: unknown } | undefined) => ({
            payTo: req?.payTo?.toLowerCase?.() || req?.payTo,
            maxAmountRequired: req?.maxAmountRequired,
            network: req?.network,
            resource: req?.resource,
            mimeType: req?.mimeType
        });
        if (x402Debug) {
            console.info('[x402-debug] PaymentRequirements', sanitizeReqForLog(paymentRequirements));
            console.info('[x402-debug] Authorization (sanitized)', sanitizeAuthForLog(authorization));
        }
        // No mock verification allowed. Proceed to call the real facilitator for verification.
        const facilitatorHeaders = async () => {
            // Priority: allow an existing bearer token, otherwise derive from CDP API ID/Secret
            const apiKey = process.env.CDP_API_KEY || process.env.FACILITATOR_API_KEY;

            if (apiKey) {
                const authHeaders = {
                    Authorization: `Bearer ${apiKey}`,
                    'X-API-KEY': apiKey
                };

                return {
                    verify: authHeaders,
                    settle: authHeaders,
                    supported: authHeaders,
                    list: authHeaders
                };
            }

            // Fallback: if CDP API ID/SECRET are configured, generate a short-lived JWT
            const cdpApiKeyId = process.env.CDP_API_KEY_ID;
            const cdpApiKeySecret = process.env.CDP_API_KEY_SECRET;

            if (cdpApiKeyId && cdpApiKeySecret) {
                try {
                    const urlObj = new URL(facilitatorUrl);
                    const host = urlObj.host;
                    const rawPath = urlObj.pathname || '';
                    const trimmedPath = rawPath.replace(/\/+$/, '');
                    const basePath = trimmedPath === '' || trimmedPath === '/' ? '' : trimmedPath;
                    const ensurePath = (path: string) => {
                        const suffix = path.startsWith('/') ? path : `/${path}`;
                        const combined = `${basePath}${suffix}`;
                        return combined.startsWith('/') ? combined : `/${combined}`;
                    };

                    const verifyToken = await generateCdpJwt({
                        apiKeyId: cdpApiKeyId,
                        apiKeySecret: cdpApiKeySecret,
                        requestMethod: 'POST',
                        requestHost: host,
                        requestPath: ensurePath('/verify'),
                        expiresIn: 120
                    });

                    const settleToken = await generateCdpJwt({
                        apiKeyId: cdpApiKeyId,
                        apiKeySecret: cdpApiKeySecret,
                        requestMethod: 'POST',
                        requestHost: host,
                        requestPath: ensurePath('/settle'),
                        expiresIn: 120
                    });

                    const listToken = await generateCdpJwt({
                        apiKeyId: cdpApiKeyId,
                        apiKeySecret: cdpApiKeySecret,
                        requestMethod: 'GET',
                        requestHost: host,
                        requestPath: ensurePath('/discovery/resources'),
                        expiresIn: 120
                    });

                    return {
                        verify: { Authorization: `Bearer ${verifyToken}` },
                        settle: { Authorization: `Bearer ${settleToken}` },
                        supported: { Authorization: `Bearer ${listToken}` },
                        list: { Authorization: `Bearer ${listToken}` }
                    };
                } catch (err) {
                    console.warn('[x402] Failed to generate CDP JWT from ID/Secret:', err);
                    return {
                        verify: {},
                        settle: {},
                        supported: {},
                    };
                }
            }

            return {
                verify: {},
                settle: {},
                supported: {}
            };
        };

        const facilitatorClient = createFacilitatorClient({
            url: facilitatorUrl,
            createAuthHeaders: facilitatorHeaders
        });

        const verifyResponse = await facilitatorClient.verify(paymentPayload, paymentRequirements);
        if (x402Debug) {
            // facilitator client response can be an object; avoid printing any signatures or secrets
            const sanitizedVerifyResponse = Object.assign({}, verifyResponse);
            // Remove or truncate any suspected signature fields
            if (sanitizedVerifyResponse?.facilitatorSignature) {
                sanitizedVerifyResponse.facilitatorSignature = `${String(sanitizedVerifyResponse.facilitatorSignature).slice(0, 10)}...`;
            }
            console.info('[x402-debug] Facilatator verifyResponse:', sanitizedVerifyResponse);
        }
        if (!verifyResponse.isValid) {
            return {
                verified: false,
                paymentHash,
                payer: verifyResponse.payer ?? payerAddress,
                error: verifyResponse.invalidReason || 'Facilitator rejected payment'
            };
        }

        try {
            const settleResponse = await facilitatorClient.settle(paymentPayload, paymentRequirements);
            if (x402Debug) {
                const sanitizedSettleResponse = Object.assign({}, settleResponse);
                if (sanitizedSettleResponse?.signature) {
                    sanitizedSettleResponse.signature = `${String(sanitizedSettleResponse.signature).slice(0, 10)}...`;
                }
                console.info('[x402-debug] Facilitator settleResponse:', sanitizedSettleResponse);
            }
            if (!settleResponse.success) {
                const errorReason = normalizeFacilitatorError(settleResponse.errorReason || 'Payment settlement failed');

                if (facilitatorErrorIndicatesAlreadySettled(errorReason)) {
                    console.warn('[x402] Facilitator reported payment already settled. Continuing.');
                    return {
                        verified: true,
                        status: 'settled',
                        settlementTxHash: settleResponse.transaction,
                        paymentHash,
                        payer: settleResponse.payer ?? payerAddress
                    };
                }

                if (facilitatorErrorIsRecoverable(errorReason)) {
                    console.warn('[x402] Facilitator settlement returned recoverable error. Queueing payout.', errorReason);
                    return {
                        verified: true,
                        status: 'pending',
                        paymentHash,
                        payer: settleResponse.payer ?? payerAddress,
                        error: errorReason
                    };
                }

                return {
                    verified: false,
                    paymentHash,
                    payer: settleResponse.payer ?? payerAddress,
                    error: errorReason
                };
            }

            return {
                verified: true,
                status: 'settled',
                settlementTxHash: settleResponse.transaction,
                paymentHash,
                payer: settleResponse.payer ?? payerAddress,
                facilitatorSignature: undefined
            };
        } catch (settleError) {
            if (x402Debug) {
                console.error('[x402-debug] Facilitator settleError:', normalizeFacilitatorError(settleError));
            }
            const errorMessage = normalizeFacilitatorError(settleError);
            console.error('[x402] Facilitator settlement error:', errorMessage);

            if (facilitatorErrorIndicatesAlreadySettled(errorMessage)) {
                return {
                    verified: true,
                    status: 'settled',
                    paymentHash,
                    payer: payerAddress
                };
            }

            if (facilitatorErrorIsRecoverable(errorMessage)) {
                console.warn('[x402] Treating facilitator settlement error as recoverable. Payment queued.');
                return {
                    verified: true,
                    status: 'pending',
                    paymentHash,
                    payer: payerAddress,
                    error: errorMessage
                };
            }

            return {
                verified: false,
                paymentHash,
                payer: payerAddress,
                error: errorMessage
            };
        }

    } catch (error) {
        if (process.env.X402_DEBUG_MIDDLEWARE === 'true') {
            console.error('[x402-debug] verifyPaymentWithCDP encountered error:', normalizeFacilitatorError(error));
            console.error('[x402-debug] paymentRequirements (for context):', {
                payTo: paymentRequirements?.payTo,
                maxAmountRequired: paymentRequirements?.maxAmountRequired,
                network: paymentRequirements?.network,
                resource: paymentRequirements?.resource
            });
        }
        const errorMessage = normalizeFacilitatorError(error);
        console.error('[x402] CDP facilitator verification error:', errorMessage);
        return {
            verified: false,
            paymentHash: undefined,
            payer: undefined,
            error: errorMessage
        };
    }
}

/**
 * Generate 402 Payment Required response with payment requirements
 * x402 V2: Returns PAYMENT-REQUIRED header with base64-encoded requirements
 * V1 compatibility: Also includes requirements in response body
 */
function generate402Response(resourceId: string, resourceConfig: ResourceConfig): NextResponse {
    const paymentRequirements = buildPaymentRequirements(resourceId, resourceConfig);

    // x402 V2 PaymentRequired structure
    const paymentRequired = {
        x402Version: 2,
        error: 'Payment required to access this resource',
        resource: {
            url: paymentRequirements.resource,
            description: paymentRequirements.description,
            mimeType: paymentRequirements.mimeType
        },
        accepts: [{
            scheme: paymentRequirements.scheme,
            network: `eip155:${paymentRequirements.network === 'base' ? '8453' : paymentRequirements.network === 'base-sepolia' ? '84532' : '8453'}`,
            asset: paymentRequirements.asset,
            payTo: paymentRequirements.payTo,
            maxTimeoutSeconds: paymentRequirements.maxTimeoutSeconds,
            amount: paymentRequirements.maxAmountRequired // V2 uses 'amount' not 'maxAmountRequired'
        }]
    };

    // Base64 encode for PAYMENT-REQUIRED header (V2 spec)
    const paymentRequiredBase64 = Buffer.from(JSON.stringify(paymentRequired)).toString('base64');

    const response = NextResponse.json(
        {
            // V1 body format for backward compatibility
            scheme: paymentRequirements.scheme,
            network: paymentRequirements.network,
            maxAmountRequired: paymentRequirements.maxAmountRequired,
            resource: paymentRequirements.resource,
            description: paymentRequirements.description,
            mimeType: paymentRequirements.mimeType,
            payTo: paymentRequirements.payTo,
            maxTimeoutSeconds: paymentRequirements.maxTimeoutSeconds,
            asset: paymentRequirements.asset,
            // V2 additions for clients that check body
            x402Version: 2,
            accepts: paymentRequired.accepts
        },
        { status: 402 }
    );
    
    // x402 V2 Header (required for V2 clients to detect version)
    response.headers.set('Payment-Required', `x402 ${paymentRequiredBase64}`);
    
    // V1 fallback headers for older clients
    response.headers.set('Access-Control-Expose-Headers', 'Payment-Required, Payment-Response, X-Settlement-TxHash, X-Payment-Hash, X-Facilitator-Signature, X-Payer-Address, X-Settlement-Status, X-Settlement-Error, X-RateLimit-Remaining');
    return response;
}

/**
 * x402 Payment Middleware Wrapper
 *
 * Wraps API route handlers to enforce payment verification.
 *
 * @param resourceId - Unique identifier for the protected resource
 * @param handler - The actual API route handler function
 * @returns Wrapped handler with payment enforcement
 */
export function withX402Payment(
    resourceId: string,
    handler: (req: NextRequest, context: PaymentContext) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
    return async (req: NextRequest): Promise<NextResponse> => {
        const EXPOSE_HEADERS = 'X-Settlement-TxHash, X-Payment-Hash, X-Facilitator-Signature, X-Payer-Address, X-Settlement-Status, X-Settlement-Error, X-RateLimit-Remaining';
        const origin = req.headers.get('origin') || '*';
        // Always compute resolved facilitator URL for diagnostics. This helps trace which endpoint was used in production.
        const resolvedFacilitatorUrlForRequest = resolveFacilitatorUrl();
        const userAgent = req.headers.get('user-agent');
        const setCors = (res: NextResponse) => {
            res.headers.set('Access-Control-Allow-Origin', origin);
            res.headers.set('Access-Control-Allow-Credentials', 'true');
            res.headers.set('Access-Control-Expose-Headers', EXPOSE_HEADERS);
            // Expose the resolved facilitator URL for observability/diagnostics
            res.headers.set('X-Facilitator-URL', resolvedFacilitatorUrlForRequest);
            return res;
        };

        // Embedded Wallets support - check if this is an embedded wallet request
        const embeddedWalletsConfig = {
            enabled: EMBEDDED_WALLETS_ENABLED,
            projectId: EMBEDDED_WALLETS_PROJECT_ID,
            fallbackToTraditional: true,
            autoRetry: true,
            retryAttempts: 3
        };

        const embeddedWalletSession = createEmbeddedWalletSession(userAgent, embeddedWalletsConfig);
        console.log('[x402] Embedded wallet session:', {
            sessionId: embeddedWalletSession.sessionId,
            embeddedWalletRequest: embeddedWalletSession.embeddedWalletRequest,
            userAgent
        });

        try {
            const resourceConfig = RESOURCE_CONFIGS[resourceId];
            if (!resourceConfig) {
                console.error(`[x402] Unknown resource ID: ${resourceId}`);
                const errResp = NextResponse.json({ error: `Unknown resource: ${resourceId}` }, { status: 500 });
                return setCors(errResp);
            }

            const paymentRequirements = buildPaymentRequirements(resourceId, resourceConfig);
            // x402 V2 Support: Check for PAYMENT-SIGNATURE header first, fall back to X-PAYMENT (V1)
            // V2 uses: PAYMENT-SIGNATURE (client→server), PAYMENT-REQUIRED (server→client), PAYMENT-RESPONSE (server→client)
            // V1 uses: X-PAYMENT (client→server), X-PAYMENT-RESPONSE (server→client)
            const paymentHeader = req.headers.get('payment-signature') || req.headers.get('x-payment');
            const x402Version = req.headers.get('payment-signature') ? 2 : 1;
            const embeddedWalletsHeader = req.headers.get('x-embedded-wallets');
            
            if (process.env.X402_DEBUG_MIDDLEWARE === 'true') {
                console.log(`[x402] Detected version: ${x402Version}, header source: ${x402Version === 2 ? 'PAYMENT-SIGNATURE' : 'X-PAYMENT'}`);
            }

            // Check if this is an embedded wallet request that needs special handling
            if (embeddedWalletSession.embeddedWalletRequest && embeddedWalletsHeader) {
                try {
                    // Import useX402 hook for embedded wallets
                    const { useX402 } = await import('@coinbase/cdp-hooks');

                    if (useX402) {
                        // Safely call useX402 which may throw if run outside a supported runtime or without a provider
                        let fetchWithPayment: FetchWithPaymentFn | null = null;
                        try {
                            fetchWithPayment = useX402();
                        } catch (hookCallError) {
                            console.warn('[x402] useX402 invocation failed on server; skipping embedded flow:', hookCallError);
                            fetchWithPayment = null;
                        }

                        // Extract payment details from embedded wallet request
                        const paymentDetails = {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-payment': paymentHeader || '',
                                'x-embedded-wallets': embeddedWalletsHeader
                            }
                        };

                        try {
                            // Resolve the absolute URL safely. NextRequest.url is absolute; using origin + req.url would create a malformed URL
                            // (e.g., https://hosthttps://host/path). Use req.nextUrl where available to build a proper origin-relative URL.
                            const reqPath = (req as NextRequestWithNextUrl).nextUrl?.pathname ?? new URL(req.url).pathname;
                            const reqSearch = (req as NextRequestWithNextUrl).nextUrl?.search ?? new URL(req.url).search;
                            const fullUrl = new URL(`${reqPath}${reqSearch}`, origin).toString();
                            // Use the new useX402 hook for embedded wallets
                            if (!fetchWithPayment) {
                                throw new Error('fetchWithPayment unavailable; useX402 could not be invoked on the server');
                            }
                            const embeddedResponse = await fetchWithPayment(fullUrl, paymentDetails);

                            if (embeddedResponse.ok) {
                                // Embedded wallet payment successful, proceed with normal processing
                                embeddedWalletSession.paymentAttempted = true;
                                embeddedWalletSession.paymentSuccess = true;

                                console.log('[x402] Embedded wallet payment successful:', {
                                    sessionId: embeddedWalletSession.sessionId,
                                    resourceId,
                                    payer: 'embedded-wallet-user'
                                });
                            }
                        } catch (embeddedError) {
                            console.warn('[x402] Embedded wallet payment failed, falling back to traditional:', embeddedError);
                            embeddedWalletSession.paymentAttempted = true;
                            embeddedWalletSession.paymentSuccess = false;
                            embeddedWalletSession.error = embeddedError instanceof Error ? embeddedError.message : 'Unknown error';
                        }
                        // If the embedded response was not ok, log the body for diagnostics
                        if (embeddedResponse && !embeddedResponse.ok) {
                            try {
                                const text = await embeddedResponse.text().catch(() => null);
                                console.warn('[x402] Embedded wallet non-OK response:', { status: embeddedResponse.status, body: text });
                            } catch {
                                /* ignore */
                            }
                        }
                    }
                } catch (importError) {
                    console.warn('[x402] Failed to import useX402 hook, using traditional payment flow:', importError);
                }
            }

            if (!paymentHeader) {
                const resp = generate402Response(resourceId, resourceConfig);
                return setCors(resp);
            }

            const paymentPayload = decodePaymentHeader(paymentHeader);
            if (!paymentPayload) {
                const invalidResp = NextResponse.json({ error: 'Invalid payment payload format' }, { status: 400 });
                return setCors(invalidResp);
            }

            const evmPayload = paymentPayload.payload as ExactEvmPayload;
            const authorization = evmPayload.authorization;
            const payerAddress = authorization.from;

            console.log(`[x402] Payment attempt for ${resourceId} from ${payerAddress}`);

            // Check rate limit
            const rateLimit = checkRateLimit(payerAddress);
            if (!rateLimit.allowed) {
                const rlResp = NextResponse.json(
                    {
                        error: 'Rate limit exceeded',
                        message: `Maximum ${RATE_LIMIT_MAX} requests per minute. Please try again in ${rateLimit.resetTime} seconds.`
                    },
                    {
                        status: 429,
                        headers: {
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': rateLimit.resetTime.toString()
                        }
                    }
                );
                return setCors(rlResp);
            }

            const verification = await verifyPaymentWithCDP(paymentPayload, paymentRequirements, resourceConfig);
            if (!verification.verified) {
                const resp = NextResponse.json({ error: 'Payment verification failed', details: verification.error }, { status: 403 });
                return setCors(resp);
            }

            const paymentContext: PaymentContext = {
                paymentPayload,
                paymentRequirements,
                resourceId,
                walletAddress: payerAddress,
                settlementTxHash: verification.settlementTxHash,
                paymentHash: verification.paymentHash,
                facilitatorSignature: verification.facilitatorSignature,
                settlementStatus: verification.status ?? 'settled',
                settlementError: verification.status === 'pending' ? verification.error : undefined,
                payment: {
                    payer: payerAddress,
                    authorization
                }
            };

            const response = await handler(req, paymentContext);

            // x402 V2: Set PAYMENT-RESPONSE header with settlement details
            const paymentResponse = {
                x402Version: 2,
                success: true,
                settlementTxHash: verification.settlementTxHash,
                paymentHash: verification.paymentHash,
                payer: payerAddress,
                status: paymentContext.settlementStatus
            };
            const paymentResponseBase64 = Buffer.from(JSON.stringify(paymentResponse)).toString('base64');
            response.headers.set('Payment-Response', `x402 ${paymentResponseBase64}`);

            // V1 legacy headers for backward compatibility
            if (verification.settlementTxHash) response.headers.set('X-Settlement-TxHash', verification.settlementTxHash);
            if (verification.paymentHash) response.headers.set('X-Payment-Hash', verification.paymentHash);
            if (verification.facilitatorSignature) response.headers.set('X-Facilitator-Signature', verification.facilitatorSignature);
            response.headers.set('X-Payer-Address', payerAddress);
            response.headers.set('X-Settlement-Status', paymentContext.settlementStatus);
            if (paymentContext.settlementError) response.headers.set('X-Settlement-Error', paymentContext.settlementError);
            response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());

            return setCors(response);
        } catch (error) {
            console.error('[x402] Middleware error:', error);
            const errResp = NextResponse.json(
                { error: 'Payment processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
                { status: 500 }
            );
            return setCors(errResp);
        }
    };
}

/**
 * Export helper to get resource configuration
 */
export function getResourceConfig(resourceId: string): ResourceConfig | null {
    return RESOURCE_CONFIGS[resourceId] || null;
}

export function listResourceConfigs(): Array<[string, ResourceConfig]> {
    return Object.entries(RESOURCE_CONFIGS);
}

// Export verifyPaymentWithCDP for debug/test usage
export { normalizeFacilitatorUrl, resolveFacilitatorUrl, verifyPaymentWithCDP };

