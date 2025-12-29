import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
    braveWallet,
    coinbaseWallet,
    injectedWallet,
    metaMaskWallet,
    phantomWallet,
    rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';
import type { CreateConnectorFn } from 'wagmi';
import { createConfig, createStorage, http, noopStorage } from 'wagmi';
import {
    arbitrum,
    avalanche,
    base,
    baseSepolia,
    bsc,
    fantom,
    mainnet,
    optimism,
    polygon,
    sepolia,
} from 'wagmi/chains';

// RainbowKit v2 - No WalletConnect Project ID needed for native wallets!
// Only injected/native wallets that don't require WalletConnect relay

// Helper function to create HTTP transport with fallbacks
const createHttpTransport = (url: string, fallbackUrls: string[] = []) => {
    return http(url, {
        fetch: async (resource, options) => {
            try {
                return await fetch(resource, options);
            } catch (error) {
                // Try fallback URLs if primary fails
                for (const fallbackUrl of fallbackUrls) {
                    try {
                        return await fetch(fallbackUrl.replace('{url}', resource.toString()), options);
                    } catch (fallbackError) {
                        console.warn(`Fallback RPC ${fallbackUrl} failed:`, fallbackError);
                    }
                }
                throw error;
            }
        },
    });
};

// RPC URL configuration with fallbacks
const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 
                   process.env.BASE_RPC_URL ||
                   'https://mainnet.base.org';

const baseFallbackUrls = [
    'https://developer.base.org/api/deployments/8453/{url}',
    'https://base.gateway.upholdusercontent.com/8453/{url}',
];

// SSR check
const isServer = typeof window === 'undefined';

// Safe storage getter - only access localStorage on client
const getStorage = () => {
    if (isServer) {
        return noopStorage;
    }
    try {
        // Verify localStorage is actually available and functional
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.getItem('__test__');
            return createStorage({ storage: window.localStorage });
        }
    } catch {
        console.warn('[wagmi] localStorage not available, using noopStorage');
    }
    return noopStorage;
};

// Build connectors - SSR-safe with RainbowKit v2 native wallets (NO WalletConnect needed!)
const getConnectors = (): CreateConnectorFn[] => {
    // Use RainbowKit's connectorsForWallets - only native/injected wallets
    const walletList = connectorsForWallets(
        [
            {
                groupName: '🔥 Recommended',
                wallets: [
                    // Coinbase Smart Wallet - primary for Base Mini Apps
                    coinbaseWallet,
                    rainbowWallet,       // Rainbow - excellent mobile wallet  
                    metaMaskWallet,      // MetaMask - most popular
                ],
            },
            {
                groupName: '🌐 More Wallets',
                wallets: [
                    phantomWallet,       // Phantom - multi-chain (Solana + EVM)
                    braveWallet,         // Brave browser wallet
                    injectedWallet,      // Any injected wallet (catches all others)
                ],
            },
        ],
        {
            appName: 'MCPVOT x402',
            projectId: 'NONE', // Not used - we only have native wallets
        }
    );

    // Add Farcaster MiniApp connector for in-frame experience
    const connectors: CreateConnectorFn[] = [
        ...walletList,
        farcasterMiniApp(),
    ];

    return connectors;
};

// Singleton config - created only once
let cachedConfig: ReturnType<typeof createConfig> | null = null;

// Get or create the wagmi config (singleton pattern to prevent double init)
export const getConfig = () => {
    if (cachedConfig) {
        return cachedConfig;
    }
    
    cachedConfig = createConfig({
        chains: [base, mainnet, optimism, arbitrum, polygon, baseSepolia, sepolia, bsc, avalanche, fantom],
        connectors: getConnectors(),
        transports: {
            [base.id]: createHttpTransport(baseRpcUrl, baseFallbackUrls),
            [mainnet.id]: http(),
            [optimism.id]: http(),
            [arbitrum.id]: http(),
            [polygon.id]: http(),
            [baseSepolia.id]: http(),
            [sepolia.id]: http(),
            [bsc.id]: http(),
            [avalanche.id]: http(),
            [fantom.id]: http(),
        },
        ssr: true,
        storage: getStorage(),
        batch: {
            multicall: true,
        },
    });
    
    return cachedConfig;
};

// Export config for backward compatibility (lazy evaluated)
export const config = getConfig();
