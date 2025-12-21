/**
 * BASE Templates (10)
 * 
 * Base chain branded templates with blue theme
 */

import {
    generateAnimationStyles,
    generateCircuitLines,
    generateGlowingBorder,
    generatePulsingOrb,
    generateScanlines,
    generateSVGWrapper
} from '../../animations';
import { GenerateOptions, PALETTES, SVGTemplate, UserData } from '../../types';

const basePalette = PALETTES['base-blue'];

// =============================================================================
// TEMPLATE 1: Base Genesis - The original
// =============================================================================

const baseGenesis: SVGTemplate = {
  id: 'base-001',
  name: 'Base Genesis',
  category: 'base',
  description: 'The original Base template with iconic blue glow',
  palette: basePalette,
  animations: ['pulse', 'float'],
  layout: 'centered',
  width: 800,
  height: 600,
  tags: ['base', 'genesis', 'original', 'blue', 'minimal'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = baseGenesis;
    const p = { ...palette, ...options?.customPalette };
    
    const styles = generateAnimationStyles(['pulse', 'float'], p, options?.animationSpeed);
    
    const content = `
      ${styles}
      
      ${generateGlowingBorder(p, width, height)}
      
      <!-- Base Logo -->
      <g transform="translate(${width/2 - 40}, 80)" class="anim-float">
        <circle cx="40" cy="40" r="35" fill="${p.primary}">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="40" y="50" text-anchor="middle" fill="white" font-size="30" font-weight="bold">B</text>
      </g>
      
      <!-- Title -->
      <text x="${width/2}" y="200" text-anchor="middle" fill="${p.text}" font-size="36" font-weight="bold" class="anim-pulse">
        ${data.title || data.displayName || 'Builder'}
      </text>
      
      <!-- Subtitle -->
      <text x="${width/2}" y="240" text-anchor="middle" fill="${p.secondary}" font-size="18">
        ${data.subtitle || 'Building on Base'}
      </text>
      
      <!-- Description -->
      <foreignObject x="100" y="280" width="${width - 200}" height="100">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${p.text}; font-size: 14px; text-align: center; opacity: 0.8;">
          ${data.description || 'Powered by the MCPVOT Ecosystem'}
        </div>
      </foreignObject>
      
      <!-- Links -->
      <g transform="translate(${width/2}, 420)">
        ${Object.entries(data.links || {}).slice(0, 4).map(([key, _value], i) => `
          <g transform="translate(${(i - 1.5) * 90}, 0)" class="anim-pulse" style="animation-delay: ${i * 0.2}s">
            <circle cx="0" cy="0" r="25" fill="${p.primary}" opacity="0.2"/>
            <text x="0" y="5" text-anchor="middle" fill="${p.text}" font-size="10">${key}</text>
          </g>
        `).join('')}
      </g>
      
      <!-- Address -->
      <text x="${width/2}" y="${height - 40}" text-anchor="middle" fill="${p.accent}" font-size="12" font-family="monospace" opacity="0.6">
        ${data.ensName || data.basename || data.address?.slice(0, 20) + '...'}
      </text>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 2: Base Terminal - CLI style
// =============================================================================

const baseTerminal: SVGTemplate = {
  id: 'base-002',
  name: 'Base Terminal',
  category: 'base',
  description: 'Command-line interface style with typing animation',
  palette: basePalette,
  animations: ['typewriter', 'flicker', 'pulse'],
  layout: 'terminal',
  width: 800,
  height: 600,
  tags: ['base', 'terminal', 'cli', 'hacker', 'code'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = baseTerminal;
    const p = { ...palette, ...options?.customPalette };
    
    const styles = `
      <style>
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .terminal-text {
          font-family: 'Monaco', 'Menlo', monospace;
          fill: ${p.primary};
        }
        .cursor {
          animation: blink 1s step-end infinite;
        }
        .typing {
          animation: typewriter 2s steps(40) forwards;
          overflow: hidden;
          white-space: nowrap;
        }
      </style>
    `;
    
    const content = `
      ${styles}
      
      <!-- Terminal Window -->
      <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="#0D1117" rx="10" stroke="${p.primary}" stroke-width="2"/>
      
      <!-- Title Bar -->
      <rect x="40" y="40" width="${width - 80}" height="30" fill="${p.primary}" opacity="0.2" rx="10"/>
      <circle cx="65" cy="55" r="6" fill="#FF5F56"/>
      <circle cx="85" cy="55" r="6" fill="#FFBD2E"/>
      <circle cx="105" cy="55" r="6" fill="#27CA40"/>
      <text x="${width/2}" y="60" text-anchor="middle" fill="${p.text}" font-size="12">base-terminal</text>
      
      <!-- Terminal Content -->
      <text x="60" y="110" class="terminal-text">$ whoami</text>
      <text x="60" y="140" class="terminal-text" opacity="0.8">> ${data.title || 'builder'}</text>
      
      <text x="60" y="180" class="terminal-text">$ cat profile.json</text>
      <text x="60" y="210" class="terminal-text" opacity="0.8">{</text>
      <text x="80" y="235" class="terminal-text" opacity="0.8">"name": "${data.displayName || 'Anonymous'}",</text>
      <text x="80" y="260" class="terminal-text" opacity="0.8">"chain": "Base",</text>
      <text x="80" y="285" class="terminal-text" opacity="0.8">"status": "Building"</text>
      <text x="60" y="310" class="terminal-text" opacity="0.8">}</text>
      
      <text x="60" y="360" class="terminal-text">$ echo $ADDRESS</text>
      <text x="60" y="390" class="terminal-text" opacity="0.8">> ${data.address || '0x...'}</text>
      
      <!-- Blinking Cursor -->
      <rect x="60" y="430" width="10" height="20" fill="${p.primary}" class="cursor"/>
      
      <!-- Status Bar -->
      <rect x="40" y="${height - 70}" width="${width - 80}" height="30" fill="${p.primary}" opacity="0.1"/>
      <text x="60" y="${height - 50}" fill="${p.accent}" font-size="11" font-family="monospace">
        🔵 Connected to Base • ${data.ensName || data.basename || 'No ENS'}
      </text>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 3: Base Card - Social card style
// =============================================================================

const baseCard: SVGTemplate = {
  id: 'base-003',
  name: 'Base Card',
  category: 'base',
  description: 'Social card style perfect for sharing',
  palette: basePalette,
  animations: ['pulse', 'shimmer'],
  layout: 'card',
  width: 800,
  height: 418, // Twitter card ratio
  tags: ['base', 'card', 'social', 'share', 'twitter'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = baseCard;
    const p = { ...palette, ...options?.customPalette };
    
    const styles = `
      <style>
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-overlay {
          animation: shimmer 3s infinite linear;
        }
      </style>
    `;
    
    const content = `
      ${styles}
      
      <!-- Card Background -->
      <rect width="${width}" height="${height}" fill="${p.background}" rx="20"/>
      
      <!-- Gradient Overlay -->
      <defs>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${p.primary};stop-opacity:0.1"/>
          <stop offset="100%" style="stop-color:${p.secondary};stop-opacity:0.05"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#cardGrad)" rx="20"/>
      
      <!-- Shimmer Effect -->
      <clipPath id="cardClip">
        <rect width="${width}" height="${height}" rx="20"/>
      </clipPath>
      <g clip-path="url(#cardClip)">
        <rect x="-${width}" y="0" width="${width * 0.5}" height="${height}" fill="white" opacity="0.05" class="shimmer-overlay"/>
      </g>
      
      <!-- Avatar Circle -->
      <circle cx="150" cy="${height/2}" r="80" fill="${p.primary}" opacity="0.2">
        <animate attributeName="r" values="80;85;80" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="150" cy="${height/2}" r="70" fill="${p.background}" stroke="${p.primary}" stroke-width="3"/>
      ${data.avatar ? `<image href="${data.avatar}" x="80" y="${height/2 - 70}" width="140" height="140" clip-path="circle(70px at 70px 70px)"/>` : `
        <text x="150" y="${height/2 + 15}" text-anchor="middle" fill="${p.primary}" font-size="48" font-weight="bold">
          ${(data.displayName || 'B')[0].toUpperCase()}
        </text>
      `}
      
      <!-- Content -->
      <text x="280" y="${height/2 - 40}" fill="${p.text}" font-size="32" font-weight="bold">
        ${data.title || data.displayName || 'Builder'}
      </text>
      <text x="280" y="${height/2}" fill="${p.secondary}" font-size="18">
        ${data.subtitle || 'Building on Base'}
      </text>
      <text x="280" y="${height/2 + 35}" fill="${p.text}" font-size="14" opacity="0.7">
        ${data.description?.slice(0, 50) || 'Powered by MCPVOT'}...
      </text>
      
      <!-- Base Badge -->
      <g transform="translate(${width - 120}, ${height - 60})">
        <rect x="0" y="0" width="100" height="40" rx="20" fill="${p.primary}" opacity="0.2"/>
        <circle cx="25" cy="20" r="12" fill="${p.primary}"/>
        <text x="25" y="25" text-anchor="middle" fill="white" font-size="12" font-weight="bold">B</text>
        <text x="60" y="25" fill="${p.text}" font-size="14">Base</text>
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 4: Base Grid - Dashboard style
// =============================================================================

const baseGrid: SVGTemplate = {
  id: 'base-004',
  name: 'Base Grid',
  category: 'base',
  description: 'Multi-panel dashboard layout',
  palette: basePalette,
  animations: ['pulse', 'scan'],
  layout: 'dashboard',
  width: 800,
  height: 600,
  tags: ['base', 'grid', 'dashboard', 'panels', 'data'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = baseGrid;
    const p = { ...palette, ...options?.customPalette };
    
    const content = `
      ${generateAnimationStyles(['pulse', 'scan'], p)}
      
      <!-- Grid Background -->
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${p.primary}" stroke-opacity="0.1"/>
      </pattern>
      <rect width="${width}" height="${height}" fill="url(#grid)"/>
      
      <!-- Panel 1: Profile -->
      <g transform="translate(20, 20)">
        <rect width="360" height="180" fill="${p.background}" stroke="${p.primary}" stroke-width="1" rx="10" opacity="0.8"/>
        <text x="20" y="35" fill="${p.accent}" font-size="12" text-transform="uppercase">Profile</text>
        <text x="20" y="80" fill="${p.text}" font-size="24" font-weight="bold">${data.title || 'Builder'}</text>
        <text x="20" y="110" fill="${p.secondary}" font-size="14">${data.subtitle || 'Base Builder'}</text>
        <text x="20" y="160" fill="${p.text}" font-size="11" font-family="monospace" opacity="0.6">
          ${data.ensName || data.address?.slice(0, 24) + '...'}
        </text>
      </g>
      
      <!-- Panel 2: Stats -->
      <g transform="translate(400, 20)">
        <rect width="380" height="180" fill="${p.background}" stroke="${p.primary}" stroke-width="1" rx="10" opacity="0.8"/>
        <text x="20" y="35" fill="${p.accent}" font-size="12">STATS</text>
        <g class="anim-pulse">
          <text x="80" y="100" text-anchor="middle" fill="${p.primary}" font-size="36" font-weight="bold">∞</text>
          <text x="80" y="130" text-anchor="middle" fill="${p.text}" font-size="12">Potential</text>
        </g>
        <g class="anim-pulse" style="animation-delay: 0.3s">
          <text x="200" y="100" text-anchor="middle" fill="${p.primary}" font-size="36" font-weight="bold">🔵</text>
          <text x="200" y="130" text-anchor="middle" fill="${p.text}" font-size="12">On Base</text>
        </g>
        <g class="anim-pulse" style="animation-delay: 0.6s">
          <text x="320" y="100" text-anchor="middle" fill="${p.primary}" font-size="36" font-weight="bold">⚡</text>
          <text x="320" y="130" text-anchor="middle" fill="${p.text}" font-size="12">Active</text>
        </g>
      </g>
      
      <!-- Panel 3: Links -->
      <g transform="translate(20, 220)">
        <rect width="760" height="150" fill="${p.background}" stroke="${p.primary}" stroke-width="1" rx="10" opacity="0.8"/>
        <text x="20" y="35" fill="${p.accent}" font-size="12">LINKS</text>
        ${Object.entries(data.links || {}).slice(0, 5).map(([key, _value], i) => `
          <g transform="translate(${20 + i * 150}, 60)">
            <rect width="130" height="70" rx="8" fill="${p.primary}" opacity="0.1"/>
            <text x="65" y="35" text-anchor="middle" fill="${p.text}" font-size="14" font-weight="bold">${key}</text>
            <text x="65" y="55" text-anchor="middle" fill="${p.secondary}" font-size="10">→</text>
          </g>
        `).join('')}
      </g>
      
      <!-- Panel 4: Activity (animated) -->
      <g transform="translate(20, 390)">
        <rect width="760" height="190" fill="${p.background}" stroke="${p.primary}" stroke-width="1" rx="10" opacity="0.8"/>
        <text x="20" y="35" fill="${p.accent}" font-size="12">ACTIVITY</text>
        ${generateCircuitLines(p, 'medium')}
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 5: Base Hero - Large hero section
// =============================================================================

const baseHero: SVGTemplate = {
  id: 'base-005',
  name: 'Base Hero',
  category: 'base',
  description: 'Large hero section with animated background',
  palette: basePalette,
  animations: ['pulse', 'float', 'particles'],
  layout: 'hero',
  width: 800,
  height: 600,
  tags: ['base', 'hero', 'large', 'animated', 'background'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = baseHero;
    const p = { ...palette, ...options?.customPalette };
    
    const content = `
      ${generateAnimationStyles(['pulse', 'float', 'breathe'], p)}
      
      <!-- Animated Background Orbs -->
      ${generatePulsingOrb(p, 100, 100, 80)}
      ${generatePulsingOrb(p, width - 100, height - 100, 60)}
      ${generatePulsingOrb(p, width - 150, 150, 40)}
      
      <!-- Central Content -->
      <g transform="translate(${width/2}, ${height/2})" class="anim-float">
        <!-- Glowing Circle -->
        <circle r="120" fill="${p.primary}" opacity="0.1">
          <animate attributeName="r" values="120;130;120" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle r="100" fill="${p.background}" stroke="${p.primary}" stroke-width="3"/>
        
        <!-- Avatar or Initial -->
        ${data.avatar 
          ? `<image href="${data.avatar}" x="-75" y="-75" width="150" height="150" clip-path="circle(75px)"/>`
          : `<text y="20" text-anchor="middle" fill="${p.primary}" font-size="72" font-weight="bold">
              ${(data.title || 'B')[0].toUpperCase()}
            </text>`
        }
      </g>
      
      <!-- Title Below -->
      <text x="${width/2}" y="${height/2 + 180}" text-anchor="middle" fill="${p.text}" font-size="42" font-weight="bold">
        ${data.title || 'Builder'}
      </text>
      
      <text x="${width/2}" y="${height/2 + 220}" text-anchor="middle" fill="${p.secondary}" font-size="18">
        ${data.subtitle || 'Building the Future on Base'}
      </text>
      
      <!-- Bottom Links -->
      <g transform="translate(${width/2}, ${height - 60})">
        ${Object.keys(data.links || {}).slice(0, 3).map((key, i) => `
          <circle cx="${(i - 1) * 80}" cy="0" r="20" fill="${p.primary}" opacity="0.2" class="anim-pulse"/>
          <text x="${(i - 1) * 80}" y="5" text-anchor="middle" fill="${p.text}" font-size="10">${key}</text>
        `).join('')}
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATES 6-10: Additional Base Templates
// =============================================================================

const baseMinimal: SVGTemplate = {
  id: 'base-006',
  name: 'Base Minimal',
  category: 'base',
  description: 'Clean minimal design with subtle animations',
  palette: basePalette,
  animations: ['pulse'],
  layout: 'minimal',
  width: 800,
  height: 600,
  tags: ['base', 'minimal', 'clean', 'simple'],
  generate: (data: UserData) => {
    const { width, height, palette } = baseMinimal;
    return generateSVGWrapper(`
      ${generateAnimationStyles(['pulse'], palette)}
      <text x="${width/2}" y="${height/2 - 20}" text-anchor="middle" fill="${palette.text}" font-size="48" font-weight="300" class="anim-pulse">
        ${data.title || 'Hello'}
      </text>
      <text x="${width/2}" y="${height/2 + 30}" text-anchor="middle" fill="${palette.secondary}" font-size="18">
        ${data.subtitle || 'Welcome to Base'}
      </text>
      <line x1="${width/2 - 100}" y1="${height/2 + 60}" x2="${width/2 + 100}" y2="${height/2 + 60}" 
        stroke="${palette.primary}" stroke-width="2" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
      </line>
    `, width, height, palette);
  }
};

const baseCyber: SVGTemplate = {
  id: 'base-007',
  name: 'Base Cyber',
  category: 'base',
  description: 'Cyberpunk style with data rain',
  palette: basePalette,
  animations: ['data-rain', 'glitch', 'scan'],
  layout: 'centered',
  width: 800,
  height: 600,
  tags: ['base', 'cyber', 'rain', 'glitch', 'matrix'],
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = baseCyber;
    return generateSVGWrapper(`
      ${generateAnimationStyles(['data-rain', 'glitch', 'scan'], palette)}
      ${options?.includeDataRain !== false ? `<g opacity="0.3">${generateCircuitLines(palette, 'high')}</g>` : ''}
      ${generateScanlines(palette, height)}
      <g class="anim-glitch">
        <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="${palette.primary}" font-size="48" font-weight="bold" font-family="monospace">
          ${data.title || 'CYBER'}
        </text>
      </g>
      <text x="${width/2}" y="${height/2 + 50}" text-anchor="middle" fill="${palette.accent}" font-size="14" font-family="monospace">
        [ ${data.address?.slice(0, 10) || '0x...'} ]
      </text>
    `, width, height, palette);
  }
};

const baseWave: SVGTemplate = {
  id: 'base-008',
  name: 'Base Wave',
  category: 'base',
  description: 'Flowing wave animations',
  palette: basePalette,
  animations: ['wave', 'float'],
  layout: 'centered',
  width: 800,
  height: 600,
  tags: ['base', 'wave', 'flow', 'smooth', 'water'],
  generate: (data: UserData) => {
    const { width, height, palette } = baseWave;
    return generateSVGWrapper(`
      ${generateAnimationStyles(['wave', 'float'], palette)}
      <!-- Animated Waves -->
      <path d="M0,${height * 0.7} Q${width * 0.25},${height * 0.6} ${width * 0.5},${height * 0.7} T${width},${height * 0.7} V${height} H0 Z" 
        fill="${palette.primary}" opacity="0.1">
        <animate attributeName="d" 
          values="M0,${height * 0.7} Q${width * 0.25},${height * 0.6} ${width * 0.5},${height * 0.7} T${width},${height * 0.7} V${height} H0 Z;
                  M0,${height * 0.7} Q${width * 0.25},${height * 0.8} ${width * 0.5},${height * 0.7} T${width},${height * 0.7} V${height} H0 Z;
                  M0,${height * 0.7} Q${width * 0.25},${height * 0.6} ${width * 0.5},${height * 0.7} T${width},${height * 0.7} V${height} H0 Z"
          dur="4s" repeatCount="indefinite"/>
      </path>
      <g class="anim-float">
        <text x="${width/2}" y="${height/2 - 50}" text-anchor="middle" fill="${palette.text}" font-size="36" font-weight="bold">
          ${data.title || 'Flow'}
        </text>
        <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="${palette.secondary}" font-size="16">
          ${data.subtitle || 'Ride the wave'}
        </text>
      </g>
    `, width, height, palette);
  }
};

const baseNeon: SVGTemplate = {
  id: 'base-009',
  name: 'Base Neon',
  category: 'base',
  description: 'Neon sign style with glow effects',
  palette: basePalette,
  animations: ['pulse', 'flicker'],
  layout: 'centered',
  width: 800,
  height: 600,
  tags: ['base', 'neon', 'glow', 'sign', 'bright'],
  generate: (data: UserData) => {
    const { width, height, palette } = baseNeon;
    return generateSVGWrapper(`
      <style>
        @keyframes neonFlicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; filter: drop-shadow(0 0 10px ${palette.primary}) drop-shadow(0 0 20px ${palette.primary}); }
          20%, 24%, 55% { opacity: 0.8; filter: drop-shadow(0 0 5px ${palette.primary}); }
        }
        .neon-text {
          animation: neonFlicker 3s infinite;
          fill: ${palette.primary};
          stroke: ${palette.primary};
          stroke-width: 1;
        }
      </style>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" class="neon-text" font-size="64" font-weight="bold">
        ${data.title || 'NEON'}
      </text>
      <text x="${width/2}" y="${height/2 + 60}" text-anchor="middle" fill="${palette.secondary}" font-size="18" opacity="0.8">
        ${data.subtitle || 'Glow in the dark'}
      </text>
      ${generateGlowingBorder(palette, width, height, 3)}
    `, width, height, palette);
  }
};

const baseOrbit: SVGTemplate = {
  id: 'base-010',
  name: 'Base Orbit',
  category: 'base',
  description: 'Orbital animations with rotating elements',
  palette: basePalette,
  animations: ['orbit', 'rotate', 'pulse'],
  layout: 'centered',
  width: 800,
  height: 600,
  tags: ['base', 'orbit', 'rotate', 'space', 'cosmic'],
  generate: (data: UserData) => {
    const { width, height, palette } = baseOrbit;
    return generateSVGWrapper(`
      ${generateAnimationStyles(['orbit', 'rotate', 'pulse'], palette)}
      <g transform="translate(${width/2}, ${height/2})">
        <!-- Orbital Rings -->
        <circle r="150" fill="none" stroke="${palette.primary}" stroke-width="1" opacity="0.2" stroke-dasharray="5,5">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite"/>
        </circle>
        <circle r="100" fill="none" stroke="${palette.secondary}" stroke-width="1" opacity="0.3" stroke-dasharray="3,3">
          <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="15s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Orbiting Objects -->
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/>
          <circle cx="150" cy="0" r="8" fill="${palette.accent}"/>
        </g>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="180" to="540" dur="8s" repeatCount="indefinite"/>
          <circle cx="100" cy="0" r="6" fill="${palette.secondary}"/>
        </g>
        
        <!-- Center -->
        <circle r="40" fill="${palette.primary}" class="anim-pulse"/>
        <text y="8" text-anchor="middle" fill="white" font-size="24" font-weight="bold">B</text>
      </g>
      <text x="${width/2}" y="${height - 80}" text-anchor="middle" fill="${palette.text}" font-size="24" font-weight="bold">
        ${data.title || 'Orbit'}
      </text>
      <text x="${width/2}" y="${height - 50}" text-anchor="middle" fill="${palette.secondary}" font-size="14">
        ${data.subtitle || 'In the Base ecosystem'}
      </text>
    `, width, height, palette);
  }
};

// =============================================================================
// EXPORT ALL BASE TEMPLATES
// =============================================================================

export const baseTemplates: SVGTemplate[] = [
  baseGenesis,
  baseTerminal,
  baseCard,
  baseGrid,
  baseHero,
  baseMinimal,
  baseCyber,
  baseWave,
  baseNeon,
  baseOrbit,
];

export default baseTemplates;
