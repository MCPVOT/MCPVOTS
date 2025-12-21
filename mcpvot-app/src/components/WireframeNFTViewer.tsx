'use client';

import { useEffect, useMemo, useState } from 'react';

interface WireframeNFTProps {
    tokenId: string;
    // Visual attributes from smart contract
    wireframeDensity?: number; // 1-10
    geometryComplexity?: number; // 1-10
    glowIntensity?: number; // 1-10
    rotationSpeed?: number; // 1-10
    particleCount?: number; // 0-100
    tier?: 'Basic' | 'Premium' | 'Legendary';
}

/**
 * Computer Terminal NFT - Transforms NFT into a mini computer terminal
 */
function ComputerTerminal({
    tokenId,
    tier = 'Basic',
    terminalData
}: {
    tokenId: string;
    tier: 'Basic' | 'Premium' | 'Legendary';
    terminalData: { power: number; uptimeDays: number; uptimeHours: number };
}) {
    const tierConfig = {
        Basic: {
            color: '#00ff66',
            accentColor: '#00cc55',
            hardware: 'Raspberry Pi 4B',
            cpu: 'ARM Cortex-A72',
            ram: '4GB',
            storage: '32GB SSD'
        },
        Premium: {
            color: '#00d4ff',
            accentColor: '#0099cc',
            hardware: 'Intel NUC 11',
            cpu: 'Intel Core i5-1135G7',
            ram: '16GB',
            storage: '512GB NVMe'
        },
        Legendary: {
            color: '#ffd700',
            accentColor: '#ffaa00',
            hardware: 'Custom Workstation',
            cpu: 'AMD Ryzen 9 5900X',
            ram: '64GB',
            storage: '2TB NVMe RAID'
        }
    };

    const config = tierConfig[tier];

    // Generate stable performance metrics based on tokenId and tier
    const performanceData = useMemo(() => ({
        cpuUsage: Math.floor((parseInt(tokenId) * 7) % 30) + (tier === 'Legendary' ? 10 : tier === 'Premium' ? 20 : 40),
        memoryUsage: Math.floor((parseInt(tokenId) * 11) % 40) + (tier === 'Legendary' ? 20 : tier === 'Premium' ? 30 : 50),
        networkActivity: Math.floor((parseInt(tokenId) * 13) % 100)
    }), [tokenId, tier]);

    return (
        <div className="computer-terminal" style={{ '--terminal-color': config.color, '--terminal-accent': config.accentColor } as React.CSSProperties}>
            {/* Terminal Screen */}
            <div className="terminal-screen">
                <div className="terminal-header">
                    <div className="terminal-title">VOT Terminal #{tokenId}</div>
                    <div className="terminal-status">
                        <div className="status-dot"></div>
                        <span>ONLINE</span>
                    </div>
                </div>

                <div className="terminal-content">
                    <div className="system-info">
                        <div className="info-row">
                            <span className="label">HARDWARE:</span>
                            <span className="value">{config.hardware}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">CPU:</span>
                            <span className="value">{config.cpu}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">RAM:</span>
                            <span className="value">{config.ram}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">STORAGE:</span>
                            <span className="value">{config.storage}</span>
                        </div>
                    </div>

                    <div className="performance-metrics">
                        <div className="metric">
                            <div className="metric-label">CPU</div>
                            <div className="metric-bar">
                                <div
                                    className="metric-fill"
                                    style={{ width: `${performanceData.cpuUsage}%` }}
                                ></div>
                            </div>
                            <div className="metric-value">{performanceData.cpuUsage}%</div>
                        </div>
                        <div className="metric">
                            <div className="metric-label">MEM</div>
                            <div className="metric-bar">
                                <div
                                    className="metric-fill"
                                    style={{ width: `${performanceData.memoryUsage}%` }}
                                ></div>
                            </div>
                            <div className="metric-value">{performanceData.memoryUsage}%</div>
                        </div>
                        <div className="metric">
                            <div className="metric-label">NET</div>
                            <div className="metric-bar">
                                <div
                                    className="metric-fill"
                                    style={{ width: `${performanceData.networkActivity}%` }}
                                ></div>
                            </div>
                            <div className="metric-value">{performanceData.networkActivity}%</div>
                        </div>
                    </div>

                    <div className="terminal-data">
                        <div className="data-row">
                            <span className="data-label">VOT_ID:</span>
                            <span className="data-value">{tokenId}</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">STATUS:</span>
                            <span className="data-value status-active">ACTIVE</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">POWER:</span>
                            <span className="data-value">{terminalData.power}%</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">UPTIME:</span>
                            <span className="data-value">{terminalData.uptimeDays}d {terminalData.uptimeHours}h</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Terminal Base/Hardware */}
            <div className="terminal-base">
                <div className="base-front">
                    <div className="power-led"></div>
                    <div className="hdd-led"></div>
                    <div className="ports">
                        <div className="port usb"></div>
                        <div className="port ethernet"></div>
                        <div className="port hdmi"></div>
                    </div>
                </div>
                <div className="base-sides">
                    <div className="ventilation-fan">
                        <div className="fan-blades"></div>
                    </div>
                </div>
            </div>

            {/* Keyboard */}
            <div className="terminal-keyboard">
                <div className="keyboard-keys">
                    {Array.from({ length: 12 }, (_, i) => (
                        <div key={i} className="key"></div>
                    ))}
                </div>
                <div className="keyboard-bottom">
                    <div className="trackpad"></div>
                </div>
            </div>
        </div>
    );
}

/**
 * Main component for 3D Wireframe NFT visualization
 */
export default function WireframeNFTViewer({
    tokenId,
    tier = 'Basic'
}: WireframeNFTProps) {
    const [loading, setLoading] = useState(true);

    // Generate stable random values for terminal data once per component instance
    const [terminalData] = useState(() => ({
        power: Math.floor(Math.random() * 100),
        uptimeDays: Math.floor(Math.random() * 30) + 1,
        uptimeHours: Math.floor(Math.random() * 24),
    }));

    useEffect(() => {
        // Simulate loading for smoother experience
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="wireframe-nft-loader">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                <p className="text-slate-400 mt-4 text-sm">Rendering NFT...</p>
            </div>
        );
    }

    return (
        <div className="wireframe-nft-container">
            {/* Computer Terminal NFT */}
            <ComputerTerminal
                tokenId={tokenId}
                tier={tier}
                terminalData={terminalData}
            />

            {/* Corner brackets (terminal aesthetic) */}
            <div className="wireframe-corners">
                <div className="corner corner-tl"></div>
                <div className="corner corner-tr"></div>
                <div className="corner corner-bl"></div>
                <div className="corner corner-br"></div>
            </div>

            <style jsx>{`
                .wireframe-nft-container {
                    position: relative;
                    width: 100%;
                    height: 500px;
                    background: rgba(0, 0, 0, 0.8);
                    border: 2px solid var(--terminal-color, #00ff66);
                    border-radius: 12px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .computer-terminal {
                    width: 100%;
                    max-width: 400px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    font-family: 'Courier New', monospace;
                }

                .terminal-screen {
                    background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
                    border: 2px solid var(--terminal-color, #00ff66);
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow:
                        0 0 20px rgba(0, 255, 102, 0.3),
                        inset 0 0 20px rgba(0, 255, 102, 0.1);
                    position: relative;
                }

                .terminal-screen::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, var(--terminal-color, #00ff66), transparent);
                    animation: scanLine 3s linear infinite;
                }

                .terminal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--terminal-color, #00ff66);
                }

                .terminal-title {
                    color: var(--terminal-color, #00ff66);
                    font-size: 14px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .terminal-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--terminal-color, #00ff66);
                    font-size: 12px;
                    text-transform: uppercase;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--terminal-color, #00ff66);
                    border-radius: 50%;
                    box-shadow: 0 0 8px var(--terminal-color, #00ff66);
                    animation: pulse 2s ease-in-out infinite;
                }

                .terminal-content {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .system-info {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(0, 255, 102, 0.3);
                    border-radius: 4px;
                    padding: 10px;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                    font-size: 11px;
                }

                .info-row:last-child {
                    margin-bottom: 0;
                }

                .label {
                    color: rgba(0, 255, 102, 0.7);
                    font-weight: bold;
                }

                .value {
                    color: var(--terminal-color, #00ff66);
                    text-align: right;
                }

                .performance-metrics {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .metric {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .metric-label {
                    color: rgba(0, 255, 102, 0.7);
                    font-size: 10px;
                    font-weight: bold;
                    min-width: 30px;
                }

                .metric-bar {
                    flex: 1;
                    height: 6px;
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(0, 255, 102, 0.3);
                    border-radius: 3px;
                    overflow: hidden;
                }

                .metric-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--terminal-color, #00ff66), var(--terminal-accent, #00cc55));
                    border-radius: 2px;
                    transition: width 0.5s ease;
                }

                .metric-value {
                    color: var(--terminal-color, #00ff66);
                    font-size: 10px;
                    font-weight: bold;
                    min-width: 35px;
                    text-align: right;
                }

                .terminal-data {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(0, 255, 102, 0.3);
                    border-radius: 4px;
                    padding: 10px;
                }

                .data-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                    font-size: 11px;
                }

                .data-row:last-child {
                    margin-bottom: 0;
                }

                .data-label {
                    color: rgba(0, 255, 102, 0.7);
                    font-weight: bold;
                }

                .data-value {
                    color: var(--terminal-color, #00ff66);
                    text-align: right;
                }

                .status-active {
                    color: #00ff66 !important;
                    font-weight: bold;
                }

                .terminal-base {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 20px;
                    margin-top: 10px;
                }

                .base-front {
                    width: 120px;
                    height: 40px;
                    background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
                    border: 2px solid #444;
                    border-radius: 4px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 8px;
                }

                .power-led {
                    width: 6px;
                    height: 6px;
                    background: var(--terminal-color, #00ff66);
                    border-radius: 50%;
                    box-shadow: 0 0 6px var(--terminal-color, #00ff66);
                    animation: ledPulse 3s ease-in-out infinite;
                }

                .hdd-led {
                    width: 4px;
                    height: 4px;
                    background: #ffaa00;
                    border-radius: 50%;
                    box-shadow: 0 0 4px #ffaa00;
                    animation: hddBlink 2s step-end infinite;
                }

                .ports {
                    display: flex;
                    gap: 4px;
                }

                .port {
                    width: 8px;
                    height: 6px;
                    background: #333;
                    border: 1px solid #666;
                    border-radius: 1px;
                }

                .base-sides {
                    width: 20px;
                    height: 40px;
                    background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
                    border: 1px solid #444;
                    border-radius: 2px;
                    position: relative;
                }

                .ventilation-fan {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 12px;
                    height: 12px;
                    background: #1a1a1a;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .fan-blades {
                    width: 8px;
                    height: 8px;
                    background: conic-gradient(from 0deg, #666, #333, #666, #333);
                    border-radius: 50%;
                    animation: fanSpin 2s linear infinite;
                }

                .terminal-keyboard {
                    width: 200px;
                    height: 60px;
                    background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
                    border: 2px solid #444;
                    border-radius: 6px;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }

                .keyboard-keys {
                    flex: 1;
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 2px;
                    padding: 8px;
                }

                .key {
                    background: #333;
                    border: 1px solid #666;
                    border-radius: 2px;
                    transition: background 0.2s ease;
                }

                .key:hover {
                    background: #444;
                }

                .keyboard-bottom {
                    height: 15px;
                    background: #1a1a1a;
                    border-top: 1px solid #444;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2px;
                }

                .trackpad {
                    width: 30px;
                    height: 8px;
                    background: #222;
                    border: 1px solid #666;
                    border-radius: 2px;
                }

                .wireframe-corners {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 10;
                }

                .corner {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--terminal-color, rgba(0, 255, 102, 0.6));
                }

                .corner-tl {
                    top: 0;
                    left: 0;
                    border-right: none;
                    border-bottom: none;
                }

                .corner-tr {
                    top: 0;
                    right: 0;
                    border-left: none;
                    border-bottom: none;
                }

                .corner-bl {
                    bottom: 0;
                    left: 0;
                    border-right: none;
                    border-top: none;
                }

                .corner-br {
                    bottom: 0;
                    right: 0;
                    border-left: none;
                    border-top: none;
                }

                @keyframes scanLine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                @keyframes ledPulse {
                    0%, 100% {
                        box-shadow: 0 0 6px var(--terminal-color, #00ff66);
                        opacity: 1;
                    }
                    50% {
                        box-shadow: 0 0 12px var(--terminal-color, #00ff66);
                        opacity: 0.7;
                    }
                }

                @keyframes hddBlink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }

                @keyframes fanSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
