/**
 * 🦖 BEEPER MACHINE NFT BANNER GENERATOR
 * 
 * Generates 900x240 animated SVG banners with:
 * - Center: Animated BEEPER dino (10 variants per rarity)
 * - Identity: ENS / Basename / Farcaster / FID (terminal style)
 * - Background: 10 unique animated backgrounds per rarity
 * - Hieroglyphics: 𒇻 𒁹 𒋼 𒄠 as rarity indicators
 * - VRF: Chainlink VRF for provably fair rarity
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface BeeperUserIdentity {
  address: string;
  ensName?: string;
  basename?: string;
  farcasterUsername?: string;
  fid?: number;
  tokenId: number;
}

export type BeeperRarity = 
  | 'node'      // 𒇻 - Common
  | 'validator' // 𒁹 - Uncommon  
  | 'staker'    // 𒋼 - Rare
  | 'whale'     // 𒄠 - Epic
  | 'og'        // 𒀭 - Legendary
  | 'genesis'   // 𒆳 - Mythic
  | 'zzz'       // 𒌋 - Ultra Rare
  | 'fomo'      // 𒀯 - Super Rare
  | 'gm'        // 𒆷 - Mega Rare
  | 'x402';     // 𒈗 - ASCENDED (rarest)

// ═══════════════════════════════════════════════════════════════════════════
// RARITY CONFIG - Hieroglyphics + Colors + Animation Speeds
// ═══════════════════════════════════════════════════════════════════════════

export const RARITY_CONFIG: Record<BeeperRarity, {
  glyph: string;
  glyphName: string;
  color: string;
  accent: string;
  bgGradient: [string, string];
  animSpeed: string;     // Animation duration
  glowIntensity: number; // 1-10
  particles: number;     // Background particles count
}> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // ALL RARITIES USE MATRIX GREEN (#77FE80) - NO OTHER COLORS
  // ═══════════════════════════════════════════════════════════════════════════
  node: {
    glyph: '𒇻',
    glyphName: 'DINGIR',
    color: '#77FE80',
    accent: '#5DE066',
    bgGradient: ['#050505', '#0a0f0a'],
    animSpeed: '4s',
    glowIntensity: 3,
    particles: 5,
  },
  validator: {
    glyph: '𒁹',
    glyphName: 'DIŠ',
    color: '#77FE80',
    accent: '#5DE066',
    bgGradient: ['#050505', '#0a0f0a'],
    animSpeed: '3.5s',
    glowIntensity: 4,
    particles: 8,
  },
  staker: {
    glyph: '𒋼',
    glyphName: 'TA',
    color: '#77FE80',
    accent: '#5DE066',
    bgGradient: ['#050505', '#0a0f0a'],
    animSpeed: '3s',
    glowIntensity: 5,
    particles: 12,
  },
  whale: {
    glyph: '𒄠',
    glyphName: 'AM',
    color: '#77FE80',
    accent: '#5DE066',
    bgGradient: ['#050505', '#0a0f0a'],
    animSpeed: '2.5s',
    glowIntensity: 6,
    particles: 15,
  },
  og: {
    glyph: '𒀭',
    glyphName: 'AN',
    color: '#77FE80',
    accent: '#5DE066',
    bgGradient: ['#050505', '#0a0f0a'],
    animSpeed: '2s',
    glowIntensity: 7,
    particles: 20,
  },
  genesis: {
    glyph: '𒆳',
    glyphName: 'KUR',
    color: '#77FE80',
    accent: '#5DE066',
    bgGradient: ['#050505', '#0a0f0a'],
    animSpeed: '1.8s',
    glowIntensity: 8,
    particles: 25,
  },
  zzz: {
    glyph: '𒌋',
    glyphName: 'U',
    color: '#77FE80',
    accent: '#5DE066',
    bgGradient: ['#050505', '#0a0f0a'],
    animSpeed: '5s', // Sleepy, slower
    glowIntensity: 5,
    particles: 10,
  },
  fomo: {
    glyph: '𒀯',
    glyphName: 'MUL',
    color: '#77FE80',
    accent: '#5DE066',
    bgGradient: ['#050505', '#0a0f0a'],
    animSpeed: '1.5s', // Energetic but not seizure-inducing
    glowIntensity: 9,
    particles: 30,
  },
  gm: {
    glyph: '𒆷',
    glyphName: 'LA',
    color: '#77FE80',
    accent: '#5DE066',
    bgGradient: ['#050505', '#0a0f0a'],
    animSpeed: '2s',
    glowIntensity: 7,
    particles: 18,
  },
  x402: {
    glyph: '𒈗',
    glyphName: 'LUGAL',
    color: '#77FE80',
    accent: '#5DE066',
    bgGradient: ['#050505', '#0a0f0a'],
    animSpeed: '1.5s', // Glitchy but controlled
    glowIntensity: 10,
    particles: 50,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// VRF RARITY ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * VRF-based rarity roll using Chainlink VRF seed
 * Probability distribution (must sum to 10000 = 100%):
 */
const RARITY_WEIGHTS: Record<BeeperRarity, number> = {
  node: 4500,      // 45.00%
  validator: 2500, // 25.00%
  staker: 1500,    // 15.00%
  whale: 800,      // 8.00%
  og: 400,         // 4.00%
  genesis: 200,    // 2.00%
  zzz: 50,         // 0.50%
  fomo: 30,        // 0.30%
  gm: 15,          // 0.15%
  x402: 5,         // 0.05%
};

export function rollRarityVRF(vrfSeed: bigint): BeeperRarity {
  // Use VRF seed to get a number 0-9999
  const roll = Number(vrfSeed % 10000n);
  
  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight;
    if (roll < cumulative) {
      return rarity as BeeperRarity;
    }
  }
  return 'node'; // Fallback
}

// Client-side pseudo-random for preview
export function rollRarityPreview(seed: string): BeeperRarity {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  const roll = Math.abs(hash) % 10000;
  
  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight;
    if (roll < cumulative) {
      return rarity as BeeperRarity;
    }
  }
  return 'node';
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED BACKGROUND GENERATORS (10 unique per rarity)
// ═══════════════════════════════════════════════════════════════════════════

function generateAnimatedBackground(rarity: BeeperRarity): string {
  const config = RARITY_CONFIG[rarity];
  const { color, accent, bgGradient, animSpeed, particles, glowIntensity } = config;
  
  // Generate floating particles
  const particleElements = Array.from({ length: particles }, (_, i) => {
    const x = Math.random() * 900;
    const y = Math.random() * 240;
    const size = 1 + Math.random() * 3;
    const delay = Math.random() * 5;
    const duration = 3 + Math.random() * 4;
    
    return `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" opacity="0.3">
      <animate attributeName="cy" values="${y};${y - 50};${y}" dur="${duration}s" begin="${delay}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.3;0.6;0.3" dur="${duration}s" begin="${delay}s" repeatCount="indefinite"/>
    </circle>`;
  }).join('\n    ');

  // Rarity-specific background effects
  const rarityEffects: Record<BeeperRarity, string> = {
    node: `<!-- Node: Subtle grid pulse -->
    <pattern id="nodeGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0 L0 0 0 40" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.1"/>
    </pattern>
    <rect width="900" height="240" fill="url(#nodeGrid)">
      <animate attributeName="opacity" values="0.3;0.5;0.3" dur="${animSpeed}" repeatCount="indefinite"/>
    </rect>`,
    
    validator: `<!-- Validator: Data streams -->
    <g opacity="0.2">
      ${Array.from({ length: 8 }, (_, i) => `
      <line x1="${100 + i * 100}" y1="0" x2="${100 + i * 100}" y2="240" stroke="${color}" stroke-width="1" stroke-dasharray="5 15">
        <animate attributeName="stroke-dashoffset" from="0" to="20" dur="${animSpeed}" repeatCount="indefinite"/>
      </line>`).join('')}
    </g>`,
    
    staker: `<!-- Staker: Pulsing rings -->
    <g transform="translate(450, 120)">
      ${Array.from({ length: 3 }, (_, i) => `
      <circle cx="0" cy="0" r="${80 + i * 40}" fill="none" stroke="${color}" stroke-width="1" opacity="${0.3 - i * 0.1}">
        <animate attributeName="r" values="${80 + i * 40};${90 + i * 40};${80 + i * 40}" dur="${animSpeed}" repeatCount="indefinite"/>
      </circle>`).join('')}
    </g>`,
    
    whale: `<!-- Whale: Ocean waves -->
    <g opacity="0.15">
      ${Array.from({ length: 4 }, (_, i) => `
      <path d="M-50 ${180 + i * 15} Q225 ${160 + i * 15} 450 ${180 + i * 15} T900 ${180 + i * 15}" fill="none" stroke="${color}" stroke-width="2">
        <animate attributeName="d" dur="${Number(animSpeed.replace('s', '')) + i}s" repeatCount="indefinite"
          values="M-50 ${180 + i * 15} Q225 ${160 + i * 15} 450 ${180 + i * 15} T900 ${180 + i * 15};
                  M-50 ${180 + i * 15} Q225 ${200 + i * 15} 450 ${180 + i * 15} T900 ${180 + i * 15};
                  M-50 ${180 + i * 15} Q225 ${160 + i * 15} 450 ${180 + i * 15} T900 ${180 + i * 15}"/>
      </path>`).join('')}
    </g>`,
    
    og: `<!-- OG: Golden rays -->
    <g transform="translate(450, 120)" opacity="0.2">
      ${Array.from({ length: 12 }, (_, i) => `
      <line x1="0" y1="0" x2="0" y2="-150" stroke="${color}" stroke-width="2" transform="rotate(${i * 30})">
        <animate attributeName="opacity" values="0.1;0.4;0.1" dur="${animSpeed}" begin="${i * 0.1}s" repeatCount="indefinite"/>
      </line>`).join('')}
    </g>`,
    
    genesis: `<!-- Genesis: Fire particles -->
    <g>
      ${Array.from({ length: 20 }, (_, i) => {
        const x = 50 + Math.random() * 800;
        return `
      <path d="M${x} 240 Q${x + 10} 200 ${x} 160" fill="none" stroke="${color}" stroke-width="2" opacity="0">
        <animate attributeName="opacity" values="0;0.5;0" dur="2s" begin="${i * 0.2}s" repeatCount="indefinite"/>
        <animate attributeName="d" dur="2s" begin="${i * 0.2}s" repeatCount="indefinite"
          values="M${x} 240 Q${x + 10} 200 ${x} 160;M${x} 200 Q${x - 10} 140 ${x + 5} 80;M${x} 240 Q${x + 10} 200 ${x} 160"/>
      </path>`;
      }).join('')}
    </g>`,
    
    zzz: `<!-- ZZZ: Floating Z's -->
    <g opacity="0.3" font-family="monospace" font-size="20" fill="${color}">
      ${Array.from({ length: 6 }, (_, i) => `
      <text x="${100 + i * 140}" y="50">
        Z<animate attributeName="y" values="50;30;50" dur="${5 + i}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.1;0.4;0.1" dur="${5 + i}s" repeatCount="indefinite"/>
      </text>`).join('')}
    </g>`,
    
    fomo: `<!-- FOMO: Rapid pulse -->
    <rect width="900" height="240" fill="${color}" opacity="0">
      <animate attributeName="opacity" values="0;0.1;0" dur="${animSpeed}" repeatCount="indefinite"/>
    </rect>
    <g stroke="${color}" stroke-width="2" opacity="0.3">
      ${Array.from({ length: 5 }, (_, i) => `
      <line x1="0" y1="${i * 60}" x2="900" y2="${i * 60}">
        <animate attributeName="opacity" values="0.1;0.5;0.1" dur="0.5s" begin="${i * 0.1}s" repeatCount="indefinite"/>
      </line>`).join('')}
    </g>`,
    
    gm: `<!-- GM: Sunrise gradient -->
    <defs>
      <radialGradient id="gmSun" cx="450" cy="200" r="300" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.3">
          <animate attributeName="stop-opacity" values="0.3;0.5;0.3" dur="${animSpeed}" repeatCount="indefinite"/>
        </stop>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="900" height="240" fill="url(#gmSun)"/>`,
    
    x402: `<!-- x402: GLITCH MATRIX -->
    <defs>
      <filter id="x402glitch">
        <feOffset in="SourceGraphic" dx="3" dy="0" result="r">
          <animate attributeName="dx" values="3;-3;0;3" dur="${animSpeed}" repeatCount="indefinite"/>
        </feOffset>
        <feOffset in="SourceGraphic" dx="-3" dy="0" result="b"/>
        <feColorMatrix in="r" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="rr"/>
        <feColorMatrix in="b" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="bb"/>
        <feBlend in="rr" in2="bb" mode="screen"/>
      </filter>
    </defs>
    <g filter="url(#x402glitch)" opacity="0.4">
      ${Array.from({ length: 30 }, (_, i) => {
        const y = Math.random() * 240;
        const w = 50 + Math.random() * 200;
        return `<rect x="${Math.random() * 900}" y="${y}" width="${w}" height="2" fill="${color}">
          <animate attributeName="x" values="${Math.random() * 900};${Math.random() * 900}" dur="0.3s" repeatCount="indefinite"/>
        </rect>`;
      }).join('')}
    </g>`,
  };

  return `
  <!-- Animated Background: ${rarity.toUpperCase()} -->
  <defs>
    <linearGradient id="bgGrad-${rarity}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradient[0]}"/>
      <stop offset="100%" stop-color="${bgGradient[1]}"/>
    </linearGradient>
    <filter id="glow-${rarity}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${glowIntensity}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  
  <!-- Base gradient -->
  <rect width="900" height="240" fill="url(#bgGrad-${rarity})" rx="8"/>
  
  <!-- Rarity-specific effect -->
  ${rarityEffects[rarity]}
  
  <!-- Floating particles -->
  <g class="particles">
    ${particleElements}
  </g>
  
  <!-- Scanlines -->
  <pattern id="scanlines-${rarity}" width="4" height="4" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="4" y2="0" stroke="${color}" stroke-width="0.3" opacity="0.05"/>
  </pattern>
  <rect width="900" height="240" fill="url(#scanlines-${rarity})" rx="8"/>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// TERMINAL-STYLE IDENTITY DISPLAY - Split LEFT & RIGHT of centered dino
// ═══════════════════════════════════════════════════════════════════════════

function generateTerminalIdentity(identity: BeeperUserIdentity, rarity: BeeperRarity): string {
  const config = RARITY_CONFIG[rarity];
  const { color, accent } = config;
  
  const shortAddr = `${identity.address.slice(0, 6)}...${identity.address.slice(-4)}`;
  
  // Build identity lines (terminal style)
  // LEFT SIDE: ENS + Basename  
  // RIGHT SIDE: Farcaster + FID + (Address ONLY if no ENS/Basename)
  
  const leftLines: Array<{ label: string; value: string; icon: string }> = [];
  const rightLines: Array<{ label: string; value: string; icon: string }> = [];
  
  // Check if user has a name identity
  const hasNameIdentity = identity.ensName || identity.basename;
  
  // RETRO ASCII ICONS - terminal style
  if (identity.ensName) {
    leftLines.push({ label: 'ENS', value: identity.ensName, icon: '>' });
  }
  if (identity.basename) {
    leftLines.push({ label: 'BASE', value: identity.basename, icon: '>' });
  }
  if (identity.farcasterUsername) {
    rightLines.push({ label: 'FC', value: `@${identity.farcasterUsername}`, icon: '>' });
  }
  if (identity.fid) {
    rightLines.push({ label: 'FID', value: `#${identity.fid}`, icon: '>' });
  }
  
  // ONLY show address if NO ENS or Basename exists
  if (!hasNameIdentity) {
    rightLines.push({ label: 'ADDR', value: shortAddr, icon: '>' });
  }

  const lineHeight = 24;
  
  // Left panel starts at x=35, right panel at x=700
  const leftStartY = 115 - ((leftLines.length - 1) * lineHeight) / 2;
  const rightStartY = 115 - ((rightLines.length - 1) * lineHeight) / 2;

  // RETRO TERMINAL STYLE - ASCII box drawing, CRT phosphor glow
  return `
  <!-- ═══ RETRO TERMINAL IDENTITY ═══ beep.works style -->
  <defs>
    <!-- PHOSPHOR GLOW - strong CRT effect -->
    <filter id="phosphorGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.5" result="glow"/>
      <feFlood flood-color="${color}" flood-opacity="0.7"/>
      <feComposite in2="glow" operator="in" result="colorGlow"/>
      <feMerge>
        <feMergeNode in="colorGlow"/>
        <feMergeNode in="colorGlow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- CRT FLICKER - subtle blink -->
    <filter id="crtFlicker">
      <feComponentTransfer>
        <feFuncA type="discrete" tableValues="0.92 1 0.96 1 0.94 1"/>
      </feComponentTransfer>
    </filter>
    
    <!-- SCANLINE OVERLAY -->
    <pattern id="crtLines" width="100%" height="3" patternUnits="userSpaceOnUse">
      <rect width="100%" height="1" fill="${color}" opacity="0.03"/>
      <rect y="2" width="100%" height="1" fill="transparent"/>
    </pattern>
    
    <!-- TEXT SHADOW - retro double shadow -->
    <filter id="textShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feOffset dx="1" dy="1" result="shadow"/>
      <feFlood flood-color="#000" flood-opacity="0.5"/>
      <feComposite in2="shadow" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- ┌─── LEFT PANEL ───┐ -->
  <g transform="translate(30, ${leftStartY})" filter="url(#crtFlicker)">
    <!-- ASCII BOX FRAME -->
    <text x="0" y="-18" font-family="'Courier New', monospace" font-size="10" fill="${accent}" opacity="0.5" letter-spacing="0">┌──────────────────────┐</text>
    <text x="0" y="${leftLines.length * lineHeight + 8}" font-family="'Courier New', monospace" font-size="10" fill="${accent}" opacity="0.5" letter-spacing="0">└──────────────────────┘</text>
    
    ${leftLines.length > 0 ? leftLines.map((line, i) => `
    <!-- ${line.label} LINE -->
    <g transform="translate(0, ${i * lineHeight})">
      <!-- PROMPT: > -->
      <text x="8" y="0" font-family="'Courier New', monospace" font-size="13" fill="${color}" filter="url(#phosphorGlow)">${line.icon}</text>
      
      <!-- LABEL: uppercase, dimmer -->
      <text x="22" y="0" font-family="'Courier New', monospace" font-size="10" fill="${accent}" opacity="0.6" letter-spacing="1" filter="url(#textShadow)">${line.label}:</text>
      
      <!-- VALUE: bright phosphor green -->
      <text x="55" y="0" font-family="'Courier New', monospace" font-size="13" fill="${color}" font-weight="normal" filter="url(#phosphorGlow)" letter-spacing="0.5">${line.value}</text>
    </g>`).join('') : `
    <!-- NULL STATE -->
    <text x="8" y="0" font-family="'Courier New', monospace" font-size="11" fill="${accent}" opacity="0.3" letter-spacing="1">> NULL</text>`}
  </g>
  
  <!-- ┌─── RIGHT PANEL ───┐ -->
  <g transform="translate(685, ${rightStartY})" filter="url(#crtFlicker)">
    <!-- ASCII BOX FRAME -->
    <text x="0" y="-18" font-family="'Courier New', monospace" font-size="10" fill="${accent}" opacity="0.5" letter-spacing="0">┌────────────────────┐</text>
    <text x="0" y="${rightLines.length * lineHeight + 8}" font-family="'Courier New', monospace" font-size="10" fill="${accent}" opacity="0.5" letter-spacing="0">└────────────────────┘</text>
    
    ${rightLines.map((line, i) => `
    <!-- ${line.label} LINE -->
    <g transform="translate(0, ${i * lineHeight})">
      <!-- PROMPT: > -->
      <text x="8" y="0" font-family="'Courier New', monospace" font-size="13" fill="${color}" filter="url(#phosphorGlow)">${line.icon}</text>
      
      <!-- LABEL: uppercase, dimmer -->
      <text x="22" y="0" font-family="'Courier New', monospace" font-size="10" fill="${accent}" opacity="0.6" letter-spacing="1" filter="url(#textShadow)">${line.label}:</text>
      
      <!-- VALUE: bright phosphor green -->
      <text x="52" y="0" font-family="'Courier New', monospace" font-size="13" fill="${color}" font-weight="normal" filter="url(#phosphorGlow)" letter-spacing="0.5">${line.value}</text>
    </g>`).join('')}
    
    <!-- BLINKING BLOCK CURSOR ▌ -->
    <rect x="${52 + Math.max(...(rightLines.length > 0 ? rightLines.map(l => l.value.length) : [4])) * 7.8 + 4}" y="${(Math.max(rightLines.length - 1, 0)) * lineHeight - 11}" width="8" height="14" fill="${color}">
      <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" calcMode="discrete"/>
    </rect>
  </g>
  
  <!-- SCANLINE OVERLAY - CRT effect -->
  <rect x="30" y="${leftStartY - 25}" width="200" height="${leftLines.length * lineHeight + 40}" fill="url(#crtLines)" opacity="0.5"/>
  <rect x="685" y="${rightStartY - 25}" width="190" height="${rightLines.length * lineHeight + 40}" fill="url(#crtLines)" opacity="0.5"/>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// HIEROGLYPHICS RARITY DISPLAY
// ═══════════════════════════════════════════════════════════════════════════

function generateHieroglyphicsDisplay(rarity: BeeperRarity): string {
  const config = RARITY_CONFIG[rarity];
  const { glyph, color, animSpeed, accent } = config;
  
  // All glyphs for display
  const allGlyphs = ['𒇻', '𒁹', '𒋼', '𒄠', '𒀭', '𒆳', '𒌋', '𒀯', '𒆷', '𒈗'];
  const rarityIndex = Object.keys(RARITY_CONFIG).indexOf(rarity);
  
  return `
  <!-- ═══ HIEROGLYPHICS RARITY DISPLAY - RETRO TERMINAL STYLE ═══ -->
  <g transform="translate(450, 220)">
    <!-- ASCII FRAME -->
    <text x="0" y="-15" text-anchor="middle" font-family="'Courier New', monospace" font-size="8" fill="${accent}" opacity="0.3" letter-spacing="0">├────────────────────────────────────────┤</text>
    
    <!-- RARITY LABEL -->
    <text x="-180" y="3" font-family="'Courier New', monospace" font-size="9" fill="${accent}" opacity="0.5" letter-spacing="1">TIER:</text>
    
    <!-- All glyphs in row - inactive dim, active bright -->
    <g font-size="12" text-anchor="middle">
      ${allGlyphs.map((g, i) => `
      <text x="${(i - 4.5) * 20}" y="3" fill="${i === rarityIndex ? color : '#333'}" opacity="${i === rarityIndex ? '1' : '0.3'}" ${i === rarityIndex ? `filter="url(#glow-${rarity})"` : ''}>${g}</text>`).join('')}
    </g>
    
    <!-- ACTIVE GLYPH HIGHLIGHT - pulsing -->
    <text x="${(rarityIndex - 4.5) * 20}" y="3" font-size="14" fill="${color}" text-anchor="middle" filter="url(#glow-${rarity})">
      ${glyph}
      <animate attributeName="opacity" values="1;0.7;1" dur="${animSpeed}" repeatCount="indefinite"/>
    </text>
    
    <!-- RARITY NAME - bottom right -->
    <text x="180" y="3" font-family="'Courier New', monospace" font-size="9" fill="${color}" opacity="0.7" letter-spacing="1" text-anchor="end">[${rarity.toUpperCase()}]</text>
  </g>
  
  <!-- CORNER GLYPHS - retro frame style -->
  <text x="15" y="18" font-size="12" fill="${color}" opacity="0.4">${glyph}</text>
  <text x="885" y="18" font-size="12" fill="${color}" opacity="0.4" text-anchor="end">${glyph}</text>
  <text x="15" y="232" font-size="12" fill="${color}" opacity="0.4">${glyph}</text>
  <text x="885" y="232" font-size="12" fill="${color}" opacity="0.4" text-anchor="end">${glyph}</text>
  
  <!-- CORNER ASCII DECORATIONS -->
  <text x="28" y="18" font-family="'Courier New', monospace" font-size="8" fill="${accent}" opacity="0.25">──┐</text>
  <text x="857" y="18" font-family="'Courier New', monospace" font-size="8" fill="${accent}" opacity="0.25" text-anchor="end">┌──</text>
  <text x="28" y="232" font-family="'Courier New', monospace" font-size="8" fill="${accent}" opacity="0.25">──┘</text>
  <text x="857" y="232" font-family="'Courier New', monospace" font-size="8" fill="${accent}" opacity="0.25" text-anchor="end">└──</text>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// BEEPER DINO EMBED (Reference to external animated SVG) - CENTERED
// ═══════════════════════════════════════════════════════════════════════════

function generateDinoEmbed(rarity: BeeperRarity, tokenId: number): string {
  const config = RARITY_CONFIG[rarity];
  const { color, animSpeed, accent } = config;
  
  // DINO IS NOW CENTERED AT 450, 115 (middle of 900x240 banner)
  return `
  <!-- ═══ BEEPER DINO AVATAR - CENTERED ═══ -->
  <g transform="translate(450, 115)">
    <!-- OUTER SCANNER RING - retro radar style -->
    <circle cx="0" cy="0" r="88" fill="none" stroke="${color}" stroke-width="1" opacity="0.3" stroke-dasharray="4 8">
      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="30s" repeatCount="indefinite"/>
    </circle>
    
    <!-- PULSE RING -->
    <circle cx="0" cy="0" r="82" fill="none" stroke="${color}" stroke-width="2" opacity="0.4" filter="url(#glow-${rarity})">
      <animate attributeName="r" values="82;88;82" dur="${animSpeed}" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0.6;0.4" dur="${animSpeed}" repeatCount="indefinite"/>
    </circle>
    
    <!-- INNER ROTATING DASHES -->
    <circle cx="0" cy="0" r="78" fill="none" stroke="${color}" stroke-width="1" opacity="0.5" stroke-dasharray="15 8">
      <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="25s" repeatCount="indefinite"/>
    </circle>
    
    <!-- CONTAINER - dark green tint (NO BLACK SQUARE) -->
    <circle cx="0" cy="0" r="72" fill="rgba(5,15,5,0.9)" stroke="${color}" stroke-width="0.5" opacity="0.95"/>
    
    <!-- Reference to external animated dino SVG -->
    <image href="/social/beeper-dinos/beeper-${rarity}.svg" x="-62" y="-62" width="124" height="124"/>
    
    <!-- TOKEN ID BADGE - retro terminal style -->
    <g transform="translate(0, 90)">
      <!-- Badge background -->
      <rect x="-38" y="-12" width="76" height="22" fill="#000" stroke="${color}" stroke-width="1" rx="2"/>
      
      <!-- Badge text with phosphor glow -->
      <text x="0" y="4" text-anchor="middle" font-family="'Courier New', monospace" font-size="12" fill="${color}" letter-spacing="1">
        #${String(tokenId).padStart(4, '0')}
      </text>
    </g>
    
    <!-- SCANNING LINE - retro CRT effect -->
    <line x1="-70" y1="0" x2="70" y2="0" stroke="${color}" stroke-width="1" opacity="0">
      <animate attributeName="y1" values="-70;70;-70" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="-70;70;-70" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0.3;0" dur="3s" repeatCount="indefinite"/>
    </line>
  </g>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN BANNER GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export function generateBeeperBanner(
  identity: BeeperUserIdentity,
  rarity: BeeperRarity
): string {
  const config = RARITY_CONFIG[rarity];
  const { color, accent } = config;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 240" width="900" height="240">
  ${generateAnimatedBackground(rarity)}
  
  <!-- ═══ RETRO TERMINAL BORDER FRAME ═══ -->
  <!-- Main border - double line effect -->
  <rect x="4" y="4" width="892" height="232" fill="none" stroke="${color}" stroke-width="1" rx="3" opacity="0.7"/>
  <rect x="7" y="7" width="886" height="226" fill="none" stroke="${color}" stroke-width="0.5" rx="2" opacity="0.3"/>
  
  <!-- Pulsing outer glow -->
  <rect x="2" y="2" width="896" height="236" fill="none" stroke="${color}" stroke-width="1" rx="4" opacity="0.2">
    <animate attributeName="opacity" values="0.2;0.4;0.2" dur="${config.animSpeed}" repeatCount="indefinite"/>
  </rect>
  
  <!-- CORNER BRACKETS - ASCII terminal style -->
  <g font-family="'Courier New', monospace" font-size="16" fill="${accent}" opacity="0.6">
    <!-- Top Left -->
    <text x="8" y="20">┌</text>
    <text x="20" y="14">─</text>
    <text x="12" y="30">│</text>
    
    <!-- Top Right -->
    <text x="884" y="20">┐</text>
    <text x="872" y="14">─</text>
    <text x="888" y="30">│</text>
    
    <!-- Bottom Left -->
    <text x="8" y="232">└</text>
    <text x="20" y="238">─</text>
    <text x="12" y="220">│</text>
    
    <!-- Bottom Right -->
    <text x="884" y="232">┘</text>
    <text x="872" y="238">─</text>
    <text x="888" y="220">│</text>
  </g>
  
  ${generateDinoEmbed(rarity, identity.tokenId)}
  
  ${generateTerminalIdentity(identity, rarity)}
  
  ${generateHieroglyphicsDisplay(rarity)}
  
  <!-- x402 V2 VOT BEEPER AI - RETRO ASCII HEADER -->
  <defs>
    <filter id="titlePhosphor" x="-30%" y="-50%" width="160%" height="200%">
      <feGaussianBlur stdDeviation="2" result="glow"/>
      <feFlood flood-color="${color}" flood-opacity="0.9"/>
      <feComposite in2="glow" operator="in" result="colorGlow"/>
      <feMerge>
        <feMergeNode in="colorGlow"/>
        <feMergeNode in="colorGlow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- ASCII ART HEADER BAR -->
  <g transform="translate(450, 20)">
    <!-- TOP BORDER LINE - ASCII style -->
    <text x="0" y="-5" text-anchor="middle" font-family="'Courier New', monospace" font-size="8" fill="${accent}" opacity="0.4" letter-spacing="0">════════════════════════════════════════</text>
    
    <!-- TITLE with phosphor glow -->
    <text x="0" y="8" text-anchor="middle" font-family="'Courier New', monospace" font-size="12" fill="${color}" filter="url(#titlePhosphor)" letter-spacing="3">
      [ x402 V2 · VOT BEEPER AI ]
    </text>
    
    <!-- SUBTITLE - system status style -->
    <text x="0" y="20" text-anchor="middle" font-family="'Courier New', monospace" font-size="7" fill="${accent}" opacity="0.5" letter-spacing="2">
      SYS.ACTIVE | VRF.READY | CHAIN:BASE
    </text>
  </g>
</svg>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// METADATA GENERATOR (for OpenSea)
// ═══════════════════════════════════════════════════════════════════════════

export function generateBeeperMetadata(
  identity: BeeperUserIdentity,
  rarity: BeeperRarity,
  imageCID: string
) {
  const config = RARITY_CONFIG[rarity];
  
  return {
    name: `BEEPER #${identity.tokenId}`,
    description: `BEEPER MACHINE NFT - ${config.glyphName} (${config.glyph}) Rarity. Minted via x402 VOT Facilitator on Base.`,
    image: `ipfs://${imageCID}`,
    animation_url: `ipfs://${imageCID}`,
    external_url: `https://mcpvot.xyz/beeper/${identity.tokenId}`,
    attributes: [
      { trait_type: 'Rarity', value: rarity.charAt(0).toUpperCase() + rarity.slice(1) },
      { trait_type: 'Glyph', value: config.glyph },
      { trait_type: 'Glyph Name', value: config.glyphName },
      ...(identity.ensName ? [{ trait_type: 'ENS', value: identity.ensName }] : []),
      ...(identity.basename ? [{ trait_type: 'Basename', value: identity.basename }] : []),
      ...(identity.farcasterUsername ? [{ trait_type: 'Farcaster', value: `@${identity.farcasterUsername}` }] : []),
      ...(identity.fid ? [{ trait_type: 'FID', value: identity.fid.toString() }] : []),
      { trait_type: 'Network', value: 'Base' },
      { trait_type: 'Standard', value: 'ERC-1155' },
    ],
  };
}

const beeperBannerExports = {
  generateBeeperBanner,
  generateBeeperMetadata,
  rollRarityVRF,
  rollRarityPreview,
  RARITY_CONFIG,
};

export default beeperBannerExports;
