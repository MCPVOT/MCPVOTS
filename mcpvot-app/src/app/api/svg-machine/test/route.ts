/**
 * SVG Machine Test API
 * 
 * Test endpoint for validating the SVG → IPFS → Metadata pipeline
 */

import { prepareMint, type MintRequest } from '@/lib/svg-machine/nft-metadata-service';
import { generateRandomSVG, generateSVG, listTemplates } from '@/lib/svg-machine/svg-generator';
import type { SVGUserData as UserData } from '@/lib/svg-machine/types';
import { NextResponse } from 'next/server';

// GET: List available templates
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const action = searchParams.get('action');

  if (action === 'list') {
    const templates = listTemplates(category || undefined);
    return NextResponse.json({
      count: templates.length,
      category: category || 'all',
      templates,
    });
  }

  // Default: return API info
  return NextResponse.json({
    name: 'SVG Machine Test API',
    version: '2.2.0',
    endpoints: {
      'GET ?action=list': 'List available templates',
      'GET ?action=list&category=mcpvot': 'List templates by category',
      'POST': 'Test SVG generation and pipeline',
    },
    categories: [
      'base', 'defi', 'ens', 'farcaster', 'gaming',
      'maxx', 'mcpvot', 'minimal', 'vot', 'warplet'
    ],
  });
}

// POST: Test SVG generation and optionally full pipeline
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      templateId,
      userAddress = '0x0000000000000000000000000000000000000000',
      userData,
      runPipeline = false, // Set to true to run full IPFS pipeline
      enhanceWithLLM = false,
      random = false,
    } = body;

    // Build user data
    const svgUserData: UserData = userData || {
      address: userAddress,
      ensName: null,
      basename: null,
      farcasterUsername: null,
      farcasterFid: null,
      holdings: {
        vot: 100000,
        maxx: 50000,
        eth: 0.5,
      },
      rank: 'CIRCUIT',
      level: 3,
    };

    let result: {
      success: boolean;
      templateId: string;
      svg?: string;
      svgLength?: number;
      pipeline?: unknown;
      error?: string;
    };

    if (random) {
      // Generate random template
      const { svg, templateId: randomId } = await generateRandomSVG(
        svgUserData,
        templateId // templateId here is used as category filter
      );

      result = {
        success: true,
        templateId: randomId,
        svg,
        svgLength: svg.length,
      };
    } else if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required (or set random=true)' },
        { status: 400 }
      );
    } else {
      // Generate specific template
      const svg = await generateSVG(templateId, svgUserData, {
        enhanceWithLLM,
      });

      result = {
        success: true,
        templateId,
        svg,
        svgLength: svg.length,
      };
    }

    // Optionally run full pipeline
    if (runPipeline && result.svg) {
      console.log('[SVG Machine Test] Running full pipeline...');
      
      const mintRequest: MintRequest = {
        userData: {
          address: svgUserData.address,
          ensName: svgUserData.ensName || undefined,
          basename: svgUserData.basename || undefined,
          farcasterUsername: svgUserData.farcasterUsername || undefined,
          displayName: svgUserData.ensName || svgUserData.basename || 
            `${svgUserData.address.slice(0, 6)}...${svgUserData.address.slice(-4)}`,
          rank: svgUserData.rank || 'GHOST',
          holdings: {
            vot: svgUserData.holdings?.vot || 0,
            maxx: svgUserData.holdings?.maxx || 0,
            eth: svgUserData.holdings?.eth || 0,
          },
        },
        templateId: result.templateId,
        templateCategory: 'mcpvot',
        svgContent: result.svg,
      };

      const pipelineResult = await prepareMint(mintRequest);

      result.pipeline = pipelineResult;
      
      // Don't return full SVG if pipeline ran (to save response size)
      delete result.svg;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[SVG Machine Test] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
