'use client';

/**
 * Context-Aware Authentication
 *
 * - Mini App: Automatic Farcaster auth with Quick Auth
 * - Web: Standard wallet connection
 * - Hybrid: Both methods available
 */

import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function useAdaptiveAuth() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    const [isMiniApp, setIsMiniApp] = useState(false);
    const [farcasterUser, setFarcasterUser] = useState<{
        fid: number;
        username: string;
        displayName: string;
        pfpUrl: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningIn, setIsSigningIn] = useState(false);

    // Detect if running as Mini App
    useEffect(() => {
        const detectContext = async () => {
            setIsLoading(true);
            try {
                const context = await sdk.context;

                if (context.client.clientFid) {
                    setIsMiniApp(true);

                    // Get Farcaster user info
                    if (context.user) {
                        setFarcasterUser({
                            fid: context.user.fid,
                            username: context.user.username || '',
                            displayName: context.user.displayName || '',
                            pfpUrl: context.user.pfpUrl || ''
                        });
                    }
                }
            } catch {
                setIsMiniApp(false);
            } finally {
                setIsLoading(false);
            }
        };

        detectContext();
    }, []);

    // Sign in with Farcaster (Mini App only)
    const signInWithFarcaster = async () => {
        if (!isMiniApp) {
            throw new Error('Sign in with Farcaster only available in Mini App');
        }

        try {
            setIsSigningIn(true);

            const nonceResponse = await fetch('/api/farcaster/auth/nonce');
            if (!nonceResponse.ok) {
                throw new Error('Failed to fetch nonce for Farcaster sign-in');
            }

            const noncePayload = await nonceResponse.json() as { nonce?: string };
            const { nonce } = noncePayload;
            if (!nonce) {
                throw new Error('Nonce response was empty');
            }

            const result = await sdk.actions.signIn({
                nonce,
                acceptAuthAddress: true
            });

            const verifyResponse = await fetch('/api/farcaster/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nonce,
                    message: result.message,
                    signature: result.signature,
                })
            });

            if (!verifyResponse.ok) {
                throw new Error('Farcaster sign-in verification failed');
            }

            const verified = await verifyResponse.json();

            const context = await sdk.context;
            if (context.user) {
                setFarcasterUser({
                    fid: context.user.fid,
                    username: context.user.username || '',
                    displayName: context.user.displayName || '',
                    pfpUrl: context.user.pfpUrl || ''
                });
            }

            return verified;
        } catch (error) {
            console.error('Farcaster sign in failed:', error);
            throw error;
        } finally {
            setIsSigningIn(false);
        }
    };

    // Connect wallet (works in both modes)
    const connectWallet = async () => {
        const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK');
        if (coinbaseConnector) {
            connect({ connector: coinbaseConnector });
        } else {
            connect({ connector: connectors[0] });
        }
    };

    return {
        // Environment info
        isMiniApp,
        isLoading,

        // Auth status
        isAuthenticated: isConnected || !!farcasterUser,

        // Wallet info
        walletAddress: address,
        isWalletConnected: isConnected,

        // Farcaster info
        farcasterUser,
        isFarcasterAuthenticated: !!farcasterUser,

        // Actions
        signInWithFarcaster,
        connectWallet,
        disconnectWallet: disconnect,

        // Connectors
        availableConnectors: connectors,
        isSigningIn
    };
}

// Example component using the hook
export default function AdaptiveAuthButton() {
    const {
        isMiniApp,
        isLoading,
        isAuthenticated,
        walletAddress,
        farcasterUser,
        signInWithFarcaster,
        connectWallet,
        disconnectWallet,
        isSigningIn
    } = useAdaptiveAuth();

    if (isLoading) {
        return (
            <button className="px-4 py-2 bg-gray-600 text-white rounded-lg" disabled>
                Loading...
            </button>
        );
    }

    if (isAuthenticated) {
        return (
            <div className="flex flex-col gap-2">
                {farcasterUser && (
                    <div className="flex items-center gap-2 p-2 bg-purple-900/20 rounded-lg">
                        {farcasterUser.pfpUrl && (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={farcasterUser.pfpUrl}
                                    alt={farcasterUser.username}
                                    className="w-8 h-8 rounded-full"
                                />
                            </>
                        )}
                        <div className="text-sm">
                            <div className="font-bold">@{farcasterUser.username}</div>
                            <div className="text-gray-400">FID: {farcasterUser.fid}</div>
                        </div>
                    </div>
                )}

                {walletAddress && (
                    <div className="text-sm text-gray-400">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </div>
                )}

                <button
                    onClick={() => disconnectWallet()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {isMiniApp && (
                <button
                    onClick={signInWithFarcaster}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60"
                    disabled={isSigningIn}
                >
                    {isSigningIn ? 'Authenticating…' : '🔐 Sign in with Farcaster'}
                </button>
            )}

            <button
                onClick={connectWallet}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                🦊 Connect Wallet
            </button>
        </div>
    );
}
