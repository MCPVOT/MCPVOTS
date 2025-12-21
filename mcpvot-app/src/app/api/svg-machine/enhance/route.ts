/**
 * SVG Machine - LLM Enhancement API
 * 
 * POST /api/svg-machine/enhance
 * 
 * Uses OpenRouter FREE models to enhance templates based on user prompts.
 * 
 * ALPHA V1 Models (FREE):
 * - x-ai/grok-4.1-fast:free (fastest)
 * - kwaipilot/kat-coder-pro:free (best for code)
 * - nvidia/llama-3.1-nemotron-ultra-253b:free (best quality)
 * 
 * FUTURE: Paid upgrade path for GPT-4, Claude, etc.
 */

import {
    callOpenRouter,
    getAvailableModels,
    isOpenRouterConfigured,
    ModelType,
    TaskType,
} from '@/lib/openrouter-service';
import { NextRequest, NextResponse } from 'next/server';

export interface EnhanceRequest {
  // What the user wants
  prompt: string;
  
  // Type of enhancement
  taskType: TaskType;
  
  // Optional model preference
  modelPreference?: ModelType;
  
  // Base template to enhance (for enhance_design task)
  baseTemplate?: string;
  
  // Context for better results
  context?: {
    ensName?: string;
    edition?: 'base' | 'warplet' | 'ethermax';
    colors?: { primary?: string; secondary?: string };
  };
}

export interface EnhanceResponse {
  success: boolean;
  data?: {
    content: string;
    model: string;
    tokensUsed?: number;
  };
  error?: string;
  availableModels?: ReturnType<typeof getAvailableModels>;
}

export async function POST(request: NextRequest): Promise<NextResponse<EnhanceResponse>> {
  try {
    // Check if OpenRouter is configured
    if (!isOpenRouterConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'OpenRouter API key not configured. LLM enhancement unavailable.',
        availableModels: getAvailableModels(),
      }, { status: 503 });
    }
    
    const body = await request.json() as EnhanceRequest;
    
    // Validate request
    if (!body.prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required',
      }, { status: 400 });
    }
    
    if (!body.taskType) {
      return NextResponse.json({
        success: false,
        error: 'Task type is required (enhance_design, generate_bio, custom_css, full_template)',
      }, { status: 400 });
    }
    
    console.log('[SVG Machine Enhance] Request:', {
      taskType: body.taskType,
      promptLength: body.prompt.length,
      hasTemplate: !!body.baseTemplate,
      edition: body.context?.edition,
    });
    
    // Call OpenRouter
    const result = await callOpenRouter({
      prompt: body.prompt,
      taskType: body.taskType,
      modelPreference: body.modelPreference,
      baseTemplate: body.baseTemplate,
      context: body.context,
    });
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'LLM enhancement failed',
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        content: result.content!,
        model: result.model,
        tokensUsed: result.tokensUsed,
      },
    });
    
  } catch (error) {
    console.error('[SVG Machine Enhance] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Enhancement failed',
    }, { status: 500 });
  }
}

// GET - Info about available models and configuration
export async function GET(): Promise<NextResponse> {
  const configured = isOpenRouterConfigured();
  const models = getAvailableModels();
  
  return NextResponse.json({
    service: 'SVG Machine LLM Enhancement',
    version: 'Alpha V1',
    configured,
    models,
    taskTypes: [
      { type: 'enhance_design', description: 'Enhance HTML template with custom styling' },
      { type: 'generate_bio', description: 'Generate a Web3 builder bio' },
      { type: 'custom_css', description: 'Generate custom CSS based on prompt' },
      { type: 'full_template', description: 'Generate complete HTML page' },
    ],
    usage: {
      note: 'Alpha V1 uses FREE OpenRouter models',
      upgrade: 'Paid models (GPT-4, Claude) available in future versions',
      rateLimit: 'Free models have rate limits - use responsibly',
    },
    example: {
      method: 'POST',
      body: {
        prompt: 'Make it more cyberpunk with neon pink accents and glitch effects',
        taskType: 'enhance_design',
        baseTemplate: '<!DOCTYPE html>...',
        context: {
          ensName: 'mcpvot.base.eth',
          edition: 'base',
          colors: { primary: '#00ffcc', secondary: '#ff6600' },
        },
      },
    },
  });
}
