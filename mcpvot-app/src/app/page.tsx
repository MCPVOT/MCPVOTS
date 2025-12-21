'use client';

import Dashboard from '@/components/Dashboard';
import IntroScreen from '@/components/IntroScreen';
import NewConnectPage from '@/components/NewConnectPage';
import { useFarcasterIdentity } from '@/lib/farcaster-auth';
import { useFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';

export default function Home() {
    const { isConnected } = useAccount();
    const [introComplete, setIntroComplete] = useState(false);
    const searchParams = useSearchParams();
    const skipWallet = searchParams?.get('skip-wallet') === '1';

    // Farcaster mini-app context
    const { isAuthenticated } = useFarcasterIdentity();
    const { isInMiniApp, user: farcasterUser } = useFarcasterContext();

    // Debug logging
    useEffect(() => {
        console.log('🔍 PAGE STATE:', {
            introComplete,
            isInMiniApp,
            hasFarcasterUser: !!farcasterUser,
            isConnected,
            isAuthenticated,
        });
    }, [introComplete, isInMiniApp, farcasterUser, isConnected, isAuthenticated]);

    /**
     * Farcaster Miniapp UX Flow:
     * 1. Auto-detect Farcaster environment (isInMiniApp)
     * 2. Skip wallet connect page if Farcaster user detected
     * 3. Use FID/username from Farcaster SDK instead of wallet address
     *
     * Desktop/Web UX Flow:
     * 1. Show intro screen (5 seconds)
     * 2. Show wallet connect page
     * 3. Require wallet connection before dashboard access
     */

    const handleIntroComplete = useCallback(() => {
        if (!introComplete) {
            setIntroComplete(true);
        }
    }, [introComplete]);

    useEffect(() => {
        if (introComplete) {
            return;
        }

        // Auto-skip intro if in Farcaster miniapp (faster UX)
        if (isInMiniApp && farcasterUser) {
            const skipTimer = setTimeout(() => {
                handleIntroComplete();
            }, 100); // Minimal delay to avoid cascading renders
            return () => clearTimeout(skipTimer);
        }

        // Desktop/web: Show intro for 5 seconds
        const timer = setTimeout(() => {
            handleIntroComplete();
        }, 5000);

        return () => clearTimeout(timer);
    }, [introComplete, handleIntroComplete, isInMiniApp, farcasterUser]);

    const currentPhase: 'intro' | 'connect' | 'app' = useMemo(() => {
        if (!introComplete) {
            return 'intro';
        }

        // In Farcaster miniapp with authenticated user:
        // - Allow skip-wallet query param to bypass wallet connection
        // - Otherwise show connect page for optional wallet linking
        if (isInMiniApp && farcasterUser) {
            // User chose to skip wallet connection
            if (skipWallet) {
                return 'app';
            }
            // Show app if wallet is connected
            if (isConnected || isAuthenticated) {
                return 'app';
            }
            // Show connect page with skip option
            return 'connect';
        }

        // Desktop/web: require wallet connection
        return isConnected || isAuthenticated ? 'app' : 'connect';
    }, [introComplete, isConnected, isAuthenticated, isInMiniApp, farcasterUser, skipWallet]);

    // Show intro screen
    if (currentPhase === 'intro') {
        return (
            <>
                <IntroScreen onComplete={handleIntroComplete} />
            </>
        );
    }

    // Show connect page
    if (currentPhase === 'connect') {
        return (
            <>
                <NewConnectPage />
            </>
        );
    }

    // Main app interface
    return (
        <>
            <Dashboard />
        </>
    );
}
