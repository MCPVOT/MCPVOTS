'use client';

interface VOTLogoSVGProps {
    size?: number;
    className?: string;
    animated?: boolean;
}

/**
 * VOTLogoSVG - Ultra-Advanced Cyberpunk SVG Logo for VOT Token
 * Features: Quantum holographic effects, advanced particle systems,
 * retro-arcade aesthetics, multi-layered visual effects, and immersive animations
 */
export default function VOTLogoSVG({
    size = 120,
    className = '',
    animated = true
}: VOTLogoSVGProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            className={`vot-logo-svg ${className}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Ultra-Advanced Gradient Definitions */}
            <defs>
                {/* Primary VOT gradient with quantum transitions - Updated Color Scheme */}
                <linearGradient id="votQuantumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00ff88" stopOpacity="1">
                        <animate attributeName="stop-color" values="#00ff88;#33ffaa;#00ff88" dur="4s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="20%" stopColor="#00d4ff" stopOpacity="0.9">
                        <animate attributeName="stop-color" values="#00d4ff;#00ffff;#00d4ff" dur="4s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="40%" stopColor="#ff6b35" stopOpacity="0.8">
                        <animate attributeName="stop-color" values="#ff6b35;#ff8a55;#ff6b35" dur="4s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="60%" stopColor="#00ff88" stopOpacity="0.7">
                        <animate attributeName="stop-color" values="#00ff88;#66ffbb;#00ff88" dur="4s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="80%" stopColor="#00d4ff" stopOpacity="0.6">
                        <animate attributeName="stop-color" values="#00d4ff;#33eeff;#00d4ff" dur="4s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="100%" stopColor="#00ff88" stopOpacity="0.5">
                        <animate attributeName="stop-color" values="#00ff88;#99ffcc;#00ff88" dur="4s" repeatCount="indefinite" />
                    </stop>
                </linearGradient>

                {/* Holographic field gradient - Updated Color Scheme */}
                <radialGradient id="hologramField" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="#00ff88" stopOpacity="0.95" />
                    <stop offset="20%" stopColor="#00d4ff" stopOpacity="0.85" />
                    <stop offset="40%" stopColor="#ff6b35" stopOpacity="0.7" />
                    <stop offset="60%" stopColor="#00ff88" stopOpacity="0.5" />
                    <stop offset="80%" stopColor="#00d4ff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00ff88" stopOpacity="0.1" />
                </radialGradient>

                {/* Quantum core gradient - Updated Color Scheme */}
                <radialGradient id="quantumCore" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="30%" stopColor="#00ff88" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#00d4ff" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#00ff88" stopOpacity="0.3" />
                </radialGradient>

                {/* Energy wave gradients */}
                <linearGradient id="energyWave1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00ff88" stopOpacity="0" />
                    <stop offset="50%" stopColor="#00ff88" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
                </linearGradient>

                <linearGradient id="energyWave2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity="0" />
                    <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                </linearGradient>

                {/* Advanced Filters */}
                <filter id="quantumGlow" x="-150%" y="-150%" width="400%" height="400%">
                    <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                    <feMorphology operator="dilate" radius="3" />
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.9 0" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <filter id="holographicDistortion" x="-50%" y="-50%" width="200%" height="200%">
                    <feTurbulence baseFrequency="0.05 0.05" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0" />
                </filter>

                <filter id="retroScanlines" x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence baseFrequency="0.01 20" numOctaves="1" result="scanlines" />
                    <feColorMatrix type="saturate" values="0" />
                    <feComponentTransfer>
                        <feFuncA type="discrete" tableValues="0 0.3 0.6 0.3 0" />
                    </feComponentTransfer>
                    <feComposite operator="multiply" in2="SourceGraphic" />
                </filter>

                <filter id="quantumGlitch" x="-30%" y="-30%" width="160%" height="160%">
                    <feOffset in="SourceGraphic" dx="1" dy="0" result="offset1" />
                    <feOffset in="SourceGraphic" dx="-1" dy="0" result="offset2" />
                    <feOffset in="SourceGraphic" dx="0" dy="1" result="offset3" />
                    <feBlend in="offset1" in2="offset2" mode="screen" result="blend1" />
                    <feBlend in="blend1" in2="offset3" mode="screen" />
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.7 0" />
                </filter>

                <filter id="particleGlow" x="-200%" y="-200%" width="500%" height="500%">
                    <feGaussianBlur stdDeviation="2" result="glow" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.8 0" />
                    <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Multi-layered Quantum Holographic Background */}
            <circle
                cx="60"
                cy="60"
                r="58"
                fill="url(#hologramField)"
                opacity="0.15"
                filter="url(#quantumGlow)"
                className={animated ? 'animate-pulse' : ''}
                style={animated ? { animationDuration: '6s' } : {}}
            />

            {/* Energy Wave Rings */}
            <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#energyWave1)"
                strokeWidth="2"
                opacity="0.6"
                className={animated ? 'animate-ping' : ''}
                style={animated ? { animationDuration: '8s' } : {}}
            />

            <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="url(#energyWave2)"
                strokeWidth="1.5"
                opacity="0.5"
                className={animated ? 'animate-ping' : ''}
                style={animated ? { animationDuration: '10s', animationDelay: '2s' } : {}}
            />

            {/* Quantum Data Rings with Retro Scanlines */}
            <circle
                cx="60"
                cy="60"
                r="42"
                fill="none"
                stroke="url(#votQuantumGradient)"
                strokeWidth="1.2"
                opacity="0.7"
                strokeDasharray="8,4"
                filter="url(#retroScanlines)"
                className={animated ? 'animate-spin' : ''}
                style={animated ? { animationDuration: '20s' } : {}}
            />

            <circle
                cx="60"
                cy="60"
                r="38"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="0.8"
                opacity="0.6"
                strokeDasharray="6,6"
                className={animated ? 'animate-spin' : ''}
                style={animated ? { animationDuration: '15s', animationDirection: 'reverse' } : {}}
            />

            <circle
                cx="60"
                cy="60"
                r="34"
                fill="none"
                stroke="#ff6b35"
                strokeWidth="0.6"
                opacity="0.5"
                strokeDasharray="4,8"
                className={animated ? 'animate-spin' : ''}
                style={animated ? { animationDuration: '12s' } : {}}
            />

            {/* Holographic VOT Text with Quantum Effects */}
            <text
                x="60"
                y="42"
                textAnchor="middle"
                fill="url(#votQuantumGradient)"
                fontSize="22"
                fontWeight="900"
                fontFamily="monospace"
                filter="url(#quantumGlow)"
                className={animated ? 'animate-pulse' : ''}
                style={{
                    letterSpacing: '0.15em',
                    textShadow: '0 0 15px rgba(0,255,136,0.9), 0 0 30px rgba(0,212,255,0.7), 0 0 45px rgba(255,107,53,0.5)'
                }}
            >
                VOT
            </text>

            {/* Enhanced Token Symbol with Multi-layered Holographic Effects */}
            <g transform="translate(60, 58)">
                {/* Outer quantum field */}
                <circle
                    cx="0"
                    cy="0"
                    r="14"
                    fill="none"
                    stroke="url(#votQuantumGradient)"
                    strokeWidth="0.5"
                    opacity="0.4"
                    filter="url(#holographicDistortion)"
                    className={animated ? 'animate-spin' : ''}
                    style={animated ? { animationDuration: '25s' } : {}}
                />

                {/* Middle energy ring */}
                <circle
                    cx="0"
                    cy="0"
                    r="10"
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth="1"
                    opacity="0.7"
                    className={animated ? 'animate-ping' : ''}
                    style={animated ? { animationDuration: '6s' } : {}}
                />

                {/* Core token symbol */}
                <polygon
                    points="-10,-10 10,-10 14,6 -10,14 -14,6"
                    fill="url(#quantumCore)"
                    filter="url(#quantumGlow)"
                    opacity="0.95"
                    className={animated ? 'animate-pulse' : ''}
                    style={animated ? { animationDuration: '4s' } : {}}
                />

                {/* Inner quantum core */}
                <circle
                    cx="0"
                    cy="0"
                    r="4"
                    fill="#ffffff"
                    opacity="0.98"
                    filter="url(#quantumGlitch)"
                    className={animated ? 'animate-pulse' : ''}
                    style={animated ? { animationDelay: '0.5s' } : {}}
                />

                {/* Quantum particles orbiting the core */}
                <circle cx="-12" cy="0" r="1.5" fill="#00ff88" opacity="0.9" filter="url(#particleGlow)">
                    <animateMotion dur="8s" repeatCount="indefinite" path="M0,0 a12,12 0 1,1 24,0 a12,12 0 1,1 -24,0" />
                </circle>
                <circle cx="0" cy="-12" r="1.5" fill="#00d4ff" opacity="0.9" filter="url(#particleGlow)">
                    <animateMotion dur="10s" repeatCount="indefinite" path="M0,0 a12,12 0 1,1 0,24 a12,12 0 1,1 0,-24" />
                </circle>
                <circle cx="12" cy="0" r="1.5" fill="#ff6b35" opacity="0.9" filter="url(#particleGlow)">
                    <animateMotion dur="12s" repeatCount="indefinite" path="M0,0 a12,12 0 1,1 -24,0 a12,12 0 1,1 24,0" />
                </circle>
                <circle cx="0" cy="12" r="1.5" fill="#8b5cf6" opacity="0.9" filter="url(#particleGlow)">
                    <animateMotion dur="9s" repeatCount="indefinite" path="M0,0 a12,12 0 1,1 0,-24 a12,12 0 1,1 0,24" />
                </circle>
            </g>

            {/* Ultra-Advanced Particle System */}
            {animated && (
                <>
                    {/* Orbital Quantum Particles */}
                    <circle cx="20" cy="40" r="2" fill="#00ff88" opacity="0.95" filter="url(#particleGlow)">
                        <animateMotion dur="12s" repeatCount="indefinite" path="M0,0 Q40,-30 80,0 Q40,30 0,0" />
                    </circle>
                    <circle cx="100" cy="40" r="2" fill="#ff6b35" opacity="0.95" filter="url(#particleGlow)">
                        <animateMotion dur="15s" repeatCount="indefinite" path="M0,0 Q-40,-30 -80,0 Q-40,30 0,0" />
                    </circle>
                    <circle cx="20" cy="80" r="2" fill="#00d4ff" opacity="0.95" filter="url(#particleGlow)">
                        <animateMotion dur="18s" repeatCount="indefinite" path="M0,0 Q40,30 80,0 Q40,-30 0,0" />
                    </circle>
                    <circle cx="100" cy="80" r="2" fill="#00ff88" opacity="0.95" filter="url(#particleGlow)">
                        <animateMotion dur="14s" repeatCount="indefinite" path="M0,0 Q-40,30 -80,0 Q-40,-30 0,0" />
                    </circle>

                    {/* Data Stream Particles */}
                    <circle cx="10" cy="60" r="1.2" fill="#00ff88" opacity="0.9" filter="url(#particleGlow)">
                        <animateMotion dur="8s" repeatCount="indefinite" path="M0,0 L110,0" />
                    </circle>
                    <circle cx="110" cy="60" r="1.2" fill="#00d4ff" opacity="0.9" filter="url(#particleGlow)">
                        <animateMotion dur="10s" repeatCount="indefinite" path="M0,0 L-100,0" />
                    </circle>
                    <circle cx="60" cy="10" r="1.2" fill="#ff6b35" opacity="0.9" filter="url(#particleGlow)">
                        <animateMotion dur="7s" repeatCount="indefinite" path="M0,0 L0,100" />
                    </circle>
                    <circle cx="60" cy="110" r="1.2" fill="#8b5cf6" opacity="0.9" filter="url(#particleGlow)">
                        <animateMotion dur="11s" repeatCount="indefinite" path="M0,0 L0,-100" />
                    </circle>

                    {/* Diagonal Energy Streams */}
                    <circle cx="25" cy="25" r="1" fill="#00ff88" opacity="0.8" filter="url(#particleGlow)">
                        <animateMotion dur="9s" repeatCount="indefinite" path="M0,0 L70,70" />
                    </circle>
                    <circle cx="95" cy="25" r="1" fill="#ff6b35" opacity="0.8" filter="url(#particleGlow)">
                        <animateMotion dur="13s" repeatCount="indefinite" path="M0,0 L-70,70" />
                    </circle>
                    <circle cx="25" cy="95" r="1" fill="#00d4ff" opacity="0.8" filter="url(#particleGlow)">
                        <animateMotion dur="11s" repeatCount="indefinite" path="M0,0 L70,-70" />
                    </circle>
                    <circle cx="95" cy="95" r="1" fill="#00ff88" opacity="0.8" filter="url(#particleGlow)">
                        <animateMotion dur="12s" repeatCount="indefinite" path="M0,0 L-70,-70" />
                    </circle>

                    {/* Quantum Field Particles */}
                    <circle cx="35" cy="35" r="0.8" fill="#8b5cf6" opacity="0.7" filter="url(#particleGlow)">
                        <animateMotion dur="16s" repeatCount="indefinite">
                            <path d="M0,0 Q25,-15 50,0 Q25,15 0,0 Q-25,-15 -50,0 Q-25,15 0,0" />
                        </animateMotion>
                    </circle>
                    <circle cx="85" cy="35" r="0.8" fill="#00ff88" opacity="0.7" filter="url(#particleGlow)">
                        <animateMotion dur="19s" repeatCount="indefinite">
                            <path d="M0,0 Q-25,-15 -50,0 Q-25,15 0,0 Q25,-15 50,0 Q25,15 0,0" />
                        </animateMotion>
                    </circle>
                    <circle cx="35" cy="85" r="0.8" fill="#00d4ff" opacity="0.7" filter="url(#particleGlow)">
                        <animateMotion dur="17s" repeatCount="indefinite">
                            <path d="M0,0 Q25,15 50,0 Q25,-15 0,0 Q-25,15 -50,0 Q-25,-15 0,0" />
                        </animateMotion>
                    </circle>
                    <circle cx="85" cy="85" r="0.8" fill="#00ff88" opacity="0.7" filter="url(#particleGlow)">
                        <animateMotion dur="14s" repeatCount="indefinite">
                            <path d="M0,0 Q-25,15 -50,0 Q-25,-15 0,0 Q25,15 50,0 Q25,-15 0,0" />
                        </animateMotion>
                    </circle>
                </>
            )}

            {/* Enhanced Quantum Data Flow Connections */}
            <path
                d="M22,60 Q42,35 60,22"
                fill="none"
                stroke="url(#votQuantumGradient)"
                strokeWidth="2"
                opacity="0.5"
                filter="url(#quantumGlow)"
                className={animated ? 'animate-pulse' : ''}
            />
            <path
                d="M98,60 Q78,35 60,22"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="2"
                opacity="0.5"
                filter="url(#quantumGlow)"
                className={animated ? 'animate-pulse' : ''}
                style={animated ? { animationDelay: '1s' } : {}}
            />
            <path
                d="M22,60 Q42,85 60,98"
                fill="none"
                stroke="#ff6b35"
                strokeWidth="2"
                opacity="0.5"
                filter="url(#quantumGlow)"
                className={animated ? 'animate-pulse' : ''}
                style={animated ? { animationDelay: '2s' } : {}}
            />
            <path
                d="M98,60 Q78,85 60,98"
                fill="none"
                stroke="#00ff88"
                strokeWidth="2"
                opacity="0.5"
                filter="url(#quantumGlow)"
                className={animated ? 'animate-pulse' : ''}
                style={animated ? { animationDelay: '3s' } : {}}
            />

            {/* Central Quantum Core with Multi-layered Effects */}
            <circle
                cx="60"
                cy="60"
                r="16"
                fill="url(#quantumCore)"
                filter="url(#quantumGlow)"
                opacity="0.8"
                className={animated ? 'animate-ping' : ''}
                style={animated ? { animationDuration: '7s' } : {}}
            />

            {/* Inner Quantum Core with Glitch Effect */}
            <circle
                cx="60"
                cy="60"
                r="8"
                fill="#ffffff"
                opacity="0.97"
                filter="url(#quantumGlitch)"
                className={animated ? 'animate-pulse' : ''}
                style={animated ? { animationDelay: '0.5s' } : {}}
            />

            {/* Quantum Field Rings */}
            <circle
                cx="60"
                cy="60"
                r="22"
                fill="none"
                stroke="url(#votQuantumGradient)"
                strokeWidth="0.8"
                opacity="0.4"
                filter="url(#retroScanlines)"
                className={animated ? 'animate-spin' : ''}
                style={animated ? { animationDuration: '30s' } : {}}
            />

            <circle
                cx="60"
                cy="60"
                r="26"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="0.5"
                opacity="0.3"
                filter="url(#holographicDistortion)"
                className={animated ? 'animate-spin' : ''}
                style={animated ? { animationDuration: '25s', animationDirection: 'reverse' } : {}}
            />

            {/* Final Outer Quantum Field */}
            <circle
                cx="60"
                cy="60"
                r="55"
                fill="none"
                stroke="url(#hologramField)"
                strokeWidth="1.5"
                opacity="0.25"
                filter="url(#quantumGlow)"
                className={animated ? 'animate-pulse' : ''}
                style={animated ? { animationDelay: '1.5s' } : {}}
            />

            {/* Quantum Energy Bursts */}
            {animated && (
                <>
                    <circle cx="60" cy="5" r="3" fill="url(#votQuantumGradient)" opacity="0.6" filter="url(#particleGlow)">
                        <animate attributeName="opacity" values="0;0.8;0" dur="4s" repeatCount="indefinite" />
                        <animate attributeName="r" values="1;4;1" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="115" cy="60" r="3" fill="#00d4ff" opacity="0.6" filter="url(#particleGlow)">
                        <animate attributeName="opacity" values="0;0.8;0" dur="5s" repeatCount="indefinite" />
                        <animate attributeName="r" values="1;4;1" dur="5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="60" cy="115" r="3" fill="#ff6b35" opacity="0.6" filter="url(#particleGlow)">
                        <animate attributeName="opacity" values="0;0.8;0" dur="6s" repeatCount="indefinite" />
                        <animate attributeName="r" values="1;4;1" dur="6s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="5" cy="60" r="3" fill="#8b5cf6" opacity="0.6" filter="url(#particleGlow)">
                        <animate attributeName="opacity" values="0;0.8;0" dur="7s" repeatCount="indefinite" />
                        <animate attributeName="r" values="1;4;1" dur="7s" repeatCount="indefinite" />
                    </circle>
                </>
            )}

            {/* Retro-Arcade Grid Overlay */}
            <defs>
                <pattern id="retroGrid" patternUnits="userSpaceOnUse" width="10" height="10">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="url(#votQuantumGradient)" strokeWidth="0.2" opacity="0.1" />
                </pattern>
            </defs>

            {/* Retro-Arcade Corner Accents */}
            <path d="M0,0 L15,0 L0,15 Z" fill="url(#votQuantumGradient)" opacity="0.3" />
            <path d="M120,0 L105,0 L120,15 Z" fill="#00d4ff" opacity="0.3" />
            <path d="M0,120 L15,120 L0,105 Z" fill="#ff6b35" opacity="0.3" />
            <path d="M120,120 L105,120 L120,105 Z" fill="#00ff88" opacity="0.3" />

            {/* Retro-Arcade Border Frame */}
            <rect x="2" y="2" width="116" height="116" fill="none" stroke="url(#votQuantumGradient)" strokeWidth="1" opacity="0.4" rx="4" />

            {/* Retro-Arcade Inner Frame */}
            <rect x="8" y="8" width="104" height="104" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" rx="2" />

            {/* Retro-Arcade Status Indicators */}
            <circle cx="15" cy="15" r="2" fill="#00ff88" opacity="0.8" filter="url(#particleGlow)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="105" cy="15" r="2" fill="#00d4ff" opacity="0.8" filter="url(#particleGlow)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="15" cy="105" r="2" fill="#ff6b35" opacity="0.8" filter="url(#particleGlow)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="105" cy="105" r="2" fill="#00ff88" opacity="0.8" filter="url(#particleGlow)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
}
