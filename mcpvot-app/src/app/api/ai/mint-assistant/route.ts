/**
 * AI Mint Assistant API Route
 * 
 * POST /api/ai/mint-assistant
 * 
 * Provides AI-powered assistance for the VOT Machine BeeperNFT V2 minting process.
 * Uses free OpenRouter models with automatic fallback.
 */

import {
    AI_MINT_MODELS,
    chatWithMintAssistant,
    explainRarityTier,
    generateMintRecommendation,
    troubleshootMint,
    type MintAssistantMessage,
} from '@/lib/ai-mint-assistant';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting (simple in-memory, replace with Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a minute.' },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const { action, messages, context, errorDetails, tier, userProfile } = body;
    
    switch (action) {
      case 'chat': {
        if (!messages || !Array.isArray(messages)) {
          return NextResponse.json(
            { error: 'Missing or invalid messages array' },
            { status: 400 }
          );
        }
        
        const result = await chatWithMintAssistant(
          messages as MintAssistantMessage[],
          context
        );
        
        return NextResponse.json(result);
      }
      
      case 'troubleshoot': {
        if (!errorDetails) {
          return NextResponse.json(
            { error: 'Missing errorDetails for troubleshooting' },
            { status: 400 }
          );
        }
        
        const result = await troubleshootMint(errorDetails);
        return NextResponse.json(result);
      }
      
      case 'explain-tier': {
        if (!tier) {
          return NextResponse.json(
            { error: 'Missing tier parameter' },
            { status: 400 }
          );
        }
        
        const result = await explainRarityTier(tier);
        return NextResponse.json(result);
      }
      
      case 'recommend': {
        const result = await generateMintRecommendation(userProfile || {});
        return NextResponse.json(result);
      }
      
      case 'models': {
        // Return available models info
        return NextResponse.json({
          success: true,
          models: AI_MINT_MODELS,
          note: 'All models are FREE tier with automatic fallback',
        });
      }
      
      default:
        return NextResponse.json(
          { 
            error: 'Invalid action. Valid actions: chat, troubleshoot, explain-tier, recommend, models',
            availableActions: ['chat', 'troubleshoot', 'explain-tier', 'recommend', 'models'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[AI Mint Assistant API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'AI Mint Assistant',
    version: '2.0.0',
    description: 'AI-powered assistance for VOT Machine BeeperNFT V2 minting',
    endpoints: {
      'POST /api/ai/mint-assistant': {
        actions: {
          chat: {
            description: 'Chat with the AI assistant',
            body: { action: 'chat', messages: [{ role: 'user', content: 'string' }], context: 'optional' },
          },
          troubleshoot: {
            description: 'Troubleshoot a failed mint',
            body: { action: 'troubleshoot', errorDetails: { errorMessage: 'string', transactionHash: 'optional' } },
          },
          'explain-tier': {
            description: 'Explain a VRF rarity tier',
            body: { action: 'explain-tier', tier: 'NODE|VALIDATOR|WHALE|OG|GENESIS|ZZZ|FOMO|GM|X402' },
          },
          recommend: {
            description: 'Get personalized mint recommendation',
            body: { action: 'recommend', userProfile: 'optional' },
          },
          models: {
            description: 'Get available AI models info',
            body: { action: 'models' },
          },
        },
      },
    },
    models: {
      primary: 'MiMo-V2-Flash (Xiaomi)',
      fallbacks: ['Devstral 2 (Mistral)', 'DeepSeek V3.1 Nex-N1', 'KAT-Coder-Pro'],
      cost: 'FREE',
    },
  });
}
