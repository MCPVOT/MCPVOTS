'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function LoadingScreen() {
    const [progress, setProgress] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    // Trigger fade-out when complete
                    setTimeout(() => setFadeOut(true), 200);
                    return 100;
                }
                return prev + 10;
            });
        }, 150);

        return () => clearInterval(interval);
    }, []);

    return (
        <div 
            className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
            {/* Animated grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-[size:4rem_4rem] animate-pulse" />

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-radial from-cyan-500/20 via-transparent to-transparent animate-pulse" />

            <div className={`relative z-10 flex flex-col items-center gap-6 sm:gap-8 transition-transform duration-500 ${fadeOut ? 'scale-95' : 'scale-100'}`}>
                {/* Warplet Logo with glow */}
                <div className="relative">
                    <div className="absolute inset-0 blur-3xl bg-cyan-400/40 rounded-full animate-pulse" />
                    <div className="relative animate-bounce">
                        <Image
                            src="/warplet_VOT.png"
                            alt="Warplet VOT"
                            width={200}
                            height={200}
                            className="drop-shadow-[0_0_50px_rgba(56,189,248,0.8)] w-32 h-32 sm:w-48 sm:h-48 lg:w-[200px] lg:h-[200px]"
                            priority
                        />
                    </div>
                </div>

                {/* Loading text */}
                <div className="text-center space-y-3 sm:space-y-4 px-4">
                    <h2 className="text-2xl sm:text-3xl font-orbitron font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-glow-pulse">
                        INITIALIZING MCPVOT
                    </h2>

                    {/* Progress bar */}
                    <div className="w-64 sm:w-80 h-2 bg-slate-800/50 rounded-full overflow-hidden border border-cyan-500/30 mx-auto">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 transition-all duration-300 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                        </div>
                    </div>

                    <p className="text-cyan-400/70 text-xs sm:text-sm font-mono tracking-widest uppercase min-h-[1.5rem]">
                        {progress < 30 && 'Connecting to Base Network...'}
                        {progress >= 30 && progress < 60 && 'Loading Intelligence Systems...'}
                        {progress >= 60 && progress < 90 && 'Syncing Farcaster Data...'}
                        {progress >= 90 && '✓ Ready!'}
                    </p>
                </div>

                {/* Scanning lines effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan" />
                </div>
            </div>
        </div>
    );
}
