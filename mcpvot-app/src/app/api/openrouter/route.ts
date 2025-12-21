/**
 * OpenRouter Unified API
 * 
 * GET  /api/openrouter - Service info & model list
 * POST /api/openrouter - Unified LLM endpoint
 * 
 * This centralizes ALL OpenRouter calls through one endpoint.
 * Uses: src/lib/openrouter-service.ts
 * 
 * Actions:
 * - generate_html: Generate HTML for VOT Machine
 * - generate_svg: Generate SVG NFT card
 * - enhance_template: Enhance existing template
 * - profile_analysis: Analyze user profile
 * - generate_bio: Create personalized bio
 * - generate_boot: Boot sequence messages
 * - generate_tagline: Unique cyberpunk tagline
 * - full_uniqueness: Complete VOT Machine uniqueness package
 */

import { AI_MODELS, API_VERSION, ECOSYSTEM_INFO } from '@/lib/constants';
import {
    callOpenRouter,
    enhanceSVGTemplate,
    enhanceTemplate,
    generateBio,
    generateBootSequence,
    generateCustomCSS,
    generateIPFSContent,
    generateUniqueTagline,
    generateVOTMachineUniqueness,
    getAvailableModels,
    isOpenRouterConfigured,
    type LLMRequest,
    type TemplateCategory,
    type VOTMachineContext,
} from '@/lib/openrouter-service';
import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// TYPES
// =============================================================================

type ActionType = 
  | 'generate_html'
  | 'generate_svg'
  | 'enhance_template'
  | 'profile_analysis'
  | 'generate_bio'
  | 'generate_boot'
  | 'generate_tagline'
  | 'full_uniqueness'
  | 'custom_css'
  | 'raw'; // Direct LLM call

interface OpenRouterRequest {
  action: ActionType;
  
  // For template generation/enhancement
  prompt?: string;
  baseTemplate?: string;
  category?: TemplateCategory;
  
  // For profile analysis
  profile?: {
    address: string;
    displayName: string;
    basename?: string;
    ensName?: string;
    farcasterUsername?: string;
    farcasterFid?: number;
    farcasterBio?: string;
    farcasterFollowers?: number;
    votBalance: string;
    maxxBalance: string;
    hasWarpletNFT: boolean;
    badges?: Array<{
      id: string;
      name: string;
      emoji: string;
      tier?: string;
    }>;
  };
  
  // For VOT Machine uniqueness
  machineContext?: VOTMachineContext;
  
  // Model preference
  model?: 'fast' | 'coder' | 'quality';
  
  // Raw LLM request (for action='raw')
  llmRequest?: LLMRequest;
}

interface OpenRouterResponse {
  success: boolean;
  action: string;
  data?: {
    content?: string;
    html?: string;
    svg?: string;
    css?: string;
    analysis?: string;
    bio?: string;
    tagline?: string;
    bootSequence?: string[];
    uniqueness?: Awaited<ReturnType<typeof generateVOTMachineUniqueness>>;
  };
  model?: string;
  tokensUsed?: number;
  fallbackUsed?: boolean;
  error?: string;
}

// =============================================================================
// PROFILE ANALYSIS SYSTEM PROMPT
// =============================================================================

const PROFILE_ANALYSIS_PROMPT = `You are the VOT Machine AI - an expert in blockchain identity and Web3 social graphs.

Analyze the provided user profile and return insights in this JSON format:
{
  "standing": "newcomer|active|whale|og",
  "summary": "2-3 sentence identity summary",
  "strengths": ["list", "of", "strengths"],
  "suggestion": "One actionable tip to improve standing",
  "engagementScore": 0-100
}

Badge Tiers (prestige order):
- Diamond (💎): 1M+ VOT
- Whale (🐋): 500K+ VOT
- Holder (🪙): 10K+ VOT
- Warplet OG (🏆): Has Warplet NFT
- MAXX OG (⭐): 100K+ MAXX
- Farcaster Power (🟣): 1K+ followers

Be concise, Web3-native, and encouraging.`;

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<OpenRouterResponse>> {
  try {
    // Check configuration
    if (!isOpenRouterConfigured()) {
      return NextResponse.json({
        success: false,
        action: 'error',
        error: 'OpenRouter API key not configured',
      }, { status: 503 });
    }
    
    const body = await request.json() as OpenRouterRequest;
    
    if (!body.action) {
      return NextResponse.json({
        success: false,
        action: 'error',
        error: 'Action is required',
      }, { status: 400 });
    }
    
    let result: OpenRouterResponse;
    
    switch (body.action) {
      // =========== TEMPLATE GENERATION ===========
      case 'generate_html': {
        if (!body.prompt) {
          return NextResponse.json({
            success: false,
            action: body.action,
            error: 'Prompt required for HTML generation',
          }, { status: 400 });
        }
        
        const llmResult = await generateIPFSContent('html', body.prompt, body.baseTemplate);
        result = {
          success: llmResult.success,
          action: body.action,
          data: { html: llmResult.content },
          model: llmResult.model,
          tokensUsed: llmResult.tokensUsed,
        };
        break;
      }
      
      case 'generate_svg': {
        if (!body.prompt) {
          return NextResponse.json({
            success: false,
            action: body.action,
            error: 'Prompt required for SVG generation',
          }, { status: 400 });
        }
        
        const llmResult = await generateIPFSContent('svg', body.prompt, body.baseTemplate);
        result = {
          success: llmResult.success,
          action: body.action,
          data: { svg: llmResult.content },
          model: llmResult.model,
          tokensUsed: llmResult.tokensUsed,
        };
        break;
      }
      
      case 'enhance_template': {
        if (!body.prompt || !body.baseTemplate) {
          return NextResponse.json({
            success: false,
            action: body.action,
            error: 'Prompt and baseTemplate required',
          }, { status: 400 });
        }
        
        const isSVG = body.baseTemplate.trim().startsWith('<svg');
        const llmResult = isSVG
          ? await enhanceSVGTemplate(body.baseTemplate, body.prompt, body.category || 'vot')
          : await enhanceTemplate(body.baseTemplate, body.prompt);
        
        result = {
          success: llmResult.success,
          action: body.action,
          data: { content: llmResult.content },
          model: llmResult.model,
          tokensUsed: llmResult.tokensUsed,
          fallbackUsed: llmResult.fallbackUsed,
        };
        break;
      }
      
      // =========== PROFILE ANALYSIS ===========
      case 'profile_analysis': {
        if (!body.profile) {
          return NextResponse.json({
            success: false,
            action: body.action,
            error: 'Profile required for analysis',
          }, { status: 400 });
        }
        
        const profileContext = `
Address: ${body.profile.address}
Display Name: ${body.profile.displayName}
${body.profile.basename ? `Basename: ${body.profile.basename}` : ''}
${body.profile.ensName ? `ENS: ${body.profile.ensName}` : ''}
${body.profile.farcasterUsername ? `Farcaster: @${body.profile.farcasterUsername} (FID: ${body.profile.farcasterFid})` : ''}
${body.profile.farcasterFollowers ? `Followers: ${body.profile.farcasterFollowers}` : ''}
VOT Balance: ${body.profile.votBalance}
MAXX Balance: ${body.profile.maxxBalance}
Warplet NFT: ${body.profile.hasWarpletNFT ? 'Yes' : 'No'}
Badges: ${body.profile.badges?.map(b => `${b.emoji} ${b.name}`).join(', ') || 'None'}
`;
        
        const llmResult = await callOpenRouter({
          prompt: `${PROFILE_ANALYSIS_PROMPT}\n\n--- USER PROFILE ---\n${profileContext}\n\nAnalyze and return JSON.`,
          taskType: 'generate_bio',
          modelPreference: body.model || 'quality',
        });
        
        result = {
          success: llmResult.success,
          action: body.action,
          data: { analysis: llmResult.content },
          model: llmResult.model,
          tokensUsed: llmResult.tokensUsed,
        };
        break;
      }
      
      // =========== BIO GENERATION ===========
      case 'generate_bio': {
        const llmResult = await generateBio(
          body.prompt || 'Generate a Web3 builder bio',
          body.profile ? {
            ensName: body.profile.ensName || body.profile.basename,
          } : undefined
        );
        
        result = {
          success: llmResult.success,
          action: body.action,
          data: { bio: llmResult.content },
          model: llmResult.model,
          tokensUsed: llmResult.tokensUsed,
        };
        break;
      }
      
      // =========== VOT MACHINE SPECIFIC ===========
      case 'generate_tagline': {
        if (!body.machineContext) {
          return NextResponse.json({
            success: false,
            action: body.action,
            error: 'machineContext required',
          }, { status: 400 });
        }
        
        const tagline = await generateUniqueTagline(body.machineContext);
        result = {
          success: true,
          action: body.action,
          data: { tagline },
        };
        break;
      }
      
      case 'generate_boot': {
        if (!body.machineContext) {
          return NextResponse.json({
            success: false,
            action: body.action,
            error: 'machineContext required',
          }, { status: 400 });
        }
        
        const bootSequence = await generateBootSequence(body.machineContext);
        result = {
          success: true,
          action: body.action,
          data: { bootSequence },
        };
        break;
      }
      
      case 'full_uniqueness': {
        if (!body.machineContext) {
          return NextResponse.json({
            success: false,
            action: body.action,
            error: 'machineContext required',
          }, { status: 400 });
        }
        
        const uniqueness = await generateVOTMachineUniqueness(body.machineContext);
        result = {
          success: true,
          action: body.action,
          data: { uniqueness },
        };
        break;
      }
      
      // =========== CUSTOM CSS ===========
      case 'custom_css': {
        if (!body.prompt) {
          return NextResponse.json({
            success: false,
            action: body.action,
            error: 'Prompt required',
          }, { status: 400 });
        }
        
        const llmResult = await generateCustomCSS(body.prompt);
        result = {
          success: llmResult.success,
          action: body.action,
          data: { css: llmResult.content },
          model: llmResult.model,
          tokensUsed: llmResult.tokensUsed,
        };
        break;
      }
      
      // =========== RAW LLM CALL ===========
      case 'raw': {
        if (!body.llmRequest) {
          return NextResponse.json({
            success: false,
            action: body.action,
            error: 'llmRequest required for raw calls',
          }, { status: 400 });
        }
        
        const llmResult = await callOpenRouter(body.llmRequest);
        result = {
          success: llmResult.success,
          action: body.action,
          data: { content: llmResult.content },
          model: llmResult.model,
          tokensUsed: llmResult.tokensUsed,
          fallbackUsed: llmResult.fallbackUsed,
          error: llmResult.error,
        };
        break;
      }
      
      default:
        return NextResponse.json({
          success: false,
          action: body.action,
          error: `Unknown action: ${body.action}`,
        }, { status: 400 });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[OpenRouter API] Error:', error);
    return NextResponse.json({
      success: false,
      action: 'error',
      error: error instanceof Error ? error.message : 'Internal error',
    }, { status: 500 });
  }
}

// =============================================================================
// GET - Service Info
// =============================================================================

export async function GET(): Promise<NextResponse> {
  const models = getAvailableModels();
  const configured = isOpenRouterConfigured();
  
  return NextResponse.json({
    service: 'MCPVOT OpenRouter API',
    version: API_VERSION,
    status: configured ? 'ready' : 'api_key_missing',
    
    models: {
      recommended: AI_MODELS.PRIMARY,
      free: models.free,
      fallbackChain: AI_MODELS.FREE_CHAIN,
      note: 'Alpha uses FREE models. All models have fallback chain for reliability.',
    },
    
    actions: {
      generate_html: 'Generate complete HTML page for IPFS',
      generate_svg: 'Generate SVG NFT card',
      enhance_template: 'Enhance existing HTML/SVG template',
      profile_analysis: 'Analyze user Web3 profile',
      generate_bio: 'Create personalized bio',
      generate_tagline: 'Unique cyberpunk tagline',
      generate_boot: 'Boot sequence messages',
      full_uniqueness: 'Complete VOT Machine uniqueness package',
      custom_css: 'Generate custom CSS snippet',
      raw: 'Direct LLM call with full control',
    },
    
    usage: {
      endpoint: 'POST /api/openrouter',
      example: {
        action: 'generate_tagline',
        machineContext: {
          tokenId: 42,
          ensName: 'vitalik.eth',
          votBalance: 100000,
          rank: 'ARCHITECT',
          isWarpletHolder: true,
          category: 'vot',
        },
      },
    },
    
    relatedEndpoints: [
      '/api/machine/generate - Full NFT generation + IPFS',
      '/api/machine/ai - AI profile analysis & uniqueness',
      '/api/svg-machine/generate - SVG Machine generation',
      '/api/svg-machine/enhance - Template enhancement',
    ],
    
    ecosystem: ECOSYSTEM_INFO,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache GET for 1 hour
    },
  });
}
