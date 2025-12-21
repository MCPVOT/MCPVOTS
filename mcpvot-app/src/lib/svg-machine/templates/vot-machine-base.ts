/**
 * VOT Machine Base SVG Template
 * 
 * This is the CANONICAL template for all VOT Machine NFTs.
 * LLM enhances this with 20% user customization weight.
 * 
 * Structure:
 * - HEADER: MCPVOT branding, tier badge
 * - IDENTITY: Name, avatar, bio (LLM customizes)
 * - TRAITS: 6 badges in 2x3 grid
 * - STATS: Updatable data stream
 * - FOOTER: Contract, IPFS CID
 */

import { VOT_MACHINE_TEMPLATE } from '../../openrouter-service';

// Trait type for type safety
export type TraitName = typeof VOT_MACHINE_TEMPLATE.traits[number];

// User traits - which ones are active
export interface UserTraits {
  vot: boolean;      // Has VOT tokens
  mcpvot: boolean;   // Used x402 facilitator
  warplet: boolean;  // Has Warplet wallet
  base: boolean;     // Has Basename
  farcaster: boolean; // Has Farcaster FID
  ens: boolean;      // Has ENS name
}

// SVG generation input
export interface VotMachineSVGInput {
  // Identity
  displayName: string;
  address: string;
  bio?: string;
  avatarUrl?: string;
  
  // Traits
  traits: UserTraits;
  
  // Stats (updatable)
  votBalance: string;
  stakingRewards?: string;
  xpLevel?: number;
  
  // Customization
  userPrompt?: string; // 20% weight for LLM
  
  // Metadata
  tokenId?: string;
  ipfsCid?: string;
  tier?: string;
}

/**
 * Count active traits
 */
export function countActiveTraits(traits: UserTraits): number {
  return Object.values(traits).filter(Boolean).length;
}

/**
 * Get tier based on trait count
 */
export function getTierFromTraits(traitCount: number): { name: string; color: string; emoji: string } {
  if (traitCount >= 6) return { name: 'Oracle', color: '#FFD700', emoji: '🔮' };
  if (traitCount >= 5) return { name: 'Architek', color: '#E5E4E2', emoji: '🏛️' };
  if (traitCount >= 4) return { name: 'Farcaster', color: '#8A63D2', emoji: '💜' };
  if (traitCount >= 3) return { name: 'Base', color: '#0052FF', emoji: '🔵' };
  if (traitCount >= 2) return { name: 'ENS', color: '#5298FF', emoji: '🏷️' };
  if (traitCount >= 1) return { name: 'Warplet', color: '#FF6B00', emoji: '🌀' };
  return { name: 'MCPVOT', color: '#00FFCC', emoji: '⚡' };
}

/**
 * Generate trait badge SVG
 */
function generateTraitBadge(
  trait: TraitName,
  isActive: boolean,
  x: number,
  y: number
): string {
  const color = isActive 
    ? VOT_MACHINE_TEMPLATE.traitColors[trait]
    : '#333333';
  const icon = VOT_MACHINE_TEMPLATE.traitIcons[trait];
  const opacity = isActive ? 1 : 0.3;
  
  return `
    <g transform="translate(${x}, ${y})" opacity="${opacity}">
      <rect x="0" y="0" width="110" height="50" rx="8" 
        fill="${color}20" stroke="${color}" stroke-width="2"/>
      <text x="55" y="20" text-anchor="middle" font-size="16">${icon}</text>
      <text x="55" y="40" text-anchor="middle" font-size="10" fill="${color}" 
        font-family="'Share Tech Mono', monospace" text-transform="uppercase">
        ${trait}
      </text>
    </g>
  `;
}

/**
 * Generate the base VOT Machine SVG template
 * This is the canonical template that LLM will enhance
 */
export function generateVotMachineBaseSVG(input: VotMachineSVGInput): string {
  const {
    displayName,
    address: _address,
    bio = 'Web3 Builder',
    traits,
    votBalance: _votBalance,
    stakingRewards: _stakingRewards = '0',
    xpLevel = 1,
    tokenId = '0',
    ipfsCid = 'pending',
  } = input;
  
  // These will be hydrated via hydrateSVGTemplate() after LLM enhancement
  void _votBalance;
  void _stakingRewards;
  void _address; // Used in {{address}} placeholder
  
  const traitCount = countActiveTraits(traits);
  const tier = getTierFromTraits(traitCount);
  
  // Trait badge positions (2x3 grid)
  const traitPositions = [
    { trait: 'vot' as TraitName, x: 25, y: 240 },
    { trait: 'mcpvot' as TraitName, x: 145, y: 240 },
    { trait: 'warplet' as TraitName, x: 265, y: 240 },
    { trait: 'base' as TraitName, x: 25, y: 300 },
    { trait: 'farcaster' as TraitName, x: 145, y: 300 },
    { trait: 'ens' as TraitName, x: 265, y: 300 },
  ];
  
  const traitBadges = traitPositions
    .map(({ trait, x, y }) => generateTraitBadge(trait, traits[trait], x, y))
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <defs>
    <!-- CRT Scanlines -->
    <pattern id="scanlines" patternUnits="userSpaceOnUse" width="4" height="4">
      <line x1="0" y1="0" x2="4" y2="0" stroke="rgba(0,255,204,0.03)" stroke-width="1"/>
    </pattern>
    
    <!-- Glow filter -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Gradient for header -->
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00ffcc;stop-opacity:0.2"/>
      <stop offset="50%" style="stop-color:#9945FF;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#00ffcc;stop-opacity:0.2"/>
    </linearGradient>
    
    <!-- Data rain animation -->
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&amp;family=Share+Tech+Mono&amp;display=swap');
      
      @keyframes dataRain {
        0% { transform: translateY(-20px); opacity: 0; }
        10% { opacity: 0.5; }
        90% { opacity: 0.5; }
        100% { transform: translateY(620px); opacity: 0; }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
      
      @keyframes scanline {
        0% { transform: translateY(0); }
        100% { transform: translateY(600px); }
      }
      
      .data-char {
        animation: dataRain 8s linear infinite;
        font-family: 'Share Tech Mono', monospace;
        font-size: 10px;
        fill: #00ffcc;
        opacity: 0.3;
      }
      
      .tier-badge {
        animation: pulse 2s ease-in-out infinite;
      }
      
      .header-text {
        font-family: 'Orbitron', sans-serif;
        font-weight: 700;
      }
      
      .body-text {
        font-family: 'Share Tech Mono', monospace;
      }
      
      .stat-value {
        font-family: 'Orbitron', sans-serif;
        font-weight: 700;
      }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="600" fill="#0a0a0a"/>
  <rect width="400" height="600" fill="url(#scanlines)"/>
  
  <!-- Data rain effect (background) -->
  <g class="data-rain" opacity="0.15">
    ${Array.from({ length: 15 }, (_, i) => `
      <text class="data-char" x="${25 + i * 25}" y="0" style="animation-delay: ${i * 0.5}s">
        ${['V', 'O', 'T', 'M', 'C', 'P', '0', '1', 'x', '4', '0', '2', '$', 'Ξ', '◆'][i]}
      </text>
    `).join('')}
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- SECTION 1: HEADER (y: 0-80) - Fixed layout -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <rect x="0" y="0" width="400" height="80" fill="url(#headerGrad)"/>
  <line x1="0" y1="80" x2="400" y2="80" stroke="#00ffcc" stroke-width="1" opacity="0.5"/>
  
  <!-- MCPVOT Logo -->
  <text x="20" y="45" class="header-text" font-size="24" fill="#00ffcc" filter="url(#glow)">
    MCPVOT
  </text>
  <text x="20" y="65" class="body-text" font-size="10" fill="#666">
    VOT Machine NFT
  </text>
  
  <!-- Tier Badge -->
  <g transform="translate(300, 20)" class="tier-badge">
    <rect x="0" y="0" width="80" height="50" rx="8" 
      fill="${tier.color}20" stroke="${tier.color}" stroke-width="2"/>
    <text x="40" y="22" text-anchor="middle" font-size="18">${tier.emoji}</text>
    <text x="40" y="40" text-anchor="middle" font-size="10" fill="${tier.color}" 
      class="body-text" text-transform="uppercase">
      ${tier.name}
    </text>
  </g>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- SECTION 2: IDENTITY (y: 80-230) - 20% User Customization -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <!-- Avatar placeholder -->
  <circle cx="70" cy="140" r="40" fill="#1a1a1a" stroke="#00ffcc" stroke-width="2"/>
  <text x="70" y="148" text-anchor="middle" font-size="32" fill="#00ffcc">
    ${displayName.charAt(0).toUpperCase()}
  </text>
  
  <!-- Name & Address -->
  <text x="130" y="125" class="header-text" font-size="20" fill="#ffffff">
    {{displayName}}
  </text>
  <text x="130" y="145" class="body-text" font-size="11" fill="#00ffcc">
    {{address}}
  </text>
  
  <!-- Bio -->
  <text x="130" y="175" class="body-text" font-size="10" fill="#888" width="250">
    ${bio.slice(0, 50)}${bio.length > 50 ? '...' : ''}
  </text>
  
  <!-- Trait count indicator -->
  <text x="130" y="205" class="body-text" font-size="12" fill="#9945FF">
    ${traitCount}/6 Traits Active
  </text>
  
  <!-- Section divider -->
  <line x1="20" y1="225" x2="380" y2="225" stroke="#333" stroke-width="1"/>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- SECTION 3: TRAITS GRID (y: 230-350) - 6 badges, 2x3 layout -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  ${traitBadges}
  
  <!-- Section divider -->
  <line x1="20" y1="360" x2="380" y2="360" stroke="#333" stroke-width="1"/>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- SECTION 4: STATS (y: 350-530) - Updatable Data Stream -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <text x="200" y="385" text-anchor="middle" class="body-text" font-size="12" fill="#666">
    ─── LIVE DATA STREAM ───
  </text>
  
  <!-- VOT Balance -->
  <g transform="translate(30, 400)">
    <text x="0" y="0" class="body-text" font-size="10" fill="#666">VOT BALANCE</text>
    <text x="0" y="25" class="stat-value" font-size="24" fill="#9945FF" filter="url(#glow)">
      {{votBalance}}
    </text>
    <text x="0" y="45" class="body-text" font-size="10" fill="#444">VOT</text>
  </g>
  
  <!-- Staking Rewards -->
  <g transform="translate(200, 400)">
    <text x="0" y="0" class="body-text" font-size="10" fill="#666">STAKING REWARDS</text>
    <text x="0" y="25" class="stat-value" font-size="24" fill="#00ffcc" filter="url(#glow)">
      {{stakingRewards}}
    </text>
    <text x="0" y="45" class="body-text" font-size="10" fill="#444">VOT earned</text>
  </g>
  
  <!-- XP Level -->
  <g transform="translate(30, 480)">
    <text x="0" y="0" class="body-text" font-size="10" fill="#666">XP LEVEL</text>
    <text x="0" y="25" class="stat-value" font-size="24" fill="#FF6B00" filter="url(#glow)">
      LVL {{xpLevel}}
    </text>
    
    <!-- XP Progress bar -->
    <rect x="80" y="10" width="100" height="8" rx="4" fill="#1a1a1a" stroke="#333"/>
    <rect x="80" y="10" width="${Math.min(xpLevel * 10, 100)}" height="8" rx="4" fill="#FF6B00"/>
  </g>
  
  <!-- Last Updated -->
  <text x="200" y="520" text-anchor="middle" class="body-text" font-size="9" fill="#444">
    Last updated: {{lastUpdated}}
  </text>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- SECTION 5: FOOTER (y: 530-600) - Fixed -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <rect x="0" y="530" width="400" height="70" fill="#050505"/>
  <line x1="0" y1="530" x2="400" y2="530" stroke="#00ffcc" stroke-width="1" opacity="0.3"/>
  
  <!-- Token ID -->
  <text x="20" y="555" class="body-text" font-size="9" fill="#444">
    Token #${tokenId}
  </text>
  
  <!-- IPFS CID -->
  <text x="20" y="572" class="body-text" font-size="8" fill="#333">
    ipfs://${ipfsCid.slice(0, 20)}...
  </text>
  
  <!-- Powered by -->
  <text x="380" y="555" text-anchor="end" class="body-text" font-size="9" fill="#00ffcc">
    Powered by x402
  </text>
  <text x="380" y="572" text-anchor="end" class="body-text" font-size="8" fill="#333">
    ERC-1155 on Base
  </text>
  
  <!-- Border frame -->
  <rect x="2" y="2" width="396" height="596" fill="none" 
    stroke="#00ffcc" stroke-width="1" opacity="0.3" rx="4"/>
</svg>`;
}

/**
 * Replace placeholders with actual data
 */
export function hydrateSVGTemplate(svg: string, data: {
  displayName: string;
  address: string;
  votBalance: string;
  stakingRewards: string;
  xpLevel: number;
  lastUpdated: string;
}): string {
  return svg
    .replace(/\{\{displayName\}\}/g, data.displayName)
    .replace(/\{\{address\}\}/g, `${data.address.slice(0, 6)}...${data.address.slice(-4)}`)
    .replace(/\{\{votBalance\}\}/g, data.votBalance)
    .replace(/\{\{stakingRewards\}\}/g, data.stakingRewards)
    .replace(/\{\{xpLevel\}\}/g, String(data.xpLevel))
    .replace(/\{\{lastUpdated\}\}/g, data.lastUpdated);
}

// Named export for default functionality
const votMachineModule = {
  generateVotMachineBaseSVG,
  hydrateSVGTemplate,
  countActiveTraits,
  getTierFromTraits,
  VOT_MACHINE_TEMPLATE,
};

export default votMachineModule;
