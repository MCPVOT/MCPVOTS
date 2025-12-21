/**
 * SVG Machine Modular Components
 * 
 * Reusable SVG components for all templates:
 * - generateHeader: Protocol branding header
 * - generateFooter: Address and network footer  
 * - generateGauge: Circular progress ring
 * - generateRadar: Rotating radar sweep
 * - generateBackground: Circuit patterns, scanlines, corners
 * - generateIdentity: Hexagonal avatar frame
 * - formatAddress: 0x1234...5678 format
 */

import type { ColorPalette } from '../types';

// =============================================================================
// HELPER UTILITIES
// =============================================================================

export function formatAddress(address?: string): string {
  if (!address) return '0x0000...0000';
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBalance(balance?: string | number): string {
  if (!balance) return '---';
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num)) return '---';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

// =============================================================================
// GENERATE HEADER
// =============================================================================

interface HeaderConfig {
  protocolName: string;
  width: number;
  palette: ColorPalette;
  yOffset?: number;
  showStatusDots?: boolean;
}

export function generateHeader(config: HeaderConfig): string {
  const { protocolName, width, palette, yOffset = 20, showStatusDots = true } = config;
  
  const statusDots = showStatusDots ? `
    <g transform="translate(${width - 60}, ${yOffset})">
      <circle cx="0" cy="0" r="4" fill="#00ff00" opacity="0.8">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="15" cy="0" r="4" fill="${palette.primary}" opacity="0.6"/>
      <circle cx="30" cy="0" r="4" fill="${palette.secondary}" opacity="0.4"/>
    </g>
  ` : '';

  return `
    <g class="header">
      <!-- Protocol Name -->
      <text x="25" y="${yOffset + 5}" 
            style="font-family: 'Orbitron', 'Courier New', monospace; font-size: 12px; 
                   fill: ${palette.primary}; letter-spacing: 2px; font-weight: bold;">
        ${protocolName}
      </text>
      <!-- Underline -->
      <line x1="25" y1="${yOffset + 12}" x2="${width - 70}" y2="${yOffset + 12}" 
            stroke="${palette.primary}" stroke-width="1" opacity="0.3"/>
      ${statusDots}
    </g>
  `;
}

// =============================================================================
// GENERATE FOOTER
// =============================================================================

interface FooterConfig {
  address?: string;
  networkLabel?: string;
  width: number;
  height: number;
  palette: ColorPalette;
  bottomOffset?: number;
  socialBadge?: string;
}

export function generateFooter(config: FooterConfig): string {
  const { address, networkLabel = 'BASE NETWORK', width, height, palette, bottomOffset = 20, socialBadge } = config;
  const y = height - bottomOffset;
  
  const social = socialBadge ? `
    <text x="${width - 25}" y="${y}" text-anchor="end"
          style="font-family: monospace; font-size: 10px; fill: ${palette.accent};">
      ${socialBadge}
    </text>
  ` : '';
  
  return `
    <g class="footer">
      <!-- Top Line -->
      <line x1="25" y1="${y - 15}" x2="${width - 25}" y2="${y - 15}" 
            stroke="${palette.primary}" stroke-width="1" opacity="0.2"/>
      <!-- Address -->
      <text x="25" y="${y}" 
            style="font-family: 'Courier New', monospace; font-size: 10px; fill: ${palette.secondary};">
        ${formatAddress(address)}
      </text>
      <!-- Network Label -->
      <text x="${width / 2}" y="${y}" text-anchor="middle"
            style="font-family: 'Orbitron', sans-serif; font-size: 9px; 
                   fill: ${palette.primary}; letter-spacing: 1px; opacity: 0.7;">
        ${networkLabel}
      </text>
      ${social}
    </g>
  `;
}

// =============================================================================
// GENERATE GAUGE (Circular Progress Ring)
// =============================================================================

interface GaugeConfig {
  label: string;
  value: string;
  subValue?: string;
  cx: number;
  cy: number;
  radius: number;
  palette: ColorPalette;
  uniqueId: string;
  progress?: number; // 0-100
}

export function generateGauge(config: GaugeConfig): string {
  const { label, value, subValue, cx, cy, radius, palette, uniqueId, progress = 75 } = config;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - progress / 100);
  
  return `
    <g class="gauge" transform="translate(${cx}, ${cy})">
      <!-- Background Ring -->
      <circle r="${radius}" fill="none" stroke="${palette.secondary}" stroke-width="4" opacity="0.2"/>
      <!-- Progress Ring -->
      <circle r="${radius}" fill="none" stroke="${palette.primary}" stroke-width="4"
              stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}"
              stroke-linecap="round" transform="rotate(-90)">
        <animate attributeName="stroke-dashoffset" 
                 from="${circumference}" to="${strokeDashoffset}" 
                 dur="1.5s" fill="freeze" calcMode="spline"
                 keySplines="0.4 0 0.2 1"/>
      </circle>
      <!-- Glow -->
      <circle r="${radius - 8}" fill="${palette.primary}" opacity="0.05">
        <animate attributeName="opacity" values="0.05;0.1;0.05" dur="2s" repeatCount="indefinite"/>
      </circle>
      <!-- Label -->
      <text y="${-radius - 12}" text-anchor="middle" 
            style="font-family: 'Orbitron', sans-serif; font-size: 9px; 
                   fill: ${palette.secondary}; letter-spacing: 1px;">
        ${label}
      </text>
      <!-- Value -->
      <text y="5" text-anchor="middle" 
            style="font-family: 'Orbitron', sans-serif; font-size: 16px; 
                   fill: ${palette.accent}; font-weight: bold;">
        ${value}
      </text>
      <!-- Sub Value -->
      ${subValue ? `
        <text y="22" text-anchor="middle" 
              style="font-family: monospace; font-size: 10px; fill: ${palette.secondary};">
          ${subValue}
        </text>
      ` : ''}
    </g>
  `;
}

// =============================================================================
// GENERATE RADAR (Rotating Sweep)
// =============================================================================

interface RadarConfig {
  label: string;
  value: string;
  subValue?: string;
  cx: number;
  cy: number;
  radius: number;
  palette: ColorPalette;
  uniqueId: string;
}

export function generateRadar(config: RadarConfig): string {
  const { label, value, subValue, cx, cy, radius, palette, uniqueId } = config;
  
  return `
    <g class="radar" transform="translate(${cx}, ${cy})">
      <!-- Outer Ring -->
      <circle r="${radius}" fill="none" stroke="${palette.primary}" stroke-width="1" opacity="0.3"/>
      <circle r="${radius * 0.7}" fill="none" stroke="${palette.primary}" stroke-width="1" opacity="0.2"/>
      <circle r="${radius * 0.4}" fill="none" stroke="${palette.primary}" stroke-width="1" opacity="0.1"/>
      
      <!-- Sweep -->
      <g transform="rotate(0)">
        <animateTransform attributeName="transform" type="rotate" 
                          from="0" to="360" dur="4s" repeatCount="indefinite"/>
        <line x1="0" y1="0" x2="0" y2="${-radius}" 
              stroke="${palette.accent}" stroke-width="2" opacity="0.8"/>
        <path d="M 0 0 L ${-radius * 0.3} ${-radius} L ${radius * 0.3} ${-radius} Z" 
              fill="${palette.accent}" opacity="0.15"/>
      </g>
      
      <!-- Center Dot -->
      <circle r="4" fill="${palette.accent}">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite"/>
      </circle>
      
      <!-- Label -->
      <text y="${-radius - 12}" text-anchor="middle" 
            style="font-family: 'Orbitron', sans-serif; font-size: 9px; 
                   fill: ${palette.secondary}; letter-spacing: 1px;">
        ${label}
      </text>
      <!-- Value -->
      <text y="5" text-anchor="middle" 
            style="font-family: 'Orbitron', sans-serif; font-size: 14px; 
                   fill: ${palette.primary}; font-weight: bold;">
        ${value}
      </text>
      <!-- Sub Value -->
      ${subValue ? `
        <text y="22" text-anchor="middle" 
              style="font-family: monospace; font-size: 10px; fill: ${palette.secondary};">
          ${subValue}
        </text>
      ` : ''}
    </g>
  `;
}

// =============================================================================
// GENERATE BACKGROUND
// =============================================================================

interface BackgroundConfig {
  width: number;
  height: number;
  palette: ColorPalette;
  uniqueId: string;
  includeCircuit?: boolean;
  includeScanlines?: boolean;
  includeCorners?: boolean;
}

export function generateBackground(config: BackgroundConfig): string {
  const { 
    width, height, palette, uniqueId, 
    includeCircuit = true, 
    includeScanlines = true,
    includeCorners = true 
  } = config;
  
  const circuit = includeCircuit ? `
    <!-- Circuit Pattern -->
    <g opacity="0.08">
      ${Array.from({ length: 8 }, (_, i) => `
        <line x1="${(i + 1) * (width / 9)}" y1="0" 
              x2="${(i + 1) * (width / 9)}" y2="${height}" 
              stroke="${palette.primary}" stroke-width="1"/>
      `).join('')}
      ${Array.from({ length: 4 }, (_, i) => `
        <line x1="0" y1="${(i + 1) * (height / 5)}" 
              x2="${width}" y2="${(i + 1) * (height / 5)}" 
              stroke="${palette.primary}" stroke-width="1"/>
      `).join('')}
      <!-- Random nodes -->
      ${Array.from({ length: 12 }, (_, i) => {
        const x = 50 + (i * 70) % (width - 100);
        const y = 30 + Math.floor(i / 3) * 50;
        return `<circle cx="${x}" cy="${y}" r="2" fill="${palette.primary}"/>`;
      }).join('')}
    </g>
  ` : '';
  
  const scanlines = includeScanlines ? `
    <!-- Scanlines -->
    <defs>
      <pattern id="scanlines-${uniqueId}" width="4" height="4" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="4" y2="0" stroke="${palette.primary}" stroke-width="0.5" opacity="0.1"/>
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#scanlines-${uniqueId})"/>
  ` : '';
  
  const corners = includeCorners ? `
    <!-- Corner Accents -->
    <g stroke="${palette.primary}" stroke-width="2" fill="none" opacity="0.5">
      <!-- Top Left -->
      <path d="M 5 20 L 5 5 L 20 5"/>
      <!-- Top Right -->
      <path d="M ${width - 20} 5 L ${width - 5} 5 L ${width - 5} 20"/>
      <!-- Bottom Left -->
      <path d="M 5 ${height - 20} L 5 ${height - 5} L 20 ${height - 5}"/>
      <!-- Bottom Right -->
      <path d="M ${width - 20} ${height - 5} L ${width - 5} ${height - 5} L ${width - 5} ${height - 20}"/>
    </g>
  ` : '';
  
  return `
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="${palette.background}"/>
    ${circuit}
    ${scanlines}
    ${corners}
  `;
}

// =============================================================================
// GENERATE IDENTITY (Hexagonal Avatar Frame)
// =============================================================================

interface IdentityConfig {
  cx: number;
  cy: number;
  size: number;
  palette: ColorPalette;
  uniqueId: string;
  emoji?: string;
  imageUrl?: string;
}

export function generateIdentity(config: IdentityConfig): string {
  const { cx, cy, size, palette, uniqueId, emoji = '🔮', imageUrl } = config;
  const r = size / 2;
  
  // Hexagon points
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');
  
  const innerHexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + (r * 0.85) * Math.cos(angle);
    const y = cy + (r * 0.85) * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');
  
  return `
    <g class="identity">
      <!-- Outer Glow -->
      <polygon points="${hexPoints}" fill="${palette.primary}" opacity="0.1">
        <animate attributeName="opacity" values="0.1;0.2;0.1" dur="2s" repeatCount="indefinite"/>
      </polygon>
      
      <!-- Main Hex -->
      <polygon points="${hexPoints}" fill="none" stroke="${palette.primary}" stroke-width="2"/>
      
      <!-- Inner Hex -->
      <polygon points="${innerHexPoints}" fill="${palette.background}" 
               stroke="${palette.secondary}" stroke-width="1" opacity="0.8"/>
      
      <!-- Chromatic Aberration Effect -->
      <g filter="url(#chromatic-${uniqueId})">
        ${imageUrl ? `
          <clipPath id="hex-clip-${uniqueId}">
            <polygon points="${innerHexPoints}"/>
          </clipPath>
          <image href="${imageUrl}" x="${cx - r * 0.7}" y="${cy - r * 0.7}" 
                 width="${r * 1.4}" height="${r * 1.4}" 
                 clip-path="url(#hex-clip-${uniqueId})"/>
        ` : `
          <text x="${cx}" y="${cy + size * 0.12}" text-anchor="middle" 
                style="font-size: ${size * 0.5}px;">
            ${emoji}
          </text>
        `}
      </g>
      
      <!-- Rotating Ring -->
      <circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="none" 
              stroke="${palette.accent}" stroke-width="1" stroke-dasharray="10 20" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" 
                          from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="20s" repeatCount="indefinite"/>
      </circle>
    </g>
    
    <defs>
      <filter id="chromatic-${uniqueId}">
        <feOffset in="SourceGraphic" dx="-1" dy="0" result="red"/>
        <feOffset in="SourceGraphic" dx="1" dy="0" result="blue"/>
        <feColorMatrix in="red" type="matrix" 
                       values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red-only"/>
        <feColorMatrix in="blue" type="matrix" 
                       values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue-only"/>
        <feBlend in="red-only" in2="SourceGraphic" mode="screen" result="red-blend"/>
        <feBlend in="blue-only" in2="red-blend" mode="screen"/>
      </filter>
    </defs>
  `;
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  formatAddress,
  formatBalance,
  generateHeader,
  generateFooter,
  generateGauge,
  generateRadar,
  generateBackground,
  generateIdentity
};
