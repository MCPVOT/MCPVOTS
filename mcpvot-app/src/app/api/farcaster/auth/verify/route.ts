import { NextResponse } from 'next/server';

import { getAppDomain, getFarcasterAuthClient } from '@/lib/farcasterAuthClient';
import { consumeNonce } from '@/lib/farcasterNonceStore';

export const runtime = 'nodejs';

interface VerifyRequestBody {
    nonce?: string;
    message?: string;
    signature?: `0x${string}`;
}

export async function POST(req: Request) {
    let payload: VerifyRequestBody;

    try {
        payload = await req.json();
    } catch (error) {
        console.error('[farcaster-auth] Failed to parse verify payload', error);
        return new Response('Invalid JSON body', { status: 400 });
    }

    const { nonce, message, signature } = payload;

    if (!nonce || !message || !signature) {
        return new Response('Missing nonce, message, or signature', { status: 400 });
    }

    if (!consumeNonce(nonce)) {
        return new Response('Nonce is invalid or expired', { status: 400 });
    }

    try {
        const client = getFarcasterAuthClient();
        const result = await client.verifySignInMessage({
            nonce,
            domain: getAppDomain(),
            message,
            signature,
            acceptAuthAddress: true,
        });

        return NextResponse.json({
            success: true,
            fid: result.fid,
            authMethod: result.authMethod,
            siweMessage: result.data,
        });
    } catch (error) {
        console.error('[farcaster-auth] verifySignInMessage failed', error);
        return new Response('Verification failed', { status: 401 });
    }
}
