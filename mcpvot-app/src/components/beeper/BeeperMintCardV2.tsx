'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    BEEPER MINT CARD V2 - ENHANCED UI/UX                       ║
 * ║                                                                               ║
 * ║  Features:                                                                    ║
 * ║  ✅ Retro terminal aesthetic with bright matrix green                         ║
 * ║  ✅ VOT Sumerian hieroglyphics language (no emojis)                           ║
 * ║  ✅ Clear identity sections (Basename, Farcaster, Wallet)                     ║
 * ║  ✅ On-chain badge indicator                                                   ║
 * ║  ✅ Post-mint: Download SVG, OpenSea link, View on BaseScan                   ║
 * ║  ✅ Standards display (ERC-1155, IPFS, ERC-4804, VRF)                         ║
 * ║  ✅ Animated pixel Beeper dino                                                 ║
 * ║  ✅ Traits counter                                                             ║
 * ║  ✅ Gasless experience indicator                                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { useX402 } from '@/hooks/useX402';
import { useFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useAccount, useBalance, useWalletClient } from 'wagmi';

// USDC contract on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const MINT_PRICE_USDC = '250000'; // $0.25 in atomic units (6 decimals)
const MINT_PRICE_DISPLAY = '$0.25';

// =============================================================================
// VOT HIEROGLYPHICS - SUMERIAN CUNEIFORM LANGUAGE
// =============================================================================

const VOT_GLYPHS = {
  // Rarity glyphs
  DINGIR: '𒇻',   // NODE - 45%
  DISH: '𒁹',     // VALIDATOR - 25%
  TA: '𒋼',       // STAKER - 15%
  AM: '𒄠',       // WHALE - 8%
  AN: '𒀭',       // OG - 4%
  KUR: '𒆳',      // GENESIS - 2%
  U: '𒌋',        // ZZZ - 0.5%
  MUL: '𒀯',      // FOMO - 0.3%
  LA: '𒆷',       // GM - 0.15%
  LUGAL: '𒈗',    // x402 - 0.05% LEGENDARY
  
  // UI glyphs
  CHAIN: '⟁',     // On-chain indicator
  VERIFY: '◈',    // Verified
  SIGNAL: '⚡',   // Gasless/electric
  ARROW: '►',     // Action
  DOWNLOAD: '⬇',  // Download
  EXTERNAL: '↗',  // External link
  DOT: '•',       // Separator dot
};

// =============================================================================
// CONSTANTS - BRIGHT MATRIX GREEN PALETTE  
// =============================================================================

const MATRIX_GREEN = '#77FE80';
const MATRIX_BRIGHT = '#88FF99';
const MATRIX_ACCENT = '#5DE066';
const MATRIX_DIM = '#3a5a3a';
const MATRIX_BG = '#050505';
const MATRIX_BG_LIGHT = '#0a140a';
const PURPLE_ACCENT = '#8A63D2';
const CYAN_ACCENT = '#00FFCC';

// Contract address
const BEEPER_CONTRACT = process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9';
const OPENSEA_BASE_URL = 'https://opensea.io/assets/base';

// =============================================================================
// TYPES
// =============================================================================

interface UserIdentity {
  address: string;
  basename?: string;
  ensName?: string;
  // ENS Text Records
  ensAvatar?: string;
  ensUrl?: string;
  ensTwitter?: string;
  ensGithub?: string;
  ensDescription?: string;
  // Farcaster Data
  farcasterUsername?: string;
  farcasterFid?: number;
  farcasterPfp?: string;
  farcasterDisplayName?: string;
  farcasterBio?: string;
  farcasterFollowers?: number;
  farcasterFollowing?: number;
  // Convenience flags
  hasEns?: boolean;
  hasBasename?: boolean;
  hasFarcaster?: boolean;
}

interface MintCardProps {
  onMintStart?: () => void;
  onMintComplete?: (result: MintResult) => void;
  className?: string;
}

interface MintResult {
  tokenId: number;
  rarity: string;
  txHash: string;
  svgCid: string;
  metadataCid?: string;
}

// Extended result type for x402 payment flow
interface MintPaymentResult {
  success: boolean;
  tokenId?: number;
  rarity?: string;
  txHash?: string;
  svgCid?: string;
  receipt?: {
    id: string;
    payer: string;
    usdAmount: number;
  };
}

// =============================================================================
// ANIMATED PIXEL BEEPER ICON (Kept for future use)
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _PixelBeeperIcon({ size = 48, animated = true }: { size?: number; animated?: boolean }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ imageRendering: 'pixelated' }}
      animate={animated ? {
        y: [0, -2, 0],
        filter: [
          `drop-shadow(0 0 6px ${MATRIX_GREEN})`,
          `drop-shadow(0 0 12px ${MATRIX_BRIGHT})`,
          `drop-shadow(0 0 6px ${MATRIX_GREEN})`,
        ],
      } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {/* Pixel art Beeper dino - bright matrix green */}
      <rect x="8" y="4" width="16" height="4" fill={MATRIX_BRIGHT} />
      <rect x="4" y="8" width="24" height="4" fill={MATRIX_GREEN} />
      <rect x="4" y="12" width="4" height="4" fill={MATRIX_GREEN} />
      <rect x="12" y="12" width="12" height="4" fill={MATRIX_GREEN} />
      <rect x="8" y="12" width="4" height="4" fill="#000" /> {/* Eye */}
      <rect x="4" y="16" width="20" height="4" fill={MATRIX_GREEN} />
      <rect x="8" y="20" width="8" height="4" fill={MATRIX_GREEN} />
      <rect x="20" y="16" width="8" height="4" fill={MATRIX_BRIGHT} /> {/* Jaw - brighter */}
      <rect x="8" y="24" width="4" height="4" fill={MATRIX_GREEN} />
      <rect x="16" y="24" width="4" height="4" fill={MATRIX_GREEN} />
    </motion.svg>
  );
}

// =============================================================================
// STANDARDS BADGES - x402 V2 Style
// =============================================================================

function StandardsBadges() {
  const standards = [
    { label: 'ERC-1155', color: MATRIX_GREEN, glyph: '◆' },
    { label: 'IPFS', color: MATRIX_BRIGHT, glyph: '◇' },
    { label: 'ERC-4804', color: MATRIX_GREEN, glyph: '◈' },
    { label: 'VRF', color: MATRIX_BRIGHT, glyph: '⟁' },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
      {standards.map((std, i) => (
        <motion.span
          key={std.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="relative px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[8px] sm:text-[10px] font-mono uppercase tracking-wider overflow-hidden"
          style={{
            backgroundColor: MATRIX_BG,
            border: `1px solid ${std.color}50`,
            color: std.color,
          }}
          whileHover={{ 
            borderColor: std.color,
            boxShadow: `0 0 12px ${std.color}40`,
          }}
        >
          {/* Subtle background pulse */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: std.color }}
            animate={{ opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          />
          <span className="relative z-10 flex items-center gap-0.5 sm:gap-1">
            <span className="text-[7px] sm:text-[8px]">{std.glyph}</span>
            {std.label}
          </span>
        </motion.span>
      ))}
    </div>
  );
}

// =============================================================================
// RETRO TERMINAL EXPLANATION - x402 V2 VOT Facilitator with TYPEWRITER EFFECT
// =============================================================================

function TypewriterText({ text, delay = 0, speed = 30 }: { text: string; delay?: number; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let charIndex = 0;
    
    const startTyping = () => {
      if (charIndex < text.length) {
        setDisplayedText(text.slice(0, charIndex + 1));
        charIndex++;
        timeout = setTimeout(startTyping, speed);
      } else {
        setIsComplete(true);
      }
    };
    
    // Start after delay
    const delayTimeout = setTimeout(startTyping, delay * 1000);
    
    return () => {
      clearTimeout(delayTimeout);
      clearTimeout(timeout);
    };
  }, [text, delay, speed]);
  
  return (
    <span>
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ color: MATRIX_BRIGHT }}
        >
          █
        </motion.span>
      )}
    </span>
  );
}

function TerminalExplanation() {
  const lines = [
    { text: '> INITIALIZING x402 V2 VOT FACILITATOR...', delay: 0, speed: 20 },
    { text: '> PROTOCOL: GASLESS MINT VIA USDC PAYMENT', delay: 1.8, speed: 20 },
    { text: '> MINT PRICE: $0.25 USDC', delay: 3.4, speed: 25 },
    { text: '> REWARD: 69,420 VOT + ERC-1155 NFT', delay: 4.6, speed: 20 },
    { text: '> VRF RARITY: 10 TIERS (X402 0.05% → NODE 45%)', delay: 6.0, speed: 18 },
    { text: '> IPFS: SELF-HOSTED DECENTRALIZED STORAGE', delay: 7.8, speed: 22 },
    { text: '> ON-CHAIN: BASE L2 + ERC-4804 WEB3 URL', delay: 9.4, speed: 20 },
    { text: '> FIP-2 BONUS: +10,000 VOT (SHARE+FOLLOW)', delay: 11.0, speed: 22 },
    { text: '> STATUS: READY_', delay: 12.8, speed: 35 },
  ];

  return (
    <motion.div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: `${MATRIX_GREEN}40`,
        backgroundColor: '#020502',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Terminal Header */}
      <div 
        className="px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2 border-b"
        style={{ 
          borderColor: `${MATRIX_GREEN}30`,
          backgroundColor: '#0a0f0a',
        }}
      >
        <div className="flex gap-1 sm:gap-1.5">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ backgroundColor: '#ff5f56' }} />
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ backgroundColor: '#ffbd2e' }} />
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ backgroundColor: MATRIX_GREEN }} />
        </div>
        <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider" style={{ color: MATRIX_DIM }}>
          x402_vot_facilitator.sh
        </span>
      </div>
      
      {/* Terminal Content with Typewriter Effect */}
      <div className="p-2 sm:p-3 space-y-0.5 sm:space-y-1 min-h-[180px] sm:min-h-[200px]">
        {lines.map((line, i) => (
          <div
            key={i}
            className="font-mono text-[9px] sm:text-[10px] leading-tight sm:leading-normal"
            style={{ color: i === lines.length - 1 ? MATRIX_BRIGHT : MATRIX_GREEN }}
          >
            <TypewriterText text={line.text} delay={line.delay} speed={line.speed} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// =============================================================================
// VITALIK PREVIEW BANNER - Real NFT Preview using actual banner generator
// Shows exactly what a minted NFT looks like using vitalik.eth as example
// =============================================================================

function VitalikPreviewBanner() {
  return (
    <motion.div
      className="rounded-xl overflow-hidden border-2"
      style={{ 
        borderColor: `${MATRIX_GREEN}60`,
        backgroundColor: '#060606',
        boxShadow: `0 0 30px ${MATRIX_GREEN}20`,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Real SVG Preview from API - Full Width */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src="/api/beeper/preview?user=vitalik&rarity=node"
        alt="BEEPER NFT Preview - vitalik.eth"
        className="w-full h-auto"
        style={{ 
          display: 'block',
          minHeight: '80px',
        }}
      />
    </motion.div>
  );
}

// =============================================================================
// IDENTITY SECTION - Uses VOT hieroglyphics
// =============================================================================

function IdentitySection({ 
  label, 
  value, 
  glyph, 
  color = MATRIX_GREEN,
  link,
  verified = false 
}: { 
  label: string; 
  value: string; 
  glyph: string;
  color?: string;
  link?: string;
  verified?: boolean;
}) {
  const content = (
    <div 
      className="p-3 rounded-lg border transition-all hover:border-opacity-80"
      style={{ 
        borderColor: `${color}40`,
        backgroundColor: MATRIX_BG_LIGHT,
        boxShadow: `inset 0 0 20px ${color}08`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: MATRIX_DIM }}>
          {label}
        </span>
        {verified && (
          <span className="text-xs" style={{ color: MATRIX_BRIGHT }}>{VOT_GLYPHS.VERIFY}</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xl" style={{ color, textShadow: `0 0 8px ${color}` }}>{glyph}</span>
        <span 
          className="font-mono text-sm truncate"
          style={{ color: MATRIX_BRIGHT }}
        >
          {value}
        </span>
        {link && (
          <span className="text-xs ml-auto" style={{ color: MATRIX_DIM }}>{VOT_GLYPHS.EXTERNAL}</span>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90">
        {content}
      </a>
    );
  }

  return content;
}

// =============================================================================
// TRAITS COUNTER - Uses VOT hieroglyphics dots
// =============================================================================

function TraitsCounter({ active, total }: { active: number; total: number }) {
  return (
    <div 
      className="p-3 rounded-lg border"
      style={{ 
        borderColor: `${MATRIX_GREEN}40`,
        backgroundColor: MATRIX_BG_LIGHT,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: MATRIX_DIM }}>
          TRAITS
        </span>
        <span className="font-mono text-sm" style={{ color: MATRIX_BRIGHT }}>
          {active}/{total} Active
        </span>
      </div>
      {/* Trait glyphs */}
      <div className="flex gap-2 mt-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{
              backgroundColor: i < active ? `${MATRIX_GREEN}30` : `${MATRIX_DIM}20`,
              border: `1px solid ${i < active ? MATRIX_GREEN : MATRIX_DIM}`,
              boxShadow: i < active ? `0 0 8px ${MATRIX_GREEN}40` : 'none',
            }}
          >
            <span style={{ color: i < active ? MATRIX_BRIGHT : MATRIX_DIM, fontSize: '10px' }}>
              {i < active ? VOT_GLYPHS.DISH : '·'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// PRICE/REWARD DISPLAY - x402 V2 Style with Animations
// =============================================================================

function PriceRewardDisplay() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Price Card */}
      <motion.div 
        className="relative p-4 rounded-xl border text-center overflow-hidden"
        style={{ 
          borderColor: `${CYAN_ACCENT}50`,
          backgroundColor: MATRIX_BG,
        }}
        whileHover={{ borderColor: CYAN_ACCENT, boxShadow: `0 0 30px ${CYAN_ACCENT}30` }}
      >
        {/* Background pulse */}
        <motion.div
          className="absolute inset-0"
          style={{ backgroundColor: CYAN_ACCENT }}
          animate={{ opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Corner dot */}
        <motion.div
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{ backgroundColor: CYAN_ACCENT }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        <div className="relative z-10">
          <div className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: MATRIX_DIM }}>
            ◇ PRICE
          </div>
          <motion.div 
            className="font-mono text-3xl font-bold"
            style={{ color: CYAN_ACCENT }}
            animate={{ textShadow: [`0 0 10px ${CYAN_ACCENT}40`, `0 0 20px ${CYAN_ACCENT}60`, `0 0 10px ${CYAN_ACCENT}40`] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            $0.25
          </motion.div>
          <div className="font-mono text-xs mt-1 flex items-center justify-center gap-1" style={{ color: CYAN_ACCENT }}>
            <span>USDC</span>
            <span className="opacity-50">•</span>
            <span className="opacity-70">BASE</span>
          </div>
        </div>
      </motion.div>

      {/* Reward Card */}
      <motion.div 
        className="relative p-4 rounded-xl border text-center overflow-hidden"
        style={{ 
          borderColor: `${MATRIX_GREEN}50`,
          backgroundColor: MATRIX_BG,
        }}
        whileHover={{ borderColor: MATRIX_GREEN, boxShadow: `0 0 30px ${MATRIX_GREEN}30` }}
      >
        {/* Background pulse */}
        <motion.div
          className="absolute inset-0"
          style={{ backgroundColor: MATRIX_GREEN }}
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />

        {/* Animated sparkle */}
        <motion.div
          className="absolute top-2 right-2"
          animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ color: MATRIX_BRIGHT, fontSize: '12px' }}
        >
          {VOT_GLYPHS.MUL}
        </motion.div>

        <div className="relative z-10">
          <div className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: MATRIX_DIM }}>
            ◈ REWARD
          </div>
          <motion.div 
            className="font-mono text-3xl font-bold"
            style={{ color: MATRIX_BRIGHT }}
            animate={{ textShadow: [`0 0 10px ${MATRIX_GREEN}40`, `0 0 25px ${MATRIX_GREEN}70`, `0 0 10px ${MATRIX_GREEN}40`] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            69,420
          </motion.div>
          <div className="font-mono text-xs mt-1 flex items-center justify-center gap-1" style={{ color: MATRIX_GREEN }}>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {VOT_GLYPHS.DINGIR}
            </motion.span>
            <span>VOT</span>
            <span className="opacity-50">+</span>
            <span className="opacity-70">NFT</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// GASLESS BADGE - x402 V2 Facilitator Style (MATRIX GREEN)
// =============================================================================

function GaslessBadge() {
  return (
    <motion.div
      className="relative flex items-center justify-center gap-3 py-2.5 px-5 rounded-full overflow-hidden"
      style={{
        backgroundColor: MATRIX_BG,
        border: `1px solid ${MATRIX_GREEN}60`,
      }}
      animate={{
        boxShadow: [
          `0 0 15px ${MATRIX_GREEN}20, inset 0 0 20px ${MATRIX_GREEN}10`,
          `0 0 25px ${MATRIX_GREEN}40, inset 0 0 30px ${MATRIX_GREEN}20`,
          `0 0 15px ${MATRIX_GREEN}20, inset 0 0 20px ${MATRIX_GREEN}10`,
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Background gradient sweep */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${MATRIX_GREEN}20, transparent)`,
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* Lightning bolt with pulse */}
      <motion.span 
        className="text-lg relative z-10"
        style={{ color: MATRIX_BRIGHT }}
        animate={{ 
          scale: [1, 1.15, 1],
          textShadow: [`0 0 5px ${MATRIX_GREEN}`, `0 0 15px ${MATRIX_GREEN}`, `0 0 5px ${MATRIX_GREEN}`],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {VOT_GLYPHS.SIGNAL}
      </motion.span>

      <span className="font-mono text-xs uppercase tracking-widest relative z-10" style={{ color: MATRIX_BRIGHT }}>
        GASLESS
      </span>

      {/* Dot separator */}
      <motion.span
        className="w-1.5 h-1.5 rounded-full relative z-10"
        style={{ backgroundColor: MATRIX_GREEN }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      <span className="font-mono text-[10px] uppercase tracking-wider relative z-10 opacity-70" style={{ color: MATRIX_GREEN }}>
        x402 V2
      </span>
    </motion.div>
  );
}

// =============================================================================
// ON-CHAIN BADGE - x402 V2 Style - REPOSITIONED FOR MOBILE
// =============================================================================

function OnChainBadge() {
  return (
    <motion.div
      className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg overflow-hidden z-20"
      style={{
        backgroundColor: MATRIX_BG,
        border: `1px solid ${MATRIX_GREEN}60`,
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ boxShadow: `0 0 15px ${MATRIX_GREEN}40` }}
    >
      {/* Scanning line */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${MATRIX_GREEN}15, transparent)`,
          width: '50%',
        }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      {/* Chain glyph with pulse */}
      <motion.span
        className="text-xs sm:text-sm"
        style={{ color: MATRIX_BRIGHT }}
        animate={{ 
          opacity: [1, 0.6, 1],
          textShadow: [`0 0 5px ${MATRIX_GREEN}`, `0 0 12px ${MATRIX_GREEN}`, `0 0 5px ${MATRIX_GREEN}`],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {VOT_GLYPHS.CHAIN}
      </motion.span>
      
      <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider relative z-10" style={{ color: MATRIX_BRIGHT }}>
        ON-CHAIN
      </span>

      {/* Status dot */}
      <motion.div
        className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
        style={{ backgroundColor: MATRIX_GREEN }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.div>
  );
}

// =============================================================================
// MINT BUTTON - x402 V2 FACILITATOR STYLE WITH COOL ANIMATIONS
// =============================================================================

// Error/Warning color
const ERROR_RED = '#FF4444';

function MintButton({ 
  onClick, 
  disabled, 
  loading,
  paymentStep = 'idle',
  insufficientBalance = false,
}: { 
  onClick: () => void; 
  disabled: boolean;
  loading: boolean;
  paymentStep?: 'idle' | 'signing' | 'minting';
  insufficientBalance?: boolean;
}) {
  // Use red styling when insufficient balance
  const isError = insufficientBalance && !loading;
  const isSigning = paymentStep === 'signing';
  const primaryColor = isError ? ERROR_RED : MATRIX_GREEN;
  const brightColor = isError ? '#FF6666' : MATRIX_BRIGHT;
  
  return (
    <div className="relative">
      {/* Outer glow ring - only when enabled and has enough balance */}
      {!disabled && !loading && !isError && (
        <motion.div
          className="absolute -inset-1 rounded-xl opacity-50"
          style={{
            background: `linear-gradient(90deg, ${MATRIX_GREEN}00, ${MATRIX_GREEN}40, ${MATRIX_GREEN}00)`,
          }}
          animate={{
            background: [
              `linear-gradient(90deg, ${MATRIX_GREEN}00, ${MATRIX_GREEN}40, ${MATRIX_GREEN}00)`,
              `linear-gradient(90deg, ${MATRIX_GREEN}40, ${MATRIX_GREEN}00, ${MATRIX_GREEN}40)`,
              `linear-gradient(90deg, ${MATRIX_GREEN}00, ${MATRIX_GREEN}40, ${MATRIX_GREEN}00)`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      {/* Red pulse glow when insufficient balance */}
      {isError && (
        <motion.div
          className="absolute -inset-1 rounded-xl"
          style={{
            background: `${ERROR_RED}20`,
            boxShadow: `0 0 20px ${ERROR_RED}40`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <motion.button
        onClick={onClick}
        disabled={disabled || loading || isError}
        className="relative w-full py-5 rounded-xl font-mono uppercase tracking-wider text-sm font-bold overflow-hidden disabled:cursor-not-allowed"
        style={{
          border: `2px solid ${isError ? ERROR_RED : (disabled ? MATRIX_DIM : MATRIX_GREEN)}`,
          backgroundColor: MATRIX_BG,
          color: isError ? ERROR_RED : brightColor,
          opacity: disabled && !isError ? 0.4 : 1,
        }}
        whileHover={!disabled && !loading && !isError ? {
          boxShadow: `0 0 40px ${MATRIX_GREEN}60, inset 0 0 30px ${MATRIX_GREEN}20`,
        } : {}}
        whileTap={!disabled && !loading && !isError ? { scale: 0.98 } : {}}
      >
        {/* Animated background gradient */}
        {!disabled && !isError && (
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${MATRIX_GREEN}10 0%, transparent 50%, ${MATRIX_GREEN}10 100%)`,
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        {/* Red background for insufficient balance */}
        {isError && (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${ERROR_RED}15 0%, ${ERROR_RED}05 50%, ${ERROR_RED}15 100%)`,
            }}
          />
        )}

        {/* Scan line effect */}
        {!disabled && !loading && !isError && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${MATRIX_GREEN}15 50%, transparent 100%)`,
              height: '30%',
            }}
            animate={{
              top: ['-30%', '130%'],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: primaryColor }} />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: primaryColor }} />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: primaryColor }} />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: primaryColor }} />

        {/* Button content */}
        <div className="relative z-10">
          {loading && isSigning ? (
            // SIGNING USDC PERMIT - wallet popup state
            <span className="flex items-center justify-center gap-3">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ fontSize: '20px', color: CYAN_ACCENT }}
              >
                {VOT_GLYPHS.VERIFY}
              </motion.span>
              <span className="flex flex-col items-center">
                <span className="text-base" style={{ color: CYAN_ACCENT }}>SIGN USDC PERMIT</span>
                <span className="text-[10px] opacity-70">Approve $0.25 in wallet</span>
              </span>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: '18px', color: CYAN_ACCENT }}
              >
                ⟳
              </motion.span>
            </span>
          ) : loading ? (
            <span className="flex items-center justify-center gap-3">
              {/* Spinning glyphs */}
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: '20px' }}
              >
                {VOT_GLYPHS.TA}
              </motion.span>
              <span className="text-base">MINTING</span>
              {/* Animated dots */}
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                    style={{ color: MATRIX_GREEN }}
                  >
                    ·
                  </motion.span>
                ))}
              </span>
            </span>
          ) : isError ? (
            // Insufficient balance state - RED
            <span className="flex items-center justify-center gap-4">
              {/* Warning symbol */}
              <motion.span
                style={{ fontSize: '22px', color: ERROR_RED }}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {VOT_GLYPHS.MUL}
              </motion.span>
              
              {/* Main text */}
              <span className="flex flex-col items-center">
                <span className="text-base tracking-widest" style={{ textShadow: `0 0 10px ${ERROR_RED}` }}>
                  NOT ENOUGH USDC
                </span>
                <span className="text-xs tracking-wider opacity-80">NEED $0.25 USDC TO MINT</span>
              </span>
              
              {/* Warning symbol */}
              <motion.span
                style={{ fontSize: '22px', color: ERROR_RED }}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              >
                {VOT_GLYPHS.MUL}
              </motion.span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-4">
              {/* Left glyph with pulse */}
              <motion.span
                style={{ fontSize: '22px', color: MATRIX_BRIGHT }}
                animate={!disabled ? {
                  textShadow: [
                    `0 0 10px ${MATRIX_GREEN}`,
                    `0 0 25px ${MATRIX_GREEN}`,
                    `0 0 10px ${MATRIX_GREEN}`,
                  ],
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {VOT_GLYPHS.DINGIR}
              </motion.span>
              
              {/* Main text */}
              <span className="flex flex-col items-center">
                <span className="text-base tracking-widest" style={{ textShadow: `0 0 15px ${MATRIX_GREEN}` }}>
                  MINT BEEPER NFT
                </span>
                <span className="text-[10px] tracking-wider opacity-70">x402 V2 FACILITATOR</span>
              </span>
              
              {/* Right glyph with pulse */}
              <motion.span
                style={{ fontSize: '22px', color: MATRIX_BRIGHT }}
                animate={!disabled ? {
                  textShadow: [
                    `0 0 10px ${MATRIX_GREEN}`,
                    `0 0 25px ${MATRIX_GREEN}`,
                    `0 0 10px ${MATRIX_GREEN}`,
                  ],
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
              >
                {VOT_GLYPHS.DINGIR}
              </motion.span>
            </span>
          )}
        </div>

        {/* Bottom accent line */}
        {!disabled && !isError && (
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
            style={{ backgroundColor: MATRIX_GREEN }}
            animate={{
              width: ['20%', '80%', '20%'],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>
    </div>
  );
}

// =============================================================================
// POST-MINT SUCCESS CARD - Shows NFT with download and OpenSea buttons
// =============================================================================

function MintSuccessCard({ 
  result, 
  onReset 
}: { 
  result: MintResult; 
  onReset: () => void;
}) {
  const handleDownloadSvg = async () => {
    try {
      const svgUrl = `https://ipfs.io/ipfs/${result.svgCid}`;
      const response = await fetch(svgUrl);
      const svgContent = await response.text();
      
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beeper-nft-${result.tokenId}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download SVG:', err);
    }
  };

  const openSeaUrl = `${OPENSEA_BASE_URL}/${BEEPER_CONTRACT}/${result.tokenId}`;
  const baseScanUrl = `https://basescan.org/tx/${result.txHash}`;

  // Get rarity glyph
  const rarityGlyph = {
    node: VOT_GLYPHS.DINGIR,
    validator: VOT_GLYPHS.DISH,
    staker: VOT_GLYPHS.TA,
    whale: VOT_GLYPHS.AM,
    og: VOT_GLYPHS.AN,
    genesis: VOT_GLYPHS.KUR,
    zzz: VOT_GLYPHS.U,
    fomo: VOT_GLYPHS.MUL,
    gm: VOT_GLYPHS.LA,
    x402: VOT_GLYPHS.LUGAL,
  }[result.rarity] || VOT_GLYPHS.DINGIR;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      {/* Success header */}
      <div className="text-center space-y-2">
        <motion.div
          className="text-4xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ color: MATRIX_BRIGHT, textShadow: `0 0 20px ${MATRIX_GREEN}` }}
        >
          {rarityGlyph}
        </motion.div>
        <h3 className="font-mono text-xl font-bold" style={{ color: MATRIX_BRIGHT }}>
          MINTED SUCCESSFULLY
        </h3>
        <div className="font-mono text-sm" style={{ color: MATRIX_ACCENT }}>
          Token #{result.tokenId} • {result.rarity.toUpperCase()}
        </div>
      </div>

      {/* NFT Preview */}
      <div 
        className="rounded-lg overflow-hidden border"
        style={{ borderColor: `${MATRIX_GREEN}40` }}
      >
        <Image 
          src={`https://ipfs.io/ipfs/${result.svgCid}`}
          alt={`Beeper NFT #${result.tokenId}`}
          width={400}
          height={240}
          className="w-full h-auto"
          unoptimized
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Download SVG */}
        <motion.button
          onClick={handleDownloadSvg}
          className="py-3 px-4 rounded-lg font-mono text-xs uppercase tracking-wider border flex items-center justify-center gap-2"
          style={{
            borderColor: `${CYAN_ACCENT}50`,
            backgroundColor: `${CYAN_ACCENT}15`,
            color: CYAN_ACCENT,
          }}
          whileHover={{ backgroundColor: `${CYAN_ACCENT}25` }}
        >
          <span>{VOT_GLYPHS.DOWNLOAD}</span>
          <span>Download SVG</span>
        </motion.button>

        {/* OpenSea - with note about indexing */}
        <motion.a
          href={openSeaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-3 px-4 rounded-lg font-mono text-xs uppercase tracking-wider border flex items-center justify-center gap-2"
          style={{
            borderColor: '#2081E2',
            backgroundColor: 'rgba(32, 129, 226, 0.15)',
            color: '#2081E2',
          }}
          whileHover={{ backgroundColor: 'rgba(32, 129, 226, 0.25)' }}
          title="View on OpenSea (may take 1-5 min to index after mint)"
        >
          <span style={{ fontSize: '14px' }}>◊</span>
          <span>OpenSea</span>
          <span>{VOT_GLYPHS.EXTERNAL}</span>
        </motion.a>
      </div>

      {/* OpenSea Indexing Note */}
      <div 
        className="text-center py-2 px-3 rounded-lg"
        style={{ backgroundColor: `${MATRIX_GREEN}08`, border: `1px solid ${MATRIX_GREEN}15` }}
      >
        <span className="font-mono text-[10px]" style={{ color: MATRIX_DIM }}>
          {VOT_GLYPHS.TA} OpenSea may take 1-5 minutes to index new NFTs
        </span>
      </div>

      {/* View on BaseScan */}
      <a
        href={baseScanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-2 text-center font-mono text-xs hover:underline"
        style={{ color: MATRIX_DIM }}
      >
        View Transaction on BaseScan {VOT_GLYPHS.EXTERNAL}
      </a>

      {/* FIP-2 Share Bonus Section - ENHANCED */}
      <motion.div
        className="p-4 rounded-xl border space-y-4"
        style={{
          borderColor: `${PURPLE_ACCENT}50`,
          backgroundColor: `${PURPLE_ACCENT}08`,
          boxShadow: `0 0 20px ${PURPLE_ACCENT}15`,
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Header with animated glyph */}
        <div className="text-center space-y-2">
          <motion.div 
            className="flex items-center justify-center gap-3"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.span 
              style={{ color: MATRIX_BRIGHT, fontSize: '20px' }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {VOT_GLYPHS.AN}
            </motion.span>
            <span className="font-mono text-lg font-bold tracking-wide" style={{ color: '#fff' }}>
              CLAIM +10,000 VOT
            </span>
            <motion.span 
              style={{ color: MATRIX_BRIGHT, fontSize: '20px' }}
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {VOT_GLYPHS.AN}
            </motion.span>
          </motion.div>
          <div className="flex items-center justify-center gap-2">
            <div 
              className="px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider"
              style={{ backgroundColor: `${PURPLE_ACCENT}30`, color: PURPLE_ACCENT }}
            >
              FIP-2 PROTOCOL
            </div>
            <span className="font-mono text-[10px]" style={{ color: MATRIX_DIM }}>
              Share + Follow = Bonus VOT
            </span>
          </div>
        </div>

        {/* Bonus Breakdown */}
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${MATRIX_GREEN}08`, border: `1px solid ${MATRIX_GREEN}20` }}
        >
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="font-mono text-xs" style={{ color: MATRIX_DIM }}>SHARE CAST</div>
              <div className="font-mono text-lg font-bold" style={{ color: MATRIX_BRIGHT }}>+5,000</div>
              <div className="font-mono text-[10px]" style={{ color: MATRIX_ACCENT }}>VOT</div>
            </div>
            <div>
              <div className="font-mono text-xs" style={{ color: MATRIX_DIM }}>FOLLOW @mcpvot</div>
              <div className="font-mono text-lg font-bold" style={{ color: MATRIX_BRIGHT }}>+5,000</div>
              <div className="font-mono text-[10px]" style={{ color: MATRIX_ACCENT }}>VOT</div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Improved */}
        <div className="grid grid-cols-2 gap-3">
          {/* Share on Farcaster - FIP-2 Compliant */}
          <motion.a
            href={`https://warpcast.com/~/compose?text=${encodeURIComponent(
              `${VOT_GLYPHS.AM} Just minted BEEPER #${result.tokenId} on @mcpvot!\n\n${VOT_GLYPHS.DISH} $0.25 → 69,420 VOT\n${VOT_GLYPHS.LA} Rarity: ${result.rarity.toUpperCase()}\n\nMint yours:`
            )}&embeds[]=${encodeURIComponent(`https://mcpvot.xyz/beeper/${result.tokenId}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 rounded-lg font-mono text-xs uppercase border flex items-center justify-center gap-2 transition-all"
            style={{
              borderColor: PURPLE_ACCENT,
              backgroundColor: `${PURPLE_ACCENT}30`,
              color: '#fff',
            }}
            whileHover={{ scale: 1.03, backgroundColor: `${PURPLE_ACCENT}50`, boxShadow: `0 0 15px ${PURPLE_ACCENT}40` }}
            whileTap={{ scale: 0.97 }}
          >
            <span style={{ fontSize: '16px' }}>{VOT_GLYPHS.AN}</span>
            <span className="font-bold">SHARE</span>
            <span className="opacity-70">+5K</span>
          </motion.a>

          {/* Follow @mcpvot */}
          <motion.a
            href="https://warpcast.com/mcpvot"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 rounded-lg font-mono text-xs uppercase border flex items-center justify-center gap-2 transition-all"
            style={{
              borderColor: PURPLE_ACCENT,
              backgroundColor: `${PURPLE_ACCENT}20`,
              color: PURPLE_ACCENT,
            }}
            whileHover={{ scale: 1.03, backgroundColor: `${PURPLE_ACCENT}35`, boxShadow: `0 0 15px ${PURPLE_ACCENT}30` }}
            whileTap={{ scale: 0.97 }}
          >
            <span style={{ fontSize: '16px' }}>👤</span>
            <span className="font-bold">FOLLOW</span>
            <span className="opacity-70">+5K</span>
          </motion.a>
        </div>

        {/* Footer Instruction */}
        <div className="text-center pt-1">
          <p className="font-mono text-[10px] tracking-wide" style={{ color: MATRIX_DIM }}>
            ✨ Complete both to unlock your bonus VOT ✨
          </p>
          <p className="font-mono text-[9px] mt-1" style={{ color: `${MATRIX_DIM}80` }}>
            Verified via Neynar API • Auto-sent to your wallet
          </p>
        </div>
      </motion.div>

      {/* Mint Another */}
      <motion.button
        onClick={onReset}
        className="w-full py-3 rounded-lg font-mono text-xs uppercase tracking-wider border"
        style={{
          borderColor: `${MATRIX_GREEN}40`,
          backgroundColor: `${MATRIX_GREEN}10`,
          color: MATRIX_GREEN,
        }}
        whileHover={{ backgroundColor: `${MATRIX_GREEN}20` }}
      >
        {VOT_GLYPHS.ARROW} Mint Another
      </motion.button>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function BeeperMintCardV2({ 
  onMintStart, 
  onMintComplete,
  className = '' 
}: MintCardProps) {
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'signing' | 'minting'>('idle');
  
  // Existing NFTs - for returning users
  const [existingNFTs, setExistingNFTs] = useState<Array<{
    tokenId: number;
    balance: number;
    uri?: string;
    rarity?: string;
    svgCid?: string;
  }>>([]);
  const [loadingExistingNFTs, setLoadingExistingNFTs] = useState(false);

  // Hooks
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { isInMiniApp, user: farcasterUser } = useFarcasterContext();
  
  // x402 payment hook for USDC signature
  const { initiatePayment, isProcessing: isPaymentProcessing, error: paymentError } = useX402(
    '/api/beeper/mint-with-payment',
    {
      onSuccess: (result) => {
        console.log('✅ Payment successful, mint complete:', result);
        if (result.receipt) {
          // Payment verified, now process the mint result
          setMintResult({
            tokenId: (result as MintPaymentResult).tokenId || 0,
            rarity: (result as MintPaymentResult).rarity || 'node',
            txHash: (result as MintPaymentResult).txHash || '',
            svgCid: (result as MintPaymentResult).svgCid || '',
          });
          setPaymentStep('idle');
          setMinting(false);
          onMintComplete?.({
            tokenId: (result as MintPaymentResult).tokenId || 0,
            rarity: (result as MintPaymentResult).rarity || 'node',
            txHash: (result as MintPaymentResult).txHash || '',
            svgCid: (result as MintPaymentResult).svgCid || '',
          });
        }
      },
      onError: (err) => {
        console.error('❌ Payment failed:', err);
        setError(err.message || 'Payment failed');
        setPaymentStep('idle');
        setMinting(false);
      },
      autoSign: true,
    }
  );
  
  // USDC Balance Check (Base USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
  const MINT_COST_USDC = 0.25; // $0.25 USDC required for mint
  
  const { data: usdcBalance } = useBalance({
    address: address,
    token: USDC_ADDRESS as `0x${string}`,
    chainId: 8453, // Base mainnet
  });
  
  // Check if user has enough USDC
  const hasEnoughUSDC = usdcBalance 
    ? parseFloat(usdcBalance.formatted) >= MINT_COST_USDC 
    : false;

  // Fetch identity data
  useEffect(() => {
    async function fetchIdentity() {
      if (!address && !farcasterUser) return;

      setLoading(true);
      try {
        const walletAddr = address || farcasterUser?.custody_address || '';
        const fid = farcasterUser?.fid;
        
        // Fetch enhanced identity data (ENS records, Basename, Farcaster)
        const queryParams = new URLSearchParams({ address: walletAddr });
        if (fid) queryParams.append('fid', String(fid));
        
        const res = await fetch(`/api/identity/resolve?${queryParams.toString()}`);
        const data = await res.json();

        setIdentity({
          address: walletAddr,
          // Basename
          basename: data.basename,
          // ENS data
          ensName: data.ensName,
          ensAvatar: data.ensAvatar,
          ensUrl: data.ensUrl,
          ensTwitter: data.ensTwitter,
          ensGithub: data.ensGithub,
          ensDescription: data.ensDescription,
          // Farcaster - prefer API data, fallback to context
          farcasterUsername: data.farcasterUsername || farcasterUser?.username,
          farcasterFid: data.farcasterFid || farcasterUser?.fid,
          farcasterPfp: data.farcasterPfp || farcasterUser?.pfp_url,
          farcasterDisplayName: data.farcasterDisplayName || farcasterUser?.display_name,
          farcasterBio: data.farcasterBio,
          farcasterFollowers: data.farcasterFollowers,
          farcasterFollowing: data.farcasterFollowing,
          // Convenience flags
          hasEns: data.hasEns,
          hasBasename: data.hasBasename,
          hasFarcaster: data.hasFarcaster,
        });
      } catch (err) {
        console.error('Failed to fetch identity:', err);
        setIdentity({
          address: address || farcasterUser?.custody_address || '',
          farcasterUsername: farcasterUser?.username,
          farcasterFid: farcasterUser?.fid,
          farcasterPfp: farcasterUser?.pfp_url,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchIdentity();
  }, [address, farcasterUser]);

  // Fetch existing NFTs for returning users
  useEffect(() => {
    async function fetchExistingNFTs() {
      if (!address) return;
      
      setLoadingExistingNFTs(true);
      try {
        const res = await fetch(`/api/beeper/user-nfts?address=${address}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tokens && data.tokens.length > 0) {
            setExistingNFTs(data.tokens);
          }
        }
      } catch (err) {
        console.error('Failed to fetch existing NFTs:', err);
      } finally {
        setLoadingExistingNFTs(false);
      }
    }

    fetchExistingNFTs();
  }, [address]);

  // Handle mint with USDC payment via x402 facilitator
  // Flow: 1) User signs USDC permit → 2) Facilitator pulls $0.25 USDC → 3) Mint NFT + send VOT
  const handleMint = useCallback(async () => {
    if (!identity?.address) return;
    if (!walletClient) {
      setError('Please connect your wallet');
      return;
    }
    if (!hasEnoughUSDC) {
      setError(`Insufficient USDC. Need ${MINT_PRICE_DISPLAY} USDC to mint.`);
      return;
    }

    setMinting(true);
    setError(null);
    setPaymentStep('signing');
    onMintStart?.();

    try {
      console.log('🎨 [BeeperMint] Starting mint with USDC payment...');
      console.log('💳 [BeeperMint] User:', identity.address);
      console.log('💰 [BeeperMint] USDC Balance:', usdcBalance?.formatted);
      
      // Use x402 payment flow - this will:
      // 1. Get 402 response with payment requirements
      // 2. Auto-sign USDC permit (triggers wallet popup!)
      // 3. Submit signed permit to facilitator
      // 4. Facilitator pulls USDC and mints NFT
      setPaymentStep('signing');
      
      await initiatePayment(
        MINT_PRICE_USDC, // $0.25 in atomic units
        identity.address
      );
      
      // Success is handled by onSuccess callback in useX402 hook
      // Error is handled by onError callback
      
    } catch (err) {
      console.error('❌ [BeeperMint] Mint failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Mint failed';
      
      // User-friendly error messages
      if (errorMsg.includes('rejected') || errorMsg.includes('denied')) {
        setError('Transaction cancelled. Please try again.');
      } else if (errorMsg.includes('insufficient')) {
        setError(`Insufficient USDC. Need ${MINT_PRICE_DISPLAY} to mint.`);
      } else {
        setError(errorMsg);
      }
      setMinting(false);
      setPaymentStep('idle');
    }
  }, [identity, walletClient, hasEnoughUSDC, usdcBalance, onMintStart, initiatePayment]);

  // Show payment error from x402 hook
  useEffect(() => {
    if (paymentError && !error) {
      setError(paymentError);
      setMinting(false);
      setPaymentStep('idle');
    }
  }, [paymentError, error]);

  // Reset to mint another
  const handleReset = () => {
    setMintResult(null);
    setError(null);
    setPaymentStep('idle');
  };

  // Format address for display
  const formatAddress = (addr: string) => 
    `${addr.slice(0, 10)}...${addr.slice(-8)}`;

  // Calculate active traits (now includes ENS records and Farcaster data)
  const getActiveTraits = () => {
    let count = 0;
    if (identity?.address) count++;        // Wallet
    if (identity?.basename) count++;       // Basename
    if (identity?.ensName) count++;        // ENS Name
    if (identity?.farcasterUsername) count++; // Farcaster
    if (identity?.ensUrl) count++;         // Website
    if (identity?.ensTwitter) count++;     // Twitter
    if (identity?.ensGithub) count++;      // GitHub
    return count;
  };

  const canMint = (isConnected || (isInMiniApp && farcasterUser)) && hasEnoughUSDC;

  // =========================================================================
  // EXISTING NFT GALLERY - For returning users to see their minted NFTs
  // =========================================================================
  const ExistingNFTGallery = () => {
    if (loadingExistingNFTs) {
      return (
        <div 
          className="p-4 rounded-xl border text-center"
          style={{ borderColor: `${MATRIX_GREEN}30`, backgroundColor: `${MATRIX_BG_LIGHT}` }}
        >
          <motion.div
            className="inline-block text-xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ color: MATRIX_GREEN }}
          >
            {VOT_GLYPHS.TA}
          </motion.div>
          <p className="font-mono text-xs mt-2" style={{ color: MATRIX_DIM }}>
            Loading your NFTs...
          </p>
        </div>
      );
    }

    if (existingNFTs.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-2">
          <span style={{ color: MATRIX_GREEN }}>{VOT_GLYPHS.VERIFY}</span>
          <span className="font-mono text-sm uppercase tracking-wider" style={{ color: MATRIX_BRIGHT }}>
            Your Collection ({existingNFTs.length})
          </span>
        </div>

        {/* NFT Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {existingNFTs.slice(0, 4).map((nft) => (
            <motion.div
              key={nft.tokenId}
              className="rounded-lg border overflow-hidden"
              style={{ 
                borderColor: `${MATRIX_GREEN}40`, 
                backgroundColor: `${MATRIX_BG}ee` 
              }}
              whileHover={{ 
                borderColor: MATRIX_GREEN,
                boxShadow: `0 0 15px ${MATRIX_GREEN}30`,
              }}
            >
              {/* NFT Image */}
              {nft.svgCid && (
                <div className="aspect-video relative">
                  <Image
                    src={`https://ipfs.io/ipfs/${nft.svgCid}`}
                    alt={`Beeper NFT #${nft.tokenId}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              
              {/* NFT Info */}
              <div className="p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs" style={{ color: MATRIX_BRIGHT }}>
                    #{nft.tokenId}
                  </span>
                  <span 
                    className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded"
                    style={{ 
                      backgroundColor: `${MATRIX_GREEN}20`, 
                      color: MATRIX_ACCENT 
                    }}
                  >
                    {nft.rarity || 'NODE'}
                  </span>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2">
                  <a
                    href={`${OPENSEA_BASE_URL}/${BEEPER_CONTRACT}/${nft.tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1 px-2 text-center font-mono text-[9px] uppercase rounded border"
                    style={{ 
                      borderColor: '#2081E2',
                      color: '#2081E2',
                      backgroundColor: 'rgba(32, 129, 226, 0.1)',
                    }}
                  >
                    OpenSea {VOT_GLYPHS.EXTERNAL}
                  </a>
                  {nft.svgCid && (
                    <a
                      href={`https://ipfs.io/ipfs/${nft.svgCid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1 px-2 text-center font-mono text-[9px] uppercase rounded border"
                      style={{ 
                        borderColor: `${CYAN_ACCENT}50`,
                        color: CYAN_ACCENT,
                        backgroundColor: `${CYAN_ACCENT}10`,
                      }}
                    >
                      {VOT_GLYPHS.DOWNLOAD}
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Show more link if more than 4 NFTs */}
        {existingNFTs.length > 4 && (
          <div className="text-center">
            <span className="font-mono text-[10px]" style={{ color: MATRIX_DIM }}>
              +{existingNFTs.length - 4} more NFTs in your wallet
            </span>
          </div>
        )}

        {/* Divider */}
        <div 
          className="h-px w-full my-4"
          style={{ background: `linear-gradient(90deg, transparent, ${MATRIX_GREEN}50, transparent)` }}
        />
      </motion.div>
    );
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        backgroundColor: MATRIX_BG,
        border: `2px solid ${MATRIX_GREEN}50`,
        boxShadow: `0 0 50px ${MATRIX_GREEN}20`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Bright scanline overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${MATRIX_BRIGHT} 2px, ${MATRIX_BRIGHT} 4px)`,
        }}
      />

      {/* On-chain badge */}
      <OnChainBadge />

      {/* Content - Responsive padding */}
      <div className="relative p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-5 lg:space-y-6">
        
        {/* Show success card if minted */}
        {mintResult ? (
          <MintSuccessCard result={mintResult} onReset={handleReset} />
        ) : (
          <>
            {/* Header - Clean layout without dino icon */}
            <div className="text-center space-y-3 pt-2">
              <div className="text-center">
                <div className="font-mono text-[10px] sm:text-xs" style={{ color: MATRIX_DIM }}>
                  mcpvot.eth
                </div>
                <h2 
                  className="font-mono text-xl sm:text-2xl font-bold tracking-wider flex items-center justify-center gap-2"
                  style={{ color: MATRIX_BRIGHT, textShadow: `0 0 10px ${MATRIX_GREEN}` }}
                >
                  <span className="text-base sm:text-lg">{VOT_GLYPHS.DINGIR}</span>
                  <span>BEEPER MACHINE</span>
                </h2>
                <div className="font-mono text-[10px] sm:text-xs" style={{ color: MATRIX_ACCENT }}>
                  x402 V2
                </div>
              </div>
              
              {/* Standards badges */}
              <StandardsBadges />
            </div>

            {/* Terminal Explanation - x402 V2 VOT Facilitator with Typewriter Effect */}
            <TerminalExplanation />

            {/* Existing NFT Gallery - Show returning user's NFTs */}
            <ExistingNFTGallery />

            {/* Vitalik Preview Banner - Shows example NFT */}
            <VitalikPreviewBanner />

            {/* Identity Sections */}
            {identity && (
              <div className="space-y-3">
                {/* Basename */}
                {identity.basename && (
                  <IdentitySection
                    label="BASENAME"
                    value={identity.basename}
                    glyph={VOT_GLYPHS.KUR}
                    color={CYAN_ACCENT}
                    verified
                  />
                )}

                {/* ENS Name */}
                {identity.ensName && (
                  <IdentitySection
                    label="ENS"
                    value={identity.ensName}
                    glyph={VOT_GLYPHS.AN}
                    color="#00ccff"
                    link={`https://app.ens.domains/${identity.ensName}`}
                    verified
                  />
                )}

                {/* Farcaster */}
                {identity.farcasterUsername && (
                  <IdentitySection
                    label={identity.farcasterFollowers ? `FARCASTER · ${identity.farcasterFollowers.toLocaleString()} followers` : 'FARCASTER'}
                    value={`@${identity.farcasterUsername}${identity.farcasterFid ? ` #${identity.farcasterFid}` : ''}`}
                    glyph={VOT_GLYPHS.MUL}
                    color={PURPLE_ACCENT}
                    link={`https://warpcast.com/${identity.farcasterUsername}`}
                    verified
                  />
                )}

                {/* Website from ENS URL */}
                {identity.ensUrl && (
                  <IdentitySection
                    label="WEBSITE"
                    value={identity.ensUrl.replace(/^https?:\/\//, '').slice(0, 30)}
                    glyph={VOT_GLYPHS.DINGIR}
                    color={MATRIX_BRIGHT}
                    link={identity.ensUrl.startsWith('http') ? identity.ensUrl : `https://${identity.ensUrl}`}
                  />
                )}

                {/* Social Links Row */}
                {(identity.ensTwitter || identity.ensGithub) && (
                  <div className="flex gap-2">
                    {identity.ensTwitter && (
                      <a 
                        href={`https://x.com/${identity.ensTwitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 p-2 rounded-lg border text-center hover:opacity-80 transition-opacity"
                        style={{ 
                          borderColor: `${MATRIX_GREEN}40`,
                          backgroundColor: MATRIX_BG_LIGHT,
                        }}
                      >
                        <span className="font-mono text-xs" style={{ color: '#1DA1F2' }}>
                          𝕏 @{identity.ensTwitter.replace('@', '')}
                        </span>
                      </a>
                    )}
                    {identity.ensGithub && (
                      <a 
                        href={`https://github.com/${identity.ensGithub}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 p-2 rounded-lg border text-center hover:opacity-80 transition-opacity"
                        style={{ 
                          borderColor: `${MATRIX_GREEN}40`,
                          backgroundColor: MATRIX_BG_LIGHT,
                        }}
                      >
                        <span className="font-mono text-xs" style={{ color: '#f5f5f5' }}>
                          ⟁ {identity.ensGithub}
                        </span>
                      </a>
                    )}
                  </div>
                )}

                {/* Wallet */}
                <IdentitySection
                  label="WALLET"
                  value={formatAddress(identity.address)}
                  glyph={VOT_GLYPHS.AN}
                  color={MATRIX_GREEN}
                  link={`https://basescan.org/address/${identity.address}`}
                />

                {/* Traits */}
                <TraitsCounter active={getActiveTraits()} total={7} />
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="py-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="text-3xl mb-2"
                  style={{ color: MATRIX_BRIGHT }}
                >
                  {VOT_GLYPHS.TA}
                </motion.div>
                <span className="font-mono text-sm" style={{ color: MATRIX_DIM }}>
                  Loading identity...
                </span>
              </div>
            )}

            {/* Not connected state - Matrix styled prompt */}
            {!canMint && !loading && (
              <motion.div 
                className="p-6 rounded-xl border text-center relative overflow-hidden"
                style={{ 
                  borderColor: `${MATRIX_GREEN}40`,
                  backgroundColor: MATRIX_BG_LIGHT,
                  boxShadow: `inset 0 0 30px ${MATRIX_GREEN}08`,
                }}
                animate={{
                  borderColor: [`${MATRIX_GREEN}30`, `${MATRIX_GREEN}60`, `${MATRIX_GREEN}30`],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Subtle scan line */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(180deg, transparent 0%, ${MATRIX_GREEN}08 50%, transparent 100%)`,
                    height: '50%',
                  }}
                  animate={{ top: ['-50%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div 
                  className="font-mono text-lg mb-2 relative z-10" 
                  style={{ color: MATRIX_BRIGHT }}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {VOT_GLYPHS.CHAIN} CONNECT TO MINT
                </motion.div>
                <span className="font-mono text-sm relative z-10" style={{ color: MATRIX_DIM }}>
                  {isInMiniApp 
                    ? 'Tap Connect via Farcaster above' 
                    : 'Connect wallet above to mint'}
                </span>
              </motion.div>
            )}

            {/* Price/Reward */}
            <PriceRewardDisplay />

            {/* Gasless badge */}
            <div className="flex justify-center">
              <GaslessBadge />
            </div>

            {/* Error */}
            {error && (
              <div 
                className="p-3 rounded-lg border text-center"
                style={{ 
                  borderColor: '#ff444450',
                  backgroundColor: '#ff444415',
                }}
              >
                <span className="font-mono text-xs" style={{ color: '#ff6666' }}>
                  {error}
                </span>
              </div>
            )}

            {/* Mint button */}
            <MintButton 
              onClick={handleMint}
              disabled={!canMint}
              loading={minting || isPaymentProcessing}
              paymentStep={paymentStep}
              insufficientBalance={isConnected && !hasEnoughUSDC}
            />

            {/* Footer */}
            <div className="text-center space-y-1">
              <div className="font-mono text-[10px]" style={{ color: MATRIX_DIM }}>
                BASE MAINNET {VOT_GLYPHS.CHAIN} {BEEPER_CONTRACT.slice(0, 6)}...{BEEPER_CONTRACT.slice(-4)}
              </div>
              <div className="flex items-center justify-center gap-3">
                <a 
                  href="https://beep.works" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] hover:underline"
                  style={{ color: MATRIX_ACCENT }}
                >
                  beep.works
                </a>
                <span style={{ color: MATRIX_DIM }}>{VOT_GLYPHS.DISH}</span>
                <a 
                  href="https://mcpvot.xyz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] hover:underline"
                  style={{ color: MATRIX_BRIGHT }}
                >
                  mcpvot.xyz
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
