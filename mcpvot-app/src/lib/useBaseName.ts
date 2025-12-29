"use client";

import { useEffect, useMemo, useState } from 'react';
import { namehash } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import { base } from 'wagmi/chains';

// Base Names contracts
const BASE_L2_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD';

const RESOLVER_ABI = [
    {
        inputs: [{ name: 'node', type: 'bytes32' }],
        name: 'name',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

export function useBaseName() {
    const { address } = useAccount();
    const [fetchedName, setFetchedName] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<Error | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    // Compute reverse node using ENS-standard reverse resolution
    // Format: <address-lowercase-no-0x>.addr.reverse
    const reverseNode = useMemo(() => {
        if (!address) return null;
        try {
            // Standard ENS reverse node computation
            const reverseName = `${address.toLowerCase().slice(2)}.addr.reverse`;
            return namehash(reverseName);
        } catch (error) {
            console.error('Error computing reverse node:', error);
            return null;
        }
    }, [address]);

    // Method 1: Try on-chain resolution via L2Resolver
    const { data: onchainName, isLoading: onchainLoading, error: onchainError } = useReadContract({
        address: BASE_L2_RESOLVER,
        abi: RESOLVER_ABI,
        functionName: 'name',
        args: reverseNode ? [reverseNode] : undefined,
        chainId: base.id,
        query: {
            enabled: !!reverseNode,
            retry: 2,
            staleTime: 60000, // Cache for 1 minute
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
        }
    });

    // Method 2: Fallback to API if on-chain fails
    useEffect(() => {
        if (!address || onchainName) return;

        const fetchFromApi = async () => {
            setIsFetching(true);
            setFetchError(null);
            
            try {
                // Use Coinbase OnchainKit API (more reliable than basenames.xyz)
                const onchainKitResponse = await fetch(
                    `https://api.wallet.coinbase.com/rpc/v3/base/getName?address=${address}`,
                    { 
                        headers: { 'Accept': 'application/json' },
                        signal: AbortSignal.timeout(5000)
                    }
                );
                
                if (onchainKitResponse.ok) {
                    const data = await onchainKitResponse.json();
                    if (data?.result?.name) {
                        setFetchedName(data.result.name);
                        return;
                    }
                }
                
                // Fallback: Try our own API endpoint
                const localResponse = await fetch(
                    `/api/resolve-basename?address=${address}&fast=true`,
                    { signal: AbortSignal.timeout(3000) }
                );
                
                if (localResponse.ok) {
                    const data = await localResponse.json();
                    if (data?.baseName) {
                        setFetchedName(data.baseName);
                        return;
                    }
                }
            } catch (error) {
                // Silently fail - basename is optional
                console.warn('Basename API fetch failed (non-critical):', error);
                setFetchError(null); // Don't propagate error for optional feature
            } finally {
                setIsFetching(false);
            }
        };

        // Only fetch if on-chain resolution failed or returned empty
        if (!onchainLoading && (!onchainName || onchainName === '')) {
            fetchFromApi();
        }
    }, [address, onchainName, onchainLoading]);

    // Determine final basename
    const baseName = useMemo(() => {
        // Prefer on-chain result if valid
        if (onchainName && typeof onchainName === 'string' && onchainName.length > 0) {
            return onchainName;
        }
        // Fallback to API result
        if (fetchedName) {
            return fetchedName;
        }
        return undefined;
    }, [onchainName, fetchedName]);

    return {
        baseName,
        isLoading: onchainLoading || isFetching,
        error: onchainError || fetchError
    };
}
