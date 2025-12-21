/**
 * MCPVOT Templates (10)
 * Full MCPVOT branding - Cyber/tech theme
 * 🔷 mcpvot-001 to mcpvot-010
 */

import { CATEGORY_PALETTES, generateCircuitBoard, generateDataRain, generateScanlines } from '../../../cyberpunk-palette';
import {
    calculateRank,
    generateAnimationStyles,
    generateBlockchainBlocks,
    generateBurnEffect,
    generateFarcasterElements,
    generateGlowingBorder,
    generatePaymentFlow,
    generateProgressBar,
    generateRankBadge,
    generateStatsGrid,
    generateSVGWrapper,
    RANK_CONFIG
} from '../../animations';
import type { GenerateOptions, SVGTemplate, UserData } from '../../types';
import { PALETTES } from '../../types';

const palette = PALETTES['mcpvot-cyber'];
const cyberpunkPalette = CATEGORY_PALETTES['mcpvot'];

// ============================================================================
// MCPVOT-001: Genesis Card
// ============================================================================
const mcpvotGenesis: SVGTemplate = {
  id: 'mcpvot-001',
  name: 'MCPVOT Genesis',
  category: 'mcpvot',
  description: 'Premium genesis NFT card',
  palette: palette,
  animations: ['pulse', 'gradient'],
  layout: 'card',
  width: 400,
  height: 300,
  tags: ['mcpvot', 'genesis', 'premium', 'nft'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse', 'gradient'], p, options?.animationSpeed);
    const border = generateGlowingBorder(p, 400, 300, 2);

    const content = `
      ${animations}
      ${border}
      <defs>
        <linearGradient id="mcpvot-gen-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${p.primary}"/>
          <stop offset="50%" style="stop-color:${p.secondary}"/>
          <stop offset="100%" style="stop-color:${p.accent}"/>
        </linearGradient>
      </defs>
      
      <!-- Header -->
      <text x="200" y="50" text-anchor="middle" fill="${p.primary}" font-size="24" font-weight="bold" class="anim-pulse">MCPVOT</text>
      <text x="200" y="75" text-anchor="middle" fill="${p.secondary}" font-size="12">Genesis Collection</text>
      
      <!-- Avatar -->
      <circle cx="200" cy="140" r="40" fill="${p.primary}" opacity="0.2"/>
      <text x="200" y="152" text-anchor="middle" fill="${p.text}" font-size="36">🔷</text>
      
      <!-- Name -->
      <text x="200" y="210" text-anchor="middle" fill="${p.text}" font-size="18" font-weight="bold">
        ${data.displayName || data.ensName || 'MCPVOT Member'}
      </text>
      <text x="200" y="235" text-anchor="middle" fill="${p.secondary}" font-size="11" font-family="monospace">
        ${data.address?.slice(0, 20)}...
      </text>
      
      <!-- Balance -->
      <text x="200" y="270" text-anchor="middle" fill="${p.accent}" font-size="20" font-weight="bold">
        ${data.holdings?.votBalance || '0'} VOT
      </text>
    `;

    return generateSVGWrapper(content, 400, 300, p);
  },
};

// ============================================================================
// MCPVOT-002: Cyber Terminal
// ============================================================================
const mcpvotTerminal: SVGTemplate = {
  id: 'mcpvot-002',
  name: 'MCPVOT Terminal',
  category: 'mcpvot',
  description: 'Cyberpunk terminal interface',
  palette: palette,
  animations: ['typewriter', 'flicker', 'scan'],
  layout: 'terminal',
  width: 500,
  height: 350,
  tags: ['mcpvot', 'terminal', 'cyber', 'hacker'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['typewriter', 'flicker', 'scan'], p, options?.animationSpeed);
    const scanlines = options?.includeScanlines ? generateScanlines(500, 350) : '';

    const content = `
      ${animations}
      
      <!-- Terminal Window -->
      <rect x="10" y="10" width="480" height="330" rx="8" fill="#0A0A0A" stroke="${p.primary}" stroke-width="2"/>
      
      <!-- Title Bar -->
      <rect x="10" y="10" width="480" height="35" rx="8" fill="${p.primary}" opacity="0.2"/>
      <circle cx="30" cy="27" r="6" fill="#FF5F56"/>
      <circle cx="52" cy="27" r="6" fill="#FFBD2E"/>
      <circle cx="74" cy="27" r="6" fill="#27CA40"/>
      <text x="250" y="33" text-anchor="middle" fill="${p.primary}" font-size="12" font-weight="bold">MCPVOT_TERMINAL_v2.0</text>
      
      ${scanlines}
      
      <!-- Terminal Content -->
      <text x="25" y="70" fill="${p.primary}" font-size="11" font-family="monospace">root@mcpvot:~$ ./status.sh</text>
      <text x="25" y="95" fill="${p.accent}" font-size="11" font-family="monospace" class="anim-typewriter">
        [OK] System initialized
      </text>
      <text x="25" y="115" fill="${p.text}" font-size="11" font-family="monospace">
        User: ${data.displayName || data.ensName || 'anon'}
      </text>
      <text x="25" y="135" fill="${p.text}" font-size="11" font-family="monospace">
        Address: ${data.address?.slice(0, 24)}...
      </text>
      <text x="25" y="160" fill="${p.text}" font-size="11" font-family="monospace">
        VOT Balance: ${data.holdings?.votBalance || '0'}
      </text>
      <text x="25" y="180" fill="${p.text}" font-size="11" font-family="monospace">
        MAXX Balance: ${data.holdings?.maxxBalance || '0'}
      </text>
      <text x="25" y="200" fill="${p.text}" font-size="11" font-family="monospace">
        Warplet: ${data.holdings?.hasWarplet ? 'ACTIVE' : 'INACTIVE'}
      </text>
      <text x="25" y="220" fill="${p.text}" font-size="11" font-family="monospace">
        Farcaster: ${data.holdings?.hasFarcaster ? 'CONNECTED' : 'DISCONNECTED'}
      </text>
      
      <text x="25" y="260" fill="${p.primary}" font-size="11" font-family="monospace">root@mcpvot:~$ _</text>
      <rect x="180" y="248" width="8" height="14" fill="${p.primary}" class="anim-flicker"/>
      
      <text x="250" y="320" text-anchor="middle" fill="${p.secondary}" font-size="9">MCP • VOT • IPFS • ERC-4804</text>
    `;

    return generateSVGWrapper(content, 500, 350, p);
  },
};

// ============================================================================
// MCPVOT-003: Matrix Dashboard
// ============================================================================
const mcpvotMatrix: SVGTemplate = {
  id: 'mcpvot-003',
  name: 'MCPVOT Matrix',
  category: 'mcpvot',
  description: 'Matrix-style data rain dashboard',
  palette: palette,
  animations: ['data-rain', 'pulse'],
  layout: 'dashboard',
  width: 500,
  height: 400,
  tags: ['mcpvot', 'matrix', 'data-rain', 'cyber'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['data-rain', 'pulse'], p, options?.animationSpeed);
    const dataRain = options?.includeDataRain ? generateDataRain(p, 500, 400) : '';

    const content = `
      ${animations}
      
      <rect x="10" y="10" width="480" height="380" rx="10" fill="${p.background}" stroke="${p.accent}" stroke-width="2"/>
      
      <!-- Data Rain Background -->
      <g opacity="0.3">${dataRain}</g>
      
      <!-- Content Overlay -->
      <rect x="50" y="50" width="400" height="300" rx="10" fill="${p.background}" opacity="0.9"/>
      
      <!-- Header -->
      <text x="250" y="90" text-anchor="middle" fill="${p.primary}" font-size="28" font-weight="bold">MCPVOT</text>
      <text x="250" y="115" text-anchor="middle" fill="${p.accent}" font-size="12">MATRIX PROTOCOL</text>
      
      <!-- User -->
      <text x="250" y="160" text-anchor="middle" fill="${p.text}" font-size="18">
        ${data.displayName || data.ensName || 'Neo'}
      </text>
      <text x="250" y="185" text-anchor="middle" fill="${p.secondary}" font-size="10" font-family="monospace">
        ${data.address || '0x...'}
      </text>
      
      <!-- Stats -->
      <rect x="80" y="210" width="150" height="80" rx="8" fill="${p.primary}" opacity="0.1"/>
      <text x="155" y="240" text-anchor="middle" fill="${p.secondary}" font-size="10">VOT</text>
      <text x="155" y="270" text-anchor="middle" fill="${p.accent}" font-size="24" font-weight="bold" class="anim-pulse">
        ${data.holdings?.votBalance || '0'}
      </text>
      
      <rect x="270" y="210" width="150" height="80" rx="8" fill="${p.primary}" opacity="0.1"/>
      <text x="345" y="240" text-anchor="middle" fill="${p.secondary}" font-size="10">MAXX</text>
      <text x="345" y="270" text-anchor="middle" fill="${p.text}" font-size="24" font-weight="bold">
        ${data.holdings?.maxxBalance || '0'}
      </text>
      
      <text x="250" y="330" text-anchor="middle" fill="${p.secondary}" font-size="9">Follow the white rabbit...</text>
    `;

    return generateSVGWrapper(content, 500, 400, p);
  },
};

// ============================================================================
// MCPVOT-004: Identity Badge
// ============================================================================
const mcpvotBadge: SVGTemplate = {
  id: 'mcpvot-004',
  name: 'MCPVOT Badge',
  category: 'mcpvot',
  description: 'Verified identity badge',
  palette: palette,
  animations: ['rotate', 'pulse'],
  layout: 'centered',
  width: 300,
  height: 300,
  tags: ['mcpvot', 'badge', 'verified', 'identity'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['rotate', 'pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      <defs>
        <linearGradient id="mcpvot-badge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${p.primary}"/>
          <stop offset="100%" style="stop-color:${p.secondary}"/>
        </linearGradient>
      </defs>
      
      <!-- Outer Ring -->
      <circle cx="150" cy="150" r="130" fill="none" stroke="url(#mcpvot-badge-grad)" stroke-width="4" class="anim-rotate" style="transform-origin: center;"/>
      
      <!-- Inner Circle -->
      <circle cx="150" cy="150" r="110" fill="${p.background}" stroke="${p.primary}" stroke-width="2"/>
      <circle cx="150" cy="150" r="70" fill="${p.primary}" opacity="0.1" class="anim-pulse"/>
      
      <!-- Logo -->
      <text x="150" y="130" text-anchor="middle" fill="${p.primary}" font-size="24" font-weight="bold">MCP</text>
      <text x="150" y="160" text-anchor="middle" fill="${p.secondary}" font-size="20" font-weight="bold">VOT</text>
      
      <!-- User -->
      <text x="150" y="200" text-anchor="middle" fill="${p.text}" font-size="12">
        ${(data.displayName || data.ensName || 'Member').slice(0, 15)}
      </text>
      
      <!-- Verified -->
      <circle cx="220" cy="80" r="18" fill="${p.accent}"/>
      <text x="220" y="86" text-anchor="middle" fill="${p.background}" font-size="16">✓</text>
    `;

    return generateSVGWrapper(content, 300, 300, p);
  },
};

// ============================================================================
// MCPVOT-005: Protocol Stats
// ============================================================================
const mcpvotStats: SVGTemplate = {
  id: 'mcpvot-005',
  name: 'MCPVOT Stats',
  category: 'mcpvot',
  description: 'Protocol statistics display',
  palette: palette,
  animations: ['pulse', 'wave'],
  layout: 'dashboard',
  width: 450,
  height: 350,
  tags: ['mcpvot', 'stats', 'protocol', 'dashboard'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse', 'wave'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <rect x="10" y="10" width="430" height="330" rx="12" fill="${p.background}" stroke="${p.primary}" stroke-width="2"/>
      
      <!-- Header -->
      <rect x="20" y="20" width="410" height="50" rx="8" fill="${p.primary}" opacity="0.15"/>
      <text x="40" y="52" fill="${p.primary}" font-size="18" font-weight="bold">📊 MCPVOT Protocol</text>
      <text x="350" y="52" fill="${p.accent}" font-size="12">${data.displayName || 'User'}</text>
      
      <!-- Stats Grid -->
      <rect x="20" y="85" width="130" height="100" rx="8" fill="${p.primary}" opacity="0.08"/>
      <text x="85" y="115" text-anchor="middle" fill="${p.secondary}" font-size="10">VOT Balance</text>
      <text x="85" y="155" text-anchor="middle" fill="${p.accent}" font-size="26" font-weight="bold" class="anim-pulse">
        ${data.holdings?.votBalance || '0'}
      </text>
      
      <rect x="160" y="85" width="130" height="100" rx="8" fill="${p.primary}" opacity="0.08"/>
      <text x="225" y="115" text-anchor="middle" fill="${p.secondary}" font-size="10">MAXX Balance</text>
      <text x="225" y="155" text-anchor="middle" fill="${p.text}" font-size="26" font-weight="bold">
        ${data.holdings?.maxxBalance || '0'}
      </text>
      
      <rect x="300" y="85" width="130" height="100" rx="8" fill="${p.primary}" opacity="0.08"/>
      <text x="365" y="115" text-anchor="middle" fill="${p.secondary}" font-size="10">NFTs</text>
      <text x="365" y="155" text-anchor="middle" fill="${p.primary}" font-size="26" font-weight="bold">∞</text>
      
      <!-- User Section -->
      <rect x="20" y="200" width="410" height="80" rx="8" fill="${p.primary}" opacity="0.05"/>
      <text x="40" y="235" fill="${p.text}" font-size="14" font-weight="bold">${data.displayName || data.ensName || 'MCPVOT User'}</text>
      <text x="40" y="258" fill="${p.secondary}" font-size="10" font-family="monospace">${data.address || '0x...'}</text>
      
      <text x="350" y="245" fill="${data.holdings?.hasWarplet ? p.accent : p.secondary}" font-size="12">
        ${data.holdings?.hasWarplet ? '🎫 Warplet' : '◯ No Warplet'}
      </text>
      
      <!-- Footer -->
      <text x="225" y="315" text-anchor="middle" fill="${p.secondary}" font-size="9">ERC-4804 • ERC-1155 • IPFS • MCP</text>
    `;

    return generateSVGWrapper(content, 450, 350, p);
  },
};

// ============================================================================
// MCPVOT-006: Social Profile
// ============================================================================
const mcpvotSocial: SVGTemplate = {
  id: 'mcpvot-006',
  name: 'MCPVOT Social',
  category: 'mcpvot',
  description: 'Social profile with links',
  palette: palette,
  animations: ['float', 'pulse'],
  layout: 'social',
  width: 400,
  height: 350,
  tags: ['mcpvot', 'social', 'profile', 'links'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['float', 'pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <rect x="10" y="10" width="380" height="330" rx="15" fill="${p.background}" stroke="${p.primary}" stroke-width="2"/>
      
      <!-- Avatar -->
      <circle cx="200" cy="80" r="45" fill="${p.primary}" opacity="0.2" class="anim-pulse"/>
      <text x="200" y="95" text-anchor="middle" fill="${p.text}" font-size="40">👤</text>
      
      <!-- Name & Bio -->
      <text x="200" y="155" text-anchor="middle" fill="${p.text}" font-size="20" font-weight="bold">
        ${data.displayName || data.ensName || 'MCPVOT User'}
      </text>
      <text x="200" y="180" text-anchor="middle" fill="${p.secondary}" font-size="11">
        ${data.subtitle || 'MCPVOT Ecosystem'}
      </text>
      
      <!-- Balance -->
      <text x="200" y="220" text-anchor="middle" fill="${p.accent}" font-size="24" font-weight="bold">
        ${data.holdings?.votBalance || '0'} VOT
      </text>
      
      <!-- Social Icons -->
      <g class="anim-float">
        ${data.links?.twitter ? `<circle cx="100" cy="270" r="20" fill="${p.primary}" opacity="0.2"/><text x="100" y="278" text-anchor="middle" fill="${p.text}" font-size="18">🐦</text>` : ''}
        ${data.links?.github ? `<circle cx="160" cy="270" r="20" fill="${p.primary}" opacity="0.2"/><text x="160" y="278" text-anchor="middle" fill="${p.text}" font-size="18">💻</text>` : ''}
        ${data.links?.farcaster ? `<circle cx="220" cy="270" r="20" fill="${p.primary}" opacity="0.2"/><text x="220" y="278" text-anchor="middle" fill="${p.text}" font-size="18">🟣</text>` : ''}
        ${data.links?.discord ? `<circle cx="280" cy="270" r="20" fill="${p.primary}" opacity="0.2"/><text x="280" y="278" text-anchor="middle" fill="${p.text}" font-size="18">💬</text>` : ''}
      </g>
      
      <text x="200" y="320" text-anchor="middle" fill="${p.secondary}" font-size="9" font-family="monospace">${data.address?.slice(0, 24)}...</text>
    `;

    return generateSVGWrapper(content, 400, 350, p);
  },
};

// ============================================================================
// MCPVOT-007: Minimal Clean
// ============================================================================
const mcpvotMinimal: SVGTemplate = {
  id: 'mcpvot-007',
  name: 'MCPVOT Minimal',
  category: 'mcpvot',
  description: 'Clean minimal design',
  palette: palette,
  animations: ['breathe'],
  layout: 'minimal',
  width: 350,
  height: 200,
  tags: ['mcpvot', 'minimal', 'clean', 'simple'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['breathe'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <rect x="10" y="10" width="330" height="180" rx="10" fill="${p.background}" stroke="${p.primary}" stroke-width="1"/>
      
      <text x="30" y="50" fill="${p.primary}" font-size="16" font-weight="bold">MCPVOT</text>
      <text x="30" y="90" fill="${p.text}" font-size="18" font-weight="300">${data.displayName || data.ensName || 'Anonymous'}</text>
      <text x="30" y="125" fill="${p.accent}" font-size="22" font-weight="bold" class="anim-breathe">${data.holdings?.votBalance || '0'} VOT</text>
      
      <text x="30" y="170" fill="${p.secondary}" font-size="9" font-family="monospace">${data.address?.slice(0, 32)}...</text>
    `;

    return generateSVGWrapper(content, 350, 200, p);
  },
};

// ============================================================================
// MCPVOT-008: Hero Banner
// ============================================================================
const mcpvotHero: SVGTemplate = {
  id: 'mcpvot-008',
  name: 'MCPVOT Hero',
  category: 'mcpvot',
  description: 'Wide hero banner',
  palette: palette,
  animations: ['gradient', 'float'],
  layout: 'hero',
  width: 600,
  height: 280,
  tags: ['mcpvot', 'hero', 'banner', 'wide'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['gradient', 'float'], p, options?.animationSpeed);

    const content = `
      ${animations}
      <defs>
        <linearGradient id="mcpvot-hero-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${p.primary}"/>
          <stop offset="50%" style="stop-color:${p.accent}"/>
          <stop offset="100%" style="stop-color:${p.secondary}"/>
        </linearGradient>
      </defs>
      
      <rect x="10" y="10" width="580" height="260" rx="15" fill="${p.background}" stroke="url(#mcpvot-hero-grad)" stroke-width="3"/>
      
      <!-- Logo -->
      <text x="50" y="90" fill="${p.primary}" font-size="48" font-weight="bold" class="anim-float">MCPVOT</text>
      <text x="50" y="120" fill="${p.secondary}" font-size="14">Model Context Protocol • Voice of Tomorrow</text>
      
      <!-- User -->
      <text x="350" y="80" fill="${p.text}" font-size="22" font-weight="bold">${data.displayName || data.ensName || 'Member'}</text>
      <text x="350" y="105" fill="${p.secondary}" font-size="11" font-family="monospace">${data.address || '0x...'}</text>
      
      <!-- Stats -->
      <text x="350" y="150" fill="${p.secondary}" font-size="11">VOT Balance</text>
      <text x="350" y="185" fill="${p.accent}" font-size="32" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
      
      <text x="480" y="150" fill="${p.secondary}" font-size="11">MAXX</text>
      <text x="480" y="185" fill="${p.text}" font-size="32" font-weight="bold">${data.holdings?.maxxBalance || '0'}</text>
      
      <text x="350" y="240" fill="${p.secondary}" font-size="9">ERC-4804 • ERC-1155 • IPFS Pinned</text>
    `;

    return generateSVGWrapper(content, 600, 280, p);
  },
};

// ============================================================================
// MCPVOT-009: Compact Widget
// ============================================================================
const mcpvotCompact: SVGTemplate = {
  id: 'mcpvot-009',
  name: 'MCPVOT Compact',
  category: 'mcpvot',
  description: 'Small embeddable widget',
  palette: palette,
  animations: ['pulse'],
  layout: 'minimal',
  width: 220,
  height: 90,
  tags: ['mcpvot', 'compact', 'widget', 'embed'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <rect x="5" y="5" width="210" height="80" rx="8" fill="${p.background}" stroke="${p.primary}" stroke-width="1"/>
      
      <circle cx="40" cy="45" r="22" fill="${p.primary}" opacity="0.2" class="anim-pulse"/>
      <text x="40" y="42" text-anchor="middle" fill="${p.primary}" font-size="8" font-weight="bold">MCP</text>
      <text x="40" y="54" text-anchor="middle" fill="${p.secondary}" font-size="8">VOT</text>
      
      <text x="75" y="35" fill="${p.text}" font-size="11" font-weight="bold">${(data.displayName || data.ensName || 'User').slice(0, 14)}</text>
      <text x="75" y="55" fill="${p.accent}" font-size="16" font-weight="bold">${data.holdings?.votBalance || '0'} VOT</text>
      <text x="75" y="72" fill="${p.secondary}" font-size="8">${data.address?.slice(0, 16)}...</text>
    `;

    return generateSVGWrapper(content, 220, 90, p);
  },
};

// ============================================================================
// MCPVOT-010: Ultimate Showcase with x402 Facilitator
// ============================================================================
const mcpvotUltimate: SVGTemplate = {
  id: 'mcpvot-010',
  name: 'MCPVOT Ultimate',
  category: 'mcpvot',
  description: 'Premium showcase with x402 facilitator, cyberpunk rank, and burn mechanics',
  palette: palette,
  animations: ['pulse', 'gradient', 'float', 'shimmer', 'scan'],
  layout: 'dashboard',
  width: 550,
  height: 650,
  tags: ['mcpvot', 'ultimate', 'premium', 'showcase', 'x402', 'burn', 'rank', 'cyberpunk'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'gradient', 'float', 'shimmer', 'scan'], p, options?.animationSpeed);
    const border = generateGlowingBorder(p, 550, 650, 4);
    
    // Calculate cyberpunk rank
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    
    const rankConfig = RANK_CONFIG[rank];
    const rankBadge = generateRankBadge(rank, 455, 15, 'medium');
    const paymentFlow = generatePaymentFlow(p, 500);
    const blockchainBlocks = generateBlockchainBlocks(p, 5);
    const burnEffect = generateBurnEffect(p, 480, 280, 0.5);
    const farcasterElements = data.holdings?.hasFarcaster ? generateFarcasterElements(p, 550) : '';
    
    // Cyberpunk effects
    const dataRain = generateDataRain(cp, 550, 650);
    const scanlines = generateScanlines(550, 650);
    const circuitBoard = generateCircuitBoard(cp, 550, 650);
    const progressBar = generateProgressBar(p, Math.min(parseFloat(data.holdings?.votBalance || '0') / 100000, 100), 200, 'VOT Progress');
    
    const statsData = [
      { label: 'VOT Balance', value: data.holdings?.votBalance || '0', icon: '🟠' },
      { label: 'MAXX Balance', value: data.holdings?.maxxBalance || '0', icon: '💎' },
      { label: 'Rank', value: rankConfig.name, icon: rankConfig.icon },
      { label: 'Burned', value: '1%', icon: '🔥' },
    ];
    const statsGrid = generateStatsGrid(p, statsData);

    const content = `
      ${animations}
      ${border}
      <defs>
        <linearGradient id="mcpvot-ult-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${cp.primary}"/>
          <stop offset="33%" style="stop-color:${cp.secondary}"/>
          <stop offset="66%" style="stop-color:${cp.accent}"/>
          <stop offset="100%" style="stop-color:${cp.primary}"/>
        </linearGradient>
        <filter id="mcpvot-rank-glow">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feFlood flood-color="${rankConfig.glowColor}" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Cyberpunk Background Layers -->
      <g opacity="0.1">${circuitBoard}</g>
      <g opacity="0.08">${dataRain}</g>
      
      ${farcasterElements}
      ${rankBadge}
      
      <!-- Header with Rank Color -->
      <rect x="25" y="25" width="420" height="80" rx="12" fill="${rankConfig.color}" opacity="0.12"/>
      <text x="235" y="55" text-anchor="middle" fill="${rankConfig.color}" font-size="24" font-weight="bold" font-family="'Share Tech Mono', monospace" class="anim-float" filter="url(#mcpvot-rank-glow)">
        🔷 MCPVOT PROTOCOL
      </text>
      <text x="235" y="78" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        x402 FACILITATOR • RANK: ${rankConfig.name} • ${rankConfig.title}
      </text>
      
      <!-- Blockchain Blocks Animation -->
      <g transform="translate(50, 115)">
        ${blockchainBlocks}
      </g>
      
      <!-- Avatar with Rank Ring -->
      <circle cx="275" cy="200" r="48" stroke="${rankConfig.color}" stroke-width="3" fill="none" opacity="0.6">
        <animate attributeName="stroke-opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="275" cy="200" r="42" fill="${rankConfig.color}" opacity="0.15" class="anim-pulse"/>
      <text x="275" y="215" text-anchor="middle" fill="${cp.text}" font-size="36">👤</text>
      
      <!-- Burn Effect -->
      ${burnEffect}
      
      <!-- Name -->
      <text x="275" y="270" text-anchor="middle" fill="${cp.primary}" font-size="20" font-weight="bold" font-family="'Share Tech Mono', monospace">
        ${data.displayName || data.ensName || 'MCPVOT ELITE'}
      </text>
      <text x="275" y="292" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.description}
      </text>
      <text x="275" y="312" text-anchor="middle" fill="${cp.secondary}" font-size="8" font-family="'Share Tech Mono', monospace" opacity="0.7">
        ${data.address?.slice(0, 28) || '0x...'}...
      </text>
      
      <!-- Stats Grid -->
      <g transform="translate(115, 330)">
        ${statsGrid}
      </g>
      
      <!-- Progress Bar -->
      <g transform="translate(175, 450)">
        ${progressBar}
      </g>
      
      <!-- x402 Payment Flow -->
      <g transform="translate(25, 490)">
        <text x="0" y="0" fill="${cp.secondary}" font-size="9" font-weight="bold" font-family="'Share Tech Mono', monospace">x402 FACILITATOR FLOW</text>
        <g transform="translate(0, 12)">
          ${paymentFlow}
        </g>
      </g>
      
      <!-- Status Row -->
      <g class="anim-float" transform="translate(0, 10)">
        <circle cx="140" cy="570" r="22" fill="${data.holdings?.hasWarplet ? p.accent : p.secondary}" opacity="0.3"/>
        <text x="140" y="577" text-anchor="middle" fill="${p.text}" font-size="18">${data.holdings?.hasWarplet ? '🎫' : '◯'}</text>
        <text x="140" y="600" text-anchor="middle" fill="${p.secondary}" font-size="8">Warplet</text>
        
        <circle cx="220" cy="570" r="22" fill="${data.holdings?.hasFarcaster ? p.accent : p.secondary}" opacity="0.3"/>
        <text x="220" y="577" text-anchor="middle" fill="${p.text}" font-size="18">${data.holdings?.hasFarcaster ? '🟣' : '◯'}</text>
        <text x="220" y="600" text-anchor="middle" fill="${p.secondary}" font-size="8">Farcaster</text>
        
        <circle cx="300" cy="570" r="22" fill="${p.accent}" opacity="0.3"/>
        <text x="300" y="577" text-anchor="middle" fill="${p.text}" font-size="18">✓</text>
        <text x="300" y="600" text-anchor="middle" fill="${p.secondary}" font-size="8">Verified</text>
        
        <circle cx="380" cy="570" r="22" fill="${p.primary}" opacity="0.3"/>
        <text x="380" y="577" text-anchor="middle" fill="${p.text}" font-size="18">📌</text>
        <text x="380" y="600" text-anchor="middle" fill="${p.secondary}" font-size="8">IPFS</text>
        
        <circle cx="460" cy="570" r="22" fill="#FF6B00" opacity="0.3"/>
        <text x="460" y="577" text-anchor="middle" fill="${p.text}" font-size="18">�</text>
        <text x="460" y="600" text-anchor="middle" fill="${p.secondary}" font-size="8">1% Burn</text>
      </g>
      
      <!-- Scanlines overlay -->
      <g opacity="0.02">${scanlines}</g>
      
      <!-- Footer -->
      <text x="275" y="638" text-anchor="middle" fill="${cp.secondary}" font-size="7" font-family="'Share Tech Mono', monospace">
        MCPVOT • x402 VOT FACILITATOR • 1% BURN • ERC-4804 • ERC-1155 • IPFS
      </text>
    `;

    return generateSVGWrapper(content, 550, 650, p);
  },
};

// ============================================================================
// EXPORT
// ============================================================================
export const mcpvotTemplates: SVGTemplate[] = [
  mcpvotGenesis,
  mcpvotTerminal,
  mcpvotMatrix,
  mcpvotBadge,
  mcpvotStats,
  mcpvotSocial,
  mcpvotMinimal,
  mcpvotHero,
  mcpvotCompact,
  mcpvotUltimate,
];
