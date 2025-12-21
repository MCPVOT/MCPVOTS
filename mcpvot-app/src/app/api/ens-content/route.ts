import { ensContentManager } from '@/lib/ensContentManager';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Optional: Add authentication for security
        // const session = await auth();
        // if (!session) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        interface EnsRequest {
  action: string;
  content?: unknown;
  options?: Record<string, unknown>;
}

const body = await request.json() as EnsRequest;
const { action, content, options = {} } = body;

        console.log('[ENS API] Received request:', { action, hasContent: !!content });

        switch (action) {
            case 'publish':
                return await handlePublish(content, options);
            case 'verify':
                return await handleVerify(content, options);
            case 'getStatus':
                return await handleGetStatus(options);
            case 'setContentHash':
                return await handleSetContentHash(content, options);
            default:
                return NextResponse.json(
                    { error: 'Invalid action. Supported: publish, verify, getStatus, setContentHash' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('[ENS API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

async function handlePublish(content: unknown, options: Record<string, unknown>) {
    console.log('[ENS API] Publishing content...');
    
    const result = await ensContentManager.publishAppContent({
        content: content || await generateAppManifest(),
        pinToIPFS: options.pinToIPFS ?? true,
        updateENS: options.updateENS ?? true,
        domain: options.domain
    });

    if (result.success) {
        return NextResponse.json({
            success: true,
            message: 'Content published successfully',
            ipfsHash: result.ipfsHash,
            ensTxHash: result.ensTxHash,
            metadata: result.metadata
        });
    } else {
        return NextResponse.json(
            { error: 'Publishing failed', details: result.error },
            { status: 500 }
        );
    }
}

async function handleVerify(contentHash: string, options: Record<string, unknown>) {
    console.log('[ENS API] Verifying content:', contentHash);
    
    const isValid = await ensContentManager.verifyContent(contentHash, options.expectedChecksum);
    
    return NextResponse.json({
        success: true,
        isValid,
        contentHash,
        verifiedAt: new Date().toISOString()
    });
}

async function handleGetStatus(options: Record<string, unknown>) {
    console.log('[ENS API] Getting ENS status...');
    
    const domain = options.domain || process.env.NEXT_PUBLIC_ENS_DOMAIN || 'mcpvot.eth';
    const currentHash = await ensContentManager.getCurrentENSContentHash(domain);
    
    // Get IPFS gateway status
    const gateways = [
        process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io',
        'https://cloudflare-ipfs.com',
        'https://gateway.pinata.cloud'
    ];

    const gatewayStatus = await Promise.allSettled(
        gateways.map(async (gateway) => {
            try {
                const response = await fetch(`${gateway}/ipfs/${currentHash || 'QmNnooCu85dBCVO8tavvpx7C8TRUNKhSsKKQK8YKC7Zrph'}`);
                return { gateway, status: response.ok, latency: Date.now() };
            } catch (error) {
                return { gateway, status: false, error: error.message };
            }
        })
    );

    return NextResponse.json({
        success: true,
        domain,
        currentContentHash: currentHash,
        gateways: gatewayStatus.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                return { 
                    gateway: gateways[index], 
                    status: false, 
                    error: result.reason.message 
                };
            }
        }),
        checkedAt: new Date().toISOString()
    });
}

async function handleSetContentHash(contentHash: string, options: Record<string, unknown>) {
    console.log('[ENS API] Setting ENS content hash:', contentHash);
    
    if (!contentHash) {
        return NextResponse.json(
            { error: 'Content hash is required' },
            { status: 400 }
        );
    }

    const domain = options.domain || process.env.NEXT_PUBLIC_ENS_DOMAIN || 'mcpvot.eth';
    const txHash = await ensContentManager.setENSContentHash(domain, contentHash);
    
    return NextResponse.json({
        success: true,
        message: 'ENS content hash updated successfully',
        domain,
        contentHash,
        txHash,
        updatedAt: new Date().toISOString()
    });
}

async function generateAppManifest() {
    return {
        name: 'MCPVOT',
        description: 'AI-powered decentralized trading platform',
        version: process.env.npm_package_version || '1.0.0',
        urls: {
            main: process.env.NEXT_PUBLIC_APP_URL || 'https://mcpvot.xyz',
            eth: 'https://mcpvot.eth.link',
            fallback: 'https://mcpvot.vercel.app'
        },
        features: [
            'AI trading signals',
            'Real-time analytics', 
            'Farcaster integration',
            'ENS name resolution',
            'x402 intelligence',
            'Multi-chain support'
        ],
        contracts: {
            votToken: process.env.NEXT_PUBLIC_VOT_TOKEN_ADDRESS,
            x402Facilitator: process.env.NEXT_PUBLIC_FACILITATOR_URL
        },
        lastUpdated: new Date().toISOString(),
        buildInfo: {
            nodeEnv: process.env.NODE_ENV,
            buildTime: new Date().toISOString()
        }
    };
}

// GET request for status check
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'status';
        const contentHash = searchParams.get('hash');

        switch (action) {
            case 'status':
                return await handleGetStatus({});
            case 'verify':
                if (!contentHash) {
                    return NextResponse.json(
                        { error: 'Content hash parameter required for verify action' },
                        { status: 400 }
                    );
                }
                return await handleVerify(contentHash, {});
            default:
                return NextResponse.json(
                    { error: 'Invalid action for GET request' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('[ENS API] GET Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}