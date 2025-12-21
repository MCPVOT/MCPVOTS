/**
 * SVG Template Categories Index
 * 
 * All 100 templates organized by category (10 categories × 10 templates each)
 * 
 * Categories:
 * - VOT: Core VOT protocol theme (cyan/orange/magenta)
 * - MAXX: Burn/deflationary theme (red/orange/gold)
 * - WARPLET: Premium Warplet theme (purple/cyan/pink)
 * - MCPVOT: MCP/AI protocol theme (cyan/purple/orange)
 * - BASE: Base L2 chain theme (blue/cyan/orange)
 * - FARCASTER: Social protocol theme (purple/violet/cyan)
 * - ENS: Identity theme (blue/cyan/sky)
 * - DEFI: Finance theme (green/teal/gold)
 * - GAMING: Retro gaming theme (magenta/cyan/yellow)
 * - MINIMAL: Clean minimal theme (white/gray/cyan)
 */

import { votTemplates } from './vot';
import { maxxTemplates } from './maxx';
import { warpletTemplates } from './warplet';
import { mcpvotTemplates } from './mcpvot';
import { baseTemplates } from './base';
import { farcasterTemplates } from './farcaster';
import { ensTemplates } from './ens';
import { defiTemplates } from './defi';
import { gamingTemplates } from './gaming';
import { minimalTemplates } from './minimal';

import type { SVGTemplate } from '../types';

// Re-export individual category arrays
export {
  votTemplates,
  maxxTemplates,
  warpletTemplates,
  mcpvotTemplates,
  baseTemplates,
  farcasterTemplates,
  ensTemplates,
  defiTemplates,
  gamingTemplates,
  minimalTemplates
};

// Combined array of all templates
export const allCategoryTemplates: SVGTemplate[] = [
  ...votTemplates,
  ...maxxTemplates,
  ...warpletTemplates,
  ...mcpvotTemplates,
  ...baseTemplates,
  ...farcasterTemplates,
  ...ensTemplates,
  ...defiTemplates,
  ...gamingTemplates,
  ...minimalTemplates
];

// Category names for iteration
export const CATEGORY_NAMES = [
  'vot',
  'maxx',
  'warplet',
  'mcpvot',
  'base',
  'farcaster',
  'ens',
  'defi',
  'gaming',
  'minimal'
] as const;

export type CategoryName = typeof CATEGORY_NAMES[number];

// Get templates by category
export function getTemplatesByCategory(category: CategoryName): SVGTemplate[] {
  return allCategoryTemplates.filter(t => t.category === category);
}

// Get template by ID
export function getTemplateById(id: string): SVGTemplate | undefined {
  return allCategoryTemplates.find(t => t.id === id);
}

// Get random template (optionally filtered by category)
export function getRandomTemplate(category?: CategoryName): SVGTemplate {
  const templates = category ? getTemplatesByCategory(category) : allCategoryTemplates;
  return templates[Math.floor(Math.random() * templates.length)];
}

// Get template counts per category
export function getTemplateCounts(): Record<CategoryName, number> {
  return CATEGORY_NAMES.reduce((acc, cat) => {
    acc[cat] = getTemplatesByCategory(cat).length;
    return acc;
  }, {} as Record<CategoryName, number>);
}

// Get templates by layout type
export function getTemplatesByLayout(layout: string): SVGTemplate[] {
  return allCategoryTemplates.filter(t => t.layout === layout);
}

// Get templates by tag
export function getTemplatesByTag(tag: string): SVGTemplate[] {
  return allCategoryTemplates.filter(t => t.tags?.includes(tag));
}

// Summary for debugging
export function getTemplatesSummary(): {
  total: number;
  byCategory: Record<CategoryName, number>;
  byLayout: Record<string, number>;
} {
  const byLayout: Record<string, number> = {};
  allCategoryTemplates.forEach(t => {
    byLayout[t.layout] = (byLayout[t.layout] || 0) + 1;
  });

  return {
    total: allCategoryTemplates.length,
    byCategory: getTemplateCounts(),
    byLayout
  };
}

export default allCategoryTemplates;
