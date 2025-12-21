import { NextRequest, NextResponse } from 'next/server';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2/farcaster';

const FALLBACK_CHANNELS = [
    {
        id: 'warpcast-developers',
        name: 'Warpcast Developers',
        url: 'https://warpcast.com/~/channel/warpcast',
        imageUrl: 'https://warpcast.com/~/channel-images/default.png',
        followerCount: 21500,
        description: 'Ship updates and SDK drops from the Warpcast engineering team.'
    },
    {
        id: 'farcaster-ai',
        name: 'Farcaster AI',
        url: 'https://warpcast.com/~/channel/farcasterai',
        imageUrl: 'https://warpcast.com/~/channel-images/default.png',
        followerCount: 18750,
        description: 'Daily experiments and prompts for Farcaster-native builders.'
    },
    {
        id: 'base',
        name: 'Base',
        url: 'https://warpcast.com/~/channel/base',
        imageUrl: 'https://warpcast.com/~/channel-images/default.png',
        followerCount: 16500,
        description: 'Official Base network updates and ecosystem spotlights.'
    },
];

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';

    if (!NEYNAR_API_KEY) {
        return NextResponse.json({ success: true, channels: FALLBACK_CHANNELS, source: 'fallback' });
    }

    try {
        const response = await fetch(
            `${NEYNAR_BASE_URL}/feed/channels/trending?limit=${limit}`,
            {
                headers: {
                    'api_key': NEYNAR_API_KEY,
                },
                next: { revalidate: 300 } // Cache for 5 minutes
            }
        );

        if (!response.ok) {
            console.warn(`Neynar trending channels request failed`, {
                status: response.status,
                statusText: response.statusText
            });
        }

        const data = response.ok ? await response.json() : null;

        return NextResponse.json({
            success: true,
            channels: data && Array.isArray(data.channels) && data.channels.length > 0 ? data.channels : FALLBACK_CHANNELS,
            source: data && Array.isArray(data.channels) && data.channels.length > 0 ? 'neynar' : 'fallback'
        });
    } catch (error) {
        console.error('Error fetching trending channels:', error);
        return NextResponse.json({
            success: true,
            channels: FALLBACK_CHANNELS,
            source: 'fallback',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
