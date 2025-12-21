import { NextRequest, NextResponse } from 'next/server';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2/farcaster';

export async function GET(request: NextRequest, { params }: { params: Promise<{ fid: string }> }) {
    const { fid } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';

    if (!NEYNAR_API_KEY) {
        return NextResponse.json({ error: 'NEYNAR_API_KEY not configured' }, { status: 500 });
    }

    try {
        const response = await fetch(
            `${NEYNAR_BASE_URL}/notifications?fid=${fid}&limit=${limit}`,
            {
                headers: {
                    'api_key': NEYNAR_API_KEY,
                },
                next: { revalidate: 30 } // Cache for 30 seconds (notifications need to be fresh)
            }
        );

        if (!response.ok) {
            throw new Error(`Neynar API error: ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            notifications: data.notifications || []
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({
            error: 'Failed to fetch notifications',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
