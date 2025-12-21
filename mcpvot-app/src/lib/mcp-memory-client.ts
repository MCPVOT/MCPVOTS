// MCP Memory Client for MAXX ecosystem
// This provides a simple interface to the MCP memory system

interface MemoryStoreParams {
    content: string;
    vector: number[];
    category?: string;
    metadata?: Record<string, unknown>;
}

interface MemorySearchParams {
    queryVector: number[];
    limit?: number;
    category?: string;
}

interface MemoryData {
    id: string;
    content: string;
    vector: number[];
    category?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

interface MemoryStats {
    total_memories: number;
    categories: Record<string, number>;
    total_size_bytes: number;
}

const DEFAULT_MEMORY_URL = 'http://127.0.0.1:8001';
const DEFAULT_TIMEOUT_MS = Number(process.env.MCP_MEMORY_TIMEOUT_MS ?? '10000');

function resolveMemoryBaseUrl(): string {
    const candidates = [
        process.env.MCP_MEMORY_URL,
        process.env.MCP_MEMORY_SERVER_URL,
        process.env.MCP_MEMORY_BASE_URL,
        process.env.NEXT_PUBLIC_MCP_MEMORY_URL,
    ];

    for (const candidate of candidates) {
        if (candidate && candidate.trim().length > 0) {
            return candidate.replace(/\/$/, '');
        }
    }

    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'development') {
        console.warn('[MCP Memory] MCP_MEMORY_URL not configured for deployed environment; falling back to localhost.');
    }

    return DEFAULT_MEMORY_URL;
}

function buildMemoryUrl(path: string): string {
    const baseUrl = resolveMemoryBaseUrl();
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildMemoryHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const authToken = process.env.MCP_MEMORY_AUTH_TOKEN;
    if (authToken) {
        headers['X-MCP-Memory-Token'] = authToken;
    }

    return headers;
}

export async function mcp_maxx_memory_store_memory(params: MemoryStoreParams): Promise<string | null> {
    try {
        console.log('[MCP Memory] Storing memory:', params.content.slice(0, 50) + '...');

        const timeoutMs = Number.isFinite(DEFAULT_TIMEOUT_MS) && DEFAULT_TIMEOUT_MS > 0 ? DEFAULT_TIMEOUT_MS : 3500;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        let response: Response;
        try {
            // Try a quick health check before writing when possible
            try {
                const health = await fetch(buildMemoryUrl('/health'), { method: 'GET', cache: 'no-store', signal: controller.signal });
                if (!health.ok) {
                    console.warn('[MCP Memory] Health check failed on memory server (status: ' + health.status + '). Proceeding to attempt store...');
                }
            } catch {
                // health check failed — proceed and let store fail gracefully
            }

            response = await fetch(buildMemoryUrl('/memories/store'), {
                method: 'POST',
                headers: buildMemoryHeaders(),
                body: JSON.stringify({
                    content: params.content,
                    category: params.category || 'general',
                    metadata: params.metadata,
                    vector: Array.isArray(params.vector) && params.vector.length > 0 ? params.vector : undefined,
                }),
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            if (response.status === 404) {
                console.warn('[MCP Memory] Store skipped — service responded 404 (likely offline).');
                return null;
            }
            throw new Error(`HTTP call failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[MCP Memory] Successfully stored memory');
        return result.memory_id?.toString() || null;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn('[MCP Memory] Store skipped — request timeout reached.');
            return null;
        }
        // Handle connection refused specifically and log tips for troubleshooting
        const err = error as { code?: string; errno?: number } | undefined;
        if (err?.code === 'ECONNREFUSED' || err?.errno === -111) {
            console.error('[MCP Memory] Store error: Connection refused to the MCP memory host. Please set MCP_MEMORY_URL or MCP_MEMORY_HOST/MCP_MEMORY_PORT environment variables to point to the running memory server (default: http://127.0.0.1:8001).');
            return null;
        }
        console.error('[MCP Memory] Store error:', error);
        return null;
    }
}

export async function mcp_maxx_memory_retrieve_memory(memoryId: string): Promise<MemoryData | null> {
    try {
        console.log('[MCP Memory] Retrieving memory:', memoryId);

        const response = await fetch(buildMemoryUrl(`/memories/${memoryId}`), {
            method: 'GET',
            headers: buildMemoryHeaders(),
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log('[MCP Memory] Memory not found');
                return null;
            }
            throw new Error(`HTTP call failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[MCP Memory] Successfully retrieved memory');
        return result.memory as MemoryData;
    } catch (error) {
        console.error('[MCP Memory] Retrieve error:', error);
        return null;
    }
}

export async function mcp_maxx_memory_search_memory(params: MemorySearchParams): Promise<MemoryData[]> {
    try {
        console.log('[MCP Memory] Searching memories');

        const response = await fetch(buildMemoryUrl('/memories/search'), {
            method: 'POST',
            headers: buildMemoryHeaders(),
            body: JSON.stringify({
                category: params.category || 'general',
                limit: params.limit || 10,
                include_vectors: false
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP call failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[MCP Memory] Search returned', result.memories?.length || 0, 'results');

        // Transform the response to match expected format
        return (result.memories || []).map((memory: {
            id: number;
            content: string;
            category: string;
            timestamp: string;
            metadata?: Record<string, unknown>;
        }) => ({
            id: memory.id.toString(),
            content: memory.content,
            vector: [], // Not included in search results
            category: memory.category,
            metadata: memory.metadata || {},
            created_at: memory.timestamp
        }));
    } catch (error) {
        console.error('[MCP Memory] Search error:', error);
        return [];
    }
}

export async function mcp_maxx_memory_get_memory_stats(): Promise<MemoryStats | null> {
    try {
        console.log('[MCP Memory] Getting memory stats');

        const response = await fetch(buildMemoryUrl('/memories/stats'), {
            method: 'GET',
            headers: buildMemoryHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP call failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[MCP Memory] Got memory stats');
        return result.stats as MemoryStats;
    } catch (error) {
        console.error('[MCP Memory] Stats error:', error);
        return null;
    }
}
