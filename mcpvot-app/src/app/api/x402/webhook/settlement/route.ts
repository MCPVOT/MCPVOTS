import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import type { Address } from 'viem';

/**
 * x402 Settlement Webhook
 *
 * This endpoint receives notifications from the CDP facilitator when USDC settlements are completed.
 * It triggers the VOT settlement pipeline to distribute VOT tokens to purchasers.
 */
export async function POST(request: NextRequest) {
    try {
        // Verify webhook signature (basic security)
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !process.env.X402_WEBHOOK_SECRET) {
            return NextResponse.json({
                success: false,
                error: 'Authorization required'
            }, { status: 401 });
        }

        if (authHeader !== `Bearer ${process.env.X402_WEBHOOK_SECRET}`) {
            return NextResponse.json({
                success: false,
                error: 'Invalid authorization'
            }, { status: 403 });
        }

        const body = await request.json();

        console.log('[x402/webhook/settlement] Received settlement notification:', {
            txHash: body.txHash,
            usdcAmount: body.usdcAmount,
            userAddress: body.userAddress,
            facilitatorAddress: body.facilitatorAddress,
            timestamp: new Date().toISOString()
        });

        // Validate required fields
        if (!body.txHash || !body.usdcAmount || !body.userAddress) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: txHash, usdcAmount, userAddress'
            }, { status: 400 });
        }

        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(body.userAddress.toLowerCase())) {
            return NextResponse.json({
                success: false,
                error: 'Invalid user address format'
            }, { status: 400 });
        }

        // Validate USDC amount format
        const usdcAmount = parseFloat(body.usdcAmount);
        if (isNaN(usdcAmount) || usdcAmount <= 0) {
            return NextResponse.json({
                success: false,
                error: 'Invalid USDC amount'
            }, { status: 400 });
        }

        // For now, save the settlement notification to a JSON file that the settlement processor can monitor
        // In production, this would trigger a direct call to the settlement processor
        const settlementNotification = {
            id: `settlement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            txHash: body.txHash,
            usdcAmount: body.usdcAmount,
            userAddress: body.userAddress.toLowerCase() as Address,
            facilitatorAddress: body.facilitatorAddress,
            timestamp: new Date().toISOString(),
            status: 'pending_processing',
            source: 'cdp_facilitator_webhook'
        };

        // Save to pending settlements file (monitored by settlement processor)
        const pendingDir = path.join(process.cwd(), 'data', 'pending-settlements');
        const settlementPath = path.join(pendingDir, `${settlementNotification.id}.json`);

        // Create directory if it doesn't exist
        try {
            mkdirSync(pendingDir, { recursive: true });
        } catch {
            // Directory might already exist, that's fine
        }

        writeFileSync(settlementPath, JSON.stringify(settlementNotification, null, 2));

        console.log('[x402/webhook/settlement] Settlement notification saved:', {
            id: settlementNotification.id,
            path: settlementPath,
            userAddress: body.userAddress
        });

        // Also update the registry to track this settlement for the user
        // In a real implementation, this would interface with the x402Registry
        console.log('[x402/webhook/settlement] Settlement queued for VOT distribution to:', body.userAddress);

        return NextResponse.json({
            success: true,
            settlementId: settlementNotification.id,
            message: 'Settlement notification received and queued for VOT distribution',
            userAddress: body.userAddress,
            usdcAmount: body.usdcAmount,
            txHash: body.txHash,
            processing: {
                method: 'File-based queue',
                target: 'VOT_Trading_Bot/x402_settlement_processor.py',
                expected: 'USDC will be swapped to VOT and sent to user wallet'
            }
        });

    } catch (error) {
        console.error('[x402/webhook/settlement] Error processing settlement webhook:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to process settlement webhook',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending_processing';

        // Read all settlement notification files
        const pendingDir = path.join(process.cwd(), 'data', 'pending-settlements');
        let settlementFiles = [];

        try {
            const files = readdirSync(pendingDir) || [];
            settlementFiles = files.filter(file => file.endsWith('.json'));
        } catch {
            // Directory doesn't exist yet, that's fine
            settlementFiles = [];
        }

        // Load settlements based on status filter
        const settlements = [];
        for (const file of settlementFiles) {
            try {
                const filePath = path.join(pendingDir, file);
                const content = readFileSync(filePath, 'utf8');
                const settlement = JSON.parse(content);

                if (status === 'all' || settlement.status === status) {
                    settlements.push(settlement);
                }
            } catch (error) {
                console.warn(`[x402/webhook/settlement] Failed to read settlement file:`, file, error);
            }
        }

        return NextResponse.json({
            success: true,
            count: settlements.length,
            statusFilter: status,
            settlements,
            info: {
                webhookEndpoint: '/api/x402/webhook/settlement',
                processor: 'VOT_Trading_Bot/x402_settlement_processor.py',
                queueMethod: 'File-based monitoring',
                expectedProcessing: 'USDC to VOT conversion and distribution to user wallets'
            }
        });

    } catch (error) {
        console.error('[x402/webhook/settlement] Error fetching settlements:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch settlements',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
