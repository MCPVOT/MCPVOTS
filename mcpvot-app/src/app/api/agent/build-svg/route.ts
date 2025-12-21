import { OPENROUTER_MODELS, OpenRouterAgent, SVGGenerationRequest } from '@/lib/openrouter-agent';
import { NextRequest, NextResponse } from 'next/server';

/**
 * ENS SVG Site Builder API
 * POST /api/agent/build-svg
 * 
 * Takes template + user info → LLM enhancement → returns SVG
 * Supports: Gemini Pro (paid), KatCoder (free), Nemotron (free)
 */

// Initialize agent with environment config
const getAgent = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  
  // Check which model to use based on config
  const preferredModel = process.env.OPENROUTER_MODEL || 'google/gemini-3-pro-preview';
  
  return new OpenRouterAgent({
    apiKey,
    model: preferredModel as typeof OPENROUTER_MODELS[keyof typeof OPENROUTER_MODELS],
    fallbackModels: [
      OPENROUTER_MODELS.KAT_CODER,
      OPENROUTER_MODELS.NEMOTRON,
    ],
    temperature: 0.7,
    maxRetries: 3,
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const { templateId, templateSVG, userInfo, style, features } = body as Partial<SVGGenerationRequest>;
    
    if (!templateSVG) {
      return NextResponse.json(
        { error: 'templateSVG is required' },
        { status: 400 }
      );
    }
    
    if (!userInfo) {
      return NextResponse.json(
        { error: 'userInfo is required' },
        { status: 400 }
      );
    }
    
    // Initialize agent
    const agent = getAgent();
    
    // Generate enhanced SVG
    const result = await agent.generateSVG({
      templateId: templateId || 'custom',
      templateSVG,
      userInfo,
      style: style || 'cyberpunk',
      features: features || [],
    });
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'SVG generation failed',
          model: result.model,
        },
        { status: 500 }
      );
    }
    
    // Return successful result
    return NextResponse.json({
      success: true,
      svg: result.svg,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[API /agent/build-svg] Error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET - Health check and model info
export async function GET() {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        status: 'unconfigured',
        error: 'OPENROUTER_API_KEY not set',
        models: {
          available: Object.values(OPENROUTER_MODELS),
          primary: null,
          fallbacks: [],
        },
      });
    }
    
    const agent = getAgent();
    const health = await agent.checkHealth();
    const modelInfo = agent.getModelInfo();
    
    return NextResponse.json({
      status: health.available ? 'healthy' : 'degraded',
      models: {
        primary: modelInfo.primary,
        fallbacks: modelInfo.fallbacks,
        available: health.models,
      },
      pricing: {
        [OPENROUTER_MODELS.GEMINI_PRO]: '$0.00025/1K tokens',
        [OPENROUTER_MODELS.GPT_CODEX]: '$0.0003/1K tokens',
        [OPENROUTER_MODELS.KAT_CODER]: 'FREE',
        [OPENROUTER_MODELS.NEMOTRON]: 'FREE',
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}
