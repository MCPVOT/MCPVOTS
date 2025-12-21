import { WarpletCollector } from '@/lib/warplet/collector';
import { NextRequest, NextResponse } from 'next/server';

let collector: WarpletCollector | null = null;

function getCollector(): WarpletCollector {
    if (!collector) {
        const neynarApiKey = process.env.NEYNAR_API_KEY;
        const ipfsUrl = process.env.IPFS_URL;

        if (!neynarApiKey) {
            throw new Error('NEYNAR_API_KEY environment variable is required');
        }

        collector = new WarpletCollector(neynarApiKey, ipfsUrl);
    }
    return collector;
}

export async function GET(request: NextRequest) {
    try {
        // Check for authorization header (JWT token from payment receipt)
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid authorization token' },
                { status: 401 }
            );
        }

        // TODO: Validate JWT token against payment receipts
        // For now, accept any token for development
        const token = authHeader.substring(7);

        if (!token) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Collect latest analytics
        const collector = getCollector();
        const analytics = await collector.getLatestAnalytics();

        if (!analytics) {
            return NextResponse.json(
                { error: 'Failed to collect analytics' },
                { status: 500 }
            );
        }

        // Return analytics data
        return NextResponse.json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        });

    } catch (error) {
        console.error('Error in warplet-feed API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Admin endpoint to trigger fresh collection
        const authHeader = request.headers.get('authorization');
        if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const hoursBack = body.hoursBack || 24;

        const collector = getCollector();
        const analytics = await collector.collectAllAnalytics(hoursBack);

        return NextResponse.json({
            success: true,
            data: analytics,
            message: 'Analytics collected successfully',
        });

    } catch (error) {
        console.error('Error in warplet-feed POST:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
