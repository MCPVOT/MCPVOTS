import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json(
        {
            status: "ok",
            context: {
                name: "MCPVOT x402 Intelligence",
                ready: true,
            },
            timestamp: new Date().toISOString(),
        },
        {
            headers: {
                "Cache-Control": "no-store, max-age=0",
            },
        },
    );
}
