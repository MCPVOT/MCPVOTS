'use client';

import { ReactNode, useState } from 'react';

interface TerminalButtonProps {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'success' | 'warning' | 'danger';
    className?: string;
    glowColor?: string;
}

export default function TerminalButton({
    children,
    onClick,
    disabled = false,
    variant = 'primary',
    className = '',
    glowColor
}: TerminalButtonProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const variantStyles = {
        primary: {
            bg: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20',
            border: 'border-cyan-400/60',
            text: 'text-cyan-100',
            glow: glowColor || 'rgba(34, 211, 238, 0.4)',
            hoverGlow: glowColor || 'rgba(34, 211, 238, 0.6)'
        },
        success: {
            bg: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
            border: 'border-green-400/60',
            text: 'text-green-100',
            glow: 'rgba(34, 197, 94, 0.4)',
            hoverGlow: 'rgba(34, 197, 94, 0.6)'
        },
        warning: {
            bg: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20',
            border: 'border-orange-400/60',
            text: 'text-orange-100',
            glow: 'rgba(251, 146, 60, 0.4)',
            hoverGlow: 'rgba(251, 146, 60, 0.6)'
        },
        danger: {
            bg: 'bg-gradient-to-r from-red-500/20 to-rose-500/20',
            border: 'border-red-400/60',
            text: 'text-red-100',
            glow: 'rgba(239, 68, 68, 0.4)',
            hoverGlow: 'rgba(239, 68, 68, 0.6)'
        }
    };

    const style = variantStyles[variant];

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setIsPressed(false);
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            className={`
        relative
        inline-flex
        items-center
        justify-center
        px-6
        py-3
        font-mono
        text-sm
        uppercase
        tracking-widest
        font-bold
        ${style.bg}
        ${style.border}
        ${style.text}
        border-2
        rounded-lg
        overflow-hidden
        transition-all
        duration-300
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${!disabled ? 'hover:scale-105 active:scale-95' : ''}
        ${className}
      `}
            style={{
                boxShadow: disabled
                    ? 'none'
                    : isPressed
                        ? `0 0 5px ${style.glow}, inset 0 0 10px ${style.glow}`
                        : isHovered
                            ? `0 0 20px ${style.hoverGlow}, 0 0 40px ${style.glow}`
                            : `0 0 10px ${style.glow}`
            }}
        >
            {/* Scanline effect */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: isHovered
                        ? 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)'
                        : 'none',
                    animation: isHovered ? 'scanline 2s linear infinite' : 'none'
                }}
            />

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-50" />

            {/* Glitch effect on hover */}
            {isHovered && !disabled && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `linear-gradient(90deg, transparent 0%, ${style.glow} 50%, transparent 100%)`,
                        animation: 'glitchSweep 3s ease-in-out infinite'
                    }}
                />
            )}

            {/* Content */}
            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>
        </button>
    );
}
