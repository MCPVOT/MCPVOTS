const PRODUCTION_MCP_BASE = 'https://mcpvot.xyz';
const LOCAL_MCP_BASE = 'http://localhost:3001';
const PRODUCTION_FACILITATOR_URL = `${PRODUCTION_MCP_BASE}/facilitator`;
const LOCAL_FACILITATOR_URL = `${LOCAL_MCP_BASE}/facilitator`;

function stripTrailingSlash(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url;
}

function removeRpcSuffix(url: string): string {
    return url.endsWith('/mcp') ? url.slice(0, -4) : url;
}

function resolveExplicitRpc(): string | undefined {
    const explicit = process.env.NEXT_PUBLIC_MCP_ENDPOINT || process.env.MCP_ENDPOINT;
    if (!explicit) {
        return undefined;
    }
    const normalized = stripTrailingSlash(explicit);
    return normalized.endsWith('/mcp') ? normalized : `${normalized}/mcp`;
}

export function resolveMcpBaseUrl(): string {
    const explicitRpc = resolveExplicitRpc();
    if (explicitRpc) {
        return removeRpcSuffix(explicitRpc);
    }
    return process.env.NODE_ENV === 'production' ? PRODUCTION_MCP_BASE : LOCAL_MCP_BASE;
}

export function resolveMcpRpcUrl(): string {
    const explicitRpc = resolveExplicitRpc();
    if (explicitRpc) {
        return explicitRpc;
    }
    return `${resolveMcpBaseUrl()}/mcp`;
}

export function resolveFacilitatorUrl(): string {
    if (process.env.FACILITATOR_URL) {
        return process.env.FACILITATOR_URL;
    }
    return process.env.NODE_ENV === 'production' ? PRODUCTION_FACILITATOR_URL : LOCAL_FACILITATOR_URL;
}
