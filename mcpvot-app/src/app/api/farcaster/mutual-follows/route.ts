
import { NextRequest, NextResponse } from 'next/server';
// import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid1 = searchParams.get('fid1');
  const fid2 = searchParams.get('fid2');

  if (!fid1 || !fid2) {
    return NextResponse.json({ error: 'fid1 and fid2 are required' }, { status: 400 });
  }

  // const client = new NeynarAPIClient({ apiKey: process.env.NEYNAR_API_KEY || '' });

  try {
    // For now, return empty array - mutual follows feature needs Neynar API update
    return NextResponse.json([]);
    /*
    const following = await client.fetchUserFollowing(parseInt(fid1), { limit: 150 });
    const followers = await client.fetchUserFollowers(parseInt(fid2), { limit: 150 });

    const mutualFollows = following.result.users.filter((user) =>
      followers.result.users.some((follower) => follower.fid === user.fid)
    );

    return NextResponse.json(mutualFollows);
    */
  } catch (error) {
    console.error('Error fetching mutual follows:', error);
    return NextResponse.json({ error: 'Failed to fetch mutual follows' }, { status: 500 });
  }
}
