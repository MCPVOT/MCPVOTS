import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // MAXX token address on Base
        const maxxAddress = '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467';

        // Fetch ETH price from CoinGecko (free API, no key required)
        let ethPrice = 3200; // Fallback
        try {
            const ethResponse = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
                { next: { revalidate: 60 } }
            );
            if (ethResponse.ok) {
                const ethData = await ethResponse.json();
                ethPrice = ethData.ethereum?.usd || 3200;
            }
        } catch (error) {
            console.log('CoinGecko ETH price fetch failed, using fallback:', error);
        }

        // Fetch from DexScreener API
        const dexscreenerUrl = `https://api.dexscreener.com/latest/dex/tokens/${maxxAddress}`;
        const dexscreenerResponse = await fetch(dexscreenerUrl, {
            next: { revalidate: 30 } // Cache for 30 seconds
        });

        if (!dexscreenerResponse.ok) {
            throw new Error('DexScreener API failed');
        }

        const dexscreenerData = await dexscreenerResponse.json();

        // Also try Birdeye API if available
        let birdeyeData = null;
        try {
            const birdeyeApiKey = process.env.BIRDEYE_API_KEY;
            if (birdeyeApiKey) {
                const birdeyeUrl = `https://public-api.birdeye.so/defi/token_overview?address=${maxxAddress}`;
                const birdeyeResponse = await fetch(birdeyeUrl, {
                    headers: {
                        'X-API-KEY': birdeyeApiKey
                    },
                    next: { revalidate: 30 }
                });

                if (birdeyeResponse.ok) {
                    birdeyeData = await birdeyeResponse.json();
                }
            }
        } catch (error) {
            console.log('Birdeye API not available:', error);
        }

        // Process DexScreener data
        let maxxData = {
            price: 0,
            priceChange24h: 0,
            volume24h: 0,
            liquidity: 0,
            marketCap: 0,
            priceEth: 0,
            ethPrice: ethPrice
        };

        if (dexscreenerData.pairs && dexscreenerData.pairs.length > 0) {
            const pair = dexscreenerData.pairs[0];
            const priceUsd = parseFloat(pair.priceUsd || '0');
            const priceEth = priceUsd > 0 && ethPrice > 0 ? priceUsd / ethPrice : parseFloat(pair.priceNative || '0');

            maxxData = {
                price: priceUsd,
                priceChange24h: parseFloat(pair.priceChange?.h24 || '0'),
                volume24h: parseFloat(pair.volume?.h24 || '0'),
                liquidity: parseFloat(pair.liquidity?.usd || '0'),
                marketCap: parseFloat(pair.marketCap || '0'),
                priceEth: priceEth,
                ethPrice: ethPrice
            };
        }

        // Use Birdeye data if more complete
        if (birdeyeData?.success && birdeyeData.data) {
            const bData = birdeyeData.data;
            maxxData = {
                ...maxxData,
                price: parseFloat(bData.price || maxxData.price),
                priceChange24h: parseFloat(bData.priceChange24hPercent || maxxData.priceChange24h),
                volume24h: parseFloat(bData.volume24hUSD || maxxData.volume24h),
                liquidity: parseFloat(bData.liquidity || maxxData.liquidity),
                marketCap: parseFloat(bData.mc || maxxData.marketCap)
            };
        }

        return NextResponse.json({
            success: true,
            data: {
                maxx: maxxData,
                timestamp: Date.now(),
                source: birdeyeData?.success ? 'birdeye+dexscreener+coingecko' : 'dexscreener+coingecko'
            }
        });

    } catch (error) {
        console.error('Prices API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch price data',
            timestamp: Date.now()
        }, { status: 500 });
    }
}
