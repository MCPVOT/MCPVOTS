/**
 * MAXX Templates (10)
 * Matrix/cyberpunk terminal theme - Green on black
 * Heavy data rain, glitch, typewriter animations
 * Updated with Cyberpunk Rank System
 */

import {
    calculateRank,
    generateAnimationStyles,
    generateGlowingBorder,
    generateSVGWrapper,
    RANK_CONFIG
} from '../../animations';
import { GenerateOptions, PALETTES, SVGTemplate, UserData } from '../../types';

const maxxPalette = PALETTES['matrix-green'];

// =============================================================================
// TEMPLATE 1: MAXX Terminal
// =============================================================================

const maxxTerminal: SVGTemplate = {
  id: 'maxx-001',
  name: 'MAXX Terminal',
  category: 'maxx',
  description: 'Classic terminal/CLI interface with typing effect and cyberpunk rank',
  palette: maxxPalette,
  animations: ['typewriter', 'flicker', 'scan'],
  layout: 'terminal',
  width: 800,
  height: 600,
  tags: ['maxx', 'terminal', 'cli', 'hacker', 'matrix', 'cyberpunk'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = maxxTerminal;
    const p = { ...palette, ...options?.customPalette };
    
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
      <style>
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(${height}px); } }
        @keyframes flicker { 0%, 100% { opacity: 0.98; } 50% { opacity: 1; } 25%, 75% { opacity: 0.96; } }
        .cursor { animation: blink 1s step-end infinite; }
        .terminal { font-family: 'Share Tech Mono', monospace; fill: ${rankConfig.color}; }
        .flicker { animation: flicker 0.1s infinite; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}" class="flicker"/>
      
      <!-- CRT effect overlay -->
      <defs>
        <pattern id="scanlines" width="100%" height="4" patternUnits="userSpaceOnUse">
          <rect width="100%" height="2" fill="transparent"/>
          <rect y="2" width="100%" height="2" fill="${rankConfig.color}" opacity="0.03"/>
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#scanlines)"/>
      
      <!-- Terminal window -->
      <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="none" stroke="${rankConfig.color}" stroke-width="2" opacity="0.8"/>
      
      <!-- Title bar -->
      <rect x="20" y="20" width="${width-40}" height="30" fill="${rankConfig.color}" opacity="0.1"/>
      <circle cx="45" cy="35" r="6" fill="#FF5F56"/>
      <circle cx="65" cy="35" r="6" fill="#FFBD2E"/>
      <circle cx="85" cy="35" r="6" fill="#27CA40"/>
      <text x="${width/2}" y="40" text-anchor="middle" class="terminal" font-size="12">maxx@ethermax:~ ${rankConfig.icon} ${rankConfig.name}</text>
      
      <!-- Terminal content -->
      <g transform="translate(40, 80)" class="terminal">
        <text y="0" font-size="14">$ whoami</text>
        <text y="25" font-size="14" fill="${p.accent}">${data.displayName || data.title}</text>
        <text y="60" font-size="14">$ cat /wallet/address</text>
        <text y="85" font-size="14" fill="${p.accent}">${data.address}</text>
        ${data.ensName ? `<text y="120" font-size="14">$ ens --resolve</text><text y="145" font-size="14" fill="${p.accent}">${data.ensName}</text>` : ''}
        ${data.basename ? `<text y="${data.ensName ? 180 : 120}" font-size="14">$ basename --get</text><text y="${data.ensName ? 205 : 145}" font-size="14" fill="${p.accent}">${data.basename}</text>` : ''}
        <text y="${data.ensName && data.basename ? 250 : data.ensName || data.basename ? 190 : 130}" font-size="14">$ balance --token VOT</text>
        <text y="${data.ensName && data.basename ? 275 : data.ensName || data.basename ? 215 : 155}" font-size="14" fill="${rankConfig.color}">${data.holdings?.votBalance || '0'} VOT</text>
        <text y="${data.ensName && data.basename ? 310 : data.ensName || data.basename ? 250 : 190}" font-size="14">$ rank --status</text>
        <text y="${data.ensName && data.basename ? 335 : data.ensName || data.basename ? 275 : 215}" font-size="14" fill="${rankConfig.color}">${rankConfig.icon} ${rankConfig.name} - ${rankConfig.title}</text>
        <text y="${data.ensName && data.basename ? 370 : data.ensName || data.basename ? 310 : 250}" font-size="14">$ status</text>
        <text y="${data.ensName && data.basename ? 395 : data.ensName || data.basename ? 335 : 275}" font-size="14" fill="${p.accent}">ONLINE - MAXX ECOSYSTEM ACTIVE</text>
        <text y="${data.ensName && data.basename ? 440 : data.ensName || data.basename ? 380 : 320}" font-size="14">$ _<tspan class="cursor">█</tspan></text>
      </g>
      
      <!-- Scanline effect -->
      <rect width="${width}" height="4" fill="${rankConfig.color}" opacity="0.1">
        <animate attributeName="y" values="0;${height};0" dur="8s" repeatCount="indefinite"/>
      </rect>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 2: MAXX Data Rain
// =============================================================================

const maxxDataRain: SVGTemplate = {
  id: 'maxx-002',
  name: 'MAXX Data Rain',
  category: 'maxx',
  description: 'Full matrix data rain effect with profile overlay',
  palette: maxxPalette,
  animations: ['data-rain', 'pulse', 'glitch'],
  layout: 'centered',
  width: 800,
  height: 600,
  tags: ['maxx', 'matrix', 'rain', 'cyberpunk'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = maxxDataRain;
    const p = { ...palette, ...options?.customPalette };
    
    // Generate data rain columns
    const rainColumns = Array.from({ length: 30 }, (_, i) => {
      const x = i * 27 + 10;
      const delay = Math.random() * 5;
      const duration = 5 + Math.random() * 5;
      const chars = 'MAXXVOT01アイウエオカキクケコ'.split('');
      const text = Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return `<text x="${x}" y="0" fill="${p.primary}" font-size="14" font-family="monospace" opacity="0.5">
        <animate attributeName="y" values="-500;${height + 100}" dur="${duration}s" repeatCount="indefinite" begin="${delay}s"/>
        ${text.split('').map((c, j) => `<tspan x="${x}" dy="20" opacity="${0.3 + (j / 20) * 0.7}">${c}</tspan>`).join('')}
      </text>`;
    }).join('');
    
    const content = `
      <style>
        @keyframes pulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        @keyframes glitch { 0%, 90%, 100% { transform: translate(0); } 92% { transform: translate(-2px, 1px); } 94% { transform: translate(2px, -1px); } }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .glitch { animation: glitch 3s infinite; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      
      <!-- Data rain background -->
      <g opacity="0.6">${rainColumns}</g>
      
      <!-- Center overlay card -->
      <g transform="translate(${width/2}, ${height/2})" class="glitch">
        <rect x="-200" y="-120" width="400" height="240" fill="${p.background}" opacity="0.95" stroke="${p.primary}" stroke-width="2"/>
        
        <text y="-60" text-anchor="middle" fill="${p.primary}" font-size="32" font-weight="bold" class="pulse">${data.displayName || data.title}</text>
        <text y="-25" text-anchor="middle" fill="${p.secondary}" font-size="16">@${data.links?.farcaster || data.ensName?.replace('.eth','') || 'matrix'}</text>
        
        <text y="20" text-anchor="middle" fill="${p.primary}" font-size="14" opacity="0.8">${data.address?.slice(0, 20)}...</text>
        
        <g transform="translate(0, 70)">
          <text x="-80" text-anchor="middle" fill="${p.primary}" font-size="24" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
          <text x="-80" y="20" text-anchor="middle" fill="${p.text}" font-size="10" opacity="0.6">VOT</text>
          <text x="80" text-anchor="middle" fill="${p.secondary}" font-size="24" font-weight="bold">${data.holdings?.maxxBalance || '0'}</text>
          <text x="80" y="20" text-anchor="middle" fill="${p.text}" font-size="10" opacity="0.6">MAXX</text>
        </g>
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 3: MAXX Glitch
// =============================================================================

const maxxGlitch: SVGTemplate = {
  id: 'maxx-003',
  name: 'MAXX Glitch',
  category: 'maxx',
  description: 'Heavy glitch effects with distortion',
  palette: maxxPalette,
  animations: ['glitch', 'flicker', 'scan'],
  layout: 'centered',
  width: 800,
  height: 600,
  tags: ['maxx', 'glitch', 'distortion', 'cyberpunk'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = maxxGlitch;
    const p = { ...palette, ...options?.customPalette };
    
    const content = `
      <style>
        @keyframes glitch1 { 0%, 90%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); } 91% { clip-path: inset(40% 0 20% 0); transform: translate(-5px); } 93% { clip-path: inset(60% 0 10% 0); transform: translate(5px); } 95% { clip-path: inset(20% 0 60% 0); transform: translate(-3px); } }
        @keyframes glitch2 { 0%, 90%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); filter: none; } 92% { clip-path: inset(10% 0 70% 0); transform: translate(3px); filter: hue-rotate(90deg); } 94% { clip-path: inset(50% 0 30% 0); transform: translate(-3px); filter: hue-rotate(-90deg); } }
        @keyframes scanline { 0% { top: 0; } 100% { top: 100%; } }
        .glitch1 { animation: glitch1 4s infinite; }
        .glitch2 { animation: glitch2 4s infinite 0.1s; }
        .glitchText { font-family: 'Courier New', monospace; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      
      <!-- Glitch layers -->
      <g class="glitch1">
        <text x="${width/2}" y="${height/2 - 40}" text-anchor="middle" fill="${p.primary}" font-size="48" font-weight="bold" class="glitchText">${data.displayName || data.title}</text>
      </g>
      <g class="glitch2">
        <text x="${width/2}" y="${height/2 - 40}" text-anchor="middle" fill="#ff0066" font-size="48" font-weight="bold" class="glitchText" opacity="0.8">${data.displayName || data.title}</text>
      </g>
      <g>
        <text x="${width/2}" y="${height/2 - 40}" text-anchor="middle" fill="#00ffff" font-size="48" font-weight="bold" class="glitchText" opacity="0.8" style="mix-blend-mode: screen;">${data.displayName || data.title}</text>
      </g>
      
      <!-- Subtitle -->
      <text x="${width/2}" y="${height/2 + 20}" text-anchor="middle" fill="${p.secondary}" font-size="20">${data.subtitle || 'MAXX ECOSYSTEM'}</text>
      
      <!-- Address -->
      <text x="${width/2}" y="${height/2 + 70}" text-anchor="middle" fill="${p.primary}" font-size="14" font-family="monospace" opacity="0.8">${data.address}</text>
      
      <!-- Stats row -->
      <g transform="translate(${width/2}, ${height/2 + 130})">
        <text x="-100" text-anchor="middle" fill="${p.primary}" font-size="28" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
        <text x="-100" y="25" text-anchor="middle" fill="${p.text}" font-size="11" opacity="0.6">VOT</text>
        <text x="100" text-anchor="middle" fill="${p.secondary}" font-size="28" font-weight="bold">${data.holdings?.maxxBalance || '0'}</text>
        <text x="100" y="25" text-anchor="middle" fill="${p.text}" font-size="11" opacity="0.6">MAXX</text>
      </g>
      
      <!-- Horizontal glitch lines -->
      ${Array.from({ length: 5 }, (_, i) => `
        <rect x="0" y="${100 + i * 100}" width="${width}" height="2" fill="${p.primary}" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="${0.5 + Math.random()}s" repeatCount="indefinite"/>
          <animate attributeName="width" values="${width};${width * 0.8};${width}" dur="${1 + Math.random()}s" repeatCount="indefinite"/>
        </rect>
      `).join('')}
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 4: MAXX Minimal
// =============================================================================

const maxxMinimal: SVGTemplate = {
  id: 'maxx-004',
  name: 'MAXX Minimal',
  category: 'maxx',
  description: 'Clean minimal green terminal style',
  palette: maxxPalette,
  animations: ['pulse'],
  layout: 'minimal',
  width: 600,
  height: 400,
  tags: ['maxx', 'minimal', 'clean', 'terminal'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = maxxMinimal;
    const p = { ...palette, ...options?.customPalette };
    
    const content = `
      <style>
        @keyframes pulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        text { font-family: 'Courier New', monospace; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="none" stroke="${p.primary}" stroke-width="1" opacity="0.5"/>
      
      <g transform="translate(${width/2}, ${height/2})">
        <text y="-30" text-anchor="middle" fill="${p.primary}" font-size="28" class="pulse">> ${data.displayName || data.title}</text>
        <text y="10" text-anchor="middle" fill="${p.secondary}" font-size="14">${data.address?.slice(0, 24)}...</text>
        <text y="50" text-anchor="middle" fill="${p.primary}" font-size="12" opacity="0.6">VOT: ${data.holdings?.votBalance || '0'} | MAXX: ${data.holdings?.maxxBalance || '0'}</text>
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 5: MAXX Dashboard
// =============================================================================

const maxxDashboard: SVGTemplate = {
  id: 'maxx-005',
  name: 'MAXX Dashboard',
  category: 'maxx',
  description: 'Full system dashboard with multiple panels',
  palette: maxxPalette,
  animations: ['pulse', 'scan', 'flicker'],
  layout: 'dashboard',
  width: 1200,
  height: 800,
  tags: ['maxx', 'dashboard', 'system', 'panels'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = maxxDashboard;
    const p = { ...palette, ...options?.customPalette };
    
    const content = `
      <style>
        @keyframes pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .panel { fill: ${p.primary}; fill-opacity: 0.03; stroke: ${p.primary}; stroke-opacity: 0.3; }
        text { font-family: 'Courier New', monospace; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      
      <!-- Header -->
      <rect x="20" y="20" width="${width-40}" height="50" class="panel"/>
      <text x="40" y="52" fill="${p.primary}" font-size="20" font-weight="bold">MAXX SYSTEM DASHBOARD</text>
      <text x="${width - 40}" y="52" text-anchor="end" fill="${p.secondary}" font-size="14">ONLINE</text>
      
      <!-- Main panels grid -->
      <g transform="translate(20, 90)">
        <!-- User Panel -->
        <rect width="380" height="300" class="panel"/>
        <text x="20" y="30" fill="${p.primary}" font-size="12" opacity="0.6">USER PROFILE</text>
        <text x="20" y="80" fill="${p.text}" font-size="24" font-weight="bold">${data.displayName || data.title}</text>
        <text x="20" y="110" fill="${p.secondary}" font-size="14">${data.address?.slice(0, 30)}...</text>
        ${data.ensName ? `<text x="20" y="150" fill="${p.accent}" font-size="14">ENS: ${data.ensName}</text>` : ''}
        ${data.basename ? `<text x="20" y="180" fill="${p.accent}" font-size="14">BASE: ${data.basename}</text>` : ''}
        <foreignObject x="20" y="200" width="340" height="80">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${p.text}; font-size: 12px; opacity: 0.7; font-family: monospace;">
            ${data.description || 'No description set'}
          </div>
        </foreignObject>
        
        <!-- Token Panel -->
        <g transform="translate(400, 0)">
          <rect width="380" height="140" class="panel"/>
          <text x="20" y="30" fill="${p.primary}" font-size="12" opacity="0.6">TOKEN BALANCES</text>
          <g transform="translate(20, 60)" class="pulse">
            <text fill="${p.primary}" font-size="36" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
            <text y="25" fill="${p.text}" font-size="12" opacity="0.6">VOT</text>
          </g>
          <g transform="translate(200, 60)" class="pulse" style="animation-delay: 0.2s">
            <text fill="${p.secondary}" font-size="36" font-weight="bold">${data.holdings?.maxxBalance || '0'}</text>
            <text y="25" fill="${p.text}" font-size="12" opacity="0.6">MAXX</text>
          </g>
        </g>
        
        <!-- Status Panel -->
        <g transform="translate(400, 160)">
          <rect width="380" height="140" class="panel"/>
          <text x="20" y="30" fill="${p.primary}" font-size="12" opacity="0.6">SYSTEM STATUS</text>
          ${[
            { label: 'Farcaster', status: data.holdings?.hasFarcaster ? 'CONNECTED' : 'OFFLINE', color: data.holdings?.hasFarcaster ? p.primary : '#666' },
            { label: 'Warplet', status: data.holdings?.hasWarplet ? 'HOLDER' : 'NONE', color: data.holdings?.hasWarplet ? '#FFD700' : '#666' },
            { label: 'Network', status: 'BASE MAINNET', color: p.secondary },
          ].map((s, i) => `
            <g transform="translate(20, ${60 + i * 25})">
              <text fill="${p.text}" font-size="12">${s.label}:</text>
              <text x="100" fill="${s.color}" font-size="12">${s.status}</text>
            </g>
          `).join('')}
        </g>
        
        <!-- Links Panel -->
        <g transform="translate(800, 0)">
          <rect width="360" height="300" class="panel"/>
          <text x="20" y="30" fill="${p.primary}" font-size="12" opacity="0.6">NETWORK LINKS</text>
          ${Object.entries(data.links || {}).slice(0, 8).map(([key, val], i) => `
            <g transform="translate(20, ${60 + i * 30})">
              <text fill="${p.primary}" font-size="12">${key}:</text>
              <text x="100" fill="${p.text}" font-size="12" opacity="0.8">${val}</text>
            </g>
          `).join('')}
        </g>
      </g>
      
      <!-- Bottom stats bar -->
      <g transform="translate(20, ${height - 100})">
        <rect width="${width - 40}" height="80" class="panel"/>
        <text x="20" y="50" fill="${p.primary}" font-size="12">MCPVOT ECOSYSTEM | ERC-4804 | BASE NETWORK | web3://${data.basename || data.ensName || data.address?.slice(0, 12) + '...'}/</text>
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 6: MAXX ASCII Art
// =============================================================================

const maxxAscii: SVGTemplate = {
  id: 'maxx-006',
  name: 'MAXX ASCII',
  category: 'maxx',
  description: 'ASCII art style with text graphics',
  palette: maxxPalette,
  animations: ['typewriter', 'flicker'],
  layout: 'terminal',
  width: 800,
  height: 600,
  tags: ['maxx', 'ascii', 'art', 'retro'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = maxxAscii;
    const p = { ...palette, ...options?.customPalette };
    
    const asciiName = (data.displayName || data.title || 'MAXX').toUpperCase();
    
    const content = `
      <style>
        @keyframes flicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.95; } 25%, 75% { opacity: 0.98; } }
        .flicker { animation: flicker 0.15s infinite; }
        text { font-family: 'Courier New', monospace; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}" class="flicker"/>
      
      <g transform="translate(40, 60)">
        <!-- ASCII border -->
        <text fill="${p.primary}" font-size="12">╔${'═'.repeat(90)}╗</text>
        ${Array.from({ length: 20 }, (_, i) => `
          <text y="${20 + i * 18}" fill="${p.primary}" font-size="12">║${' '.repeat(90)}║</text>
        `).join('')}
        <text y="${20 + 20 * 18}" fill="${p.primary}" font-size="12">╚${'═'.repeat(90)}╝</text>
        
        <!-- Content -->
        <g transform="translate(30, 50)">
          <text fill="${p.primary}" font-size="14">┌──────────────────────────────────────────┐</text>
          <text y="20" fill="${p.primary}" font-size="14">│  USER: ${asciiName.padEnd(33)}│</text>
          <text y="40" fill="${p.primary}" font-size="14">└──────────────────────────────────────────┘</text>
          
          <text y="80" fill="${p.secondary}" font-size="12">> WALLET</text>
          <text y="100" fill="${p.text}" font-size="12">  ${data.address}</text>
          
          ${data.ensName ? `<text y="130" fill="${p.secondary}" font-size="12">> ENS</text><text y="150" fill="${p.text}" font-size="12">  ${data.ensName}</text>` : ''}
          
          <text y="${data.ensName ? 190 : 140}" fill="${p.secondary}" font-size="12">> BALANCES</text>
          <text y="${data.ensName ? 210 : 160}" fill="${p.text}" font-size="12">  VOT:  ${(data.holdings?.votBalance || '0').padStart(15)}</text>
          <text y="${data.ensName ? 230 : 180}" fill="${p.text}" font-size="12">  MAXX: ${(data.holdings?.maxxBalance || '0').padStart(15)}</text>
          
          <text y="${data.ensName ? 270 : 220}" fill="${p.secondary}" font-size="12">> STATUS</text>
          <text y="${data.ensName ? 290 : 240}" fill="${p.primary}" font-size="12">  [${data.holdings?.hasFarcaster ? '✓' : ' '}] Farcaster  [${data.holdings?.hasWarplet ? '✓' : ' '}] Warplet</text>
        </g>
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 7: MAXX Hex Grid
// =============================================================================

const maxxHexGrid: SVGTemplate = {
  id: 'maxx-007',
  name: 'MAXX Hex Grid',
  category: 'maxx',
  description: 'Hexagonal grid background with data overlay',
  palette: maxxPalette,
  animations: ['pulse', 'float'],
  layout: 'centered',
  width: 800,
  height: 600,
  tags: ['maxx', 'hex', 'grid', 'futuristic'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = maxxHexGrid;
    const p = { ...palette, ...options?.customPalette };
    
    // Generate hex grid
    const hexSize = 30;
    const hexes = [];
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 16; col++) {
        const x = col * hexSize * 1.5 + (row % 2) * hexSize * 0.75;
        const y = row * hexSize * 0.866;
        const opacity = 0.1 + Math.random() * 0.2;
        hexes.push(`<polygon points="${x},${y-hexSize/2} ${x+hexSize/2},${y-hexSize/4} ${x+hexSize/2},${y+hexSize/4} ${x},${y+hexSize/2} ${x-hexSize/2},${y+hexSize/4} ${x-hexSize/2},${y-hexSize/4}" fill="none" stroke="${p.primary}" stroke-width="0.5" opacity="${opacity}"/>`);
      }
    }
    
    const content = `
      <style>
        @keyframes pulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .float { animation: float 4s ease-in-out infinite; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      
      <!-- Hex grid -->
      <g transform="translate(40, 40)">${hexes.join('')}</g>
      
      <!-- Center content -->
      <g transform="translate(${width/2}, ${height/2})" class="float">
        <rect x="-200" y="-100" width="400" height="200" fill="${p.background}" opacity="0.95" stroke="${p.primary}" stroke-width="2"/>
        
        <text y="-50" text-anchor="middle" fill="${p.primary}" font-size="32" font-weight="bold" font-family="monospace" class="pulse">${data.displayName || data.title}</text>
        <text y="-15" text-anchor="middle" fill="${p.secondary}" font-size="16" font-family="monospace">${data.address?.slice(0, 24)}...</text>
        
        <g transform="translate(0, 40)">
          <text x="-80" text-anchor="middle" fill="${p.primary}" font-size="24" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
          <text x="-80" y="20" text-anchor="middle" fill="${p.text}" font-size="10" opacity="0.6">VOT</text>
          <text x="80" text-anchor="middle" fill="${p.secondary}" font-size="24" font-weight="bold">${data.holdings?.maxxBalance || '0'}</text>
          <text x="80" y="20" text-anchor="middle" fill="${p.text}" font-size="10" opacity="0.6">MAXX</text>
        </g>
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 8: MAXX Boot Sequence
// =============================================================================

const maxxBootSequence: SVGTemplate = {
  id: 'maxx-008',
  name: 'MAXX Boot',
  category: 'maxx',
  description: 'System boot sequence display',
  palette: maxxPalette,
  animations: ['typewriter', 'pulse', 'scan'],
  layout: 'terminal',
  width: 800,
  height: 600,
  tags: ['maxx', 'boot', 'sequence', 'system'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = maxxBootSequence;
    const p = { ...palette, ...options?.customPalette };
    
    const bootLines = [
      { text: 'MAXX BIOS v2.0.0', delay: 0 },
      { text: 'Initializing system...', delay: 0.3 },
      { text: `Loading profile: ${data.displayName || data.title}`, delay: 0.6 },
      { text: `Wallet: ${data.address?.slice(0, 30)}...`, delay: 0.9 },
      { text: `VOT Balance: ${data.holdings?.votBalance || '0'}`, delay: 1.2 },
      { text: `MAXX Balance: ${data.holdings?.maxxBalance || '0'}`, delay: 1.5 },
      { text: `Farcaster: ${data.holdings?.hasFarcaster ? 'CONNECTED' : 'OFFLINE'}`, delay: 1.8 },
      { text: 'ERC-4804: ENABLED', delay: 2.1 },
      { text: 'IPFS: ONLINE', delay: 2.4 },
      { text: 'System ready.', delay: 2.7 },
    ];
    
    const content = `
      <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        .boot-line { opacity: 0; animation: fadeIn 0.3s forwards; }
        .cursor { animation: blink 1s step-end infinite; }
        text { font-family: 'Courier New', monospace; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="none" stroke="${p.primary}" stroke-width="1" opacity="0.5"/>
      
      <g transform="translate(50, 60)">
        <text fill="${p.secondary}" font-size="16">MAXX ECOSYSTEM</text>
        <text y="30" fill="${p.primary}" font-size="12" opacity="0.6">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</text>
        
        ${bootLines.map((line, i) => `
          <text y="${70 + i * 35}" fill="${i === bootLines.length - 1 ? p.secondary : p.primary}" font-size="14" class="boot-line" style="animation-delay: ${line.delay}s">
            > ${line.text}
          </text>
        `).join('')}
        
        <text y="${70 + bootLines.length * 35 + 20}" fill="${p.primary}" font-size="14" class="boot-line" style="animation-delay: 3s">
          > _<tspan class="cursor">█</tspan>
        </text>
      </g>
      
      <!-- Progress bar -->
      <g transform="translate(50, ${height - 60})">
        <rect width="700" height="20" fill="none" stroke="${p.primary}" stroke-width="1"/>
        <rect width="0" height="18" x="1" y="1" fill="${p.primary}">
          <animate attributeName="width" from="0" to="698" dur="3s" fill="freeze"/>
        </rect>
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 9: MAXX Network
// =============================================================================

const maxxNetwork: SVGTemplate = {
  id: 'maxx-009',
  name: 'MAXX Network',
  category: 'maxx',
  description: 'Network node visualization',
  palette: maxxPalette,
  animations: ['pulse', 'rotate', 'float'],
  layout: 'centered',
  width: 800,
  height: 600,
  tags: ['maxx', 'network', 'nodes', 'connections'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = maxxNetwork;
    const p = { ...palette, ...options?.customPalette };
    
    // Generate network nodes
    const nodes = [
      { x: width/2, y: height/2, r: 60, label: 'YOU' },
      { x: width/2 - 200, y: height/2 - 100, r: 30, label: 'VOT' },
      { x: width/2 + 200, y: height/2 - 100, r: 30, label: 'MAXX' },
      { x: width/2 - 200, y: height/2 + 100, r: 30, label: 'IPFS' },
      { x: width/2 + 200, y: height/2 + 100, r: 30, label: 'BASE' },
      { x: width/2, y: height/2 - 200, r: 25, label: 'ENS' },
      { x: width/2, y: height/2 + 200, r: 25, label: 'x402' },
    ];
    
    const connections = nodes.slice(1).map(n => `
      <line x1="${width/2}" y1="${height/2}" x2="${n.x}" y2="${n.y}" stroke="${p.primary}" stroke-width="1" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="${2 + Math.random() * 2}s" repeatCount="indefinite"/>
      </line>
    `).join('');
    
    const content = `
      <style>
        @keyframes pulse { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .orbit { animation: orbit 20s linear infinite; transform-origin: ${width/2}px ${height/2}px; }
      </style>
      
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      
      <!-- Orbital rings -->
      <circle cx="${width/2}" cy="${height/2}" r="150" fill="none" stroke="${p.primary}" stroke-width="1" opacity="0.2" stroke-dasharray="5,5" class="orbit"/>
      <circle cx="${width/2}" cy="${height/2}" r="200" fill="none" stroke="${p.primary}" stroke-width="1" opacity="0.1" stroke-dasharray="10,10" class="orbit" style="animation-direction: reverse;"/>
      
      <!-- Connections -->
      ${connections}
      
      <!-- Nodes -->
      ${nodes.map((n, i) => `
        <g transform="translate(${n.x}, ${n.y})" class="pulse" style="animation-delay: ${i * 0.2}s">
          <circle r="${n.r}" fill="${i === 0 ? p.primary : p.background}" stroke="${p.primary}" stroke-width="2" opacity="${i === 0 ? 0.3 : 1}"/>
          <text text-anchor="middle" y="${i === 0 ? -10 : 5}" fill="${i === 0 ? p.text : p.primary}" font-size="${i === 0 ? 14 : 10}" font-weight="bold">${n.label}</text>
          ${i === 0 ? `<text text-anchor="middle" y="15" fill="${p.text}" font-size="12">${(data.displayName || data.title).slice(0, 10)}</text>` : ''}
        </g>
      `).join('')}
      
      <!-- Stats footer -->
      <g transform="translate(${width/2}, ${height - 40})">
        <text text-anchor="middle" fill="${p.text}" font-size="12" opacity="0.6" font-family="monospace">
          VOT: ${data.holdings?.votBalance || '0'} | MAXX: ${data.holdings?.maxxBalance || '0'} | ${data.address?.slice(0, 16)}...
        </text>
      </g>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// TEMPLATE 10: MAXX Full
// =============================================================================

const maxxFull: SVGTemplate = {
  id: 'maxx-010',
  name: 'MAXX Full',
  category: 'maxx',
  description: 'Complete MAXX experience with all effects',
  palette: maxxPalette,
  animations: ['data-rain', 'glitch', 'pulse', 'scan', 'typewriter'],
  layout: 'dashboard',
  width: 1200,
  height: 800,
  requirements: { hasMAXX: true },
  tags: ['maxx', 'full', 'complete', 'premium'],
  
  generate: (data: UserData, options?: GenerateOptions) => {
    const { width, height, palette } = maxxFull;
    const p = { ...palette, ...options?.customPalette };
    const styles = generateAnimationStyles(['data-rain', 'glitch', 'pulse', 'scan', 'typewriter'], p, options?.animationSpeed);
    
    // Generate data rain
    const rainColumns = Array.from({ length: 40 }, (_, i) => {
      const x = i * 30 + 5;
      const delay = Math.random() * 5;
      const duration = 4 + Math.random() * 4;
      return `<text x="${x}" y="0" fill="${p.primary}" font-size="12" font-family="monospace" opacity="0.3">
        <animate attributeName="y" values="-200;${height + 50}" dur="${duration}s" repeatCount="indefinite" begin="${delay}s"/>
        ${Array.from({ length: 15 }, () => Math.random() > 0.5 ? '1' : '0').map((c) => `<tspan x="${x}" dy="16">${c}</tspan>`).join('')}
      </text>`;
    }).join('');
    
    const content = `
      ${styles}
      
      <rect width="${width}" height="${height}" fill="${p.background}"/>
      
      <!-- Data rain layer -->
      <g opacity="0.4">${rainColumns}</g>
      
      <!-- Scanlines -->
      <defs>
        <pattern id="scanlines" width="100%" height="4" patternUnits="userSpaceOnUse">
          <rect width="100%" height="2" fill="${p.primary}" opacity="0.02"/>
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#scanlines)"/>
      
      ${generateGlowingBorder(p, width, height)}
      
      <!-- Header -->
      <rect x="40" y="40" width="${width-80}" height="60" fill="${p.primary}" opacity="0.1"/>
      <text x="60" y="78" fill="${p.primary}" font-size="24" font-weight="bold" font-family="monospace">MAXX ECOSYSTEM TERMINAL</text>
      <text x="${width - 60}" y="78" text-anchor="end" fill="${p.secondary}" font-size="14" font-family="monospace">v2.0.0</text>
      
      <!-- Main content grid -->
      <g transform="translate(40, 120)">
        <!-- User panel -->
        <rect width="500" height="280" fill="${p.primary}" opacity="0.03" stroke="${p.primary}" stroke-opacity="0.3"/>
        <text x="20" y="30" fill="${p.primary}" font-size="12" opacity="0.6" font-family="monospace">USER_PROFILE</text>
        
        <g transform="translate(20, 60)">
          ${data.avatar ? `<circle cx="50" cy="50" r="45" fill="${p.background}" stroke="${p.primary}" stroke-width="2"/>
          <clipPath id="maxxav"><circle cx="50" cy="50" r="43"/></clipPath>
          <image href="${data.avatar}" x="7" y="7" width="86" height="86" clip-path="url(#maxxav)"/>` :
          `<circle cx="50" cy="50" r="45" fill="${p.background}" stroke="${p.primary}" stroke-width="2"/>
          <text x="50" y="60" text-anchor="middle" fill="${p.primary}" font-size="36">${(data.displayName || 'M')[0]}</text>`}
          
          <g transform="translate(120, 20)">
            <text fill="${p.text}" font-size="24" font-weight="bold" class="anim-glitch">${data.displayName || data.title}</text>
            <text y="30" fill="${p.secondary}" font-size="14">@${data.links?.farcaster || 'matrix'}</text>
            <text y="55" fill="${p.primary}" font-size="11" font-family="monospace">${data.address}</text>
          </g>
        </g>
        
        <foreignObject x="20" y="180" width="460" height="80">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${p.text}; font-size: 13px; opacity: 0.8; font-family: monospace; line-height: 1.5;">
            > ${data.description || 'Connected to the MAXX Ecosystem. Ready for operations.'}
          </div>
        </foreignObject>
        
        <!-- Token panel -->
        <g transform="translate(520, 0)">
          <rect width="600" height="130" fill="${p.primary}" opacity="0.03" stroke="${p.primary}" stroke-opacity="0.3"/>
          <text x="20" y="30" fill="${p.primary}" font-size="12" opacity="0.6" font-family="monospace">TOKEN_BALANCES</text>
          
          <g transform="translate(30, 60)" class="anim-pulse">
            <text fill="${p.primary}" font-size="40" font-weight="bold">${data.holdings?.votBalance || '0'}</text>
            <text y="25" fill="${p.text}" font-size="12" opacity="0.6">VOT</text>
          </g>
          <g transform="translate(230, 60)" class="anim-pulse" style="animation-delay: 0.2s">
            <text fill="${p.secondary}" font-size="40" font-weight="bold">${data.holdings?.maxxBalance || '0'}</text>
            <text y="25" fill="${p.text}" font-size="12" opacity="0.6">MAXX</text>
          </g>
          <g transform="translate(430, 60)" class="anim-pulse" style="animation-delay: 0.4s">
            <text fill="${p.accent}" font-size="40" font-weight="bold">${data.holdings?.hasWarplet ? '✓' : '○'}</text>
            <text y="25" fill="${p.text}" font-size="12" opacity="0.6">WARPLET</text>
          </g>
        </g>
        
        <!-- Status panel -->
        <g transform="translate(520, 150)">
          <rect width="600" height="130" fill="${p.primary}" opacity="0.03" stroke="${p.primary}" stroke-opacity="0.3"/>
          <text x="20" y="30" fill="${p.primary}" font-size="12" opacity="0.6" font-family="monospace">SYSTEM_STATUS</text>
          
          ${[
            { label: 'FARCASTER', value: data.holdings?.hasFarcaster ? 'ONLINE' : 'OFFLINE', color: data.holdings?.hasFarcaster ? p.primary : '#666' },
            { label: 'BASENAME', value: data.basename || 'NOT SET', color: data.basename ? p.secondary : '#666' },
            { label: 'ENS', value: data.ensName || 'NOT SET', color: data.ensName ? p.accent : '#666' },
            { label: 'ERC-4804', value: 'ENABLED', color: p.primary },
          ].map((s, i) => `
            <g transform="translate(${20 + (i % 2) * 290}, ${55 + Math.floor(i / 2) * 35})">
              <text fill="${p.text}" font-size="12" font-family="monospace">${s.label}:</text>
              <text x="100" fill="${s.color}" font-size="12" font-family="monospace">${s.value}</text>
            </g>
          `).join('')}
        </g>
      </g>
      
      <!-- Links section -->
      <g transform="translate(40, 420)">
        <rect width="${width - 80}" height="180" fill="${p.primary}" opacity="0.03" stroke="${p.primary}" stroke-opacity="0.3"/>
        <text x="20" y="30" fill="${p.primary}" font-size="12" opacity="0.6" font-family="monospace">NETWORK_LINKS</text>
        
        ${Object.entries(data.links || {}).slice(0, 8).map(([key, val], i) => `
          <g transform="translate(${20 + (i % 4) * 280}, ${60 + Math.floor(i / 4) * 50})" class="anim-pulse" style="animation-delay: ${i * 0.1}s">
            <rect width="260" height="40" fill="${p.primary}" opacity="0.05"/>
            <text x="10" y="26" fill="${p.primary}" font-size="12" font-family="monospace">${key}</text>
            <text x="80" y="26" fill="${p.text}" font-size="12" font-family="monospace" opacity="0.8">${val}</text>
          </g>
        `).join('')}
      </g>
      
      <!-- Footer -->
      <g transform="translate(${width/2}, ${height - 50})">
        <text text-anchor="middle" fill="${p.text}" font-size="12" opacity="0.4" font-family="monospace">
          MCPVOT ECOSYSTEM | web3://${data.basename || data.ensName || data.address?.slice(0, 12) + '...'}/ | BASE MAINNET
        </text>
        <text y="20" text-anchor="middle" fill="${p.primary}" font-size="10" opacity="0.3" font-family="monospace">
          Powered by MAXX | ERC-4804 Compliant
        </text>
      </g>
      
      <!-- Moving scanline -->
      <rect width="${width}" height="4" fill="${p.primary}" opacity="0.1">
        <animate attributeName="y" values="0;${height};0" dur="6s" repeatCount="indefinite"/>
      </rect>
    `;
    
    return generateSVGWrapper(content, width, height, p);
  }
};

// =============================================================================
// EXPORT ALL MAXX TEMPLATES
// =============================================================================

export const maxxTemplates: SVGTemplate[] = [
  maxxTerminal,
  maxxDataRain,
  maxxGlitch,
  maxxMinimal,
  maxxDashboard,
  maxxAscii,
  maxxHexGrid,
  maxxBootSequence,
  maxxNetwork,
  maxxFull,
];

export default maxxTemplates;