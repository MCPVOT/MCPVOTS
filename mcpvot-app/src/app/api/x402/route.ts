import { DEFAULT_X402_PAYTO, listResourceConfigs, type ResourceConfig } from '@/lib/x402/middleware';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const X402_VERSION = 0.3;
const USDC_DECIMALS = 1_000_000; // 6 decimals on Base USDC
const DEFAULT_ORIGIN = 'https://mcpvot.xyz';
const DEFAULT_NETWORK = 'base';
const DEFAULT_ASSET = 'usdc:base';

function toAtomic(amount: number): string {
    const atomic = Math.floor(amount * USDC_DECIMALS);
    return atomic.toString();
}

function normalizeOrigin(): string {
    const envCandidates = [
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.APP_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ];

    for (const candidate of envCandidates) {
        if (!candidate) {
            continue;
        }
        // Skip 'production' as it's not a valid URL
        if (candidate.trim() === 'production') {
            continue;
        }
        const trimmed = candidate.trim().replace(/\/$/, '');
        if (trimmed.length === 0) {
            continue;
        }
        if (trimmed.startsWith('http')) {
            return trimmed;
        }
        return `https://${trimmed}`;
    }

    return DEFAULT_ORIGIN;
}

function resolveResourceUrl(origin: string, endpoint: string | undefined, resourceId: string): string {
    const path = endpoint ?? `/api/x402/${resourceId}`;
    return new URL(path, origin).toString();
}

function buildAcceptEntry(origin: string, resourceId: string, config: ResourceConfig, payTo: string) {
    const payToTarget = config.payTo ?? payTo;

    return {
        scheme: 'exact' as const,
        network: DEFAULT_NETWORK,
        resource: resolveResourceUrl(origin, config.endpoint, resourceId),
        maxAmountRequired: toAtomic(config.costUSDC),
        asset: config.assetSymbol ?? DEFAULT_ASSET,
        payTo: payToTarget,
        description: config.description ?? config.name,
        mimeType: config.mimeType ?? 'application/json',
        outputSchema: config.schema,
        maxTimeoutSeconds: config.maxTimeoutSeconds ?? 300,
        extra: {
            cacheTTLSeconds: String(config.cacheTTL),
            votBurnPercent: String(config.votBurnPercent),
            resourceId,
            priceUSD: config.costUSDC.toFixed(2),
        },
    };
}

export async function GET() {
    const payTo = process.env.SERVER_WALLET_ADDRESS || process.env.NEXT_PUBLIC_SERVER_WALLET || DEFAULT_X402_PAYTO;

    const origin = normalizeOrigin();
    const accepts = listResourceConfigs().map(([resourceId, config]) =>
        buildAcceptEntry(origin, resourceId, config, payTo)
    );

    const responseBody = {
        x402Version: X402_VERSION,
        accepts,
        extra: {
            provider: 'MCPVOT x402 Facilitator',
            description: 'Gasless VOT & MAXX token purchases + VOT Machine NFT minting on Base',
            contact: 'support@mcpvot.xyz',
            documentation: `${origin}/docs/x402`,
            homepage: origin,
            tokens: {
                VOT: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
                MAXX: '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467'
            },
            treasury: '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa',
            features: ['gasless-swap', 'instant-delivery', 'vot-burn', 'maxx-bonus', 'nft-minting']
        },
    };

    const response = NextResponse.json(responseBody, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60',
        },
    });

    response.headers.set('Vary', 'Origin');

    return response;
}

export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get('origin') ?? '*';
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            // x402 V2: Allow both V1 (X-PAYMENT) and V2 (Payment-Signature) headers
            'Access-Control-Allow-Headers': 'Content-Type, Payment-Signature, X-PAYMENT',
            'Access-Control-Allow-Credentials': 'true',
            // x402 V2: Expose Payment-Required and Payment-Response headers
            'Access-Control-Expose-Headers': 'Payment-Required, Payment-Response, X-Settlement-TxHash, X-Payment-Hash, X-Facilitator-Signature, X-Payer-Address, X-Settlement-Status, X-Settlement-Error, X-RateLimit-Remaining',
            'Access-Control-Max-Age': '86400',
        },
    });
}
