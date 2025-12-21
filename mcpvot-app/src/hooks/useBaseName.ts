'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export function useBasename(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const [basename, setBasename] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!targetAddress) {
      setBasename(null);
      return;
    }

    const fetchBasename = async () => {
      setLoading(true);
      try {
        // Call server-side API route which uses OnchainKit + fallbacks.
        // This avoids direct client calls to external resolver endpoints
        // which may be blocked or produce TLS/DNS errors in some networks.
        const response = await fetch(`/api/resolve-basename?address=${targetAddress}`, {
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.name) {
            setBasename(data.name);
          } else {
            setBasename(null);
          }
        } else {
          setBasename(null);
        }
      } catch (error) {
        console.error('Failed to fetch basename via server API:', error);
        // If server-side fails for some reason, fallback to a quick on-chain read attempt
        // without exposing keys. This will only work when the user's provider supports Base.
        try {
          // Attempt to use viem's ENS read via public RPC (mainnet) as a final local fallback
          const { createPublicClient, http } = await import('viem');
          const { base } = await import('viem/chains');
          const baseRpc = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
          const publicClient = createPublicClient({
            chain: base,
            transport: http(baseRpc)
          });

          const name = await publicClient.getEnsName({ address: targetAddress as `0x${string}` });
          if (name && name.endsWith('.base.eth')) {
            setBasename(name);
          } else {
            setBasename(null);
          }
        } catch (localError) {
          console.error('Local fallback read failed:', localError);
          setBasename(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBasename();
  }, [targetAddress]);

  return { basename, loading };
}
