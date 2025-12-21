'use client';

import { useEffect, useRef, useState } from 'react';
import TerminalText from './TerminalText';
import VOTLogoSVG from './VOTLogoSVG';

const TELEMETRY_MESSAGES = [
    'Synchronizing Warpcast presence graph…',
    'Bootstrapping Neynar intent relays…',
    'Calibrating Basename resolver lattice…',
    'Spinning up VOT micropayment thrusters…',
    'Projecting holo-terminal overlays…',
    'Locking onto Base RPC uplink…',
] as const;

const VOT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VOT_CONTRACT ?? '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07'; // fallback keeps intro deterministic

interface IntroScreenProps {
    onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
    const [phase, setPhase] = useState<'enter' | 'pulse' | 'exit'>('enter');
    const [bootSequence, setBootSequence] = useState(0);
    const [telemetryIndex, setTelemetryIndex] = useState(0);
    const onCompleteRef = useRef(onComplete);
    const telemetryMessageCount = TELEMETRY_MESSAGES.length;

    // Update ref when onComplete changes
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        // Boot sequence simulation
        const bootTimer = setInterval(() => {
            setBootSequence(prev => (prev < 100 ? prev + Math.random() * 30 : 100));
        }, 200);

        // Enter phase: allow logo spin-up
        const enterTimer = setTimeout(() => {
            setPhase('pulse');
        }, 1800);

        // Pulse phase: extended to 8 seconds total
        const pulseTimer = setTimeout(() => {
            setPhase('exit');
        }, 6200);

        // Exit phase: allow a brief linger before handoff
        const exitTimer = setTimeout(() => {
            onCompleteRef.current();
        }, 7200);

        return () => {
            clearInterval(bootTimer);
            clearTimeout(enterTimer);
            clearTimeout(pulseTimer);
            clearTimeout(exitTimer);
        };
    }, []); // Remove onComplete from dependency array to prevent timer resets

    useEffect(() => {
        if (phase !== 'pulse') {
            return;
        }

        const telemetryTimer = setInterval(() => {
            setTelemetryIndex((prev) => (prev + 1) % telemetryMessageCount);
        }, 900);

        return () => clearInterval(telemetryTimer);
    }, [phase, telemetryMessageCount]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
            {/* Background with animated gradient instead of video */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900/20 to-cyan-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.1)_0%,transparent_70%)] animate-pulse"></div>
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,255,255,0.05)_25%,rgba(0,255,255,0.05)_50%,transparent_50%)] bg-[length:50px_50px] animate-[move_20s_linear_infinite]"></div>
            </div>

            {/* Container with proper mobile constraints */}
            <div className="w-full h-full flex items-center justify-center p-4 md:p-8 overflow-y-auto">
                {/* Animated pixelated frame - improved mobile responsive centering */}
                <div
                    className={['relative', 'pixel-frame-thick', 'transition-all', 'duration-1000', 'p-4', 'md:p-8', 'w-full', 'max-w-xs', 'sm:max-w-md', 'md:max-w-lg', 'lg:max-w-2xl', 'xl:max-w-4xl', 'my-auto', phase === 'enter' ? 'scale-50 opacity-0' : phase === 'pulse' ? 'scale-100 opacity-100' : 'scale-125 opacity-0'].filter(Boolean).join(' ')}
                >
                    {/* Boot sequence display - mobile responsive */}
                    <div className="mb-6 md:mb-8 text-center">
                        <div className="text-xs md:text-sm text-cyan-300/90 font-orbitron tracking-[0.45em] mb-2 md:mb-3 animate-pulse">
                            SYSTEM BOOT SEQUENCE
                        </div>
                        <div className="health-bar">
                            <div
                                className="health-bar__fill"
                                style={{ '--boot-width': `${bootSequence}%`, width: 'var(--boot-width)', transition: 'width 0.1s linear' } as React.CSSProperties}
                            />
                        </div>
                        <div className="text-sm md:text-base text-blue-200 font-mono mt-1 md:mt-2 tracking-widest">
                            {Math.floor(bootSequence)}%
                        </div>
                    </div>

                    {/* Glow effect */}
                    <div
                        className={['absolute', 'inset-0', 'blur-3xl', 'transition-opacity', 'duration-1000', 'pointer-events-none', phase === 'pulse' ? 'opacity-50' : 'opacity-0'].filter(Boolean).join(' ')}
                        style={{
                            background: 'radial-gradient(circle, rgba(96,165,250,0.3) 0%, transparent 70%)',
                        }}
                    />

                    {/* Logo with pixel frame - improved mobile responsive centering */}
                    <div className="relative flex justify-center items-center mb-6 md:mb-8 py-6 md:py-6">
                        <div className="orbital-rings absolute inset-0 blur-sm" aria-hidden />
                        <VOTLogoSVG
                            size={140}
                            className={['relative', 'drop-shadow-[0_0_30px_rgba(96,165,250,0.9)]', 'transition-all', 'duration-1000', 'md:w-44', 'md:h-44', phase === 'pulse' ? 'animate-pulse-slow' : ''].filter(Boolean).join(' ')}
                        />
                    </div>

                    {/* Pixelated Text */}
                    <div
                        className={['text-center', 'transition-all', 'duration-1000', 'space-y-3', phase === 'pulse' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'].filter(Boolean).join(' ')}
                    >
                        <TerminalText
                            text="MCPVOT"
                            className="text-3xl md:text-4xl lg:text-5xl font-orbitron cyber-gradient-text tracking-[0.32em] drop-shadow-[0_0_26px_rgba(34,211,238,0.35)]"
                            glitch={true}
                        />
                        <div className="space-y-1 md:space-y-2">
                            <p className="text-xs md:text-sm tracking-[0.4em] text-blue-400/90 font-orbitron-tight">
                                VOT TOKEN CONTRACT (BASE)
                            </p>
                            <p className="text-xs md:text-sm tracking-[0.18em] text-blue-300/80 font-mono font-semibold break-all">
                                {VOT_CONTRACT_ADDRESS}
                            </p>
                            <p className="text-[0.62rem] md:text-xs tracking-[0.26em] text-cyan-200/80 font-orbitron-tight uppercase">
                                X402 Gasless Facilitator
                            </p>
                            <p className="text-[0.58rem] md:text-[0.68rem] tracking-[0.22em] text-blue-200/80 font-mono uppercase">
                                $VOT powered by @Base · @Farcaster · @IPFS · @MCP AGI
                            </p>
                        </div>
                        <p className="text-xs md:text-sm tracking-[0.28em] text-green-300 font-orbitron-tight animate-pulse mt-3 md:mt-4">
                            ▌ BASE NETWORK ACTIVE ▌
                        </p>
                        <div className="space-y-2 md:space-y-3 mt-4 md:mt-6 text-blue-200/70">
                            <p className="text-xs md:text-sm tracking-[0.18em] font-mono flex items-center justify-center gap-2">
                                <span className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-cyan-300 animate-ping" aria-hidden />
                                Initializing command deck...
                            </p>
                            <p className="text-[0.6rem] md:text-[0.68rem] tracking-[0.22em] font-orbitron-tight text-blue-500/70 px-2">
                                HOLD TO WITNESS FULL SYNC • PREPARING SYSTEMS
                            </p>
                        </div>
                    </div>

                    {/* Mission telemetry - mobile responsive */}
                    <div className="mt-6 md:mt-10 text-left text-xs md:text-sm font-mono text-blue-200/80 space-y-2 md:space-y-3 tracking-[0.15em]">
                        <p className="uppercase text-blue-300/90 flex items-center gap-2 font-orbitron-tight tracking-[0.32em]">
                            <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-blue-300 animate-pulse" aria-hidden />
                            Mission Telemetry
                        </p>
                        <div className="pixel-frame-double py-2 md:py-3 px-3 md:px-4 bg-black/40 border border-cyan-400/20">
                            <p className="text-sm md:text-base text-cyan-200 transition-opacity duration-300 ease-out">
                                {TELEMETRY_MESSAGES[telemetryIndex]}
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 md:gap-3 text-[0.6rem] md:text-[0.65rem] uppercase text-blue-300/70">
                            <div className="pixel-chip text-center py-1.5 md:py-2 border border-green-400/30 bg-green-500/10 animate-pulse font-orbitron-tight tracking-[0.28em]" aria-label="Basename synced">
                                Basename
                            </div>
                            <div className="pixel-chip text-center py-1.5 md:py-2 border border-blue-400/30 bg-blue-500/10 animate-pulse font-orbitron-tight tracking-[0.28em]" aria-label="Farcaster synced">
                                Farcaster
                            </div>
                            <div className="pixel-chip text-center py-1.5 md:py-2 border border-orange-400/30 bg-orange-500/10 animate-pulse font-orbitron-tight tracking-[0.28em]" aria-label="VOT telemetry">
                                VOT HUD
                            </div>
                        </div>
                    </div>

                    {/* Terminal text - mobile responsive */}
                    <div className="mt-4 md:mt-6 text-left">
                        <div className="text-xs md:text-sm text-blue-400 font-mono space-y-1 md:space-y-1.5 opacity-80">
                            <div className="flex items-start">
                                <span className="text-green-400 mr-2">$</span>
                                <span>initialize_mcpvot_ecosystem</span>
                            </div>
                            <div className="text-blue-300/60">&gt; MCPVOT initialized successfully</div>
                            <div className="text-blue-300/60">&gt; Token: VOT | Status: LIVE</div>
                            <div className="text-blue-400/80 animate-pulse">&gt; Awaiting connection...</div>
                            <div className="text-blue-300/60">&gt; Sync: Farcaster ↔ Neynar ↔ Base identity mesh</div>
                            <div className="text-blue-300/60">&gt; Preparing mission modules...</div>
                            <div className="text-blue-300/60">&gt; Animating retro HUD overlays...</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scanline effect */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.08]"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(96, 165, 250, 0.3), rgba(96, 165, 250, 0.3) 1px, transparent 1px, transparent 2px)',
                    animation: 'scanlineScroll 8s linear infinite'
                }}
            />
        </div>
    );
}
