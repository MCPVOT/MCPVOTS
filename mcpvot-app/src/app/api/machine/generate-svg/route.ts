import { CATEGORY_PALETTES, generateIdentityBanner } from '@/lib/svg-machine/templates/banner-template';
import { fetchAllUserData, type UserData } from '@/lib/svg-machine/templates/user-data-fetcher';
import { generateVOTHTMLPage, type VOTPageData } from '@/lib/svg-machine/templates/vot-html-page';
import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// VOT MACHINE PAGE/BANNER GENERATOR
// =============================================================================
// Generates personalized HTML pages or SVG banners using the existing template system
// Uses: user-data-fetcher.ts for data, vot-html-page.ts for full pages,
//       banner-template.ts for identity banners
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
 * Generate personalized boot messages
 */
function generateBootMessages(userData: UserData, category: Category): string[] {
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
 * Convert UserData to VOTPageData for HTML page generation
 */
function userDataToPageData(userData: UserData, category: Category, tokenId?: number): VOTPageData {
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
    description: userData.description,
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
      bootMessages: generateBootMessages(userData, category),
    },
  };
}

// =============================================================================
// API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { address, category: requestedCategory, tokenId, outputType = 'both', forceCategory } = body;
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }
    
    console.log(`[VOT Machine] Fetching data for ${address}...`);
    const userData = await fetchAllUserData(address);
    
    // Determine category
    let category: Category = 'mcpvot';
    if (requestedCategory && VALID_CATEGORIES.includes(requestedCategory)) {
      category = requestedCategory;
    } else if (!forceCategory) {
      category = detectCategory(userData);
    }
    
    console.log(`[VOT Machine] Category: ${category}, Tier: ${calculateTier(userData)}`);
    
    const result: {
      success: boolean;
      category: Category;
      tier: string;
      userData: Partial<UserData>;
      page?: string;
      banner?: string;
    } = {
      success: true,
      category,
      tier: calculateTier(userData),
      userData: {
        address: userData.address,
        displayName: userData.displayName,
        ensName: userData.ensName,
        basename: userData.basename,
        farcasterUsername: userData.farcasterUsername,
        avatar: userData.avatar,
        votBalanceFormatted: userData.votBalanceFormatted,
        maxxBalanceFormatted: userData.maxxBalanceFormatted,
        hasMaxxvatars: userData.hasMaxxvatars,
        maxxvatarTokenIds: userData.maxxvatarTokenIds,
        hasWarpletNFT: userData.hasWarpletNFT,
        source: userData.source,
      },
    };
    
    // Generate HTML page
    if (outputType === 'page' || outputType === 'both') {
      const pageData = userDataToPageData(userData, category, tokenId);
      result.page = generateVOTHTMLPage(pageData);
    }
    
    // Generate banner SVG
    if (outputType === 'banner' || outputType === 'both') {
      result.banner = generateIdentityBanner({
        category,
        userData,
        gaugeLabel: 'TIER',
        gaugeValue: calculateTier(userData).toUpperCase(),
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
    version: '3.0',
    categories: VALID_CATEGORIES,
    dataSources: ['ENS', 'Basename', 'Farcaster', 'Maxxvatars NFT', 'VOT/MAXX tokens'],
  });
}
