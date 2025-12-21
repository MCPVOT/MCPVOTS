'use client';

import { useEffect, useState } from 'react';

interface WarpletLogoProps {
    size?: number;
    className?: string;
    animated?: boolean;
}

export default function WarpletLogo({ size = 48, className = '', animated = true }: WarpletLogoProps) {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        if (!animated) return;

        const interval = setInterval(() => {
            setPhase((p) => (p + 1) % 3);
        }, 2000);

        return () => clearInterval(interval);
    }, [animated]);

    return (
        <div
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Animated Background Glow */}
            {animated && (
                <div
                    className="absolute inset-0 rounded-full blur-xl transition-all duration-1000"
                    style={{
                        background: `radial-gradient(circle, rgba(168, 85, 247, ${0.3 + phase * 0.2}) 0%, transparent 70%)`,
                        transform: `scale(${1 + phase * 0.2})`,
                    }}
                />
            )}

            {/* Main Warplet Icon - Stylized "W" with portal effect */}
            <svg
                viewBox="0 0 100 100"
                className="relative z-10 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                style={{ width: size, height: size }}
            >
                <defs>
                    {/* Gradient for the portal effect */}
                    <linearGradient id="warplet-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={animated ? 0.8 + phase * 0.1 : 0.9} />
                        <stop offset="50%" stopColor="#ec4899" stopOpacity={1} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={animated ? 0.8 + phase * 0.1 : 0.9} />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id="warplet-glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Portal rings animation */}
                    {animated && (
                        <radialGradient id="portal-ring" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="80%" stopColor="#a855f7" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                    )}
                </defs>

                {/* Portal Rings (animated background) */}
                {animated && (
                    <g opacity={0.4}>
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="url(#portal-ring)"
                            strokeWidth="1"
                            opacity={phase === 0 ? 1 : 0.3}
                        >
                            <animate attributeName="r" values="30;45;30" dur="3s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
                        </circle>
                        <circle
                            cx="50"
                            cy="50"
                            r="35"
                            fill="none"
                            stroke="url(#portal-ring)"
                            strokeWidth="1"
                            opacity={phase === 1 ? 1 : 0.3}
                        >
                            <animate attributeName="r" values="35;50;35" dur="3s" begin="1s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" begin="1s" repeatCount="indefinite" />
                        </circle>
                    </g>
                )}

                {/* Main "W" Shape - Stylized Warp Portal */}
                <g filter="url(#warplet-glow)" transform={animated ? `rotate(${phase * 3} 50 50)` : undefined}>
                    {/* Left pillar */}
                    <path
                        d="M 20 20 L 28 20 L 38 70 L 42 70 L 35 20 L 43 20 L 50 55"
                        stroke="url(#warplet-gradient)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Center pillar */}
                    <path
                        d="M 50 55 L 57 20 L 65 20 L 58 70 L 62 70"
                        stroke="url(#warplet-gradient)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Right pillar */}
                    <path
                        d="M 62 70 L 72 20 L 80 20"
                        stroke="url(#warplet-gradient)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Portal center dot */}
                    <circle cx="50" cy="50" r="4" fill="url(#warplet-gradient)" opacity={animated ? 0.6 + phase * 0.2 : 0.8} />

                    {/* Energy particles */}
                    {animated && (
                        <>
                            <circle cx="35" cy="35" r="1.5" fill="#a855f7" opacity={phase === 0 ? 1 : 0.3}>
                                <animate attributeName="cy" values="35;30;35" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="65" cy="35" r="1.5" fill="#ec4899" opacity={phase === 1 ? 1 : 0.3}>
                                <animate attributeName="cy" values="35;30;35" dur="2s" begin="0.5s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="50" cy="25" r="1.5" fill="#f97316" opacity={phase === 2 ? 1 : 0.3}>
                                <animate attributeName="cy" values="25;20;25" dur="2s" begin="1s" repeatCount="indefinite" />
                            </circle>
                        </>
                    )}
                </g>

                {/* Bottom text "W" */}
                <text
                    x="50"
                    y="90"
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontSize="16"
                    fontWeight="bold"
                    fill="url(#warplet-gradient)"
                    opacity="0.8"
                >
                    W
                </text>
            </svg>

            {/* Pulsing ring effect */}
            {animated && (
                <div
                    className="absolute inset-0 rounded-full border-2 border-purple-500/30 transition-all duration-1000"
                    style={{
                        transform: `scale(${1 + phase * 0.15})`,
                        opacity: 1 - phase * 0.3,
                    }}
                />
            )}
        </div>
    );
}
