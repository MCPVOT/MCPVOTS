import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ fid: string }> }
) {
    try {
        const { fid } = await params;
        const fidNum = parseInt(fid);
        const body = await request.json();
        const { networks = ['base', 'ethereum'] } = body;

        if (isNaN(fidNum)) {
            return NextResponse.json(
                { error: 'Invalid FID' },
                { status: 400 }
            );
        }

        // Call MCP Neynar tool for user balance
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
                    name: 'mcp_neynar_get_farcaster_user_balance',
                    arguments: {
                        fid: fidNum,
                        networks: networks
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
        console.error('Balance API error:', error);
        return NextResponse.json(
            { error: 'Failed to get balance data' },
            { status: 500 }
        );
    }
}
