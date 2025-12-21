import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Not allowed in production' }, { status: 403 });
    }
    try {
        const dir = path.join(process.cwd(), 'mcpvot-app', 'public');
        const files = fs.readdirSync(dir).filter(f => {
            const ext = path.extname(f).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext);
        });
        return NextResponse.json({ success: true, files }, { status: 200 });
    } catch (e) {
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
}
