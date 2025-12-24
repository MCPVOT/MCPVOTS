import { NextResponse } from 'next/server';

// Contract addresses
const CONTRACTS = {
  VOT: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
  MAXX: '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467',
  BEEPER: process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  WETH: '0x4200000000000000000000000000000000000006',
};

// APIs
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens';

interface EcosystemStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  chain: {
    name: string;
    chainId: number;
    rpcUrl: string;
  };
  contracts: Record<string, { address: string; status: string }>;
  tokens: {
    vot: TokenInfo | null;
    maxx: TokenInfo | null;
  };
  services: {
    api: boolean;
    mcp: boolean;
    x402: boolean;
    dune: boolean;
  };
  x402: {
    facilitatorAddress: string;
    paymentToken: string;
    mintPrice: string;
    active: boolean;
  };
}

interface TokenInfo {
  price: string | null;
  change24h: number | null;
  volume24h: number | null;
}

async function fetchTokenInfo(address: string): Promise<TokenInfo | null> {
  try {
    const response = await fetch(`${DEXSCREENER_API}/${address}`, {
      next: { revalidate: 120 },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const pair = data.pairs?.[0];
    
    if (!pair) return null;
    
    return {
      price: pair.priceUsd || null,
      change24h: parseFloat(pair.priceChange?.h24 || '0'),
      volume24h: parseFloat(pair.volume?.h24 || '0'),
    };
  } catch {
    return null;
  }
}

async function checkDuneStatus(): Promise<boolean> {
  const apiKey = process.env.DUNE_API_KEY;
  const queryId = process.env.DUNE_VOT_BURNS_QUERY_ID || process.env.DUNE_VOT_BURN_QUERY_ID || '6177826';
  
  if (!apiKey) return false;
  
  try {
    const response = await fetch(
      `https://api.dune.com/api/v1/query/${queryId}/results?limit=1`,
      {
        headers: { 'X-Dune-API-Key': apiKey },
        next: { revalidate: 300 },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    // Fetch token data in parallel
    const [votInfo, maxxInfo, duneStatus] = await Promise.all([
      fetchTokenInfo(CONTRACTS.VOT),
      fetchTokenInfo(CONTRACTS.MAXX),
      checkDuneStatus(),
    ]);

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (!duneStatus) status = 'degraded';
    if (!votInfo && !maxxInfo && !duneStatus) status = 'down';

    const ecosystemStatus: EcosystemStatus = {
      status,
      timestamp: new Date().toISOString(),
      chain: {
        name: 'Base',
        chainId: 8453,
        rpcUrl: 'https://mainnet.base.org',
      },
      contracts: {
        VOT: { address: CONTRACTS.VOT, status: 'active' },
        MAXX: { address: CONTRACTS.MAXX, status: 'active' },
        BEEPER: { address: CONTRACTS.BEEPER, status: 'active' },
        USDC: { address: CONTRACTS.USDC, status: 'active' },
        WETH: { address: CONTRACTS.WETH, status: 'active' },
      },
      tokens: {
        vot: votInfo,
        maxx: maxxInfo,
      },
      services: {
        api: true,
        mcp: true,
        x402: true,
        dune: duneStatus,
      },
      x402: {
        facilitatorAddress: '0xaBE7D52c8242d1C89d7fa5D77A08B8b9EC25B4bc',
        paymentToken: 'USDC',
        mintPrice: '1.00',
        active: true,
      },
    };

    return NextResponse.json({
      success: true,
      data: ecosystemStatus,
    });
  } catch (error) {
    console.error('Ecosystem status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ecosystem status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
