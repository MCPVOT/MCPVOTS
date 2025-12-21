'use client';

import Image from 'next/image';
import React, { useCallback, useEffect, useState } from 'react';
import { base, mainnet } from 'viem/chains';
import { useAccount, useChainId, useConnect, useSwitchChain } from 'wagmi';

// =============================================================================
// VOT MACHINE MODAL - Enhanced NFT Mint Experience
// =============================================================================
// Features:
// - Full user data fetching (ENS, Farcaster, holdings, Basename)
// - OpenRouter LLM integration for personalized SVG
// - IPFS preview with HTML/SVG/CSS
// - ENS contenthash update option
// - Popup/Modal mode for mini-app embedding
// - Multi-chain support (Base for mint, Mainnet for ENS)
// =============================================================================

interface TraitStatus {
  vot: boolean;
  mcpvot: boolean;
  warplet: boolean;
  base: boolean;
  farcaster: boolean;
  ens: boolean;
}

interface UserProfile {
  address: string;
  // ENS Data
  ensName?: string;
  ensAvatar?: string;
  ensDescription?: string;
  ensContenthash?: string;
  ensRecords?: Record<string, string>;
  // Basename Data  
  basename?: string;
  basenameAvatar?: string;
  // Farcaster Data
  farcasterFid?: number;
  farcasterUsername?: string;
  farcasterDisplayName?: string;
  farcasterBio?: string;
  farcasterPfp?: string;
  farcasterFollowers?: number;
  farcasterFollowing?: number;
  // Holdings
  votBalance?: string;
  maxxBalance?: string;
  usdcBalance?: string;
  ethBalance?: string;
  // Traits
  traits: TraitStatus;
  tier: string;
  // NFT Data
  hasWarpletNFT?: boolean;
  nftCount?: number;
}

interface MintResult {
  tokenId?: number;
  cid?: string;
  metadataCid?: string;
  svgCid?: string;
  txHash?: string;
  ipfsUrl?: string;
  ensUpdated?: boolean;
}

interface SVGPreview {
  svg: string;
  html: string;
  css: string;
  combined: string;
}

interface VOTMachineModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  mode?: 'inline' | 'modal' | 'popup';
  miniApp?: boolean; // Farcaster/Warpcast mini-app mode
}

// =============================================================================
// SVG PREVIEW COMPONENT
// =============================================================================

const SVGPreviewPanel: React.FC<{ 
  preview: SVGPreview | null; 
  loading: boolean;
  onRefresh: () => void;
}> = ({ preview, loading, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'svg' | 'html' | 'css'>('preview');
  
  if (!preview && !loading) return null;
  
  return (
    <div className="mt-4 rounded-lg border border-[#00FF88]/30 overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-[#00FF88]/20 bg-black/50">
        {(['preview', 'svg', 'html', 'css'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 text-xs font-mono uppercase transition-all
              ${activeTab === tab 
                ? 'bg-[#00FF88]/20 text-[#00FF88] border-b-2 border-[#00FF88]' 
                : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab}
          </button>
        ))}
        <button
          onClick={onRefresh}
          className="px-3 text-gray-500 hover:text-[#00FF88] transition-colors"
          title="Regenerate with OpenRouter"
        >
          🔄
        </button>
      </div>
      
      {/* Content */}
      <div className="p-3 bg-black/30 max-h-64 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin text-2xl">⚡</div>
            <span className="ml-2 text-[#00FF88] font-mono text-sm">
              OpenRouter generating SVG...
            </span>
          </div>
        ) : activeTab === 'preview' ? (
          <div 
            className="w-full aspect-video bg-[#0a0a0a] rounded overflow-hidden"
            dangerouslySetInnerHTML={{ __html: preview?.combined || '' }}
          />
        ) : (
          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto">
            {activeTab === 'svg' && preview?.svg}
            {activeTab === 'html' && preview?.html}
            {activeTab === 'css' && preview?.css}
          </pre>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// USER PROFILE CARD
// =============================================================================

const UserProfileCard: React.FC<{ profile: UserProfile | null; loading: boolean }> = ({ 
  profile, 
  loading 
}) => {
  if (loading) {
    return (
      <div className="p-4 bg-black/50 rounded-lg border border-[#00FF88]/20 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-700" />
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!profile) return null;
  
  const displayName = profile.farcasterDisplayName || profile.ensName || profile.basename || 
    `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`;
  const avatar = profile.farcasterPfp || profile.ensAvatar || profile.basenameAvatar;
  
  return (
    <div className="p-4 bg-black/50 rounded-lg border border-[#00FF88]/20">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {avatar ? (
          <Image 
            src={avatar} 
            alt="Profile" 
            width={48}
            height={48}
            className="w-12 h-12 rounded-full border-2 border-[#00FF88]/50 object-cover"
            unoptimized // External URLs need this
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] 
                          flex items-center justify-center text-black font-bold text-lg">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[#00FF88] font-bold truncate">{displayName}</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {profile.ensName && (
              <span className="text-xs px-2 py-0.5 bg-[#5298FF]/20 text-[#5298FF] rounded font-mono">
                {profile.ensName}
              </span>
            )}
            {profile.basename && (
              <span className="text-xs px-2 py-0.5 bg-[#0052FF]/20 text-[#0052FF] rounded font-mono">
                {profile.basename}
              </span>
            )}
            {profile.farcasterUsername && (
              <span className="text-xs px-2 py-0.5 bg-[#855DCD]/20 text-[#855DCD] rounded font-mono">
                @{profile.farcasterUsername}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Bio */}
      {(profile.farcasterBio || profile.ensDescription) && (
        <p className="mt-3 text-xs text-gray-400 font-mono line-clamp-2">
          {profile.farcasterBio || profile.ensDescription}
        </p>
      )}
      
      {/* Holdings Grid */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {profile.votBalance && parseFloat(profile.votBalance) > 0 && (
          <div className="text-xs font-mono">
            <span className="text-gray-500">VOT:</span>{' '}
            <span className="text-[#00FF88]">
              {parseFloat(profile.votBalance).toLocaleString()}
            </span>
          </div>
        )}
        {profile.maxxBalance && parseFloat(profile.maxxBalance) > 0 && (
          <div className="text-xs font-mono">
            <span className="text-gray-500">MAXX:</span>{' '}
            <span className="text-[#FF6B35]">
              {parseFloat(profile.maxxBalance).toLocaleString()}
            </span>
          </div>
        )}
        {profile.farcasterFollowers !== undefined && (
          <div className="text-xs font-mono">
            <span className="text-gray-500">Followers:</span>{' '}
            <span className="text-[#855DCD]">{profile.farcasterFollowers.toLocaleString()}</span>
          </div>
        )}
        {profile.nftCount !== undefined && profile.nftCount > 0 && (
          <div className="text-xs font-mono">
            <span className="text-gray-500">NFTs:</span>{' '}
            <span className="text-[#00D4FF]">{profile.nftCount}</span>
          </div>
        )}
      </div>
    </div>
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
// MAIN COMPONENT
// =============================================================================

const VOTMachineModal: React.FC<VOTMachineModalProps> = ({
  isOpen = true,
  onClose,
  mode = 'inline',
  // miniApp prop reserved for future Farcaster/Warpcast mini-app specific features
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  miniApp = false,
}) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [svgPreview, setSvgPreview] = useState<SVGPreview | null>(null);
  const [svgLoading, setSvgLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [showENSUpdate, setShowENSUpdate] = useState(false);
  const [ensUpdating, setEnsUpdating] = useState(false);
  
  // Find Smart Wallet connector
  const coinbaseConnector = connectors.find(
    c => c.id === 'coinbaseWalletSDK' || c.name === 'Coinbase Wallet'
  );
  
  // ==========================================================================
  // FETCH FULL USER PROFILE
  // ==========================================================================
  
  const fetchProfile = useCallback(async () => {
    if (!address) return;
    
    setProfileLoading(true);
    try {
      // Fetch comprehensive profile
      const response = await fetch(`/api/machine/profile?address=${address}&full=true`);
      if (!response.ok) throw new Error('Profile fetch failed');
      
      const data = await response.json();
      
      const traits: TraitStatus = {
        vot: parseFloat(data.votBalance || '0') > 0,
        mcpvot: parseFloat(data.votBalance || '0') >= 100000,
        warplet: data.hasWarpletNFT || false,
        base: !!data.basename,
        farcaster: !!data.farcasterFid,
        ens: !!data.ensName,
      };
      
      setProfile({
        address,
        ...data,
        traits,
        tier: calculateTier(traits),
      });
      
    } catch (err) {
      console.error('Profile fetch error:', err);
      // Fallback to basic profile
      const traits: TraitStatus = {
        vot: false,
        mcpvot: false,
        warplet: false,
        base: true,
        farcaster: false,
        ens: false,
      };
      setProfile({
        address,
        traits,
        tier: calculateTier(traits),
      });
    } finally {
      setProfileLoading(false);
    }
  }, [address]);
  
  // ==========================================================================
  // GENERATE SVG WITH OPENROUTER
  // ==========================================================================
  
  const generateSVGPreview = useCallback(async () => {
    if (!profile) return;
    
    setSvgLoading(true);
    try {
      const response = await fetch('/api/machine/generate-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          useOpenRouter: true, // Enable LLM enhancement
          // Uses models from .env.local with fallback chain:
          // devstral-2512 → kat-coder-pro → deepseek-v3.1-nex-n1 → minimax-m2
        }),
      });
      
      if (!response.ok) throw new Error('SVG generation failed');
      
      const data = await response.json();
      setSvgPreview(data.preview);
      
    } catch (err) {
      console.error('SVG generation error:', err);
      setStatus('⚠️ SVG preview failed - will generate on mint');
    } finally {
      setSvgLoading(false);
    }
  }, [profile]);
  
  // ==========================================================================
  // MINT NFT
  // ==========================================================================
  
  const handleMint = async () => {
    if (!isConnected || !address || !profile) {
      setStatus('Connect wallet first');
      return;
    }
    
    // Ensure on Base for minting
    if (chainId !== base.id) {
      setStatus('Switching to Base network...');
      try {
        await switchChainAsync({ chainId: base.id });
        await new Promise(r => setTimeout(r, 500));
      } catch {
        setStatus('❌ Please switch to Base network');
        return;
      }
    }
    
    setMinting(true);
    setStatus('Initiating x402 payment...');
    setMintResult(null);
    
    try {
      // Generate fallback SVG if no preview available
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#0a0a0a"/>
        <rect x="10" y="10" width="380" height="280" rx="8" fill="none" stroke="#00FF88" stroke-width="2"/>
        <text x="200" y="40" text-anchor="middle" font-family="monospace" font-size="16" fill="#00D4FF">VOT MACHINE // BUILDER NFT</text>
        <text x="200" y="80" text-anchor="middle" font-family="monospace" font-size="14" fill="#00FF88">TIER: ${profile.tier}</text>
        <text x="200" y="120" text-anchor="middle" font-family="monospace" font-size="12" fill="#FFFFFF">${profile.displayName || address?.slice(0, 10)}</text>
        <text x="200" y="260" text-anchor="middle" font-family="monospace" font-size="10" fill="#00FF88">x402 PROTOCOL • BASE NETWORK</text>
      </svg>`;
      
      const mintResponse = await fetch('/api/x402/mint-builder-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address, // API expects userAddress
          svgContent: svgPreview?.combined || fallbackSvg, // API expects svgContent
          profile, // Send full profile for metadata
          traits: profile.traits,
          tier: profile.tier,
        }),
      });
      
      if (!mintResponse.ok) {
        const errorData = await mintResponse.json();
        if (errorData.queued) {
          setQueuePosition(errorData.position);
          pollQueueStatus(errorData.queueId);
          return;
        }
        throw new Error(errorData.error || 'Mint failed');
      }
      
      const result = await mintResponse.json();
      
      if (result.queued) {
        setQueuePosition(result.position);
        setStatus(`Queued: Position ${result.position}`);
        pollQueueStatus(result.queueId);
      } else {
        setMintResult({
          tokenId: result.tokenId,
          cid: result.cid,
          metadataCid: result.metadataCid,
          svgCid: result.svgCid,
          txHash: result.txHash,
          ipfsUrl: `https://ipfs.io/ipfs/${result.cid}`,
        });
        setStatus('✅ VOT Machine NFT Minted!');
        setShowENSUpdate(!!profile.ensName);
      }
      
    } catch (err) {
      console.error('Mint error:', err);
      setStatus(`❌ ${err instanceof Error ? err.message : 'Mint failed'}`);
    } finally {
      setMinting(false);
    }
  };
  
  // ==========================================================================
  // UPDATE ENS CONTENTHASH
  // ==========================================================================
  
  const handleENSUpdate = async () => {
    if (!mintResult?.cid || !profile?.ensName) return;
    
    // Need to be on Mainnet for ENS
    if (chainId !== mainnet.id) {
      setStatus('Switching to Ethereum Mainnet for ENS...');
      try {
        await switchChainAsync({ chainId: mainnet.id });
        await new Promise(r => setTimeout(r, 500));
      } catch {
        setStatus('❌ Please switch to Ethereum Mainnet for ENS update');
        return;
      }
    }
    
    setEnsUpdating(true);
    setStatus('Updating ENS contenthash...');
    
    try {
      const response = await fetch('/api/ens/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setContenthash',
          name: profile.ensName,
          cid: mintResult.cid,
          // User signs the transaction
          requireSignature: true,
        }),
      });
      
      if (!response.ok) throw new Error('ENS update failed');
      
      // Response contains tx hash but we don't need it for UI
      await response.json();
      setMintResult(prev => prev ? { ...prev, ensUpdated: true } : null);
      setStatus(`✅ ENS updated! ${profile.ensName} → ipfs://${mintResult.cid.slice(0, 8)}...`);
      
    } catch (err) {
      console.error('ENS update error:', err);
      setStatus(`❌ ENS update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setEnsUpdating(false);
    }
  };
  
  // ==========================================================================
  // POLL QUEUE STATUS
  // ==========================================================================
  
  const pollQueueStatus = async (queueId: string) => {
    const maxAttempts = 30;
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setStatus('❌ Queue timeout - try again');
        return;
      }
      
      try {
        const response = await fetch(`/api/x402/mint-builder-nft/status?id=${queueId}`);
        const data = await response.json();
        
        if (data.status === 'completed') {
          setMintResult({
            tokenId: data.tokenId,
            cid: data.cid,
            svgCid: data.svgCid,
            txHash: data.txHash,
            ipfsUrl: `https://ipfs.io/ipfs/${data.cid}`,
          });
          setStatus('✅ VOT Machine NFT Minted!');
          setQueuePosition(null);
          setShowENSUpdate(!!profile?.ensName);
          return;
        }
        
        if (data.status === 'failed') {
          setStatus(`❌ ${data.error || 'Mint failed'}`);
          setQueuePosition(null);
          return;
        }
        
        setQueuePosition(data.position || 0);
        setStatus(`Processing... Position: ${data.position || 0}`);
        
        attempts++;
        setTimeout(poll, 3000);
      } catch {
        attempts++;
        setTimeout(poll, 3000);
      }
    };
    
    poll();
  };
  
  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  
  useEffect(() => {
    if (isConnected && address) {
      fetchProfile();
    }
  }, [isConnected, address, fetchProfile]);
  
  useEffect(() => {
    if (profile && !svgPreview && !svgLoading) {
      generateSVGPreview();
    }
  }, [profile, svgPreview, svgLoading, generateSVGPreview]);
  
  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  if (!isOpen && mode !== 'inline') return null;
  
  const content = (
    <div className="relative w-full max-w-lg mx-auto">
      {/* CRT Glow Border Effect */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="w-full h-full rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,212,255,0.1) 100%)',
            boxShadow: `
              inset 0 0 30px rgba(0,255,136,0.1),
              0 0 20px rgba(0,255,136,0.2),
              0 0 40px rgba(0,212,255,0.1)
            `,
          }}
        />
      </div>
      
      {/* Main Container */}
      <div className="relative z-10 bg-black/95 backdrop-blur-md rounded-xl border border-[#00FF88]/30 overflow-hidden">
        {/* Scanline Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-20 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.1) 2px, rgba(0,255,136,0.1) 4px)',
          }}
        />
        
        {/* Header */}
        <div className="relative border-b border-[#00FF88]/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            {mode !== 'inline' && onClose && (
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          <h2 className="text-center font-mono text-lg tracking-wider">
            <span className="text-[#00D4FF]">🎰</span>
            <span className="text-[#00FF88] mx-2">VOT MACHINE</span>
            <span className="text-[#00D4FF]">{'//'} BUILDER NFT</span>
          </h2>
          <p className="text-center text-xs text-gray-500 mt-1 font-mono">
            ERC-1155 • IPFS • x402 • ENS Web
          </p>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* User Profile Card */}
          <UserProfileCard profile={profile} loading={profileLoading} />
          
          {/* Traits Display */}
          {profile && (
            <div className="p-3 bg-black/50 rounded-lg border border-[#00FF88]/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500 font-mono uppercase">Active Traits</span>
                <span className="text-xs font-mono text-[#00D4FF]">
                  Tier: {profile.tier}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(profile.traits).map(([trait, active]) => (
                  <span 
                    key={trait}
                    className={`px-2 py-1 text-xs font-mono rounded border transition-all
                      ${active 
                        ? 'bg-[#00FF88]/20 border-[#00FF88]/50 text-[#00FF88]' 
                        : 'bg-gray-900/50 border-gray-700/50 text-gray-600'}`}
                  >
                    {trait.toUpperCase()}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500 font-mono">
                ▶ {Object.values(profile.traits).filter(Boolean).length}/6 TRAITS ACTIVE
              </div>
            </div>
          )}
          
          {/* SVG Preview */}
          <SVGPreviewPanel 
            preview={svgPreview} 
            loading={svgLoading}
            onRefresh={generateSVGPreview}
          />
          
          {/* Mint Info */}
          <div className="p-3 bg-black/50 rounded-lg border border-[#00FF88]/20">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">PRICE:</span>
                <span className="text-white">$1.00 USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">REWARD:</span>
                <span className="text-[#00FF88]">100,000 VOT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">BURN:</span>
                <span className="text-[#FF6B35]">1% (1,000 VOT)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">NETWORK:</span>
                <span className="text-[#0052FF]">Base</span>
              </div>
            </div>
          </div>
          
          {/* Queue Status */}
          {queuePosition !== null && (
            <div className="p-3 bg-[#00D4FF]/10 rounded-lg border border-[#00D4FF]/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
                <span className="text-[#00D4FF] font-mono text-sm">
                  Queue Position: {queuePosition}
                </span>
              </div>
            </div>
          )}
          
          {/* Mint Result */}
          {mintResult && (
            <div className="p-4 bg-[#00FF88]/10 rounded-lg border border-[#00FF88]/50">
              <div className="text-center mb-3">
                <div className="text-3xl mb-1">✅</div>
                <p className="text-[#00FF88] font-mono font-bold">NFT MINTED!</p>
              </div>
              
              {/* IPFS Links */}
              <div className="space-y-2 text-xs font-mono">
                {mintResult.tokenId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Token ID:</span>
                    <span className="text-white">#{mintResult.tokenId}</span>
                  </div>
                )}
                {mintResult.cid && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">IPFS CID:</span>
                    <a 
                      href={mintResult.ipfsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00D4FF] hover:underline"
                    >
                      {mintResult.cid.slice(0, 12)}... →
                    </a>
                  </div>
                )}
                {mintResult.svgCid && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">SVG Site:</span>
                    <a 
                      href={`https://ipfs.io/ipfs/${mintResult.svgCid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00D4FF] hover:underline"
                    >
                      View HTML/SVG →
                    </a>
                  </div>
                )}
                {mintResult.txHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Transaction:</span>
                    <a 
                      href={`https://basescan.org/tx/${mintResult.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00D4FF] hover:underline"
                    >
                      BaseScan →
                    </a>
                  </div>
                )}
              </div>
              
              {/* ENS Update Option */}
              {showENSUpdate && profile?.ensName && !mintResult.ensUpdated && (
                <div className="mt-4 pt-3 border-t border-[#00FF88]/20">
                  <p className="text-xs text-gray-400 font-mono mb-2">
                    🌐 Update your ENS web to this NFT?
                  </p>
                  <button
                    onClick={handleENSUpdate}
                    disabled={ensUpdating}
                    className="w-full py-2 px-4 rounded-lg font-mono text-sm transition-all
                               bg-[#5298FF]/20 border border-[#5298FF]/50 text-[#5298FF]
                               hover:bg-[#5298FF]/30 disabled:opacity-50"
                  >
                    {ensUpdating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⚡</span>
                        Updating {profile.ensName}...
                      </span>
                    ) : (
                      <>Set {profile.ensName} contenthash</>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-600 font-mono mt-1 text-center">
                    Requires Ethereum Mainnet transaction
                  </p>
                </div>
              )}
              
              {mintResult.ensUpdated && (
                <div className="mt-3 p-2 bg-[#5298FF]/10 rounded text-center">
                  <span className="text-[#5298FF] font-mono text-xs">
                    ✓ ENS contenthash updated!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="p-4 pt-0 space-y-2">
          {!isConnected ? (
            <button
              onClick={() => coinbaseConnector && connect({ connector: coinbaseConnector })}
              className="w-full py-4 px-6 rounded-lg font-mono font-bold text-black transition-all
                         bg-gradient-to-r from-[#00FF88] to-[#00D4FF]
                         hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]
                         active:scale-[0.98]"
            >
              CONNECT WALLET
            </button>
          ) : (
            <button
              onClick={handleMint}
              disabled={minting || profileLoading || !!mintResult}
              className="w-full py-4 px-6 rounded-lg font-mono font-bold transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         bg-gradient-to-r from-[#00FF88] to-[#00D4FF] text-black
                         hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]
                         active:scale-[0.98]"
            >
              {minting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚡</span>
                  MINTING...
                </span>
              ) : mintResult ? (
                <>✅ MINTED!</>
              ) : (
                <>🎰 MINT VOT MACHINE NFT</>
              )}
            </button>
          )}
          
          {/* Status Message */}
          {status && !mintResult && (
            <div className={`text-center font-mono text-sm py-2 ${
              status.includes('✅') ? 'text-[#00FF88]' :
              status.includes('❌') ? 'text-red-400' :
              status.includes('⚠️') ? 'text-yellow-400' :
              'text-gray-400'
            }`}>
              {status}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-[#00FF88]/20 p-3 text-center">
          <p className="text-[10px] text-gray-500 font-mono">
            Pay $1 USDC • Receive 100,000 VOT • 1% Burns • NFT Mints
          </p>
          <p className="text-[10px] text-[#00D4FF]/70 font-mono mt-1">
            Powered by x402 Protocol • OpenRouter AI • EIP-4804 Ready
          </p>
        </div>
      </div>
    </div>
  );
  
  // Modal wrapper for popup mode
  if (mode === 'modal' || mode === 'popup') {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        {content}
      </div>
    );
  }
  
  return content;
};

export default VOTMachineModal;
