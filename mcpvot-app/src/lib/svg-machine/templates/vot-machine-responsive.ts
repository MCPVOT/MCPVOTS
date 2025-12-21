/**
 * VOT Machine Responsive SVG/HTML Generator
 * 
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  CLAUDE CODE APP TASK #230                                                  ║
 * ║  Create stunning responsive VOT Machine NFT visuals                         ║
 * ║  Mobile-first, animated, accessible                                         ║
 * ╠════════════════════════════════════════════════════════════════════════════╣
 * ║  MCP Memory Context:                                                        ║
 * ║  - #228: Knowledge Graph (master index)                                     ║
 * ║  - #226: NFT Architecture v2.0                                              ║
 * ║  - #229: LLM Integration Config                                             ║
 * ║  - #227: Staking Tokenomics                                                 ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */


// =============================================================================
// TYPES
// =============================================================================

export type TraitName = 'vot' | 'mcpvot' | 'warplet' | 'base' | 'farcaster' | 'ens';
export type TierName = 'mcpvot' | 'maxx' | 'warplet' | 'ens' | 'base' | 'farcaster' | 'architek' | 'oracle';

export interface UserTraits {
  vot: boolean;
  mcpvot: boolean;
  warplet: boolean;
  base: boolean;
  farcaster: boolean;
  ens: boolean;
}

export interface VotMachineData {
  // Identity
  displayName: string;
  address: string;
  bio?: string;
  avatarUrl?: string;
  
  // Traits (6 identity-based)
  traits: UserTraits;
  
  // Stats (updatable)
  votBalance: string;
  stakingRewards?: string;
  xpLevel?: number;
  xpProgress?: number; // 0-100
  
  // Metadata
  tokenId?: string;
  ipfsCid?: string;
  tier?: TierName;
  lastUpdated?: string;
}

export interface ResponsiveOptions {
  // Output format
  format: 'svg' | 'html' | 'react';
  
  // Animation preferences - MCPVOT Unique Effects
  animations: {
    bootSequence: boolean;        // Terminal typing effect
    glyphStream: boolean;         // 𒆜 Sumerian hieroglyphic rain (replaces Matrix)
    glyphConstellation: boolean;  // 𒁹 Orbiting protocol symbols
    sacredGeometry: boolean;      // 🔯 Metatron's Cube / Flower of Life
    votConstellation: boolean;    // 🔮 Floating VOT particles
    mcpNetwork: boolean;          // ⚡ Neural network pulse connections
    burnEffect: boolean;          // 🔥 Deflationary flame at bottom
    identityConvergence: boolean; // 🌀 6 traits connecting with beams
    tierAura: boolean;            // 💫 Tier-specific ambient effects
    chainFlow: boolean;           // 🔗 Base chain links rising
    glowPulse: boolean;           // Tier badge glow
    statsCounter: boolean;        // Number counting animation
    reducedMotion?: boolean;      // Respect prefers-reduced-motion
  };
  
  // Size hints
  targetWidth?: number;
  aspectRatio?: '4:3' | '16:9' | '9:16' | 'auto';
}

// =============================================================================
// COLOR SYSTEM
// =============================================================================

export const TRAIT_COLORS: Record<TraitName, { active: string; glow: string; icon: string }> = {
  vot: { active: '#9945FF', glow: 'rgba(153,69,255,0.5)', icon: '🔮' },
  mcpvot: { active: '#00FFCC', glow: 'rgba(0,255,204,0.5)', icon: '⚡' },
  warplet: { active: '#FF6B00', glow: 'rgba(255,107,0,0.5)', icon: '🌀' },
  base: { active: '#0052FF', glow: 'rgba(0,82,255,0.5)', icon: '🔵' },
  farcaster: { active: '#8A63D2', glow: 'rgba(138,99,210,0.5)', icon: '💜' },
  ens: { active: '#5298FF', glow: 'rgba(82,152,255,0.5)', icon: '🏷️' },
};

export const TIER_COLORS: Record<TierName, { color: string; emoji: string; name: string }> = {
  mcpvot: { color: '#00FFCC', emoji: '⚡', name: 'MCPVOT' },
  maxx: { color: '#FFD700', emoji: '💰', name: 'MAXX' },
  warplet: { color: '#FF6B00', emoji: '🌀', name: 'Warplet' },
  ens: { color: '#5298FF', emoji: '🏷️', name: 'ENS' },
  base: { color: '#0052FF', emoji: '🔵', name: 'Base' },
  farcaster: { color: '#8A63D2', emoji: '💜', name: 'Farcaster' },
  architek: { color: '#E5E4E2', emoji: '🏛️', name: 'Architek' },
  oracle: { color: '#FFD700', emoji: '🔮', name: 'Oracle' },
};

// =============================================================================
// RESPONSIVE BREAKPOINTS
// =============================================================================

export const BREAKPOINTS = {
  mobile: 320,
  mobileLandscape: 481,
  tablet: 768,
  desktop: 1025,
  large: 1440,
} as const;

// =============================================================================
// CSS ANIMATIONS (shared across formats)
// =============================================================================

export const ANIMATION_CSS = `
/* ═══════════════════════════════════════════════════════════════════════════ */
/* VOT MACHINE ANIMATIONS - Optimized for 60fps                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Boot Sequence - Terminal typing effect */
@keyframes bootType {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes bootBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.boot-line {
  overflow: hidden;
  white-space: nowrap;
  animation: bootType 0.5s steps(30) forwards;
}

.boot-cursor {
  animation: bootBlink 1s infinite;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 🔮 VOT GLYPH CODEX - 33 Sumerian-inspired Hieroglyphics                    */
/* Authentic MCPVOT symbolic language for protocol visualization               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* Glyph Float - Sacred symbols drift with purpose */
@keyframes glyphFloat {
  0%, 100% { 
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: var(--glyph-opacity, 0.7);
    filter: drop-shadow(0 0 4px var(--glyph-glow, #00FFCC));
  }
  25% { 
    transform: translateY(-12px) rotate(5deg) scale(1.1);
    opacity: calc(var(--glyph-opacity, 0.7) * 1.4);
    filter: drop-shadow(0 0 12px var(--glyph-glow, #00FFCC));
  }
  50% { 
    transform: translateY(-6px) rotate(-3deg) scale(1.05);
    opacity: calc(var(--glyph-opacity, 0.7) * 1.2);
  }
  75% { 
    transform: translateY(6px) rotate(2deg) scale(0.95);
    opacity: calc(var(--glyph-opacity, 0.7) * 0.8);
    filter: drop-shadow(0 0 6px var(--glyph-glow, #00FFCC));
  }
}

/* Glyph Reveal - Ancient script materializes */
@keyframes glyphReveal {
  0% { 
    opacity: 0;
    transform: scale(0.3) rotate(-180deg);
    filter: blur(8px);
  }
  60% { 
    opacity: 0.9;
    transform: scale(1.1) rotate(10deg);
    filter: blur(0);
  }
  100% { 
    opacity: var(--glyph-opacity, 0.8);
    transform: scale(1) rotate(0deg);
    filter: blur(0) drop-shadow(0 0 8px var(--glyph-glow));
  }
}

/* Glyph Pulse - Protocol heartbeat */
@keyframes glyphPulse {
  0%, 100% { 
    filter: drop-shadow(0 0 4px var(--glyph-glow, #00FFCC));
    transform: scale(1);
  }
  50% { 
    filter: drop-shadow(0 0 16px var(--glyph-glow, #00FFCC)) brightness(1.3);
    transform: scale(1.08);
  }
}

/* Glyph Stream - Vertical flow like ancient scroll */
@keyframes glyphStream {
  0% { 
    transform: translateY(-100%) translateZ(0);
    opacity: 0;
  }
  5% { opacity: 0.6; }
  95% { opacity: 0.6; }
  100% { 
    transform: translateY(100vh) translateZ(0);
    opacity: 0;
  }
}

.vot-glyph {
  font-family: 'Noto Sans Cuneiform', 'Segoe UI Symbol', sans-serif;
  will-change: transform, opacity;
  animation: glyphFloat var(--glyph-duration, 8s) ease-in-out infinite;
  animation-delay: var(--glyph-delay, 0s);
}

.vot-glyph.reveal {
  animation: glyphReveal 1.5s ease-out forwards;
}

.vot-glyph.pulse {
  animation: glyphPulse 2s ease-in-out infinite;
}

.vot-glyph.stream {
  animation: glyphStream var(--stream-duration, 12s) linear infinite;
  animation-delay: var(--stream-delay, 0s);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 🔮 VOT PARTICLE CONSTELLATION - Floating Codex Symbols                      */
/* Sumerian glyphs orbit the NFT like a living galaxy                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* VOT Particle Orbit - Main orbital animation */
@keyframes votOrbit {
  0% { 
    transform: rotate(0deg) translateX(var(--orbit-radius, 120px)) rotate(0deg) scale(var(--particle-scale, 1));
    opacity: var(--particle-opacity, 0.7);
  }
  25% { 
    opacity: calc(var(--particle-opacity, 0.7) * 1.3);
  }
  50% { 
    transform: rotate(180deg) translateX(var(--orbit-radius, 120px)) rotate(-180deg) scale(calc(var(--particle-scale, 1) * 0.8));
  }
  75% {
    opacity: calc(var(--particle-opacity, 0.7) * 0.6);
  }
  100% { 
    transform: rotate(360deg) translateX(var(--orbit-radius, 120px)) rotate(-360deg) scale(var(--particle-scale, 1));
    opacity: var(--particle-opacity, 0.7);
  }
}

/* VOT Symbol Float - Gentle floating motion */
@keyframes votFloat {
  0%, 100% { 
    transform: translateY(0) scale(1) translateZ(0);
    filter: drop-shadow(0 0 4px var(--vot-glow, #9945FF));
  }
  33% { 
    transform: translateY(-8px) scale(1.05) translateZ(0);
    filter: drop-shadow(0 0 12px var(--vot-glow, #9945FF));
  }
  66% { 
    transform: translateY(4px) scale(0.98) translateZ(0);
    filter: drop-shadow(0 0 6px var(--vot-glow, #9945FF));
  }
}

/* Particle Trail - Comet-like fade behind moving particles */
@keyframes particleTrail {
  0% { 
    opacity: 0.8;
    transform: scaleX(1) translateZ(0);
  }
  100% { 
    opacity: 0;
    transform: scaleX(2) translateZ(0);
  }
}

.vot-particle {
  will-change: transform, opacity;
  animation: votOrbit var(--orbit-duration, 15s) linear infinite;
  animation-delay: var(--orbit-delay, 0s);
}

.vot-particle-inner {
  animation: votFloat 4s ease-in-out infinite;
  animation-delay: calc(var(--orbit-delay, 0s) * 0.5);
}

.vot-trail {
  animation: particleTrail 2s ease-out infinite;
  opacity: 0;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ⚡ NEURAL MCP NETWORK - Visualizes Model Context Protocol connections       */
/* Nodes pulse and send data along glowing pathways                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

@keyframes mcpNodePulse {
  0%, 100% { 
    r: var(--node-radius, 4px);
    filter: drop-shadow(0 0 4px var(--mcp-color, #00FFCC));
    opacity: 0.8;
  }
  50% { 
    r: calc(var(--node-radius, 4px) * 1.5);
    filter: drop-shadow(0 0 16px var(--mcp-color, #00FFCC));
    opacity: 1;
  }
}

@keyframes mcpDataFlow {
  0% { 
    stroke-dashoffset: 100;
    opacity: 0;
  }
  10% { opacity: 0.8; }
  90% { opacity: 0.8; }
  100% { 
    stroke-dashoffset: -100;
    opacity: 0;
  }
}

@keyframes mcpConnectionGlow {
  0%, 100% { 
    stroke-opacity: 0.2;
    stroke-width: 1px;
  }
  50% { 
    stroke-opacity: 0.6;
    stroke-width: 2px;
  }
}

.mcp-node {
  animation: mcpNodePulse 3s ease-in-out infinite;
  animation-delay: var(--node-delay, 0s);
}

.mcp-connection {
  stroke-dasharray: 8 4;
  animation: mcpDataFlow 2s linear infinite, mcpConnectionGlow 4s ease-in-out infinite;
  animation-delay: var(--connection-delay, 0s);
}

.mcp-data-packet {
  animation: mcpDataFlow 1.5s ease-out infinite;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 🔥 DEFLATIONARY BURN EFFECT - 1% VOT burn visualization                    */
/* Subtle flames at the bottom, intensity based on total burns                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

@keyframes burnFlicker {
  0%, 100% { 
    transform: scaleY(1) scaleX(1) translateZ(0);
    opacity: var(--burn-intensity, 0.6);
    filter: brightness(1);
  }
  25% { 
    transform: scaleY(1.15) scaleX(0.95) translateZ(0);
    opacity: calc(var(--burn-intensity, 0.6) * 1.2);
    filter: brightness(1.2);
  }
  50% { 
    transform: scaleY(0.9) scaleX(1.05) translateZ(0);
    opacity: calc(var(--burn-intensity, 0.6) * 0.8);
  }
  75% { 
    transform: scaleY(1.1) scaleX(0.98) translateZ(0);
    opacity: var(--burn-intensity, 0.6);
    filter: brightness(1.1);
  }
}

@keyframes burnRise {
  0% { 
    transform: translateY(0) scale(1) translateZ(0);
    opacity: var(--ember-opacity, 0.8);
  }
  100% { 
    transform: translateY(-40px) scale(0.3) translateZ(0);
    opacity: 0;
  }
}

@keyframes burnGlow {
  0%, 100% { 
    filter: drop-shadow(0 -2px 8px #FF6B00) drop-shadow(0 -4px 16px #FF4500);
  }
  50% { 
    filter: drop-shadow(0 -4px 16px #FF6B00) drop-shadow(0 -8px 32px #FF4500);
  }
}

.burn-flame {
  transform-origin: bottom center;
  animation: burnFlicker 0.8s ease-in-out infinite;
  animation-delay: var(--flame-delay, 0s);
}

.burn-ember {
  animation: burnRise 2s ease-out infinite;
  animation-delay: var(--ember-delay, 0s);
}

.burn-container {
  animation: burnGlow 3s ease-in-out infinite;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 🌀 IDENTITY CONVERGENCE - 6 traits connect with energy beams               */
/* Shows the multi-identity nature of MCPVOT ecosystem                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

@keyframes traitOrbit {
  0% { 
    transform: rotate(var(--trait-start-angle, 0deg)) translateX(var(--trait-radius, 80px)) rotate(calc(var(--trait-start-angle, 0deg) * -1));
  }
  100% { 
    transform: rotate(calc(var(--trait-start-angle, 0deg) + 360deg)) translateX(var(--trait-radius, 80px)) rotate(calc((var(--trait-start-angle, 0deg) + 360deg) * -1));
  }
}

@keyframes traitBeamPulse {
  0%, 100% { 
    stroke-opacity: 0;
    stroke-width: 1px;
  }
  40%, 60% { 
    stroke-opacity: 0.8;
    stroke-width: 2px;
  }
}

@keyframes traitConverge {
  0%, 70%, 100% { 
    transform: scale(1) translateZ(0);
    filter: none;
  }
  85% { 
    transform: scale(1.2) translateZ(0);
    filter: drop-shadow(0 0 12px var(--trait-color));
  }
}

.identity-trait {
  animation: traitOrbit 20s linear infinite;
  animation-play-state: var(--orbit-state, paused);
}

.identity-trait.active {
  --orbit-state: running;
}

.trait-connection-beam {
  animation: traitBeamPulse 4s ease-in-out infinite;
  animation-delay: var(--beam-delay, 0s);
}

.trait-converge {
  animation: traitConverge 6s ease-in-out infinite;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 💫 TIER AURA EFFECTS - Unique ambience per tier                            */
/* Oracle = cosmic, Architek = geometric, Base = circuit, etc.                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* Oracle Tier - Cosmic nebula effect */
@keyframes oracleNebula {
  0%, 100% { 
    background-position: 0% 50%;
    filter: hue-rotate(0deg);
  }
  50% { 
    background-position: 100% 50%;
    filter: hue-rotate(30deg);
  }
}

@keyframes oracleStars {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

.tier-aura-oracle {
  background: radial-gradient(ellipse at center, 
    rgba(153, 69, 255, 0.3) 0%, 
    rgba(138, 99, 210, 0.2) 30%,
    rgba(0, 255, 204, 0.1) 60%,
    transparent 80%);
  background-size: 200% 200%;
  animation: oracleNebula 15s ease-in-out infinite;
}

.oracle-star {
  animation: oracleStars 2s ease-in-out infinite;
  animation-delay: var(--star-delay, 0s);
}

/* Architek Tier - Sacred geometry */
@keyframes architekRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes architekPulse {
  0%, 100% { stroke-opacity: 0.3; }
  50% { stroke-opacity: 0.8; }
}

.tier-aura-architek {
  animation: architekRotate 60s linear infinite;
}

.architek-shape {
  animation: architekPulse 4s ease-in-out infinite;
  animation-delay: var(--shape-delay, 0s);
}

/* Base Tier - Circuit board flow */
@keyframes baseCircuitFlow {
  0% { stroke-dashoffset: 200; }
  100% { stroke-dashoffset: 0; }
}

.tier-aura-base .circuit-path {
  stroke-dasharray: 10 5;
  animation: baseCircuitFlow 3s linear infinite;
}

/* Farcaster Tier - Social ripples */
@keyframes farcasterRipple {
  0% { 
    transform: scale(0.8) translateZ(0);
    opacity: 0.8;
  }
  100% { 
    transform: scale(2) translateZ(0);
    opacity: 0;
  }
}

.tier-aura-farcaster .ripple {
  animation: farcasterRipple 3s ease-out infinite;
  animation-delay: var(--ripple-delay, 0s);
}

/* Warplet Tier - Dimensional warp */
@keyframes warpletWarp {
  0%, 100% { 
    transform: perspective(500px) rotateX(0deg) rotateY(0deg);
  }
  25% { 
    transform: perspective(500px) rotateX(5deg) rotateY(-5deg);
  }
  75% { 
    transform: perspective(500px) rotateX(-5deg) rotateY(5deg);
  }
}

.tier-aura-warplet {
  animation: warpletWarp 8s ease-in-out infinite;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* 🔗 CHAIN LINK FLOW - Base chain activity visualization                     */
/* Links flow upward representing on-chain transactions                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

@keyframes chainLinkRise {
  0% { 
    transform: translateY(100%) rotate(0deg) translateZ(0);
    opacity: 0;
  }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { 
    transform: translateY(-100%) rotate(180deg) translateZ(0);
    opacity: 0;
  }
}

@keyframes chainLinkPulse {
  0%, 100% { 
    stroke: var(--chain-color, #0052FF);
    filter: none;
  }
  50% { 
    stroke: var(--chain-glow, #00FFCC);
    filter: drop-shadow(0 0 4px var(--chain-glow, #00FFCC));
  }
}

.chain-link {
  animation: chainLinkRise var(--link-duration, 8s) linear infinite;
  animation-delay: var(--link-delay, 0s);
}

.chain-link-glow {
  animation: chainLinkPulse 2s ease-in-out infinite;
}

/* Glow Pulse - Tier badge */
@keyframes glowPulse {
  0%, 100% { 
    filter: drop-shadow(0 0 8px var(--glow-color, #00ffcc));
    opacity: 0.9;
  }
  50% { 
    filter: drop-shadow(0 0 20px var(--glow-color, #00ffcc));
    opacity: 1;
  }
}

.glow-pulse {
  animation: glowPulse 3s ease-in-out infinite;
}

/* Trait Badge Hover */
@keyframes traitHover {
  0% { transform: scale(1) translateZ(0); }
  50% { transform: scale(1.05) translateZ(0); }
  100% { transform: scale(1) translateZ(0); }
}

.trait-badge {
  transition: transform 0.2s ease, filter 0.2s ease;
  will-change: transform, filter;
}

.trait-badge:hover,
.trait-badge:focus {
  transform: scale(1.08) translateZ(0);
  filter: drop-shadow(0 0 12px var(--trait-glow));
}

.trait-badge.active {
  filter: drop-shadow(0 0 8px var(--trait-glow));
}

.trait-badge.inactive {
  opacity: 0.3;
  filter: grayscale(80%);
}

/* Stats Counter - Number counting up */
@keyframes countUp {
  from { 
    transform: translateY(20px) translateZ(0);
    opacity: 0;
  }
  to { 
    transform: translateY(0) translateZ(0);
    opacity: 1;
  }
}

.stat-value {
  animation: countUp 0.8s ease-out forwards;
  animation-delay: var(--stat-delay, 0s);
}

/* XP Progress Bar */
@keyframes xpFill {
  from { width: 0; }
  to { width: var(--xp-percent, 0%); }
}

.xp-bar-fill {
  animation: xpFill 1.5s ease-out forwards;
  animation-delay: 0.5s;
}

/* Circuit Lines - SVG path animation */
@keyframes circuitDraw {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

.circuit-line {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: circuitDraw 2s ease-out forwards;
}

/* Scanlines - CRT effect */
@keyframes scanlineMove {
  0% { transform: translateY(0) translateZ(0); }
  100% { transform: translateY(4px) translateZ(0); }
}

.scanlines {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  animation: scanlineMove 0.1s linear infinite;
  pointer-events: none;
}

/* Avatar Border Animation */
@keyframes avatarBorderRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.avatar-border {
  animation: avatarBorderRotate 10s linear infinite;
}

/* Floating Elements */
@keyframes float {
  0%, 100% { transform: translateY(0) translateZ(0); }
  50% { transform: translateY(-10px) translateZ(0); }
}

.float {
  animation: float 4s ease-in-out infinite;
}
`;

// =============================================================================
// RESPONSIVE CSS
// =============================================================================

export const RESPONSIVE_CSS = `
/* ═══════════════════════════════════════════════════════════════════════════ */
/* VOT MACHINE RESPONSIVE LAYOUT                                               */
/* Mobile-first approach                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

.vot-machine {
  --vm-padding: 16px;
  --vm-gap: 12px;
  --vm-font-base: 14px;
  --vm-font-heading: 20px;
  --vm-font-stat: 24px;
  
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  background: #050505;
  color: #00ffcc;
  min-height: 100vh;
  padding: var(--vm-padding);
}

/* ─── HEADER ─────────────────────────────────────────────────────────────── */
.vm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 255, 204, 0.3);
  min-height: 60px;
}

.vm-logo {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(18px, 5vw, 24px);
  font-weight: 700;
  color: #00ffcc;
  text-shadow: 0 0 10px rgba(0, 255, 204, 0.5);
}

.vm-tier-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 2px solid var(--tier-color, #00ffcc);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.5);
  min-width: 100px;
  justify-content: center;
}

/* ─── IDENTITY ───────────────────────────────────────────────────────────── */
.vm-identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--vm-gap);
  padding: 20px 0;
  text-align: center;
}

.vm-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #00ffcc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  background: #1a1a1a;
  position: relative;
}

.vm-name {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(18px, 5vw, 28px);
  font-weight: 700;
  color: #ffffff;
}

.vm-address {
  font-size: 12px;
  color: #00ffcc;
  opacity: 0.8;
}

.vm-bio {
  font-size: 12px;
  color: #888;
  max-width: 280px;
}

/* ─── TRAITS GRID ────────────────────────────────────────────────────────── */
.vm-traits {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.vm-trait {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 2px solid;
  background: rgba(0, 0, 0, 0.3);
  min-height: 44px; /* Touch target */
  transition: all 0.2s ease;
}

.vm-trait-icon {
  font-size: 18px;
}

.vm-trait-name {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ─── STATS ──────────────────────────────────────────────────────────────── */
.vm-stats {
  padding: 20px 0;
}

.vm-stats-title {
  text-align: center;
  font-size: 10px;
  color: #666;
  margin-bottom: 16px;
  letter-spacing: 2px;
}

.vm-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.vm-stat {
  text-align: center;
}

.vm-stat-label {
  font-size: 10px;
  color: #666;
  margin-bottom: 4px;
}

.vm-stat-value {
  font-family: 'Orbitron', sans-serif;
  font-size: var(--vm-font-stat);
  font-weight: 700;
}

.vm-stat-unit {
  font-size: 10px;
  color: #444;
}

.vm-xp-bar {
  grid-column: 1 / -1;
  margin-top: 8px;
}

.vm-xp-track {
  height: 8px;
  background: #1a1a1a;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #333;
}

.vm-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B00, #FFD700);
  border-radius: 4px;
  transition: width 1s ease-out;
}

/* ─── FOOTER ─────────────────────────────────────────────────────────────── */
.vm-footer {
  padding: 16px 0;
  border-top: 1px solid rgba(0, 255, 204, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 9px;
  color: #444;
}

.vm-powered {
  color: #00ffcc;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* TABLET (768px+)                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */
@media (min-width: 768px) {
  .vot-machine {
    --vm-padding: 24px;
    --vm-gap: 16px;
    --vm-font-base: 16px;
    --vm-font-heading: 28px;
    --vm-font-stat: 32px;
    
    max-width: 600px;
    margin: 0 auto;
  }
  
  .vm-identity {
    flex-direction: row;
    text-align: left;
    justify-content: flex-start;
  }
  
  .vm-avatar {
    width: 100px;
    height: 100px;
    font-size: 40px;
  }
  
  .vm-traits {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .vm-stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .vm-xp-bar {
    grid-column: 1 / -1;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* DESKTOP (1025px+)                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */
@media (min-width: 1025px) {
  .vot-machine {
    --vm-padding: 32px;
    --vm-gap: 20px;
    --vm-font-stat: 36px;
    
    max-width: 800px;
  }
  
  .vm-header {
    padding: 20px 0;
  }
  
  .vm-avatar {
    width: 120px;
    height: 120px;
    font-size: 48px;
  }
  
  .vm-trait {
    padding: 12px 16px;
  }
  
  .vm-trait:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px var(--trait-glow);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* LANDSCAPE MOBILE                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 767px) and (orientation: landscape) {
  .vm-identity {
    flex-direction: row;
    text-align: left;
  }
  
  .vm-avatar {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
  
  .vm-traits {
    grid-template-columns: repeat(3, 1fr);
  }
}
`;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function countActiveTraits(traits: UserTraits): number {
  return Object.values(traits).filter(Boolean).length;
}

export function getTierFromTraitCount(count: number, hasMaxx: boolean = false): TierName {
  if (count >= 6) return 'oracle';
  if (count >= 5) return 'architek';
  if (count >= 4) return 'farcaster';
  if (count >= 3) return 'base';
  if (count >= 2) return 'ens';
  if (count >= 1) return 'warplet';
  if (hasMaxx) return 'maxx';
  return 'mcpvot';
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(num: string | number): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)}K`;
  return n.toFixed(2);
}

// =============================================================================
// 𒆜 VOT GLYPH CODEX - 33 Sumerian-inspired Hieroglyphics
// Each glyph represents a core MCPVOT protocol concept
// =============================================================================

export interface VotGlyph {
  id: string;
  glyph: string;
  label: string;
  transliteration: string;
  meaning: string;
  tone: 'cyan' | 'amber' | 'magenta' | 'emerald';
}

export const VOT_GLYPH_CODEX: VotGlyph[] = [
  { id: 'oracle', glyph: '𒆜', label: 'Oracle', transliteration: 'SHU-LAM', meaning: 'Signal seer that routes Base telemetry into the AGI spool.', tone: 'cyan' },
  { id: 'protocol', glyph: '𒄑', label: 'Protocol', transliteration: 'ZI-KIR', meaning: 'Binding contract lattice that signs facilitator instructions.', tone: 'amber' },
  { id: 'agentic', glyph: '𒀭', label: 'Agentic', transliteration: 'AN-KU', meaning: 'Self-directed intelligence cell operating inside the OTC mesh.', tone: 'magenta' },
  { id: 'vot', glyph: '𒁹', label: '$VOT', transliteration: 'VU-TAR', meaning: 'Value vector that mirrors each facilitator call and burns in half.', tone: 'emerald' },
  { id: 'mcp', glyph: '𒃲', label: 'MCP', transliteration: 'MEK-PI', meaning: 'Memory conductor protocol anchoring the agent registry.', tone: 'magenta' },
  { id: 'x402', glyph: '𒇻', label: 'x402', transliteration: 'AK-SU', meaning: 'Prime facilitator spine that synchronizes OTC supply and demand.', tone: 'cyan' },
  { id: 'ecosystem', glyph: '𒆠', label: 'Ecosystem', transliteration: 'KI-RA', meaning: 'Connected field where intelligence NFTs and agents interlace.', tone: 'emerald' },
  { id: 'base', glyph: '𒉿', label: 'Base', transliteration: 'BESU', meaning: 'Settlement plane that keeps the facilitator gasless and instant.', tone: 'cyan' },
  { id: 'farcaster', glyph: '𒈦', label: 'Farcaster', transliteration: 'FA-RA', meaning: 'Social relay lattice threading casts into agentic triggers.', tone: 'magenta' },
  { id: 'facilitator', glyph: '𒂗', label: 'Facilitator', transliteration: 'PA-TE', meaning: 'Safeguarded gateway that absorbs gas risk on behalf of agents.', tone: 'amber' },
  { id: 'vault', glyph: '𒉣', label: 'Vault', transliteration: 'UR-RA', meaning: 'Treasury buffer that cushions retries and settlement slippage.', tone: 'amber' },
  { id: 'burn', glyph: '𒋼', label: 'Burn', transliteration: 'NU-GI', meaning: 'Reduces circulating $VOT with every mirrored OTC execution.', tone: 'magenta' },
  { id: 'mint', glyph: '𒂍', label: 'Mint', transliteration: 'ZI-LA', meaning: 'Creates intelligence NFTs inside the Warplet capsule.', tone: 'emerald' },
  { id: 'flow', glyph: '𒇲', label: 'Flow', transliteration: 'SI-GA', meaning: 'Stable sequence of USDC into facilitator and VOT out to burn.', tone: 'cyan' },
  { id: 'signal', glyph: '𒅗', label: 'Signal', transliteration: 'KU-UL', meaning: 'Broadcast path that alerts agents when new OTC slots open.', tone: 'cyan' },
  { id: 'memory', glyph: '𒂅', label: 'Memory', transliteration: 'PA-AMA', meaning: 'On-chain log sequence captured by MCP memory daemons.', tone: 'magenta' },
  { id: 'warp', glyph: '𒄷', label: 'Warp', transliteration: 'UR-TA', meaning: 'Temporal guard that keeps facilitator attempts throttled.', tone: 'amber' },
  { id: 'sentinel', glyph: '𒊕', label: 'Sentinel', transliteration: 'GU-RU', meaning: 'Guardian agent ensuring facilitator pathways stay clean.', tone: 'magenta' },
  { id: 'beacon', glyph: '𒁕', label: 'Beacon', transliteration: 'DI-IR', meaning: 'Emits status bursts to Farcaster dashboards and bots.', tone: 'cyan' },
  { id: 'gate', glyph: '𒀰', label: 'Gate', transliteration: 'EN-KI', meaning: 'Permissions boundary that vets agent payloads.', tone: 'amber' },
  { id: 'pulse', glyph: '𒄿', label: 'Pulse', transliteration: 'RU-DA', meaning: 'Heartbeat metric measuring facilitator uptime.', tone: 'cyan' },
  { id: 'forge', glyph: '𒂆', label: 'Forge', transliteration: 'GA-NI', meaning: 'Builds new OTC routes for cross-chain deployments.', tone: 'emerald' },
  { id: 'vector', glyph: '𒁯', label: 'Vector', transliteration: 'SE-LU', meaning: 'Directional bias pushing $VOT liquidity toward burns.', tone: 'emerald' },
  { id: 'circuit', glyph: '𒈾', label: 'Circuit', transliteration: 'NI-KA', meaning: 'Connects agent subroutines to MCP memory sockets.', tone: 'amber' },
  { id: 'archive', glyph: '𒀸', label: 'Archive', transliteration: 'AL-PA', meaning: 'Preserves completed facilitator proofs in IPFS.', tone: 'magenta' },
  { id: 'flux', glyph: '𒅖', label: 'Flux', transliteration: 'KU-RI', meaning: 'Balances facilitator retries against vault reserves.', tone: 'amber' },
  { id: 'resonance', glyph: '𒈬', label: 'Resonance', transliteration: 'MU-LU', meaning: 'Aligns Farcaster engagement with mint supply cadence.', tone: 'magenta' },
  { id: 'continuum', glyph: '𒇐', label: 'Continuum', transliteration: 'KI-NU', meaning: 'Ensures AGI memory threads persist across deployments.', tone: 'cyan' },
];

export const GLYPH_TONE_COLORS: Record<string, string> = {
  cyan: '#00FFCC',
  amber: '#FFB800',
  magenta: '#FF00FF',
  emerald: '#00FF88',
};

// =============================================================================
// 𒆜 VOT GLYPH STREAM GENERATOR - Sumerian Hieroglyphic Flow
// =============================================================================

export function generateGlyphStream(
  width: number,
  height: number,
  columnCount: number = 8,
  glyphsPerColumn: number = 6
): string {
  const columns: string[] = [];
  const columnWidth = width / columnCount;
  
  for (let col = 0; col < columnCount; col++) {
    const x = columnWidth * col + columnWidth / 2;
    const delay = Math.random() * 8;
    const duration = 10 + Math.random() * 8;
    
    const glyphs: string[] = [];
    for (let g = 0; g < glyphsPerColumn; g++) {
      const randomGlyph = VOT_GLYPH_CODEX[Math.floor(Math.random() * VOT_GLYPH_CODEX.length)];
      const y = (height / glyphsPerColumn) * g;
      const glyphDelay = delay + g * 0.5;
      const color = GLYPH_TONE_COLORS[randomGlyph.tone];
      
      glyphs.push(`
        <text class="vot-glyph stream" 
              x="${x}" y="${y}"
              font-size="18" fill="${color}" text-anchor="middle"
              style="--stream-delay: ${glyphDelay}s; --stream-duration: ${duration}s; --glyph-glow: ${color};"
              opacity="0.6">${randomGlyph.glyph}</text>
      `);
    }
    
    columns.push(`<g class="glyph-column" data-column="${col}">${glyphs.join('')}</g>`);
  }
  
  return `
    <g class="glyph-stream" aria-label="VOT Glyph Stream - Sumerian hieroglyphics">
      ${columns.join('')}
    </g>
  `;
}

// =============================================================================
// 𒁹 VOT GLYPH CONSTELLATION - Orbiting Protocol Symbols
// =============================================================================

export function generateGlyphConstellation(
  centerX: number,
  centerY: number,
  glyphCount: number = 12
): string {
  const glyphElements: string[] = [];
  
  // Select random glyphs from codex
  const selectedGlyphs = [...VOT_GLYPH_CODEX]
    .sort(() => Math.random() - 0.5)
    .slice(0, glyphCount);
  
  selectedGlyphs.forEach((glyph, i) => {
    const angleRad = ((360 / glyphCount) * i * Math.PI) / 180;
    const orbitRadius = 90 + Math.random() * 50;
    const duration = 15 + Math.random() * 10;
    const delay = (i / glyphCount) * duration;
    const color = GLYPH_TONE_COLORS[glyph.tone];
    const x = centerX + Math.cos(angleRad) * orbitRadius;
    const y = centerY + Math.sin(angleRad) * orbitRadius;
    
    glyphElements.push(`
      <g class="glyph-orbit-item" 
         style="--orbit-radius: ${orbitRadius}px; --orbit-duration: ${duration}s; --orbit-delay: ${delay}s; --glyph-glow: ${color};"
         transform-origin="${centerX} ${centerY}">
        <text class="vot-glyph" 
              x="${x}" y="${y}"
              font-size="24" fill="${color}" text-anchor="middle" dominant-baseline="middle"
              style="--glyph-delay: ${delay}s; --glyph-opacity: 0.8;"
              data-transliteration="${glyph.transliteration}"
              data-meaning="${glyph.meaning}">
          ${glyph.glyph}
        </text>
        <text x="${x}" y="${y + 16}" font-size="6" fill="${color}" text-anchor="middle" opacity="0.5">
          ${glyph.transliteration}
        </text>
      </g>
    `);
  });
  
  return `
    <g class="glyph-constellation" aria-label="VOT Glyph Constellation - ${glyphCount} protocol symbols">
      <defs>
        <filter id="glyphGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      ${glyphElements.join('')}
    </g>
  `;
}

// =============================================================================
// 🔮 VOT CONSTELLATION GENERATOR - Unique MCPVOT Animation
// =============================================================================

export function generateVotConstellation(
  centerX: number,
  centerY: number,
  particleCount: number = 12
): string {
  const particles: string[] = [];
  
  for (let i = 0; i < particleCount; i++) {
    const angleRad = ((360 / particleCount) * i * Math.PI) / 180;
    const orbitRadius = 80 + Math.random() * 60; // Varied orbit distances
    const duration = 12 + Math.random() * 8; // 12-20s orbit
    const delay = (i / particleCount) * duration;
    const scale = 0.6 + Math.random() * 0.6;
    const opacity = 0.4 + Math.random() * 0.4;
    // Calculate initial position along orbit
    const initX = centerX + Math.cos(angleRad) * orbitRadius;
    const initY = centerY + Math.sin(angleRad) * orbitRadius;
    
    particles.push(`
      <g class="vot-particle" 
         style="--orbit-radius: ${orbitRadius}px; --orbit-duration: ${duration}s; --orbit-delay: ${delay}s; --particle-scale: ${scale}; --particle-opacity: ${opacity};"
         transform-origin="${centerX} ${centerY}">
        <g class="vot-particle-inner" transform="translate(${initX}, ${initY})">
          <circle r="4" fill="#9945FF" opacity="${opacity}">
            <animate attributeName="opacity" values="${opacity};${opacity * 1.5};${opacity}" dur="2s" repeatCount="indefinite"/>
          </circle>
          <text x="0" y="1" font-size="6" fill="#9945FF" text-anchor="middle" dominant-baseline="middle" opacity="${opacity * 0.8}">V</text>
        </g>
      </g>
    `);
  }
  
  return `
    <g class="vot-constellation" aria-label="VOT particle constellation">
      <defs>
        <radialGradient id="votParticleGlow">
          <stop offset="0%" stop-color="#9945FF" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#9945FF" stop-opacity="0"/>
        </radialGradient>
      </defs>
      ${particles.join('')}
    </g>
  `;
}

// =============================================================================
// ⚡ MCP NEURAL NETWORK GENERATOR - Model Context Protocol Visualization
// =============================================================================

export function generateMCPNetwork(
  width: number,
  height: number,
  nodeCount: number = 8
): string {
  const nodes: Array<{ x: number; y: number; id: string }> = [];
  const connections: string[] = [];
  const nodeElements: string[] = [];
  
  // Generate random node positions
  for (let i = 0; i < nodeCount; i++) {
    const x = 50 + Math.random() * (width - 100);
    const y = 50 + Math.random() * (height - 100);
    nodes.push({ x, y, id: `mcp-node-${i}` });
  }
  
  // Generate connections between nearby nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = Math.hypot(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y);
      if (dist < 200) { // Connect if within range
        const delay = Math.random() * 3;
        connections.push(`
          <line class="mcp-connection" 
                x1="${nodes[i].x}" y1="${nodes[i].y}" 
                x2="${nodes[j].x}" y2="${nodes[j].y}"
                stroke="#00FFCC" stroke-width="1"
                style="--connection-delay: ${delay}s;"
                opacity="0.3"/>
        `);
      }
    }
    
    // Node element
    const delay = i * 0.3;
    nodeElements.push(`
      <circle class="mcp-node" cx="${nodes[i].x}" cy="${nodes[i].y}" 
              r="5" fill="#00FFCC"
              style="--node-delay: ${delay}s; --node-radius: 5px; --mcp-color: #00FFCC;"/>
    `);
  }
  
  return `
    <g class="mcp-network" aria-label="MCP neural network visualization" opacity="0.6">
      ${connections.join('')}
      ${nodeElements.join('')}
    </g>
  `;
}

// =============================================================================
// 🔥 BURN EFFECT GENERATOR - Deflationary Flame Visualization
// =============================================================================

export function generateBurnEffect(
  x: number,
  y: number,
  width: number,
  intensity: number = 0.6 // 0-1 based on total burns
): string {
  const flames: string[] = [];
  const embers: string[] = [];
  const flameCount = 5 + Math.floor(intensity * 5);
  
  for (let i = 0; i < flameCount; i++) {
    const fx = x + (width / flameCount) * i + Math.random() * 10;
    const delay = Math.random() * 0.5;
    const scale = 0.5 + Math.random() * 0.5;
    
    flames.push(`
      <ellipse class="burn-flame" 
               cx="${fx}" cy="${y}" 
               rx="${8 * scale}" ry="${20 * scale}"
               fill="url(#burnGradient)"
               style="--flame-delay: ${delay}s; --burn-intensity: ${intensity};"
               transform-origin="${fx} ${y}"/>
    `);
  }
  
  // Rising embers
  for (let i = 0; i < 8; i++) {
    const ex = x + Math.random() * width;
    const delay = Math.random() * 2;
    embers.push(`
      <circle class="burn-ember" 
              cx="${ex}" cy="${y}" r="2"
              fill="#FF6B00"
              style="--ember-delay: ${delay}s; --ember-opacity: ${0.5 + Math.random() * 0.3};"/>
    `);
  }
  
  return `
    <g class="burn-container" aria-label="VOT burn effect - ${Math.round(intensity * 100)}% intensity">
      <defs>
        <linearGradient id="burnGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#FF4500"/>
          <stop offset="50%" stop-color="#FF6B00"/>
          <stop offset="100%" stop-color="#FFD700" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${flames.join('')}
      ${embers.join('')}
    </g>
  `;
}

// =============================================================================
// 🌀 IDENTITY CONVERGENCE GENERATOR - 6 Traits Orbiting
// =============================================================================

export function generateIdentityConvergence(
  centerX: number,
  centerY: number,
  traits: UserTraits
): string {
  const traitNames: TraitName[] = ['vot', 'mcpvot', 'warplet', 'base', 'farcaster', 'ens'];
  const traitElements: string[] = [];
  const radius = 100;
  
  traitNames.forEach((trait, i) => {
    const angle = (360 / 6) * i;
    const isActive = traits[trait];
    const config = TRAIT_COLORS[trait];
    const angleRad = (angle * Math.PI) / 180;
    const x = centerX + Math.cos(angleRad) * radius;
    const y = centerY + Math.sin(angleRad) * radius;
    
    traitElements.push(`
      <g class="identity-trait ${isActive ? 'active' : 'inactive'}"
         style="--trait-start-angle: ${angle}deg; --trait-radius: ${radius}px; --trait-color: ${config.active};">
        <circle cx="${x}" cy="${y}" r="16" 
                fill="${isActive ? config.active : '#333'}" 
                opacity="${isActive ? 0.9 : 0.3}"
                stroke="${config.active}" stroke-width="2"/>
        <text x="${x}" y="${y}" 
              font-size="12" text-anchor="middle" dominant-baseline="middle"
              fill="${isActive ? '#000' : '#666'}">${config.icon}</text>
        ${isActive ? `
          <circle cx="${x}" cy="${y}" r="20" 
                  fill="none" stroke="${config.active}" stroke-width="1"
                  opacity="0.5">
            <animate attributeName="r" values="20;28;20" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3s" repeatCount="indefinite"/>
          </circle>
        ` : ''}
      </g>
    `);
  });
  
  // Connection beams between active traits
  const activeTraits = traitNames.filter(t => traits[t]);
  const beams: string[] = [];
  
  for (let i = 0; i < activeTraits.length; i++) {
    for (let j = i + 1; j < activeTraits.length; j++) {
      const t1Idx = traitNames.indexOf(activeTraits[i]);
      const t2Idx = traitNames.indexOf(activeTraits[j]);
      const a1 = ((360 / 6) * t1Idx * Math.PI) / 180;
      const a2 = ((360 / 6) * t2Idx * Math.PI) / 180;
      const x1 = centerX + Math.cos(a1) * radius;
      const y1 = centerY + Math.sin(a1) * radius;
      const x2 = centerX + Math.cos(a2) * radius;
      const y2 = centerY + Math.sin(a2) * radius;
      
      beams.push(`
        <line class="trait-connection-beam"
              x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
              stroke="url(#identityBeamGradient)" stroke-width="2"
              style="--beam-delay: ${i * 0.5}s;"/>
      `);
    }
  }
  
  return `
    <g class="identity-convergence" aria-label="Identity traits convergence">
      <defs>
        <linearGradient id="identityBeamGradient">
          <stop offset="0%" stop-color="#00FFCC" stop-opacity="0.8"/>
          <stop offset="50%" stop-color="#9945FF" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#0052FF" stop-opacity="0.8"/>
        </linearGradient>
      </defs>
      ${beams.join('')}
      ${traitElements.join('')}
    </g>
  `;
}

// =============================================================================
// 💫 TIER AURA GENERATOR - Unique Visual Per Tier
// =============================================================================

export function generateTierAura(
  tier: TierName,
  width: number,
  height: number
): string {
  const tierConfig = TIER_COLORS[tier];
  
  switch (tier) {
    case 'oracle':
      // Cosmic nebula with stars
      return `
        <g class="tier-aura tier-aura-oracle" aria-label="Oracle tier cosmic aura">
          <defs>
            <radialGradient id="oracleNebulaGrad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stop-color="#9945FF" stop-opacity="0.3"/>
              <stop offset="40%" stop-color="#8A63D2" stop-opacity="0.2"/>
              <stop offset="70%" stop-color="#00FFCC" stop-opacity="0.1"/>
              <stop offset="100%" stop-color="transparent"/>
            </radialGradient>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#oracleNebulaGrad)"/>
          ${Array.from({ length: 20 }, (_, i) => `
            <circle class="oracle-star" cx="${Math.random() * width}" cy="${Math.random() * height}" 
                    r="${1 + Math.random() * 2}" fill="white" style="--star-delay: ${i * 0.2}s;"/>
          `).join('')}
        </g>
      `;
      
    case 'architek':
      // Sacred geometry hexagons
      return `
        <g class="tier-aura tier-aura-architek" aria-label="Architek tier geometric aura">
          <g transform="translate(${width/2}, ${height/2})">
            ${[0, 60, 120, 180, 240, 300].map((angle, i) => `
              <polygon class="architek-shape" 
                       points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30"
                       fill="none" stroke="${tierConfig.color}" stroke-width="1"
                       transform="rotate(${angle}) translate(0, -80)"
                       opacity="0.3"
                       style="--shape-delay: ${i * 0.3}s;"/>
            `).join('')}
          </g>
        </g>
      `;
      
    case 'base':
      // Circuit board pattern
      return `
        <g class="tier-aura tier-aura-base" aria-label="Base tier circuit aura">
          ${Array.from({ length: 6 }, (_, i) => {
            const y = 50 + i * (height / 7);
            return `
              <path class="circuit-path" 
                    d="M0,${y} L${width * 0.3},${y} L${width * 0.4},${y + 20} L${width * 0.7},${y + 20} L${width},${y}"
                    fill="none" stroke="${tierConfig.color}" stroke-width="1" opacity="0.3"/>
            `;
          }).join('')}
        </g>
      `;
      
    case 'farcaster':
      // Social ripples
      return `
        <g class="tier-aura tier-aura-farcaster" aria-label="Farcaster tier social ripples">
          ${[1, 2, 3].map((i) => `
            <circle class="ripple" cx="${width/2}" cy="${height/2}" r="${i * 50}"
                    fill="none" stroke="${tierConfig.color}" stroke-width="2"
                    opacity="0.3" style="--ripple-delay: ${i * 0.5}s;"/>
          `).join('')}
        </g>
      `;
      
    case 'warplet':
      // Dimensional warp effect
      return `
        <g class="tier-aura tier-aura-warplet" aria-label="Warplet tier dimensional warp">
          <defs>
            <linearGradient id="warpletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${tierConfig.color}" stop-opacity="0.2"/>
              <stop offset="50%" stop-color="transparent"/>
              <stop offset="100%" stop-color="${tierConfig.color}" stop-opacity="0.2"/>
            </linearGradient>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#warpletGrad)"/>
        </g>
      `;
      
    default:
      // Default glow
      return `
        <g class="tier-aura tier-aura-default" aria-label="${tierConfig.name} tier aura">
          <defs>
            <radialGradient id="defaultAuraGrad">
              <stop offset="0%" stop-color="${tierConfig.color}" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="transparent"/>
            </radialGradient>
          </defs>
          <ellipse cx="${width/2}" cy="${height/2}" rx="${width/3}" ry="${height/3}" fill="url(#defaultAuraGrad)"/>
        </g>
      `;
  }
}

// =============================================================================
// � SACRED GEOMETRY GENERATOR - Metatron's Cube & Flower of Life
// Ancient geometric patterns with VOT Glyph color tones
// =============================================================================

export function generateSacredGeometry(
  centerX: number,
  centerY: number,
  size: number = 200,
  pattern: 'metatron' | 'flower' | 'both' = 'both'
): string {
  const elements: string[] = [];
  const colors = GLYPH_TONE_COLORS;
  
  // Flower of Life - 7 overlapping circles (seed of life pattern)
  if (pattern === 'flower' || pattern === 'both') {
    const flowerRadius = size * 0.25;
    const flowerCircles: string[] = [];
    
    // Center circle
    flowerCircles.push(`
      <circle cx="${centerX}" cy="${centerY}" r="${flowerRadius}"
              fill="none" stroke="${colors.cyan}" stroke-width="1" opacity="0.4"
              class="flower-circle">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite"/>
      </circle>
    `);
    
    // 6 surrounding circles
    for (let i = 0; i < 6; i++) {
      const angle = (60 * i * Math.PI) / 180;
      const cx = centerX + Math.cos(angle) * flowerRadius;
      const cy = centerY + Math.sin(angle) * flowerRadius;
      const color = [colors.cyan, colors.amber, colors.magenta, colors.emerald, colors.cyan, colors.amber][i];
      const delay = i * 0.3;
      
      flowerCircles.push(`
        <circle cx="${cx}" cy="${cy}" r="${flowerRadius}"
                fill="none" stroke="${color}" stroke-width="1" opacity="0.3"
                class="flower-circle"
                style="animation-delay: ${delay}s;">
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="${3 + i * 0.5}s" repeatCount="indefinite"/>
        </circle>
      `);
    }
    
    elements.push(`
      <g class="flower-of-life" transform-origin="${centerX} ${centerY}" 
         style="animation: flowerRotate 60s linear infinite;">
        ${flowerCircles.join('')}
      </g>
    `);
  }
  
  // Metatron's Cube - Sacred geometry connecting all points
  if (pattern === 'metatron' || pattern === 'both') {
    const metatronRadius = size * 0.4;
    const metatronLines: string[] = [];
    const metatronPoints: Array<{x: number; y: number}> = [];
    
    // Center point
    metatronPoints.push({ x: centerX, y: centerY });
    
    // Inner ring (6 points)
    for (let i = 0; i < 6; i++) {
      const angle = (60 * i * Math.PI) / 180;
      metatronPoints.push({
        x: centerX + Math.cos(angle) * (metatronRadius * 0.5),
        y: centerY + Math.sin(angle) * (metatronRadius * 0.5)
      });
    }
    
    // Outer ring (6 points)
    for (let i = 0; i < 6; i++) {
      const angle = ((60 * i + 30) * Math.PI) / 180;
      metatronPoints.push({
        x: centerX + Math.cos(angle) * metatronRadius,
        y: centerY + Math.sin(angle) * metatronRadius
      });
    }
    
    // Connect all points (Metatron's Cube pattern)
    let lineIndex = 0;
    for (let i = 0; i < metatronPoints.length; i++) {
      for (let j = i + 1; j < metatronPoints.length; j++) {
        const colorKeys = ['cyan', 'amber', 'magenta', 'emerald'];
        const color = colors[colorKeys[lineIndex % 4] as keyof typeof colors];
        const delay = lineIndex * 0.1;
        
        metatronLines.push(`
          <line x1="${metatronPoints[i].x}" y1="${metatronPoints[i].y}"
                x2="${metatronPoints[j].x}" y2="${metatronPoints[j].y}"
                stroke="${color}" stroke-width="0.5" opacity="0.2"
                class="metatron-line"
                style="animation-delay: ${delay}s;">
            <animate attributeName="opacity" values="0.1;0.4;0.1" dur="${2 + (lineIndex % 3)}s" repeatCount="indefinite"/>
          </line>
        `);
        lineIndex++;
      }
    }
    
    // Add glowing vertices
    const vertices = metatronPoints.map((p, i) => {
      const color = [colors.cyan, colors.magenta, colors.amber, colors.emerald][i % 4];
      return `
        <circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}" opacity="0.6"
                class="metatron-vertex">
          <animate attributeName="r" values="2;4;2" dur="${2 + i * 0.2}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="${2 + i * 0.2}s" repeatCount="indefinite"/>
        </circle>
      `;
    }).join('');
    
    elements.push(`
      <g class="metatrons-cube" opacity="0.8">
        ${metatronLines.join('')}
        ${vertices}
      </g>
    `);
  }
  
  return `
    <g class="sacred-geometry" aria-label="Sacred geometry - Metatron's Cube and Flower of Life">
      <defs>
        <filter id="sacredGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      ${elements.join('')}
    </g>
  `;
}

// =============================================================================
// �🔗 CHAIN FLOW GENERATOR - Base Chain Links Rising
// =============================================================================

export function generateChainFlow(
  x: number,
  y: number,
  height: number,
  linkCount: number = 8
): string {
  const links: string[] = [];
  
  for (let i = 0; i < linkCount; i++) {
    const lx = x + Math.random() * 100 - 50;
    const delay = Math.random() * 5;
    const duration = 6 + Math.random() * 4;
    
    links.push(`
      <g class="chain-link" 
         style="--link-delay: ${delay}s; --link-duration: ${duration}s; --chain-color: #0052FF; --chain-glow: #00FFCC;"
         transform="translate(${lx}, ${y})">
        <rect class="chain-link-glow" x="-6" y="0" width="12" height="20" rx="4"
              fill="none" stroke="#0052FF" stroke-width="2"/>
        <rect x="-6" y="12" width="12" height="20" rx="4"
              fill="none" stroke="#0052FF" stroke-width="2"/>
      </g>
    `);
  }
  
  return `
    <g class="chain-flow" aria-label="Base chain transaction flow">
      ${links.join('')}
    </g>
  `;
}

// =============================================================================
// 🎯 TRAITS GRID GENERATOR - 6 Identity Trait Badges
// =============================================================================

export function generateTraitsGrid(
  centerX: number,
  y: number,
  traits: UserTraits
): string {
  const traitNames: TraitName[] = ['vot', 'mcpvot', 'warplet', 'base', 'farcaster', 'ens'];
  const badges: string[] = [];
  
  const badgeWidth = 80;
  const badgeHeight = 36;
  const gap = 12;
  const cols = 3;
  
  const gridWidth = cols * badgeWidth + (cols - 1) * gap;
  const startX = centerX - gridWidth / 2;
  
  traitNames.forEach((trait, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const bx = startX + col * (badgeWidth + gap);
    const by = y + row * (badgeHeight + gap);
    
    const isActive = traits[trait];
    const config = TRAIT_COLORS[trait];
    const borderColor = isActive ? config.active : '#333';
    const bgOpacity = isActive ? 0.15 : 0.05;
    const textOpacity = isActive ? 1 : 0.4;
    
    badges.push(`
      <g class="trait-badge ${isActive ? 'active' : 'inactive'}" 
         style="--trait-glow: ${config.glow};" 
         data-trait="${trait}">
        <!-- Badge background -->
        <rect x="${bx}" y="${by}" width="${badgeWidth}" height="${badgeHeight}" rx="6"
              fill="${config.active}" fill-opacity="${bgOpacity}"
              stroke="${borderColor}" stroke-width="${isActive ? 2 : 1}"/>
        
        <!-- Icon -->
        <text x="${bx + 14}" y="${by + badgeHeight/2 + 1}" 
              font-size="14" dominant-baseline="middle"
              opacity="${textOpacity}">${config.icon}</text>
        
        <!-- Label -->
        <text x="${bx + 30}" y="${by + badgeHeight/2 + 1}" 
              font-family="monospace" font-size="10" 
              fill="${isActive ? config.active : '#666'}" 
              dominant-baseline="middle"
              text-transform="uppercase"
              letter-spacing="0.5">${trait.toUpperCase()}</text>
        
        ${isActive ? `
          <!-- Active glow -->
          <rect x="${bx}" y="${by}" width="${badgeWidth}" height="${badgeHeight}" rx="6"
                fill="none" stroke="${config.active}" stroke-width="1" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite"/>
          </rect>
        ` : ''}
      </g>
    `);
  });
  
  return `
    <g class="traits-grid" aria-label="6 identity traits">
      ${badges.join('')}
    </g>
  `;
}

// =============================================================================
// 📊 XP PROGRESS BAR GENERATOR
// =============================================================================

export function generateXPBar(
  x: number,
  y: number,
  width: number,
  xpLevel: number = 1,
  xpProgress: number = 0, // 0-100
  tier: TierName
): string {
  const tierConfig = TIER_COLORS[tier];
  const fillWidth = (width * xpProgress) / 100;
  
  return `
    <g class="xp-bar" aria-label="XP Level ${xpLevel}, ${xpProgress}% to next level">
      <!-- Track -->
      <rect x="${x}" y="${y}" width="${width}" height="12" rx="6"
            fill="#1a1a1a" stroke="#333" stroke-width="1"/>
      
      <!-- Fill -->
      <rect x="${x + 1}" y="${y + 1}" width="${fillWidth}" height="10" rx="5"
            fill="url(#xpGradient)" class="xp-bar-fill">
        <animate attributeName="width" from="0" to="${fillWidth}" dur="1.5s" fill="freeze"/>
      </rect>
      
      <!-- Level indicator -->
      <g transform="translate(${x - 30}, ${y})">
        <rect x="0" y="-2" width="24" height="16" rx="4" fill="${tierConfig.color}" fill-opacity="0.2"/>
        <text x="12" y="9" font-family="Orbitron, sans-serif" font-size="10" 
              fill="${tierConfig.color}" text-anchor="middle" font-weight="700">
          ${xpLevel}
        </text>
      </g>
      
      <!-- Progress text -->
      <text x="${x + width + 8}" y="${y + 10}" 
            font-family="monospace" font-size="9" fill="#666">
        ${xpProgress}%
      </text>
      
      <defs>
        <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FF6B00"/>
          <stop offset="50%" stop-color="#FFD700"/>
          <stop offset="100%" stop-color="${tierConfig.color}"/>
        </linearGradient>
      </defs>
    </g>
  `;
}

// =============================================================================
// 💻 BOOT SEQUENCE GENERATOR - Terminal Initialization
// =============================================================================

export function generateBootSequence(
  x: number,
  y: number,
  displayName: string
): string {
  const lines = [
    '> INITIALIZING VOT MACHINE...',
    '> CONNECTING TO BASE NETWORK...',
    '> MCP MEMORY SYNC: ACTIVE',
    '> x402 FACILITATOR: ONLINE',
    `> LOADING IDENTITY: ${displayName}`,
    '> GLYPH CODEX: 33 SYMBOLS LOADED',
    '> STATUS: OPERATIONAL ✓'
  ];
  
  return `
    <g class="boot-sequence" aria-label="Boot sequence">
      <style>
        .boot-line { opacity: 0; }
        ${lines.map((_, i) => `
          .boot-line-${i} { 
            animation: bootFadeIn 0.3s ease-out ${0.3 + i * 0.4}s forwards;
          }
        `).join('')}
        @keyframes bootFadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 0.6; transform: translateX(0); }
        }
      </style>
      ${lines.map((line, i) => `
        <text class="boot-line boot-line-${i}" 
              x="${x}" y="${y + i * 14}" 
              font-family="'Share Tech Mono', monospace" font-size="9" fill="#00FFCC">
          ${line}
        </text>
      `).join('')}
    </g>
  `;
}

// =============================================================================
// MAIN GENERATOR - Full Responsive Output
// =============================================================================

export function generateResponsiveVotMachine(
  data: VotMachineData,
  options: ResponsiveOptions
): string {
  const traitCount = countActiveTraits(data.traits);
  const tier = data.tier || getTierFromTraitCount(traitCount);
  const tierConfig = TIER_COLORS[tier];
  const width = options.targetWidth || 1200;
  const height = options.aspectRatio === '16:9' ? width * 0.5625 : 
                 options.aspectRatio === '9:16' ? width * 1.777 :
                 options.aspectRatio === '4:3' ? width * 0.75 : width * 0.666;
  
  // Build animation layers
  const animationLayers: string[] = [];
  
  if (options.animations.tierAura) {
    animationLayers.push(generateTierAura(tier, width, height));
  }
  
  // 𒆜 Sumerian Glyph Stream (replaces generic Matrix rain)
  if (options.animations.glyphStream) {
    animationLayers.push(generateGlyphStream(width, height, 10, 8));
  }
  
  // 𒁹 Glyph Constellation - orbiting protocol symbols
  if (options.animations.glyphConstellation) {
    animationLayers.push(generateGlyphConstellation(width / 2, height / 2, 12));
  }
  
  // 🔯 Sacred Geometry - Metatron's Cube / Flower of Life
  if (options.animations.sacredGeometry) {
    animationLayers.push(generateSacredGeometry(width / 2, height / 2, Math.min(width, height) * 0.6, 'both'));
  }
  
  if (options.animations.votConstellation) {
    animationLayers.push(generateVotConstellation(width / 2, height / 2, 12));
  }
  
  if (options.animations.mcpNetwork) {
    animationLayers.push(generateMCPNetwork(width, height, 8));
  }
  
  if (options.animations.identityConvergence) {
    animationLayers.push(generateIdentityConvergence(width / 2, height / 2, data.traits));
  }
  
  if (options.animations.burnEffect) {
    animationLayers.push(generateBurnEffect(width * 0.2, height - 40, width * 0.6, 0.7));
  }
  
  if (options.animations.chainFlow) {
    animationLayers.push(generateChainFlow(width - 60, height, height, 6));
  }
  
  const svg = `
<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" 
     role="img" aria-labelledby="votMachineTitle votMachineDesc"
     class="vot-machine-svg">
  <title id="votMachineTitle">VOT Machine NFT - ${data.displayName}</title>
  <desc id="votMachineDesc">Interactive NFT landing page for ${data.displayName}. Tier: ${tierConfig.name}. Active traits: ${traitCount}/6.</desc>
  
  <defs>
    <!-- Shared gradients -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050505"/>
      <stop offset="50%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
    
    <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- XP Bar Gradient -->
    <linearGradient id="xpBarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF6B00"/>
      <stop offset="50%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="${tierConfig.color}"/>
    </linearGradient>
  </defs>
  
  <style>
    ${options.animations.reducedMotion ? '@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }' : ''}
  </style>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  
  <!-- Animation Layers -->
  ${animationLayers.join('\n  ')}
  
  <!-- Boot Sequence (top-left corner) -->
  ${options.animations.bootSequence ? generateBootSequence(20, 60, data.displayName) : ''}
  
  <!-- Header -->
  <g class="vm-header-group" transform="translate(20, 30)">
    <text font-family="Orbitron, sans-serif" font-size="24" font-weight="700" fill="#00FFCC" filter="url(#glowFilter)">
      VOT MACHINE
    </text>
    <g transform="translate(${width - 140}, -10)">
      <rect x="0" y="0" width="100" height="36" rx="8" fill="#111" stroke="${tierConfig.color}" stroke-width="2"/>
      <text x="50" y="24" font-family="monospace" font-size="14" fill="${tierConfig.color}" text-anchor="middle">
        ${tierConfig.emoji} ${tierConfig.name.toUpperCase()}
      </text>
    </g>
  </g>
  
  <!-- Identity Section -->
  <g class="vm-identity-group" transform="translate(${width/2}, ${height * 0.28})">
    <!-- Avatar -->
    <circle cx="0" cy="0" r="50" fill="#1a1a1a" stroke="#00FFCC" stroke-width="3"/>
    <text x="0" y="8" font-size="40" text-anchor="middle">${data.avatarUrl ? '' : '🤖'}</text>
    
    <!-- Name -->
    <text y="75" font-family="Orbitron, sans-serif" font-size="28" font-weight="700" fill="white" text-anchor="middle">
      ${data.displayName}
    </text>
    
    <!-- Address -->
    <text y="98" font-family="monospace" font-size="12" fill="#00FFCC" opacity="0.8" text-anchor="middle">
      ${truncateAddress(data.address)}
    </text>
    
    ${data.bio ? `<text y="118" font-family="monospace" font-size="11" fill="#888" text-anchor="middle">${data.bio.slice(0, 60)}${data.bio.length > 60 ? '...' : ''}</text>` : ''}
  </g>
  
  <!-- Traits Grid (6 badges) -->
  ${generateTraitsGrid(width / 2, height * 0.50, data.traits)}
  
  <!-- Stats Section -->
  <g class="vm-stats-group" transform="translate(${width/2}, ${height * 0.72})">
    <text y="0" font-family="monospace" font-size="12" fill="#00FFCC" opacity="0.6" text-anchor="middle">VOT BALANCE</text>
    <text y="28" font-family="Orbitron, sans-serif" font-size="24" fill="white" text-anchor="middle" filter="url(#glowFilter)">
      ${formatNumber(data.votBalance)} VOT
    </text>
  </g>
  
  <!-- XP Progress Bar -->
  ${data.xpLevel !== undefined ? `
  <g class="vm-xp-section" transform="translate(${width/2 - 100}, ${height * 0.80})">
    <text x="100" y="0" font-family="monospace" font-size="9" fill="#666" text-anchor="middle">
      LEVEL ${data.xpLevel} • ${data.xpProgress || 0}% TO NEXT
    </text>
    <rect x="0" y="8" width="200" height="10" rx="5" fill="#1a1a1a" stroke="#333" stroke-width="1"/>
    <rect x="1" y="9" width="${((data.xpProgress || 0) / 100) * 198}" height="8" rx="4" fill="url(#xpBarGrad)">
      <animate attributeName="width" from="0" to="${((data.xpProgress || 0) / 100) * 198}" dur="1.5s" fill="freeze"/>
    </rect>
  </g>
  ` : ''}
  
  <!-- Meta Info -->
  <g class="vm-meta" transform="translate(${width/2}, ${height * 0.88})">
    <text font-family="monospace" font-size="10" fill="#666" text-anchor="middle">
      Traits: ${traitCount}/6 • Token #${data.tokenId || 'TBD'}
    </text>
  </g>
  
  <!-- Footer -->
  <g class="vm-footer" transform="translate(20, ${height - 20})">
    <text font-family="monospace" font-size="10" fill="#444">
      mcpvot.xyz/${data.tokenId || ''} • IPFS: ${data.ipfsCid ? data.ipfsCid.slice(0, 12) + '...' : 'pending'}
    </text>
    <text x="${width - 40}" font-family="monospace" font-size="8" fill="#333" text-anchor="end">
      VOT MACHINE v3.0
    </text>
  </g>
</svg>`;

  if (options.format === 'svg') {
    return svg;
  }
  
  // HTML wrapper with full responsive CSS and interactivity
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VOT Machine - ${data.displayName}</title>
  <meta name="description" content="VOT Machine NFT - ${tierConfig.name} Tier with ${traitCount}/6 traits">
  <meta property="og:title" content="VOT Machine - ${data.displayName}">
  <meta property="og:description" content="${tierConfig.name} Tier • ${traitCount}/6 Traits • ${formatNumber(data.votBalance)} VOT">
  <meta property="og:type" content="profile">
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #050505; 
      min-height: 100vh; 
      display: flex; 
      flex-direction: column;
      align-items: center; 
      justify-content: center;
      font-family: 'Share Tech Mono', monospace;
    }
    .vot-machine-svg { 
      max-width: 100%; 
      height: auto;
      cursor: default;
    }
    
    /* Interactive trait badges */
    .trait-badge {
      cursor: pointer;
      transition: transform 0.2s ease, filter 0.2s ease;
    }
    .trait-badge:hover {
      transform: scale(1.05);
    }
    .trait-badge.active:hover {
      filter: drop-shadow(0 0 16px var(--trait-glow));
    }
    
    /* Glyph tooltips */
    .vot-glyph {
      cursor: help;
    }
    
    /* Tooltip container */
    .tooltip {
      position: fixed;
      background: #111;
      border: 1px solid #00FFCC;
      border-radius: 8px;
      padding: 12px 16px;
      color: #00FFCC;
      font-family: 'Share Tech Mono', monospace;
      font-size: 12px;
      max-width: 280px;
      z-index: 1000;
      pointer-events: none;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.2s, transform 0.2s;
    }
    .tooltip.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .tooltip-glyph {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .tooltip-label {
      color: #FFB800;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .tooltip-trans {
      color: #666;
      font-size: 10px;
      margin-bottom: 8px;
    }
    .tooltip-meaning {
      color: #888;
      line-height: 1.4;
    }
    
    /* Footer links */
    .vm-footer-links {
      display: flex;
      gap: 16px;
      margin-top: 20px;
      font-size: 12px;
    }
    .vm-footer-links a {
      color: #00FFCC;
      text-decoration: none;
      opacity: 0.6;
      transition: opacity 0.2s;
    }
    .vm-footer-links a:hover {
      opacity: 1;
    }
    
    ${ANIMATION_CSS}
    ${RESPONSIVE_CSS}
  </style>
</head>
<body>
  ${svg}
  
  <!-- Footer Links -->
  <div class="vm-footer-links">
    <a href="https://mcpvot.xyz" target="_blank">mcpvot.xyz</a>
    <a href="https://warpcast.com/~/channel/mcpvot" target="_blank">Farcaster</a>
    <a href="https://basescan.org/token/${data.tokenId ? `0x...#${data.tokenId}` : ''}" target="_blank">Basescan</a>
  </div>
  
  <!-- Tooltip Element -->
  <div class="tooltip" id="glyphTooltip">
    <div class="tooltip-glyph"></div>
    <div class="tooltip-label"></div>
    <div class="tooltip-trans"></div>
    <div class="tooltip-meaning"></div>
  </div>
  
  <script>
    // VOT Glyph Codex for tooltips
    const glyphCodex = ${JSON.stringify(VOT_GLYPH_CODEX)};
    const glyphMap = Object.fromEntries(glyphCodex.map(g => [g.glyph, g]));
    
    // Tooltip handling
    const tooltip = document.getElementById('glyphTooltip');
    
    document.querySelectorAll('.vot-glyph').forEach(el => {
      const glyph = el.textContent.trim();
      const data = glyphMap[glyph];
      
      if (data) {
        el.addEventListener('mouseenter', (e) => {
          tooltip.querySelector('.tooltip-glyph').textContent = data.glyph;
          tooltip.querySelector('.tooltip-label').textContent = data.label;
          tooltip.querySelector('.tooltip-trans').textContent = data.transliteration;
          tooltip.querySelector('.tooltip-meaning').textContent = data.meaning;
          
          const rect = e.target.getBoundingClientRect();
          tooltip.style.left = rect.left + 'px';
          tooltip.style.top = (rect.bottom + 10) + 'px';
          tooltip.classList.add('visible');
        });
        
        el.addEventListener('mouseleave', () => {
          tooltip.classList.remove('visible');
        });
      }
    });
    
    // Trait badge click handling
    document.querySelectorAll('.trait-badge').forEach(el => {
      el.addEventListener('click', () => {
        const trait = el.dataset.trait;
        console.log('Trait clicked:', trait);
        // Could navigate to trait-specific page or show modal
      });
    });
    
    // Copy address on click
    document.querySelectorAll('[data-address]').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        navigator.clipboard.writeText('${data.address}');
        el.style.opacity = '1';
        setTimeout(() => el.style.opacity = '0.8', 200);
      });
    });
  </script>
</body>
</html>`;
}

// =============================================================================
// EXPORTS
// =============================================================================

const VotMachineResponsive = {
  // Colors & Constants
  TRAIT_COLORS,
  TIER_COLORS,
  BREAKPOINTS,
  ANIMATION_CSS,
  RESPONSIVE_CSS,
  
  // 𒆜 VOT Glyph Codex - Sumerian Hieroglyphics
  VOT_GLYPH_CODEX,
  GLYPH_TONE_COLORS,
  
  // Helper functions
  countActiveTraits,
  getTierFromTraitCount,
  truncateAddress,
  formatNumber,
  
  // Animation Generators
  generateGlyphStream,        // 𒆜 Sumerian hieroglyphic rain
  generateGlyphConstellation, // 𒁹 Orbiting protocol symbols
  generateSacredGeometry,     // 🔯 Metatron's Cube / Flower of Life
  generateVotConstellation,   // 🔮 VOT particles
  generateMCPNetwork,         // ⚡ Neural network
  generateBurnEffect,         // 🔥 Deflationary flames
  generateIdentityConvergence,// 🌀 6 traits convergence
  generateTierAura,           // 💫 Tier-specific auras
  generateChainFlow,          // 🔗 Chain links
  
  // Component Generators
  generateTraitsGrid,         // 🎯 6 identity trait badges
  generateXPBar,              // 📊 XP progress bar
  generateBootSequence,       // 💻 Terminal boot sequence
  
  // Main Generator
  generateResponsiveVotMachine,
};

export default VotMachineResponsive;
