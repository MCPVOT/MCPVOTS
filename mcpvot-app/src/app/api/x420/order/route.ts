import { mcp_maxx_memory_store_memory } from '@/lib/mcp-memory-client';
import { NextResponse } from 'next/server';

const ALLOWED_AMOUNTS = [4.2];
const DEFAULT_PRICE_USD = 0.000012; // Placeholder per x420 in USD until oracle wired
const QUOTE_TTL_SECONDS = 180;

interface QuotePayload {
    usdAmount: number;
    tokenAmount: number;
    pricePerTokenUsd: number;
    vaultGasCoverUsd: number;
    expiresAt: string;
    // Compatibility fields for shared component
    votAmount: number;
    pricePerVotUsd: number;
}

function validateAmount(amount: number) {
    if (Number.isNaN(amount)) {
        throw new Error('Amount must be a number');
    }
    const matched = ALLOWED_AMOUNTS.some((allowed) => Math.abs(amount - allowed) < 0.001);
    if (!matched) {
        throw new Error(`Amount must be one of ${ALLOWED_AMOUNTS.join(', ')} USD`);
    }
}

async function createQuote(usdAmount: number): Promise<QuotePayload> {
    const pricePerTokenUsd = DEFAULT_PRICE_USD;
    const tokenAmount = parseFloat((usdAmount / pricePerTokenUsd).toFixed(0));
    const vaultGasCoverUsd = parseFloat((Math.max(usdAmount * 0.0125, 0.15)).toFixed(2));
    const expiresAt = new Date(Date.now() + QUOTE_TTL_SECONDS * 1000).toISOString();

    return {
        usdAmount,
        tokenAmount,
        pricePerTokenUsd,
        votAmount: tokenAmount,
        pricePerVotUsd: pricePerTokenUsd,
        vaultGasCoverUsd,
        expiresAt
    };
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const usdAmountParam = url.searchParams.get('usdAmount');
        const usdAmount = usdAmountParam ? parseFloat(usdAmountParam) : ALLOWED_AMOUNTS[0];
        validateAmount(usdAmount);

        const quote = await createQuote(usdAmount);
        return NextResponse.json({ success: true, quote });
    } catch (error) {
        console.error('[x420 Order] Quote error:', error);
        const message = error instanceof Error ? error.message : 'Unable to create quote';
        return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const usdAmount = parseFloat(body?.usdAmount);
        const walletAddress = typeof body?.walletAddress === 'string' ? body.walletAddress : undefined;
        const farcasterFid = typeof body?.farcasterFid === 'number' ? body.farcasterFid : undefined;
        const source = typeof body?.source === 'string' ? body.source : 'web';

        validateAmount(usdAmount);
        if (!walletAddress) {
            throw new Error('walletAddress is required');
        }

        const quote = await createQuote(usdAmount);

        const x402Payment = {
            facilitator: 'cdp',
            paycode: `x402-cdp-x420-${usdAmount.toFixed(2)}usd-${Date.now()}`,
            expiresInSeconds: QUOTE_TTL_SECONDS,
            status: 'pending' as const
        };

        const memoryId = await mcp_maxx_memory_store_memory({
            content: JSON.stringify({
                type: 'x420_quote_requested',
                usdAmount: quote.usdAmount,
                tokenAmount: quote.tokenAmount,
                pricePerTokenUsd: quote.pricePerTokenUsd,
                walletAddress,
                farcasterFid,
                paycode: x402Payment.paycode,
                facilitator: x402Payment.facilitator,
                expiresAt: quote.expiresAt,
                source
            }),
            vector: new Array(64).fill(0),
            category: 'x420_orders',
            metadata: {
                walletAddress,
                farcasterFid,
                paycode: x402Payment.paycode,
                usdAmount: quote.usdAmount,
                source
            }
        });

        const memory = memoryId
            ? { status: 'stored' as const, id: memoryId }
            : { status: 'offline' as const };

        return NextResponse.json({ success: true, quote, x402Payment, memory });
    } catch (error) {
        console.error('[x420 Order] Request error:', error);
        const message = error instanceof Error ? error.message : 'Unable to start order';
        return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
}
