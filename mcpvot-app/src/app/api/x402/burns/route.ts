import { NextResponse } from 'next/server';

const DUNE_API_KEY = process.env.DUNE_API_KEY;
// Support multiple env var names + hardcoded fallback
const DUNE_QUERY_ID = process.env.DUNE_VOT_BURN_QUERY_ID || process.env.DUNE_VOT_BURNS_QUERY_ID || '6177826';

export async function GET() {
    if (!DUNE_API_KEY) {
        // Return fallback data if Dune not configured
        return NextResponse.json({
            success: true,
            data: {
                total_burned: 0,
                burn_count: 0,
                burned_24h: 0,
            },
            source: 'fallback',
            message: 'Dune API not configured, returning placeholder data',
        });
    }

    try {
        const response = await fetch(
            `https://api.dune.com/api/v1/query/${DUNE_QUERY_ID}/results`,
            {
                headers: { 'X-Dune-API-Key': DUNE_API_KEY },
                next: { revalidate: 300 }, // Cache 5min
            }
        );

        if (!response.ok) {
            throw new Error(`Dune API error: ${response.status}`);
        }

        const data = await response.json();
        const rows = data.result?.rows || [];

        const result = rows[0] || {
            total_burned: 0,
            burn_count: 0,
            burned_24h: 0,
        };

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Dune API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch burn data' },
            { status: 500 }
        );
    }
}
