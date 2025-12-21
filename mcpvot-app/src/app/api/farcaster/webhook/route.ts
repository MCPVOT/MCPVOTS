import { NextResponse } from 'next/server';

import {
    removeNotificationTokens,
    upsertNotificationToken,
} from '@/lib/farcasterNotificationStore';

export const runtime = 'nodejs';

interface WebhookEnvelope {
    header?: string;
    payload?: string;
    signature?: string;
    event?: string;
    notificationDetails?: {
        url?: string;
        token?: string;
        client?: string;
    };
    fid?: number;
}

interface DecodedPayload {
    event?: string;
    fid?: number;
    user?: { fid?: number };
    notificationDetails?: {
        url?: string;
        token?: string;
        client?: string;
    };
    [key: string]: unknown;
}

function decodePayload(payload?: string): DecodedPayload {
    if (!payload) {
        return {};
    }

    const decoders: BufferEncoding[] = ['base64url', 'base64'];

    for (const encoding of decoders) {
        try {
            const decoded = Buffer.from(payload, encoding).toString('utf8');
            return JSON.parse(decoded) as DecodedPayload;
        } catch {
            // Try the next encoding
        }
    }

    console.warn('[farcaster-webhook] Failed to decode payload');
    return {};
}

function resolveFid(decoded: DecodedPayload, envelope: WebhookEnvelope): number | undefined {
    return (
        decoded.fid ??
        decoded.user?.fid ??
        envelope.fid
    );
}

function resolveNotificationDetails(decoded: DecodedPayload, envelope: WebhookEnvelope) {
    return decoded.notificationDetails ?? envelope.notificationDetails;
}

export async function POST(req: Request) {
    let envelope: WebhookEnvelope;

    try {
        envelope = await req.json();
    } catch (error) {
        console.error('[farcaster-webhook] Unable to parse request body', error);
        return new Response('Invalid JSON body', { status: 400 });
    }

    const decoded = decodePayload(envelope.payload);
    const event = decoded.event ?? envelope.event;
    const fid = resolveFid(decoded, envelope);
    const details = resolveNotificationDetails(decoded, envelope);

    if (!event) {
        return new Response('Missing event type', { status: 400 });
    }

    try {
        switch (event) {
            case 'miniapp_added':
            case 'notifications_enabled': {
                if (typeof fid !== 'number' || !details?.token || !details?.url) {
                    console.warn('[farcaster-webhook] Missing fields for token upsert', { fid, details });
                    break;
                }

                await upsertNotificationToken(fid, {
                    token: details.token,
                    url: details.url,
                    client: details.client,
                });
                break;
            }
            case 'miniapp_removed':
            case 'notifications_disabled': {
                if (typeof fid !== 'number') {
                    console.warn('[farcaster-webhook] Missing fid for token removal', { event });
                    break;
                }

                await removeNotificationTokens(fid);
                break;
            }
            default: {
                console.info('[farcaster-webhook] Received unhandled event', { event });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[farcaster-webhook] Failed to process event', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
