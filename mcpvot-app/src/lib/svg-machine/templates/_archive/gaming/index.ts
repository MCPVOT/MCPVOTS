/**
 * GAMING Templates (10)
 * Retro gaming aesthetic - Pink/Cyan neon theme
 * Updated with Cyberpunk Rank System
 * 🎮 gaming-001 to gaming-010
 */

import { CATEGORY_PALETTES } from '../../../cyberpunk-palette';
import {
    calculateRank,
    generateAnimationStyles,
    generateGlowingBorder,
    generateSVGWrapper,
    RANK_CONFIG
} from '../../animations';
import type { GenerateOptions, SVGTemplate, UserData } from '../../types';
import { PALETTES } from '../../types';

const palette = PALETTES['gaming-retro'];
const cyberpunkPalette = CATEGORY_PALETTES['gaming'];

// ============================================================================
// GAMING-001: Player Card
// ============================================================================
const gamingPlayerCard: SVGTemplate = {
  id: 'gaming-001',
  name: 'Player Card',
  category: 'gaming',
  description: 'Retro gaming player card with cyberpunk rank',
  palette: palette,
  animations: ['pulse', 'glitch'],
  layout: 'card',
  width: 350,
  height: 400,
  tags: ['player', 'card', 'retro', 'profile', 'cyberpunk'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'glitch'], p, options?.animationSpeed);

    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];

    const content = `
      ${animations}
      <defs>
        <linearGradient id="gaming-grad-001" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${rankConfig.color}"/>
          <stop offset="100%" style="stop-color:${p.secondary}"/>
        </linearGradient>
        <filter id="neon-glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      
      <!-- Card -->
      <rect x="10" y="10" width="330" height="380" rx="15" fill="${p.background}" stroke="url(#gaming-grad-001)" stroke-width="3"/>
      
      <!-- Scanlines -->
      <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="4" y2="0" stroke="${rankConfig.color}" stroke-width="1" opacity="0.1"/>
      </pattern>
      <rect x="10" y="10" width="330" height="380" rx="15" fill="url(#scanlines)"/>
      
      <!-- Avatar Area -->
      <rect x="100" y="40" width="150" height="150" rx="10" fill="${rankConfig.color}" opacity="0.2" class="anim-pulse"/>
      <text x="175" y="130" text-anchor="middle" fill="${rankConfig.color}" font-size="60" filter="url(#neon-glow)">
        ${(data.displayName || 'P')[0].toUpperCase()}
      </text>
      
      <!-- Rank Badge -->
      <text x="175" y="205" text-anchor="middle" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- Player Name -->
      <text x="175" y="235" text-anchor="middle" fill="${p.text}" font-size="20" font-weight="bold" font-family="'Orbitron', sans-serif" filter="url(#neon-glow)">
        ${data.displayName || data.ensName || 'PLAYER_1'}
      </text>
      
      <!-- Level -->
      <text x="175" y="260" text-anchor="middle" fill="${rankConfig.color}" font-size="13" font-family="'Share Tech Mono', monospace">
        ${rankConfig.title}
      </text>
      
      <!-- Stats -->
      <g transform="translate(40, 285)" font-family="'Share Tech Mono', monospace" font-size="11">
        <text x="0" y="0" fill="${cp.secondary}">XP:</text>
        <text x="45" y="0" fill="${p.accent}">${data.holdings?.votBalance || '0'}</text>
        
        <text x="140" y="0" fill="${cp.secondary}">RANK:</text>
        <text x="190" y="0" fill="${rankConfig.color}">${rank}</text>
        
        <text x="0" y="25" fill="${cp.secondary}">GUILD:</text>
        <text x="55" y="25" fill="${p.text}">MCPVOT</text>
        
        <text x="140" y="25" fill="${cp.secondary}">MAXX:</text>
        <text x="190" y="25" fill="${p.accent}">${data.holdings?.maxxBalance || '0'}</text>
      </g>
      
      <!-- Address -->
      <text x="175" y="355" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${data.address?.slice(0, 6)}...${data.address?.slice(-4)}
      </text>
      
      <!-- Footer -->
      <text x="175" y="378" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        PRESS START • ${rankConfig.icon} • ERC-1155
      </text>
    `;

    return generateSVGWrapper(content, 350, 400, p);
  },
};

// ============================================================================
// GAMING-002: Achievement
// ============================================================================
const gamingAchievement: SVGTemplate = {
  id: 'gaming-002',
  name: 'Achievement Badge',
  category: 'gaming',
  description: 'Achievement unlocked badge',
  palette: palette,
  animations: ['pulse', 'shimmer'],
  layout: 'centered',
  width: 300,
  height: 200,
  tags: ['achievement', 'badge', 'unlock', 'trophy'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse', 'shimmer'], p, options?.animationSpeed);

    const content = `
      ${animations}
      <defs>
        <filter id="achievement-glow">
          <feGaussianBlur stdDeviation="4"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect x="10" y="10" width="280" height="180" rx="10" fill="${p.background}" stroke="${p.accent}" stroke-width="2"/>
      
      <!-- Achievement Icon -->
      <circle cx="60" cy="100" r="40" fill="${p.accent}" opacity="0.2" class="anim-pulse"/>
      <text x="60" y="112" text-anchor="middle" fill="${p.accent}" font-size="36" filter="url(#achievement-glow)">🏆</text>
      
      <!-- Achievement Text -->
      <text x="170" y="70" text-anchor="middle" fill="${p.secondary}" font-size="12" font-family="monospace">
        ACHIEVEMENT UNLOCKED
      </text>
      <text x="170" y="100" text-anchor="middle" fill="${p.text}" font-size="18" font-weight="bold" font-family="monospace">
        ${data.title || 'NFT MINTER'}
      </text>
      <text x="170" y="125" text-anchor="middle" fill="${p.secondary}" font-size="11" font-family="monospace">
        ${data.description?.slice(0, 25) || 'Minted first NFT!'}
      </text>
      
      <!-- XP Reward -->
      <text x="170" y="160" text-anchor="middle" fill="${p.accent}" font-size="14" font-family="monospace">
        +${data.holdings?.votBalance || '100'} XP
      </text>
    `;

    return generateSVGWrapper(content, 300, 200, p);
  },
};

// ============================================================================
// GAMING-003: Leaderboard
// ============================================================================
const gamingLeaderboard: SVGTemplate = {
  id: 'gaming-003',
  name: 'Leaderboard',
  category: 'gaming',
  description: 'High scores leaderboard',
  palette: palette,
  animations: ['scan', 'pulse'],
  layout: 'terminal',
  width: 350,
  height: 350,
  tags: ['leaderboard', 'scores', 'ranking', 'top'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['scan', 'pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Terminal -->
      <rect x="10" y="10" width="330" height="330" rx="10" fill="${p.background}" stroke="${p.primary}" stroke-width="2"/>
      
      <!-- Header -->
      <rect x="10" y="10" width="330" height="40" rx="10" fill="${p.primary}" opacity="0.2"/>
      <text x="175" y="37" text-anchor="middle" fill="${p.primary}" font-size="18" font-weight="bold" font-family="monospace">
        🏆 LEADERBOARD 🏆
      </text>
      
      <!-- Scores -->
      <g font-family="monospace" font-size="14" transform="translate(30, 70)">
        <text x="0" y="0" fill="${p.accent}">1.</text>
        <text x="30" y="0" fill="${p.text}">???</text>
        <text x="250" y="0" fill="${p.accent}">???</text>
        
        <text x="0" y="35" fill="${p.secondary}">2.</text>
        <text x="30" y="35" fill="${p.text}">???</text>
        <text x="250" y="35" fill="${p.secondary}">???</text>
        
        <text x="0" y="70" fill="${p.secondary}">3.</text>
        <text x="30" y="70" fill="${p.text}">???</text>
        <text x="250" y="70" fill="${p.secondary}">???</text>
        
        <text x="0" y="105" fill="${p.secondary}">4.</text>
        <text x="30" y="105" fill="${p.text}">???</text>
        <text x="250" y="105" fill="${p.secondary}">???</text>
        
        <text x="0" y="140" fill="${p.secondary}">5.</text>
        <text x="30" y="140" fill="${p.text}">???</text>
        <text x="250" y="140" fill="${p.secondary}">???</text>
      </g>
      
      <!-- Your Rank -->
      <rect x="30" y="250" width="290" height="50" rx="8" fill="${p.primary}" opacity="0.1"/>
      <text x="50" y="280" fill="${p.secondary}" font-size="12" font-family="monospace">YOUR RANK:</text>
      <text x="140" y="280" fill="${p.primary}" font-size="14" font-weight="bold" font-family="monospace">???</text>
      <text x="200" y="280" fill="${p.text}" font-size="12" font-family="monospace">
        ${data.displayName || data.address?.slice(0, 8)}
      </text>
      <text x="300" y="280" fill="${p.accent}" font-size="12" font-family="monospace">${data.holdings?.votBalance || '0'}</text>
      
      <!-- Footer -->
      <text x="175" y="325" text-anchor="middle" fill="${p.secondary}" font-size="9" font-family="monospace">
        MCPVOT GAMING • ERC-1155
      </text>
    `;

    return generateSVGWrapper(content, 350, 350, p);
  },
};

// ============================================================================
// GAMING-004: Pixel Avatar
// ============================================================================
const gamingPixelAvatar: SVGTemplate = {
  id: 'gaming-004',
  name: 'Pixel Avatar',
  category: 'gaming',
  description: 'Pixel art style avatar',
  palette: palette,
  animations: ['pulse', 'float'],
  layout: 'centered',
  width: 250,
  height: 250,
  tags: ['pixel', 'avatar', '8bit', 'retro'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse', 'float'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Frame -->
      <rect x="10" y="10" width="230" height="230" rx="10" fill="${p.background}" stroke="${p.primary}" stroke-width="3"/>
      
      <!-- Pixel Grid Background -->
      <pattern id="pixel-grid" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="${p.background}"/>
        <rect width="9" height="9" fill="${p.primary}" opacity="0.05"/>
      </pattern>
      <rect x="25" y="25" width="200" height="150" fill="url(#pixel-grid)"/>
      
      <!-- Pixel Character Placeholder -->
      <g class="anim-float">
        <rect x="105" y="50" width="40" height="40" fill="${p.primary}"/>
        <rect x="95" y="90" width="60" height="50" fill="${p.secondary}"/>
        <rect x="95" y="140" width="20" height="30" fill="${p.accent}"/>
        <rect x="135" y="140" width="20" height="30" fill="${p.accent}"/>
      </g>
      
      <!-- Name -->
      <text x="125" y="200" text-anchor="middle" fill="${p.text}" font-size="14" font-weight="bold" font-family="monospace">
        ${data.displayName || 'PLAYER'}
      </text>
      
      <!-- ID -->
      <text x="125" y="220" text-anchor="middle" fill="${p.secondary}" font-size="10" font-family="monospace">
        #${data.address?.slice(2, 8).toUpperCase() || '000000'}
      </text>
    `;

    return generateSVGWrapper(content, 250, 250, p);
  },
};

// ============================================================================
// GAMING-005: Score Display
// ============================================================================
const gamingScore: SVGTemplate = {
  id: 'gaming-005',
  name: 'Score Display',
  category: 'gaming',
  description: 'Arcade score display',
  palette: palette,
  animations: ['pulse', 'flicker'],
  layout: 'card',
  width: 400,
  height: 150,
  tags: ['score', 'arcade', 'points', 'display'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse', 'flicker'], p, options?.animationSpeed);

    const content = `
      ${animations}
      <defs>
        <filter id="lcd-glow">
          <feGaussianBlur stdDeviation="2"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      
      <!-- Display Frame -->
      <rect x="10" y="10" width="380" height="130" rx="10" fill="#000" stroke="${p.primary}" stroke-width="3"/>
      
      <!-- LCD Background -->
      <rect x="20" y="20" width="360" height="110" rx="5" fill="#111"/>
      
      <!-- Score Label -->
      <text x="40" y="55" fill="${p.secondary}" font-size="14" font-family="monospace">SCORE:</text>
      
      <!-- Score -->
      <text x="360" y="90" text-anchor="end" fill="${p.primary}" font-size="48" font-weight="bold" font-family="monospace" filter="url(#lcd-glow)" class="anim-pulse">
        ${(data.holdings?.votBalance || '0').toString().padStart(8, '0')}
      </text>
      
      <!-- Player -->
      <text x="40" y="115" fill="${p.accent}" font-size="12" font-family="monospace">
        ${data.displayName || data.address?.slice(0, 10) || 'PLAYER_1'}
      </text>
      
      <!-- High Score Indicator -->
      <text x="360" y="115" text-anchor="end" fill="${p.secondary}" font-size="10" font-family="monospace">
        HI-SCORE
      </text>
    `;

    return generateSVGWrapper(content, 400, 150, p);
  },
};

// ============================================================================
// GAMING-006: Power Up
// ============================================================================
const gamingPowerUp: SVGTemplate = {
  id: 'gaming-006',
  name: 'Power Up',
  category: 'gaming',
  description: 'Power up collectible',
  palette: palette,
  animations: ['rotate', 'pulse'],
  layout: 'centered',
  width: 200,
  height: 200,
  tags: ['powerup', 'item', 'collectible', 'boost'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['rotate', 'pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      <defs>
        <radialGradient id="powerup-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:${p.accent};stop-opacity:0.8"/>
          <stop offset="100%" style="stop-color:${p.accent};stop-opacity:0"/>
        </radialGradient>
        <filter id="powerup-filter">
          <feGaussianBlur stdDeviation="3"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect x="10" y="10" width="180" height="180" rx="15" fill="${p.background}" stroke="${p.primary}" stroke-width="2"/>
      
      <!-- Glow -->
      <circle cx="100" cy="90" r="50" fill="url(#powerup-glow)" class="anim-pulse"/>
      
      <!-- Power Up Icon -->
      <g filter="url(#powerup-filter)" class="anim-rotate" style="transform-origin: 100px 90px">
        <polygon points="100,50 115,80 145,80 120,100 130,135 100,115 70,135 80,100 55,80 85,80" 
                 fill="${p.accent}" stroke="${p.primary}" stroke-width="2"/>
      </g>
      
      <!-- Label -->
      <text x="100" y="160" text-anchor="middle" fill="${p.text}" font-size="14" font-weight="bold" font-family="monospace">
        POWER UP
      </text>
      <text x="100" y="180" text-anchor="middle" fill="${p.secondary}" font-size="10" font-family="monospace">
        +${data.holdings?.votBalance || '100'} VOT
      </text>
    `;

    return generateSVGWrapper(content, 200, 200, p);
  },
};

// ============================================================================
// GAMING-007: Quest
// ============================================================================
const gamingQuest: SVGTemplate = {
  id: 'gaming-007',
  name: 'Quest Card',
  category: 'gaming',
  description: 'Quest/mission card',
  palette: palette,
  animations: ['shimmer', 'pulse'],
  layout: 'card',
  width: 350,
  height: 250,
  tags: ['quest', 'mission', 'task', 'objective'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['shimmer', 'pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Card -->
      <rect x="10" y="10" width="330" height="230" rx="12" fill="${p.background}" stroke="${p.secondary}" stroke-width="2"/>
      
      <!-- Quest Header -->
      <rect x="10" y="10" width="330" height="45" rx="12" fill="${p.secondary}" opacity="0.2"/>
      <text x="30" y="40" fill="${p.secondary}" font-size="12" font-family="monospace">DAILY QUEST</text>
      <text x="320" y="40" text-anchor="end" fill="${p.accent}" font-size="12" font-family="monospace">⏱ 23:59</text>
      
      <!-- Quest Title -->
      <text x="30" y="85" fill="${p.text}" font-size="18" font-weight="bold" font-family="monospace">
        ${data.title || 'MINT AN NFT'}
      </text>
      
      <!-- Description -->
      <text x="30" y="115" fill="${p.secondary}" font-size="12" font-family="monospace">
        ${data.description?.slice(0, 40) || 'Create your on-chain identity'}
      </text>
      
      <!-- Progress Bar -->
      <rect x="30" y="140" width="290" height="20" rx="5" fill="${p.secondary}" opacity="0.2"/>
      <rect x="30" y="140" width="145" height="20" rx="5" fill="${p.primary}" class="anim-shimmer"/>
      <text x="175" y="155" text-anchor="middle" fill="${p.text}" font-size="10" font-family="monospace">50%</text>
      
      <!-- Reward -->
      <text x="30" y="190" fill="${p.secondary}" font-size="11" font-family="monospace">REWARD:</text>
      <text x="100" y="190" fill="${p.accent}" font-size="14" font-weight="bold" font-family="monospace">
        +${data.holdings?.votBalance || '500'} XP
      </text>
      
      <!-- Footer -->
      <text x="175" y="225" text-anchor="middle" fill="${p.secondary}" font-size="9" font-family="monospace">
        MCPVOT QUESTS • ERC-1155
      </text>
    `;

    return generateSVGWrapper(content, 350, 250, p);
  },
};

// ============================================================================
// GAMING-008: Game Over
// ============================================================================
const gamingGameOver: SVGTemplate = {
  id: 'gaming-008',
  name: 'Game Over',
  category: 'gaming',
  description: 'Classic game over screen',
  palette: palette,
  animations: ['flicker', 'pulse'],
  layout: 'centered',
  width: 350,
  height: 250,
  tags: ['gameover', 'end', 'classic', 'retro'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['flicker', 'pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      <defs>
        <filter id="crt-flicker">
          <feGaussianBlur stdDeviation="0.5"/>
        </filter>
      </defs>
      
      <!-- CRT Screen -->
      <rect x="10" y="10" width="330" height="230" rx="20" fill="#000" stroke="${p.primary}" stroke-width="4"/>
      
      <!-- Scanlines -->
      <pattern id="crt-lines" width="4" height="4" patternUnits="userSpaceOnUse">
        <line x1="0" y1="2" x2="4" y2="2" stroke="${p.text}" stroke-width="1" opacity="0.03"/>
      </pattern>
      <rect x="15" y="15" width="320" height="220" rx="18" fill="url(#crt-lines)"/>
      
      <!-- GAME OVER Text -->
      <text x="175" y="100" text-anchor="middle" fill="${p.primary}" font-size="36" font-weight="bold" font-family="monospace" class="anim-flicker" filter="url(#crt-flicker)">
        GAME OVER
      </text>
      
      <!-- Final Score -->
      <text x="175" y="140" text-anchor="middle" fill="${p.secondary}" font-size="14" font-family="monospace">
        FINAL SCORE
      </text>
      <text x="175" y="170" text-anchor="middle" fill="${p.accent}" font-size="28" font-weight="bold" font-family="monospace" class="anim-pulse">
        ${data.holdings?.votBalance || '0'}
      </text>
      
      <!-- Continue -->
      <text x="175" y="210" text-anchor="middle" fill="${p.text}" font-size="12" font-family="monospace" class="anim-flicker">
        MINT TO CONTINUE
      </text>
    `;

    return generateSVGWrapper(content, 350, 250, p);
  },
};

// ============================================================================
// GAMING-009: Inventory
// ============================================================================
const gamingInventory: SVGTemplate = {
  id: 'gaming-009',
  name: 'Inventory',
  category: 'gaming',
  description: 'Game inventory display',
  palette: palette,
  animations: ['pulse', 'scan'],
  layout: 'grid',
  width: 350,
  height: 350,
  tags: ['inventory', 'items', 'bag', 'storage'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse', 'scan'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Frame -->
      <rect x="10" y="10" width="330" height="330" rx="10" fill="${p.background}" stroke="${p.primary}" stroke-width="2"/>
      
      <!-- Header -->
      <rect x="10" y="10" width="330" height="40" rx="10" fill="${p.primary}" opacity="0.2"/>
      <text x="175" y="37" text-anchor="middle" fill="${p.text}" font-size="16" font-weight="bold" font-family="monospace">
        📦 INVENTORY
      </text>
      
      <!-- Grid -->
      <g transform="translate(30, 65)">
        ${[0,1,2,3,4,5,6,7,8].map((i) => {
          const x = (i % 3) * 100;
          const y = Math.floor(i / 3) * 80;
          return `
            <rect x="${x}" y="${y}" width="80" height="65" rx="5" fill="${p.secondary}" opacity="0.1" stroke="${p.secondary}" stroke-width="1"/>
            <text x="${x + 40}" y="${y + 40}" text-anchor="middle" fill="${p.secondary}" font-size="24">?</text>
          `;
        }).join('')}
      </g>
      
      <!-- Stats -->
      <text x="30" y="320" fill="${p.secondary}" font-size="11" font-family="monospace">
        SLOTS: 0/9 | VOT: ${data.holdings?.votBalance || '0'}
      </text>
      <text x="320" y="320" text-anchor="end" fill="${p.accent}" font-size="11" font-family="monospace">
        ${data.displayName || data.address?.slice(0, 8)}
      </text>
    `;

    return generateSVGWrapper(content, 350, 350, p);
  },
};

// ============================================================================
// GAMING-010: Ultimate
// ============================================================================
const gamingUltimate: SVGTemplate = {
  id: 'gaming-010',
  name: 'Gaming Ultimate',
  category: 'gaming',
  description: 'Ultimate gaming profile showcase',
  palette: palette,
  animations: ['pulse', 'shimmer', 'glitch'],
  layout: 'hero',
  width: 450,
  height: 500,
  tags: ['ultimate', 'profile', 'showcase', 'complete'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse', 'shimmer', 'glitch'], p, options?.animationSpeed);
    const border = generateGlowingBorder(p, 450, 500, 3);

    const content = `
      ${animations}
      <defs>
        <linearGradient id="gaming-ultimate-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${p.primary}"/>
          <stop offset="50%" style="stop-color:${p.secondary}"/>
          <stop offset="100%" style="stop-color:${p.accent}"/>
        </linearGradient>
        <filter id="ultimate-neon">
          <feGaussianBlur stdDeviation="4"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      
      ${border}
      
      <!-- Header -->
      <text x="225" y="50" text-anchor="middle" fill="url(#gaming-ultimate-grad)" font-size="28" font-weight="bold" font-family="monospace" filter="url(#ultimate-neon)">
        🎮 ULTIMATE GAMER 🎮
      </text>
      
      <!-- Avatar -->
      <rect x="150" y="70" width="150" height="150" rx="15" fill="${p.primary}" opacity="0.2" class="anim-pulse"/>
      <text x="225" y="160" text-anchor="middle" fill="${p.primary}" font-size="72" filter="url(#ultimate-neon)">
        ${(data.displayName || 'P')[0].toUpperCase()}
      </text>
      
      <!-- Player Name -->
      <text x="225" y="250" text-anchor="middle" fill="${p.text}" font-size="24" font-weight="bold" font-family="monospace">
        ${data.displayName || data.ensName || 'LEGENDARY_PLAYER'}
      </text>
      <text x="225" y="275" text-anchor="middle" fill="${p.secondary}" font-size="12" font-family="monospace">
        ${data.address?.slice(0, 10)}...${data.address?.slice(-8)}
      </text>
      
      <!-- Stats Grid -->
      <g transform="translate(40, 300)">
        <rect x="0" y="0" width="115" height="60" rx="8" fill="${p.background}" stroke="${p.primary}" stroke-width="1"/>
        <text x="57" y="20" text-anchor="middle" fill="${p.secondary}" font-size="10" font-family="monospace">LEVEL</text>
        <text x="57" y="45" text-anchor="middle" fill="${p.accent}" font-size="20" font-weight="bold" font-family="monospace">???</text>
        
        <rect x="125" y="0" width="115" height="60" rx="8" fill="${p.background}" stroke="${p.primary}" stroke-width="1"/>
        <text x="182" y="20" text-anchor="middle" fill="${p.secondary}" font-size="10" font-family="monospace">XP</text>
        <text x="182" y="45" text-anchor="middle" fill="${p.primary}" font-size="20" font-weight="bold" font-family="monospace">${data.holdings?.votBalance || '0'}</text>
        
        <rect x="250" y="0" width="115" height="60" rx="8" fill="${p.background}" stroke="${p.primary}" stroke-width="1"/>
        <text x="307" y="20" text-anchor="middle" fill="${p.secondary}" font-size="10" font-family="monospace">RANK</text>
        <text x="307" y="45" text-anchor="middle" fill="${p.secondary}" font-size="20" font-weight="bold" font-family="monospace">???</text>
      </g>
      
      <!-- Achievements -->
      <text x="225" y="400" text-anchor="middle" fill="${p.secondary}" font-size="12" font-family="monospace">
        ACHIEVEMENTS
      </text>
      <g transform="translate(100, 415)">
        <circle cx="25" cy="15" r="20" fill="${p.accent}" opacity="0.3"/>
        <text x="25" y="22" text-anchor="middle" fill="${p.accent}" font-size="18">🏆</text>
        
        <circle cx="85" cy="15" r="20" fill="${p.primary}" opacity="0.3"/>
        <text x="85" y="22" text-anchor="middle" fill="${p.primary}" font-size="18">⭐</text>
        
        <circle cx="145" cy="15" r="20" fill="${p.secondary}" opacity="0.3"/>
        <text x="145" y="22" text-anchor="middle" fill="${p.secondary}" font-size="18">💎</text>
        
        <circle cx="205" cy="15" r="20" fill="${p.text}" opacity="0.1"/>
        <text x="205" y="22" text-anchor="middle" fill="${p.secondary}" font-size="18">?</text>
      </g>
      
      <!-- Footer -->
      <text x="225" y="475" text-anchor="middle" fill="${p.secondary}" font-size="10" font-family="monospace">
        MCPVOT GAMING • ERC-1155 • IPFS
      </text>
    `;

    return generateSVGWrapper(content, 450, 500, p);
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export const gamingTemplates: SVGTemplate[] = [
  gamingPlayerCard,
  gamingAchievement,
  gamingLeaderboard,
  gamingPixelAvatar,
  gamingScore,
  gamingPowerUp,
  gamingQuest,
  gamingGameOver,
  gamingInventory,
  gamingUltimate,
];
