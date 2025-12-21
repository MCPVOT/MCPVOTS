import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const channel = searchParams.get('channel') || 'mcpvot';
        const limit = parseInt(searchParams.get('limit') || '10');

        // Try WarpCast API first (using the configured API key)
        const farcasterApiKey = process.env.NEXT_PUBLIC_FARCASTER_API_KEY;

        if (farcasterApiKey && farcasterApiKey !== 'wc_secret_e395aed7yyy') {
            try {
                const response = await fetch(
                    `https://api.warpcast.com/v2/casts?channel=${channel}&limit=${limit}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${farcasterApiKey}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    return NextResponse.json({
                        casts: data.result?.casts || [],
                        channel,
                        limit,
                        source: 'warpcast'
                    });
                }
            } catch (warpcastError) {
                console.log('WarpCast API failed:', warpcastError);
            }
        }

        // Fallback: try Neynar API for public Farcaster data
        const neynarApiKey = process.env.NEYNAR_API_KEY;
        if (neynarApiKey && neynarApiKey !== 'NEYNAR_API_DOCS') {
            try {
                // Try to get channel info first to get the channel ID
                const channelResponse = await fetch(
                    `https://api.neynar.com/v2/farcaster/channel?channel_id=${channel}`,
                    {
                        headers: {
                            'x-api-key': neynarApiKey,
                        },
                    }
                );

                if (channelResponse.ok) {
                    const channelData = await channelResponse.json();
                    if (channelData.channel) {
                        // Now fetch casts from this channel
                        const response = await fetch(
                            `https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=${channelData.channel.id}&limit=${limit}`,
                            {
                                headers: {
                                    'x-api-key': neynarApiKey,
                                },
                            }
                        );

                        if (response.ok) {
                            const data = await response.json();
                            return NextResponse.json({
                                casts: data.casts || [],
                                channel,
                                limit,
                                source: 'neynar'
                            });
                        }
                    }
                }

                // Fallback: try search approach for channels that might not exist
                const response = await fetch(
                    `https://api.neynar.com/v2/farcaster/cast/search?q=%23${channel}&limit=${limit}`,
                    {
                        headers: {
                            'x-api-key': neynarApiKey,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    return NextResponse.json({
                        casts: data.result?.casts || [],
                        channel,
                        limit,
                        source: 'neynar'
                    });
                }
            } catch (neynarError) {
                console.log('Neynar API failed:', neynarError);
            }
        }

        // Final fallback: return empty array with error indication
        return NextResponse.json({
            casts: [],
            channel,
            limit,
            source: 'none',
            error: 'No working Farcaster API available'
        });

    } catch (error) {
        console.error('Casts API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch casts' },
            { status: 500 }
        );
    }
}
