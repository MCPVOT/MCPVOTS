'use client';

import { ReactNode } from 'react';

interface StatusItem {
    label: string;
    value: string | number;
    status: 'online' | 'offline' | 'warning' | 'error';
}

interface StatusPanelProps {
    title: string;
    items: StatusItem[];
    headerIcon?: string | ReactNode;
    className?: string;
}

/**
 * StatusPanel - System status display widget
 * Shows multiple status items with color-coded indicators
 * Retro terminal aesthetic with scanlines and neon glow
 */
export default function StatusPanel({ title, items, headerIcon, className = '' }: StatusPanelProps) {
    const statusColors = {
        online: '#00ff41',
        offline: '#666666',
        warning: '#ff8c00',
        error: '#ff4444',
    };

    return (
        <div className={`status-panel ${className}`}>
            <div className="status-panel-header">
                {headerIcon && <span className="status-header-icon">{headerIcon}</span>}
                <h3 className="status-panel-title">{title}</h3>
                <div className="status-header-line" />
            </div>

            <div className="status-panel-body">
                {items.map((item, index) => (
                    <div key={index} className="status-item">
                        <div
                            className="status-dot"
                            style={{
                                backgroundColor: statusColors[item.status],
                                boxShadow: `0 0 10px ${statusColors[item.status]}`,
                            }}
                        />
                        <div className="status-item-content">
                            <span className="status-item-label">{item.label}</span>
                            <span className="status-item-value" style={{ color: statusColors[item.status] }}>
                                {item.value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="status-panel-footer">
                <span className="status-timestamp">
                    {new Date().toLocaleTimeString('en-US', { hour12: false })}
                </span>
            </div>

            <style jsx>{`
                .status-panel {
                    position: relative;
                    background: rgba(10, 10, 15, 0.9);
                    border: 2px solid #00ff41;
                    border-radius: 8px;
                    overflow: hidden;
                    font-family: 'Courier New', monospace;
                }

                .status-panel::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0, 255, 65, 0.03) 2px,
                        rgba(0, 255, 65, 0.03) 4px
                    );
                    pointer-events: none;
                }

                .status-panel-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    background: rgba(0, 255, 65, 0.1);
                    border-bottom: 1px solid #00ff41;
                }

                .status-header-icon {
                    font-size: 1.5rem;
                }

                .status-panel-title {
                    margin: 0;
                    font-size: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: #00ff41;
                    font-weight: bold;
                }

                .status-header-line {
                    flex: 1;
                    height: 1px;
                    background: linear-gradient(90deg, #00ff41, transparent);
                    margin-left: 1rem;
                }

                .status-panel-body {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .status-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem;
                    background: rgba(0, 255, 65, 0.05);
                    border-left: 3px solid transparent;
                    transition: all 0.3s ease;
                }

                .status-item:hover {
                    background: rgba(0, 255, 65, 0.1);
                    border-left-color: #00ff41;
                }

                .status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    animation: pulse-dot 2s ease-in-out infinite;
                }

                @keyframes pulse-dot {
                    0%,
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.2);
                        opacity: 0.8;
                    }
                }

                .status-item-content {
                    flex: 1;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .status-item-label {
                    font-size: 0.875rem;
                    color: rgba(255, 255, 255, 0.7);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .status-item-value {
                    font-size: 1rem;
                    font-weight: bold;
                }

                .status-panel-footer {
                    padding: 0.75rem 1.5rem;
                    background: rgba(0, 0, 0, 0.3);
                    border-top: 1px solid rgba(0, 255, 65, 0.2);
                    text-align: right;
                }

                .status-timestamp {
                    font-size: 0.75rem;
                    color: rgba(0, 255, 65, 0.6);
                    letter-spacing: 0.1em;
                }

                @media (max-width: 424px) {
                    .status-panel-header {
                        padding: 0.75rem 1rem;
                    }

                    .status-panel-title {
                        font-size: 0.875rem;
                    }

                    .status-panel-body {
                        padding: 1rem;
                        gap: 0.75rem;
                    }

                    .status-item {
                        padding: 0.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
