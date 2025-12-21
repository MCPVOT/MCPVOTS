/**
 * FARCASTER Templates (10)
 * Purple/social theme, cast-ready, Warpcast optimized
 * Updated with Cyberpunk Rank System
 */

import {
    calculateRank,
    generateAnimationStyles,
    generateGlowingBorder,
    generatePaymentFlow,
    generateProgressBar,
    generateRankBadge,
    generateScanlines,
    generateStatsGrid,
    generateSVGWrapper,
    RANK_CONFIG
} from '../../animations';
import { GenerateOptions, PALETTES, SVGTemplate, UserData } from '../../types';
import { CATEGORY_PALETTES, generateCircuitBoard, generateDataRain, generateScanlines as generateCyberpunkScanlines } from '../../../cyberpunk-palette';

const farcasterPalette = PALETTES['farcaster-purple'];
const cyberpunkPalette = CATEGORY_PALETTES['farcaster'];

// =============================================================================
// TEMPLATE 1: Farcaster Social Card
// =============================================================================

const farcasterSocial: SVGTemplate = {
  id: 'farcaster-001',
  name: 'Farcaster Social',
  category: 'farcaster',
  description: 'Classic social profile card for Warpcast',
  palette: farcasterPalette,
  animations: ['pulse', 'float'],
  layout: 'card',
  width: 800,
  height: 418,
  tags: ['farcaster', 'social', 'card', 'warpcast', 'profile'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = farcasterSocial;
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const styles = generateAnimationStyles(['pulse', 'float'], p, options?.animationSpeed);
    
    // Calculate cyberpunk rank
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster || true,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    const content = `
      ${styles}
      ${generateGlowingBorder(p, width, height)}
      
      <!-- Avatar Circle -->
      <g transform="translate(100, ${height/2 - 60})" class="anim-float">
        <circle cx="60" cy="60" r="55" fill="${rankConfig.color}" opacity="0.3">
          <animate attributeName="r" values="55;58;55" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="60" cy="60" r="50" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="3"/>
        ${data.avatar ? `<clipPath id="avatar-clip"><circle cx="60" cy="60" r="47"/></clipPath>
        <image href="${data.avatar}" x="13" y="13" width="94" height="94" clip-path="url(#avatar-clip)"/>` : 
        `<text x="60" y="75" text-anchor="middle" fill="${rankConfig.color}" font-size="40" font-weight="bold">${(data.displayName || 'F')[0].toUpperCase()}</text>`}
      </g>
      
      <!-- Name & Handle -->
      <text x="240" y="${height/2 - 30}" fill="${p.text}" font-size="32" font-weight="bold" font-family="'Share Tech Mono', monospace" class="anim-pulse">
        ${data.displayName || data.title || 'Farcaster User'}
      </text>
      <text x="240" y="${height/2 + 10}" fill="${rankConfig.color}" font-size="20" font-family="'Share Tech Mono', monospace">
        @${data.links?.farcaster || data.ensName?.replace('.eth','') || 'username'}
      </text>
      
      <!-- Rank Badge -->
      <text x="240" y="${height/2 + 40}" fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name} • ${rankConfig.title}
      </text>
      
      <!-- Bio -->
      <foreignObject x="240" y="${height/2 + 50}" width="${width - 280}" height="60">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${p.text}; font-size: 13px; opacity: 0.8; line-height: 1.4; font-family: 'Share Tech Mono', monospace;">
          ${data.description || 'Building in public on Farcaster'}
        </div>
      </foreignObject>
      
      <!-- Stats Row -->
      <g transform="translate(240, ${height - 80})">
        <g class="anim-pulse">
          <text fill="${rankConfig.color}" font-size="20" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
          <text y="20" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">VOT</text>
        </g>
        <g transform="translate(120, 0)" class="anim-pulse" style="animation-delay: 0.2s">
          <text fill="${p.secondary}" font-size="20" font-weight="bold">${data.holdings?.hasFarcaster ? '✓' : '○'}</text>
          <text y="20" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">Farcaster</text>
        </g>
      </g>
      
      <!-- Farcaster Logo -->
      <g transform="translate(${width - 80}, 40)" class="anim-float">
        <circle cx="20" cy="20" r="18" fill="${rankConfig.color}" opacity="0.2"/>
        <text x="20" y="26" text-anchor="middle" fill="${rankConfig.color}" font-size="16">ᖵ</text>
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 2: Farcaster Cast Frame
// =============================================================================

const farcasterCastFrame: SVGTemplate = {
  id: 'farcaster-002',
  name: 'Cast Frame',
  category: 'farcaster',
  description: 'Optimized for Farcaster cast embeds',
  palette: farcasterPalette,
  animations: ['pulse', 'gradient'],
  layout: 'card',
  width: 800,
  height: 418,
  tags: ['farcaster', 'cast', 'frame', 'embed'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = farcasterCastFrame;
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster || true,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    const content = `
      <style>
        @keyframes gradientMove { 0%, 100% { stop-color: ${rankConfig.color}; } 50% { stop-color: ${p.secondary}; } }
        .anim-pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
      </style>
      
      <defs>
        <linearGradient id="fc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${rankConfig.color}"><animate attributeName="stop-color" values="${rankConfig.color};${p.secondary};${rankConfig.color}" dur="4s" repeatCount="indefinite"/></stop>
          <stop offset="100%" style="stop-color:${p.secondary}"><animate attributeName="stop-color" values="${p.secondary};${p.accent};${p.secondary}" dur="4s" repeatCount="indefinite"/></stop>
        </linearGradient>
      </defs>
      
      <!-- Background Pattern -->
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="none" stroke="url(#fc-gradient)" stroke-width="2" rx="16"/>
      
      <!-- Centered Content -->
      <g transform="translate(${width/2}, ${height/2})">
        <!-- Avatar -->
        <circle cx="0" cy="-60" r="45" fill="${rankConfig.color}" opacity="0.3" class="anim-pulse"/>
        <circle cx="0" cy="-60" r="40" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
        ${data.avatar ? `<clipPath id="avatar2"><circle cx="0" cy="-60" r="38"/></clipPath>
        <image href="${data.avatar}" x="-38" y="-98" width="76" height="76" clip-path="url(#avatar2)"/>` :
        `<text x="0" y="-48" text-anchor="middle" fill="${rankConfig.color}" font-size="32">${(data.displayName || 'F')[0]}</text>`}
        
        <!-- Name -->
        <text x="0" y="20" text-anchor="middle" fill="${p.text}" font-size="28" font-weight="bold" font-family="'Share Tech Mono', monospace">${data.displayName || data.title}</text>
        <text x="0" y="50" text-anchor="middle" fill="${rankConfig.color}" font-size="16" font-family="'Share Tech Mono', monospace">@${data.links?.farcaster || 'username'}</text>
        
        <!-- Rank -->
        <text x="0" y="80" text-anchor="middle" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name}</text>
        
        <!-- Bio Snippet -->
        <text x="0" y="110" text-anchor="middle" fill="${p.text}" font-size="13" opacity="0.7" font-family="'Share Tech Mono', monospace">${(data.description || '').slice(0, 50)}${(data.description?.length || 0) > 50 ? '...' : ''}</text>
      </g>
      
      <!-- MCPVOT Badge -->
      <g transform="translate(${width - 100}, ${height - 40})">
        <text fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">MCPVOT</text>
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 3: Farcaster Stats
// =============================================================================

const farcasterStats: SVGTemplate = {
  id: 'farcaster-003',
  name: 'Farcaster Stats',
  category: 'farcaster',
  description: 'Stats-focused profile with token balances',
  palette: farcasterPalette,
  animations: ['pulse', 'float', 'scan'],
  layout: 'dashboard',
  width: 800,
  height: 600,
  tags: ['farcaster', 'stats', 'dashboard', 'tokens'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = farcasterStats;
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const styles = generateAnimationStyles(['pulse', 'float', 'scan'], p, options?.animationSpeed);
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster || true,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    const rankBadge = generateRankBadge(rank, width - 130, 45, 'small');
    
    const content = `
      ${styles}
      ${generateGlowingBorder(p, width, height)}
      
      <!-- Rank Badge -->
      ${rankBadge}
      
      <!-- Header -->
      <rect x="40" y="40" width="${width-180}" height="80" fill="${rankConfig.color}" opacity="0.1" rx="8"/>
      <g transform="translate(80, 60)">
        <circle cx="30" cy="30" r="28" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
        ${data.avatar ? `<clipPath id="av3"><circle cx="30" cy="30" r="26"/></clipPath>
        <image href="${data.avatar}" x="4" y="4" width="52" height="52" clip-path="url(#av3)"/>` :
        `<text x="30" y="40" text-anchor="middle" fill="${rankConfig.color}" font-size="24">${(data.displayName || 'F')[0]}</text>`}
      </g>
      <text x="160" y="75" fill="${p.text}" font-size="24" font-weight="bold" font-family="'Share Tech Mono', monospace">${data.displayName || data.title}</text>
      <text x="160" y="100" fill="${rankConfig.color}" font-size="13" font-family="'Share Tech Mono', monospace">@${data.links?.farcaster || 'username'} • ${rankConfig.icon} ${rankConfig.name}</text>
      
      <!-- Stats Grid -->
      <g transform="translate(40, 160)">
        ${[
          { label: 'VOT Balance', value: data.holdings?.votBalance || '0', color: rankConfig.color },
          { label: 'MAXX Balance', value: data.holdings?.maxxBalance || '0', color: p.secondary },
          { label: 'Rank', value: rankConfig.name, color: rankConfig.color },
          { label: 'Warplet', value: data.holdings?.hasWarplet ? 'Holder' : 'None', color: '#FFD700' },
        ].map((stat, i) => `
          <g transform="translate(${(i % 2) * 360}, ${Math.floor(i / 2) * 140})" class="anim-pulse" style="animation-delay: ${i * 0.15}s">
            <rect width="340" height="120" fill="${stat.color}" opacity="0.05" rx="8"/>
            <rect width="340" height="4" fill="${stat.color}" opacity="0.5" rx="2"/>
            <text x="20" y="50" fill="${cp.secondary}" font-size="12" opacity="0.8" font-family="'Share Tech Mono', monospace">${stat.label}</text>
            <text x="20" y="85" fill="${stat.color}" font-size="28" font-weight="bold">${stat.value}</text>
          </g>
        `).join('')}
      </g>
      
      <!-- Footer -->
      <text x="${width/2}" y="${height - 30}" text-anchor="middle" fill="${cp.secondary}" font-size="11" opacity="0.6" font-family="'Share Tech Mono', monospace">
        ${data.ensName || data.basename || data.address?.slice(0, 20) + '...'} • ${rankConfig.title}
      </text>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 4: Farcaster Minimal
// =============================================================================

const farcasterMinimal: SVGTemplate = {
  id: 'farcaster-004',
  name: 'Farcaster Minimal',
  category: 'farcaster',
  description: 'Clean minimal purple profile',
  palette: farcasterPalette,
  animations: ['breathe'],
  layout: 'minimal',
  width: 600,
  height: 400,
  tags: ['farcaster', 'minimal', 'clean', 'simple'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = farcasterMinimal;
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster || true,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    const content = `
      <style>
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        .breathe { animation: breathe 4s ease-in-out infinite; transform-origin: center; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      
      <g transform="translate(${width/2}, ${height/2})" class="breathe">
        <text y="-30" text-anchor="middle" fill="${p.text}" font-size="36" font-weight="bold" font-family="'Orbitron', sans-serif">${data.displayName || data.title}</text>
        <text y="10" text-anchor="middle" fill="${rankConfig.color}" font-size="18" font-family="'Share Tech Mono', monospace">@${data.links?.farcaster || 'username'}</text>
        <text y="45" text-anchor="middle" fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name}</text>
        <text y="80" text-anchor="middle" fill="${p.text}" font-size="13" opacity="0.6" font-family="'Share Tech Mono', monospace">${(data.description || '').slice(0, 45)}</text>
      </g>
      
      <!-- Subtle accent line -->
      <rect x="${width/2 - 50}" y="${height - 40}" width="100" height="2" fill="${rankConfig.color}" opacity="0.5"/>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 5: Farcaster Gradient Hero
// =============================================================================

const farcasterGradientHero: SVGTemplate = {
  id: 'farcaster-005',
  name: 'Gradient Hero',
  category: 'farcaster',
  description: 'Bold gradient hero with animated background',
  palette: farcasterPalette,
  animations: ['gradient', 'pulse', 'float'],
  layout: 'hero',
  width: 1200,
  height: 630,
  tags: ['farcaster', 'hero', 'gradient', 'bold', 'og'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = farcasterGradientHero;
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster || true,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    const rankBadge = generateRankBadge(rank, width - 140, 30, 'medium');
    
    const content = `
      <style>
        @keyframes gradientBG { 0% { stop-color: ${rankConfig.color}; } 50% { stop-color: ${p.accent}; } 100% { stop-color: ${rankConfig.color}; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        .float { animation: float 4s ease-in-out infinite; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
      </style>
      
      <defs>
        <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"><animate attributeName="stop-color" values="${p.background};${rankConfig.color}20;${p.background}" dur="6s" repeatCount="indefinite"/></stop>
          <stop offset="50%"><animate attributeName="stop-color" values="${rankConfig.color}30;${p.secondary}30;${rankConfig.color}30" dur="6s" repeatCount="indefinite"/></stop>
          <stop offset="100%"><animate attributeName="stop-color" values="${p.background};${p.accent}20;${p.background}" dur="6s" repeatCount="indefinite"/></stop>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${rankConfig.color}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${rankConfig.color}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      
      <rect width="${width}" height="${height}" fill="url(#hero-grad)"/>
      <ellipse cx="${width/2}" cy="${height/2}" rx="400" ry="250" fill="url(#glow)" class="pulse"/>
      
      <!-- Rank Badge -->
      ${rankBadge}
      
      <!-- Main Content -->
      <g transform="translate(${width/2}, ${height/2})" class="float">
        <circle cx="0" cy="-100" r="70" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="3"/>
        ${data.avatar ? `<clipPath id="heroav"><circle cx="0" cy="-100" r="67"/></clipPath>
        <image href="${data.avatar}" x="-67" y="-167" width="134" height="134" clip-path="url(#heroav)"/>` :
        `<text x="0" y="-85" text-anchor="middle" fill="${rankConfig.color}" font-size="48">${(data.displayName || 'F')[0]}</text>`}
        
        <text y="20" text-anchor="middle" fill="${p.text}" font-size="48" font-weight="bold" font-family="'Orbitron', sans-serif">${data.displayName || data.title}</text>
        <text y="60" text-anchor="middle" fill="${rankConfig.color}" font-size="24" font-family="'Share Tech Mono', monospace">@${data.links?.farcaster || 'username'}</text>
        <text y="95" text-anchor="middle" fill="${cp.secondary}" font-size="14" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name} • ${rankConfig.title}</text>
        <text y="130" text-anchor="middle" fill="${p.text}" font-size="16" opacity="0.8" font-family="'Share Tech Mono', monospace">${(data.description || 'Building on Farcaster').slice(0, 70)}</text>
      </g>
      
      <!-- Address footer -->
      <text x="${width/2}" y="${height - 30}" text-anchor="middle" fill="${cp.secondary}" font-size="12" opacity="0.5" font-family="'Share Tech Mono', monospace">
        ${data.ensName || data.basename || data.address}
      </text>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 6: Farcaster Split
// =============================================================================

const farcasterSplit: SVGTemplate = {
  id: 'farcaster-006',
  name: 'Farcaster Split',
  category: 'farcaster',
  description: 'Split layout with avatar left, info right',
  palette: farcasterPalette,
  animations: ['pulse', 'scan'],
  layout: 'split',
  width: 1000,
  height: 500,
  tags: ['farcaster', 'split', 'two-column'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = farcasterSplit;
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster || true,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    const content = `
      <style>
        @keyframes pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(${height}px); } }
        .pulse { animation: pulse 2s ease-in-out infinite; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      
      <!-- Left Panel -->
      <rect width="${width/2 - 20}" height="${height}" fill="${rankConfig.color}" opacity="0.05"/>
      <g transform="translate(${width/4}, ${height/2})">
        <circle cx="0" cy="0" r="90" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="3" class="pulse"/>
        ${data.avatar ? `<clipPath id="splitav"><circle cx="0" cy="0" r="85"/></clipPath>
        <image href="${data.avatar}" x="-85" y="-85" width="170" height="170" clip-path="url(#splitav)"/>` :
        `<text x="0" y="20" text-anchor="middle" fill="${rankConfig.color}" font-size="64">${(data.displayName || 'F')[0]}</text>`}
      </g>
      
      <!-- Right Panel -->
      <g transform="translate(${width/2 + 40}, 80)">
        <text fill="${p.text}" font-size="36" font-weight="bold" font-family="'Orbitron', sans-serif">${data.displayName || data.title}</text>
        <text y="40" fill="${rankConfig.color}" font-size="20" font-family="'Share Tech Mono', monospace">@${data.links?.farcaster || 'username'}</text>
        <text y="70" fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name} • ${rankConfig.title}</text>
        
        <foreignObject y="100" width="${width/2 - 80}" height="100">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${p.text}; font-size: 14px; opacity: 0.8; line-height: 1.5; font-family: 'Share Tech Mono', monospace;">
            ${data.description || 'Building in public on Farcaster & Base'}
          </div>
        </foreignObject>
        
        <!-- Stats -->
        <g transform="translate(0, 240)">
          <g class="pulse">
            <text fill="${rankConfig.color}" font-size="24" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
            <text y="25" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">VOT Balance</text>
          </g>
          <g transform="translate(150, 0)" class="pulse" style="animation-delay: 0.2s">
            <text fill="${p.secondary}" font-size="24" font-weight="bold">${data.holdings?.hasFarcaster ? '✓' : '○'}</text>
            <text y="25" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">Farcaster</text>
          </g>
        </g>
      </g>
      
      <!-- Divider line -->
      <line x1="${width/2}" y1="40" x2="${width/2}" y2="${height-40}" stroke="${rankConfig.color}" stroke-width="1" opacity="0.3"/>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 7: Farcaster Neon
// =============================================================================

const farcasterNeon: SVGTemplate = {
  id: 'farcaster-007',
  name: 'Farcaster Neon',
  category: 'farcaster',
  description: 'Neon glow effect with purple aesthetic',
  palette: farcasterPalette,
  animations: ['pulse', 'flicker', 'float'],
  layout: 'centered',
  width: 800,
  height: 600,
  tags: ['farcaster', 'neon', 'glow', 'cyberpunk'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = farcasterNeon;
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster || true,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    const content = `
      <style>
        @keyframes neonPulse { 0%, 100% { filter: drop-shadow(0 0 5px ${rankConfig.color}) drop-shadow(0 0 10px ${rankConfig.color}); } 50% { filter: drop-shadow(0 0 20px ${rankConfig.color}) drop-shadow(0 0 40px ${rankConfig.color}); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .neon { animation: neonPulse 2s ease-in-out infinite; }
        .float { animation: float 3s ease-in-out infinite; }
      </style>
      
      <rect width="${width}" height="${height}" fill="#050008"/>
      
      <!-- Neon border -->
      <rect x="30" y="30" width="${width-60}" height="${height-60}" fill="none" stroke="${rankConfig.color}" stroke-width="2" rx="20" class="neon"/>
      
      <!-- Content -->
      <g transform="translate(${width/2}, ${height/2})" class="float">
        <text y="-70" text-anchor="middle" fill="${rankConfig.color}" font-size="48" font-weight="bold" font-family="'Orbitron', sans-serif" class="neon">${data.displayName || data.title}</text>
        <text y="-20" text-anchor="middle" fill="${p.accent}" font-size="24" font-family="'Share Tech Mono', monospace">@${data.links?.farcaster || 'username'}</text>
        <text y="20" text-anchor="middle" fill="${cp.secondary}" font-size="14" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name} • ${rankConfig.title}</text>
        <text y="60" text-anchor="middle" fill="${p.text}" font-size="14" opacity="0.7" font-family="'Share Tech Mono', monospace">${(data.description || '').slice(0, 50)}</text>
        
        <!-- Neon underline -->
        <rect x="-100" y="80" width="200" height="3" fill="${rankConfig.color}" class="neon"/>
      </g>
      
      <!-- Corner accents -->
      <path d="M30 80 L30 30 L80 30" stroke="${p.accent}" stroke-width="2" fill="none" class="neon"/>
      <path d="M${width-80} 30 L${width-30} 30 L${width-30} 80" stroke="${p.accent}" stroke-width="2" fill="none" class="neon"/>
      <path d="M30 ${height-80} L30 ${height-30} L80 ${height-30}" stroke="${p.accent}" stroke-width="2" fill="none" class="neon"/>
      <path d="M${width-80} ${height-30} L${width-30} ${height-30} L${width-30} ${height-80}" stroke="${p.accent}" stroke-width="2" fill="none" class="neon"/>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 8: Farcaster Grid
// =============================================================================

const farcasterGrid: SVGTemplate = {
  id: 'farcaster-008',
  name: 'Farcaster Grid',
  category: 'farcaster',
  description: 'Multi-panel grid layout',
  palette: farcasterPalette,
  animations: ['pulse', 'scan'],
  layout: 'grid',
  width: 1000,
  height: 600,
  tags: ['farcaster', 'grid', 'panels', 'dashboard'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = farcasterGrid;
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster || true,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    const content = `
      <style>
        @keyframes pulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .panel { fill: ${rankConfig.color}; fill-opacity: 0.05; stroke: ${rankConfig.color}; stroke-opacity: 0.2; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      
      <!-- Grid Panels -->
      <rect x="20" y="20" width="300" height="280" class="panel" rx="8"/>
      <rect x="340" y="20" width="640" height="130" class="panel" rx="8"/>
      <rect x="340" y="170" width="310" height="130" class="panel" rx="8"/>
      <rect x="670" y="170" width="310" height="130" class="panel" rx="8"/>
      <rect x="20" y="320" width="480" height="260" class="panel" rx="8"/>
      <rect x="520" y="320" width="460" height="260" class="panel" rx="8"/>
      
      <!-- Avatar Panel -->
      <g transform="translate(170, 160)">
        <circle cx="0" cy="0" r="80" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
        ${data.avatar ? `<clipPath id="gridav"><circle cx="0" cy="0" r="77"/></clipPath>
        <image href="${data.avatar}" x="-77" y="-77" width="154" height="154" clip-path="url(#gridav)"/>` :
        `<text x="0" y="15" text-anchor="middle" fill="${rankConfig.color}" font-size="48">${(data.displayName || 'F')[0]}</text>`}
      </g>
      
      <!-- Name Panel -->
      <text x="520" y="60" fill="${p.text}" font-size="28" font-weight="bold" font-family="'Orbitron', sans-serif">${data.displayName || data.title}</text>
      <text x="520" y="90" fill="${rankConfig.color}" font-size="16" font-family="'Share Tech Mono', monospace">@${data.links?.farcaster || 'username'}</text>
      <text x="520" y="115" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name}</text>
      
      <!-- Stats Panels -->
      <g transform="translate(360, 190)" class="pulse">
        <text fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">VOT BALANCE</text>
        <text y="50" fill="${rankConfig.color}" font-size="32" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
      </g>
      <g transform="translate(690, 190)" class="pulse" style="animation-delay: 0.2s">
        <text fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">RANK</text>
        <text y="50" fill="${p.secondary}" font-size="28" font-weight="bold">${rankConfig.name}</text>
      </g>
      
      <!-- Bio Panel -->
      <foreignObject x="40" y="350" width="440" height="200">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${p.text}; font-size: 14px; line-height: 1.5; font-family: 'Share Tech Mono', monospace;">
          <div style="color: ${cp.secondary}; font-size: 11px; margin-bottom: 10px;">BIO</div>
          ${data.description || 'Building in public on Farcaster. Member of the MCPVOT ecosystem.'}
        </div>
      </foreignObject>
      
      <!-- Links Panel -->
      <g transform="translate(540, 350)">
        <text fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">LINKS</text>
        ${Object.entries(data.links || {}).slice(0, 4).map(([key, _val], i) => `
          <text y="${40 + i * 30}" fill="${rankConfig.color}" font-size="13" font-family="'Share Tech Mono', monospace">${key}</text>
        `).join('')}
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 9: Farcaster Portrait
// =============================================================================

const farcasterPortrait: SVGTemplate = {
  id: 'farcaster-009',
  name: 'Farcaster Portrait',
  category: 'farcaster',
  description: 'Vertical portrait orientation',
  palette: farcasterPalette,
  animations: ['pulse', 'float'],
  layout: 'portrait',
  width: 500,
  height: 800,
  tags: ['farcaster', 'portrait', 'vertical', 'mobile'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = farcasterPortrait;
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster || true,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    const content = `
      <style>
        @keyframes pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .float { animation: float 3s ease-in-out infinite; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      
      <!-- Top gradient -->
      <defs>
        <linearGradient id="portGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${rankConfig.color}" stop-opacity="0.2"/>
          <stop offset="50%" stop-color="${p.background}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="400" fill="url(#portGrad)"/>
      
      <!-- Avatar -->
      <g transform="translate(${width/2}, 180)" class="float">
        <circle cx="0" cy="0" r="100" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="3"/>
        ${data.avatar ? `<clipPath id="portav"><circle cx="0" cy="0" r="95"/></clipPath>
        <image href="${data.avatar}" x="-95" y="-95" width="190" height="190" clip-path="url(#portav)"/>` :
        `<text x="0" y="20" text-anchor="middle" fill="${rankConfig.color}" font-size="64">${(data.displayName || 'F')[0]}</text>`}
      </g>
      
      <!-- Name -->
      <text x="${width/2}" y="340" text-anchor="middle" fill="${p.text}" font-size="32" font-weight="bold" font-family="'Orbitron', sans-serif">${data.displayName || data.title}</text>
      <text x="${width/2}" y="380" text-anchor="middle" fill="${rankConfig.color}" font-size="20" font-family="'Share Tech Mono', monospace">@${data.links?.farcaster || 'username'}</text>
      <text x="${width/2}" y="415" text-anchor="middle" fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name} • ${rankConfig.title}</text>
      
      <!-- Bio -->
      <foreignObject x="40" y="440" width="${width-80}" height="100">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${p.text}; font-size: 14px; text-align: center; opacity: 0.8; line-height: 1.5; font-family: 'Share Tech Mono', monospace;">
          ${data.description || 'Building on Farcaster & Base'}
        </div>
      </foreignObject>
      
      <!-- Stats -->
      <g transform="translate(${width/2}, 600)">
        <g transform="translate(-100, 0)" class="pulse">
          <text text-anchor="middle" fill="${rankConfig.color}" font-size="28" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
          <text y="30" text-anchor="middle" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">VOT</text>
        </g>
        <g transform="translate(100, 0)" class="pulse" style="animation-delay: 0.2s">
          <text text-anchor="middle" fill="${p.secondary}" font-size="28" font-weight="bold">${data.holdings?.hasFarcaster ? '✓' : '○'}</text>
          <text y="30" text-anchor="middle" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">Farcaster</text>
        </g>
      </g>
      
      <!-- Address -->
      <text x="${width/2}" y="${height - 40}" text-anchor="middle" fill="${cp.secondary}" font-size="10" opacity="0.5" font-family="'Share Tech Mono', monospace">
        ${data.ensName || data.basename || data.address?.slice(0, 24) + '...'}
      </text>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 10: Farcaster Full with Cyberpunk Rank System
// =============================================================================

const farcasterFull: SVGTemplate = {
  id: 'farcaster-010',
  name: 'Farcaster Full',
  category: 'farcaster',
  description: 'Complete profile with cyberpunk rank, stats grid, and progress',
  palette: farcasterPalette,
  animations: ['pulse', 'float', 'scan', 'gradient'],
  layout: 'dashboard',
  width: 1200,
  height: 850,
  tags: ['farcaster', 'full', 'complete', 'premium', 'cyberpunk'],
  requirements: { hasFarcaster: true },
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = farcasterFull;
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const styles = generateAnimationStyles(['pulse', 'float', 'scan', 'gradient'], p, options?.animationSpeed);
    
    // Calculate cyberpunk rank
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster || true,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    const rankBadge = generateRankBadge(rank, width - 140, 35, 'medium');
    
    const balance = parseFloat(data.holdings?.votBalance || '0');
    const progress = Math.min((balance / 100000) * 100, 100);
    const progressBar = generateProgressBar(p, progress, 400, `Progress to next rank`);
    
    const circuit = generateCircuitBoard(cp, width, height);
    const scanlines = generateCyberpunkScanlines(width, height);
    
    const statsData = [
      { label: 'VOT Balance', value: data.holdings?.votBalance || '0', icon: '🟠' },
      { label: 'MAXX Balance', value: data.holdings?.maxxBalance || '0', icon: '💎' },
      { label: 'Rank', value: rankConfig.name, icon: rankConfig.icon },
      { label: 'Status', value: data.holdings?.hasFarcaster ? 'CASTER' : 'NONE', icon: '🟣' },
    ];
    const statsGrid = generateStatsGrid(p, statsData);
    
    const content = `
      ${styles}
      ${generateGlowingBorder(p, width, height)}
      
      <!-- Background effects -->
      <g opacity="0.03">${circuit}</g>
      <g opacity="0.02">${scanlines}</g>
      
      <!-- Rank Badge -->
      ${rankBadge}
      
      <!-- Header Bar -->
      <rect x="40" y="40" width="${width-200}" height="60" fill="${rankConfig.color}" opacity="0.1" rx="8"/>
      <text x="80" y="80" fill="${rankConfig.color}" font-size="24" font-weight="bold" font-family="'Orbitron', sans-serif">🟣 Farcaster Profile</text>
      <text x="${width - 200}" y="80" text-anchor="end" fill="${cp.secondary}" font-size="13" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name}</text>
      
      <!-- Main Content Area -->
      <g transform="translate(60, 140)">
        <!-- Avatar Section -->
        <g class="anim-float">
          <circle cx="100" cy="100" r="95" fill="${rankConfig.color}" opacity="0.1"/>
          <circle cx="100" cy="100" r="85" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="3"/>
          ${data.avatar ? `<clipPath id="fullav"><circle cx="100" cy="100" r="82"/></clipPath>
          <image href="${data.avatar}" x="18" y="18" width="164" height="164" clip-path="url(#fullav)"/>` :
          `<text x="100" y="120" text-anchor="middle" fill="${rankConfig.color}" font-size="64">${(data.displayName || 'F')[0]}</text>`}
        </g>
        
        <!-- Name & Handle -->
        <g transform="translate(240, 50)">
          <text fill="${p.text}" font-size="36" font-weight="bold" font-family="'Orbitron', sans-serif" class="anim-pulse">${data.displayName || data.title}</text>
          <text y="40" fill="${rankConfig.color}" font-size="22" font-family="'Share Tech Mono', monospace">@${data.links?.farcaster || 'username'}</text>
          <text y="70" fill="${cp.secondary}" font-size="13" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name} • ${rankConfig.title}</text>
          <foreignObject y="90" width="500" height="70">
            <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${p.text}; font-size: 14px; opacity: 0.8; line-height: 1.4; font-family: 'Share Tech Mono', monospace;">
              ${data.description || 'Building in public on Farcaster. Member of the MCPVOT ecosystem.'}
            </div>
          </foreignObject>
        </g>
        
        <!-- Progress Bar -->
        <g transform="translate(240, 170)">
          ${progressBar}
        </g>
      </g>
      
      <!-- Stats Grid -->
      <g transform="translate(60, 380)">
        ${statsGrid}
      </g>
      
      <!-- Credentials Section -->
      <g transform="translate(60, 540)">
        <text fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">CREDENTIALS</text>
        <g transform="translate(0, 30)">
          ${[
            { name: 'Warplet', active: data.holdings?.hasWarplet, icon: '🎫' },
            { name: 'Farcaster', active: data.holdings?.hasFarcaster, icon: '🟣' },
            { name: 'Identity', active: !!data.ensName || !!data.basename, icon: '🆔' },
            { name: 'MAXX', active: parseFloat(data.holdings?.maxxBalance || '0') > 0, icon: '💎' },
          ].map((cred, i) => `
            <g transform="translate(${i * 280}, 0)" class="anim-pulse" style="animation-delay: ${i * 0.1}s">
              <rect width="260" height="50" fill="${cred.active ? rankConfig.color : p.secondary}" opacity="${cred.active ? 0.15 : 0.05}" rx="8"/>
              <text x="20" y="32" fill="${cred.active ? rankConfig.color : cp.secondary}" font-size="14" font-family="'Share Tech Mono', monospace">${cred.icon} ${cred.name}</text>
              <text x="240" y="32" text-anchor="end" fill="${cred.active ? rankConfig.color : cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">${cred.active ? '✓' : '○'}</text>
            </g>
          `).join('')}
        </g>
      </g>
      
      <!-- Links Section -->
      <g transform="translate(60, 650)">
        <text fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">LINKS & SOCIAL</text>
        <g transform="translate(0, 30)">
          ${Object.entries(data.links || {}).slice(0, 6).map(([key, val], i) => `
            <g transform="translate(${(i % 3) * 360}, ${Math.floor(i / 3) * 50})" class="anim-pulse" style="animation-delay: ${i * 0.1}s">
              <rect width="340" height="40" fill="${rankConfig.color}" opacity="0.05" rx="4"/>
              <text x="15" y="26" fill="${rankConfig.color}" font-size="13" font-family="'Share Tech Mono', monospace">${key}</text>
              <text x="100" y="26" fill="${p.text}" font-size="12" opacity="0.8" font-family="'Share Tech Mono', monospace">${String(val).slice(0, 28)}</text>
            </g>
          `).join('')}
        </g>
      </g>
      
      <!-- Footer -->
      <g transform="translate(${width/2}, ${height - 50})">
        <text text-anchor="middle" fill="${cp.secondary}" font-size="11" opacity="0.5" font-family="'Share Tech Mono', monospace">
          ${data.ensName || data.basename || data.address}
        </text>
        <text y="20" text-anchor="middle" fill="${rankConfig.color}" font-size="9" opacity="0.4" font-family="'Share Tech Mono', monospace">
          MCPVOT SVG Machine | x402 Facilitator | ERC-4804 | ${rankConfig.icon} ${rankConfig.name}
        </text>
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// EXPORT ALL FARCASTER TEMPLATES
// =============================================================================

export const farcasterTemplates: SVGTemplate[] = [
  farcasterSocial,
  farcasterCastFrame,
  farcasterStats,
  farcasterMinimal,
  farcasterGradientHero,
  farcasterSplit,
  farcasterNeon,
  farcasterGrid,
  farcasterPortrait,
  farcasterFull,
];

export default farcasterTemplates;