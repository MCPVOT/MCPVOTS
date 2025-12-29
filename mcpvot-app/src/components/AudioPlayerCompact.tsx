"use client";

import { motion } from "framer-motion";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Compact audio player for Farcaster mini-app compatibility.
// - Uses HTMLAudioElement for playback (works in most webviews)
// - Uses Web Audio API AnalyserNode to drive a small CSS pulse (no native haptics)
// - Initial volume is set to 0.5 (50%)
// - Non-blocking: playback and analyser run without blocking UI/animations

type Props = {
    src?: string; // public path to mp3 (defaults to ambient track in /public/social)
    className?: string; // allow positioning from parent (header, floating, etc.)
    layout?: "floating" | "inline"; // floating keeps original bottom-right placement
    variant?: "default" | "compact"; // compact tightens spacing for header usage
};

const INITIAL_VOLUME = 0.4;

export default function AudioPlayerCompact({
    src = "/social/music.mp3",
    className,
    layout = "floating",
    variant = "default"
}: Props) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataRef = useRef<Uint8Array | null>(null);
    const rafRef = useRef<number | null>(null);
    const fadeRafRef = useRef<number | null>(null);
    const [playing, setPlaying] = useState(false);
    const [level, setLevel] = useState(0);
    const [volume, setVolume] = useState(INITIAL_VOLUME);
    const volumeRef = useRef(INITIAL_VOLUME);
    const [autoplayAttempted, setAutoplayAttempted] = useState(false);
    const [awaitingGesture, setAwaitingGesture] = useState(false);
    const skipNextToggleRef = useRef(false);
    const suppressVolumeSyncRef = useRef(false);

    const resolvedSrc = useMemo(() => src, [src]);

    useEffect(() => {
        // Cleanup on unmount
        const audioElement = audioRef.current;
        return () => {
            const rafId = rafRef.current;
            if (rafId) cancelAnimationFrame(rafId);
            if (fadeRafRef.current) {
                cancelAnimationFrame(fadeRafRef.current);
            }
            const ctx = audioCtxRef.current;
            if (ctx) {
                ctx.close().catch(() => undefined);
            }
            if (audioElement) {
                audioElement.pause();
                audioElement.src = "";
            }
        };
    }, []);

    const updateVolume = (next: number) => {
        const clamped = Math.min(1, Math.max(0, next));
        volumeRef.current = clamped;
        setVolume(clamped);
        if (audioRef.current) {
            audioRef.current.volume = clamped;
        }
    };

    const fadeVolumeTo = useCallback((target: number, duration = 650) => {
        const element = audioRef.current;
        if (!element) return;

        const start = element.volume;
        if (start === target) return;

        if (fadeRafRef.current) {
            cancelAnimationFrame(fadeRafRef.current);
            fadeRafRef.current = null;
        }

        const startTime = performance.now();

        const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            element.volume = start + (target - start) * progress;
            if (progress < 1) {
                fadeRafRef.current = requestAnimationFrame(step);
            } else {
                fadeRafRef.current = null;
            }
        };

        fadeRafRef.current = requestAnimationFrame(step);
    }, []);

    const setupAudio = useCallback(async () => {
        if (!audioRef.current) return;
        // Create AudioContext lazily on user interaction
        if (!audioCtxRef.current) {
            try {
                type AudioContextWindow = Window & {
                    webkitAudioContext?: typeof AudioContext;
                };
                const win = window as AudioContextWindow;
                const Ctor = win.AudioContext || win.webkitAudioContext;
                if (!Ctor) throw new Error("AudioContext unavailable");
                const ctx = new Ctor();
                audioCtxRef.current = ctx;
                const source = ctx.createMediaElementSource(audioRef.current);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                dataRef.current = new Uint8Array(bufferLength);
                analyserRef.current = analyser;
                source.connect(analyser);
                analyser.connect(ctx.destination);
                if (ctx.state === "suspended") {
                    await ctx.resume().catch(() => undefined);
                }
            } catch (error) {
                // Web Audio API not available — keep player functional without visualiser
                console.warn("AudioContext unavailable:", error);
                audioCtxRef.current = null;
                analyserRef.current = null;
                dataRef.current = null;
            }
        }

        if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
            await audioCtxRef.current.resume().catch(() => undefined);
        }

        // Start RAF loop to read analyser data
        const tick = () => {
            if (analyserRef.current && dataRef.current) {
                analyserRef.current.getByteFrequencyData(dataRef.current);
                // Simple level: average of low-band frequencies
                let sum = 0;
                for (let i = 0; i < dataRef.current.length; i++) sum += dataRef.current[i];
                const avg = sum / dataRef.current.length / 255; // 0..1
                setLevel(avg);
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    }, []);

    const startPlayback = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
        const element = audioRef.current;
        if (!element) return false;
        const targetVolume = volumeRef.current;
        try {
            await setupAudio();
            suppressVolumeSyncRef.current = true;
            element.volume = 0;
            element.muted = true;
            await element.play();
            element.muted = false;
            fadeVolumeTo(targetVolume, 720);
            setPlaying(true);
            setAwaitingGesture(false);
            window.setTimeout(() => {
                suppressVolumeSyncRef.current = false;
            }, 0);
            return true;
        } catch (error) {
            if (element) {
                element.muted = false;
                element.volume = targetVolume;
            }
            if (!silent) {
                console.warn("Playback failed:", error);
            }
            window.setTimeout(() => {
                suppressVolumeSyncRef.current = false;
            }, 0);
            return false;
        }
    }, [fadeVolumeTo, setupAudio]);

    const toggle = async () => {
        if (skipNextToggleRef.current) {
            skipNextToggleRef.current = false;
            return;
        }
        if (!audioRef.current) return;
        if (!playing) {
            const success = await startPlayback();
            if (!success) {
                setAwaitingGesture(true);
            }
        } else {
            audioRef.current.pause();
            setPlaying(false);
            // level will decay naturally
        }
    };

    const handleStop = () => {
        const el = audioRef.current;
        if (!el) return;
        el.pause();
        el.currentTime = 0;
        setPlaying(false);
    };

    useEffect(() => {
        if (suppressVolumeSyncRef.current) {
            suppressVolumeSyncRef.current = false;
            return;
        }
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
        volumeRef.current = volume;
    }, [volume]);

    useEffect(() => {
        const element = audioRef.current;
        if (!element) return;
        if (element.src !== resolvedSrc) {
            element.src = resolvedSrc;
        }
        element.load();
        element.volume = volumeRef.current;
    }, [resolvedSrc]);

    useEffect(() => {
        if (autoplayAttempted || playing) return;
        let cancelled = false;

        const timer = window.setTimeout(() => {
            const run = async () => {
                const success = await startPlayback({ silent: true });
                if (!cancelled) {
                    setAutoplayAttempted(true);
                    setAwaitingGesture(!success);
                    if (!success) {
                        console.warn("Autoplay blocked by browser policy; will resume on first interaction.");
                    }
                }
            };
            void run();
        }, 350);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [autoplayAttempted, playing, startPlayback]);

    useEffect(() => {
        if (!awaitingGesture || playing) return;

        const handleUserGesture = async (source: "pointer" | "keyboard") => {
            const success = await startPlayback({ silent: source !== "keyboard" });
            if (success) {
                setAwaitingGesture(false);
                if (source === "pointer") {
                    skipNextToggleRef.current = true;
                }
            }
        };

        const pointerHandler = () => { void handleUserGesture("pointer"); };
        const keyHandler = () => { void handleUserGesture("keyboard"); };

        window.addEventListener("pointerdown", pointerHandler, { once: true });
        window.addEventListener("keydown", keyHandler, { once: true });

        return () => {
            window.removeEventListener("pointerdown", pointerHandler);
            window.removeEventListener("keydown", keyHandler);
        };
    }, [awaitingGesture, playing, startPlayback]);

    useEffect(() => {
        if (!playing) return;
        setAwaitingGesture(false);
    }, [playing]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = INITIAL_VOLUME;
        }
    }, []);

    const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const pointerId = event.pointerId;
        const target = event.currentTarget;
        try {
            target.setPointerCapture(pointerId);
        } catch {
            // Ignore if pointer capture unsupported
        }
        const startY = event.clientY;
        const startX = event.clientX;
        let moved = false;
        const startVolume = volumeRef.current;

        const handleMove = (moveEvent: PointerEvent) => {
            if (moveEvent.pointerId !== pointerId) return;
            const deltaY = startY - moveEvent.clientY;
            const deltaX = moveEvent.clientX - startX;
            const blended = deltaY + deltaX * 0.5;
            if (!moved && Math.abs(blended) < 3) {
                return;
            }
            moved = true;
            const sensitivity = variant === "compact" ? 220 : 200;
            updateVolume(startVolume + blended / sensitivity);
        };

        const cleanup = () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleEnd);
            window.removeEventListener('pointercancel', handleEnd);
            try {
                if (target.hasPointerCapture?.(pointerId)) {
                    target.releasePointerCapture(pointerId);
                }
            } catch {
                // Pointer capture may not be supported; ignore silently
            }
        };

        const handleEnd = (endEvent: PointerEvent) => {
            if (endEvent.pointerId !== pointerId) return;
            cleanup();
        };

        window.addEventListener('pointermove', handleMove, { passive: true });
        window.addEventListener('pointerup', handleEnd);
        window.addEventListener('pointercancel', handleEnd);
    };

    const handleWheel = (event: ReactWheelEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const delta = event.deltaY / (variant === "compact" ? 900 : 800);
        updateVolume(volumeRef.current - delta);
    };

    const knobSize = variant === "compact" ? "w-11 h-11" : "w-14 h-14";
    const haloSize = variant === "compact" ? "w-[52px] h-[52px]" : "w-16 h-16";
    const wrapperClasses = `${layout === "floating" ? "fixed bottom-4 right-4" : "relative"} z-50 pointer-events-auto ${className ?? ""}`.trim();

    const knobVibration = useMemo(() => {
        if (!playing) {
            return { scale: 1, rotate: 0, x: 0, y: 0 };
        }
        const phase = Math.sin(Date.now() / 90);
        const intensity = 0.35 + level * 0.95;
        return {
            scale: 1 + intensity * 0.05,
            rotate: phase * intensity * 3.4,
            x: phase * intensity * 1.6,
            y: -phase * intensity * 1.0
        };
    }, [level, playing]);

    // Frequency-responsive ring segments — level drives animation intensity
    const levelPulse = 0.4 + (playing ? level * 0.6 : 0);
    const ringOpacity = 0.3 + (playing ? level * 0.5 : 0);

    const buttonTitle = playing
        ? "Playing ambient audio. Drag up/down or scroll to adjust volume. Click to pause."
        : awaitingGesture
            ? "Autoplay blocked—tap to start ambient audio. Drag up/down or scroll to adjust volume."
            : "Play ambient audio. Drag up/down or scroll to adjust volume.";

    const volumeIndicator = awaitingGesture ? "tap" : Math.round(volume * 100).toString();

    return (
        <div className={wrapperClasses}>
            <div className={`relative flex items-center justify-center ${haloSize}`}>
                {/* Outer glow pulse — animated by audio frequency */}
                <div
                    className="absolute inset-0 rounded-full blur-lg bg-cyan-500/40 transition-opacity duration-100"
                    style={{
                        opacity: ringOpacity,
                        transform: `scale(${levelPulse})`,
                        transition: 'transform 60ms ease-out, opacity 100ms ease-out'
                    }}
                />

                {/* Volume ring — conic gradient fills as volume increases */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                    <defs>
                        <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgba(34,211,238,0.9)" />
                            <stop offset="100%" stopColor="rgba(16,185,129,0.8)" />
                        </linearGradient>
                    </defs>
                    {/* Background ring */}
                    <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="rgba(6,182,212,0.15)"
                        strokeWidth="3"
                    />
                    {/* Volume arc */}
                    <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="url(#volumeGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 46}`}
                        strokeDashoffset={`${2 * Math.PI * 46 * (1 - volume)}`}
                        style={{
                            filter: playing ? `drop-shadow(0 0 4px rgba(34,211,238,${level * 0.6 + 0.3}))` : 'none',
                            transition: 'stroke-dashoffset 180ms ease-out'
                        }}
                    />
                    {/* Frequency tick marks — animate with music */}
                    {playing && Array.from({ length: 16 }).map((_, i) => {
                        const angle = (i / 16) * 360;
                        const tickOpacity = 0.2 + (Math.sin(Date.now() / 200 + i) * 0.5 + 0.5) * level * 0.6;
                        return (
                            <line
                                key={i}
                                x1="50"
                                y1="8"
                                x2="50"
                                y2="14"
                                stroke={`rgba(34,211,238,${tickOpacity})`}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                transform={`rotate(${angle} 50 50)`}
                            />
                        );
                    })}
                </svg>

                {/* Center knob button */}
                <motion.button
                    onClick={toggle}
                    onDoubleClick={(event) => {
                        event.preventDefault();
                        handleStop();
                    }}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        handleStop();
                    }}
                    onPointerDown={handlePointerDown}
                    onWheel={handleWheel}
                    aria-pressed={playing}
                    className={`relative overflow-hidden ${knobSize} rounded-full flex items-center justify-center text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.4)] bg-gradient-to-br from-cyan-600/30 via-blue-700/20 to-black/80 border-2 border-cyan-400/50 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer active:cursor-grabbing`}
                    style={{
                        boxShadow: playing
                            ? `0 0 ${20 + level * 15}px rgba(34,211,238,${0.5 + level * 0.3}), inset 0 0 12px rgba(34,211,238,0.2)`
                            : '0 0 15px rgba(6,182,212,0.3), inset 0 0 8px rgba(6,182,212,0.15)',
                        touchAction: 'none'
                    }}
                    animate={knobVibration}
                    transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.4 }}
                    title={buttonTitle}
                    aria-label={buttonTitle}
                >
                    <span className="sr-only">{playing ? "Pause ambient audio" : "Play ambient audio"}</span>
                    <span className="absolute inset-[2px] rounded-full bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.48),rgba(9,13,30,0.2)_58%,rgba(7,10,26,0.92)_90%)] pointer-events-none opacity-80" />

                    <motion.div
                        className="absolute inset-[18%] rounded-full border border-cyan-400/30 bg-[#021521]/85 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                        animate={{
                            scale: playing ? [1, 1.06 + level * 0.1, 1] : 1,
                            opacity: playing ? 0.95 : 0.78
                        }}
                        transition={{
                            duration: playing ? 1.8 : 0.35,
                            ease: "easeInOut",
                            repeat: playing ? Infinity : 0,
                            repeatType: "mirror"
                        }}
                    />

                    <motion.div
                        className="absolute inset-[30%] rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.2),rgba(0,188,212,0.05)_55%,transparent_90%)] pointer-events-none"
                        animate={{
                            rotate: playing ? [0, 6, -6, 0] : 0
                        }}
                        transition={{
                            duration: playing ? 3 : 0.6,
                            ease: "easeInOut",
                            repeat: playing ? Infinity : 0,
                            repeatType: "mirror"
                        }}
                    />

                    <motion.div
                        className="absolute inset-[42%] rounded-full border border-cyan-400/20"
                        animate={{
                            opacity: playing ? [0.5, 0.85, 0.5] : 0.4
                        }}
                        transition={{
                            duration: playing ? 1.6 : 0.6,
                            ease: "easeInOut",
                            repeat: playing ? Infinity : 0,
                            repeatType: "mirror"
                        }}
                    />

                    <motion.span
                        className="relative z-10 flex flex-col items-center justify-center text-cyan-100 gap-[2px]"
                        animate={{
                            scale: playing ? 1.04 + level * 0.12 : 1,
                            opacity: playing ? 1 : 0.88,
                            rotate: playing ? knobVibration.rotate * 0.45 : -3,
                            y: playing ? knobVibration.y * 0.55 : 0
                        }}
                        transition={{ type: "spring", stiffness: 280, damping: 20 }}
                    >
                        {playing ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'translateX(0.4px)' }}>
                                <path
                                    d="M7.9 7.6c0-0.9 0.66-1.6 1.52-1.6h1.18c0.86 0 1.52 0.7 1.52 1.6v8.8c0 0.9-0.66 1.6-1.52 1.6H9.42c-0.86 0-1.52-0.7-1.52-1.6V7.6Z"
                                    fill="currentColor"
                                    className="drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                                />
                                <path
                                    d="M13.88 7.6c0-0.9 0.66-1.6 1.52-1.6h1.18c0.86 0 1.52 0.7 1.52 1.6v8.8c0 0.9-0.66 1.6-1.52 1.6H15.4c-0.86 0-1.52-0.7-1.52-1.6V7.6Z"
                                    fill="currentColor"
                                    className="drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                                />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'translateX(0.4px)' }}>
                                <path
                                    d="M8.4 6.4c0-1.04 1.12-1.68 1.98-1.1l7.24 5c0.78 0.54 0.78 1.82 0 2.36l-7.24 5c-0.86 0.58-1.98-0.06-1.98-1.1V6.4Z"
                                    fill="currentColor"
                                    className="drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                                />
                            </svg>
                        )}
                        <span className="text-[8px] font-mono tracking-[0.12em] text-cyan-200/90 uppercase" aria-hidden="true">
                            {volumeIndicator}
                        </span>
                    </motion.span>
                </motion.button>

                {/* Reactive pulse border — syncs to frequency */}
                {playing && (
                    <div
                        className="pointer-events-none absolute inset-0 rounded-full border border-cyan-300/40"
                        style={{
                            transform: `scale(${1 + level * 0.08})`,
                            opacity: level * 0.7,
                            transition: 'transform 80ms ease-out, opacity 80ms ease-out'
                        }}
                    />
                )}
            </div>
            <audio ref={audioRef} src={resolvedSrc} preload="auto" playsInline loop />
        </div>
    );
}
