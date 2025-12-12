/**
 * SVG Machine - User Data Fetcher
 * 
 * Fetches user data from multiple sources:
 * - Basename (.base.eth) via L2 resolver
 * - ENS (.eth) via mainnet
 * - Farcaster (FID, username, pfp) via Neynar API
 * - Token balances (VOT, MAXX)
 * - NFT ownership (Warplet)
 */

import { createPublicClient, http, parseAbi } from 'viem';
import { base, mainnet } from 'viem/chains';

// =============================================================================
// CONTRACTS
// =============================================================================

export const CONTRACTS = {
  // ERC-20 Tokens
  VOT_TOKEN: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07' as const,
  MAXX_TOKEN: '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467' as const,
  USDC_BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
  TREASURY: '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa' as const,
  
  // NFT Collections (ERC-721)
  MAXXVATARS: '0xe6f281582ef180582fff8579cc6bf409837b2d34' as const,  // Base mainnet
  WARPLET_NFT: '0x0000000000000000000000000000000000000000' as const, // TBD - when deployed
  
  // Resolvers
  BASE_L2_RESOLVER: '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' as const,
} as const;

// =============================================================================
// TYPES
// =============================================================================

export interface UserData {
  // Wallet
  address: string;
  addressShort: string;
  
  // Identity
  basename?: string;
  ensName?: string;
  farcasterUsername?: string;
  farcasterFid?: number;
  farcasterPfp?: string;
  
  // Display
  displayName: string;
  title?: string;
  subtitle?: string;
  description?: string;
  avatar?: string;
  banner?: string; // Header/banner image
  
  // ENS Text Records (ENSIP-5)
  ensRecords?: {
    avatar?: string;
    description?: string;
    email?: string;
    url?: string;
    location?: string;
    twitter?: string;    // com.twitter
    github?: string;     // com.github
    discord?: string;    // com.discord
    telegram?: string;   // org.telegram
    reddit?: string;     // com.reddit
    header?: string;     // ENSIP-18 header/banner
    keywords?: string;
    notice?: string;
    contentHash?: string;
  };
  
  // Farcaster Extended Profile
  farcasterProfile?: {
    fid: number;
    username: string;
    displayName?: string;
    bio?: string;
    pfpUrl?: string;
    bannerUrl?: string;
    followerCount?: number;
    followingCount?: number;
    location?: {
      city?: string;
      country?: string;
    };
    verifiedAddresses?: {
      eth: string[];
      sol: string[];
    };
    verifiedAccounts?: Array<{
      platform: string; // 'x', 'github', etc.
      username: string;
    }>;
    score?: number;
  };
  
  // Balances
  votBalance: string;
  votBalanceFormatted: string;
  maxxBalance: string;
  maxxBalanceFormatted: string;
  
  // NFT ownership
  hasWarpletNFT: boolean;
  warpletTokenIds: number[];
  
  // Maxxvatars NFT (Base mainnet - 0xe6f281582ef180582fff8579cc6bf409837b2d34)
  hasMaxxvatars: boolean;
  maxxvatarTokenIds: number[];
  maxxvatarMetadata?: {
    tokenId: number;
    imageUri?: string;
    name?: string;
  }[];
  
  // Token holdings for tier calculation
  holdings?: {
    votBalance: string;
    votFormatted: string;
    maxxBalance: string;
    maxxFormatted: string;
    usdcBalance?: string;
  };
  
  // Links (aggregated from all sources)
  links: {
    website?: string;
    twitter?: string;
    farcaster?: string;
    github?: string;
    discord?: string;
    telegram?: string;
    reddit?: string;
    ens?: string;
    basename?: string;
    [key: string]: string | undefined;
  };
  
  // Metadata
  fetchedAt: number;
  source: 'basename' | 'ens' | 'farcaster' | 'address';
}

// =============================================================================
// CLIENTS
// =============================================================================

const baseClient = createPublicClient({
  chain: base,
  transport: http(),
});

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

// =============================================================================
// ERC20 ABI
// =============================================================================

const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
]);

// =============================================================================
// FETCH FUNCTIONS
// =============================================================================

/**
 * Fetch Basename (.base.eth) for an address
 */
export async function fetchBasename(address: string): Promise<string | undefined> {
  try {
    // Use Base L2 resolver to get reverse resolution
    const response = await fetch(
      `https://resolver-api.basename.app/v1/addresses/${address}/name`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.name; // Returns "name.base.eth"
    }
    
    return undefined;
  } catch (error) {
    console.error('Error fetching Basename:', error);
    return undefined;
  }
}

/**
 * Fetch ENS name (.eth) for an address
 */
export async function fetchENSName(address: string): Promise<string | undefined> {
  try {
    const name = await mainnetClient.getEnsName({
      address: address as `0x${string}`,
    });
    
    return name || undefined;
  } catch (error) {
    console.error('Error fetching ENS:', error);
    return undefined;
  }
}

/**
 * Fetch ENS text records (ENSIP-5) for a name
 * Returns rich profile data: avatar, description, social links, etc.
 */
export async function fetchENSTextRecords(ensName: string): Promise<UserData['ensRecords']> {
  const textRecordKeys = [
    'avatar',
    'description', 
    'email',
    'url',
    'location',
    'com.twitter',
    'com.github',
    'com.discord',
    'org.telegram',
    'com.reddit',
    'header',      // ENSIP-18 banner
    'keywords',
    'notice',
  ];
  
  const records: UserData['ensRecords'] = {};
  
  try {
    // Fetch all text records in parallel
    const results = await Promise.all(
      textRecordKeys.map(async (key) => {
        try {
          const value = await mainnetClient.getEnsText({
            name: ensName,
            key,
          });
          return { key, value };
        } catch {
          return { key, value: null };
        }
      })
    );
    
    // Map results to records object
    for (const { key, value } of results) {
      if (value) {
        switch (key) {
          case 'avatar': records.avatar = value; break;
          case 'description': records.description = value; break;
          case 'email': records.email = value; break;
          case 'url': records.url = value; break;
          case 'location': records.location = value; break;
          case 'com.twitter': records.twitter = value; break;
          case 'com.github': records.github = value; break;
          case 'com.discord': records.discord = value; break;
          case 'org.telegram': records.telegram = value; break;
          case 'com.reddit': records.reddit = value; break;
          case 'header': records.header = value; break;
          case 'keywords': records.keywords = value; break;
          case 'notice': records.notice = value; break;
        }
      }
    }
    
    // Also fetch contenthash if available
    try {
      // Note: contenthash requires different approach, using resolver
      // For now, we'll skip this as it requires additional setup
    } catch {
      // Contenthash not available
    }
    
    return Object.keys(records).length > 0 ? records : undefined;
  } catch (error) {
    console.error('Error fetching ENS text records:', error);
    return undefined;
  }
}

/**
 * Fetch Farcaster profile via Neynar API
 * Returns full extended profile with verified accounts, location, etc.
 */
export async function fetchFarcasterProfile(address: string): Promise<UserData['farcasterProfile'] | undefined> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || process.env.NEYNAR_API_KEY;
    
    if (!apiKey) {
      console.warn('Neynar API key not configured');
      return undefined;
    }
    
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by-verification?address=${address}`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      const user = data.result?.user;
      
      if (user) {
        // Extract verified accounts (X/Twitter, GitHub, etc.)
        const verifiedAccounts: Array<{ platform: string; username: string }> = [];
        if (user.verified_accounts && Array.isArray(user.verified_accounts)) {
          for (const acc of user.verified_accounts) {
            if (acc.platform && acc.username) {
              verifiedAccounts.push({
                platform: acc.platform,
                username: acc.username,
              });
            }
          }
        }
        
        // Extract verified addresses
        const verifiedAddresses = {
          eth: user.verified_addresses?.eth_addresses || [],
          sol: user.verified_addresses?.sol_addresses || [],
        };
        
        // Extract location
        const location = user.profile?.location ? {
          city: user.profile.location.address?.city,
          country: user.profile.location.address?.country,
        } : undefined;
        
        return {
          fid: user.fid,
          username: user.username,
          displayName: user.display_name,
          bio: user.profile?.bio?.text,
          pfpUrl: user.pfp_url || user.pfp?.url,
          bannerUrl: user.profile?.banner?.url,
          followerCount: user.follower_count,
          followingCount: user.following_count,
          location,
          verifiedAddresses,
          verifiedAccounts,
          score: user.score || user.experimental?.neynar_user_score,
        };
      }
    }
    
    return undefined;
  } catch (error) {
    console.error('Error fetching Farcaster:', error);
    return undefined;
  }
}

/**
 * Fetch token balance
 */
export async function fetchTokenBalance(
  tokenAddress: string,
  userAddress: string,
  decimals: number = 18
): Promise<{ raw: string; formatted: string }> {
  try {
    const balance = await baseClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`],
    });
    
    const formatted = (Number(balance) / Math.pow(10, decimals)).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
    
    return {
      raw: balance.toString(),
      formatted,
    };
  } catch (error) {
    console.error(`Error fetching balance for ${tokenAddress}:`, error);
    return { raw: '0', formatted: '0' };
  }
}

/**
 * Check if user owns Warplet NFT
 */
export async function checkWarpletOwnership(address: string): Promise<{
  owned: boolean;
  tokenIds: number[];
}> {
  // TODO: Implement when Warplet NFT contract is deployed
  // Will query baseClient.readContract for ERC721/ERC1155 balanceOf
  void address; // Reserved for future use
  return {
    owned: false,
    tokenIds: [],
  };
}

// =============================================================================
// ERC-721 ABI for NFT queries
// =============================================================================

const ERC721_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
]);

/**
 * Fetch Maxxvatars NFT ownership (Base mainnet)
 * Contract: 0xe6f281582ef180582fff8579cc6bf409837b2d34
 */
export async function fetchMaxxvatarsOwnership(address: string): Promise<{
  owned: boolean;
  tokenIds: number[];
  metadata: Array<{ tokenId: number; imageUri?: string; name?: string }>;
}> {
  try {
    const balance = await baseClient.readContract({
      address: CONTRACTS.MAXXVATARS as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
    
    const balanceNum = Number(balance);
    
    if (balanceNum === 0) {
      return { owned: false, tokenIds: [], metadata: [] };
    }
    
    // Fetch token IDs (max 10)
    const tokenIds: number[] = [];
    const metadata: Array<{ tokenId: number; imageUri?: string; name?: string }> = [];
    
    for (let i = 0; i < Math.min(balanceNum, 10); i++) {
      try {
        const tokenId = await baseClient.readContract({
          address: CONTRACTS.MAXXVATARS as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [address as `0x${string}`, BigInt(i)],
        });
        
        const tokenIdNum = Number(tokenId);
        tokenIds.push(tokenIdNum);
        
        // Try to fetch tokenURI for metadata
        try {
          const tokenUri = await baseClient.readContract({
            address: CONTRACTS.MAXXVATARS as `0x${string}`,
            abi: ERC721_ABI,
            functionName: 'tokenURI',
            args: [tokenId],
          });
          
          // Parse IPFS or HTTP URI
          let imageUri: string | undefined;
          if (tokenUri) {
            // Handle IPFS URIs
            if (typeof tokenUri === 'string' && tokenUri.startsWith('ipfs://')) {
              imageUri = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
            } else if (typeof tokenUri === 'string' && tokenUri.startsWith('http')) {
              // Try to fetch metadata JSON
              try {
                const metaRes = await fetch(tokenUri);
                if (metaRes.ok) {
                  const metaJson = await metaRes.json();
                  imageUri = metaJson.image;
                  if (imageUri?.startsWith('ipfs://')) {
                    imageUri = imageUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  }
                  metadata.push({
                    tokenId: tokenIdNum,
                    imageUri,
                    name: metaJson.name || `Maxxvatar #${tokenIdNum}`,
                  });
                  continue;
                }
              } catch {
                // Failed to fetch metadata
              }
            }
          }
          
          metadata.push({
            tokenId: tokenIdNum,
            imageUri,
            name: `Maxxvatar #${tokenIdNum}`,
          });
        } catch {
          metadata.push({
            tokenId: tokenIdNum,
            name: `Maxxvatar #${tokenIdNum}`,
          });
        }
      } catch {
        break;
      }
    }
    
    return {
      owned: tokenIds.length > 0,
      tokenIds,
      metadata,
    };
  } catch (error) {
    console.error('Error fetching Maxxvatars:', error);
    return { owned: false, tokenIds: [], metadata: [] };
  }
}

// =============================================================================
// MAIN FETCH FUNCTION
// =============================================================================

/**
 * Fetch all user data from multiple sources
 * Aggregates: ENS text records, Farcaster profile, Basename, token balances, NFTs
 */
export async function fetchAllUserData(address: string): Promise<UserData> {
  const addressShort = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  // Fetch all data in parallel (first pass)
  const [
    basename,
    ensName,
    farcaster,
    votBalance,
    maxxBalance,
    warplet,
    maxxvatars,
  ] = await Promise.all([
    fetchBasename(address),
    fetchENSName(address),
    fetchFarcasterProfile(address),
    fetchTokenBalance(CONTRACTS.VOT_TOKEN, address),
    fetchTokenBalance(CONTRACTS.MAXX_TOKEN, address),
    checkWarpletOwnership(address),
    fetchMaxxvatarsOwnership(address),
  ]);
  
  // Fetch ENS text records if ENS name exists (second pass)
  let ensRecords: UserData['ensRecords'] | undefined;
  if (ensName) {
    ensRecords = await fetchENSTextRecords(ensName);
  }
  
  // Determine display name priority: Basename > ENS > Farcaster > Address
  let displayName = addressShort;
  let source: UserData['source'] = 'address';
  
  if (basename) {
    displayName = basename;
    source = 'basename';
  } else if (ensName) {
    displayName = ensName;
    source = 'ens';
  } else if (farcaster?.username) {
    displayName = `@${farcaster.username}`;
    source = 'farcaster';
  }
  
  // Build aggregated links from all sources
  const links: UserData['links'] = {};
  
  // Farcaster links
  if (farcaster?.username) {
    links.farcaster = `https://warpcast.com/${farcaster.username}`;
  }
  
  // From Farcaster verified accounts (X/Twitter, GitHub, etc.)
  if (farcaster?.verifiedAccounts) {
    for (const acc of farcaster.verifiedAccounts) {
      if (acc.platform === 'x' || acc.platform === 'twitter') {
        links.twitter = `https://x.com/${acc.username}`;
      } else if (acc.platform === 'github') {
        links.github = `https://github.com/${acc.username}`;
      }
    }
  }
  
  // ENS domain links
  if (basename) {
    links.basename = `https://${basename}.limo`;
  }
  if (ensName) {
    links.ens = `https://${ensName}.limo`;
  }
  
  // ENS text records links (can override/supplement)
  if (ensRecords) {
    if (ensRecords.url) links.website = ensRecords.url;
    if (ensRecords.twitter && !links.twitter) links.twitter = `https://x.com/${ensRecords.twitter}`;
    if (ensRecords.github && !links.github) links.github = `https://github.com/${ensRecords.github}`;
    if (ensRecords.discord) links.discord = ensRecords.discord;
    if (ensRecords.telegram) links.telegram = `https://t.me/${ensRecords.telegram}`;
    if (ensRecords.reddit) links.reddit = `https://reddit.com/u/${ensRecords.reddit}`;
  }
  
  // Determine best avatar (priority: Maxxvatar > ENS avatar > Farcaster PFP)
  const maxxvatarImage = maxxvatars.metadata?.[0]?.imageUri;
  const avatar = maxxvatarImage || ensRecords?.avatar || farcaster?.pfpUrl;
  
  // Determine best banner (priority: ENS header > Farcaster banner)
  const banner = ensRecords?.header || farcaster?.bannerUrl;
  
  // Determine best description (priority: ENS description > Farcaster bio)
  const description = ensRecords?.description || farcaster?.bio;
  
  return {
    address,
    addressShort,
    basename,
    ensName,
    farcasterUsername: farcaster?.username,
    farcasterFid: farcaster?.fid,
    farcasterPfp: farcaster?.pfpUrl,
    displayName,
    description,
    avatar,
    banner,
    ensRecords,
    farcasterProfile: farcaster,
    votBalance: votBalance.raw,
    votBalanceFormatted: votBalance.formatted,
    maxxBalance: maxxBalance.raw,
    maxxBalanceFormatted: maxxBalance.formatted,
    hasWarpletNFT: warplet.owned,
    warpletTokenIds: warplet.tokenIds,
    // Maxxvatars NFT
    hasMaxxvatars: maxxvatars.owned,
    maxxvatarTokenIds: maxxvatars.tokenIds,
    maxxvatarMetadata: maxxvatars.metadata,
    // Holdings summary
    holdings: {
      votBalance: votBalance.raw,
      votFormatted: votBalance.formatted,
      maxxBalance: maxxBalance.raw,
      maxxFormatted: maxxBalance.formatted,
    },
    links,
    fetchedAt: Date.now(),
    source,
  };
}

// =============================================================================
// TEMPLATE DATA CONVERSION
// =============================================================================

/**
 * Convert UserData to template placeholders
 * Includes all data from ENS, Farcaster, and Basename sources
 */
export function userDataToPlaceholders(data: UserData): Record<string, string> {
  return {
    // Identity
    '{{USERNAME}}': data.displayName,
    '{{ADDRESS}}': data.addressShort,
    '{{ADDRESS_FULL}}': data.address,
    '{{BASENAME}}': data.basename || '',
    '{{ENS}}': data.ensName || '',
    
    // Farcaster
    '{{FARCASTER_FID}}': data.farcasterFid?.toString() || '',
    '{{FARCASTER_USERNAME}}': data.farcasterUsername || '',
    '{{FARCASTER_PFP}}': data.farcasterPfp || '',
    '{{FARCASTER_BIO}}': data.farcasterProfile?.bio || '',
    '{{FARCASTER_DISPLAY_NAME}}': data.farcasterProfile?.displayName || '',
    '{{FARCASTER_FOLLOWERS}}': data.farcasterProfile?.followerCount?.toLocaleString() || '0',
    '{{FARCASTER_FOLLOWING}}': data.farcasterProfile?.followingCount?.toLocaleString() || '0',
    '{{FARCASTER_SCORE}}': data.farcasterProfile?.score?.toString() || '',
    '{{FARCASTER_BANNER}}': data.farcasterProfile?.bannerUrl || '',
    '{{FARCASTER_LOCATION}}': data.farcasterProfile?.location?.city 
      ? `${data.farcasterProfile.location.city}, ${data.farcasterProfile.location.country || ''}`
      : '',
    
    // ENS Text Records
    '{{ENS_AVATAR}}': data.ensRecords?.avatar || '',
    '{{ENS_DESCRIPTION}}': data.ensRecords?.description || '',
    '{{ENS_EMAIL}}': data.ensRecords?.email || '',
    '{{ENS_URL}}': data.ensRecords?.url || '',
    '{{ENS_LOCATION}}': data.ensRecords?.location || '',
    '{{ENS_TWITTER}}': data.ensRecords?.twitter || '',
    '{{ENS_GITHUB}}': data.ensRecords?.github || '',
    '{{ENS_DISCORD}}': data.ensRecords?.discord || '',
    '{{ENS_TELEGRAM}}': data.ensRecords?.telegram || '',
    '{{ENS_HEADER}}': data.ensRecords?.header || '',
    '{{ENS_KEYWORDS}}': data.ensRecords?.keywords || '',
    
    // NFTs
    '{{HAS_MAXXVATAR}}': data.hasMaxxvatars ? 'true' : 'false',
    '{{MAXXVATAR_COUNT}}': data.maxxvatarTokenIds?.length.toString() || '0',
    '{{MAXXVATAR_TOKEN_ID}}': data.maxxvatarTokenIds?.[0]?.toString() || '',
    '{{MAXXVATAR_IMAGE}}': data.maxxvatarMetadata?.[0]?.imageUri || '',
    '{{MAXXVATAR_NAME}}': data.maxxvatarMetadata?.[0]?.name || '',
    '{{HAS_WARPLET}}': data.hasWarpletNFT ? 'true' : 'false',
    '{{WARPLET_COUNT}}': data.warpletTokenIds?.length.toString() || '0',
    
    // Aggregated (best available)
    '{{BIO}}': data.description || '',
    '{{AVATAR_URL}}': data.avatar || '',
    '{{BANNER_URL}}': data.banner || '',
    '{{WEBSITE}}': data.links.website || '',
    '{{TWITTER}}': data.links.twitter || '',
    '{{GITHUB}}': data.links.github || '',
    
    // Balances
    '{{VOT_BALANCE}}': data.votBalanceFormatted,
    '{{MAXX_BALANCE}}': data.maxxBalanceFormatted,
    
    // Custom (for templates)
    '{{CUSTOM_TITLE}}': data.title || data.displayName,
    '{{CUSTOM_TAGLINE}}': data.subtitle || 'Building on Base',
    '{{SOURCE}}': data.source,
    
    // Tier calculation helpers
    '{{TRAIT_COUNT}}': calculateTraitCount(data).toString(),
    '{{TIER}}': calculateTier(data),
  };
}

/**
 * Calculate number of active traits for tier determination
 */
function calculateTraitCount(data: UserData): number {
  let count = 0;
  if (parseFloat(data.votBalance || '0') > 0) count++; // VOT holder
  if (parseFloat(data.maxxBalance || '0') > 0) count++; // MAXX holder  
  if (data.hasMaxxvatars) count++; // Maxxvatar NFT
  if (data.hasWarpletNFT) count++; // Warplet NFT
  if (data.ensName) count++; // ENS name
  if (data.basename) count++; // Basename
  if (data.farcasterFid) count++; // Farcaster account
  return count;
}

/**
 * Calculate tier based on user data
 */
function calculateTier(data: UserData): string {
  const traitCount = calculateTraitCount(data);
  const votBalance = parseFloat(data.votBalance || '0');
  const maxxBalance = parseFloat(data.maxxBalance || '0');
  
  // Oracle: All traits + high holdings
  if (traitCount >= 6 && votBalance > 100000 && maxxBalance > 10000) {
    return 'Oracle';
  }
  // Architek: 5+ traits with good holdings
  if (traitCount >= 5 && (votBalance > 50000 || maxxBalance > 5000)) {
    return 'Architek';
  }
  // MCPVOT: Has VOT + 4 traits
  if (traitCount >= 4 && votBalance > 10000) {
    return 'MCPVOT';
  }
  // Warplet: Has Warplet NFT or Maxxvatar
  if (data.hasWarpletNFT || data.hasMaxxvatars) {
    return 'Warplet';
  }
  // ENS: Has ENS or Basename
  if (data.ensName || data.basename) {
    return 'ENS';
  }
  // Base: Has any Base activity
  if (data.farcasterFid || votBalance > 0) {
    return 'Base';
  }
  // Farcaster: Only Farcaster
  if (data.farcasterFid) {
    return 'Farcaster';
  }
  
  return 'Initiate';
}

/**
 * Apply placeholders to template HTML
 */
export function applyPlaceholders(template: string, placeholders: Record<string, string>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replaceAll(key, value);
  }
  
  return result;
}

// Functions are exported inline with 'export async function' declarations above

