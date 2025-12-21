/**
 * Sepolia Testnet Configuration
 * Contract addresses and network settings for MCPVOT testnet deployment
 */

export const SEPOLIA_CONFIG = {
    // Network details
    network: {
        chainId: 11155111,
        name: 'Sepolia',
        rpc: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
        explorer: 'https://sepolia.etherscan.io',
    },

    // Contract addresses (will be populated after deployment)
    contracts: {
        VOTToken: process.env.NEXT_PUBLIC_SEPOLIA_VOT_TOKEN || '',
        MCPVOTNFT: process.env.NEXT_PUBLIC_SEPOLIA_MCPVOT_NFT || '',
        X402AgentRegistry: process.env.NEXT_PUBLIC_SEPOLIA_X402_REGISTRY || '',
    },

    // Test token addresses for development
    testTokens: {
        WETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // Sepolia WETH
        USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // Sepolia USDC (mock)
    },

    // Faucet for test tokens
    faucet: {
        enabled: true,
        url: 'https://sepoliafaucet.com',
    },
};

export const BASE_CONFIG = {
    // Network details
    network: {
        chainId: 8453,
        name: 'Base',
        rpc: 'https://mainnet.base.org',
        explorer: 'https://basescan.org',
    },

    // Production contract addresses
    contracts: {
        VOTToken: process.env.NEXT_PUBLIC_BASE_VOT_TOKEN || '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
        MCPVOTNFT: process.env.NEXT_PUBLIC_BASE_MCPVOT_NFT || '',
        X402AgentRegistry: process.env.NEXT_PUBLIC_BASE_X402_REGISTRY || '',
    },
};

/**
 * Get configuration based on chain ID
 */
export function getNetworkConfig(chainId: number) {
    if (chainId === 11155111) {
        return SEPOLIA_CONFIG;
    } else if (chainId === 8453) {
        return BASE_CONFIG;
    }

    // Default to Sepolia for testing
    return SEPOLIA_CONFIG;
}

/**
 * Check if connected to testnet
 */
export function isTestnet(chainId: number): boolean {
    return chainId === 11155111;
}
