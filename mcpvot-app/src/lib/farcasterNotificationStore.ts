import fs from 'fs/promises';
import path from 'path';

export interface NotificationToken {
    token: string;
    url: string;
    client?: string;
    lastUpdated: string;
}

export type NotificationStore = Record<string, NotificationToken[]>;

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'farcaster-notifications.json');

async function ensureDataDir() {
    await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readStore(): Promise<NotificationStore> {
    try {
        const data = await fs.readFile(STORE_PATH, 'utf-8');
        return JSON.parse(data) as NotificationStore;
    } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}

async function writeStore(store: NotificationStore) {
    await ensureDataDir();
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

export async function upsertNotificationToken(
    fid: number,
    details: { token: string; url: string; client?: string }
) {
    const store = await readStore();
    const key = String(fid);
    const tokens = store[key] ?? [];
    const existingIndex = tokens.findIndex((entry) => entry.token === details.token);
    const record: NotificationToken = {
        token: details.token,
        url: details.url,
        client: details.client,
        lastUpdated: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
        tokens[existingIndex] = record;
    } else {
        tokens.push(record);
    }

    store[key] = tokens;
    await writeStore(store);
}

export async function removeNotificationTokens(fid: number) {
    const store = await readStore();
    const key = String(fid);
    if (store[key]) {
        delete store[key];
        await writeStore(store);
    }
}

export async function getNotificationTokens(fid: number) {
    const store = await readStore();
    return store[String(fid)] ?? [];
}
