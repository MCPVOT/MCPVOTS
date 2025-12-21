import { randomBytes } from 'crypto';

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

type NonceStore = Map<string, number>;

type GlobalWithNonceStore = typeof globalThis & {
    __farcasterNonceStore?: NonceStore;
};

const globalTarget = globalThis as GlobalWithNonceStore;

const store: NonceStore = globalTarget.__farcasterNonceStore ?? new Map();

if (!globalTarget.__farcasterNonceStore) {
    globalTarget.__farcasterNonceStore = store;
}

function pruneExpiredNonces() {
    const now = Date.now();
    for (const [nonce, expiresAt] of store.entries()) {
        if (expiresAt <= now) {
            store.delete(nonce);
        }
    }
}

export function issueNonce(): string {
    pruneExpiredNonces();
    const nonce = randomBytes(16).toString('hex');
    store.set(nonce, Date.now() + FIVE_MINUTES_IN_MS);
    return nonce;
}

export function consumeNonce(nonce: string): boolean {
    pruneExpiredNonces();
    const expiresAt = store.get(nonce);
    if (!expiresAt) {
        return false;
    }

    store.delete(nonce);
    return expiresAt > Date.now();
}
