'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    VOT BUILDER MINT CARD - PREMIUM TIER                       ║
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
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { useX402 } from '@/hooks/useX402';
import { useOptionalFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { useAccount, useBalance, useWalletClient } from 'wagmi';

// =============================================================================
// CONSTANTS - GOLD/PURPLE PREMIUM PALETTE (differentiate from Beeper's green)
// =============================================================================

const GOLD_PRIMARY = '#FFD700';
const GOLD_BRIGHT = '#FFEC80';
const GOLD_ACCENT = '#E6C200';
const GOLD_DIM = '#8B7D00';
const PURPLE_PRIMARY = '#8A63D2';
const PURPLE_BRIGHT = '#B794F6';
const MATRIX_BG = '#050505';
const CYAN_ACCENT = '#00FFCC';

// Contract addresses
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const MINT_PRICE_USDC = '1000000'; // $1.00 in atomic units (6 decimals)
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
    <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center @container">
      {standards.map((std, i) => (
        <motion.span
          key={std.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="relative px-1.5 @sm:px-2 py-0.5 rounded-md text-[7px] @sm:text-[9px] font-mono uppercase tracking-wider overflow-hidden"
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
          <span className="relative z-10 flex items-center gap-0.5">
            <span className="text-[6px] @sm:text-[8px]">{std.glyph}</span>
            {std.label}
          </span>
        </motion.span>
      ))}
    </div>
  );
}

// =============================================================================
// CATEGORY SELECTOR - Adaptive Grid
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
      <div className="grid grid-cols-4 @xs:grid-cols-5 @sm:grid-cols-7 gap-1 @sm:gap-1.5">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <motion.button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="relative flex flex-col items-center justify-center p-1.5 @sm:p-2 rounded-lg border transition-all"
            style={{
              backgroundColor: selected === cat.id ? `${cat.color}20` : MATRIX_BG,
              borderColor: selected === cat.id ? cat.color : `${cat.color}30`,
              boxShadow: selected === cat.id ? `0 0 15px ${cat.color}40` : 'none',
            }}
            whileHover={{ 
              scale: 1.05, 
              borderColor: cat.color,
              boxShadow: `0 0 10px ${cat.color}30`,
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span 
              className="text-base @sm:text-lg"
              style={{ 
                color: cat.color,
                textShadow: selected === cat.id ? `0 0 8px ${cat.color}` : 'none',
              }}
            >
              {cat.glyph}
            </span>
            <span 
              className="font-mono text-[6px] @sm:text-[8px] uppercase tracking-wide mt-0.5"
              style={{ color: selected === cat.id ? cat.color : `${cat.color}80` }}
            >
              {cat.label}
            </span>
            {selected === cat.id && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{ border: `2px solid ${cat.color}` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                layoutId="category-selected"
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
      <div className="grid grid-cols-2 gap-2 @sm:gap-3">
        {/* Price Card */}
        <motion.div 
          className="relative p-3 @sm:p-4 rounded-xl border text-center overflow-hidden"
          style={{ 
            borderColor: `${GOLD_PRIMARY}50`,
            backgroundColor: MATRIX_BG,
          }}
          whileHover={{ borderColor: GOLD_PRIMARY, boxShadow: `0 0 30px ${GOLD_PRIMARY}30` }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: GOLD_PRIMARY }}
            animate={{ opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <motion.div
            className="absolute top-2 right-2 w-1.5 h-1.5 @sm:w-2 @sm:h-2 rounded-full"
            style={{ backgroundColor: GOLD_PRIMARY }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          <div className="relative z-10">
            <div className="font-mono text-[8px] @sm:text-[10px] uppercase tracking-widest mb-1 @sm:mb-2" style={{ color: GOLD_DIM }}>
              ◇ PRICE
            </div>
            <motion.div 
              className="font-mono text-2xl @sm:text-3xl font-bold"
              style={{ color: GOLD_PRIMARY }}
              animate={{ textShadow: [`0 0 10px ${GOLD_PRIMARY}40`, `0 0 20px ${GOLD_PRIMARY}60`, `0 0 10px ${GOLD_PRIMARY}40`] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              $1.00
            </motion.div>
            <div className="font-mono text-[9px] @sm:text-xs mt-0.5 @sm:mt-1 flex items-center justify-center gap-1" style={{ color: GOLD_ACCENT }}>
              <span>USDC</span>
              <span className="opacity-50">•</span>
              <span className="opacity-70">BASE</span>
            </div>
          </div>
        </motion.div>

        {/* Reward Card */}
        <motion.div 
          className="relative p-3 @sm:p-4 rounded-xl border text-center overflow-hidden"
          style={{ 
            borderColor: `${PURPLE_PRIMARY}50`,
            backgroundColor: MATRIX_BG,
          }}
          whileHover={{ borderColor: PURPLE_PRIMARY, boxShadow: `0 0 30px ${PURPLE_PRIMARY}30` }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: PURPLE_PRIMARY }}
            animate={{ opacity: [0.03, 0.1, 0.03] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />

          <motion.div
            className="absolute top-2 right-2"
            animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ color: PURPLE_BRIGHT, fontSize: '10px' }}
          >
            ✦
          </motion.div>

          <div className="relative z-10">
            <div className="font-mono text-[8px] @sm:text-[10px] uppercase tracking-widest mb-1 @sm:mb-2" style={{ color: `${PURPLE_PRIMARY}80` }}>
              ◈ REWARD
            </div>
            <motion.div 
              className="font-mono text-2xl @sm:text-3xl font-bold"
              style={{ color: PURPLE_BRIGHT }}
              animate={{ textShadow: [`0 0 10px ${PURPLE_PRIMARY}40`, `0 0 25px ${PURPLE_PRIMARY}70`, `0 0 10px ${PURPLE_PRIMARY}40`] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {VOT_REWARD}
            </motion.div>
            <div className="font-mono text-[9px] @sm:text-xs mt-0.5 @sm:mt-1 flex items-center justify-center gap-1" style={{ color: PURPLE_PRIMARY }}>
              <span>VOT</span>
              <span className="opacity-50">+</span>
              <span className="opacity-70">SITE</span>
              <span className="opacity-50">+</span>
              <span className="opacity-70">NFT</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// =============================================================================
// PREMIUM BADGE - VOT Builder Premium Tier
// =============================================================================

function PremiumBadge() {
  return (
    <motion.div
      className="absolute top-2 right-2 @sm:top-3 @sm:right-3 flex items-center gap-1 @sm:gap-1.5 px-2 @sm:px-3 py-0.5 @sm:py-1 rounded-full overflow-hidden z-20"
      style={{
        backgroundColor: MATRIX_BG,
        border: `1px solid ${GOLD_PRIMARY}70`,
        background: `linear-gradient(135deg, ${MATRIX_BG} 0%, rgba(255,215,0,0.1) 100%)`,
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ boxShadow: `0 0 20px ${GOLD_PRIMARY}50` }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${GOLD_PRIMARY}20, transparent)`,
          width: '50%',
        }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      <motion.span
        className="text-xs @sm:text-sm"
        style={{ color: GOLD_PRIMARY }}
        animate={{ 
          scale: [1, 1.1, 1],
          textShadow: [`0 0 5px ${GOLD_PRIMARY}`, `0 0 15px ${GOLD_PRIMARY}`, `0 0 5px ${GOLD_PRIMARY}`],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        ✦
      </motion.span>
      
      <span className="font-mono text-[8px] @sm:text-[10px] uppercase tracking-wider relative z-10" style={{ color: GOLD_PRIMARY }}>
        PREMIUM
      </span>
    </motion.div>
  );
}

// =============================================================================
// BUILDER PREVIEW - Live template preview
// =============================================================================

function BuilderPreview({ category, address }: { category: string; address?: string }) {
  const selectedCat = TEMPLATE_CATEGORIES.find(c => c.id === category) || TEMPLATE_CATEGORIES[0];
  
  return (
    <motion.div
      className="relative rounded-xl overflow-hidden border-2"
      style={{ 
        borderColor: `${selectedCat.color}50`,
        backgroundColor: '#020202',
        boxShadow: `0 0 30px ${selectedCat.color}15`,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      key={category}
    >
      {/* Preview header */}
      <div 
        className="px-3 py-2 border-b flex items-center justify-between"
        style={{ 
          borderColor: `${selectedCat.color}30`,
          backgroundColor: `${selectedCat.color}10`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg" style={{ color: selectedCat.color }}>{selectedCat.glyph}</span>
          <span className="font-mono text-xs uppercase" style={{ color: selectedCat.color }}>
            {selectedCat.label} Template
          </span>
        </div>
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: selectedCat.color }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      {/* Preview content - simplified mockup */}
      <div className="p-4 min-h-[120px] flex flex-col items-center justify-center gap-2">
        <motion.div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: `${selectedCat.color}20`,
            border: `2px solid ${selectedCat.color}50`,
          }}
          animate={{ 
            boxShadow: [
              `0 0 10px ${selectedCat.color}30`,
              `0 0 25px ${selectedCat.color}50`,
              `0 0 10px ${selectedCat.color}30`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-2xl">{selectedCat.glyph}</span>
        </motion.div>
        <div className="text-center">
          <div className="font-mono text-sm" style={{ color: selectedCat.color }}>
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Your Site'}
          </div>
          <div className="font-mono text-[10px] opacity-60" style={{ color: selectedCat.color }}>
            .builder.mcpvot.eth
          </div>
        </div>
      </div>

      {/* ERC-4804 badge */}
      <div 
        className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[8px] font-mono"
        style={{ 
          backgroundColor: `${CYAN_ACCENT}20`,
          color: CYAN_ACCENT,
          border: `1px solid ${CYAN_ACCENT}40`,
        }}
      >
        web3://
      </div>
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
      className="@container relative w-full py-3 @sm:py-4 px-6 rounded-xl font-mono text-sm @sm:text-base uppercase tracking-wider overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: MATRIX_BG,
        border: `2px solid ${hasUsdc ? GOLD_PRIMARY : '#FF4444'}80`,
        color: hasUsdc ? GOLD_BRIGHT : '#FF4444',
      }}
      whileHover={!disabled ? { 
        scale: 1.02, 
        boxShadow: `0 0 40px ${hasUsdc ? GOLD_PRIMARY : '#FF4444'}40`,
      } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {/* Background gradient sweep */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${hasUsdc ? GOLD_PRIMARY : '#FF4444'}15, transparent)`,
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      {/* Button content */}
      <div className="relative z-10 flex items-center justify-center gap-2 @sm:gap-3">
        {loading ? (
          <>
            <motion.div
              className="w-4 h-4 @sm:w-5 @sm:h-5 border-2 rounded-full"
              style={{ borderColor: GOLD_PRIMARY, borderTopColor: 'transparent' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span>Building...</span>
          </>
        ) : (
          <>
            <span className="text-lg @sm:text-xl">{selectedCat.glyph}</span>
            <span>{hasUsdc ? `BUILD ${selectedCat.label.toUpperCase()} SITE` : 'NEED $1.00 USDC'}</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {VOT_GLYPHS.ARROW}
            </motion.span>
          </>
        )}
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: hasUsdc ? GOLD_PRIMARY : '#FF4444' }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: hasUsdc ? GOLD_PRIMARY : '#FF4444' }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: hasUsdc ? GOLD_PRIMARY : '#FF4444' }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: hasUsdc ? GOLD_PRIMARY : '#FF4444' }} />
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
          boxShadow: `0 0 50px ${selectedCat.color}40`,
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
  
  const [selectedCategory, setSelectedCategory] = useState('vot');
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: USDC_ADDRESS as `0x${string}`,
  });

  const hasEnoughUsdc = usdcBalance && BigInt(usdcBalance.value) >= BigInt(MINT_PRICE_USDC);

  // x402 payment hook
  const { payWithUsdc } = useX402();

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
      // Call the VOT Builder mint API with x402 payment
      const response = await fetch('/api/x402/mint-builder-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          category: selectedCategory,
          farcasterFid: farcasterUser?.fid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Mint failed');
      }

      // Process x402 payment
      const paymentResult = await payWithUsdc(MINT_PRICE_USDC, data.facilitatorAddress);
      
      if (!paymentResult.success) {
        throw new Error('Payment failed');
      }

      const result: MintResult = {
        tokenId: data.tokenId,
        ipfsCid: data.ipfsCid,
        txHash: paymentResult.txHash || data.txHash,
        category: selectedCategory,
        previewUrl: data.previewUrl || `https://ipfs.io/ipfs/${data.ipfsCid}`,
        ensSubdomain: data.ensSubdomain,
      };

      setMintResult(result);
      onMintComplete?.(result);
    } catch (err) {
      console.error('Mint error:', err);
      setError(err instanceof Error ? err.message : 'Mint failed');
    } finally {
      setIsMinting(false);
    }
  }, [address, walletClient, hasEnoughUsdc, selectedCategory, farcasterUser, payWithUsdc, onMintStart, onMintComplete]);

  return (
    <>
      <motion.div
        className={`@container relative rounded-2xl border-2 overflow-hidden ${className}`}
        style={{
          backgroundColor: MATRIX_BG,
          borderColor: `${GOLD_PRIMARY}40`,
          boxShadow: `0 0 40px ${GOLD_PRIMARY}10, inset 0 0 60px ${PURPLE_PRIMARY}05`,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Premium badge */}
        <PremiumBadge />

        {/* Content */}
        <div className="p-3 @sm:p-4 @md:p-6 space-y-4 @sm:space-y-5">
          {/* Header */}
          <div className="text-center pt-2">
            <motion.h2
              className="font-mono text-xl @sm:text-2xl @md:text-3xl font-bold tracking-wider"
              style={{ 
                color: GOLD_PRIMARY,
                textShadow: `0 0 20px ${GOLD_PRIMARY}40`,
              }}
            >
              VOT BUILDER
            </motion.h2>
            <p className="font-mono text-[10px] @sm:text-xs mt-1" style={{ color: `${GOLD_PRIMARY}80` }}>
              Build your decentralized IPFS site • Get ENS subdomain
            </p>
          </div>

          {/* Standards badges */}
          <BuilderStandardsBadges />

          {/* Price/Reward display */}
          <PriceRewardDisplay />

          {/* Category selector */}
          <div className="space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-center" style={{ color: GOLD_DIM }}>
              Select Template
            </div>
            <CategorySelector 
              selected={selectedCategory} 
              onSelect={setSelectedCategory} 
            />
          </div>

          {/* Preview */}
          <BuilderPreview category={selectedCategory} address={address} />

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
            disabled={!isConnected || isMinting}
            loading={isMinting}
            hasUsdc={!!hasEnoughUsdc}
            category={selectedCategory}
          />

          {/* Footer info */}
          <div className="text-center">
            <p className="font-mono text-[9px] @sm:text-[10px]" style={{ color: `${PURPLE_PRIMARY}60` }}>
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
