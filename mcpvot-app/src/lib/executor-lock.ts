import fs from 'fs/promises';
import path from 'path';
import postgres from 'postgres';

const LOCK_KEY = 'x402_executor';
const LOCK_TIMEOUT_MS = Number(process.env.EXECUTOR_LOCK_TIMEOUT_MS ?? 60 * 1000); // default 60 seconds

function getTmpDir() {
    // Avoid importing Node's `os` at module top-level to prevent build-time/runtime issues
    // in environments that may not provide Node builtins during certain steps.
    return process.env.X402_LOCK_DIR || process.env.TMPDIR || process.env.TEMP || process.env.TMP || '/tmp';
}

const LOCK_FILE_PATH = path.join(getTmpDir(), 'x402-secure', 'executor.lock');
const useDb = !!process.env.POSTGRES_URL || !!process.env.VERCEL_POSTGRES_REST_URL || !!process.env.VERCEL_POSTGRES_URL;
const sql = useDb && process.env.POSTGRES_URL ? postgres(process.env.POSTGRES_URL, {
    ssl: 'require'
}) : null;

async function ensureDb() {
    if (!useDb || !sql) return;
    await sql`CREATE TABLE IF NOT EXISTS executor_lock (lock_key TEXT PRIMARY KEY, locked_at TIMESTAMPTZ, holder TEXT);`;
}

async function getDbLockRow() {
    const res = await sql`SELECT locked_at, holder FROM executor_lock WHERE lock_key = ${LOCK_KEY} LIMIT 1;`;
    return res[0] ?? null;
}

async function deleteDbLock() {
    await sql`DELETE FROM executor_lock WHERE lock_key = ${LOCK_KEY};`;
}

function isTimestampStale(lockedAt?: Date | string | null): boolean {
    if (!lockedAt) return false;
    const ts = lockedAt instanceof Date ? lockedAt.getTime() : new Date(lockedAt).getTime();
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts > LOCK_TIMEOUT_MS;
}

async function cleanupFileLockIfStale(): Promise<void> {
    try {
        const stats = await fs.stat(LOCK_FILE_PATH);
        if (Date.now() - stats.mtimeMs > LOCK_TIMEOUT_MS) {
            await fs.unlink(LOCK_FILE_PATH).catch(() => { });
        }
    } catch {
        // no-op
    }
}

export async function acquireExecutorLock(holder = 'executorWorker'): Promise<boolean> {
    if (useDb && sql) {
        await ensureDb();
        try {
            await sql`INSERT INTO executor_lock (lock_key, locked_at, holder) VALUES (${LOCK_KEY}, now(), ${holder});`;
            return true;
        } catch {
            const row = await getDbLockRow();
            if (row && isTimestampStale(row.locked_at)) {
                await deleteDbLock();
                try {
                    await sql`INSERT INTO executor_lock (lock_key, locked_at, holder) VALUES (${LOCK_KEY}, now(), ${holder});`;
                    return true;
                } catch {
                    return false;
                }
            }
            return false;
        }
    }

    try {
        await fs.mkdir(path.dirname(LOCK_FILE_PATH), { recursive: true });
        const fh = await fs.open(LOCK_FILE_PATH, 'wx');
        await fh.writeFile(JSON.stringify({ holder, startedAt: new Date().toISOString() }));
        await fh.close();
        return true;
    } catch {
        await cleanupFileLockIfStale();
        try {
            const fh = await fs.open(LOCK_FILE_PATH, 'wx');
            await fh.writeFile(JSON.stringify({ holder, startedAt: new Date().toISOString() }));
            await fh.close();
            return true;
        } catch {
            return false;
        }
    }
}

export async function releaseExecutorLock(): Promise<void> {
    if (useDb && sql) {
        await ensureDb();
        await deleteDbLock();
        return;
    }

    try {
        await fs.unlink(LOCK_FILE_PATH).catch(() => { });
    } catch { }
}

export async function isExecutorLocked(): Promise<boolean> {
    if (useDb && sql) {
        await ensureDb();
        const row = await getDbLockRow();
        if (row && isTimestampStale(row.locked_at)) {
            await deleteDbLock();
            return false;
        }
        return !!row;
    }
    try {
        await cleanupFileLockIfStale();
        await fs.access(LOCK_FILE_PATH);
        return true;
    } catch {
        return false;
    }
}

const defaultExports = { acquireExecutorLock, releaseExecutorLock, isExecutorLocked };
export default defaultExports;
