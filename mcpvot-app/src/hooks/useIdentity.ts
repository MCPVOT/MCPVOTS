"use client";

import { useBaseName } from '@/lib/useBaseName';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useENS } from './useENS';

export interface IdentityData {
    /** Display name - prefers Basename, falls back to ENS */
    displayName: string | null;
    /** Basename (e.g., user.base.eth) */
    basename: string | null;
    /** ENS name (e.g., user.eth) */
    ensName: string | null;
    /** Avatar URL - from ENS or Basename */
    avatar: string | null;
    /** Shortened address (0x1234...5678) */
    shortAddress: string | null;
    /** Full connected address */
    address: `0x${string}` | undefined;
    /** Loading state */
    isLoading: boolean;
    /** Combined error */
    error: Error | null;
    /** Source of the display name */
    nameSource: 'basename' | 'ens' | 'address' | null;
}

/**
 * Combined identity hook that resolves both Basenames and ENS
 * Prefers Basename for Base network users, with ENS fallback
 */
export function useIdentity(): IdentityData {
    const { address } = useAccount();
    
    // Fetch both Basename and ENS
    const { baseName, isLoading: basenameLoading, error: basenameError } = useBaseName();
    const { name: ensName, avatar: ensAvatar, isLoading: ensLoading, error: ensError } = useENS(address);

    return useMemo(() => {
        // Determine display name priority: ENS > Basename > Short Address
        // ENS takes priority as it's the original identity standard
        let displayName: string | null = null;
        let nameSource: 'basename' | 'ens' | 'address' | null = null;

        if (ensName) {
            displayName = ensName;
            nameSource = 'ens';
        } else if (baseName && baseName.length > 0) {
            displayName = baseName;
            nameSource = 'basename';
        } else if (address) {
            displayName = `${address.slice(0, 6)}...${address.slice(-4)}`;
            nameSource = 'address';
        }

        // Short address for display
        const shortAddress = address 
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : null;

        return {
            displayName,
            basename: baseName || null,
            ensName: ensName || null,
            avatar: ensAvatar || null, // ENS avatar for now, could add Basename avatar
            shortAddress,
            address,
            isLoading: basenameLoading || ensLoading,
            error: basenameError || ensError,
            nameSource,
        };
    }, [address, baseName, basenameLoading, basenameError, ensName, ensAvatar, ensLoading, ensError]);
}

/**
 * Format an address for display with optional identity
 */
export function formatAddressWithIdentity(
    address: string | undefined,
    basename?: string | null,
    ensName?: string | null
): string {
    if (basename) return basename;
    if (ensName) return ensName;
    if (!address) return 'Not Connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
