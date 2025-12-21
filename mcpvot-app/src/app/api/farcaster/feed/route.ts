/**
 * Farcaster Feed API - FIP-2 Social Feed for VOT Machine
 * 
 * GET /api/farcaster/feed?fid=123 - User's following feed
 * GET /api/farcaster/feed?parent_url=chain://... - FIP-2 social feed for NFTs
 * 
 * Fetches casts via Neynar API
 */

import { NextRequest, NextResponse } from 'next/server';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2/farcaster';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');
  const parentUrl = searchParams.get('parent_url');
  const viewer_fid = searchParams.get('viewer_fid');
  const limit = searchParams.get('limit') || '25';
  const cursor = searchParams.get('cursor');

  if (!NEYNAR_API_KEY) {
    return NextResponse.json({ error: 'NEYNAR_API_KEY not configured' }, { status: 500 });
  }

  try {
    // FIP-2 Mode: Fetch casts by parent_url (for NFT social feeds)
    if (parentUrl) {
      return await fetchByParentUrl(parentUrl, limit, cursor);
    }

    // Legacy Mode: Fetch user's following feed
    if (fid) {
      return await fetchUserFeed(fid, limit, viewer_fid);
    }

    return NextResponse.json({ error: 'Either fid or parent_url is required' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching Farcaster feed:', error);
    return NextResponse.json({
      error: 'Failed to fetch feed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * FIP-2: Fetch casts that reply to a specific parent_url
 * Used for NFT social feeds on VOT Machine
 */
async function fetchByParentUrl(parentUrl: string, limit: string, cursor: string | null) {
  // Try feed endpoint with parent_url filter
  const params = new URLSearchParams({
    feed_type: 'filter',
    filter_type: 'parent_url',
    parent_url: parentUrl,
    limit,
  });

  if (cursor) {
    params.set('cursor', cursor);
  }

  const response = await fetch(
    `${NEYNAR_BASE_URL}/feed?${params.toString()}`,
    {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      },
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    // If parent_url filter fails, return empty (not all parent_urls have casts)
    console.warn(`[FIP-2] No casts found for parent_url: ${parentUrl}`);
    return NextResponse.json({
      casts: [],
      nextCursor: null,
    });
  }

  const data = await response.json();
  
  // Format response
  const casts = (data.casts || []).map((cast: CastData) => ({
    hash: cast.hash,
    author: {
      fid: cast.author?.fid,
      username: cast.author?.username,
      displayName: cast.author?.display_name,
      pfpUrl: cast.author?.pfp_url,
    },
    text: cast.text,
    timestamp: cast.timestamp,
    reactions: {
      likes: cast.reactions?.likes_count || 0,
      recasts: cast.reactions?.recasts_count || 0,
    },
    replies: {
      count: cast.replies?.count || 0,
    },
  }));

  return NextResponse.json({
    casts,
    nextCursor: data.next?.cursor || null,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

/**
 * Legacy: Fetch user's following feed
 */
async function fetchUserFeed(fid: string, limit: string, viewer_fid: string | null) {
  const url = `${NEYNAR_BASE_URL}/feed/following?fid=${fid}&limit=${limit}&with_recasts=true${viewer_fid ? `&viewer_fid=${viewer_fid}` : ''}`;

  const response = await fetch(url, {
    headers: {
      'api_key': NEYNAR_API_KEY,
    },
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }

  const data = await response.json();

  return NextResponse.json({
    success: true,
    data: {
      casts: data.casts || []
    }
  });
}

// Type for Neynar cast data
interface CastData {
  hash: string;
  author?: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url?: string;
  };
  text: string;
  timestamp: string;
  reactions?: {
    likes_count: number;
    recasts_count: number;
  };
  replies?: {
    count: number;
  };
}
