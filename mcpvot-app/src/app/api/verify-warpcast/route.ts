/**
 * Warpcast Holder Verification API
 * Checks if a Farcaster user holds Warpcast NFT for special benefits
 */

import { NextRequest, NextResponse } from 'next/server';
import { Address, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const WARPCAST_NFT_CONTRACT = '0x699727F9E01A822EFdcf7333073f0461e5914b4E' as Address;

const ERC721_ABI = [
    {
        inputs: [{ name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fid = searchParams.get('fid');
        const address = searchParams.get('address');

        if (!fid && !address) {
            return NextResponse.json({
                success: false,
                error: 'FID or address required'
            }, { status: 400 });
        }

        let walletAddress: Address | null = null;

        // If FID provided, fetch wallet address from Farcaster
        if (fid) {
            try {
                const neynarApiKey = process.env.NEYNAR_API_KEY;
                if (neynarApiKey) {
                    const neynarResponse = await fetch(
                        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
                        {
                            headers: {
                                'accept': 'application/json',
                                'api_key': neynarApiKey
                            }
                        }
                    );

                    if (neynarResponse.ok) {
                        const neynarData = await neynarResponse.json();
                        const user = neynarData.users?.[0];

                        // Get verified addresses from user
                        if (user?.verified_addresses?.eth_addresses?.length > 0) {
                            walletAddress = user.verified_addresses.eth_addresses[0] as Address;
                        } else if (user?.custody_address) {
                            walletAddress = user.custody_address as Address;
                        }
                    }
                }
            } catch (err) {
                console.error('Neynar API error:', err);
            }
        }

        // Use provided address if available
        if (address) {
            walletAddress = address as Address;
        }

        if (!walletAddress) {
            return NextResponse.json({
                success: true,
                isHolder: false,
                message: 'No wallet address found for this FID'
            });
        }

        // Check Warpcast NFT balance
        const client = createPublicClient({
            chain: base,
            transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org')
        });

        const balance = await client.readContract({
            address: WARPCAST_NFT_CONTRACT,
            abi: ERC721_ABI,
            functionName: 'balanceOf',
            args: [walletAddress]
        });

        const isHolder = balance > BigInt(0);

        return NextResponse.json({
            success: true,
            isHolder,
            address: walletAddress,
            balance: balance.toString(),
            benefits: isHolder ? {
                burnMultiplier: 1.5,
                specialAccess: true,
                enhancedGovernance: true,
                displayBadge: 'OG Warplet Holder'
            } : null
        });

    } catch (error) {
        console.error('Warpcast verification error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Verification failed'
        }, { status: 500 });
    }
}
