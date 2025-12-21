// Shared utilities for Base name resolution
import { getName } from '@coinbase/onchainkit/identity';
import { Agent as UndiciAgent } from 'undici';
import { base } from 'viem/chains';

const parseDuration = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Shared cache for Base names across the app
const nameCache = new Map<string, string | null>();
const cacheExpiry = new Map<string, number>();
const POSITIVE_CACHE_DURATION = parseDuration(process.env.BASENAME_CACHE_DURATION_MS, 5 * 60 * 1000);
const NEGATIVE_CACHE_DURATION = parseDuration(process.env.BASENAME_NEGATIVE_CACHE_DURATION_MS, 60 * 1000);
const ONCHAINKIT_TIMEOUT_MS = parseDuration(process.env.BASENAME_ONCHAINKIT_TIMEOUT_MS, 5000);  // Reduced for Vercel cold starts

const BASENAME_API_TEMPLATES = (
    [
        process.env.BASENAME_API_TEMPLATE,
        process.env.NEXT_PUBLIC_BASENAME_API_TEMPLATE,
        process.env.NEXT_PUBLIC_BASENAME_API,
        'https://api.basenames.com/v1/reverse/{address}',
        'https://names.base.org/v1/reverse/{address}',
        'https://api.web3.bio/ns/base/{address}',
        'https://resolver-api.basename.app/v1/address/{address}',
        'https://api.basenames.xyz/v1/address/{address}',
        'https://api.ensideas.com/ens/resolve/{address}',
        'https://base-mainnet.supranames.xyz/api/reverse/{address}'
    ].filter(Boolean) as string[]
);

const HOST_FAILURE_TTL_MS = parseDuration(process.env.BASENAME_HOST_FAILURE_TTL_MS, 5 * 60 * 1000);
const hostFailureMap = new Map<string, number>();
const dispatcherMap = new Map<string, UndiciAgent>();

const normalizeBaseName = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const lower = trimmed.toLowerCase();
    if (lower.endsWith('.base.eth')) {
        return trimmed;
    }

    if (lower.endsWith('.base')) {
        return `${trimmed}.eth`;
    }

    return null;
};

const buildBasenameApiUrls = () => {
    const builders = BASENAME_API_TEMPLATES.length > 0 ? BASENAME_API_TEMPLATES : ['https://names.base.org/api/v1/reverse?address={address}'];

    return builders.map((template) => {
        if (template.includes('{address}')) {
            return (address: string) => template.replace('{address}', address.toLowerCase());
        }

        const cleaned = template.endsWith('/') ? template.slice(0, -1) : template;
        return (address: string) => `${cleaned}/${address.toLowerCase()}`;
    });
};

const basenameApiRequestBuilders = buildBasenameApiUrls();

const shouldSkipHost = (host: string) => {
    const expiry = hostFailureMap.get(host);
    if (!expiry) {
        return false;
    }
    if (Date.now() > expiry) {
        hostFailureMap.delete(host);
        return false;
    }
    return true;
};

const markHostFailure = (host: string) => {
    hostFailureMap.set(host, Date.now() + HOST_FAILURE_TTL_MS);
};

const extractBaseNameFromPayload = (payload: unknown): string | null => {
    if (typeof payload === 'string') {
        return normalizeBaseName(payload);
    }

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const visited = new Set<unknown>();
    const queue: unknown[] = [payload];

    while (queue.length) {
        const current = queue.shift();
        if (!current || typeof current !== 'object') {
            continue;
        }
        if (visited.has(current)) {
            continue;
        }
        visited.add(current);

        if (Array.isArray(current)) {
            for (const entry of current) {
                if (typeof entry === 'string') {
                    const normalized = normalizeBaseName(entry);
                    if (normalized) {
                        return normalized;
                    }
                } else if (entry && typeof entry === 'object') {
                    queue.push(entry);
                }
            }
            continue;
        }

        const record = current as Record<string, unknown>;
        for (const value of Object.values(record)) {
            if (typeof value === 'string') {
                const normalized = normalizeBaseName(value);
                if (normalized) {
                    return normalized;
                }
            } else if (value && typeof value === 'object') {
                queue.push(value);
            }
        }
    }

    return null;
};

// Function to clear cache for a specific address
export const clearBaseNameCache = (address: `0x${string}`) => {
    nameCache.delete(address);
    cacheExpiry.delete(address);
    console.log('[BaseName] Cleared cache for', address.slice(0, 6) + '...');
};

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 4000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        let dispatcher: UndiciAgent | undefined;
        try {
            const { hostname } = new URL(url);
            if (hostname) {
                if (!dispatcherMap.has(hostname)) {
                    dispatcherMap.set(
                        hostname,
                        new UndiciAgent({
                            connect: { servername: hostname },
                            keepAliveTimeout: 1_000,
                            keepAliveMaxTimeout: 5_000
                        })
                    );
                }
                dispatcher = dispatcherMap.get(hostname);
            }
        } catch {
            dispatcher = undefined;
        }

        const res = await fetch(url, { ...(init ?? {}), signal: controller.signal, dispatcher });
        return res;
    } finally {
        clearTimeout(id);
    }
}

async function resolveBaseNameViaApi(address: `0x${string}`): Promise<string | null> {
    if (!basenameApiRequestBuilders.length) {
        return null;
    }

    for (const buildUrl of basenameApiRequestBuilders) {
        const targetUrl = buildUrl(address);
        let host: string | null = null;
        try {
            host = new URL(targetUrl).hostname;
        } catch {
            host = null;
        }

        if (host && shouldSkipHost(host)) {
            console.log('[BaseName] Skipping host due to prior network failure:', host);
            continue;
        }
        // Retry a few times on transient network errors
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                console.log('[BaseName] Attempting Base name API', targetUrl, 'for', address.slice(0, 6) + '...', `(attempt ${attempt + 1})`);
                const response = await fetchWithTimeout(targetUrl, {
                    headers: { accept: 'application/json' },
                    cache: 'no-store'
                }, 4000 * (attempt + 1));

                if (!response) {
                    throw new Error('No response (timeout or aborted)');
                }

                if (!response.ok) {
                    console.log('[BaseName] API', targetUrl, 'responded with', response.status);
                    // If 404, don't retry further on this URL
                    if (response.status === 404) break;
                    // Otherwise, try again after small backoff
                    await new Promise((r) => setTimeout(r, Math.min(500 * 2 ** attempt, 3000)));
                    continue;
                }

                const payload = await response.json();
                const extracted = extractBaseNameFromPayload(payload);
                if (extracted) {
                    console.log('[BaseName] API returned', extracted, 'for', address.slice(0, 6) + '...');
                    return extracted;
                }
                // If no name found, no point in retrying this endpoint
                break;
            } catch (error: unknown) {
                console.log('[BaseName] API fallback failed for', targetUrl, `attempt ${attempt + 1}:`, error);
                if (host && error && typeof error === 'object') {
                    const err = error as { code?: string; message?: string; cause?: unknown };
                    let code = err.code ?? '';
                    let message = err.message ?? '';
                    const cause = err.cause;
                    if (!code && cause && typeof cause === 'object') {
                        const causeObj = cause as { code?: string; message?: string };
                        if (causeObj.code) {
                            code = causeObj.code;
                        }
                        if (!message && causeObj.message) {
                            message = causeObj.message;
                        }
                    }
                    if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || code === 'ECONNREFUSED') {
                        console.log('[BaseName] Marking host temporarily unavailable due to DNS error:', host);
                        markHostFailure(host);
                        break;
                    }
                    if (message.includes('tlsv1 unrecognized name')) {
                        console.log('[BaseName] Marking host temporarily unavailable due to TLS SNI error:', host);
                        markHostFailure(host);
                        break;
                    }
                }
                // If abort or global network issues, continue to next attempt; otherwise continue
                // Small backoff before retrying
                await new Promise((r) => setTimeout(r, Math.min(500 * 2 ** attempt, 3000)));
            }
        }
    }

    console.log('[BaseName] All Base name API fallbacks exhausted for', address.slice(0, 6) + '...');
    return null;
}

// Fallback Base name resolution using direct contract call
async function resolveBaseNameFallback(address: `0x${string}`): Promise<string | null> {
    try {
        console.log('[BaseName] Using on-chain fallback resolution for', address.slice(0, 6) + '...');

        // Import ethers dynamically to avoid issues
        const { ethers } = await import('ethers');
        const { namehash } = await import('viem');

        // Try multiple RPC endpoints in order of preference
        // PRIORITY: Reliable public RPCs first (no auth, fast), then others
        const rpcUrls = [
            process.env.BASE_RPC_URL || 'https://base.llamarpc.com',     // PRIORITY 1: Reliable public
            'https://base-rpc.publicnode.com',                            // PRIORITY 2: PublicNode
            'https://rpc.ankr.com/base',                                  // PRIORITY 3: Ankr
            'https://mainnet.base.org',                                   // PRIORITY 4: Official (DNS issues)
            process.env.INFURA_BASE_ENDPOINT || 'https://base-mainnet.infura.io/v3/f26d1a89dbad433cb6753137b52331dc'
        ].filter(Boolean) as string[];

        let provider: ethers.JsonRpcProvider | null = null;
        let lastError: unknown = null;

        for (const rpcUrl of rpcUrls) {
            try {
                console.log('[BaseName] Trying RPC endpoint:', rpcUrl.replace(/\/v3\/[^/]+/, '/v3/***'));

                // Create provider with custom fetch options to avoid header issues
                provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
                    staticNetwork: true,
                    batchMaxCount: 1, // Disable batching to avoid issues
                    batchMaxDelay: 0
                });

                // Test the connection with a simple call
                await provider.getBlockNumber();
                console.log('[BaseName] RPC connection successful for', rpcUrl.replace(/\/v3\/[^/]+/, '/v3/***'));
                break;
            } catch (error) {
                console.log('[BaseName] RPC endpoint failed:', rpcUrl.replace(/\/v3\/[^/]+/, '/v3/***'), error);
                lastError = error;
                continue;
            }
        }

        if (!provider) {
            throw new Error(`All RPC endpoints failed. Last error: ${lastError}`);
        }

        // Contract addresses on Base Mainnet (from official basenames repo)
        const L2_RESOLVER_ADDRESS = process.env.BASE_L2_RESOLVER_ADDRESS || '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD';
        const REVERSE_REGISTRAR_ADDRESS = '0x79ea96012eea67a83431f1701b3dff7e37f9e282';

        // Method 1: Try ReverseRegistrar.node() to get the reverse node for this address
        // Then query the L2Resolver with that node
        try {
            console.log('[BaseName] Trying ReverseRegistrar.node() method...');
            
            const reverseRegistrarAbi = [{
                inputs: [{ name: 'addr', type: 'address' }],
                name: 'node',
                outputs: [{ name: '', type: 'bytes32' }],
                stateMutability: 'pure',
                type: 'function'
            }];
            
            const reverseRegistrar = new ethers.Contract(REVERSE_REGISTRAR_ADDRESS, reverseRegistrarAbi, provider);
            const nodeFromRegistrar = await reverseRegistrar.node(address);
            console.log('[BaseName] ReverseRegistrar node:', nodeFromRegistrar);
            
            // Now query L2Resolver with this node
            const resolverAbi = [{
                inputs: [{ name: 'node', type: 'bytes32' }],
                name: 'name',
                outputs: [{ name: '', type: 'string' }],
                stateMutability: 'view',
                type: 'function'
            }];
            
            const resolver = new ethers.Contract(L2_RESOLVER_ADDRESS, resolverAbi, provider);
            const nameFromRegistrar = await resolver.name(nodeFromRegistrar);
            
            if (nameFromRegistrar && nameFromRegistrar !== '') {
                const normalized = normalizeBaseName(nameFromRegistrar) ?? nameFromRegistrar;
                console.log('[BaseName] ReverseRegistrar method resolved:', normalized);
                return normalized;
            }
        } catch (reverseError) {
            console.log('[BaseName] ReverseRegistrar method failed:', reverseError);
        }

        // Method 2: Compute reverse node using standard ENS namehash
        // Format: <address-lowercase-without-0x>.addr.reverse
        const reverseName = `${address.toLowerCase().slice(2)}.addr.reverse`;
        const reverseNode = namehash(reverseName);
        console.log('[BaseName] Reverse name:', reverseName, '=> node:', reverseNode);

        // Create contract instance
        const resolverAbi = [{
            inputs: [{ name: 'node', type: 'bytes32' }],
            name: 'name',
            outputs: [{ name: '', type: 'string' }],
            stateMutability: 'view',
            type: 'function'
        }];

        const resolver = new ethers.Contract(L2_RESOLVER_ADDRESS, resolverAbi, provider);

        // Query the name with timeout and error handling
        try {
            const namePromise = resolver.name(reverseNode);
            const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 10000) // 10 second timeout
            );

            const name = await Promise.race([namePromise, timeoutPromise]);

            if (name && name !== '') {
                const normalized = normalizeBaseName(name) ?? name;
                console.log('[BaseName] Fallback resolved name:', normalized);
                return normalized;
            }

            console.log('[BaseName] Contract returned empty name');
            return null;
        } catch (contractError) {
            console.log('[BaseName] Contract call failed:', contractError);

            // If it's a rate limit error, try a different RPC endpoint
            if (contractError instanceof Error &&
                (contractError.message.includes('429') ||
                    contractError.message.includes('rate limit') ||
                    contractError.message.includes('too many requests'))) {

                console.log('[BaseName] Rate limited on current RPC, trying backup endpoints...');

                // Try backup endpoints
                const backupUrls = [
                    'https://base-mainnet.g.alchemy.com/v2/demo', // Public Alchemy endpoint
                    'https://base.blockpi.network/v1/rpc/public', // BlockPI public endpoint
                    'https://base-rpc.publicnode.com', // PublicNode
                    'https://rpc.ankr.com/base' // Ankr
                ];

                for (const backupUrl of backupUrls) {
                    try {
                        console.log('[BaseName] Trying backup RPC:', backupUrl.replace(/\/v2\/[^/]+/, '/v2/***'));

                        const backupProvider = new ethers.JsonRpcProvider(backupUrl, undefined, {
                            staticNetwork: true,
                            batchMaxCount: 1,
                            batchMaxDelay: 0
                        });

                        // Test connection
                        await backupProvider.getBlockNumber();

                        const backupResolver = new ethers.Contract(L2_RESOLVER_ADDRESS, resolverAbi, backupProvider);
                        const backupName = await backupResolver.name(reverseNode);

                        if (backupName && backupName !== '') {
                            const normalized = normalizeBaseName(backupName) ?? backupName;
                            console.log('[BaseName] Backup RPC resolved name:', normalized);
                            return normalized;
                        }
                    } catch (backupError) {
                        console.log('[BaseName] Backup RPC failed:', backupUrl.replace(/\/v2\/[^/]+/, '/v2/***'), backupError);
                        continue;
                    }
                }
            }

            throw contractError;
        }
    } catch (error) {
        console.log('[BaseName] Fallback resolution failed:', error);
        return null;
    }
}

export const resolveBaseName = async (address: `0x${string}`): Promise<string | null> => {
    if (!address) {
        console.log('[BaseName] No address provided');
        return null;
    }

    const cacheResult = (value: string | null, ttlOverride?: number) => {
        const ttl = ttlOverride ?? (value ? POSITIVE_CACHE_DURATION : NEGATIVE_CACHE_DURATION);
        nameCache.set(address, value);
        cacheExpiry.set(address, Date.now() + ttl);
    };

    // Check cache first
    const now = Date.now();
    const cachedExpiry = cacheExpiry.get(address);
    if (cachedExpiry && now < cachedExpiry) {
        const cached = nameCache.get(address);
        console.log('[BaseName] Cache hit for', address.slice(0, 6) + '...', ':', cached);
        return cached || null;
    }

    // Clear expired cache
    if (cachedExpiry && now >= cachedExpiry) {
        nameCache.delete(address);
        cacheExpiry.delete(address);
    }

    // Farcaster Mini App native fallback (PRIORITY before RPC)
    if (typeof window !== 'undefined') {
        // Check common Farcaster globals
        interface FarcasterUserContext {
          user?: {
            username?: string;
          };
        }

        // Replace the any-cast Farcaster block with typed version
        const farcasterCtx = (window as { farcasterContext?: FarcasterUserContext }).farcasterContext;
        if (farcasterCtx?.user?.username) {
            const farcasterName = normalizeBaseName(farcasterCtx.user.username);
            if (farcasterName) {
                console.log('[BaseName] ✅ Farcaster native:', farcasterName);
                cacheResult(farcasterName);
                return farcasterName;
            }
        }
    }

    // PRIORITY FIX: Try direct RPC resolution first (local infrastructure)
    console.log('[BaseName] Resolving name for', address.slice(0, 6) + '... (prioritizing local RPC)');

    const rpcResult = await resolveBaseNameFallback(address);
    if (rpcResult) {
        console.log('[BaseName] Direct RPC resolution succeeded:', rpcResult);
        cacheResult(rpcResult);
        return rpcResult;
    }

    // Fallback to OnchainKit (currently timing out)
    try {
        console.log('[BaseName] RPC failed, trying OnchainKit...');

        const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), ONCHAINKIT_TIMEOUT_MS)
        );

        const namePromise = getName({ address, chain: base });
        const resolvedName = await Promise.race([namePromise, timeoutPromise]);

        if (resolvedName === null) {
            console.log(
                `[BaseName] OnchainKit timed out after ${ONCHAINKIT_TIMEOUT_MS}ms for`,
                address.slice(0, 6) + '...'
            );
        } else if (resolvedName) {
            console.log('[BaseName] OnchainKit resolved name for', address.slice(0, 6) + '...', ':', resolvedName);

            // Only return Base names (ending with .base.eth)
            if (normalizeBaseName(resolvedName)) {
                const normalized = normalizeBaseName(resolvedName)!;
                console.log('[BaseName] Valid Base name found:', normalized);
                cacheResult(normalized);
                return normalized;
            }

            console.log('[BaseName] Name found but not a Base name:', resolvedName);
            cacheResult(null);
            return null;
        } else {
            console.log('[BaseName] OnchainKit returned empty response for', address.slice(0, 6) + '...');
        }
    } catch (error) {
        console.log('[BaseName] OnchainKit failed, trying API fallback for', address.slice(0, 6) + '...', ':', error);
    }

    // Last resort: Try external APIs (currently all failing)
    console.log('[BaseName] OnchainKit failed, trying external APIs as last resort...');
    const apiResult = await resolveBaseNameViaApi(address);
    cacheResult(apiResult);
    return apiResult;
};

// Debug wrapper - captures console output during resolution and returns a trace
export async function resolveBaseNameWithTrace(address: `0x${string}`): Promise<{ baseName: string | null; trace: Array<{ level: 'log' | 'warn' | 'error'; args: unknown[] }> }> {
    const trace: Array<{ level: 'log' | 'warn' | 'error'; args: unknown[] }> = [];

    const origConsoleLog = console.log;
    const origConsoleWarn = console.warn;
    const origConsoleError = console.error;

    console.log = (...args: unknown[]) => {
        trace.push({ level: 'log', args });
        (origConsoleLog as (...args: unknown[]) => void).apply(console, args);
    };
    console.warn = (...args: unknown[]) => {
        trace.push({ level: 'warn', args });
        (origConsoleWarn as (...args: unknown[]) => void).apply(console, args);
    };
    console.error = (...args: unknown[]) => {
        trace.push({ level: 'error', args });
        (origConsoleError as (...args: unknown[]) => void).apply(console, args);
    };

    try {
        const result = await resolveBaseName(address);
        return { baseName: result, trace };
    } catch (err) {
        trace.push({ level: 'error', args: [err] });
        return { baseName: null, trace };
    } finally {
        // Restore console
        console.log = origConsoleLog;
        console.warn = origConsoleWarn;
        console.error = origConsoleError;
    }
}
