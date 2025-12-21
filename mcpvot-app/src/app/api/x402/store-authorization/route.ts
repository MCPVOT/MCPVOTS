/**
 * x402 Store Authorization API
 * 
 * Stores EIP-7702 authorizations in MCP memory for LLM agent retrieval
 * This enables AI agents to execute transactions on behalf of users
 * 
 * VOT Glyph: 𒁲𒇷 (delegate) + 𒃲 (mcp) + 𒂅 (memory)
 */

import { NextRequest, NextResponse } from 'next/server';

interface AuthorizationRequest {
  userAddress: `0x${string}`;
  authorization: {
    chainId: string;
    address: `0x${string}`;
    nonce: number;
    signature: `0x${string}`;
  };
  scope: 'mint' | 'swap' | 'full';
  expiresAt: number;
}

// In-memory store (replace with MCP memory in production)
const authorizationStore = new Map<string, AuthorizationRequest>();

export async function POST(request: NextRequest) {
  try {
    const body: AuthorizationRequest = await request.json();
    
    // Validate required fields
    if (!body.userAddress || !body.authorization || !body.scope) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, authorization, scope' },
        { status: 400 }
      );
    }
    
    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.userAddress)) {
      return NextResponse.json(
        { error: 'Invalid userAddress format' },
        { status: 400 }
      );
    }
    
    // Validate authorization signature exists
    if (!body.authorization.signature) {
      return NextResponse.json(
        { error: 'Missing authorization signature' },
        { status: 400 }
      );
    }
    
    // Store authorization
    const key = body.userAddress.toLowerCase();
    const memoryId = `auth_${Date.now()}_${key.slice(2, 10)}`;
    
    authorizationStore.set(key, {
      ...body,
      userAddress: body.userAddress.toLowerCase() as `0x${string}`,
    });
    
    // In production, store in MCP memory:
    // await mcpMemory.storeMemory({
    //   content: JSON.stringify(body),
    //   vector: generateVector(body),
    //   category: 'eip7702_authorization',
    //   metadata: {
    //     userAddress: body.userAddress,
    //     scope: body.scope,
    //     expiresAt: body.expiresAt,
    //   }
    // });
    
    console.log(`[x402] Stored authorization for ${body.userAddress}, scope: ${body.scope}`);
    
    return NextResponse.json({
      success: true,
      memoryId,
      message: `Authorization stored for LLM agent access`,
      expiresAt: body.expiresAt,
      scope: body.scope,
    });
    
  } catch (error) {
    console.error('[x402] Store authorization error:', error);
    return NextResponse.json(
      { error: 'Failed to store authorization' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  
  if (!address) {
    return NextResponse.json(
      { error: 'Missing address parameter' },
      { status: 400 }
    );
  }
  
  const key = address.toLowerCase();
  const stored = authorizationStore.get(key);
  
  if (!stored) {
    return NextResponse.json({
      hasAuthorization: false,
    });
  }
  
  // Check if expired
  if (stored.expiresAt && Date.now() > stored.expiresAt) {
    authorizationStore.delete(key);
    return NextResponse.json({
      hasAuthorization: false,
      reason: 'expired',
    });
  }
  
  return NextResponse.json({
    hasAuthorization: true,
    scope: stored.scope,
    expiresAt: stored.expiresAt,
    chainId: stored.authorization.chainId,
  });
}

// Export store for other API routes
export { authorizationStore };
