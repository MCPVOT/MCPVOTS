import { mcp_maxx_memory_store_memory } from '@/lib/mcp-memory-client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const event = typeof body?.event === 'string' ? body.event.trim() : '';
        const content = typeof body?.content === 'string' ? body.content.trim() : '';
        const metadata = (body?.metadata && typeof body.metadata === 'object') ? body.metadata : undefined;

        if (!event || !content) {
            return NextResponse.json({ success: false, error: 'event and content are required' }, { status: 400 });
        }

        const envelope = {
            event,
            timestamp: new Date().toISOString(),
            content
        };

        const memoryId = await mcp_maxx_memory_store_memory({
            content: JSON.stringify(envelope),
            vector: new Array(32).fill(0),
            category: 'mcpvot_logs',
            metadata: {
                ...metadata,
                event,
                createdBy: 'mcpvot-app'
            }
        });

        return NextResponse.json({ success: true, memoryId });
    } catch (error) {
        console.error('[MCP Memory] Log endpoint error:', error);
        const message = error instanceof Error ? error.message : 'Failed to log memory entry';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
