/**
 * CYBERPUNK PALETTE SYSTEM
 * 
 * Based on ethermax.tech / ipfs-landing design language
 * Core aesthetic: Noir terminal + neon accents + CRT effects
 * 
 * @see ipfs-landing/index.html for reference implementation
 * 
 * TODO for Claude Code App:
 * - Research more ethermax.tech palettes and styles
 * - Analyze clanker.world and farcaster frames for additional inspiration
 * - Consider time-of-day variations (day trader vs night owl modes)
 */

// =============================================================================
// CORE COLOR SYSTEM
// =============================================================================

export const CYBERPUNK_COLORS = {
  // Primary Neon Colors
  primary: '#00ffcc',      // Cyan (main accent)
  secondary: '#ff6600',    // Orange (secondary accent)
  accent: '#ff0066',       // Magenta (highlight)
  blue: '#00aaff',         // Blue (information)
  
  // Background System
  bgDark: '#050505',       // Pure dark
  bgCard: '#0a0a0a',       // Card background
  bgPanel: '#0f0f0f',      // Panel background
  bgHover: '#1a1a1a',      // Hover state
  
  // Text Hierarchy
  textPrimary: '#f0f0f0',  // Main text
  textSecondary: '#aaaaaa', // Secondary text
  textMuted: '#666666',    // Muted/disabled
  textAccent: '#00ffcc',   // Accent text
  
  // Status Colors
  success: '#00ff88',      // Success green
  warning: '#ffaa00',      // Warning orange
  error: '#ff3366',        // Error red
  info: '#00aaff',         // Info blue
  
  // Chart/Data Colors
  burn: '#ff0066',         // Burn indicator
  treasury: '#ff6600',     // Treasury orange
  liquidity: '#00ffcc',    // Liquidity cyan
  supply: '#8a63d2',       // Supply purple
  
  // Glow Effects
  glowCyan: 'rgba(0, 255, 204, 0.5)',
  glowOrange: 'rgba(255, 102, 0, 0.4)',
  glowMagenta: 'rgba(255, 0, 102, 0.4)',
  glowBlue: 'rgba(0, 170, 255, 0.4)',
  glowWhite: 'rgba(255, 255, 255, 0.3)',
} as const;

// =============================================================================
// PALETTE PRESETS BY CATEGORY
// =============================================================================

export interface CyberpunkPalette {
  id?: string;  // Optional for compatibility with ColorPalette
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  glow?: string;  // Optional for compatibility with ColorPalette
}

export const CATEGORY_PALETTES: Record<string, CyberpunkPalette> = {
  // Core VOT palette - Cyan dominant
  vot: {
    name: 'VOT Protocol',
    primary: '#00ffcc',
    secondary: '#ff6600',
    accent: '#ff0066',
    background: '#050505',
    text: '#f0f0f0',
    glow: 'rgba(0, 255, 204, 0.5)',
  },
  
  // MCPVOT palette - Multi-tone
  mcpvot: {
    name: 'MCPVOT Network',
    primary: '#00ffcc',
    secondary: '#8a63d2',
    accent: '#ff6600',
    background: '#050505',
    text: '#f0f0f0',
    glow: 'rgba(0, 255, 204, 0.4)',
  },
  
  // Warplet palette - Silver/Chrome
  warplet: {
    name: 'Warplet Chrome',
    primary: '#c0c0c0',
    secondary: '#00ffcc',
    accent: '#ffd700',
    background: '#0a0a0a',
    text: '#f0f0f0',
    glow: 'rgba(192, 192, 192, 0.5)',
  },
  
  // ENS/Basename palette - Blue dominant
  ens: {
    name: 'ENS Registry',
    primary: '#5298ff',
    secondary: '#00ffcc',
    accent: '#ff6600',
    background: '#050505',
    text: '#f0f0f0',
    glow: 'rgba(82, 152, 255, 0.4)',
  },
  
  // DeFi palette - Green dominant
  defi: {
    name: 'DeFi Matrix',
    primary: '#00ff88',
    secondary: '#00ffcc',
    accent: '#ff6600',
    background: '#050505',
    text: '#00ff88',
    glow: 'rgba(0, 255, 136, 0.4)',
  },
  
  // Gaming palette - Purple dominant
  gaming: {
    name: 'Gaming Grid',
    primary: '#8a63d2',
    secondary: '#ff0066',
    accent: '#00ffcc',
    background: '#050505',
    text: '#f0f0f0',
    glow: 'rgba(138, 99, 210, 0.5)',
  },
  
  // Minimal palette - Monochrome
  minimal: {
    name: 'Minimal Ghost',
    primary: '#ffffff',
    secondary: '#888888',
    accent: '#00ffcc',
    background: '#050505',
    text: '#f0f0f0',
    glow: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Base chain palette - Blue
  base: {
    name: 'Base Layer',
    primary: '#0052ff',
    secondary: '#00ffcc',
    accent: '#ff6600',
    background: '#050505',
    text: '#f0f0f0',
    glow: 'rgba(0, 82, 255, 0.4)',
  },
  
  // Farcaster palette - Purple
  farcaster: {
    name: 'Farcaster Purple',
    primary: '#8a63d2',
    secondary: '#00ffcc',
    accent: '#ff0066',
    background: '#050505',
    text: '#f0f0f0',
    glow: 'rgba(138, 99, 210, 0.5)',
  },
  
  // MAXX palette - Orange dominant
  maxx: {
    name: 'MAXX Protocol',
    primary: '#ff6600',
    secondary: '#00ffcc',
    accent: '#ff0066',
    background: '#050505',
    text: '#f0f0f0',
    glow: 'rgba(255, 102, 0, 0.5)',
  },
  
  // Burn palette - Red/Magenta
  burn: {
    name: 'Burn Protocol',
    primary: '#ff0066',
    secondary: '#ff6600',
    accent: '#ffd700',
    background: '#050505',
    text: '#f0f0f0',
    glow: 'rgba(255, 0, 102, 0.5)',
  },
  
  // x402 Payment palette
  x402: {
    name: 'x402 Payment',
    primary: '#00ff88',
    secondary: '#00ffcc',
    accent: '#ffd700',
    background: '#050505',
    text: '#f0f0f0',
    glow: 'rgba(0, 255, 136, 0.4)',
  },
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const CYBERPUNK_FONTS = {
  mono: "'Share Tech Mono', 'Courier New', monospace",
  display: "'Orbitron', 'Arial Black', sans-serif",
  system: "'Segoe UI', 'SF Pro Display', sans-serif",
};

export const FONT_SIZES = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 24,
  display: 32,
  hero: 48,
};

// =============================================================================
// ANIMATION KEYFRAMES
// =============================================================================

export const KEYFRAME_ANIMATIONS = {
  // CRT Scanline
  scanline: `
    @keyframes scanline {
      0%, 100% { top: 0%; opacity: 0.5; }
      50% { top: 100%; opacity: 0.2; }
    }
  `,
  
  // Glow Pulse
  glowPulse: `
    @keyframes glowPulse {
      0%, 100% { filter: brightness(1) drop-shadow(0 0 5px currentColor); }
      50% { filter: brightness(1.3) drop-shadow(0 0 15px currentColor); }
    }
  `,
  
  // Gradient Flow
  gradientFlow: `
    @keyframes gradientFlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `,
  
  // Data Rain
  dataRain: `
    @keyframes dataRain {
      0% { transform: translateY(-100%); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(100vh); opacity: 0; }
    }
  `,
  
  // Glitch Effect
  glitch: `
    @keyframes glitch {
      0%, 100% { transform: translate(0); filter: none; }
      20% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
      40% { transform: translate(2px, -2px); filter: saturate(200%); }
      60% { transform: translate(-1px, 1px); filter: none; }
    }
  `,
  
  // Boot Sequence
  bootSequence: `
    @keyframes bootSequence {
      0% { opacity: 0; transform: translateX(-10px); }
      50% { opacity: 1; transform: translateX(0); }
      100% { opacity: 1; }
    }
  `,
  
  // Blink Cursor
  blink: `
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `,
  
  // Float
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `,
  
  // Rotate Slow
  rotateSlow: `
    @keyframes rotateSlow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  
  // Burn Flicker
  burnFlicker: `
    @keyframes burnFlicker {
      0%, 100% { opacity: 1; }
      25% { opacity: 0.9; }
      50% { opacity: 1; }
      75% { opacity: 0.85; }
    }
  `,
};

// =============================================================================
// SVG DEFS (Reusable patterns)
// =============================================================================

export function generateCyberpunkDefs(palette: CyberpunkPalette): string {
  return `
    <defs>
      <!-- Noise Texture -->
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise"/>
        <feColorMatrix type="saturate" values="0"/>
        <feBlend in="SourceGraphic" in2="noise" mode="multiply"/>
      </filter>
      
      <!-- CRT Scanlines -->
      <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="4" y2="0" stroke="${palette.primary}" stroke-width="0.5" opacity="0.1"/>
      </pattern>
      
      <!-- Circuit Grid -->
      <pattern id="circuitGrid" width="50" height="50" patternUnits="userSpaceOnUse">
        <rect width="50" height="50" fill="none"/>
        <path d="M0 25 H50 M25 0 V50" stroke="${palette.primary}" stroke-width="0.3" opacity="0.1"/>
        <circle cx="25" cy="25" r="2" fill="${palette.primary}" opacity="0.2"/>
        <circle cx="0" cy="0" r="1" fill="${palette.primary}" opacity="0.3"/>
        <circle cx="50" cy="0" r="1" fill="${palette.primary}" opacity="0.3"/>
        <circle cx="0" cy="50" r="1" fill="${palette.primary}" opacity="0.3"/>
        <circle cx="50" cy="50" r="1" fill="${palette.primary}" opacity="0.3"/>
      </pattern>
      
      <!-- Glow Filter -->
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feFlood flood-color="${palette.glow}" result="color"/>
        <feComposite in="color" in2="blur" operator="in" result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <!-- Strong Glow -->
      <filter id="glowStrong">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feFlood flood-color="${palette.glow}" result="color"/>
        <feComposite in="color" in2="blur" operator="in" result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <!-- Primary Gradient -->
      <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${palette.primary};stop-opacity:1"/>
        <stop offset="100%" style="stop-color:${palette.secondary};stop-opacity:0.5"/>
      </linearGradient>
      
      <!-- Vertical Gradient -->
      <linearGradient id="verticalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${palette.background};stop-opacity:1"/>
        <stop offset="50%" style="stop-color:${palette.background};stop-opacity:0.95"/>
        <stop offset="100%" style="stop-color:${palette.primary};stop-opacity:0.1"/>
      </linearGradient>
      
      <!-- Accent Gradient -->
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:${palette.accent};stop-opacity:1"/>
        <stop offset="100%" style="stop-color:${palette.primary};stop-opacity:0.8"/>
      </linearGradient>
    </defs>
  `;
}

// =============================================================================
// EFFECT GENERATORS
// =============================================================================

export function generateDataRain(palette: CyberpunkPalette, width: number, height: number): string {
  const chars = '01アイウエオカキクケコサシスセソ$@#%&';
  const columns = Math.floor(width / 20);
  let rain = '';
  
  for (let i = 0; i < columns; i++) {
    const x = i * 20 + 10;
    const delay = Math.random() * 5;
    const duration = 3 + Math.random() * 4;
    const char = chars[Math.floor(Math.random() * chars.length)];
    const opacity = 0.1 + Math.random() * 0.2;
    
    rain += `
      <text 
        x="${x}" 
        y="0" 
        fill="${palette.primary}" 
        opacity="${opacity}" 
        font-family="${CYBERPUNK_FONTS.mono}" 
        font-size="12"
      >
        ${char}
        <animateTransform 
          attributeName="transform" 
          type="translate" 
          values="0,-20;0,${height + 20}" 
          dur="${duration}s" 
          begin="${delay}s"
          repeatCount="indefinite"
        />
        <animate 
          attributeName="opacity" 
          values="0;${opacity};0" 
          dur="${duration}s" 
          begin="${delay}s"
          repeatCount="indefinite"
        />
      </text>
    `;
  }
  
  return `<g class="data-rain">${rain}</g>`;
}

export function generateScanlines(width: number, height: number): string {
  return `
    <g class="scanlines" opacity="0.1">
      ${Array.from({ length: Math.floor(height / 4) }, (_, i) => 
        `<line x1="0" y1="${i * 4}" x2="${width}" y2="${i * 4}" stroke="white" stroke-width="1"/>`
      ).join('')}
    </g>
    <rect 
      class="scan-bar" 
      x="0" 
      y="0" 
      width="${width}" 
      height="2" 
      fill="rgba(255,255,255,0.1)"
    >
      <animate attributeName="y" values="0;${height}" dur="3s" repeatCount="indefinite"/>
    </rect>
  `;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateGlitchEffect(_targetId?: string): string {
  return `
    <filter id="glitchFilter" x="-10%" y="-10%" width="120%" height="120%">
      <feFlood flood-color="red" result="red"/>
      <feFlood flood-color="cyan" result="cyan"/>
      <feComposite in="red" in2="SourceGraphic" operator="in" result="redText"/>
      <feComposite in="cyan" in2="SourceGraphic" operator="in" result="cyanText"/>
      <feOffset in="redText" dx="-2" dy="0" result="redOffset">
        <animate attributeName="dx" values="-2;2;-1;0;-2" dur="0.5s" repeatCount="indefinite"/>
      </feOffset>
      <feOffset in="cyanText" dx="2" dy="0" result="cyanOffset">
        <animate attributeName="dx" values="2;-2;1;0;2" dur="0.5s" repeatCount="indefinite"/>
      </feOffset>
      <feBlend in="redOffset" in2="cyanOffset" mode="screen" result="blend"/>
      <feBlend in="blend" in2="SourceGraphic" mode="screen"/>
    </filter>
  `;
}

export function generateCircuitBoard(palette: CyberpunkPalette, width: number, height: number): string {
  const lines: string[] = [];
  const nodes: string[] = [];
  
  // Generate random circuit paths
  for (let i = 0; i < 15; i++) {
    const startX = Math.random() * width;
    const startY = Math.random() * height;
    const endX = Math.random() * width;
    const midY = startY + (Math.random() - 0.5) * 100;
    
    lines.push(`
      <path 
        d="M${startX},${startY} L${startX},${midY} L${endX},${midY}" 
        stroke="${palette.primary}" 
        stroke-width="0.5" 
        fill="none" 
        opacity="0.2"
      />
    `);
    
    // Add node at end
    nodes.push(`
      <circle 
        cx="${endX}" 
        cy="${midY}" 
        r="2" 
        fill="${palette.primary}" 
        opacity="0.3"
      >
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="${1 + Math.random() * 2}s" repeatCount="indefinite"/>
      </circle>
    `);
  }
  
  return `
    <g class="circuit-board">
      ${lines.join('')}
      ${nodes.join('')}
    </g>
  `;
}

// =============================================================================
// CYBERPUNK RANK SYSTEM
// Based on VOT holdings for dynamic NFT personalization
// =============================================================================

export type CyberpunkRank = 
  | 'citizen'
  | 'initiate'
  | 'builder'
  | 'architect'
  | 'pioneer'
  | 'visionary'
  | 'oracle'
  | 'sovereign'
  | 'prime';

export interface RankThreshold {
  rank: CyberpunkRank;
  minHoldings: number;
  color: string;
  glow: string;
  title: string;
}

export const RANK_THRESHOLDS: RankThreshold[] = [
  { rank: 'citizen',    minHoldings: 0,           color: '#666666', glow: 'rgba(102, 102, 102, 0.3)', title: 'Citizen' },
  { rank: 'initiate',   minHoldings: 1000,        color: '#00ffcc', glow: 'rgba(0, 255, 204, 0.4)',   title: 'Initiate' },
  { rank: 'builder',    minHoldings: 10000,       color: '#00ff88', glow: 'rgba(0, 255, 136, 0.4)',   title: 'Builder' },
  { rank: 'architect',  minHoldings: 50000,       color: '#00aaff', glow: 'rgba(0, 170, 255, 0.5)',   title: 'Architect' },
  { rank: 'pioneer',    minHoldings: 100000,      color: '#8a63d2', glow: 'rgba(138, 99, 210, 0.5)',  title: 'Pioneer' },
  { rank: 'visionary',  minHoldings: 500000,      color: '#ff6600', glow: 'rgba(255, 102, 0, 0.5)',   title: 'Visionary' },
  { rank: 'oracle',     minHoldings: 1000000,     color: '#ff0066', glow: 'rgba(255, 0, 102, 0.5)',   title: 'Oracle' },
  { rank: 'sovereign',  minHoldings: 5000000,     color: '#ffd700', glow: 'rgba(255, 215, 0, 0.6)',   title: 'Sovereign' },
  { rank: 'prime',      minHoldings: 10000000,    color: '#ffffff', glow: 'rgba(255, 255, 255, 0.8)', title: 'Prime' },
];

/**
 * Get rank from total holdings (VOT + MAXX combined)
 */
export function getRankFromHoldings(holdings: number): CyberpunkRank {
  // Find highest threshold met
  let rank: CyberpunkRank = 'citizen';
  for (const threshold of RANK_THRESHOLDS) {
    if (holdings >= threshold.minHoldings) {
      rank = threshold.rank;
    }
  }
  return rank;
}

/**
 * Get color for a specific rank
 */
export function getRankColor(rank: CyberpunkRank): string {
  const threshold = RANK_THRESHOLDS.find(t => t.rank === rank);
  return threshold?.color || RANK_THRESHOLDS[0].color;
}

/**
 * Get glow effect for a specific rank
 */
export function getRankGlow(rank: CyberpunkRank): string {
  const threshold = RANK_THRESHOLDS.find(t => t.rank === rank);
  return threshold?.glow || RANK_THRESHOLDS[0].glow;
}

/**
 * Get full rank info
 */
export function getRankInfo(rank: CyberpunkRank): RankThreshold {
  return RANK_THRESHOLDS.find(t => t.rank === rank) || RANK_THRESHOLDS[0];
}

/**
 * Get rank title for display
 */
export function getRankTitle(rank: CyberpunkRank): string {
  const threshold = RANK_THRESHOLDS.find(t => t.rank === rank);
  return threshold?.title || 'Citizen';
}

// =============================================================================
// HELPER: Get palette by category
// =============================================================================

export function getPaletteForCategory(category: string): CyberpunkPalette {
  return CATEGORY_PALETTES[category] || CATEGORY_PALETTES.vot;
}

export function getPaletteForEdition(edition: string): CyberpunkPalette {
  const editionMap: Record<string, string> = {
    'warplet': 'warplet',
    'ethermax': 'maxx',
    'vot-whale': 'vot',
    'builder': 'x402',
    'farcaster': 'farcaster',
    'base': 'base',
    'custom': 'vot',
  };
  return getPaletteForCategory(editionMap[edition] || 'vot');
}

const cyberpunkPaletteModule = {
  CYBERPUNK_COLORS,
  CATEGORY_PALETTES,
  CYBERPUNK_FONTS,
  FONT_SIZES,
  KEYFRAME_ANIMATIONS,
  RANK_THRESHOLDS,
  generateCyberpunkDefs,
  generateDataRain,
  generateScanlines,
  generateGlitchEffect,
  generateCircuitBoard,
  getPaletteForCategory,
  getPaletteForEdition,
  getRankFromHoldings,
  getRankColor,
  getRankGlow,
  getRankInfo,
  getRankTitle,
};

export default cyberpunkPaletteModule;
