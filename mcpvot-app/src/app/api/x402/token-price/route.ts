import { NextResponse } from 'next/server';

// Token addresses on Base
const VOT_ADDRESS = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';
const MAXX_ADDRESS = '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467';

// DexScreener API for token prices
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens';

interface TokenPrice {
  address: string;
  symbol: string;
  name: string;
  priceUsd: string | null;
  priceChange24h: number | null;
  volume24h: number | null;
  liquidity: number | null;
  marketCap: number | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token')?.toLowerCase() || 'both';
  
  try {
    const tokens: TokenPrice[] = [];
    
    // Fetch VOT price
    if (token === 'vot' || token === 'both') {
      const votPrice = await fetchTokenPrice(VOT_ADDRESS, 'VOT', 'Voice of Truth');
      tokens.push(votPrice);
    }
    
    // Fetch MAXX price
    if (token === 'maxx' || token === 'both') {
      const maxxPrice = await fetchTokenPrice(MAXX_ADDRESS, 'MAXX', 'MAXX Token');
      tokens.push(maxxPrice);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      chain: 'base',
      chainId: 8453,
      data: token === 'both' ? tokens : tokens[0],
    });
  } catch (error) {
    console.error('Token price error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch token prices',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function fetchTokenPrice(address: string, symbol: string, name: string): Promise<TokenPrice> {
  try {
    const response = await fetch(`${DEXSCREENER_API}/${address}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    
    if (!response.ok) {
      return getDefaultPrice(address, symbol, name);
    }
    
    const data = await response.json();
    const pair = data.pairs?.[0];
    
    if (!pair) {
      return getDefaultPrice(address, symbol, name);
    }
    
    return {
      address,
      symbol,
      name,
      priceUsd: pair.priceUsd || null,
      priceChange24h: parseFloat(pair.priceChange?.h24 || '0'),
      volume24h: parseFloat(pair.volume?.h24 || '0'),
      liquidity: pair.liquidity?.usd || null,
      marketCap: pair.marketCap || null,
    };
  } catch {
    return getDefaultPrice(address, symbol, name);
  }
}

function getDefaultPrice(address: string, symbol: string, name: string): TokenPrice {
  return {
    address,
    symbol,
    name,
    priceUsd: null,
    priceChange24h: null,
    volume24h: null,
    liquidity: null,
    marketCap: null,
  };
}
