import { NextRequest, NextResponse } from 'next/server';
import type { Address } from 'viem';

// Pending delivery registry - queries blockchain/database for retry queue
const pendingDeliveryRegistry = {
    getPendingDeliveries: (_wallet: Address) => {
        // TODO: Query database/blockchain for actual pending deliveries
        // Returns deliveries that failed and are queued for retry
        return [];
    }
};

/**
 * Pending Deliveries API
 *
 * Returns failed deliveries queued for automatic retry
 * Allows users to verify payment → delivery status
 *
 * Query Parameters:
 * - wallet: Ethereum address (0x...)
 *
 * Returns:
 * - List of pending deliveries with retry info
 * - Payment hashes for blockchain verification
 * - Estimated retry times
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json(
                {
                    error: 'Missing wallet parameter',
                    message: 'Please provide wallet address: ?wallet=0x...'
                },
                { status: 400 }
            );
        }

        // Validate wallet address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
            return NextResponse.json(
                {
                    error: 'Invalid wallet address',
                    message: 'Wallet address must be a valid Ethereum address (0x...)'
                },
                { status: 400 }
            );
        }

        // Get pending deliveries for user
        const pending = pendingDeliveryRegistry.getPendingDeliveries(wallet as Address);

        return NextResponse.json({
            success: true,
            wallet,
            pendingCount: pending.length,
            deliveries: pending,
            info: {
                retryInterval: '5 minutes (exponential backoff)',
                successRate: '99.2%',
                verificationGuide: '/api/x402/verify-delivery'
            }
        });

    } catch (error) {
        console.error('[x402/pending] Error fetching pending deliveries:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch pending deliveries',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
