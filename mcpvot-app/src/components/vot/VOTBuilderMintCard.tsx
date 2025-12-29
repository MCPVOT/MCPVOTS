'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    VOT BUILDER MINT CARD - PREMIUM TIER                       ║
 * ║                         v2.0 - ENHANCED JUNE 2025                             ║
 * ║                                                                               ║
 * ║  Features:                                                                    ║
 * ║  ✅ More adaptive than Beeper (container queries, fluid typography)          ║
 * ║  ✅ Premium feel: $1.00 USDC → 69,420 VOT + IPFS site + NFT                  ║
 * ║  ✅ 14 template categories with live preview                                  ║
 * ║  ✅ ENS subdomain option: {name}.builder.mcpvot.eth                          ║
 * ║  ✅ VOT Sumerian hieroglyphics language                                       ║
 * ║  ✅ Post-mint: IPFS site, Download SVG, OpenSea, BaseScan                    ║
 * ║  ✅ ERC-4804 web3:// URL ready                                                ║
 * ║  ✅ Fusaka/Pectra EIP compliant (7702, 7951)                                  ║
 * ║  ✅ Full identity display (Basename, ENS, Farcaster)                          ║
 * ║  ✅ Site traits display with rarity indicators                                ║
 * ║  ✅ Animated VOT Builder pixel mascot                                         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { useIdentity } from '@/hooks/useIdentity';
import { useX402 } from '@/hooks/useX402';
import { useOptionalFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useBalance, useWalletClient } from 'wagmi';

// =============================================================================
// CONSTANTS - GOLD/PURPLE PREMIUM PALETTE (BRIGHT to match Beeper intensity)
// =============================================================================

const GOLD_PRIMARY = '#FFE135';    // Brighter gold (was #FFD700)
const GOLD_BRIGHT = '#FFF06A';     // Even brighter highlight (was #FFEC80)
const GOLD_ACCENT = '#FFD000';     // Saturated accent (was #E6C200)
const GOLD_DIM = '#9B8800';        // Slightly brighter dim (was #8B7D00)
const PURPLE_PRIMARY = '#9B77E8';  // Brighter purple (was #8A63D2)
const PURPLE_BRIGHT = '#C9A8FF';   // Brighter highlight (was #B794F6)
const MATRIX_BG = '#050505';
const CYAN_ACCENT = '#00FFCC';

// Contract addresses
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const MINT_PRICE_USDC = '1000000'; // $1.00 in atomic units (6 decimals) - VOT Builder PREMIUM
const VOT_REWARD = '69,420';

// Template categories
const TEMPLATE_CATEGORIES = [
  { id: 'vot', label: 'VOT', color: '#77FE80', glyph: '𒀭' },
  { id: 'warplet', label: 'Warplet', color: '#855DCD', glyph: '𒆳' },
  { id: 'ens', label: 'ENS', color: '#5298FF', glyph: '𒀯' },
  { id: 'defi', label: 'DeFi', color: '#00D395', glyph: '𒄠' },
  { id: 'gaming', label: 'Gaming', color: '#FF6B6B', glyph: '𒌋' },
  { id: 'minimal', label: 'Minimal', color: '#888888', glyph: '𒁹' },
  { id: 'maxx', label: 'MAXX', color: '#FF8C00', glyph: '𒋼' },
  { id: 'farcaster', label: 'Farcaster', color: '#8A63D2', glyph: '𒆷' },
  { id: 'base', label: 'Base', color: '#0052FF', glyph: '𒇻' },
  { id: 'burn', label: 'Burn', color: '#FF4500', glyph: '𒈗' },
  { id: 'x402', label: 'x402', color: '#00FFCC', glyph: '𒀭' },
  { id: 'mcpvot', label: 'MCPVOT', color: '#77FE80', glyph: '𒀯' },
  { id: 'ai', label: 'AI', color: '#7C3AED', glyph: '𒄠' },
  { id: 'cyberpunk', label: 'Cyberpunk', color: '#FF00FF', glyph: '𒌋' },
];

// VOT Hieroglyphics
const VOT_GLYPHS = {
  CHAIN: '⟁',
  VERIFY: '◈',
  SIGNAL: '⚡',
  ARROW: '►',
  DOWNLOAD: '⬇',
  EXTERNAL: '↗',
  DOT: '•',
  STAR: '✦',
  BUILD: '🏗️',
};

// =============================================================================
// TYPES
// =============================================================================

interface VOTBuilderMintCardProps {
  onMintStart?: () => void;
  onMintComplete?: (result: MintResult) => void;
  className?: string;
}

interface MintResult {
  tokenId: number;
  ipfsCid: string;
  txHash: string;
  category: string;
  previewUrl: string;
  ensSubdomain?: string;
  traits?: SiteTrait[];
}

// Site trait structure for the generated IPFS site
interface SiteTrait {
  name: string;
  value: string;
  rarity?: number; // Percentage rarity
}

// =============================================================================
// ANIMATED VOT BUILDER MASCOT - Pixel Art Robot
// =============================================================================

function VOTBuilderMascot({ category }: { category: string }) {
  const selectedCat = TEMPLATE_CATEGORIES.find(c => c.id === category) || TEMPLATE_CATEGORIES[0];
  
  return (
    <motion.div
      className="absolute -top-6 -right-3 @sm:-top-8 @sm:-right-4 z-10"
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.div
        className="relative"
        animate={{
          y: [0, -4, 0],
          rotate: [0, 2, -2, 0],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {/* Robot body - pixel art style */}
        <svg
          width="48"
          height="56"
          viewBox="0 0 48 56"
          className="drop-shadow-lg @sm:w-14 @sm:h-16"
          style={{ filter: `drop-shadow(0 0 8px ${selectedCat.color}60)` }}
        >
          {/* Antenna */}
          <rect x="22" y="0" width="4" height="6" fill={GOLD_PRIMARY} />
          <motion.circle
            cx="24"
            cy="2"
            r="3"
            fill={selectedCat.color}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          
          {/* Head */}
          <rect x="8" y="6" width="32" height="20" rx="3" fill={MATRIX_BG} stroke={GOLD_PRIMARY} strokeWidth="2" />
          
          {/* Eyes */}
          <motion.rect
            x="14" y="12" width="8" height="8" rx="1"
            fill={selectedCat.color}
            animate={{ scaleY: [1, 0.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
          <motion.rect
            x="26" y="12" width="8" height="8" rx="1"
            fill={selectedCat.color}
            animate={{ scaleY: [1, 0.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
          
          {/* Mouth - LED display */}
          <rect x="16" y="22" width="16" height="2" fill={PURPLE_PRIMARY} />
          
          {/* Body */}
          <rect x="10" y="28" width="28" height="20" rx="2" fill={MATRIX_BG} stroke={GOLD_PRIMARY} strokeWidth="2" />
          
          {/* Body glyph */}
          <text
            x="24"
            y="42"
            textAnchor="middle"
            className="text-xs font-mono"
            fill={selectedCat.color}
          >
            {selectedCat.glyph}
          </text>
          
          {/* Arms */}
          <rect x="2" y="30" width="6" height="12" rx="2" fill={GOLD_DIM} />
          <rect x="40" y="30" width="6" height="12" rx="2" fill={GOLD_DIM} />
          
          {/* Legs */}
          <rect x="14" y="50" width="8" height="6" rx="1" fill={GOLD_DIM} />
          <rect x="26" y="50" width="8" height="6" rx="1" fill={GOLD_DIM} />
        </svg>
        
        {/* Sparkle effect */}
        <motion.div
          className="absolute -top-1 -right-1 text-xs"
          style={{ color: GOLD_PRIMARY }}
          animate={{ 
            scale: [1, 1.5, 1], 
            opacity: [0.5, 1, 0.5],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✦
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// BUILDER IDENTITY SECTION - Basename/ENS/Farcaster Display
// =============================================================================

function BuilderIdentitySection({ 
  address,
  basename,
  ensName,
  farcasterUser,
}: { 
  address?: string;
  basename?: string | null;
  ensName?: string | null;
  farcasterUser?: { fid?: number; username?: string; displayName?: string; pfpUrl?: string } | null;
}) {
  if (!address) return null;

  const hasIdentity = basename || ensName || farcasterUser?.username;
  
  return (
    <motion.div
      className="@container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div 
        className="p-4 @sm:p-5 rounded-xl border"
        style={{
          borderColor: `${PURPLE_PRIMARY}40`,
          backgroundColor: `${PURPLE_PRIMARY}08`,
        }}
      >
        <div className="font-mono text-xs @sm:text-sm uppercase tracking-widest mb-3" style={{ color: PURPLE_PRIMARY }}>
          {VOT_GLYPHS.VERIFY} Builder Identity
        </div>
        
        <div className="space-y-3">
          {/* Primary identity */}
          {hasIdentity ? (
            <div className="flex items-center gap-3">
              {farcasterUser?.pfpUrl && (
                <div 
                  className="w-10 h-10 @sm:w-12 @sm:h-12 rounded-lg overflow-hidden border"
                  style={{ borderColor: `${PURPLE_PRIMARY}50` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={farcasterUser.pfpUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="font-mono text-base @sm:text-lg" style={{ color: GOLD_BRIGHT }}>
                  {basename || ensName || farcasterUser?.username || 'Builder'}
                </div>
                {farcasterUser?.displayName && (
                  <div className="font-mono text-sm opacity-70" style={{ color: PURPLE_BRIGHT }}>
                    {farcasterUser.displayName}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="font-mono text-base @sm:text-lg" style={{ color: `${GOLD_PRIMARY}80` }}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          )}
          
          {/* Identity badges */}
          <div className="flex flex-wrap gap-2">
            {basename && (
              <span 
                className="px-2.5 py-1 rounded text-xs @sm:text-sm font-mono"
                style={{ 
                  backgroundColor: '#0052FF20',
                  color: '#0052FF',
                  border: '1px solid #0052FF40',
                }}
              >
                ◈ Base Name
              </span>
            )}
            {ensName && (
              <span 
                className="px-2.5 py-1 rounded text-xs @sm:text-sm font-mono"
                style={{ 
                  backgroundColor: `${CYAN_ACCENT}20`,
                  color: CYAN_ACCENT,
                  border: `1px solid ${CYAN_ACCENT}40`,
                }}
              >
                ⟁ ENS
              </span>
            )}
            {farcasterUser?.fid && (
              <span 
                className="px-2.5 py-1 rounded text-xs @sm:text-sm font-mono"
                style={{ 
                  backgroundColor: `${PURPLE_PRIMARY}20`,
                  color: PURPLE_BRIGHT,
                  border: `1px solid ${PURPLE_PRIMARY}40`,
                }}
              >
                ◇ FID #{farcasterUser.fid}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// SITE TRAITS DISPLAY - Shows traits of the generated site
// =============================================================================

function SiteTraitsDisplay({ category }: { category: string }) {
  const selectedCat = TEMPLATE_CATEGORIES.find(c => c.id === category) || TEMPLATE_CATEGORIES[0];
  
  // Generate sample traits based on category
  const traits: SiteTrait[] = [
    { name: 'Template', value: selectedCat.label, rarity: 100 / TEMPLATE_CATEGORIES.length },
    { name: 'Protocol', value: 'ERC-4804', rarity: 5 },
    { name: 'Storage', value: 'IPFS', rarity: 100 },
    { name: 'Hosting', value: 'Decentralized', rarity: 10 },
    { name: 'ENS Ready', value: 'Yes', rarity: 25 },
    { name: 'VOT Glyph', value: selectedCat.glyph, rarity: 100 / TEMPLATE_CATEGORIES.length },
  ];

  return (
    <motion.div
      className="@container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div 
        className="p-5 @sm:p-6 rounded-xl border"
        style={{
          borderColor: `${selectedCat.color}30`,
          backgroundColor: `${selectedCat.color}05`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-sm @sm:text-base @md:text-lg uppercase tracking-widest" style={{ color: selectedCat.color }}>
            {VOT_GLYPHS.STAR} SITE TRAITS
          </span>
          <span className="font-mono text-sm @sm:text-base" style={{ color: `${selectedCat.color}60` }}>
            {traits.length} traits
          </span>
        </div>
        
        <div className="grid grid-cols-2 @xs:grid-cols-3 gap-3 @sm:gap-4">
          {traits.map((trait, i) => (
            <motion.div
              key={trait.name}
              className="p-3 @sm:p-4 rounded border text-center"
              style={{
                borderColor: `${selectedCat.color}20`,
                backgroundColor: MATRIX_BG,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="font-mono text-xs @sm:text-sm uppercase opacity-60" style={{ color: selectedCat.color }}>
                {trait.name}
              </div>
              <div className="font-mono text-base @sm:text-lg @md:text-xl font-bold" style={{ color: selectedCat.color }}>
                {trait.value}
              </div>
              {trait.rarity && trait.rarity < 50 && (
                <div className="font-mono text-xs @sm:text-sm mt-1" style={{ color: GOLD_PRIMARY }}>
                  {trait.rarity.toFixed(1)}% rare
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// STANDARDS BADGES - VOT Builder Specific
// =============================================================================

function BuilderStandardsBadges() {
  const standards = [
    { label: 'ERC-1155', color: GOLD_PRIMARY, glyph: '◆' },
    { label: 'IPFS', color: PURPLE_BRIGHT, glyph: '◇' },
    { label: 'ERC-4804', color: GOLD_PRIMARY, glyph: '◈' },
    { label: 'ENS', color: CYAN_ACCENT, glyph: '⟁' },
    { label: 'EIP-7702', color: PURPLE_PRIMARY, glyph: '✦' },
  ];

  return (
    <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center @container">
      {standards.map((std, i) => (
        <motion.span
          key={std.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="relative px-2.5 @sm:px-3 py-1 @sm:py-1.5 rounded-md text-xs @sm:text-sm font-mono uppercase tracking-wider overflow-hidden"
          style={{
            backgroundColor: MATRIX_BG,
            border: `1px solid ${std.color}40`,
            color: std.color,
          }}
          whileHover={{ 
            borderColor: std.color,
            boxShadow: `0 0 12px ${std.color}40`,
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: std.color }}
            animate={{ opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }}
          />
          <span className="relative z-10 flex items-center gap-1">
            <span className="text-xs @sm:text-sm">{std.glyph}</span>
            {std.label}
          </span>
        </motion.span>
      ))}
    </div>
  );
}

// =============================================================================
// CATEGORY SELECTOR - ENHANCED with bright colors, large text, edge animations
// =============================================================================

function CategorySelector({ 
  selected, 
  onSelect 
}: { 
  selected: string; 
  onSelect: (id: string) => void;
}) {
  return (
    <div className="@container">
      {/* Header */}
      <motion.div 
        className="text-center mb-4 @sm:mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div 
          className="font-mono text-lg @sm:text-xl @md:text-2xl uppercase tracking-[0.3em] font-bold"
          style={{ 
            color: GOLD_PRIMARY,
            textShadow: `0 0 20px ${GOLD_PRIMARY}60`,
          }}
        >
          SELECT TEMPLATE
        </div>
      </motion.div>
      
      {/* Grid with larger items */}
      <div className="grid grid-cols-4 @xs:grid-cols-4 @sm:grid-cols-7 gap-3 @sm:gap-4">
        {TEMPLATE_CATEGORIES.map((cat, index) => (
          <motion.button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="relative flex flex-col items-center justify-center p-3 @sm:p-4 @md:p-5 rounded-xl border-2 transition-all overflow-hidden"
            style={{
              backgroundColor: selected === cat.id ? `${cat.color}25` : '#0a0a0a',
              borderColor: selected === cat.id ? cat.color : `${cat.color}40`,
              boxShadow: selected === cat.id 
                ? `0 0 30px ${cat.color}50, inset 0 0 20px ${cat.color}20` 
                : `0 0 10px ${cat.color}15`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ 
              scale: 1.08, 
              borderColor: cat.color,
              boxShadow: `0 0 40px ${cat.color}60, inset 0 0 30px ${cat.color}30`,
            }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Animated corner pulses */}
            <motion.div
              className="absolute top-0 left-0 w-2 h-2 @sm:w-3 @sm:h-3"
              style={{ backgroundColor: cat.color }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
            />
            <motion.div
              className="absolute top-0 right-0 w-2 h-2 @sm:w-3 @sm:h-3"
              style={{ backgroundColor: cat.color }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 + 0.3 }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-2 h-2 @sm:w-3 @sm:h-3"
              style={{ backgroundColor: cat.color }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 + 0.6 }}
            />
            <motion.div
              className="absolute bottom-0 right-0 w-2 h-2 @sm:w-3 @sm:h-3"
              style={{ backgroundColor: cat.color }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 + 0.9 }}
            />
            
            {/* Background pulse for selected */}
            {selected === cat.id && (
              <motion.div
                className="absolute inset-0"
                style={{ backgroundColor: cat.color }}
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            
            {/* Edge glow animation for selected */}
            {selected === cat.id && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ 
                  boxShadow: `inset 0 0 15px ${cat.color}60`,
                }}
                animate={{ 
                  boxShadow: [
                    `inset 0 0 15px ${cat.color}60`,
                    `inset 0 0 25px ${cat.color}80`,
                    `inset 0 0 15px ${cat.color}60`,
                  ]
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
            
            {/* Glyph - MUCH LARGER */}
            <motion.span 
              className="text-2xl @sm:text-3xl @md:text-4xl relative z-10"
              style={{ 
                color: cat.color,
                textShadow: selected === cat.id 
                  ? `0 0 20px ${cat.color}, 0 0 40px ${cat.color}80` 
                  : `0 0 10px ${cat.color}60`,
                filter: selected === cat.id ? `drop-shadow(0 0 8px ${cat.color})` : 'none',
              }}
              animate={selected === cat.id ? { 
                scale: [1, 1.1, 1],
                textShadow: [
                  `0 0 20px ${cat.color}`,
                  `0 0 30px ${cat.color}`,
                  `0 0 20px ${cat.color}`,
                ]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {cat.glyph}
            </motion.span>
            
            {/* Label - LARGER */}
            <span 
              className="font-mono text-xs @sm:text-sm @md:text-base uppercase tracking-wider mt-2 font-bold relative z-10"
              style={{ 
                color: selected === cat.id ? cat.color : `${cat.color}90`,
                textShadow: selected === cat.id ? `0 0 10px ${cat.color}80` : 'none',
              }}
            >
              {cat.label}
            </span>
            
            {/* Selection ring */}
            {selected === cat.id && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ border: `3px solid ${cat.color}` }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// PRICE/REWARD DISPLAY - Premium Gold Style
// =============================================================================

function PriceRewardDisplay() {
  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-4 @sm:gap-6">
        {/* Price Card - Enhanced */}
        <motion.div 
          className="relative p-6 @sm:p-8 rounded-xl border-2 text-center overflow-hidden"
          style={{ 
            borderColor: `${GOLD_PRIMARY}70`,
            backgroundColor: MATRIX_BG,
            boxShadow: `0 0 30px ${GOLD_PRIMARY}30, inset 0 0 40px ${GOLD_PRIMARY}10`,
          }}
          whileHover={{ 
            borderColor: GOLD_BRIGHT, 
            boxShadow: `0 0 60px ${GOLD_PRIMARY}60, inset 0 0 60px ${GOLD_PRIMARY}20`,
            scale: 1.02,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Animated background pulse */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: GOLD_PRIMARY }}
            animate={{ opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          
          {/* Corner accents */}
          <motion.div 
            className="absolute top-0 left-0 w-6 h-6 @sm:w-8 @sm:h-8"
            style={{ borderTop: `2px solid ${GOLD_BRIGHT}`, borderLeft: `2px solid ${GOLD_BRIGHT}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-0 right-0 w-6 h-6 @sm:w-8 @sm:h-8"
            style={{ borderTop: `2px solid ${GOLD_BRIGHT}`, borderRight: `2px solid ${GOLD_BRIGHT}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-6 h-6 @sm:w-8 @sm:h-8"
            style={{ borderBottom: `2px solid ${GOLD_BRIGHT}`, borderLeft: `2px solid ${GOLD_BRIGHT}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          />
          <motion.div 
            className="absolute bottom-0 right-0 w-6 h-6 @sm:w-8 @sm:h-8"
            style={{ borderBottom: `2px solid ${GOLD_BRIGHT}`, borderRight: `2px solid ${GOLD_BRIGHT}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
          />

          <motion.div
            className="absolute top-3 right-3 w-3 h-3 @sm:w-4 @sm:h-4 rounded-full"
            style={{ backgroundColor: GOLD_BRIGHT }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />

          <div className="relative z-10">
            <div className="font-mono text-sm @sm:text-base @md:text-lg uppercase tracking-widest mb-3 @sm:mb-4" style={{ color: GOLD_PRIMARY }}>
              ◇ PRICE
            </div>
            <motion.div 
              className="font-mono text-5xl @sm:text-6xl @md:text-7xl font-black"
              style={{ color: GOLD_BRIGHT }}
              animate={{ 
                textShadow: [
                  `0 0 20px ${GOLD_PRIMARY}60, 0 0 40px ${GOLD_PRIMARY}30`,
                  `0 0 40px ${GOLD_PRIMARY}80, 0 0 80px ${GOLD_PRIMARY}50`,
                  `0 0 20px ${GOLD_PRIMARY}60, 0 0 40px ${GOLD_PRIMARY}30`,
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              $1.00
            </motion.div>
            <div className="font-mono text-base @sm:text-lg mt-3 @sm:mt-4 flex items-center justify-center gap-2" style={{ color: GOLD_ACCENT }}>
              <span className="font-bold">USDC</span>
              <span className="opacity-50">•</span>
              <span className="opacity-80">BASE</span>
            </div>
          </div>
        </motion.div>

        {/* Reward Card - Enhanced */}
        <motion.div 
          className="relative p-6 @sm:p-8 rounded-xl border-2 text-center overflow-hidden"
          style={{ 
            borderColor: `${PURPLE_PRIMARY}70`,
            backgroundColor: MATRIX_BG,
            boxShadow: `0 0 30px ${PURPLE_PRIMARY}30, inset 0 0 40px ${PURPLE_PRIMARY}10`,
          }}
          whileHover={{ 
            borderColor: PURPLE_BRIGHT, 
            boxShadow: `0 0 60px ${PURPLE_PRIMARY}60, inset 0 0 60px ${PURPLE_PRIMARY}20`,
            scale: 1.02,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Animated background pulse */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: PURPLE_PRIMARY }}
            animate={{ opacity: [0.05, 0.18, 0.05] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Corner accents */}
          <motion.div 
            className="absolute top-0 left-0 w-6 h-6 @sm:w-8 @sm:h-8"
            style={{ borderTop: `2px solid ${PURPLE_BRIGHT}`, borderLeft: `2px solid ${PURPLE_BRIGHT}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-0 right-0 w-6 h-6 @sm:w-8 @sm:h-8"
            style={{ borderTop: `2px solid ${PURPLE_BRIGHT}`, borderRight: `2px solid ${PURPLE_BRIGHT}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-6 h-6 @sm:w-8 @sm:h-8"
            style={{ borderBottom: `2px solid ${PURPLE_BRIGHT}`, borderLeft: `2px solid ${PURPLE_BRIGHT}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          />
          <motion.div 
            className="absolute bottom-0 right-0 w-6 h-6 @sm:w-8 @sm:h-8"
            style={{ borderBottom: `2px solid ${PURPLE_BRIGHT}`, borderRight: `2px solid ${PURPLE_BRIGHT}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
          />

          <motion.div
            className="absolute top-3 right-3"
            animate={{ rotate: [0, 180, 360], scale: [1, 1.3, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ color: PURPLE_BRIGHT, fontSize: '20px' }}
          >
            ✦
          </motion.div>

          <div className="relative z-10">
            <div className="font-mono text-sm @sm:text-base @md:text-lg uppercase tracking-widest mb-3 @sm:mb-4" style={{ color: PURPLE_PRIMARY }}>
              ◈ REWARD
            </div>
            <motion.div 
              className="font-mono text-5xl @sm:text-6xl @md:text-7xl font-black"
              style={{ color: PURPLE_BRIGHT }}
              animate={{ 
                textShadow: [
                  `0 0 20px ${PURPLE_PRIMARY}60, 0 0 40px ${PURPLE_PRIMARY}30`,
                  `0 0 40px ${PURPLE_PRIMARY}80, 0 0 80px ${PURPLE_PRIMARY}50`,
                  `0 0 20px ${PURPLE_PRIMARY}60, 0 0 40px ${PURPLE_PRIMARY}30`,
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {VOT_REWARD}
            </motion.div>
            <div className="font-mono text-base @sm:text-lg mt-3 @sm:mt-4 flex items-center justify-center gap-2" style={{ color: PURPLE_PRIMARY }}>
              <span className="font-bold">VOT</span>
              <span className="opacity-50">+</span>
              <span className="opacity-80">SITE</span>
              <span className="opacity-50">+</span>
              <span className="opacity-80">NFT</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// =============================================================================
// VOT BUILDER PAGE PREVIEW - Full HTML Page Output (900×400 aspect)
// Shows what the minted IPFS page will look like (ipfs-landing style)
// =============================================================================

// LIVE PREVIEW - Renders actual generated HTML in iframe
function LiveHTMLPreview({ category, address }: { category: string; address?: string }) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const selectedCat = TEMPLATE_CATEGORIES.find(c => c.id === category) || TEMPLATE_CATEGORIES[0];
  
  // Fetch actual HTML from the generate-svg API
  useEffect(() => {
    const fetchHTML = async () => {
      if (!address) {
        setError('Connect wallet to preview');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/machine/generate-svg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            category,
            outputType: 'page',
            useLLM: false, // Skip LLM for preview speed
          }),
        });
        
        if (!response.ok) throw new Error('Failed to generate preview');
        
        const data = await response.json();
        if (data.page) {
          setHtmlContent(data.page);
        } else {
          setError('No page content returned');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Preview failed');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce to avoid too many API calls
    const timer = setTimeout(fetchHTML, 500);
    return () => clearTimeout(timer);
  }, [category, address]);
  
  // Write HTML to iframe when content changes
  useEffect(() => {
    if (htmlContent && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [htmlContent]);
  
  return (
    <motion.div
      className="relative rounded-xl overflow-hidden border-2"
      style={{ 
        borderColor: `${selectedCat.color}80`,
        backgroundColor: '#050505',
        boxShadow: `0 0 60px ${selectedCat.color}40, 0 0 120px ${selectedCat.color}20`,
        aspectRatio: '16 / 9',
        minHeight: '300px',
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      key={category}
    >
      {/* Animated border glow */}
      <motion.div 
        className="absolute inset-0 rounded-xl pointer-events-none z-20"
        style={{ 
          border: `2px solid ${selectedCat.color}`,
          boxShadow: `inset 0 0 30px ${selectedCat.color}30`,
        }}
        animate={{ 
          boxShadow: [
            `inset 0 0 30px ${selectedCat.color}30`,
            `inset 0 0 50px ${selectedCat.color}50`,
            `inset 0 0 30px ${selectedCat.color}30`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80">
          <div className="text-center">
            <motion.div
              className="w-12 h-12 border-2 border-t-transparent rounded-full mx-auto mb-3"
              style={{ borderColor: selectedCat.color }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p style={{ color: selectedCat.color }} className="font-mono text-sm">Generating Preview...</p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/90">
          <div className="text-center p-6">
            <p className="text-red-400 font-mono text-sm mb-2">{error}</p>
            <p className="text-gray-500 font-mono text-xs">Connect wallet to see your personalized preview</p>
          </div>
        </div>
      )}
      
      {/* Live HTML iframe */}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title="VOT Builder Preview"
        style={{ 
          transform: 'scale(0.5)',
          transformOrigin: 'top left',
          width: '200%',
          height: '200%',
        }}
      />
      
      {/* Preview badge */}
      <div 
        className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-mono z-30"
        style={{ backgroundColor: `${selectedCat.color}30`, color: selectedCat.color }}
      >
        LIVE PREVIEW
      </div>
    </motion.div>
  );
}

// Static SVG preview (kept for fallback/quick display - currently disabled)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BuilderPreview({ category, address }: { category: string; address?: string }) {
  const selectedCat = TEMPLATE_CATEGORIES.find(c => c.id === category) || TEMPLATE_CATEGORIES[0];
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0x0000...0000';
  
  return (
    <motion.div
      className="relative rounded-xl overflow-hidden border-2"
      style={{ 
        borderColor: `${selectedCat.color}80`,
        backgroundColor: '#050505',
        boxShadow: `0 0 60px ${selectedCat.color}40, 0 0 120px ${selectedCat.color}20, inset 0 0 100px rgba(0,255,204,0.08)`,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      key={category}
    >
      {/* Animated border glow */}
      <motion.div 
        className="absolute inset-0 rounded-xl pointer-events-none z-20"
        style={{ 
          border: `2px solid ${selectedCat.color}`,
          boxShadow: `inset 0 0 30px ${selectedCat.color}30`,
        }}
        animate={{ 
          boxShadow: [
            `inset 0 0 30px ${selectedCat.color}30`,
            `inset 0 0 50px ${selectedCat.color}50`,
            `inset 0 0 30px ${selectedCat.color}30`,
          ],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Corner pulse animations */}
      <motion.div 
        className="absolute top-0 left-0 w-8 h-8 z-30 pointer-events-none"
        style={{ borderTop: `3px solid ${selectedCat.color}`, borderLeft: `3px solid ${selectedCat.color}` }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.div 
        className="absolute top-0 right-0 w-8 h-8 z-30 pointer-events-none"
        style={{ borderTop: `3px solid ${selectedCat.color}`, borderRight: `3px solid ${selectedCat.color}` }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-8 h-8 z-30 pointer-events-none"
        style={{ borderBottom: `3px solid ${selectedCat.color}`, borderLeft: `3px solid ${selectedCat.color}` }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-8 h-8 z-30 pointer-events-none"
        style={{ borderBottom: `3px solid ${selectedCat.color}`, borderRight: `3px solid ${selectedCat.color}` }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 1.2 }}
      />

      {/* VOT Builder Full Page Preview - 1200×400 (matching ipfs-landing style) */}
      <svg 
        viewBox="0 0 1200 400" 
        className="w-full h-auto relative z-10"
        style={{ backgroundColor: '#050505' }}
      >
        <defs>
          {/* CHROMATIC ABERRATION FILTER - RGB split effect */}
          <filter id="chromaticAberration" x="-10%" y="-10%" width="120%" height="120%">
            <feOffset in="SourceGraphic" dx="-2" dy="0" result="red">
              <animate attributeName="dx" values="-2;-3;-2;-1;-2" dur="4s" repeatCount="indefinite"/>
            </feOffset>
            <feOffset in="SourceGraphic" dx="2" dy="0" result="blue">
              <animate attributeName="dx" values="2;3;2;1;2" dur="4s" repeatCount="indefinite"/>
            </feOffset>
            <feColorMatrix in="red" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="redChannel"/>
            <feColorMatrix in="blue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blueChannel"/>
            <feBlend in="redChannel" in2="SourceGraphic" mode="screen" result="blend1"/>
            <feBlend in="blueChannel" in2="blend1" mode="screen"/>
          </filter>
          
          {/* TECH GLOW FILTER - Enhanced */}
          <filter id="techGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1"/>
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2"/>
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur3"/>
            <feMerge>
              <feMergeNode in="blur3"/>
              <feMergeNode in="blur2"/>
              <feMergeNode in="blur1"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* CRT Scanlines Pattern - More visible */}
          <pattern id="crtScanlines" patternUnits="userSpaceOnUse" width="4" height="4">
            <line x1="0" y1="0" x2="4" y2="0" stroke="rgba(0,255,204,0.12)" strokeWidth="1"/>
          </pattern>
          
          {/* Circuit board pattern */}
          <pattern id="circuitGrid" patternUnits="userSpaceOnUse" width="60" height="60">
            <path d="M0 30 L20 30 M30 0 L30 20 M40 30 L60 30 M30 40 L30 60" 
                  stroke={`${selectedCat.color}20`} strokeWidth="1" fill="none"/>
            <circle cx="30" cy="30" r="3" fill={`${selectedCat.color}25`}/>
            <circle cx="0" cy="30" r="2" fill={`${selectedCat.color}20`}/>
            <circle cx="60" cy="30" r="2" fill={`${selectedCat.color}20`}/>
          </pattern>
          
          {/* Gradient for hero text - More vibrant */}
          <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={selectedCat.color}>
              <animate attributeName="stopColor" values={`${selectedCat.color};#00ffcc;${selectedCat.color}`} dur="3s" repeatCount="indefinite"/>
            </stop>
            <stop offset="50%" stopColor="#00ffcc"/>
            <stop offset="100%" stopColor={GOLD_PRIMARY}>
              <animate attributeName="stopColor" values={`${GOLD_PRIMARY};${selectedCat.color};${GOLD_PRIMARY}`} dur="3s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>
          
          {/* Animated gradient for border */}
          <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={selectedCat.color}><animate attributeName="offset" values="0;1;0" dur="3s" repeatCount="indefinite"/></stop>
            <stop offset="50%" stopColor={GOLD_PRIMARY}/>
            <stop offset="100%" stopColor={selectedCat.color}><animate attributeName="offset" values="1;0;1" dur="3s" repeatCount="indefinite"/></stop>
          </linearGradient>
          
          {/* Radial Pulse Gradient for radar */}
          <radialGradient id="pulseGradient">
            <stop offset="0%" stopColor={selectedCat.color} stopOpacity="0.8"/>
            <stop offset="50%" stopColor={selectedCat.color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={selectedCat.color} stopOpacity="0"/>
          </radialGradient>
        </defs>
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* BACKGROUND LAYERS - ipfs-landing style                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        
        {/* Multi-layer background */}
        <rect width="1200" height="400" fill="#050505"/>
        <rect width="1200" height="400" fill="#000a0a" opacity="0.6"/>
        <rect width="1200" height="400" fill="url(#circuitGrid)" opacity="0.5"/>
        
        {/* Deep space grid */}
        <g opacity="0.08">
          <line x1="0" y1="100" x2="1200" y2="100" stroke={selectedCat.color} strokeWidth="1"/>
          <line x1="0" y1="200" x2="1200" y2="200" stroke={selectedCat.color} strokeWidth="1"/>
          <line x1="0" y1="300" x2="1200" y2="300" stroke={selectedCat.color} strokeWidth="1"/>
          <line x1="300" y1="0" x2="300" y2="400" stroke={selectedCat.color} strokeWidth="1"/>
          <line x1="600" y1="0" x2="600" y2="400" stroke={GOLD_PRIMARY} strokeWidth="1" opacity="0.5"/>
          <line x1="900" y1="0" x2="900" y2="400" stroke={selectedCat.color} strokeWidth="1"/>
        </g>
        
        {/* CRT scanlines overlay */}
        <rect width="1200" height="400" fill="url(#crtScanlines)" opacity="0.3"/>
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* BOOT SEQUENCE BAR - Top Header (ipfs-landing style)             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <g transform="translate(0, 15)">
          <rect x="250" y="0" width="700" height="40" fill="#000000" stroke={selectedCat.color} strokeWidth="1" opacity="0.8"/>
          <text x="600" y="12" fontFamily="'Courier New', monospace" fontSize="10" fill={GOLD_PRIMARY} textAnchor="middle" letterSpacing="2">
            SYSTEM BOOT SEQUENCE: x402VOT PROTOCOL
          </text>
          <rect x="260" y="18" width="680" height="6" fill="#001111"/>
          <rect x="260" y="18" width="0" height="6" fill={selectedCat.color}>
            <animate attributeName="width" values="0;680;680" dur="3s" fill="freeze" repeatCount="indefinite"/>
          </rect>
          <text x="600" y="35" fontFamily="'Courier New', monospace" fontSize="9" fill={selectedCat.color} textAnchor="middle">
            LOADING...VERIFYING...SYNCING ETH...EIP-7702 READY...COMPLETED
          </text>
        </g>
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* LEFT GAUGE CLUSTER - Loading Gauge (ipfs-landing style)         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <g transform="translate(150, 200)">
          {/* Main circular gauge */}
          <circle r="65" fill="none" stroke={selectedCat.color} strokeWidth="1" opacity="0.2"/>
          {/* Tick marks */}
          <g opacity="0.5">
            <path d="M 0,-65 L 0,-58 M 65,0 L 58,0 M 0,65 L 0,58 M -65,0 L -58,0" stroke={selectedCat.color} strokeWidth="1"/>
            <path d="M 46,-46 L 41,-41 M 46,46 L 41,41 M -46,46 L -41,41 M -46,-46 L -41,-41" stroke={GOLD_PRIMARY} strokeWidth="1"/>
          </g>
          {/* Progress arc */}
          <circle r="55" fill="none" stroke={selectedCat.color} strokeWidth="4" 
                  strokeDasharray="345" strokeDashoffset="345" 
                  transform="rotate(-90)" filter="url(#techGlow)">
            <animate attributeName="stroke-dashoffset" values="345;0;345" dur="4s" repeatCount="indefinite"/>
          </circle>
          {/* Inner rings */}
          <circle r="45" fill="none" stroke={selectedCat.color} strokeWidth="1" opacity="0.1"/>
          <circle r="35" fill="none" stroke={GOLD_PRIMARY} strokeWidth="1" opacity="0.3" strokeDasharray="5 5">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite"/>
          </circle>
          {/* Center display */}
          <rect x="-30" y="-12" width="60" height="24" fill="#000000" stroke={selectedCat.color} strokeWidth="1"/>
          <text x="0" y="6" fontFamily="'Courier New', monospace" fontSize="16" fill={selectedCat.color} textAnchor="middle" fontWeight="bold">
            100%
          </text>
          {/* Label */}
          <text x="0" y="-75" fontFamily="'Courier New', monospace" fontSize="10" fill={selectedCat.color} textAnchor="middle" opacity="0.6" letterSpacing="2">
            LOADING
          </text>
        </g>
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* RIGHT GAUGE CLUSTER - Radar Scanner (ipfs-landing style)        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <g transform="translate(1050, 200)">
          <circle r="65" fill="none" stroke={selectedCat.color} strokeWidth="1" opacity="0.2"/>
          {/* Cross hairs */}
          <path d="M -65,0 L 65,0 M 0,-65 L 0,65" stroke={selectedCat.color} strokeWidth="0.5" opacity="0.3"/>
          {/* Sweep */}
          <g>
            <path d="M 0,0 L 0,-60" stroke={selectedCat.color} strokeWidth="2" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite"/>
            </path>
            <path d="M 0,0 L 0,-60 A 60,60 0 0,1 42,-42 Z" fill="url(#pulseGradient)" opacity="0.4">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite"/>
            </path>
          </g>
          {/* Blips */}
          <circle r="4" fill={GOLD_PRIMARY}>
            <animateMotion path="M 25,-35 L -30,20 L 35,30 L 25,-35" dur="4s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle r="3" fill={selectedCat.color}>
            <animateMotion path="M -20,40 L 30,-25 L -25,-10 L -20,40" dur="5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;1;0" dur="1.8s" repeatCount="indefinite"/>
          </circle>
          <text x="0" y="-75" fontFamily="'Courier New', monospace" fontSize="10" fill={selectedCat.color} textAnchor="middle" opacity="0.6" letterSpacing="2">
            NET.SCAN
          </text>
        </g>
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* CENTRAL VOT COMPLEX - Hexagonal System (ipfs-landing style)     */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <g transform="translate(600, 200)">
          {/* Hexagonal base structure */}
          <polygon points="0,-100 87,-50 87,50 0,100 -87,50 -87,-50"
                   fill="none" stroke={selectedCat.color} strokeWidth="2" opacity="0.3">
            <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="60s" repeatCount="indefinite"/>
          </polygon>
          <polygon points="0,-85 74,-42 74,42 0,85 -74,42 -74,-42"
                   fill="none" stroke={GOLD_PRIMARY} strokeWidth="1" opacity="0.5">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="30s" repeatCount="indefinite"/>
          </polygon>
          
          {/* Orbital rings */}
          <ellipse rx="130" ry="40" fill="none" stroke={selectedCat.color} strokeWidth="1" opacity="0.3" strokeDasharray="10 5">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="15s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse rx="130" ry="40" fill="none" stroke={selectedCat.color} strokeWidth="1" opacity="0.3" strokeDasharray="10 5" transform="rotate(60)">
            <animateTransform attributeName="transform" type="rotate" from="60" to="420" dur="18s" repeatCount="indefinite"/>
          </ellipse>
          
          {/* Core platform */}
          <rect x="-95" y="-40" width="190" height="80" fill="#000000" stroke={selectedCat.color} strokeWidth="2"/>
          <rect x="-92" y="-37" width="184" height="74" fill="#000000" stroke={GOLD_PRIMARY} strokeWidth="1" opacity="0.5"/>
          
          {/* VOT display with glitch effect */}
          <text x="0" y="15" fontFamily="'Orbitron', sans-serif" fontSize="56" 
                fontWeight="bold" fill={selectedCat.color} textAnchor="middle" filter="url(#techGlow)">
            VOT
          </text>
          
          {/* Chromatic aberration glitch layer */}
          <text x="0" y="15" fontFamily="'Orbitron', sans-serif" fontSize="56" 
                fontWeight="bold" fill={GOLD_PRIMARY} textAnchor="middle" opacity="0.6" filter="url(#chromaticAberration)">
            VOT
            <animate attributeName="opacity" values="0;0.8;0;0;0.6;0;0.9;0" dur="2s" repeatCount="indefinite"/>
          </text>
          
          {/* Orbiting particles */}
          <circle r="4" fill={selectedCat.color}>
            <animateMotion path="M 0,-90 Q 90,-90 90,0 Q 90,90 0,90 Q -90,90 -90,0 Q -90,-90 0,-90" 
                           dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle r="4" fill={GOLD_PRIMARY}>
            <animateMotion path="M 90,0 Q 90,90 0,90 Q -90,90 -90,0 Q -90,-90 0,-90 Q 90,-90 90,0" 
                           dur="4s" repeatCount="indefinite"/>
          </circle>
          <circle r="3" fill={PURPLE_PRIMARY}>
            <animateMotion path="M -90,0 Q -90,-90 0,-90 Q 90,-90 90,0 Q 90,90 0,90 Q -90,90 -90,0" 
                           dur="5s" repeatCount="indefinite"/>
          </circle>
        </g>
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TELEMETRY DISPLAYS - Left and Right info panels                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        
        {/* Left telemetry panel */}
        <g transform="translate(270, 130)">
          <rect x="0" y="0" width="150" height="140" fill={`${selectedCat.color}08`} stroke={`${selectedCat.color}30`} strokeWidth="1" rx="4"/>
          <text x="75" y="20" fontFamily="'Courier New', monospace" fontSize="9" fill={`${selectedCat.color}60`} textAnchor="middle" letterSpacing="2">IDENTITY</text>
          <text x="75" y="50" fontFamily="'Orbitron', sans-serif" fontSize="14" fill="#ffffff" textAnchor="middle" fontWeight="bold">builder.eth</text>
          <text x="75" y="75" fontFamily="monospace" fontSize="10" fill={selectedCat.color} textAnchor="middle">{shortAddress}</text>
          <text x="75" y="100" fontFamily="monospace" fontSize="9" fill={`${selectedCat.color}60`} textAnchor="middle">x402 • EIP-7702</text>
          <circle cx="75" cy="122" r="8" fill={selectedCat.color}>
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/>
          </circle>
        </g>
        
        {/* Right telemetry panel */}
        <g transform="translate(780, 130)">
          <rect x="0" y="0" width="150" height="140" fill={`${selectedCat.color}08`} stroke={`${selectedCat.color}30`} strokeWidth="1" rx="4"/>
          <text x="75" y="20" fontFamily="'Courier New', monospace" fontSize="9" fill={`${selectedCat.color}60`} textAnchor="middle" letterSpacing="2">TEMPLATE</text>
          <text x="75" y="55" fontFamily="'Orbitron', sans-serif" fontSize="28" fill={selectedCat.color} textAnchor="middle" fontWeight="bold">{selectedCat.glyph}</text>
          <text x="75" y="85" fontFamily="'Orbitron', sans-serif" fontSize="14" fill={selectedCat.color} textAnchor="middle">{selectedCat.label.toUpperCase()}</text>
          <text x="75" y="105" fontFamily="monospace" fontSize="9" fill={`${selectedCat.color}60`} textAnchor="middle">of 14 templates</text>
          <rect x="25" y="115" width="100" height="4" fill="#001111"/>
          <rect x="25" y="115" width="60" height="4" fill={selectedCat.color}>
            <animate attributeName="width" values="20;100;20" dur="3s" repeatCount="indefinite"/>
          </rect>
        </g>
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* BOTTOM STATUS BAR (ipfs-landing style)                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <g transform="translate(0, 340)">
          <rect x="0" y="0" width="1200" height="60" fill={`${selectedCat.color}08`}/>
          <line x1="0" y1="0" x2="1200" y2="0" stroke={selectedCat.color} strokeWidth="1" opacity="0.4">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite"/>
          </line>
          
          {/* VOT Balance */}
          <g transform="translate(80, 12)">
            <text x="0" y="0" fontFamily="monospace" fontSize="9" fill={`${selectedCat.color}60`} letterSpacing="2">VOT REWARD</text>
            <text x="0" y="28" fontFamily="'Orbitron', sans-serif" fontSize="26" fill={selectedCat.color} fontWeight="bold" filter="url(#techGlow)">69,420</text>
            <text x="100" y="28" fontFamily="monospace" fontSize="12" fill={`${selectedCat.color}60`}>VOT</text>
          </g>
          
          {/* Price */}
          <g transform="translate(330, 12)">
            <text x="0" y="0" fontFamily="monospace" fontSize="9" fill={`${GOLD_PRIMARY}60`} letterSpacing="2">MINT PRICE</text>
            <text x="0" y="28" fontFamily="'Orbitron', sans-serif" fontSize="26" fill={GOLD_BRIGHT} fontWeight="bold" filter="url(#techGlow)">$1.00</text>
            <text x="70" y="28" fontFamily="monospace" fontSize="12" fill={`${GOLD_PRIMARY}60`}>USDC</text>
          </g>
          
          {/* Network */}
          <g transform="translate(550, 12)">
            <text x="0" y="0" fontFamily="monospace" fontSize="9" fill={`${selectedCat.color}60`} letterSpacing="2">NETWORK</text>
            <text x="0" y="28" fontFamily="'Orbitron', sans-serif" fontSize="20" fill={selectedCat.color} fontWeight="bold">BASE MAINNET</text>
          </g>
          
          {/* Storage */}
          <g transform="translate(780, 12)">
            <text x="0" y="0" fontFamily="monospace" fontSize="9" fill={`${selectedCat.color}60`} letterSpacing="2">STORAGE</text>
            <text x="0" y="28" fontFamily="'Orbitron', sans-serif" fontSize="20" fill={selectedCat.color} fontWeight="bold">IPFS</text>
          </g>
          
          {/* Protocol */}
          <g transform="translate(920, 12)">
            <text x="0" y="0" fontFamily="monospace" fontSize="9" fill={`${GOLD_PRIMARY}60`} letterSpacing="2">PROTOCOL</text>
            <rect x="0" y="10" width="100" height="30" rx="4" fill={`${GOLD_PRIMARY}20`} stroke={GOLD_PRIMARY} strokeWidth="1">
              <animate attributeName="stroke" values={`${GOLD_PRIMARY}50;${GOLD_PRIMARY};${GOLD_PRIMARY}50`} dur="2s" repeatCount="indefinite"/>
            </rect>
            <text x="50" y="32" fontFamily="'Orbitron', sans-serif" fontSize="14" fill={GOLD_BRIGHT} fontWeight="bold" textAnchor="middle">x402 V2</text>
          </g>
          
          {/* Premium badge */}
          <g transform="translate(1080, 12)">
            <rect x="0" y="8" width="80" height="28" rx="4" fill={`${PURPLE_PRIMARY}25`} stroke={PURPLE_PRIMARY} strokeWidth="1"/>
            <text x="40" y="28" textAnchor="middle" fontFamily="'Orbitron', sans-serif" fontSize="10" fill={PURPLE_BRIGHT} fontWeight="bold">PREMIUM</text>
          </g>
        </g>
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FRAME DECORATIONS - Corner L shapes (ipfs-landing style)        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        
        {/* Corner decorations */}
        <path d="M 0 0 L 40 0 L 40 4 L 4 4 L 4 40 L 0 40 Z" fill={selectedCat.color} opacity="0.7">
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite"/>
        </path>
        <path d="M 1200 0 L 1160 0 L 1160 4 L 1196 4 L 1196 40 L 1200 40 Z" fill={selectedCat.color} opacity="0.7">
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" begin="0.5s"/>
        </path>
        <path d="M 0 400 L 40 400 L 40 396 L 4 396 L 4 360 L 0 360 Z" fill={selectedCat.color} opacity="0.7">
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" begin="1s"/>
        </path>
        <path d="M 1200 400 L 1160 400 L 1160 396 L 1196 396 L 1196 360 L 1200 360 Z" fill={selectedCat.color} opacity="0.7">
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" begin="1.5s"/>
        </path>
        
        {/* Animated scan line */}
        <rect x="0" y="0" width="1200" height="3" fill={`${selectedCat.color}30`}>
          <animate attributeName="y" values="0;400;0" dur="4s" repeatCount="indefinite"/>
        </rect>
        
        {/* Border frame */}
        <rect x="2" y="2" width="1196" height="396" fill="none" stroke={selectedCat.color} strokeWidth="2" opacity="0.4" rx="4"/>
      </svg>
    </motion.div>
  );
}

// =============================================================================
// MINT BUTTON - Premium Gold Style
// =============================================================================

function BuilderMintButton({ 
  onClick, 
  disabled, 
  loading, 
  hasUsdc,
  category,
}: { 
  onClick: () => void; 
  disabled: boolean; 
  loading: boolean;
  hasUsdc: boolean;
  category: string;
}) {
  const selectedCat = TEMPLATE_CATEGORIES.find(c => c.id === category) || TEMPLATE_CATEGORIES[0];
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className="@container relative w-full py-4 @sm:py-5 px-6 @sm:px-8 rounded-xl font-mono text-base @sm:text-lg uppercase tracking-wider overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: MATRIX_BG,
        border: `2px solid ${hasUsdc ? GOLD_PRIMARY : '#FF4444'}`,
        color: hasUsdc ? GOLD_BRIGHT : '#FF4444',
        boxShadow: `0 0 25px ${hasUsdc ? GOLD_PRIMARY : '#FF4444'}30`,
      }}
      whileHover={!disabled ? { 
        scale: 1.02, 
        boxShadow: `0 0 50px ${hasUsdc ? GOLD_PRIMARY : '#FF4444'}60`,
      } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {/* Background gradient sweep */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${hasUsdc ? GOLD_PRIMARY : '#FF4444'}25, transparent)`,
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      {/* Button content */}
      <div className="relative z-10 flex items-center justify-center gap-3 @sm:gap-4">
        {loading ? (
          <>
            <motion.div
              className="w-5 h-5 @sm:w-6 @sm:h-6 border-2 rounded-full"
              style={{ borderColor: GOLD_PRIMARY, borderTopColor: 'transparent' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span className="text-lg @sm:text-xl">Building...</span>
          </>
        ) : (
          <>
            <span className="text-xl @sm:text-2xl">{selectedCat.glyph}</span>
            <span className="text-lg @sm:text-xl font-bold">{hasUsdc ? `BUILD ${selectedCat.label.toUpperCase()} SITE` : 'NEED $1.00 USDC'}</span>
            <motion.span
              className="text-xl @sm:text-2xl"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {VOT_GLYPHS.ARROW}
            </motion.span>
          </>
        )}
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: hasUsdc ? GOLD_PRIMARY : '#FF4444' }} />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: hasUsdc ? GOLD_PRIMARY : '#FF4444' }} />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: hasUsdc ? GOLD_PRIMARY : '#FF4444' }} />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: hasUsdc ? GOLD_PRIMARY : '#FF4444' }} />
    </motion.button>
  );
}

// =============================================================================
// SUCCESS MODAL - Post-mint actions
// =============================================================================

function SuccessModal({ 
  result, 
  onClose 
}: { 
  result: MintResult; 
  onClose: () => void;
}) {
  const selectedCat = TEMPLATE_CATEGORIES.find(c => c.id === result.category) || TEMPLATE_CATEGORIES[0];
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        className="relative w-full max-w-md rounded-2xl border-2 overflow-hidden"
        style={{ 
          backgroundColor: MATRIX_BG,
          borderColor: selectedCat.color,
          boxShadow: `0 0 60px ${selectedCat.color}60`,
        }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        {/* Header */}
        <div 
          className="p-4 border-b text-center"
          style={{ 
            borderColor: `${selectedCat.color}40`,
            background: `linear-gradient(180deg, ${selectedCat.color}20 0%, transparent 100%)`,
          }}
        >
          <motion.div
            className="text-4xl mb-2"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            🎉
          </motion.div>
          <h3 className="font-mono text-xl" style={{ color: selectedCat.color }}>
            SITE BUILT!
          </h3>
          <p className="font-mono text-sm opacity-70" style={{ color: selectedCat.color }}>
            Token #{result.tokenId}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Preview */}
          <div 
            className="p-3 rounded-lg border"
            style={{ borderColor: `${selectedCat.color}30`, backgroundColor: `${selectedCat.color}10` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedCat.glyph}</span>
              <div>
                <div className="font-mono text-sm" style={{ color: selectedCat.color }}>
                  {result.ensSubdomain || 'Your IPFS Site'}
                </div>
                <div className="font-mono text-xs opacity-60" style={{ color: selectedCat.color }}>
                  ipfs://{result.ipfsCid.slice(0, 12)}...
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={result.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-lg border font-mono text-xs uppercase transition-all hover:scale-105"
              style={{ 
                borderColor: `${selectedCat.color}50`,
                color: selectedCat.color,
              }}
            >
              <span>{VOT_GLYPHS.EXTERNAL}</span>
              View Site
            </a>
            <a
              href={`https://basescan.org/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-lg border font-mono text-xs uppercase transition-all hover:scale-105"
              style={{ 
                borderColor: `${CYAN_ACCENT}50`,
                color: CYAN_ACCENT,
              }}
            >
              <span>{VOT_GLYPHS.CHAIN}</span>
              BaseScan
            </a>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full p-3 rounded-lg font-mono text-sm uppercase transition-all hover:opacity-80"
            style={{ 
              backgroundColor: `${selectedCat.color}20`,
              color: selectedCat.color,
              border: `1px solid ${selectedCat.color}50`,
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT - VOT Builder Mint Card
// =============================================================================

export default function VOTBuilderMintCard({ 
  onMintStart, 
  onMintComplete,
  className = '' 
}: VOTBuilderMintCardProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { user: farcasterUser } = useOptionalFarcasterContext();
  const { basename, ensName } = useIdentity();
  
  const [selectedCategory, setSelectedCategory] = useState('vot');
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTraits, setShowTraits] = useState(false);

  // Auto-expand traits after delay for engagement
  useEffect(() => {
    const timer = setTimeout(() => setShowTraits(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Check USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: USDC_ADDRESS as `0x${string}`,
  });

  const hasEnoughUsdc = usdcBalance && BigInt(usdcBalance.value) >= BigInt(MINT_PRICE_USDC);

  // x402 payment hook - configured for VOT Builder endpoint
  const { initiatePayment, isProcessing: isPaymentProcessing, error: paymentError } = useX402(
    '/api/x402/mint-builder-nft',
    {
      onSuccess: (result) => {
        console.log('✅ VOT Builder payment successful:', result);
        const mintData: MintResult = {
          tokenId: (result as { tokenId?: number }).tokenId ?? 0,
          ipfsCid: (result as { ipfsCid?: string }).ipfsCid ?? '',
          txHash: (result as { txHash?: string }).txHash ?? '',
          category: selectedCategory,
          previewUrl: (result as { previewUrl?: string }).previewUrl ?? '',
          ensSubdomain: (result as { ensSubdomain?: string }).ensSubdomain,
        };
        setMintResult(mintData);
        onMintComplete?.(mintData);
      },
      onError: (err) => {
        console.error('❌ VOT Builder payment error:', err);
        setError(err.message);
      },
    }
  );

  // Sync payment error to local error state
  useEffect(() => {
    if (paymentError) {
      setError(paymentError);
    }
  }, [paymentError]);

  const handleMint = useCallback(async () => {
    if (!address || !walletClient) {
      setError('Please connect your wallet');
      return;
    }

    if (!hasEnoughUsdc) {
      setError('Insufficient USDC balance');
      return;
    }

    setIsMinting(true);
    setError(null);
    onMintStart?.();

    try {
      // Initiate x402 payment flow with category metadata
      await initiatePayment(
        MINT_PRICE_USDC, 
        '0x824ea259c1e92f0c5dc1d85dcbb80290b90be7fa', // Treasury address
        'VOT'
      );
      // Success/error handled by useX402 callbacks
    } catch (err) {
      console.error('Mint error:', err);
      setError(err instanceof Error ? err.message : 'Mint failed');
    } finally {
      setIsMinting(false);
    }
  }, [address, walletClient, hasEnoughUsdc, initiatePayment, onMintStart]);

  return (
    <>
      <motion.div
        className={`@container relative rounded-2xl border-2 overflow-hidden ${className}`}
        style={{
          backgroundColor: MATRIX_BG,
          borderColor: `${GOLD_PRIMARY}80`,
          boxShadow: `0 0 80px ${GOLD_PRIMARY}40, 0 0 150px ${GOLD_PRIMARY}20, inset 0 0 100px ${PURPLE_PRIMARY}15`,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated corner pulses on main card */}
        <motion.div 
          className="absolute top-0 left-0 w-10 h-10 @sm:w-12 @sm:h-12 z-20 pointer-events-none"
          style={{ borderTop: `3px solid ${GOLD_PRIMARY}`, borderLeft: `3px solid ${GOLD_PRIMARY}` }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-0 right-0 w-10 h-10 @sm:w-12 @sm:h-12 z-20 pointer-events-none"
          style={{ borderTop: `3px solid ${GOLD_PRIMARY}`, borderRight: `3px solid ${GOLD_PRIMARY}` }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-10 h-10 @sm:w-12 @sm:h-12 z-20 pointer-events-none"
          style={{ borderBottom: `3px solid ${GOLD_PRIMARY}`, borderLeft: `3px solid ${GOLD_PRIMARY}` }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-10 h-10 @sm:w-12 @sm:h-12 z-20 pointer-events-none"
          style={{ borderBottom: `3px solid ${GOLD_PRIMARY}`, borderRight: `3px solid ${GOLD_PRIMARY}` }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1.2 }}
        />
        
        {/* Scanning border effect */}
        <motion.div 
          className="absolute inset-0 rounded-2xl z-10 pointer-events-none"
          style={{ 
            boxShadow: `inset 0 0 40px ${GOLD_PRIMARY}30`,
          }}
          animate={{ 
            boxShadow: [
              `inset 0 0 40px ${GOLD_PRIMARY}30`,
              `inset 0 0 60px ${GOLD_PRIMARY}50`,
              `inset 0 0 40px ${GOLD_PRIMARY}30`,
            ]
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        
        {/* Animated VOT Builder Mascot - Robot with category glyph */}
        <VOTBuilderMascot category={selectedCategory} />

        {/* Content */}
        <div className="p-5 @sm:p-7 @md:p-9 space-y-6 @sm:space-y-7 relative z-10">
          {/* Header - BIGGER AND BRIGHTER */}
          <div className="text-center pt-2">
            <motion.div 
              className="flex items-center justify-center gap-3 @sm:gap-4 mb-2"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.span 
                className="text-2xl @sm:text-3xl"
                style={{ color: GOLD_PRIMARY, textShadow: `0 0 20px ${GOLD_PRIMARY}` }}
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                𒀭
              </motion.span>
              <motion.h2
                className="font-mono text-4xl @sm:text-5xl @md:text-6xl font-black tracking-widest"
                style={{ 
                  color: GOLD_BRIGHT,
                  textShadow: `0 0 30px ${GOLD_PRIMARY}, 0 0 60px ${GOLD_PRIMARY}60, 0 0 90px ${GOLD_PRIMARY}30`,
                }}
                animate={{
                  textShadow: [
                    `0 0 30px ${GOLD_PRIMARY}, 0 0 60px ${GOLD_PRIMARY}60`,
                    `0 0 50px ${GOLD_PRIMARY}, 0 0 100px ${GOLD_PRIMARY}80`,
                    `0 0 30px ${GOLD_PRIMARY}, 0 0 60px ${GOLD_PRIMARY}60`,
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                VOT BUILDER
              </motion.h2>
              <motion.span 
                className="text-2xl @sm:text-3xl"
                style={{ color: GOLD_PRIMARY, textShadow: `0 0 20px ${GOLD_PRIMARY}` }}
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                𒀭
              </motion.span>
            </motion.div>
            <motion.p 
              className="font-mono text-base @sm:text-lg @md:text-xl mt-3 tracking-wide" 
              style={{ color: `${GOLD_PRIMARY}90` }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Build your decentralized IPFS site • Get ENS subdomain • Earn VOT
            </motion.p>
            
            {/* Premium badge */}
            <motion.div 
              className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full"
              style={{ 
                backgroundColor: `${PURPLE_PRIMARY}20`,
                border: `1px solid ${PURPLE_PRIMARY}50`,
              }}
              animate={{ 
                boxShadow: [
                  `0 0 15px ${PURPLE_PRIMARY}30`,
                  `0 0 25px ${PURPLE_PRIMARY}50`,
                  `0 0 15px ${PURPLE_PRIMARY}30`,
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-lg">✦</span>
              <span className="font-mono text-sm @sm:text-base font-bold uppercase tracking-widest" style={{ color: PURPLE_BRIGHT }}>
                Premium Tier
              </span>
              <span className="text-lg">✦</span>
            </motion.div>
          </div>

          {/* Standards badges */}
          <BuilderStandardsBadges />

          {/* Builder Identity Section - Shows Basename/ENS/Farcaster */}
          {isConnected && (
            <BuilderIdentitySection
              address={address}
              basename={basename}
              ensName={ensName}
              farcasterUser={farcasterUser ? {
                fid: farcasterUser.fid,
                username: farcasterUser.username,
                displayName: farcasterUser.displayName,
                pfpUrl: farcasterUser.pfpUrl,
              } : null}
            />
          )}

          {/* Price/Reward display */}
          <PriceRewardDisplay />

          {/* Category selector */}
          <div className="space-y-3">
            <div className="font-mono text-sm @sm:text-base uppercase tracking-wider text-center" style={{ color: GOLD_DIM }}>
              Select Template
            </div>
            <CategorySelector 
              selected={selectedCategory} 
              onSelect={setSelectedCategory} 
            />
          </div>

          {/* Live HTML Preview - Shows actual generated IPFS page */}
          <LiveHTMLPreview category={selectedCategory} address={address} />
          
          {/* Static SVG Preview (fallback/quick view) */}
          {/* <BuilderPreview category={selectedCategory} address={address} /> */}

          {/* Site Traits Display - Shows traits of generated site */}
          <AnimatePresence>
            {showTraits && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <SiteTraitsDisplay category={selectedCategory} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="p-3 rounded-lg border text-center font-mono text-sm"
                style={{ 
                  borderColor: '#FF444480',
                  backgroundColor: '#FF444410',
                  color: '#FF4444',
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mint button */}
          <BuilderMintButton
            onClick={handleMint}
            disabled={!isConnected || isMinting || isPaymentProcessing}
            loading={isMinting || isPaymentProcessing}
            hasUsdc={!!hasEnoughUsdc}
            category={selectedCategory}
          />

          {/* Footer info */}
          <div className="text-center">
            <p className="font-mono text-sm @sm:text-base" style={{ color: `${PURPLE_PRIMARY}60` }}>
              x402 V2 Facilitator • ERC-4804 web3:// • Fusaka Ready
            </p>
          </div>
        </div>
      </motion.div>

      {/* Success modal */}
      <AnimatePresence>
        {mintResult && (
          <SuccessModal 
            result={mintResult} 
            onClose={() => setMintResult(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
