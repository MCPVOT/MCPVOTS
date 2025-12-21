/**
 * MCPVOT SVG NFT Generator
 * 
 * Generates cyberpunk-style SVG NFTs based on mcpvot_banner_ultra.svg design language
 * 
 * Design Elements:
 * - Circuit board patterns
 * - Animated gauges and scanners
 * - Glitch effects
 * - Data rain overlays
 * - Mission control aesthetic
 * 
 * Colors:
 * - Primary: #00ffcc (cyan)
 * - Accent: #ff6600 (orange)
 * - Background: #000000 (black)
 * - Highlight: #ff0066 (pink for glitch)
 */

export interface NFTMetadata {
  tokenId: string;
  owner: string;
  votAmount: string;
  txHash: string;
  timestamp: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface SVGConfig {
  width: number;
  height: number;
  animated: boolean;
  includeCircuits: boolean;
  includeGauges: boolean;
  includeDataRain: boolean;
}

const DEFAULT_CONFIG: SVGConfig = {
  width: 400,
  height: 400,
  animated: true,
  includeCircuits: true,
  includeGauges: true,
  includeDataRain: true,
};

/**
 * Generate SVG filter definitions (chromatic aberration, glow)
 */
function generateFilters(): string {
  return `
    <filter id="chromatic">
      <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="red"/>
      <feOffset in="red" dx="1" dy="0" result="offsetRed"/>
      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cyan"/>
      <feOffset in="cyan" dx="-1" dy="0" result="offsetCyan"/>
      <feMerge>
        <feMergeNode in="offsetRed"/>
        <feMergeNode in="offsetCyan"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="techGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <radialGradient id="pulseGradient">
      <stop offset="0%" stop-color="#00ffcc" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#00ffcc" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#00ffcc" stop-opacity="0"/>
    </radialGradient>
  `;
}

/**
 * Generate circuit board background pattern
 */
function generateCircuitPattern(): string {
  return `
    <pattern id="circuitBoard" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 5 5 L 45 5 M 5 5 L 5 25 M 45 5 L 45 15 M 5 25 L 15 25 M 15 25 L 15 45 M 45 15 L 30 15 M 30 15 L 30 45" 
            stroke="#00ffcc" stroke-width="0.5" fill="none" opacity="0.15"/>
      <circle cx="5" cy="5" r="1.5" fill="#00ffcc" opacity="0.4"/>
      <circle cx="45" cy="5" r="1.5" fill="#00ffcc" opacity="0.4"/>
      <circle cx="15" cy="25" r="1.5" fill="#00ffcc" opacity="0.4"/>
      <circle cx="30" cy="15" r="1.5" fill="#00ffcc" opacity="0.4"/>
    </pattern>
  `;
}

/**
 * Generate animated gauge display
 */
function generateGauge(cx: number, cy: number, value: number, label: string): string {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  return `
    <g transform="translate(${cx}, ${cy})">
      <!-- Outer ring -->
      <circle r="${radius + 5}" fill="none" stroke="#00ffcc" stroke-width="1" opacity="0.2"/>
      
      <!-- Tick marks -->
      <g opacity="0.5">
        <path d="M 0,-${radius + 5} L 0,-${radius} M ${radius + 5},0 L ${radius},0 M 0,${radius + 5} L 0,${radius} M -${radius + 5},0 L -${radius},0" 
              stroke="#00ffcc" stroke-width="1"/>
      </g>
      
      <!-- Progress arc -->
      <circle r="${radius}" fill="none" stroke="#00ffcc" stroke-width="3" 
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" 
              transform="rotate(-90)" filter="url(#techGlow)">
        ${value < 100 ? `<animate attributeName="stroke-dashoffset" values="${circumference};${offset};${circumference}" dur="4s" repeatCount="indefinite"/>` : ''}
      </circle>
      
      <!-- Inner ring -->
      <circle r="${radius - 10}" fill="none" stroke="#00ffcc" stroke-width="1" opacity="0.1" stroke-dasharray="3 3">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/>
      </circle>
      
      <!-- Center display -->
      <rect x="-20" y="-8" width="40" height="16" fill="#000000" stroke="#00ffcc" stroke-width="1"/>
      <text x="0" y="4" font-family="'Courier New', monospace" font-size="10" fill="#00ffcc" text-anchor="middle" font-weight="bold">
        ${value}%
      </text>
      
      <!-- Label -->
      <text x="0" y="${radius + 18}" font-family="'Courier New', monospace" font-size="7" fill="#00ffcc" text-anchor="middle" opacity="0.6">
        ${label}
      </text>
    </g>
  `;
}

/**
 * Generate radar scanner animation
 */
function generateRadar(cx: number, cy: number): string {
  return `
    <g transform="translate(${cx}, ${cy})">
      <circle r="35" fill="none" stroke="#00ffcc" stroke-width="1" opacity="0.2"/>
      <circle r="25" fill="none" stroke="#00ffcc" stroke-width="1" opacity="0.1"/>
      <circle r="15" fill="none" stroke="#00ffcc" stroke-width="1" opacity="0.1"/>
      
      <!-- Cross hairs -->
      <path d="M -35,0 L 35,0 M 0,-35 L 0,35" stroke="#00ffcc" stroke-width="0.5" opacity="0.3"/>
      
      <!-- Sweep -->
      <g>
        <path d="M 0,0 L 0,-35" stroke="#00ffcc" stroke-width="2" opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite"/>
        </path>
        <path d="M 0,0 L 0,-35 A 35,35 0 0,1 25,-25 Z" fill="url(#pulseGradient)" opacity="0.4">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite"/>
        </path>
      </g>
      
      <!-- Blip -->
      <circle r="2" fill="#ff6600">
        <animateMotion path="M 15,-20 L -15,10 L 20,15 L 15,-20" dur="6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
      </circle>
    </g>
  `;
}

/**
 * Generate data rain effect
 */
function generateDataRain(): string {
  const columns = [50, 150, 250, 350];
  const binaryStrings = [
    '01001101 01000011 01010000',
    '01010110 01001111 01010100',
    '01000010 01000001 01010011 01000101',
    '00110010 00110000 00110010 00110101'
  ];
  
  return columns.map((x, i) => `
    <text x="${x}" y="0" font-family="monospace" font-size="8" fill="#00ffcc" opacity="0.15">
      <tspan>${binaryStrings[i % binaryStrings.length]}</tspan>
      <animate attributeName="y" values="-20;420;-20" dur="${12 + i * 2}s" repeatCount="indefinite" begin="${i * 2}s"/>
    </text>
  `).join('');
}

/**
 * Generate glitch text effect
 */
function generateGlitchText(text: string, x: number, y: number, size: number): string {
  return `
    <text x="${x}" y="${y}" font-family="'Courier New', monospace" font-size="${size}" 
          font-weight="bold" fill="#00ffcc" text-anchor="middle" filter="url(#techGlow)">
      ${text}
    </text>
    <text x="${x}" y="${y}" font-family="'Courier New', monospace" font-size="${size}" 
          font-weight="bold" fill="#ff0066" text-anchor="middle" opacity="0">
      ${text}
      <animate attributeName="opacity" values="0;0;0;0.8;0;0;0" dur="4s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="translate" values="0,0;2,-1;0,0" dur="0.1s" begin="2s" repeatCount="indefinite"/>
    </text>
  `;
}

/**
 * Generate VOT NFT SVG
 */
export function generateVOTNFT(metadata: NFTMetadata, config: Partial<SVGConfig> = {}): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { width, height } = cfg;
  
  // Calculate rarity color
  const rarityColors: Record<string, string> = {
    common: '#00ffcc',
    rare: '#0066ff',
    epic: '#9900ff',
    legendary: '#ff6600'
  };
  const rarityColor = rarityColors[metadata.rarity || 'common'];
  
  // Shorten addresses for display
  const shortOwner = `${metadata.owner.slice(0, 6)}...${metadata.owner.slice(-4)}`;
  const shortTx = `${metadata.txHash.slice(0, 10)}...`;
  
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${generateFilters()}
    ${cfg.includeCircuits ? generateCircuitPattern() : ''}
  </defs>

  <!-- Background layers -->
  <rect width="${width}" height="${height}" fill="#000000"/>
  <rect width="${width}" height="${height}" fill="#000a0a" opacity="0.5"/>
  ${cfg.includeCircuits ? `<rect width="${width}" height="${height}" fill="url(#circuitBoard)"/>` : ''}
  
  <!-- Grid lines -->
  <g opacity="0.05">
    <line x1="0" y1="${height / 4}" x2="${width}" y2="${height / 4}" stroke="#00ffcc" stroke-width="1"/>
    <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="#00ffcc" stroke-width="1"/>
    <line x1="0" y1="${height * 3 / 4}" x2="${width}" y2="${height * 3 / 4}" stroke="#00ffcc" stroke-width="1"/>
    <line x1="${width / 4}" y1="0" x2="${width / 4}" y2="${height}" stroke="#00ffcc" stroke-width="1"/>
    <line x1="${width / 2}" y1="0" x2="${width / 2}" y2="${height}" stroke="#00ffcc" stroke-width="1"/>
    <line x1="${width * 3 / 4}" y1="0" x2="${width * 3 / 4}" y2="${height}" stroke="#00ffcc" stroke-width="1"/>
  </g>

  <!-- Header bar -->
  <g transform="translate(0, 15)">
    <rect x="${width * 0.15}" y="0" width="${width * 0.7}" height="25" fill="#000000" stroke="${rarityColor}" stroke-width="1" opacity="0.9"/>
    <text x="${width / 2}" y="8" font-family="'Courier New', monospace" font-size="8" fill="${rarityColor}" text-anchor="middle">
      VOT NFT #${metadata.tokenId}
    </text>
    <rect x="${width * 0.15}" y="12" width="${width * 0.7}" height="3" fill="#001111"/>
    <rect x="${width * 0.15}" y="12" width="0" height="3" fill="${rarityColor}">
      <animate attributeName="width" values="0;${width * 0.7};${width * 0.7}" dur="2s" fill="freeze"/>
    </rect>
  </g>

  <!-- Left gauge -->
  ${cfg.includeGauges ? generateGauge(70, height / 2, Math.min(100, parseInt(metadata.votAmount) / 100000), 'VOT') : ''}
  
  <!-- Right radar -->
  ${cfg.includeGauges ? generateRadar(width - 70, height / 2) : ''}

  <!-- Center VOT display -->
  <g transform="translate(${width / 2}, ${height / 2})">
    <!-- Hexagonal frame -->
    <polygon points="0,-50 43,-25 43,25 0,50 -43,25 -43,-25"
             fill="none" stroke="#00ffcc" stroke-width="2" opacity="0.3"/>
    <polygon points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20"
             fill="none" stroke="#00ffcc" stroke-width="1" opacity="0.5">
      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="30s" repeatCount="indefinite"/>
    </polygon>
    
    <!-- Core display -->
    <rect x="-35" y="-18" width="70" height="36" fill="#000000" stroke="#00ffcc" stroke-width="2"/>
    ${generateGlitchText('VOT', 0, 8, 28)}
  </g>

  <!-- VOT Amount display -->
  <g transform="translate(${width / 2}, ${height / 2 + 70})">
    <rect x="-50" y="-12" width="100" height="24" fill="#000000" stroke="#00ffcc" stroke-width="1" opacity="0.8"/>
    <text x="0" y="5" font-family="'Courier New', monospace" font-size="14" fill="#00ffcc" text-anchor="middle" font-weight="bold">
      ${parseFloat(metadata.votAmount).toLocaleString()}
    </text>
  </g>

  <!-- Owner info -->
  <g transform="translate(${width / 2}, ${height - 60})">
    <rect x="-80" y="-15" width="160" height="30" fill="#000000" stroke="#00ffcc" stroke-width="1" opacity="0.5"/>
    <text x="0" y="-3" font-family="'Courier New', monospace" font-size="8" fill="#00ffcc" text-anchor="middle" opacity="0.7">
      OWNER
    </text>
    <text x="0" y="8" font-family="'Courier New', monospace" font-size="9" fill="#00ffcc" text-anchor="middle">
      ${shortOwner}
    </text>
  </g>

  <!-- TX Hash footer -->
  <g transform="translate(${width / 2}, ${height - 25})">
    <text x="0" y="0" font-family="'Courier New', monospace" font-size="7" fill="#00ffcc" text-anchor="middle" opacity="0.5">
      TX: ${shortTx}
    </text>
  </g>

  <!-- Status bar -->
  <g transform="translate(0, ${height - 12})">
    <rect x="0" y="0" width="${width}" height="12" fill="#000000" opacity="0.8"/>
    <line x1="0" y1="0" x2="${width}" y2="0" stroke="#00ffcc" stroke-width="1" opacity="0.5"/>
    <circle cx="10" cy="6" r="3" fill="#00ff00">
      <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <text x="20" y="8" font-family="'Courier New', monospace" font-size="7" fill="#00ffcc">
      BASE NETWORK
    </text>
    <text x="${width - 10}" y="8" font-family="'Courier New', monospace" font-size="7" fill="#00ffcc" text-anchor="end">
      ${metadata.rarity?.toUpperCase() || 'COMMON'}
    </text>
  </g>

  <!-- Data rain overlay -->
  ${cfg.includeDataRain ? `<g opacity="0.1">${generateDataRain()}</g>` : ''}

  <!-- Scan line effect -->
  <g opacity="0.03">
    <rect x="0" y="0" width="${width}" height="2" fill="#00ffcc">
      <animate attributeName="y" values="0;${height};0" dur="8s" repeatCount="indefinite"/>
    </rect>
  </g>
</svg>`;
}

/**
 * Generate NFT metadata JSON
 */
export function generateNFTMetadataJSON(metadata: NFTMetadata): object {
  return {
    name: `MCPVOT #${metadata.tokenId}`,
    description: `VOT Token NFT representing ${metadata.votAmount} VOT on Base network. Part of the MCPVOT ecosystem.`,
    image: `data:image/svg+xml;base64,${Buffer.from(generateVOTNFT(metadata)).toString('base64')}`,
    external_url: `https://mcpvot.xyz/nft/${metadata.tokenId}`,
    attributes: [
      { trait_type: 'VOT Amount', value: metadata.votAmount },
      { trait_type: 'Rarity', value: metadata.rarity || 'common' },
      { trait_type: 'Network', value: 'Base' },
      { trait_type: 'Transaction', value: metadata.txHash },
      { trait_type: 'Minted', value: metadata.timestamp }
    ],
    properties: {
      category: 'image',
      files: [{ type: 'image/svg+xml', uri: `https://mcpvot.xyz/api/nft/${metadata.tokenId}/image` }]
    }
  };
}

/**
 * Calculate rarity based on VOT amount
 */
export function calculateRarity(votAmount: string): 'common' | 'rare' | 'epic' | 'legendary' {
  const amount = parseFloat(votAmount);
  if (amount >= 10000000) return 'legendary';  // 10M+ VOT
  if (amount >= 1000000) return 'epic';        // 1M+ VOT
  if (amount >= 100000) return 'rare';         // 100K+ VOT
  return 'common';
}

const SVGNFTGenerator = {
  generateVOTNFT,
  generateNFTMetadataJSON,
  calculateRarity,
};

export default SVGNFTGenerator;
