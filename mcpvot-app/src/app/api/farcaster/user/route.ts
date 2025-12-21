
import { NextRequest, NextResponse } from 'next/server';
// import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');

  if (!fid) {
    return NextResponse.json({ error: 'FID is required' }, { status: 400 });
  }

  // const client = new NeynarAPIClient({ apiKey: process.env.NEYNAR_API_KEY || '' });

  try {
    // For now, return empty user - user lookup feature needs Neynar API update
    return NextResponse.json({});
    /*
    const user = await client.lookupUserByFid(parseInt(fid));
    return NextResponse.json(user);
    */
  } catch (error) {
    console.error('Error fetching Farcaster user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
