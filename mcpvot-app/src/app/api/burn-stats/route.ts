import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

interface BurnStatsRow {
    totalBurned: number | null;
    burnCount: number | null;
}

interface BurnHistoryRow {
    amount: string;
    transaction_hash: string;
    burned_at: string;
}

export async function GET() {
    try {
        const db = await openDatabase();

        const totals = await db.get<BurnStatsRow>(
            `SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) AS totalBurned, COUNT(1) AS burnCount FROM burn_history`
        );

        const lastBurn = await db.get<BurnHistoryRow>(
            `SELECT amount, transaction_hash, burned_at FROM burn_history ORDER BY burned_at DESC LIMIT 1`
        );

        await db.close();

        return NextResponse.json({
            success: true,
            data: {
                totalBurned: totals?.totalBurned ? Number(totals.totalBurned) : 0,
                burnCount: totals?.burnCount ? Number(totals.burnCount) : 0,
                lastBurn: lastBurn
                    ? {
                        amount: Number(lastBurn.amount),
                        transactionHash: lastBurn.transaction_hash,
                        burnedAt: lastBurn.burned_at
                    }
                    : null
            }
        });
    } catch (error) {
        console.error('Failed to load burn stats:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

async function openDatabase() {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });

    const dbPath = path.join(dataDir, 'mcpvot_nfts.db');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS burn_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount TEXT NOT NULL,
            transaction_hash TEXT,
            burned_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
}
