/**
 * SVG Machine Generate API
 * 
 * Main endpoint for generating VOT Machine NFT HTML pages
 * Supports both preview and IPFS pinning modes
 */

import type { VOTCategory, VOTHTMLConfig } from '@/lib/svg-machine/templates/types';
import { fetchAllUserData } from '@/lib/svg-machine/templates/user-data-fetcher';
import { generateVOTHTMLPage } from '@/lib/svg-machine/templates/vot-html-page';
import { NextResponse } from 'next/server';

// CORS headers for IPFS compatibility
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
    name: 'VOT Machine Generate API',
    version: '1.0.0',
    description: 'Generate personalized HTML landing pages for VOT Machine NFTs',
    endpoints: {
      'POST': 'Generate HTML page',
    },
    categories: [
      'vot', 'warplet', 'ens', 'defi', 'gaming', 'minimal', 
      'maxx', 'farcaster', 'base', 'burn', 'x402', 'mcpvot', 
      'ai', 'cyberpunk', 'quantum'
    ],
    output_modes: ['preview', 'ipfs'],
  }, { headers: corsHeaders });
}

// POST: Generate HTML page
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      // User identification
      address,
      ensName,
      baseName,
      farcasterUsername,
      
      // Generation config
      category = 'vot' as VOTCategory,
      templateId,
      customPrompt,
      output = 'preview', // 'preview' | 'ipfs'
      
      // General info (for backwards compatibility with ens-machine)
      generalInfo,
      socialLinks,
      customHtml,
      
      // Payment proof (for x402)
      payment,
    } = body;

    // Validate required fields
    if (!address && !ensName && !baseName) {
      return NextResponse.json({
        success: false,
        error: 'At least one identifier required: address, ensName, or baseName',
      }, { status: 400, headers: corsHeaders });
    }

    // Fetch user data from blockchain/APIs
    const userAddress = address || '0x0000000000000000000000000000000000000000';
    const userData = await fetchAllUserData(userAddress, {
      ensName: ensName || generalInfo?.ensName,
      basename: baseName || generalInfo?.basename,
      farcasterUsername: farcasterUsername || socialLinks?.farcaster,
    });

    // Build config for HTML generation
    const config: VOTHTMLConfig = {
      category: category as VOTCategory,
      tokenId: Date.now(), // Use timestamp as temporary tokenId for preview
      userData: {
        ...userData,
        // Override with provided data if available
        ensName: ensName || userData.ensName,
        basename: baseName || userData.basename,
        farcasterUsername: farcasterUsername || userData.farcasterUsername,
      },
      customPrompt: customPrompt || generalInfo?.bio,
    };

    // Generate the HTML page
    const htmlPage = await generateVOTHTMLPage(config);

    // If output is 'preview', return the HTML directly
    if (output === 'preview') {
      return NextResponse.json({
        success: true,
        output: 'preview',
        html: htmlPage,
        htmlLength: htmlPage.length,
        category,
        userData: config.userData,
      }, { headers: corsHeaders });
    }

    // If output is 'ipfs', pin to IPFS and return CID
    if (output === 'ipfs') {
      // Try MCP IPFS first, then Pinata fallback
      let ipfsCid: string | null = null;
      let ipfsMethod: string = 'none';

      try {
        // Try MCP IPFS pinning
        const mcpResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ipfs/pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: htmlPage,
            name: `vot-machine-${category}-${Date.now()}.html`,
          }),
        });

        if (mcpResponse.ok) {
          const mcpResult = await mcpResponse.json();
          if (mcpResult.cid) {
            ipfsCid = mcpResult.cid;
            ipfsMethod = 'mcp';
          }
        }
      } catch (mcpError) {
        console.log('MCP IPFS unavailable, trying Pinata...');
      }

      // Pinata fallback - pin as actual HTML file (not JSON wrapped)
      if (!ipfsCid && process.env.PINATA_JWT) {
        try {
          // Create FormData with the HTML file
          const formData = new FormData();
          const htmlBlob = new Blob([htmlPage], { type: 'text/html' });
          const filename = `vot-machine-${category}-${Date.now()}.html`;
          formData.append('file', htmlBlob, filename);
          
          // Add metadata
          formData.append('pinataMetadata', JSON.stringify({
            name: filename,
            keyvalues: {
              category,
              type: 'vot-machine',
              timestamp: Date.now().toString(),
            },
          }));

          const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.PINATA_JWT}`,
              // Don't set Content-Type - let fetch set it for FormData
            },
            body: formData,
          });

          if (pinataResponse.ok) {
            const pinataResult = await pinataResponse.json();
            ipfsCid = pinataResult.IpfsHash;
            ipfsMethod = 'pinata';
          } else {
            const errorText = await pinataResponse.text();
            console.error('Pinata response error:', errorText);
          }
        } catch (pinataError) {
          console.error('Pinata pinning failed:', pinataError);
        }
      }

      if (!ipfsCid) {
        return NextResponse.json({
          success: false,
          error: 'Failed to pin to IPFS (both MCP and Pinata unavailable)',
          html: htmlPage, // Return HTML anyway for debugging
        }, { status: 500, headers: corsHeaders });
      }

      return NextResponse.json({
        success: true,
        output: 'ipfs',
        cid: ipfsCid,
        ipfsUrl: `ipfs://${ipfsCid}`,
        gatewayUrl: `https://ipfs.io/ipfs/${ipfsCid}`,
        method: ipfsMethod,
        htmlLength: htmlPage.length,
        category,
        userData: config.userData,
      }, { headers: corsHeaders });
    }

    // Unknown output mode
    return NextResponse.json({
      success: false,
      error: `Unknown output mode: ${output}. Use 'preview' or 'ipfs'.`,
    }, { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error('SVG Machine Generate Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500, headers: corsHeaders });
  }
}
