/**
 * ENS Templates (10)
 * Identity-focused - Blue theme for names and profiles
 * Updated with Cyberpunk Rank System
 * 🔷 ens-001 to ens-010
 */

import {
    calculateRank,
    generateAnimationStyles,
    generateGlowingBorder,
    generateProgressBar,
    generateRankBadge,
    generateStatsGrid,
    generateSVGWrapper,
    RANK_CONFIG
} from '../../animations';
import type { GenerateOptions, SVGTemplate, UserData } from '../../types';
import { PALETTES } from '../../types';
import { CATEGORY_PALETTES, generateCircuitBoard, generateScanlines } from '../../../cyberpunk-palette';

const palette = PALETTES['ens-identity'];
const cyberpunkPalette = CATEGORY_PALETTES['ens'];

// ============================================================================
// ENS-001: Identity Card
// ============================================================================
const ensIdentityCard: SVGTemplate = {
  id: 'ens-001',
  name: 'ENS Identity Card',
  category: 'ens',
  description: 'Professional identity card with ENS branding',
  palette: palette,
  animations: ['pulse', 'gradient'],
  layout: 'card',
  width: 400,
  height: 250,
  tags: ['identity', 'card', 'ens', 'professional'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'gradient'], p, options?.animationSpeed);

    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName || true,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];

    const content = `
      ${animations}
      <defs>
        <linearGradient id="ens-grad-001" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${rankConfig.color}"/>
          <stop offset="100%" style="stop-color:${p.accent}"/>
        </linearGradient>
      </defs>
      
      <!-- Card Background -->
      <rect x="10" y="10" width="380" height="230" rx="15" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- ENS Logo Area -->
      <circle cx="60" cy="60" r="30" fill="${rankConfig.color}" opacity="0.2" class="anim-pulse"/>
      <text x="60" y="68" text-anchor="middle" fill="${rankConfig.color}" font-size="24" font-weight="bold" font-family="'Orbitron', sans-serif">
        ENS
      </text>
      
      <!-- Name Display -->
      <text x="120" y="50" fill="${p.text}" font-size="22" font-weight="bold" font-family="'Share Tech Mono', monospace">
        ${data.ensName || data.basename || data.displayName || 'unnamed.eth'}
      </text>
      <text x="120" y="70" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">
        ${data.address?.slice(0, 20)}...
      </text>
      <text x="120" y="90" fill="${rankConfig.color}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- Bio -->
      <text x="30" y="130" fill="${p.text}" font-size="13" font-family="'Share Tech Mono', monospace">
        ${data.description?.slice(0, 45) || 'Web3 Identity'}
      </text>
      
      <!-- Links -->
      <g transform="translate(30, 150)">
        ${data.links?.twitter ? `<text x="0" y="0" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">𝕏 ${data.links.twitter}</text>` : ''}
        ${data.links?.github ? `<text x="0" y="18" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">⌘ ${data.links.github}</text>` : ''}
        ${data.links?.farcaster ? `<text x="150" y="0" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">🟣 ${data.links.farcaster}</text>` : ''}
      </g>
      
      <!-- Footer -->
      <text x="200" y="225" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        MCPVOT • ENS Identity • ${rankConfig.title}
      </text>
    `;

    return generateSVGWrapper(content, 400, 250, p);
  },
};

// ============================================================================
// ENS-002: Name Badge
// ============================================================================
const ensNameBadge: SVGTemplate = {
  id: 'ens-002',
  name: 'ENS Name Badge',
  category: 'ens',
  description: 'Simple name badge display',
  palette: palette,
  animations: ['pulse', 'shimmer'],
  layout: 'centered',
  width: 300,
  height: 150,
  tags: ['name', 'badge', 'simple', 'ens'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'shimmer'], p, options?.animationSpeed);

    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName || true,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];

    const content = `
      ${animations}
      
      <!-- Badge Background -->
      <rect x="10" y="10" width="280" height="130" rx="20" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2" class="anim-pulse"/>
      
      <!-- Name -->
      <text x="150" y="60" text-anchor="middle" fill="${rankConfig.color}" font-size="24" font-weight="bold" font-family="'Share Tech Mono', monospace">
        ${data.ensName || data.basename || 'name.eth'}
      </text>
      
      <!-- Rank Badge -->
      <text x="150" y="85" text-anchor="middle" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- Address -->
      <text x="150" y="120" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${data.address?.slice(0, 6)}...${data.address?.slice(-4)}
      </text>
    `;

    return generateSVGWrapper(content, 300, 150, p);
  },
};

// ============================================================================
// ENS-003: Profile Card
// ============================================================================
const ensProfileCard: SVGTemplate = {
  id: 'ens-003',
  name: 'ENS Profile Card',
  category: 'ens',
  description: 'Full profile card with avatar',
  palette: palette,
  animations: ['float', 'pulse'],
  layout: 'card',
  width: 350,
  height: 400,
  tags: ['profile', 'avatar', 'full', 'card'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['float', 'pulse'], p, options?.animationSpeed);

    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName || true,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    const rankBadge = generateRankBadge(rank, 270, 15, 'small');

    const content = `
      ${animations}
      
      <!-- Card -->
      <rect x="10" y="10" width="330" height="380" rx="20" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Rank Badge -->
      ${rankBadge}
      
      <!-- Avatar Placeholder -->
      <circle cx="175" cy="100" r="60" fill="${rankConfig.color}" opacity="0.3" class="anim-pulse"/>
      <text x="175" y="115" text-anchor="middle" fill="${rankConfig.color}" font-size="40" font-family="'Orbitron', sans-serif">
        ${(data.displayName || data.ensName || 'A')[0].toUpperCase()}
      </text>
      
      <!-- Name -->
      <text x="175" y="190" text-anchor="middle" fill="${p.text}" font-size="20" font-weight="bold" font-family="'Share Tech Mono', monospace">
        ${data.displayName || data.ensName || 'Anonymous'}
      </text>
      
      <!-- ENS Name -->
      <text x="175" y="215" text-anchor="middle" fill="${rankConfig.color}" font-size="14" font-family="'Share Tech Mono', monospace">
        ${data.ensName || data.basename || ''}
      </text>
      
      <!-- Rank Info -->
      <text x="175" y="240" text-anchor="middle" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name} • ${rankConfig.title}
      </text>
      
      <!-- Bio -->
      <text x="175" y="270" text-anchor="middle" fill="${p.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">
        ${data.description?.slice(0, 35) || 'Web3 Native'}
      </text>
      
      <!-- Address -->
      <rect x="50" y="290" width="250" height="28" rx="5" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="175" y="308" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${data.address}
      </text>
      
      <!-- VOT Balance -->
      <text x="175" y="350" text-anchor="middle" fill="${rankConfig.color}" font-size="18" font-weight="bold">
        ${data.holdings?.votBalance || '0'} VOT
      </text>
      
      <!-- Footer -->
      <text x="175" y="375" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        ENS Profile • MCPVOT
      </text>
    `;

    return generateSVGWrapper(content, 350, 400, p);
  },
};

// ============================================================================
// ENS-004: Resolver
// ============================================================================
const ensResolver: SVGTemplate = {
  id: 'ens-004',
  name: 'ENS Resolver',
  category: 'ens',
  description: 'Technical resolver display',
  palette: palette,
  animations: ['scan', 'pulse'],
  layout: 'terminal',
  width: 400,
  height: 300,
  tags: ['resolver', 'technical', 'records', 'data'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['scan', 'pulse'], p, options?.animationSpeed);

    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName || true,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];

    const content = `
      ${animations}
      
      <!-- Terminal Background -->
      <rect x="10" y="10" width="380" height="280" rx="10" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Header Bar -->
      <rect x="10" y="10" width="380" height="30" rx="10" fill="${rankConfig.color}" opacity="0.2"/>
      <circle cx="30" cy="25" r="6" fill="#FF5F56"/>
      <circle cx="50" cy="25" r="6" fill="#FFBD2E"/>
      <circle cx="70" cy="25" r="6" fill="#27CA40"/>
      <text x="200" y="30" text-anchor="middle" fill="${p.text}" font-size="11" font-family="'Share Tech Mono', monospace">
        ENS Resolver • ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- Records -->
      <text x="25" y="65" fill="${rankConfig.color}" font-size="11" font-family="'Share Tech Mono', monospace">$ ens resolve ${data.ensName || 'name.eth'}</text>
      
      <text x="25" y="95" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">addr[60]:</text>
      <text x="100" y="95" fill="${p.text}" font-size="10" font-family="'Share Tech Mono', monospace">${data.address?.slice(0, 28)}...</text>
      
      <text x="25" y="115" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">name:</text>
      <text x="100" y="115" fill="${rankConfig.color}" font-size="10" font-family="'Share Tech Mono', monospace">${data.ensName || 'null'}</text>
      
      <text x="25" y="135" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">rank:</text>
      <text x="100" y="135" fill="${rankConfig.color}" font-size="10" font-family="'Share Tech Mono', monospace">${rankConfig.name} (${rankConfig.title})</text>
      
      <text x="25" y="155" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">avatar:</text>
      <text x="100" y="155" fill="${p.text}" font-size="10" font-family="'Share Tech Mono', monospace">${data.avatar ? 'ipfs://...' : 'null'}</text>
      
      <text x="25" y="175" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">url:</text>
      <text x="100" y="175" fill="${p.text}" font-size="10" font-family="'Share Tech Mono', monospace">${data.links?.website || 'null'}</text>
      
      <text x="25" y="195" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">vot_balance:</text>
      <text x="100" y="195" fill="${rankConfig.color}" font-size="10" font-family="'Share Tech Mono', monospace">${data.holdings?.votBalance || '0'}</text>
      
      <!-- Status -->
      <text x="25" y="240" fill="${rankConfig.color}" font-size="11" font-family="'Share Tech Mono', monospace">✓ Resolution complete</text>
      
      <!-- Footer -->
      <text x="200" y="275" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        MCPVOT • ENS Records • ERC-1155
      </text>
    `;

    return generateSVGWrapper(content, 400, 300, p);
  },
};

// ============================================================================
// ENS-005: Avatar Frame
// ============================================================================
const ensAvatarFrame: SVGTemplate = {
  id: 'ens-005',
  name: 'ENS Avatar Frame',
  category: 'ens',
  description: 'Decorative avatar frame',
  palette: palette,
  animations: ['rotate', 'pulse'],
  layout: 'centered',
  width: 300,
  height: 300,
  tags: ['avatar', 'frame', 'decorative', 'pfp'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['rotate', 'pulse'], p, options?.animationSpeed);

    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName || true,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];

    const content = `
      ${animations}
      <defs>
        <linearGradient id="frame-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${rankConfig.color}"/>
          <stop offset="50%" style="stop-color:${p.accent}"/>
          <stop offset="100%" style="stop-color:${p.secondary}"/>
        </linearGradient>
      </defs>
      
      <!-- Outer Ring -->
      <circle cx="150" cy="150" r="130" fill="none" stroke="url(#frame-grad)" stroke-width="8" class="anim-pulse"/>
      
      <!-- Inner Ring -->
      <circle cx="150" cy="150" r="110" fill="none" stroke="${rankConfig.color}" stroke-width="2" stroke-dasharray="10,5"/>
      
      <!-- Avatar Circle -->
      <circle cx="150" cy="150" r="90" fill="${p.background}" stroke="${p.secondary}" stroke-width="2"/>
      
      <!-- Avatar Placeholder -->
      <text x="150" y="165" text-anchor="middle" fill="${rankConfig.color}" font-size="60" font-family="'Orbitron', sans-serif">
        ${(data.displayName || data.ensName || 'A')[0].toUpperCase()}
      </text>
      
      <!-- Name Badge -->
      <rect x="60" y="250" width="180" height="35" rx="15" fill="${rankConfig.color}"/>
      <text x="150" y="265" text-anchor="middle" fill="${p.background}" font-size="11" font-weight="bold" font-family="'Share Tech Mono', monospace">
        ${data.ensName || data.basename || 'name.eth'}
      </text>
      <text x="150" y="278" text-anchor="middle" fill="${p.background}" font-size="9" opacity="0.8" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name}
      </text>
    `;

    return generateSVGWrapper(content, 300, 300, p);
  },
};

// ============================================================================
// ENS-006: Basename
// ============================================================================
const ensBasename: SVGTemplate = {
  id: 'ens-006',
  name: 'Base Name',
  category: 'ens',
  description: 'Base chain name display',
  palette: palette,
  animations: ['shimmer', 'pulse'],
  layout: 'card',
  width: 350,
  height: 180,
  tags: ['basename', 'base', 'l2', 'name'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['shimmer', 'pulse'], p, options?.animationSpeed);

    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName,
      hasBasename: !!data.basename || true,
    });
    const rankConfig = RANK_CONFIG[rank];

    const content = `
      ${animations}
      
      <!-- Card -->
      <rect x="10" y="10" width="330" height="160" rx="15" fill="${p.background}" stroke="#0052FF" stroke-width="2"/>
      
      <!-- Base Logo -->
      <circle cx="50" cy="50" r="25" fill="#0052FF" class="anim-pulse"/>
      <text x="50" y="57" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="'Orbitron', sans-serif">B</text>
      
      <!-- Name -->
      <text x="90" y="42" fill="${p.text}" font-size="18" font-weight="bold" font-family="'Share Tech Mono', monospace">
        ${data.basename || data.ensName || 'name.base.eth'}
      </text>
      <text x="90" y="60" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">
        Base Name • ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- Address -->
      <text x="175" y="95" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${data.address}
      </text>
      
      <!-- Stats -->
      <g transform="translate(30, 115)">
        <text x="0" y="15" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">Registered on Base L2</text>
        <text x="200" y="15" fill="${rankConfig.color}" font-size="10" font-weight="bold" font-family="'Share Tech Mono', monospace">✓ ${rankConfig.title}</text>
      </g>
      
      <!-- Footer -->
      <text x="175" y="158" text-anchor="middle" fill="${cp.secondary}" font-size="8" font-family="'Share Tech Mono', monospace">
        MCPVOT • Base Names • ERC-1155
      </text>
    `;

    return generateSVGWrapper(content, 350, 180, p);
  },
};

// ============================================================================
// ENS-007: Domain Registry
// ============================================================================
const ensDomainRegistry: SVGTemplate = {
  id: 'ens-007',
  name: 'Domain Registry',
  category: 'ens',
  description: 'Domain registration record',
  palette: palette,
  animations: ['scan', 'gradient'],
  layout: 'dashboard',
  width: 400,
  height: 350,
  tags: ['domain', 'registry', 'record', 'official'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['scan', 'gradient'], p, options?.animationSpeed);

    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName || true,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];

    const content = `
      ${animations}
      
      <!-- Background -->
      <rect x="10" y="10" width="380" height="330" rx="10" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- Header -->
      <rect x="10" y="10" width="380" height="50" rx="10" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="200" y="42" text-anchor="middle" fill="${rankConfig.color}" font-size="16" font-weight="bold" font-family="'Orbitron', sans-serif">
        📋 DOMAIN REGISTRY
      </text>
      
      <!-- Domain Name -->
      <text x="30" y="85" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">DOMAIN NAME</text>
      <text x="30" y="108" fill="${p.text}" font-size="18" font-weight="bold" font-family="'Share Tech Mono', monospace">
        ${data.ensName || data.basename || 'domain.eth'}
      </text>
      
      <!-- Rank -->
      <text x="30" y="135" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">RANK</text>
      <text x="30" y="155" fill="${rankConfig.color}" font-size="14" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name} • ${rankConfig.title}
      </text>
      
      <!-- Owner -->
      <text x="30" y="185" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">OWNER</text>
      <text x="30" y="205" fill="${p.text}" font-size="11" font-family="'Share Tech Mono', monospace">
        ${data.address}
      </text>
      
      <!-- Records -->
      <line x1="30" y1="225" x2="370" y2="225" stroke="${cp.secondary}" stroke-width="1" opacity="0.3"/>
      
      <text x="30" y="245" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">RECORDS SET</text>
      <text x="30" y="265" fill="${p.text}" font-size="11" font-family="'Share Tech Mono', monospace">
        Address ✓ | Avatar ${data.avatar ? '✓' : '○'} | URL ${data.links?.website ? '✓' : '○'} | Twitter ${data.links?.twitter ? '✓' : '○'}
      </text>
      
      <!-- Status -->
      <rect x="30" y="285" width="340" height="35" rx="8" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="200" y="308" text-anchor="middle" fill="${rankConfig.color}" font-size="13" font-weight="bold" font-family="'Share Tech Mono', monospace">
        ✓ REGISTERED & ACTIVE
      </text>
      
      <!-- Footer -->
      <text x="200" y="340" text-anchor="middle" fill="${cp.secondary}" font-size="8" font-family="'Share Tech Mono', monospace">
        MCPVOT • ENS Domain Registry • ERC-1155
      </text>
    `;

    return generateSVGWrapper(content, 400, 350, p);
  },
};

// ============================================================================
// ENS-008: Connect
// ============================================================================
const ensConnect: SVGTemplate = {
  id: 'ens-008',
  name: 'ENS Connect',
  category: 'ens',
  description: 'Connection/linking display',
  palette: palette,
  animations: ['pulse', 'float'],
  layout: 'centered',
  width: 350,
  height: 200,
  tags: ['connect', 'link', 'social', 'web3'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'float'], p, options?.animationSpeed);

    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName || true,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];

    const content = `
      ${animations}
      
      <!-- Background -->
      <rect x="10" y="10" width="330" height="180" rx="15" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      
      <!-- ENS Icon -->
      <circle cx="80" cy="90" r="35" fill="${rankConfig.color}" opacity="0.2" class="anim-pulse"/>
      <text x="80" y="98" text-anchor="middle" fill="${rankConfig.color}" font-size="22" font-weight="bold" font-family="'Orbitron', sans-serif">ENS</text>
      
      <!-- Connection Line -->
      <line x1="120" y1="90" x2="200" y2="90" stroke="${rankConfig.color}" stroke-width="2" stroke-dasharray="8,4">
        <animate attributeName="stroke-dashoffset" from="0" to="24" dur="1s" repeatCount="indefinite"/>
      </line>
      
      <!-- User Icon -->
      <circle cx="270" cy="90" r="35" fill="${p.accent}" opacity="0.2"/>
      <text x="270" y="98" text-anchor="middle" fill="${p.accent}" font-size="20">👤</text>
      
      <!-- Name -->
      <text x="175" y="150" text-anchor="middle" fill="${p.text}" font-size="15" font-weight="bold" font-family="'Share Tech Mono', monospace">
        ${data.ensName || data.basename || 'Connected'}
      </text>
      
      <!-- Status -->
      <text x="175" y="172" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name} • Identity Verified
      </text>
    `;

    return generateSVGWrapper(content, 350, 200, p);
  },
};

// ============================================================================
// ENS-009: Minimal
// ============================================================================
const ensMinimal: SVGTemplate = {
  id: 'ens-009',
  name: 'ENS Minimal',
  category: 'ens',
  description: 'Minimalist name display',
  palette: palette,
  animations: ['breathe'],
  layout: 'minimal',
  width: 300,
  height: 100,
  tags: ['minimal', 'simple', 'clean', 'name'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['breathe'], p, options?.animationSpeed);

    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName || true,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];

    const content = `
      ${animations}
      
      <!-- Simple Background -->
      <rect x="5" y="5" width="290" height="90" rx="10" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="1"/>
      
      <!-- Name Only -->
      <text x="150" y="45" text-anchor="middle" fill="${rankConfig.color}" font-size="22" font-weight="bold" font-family="'Share Tech Mono', monospace" class="anim-breathe">
        ${data.ensName || data.basename || 'name.eth'}
      </text>
      
      <!-- Rank -->
      <text x="150" y="65" text-anchor="middle" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- Subtle Address -->
      <text x="150" y="82" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace" opacity="0.6">
        ${data.address?.slice(0, 6)}...${data.address?.slice(-4)}
      </text>
    `;

    return generateSVGWrapper(content, 300, 100, p);
  },
};

// ============================================================================
// ENS-010: Ultimate
// ============================================================================
const ensUltimate: SVGTemplate = {
  id: 'ens-010',
  name: 'ENS Ultimate',
  category: 'ens',
  description: 'Ultimate identity showcase with cyberpunk rank',
  palette: palette,
  animations: ['pulse', 'shimmer', 'gradient'],
  layout: 'hero',
  width: 450,
  height: 500,
  tags: ['ultimate', 'showcase', 'complete', 'identity', 'cyberpunk'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['pulse', 'shimmer', 'gradient'], p, options?.animationSpeed);
    const border = generateGlowingBorder(p, 450, 500, 3);

    const rank = calculateRank({
      votBalance: data.holdings?.votBalance,
      maxxBalance: data.holdings?.maxxBalance,
      hasWarplet: data.holdings?.hasWarplet,
      hasFarcaster: data.holdings?.hasFarcaster,
      hasEns: !!data.ensName || true,
      hasBasename: !!data.basename,
    });
    const rankConfig = RANK_CONFIG[rank];
    const rankBadge = generateRankBadge(rank, 365, 15, 'medium');
    const circuit = generateCircuitBoard(cp, 450, 500);

    const content = `
      ${animations}
      <defs>
        <linearGradient id="ens-ultimate-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${rankConfig.color}"/>
          <stop offset="100%" style="stop-color:${p.accent}"/>
        </linearGradient>
        <filter id="ens-glow">
          <feGaussianBlur stdDeviation="4"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      
      ${border}
      
      <!-- Background effect -->
      <g opacity="0.03">${circuit}</g>
      
      <!-- Rank Badge -->
      ${rankBadge}
      
      <!-- Avatar Area -->
      <circle cx="225" cy="100" r="70" fill="${rankConfig.color}" opacity="0.2" class="anim-pulse"/>
      <circle cx="225" cy="100" r="60" fill="${p.background}" stroke="${rankConfig.color}" stroke-width="2"/>
      <text x="225" y="115" text-anchor="middle" fill="${rankConfig.color}" font-size="48" font-family="'Orbitron', sans-serif">
        ${(data.displayName || data.ensName || 'A')[0].toUpperCase()}
      </text>
      
      <!-- Primary Name -->
      <text x="225" y="200" text-anchor="middle" fill="url(#ens-ultimate-grad)" font-size="26" font-weight="bold" font-family="'Orbitron', sans-serif" filter="url(#ens-glow)">
        ${data.ensName || data.basename || 'ultimate.eth'}
      </text>
      
      <!-- Rank Info -->
      <text x="225" y="225" text-anchor="middle" fill="${rankConfig.color}" font-size="14" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name} • ${rankConfig.title}
      </text>
      
      <!-- Display Name -->
      <text x="225" y="255" text-anchor="middle" fill="${p.text}" font-size="16" font-family="'Share Tech Mono', monospace">
        ${data.displayName || 'Web3 Identity'}
      </text>
      
      <!-- Bio -->
      <text x="225" y="280" text-anchor="middle" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">
        ${data.description?.slice(0, 45) || 'Decentralized identity on Ethereum'}
      </text>
      
      <!-- Address -->
      <rect x="50" y="300" width="350" height="32" rx="8" fill="${rankConfig.color}" opacity="0.1"/>
      <text x="225" y="320" text-anchor="middle" fill="${cp.secondary}" font-size="11" font-family="'Share Tech Mono', monospace">
        ${data.address}
      </text>
      
      <!-- Credentials Grid -->
      <g transform="translate(50, 350)">
        ${[
          { name: 'Warplet', active: data.holdings?.hasWarplet, icon: '🎫' },
          { name: 'Farcaster', active: data.holdings?.hasFarcaster, icon: '🟣' },
          { name: 'MAXX', active: parseFloat(data.holdings?.maxxBalance || '0') > 0, icon: '💎' },
        ].map((cred, i) => `
          <g transform="translate(${i * 120}, 0)">
            <rect width="110" height="40" rx="6" fill="${cred.active ? rankConfig.color : p.secondary}" opacity="${cred.active ? 0.15 : 0.05}"/>
            <text x="55" y="25" text-anchor="middle" fill="${cred.active ? rankConfig.color : cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">${cred.icon} ${cred.name} ${cred.active ? '✓' : '○'}</text>
          </g>
        `).join('')}
      </g>
      
      <!-- Holdings -->
      <text x="225" y="430" text-anchor="middle" fill="${rankConfig.color}" font-size="22" font-weight="bold">
        ${data.holdings?.votBalance || '0'} VOT
      </text>
      
      <!-- Footer -->
      <text x="225" y="475" text-anchor="middle" fill="${cp.secondary}" font-size="9" font-family="'Share Tech Mono', monospace">
        MCPVOT • ENS Ultimate Identity • ${rankConfig.icon} ${rankConfig.name} • ERC-1155
      </text>
    `;

    return generateSVGWrapper(content, 450, 500, p);
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export const ensTemplates: SVGTemplate[] = [
  ensIdentityCard,
  ensNameBadge,
  ensProfileCard,
  ensResolver,
  ensAvatarFrame,
  ensBasename,
  ensDomainRegistry,
  ensConnect,
  ensMinimal,
  ensUltimate,
];