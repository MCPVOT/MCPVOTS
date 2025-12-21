/**
 * SVG Generator v2.1
 * 
 * Generates dynamic SVG content from templates with user data
 * NOW uses template.generate() function for category templates
 */

import { enhanceSVGTemplate } from '../openrouter-service';
import { getTemplate, templateRegistry } from './templates';
import {
    calculateRank,
    generateKeyframes,
    getRankColor,
    getRankGlow,
    type CyberpunkRank
} from './templates/animations';
import type { SVGTemplate, UserData } from './templates/types';
import type { SVGUserData } from './types';

// =============================================================================
// SVG GENERATOR
// =============================================================================

/**
 * Generate SVG from template with user data
 */
export async function generateSVG(
  templateId: string,
  userData: SVGUserData,
  options?: {
    enhanceWithLLM?: boolean;
    width?: number;
    height?: number;
  }
): Promise<string> {
  // Get template
  const template = getTemplate(templateId);
  
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Calculate user rank using the animations rank system
  const rank = calculateRank({
    votBalance: String(userData.holdings?.vot || 0),
    maxxBalance: String(userData.holdings?.maxx || 0),
    hasWarplet: userData.hasWarplet,
    hasFarcaster: !!userData.farcasterUsername,
    hasEns: !!userData.ensName,
    hasBasename: !!userData.basename,
  });

  // Convert SVGUserData to UserData for templates
  const templateUserData: UserData = {
    address: userData.address,
    ensName: userData.ensName || undefined,
    basename: userData.basename || undefined,
    displayName: userData.ensName || userData.basename || userData.farcasterUsername ||
      `${userData.address.slice(0, 6)}...${userData.address.slice(-4)}`,
    title: `${rank} Builder`,
    subtitle: template.category.toUpperCase(),
    links: {
      farcaster: userData.farcasterUsername || undefined,
    },
    holdings: {
      votBalance: String(userData.holdings?.vot || 0),
      maxxBalance: String(userData.holdings?.maxx || 0),
      hasWarplet: userData.hasWarplet,
      hasFarcaster: !!userData.farcasterUsername,
    },
  };

  // Use template's generate function if available (new category templates)
  let svgContent: string;
  
  if (template.generate && typeof template.generate === 'function') {
    // New category templates have generate() function
    svgContent = template.generate(templateUserData, {
      customPalette: undefined,
      animationSpeed: options?.enhanceWithLLM ? 'normal' : 'fast',
    });
  } else {
    // Fallback to legacy generator for old templates
    svgContent = buildLegacySVG(template, templateUserData, {
      rank,
      rankColor: getRankColor(rank),
      rankGlow: getRankGlow(rank),
      width: options?.width || template.width || 400,
      height: options?.height || template.height || 400,
    });
  }

  // Optionally enhance with LLM
  if (options?.enhanceWithLLM) {
    try {
      const llmResult = await enhanceSVGTemplate(
        svgContent,
        `User: ${templateUserData.displayName}, Rank: ${rank}`,
        template.category as Parameters<typeof enhanceSVGTemplate>[2]
      );
      if (llmResult.success && llmResult.content) {
        svgContent = llmResult.content;
      }
    } catch (error) {
      console.warn('[SVG Generator] LLM enhancement failed, using base template:', error);
    }
  }

  return svgContent;
}

/**
 * Build legacy SVG for templates without generate() function
 */
function buildLegacySVG(
  template: SVGTemplate,
  userData: UserData,
  context: {
    rank: CyberpunkRank;
    rankColor: string;
    rankGlow: string;
    width: number;
    height: number;
  }
): string {
  const { rank, rankColor, rankGlow, width, height } = context;
  
  // Get display name
  const displayName = userData.displayName || userData.ensName || 
    userData.basename || userData.address?.slice(0, 10) || 'Anonymous';

  // Build gradient definitions
  const gradients = `
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <linearGradient id="rank-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${rankColor}"/>
      <stop offset="100%" style="stop-color:${rankGlow}"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `;

  // Build animation styles from template's animation types
  const animations = template.animations?.map(animType => 
    generateKeyframes(animType, template.palette)
  ).join('\n') || '';

  // Get holdings
  const votBalance = userData.holdings?.votBalance || '0';
  const maxxBalance = userData.holdings?.maxxBalance || '0';

  // Build the SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    ${gradients}
    <style>
      ${animations}
      .rank-text { fill: url(#rank-gradient); filter: url(#glow); }
      .user-text { fill: #ffffff; font-family: 'Courier New', monospace; }
      .accent { fill: ${rankColor}; }
      .muted { fill: #666666; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg-gradient)"/>
  
  <!-- Border with rank color -->
  <rect x="10" y="10" width="${width - 20}" height="${height - 20}" 
        rx="15" fill="none" stroke="url(#rank-gradient)" stroke-width="2"/>
  
  <!-- Category Badge -->
  <rect x="20" y="20" width="80" height="24" rx="12" fill="${rankColor}" opacity="0.2"/>
  <text x="60" y="36" text-anchor="middle" class="muted" font-size="10" font-family="monospace">
    ${template.category.toUpperCase()}
  </text>
  
  <!-- Template Name -->
  <text x="${width / 2}" y="80" text-anchor="middle" class="rank-text" font-size="24" font-weight="bold">
    ${template.name}
  </text>
  
  <!-- User Info -->
  <text x="${width / 2}" y="140" text-anchor="middle" class="user-text" font-size="16">
    ${displayName}
  </text>
  
  <!-- Rank Display -->
  <g transform="translate(${width / 2}, 200)">
    <rect x="-60" y="-20" width="120" height="40" rx="8" fill="${rankColor}" opacity="0.15"/>
    <text x="0" y="8" text-anchor="middle" class="rank-text" font-size="20" font-weight="bold">
      ${rank}
    </text>
  </g>
  
  <!-- Holdings Info -->
  <g transform="translate(${width / 2}, 280)">
    <text x="0" y="0" text-anchor="middle" class="muted" font-size="12">
      VOT: ${formatNumber(parseFloat(votBalance))} | MAXX: ${formatNumber(parseFloat(maxxBalance))}
    </text>
  </g>
  
  <!-- Social Badges -->
  <g transform="translate(${width / 2}, 340)">
    ${userData.holdings?.hasFarcaster ? `
      <rect x="-80" y="-12" width="70" height="24" rx="12" fill="#8B5CF6" opacity="0.3"/>
      <text x="-45" y="4" text-anchor="middle" fill="#8B5CF6" font-size="10" font-family="monospace">FC</text>
    ` : ''}
    ${userData.ensName ? `
      <rect x="10" y="-12" width="70" height="24" rx="12" fill="#00ff88" opacity="0.3"/>
      <text x="45" y="4" text-anchor="middle" fill="#00ff88" font-size="10" font-family="monospace">ENS</text>
    ` : ''}
  </g>
  
  <!-- Footer -->
  <text x="${width / 2}" y="${height - 20}" text-anchor="middle" class="muted" font-size="8">
    MCPVOT Builder NFT | ${new Date().toISOString().split('T')[0]}
  </text>
</svg>`;

  return svg;
}

/**
 * Generate SVG for a random template
 */
export async function generateRandomSVG(
  userData: SVGUserData,
  category?: string
): Promise<{ svg: string; templateId: string }> {
  const template = category 
    ? templateRegistry.getRandom(category as Parameters<typeof templateRegistry.getRandom>[0])
    : templateRegistry.getRandom();
  
  if (!template) {
    throw new Error('No templates available');
  }

  const svg = await generateSVG(template.id, userData);
  
  return { svg, templateId: template.id };
}

/**
 * List available templates
 */
export function listTemplates(category?: string): Array<{ id: string; name: string; category: string; layout: string; width: number; height: number }> {
  const templates = category
    ? templateRegistry.getByCategory(category as Parameters<typeof templateRegistry.getByCategory>[0])
    : templateRegistry.getAll();
  
  return templates.map(t => ({
    id: t.id,
    name: t.name,
    category: t.category,
    layout: t.layout,
    width: t.width,
    height: t.height,
  }));
}

/**
 * Get template summary
 */
export function getTemplateSummary(): {
  total: number;
  byCategory: Record<string, number>;
  byLayout: Record<string, number>;
} {
  const all = templateRegistry.getAll();
  const byCategory: Record<string, number> = {};
  const byLayout: Record<string, number> = {};
  
  all.forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    byLayout[t.layout] = (byLayout[t.layout] || 0) + 1;
  });
  
  return {
    total: all.length,
    byCategory,
    byLayout,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function formatNumber(num: number): string {
  if (isNaN(num)) return '0';
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

// =============================================================================
// EXPORTS
// =============================================================================

export { getTemplate, templateRegistry };
