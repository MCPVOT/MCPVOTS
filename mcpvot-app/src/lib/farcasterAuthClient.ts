import { createAppClient, viemConnector } from '@farcaster/auth-client';

type GlobalWithAuthClient = typeof globalThis & {
    __farcasterAuthClient?: ReturnType<typeof createAppClient>;
};

const globalTarget = globalThis as GlobalWithAuthClient;

function resolveRelay(): string {
    return (
        process.env.FARCASTER_RELAY_URL ||
        process.env.NEXT_PUBLIC_FARCASTER_RELAY_URL ||
        'https://relay.farcaster.xyz'
    );
}

function resolveRpcUrl(): string | undefined {
    return (
        process.env.FARCASTER_RPC_URL ||
        process.env.NEXT_PUBLIC_FARCASTER_RPC_URL ||
        process.env.BASE_RPC_URL ||
        process.env.NEXT_PUBLIC_BASE_RPC_URL
    );
}

export function getFarcasterAuthClient() {
    if (!globalTarget.__farcasterAuthClient) {
        const rpcUrl = resolveRpcUrl();
        globalTarget.__farcasterAuthClient = createAppClient({
            relay: resolveRelay(),
            ethereum: viemConnector({ rpcUrl }),
        });
    }

    return globalTarget.__farcasterAuthClient;
}

export function getAppDomain(): string {
    const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mcpvot.xyz';
    try {
        return new URL(rawUrl).hostname;
    } catch (error) {
        console.warn('[farcaster-auth] Failed to parse NEXT_PUBLIC_APP_URL, defaulting to mcpvot.xyz', error);
        return 'mcpvot.xyz';
    }
}
