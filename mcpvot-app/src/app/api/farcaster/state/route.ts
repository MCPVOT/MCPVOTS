import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json(
        {
            status: "ok",
            timestamp: new Date().toISOString(),
            message: "Farcaster state endpoint reachable",
            version: "1",
        },
        {
            headers: {
                "Cache-Control": "no-store, max-age=0",
            },
        },
    );
}
