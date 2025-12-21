/**
 * MINIMAL Templates (10)
 * Clean/professional mono theme
 * Updated with Cyberpunk Rank System
 * ⬜ minimal-001 to minimal-010
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

const palette = PALETTES['minimal-mono'];
const cyberpunkPalette = CATEGORY_PALETTES['minimal'];

// ============================================================================
// MINIMAL-001: Clean Card
// ============================================================================
const minimalClean: SVGTemplate = {
  id: 'minimal-001',
  name: 'Clean Card',
  category: 'minimal',
  description: 'Ultra clean minimalist card with cyberpunk rank',
  palette: palette,
  animations: ['breathe'],
  layout: 'minimal',
  width: 350,
  height: 200,
  tags: ['clean', 'simple', 'professional', 'card', 'cyberpunk'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const cp = cyberpunkPalette;
    const animations = generateAnimationStyles(['breathe'], p, options?.animationSpeed);

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
      <rect x="10" y="10" width="330" height="180" rx="8" fill="${p.background}" stroke="${cp.secondary}" stroke-width="1"/>
      
      <!-- Rank -->
      <text x="320" y="30" text-anchor="end" fill="${rankConfig.color}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${rankConfig.icon} ${rankConfig.name}
      </text>
      
      <!-- Name -->
      <text x="30" y="60" fill="${p.text}" font-size="22" font-weight="300" font-family="'Orbitron', sans-serif">
        ${data.displayName || data.ensName || 'Anonymous'}
      </text>
      
      <!-- Title -->
      <text x="30" y="88" fill="${cp.secondary}" font-size="12" font-family="'Share Tech Mono', monospace">
        ${rankConfig.title}
      </text>
      
      <!-- Divider -->
      <line x1="30" y1="105" x2="150" y2="105" stroke="${rankConfig.color}" stroke-width="1" opacity="0.5"/>
      
      <!-- Holdings -->
      <text x="30" y="128" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        VOT: ${data.holdings?.votBalance || '0'} • MAXX: ${data.holdings?.maxxBalance || '0'}
      </text>
      
      <!-- Address -->
      <text x="30" y="150" fill="${cp.secondary}" font-size="10" font-family="'Share Tech Mono', monospace">
        ${data.address}
      </text>
      
      <!-- Footer -->
      <text x="30" y="175" fill="${rankConfig.color}" font-size="10" font-family="'Share Tech Mono', monospace">
        MCPVOT
      </text>
    `;

    return generateSVGWrapper(content, 350, 200, p);
  },
};

// ============================================================================
// MINIMAL-002: Business Card
// ============================================================================
const minimalBusiness: SVGTemplate = {
  id: 'minimal-002',
  name: 'Business Card',
  category: 'minimal',
  description: 'Professional business card style',
  palette: palette,
  animations: ['breathe', 'pulse'],
  layout: 'card',
  width: 400,
  height: 220,
  tags: ['business', 'professional', 'corporate', 'card'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['breathe', 'pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Card -->
      <rect x="10" y="10" width="380" height="200" rx="4" fill="${p.background}" stroke="${p.text}" stroke-width="1"/>
      
      <!-- Name -->
      <text x="30" y="55" fill="${p.text}" font-size="26" font-weight="bold" font-family="system-ui">
        ${data.displayName || data.ensName || 'Name'}
      </text>
      
      <!-- Role/Title -->
      <text x="30" y="80" fill="${p.secondary}" font-size="14" font-family="system-ui">
        ${data.subtitle || 'Builder'}
      </text>
      
      <!-- Contact Info -->
      <g transform="translate(30, 110)" font-size="11" font-family="system-ui">
        ${data.links?.website ? `<text x="0" y="0" fill="${p.secondary}">🌐 ${data.links.website}</text>` : ''}
        ${data.links?.twitter ? `<text x="0" y="20" fill="${p.secondary}">𝕏 ${data.links.twitter}</text>` : ''}
        ${data.links?.github ? `<text x="0" y="40" fill="${p.secondary}">⌘ ${data.links.github}</text>` : ''}
      </g>
      
      <!-- Address -->
      <text x="370" y="190" text-anchor="end" fill="${p.accent}" font-size="10" font-family="monospace">
        ${data.address?.slice(0, 6)}...${data.address?.slice(-4)}
      </text>
    `;

    return generateSVGWrapper(content, 400, 220, p);
  },
};

// ============================================================================
// MINIMAL-003: Stats Display
// ============================================================================
const minimalStats: SVGTemplate = {
  id: 'minimal-003',
  name: 'Stats Display',
  category: 'minimal',
  description: 'Clean stats/metrics display',
  palette: palette,
  animations: ['pulse'],
  layout: 'dashboard',
  width: 400,
  height: 180,
  tags: ['stats', 'metrics', 'data', 'numbers'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Card -->
      <rect x="10" y="10" width="380" height="160" rx="4" fill="${p.background}" stroke="${p.secondary}" stroke-width="1"/>
      
      <!-- Stats Grid -->
      <g transform="translate(30, 40)">
        <!-- Stat 1 -->
        <text x="0" y="0" fill="${p.secondary}" font-size="10" font-family="system-ui">VOT BALANCE</text>
        <text x="0" y="30" fill="${p.text}" font-size="28" font-weight="bold" font-family="system-ui" class="anim-pulse">
          ${data.holdings?.votBalance || '0'}
        </text>
        
        <!-- Stat 2 -->
        <text x="150" y="0" fill="${p.secondary}" font-size="10" font-family="system-ui">MAXX</text>
        <text x="150" y="30" fill="${p.text}" font-size="28" font-weight="bold" font-family="system-ui">
          ${data.holdings?.maxxBalance || '0'}
        </text>
        
        <!-- Stat 3 -->
        <text x="280" y="0" fill="${p.secondary}" font-size="10" font-family="system-ui">STATUS</text>
        <text x="280" y="30" fill="${p.accent}" font-size="28" font-weight="bold" font-family="system-ui">
          ●
        </text>
      </g>
      
      <!-- User -->
      <text x="30" y="130" fill="${p.secondary}" font-size="11" font-family="monospace">
        ${data.displayName || data.address?.slice(0, 20)}
      </text>
      
      <!-- Footer -->
      <text x="370" y="150" text-anchor="end" fill="${p.accent}" font-size="9" font-family="system-ui">
        MCPVOT
      </text>
    `;

    return generateSVGWrapper(content, 400, 180, p);
  },
};

// ============================================================================
// MINIMAL-004: Profile Badge
// ============================================================================
const minimalProfile: SVGTemplate = {
  id: 'minimal-004',
  name: 'Profile Badge',
  category: 'minimal',
  description: 'Simple profile badge',
  palette: palette,
  animations: ['breathe'],
  layout: 'centered',
  width: 250,
  height: 300,
  tags: ['profile', 'badge', 'avatar', 'simple'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['breathe'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Card -->
      <rect x="10" y="10" width="230" height="280" rx="8" fill="${p.background}" stroke="${p.secondary}" stroke-width="1"/>
      
      <!-- Avatar Circle -->
      <circle cx="125" cy="90" r="50" fill="${p.secondary}" opacity="0.1"/>
      <text x="125" y="105" text-anchor="middle" fill="${p.text}" font-size="36" font-family="system-ui">
        ${(data.displayName || data.ensName || 'A')[0].toUpperCase()}
      </text>
      
      <!-- Name -->
      <text x="125" y="175" text-anchor="middle" fill="${p.text}" font-size="18" font-weight="500" font-family="system-ui">
        ${data.displayName || data.ensName || 'Anonymous'}
      </text>
      
      <!-- Subtitle -->
      <text x="125" y="200" text-anchor="middle" fill="${p.secondary}" font-size="12" font-family="system-ui">
        ${data.subtitle || 'Web3 User'}
      </text>
      
      <!-- Address -->
      <text x="125" y="240" text-anchor="middle" fill="${p.secondary}" font-size="10" font-family="monospace">
        ${data.address?.slice(0, 6)}...${data.address?.slice(-4)}
      </text>
      
      <!-- Footer -->
      <text x="125" y="275" text-anchor="middle" fill="${p.accent}" font-size="9" font-family="system-ui">
        MCPVOT • ERC-1155
      </text>
    `;

    return generateSVGWrapper(content, 250, 300, p);
  },
};

// ============================================================================
// MINIMAL-005: Address Display
// ============================================================================
const minimalAddress: SVGTemplate = {
  id: 'minimal-005',
  name: 'Address Display',
  category: 'minimal',
  description: 'Simple address display',
  palette: palette,
  animations: ['breathe'],
  layout: 'minimal',
  width: 400,
  height: 100,
  tags: ['address', 'wallet', 'simple', 'compact'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['breathe'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Card -->
      <rect x="10" y="10" width="380" height="80" rx="4" fill="${p.background}" stroke="${p.secondary}" stroke-width="1"/>
      
      <!-- Label -->
      <text x="25" y="40" fill="${p.secondary}" font-size="10" font-family="system-ui">WALLET ADDRESS</text>
      
      <!-- Address -->
      <text x="25" y="65" fill="${p.text}" font-size="14" font-family="monospace" class="anim-breathe">
        ${data.address}
      </text>
      
      <!-- Indicator -->
      <circle cx="370" cy="50" r="6" fill="${p.accent}" opacity="0.8"/>
    `;

    return generateSVGWrapper(content, 400, 100, p);
  },
};

// ============================================================================
// MINIMAL-006: Balance Card
// ============================================================================
const minimalBalance: SVGTemplate = {
  id: 'minimal-006',
  name: 'Balance Card',
  category: 'minimal',
  description: 'Simple balance display',
  palette: palette,
  animations: ['pulse'],
  layout: 'card',
  width: 300,
  height: 150,
  tags: ['balance', 'wallet', 'amount', 'simple'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Card -->
      <rect x="10" y="10" width="280" height="130" rx="6" fill="${p.background}" stroke="${p.secondary}" stroke-width="1"/>
      
      <!-- Label -->
      <text x="25" y="40" fill="${p.secondary}" font-size="11" font-family="system-ui">BALANCE</text>
      
      <!-- Amount -->
      <text x="25" y="80" fill="${p.text}" font-size="32" font-weight="bold" font-family="system-ui" class="anim-pulse">
        ${data.holdings?.votBalance || '0'}
      </text>
      <text x="25" y="100" fill="${p.secondary}" font-size="14" font-family="system-ui">VOT</text>
      
      <!-- User -->
      <text x="265" y="125" text-anchor="end" fill="${p.accent}" font-size="10" font-family="monospace">
        ${data.address?.slice(0, 6)}...${data.address?.slice(-4)}
      </text>
    `;

    return generateSVGWrapper(content, 300, 150, p);
  },
};

// ============================================================================
// MINIMAL-007: List Item
// ============================================================================
const minimalListItem: SVGTemplate = {
  id: 'minimal-007',
  name: 'List Item',
  category: 'minimal',
  description: 'Simple list item style',
  palette: palette,
  animations: ['breathe'],
  layout: 'minimal',
  width: 400,
  height: 80,
  tags: ['list', 'item', 'row', 'compact'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['breathe'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Row -->
      <rect x="10" y="10" width="380" height="60" rx="4" fill="${p.background}" stroke="${p.secondary}" stroke-width="1"/>
      
      <!-- Avatar -->
      <circle cx="50" cy="40" r="20" fill="${p.secondary}" opacity="0.2"/>
      <text x="50" y="47" text-anchor="middle" fill="${p.text}" font-size="16" font-family="system-ui">
        ${(data.displayName || 'A')[0].toUpperCase()}
      </text>
      
      <!-- Name -->
      <text x="85" y="35" fill="${p.text}" font-size="14" font-weight="500" font-family="system-ui">
        ${data.displayName || data.ensName || 'User'}
      </text>
      <text x="85" y="52" fill="${p.secondary}" font-size="10" font-family="monospace">
        ${data.address?.slice(0, 10)}...
      </text>
      
      <!-- Value -->
      <text x="370" y="45" text-anchor="end" fill="${p.text}" font-size="14" font-weight="bold" font-family="system-ui">
        ${data.holdings?.votBalance || '0'} VOT
      </text>
    `;

    return generateSVGWrapper(content, 400, 80, p);
  },
};

// ============================================================================
// MINIMAL-008: Compact Badge
// ============================================================================
const minimalCompact: SVGTemplate = {
  id: 'minimal-008',
  name: 'Compact Badge',
  category: 'minimal',
  description: 'Ultra compact badge',
  palette: palette,
  animations: ['pulse'],
  layout: 'minimal',
  width: 200,
  height: 60,
  tags: ['compact', 'badge', 'tiny', 'small'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['pulse'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Badge -->
      <rect x="5" y="5" width="190" height="50" rx="25" fill="${p.background}" stroke="${p.secondary}" stroke-width="1"/>
      
      <!-- Dot -->
      <circle cx="30" cy="30" r="10" fill="${p.accent}" class="anim-pulse"/>
      
      <!-- Name -->
      <text x="50" y="35" fill="${p.text}" font-size="12" font-family="system-ui">
        ${(data.displayName || data.ensName || data.address?.slice(0, 8) || 'User').slice(0, 15)}
      </text>
    `;

    return generateSVGWrapper(content, 200, 60, p);
  },
};

// ============================================================================
// MINIMAL-009: Document Style
// ============================================================================
const minimalDocument: SVGTemplate = {
  id: 'minimal-009',
  name: 'Document Style',
  category: 'minimal',
  description: 'Document/certificate style',
  palette: palette,
  animations: ['breathe'],
  layout: 'portrait',
  width: 350,
  height: 450,
  tags: ['document', 'certificate', 'formal', 'official'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['breathe'], p, options?.animationSpeed);

    const content = `
      ${animations}
      
      <!-- Document -->
      <rect x="20" y="20" width="310" height="410" fill="${p.background}" stroke="${p.secondary}" stroke-width="1"/>
      
      <!-- Header Line -->
      <line x1="50" y1="60" x2="300" y2="60" stroke="${p.text}" stroke-width="2"/>
      
      <!-- Title -->
      <text x="175" y="100" text-anchor="middle" fill="${p.text}" font-size="20" font-weight="bold" font-family="serif">
        CERTIFICATE
      </text>
      <text x="175" y="125" text-anchor="middle" fill="${p.secondary}" font-size="12" font-family="serif">
        of Ownership
      </text>
      
      <!-- Content -->
      <text x="175" y="180" text-anchor="middle" fill="${p.secondary}" font-size="11" font-family="serif">
        This certifies that
      </text>
      
      <text x="175" y="220" text-anchor="middle" fill="${p.text}" font-size="18" font-weight="bold" font-family="system-ui">
        ${data.displayName || data.ensName || 'Holder'}
      </text>
      
      <text x="175" y="260" text-anchor="middle" fill="${p.secondary}" font-size="10" font-family="monospace">
        ${data.address}
      </text>
      
      <text x="175" y="300" text-anchor="middle" fill="${p.secondary}" font-size="11" font-family="serif">
        is the verified owner of this NFT
      </text>
      
      <!-- Balance -->
      <text x="175" y="340" text-anchor="middle" fill="${p.text}" font-size="24" font-weight="bold" font-family="system-ui">
        ${data.holdings?.votBalance || '0'} VOT
      </text>
      
      <!-- Footer Line -->
      <line x1="50" y1="380" x2="300" y2="380" stroke="${p.secondary}" stroke-width="1"/>
      
      <!-- Footer -->
      <text x="175" y="410" text-anchor="middle" fill="${p.secondary}" font-size="9" font-family="serif">
        MCPVOT • ERC-1155 • IPFS
      </text>
    `;

    return generateSVGWrapper(content, 350, 450, p);
  },
};

// ============================================================================
// MINIMAL-010: Ultimate Clean
// ============================================================================
const minimalUltimate: SVGTemplate = {
  id: 'minimal-010',
  name: 'Ultimate Clean',
  category: 'minimal',
  description: 'Ultimate minimalist showcase',
  palette: palette,
  animations: ['breathe', 'pulse'],
  layout: 'hero',
  width: 450,
  height: 400,
  tags: ['ultimate', 'clean', 'showcase', 'complete'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const p = { ...palette, ...options?.customPalette };
    const animations = generateAnimationStyles(['breathe', 'pulse'], p, options?.animationSpeed);
    const border = generateGlowingBorder(p, 450, 400, 1);

    const content = `
      ${animations}
      
      ${border}
      
      <!-- Subtle Background Pattern -->
      <pattern id="minimal-dots" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="1" fill="${p.secondary}" opacity="0.1"/>
      </pattern>
      <rect x="20" y="20" width="410" height="360" fill="url(#minimal-dots)"/>
      
      <!-- Avatar -->
      <circle cx="225" cy="100" r="50" fill="${p.secondary}" opacity="0.1"/>
      <text x="225" y="115" text-anchor="middle" fill="${p.text}" font-size="36" font-family="system-ui">
        ${(data.displayName || data.ensName || 'A')[0].toUpperCase()}
      </text>
      
      <!-- Name -->
      <text x="225" y="180" text-anchor="middle" fill="${p.text}" font-size="24" font-weight="500" font-family="system-ui">
        ${data.displayName || data.ensName || 'Anonymous'}
      </text>
      
      <!-- Bio -->
      <text x="225" y="210" text-anchor="middle" fill="${p.secondary}" font-size="12" font-family="system-ui">
        ${data.description?.slice(0, 40) || 'Web3 Native'}
      </text>
      
      <!-- Address -->
      <rect x="100" y="230" width="250" height="30" rx="4" fill="${p.secondary}" opacity="0.1"/>
      <text x="225" y="250" text-anchor="middle" fill="${p.secondary}" font-size="10" font-family="monospace">
        ${data.address}
      </text>
      
      <!-- Stats -->
      <g transform="translate(75, 280)">
        <text x="0" y="15" fill="${p.secondary}" font-size="10" font-family="system-ui">VOT</text>
        <text x="0" y="40" fill="${p.text}" font-size="20" font-weight="bold" font-family="system-ui" class="anim-pulse">
          ${data.holdings?.votBalance || '0'}
        </text>
        
        <text x="150" y="15" fill="${p.secondary}" font-size="10" font-family="system-ui">MAXX</text>
        <text x="150" y="40" fill="${p.text}" font-size="20" font-weight="bold" font-family="system-ui">
          ${data.holdings?.maxxBalance || '0'}
        </text>
        
        <text x="300" y="15" fill="${p.secondary}" font-size="10" font-family="system-ui">STATUS</text>
        <text x="300" y="40" fill="${p.accent}" font-size="20" font-weight="bold" font-family="system-ui">
          ACTIVE
        </text>
      </g>
      
      <!-- Footer -->
      <text x="225" y="375" text-anchor="middle" fill="${p.secondary}" font-size="9" font-family="system-ui">
        MCPVOT • Minimal Collection • ERC-1155 • IPFS
      </text>
    `;

    return generateSVGWrapper(content, 450, 400, p);
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export const minimalTemplates: SVGTemplate[] = [
  minimalClean,
  minimalBusiness,
  minimalStats,
  minimalProfile,
  minimalAddress,
  minimalBalance,
  minimalListItem,
  minimalCompact,
  minimalDocument,
  minimalUltimate,
];
