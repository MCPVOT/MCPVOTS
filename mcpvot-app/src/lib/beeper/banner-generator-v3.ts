/**
 * Beeper Banner Generator V3 - IMPROVED
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  BEST OF BOTH WORLDS - Combined from:                                    ║
 * ║  • x402-v2-vot-machine-dino-center.html (layout, dino, typing)           ║
 * ║  • preview-your-beeper-banner.html (radar, circuits, effects)            ║
 * ║                                                                          ║
 * ║  Layout:                                                                 ║
 * ║  ┌─────────────────────────────────────────────────────────────────────┐ ║
 * ║  │ [BEEP.WORKS]          BEEPER MACHINE              [x402 V2]         │ ║
 * ║  │                                                                     │ ║
 * ║  │ ◇ ENS: name.eth                           ◎ FC: @username          │ ║
 * ║  │ ◆ BASE: name.base.eth      [DINO]         ▢ FID: #123456           │ ║
 * ║  │                            #0001          ▣ ADDR: 0x...            │ ║
 * ║  │                                                                     │ ║
 * ║  │ [VOT]              𒇻 𒁹 𒋼 𒄠 𒀭 𒆳 𒌋 𒀯 𒆷 𒈗              [RADAR] │ ║
 * ║  └─────────────────────────────────────────────────────────────────────┘ ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// Re-export types from main banner-generator
export type { BeeperBannerOptions, BeeperUserData, DinoRarity } from './banner-generator';

// Import what we need from main module
import type { BeeperBannerOptions, BeeperUserData, DinoRarity } from './banner-generator';
import { RARITY_DISPLAY } from './banner-generator';

// Contract address for OpenSea links
const BEEPER_CONTRACT = '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9';

// VOT Hieroglyphics - Sumerian Cuneiform
const VOT_GLYPHS: Record<DinoRarity, { glyph: string; name: string }> = {
  node:      { glyph: '𒇻', name: 'DINGIR' },
  validator: { glyph: '𒁹', name: 'DIŠ' },
  staker:    { glyph: '𒋼', name: 'TA' },
  whale:     { glyph: '𒄠', name: 'AM' },
  og:        { glyph: '𒀭', name: 'AN' },
  genesis:   { glyph: '𒆳', name: 'KUR' },
  zzz:       { glyph: '𒌋', name: 'U' },
  fomo:      { glyph: '𒀯', name: 'MUL' },
  gm:        { glyph: '𒆷', name: 'LA' },
  x402:      { glyph: '𒈗', name: 'LUGAL' },
};

// DINO COLOR IS ALWAYS GREEN - VOT Brand Color
const DINO_COLOR = '#77FE80';
const DINO_COLOR_DARK = '#4CAF50';

// Rarity-specific settings - accent colors, background patterns, animation speeds
// NOTE: Dino itself is ALWAYS green, these are for UI accents only!
const RARITY_CONFIG: Record<DinoRarity, { 
  color: string;      // Accent color for UI elements
  bg: string;         // Background color
  animSpeed: number;  // Animation speed (lower = faster)
  bgPattern: string;  // Background pattern type
}> = {
  node:      { color: '#77FE80', bg: '#060606', animSpeed: 4, bgPattern: 'circuit' },
  validator: { color: '#77FE80', bg: '#050805', animSpeed: 3.5, bgPattern: 'circuit-dense' },
  staker:    { color: '#77FE80', bg: '#040804', animSpeed: 3, bgPattern: 'hex' },
  whale:     { color: '#77FE80', bg: '#050a05', animSpeed: 2.5, bgPattern: 'wave' },
  og:        { color: '#FFD700', bg: '#060b06', animSpeed: 2, bgPattern: 'matrix' },
  genesis:   { color: '#FF6B6B', bg: '#070c07', animSpeed: 1.8, bgPattern: 'fire' },
  zzz:       { color: '#9B59B6', bg: '#050508', animSpeed: 5, bgPattern: 'stars' },
  fomo:      { color: '#E74C3C', bg: '#080505', animSpeed: 0.8, bgPattern: 'glitch' },
  gm:        { color: '#F39C12', bg: '#080806', animSpeed: 2, bgPattern: 'sunrise' },
  x402:      { color: '#00FFFF', bg: '#050505', animSpeed: 0.3, bgPattern: 'cyber' },
};

/**
 * Generate the Beeper Dino SVG (large, centered, animated)
 * DINO IS ALWAYS GREEN - VOT Brand Color #77FE80
 */
function generateDinoSvg(rarity: DinoRarity): string {
  const config = RARITY_CONFIG[rarity];
  const speed = config.animSpeed;
  const isGlitchy = rarity === 'x402' || rarity === 'fomo';
  
  const glitchFilter = isGlitchy ? `
    <filter id="dinoGlitch">
      <feOffset in="SourceGraphic" dx="2" dy="0" result="red">
        <animate attributeName="dx" values="2;-2;0;2" dur="${speed}s" repeatCount="indefinite"/>
      </feOffset>
      <feOffset in="SourceGraphic" dx="-2" dy="0" result="blue"/>
      <feColorMatrix in="red" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="rr"/>
      <feColorMatrix in="blue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="bb"/>
      <feBlend in="rr" in2="bb" mode="screen"/>
    </filter>` : '';
  
  const dinoFilter = isGlitchy ? 'filter="url(#dinoGlitch)"' : 'filter="url(#dinoGlow)"';
  
  // DINO IS ALWAYS GREEN - VOT Brand!
  return `
  <defs>
    <linearGradient id="dinoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${DINO_COLOR}"/>
      <stop offset="100%" stop-color="${DINO_COLOR_DARK}"/>
    </linearGradient>
    <filter id="dinoGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    ${glitchFilter}
  </defs>
  
  <!-- Outer glow ring - uses accent color -->
  <circle cx="0" cy="0" r="85" fill="none" stroke="${config.color}" stroke-width="1" opacity="0.15">
    <animate attributeName="r" values="85;90;85" dur="${speed}s" repeatCount="indefinite"/>
  </circle>
  
  <!-- Rotating dashed ring -->
  <circle cx="0" cy="0" r="78" fill="none" stroke="${DINO_COLOR}" stroke-width="0.5" stroke-dasharray="8 12" opacity="0.2">
    <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="${speed * 5}s" repeatCount="indefinite"/>
  </circle>
  
  <!-- Inner circle bg -->
  <circle cx="0" cy="0" r="70" fill="${config.bg}" stroke="${config.color}" stroke-width="2" opacity="0.95">
    <animate attributeName="opacity" values="0.95;1;0.95" dur="${speed}s" repeatCount="indefinite"/>
  </circle>
  
  <!-- BEEPER DINO HEAD - LARGE & ANIMATED - ALWAYS GREEN! -->
  <g ${dinoFilter} transform="scale(1.2)">
    <animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="${speed}s" repeatCount="indefinite" additive="sum"/>
    
    <!-- Main head -->
    <path d="M-30,-26 C-34,-38 -17,-48 13,-48 C38,-46 56,-30 59,-8 C60,8 52,26 35,30 C13,35 -17,30 -30,17 C-38,5 -36,-13 -30,-26 Z" fill="url(#dinoGrad)"/>
    
    <!-- Snout -->
    <ellipse cx="48" cy="-13" rx="13" ry="17" fill="url(#dinoGrad)"/>
    
    <!-- Eye socket -->
    <ellipse cx="-5" cy="-17" rx="17" ry="13" fill="#020202"/>
    
    <!-- Eye - ALWAYS GREEN -->
    <ellipse cx="-5" cy="-17" rx="12" ry="10" fill="${DINO_COLOR}">
      <animate attributeName="fill" values="${DINO_COLOR};#aaffaa;${DINO_COLOR}" dur="${speed * 0.8}s" repeatCount="indefinite"/>
    </ellipse>
    
    <!-- Pupil -->
    <ellipse cx="-5" cy="-17" rx="5" ry="8" fill="#020202">
      <animate attributeName="rx" values="5;2;5" dur="${speed * 1.2}s" repeatCount="indefinite"/>
    </ellipse>
    
    <!-- Eye shine -->
    <circle cx="-9" cy="-21" r="3" fill="#fff" opacity="0.9"/>
    
    <!-- Blink overlay -->
    <ellipse cx="-5" cy="-17" rx="13" ry="11" fill="url(#dinoGrad)" opacity="0">
      <animate attributeName="opacity" values="0;0;0;1;0" dur="${speed * 1.5}s" keyTimes="0;0.9;0.93;0.96;1" repeatCount="indefinite"/>
    </ellipse>
    
    <!-- Nostril -->
    <ellipse cx="50" cy="-7" rx="4" ry="3" fill="#020202"/>
    
    <!-- Steam from nostril - ALWAYS GREEN -->
    <circle cx="56" cy="-10" r="2" fill="${DINO_COLOR}" opacity="0">
      <animate attributeName="opacity" values="0;0.5;0" dur="${speed}s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="-10;-20;-10" dur="${speed}s" repeatCount="indefinite"/>
    </circle>
    
    <!-- Jaw -->
    <path d="M17,17 Q38,24 56,13" fill="none" stroke="#3a8a3f" stroke-width="2"/>
    
    <!-- Teeth -->
    <path d="M26,10 L28,19 L30,10 M36,7 L38,18 L40,7 M46,5 L48,14 L50,5" fill="#fff" stroke="#e8e8e8" stroke-width="1"/>
    
    <!-- Spikes -->
    <polygon points="-16,-46 -11,-60 -6,-46" fill="url(#dinoGrad)">
      <animateTransform attributeName="transform" type="scale" values="1;1.15;1" dur="${speed * 0.7}s" repeatCount="indefinite"/>
    </polygon>
    <polygon points="0,-48 5,-60 10,-48" fill="url(#dinoGrad)">
      <animateTransform attributeName="transform" type="scale" values="1;1.15;1" dur="${speed * 0.7}s" begin="0.1s" repeatCount="indefinite"/>
    </polygon>
    <polygon points="14,-46 19,-57 24,-46" fill="url(#dinoGrad)">
      <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="${speed * 0.7}s" begin="0.2s" repeatCount="indefinite"/>
    </polygon>
  </g>`;
}

/**
 * Generate simple background - MINIMAL for gas optimization
 */
function generateBackground(rarity: DinoRarity, width: number, height: number): string {
  const config = RARITY_CONFIG[rarity];
  
  // Simple circuit pattern - same for all rarities to save gas
  return `
  <!-- Base background -->
  <rect width="${width}" height="${height}" fill="${config.bg}"/>
  
  <!-- Simple circuit pattern -->
  <defs>
    <pattern id="bgPattern" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M10 10 L30 10 L30 30 M50 10 L70 10 M10 50 L30 50 M50 50 L70 50 L70 70" 
            stroke="${DINO_COLOR}" stroke-width="0.3" fill="none" opacity="0.08"/>
    </pattern>
  </defs>
  
  <rect width="${width}" height="${height}" fill="url(#bgPattern)"/>`;
}

/**
 * Generate retro terminal text - STATIC (no typing animation to save gas)
 */
function generateRetroText(
  text: string, 
  x: number, 
  y: number, 
  fontSize: number, 
  color: string, 
  anchor: 'start' | 'middle' | 'end' = 'start'
): string {
  return `<text x="${x}" y="${y}" font-family="'VT323', 'Press Start 2P', monospace" font-size="${fontSize}" fill="${color}" text-anchor="${anchor}" opacity="0.9">${text}</text>`;
}

/**
 * Generate VOT hieroglyphics bar - simplified to just show active rarity
 */
function generateHieroglyphicsBar(rarity: DinoRarity, x: number, y: number): string {
  const config = RARITY_CONFIG[rarity];
  const allRarities: DinoRarity[] = ['node', 'validator', 'staker', 'whale', 'og', 'genesis', 'zzz', 'fomo', 'gm', 'x402'];
  const activeIdx = allRarities.indexOf(rarity);
  
  return allRarities.map((r, i) => {
    const glyphX = x + (i - 4.5) * 22;
    const isActive = i === activeIdx;
    const glyph = VOT_GLYPHS[r].glyph;
    
    return `
    <text x="${glyphX}" y="${y}" 
          font-size="${isActive ? 16 : 11}" 
          fill="${isActive ? config.color : '#2a3a2a'}" 
          text-anchor="middle"
          opacity="${isActive ? 1 : 0.4}">
      ${glyph}
      ${isActive ? `<animate attributeName="font-size" values="16;20;16" dur="${config.animSpeed}s" repeatCount="indefinite"/>` : ''}
    </text>`;
  }).join('');
}

/**
 * Generate the complete improved banner
 */
export function generateBeeperBannerV3(
  userData: BeeperUserData,
  options: BeeperBannerOptions = {}
): string {
  const {
    width = 900,
    height = 240,
    rarity = 'node',
  } = options;

  const config = RARITY_CONFIG[rarity];
  const speed = config.animSpeed;
  
  // Identity values
  const ensName = userData.ensName || '';
  const basename = userData.basename || '';
  const fcUsername = userData.farcasterUsername || '';
  const fid = userData.fid || 0;
  const address = userData.address || '';
  const tokenId = userData.tokenId ? `#${String(userData.tokenId).padStart(4, '0')}` : '#----';
  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  
  // Only show address if NO ENS and NO Basename
  const showAddress = !ensName && !basename;
  
  const rarityLabel = RARITY_DISPLAY[rarity];
  const rarityGlyph = VOT_GLYPHS[rarity].glyph;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- BACKGROUND -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  ${generateBackground(rarity, width, height)}
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- BORDER FRAME -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <rect x="3" y="3" width="${width - 6}" height="${height - 6}" fill="none" stroke="${config.color}" stroke-width="1.5" rx="6" opacity="0.4">
    <animate attributeName="opacity" values="0.4;0.6;0.4" dur="${speed}s" repeatCount="indefinite"/>
  </rect>
  
  <!-- Corner brackets -->
  <path d="M15 3 L3 3 L3 15" stroke="${config.color}" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M${width - 15} 3 L${width - 3} 3 L${width - 3} 15" stroke="${config.color}" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M15 ${height - 3} L3 ${height - 3} L3 ${height - 15}" stroke="${config.color}" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M${width - 15} ${height - 3} L${width - 3} ${height - 3} L${width - 3} ${height - 15}" stroke="${config.color}" stroke-width="2" fill="none" opacity="0.6"/>
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- TOP LEFT: BEEP.WORKS LINK -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <a xlink:href="https://beep.works/" target="_blank">
    <g transform="translate(20, 18)">
      <!-- Small pixel dino icon -->
      <rect x="0" y="0" width="4" height="4" fill="${config.color}" opacity="0.8"/>
      <rect x="4" y="0" width="4" height="4" fill="${config.color}" opacity="0.8"/>
      <rect x="0" y="4" width="4" height="4" fill="${config.color}" opacity="0.8"/>
      <rect x="4" y="4" width="4" height="4" fill="${config.color}" opacity="0.8"/>
      <rect x="8" y="4" width="4" height="4" fill="${config.color}" opacity="0.8"/>
      <rect x="0" y="8" width="4" height="4" fill="${config.color}" opacity="0.8"/>
      <!-- Eye -->
      <rect x="4" y="2" width="2" height="2" fill="${config.bg}"/>
      
      <text x="18" y="10" font-family="'VT323', 'Courier New', monospace" font-size="8" fill="${config.color}" opacity="0.5" letter-spacing="1">BEEP.WORKS</text>
    </g>
  </a>
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- TOP CENTER: BEEPER MACHINE TITLE -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <g transform="translate(${width / 2}, 22)">
    ${generateRetroText('B E E P E R   M A C H I N E', 0, 0, 12, config.color, 'middle')}
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- TOP RIGHT: x402 V2 BRANDING -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <g transform="translate(${width - 80}, 18)">
    <text x="0" y="0" font-family="'VT323', 'Courier New', monospace" font-size="14" fill="${config.color}" opacity="0.7" letter-spacing="2">x402</text>
    <text x="45" y="0" font-family="'VT323', 'Courier New', monospace" font-size="9" fill="${config.color}" opacity="0.5">V2</text>
    <rect x="0" y="4" width="60" height="1" fill="${config.color}" opacity="0.3">
      <animate attributeName="width" values="60;45;60" dur="0.2s" repeatCount="indefinite"/>
    </rect>
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- LEFT SIDE: ENS + BASENAME -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <g transform="translate(25, 70)">
    <!-- ENS -->
    <text x="0" y="0" font-family="'VT323', monospace" font-size="8" fill="${config.color}" opacity="0.5">◇ ENS:</text>
    ${ensName ? generateRetroText(ensName, 45, 0, 11, config.color, 'start') : `
    <text x="45" y="0" font-family="'VT323', monospace" font-size="11" fill="${config.color}" opacity="0.3">—</text>`}
    
    <!-- Basename -->
    <text x="0" y="28" font-family="'VT323', monospace" font-size="8" fill="${config.color}" opacity="0.5">◆ BASE:</text>
    ${basename ? generateRetroText(basename, 50, 28, 11, config.color, 'start') : `
    <text x="50" y="28" font-family="'VT323', monospace" font-size="11" fill="${config.color}" opacity="0.3">—</text>`}
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- RIGHT SIDE: FC + FID + ADDR -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <g transform="translate(${width - 25}, 55)">
    <!-- Farcaster -->
    <text x="0" y="0" text-anchor="end" font-family="'VT323', monospace" font-size="8" fill="${config.color}" opacity="0.5">◎ FC:</text>
    ${fcUsername ? generateRetroText('@' + fcUsername, -45, 0, 11, config.color, 'end') : ''}
    
    <!-- FID -->
    <text x="0" y="26" text-anchor="end" font-family="'VT323', monospace" font-size="8" fill="${config.color}" opacity="0.5">▢ FID:</text>
    ${fid ? generateRetroText('#' + String(fid), -40, 26, 12, config.color, 'end') : ''}
    
    <!-- Address (only if no ENS/Basename) -->
    ${showAddress ? `
    <text x="0" y="52" text-anchor="end" font-family="'VT323', monospace" font-size="8" fill="${config.color}" opacity="0.5">▣ ADDR:</text>
    ${generateRetroText(shortAddr, -50, 52, 10, config.color, 'end')}` : ''}
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- CENTER: BEEPER DINO (Large, Animated) -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <g transform="translate(${width / 2}, ${height / 2 - 5})">
    ${generateDinoSvg(rarity)}
    
    <!-- Token ID badge below dino -->
    <g transform="translate(0, 82)">
      <rect x="-32" y="-10" width="64" height="20" fill="${config.color}" rx="10"/>
      <text x="0" y="4" text-anchor="middle" font-family="'VT323', 'Press Start 2P', monospace" font-size="10" fill="${config.bg}" font-weight="bold">${tokenId}</text>
    </g>
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- SINGLE PROMINENT VOT GLYPH (Left of dino - rarity symbol) -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <text x="${width / 2 - 130}" y="${height / 2 + 15}" font-size="36" fill="${config.color}" opacity="0.25" text-anchor="middle">${rarityGlyph}</text>
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- BOTTOM LEFT: VOT LOGO WITH LINK -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <a xlink:href="https://mcpvot.xyz/" target="_blank">
    <g transform="translate(25, ${height - 25})">
      <text x="0" y="0" font-family="'VT323', 'Courier New', monospace" font-size="14" fill="${config.color}" font-weight="bold" opacity="0.8">VOT</text>
      <text x="35" y="0" font-family="'VT323', 'Courier New', monospace" font-size="8" fill="${config.color}" opacity="0.4">mcpvot.xyz</text>
    </g>
  </a>
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- BOTTOM CENTER: VOT HIEROGLYPHICS BAR -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  ${generateHieroglyphicsBar(rarity, width / 2, height - 15)}
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- OPENSEA BUTTON (Top-right corner, clickable) -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  ${userData.tokenId ? `
  <a xlink:href="https://opensea.io/assets/base/${BEEPER_CONTRACT}/${userData.tokenId}" target="_blank">
    <g transform="translate(${width - 25}, ${height - 25})" style="cursor: pointer;">
      <rect x="-60" y="-14" width="60" height="18" rx="4" fill="${config.color}" opacity="0.15" stroke="${config.color}" stroke-width="0.5">
        <animate attributeName="opacity" values="0.15;0.25;0.15" dur="${speed}s" repeatCount="indefinite"/>
      </rect>
      <text x="-30" y="0" text-anchor="middle" font-family="'VT323', 'Courier New', monospace" font-size="9" fill="${config.color}" font-weight="bold">
        OPENSEA
        <animate attributeName="opacity" values="0.8;1;0.8" dur="${speed}s" repeatCount="indefinite"/>
      </text>
    </g>
  </a>` : ''}
  
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- RARITY INDICATOR (Below hieroglyphics) -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-family="'VT323', 'Courier New', monospace" font-size="7" fill="${config.color}" opacity="0.4" letter-spacing="2">
    [ ${rarityGlyph} ${rarityLabel} ${rarityGlyph} ]
  </text>
  
</svg>`;
}

export default generateBeeperBannerV3;
