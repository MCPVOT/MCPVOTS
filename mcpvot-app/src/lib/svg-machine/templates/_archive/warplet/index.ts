import {
    calculateRank,
    generateAnimationStyles,
    generateGlowingBorder,
    generatePaymentFlow,
    generateProgressBar,
    generateRankBadge,
    generateSVGWrapper,
    RANK_CONFIG
} from '../../animations';
import type { GenerateOptions, SVGTemplate, UserData } from '../../types';
import { PALETTES } from '../../types';
import { CATEGORY_PALETTES, generateCircuitBoard, generateDataRain, generateScanlines } from '../../../cyberpunk-palette';

const palette = PALETTES['warplet-premium'];
const cyberpunkPalette = CATEGORY_PALETTES['warplet'];

// ============================================================================
// WARPLET-001: Genesis Card with Wallet Stats
// ============================================================================
const warplet1: SVGTemplate = {
  id: 'warplet-001',
  name: 'Genesis',
  category: 'warplet',
  description: 'Premium genesis wallet card',
  palette: palette,
  animations: ['pulse', 'shimmer'],
  layout: 'card',
  width: 400,
  height: 280,
  tags: ['premium', 'wallet', 'genesis'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'shimmer'], p, options?.animationSpeed);
    const border = generateGlowingBorder(p, 400, 280, 3);
    
    // Calculate cyberpunk rank
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet || true, // Warplet templates assume holder
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    const content = `
      ${animations}
      ${border}
      
      <!-- Header -->
      <rect x="15" y="15" width="370" height="55" rx="10" fill="${rankConfig.color}" opacity="0.15"/>
      <text x="40" y="45" fill="${rankConfig.color}" font-size="12" font-weight="bold">${rankConfig.icon}</text>
      <text x="60" y="48" fill="${p.text}" font-size="18" font-weight="bold" font-family="'Share Tech Mono', monospace">WARPLET GENESIS</text>
      <text x="340" y="48" fill="${cp.secondary}" font-size="10">${rankConfig.name}</text>
      
      <!-- Avatar & Name -->
      <circle cx="60" cy="120" r="35" fill="${rankConfig.color}" opacity="0.2" class="anim-pulse"/>
      <text x="60" y="128" text-anchor="middle" fill="${p.text}" font-size="28">👤</text>
      <text x="120" y="108" fill="${p.text}" font-size="16" font-weight="bold" font-family="'Share Tech Mono', monospace">${data.displayName || data.ensName || 'Warplet Holder'}</text>
      <text x="120" y="130" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">${data.address?.slice(0, 20)}...</text>
      
      <!-- Balance -->
      <rect x="15" y="165" width="170" height="50" rx="8" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="100" y="185" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">VOT Balance</text>
      <text x="100" y="205" text-anchor="middle" fill="${rankConfig.color}" font-size="18" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
      
      <rect x="195" y="165" width="170" height="50" rx="8" fill="${p.primary}" opacity="0.1"/>
      <text x="280" y="185" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">MAXX Balance</text>
      <text x="280" y="205" text-anchor="middle" fill="${p.text}" font-size="18" font-weight="bold">${data.holdings?.maxxBalance || '0'}</text>
      
      <!-- Footer -->
      <line x1="15" y1="230" x2="385" y2="230" stroke="${rankConfig.color}" stroke-opacity="0.3"/>
      <text x="200" y="255" text-anchor="middle" fill="${cp.secondary}" font-size="8" font-family="'Share Tech Mono', monospace">WARPLET • ${rankConfig.title} • ERC-4337</text>
    `;
    
    return generateSVGWrapper(content, 400, 280, p);
  },
};

// ============================================================================
// WARPLET-002: VIP Badge with Cyberpunk Rank
// ============================================================================
const warplet2: SVGTemplate = {
  id: 'warplet-002',
  name: 'VIP',
  category: 'warplet',
  description: 'VIP cyberpunk rank badge',
  palette: palette,
  animations: ['rotate', 'pulse'],
  layout: 'centered',
  width: 300,
  height: 320,
  tags: ['vip', 'badge', 'rank', 'cyberpunk'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['rotate', 'pulse'], p, options?.animationSpeed);
    const border = generateGlowingBorder(p, 300, 320, 4);
    
    // Calculate cyberpunk rank
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet || true,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    const rankBadge = generateRankBadge(rank, 115, 60, 'medium');
    
    const content = `
      ${animations}
      ${border}
      
      <!-- Rank Badge -->
      ${rankBadge}
      
      <!-- VIP Label -->
      <text x="150" y="175" text-anchor="middle" fill="${rankConfig.color}" font-size="32" font-weight="bold" class="anim-pulse" font-family="'Orbitron', sans-serif">VIP</text>
      <text x="150" y="200" text-anchor="middle" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">${rankConfig.name} • ${rankConfig.title}</text>
      
      <!-- Name -->
      <text x="150" y="235" text-anchor="middle" fill="${p.text}" font-size="16" font-weight="bold" font-family="'Share Tech Mono', monospace">${data.displayName || 'VIP Member'}</text>
      
      <!-- Balance -->
      <text x="150" y="270" text-anchor="middle" fill="${rankConfig.color}" font-size="20" font-weight="bold">${data.holdings?.votBalance || '0'} VOT</text>
      
      <!-- Footer -->
      <text x="150" y="305" text-anchor="middle" fill="${cp.secondary}" font-size="8" font-family="'Share Tech Mono', monospace">WARPLET VIP • ${rankConfig.icon}</text>
    `;
    
    return generateSVGWrapper(content, 300, 320, p);
  },
};

// ============================================================================
// WARPLET-003: Diamond Card with Progress
// ============================================================================
const warplet3: SVGTemplate = {
  id: 'warplet-003',
  name: 'Diamond',
  category: 'warplet',
  description: 'Diamond tier with progress bar to SINGULARITY',
  palette: palette,
  animations: ['shimmer', 'gradient'],
  layout: 'card',
  width: 400,
  height: 300,
  tags: ['diamond', 'progress', 'singularity'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['shimmer', 'gradient'], p, options?.animationSpeed);
    const border = generateGlowingBorder(p, 400, 300, 3);
    
    // Calculate rank
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet || true,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    const balance = parseFloat(data.holdings?.votBalance || '0');
    const progress = Math.min((balance / 1000000) * 100, 100);
    const progressBar = generateProgressBar(p, progress, 300, `Progress to ZERO_DAY (1M VOT)`);
    
    const content = `
      ${animations}
      ${border}
      
      <!-- Header -->
      <text x="200" y="40" text-anchor="middle" fill="${rankConfig.color}" font-size="24" font-weight="bold" font-family="'Orbitron', sans-serif">${rankConfig.icon} ${rankConfig.name}</text>
      <text x="200" y="65" text-anchor="middle" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">${rankConfig.title}</text>
      
      <!-- Avatar -->
      <circle cx="200" cy="120" r="40" fill="${rankConfig.color}" opacity="0.2" class="anim-pulse"/>
      <text x="200" y="135" text-anchor="middle" fill="${p.text}" font-size="36">${rankConfig.icon}</text>
      
      <!-- Name -->
      <text x="200" y="185" text-anchor="middle" fill="${p.text}" font-size="18" font-weight="bold" font-family="'Share Tech Mono', monospace">${data.displayName || 'Elite Holder'}</text>
      
      <!-- Progress -->
      <g transform="translate(50, 210)">
        ${progressBar}
      </g>
      
      <!-- Footer -->
      <text x="200" y="280" text-anchor="middle" fill="${cp.secondary}" font-size="8" font-family="'Share Tech Mono', monospace">GOAL: ZERO_DAY (1M VOT + All Credentials)</text>
    `;
    
    return generateSVGWrapper(content, 400, 300, p);
  },
};

const warplet4: SVGTemplate = {
  id: 'warplet-004',
  name: 'Elite',
  category: 'warplet',
  description: 'Elite status',
  palette: palette,
  animations: ['pulse', 'gradient'],
  layout: 'card',
  width: 400,
  height: 250,
  tags: ['elite'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const a = generateAnimationStyles(['pulse', 'gradient'], p, options?.animationSpeed);
    const b = generateGlowingBorder(p, 400, 250, 3);
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: true,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    return generateSVGWrapper(`
      ${a}${b}
      <text x="200" y="80" text-anchor="middle" fill="${rankConfig.color}" font-size="42" class="anim-pulse">${rankConfig.icon}</text>
      <text x="200" y="125" text-anchor="middle" fill="${p.text}" font-size="22" font-family="'Orbitron', sans-serif">ELITE</text>
      <text x="200" y="150" text-anchor="middle" fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">${rankConfig.name}</text>
      <text x="200" y="200" text-anchor="middle" fill="${rankConfig.color}" font-size="16">${data.holdings?.votBalance || '0'} VOT</text>
    `, 400, 250, p);
  },
};

const warplet5: SVGTemplate = {
  id: 'warplet-005',
  name: 'Portfolio',
  category: 'warplet',
  description: 'Portfolio overview',
  palette: palette,
  animations: ['breathe', 'shimmer'],
  layout: 'dashboard',
  width: 500,
  height: 300,
  tags: ['portfolio'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const a = generateAnimationStyles(['breathe', 'shimmer'], p, options?.animationSpeed);
    const b = generateGlowingBorder(p, 500, 300, 2);
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: true,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    const circuit = generateCircuitBoard(cp, 500, 300);
    
    return generateSVGWrapper(`
      ${a}${b}
      <g opacity="0.05">${circuit}</g>
      <text x="250" y="50" text-anchor="middle" fill="${p.text}" font-size="20" font-family="'Orbitron', sans-serif">PORTFOLIO</text>
      <text x="250" y="75" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name}</text>
      <rect x="30" y="100" width="200" height="80" rx="8" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="130" y="130" text-anchor="middle" fill="${cp.secondary}" font-size="10">VOT</text>
      <text x="130" y="160" text-anchor="middle" fill="${rankConfig.color}" font-size="24" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
      <rect x="270" y="100" width="200" height="80" rx="8" fill="${p.primary}" opacity="0.1"/>
      <text x="370" y="130" text-anchor="middle" fill="${cp.secondary}" font-size="10">MAXX</text>
      <text x="370" y="160" text-anchor="middle" fill="${p.text}" font-size="24" font-weight="bold">${data.holdings?.maxxBalance || '0'}</text>
      <text x="250" y="230" text-anchor="middle" fill="${p.text}" font-size="14" font-family="'Share Tech Mono', monospace">${data.displayName || data.address?.slice(0,20) + '...'}</text>
      <text x="250" y="270" text-anchor="middle" fill="${cp.secondary}" font-size="8">WARPLET • ERC-4337</text>
    `, 500, 300, p);
  },
};

const warplet6: SVGTemplate = {
  id: 'warplet-006',
  name: 'Founder',
  category: 'warplet',
  description: 'Founder badge',
  palette: palette,
  animations: ['pulse', 'shimmer'],
  layout: 'centered',
  width: 350,
  height: 350,
  tags: ['founder'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const a = generateAnimationStyles(['pulse', 'shimmer'], p, options?.animationSpeed);
    const b = generateGlowingBorder(p, 350, 350, 4);
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: true,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    const rankBadge = generateRankBadge(rank, 140, 20, 'medium');
    
    return generateSVGWrapper(`
      ${a}${b}
      ${rankBadge}
      <text x="175" y="160" text-anchor="middle" fill="${p.primary}" font-size="48">🏛️</text>
      <text x="175" y="200" text-anchor="middle" fill="${p.text}" font-size="24" font-family="'Orbitron', sans-serif">FOUNDER</text>
      <text x="175" y="230" text-anchor="middle" fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">${data.displayName || 'OG Holder'}</text>
      <text x="175" y="280" text-anchor="middle" fill="${rankConfig.color}" font-size="16">${data.holdings?.votBalance || '0'} VOT</text>
      <text x="175" y="320" text-anchor="middle" fill="${cp.secondary}" font-size="8">${rankConfig.icon} ${rankConfig.name}</text>
    `, 350, 350, p);
  },
};

const warplet7: SVGTemplate = {
  id: 'warplet-007',
  name: 'Collector',
  category: 'warplet',
  description: 'Collector showcase',
  palette: palette,
  animations: ['gradient', 'breathe'],
  layout: 'card',
  width: 400,
  height: 280,
  tags: ['collector'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const a = generateAnimationStyles(['gradient', 'breathe'], p, options?.animationSpeed);
    const b = generateGlowingBorder(p, 400, 280, 3);
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: true,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    return generateSVGWrapper(`
      ${a}${b}
      <text x="200" y="60" text-anchor="middle" fill="${p.primary}" font-size="36">🎨</text>
      <text x="200" y="100" text-anchor="middle" fill="${p.text}" font-size="20" font-family="'Orbitron', sans-serif">COLLECTOR</text>
      <text x="200" y="125" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name}</text>
      <text x="200" y="170" text-anchor="middle" fill="${p.text}" font-size="14" font-family="'Share Tech Mono', monospace">${data.displayName || 'NFT Collector'}</text>
      <text x="200" y="210" text-anchor="middle" fill="${rankConfig.color}" font-size="18">${data.holdings?.votBalance || '0'} VOT</text>
      <text x="200" y="255" text-anchor="middle" fill="${cp.secondary}" font-size="8">WARPLET • COLLECTOR EDITION</text>
    `, 400, 280, p);
  },
};

const warplet8: SVGTemplate = {
  id: 'warplet-008',
  name: 'Staking',
  category: 'warplet',
  description: 'Staking dashboard',
  palette: palette,
  animations: ['pulse', 'gradient'],
  layout: 'dashboard',
  width: 450,
  height: 280,
  tags: ['staking'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const a = generateAnimationStyles(['pulse', 'gradient'], p, options?.animationSpeed);
    const b = generateGlowingBorder(p, 450, 280, 2);
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: true,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    
    return generateSVGWrapper(`
      ${a}${b}
      <text x="225" y="45" text-anchor="middle" fill="${p.text}" font-size="20" font-family="'Orbitron', sans-serif">STAKING</text>
      <text x="225" y="70" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name}</text>
      <rect x="25" y="90" width="180" height="100" rx="8" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="115" y="125" text-anchor="middle" fill="${cp.secondary}" font-size="10">STAKED VOT</text>
      <text x="115" y="165" text-anchor="middle" fill="${rankConfig.color}" font-size="28" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
      <rect x="245" y="90" width="180" height="100" rx="8" fill="${p.primary}" opacity="0.1"/>
      <text x="335" y="125" text-anchor="middle" fill="${cp.secondary}" font-size="10">REWARDS</text>
      <text x="335" y="165" text-anchor="middle" fill="${p.accent}" font-size="28" font-weight="bold">+${Math.floor(parseFloat(data.holdings?.votBalance || '0') * 0.05)}</text>
      <text x="225" y="230" text-anchor="middle" fill="${p.text}" font-size="12" font-family="'Share Tech Mono', monospace">${data.displayName || data.address?.slice(0,16) + '...'}</text>
      <text x="225" y="260" text-anchor="middle" fill="${cp.secondary}" font-size="8">WARPLET STAKING • 5% APY</text>
    `, 450, 280, p);
  },
};

const warplet9: SVGTemplate = {
  id: 'warplet-009',
  name: 'Legacy',
  category: 'warplet',
  description: 'Legacy holder',
  palette: palette,
  animations: ['shimmer', 'breathe'],
  layout: 'card',
  width: 400,
  height: 260,
  tags: ['legacy'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const a = generateAnimationStyles(['shimmer', 'breathe'], p, options?.animationSpeed);
    const b = generateGlowingBorder(p, 400, 260, 3);
    
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: true,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    const scanlines = generateScanlines(400, 260);
    
    return generateSVGWrapper(`
      ${a}${b}
      <g opacity="0.03">${scanlines}</g>
      <text x="200" y="50" text-anchor="middle" fill="${p.primary}" font-size="32">📜</text>
      <text x="200" y="90" text-anchor="middle" fill="${p.text}" font-size="22" font-family="'Orbitron', sans-serif">LEGACY</text>
      <text x="200" y="115" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name} • ${rankConfig.title}</text>
      <text x="200" y="155" text-anchor="middle" fill="${p.text}" font-size="14" font-family="'Share Tech Mono', monospace">${data.displayName || 'Legacy Holder'}</text>
      <text x="200" y="195" text-anchor="middle" fill="${rankConfig.color}" font-size="18">${data.holdings?.votBalance || '0'} VOT</text>
      <text x="200" y="235" text-anchor="middle" fill="${cp.secondary}" font-size="8">WARPLET • LEGACY EDITION • OG</text>
    `, 400, 260, p);
  },
};

// ============================================================================
// WARPLET-010: Crown - Ultimate Wallet Card with Cyberpunk Rank
// ============================================================================
const warplet10: SVGTemplate = {
  id: 'warplet-010',
  name: 'Crown',
  category: 'warplet',
  description: 'Ultimate crown holder with x402 payment flow and cyberpunk rank',
  palette: palette,
  animations: ['pulse', 'shimmer', 'gradient'],
  layout: 'dashboard',
  width: 450,
  height: 450,
  tags: ['crown', 'ultimate', 'x402', 'cyberpunk'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'shimmer', 'gradient'], p, options?.animationSpeed);
    const border = generateGlowingBorder(p, 450, 450, 4);
    
    // Calculate cyberpunk rank
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet || true,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    const rankBadge = generateRankBadge(rank, 355, 15, 'small');
    const paymentFlow = generatePaymentFlow(p, 400);
    const balance = parseFloat(data.holdings?.votBalance || '0');
    const progress = Math.min((balance / 1000000) * 100, 100);
    const progressBar = generateProgressBar(p, progress, 300, 'Progress to ZERO_DAY');
    const circuit = generateCircuitBoard(cp, 450, 450);
    const scanlines = generateScanlines(450, 450);
    
    const content = `
      ${animations}
      ${border}
      
      <!-- Background effects -->
      <g opacity="0.03">${circuit}</g>
      <g opacity="0.02">${scanlines}</g>
      
      <!-- Rank Badge -->
      ${rankBadge}
      
      <!-- Crown Header -->
      <text x="200" y="50" text-anchor="middle" fill="${rankConfig.color}" font-size="32" font-weight="bold" class="anim-pulse">👑</text>
      <text x="200" y="80" text-anchor="middle" fill="${p.text}" font-size="22" font-weight="bold" font-family="'Orbitron', sans-serif">CROWN HOLDER</text>
      <text x="200" y="105" text-anchor="middle" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">${rankConfig.icon} ${rankConfig.name} • ${rankConfig.title}</text>
      
      <!-- Avatar & Name -->
      <circle cx="225" cy="160" r="40" fill="${rankConfig.color}" opacity="0.2"/>
      <text x="225" y="175" text-anchor="middle" fill="${p.text}" font-size="32">👤</text>
      <text x="225" y="220" text-anchor="middle" fill="${p.text}" font-size="15" font-weight="bold" font-family="'Share Tech Mono', monospace">${data.displayName || 'Crown Holder'}</text>
      <text x="225" y="240" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">${data.address?.slice(0, 24)}...</text>
      
      <!-- Balance -->
      <rect x="75" y="255" width="300" height="50" rx="10" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="225" y="280" text-anchor="middle" fill="${rankConfig.color}" font-size="24" font-weight="bold">${data.holdings?.votBalance || '0'} VOT</text>
      
      <!-- Progress -->
      <g transform="translate(75, 320)">
        ${progressBar}
      </g>
      
      <!-- x402 Payment Flow -->
      <g transform="translate(25, 370)">
        <text x="0" y="0" fill="${cp.secondary}" font-size="8" font-weight="bold" font-family="'Share Tech Mono', monospace">x402 PROTOCOL</text>
        <g transform="translate(0, 10) scale(0.8)">
          ${paymentFlow}
        </g>
      </g>
      
      <!-- Footer -->
      <text x="225" y="435" text-anchor="middle" fill="${cp.secondary}" font-size="7" font-family="'Share Tech Mono', monospace">WARPLET • x402 • ERC-4337 • ${rankConfig.icon} ${rankConfig.name}</text>
    `;
    
    return generateSVGWrapper(content, 450, 450, p);
  },
};

export const warpletTemplates: SVGTemplate[] = [
  warplet1, warplet2, warplet3, warplet4, warplet5,
  warplet6, warplet7, warplet8, warplet9, warplet10,
];

export default warpletTemplates;