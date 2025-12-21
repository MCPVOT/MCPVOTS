import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address') as `0x${string}` | null;

        if (!address) {
            return NextResponse.json({ error: 'address query parameter is required' }, { status: 400 });
        }

        // ENS resolution using Ethereum mainnet
        console.log('[ENS] Resolving ENS name for', address.slice(0, 6) + '...');

        // Method 1: Try public ENS API
        try {
            const ensResponse = await fetch(`https://api.ensideas.com/ens/resolve/${address}`, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(5000)
            });

            if (ensResponse.ok) {
                const data = await ensResponse.json();
                if (data?.name && data.name.endsWith('.eth')) {
                    console.log('[ENS] API resolved:', data.name);
                    return NextResponse.json({ 
                        address, 
                        ensName: data.name, 
                        source: 'ensideas',
                        timestamp: new Date().toISOString() 
                    });
                }
            }
        } catch (apiError) {
            console.log('[ENS] API fallback failed:', apiError);
        }

        // Method 2: Try web3.bio API
        try {
            const web3bioResponse = await fetch(`https://api.web3.bio/profile/${address}`, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(5000)
            });

            if (web3bioResponse.ok) {
                const profiles = await web3bioResponse.json();
                if (Array.isArray(profiles)) {
                    const ensProfile = profiles.find((p: { platform?: string; identity?: string }) => 
                        p.platform === 'ens' && p.identity?.endsWith('.eth')
                    );
                    if (ensProfile?.identity) {
                        console.log('[ENS] web3.bio resolved:', ensProfile.identity);
                        return NextResponse.json({ 
                            address, 
                            ensName: ensProfile.identity, 
                            source: 'web3bio',
                            timestamp: new Date().toISOString() 
                        });
                    }
                }
            }
        } catch (web3bioError) {
            console.log('[ENS] web3.bio fallback failed:', web3bioError);
        }

        // Method 3: Try direct RPC resolution
        try {
            const { ethers } = await import('ethers');

            // Use Ethereum mainnet RPC for ENS
            const rpcUrls = [
                'https://eth.llamarpc.com',
                'https://rpc.ankr.com/eth',
                'https://ethereum.publicnode.com',
                process.env.ETHEREUM_RPC_URL
            ].filter(Boolean) as string[];

            for (const rpcUrl of rpcUrls) {
                try {
                    const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
                        staticNetwork: true,
                        batchMaxCount: 1
                    });

                    // Test connection
                    await provider.getBlockNumber();

                    // Lookup ENS name
                    const ensName = await provider.lookupAddress(address);
                    
                    if (ensName && ensName.endsWith('.eth')) {
                        console.log('[ENS] RPC resolved:', ensName);
                        return NextResponse.json({ 
                            address, 
                            ensName, 
                            source: 'rpc',
                            timestamp: new Date().toISOString() 
                        });
                    }

                    // If no name found on this RPC, try next
                    break;
                } catch (rpcError) {
                    console.log('[ENS] RPC failed:', rpcUrl.slice(0, 30) + '...', rpcError);
                    continue;
                }
            }
        } catch (rpcError) {
            console.log('[ENS] Direct RPC resolution failed:', rpcError);
        }

        // No ENS name found
        console.log('[ENS] No ENS name found for', address.slice(0, 6) + '...');
        return NextResponse.json({ 
            address, 
            ensName: null, 
            timestamp: new Date().toISOString() 
        });

    } catch (err) {
        console.error('[API] /api/resolve-ens failed:', err);
        return NextResponse.json({ 
            error: 'Failed to resolve ENS name', 
            details: err instanceof Error ? err.message : String(err) 
        }, { status: 500 });
    }
}
