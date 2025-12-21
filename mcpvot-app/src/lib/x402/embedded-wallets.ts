/**
 * Embedded Wallets Configuration for x402 Payments
 *
 * Supports Coinbase Embedded Wallets integration with the new useX402 hook
 */

export interface EmbeddedWalletConfig {
    enabled: boolean;
    projectId?: string;
    fallbackToTraditional?: boolean;
    autoRetry?: boolean;
    retryAttempts?: number;
}

export interface EmbeddedWalletSession {
    sessionId: string;
    timestamp: string;
    userAgent?: string;
    embeddedWalletRequest: boolean;
    paymentAttempted: boolean;
    paymentSuccess?: boolean;
    error?: string;
}

/**
 * Create embedded wallets configuration from environment variables
 */
export function createEmbeddedWalletsConfig(): EmbeddedWalletConfig {
    return {
        enabled: process.env.NEXT_PUBLIC_EMBEDDED_WALLETS_ENABLED === 'true',
        projectId: process.env.NEXT_PUBLIC_EMBEDDED_WALLETS_PROJECT_ID,
        fallbackToTraditional: process.env.NEXT_PUBLIC_EMBEDDED_WALLETS_FALLBACK !== 'false',
        autoRetry: process.env.NEXT_PUBLIC_EMBEDDED_WALLETS_AUTO_RETRY !== 'false',
        retryAttempts: parseInt(process.env.NEXT_PUBLIC_EMBEDDED_WALLETS_RETRY_ATTEMPTS || '3'),
    };
}

/**
 * Check if request should use embedded wallets
 */
export function shouldUseEmbeddedWallets(
    userAgent: string | null,
    config: EmbeddedWalletConfig
): boolean {
    if (!config.enabled || !config.projectId) {
        return false;
    }

    // Check for Coinbase Embedded Wallets user agent
    const isEmbeddedWalletRequest = userAgent?.includes('Coinbase') &&
        (userAgent?.includes('Embedded') || userAgent?.includes('Wallet'));

    return isEmbeddedWalletRequest;
}

/**
 * Create session tracking for embedded wallet payments
 */
export function createEmbeddedWalletSession(
    userAgent: string | null,
    config: EmbeddedWalletConfig
): EmbeddedWalletSession {
    return {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        userAgent,
        embeddedWalletRequest: shouldUseEmbeddedWallets(userAgent, config),
        paymentAttempted: false,
    };
}
