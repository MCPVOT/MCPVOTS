/**
 * x402-axios Polyfill
 * This module provides a fallback when x402-axios cannot be loaded
 * due to Solana dependency conflicts during build time
 */

import type { AxiosInstance } from 'axios';
import type { WalletClient } from 'viem';

export async function withPaymentInterceptor(
    axiosInstance: AxiosInstance,
    walletClient: WalletClient
): Promise<AxiosInstance> {
    // Try to load real x402-axios if available
    if (typeof window !== 'undefined') {
        try {
            const x402Module = await import('x402-axios');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return x402Module.withPaymentInterceptor(axiosInstance, walletClient as any);
        } catch {
            console.warn('x402-axios not available, using base axios client');
        }
    }

    // Return base instance as fallback
    return axiosInstance;
}
