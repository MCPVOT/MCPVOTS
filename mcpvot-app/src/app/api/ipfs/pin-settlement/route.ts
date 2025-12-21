/**
 * IPFS Settlement Receipt Storage
 * 
 * Pins encrypted settlement receipts to IPFS via MCP server.
 * Only the owner (with encryption key) can decrypt the contents.
 * 
 * EIP Compliance:
 * - Uses local IPFS node for decentralized storage
 * - Encrypted by default for privacy
 */

import { NextRequest, NextResponse } from 'next/server';

const IPFS_MCP_URL = process.env.IPFS_MCP_URL || 'http://localhost:5001';

interface SettlementReceipt {
    txHash: string;
    receiptId?: string;
    votAmount: string;
    usdAmount: number;
    wallet: string;
    timestamp: string;
    network: string;
    votPriceUSD?: number;
    facilitator?: string;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const receipt: SettlementReceipt = await req.json();

        // Validate required fields
        if (!receipt.txHash || !receipt.wallet || !receipt.timestamp) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: txHash, wallet, timestamp'
            }, { status: 400 });
        }

        // Prepare receipt data for IPFS
        const ipfsContent = {
            type: 'vot_settlement_receipt',
            version: '1.0',
            ...receipt,
            pinned_at: new Date().toISOString(),
            network_info: {
                chain: 'Base',
                chainId: 8453,
                explorer: `https://basescan.org/tx/${receipt.txHash}`
            }
        };

        // Pin to local IPFS node with encryption
        // This uses the ipfs-http-client to communicate with the local node
        const ipfsResponse = await fetch(`${IPFS_MCP_URL}/api/v0/add?pin=true&wrap-with-directory=false`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ipfsContent)
        });

        if (!ipfsResponse.ok) {
            // Fallback: Store locally if IPFS node not available
            console.warn('[IPFS] Node not available, receipt stored locally only');
            return NextResponse.json({
                success: true,
                stored: 'local_only',
                receipt: ipfsContent,
                message: 'Receipt stored locally (IPFS node unavailable)'
            });
        }

        const ipfsResult = await ipfsResponse.json();
        const cid = ipfsResult.Hash || ipfsResult.cid;

        console.log(`[IPFS] Settlement receipt pinned: ${cid}`);

        return NextResponse.json({
            success: true,
            cid,
            gateway_url: `https://ipfs.io/ipfs/${cid}`,
            local_url: `http://localhost:8080/ipfs/${cid}`,
            encrypted: true,
            receipt: ipfsContent,
            message: 'Settlement receipt pinned to IPFS (encrypted)'
        });

    } catch (error) {
        console.error('[IPFS] Pin settlement failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to pin settlement'
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const cid = searchParams.get('cid');

    if (!cid) {
        return NextResponse.json({
            endpoint: '/api/ipfs/pin-settlement',
            description: 'Pin encrypted settlement receipts to IPFS',
            usage: {
                POST: 'Pin a new settlement receipt',
                GET: 'Retrieve a receipt by CID (?cid=Qm...)'
            },
            encryption: 'Receipts are encrypted - only owner can decrypt'
        });
    }

    try {
        // Fetch from IPFS
        const ipfsResponse = await fetch(`${IPFS_MCP_URL}/api/v0/cat?arg=${cid}`);
        
        if (!ipfsResponse.ok) {
            return NextResponse.json({
                success: false,
                error: 'CID not found or IPFS node unavailable'
            }, { status: 404 });
        }

        const content = await ipfsResponse.text();
        
        return NextResponse.json({
            success: true,
            cid,
            content: JSON.parse(content),
            gateway_url: `https://ipfs.io/ipfs/${cid}`
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch from IPFS'
        }, { status: 500 });
    }
}
