
'use client';

import MutualFollows from './MutualFollows';
import { useFarcasterIdentity } from '@/lib/farcaster-auth';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface FarcasterUser {
    fid: number;
    username?: string;
    display_name?: string;
    pfp?: string;
    bio?: string;
    follower_count?: number;
    following_count?: number;
}

interface FarcasterUserProfileProps {
    fid?: number;
    username?: string;
    showBalance?: boolean;
}

interface FarcasterBalanceItem {
    symbol?: string;
    balance: string;
    network?: string;
}

interface FarcasterBalance {
    address_balances?: FarcasterBalanceItem[];
}

export function FarcasterUserProfile({ fid, username, showBalance = false }: FarcasterUserProfileProps) {
    const { fid: currentFid } = useFarcasterIdentity();
    const [user, setUser] = useState<FarcasterUser | null>(null);
    const [balance, setBalance] = useState<FarcasterBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserData = useCallback(async () => {
        if (!fid && !username) return;

        setLoading(true);
        setError(null);

        try {
            // Fetch user data
            const userResponse = await fetch(`/api/farcaster/user?fid=${fid}`);
            if (!userResponse.ok) {
                throw new Error('Failed to fetch user data');
            }
            const userData = await userResponse.json();

            if (userData.result && userData.result.users && userData.result.users.length > 0) {
                const userInfo = userData.result.users[0];
                setUser({
                    fid: userInfo.fid,
                    username: userInfo.username,
                    display_name: userInfo.display_name,
                    pfp: userInfo.pfp?.url,
                    bio: userInfo.profile?.bio?.text,
                    follower_count: userInfo.follower_count,
                    following_count: userInfo.following_count
                });

                // Fetch balance if requested
                if (showBalance && userInfo.fid) {
                    try {
                        const balanceResponse = await fetch(`/api/neynar/user/${userInfo.fid}/balance`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ networks: ['base', 'ethereum'] })
                        });

                        if (balanceResponse.ok) {
                            const balanceData = await balanceResponse.json();
                            setBalance(balanceData.result);
                        }
                    } catch (balanceError) {
                        console.warn('Failed to fetch balance:', balanceError);
                    }
                }
            } else {
                setError('User not found');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load user data');
        } finally {
            setLoading(false);
        }
    }, [fid, username, showBalance]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    if (loading) {
        return (
            <div className="farcaster-profile-loading">
                <div className="animate-pulse flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                    <div className="space-y-2">
                        <div className="w-24 h-4 bg-slate-700 rounded"></div>
                        <div className="w-16 h-3 bg-slate-700 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="farcaster-profile-error text-red-400 text-sm">
                {error || 'User not found'}
            </div>
        );
    }

    return (
        <div className="farcaster-profile bg-black/40 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
                {/* Profile Picture */}
                <div className="shrink-0">
                    {user.pfp ? (
                        <Image
                            src={user.pfp}
                            alt={`${user.display_name || user.username} avatar`}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full border border-slate-600"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                            <span className="text-slate-400 text-lg">👤</span>
                        </div>
                    )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold truncate">
                            {user.display_name || user.username}
                        </h3>
                        <span className="text-slate-400 text-sm">
                            @{user.username}
                        </span>
                        <span className="text-cyan-400 text-xs bg-cyan-400/10 px-2 py-0.5 rounded">
                            FID: {user.fid}
                        </span>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <p className="text-slate-300 text-sm mb-2 line-clamp-2">
                            {user.bio}
                        </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>{user.follower_count?.toLocaleString() || 0} followers</span>
                        <span>{user.following_count?.toLocaleString() || 0} following</span>
                    </div>

                    {/* Balance */}
                    {showBalance && balance && (
                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                            <div className="text-xs text-slate-400 mb-1">Wallet Balance</div>
                            <div className="flex gap-2">
                                {balance.address_balances?.map((bal: FarcasterBalanceItem, index: number) => (
                                    <div key={index} className="text-xs bg-slate-800/50 px-2 py-1 rounded">
                                        <span className="text-cyan-400">{bal.symbol || 'ETH'}</span>
                                        <span className="text-white ml-1">
                                            {parseFloat(bal.balance).toFixed(4)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentFid && user.fid && currentFid !== user.fid && (
                        <div className="mt-4">
                            <MutualFollows fid1={currentFid} fid2={user.fid} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
