
import { NextRequest, NextResponse } from 'next/server';
// import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  // const client = new NeynarAPIClient({ apiKey: process.env.NEYNAR_API_KEY || '' });

  try {
    // For now, return empty array - search users feature needs Neynar API update
    return NextResponse.json([]);
    /*
    const users = await client.searchUser(query, { limit: 10 });
    return NextResponse.json(users.result.users);
    */
  } catch (error) {
    console.error('Error searching for users:', error);
    return NextResponse.json({ error: 'Failed to search for users' }, { status: 500 });
  }
}
