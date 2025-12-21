/**
 * ENS IPFS Website Machine - Template Generator V2
 * 
 * Enhanced generator supporting ALL ENS record types:
 * - General: nickname, bio, avatar, website, location
 * - Social: Twitter, GitHub, Discord, Telegram, Farcaster, Email
 * - Addresses: ETH, BTC, SOL, BASE, ARB, OP, MATIC, and 100+ chains
 * - Website: IPFS, Swarm, Onion, Skynet, Arweave
 * - Other: ABI, Custom records
 * 
 * Output: IPFS CID hash ready for ENS contenthash field
 * Example: ipfs://bafybeibwzqu5n3kmsuft4w3qfh4ksrz5jntzzei6mpl4k5baxj2fdcfbte
 */

// =============================================================================
// TYPE DEFINITIONS - All ENS Record Types
// =============================================================================

export interface GeneralInfo {
  nickname: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  location?: string;
  website?: string;
}

export interface SocialLinks {
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  farcaster?: string;
  email?: string;
  linkedin?: string;
  youtube?: string;
  instagram?: string;
  medium?: string;
  reddit?: string;
  lens?: string;
}

// All supported crypto addresses (matching ENS app)
export interface CryptoAddresses {
  // Major chains
  eth?: string;
  btc?: string;
  sol?: string;
  matic?: string;
  bnb?: string;
  avax?: string;
  dot?: string;
  ada?: string;
  xrp?: string;
  doge?: string;
  ltc?: string;
  
  // L2s
  arb1?: string;    // Arbitrum One
  base?: string;    // Base
  op?: string;      // Optimism
  linea?: string;
  zksync?: string;
  strk?: string;    // Starknet
  zora?: string;
  metis?: string;
  scr?: string;     // Scroll
  
  // Other chains
  atom?: string;
  near?: string;
  algo?: string;
  xlm?: string;
  xmr?: string;
  xtz?: string;
  eos?: string;
  trx?: string;
  fil?: string;
  hbar?: string;
  flow?: string;
  egld?: string;
  ftm?: string;
  one?: string;
  celo?: string;
  kava?: string;
  neo?: string;
  vet?: string;
  zec?: string;
  dash?: string;
  bch?: string;
  etc?: string;
  
  // Custom addresses (key: coinType, value: address)
  custom?: Record<string, string>;
}

export interface WebsiteRecords {
  ipfs?: string;      // ipfs://Qm... or ipfs://bafy...
  swarm?: string;     // bzz://...
  onion?: string;     // .onion address
  skynet?: string;    // sia://...
  arweave?: string;   // ar://...
}

export interface OtherRecords {
  abi?: string;       // Contract ABI JSON
  contenthash?: string; // Direct contenthash
  custom?: Record<string, string>;
}

export interface ENSProfileConfig {
  // Core identity
  general: GeneralInfo;
  
  // Social links
  social: SocialLinks;
  
  // Crypto addresses
  addresses: CryptoAddresses;
  
  // Website/content records
  website: WebsiteRecords;
  
  // Other records
  other: OtherRecords;
  
  // Visual customization
  theme: ThemeConfig;
  
  // Metadata
  ensName?: string;
  basename?: string;
  createdAt?: string;
}

export interface ThemeConfig {
  template: 'cyberpunk' | 'minimal' | 'neon' | 'matrix' | 'base' | 'farcaster' | 'custom';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    cardBg: string;
  };
  effects: {
    dataRain: boolean;
    scanlines: boolean;
    glitch: boolean;
    circuitBoard: boolean;
    particles: boolean;
    gradient: boolean;
  };
  font: 'mono' | 'sans' | 'serif';
}

// =============================================================================
// THEME PRESETS
// =============================================================================

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  cyberpunk: {
    template: 'cyberpunk',
    colors: {
      primary: '#00ffcc',
      secondary: '#ff6600',
      accent: '#ff0066',
      background: '#050505',
      text: '#00ffcc',
      cardBg: 'rgba(0, 255, 204, 0.05)',
    },
    effects: {
      dataRain: true,
      scanlines: true,
      glitch: false,
      circuitBoard: true,
      particles: false,
      gradient: false,
    },
    font: 'mono',
  },
  minimal: {
    template: 'minimal',
    colors: {
      primary: '#333333',
      secondary: '#666666',
      accent: '#0066ff',
      background: '#ffffff',
      text: '#333333',
      cardBg: '#f5f5f5',
    },
    effects: {
      dataRain: false,
      scanlines: false,
      glitch: false,
      circuitBoard: false,
      particles: false,
      gradient: false,
    },
    font: 'sans',
  },
  neon: {
    template: 'neon',
    colors: {
      primary: '#ff00ff',
      secondary: '#00ffff',
      accent: '#ffff00',
      background: '#0a0a1a',
      text: '#ffffff',
      cardBg: 'rgba(255, 0, 255, 0.1)',
    },
    effects: {
      dataRain: false,
      scanlines: true,
      glitch: true,
      circuitBoard: false,
      particles: true,
      gradient: true,
    },
    font: 'mono',
  },
  matrix: {
    template: 'matrix',
    colors: {
      primary: '#00ff00',
      secondary: '#00cc00',
      accent: '#66ff66',
      background: '#000000',
      text: '#00ff00',
      cardBg: 'rgba(0, 255, 0, 0.05)',
    },
    effects: {
      dataRain: true,
      scanlines: true,
      glitch: false,
      circuitBoard: false,
      particles: false,
      gradient: false,
    },
    font: 'mono',
  },
  base: {
    template: 'base',
    colors: {
      primary: '#0052ff',
      secondary: '#ffffff',
      accent: '#3366ff',
      background: '#0a0a0f',
      text: '#ffffff',
      cardBg: 'rgba(0, 82, 255, 0.1)',
    },
    effects: {
      dataRain: false,
      scanlines: false,
      glitch: false,
      circuitBoard: true,
      particles: false,
      gradient: true,
    },
    font: 'sans',
  },
  farcaster: {
    template: 'farcaster',
    colors: {
      primary: '#8a63d2',
      secondary: '#ffffff',
      accent: '#a855f7',
      background: '#1a1a2e',
      text: '#ffffff',
      cardBg: 'rgba(138, 99, 210, 0.1)',
    },
    effects: {
      dataRain: false,
      scanlines: false,
      glitch: false,
      circuitBoard: false,
      particles: true,
      gradient: true,
    },
    font: 'sans',
  },
};

// =============================================================================
// CHAIN ICONS & METADATA
// =============================================================================

export const CHAIN_ICONS: Record<string, { name: string; icon: string; color: string }> = {
  eth: { name: 'Ethereum', icon: '⟠', color: '#627eea' },
  btc: { name: 'Bitcoin', icon: '₿', color: '#f7931a' },
  sol: { name: 'Solana', icon: '◎', color: '#9945ff' },
  matic: { name: 'Polygon', icon: '⬡', color: '#8247e5' },
  bnb: { name: 'BNB Chain', icon: '◆', color: '#f0b90b' },
  avax: { name: 'Avalanche', icon: '▲', color: '#e84142' },
  base: { name: 'Base', icon: '🔵', color: '#0052ff' },
  arb1: { name: 'Arbitrum', icon: '🔷', color: '#28a0f0' },
  op: { name: 'Optimism', icon: '🔴', color: '#ff0420' },
  dot: { name: 'Polkadot', icon: '●', color: '#e6007a' },
  ada: { name: 'Cardano', icon: '₳', color: '#0033ad' },
  xrp: { name: 'XRP', icon: '✕', color: '#23292f' },
  doge: { name: 'Dogecoin', icon: 'Ð', color: '#c2a633' },
  ltc: { name: 'Litecoin', icon: 'Ł', color: '#345d9d' },
  atom: { name: 'Cosmos', icon: '⚛', color: '#2e3148' },
  near: { name: 'NEAR', icon: 'Ⓝ', color: '#00c08b' },
  fil: { name: 'Filecoin', icon: '⨎', color: '#0090ff' },
  zksync: { name: 'zkSync', icon: '⟁', color: '#8c8dfc' },
  linea: { name: 'Linea', icon: '═', color: '#121212' },
  zora: { name: 'Zora', icon: '◉', color: '#5b5bd6' },
};

export const SOCIAL_ICONS: Record<string, { name: string; icon: string; url: string }> = {
  twitter: { name: 'X (Twitter)', icon: '𝕏', url: 'https://x.com/' },
  github: { name: 'GitHub', icon: '⚡', url: 'https://github.com/' },
  discord: { name: 'Discord', icon: '💬', url: 'https://discord.gg/' },
  telegram: { name: 'Telegram', icon: '✈️', url: 'https://t.me/' },
  farcaster: { name: 'Farcaster', icon: '🟣', url: 'https://warpcast.com/' },
  email: { name: 'Email', icon: '📧', url: 'mailto:' },
  linkedin: { name: 'LinkedIn', icon: '💼', url: 'https://linkedin.com/in/' },
  youtube: { name: 'YouTube', icon: '▶️', url: 'https://youtube.com/@' },
  instagram: { name: 'Instagram', icon: '📸', url: 'https://instagram.com/' },
  lens: { name: 'Lens', icon: '🌿', url: 'https://hey.xyz/u/' },
};

// =============================================================================
// HTML GENERATION
// =============================================================================

function generateStyles(theme: ThemeConfig): string {
  const { colors, effects, font } = theme;
  
  const fontFamily = font === 'mono' 
    ? "'Share Tech Mono', 'Courier New', monospace"
    : font === 'serif'
    ? "'Playfair Display', Georgia, serif"
    : "'Inter', -apple-system, sans-serif";
  
  return `
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');
    
    :root {
      --primary: ${colors.primary};
      --secondary: ${colors.secondary};
      --accent: ${colors.accent};
      --background: ${colors.background};
      --text: ${colors.text};
      --card-bg: ${colors.cardBg};
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: ${fontFamily};
      background: var(--background);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      overflow-x: hidden;
    }
    
    a { color: var(--primary); text-decoration: none; transition: all 0.3s; }
    a:hover { color: var(--secondary); text-shadow: 0 0 10px var(--secondary); }
    
    .profile-container {
      max-width: 480px;
      width: 100%;
    }
    
    .profile-card {
      background: var(--card-bg);
      border: 1px solid var(--primary);
      padding: 2rem;
      position: relative;
      backdrop-filter: blur(10px);
    }
    
    .profile-card::before {
      content: '';
      position: absolute;
      inset: -2px;
      background: linear-gradient(45deg, var(--primary), transparent, var(--secondary));
      z-index: -1;
      opacity: 0.5;
      animation: borderPulse 3s ease infinite;
    }
    
    @keyframes borderPulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.8; }
    }
    
    .header {
      text-align: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--primary);
    }
    
    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 3px solid var(--primary);
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      background: var(--background);
      overflow: hidden;
      position: relative;
    }
    
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    
    .avatar::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(45deg, transparent 40%, var(--primary) 50%, transparent 60%);
      animation: avatarShine 3s linear infinite;
    }
    
    @keyframes avatarShine {
      0% { transform: translateX(-100%) rotate(45deg); }
      100% { transform: translateX(200%) rotate(45deg); }
    }
    
    .nickname {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 0.5rem;
    }
    
    .ens-name {
      font-size: 0.9rem;
      opacity: 0.7;
      margin-bottom: 0.5rem;
    }
    
    .bio {
      font-size: 0.9rem;
      line-height: 1.6;
      opacity: 0.8;
      max-width: 350px;
      margin: 0 auto;
    }
    
    .location {
      font-size: 0.8rem;
      opacity: 0.6;
      margin-top: 0.5rem;
    }
    
    .section {
      margin-bottom: 1.5rem;
    }
    
    .section-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      opacity: 0.5;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px dashed var(--primary);
    }
    
    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.5rem;
    }
    
    .link-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.8rem;
      background: rgba(0,0,0,0.2);
      border: 1px solid var(--primary);
      border-left-width: 3px;
      font-size: 0.85rem;
      transition: all 0.3s;
    }
    
    .link-item:hover {
      background: var(--card-bg);
      transform: translateX(3px);
      border-left-color: var(--secondary);
    }
    
    .link-icon { font-size: 1rem; width: 20px; text-align: center; }
    .link-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    
    .addresses-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    
    .address-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: rgba(0,0,0,0.3);
      border: 1px solid var(--primary);
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.75rem;
    }
    
    .chain-badge {
      padding: 0.2rem 0.5rem;
      font-size: 0.65rem;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 2px;
    }
    
    .address-value {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0.8;
    }
    
    .copy-btn {
      padding: 0.2rem 0.4rem;
      font-size: 0.65rem;
      background: var(--primary);
      color: var(--background);
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .copy-btn:hover { background: var(--secondary); }
    
    .footer {
      text-align: center;
      padding-top: 1rem;
      border-top: 1px solid var(--primary);
      font-size: 0.7rem;
      opacity: 0.5;
    }
    
    .powered-by {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .mcpvot-badge {
      background: var(--primary);
      color: var(--background);
      padding: 0.15rem 0.5rem;
      font-weight: bold;
      font-size: 0.6rem;
      letter-spacing: 1px;
    }
    
    .ipfs-hash {
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.6rem;
      margin-top: 0.5rem;
      word-break: break-all;
      opacity: 0.4;
    }
    
    /* Effects */
    ${effects.scanlines ? `
    .scanlines {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
      opacity: 0.3;
    }` : ''}
    
    ${effects.circuitBoard ? `
    .circuit-bg {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: -1;
      opacity: 0.15;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpath d='M10 10h80M10 10v40M90 10v30M10 50h30M40 50v40M90 40h-30M60 40v50' stroke='${encodeURIComponent(colors.primary)}' fill='none' stroke-width='0.5'/%3E%3Ccircle cx='10' cy='10' r='2' fill='${encodeURIComponent(colors.primary)}'/%3E%3Ccircle cx='90' cy='10' r='2' fill='${encodeURIComponent(colors.primary)}'/%3E%3Ccircle cx='40' cy='50' r='2' fill='${encodeURIComponent(colors.primary)}'/%3E%3C/svg%3E");
    }` : ''}
  `;
}

function generateSocialLinks(social: SocialLinks): string {
  const links = Object.entries(social)
    .filter(([, value]) => value)
    .map(([key, value]) => {
      const info = SOCIAL_ICONS[key] || { name: key, icon: '🔗', url: '' };
      let url = value as string;
      
      if (key === 'email' && !url.startsWith('mailto:')) {
        url = `mailto:${url}`;
      } else if (!url.startsWith('http') && !url.startsWith('mailto:')) {
        url = info.url + url.replace('@', '');
      }
      
      return `
        <a href="${url}" target="_blank" rel="noopener" class="link-item">
          <span class="link-icon">${info.icon}</span>
          <span class="link-text">${value}</span>
        </a>
      `;
    });
  
  if (links.length === 0) return '';
  
  return `
    <div class="section">
      <div class="section-title">Social</div>
      <div class="links-grid">${links.join('')}</div>
    </div>
  `;
}

function generateAddresses(addresses: CryptoAddresses): string {
  const entries = Object.entries(addresses)
    .filter(([key, value]) => value && key !== 'custom')
    .map(([key, value]) => {
      const chain = CHAIN_ICONS[key] || { name: key.toUpperCase(), icon: '●', color: '#888' };
      const shortAddr = `${(value as string).slice(0, 8)}...${(value as string).slice(-6)}`;
      
      return `
        <div class="address-item">
          <span class="chain-badge" style="background: ${chain.color}; color: white;">
            ${chain.icon} ${chain.name}
          </span>
          <span class="address-value" title="${value}">${shortAddr}</span>
          <button class="copy-btn" onclick="navigator.clipboard.writeText('${value}')">COPY</button>
        </div>
      `;
    });
  
  if (entries.length === 0) return '';
  
  return `
    <div class="section">
      <div class="section-title">Addresses</div>
      <div class="addresses-list">${entries.join('')}</div>
    </div>
  `;
}

function generateWebsiteLinks(website: WebsiteRecords): string {
  const links: string[] = [];
  
  if (website.ipfs) {
    links.push(`<a href="https://ipfs.io/ipfs/${website.ipfs.replace('ipfs://', '')}" target="_blank" class="link-item">
      <span class="link-icon">📁</span>
      <span class="link-text">IPFS Site</span>
    </a>`);
  }
  
  if (website.arweave) {
    links.push(`<a href="https://arweave.net/${website.arweave.replace('ar://', '')}" target="_blank" class="link-item">
      <span class="link-icon">🌐</span>
      <span class="link-text">Arweave</span>
    </a>`);
  }
  
  if (website.onion) {
    links.push(`<div class="link-item">
      <span class="link-icon">🧅</span>
      <span class="link-text">${website.onion.slice(0, 16)}...</span>
    </div>`);
  }
  
  if (links.length === 0) return '';
  
  return `
    <div class="section">
      <div class="section-title">Decentralized Web</div>
      <div class="links-grid">${links.join('')}</div>
    </div>
  `;
}

// =============================================================================
// MAIN EXPORT FUNCTION
// =============================================================================

export function generateENSProfilePage(config: ENSProfileConfig, ipfsCid?: string): string {
  const { general, social, addresses, website, theme, ensName, basename } = config;
  
  const styles = generateStyles(theme);
  const socialHtml = generateSocialLinks(social);
  const addressesHtml = generateAddresses(addresses);
  const websiteHtml = generateWebsiteLinks(website);
  
  const avatarContent = general.avatar
    ? `<img src="${general.avatar}" alt="${general.nickname}" />`
    : general.nickname.charAt(0).toUpperCase();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${general.nickname}${ensName ? ` | ${ensName}` : ''}</title>
  <meta name="description" content="${general.bio || `${general.nickname}'s Web3 Profile`}">
  
  <!-- Farcaster Frame -->
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="https://mcpvot.xyz/api/og?name=${encodeURIComponent(general.nickname)}" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="${general.nickname}" />
  <meta property="og:description" content="${general.bio || 'Web3 Profile'}" />
  <meta property="og:type" content="website" />
  
  <style>${styles}</style>
</head>
<body>
  ${theme.effects.scanlines ? '<div class="scanlines"></div>' : ''}
  ${theme.effects.circuitBoard ? '<div class="circuit-bg"></div>' : ''}
  
  <div class="profile-container">
    <div class="profile-card">
      <div class="header">
        <div class="avatar">${avatarContent}</div>
        <h1 class="nickname">${general.nickname}</h1>
        ${ensName || basename ? `<p class="ens-name">${ensName || ''} ${basename ? `• ${basename}` : ''}</p>` : ''}
        ${general.bio ? `<p class="bio">${general.bio}</p>` : ''}
        ${general.location ? `<p class="location">📍 ${general.location}</p>` : ''}
      </div>
      
      ${socialHtml}
      ${addressesHtml}
      ${websiteHtml}
      
      <div class="footer">
        <div class="powered-by">
          <span>Powered by</span>
          <a href="https://mcpvot.xyz"><span class="mcpvot-badge">MCPVOT</span></a>
          <span>ENS IPFS Machine</span>
        </div>
        ${ipfsCid ? `<p class="ipfs-hash">ipfs://${ipfsCid}</p>` : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
}

// =============================================================================
// IPFS OUTPUT HELPER
// =============================================================================

export interface IPFSOutput {
  html: string;
  ipfsCid: string;
  ipfsUrl: string;
  ensContentHash: string;
  gatewayUrl: string;
}

/**
 * Format the IPFS CID for ENS app usage
 * User/Agent sets this in ENS app → Edit Profile → Content Hash
 */
export function formatIPFSForENS(cid: string): string {
  // Ensure proper format: ipfs://bafy... or ipfs://Qm...
  const cleanCid = cid.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '');
  return `ipfs://${cleanCid}`;
}

/**
 * Get gateway URLs for preview
 */
export function getGatewayUrls(cid: string): string[] {
  const cleanCid = cid.replace('ipfs://', '');
  return [
    `https://ipfs.io/ipfs/${cleanCid}`,
    `https://cloudflare-ipfs.com/ipfs/${cleanCid}`,
    `https://gateway.pinata.cloud/ipfs/${cleanCid}`,
    `https://dweb.link/ipfs/${cleanCid}`,
  ];
}

const ensWebsiteGeneratorV2 = {
  generateENSProfilePage,
  formatIPFSForENS,
  getGatewayUrls,
  THEME_PRESETS,
  CHAIN_ICONS,
  SOCIAL_ICONS,
};

export default ensWebsiteGeneratorV2;
