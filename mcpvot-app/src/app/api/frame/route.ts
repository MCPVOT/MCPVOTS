/**
 * Farcaster Frame API for MCPVOT NFT Minting
 * Provides an incredible interactive Frame experience for minting NFT dashboards
 */

import { NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface FrameButton {
    label: string;
    action: 'post' | 'post_redirect' | 'link' | 'mint' | 'tx';
    target?: string;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const step = searchParams.get('step') || 'home';
    const tier = searchParams.get('tier') || '';
    const holder = searchParams.get('holder') === 'true';

    const imageUrl = `${APP_URL}/api/frame/image?step=${step}&tier=${tier}&holder=${holder}`;
    let buttons: FrameButton[] = [];
    const postUrl = `${APP_URL}/api/frame`;

    switch (step) {
        case 'home':
            buttons = [
                { label: '🎮 View Dashboard', action: 'post', target: `${postUrl}?step=dashboard` },
                { label: '💎 Mint NFT', action: 'post', target: `${postUrl}?step=select` },
                { label: '🔥 VOT Burns', action: 'post', target: `${postUrl}?step=stats` },
                { label: '📊 Analytics', action: 'link', target: `${APP_URL}/arcade` }
            ];
            break;

        case 'select':
            buttons = [
                { label: '⚡ Basic $2', action: 'post', target: `${postUrl}?step=mint&tier=basic` },
                { label: '💎 Premium $2', action: 'post', target: `${postUrl}?step=mint&tier=premium` },
                { label: '🌟 Legendary $2', action: 'post', target: `${postUrl}?step=mint&tier=legendary` },
                { label: '🔙 Back', action: 'post', target: `${postUrl}?step=home` }
            ];
            break;

        case 'mint':
            buttons = [
                {
                    label: `✨ Mint ${tier.toUpperCase()}`,
                    action: 'link',
                    target: `${APP_URL}/mint?tier=${tier}`
                },
                { label: '🔙 Select Tier', action: 'post', target: `${postUrl}?step=select` }
            ];
            break;

        case 'stats':
            buttons = [
                { label: '📈 Refresh', action: 'post', target: `${postUrl}?step=stats` },
                { label: '💎 Mint Now', action: 'post', target: `${postUrl}?step=select` },
                { label: '🏠 Home', action: 'post', target: `${postUrl}?step=home` }
            ];
            break;

        case 'dashboard':
            buttons = [
                { label: '🔄 Refresh Data', action: 'post', target: `${postUrl}?step=dashboard` },
                { label: '💎 Mint NFT', action: 'post', target: `${postUrl}?step=select` },
                { label: '🏠 Home', action: 'post', target: `${postUrl}?step=home` }
            ];
            break;

        case 'success':
            buttons = [
                { label: '🎮 View Dashboard', action: 'link', target: `${APP_URL}/arcade` },
                { label: '� Burn Stats', action: 'post', target: `${postUrl}?step=stats` },
                { label: '� Mint Another', action: 'post', target: `${postUrl}?step=select` }
            ];
            break;
    }

    const frameHtml = generateFrameHTML({
        title: 'MCPVOT Intelligence NFT',
        description: 'Mint your animated dashboard NFT with live intelligence access',
        imageUrl,
        buttons,
        postUrl
    });

    return new NextResponse(frameHtml, {
        headers: { 'Content-Type': 'text/html' }
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { untrustedData } = body;

        const buttonIndex = untrustedData?.buttonIndex || 1;
        const fid = untrustedData?.fid;
        const castId = untrustedData?.castId;

        // Log interaction for analytics
        console.log('📱 Frame interaction:', {
            fid,
            buttonIndex,
            castId,
            timestamp: new Date().toISOString()
        });

        // Check if user has Warpcast NFT for special benefits (1.5x burn rewards)
        let isWarpcastHolder = false;
        if (fid) {
            try {
                const holderCheck = await fetch(`${APP_URL}/api/verify-warpcast?fid=${fid}`);
                const holderData = await holderCheck.json();
                isWarpcastHolder = holderData.isHolder || false;
            } catch (err) {
                console.error('Warpcast verification failed:', err);
            }
        }

        // Handle button actions based on current step
        const { searchParams } = new URL(request.url);
        const step = searchParams.get('step') || 'home';
        const tier = searchParams.get('tier') || '';

        // Determine next step based on button pressed
        let nextStep = 'home';
        let nextTier = tier;

        if (step === 'home') {
            if (buttonIndex === 1) nextStep = 'dashboard';
            if (buttonIndex === 2) nextStep = 'select';
            if (buttonIndex === 3) nextStep = 'stats';
        } else if (step === 'select') {
            if (buttonIndex === 1) { nextStep = 'mint'; nextTier = 'basic'; }
            if (buttonIndex === 2) { nextStep = 'mint'; nextTier = 'premium'; }
            if (buttonIndex === 3) { nextStep = 'mint'; nextTier = 'legendary'; }
            if (buttonIndex === 4) nextStep = 'home';
        } else if (step === 'mint') {
            if (buttonIndex === 2) nextStep = 'select';
        } else if (step === 'stats') {
            if (buttonIndex === 1) nextStep = 'stats'; // Refresh
            if (buttonIndex === 2) nextStep = 'select';
            if (buttonIndex === 3) nextStep = 'home';
        } else if (step === 'dashboard') {
            if (buttonIndex === 1) nextStep = 'dashboard'; // Refresh
            if (buttonIndex === 2) nextStep = 'select';
            if (buttonIndex === 3) nextStep = 'home';
        }

        const redirectUrl = `${APP_URL}/api/frame?step=${nextStep}&tier=${nextTier}&holder=${isWarpcastHolder}`;

        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error('Frame POST error:', error);
        return NextResponse.json({ error: 'Invalid frame request' }, { status: 400 });
    }
}

function generateFrameHTML({
    title,
    description,
    imageUrl,
    buttons,
    postUrl
}: {
    title: string;
    description: string;
    imageUrl: string;
    buttons: FrameButton[];
    postUrl: string;
}) {
    const buttonTags = buttons
        .map((btn, idx) => {
            const lines = [
                `<meta property="fc:frame:button:${idx + 1}" content="${btn.label}" />`,
                `<meta property="fc:frame:button:${idx + 1}:action" content="${btn.action}" />`
            ];

            if (btn.target) {
                lines.push(`<meta property="fc:frame:button:${idx + 1}:target" content="${btn.target}" />`);
            }

            return lines.join('\n    ');
        })
        .join('\n    ');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>

    <!-- Open Graph -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />

    <!-- Farcaster Frame v2 -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:post_url" content="${postUrl}" />
    ${buttonTags}

    <!-- x402 Payment Integration -->
    <meta property="x402:accepts:usdc" content="true" />
    <meta property="x402:amount" content="2.00" />
    <meta property="x402:network" content="base" />

    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        p {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 2rem;
        }
        img {
            max-width: 500px;
            width: 100%;
            height: auto;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
    </style>
</head>
<body>
    <h1>🎮 ${title}</h1>
    <p>${description}</p>
    <img src="${imageUrl}" alt="${title}" />
    <p style="margin-top: 2rem; opacity: 0.7;">View in Farcaster for full interactive experience</p>
</body>
</html>`;
}
