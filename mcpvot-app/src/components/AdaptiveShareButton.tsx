'use client';

/**
 * Adaptive Share Button - Works as both Mini App and Web App
 *
 * - In Farcaster: Uses native composeCast action
 * - On Web: Opens Warpcast with pre-filled cast
 * - Graceful fallback: Copies link to clipboard
 */

import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect, useState } from 'react';

interface ShareButtonProps {
    text: string;
    url?: string;
    className?: string;
}

export default function AdaptiveShareButton({ text, url, className }: ShareButtonProps) {
    const [isMiniApp, setIsMiniApp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    useEffect(() => {
        const detectContext = async () => {
            try {
                const context = await sdk.context;
                setIsMiniApp(!!context.client.clientFid);
            } catch {
                setIsMiniApp(false);
            }
        };

        detectContext();
    }, []);

    const handleShare = async () => {
        setIsLoading(true);

        try {
            if (isMiniApp) {
                // Use native Farcaster compose action
                await sdk.actions.composeCast({
                    text,
                    embeds: shareUrl ? [shareUrl] : []
                });
            } else {
                // Fallback for web: Open Warpcast composer
                const warpcastUrl = new URL('https://warpcast.com/~/compose');
                warpcastUrl.searchParams.set('text', text);
                if (shareUrl) {
                    warpcastUrl.searchParams.set('embeds[]', shareUrl);
                }

                window.open(warpcastUrl.toString(), '_blank');
            }
        } catch (error) {
            console.error('Share failed:', error);

            // Ultimate fallback: Copy to clipboard
            try {
                const shareText = shareUrl ? `${text}\n\n${shareUrl}` : text;
                await navigator.clipboard.writeText(shareText);
                alert('Link copied to clipboard! Paste in Warpcast to share.');
            } catch {
                alert('Unable to share. Please copy manually.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleShare}
            disabled={isLoading}
            className={className || 'px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50'}
        >
            {isLoading ? (
                <>
                    <span className="animate-pulse">Sharing...</span>
                </>
            ) : (
                <>
                    {isMiniApp ? '📱 Share to Feed' : '🌐 Share to Farcaster'}
                </>
            )}
        </button>
    );
}

// Example usage:
// <AdaptiveShareButton
//   text="Check out my MCPVOT dashboard! 🚀"
//   url="https://mcpvot.xyz/dashboard"
// />
