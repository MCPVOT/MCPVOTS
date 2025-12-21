import { clearBaseNameCache, resolveBaseName, resolveBaseNameWithTrace } from '@/lib/baseNameUtils';
import { mcp_maxx_memory_store_memory } from '@/lib/mcp-memory-client';
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { base, mainnet } from 'viem/chains';

// Contract addresses
const BASE_L2_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD';
const BASE_REVERSE_REGISTRAR = '0x79EA96012eEa67A83431F1701B3dFf7e37F9E282';

// Create clients with faster RPC endpoints
const baseClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.MAINNET_RPC_URL || 'https://ethereum-rpc.publicnode.com'),
});

// ABIs
const reverseRegistrarAbi = parseAbi([
  'function node(address addr) pure returns (bytes32)'
]);

const resolverAbi = parseAbi([
  'function name(bytes32 node) view returns (string)'
]);

/**
 * Fast basename resolution using direct viem contract calls
 * Optimized for Vercel with 4s timeout
 */
async function resolveBasenameFast(address: `0x${string}`): Promise<string | null> {
  const TIMEOUT_MS = 4000;
  
  try {
    // Get reverse node from ReverseRegistrar
    const nodePromise = baseClient.readContract({
      address: BASE_REVERSE_REGISTRAR,
      abi: reverseRegistrarAbi,
      functionName: 'node',
      args: [address],
    });
    
    const node = await Promise.race([
      nodePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS))
    ]);
    
    if (!node) {
      console.log('[resolve-basename] ReverseRegistrar.node() timed out');
      return null;
    }
    
    // Query L2Resolver.name(node)
    const namePromise = baseClient.readContract({
      address: BASE_L2_RESOLVER,
      abi: resolverAbi,
      functionName: 'name',
      args: [node],
    });
    
    const name = await Promise.race([
      namePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS))
    ]);
    
    if (name && typeof name === 'string' && name.length > 0) {
      return name;
    }
    
    return null;
  } catch (error) {
    console.log('[resolve-basename] Fast resolution failed:', error);
    return null;
  }
}

/**
 * Fast ENS resolution
 */
async function resolveEnsFast(address: `0x${string}`): Promise<string | null> {
  const TIMEOUT_MS = 4000;
  
  try {
    const namePromise = mainnetClient.getEnsName({ address });
    
    const name = await Promise.race([
      namePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS))
    ]);
    
    return name || null;
  } catch (error) {
    console.log('[resolve-basename] ENS resolution failed:', error);
    return null;
  }
}

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function GET(request: NextRequest) {
    const startTime = Date.now();
    
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address') as `0x${string}` | null;
        const force = searchParams.get('force') === 'true';
        const fast = searchParams.get('fast') !== 'false'; // Default to fast mode
        const debug = searchParams.get('debug') === 'true';

        if (!address) {
            return NextResponse.json({ error: 'address query parameter is required' }, { status: 400 });
        }

        if (force) {
            clearBaseNameCache(address);
        }

        // Debug mode - uses full trace
        if (debug) {
            const debugResult = await resolveBaseNameWithTrace(address);

            try {
                await mcp_maxx_memory_store_memory({
                    content: JSON.stringify({
                        type: 'basename_debug',
                        address,
                        baseName: debugResult.baseName,
                        trace: debugResult.trace.slice(-20),
                        timestamp: new Date().toISOString()
                    }, null, 2),
                    vector: [],
                    category: 'basename_debug',
                    metadata: { address, baseName: debugResult.baseName }
                }).catch(() => { /* ignore failures */ });
            } catch { /* ignore */ }

            return NextResponse.json({ 
                address, 
                baseName: debugResult.baseName, 
                debug: debugResult.trace, 
                resolvedIn: `${Date.now() - startTime}ms`,
                timestamp: new Date().toISOString() 
            });
        }

        // Fast mode (default) - direct viem calls with parallel ENS resolution
        if (fast) {
            const [baseName, ensName] = await Promise.all([
                resolveBasenameFast(address),
                resolveEnsFast(address),
            ]);
            
            const displayName = baseName || ensName || `${address.slice(0, 6)}...${address.slice(-4)}`;
            
            return NextResponse.json({ 
                address, 
                baseName, 
                ensName,
                displayName,
                mode: 'fast',
                resolvedIn: `${Date.now() - startTime}ms`,
                timestamp: new Date().toISOString() 
            });
        }

        // Full mode - uses baseNameUtils with all fallbacks
        const baseName = await resolveBaseName(address);

        return NextResponse.json({ 
            address, 
            baseName, 
            mode: 'full',
            resolvedIn: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString() 
        });
    } catch (err) {
        console.error('[API] /api/resolve-basename failed:', err);
        return NextResponse.json({ 
            error: 'Failed to resolve base name', 
            details: err instanceof Error ? err.message : String(err),
            resolvedIn: `${Date.now() - startTime}ms`,
        }, { status: 500 });
    }
}
