import { NextRequest, NextResponse } from 'next/server';

interface CastRequestBody {
    text?: string;
    embeds?: unknown[];
    channel?: string;
    replyTo?: string;
}

interface NeynarCastPayload {
    signer_uuid: string;
    text: string;
    embeds?: unknown[];
    channel_id?: string;
    reply_to?: string;
}

export async function POST(request: NextRequest) {
    try {
        const { text, embeds, channel, replyTo }: CastRequestBody = await request.json();

        if (!text) {
            return NextResponse.json(
                { error: 'Text is required for casting' },
                { status: 400 }
            );
        }

        const neynarApiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
        const signerUuid = process.env.NEYNAR_SIGNER_UUID;

        if (!neynarApiKey || !signerUuid) {
            return NextResponse.json(
                { error: 'Neynar API configuration missing' },
                { status: 500 }
            );
        }

        // Prepare the cast payload
        const castPayload: NeynarCastPayload = {
            signer_uuid: signerUuid,
            text,
        };

        // Add optional parameters if provided
        if (embeds && Array.isArray(embeds) && embeds.length > 0) {
            castPayload.embeds = embeds;
        }

        if (channel) {
            castPayload.channel_id = channel;
        }

        if (replyTo) {
            castPayload.reply_to = replyTo;
        }

        // Post the cast using Neynar API
        const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api_key': neynarApiKey,
            },
            body: JSON.stringify(castPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Neynar API error:', errorData);
            return NextResponse.json(
                { error: 'Failed to post cast', details: errorData },
                { status: response.status }
            );
        }

        const castData = await response.json();

        return NextResponse.json({
            success: true,
            cast: castData.cast,
            hash: castData.cast?.hash,
        });

    } catch (error) {
        console.error('Cast API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
