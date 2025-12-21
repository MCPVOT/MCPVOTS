'use client';

import { useOptionalFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect, useRef } from 'react';

/**
 * FarcasterSplashManager - Calls sdk.actions.ready() after app is fully loaded
 *
 * CRITICAL FIX: Ensures splash screen disappears by calling ready() at the right time
 *
 * According to Farcaster docs:
 * - Must call sdk.actions.ready() AFTER app is fully loaded
 * - Should only be called once
 * - Should be called from a component that's rendered after the main app content
 *
 * This component waits for:
 * 1. App to be fully rendered (useEffect with no dependencies)
 * 2. DOM to be complete
 * 3. Valid Farcaster context to exist
 * 4. Then calls sdk.actions.ready()
 */
export default function FarcasterSplashManager() {
    const context = useOptionalFarcasterContext();
    const isInMiniApp = context?.isInMiniApp ?? false;
    const user = context?.user ?? null;
    const readyCalled = useRef(false);

    useEffect(() => {
        console.log('🔍 FarcasterSplashManager: Checking context', { isInMiniApp, user: user?.fid, readyCalled: readyCalled.current });

        // Prevent multiple calls
        if (readyCalled.current) {
            console.log('ℹ️ FarcasterSplashManager: Ready already called, skipping');
            return;
        }

        const callReady = async () => {
            try {
                // Wait for DOM to be fully loaded and interactive
                if (document.readyState !== 'complete') {
                    console.log('⏳ FarcasterSplashManager: Waiting for DOM to be complete...');
                    await new Promise((resolve) => {
                        const checkReady = () => {
                            if (document.readyState === 'complete') {
                                console.log('✅ FarcasterSplashManager: DOM is complete');
                                resolve(true);
                            } else {
                                document.addEventListener('readystatechange', checkReady, { once: true });
                            }
                        };
                        checkReady();
                    });
                }

                // Additional delay to ensure all components are rendered
                console.log('⏳ FarcasterSplashManager: Waiting for components to render...');
                await new Promise(resolve => setTimeout(resolve, 1000));

                // CRITICAL: Call ready() to hide the splash screen
                const readyAction = sdk.actions?.ready;
                if (typeof readyAction !== 'function') {
                    console.log('ℹ️ FarcasterSplashManager: sdk.actions.ready unavailable—skipping ready() call.');
                    readyCalled.current = true;
                    return;
                }

                console.log('🚀 FarcasterSplashManager: Calling sdk.actions.ready()...');
                await readyAction();
                readyCalled.current = true;

                console.log('✅ Farcaster splash screen dismissed - app is ready!');

            } catch (error) {
                console.error('❌ Failed to call sdk.actions.ready():', error);
                // Try one more time after a longer delay
                if (!readyCalled.current) {
                    console.log('🔄 FarcasterSplashManager: Retrying ready() call...');
                    setTimeout(async () => {
                        try {
                            const readyActionRetry = sdk.actions?.ready;
                            if (typeof readyActionRetry === 'function') {
                                await readyActionRetry();
                                readyCalled.current = true;
                                console.log('✅ Farcaster splash screen dismissed on retry!');
                            } else {
                                console.log('ℹ️ FarcasterSplashManager: sdk.actions.ready still unavailable on retry');
                            }
                        } catch (retryError) {
                            console.error('❌ Retry also failed:', retryError);
                        }
                    }, 2000);
                }
            }
        };

        if (isInMiniApp) {
            callReady();
        } else {
            console.log('ℹ️ FarcasterSplashManager: Not detected as mini-app, scheduling ready() fallback.');
        }

        // Fallback: even if we are not marked as mini-app, force ready after a short delay
        const fallbackTimeout = setTimeout(() => {
            if (!readyCalled.current) {
                console.log('⚠️ FarcasterSplashManager: Forcing ready() fallback.');
                const readyAction = sdk.actions?.ready;
                if (typeof readyAction !== 'function') {
                    console.log('ℹ️ FarcasterSplashManager: No sdk.actions.ready found during fallback. Marking as ready for web mode.');
                    readyCalled.current = true;
                    return;
                }

                readyAction()
                    .then(() => {
                        readyCalled.current = true;
                        console.log('✅ Farcaster splash screen dismissed via fallback ready().');
                    })
                    .catch((error) => {
                        console.error('❌ Fallback ready() failed:', error);
                    });
            }
        }, isInMiniApp ? 3000 : 1500);

        return () => {
            clearTimeout(fallbackTimeout);
        };
    }, [isInMiniApp, user?.fid]); // Only re-run if mini-app status or user changes

    return null; // This component only handles side effects
}
