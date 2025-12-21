"use client";

import { useEffect, useState } from 'react';
import type { Address } from 'viem';
import type { ResolvedName } from './types';

export type { ResolvedName } from './types';

/**
 * React hook for client-side usage - uses API endpoint for resolution
 */
export function useResolvedName(address?: Address) {
    console.log('🟢 [useResolvedName] HOOK CALLED with address:', address);

    const [resolved, setResolved] = useState<ResolvedName | null>(null);
    const [loading, setLoading] = useState(false);

    // Debug: log when resolved state changes
    useEffect(() => {
        console.log('🟢 [useResolvedName] State changed - resolved:', resolved);
    }, [resolved]);

    useEffect(() => {
        let cancelled = false;
        console.log('🟢 [useResolvedName] useEffect triggered, address:', address);

        const resolveNames = async () => {
            if (!address) {
                console.log('🟢 [useResolvedName] No address provided');
                if (!cancelled) {
                    setResolved(null);
                    setLoading(false);
                }
                return;
            }

            console.log('🟢 [useResolvedName] Resolving names for address:', address.slice(0, 6) + '...');
            if (!cancelled) {
                setLoading(true);
            }

            const apiUrl = `/api/resolve-basename?address=${address}`;
            console.log('🟢 [useResolvedName] Fetching from:', apiUrl);

            try {
                const response = await fetch(apiUrl);
                console.log('[useResolvedName] Response status:', response.status);
                const data = await response.json();
                console.log('[useResolvedName] Raw API response:', data);

                const resolvedName: ResolvedName = {
                    address,
                    basename: data.baseName || undefined,
                    ensName: data.ensName || undefined,
                    displayName: data.displayName || data.baseName || data.ensName || `${address.slice(0, 6)}...${address.slice(-4)}`,
                    avatar: data.avatar || undefined
                };

                console.log('[useResolvedName] Processed resolved name:', resolvedName);
                if (!cancelled) {
                    setResolved(resolvedName);
                }
            } catch (err) {
                console.error('[useResolvedName] API error:', err);
                if (!cancelled) {
                    setResolved({
                        address,
                        displayName: `${address.slice(0, 6)}...${address.slice(-4)}`
                    });
                }
            } finally {
                if (!cancelled) {
                    console.log('[useResolvedName] Setting loading to false');
                    setLoading(false);
                }
            }
        };

        resolveNames();

        return () => {
            cancelled = true;
        };
    }, [address]);

    return { resolved, loading };
}

