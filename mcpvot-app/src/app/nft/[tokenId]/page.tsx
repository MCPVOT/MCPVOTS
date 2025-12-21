'use client';

/**
 * NFT Display Page - View MCPVOT Builder NFT
 * 
 * Features:
 * - On-chain SVG rendering
 * - Full metadata display
 * - ENS/Base/Warplet/Farcaster badges
 * - OpenSea link
 * - EIP-4804 web3:// URL
 * - FIP-2 Farcaster integration (Share button + Social Feed)
 */

import { ShareOnFarcasterButton, SocialFeedWidget } from '@/components/farcaster/FarcasterSocial';
import { CONTRACTS, MCPVOT_BUILDER_NFT_ABI, NFT_CONFIG } from '@/lib/x402-vot-facilitator';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';

// =============================================================================
// TYPES
// =============================================================================

interface BuilderData {
  builder: string;
  ensName: string;
  baseName: string;
  farcasterFid: bigint;
  farcasterUsername: string;
  votBurned: bigint;
  ipfsCid: string;
  svgContent: string;
  mintTimestamp: bigint;
  isWarpletHolder: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function NFTDisplayPage() {
  const params = useParams();
  const tokenId = params.tokenId as string;
  
  // State
  const [builderData, setBuilderData] = useState<BuilderData | null>(null);
  const [tier, setTier] = useState<string>('');
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read builder data from contract (with error handling)
  const { data: contractBuilderData, error: contractError } = useReadContract({
    address: CONTRACTS.MCPVOT_BUILDER_NFT as `0x${string}`,
    abi: MCPVOT_BUILDER_NFT_ABI,
    functionName: 'getBuilderData',
    args: [BigInt(tokenId || '0')],
  });

  // Handle contract read error
  useEffect(() => {
    if (contractError) {
      setError(`Failed to load NFT data: ${contractError.message}`);
    }
  }, [contractError]);

  // Read tier from contract
  const { data: contractTier } = useReadContract({
    address: CONTRACTS.MCPVOT_BUILDER_NFT as `0x${string}`,
    abi: MCPVOT_BUILDER_NFT_ABI,
    functionName: 'getBuilderTier',
    args: [BigInt(tokenId || '0')],
  });

  // Read rendered SVG from contract
  const { data: contractSvg } = useReadContract({
    address: CONTRACTS.MCPVOT_BUILDER_NFT as `0x${string}`,
    abi: MCPVOT_BUILDER_NFT_ABI,
    functionName: 'renderSVG',
    args: [BigInt(tokenId || '0')],
  });

  // Process contract data
  useEffect(() => {
    if (contractBuilderData) {
      setBuilderData(contractBuilderData as BuilderData);
    }
    if (contractTier) {
      setTier(contractTier as string);
    }
    if (contractSvg) {
      setSvgContent(contractSvg as string);
    }
    setIsLoading(false);
  }, [contractBuilderData, contractTier, contractSvg]);

  // Format timestamp
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format VOT amount
  const formatVot = (amount: bigint) => {
    return (Number(amount) / 1e18).toLocaleString();
  };

  // Get tier color - 8 tier system (cyberpunk palette - no purple)
  const getTierColor = (tierName: string) => {
    switch (tierName.toUpperCase()) {
      case 'MCPVOT': return '#00d4ff';     // Cyan - base tier
      case 'MAXX': return '#ff9500';       // Orange - MAXX holder
      case 'WARPLET': return '#00ff88';    // Neon Green - Warplet NFT holder
      case 'ENS': return '#00d4ff';        // Cyan - has .eth
      case 'BASE': return '#0052ff';       // Base Blue - has .base.eth
      case 'FARCASTER': return '#00d4ff';  // Cyan - has FID
      case 'ARCHITEK': return '#ffd700';   // Gold - 3+ identities
      case 'ORACLE': return '#ff00ff';     // Magenta - ultra rare (all verified)
      // Legacy tiers for backward compatibility
      case 'GENESIS': return '#ffd700';
      case 'PIONEER': return '#c0c0c0';
      case 'ARCHITECT': return '#cd7f32';
      case 'LEGEND': return '#ff00ff';
      default: return '#00ffcc';
    }
  };

  // Get tier emoji
  const getTierEmoji = (tierName: string) => {
    switch (tierName.toUpperCase()) {
      case 'MCPVOT': return '🔷';
      case 'MAXX': return '🟠';
      case 'WARPLET': return '🌀';
      case 'ENS': return '🔵';
      case 'BASE': return '🔷';
      case 'FARCASTER': return '🟣';
      case 'ARCHITEK': return '🏛️';
      case 'ORACLE': return '🔮';
      // Legacy
      case 'GENESIS': return '👑';
      case 'PIONEER': return '🚀';
      case 'ARCHITECT': return '🏗️';
      case 'LEGEND': return '⭐';
      default: return '💎';
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-[#00ffcc] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading NFT #{tokenId}...</p>
        </div>
      </main>
    );
  }

  if (error || !builderData) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">NFT Not Found</h1>
          <p className="text-gray-400 mb-6">{error || `Token #${tokenId} does not exist`}</p>
          <Link href="/nft-builder" className="px-6 py-3 bg-[#00ffcc] text-black rounded-lg font-bold">
            Create Your NFT
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#00ffcc]">MCPVOT</span>
            <span className="text-sm text-gray-500">Builder #{tokenId}</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/nft-builder" className="px-4 py-2 border border-[#00ffcc] text-[#00ffcc] rounded-lg hover:bg-[#00ffcc]/10">
              Create NFT
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: NFT Image */}
          <div className="space-y-4">
            {/* NFT Card */}
            <div className="bg-black/50 border border-gray-700 rounded-2xl p-4 overflow-hidden">
              <div 
                className="w-full aspect-square rounded-xl overflow-hidden"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>

            {/* Tier Badge */}
            <div 
              className="flex items-center justify-center gap-2 py-3 rounded-xl"
              style={{ 
                backgroundColor: `${getTierColor(tier)}20`,
                border: `2px solid ${getTierColor(tier)}`
              }}
            >
              <span className="text-2xl">
                {getTierEmoji(tier)}
              </span>
              <span 
                className="text-xl font-bold"
                style={{ color: getTierColor(tier) }}
              >
                {tier} TIER
              </span>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://opensea.io/assets/base/${CONTRACTS.MCPVOT_BUILDER_NFT}/${tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 bg-[#2081e2] rounded-xl hover:opacity-90 transition-opacity"
              >
                <span>🌊</span>
                <span className="font-bold">OpenSea</span>
              </a>
              {/* FIP-2 Farcaster Share Button */}
              <ShareOnFarcasterButton 
                tokenId={Number(tokenId)} 
                size="lg"
                className="w-full"
              />
            </div>

            {/* Web3 URL */}
            <div className="bg-black/50 border border-gray-700 rounded-xl p-4">
              <h4 className="text-sm text-gray-400 mb-2">EIP-4804 Web3 URL</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-[#00ffcc] bg-black/50 p-2 rounded overflow-x-auto">
                  web3://{CONTRACTS.MCPVOT_BUILDER_NFT}/uri/{tokenId}
                </code>
                <button
                  onClick={() => copyToClipboard(`web3://${CONTRACTS.MCPVOT_BUILDER_NFT}/uri/${tokenId}`)}
                  className="p-2 hover:bg-gray-800 rounded"
                >
                  📋
                </button>
              </div>
            </div>
          </div>

          {/* Right: Metadata */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {NFT_CONFIG.name} #{tokenId}
              </h1>
              <p className="text-gray-400">
                {builderData.ensName || builderData.baseName || `Builder ${builderData.builder.slice(0, 8)}...`}
              </p>
            </div>

            {/* Builder Info */}
            <div className="bg-black/50 border border-gray-700 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-[#00ffcc]">Builder Info</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">Address</span>
                  <a 
                    href={`https://basescan.org/address/${builderData.builder}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00ffcc] font-mono hover:underline"
                  >
                    {builderData.builder.slice(0, 6)}...{builderData.builder.slice(-4)} ↗
                  </a>
                </div>
                
                {builderData.ensName && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">ENS Name</span>
                    <span className="text-[#0052ff] font-bold">{builderData.ensName}</span>
                  </div>
                )}
                
                {builderData.baseName && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Base Name</span>
                    <span className="text-[#0052ff] font-bold">{builderData.baseName}</span>
                  </div>
                )}
                
                {builderData.farcasterUsername && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Farcaster</span>
                    <a
                      href={`https://warpcast.com/${builderData.farcasterUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8a63d2] hover:underline"
                    >
                      @{builderData.farcasterUsername} ↗
                    </a>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">Warplet Holder</span>
                  <span className={builderData.isWarpletHolder ? 'text-[#00ff00]' : 'text-gray-500'}>
                    {builderData.isWarpletHolder ? '✓ Verified' : 'No'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">Minted</span>
                  <span className="text-white">{formatDate(builderData.mintTimestamp)}</span>
                </div>
              </div>
            </div>

            {/* VOT Stats */}
            <div className="bg-black/50 border border-gray-700 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-[#ff6600]">🔥 VOT Economics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#00ff00]/10 border border-[#00ff00]/30 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400">VOT Received</div>
                  <div className="text-2xl font-bold text-[#00ff00]">100,000</div>
                </div>
                <div className="bg-[#ff6600]/10 border border-[#ff6600]/30 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400">VOT Burned</div>
                  <div className="text-2xl font-bold text-[#ff6600]">{formatVot(builderData.votBurned)} 🔥</div>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                1% of VOT is burned on every mint, making VOT deflationary
              </p>
            </div>

            {/* OpenSea Attributes */}
            <div className="bg-black/50 border border-gray-700 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Attributes</h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/50 border border-gray-800 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">Network</div>
                  <div className="text-sm text-white font-bold">Base</div>
                </div>
                <div className="bg-black/50 border border-gray-800 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">Tier</div>
                  <div className="text-sm font-bold" style={{ color: getTierColor(tier) }}>{tier}</div>
                </div>
                <div className="bg-black/50 border border-gray-800 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">Collection</div>
                  <div className="text-sm text-white font-bold">Builder</div>
                </div>
                {builderData.ensName && (
                  <div className="bg-[#0052ff]/10 border border-[#0052ff]/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">ENS</div>
                    <div className="text-sm text-[#0052ff] font-bold">✓</div>
                  </div>
                )}
                {builderData.baseName && (
                  <div className="bg-[#0052ff]/10 border border-[#0052ff]/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">Base Name</div>
                    <div className="text-sm text-[#0052ff] font-bold">✓</div>
                  </div>
                )}
                {builderData.isWarpletHolder && (
                  <div className="bg-[#8a63d2]/10 border border-[#8a63d2]/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">Warplet</div>
                    <div className="text-sm text-[#8a63d2] font-bold">✓</div>
                  </div>
                )}
              </div>
            </div>

            {/* IPFS Info */}
            {builderData.ipfsCid && (
              <div className="bg-black/50 border border-gray-700 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">📌 IPFS Storage</h3>
                
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-gray-400 bg-black/50 p-2 rounded overflow-x-auto">
                    ipfs://{builderData.ipfsCid}
                  </code>
                  <a
                    href={`https://ipfs.io/ipfs/${builderData.ipfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-800 rounded text-[#00ffcc]"
                  >
                    ↗
                  </a>
                </div>
                <p className="text-xs text-gray-500">
                  Metadata is permanently stored on IPFS for decentralized access
                </p>
              </div>
            )}
            
            {/* FIP-2 Social Feed */}
            <SocialFeedWidget tokenId={Number(tokenId)} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>MCPVOT Builder Collection • Powered by x402 Protocol</p>
          <p className="mt-2">
            <Link href="/nft-builder" className="text-[#00ffcc] hover:underline">Create NFT</Link>
            {' • '}
            <Link href="/architecture" className="text-[#00ffcc] hover:underline">Architecture</Link>
            {' • '}
            <a href={`https://opensea.io/collection/mcpvot-builder`} target="_blank" rel="noopener noreferrer" className="text-[#00ffcc] hover:underline">OpenSea ↗</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
