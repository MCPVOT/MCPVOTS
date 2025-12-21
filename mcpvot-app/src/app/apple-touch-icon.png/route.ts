import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    // Redirect apple-touch-icon requests to the branding icon (PNG fallback)
    const target = new URL('/branding/icon.png', req.url);
    return NextResponse.redirect(target, 302);
}
