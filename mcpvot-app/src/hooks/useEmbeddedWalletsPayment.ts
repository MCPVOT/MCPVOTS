'use client';

import { useCallback, useEffect, useState } from 'react';

// Coinbase Embedded Wallets hook using useX402
export function useEmbeddedWalletsPayment() {
    const [isEmbeddedWalletsReady, setIsEmbeddedWalletsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize embedded wallets
    useEffect(() => {
        const initializeEmbeddedWallets = async () => {
            try {
                // Check if we're in an embedded wallet environment
                const userAgent = navigator.userAgent;
                const isEmbeddedWallet = userAgent.includes('Coinbase') &&
                    (userAgent.includes('Embedded') || userAgent.includes('Wallet'));

                if (isEmbeddedWallet) {
                    // Import the useX402 hook
                    await import('@coinbase/cdp-hooks');
                    console.log('[EmbeddedWallets] CDP hooks loaded successfully');

                    setIsEmbeddedWalletsReady(true);
                }
            } catch (err: unknown) {
                console.warn('[EmbeddedWallets] Failed to initialize:', err);
                setError('Embedded wallets not available');
            }
        };

        initializeEmbeddedWallets();
    }, []);

    // Make payment using embedded wallets
    const makePayment = useCallback(async (
        url: string,
        options: RequestInit = {},
        retryAttempts: number = 3
    ): Promise<Response> => {
        if (!isEmbeddedWalletsReady) {
            throw new Error('Embedded wallets not ready');
        }

        setIsLoading(true);
        setError(null);

        try {
            const paymentOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'x-embedded-wallets': 'true',
                },
            };

            // For now, just make a regular fetch - the embedded wallet logic would be implemented here
            const response = await fetch(url, paymentOptions);

            if (!response.ok) {
                throw new Error(`Payment failed: ${response.statusText}`);
            }

            setIsLoading(false);
            return response;
        } catch (err: unknown) {
            console.error('[EmbeddedWallets] Payment failed:', err);

            // Retry logic
            if (retryAttempts > 0) {
                console.log(`[EmbeddedWallets] Retrying payment, ${retryAttempts} attempts remaining`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                return makePayment(url, options, retryAttempts - 1);
            }

            const errorMessage = err instanceof Error ? err.message : 'Payment failed';
            setError(errorMessage);
            setIsLoading(false);
            throw err;
        }
    }, [isEmbeddedWalletsReady]);    // Check if embedded wallets are available
    const isEmbeddedWalletsAvailable = useCallback(() => {
        const userAgent = navigator.userAgent;
        return userAgent.includes('Coinbase') &&
            (userAgent.includes('Embedded') || userAgent.includes('Wallet'));
    }, []);

    // Check if embedded wallets are available
    const isEmbeddedWalletsAvailable = useCallback(() => {
        const userAgent = navigator.userAgent;
        return userAgent.includes('Coinbase') &&
            (userAgent.includes('Embedded') || userAgent.includes('Wallet'));
    }, []);

    return {
        isEmbeddedWalletsReady,
        isEmbeddedWalletsAvailable: isEmbeddedWalletsAvailable(),
        isLoading,
        error,
        makePayment,
        setError,
    };
}

// Legacy VOT payment hook (for traditional wallets)
export function useLegacyVOTPayment() {
    const [status, setStatus] = useState<'idle' | 'pending' | 'confirming' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const makeLegacyPayment = useCallback(async (): Promise<void> => {
        try {
            setStatus('pending');
            setError(null);

            // Legacy payment logic here
            // This would use traditional wallet connection and USDC permits

            setStatus('success');
        } catch (err: unknown) {
            setStatus('error');
            const errorMessage = err instanceof Error ? err.message : 'Payment failed';
            setError(errorMessage);
            throw err;
        }
    }, []);

    return {
        status,
        error,
        txHash,
        makePayment: makeLegacyPayment,
        reset: () => {
            setStatus('idle');
            setError(null);
            setTxHash(null);
        },
    };
}

// Smart payment hook that chooses between embedded and traditional wallets
export function useSmartPayment() {
    const embeddedWallets = useEmbeddedWalletsPayment();

    const makeSmartPayment = useCallback(async (
        url: string,
        options: RequestInit = {}
    ): Promise<Response> => {
        // Try embedded wallets first if available
        if (embeddedWallets.isEmbeddedWalletsReady) {
            try {
                console.log('[SmartPayment] Using embedded wallets');
                return await embeddedWallets.makePayment(url, options);
            } catch (err) {
                console.warn('[SmartPayment] Embedded wallets failed, falling back to traditional:', err);
                // Fall back to traditional payment
            }
        }

        // Fallback to traditional payment (would need to be implemented based on your specific use case)
        throw new Error('No payment method available');
    }, [embeddedWallets]);

    return {
        ...embeddedWallets,
        makeSmartPayment,
        isUsingEmbeddedWallets: embeddedWallets.isEmbeddedWalletsReady,
    };
}
