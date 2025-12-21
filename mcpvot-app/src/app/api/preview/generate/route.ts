import { execFile } from 'child_process';
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
    // Limit to dev only
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Not allowed in production' }, { status: 403 });
    }

    const script = path.join(process.cwd(), 'tools', 'generate_intel_svg.js');
    const url = new URL(req.url);
    const score = url.searchParams.get('score') || '87';
    const token = url.searchParams.get('token') || 'MAXX';
    const volatility = url.searchParams.get('volatility') || '12';
    const trend = url.searchParams.get('trend') || '0.12';
    const theme = url.searchParams.get('theme') || 'dashboard';
    const style = url.searchParams.get('style') || 'neon-grid';
    const pixelSize = url.searchParams.get('pixelSize') || '8';
    const baseImage = url.searchParams.get('baseImage') || '';
    return new Promise<Response>((resolve) => {
        const params = [script, '--score', score, '--token', token, '--volatility', volatility, '--trend', trend, '--theme', theme, '--style', style, '--pixel-size', pixelSize, '--out', path.join(process.cwd(), 'x402-test', 'public', 'preview.svg')];
        if (baseImage) params.push('--base-image', baseImage);
        execFile(process.execPath, params, { cwd: process.cwd(), timeout: 10000 }, (err, stdout, stderr) => {
            if (err) {
                console.error('[preview-generator] failed', err, stdout, stderr);
                resolve(NextResponse.json({ success: false, error: String(err), stdout, stderr }, { status: 500 }));
                return;
            }
            // Also write metadata and include inline image_data fallback
            try {
                const svgPath = path.join(process.cwd(), 'x402-test', 'public', 'preview.svg');
                const svgText = fs.readFileSync(svgPath, 'utf8');
                const imageData = Buffer.from(svgText, 'utf8').toString('base64');
                const meta = {
                    name: `${token} Intelligence Preview`,
                    description: 'Auto-generated preview',
                    image: 'preview.svg',
                    image_data: `data:image/svg+xml;base64,${imageData}`,
                    attributes: [{ trait_type: 'score', value: Number(score) }, { trait_type: 'volatility', value: Number(volatility) }, { trait_type: 'trend', value: Number(trend) }]
                };
                fs.writeFileSync(path.join(process.cwd(), 'x402-test', 'public', 'preview.json'), JSON.stringify(meta, null, 2));
                resolve(NextResponse.json({ success: true, meta }, { status: 200 }));
                return;
            } catch (e) {
                console.error('[preview-generator] writing meta failed', e);
                resolve(NextResponse.json({ success: true, meta: null }, { status: 200 }));
                return;
            }
        });
    });
}
