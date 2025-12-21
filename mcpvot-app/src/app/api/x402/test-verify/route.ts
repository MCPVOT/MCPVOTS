import type { ResourceConfig } from '@/lib/x402/middleware';
import * as x402 from '@/lib/x402/middleware';
import { NextResponse } from 'next/server';
import type { PaymentPayload } from 'x402/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    const resourceId = 'vot-buy-1usd';
    const resourceConfig = x402.getResourceConfig(resourceId);
    if (!resourceConfig) {
        return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 400 });
    }

    const paymentRequirements = x402.buildPaymentRequirements(resourceId, resourceConfig as ResourceConfig);

    const fakePayload: PaymentPayload = {
        scheme: 'exact',
        network: 'base',
        payload: {
            authorization: {
                from: '0x662741340B7c58f3fd30FD4908c6A8c0f9297d25',
                to: (paymentRequirements.payTo || '') as string,
                value: paymentRequirements.maxAmountRequired,
                nonce: '0x01',
                validAfter: 0,
                validBefore: Math.floor(Date.now() / 1000) + 3600,
                signature: '0x'
            },
            asset: paymentRequirements.asset
        } as unknown as PaymentPayload
    } as PaymentPayload;

    try {
        const verification = await x402.verifyPaymentWithCDP(fakePayload, paymentRequirements, resourceConfig as ResourceConfig);
        return NextResponse.json({ success: true, verification }, { status: 200 });
    } catch (error) {
        // Return detailed debug info for diagnosis (safe since this route is for local dev)
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json({ success: false, error: message, stack }, { status: 500 });
    }
}
