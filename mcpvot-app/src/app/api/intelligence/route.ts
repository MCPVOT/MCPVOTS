import { NextResponse } from 'next/server';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

interface TradingStats {
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
    totalVolume: number;
    totalGasCost: number;
    totalPnL: number;
    successRate: number;
}

interface BurnStats {
    totalBurned: number;
    burnCount: number;
    lastBurnAmount: number;
    lastBurnTime: string;
}

interface LatestTrade {
    type: string;
    timestamp: string;
    maxxAmount: number;
    ethAmount: number;
    price: number;
    gasUsed: number;
}

export async function GET() {
    try {
        // Fetch trading stats from VOT Trading Bot database
        const tradingData = await fetchTradingStats();

        // Fetch burn stats from NFT database
        const burnData = await fetchBurnStats();

        // Fetch latest trades
        const latestTrades = await fetchLatestTrades();

        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                trading: tradingData,
                burns: burnData,
                latestTrades: latestTrades,
                ecosystem: {
                    totalValue: calculateTotalValue(tradingData, burnData),
                    activeStreams: ['TRADING', 'BURNS', 'ANALYTICS', 'LIQUIDITY'],
                    status: 'LIVE'
                }
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Intelligence API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch intelligence data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

async function fetchTradingStats(): Promise<TradingStats> {
    try {
        const db = await open({
            filename: 'C:/PumpFun_Ecosystem/ECOSYSTEM_UNIFIED/VOT_Trading_Bot/trades.db',
            driver: sqlite3.Database
        });

        // Check if table and columns exist first
        const tableInfo = await db.all(`PRAGMA table_info(trades)`);
        const hasType = tableInfo.some((col: { name: string }) => col.name === 'type');
        const hasUsdAmount = tableInfo.some((col: { name: string }) => col.name === 'usd_amount');
        const hasGasCostUsd = tableInfo.some((col: { name: string }) => col.name === 'gas_cost_usd');

        const stats = await db.get<{
            total: number;
            successful: number;
            totalBuyVolume: number;
            totalSellVolume: number;
            totalGas: number;
            totalPnL: number;
        }>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
        ${hasType ? `SUM(CASE WHEN type = 'BUY' THEN usd_amount ELSE 0 END)` : '0'} as totalBuyVolume,
        ${hasType ? `SUM(CASE WHEN type = 'SELL' THEN token_amount ELSE 0 END)` : '0'} as totalSellVolume,
        ${hasGasCostUsd ? `SUM(COALESCE(gas_cost_usd, 0))` : '0'} as totalGas,
        ${hasUsdAmount ? `SUM(COALESCE(usd_amount, 0))` : '0'} as totalPnL
      FROM trades
    `);

        await db.close();

        const total = stats?.total || 0;
        const successful = stats?.successful || 0;

        return {
            totalTrades: total,
            successfulTrades: successful,
            failedTrades: total - successful,
            totalVolume: (stats?.totalBuyVolume || 0) + (stats?.totalSellVolume || 0),
            totalGasCost: stats?.totalGas || 0,
            totalPnL: stats?.totalPnL || 0,
            successRate: total > 0 ? (successful / total) * 100 : 0
        };
    } catch (error) {
        console.error('Trading stats error:', error);
        return {
            totalTrades: 0,
            successfulTrades: 0,
            failedTrades: 0,
            totalVolume: 0,
            totalGasCost: 0,
            totalPnL: 0,
            successRate: 0
        };
    }
}

async function fetchBurnStats(): Promise<BurnStats> {
    try {
        const dataDir = path.join(process.cwd(), 'data');
        const dbPath = path.join(dataDir, 'mcpvot_nfts.db');

        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        const totals = await db.get<{
            totalBurned: number;
            burnCount: number;
        }>(`
      SELECT
        COALESCE(SUM(CAST(amount AS REAL)), 0) AS totalBurned,
        COUNT(1) AS burnCount
      FROM burn_history
    `);

        const lastBurn = await db.get<{
            amount: string;
            burned_at: string;
        }>(`
      SELECT amount, burned_at
      FROM burn_history
      ORDER BY burned_at DESC
      LIMIT 1
    `);

        await db.close();

        return {
            totalBurned: totals?.totalBurned || 0,
            burnCount: totals?.burnCount || 0,
            lastBurnAmount: lastBurn ? Number(lastBurn.amount) : 0,
            lastBurnTime: lastBurn?.burned_at || new Date().toISOString()
        };
    } catch (error) {
        console.error('Burn stats error:', error);
        return {
            totalBurned: 0,
            burnCount: 0,
            lastBurnAmount: 0,
            lastBurnTime: new Date().toISOString()
        };
    }
}

async function fetchLatestTrades(): Promise<LatestTrade[]> {
    try {
        const db = await open({
            filename: 'C:/PumpFun_Ecosystem/ECOSYSTEM_UNIFIED/VOT_Trading_Bot/trades.db',
            driver: sqlite3.Database
        });

        // Check if table and columns exist first
        const tableInfo = await db.all(`PRAGMA table_info(trades)`);
        const hasType = tableInfo.some((col: { name: string }) => col.name === 'type');
        const hasPriceUsd = tableInfo.some((col: { name: string }) => col.name === 'price_usd');
        const hasGasCostUsd = tableInfo.some((col: { name: string }) => col.name === 'gas_cost_usd');

        if (!hasType) {
            await db.close();
            return [];
        }

        const trades = await db.all<Array<{
            type: string;
            timestamp: string;
            token_amount: number;
            usd_amount: number;
            price_usd?: number;
            gas_cost_usd?: number;
        }>>(`
      SELECT
        type,
        timestamp,
        token_amount,
        usd_amount
        ${hasPriceUsd ? ', price_usd' : ''}
        ${hasGasCostUsd ? ', gas_cost_usd' : ''}
      FROM trades
      WHERE success = 1
      ORDER BY timestamp DESC
      LIMIT 5
    `);

        await db.close();

        return trades.map(t => ({
            type: t.type,
            timestamp: t.timestamp,
            maxxAmount: t.token_amount || 0,
            ethAmount: t.usd_amount || 0,
            price: t.price_usd || 0,
            gasUsed: t.gas_cost_usd || 0
        }));
    } catch (error) {
        console.error('Latest trades error:', error);
        return [];
    }
}

function calculateTotalValue(trading: TradingStats, burns: BurnStats): number {
    // Total ecosystem value = trading volume + burned tokens value
    return trading.totalVolume + burns.totalBurned;
}
