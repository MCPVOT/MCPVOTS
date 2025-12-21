/**
 * VOT Machine Template System v2.0
 * 
 * REFACTORED: December 2025
 * 
 * THREE OUTPUT MODES:
 * 1. Full HTML Pages (vot-html-page.ts) - Complete animated web pages
 * 2. Identity Banners (banner-template.ts) - 900×240 SVG banners
 * 3. Category Templates (categories/) - 100 templates across 10 categories
 * 
 * FEATURES:
 * - Modular component system (header, footer, gauges, identity)
 * - 10 color themes per category
 * - Consistent header/footer across all templates
 * - Multiple sizes: Banner, Card, Badge, Showcase
 */

// =============================================================================
// PRIMARY EXPORTS: HTML Page Generator
// =============================================================================

export {
    generateVOTHTMLPage,
    type VOTPageData,
    type VOTPageOptions
} from './vot-html-page';

// =============================================================================
// SVG BANNER GENERATOR (NEW)
// =============================================================================

export {
    generateIdentityBanner,
    CATEGORY_PALETTES,
    type BannerConfig
} from './banner-template';

// =============================================================================
// MODULAR COMPONENTS (NEW)
// =============================================================================

export * from './components';

// =============================================================================
// CATEGORY TEMPLATES (NEW - 100 templates)
// =============================================================================

export {
    allCategoryTemplates,
    getTemplatesByCategory as getCategoryTemplatesNew,
    getRandomTemplate,
    getTemplateCounts,
    votTemplates,
    maxxTemplates,
    warpletTemplates
} from './categories';

// =============================================================================
// SHARED UTILITIES (used by all generators)
// =============================================================================

export * from './animations';
export * from './types';
export { fetchAllUserData } from './user-data-fetcher';

// =============================================================================
// LEGACY TEMPLATE REGISTRY (Backward Compatibility)
// Old SVG card templates are archived in _archive/
// Use generateIdentityBanner() for new SVG banners
// Use generateVOTHTMLPage() for full HTML pages
// =============================================================================

import type { SVGTemplate, TemplateCategory, TemplateRegistry } from './types';
import { allCategoryTemplates, getTemplatesByCategory as getCategoryTemplates } from './categories';

// Import archived templates for backward compatibility
import { baseTemplates } from './_archive/base';
import { defiTemplates } from './_archive/defi';
import { ensTemplates } from './_archive/ens';
import { farcasterTemplates } from './_archive/farcaster';
import { gamingTemplates } from './_archive/gaming';
import { maxxTemplates as archiveMaxxTemplates } from './_archive/maxx';
import { mcpvotTemplates } from './_archive/mcpvot';
import { minimalTemplates } from './_archive/minimal';
import { votTemplates as archiveVotTemplates } from './_archive/vot';
import { warpletTemplates as archiveWarpletTemplates } from './_archive/warplet';

/**
 * Template Registry combining new + archived templates
 */
class CombinedTemplateRegistry implements TemplateRegistry {
  templates: Map<string, SVGTemplate> = new Map();
  
  constructor() {
    this.registerAll();
  }
  
  private registerAll(): void {
    // Register NEW category templates first (higher priority)
    allCategoryTemplates.forEach(template => this.register(template));
    
    // Register archived templates (lower priority, won't overwrite)
    const archivedTemplates = [
      ...baseTemplates,
      ...farcasterTemplates,
      ...archiveMaxxTemplates,
      ...archiveVotTemplates,
      ...mcpvotTemplates,
      ...archiveWarpletTemplates,
      ...ensTemplates,
      ...defiTemplates,
      ...gamingTemplates,
      ...minimalTemplates,
    ];
    
    archivedTemplates.forEach(template => {
      // Only add if not already present (new templates take priority)
      if (!this.templates.has(template.id)) {
        this.register(template);
      }
    });
  }

  register(template: SVGTemplate): void {
    this.templates.set(template.id, template);
  }

  getById(id: string): SVGTemplate | undefined {
    return this.templates.get(id);
  }

  getByCategory(category: TemplateCategory): SVGTemplate[] {
    // Try new categories first
    const newTemplates = getCategoryTemplates(category);
    if (newTemplates.length > 0) return newTemplates;
    
    // Fall back to all templates matching category
    return Array.from(this.templates.values())
      .filter(t => t.category === category);
  }

  search(query: string): SVGTemplate[] {
    const q = query.toLowerCase();
    return Array.from(this.templates.values())
      .filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
  }

  getAll(): SVGTemplate[] {
    return Array.from(this.templates.values());
  }

  count(): number {
    return this.templates.size;
  }

  countByCategory(): Record<TemplateCategory, number> {
    const counts: Record<string, number> = {};
    this.templates.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts as Record<TemplateCategory, number>;
  }

  getRandom(category?: TemplateCategory): SVGTemplate | undefined {
    const templates = category 
      ? this.getByCategory(category) 
      : this.getAll();
    if (templates.length === 0) return undefined;
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

// Singleton registry
export const templateRegistry = new CombinedTemplateRegistry();

// Helper functions
export function getTemplate(id: string): SVGTemplate | undefined {
  return templateRegistry.getById(id);
}

export function getTemplatesByCategory(category: TemplateCategory): SVGTemplate[] {
  return templateRegistry.getByCategory(category);
}

export function searchTemplates(query: string): SVGTemplate[] {
  return templateRegistry.search(query);
}

export function getAllTemplates(): SVGTemplate[] {
  return templateRegistry.getAll();
}

export function getTemplateCount(): number {
  return templateRegistry.count();
}
