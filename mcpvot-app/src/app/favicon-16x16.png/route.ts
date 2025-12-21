import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    // Redirect favicon-16x16.png requests to the branding icon (PNG fallback)
    // Using absolute URL derived from the incoming request to satisfy NextResponse requirements.
    const target = new URL('/branding/icon.png', req.url);
    return NextResponse.redirect(target, 302);
}
