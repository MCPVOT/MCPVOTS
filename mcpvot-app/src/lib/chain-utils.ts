/**
 * Chain Configuration Utilities
 * Ensures Base mainnet (8453) is always recognized correctly
 */

import { base, baseSepolia } from 'wagmi/chains';

export const SUPPORTED_CHAINS = {
    BASE_MAINNET: 8453,
    BASE_SEPOLIA: 84532,
} as const;

export type SupportedChainId = typeof SUPPORTED_CHAINS[keyof typeof SUPPORTED_CHAINS];

/**
 * Validates if a chain ID is supported
 */
export function isSupportedChain(chainId: number | undefined): chainId is SupportedChainId {
    if (!chainId) return false;
    return Object.values(SUPPORTED_CHAINS).includes(chainId as SupportedChainId);
}

/**
 * Gets the correct chain configuration from a chain ID
 */
export function getChainConfig(chainId: number) {
    switch (chainId) {
        case SUPPORTED_CHAINS.BASE_MAINNET:
            return base;
        case SUPPORTED_CHAINS.BASE_SEPOLIA:
            return baseSepolia;
        default:
            return null;
    }
}

/**
 * Validates if user is on Base mainnet
 */
export function isOnBaseMainnet(chainId: number | undefined): boolean {
    return chainId === SUPPORTED_CHAINS.BASE_MAINNET;
}

/**
 * Gets user-friendly chain name
 */
export function getChainName(chainId: number | undefined): string {
    if (!chainId) return 'Unknown Chain';

    switch (chainId) {
        case SUPPORTED_CHAINS.BASE_MAINNET:
            return 'Base';
        case SUPPORTED_CHAINS.BASE_SEPOLIA:
            return 'Base Sepolia';
        default:
            return `Chain ${chainId}`;
    }
}
