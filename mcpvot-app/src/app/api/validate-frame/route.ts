import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json({
                error: 'URL parameter required',
                usage: '?url=https://your-frame-url.com'
            });
        }

        // Fetch the frame metadata
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Farcaster-Frame-Validator/1.0'
            }
        });

        if (!response.ok) {
            return NextResponse.json({
                error: 'Failed to fetch URL',
                status: response.status,
                statusText: response.statusText
            }, { status: 400 });
        }

        const html = await response.text();

        // Extract frame metadata
        const frameMetaTags = {
            'fc:frame': extractMetaContent(html, 'fc:frame'),
            'fc:frame:image': extractMetaContent(html, 'fc:frame:image'),
            'fc:frame:image:aspect_ratio': extractMetaContent(html, 'fc:frame:image:aspect_ratio'),
            'fc:frame:post_url': extractMetaContent(html, 'fc:frame:post_url'),
        };

        // Extract button metadata (up to 4 buttons)
        const buttons = [];
        for (let i = 1; i <= 4; i++) {
            const button = extractMetaContent(html, `fc:frame:button:${i}`);
            const action = extractMetaContent(html, `fc:frame:button:${i}:action`);
            const target = extractMetaContent(html, `fc:frame:button:${i}:target`);

            if (button) {
                buttons.push({ index: i, label: button, action, target });
            }
        }

        // Validate frame
        const validation = {
            hasFrameTag: !!frameMetaTags['fc:frame'],
            hasImage: !!frameMetaTags['fc:frame:image'],
            hasPostUrl: !!frameMetaTags['fc:frame:post_url'],
            buttonCount: buttons.length,
            isValid: frameMetaTags['fc:frame'] && frameMetaTags['fc:frame:image'] && buttons.length > 0
        };

        return NextResponse.json({
            url,
            frameMetaTags,
            buttons,
            validation,
            htmlPreview: html.substring(0, 500) + (html.length > 500 ? '...' : '')
        });

    } catch (error) {
        console.error('Frame validation error:', error);
        return NextResponse.json({
            error: 'Failed to validate frame',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

function extractMetaContent(html: string, property: string): string | null {
    const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
}
