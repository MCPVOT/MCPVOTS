/**
 * Clear all authentication and wallet connection data
 * Call this on explicit disconnect to prevent auto-reconnect
 */
export function clearAllAuthData() {
    try {
        // Clear wagmi/viem storage
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('wagmi') ||
                key.startsWith('viem') ||
                key.startsWith('walletconnect') ||
                key.startsWith('rainbowkit')
            )) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            console.log('[clearAuth] Removing:', key);
            localStorage.removeItem(key);
        });

        console.log('[clearAuth] Cleared', keysToRemove.length, 'keys');
    } catch (error) {
        console.error('[clearAuth] Error clearing auth data:', error);
    }
}
