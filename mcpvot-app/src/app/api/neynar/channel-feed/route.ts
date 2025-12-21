import { NextRequest, NextResponse } from 'next/server';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2/farcaster';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channel_id');
    const limit = searchParams.get('limit') || '25';

    if (!channelId) {
        return NextResponse.json({ error: 'channel_id parameter required' }, { status: 400 });
    }

    if (!NEYNAR_API_KEY) {
        return NextResponse.json({ error: 'NEYNAR_API_KEY not configured' }, { status: 500 });
    }

    try {
        const response = await fetch(
            `${NEYNAR_BASE_URL}/feed/channels?channel_ids=${channelId}&limit=${limit}`,
            {
                headers: {
                    'api_key': NEYNAR_API_KEY,
                },
                next: { revalidate: 60 } // Cache for 1 minute
            }
        );

        if (!response.ok) {
            throw new Error(`Neynar API error: ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            casts: data.casts || []
        });
    } catch (error) {
        console.error('Error fetching channel feed:', error);
        return NextResponse.json({
            error: 'Failed to fetch channel feed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
