'use client';

import { FarcasterIdentityProvider } from '@/lib/farcaster-auth';
import { getConfig } from '@/lib/wagmi';
import AuthProvider from '@/providers/AuthProvider';
import FarcasterMiniAppProvider from '@/providers/FarcasterMiniAppProvider';
import { AuthKitProvider } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';

// Factory function to create QueryClient
const createQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

export function Providers({ children }: { children: React.ReactNode }) {
    // Use useState with lazy initialization to create QueryClient only once
    const [queryClient] = useState(() => createQueryClient());

    // Get wagmi config (singleton, created only once per client)
    const wagmiConfig = useMemo(() => getConfig(), []);

    // Use a reliable RPC URL that works across all environments
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 
                   process.env.NEXT_PUBLIC_BASE_RPC_URL ||
                   process.env.BASE_RPC_URL ||
                   'https://mainnet.base.org';

    // Ensure we have a valid domain
    const domain = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 
                   'https://mcpvot.xyz';

    return (
        <FarcasterMiniAppProvider>
            <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
                <QueryClientProvider client={queryClient}>
                    <RainbowKitProvider
                        theme={darkTheme({
                            accentColor: '#8B5CF6', // Purple accent matching MCPVOT branding
                            accentColorForeground: 'white',
                            borderRadius: 'medium',
                            fontStack: 'system',
                        })}
                        initialChain={base}
                        modalSize="compact"
                        showRecentTransactions={true}
                    >
                        <AuthKitProvider config={{
                            rpcUrl,
                            domain,
                            siweUri: domain,
                            // Enable both web and mini-app authentication
                            enableWalletConnect: true,
                            enableEmbeddedWallets: true,
                            // Support both Farcaster and traditional wallet auth
                            enableFarcaster: true,
                            // Add better error handling
                            onError: (error) => {
                                console.error('AuthKit Error:', error);
                            },
                        }}>
                            <FarcasterIdentityProvider>
                                <AuthProvider>
                                    {children}
                                </AuthProvider>
                            </FarcasterIdentityProvider>
                        </AuthKitProvider>
                    </RainbowKitProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </FarcasterMiniAppProvider>
    );
}
