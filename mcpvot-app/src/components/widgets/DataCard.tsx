'use client';

import { ReactNode } from 'react';

interface DataCardProps {
    icon?: string | ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'green' | 'blue' | 'orange' | 'purple';
    glowing?: boolean;
    className?: string;
}

/**
 * DataCard - Modular metric display widget
 * Cyberpunk aesthetic with neon borders and dark theme
 * Supports trending indicators and custom colors
 */
export default function DataCard({
    icon,
    label,
    value,
    subValue,
    trend,
    color = 'green',
    glowing = false,
    className = '',
}: DataCardProps) {
    const colorMap = {
        green: '#00ff41',
        blue: '#00d4ff',
        orange: '#ff8c00',
        purple: '#fb923c',
    };

    const borderColor = colorMap[color];
    const glowClass = glowing ? 'data-card-glow' : '';
    const trendIcon =
        trend === 'up' ? '▲' : trend === 'down' ? '▼' : trend === 'neutral' ? '━' : null;

    return (
        <div className={`data-card ${glowClass} ${className}`} style={{ borderColor }}>
            {icon && <div className="data-card-icon">{icon}</div>}

            <div className="data-card-content">
                <div className="data-card-label">{label}</div>
                <div className="data-card-value" style={{ color: borderColor }}>
                    {value}
                    {trendIcon && <span className={`trend-indicator trend-${trend}`}>{trendIcon}</span>}
                </div>
                {subValue && <div className="data-card-subvalue">{subValue}</div>}
            </div>

            <div className="data-card-scanline" />

            <style jsx>{`
                .data-card {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: rgba(10, 10, 15, 0.85);
                    border: 2px solid;
                    border-radius: 8px;
                    padding: 1.5rem;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .data-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 0 20px rgba(0, 255, 65, 0.3), 0 0 40px rgba(255, 140, 0, 0.2);
                }

                .data-card-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }

                @keyframes pulse-glow {
                    0%,
                    100% {
                        box-shadow: 0 0 10px rgba(0, 255, 65, 0.4), 0 0 20px rgba(255, 140, 0, 0.2);
                    }
                    50% {
                        box-shadow: 0 0 25px rgba(0, 255, 65, 0.8), 0 0 40px rgba(255, 140, 0, 0.4);
                    }
                }

                .data-card-icon {
                    font-size: 2rem;
                    opacity: 0.8;
                    min-width: 40px;
                    text-align: center;
                }

                .data-card-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .data-card-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: rgba(255, 255, 255, 0.5);
                    font-family: 'Courier New', monospace;
                }

                .data-card-value {
                    font-size: 1.75rem;
                    font-weight: bold;
                    font-family: 'Courier New', monospace;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .data-card-subvalue {
                    font-size: 0.875rem;
                    color: rgba(255, 255, 255, 0.6);
                    font-family: 'Courier New', monospace;
                }

                .trend-indicator {
                    font-size: 1rem;
                    margin-left: 0.5rem;
                }

                .trend-up {
                    color: #00ff41;
                }

                .trend-down {
                    color: #ff4444;
                }

                .trend-neutral {
                    color: #ffaa00;
                }

                .data-card-scanline {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(0, 255, 65, 0.6),
                        transparent
                    );
                    animation: scanline-move 3s linear infinite;
                }

                @keyframes scanline-move {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }

                @media (max-width: 424px) {
                    .data-card {
                        padding: 1rem;
                        gap: 0.75rem;
                    }

                    .data-card-icon {
                        font-size: 1.5rem;
                        min-width: 30px;
                    }

                    .data-card-value {
                        font-size: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
