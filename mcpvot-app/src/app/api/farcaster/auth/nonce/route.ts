import { NextResponse } from 'next/server';

import { issueNonce } from '@/lib/farcasterNonceStore';

export const runtime = 'nodejs';

export async function GET() {
    const nonce = issueNonce();
    return NextResponse.json({ nonce });
}
