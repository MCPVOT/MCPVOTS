'use client';

import { useEffect, useRef, useState } from 'react';

interface TerminalLine {
    type: 'input' | 'output' | 'error' | 'success';
    content: string;
    timestamp?: Date;
}

interface TerminalWindowProps {
    title?: string;
    lines: TerminalLine[];
    showPrompt?: boolean;
    promptText?: string;
    onCommand?: (command: string) => void;
    maxLines?: number;
    autoScroll?: boolean;
    className?: string;
}

/**
 * TerminalWindow - Retro terminal display widget
 * CRT-style terminal with scanlines, typing effect, and command input
 * Perfect for displaying logs, code output, or interactive commands
 */
export default function TerminalWindow({
    title = 'MCPVOT TERMINAL',
    lines,
    showPrompt = false,
    promptText = '>>',
    onCommand,
    maxLines = 100,
    autoScroll = true,
    className = '',
}: TerminalWindowProps) {
    const [inputValue, setInputValue] = useState('');
    const terminalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new lines are added
    useEffect(() => {
        if (autoScroll && terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [lines, autoScroll]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && onCommand) {
            onCommand(inputValue.trim());
            setInputValue('');
        }
    };

    const handleTerminalClick = () => {
        inputRef.current?.focus();
    };

    const typeColors = {
        input: '#00ff41',
        output: '#ffffff',
        error: '#ff4444',
        success: '#00d4ff',
    };

    // Limit displayed lines
    const displayedLines = lines.slice(-maxLines);

    return (
        <div className={`terminal-window ${className}`} onClick={handleTerminalClick}>
            <div className="terminal-header">
                <div className="terminal-buttons">
                    <span className="terminal-button close"></span>
                    <span className="terminal-button minimize"></span>
                    <span className="terminal-button maximize"></span>
                </div>
                <div className="terminal-title">{title}</div>
            </div>

            <div className="terminal-body" ref={terminalRef}>
                {displayedLines.map((line, index) => (
                    <div key={index} className={`terminal-line terminal-line-${line.type}`}>
                        {line.type === 'input' && <span className="terminal-prompt">{promptText}</span>}
                        <span className="terminal-content" style={{ color: typeColors[line.type] }}>
                            {line.content}
                        </span>
                        {line.timestamp && (
                            <span className="terminal-timestamp">
                                [{line.timestamp.toLocaleTimeString('en-US', { hour12: false })}]
                            </span>
                        )}
                    </div>
                ))}

                {showPrompt && (
                    <form onSubmit={handleSubmit} className="terminal-input-line">
                        <span className="terminal-prompt">{promptText}</span>
                        <input
                            ref={inputRef}
                            type="text"
                            className="terminal-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            autoFocus
                            spellCheck={false}
                        />
                        <span className="terminal-cursor">_</span>
                    </form>
                )}
            </div>

            <style jsx>{`
                .terminal-window {
                    position: relative;
                    background: #0a0a0f;
                    border: 2px solid #00ff41;
                    border-radius: 8px;
                    overflow: hidden;
                    font-family: 'Courier New', monospace;
                    box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
                }

                .terminal-window::before {
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
                        rgba(0, 255, 65, 0.05) 2px,
                        rgba(0, 255, 65, 0.05) 4px
                    );
                    pointer-events: none;
                    z-index: 1;
                }

                .terminal-header {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    background: rgba(0, 255, 65, 0.1);
                    border-bottom: 1px solid #00ff41;
                    gap: 1rem;
                }

                .terminal-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .terminal-button {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #ff4444;
                }

                .terminal-button.minimize {
                    background: #ff8c00;
                }

                .terminal-button.maximize {
                    background: #00ff41;
                }

                .terminal-title {
                    flex: 1;
                    text-align: center;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: #00ff41;
                    font-weight: bold;
                }

                .terminal-body {
                    padding: 1rem;
                    min-height: 300px;
                    max-height: 500px;
                    overflow-y: auto;
                    line-height: 1.6;
                    position: relative;
                    z-index: 2;
                }

                .terminal-body::-webkit-scrollbar {
                    width: 8px;
                }

                .terminal-body::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.3);
                }

                .terminal-body::-webkit-scrollbar-thumb {
                    background: rgba(0, 255, 65, 0.5);
                    border-radius: 4px;
                }

                .terminal-body::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 255, 65, 0.7);
                }

                .terminal-line {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    animation: fade-in 0.3s ease;
                }

                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .terminal-prompt {
                    color: #00ff41;
                    font-weight: bold;
                    user-select: none;
                }

                .terminal-content {
                    flex: 1;
                    word-break: break-word;
                }

                .terminal-timestamp {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.4);
                    margin-left: auto;
                }

                .terminal-line-error .terminal-content {
                    text-shadow: 0 0 5px #ff4444;
                }

                .terminal-line-success .terminal-content {
                    text-shadow: 0 0 5px #00d4ff;
                }

                .terminal-input-line {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }

                .terminal-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: #00ff41;
                    font-family: 'Courier New', monospace;
                    font-size: 1rem;
                    caret-color: transparent;
                }

                .terminal-cursor {
                    color: #00ff41;
                    animation: blink 1s step-end infinite;
                }

                @keyframes blink {
                    0%,
                    50% {
                        opacity: 1;
                    }
                    50.01%,
                    100% {
                        opacity: 0;
                    }
                }

                @media (max-width: 424px) {
                    .terminal-body {
                        min-height: 200px;
                        max-height: 300px;
                        padding: 0.75rem;
                    }

                    .terminal-title {
                        font-size: 0.75rem;
                    }
                }
            `}</style>
        </div>
    );
}
