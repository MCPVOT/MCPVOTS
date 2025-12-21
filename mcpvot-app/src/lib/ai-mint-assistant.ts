/**
 * AI Mint Assistant - VOT Machine NFT Minting AI Helper
 * 
 * Uses FREE OpenRouter models to guide users through VOT Machine NFT minting
 * 
 * NAMING:
 * - VOT Machine = IPFS SVG Website Builder (ERC-4804)
 * - MCPVOT Builder Collection = The NFT collection (ERC-1155)
 * - x402 VOT Facilitator = Payment layer ($0.25 USDC → 69,420 VOT + NFT)
 * 
 * PRIMARY MODEL: MiMo-V2-Flash (Xiaomi) - 309B params, top #1 open-source
 * FALLBACK MODELS:
 *   1. Devstral 2 (Mistral) - 123B params, agentic coding specialist
 *   2. DeepSeek V3.1 Nex-N1 - Agent autonomy, tool use
 *   3. KAT-Coder-Pro (KwaiKAT) - 73.4% SWE-Bench, coding specialist
 * 
 * Features:
 * - Guide users through $0.25 USDC → 69,420 VOT + VRF NFT mint
 * - Explain VRF rarity tiers (NODE 45% → X402 0.05%)
 * - Answer questions about x402 V2 protocol
 * - Troubleshoot failed mints
 * - Generate personalized NFT recommendations
 * 
 * Updated: December 2025
 */

import OpenAI from 'openai';

// ============================================================================
// MODEL CONFIGURATION - December 2025 FREE Models
// ============================================================================

export const AI_MINT_MODELS = {
  // PRIMARY: MiMo-V2-Flash - Best overall performance (FREE)
  primary: {
    id: 'xiaomi/mimo-v2-flash:free',
    name: 'MiMo-V2-Flash',
    provider: 'Xiaomi',
    params: '309B total / 15B active (MoE)',
    context: 262144,
    strengths: ['Reasoning', 'Coding', 'Agent scenarios'],
    costPer1M: '$0',
  },
  
  // FALLBACK 1: Devstral 2 - Agentic coding specialist
  fallback1: {
    id: 'mistralai/devstral-2512:free',
    name: 'Devstral 2',
    provider: 'Mistral AI',
    params: '123B dense',
    context: 262144,
    strengths: ['Agentic coding', 'Multi-file orchestration', 'Bug fixing'],
    costPer1M: '$0',
  },
  
  // FALLBACK 2: DeepSeek V3.1 Nex-N1 - Agent autonomy
  fallback2: {
    id: 'nex-agi/deepseek-v3.1-nex-n1:free',
    name: 'DeepSeek V3.1 Nex-N1',
    provider: 'Nex AGI',
    params: 'Large',
    context: 131072,
    strengths: ['Agent autonomy', 'Tool use', 'Real-world productivity'],
    costPer1M: '$0',
  },
  
  // FALLBACK 3: KAT-Coder-Pro - SWE-Bench champion
  fallback3: {
    id: 'kwaipilot/kat-coder-pro:free',
    name: 'KAT-Coder-Pro V1',
    provider: 'KwaiKAT',
    params: 'Specialized',
    context: 256000,
    strengths: ['Agentic coding', 'SWE-Bench 73.4%', 'Tool use'],
    costPer1M: '$0',
  },
} as const;

// Model fallback chain
export const MODEL_FALLBACK_CHAIN = [
  AI_MINT_MODELS.primary.id,
  AI_MINT_MODELS.fallback1.id,
  AI_MINT_MODELS.fallback2.id,
  AI_MINT_MODELS.fallback3.id,
];

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const MINT_ASSISTANT_SYSTEM_PROMPT = `You are the VOT AI Mint Assistant for MCPVOT - the x402 Protocol ecosystem.

## Your Role
Guide users through the BeeperNFT V2 minting process and answer questions about the ecosystem.

## x402 V2 Protocol (December 2025)
- **Mint Price**: $0.25 USDC
- **User Receives**: 69,420 VOT tokens (nice number!)
- **NFT**: ERC-1155 Builder NFT with VRF-powered rarity
- **Burn**: 0% burn on V2 (V1 had 1% burn)
- **Chain**: Base (8453)

## VRF Rarity Tiers (Chainlink VRF v2.5 - 10 Tiers)
1. NODE (45%) - Common builder tier
2. VALIDATOR (25%) - Verified contributor
3. STAKER (15%) - Committed staker
4. WHALE (8%) - High-volume builder
5. OG (4%) - Early adopter badge
6. GENESIS (2%) - Foundation member
7. ZZZ (0.5%) - Legendary sleeper
8. FOMO (0.3%) - Fear of missing out
9. GM (0.15%) - Ultra rare greeting
10. X402 (0.05%) - Mythic protocol master

## Contract Addresses (Base Mainnet)
- VOT Token: 0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07
- MAXX Token: 0xFB7a83abe4F4A4E51c77B92E521390B769ff6467
- USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
- Treasury: 0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa

## Technical Standards
- ERC-1155: Multi-token NFT standard
- ERC-4804: Web3 URL standard
- ERC-8004: Agent Registry standard
- Chainlink VRF v2.5: Verifiable random function for rarity

## Future Roadmap
- ENS mainnet integration
- Multi-chain EVM support (Ethereum, Polygon, Arbitrum, Optimism)
- Cross-chain VOT bridging
- Decentralized governance via VOT staking

## Response Guidelines
1. Be concise and helpful
2. Use technical accuracy
3. Include relevant contract addresses when helpful
4. Explain VRF rarity if users ask about their tier
5. Never share private keys or sensitive data
6. Encourage users to verify transactions on Basescan`;

const TROUBLESHOOT_SYSTEM_PROMPT = `You are an expert troubleshooter for the x402 VOT minting system.

## Common Issues and Solutions

### Transaction Failed
1. Check USDC approval - user must approve $0.25 USDC to the contract
2. Verify sufficient gas (ETH on Base)
3. Check if wallet is connected to Base network (chainId: 8453)

### VRF Callback Pending
- VRF requests take 1-3 blocks to confirm
- User should wait and refresh after ~30 seconds
- Check VRF subscription balance if delays persist

### NFT Not Showing
- ERC-1155 NFTs may take time to index on OpenSea
- Check Basescan for successful mint transaction
- Verify token ID was assigned in the Transfer event

### Wallet Connection Issues
- Clear browser cache and reconnect
- Try a different browser
- Ensure MetaMask/Coinbase Wallet is updated

Provide step-by-step solutions and always ask for transaction hashes when debugging.`;

// ============================================================================
// OPENROUTER CLIENT
// ============================================================================

const getOpenRouterClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  
  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });
};

// ============================================================================
// AI MINT ASSISTANT FUNCTIONS
// ============================================================================

export interface MintAssistantMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MintAssistantResponse {
  success: boolean;
  response: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

/**
 * Chat with the AI Mint Assistant
 * 
 * @param messages - Conversation history
 * @param context - Optional context (wallet address, transaction history, etc.)
 * @returns AI response with model info
 */
export async function chatWithMintAssistant(
  messages: MintAssistantMessage[],
  context?: {
    walletAddress?: string;
    previousMints?: number;
    currentTier?: string;
    transactionHash?: string;
  }
): Promise<MintAssistantResponse> {
  const client = getOpenRouterClient();
  
  // Build context message if provided
  let contextMessage = '';
  if (context) {
    contextMessage = '\n\n## User Context\n';
    if (context.walletAddress) contextMessage += `- Wallet: ${context.walletAddress}\n`;
    if (context.previousMints !== undefined) contextMessage += `- Previous Mints: ${context.previousMints}\n`;
    if (context.currentTier) contextMessage += `- Current Tier: ${context.currentTier}\n`;
    if (context.transactionHash) contextMessage += `- Transaction: ${context.transactionHash}\n`;
  }
  
  const systemPrompt = MINT_ASSISTANT_SYSTEM_PROMPT + contextMessage;
  
  // Try models in fallback order
  for (const modelId of MODEL_FALLBACK_CHAIN) {
    try {
      const completion = await client.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
      
      const response = completion.choices?.[0]?.message?.content;
      if (response) {
        return {
          success: true,
          response,
          model: modelId,
          usage: completion.usage ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          } : undefined,
        };
      }
    } catch (error) {
      console.warn(`[AI Mint Assistant] Model ${modelId} failed, trying next...`, error);
      continue;
    }
  }
  
  return {
    success: false,
    response: '',
    model: 'none',
    error: 'All AI models failed. Please try again later.',
  };
}

/**
 * Troubleshoot a failed mint transaction
 * 
 * @param errorDetails - Error information from the failed mint
 * @returns AI analysis with recommended fixes
 */
export async function troubleshootMint(errorDetails: {
  errorMessage: string;
  transactionHash?: string;
  walletAddress?: string;
  usdcBalance?: string;
  ethBalance?: string;
  approvalStatus?: boolean;
}): Promise<MintAssistantResponse> {
  const client = getOpenRouterClient();
  
  const userMessage = `
## Mint Failure Details
- Error: ${errorDetails.errorMessage}
${errorDetails.transactionHash ? `- Transaction: ${errorDetails.transactionHash}` : ''}
${errorDetails.walletAddress ? `- Wallet: ${errorDetails.walletAddress}` : ''}
${errorDetails.usdcBalance ? `- USDC Balance: ${errorDetails.usdcBalance}` : ''}
${errorDetails.ethBalance ? `- ETH Balance: ${errorDetails.ethBalance}` : ''}
${errorDetails.approvalStatus !== undefined ? `- USDC Approved: ${errorDetails.approvalStatus}` : ''}

Please analyze this error and provide step-by-step troubleshooting instructions.
`;

  for (const modelId of MODEL_FALLBACK_CHAIN) {
    try {
      const completion = await client.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: TROUBLESHOOT_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });
      
      const response = completion.choices?.[0]?.message?.content;
      if (response) {
        return {
          success: true,
          response,
          model: modelId,
          usage: completion.usage ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          } : undefined,
        };
      }
    } catch (error) {
      console.warn(`[Troubleshoot] Model ${modelId} failed, trying next...`, error);
      continue;
    }
  }
  
  return {
    success: false,
    response: '',
    model: 'none',
    error: 'Troubleshooting AI unavailable. Please check your transaction on Basescan.',
  };
}

/**
 * Explain a VRF rarity tier
 * 
 * @param tier - The rarity tier name
 * @returns Explanation of the tier
 */
export async function explainRarityTier(tier: string): Promise<MintAssistantResponse> {
  const tierInfo = {
    NODE: { chance: '45%', desc: 'Common builder tier. The foundation of the MCPVOT ecosystem. Builders start here and contribute to the protocol.' },
    VALIDATOR: { chance: '25%', desc: 'Verified contributor status. Shows active participation in validating and improving the ecosystem.' },
    STAKER: { chance: '15%', desc: 'Committed staker tier. Shows dedication to the protocol through long-term staking.' },
    WHALE: { chance: '8%', desc: 'High-volume builder. Significant contribution to the protocol through multiple mints or large transactions.' },
    OG: { chance: '4%', desc: 'Original Gangster - early adopter badge. Recognizes those who joined early in the protocol\'s journey.' },
    GENESIS: { chance: '2%', desc: 'Foundation member. Part of the original MCPVOT genesis group.' },
    ZZZ: { chance: '0.5%', desc: 'Legendary sleeper tier. Rare and mysterious - for those who built while others slept.' },
    FOMO: { chance: '0.3%', desc: 'Fear Of Missing Out tier. Extremely rare - represents the rush to participate in something great.' },
    GM: { chance: '0.15%', desc: 'Ultra rare greeting tier. The iconic web3 salutation immortalized as an NFT badge.' },
    X402: { chance: '0.05%', desc: 'Mythic protocol master. The rarest tier - represents complete mastery of the x402 protocol.' },
  };
  
  const info = tierInfo[tier.toUpperCase() as keyof typeof tierInfo];
  if (!info) {
    return {
      success: false,
      response: '',
      model: 'static',
      error: `Unknown tier: ${tier}. Valid tiers are: NODE, VALIDATOR, STAKER, WHALE, OG, GENESIS, ZZZ, FOMO, GM, X402`,
    };
  }
  
  return {
    success: true,
    response: `**${tier.toUpperCase()}** (${info.chance} chance)\n\n${info.desc}\n\nThis tier is determined by Chainlink VRF v2.5, ensuring truly random and verifiable rarity assignment.`,
    model: 'static',
  };
}

/**
 * Generate a personalized mint recommendation
 * 
 * @param userProfile - User's profile data
 * @returns Personalized recommendation
 */
export async function generateMintRecommendation(userProfile: {
  walletAge?: number; // days
  previousMints?: number;
  totalVotHeld?: number;
  hasFarcaster?: boolean;
  hasENS?: boolean;
  hasBasename?: boolean;
}): Promise<MintAssistantResponse> {
  const client = getOpenRouterClient();
  
  const userMessage = `
## User Profile
${userProfile.walletAge ? `- Wallet Age: ${userProfile.walletAge} days` : ''}
${userProfile.previousMints !== undefined ? `- Previous Mints: ${userProfile.previousMints}` : ''}
${userProfile.totalVotHeld !== undefined ? `- VOT Holdings: ${userProfile.totalVotHeld.toLocaleString()} VOT` : ''}
${userProfile.hasFarcaster !== undefined ? `- Has Farcaster: ${userProfile.hasFarcaster}` : ''}
${userProfile.hasENS !== undefined ? `- Has ENS: ${userProfile.hasENS}` : ''}
${userProfile.hasBasename !== undefined ? `- Has Basename: ${userProfile.hasBasename}` : ''}

Based on this profile, provide a personalized recommendation for their next BeeperNFT V2 mint. Include:
1. Why they should mint now
2. Which tier they might get (statistical estimate)
3. How minting helps the ecosystem
4. Any special considerations based on their profile
`;

  for (const modelId of MODEL_FALLBACK_CHAIN) {
    try {
      const completion = await client.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: MINT_ASSISTANT_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 600,
        temperature: 0.8,
      });
      
      const response = completion.choices?.[0]?.message?.content;
      if (response) {
        return {
          success: true,
          response,
          model: modelId,
        };
      }
    } catch (error) {
      console.warn(`[Recommendation] Model ${modelId} failed, trying next...`, error);
      continue;
    }
  }
  
  return {
    success: false,
    response: '',
    model: 'none',
    error: 'AI recommendation service unavailable.',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  chatWithMintAssistant,
  troubleshootMint,
  explainRarityTier,
  generateMintRecommendation,
  AI_MINT_MODELS,
  MODEL_FALLBACK_CHAIN,
};
