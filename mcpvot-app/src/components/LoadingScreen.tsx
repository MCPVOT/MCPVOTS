'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function LoadingScreen() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 150);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
            {/* Animated grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-[size:4rem_4rem] animate-pulse" />

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-radial from-cyan-500/20 via-transparent to-transparent animate-pulse" />

            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Warplet Logo with glow */}
                <div className="relative">
                    <div className="absolute inset-0 blur-3xl bg-cyan-400/40 rounded-full animate-pulse" />
                    <div className="relative animate-bounce">
                        <Image
                            src="/warplet_VOT.png"
                            alt="Warplet VOT"
                            width={200}
                            height={200}
                            className="drop-shadow-[0_0_50px_rgba(56,189,248,0.8)]"
                            priority
                        />
                    </div>
                </div>

                {/* Loading text */}
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-glow-pulse">
                        INITIALIZING MCPVOT
                    </h2>

                    {/* Progress bar */}
                    <div className="w-80 h-2 bg-slate-800/50 rounded-full overflow-hidden border border-cyan-500/30">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 transition-all duration-300 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                        </div>
                    </div>

                    <p className="text-cyan-400/70 text-sm font-mono tracking-widest uppercase">
                        {progress < 30 && 'Connecting to Base Network...'}
                        {progress >= 30 && progress < 60 && 'Loading Intelligence Systems...'}
                        {progress >= 60 && progress < 90 && 'Syncing Farcaster Data...'}
                        {progress >= 90 && 'Ready!'}
                    </p>
                </div>

                {/* Scanning lines effect */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan" />
                </div>
            </div>
        </div>
    );
}
