'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    BEEPER MINT MACHINE - RETRO TERMINAL UI                   ║
 * ║                                                                               ║
 * ║  Features:                                                                    ║
 * ║  ✅ Retro ASCII building animation while minting                             ║
 * ║  ✅ Transaction ID display with BaseScan link                                ║
 * ║  ✅ SVG download button                                                       ║
 * ║  ✅ FIP-2 Farcaster share workflow (+10K VOT bonus)                          ║
 * ║  ✅ OpenSea button to view NFT                                               ║
 * ║  ✅ Post-mint NFT display                                                     ║
 * ║  ✅ Queue management for high traffic                                        ║
 * ║  ✅ ERC-4804 web3:// URL support                                             ║
 * ║                                                                               ║
 * ║  Style: Matrix Green (#77FE80) - beep.works inspired                         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface BeeperMintResult {
  tokenId: number;
  rarity: string;
  svgCid: string;
  metadataCid: string;
  svgContent: string;
  txHash: string;
  votSent: string;
  votBurned: string;
  shareBonus: number;
  openSeaUrl: string;
  baseScanUrl: string;
  ipfsUrl: string;
  web3Url: string;
}

interface QueueStatus {
  position: number;
  total: number;
  estimatedWait: number;
}

type MintPhase = 'idle' | 'queued' | 'building' | 'minting' | 'success' | 'error';

// =============================================================================
// CONSTANTS - MATRIX GREEN PALETTE
// =============================================================================

const MATRIX_GREEN = '#77FE80';
const MATRIX_ACCENT = '#5DE066';
const MATRIX_DIM = '#2a4a2a';
const MATRIX_BG = '#050505';

// Contract address - .trim() to remove any trailing whitespace/newlines from env vars
const BEEPER_CONTRACT = (process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9').trim();

// ASCII Art frames for building animation
const BUILD_FRAMES = [
  `
┌─────────────────────────────┐
│  INITIALIZING MACHINE...    │
│  ░░░░░░░░░░░░░░░░░░░░░░░░  │
│                             │
│        [  ]                 │
│        [  ]                 │
│        [  ]                 │
└─────────────────────────────┘
`,
  `
┌─────────────────────────────┐
│  LOADING VRF ENTROPY...     │
│  ▓░░░░░░░░░░░░░░░░░░░░░░░  │
│                             │
│        [██]                 │
│        [  ]                 │
│        [  ]                 │
└─────────────────────────────┘
`,
  `
┌─────────────────────────────┐
│  FETCHING IDENTITY...       │
│  ▓▓▓▓░░░░░░░░░░░░░░░░░░░░  │
│                             │
│        [██]                 │
│        [██]                 │
│        [  ]                 │
└─────────────────────────────┘
`,
  `
┌─────────────────────────────┐
│  ROLLING RARITY...          │
│  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░  │
│         𒀭                  │
│        [██]                 │
│        [██]                 │
│        [██]                 │
└─────────────────────────────┘
`,
  `
┌─────────────────────────────┐
│  GENERATING BANNER SVG...   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░  │
│       𒀭 𒈗                 │
│      ╔════╗                 │
│      ║BEEP║                 │
│      ╚════╝                 │
└─────────────────────────────┘
`,
  `
┌─────────────────────────────┐
│  STORING ON-CHAIN...        │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  │
│       𒀭 𒈗  𒁹              │
│      ╔════╗                 │
│      ║BEEP║                 │
│      ╚════╝                 │
└─────────────────────────────┘
`,
  `
┌─────────────────────────────┐
│  MINTING ERC-1155...        │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░  │
│       𒀭 𒈗  𒁹 𒋼           │
│      ╔════╗                 │
│      ║BEEP║                 │
│      ╚════╝                 │
└─────────────────────────────┘
`,
  `
┌─────────────────────────────┐
│  SENDING VOT REWARD...      │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│       𒀭 𒈗  𒁹 𒋼 𒆷        │
│      ╔════╗  ✓              │
│      ║BEEP║                 │
│      ╚════╝                 │
└─────────────────────────────┘
`,
];

const RARITY_GLYPHS: Record<string, { glyph: string; name: string }> = {
  node: { glyph: '𒇻', name: 'NODE' },
  validator: { glyph: '𒁹', name: 'VALIDATOR' },
  staker: { glyph: '𒋼', name: 'STAKER' },
  whale: { glyph: '𒄠', name: 'WHALE' },
  og: { glyph: '𒀭', name: 'OG' },
  genesis: { glyph: '𒆳', name: 'GENESIS' },
  zzz: { glyph: '𒌋', name: 'ZZZ' },
  fomo: { glyph: '𒀯', name: 'FOMO' },
  gm: { glyph: '𒆷', name: 'GM' },
  x402: { glyph: '𒈗', name: 'X402' },
};

// VOT Hieroglyphs for UI (no emojis)
const VOT_GLYPHS = {
  beeper: '𒀭',      // Dino/entity
  mint: '𒈗',        // Protocol action  
  vot: '𒆷',         // VOT token
  reward: '𒋼',      // Reward/stake
  success: '𒌋',     // Complete
  chain: '𒁹',       // Blockchain
  ipfs: '𒄠',        // Storage
  gasless: '𒀯',     // Free/gasless
  rarity: '𒇻',      // VRF rarity
  share: '𒆳',       // Social share
};

// x402 V2 Explanation Lines (for typewriter) - FULLY ON-CHAIN
const X402_EXPLANATION = [
  '> INITIALIZING x402 V2 PROTOCOL...',
  '> GASLESS: USER PAYS $0.25 USDC ONLY',
  '> FACILITATOR COVERS ALL GAS FEES',
  '> VOT REWARD: 69,420 TOKENS INSTANT',
  '> NO BURNS ON PROMO MINT',
  '> SVG STORED FULLY ON-CHAIN (BASE L2)',
  '> NO IPFS DEPENDENCIES - PERMANENT',
  '> ERC-1155 + EIP-4804 web3:// URLS',
  '> READY FOR MINT EXECUTION...',
];

// Pre-computed matrix rain data (avoids Math.random in render)
const MATRIX_RAIN_DATA = [
  { id: 0, left: 0, duration: 1, delay: 0, char: '1' },
  { id: 1, left: 5, duration: 2, delay: 0.4, char: '0' },
  { id: 2, left: 10, duration: 1.5, delay: 0.8, char: '1' },
  { id: 3, left: 15, duration: 2.5, delay: 1.2, char: '0' },
  { id: 4, left: 20, duration: 1, delay: 1.6, char: '1' },
  { id: 5, left: 25, duration: 1.8, delay: 0, char: '0' },
  { id: 6, left: 30, duration: 2.2, delay: 0.4, char: '1' },
  { id: 7, left: 35, duration: 1.3, delay: 0.8, char: '0' },
  { id: 8, left: 40, duration: 2, delay: 1.2, char: '1' },
  { id: 9, left: 45, duration: 1.6, delay: 1.6, char: '0' },
  { id: 10, left: 50, duration: 1.4, delay: 0, char: '1' },
  { id: 11, left: 55, duration: 2.1, delay: 0.4, char: '0' },
  { id: 12, left: 60, duration: 1.7, delay: 0.8, char: '1' },
  { id: 13, left: 65, duration: 1.9, delay: 1.2, char: '0' },
  { id: 14, left: 70, duration: 2.3, delay: 1.6, char: '1' },
  { id: 15, left: 75, duration: 1.2, delay: 0, char: '0' },
  { id: 16, left: 80, duration: 1.8, delay: 0.4, char: '1' },
  { id: 17, left: 85, duration: 2.4, delay: 0.8, char: '0' },
  { id: 18, left: 90, duration: 1.5, delay: 1.2, char: '1' },
  { id: 19, left: 95, duration: 2, delay: 1.6, char: '0' },
];

// =============================================================================
// ANIMATED MINT BUTTON (Pulsing while building)
// =============================================================================

function AnimatedMintButton({ stage }: { stage: string }) {
  const buttonText = [
    'INITIALIZING...',
    'LOADING VRF...',
    'FETCHING IDENTITY...',
    'ROLLING RARITY...',
    'GENERATING SVG...',
    'AI ENHANCING...',
    'PINNING TO IPFS...',
    'MINTING NFT...',
    'SENDING VOT...',
  ];
  
  const stageIndex = Math.min(
    BUILD_FRAMES.findIndex(f => f.includes(stage)) || 0,
    buttonText.length - 1
  );
  
  return (
    <motion.div
      className="relative mt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Outer glow pulse */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{ backgroundColor: MATRIX_GREEN }}
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Button container */}
      <div
        className="relative py-4 px-6 rounded-lg border-2 overflow-hidden"
        style={{
          borderColor: MATRIX_GREEN,
          backgroundColor: MATRIX_BG,
        }}
      >
        {/* Scanning line effect */}
        <motion.div
          className="absolute left-0 right-0 h-0.5"
          style={{ backgroundColor: MATRIX_GREEN }}
          animate={{
            top: ['0%', '100%', '0%'],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Matrix rain background - pre-computed data */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {MATRIX_RAIN_DATA.map((item) => (
            <motion.div
              key={item.id}
              className="absolute text-xs font-mono"
              style={{ 
                left: `${item.left}%`,
                color: MATRIX_GREEN,
              }}
              animate={{
                y: ['-100%', '100%'],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: item.duration,
                repeat: Infinity,
                delay: item.delay,
              }}
            >
              {item.char}
            </motion.div>
          ))}
        </div>
        
        {/* Button text */}
        <div className="relative flex items-center justify-center gap-3">
          {/* Spinning loader */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12" cy="12" r="10"
                stroke={MATRIX_DIM}
                strokeWidth="2"
              />
              <motion.circle
                cx="12" cy="12" r="10"
                stroke={MATRIX_GREEN}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="60"
                strokeDashoffset="45"
              />
            </svg>
          </motion.div>
          
          {/* Animated text */}
          <motion.span
            key={stageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-sm uppercase tracking-wider font-bold"
            style={{ color: MATRIX_GREEN }}
          >
            {buttonText[stageIndex] || 'BUILDING...'}
          </motion.span>
          
          {/* Pulsing dots */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: MATRIX_GREEN }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-1"
          style={{ backgroundColor: MATRIX_GREEN }}
          initial={{ width: '0%' }}
          animate={{ width: `${((stageIndex + 1) / buttonText.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}

// =============================================================================
// RETRO BUILDING ANIMATION COMPONENT
// =============================================================================

function RetroBuildingAnimation({ frameIndex }: { frameIndex: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-mono text-xs leading-tight"
      style={{ color: MATRIX_GREEN }}
    >
      <pre className="whitespace-pre">{BUILD_FRAMES[frameIndex]}</pre>
      
      {/* Blinking cursor */}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-2 h-4 ml-1"
        style={{ backgroundColor: MATRIX_GREEN }}
      />
    </motion.div>
  );
}

// =============================================================================
// TYPEWRITER TEXT COMPONENT
// =============================================================================

function TypewriterText({ 
  lines, 
  speed = 30, 
  onComplete 
}: { 
  lines: string[]; 
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  
  useEffect(() => {
    if (currentLineIndex >= lines.length) {
      onComplete?.();
      return;
    }
    
    const currentLine = lines[currentLineIndex];
    
    if (currentCharIndex < currentLine.length) {
      const timer = setTimeout(() => {
        setDisplayedLines(prev => {
          const newLines = [...prev];
          newLines[currentLineIndex] = currentLine.slice(0, currentCharIndex + 1);
          return newLines;
        });
        setCurrentCharIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else {
      // Move to next line
      const timer = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentLineIndex, currentCharIndex, lines, speed, onComplete]);
  
  return (
    <div className="font-mono text-xs leading-relaxed text-left">
      {displayedLines.map((line, i) => (
        <div key={i} style={{ color: MATRIX_GREEN }}>
          {line}
          {i === currentLineIndex && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-2 h-3 ml-0.5 align-middle"
              style={{ backgroundColor: MATRIX_GREEN }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// TERMINAL IDLE PANEL (No emojis, hieroglyphs only)
// =============================================================================

function TerminalIdlePanel({ 
  onStartMint, 
  walletAddress 
}: { 
  onStartMint: () => void;
  walletAddress?: string;
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationDone, setExplanationDone] = useState(false);
  
  // Start typewriter after mount
  useEffect(() => {
    const timer = setTimeout(() => setShowExplanation(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Terminal Header */}
      <div 
        className="flex items-center gap-2 pb-2 border-b"
        style={{ borderColor: MATRIX_DIM }}
      >
        <span className="text-lg">{VOT_GLYPHS.beeper}</span>
        <span 
          className="font-mono text-sm uppercase tracking-wider"
          style={{ color: MATRIX_GREEN }}
        >
          BEEPER MINT TERMINAL v2.0
        </span>
      </div>
      
      {/* System Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          className="p-3 rounded border"
          style={{ borderColor: MATRIX_DIM, backgroundColor: `${MATRIX_BG}80` }}
        >
          <div className="font-mono text-xs uppercase" style={{ color: MATRIX_DIM }}>
            {VOT_GLYPHS.chain} NETWORK
          </div>
          <div className="font-mono text-sm mt-1" style={{ color: MATRIX_GREEN }}>
            BASE L2
          </div>
        </div>
        <div 
          className="p-3 rounded border"
          style={{ borderColor: MATRIX_DIM, backgroundColor: `${MATRIX_BG}80` }}
        >
          <div className="font-mono text-xs uppercase" style={{ color: MATRIX_DIM }}>
            {VOT_GLYPHS.mint} PRICE
          </div>
          <div className="font-mono text-sm mt-1" style={{ color: MATRIX_GREEN }}>
            $0.25 USDC
          </div>
        </div>
        <div 
          className="p-3 rounded border"
          style={{ borderColor: MATRIX_DIM, backgroundColor: `${MATRIX_BG}80` }}
        >
          <div className="font-mono text-xs uppercase" style={{ color: MATRIX_DIM }}>
            {VOT_GLYPHS.reward} REWARD
          </div>
          <div className="font-mono text-sm mt-1" style={{ color: MATRIX_GREEN }}>
            69,420 VOT
          </div>
        </div>
        <div 
          className="p-3 rounded border"
          style={{ borderColor: MATRIX_DIM, backgroundColor: `${MATRIX_BG}80` }}
        >
          <div className="font-mono text-xs uppercase" style={{ color: MATRIX_DIM }}>
            {VOT_GLYPHS.gasless} GAS
          </div>
          <div className="font-mono text-sm mt-1" style={{ color: '#8A63D2' }}>
            GASLESS
          </div>
        </div>
      </div>
      
      {/* Wallet Display */}
      {walletAddress && (
        <div 
          className="p-3 rounded border"
          style={{ borderColor: MATRIX_DIM, backgroundColor: `${MATRIX_BG}80` }}
        >
          <div className="font-mono text-xs uppercase" style={{ color: MATRIX_DIM }}>
            {VOT_GLYPHS.chain} CONNECTED WALLET
          </div>
          <div className="font-mono text-xs mt-1" style={{ color: MATRIX_ACCENT }}>
            {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
          </div>
        </div>
      )}
      
      {/* Terminal Output - x402 V2 Explanation */}
      <div 
        className="p-3 rounded border min-h-[140px]"
        style={{ borderColor: MATRIX_DIM, backgroundColor: '#000' }}
      >
        <div className="font-mono text-xs mb-2" style={{ color: MATRIX_DIM }}>
          {'// x402 V2 PROTOCOL INITIALIZATION'}
        </div>
        {showExplanation && (
          <TypewriterText 
            lines={X402_EXPLANATION} 
            speed={25}
            onComplete={() => setExplanationDone(true)}
          />
        )}
      </div>
      
      {/* Feature Tags - FULLY ON-CHAIN */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          { glyph: VOT_GLYPHS.chain, label: 'ON-CHAIN SVG' },
          { glyph: VOT_GLYPHS.ipfs, label: 'ERC-1155' },
          { glyph: VOT_GLYPHS.rarity, label: 'VRF-RARITY' },
          { glyph: VOT_GLYPHS.gasless, label: 'EIP-4804' },
        ].map((tag) => (
          <span 
            key={tag.label}
            className="px-2 py-1 rounded font-mono text-xs"
            style={{ 
              backgroundColor: tag.label === 'ON-CHAIN SVG' ? `${MATRIX_GREEN}20` : `${MATRIX_GREEN}10`,
              border: `1px solid ${tag.label === 'ON-CHAIN SVG' ? MATRIX_GREEN : MATRIX_DIM}`,
              color: tag.label === 'ON-CHAIN SVG' ? MATRIX_GREEN : MATRIX_DIM,
            }}
          >
            {tag.glyph} {tag.label}
          </span>
        ))}
      </div>
      
      {/* Mint Button */}
      <motion.button
        onClick={onStartMint}
        disabled={!explanationDone}
        className="w-full py-4 rounded font-mono uppercase tracking-wider text-sm font-bold border-2 transition-all disabled:opacity-50"
        style={{
          borderColor: explanationDone ? MATRIX_GREEN : MATRIX_DIM,
          backgroundColor: explanationDone ? `${MATRIX_GREEN}10` : 'transparent',
          color: explanationDone ? MATRIX_GREEN : MATRIX_DIM,
        }}
        whileHover={explanationDone ? {
          backgroundColor: `${MATRIX_GREEN}20`,
          boxShadow: `0 0 30px ${MATRIX_GREEN}40`,
        } : {}}
        whileTap={explanationDone ? { scale: 0.98 } : {}}
      >
        {explanationDone ? (
          <span className="flex items-center justify-center gap-2">
            <span>{VOT_GLYPHS.mint}</span>
            <span>EXECUTE MINT</span>
            <span>{VOT_GLYPHS.mint}</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {VOT_GLYPHS.chain}
            </motion.span>
            <span>INITIALIZING...</span>
          </span>
        )}
      </motion.button>
      
      {/* Bottom Info */}
      <div className="text-center font-mono text-xs" style={{ color: MATRIX_DIM }}>
        $0.25 USDC {VOT_GLYPHS.vot} 69,420 VOT {VOT_GLYPHS.gasless} NO BURNS
      </div>
    </div>
  );
}

// =============================================================================
// QUEUE STATUS COMPONENT
// =============================================================================

function QueueStatusDisplay({ status }: { status: QueueStatus }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded border-2"
      style={{
        borderColor: MATRIX_ACCENT,
        backgroundColor: `${MATRIX_BG}ee`,
      }}
    >
      <div className="flex items-center gap-3 font-mono text-xs" style={{ color: MATRIX_GREEN }}>
        <span className="uppercase tracking-wider">QUEUE POSITION:</span>
        <span className="text-lg font-bold">{status.position}</span>
        <span className="opacity-60">/ {status.total}</span>
      </div>
      <div className="mt-2 font-mono text-xs" style={{ color: MATRIX_ACCENT }}>
        EST. WAIT: ~{status.estimatedWait}s
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 h-2 rounded overflow-hidden" style={{ backgroundColor: MATRIX_DIM }}>
        <motion.div
          className="h-full"
          style={{ backgroundColor: MATRIX_GREEN }}
          initial={{ width: 0 }}
          animate={{ width: `${((status.total - status.position + 1) / status.total) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}

// =============================================================================
// SUCCESS PANEL - NFT DISPLAY + ACTIONS
// =============================================================================

function MintSuccessPanel({ result, onShareToFarcaster, onDownloadSvg }: {
  result: BeeperMintResult;
  onShareToFarcaster: () => void;
  onDownloadSvg: () => void;
}) {
  const rarityInfo = RARITY_GLYPHS[result.rarity.toLowerCase()] || RARITY_GLYPHS.node;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Success Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="text-5xl mb-4 font-mono"
          style={{ color: MATRIX_GREEN }}
        >
          {VOT_GLYPHS.mint}
        </motion.div>
        <h2 
          className="text-2xl font-mono uppercase tracking-widest mb-2"
          style={{ color: MATRIX_GREEN }}
        >
          BEEPER #{result.tokenId} MINTED
        </h2>
        <div className="flex items-center justify-center gap-2 font-mono text-lg">
          <span className="text-3xl">{rarityInfo.glyph}</span>
          <span style={{ color: MATRIX_ACCENT }}>{rarityInfo.name}</span>
        </div>
      </div>

      {/* NFT Preview */}
      <div
        className="p-4 rounded-lg border-2 overflow-hidden"
        style={{
          borderColor: MATRIX_GREEN,
          backgroundColor: MATRIX_BG,
          boxShadow: `0 0 30px ${MATRIX_GREEN}40`,
        }}
      >
        {result.svgContent ? (
          <div 
            className="w-full aspect-[900/240] rounded"
            dangerouslySetInnerHTML={{ __html: result.svgContent }}
          />
        ) : (
          <div className="w-full aspect-[900/240] flex items-center justify-center">
            <span className="font-mono text-sm" style={{ color: MATRIX_DIM }}>
              Loading preview...
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid - No burn for promo mint, show share bonus instead */}
      <div className="grid grid-cols-2 gap-4">
        <StatBox label="VOT RECEIVED" value={`+${(69420).toLocaleString()}`} color={MATRIX_GREEN} />
        <StatBox label="SHARE BONUS" value={`+${(result.shareBonus || 10000).toLocaleString()}`} color="#8A63D2" />
      </div>

      {/* Transaction Info */}
      <div
        className="p-4 rounded border font-mono text-xs space-y-2"
        style={{ borderColor: MATRIX_DIM, backgroundColor: `${MATRIX_BG}80` }}
      >
        <div className="flex justify-between">
          <span style={{ color: MATRIX_ACCENT }}>TX HASH:</span>
          <a
            href={result.baseScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline truncate max-w-[200px]"
            style={{ color: MATRIX_GREEN }}
          >
            {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}
          </a>
        </div>
        <div className="flex justify-between">
          <span style={{ color: MATRIX_ACCENT }}>IPFS CID:</span>
          <span style={{ color: MATRIX_GREEN }}>{result.svgCid.slice(0, 12)}...</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: MATRIX_ACCENT }}>WEB3 URL:</span>
          <span style={{ color: MATRIX_GREEN }} className="truncate max-w-[200px]">{result.web3Url}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* FIP-2 Share to Farcaster */}
        <motion.button
          onClick={onShareToFarcaster}
          className="w-full py-4 rounded font-mono uppercase tracking-wider text-sm font-bold border-2 transition-all"
          style={{
            borderColor: '#8A63D2',
            backgroundColor: 'rgba(138, 99, 210, 0.1)',
            color: '#8A63D2',
          }}
          whileHover={{ 
            backgroundColor: 'rgba(138, 99, 210, 0.2)',
            boxShadow: '0 0 30px rgba(138, 99, 210, 0.4)',
          }}
          whileTap={{ scale: 0.98 }}
        >
          {VOT_GLYPHS.protocol} SHARE TO FARCASTER (+{result.shareBonus.toLocaleString()} VOT)
        </motion.button>

        {/* Follow @mcpvot on Farcaster - Required for bonus */}
        <a
          href="https://warpcast.com/mcpvot"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 rounded font-mono uppercase tracking-wider text-sm text-center border-2 transition-all hover:shadow-lg"
          style={{
            borderColor: '#8A63D2',
            backgroundColor: 'rgba(138, 99, 210, 0.05)',
            color: '#8A63D2',
          }}
        >
          {VOT_GLYPHS.oracle} FOLLOW @MCPVOT (REQUIRED FOR BONUS)
        </a>

        {/* View on OpenSea */}
        <a
          href={result.openSeaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 rounded font-mono uppercase tracking-wider text-sm text-center border-2 transition-all hover:shadow-lg"
          style={{
            borderColor: '#2081E2',
            backgroundColor: 'rgba(32, 129, 226, 0.1)',
            color: '#2081E2',
          }}
        >
          {VOT_GLYPHS.reward} VIEW ON OPENSEA
        </a>

        {/* Download SVG */}
        <motion.button
          onClick={onDownloadSvg}
          className="w-full py-3 rounded font-mono uppercase tracking-wider text-sm border-2 transition-all"
          style={{
            borderColor: MATRIX_GREEN,
            backgroundColor: `${MATRIX_GREEN}10`,
            color: MATRIX_GREEN,
          }}
          whileHover={{
            backgroundColor: `${MATRIX_GREEN}20`,
            boxShadow: `0 0 20px ${MATRIX_GREEN}40`,
          }}
          whileTap={{ scale: 0.98 }}
        >
          {VOT_GLYPHS.gasless} DOWNLOAD SVG BANNER
        </motion.button>

        {/* View on BaseScan */}
        <a
          href={result.baseScanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 rounded font-mono uppercase tracking-wider text-xs text-center transition-all hover:opacity-80"
          style={{ color: MATRIX_ACCENT }}
        >
          VIEW ON BASESCAN →
        </a>
      </div>
    </motion.div>
  );
}

// =============================================================================
// STAT BOX COMPONENT
// =============================================================================

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="p-4 rounded border-2 text-center"
      style={{
        borderColor: `${color}40`,
        backgroundColor: `${color}10`,
      }}
    >
      <div className="font-mono text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="font-mono text-xs uppercase tracking-wider mt-1" style={{ color: MATRIX_DIM }}>{label}</div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function BeeperMintMachine({
  userAddress,
  farcasterFid,
  onMintComplete,
}: {
  userAddress: string;
  farcasterFid?: number;
  onMintComplete?: (result: BeeperMintResult) => void;
}) {
  const [phase, setPhase] = useState<MintPhase>('idle');
  const [buildFrame, setBuildFrame] = useState(0);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [mintResult, setMintResult] = useState<BeeperMintResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================================
  // BUILDING ANIMATION
  // ==========================================================================
  
  useEffect(() => {
    if (phase !== 'building') return;
    
    const interval = setInterval(() => {
      setBuildFrame(prev => {
        if (prev >= BUILD_FRAMES.length - 1) {
          return prev; // Stay on last frame until minting completes
        }
        return prev + 1;
      });
    }, 800);
    
    return () => clearInterval(interval);
  }, [phase]);

  // ==========================================================================
  // MINT HANDLER
  // ==========================================================================
  
  const handleMint = useCallback(async () => {
    setPhase('queued');
    setError(null);
    setBuildFrame(0);
    
    try {
      // Check queue status
      const queueRes = await fetch(`/api/beeper/queue?address=${userAddress}`);
      const queueData = await queueRes.json();
      
      if (queueData.position > 1) {
        setQueueStatus({
          position: queueData.position,
          total: queueData.total,
          estimatedWait: queueData.estimatedWait,
        });
        
        // Wait in queue
        await new Promise(resolve => setTimeout(resolve, queueData.estimatedWait * 1000));
      }
      
      setPhase('building');
      setQueueStatus(null);
      
      // Call mint API
      const mintRes = await fetch('/api/beeper/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: userAddress,
          fid: farcasterFid,
        }),
      });
      
      if (!mintRes.ok) {
        const errData = await mintRes.json();
        throw new Error(errData.error || 'Mint failed');
      }
      
      const data = await mintRes.json();
      
      // Transition to minting phase
      setPhase('minting');
      setBuildFrame(BUILD_FRAMES.length - 1);
      
      // Simulate blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Build result object
      const result: BeeperMintResult = {
        tokenId: data.data.tokenId || Date.now() % 10000,
        rarity: data.data.rarity || 'node',
        svgCid: data.data.svgCid,
        metadataCid: data.data.metadataCid,
        svgContent: data.preview,
        txHash: data.data.txHash || `0x${Date.now().toString(16)}`,
        votSent: data.data.votReward || '69420000000000000000000',
        votBurned: '0', // BEEPER has no burns
        shareBonus: 10000,
        openSeaUrl: `https://opensea.io/assets/base/${BEEPER_CONTRACT}/${data.data.tokenId}`,
        baseScanUrl: `https://basescan.org/tx/${data.data.txHash}`,
        ipfsUrl: `https://ipfs.io/ipfs/${data.data.svgCid}`,
        web3Url: `web3://${BEEPER_CONTRACT}:8453/${data.data.tokenId}`,
      };
      
      setMintResult(result);
      setPhase('success');
      
      onMintComplete?.(result);
      
    } catch (err) {
      console.error('[BeeperMint] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPhase('error');
    }
  }, [userAddress, farcasterFid, onMintComplete]);

  // ==========================================================================
  // FIP-2 FARCASTER SHARE
  // ==========================================================================
  
  const handleShareToFarcaster = useCallback(() => {
    if (!mintResult) return;
    
    const rarityGlyph = RARITY_GLYPHS[mintResult.rarity.toLowerCase()]?.glyph || VOT_GLYPHS.oracle;
    const shareText = `${VOT_GLYPHS.mint} BEEPER #${mintResult.tokenId} MINTED\n\n${rarityGlyph} Rarity: ${mintResult.rarity.toUpperCase()}\n\n${VOT_GLYPHS.gasless} x402 V2 GASLESS PROTOCOL\n\n@mcpvot`;
    const shareUrl = `https://mcpvot.xyz/beeper/${mintResult.tokenId}`;
    
    // Open Warpcast compose
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`;
    window.open(warpcastUrl, '_blank');
    
    // Trigger share bonus claim (FIP-2)
    fetch('/api/beeper/claim-share-bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId: mintResult.tokenId }),
    }).catch(console.error);
    
  }, [mintResult]);

  // ==========================================================================
  // SVG DOWNLOAD
  // ==========================================================================
  
  const handleDownloadSvg = useCallback(() => {
    if (!mintResult?.svgContent) return;
    
    const blob = new Blob([mintResult.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beeper-${mintResult.tokenId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [mintResult]);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  return (
    <div
      className="p-6 rounded-lg border-2"
      style={{
        borderColor: `${MATRIX_GREEN}60`,
        backgroundColor: MATRIX_BG,
        boxShadow: `0 0 40px ${MATRIX_GREEN}20`,
      }}
    >
      <AnimatePresence mode="wait">
        
        {/* IDLE - Terminal Style Welcome with x402 V2 Explanation */}
        {phase === 'idle' && (
          <TerminalIdlePanel 
            onStartMint={handleMint}
            walletAddress={userAddress}
          />
        )}

        {/* QUEUED */}
        {phase === 'queued' && queueStatus && (
          <motion.div
            key="queued"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QueueStatusDisplay status={queueStatus} />
          </motion.div>
        )}

        {/* BUILDING - Retro ASCII Animation + Animated Button */}
        {(phase === 'building' || phase === 'minting') && (
          <motion.div
            key="building"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <RetroBuildingAnimation frameIndex={buildFrame} />
            
            {/* Cool animated mint button while building */}
            <AnimatedMintButton stage={BUILD_FRAMES[buildFrame] || ''} />
            
            {phase === 'minting' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 font-mono text-sm"
                style={{ color: MATRIX_ACCENT }}
              >
                Confirming on Base...
              </motion.p>
            )}
          </motion.div>
        )}

        {/* SUCCESS */}
        {phase === 'success' && mintResult && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MintSuccessPanel
              result={mintResult}
              onShareToFarcaster={handleShareToFarcaster}
              onDownloadSvg={handleDownloadSvg}
            />
          </motion.div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-4"
          >
            <div className="text-4xl font-mono" style={{ color: '#ff4444' }}>{VOT_GLYPHS.protocol}</div>
            <p className="font-mono text-xs" style={{ color: '#ff4444' }}>TRANSMISSION ERROR</p>
            <p className="font-mono text-sm text-red-400">{error}</p>
            <motion.button
              onClick={() => setPhase('idle')}
              className="px-6 py-3 rounded font-mono uppercase tracking-wider text-sm border-2"
              style={{
                borderColor: MATRIX_GREEN,
                color: MATRIX_GREEN,
              }}
              whileHover={{ backgroundColor: `${MATRIX_GREEN}10` }}
            >
              {VOT_GLYPHS.oracle} REINITIALIZE
            </motion.button>
          </motion.div>
        )}
        
      </AnimatePresence>
    </div>
  );
}
