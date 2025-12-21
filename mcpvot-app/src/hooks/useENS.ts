"use client";

import { useMemo } from 'react';
import { normalize } from 'viem/ens';
import { useEnsAvatar, useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';

export interface ENSData {
    name: string | null;
    avatar: string | null;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Custom hook for ENS name and avatar resolution
 * Uses mainnet for ENS resolution as per ENS standards
 * Works on all chains but always queries mainnet for ENS data
 */
export function useENS(address?: `0x${string}`): ENSData {
    const {
        data: ensName,
        isLoading: ensNameLoading,
        error: ensNameError
    } = useEnsName({
        address,
        chainId: mainnet.id,
        query: {
            enabled: !!address,
            staleTime: 1000 * 60 * 10, // 10 minutes - ENS names don't change often
            gcTime: 1000 * 60 * 30, // 30 minutes cache
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        },
    });

    // Normalize ENS name for avatar lookup
    const normalizedName = useMemo(() => {
        if (!ensName) return null;
        try {
            return normalize(ensName);
        } catch {
            return ensName;
        }
    }, [ensName]);

    const {
        data: ensAvatar,
        isLoading: ensAvatarLoading,
        error: ensAvatarError
    } = useEnsAvatar({
        name: normalizedName!,
        chainId: mainnet.id,
        query: {
            enabled: !!normalizedName,
            staleTime: 1000 * 60 * 10, // 10 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes cache
            retry: 2,
            retryDelay: 1000,
        },
    });

    const isLoading = ensNameLoading || ensAvatarLoading;
    const error = ensNameError || ensAvatarError;

    return useMemo(() => ({
        name: ensName || null,
        avatar: ensAvatar || null,
        isLoading,
        error: error as Error | null,
    }), [ensName, ensAvatar, isLoading, error]);
}
