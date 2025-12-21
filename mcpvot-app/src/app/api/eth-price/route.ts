import { NextResponse } from 'next/server';

/**
 * GET /api/eth-price
 * Fetches current ETH price from CoinGecko (free, no API key required)
 */
export async function GET() {
    try {
        // CoinGecko Simple Price API (free tier, no auth)
        const coingeckoUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true';

        const response = await fetch(coingeckoUrl, {
            next: { revalidate: 60 }, // Cache for 60 seconds
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`CoinGecko API returned ${response.status}`);
        }

        const data = await response.json();

        if (!data.ethereum?.usd) {
            throw new Error('Invalid response from CoinGecko');
        }

        return NextResponse.json({
            success: true,
            data: {
                price: data.ethereum.usd,
                change24h: data.ethereum.usd_24h_change || 0,
                timestamp: Date.now(),
                source: 'coingecko'
            }
        });

    } catch (error) {
        console.error('ETH price API error:', error);

        // Fallback to estimated price if CoinGecko fails
        return NextResponse.json({
            success: true,
            data: {
                price: 3200, // Approximate fallback
                change24h: 0,
                timestamp: Date.now(),
                source: 'fallback'
            }
        });
    }
}
