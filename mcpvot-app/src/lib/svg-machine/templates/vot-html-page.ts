/**
 * VOT Machine HTML Page Generator
 * Generates FULL HTML pages with cyberpunk effects like ipfs-landing/index.html
 * NOT simple SVG cards - these are complete interactive pages
 * 
 * Features:
 * - Boot sequence animation
 * - Data rain matrix background
 * - Circuit board SVG pattern
 * - CRT scanlines effect
 * - Responsive design
 * - Fonts: Orbitron + Share Tech Mono
 */

import { CATEGORY_PALETTES } from '../cyberpunk-palette';
import type { UserData } from './user-data-fetcher';

// Uniqueness interface for VOT Machine
export interface VOTMachineUniqueness {
  tagline?: string;
  welcomeMessage?: string;
  bootMessages?: string[];
  customStyles?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    bgDark: string;
    bgMedium: string;
    border: string;
    text: string;
    textDim: string;
    success: string;
    warning: string;
    blue?: string;
    background?: string;
  };
  animationParams?: {
    speed: number;
    intensity: number;
    glowStrength: number;
  };
}

export interface VOTPageData extends UserData {
  tokenId?: number;
  category?: string;
  uniqueness?: VOTMachineUniqueness;
  userPrompt?: string;
  mintDate?: Date;
  ipfsCid?: string;
}

export interface VOTPageOptions {
  animationSpeed?: 'slow' | 'normal' | 'fast';
  showBootSequence?: boolean;
  customCSS?: string;
}

// =============================================================================
// CATEGORY-SPECIFIC BOOT MESSAGES
// Each category gets unique terminal boot sequence for immersion
// =============================================================================

const CATEGORY_BOOT_MESSAGES: Record<string, string[]> = {
  // Default VOT Protocol
  vot: [
    'INITIALIZING x402 VOT PROTOCOL...',
    'CONNECTING TO BASE NETWORK...',
    'LOADING WARPLET CONTRACT...',
    'SYNCING BLOCKCHAIN STATE...',
    'VERIFYING HOLDER STATUS...',
    'DECRYPTING SECURE CHANNEL...',
    'ESTABLISHING MCP CONNECTION...',
    'SYSTEM READY',
  ],
  
  // Warplet - Chrome/Silver theme
  warplet: [
    'BOOTING WARPLET OS v3.0...',
    'LOADING CHROME INTERFACE...',
    'CONNECTING TO WARPLET NETWORK...',
    'VERIFYING NFT OWNERSHIP...',
    'SYNCING WARPLET HOLDER DATA...',
    'INITIALIZING RANK PROTOCOL...',
    'CHROME MODE ACTIVATED',
    'WARPLET READY',
  ],
  
  // ENS/Basename - Registry theme
  ens: [
    'ACCESSING ENS REGISTRY...',
    'RESOLVING ONCHAIN IDENTITY...',
    'QUERYING BASENAME RECORDS...',
    'LOADING TEXT RECORDS...',
    'VERIFYING OWNERSHIP PROOFS...',
    'SYNCING AVATAR METADATA...',
    'IDENTITY PROTOCOL ONLINE',
    'ENS RESOLVER READY',
  ],
  
  // DeFi - Matrix/Trading theme
  defi: [
    'INITIALIZING DEFI MATRIX...',
    'CONNECTING TO LIQUIDITY POOLS...',
    'LOADING PRICE ORACLES...',
    'SYNCING TVL METRICS...',
    'CALCULATING APY YIELDS...',
    'VERIFYING LP POSITIONS...',
    'TRADING ENGINE ONLINE',
    'DEFI MATRIX READY',
  ],
  
  // Gaming - Game console theme
  gaming: [
    'LOADING GAMING GRID...',
    'INITIALIZING XP TRACKER...',
    'SYNCING ACHIEVEMENT DATA...',
    'LOADING LEADERBOARD...',
    'VERIFYING PLAYER STATS...',
    'CONNECTING TO GUILD...',
    'GAME MODE ACTIVATED',
    'PLAYER 1 READY',
  ],
  
  // Minimal - Clean/Ghost theme  
  minimal: [
    'BOOT...',
    'LOAD...',
    'SYNC...',
    'VERIFY...',
    'CONNECT...',
    'READY',
  ],
  
  // MAXX - Orange/Protocol theme
  maxx: [
    'INITIALIZING MAXX PROTOCOL...',
    'CONNECTING TO MAXX NETWORK...',
    'LOADING TOKEN ECONOMICS...',
    'SYNCING BURN STATISTICS...',
    'VERIFYING HOLDER TIER...',
    'CALCULATING REWARDS...',
    'MAXX ENGINE ONLINE',
    'PROTOCOL READY',
  ],
  
  // Farcaster - Social/Purple theme
  farcaster: [
    'CONNECTING TO FARCASTER HUB...',
    'LOADING SOCIAL GRAPH...',
    'SYNCING CAST HISTORY...',
    'VERIFYING FID OWNERSHIP...',
    'LOADING CHANNEL DATA...',
    'CALCULATING SOCIAL SCORE...',
    'WARPCAST INTEGRATION READY',
    'FARCASTER ONLINE',
  ],
  
  // Base - Layer 2 theme
  base: [
    'INITIALIZING BASE L2...',
    'CONNECTING TO OPTIMISM STACK...',
    'SYNCING BLOCK STATE...',
    'LOADING SUPERCHAIN DATA...',
    'VERIFYING BASE BUILDER...',
    'COINBASE ATTESTATION CHECK...',
    'L2 SEQUENCER ONLINE',
    'BASE NETWORK READY',
  ],
  
  // Burn - Deflationary theme
  burn: [
    'INITIALIZING BURN PROTOCOL...',
    'LOADING DEFLATIONARY ENGINE...',
    'SYNCING BURN TRANSACTIONS...',
    'CALCULATING TOTAL BURNED...',
    'VERIFYING BURN PROOF...',
    'UPDATING SUPPLY METRICS...',
    '🔥 BURN ENGINE ACTIVE',
    'DEFLATIONARY MODE READY',
  ],
  
  // x402 - Payment theme
  x402: [
    'INITIALIZING x402 PAYMENT...',
    'LOADING FACILITATOR CONTRACT...',
    'SYNCING USDC RESERVES...',
    'VERIFYING PAYMENT STATUS...',
    'CALCULATING VOT DISTRIBUTION...',
    'TREASURY CHECK COMPLETE...',
    'PAYMENT PROTOCOL ONLINE',
    'x402 READY',
  ],
};

// =============================================================================
// CATEGORY-SPECIFIC ANIMATION CONFIG
// Rich character sets for data rain - OpenRouter LLM adds 20% creative weight
// Using: Hieroglyphics, AI symbols, Unicode art, category-specific iconography
// =============================================================================

interface CategoryAnimationConfig {
  dataRainChars: string;
  dataRainAlt: string;      // Alternative character set for variation
  circuitDensity: number;
  glowIntensity: number;
  scanlineSpeed: number;
  particleCount: number;    // Number of rain columns
}

const CATEGORY_ANIMATIONS: Record<string, CategoryAnimationConfig> = {
  // VOT Protocol - Hieroglyphics + AI neural symbols
  vot: { 
    dataRainChars: '01VOT𓂀𓃭𓆣𓇳⚡🔥💎⟁⟐⧫◈※∿≋⌬⏣⎔⌘',
    dataRainAlt: 'ΨΩΣ∞∆◊⬡⬢⎈⌾⍟⎊⏚⏛⎆⎇⌬⏣',
    circuitDensity: 1, 
    glowIntensity: 1, 
    scanlineSpeed: 1,
    particleCount: 50
  },
  
  // Warplet - Chrome geometric + mini warplet shapes ◈⬡⎔
  warplet: { 
    dataRainChars: '◆◇▣▢✧⬡⬢⎔◈⏣⌬⟐⧫▲△▽▼⬟⬠⬡⬢⎈⌾⍟',
    dataRainAlt: '⬡⬢⬣⬤⬥⬦⬧⬨⬩⬪⬫⬬⬭⬮⬯⎔⏣◈◇◆',
    circuitDensity: 1.2, 
    glowIntensity: 0.8, 
    scanlineSpeed: 0.9,
    particleCount: 45
  },
  
  // ENS - Identity hieroglyphics + domain symbols
  ens: { 
    dataRainChars: '𓀀𓁿𓂋𓃀ENS.ETH◈⬡⎔⌘@※∴∵⊕⊗⊛⊜⊝',
    dataRainAlt: '⌂⌐⌑⌒⌓⌔⌕⌖⌗⌘⌙⌚⌛⌜⌝⌞⌟',
    circuitDensity: 0.8, 
    glowIntensity: 1.1, 
    scanlineSpeed: 1,
    particleCount: 40
  },
  
  // DeFi - Financial matrix + trading glyphs
  defi: { 
    dataRainChars: '$¥€£₿Ξ📈📉💹⬆⬇↗↘∞%APY≋∿⌬TVL⟁',
    dataRainAlt: '₳₴₵₸₹₺₻₼₽₾₿⚖⚗⚙⛏💰�🏦',
    circuitDensity: 1.3, 
    glowIntensity: 1.2, 
    scanlineSpeed: 1.2,
    particleCount: 60
  },
  
  // Gaming - RPG glyphs + achievement symbols
  gaming: { 
    dataRainChars: '⚔🎮🏆🎯⚡💀👾🕹️XP⬆LVL♠♣♥♦★☆⚙⛏⚒',
    dataRainAlt: '⚔⚕⚖⚗⚘⚙⚚⚛⚜⚝⚞⚟✠✡✢✣✤✥✦✧',
    circuitDensity: 1.1, 
    glowIntensity: 1.3, 
    scanlineSpeed: 1.1,
    particleCount: 55
  },
  
  // Minimal - Pure binary + sparse geometric
  minimal: { 
    dataRainChars: '01·.·:·.·01',
    dataRainAlt: '⠀⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏',
    circuitDensity: 0.3, 
    glowIntensity: 0.4, 
    scanlineSpeed: 0.7,
    particleCount: 20
  },
  
  // MAXX - Fire + power hieroglyphics
  maxx: { 
    dataRainChars: 'MAXX🔥💰⚡𓆑𓆓𓆗𓇋𓇌⟁⟐⧫◈※∿≋⌬⏣',
    dataRainAlt: '☀☁☂☃☄★☆☇☈☉☊☋☌☍☎☏',
    circuitDensity: 1, 
    glowIntensity: 1.1, 
    scanlineSpeed: 1,
    particleCount: 50
  },
  
  // Farcaster - Social + communication glyphs
  farcaster: { 
    dataRainChars: '💜🟣📢📡🌐⌘@#∞◉◎●○◐◑◒◓◔◕◖◗',
    dataRainAlt: '☰☱☲☳☴☵☶☷⚊⚋⚌⚍⚎⚏',
    circuitDensity: 0.9, 
    glowIntensity: 1, 
    scanlineSpeed: 0.95,
    particleCount: 45
  },
  
  // Base - Layer 2 + Coinbase blue geometric
  base: { 
    dataRainChars: 'BASE🔵⬡L2⟁⟐⎔◈⬢⬣⏣⌬Ξ⊕⊗⊛⊜⊝',
    dataRainAlt: '⌬⏣⎔⬡⬢⬣◈◇◆⟐⟑⟒⟓⟔⟕⟖',
    circuitDensity: 1, 
    glowIntensity: 0.9, 
    scanlineSpeed: 1,
    particleCount: 48
  },
  
  // Burn - Deflationary fire + destruction symbols
  burn: { 
    dataRainChars: '🔥�☠️⚰️🦴𓆑𓆓�💀↓↘⬇⤵⟱⇣⇩⬇️',
    dataRainAlt: '☽☾☿♀♁♂♃♄♅♆♇♈♉♊♋♌♍♎♏',
    circuitDensity: 1.2, 
    glowIntensity: 1.4, 
    scanlineSpeed: 1.3,
    particleCount: 55
  },
  
  // x402 - Payment + transaction symbols
  x402: { 
    dataRainChars: 'x402$USDC💵💳✓✔✅⊕⊗⟁⟐⧫◈※∿≋⌬',
    dataRainAlt: '₿Ξ$¢£¤¥₣₤₥₦₧₨₩₪₫€₭₮₯',
    circuitDensity: 0.9, 
    glowIntensity: 1, 
    scanlineSpeed: 1,
    particleCount: 45
  },
  
  // MCPVOT - AI neural network + MCP protocol symbols
  mcpvot: { 
    dataRainChars: 'MCP𓂀𓃭𓆣⟁⟐⎊⍟⌬⏣⎔⌘ΨΩΣ∞∆◊⬡⬢⎈⌾',
    dataRainAlt: '⌬⏣⎔⬡⬢⬣◈◇◆⟐⟑⟒⟓⟔⟕⟖⟗⟘⟙⟚',
    circuitDensity: 1.1, 
    glowIntensity: 1.2, 
    scanlineSpeed: 1.05,
    particleCount: 52
  },
  
  // AI - Neural network + futuristic hieroglyphics
  ai: { 
    dataRainChars: '🤖🧠💡⚡𓂀𓃭𓆣𓇳ΨΩΣ∞∆⟁⟐⎊⍟⌬⏣⎔⌘',
    dataRainAlt: '⎈⌾⍟⎊⏚⏛⎆⎇⌬⏣⟁⟐⧫◈※∿≋',
    circuitDensity: 1.15, 
    glowIntensity: 1.25, 
    scanlineSpeed: 1.1,
    particleCount: 58
  },
  
  // Cyberpunk - Full neo-tokyo aesthetic
  cyberpunk: { 
    dataRainChars: 'ネオ東京サイバーパンク⟁⟐⧫◈※∿≋⌬⏣⎔⌘🌃🏙️',
    dataRainAlt: 'アイウエオカキクケコサシスセソタチツテト',
    circuitDensity: 1.3, 
    glowIntensity: 1.5, 
    scanlineSpeed: 1.2,
    particleCount: 65
  },
  
  // Quantum - Subatomic + physics symbols
  quantum: { 
    dataRainChars: 'ℏψφ∞∆∇⊗⊕⊖⊘⊙⊚⊛⊜⊝ΨΩΣ∂∫∮∯∰',
    dataRainAlt: '⟨⟩⟪⟫⦃⦄⦅⦆⦇⦈⦉⦊⦋⦌⦍⦎⦏⦐',
    circuitDensity: 0.85, 
    glowIntensity: 1.35, 
    scanlineSpeed: 0.85,
    particleCount: 42
  },
};

// Legacy default (kept for backward compatibility)
const DEFAULT_BOOT_MESSAGES = CATEGORY_BOOT_MESSAGES.vot;

/**
 * Generate a complete HTML page for VOT Machine NFT
 */
export function generateVOTHTMLPage(data: VOTPageData, options?: VOTPageOptions): string {
  const category = data.category || 'warplet';
  const palette = CATEGORY_PALETTES[category];
  const categoryBootMessages = CATEGORY_BOOT_MESSAGES[category] || DEFAULT_BOOT_MESSAGES;
  const categoryAnimConfig = CATEGORY_ANIMATIONS[category] || CATEGORY_ANIMATIONS.vot;
  
  const uniqueness = data.uniqueness;
  const bootMessages = uniqueness?.bootMessages || categoryBootMessages;
  const tagline = uniqueness?.tagline || 'VERIFIABLE ONCHAIN TOKEN';
  const welcomeMessage = uniqueness?.welcomeMessage || 'Welcome to the VOT Ecosystem';
  const colors = (uniqueness?.colors || palette) as Record<string, string>;
  const animations = uniqueness?.animationParams || { 
    speed: 1 * categoryAnimConfig.scanlineSpeed, 
    intensity: 0.7 * categoryAnimConfig.glowIntensity, 
    glowStrength: 15 * categoryAnimConfig.glowIntensity
  };

  // Animation speed multipliers
  const speedMultiplier = options?.animationSpeed === 'slow' ? 1.5 : 
                          options?.animationSpeed === 'fast' ? 0.7 : 1;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VOT #${data.tokenId || '???'} | ${data.displayName || data.ensName || 'VOT Machine'}</title>
    <meta name="description" content="${tagline}">
    <meta property="og:title" content="VOT Machine #${data.tokenId || '???'}">
    <meta property="og:description" content="${tagline}">
    <meta property="og:image" content="https://mcpvot.xyz/api/og/${data.tokenId || 0}">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
        
        :root {
            --primary: ${colors.primary || '#00ffcc'};
            --secondary: ${colors.secondary || '#ff6600'};
            --accent: ${colors.accent || '#ff0066'};
            --blue: ${colors.blue || '#00aaff'};
            --bg-dark: ${colors.background || '#050505'};
            --text-main: ${colors.text || '#00ffcc'};
            --text-dim: rgba(${hexToRgb(colors.primary || '#00ffcc')}, 0.6);
            --glow-strength: ${animations.glowStrength}px;
            --animation-speed: ${animations.speed * speedMultiplier};
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Share Tech Mono', monospace;
            background: var(--bg-dark);
            color: var(--primary);
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        /* CRT Scanlines Overlay */
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
        
        /* Data Rain Matrix Background */
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
            font-size: 14px;
            color: var(--primary);
            opacity: 0.12;
            animation: dataFall calc(var(--animation-speed) * 10s) linear infinite;
            white-space: pre-wrap;
            text-shadow: 0 0 8px currentColor;
            writing-mode: vertical-rl;
            text-orientation: mixed;
        }
        
        @keyframes dataFall {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 0.15; }
            90% { opacity: 0.15; }
            100% { transform: translateY(100vh); opacity: 0; }
        }
        
        /* Floating Glyphs - larger symbols that drift slowly */
        .floating-glyph {
            position: absolute;
            font-size: clamp(24px, 4vw, 48px);
            color: var(--primary);
            opacity: 0.06;
            animation: floatGlyph 25s ease-in-out infinite;
            text-shadow: 0 0 20px currentColor;
            filter: blur(1px);
        }
        
        @keyframes floatGlyph {
            0%, 100% { 
                transform: translateY(100vh) rotate(0deg) scale(0.8); 
                opacity: 0;
            }
            10% { opacity: 0.08; }
            50% { 
                transform: translateY(40vh) rotate(180deg) scale(1.2); 
                opacity: 0.1;
            }
            90% { opacity: 0.06; }
        }
        
        /* Circuit Board Grid Background */
        .circuit-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: ${animations.intensity || 0.4};
        }
        
        /* Boot Sequence */
        .boot-sequence {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 1s, visibility 1s;
        }
        
        .boot-sequence.hidden {
            opacity: 0;
            visibility: hidden;
        }
        
        .boot-container {
            max-width: 700px;
            width: 90%;
        }
        
        .boot-header {
            background: #000;
            border: 1px solid var(--primary);
            padding: 10px 20px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .boot-header-text {
            color: var(--secondary);
            font-size: 14px;
            letter-spacing: 2px;
        }
        
        .boot-progress-container {
            background: #001111;
            height: 6px;
            margin: 15px 0;
            border: 1px solid rgba(0, 255, 204, 0.3);
        }
        
        .boot-progress-bar {
            height: 100%;
            width: 0%;
            background: var(--primary);
            transition: width 0.3s;
        }
        
        .boot-text {
            font-family: 'Share Tech Mono', monospace;
            color: var(--primary);
            font-size: clamp(0.9rem, 1.5vw, 1.2rem);
            text-align: left;
            line-height: 1.8;
        }
        
        .boot-line {
            opacity: 0;
            animation: bootFade 0.3s forwards;
        }
        
        @keyframes bootFade {
            to { opacity: 1; }
        }
        
        .boot-status {
            text-align: center;
            margin-top: 15px;
            font-size: 12px;
            color: var(--primary);
        }
        
        /* Main Content Container */
        .main-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        /* Hero Section */
        .hero-section {
            text-align: center;
            padding: 3rem 0;
            position: relative;
        }
        
        .hero-section::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
            opacity: 0.1;
            animation: heroPulse calc(var(--animation-speed) * 4s) ease-in-out infinite;
        }
        
        @keyframes heroPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.1; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.15; }
        }
        
        .token-id {
            font-family: 'Orbitron', sans-serif;
            font-size: clamp(4rem, 12vw, 10rem);
            font-weight: 900;
            background: linear-gradient(135deg, var(--primary), var(--secondary), var(--accent));
            background-size: 300% 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: gradientFlow calc(var(--animation-speed) * 5s) ease infinite;
            filter: drop-shadow(0 0 var(--glow-strength) var(--primary));
            position: relative;
        }
        
        @keyframes gradientFlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .tagline {
            font-family: 'Orbitron', sans-serif;
            font-size: clamp(1rem, 3vw, 1.8rem);
            letter-spacing: 8px;
            text-transform: uppercase;
            color: var(--secondary);
            margin: 1rem 0;
            animation: taglinePulse calc(var(--animation-speed) * 3s) ease-in-out infinite;
        }
        
        @keyframes taglinePulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .welcome-message {
            font-size: clamp(1rem, 2vw, 1.4rem);
            color: var(--text-dim);
            max-width: 600px;
            margin: 2rem auto;
            line-height: 1.8;
        }
        
        /* ========================================
           IDENTITY BANNER - Cyberpunk HUD Style
           Inspired by mcpvot_banner_ultra.svg
           ======================================== */
        .identity-banner {
            position: relative;
            width: 100%;
            max-width: 900px;
            margin: 2rem auto;
            padding: 0;
        }
        
        .identity-banner svg {
            width: 100%;
            height: auto;
            display: block;
        }
        
        /* Gauge Loading Animation */
        @keyframes gaugeLoad {
            0% { stroke-dashoffset: 283; }
            100% { stroke-dashoffset: 0; }
        }
        
        /* Radar Sweep Animation */
        @keyframes radarSweep {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Hexagon Pulse */
        @keyframes hexPulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.02); }
        }
        
        /* Banner Glow Effect */
        @keyframes bannerGlow {
            0%, 100% { filter: drop-shadow(0 0 8px var(--primary)); }
            50% { filter: drop-shadow(0 0 20px var(--primary)); }
        }
        
        /* Text Glitch Animation */
        @keyframes bannerGlitch {
            0%, 100% { text-shadow: 2px 0 var(--secondary), -2px 0 var(--accent); }
            25% { text-shadow: -2px 0 var(--secondary), 2px 0 var(--accent); }
            50% { text-shadow: 2px -2px var(--secondary), -2px 2px var(--accent); }
            75% { text-shadow: -2px 2px var(--secondary), 2px -2px var(--accent); }
        }
        
        /* Identity Name Styling */
        .identity-name {
            font-family: 'Orbitron', sans-serif;
            font-size: 2.5rem;
            font-weight: 900;
            fill: var(--primary);
            animation: bannerGlitch 3s ease-in-out infinite;
        }
        
        .identity-sub {
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            fill: var(--text-dim);
            letter-spacing: 3px;
        }
        
        .identity-address {
            font-family: 'Courier New', monospace;
            font-size: 0.7rem;
            fill: var(--secondary);
        }
        
        .banner-label {
            font-family: 'Orbitron', sans-serif;
            font-size: 0.6rem;
            fill: var(--text-dim);
            letter-spacing: 2px;
        }
        
        .banner-value {
            font-family: 'Orbitron', sans-serif;
            font-size: 1rem;
            fill: var(--primary);
            font-weight: bold;
        }

        /* Owner Info Card */
        .owner-card {
            background: linear-gradient(135deg, rgba(0, 255, 204, 0.08), rgba(255, 102, 0, 0.05));
            border: 2px solid var(--primary);
            padding: 2rem;
            margin: 2rem 0;
            position: relative;
            overflow: hidden;
        }
        
        .owner-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, transparent, var(--primary), transparent);
            animation: scanLine calc(var(--animation-speed) * 2s) linear infinite;
        }
        
        @keyframes scanLine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .owner-card::after {
            content: 'VERIFIED HOLDER';
            position: absolute;
            top: 0;
            right: 0;
            background: var(--primary);
            color: #000;
            padding: 0.5rem 1rem;
            font-size: 0.75rem;
            font-weight: bold;
            letter-spacing: 2px;
        }
        
        .owner-title {
            font-family: 'Orbitron', sans-serif;
            font-size: clamp(1.2rem, 2.5vw, 1.8rem);
            margin-bottom: 1.5rem;
            color: var(--primary);
        }
        
        .owner-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
        }
        
        .detail-item {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(0, 255, 204, 0.2);
            padding: 1rem;
        }
        
        .detail-label {
            font-size: 0.75rem;
            color: var(--secondary);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 0.5rem;
        }
        
        .detail-value {
            font-size: clamp(1rem, 2vw, 1.3rem);
            color: var(--primary);
            word-break: break-all;
        }
        
        .address-value {
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.9rem;
        }
        
        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        
        .stat-card {
            background: rgba(0, 255, 204, 0.05);
            border: 1px solid rgba(0, 255, 204, 0.2);
            padding: 1.5rem;
            text-align: center;
            transition: all 0.3s;
        }
        
        .stat-card:hover {
            border-color: var(--primary);
            box-shadow: 0 0 30px rgba(0, 255, 204, 0.2);
            transform: translateY(-5px);
        }
        
        .stat-value {
            font-family: 'Orbitron', sans-serif;
            font-size: clamp(1.5rem, 3vw, 2.5rem);
            font-weight: 700;
            background: linear-gradient(135deg, var(--primary), var(--blue));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .stat-label {
            font-size: 0.75rem;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 0.5rem;
        }
        
        /* Actions Section */
        .actions-section {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
            margin: 3rem 0;
        }
        
        .action-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem 2rem;
            font-family: 'Orbitron', sans-serif;
            font-size: 1rem;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 2px;
            border: 2px solid var(--secondary);
            background: transparent;
            color: var(--secondary);
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .action-btn:hover {
            background: var(--secondary);
            color: #000;
            box-shadow: 0 0 30px rgba(255, 102, 0, 0.4);
        }
        
        .action-btn.primary {
            background: linear-gradient(135deg, var(--secondary), #ff8800);
            color: #000;
            border-color: var(--secondary);
        }
        
        .action-btn.primary:hover {
            transform: scale(1.05);
            box-shadow: 0 0 40px rgba(255, 102, 0, 0.6);
        }
        
        /* Contract Info */
        .contract-info {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid var(--primary);
            padding: 1.5rem;
            margin: 2rem 0;
            position: relative;
        }
        
        .contract-info::before {
            content: 'CONTRACT';
            position: absolute;
            top: 0;
            left: 0;
            background: var(--primary);
            color: #000;
            padding: 0.3rem 0.8rem;
            font-size: 0.7rem;
            font-weight: bold;
            letter-spacing: 1px;
        }
        
        .contract-address {
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.9rem;
            margin-top: 1.5rem;
            color: var(--text-dim);
            cursor: pointer;
            transition: color 0.3s;
        }
        
        .contract-address:hover {
            color: var(--primary);
        }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 2rem;
            border-top: 1px solid rgba(0, 255, 204, 0.2);
            margin-top: auto;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
            margin-bottom: 1.5rem;
        }
        
        .footer-links a {
            color: var(--text-dim);
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.3s;
        }
        
        .footer-links a:hover {
            color: var(--primary);
        }
        
        .footer-copy {
            color: var(--text-dim);
            font-size: 0.8rem;
        }
        
        /* Glitch Effect */
        @keyframes glitch {
            0%, 90%, 100% { transform: translate(0); }
            92% { transform: translate(-2px, 2px); }
            94% { transform: translate(2px, -2px); }
            96% { transform: translate(-2px, -2px); }
            98% { transform: translate(2px, 2px); }
        }
        
        .glitch:hover {
            animation: glitch 0.3s ease-in-out;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .owner-details {
                grid-template-columns: 1fr;
            }
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            .actions-section {
                flex-direction: column;
            }
            .action-btn {
                width: 100%;
                justify-content: center;
            }
        }
        
        /* FIP-2 Social Feed Styles */
        .social-feed-section {
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid rgba(0, 255, 204, 0.3);
            border-radius: 12px;
            padding: 1.5rem;
            margin-top: 2rem;
        }
        
        .section-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.3rem;
            color: var(--primary);
            margin-bottom: 0.25rem;
        }
        
        .section-subtitle {
            font-size: 0.75rem;
            color: var(--text-dim);
            margin-bottom: 1rem;
        }
        
        .social-feed {
            min-height: 150px;
            max-height: 400px;
            overflow-y: auto;
            margin-bottom: 1rem;
        }
        
        .feed-loading {
            text-align: center;
            color: var(--text-dim);
            padding: 2rem;
            animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
        
        .feed-empty {
            text-align: center;
            color: var(--text-dim);
            padding: 2rem;
        }
        
        .feed-cast {
            background: rgba(0, 255, 204, 0.05);
            border: 1px solid rgba(0, 255, 204, 0.15);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 0.75rem;
        }
        
        .cast-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
        }
        
        .cast-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 1px solid var(--primary);
        }
        
        .cast-author {
            color: var(--primary);
            font-weight: bold;
            font-size: 0.9rem;
        }
        
        .cast-time {
            color: var(--text-dim);
            font-size: 0.75rem;
            margin-left: auto;
        }
        
        .cast-text {
            color: var(--text-main);
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        .farcaster-btn {
            background: linear-gradient(135deg, rgba(130, 71, 229, 0.3), rgba(130, 71, 229, 0.1));
            border-color: rgba(130, 71, 229, 0.5);
        }
        
        .farcaster-btn:hover {
            background: linear-gradient(135deg, rgba(130, 71, 229, 0.5), rgba(130, 71, 229, 0.2));
            box-shadow: 0 0 15px rgba(130, 71, 229, 0.3);
        }
        
        .action-btn.small {
            padding: 0.6rem 1rem;
            font-size: 0.85rem;
        }
        
        /* Custom CSS from user/LLM (20% weight) */
        ${options?.customCSS || ''}
    </style>
</head>
<body>
    <!-- CRT Scanlines -->
    <div class="scanlines"></div>
    
    <!-- Data Rain Background -->
    <div class="data-rain" id="dataRain"></div>
    
    <!-- Circuit Board SVG Background -->
    ${generateCircuitBoardSVG(colors)}
    
    <!-- Boot Sequence -->
    ${options?.showBootSequence !== false ? generateBootSequenceHTML() : ''}
    
    <!-- Main Content -->
    <div class="main-container">
        <!-- Hero Section -->
        <section class="hero-section">
            <div class="token-id">#${data.tokenId || '???'}</div>
            <div class="tagline">${tagline}</div>
            <div class="welcome-message">${welcomeMessage}</div>
        </section>
        
        <!-- Identity Banner - Cyberpunk HUD -->
        ${generateIdentityBanner(data, colors)}
        
        <!-- Owner Info Card -->
        <section class="owner-card">
            <h2 class="owner-title">🔮 ${data.displayName || data.ensName || data.basename || 'Holder'}</h2>
            <div class="owner-details">
                <div class="detail-item">
                    <div class="detail-label">Wallet Address</div>
                    <div class="detail-value address-value">${data.address || '0x...'}</div>
                </div>
                ${data.ensName ? `
                <div class="detail-item">
                    <div class="detail-label">ENS Name</div>
                    <div class="detail-value">${data.ensName}</div>
                </div>
                ` : ''}
                ${data.basename ? `
                <div class="detail-item">
                    <div class="detail-label">Basename</div>
                    <div class="detail-value">${data.basename}</div>
                </div>
                ` : ''}
                ${data.farcasterUsername ? `
                <div class="detail-item">
                    <div class="detail-label">Farcaster</div>
                    <div class="detail-value">@${data.farcasterUsername}</div>
                </div>
                ` : ''}
            </div>
        </section>
        
        <!-- Stats Grid -->
        <section class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${data.votBalanceFormatted || formatNumber(data.votBalance || '0')}</div>
                <div class="stat-label">VOT Balance</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.maxxBalanceFormatted || formatNumber(data.maxxBalance || '0')}</div>
                <div class="stat-label">MAXX Balance</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.hasWarpletNFT ? '✓' : '✗'}</div>
                <div class="stat-label">Warplet Holder</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.mintDate ? formatDate(new Date(data.mintDate)) : 'N/A'}</div>
                <div class="stat-label">Mint Date</div>
            </div>
        </section>
        
        <!-- Actions Section -->
        <section class="actions-section">
            <a href="https://mcpvot.xyz" class="action-btn primary" target="_blank">
                <span>🚀</span> Launch VOT Machine
            </a>
            <a href="https://basescan.org/token/0x699727F9E01A822EFdcf7333073f0461e5914b4E" class="action-btn" target="_blank">
                <span>🔍</span> View on Basescan
            </a>
            <a href="${generateWarpcastShareUrl(data.tokenId || 0, tagline)}" class="action-btn farcaster-btn" target="_blank">
                <span>💬</span> Share on Farcaster
            </a>
        </section>
        
        <!-- FIP-2 Social Feed Section -->
        <section class="social-feed-section">
            <h3 class="section-title">💬 Community Discussion</h3>
            <p class="section-subtitle">Powered by FIP-2 Flexible Targets</p>
            <div class="social-feed" id="socialFeed">
                <div class="feed-loading">Loading casts from Farcaster...</div>
            </div>
            <a href="${generateWarpcastShareUrl(data.tokenId || 0, 'Join the conversation!')}" class="action-btn farcaster-btn small" target="_blank">
                <span>✍️</span> Add your cast
            </a>
        </section>
        
        <!-- Contract Info -->
        <section class="contract-info">
            <div class="contract-address" onclick="copyAddress(this)">
                Warplet Contract: 0x699727F9E01A822EFdcf7333073f0461e5914b4E
            </div>
            ${data.ipfsCid ? `
            <div class="contract-address">
                IPFS CID: ${data.ipfsCid}
            </div>
            ` : ''}
        </section>
        
        <!-- Footer -->
        <footer class="footer">
            <div class="footer-links">
                <a href="https://mcpvot.xyz">VOT Machine</a>
                <a href="https://basescan.org/address/0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07">VOT Token</a>
                <a href="https://warpcast.com/~/channel/maxx">Farcaster</a>
            </div>
            <div class="footer-copy">
                © ${new Date().getFullYear()} MAXX Ecosystem • Powered by x402 Protocol • Base Network
            </div>
        </footer>
    </div>
    
    <script>
        // Data Rain Animation (category-specific characters with variation)
        function createDataRain() {
            const container = document.getElementById('dataRain');
            if (!container) return;
            
            // Primary and alternate character sets for variation
            const primaryChars = '${categoryAnimConfig.dataRainChars}';
            const altChars = '${categoryAnimConfig.dataRainAlt}';
            const particleCount = ${categoryAnimConfig.particleCount};
            
            // Mix both character sets for rich variation
            const allChars = primaryChars + altChars;
            const columns = Math.min(Math.floor(window.innerWidth / 20), particleCount);
            
            for (let i = 0; i < columns; i++) {
                const column = document.createElement('div');
                column.className = 'rain-column';
                column.style.left = (i * (window.innerWidth / columns)) + 'px';
                
                // Vary animation speed per column
                const baseSpeed = 8 + Math.random() * 15;
                column.style.animationDuration = (baseSpeed * ${speedMultiplier}) + 's';
                column.style.animationDelay = (Math.random() * 8) + 's';
                
                // Vary opacity per column for depth
                column.style.opacity = (0.08 + Math.random() * 0.12).toFixed(2);
                
                // Use primary or alt chars randomly per column
                const useAlt = Math.random() > 0.6;
                const charSet = useAlt ? altChars : (Math.random() > 0.5 ? allChars : primaryChars);
                
                let text = '';
                const length = Math.floor(Math.random() * 20) + 10;
                for (let j = 0; j < length; j++) {
                    text += charSet[Math.floor(Math.random() * charSet.length)] + '\\n';
                }
                column.textContent = text;
                container.appendChild(column);
            }
            
            // Add floating particle overlay for extra depth
            createFloatingParticles();
        }
        
        // Floating particles for additional visual depth
        function createFloatingParticles() {
            const container = document.getElementById('dataRain');
            if (!container) return;
            
            const glyphs = '${categoryAnimConfig.dataRainChars.slice(0, 10)}';
            for (let i = 0; i < 15; i++) {
                const particle = document.createElement('div');
                particle.className = 'floating-glyph';
                particle.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 10 + 's';
                particle.style.animationDuration = (15 + Math.random() * 20) + 's';
                container.appendChild(particle);
            }
        }
            }
        }
        
        // Boot Sequence
        ${options?.showBootSequence !== false ? `
        const bootMessages = ${JSON.stringify(bootMessages)};
        let messageIndex = 0;
        const bootText = document.getElementById('bootText');
        const bootProgress = document.getElementById('bootProgressBar');
        const bootStatus = document.getElementById('bootStatus');
        const bootSequence = document.getElementById('bootSequence');
        
        function showNextBootMessage() {
            if (messageIndex < bootMessages.length) {
                const line = document.createElement('div');
                line.className = 'boot-line';
                line.style.animationDelay = (messageIndex * 0.1) + 's';
                line.innerHTML = '> ' + bootMessages[messageIndex];
                bootText.appendChild(line);
                
                const progress = ((messageIndex + 1) / bootMessages.length) * 100;
                bootProgress.style.width = progress + '%';
                
                if (messageIndex === bootMessages.length - 1) {
                    bootStatus.textContent = 'SYSTEM READY';
                    bootStatus.style.color = '#00ff00';
                    setTimeout(() => {
                        bootSequence.classList.add('hidden');
                    }, 1000);
                }
                
                messageIndex++;
                setTimeout(showNextBootMessage, 350);
            }
        }
        
        setTimeout(showNextBootMessage, 500);
        ` : ''}
        
        // Copy address to clipboard
        function copyAddress(element) {
            const text = element.textContent.split(': ')[1];
            navigator.clipboard.writeText(text).then(() => {
                const original = element.style.color;
                element.style.color = '#00ff00';
                setTimeout(() => element.style.color = original, 500);
            });
        }
        
        // FIP-2 Social Feed Loader
        async function loadSocialFeed() {
            const feedContainer = document.getElementById('socialFeed');
            if (!feedContainer) return;
            
            const tokenId = ${data.tokenId || 0};
            
            try {
                // Try to load from mcpvot.xyz API (FIP-2 enabled)
                const response = await fetch(\`https://mcpvot.xyz/api/farcaster/feed?type=token&tokenId=\${tokenId}&limit=5\`);
                
                if (!response.ok) throw new Error('API error');
                
                const data = await response.json();
                const casts = data.casts || [];
                
                if (casts.length === 0) {
                    feedContainer.innerHTML = '<div class="feed-empty">No casts yet. Be the first to discuss this VOT!</div>';
                    return;
                }
                
                feedContainer.innerHTML = casts.map(cast => \`
                    <div class="feed-cast">
                        <div class="cast-header">
                            <img src="\${cast.author?.pfp_url || 'https://mcpvot.xyz/default-avatar.png'}" 
                                 alt="avatar" class="cast-avatar" 
                                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><circle cx=%2216%22 cy=%2216%22 r=%2216%22 fill=%22%23333%22/></svg>'"/>
                            <span class="cast-author">@\${cast.author?.username || 'anonymous'}</span>
                            <span class="cast-time">\${formatCastTime(cast.timestamp)}</span>
                        </div>
                        <div class="cast-text">\${escapeHtml(cast.text)}</div>
                    </div>
                \`).join('');
                
            } catch (err) {
                console.log('Social feed not available:', err);
                feedContainer.innerHTML = '<div class="feed-empty">Connect to Farcaster to see community casts</div>';
            }
        }
        
        function formatCastTime(timestamp) {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const now = new Date();
            const diff = (now - date) / 1000;
            if (diff < 60) return 'just now';
            if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
            if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
            return date.toLocaleDateString();
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Initialize
        createDataRain();
        loadSocialFeed();
    </script>
</body>
</html>`;
}

/**
 * Generate Identity Banner - Cyberpunk HUD Style
 * Inspired by mcpvot_banner_ultra.svg
 * Displays user's ENS/Basename/Farcaster identity prominently
 */
function generateIdentityBanner(
  data: {
    address?: string;
    ensName?: string;
    basename?: string;
    farcasterUsername?: string;
    farcasterFid?: number;
    farcasterProfile?: { username?: string; fid?: number };
    displayName?: string;
    tokenId?: number | string;
    holdings?: { votBalance?: number | string };
  },
  colors: Record<string, string>
): string {
  const primary = colors.primary || '#00ffcc';
  const secondary = colors.secondary || '#ff6600';
  const accent = colors.accent || '#cc00ff';
  
  // Determine primary identity to display
  const primaryIdentity = data.displayName || data.ensName || data.basename || 'VOT HOLDER';
  const shortAddress = data.address 
    ? `${data.address.slice(0, 6)}...${data.address.slice(-4)}`
    : '0x...';
  const fullAddress = data.address || '0x0000...0000';
  
  // Identity source label
  const farcasterUser = data.farcasterUsername || data.farcasterProfile?.username;
  const identitySource = data.ensName ? 'ENS VERIFIED' 
    : data.basename ? 'BASENAME VERIFIED' 
    : farcasterUser ? 'FARCASTER VERIFIED'
    : 'WALLET ID';
    
  // VOT balance display
  const votBalance = data.holdings?.votBalance 
    ? formatNumber(data.holdings.votBalance) 
    : '---';
    
  // Farcaster info (use UserData fields)
  const farcasterUsername = data.farcasterUsername || data.farcasterProfile?.username || null;
  const farcasterFid = data.farcasterFid || data.farcasterProfile?.fid || null;
  // farcasterFid used for potential future FIP-2 integration
  void farcasterFid;

  return `
    <div class="identity-banner">
      <svg viewBox="0 0 900 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <!-- Chromatic Aberration Filter -->
          <filter id="chromaticBanner" x="-20%" y="-20%" width="140%" height="140%">
            <feOffset in="SourceGraphic" dx="2" dy="0" result="red">
              <animate attributeName="dx" values="2;-1;2" dur="0.1s" repeatCount="indefinite"/>
            </feOffset>
            <feOffset in="SourceGraphic" dx="-2" dy="0" result="blue">
              <animate attributeName="dx" values="-2;1;-2" dur="0.15s" repeatCount="indefinite"/>
            </feOffset>
            <feColorMatrix in="red" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="redOut"/>
            <feColorMatrix in="blue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blueOut"/>
            <feBlend in="redOut" in2="blueOut" mode="screen" result="blend"/>
            <feBlend in="blend" in2="SourceGraphic" mode="screen"/>
          </filter>
          
          <!-- Tech Glow Filter -->
          <filter id="techGlowBanner" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <!-- Scanline Pattern -->
          <pattern id="scanlinesBanner" width="4" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="4" y2="0" stroke="${primary}" stroke-width="0.5" opacity="0.1"/>
          </pattern>
          
          <!-- Circuit Pattern -->
          <pattern id="circuitPatternBanner" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 5 5 L 55 5 M 5 5 L 5 30 M 55 5 L 55 20 M 5 30 L 20 30 M 20 30 L 20 55 M 55 20 L 35 20 L 35 55" 
                  stroke="${primary}" stroke-width="0.3" fill="none" opacity="0.2"/>
            <circle cx="5" cy="5" r="1.5" fill="${primary}" opacity="0.4"/>
            <circle cx="55" cy="5" r="1.5" fill="${secondary}" opacity="0.4"/>
            <circle cx="20" cy="30" r="1.5" fill="${primary}" opacity="0.4"/>
          </pattern>
          
          <!-- Gauge Gradient -->
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primary}"/>
            <stop offset="50%" stop-color="${secondary}"/>
            <stop offset="100%" stop-color="${accent}"/>
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="900" height="240" fill="#0a0a0a" rx="8" ry="8"/>
        <rect width="900" height="240" fill="url(#circuitPatternBanner)" rx="8" ry="8"/>
        <rect width="900" height="240" fill="url(#scanlinesBanner)" rx="8" ry="8"/>
        
        <!-- Border Frame -->
        <rect x="4" y="4" width="892" height="232" fill="none" stroke="${primary}" stroke-width="2" rx="6" ry="6" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite"/>
        </rect>
        <rect x="8" y="8" width="884" height="224" fill="none" stroke="${primary}" stroke-width="1" rx="4" ry="4" opacity="0.3"/>
        
        <!-- Corner Accents -->
        <path d="M 20 4 L 4 4 L 4 20" stroke="${secondary}" stroke-width="3" fill="none"/>
        <path d="M 880 4 L 896 4 L 896 20" stroke="${secondary}" stroke-width="3" fill="none"/>
        <path d="M 20 236 L 4 236 L 4 220" stroke="${secondary}" stroke-width="3" fill="none"/>
        <path d="M 880 236 L 896 236 L 896 220" stroke="${secondary}" stroke-width="3" fill="none"/>
        
        <!-- Left Gauge Cluster - Loading Indicator -->
        <g transform="translate(80, 120)">
          <text x="0" y="-55" text-anchor="middle" class="banner-label" style="font-size: 8px; fill: ${primary}; letter-spacing: 2px;">SYSTEM STATUS</text>
          
          <!-- Outer Ring -->
          <circle cx="0" cy="0" r="45" fill="none" stroke="${primary}" stroke-width="1" opacity="0.3"/>
          
          <!-- Animated Progress Ring -->
          <circle cx="0" cy="0" r="40" fill="none" stroke="url(#gaugeGradient)" stroke-width="4" 
                  stroke-dasharray="251" stroke-dashoffset="60" transform="rotate(-90)"
                  filter="url(#techGlowBanner)">
            <animate attributeName="stroke-dashoffset" values="251;60;251" dur="5s" repeatCount="indefinite"/>
          </circle>
          
          <!-- Inner Details -->
          <circle cx="0" cy="0" r="35" fill="none" stroke="${primary}" stroke-width="0.5" opacity="0.5"/>
          <text x="0" y="5" text-anchor="middle" class="banner-value" style="font-size: 16px; fill: ${primary};">ONLINE</text>
          <text x="0" y="20" text-anchor="middle" style="font-size: 8px; fill: ${secondary};">#${data.tokenId || '???'}</text>
          
          <!-- Tick Marks -->
          ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => 
            `<line x1="0" y1="-42" x2="0" y2="-38" stroke="${primary}" stroke-width="1" opacity="0.6" transform="rotate(${angle})"/>`
          ).join('')}
        </g>
        
        <!-- Central Identity Display -->
        <g transform="translate(450, 120)" filter="url(#chromaticBanner)">
          <!-- Hexagonal Frame -->
          <polygon points="0,-65 56,-32 56,32 0,65 -56,32 -56,-32" fill="none" stroke="${primary}" stroke-width="2" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite"/>
          </polygon>
          <polygon points="0,-55 48,-27 48,27 0,55 -48,27 -48,-27" fill="rgba(0,255,204,0.05)" stroke="${primary}" stroke-width="1" opacity="0.6"/>
          
          <!-- Identity Source Label -->
          <rect x="-70" y="-90" width="140" height="16" fill="${primary}" opacity="0.9" rx="2"/>
          <text x="0" y="-78" text-anchor="middle" style="font-family: 'Orbitron', sans-serif; font-size: 9px; fill: #000; font-weight: bold; letter-spacing: 2px;">${identitySource}</text>
          
          <!-- Primary Identity Name -->
          <text x="0" y="8" text-anchor="middle" class="identity-name" 
                style="font-family: 'Orbitron', sans-serif; font-size: ${primaryIdentity.length > 15 ? '18' : '24'}px; fill: ${primary}; font-weight: 900;"
                filter="url(#techGlowBanner)">${primaryIdentity.toUpperCase()}</text>
          
          <!-- Secondary Identity / Address -->
          <text x="0" y="35" text-anchor="middle" class="identity-address" style="font-size: 10px; fill: ${secondary};">${shortAddress}</text>
          
          <!-- VOT Machine Label -->
          <text x="0" y="80" text-anchor="middle" style="font-family: 'Orbitron', sans-serif; font-size: 8px; fill: ${accent}; letter-spacing: 3px;">VOT MACHINE</text>
        </g>
        
        <!-- Right Radar Display -->
        <g transform="translate(820, 120)">
          <text x="0" y="-55" text-anchor="middle" class="banner-label" style="font-size: 8px; fill: ${primary}; letter-spacing: 2px;">VOT HOLDINGS</text>
          
          <!-- Radar Rings -->
          <circle cx="0" cy="0" r="45" fill="none" stroke="${primary}" stroke-width="1" opacity="0.3"/>
          <circle cx="0" cy="0" r="35" fill="none" stroke="${primary}" stroke-width="0.5" opacity="0.2"/>
          <circle cx="0" cy="0" r="25" fill="none" stroke="${primary}" stroke-width="0.5" opacity="0.2"/>
          
          <!-- Animated Sweep -->
          <g>
            <path d="M 0 0 L 0 -40 A 40 40 0 0 1 28 -28 Z" fill="${primary}" opacity="0.3">
              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="4s" repeatCount="indefinite"/>
            </path>
          </g>
          
          <!-- Cross Hairs -->
          <line x1="-45" y1="0" x2="45" y2="0" stroke="${primary}" stroke-width="0.5" opacity="0.4"/>
          <line x1="0" y1="-45" x2="0" y2="45" stroke="${primary}" stroke-width="0.5" opacity="0.4"/>
          
          <!-- VOT Balance Display -->
          <text x="0" y="5" text-anchor="middle" class="banner-value" style="font-size: 18px; fill: ${primary}; font-weight: bold;">${votBalance}</text>
          <text x="0" y="20" text-anchor="middle" style="font-size: 8px; fill: ${secondary};">VOT</text>
        </g>
        
        <!-- Bottom Info Bar -->
        <g transform="translate(0, 220)">
          <rect x="20" y="-12" width="860" height="20" fill="rgba(0,0,0,0.8)" rx="3"/>
          <rect x="20" y="-12" width="860" height="1" fill="${primary}" opacity="0.5"/>
          
          <!-- Address Display -->
          <text x="35" y="2" style="font-family: 'Courier New', monospace; font-size: 9px; fill: ${primary}; opacity: 0.7;">${fullAddress}</text>
          
          <!-- Contract Label -->
          <text x="450" y="2" text-anchor="middle" style="font-family: 'Orbitron', sans-serif; font-size: 8px; fill: ${secondary}; letter-spacing: 2px;">BASE MAINNET • ERC-1155</text>
          
          <!-- Farcaster Badge -->
          ${farcasterUsername ? `
          <g transform="translate(780, 0)">
            <rect x="-45" y="-8" width="90" height="16" fill="${accent}" opacity="0.8" rx="8"/>
            <text x="0" y="3" text-anchor="middle" style="font-size: 9px; fill: #fff; font-weight: bold;">@${farcasterUsername}</text>
          </g>
          ` : ''}
        </g>
        
        <!-- Top Status Bar -->
        <g transform="translate(0, 20)">
          <text x="30" y="0" style="font-family: 'Orbitron', sans-serif; font-size: 8px; fill: ${primary}; letter-spacing: 3px;">x402VOT PROTOCOL</text>
          
          <!-- Animated Status Dots -->
          <g transform="translate(200, -3)">
            <circle cx="0" cy="0" r="3" fill="${primary}">
              <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="12" cy="0" r="3" fill="${secondary}">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="24" cy="0" r="3" fill="${accent}">
              <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </g>
        </g>
        
        <!-- Animated Ethermax Logo - Top Right Corner -->
        <g transform="translate(860, 28)">
          <defs>
            <!-- Animated flame gradient with smooth transitions -->
            <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#ff3300">
                <animate attributeName="stop-color" values="#ff3300;#ff5500;#ff3300" dur="1.5s" repeatCount="indefinite"/>
              </stop>
              <stop offset="40%" stop-color="#ff6600">
                <animate attributeName="stop-color" values="#ff6600;#ff8800;#ffaa00;#ff6600" dur="1.2s" repeatCount="indefinite"/>
              </stop>
              <stop offset="70%" stop-color="#ff9900">
                <animate attributeName="stop-color" values="#ff9900;#ffbb00;#ff9900" dur="0.8s" repeatCount="indefinite"/>
              </stop>
              <stop offset="100%" stop-color="#ffcc00">
                <animate attributeName="stop-color" values="#ffcc00;#ffee00;#ffffff;#ffcc00" dur="0.6s" repeatCount="indefinite"/>
              </stop>
            </linearGradient>
            
            <!-- Radial fire glow -->
            <radialGradient id="fireGlowRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffcc00" stop-opacity="0.8"/>
              <stop offset="50%" stop-color="#ff6600" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#ff3300" stop-opacity="0"/>
            </radialGradient>
            
            <!-- Fire glow filter -->
            <filter id="ethermaxFireGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur2"/>
              <feMerge>
                <feMergeNode in="blur2"/>
                <feMergeNode in="blur1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <!-- Inner glow -->
            <filter id="innerFireGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feComposite in="blur" in2="SourceGraphic" operator="over"/>
            </filter>
          </defs>
          
          <!-- Clickable link wrapper -->
          <a href="https://ethermax.tech" target="_blank" style="cursor: pointer;">
            
            <!-- Outer pulsing glow ring -->
            <circle cx="0" cy="0" r="20" fill="none" stroke="#ff6600" stroke-width="0.5" opacity="0.2">
              <animate attributeName="r" values="20;23;20" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite"/>
            </circle>
            
            <!-- Fire aura background -->
            <circle cx="0" cy="0" r="16" fill="url(#fireGlowRadial)" opacity="0.6" filter="url(#ethermaxFireGlow)">
              <animate attributeName="r" values="16;18;16" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0.8;0.6" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            
            <!-- Rotating outer ring with dashes -->
            <circle cx="0" cy="0" r="14" fill="none" stroke="#ff6600" stroke-width="1" 
                    stroke-dasharray="5 3" opacity="0.6">
              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="10s" repeatCount="indefinite"/>
            </circle>
            
            <!-- Counter-rotating inner ring -->
            <circle cx="0" cy="0" r="11" fill="none" stroke="#ffcc00" stroke-width="0.5" 
                    stroke-dasharray="2 2" opacity="0.5">
              <animateTransform attributeName="transform" type="rotate" from="360 0 0" to="0 0 0" dur="8s" repeatCount="indefinite"/>
            </circle>
            
            <!-- Central black background -->
            <circle cx="0" cy="0" r="9" fill="rgba(0,0,0,0.85)"/>
            
            <!-- Animated Ethereum Diamond with Fire Effect -->
            <g filter="url(#innerFireGlow)">
              <!-- Top pyramid -->
              <path d="M 0 -7 L 5 0 L 0 -1 L -5 0 Z" fill="url(#flameGradient)">
                <animateTransform attributeName="transform" type="scale" values="1;1.03;1" dur="0.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.95;1;0.95" dur="0.5s" repeatCount="indefinite"/>
              </path>
              
              <!-- Bottom pyramid -->
              <path d="M 0 -1 L 5 0 L 0 7 L -5 0 Z" fill="url(#flameGradient)" opacity="0.85">
                <animateTransform attributeName="transform" type="scale" values="1;1.02;1" dur="0.9s" repeatCount="indefinite"/>
              </path>
              
              <!-- Center line -->
              <line x1="-5" y1="0" x2="5" y2="0" stroke="#ffffff" stroke-width="0.6" opacity="0.7">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="0.6s" repeatCount="indefinite"/>
              </line>
            </g>
            
            <!-- Rising flame particles -->
            <g>
              <circle cx="-1.5" cy="-4" r="0.8" fill="#ffcc00">
                <animate attributeName="cy" values="-4;-14" dur="1.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0" dur="1.2s" repeatCount="indefinite"/>
                <animate attributeName="r" values="0.8;0.2" dur="1.2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="0" cy="-5" r="0.6" fill="#ffffff">
                <animate attributeName="cy" values="-5;-16" dur="1s" repeatCount="indefinite" begin="0.3s"/>
                <animate attributeName="opacity" values="0.9;0" dur="1s" repeatCount="indefinite" begin="0.3s"/>
                <animate attributeName="r" values="0.6;0.15" dur="1s" repeatCount="indefinite" begin="0.3s"/>
              </circle>
              <circle cx="2" cy="-4.5" r="0.7" fill="#ff9900">
                <animate attributeName="cy" values="-4.5;-15" dur="1.4s" repeatCount="indefinite" begin="0.6s"/>
                <animate attributeName="opacity" values="0.7;0" dur="1.4s" repeatCount="indefinite" begin="0.6s"/>
                <animate attributeName="r" values="0.7;0.15" dur="1.4s" repeatCount="indefinite" begin="0.6s"/>
              </circle>
              <circle cx="-2.5" cy="-3" r="0.5" fill="#ff6600">
                <animate attributeName="cy" values="-3;-12" dur="1.1s" repeatCount="indefinite" begin="0.2s"/>
                <animate attributeName="opacity" values="0.6;0" dur="1.1s" repeatCount="indefinite" begin="0.2s"/>
              </circle>
              <circle cx="2.5" cy="-3.5" r="0.4" fill="#ffee00">
                <animate attributeName="cy" values="-3.5;-13" dur="1.3s" repeatCount="indefinite" begin="0.5s"/>
                <animate attributeName="opacity" values="0.8;0" dur="1.3s" repeatCount="indefinite" begin="0.5s"/>
              </circle>
            </g>
            
            <!-- Hover area -->
            <rect x="-18" y="-18" width="36" height="36" fill="transparent"/>
          </a>
        </g>
        
        <!-- ENS/Basename Badge (if available) -->
        ${data.ensName || data.basename ? `
        <g transform="translate(450, 195)">
          <rect x="-80" y="-10" width="160" height="20" fill="${data.ensName ? '#5298FF' : '#0052FF'}" rx="10" opacity="0.9"/>
          <text x="0" y="4" text-anchor="middle" style="font-family: 'Orbitron', sans-serif; font-size: 10px; fill: #fff; font-weight: bold;">
            ${data.ensName ? '🔷 ' + data.ensName : '🔵 ' + data.basename}
          </text>
        </g>
        ` : ''}
      </svg>
    </div>`;
}

/**
 * Generate Circuit Board SVG background
 */
function generateCircuitBoardSVG(colors: Record<string, string>): string {
  const primary = colors.primary || '#00ffcc';
  const secondary = colors.secondary || '#ff6600';
  
  return `
    <svg class="circuit-bg" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
            <pattern id="circuitBoard" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 10 10 L 90 10 M 10 10 L 10 50 M 90 10 L 90 30 M 10 50 L 30 50 M 30 50 L 30 90 M 90 30 L 60 30 L 60 90" 
                      stroke="${primary}" stroke-width="0.5" fill="none" opacity="0.15"/>
                <circle cx="10" cy="10" r="2" fill="${primary}" opacity="0.4"/>
                <circle cx="90" cy="10" r="2" fill="${primary}" opacity="0.4"/>
                <circle cx="30" cy="50" r="2" fill="${secondary}" opacity="0.4"/>
                <circle cx="60" cy="30" r="2" fill="${primary}" opacity="0.4"/>
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuitBoard)"/>
        <g opacity="0.08">
            <line x1="0" y1="200" x2="1200" y2="200" stroke="${primary}" stroke-width="1"/>
            <line x1="0" y1="400" x2="1200" y2="400" stroke="${primary}" stroke-width="1"/>
            <line x1="0" y1="600" x2="1200" y2="600" stroke="${primary}" stroke-width="1"/>
            <line x1="300" y1="0" x2="300" y2="800" stroke="${primary}" stroke-width="1"/>
            <line x1="600" y1="0" x2="600" y2="800" stroke="${secondary}" stroke-width="1" opacity="0.5"/>
            <line x1="900" y1="0" x2="900" y2="800" stroke="${primary}" stroke-width="1"/>
        </g>
    </svg>`;
}

/**
 * Generate Boot Sequence HTML
 */
function generateBootSequenceHTML(): string {
  return `
    <div class="boot-sequence" id="bootSequence">
        <div class="boot-container">
            <div class="boot-header">
                <span class="boot-header-text">SYSTEM BOOT SEQUENCE: x402VOT PROTOCOL</span>
            </div>
            <div class="boot-progress-container">
                <div class="boot-progress-bar" id="bootProgressBar"></div>
            </div>
            <div class="boot-text" id="bootText"></div>
            <div class="boot-status" id="bootStatus">LOADING...</div>
        </div>
    </div>`;
}

/**
 * Helper: Convert hex color to RGB string
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '0, 255, 204';
}

/**
 * Helper: Format large numbers
 */
function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toFixed(0);
}

/**
 * Helper: Format date
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

/**
 * Generate FIP-2 compliant Warpcast share URL
 * Uses chain:// protocol for proper Zapper integration
 */
function generateWarpcastShareUrl(tokenId: number, message: string): string {
  const VOT_MACHINE_CONTRACT = '0x699727F9E01A822EFdcf7333073f0461e5914b4E';
  const BASE_CHAIN_ID = 8453;
  
  // FIP-2 parent_url format for ERC-1155 tokens
  const parentUrl = `chain://eip155:${BASE_CHAIN_ID}/erc1155:${VOT_MACHINE_CONTRACT}/${tokenId}`;
  
  // Construct Warpcast compose URL
  const text = encodeURIComponent(`${message}\n\n🔮 VOT Machine #${tokenId}\nhttps://mcpvot.xyz/${tokenId}`);
  const embedUrl = encodeURIComponent(`https://mcpvot.xyz/${tokenId}`);
  
  return `https://warpcast.com/~/compose?text=${text}&embeds[]=${embedUrl}&parentUrl=${encodeURIComponent(parentUrl)}`;
}

export default generateVOTHTMLPage;
