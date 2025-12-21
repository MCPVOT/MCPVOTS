/**
 * Identity Banner Generator
 * 
 * Generates 900×240 SVG identity banners for all categories
 * Uses modular components for consistent styling across templates
 */

import type { ColorPalette, UserData } from './types';
import {
  generateHeader,
  generateFooter,
  generateGauge,
  generateRadar,
  generateBackground,
  generateIdentity,
  formatAddress
} from './components';

// =============================================================================
// CATEGORY PALETTES
// =============================================================================

export const CATEGORY_PALETTES: Record<string, ColorPalette> = {
  vot: {
    id: 'vot',
    name: 'VOT Protocol',
    primary: '#00ffcc',
    secondary: '#ff6600',
    accent: '#cc00ff',
    background: '#0a0a0a',
    text: '#ffffff',
    glow: '#00ffcc'
  },
  maxx: {
    id: 'maxx',
    name: 'MAXX Burn',
    primary: '#ff4444',
    secondary: '#ff9900',
    accent: '#ffcc00',
    background: '#1a0a0a',
    text: '#ffffff',
    glow: '#ff4444'
  },
  warplet: {
    id: 'warplet',
    name: 'Warplet Premium',
    primary: '#8B5CF6',
    secondary: '#06B6D4',
    accent: '#EC4899',
    background: '#0f0a1a',
    text: '#ffffff',
    glow: '#8B5CF6'
  },
  mcpvot: {
    id: 'mcpvot',
    name: 'MCPVOT Protocol',
    primary: '#00ffcc',
    secondary: '#8a63d2',
    accent: '#ff6600',
    background: '#0a0a1a',
    text: '#ffffff',
    glow: '#00ffcc'
  },
  base: {
    id: 'base',
    name: 'Base Network',
    primary: '#0052FF',
    secondary: '#00D4FF',
    accent: '#FF6B35',
    background: '#0a0f1c',
    text: '#ffffff',
    glow: '#0052FF'
  },
  farcaster: {
    id: 'farcaster',
    name: 'Farcaster Social',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    accent: '#00ffcc',
    background: '#0f0a1a',
    text: '#ffffff',
    glow: '#8B5CF6'
  },
  ens: {
    id: 'ens',
    name: 'ENS Identity',
    primary: '#5298FF',
    secondary: '#44BCF0',
    accent: '#7FD4FF',
    background: '#0d1117',
    text: '#ffffff',
    glow: '#5298FF'
  },
  defi: {
    id: 'defi',
    name: 'DeFi Finance',
    primary: '#00D4AA',
    secondary: '#20B2AA',
    accent: '#FFD700',
    background: '#0a1a1a',
    text: '#ffffff',
    glow: '#00D4AA'
  },
  gaming: {
    id: 'gaming',
    name: 'Gaming Retro',
    primary: '#FF00FF',
    secondary: '#00FFFF',
    accent: '#FFFF00',
    background: '#0a0a14',
    text: '#ffffff',
    glow: '#FF00FF'
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Clean',
    primary: '#ffffff',
    secondary: '#888888',
    accent: '#00ffcc',
    background: '#111111',
    text: '#ffffff',
    glow: '#ffffff'
  }
};

// =============================================================================
// BANNER CONFIG
// =============================================================================

export interface BannerConfig {
  category: keyof typeof CATEGORY_PALETTES;
  userData: UserData;
  gaugeLabel?: string;
  gaugeValue?: string;
  radarLabel?: string;
  radarValue?: string;
  badgeText?: string;
  customPalette?: Partial<ColorPalette>;
}

// =============================================================================
// GENERATE IDENTITY BANNER
// =============================================================================

export function generateIdentityBanner(config: BannerConfig): string {
  const {
    category,
    userData,
    gaugeLabel = 'STATUS',
    gaugeValue = 'ACTIVE',
    radarLabel = 'NETWORK',
    radarValue = 'BASE',
    badgeText = category.toUpperCase(),
    customPalette = {}
  } = config;

  // Merge base palette with custom overrides
  const basePalette = CATEGORY_PALETTES[category] || CATEGORY_PALETTES.vot;
  const palette: ColorPalette = { ...basePalette, ...customPalette };

  const width = 900;
  const height = 240;
  const uniqueId = `banner-${category}-${Date.now()}`;

  // User display info
  const displayName = userData.displayName || userData.ensName || userData.basename || 'Anonymous';
  const votBalance = userData.holdings?.votBalance || '0';
  const formattedBalance = formatBalance(votBalance);

  // Category emoji
  const categoryEmoji = getCategoryEmoji(category);

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <!-- Background -->
    ${generateBackground({ width, height, palette, uniqueId })}
    
    <!-- Header -->
    ${generateHeader({ protocolName: `${categoryEmoji} ${badgeText}`, width, palette, yOffset: 25 })}
    
    <!-- Left Section: Identity -->
    <g transform="translate(120, 130)">
      ${generateIdentity({ cx: 0, cy: 0, size: 100, palette, uniqueId, emoji: categoryEmoji })}
    </g>
    
    <!-- Center Section: User Info -->
    <g transform="translate(${width / 2}, 100)">
      <text text-anchor="middle" y="0" 
            style="font-family: 'Orbitron', sans-serif; font-size: 28px; fill: ${palette.text}; font-weight: bold;">
        ${displayName.toUpperCase()}
      </text>
      <text text-anchor="middle" y="30" 
            style="font-family: monospace; font-size: 12px; fill: ${palette.secondary};">
        ${formatAddress(userData.address)}
      </text>
      
      <!-- Balance Display -->
      <g transform="translate(0, 70)">
        <text text-anchor="middle" y="0" 
              style="font-family: 'Orbitron', sans-serif; font-size: 36px; fill: ${palette.accent}; font-weight: bold;">
          ${formattedBalance}
        </text>
        <text text-anchor="middle" y="25" 
              style="font-family: monospace; font-size: 11px; fill: ${palette.secondary}; letter-spacing: 2px;">
          VOT BALANCE
        </text>
      </g>
    </g>
    
    <!-- Right Section: Gauges -->
    <g transform="translate(${width - 180}, 80)">
      ${generateGauge({
        label: gaugeLabel,
        value: gaugeValue,
        cx: 0,
        cy: 0,
        radius: 35,
        palette,
        uniqueId: `${uniqueId}-gauge`
      })}
    </g>
    
    <g transform="translate(${width - 80}, 80)">
      ${generateRadar({
        label: radarLabel,
        value: radarValue,
        cx: 0,
        cy: 0,
        radius: 30,
        palette,
        uniqueId: `${uniqueId}-radar`
      })}
    </g>
    
    <!-- Footer -->
    ${generateFooter({
      address: userData.address,
      networkLabel: `${category.toUpperCase()} • BASE • x402`,
      width,
      height,
      palette,
      bottomOffset: 20,
      socialBadge: userData.links?.farcaster ? `@${userData.links.farcaster}` : undefined
    })}
    
    <!-- Animated Border Glow -->
    <rect x="2" y="2" width="${width - 4}" height="${height - 4}" 
          fill="none" stroke="${palette.primary}" stroke-width="2" rx="8" opacity="0.4">
      <animate attributeName="opacity" values="0.4;0.7;0.4" dur="3s" repeatCount="indefinite"/>
    </rect>
  </svg>`;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    vot: '🟠',
    maxx: '🔥',
    warplet: '👑',
    mcpvot: '🔮',
    base: '🔵',
    farcaster: '💜',
    ens: '🔷',
    defi: '📊',
    gaming: '🎮',
    minimal: '◯'
  };
  return emojiMap[category] || '⚡';
}

function formatBalance(balance?: string | number): string {
  if (!balance) return '---';
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num)) return '---';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default generateIdentityBanner;
