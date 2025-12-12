import { NextResponse } from 'next/server';

import {
    removeNotificationTokens,
    upsertNotificationToken,
} from '@/lib/farcasterNotificationStore';

export const runtime = 'nodejs';

/**
 * FIP-2 Compliant Webhook Handler
 * 
 * Handles Farcaster Mini App lifecycle events:
 * - frame_added / miniapp_added: User adds/enables the mini app
 * - frame_removed / miniapp_removed: User removes/disables the mini app
 * - notifications_enabled: User enables notifications
 * - notifications_disabled: User disables notifications
 * 
 * Notification rate limits per FIP-2:
 * - 1 notification per 30 seconds per token
 * - 100 notifications per day per token
 */

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

    console.warn('[webhook] Failed to decode payload');
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
        console.error('[webhook] Unable to parse request body', error);
        return new Response('Invalid JSON body', { status: 400 });
    }

    const decoded = decodePayload(envelope.payload);
    const event = decoded.event ?? envelope.event;
    const fid = resolveFid(decoded, envelope);
    const details = resolveNotificationDetails(decoded, envelope);

    console.log('[webhook] Received event:', { event, fid, hasDetails: !!details });

    if (!event) {
        return new Response('Missing event type', { status: 400 });
    }

    try {
        switch (event) {
            // FIP-2 Mini App lifecycle events
            case 'frame_added':
            case 'miniapp_added':
            case 'notifications_enabled': {
                if (typeof fid !== 'number' || !details?.token || !details?.url) {
                    console.warn('[webhook] Missing fields for token upsert', { fid, details });
                    break;
                }

                await upsertNotificationToken(fid, {
                    token: details.token,
                    url: details.url,
                    client: details.client,
                });
                console.log('[webhook] Token upserted for FID:', fid);
                break;
            }
            case 'frame_removed':
            case 'miniapp_removed':
            case 'notifications_disabled': {
                if (typeof fid !== 'number') {
                    console.warn('[webhook] Missing fid for token removal', { event });
                    break;
                }

                await removeNotificationTokens(fid);
                console.log('[webhook] Token removed for FID:', fid);
                break;
            }
            default: {
                console.info('[webhook] Received unhandled event', { event });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[webhook] Failed to process event', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

// GET endpoint for webhook verification
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'MCPVOT Farcaster Mini App Webhook',
        version: '1.0.0',
        supportedEvents: [
            'frame_added',
            'frame_removed',
            'miniapp_added',
            'miniapp_removed',
            'notifications_enabled',
            'notifications_disabled',
        ],
    });
}
