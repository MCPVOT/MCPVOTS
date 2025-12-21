import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Call MCP Neynar tool for hub status
        const response = await fetch('http://localhost:3001/mcp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: {
                    name: 'mcp_neynar_get_farcaster_hub_status',
                    arguments: {}
                }
            })
        });

        if (!response.ok) {
            throw new Error(`MCP call failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error.message);
        }

        return NextResponse.json(result.result);
    } catch (error) {
        console.error('Hub status API error:', error);
        return NextResponse.json(
            { error: 'Failed to get hub status' },
            { status: 500 }
        );
    }
}
