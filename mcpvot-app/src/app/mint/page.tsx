'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  VOT MACHINE - x402 FACILITATOR MINT EXPERIENCE                              ║
 * ║                                                                               ║
 * ║  URL: mcpvot.xyz/mint                                                         ║
 * ║                                                                               ║
 * ║  PLATFORMS:                                                                   ║
 * ║  ✅ Farcaster Frame / Mini-App (mobile-first, safe areas)                    ║
 * ║  ✅ Base Network Native (chain 8453)                                          ║
 * ║  ✅ Web Desktop (responsive)                                                  ║
 * ║  ✅ Mobile Web (PWA-ready)                                                    ║
 * ║                                                                               ║
 * ║  MINT FLOW:                                                                   ║
 * ║  1. Connect wallet (Coinbase Smart Wallet / Farcaster)                       ║
 * ║  2. Fetch identity (Farcaster + ENS + Basename + Holdings)                   ║
 * ║  3. Pay $1 USDC via x402 Protocol                                            ║
 * ║  4. Receive VOT tokens (real-time quote from GeckoTerminal)                  ║
 * ║  5. 1% VOT auto-burned 🔥                                                     ║
 * ║  6. NFT minted to IPFS with ERC-1155                                         ║
 * ║  7. Get unique portal: mcpvot.xyz/{tokenId}                                  ║
 * ║                                                                               ║
 * ║  MCP MEMORY: #233 (VOT Machine v3.0), #226 (NFT Architecture), #237          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import CyberpunkMachineBackground from '@/components/CyberpunkMachineBackground';
import VOTLogoSVG from '@/components/VOTLogoSVG';
import { useFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useConnect, useDisconnect, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

// =============================================================================
// CONSTANTS & CONFIG
// =============================================================================

const CONTRACTS = {
  USDC_BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  VOT_TOKEN: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
  VOT_TREASURY: '0x8fAE8FB324900E45BaAd4867fd945De204da2DA4',
  MAXX_TOKEN: '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467',
} as const;

const MINT_PRICE_USDC = '1000000'; // $1 USDC (6 decimals)
const QUOTE_TTL_SECONDS = 20;

// 6-Trait System Colors (from MCP Memory #226)
const TRAIT_COLORS = {
  vot: { color: '#9945FF', emoji: '🔮', name: 'VOT' },
  mcpvot: { color: '#00FFCC', emoji: '⚡', name: 'MCPVOT' },
  warplet: { color: '#FF6B00', emoji: '🌀', name: 'Warplet' },
  base: { color: '#0052FF', emoji: '🔵', name: 'Base' },
  farcaster: { color: '#8A63D2', emoji: '💜', name: 'Farcaster' },
  ens: { color: '#5298FF', emoji: '🏷️', name: 'ENS' },
} as const;

// 8-Tier System (from MCP Memory #225)
const TIER_CONFIG = {
  mcpvot: { color: '#00FFCC', emoji: '⚡', name: 'MCPVOT', minTraits: 0 },
  maxx: { color: '#FFD700', emoji: '💰', name: 'MAXX', minTraits: 0 },
  warplet: { color: '#FF6B00', emoji: '🌀', name: 'Warplet', minTraits: 1 },
  ens: { color: '#5298FF', emoji: '🏷️', name: 'ENS', minTraits: 2 },
  base: { color: '#0052FF', emoji: '🔷', name: 'Base', minTraits: 3 },
  farcaster: { color: '#8A63D2', emoji: '💜', name: 'Farcaster', minTraits: 4 },
  architek: { color: '#E5E4E2', emoji: '🏛️', name: 'Architek', minTraits: 5 },
  oracle: { color: '#FFD700', emoji: '🔮', name: 'Oracle', minTraits: 6 },
} as const;

// =============================================================================
// TYPES
// =============================================================================

type TraitKey = keyof typeof TRAIT_COLORS;
type TierKey = keyof typeof TIER_CONFIG;

interface UserTraits {
  vot: boolean;
  mcpvot: boolean;
  warplet: boolean;
  base: boolean;
  farcaster: boolean;
  ens: boolean;
}

interface UserProfile {
  address: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  
  // Identity sources
  farcasterFid?: number;
  farcasterUsername?: string;
  ensName?: string;
  basename?: string;
  
  // Holdings
  votBalance: string;
  maxxBalance: string;
  hasWarpletNFT: boolean;
  
  // Computed
  traits: UserTraits;
  tier: TierKey;
  traitCount: number;
}

interface QuoteData {
  votAmount: number;
  pricePerVotUsd: number;
  expiresAt: string;
  priceSource: string;
}

interface MintStep {
  id: string;
  label: string;
  emoji: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  detail?: string;
}

interface MintResult {
  tokenId: number;
  ipfsCid: string;
  votSent: string;
  votBurned: string;
  txHash: string;
  portalUrl: string;
}

// =============================================================================
// ABI
// =============================================================================

const USDC_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatBalance(balance: string, decimals: number = 18): string {
  const num = parseFloat(formatUnits(BigInt(balance || '0'), decimals));
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

function calculateTraits(profile: Partial<UserProfile>): UserTraits {
  const votBalance = parseFloat(profile.votBalance || '0');
  const maxxBalance = parseFloat(profile.maxxBalance || '0');
  
  return {
    vot: votBalance > 0,
    mcpvot: maxxBalance > 0 || votBalance >= 10000, // Legacy or high holder
    warplet: profile.hasWarpletNFT || false,
    base: !!profile.basename,
    farcaster: !!profile.farcasterFid,
    ens: !!profile.ensName,
  };
}

function countTraits(traits: UserTraits): number {
  return Object.values(traits).filter(Boolean).length;
}

function getTierFromTraits(traits: UserTraits): TierKey {
  const count = countTraits(traits);
  if (count >= 6) return 'oracle';
  if (count >= 5) return 'architek';
  if (count >= 4) return 'farcaster';
  if (count >= 3) return 'base';
  if (count >= 2) return 'ens';
  if (count >= 1) return 'warplet';
  if (traits.mcpvot) return 'maxx';
  return 'mcpvot';
}

// =============================================================================
// COMPONENTS
// =============================================================================

// Terminal-style scanline overlay (from AboutPage)
function ScanlineOverlay() {
  return (
    <>
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,255,255,0.03)_50%)] bg-[size:100%_4px]" />
      </div>
      {/* Grid pattern */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>
    </>
  );
}

// Animated Background Glyphs (from MCP Memory #232)
function GlyphBackground() {
  const glyphs = ['𒆜', '𒄑', '𒀭', '𒁹', '𒃲', '𒇻', '𒆠', '𒉿', '𒈦', '𒂗'];
  // Pre-computed positions to avoid impure Math.random() during render
  const positions = [40, 120, 200, 280, 360, 80, 160, 240, 320, 400];
  const durations = [12, 14, 16, 18, 20, 13, 15, 17, 19, 11];
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[2] opacity-20">
      {glyphs.map((glyph, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl text-[#00FFFF]"
          style={{ left: positions[i] }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ 
            y: 800,
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{ 
            duration: durations[i],
            repeat: Infinity,
            delay: i * 2,
            ease: 'linear'
          }}
        >
          {glyph}
        </motion.div>
      ))}
    </div>
  );
}

// Trait Badge Component - Terminal Style
function TraitBadge({ 
  traitKey, 
  active,
  size = 'md'
}: { 
  traitKey: TraitKey; 
  active: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const trait = TRAIT_COLORS[traitKey];
  const sizeClasses = {
    sm: 'px-3 py-2 text-xs gap-2',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2',
  };
  
  return (
    <motion.div
      className={`
        flex items-center ${sizeClasses[size]} rounded border-2 transition-all font-mono uppercase tracking-wider
        ${active 
          ? 'bg-black/80 backdrop-blur-sm' 
          : 'bg-black/40 opacity-40 border-gray-700'
        }
      `}
      style={active ? { 
        borderColor: trait.color,
        boxShadow: `0 0 15px ${trait.color}30`,
      } : undefined}
      whileHover={active ? { boxShadow: `0 0 25px ${trait.color}50` } : undefined}
    >
      <span>{trait.emoji}</span>
      <span style={{ color: active ? trait.color : '#666' }}>{trait.name}</span>
      {active && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-[#00FF88]"
        >
          ✓
        </motion.span>
      )}
    </motion.div>
  );
}

// Tier Badge Component - Terminal Style
function TierBadge({ tier }: { tier: TierKey }) {
  const config = TIER_CONFIG[tier];
  
  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2 rounded border-2 font-mono uppercase tracking-wider backdrop-blur-sm"
      style={{ 
        borderColor: config.color,
        backgroundColor: `${config.color}15`,
        boxShadow: `0 0 20px ${config.color}30`,
      }}
      animate={{ 
        boxShadow: [
          `0 0 20px ${config.color}30`,
          `0 0 40px ${config.color}50`,
          `0 0 20px ${config.color}30`,
        ]
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span className="text-xl">{config.emoji}</span>
      <div>
        <div className="text-[10px] opacity-60">TIER</div>
        <div className="text-sm font-bold" style={{ color: config.color }}>{config.name}</div>
      </div>
    </motion.div>
  );
}

// Quote Countdown Component - Terminal Style
function QuoteCountdown({ expiresAt }: { expiresAt: string }) {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSeconds(remaining);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  const isLow = seconds < 5;
  
  return (
    <div className={`font-mono text-xs uppercase tracking-wider ${isLow ? 'text-red-400 animate-pulse' : 'text-gray-500'}`}>
      EXPIRES: {seconds}s
    </div>
  );
}

// Mint Step Component - Terminal Style
function MintStepItem({ step, isActive }: { step: MintStep; isActive: boolean }) {
  const statusConfig = {
    pending: { border: 'border-gray-700', text: 'text-gray-600', bg: 'bg-black/20' },
    active: { border: 'border-[#00FFFF]', text: 'text-[#00FFFF]', bg: 'bg-[#00FFFF]/10' },
    complete: { border: 'border-[#00FF88]', text: 'text-[#00FF88]', bg: 'bg-[#00FF88]/10' },
    error: { border: 'border-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
  };
  
  const config = statusConfig[step.status];
  
  return (
    <motion.div
      className={`flex items-center gap-3 p-3 rounded border-2 ${config.border} ${config.bg} font-mono`}
      animate={isActive ? { 
        boxShadow: ['0 0 10px rgba(0,255,255,0.2)', '0 0 20px rgba(0,255,255,0.4)', '0 0 10px rgba(0,255,255,0.2)']
      } : {}}
      transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
    >
      <span className="text-xl">{step.emoji}</span>
      <div className="flex-1">
        <div className={`font-medium uppercase tracking-wider text-sm ${config.text}`}>{step.label}</div>
        {step.detail && <div className="text-xs text-gray-500 mt-0.5">{step.detail}</div>}
      </div>
      {step.status === 'complete' && <span className="text-[#00FF88] text-lg">✓</span>}
      {step.status === 'active' && (
        <div className="w-4 h-4 border-2 border-[#00FFFF] border-t-transparent rounded-full animate-spin" />
      )}
      {step.status === 'error' && <span className="text-red-400 text-lg">✕</span>}
    </motion.div>
  );
}

// =============================================================================
// RECENT MINTERS SECTION - Animated User Profiles
// =============================================================================

interface RecentMinter {
  tokenId: string;
  address: string;
  farcasterUsername?: string;
  ensName?: string;
  basename?: string;
  tier: string;
  traits: string[];
  votReceived: string;
  mintedAt: string;
  portalUrl: string;
}

// Animated Minter Card - SVG Machine Style
function MinterCard({ minter, index }: { minter: RecentMinter; index: number }) {
  const tierColors: Record<string, { border: string; glow: string; text: string }> = {
    oracle: { border: '#9945FF', glow: 'rgba(153,69,255,0.5)', text: '#9945FF' },
    architek: { border: '#00FFCC', glow: 'rgba(0,255,204,0.5)', text: '#00FFCC' },
    base: { border: '#0052FF', glow: 'rgba(0,82,255,0.5)', text: '#0052FF' },
    farcaster: { border: '#8A63D2', glow: 'rgba(138,99,210,0.5)', text: '#8A63D2' },
    warplet: { border: '#FF6B00', glow: 'rgba(255,107,0,0.5)', text: '#FF6B00' },
  };
  
  const tierStyle = tierColors[minter.tier.toLowerCase()] || tierColors.base;
  const displayName = minter.farcasterUsername || minter.ensName || minter.basename || `${minter.address.slice(0, 6)}...${minter.address.slice(-4)}`;
  
  return (
    <motion.a
      href={minter.portalUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group relative block"
    >
      {/* Animated Border Container */}
      <div 
        className="relative p-[2px] rounded-lg overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${tierStyle.border}40, transparent 50%, ${tierStyle.border}20)`,
        }}
      >
        {/* Animated Edge Glow */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `conic-gradient(from var(--angle), ${tierStyle.border}, transparent 20%, ${tierStyle.border} 40%, transparent 60%, ${tierStyle.border} 80%, transparent)`,
            filter: `blur(2px)`,
          }}
          animate={{
            '--angle': ['0deg', '360deg'],
          } as Record<string, string[]>}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Card Content */}
        <div className="relative bg-black/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4">
          {/* Avatar/Token ID */}
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-sm border-2"
            style={{
              borderColor: tierStyle.border,
              boxShadow: `0 0 20px ${tierStyle.glow}`,
              color: tierStyle.text,
            }}
          >
            #{minter.tokenId}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span 
                className="font-mono text-sm font-bold truncate"
                style={{ color: tierStyle.text }}
              >
                {displayName}
              </span>
              {minter.farcasterUsername && (
                <span className="text-xs text-[#8A63D2]">💜</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span 
                className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${tierStyle.border}20`,
                  color: tierStyle.text,
                }}
              >
                {minter.tier}
              </span>
              <span className="font-mono text-[10px] text-gray-500">
                {minter.traits.length} traits
              </span>
            </div>
          </div>
          
          {/* VOT Amount */}
          <div className="text-right">
            <div className="font-mono text-xs text-[#00FF88]">
              +{Number(minter.votReceived).toLocaleString()} VOT
            </div>
            <div className="font-mono text-[10px] text-gray-600">
              {new Date(minter.mintedAt).toLocaleDateString()}
            </div>
          </div>
          
          {/* Arrow indicator */}
          <motion.div
            className="text-gray-600 group-hover:text-[#00FFFF] transition-colors"
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.div>
        </div>
      </div>
    </motion.a>
  );
}

// Main Recent Minters Section
function RecentMintersSection() {
  const [minters, setMinters] = useState<RecentMinter[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRecentMinters = async () => {
      try {
        // TODO: Replace with actual API call to fetch recent mints
        // For now, use mock data demonstrating the feature
        const mockMinters: RecentMinter[] = [
          {
            tokenId: '42',
            address: '0x8fAE8FB324900E45BaAd4867fd945De204da2DA4',
            farcasterUsername: 'votmachine',
            tier: 'Oracle',
            traits: ['vot', 'mcpvot', 'farcaster', 'base', 'ens', 'warplet'],
            votReceived: '100000',
            mintedAt: new Date().toISOString(),
            portalUrl: '/42',
          },
          {
            tokenId: '41',
            address: '0xabcdef1234567890abcdef1234567890abcdef12',
            farcasterUsername: 'builder.eth',
            ensName: 'builder.eth',
            tier: 'Architek',
            traits: ['vot', 'mcpvot', 'farcaster', 'base'],
            votReceived: '100000',
            mintedAt: new Date(Date.now() - 3600000).toISOString(),
            portalUrl: '/41',
          },
          {
            tokenId: '40',
            address: '0x1234567890abcdef1234567890abcdef12345678',
            basename: 'alice.base',
            tier: 'Base',
            traits: ['vot', 'base'],
            votReceived: '100000',
            mintedAt: new Date(Date.now() - 7200000).toISOString(),
            portalUrl: '/40',
          },
          {
            tokenId: '39',
            address: '0x9876543210fedcba9876543210fedcba98765432',
            farcasterUsername: 'warpcast-user',
            tier: 'Farcaster',
            traits: ['vot', 'farcaster', 'warplet'],
            votReceived: '100000',
            mintedAt: new Date(Date.now() - 14400000).toISOString(),
            portalUrl: '/39',
          },
        ];
        
        setMinters(mockMinters);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch recent minters:', error);
        setLoading(false);
      }
    };
    
    fetchRecentMinters();
  }, []);
  
  if (loading) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-3">
          <div className="w-4 h-4 border-2 border-[#00FFFF] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
            Loading recent builders...
          </span>
        </div>
      </section>
    );
  }
  
  if (minters.length === 0) {
    return null;
  }
  
  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      {/* Section Header - Terminal Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#00FFFF]/30 to-transparent" />
          <h2 className="font-mono text-sm uppercase tracking-widest text-[#00FFFF]">
            {'>'} RECENT BUILDERS
          </h2>
          <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#00FFFF]/30 to-transparent" />
        </div>
        <p className="text-center font-mono text-xs text-gray-600">
          Click to explore their unique VOT Machine portals
        </p>
      </motion.div>
      
      {/* Minters Grid */}
      <div className="space-y-3">
        {minters.map((minter, index) => (
          <MinterCard key={minter.tokenId} minter={minter} index={index} />
        ))}
      </div>
      
      {/* View All Link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <Link
          href="/rankings"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-gray-500 hover:text-[#00FF88] transition-colors group"
        >
          <span>VIEW ALL BUILDERS</span>
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="group-hover:text-[#00FF88]"
          >
            →
          </motion.span>
        </Link>
      </motion.div>
    </section>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function VOTMachineMintPage() {
  // Wallet State
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Farcaster Context
  const { isInMiniApp, user: farcasterUser } = useFarcasterContext();
  
  // Balances
  const { data: usdcBalance } = useBalance({
    address,
    token: CONTRACTS.USDC_BASE as `0x${string}`,
  });
  
  // VOT Balance (used in profile display)
  useBalance({
    address,
    token: CONTRACTS.VOT_TOKEN as `0x${string}`,
  });
  
  // USDC Allowance
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.USDC_BASE as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.VOT_TREASURY as `0x${string}`] : undefined,
  });
  
  // Write Contract
  const { writeContract, data: txHash } = useWriteContract();
  useWaitForTransactionReceipt({ hash: txHash });
  
  // Page State
  const [phase, setPhase] = useState<'connect' | 'profile' | 'mint' | 'success'>('connect');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Quote State
  const [quote, setQuote] = useState<QuoteData | null>(null);
  
  // Mint State
  const [mintSteps, setMintSteps] = useState<MintStep[]>([
    { id: 'approve', label: 'Approve USDC', emoji: '💳', status: 'pending' },
    { id: 'payment', label: 'x402 Payment', emoji: '💸', status: 'pending' },
    { id: 'vot', label: 'Receive VOT', emoji: '🔮', status: 'pending' },
    { id: 'burn', label: 'Burn 1% VOT', emoji: '🔥', status: 'pending' },
    { id: 'ipfs', label: 'Pin to IPFS', emoji: '📌', status: 'pending' },
    { id: 'mint', label: 'Mint NFT', emoji: '🎨', status: 'pending' },
  ]);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  
  // Connectors
  const coinbaseConnector = connectors.find(c => 
    c.id === 'coinbaseWalletSDK' || c.name === 'Coinbase Wallet'
  );
  
  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  
  // Auto-advance to profile phase when connected
  useEffect(() => {
    if (isConnected && address) {
      setPhase('profile');
      fetchProfile();
    } else {
      setPhase('connect');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);
  
  // Auto-fetch quote when on profile phase
  useEffect(() => {
    if (phase === 'profile' || phase === 'mint') {
      fetchQuote();
      const interval = setInterval(fetchQuote, QUOTE_TTL_SECONDS * 1000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  
  // ==========================================================================
  // API CALLS
  // ==========================================================================
  
  const fetchProfile = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/machine/profile?address=${address}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      
      const data = await res.json();
      const traits = calculateTraits(data);
      const tier = getTierFromTraits(traits);
      
      setProfile({
        address,
        displayName: data.displayName || truncateAddress(address),
        avatar: data.avatar || data.farcasterPfp,
        bio: data.bio || data.farcasterBio,
        farcasterFid: data.farcasterFid,
        farcasterUsername: data.farcasterUsername,
        ensName: data.ensName,
        basename: data.basename,
        votBalance: data.votBalance || '0',
        maxxBalance: data.maxxBalance || '0',
        hasWarpletNFT: data.hasWarpletNFT || false,
        traits,
        tier,
        traitCount: countTraits(traits),
      });
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [address]);
  
  const fetchQuote = useCallback(async () => {
    setQuoteLoading(true);
    try {
      const res = await fetch('/api/vot/order?usdAmount=1');
      if (!res.ok) throw new Error('Quote failed');
      
      const data = await res.json();
      setQuote({
        votAmount: data.quote?.votAmount || data.votAmount,
        pricePerVotUsd: data.quote?.pricePerVotUsd || data.pricePerVotUsd,
        expiresAt: data.quote?.expiresAt || new Date(Date.now() + 20000).toISOString(),
        priceSource: data.quote?.priceSource || 'fallback',
      });
    } catch (err) {
      console.error('Quote fetch error:', err);
    } finally {
      setQuoteLoading(false);
    }
  }, []);
  
  // ==========================================================================
  // MINT HANDLERS
  // ==========================================================================
  
  const updateStep = (stepId: string, update: Partial<MintStep>) => {
    setMintSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...update } : s));
  };
  
  const handleStartMint = async () => {
    if (!profile || !address) return;
    setPhase('mint');
    setError(null);
    
    try {
      // Step 1: Check/Approve USDC
      setCurrentStepId('approve');
      updateStep('approve', { status: 'active' });
      
      const needsApproval = !usdcAllowance || BigInt(usdcAllowance.toString()) < BigInt(MINT_PRICE_USDC);
      
      if (needsApproval) {
        writeContract({
          address: CONTRACTS.USDC_BASE as `0x${string}`,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [CONTRACTS.VOT_TREASURY as `0x${string}`, BigInt(MINT_PRICE_USDC)],
        });
        
        // Wait for approval confirmation (simplified - in production use proper tx watching)
        await new Promise(r => setTimeout(r, 3000));
        await refetchAllowance();
      }
      
      updateStep('approve', { status: 'complete', detail: 'USDC approved' });
      
      // Step 2: x402 Payment
      setCurrentStepId('payment');
      updateStep('payment', { status: 'active' });
      
      // Generate SVG content for the NFT
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#0a0a0a"/>
        <rect x="10" y="10" width="380" height="280" rx="8" fill="none" stroke="#00FF88" stroke-width="2"/>
        <text x="200" y="40" text-anchor="middle" font-family="monospace" font-size="16" fill="#00D4FF">VOT MACHINE // BUILDER NFT</text>
        <text x="200" y="80" text-anchor="middle" font-family="monospace" font-size="14" fill="#00FF88">TIER: ${profile.tier}</text>
        <text x="200" y="120" text-anchor="middle" font-family="monospace" font-size="12" fill="#FFFFFF">${profile.displayName || address?.slice(0, 10)}</text>
        <text x="200" y="160" text-anchor="middle" font-family="monospace" font-size="10" fill="#888888">${profile.basename || profile.ensName || ''}</text>
        <text x="200" y="260" text-anchor="middle" font-family="monospace" font-size="10" fill="#00FF88">x402 PROTOCOL • BASE NETWORK</text>
      </svg>`;
      
      const mintRes = await fetch('/api/x402/mint-builder-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          svgContent, // Required by API
          profile: {
            displayName: profile.displayName,
            avatar: profile.avatar,
            bio: profile.bio,
            farcasterUsername: profile.farcasterUsername,
            ensName: profile.ensName,
            basename: profile.basename,
            traits: profile.traits,
            tier: profile.tier,
          },
        }),
      });
      
      if (!mintRes.ok) {
        const errData = await mintRes.json();
        throw new Error(errData.error || 'Mint failed');
      }
      
      const result = await mintRes.json();
      
      updateStep('payment', { status: 'complete', detail: '$1 USDC processed' });
      
      // Step 3: VOT received
      setCurrentStepId('vot');
      updateStep('vot', { status: 'active' });
      await new Promise(r => setTimeout(r, 500));
      updateStep('vot', { status: 'complete', detail: `${formatBalance(result.votSent)} VOT` });
      
      // Step 4: Burn
      setCurrentStepId('burn');
      updateStep('burn', { status: 'active' });
      await new Promise(r => setTimeout(r, 500));
      updateStep('burn', { status: 'complete', detail: `${formatBalance(result.votBurned)} VOT burned` });
      
      // Step 5: IPFS
      setCurrentStepId('ipfs');
      updateStep('ipfs', { status: 'active' });
      await new Promise(r => setTimeout(r, 500));
      updateStep('ipfs', { status: 'complete', detail: result.ipfsCid?.slice(0, 12) + '...' });
      
      // Step 6: NFT Minted
      setCurrentStepId('mint');
      updateStep('mint', { status: 'active' });
      await new Promise(r => setTimeout(r, 500));
      updateStep('mint', { status: 'complete', detail: `Token #${result.tokenId}` });
      
      // Success!
      setMintResult({
        tokenId: result.tokenId,
        ipfsCid: result.ipfsCid,
        votSent: result.votSent,
        votBurned: result.votBurned,
        txHash: result.txHash,
        portalUrl: `https://mcpvot.xyz/${result.tokenId}`,
      });
      
      setPhase('success');
      
    } catch (err) {
      console.error('Mint error:', err);
      setError(err instanceof Error ? err.message : 'Mint failed');
      if (currentStepId) {
        updateStep(currentStepId, { status: 'error', detail: 'Failed' });
      }
    }
  };
  
  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Cyberpunk Machine Background - Animated Edges (NO PARTICLES) */}
      <CyberpunkMachineBackground />
      
      {/* Scanline + Grid Overlay */}
      <ScanlineOverlay />
      
      {/* Glyph Animation */}
      <GlyphBackground />
      
      {/* Safe Area Container (for Farcaster Mini-App) */}
      <div className="relative z-10 safe-top safe-bottom safe-left safe-right">
        
        {/* Header - Terminal Style */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-black/90 border-b-2 border-[#00FFFF]/30 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 drop-shadow-[0_0_20px_rgba(0,255,255,0.6)]">
                <VOTLogoSVG className="w-full h-full" />
              </div>
              <div>
                <span className="font-mono uppercase tracking-wider text-[#00FFFF] text-sm font-bold group-hover:drop-shadow-[0_0_20px_rgba(0,255,255,1)] transition-all">
                  VOT MACHINE
                </span>
                <span className="block text-[10px] text-[#00FF88]/60 font-mono tracking-widest">
                  x402 FACILITATOR
                </span>
              </div>
            </Link>
            
            {isConnected && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-[#00FFFF]/40 rounded">
                  <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
                  <span className="font-mono text-xs text-[#00FFFF]">
                    {truncateAddress(address || '')}
                  </span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="px-3 py-1.5 font-mono text-xs uppercase tracking-wider border border-red-500/50 text-red-400 rounded hover:bg-red-500/10 hover:border-red-400 hover:shadow-[0_0_20px_rgba(255,0,0,0.3)] transition-all touch-target"
                >
                  ✕ EXIT
                </button>
              </div>
            )}
          </div>
        </header>
        
        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            
            {/* ============================================================ */}
            {/* PHASE: CONNECT WALLET                                        */}
            {/* ============================================================ */}
            {phase === 'connect' && (
              <motion.div
                key="connect"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                {/* Logo with glow */}
                <motion.div
                  className="w-24 h-24 mx-auto mb-8 drop-shadow-[0_0_40px_rgba(0,255,255,1)]"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <VOTLogoSVG className="w-full h-full" />
                </motion.div>
                
                <h1 className="text-3xl sm:text-4xl font-mono uppercase tracking-wider mb-4">
                  <span className="text-[#00FFFF] drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">{'>'} x402</span>{' '}
                  <span className="text-white">VOT MACHINE</span>
                </h1>
                
                <p className="text-gray-400 font-mono text-sm mb-8 max-w-md mx-auto">
                  Mint your identity NFT powered by the x402 Facilitator.
                  <br />
                  Pay $1 USDC • Receive VOT tokens • Get your unique portal.
                </p>
                
                {/* Connect Button - Terminal Style */}
                <motion.button
                  onClick={() => coinbaseConnector && connect({ connector: coinbaseConnector })}
                  className="px-8 py-4 bg-black/80 border-2 border-[#00FFFF]/60 rounded font-mono uppercase tracking-wider text-[#00FFFF] text-lg font-bold shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:shadow-[0_0_50px_rgba(0,255,255,0.6)] hover:border-[#00FFFF] hover:bg-[#00FFFF]/10 transition-all touch-target"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {'>'} CONNECT WALLET
                </motion.button>
                
                {isInMiniApp && farcasterUser && (
                  <p className="font-mono text-xs text-[#9F7AEA] mt-4 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#9F7AEA] animate-pulse" />
                    FARCASTER: @{farcasterUser.username}
                  </p>
                )}
                
                {/* Features Grid - Terminal Cards */}
                <div className="grid grid-cols-3 gap-4 mt-12">
                  {[
                    { emoji: '💸', label: 'PAY $1 USDC', color: '#00FF88' },
                    { emoji: '🔮', label: 'GET VOT', color: '#00FFFF' },
                    { emoji: '🔥', label: '1% BURNED', color: '#FF8800' },
                  ].map((f, i) => (
                    <motion.div
                      key={f.label}
                      className="p-4 bg-black/60 border-2 rounded backdrop-blur-sm"
                      style={{ 
                        borderColor: `${f.color}40`,
                        boxShadow: `0 0 20px ${f.color}20`,
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      whileHover={{ borderColor: f.color, boxShadow: `0 0 30px ${f.color}40` }}
                    >
                      <div className="text-2xl mb-2">{f.emoji}</div>
                      <div className="font-mono text-xs uppercase tracking-wider" style={{ color: f.color }}>
                        {f.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Protocol Info */}
                <div className="mt-12 bg-black/60 border-2 border-[#9F7AEA]/30 rounded p-6 text-left backdrop-blur-sm shadow-[0_0_20px_rgba(159,122,234,0.2)]">
                  <h3 className="font-mono uppercase tracking-wider text-[#9F7AEA] mb-4">
                    {'>'} MINT FLOW
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                    {[
                      { step: '01', text: 'CONNECT', icon: '🔗' },
                      { step: '02', text: 'IDENTITY', icon: '👤' },
                      { step: '03', text: 'PAY $1', icon: '💳' },
                      { step: '04', text: 'GET VOT', icon: '🔮' },
                      { step: '05', text: 'BURN 1%', icon: '🔥' },
                      { step: '06', text: 'MINT NFT', icon: '🎨' },
                    ].map(item => (
                      <div key={item.step} className="flex items-center gap-2 text-gray-400">
                        <span className="text-[#9F7AEA]/60">{item.step}</span>
                        <span>{item.icon}</span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* ============================================================ */}
            {/* PHASE: PROFILE & READY TO MINT                               */}
            {/* ============================================================ */}
            {phase === 'profile' && profile && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Identity Card - Terminal Style */}
                <div className="bg-black/80 border-2 border-[#00FFFF]/40 rounded backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                  {/* Banner */}
                  <div className="h-20 bg-gradient-to-r from-[#00FFFF]/10 via-[#9F7AEA]/10 to-[#00FF88]/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(0,255,255,0.1),transparent)] animate-shimmer-slow" />
                  </div>
                  
                  <div className="px-6 py-4 -mt-10">
                    {/* Avatar & Name */}
                    <div className="flex items-end gap-4 mb-4">
                      <div className="w-20 h-20 rounded border-2 border-[#00FFFF] bg-black flex items-center justify-center text-3xl overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.4)]">
                        {profile.avatar ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#00FFFF]">{profile.displayName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <h2 className="text-xl font-mono uppercase tracking-wider text-white">{profile.displayName}</h2>
                        <p className="text-xs text-[#00FFFF]/60 font-mono">{truncateAddress(profile.address)}</p>
                      </div>
                      <TierBadge tier={profile.tier} />
                    </div>
                    
                    {/* Identity Sources */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.farcasterUsername && (
                        <span className="px-3 py-1.5 bg-[#9F7AEA]/10 border border-[#9F7AEA]/40 text-[#9F7AEA] rounded font-mono text-xs uppercase tracking-wider">
                          💜 @{profile.farcasterUsername}
                        </span>
                      )}
                      {profile.ensName && (
                        <span className="px-3 py-1.5 bg-[#00FFFF]/10 border border-[#00FFFF]/40 text-[#00FFFF] rounded font-mono text-xs">
                          🔵 {profile.ensName}
                        </span>
                      )}
                      {profile.basename && (
                        <span className="px-3 py-1.5 bg-[#00FF88]/10 border border-[#00FF88]/40 text-[#00FF88] rounded font-mono text-xs">
                          🔷 {profile.basename}
                        </span>
                      )}
                    </div>
                    
                    {/* Bio */}
                    {profile.bio && (
                      <p className="text-sm text-gray-400 font-mono mb-4 line-clamp-2 border-l-2 border-[#00FFFF]/40 pl-3">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* 6-Trait System - Terminal Grid */}
                <div className="bg-black/80 border-2 border-[#00FF88]/40 rounded p-5 backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                  <div className="font-mono text-sm mb-4 flex items-center justify-between">
                    <span className="text-[#00FF88] uppercase tracking-wider">{'>'} IDENTITY TRAITS</span>
                    <span className="text-white">{profile.traitCount}<span className="text-gray-500">/6</span> ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(Object.keys(TRAIT_COLORS) as TraitKey[]).map(key => (
                      <TraitBadge key={key} traitKey={key} active={profile.traits[key]} size="sm" />
                    ))}
                  </div>
                </div>
                
                {/* Balances - Terminal Style */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/80 border-2 border-[#9F7AEA]/40 rounded p-4 text-center shadow-[0_0_20px_rgba(159,122,234,0.2)]">
                    <div className="text-3xl font-mono font-bold text-[#9F7AEA] drop-shadow-[0_0_10px_rgba(159,122,234,0.6)]">
                      {formatBalance(profile.votBalance)}
                    </div>
                    <div className="font-mono text-xs text-gray-500 uppercase tracking-wider mt-1">VOT BALANCE</div>
                  </div>
                  <div className="bg-black/80 border-2 border-[#00FF88]/40 rounded p-4 text-center shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                    <div className="text-3xl font-mono font-bold text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,0.6)]">
                      {usdcBalance ? parseFloat(formatUnits(usdcBalance.value, 6)).toFixed(2) : '0.00'}
                    </div>
                    <div className="font-mono text-xs text-gray-500 uppercase tracking-wider mt-1">USDC BALANCE</div>
                  </div>
                </div>
                
                {/* Quote Card - Terminal Style */}
                <div className="bg-black/80 border-2 border-[#FF8800]/40 rounded p-5 backdrop-blur-sm shadow-[0_0_30px_rgba(255,136,0,0.2)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-sm uppercase tracking-wider text-[#FF8800]">{'>'} x402 QUOTE</span>
                    {quote && <QuoteCountdown expiresAt={quote.expiresAt} />}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-mono font-bold text-white">$1<span className="text-lg text-gray-500">.00</span></div>
                      <div className="font-mono text-xs text-gray-500 uppercase tracking-wider mt-1">YOU PAY (USDC)</div>
                    </div>
                    <div className="text-center border-l border-gray-800 pl-6">
                      <div className="text-4xl font-mono font-bold text-[#00FFFF] drop-shadow-[0_0_20px_rgba(0,255,255,0.6)]">
                        {quote ? (quote.votAmount >= 1000 ? `${(quote.votAmount / 1000).toFixed(0)}K` : quote.votAmount.toLocaleString()) : '---'}
                      </div>
                      <div className="font-mono text-xs text-gray-500 uppercase tracking-wider mt-1">YOU RECEIVE (VOT)</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between font-mono text-xs">
                    <span className="text-[#FF8800]">🔥 1% AUTO-BURN</span>
                    <span className="text-[#00FF88]">⛽ GASLESS VIA VAULT</span>
                  </div>
                </div>
                
                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border-2 border-red-500/50 rounded p-4 text-red-400 font-mono text-sm">
                    <span className="text-red-500">{'>'} ERROR:</span> {error}
                  </div>
                )}
                
                {/* Mint Button - Terminal Style */}
                <motion.button
                  onClick={handleStartMint}
                  disabled={!usdcBalance || parseFloat(formatUnits(usdcBalance.value, 6)) < 1}
                  className="w-full py-5 bg-black/80 border-2 border-[#00FFFF] rounded font-mono uppercase tracking-wider text-[#00FFFF] text-lg font-bold shadow-[0_0_40px_rgba(0,255,255,0.4)] hover:shadow-[0_0_60px_rgba(0,255,255,0.6)] hover:bg-[#00FFFF]/10 transition-all touch-target disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-transparent"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {'>'} MINT VOT MACHINE NFT ($1)
                </motion.button>
                
                {usdcBalance && parseFloat(formatUnits(usdcBalance.value, 6)) < 1 && (
                  <p className="text-center font-mono text-xs text-red-400">
                    ⚠ INSUFFICIENT USDC - NEED $1.00 MINIMUM
                  </p>
                )}
              </motion.div>
            )}
            
            {/* ============================================================ */}
            {/* PHASE: MINTING IN PROGRESS                                   */}
            {/* ============================================================ */}
            {phase === 'mint' && (
              <motion.div
                key="mint"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <motion.div
                    className="w-16 h-16 mx-auto mb-4 drop-shadow-[0_0_40px_rgba(0,255,255,0.8)]"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <VOTLogoSVG className="w-full h-full" />
                  </motion.div>
                  <h2 className="text-2xl font-mono uppercase tracking-wider text-[#00FFFF]">
                    {'>'} MINTING YOUR NFT
                  </h2>
                  <p className="text-gray-400 font-mono text-sm mt-2">
                    Processing x402 transaction...
                  </p>
                </div>
                
                {/* Steps - Terminal Style */}
                <div className="bg-black/80 border-2 border-[#00FFFF]/40 rounded p-4 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                  <div className="space-y-2">
                    {mintSteps.map(step => (
                      <MintStepItem 
                        key={step.id} 
                        step={step} 
                        isActive={step.id === currentStepId}
                      />
                    ))}
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-500/10 border-2 border-red-500/50 rounded p-4 text-red-400 font-mono text-sm">
                    <span className="text-red-500">{'>'} ERROR:</span> {error}
                    <button 
                      onClick={() => setPhase('profile')}
                      className="block mt-3 text-[#00FFFF] hover:underline font-mono text-xs uppercase tracking-wider"
                    >
                      {'>'} TRY AGAIN
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* ============================================================ */}
            {/* PHASE: SUCCESS                                               */}
            {/* ============================================================ */}
            {phase === 'success' && mintResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  className="text-6xl mb-6"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 0.5 }}
                >
                  🎉
                </motion.div>
                
                <h2 className="text-3xl font-mono uppercase tracking-wider mb-2">
                  <span className="text-[#00FF88] drop-shadow-[0_0_20px_rgba(0,255,136,0.8)]">{'>'} NFT MINTED!</span>
                </h2>
                
                <p className="text-gray-400 font-mono text-sm mb-8">
                  Your VOT Machine NFT is now live on Base
                </p>
                
                {/* Result Card - Terminal Style */}
                <div className="bg-black/80 border-2 border-[#00FF88]/40 rounded p-6 text-left space-y-4 mb-8 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,136,0.2)]">
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">TOKEN ID</span>
                    <span className="font-mono text-lg text-[#00FFFF]">#{mintResult.tokenId}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">VOT RECEIVED</span>
                    <span className="font-mono text-lg text-[#00FF88]">{formatBalance(mintResult.votSent)} VOT</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">VOT BURNED 🔥</span>
                    <span className="font-mono text-lg text-[#FF8800]">{formatBalance(mintResult.votBurned)} VOT</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">IPFS CID</span>
                    <span className="font-mono text-xs text-gray-400">{mintResult.ipfsCid.slice(0, 16)}...</span>
                  </div>
                </div>
                
                {/* Action Buttons - Terminal Style */}
                <div className="space-y-4">
                  <Link
                    href={`/${mintResult.tokenId}`}
                    className="block w-full py-4 bg-black/80 border-2 border-[#00FFFF] rounded font-mono uppercase tracking-wider text-[#00FFFF] font-bold shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:shadow-[0_0_50px_rgba(0,255,255,0.6)] hover:bg-[#00FFFF]/10 transition-all touch-target text-center"
                  >
                    {'>'} VIEW YOUR PORTAL →
                  </Link>
                  
                  <a
                    href={`https://basescan.org/tx/${mintResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 bg-black/60 border border-[#00FF88]/50 rounded font-mono uppercase tracking-wider text-[#00FF88] text-sm hover:border-[#00FF88] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all touch-target text-center"
                  >
                    VIEW ON BASESCAN ↗
                  </a>
                  
                  <button
                    onClick={() => {
                      setPhase('profile');
                      setMintResult(null);
                      setMintSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const, detail: undefined })));
                    }}
                    className="block w-full py-3 font-mono text-gray-500 hover:text-[#00FFFF] transition-all uppercase tracking-wider text-sm"
                  >
                    {'>'} MINT ANOTHER
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* Loading State */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-12 h-12 border-2 border-[#00FFFF] border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-[0_0_20px_rgba(0,255,255,0.4)]" />
                <p className="font-mono text-sm text-[#00FFFF] uppercase tracking-wider">
                  {'>'} LOADING IDENTITY...
                </p>
              </motion.div>
            )}
            
          </AnimatePresence>
        </main>
        
        {/* ============================================================ */}
        {/* RECENT MINTERS - Animated User Profiles Section              */}
        {/* ============================================================ */}
        <RecentMintersSection />
        
        {/* Footer - Terminal Style */}
        <footer className="border-t-2 border-[#00FFFF]/20 mt-12 py-8">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="font-mono text-xs text-gray-600 uppercase tracking-widest mb-4">
              VOT MACHINE • x402 PROTOCOL • BASE NETWORK
            </p>
            <div className="flex justify-center gap-6">
              <Link href="/tokenomics" className="font-mono text-xs text-[#00FFFF] hover:text-white hover:drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] transition-all uppercase tracking-wider">
                TOKENOMICS
              </Link>
              <Link href="/rankings" className="font-mono text-xs text-[#00FF88] hover:text-white hover:drop-shadow-[0_0_10px_rgba(0,255,136,0.8)] transition-all uppercase tracking-wider">
                RANKINGS
              </Link>
              <a href="https://warpcast.com/~/channel/mcpvot" target="_blank" className="font-mono text-xs text-[#9F7AEA] hover:text-white hover:drop-shadow-[0_0_10px_rgba(159,122,234,0.8)] transition-all uppercase tracking-wider">
                FARCASTER
              </a>
              <Link href="/about" className="font-mono text-xs text-[#FF8800] hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,136,0,0.8)] transition-all uppercase tracking-wider">
                ABOUT
              </Link>
            </div>
          </div>
        </footer>
        
      </div>
    </div>
  );
}
