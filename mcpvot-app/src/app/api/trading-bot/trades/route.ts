
import { NextResponse } from 'next/server';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export async function GET() {
  try {
    const db = await open({
      filename: 'C:/PumpFun_Ecosystem/ECOSYSTEM_UNIFIED/VOT_Trading_Bot/trades.db',
      driver: sqlite3.Database
    });

    const trades = await db.all('SELECT * FROM trades ORDER BY timestamp DESC LIMIT 100');
    await db.close();

    return NextResponse.json(trades);
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}
