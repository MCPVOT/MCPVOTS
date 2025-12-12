'use client';

import { useEffect, useRef } from 'react';

/**
 * VOT Hieroglyphics Background
 * Custom canvas-based background with floating Sumerian-inspired glyphs
 * Optimized for Farcaster embedding - NO Three.js
 */

// VOT Glyph Codex - 33 Symbols of the x402 Continuum
const VOT_GLYPHS = [
    '𒆜', // Oracle
    '𒄑', // Protocol
    '𒀭', // Agentic
    '𒁹', // $VOT
    '𒃲', // MCP
    '𒇻', // x402
    '𒆠', // Ecosystem
    '𒉿', // Base
    '𒈦', // Farcaster
    '𒉌', // Neynar
    '𒂗', // Facilitator
    '𒉣', // Vault
    '𒋼', // Burn
    '𒂍', // Mint
    '𒇲', // Flow
    '𒅗', // Signal
    '𒂅', // Memory
    '𒄷', // Warp
    '𒉺', // Prime
    '𒊕', // Sentinel
    '𒁕', // Beacon
    '𒀰', // Gate
    '𒊒', // Synth
    '𒄿', // Pulse
    '𒂆', // Forge
];

// Color palette - MCPVOT branding
const COLORS = {
    darkBg: '#0a0e1a',
    cyan: '#00FFFF',
    green: '#00FF88',
    orange: '#FF8800',
    magenta: '#FF00FF',
    amber: '#FFAA00',
};

interface Glyph {
    x: number;
    y: number;
    vx: number;
    vy: number;
    char: string;
    size: number;
    opacity: number;
    fadeSpeed: number;
    color: string;
    rotationAngle: number;
    rotationSpeed: number;
    pulsePhase: number;
}

export default function VOTHieroglyphicsBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glyphsRef = useRef<Glyph[]>([]);
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Initialize glyphs
        const initGlyphs = () => {
            const count = Math.min(40, Math.floor(window.innerWidth / 50)); // Responsive count
            glyphsRef.current = [];
            
            for (let i = 0; i < count; i++) {
                glyphsRef.current.push(createGlyph(canvas.width, canvas.height));
            }
        };

        const createGlyph = (width: number, height: number): Glyph => {
            const colors = [COLORS.cyan, COLORS.green, COLORS.orange, COLORS.magenta, COLORS.amber];
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3 - 0.1, // Slight upward drift
                char: VOT_GLYPHS[Math.floor(Math.random() * VOT_GLYPHS.length)],
                size: 18 + Math.random() * 24,
                opacity: Math.random() * 0.4 + 0.1,
                fadeSpeed: (Math.random() - 0.5) * 0.002,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotationAngle: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.005,
                pulsePhase: Math.random() * Math.PI * 2,
            };
        };

        initGlyphs();

        let time = 0;

        const animate = () => {
            time += 1;
            
            // Clear with dark background
            ctx.fillStyle = COLORS.darkBg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw grid
            drawGrid(ctx, canvas.width, canvas.height, time);

            // Draw scan lines
            drawScanLines(ctx, canvas.width, canvas.height, time);

            // Draw glyphs
            for (let i = 0; i < glyphsRef.current.length; i++) {
                const glyph = glyphsRef.current[i];

                // Update position
                glyph.x += glyph.vx;
                glyph.y += glyph.vy;
                glyph.rotationAngle += glyph.rotationSpeed;
                glyph.pulsePhase += 0.02;

                // Update opacity with pulse
                glyph.opacity += glyph.fadeSpeed;
                const pulseFactor = 0.1 * Math.sin(glyph.pulsePhase);
                const displayOpacity = Math.max(0.05, Math.min(0.5, glyph.opacity + pulseFactor));

                // Wrap around edges
                if (glyph.x < -50) glyph.x = canvas.width + 50;
                if (glyph.x > canvas.width + 50) glyph.x = -50;
                if (glyph.y < -50) glyph.y = canvas.height + 50;
                if (glyph.y > canvas.height + 50) glyph.y = -50;

                // Reverse fade direction at bounds
                if (glyph.opacity <= 0.05 || glyph.opacity >= 0.5) {
                    glyph.fadeSpeed = -glyph.fadeSpeed;
                }

                // Draw glyph with glow
                ctx.save();
                ctx.translate(glyph.x, glyph.y);
                ctx.rotate(glyph.rotationAngle);
                
                // Glow effect
                ctx.shadowColor = glyph.color;
                ctx.shadowBlur = 20;
                ctx.globalAlpha = displayOpacity;
                ctx.fillStyle = glyph.color;
                ctx.font = `${glyph.size}px "Noto Sans Sumerian", "Noto Sans Cuneiform", serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(glyph.char, 0, 0);
                
                ctx.restore();
            }

            // Draw corner accents
            drawCornerAccents(ctx, canvas.width, canvas.height, time);

            // Draw top/bottom bars
            drawAccentBars(ctx, canvas.width, canvas.height, time);

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="fixed inset-0 -z-10"
                style={{ background: COLORS.darkBg }}
            />
            {/* CRT effect overlay */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                {/* Scanlines */}
                <div 
                    className="absolute inset-0"
                    style={{
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                    }}
                />
                {/* Vignette */}
                <div 
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
                    }}
                />
                {/* Subtle cyan glow from bottom */}
                <div 
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse at bottom, rgba(0,255,255,0.05) 0%, transparent 50%)',
                    }}
                />
            </div>
        </>
    );
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
    const gridSize = 60;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Pulsing highlight lines
    ctx.strokeStyle = `rgba(0, 255, 136, ${0.05 + 0.03 * Math.sin(time * 0.01)})`;
    ctx.lineWidth = 1;

    // Highlight every 4th line
    for (let x = 0; x < width; x += gridSize * 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
}

function drawScanLines(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
    // Horizontal scanning line
    const scanY = (time * 2) % (height + 100) - 50;
    
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 20;
    
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(width, scanY);
    ctx.stroke();
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function drawCornerAccents(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
    const cornerSize = 100;
    const pulse = 0.4 + 0.1 * Math.sin(time * 0.02);
    
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 2;
    ctx.globalAlpha = pulse;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 15;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(0, cornerSize);
    ctx.lineTo(0, 0);
    ctx.lineTo(cornerSize, 0);
    ctx.stroke();

    ctx.strokeStyle = COLORS.green;
    ctx.shadowColor = COLORS.green;

    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - cornerSize, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, cornerSize);
    ctx.stroke();

    ctx.strokeStyle = COLORS.orange;
    ctx.shadowColor = COLORS.orange;

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(0, height - cornerSize);
    ctx.lineTo(0, height);
    ctx.lineTo(cornerSize, height);
    ctx.stroke();

    ctx.strokeStyle = COLORS.magenta;
    ctx.shadowColor = COLORS.magenta;

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - cornerSize, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height - cornerSize);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function drawAccentBars(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
    const barHeight = 3;
    const glow = 10 + 5 * Math.sin(time * 0.015);

    // Top bar gradient
    const topGradient = ctx.createLinearGradient(0, 0, width, 0);
    topGradient.addColorStop(0, 'transparent');
    topGradient.addColorStop(0.2, COLORS.cyan);
    topGradient.addColorStop(0.5, COLORS.green);
    topGradient.addColorStop(0.8, COLORS.orange);
    topGradient.addColorStop(1, 'transparent');

    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = glow;
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, width, barHeight);

    // Bottom bar
    ctx.shadowColor = COLORS.green;
    ctx.fillRect(0, height - barHeight, width, barHeight);

    ctx.shadowBlur = 0;
}
