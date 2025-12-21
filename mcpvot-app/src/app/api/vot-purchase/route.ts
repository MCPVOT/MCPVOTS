import { VOTPurchaseSystem } from '@/lib/vot-purchase-system';
import { NextRequest, NextResponse } from 'next/server';

let purchaseSystem: VOTPurchaseSystem | null = null;

function getPurchaseSystem(): VOTPurchaseSystem {
    if (!purchaseSystem) {
        const neynarApiKey = process.env.NEYNAR_API_KEY;
        const paymentPrivateKey = process.env.X402_PAYMENT_PRIVATE_KEY;
        const ipfsUrl = process.env.IPFS_URL;

        if (!neynarApiKey) {
            throw new Error('NEYNAR_API_KEY environment variable is required');
        }

        if (!paymentPrivateKey) {
            throw new Error('X402_PAYMENT_PRIVATE_KEY environment variable is required');
        }

        purchaseSystem = new VOTPurchaseSystem(neynarApiKey, paymentPrivateKey, ipfsUrl);
    }
    return purchaseSystem;
}

export async function POST(request: NextRequest) {
    try {
        // Check for admin authorization
        const authHeader = request.headers.get('authorization');
        if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action } = body;

        const system = getPurchaseSystem();

        switch (action) {
            case 'analyze': {
                const decision = await system.analyzeAndPurchase();
                return NextResponse.json({
                    success: true,
                    data: decision,
                    timestamp: new Date().toISOString(),
                });
            }

            case 'analytics': {
                const analytics = await system.getAnalyticsSummary();
                return NextResponse.json({
                    success: true,
                    data: analytics,
                    timestamp: new Date().toISOString(),
                });
            }

            case 'status': {
                const lastPurchase = system.getLastPurchaseTime();
                return NextResponse.json({
                    success: true,
                    data: {
                        lastPurchaseTime: lastPurchase?.toISOString() || null,
                        isReady: true,
                    },
                    timestamp: new Date().toISOString(),
                });
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Use: analyze, analytics, or status' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Error in VOT purchase API:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const system = getPurchaseSystem();
        const decision = await system.analyzeAndPurchase();

        return NextResponse.json({
            success: true,
            data: {
                analysis: decision,
                lastPurchaseTime: system.getLastPurchaseTime()?.toISOString() || null,
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error in VOT purchase GET:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
