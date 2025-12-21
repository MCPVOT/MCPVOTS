'use client';

import { useEffect, useRef } from 'react';

/**
 * Modern, dark, high-contrast background aligned with MCPVOT branding
 * Minimal animation optimized for Farcaster embedding
 */
export default function MCPVOTBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Color palette - MCPVOT branding
        const colors = {
            darkBg: '#0a0e27', // Deep navy
            accent1: '#00ff88', // Neon green
            accent2: '#00ccff', // Cyan
            accent3: '#ff6b00', // Orange (VOT token color)
            subtle: '#1a2332', // Subtle grid background
            text: '#ffffff',
        };

        let animationFrameId: number;
        let time = 0;

        // Particle system for subtle animation
        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            life: number;
            maxLife: number;
            size: number;
            color: string;
        }> = [];

        // Generate initial particles
        const createParticles = () => {
            for (let i = 0; i < 3; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    life: 0,
                    maxLife: 200 + Math.random() * 300,
                    size: 1 + Math.random() * 2,
                    color: [colors.accent1, colors.accent2, colors.accent3][Math.floor(Math.random() * 3)],
                });
            }
        };

        createParticles();

        const animate = () => {
            time += 1;

            // Clear canvas with dark background
            ctx.fillStyle = colors.darkBg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw subtle grid pattern
            ctx.strokeStyle = colors.subtle;
            ctx.lineWidth = 0.5;
            const gridSize = 50;

            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Animate glowing lines
            drawGlowingLines(ctx, canvas.width, canvas.height, time, colors);

            // Update and draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];

                p.x += p.vx;
                p.y += p.vy;
                p.life += 1;

                // Wrap around edges
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Calculate opacity based on life
                const opacity = 1 - p.life / p.maxLife;

                // Draw particle with glow
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 15;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = opacity * 0.6;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;

                // Regenerate dead particles
                if (p.life > p.maxLife) {
                    particles.splice(i, 1);
                    createParticles();
                }
            }

            // Draw top accent bar
            drawAccentBar(ctx, canvas.width, time, colors);

            // Draw corner accents
            drawCornerAccents(ctx, canvas.width, canvas.height, colors);

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="fixed inset-0 -z-10"
                style={{ background: '#0a0e27' }}
            />
            {/* Overlay gradient for depth */}
            <div className="fixed inset-0 -z-10 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at bottom, rgba(0, 255, 136, 0.05) 0%, transparent 70%)',
                }}
            />
        </>
    );
}

/**
 * Draw animated glowing lines across the canvas
 */
function drawGlowingLines(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    colors: Record<string, string>
) {
    // Horizontal scan lines with pulsing glow
    ctx.strokeStyle = colors.accent1;
    ctx.lineWidth = 1;
    ctx.shadowColor = colors.accent1;
    ctx.shadowBlur = 20;
    ctx.globalAlpha = 0.15 + Math.sin(time * 0.01) * 0.1;

    // Multiple horizontal lines
    for (let i = 0; i < 5; i++) {
        const y = (height / 5) * (i + 1) + Math.sin(time * 0.005 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Vertical accent lines
    ctx.strokeStyle = colors.accent2;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2 + Math.cos(time * 0.008) * 0.1;

    for (let i = 0; i < 3; i++) {
        const x = (width / 4) * (i + 1);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
}

/**
 * Draw animated accent bar at top
 */
function drawAccentBar(
    ctx: CanvasRenderingContext2D,
    width: number,
    time: number,
    colors: Record<string, string>
) {
    const barHeight = 3;
    const glow = 10 + Math.sin(time * 0.01) * 5;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.2, colors.accent2);
    gradient.addColorStop(0.5, colors.accent1);
    gradient.addColorStop(0.8, colors.accent3);
    gradient.addColorStop(1, 'transparent');

    ctx.shadowColor = colors.accent1;
    ctx.shadowBlur = glow;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, barHeight);

    // Bottom accent bar
    ctx.shadowColor = colors.accent3;
    ctx.shadowBlur = glow;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, window.innerHeight - barHeight, width, barHeight);

    ctx.shadowBlur = 0;
}

/**
 * Draw corner accents for visual interest
 */
function drawCornerAccents(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: Record<string, string>
) {
    const cornerSize = 80;
    const lineWidth = 2;

    // Helper to draw corner bracket
    const drawCorner = (x: number, y: number, color: string, angle: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = 0.4;

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(cornerSize, 0);
        ctx.stroke();

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, cornerSize);
        ctx.stroke();

        ctx.restore();
        ctx.globalAlpha = 1;
    };

    // Top-left
    drawCorner(0, 0, colors.accent1, 0);

    // Top-right
    drawCorner(width, 0, colors.accent2, Math.PI / 2);

    // Bottom-left
    drawCorner(0, height, colors.accent3, -Math.PI / 2);

    // Bottom-right
    drawCorner(width, height, colors.accent1, Math.PI);
}
