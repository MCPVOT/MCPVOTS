import { NextResponse } from 'next/server';

/**
 * VOT Intelligence API - ARCHIVED
 * 
 * This endpoint has been archived while Beeper Machine is being perfected.
 * VOT Machine and VOT Intelligence will return after Beeper Machine is complete.
 * 
 * Status: ARCHIVED (June 2025)
 * Reason: Focus on Beeper Machine development
 * ETA: After Beeper Machine completion
 */

export async function GET() {
    return NextResponse.json(
        {
            error: 'VOT Intelligence endpoint temporarily archived',
            message: 'This service is being upgraded. Please check back after Beeper Machine is complete.',
            status: 'archived',
            reason: 'Focus on Beeper Machine development',
            alternatives: [
                { endpoint: '/api/x402/intelligence/clanker', description: 'Clanker token analytics' },
                { endpoint: '/api/x402/intelligence/farcaster', description: 'Farcaster ecosystem data' },
                { endpoint: '/api/x402/intelligence/x402loop', description: 'x402 protocol analytics' },
            ],
            documentation: 'https://mcpvot.xyz/docs',
        },
        { 
            status: 410, // Gone - indicates the resource is intentionally no longer available
            headers: {
                'X-Archived-At': '2025-06-14',
                'X-Archived-Reason': 'Beeper Machine focus',
            }
        }
    );
}

export async function POST() {
    return GET();
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-PAYMENT',
            'Access-Control-Max-Age': '86400',
        },
    });
}

