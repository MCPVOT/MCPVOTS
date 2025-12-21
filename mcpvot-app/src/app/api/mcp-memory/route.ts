import { NextRequest, NextResponse } from 'next/server';

// MCP Memory Server Configuration
const MCP_MEMORY_HOST = process.env.MCP_MEMORY_HOST || 'localhost';
const MCP_MEMORY_PORT = process.env.MCP_MEMORY_PORT || '8001';

interface MCPMemoryResponse {
    memories: Array<{
        id: number;
        category: string;
        content: string;
        timestamp: string;
        vector?: number[];
        metadata?: Record<string, unknown>;
    }>;
    total: number;
    category: string;
    limit: number;
}

async function queryMCPMemory(category: string = 'general', limit: number = 10): Promise<MCPMemoryResponse | null> {
    try {
        const response = await fetch(`http://${MCP_MEMORY_HOST}:${MCP_MEMORY_PORT}/memories/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category,
                limit,
                include_vectors: false
            }),
        });

        if (!response.ok) {
            console.error(`MCP Memory API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        return {
            memories: data.memories || [],
            total: data.total || 0,
            category,
            limit
        };
    } catch (error) {
        console.error('Failed to query MCP memory:', error);
        return null;
    }
}

async function storeMCPMemory(content: string, category: string = 'general', metadata?: Record<string, unknown>): Promise<boolean> {
    try {
        const response = await fetch(`http://${MCP_MEMORY_HOST}:${MCP_MEMORY_PORT}/memories/store`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                category,
                metadata: metadata || {}
            }),
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to store MCP memory:', error);
        return false;
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'general';
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Cap at 50

        // Query real MCP memory server
        const mcpData = await queryMCPMemory(category, limit);

        if (mcpData) {
            return NextResponse.json({
                memories: mcpData.memories,
                total: mcpData.total,
                category: mcpData.category,
                limit: mcpData.limit,
                source: 'mcp_server',
                timestamp: new Date().toISOString()
            });
        }

        // Fallback: Try to store some initial data if server is empty
        const fallbackMemories = [
            {
                id: 1,
                category: 'general',
                content: 'MCPVOT ecosystem initialized with Base network integration',
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                category: 'farcaster',
                content: 'Farcaster integration active - monitoring social sentiment',
                timestamp: new Date().toISOString()
            },
            {
                id: 3,
                category: 'trading',
                content: 'VOT token trading signals active on Base network',
                timestamp: new Date().toISOString()
            }
        ];

        // Try to store fallback data
        for (const memory of fallbackMemories) {
            await storeMCPMemory(memory.content, memory.category, { initialized: true });
        }

        // Return fallback data
        const filteredMemories = fallbackMemories
            .filter(memory => category === 'general' || memory.category === category)
            .slice(0, limit);

        return NextResponse.json({
            memories: filteredMemories,
            total: filteredMemories.length,
            category,
            limit,
            source: 'fallback_initialized',
            warning: 'MCP memory server not available, using initialized fallback data',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('MCP memory API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch MCP memory data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { content, category = 'general', metadata } = body;

        if (!content || typeof content !== 'string') {
            return NextResponse.json(
                { error: 'Content is required and must be a string' },
                { status: 400 }
            );
        }

        const success = await storeMCPMemory(content, category, metadata);

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'Memory stored successfully',
                category,
                timestamp: new Date().toISOString()
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to store memory in MCP server' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('MCP memory store error:', error);
        return NextResponse.json(
            {
                error: 'Failed to store MCP memory data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
