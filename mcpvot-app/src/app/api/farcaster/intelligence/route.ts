import {
    checkVOTHolding,
    getFarcasterPortfolio,
    getFarcasterProfile,
    getHolderMultiplier,
    getNFTRankings,
    getTokenRankings,
} from '@/lib/zapper-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Farcaster Intelligence API
 * 
 * GET /api/farcaster/intelligence?fid=99
 * GET /api/farcaster/intelligence?username=jessepollak
 * GET /api/farcaster/intelligence?fid=99&type=profile
 * GET /api/farcaster/intelligence?fid=99&type=portfolio
 * GET /api/farcaster/intelligence?fid=99&type=rankings
 * GET /api/farcaster/intelligence?fid=99&type=multiplier
 * GET /api/farcaster/intelligence?address=0x...&type=vot-check
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    const fid = searchParams.get('fid');
    const username = searchParams.get('username');
    const address = searchParams.get('address');
    const type = searchParams.get('type') || 'full';
    const limit = parseInt(searchParams.get('limit') || '10');
    const cursor = searchParams.get('cursor');
    
    try {
        // Validate input
        if (!fid && !username && !address) {
            return NextResponse.json({
                success: false,
                error: 'fid, username, or address parameter required',
            }, { status: 400 });
        }
        
        const fidNumber = fid ? parseInt(fid) : undefined;
        
        switch (type) {
            case 'profile': {
                const profile = await getFarcasterProfile({
                    fid: fidNumber,
                    username: username || undefined,
                });
                
                if (!profile) {
                    return NextResponse.json({
                        success: false,
                        error: 'Profile not found',
                    }, { status: 404 });
                }
                
                return NextResponse.json({
                    success: true,
                    data: { profile },
                });
            }
            
            case 'portfolio': {
                const result = await getFarcasterPortfolio(
                    { fid: fidNumber, username: username || undefined },
                    limit
                );
                
                if (!result) {
                    return NextResponse.json({
                        success: false,
                        error: 'Portfolio not found',
                    }, { status: 404 });
                }
                
                return NextResponse.json({
                    success: true,
                    data: result,
                });
            }
            
            case 'token-rankings': {
                const rankings = await getTokenRankings({
                    first: Math.min(limit, 20),
                    after: cursor || null,
                    fid: fidNumber,
                });
                
                return NextResponse.json({
                    success: true,
                    data: rankings,
                });
            }
            
            case 'nft-rankings': {
                const rankings = await getNFTRankings({
                    first: Math.min(limit, 20),
                    after: cursor || null,
                    fid: fidNumber,
                });
                
                return NextResponse.json({
                    success: true,
                    data: rankings,
                });
            }
            
            case 'rankings': {
                // Get both token and NFT rankings
                const [tokenRankings, nftRankings] = await Promise.all([
                    getTokenRankings({ first: Math.min(limit, 10), fid: fidNumber }),
                    getNFTRankings({ first: Math.min(limit, 10), fid: fidNumber }),
                ]);
                
                return NextResponse.json({
                    success: true,
                    data: {
                        tokens: tokenRankings,
                        nfts: nftRankings,
                    },
                });
            }
            
            case 'multiplier': {
                const multiplier = await getHolderMultiplier({
                    fid: fidNumber,
                    address: address || undefined,
                });
                
                if (!multiplier) {
                    return NextResponse.json({
                        success: false,
                        error: 'Could not calculate multiplier',
                    }, { status: 404 });
                }
                
                return NextResponse.json({
                    success: true,
                    data: multiplier,
                });
            }
            
            case 'vot-check': {
                if (!address) {
                    return NextResponse.json({
                        success: false,
                        error: 'address parameter required for vot-check',
                    }, { status: 400 });
                }
                
                const votHolding = await checkVOTHolding(address);
                
                return NextResponse.json({
                    success: true,
                    data: votHolding,
                });
            }
            
            case 'full':
            default: {
                // Get full Farcaster intelligence
                const [profileResult, multiplier] = await Promise.all([
                    getFarcasterPortfolio(
                        { fid: fidNumber, username: username || undefined },
                        20
                    ),
                    getHolderMultiplier({ fid: fidNumber, address: address || undefined }),
                ]);
                
                // Get personalized rankings if FID available
                let rankings = null;
                if (fidNumber) {
                    const [tokenRankings, nftRankings] = await Promise.all([
                        getTokenRankings({ first: 5, fid: fidNumber }),
                        getNFTRankings({ first: 5, fid: fidNumber }),
                    ]);
                    rankings = { tokens: tokenRankings, nfts: nftRankings };
                }
                
                return NextResponse.json({
                    success: true,
                    data: {
                        profile: profileResult?.profile || null,
                        portfolio: profileResult?.portfolio || null,
                        multiplier,
                        rankings,
                        timestamp: new Date().toISOString(),
                    },
                });
            }
        }
    } catch (error) {
        console.error('Farcaster Intelligence API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}
