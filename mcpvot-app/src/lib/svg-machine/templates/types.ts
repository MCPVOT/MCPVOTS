/**
 * SVG Machine Template System
 * 
 * 100 Animated Templates organized by category
 * ALL templates MUST have SVG animations
 */

// =============================================================================
// TEMPLATE CATEGORIES
// =============================================================================

export type TemplateCategory = 
  | 'base'       // Base chain branded (10)
  | 'farcaster'  // Social/purple (10)
  | 'maxx'       // Matrix/cyberpunk (10)
  | 'vot'        // VOT ecosystem (10)
  | 'mcpvot'     // Full branding (10)
  | 'warplet'    // Premium/holder (10)
  | 'ens'        // Identity (10)
  | 'defi'       // Trading/finance (10)
  | 'gaming'     // Retro/gaming (10)
  | 'minimal';   // Clean/pro (10)

// =============================================================================
// ANIMATION TYPES
// =============================================================================

export type AnimationType = 
  | 'pulse'        // Glowing elements
  | 'float'        // Floating motion
  | 'scan'         // Scanning lines
  | 'data-rain'    // Matrix-style rain
  | 'rotate'       // Spinning elements
  | 'gradient'     // Color transitions
  | 'glitch'       // Glitch effects
  | 'typewriter'   // Text reveal
  | 'particles'    // Particle systems
  | 'wave'         // Wave motion
  | 'breathe'      // Scale in/out
  | 'flicker'      // Light flicker
  | 'orbit'        // Orbital motion
  | 'morph'        // Shape morphing
  | 'shimmer';     // Shimmer effect

// =============================================================================
// COLOR PALETTES
// =============================================================================

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  glow?: string;
}

export const PALETTES: Record<string, ColorPalette> = {
  // BASE
  'base-blue': {
    id: 'base-blue',
    name: 'Base Blue',
    primary: '#0052FF',
    secondary: '#0066FF',
    accent: '#00D4FF',
    background: '#0A0F1C',
    text: '#FFFFFF',
    glow: '#0052FF',
  },
  
  // FARCASTER
  'farcaster-purple': {
    id: 'farcaster-purple',
    name: 'Farcaster Purple',
    primary: '#8B5CF6',
    secondary: '#A855F7',
    accent: '#D946EF',
    background: '#0F0A1A',
    text: '#FFFFFF',
    glow: '#8B5CF6',
  },
  
  // MAXX/MATRIX
  'matrix-green': {
    id: 'matrix-green',
    name: 'Matrix Green',
    primary: '#00FF00',
    secondary: '#00CC00',
    accent: '#00FFCC',
    background: '#000000',
    text: '#00FF00',
    glow: '#00FF00',
  },
  
  // VOT
  'vot-gradient': {
    id: 'vot-gradient',
    name: 'VOT Gradient',
    primary: '#FF6600',
    secondary: '#FF9900',
    accent: '#FFCC00',
    background: '#0D0D0D',
    text: '#FFFFFF',
    glow: '#FF6600',
  },
  
  // MCPVOT
  'mcpvot-cyber': {
    id: 'mcpvot-cyber',
    name: 'MCPVOT Cyber',
    primary: '#00FFCC',
    secondary: '#FF6600',
    accent: '#00FF00',
    background: '#0A0A0A',
    text: '#FFFFFF',
    glow: '#00FFCC',
  },
  
  // WARPLET
  'warplet-premium': {
    id: 'warplet-premium',
    name: 'Warplet Premium',
    primary: '#FFD700',
    secondary: '#FFA500',
    accent: '#FF4500',
    background: '#1A0A00',
    text: '#FFD700',
    glow: '#FFD700',
  },
  
  // ENS
  'ens-identity': {
    id: 'ens-identity',
    name: 'ENS Identity',
    primary: '#5298FF',
    secondary: '#44BCF0',
    accent: '#7FD4FF',
    background: '#0D1117',
    text: '#FFFFFF',
    glow: '#5298FF',
  },
  
  // DEFI
  'defi-dark': {
    id: 'defi-dark',
    name: 'DeFi Dark',
    primary: '#00D395',
    secondary: '#00B37D',
    accent: '#00FFB3',
    background: '#0D1117',
    text: '#FFFFFF',
    glow: '#00D395',
  },
  
  // GAMING
  'gaming-retro': {
    id: 'gaming-retro',
    name: 'Gaming Retro',
    primary: '#FF00FF',
    secondary: '#00FFFF',
    accent: '#FFFF00',
    background: '#1A0033',
    text: '#FFFFFF',
    glow: '#FF00FF',
  },
  
  // MINIMAL
  'minimal-mono': {
    id: 'minimal-mono',
    name: 'Minimal Mono',
    primary: '#FFFFFF',
    secondary: '#AAAAAA',
    accent: '#666666',
    background: '#111111',
    text: '#FFFFFF',
    glow: '#FFFFFF',
  },
};

// =============================================================================
// LAYOUT TYPES
// =============================================================================

export type LayoutType = 
  | 'centered'     // Central focus
  | 'split'        // Left/right split
  | 'card'         // Card-style
  | 'terminal'     // Terminal/CLI look
  | 'dashboard'    // Multi-panel
  | 'hero'         // Big hero section
  | 'social'       // Social profile style
  | 'minimal'      // Minimal elements
  | 'grid'         // Grid layout
  | 'portrait';    // Vertical emphasis

// =============================================================================
// TEMPLATE INTERFACE
// =============================================================================

export interface UserData {
  // Identity
  address: string;
  ensName?: string;
  basename?: string;
  displayName?: string;
  
  // Content
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: string;
  
  // Links
  links: {
    website?: string;
    twitter?: string;
    farcaster?: string;
    github?: string;
    discord?: string;
    telegram?: string;
    custom?: Record<string, string>;
  };
  
  // Holdings (for conditional rendering)
  holdings?: {
    votBalance?: string;
    maxxBalance?: string;
    hasWarplet?: boolean;
    hasFarcaster?: boolean;
  };
}

export interface SVGTemplate {
  // Identity
  id: string;                      // e.g., "base-001"
  name: string;                    // "Base Genesis"
  category: TemplateCategory;
  description: string;
  
  // Visuals
  palette: ColorPalette;
  animations: AnimationType[];     // REQUIRED - minimum 1
  layout: LayoutType;
  
  // Dimensions
  width: number;
  height: number;
  
  // Requirements (optional)
  requirements?: {
    minVotBalance?: bigint;
    hasWarplet?: boolean;
    hasFarcaster?: boolean;
    hasMAXX?: boolean;
  };
  
  // Tags for search
  tags: string[];
  
  // Preview image (base64 or URL)
  preview?: string;
  
  // Generation function
  generate: (data: UserData, options?: GenerateOptions) => string;
}

export interface GenerateOptions {
  // Override palette
  customPalette?: Partial<ColorPalette>;
  
  // Animation speed
  animationSpeed?: 'slow' | 'normal' | 'fast';
  
  // Additional features
  includeDataRain?: boolean;
  includeScanlines?: boolean;
  includeGlitch?: boolean;
  includeParticles?: boolean;
  
  // Quality
  quality?: 'preview' | 'full';
}

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

export interface TemplateRegistry {
  templates: Map<string, SVGTemplate>;
  
  // Query methods
  getById(id: string): SVGTemplate | undefined;
  getByCategory(category: TemplateCategory): SVGTemplate[];
  search(query: string): SVGTemplate[];
  getAll(): SVGTemplate[];
  
  // Registration
  register(template: SVGTemplate): void;
  
  // Stats
  count(): number;
  countByCategory(): Record<TemplateCategory, number>;
}

// =============================================================================
// ANIMATION HELPERS
// =============================================================================

export interface AnimationConfig {
  type: AnimationType;
  duration: string;      // e.g., "3s"
  delay?: string;        // e.g., "0.5s"
  easing?: string;       // e.g., "ease-in-out"
  iterationCount?: string; // e.g., "infinite"
}

export const DEFAULT_ANIMATIONS: Record<AnimationType, AnimationConfig> = {
  pulse: {
    type: 'pulse',
    duration: '2s',
    easing: 'ease-in-out',
    iterationCount: 'infinite',
  },
  float: {
    type: 'float',
    duration: '4s',
    easing: 'ease-in-out',
    iterationCount: 'infinite',
  },
  scan: {
    type: 'scan',
    duration: '3s',
    easing: 'linear',
    iterationCount: 'infinite',
  },
  'data-rain': {
    type: 'data-rain',
    duration: '5s',
    easing: 'linear',
    iterationCount: 'infinite',
  },
  rotate: {
    type: 'rotate',
    duration: '10s',
    easing: 'linear',
    iterationCount: 'infinite',
  },
  gradient: {
    type: 'gradient',
    duration: '4s',
    easing: 'ease-in-out',
    iterationCount: 'infinite',
  },
  glitch: {
    type: 'glitch',
    duration: '0.3s',
    easing: 'steps(2)',
    iterationCount: 'infinite',
  },
  typewriter: {
    type: 'typewriter',
    duration: '2s',
    easing: 'steps(20)',
    iterationCount: '1',
  },
  particles: {
    type: 'particles',
    duration: '6s',
    easing: 'linear',
    iterationCount: 'infinite',
  },
  wave: {
    type: 'wave',
    duration: '3s',
    easing: 'ease-in-out',
    iterationCount: 'infinite',
  },
  breathe: {
    type: 'breathe',
    duration: '4s',
    easing: 'ease-in-out',
    iterationCount: 'infinite',
  },
  flicker: {
    type: 'flicker',
    duration: '0.1s',
    easing: 'steps(2)',
    iterationCount: 'infinite',
  },
  orbit: {
    type: 'orbit',
    duration: '8s',
    easing: 'linear',
    iterationCount: 'infinite',
  },
  morph: {
    type: 'morph',
    duration: '5s',
    easing: 'ease-in-out',
    iterationCount: 'infinite',
  },
  shimmer: {
    type: 'shimmer',
    duration: '2s',
    easing: 'linear',
    iterationCount: 'infinite',
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export { DEFAULT_ANIMATIONS as AnimationDefaults, PALETTES as ColorPalettes };

