'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    BEEPER NFT MINT PAGE - FULL PREVIEW                       ║
 * ║                                                                               ║
 * ║  URL: mcpvot.xyz/beeper                                                       ║
 * ║                                                                               ║
 * ║  PLATFORMS:                                                                   ║
 * ║  ✅ Farcaster Mini-App (FIP-2 share bonus)                                   ║
 * ║  ✅ Base Network (chain 8453)                                                 ║
 * ║  ✅ Web Desktop (responsive)                                                  ║
 * ║  ✅ Mobile Web                                                                ║
 * ║                                                                               ║
 * ║  MINT FLOW:                                                                   ║
 * ║  1. Connect wallet via Farcaster/Smart Wallet                                ║
 * ║  2. Pay $0.25 USDC                                                           ║
 * ║  3. AI generates personalized tagline (OpenRouter)                           ║
 * ║  4. VRF rolls 10-tier rarity                                                 ║
 * ║  5. Generate animated SVG banner                                             ║
 * ║  6. Pin to IPFS                                                              ║
 * ║  7. Mint ERC-1155 on Base                                                    ║
 * ║  8. Receive 69,420 VOT (NO BURN for promo)                                   ║
 * ║  9. Share to Farcaster + Follow @mcpvot → +10,000 VOT                        ║
 * ║                                                                               ║
 * ║  AI: OpenRouter (FREE models - minimax-m2, mimo-v2-flash)                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import BeeperMintCardV2 from '@/components/beeper/BeeperMintCardV2';
import { EnhancedConnectButton } from '@/components/EnhancedConnectButton';
import { useFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

// =============================================================================
// CONSTANTS
// =============================================================================

const MATRIX_GREEN = '#77FE80';
const MATRIX_ACCENT = '#5DE066';
const MATRIX_DIM = '#2a4a2a';
const MATRIX_BG = '#050505';
const FARCASTER_PURPLE = '#8A63D2';

// VOT Sumerian Glyphs - NO EMOJIS
const VOT_GLYPHS = {
  BEEPER: '𒄠',    // Beeper mascot
  DINO: '𒀯',      // Dino avatar
  SIGNAL: '⚡',    // Electric/gasless
  AN: '𒀭',        // Agentic
  ARROW: '→',     // Direction
  DOT: '•',       // Separator
  VRF: '𒆷',       // Rarity
  MINT: '𒂍',      // Mint action
  CHAIN: '𒆠',     // On-chain
  MCP: '𒃲',       // Protocol
  EXTERNAL: '↗',  // External link
  BACK: '←',      // Back arrow
};

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function BeeperMintPage() {
  // Wallet state - inherited from wagmi provider (connects from main page roll over)
  const { isConnected } = useAccount();
  
  // Farcaster context
  const { context: farcasterContext } = useFarcasterContext();
  
  // Local state
  const [mounted, setMounted] = useState(false);
  
  // Hydration fix - use layout effect pattern
  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  // Handle mint completion
  const handleMintComplete = useCallback((result: { tokenId: number }) => {
    console.log('[BeeperPage] Mint complete:', result.tokenId);
  }, []);

  // Get Farcaster FID if in mini-app
  const farcasterFid = farcasterContext?.user?.fid;
  const farcasterUsername = farcasterContext?.user?.username;

  if (!mounted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: MATRIX_BG }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 rounded-full"
          style={{ borderColor: `${MATRIX_GREEN} transparent transparent transparent` }}
        />
      </div>
    );
  }

  return (
    <main 
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: MATRIX_BG }}
    >
      {/* Matrix Rain Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xs font-mono"
            style={{ 
              left: `${(i * 3.33)}%`,
              color: MATRIX_GREEN,
            }}
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ 
              y: '100vh', 
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 3 + (i % 5),
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'linear',
            }}
          >
            {String.fromCharCode(0x30A0 + Math.floor(i * 1.5))}
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 border-b" style={{ borderColor: `${MATRIX_GREEN}30` }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Back to Home + Logo */}
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="flex items-center gap-1 px-2 py-1 rounded border transition-all hover:opacity-80"
              style={{ 
                borderColor: `${MATRIX_GREEN}40`,
                color: MATRIX_GREEN,
              }}
            >
              <span>{VOT_GLYPHS.BACK}</span>
              <span className="font-mono text-xs uppercase">HOME</span>
            </Link>
            <div className="flex items-center gap-2">
              <span style={{ color: MATRIX_GREEN, fontSize: '18px' }}>{VOT_GLYPHS.BEEPER}</span>
              <span 
                className="font-mono uppercase tracking-wider text-sm font-bold"
                style={{ color: MATRIX_GREEN }}
              >
                BEEPER
              </span>
            </div>
          </div>
          
          {/* Wallet Connection - Uses same EnhancedConnectButton as main dashboard */}
          <div className="flex items-center gap-3">
            {farcasterFid && (
              <div 
                className="px-3 py-1.5 rounded-full font-mono text-xs flex items-center gap-2"
                style={{ 
                  backgroundColor: `${FARCASTER_PURPLE}20`,
                  color: FARCASTER_PURPLE,
                }}
              >
                <span>{VOT_GLYPHS.MCP}</span>
                <span>@{farcasterUsername || `fid:${farcasterFid}`}</span>
              </div>
            )}
            
            {/* My Collection Link */}
            {isConnected && (
              <Link 
                href="/beeper/collection"
                className="flex items-center gap-1 px-3 py-1.5 rounded border transition-all hover:opacity-80"
                style={{ 
                  borderColor: `${FARCASTER_PURPLE}40`,
                  backgroundColor: `${FARCASTER_PURPLE}15`,
                  color: FARCASTER_PURPLE,
                }}
              >
                <span className="font-mono text-xs uppercase">MY BEEPERS</span>
              </Link>
            )}
            
            {/* EnhancedConnectButton handles all wallet types + disconnect */}
            <EnhancedConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 py-8 transition-all duration-300">
        
        {/* Title Section */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 
            className="text-3xl md:text-4xl font-mono uppercase tracking-wider font-bold mb-2"
            style={{ color: MATRIX_GREEN }}
          >
            BEEPER MINT MACHINE
          </h1>
          <p 
            className="font-mono text-sm"
            style={{ color: MATRIX_ACCENT }}
          >
            x402 V2 Protocol • Base Network • AI-Enhanced
          </p>
        </motion.div>

        {/* Info Banner - Enhanced with step indicators */}
        <motion.div
          className="mb-6 p-5 rounded-xl border"
          style={{ 
            borderColor: `${FARCASTER_PURPLE}40`,
            backgroundColor: `${FARCASTER_PURPLE}08`,
            boxShadow: `0 0 20px ${FARCASTER_PURPLE}10`,
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start gap-4">
            <motion.span 
              className="text-3xl"
              style={{ color: MATRIX_GREEN, textShadow: `0 0 15px ${MATRIX_GREEN}` }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {VOT_GLYPHS.BEEPER}
            </motion.span>
            <div className="flex-1">
              <h3 
                className="font-mono text-base font-bold uppercase tracking-wide mb-3"
                style={{ color: MATRIX_GREEN, textShadow: `0 0 10px ${MATRIX_GREEN}40` }}
              >
                {VOT_GLYPHS.SIGNAL} x402 V2 PROMO MINT
              </h3>
              <div className="space-y-2">
                <p className="font-mono text-sm flex items-center gap-3" style={{ color: MATRIX_ACCENT }}>
                  <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: `${MATRIX_GREEN}20`, color: MATRIX_GREEN }}>1</span>
                  <span className="text-base">Pay $0.25 USDC</span>
                </p>
                <p className="font-mono text-sm flex items-center gap-3" style={{ color: MATRIX_ACCENT }}>
                  <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: `${MATRIX_GREEN}20`, color: MATRIX_GREEN }}>2</span>
                  <span className="text-base">Get AI-generated BEEPER NFT + 69,420 VOT</span>
                </p>
                <p className="font-mono text-sm flex items-center gap-3" style={{ color: FARCASTER_PURPLE }}>
                  <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: `${FARCASTER_PURPLE}20` }}>3</span>
                  <span className="text-base">Share + Follow @mcpvot {VOT_GLYPHS.ARROW} +10,000 VOT bonus</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Badge */}
        <motion.div
          className="mb-6 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div 
            className="px-3 py-1.5 rounded-full font-mono text-xs flex items-center gap-2"
            style={{ 
              backgroundColor: `${MATRIX_GREEN}15`,
              border: `1px solid ${MATRIX_GREEN}40`,
              color: MATRIX_GREEN,
            }}
          >
            <span>{VOT_GLYPHS.MCP}</span>
            <span>AI-POWERED BY OPENROUTER</span>
          </div>
        </motion.div>

        {/* The Mint Machine */}
        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="connect-prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Use new V2 Card component - shows connect state */}
              <BeeperMintCardV2
                onMintComplete={handleMintComplete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="mint-machine"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Use new V2 Card component when connected */}
              <BeeperMintCardV2
                onMintComplete={handleMintComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Grid - Enhanced with ERC-4804 */}
        <motion.div
          className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[
            { glyph: VOT_GLYPHS.VRF, label: 'VRF RARITY', detail: '10 Tiers', color: MATRIX_GREEN },
            { glyph: VOT_GLYPHS.MCP, label: 'AI TAGLINE', detail: 'OpenRouter', color: MATRIX_GREEN },
            { glyph: VOT_GLYPHS.CHAIN, label: 'IPFS PIN', detail: 'Self-Hosted', color: MATRIX_GREEN },
            { glyph: VOT_GLYPHS.MINT, label: 'ERC-4804', detail: 'On-Chain SVG', color: FARCASTER_PURPLE },
            { glyph: VOT_GLYPHS.BEEPER, label: 'FIP-2', detail: '+10K VOT', color: FARCASTER_PURPLE },
          ].map((feature) => (
            <div
              key={feature.label}
              className="p-4 rounded-lg border text-center transition-all hover:scale-105"
              style={{ 
                borderColor: `${feature.color}40`,
                backgroundColor: `${feature.color}10`,
                boxShadow: `0 0 15px ${feature.color}08`,
              }}
            >
              <div 
                className="text-3xl mb-2"
                style={{ color: feature.color, textShadow: `0 0 10px ${feature.color}60` }}
              >
                {feature.glyph}
              </div>
              <div 
                className="font-mono text-sm uppercase tracking-wider font-bold"
                style={{ color: feature.color, textShadow: `0 0 8px ${feature.color}40` }}
              >
                {feature.label}
              </div>
              <div 
                className="font-mono text-xs mt-1"
                style={{ color: MATRIX_ACCENT }}
              >
                {feature.detail}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Rarity Tiers Info - Updated with correct weights */}
        <motion.div
          className="mt-8 p-5 rounded-lg border"
          style={{ 
            borderColor: `${MATRIX_GREEN}40`,
            backgroundColor: `${MATRIX_BG}90`,
            boxShadow: `0 0 20px ${MATRIX_GREEN}10`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h3 
            className="font-mono text-base uppercase tracking-wider mb-4 text-center font-bold"
            style={{ color: MATRIX_GREEN, textShadow: `0 0 10px ${MATRIX_GREEN}40` }}
          >
            {VOT_GLYPHS.VRF} VRF RARITY TIERS
          </h3>
          <div className="grid grid-cols-5 gap-3 text-center">
            {[
              { tier: 'NODE', glyph: '𒇻', pct: '45%' },
              { tier: 'VALIDATOR', glyph: '𒁹', pct: '25%' },
              { tier: 'STAKER', glyph: '𒋼', pct: '15%' },
              { tier: 'WHALE', glyph: '𒄠', pct: '8%' },
              { tier: 'OG', glyph: '𒀭', pct: '4%' },
            ].map((r) => (
              <div key={r.tier} className="transition-transform hover:scale-110 p-2 rounded" style={{ backgroundColor: `${MATRIX_GREEN}08` }}>
                <div className="text-2xl" style={{ color: MATRIX_GREEN, textShadow: `0 0 8px ${MATRIX_GREEN}50` }}>{r.glyph}</div>
                <div 
                  className="font-mono text-xs font-bold mt-1"
                  style={{ color: MATRIX_GREEN }}
                >
                  {r.tier}
                </div>
                <div 
                  className="font-mono text-xs"
                  style={{ color: MATRIX_ACCENT }}
                >
                  {r.pct}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-3 text-center mt-4">
            {[
              { tier: 'GENESIS', glyph: '𒆳', pct: '2%', rare: true },
              { tier: 'ZZZ', glyph: '𒌋', pct: '0.5%', rare: true },
              { tier: 'FOMO', glyph: '𒀯', pct: '0.3%', rare: true },
              { tier: 'GM', glyph: '𒆷', pct: '0.15%', rare: true },
              { tier: 'X402', glyph: '𒈗', pct: '0.05%', rare: true },
            ].map((r) => (
              <div key={r.tier} className="transition-transform hover:scale-110 p-2 rounded" style={{ backgroundColor: `${FARCASTER_PURPLE}10` }}>
                <div className="text-2xl" style={{ color: FARCASTER_PURPLE, textShadow: `0 0 8px ${FARCASTER_PURPLE}50` }}>{r.glyph}</div>
                <div 
                  className="font-mono text-xs font-bold mt-1"
                  style={{ color: FARCASTER_PURPLE }}
                >
                  {r.tier}
                </div>
                <div 
                  className="font-mono text-xs"
                  style={{ color: `${FARCASTER_PURPLE}cc` }}
                >
                  {r.pct}
                </div>
              </div>
            ))}
          </div>
          <p 
            className="font-mono text-xs text-center mt-4 opacity-70"
            style={{ color: MATRIX_DIM }}
          >
            Rarity determines visual style & collector value
          </p>
        </motion.div>
      </div>

      {/* Footer - Enhanced with more links */}
      <footer 
        className="relative z-10 p-4 border-t mt-8"
        style={{ borderColor: `${MATRIX_GREEN}20` }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <span style={{ color: MATRIX_GREEN, fontSize: '16px' }}>{VOT_GLYPHS.BEEPER}</span>
              <p className="font-mono text-xs" style={{ color: MATRIX_DIM }}>
                MCPVOT x BEEPER {VOT_GLYPHS.DOT} Base Network {VOT_GLYPHS.DOT} ERC-4804
              </p>
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <a
                href="https://warpcast.com/mcpvot"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs transition-opacity hover:opacity-80"
                style={{ color: FARCASTER_PURPLE }}
              >
                {VOT_GLYPHS.MCP} @mcpvot
              </a>
              <a
                href="https://basescan.org/address/0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs transition-opacity hover:opacity-80"
                style={{ color: MATRIX_ACCENT }}
              >
                {VOT_GLYPHS.CHAIN} Contract
              </a>
              <a
                href="https://opensea.io/collection/beeper-nft-v2"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs transition-opacity hover:opacity-80"
                style={{ color: '#2081E2' }}
              >
                {VOT_GLYPHS.EXTERNAL} OpenSea
              </a>
              <Link
                href="/docs/x402"
                className="font-mono text-xs transition-opacity hover:opacity-80"
                style={{ color: MATRIX_GREEN }}
              >
                {VOT_GLYPHS.ARROW} Docs
              </Link>
            </div>
          </div>
          
          {/* Copyright */}
          <p 
            className="font-mono text-[10px] text-center mt-4 opacity-50"
            style={{ color: MATRIX_DIM }}
          >
            Built with {VOT_GLYPHS.AN} by the MCPVOT community
          </p>
        </div>
      </footer>
    </main>
  );
}
