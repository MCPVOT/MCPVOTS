import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('📝 Starting cast creation...');

        const { text, embeds = [], channel, replyTo, signerUuid } = await request.json();

        console.log('📄 Cast text:', text?.substring(0, 50) + (text?.length > 50 ? '...' : ''));
        console.log('🔗 Embeds count:', embeds?.length || 0);
        console.log('📺 Channel:', channel);
        console.log('↩️ Reply to:', replyTo);
        console.log('🔑 Custom signer UUID:', signerUuid);

        if (!text || typeof text !== 'string') {
            console.error('❌ Invalid cast text provided');
            return NextResponse.json(
                { error: 'Cast text is required and must be a string' },
                { status: 400 }
            );
        }

        // Try Direct Casts API first (doesn't require signer approval)
        const directCastApiKey = process.env.FARCASTER_DIRECT_CAST_API_KEY;

        if (directCastApiKey) {
            console.log('🚀 Using Direct Casts API...');

            // Prepare Direct Cast payload
            const payload = {
                text,
                embeds: embeds || [],
            };

            // Call Direct Casts API
            const response = await fetch('https://api.farcaster.xyz/v2/casts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${directCastApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            console.log('📡 Direct Casts API response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Direct Casts API success!');
                return NextResponse.json({
                    success: true,
                    cast: result.cast,
                    hash: result.cast?.hash,
                    method: 'direct_casts'
                });
            } else {
                const errorText = await response.text();
                console.log('⚠️ Direct Casts API failed:', response.status, errorText);
                console.log('🔄 Falling back to Neynar...');
            }
        } else {
            console.log('⏭️ Direct Casts API key not configured, skipping to Neynar');
        }

        // Fallback to Neynar API
        console.log('🔄 Using Neynar API as fallback...');
        const neynarApiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
        const defaultSignerUuid = process.env.NEYNAR_SIGNER_UUID;

        // Use provided signer UUID or fall back to default
        const effectiveSignerUuid = signerUuid || defaultSignerUuid;

        console.log('🔑 Using signer UUID:', effectiveSignerUuid ? 'configured' : 'missing');
        console.log('🗝️ Neynar API key:', neynarApiKey ? 'configured' : 'missing');

        if (!neynarApiKey) {
            console.error('❌ Neynar API key not configured');
            return NextResponse.json(
                { error: 'Neynar API key not configured' },
                { status: 500 }
            );
        }

        if (!effectiveSignerUuid) {
            console.error('❌ No signer UUID available (neither custom nor default)');
            return NextResponse.json(
                { error: 'No signer UUID available. Use signer-request endpoint to create an approved signer.' },
                { status: 500 }
            );
        }

        // Prepare Neynar cast payload
        const payload = {
            text,
            signer_uuid: effectiveSignerUuid,
            embeds: embeds || [],
            ...(channel && { channel_id: channel }),
            ...(replyTo && { parent: replyTo }),
        };

        console.log('📦 Prepared Neynar payload:', JSON.stringify(payload, null, 2));

        // Call Neynar API to post cast
        const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
            method: 'POST',
            headers: {
                'api_key': neynarApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        console.log('📡 Neynar API response status:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Neynar cast API error:', response.status, errorData);

            // Check if it's a signer approval issue
            if (response.status === 403 && errorData.includes('SignerNotApproved')) {
                console.log('🚫 Signer not approved. Need to approve via mobile app.');
                return NextResponse.json(
                    {
                        error: `Signer not approved: ${errorData}`,
                        solution: 'Use /api/farcaster/signer-request to create an approved signer',
                        method: 'neynar'
                    },
                    { status: response.status }
                );
            }

            return NextResponse.json(
                { error: `Failed to post cast: ${response.status} - ${errorData}`, method: 'neynar' },
                { status: response.status }
            );
        }

        const result = await response.json();
        console.log('✅ Neynar cast API success!');

        return NextResponse.json({
            success: true,
            cast: result.cast,
            hash: result.cast?.hash,
            method: 'neynar',
            signerUsed: effectiveSignerUuid
        });
    } catch (error) {
        console.error('💥 Cast API error:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json(
            {
                error: 'Failed to post cast',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
