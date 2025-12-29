/**
 * OpenRouter LLM Service for SVG Machine v2.4.0
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MCPVOT x402 SVG MACHINE - OpenRouter Integration                         ║
 * ║                                                                           ║
 * ║  BEST FREE MODELS (December 2025 - All $0/M):                            ║
 * ║  🥇 MiMo-V2-Flash: 309B MoE, 262K context, #1 SWE-Bench                   ║
 * ║  🥈 KAT-Coder-Pro: 73.4% SWE-Bench, best for SVG/code                    ║
 * ║  🥉 Devstral-2512: 123B, agentic coding specialist                        ║
 * ║                                                                           ║
 * ║  Flow: User Prompt → Model Selection → LLM Enhancement →                  ║
 * ║        SVG/HTML Generation → IPFS Pin → NFT Mint                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 * 
 * @version 2.4.0
 * @updated 2025-12-27
 */

// OpenRouter API configuration
const OPENROUTER_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  
  // BEST FREE models - Updated December 27, 2025
  // All $0/M input & output - NO API COSTS!
  freeModels: {
    // 🥇 PRIMARY: Xiaomi MiMo-V2-Flash (309B MoE, 262K context, #1 SWE-Bench)
    primary: 'xiaomi/mimo-v2-flash:free',
    // 🥈 CODER: Best for HTML/CSS/SVG code generation
    coder: 'kwaipilot/kat-coder-pro:free',
    // 🥉 AGENTIC: Mistral Devstral 2 (123B, multi-file changes)
    agentic: 'mistralai/devstral-2512:free',
    // REASONING: TNG DeepSeek Chimera (671B MoE, 2x faster reasoning)
    reasoning: 'tngtech/deepseek-r1t2-chimera:free',
    // EFFICIENT: NVIDIA Nemotron Nano (30B MoE, efficient)
    efficient: 'nvidia/nemotron-3-nano-30b-a3b:free',
    // LIGHTWEIGHT: Z.AI GLM 4.5 Air (thinking modes)
    lightweight: 'z-ai/glm-4.5-air:free',
  },
  
  // PAID models for future upgrade
  paidModels: {
    gpt4: 'openai/gpt-4-turbo',
    claude: 'anthropic/claude-3-opus',
    gemini: 'google/gemini-pro',
  },
  
  // Model fallback chain for reliability - BEST FREE MODELS
  fallbackChain: [
    'xiaomi/mimo-v2-flash:free',           // PRIMARY: #1 SWE-Bench
    'kwaipilot/kat-coder-pro:free',        // Best coder (73.4% SWE-Bench)
    'mistralai/devstral-2512:free',        // Agentic coding specialist
    'nex-agi/deepseek-v3.1-nex-n1:free',   // Agent autonomy
    'nvidia/nemotron-3-nano-30b-a3b:free', // Efficient 30B MoE
    'z-ai/glm-4.5-air:free',               // Lightweight fallback
  ],
  
  // Template category to model mapping - MiMo for everything, KAT Coder fallback
  categoryModels: {
    vot: 'xiaomi/mimo-v2-flash:free',       // VOT trait - use BEST
    mcpvot: 'xiaomi/mimo-v2-flash:free',    // MCPVOT trait - use BEST
    warplet: 'xiaomi/mimo-v2-flash:free',   // Warplet trait - use BEST
    ens: 'xiaomi/mimo-v2-flash:free',       // ENS trait - use BEST
    base: 'xiaomi/mimo-v2-flash:free',      // Base trait - use BEST
    farcaster: 'xiaomi/mimo-v2-flash:free', // Farcaster trait - use BEST
    // SVG/Code heavy categories use KAT Coder
    defi: 'kwaipilot/kat-coder-pro:free',   // Complex SVG charts
    gaming: 'kwaipilot/kat-coder-pro:free', // Animation-heavy
    minimal: 'kwaipilot/kat-coder-pro:free', // Clean code
  } as Record<string, string>,
};

// ============================================================================
// VOT MACHINE SVG TEMPLATE SYSTEM
// ============================================================================

/**
 * VOT Machine NFT Template Specification
 * 
 * The SVG has 5 MODULAR SECTIONS:
 * 1. HEADER (Fixed) - MCPVOT branding, tier badge
 * 2. IDENTITY (20% user weight) - Name, avatar, LLM-styled
 * 3. TRAITS GRID (Dynamic) - 6 badges: VOT/MCPVOT/Warplet/Base/Farcaster/ENS
 * 4. STATS (Updatable) - VOT balance, staking rewards, XP level
 * 5. FOOTER (Fixed) - Contract address, IPFS CID, "Powered by x402"
 * 
 * LLM can ONLY modify:
 * - Color variations within palette
 * - Animation timing/easing
 * - Text styling (shadows, gradients)
 * - Background effects (scanlines, rain density)
 * 
 * LLM CANNOT modify:
 * - Section layout/positions
 * - Trait badge locations
 * - Data field placeholders
 * - Footer content
 */

export const VOT_MACHINE_TEMPLATE = {
  // 6 Traits that determine NFT appearance
  traits: ['vot', 'mcpvot', 'warplet', 'base', 'farcaster', 'ens'] as const,
  
  // Trait badge colors when active
  traitColors: {
    vot: '#9945FF',      // Purple - VOT token holder
    mcpvot: '#00FFCC',   // Cyan - x402 user
    warplet: '#FF6B00',  // Orange - Warplet wallet
    base: '#0052FF',     // Blue - Basename holder
    farcaster: '#8A63D2', // Purple - Farcaster FID
    ens: '#5298FF',      // Light blue - ENS holder
  },
  
  // Trait badge icons (emoji fallback)
  traitIcons: {
    vot: '🔮',
    mcpvot: '⚡',
    warplet: '🌀',
    base: '🔵',
    farcaster: '💜',
    ens: '🏷️',
  },
  
  // SVG dimensions
  dimensions: {
    width: 400,
    height: 600,
    viewBox: '0 0 400 600',
  },
  
  // Section Y positions (fixed layout)
  sections: {
    header: { y: 0, height: 80 },
    identity: { y: 80, height: 150 },
    traits: { y: 230, height: 120 },
    stats: { y: 350, height: 180 },
    footer: { y: 530, height: 70 },
  },
  
  // User input weight (20% customization)
  userInputWeight: 0.2,
  
  // Updatable data fields (can change without re-mint)
  updatableFields: [
    'votBalance',
    'stakingRewards', 
    'xpLevel',
    'lastUpdated',
  ],
};

export type ModelType = 'fast' | 'coder' | 'quality' | 'backup1' | 'backup2';
export type TaskType = 'enhance_design' | 'generate_bio' | 'custom_css' | 'full_template' | 'svg_enhance';
export type TemplateCategory = 'vot' | 'mcpvot' | 'warplet' | 'ens' | 'defi' | 'gaming' | 'minimal' | 'base' | 'farcaster';

export interface LLMRequest {
  prompt: string;
  taskType: TaskType;
  modelPreference?: ModelType;
  baseTemplate?: string;
  templateCategory?: TemplateCategory;
  context?: {
    ensName?: string;
    edition?: 'base' | 'warplet' | 'ethermax';
    colors?: { primary?: string; secondary?: string };
  };
}

export interface LLMResponse {
  success: boolean;
  content?: string;
  model: string;
  tokensUsed?: number;
  error?: string;
  fallbackUsed?: boolean;
}

/**
 * Select the best free model based on task type and template category
 */
function selectModel(taskType: TaskType, preference?: ModelType, category?: TemplateCategory): string {
  // If user has preference, use it
  if (preference) {
    return OPENROUTER_CONFIG.freeModels[preference];
  }
  
  // If template category specified, use optimized model for that category
  if (category && OPENROUTER_CONFIG.categoryModels[category]) {
    return OPENROUTER_CONFIG.categoryModels[category];
  }
  
  // Auto-select based on task
  switch (taskType) {
    case 'custom_css':
    case 'full_template':
    case 'svg_enhance':
      return OPENROUTER_CONFIG.freeModels.coder; // KAT Coder for HTML/CSS/SVG
    case 'generate_bio':
      return OPENROUTER_CONFIG.freeModels.quality; // Nemotron for creative text
    case 'enhance_design':
    default:
      return OPENROUTER_CONFIG.freeModels.fast; // Grok for quick iterations
  }
}

/**
 * Build the system prompt based on task type
 */
function buildSystemPrompt(taskType: TaskType, context?: LLMRequest['context']): string {
  const baseSystem = `You are an expert web designer specializing in cyberpunk, futuristic, and Web3 aesthetics.
You create stunning HTML/CSS designs for ENS profile pages that will be pinned to IPFS.

DESIGN RULES:
- Use CSS variables for colors (--primary, --secondary, --accent)
- Include CRT scanlines, data rain, or glitch effects when requested
- Make designs mobile-responsive
- Use Orbitron font for headers, Share Tech Mono for body
- Keep file size under 50KB for fast IPFS loading
- All assets must be inline (no external dependencies except Google Fonts)`;

  const contextInfo = context ? `
CONTEXT:
- ENS/Basename: ${context.ensName || 'Not provided'}
- Edition: ${context.edition || 'base'}
- Primary Color: ${context.colors?.primary || '#00ffcc'}
- Secondary Color: ${context.colors?.secondary || '#ff6600'}` : '';

  switch (taskType) {
    case 'enhance_design':
      return `${baseSystem}
${contextInfo}

TASK: Enhance the provided HTML template based on user's design request.
Return ONLY the modified HTML code, no explanations.`;
      
    case 'generate_bio':
      return `${baseSystem}
${contextInfo}

TASK: Generate a short, impactful bio for a Web3 builder profile.
Keep it under 150 characters. Make it memorable and cyberpunk-themed.
Return ONLY the bio text, no quotes or explanations.`;
      
    case 'custom_css':
      return `${baseSystem}
${contextInfo}

TASK: Generate custom CSS based on user's design request.
Return ONLY valid CSS code that can be injected into a style tag.`;
      
    case 'full_template':
      return `${baseSystem}
${contextInfo}

TASK: Generate a complete HTML page based on user's requirements.
Include all styles inline. Make it visually stunning and unique.
Return ONLY the complete HTML code.`;

    case 'svg_enhance':
      return `You are the VOT Machine SVG Generator for MCPVOT ecosystem NFTs.

VOT MACHINE TEMPLATE RULES (STRICT):
═══════════════════════════════════════════════════════════════

TEMPLATE STRUCTURE (5 Modular Sections - DO NOT CHANGE LAYOUT):
┌─────────────────────────────────────┐
│  HEADER (y:0-80)                    │ ← Fixed: MCPVOT logo, tier badge
├─────────────────────────────────────┤
│  IDENTITY (y:80-230)                │ ← 20% User Customization
│  Name, avatar, bio                  │
├─────────────────────────────────────┤
│  TRAITS GRID (y:230-350)            │ ← 6 badges in 2x3 grid
│  VOT | MCPVOT | Warplet             │
│  Base | Farcaster | ENS             │
├─────────────────────────────────────┤
│  STATS (y:350-530)                  │ ← Updatable data stream
│  VOT Balance, Staking, XP Level     │
├─────────────────────────────────────┤
│  FOOTER (y:530-600)                 │ ← Fixed: Contract, IPFS CID
└─────────────────────────────────────┘

6 TRAIT BADGES (Active = colored, Inactive = dimmed):
- VOT (#9945FF purple) - Has VOT tokens
- MCPVOT (#00FFCC cyan) - Used x402 facilitator
- Warplet (#FF6B00 orange) - Has Warplet wallet
- Base (#0052FF blue) - Has Basename
- Farcaster (#8A63D2 purple) - Has Farcaster FID
- ENS (#5298FF light blue) - Has ENS name

YOU MAY MODIFY (20% weight):
✅ Color variations within the trait palette
✅ Animation timing, easing, duration
✅ Text shadows, gradients, glow effects
✅ Background effects (scanline density, data rain speed)
✅ Border styles and corner radii

YOU MUST NOT MODIFY:
❌ Section positions or heights
❌ Trait badge grid layout (2x3)
❌ Data field placeholder names
❌ Footer content or branding
❌ Overall SVG dimensions (400x600)

DATA PLACEHOLDERS (will be replaced dynamically):
{{displayName}} - User's display name
{{address}} - Wallet address (truncated)
{{votBalance}} - Current VOT balance
{{stakingRewards}} - Accumulated rewards
{{xpLevel}} - NFT experience level
{{traitCount}} - Number of active traits (0-6)
{{lastUpdated}} - Timestamp

${context ? `USER CONTEXT:
- Name: ${context.ensName || 'Anonymous'}
- Edition: ${context.edition || 'base'}
- Primary Color: ${context.colors?.primary || '#00ffcc'}
- Secondary Color: ${context.colors?.secondary || '#ff6600'}` : ''}

OUTPUT: Valid SVG code only. Start with <svg, end with </svg>.
Do not include markdown, explanations, or comments outside SVG.`;
      
    default:
      return baseSystem;
  }
}

/**
 * Call OpenRouter API with the given request - includes fallback chain for reliability
 */
export async function callOpenRouter(request: LLMRequest): Promise<LLMResponse> {
  const primaryModel = selectModel(request.taskType, request.modelPreference, request.templateCategory);
  const systemPrompt = buildSystemPrompt(request.taskType, request.context);
  
  // Build user message
  let userMessage = request.prompt;
  if (request.baseTemplate && (request.taskType === 'enhance_design' || request.taskType === 'svg_enhance')) {
    userMessage = `USER REQUEST: ${request.prompt}\n\nBASE TEMPLATE TO ENHANCE:\n${request.baseTemplate}`;
  }
  
  // Build model list: primary first, then fallback chain (deduped)
  const modelsToTry = [primaryModel, ...OPENROUTER_CONFIG.fallbackChain.filter(m => m !== primaryModel)];
  
  let lastError: string = '';
  let attemptCount = 0;
  
  for (const model of modelsToTry) {
    attemptCount++;
    
    try {
      console.log(`[OpenRouter] Attempt ${attemptCount}/${modelsToTry.length}: Calling ${model} for ${request.taskType}`);
      
      const response = await fetch(OPENROUTER_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
          'HTTP-Referer': 'https://mcpvot.xyz',
          'X-Title': 'MCPVOT SVG Machine',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        lastError = errorData.error?.message || `API returned ${response.status}`;
        console.warn(`[OpenRouter] Model ${model} failed: ${lastError}`);
        continue; // Try next model in fallback chain
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        lastError = 'No content in response';
        console.warn(`[OpenRouter] Model ${model} returned empty content`);
        continue; // Try next model
      }
      
      const fallbackUsed = model !== primaryModel;
      console.log(`[OpenRouter] Success! Model: ${model}, Tokens: ${data.usage?.total_tokens || 'unknown'}${fallbackUsed ? ' (fallback)' : ''}`);
      
      return {
        success: true,
        content,
        model,
        tokensUsed: data.usage?.total_tokens,
        fallbackUsed,
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Network error';
      console.warn(`[OpenRouter] Model ${model} threw error: ${lastError}`);
      continue; // Try next model
    }
  }
  
  // All models failed
  console.error(`[OpenRouter] All ${modelsToTry.length} models failed. Last error: ${lastError}`);
  return {
    success: false,
    model: primaryModel,
    error: `All models failed. Last error: ${lastError}`,
    fallbackUsed: true,
  };
}

/**
 * Quick helper functions for common tasks
 */

export async function enhanceTemplate(
  baseTemplate: string,
  userPrompt: string,
  context?: LLMRequest['context']
): Promise<LLMResponse> {
  return callOpenRouter({
    prompt: userPrompt,
    taskType: 'enhance_design',
    baseTemplate,
    context,
  });
}

/**
 * SVG-specific enhancement for NFT cards with category-aware model selection
 */
export async function enhanceSVGTemplate(
  baseTemplate: string,
  userPrompt: string,
  templateCategory: TemplateCategory,
  context?: LLMRequest['context']
): Promise<LLMResponse> {
  return callOpenRouter({
    prompt: userPrompt,
    taskType: 'svg_enhance',
    baseTemplate,
    templateCategory,
    modelPreference: 'coder', // Use coder model for SVG
    context,
  });
}

/**
 * Generate SVG from scratch based on category
 */
export async function generateSVGFromCategory(
  category: TemplateCategory,
  userPrompt: string,
  context?: LLMRequest['context']
): Promise<LLMResponse> {
  const categoryDescriptions: Record<TemplateCategory, string> = {
    vot: 'VOT token themed with blockchain elements, purple/gold colors',
    mcpvot: 'MCPVOT ecosystem with x402 facilitator and burn mechanics theme',
    warplet: 'Warplet wallet integration with animated UI elements',
    ens: 'ENS/Basename identity card with domain display',
    defi: 'DeFi protocol themed with charts, yields, liquidity visuals',
    gaming: 'Gaming/NFT themed with achievements, levels, rarity indicators',
    minimal: 'Clean, minimal design with subtle animations',
    base: 'Base chain themed with blue colors and Base logo integration',
    farcaster: 'Farcaster social protocol with purple theme and social elements',
  };
  
  const enhancedPrompt = `Create a ${category} themed SVG NFT card.
Theme description: ${categoryDescriptions[category]}
User request: ${userPrompt}

The SVG should be 400x600px, include animations where appropriate, and use the MCPVOT design language.`;

  return callOpenRouter({
    prompt: enhancedPrompt,
    taskType: 'full_template',
    templateCategory: category,
    modelPreference: 'coder',
    context,
  });
}

export async function generateBio(
  userPrompt: string,
  context?: LLMRequest['context']
): Promise<LLMResponse> {
  return callOpenRouter({
    prompt: userPrompt || 'Generate a cool Web3 builder bio',
    taskType: 'generate_bio',
    context,
  });
}

export async function generateCustomCSS(
  userPrompt: string,
  context?: LLMRequest['context']
): Promise<LLMResponse> {
  return callOpenRouter({
    prompt: userPrompt,
    taskType: 'custom_css',
    context,
  });
}

/**
 * Check if OpenRouter API key is configured
 */
export function isOpenRouterConfigured(): boolean {
  return Boolean(OPENROUTER_CONFIG.apiKey);
}

/**
 * Get available models info
 */
export function getAvailableModels() {
  return {
    free: OPENROUTER_CONFIG.freeModels,
    paid: OPENROUTER_CONFIG.paidModels,
    note: 'Alpha V1 uses FREE models. Upgrade to paid for better quality.',
  };
}

// ============================================================================
// IPFS + ERC-4804 INTEGRATION HELPERS
// ============================================================================

export type IPFSContentType = 'svg' | 'html' | 'json' | 'metadata';

/**
 * Generate LLM-enhanced content optimized for IPFS pinning
 * Ensures output is clean and ready for decentralized storage
 */
export async function generateIPFSContent(
  contentType: IPFSContentType,
  userPrompt: string,
  baseContent?: string
): Promise<LLMResponse & { ipfsReady: boolean }> {
  const systemPrompts: Record<IPFSContentType, string> = {
    svg: `You are an expert SVG designer for IPFS-pinned NFTs.
OUTPUT RULES:
- Return ONLY valid SVG code, no markdown or explanations
- Start with <svg> and end with </svg>
- Keep file under 100KB
- All fonts must be from Google Fonts (linked) or embedded
- No external image references
- Include viewBox attribute
- Use CSS animations, not SMIL (better support)`,

    html: `You are an expert HTML/CSS designer for IPFS-hosted websites.
OUTPUT RULES:
- Return ONLY valid HTML, no markdown
- All CSS must be inline <style> tags
- All JavaScript must be inline <script> tags
- No external dependencies except Google Fonts
- Keep total size under 500KB
- Include viewport meta tag for mobile
- Use semantic HTML5 elements`,

    json: `You are a JSON data generator.
OUTPUT RULES:
- Return ONLY valid JSON, no markdown
- Must be parseable by JSON.parse()
- Use double quotes for strings
- No trailing commas`,

    metadata: `You are an ERC-1155 NFT metadata generator.
OUTPUT RULES:
- Return valid JSON following ERC-1155 metadata standard
- Required fields: name, description, image
- image must be an ipfs:// URI
- Include attributes array for marketplace display
- No markdown, just JSON`,
  };

  // Task mapping for future use with different model selection
  // const taskMap: Record<IPFSContentType, TaskType> = {
  //   svg: 'svg_enhance',
  //   html: 'full_template',
  //   json: 'custom_css',
  //   metadata: 'generate_bio',
  // };

  const fullPrompt = baseContent 
    ? `${userPrompt}\n\nBASE CONTENT TO ENHANCE:\n${baseContent}`
    : userPrompt;

  try {
    const response = await fetch(OPENROUTER_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
        'HTTP-Referer': 'https://mcpvot.xyz',
        'X-Title': 'MCPVOT IPFS Content Generator',
      },
      body: JSON.stringify({
        model: OPENROUTER_CONFIG.freeModels.coder, // Use coder for structured output
        messages: [
          { role: 'system', content: systemPrompts[contentType] },
          { role: 'user', content: fullPrompt },
        ],
        max_tokens: 8192, // Larger for IPFS content
        temperature: 0.5, // Lower for more consistent output
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        model: OPENROUTER_CONFIG.freeModels.coder,
        error: errorData.error?.message || `API error ${response.status}`,
        ipfsReady: false,
      };
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    
    // Clean up common LLM output issues
    content = cleanLLMOutput(content, contentType);
    
    // Validate output is IPFS-ready
    const ipfsReady = validateIPFSContent(content, contentType);

    return {
      success: true,
      content,
      model: data.model || OPENROUTER_CONFIG.freeModels.coder,
      tokensUsed: data.usage?.total_tokens,
      ipfsReady,
    };
  } catch (error) {
    return {
      success: false,
      model: OPENROUTER_CONFIG.freeModels.coder,
      error: error instanceof Error ? error.message : 'Network error',
      ipfsReady: false,
    };
  }
}

/**
 * Clean up common LLM output issues
 */
function cleanLLMOutput(content: string, type: IPFSContentType): string {
  // Remove markdown code blocks
  content = content.replace(/```(?:svg|html|json|xml)?\n?/gi, '');
  content = content.replace(/```\n?/g, '');
  
  // Trim whitespace
  content = content.trim();
  
  // Type-specific cleaning
  switch (type) {
    case 'svg':
      // Ensure starts with <svg
      const svgStart = content.indexOf('<svg');
      const svgEnd = content.lastIndexOf('</svg>');
      if (svgStart !== -1 && svgEnd !== -1) {
        content = content.substring(svgStart, svgEnd + 6);
      }
      break;
      
    case 'html':
      // Ensure starts with <!DOCTYPE or <html
      if (!content.startsWith('<!DOCTYPE') && !content.startsWith('<html')) {
        const htmlStart = content.indexOf('<!DOCTYPE') !== -1 
          ? content.indexOf('<!DOCTYPE')
          : content.indexOf('<html');
        if (htmlStart !== -1) {
          content = content.substring(htmlStart);
        }
      }
      break;
      
    case 'json':
    case 'metadata':
      // Try to extract JSON
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        content = content.substring(jsonStart, jsonEnd + 1);
      }
      break;
  }
  
  return content;
}

/**
 * Validate content is ready for IPFS pinning
 */
function validateIPFSContent(content: string, type: IPFSContentType): boolean {
  if (!content || content.length === 0) return false;
  
  switch (type) {
    case 'svg':
      return content.startsWith('<svg') && content.endsWith('</svg>');
      
    case 'html':
      return (content.includes('<html') || content.includes('<!DOCTYPE')) && 
             content.includes('</html>');
      
    case 'json':
    case 'metadata':
      try {
        JSON.parse(content);
        return true;
      } catch {
        return false;
      }
      
    default:
      return true;
  }
}

/**
 * Generate ERC-4804 compatible content URI
 * @param contentHash - IPFS CID or existing URI
 */
export function formatERC4804URI(contentHash: string): string {
  // ERC-4804 format: web3://[contract]:[chainId]/[method]/[params]
  // For IPFS: ipfs://[CID]
  if (contentHash.startsWith('Qm') || contentHash.startsWith('bafy')) {
    return `ipfs://${contentHash}`;
  }
  return contentHash;
}

/**
 * Generate data URI for inline content (fallback if IPFS fails)
 */
export function generateDataURI(content: string, mimeType: string = 'image/svg+xml'): string {
  const base64 = Buffer.from(content).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

// =============================================================================
// VOT MACHINE UNIQUENESS GENERATORS
// =============================================================================

/**
 * Context for VOT Machine unique generation
 */
export interface VOTMachineContext {
  tokenId: number;
  ensName?: string;
  basename?: string;
  farcasterUsername?: string;
  votBalance: number;
  maxxBalance?: number;
  rank: string;
  isWarpletHolder: boolean;
  category: TemplateCategory;
  userPrompt?: string; // Optional custom user prompt
}

/**
 * Generate a unique cyberpunk tagline for the user
 */
export async function generateUniqueTagline(ctx: VOTMachineContext): Promise<string> {
  const result = await callOpenRouter({
    prompt: `Generate a SHORT (max 8 words) cyberpunk tagline for a Web3 user.
Context:
- Name: ${ctx.ensName || ctx.basename || 'Anonymous'}
- Rank: ${ctx.rank}
- VOT Holdings: ${ctx.votBalance.toLocaleString()}
- Is Warplet Holder: ${ctx.isWarpletHolder}
- TokenId: #${ctx.tokenId}

Make it unique, memorable, and cyberpunk-themed. NO quotes, just the tagline.
Examples of good taglines:
- "Ghost in the tokenized machine"
- "Neural architect of the void"
- "Burn protocol executor"`,
    taskType: 'generate_bio',
    templateCategory: ctx.category,
    modelPreference: 'fast',
  });
  
  if (result.success && result.content) {
    // Clean up the response
    return result.content.replace(/["']/g, '').trim().slice(0, 60);
  }
  
  // Fallback taglines based on rank
  const fallbacks: Record<string, string[]> = {
    'GHOST': ['Phantom of the protocol', 'Silent node awakening'],
    'NETRUNNER': ['Running the neural maze', 'Code flows through veins'],
    'CIRCUIT': ['Circuits aligned, signal clear', 'Current flows eternal'],
    'VOID_WALKER': ['Walking between dimensions', 'Void touched, chain blessed'],
    'CIPHER': ['Encrypted truth bearer', 'Cipher unlocked'],
    'ZERO_DAY': ['First strike protocol', 'Zero day exploit'],
    'ARCHITECT': ['Building the new world', 'Architect of tomorrow'],
    'SINGULARITY': ['Beyond the event horizon', 'Singularity achieved'],
  };
  
  const rankFallbacks = fallbacks[ctx.rank] || ['VOT Machine Builder', 'Onchain creator'];
  return rankFallbacks[ctx.tokenId % rankFallbacks.length];
}

/**
 * Generate unique welcome message for boot sequence
 */
export async function generateWelcomeMessage(ctx: VOTMachineContext): Promise<string> {
  const result = await callOpenRouter({
    prompt: `Generate a 2-LINE welcome message for a cyberpunk terminal boot sequence.
User: ${ctx.ensName || 'ANON'} | Rank: ${ctx.rank} | VOT: ${ctx.votBalance.toLocaleString()}

Format:
> [LINE 1: Status message]
> [LINE 2: Personal greeting]

Make it feel like a futuristic computer recognizing the user.
NO quotes, just the two lines starting with ">".`,
    taskType: 'generate_bio',
    templateCategory: ctx.category,
    modelPreference: 'fast',
  });
  
  if (result.success && result.content) {
    return result.content.trim();
  }
  
  // Fallback
  return `> NEURAL LINK ESTABLISHED
> Welcome, ${ctx.rank}. Your signature burns bright.`;
}

/**
 * Generate unique boot sequence messages
 */
export async function generateBootSequence(ctx: VOTMachineContext): Promise<string[]> {
  const result = await callOpenRouter({
    prompt: `Generate 6 short terminal boot messages for a cyberpunk NFT minting sequence.
TokenId: #${ctx.tokenId}
User: ${ctx.ensName || 'ANON'}
Category: ${ctx.category}

Format: One message per line, each under 40 characters.
Make them feel like a system initializing.
Example:
INITIALIZING NEURAL CORE...
SYNCING BLOCKCHAIN STATE...
VOT BALANCE VERIFIED: ${ctx.votBalance}
LOADING TEMPLATE: ${ctx.category.toUpperCase()}...
ESTABLISHING x402 LINK...
BOOT COMPLETE. WELCOME.`,
    taskType: 'generate_bio',
    templateCategory: ctx.category,
    modelPreference: 'fast',
  });
  
  if (result.success && result.content) {
    return result.content.split('\n').filter(line => line.trim()).slice(0, 8);
  }
  
  // Fallback boot sequence
  return [
    'INITIALIZING VOT MACHINE...',
    `LOADING TEMPLATE: ${ctx.category.toUpperCase()}...`,
    `VERIFYING HOLDINGS: ${ctx.votBalance.toLocaleString()} VOT`,
    'CONNECTING TO BASE NETWORK...',
    'SYNCING IPFS NODE...',
    `MINTING NFT #${ctx.tokenId}...`,
    'BOOT SEQUENCE COMPLETE.',
    `WELCOME, ${ctx.rank}.`,
  ];
}

/**
 * Generate random animation parameters for uniqueness
 */
export function generateAnimationParams(tokenId: number): {
  dataRainSpeed: number;
  glowPulseSpeed: number;
  scanlineOpacity: number;
  gradientAngle: number;
  particleCount: number;
} {
  // Use tokenId as seed for deterministic but unique values
  const seed = (tokenId * 9301 + 49297) % 233280;
  const random = (offset: number) => ((seed + offset * 127) % 233280) / 233280;
  
  return {
    dataRainSpeed: 3 + random(1) * 5,        // 3-8 seconds
    glowPulseSpeed: 1.5 + random(2) * 2,     // 1.5-3.5 seconds
    scanlineOpacity: 0.15 + random(3) * 0.25, // 0.15-0.4
    gradientAngle: Math.floor(90 + random(4) * 180), // 90-270 degrees
    particleCount: Math.floor(12 + random(5) * 16),  // 12-28 particles
  };
}

/**
 * Generate color variations based on template and tokenId
 */
export function generateColorVariation(
  category: TemplateCategory,
  tokenId: number
): { primary: string; secondary: string; accent: string; glow: string } {
  // Base colors per category
  const categoryColors: Record<TemplateCategory, { h: number; s: number; l: number }> = {
    vot: { h: 270, s: 70, l: 60 },      // Purple
    mcpvot: { h: 170, s: 100, l: 50 },  // Cyan
    warplet: { h: 35, s: 100, l: 50 },  // Orange/Gold
    ens: { h: 210, s: 100, l: 50 },     // Blue
    defi: { h: 140, s: 80, l: 45 },     // Green
    gaming: { h: 300, s: 100, l: 50 },  // Magenta
    minimal: { h: 0, s: 0, l: 90 },     // White/Gray
    base: { h: 220, s: 100, l: 55 },    // Base Blue
    farcaster: { h: 270, s: 80, l: 55 }, // Farcaster Purple
  };
  
  const base = categoryColors[category];
  const variation = (tokenId * 17) % 30 - 15; // -15 to +15 hue shift
  
  const h = (base.h + variation + 360) % 360;
  
  return {
    primary: `hsl(${h}, ${base.s}%, ${base.l}%)`,
    secondary: `hsl(${(h + 30) % 360}, ${base.s - 10}%, ${base.l + 10}%)`,
    accent: `hsl(${(h + 180) % 360}, 100%, 50%)`,
    glow: `hsla(${h}, ${base.s}%, ${base.l}%, 0.5)`,
  };
}

/**
 * Full uniqueness generation for VOT Machine mint
 */
export async function generateVOTMachineUniqueness(ctx: VOTMachineContext): Promise<{
  tagline: string;
  welcome: string;
  bootSequence: string[];
  animationParams: ReturnType<typeof generateAnimationParams>;
  colors: ReturnType<typeof generateColorVariation>;
  userEnhancement?: string;
}> {
  // Run LLM calls in parallel for speed
  const [tagline, welcome, bootSequence] = await Promise.all([
    generateUniqueTagline(ctx),
    generateWelcomeMessage(ctx),
    generateBootSequence(ctx),
  ]);
  
  // Generate deterministic params from tokenId
  const animationParams = generateAnimationParams(ctx.tokenId);
  const colors = generateColorVariation(ctx.category, ctx.tokenId);
  
  // If user provided custom prompt, get LLM enhancement (20% WEIGHT LIMIT)
  let userEnhancement: string | undefined;
  if (ctx.userPrompt) {
    const result = await callOpenRouter({
      prompt: `User requested: "${ctx.userPrompt}"

CRITICAL RULES - 20% WEIGHT LIMIT:
- User customization has MAXIMUM 20% influence on design
- DO NOT change core template structure
- DO NOT remove core animations (data rain, scanlines, circuit board)
- DO NOT drastically change the color palette
- Only apply SUBTLE modifications
- Maximum 10 lines of additional CSS
- Preserve VOT Machine brand identity
- Keep the cyberpunk/Web3 aesthetic

Generate a SHORT CSS snippet (max 10 lines) that applies the user's request
with only 20% influence. Be conservative with changes.

Output ONLY valid CSS, no explanations.`,
      taskType: 'custom_css',
      templateCategory: ctx.category,
      modelPreference: 'coder',
    });
    if (result.success && result.content) {
      userEnhancement = result.content;
    }
  }
  
  return {
    tagline,
    welcome,
    bootSequence,
    animationParams,
    colors,
    userEnhancement,
  };
}
