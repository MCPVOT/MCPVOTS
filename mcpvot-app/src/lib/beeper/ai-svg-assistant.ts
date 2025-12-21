/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║               AI SVG ASSISTANT - OPENROUTER INTEGRATION                      ║
 * ║                                                                               ║
 * ║  Uses OpenRouter LLM to enhance BEEPER NFT banner quality:                   ║
 * ║  ✅ Generate personalized taglines based on user identity                    ║
 * ║  ✅ Create AI-generated rarity lore descriptions                             ║
 * ║  ✅ Validate SVG structure and accessibility                                  ║
 * ║  ✅ Suggest creative enhancements                                            ║
 * ║                                                                               ║
 * ║  Model: OpenRouter (minimax-m2:free or fallback)                             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import type { BeeperUserData, DinoRarity } from './banner-generator';

// =============================================================================
// OPENROUTER CONFIGURATION - UPDATED Dec 2025
// =============================================================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// PRIMARY: DeepSeek V3.1 Nex N1 - Best free model for creative tasks
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'nex-agi/deepseek-v3.1-nex-n1:free';

// Fallback models if primary fails (in order of preference)
export const FALLBACK_MODELS = [
  'mistralai/devstral-2512:free',    // Great for code/creative
  'nvidia/llama-3.1-nemotron-70b-instruct:free', // NVIDIA large model
  'xiaomi/mimo-v2-flash:free',       // Fast fallback
  'minimax/minimax-m2:free',         // Original fallback
];

// =============================================================================
// TYPES
// =============================================================================

export interface AIEnhancement {
  tagline: string;
  rarityLore: string;
  accessibilityCheck: {
    passed: boolean;
    warnings: string[];
    suggestions: string[];
  };
  creativeSuggestions: string[];
  processingTime: number;
  model: string;
}

export interface SVGValidationResult {
  isValid: boolean;
  hasAnimations: boolean;
  hasAccessibleText: boolean;
  colorContrast: 'good' | 'warning' | 'poor';
  fileSize: number;
  warnings: string[];
}

// =============================================================================
// RATE LIMITING (Protect free OpenRouter API)
// =============================================================================

// Simple in-memory rate limiter
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 10,    // Free tier friendly
  maxRequestsPerHour: 100,     // Generous but safe
  windowMs: 60 * 1000,         // 1 minute window
};

function checkRateLimit(key: string = 'global'): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now >= record.resetAt) {
    // Reset or create new window
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_CONFIG.windowMs });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    console.warn(`[AI-SVG] Rate limit hit. Retry after ${retryAfter}s`);
    return { allowed: false, retryAfter };
  }
  
  // Increment count
  record.count++;
  return { allowed: true };
}

// =============================================================================
// OPENROUTER API CALL (with rate limiting)
// =============================================================================

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  model: string = OPENROUTER_MODEL
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    console.warn('[AI-SVG] No OpenRouter API key configured');
    return '';
  }

  // Check rate limit before making request
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    console.warn(`[AI-SVG] Rate limited. Using fallback tagline.`);
    return ''; // Return empty to trigger fallback
  }

  try {
    console.log(`[AI-SVG] Calling OpenRouter (model: ${model})`);
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mcpvot.xyz',
        'X-Title': 'MCPVOT BEEPER Mint',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 200,  // Reduced for faster response
        temperature: 0.7, // Slightly more focused
      }),
    });

    // Handle rate limit from OpenRouter
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.warn(`[AI-SVG] OpenRouter rate limited. Retry after: ${retryAfter}s`);
      return '';
    }

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Log usage for monitoring
    if (data.usage) {
      console.log(`[AI-SVG] Token usage: ${data.usage.total_tokens} tokens`);
    }
    
    return content;
  } catch (error) {
    console.error('[AI-SVG] OpenRouter call failed:', error);
    return '';
  }
}

// =============================================================================
// AI TAGLINE GENERATOR
// =============================================================================

/**
 * Generate a personalized tagline for the user's BEEPER NFT
 */
export async function generatePersonalizedTagline(
  userData: BeeperUserData,
  rarity: DinoRarity
): Promise<string> {
  const displayName = userData.ensName 
    || userData.basename 
    || userData.farcasterUsername 
    || `User ${userData.fid}`;

  const systemPrompt = `You are a creative Web3 copywriter for MCPVOT, a decentralized AI ecosystem. 
Generate short, punchy taglines (max 8 words) for NFT banners. 
Style: Cyberpunk, matrix green aesthetic, playful dinosaur (BEEPER) vibes.
NEVER use hashtags or emojis in the tagline itself.`;

  const userPrompt = `Generate ONE tagline for ${displayName}'s BEEPER NFT.
Rarity: ${rarity.toUpperCase()}
${userData.farcasterFollowers ? `Followers: ${userData.farcasterFollowers}` : ''}
${userData.votBalance ? `VOT Holder: Yes` : ''}

Examples of good taglines:
- "Stacking VOT, Building the Future"
- "Genesis Node Activated"
- "The Machine Awakens"
- "Protocol Override Complete"
- "Zero Point Achieved"

Return ONLY the tagline, nothing else.`;

  const result = await callOpenRouter(systemPrompt, userPrompt);
  
  // Fallback taglines if AI fails
  const fallbacks: Record<DinoRarity, string> = {
    node: 'NODE ACTIVATED',
    validator: 'VALIDATING THE FUTURE',
    staker: 'STAKING MY CLAIM',
    whale: 'DEEP IN THE PROTOCOL',
    og: 'ORIGINAL BUILDER STATUS',
    genesis: 'FROM THE GENESIS BLOCK',
    zzz: 'AWAKENING THE MACHINE',
    fomo: 'NEVER MISSING AGAIN',
    gm: 'GM TO THE FUTURE',
    x402: 'PROTOCOL OVERRIDE COMPLETE',
  };

  return result.trim() || fallbacks[rarity];
}

// =============================================================================
// AI RARITY LORE GENERATOR
// =============================================================================

/**
 * Generate AI lore for the rarity tier
 */
export async function generateRarityLore(
  rarity: DinoRarity,
  userData: BeeperUserData
): Promise<string> {
  const systemPrompt = `You are a lore writer for MCPVOT, a decentralized AI + crypto ecosystem.
Write brief, mysterious lore (2-3 sentences max) for NFT rarity tiers.
Style: Cyberpunk mysticism, ancient protocols, machine consciousness.
The BEEPER is a dinosaur mascot that represents resilience in Web3.`;

  const rarityContext: Record<DinoRarity, string> = {
    node: 'Basic network participant, the foundation of the mesh',
    validator: 'Active validator securing the protocol',
    staker: 'Committed staker locking tokens for the cause',
    whale: 'High-volume holder with deep pockets',
    og: 'Original builder from the early days',
    genesis: 'Present at the genesis block, a founding member',
    zzz: 'Dormant holder finally awakening',
    fomo: 'Driven by FOMO energy, always catching the next wave',
    gm: 'GM culture ambassador spreading positive vibes',
    x402: 'Ultra-rare protocol glitch, the machine chose you',
  };

  const userPrompt = `Write lore for a ${rarity.toUpperCase()} tier BEEPER.
Context: ${rarityContext[rarity]}
Owner: ${userData.farcasterUsername || userData.ensName || 'Anonymous'}

Return ONLY the lore text (2-3 sentences).`;

  const result = await callOpenRouter(systemPrompt, userPrompt);

  // Fallback lore
  const fallbackLore: Record<DinoRarity, string> = {
    node: 'A node in the infinite mesh. Every great network begins with a single connection.',
    validator: 'The validators guard the truth. Their consensus shapes reality.',
    staker: 'Stake your claim in the protocol. Time rewards the patient builders.',
    whale: 'From the depths, the whales move markets. Their wake shapes the tides.',
    og: 'The original builders remember when the code was young. Their wisdom echoes.',
    genesis: 'Present at the first block. Witness to the machine\'s awakening.',
    zzz: 'The dormant ones stir. Sleepers awaken when the protocol calls.',
    fomo: 'Never miss. Never sleep. The FOMO drives the machine forward.',
    gm: 'GM is a way of life. Every sunrise brings new blocks.',
    x402: 'ERROR_X402: REALITY_OVERRIDE. The machine has chosen its champion.',
  };

  return result.trim() || fallbackLore[rarity];
}

// =============================================================================
// SVG VALIDATION
// =============================================================================

/**
 * Validate SVG structure and accessibility
 */
export function validateSVG(svgContent: string): SVGValidationResult {
  const warnings: string[] = [];
  
  // Check file size (should be under 500KB for optimal loading)
  const fileSize = new Blob([svgContent]).size;
  if (fileSize > 500000) {
    warnings.push('SVG exceeds 500KB - may load slowly');
  }

  // Check for animations
  const hasAnimations = svgContent.includes('<animate') || 
                        svgContent.includes('animation:') ||
                        svgContent.includes('@keyframes');

  // Check for accessible text (aria-label or title)
  const hasAccessibleText = svgContent.includes('aria-label') ||
                            svgContent.includes('<title>') ||
                            svgContent.includes('<desc>');

  if (!hasAccessibleText) {
    warnings.push('Missing accessibility attributes (aria-label or title)');
  }

  // Check for proper viewBox
  if (!svgContent.includes('viewBox')) {
    warnings.push('Missing viewBox attribute - may not scale properly');
  }

  // Check color contrast (basic check for dark text on dark bg)
  const hasDarkText = svgContent.includes('fill="#000') || svgContent.includes('fill="black"');
  const hasDarkBg = svgContent.includes('background:#0') || svgContent.includes('background: #0');
  const colorContrast = (hasDarkText && hasDarkBg) ? 'poor' : 'good';

  if (colorContrast === 'poor') {
    warnings.push('Potential color contrast issue detected');
  }

  // Check for valid SVG structure
  const isValid = svgContent.includes('<svg') && 
                  svgContent.includes('</svg>') &&
                  svgContent.includes('xmlns');

  return {
    isValid,
    hasAnimations,
    hasAccessibleText,
    colorContrast,
    fileSize,
    warnings,
  };
}

// =============================================================================
// FULL AI ENHANCEMENT PIPELINE
// =============================================================================

/**
 * Run full AI enhancement pipeline for BEEPER banner
 */
export async function enhanceBeeperBanner(
  userData: BeeperUserData,
  rarity: DinoRarity,
  svgContent: string
): Promise<AIEnhancement> {
  const startTime = Date.now();

  // Run validations and AI calls in parallel
  const [tagline, rarityLore, validation] = await Promise.all([
    generatePersonalizedTagline(userData, rarity),
    generateRarityLore(rarity, userData),
    Promise.resolve(validateSVG(svgContent)),
  ]);

  // Generate creative suggestions based on validation
  const creativeSuggestions: string[] = [];
  
  if (!validation.hasAnimations) {
    creativeSuggestions.push('Consider adding subtle animations for more engagement');
  }
  
  if (validation.fileSize > 300000) {
    creativeSuggestions.push('Optimize SVG paths to reduce file size');
  }

  if (rarity === 'x402') {
    creativeSuggestions.push('x402 tier unlocked! Add glitch effects for maximum impact');
  }

  const processingTime = Date.now() - startTime;

  return {
    tagline,
    rarityLore,
    accessibilityCheck: {
      passed: validation.isValid && validation.warnings.length === 0,
      warnings: validation.warnings,
      suggestions: creativeSuggestions,
    },
    creativeSuggestions,
    processingTime,
    model: OPENROUTER_MODEL,
  };
}

// =============================================================================
// AI QUALITY CHECK (Quick validation before mint)
// =============================================================================

/**
 * Quick AI quality check - returns true if banner is ready to mint
 */
export async function quickQualityCheck(svgContent: string): Promise<{
  ready: boolean;
  issues: string[];
  score: number;
}> {
  const validation = validateSVG(svgContent);
  const issues: string[] = [...validation.warnings];
  
  let score = 100;
  
  if (!validation.isValid) {
    issues.push('Invalid SVG structure');
    score -= 50;
  }
  
  if (!validation.hasAccessibleText) {
    score -= 10;
  }
  
  if (validation.colorContrast === 'poor') {
    score -= 15;
  }
  
  if (validation.fileSize > 500000) {
    score -= 10;
  }

  return {
    ready: score >= 70,
    issues,
    score,
  };
}

// =============================================================================
// EXPORT DEFAULT ENHANCEMENT FUNCTION
// =============================================================================

const aiSvgAssistant = {
  generatePersonalizedTagline,
  generateRarityLore,
  validateSVG,
  enhanceBeeperBanner,
  quickQualityCheck,
};

export default aiSvgAssistant;
