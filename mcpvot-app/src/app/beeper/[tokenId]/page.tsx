'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║               BEEPER NFT VIEWER - FULL CARD CYBERPUNK STYLE                  ║
 * ║  Features: ThreeJS background, CRT scanlines, Tab navigation, FIP-2 share    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import ThreeBackground from '@/components/ThreeBackground';
import VOTLogoSVG from '@/components/VOTLogoSVG';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const VOT_GLYPHS = {
  DINGIR: { glyph: '𒇻', name: 'NODE', tier: 1 },
  DISH: { glyph: '𒁹', name: 'VALIDATOR', tier: 2 },
  TA: { glyph: '𒋼', name: 'STAKER', tier: 3 },
  AM: { glyph: '𒄠', name: 'WHALE', tier: 4 },
  AN: { glyph: '𒀭', name: 'OG', tier: 5 },
  KUR: { glyph: '𒆳', name: 'GENESIS', tier: 6 },
  U: { glyph: '𒌋', name: 'ZZZ', tier: 7 },
  MUL: { glyph: '𒀯', name: 'FOMO', tier: 8 },
  LA: { glyph: '𒆷', name: 'GM', tier: 9 },
  LUGAL: { glyph: '𒈗', name: 'x402', tier: 10 },
  CHAIN: '⟁',
  VERIFY: '◈',
  SIGNAL: '⚡',
  ARROW: '►',
  DOWNLOAD: '⬇',
  EXTERNAL: '↗',
  SHARE: '⬡',
  COPY: '⧉',
};

function getRarityGlyph(rarity: string): { glyph: string; name: string; tier: number } {
  const rarityMap: Record<string, keyof typeof VOT_GLYPHS> = {
    node: 'DINGIR', NODE: 'DINGIR', validator: 'DISH', VALIDATOR: 'DISH',
    staker: 'TA', STAKER: 'TA', whale: 'AM', WHALE: 'AM',
    og: 'AN', OG: 'AN', genesis: 'KUR', GENESIS: 'KUR',
    zzz: 'U', ZZZ: 'U', fomo: 'MUL', FOMO: 'MUL',
    gm: 'LA', GM: 'LA', x402: 'LUGAL', X402: 'LUGAL',
  };
  const key = rarityMap[rarity] || 'DINGIR';
  const entry = VOT_GLYPHS[key];
  if (typeof entry === 'object' && 'glyph' in entry) return entry;
  return VOT_GLYPHS.DINGIR as { glyph: string; name: string; tier: number };
}

// Contract addresses - .trim() to remove any trailing whitespace/newlines from env vars
const BEEPER_CONTRACT = (process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9').trim();
const OPENSEA_BASE_URL = 'https://opensea.io/assets/base';
const BASESCAN_URL = 'https://basescan.org';
const IPFS_GATEWAY = 'https://ipfs.io/ipfs';
const VOT_CONTRACT = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';

// =============================================================================
// MATRIX GREEN PALETTE - CONSISTENT WITH BEEPER MINT CARD
// =============================================================================
const MATRIX_GREEN = '#77FE80';
const MATRIX_BRIGHT = '#88FF99';
const MATRIX_ACCENT = '#5DE066';
const MATRIX_DIM = '#3a5a3a';
const MATRIX_BG = '#050505';
// PURPLE_ACCENT and CYAN_ACCENT available for future use in rarity theming

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  attributes: Array<{ trait_type: string; value: string | number; display_type?: string }>;
  properties?: {
    rarity?: { tier: string; label: string; chance: string; color: string };
    identity?: { address: string; farcaster?: string; fid?: number; ens?: string; basename?: string; display_name: string };
  };
}

interface NFTData {
  tokenId: number;
  owner: string;
  metadata: NFTMetadata;
  svgContent?: string;
  svgData?: string;          // On-chain SVG from getSvgData()
  onChainImage?: string;     // Base64 image from tokenURI
  mintTxHash?: string;
  rarity: string;
  rarityTier: number;
  source?: string;           // Source indicator: 'getSvgData' | 'tokenURI-base64' | 'tokenURI-data' | 'ipfs'
}

const RARITY_COLORS: Record<string, string> = {
  node: '#00FF88', NODE: '#00FF88', validator: '#77FE80', VALIDATOR: '#77FE80',
  staker: '#0088FF', STAKER: '#0088FF', whale: '#FF8800', WHALE: '#FF8800',
  og: '#FF8800', OG: '#FF8800', genesis: '#9F7AEA', GENESIS: '#9F7AEA',
  zzz: '#FF00FF', ZZZ: '#FF00FF', fomo: '#FF0088', FOMO: '#FF0088',
  gm: '#FFFF00', GM: '#FFFF00', x402: '#FFD700', X402: '#FFD700',
};

export default function BeeperNFTViewerPage() {
  const params = useParams();
  const tokenId = params?.tokenId as string;

  const [nftData, setNftData] = useState<NFTData | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'nft' | 'identity' | 'actions' | 'share'>('nft');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const lines = [
      `> LOADING BEEPER NFT #${tokenId}...`,
      '> CONNECTING TO BASE MAINNET (8453)...',
      '> QUERYING ERC-1155 CONTRACT...',
      '> FETCHING ON-CHAIN SVG (ERC-4804)...',
      '> PARSING tokenURI() DATA...',
      '> VERIFYING VRF RARITY...',
      '> NFT DATA LOADED ✓',
    ];
    lines.forEach((line, i) => {
      setTimeout(() => setTerminalLines((prev) => [...prev, line]), i * 150);
    });
  }, [tokenId]);

  useEffect(() => {
    const interval = setInterval(() => setScanProgress((prev) => (prev + 1) % 100), 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchNFTData() {
      if (!tokenId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/beeper/nft/${tokenId}`);
        if (!response.ok) throw new Error('NFT not found');
        const data = await response.json();
        setNftData(data);
        
        console.log(`[ERC-4804] NFT #${tokenId} source: ${data.source || 'unknown'}`);
        
        // Priority 1: Use on-chain SVG data from contract's getSvgData()
        if (data.svgData && data.svgData.includes('<svg')) {
          console.log('[ERC-4804] ✓ Loading SVG from on-chain getSvgData()');
          setSvgContent(data.svgData);
        }
        // Priority 2: Use onChainImage from API (already parsed base64)
        else if (data.onChainImage?.startsWith('data:image/svg+xml;base64,')) {
          console.log('[ERC-4804] ✓ Loading SVG from onChainImage (base64)');
          const base64Data = data.onChainImage.replace('data:image/svg+xml;base64,', '');
          const svg = atob(base64Data);
          if (svg.includes('<svg')) setSvgContent(svg);
        }
        // Priority 3: Parse base64 encoded image from metadata.image
        else if (data.metadata?.image?.startsWith('data:image/svg+xml;base64,')) {
          console.log('[ERC-4804] ✓ Loading SVG from metadata.image (base64)');
          const base64Data = data.metadata.image.replace('data:image/svg+xml;base64,', '');
          const svg = atob(base64Data);
          if (svg.includes('<svg')) setSvgContent(svg);
        }
        // Priority 4: Parse raw SVG from data URI
        else if (data.metadata?.image?.startsWith('data:image/svg+xml,')) {
          console.log('[ERC-4804] ✓ Loading SVG from data URI');
          const svg = decodeURIComponent(data.metadata.image.replace('data:image/svg+xml,', ''));
          if (svg.includes('<svg')) setSvgContent(svg);
        }
        // Fallback: Try IPFS gateway (only if on-chain not available)
        else if (data.metadata?.image?.startsWith('ipfs://')) {
          console.log('[Fallback] Loading SVG from IPFS gateway');
          const ipfsUrl = data.metadata.image.replace('ipfs://', `${IPFS_GATEWAY}/`);
          try {
            const svgResponse = await fetch(ipfsUrl);
            if (svgResponse.ok) {
              const svg = await svgResponse.text();
              if (svg.includes('<svg')) setSvgContent(svg);
            }
          } catch {
            console.log('Could not fetch SVG from IPFS');
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Could not load NFT data');
      } finally {
        setLoading(false);
      }
    }
    fetchNFTData();
  }, [tokenId]);

  const handleDownloadSVG = useCallback(() => {
    if (!svgContent || !nftData) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beeper-nft-${nftData.tokenId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [svgContent, nftData]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleShareFarcaster = useCallback(() => {
    if (!nftData) return;
    const parentUrl = `chain://eip155:8453/erc1155:${BEEPER_CONTRACT}/${nftData.tokenId}`;
    const text = `${VOT_GLYPHS.DINGIR.glyph} Just minted BEEPER NFT #${nftData.tokenId}!\n\n${VOT_GLYPHS.SIGNAL} Rarity: ${nftData.rarity.toUpperCase()}\n${VOT_GLYPHS.CHAIN} On-chain SVG on Base\n\nhttps://mcpvot.xyz/beeper/${nftData.tokenId}`;
    window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&parentUrl=${encodeURIComponent(parentUrl)}`, '_blank');
  }, [nftData]);

  const handleShareTwitter = useCallback(() => {
    if (!nftData) return;
    const text = `Just minted BEEPER NFT #${nftData.tokenId} on @base!\n\nRarity: ${nftData.rarity.toUpperCase()}\nOn-chain SVG + VRF Rarity\n\nhttps://mcpvot.xyz/beeper/${nftData.tokenId}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  }, [nftData]);

  if (loading) {
    return (
      <>
        <ThreeBackground />
        <div className="min-h-screen font-mono relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: MATRIX_BG, color: MATRIX_GREEN }}>
          <div className="fixed inset-0 pointer-events-none z-[1]" style={{ background: `linear-gradient(to bottom, transparent 50%, ${MATRIX_GREEN}08 50%)`, backgroundSize: '100% 4px' }} />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <VOTLogoSVG size={64} animated={true} style={{ filter: `drop-shadow(0 0 40px ${MATRIX_GREEN})` }} />
          </motion.div>
        </div>
      </>
    );
  }

  if (error || !nftData) {
    return (
      <>
        <ThreeBackground />
        <div className="min-h-screen font-mono relative overflow-hidden flex flex-col items-center justify-center p-4" style={{ backgroundColor: MATRIX_BG, color: MATRIX_GREEN }}>
          <div className="fixed inset-0 pointer-events-none z-[1]" style={{ background: `linear-gradient(to bottom, transparent 50%, ${MATRIX_GREEN}08 50%)`, backgroundSize: '100% 4px' }} />
          <VOTLogoSVG size={64} animated={true} style={{ filter: 'drop-shadow(0 0 40px #FF0066)' }} />
          <h1 className="text-2xl font-bold mt-6" style={{ color: '#FF0066' }}>NFT NOT FOUND</h1>
          <p className="text-sm mt-2" style={{ color: MATRIX_DIM }}>Token #{tokenId} does not exist or has not been minted yet</p>
          <Link
            href="/beeper"
            className="mt-6 px-6 py-3 rounded font-mono text-sm uppercase tracking-widest transition-all"
            style={{ 
              backgroundColor: `${MATRIX_BG}cc`, 
              border: `2px solid ${MATRIX_GREEN}60`,
              color: MATRIX_GREEN,
            }}
          >
            {VOT_GLYPHS.ARROW} BACK TO MINT
          </Link>
        </div>
      </>
    );
  }

  const identity = nftData.metadata.properties?.identity;
  const rarityInfo = getRarityGlyph(nftData.rarity);
  const rarityColor = RARITY_COLORS[nftData.rarity] || MATRIX_GREEN;

  return (
    <>
      <ThreeBackground />
      <div className="min-h-screen font-mono relative overflow-hidden" style={{ backgroundColor: MATRIX_BG, color: MATRIX_GREEN }}>
        {/* Scan lines effect */}
        <div className="fixed inset-0 pointer-events-none z-[1]" style={{ background: `linear-gradient(to bottom, transparent 50%, ${MATRIX_GREEN}08 50%)`, backgroundSize: '100% 4px' }} />
        <div className="fixed inset-0 pointer-events-none z-[1]">
          <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${MATRIX_GREEN}10 1px, transparent 1px), linear-gradient(to bottom, ${MATRIX_GREEN}10 1px, transparent 1px)`, backgroundSize: '4rem 4rem' }} />
        </div>

        {/* Main content */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-6 py-6 sm:py-12">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <VOTLogoSVG size={48} animated={true} style={{ filter: `drop-shadow(0 0 40px ${MATRIX_GREEN})` }} />
                <div>
                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-wider" style={{ color: MATRIX_BRIGHT, textShadow: `0 0 20px ${MATRIX_GREEN}cc` }}>
                    {VOT_GLYPHS.ARROW} BEEPER NFT #{tokenId}
                  </h1>
                  <p className="text-xs sm:text-sm uppercase tracking-widest mt-1" style={{ color: rarityColor }}>
                    {rarityInfo.glyph} {rarityInfo.name} {VOT_GLYPHS.CHAIN} TIER {rarityInfo.tier}/10
                  </p>
                </div>
              </div>
              <Link
                href="/beeper"
                className="self-start sm:self-auto px-4 sm:px-6 py-2 sm:py-3 rounded font-mono text-xs uppercase tracking-widest transition-all active:scale-95"
                style={{ 
                  backgroundColor: `${MATRIX_BG}cc`, 
                  border: `2px solid ${MATRIX_GREEN}60`,
                  color: MATRIX_GREEN,
                  boxShadow: `0 0 20px ${MATRIX_GREEN}30`,
                }}
              >
                {VOT_GLYPHS.ARROW} BACK TO MINT
              </Link>
            </div>

            {/* Terminal */}
            <div className="rounded p-3 sm:p-6 backdrop-blur-sm overflow-x-auto" style={{ backgroundColor: `${MATRIX_BG}cc`, border: `2px solid ${MATRIX_GREEN}40`, boxShadow: `0 0 30px ${MATRIX_GREEN}20` }}>
              {terminalLines.map((line, i) => (
                <div key={i} className="text-[10px] sm:text-xs font-mono mb-1 whitespace-nowrap" style={{ color: MATRIX_ACCENT }}>
                  {line}
                </div>
              ))}
              <div className="text-xs animate-pulse inline-block" style={{ color: MATRIX_GREEN }}>_</div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex gap-2 sm:gap-4 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
            {[
              { id: 'nft' as const, label: 'NFT PREVIEW', icon: VOT_GLYPHS.VERIFY },
              { id: 'identity' as const, label: 'IDENTITY', icon: VOT_GLYPHS.AGENT },
              { id: 'actions' as const, label: 'ACTIONS', icon: VOT_GLYPHS.EXECUTE },
              { id: 'share' as const, label: 'SHARE', icon: VOT_GLYPHS.EXTERNAL },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex-shrink-0 sm:flex-1 px-3 sm:px-6 py-3 sm:py-4 rounded border-2 font-bold uppercase transition-all text-xs sm:text-sm tracking-wider active:scale-95 ${
                  activeSection === tab.id
                    ? 'border-[#77FE80] bg-[#77FE80]/20 shadow-[0_0_30px_rgba(119,254,128,0.6)] text-[#77FE80]'
                    : 'border-[#77FE80]/30 bg-black/50 hover:border-[#77FE80]/60 text-[#77FE80]/70'
                }`}
              >
                <span className="mr-1 sm:mr-2">[{tab.icon}]</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* NFT PREVIEW Section */}
            {activeSection === 'nft' && (
              <motion.div
                key="nft"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="bg-black/80 border-2 border-[#77FE80]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(119,254,128,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#77FE80] uppercase tracking-wider">
                    {'>'} BEEPER NFT #{tokenId}
                  </h2>

                  {/* SVG Display */}
                  <div className="bg-black/90 border-2 border-[#77FE80]/60 rounded-lg overflow-hidden mb-6 relative">
                    {/* On-chain Badge */}
                    {nftData.source && !nftData.source.includes('ipfs') && (
                      <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-green-500/20 border border-green-500/60 rounded text-[10px] text-green-400 font-mono uppercase tracking-wider">
                        {VOT_GLYPHS.CHAIN} ON-CHAIN
                      </div>
                    )}
                    <div className="relative aspect-[3.75/1] w-full">
                      {svgContent ? (
                        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: svgContent }} />
                      ) : nftData.metadata.image ? (
                        <Image
                          src={nftData.metadata.image.replace('ipfs://', `${IPFS_GATEWAY}/`)}
                          alt={nftData.metadata.name}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <VOTLogoSVG size={64} animated={true} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rarity Badge */}
                  <div className="bg-black/60 border-2 rounded p-4 sm:p-6 mb-6" style={{ borderColor: `${rarityColor}60` }}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-5xl sm:text-6xl" style={{ textShadow: `0 0 30px ${rarityColor}` }}>
                          {rarityInfo.glyph}
                        </span>
                        <div>
                          <div className="text-2xl sm:text-3xl font-bold" style={{ color: rarityColor }}>
                            {rarityInfo.name}
                          </div>
                          <div className="text-xs text-gray-400">RARITY TIER {rarityInfo.tier}/10</div>
                        </div>
                      </div>
                      <div
                        className="px-4 py-2 rounded-lg text-sm font-bold"
                        style={{ backgroundColor: `${rarityColor}20`, border: `2px solid ${rarityColor}60`, color: rarityColor }}
                      >
                        VRF VERIFIED
                      </div>
                    </div>
                  </div>

                  {/* Token Info Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                      { icon: VOT_GLYPHS.VERIFY, label: 'TOKEN ID', value: `#${tokenId}`, color: '#77FE80' },
                      { icon: VOT_GLYPHS.CHAIN, label: 'NETWORK', value: 'Base', color: '#00FF88' },
                      { icon: VOT_GLYPHS.MEMORY, label: 'STANDARD', value: 'ERC-1155', color: '#9F7AEA' },
                      { icon: VOT_GLYPHS.DATA, label: 'STORAGE', value: 'On-Chain', color: '#FFD700' },
                    ].map((item) => (
                      <div key={item.label} className="bg-black/60 border rounded p-3 sm:p-4 text-center" style={{ borderColor: `${item.color}40` }}>
                        <div className="text-2xl sm:text-3xl mb-2">{item.icon}</div>
                        <div className="font-bold text-xs sm:text-sm" style={{ color: item.color }}>
                          {item.label}
                        </div>
                        <div className="text-white text-lg sm:text-xl font-bold">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* IDENTITY Section */}
            {activeSection === 'identity' && (
              <motion.div
                key="identity"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="bg-black/80 border-2 border-[#9F7AEA]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(159,122,234,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#9F7AEA] uppercase tracking-wider">
                    {'>'} OWNER IDENTITY
                  </h2>

                  <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    {/* Wallet Address */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-black/60 border rounded gap-2 border-[#77FE80]/40">
                      <div>
                        <div className="font-bold text-sm sm:text-base text-[#77FE80]">{VOT_GLYPHS.CHAIN} WALLET ADDRESS</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">Owner of this NFT</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`${BASESCAN_URL}/address/${nftData.owner || identity?.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] sm:text-xs font-mono px-2 sm:px-3 py-1 bg-black/80 rounded hover:bg-white/10 transition-all text-[#77FE80]"
                        >
                          {(nftData.owner || identity?.address || '').slice(0, 10)}...{(nftData.owner || identity?.address || '').slice(-6)}
                        </a>
                        <button
                          onClick={() => handleCopy(nftData.owner || identity?.address || '')}
                          className="px-2 py-1 rounded text-xs bg-[#77FE80]/20 text-[#77FE80] hover:bg-[#77FE80]/30"
                        >
                          {copied ? '✓' : VOT_GLYPHS.COPY}
                        </button>
                      </div>
                    </div>

                    {/* Basename */}
                    {identity?.basename && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-black/60 border rounded gap-2 border-[#0052FF]/40">
                        <div>
                          <div className="font-bold text-sm sm:text-base text-[#0052FF]">{VOT_GLYPHS.VERIFY} BASENAME</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">Base onchain identity</div>
                        </div>
                        <span className="text-sm font-mono text-[#0052FF]">{identity.basename}</span>
                      </div>
                    )}

                    {/* ENS */}
                    {identity?.ens && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-black/60 border rounded gap-2 border-[#5298FF]/40">
                        <div>
                          <div className="font-bold text-sm sm:text-base text-[#5298FF]">{VOT_GLYPHS.VERIFY} ENS NAME</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">Ethereum Name Service</div>
                        </div>
                        <span className="text-sm font-mono text-[#5298FF]">{identity.ens}</span>
                      </div>
                    )}

                    {/* Farcaster */}
                    {identity?.farcaster && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-black/60 border rounded gap-2 border-[#8A63D2]/40">
                        <div>
                          <div className="font-bold text-sm sm:text-base text-[#8A63D2]">{VOT_GLYPHS.SHARE} FARCASTER</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">Social identity {identity.fid && `(FID: ${identity.fid})`}</div>
                        </div>
                        <a
                          href={`https://warpcast.com/${identity.farcaster}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-[#8A63D2] hover:underline"
                        >
                          @{identity.farcaster}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ACTIONS Section */}
            {activeSection === 'actions' && (
              <motion.div
                key="actions"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="bg-black/80 border-2 border-[#00FF88]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,136,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#00FF88] uppercase tracking-wider">
                    {'>'} QUICK ACTIONS
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                    <button
                      onClick={handleDownloadSVG}
                      disabled={!svgContent}
                      className="flex items-center justify-center gap-2 px-4 py-4 bg-[#00FF88] text-black font-bold rounded border-2 border-[#00FF88] hover:bg-[#00FF88]/80 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{VOT_GLYPHS.DOWNLOAD}</span>
                      <span>DOWNLOAD SVG</span>
                    </button>
                    <a
                      href={`${OPENSEA_BASE_URL}/${BEEPER_CONTRACT}/${tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-4 bg-black/60 text-[#2081E2] font-bold rounded border-2 border-[#2081E2]/60 hover:bg-[#2081E2]/20 hover:border-[#2081E2] transition-all active:scale-95"
                    >
                      <span>{VOT_GLYPHS.EXTERNAL}</span>
                      <span>VIEW ON OPENSEA</span>
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <a
                      href={`${BASESCAN_URL}/token/${BEEPER_CONTRACT}?a=${tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-4 bg-black/60 text-[#77FE80] font-bold rounded border-2 border-[#77FE80]/60 hover:bg-[#77FE80]/20 hover:border-[#77FE80] transition-all active:scale-95"
                    >
                      <span>{VOT_GLYPHS.CHAIN}</span>
                      <span>VIEW ON BASESCAN</span>
                    </a>
                    <a
                      href={`${BASESCAN_URL}/address/${VOT_CONTRACT}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-4 bg-black/60 text-[#FFD700] font-bold rounded border-2 border-[#FFD700]/60 hover:bg-[#FFD700]/20 hover:border-[#FFD700] transition-all active:scale-95"
                    >
                      <span>{VOT_GLYPHS.VERIFY}</span>
                      <span>VOT CONTRACT</span>
                    </a>
                  </div>
                </div>

                <div className="bg-black/80 border-2 border-[#FF8800]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(255,136,0,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#FF8800] uppercase tracking-wider">
                    {'>'} CONTRACT INFO
                  </h2>
                  <div className="space-y-3">
                    {[
                      { name: 'BeeperNFT Contract', addr: BEEPER_CONTRACT, color: '#9F7AEA' },
                      { name: 'VOT Token', addr: VOT_CONTRACT, color: '#77FE80' },
                    ].map((c) => (
                      <div
                        key={c.name}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-black/60 border rounded gap-2"
                        style={{ borderColor: `${c.color}40` }}
                      >
                        <div className="font-bold text-sm" style={{ color: c.color }}>
                          {c.name}
                        </div>
                        <a
                          href={`${BASESCAN_URL}/address/${c.addr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] sm:text-xs font-mono px-2 sm:px-3 py-1 bg-black/80 rounded hover:bg-white/10 transition-all break-all"
                          style={{ color: c.color }}
                        >
                          {c.addr}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SHARE Section */}
            {activeSection === 'share' && (
              <motion.div
                key="share"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="bg-black/80 border-2 border-[#8A63D2]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(138,99,210,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#8A63D2] uppercase tracking-wider">
                    {'>'} SHARE YOUR NFT
                  </h2>

                  <div className="bg-black/60 border-l-4 border-[#8A63D2] p-4 sm:p-6 mb-6">
                    <p className="text-gray-300 text-xs sm:text-sm">
                      Share your BEEPER NFT on social media! Using <strong className="text-[#FFD700]">FIP-2 Flexible Targets</strong>,
                      your Farcaster casts will be linked to this specific token for threaded discussions.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={handleShareFarcaster}
                      className="flex items-center justify-center gap-3 px-6 py-5 bg-[#8A63D2] text-white font-bold rounded-lg border-2 border-[#8A63D2] hover:bg-[#8A63D2]/80 transition-all active:scale-95 shadow-[0_0_30px_rgba(138,99,210,0.4)]"
                    >
                      <span className="text-2xl">{VOT_GLYPHS.SHARE}</span>
                      <div className="text-left">
                        <div className="text-sm uppercase tracking-wider">SHARE ON</div>
                        <div className="text-lg font-bold">FARCASTER</div>
                      </div>
                    </button>
                    <button
                      onClick={handleShareTwitter}
                      className="flex items-center justify-center gap-3 px-6 py-5 bg-black text-white font-bold rounded-lg border-2 border-gray-600 hover:border-white hover:bg-white/10 transition-all active:scale-95"
                    >
                      <span className="text-2xl">{VOT_GLYPHS.EXTERNAL}</span>
                      <div className="text-left">
                        <div className="text-sm uppercase tracking-wider">SHARE ON</div>
                        <div className="text-lg font-bold">X / TWITTER</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-black/80 border-2 border-[#FF00FF]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(255,0,255,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#FF00FF] uppercase tracking-wider">
                    {'>'} {VOT_GLYPHS.REWARD} BONUS: +10,000 VOT
                  </h2>
                  <div className="bg-black/60 border-2 border-[#FF00FF]/60 rounded p-4 sm:p-6">
                    <p className="text-gray-300 text-xs sm:text-sm mb-4">
                      Claim an extra <span className="text-[#00FF88] font-bold">10,000 VOT</span> by completing these actions:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-black/60 border border-[#00FF88]/30 rounded p-4">
                        <div className="text-[#00FF88] font-bold mb-2">1. FOLLOW @MCPVOT</div>
                        <p className="text-xs text-gray-400">Follow our Farcaster account</p>
                        <div className="text-[#FFD700] font-bold mt-2">+5,000 VOT</div>
                      </div>
                      <div className="bg-black/60 border border-[#77FE80]/30 rounded p-4">
                        <div className="text-[#77FE80] font-bold mb-2">2. SHARE YOUR MINT</div>
                        <p className="text-xs text-gray-400">Cast about your mint on Warpcast</p>
                        <div className="text-[#FFD700] font-bold mt-2">+5,000 VOT</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/80 border-2 border-[#77FE80]/40 rounded p-4 sm:p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-bold text-[#77FE80] mb-3">DIRECT LINK</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://mcpvot.xyz/beeper/${tokenId}`}
                      className="flex-1 bg-black/60 border border-[#77FE80]/30 rounded px-3 py-2 text-xs font-mono text-[#77FE80]"
                    />
                    <button
                      onClick={() => handleCopy(`https://mcpvot.xyz/beeper/${tokenId}`)}
                      className="px-4 py-2 bg-[#77FE80]/20 text-[#77FE80] rounded border border-[#77FE80]/60 hover:bg-[#77FE80]/30 transition-all text-xs font-bold"
                    >
                      {copied ? 'COPIED!' : 'COPY'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Protocol Links */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 sm:mt-12">
            <div className="bg-black/80 border-2 border-[#77FE80]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(119,254,128,0.2)]">
              <h3 className="text-base sm:text-xl font-bold text-[#77FE80] mb-4 sm:mb-6 uppercase tracking-wider">
                {'>'} PROTOCOL LINKS
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <a
                  href={`${OPENSEA_BASE_URL}/${BEEPER_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 sm:px-4 py-2 sm:py-3 bg-black/60 border border-[#2081E2]/60 rounded text-center text-[#2081E2] hover:border-[#2081E2] hover:shadow-[0_0_20px_rgba(32,129,226,0.5)] transition-all text-xs sm:text-sm active:scale-95"
                >
                  OpenSea Collection
                </a>
                <a
                  href={`${BASESCAN_URL}/address/${BEEPER_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 sm:px-4 py-2 sm:py-3 bg-black/60 border border-[#77FE80]/60 rounded text-center text-[#77FE80] hover:border-[#77FE80] hover:shadow-[0_0_20px_rgba(119,254,128,0.5)] transition-all text-xs sm:text-sm active:scale-95"
                >
                  NFT Contract
                </a>
                <a
                  href={`${BASESCAN_URL}/address/${VOT_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 sm:px-4 py-2 sm:py-3 bg-black/60 border border-[#00FF88]/60 rounded text-center text-[#00FF88] hover:border-[#00FF88] hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] transition-all text-xs sm:text-sm active:scale-95"
                >
                  VOT Token
                </a>
                <Link
                  href="/about"
                  className="block px-3 sm:px-4 py-2 sm:py-3 bg-black/60 border border-[#FF8800]/60 rounded text-center text-[#FF8800] hover:border-[#FF8800] hover:shadow-[0_0_20px_rgba(255,136,0,0.5)] transition-all text-xs sm:text-sm active:scale-95"
                >
                  About x402
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scan line animation */}
        <div
          className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#77FE80] to-transparent opacity-50 pointer-events-none"
          style={{ transform: `translateY(${scanProgress * 10}px)` }}
        />
      </div>
    </>
  );
}
