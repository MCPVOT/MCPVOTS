/**
 * Beeper Promo Banner SVG Generator V2
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  ANIMATED SVG BANNER FOR BEEPER x VOT x402 V2 CAMPAIGN                   ║
 * ║                                                                          ║
 * ║  Features:                                                               ║
 * ║  • 900x240 animated banner with retro VCR/terminal font aesthetic        ║
 * ║  • Minimal x402 V2 branding with hard-to-read retro typography           ║
 * ║  • Personalized with Farcaster/ENS/Basename identity                     ║
 * ║  • Advanced animated gauges, glows, oscilloscope, and pulse effects      ║
 * ║  • Beeper icon (top-left) → beep.works                                   ║
 * ║  • VOT logo (bottom-left) → mcpvot.xyz                                   ║
 * ║  • ERC-8004 + x402scan compatible for AI agent interaction               ║
 * ║  • No data rain - replaced with matrix grid pulse & signal wave          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

export interface BeeperUserData {
  address: string;
  fid: number;
  farcasterUsername: string;
  farcasterDisplayName?: string;
  farcasterPfpUrl?: string;
  farcasterFollowers?: number;
  ensName?: string;
  basename?: string;
  tokenId?: number;
  votBalance?: string;
  maxxBalance?: string;
}

/**
 * Beeper Dino Rarity Tiers - MCPVOT Ecosystem
 * 
 * Standard Tiers (95%):
 *   - node      (45%) - Basic network participant
 *   - validator (25%) - Active validator status
 *   - staker    (15%) - Committed staker
 *   - whale     (8%)  - High-volume holder
 *   - og        (4%)  - Original ecosystem builder
 *   - genesis   (2%)  - Genesis block participant
 * 
 * Special Expression Tiers (1%):
 *   - zzz       (0.5%)  - Dormant holder awakening
 *   - fomo      (0.3%)  - FOMO energy activated
 *   - gm        (0.15%) - GM culture representative
 *   - x402      (0.05%) - Ultra-rare x402 protocol glitch
 */
export type DinoRarity = 
  | 'node'      // Common - 45%
  | 'validator' // Uncommon - 25%
  | 'staker'    // Rare - 15%
  | 'whale'     // Epic - 8%
  | 'og'        // Legendary - 4%
  | 'genesis'   // Mythic - 2%
  | 'zzz'       // Sleepy - 0.5%
  | 'fomo'      // Angry - 0.3%
  | 'gm'        // Happy - 0.15%
  | 'x402';     // Glitch - 0.05%

export interface BeeperBannerOptions {
  width?: number;
  height?: number;
  theme?: 'beeper' | 'cyan' | 'orange' | 'purple' | 'chrome';
  showVotReward?: boolean;
  campaignText?: string;
  rarity?: DinoRarity;
}

const THEMES = {
  beeper: {
    primary: '#77FE80',  // Beeper dinosaur green
    secondary: '#00ffcc',
    accent: '#ff6600',
    bg: '#060606',       // Near-black from logo
  },
  cyan: {
    primary: '#00ffcc',
    secondary: '#ff6600',
    accent: '#8a63d2',
    bg: '#050505',
  },
  orange: {
    primary: '#ff6600',
    secondary: '#00ffcc',
    accent: '#ff0066',
    bg: '#050505',
  },
  purple: {
    primary: '#8a63d2',
    secondary: '#00ffcc',
    accent: '#ff6600',
    bg: '#050505',
  },
  chrome: {
    primary: '#c0c0c0',
    secondary: '#ff6600',
    accent: '#00ccff',
    bg: '#050505',
  },
};

// Rarity roll function - returns rarity based on MCPVOT tier percentages
export function rollRarity(): DinoRarity {
  const roll = Math.random() * 100;
  if (roll < 0.05) return 'x402';       // 0.05% - Ultra-rare protocol glitch
  if (roll < 0.20) return 'gm';         // 0.15% - GM culture
  if (roll < 0.50) return 'fomo';       // 0.3%  - FOMO energy
  if (roll < 1.00) return 'zzz';        // 0.5%  - Dormant awakening
  if (roll < 3.00) return 'genesis';    // 2%    - Genesis participant
  if (roll < 7.00) return 'og';         // 4%    - Original builder
  if (roll < 15.00) return 'whale';     // 8%    - High-volume holder
  if (roll < 30.00) return 'staker';    // 15%   - Committed staker
  if (roll < 55.00) return 'validator'; // 25%   - Active validator
  return 'node';                         // 45%   - Network participant
}

// Rarity display names for UI
export const RARITY_DISPLAY: Record<DinoRarity, string> = {
  node: 'NODE',
  validator: 'VALIDATOR',
  staker: 'STAKER',
  whale: 'WHALE',
  og: 'OG BUILDER',
  genesis: 'GENESIS',
  zzz: 'ZZZ',
  fomo: 'FOMO',
  gm: 'GM',
  x402: 'x402',
};

// Get rarity glow color for visual effects
export function getRarityGlow(rarity: DinoRarity): string {
  const glows: Record<DinoRarity, string> = {
    node: '#77FE80',      // Beeper green
    validator: '#77FE80', // Beeper green
    staker: '#77FE80',    // Beeper green
    whale: '#77FE80',     // Beeper green
    og: '#FFD700',        // Gold
    genesis: '#E0FFFF',   // Ethereal cyan
    zzz: '#77FE80',       // Beeper green (sleepy)
    fomo: '#FF4444',      // Red (intense)
    gm: '#FF69B4',        // Pink (happy)
    x402: '#FF00FF',      // Magenta (glitch)
  };
  return glows[rarity];
}

// Get rarity tier (for sorting/comparison)
export function getRarityTier(rarity: DinoRarity): number {
  const tiers: Record<DinoRarity, number> = {
    node: 1,
    validator: 2,
    staker: 3,
    whale: 4,
    og: 5,
    genesis: 6,
    zzz: 7,
    fomo: 8,
    gm: 9,
    x402: 10,
  };
  return tiers[rarity];
}

// Map SVG filename to rarity
export function getRaritySvgFile(rarity: DinoRarity): string {
  const fileMap: Record<DinoRarity, string> = {
    node: 'beeper-node.svg',
    validator: 'beeper-validator.svg',
    staker: 'beeper-staker.svg',
    whale: 'beeper-whale.svg',
    og: 'beeper-og.svg',
    genesis: 'beeper-genesis.svg',
    zzz: 'beeper-zzz.svg',
    fomo: 'beeper-fomo.svg',
    gm: 'beeper-gm.svg',
    x402: 'beeper-x402.svg',
  };
  return fileMap[rarity];
}

/**
 * Generate animated Beeper Promo Banner SVG V2
 * Enhanced with retro VCR font, x402 V2 branding, advanced effects
 */
export function generateBeeperBanner(
  userData: BeeperUserData,
  options: BeeperBannerOptions = {}
): string {
  const {
    width = 900,
    height = 240,
    theme = 'beeper',
    showVotReward = true,
    campaignText = 'x402 V2 FACILITATOR',
    rarity = 'node',
  } = options;

  const colors = THEMES[theme];
  const rarityGlow = getRarityGlow(rarity);
  
  // Determine display name priority: ENS > Basename > Farcaster > Address
  const displayName = userData.ensName 
    || userData.basename 
    || userData.farcasterUsername 
    || `${userData.address.slice(0, 6)}...${userData.address.slice(-4)}`;

  // Identity type label
  const identityType = userData.ensName 
    ? 'ENS'
    : userData.basename 
      ? 'BASE'
      : 'FID';

  // Format address
  const shortAddress = `${userData.address.slice(0, 6)}...${userData.address.slice(-4)}`;
  
  // Token ID display
  const tokenDisplay = userData.tokenId ? `#${String(userData.tokenId).padStart(4, '0')}` : '#----';
  
  // Rarity display
  const rarityLabel = RARITY_DISPLAY[rarity];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- VCR/Retro Distortion Filter -->
    <filter id="vcrDistort" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="42" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    
    <!-- Chromatic Aberration - More Intense -->
    <filter id="chromatic" x="-20%" y="-20%" width="140%" height="140%">
      <feOffset in="SourceGraphic" dx="1.5" dy="0" result="red">
        <animate attributeName="dx" values="1.5;-0.5;1.5" dur="0.08s" repeatCount="indefinite"/>
      </feOffset>
      <feOffset in="SourceGraphic" dx="-1.5" dy="0" result="blue">
        <animate attributeName="dx" values="-1.5;0.5;-1.5" dur="0.12s" repeatCount="indefinite"/>
      </feOffset>
      <feColorMatrix in="red" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="redOut"/>
      <feColorMatrix in="blue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blueOut"/>
      <feBlend in="redOut" in2="blueOut" mode="screen" result="blend"/>
      <feBlend in="blend" in2="SourceGraphic" mode="screen"/>
    </filter>
    
    <!-- Neon Glow Effect -->
    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur1"/>
      <feGaussianBlur stdDeviation="8" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Subtle Glow -->
    <filter id="subtleGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Advanced Scanline Pattern - Thicker, More Visible -->
    <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="2" fill="${colors.primary}" opacity="0.04"/>
      <rect y="2" width="4" height="2" fill="transparent"/>
    </pattern>
    
    <!-- CRT Curve Effect Overlay -->
    <pattern id="crtNoise" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="1" height="1" x="13" y="47" fill="${colors.primary}" opacity="0.03"/>
      <rect width="1" height="1" x="67" y="23" fill="${colors.primary}" opacity="0.02"/>
      <rect width="1" height="1" x="89" y="71" fill="${colors.secondary}" opacity="0.02"/>
      <rect width="1" height="1" x="31" y="83" fill="${colors.primary}" opacity="0.03"/>
    </pattern>
    
    <!-- Advanced Circuit Pattern - Motherboard Style -->
    <pattern id="circuitBoard" width="80" height="80" patternUnits="userSpaceOnUse">
      <!-- Main traces -->
      <path d="M 0 40 L 25 40 L 25 20 L 55 20 L 55 40 L 80 40" stroke="${colors.primary}" stroke-width="0.5" fill="none" opacity="0.15"/>
      <path d="M 40 0 L 40 15 L 60 15 L 60 65 L 40 65 L 40 80" stroke="${colors.primary}" stroke-width="0.5" fill="none" opacity="0.12"/>
      <path d="M 10 10 L 10 30 L 30 30" stroke="${colors.secondary}" stroke-width="0.3" fill="none" opacity="0.1"/>
      <path d="M 70 50 L 70 70 L 50 70" stroke="${colors.secondary}" stroke-width="0.3" fill="none" opacity="0.1"/>
      <!-- IC pads -->
      <rect x="23" y="18" width="4" height="4" fill="${colors.primary}" opacity="0.2" rx="0.5"/>
      <rect x="53" y="38" width="4" height="4" fill="${colors.secondary}" opacity="0.15" rx="0.5"/>
      <rect x="38" y="63" width="4" height="4" fill="${colors.primary}" opacity="0.2" rx="0.5"/>
      <!-- Vias -->
      <circle cx="10" cy="40" r="1.5" fill="${colors.primary}" opacity="0.25"/>
      <circle cx="70" cy="40" r="1.5" fill="${colors.primary}" opacity="0.25"/>
      <circle cx="40" cy="40" r="2" fill="${colors.secondary}" opacity="0.2"/>
    </pattern>
    
    <!-- Gauge Gradient with Rarity Color -->
    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${colors.primary}" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="${rarityGlow}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${colors.primary}" stop-opacity="0.3"/>
    </linearGradient>
    
    <!-- Signal Wave Gradient -->
    <linearGradient id="signalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${colors.primary}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${colors.primary}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${colors.primary}" stop-opacity="0"/>
    </linearGradient>
    
    <!-- Beeper Dino Icon (Pixel Art Style) -->
    <symbol id="beeperIcon" viewBox="0 0 24 24">
      <!-- Pixel dinosaur head - matching beep.works style -->
      <rect x="8" y="2" width="8" height="4" fill="${colors.primary}"/>
      <rect x="6" y="6" width="12" height="4" fill="${colors.primary}"/>
      <rect x="4" y="10" width="10" height="4" fill="${colors.primary}"/>
      <rect x="14" y="10" width="4" height="2" fill="${colors.primary}"/>
      <rect x="4" y="14" width="6" height="4" fill="${colors.primary}"/>
      <rect x="6" y="18" width="4" height="4" fill="${colors.primary}"/>
      <!-- Eye -->
      <rect x="12" y="8" width="2" height="2" fill="${colors.bg}"/>
    </symbol>
    
    <!-- VOT Logo Symbol -->
    <symbol id="votLogo" viewBox="0 0 40 20">
      <text x="0" y="16" style="font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; letter-spacing: -1px;" fill="${colors.primary}">VOT</text>
    </symbol>
  </defs>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- BACKGROUND LAYERS -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <!-- Base Background -->
  <rect width="${width}" height="${height}" fill="${colors.bg}" rx="6"/>
  
  <!-- Circuit Board Pattern -->
  <rect width="${width}" height="${height}" fill="url(#circuitBoard)" rx="6"/>
  
  <!-- CRT Noise Overlay -->
  <rect width="${width}" height="${height}" fill="url(#crtNoise)" rx="6"/>
  
  <!-- Scanlines Overlay -->
  <rect width="${width}" height="${height}" fill="url(#scanlines)" rx="6"/>
  
  <!-- Vignette Effect -->
  <rect width="${width}" height="${height}" rx="6" fill="url(#vignette)" opacity="0.3">
    <defs>
      <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="transparent"/>
        <stop offset="100%" stop-color="#000"/>
      </radialGradient>
    </defs>
  </rect>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- ANIMATED BACKGROUND EFFECTS (No Data Rain) -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <!-- Horizontal Signal Wave -->
  <g opacity="0.15">
    <path d="M 0 ${height / 2} Q 100 ${height / 2 - 20}, 200 ${height / 2} T 400 ${height / 2} T 600 ${height / 2} T 800 ${height / 2} T 1000 ${height / 2}" 
          stroke="url(#signalGrad)" stroke-width="1" fill="none">
      <animate attributeName="d" 
               values="M 0 ${height / 2} Q 100 ${height / 2 - 15}, 200 ${height / 2} T 400 ${height / 2} T 600 ${height / 2} T 800 ${height / 2} T 1000 ${height / 2};
                       M 0 ${height / 2} Q 100 ${height / 2 + 15}, 200 ${height / 2} T 400 ${height / 2} T 600 ${height / 2} T 800 ${height / 2} T 1000 ${height / 2};
                       M 0 ${height / 2} Q 100 ${height / 2 - 15}, 200 ${height / 2} T 400 ${height / 2} T 600 ${height / 2} T 800 ${height / 2} T 1000 ${height / 2}"
               dur="4s" repeatCount="indefinite"/>
    </path>
  </g>
  
  <!-- Grid Pulse Effect -->
  <g opacity="0.08">
    ${Array.from({ length: 9 }, (_, i) => `
    <line x1="${(i + 1) * 100}" y1="0" x2="${(i + 1) * 100}" y2="${height}" stroke="${colors.primary}" stroke-width="0.5">
      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="${2 + i * 0.3}s" repeatCount="indefinite"/>
    </line>`).join('')}
    ${Array.from({ length: 5 }, (_, i) => `
    <line x1="0" y1="${(i + 1) * 48}" x2="${width}" y2="${(i + 1) * 48}" stroke="${colors.primary}" stroke-width="0.5">
      <animate attributeName="opacity" values="0.3;0.6;0.3" dur="${2.5 + i * 0.2}s" repeatCount="indefinite"/>
    </line>`).join('')}
  </g>
  
  <!-- Moving Scanline (CRT Effect) -->
  <rect x="0" y="0" width="100%" height="3" fill="${colors.primary}" opacity="0.03">
    <animate attributeName="y" from="-3" to="${height + 3}" dur="2.5s" repeatCount="indefinite"/>
  </rect>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- FRAME & BORDERS -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <!-- Outer Frame with Pulse -->
  <rect x="3" y="3" width="${width - 6}" height="${height - 6}" fill="none" stroke="${colors.primary}" stroke-width="1.5" rx="5" opacity="0.5">
    <animate attributeName="opacity" values="0.4;0.7;0.4" dur="3s" repeatCount="indefinite"/>
  </rect>
  
  <!-- Inner Frame -->
  <rect x="8" y="8" width="${width - 16}" height="${height - 16}" fill="none" stroke="${colors.primary}" stroke-width="0.5" rx="3" opacity="0.25"/>
  
  <!-- Corner Brackets -->
  <g stroke="${colors.secondary}" stroke-width="2" fill="none" opacity="0.8">
    <path d="M 20 3 L 3 3 L 3 20"/>
    <path d="M ${width - 20} 3 L ${width - 3} 3 L ${width - 3} 20"/>
    <path d="M 20 ${height - 3} L 3 ${height - 3} L 3 ${height - 20}"/>
    <path d="M ${width - 20} ${height - 3} L ${width - 3} ${height - 3} L ${width - 3} ${height - 20}"/>
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- TOP-LEFT: BEEPER ICON WITH LINK -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <a xlink:href="https://beep.works/" target="_blank">
    <g transform="translate(18, 15)" filter="url(#subtleGlow)">
      <!-- Beeper Pixel Dino -->
      <use href="#beeperIcon" width="28" height="28" opacity="0.9">
        <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
      </use>
      <!-- beep.works label in retro font -->
      <text x="32" y="18" style="font-family: 'VT323', 'Courier New', monospace; font-size: 9px; fill: ${colors.primary}; letter-spacing: 1px; opacity: 0.6;">BEEP.WORKS</text>
    </g>
  </a>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- TOP-RIGHT: x402 V2 BRANDING (Retro Hard-to-Read Font) -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <g transform="translate(${width - 150}, 18)" filter="url(#chromatic)">
    <!-- x402 V2 in distorted retro style -->
    <text x="0" y="12" style="font-family: 'VT323', 'Courier New', monospace; font-size: 16px; fill: ${colors.primary}; letter-spacing: 4px; font-weight: bold;" filter="url(#vcrDistort)">
      x402
    </text>
    <text x="60" y="12" style="font-family: 'VT323', 'Courier New', monospace; font-size: 10px; fill: ${colors.secondary}; letter-spacing: 2px;">
      V2
    </text>
    <!-- Animated glitch bar -->
    <rect x="-5" y="14" width="85" height="1" fill="${colors.primary}" opacity="0.4">
      <animate attributeName="width" values="85;70;85" dur="0.1s" repeatCount="indefinite"/>
    </rect>
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- LEFT SECTION: ADVANCED GAUGE DISPLAY -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <g transform="translate(100, ${height / 2})">
    <!-- Outer oscilloscope ring -->
    <circle cx="0" cy="0" r="55" fill="none" stroke="${colors.primary}" stroke-width="0.5" opacity="0.2"/>
    
    <!-- Animated gauge arc -->
    <circle cx="0" cy="0" r="48" fill="none" stroke="url(#gaugeGrad)" stroke-width="3" stroke-dasharray="200 100" stroke-linecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="8s" repeatCount="indefinite"/>
    </circle>
    
    <!-- Inner measurement ring -->
    <circle cx="0" cy="0" r="40" fill="none" stroke="${colors.primary}" stroke-width="1" opacity="0.3"/>
    
    <!-- Tick marks (24 segments) -->
    ${Array.from({ length: 24 }, (_, i) => `
    <line x1="0" y1="-42" x2="0" y2="${i % 3 === 0 ? '-48' : '-45'}" 
          stroke="${colors.primary}" stroke-width="${i % 3 === 0 ? '1.5' : '0.5'}" 
          opacity="${i % 3 === 0 ? '0.8' : '0.4'}" 
          transform="rotate(${i * 15})"/>`).join('')}
    
    <!-- Center display area -->
    <circle cx="0" cy="0" r="35" fill="${colors.bg}" stroke="${colors.primary}" stroke-width="0.5" opacity="0.9"/>
    
    <!-- Token ID in retro font -->
    <text x="0" y="-12" text-anchor="middle" style="font-family: 'VT323', 'Courier New', monospace; font-size: 10px; fill: ${colors.secondary}; letter-spacing: 2px;">TOKEN</text>
    <text x="0" y="8" text-anchor="middle" style="font-family: 'VT323', 'Courier New', monospace; font-size: 18px; fill: ${colors.primary}; letter-spacing: 1px;" filter="url(#subtleGlow)">${tokenDisplay}</text>
    
    <!-- Rarity indicator -->
    <text x="0" y="24" text-anchor="middle" style="font-family: 'VT323', 'Courier New', monospace; font-size: 8px; fill: ${rarityGlow}; letter-spacing: 1px;">${rarityLabel}</text>
    
    <!-- Animated needle -->
    <g>
      <line x1="0" y1="0" x2="0" y2="-38" stroke="${rarityGlow}" stroke-width="2" stroke-linecap="round">
        <animateTransform attributeName="transform" type="rotate" values="-30;30;-30" dur="3s" repeatCount="indefinite"/>
      </line>
      <circle cx="0" cy="0" r="3" fill="${rarityGlow}"/>
    </g>
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- CENTER: IDENTITY DISPLAY -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <g transform="translate(${width / 2}, ${height / 2})" filter="url(#chromatic)">
    <!-- Hexagonal frame -->
    <polygon points="0,-70 60,-35 60,35 0,70 -60,35 -60,-35" fill="none" stroke="${colors.primary}" stroke-width="1.5" opacity="0.3">
      <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite"/>
    </polygon>
    <polygon points="0,-58 50,-29 50,29 0,58 -50,29 -50,-29" fill="rgba(119,254,128,0.03)" stroke="${colors.primary}" stroke-width="0.5" opacity="0.5"/>
    
    <!-- Identity type badge -->
    <rect x="-25" y="-80" width="50" height="14" fill="${colors.primary}" rx="2"/>
    <text x="0" y="-70" text-anchor="middle" style="font-family: 'VT323', 'Courier New', monospace; font-size: 10px; fill: ${colors.bg}; font-weight: bold; letter-spacing: 2px;">${identityType}</text>
    
    <!-- Primary identity name - Retro VCR style -->
    <text x="0" y="5" text-anchor="middle" 
          style="font-family: 'VT323', 'Courier New', monospace; font-size: ${displayName.length > 12 ? '16' : '20'}px; fill: ${colors.primary}; letter-spacing: 2px;"
          filter="url(#neonGlow)">${displayName.toUpperCase()}</text>
    
    <!-- Address in smaller retro font -->
    <text x="0" y="28" text-anchor="middle" style="font-family: 'VT323', 'Courier New', monospace; font-size: 9px; fill: ${colors.secondary}; letter-spacing: 1px;">${shortAddress}</text>
    
    <!-- FID display -->
    <text x="0" y="48" text-anchor="middle" style="font-family: 'VT323', 'Courier New', monospace; font-size: 8px; fill: ${colors.accent}; letter-spacing: 1px;">FID:${userData.fid}</text>
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- RIGHT SECTION: OSCILLOSCOPE / WAVEFORM -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <g transform="translate(${width - 120}, ${height / 2})">
    <!-- Oscilloscope frame -->
    <rect x="-55" y="-50" width="110" height="100" fill="rgba(0,0,0,0.5)" stroke="${colors.primary}" stroke-width="1" rx="4" opacity="0.8"/>
    
    <!-- Grid lines -->
    <g stroke="${colors.primary}" stroke-width="0.3" opacity="0.2">
      ${Array.from({ length: 5 }, (_, i) => `<line x1="-50" y1="${-40 + i * 20}" x2="50" y2="${-40 + i * 20}"/>`).join('')}
      ${Array.from({ length: 5 }, (_, i) => `<line x1="${-50 + i * 25}" y1="-40" x2="${-50 + i * 25}" y2="40"/>`).join('')}
    </g>
    
    <!-- Animated waveform -->
    <path d="M -50 0 Q -35 -25, -20 0 T 10 0 T 40 0 T 50 0" fill="none" stroke="${colors.primary}" stroke-width="2" filter="url(#subtleGlow)">
      <animate attributeName="d" 
               values="M -50 0 Q -35 -25, -20 0 T 10 0 T 40 0 T 50 0;
                       M -50 0 Q -35 25, -20 0 T 10 0 T 40 0 T 50 0;
                       M -50 0 Q -35 -25, -20 0 T 10 0 T 40 0 T 50 0"
               dur="1.5s" repeatCount="indefinite"/>
    </path>
    
    <!-- Secondary wave -->
    <path d="M -50 10 Q -30 -10, -10 10 T 30 10 T 50 10" fill="none" stroke="${colors.secondary}" stroke-width="1" opacity="0.5">
      <animate attributeName="d" 
               values="M -50 10 Q -30 -10, -10 10 T 30 10 T 50 10;
                       M -50 10 Q -30 20, -10 10 T 30 10 T 50 10;
                       M -50 10 Q -30 -10, -10 10 T 30 10 T 50 10"
               dur="2s" repeatCount="indefinite"/>
    </path>
    
    <!-- Label -->
    <text x="0" y="-55" text-anchor="middle" style="font-family: 'VT323', 'Courier New', monospace; font-size: 8px; fill: ${colors.primary}; letter-spacing: 2px;">SIGNAL</text>
    
    <!-- Status indicator -->
    <circle cx="45" cy="-42" r="3" fill="${colors.primary}">
      <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
    </circle>
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- BOTTOM-LEFT: VOT LOGO WITH LINK -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <a xlink:href="https://mcpvot.xyz/" target="_blank">
    <g transform="translate(18, ${height - 30})" filter="url(#subtleGlow)">
      <!-- VOT text logo in green -->
      <text x="0" y="12" style="font-family: 'VT323', 'Courier New', monospace; font-size: 14px; fill: ${colors.primary}; letter-spacing: 2px; font-weight: bold;">VOT</text>
      <!-- mcpvot.xyz label -->
      <text x="40" y="12" style="font-family: 'VT323', 'Courier New', monospace; font-size: 8px; fill: ${colors.secondary}; letter-spacing: 1px; opacity: 0.6;">MCPVOT.XYZ</text>
      <!-- Animated underline -->
      <line x1="0" y1="16" x2="90" y2="16" stroke="${colors.primary}" stroke-width="0.5" opacity="0.4">
        <animate attributeName="x2" values="90;80;90" dur="2s" repeatCount="indefinite"/>
      </line>
    </g>
  </a>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- BOTTOM CENTER: NETWORK INFO BAR -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <g transform="translate(${width / 2}, ${height - 20})">
    <!-- Info bar background -->
    <rect x="-200" y="-10" width="400" height="18" fill="rgba(0,0,0,0.7)" rx="2"/>
    
    <!-- Protocol info in retro font -->
    <text x="-180" y="3" style="font-family: 'VT323', 'Courier New', monospace; font-size: 9px; fill: ${colors.primary}; letter-spacing: 1px;">ERC-8004</text>
    <text x="-100" y="3" style="font-family: 'VT323', 'Courier New', monospace; font-size: 9px; fill: ${colors.secondary}; letter-spacing: 1px;">BASE:8453</text>
    <text x="0" y="3" text-anchor="middle" style="font-family: 'VT323', 'Courier New', monospace; font-size: 9px; fill: ${colors.primary}; letter-spacing: 1px;">ERC-1155</text>
    <text x="100" y="3" style="font-family: 'VT323', 'Courier New', monospace; font-size: 9px; fill: ${colors.secondary}; letter-spacing: 1px;">x402SCAN</text>
    
    <!-- Animated separator dots -->
    <circle cx="-130" cy="0" r="1.5" fill="${colors.primary}" opacity="0.6"/>
    <circle cx="-50" cy="0" r="1.5" fill="${colors.secondary}" opacity="0.6"/>
    <circle cx="50" cy="0" r="1.5" fill="${colors.primary}" opacity="0.6"/>
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- BOTTOM-RIGHT: FARCASTER BADGE -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <g transform="translate(${width - 100}, ${height - 25})">
    <rect x="-50" y="-8" width="100" height="18" fill="${colors.accent}" opacity="0.85" rx="9"/>
    <text x="0" y="5" text-anchor="middle" style="font-family: 'VT323', 'Courier New', monospace; font-size: 10px; fill: #fff; letter-spacing: 1px;">@${userData.farcasterUsername}</text>
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- TOP STATUS BAR -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <g transform="translate(${width / 2}, 22)">
    <!-- Campaign text in retro style -->
    <text x="0" y="0" text-anchor="middle" style="font-family: 'VT323', 'Courier New', monospace; font-size: 10px; fill: ${colors.primary}; letter-spacing: 4px;" filter="url(#vcrDistort)">${campaignText}</text>
    
    <!-- Status LEDs -->
    <g transform="translate(100, -3)">
      <circle cx="0" cy="0" r="3" fill="${colors.primary}">
        <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="10" cy="0" r="3" fill="${colors.secondary}">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite"/>
      </circle>
      <circle cx="20" cy="0" r="3" fill="${rarityGlow}">
        <animate attributeName="opacity" values="1;0.5;1" dur="1.2s" repeatCount="indefinite"/>
      </circle>
    </g>
    
    ${showVotReward ? `
    <!-- VOT Reward Badge -->
    <g transform="translate(-120, -4)">
      <rect x="-45" y="-6" width="90" height="14" fill="${colors.secondary}" opacity="0.9" rx="7"/>
      <text x="0" y="4" text-anchor="middle" style="font-family: 'VT323', 'Courier New', monospace; font-size: 9px; fill: ${colors.bg}; letter-spacing: 1px;">+25K VOT</text>
    </g>
    ` : ''}
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- AGENT INTERACTION METADATA (Hidden but parseable) -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:schema="https://schema.org/">
      <rdf:Description>
        <schema:name>BEEPER x402 V2 Builder NFT</schema:name>
        <schema:identifier>${tokenDisplay}</schema:identifier>
        <schema:creator>MCPVOT Ecosystem</schema:creator>
        <schema:url>https://mcpvot.xyz/builder/${userData.tokenId || userData.address}</schema:url>
        <schema:blockchain>Base Mainnet (8453)</schema:blockchain>
        <schema:standard>ERC-1155, ERC-8004, x402</schema:standard>
        <schema:llama>https://mcpvot.xyz/llama.txt</schema:llama>
        <schema:x402scan>https://mcpvot.xyz/.well-known/x402.json</schema:x402scan>
      </rdf:Description>
    </rdf:RDF>
  </metadata>
</svg>`;
}

/**
 * Generate comprehensive metadata JSON for Beeper NFT (ERC-1155)
 * 
 * Follows OpenSea metadata standards with MCPVOT ecosystem extensions
 * https://docs.opensea.io/docs/metadata-standards
 */
export function generateBeeperMetadata(
  userData: BeeperUserData,
  svgCid: string,
  rarity: DinoRarity = 'node'
): object {
  const displayName = userData.ensName 
    || userData.basename 
    || userData.farcasterUsername 
    || `${userData.address.slice(0, 6)}...${userData.address.slice(-4)}`;

  const rarityConfig = {
    node:      { label: 'NODE RUNNER',    tier: 1,  chance: '45%',    color: '#77FE80' },
    validator: { label: 'VALIDATOR',      tier: 2,  chance: '25%',    color: '#00ccff' },
    staker:    { label: 'STAKER',         tier: 3,  chance: '15%',    color: '#aa66ff' },
    whale:     { label: 'WHALE',          tier: 4,  chance: '8%',     color: '#ff8800' },
    og:        { label: 'OG BUILDER',     tier: 5,  chance: '4%',     color: '#ffcc00' },
    genesis:   { label: 'GENESIS',        tier: 6,  chance: '2%',     color: '#ff4444' },
    zzz:       { label: 'ZZZ HOLDER',     tier: 7,  chance: '0.5%',   color: '#7289DA' },
    fomo:      { label: 'FOMO LORD',      tier: 8,  chance: '0.3%',   color: '#ff3388' },
    gm:        { label: 'GM LEGEND',      tier: 9,  chance: '0.15%',  color: '#44ffaa' },
    x402:      { label: 'x402 ASCENDED',  tier: 10, chance: '0.05%',  color: '#ff44ff' },
  };

  const config = rarityConfig[rarity];
  const mintTimestamp = Math.floor(Date.now() / 1000);

  return {
    // ═══ STANDARD ERC-1155 METADATA ═══
    name: `🦖 BEEPER MACHINE #${userData.tokenId || '???'} - ${config.label}`,
    description: `🎰 BEEPER MACHINE // Builder NFT for ${displayName}\n\n` +
      `🦖 Tier: ${config.label} (${config.chance} VRF Rarity)\n` +
      `⛓️ Network: Base Mainnet (Chain ID: 8453)\n` +
      `📦 Collection: MCPVOT Ecosystem Builder NFTs\n\n` +
      `This NFT grants membership to the MCPVOT ecosystem. ` +
      `Minted via the x402 Facilitator protocol with VRF-based rarity determination.\n\n` +
      `💰 Pay $0.25 USDC → Receive 69,000 VOT → 1% Burns → NFT Mints\n` +
      `💎 USDC kept in Treasury\n\n` +
      `• VOT Token: 0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07\n` +
      `• Chain: Base Mainnet\n` +
      `• Standard: ERC-1155\n` +
      `• Protocol: x402 Facilitator • EIP-4804 Ready`,
    
    image: `ipfs://${svgCid}`,
    animation_url: `ipfs://${svgCid}`,
    
    external_url: userData.tokenId 
      ? `https://mcpvot.xyz/builder/${userData.tokenId}`
      : `https://mcpvot.xyz/builder/${userData.address}`,

    // ═══ OPENSEA-COMPATIBLE ATTRIBUTES ═══
    attributes: [
      // Rarity traits
      { trait_type: 'Rarity', value: config.label },
      { trait_type: 'Rarity Tier', value: config.tier, display_type: 'number' },
      { trait_type: 'Rarity Chance', value: config.chance },
      
      // Identity traits
      { trait_type: 'Builder Address', value: userData.address },
      ...(userData.farcasterUsername ? [{ trait_type: 'Farcaster', value: `@${userData.farcasterUsername}` }] : []),
      ...(userData.fid ? [{ trait_type: 'Farcaster FID', value: userData.fid, display_type: 'number' }] : []),
      ...(userData.ensName ? [{ trait_type: 'ENS Name', value: userData.ensName }] : []),
      ...(userData.basename ? [{ trait_type: 'Basename', value: userData.basename }] : []),
      
      // Network traits
      { trait_type: 'Network', value: 'Base Mainnet' },
      { trait_type: 'Chain ID', value: 8453, display_type: 'number' },
      { trait_type: 'Token Standard', value: 'ERC-1155' },
      
      // Collection traits
      { trait_type: 'Collection', value: 'BEEPER MACHINE' },
      { trait_type: 'Ecosystem', value: 'MCPVOT' },
      { trait_type: 'Protocol', value: 'x402 Facilitator' },
      { trait_type: 'Machine Type', value: 'Builder NFT' },
      
      // Metadata
      { trait_type: 'Mint Date', value: mintTimestamp, display_type: 'date' },
      { trait_type: 'Version', value: '2.0.0' },
    ],

    // ═══ EXTENDED PROPERTIES ═══
    properties: {
      // File information
      files: [
        {
          uri: `ipfs://${svgCid}`,
          type: 'image/svg+xml',
          cdn: false,
        },
      ],
      
      // Collection info
      category: 'builder-nft',
      collection: {
        name: 'BEEPER MACHINE',
        family: 'MCPVOT Ecosystem',
        symbol: 'BEEPER',
        description: '🎰 Slot Machine Style Builder NFTs',
      },
      
      // Rarity info
      rarity: {
        tier: rarity,
        label: config.label,
        chance: config.chance,
        color: config.color,
        vrf_verified: true,
      },
      
      // Identity info
      identity: {
        address: userData.address,
        farcaster: userData.farcasterUsername || null,
        fid: userData.fid || null,
        ens: userData.ensName || null,
        basename: userData.basename || null,
        display_name: displayName,
      },
      
      // MCPVOT ecosystem info
      ecosystem: {
        vot_token: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
        maxx_token: '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467',
        chain: 'base',
        chain_id: 8453,
        protocol: 'x402-facilitator',
      },
      
      // Creators
      creators: [
        {
          address: '0x7A6046b5953F2c998BE5Ce26eb98083e34Dc4CC7',
          share: 100,
          role: 'MCPVOT Ecosystem',
        },
      ],
      
      // Technical metadata
      metadata_version: '2.0.0',
      generated_at: new Date().toISOString(),
      generator: 'beeper-banner-generator',
    },

    // ═══ ROYALTY INFO (EIP-2981) ═══
    seller_fee_basis_points: 250, // 2.5% royalty
    fee_recipient: '0x7A6046b5953F2c998BE5Ce26eb98083e34Dc4CC7',
  };
}

const beeperBannerModule = { generateBeeperBanner, generateBeeperMetadata };
export default beeperBannerModule;
