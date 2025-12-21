/**
 * IPFS Pin API Route
 * 
 * Pins HTML content to IPFS using multiple providers:
 * 1. MCP IPFS Server (local, fastest)
 * 2. Pinata (reliable, free tier)
 * 
 * Used by VOT Machine to pin generated NFT pages permanently
 */

import { NextResponse } from 'next/server';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET: API info
export async function GET() {
  return NextResponse.json({
    name: 'IPFS Pin API',
    version: '1.0.0',
    description: 'Pin content to IPFS for permanent decentralized storage',
    providers: ['mcp', 'pinata'],
    endpoints: {
      'POST': 'Pin content to IPFS',
    },
    requiredFields: {
      content: 'string - The HTML content to pin',
      name: 'string (optional) - Filename for the content',
    },
    returns: {
      success: 'boolean',
      cid: 'string - IPFS Content ID',
      url: 'string - ipfs:// URL',
      gateway: 'string - HTTP gateway URL',
      provider: 'string - Which provider was used',
    },
  }, { headers: corsHeaders });
}

// POST: Pin content to IPFS
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, name, metadata } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Content is required and must be a string',
      }, { status: 400, headers: corsHeaders });
    }

    // Generate filename
    const filename = name || `vot-machine-${Date.now()}.html`;
    let cid: string | null = null;
    let provider: string = 'none';

    // 1. Try MCP IPFS Server first (if available)
    const mcpUrl = process.env.IPFS_MCP_URL || 'http://localhost:3100';
    try {
      const mcpResponse = await fetch(`${mcpUrl}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, encrypt: false }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (mcpResponse.ok) {
        const mcpResult = await mcpResponse.json();
        if (mcpResult.cid) {
          cid = mcpResult.cid;
          provider = 'mcp';
          console.log('[IPFS Pin] Success via MCP:', cid);
        }
      }
    } catch {
      console.log('[IPFS Pin] MCP server unavailable, trying Pinata...');
    }

    // 2. Try Pinata if MCP failed
    if (!cid && process.env.PINATA_JWT) {
      try {
        // Use pinFileToIPFS for raw HTML
        const formData = new FormData();
        const blob = new Blob([content], { type: 'text/html' });
        formData.append('file', blob, filename);

        // Add metadata
        formData.append('pinataMetadata', JSON.stringify({
          name: filename,
          keyvalues: {
            type: 'vot-machine',
            timestamp: Date.now().toString(),
            ...(metadata || {}),
          },
        }));

        // Optional: Add pinning options
        formData.append('pinataOptions', JSON.stringify({
          cidVersion: 1, // Use CIDv1 for better compatibility
        }));

        const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PINATA_JWT}`,
          },
          body: formData,
        });

        if (pinataResponse.ok) {
          const pinataResult = await pinataResponse.json();
          cid = pinataResult.IpfsHash;
          provider = 'pinata';
          console.log('[IPFS Pin] Success via Pinata:', cid);
        } else {
          const errorText = await pinataResponse.text();
          console.error('[IPFS Pin] Pinata error:', errorText);
        }
      } catch (pinataError) {
        console.error('[IPFS Pin] Pinata failed:', pinataError);
      }
    }

    // 3. If all else fails, return error (no mock in production)
    if (!cid) {
      // Check if we have any providers configured
      const hasPinata = !!process.env.PINATA_JWT;
      const hasMcp = !!process.env.IPFS_MCP_URL;
      
      return NextResponse.json({
        success: false,
        error: 'Failed to pin to IPFS',
        details: {
          pinataConfigured: hasPinata,
          mcpConfigured: hasMcp,
          suggestion: !hasPinata ? 'Set PINATA_JWT environment variable' : 'Check Pinata API key validity',
        },
      }, { status: 500, headers: corsHeaders });
    }

    // Success!
    return NextResponse.json({
      success: true,
      cid,
      url: `ipfs://${cid}`,
      gateway: `https://gateway.pinata.cloud/ipfs/${cid}`,
      altGateways: [
        `https://ipfs.io/ipfs/${cid}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}`,
        `https://dweb.link/ipfs/${cid}`,
      ],
      provider,
      filename,
      contentLength: content.length,
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[IPFS Pin] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500, headers: corsHeaders });
  }
}
