import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, limit = 5 } = body;

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        let response: Response;
        try {
            // Call MCP Neynar tool for cast search
            response = await fetch('http://localhost:3001/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'tools/call',
                    params: {
                        name: 'mcp_neynar_search_farcaster_casts',
                        arguments: {
                            query,
                            limit,
                        },
                    },
                }),
            });
        } catch (mcpError) {
            console.error('Search casts MCP connection error:', mcpError);
            return NextResponse.json(
                {
                    error: 'Neynar MCP service unavailable',
                    hint: 'Start the MCP server on port 3001 or configure NEXT_PUBLIC_MCP_ENDPOINT.',
                },
                { status: 503 }
            );
        }

        if (!response.ok) {
            throw new Error(`MCP call failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error.message);
        }

        return NextResponse.json(result.result);
    } catch (error) {
        console.error('Search casts API error:', error);
        return NextResponse.json(
            { error: 'Failed to search casts' },
            { status: 500 }
        );
    }
}
