import { NextResponse } from 'next/server';

// VOT Token Constants
const VOT_TOKEN = {
    address: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
    name: 'VOT',
    symbol: 'VOT',
    decimals: 18,
    totalSupply: 1_000_000_000, // 1B total supply
    lpAllocation: 0.70, // 70% LP
    vaultAllocation: 0.30, // 30% vault
    vaultUnlockDate: '2025-11-18',
    fullyVestedDate: '2026-05-17',
    deployDate: '2025-11-11',
    clankerFee: 0.002, // 0.2%
    protocolFee: 0.01, // 1%
    totalFee: 0.012, // 1.2% total
    duneQueryId: 6177826,
};

const DUNE_API_KEY = process.env.DUNE_API_KEY;
const DUNE_QUERY_ID = process.env.DUNE_VOT_BURN_QUERY_ID || process.env.DUNE_VOT_BURNS_QUERY_ID || '6177826';

interface DuneResult {
    total_burned: number | null;
    burn_count: number;
    burned_24h: number | null;
    burned_7d: number | null;
    burned_30d: number | null;
    last_burn_time: string | null;
}

interface BurnStats {
    // Core burn metrics
    totalBurned: number;
    burnCount: number;
    burnRate: number; // percentage of supply burned
    
    // Time-based burns
    burned24h: number;
    burned7d: number;
    burned30d: number;
    lastBurnTime: string | null;
    
    // Supply metrics
    circulatingSupply: number;
    maxSupply: number;
    burnedPercentage: number;
    
    // VOT Tokenomics
    tokenomics: {
        lpAllocation: number;
        vaultAllocation: number;
        vaultUnlockDate: string;
        fullyVestedDate: string;
        deployDate: string;
        totalFee: number;
        clankerFee: number;
        protocolFee: number;
    };
    
    // x402 Facilitator Stats
    facilitator: {
        burnPerTransaction: number; // 1%
        maxxBonusVOT: number; // 10,000 VOT
        treasuryGasCover: number; // $0.05
    };
    
    // Metadata
    source: string;
    timestamp: string;
    duneQueryId: number;
}

export async function GET() {
    try {
        let duneData: DuneResult | null = null;
        
        // Try fetching from Dune Analytics
        if (DUNE_API_KEY && DUNE_QUERY_ID) {
            try {
                const response = await fetch(
                    `https://api.dune.com/api/v1/query/${DUNE_QUERY_ID}/results`,
                    {
                        headers: { 'X-Dune-API-Key': DUNE_API_KEY },
                        next: { revalidate: 300 }, // Cache 5min
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    duneData = data.result?.rows?.[0] || null;
                }
            } catch (duneError) {
                console.warn('Dune API fetch failed:', duneError);
            }
        }

        // Calculate burn statistics
        const totalBurned = duneData?.total_burned || 0;
        const burnCount = duneData?.burn_count || 0;
        const maxSupply = VOT_TOKEN.totalSupply;
        const circulatingSupply = maxSupply - totalBurned;
        const burnedPercentage = (totalBurned / maxSupply) * 100;
        
        // Build response
        const burnStats: BurnStats = {
            // Core metrics
            totalBurned,
            burnCount,
            burnRate: burnedPercentage,
            
            // Time-based
            burned24h: duneData?.burned_24h || 0,
            burned7d: duneData?.burned_7d || 0,
            burned30d: duneData?.burned_30d || 0,
            lastBurnTime: duneData?.last_burn_time || null,
            
            // Supply
            circulatingSupply,
            maxSupply,
            burnedPercentage,
            
            // Tokenomics
            tokenomics: {
                lpAllocation: VOT_TOKEN.lpAllocation * 100,
                vaultAllocation: VOT_TOKEN.vaultAllocation * 100,
                vaultUnlockDate: VOT_TOKEN.vaultUnlockDate,
                fullyVestedDate: VOT_TOKEN.fullyVestedDate,
                deployDate: VOT_TOKEN.deployDate,
                totalFee: VOT_TOKEN.totalFee * 100,
                clankerFee: VOT_TOKEN.clankerFee * 100,
                protocolFee: VOT_TOKEN.protocolFee * 100,
            },
            
            // x402 Facilitator
            facilitator: {
                burnPerTransaction: 1, // 1% burn per x402 purchase
                maxxBonusVOT: 10000, // 10K VOT bonus for MAXX purchases
                treasuryGasCover: 0.05, // $0.05 gas subsidy
            },
            
            // Metadata
            source: duneData ? 'dune' : 'fallback',
            timestamp: new Date().toISOString(),
            duneQueryId: parseInt(DUNE_QUERY_ID),
        };

        return NextResponse.json({
            success: true,
            data: burnStats,
            token: {
                address: VOT_TOKEN.address,
                name: VOT_TOKEN.name,
                symbol: VOT_TOKEN.symbol,
                decimals: VOT_TOKEN.decimals,
                chain: 'base',
                chainId: 8453,
            },
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('Burn stats API error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to fetch burn stats',
            },
            { status: 500 }
        );
    }
}

// POST endpoint to trigger burn tracking (for x402 facilitator)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { amount, txHash, source } = body;

        // Log burn event
        console.log('🔥 VOT Burn Event:', {
            amount,
            txHash,
            source,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: 'Burn event logged',
            data: {
                amount,
                txHash,
                source,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Burn log error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to log burn event' },
            { status: 500 }
        );
    }
}
