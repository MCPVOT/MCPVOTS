'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    BEEPER NFT DISPLAY COMPONENT                               ║
 * ║                                                                               ║
 * ║  Shows user's minted BEEPER NFT with:                                        ║
 * ║  ✅ NFT SVG preview (from IPFS or ERC-4804 on-chain)                         ║
 * ║  ✅ Token ID & Rarity                                                         ║
 * ║  ✅ OpenSea link                                                              ║
 * ║  ✅ Download SVG button                                                       ║
 * ║  ✅ BaseScan transaction link                                                 ║
 * ║  ✅ ERC-4804 on-chain URL for FIP-2 sharing                                  ║
 * ║  ✅ VOT balance display                                                       ║
 * ║  ✅ Mint timestamp & records                                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useState } from 'react';

// =============================================================================
// CONSTANTS
// =============================================================================

const MATRIX_GREEN = '#77FE80';
const MATRIX_BRIGHT = '#88FF99';
const MATRIX_ACCENT = '#5DE066';
const MATRIX_DIM = '#3a5a3a';
const MATRIX_BG = '#050505';
const PURPLE_ACCENT = '#8A63D2';
const CYAN_ACCENT = '#00FFCC';

const BEEPER_CONTRACT = process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9';
const OPENSEA_BASE_URL = 'https://opensea.io/assets/base';

// VOT Glyphs
const VOT_GLYPHS = {
  DINGIR: '𒇻',
  DISH: '𒁹',
  TA: '𒋼',
  AM: '𒄠',
  AN: '𒀭',
  KUR: '𒆳',
  U: '𒌋',
  MUL: '𒀯',
  LA: '𒆷',
  LUGAL: '𒈗',
  CHAIN: '⟁',
  VERIFY: '◈',
  SIGNAL: '⚡',
  ARROW: '►',
  DOWNLOAD: '⬇',
  EXTERNAL: '↗',
  DOT: '•',
  COPY: '⧉',
};

const RARITY_GLYPHS: Record<string, string> = {
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
};

// =============================================================================
// TYPES
// =============================================================================

interface BeeperNFTData {
  tokenId: number;
  rarity: string;
  svgCid: string;
  metadataCid?: string;
  txHash: string;
  mintedAt?: string;
  owner: string;
}

interface BeeperNFTDisplayProps {
  nftData: BeeperNFTData;
  votBalance?: string;
  showShareBonus?: boolean;
  compact?: boolean;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function BeeperNFTDisplay({
  nftData,
  votBalance,
  showShareBonus = true,
  compact = false,
  className = '',
}: BeeperNFTDisplayProps) {
  const [copied, setCopied] = useState<string | null>(null);

  // URLs
  const openSeaUrl = `${OPENSEA_BASE_URL}/${BEEPER_CONTRACT}/${nftData.tokenId}`;
  const baseScanUrl = `https://basescan.org/tx/${nftData.txHash}`;
  const ipfsUrl = `https://ipfs.io/ipfs/${nftData.svgCid}`;
  // ERC-4804 on-chain URL (web3:// protocol)
  const erc4804Url = `web3://${BEEPER_CONTRACT}:8453/tokenURI/${nftData.tokenId}`;
  const mcpvotUrl = `https://mcpvot.xyz/beeper/${nftData.tokenId}`;

  const rarityGlyph = RARITY_GLYPHS[nftData.rarity] || VOT_GLYPHS.DINGIR;

  // Copy to clipboard
  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // Download SVG
  const handleDownloadSvg = useCallback(async () => {
    try {
      const response = await fetch(ipfsUrl);
      const svgContent = await response.text();
      
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beeper-nft-${nftData.tokenId}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download SVG:', err);
    }
  }, [ipfsUrl, nftData.tokenId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden ${className}`}
      style={{
        backgroundColor: MATRIX_BG,
        borderColor: `${MATRIX_GREEN}40`,
        boxShadow: `0 0 30px ${MATRIX_GREEN}15`,
      }}
    >
      {/* Header */}
      <div 
        className="p-4 border-b flex items-center justify-between"
        style={{ borderColor: `${MATRIX_GREEN}30` }}
      >
        <div className="flex items-center gap-3">
          <motion.span
            className="text-3xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ textShadow: `0 0 15px ${MATRIX_GREEN}` }}
          >
            {rarityGlyph}
          </motion.span>
          <div>
            <h3 className="font-mono text-lg font-bold" style={{ color: MATRIX_BRIGHT }}>
              BEEPER #{nftData.tokenId}
            </h3>
            <p className="font-mono text-xs uppercase" style={{ color: MATRIX_ACCENT }}>
              {nftData.rarity} Rarity
            </p>
          </div>
        </div>
        
        {/* On-chain badge */}
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ 
            backgroundColor: `${MATRIX_GREEN}15`,
            border: `1px solid ${MATRIX_GREEN}40`,
          }}
        >
          <span style={{ color: MATRIX_BRIGHT }}>{VOT_GLYPHS.CHAIN}</span>
          <span className="font-mono text-xs uppercase" style={{ color: MATRIX_GREEN }}>ON-CHAIN</span>
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: MATRIX_BRIGHT }}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </div>

      {/* NFT Preview */}
      <div className="relative">
        <Image
          src={ipfsUrl}
          alt={`Beeper NFT #${nftData.tokenId}`}
          width={900}
          height={240}
          className="w-full h-auto"
          unoptimized
          priority
        />
        
        {/* Overlay with token info */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm" style={{ color: MATRIX_BRIGHT }}>
              Token #{nftData.tokenId}
            </span>
            <span className="font-mono text-xs" style={{ color: MATRIX_ACCENT }}>
              {nftData.mintedAt ? new Date(nftData.mintedAt).toLocaleDateString() : 'Minted'}
            </span>
          </div>
        </div>
      </div>

      {/* VOT Balance */}
      {votBalance && (
        <div 
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: `${MATRIX_GREEN}20` }}
        >
          <span className="font-mono text-xs uppercase" style={{ color: MATRIX_DIM }}>
            VOT Balance
          </span>
          <span className="font-mono text-lg font-bold" style={{ color: MATRIX_BRIGHT }}>
            {parseFloat(votBalance).toLocaleString()} VOT
          </span>
        </div>
      )}

      {/* Records Section */}
      <div className="p-4 space-y-3">
        {/* Transaction Hash */}
        <div 
          className="p-3 rounded-lg border"
          style={{ borderColor: `${MATRIX_GREEN}20`, backgroundColor: `${MATRIX_GREEN}05` }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] uppercase" style={{ color: MATRIX_DIM }}>
              TX Hash
            </span>
            <button
              onClick={() => handleCopy(nftData.txHash, 'txHash')}
              className="font-mono text-[10px] hover:opacity-80 transition-opacity"
              style={{ color: CYAN_ACCENT }}
            >
              {copied === 'txHash' ? '✓ Copied' : VOT_GLYPHS.COPY}
            </button>
          </div>
          <a
            href={baseScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs hover:underline block truncate"
            style={{ color: MATRIX_GREEN }}
          >
            {nftData.txHash.slice(0, 20)}...{nftData.txHash.slice(-10)} {VOT_GLYPHS.EXTERNAL}
          </a>
        </div>

        {/* IPFS CID */}
        <div 
          className="p-3 rounded-lg border"
          style={{ borderColor: `${MATRIX_GREEN}20`, backgroundColor: `${MATRIX_GREEN}05` }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] uppercase" style={{ color: MATRIX_DIM }}>
              IPFS CID
            </span>
            <button
              onClick={() => handleCopy(nftData.svgCid, 'ipfsCid')}
              className="font-mono text-[10px] hover:opacity-80 transition-opacity"
              style={{ color: CYAN_ACCENT }}
            >
              {copied === 'ipfsCid' ? '✓ Copied' : VOT_GLYPHS.COPY}
            </button>
          </div>
          <a
            href={ipfsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs hover:underline block truncate"
            style={{ color: MATRIX_GREEN }}
          >
            {nftData.svgCid.slice(0, 20)}...{nftData.svgCid.slice(-8)} {VOT_GLYPHS.EXTERNAL}
          </a>
        </div>

        {/* ERC-4804 On-Chain URL */}
        <div 
          className="p-3 rounded-lg border"
          style={{ borderColor: `${CYAN_ACCENT}30`, backgroundColor: `${CYAN_ACCENT}08` }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] uppercase" style={{ color: MATRIX_DIM }}>
              ERC-4804 On-Chain URL
            </span>
            <button
              onClick={() => handleCopy(erc4804Url, 'erc4804')}
              className="font-mono text-[10px] hover:opacity-80 transition-opacity"
              style={{ color: CYAN_ACCENT }}
            >
              {copied === 'erc4804' ? '✓ Copied' : VOT_GLYPHS.COPY}
            </button>
          </div>
          <p className="font-mono text-xs truncate" style={{ color: CYAN_ACCENT }}>
            {erc4804Url}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t grid grid-cols-2 gap-3" style={{ borderColor: `${MATRIX_GREEN}20` }}>
        {/* Download SVG */}
        <motion.button
          onClick={handleDownloadSvg}
          className="py-3 px-4 rounded-lg font-mono text-xs uppercase tracking-wider border flex items-center justify-center gap-2"
          style={{
            borderColor: `${CYAN_ACCENT}50`,
            backgroundColor: `${CYAN_ACCENT}15`,
            color: CYAN_ACCENT,
          }}
          whileHover={{ backgroundColor: `${CYAN_ACCENT}25`, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>{VOT_GLYPHS.DOWNLOAD}</span>
          <span>Download SVG</span>
        </motion.button>

        {/* OpenSea */}
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
          whileHover={{ backgroundColor: 'rgba(32, 129, 226, 0.25)', scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>🌊</span>
          <span>OpenSea</span>
          <span>{VOT_GLYPHS.EXTERNAL}</span>
        </motion.a>
      </div>

      {/* BaseScan Link */}
      <div className="px-4 pb-3">
        <a
          href={baseScanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 text-center font-mono text-xs hover:underline"
          style={{ color: MATRIX_DIM }}
        >
          View Transaction on BaseScan {VOT_GLYPHS.EXTERNAL}
        </a>
      </div>

      {/* FIP-2 Share Bonus Section */}
      {showShareBonus && (
        <motion.div
          className="p-4 border-t space-y-3"
          style={{ borderColor: `${MATRIX_GREEN}30`, backgroundColor: `${MATRIX_GREEN}05` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span style={{ color: MATRIX_BRIGHT, fontSize: '16px' }}>{VOT_GLYPHS.AN}</span>
              <span className="font-mono text-base font-bold" style={{ color: MATRIX_BRIGHT }}>
                +10,000 VOT BONUS
              </span>
              <span style={{ color: MATRIX_BRIGHT, fontSize: '16px' }}>{VOT_GLYPHS.AN}</span>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: MATRIX_ACCENT }}>
              FIP-2 {VOT_GLYPHS.DOT} Share + Follow Protocol
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Share on Farcaster */}
            <motion.a
              href={`https://warpcast.com/~/compose?text=${encodeURIComponent(
                `${VOT_GLYPHS.AN} BEEPER NFT #${nftData.tokenId} minted on @mcpvot\n\n$0.25 → 69,420 VOT + ${nftData.rarity.toUpperCase()} rarity\n\nMint yours:`
              )}&embeds[]=${encodeURIComponent(mcpvotUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-lg font-mono text-xs uppercase border flex items-center justify-center gap-2"
              style={{
                borderColor: PURPLE_ACCENT,
                backgroundColor: `${PURPLE_ACCENT}25`,
                color: '#fff',
              }}
              whileHover={{ scale: 1.02, backgroundColor: `${PURPLE_ACCENT}40` }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{VOT_GLYPHS.SIGNAL}</span>
              <span>SHARE +5K</span>
            </motion.a>

            {/* Follow @mcpvot */}
            <motion.a
              href="https://warpcast.com/mcpvot"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-lg font-mono text-xs uppercase border flex items-center justify-center gap-2"
              style={{
                borderColor: PURPLE_ACCENT,
                backgroundColor: `${PURPLE_ACCENT}15`,
                color: PURPLE_ACCENT,
              }}
              whileHover={{ scale: 1.02, backgroundColor: `${PURPLE_ACCENT}30` }}
              whileTap={{ scale: 0.98 }}
            >
              <span>@mcpvot</span>
              <span>+5K</span>
            </motion.a>
          </div>
        </motion.div>
      )}

      {/* Footer - Contract Info */}
      <div 
        className="p-3 border-t text-center"
        style={{ borderColor: `${MATRIX_GREEN}20` }}
      >
        <p className="font-mono text-[10px]" style={{ color: MATRIX_DIM }}>
          BASE MAINNET {VOT_GLYPHS.CHAIN} {BEEPER_CONTRACT.slice(0, 6)}...{BEEPER_CONTRACT.slice(-4)}
        </p>
        <div className="flex items-center justify-center gap-3 mt-1">
          <a
            href="https://beep.works"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] hover:underline"
            style={{ color: MATRIX_ACCENT }}
          >
            beep.works
          </a>
          <span style={{ color: MATRIX_DIM }}>{VOT_GLYPHS.DOT}</span>
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
    </motion.div>
  );
}
