'use client';

import { sdk } from '@farcaster/miniapp-sdk';
import { useState } from 'react';

import { useFarcasterContext } from '@/providers/FarcasterMiniAppProvider';

export default function AddMiniAppButton() {
    const { isInMiniApp } = useFarcasterContext();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    if (!isInMiniApp) {
        return null;
    }

    const handleAdd = async () => {
        try {
            setIsLoading(true);
            setStatus('idle');
            await sdk.actions.addMiniApp();
            setStatus('success');
        } catch (error) {
            console.error('Failed to prompt addMiniApp', error);
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    const label = (() => {
        if (isLoading) {
            return 'Adding…';
        }
        if (status === 'success') {
            return 'Added to Favorites';
        }
        if (status === 'error') {
            return 'Retry Add to Favorites';
        }
        return '⭐ Add to Farcaster';
    })();

    return (
        <button
            onClick={handleAdd}
            disabled={isLoading}
            className="px-3 py-1.5 bg-purple-600/70 hover:bg-purple-500 text-xs font-orbitron uppercase tracking-[0.2em] text-white rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {label}
        </button>
    );
}
