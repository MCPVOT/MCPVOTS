/**
 * VOT Templates (10)
 * VOT ecosystem branded - Orange/Gold gradient theme
 * 🟠 vot-001 to vot-010
 */

import {
    CATEGORY_PALETTES,
    generateCircuitBoard,
    generateDataRain,
    generateScanlines
} from '../../../cyberpunk-palette';
import {
    calculateRank,
    generateAnimationStyles,
    generateBurnEffect,
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

const palette = PALETTES['vot-gradient'];
const cyberpunkPalette = CATEGORY_PALETTES['vot'];

// ============================================================================
// VOT-001: Token Card
// ============================================================================
const votTokenCard: SVGTemplate = {
  id: 'vot-001',
  name: 'VOT Token Card',
  category: 'vot',
  description: 'VOT token holder card with balance display',
  palette: palette,
  animations: ['pulse', 'gradient'],
  layout: 'card',
  width: 400,
  height: 250,
  tags: ['vot', 'token', 'holder', 'card'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse', 'gradient'], p, options?.animationSpeed);

    const content = `
      ${animations}
      <defs>
        <linearGradient id="vot-grad-001" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${p.primary}"/>
          <stop offset="100%" style="stop-color:${p.accent}"/>
        </linearGradient>
      </defs>
      
      <!-- Card -->
      <rect x="10" y="10" width="380" height="230" rx="15" fill="${p.background}" stroke="url(#vot-grad-001)" stroke-width="2"/>
      
      <!-- VOT Logo -->
      <circle cx="60" cy="60" r="30" fill="${p.primary}" opacity="0.3" class="anim-pulse"/>
      <text x="60" y="68" text-anchor="middle" fill="${p.primary}" font-size="20" font-weight="bold">VOT</text>
      
      <!-- Name -->
      <text x="110" y="55" fill="${p.text}" font-size="22" font-weight="bold" font-family="system-ui">
        ${data.displayName || data.ensName || 'VOT Holder'}
      </text>
      <text x="110" y="78" fill="${p.secondary}" font-size="12" font-family="monospace">
        ${data.address?.slice(0, 20)}...
      </text>
      
      <!-- Balance -->
      <text x="30" y="140" fill="${p.secondary}" font-size="12" font-family="system-ui">VOT Balance</text>
      <text x="30" y="170" fill="${p.accent}" font-size="28" font-weight="bold" font-family="system-ui" class="anim-pulse">
        ${data.holdings?.votBalance || '0'}
      </text>
      
      <!-- Footer -->
      <line x1="30" y1="200" x2="370" y2="200" stroke="${p.primary}" stroke-opacity="0.3"/>
      <text x="200" y="225" text-anchor="middle" fill="${p.secondary}" font-size="10">VOT Ecosystem • ERC-4804</text>
    `;

    return generateSVGWrapper(content, 400, 250, p);
  },
};

// ============================================================================
// VOT-002: Holder Badge
// ============================================================================
const votHolderBadge: SVGTemplate = {
  id: 'vot-002',
  name: 'VOT Holder Badge',
  category: 'vot',
  description: 'Circular holder verification badge',
  palette: palette,
  animations: ['rotate', 'pulse'],
  layout: 'centered',
  width: 300,
  height: 300,
  tags: ['vot', 'badge', 'holder', 'verified'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['rotate', 'pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      <defs>
        <linearGradient id="vot-badge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${p.primary}"/>
          <stop offset="50%" style="stop-color:${p.accent}"/>
          <stop offset="100%" style="stop-color:${p.secondary}"/>
        </linearGradient>
      </defs>
      
      <!-- Outer Ring -->
      <circle cx="150" cy="150" r="130" fill="none" stroke="url(#vot-badge-grad)" stroke-width="4" class="anim-rotate" style="transform-origin: center;"/>
      <circle cx="150" cy="150" r="115" fill="${p.background}" stroke="${p.primary}" stroke-width="2"/>
      
      <!-- Inner Content -->
      <circle cx="150" cy="150" r="80" fill="${p.primary}" opacity="0.1" class="anim-pulse"/>
      <text x="150" y="130" text-anchor="middle" fill="${p.primary}" font-size="32" font-weight="bold">VOT</text>
      <text x="150" y="160" text-anchor="middle" fill="${p.text}" font-size="14">HOLDER</text>
      <text x="150" y="185" text-anchor="middle" fill="${p.accent}" font-size="18" font-weight="bold">
        ${data.holdings?.votBalance || '0'}
      </text>
      
      <!-- Verified Check -->
      <circle cx="220" cy="80" r="20" fill="${p.accent}"/>
      <text x="220" y="87" text-anchor="middle" fill="${p.background}" font-size="20">✓</text>
    `;

    return generateSVGWrapper(content, 300, 300, p);
  },
};

// ============================================================================
// VOT-003: Ecosystem Dashboard with x402 Flow
// ============================================================================
const votDashboard: SVGTemplate = {
  id: 'vot-003',
  name: 'VOT Dashboard',
  category: 'vot',
  description: 'Full ecosystem stats dashboard with x402 flow',
  palette: palette,
  animations: ['pulse', 'float'],
  layout: 'dashboard',
  width: 500,
  height: 450,
  tags: ['vot', 'dashboard', 'stats', 'ecosystem', 'x402'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse', 'float'], p, options?.animationSpeed);
    
    // Generate x402 payment flow
    const paymentFlow = generatePaymentFlow(p, 460);
    
    // Generate stats grid
    const statsGrid = generateStatsGrid(p, [
      { label: 'VOT Balance', value: data.holdings?.votBalance || '0', icon: '🟠' },
      { label: 'MAXX Balance', value: data.holdings?.maxxBalance || '0', icon: '💎' },
      { label: 'Status', value: data.holdings?.hasWarplet ? 'ACTIVE' : 'PENDING', icon: '✓' },
      { label: 'Burned', value: '1%', icon: '🔥' },
    ]);

    const content = `
      ${animations}
      
      <!-- Background -->
      <rect x="10" y="10" width="480" height="430" rx="15" fill="${p.background}" stroke="${p.primary}" stroke-width="2"/>
      
      <!-- Header -->
      <rect x="20" y="20" width="460" height="50" rx="8" fill="${p.primary}" opacity="0.2"/>
      <text x="40" y="52" fill="${p.text}" font-size="20" font-weight="bold">🟠 VOT Ecosystem</text>
      <text x="400" y="52" fill="${p.accent}" font-size="14">${data.displayName || 'User'}</text>
      
      <!-- x402 Payment Flow -->
      <g transform="translate(20, 85)">
        <text x="0" y="0" fill="${p.secondary}" font-size="11">x402 Payment Flow</text>
        <g transform="translate(0, 15)">
          ${paymentFlow}
        </g>
      </g>
      
      <!-- Stats Grid -->
      <g transform="translate(20, 180)">
        ${statsGrid}
      </g>
      
      <!-- Profile Section -->
      <rect x="20" y="330" width="460" height="70" rx="8" fill="${p.primary}" opacity="0.05"/>
      <circle cx="60" cy="365" r="25" fill="${p.primary}" opacity="0.3"/>
      <text x="60" y="373" text-anchor="middle" fill="${p.text}" font-size="20">👤</text>
      <text x="100" y="355" fill="${p.text}" font-size="14" font-weight="bold">${data.displayName || data.ensName || 'VOT Member'}</text>
      <text x="100" y="375" fill="${p.secondary}" font-size="11" font-family="monospace">${data.address?.slice(0, 24)}...</text>
      <text x="100" y="392" fill="${p.secondary}" font-size="10">${data.subtitle || 'VOT Ecosystem Participant'}</text>
      
      <!-- Footer -->
      <line x1="20" y1="415" x2="480" y2="415" stroke="${p.primary}" stroke-opacity="0.3"/>
      <text x="250" y="435" text-anchor="middle" fill="${p.secondary}" font-size="10">MCPVOT • x402 Facilitator • ERC-4804 • IPFS Pinned</text>
    `;

    return generateSVGWrapper(content, 500, 450, p);
  },
};

// ============================================================================
// VOT-004: Minimal Profile
// ============================================================================
const votMinimalProfile: SVGTemplate = {
  id: 'vot-004',
  name: 'VOT Minimal',
  category: 'vot',
  description: 'Clean minimal VOT profile',
  palette: palette,
  animations: ['breathe'],
  layout: 'minimal',
  width: 350,
  height: 200,
  tags: ['vot', 'minimal', 'clean', 'profile'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['breathe'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <rect x="10" y="10" width="330" height="180" rx="10" fill="${p.background}" stroke="${p.primary}" stroke-width="1"/>
      
      <text x="30" y="55" fill="${p.primary}" font-size="14" font-weight="bold">VOT</text>
      <text x="30" y="90" fill="${p.text}" font-size="20" font-weight="300">${data.displayName || data.ensName || 'Anonymous'}</text>
      <text x="30" y="120" fill="${p.accent}" font-size="24" font-weight="bold" class="anim-breathe">${data.holdings?.votBalance || '0'}</text>
      <text x="30" y="145" fill="${p.secondary}" font-size="11">VOT Balance</text>
      
      <text x="30" y="175" fill="${p.secondary}" font-size="9" font-family="monospace">${data.address?.slice(0, 30)}...</text>
    `;

    return generateSVGWrapper(content, 350, 200, p);
  },
};

// ============================================================================
// VOT-005: Social Card
// ============================================================================
const votSocialCard: SVGTemplate = {
  id: 'vot-005',
  name: 'VOT Social',
  category: 'vot',
  description: 'Social profile card with links',
  palette: palette,
  animations: ['pulse', 'float'],
  layout: 'social',
  width: 400,
  height: 300,
  tags: ['vot', 'social', 'links', 'profile'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse', 'float'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <rect x="10" y="10" width="380" height="280" rx="15" fill="${p.background}" stroke="${p.primary}" stroke-width="2"/>
      
      <!-- Avatar -->
      <circle cx="200" cy="70" r="40" fill="${p.primary}" opacity="0.3" class="anim-pulse"/>
      <text x="200" y="80" text-anchor="middle" fill="${p.text}" font-size="32">👤</text>
      
      <!-- Name -->
      <text x="200" y="135" text-anchor="middle" fill="${p.text}" font-size="20" font-weight="bold">
        ${data.displayName || data.ensName || 'VOT User'}
      </text>
      <text x="200" y="160" text-anchor="middle" fill="${p.secondary}" font-size="12">
        ${data.subtitle || 'VOT Ecosystem'}
      </text>
      
      <!-- Balance -->
      <text x="200" y="195" text-anchor="middle" fill="${p.accent}" font-size="24" font-weight="bold">
        ${data.holdings?.votBalance || '0'} VOT
      </text>
      
      <!-- Social Links -->
      <g class="anim-float">
        ${data.links?.twitter ? `<text x="100" y="240" fill="${p.secondary}" font-size="20">🐦</text>` : ''}
        ${data.links?.github ? `<text x="150" y="240" fill="${p.secondary}" font-size="20">💻</text>` : ''}
        ${data.links?.farcaster ? `<text x="200" y="240" fill="${p.secondary}" font-size="20">🟣</text>` : ''}
        ${data.links?.discord ? `<text x="250" y="240" fill="${p.secondary}" font-size="20">💬</text>` : ''}
        ${data.links?.website ? `<text x="300" y="240" fill="${p.secondary}" font-size="20">🌐</text>` : ''}
      </g>
      
      <text x="200" y="275" text-anchor="middle" fill="${p.secondary}" font-size="9" font-family="monospace">${data.address?.slice(0, 20)}...</text>
    `;

    return generateSVGWrapper(content, 400, 300, p);
  },
};

// ============================================================================
// VOT-006: Terminal Style
// ============================================================================
const votTerminal: SVGTemplate = {
  id: 'vot-006',
  name: 'VOT Terminal',
  category: 'vot',
  description: 'Hacker terminal style',
  palette: palette,
  animations: ['typewriter', 'flicker'],
  layout: 'terminal',
  width: 450,
  height: 300,
  tags: ['vot', 'terminal', 'hacker', 'code'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['typewriter', 'flicker'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Terminal Window -->
      <rect x="10" y="10" width="430" height="280" rx="8" fill="#0D0D0D" stroke="${p.primary}" stroke-width="2"/>
      
      <!-- Title Bar -->
      <rect x="10" y="10" width="430" height="30" rx="8" fill="${p.primary}" opacity="0.3"/>
      <circle cx="30" cy="25" r="6" fill="#FF5F56"/>
      <circle cx="50" cy="25" r="6" fill="#FFBD2E"/>
      <circle cx="70" cy="25" r="6" fill="#27CA40"/>
      <text x="225" y="30" text-anchor="middle" fill="${p.text}" font-size="12">vot-terminal</text>
      
      <!-- Terminal Content -->
      <text x="25" y="65" fill="${p.primary}" font-size="12" font-family="monospace">$ vot status</text>
      <text x="25" y="90" fill="${p.accent}" font-size="12" font-family="monospace" class="anim-typewriter">
        ✓ Connected: ${data.address?.slice(0, 16)}...
      </text>
      <text x="25" y="115" fill="${p.text}" font-size="12" font-family="monospace">
        User: ${data.displayName || data.ensName || 'anon'}
      </text>
      <text x="25" y="140" fill="${p.text}" font-size="12" font-family="monospace">
        VOT Balance: ${data.holdings?.votBalance || '0'}
      </text>
      <text x="25" y="165" fill="${p.text}" font-size="12" font-family="monospace">
        MAXX Balance: ${data.holdings?.maxxBalance || '0'}
      </text>
      <text x="25" y="200" fill="${p.primary}" font-size="12" font-family="monospace">$ _</text>
      
      <!-- Blinking Cursor -->
      <rect x="40" y="188" width="8" height="14" fill="${p.primary}" class="anim-flicker"/>
      
      <text x="225" y="275" text-anchor="middle" fill="${p.secondary}" font-size="9">VOT Ecosystem Terminal v1.0</text>
    `;

    return generateSVGWrapper(content, 450, 300, p);
  },
};

// ============================================================================
// VOT-007: Stats Grid
// ============================================================================
const votStatsGrid: SVGTemplate = {
  id: 'vot-007',
  name: 'VOT Stats Grid',
  category: 'vot',
  description: 'Multi-stat grid display',
  palette: palette,
  animations: ['pulse', 'wave'],
  layout: 'grid',
  width: 400,
  height: 400,
  tags: ['vot', 'stats', 'grid', 'data'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse', 'wave'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <rect x="10" y="10" width="380" height="380" rx="15" fill="${p.background}" stroke="${p.primary}" stroke-width="2"/>
      
      <!-- Header -->
      <text x="200" y="45" text-anchor="middle" fill="${p.text}" font-size="18" font-weight="bold">VOT Stats</text>
      <text x="200" y="65" text-anchor="middle" fill="${p.secondary}" font-size="11">${data.displayName || data.ensName || 'User'}</text>
      
      <!-- Grid 2x2 -->
      <rect x="25" y="85" width="165" height="130" rx="10" fill="${p.primary}" opacity="0.1"/>
      <text x="107" y="130" text-anchor="middle" fill="${p.secondary}" font-size="11">VOT Balance</text>
      <text x="107" y="175" text-anchor="middle" fill="${p.accent}" font-size="28" font-weight="bold" class="anim-pulse">${data.holdings?.votBalance || '0'}</text>
      
      <rect x="210" y="85" width="165" height="130" rx="10" fill="${p.primary}" opacity="0.1"/>
      <text x="292" y="130" text-anchor="middle" fill="${p.secondary}" font-size="11">MAXX Balance</text>
      <text x="292" y="175" text-anchor="middle" fill="${p.text}" font-size="28" font-weight="bold">${data.holdings?.maxxBalance || '0'}</text>
      
      <rect x="25" y="230" width="165" height="130" rx="10" fill="${p.primary}" opacity="0.1"/>
      <text x="107" y="275" text-anchor="middle" fill="${p.secondary}" font-size="11">Warplet</text>
      <text x="107" y="320" text-anchor="middle" fill="${data.holdings?.hasWarplet ? p.accent : p.secondary}" font-size="24">${data.holdings?.hasWarplet ? '✓ Yes' : '✗ No'}</text>
      
      <rect x="210" y="230" width="165" height="130" rx="10" fill="${p.primary}" opacity="0.1"/>
      <text x="292" y="275" text-anchor="middle" fill="${p.secondary}" font-size="11">Farcaster</text>
      <text x="292" y="320" text-anchor="middle" fill="${data.holdings?.hasFarcaster ? p.accent : p.secondary}" font-size="24">${data.holdings?.hasFarcaster ? '✓ Yes' : '✗ No'}</text>
    `;

    return generateSVGWrapper(content, 400, 400, p);
  },
};

// ============================================================================
// VOT-008: Hero Banner
// ============================================================================
const votHeroBanner: SVGTemplate = {
  id: 'vot-008',
  name: 'VOT Hero',
  category: 'vot',
  description: 'Wide hero banner style',
  palette: palette,
  animations: ['gradient', 'float'],
  layout: 'hero',
  width: 600,
  height: 250,
  tags: ['vot', 'hero', 'banner', 'wide'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['gradient', 'float'], p, options?.animationSpeed);

    const content = `
      ${animations}
      <defs>
        <linearGradient id="vot-hero-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${p.primary}"/>
          <stop offset="50%" style="stop-color:${p.accent}"/>
          <stop offset="100%" style="stop-color:${p.secondary}"/>
        </linearGradient>
      </defs>
      
      <rect x="10" y="10" width="580" height="230" rx="15" fill="${p.background}" stroke="url(#vot-hero-grad)" stroke-width="3"/>
      
      <!-- VOT Branding -->
      <text x="50" y="80" fill="${p.primary}" font-size="48" font-weight="bold" class="anim-float">VOT</text>
      <text x="50" y="110" fill="${p.secondary}" font-size="14">Voice of Tomorrow</text>
      
      <!-- User Info -->
      <text x="300" y="70" fill="${p.text}" font-size="24" font-weight="bold">${data.displayName || data.ensName || 'VOT Member'}</text>
      <text x="300" y="100" fill="${p.secondary}" font-size="12" font-family="monospace">${data.address || '0x...'}</text>
      
      <!-- Stats -->
      <text x="300" y="150" fill="${p.secondary}" font-size="12">Balance</text>
      <text x="300" y="180" fill="${p.accent}" font-size="32" font-weight="bold">${data.holdings?.votBalance || '0'} VOT</text>
      
      <text x="300" y="220" fill="${p.secondary}" font-size="10">MCPVOT Ecosystem • ERC-4804</text>
    `;

    return generateSVGWrapper(content, 600, 250, p);
  },
};

// ============================================================================
// VOT-009: Compact Badge
// ============================================================================
const votCompact: SVGTemplate = {
  id: 'vot-009',
  name: 'VOT Compact',
  category: 'vot',
  description: 'Small compact badge',
  palette: palette,
  animations: ['pulse'],
  layout: 'minimal',
  width: 200,
  height: 80,
  tags: ['vot', 'compact', 'small', 'badge'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <rect x="5" y="5" width="190" height="70" rx="8" fill="${p.background}" stroke="${p.primary}" stroke-width="1"/>
      
      <circle cx="35" cy="40" r="20" fill="${p.primary}" opacity="0.3" class="anim-pulse"/>
      <text x="35" y="46" text-anchor="middle" fill="${p.primary}" font-size="12" font-weight="bold">VOT</text>
      
      <text x="65" y="35" fill="${p.text}" font-size="12" font-weight="bold">${(data.displayName || data.ensName || 'User').slice(0, 12)}</text>
      <text x="65" y="55" fill="${p.accent}" font-size="14" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
    `;

    return generateSVGWrapper(content, 200, 80, p);
  },
};

// ============================================================================
// VOT-010: Ultimate Showcase with Cyberpunk Rank System
// ============================================================================
const votUltimate: SVGTemplate = {
  id: 'vot-010',
  name: 'VOT Ultimate',
  category: 'vot',
  description: 'Premium showcase with cyberpunk rank system and burn mechanics',
  palette: palette,
  animations: ['pulse', 'gradient', 'float', 'shimmer'],
  layout: 'dashboard',
  width: 500,
  height: 550,
  tags: ['vot', 'ultimate', 'premium', 'showcase', 'burn', 'rank', 'cyberpunk'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'gradient', 'float', 'shimmer'], p, options?.animationSpeed);
    const border = generateGlowingBorder(p, 500, 550, 3);
    
    // Calculate cyberpunk rank based on holdings
    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename,
    });
    
    const rankConfig = RANK_CONFIG[rank];
    const rankBadge = generateRankBadge(rank, 400, 10, 'medium');
    const burnEffect = generateBurnEffect(p, 440, 240, 0.6);
    const balance = parseFloat(data.holdings?.votBalance || '0');
    const progressBar = generateProgressBar(p, Math.min(balance / 10000, 100), 200, 'Burn Progress');
    
    // Cyberpunk effects
    const dataRain = generateDataRain(cp, 500, 550);
    const scanlines = generateScanlines(500, 550);
    const circuit = generateCircuitBoard(cp, 500, 550);

    const content = `
      ${animations}
      ${border}
      <defs>
        <linearGradient id="vot-ult-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${cp.primary}"/>
          <stop offset="50%" style="stop-color:${cp.accent}"/>
          <stop offset="100%" style="stop-color:${cp.secondary}"/>
        </linearGradient>
        <filter id="rank-glow">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feFlood flood-color="${rankConfig.glowColor}" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Cyberpunk Background Effects -->
      <g opacity="0.15">${circuit}</g>
      <g opacity="0.1">${dataRain}</g>
      
      <!-- Rank Badge -->
      ${rankBadge}
      
      <!-- Header with Rank Color -->
      <rect x="20" y="20" width="370" height="80" rx="10" fill="${rankConfig.color}" opacity="0.15"/>
      <text x="200" y="50" text-anchor="middle" fill="${rankConfig.color}" font-size="24" font-weight="bold" font-family="'Share Tech Mono', monospace" class="anim-float" filter="url(#rank-glow)">
        ${rankConfig.icon} VOT PROTOCOL
      </text>
      <text x="200" y="75" text-anchor="middle" fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">
        RANK: ${rankConfig.name} • ${rankConfig.title}
      </text>
      
      <!-- Avatar Section -->
      <circle cx="250" cy="160" r="45" fill="${rankConfig.color}" opacity="0.2" class="anim-pulse"/>
      <circle cx="250" cy="160" r="40" stroke="${rankConfig.color}" stroke-width="2" fill="none">
        <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
      </circle>
      <text x="250" y="175" text-anchor="middle" fill="${p.text}" font-size="40">👤</text>
      
      <!-- Burn Effect -->
      ${burnEffect}
      
      <!-- Name -->
      <text x="250" y="235" text-anchor="middle" fill="${cp.primary}" font-size="20" font-weight="bold" font-family="'Share Tech Mono', monospace">
        ${data.displayName || data.ensName || 'ANONYMOUS'}
      </text>
      <text x="250" y="258" text-anchor="middle" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">
        ${rankConfig.description}
      </text>
      
      <!-- Balance Display -->
      <rect x="100" y="280" width="300" height="70" rx="8" fill="${cp.background}" stroke="${rankConfig.color}" stroke-width="1" opacity="0.9"/>
      <text x="250" y="305" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">VOT HOLDINGS</text>
      <text x="250" y="338" text-anchor="middle" fill="${cp.primary}" font-size="32" font-weight="bold" font-family="'Share Tech Mono', monospace" filter="url(#rank-glow)">
        ${data.holdings?.votBalance || '0'}
      </text>
      
      <!-- Burn Progress -->
      <g transform="translate(150, 365)">
        ${progressBar}
      </g>
      
      <!-- Credential Icons -->
      <g transform="translate(0, 400)">
        <rect x="50" y="10" width="400" height="60" rx="8" fill="${cp.background}" opacity="0.5"/>
        <text x="250" y="25" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">CREDENTIALS</text>
        
        <!-- Warplet -->
        <g transform="translate(90, 35)">
          <circle r="18" fill="${data.holdings?.hasWarplet ? cp.primary : '#333'}" opacity="0.3"/>
          <text y="6" text-anchor="middle" font-size="18">${data.holdings?.hasWarplet ? '🎫' : '◯'}</text>
          <text y="35" text-anchor="middle" fill="${data.holdings?.hasWarplet ? cp.primary : '#666'}" font-size="8" font-family="'Share Tech Mono', monospace">WARPLET</text>
        </g>
        
        <!-- Farcaster -->
        <g transform="translate(170, 35)">
          <circle r="18" fill="${data.holdings?.hasFarcaster ? '#8a63d2' : '#333'}" opacity="0.3"/>
          <text y="6" text-anchor="middle" font-size="18">${data.holdings?.hasFarcaster ? '🟣' : '◯'}</text>
          <text y="35" text-anchor="middle" fill="${data.holdings?.hasFarcaster ? '#8a63d2' : '#666'}" font-size="8" font-family="'Share Tech Mono', monospace">FARCASTER</text>
        </g>
        
        <!-- ENS/Base -->
        <g transform="translate(250, 35)">
          <circle r="18" fill="${data.ensName || data.basename ? '#5298ff' : '#333'}" opacity="0.3"/>
          <text y="6" text-anchor="middle" font-size="18">${data.ensName || data.basename ? '🔷' : '◯'}</text>
          <text y="35" text-anchor="middle" fill="${data.ensName || data.basename ? '#5298ff' : '#666'}" font-size="8" font-family="'Share Tech Mono', monospace">IDENTITY</text>
        </g>
        
        <!-- MAXX -->
        <g transform="translate(330, 35)">
          <circle r="18" fill="${parseFloat(data.holdings?.maxxBalance || '0') > 0 ? '#ff6600' : '#333'}" opacity="0.3"/>
          <text y="6" text-anchor="middle" font-size="18">${parseFloat(data.holdings?.maxxBalance || '0') > 0 ? '💎' : '◯'}</text>
          <text y="35" text-anchor="middle" fill="${parseFloat(data.holdings?.maxxBalance || '0') > 0 ? '#ff6600' : '#666'}" font-size="8" font-family="'Share Tech Mono', monospace">MAXX</text>
        </g>
        
        <!-- Burn -->
        <g transform="translate(410, 35)">
          <circle r="18" fill="${cp.accent}" opacity="0.3"/>
          <text y="6" text-anchor="middle" font-size="18">🔥</text>
          <text y="35" text-anchor="middle" fill="${cp.accent}" font-size="8" font-family="'Share Tech Mono', monospace">1% BURN</text>
        </g>
      </g>
      
      <!-- Scanlines overlay -->
      <g opacity="0.03">${scanlines}</g>
      
      <!-- Footer -->
      <text x="250" y="500" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        MCPVOT • x402 FACILITATOR • ERC-4804 • IPFS
      </text>
      <text x="250" y="520" text-anchor="middle" fill="${cp.primary}" font-size="8" font-family="'Share Tech Mono', monospace" opacity="0.8">
        ${data.address?.slice(0, 24)}...
      </text>
    `;

    return generateSVGWrapper(content, 500, 550, p);
  },
};

// ============================================================================
// EXPORT
// ============================================================================
export const votTemplates: SVGTemplate[] = [
  votTokenCard,
  votHolderBadge,
  votDashboard,
  votMinimalProfile,
  votSocialCard,
  votTerminal,
  votStatsGrid,
  votHeroBanner,
  votCompact,
  votUltimate,
];
