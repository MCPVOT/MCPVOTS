/**
 * VOT Machine - Profile API
 * 
 * GET /api/machine/profile?address=0x...
 * 
 * Fetches user identity from all sources:
 * - Farcaster (via Neynar)
 * - ENS text records
 * - Basename
 * - Token balances (VOT, MAXX)
 * - NFT ownership (Warplet)
 * 
 * Caches results in DB to save API calls (24h TTL)
 */

import { fetchAllUserData } from '@/lib/svg-machine/templates/user-data-fetcher';
import { NextRequest, NextResponse } from 'next/server';

// Cache TTL: 24 hours in milliseconds
const CACHE_TTL = 24 * 60 * 60 * 1000;

// In-memory cache (for serverless, use Redis/Postgres in production)
const profileCache = new Map<string, { data: unknown; timestamp: number }>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json(
      { error: 'Missing address parameter' },
      { status: 400 }
    );
  }
  
  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { error: 'Invalid Ethereum address format' },
      { status: 400 }
    );
  }
  
  const normalizedAddress = address.toLowerCase();
  
  // Check cache
  const cached = profileCache.get(normalizedAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      ...cached.data,
      cached: true,
      cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
    });
  }
  
  try {
    // Fetch fresh data from all sources
    const userData = await fetchAllUserData(address);
    
    // Transform to API response format
    const profile = {
      address: userData.address,
      addressShort: userData.addressShort,
      
      // Identity
      basename: userData.basename,
      ensName: userData.ensName,
      farcasterUsername: userData.farcasterUsername,
      farcasterFid: userData.farcasterFid,
      farcasterPfp: userData.farcasterPfp,
      farcasterBio: userData.farcasterProfile?.bio,
      farcasterFollowers: userData.farcasterProfile?.followerCount,
      farcasterBanner: userData.farcasterProfile?.bannerUrl,
      
      // ENS Records
      ensRecords: userData.ensRecords,
      
      // Aggregated
      displayName: userData.displayName,
      avatar: userData.avatar,
      banner: userData.banner,
      bio: userData.description,
      
      // Holdings
      votBalance: userData.votBalanceFormatted,
      votBalanceRaw: userData.votBalance,
      maxxBalance: userData.maxxBalanceFormatted,
      maxxBalanceRaw: userData.maxxBalance,
      hasWarpletNFT: userData.hasWarpletNFT,
      warpletTokenIds: userData.warpletTokenIds,
      
      // Links
      links: userData.links,
      
      // Metadata
      fetchedAt: userData.fetchedAt,
      source: userData.source,
      cached: false,
    };
    
    // Update cache
    profileCache.set(normalizedAddress, {
      data: profile,
      timestamp: Date.now(),
    });
    
    return NextResponse.json(profile);
    
  } catch (error) {
    console.error('[Machine Profile] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}

// Clean up old cache entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of profileCache.entries()) {
      if (now - value.timestamp > CACHE_TTL * 2) {
        profileCache.delete(key);
      }
    }
  }, 60 * 60 * 1000); // Run every hour
}
