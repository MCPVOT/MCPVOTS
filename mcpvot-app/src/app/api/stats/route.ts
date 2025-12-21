import { NextResponse } from 'next/server';
import { createPublicClient, formatGwei, formatUnits, http } from 'viem';
import { base } from 'viem/chains';

// Cache for rate limiting (10 second cache to respect CoinGecko rate limits)
let cachedStats: {
  gasPrice: string;
  gasPriceGwei: number;
  votPrice: number;
  votPriceFormatted: string;
  votChange24h: number;
  votBurned: string;
  votBurnedFormatted: string;
  timestamp: number;
  source: string;
} | null = null;

const CACHE_TTL = 10000; // 10 seconds
const VOT_TOKEN_ADDRESS = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';
const BURN_ADDRESS = '0x0000000000000000000000000000000000000000';
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

// CoinGecko API for VOT on Base
const COINGECKO_URL = `https://api.coingecko.com/api/v3/simple/token_price/base?contract_addresses=${VOT_TOKEN_ADDRESS}&vs_currencies=usd&include_24hr_change=true`;

// GeckoTerminal API for VOT/WETH pool on Base (CONFIRMED WORKING)
const VOT_WETH_POOL = '0xb7730dd50a401a0e57c7438e6d532b6aeccea33254834f4ebfe8311e46f2ce2c';
const GECKOTERMINAL_URL = `https://api.geckoterminal.com/api/v2/networks/base/pools/${VOT_WETH_POOL}`;

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Initialize Base client
const baseClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

async function fetchGasPrice(): Promise<{ gwei: number; formatted: string }> {
  try {
    const gasPrice = await baseClient.getGasPrice();
    const gwei = parseFloat(formatGwei(gasPrice));
    return {
      gwei: Math.round(gwei * 1000) / 1000,
      formatted: gwei < 0.001 ? '<0.001' : gwei.toFixed(3),
    };
  } catch (error) {
    console.warn('[Stats API] Gas price fetch failed:', error);
    return { gwei: 0.001, formatted: '0.001' };
  }
}

async function fetchVOTPrice(): Promise<{ price: number; formatted: string; change24h: number; source: string }> {
  // Try GeckoTerminal first (CONFIRMED WORKING for VOT/WETH pool)
  try {
    const response = await fetch(GECKOTERMINAL_URL, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const price = parseFloat(data?.data?.attributes?.base_token_price_usd || '0');
      const change = parseFloat(data?.data?.attributes?.price_change_percentage?.h24 || '0');
      if (price > 0) {
        console.log('[Stats API] GeckoTerminal VOT price:', price);
        return {
          price,
          formatted: formatVOTPrice(price),
          change24h: Math.round(change * 100) / 100,
          source: 'geckoterminal',
        };
      }
    }
  } catch (error) {
    console.warn('[Stats API] GeckoTerminal fetch failed:', error);
  }

  // Try CoinGecko second (may not have VOT listed)
  try {
    const response = await fetch(COINGECKO_URL, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const tokenData = data[VOT_TOKEN_ADDRESS.toLowerCase()];
      if (tokenData) {
        const price = tokenData.usd ?? 0;
        const change = tokenData.usd_24h_change ?? 0;
        if (price > 0) {
          console.log('[Stats API] CoinGecko VOT price:', price);
          return {
            price,
            formatted: formatVOTPrice(price),
            change24h: Math.round(change * 100) / 100,
            source: 'coingecko',
          };
        }
      }
    }
  } catch (error) {
    console.warn('[Stats API] CoinGecko fetch failed:', error);
  }

  // Fallback: DexScreener (has VOT/WETH pool data)
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${VOT_TOKEN_ADDRESS}`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      const data = await response.json();
      const pair = data?.pairs?.[0];
      if (pair) {
        const price = parseFloat(pair.priceUsd || '0');
        const change = parseFloat(pair.priceChange?.h24 || '0');
        if (price > 0) {
          console.log('[Stats API] DexScreener VOT price:', price);
          return {
            price,
            formatted: formatVOTPrice(price),
            change24h: Math.round(change * 100) / 100,
            source: 'dexscreener',
          };
        }
      }
    }
  } catch (error) {
    console.warn('[Stats API] DexScreener fetch failed:', error);
  }

  // Final fallback
  return { price: 0, formatted: '$0.00', change24h: 0, source: 'none' };
}

function formatVOTPrice(price: number): string {
  if (price === 0) return '$0.00';
  if (price < 0.000001) return `$${price.toExponential(2)}`;
  if (price < 0.0001) return `$${price.toFixed(8)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

// Original VOT supply: 100,000,000,000 (100 billion)
// Current confirmed supply: 99,999,999,998 (2 VOT burned)
const ORIGINAL_SUPPLY = BigInt('100000000000000000000000000000'); // 100B with 18 decimals
const CONFIRMED_CURRENT_SUPPLY = BigInt('99999999998000000000000000000'); // 99,999,999,998 with 18 decimals

// ERC20 totalSupply ABI
const TOTAL_SUPPLY_ABI = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

async function fetchBurnedVOT(): Promise<{ burned: bigint; formatted: string; burned24h: string }> {
  try {
    // Try to get actual totalSupply from contract
    let currentSupply: bigint;
    try {
      currentSupply = await baseClient.readContract({
        address: VOT_TOKEN_ADDRESS as `0x${string}`,
        abi: TOTAL_SUPPLY_ABI,
        functionName: 'totalSupply',
      });
    } catch {
      // If contract call fails, use confirmed supply
      currentSupply = CONFIRMED_CURRENT_SUPPLY;
    }

    // Also check burn addresses for any tokens sent there
    const [burnBalanceZero, burnBalanceDead] = await Promise.all([
      baseClient.readContract({
        address: VOT_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [BURN_ADDRESS as `0x${string}`],
      }).catch(() => BigInt(0)),
      baseClient.readContract({
        address: VOT_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [DEAD_ADDRESS as `0x${string}`],
      }).catch(() => BigInt(0)),
    ]);

    // Total burned = (original - current) + tokens in burn addresses
    const supplyBurned = ORIGINAL_SUPPLY - currentSupply;
    const addressBurned = burnBalanceZero + burnBalanceDead;
    const totalBurned = supplyBurned > addressBurned ? supplyBurned : supplyBurned + addressBurned;

    const formatted = formatUnits(totalBurned, 18);
    const numericValue = parseFloat(formatted);

    // Format for display
    let displayFormatted: string;
    if (numericValue >= 1_000_000_000) {
      displayFormatted = `${(numericValue / 1_000_000_000).toFixed(2)}B`;
    } else if (numericValue >= 1_000_000) {
      displayFormatted = `${(numericValue / 1_000_000).toFixed(2)}M`;
    } else if (numericValue >= 1_000) {
      displayFormatted = `${(numericValue / 1_000).toFixed(2)}K`;
    } else if (numericValue >= 1) {
      displayFormatted = numericValue.toFixed(0);
    } else {
      displayFormatted = numericValue.toFixed(2);
    }

    console.log('[Stats API] VOT burned:', displayFormatted, '(supply diff:', formatUnits(supplyBurned, 18), ')');
    return { burned: totalBurned, formatted: displayFormatted, burned24h: '0' };
  } catch (error) {
    console.warn('[Stats API] Burn balance fetch failed:', error);
    // Fallback: use known burn amount (2 VOT)
    return { burned: BigInt('2000000000000000000'), formatted: '2', burned24h: '0' };
  }
}

export async function GET() {
  try {
    // Return cached if fresh
    if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedStats, {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
        },
      });
    }

    // Fetch all in parallel
    const [gasData, votData, burnData] = await Promise.all([
      fetchGasPrice(),
      fetchVOTPrice(),
      fetchBurnedVOT(),
    ]);

    cachedStats = {
      gasPrice: gasData.formatted,
      gasPriceGwei: gasData.gwei,
      votPrice: votData.price,
      votPriceFormatted: votData.formatted,
      votChange24h: votData.change24h,
      votBurned: burnData.burned.toString(),
      votBurnedFormatted: burnData.formatted,
      timestamp: Date.now(),
      source: votData.source,
    };

    return NextResponse.json(cachedStats, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('[Stats API] Error:', error);
    return NextResponse.json(
      {
        gasPrice: '0.01',
        gasPriceGwei: 0.01,
        votPrice: 0,
        votPriceFormatted: '$0.00',
        votChange24h: 0,
        votBurned: '0',
        votBurnedFormatted: '0',
        timestamp: Date.now(),
        source: 'none',
        error: 'Failed to fetch stats',
      },
      { status: 500 }
    );
  }
}
