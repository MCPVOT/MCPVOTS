/**
 * ENS IPFS Website Machine - Template Generator
 * 
 * Generates customizable cyberpunk-style HTML/SVG pages for IPFS hosting
 * Matches the MCPVOT app design language
 * 
 * Features:
 * - Farcaster Frame compatible card
 * - Social links (GitHub, Farcaster, X, ENS, Basenames)
 * - Custom domain support
 * - Animated effects (data rain, scanlines, glitch)
 */

export interface UserLinks {
  github?: string;
  farcaster?: string;
  twitter?: string;  // X
  ens?: string;
  basename?: string;
  website?: string;
  discord?: string;
  telegram?: string;
  email?: string;
}

export interface WebsiteConfig {
  // Identity
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: string;  // URL or base64
  
  // Links
  links: UserLinks;
  
  // Customization
  colors: {
    primary: string;    // Default: #00ffcc
    secondary: string;  // Default: #ff6600
    accent: string;     // Default: #ff0066
    background: string; // Default: #050505
  };
  
  // Features
  features: {
    dataRain: boolean;
    scanlines: boolean;
    glitchEffect: boolean;
    circuitBoard: boolean;
    bootSequence: boolean;
  };
  
  // Template type
  templateType: 'card' | 'page';
  
  // Metadata
  createdAt?: string;
  createdBy?: string;
  ipfsCid?: string;
}

const DEFAULT_CONFIG: WebsiteConfig = {
  title: 'My Web3 Profile',
  subtitle: 'Onchain Identity',
  description: 'Welcome to my decentralized website',
  links: {},
  colors: {
    primary: '#00ffcc',
    secondary: '#ff6600',
    accent: '#ff0066',
    background: '#050505',
  },
  features: {
    dataRain: true,
    scanlines: true,
    glitchEffect: false,
    circuitBoard: true,
    bootSequence: false,
  },
  templateType: 'card',
};

/**
 * Generate CSS variables from colors
 */
function generateCSSVariables(colors: WebsiteConfig['colors']): string {
  return `
    :root {
      --primary: ${colors.primary};
      --secondary: ${colors.secondary};
      --accent: ${colors.accent};
      --bg-dark: ${colors.background};
      --bg-card: ${colors.primary}0d;
      --text-dim: ${colors.primary}99;
    }
  `;
}

/**
 * Generate base styles
 */
function generateBaseStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Share Tech Mono', monospace;
      background: var(--bg-dark);
      color: var(--primary);
      min-height: 100vh;
      overflow-x: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    a {
      color: var(--primary);
      text-decoration: none;
      transition: all 0.3s ease;
    }
    
    a:hover {
      color: var(--secondary);
      text-shadow: 0 0 10px var(--secondary);
    }
  `;
}

/**
 * Generate scanlines overlay
 */
function generateScanlines(): string {
  return `
    .scanlines {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9998;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.1) 2px,
        rgba(0, 0, 0, 0.1) 4px
      );
      opacity: 0.3;
    }
  `;
}

/**
 * Generate data rain animation
 */
function generateDataRainStyles(): string {
  return `
    .data-rain {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -2;
      overflow: hidden;
    }
    
    .rain-column {
      position: absolute;
      font-family: 'Share Tech Mono', monospace;
      font-size: 12px;
      color: var(--primary);
      opacity: 0.15;
      animation: dataFall linear infinite;
      white-space: nowrap;
    }
    
    @keyframes dataFall {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
  `;
}

/**
 * Generate data rain HTML
 */
function generateDataRainHTML(): string {
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  let columns = '';
  
  for (let i = 0; i < 20; i++) {
    const left = Math.random() * 100;
    const duration = 5 + Math.random() * 10;
    const delay = Math.random() * 5;
    let text = '';
    for (let j = 0; j < 30; j++) {
      text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
    }
    columns += `<div class="rain-column" style="left: ${left}%; animation-duration: ${duration}s; animation-delay: ${delay}s;">${text}</div>`;
  }
  
  return `<div class="data-rain">${columns}</div>`;
}

/**
 * Generate circuit board SVG background
 */
function generateCircuitBoardSVG(color: string): string {
  return `
    <svg class="circuit-bg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <pattern id="circuitPattern" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 10 10 L 90 10 M 10 10 L 10 50 M 90 10 L 90 30 M 10 50 L 30 50 M 30 50 L 30 90 M 90 30 L 60 30 M 60 30 L 60 90" 
                stroke="${color}" stroke-width="0.5" fill="none" opacity="0.15"/>
          <circle cx="10" cy="10" r="2" fill="${color}" opacity="0.3"/>
          <circle cx="90" cy="10" r="2" fill="${color}" opacity="0.3"/>
          <circle cx="30" cy="50" r="2" fill="${color}" opacity="0.3"/>
          <circle cx="60" cy="30" r="2" fill="${color}" opacity="0.3"/>
          <circle cx="30" cy="90" r="2" fill="${color}" opacity="0.3"/>
          <circle cx="60" cy="90" r="2" fill="${color}" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuitPattern)"/>
    </svg>
  `;
}

/**
 * Generate circuit board styles
 */
function generateCircuitStyles(): string {
  return `
    .circuit-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
      opacity: 0.4;
    }
  `;
}

/**
 * Generate profile card styles
 */
function generateCardStyles(): string {
  return `
    .profile-card {
      background: var(--bg-card);
      border: 1px solid var(--primary);
      border-radius: 0;
      padding: 2rem;
      max-width: 420px;
      width: 90%;
      position: relative;
      backdrop-filter: blur(10px);
    }
    
    .profile-card::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, var(--primary), transparent, var(--secondary), transparent);
      z-index: -1;
      animation: borderGlow 3s linear infinite;
    }
    
    @keyframes borderGlow {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--primary);
    }
    
    .avatar {
      width: 80px;
      height: 80px;
      border: 2px solid var(--primary);
      background: var(--bg-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      position: relative;
      overflow: hidden;
    }
    
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .avatar::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(0,255,204,0.2), transparent);
      animation: avatarScan 2s infinite;
    }
    
    @keyframes avatarScan {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    
    .identity {
      flex: 1;
    }
    
    .title {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .subtitle {
      font-size: 0.85rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .description {
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      color: var(--text-dim);
    }
    
    .links-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .link-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--primary);
      border-left: 3px solid var(--primary);
      transition: all 0.3s ease;
    }
    
    .link-item:hover {
      background: var(--bg-card);
      border-left-color: var(--secondary);
      transform: translateX(5px);
    }
    
    .link-icon {
      font-size: 1.2rem;
      width: 24px;
      text-align: center;
    }
    
    .link-text {
      flex: 1;
      font-size: 0.9rem;
    }
    
    .link-arrow {
      color: var(--text-dim);
      transition: transform 0.3s;
    }
    
    .link-item:hover .link-arrow {
      transform: translateX(5px);
      color: var(--secondary);
    }
    
    .footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--primary);
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-dim);
    }
    
    .footer a {
      color: var(--primary);
    }
    
    .powered-by {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .badge {
      background: var(--primary);
      color: var(--bg-dark);
      padding: 0.15rem 0.5rem;
      font-size: 0.65rem;
      font-weight: bold;
      letter-spacing: 1px;
    }
  `;
}

/**
 * Generate social link icon (emoji-based for simplicity)
 */
function getLinkIcon(type: keyof UserLinks): string {
  const icons: Record<keyof UserLinks, string> = {
    github: '⚡',
    farcaster: '🟣',
    twitter: '𝕏',
    ens: '◈',
    basename: '🔵',
    website: '🌐',
    discord: '💬',
    telegram: '✈️',
    email: '📧',
  };
  return icons[type] || '🔗';
}

/**
 * Generate link display name
 */
function getLinkDisplayName(type: keyof UserLinks, value: string): string {
  if (type === 'github') return value.replace('https://github.com/', '@');
  if (type === 'farcaster') return value.startsWith('@') ? value : `@${value}`;
  if (type === 'twitter') return value.startsWith('@') ? value : `@${value}`;
  if (type === 'ens') return value.endsWith('.eth') ? value : `${value}.eth`;
  if (type === 'basename') return value.endsWith('.base.eth') ? value : `${value}.base.eth`;
  if (type === 'email') return value;
  return value.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * Generate link URL
 */
function getLinkURL(type: keyof UserLinks, value: string): string {
  if (type === 'github') return value.startsWith('http') ? value : `https://github.com/${value}`;
  if (type === 'farcaster') return `https://warpcast.com/${value.replace('@', '')}`;
  if (type === 'twitter') return `https://x.com/${value.replace('@', '')}`;
  if (type === 'ens') return `https://app.ens.domains/${value.endsWith('.eth') ? value : value + '.eth'}`;
  if (type === 'basename') return `https://www.base.org/name/${value.replace('.base.eth', '')}`;
  if (type === 'discord') return value.startsWith('http') ? value : `https://discord.gg/${value}`;
  if (type === 'telegram') return value.startsWith('http') ? value : `https://t.me/${value}`;
  if (type === 'email') return `mailto:${value}`;
  return value.startsWith('http') ? value : `https://${value}`;
}

/**
 * Generate links HTML
 */
function generateLinksHTML(links: UserLinks): string {
  const linkEntries = Object.entries(links).filter(([, value]) => value);
  
  if (linkEntries.length === 0) {
    return '<div class="links-section"><p style="color: var(--text-dim); text-align: center;">No links added yet</p></div>';
  }
  
  const linksHTML = linkEntries.map(([type, value]) => {
    const icon = getLinkIcon(type as keyof UserLinks);
    const displayName = getLinkDisplayName(type as keyof UserLinks, value as string);
    const url = getLinkURL(type as keyof UserLinks, value as string);
    
    return `
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-item">
        <span class="link-icon">${icon}</span>
        <span class="link-text">${displayName}</span>
        <span class="link-arrow">→</span>
      </a>
    `;
  }).join('');
  
  return `<div class="links-section">${linksHTML}</div>`;
}

/**
 * Generate Farcaster Frame meta tags
 */
function generateFrameMetaTags(config: WebsiteConfig, imageUrl?: string): string {
  const frameImage = imageUrl || 'https://mcpvot.xyz/og-image.png';
  
  return `
    <!-- Farcaster Frame -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${frameImage}" />
    <meta property="fc:frame:button:1" content="Visit Profile" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${config.links.website || 'https://mcpvot.xyz'}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="${config.title}" />
    <meta property="og:description" content="${config.description || config.subtitle || 'Decentralized Web3 Profile'}" />
    <meta property="og:image" content="${frameImage}" />
    <meta property="og:type" content="website" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${config.title}" />
    <meta name="twitter:description" content="${config.description || config.subtitle || 'Decentralized Web3 Profile'}" />
    <meta name="twitter:image" content="${frameImage}" />
  `;
}

/**
 * Main function: Generate complete HTML page
 */
export function generateWebsitePage(userConfig: Partial<WebsiteConfig>): string {
  const config: WebsiteConfig = {
    ...DEFAULT_CONFIG,
    ...userConfig,
    colors: { ...DEFAULT_CONFIG.colors, ...userConfig.colors },
    features: { ...DEFAULT_CONFIG.features, ...userConfig.features },
    links: { ...DEFAULT_CONFIG.links, ...userConfig.links },
  };
  
  // Build styles
  let styles = generateCSSVariables(config.colors);
  styles += generateBaseStyles();
  styles += generateCardStyles();
  
  if (config.features.scanlines) {
    styles += generateScanlines();
  }
  if (config.features.dataRain) {
    styles += generateDataRainStyles();
  }
  if (config.features.circuitBoard) {
    styles += generateCircuitStyles();
  }
  
  // Build body content
  let bodyContent = '';
  
  if (config.features.scanlines) {
    bodyContent += '<div class="scanlines"></div>';
  }
  if (config.features.dataRain) {
    bodyContent += generateDataRainHTML();
  }
  if (config.features.circuitBoard) {
    bodyContent += generateCircuitBoardSVG(config.colors.primary);
  }
  
  // Avatar content
  const avatarContent = config.avatar 
    ? `<img src="${config.avatar}" alt="${config.title}" />`
    : config.title.charAt(0).toUpperCase();
  
  // Profile card
  bodyContent += `
    <div class="profile-card">
      <div class="card-header">
        <div class="avatar">${avatarContent}</div>
        <div class="identity">
          <h1 class="title">${config.title}</h1>
          ${config.subtitle ? `<p class="subtitle">${config.subtitle}</p>` : ''}
        </div>
      </div>
      
      ${config.description ? `<p class="description">${config.description}</p>` : ''}
      
      ${generateLinksHTML(config.links)}
      
      <div class="footer">
        <div class="powered-by">
          <span>Powered by</span>
          <a href="https://mcpvot.xyz" target="_blank">
            <span class="badge">MCPVOT</span>
          </a>
          <span>ENS IPFS Machine</span>
        </div>
        ${config.ipfsCid ? `<p style="margin-top: 0.5rem; font-size: 0.65rem;">IPFS: ${config.ipfsCid.slice(0, 12)}...</p>` : ''}
      </div>
    </div>
  `;
  
  // Complete HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}${config.subtitle ? ` | ${config.subtitle}` : ''}</title>
    <meta name="description" content="${config.description || config.subtitle || 'Decentralized Web3 Profile'}">
    ${generateFrameMetaTags(config)}
    <style>
${styles}
    </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}

/**
 * Generate preview SVG card (for thumbnails)
 */
export function generatePreviewCard(config: Partial<WebsiteConfig>): string {
  const fullConfig: WebsiteConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    colors: { ...DEFAULT_CONFIG.colors, ...config.colors },
    links: { ...DEFAULT_CONFIG.links, ...config.links },
  };
  
  const { primary, secondary, background } = fullConfig.colors;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250">
  <defs>
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="${secondary}" stop-opacity="0.05"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="250" fill="${background}"/>
  <rect width="400" height="250" fill="url(#cardGradient)"/>
  
  <!-- Border -->
  <rect x="10" y="10" width="380" height="230" fill="none" stroke="${primary}" stroke-width="1" opacity="0.8"/>
  
  <!-- Avatar circle -->
  <circle cx="60" cy="60" r="30" fill="none" stroke="${primary}" stroke-width="2" filter="url(#glow)"/>
  <text x="60" y="68" font-family="Orbitron, sans-serif" font-size="24" fill="${primary}" text-anchor="middle">${fullConfig.title.charAt(0)}</text>
  
  <!-- Title -->
  <text x="110" y="50" font-family="Orbitron, sans-serif" font-size="18" fill="${primary}" font-weight="bold">${fullConfig.title.slice(0, 20)}</text>
  <text x="110" y="72" font-family="Share Tech Mono, monospace" font-size="10" fill="${primary}" opacity="0.6">${fullConfig.subtitle?.slice(0, 30) || 'Web3 Profile'}</text>
  
  <!-- Decorative line -->
  <line x1="30" y1="100" x2="370" y2="100" stroke="${primary}" stroke-width="1" opacity="0.3"/>
  
  <!-- Link indicators -->
  ${Object.keys(fullConfig.links).filter(k => fullConfig.links[k as keyof UserLinks]).slice(0, 4).map((_, i) => `
    <rect x="30" y="${120 + i * 28}" width="340" height="22" fill="${primary}" fill-opacity="0.05" stroke="${primary}" stroke-width="0.5"/>
  `).join('')}
  
  <!-- Footer -->
  <text x="200" y="235" font-family="Share Tech Mono, monospace" font-size="8" fill="${primary}" text-anchor="middle" opacity="0.5">POWERED BY MCPVOT ENS IPFS MACHINE</text>
</svg>`;
}

const exports = {
  generateWebsitePage,
  generatePreviewCard,
  DEFAULT_CONFIG,
};

export default exports;
