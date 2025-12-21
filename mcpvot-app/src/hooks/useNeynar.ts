'use client';

import { useCallback, useEffect, useState } from 'react';

export interface FarcasterUser {
    fid: number;
    username?: string;
    displayName?: string;
    pfp?: string;
    bio?: string;
    followerCount?: number;
    followingCount?: number;
}

export interface FarcasterCast {
    hash: string;
    text: string;
    timestamp: string;
    author: FarcasterUser;
    likes?: number;
    recasts?: number;
    replies?: number;
}

export interface FarcasterBalance {
    network: string;
    symbol: string;
    balance: string;
    usdValue?: string;
}

export interface FarcasterHubStatus {
    version?: string;
    isHealthy?: boolean;
    uptime?: string;
    peers?: number;
}

export function useNeynar() {
    const [hubStatus, setHubStatus] = useState<FarcasterHubStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get Farcaster hub status
    const getHubStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // This would call the MCP tool
            const response = await fetch('/api/neynar/hub-status', {
                method: 'GET',
            });
            const data = await response.json();
            setHubStatus(data);
            return data;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to get hub status';
            setError(errorMsg);
            console.error('Neynar hub status error:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Get Farcaster user by FID
    const getUser = useCallback(async (fid: number): Promise<FarcasterUser | null> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/neynar/user/${fid}`, {
                method: 'GET',
            });
            const data = await response.json();
            return data;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to get user';
            setError(errorMsg);
            console.error('Neynar get user error:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Get user balance across networks
    const getUserBalance = useCallback(async (fid: number, networks: string[] = ['base', 'ethereum']): Promise<FarcasterBalance[] | null> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/neynar/user/${fid}/balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ networks }),
            });
            const data = await response.json();
            return data;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to get balance';
            setError(errorMsg);
            console.error('Neynar get balance error:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Search Farcaster casts
    const searchCasts = useCallback(async (query: string, limit: number = 10): Promise<FarcasterCast[] | null> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/neynar/search-casts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query, limit }),
            });
            const data = await response.json();
            return data;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to search casts';
            setError(errorMsg);
            console.error('Neynar search casts error:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initialize hub status on mount
        getHubStatus();
    }, [getHubStatus]);

    return {
        hubStatus,
        loading,
        error,
        getHubStatus,
        getUser,
        getUserBalance,
        searchCasts,
    };
}
