/**
 * Identity Resolve API - ENHANCED
 * 
 * Resolves comprehensive identity data for a given address:
 * - Basename (Base L2)
 * - ENS Name + Text Records (avatar, url, twitter, github, description)
 * - Farcaster data via Neynar (username, fid, pfp, bio, followers)
 */

import { resolveBaseName } from '@/lib/baseNameUtils';
import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

// Mainnet client for ENS
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.MAINNET_RPC_URL || 'https://eth.llamarpc.com'),
});

// Neynar API for Farcaster data
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || '';
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2';

/**
 * Fetch ENS text records for a name
 */
async function getEnsTextRecords(ensName: string): Promise<{
  avatar?: string;
  url?: string;
  twitter?: string;
  github?: string;
  description?: string;
  email?: string;
}> {
  try {
    const normalizedName = normalize(ensName);
    
    // Fetch multiple text records in parallel
    const [avatar, url, twitter, github, description, email] = await Promise.all([
      mainnetClient.getEnsText({ name: normalizedName, key: 'avatar' }).catch(() => null),
      mainnetClient.getEnsText({ name: normalizedName, key: 'url' }).catch(() => null),
      mainnetClient.getEnsText({ name: normalizedName, key: 'com.twitter' }).catch(() => null),
      mainnetClient.getEnsText({ name: normalizedName, key: 'com.github' }).catch(() => null),
      mainnetClient.getEnsText({ name: normalizedName, key: 'description' }).catch(() => null),
      mainnetClient.getEnsText({ name: normalizedName, key: 'email' }).catch(() => null),
    ]);

    return {
      avatar: avatar || undefined,
      url: url || undefined,
      twitter: twitter || undefined,
      github: github || undefined,
      description: description || undefined,
      email: email || undefined,
    };
  } catch (error) {
    console.error('[Identity API] Error fetching ENS text records:', error);
    return {};
  }
}

/**
 * Fetch Farcaster user by verified address via Neynar
 */
async function getFarcasterByAddress(address: string): Promise<{
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  followers?: number;
  following?: number;
} | null> {
  if (!NEYNAR_API_KEY) {
    console.warn('[Identity API] Neynar API key not configured');
    return null;
  }

  try {
    // Neynar v2 API - get user by verified address
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/user/by_verification?address=${address}`,
      {
        headers: {
          'api_key': NEYNAR_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Try bulk lookup as fallback
      return null;
    }

    const data = await response.json();
    const user = data.user;

    if (user) {
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
        bio: user.profile?.bio?.text,
        followers: user.follower_count,
        following: user.following_count,
      };
    }
    return null;
  } catch (error) {
    console.error('[Identity API] Error fetching Farcaster user:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const fid = searchParams.get('fid'); // Optional: can pass FID directly

    if (!address) {
      return NextResponse.json(
        { error: 'Address required' },
        { status: 400 }
      );
    }

    // Step 1: Resolve Basename and ENS name in parallel
    const [basename, ensName] = await Promise.all([
      resolveBaseName(address as `0x${string}`).catch(() => null),
      mainnetClient.getEnsName({ address: address as `0x${string}` }).catch(() => null),
    ]);

    // Step 2: Fetch ENS text records if ENS name exists
    let ensRecords = {};
    if (ensName) {
      ensRecords = await getEnsTextRecords(ensName);
    }

    // Step 3: Fetch Farcaster data
    let farcaster = null;
    if (fid) {
      // If FID provided, fetch directly by FID
      try {
        const response = await fetch(
          `${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${fid}`,
          {
            headers: {
              'api_key': NEYNAR_API_KEY,
              'Content-Type': 'application/json',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          const user = data.users?.[0];
          if (user) {
            farcaster = {
              fid: user.fid,
              username: user.username,
              displayName: user.display_name,
              pfpUrl: user.pfp_url,
              bio: user.profile?.bio?.text,
              followers: user.follower_count,
              following: user.following_count,
            };
          }
        }
      } catch (error) {
        console.log('[Identity API] Could not fetch by FID:', error);
      }
    }
    
    // If no FID or FID lookup failed, try by address
    if (!farcaster) {
      farcaster = await getFarcasterByAddress(address);
    }

    // Construct response with all identity data
    const response = {
      address,
      basename,
      ensName,
      // ENS text records (spread into flat structure for easy access)
      ensAvatar: ensRecords.avatar,
      ensUrl: ensRecords.url,
      ensTwitter: ensRecords.twitter,
      ensGithub: ensRecords.github,
      ensDescription: ensRecords.description,
      ensEmail: ensRecords.email,
      // Farcaster data
      farcasterFid: farcaster?.fid,
      farcasterUsername: farcaster?.username,
      farcasterDisplayName: farcaster?.displayName,
      farcasterPfp: farcaster?.pfpUrl,
      farcasterBio: farcaster?.bio,
      farcasterFollowers: farcaster?.followers,
      farcasterFollowing: farcaster?.following,
      // Convenience flags
      resolved: !!(basename || ensName || farcaster),
      hasEns: !!ensName,
      hasBasename: !!basename,
      hasFarcaster: !!farcaster,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Identity API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve identity' },
      { status: 500 }
    );
  }
}
