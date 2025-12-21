import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';
import postgres from 'postgres';

type LLMSummaryRecord = {
    entryId: string;
    model: string;
    summary: string; // JSON string of model output
    createdAt: string;
};

const useDb = !!process.env.POSTGRES_URL;
const sql = useDb && process.env.POSTGRES_URL ? postgres(process.env.POSTGRES_URL, {
    ssl: 'require'
}) : null;
const upstashRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = !!upstashRestUrl && !!upstashRestToken;
const FALLBACK_PATH = path.join(process.cwd(), 'x402-secure', 'llm_summaries.ndjson');

async function ensureDb() {
    if (!useDb || !sql) return;
    await sql`CREATE TABLE IF NOT EXISTS llm_summaries (entry_id TEXT PRIMARY KEY, model TEXT, summary JSONB, created_at TIMESTAMPTZ);`;
}

export async function getLLMSummary(entryId: string, ttlHours = 24): Promise<LLMSummaryRecord | null> {
    if (useDb && sql) {
        await ensureDb();
        const res = await sql`SELECT entry_id, model, summary, created_at FROM llm_summaries WHERE entry_id = ${entryId} LIMIT 1;`;
        const row = res[0];
        if (!row) return null;
        const created = new Date(String(row.created_at));
        const ageHours = (Date.now() - created.getTime()) / (1000 * 60 * 60);
        if (ageHours > ttlHours) return null;
        return { entryId: row.entry_id, model: row.model, summary: JSON.stringify(row.summary), createdAt: created.toISOString() };
    }

    // Prefer upstash if configured for fast key-value cache
    if (useUpstash) {
        try {
            const k = `llm_summary:${entryId}`;
            const val = await upstashGet(k);
            if (!val) return null;
            const rec = JSON.parse(val) as LLMSummaryRecord;
            const ageHours = (Date.now() - new Date(rec.createdAt).getTime()) / (1000 * 60 * 60);
            if (ageHours > ttlHours) return null;
            return rec;
        } catch (err) {
            console.warn('[LLMCache] upstash get failed:', err);
        }
    }

    try {
        await fs.mkdir(path.dirname(FALLBACK_PATH), { recursive: true });
        const raw = await fs.readFile(FALLBACK_PATH, 'utf-8').catch(() => '');
        if (!raw) return null;
        const lines = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l) as LLMSummaryRecord);
        const rec = lines.find((r) => r.entryId === entryId);
        if (!rec) return null;
        const ageHours = (Date.now() - new Date(rec.createdAt).getTime()) / (1000 * 60 * 60);
        if (ageHours > ttlHours) return null;
        return rec as LLMSummaryRecord;
    } catch (err) {
        console.warn('[LLMCache] read fallback failed:', err);
        return null;
    }
}

export async function setLLMSummary(entryId: string, model: string, summaryObj: Record<string, unknown>): Promise<void> {
    const now = new Date().toISOString();
    if (useDb && sql) {
        await ensureDb();
        await sql`INSERT INTO llm_summaries (entry_id, model, summary, created_at) VALUES (${entryId}, ${model}, ${JSON.stringify(summaryObj)}::jsonb, ${now}) ON CONFLICT (entry_id) DO UPDATE SET summary = EXCLUDED.summary, model = EXCLUDED.model, created_at = EXCLUDED.created_at;`;
        return;
    }

    // If upstash configured, set there with TTL for fast ephemeral retrieval
    if (useUpstash) {
        try {
            const k = `llm_summary:${entryId}`;
            const ttlSeconds = 60 * 60 * 24; // 24h default TTL
            const payload = { entryId, model, summary: summaryObj, createdAt: now };
            await upstashSet(k, JSON.stringify(payload), ttlSeconds);
            return;
        } catch (err) {
            console.warn('[LLMCache] upstash set failed:', err);
        }
    }

    try {
        await fs.mkdir(path.dirname(FALLBACK_PATH), { recursive: true });
        const s = { entryId, model, summary: summaryObj, createdAt: now };
        await fs.appendFile(FALLBACK_PATH, JSON.stringify(s) + '\n');
    } catch (err) {
        console.warn('[LLMCache] set fallback failed:', err);
    }
}

// If Upstash is configured, provide a minimal REST client to avoid demanding dependencies.
async function upstashGet(key: string): Promise<string | null> {
    if (!useUpstash) return null;
    try {
        const r = await fetch(`${upstashRestUrl}/get`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${upstashRestToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
        });
        const json = await r.json().catch(() => null);
        return json?.result ?? null;
    } catch (err) {
        console.warn('[LLMCache] upstash get error:', err);
        return null;
    }
}

async function upstashSet(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!useUpstash) return;
    try {
        await fetch(`${upstashRestUrl}/set`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${upstashRestToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value, ex: ttlSeconds })
        });
    } catch (err) {
        console.warn('[LLMCache] upstash set error:', err);
    }
}

const exported = { getLLMSummary, setLLMSummary } as const;
export default exported;
