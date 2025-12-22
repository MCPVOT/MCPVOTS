/**
 * API Route: GET /api/beeper/nft/[tokenId]/image
 * 
 * Returns the SVG image for a BEEPER NFT directly
 * Uses ERC-4804 on-chain data
 */

import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const BEEPER_CONTRACT = process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9';

const BEEPER_ABI = parseAbi([
  'function uri(uint256 tokenId) view returns (string)',
  'function getSvgData(uint256 tokenId) view returns (string)',
]);

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId: tokenIdStr } = await params;
    const tokenId = BigInt(tokenIdStr);

    // Try to get SVG data directly from contract
    let svgData = '';
    try {
      svgData = await client.readContract({
        address: BEEPER_CONTRACT as `0x${string}`,
        abi: BEEPER_ABI,
        functionName: 'getSvgData',
        args: [tokenId],
      });
    } catch {
      // getSvgData may not exist
    }

    // If direct SVG available, return it
    if (svgData && svgData.includes('<svg')) {
      return new NextResponse(svgData, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Fallback: Parse from tokenURI
    try {
      const tokenUri = await client.readContract({
        address: BEEPER_CONTRACT as `0x${string}`,
        abi: BEEPER_ABI,
        functionName: 'uri',
        args: [tokenId],
      });

      // Handle base64 JSON
      if (tokenUri.startsWith('data:application/json;base64,')) {
        const base64Data = tokenUri.replace('data:application/json;base64,', '');
        const metadata = JSON.parse(Buffer.from(base64Data, 'base64').toString());
        
        if (metadata.image?.startsWith('data:image/svg+xml;base64,')) {
          const svgBase64 = metadata.image.replace('data:image/svg+xml;base64,', '');
          const svg = Buffer.from(svgBase64, 'base64').toString();
          
          return new NextResponse(svg, {
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      }
    } catch (e) {
      console.error('Error parsing tokenURI:', e);
    }

    return NextResponse.json(
      { error: 'SVG not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error in image API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
