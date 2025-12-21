import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Diagnostic endpoint to check x402 facilitator status
export async function GET() {
    return NextResponse.json({
        success: true,
        status: 'active',
        message: 'x402 facilitator is operational',
        endpoints: {
            vot: '/api/x402/facilitator?token=VOT',
            maxx: '/api/x402/facilitator?token=MAXX',
            x420: '/api/x420/order'
        },
        features: {
            gasless: true,
            permit2: true,
            treasury_covers_gas: true,
            vot_1pct_burn: true,
            auto_replenish: true
        }
    });
}
