/**
 * OpenRouter AI Agent for ENS SVG Site Builder
 * 
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  MCPVOT x402 AUTONOMOUS AGENT SYSTEM                         ║
 * ║  DeepSeek (free) | Devstral (free) | KAT-Coder (free)        ║
 * ║  Template → LLM Enhancement → SVG → IPFS → ERC-1155 NFT      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// OpenRouter Models Configuration - Updated Dec 2025
export const OPENROUTER_MODELS = {
  // 🏆 PRIMARY: Best agentic coding models (FREE)
  DEEPSEEK_NEX: 'nex-agi/deepseek-v3.1-nex-n1:free',       // Agent autonomy, tool use, 131K context
  DEVSTRAL_2: 'mistralai/devstral-2512:free',               // 123B params, 256K context, agentic coding
  KAT_CODER: 'kwaipilot/kat-coder-pro:free',                // 73.4% SWE-Bench, 256K context
  NEMOTRON_30B: 'nvidia/nemotron-3-nano-30b-a3b:free',      // MoE model, 256K context, agentic AI
  
  // Premium (paid per interaction - fallback only)
  CLAUDE_OPUS: 'anthropic/claude-opus-4.5',                 // Best reasoning, $15/M input
  GEMINI_PRO: 'google/gemini-3-pro-preview',
} as const;

export type ModelId = typeof OPENROUTER_MODELS[keyof typeof OPENROUTER_MODELS];

// Agent Configuration
export interface AgentConfig {
  apiKey: string;
  model: ModelId;
  fallbackModels: ModelId[];
  maxRetries: number;
  temperature: number;
}

// SVG Generation Request
export interface SVGGenerationRequest {
  templateId: string;
  templateSVG: string;
  userInfo: {
    name?: string;
    ensName?: string;
    walletAddress?: string;
    bio?: string;
    socialLinks?: Record<string, string>;
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
    };
    customData?: Record<string, string>;
  };
  style?: 'cyberpunk' | 'minimal' | 'retro' | 'corporate' | 'artistic';
  features?: string[];
}

// Agent Response
export interface AgentResponse {
  success: boolean;
  svg?: string;
  model: ModelId;
  tokensUsed?: number;
  cost?: number;
  error?: string;
  ipfsCid?: string;
  nftTokenId?: string;
}

// System prompts for SVG generation
const SYSTEM_PROMPTS = {
  SVG_BUILDER: `You are an expert SVG designer for Web3 ENS profile sites.
Your task is to enhance and customize SVG templates based on user information.

RULES:
1. Output ONLY valid SVG code - no markdown, no explanations
2. Preserve animations and filters from the template
3. Replace placeholder text with user's actual information
4. Maintain the cyberpunk/retro aesthetic unless specified otherwise
5. Ensure mobile-responsive viewBox
6. Keep file size under 100KB for IPFS efficiency
7. Use the color scheme provided or enhance it tastefully
8. Add subtle animations where appropriate
9. Include accessibility attributes (aria-labels)
10. Ensure all text is readable and properly positioned

COLOR PALETTE (default):
- Primary: #00ffcc (cyan)
- Secondary: #ff6600 (orange)
- Accent: #ff0066 (pink)
- Background: #000000 (black)
- Base Blue: #0052ff

OUTPUT FORMAT: Pure SVG code starting with <svg and ending with </svg>`,

  TEMPLATE_ANALYZER: `Analyze the given SVG template and identify:
1. All placeholder text that needs replacement
2. Color values that can be customized
3. Animation elements
4. Structural components
5. Areas for enhancement

Output a JSON object with these findings.`,
};

/**
 * OpenRouter Agent Class
 * Handles AI-powered SVG generation with fallback support
 */
export class OpenRouterAgent {
  private config: AgentConfig;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENROUTER_API_KEY || '',
      model: config.model || OPENROUTER_MODELS.DEEPSEEK_NEX,  // Best free agentic model
      fallbackModels: config.fallbackModels || [
        OPENROUTER_MODELS.DEVSTRAL_2,     // 123B Mistral, excellent for code
        OPENROUTER_MODELS.KAT_CODER,      // 73.4% SWE-Bench
        OPENROUTER_MODELS.NEMOTRON_30B,   // NVIDIA MoE fallback
        OPENROUTER_MODELS.CLAUDE_OPUS,    // Premium paid last resort
      ],
      maxRetries: config.maxRetries || 3,
      temperature: config.temperature || 0.7,
    };
  }

  /**
   * Generate enhanced SVG from template and user info
   */
  async generateSVG(request: SVGGenerationRequest): Promise<AgentResponse> {
    const models = [this.config.model, ...this.config.fallbackModels];
    
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      
      try {
        console.log(`[OpenRouter Agent] Attempting with model: ${model}`);
        
        const response = await this.callModel(model, request);
        
        if (response.success && response.svg) {
          // Validate SVG
          if (this.validateSVG(response.svg)) {
            return response;
          }
          console.warn(`[OpenRouter Agent] Invalid SVG from ${model}, trying next...`);
        }
      } catch (error) {
        console.error(`[OpenRouter Agent] Error with ${model}:`, error);
        
        if (i === models.length - 1) {
          return {
            success: false,
            model,
            error: `All models failed. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      }
    }

    return {
      success: false,
      model: models[models.length - 1],
      error: 'All models exhausted without success',
    };
  }

  /**
   * Call OpenRouter API with specific model
   */
  private async callModel(model: ModelId, request: SVGGenerationRequest): Promise<AgentResponse> {
    const prompt = this.buildPrompt(request);
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mcpvot.eth',
        'X-Title': 'MCPVOT ENS Site Builder',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.SVG_BUILDER },
          { role: 'user', content: prompt },
        ],
        temperature: this.config.temperature,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract SVG from response
    const svg = this.extractSVG(content);
    
    return {
      success: !!svg,
      svg,
      model,
      tokensUsed: data.usage?.total_tokens,
      cost: this.calculateCost(model, data.usage?.total_tokens || 0),
    };
  }

  /**
   * Build the prompt for SVG generation
   */
  private buildPrompt(request: SVGGenerationRequest): string {
    const { templateSVG, userInfo, style, features } = request;
    
    return `
TEMPLATE SVG:
${templateSVG}

USER INFORMATION:
- Name: ${userInfo.name || 'Anonymous'}
- ENS Name: ${userInfo.ensName || 'user.eth'}
- Wallet: ${userInfo.walletAddress || '0x...'}
- Bio: ${userInfo.bio || 'Web3 Builder'}
- Social Links: ${JSON.stringify(userInfo.socialLinks || {})}
- Colors: ${JSON.stringify(userInfo.colors || {})}
- Custom Data: ${JSON.stringify(userInfo.customData || {})}

STYLE: ${style || 'cyberpunk'}
REQUESTED FEATURES: ${(features || []).join(', ') || 'none specified'}

TASK:
1. Replace all placeholder text with user information
2. Apply the specified color scheme (or enhance existing)
3. Maintain all animations and effects
4. Add any requested features
5. Optimize for mobile viewing
6. Keep the retro/cyberpunk aesthetic

OUTPUT: Enhanced SVG code only, no explanations.
`;
  }

  /**
   * Extract SVG from LLM response
   */
  private extractSVG(content: string): string | undefined {
    // Try to find SVG tags
    const svgMatch = content.match(/<svg[\s\S]*<\/svg>/i);
    if (svgMatch) {
      return svgMatch[0];
    }
    
    // If content starts with <svg, assume it's the full SVG
    if (content.trim().startsWith('<svg')) {
      return content.trim();
    }
    
    return undefined;
  }

  /**
   * Validate SVG structure
   */
  private validateSVG(svg: string): boolean {
    try {
      // Check basic structure
      if (!svg.startsWith('<svg') || !svg.endsWith('</svg>')) {
        return false;
      }
      
      // Check for viewBox
      if (!svg.includes('viewBox')) {
        console.warn('[OpenRouter Agent] SVG missing viewBox');
      }
      
      // Check for balanced tags (basic)
      const openTags = (svg.match(/<[^/!][^>]*[^/]>/g) || []).length;
      const closeTags = (svg.match(/<\/[^>]+>/g) || []).length;
      const selfClosing = (svg.match(/<[^>]+\/>/g) || []).length;
      
      // Allow some tolerance for complex SVGs
      const difference = Math.abs(openTags - closeTags - selfClosing);
      if (difference > 5) {
        console.warn(`[OpenRouter Agent] Potential tag imbalance: ${difference}`);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculate cost based on model and tokens
   */
  private calculateCost(model: ModelId, tokens: number): number {
    const pricing: Record<ModelId, number> = {
      [OPENROUTER_MODELS.GEMINI_PRO]: 0.00025, // per 1K tokens
      [OPENROUTER_MODELS.GPT_CODEX]: 0.0003,
      [OPENROUTER_MODELS.KAT_CODER]: 0, // free
      [OPENROUTER_MODELS.NEMOTRON]: 0, // free
    };
    
    return (tokens / 1000) * (pricing[model] || 0);
  }

  /**
   * Analyze template for customization points
   */
  async analyzeTemplate(templateSVG: string): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODELS.KAT_CODER, // Use free model for analysis
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS.TEMPLATE_ANALYZER },
            { role: 'user', content: `Analyze this SVG template:\n\n${templateSVG}` },
          ],
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      
      // Try to parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { raw: content };
    } catch (error) {
      console.error('[OpenRouter Agent] Template analysis failed:', error);
      return { error: 'Analysis failed' };
    }
  }

  /**
   * Get model info
   */
  getModelInfo(): { primary: ModelId; fallbacks: ModelId[] } {
    return {
      primary: this.config.model,
      fallbacks: this.config.fallbackModels,
    };
  }

  /**
   * Check API availability
   */
  async checkHealth(): Promise<{ available: boolean; models: ModelId[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          models: data.data?.map((m: { id: string }) => m.id) || [],
        };
      }
      
      return { available: false, models: [] };
    } catch {
      return { available: false, models: [] };
    }
  }
}

// Default agent instance
export const defaultAgent = new OpenRouterAgent();

// Export types for external use
export type { AgentConfig, AgentResponse, SVGGenerationRequest };

