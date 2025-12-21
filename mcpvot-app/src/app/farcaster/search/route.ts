import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const type = searchParams.get('type') || 'casts'; // casts, users, or channels

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            );
        }

        const neynarApiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;

        if (!neynarApiKey) {
            return NextResponse.json(
                { error: 'Neynar API configuration missing' },
                { status: 500 }
            );
        }

        let endpoint = '';
        const params = new URLSearchParams();

        switch (type) {
            case 'users':
                endpoint = 'https://api.neynar.com/v2/farcaster/user/search';
                params.set('q', query);
                params.set('limit', '20');
                break;
            case 'casts':
                endpoint = 'https://api.neynar.com/v2/farcaster/cast/search';
                params.set('q', query);
                params.set('limit', '25');
                break;
            case 'channels':
                endpoint = 'https://api.neynar.com/v2/farcaster/channel/search';
                params.set('q', query);
                params.set('limit', '10');
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid search type. Use: casts, users, or channels' },
                    { status: 400 }
                );
        }

        const response = await fetch(`${endpoint}?${params}`, {
            headers: {
                'api_key': neynarApiKey,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Neynar search API error:', errorData);
            return NextResponse.json(
                { error: 'Search failed', details: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            type,
            query,
            results: data.result || data,
        });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
