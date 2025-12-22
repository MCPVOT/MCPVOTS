'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    BEEPER NFT COLLECTION PAGE                                 ║
 * ║                                                                               ║
 * ║  URL: mcpvot.xyz/beeper/collection                                            ║
 * ║                                                                               ║
 * ║  FEATURES:                                                                    ║
 * ║  ✅ ERC-4804 On-Chain Data Loading                                           ║
 * ║  ✅ Wallet-based NFT Discovery                                               ║
 * ║  ✅ Direct SVG rendering from contract                                       ║
 * ║  ✅ Rarity tier display                                                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { EnhancedConnectButton } from '@/components/EnhancedConnectButton';
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

// VOT Sumerian Glyphs
const VOT_GLYPHS = {
  BEEPER: '𒄠',
  SIGNAL: '⚡',
  ARROW: '→',
  DOT: '•',
  VRF: '𒆷',
  CHAIN: '𒆠',
  MCP: '𒃲',
  EXTERNAL: '↗',
  BACK: '←',
  GALLERY: '𒀯',
};

// Rarity tier colors
const RARITY_COLORS: Record<string, string> = {
  'X402': '#FFD700',
  'GM': '#FF6B6B',
  'FOMO': '#FF9500',
  'ZZZ': '#A855F7',
  'GENESIS': '#EC4899',
  'OG': '#3B82F6',
  'WHALE': '#14B8A6',
  'STAKER': '#8B5CF6',
  'VALIDATOR': '#10B981',
  'NODE': '#6B7280',
};

// =============================================================================
// TYPES
// =============================================================================

interface BeeperNFT {
  tokenId: number;
  name: string;
  description: string;
  image: string;
  svgData?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  rarity?: string;
  rarityTier?: number;
}

interface WalletNFTsResponse {
  success: boolean;
  address: string;
  totalOwned: number;
  nfts: BeeperNFT[];
  error?: string;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function BeeperCollectionPage() {
  const { address, isConnected } = useAccount();
  
  const [mounted, setMounted] = useState(false);
  const [nfts, setNfts] = useState<BeeperNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNft, setSelectedNft] = useState<BeeperNFT | null>(null);

  // Hydration fix
  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  // Fetch NFTs when wallet connects
  const fetchWalletNFTs = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/beeper/wallet/${address}`);
      const data: WalletNFTsResponse = await response.json();
      
      if (data.success) {
        setNfts(data.nfts);
      } else {
        setError(data.error || 'Failed to load NFTs');
      }
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError('Network error - please try again');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchWalletNFTs();
    }
  }, [isConnected, address, fetchWalletNFTs]);

  // Get rarity color
  const getRarityColor = (rarity?: string) => {
    if (!rarity) return MATRIX_GREEN;
    return RARITY_COLORS[rarity] || MATRIX_GREEN;
  };

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
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xs font-mono"
            style={{ 
              left: `${(i * 5)}%`,
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
              delay: i * 0.3,
              ease: 'linear',
            }}
          >
            {String.fromCharCode(0x30A0 + Math.floor(i * 2))}
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 border-b" style={{ borderColor: `${MATRIX_GREEN}30` }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/beeper" 
              className="flex items-center gap-1 px-2 py-1 rounded border transition-all hover:opacity-80"
              style={{ 
                borderColor: `${MATRIX_GREEN}40`,
                color: MATRIX_GREEN,
              }}
            >
              <span>{VOT_GLYPHS.BACK}</span>
              <span className="font-mono text-xs uppercase">MINT</span>
            </Link>
            <div className="flex items-center gap-2">
              <span style={{ color: MATRIX_GREEN, fontSize: '18px' }}>{VOT_GLYPHS.GALLERY}</span>
              <span 
                className="font-mono uppercase tracking-wider text-sm font-bold"
                style={{ color: MATRIX_GREEN }}
              >
                MY BEEPERS
              </span>
            </div>
          </div>
          
          <EnhancedConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        
        {/* Title */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 
            className="text-3xl md:text-4xl font-mono uppercase tracking-wider font-bold mb-2"
            style={{ color: MATRIX_GREEN }}
          >
            {VOT_GLYPHS.BEEPER} BEEPER COLLECTION
          </h1>
          <p 
            className="font-mono text-sm"
            style={{ color: MATRIX_ACCENT }}
          >
            ERC-4804 On-Chain SVG Gallery
          </p>
        </motion.div>

        {/* Not Connected State */}
        {!isConnected && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div 
              className="text-6xl mb-4"
              style={{ color: MATRIX_GREEN, textShadow: `0 0 20px ${MATRIX_GREEN}` }}
            >
              {VOT_GLYPHS.BEEPER}
            </div>
            <p 
              className="font-mono text-lg mb-6"
              style={{ color: MATRIX_ACCENT }}
            >
              Connect wallet to view your BEEPER NFTs
            </p>
            <EnhancedConnectButton />
          </motion.div>
        )}

        {/* Loading State */}
        {isConnected && loading && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto border-4 rounded-full mb-4"
              style={{ borderColor: `${MATRIX_GREEN} transparent transparent transparent` }}
            />
            <p 
              className="font-mono text-sm"
              style={{ color: MATRIX_ACCENT }}
            >
              Loading your BEEPERS from Base...
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {isConnected && error && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl mb-4">⚠️</div>
            <p 
              className="font-mono text-lg mb-4"
              style={{ color: '#FF6B6B' }}
            >
              {error}
            </p>
            <button
              onClick={fetchWalletNFTs}
              className="px-4 py-2 rounded font-mono text-sm transition-all hover:opacity-80"
              style={{ 
                backgroundColor: MATRIX_GREEN,
                color: MATRIX_BG,
              }}
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {isConnected && !loading && !error && nfts.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div 
              className="text-6xl mb-4 opacity-40"
              style={{ color: MATRIX_GREEN }}
            >
              {VOT_GLYPHS.BEEPER}
            </div>
            <p 
              className="font-mono text-lg mb-4"
              style={{ color: MATRIX_ACCENT }}
            >
              No BEEPER NFTs found in this wallet
            </p>
            <Link
              href="/beeper"
              className="inline-block px-6 py-3 rounded font-mono text-sm transition-all hover:opacity-80"
              style={{ 
                backgroundColor: MATRIX_GREEN,
                color: MATRIX_BG,
              }}
            >
              {VOT_GLYPHS.ARROW} MINT YOUR FIRST BEEPER
            </Link>
          </motion.div>
        )}

        {/* NFT Grid */}
        {isConnected && !loading && !error && nfts.length > 0 && (
          <>
            {/* Stats Bar */}
            <motion.div
              className="mb-6 p-4 rounded-lg border flex items-center justify-between flex-wrap gap-4"
              style={{ 
                borderColor: `${MATRIX_GREEN}40`,
                backgroundColor: `${MATRIX_GREEN}08`,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: MATRIX_GREEN }}>{VOT_GLYPHS.BEEPER}</span>
                <span className="font-mono text-sm" style={{ color: MATRIX_GREEN }}>
                  {nfts.length} BEEPER{nfts.length !== 1 ? 'S' : ''} OWNED
                </span>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href={`https://opensea.io/${address}?search[collections][0]=beeper-nft-2`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs transition-opacity hover:opacity-80"
                  style={{ color: '#2081E2' }}
                >
                  {VOT_GLYPHS.EXTERNAL} OpenSea
                </a>
                <button
                  onClick={fetchWalletNFTs}
                  className="font-mono text-xs transition-opacity hover:opacity-80"
                  style={{ color: MATRIX_ACCENT }}
                >
                  ↻ Refresh
                </button>
              </div>
            </motion.div>

            {/* NFT Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {nfts.map((nft, index) => (
                  <motion.div
                    key={nft.tokenId}
                    className="rounded-xl border overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ 
                      borderColor: `${getRarityColor(nft.rarity)}40`,
                      backgroundColor: MATRIX_BG,
                      boxShadow: `0 0 20px ${getRarityColor(nft.rarity)}15`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedNft(nft)}
                  >
                    {/* SVG Display */}
                    <div 
                      className="aspect-[16/9] w-full overflow-hidden"
                      style={{ backgroundColor: `${MATRIX_GREEN}08` }}
                    >
                      {nft.svgData ? (
                        <div
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{ __html: nft.svgData }}
                        />
                      ) : nft.image ? (
                        <img 
                          src={nft.image} 
                          alt={nft.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span 
                            className="text-4xl"
                            style={{ color: MATRIX_GREEN, opacity: 0.3 }}
                          >
                            {VOT_GLYPHS.BEEPER}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 
                          className="font-mono text-sm font-bold"
                          style={{ color: MATRIX_GREEN }}
                        >
                          {nft.name || `BEEPER #${nft.tokenId}`}
                        </h3>
                        {nft.rarity && (
                          <span 
                            className="px-2 py-1 rounded text-xs font-mono font-bold"
                            style={{ 
                              backgroundColor: `${getRarityColor(nft.rarity)}20`,
                              color: getRarityColor(nft.rarity),
                            }}
                          >
                            {nft.rarity}
                          </span>
                        )}
                      </div>
                      <p 
                        className="font-mono text-xs truncate"
                        style={{ color: MATRIX_ACCENT }}
                      >
                        {nft.description || 'x402 V2 Promo BEEPER NFT'}
                      </p>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: `${MATRIX_GREEN}20` }}>
                        <span 
                          className="font-mono text-xs"
                          style={{ color: MATRIX_DIM }}
                        >
                          Token #{nft.tokenId}
                        </span>
                        <a
                          href={`https://opensea.io/assets/base/0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9/${nft.tokenId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs transition-opacity hover:opacity-80"
                          style={{ color: '#2081E2' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          View {VOT_GLYPHS.EXTERNAL}
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* NFT Modal */}
        <AnimatePresence>
          {selectedNft && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNft(null)}
            >
              <motion.div
                className="max-w-4xl w-full max-h-[90vh] overflow-auto rounded-xl border"
                style={{ 
                  backgroundColor: MATRIX_BG,
                  borderColor: `${getRarityColor(selectedNft.rarity)}40`,
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Full SVG */}
                <div className="aspect-[16/9] w-full overflow-hidden">
                  {selectedNft.svgData ? (
                    <div
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: selectedNft.svgData }}
                    />
                  ) : selectedNft.image ? (
                    <img 
                      src={selectedNft.image} 
                      alt={selectedNft.name}
                      className="w-full h-full object-contain"
                    />
                  ) : null}
                </div>

                {/* Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 
                        className="font-mono text-xl font-bold mb-1"
                        style={{ color: MATRIX_GREEN }}
                      >
                        {selectedNft.name || `BEEPER #${selectedNft.tokenId}`}
                      </h2>
                      <p 
                        className="font-mono text-sm"
                        style={{ color: MATRIX_ACCENT }}
                      >
                        {selectedNft.description}
                      </p>
                    </div>
                    {selectedNft.rarity && (
                      <span 
                        className="px-3 py-1.5 rounded text-sm font-mono font-bold"
                        style={{ 
                          backgroundColor: `${getRarityColor(selectedNft.rarity)}20`,
                          color: getRarityColor(selectedNft.rarity),
                        }}
                      >
                        {selectedNft.rarity}
                      </span>
                    )}
                  </div>

                  {/* Attributes */}
                  {selectedNft.attributes && selectedNft.attributes.length > 0 && (
                    <div className="mb-4">
                      <h3 
                        className="font-mono text-sm uppercase mb-2"
                        style={{ color: MATRIX_GREEN }}
                      >
                        Attributes
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedNft.attributes.map((attr, idx) => (
                          <div 
                            key={idx}
                            className="p-2 rounded"
                            style={{ backgroundColor: `${MATRIX_GREEN}10` }}
                          >
                            <div 
                              className="font-mono text-xs uppercase"
                              style={{ color: MATRIX_DIM }}
                            >
                              {attr.trait_type}
                            </div>
                            <div 
                              className="font-mono text-sm font-bold"
                              style={{ color: MATRIX_GREEN }}
                            >
                              {attr.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: `${MATRIX_GREEN}20` }}>
                    <a
                      href={`https://opensea.io/assets/base/0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9/${selectedNft.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded font-mono text-sm transition-all hover:opacity-80"
                      style={{ 
                        backgroundColor: '#2081E2',
                        color: 'white',
                      }}
                    >
                      View on OpenSea {VOT_GLYPHS.EXTERNAL}
                    </a>
                    <a
                      href={`https://basescan.org/nft/0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9/${selectedNft.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded font-mono text-sm transition-all hover:opacity-80"
                      style={{ 
                        backgroundColor: `${MATRIX_GREEN}20`,
                        color: MATRIX_GREEN,
                      }}
                    >
                      BaseScan {VOT_GLYPHS.EXTERNAL}
                    </a>
                    <button
                      onClick={() => setSelectedNft(null)}
                      className="ml-auto px-4 py-2 rounded font-mono text-sm transition-all hover:opacity-80"
                      style={{ color: MATRIX_ACCENT }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer 
        className="relative z-10 p-4 border-t mt-8"
        style={{ borderColor: `${MATRIX_GREEN}20` }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-mono text-xs" style={{ color: MATRIX_DIM }}>
            BEEPER {VOT_GLYPHS.DOT} ERC-4804 On-Chain SVG {VOT_GLYPHS.DOT} Base Network
          </p>
        </div>
      </footer>
    </main>
  );
}
