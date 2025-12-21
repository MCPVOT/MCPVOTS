'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface FarcasterUser {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    followerCount?: number;
    followingCount?: number;
    bio?: string;
}

interface FIDProfileCardProps {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
}

export default function FIDProfileCard({ fid, username, displayName, pfpUrl }: FIDProfileCardProps) {
    const [userData, setUserData] = useState<FarcasterUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Fetch full Farcaster user data from Neynar API
                const response = await fetch(`/api/neynar/user/${fid}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserData(data.user);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [fid]);

    const user = userData || { fid, username, displayName, pfpUrl };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/90 border-2 border-[#00FFFF]/60 rounded-xl p-6 shadow-[0_0_40px_rgba(0,255,255,0.4)] backdrop-blur-lg"
        >
            {/* Header with FID Badge */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-mono font-bold text-[#00FFFF] uppercase tracking-wider">
                    Farcaster Profile
                </h3>
                <div className="px-3 py-1 bg-gradient-to-r from-[#00FFFF]/20 to-[#FF8800]/20 border border-[#00FFFF]/50 rounded-full">
                    <span className="font-mono text-sm font-bold text-[#00FFFF]">
                        FID: {fid}
                    </span>
                </div>
            </div>

            {/* Profile Info */}
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {user.pfpUrl ? (
                        <Image
                            src={user.pfpUrl}
                            alt={user.displayName || user.username || 'User'}
                            width={80}
                            height={80}
                            className="rounded-full border-2 border-[#00FFFF]/50 object-cover"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full border-2 border-[#00FFFF]/50 bg-gradient-to-br from-[#00FFFF]/20 to-[#FF8800]/20 flex items-center justify-center">
                            <span className="text-2xl font-mono text-[#00FFFF]">
                                {user.displayName?.[0] || user.username?.[0] || '?'}
                            </span>
                        </div>
                    )}
                </div>

                {/* User Details */}
                <div className="flex-1 min-w-0">
                    <div className="mb-2">
                        <div className="text-lg font-semibold text-white truncate">
                            {user.displayName || 'Anonymous'}
                        </div>
                        {user.username && (
                            <div className="text-sm text-[#FF8800] truncate">
                                @{user.username}
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    {!loading && (userData?.followerCount !== undefined || userData?.followingCount !== undefined) && (
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                            {userData?.followerCount !== undefined && (
                                <div>
                                    <span className="font-mono text-[#00FFFF]">{userData.followerCount}</span> followers
                                </div>
                            )}
                            {userData?.followingCount !== undefined && (
                                <div>
                                    <span className="font-mono text-[#00FFFF]">{userData.followingCount}</span> following
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bio */}
                    {user.bio && (
                        <div className="text-sm text-gray-300 line-clamp-2">
                            {user.bio}
                        </div>
                    )}

                    {loading && (
                        <div className="text-xs text-[#00FF88]/60 animate-pulse">
                            Loading profile data...
                        </div>
                    )}
                </div>
            </div>

            {/* Footer - Access Level */}
            <div className="mt-4 pt-4 border-t border-[#00FFFF]/30">
                <div className="flex items-center justify-between text-xs">
                    <div className="text-[#00FF88]/70">ACCESS LEVEL</div>
                    <div className="font-mono text-[#FFD700] font-bold">WARPLET VERIFIED ✓</div>
                </div>
            </div>
        </motion.div>
    );
}
