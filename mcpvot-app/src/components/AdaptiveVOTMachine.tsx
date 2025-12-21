'use client';

import useAdaptiveUI, { getAdaptiveClasses } from '@/hooks/useAdaptiveUI';
import { useFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import React, { useCallback, useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';

// =============================================================================
// ADAPTIVE VOT MACHINE - Works on Farcaster, Base Mobile, and Web
// =============================================================================
// Platform-specific optimizations:
// - Farcaster Mini App: Compact UI, native share, FID integration
// - Base Mobile: Touch-optimized, safe areas, swipe gestures
// - Desktop Web: Full experience, hover states, keyboard shortcuts
// =============================================================================

interface TraitStatus {
  vot: boolean;
  mcpvot: boolean;
  warplet: boolean;
  base: boolean;
  farcaster: boolean;
  ens: boolean;
}

interface MintResult {
  tokenId?: number;
  cid?: string;
  txHash?: string;
  landingUrl?: string;
}

// =============================================================================
// ADAPTIVE SVG COMPONENT
// =============================================================================

const AdaptiveVOTMachineSVG: React.FC<{ 
  traits: TraitStatus; 
  tier: string;
  compact?: boolean;
}> = ({ traits, tier, compact = false }) => {
  const traitColors = {
    vot: '#00FF88',
    mcpvot: '#00D4FF',
    warplet: '#FF6B35',
    base: '#0052FF',
    farcaster: '#855DCD',
    ens: '#5298FF',
  };

  const tierColors: Record<string, string> = {
    'MCPVOT': '#FFD700',
    'Warplet': '#FF6B35',
    'ENS': '#5298FF',
    'Base': '#0052FF',
    'Farcaster': '#855DCD',
    'Architek': '#00FF88',
    'Oracle': '#FF00FF',
  };

  // Compact version for mini apps
  const viewBox = compact ? '0 0 320 220' : '0 0 400 280';

  return (
    <svg viewBox={viewBox} className="w-full h-auto" style={{ maxWidth: compact ? '280px' : '400px' }}>
      <defs>
        {/* CRT Glow Filter */}
        <filter id="crtGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={compact ? "2" : "3"} result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Scanlines Pattern */}
        <pattern id="scanlines" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="2" fill="rgba(0,0,0,0.3)"/>
        </pattern>
      </defs>
      
      <g transform={compact ? "scale(0.8) translate(0, 0)" : ""}>
        {/* Background */}
        <rect width="400" height="280" fill="#0a0a0a"/>
        
        {/* CRT Scanlines Overlay */}
        <rect width="400" height="280" fill="url(#scanlines)" opacity="0.5"/>
        
        {/* Main Terminal Frame */}
        <rect x="20" y="20" width="360" height="240" rx="8" 
              fill="none" stroke="#00FF88" strokeWidth="2" filter="url(#crtGlow)"/>
        
        {/* Header Bar */}
        <rect x="20" y="20" width="360" height="35" rx="8" fill="#111"/>
        <rect x="20" y="47" width="360" height="3" fill="#00FF88" opacity="0.3"/>
        
        {/* Terminal Dots */}
        <circle cx="38" cy="37" r="5" fill="#FF5F56"/>
        <circle cx="55" cy="37" r="5" fill="#FFBD2E"/>
        <circle cx="72" cy="37" r="5" fill="#27C93F"/>
        
        {/* Title */}
        <text x="200" y="42" textAnchor="middle" 
              fontFamily="'Orbitron', monospace" fontSize={compact ? "11" : "14"} fill="#00D4FF" filter="url(#crtGlow)">
          VOT MACHINE // BUILDER NFT
        </text>
        
        {/* Machine Display Area */}
        <rect x="30" y="65" width="340" height={compact ? "90" : "110"} rx="4" fill="#050505" stroke="#00FF8830" strokeWidth="1"/>
        
        {/* VOT Logo/Icon */}
        <g transform={compact ? "translate(175, 85)" : "translate(175, 90)"}>
          <polygon points="25,0 50,45 0,45" fill="none" stroke="#00FF88" strokeWidth="2" filter="url(#crtGlow)">
            <animate attributeName="stroke-opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
          </polygon>
          <text x="25" y="32" textAnchor="middle" fontFamily="'Orbitron', monospace" fontSize="10" fill="#00FF88">VOT</text>
        </g>
        
        {/* Tier Display */}
        <text x="200" y={compact ? "150" : "160"} textAnchor="middle" 
              fontFamily="'Orbitron', monospace" fontSize={compact ? "10" : "12"} 
              fill={tierColors[tier] || '#00FF88'} filter="url(#crtGlow)">
          TIER: {tier.toUpperCase()}
        </text>
        
        {/* Trait Badges Row - Adaptive sizing */}
        <g transform={compact ? "translate(30, 165)" : "translate(30, 185)"}>
          {Object.entries(traits).map(([trait, active], index) => {
            const badgeWidth = compact ? 42 : 50;
            const badgeHeight = compact ? 24 : 30;
            const spacing = compact ? 48 : 56;
            
            return (
              <g key={trait} transform={`translate(${index * spacing}, 0)`}>
                <rect x="0" y="0" width={badgeWidth} height={badgeHeight} rx="4"
                      fill={active ? `${traitColors[trait as keyof typeof traitColors]}20` : '#111'}
                      stroke={active ? traitColors[trait as keyof typeof traitColors] : '#333'}
                      strokeWidth="1"
                      opacity={active ? 1 : 0.3}
                />
                <text x={badgeWidth / 2} y={compact ? "10" : "14"} textAnchor="middle" 
                      fontFamily="'Share Tech Mono', monospace" fontSize={compact ? "7" : "8"} 
                      fill={active ? traitColors[trait as keyof typeof traitColors] : '#666'}>
                  {trait.toUpperCase()}
                </text>
                <circle cx={badgeWidth / 2} cy={compact ? "18" : "23"} r={compact ? "2" : "3"} 
                        fill={active ? traitColors[trait as keyof typeof traitColors] : '#333'}
                        opacity={active ? 1 : 0.3}>
                  {active && (
                    <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
                  )}
                </circle>
              </g>
            );
          })}
        </g>
        
        {/* Status Bar */}
        <rect x="30" y={compact ? "200" : "225"} width="340" height={compact ? "20" : "25"} rx="4" fill="#0a0a0a" stroke="#00FF8830" strokeWidth="1"/>
        <text x="40" y={compact ? "214" : "241"} fontFamily="'Share Tech Mono', monospace" fontSize={compact ? "8" : "10"} fill="#00FF88">
          <tspan className="animate-pulse">▶</tspan> {Object.values(traits).filter(Boolean).length}/6 TRAITS • READY
        </text>
      </g>
    </svg>
  );
};

// =============================================================================
// TIER CALCULATION
// =============================================================================

function calculateTier(traits: TraitStatus): string {
  const count = Object.values(traits).filter(Boolean).length;
  if (traits.mcpvot && count >= 5) return 'Oracle';
  if (traits.mcpvot && count >= 3) return 'Architek';
  if (traits.mcpvot) return 'MCPVOT';
  if (traits.warplet) return 'Warplet';
  if (traits.ens) return 'ENS';
  if (traits.base) return 'Base';
  if (traits.farcaster) return 'Farcaster';
  return 'Initiate';
}

// =============================================================================
// MAIN ADAPTIVE COMPONENT
// =============================================================================

const AdaptiveVOTMachine: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  
  // Adaptive UI hook
  const ui = useAdaptiveUI();
  const classes = getAdaptiveClasses(ui);
  
  // Farcaster context
  const { isInMiniApp, user: farcasterUser } = useFarcasterContext();
  
  const [minting, setMinting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [traits, setTraits] = useState<TraitStatus>({
    vot: false,
    mcpvot: false,
    warplet: false,
    base: false,
    farcaster: !!farcasterUser,
    ens: false,
  });
  const [loading, setLoading] = useState(false);
  
  const tier = calculateTier(traits);
  
  // Find Smart Wallet connector
  const coinbaseConnector = connectors.find(
    c => c.id === 'coinbaseWalletSDK' || c.name === 'Coinbase Wallet'
  );
  
  // Fetch user traits when connected
  const fetchTraits = useCallback(async () => {
    if (!address && !farcasterUser) return;
    
    setLoading(true);
    try {
      const queryAddress = address || farcasterUser?.custody_address;
      if (!queryAddress) return;
      
      const response = await fetch(`/api/machine/profile?address=${queryAddress}`);
      if (response.ok) {
        const data = await response.json();
        setTraits({
          vot: parseFloat(data.votBalance || '0') > 0,
          mcpvot: parseFloat(data.votBalance || '0') >= 100000,
          warplet: data.hasWarpletNFT || false,
          base: !!data.basename,
          farcaster: !!data.farcasterFid || !!farcasterUser,
          ens: !!data.ensName,
        });
      }
    } catch (err) {
      console.error('Error fetching traits:', err);
      // Fallback
      setTraits({
        vot: false,
        mcpvot: false,
        warplet: false,
        base: isInMiniApp,
        farcaster: !!farcasterUser,
        ens: false,
      });
    } finally {
      setLoading(false);
    }
  }, [address, farcasterUser, isInMiniApp]);
  
  useEffect(() => {
    if (isConnected || farcasterUser) {
      fetchTraits();
    }
  }, [isConnected, farcasterUser, fetchTraits]);
  
  // Handle mint with x402 payment
  const handleMint = async () => {
    if (!isConnected && !farcasterUser) {
      setStatus('Connect wallet first');
      return;
    }
    
    setMinting(true);
    setStatus('Initiating x402 payment...');
    setQueuePosition(null);
    setMintResult(null);
    
    try {
      const userAddress = address || farcasterUser?.custody_address;
      if (!userAddress) throw new Error('No address available');
      
      // Generate SVG content
      setStatus('Generating VOT Machine SVG...');
      
      const activeTraitsList = Object.entries(traits)
        .filter(([, active]) => active)
        .map(([name]) => name.toUpperCase());
      
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#0a0a0a"/>
        <rect x="10" y="10" width="380" height="280" rx="8" fill="none" stroke="#00FF88" stroke-width="2"/>
        <text x="200" y="40" text-anchor="middle" font-family="monospace" font-size="16" fill="#00D4FF">VOT MACHINE // BUILDER NFT</text>
        <text x="200" y="80" text-anchor="middle" font-family="monospace" font-size="14" fill="#00FF88">TIER: ${tier}</text>
        <text x="200" y="120" text-anchor="middle" font-family="monospace" font-size="12" fill="#FFFFFF">${userAddress?.slice(0, 6)}...${userAddress?.slice(-4)}</text>
        <text x="200" y="160" text-anchor="middle" font-family="monospace" font-size="10" fill="#888888">TRAITS: ${activeTraitsList.join(' • ') || 'NONE'}</text>
        ${farcasterUser ? `<text x="200" y="200" text-anchor="middle" font-family="monospace" font-size="10" fill="#855DCD">@${farcasterUser.username || 'fid:' + farcasterUser.fid}</text>` : ''}
        <text x="200" y="260" text-anchor="middle" font-family="monospace" font-size="10" fill="#00FF88">x402 PROTOCOL • BASE NETWORK</text>
      </svg>`;
      
      // Create payment request
      setStatus('Creating payment request...');
      
      const mintResponse = await fetch('/api/x402/mint-builder-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          svgContent,
          traits,
          tier,
          farcasterFid: farcasterUser?.fid,
          farcasterUsername: farcasterUser?.username,
        }),
      });
      
      if (!mintResponse.ok) {
        const errorData = await mintResponse.json();
        if (errorData.queued) {
          setQueuePosition(errorData.position);
          setStatus(`Queued: ${errorData.position} ahead of you`);
          return;
        }
        throw new Error(errorData.error || 'Mint failed');
      }
      
      const result = await mintResponse.json();
      
      setMintResult({
        tokenId: result.tokenId,
        cid: result.cid,
        txHash: result.txHash,
        landingUrl: result.tokenId ? `https://mcpvot.xyz/${result.tokenId}` : undefined,
      });
      setStatus('✅ VOT Machine NFT Minted!');
      
    } catch (err) {
      console.error('Mint error:', err);
      setStatus(`❌ ${err instanceof Error ? err.message : 'Mint failed'}`);
    } finally {
      setMinting(false);
    }
  };
  
  // Share to Farcaster (if in mini app)
  const handleShare = () => {
    if (!mintResult?.landingUrl) return;
    
    const shareText = `Just minted my VOT Machine NFT! 🎰\n\nTier: ${tier}\nTraits: ${Object.entries(traits).filter(([, v]) => v).map(([k]) => k).join(', ')}\n\n${mintResult.landingUrl}`;
    
    if (isInMiniApp && typeof window !== 'undefined' && 'parent' in window) {
      // Use Farcaster share intent
      window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`, '_blank');
    } else {
      // Web share API or copy to clipboard
      if (navigator.share) {
        navigator.share({
          title: 'VOT Machine NFT',
          text: shareText,
          url: mintResult.landingUrl,
        });
      } else {
        navigator.clipboard.writeText(shareText);
        setStatus('📋 Copied to clipboard!');
      }
    }
  };
  
  return (
    <div className={classes.container}>
      {/* CRT Glow Border Effect */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="w-full h-full rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,212,255,0.1) 100%)',
            boxShadow: `
              inset 0 0 30px rgba(0,255,136,0.1),
              0 0 20px rgba(0,255,136,0.2)
            `,
          }}
        />
      </div>
      
      {/* Main Container */}
      <div className={`relative z-10 ${classes.modal}`} style={{ 
        maxHeight: ui.modalMaxHeight,
        paddingTop: ui.isInMiniApp ? ui.safeAreaInsets.top : 0,
        paddingBottom: ui.isInMiniApp ? ui.safeAreaInsets.bottom : 0,
      }}>
        {/* Scanline Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-20 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.1) 2px, rgba(0,255,136,0.1) 4px)',
          }}
        />
        
        {/* Header */}
        <div className="relative border-b border-[#00FF88]/20 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80" />
            {ui.isInMiniApp && farcasterUser && (
              <span className="ml-auto text-[10px] text-[#855DCD] font-mono">
                @{farcasterUser.username}
              </span>
            )}
          </div>
          <h2 className={`text-center ${classes.heading}`}>
            <span className="text-[#00D4FF]">🎰</span>
            <span className="text-[#00FF88] mx-2">VOT MACHINE</span>
          </h2>
          <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-1 font-mono">
            ERC-1155 • IPFS • x402 Protocol
          </p>
        </div>
        
        {/* Machine Visualization */}
        <div className="p-3 sm:p-4 flex justify-center overflow-hidden">
          <AdaptiveVOTMachineSVG 
            traits={traits} 
            tier={tier} 
            compact={ui.isInMiniApp || ui.screenSize === 'xs'}
          />
        </div>
        
        {/* Status Panel */}
        <div className={`mx-3 sm:mx-4 mb-3 sm:mb-4 ${classes.card}`}>
          <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono">
            <span className="text-gray-400">WALLET:</span>
            <span className={isConnected || farcasterUser ? 'text-[#00FF88]' : 'text-red-400'}>
              {isConnected 
                ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
                : farcasterUser
                  ? `@${farcasterUser.username}`
                  : 'NOT CONNECTED'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono mt-1">
            <span className="text-gray-400">TIER:</span>
            <span className="text-[#00D4FF]">{tier}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono mt-1">
            <span className="text-gray-400">PRICE:</span>
            <span className="text-white">$1.00 USDC</span>
          </div>
          <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono mt-1">
            <span className="text-gray-400">REWARD:</span>
            <span className="text-[#00FF88]">100,000 VOT</span>
          </div>
        </div>
        
        {/* Queue Status */}
        {queuePosition !== null && (
          <div className="mx-3 sm:mx-4 mb-3 sm:mb-4 p-2 sm:p-3 bg-[#00D4FF]/10 rounded-lg border border-[#00D4FF]/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
              <span className="text-[#00D4FF] font-mono text-xs sm:text-sm">
                Queue Position: {queuePosition}
              </span>
            </div>
          </div>
        )}
        
        {/* Mint Result */}
        {mintResult && (
          <div className="mx-3 sm:mx-4 mb-3 sm:mb-4 p-3 sm:p-4 bg-[#00FF88]/10 rounded-lg border border-[#00FF88]/50">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl mb-2">✅</div>
              <p className="text-[#00FF88] font-mono font-bold text-sm sm:text-base">NFT MINTED!</p>
              {mintResult.tokenId && (
                <p className="text-[10px] sm:text-xs text-gray-400 mt-2 font-mono">
                  Token ID: #{mintResult.tokenId}
                </p>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                {mintResult.landingUrl && (
                  <a 
                    href={mintResult.landingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 text-[10px] sm:text-xs text-[#00D4FF] bg-[#00D4FF]/10 rounded-lg hover:bg-[#00D4FF]/20 font-mono text-center"
                  >
                    View NFT →
                  </a>
                )}
                <button
                  onClick={handleShare}
                  className="flex-1 py-2 px-3 text-[10px] sm:text-xs text-[#855DCD] bg-[#855DCD]/10 rounded-lg hover:bg-[#855DCD]/20 font-mono"
                >
                  {isInMiniApp ? '📣 Cast' : '🔗 Share'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Button */}
        <div className="p-3 sm:p-4 pt-0">
          {!isConnected && !farcasterUser ? (
            <button
              onClick={() => coinbaseConnector && connect({ connector: coinbaseConnector })}
              className={`w-full ${classes.button} text-black bg-gradient-to-r from-[#00FF88] to-[#00D4FF] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]`}
              style={{ minHeight: ui.buttonHeight }}
            >
              {ui.isInMiniApp ? 'CONNECT' : 'CONNECT WALLET'}
            </button>
          ) : (
            <button
              onClick={handleMint}
              disabled={minting || loading}
              className={`w-full ${classes.button} disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#00FF88] to-[#00D4FF] text-black`}
              style={{ minHeight: ui.buttonHeight }}
            >
              {minting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚡</span>
                  MINTING...
                </span>
              ) : loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">🔄</span>
                  LOADING...
                </span>
              ) : (
                <>🎰 MINT NFT</>
              )}
            </button>
          )}
        </div>
        
        {/* Status Message */}
        {status && !mintResult && (
          <div className={`px-3 sm:px-4 pb-3 sm:pb-4 text-center font-mono text-[10px] sm:text-sm ${
            status.includes('✅') ? 'text-[#00FF88]' :
            status.includes('❌') ? 'text-red-400' :
            'text-gray-400'
          }`}>
            <span className="animate-pulse">▶</span> {status}
          </div>
        )}
        
        {/* Footer Info */}
        <div className="border-t border-[#00FF88]/20 p-2 sm:p-3 text-center" style={{
          paddingBottom: ui.isInMiniApp ? `calc(${ui.safeAreaInsets.bottom}px + 8px)` : undefined,
        }}>
          <p className="text-[8px] sm:text-[10px] text-gray-500 font-mono">
            $1 USDC • 100K VOT • 1% Burns • NFT Mints
          </p>
          <p className="text-[8px] sm:text-[10px] text-[#00D4FF]/70 font-mono mt-0.5 sm:mt-1">
            {ui.platform === 'farcaster-mini' && '🟣 Farcaster • '}
            {ui.platform === 'base-mobile' && '🔵 Base • '}
            EIP-4804 Ready • Future Staking
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveVOTMachine;
