/**
 * VOT Machine - AI Enhancement API (Refactored v2)
 * 
 * POST /api/machine/ai
 * 
 * BACKEND: Uses centralized /api/openrouter service
 * MODEL: kwaipilot/kat-coder-pro:free (256K context, FREE)
 * 
 * Actions:
 * - analyze: Profile analysis
 * - generate_bio: Create bio/tagline  
 * - suggest_badges: Badge recommendations
 * - nft_metadata: ERC-1155 metadata with AI tagline
 * - engagement: Engagement tips
 * - uniqueness: Full VOT Machine uniqueness (tagline, boot, colors, animations)
 */

import { AI_MODELS, API_VERSION, ECOSYSTEM_INFO, getVOTRank } from '@/lib/constants';
import {
    callOpenRouter,
    generateUniqueTagline,
    generateVOTMachineUniqueness,
    type VOTMachineContext,
} from '@/lib/openrouter-service';
import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// TYPES
// =============================================================================

interface AIRequest {
  action: 'analyze' | 'generate_bio' | 'suggest_badges' | 'nft_metadata' | 'engagement' | 'uniqueness';
  profile: {
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
    badges: Array<{
      id: string;
      name: string;
      emoji: string;
      tier?: string;
      description: string;
    }>;
    ensRecords?: {
      description?: string;
      twitter?: string;
      github?: string;
      url?: string;
    };
  };
  tokenId?: number;
  userPrompt?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function buildProfileContext(profile: AIRequest['profile']): string {
  const parts = [
    `Address: ${profile.address}`,
    `Display Name: ${profile.displayName}`,
  ];

  if (profile.basename) parts.push(`Basename: ${profile.basename}`);
  if (profile.ensName) parts.push(`ENS: ${profile.ensName}`);
  if (profile.farcasterUsername) {
    parts.push(`Farcaster: @${profile.farcasterUsername} (FID: ${profile.farcasterFid})`);
    if (profile.farcasterFollowers) parts.push(`Followers: ${profile.farcasterFollowers}`);
  }

  parts.push(`\nHoldings:`);
  parts.push(`- VOT: ${profile.votBalance}`);
  parts.push(`- MAXX: ${profile.maxxBalance}`);
  parts.push(`- Warplet NFT: ${profile.hasWarpletNFT ? 'Yes ✓' : 'No'}`);

  if (profile.badges.length > 0) {
    parts.push(`\nBadges (${profile.badges.length}):`);
    profile.badges.forEach(b => {
      parts.push(`- ${b.emoji} ${b.name}${b.tier ? ` (${b.tier})` : ''}`);
    });
  }

  return parts.join('\n');
}

function buildMachineContext(profile: AIRequest['profile'], tokenId: number, userPrompt?: string): VOTMachineContext {
  const votNum = parseFloat(profile.votBalance.replace(/,/g, ''));
  return {
    tokenId,
    ensName: profile.ensName,
    basename: profile.basename,
    farcasterUsername: profile.farcasterUsername,
    votBalance: votNum,
    maxxBalance: parseFloat(profile.maxxBalance.replace(/,/g, '')),
    rank: getVOTRank(votNum),
    isWarpletHolder: profile.hasWarpletNFT,
    category: 'vot',
    userPrompt,
  };
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: AIRequest = await request.json();
    
    if (!body.profile || !body.action) {
      return NextResponse.json(
        { error: 'Missing profile or action' },
        { status: 400 }
      );
    }

    const profileContext = buildProfileContext(body.profile);
    const tokenId = body.tokenId || Math.floor(Math.random() * 10000);
    
    switch (body.action) {
      // =========== ANALYZE ===========
      case 'analyze': {
        const result = await callOpenRouter({
          prompt: `Analyze this VOT Machine user profile and provide insights:

${profileContext}

Provide:
1. A brief identity summary (2-3 sentences)
2. Their ecosystem standing (newcomer/active/whale/OG)
3. Key strengths in their profile
4. One suggestion to improve their standing`,
          taskType: 'generate_bio',
          modelPreference: 'quality',
        });
        
        return NextResponse.json({
          success: result.success,
          action: 'analyze',
          result: { analysis: result.content },
          model: result.model,
        });
      }
      
      // =========== GENERATE BIO ===========
      case 'generate_bio': {
        const result = await callOpenRouter({
          prompt: `Generate a Web3-native bio and tagline for this VOT Machine user:

${profileContext}

Create:
1. A short bio (max 160 chars, Twitter-style)
2. A catchy tagline (max 50 chars)

Format:
BIO: [bio text]
TAGLINE: [tagline text]`,
          taskType: 'generate_bio',
          modelPreference: 'quality',
        });
        
        const content = result.content || '';
        const bioMatch = content.match(/BIO:\s*(.+?)(?=TAGLINE:|$)/s);
        const taglineMatch = content.match(/TAGLINE:\s*(.+)/s);
        
        return NextResponse.json({
          success: result.success,
          action: 'generate_bio',
          result: {
            bio: bioMatch?.[1]?.trim() || content,
            tagline: taglineMatch?.[1]?.trim(),
          },
          model: result.model,
        });
      }
      
      // =========== SUGGEST BADGES ===========
      case 'suggest_badges': {
        const result = await callOpenRouter({
          prompt: `Based on this profile, suggest badge priorities for their VOT Machine NFT:

${profileContext}

Provide:
1. Top 3 badges to highlight (in order)
2. Actions to earn better badges
3. Any hidden achievements they qualify for

Format as bullet points.`,
          taskType: 'generate_bio',
          modelPreference: 'quality',
        });
        
        const content = result.content || '';
        const badges = content.split('\n').filter(line => 
          line.trim().startsWith('-') || line.trim().startsWith('•')
        );
        
        return NextResponse.json({
          success: result.success,
          action: 'suggest_badges',
          result: {
            badges,
            insights: [content],
          },
          model: result.model,
        });
      }
      
      // =========== NFT METADATA ===========
      case 'nft_metadata': {
        const ctx = buildMachineContext(body.profile, tokenId);
        const tagline = await generateUniqueTagline(ctx);
        
        // Build attributes
        const attributes = [];
        if (body.profile.badges.length > 0) {
          attributes.push({ trait_type: 'Top Badge', value: body.profile.badges[0].name });
          attributes.push({ trait_type: 'Badge Count', value: body.profile.badges.length.toString() });
        }
        if (body.profile.farcasterUsername) {
          attributes.push({ trait_type: 'Farcaster', value: `@${body.profile.farcasterUsername}` });
        }
        if (body.profile.basename) {
          attributes.push({ trait_type: 'Basename', value: body.profile.basename });
        } else if (body.profile.ensName) {
          attributes.push({ trait_type: 'ENS', value: body.profile.ensName });
        }
        attributes.push({ trait_type: 'Rank', value: ctx.rank });
        
        return NextResponse.json({
          success: true,
          action: 'nft_metadata',
          result: {
            metadata: {
              name: `${body.profile.displayName} | VOT Machine #${tokenId}`,
              description: tagline,
              attributes,
            },
          },
        });
      }
      
      // =========== ENGAGEMENT ===========
      case 'engagement': {
        const result = await callOpenRouter({
          prompt: `Suggest engagement actions for this VOT Machine user:

${profileContext}

Provide 3-5 specific actions to:
1. Increase VOT holdings
2. Improve Farcaster presence
3. Earn more badges
4. Maximize NFT value

Be specific to their current status.`,
          taskType: 'generate_bio',
          modelPreference: 'quality',
        });
        
        const content = result.content || '';
        const insights = content.split('\n').filter(line => line.trim().length > 0);
        
        return NextResponse.json({
          success: result.success,
          action: 'engagement',
          result: { insights },
          model: result.model,
        });
      }
      
      // =========== FULL UNIQUENESS ===========
      case 'uniqueness': {
        const ctx = buildMachineContext(body.profile, tokenId, body.userPrompt);
        const uniqueness = await generateVOTMachineUniqueness(ctx);
        
        return NextResponse.json({
          success: true,
          action: 'uniqueness',
          result: uniqueness,
        });
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${body.action}` },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('VOT Machine AI error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'AI processing failed',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - API Info
// =============================================================================

export async function GET() {
  return NextResponse.json({
    service: 'VOT Machine AI API',
    version: API_VERSION,
    backend: 'src/lib/openrouter-service.ts (centralized)',
    
    model: {
      primary: AI_MODELS.PRIMARY,
      fallback: AI_MODELS.FREE_CHAIN.slice(1),
      context: '256K tokens',
      pricing: 'FREE',
    },
    
    actions: {
      analyze: 'Analyze user profile and provide insights',
      generate_bio: 'Create personalized bio and tagline',
      suggest_badges: 'Recommend badge priorities',
      nft_metadata: 'Generate ERC-1155 metadata with AI tagline',
      engagement: 'Suggest engagement actions',
      uniqueness: 'Full VOT Machine uniqueness (tagline, boot sequence, colors, animations)',
    },
    
    usage: {
      endpoint: 'POST /api/machine/ai',
      example: {
        action: 'uniqueness',
        profile: {
          address: '0x...',
          displayName: 'vitalik.eth',
          votBalance: '100000',
          maxxBalance: '50000',
          hasWarpletNFT: true,
          badges: [],
        },
        tokenId: 42,
        userPrompt: 'make it more cyberpunk',
      },
    },
    
    ecosystem: ECOSYSTEM_INFO,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache GET for 1 hour
    },
  });
}
