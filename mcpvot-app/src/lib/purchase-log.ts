import fs from 'fs/promises';
import path from 'path';
import postgres from 'postgres';

type PurchaseLogEntry = {
    id: string;
    timestamp: string;
    payer: string;
    usdAmount: number;
    usdcAtomicAmount: string;
    status: 'queued' | 'processed' | 'failed';
    memo: string;
    paymentHash?: string | undefined;
};

const useDb = !!process.env.POSTGRES_URL || !!process.env.VERCEL_POSTGRES_REST_URL || !!process.env.VERCEL_POSTGRES_URL;
const sql = useDb && process.env.POSTGRES_URL ? postgres(process.env.POSTGRES_URL, {
    ssl: 'require'
}) : null;

const runtimeIsReadOnly = Boolean(process.env.VERCEL);
const defaultPurchaseLogPath = path.join(process.cwd(), 'x402-secure', 'vot_purchase_log.ndjson');
const tmpPurchaseLogPath = path.join(process.env.TMPDIR || '/tmp', 'vot_purchase_log.ndjson');
const PURCHASE_LOG_PATH = process.env.PURCHASE_LOG_PATH
    || (runtimeIsReadOnly && !useDb ? tmpPurchaseLogPath : defaultPurchaseLogPath);

async function ensureDb() {
    if (!useDb || !sql) return;
    // Try to create table if not exists
    await sql`CREATE TABLE IF NOT EXISTS purchase_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    payer TEXT,
    usd_amount NUMERIC,
    usdc_atomic_amount TEXT,
    status TEXT,
    memo TEXT,
    payment_hash TEXT
  );`;
}

export async function appendPurchaseLog(entry: PurchaseLogEntry) {
    if (useDb && sql) {
        await ensureDb();
        try {
            await sql`INSERT INTO purchase_logs (id, timestamp, payer, usd_amount, usdc_atomic_amount, status, memo, payment_hash) VALUES (${entry.id}, ${entry.timestamp}, ${entry.payer}, ${entry.usdAmount}, ${entry.usdcAtomicAmount}, ${entry.status}, ${entry.memo}, ${entry.paymentHash});`;
            return;
        } catch (err) {
            // If duplicate key, ignore
            console.warn('[PurchaseLog] DB append failed, falling back to FS:', err);
        }
    }

    // Fallback to local FS (dev)
    await fs.mkdir(path.dirname(PURCHASE_LOG_PATH), { recursive: true });
    await fs.appendFile(PURCHASE_LOG_PATH, JSON.stringify(entry) + '\n');
}

export async function readAllLogEntries(): Promise<PurchaseLogEntry[]> {
    if (useDb) {
        await ensureDb();
        const res = await sql`SELECT * FROM purchase_logs ORDER BY timestamp DESC;`;
        return (res.rows || []).map((row: Record<string, unknown>) => ({
            id: row.id,
            timestamp: row.timestamp.toISOString(),
            payer: row.payer,
            usdAmount: Number(row.usd_amount),
            usdcAtomicAmount: row.usdc_atomic_amount,
            status: row.status,
            memo: row.memo,
            paymentHash: row.payment_hash
        }));
    }

    try {
        const content = await fs.readFile(PURCHASE_LOG_PATH, 'utf-8').catch(() => '');
        if (!content) return [];
        const lines = content.split('\n').filter(Boolean);
        const parsed = lines.map((line) => JSON.parse(line));
        return parsed;
    } catch (err) {
        console.warn('[PurchaseLog] readAllLogEntries failed:', err);
        return [];
    }
}

export async function updatePurchaseLogStatus(id: string, status: PurchaseLogEntry['status'], memo?: string) {
    if (useDb) {
        await ensureDb();
        await sql`UPDATE purchase_logs SET status = ${status}, memo = COALESCE(${memo}, memo) WHERE id = ${id};`;
        return;
    }

    try {
        const content = await fs.readFile(PURCHASE_LOG_PATH, 'utf-8').catch(() => '');
        if (!content) return;
        const lines = content.split('\n').filter(Boolean);
        const parsed = lines.map((line) => JSON.parse(line));
        const updated = parsed.map((entry) => entry.id === id ? { ...entry, status, memo: memo ?? entry.memo } : entry);
        await fs.writeFile(PURCHASE_LOG_PATH, updated.map((e) => JSON.stringify(e)).join('\n') + '\n');
    } catch (err) {
        console.warn('[PurchaseLog] updatePurchaseLogStatus failed:', err);
    }
}

export async function writeAllLogEntries(entries: PurchaseLogEntry[]) {
    if (useDb) {
        await ensureDb();
        // Replace existing rows in a simple way: upsert each
        for (const e of entries) {
            await sql`INSERT INTO purchase_logs (id, timestamp, payer, usd_amount, usdc_atomic_amount, status, memo, payment_hash) VALUES (${e.id}, ${e.timestamp}, ${e.payer}, ${e.usdAmount}, ${e.usdcAtomicAmount}, ${e.status}, ${e.memo}, ${e.paymentHash}) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, memo = EXCLUDED.memo;`;
        }
        return;
    }

    await fs.mkdir(path.dirname(PURCHASE_LOG_PATH), { recursive: true });
    const content = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
    await fs.writeFile(PURCHASE_LOG_PATH, content);
}

export { PurchaseLogEntry };

