import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import postgres from 'postgres';

const LOCK_KEY = 'x402_executor_secure';
const LOCK_TIMEOUT_MS = Number(process.env.EXECUTOR_LOCK_TIMEOUT_MS ?? 60 * 1000); // default 60 seconds
const LOCK_SECRET = process.env.LOCK_SECRET || crypto.randomBytes(32).toString('hex');

// Enhanced security context
interface LockContext {
  holder: string;
  pid: number;
  timestamp: number;
  signature: string;
  requestId: string;
}

function getTmpDir() {
  return process.env.X402_LOCK_DIR || process.env.TMPDIR || process.env.TEMP || process.env.TMP || '/tmp';
}

const LOCK_FILE_PATH = path.join(getTmpDir(), 'x402-secure', 'executor.lock.secure');
const useDb = !!process.env.POSTGRES_URL || !!process.env.VERCEL_POSTGRES_REST_URL || !!process.env.VERCEL_POSTGRES_URL;

const sql = useDb && process.env.POSTGRES_URL ? postgres(process.env.POSTGRES_URL, {
  ssl: 'require'
}) : null;

// Generate secure signature for lock holder
function generateLockSignature(context: Omit<LockContext, 'signature'>): string {
  const data = `${context.holder}:${context.pid}:${context.timestamp}:${context.requestId}:${LOCK_SECRET}`;
  return crypto.createHmac('sha256', LOCK_SECRET).update(data).digest('hex');
}

// Validate lock signature
function validateLockSignature(context: LockContext): boolean {
  const expectedSignature = generateLockSignature(context);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(context.signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

async function ensureDb() {
  if (!useDb || !sql) return;
  await sql`CREATE TABLE IF NOT EXISTS executor_lock_secure (
    lock_key TEXT PRIMARY KEY,
    holder TEXT NOT NULL,
    pid INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    signature TEXT NOT NULL,
    request_id TEXT NOT NULL,
    locked_at TIMESTAMPTZ DEFAULT now()
  );`;
}

async function getDbLockRow() {
  const res = await sql`SELECT holder, pid, timestamp, signature, request_id FROM executor_lock_secure WHERE lock_key = ${LOCK_KEY} LIMIT 1;`;
  return res[0] ?? null;
}

async function deleteDbLock() {
  await sql`DELETE FROM executor_lock_secure WHERE lock_key = ${LOCK_KEY};`;
}

function isTimestampStale(lockedAt?: Date | string | null): boolean {
  if (!lockedAt) return false;
  const ts = lockedAt instanceof Date ? lockedAt.getTime() : new Date(lockedAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts > LOCK_TIMEOUT_MS;
}

// Enhanced cleanup with signature validation
async function cleanupFileLockIfStale(): Promise<void> {
  try {
    const stats = await fs.stat(LOCK_FILE_PATH);
    // Validate signature if present in file and delete if invalid
    try {
      const content = await fs.readFile(LOCK_FILE_PATH, 'utf8');
      const ctx = JSON.parse(content) as LockContext;
      if (!validateLockSignature(ctx)) {
        await fs.unlink(LOCK_FILE_PATH).catch(() => { });
        return;
      }
    } catch {
      // ignore JSON parse errors or missing fields
    }

    if (Date.now() - stats.mtimeMs > LOCK_TIMEOUT_MS) {
      await fs.unlink(LOCK_FILE_PATH).catch(() => { });
    }
  } catch {
    // no-op
  }
}

export async function acquireSecureExecutorLock(
  holder = 'executorWorker',
  requestId = crypto.randomBytes(16).toString('hex')
): Promise<boolean> {
  const pid = process.pid;
  const timestamp = Date.now();
  const signature = generateLockSignature({ holder, pid, timestamp, requestId });
  
  const context: LockContext = { holder, pid, timestamp, signature, requestId };
  
  // Try database locking
  if (useDb && sql) {
    await ensureDb();
    try {
      await sql`INSERT INTO executor_lock_secure (
        lock_key, holder, pid, timestamp, signature, request_id
      ) VALUES (
        ${LOCK_KEY}, ${holder}, ${pid}, to_timestamp(${timestamp} / 1000.0), ${signature}, ${requestId}
      );`;
      return true;
    } catch {
      const row = await getDbLockRow();
      if (row) {
        // Reconstruct LockContext from DB row and validate signature
        const dbContext: LockContext = {
          holder: row.holder,
          pid: Number(row.pid),
          timestamp: row.timestamp instanceof Date ? row.timestamp.getTime() : new Date(row.timestamp).getTime(),
          signature: row.signature,
          requestId: row.request_id
        };

        const sigValid = validateLockSignature(dbContext);
        if (!sigValid || isTimestampStale(row.timestamp)) {
          await deleteDbLock();
          try {
            await sql`INSERT INTO executor_lock_secure (
              lock_key, holder, pid, timestamp, signature, request_id
            ) VALUES (
              ${LOCK_KEY}, ${holder}, ${pid}, to_timestamp(${timestamp} / 1000.0), ${signature}, ${requestId}
            );`;
            return true;
          } catch {
            return false;
          }
        }
      }
      return false;
    }
  }
  
  // Fallback to file locking with enhanced security
  try {
    await fs.mkdir(path.dirname(LOCK_FILE_PATH), { recursive: true });
    
    // Create secure lock file with signature
    const fh = await fs.open(LOCK_FILE_PATH, 'wx');
    await fh.writeFile(JSON.stringify(context));
    await fh.close();
    
    return true;
  } catch {
    await cleanupFileLockIfStale();
    
    try {
      const fh = await fs.open(LOCK_FILE_PATH, 'wx');
      await fh.writeFile(JSON.stringify(context));
      await fh.close();
      return true;
    } catch {
      return false;
    }
  }
}

export async function releaseSecureExecutorLock(): Promise<void> {
  // Try database first
  if (useDb && sql) {
    await ensureDb();
    await deleteDbLock();
    return;
  }
  
  // Fallback to file
  try {
    await fs.unlink(LOCK_FILE_PATH).catch(() => { });
  } catch { }
}

export async function isSecureExecutorLocked(): Promise<boolean> {
  // Try database first
  if (useDb && sql) {
    await ensureDb();
    const row = await getDbLockRow();
    if (row && isTimestampStale(row.timestamp)) {
      await deleteDbLock();
      return false;
    }
    return !!row;
  }
  
  // Fallback to file
  try {
    await cleanupFileLockIfStale();
    await fs.access(LOCK_FILE_PATH);
    return true;
  } catch {
    return false;
  }
}

// Health check for lock system
export async function getLockSystemHealth(): Promise<{
  database: boolean;
  file: boolean;
  active: boolean;
}> {
  const health = {
    database: false,
    file: false,
    active: false
  };
  
  if (useDb && sql) {
    try {
      await sql`SELECT 1`;
      health.database = true;
    } catch {
      health.database = false;
    }
  }
  
  try {
    await fs.access(LOCK_FILE_PATH);
    health.file = true;
  } catch {
    health.file = false;
  }
  
  health.active = await isSecureExecutorLocked();
  
  return health;
}

const defaultExports = {
  acquireSecureExecutorLock,
  releaseSecureExecutorLock,
  isSecureExecutorLocked,
  getLockSystemHealth
};
export default defaultExports;