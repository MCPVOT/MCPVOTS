import { ethers } from 'ethers';

/**
 * Get Ethereum mainnet provider
 */
export function getMainnetProvider(): ethers.JsonRpcProvider {
    const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
                   process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
                       ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
                       : 'https://cloudflare-eth.com';

    return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get Base network provider
 */
export function getBaseProvider(): ethers.JsonRpcProvider {
    const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
    return new ethers.JsonRpcProvider(rpcUrl);
}
