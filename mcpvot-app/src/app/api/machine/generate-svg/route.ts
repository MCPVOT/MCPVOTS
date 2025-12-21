import { callOpenRouter, isOpenRouterConfigured } from '@/lib/openrouter-service';
import { CATEGORY_PALETTES, generateIdentityBanner } from '@/lib/svg-machine/templates/banner-template';
import { fetchAllUserData, type UserData } from '@/lib/svg-machine/templates/user-data-fetcher';
import { generateVOTHTMLPage, type VOTPageData } from '@/lib/svg-machine/templates/vot-html-page';
import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// VOT MACHINE PAGE/BANNER GENERATOR
// =============================================================================
// Generates personalized HTML pages or SVG banners using the existing template system
// Uses: user-data-fetcher.ts for data, vot-html-page.ts for full pages,
//       banner-template.ts for identity banners, OpenRouter for LLM enhancement
// =============================================================================

// Valid categories from the template system
const VALID_CATEGORIES = [
  'vot', 'maxx', 'warplet', 'mcpvot', 'base', 
  'farcaster', 'ens', 'defi', 'gaming', 'minimal',
  'burn', 'x402', 'ai', 'cyberpunk', 'quantum'
] as const;

type Category = typeof VALID_CATEGORIES[number];

interface GenerateRequest {
  address: string;
  category?: Category;
  tokenId?: number;
  outputType?: 'page' | 'banner' | 'both';
  userPrompt?: string;
  forceCategory?: boolean;
  useLLM?: boolean;  // Enable OpenRouter LLM enhancement
}

// Suppress unused variable warning - CATEGORY_PALETTES used for type reference
void CATEGORY_PALETTES;

/**
 * Auto-detect best category based on user's assets
 */
function detectCategory(userData: UserData): Category {
  // Warplet NFT holder gets warplet theme
  if (userData.hasWarpletNFT) return 'warplet';
  
  // Maxxvatar holder gets maxx theme
  if (userData.hasMaxxvatars) return 'maxx';
  
  // ENS holder with text records gets ens theme
  if (userData.ensName && userData.ensRecords) return 'ens';
  
  // Basename holder gets base theme
  if (userData.basename) return 'base';
  
  // Farcaster user gets farcaster theme
  if (userData.farcasterFid) return 'farcaster';
  
  // High VOT holder gets vot theme
  const votBalance = parseFloat(userData.votBalance || '0');
  if (votBalance > 10000) return 'vot';
  
  // High MAXX holder gets maxx theme
  const maxxBalance = parseFloat(userData.maxxBalance || '0');
  if (maxxBalance > 1000) return 'maxx';
  
  // Default: mcpvot
  return 'mcpvot';
}

/**
 * Calculate user tier based on traits
 */
function calculateTier(userData: UserData): string {
  let traitCount = 0;
  
  if (parseFloat(userData.votBalance || '0') > 0) traitCount++;
  if (parseFloat(userData.maxxBalance || '0') > 0) traitCount++;
  if (userData.hasMaxxvatars) traitCount++;
  if (userData.hasWarpletNFT) traitCount++;
  if (userData.ensName) traitCount++;
  if (userData.basename) traitCount++;
  if (userData.farcasterFid) traitCount++;
  
  if (traitCount >= 6) return 'Oracle';
  if (traitCount >= 5) return 'Architek';
  if (traitCount >= 4) return 'MCPVOT';
  if (traitCount >= 3) return 'Warplet';
  if (traitCount >= 2) return 'Base';
  if (traitCount >= 1) return 'Farcaster';
  return 'Initiate';
}

/**
 * Generate personalized tagline
 */
function generateTagline(userData: UserData, category: Category): string {
  if (userData.hasMaxxvatars) return 'MAXXVATAR HOLDER • MCPVOT ECOSYSTEM';
  if (userData.hasWarpletNFT) return 'WARPLET VERIFIED • BASE NATIVE';
  if (userData.ensName) return `${userData.ensName.toUpperCase()} • ENS IDENTITY`;
  if (userData.basename) return `${userData.basename.toUpperCase()} • BASE BUILDER`;
  if (userData.farcasterUsername) return `@${userData.farcasterUsername.toUpperCase()} • FARCASTER`;
  return `${category.toUpperCase()} • VOT MACHINE`;
}

/**
 * Generate personalized welcome message
 */
function generateWelcome(userData: UserData): string {
  const tier = calculateTier(userData);
  return `${tier} Tier Builder in the MCPVOT Ecosystem`;
}

/**
 * Use OpenRouter LLM to generate a personalized bio based on user's identity
 */
async function generateLLMBio(userData: UserData, category: Category): Promise<string | undefined> {
  if (!isOpenRouterConfigured()) {
    console.log('[VOT Machine] OpenRouter not configured, using default bio');
    return undefined;
  }
  
  try {
    const traits: string[] = [];
    if (userData.ensName) traits.push(`ENS: ${userData.ensName}`);
    if (userData.basename) traits.push(`Basename: ${userData.basename}`);
    if (userData.farcasterUsername) traits.push(`Farcaster: @${userData.farcasterUsername}`);
    if (userData.hasMaxxvatars) traits.push('Maxxvatars NFT holder');
    if (userData.hasWarpletNFT) traits.push('Warplet NFT holder');
    if (parseFloat(userData.votBalance || '0') > 0) traits.push(`VOT holder: ${userData.votBalanceFormatted}`);
    if (parseFloat(userData.maxxBalance || '0') > 0) traits.push(`MAXX holder: ${userData.maxxBalanceFormatted}`);
    
    const tier = calculateTier(userData);
    
    const response = await callOpenRouter({
      prompt: `Generate a short, impactful cyberpunk-themed bio (max 100 chars) for this Web3 builder:
Name: ${userData.displayName}
Tier: ${tier}
Category: ${category}
Traits: ${traits.join(', ')}
${userData.farcasterProfile?.bio ? `Current bio: ${userData.farcasterProfile.bio}` : ''}

Make it memorable, use emojis sparingly. Output ONLY the bio text, no quotes.`,
      taskType: 'generate_bio',
      templateCategory: category as 'vot' | 'mcpvot' | 'base' | 'farcaster' | 'ens',
      context: {
        ensName: userData.ensName || userData.basename,
      },
    });
    
    if (response.success && response.content) {
      console.log(`[VOT Machine] LLM bio generated using ${response.model}`);
      return response.content.trim().replace(/^["']|["']$/g, ''); // Remove quotes
    }
  } catch (error) {
    console.warn('[VOT Machine] LLM bio generation failed:', error);
  }
  return undefined;
}

/**
 * Use OpenRouter LLM to generate custom boot messages
 */
async function generateLLMBootMessages(userData: UserData, category: Category): Promise<string[] | undefined> {
  if (!isOpenRouterConfigured()) {
    return undefined;
  }
  
  try {
    const tier = calculateTier(userData);
    
    const response = await callOpenRouter({
      prompt: `Generate 5 cyberpunk terminal boot messages for this user's VOT Machine NFT:
Name: ${userData.displayName}
Tier: ${tier}
Category: ${category.toUpperCase()}
${userData.ensName ? `ENS: ${userData.ensName}` : ''}
${userData.farcasterUsername ? `Farcaster: @${userData.farcasterUsername}` : ''}
${userData.hasMaxxvatars ? 'Has Maxxvatar NFT' : ''}

Format: Each line starts with "> " prefix. Include system status, identity verification, trait detection.
Output ONLY the 5 lines, one per line, no numbering.`,
      taskType: 'generate_bio',
      templateCategory: category as 'vot' | 'mcpvot' | 'base' | 'farcaster' | 'ens',
    });
    
    if (response.success && response.content) {
      const lines = response.content.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .slice(0, 6);
      if (lines.length >= 3) {
        console.log(`[VOT Machine] LLM boot messages generated using ${response.model}`);
        return lines;
      }
    }
  } catch (error) {
    console.warn('[VOT Machine] LLM boot messages failed:', error);
  }
  return undefined;
}

/**
 * Generate personalized boot messages (with optional LLM enhancement)
 */
async function generateBootMessages(userData: UserData, category: Category, useLLM = false): Promise<string[]> {
  // Try LLM first if enabled
  if (useLLM) {
    const llmMessages = await generateLLMBootMessages(userData, category);
    if (llmMessages) return llmMessages;
  }
  
  // Fallback to static generation
  const messages = [
    '> INITIALIZING VOT MACHINE...',
    `> CATEGORY: ${category.toUpperCase()}`,
    `> LOADING ${userData.displayName.toUpperCase()}...`,
  ];
  
  if (userData.hasMaxxvatars && userData.maxxvatarTokenIds?.[0]) {
    messages.push(`> MAXXVATAR #${userData.maxxvatarTokenIds[0]} DETECTED`);
  }
  if (userData.hasWarpletNFT) {
    messages.push('> WARPLET NFT VERIFIED');
  }
  if (userData.ensName) {
    messages.push(`> ENS: ${userData.ensName}`);
  }
  if (userData.basename) {
    messages.push(`> BASENAME: ${userData.basename}`);
  }
  if (userData.farcasterUsername) {
    messages.push(`> FARCASTER: @${userData.farcasterUsername}`);
  }
  
  const votBalance = parseFloat(userData.votBalance || '0');
  if (votBalance > 0) {
    messages.push(`> VOT BALANCE: ${userData.votBalanceFormatted}`);
  }
  
  messages.push('> SYSTEM READY');
  messages.push(`> TIER: ${calculateTier(userData).toUpperCase()}`);
  
  return messages;
}

/**
 * Convert UserData to VOTPageData for HTML page generation (with optional LLM enhancement)
 */
async function userDataToPageData(
  userData: UserData, 
  category: Category, 
  tokenId?: number,
  useLLM = false
): Promise<VOTPageData> {
  // Generate boot messages (with LLM if enabled)
  const bootMessages = await generateBootMessages(userData, category, useLLM);
  
  // Generate LLM bio if enabled
  let description = userData.description;
  if (useLLM && !description) {
    const llmBio = await generateLLMBio(userData, category);
    if (llmBio) description = llmBio;
  }
  
  return {
    // Required fields
    address: userData.address,
    addressShort: userData.addressShort,
    displayName: userData.displayName,
    votBalance: userData.votBalance,
    votBalanceFormatted: userData.votBalanceFormatted,
    maxxBalance: userData.maxxBalance,
    maxxBalanceFormatted: userData.maxxBalanceFormatted,
    hasWarpletNFT: userData.hasWarpletNFT,
    warpletTokenIds: userData.warpletTokenIds,
    links: userData.links,
    fetchedAt: userData.fetchedAt,
    source: userData.source,
    
    // Optional identity
    basename: userData.basename,
    ensName: userData.ensName,
    farcasterUsername: userData.farcasterUsername,
    farcasterFid: userData.farcasterFid,
    farcasterPfp: userData.farcasterPfp,
    description,
    avatar: userData.avatar,
    banner: userData.banner,
    ensRecords: userData.ensRecords,
    farcasterProfile: userData.farcasterProfile,
    
    // Maxxvatars
    hasMaxxvatars: userData.hasMaxxvatars,
    maxxvatarTokenIds: userData.maxxvatarTokenIds,
    maxxvatarMetadata: userData.maxxvatarMetadata,
    holdings: userData.holdings,
    
    // VOT Machine specific
    tokenId,
    category,
    mintDate: new Date(),
    
    // Uniqueness
    uniqueness: {
      tagline: generateTagline(userData, category),
      welcomeMessage: generateWelcome(userData),
      bootMessages,
    },
  };
}

// =============================================================================
// API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { address, category: requestedCategory, tokenId, outputType = 'both', forceCategory, useLLM = false } = body;
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }
    
    console.log(`[VOT Machine] Fetching data for ${address}... (LLM: ${useLLM ? 'enabled' : 'disabled'})`);
    const userData = await fetchAllUserData(address);
    
    // Determine category
    let category: Category = 'mcpvot';
    if (requestedCategory && VALID_CATEGORIES.includes(requestedCategory)) {
      category = requestedCategory;
    } else if (!forceCategory) {
      category = detectCategory(userData);
    }
    
    const tier = calculateTier(userData);
    const llmConfigured = isOpenRouterConfigured();
    console.log(`[VOT Machine] Category: ${category}, Tier: ${tier}, OpenRouter: ${llmConfigured ? 'configured' : 'not configured'}`);
    
    const result: {
      success: boolean;
      category: Category;
      tier: string;
      llmUsed: boolean;
      userData: Partial<UserData>;
      page?: string;
      banner?: string;
    } = {
      success: true,
      category,
      tier,
      llmUsed: useLLM && llmConfigured,
      userData: {
        address: userData.address,
        displayName: userData.displayName,
        ensName: userData.ensName,
        basename: userData.basename,
        farcasterUsername: userData.farcasterUsername,
        farcasterFid: userData.farcasterFid,
        avatar: userData.avatar,
        votBalanceFormatted: userData.votBalanceFormatted,
        maxxBalanceFormatted: userData.maxxBalanceFormatted,
        hasMaxxvatars: userData.hasMaxxvatars,
        maxxvatarTokenIds: userData.maxxvatarTokenIds,
        hasWarpletNFT: userData.hasWarpletNFT,
        farcasterProfile: userData.farcasterProfile,
        source: userData.source,
      },
    };
    
    // Generate HTML page (with optional LLM enhancement)
    if (outputType === 'page' || outputType === 'both') {
      const pageData = await userDataToPageData(userData, category, tokenId, useLLM && llmConfigured);
      result.page = generateVOTHTMLPage(pageData);
    }
    
    // Generate banner SVG
    if (outputType === 'banner' || outputType === 'both') {
      result.banner = generateIdentityBanner({
        category,
        userData,
        gaugeLabel: 'TIER',
        gaugeValue: tier.toUpperCase(),
        radarLabel: 'STATUS',
        radarValue: 'ACTIVE',
        badgeText: category.toUpperCase(),
      });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[VOT Machine] Error:', error);
    return NextResponse.json({ error: 'Generation failed', details: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
  if (address) {
    try {
      const userData = await fetchAllUserData(address);
      return NextResponse.json({
        success: true,
        address,
        displayName: userData.displayName,
        category: detectCategory(userData),
        tier: calculateTier(userData),
        traits: {
          ens: !!userData.ensName,
          basename: !!userData.basename,
          farcaster: !!userData.farcasterFid,
          maxxvatar: userData.hasMaxxvatars,
          warplet: userData.hasWarpletNFT,
          vot: parseFloat(userData.votBalance || '0') > 0,
          maxx: parseFloat(userData.maxxBalance || '0') > 0,
        },
        farcasterProfile: userData.farcasterProfile ? {
          username: userData.farcasterProfile.username,
          displayName: userData.farcasterProfile.displayName,
          bio: userData.farcasterProfile.bio,
          followerCount: userData.farcasterProfile.followerCount,
          followingCount: userData.farcasterProfile.followingCount,
          verifiedAccounts: userData.farcasterProfile.verifiedAccounts,
        } : null,
        balances: { vot: userData.votBalanceFormatted, maxx: userData.maxxBalanceFormatted },
        avatar: userData.avatar,
        maxxvatarImage: userData.maxxvatarMetadata?.[0]?.imageUri,
      });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }
  
  return NextResponse.json({
    service: 'VOT Machine Generator',
    version: '3.1',
    categories: VALID_CATEGORIES,
    dataSources: ['ENS', 'Basename', 'Farcaster', 'Maxxvatars NFT', 'VOT/MAXX tokens'],
    llm: {
      configured: isOpenRouterConfigured(),
      provider: 'OpenRouter',
      features: ['bio_generation', 'boot_messages', 'page_enhancement'],
    },
    usage: {
      GET: 'GET /api/machine/generate-svg?address=0x... - Preview user data',
      POST: 'POST /api/machine/generate-svg { address, category?, useLLM?, outputType? } - Generate page/banner',
    },
  });
}
