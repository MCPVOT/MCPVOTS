'use client';

import { useFarcasterIdentity } from '@/lib/farcaster-auth';
import { useState } from 'react';

interface DirectCastProps {
    onCast?: (cast: { text: string; embeds?: string[] }) => void;
    placeholder?: string;
    maxLength?: number;
}

export function DirectCast({
    onCast,
    placeholder = "Share your mission update...",
    maxLength = 320
}: DirectCastProps) {
    const { isAuthenticated, username } = useFarcasterIdentity();
    const [text, setText] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const handleCast = async () => {
        if (!text.trim() || !isAuthenticated) return;

        setIsPosting(true);
        try {
            // Call Farcaster API to post cast
            const response = await fetch('/api/farcaster/cast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text.trim() }),
            });

            if (response.ok) {
                setText('');
                onCast?.({ text: text.trim() });
            }
        } catch (error) {
            console.error('Failed to post cast:', error);
        } finally {
            setIsPosting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="cast-input cast-input--disabled">
                <p className="text-sm text-slate-400">
                    Connect Farcaster to share mission updates
                </p>
            </div>
        );
    }

    return (
        <div className="cast-input">
            <div className="cast-input__header">
                <span className="text-xs text-sky-300/80">
                    Posting as @{username}
                </span>
            </div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                className="cast-input__textarea"
                rows={3}
            />
            <div className="cast-input__footer">
                <span className="text-xs text-slate-400">
                    {text.length}/{maxLength}
                </span>
                <button
                    onClick={handleCast}
                    disabled={!text.trim() || isPosting}
                    className={['group', 'relative', 'overflow-hidden', 'rounded-xl', 'font-semibold', 'text-sm', 'transition-all', 'duration-300', 'backdrop-blur-sm', 'min-h-[44px]', 'px-4', 'py-2', !text.trim() || isPosting ? 'border border-gray-500/30 bg-gray-600/10 text-gray-400 cursor-not-allowed' : 'border border-blue-500/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:border-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95'].filter(Boolean).join(' ')}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {isPosting ? (
                            <>
                                <span className="animate-spin text-lg">⟳</span>
                                <span className="hidden sm:inline">Posting...</span>
                                <span className="sm:hidden">...</span>
                            </>
                        ) : (
                            <>
                                <span className="animate-pulse text-lg">📡</span>
                                <span>Cast</span>
                                <span className="animate-pulse text-lg">📡</span>
                            </>
                        )}
                    </span>
                    {!isPosting && text.trim() && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    )}
                </button>
            </div>
        </div>
    );
}
