/**
 * CCIP-Read Gateway for VOT Machine ENS Resolution
 * 
 * Handles requests from L1 WildcardResolver:
 * 1. Parse subdomain from calldata (e.g., "180.mcpvot.eth")
 * 2. Query Base L2 VOTRegistry for contenthash
 * 3. Return signed response OR storage proof
 * 
 * EIP-3668 (CCIP Read) Implementation:
 * - L1 WildcardResolver reverts with OffchainLookup(sender, urls, callData, callbackFunction, extraData)
 * - Client fetches from this gateway: POST /api/gateway { sender, data }
 * - Gateway queries Base L2 for contenthash
 * - Returns signed response for callback verification
 * 
 * @see https://eips.ethereum.org/EIPS/eip-3668
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, decodeAbiParameters, encodeAbiParameters, encodePacked, http, keccak256, parseAbiParameters, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// =============================================================================
// CORS HEADERS - Required for ENS resolvers calling this gateway
// =============================================================================
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// =============================================================================
// CONTRACT ADDRESSES
// =============================================================================
const VOT_REGISTRY_ADDRESS = process.env.VOT_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000'; // Deploy and set!
const VOT_NFT_ADDRESS = '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9'; // MCPVOT_BUILDER_NFT

// VOTRegistry ABI (minimal for contenthash lookup)
const VOT_REGISTRY_ABI = [
    {
        name: 'contenthash',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'bytes' }],
    },
    {
        name: 'resolveENS',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [
            { name: 'contenthash', type: 'bytes' },
            { name: 'exists', type: 'bool' },
        ],
    },
] as const;

// Base L2 client
const baseClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

// =============================================================================
// HELPER: Parse ENS subdomain from DNS-encoded name
// =============================================================================
function parseSubdomainFromDNSName(dnsName: `0x${string}`): { subdomain: string; domain: string } {
    // DNS encoding: length-prefixed labels
    // Example: "180.mcpvot.eth" = 0x03313830066d6370766f7403657468
    //          03 = length, 313830 = "180", 06 = length, 6d6370766f74 = "mcpvot", 03 = length, 657468 = "eth"
    
    const bytes = Buffer.from(dnsName.slice(2), 'hex');
    const labels: string[] = [];
    let i = 0;
    
    while (i < bytes.length && bytes[i] !== 0) {
        const len = bytes[i];
        if (len === 0 || i + len >= bytes.length) break;
        const label = bytes.slice(i + 1, i + 1 + len).toString('utf8');
        labels.push(label);
        i += len + 1;
    }
    
    // labels = ["180", "mcpvot", "eth"]
    const subdomain = labels.slice(0, -2).join('.'); // "180"
    const domain = labels.slice(-2).join('.'); // "mcpvot.eth"
    
    return { subdomain, domain };
}

// =============================================================================
// HELPER: Encode IPFS CID to ENS contenthash format (EIP-1577)
// =============================================================================
function encodeIPFSContenthash(cid: string): `0x${string}` {
    // EIP-1577 contenthash for IPFS:
    // 0xe3 (IPFS protocol) + 0x01 (CIDv1) + 0x70 (dag-pb) + multihash
    // For CIDv0 (Qm...): 0xe3 01 70 12 20 <sha256>
    
    if (cid.startsWith('Qm')) {
        // CIDv0: base58 encoded sha256 multihash
        // For simplicity, construct the contenthash manually
        // Format: 0xe3010170 + multihash (0x1220 + 32-byte SHA256)
        // We'll encode the CID as hex directly for the contenthash
        const hexCid = toHex(new TextEncoder().encode(cid));
        // Return IPFS namespace prefix + encoded CID
        return `0xe3010170${hexCid.slice(2)}` as `0x${string}`;
    } else if (cid.startsWith('bafy')) {
        // CIDv1: IPFS namespace + raw CID bytes
        const hexCid = toHex(new TextEncoder().encode(cid));
        return `0xe301${hexCid.slice(2)}` as `0x${string}`;
    }
    
    // Return as-is if already hex encoded
    return cid as `0x${string}`;
}

// =============================================================================
// HELPER: Sign gateway response for L1 verification
// =============================================================================
async function signGatewayResponse(
    requestHash: `0x${string}`,
    responseData: `0x${string}`,
    expiry: bigint
): Promise<`0x${string}`> {
    const signerKey = process.env.GATEWAY_SIGNER_KEY;
    if (!signerKey) {
        console.warn('[Gateway] No GATEWAY_SIGNER_KEY set - returning unsigned response');
        return '0x' as `0x${string}`;
    }
    
    const signer = privateKeyToAccount(signerKey as `0x${string}`);
    
    // EIP-712 style message hash
    const messageHash = keccak256(
        encodePacked(
            ['bytes32', 'bytes', 'uint64'],
            [requestHash, responseData, expiry]
        )
    );
    
    const signature = await signer.signMessage({ message: { raw: messageHash } });
    return signature;
}

// =============================================================================
// GET: Gateway info and status
// =============================================================================
export async function GET() {
    const registryConfigured = VOT_REGISTRY_ADDRESS !== '0x0000000000000000000000000000000000000000';
    
    return NextResponse.json({
        name: 'MCPVOT CCIP-Read Gateway',
        version: '1.0.0',
        description: 'Resolves *.mcpvot.eth ENS subdomains to IPFS contenthash via Base L2',
        eip: 'EIP-3668',
        chain: {
            name: 'Base',
            chainId: 8453,
            rpc: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
        },
        contracts: {
            VOTRegistry: VOT_REGISTRY_ADDRESS,
            VOTMachineNFT: VOT_NFT_ADDRESS,
        },
        status: {
            registryConfigured,
            signerConfigured: !!process.env.GATEWAY_SIGNER_KEY,
        },
        endpoints: {
            'GET /api/gateway': 'Gateway info (this endpoint)',
            'POST /api/gateway': 'CCIP-Read lookup { sender, data }',
            'GET /api/gateway/{tokenId}': 'Direct contenthash lookup',
        },
        documentation: 'https://docs.mcpvot.xyz/ccip-read',
    }, { headers: CORS_HEADERS });
}

// =============================================================================
// POST: CCIP-Read lookup (EIP-3668)
// =============================================================================
export async function POST(request: NextRequest) {
    const requestId = `gateway-${Date.now().toString(36)}`;
    
    try {
        const body = await request.json();
        const { sender, data } = body;
        
        console.log(`[${requestId}] CCIP-Read request from sender: ${sender}`);
        console.log(`[${requestId}] Calldata: ${data?.slice(0, 100)}...`);
        
        if (!data || typeof data !== 'string') {
            return NextResponse.json(
                { error: 'Missing calldata in request body' },
                { status: 400, headers: CORS_HEADERS }
            );
        }
        
        // Parse the calldata to extract the ENS name query
        // Standard ENS resolve() selector: 0x9061b923
        // resolve(bytes name, bytes data) => { bytes name (DNS encoded), bytes query }
        const calldata = data as `0x${string}`;
        
        let tokenId: bigint;
        
        // Method 1: Direct tokenId in path (simpler)
        const pathMatch = request.nextUrl.pathname.match(/\/gateway\/(\d+)$/);
        if (pathMatch) {
            tokenId = BigInt(pathMatch[1]);
        } else {
            // Method 2: Parse from ENS resolve calldata
            try {
                // Decode resolve(bytes name, bytes data)
                const decoded = decodeAbiParameters(
                    parseAbiParameters('bytes name, bytes data'),
                    `0x${calldata.slice(10)}` as `0x${string}` // Skip selector
                );
                
                const dnsName = decoded[0] as `0x${string}`;
                const { subdomain } = parseSubdomainFromDNSName(dnsName);
                
                // Parse subdomain as tokenId (e.g., "180" -> 180n)
                tokenId = BigInt(subdomain);
                console.log(`[${requestId}] Parsed tokenId from subdomain: ${tokenId}`);
            } catch (parseError) {
                console.error(`[${requestId}] Failed to parse calldata:`, parseError);
                return NextResponse.json(
                    { error: 'Failed to parse ENS calldata' },
                    { status: 400, headers: CORS_HEADERS }
                );
            }
        }
        
        // Query Base L2 VOTRegistry for contenthash
        console.log(`[${requestId}] Querying VOTRegistry for tokenId ${tokenId}...`);
        
        if (VOT_REGISTRY_ADDRESS === '0x0000000000000000000000000000000000000000') {
            // Registry not deployed - return mock data for testing
            console.warn(`[${requestId}] VOTRegistry not deployed - returning mock contenthash`);
            
            // Mock IPFS CID (would be real after registry deployment)
            const mockCid = `QmYourMockCidForToken${tokenId}`;
            const mockContenthash = encodeIPFSContenthash(mockCid);
            
            return NextResponse.json({
                data: mockContenthash,
                tokenId: tokenId.toString(),
                mock: true,
                note: 'VOTRegistry contract not yet deployed. Deploy and set VOT_REGISTRY_ADDRESS.',
            }, { headers: CORS_HEADERS });
        }
        
        // Query actual contract
        const contenthash = await baseClient.readContract({
            address: VOT_REGISTRY_ADDRESS as `0x${string}`,
            abi: VOT_REGISTRY_ABI,
            functionName: 'contenthash',
            args: [tokenId],
        });
        
        console.log(`[${requestId}] Contenthash for tokenId ${tokenId}: ${contenthash}`);
        
        if (!contenthash || contenthash === '0x') {
            return NextResponse.json(
                { error: `No contenthash found for tokenId ${tokenId}` },
                { status: 404, headers: CORS_HEADERS }
            );
        }
        
        // Sign response for L1 verification (trusted gateway mode)
        const requestHash = keccak256(calldata);
        const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour validity
        const signature = await signGatewayResponse(requestHash, contenthash as `0x${string}`, expiry);
        
        // Return EIP-3668 compatible response
        // The WildcardResolver will call resolveWithProof(response, extraData)
        const response = encodeAbiParameters(
            parseAbiParameters('bytes contenthash, uint64 expiry, bytes signature'),
            [contenthash as `0x${string}`, expiry, signature]
        );
        
        return NextResponse.json({
            data: response,
            raw: {
                contenthash,
                tokenId: tokenId.toString(),
                expiry: expiry.toString(),
            },
        }, { headers: CORS_HEADERS });
        
    } catch (error) {
        console.error(`[${requestId}] Gateway error:`, error);
        return NextResponse.json(
            { error: 'Gateway lookup failed', details: (error as Error).message },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}
