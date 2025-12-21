/**
 * DEFI Templates (10)
 * Trading/finance dashboards - Green/Purple theme
 * Updated with Cyberpunk Rank System
 * 💹 defi-001 to defi-010
 */

import { CATEGORY_PALETTES, generateCircuitBoard, generateScanlines } from '../../../cyberpunk-palette';
import {
    calculateRank,
    generateAnimationStyles,
    generateGlowingBorder,
    generateProgressBar,
    generateRankBadge,
    generateSVGWrapper,
    RANK_CONFIG
} from '../../animations';
import type { GenerateOptions, SVGTemplate, UserData } from '../../types';
import { PALETTES } from '../../types';

const palette = PALETTES['defi-dark'];
const cyberpunkPalette = CATEGORY_PALETTES['defi'];

// ============================================================================
// DEFI-001: Portfolio
// ============================================================================
const defiPortfolio: SVGTemplate = {
  id: 'defi-001',
  name: 'DeFi Portfolio',
  category: 'defi',
  description: 'Portfolio overview dashboard',
  palette: palette,
  animations: ['pulse', 'gradient'],
  layout: 'dashboard',
  width: 450,
  height: 350,
  tags: ['portfolio', 'dashboard', 'holdings', 'overview'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'gradient'], p, options?.animationSpeed);

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
        <linearGradient id="defi-grad-001" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${rankConfig.color}"/>
          <stop offset="100%" style="stop-color:${p.accent}"/>
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect x="10" y="10" width="430" height="330" rx="15" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Header -->
      <text x="30" y="45" fill="${p.text}" font-size="18" font-weight="bold" font-family="'Orbitron', sans-serif">
        📊 Portfolio
      </text>
      <text x="420" y="35" text-anchor="end" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name}
      </text>
      <text x="420" y="52" text-anchor="end" fill="${rankConfig.color}" font-size="12" font-family="'Share Tech Mono', monospace">
        ${data.displayName || data.ensName || 'Trader'}
      </text>
      
      <!-- Total Value -->
      <rect x="30" y="60" width="390" height="80" rx="10" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="50" y="90" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">TOTAL VALUE</text>
      <text x="50" y="125" fill="url(#defi-grad-001)" font-size="30" font-weight="bold" font-family="'Orbitron', sans-serif" class="anim-pulse">
        ${data.holdings?.votBalance || '0'} VOT
      </text>
      
      <!-- Asset Grid -->
      <g transform="translate(30, 160)">
        <rect x="0" y="0" width="120" height="70" rx="8" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="1"/>
        <text x="10" y="25" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">ETH</text>
        <text x="10" y="50" fill="${p.text}" font-size="16" font-weight="bold">--</text>
        
        <rect x="135" y="0" width="120" height="70" rx="8" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="1"/>
        <text x="145" y="25" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">VOT</text>
        <text x="145" y="50" fill="${rankConfig.color}" font-size="16" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
        
        <rect x="270" y="0" width="120" height="70" rx="8" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="1"/>
        <text x="280" y="25" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">MAXX</text>
        <text x="280" y="50" fill="${p.accent}" font-size="16" font-weight="bold">${data.holdings?.maxxBalance || '0'}</text>
      </g>
      
      <!-- Address -->
      <text x="225" y="280" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${data.address}
      </text>
      
      <!-- Footer -->
      <text x="225" y="320" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        MCPVOT • DeFi Portfolio • ${rankConfig.title}
      </text>
    `;

    return generateSVGWrapper(content, 450, 350, p);
  },
};

// ============================================================================
// DEFI-002: Trading Card
// ============================================================================
const defiTrading: SVGTemplate = {
  id: 'defi-002',
  name: 'DeFi Trading',
  category: 'defi',
  description: 'Trading stats display',
  palette: palette,
  animations: ['scan', 'pulse'],
  layout: 'card',
  width: 400,
  height: 280,
  tags: ['trading', 'stats', 'performance', 'pnl'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['scan', 'pulse'], p, options?.animationSpeed);

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
      
      <!-- Card -->
      <rect x="10" y="10" width="380" height="260" rx="12" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Header -->
      <text x="30" y="45" fill="${rankConfig.color}" font-size="18" font-weight="bold" font-family="'Orbitron', sans-serif">
        📈 Trading Stats
      </text>
      <text x="370" y="40" text-anchor="end" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- PnL Display -->
      <rect x="30" y="60" width="340" height="60" rx="8" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="50" y="85" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">24H P&L</text>
      <text x="50" y="110" fill="${p.accent}" font-size="24" font-weight="bold" font-family="'Orbitron', sans-serif">
        +0.00%
      </text>
      <text x="350" y="95" text-anchor="end" fill="${rankConfig.color}" font-size="14" font-family="'Share Tech Mono', monospace">
        ${data.holdings?.votBalance || '0'} VOT
      </text>
      
      <!-- Stats Row -->
      <g transform="translate(30, 140)">
        <text x="0" y="15" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">Trades</text>
        <text x="0" y="35" fill="${p.text}" font-size="16" font-weight="bold">--</text>
        
        <text x="120" y="15" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">Win Rate</text>
        <text x="120" y="35" fill="${p.accent}" font-size="16" font-weight="bold">--%</text>
        
        <text x="240" y="15" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">Volume</text>
        <text x="240" y="35" fill="${p.text}" font-size="16" font-weight="bold">--</text>
      </g>
      
      <!-- Trader -->
      <text x="200" y="215" text-anchor="middle" fill="${p.text}" font-size="14" font-family="'Share Tech Mono', monospace">
        ${data.displayName || data.ensName || 'Anonymous Trader'}
      </text>
      <text x="200" y="235" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.title}
      </text>
      
      <!-- Footer -->
      <text x="200" y="255" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        MCPVOT • DeFi Trading • ERC-1155
      </text>
    `;

    return generateSVGWrapper(content, 400, 280, p);
  },
};

// ============================================================================
// DEFI-003: Yield Farm
// ============================================================================
const defiYield: SVGTemplate = {
  id: 'defi-003',
  name: 'DeFi Yield',
  category: 'defi',
  description: 'Yield farming display',
  palette: palette,
  animations: ['pulse', 'float'],
  layout: 'card',
  width: 380,
  height: 250,
  tags: ['yield', 'farming', 'apy', 'rewards'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'float'], p, options?.animationSpeed);

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
      
      <!-- Card -->
      <rect x="10" y="10" width="360" height="230" rx="12" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Header -->
      <text x="30" y="45" fill="${rankConfig.color}" font-size="18" font-weight="bold" font-family="'Orbitron', sans-serif">
        🌾 Yield Farm
      </text>
      <text x="350" y="40" text-anchor="end" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon}
      </text>
      
      <!-- APY Display -->
      <circle cx="190" cy="120" r="60" fill="${rankConfig.color}" opacity="0.1" class="anim-pulse"/>
      <text x="190" y="110" text-anchor="middle" fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">APY</text>
      <text x="190" y="140" text-anchor="middle" fill="${p.accent}" font-size="28" font-weight="bold" font-family="'Orbitron', sans-serif">
        ---%
      </text>
      
      <!-- Staked -->
      <text x="30" y="200" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">STAKED</text>
      <text x="30" y="220" fill="${rankConfig.color}" font-size="14" font-weight="bold">
        ${data.holdings?.votBalance || '0'} VOT
      </text>
      
      <!-- Rewards -->
      <text x="350" y="200" text-anchor="end" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">REWARDS</text>
      <text x="350" y="220" text-anchor="end" fill="${p.accent}" font-size="14" font-weight="bold">
        0 VOT
      </text>
    `;

    return generateSVGWrapper(content, 380, 250, p);
  },
};

// ============================================================================
// DEFI-004: Liquidity
// ============================================================================
const defiLiquidity: SVGTemplate = {
  id: 'defi-004',
  name: 'DeFi Liquidity',
  category: 'defi',
  description: 'Liquidity position display',
  palette: palette,
  animations: ['gradient', 'pulse'],
  layout: 'card',
  width: 400,
  height: 300,
  tags: ['liquidity', 'lp', 'pool', 'amm'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['gradient', 'pulse'], p, options?.animationSpeed);

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
      
      <!-- Card -->
      <rect x="10" y="10" width="380" height="280" rx="12" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Header -->
      <text x="30" y="45" fill="${rankConfig.color}" font-size="18" font-weight="bold" font-family="'Orbitron', sans-serif">
        💧 Liquidity Position
      </text>
      <text x="370" y="40" text-anchor="end" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- Pool Pair -->
      <g transform="translate(140, 70)">
        <circle cx="30" cy="30" r="25" fill="${rankConfig.color}" opacity="0.3"/>
        <text x="30" y="37" text-anchor="middle" fill="${p.text}" font-size="14" font-weight="bold" font-family="'Share Tech Mono', monospace">VOT</text>
        <circle cx="90" cy="30" r="25" fill="${p.accent}" opacity="0.3"/>
        <text x="90" y="37" text-anchor="middle" fill="${p.text}" font-size="14" font-weight="bold" font-family="'Share Tech Mono', monospace">ETH</text>
        <text x="60" y="37" text-anchor="middle" fill="${cp.secondary}" font-size="20">/</text>
      </g>
      
      <!-- Position Details -->
      <rect x="30" y="140" width="340" height="100" rx="8" fill="${rankConfig.color}" opacity="0.1"/>
      
      <text x="50" y="170" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">Your Liquidity</text>
      <text x="50" y="195" fill="${rankConfig.color}" font-size="18" font-weight="bold">${data.holdings?.votBalance || '0'} LP</text>
      
      <text x="350" y="170" text-anchor="end" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">Pool Share</text>
      <text x="350" y="195" text-anchor="end" fill="${p.accent}" font-size="18" font-weight="bold">0.00%</text>
      
      <text x="200" y="225" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">Fees Earned: 0 VOT</text>
      
      <!-- Footer -->
      <text x="200" y="275" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        MCPVOT • DeFi LP • ${rankConfig.title}
      </text>
    `;

    return generateSVGWrapper(content, 400, 300, p);
  },
};

// ============================================================================
// DEFI-005: Chart
// ============================================================================
const defiChart: SVGTemplate = {
  id: 'defi-005',
  name: 'DeFi Chart',
  category: 'defi',
  description: 'Price chart display',
  palette: palette,
  animations: ['scan', 'gradient'],
  layout: 'dashboard',
  width: 450,
  height: 300,
  tags: ['chart', 'price', 'graph', 'analysis'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['scan', 'gradient'], p, options?.animationSpeed);

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
      
      <!-- Card -->
      <rect x="10" y="10" width="430" height="280" rx="12" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Header -->
      <text x="30" y="40" fill="${p.text}" font-size="18" font-weight="bold" font-family="'Orbitron', sans-serif">
        VOT/USD
      </text>
      <text x="420" y="35" text-anchor="end" fill="${p.accent}" font-size="14" font-family="'Share Tech Mono', monospace">
        $0.00
      </text>
      <text x="420" y="52" text-anchor="end" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- Chart Area -->
      <rect x="30" y="55" width="390" height="180" rx="5" fill="${rankConfig.color}" opacity="0.05"/>
      
      <!-- Fake Chart Line -->
      <polyline 
        points="40,200 80,180 120,190 160,160 200,170 240,140 280,150 320,120 360,130 400,100"
        fill="none" 
        stroke="${rankConfig.color}" 
        stroke-width="2"
      >
        <animate attributeName="stroke-dashoffset" from="500" to="0" dur="2s" fill="freeze"/>
      </polyline>
      
      <!-- Grid Lines -->
      <line x1="30" y1="100" x2="420" y2="100" stroke="${cp.secondary}" stroke-width="0.5" opacity="0.3"/>
      <line x1="30" y1="150" x2="420" y2="150" stroke="${cp.secondary}" stroke-width="0.5" opacity="0.3"/>
      <line x1="30" y1="200" x2="420" y2="200" stroke="${cp.secondary}" stroke-width="0.5" opacity="0.3"/>
      
      <!-- Time Labels -->
      <text x="40" y="250" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">1D</text>
      <text x="140" y="250" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">1W</text>
      <text x="240" y="250" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">1M</text>
      <text x="340" y="250" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">1Y</text>
      
      <!-- Footer -->
      <text x="225" y="275" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        MCPVOT • Price Chart • ${rankConfig.title}
      </text>
    `;

    return generateSVGWrapper(content, 450, 300, p);
  },
};

// ============================================================================
// DEFI-006: Wallet
// ============================================================================
const defiWallet: SVGTemplate = {
  id: 'defi-006',
  name: 'DeFi Wallet',
  category: 'defi',
  description: 'Wallet balance display',
  palette: palette,
  animations: ['pulse', 'shimmer'],
  layout: 'card',
  width: 380,
  height: 220,
  tags: ['wallet', 'balance', 'assets', 'holdings'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'shimmer'], p, options?.animationSpeed);

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
      
      <!-- Card -->
      <rect x="10" y="10" width="360" height="200" rx="15" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Wallet Icon -->
      <rect x="30" y="30" width="50" height="40" rx="8" fill="${rankConfig.color}" opacity="0.2"/>
      <text x="55" y="57" text-anchor="middle" fill="${rankConfig.color}" font-size="20">💳</text>
      
      <!-- Address -->
      <text x="95" y="42" fill="${p.text}" font-size="14" font-weight="bold" font-family="'Share Tech Mono', monospace">
        ${data.displayName || data.ensName || 'My Wallet'}
      </text>
      <text x="95" y="60" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${data.address?.slice(0, 18)}... • ${rankConfig.icon}
      </text>
      
      <!-- Balance -->
      <text x="30" y="100" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">TOTAL BALANCE</text>
      <text x="30" y="130" fill="${rankConfig.color}" font-size="28" font-weight="bold" font-family="'Orbitron', sans-serif" class="anim-pulse">
        ${data.holdings?.votBalance || '0'} VOT
      </text>
      
      <!-- Quick Actions -->
      <g transform="translate(30, 155)">
        <rect x="0" y="0" width="70" height="25" rx="5" fill="${rankConfig.color}" opacity="0.2"/>
        <text x="35" y="17" text-anchor="middle" fill="${rankConfig.color}" font-size="10" font-family="'Share Tech Mono', monospace">Send</text>
        
        <rect x="85" y="0" width="70" height="25" rx="5" fill="${p.accent}" opacity="0.2"/>
        <text x="120" y="17" text-anchor="middle" fill="${p.accent}" font-size="10" font-family="'Share Tech Mono', monospace">Receive</text>
        
        <rect x="170" y="0" width="70" height="25" rx="5" fill="${cp.secondary}" opacity="0.2"/>
        <text x="205" y="17" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">Swap</text>
      </g>
    `;

    return generateSVGWrapper(content, 380, 220, p);
  },
};

// ============================================================================
// DEFI-007: History
// ============================================================================
const defiHistory: SVGTemplate = {
  id: 'defi-007',
  name: 'DeFi History',
  category: 'defi',
  description: 'Transaction history display',
  palette: palette,
  animations: ['scan', 'pulse'],
  layout: 'terminal',
  width: 400,
  height: 320,
  tags: ['history', 'transactions', 'activity', 'log'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['scan', 'pulse'], p, options?.animationSpeed);

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
      
      <!-- Terminal -->
      <rect x="10" y="10" width="380" height="300" rx="10" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Header Bar -->
      <rect x="10" y="10" width="380" height="30" rx="10" fill="${rankConfig.color}" opacity="0.2"/>
      <circle cx="30" cy="25" r="6" fill="#FF5F56"/>
      <circle cx="50" cy="25" r="6" fill="#FFBD2E"/>
      <circle cx="70" cy="25" r="6" fill="#27CA40"/>
      <text x="200" y="30" text-anchor="middle" fill="${p.text}" font-size="11" font-family="'Share Tech Mono', monospace">
        Transaction History • ${rankConfig.icon}
      </text>
      
      <!-- Transactions -->
      <g font-family="'Share Tech Mono', monospace" font-size="10">
        <text x="25" y="60" fill="${cp.secondary}">[--:--]</text>
        <text x="80" y="60" fill="${p.accent}">SWAP</text>
        <text x="130" y="60" fill="${p.text}">-- VOT → -- ETH</text>
        
        <text x="25" y="85" fill="${cp.secondary}">[--:--]</text>
        <text x="80" y="85" fill="${rankConfig.color}">SEND</text>
        <text x="130" y="85" fill="${p.text}">-- VOT → 0x...</text>
        
        <text x="25" y="110" fill="${cp.secondary}">[--:--]</text>
        <text x="80" y="110" fill="${p.accent}">RECV</text>
        <text x="130" y="110" fill="${p.text}">-- VOT from 0x...</text>
        
        <text x="25" y="135" fill="${cp.secondary}">[--:--]</text>
        <text x="80" y="135" fill="${rankConfig.color}">MINT</text>
        <text x="130" y="135" fill="${p.text}">NFT #-- minted</text>
      </g>
      
      <!-- Current Balance -->
      <rect x="25" y="220" width="350" height="50" rx="8" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="40" y="245" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">Current Balance</text>
      <text x="40" y="260" fill="${rankConfig.color}" font-size="14" font-weight="bold">${data.holdings?.votBalance || '0'} VOT</text>
      <text x="360" y="255" text-anchor="end" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">${data.address?.slice(0, 10)}...</text>
      
      <!-- Footer -->
      <text x="200" y="295" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        MCPVOT • DeFi History • ${rankConfig.title}
      </text>
    `;

    return generateSVGWrapper(content, 400, 320, p);
  },
};

// ============================================================================
// DEFI-008: Earnings
// ============================================================================
const defiEarnings: SVGTemplate = {
  id: 'defi-008',
  name: 'DeFi Earnings',
  category: 'defi',
  description: 'Earnings summary display',
  palette: palette,
  animations: ['pulse', 'gradient'],
  layout: 'card',
  width: 380,
  height: 280,
  tags: ['earnings', 'profit', 'income', 'rewards'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'gradient'], p, options?.animationSpeed);

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
      
      <!-- Card -->
      <rect x="10" y="10" width="360" height="260" rx="12" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Header -->
      <text x="30" y="45" fill="${rankConfig.color}" font-size="18" font-weight="bold" font-family="'Orbitron', sans-serif">
        💰 Earnings
      </text>
      <text x="350" y="40" text-anchor="end" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- Total Earnings -->
      <rect x="30" y="60" width="320" height="80" rx="10" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="50" y="90" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">TOTAL EARNED</text>
      <text x="50" y="125" fill="${p.accent}" font-size="32" font-weight="bold" font-family="'Orbitron', sans-serif" class="anim-pulse">
        0 VOT
      </text>
      
      <!-- Breakdown -->
      <g transform="translate(30, 160)">
        <text x="0" y="15" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">Trading</text>
        <text x="0" y="35" fill="${p.text}" font-size="14">0 VOT</text>
        
        <text x="120" y="15" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">Staking</text>
        <text x="120" y="35" fill="${p.text}" font-size="14">0 VOT</text>
        
        <text x="240" y="15" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">LP Fees</text>
        <text x="240" y="35" fill="${p.text}" font-size="14">0 VOT</text>
      </g>
      
      <!-- User -->
      <text x="190" y="230" text-anchor="middle" fill="${p.text}" font-size="12" font-family="'Share Tech Mono', monospace">
        ${data.displayName || data.ensName || data.address?.slice(0, 12)}
      </text>
      
      <!-- Footer -->
      <text x="190" y="255" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        MCPVOT • DeFi Earnings • ${rankConfig.title}
      </text>
    `;

    return generateSVGWrapper(content, 380, 280, p);
  },
};

// ============================================================================
// DEFI-009: Risk Score
// ============================================================================
const defiRisk: SVGTemplate = {
  id: 'defi-009',
  name: 'DeFi Risk',
  category: 'defi',
  description: 'Risk assessment display',
  palette: palette,
  animations: ['pulse', 'breathe'],
  layout: 'centered',
  width: 350,
  height: 350,
  tags: ['risk', 'score', 'assessment', 'safety'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'breathe'], p, options?.animationSpeed);

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
      
      <!-- Card -->
      <rect x="10" y="10" width="330" height="330" rx="15" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Header -->
      <text x="175" y="45" text-anchor="middle" fill="${p.text}" font-size="18" font-weight="bold" font-family="'Orbitron', sans-serif">
        🛡️ Risk Score
      </text>
      <text x="175" y="65" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- Score Circle -->
      <circle cx="175" cy="165" r="80" fill="none" stroke="${cp.secondary}" stroke-width="8" opacity="0.2"/>
      <circle cx="175" cy="165" r="80" fill="none" stroke="${rankConfig.color}" stroke-width="8" 
              stroke-dasharray="380" stroke-dashoffset="190" stroke-linecap="round" class="anim-pulse"/>
      
      <!-- Score -->
      <text x="175" y="155" text-anchor="middle" fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">SCORE</text>
      <text x="175" y="185" text-anchor="middle" fill="${rankConfig.color}" font-size="36" font-weight="bold" font-family="'Orbitron', sans-serif">--</text>
      
      <!-- Risk Level -->
      <rect x="100" y="265" width="150" height="30" rx="15" fill="${rankConfig.color}" opacity="0.2"/>
      <text x="175" y="285" text-anchor="middle" fill="${rankConfig.color}" font-size="11" font-weight="bold" font-family="'Share Tech Mono', monospace">
        CALCULATING...
      </text>
      
      <!-- User -->
      <text x="175" y="320" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${data.address?.slice(0, 20)}...
      </text>
    `;

    return generateSVGWrapper(content, 350, 350, p);
  },
};

// ============================================================================
// DEFI-010: Ultimate
// ============================================================================
const defiUltimate: SVGTemplate = {
  id: 'defi-010',
  name: 'DeFi Ultimate',
  category: 'defi',
  description: 'Ultimate DeFi dashboard with cyberpunk rank',
  palette: palette,
  animations: ['pulse', 'shimmer', 'gradient'],
  layout: 'hero',
  width: 500,
  height: 500,
  tags: ['ultimate', 'dashboard', 'complete', 'showcase', 'cyberpunk'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'shimmer', 'gradient'], p, options?.animationSpeed);
    const border = generateGlowingBorder(p, 500, 500, 3);

    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    const rankBadge = generateRankBadge(rank, 415, 15, 'medium');
    const circuit = generateCircuitBoard(cp, 500, 500);

    const content = `
      ${animations}
      <defs>
        <linearGradient id="defi-ultimate-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${rankConfig.color}"/>
          <stop offset="100%" style="stop-color:${p.accent}"/>
        </linearGradient>
      </defs>
      
      ${border}
      
      <!-- Background effect -->
      <g opacity="0.03">${circuit}</g>
      
      <!-- Rank Badge -->
      ${rankBadge}
      
      <!-- Header -->
      <text x="250" y="50" text-anchor="middle" fill="url(#defi-ultimate-grad)" font-size="24" font-weight="bold" font-family="'Orbitron', sans-serif">
        💹 DeFi Dashboard
      </text>
      <text x="250" y="75" text-anchor="middle" fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">
        ${data.displayName || data.ensName || 'Anonymous Trader'} • ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- Portfolio Value -->
      <rect x="30" y="95" width="440" height="100" rx="12" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="50" y="130" fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">PORTFOLIO VALUE</text>
      <text x="50" y="170" fill="${rankConfig.color}" font-size="36" font-weight="bold" font-family="'Orbitron', sans-serif" class="anim-pulse">
        ${data.holdings?.votBalance || '0'} VOT
      </text>
      <text x="450" y="170" text-anchor="end" fill="${p.accent}" font-size="14" font-family="'Share Tech Mono', monospace">+0.00%</text>
      
      <!-- Stats Grid -->
      <g transform="translate(30, 215)">
        <rect x="0" y="0" width="140" height="70" rx="8" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="1"/>
        <text x="70" y="25" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">24H Volume</text>
        <text x="70" y="50" text-anchor="middle" fill="${p.text}" font-size="16" font-weight="bold">--</text>
        
        <rect x="150" y="0" width="140" height="70" rx="8" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="1"/>
        <text x="220" y="25" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">Trades</text>
        <text x="220" y="50" text-anchor="middle" fill="${p.text}" font-size="16" font-weight="bold">--</text>
        
        <rect x="300" y="0" width="140" height="70" rx="8" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="1"/>
        <text x="370" y="25" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">Win Rate</text>
        <text x="370" y="50" text-anchor="middle" fill="${p.accent}" font-size="16" font-weight="bold">--%</text>
      </g>
      
      <!-- Mini Chart -->
      <rect x="30" y="305" width="440" height="100" rx="8" fill="${rankConfig.color}" opacity="0.05"/>
      <polyline 
        points="50,380 100,360 150,370 200,340 250,350 300,320 350,335 400,310 450,320"
        fill="none" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Holdings -->
      <g transform="translate(30, 420)">
        <text x="0" y="15" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">VOT</text>
        <text x="0" y="35" fill="${rankConfig.color}" font-size="14" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
        
        <text x="150" y="15" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">MAXX</text>
        <text x="150" y="35" fill="${p.text}" font-size="14" font-weight="bold">${data.holdings?.maxxBalance || '0'}</text>
        
        <text x="300" y="15" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">Warplet</text>
        <text x="300" y="35" fill="${data.holdings?.hasWarplet ? rankConfig.color : cp.secondary}" font-size="14" font-weight="bold">
          ${data.holdings?.hasWarplet ? '✓' : '○'}
        </text>
      </g>
      
      <!-- Footer -->
      <text x="250" y="485" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        MCPVOT • DeFi Ultimate • ${rankConfig.icon} ${rankConfig.name} • ERC-1155
      </text>
    `;

    return generateSVGWrapper(content, 500, 500, p);
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export const defiTemplates: SVGTemplate[] = [
  defiPortfolio,
  defiTrading,
  defiYield,
  defiLiquidity,
  defiChart,
  defiWallet,
  defiHistory,
  defiEarnings,
  defiRisk,
  defiUltimate,
];