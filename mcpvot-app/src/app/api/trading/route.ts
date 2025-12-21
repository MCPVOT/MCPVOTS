import { NextResponse } from 'next/server';

// Disable database functionality for now to avoid connection issues
const useDb = false;

interface Trade {
    id: string;
    timestamp: number;
    type: string;
    amount: number;
    price: number;
    profit: number;
    status: string;
    tx_hash?: string;
    gas_used?: number;
}

interface TradingStats {
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
    totalVolume: number;
    totalProfit: number;
    winRate: number;
}

interface DatabaseTrade {
    id: number;
    timestamp: number;
    type: string;
    usd_amount: number;
    token_amount: number;
    price_usd: number;
    tx_hash: string | null;
    gas_used: number;
    success: boolean;
}

// No postgres client since database is disabled
const sql = null;

async function ensureTradesTable() {
    // Database disabled - no-op
    return;
}

export async function GET() {
    try {
        // Skip database operations if no database is configured
        if (!useDb || !process.env.POSTGRES_URL) {
            return NextResponse.json({
                trades: [],
                stats: {
                    totalTrades: 0,
                    successfulTrades: 0,
                    failedTrades: 0,
                    totalVolume: 0,
                    totalProfit: 0,
                    winRate: 0
                },
                message: "Database not configured - returning empty data"
            });
        }

        let recentTrades: Trade[] = [];
        let tradingStats: TradingStats = {
            totalTrades: 0,
            successfulTrades: 0,
            failedTrades: 0,
            totalVolume: 0,
            totalProfit: 0,
            winRate: 0
        };

        try {
            // Connect to Postgres database
            await ensureTradesTable();

            // Get recent trades (last 10)
            const tradesResult = await sql`
                SELECT * FROM trades
                ORDER BY timestamp DESC
                LIMIT 10
            `;

            // Convert database rows to our interface format
            recentTrades = (tradesResult as DatabaseTrade[]).map((row: DatabaseTrade) => ({
                id: `trade_${row.id}`,
                timestamp: row.timestamp * 1000, // Convert to milliseconds
                type: row.type,
                amount: row.token_amount,
                price: row.price_usd,
                profit: 0, // Calculate profit if needed
                status: row.success ? 'completed' : 'failed',
                tx_hash: row.tx_hash || undefined,
                gas_used: row.gas_used
            }));

            // Calculate trading statistics
            const allTradesResult = await sql`SELECT * FROM trades`;
            const allTrades = allTradesResult as DatabaseTrade[];
            const successfulTrades = allTrades.filter((trade: DatabaseTrade) => trade.success);
            const failedTrades = allTrades.filter((trade: DatabaseTrade) => !trade.success);

            tradingStats = {
                totalTrades: allTrades.length,
                successfulTrades: successfulTrades.length,
                failedTrades: failedTrades.length,
                totalVolume: allTrades.reduce((sum: number, trade: DatabaseTrade) => sum + trade.usd_amount, 0),
                totalProfit: 0, // Would need profit calculation logic
                winRate: allTrades.length > 0 ? (successfulTrades.length / allTrades.length) * 100 : 0
            };

        } catch (dbError) {
            console.log('Database connection failed, falling back to demo data:', dbError);
            // Fallback to demo data if database is not available
            recentTrades = [
                {
                    id: 'demo_1',
                    timestamp: Date.now() - 300000,
                    type: 'buy',
                    amount: 0.5,
                    price: 0.00015,
                    profit: 0,
                    status: 'completed'
                },
                {
                    id: 'demo_2',
                    timestamp: Date.now() - 180000,
                    type: 'sell',
                    amount: 0.3,
                    price: 0.00018,
                    profit: 0.015,
                    status: 'completed'
                }
            ];

            tradingStats = {
                totalTrades: 47,
                successfulTrades: 42,
                failedTrades: 5,
                totalVolume: 12.5,
                totalProfit: 0.85,
                winRate: 89.4
            };
        } return NextResponse.json({
            success: true,
            data: {
                recentTrades,
                stats: tradingStats,
                timestamp: Date.now(),
                source: recentTrades.length > 0 && recentTrades[0].id.startsWith('trade_') ? 'live' : 'demo'
            }
        });

    } catch (error) {
        console.error('Trading API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch trading data',
            timestamp: Date.now()
        }, { status: 500 });
    }
}
