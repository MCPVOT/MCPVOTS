import { execFile } from 'child_process';
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Not allowed in production' }, { status: 403 });
    }
    const url = new URL(req.url);
    const file = url.searchParams.get('file');
    if (!file) return NextResponse.json({ success: false, error: 'file required' }, { status: 400 });
    const score = url.searchParams.get('score') || '87';
    const token = url.searchParams.get('token') || path.parse(file).name;
    const volatility = url.searchParams.get('volatility') || '12';
    const trend = url.searchParams.get('trend') || '0.12';
    const theme = url.searchParams.get('theme') || 'dashboard';
    const style = url.searchParams.get('style') || 'neon-grid';
    const pixelSize = url.searchParams.get('pixelSize') || '8';

    const publicDir = path.join(process.cwd(), 'mcpvot-app', 'public');
    const baseImage = path.join('mcpvot-app', 'public', file);
    const outDir = path.join(publicDir, 'animated');
    const outPath = path.join(outDir, `${path.parse(file).name}-anim.svg`);
    fs.mkdirSync(outDir, { recursive: true });

    return new Promise<Response>((resolve) => {
        const script = path.join(process.cwd(), 'mcpvot-app', 'tools', 'generate_intel_svg.js');
        execFile(process.execPath, [script, '--score', score, '--token', token, '--volatility', volatility, '--trend', trend, '--theme', theme, '--style', style, '--pixel-size', pixelSize, '--base-image', baseImage, '--out', outPath], { cwd: process.cwd(), timeout: 20000 }, (err, stdout, stderr) => {
            if (err) {
                console.error('[animated-gen] failed', err, stdout, stderr);
                resolve(NextResponse.json({ success: false, error: String(err), stdout, stderr }, { status: 500 }));
                return;
            }
            try {
                const svgText = fs.readFileSync(outPath, 'utf8');
                const meta = { name: `${token} Animated Preview`, description: 'Auto-generated animated preview', image: `animated/${path.parse(file).name}-anim.svg`, attributes: [{ trait_type: 'score', value: Number(score) }, { trait_type: 'volatility', value: Number(volatility) }, { trait_type: 'trend', value: Number(trend) }] };
                const imageData = Buffer.from(svgText, 'utf8').toString('base64');
                Object.assign(meta, { image_data: `data:image/svg+xml;base64,${imageData}` });
                fs.writeFileSync(path.join(publicDir, 'animated', `${path.parse(file).name}-anim.json`), JSON.stringify(meta, null, 2));
                resolve(NextResponse.json({ success: true, meta }, { status: 200 }));
            } catch (e) {
                resolve(NextResponse.json({ success: false, error: String(e) }, { status: 500 }));
            }
        });
    });
}
