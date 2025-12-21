import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fid: string }> }
) {
    try {
        const { fid } = await params;
        const fidNum = parseInt(fid);

        if (isNaN(fidNum)) {
            return NextResponse.json(
                { error: 'Invalid FID' },
                { status: 400 }
            );
        }

        // Call MCP Neynar tool for user data
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
                    name: 'mcp_neynar_get_farcaster_user',
                    arguments: {
                        fid: fidNum
                    }
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
        console.error('User API error:', error);
        return NextResponse.json(
            { error: 'Failed to get user data' },
            { status: 500 }
        );
    }
}
