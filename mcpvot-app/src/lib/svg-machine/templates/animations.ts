/**
 * SVG Animation Generators
 * 
 * Reusable animation snippets for all templates
 */

import { AnimationType, ColorPalette, DEFAULT_ANIMATIONS } from './types';

// =============================================================================
// CSS KEYFRAMES
// =============================================================================

export function generateKeyframes(type: AnimationType, palette: ColorPalette): string {
  switch (type) {
    case 'pulse':
      return `
        @keyframes pulse {
          0%, 100% { opacity: 0.4; filter: drop-shadow(0 0 5px ${palette.glow || palette.primary}); }
          50% { opacity: 1; filter: drop-shadow(0 0 20px ${palette.glow || palette.primary}); }
        }
      `;
      
    case 'float':
      return `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `;
      
    case 'scan':
      return `
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
      `;
      
    case 'data-rain':
      return `
        @keyframes dataRain {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `;
      
    case 'rotate':
      return `
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      
    case 'gradient':
      return `
        @keyframes gradientShift {
          0%, 100% { stop-color: ${palette.primary}; }
          50% { stop-color: ${palette.secondary}; }
        }
      `;
      
    case 'glitch':
      return `
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 2px); }
        }
        @keyframes glitchColor {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(90deg); }
        }
      `;
      
    case 'typewriter':
      return `
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes blink {
          0%, 50% { border-color: ${palette.primary}; }
          51%, 100% { border-color: transparent; }
        }
      `;
      
    case 'particles':
      return `
        @keyframes particle {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-100px) scale(0); opacity: 0; }
        }
      `;
      
    case 'wave':
      return `
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
      `;
      
    case 'breathe':
      return `
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `;
      
    case 'flicker':
      return `
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
          75% { opacity: 0.9; }
        }
      `;
      
    case 'orbit':
      return `
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(50px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(50px) rotate(-360deg); }
        }
      `;
      
    case 'morph':
      return `
        @keyframes morph {
          0%, 100% { border-radius: 50% 50% 50% 50%; }
          25% { border-radius: 60% 40% 60% 40%; }
          50% { border-radius: 40% 60% 40% 60%; }
          75% { border-radius: 50% 40% 60% 50%; }
        }
      `;
      
    case 'shimmer':
      return `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `;
      
    default:
      return '';
  }
}

// =============================================================================
// SVG ANIMATION ELEMENTS
// =============================================================================

export function generateDataRain(
  palette: ColorPalette, 
  columns: number = 20,
  speed: 'slow' | 'normal' | 'fast' = 'normal'
): string {
  const durations = { slow: '8s', normal: '5s', fast: '3s' };
  const duration = durations[speed];
  
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'.split('');
  
  let rain = '';
  for (let i = 0; i < columns; i++) {
    const x = (i / columns) * 100;
    const delay = (Math.random() * 5).toFixed(2);
    const charCount = 10 + Math.floor(Math.random() * 10);
    
    let column = `<g class="rain-column" style="animation: dataRain ${duration} linear infinite; animation-delay: ${delay}s;">`;
    
    for (let j = 0; j < charCount; j++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const y = j * 20;
      const opacity = (1 - j / charCount).toFixed(2);
      column += `<text x="${x}%" y="${y}" fill="${palette.primary}" opacity="${opacity}" font-family="monospace" font-size="12">${char}</text>`;
    }
    
    column += '</g>';
    rain += column;
  }
  
  return rain;
}

export function generateScanlines(
  palette: ColorPalette,
  height: number = 400
): string {
  const lineSpacing = Math.max(2, Math.floor(height / 100));
  return `
    <pattern id="scanlines" width="100%" height="${lineSpacing}" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="100%" y2="0" stroke="${palette.primary}" stroke-opacity="0.05"/>
    </pattern>
    <rect width="100%" height="100%" fill="url(#scanlines)">
      <animate attributeName="y" from="0" to="${lineSpacing}" dur="0.1s" repeatCount="indefinite"/>
    </rect>
  `;
}

export function generateCircuitLines(
  palette: ColorPalette,
  complexity: 'low' | 'medium' | 'high' = 'medium'
): string {
  const counts = { low: 5, medium: 10, high: 20 };
  const count = counts[complexity];
  
  let circuits = '';
  for (let i = 0; i < count; i++) {
    const x1 = Math.random() * 100;
    const y1 = Math.random() * 100;
    const x2 = x1 + (Math.random() - 0.5) * 30;
    const y2 = y1 + (Math.random() - 0.5) * 30;
    
    circuits += `
      <line 
        x1="${x1}%" y1="${y1}%" 
        x2="${x2}%" y2="${y2}%" 
        stroke="${palette.primary}" 
        stroke-width="1" 
        stroke-opacity="0.3"
        stroke-dasharray="5,5"
      >
        <animate attributeName="stroke-dashoffset" from="0" to="10" dur="1s" repeatCount="indefinite"/>
      </line>
    `;
    
    // Add node at intersection
    circuits += `
      <circle cx="${x2}%" cy="${y2}%" r="3" fill="${palette.primary}">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
    `;
  }
  
  return circuits;
}

export function generateGlowingBorder(
  palette: ColorPalette,
  width: number,
  height: number,
  strokeWidth: number = 2
): string {
  return `
    <rect 
      x="${strokeWidth}" 
      y="${strokeWidth}" 
      width="${width - strokeWidth * 2}" 
      height="${height - strokeWidth * 2}" 
      fill="none" 
      stroke="${palette.primary}"
      stroke-width="${strokeWidth}"
      rx="10"
    >
      <animate 
        attributeName="stroke-opacity" 
        values="0.3;1;0.3" 
        dur="3s" 
        repeatCount="indefinite"
      />
    </rect>
    <rect 
      x="${strokeWidth}" 
      y="${strokeWidth}" 
      width="${width - strokeWidth * 2}" 
      height="${height - strokeWidth * 2}" 
      fill="none" 
      stroke="${palette.glow || palette.primary}"
      stroke-width="${strokeWidth * 2}"
      rx="10"
      filter="blur(10px)"
      opacity="0.5"
    >
      <animate 
        attributeName="opacity" 
        values="0.2;0.6;0.2" 
        dur="3s" 
        repeatCount="indefinite"
      />
    </rect>
  `;
}

export function generatePulsingOrb(
  palette: ColorPalette,
  cx: number,
  cy: number,
  r: number = 50
): string {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${palette.primary}" opacity="0.1">
      <animate attributeName="r" values="${r};${r * 1.5};${r}" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="${palette.primary}" opacity="0.3">
      <animate attributeName="r" values="${r * 0.6};${r * 0.8};${r * 0.6}" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.3}" fill="${palette.primary}">
      <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite"/>
    </circle>
  `;
}

// =============================================================================
// STYLE GENERATORS
// =============================================================================

export function generateAnimationStyles(
  animations: AnimationType[],
  palette: ColorPalette,
  speed: 'slow' | 'normal' | 'fast' = 'normal'
): string {
  const speedMultiplier = { slow: 1.5, normal: 1, fast: 0.7 };
  const multiplier = speedMultiplier[speed];
  
  let styles = '<style>\n';
  
  // Add keyframes for each animation
  animations.forEach(anim => {
    styles += generateKeyframes(anim, palette);
  });
  
  // Add animation classes
  animations.forEach(anim => {
    const config = DEFAULT_ANIMATIONS[anim];
    const duration = parseFloat(config.duration) * multiplier;
    styles += `
      .anim-${anim} {
        animation: ${anim} ${duration}s ${config.easing} ${config.iterationCount};
      }
    `;
  });
  
  styles += '\n</style>';
  
  return styles;
}

// =============================================================================
// COMMON SVG ELEMENTS
// =============================================================================

export function generateSVGWrapper(
  content: string,
  width: number,
  height: number,
  palette: ColorPalette
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 ${width} ${height}"
  width="${width}"
  height="${height}"
>
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${palette.background}"/>
      <stop offset="100%" style="stop-color:${darkenColor(palette.background, 20)}"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  
  ${content}
</svg>`;
}

// Helper to darken colors
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// =============================================================================
// ENHANCED ANIMATION ELEMENTS (NEW)
// =============================================================================

/**
 * Generate VOT burn fire effect
 */
export function generateBurnEffect(
  palette: ColorPalette,
  x: number = 200,
  y: number = 300,
  scale: number = 1
): string {
  return `
    <g class="burn-effect" transform="translate(${x}, ${y}) scale(${scale})">
      <defs>
        <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#FF4500"/>
          <stop offset="50%" style="stop-color:#FF8C00"/>
          <stop offset="100%" style="stop-color:#FFD700"/>
        </linearGradient>
        <filter id="fireGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <g filter="url(#fireGlow)">
        <ellipse cx="0" cy="0" rx="30" ry="45" fill="url(#fireGrad)" opacity="0.8">
          <animate attributeName="ry" values="45;50;42;48;45" dur="0.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.9;0.7;0.85;0.8" dur="0.3s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="-10" cy="5" rx="15" ry="25" fill="#FF8C00" opacity="0.6">
          <animate attributeName="ry" values="25;30;22;28;25" dur="0.4s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="8" cy="8" rx="12" ry="20" fill="#FFD700" opacity="0.5">
          <animate attributeName="ry" values="20;25;18;22;20" dur="0.35s" repeatCount="indefinite"/>
        </ellipse>
      </g>
      <text y="65" text-anchor="middle" fill="${palette.accent || '#FF6B00'}" font-size="10" font-weight="bold">🔥 BURN</text>
    </g>
  `;
}

/**
 * Generate blockchain blocks animation
 */
export function generateBlockchainBlocks(
  palette: ColorPalette,
  count: number = 5
): string {
  let blocks = `<g class="blockchain-blocks">`;
  
  for (let i = 0; i < count; i++) {
    const x = 30 + i * 75;
    const delay = i * 0.3;
    blocks += `
      <g class="block" transform="translate(${x}, 0)">
        <rect x="0" y="0" width="60" height="40" rx="4" fill="${palette.primary}" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" begin="${delay}s" repeatCount="indefinite"/>
        </rect>
        <rect x="5" y="5" width="50" height="30" rx="2" fill="${palette.background}" stroke="${palette.primary}" stroke-width="1"/>
        <text x="30" y="25" text-anchor="middle" fill="${palette.primary}" font-size="10" font-family="monospace">#${1000 + i}</text>
        ${i < count - 1 ? `<line x1="60" y1="20" x2="75" y2="20" stroke="${palette.accent}" stroke-width="2" stroke-dasharray="5,3">
          <animate attributeName="stroke-dashoffset" values="8;0" dur="1s" repeatCount="indefinite"/>
        </line>` : ''}
      </g>
    `;
  }
  
  blocks += '</g>';
  return blocks;
}

/**
 * Generate x402 facilitator payment flow animation
 */
export function generatePaymentFlow(
  palette: ColorPalette,
  width: number = 400
): string {
  return `
    <g class="payment-flow">
      <!-- USDC In -->
      <g transform="translate(20, 0)">
        <circle cx="30" cy="30" r="25" fill="#2775CA" opacity="0.3"/>
        <text x="30" y="35" text-anchor="middle" fill="#2775CA" font-size="12" font-weight="bold">USDC</text>
        <text x="30" y="50" text-anchor="middle" fill="${palette.secondary}" font-size="8">$1</text>
      </g>
      
      <!-- Arrow 1 -->
      <line x1="80" y1="30" x2="140" y2="30" stroke="${palette.primary}" stroke-width="2" stroke-dasharray="5,3">
        <animate attributeName="stroke-dashoffset" values="8;0" dur="0.5s" repeatCount="indefinite"/>
      </line>
      
      <!-- x402 Facilitator -->
      <g transform="translate(${width/2 - 50}, 0)">
        <rect x="0" y="5" width="100" height="50" rx="8" fill="${palette.primary}" opacity="0.2"/>
        <text x="50" y="25" text-anchor="middle" fill="${palette.primary}" font-size="10" font-weight="bold">x402</text>
        <text x="50" y="42" text-anchor="middle" fill="${palette.secondary}" font-size="8">FACILITATOR</text>
      </g>
      
      <!-- Arrow 2 -->
      <line x1="${width/2 + 60}" y1="30" x2="${width - 100}" y2="30" stroke="${palette.accent}" stroke-width="2" stroke-dasharray="5,3">
        <animate attributeName="stroke-dashoffset" values="8;0" dur="0.5s" repeatCount="indefinite"/>
      </line>
      
      <!-- VOT Out -->
      <g transform="translate(${width - 80}, 0)">
        <circle cx="30" cy="30" r="25" fill="${palette.accent}" opacity="0.3">
          <animate attributeName="r" values="25;28;25" dur="1s" repeatCount="indefinite"/>
        </circle>
        <text x="30" y="35" text-anchor="middle" fill="${palette.accent}" font-size="12" font-weight="bold">VOT</text>
        <text x="30" y="50" text-anchor="middle" fill="${palette.secondary}" font-size="8">100K</text>
      </g>
    </g>
  `;
}

/**
 * CYBERPUNK RANK SYSTEM
 * Ranking based on ecosystem participation, not just VOT balance
 */

export type CyberpunkRank = 
  | 'GHOST'           // Default - No ecosystem ties
  | 'NETRUNNER'       // Has Farcaster OR ENS/Basename
  | 'CHROME_JOCKEY'   // Has Warplet NFT
  | 'EDGE_LORD'       // Has MAXX tokens
  | 'VOID_WALKER'     // VOT holder 10k+
  | 'CIRCUIT_BREAKER' // VOT holder 100k+ AND Warplet
  | 'QUANTUM_GHOST'   // VOT holder 500k+ AND Farcaster
  | 'ZERO_DAY'        // VOT holder 1M+ AND all credentials
  | 'SINGULARITY';    // Legendary - Top holder + all badges

export interface RankMetadata {
  name: string;
  color: string;
  glowColor: string;
  icon: string;
  title: string;
  description: string;
  minVot: number;
  level: number;  // Numeric level for attributes
  requirements: string[];
}

export const RANK_CONFIG: Record<CyberpunkRank, RankMetadata> = {
  'GHOST': {
    name: 'GHOST',
    color: '#666666',
    glowColor: 'rgba(102, 102, 102, 0.3)',
    icon: '👻',
    title: 'GHOST PROTOCOL',
    description: 'Anonymous entity in the void',
    minVot: 0,
    level: 0,
    requirements: [],
  },
  'NETRUNNER': {
    name: 'NETRUNNER',
    color: '#8A63D2',
    glowColor: 'rgba(138, 99, 210, 0.4)',
    icon: '🔮',
    title: 'NETRUNNER.EXE',
    description: 'Identity verified on the grid',
    minVot: 0,
    level: 1,
    requirements: ['farcaster OR ens/basename'],
  },
  'CHROME_JOCKEY': {
    name: 'CHROME_JOCKEY',
    color: '#C0C0C0',
    glowColor: 'rgba(192, 192, 192, 0.5)',
    icon: '🎫',
    title: 'CHROME JOCKEY',
    description: 'Warplet NFT implant active',
    minVot: 0,
    level: 2,
    requirements: ['warplet_nft'],
  },
  'EDGE_LORD': {
    name: 'EDGE_LORD',
    color: '#00AAFF',
    glowColor: 'rgba(0, 170, 255, 0.4)',
    icon: '💎',
    title: 'EDGE LORD',
    description: 'MAXX staked in the system',
    minVot: 0,
    level: 3,
    requirements: ['maxx_holder'],
  },
  'VOID_WALKER': {
    name: 'VOID_WALKER',
    color: '#FF6600',
    glowColor: 'rgba(255, 102, 0, 0.5)',
    icon: '🟠',
    title: 'VOID WALKER',
    description: 'VOT accumulator 10K+',
    minVot: 10000,
    level: 4,
    requirements: ['vot >= 10000'],
  },
  'CIRCUIT_BREAKER': {
    name: 'CIRCUIT_BREAKER',
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    icon: '⚡',
    title: 'CIRCUIT BREAKER',
    description: 'Warplet + 100K VOT surge',
    minVot: 100000,
    level: 5,
    requirements: ['vot >= 100000', 'warplet_nft'],
  },
  'QUANTUM_GHOST': {
    name: 'QUANTUM_GHOST',
    color: '#FF0066',
    glowColor: 'rgba(255, 0, 102, 0.5)',
    icon: '🔥',
    title: 'QUANTUM GHOST',
    description: 'Farcaster + 500K VOT burn',
    minVot: 500000,
    level: 6,
    requirements: ['vot >= 500000', 'farcaster'],
  },
  'ZERO_DAY': {
    name: 'ZERO_DAY',
    color: '#00FFCC',
    glowColor: 'rgba(0, 255, 204, 0.6)',
    icon: '☢️',
    title: 'ZERO DAY EXPLOIT',
    description: '1M+ VOT with full credentials',
    minVot: 1000000,
    level: 7,
    requirements: ['vot >= 1000000', 'warplet_nft', 'farcaster', 'ens'],
  },
  'SINGULARITY': {
    name: 'SINGULARITY',
    color: '#FFFFFF',
    glowColor: 'rgba(255, 255, 255, 0.8)',
    icon: '🌌',
    title: 'S I N G U L A R I T Y',
    description: 'Top holder - Full convergence',
    minVot: 10000000,
    level: 8,
    requirements: ['vot >= 10000000', 'warplet_nft', 'farcaster', 'ens', 'maxx_holder'],
  },
};

/**
 * Calculate user rank based on holdings and credentials
 */
export function calculateRank(data: {
  votBalance?: string;
  maxxBalance?: string;
  hasWarplet?: boolean;
  hasFarcaster?: boolean;
  hasEns?: boolean;
  hasBasename?: boolean;
}): CyberpunkRank {
  const vot = parseFloat(data.votBalance || '0');
  const maxx = parseFloat(data.maxxBalance || '0');
  const hasIdentity = data.hasEns || data.hasBasename;
  
  // SINGULARITY - Top tier
  if (vot >= 10000000 && data.hasWarplet && data.hasFarcaster && hasIdentity && maxx > 0) {
    return 'SINGULARITY';
  }
  
  // ZERO_DAY - 1M+ VOT with all credentials
  if (vot >= 1000000 && data.hasWarplet && data.hasFarcaster && hasIdentity) {
    return 'ZERO_DAY';
  }
  
  // QUANTUM_GHOST - 500K+ VOT with Farcaster
  if (vot >= 500000 && data.hasFarcaster) {
    return 'QUANTUM_GHOST';
  }
  
  // CIRCUIT_BREAKER - 100K+ VOT with Warplet
  if (vot >= 100000 && data.hasWarplet) {
    return 'CIRCUIT_BREAKER';
  }
  
  // VOID_WALKER - 10K+ VOT
  if (vot >= 10000) {
    return 'VOID_WALKER';
  }
  
  // EDGE_LORD - Has MAXX
  if (maxx > 0) {
    return 'EDGE_LORD';
  }
  
  // CHROME_JOCKEY - Has Warplet NFT
  if (data.hasWarplet) {
    return 'CHROME_JOCKEY';
  }
  
  // NETRUNNER - Has identity (Farcaster OR ENS/Basename)
  if (data.hasFarcaster || hasIdentity) {
    return 'NETRUNNER';
  }
  
  // GHOST - Default
  return 'GHOST';
}

/**
 * Get the color for a given rank
 */
export function getRankColor(rank: CyberpunkRank): string {
  return RANK_CONFIG[rank]?.color || RANK_CONFIG['GHOST'].color;
}

/**
 * Get the glow color for a given rank
 */
export function getRankGlow(rank: CyberpunkRank): string {
  return RANK_CONFIG[rank]?.glowColor || RANK_CONFIG['GHOST'].glowColor;
}

/**
 * Generate cyberpunk rank badge SVG
 */
export function generateRankBadge(
  rank: CyberpunkRank,
  x: number = 0,
  y: number = 0,
  size: 'small' | 'medium' | 'large' = 'medium'
): string {
  const config = RANK_CONFIG[rank];
  const scale = { small: 0.6, medium: 1, large: 1.4 }[size];
  const w = 80 * scale;
  const h = 100 * scale;
  
  return `
    <g class="rank-badge" transform="translate(${x}, ${y})">
      <defs>
        <linearGradient id="rank-grad-${rank}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${config.color};stop-opacity:0.8"/>
          <stop offset="100%" style="stop-color:${config.color};stop-opacity:0.3"/>
        </linearGradient>
        <filter id="rank-glow-${rank}">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feFlood flood-color="${config.glowColor}" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Hexagonal Badge -->
      <g filter="url(#rank-glow-${rank})">
        <polygon 
          points="${w/2},0 ${w},${h*0.25} ${w},${h*0.75} ${w/2},${h} 0,${h*0.75} 0,${h*0.25}" 
          fill="url(#rank-grad-${rank})" 
          stroke="${config.color}" 
          stroke-width="2"
        >
          <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
        </polygon>
        
        <!-- Inner Border -->
        <polygon 
          points="${w/2},${h*0.08} ${w*0.92},${h*0.28} ${w*0.92},${h*0.72} ${w/2},${h*0.92} ${w*0.08},${h*0.72} ${w*0.08},${h*0.28}" 
          fill="#0A0A0A" 
          stroke="${config.color}" 
          stroke-width="1"
          stroke-opacity="0.5"
        />
      </g>
      
      <!-- Icon -->
      <text x="${w/2}" y="${h*0.4}" text-anchor="middle" font-size="${18*scale}">${config.icon}</text>
      
      <!-- Rank Name -->
      <text x="${w/2}" y="${h*0.62}" text-anchor="middle" fill="${config.color}" font-size="${8*scale}" font-weight="bold" font-family="'Share Tech Mono', monospace" letter-spacing="1">
        ${config.name}
      </text>
      
      <!-- Scan Line Effect -->
      <rect x="5" y="${h*0.7}" width="${w-10}" height="1" fill="${config.color}" opacity="0.5">
        <animate attributeName="y" values="${h*0.7};${h*0.85};${h*0.7}" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.5s" repeatCount="indefinite"/>
      </rect>
    </g>
  `;
}

/**
 * Generate NFT tier badge (DEPRECATED - use generateRankBadge instead)
 * @deprecated Use generateRankBadge with CyberpunkRank for new implementations
 */
export function generateTierBadge(
  tier: 'bronze' | 'silver' | 'gold' | 'diamond',
  x: number = 0,
  y: number = 0
): string {
  // Map old tiers to new cyberpunk ranks
  const tierToRank: Record<string, CyberpunkRank> = {
    bronze: 'GHOST',
    silver: 'VOID_WALKER',
    gold: 'CIRCUIT_BREAKER',
    diamond: 'ZERO_DAY',
  };
  return generateRankBadge(tierToRank[tier], x, y, 'medium');
}

/**
 * Generate Farcaster/Warpcast purple theme elements
 */
export function generateFarcasterElements(
  palette: ColorPalette,
  width: number = 400
): string {
  return `
    <g class="farcaster-elements">
      <!-- Farcaster Logo Background -->
      <circle cx="${width - 40}" cy="40" r="25" fill="#8A63D2" opacity="0.2"/>
      <text x="${width - 40}" y="47" text-anchor="middle" font-size="24">🟣</text>
      
      <!-- Cast indicator -->
      <g transform="translate(20, ${60})">
        <rect x="0" y="0" width="80" height="24" rx="12" fill="#8A63D2" opacity="0.3"/>
        <text x="40" y="16" text-anchor="middle" fill="#8A63D2" font-size="10" font-weight="bold">CASTER</text>
      </g>
    </g>
  `;
}

/**
 * Generate animated progress bar
 */
export function generateProgressBar(
  palette: ColorPalette,
  progress: number = 75,
  width: number = 200,
  label: string = 'Progress'
): string {
  const fillWidth = (progress / 100) * (width - 10);
  
  return `
    <g class="progress-bar">
      <text x="0" y="-5" fill="${palette.secondary}" font-size="10">${label}</text>
      <rect x="0" y="0" width="${width}" height="20" rx="10" fill="${palette.primary}" opacity="0.2"/>
      <rect x="5" y="5" width="${fillWidth}" height="10" rx="5" fill="${palette.accent}">
        <animate attributeName="width" from="0" to="${fillWidth}" dur="1s" fill="freeze"/>
      </rect>
      <text x="${width + 10}" y="15" fill="${palette.text}" font-size="12" font-weight="bold">${progress}%</text>
    </g>
  `;
}

/**
 * Generate token stats grid
 */
export function generateStatsGrid(
  palette: ColorPalette,
  stats: Array<{ label: string; value: string; icon?: string }>
): string {
  let grid = '<g class="stats-grid">';
  
  stats.forEach((stat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col * 180;
    const y = row * 70;
    
    grid += `
      <g transform="translate(${x}, ${y})">
        <rect x="0" y="0" width="160" height="60" rx="8" fill="${palette.primary}" opacity="0.1"/>
        <text x="15" y="25" fill="${palette.secondary}" font-size="10">${stat.icon || '📊'} ${stat.label}</text>
        <text x="15" y="48" fill="${palette.accent}" font-size="18" font-weight="bold">${stat.value}</text>
      </g>
    `;
  });
  
  grid += '</g>';
  return grid;
}

// Functions are exported inline with 'export function' declarations above

