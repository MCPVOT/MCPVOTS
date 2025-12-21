'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';

const profileCache = new Map<string, { data: UserProfile; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// BEEPER NFT Contract on Base - use environment variable
const BEEPER_CONTRACT = process.env.NEXT_PUBLIC_BEEPER_CONTRACT || '0x0000000000000000000000000000000000000000';
const OPENSEA_COLLECTION = 'https://opensea.io/collection/beeper-nft';

// Queue polling interval (3 seconds)
const QUEUE_POLL_INTERVAL = 3000;

interface UserProfile {
  ensName?: string;
  basename?: string;
  farcasterUsername?: string;
  farcasterFid?: number;
  votBalance?: string;
}

interface TraitStatus {
  vot: boolean;
  mcpvot: boolean;
  base: boolean;
  farcaster: boolean;
  ens: boolean;
}

interface MintResult {
  tokenId?: number;
  cid?: string;
  txHash?: string;
  rarity?: string;
  svgContent?: string;
}

interface QueueStatus {
  queueId?: string;
  position?: number;
  aheadOfYou?: number;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  message?: string;
  estimatedWaitSeconds?: number;
}

const AnimatedBeeperDino: React.FC = () => {
  return (
    <svg viewBox="-90 -70 180 140" className="w-36 h-36 sm:w-44 sm:h-44">
      <defs>
        <linearGradient id="dinoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#77FE80"/>
          <stop offset="100%" stopColor="#5DE066"/>
        </linearGradient>
        <filter id="dinoGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="0" cy="0" r="65" fill="none" stroke="#77FE80" strokeWidth="2" opacity="0.3">
        <animate attributeName="r" values="65;70;65" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="0" cy="0" r="60" fill="#050505" stroke="#77FE80" strokeWidth="1" opacity="0.8"/>
      <g filter="url(#dinoGlow)">
        <animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="3s" repeatCount="indefinite"/>
        <path d="M-25,-22 C-28,-32 -14,-40 11,-40 C32,-38 47,-25 49,-7 C50,7 43,22 29,25 C11,29 -14,25 -25,14 C-32,4 -30,-11 -25,-22 Z" fill="url(#dinoGrad)"/>
        <ellipse cx="40" cy="-11" rx="11" ry="14" fill="url(#dinoGrad)"/>
        <ellipse cx="-4" cy="-14" rx="14" ry="11" fill="#030303"/>
        <ellipse cx="-4" cy="-14" rx="10" ry="8" fill="#77FE80">
          <animate attributeName="fill" values="#77FE80;#aaffaa;#77FE80" dur="2.4s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="-4" cy="-14" rx="4" ry="7" fill="#030303">
          <animate attributeName="rx" values="4;2;4" dur="3.6s" repeatCount="indefinite"/>
        </ellipse>
        <circle cx="-7" cy="-17" r="2" fill="#fff" opacity="0.9"/>
        <ellipse cx="42" cy="-6" rx="3" ry="2" fill="#030303"/>
        <path d="M14,14 Q32,20 47,11" fill="none" stroke="#4CAF50" strokeWidth="1.5"/>
        <path d="M22,8 L24,16 L26,8 M30,6 L32,15 L34,6 M38,4 L40,12 L42,4" fill="#fff" stroke="#e8e8e8" strokeWidth="0.8"/>
        <polygon points="-13,-38 -9,-50 -5,-38" fill="url(#dinoGrad)"/>
        <polygon points="0,-40 4,-50 8,-40" fill="url(#dinoGrad)"/>
      </g>
    </svg>
  );
};

// Generate full SVG banner for minted NFT
const generateNFTBanner = (
  address: string,
  traits: string[],
  rarity: string,
  tokenId: number,
  displayName?: string
): string => {
  const rarityColors: Record<string, string> = {
    'X402': '#FFD700',
    'GM': '#FF6B6B', 
    'FOMO': '#FF8C00',
    'ZZZ': '#9B59B6',
    'GENESIS': '#3498DB',
    'OG': '#2ECC71',
    'WHALE': '#1ABC9C',
    'VALIDATOR': '#77FE80',
    'NODE': '#95A5A6',
  };
  const rarityColor = rarityColors[rarity] || '#77FE80';
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const name = displayName || shortAddr;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="50%" stop-color="#111111"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="dinoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#77FE80"/>
      <stop offset="100%" stop-color="#5DE066"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="rarityGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="500" height="500" fill="url(#bgGrad)"/>
  
  <!-- Border -->
  <rect x="10" y="10" width="480" height="480" rx="20" fill="none" stroke="#77FE80" stroke-width="2" opacity="0.5"/>
  <rect x="20" y="20" width="460" height="460" rx="15" fill="none" stroke="#77FE80" stroke-width="1" opacity="0.3"/>
  
  <!-- Header -->
  <text x="250" y="55" text-anchor="middle" font-family="monospace" font-size="28" font-weight="bold" fill="#77FE80" filter="url(#glow)">🦖 BEEPER NFT</text>
  <text x="250" y="80" text-anchor="middle" font-family="monospace" font-size="14" fill="#666666">x402 V2 • ERC-1155 • Base</text>
  
  <!-- Dino Character -->
  <g transform="translate(250, 200)">
    <circle cx="0" cy="0" r="90" fill="none" stroke="${rarityColor}" stroke-width="3" opacity="0.4"/>
    <circle cx="0" cy="0" r="80" fill="#050505" stroke="${rarityColor}" stroke-width="2" opacity="0.8"/>
    <g filter="url(#glow)">
      <path d="M-35,-30 C-40,-45 -20,-55 15,-55 C45,-52 65,-35 68,-10 C70,10 60,30 40,35 C15,40 -20,35 -35,20 C-45,5 -42,-15 -35,-30 Z" fill="url(#dinoGrad)"/>
      <ellipse cx="55" cy="-15" rx="15" ry="20" fill="url(#dinoGrad)"/>
      <ellipse cx="-5" cy="-20" rx="20" ry="15" fill="#030303"/>
      <ellipse cx="-5" cy="-20" rx="14" ry="11" fill="#77FE80"/>
      <ellipse cx="-5" cy="-20" rx="6" ry="10" fill="#030303"/>
      <circle cx="-10" cy="-24" r="3" fill="#fff" opacity="0.9"/>
      <ellipse cx="58" cy="-8" rx="4" ry="3" fill="#030303"/>
      <path d="M20,20 Q45,28 65,15" fill="none" stroke="#4CAF50" stroke-width="2"/>
      <path d="M30,12 L33,22 L36,12 M42,8 L45,20 L48,8 M52,5 L55,16 L58,5" fill="#fff" stroke="#e8e8e8" stroke-width="1"/>
      <polygon points="-18,-52 -12,-68 -6,-52" fill="url(#dinoGrad)"/>
      <polygon points="0,-55 6,-70 12,-55" fill="url(#dinoGrad)"/>
    </g>
  </g>
  
  <!-- Rarity Badge -->
  <rect x="175" y="295" width="150" height="40" rx="20" fill="${rarityColor}" opacity="0.2"/>
  <rect x="175" y="295" width="150" height="40" rx="20" fill="none" stroke="${rarityColor}" stroke-width="2" filter="url(#rarityGlow)"/>
  <text x="250" y="322" text-anchor="middle" font-family="monospace" font-size="18" font-weight="bold" fill="${rarityColor}">${rarity}</text>
  
  <!-- Token Info -->
  <text x="250" y="365" text-anchor="middle" font-family="monospace" font-size="16" fill="#FFFFFF">${name}</text>
  <text x="250" y="390" text-anchor="middle" font-family="monospace" font-size="12" fill="#888888">Token #${tokenId}</text>
  
  <!-- Traits -->
  <text x="250" y="420" text-anchor="middle" font-family="monospace" font-size="11" fill="#666666">TRAITS: ${traits.length > 0 ? traits.join(' • ') : 'NONE'}</text>
  
  <!-- Footer -->
  <text x="250" y="455" text-anchor="middle" font-family="monospace" font-size="11" fill="#77FE80">69,420 VOT • mcpvot.eth</text>
  <text x="250" y="475" text-anchor="middle" font-family="monospace" font-size="10" fill="#444444">ipfs • on-chain • gasless</text>
</svg>`;
};

// NFT Banner Modal Component
const NFTBannerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  svgContent: string;
  mintResult: MintResult;
  onShare: () => void;
  shareBonus: boolean;
}> = ({ isOpen, onClose, svgContent, mintResult, onShare, shareBonus }) => {
  if (!isOpen) return null;
  
  const handleSaveSVG = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beeper-nft-${mintResult.tokenId || 'mint'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleOpenSea = () => {
    // OpenSea URL for Base chain - fallback to collection if no tokenId or contract not deployed
    const isContractDeployed = BEEPER_CONTRACT !== '0x0000000000000000000000000000000000000000';
    const openSeaUrl = isContractDeployed && mintResult.tokenId
      ? `https://opensea.io/assets/base/${BEEPER_CONTRACT}/${mintResult.tokenId}`
      : OPENSEA_COLLECTION;
    window.open(openSeaUrl, '_blank');
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-2xl border border-[#77FE80]/50 overflow-hidden">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 border border-[#77FE80]/30 text-[#77FE80] hover:bg-[#77FE80]/20 transition text-2xl"
        >
          ×
        </button>
        
        {/* Header */}
        <div className="p-4 border-b border-[#77FE80]/30 text-center">
          <h3 className="text-2xl font-mono font-bold text-[#77FE80]">🎉 Your BEEPER NFT!</h3>
          <p className="text-gray-400 font-mono text-sm mt-1">Successfully minted on Base</p>
        </div>
        
        {/* NFT Banner Preview */}
        <div className="p-4">
          <div className="rounded-xl overflow-hidden border border-[#77FE80]/30 bg-black">
            <div 
              dangerouslySetInnerHTML={{ __html: svgContent }}
              className="w-full aspect-square"
            />
          </div>
        </div>
        
        {/* Rarity & Token Info */}
        <div className="px-4 pb-2 text-center">
          {mintResult.rarity && (
            <span className="inline-block px-4 py-1 rounded-full bg-[#77FE80]/20 border border-[#77FE80]/50 text-[#77FE80] font-mono font-bold text-lg">
              {mintResult.rarity} RARITY
            </span>
          )}
          {mintResult.tokenId && (
            <p className="text-gray-400 font-mono text-sm mt-2">Token #{mintResult.tokenId}</p>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleOpenSea}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono font-bold text-base bg-[#2081E2] text-white hover:bg-[#1868B7] transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 90 90" fill="currentColor">
                <path d="M45 0C20.151 0 0 20.151 0 45C0 69.849 20.151 90 45 90C69.849 90 90 69.849 90 45C90 20.151 69.858 0 45 0ZM22.203 46.512L22.392 46.206L34.101 27.891C34.272 27.63 34.677 27.657 34.803 27.945C36.756 32.328 38.448 37.782 37.656 41.175C37.323 42.57 36.396 44.46 35.352 46.206C35.217 46.458 35.073 46.701 34.92 46.937C34.839 47.061 34.704 47.133 34.56 47.133H22.545C22.221 47.133 22.032 46.773 22.203 46.512ZM74.376 52.812C74.376 52.983 74.277 53.127 74.133 53.19C73.224 53.577 70.119 55.008 68.832 56.799C65.538 61.38 63.027 67.932 57.402 67.932H33.948C25.632 67.932 18.9 61.173 18.9 52.83V52.56C18.9 52.344 19.08 52.164 19.305 52.164H32.373C32.634 52.164 32.823 52.398 32.805 52.659C32.706 53.505 32.868 54.378 33.273 55.17C34.047 56.745 35.658 57.726 37.395 57.726H43.866V52.677H37.467C37.143 52.677 36.945 52.299 37.134 52.029C37.206 51.921 37.287 51.804 37.368 51.669C37.971 50.823 38.835 49.491 39.699 47.97C40.311 46.893 40.905 45.729 41.382 44.559C41.472 44.361 41.544 44.153 41.616 43.953C41.733 43.593 41.85 43.251 41.931 42.909C42.012 42.621 42.075 42.324 42.138 42.045C42.354 41.055 42.444 40.002 42.444 38.913C42.444 38.502 42.426 38.073 42.39 37.662C42.372 37.215 42.318 36.768 42.264 36.321C42.228 35.946 42.156 35.58 42.084 35.196C42.012 34.749 41.913 34.311 41.805 33.864L41.769 33.693C41.688 33.345 41.616 33.015 41.517 32.667C41.238 31.617 40.923 30.594 40.575 29.634C40.446 29.232 40.299 28.848 40.152 28.464C39.933 27.882 39.714 27.36 39.522 26.856C39.429 26.649 39.348 26.46 39.267 26.262C39.177 26.028 39.078 25.794 38.979 25.569C38.907 25.398 38.826 25.236 38.763 25.074L38.169 23.967C38.061 23.769 38.241 23.535 38.457 23.598L42.183 24.642H42.192C42.201 24.642 42.201 24.642 42.21 24.642L42.705 24.786L43.254 24.939L43.452 24.993V21.78C43.452 20.196 44.712 18.9 46.278 18.9C47.061 18.9 47.772 19.206 48.285 19.719C48.798 20.232 49.104 20.943 49.104 21.78V26.037L49.5 26.145C49.536 26.154 49.572 26.172 49.599 26.19C49.725 26.289 49.914 26.442 50.157 26.631C50.346 26.784 50.553 26.973 50.796 27.18C51.291 27.594 51.885 28.107 52.524 28.71C52.695 28.863 52.857 29.016 53.01 29.178C53.838 29.961 54.756 30.861 55.62 31.869C55.863 32.157 56.097 32.454 56.34 32.76C56.583 33.075 56.844 33.381 57.069 33.696C57.366 34.101 57.681 34.524 57.96 34.965C58.095 35.172 58.248 35.388 58.383 35.604C58.77 36.207 59.112 36.828 59.427 37.449C59.562 37.728 59.697 38.025 59.805 38.313C60.12 39.06 60.363 39.816 60.507 40.572C60.552 40.716 60.579 40.878 60.597 41.031V41.067C60.669 41.331 60.696 41.613 60.723 41.904C60.813 42.708 60.768 43.521 60.597 44.352C60.525 44.694 60.435 45.018 60.327 45.36C60.21 45.711 60.093 46.044 59.958 46.386C59.697 46.989 59.391 47.592 59.04 48.15C58.914 48.384 58.761 48.627 58.608 48.861C58.437 49.104 58.266 49.347 58.095 49.572C57.879 49.86 57.645 50.166 57.402 50.436C57.186 50.706 56.97 50.976 56.727 51.228C56.385 51.624 56.052 52.002 55.701 52.353C55.494 52.578 55.269 52.812 55.035 53.028C54.81 53.262 54.567 53.478 54.351 53.676C54.009 53.973 53.721 54.216 53.469 54.414L53.019 54.774C52.929 54.846 52.812 54.891 52.686 54.891H49.104V59.184H54.513C55.62 59.184 56.673 58.788 57.519 58.068C57.816 57.816 59.112 56.691 60.633 55.179C60.669 55.143 60.714 55.116 60.768 55.098L73.863 51.363C74.124 51.282 74.376 51.48 74.376 51.759V52.812Z"/>
              </svg>
              OpenSea
            </button>
            
            <button 
              onClick={handleSaveSVG}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono font-bold text-base bg-[#77FE80]/20 text-[#77FE80] border border-[#77FE80]/50 hover:bg-[#77FE80]/30 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Save SVG
            </button>
          </div>
          
          {/* Links */}
          <div className="flex gap-3 justify-center">
            {mintResult.cid && (
              <a 
                href={`https://ipfs.io/ipfs/${mintResult.cid}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-4 py-2 text-sm text-[#77FE80] border border-[#77FE80]/30 rounded-lg hover:bg-[#77FE80]/10 font-mono transition"
              >
                📁 IPFS
              </a>
            )}
            {mintResult.txHash && (
              <a 
                href={`https://basescan.org/tx/${mintResult.txHash}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-4 py-2 text-sm text-[#77FE80] border border-[#77FE80]/30 rounded-lg hover:bg-[#77FE80]/10 font-mono transition"
              >
                🔍 BaseScan
              </a>
            )}
          </div>
          
          {/* Share Bonus */}
          {!shareBonus ? (
            <div className="p-4 bg-[#77FE80]/10 rounded-xl border border-[#77FE80]/30">
              <p className="text-[#77FE80] font-mono text-base mb-2 text-center">🎁 Share to Earn!</p>
              <p className="text-gray-400 text-sm font-mono mb-3 text-center">Share on Farcaster for +10,000 VOT bonus</p>
              <button 
                onClick={onShare}
                className="w-full py-3 px-4 rounded-xl font-mono font-bold text-base text-white transition-all bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)]"
              >
                📣 SHARE (+10K VOT)
              </button>
            </div>
          ) : (
            <div className="text-center py-3 text-[#77FE80] font-mono text-lg">
              🎉 +10,000 VOT bonus claimed!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const X402MintVOTMachinePanel: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  
  const [minting, setMinting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [shareBonus, setShareBonus] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [generatedSVG, setGeneratedSVG] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [traits, setTraits] = useState<TraitStatus>({
    vot: false, mcpvot: false, base: false, farcaster: false, ens: false,
  });
  
  const coinbaseConnector = connectors.find(
    c => c.id === 'coinbaseWalletSDK' || c.name === 'Coinbase Wallet'
  );
  
  // Queue status polling
  useEffect(() => {
    if (!queueStatus?.queueId || !address) return;
    if (queueStatus.status === 'completed' || queueStatus.status === 'failed') return;
    
    const pollQueue = async () => {
      try {
        const response = await fetch(`/api/x402/queue?wallet=${address}`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'completed' && data.result) {
            // Mint completed! Generate banner and show modal
            const activeTraitsList = Object.entries(traits)
              .filter(([, active]) => active)
              .map(([name]) => name.toUpperCase());
            
            const displayName = userProfile.ensName || userProfile.basename || userProfile.farcasterUsername 
              ? (userProfile.ensName || userProfile.basename || `@${userProfile.farcasterUsername}`)
              : undefined;
            
            const bannerSVG = generateNFTBanner(
              address,
              activeTraitsList,
              data.result.rarity || 'NODE',
              data.result.tokenId || 1,
              displayName
            );
            
            setMintResult({
              tokenId: data.result.tokenId,
              cid: data.result.cid,
              txHash: data.result.txHash,
              rarity: data.result.rarity,
              svgContent: bannerSVG,
            });
            setGeneratedSVG(bannerSVG);
            setQueueStatus({ ...queueStatus, status: 'completed' });
            setStatus('🦖 BEEPER NFT Minted!');
            setMinting(false);
            setShowBannerModal(true);
          } else if (data.status === 'failed') {
            setQueueStatus({ ...queueStatus, status: 'failed' });
            setStatus(`❌ Mint failed: ${data.error || 'Unknown error'}`);
            setMinting(false);
          } else {
            // Still in queue
            setQueueStatus({
              ...queueStatus,
              position: data.position,
              aheadOfYou: data.aheadOfYou,
              status: data.status,
              message: data.message,
            });
            setStatus(data.message || `⏳ Position ${data.position} in queue...`);
          }
        }
      } catch (err) {
        console.error('Queue poll error:', err);
      }
    };
    
    const interval = setInterval(pollQueue, QUEUE_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [queueStatus, address, traits, userProfile]);
  
  const handleShareToFarcaster = async () => {
    if (!mintResult?.tokenId) return;
    const shareText = encodeURIComponent(
      `🦖 Just minted BEEPER NFT #${mintResult.tokenId} on @mcpvot!\n\n` +
      `💰 69,420 VOT tokens\n` +
      `⭐ Rarity: ${mintResult.rarity || 'VRF'}\n\n` +
      `Mint yours: https://mcpvot.xyz/beeper\n` +
      `#BEEPER #VOT #x402 #Base`
    );
    window.open(`https://warpcast.com/~/compose?text=${shareText}`, '_blank');
    setShareBonus(true);
    setStatus('+10,000 VOT share bonus claimed!');
  };
  
  const fetchUserProfile = useCallback(async () => {
    if (!address) return;
    const cached = profileCache.get(address);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setUserProfile(cached.data);
      setTraits({
        vot: parseFloat(cached.data.votBalance || '0') > 0,
        mcpvot: parseFloat(cached.data.votBalance || '0') >= 100000,
        base: !!cached.data.basename,
        farcaster: !!cached.data.farcasterFid,
        ens: !!cached.data.ensName,
      });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/machine/profile?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        const profile: UserProfile = {
          ensName: data.ensName,
          basename: data.basename,
          farcasterUsername: data.farcasterUsername,
          farcasterFid: data.farcasterFid,
          votBalance: data.votBalance,
        };
        profileCache.set(address, { data: profile, timestamp: Date.now() });
        setUserProfile(profile);
        setTraits({
          vot: parseFloat(data.votBalance || '0') > 0,
          mcpvot: parseFloat(data.votBalance || '0') >= 100000,
          base: !!data.basename,
          farcaster: !!data.farcasterFid,
          ens: !!data.ensName,
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);
  
  useEffect(() => {
    if (isConnected && address) fetchUserProfile();
  }, [isConnected, address, fetchUserProfile]);
  
  const handleMint = async () => {
    if (!isConnected || !address) {
      setStatus('Connect wallet first');
      return;
    }
    setMinting(true);
    setStatus('🦖 Initiating gasless x402 payment...');
    setMintResult(null);
    setGeneratedSVG('');
    setQueueStatus(null);
    
    try {
      const activeTraitsList = Object.entries(traits)
        .filter(([, active]) => active)
        .map(([name]) => name.toUpperCase());
      
      // Create simple SVG for IPFS storage
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#0a0a0a"/><text x="200" y="40" text-anchor="middle" font-family="monospace" font-size="16" fill="#77FE80">BEEPER NFT // x402 V2</text><text x="200" y="120" text-anchor="middle" font-family="monospace" font-size="12" fill="#FFFFFF">${address?.slice(0, 6)}...${address?.slice(-4)}</text><text x="200" y="160" text-anchor="middle" font-family="monospace" font-size="10" fill="#888888">TRAITS: ${activeTraitsList.join(' ') || 'NONE'}</text></svg>`;
      
      setStatus('⚡ Processing gasless payment...');
      const mintResponse = await fetch('/api/x402/mint-builder-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userAddress: address, 
          svgContent, 
          traits,
          ensName: userProfile.ensName,
          baseName: userProfile.basename,
          farcasterFid: userProfile.farcasterFid,
        }),
      });
      
      const result = await mintResponse.json();
      
      // Handle queue response (202 Accepted)
      if (mintResponse.status === 202 && result.queued) {
        setQueueStatus({
          queueId: result.queueId,
          position: result.position,
          aheadOfYou: result.aheadOfYou,
          status: 'queued',
          message: result.message,
          estimatedWaitSeconds: result.estimatedWaitSeconds,
        });
        setStatus(result.message || `⏳ Position ${result.position} in queue...`);
        // Keep minting=true, polling will handle completion
        return;
      }
      
      // Handle conflict (already in queue)
      if (mintResponse.status === 409) {
        setQueueStatus({
          queueId: result.existingQueueId,
          position: result.position,
          aheadOfYou: result.aheadOfYou,
          status: 'queued',
          message: result.message,
        });
        setStatus(result.message || 'Already in queue!');
        return;
      }
      
      // Handle direct success (immediate mint)
      if (mintResponse.ok && result.success && result.tokenId) {
        const displayName = userProfile.ensName || userProfile.basename || userProfile.farcasterUsername 
          ? (userProfile.ensName || userProfile.basename || `@${userProfile.farcasterUsername}`)
          : undefined;
        
        const bannerSVG = generateNFTBanner(
          address,
          activeTraitsList,
          result.rarity || 'NODE',
          result.tokenId,
          displayName
        );
        
        setMintResult({
          tokenId: result.tokenId, 
          cid: result.cid || result.ipfsCid, 
          txHash: result.txHash || result.transactionHash, 
          rarity: result.rarity,
          svgContent: bannerSVG,
        });
        setGeneratedSVG(bannerSVG);
        setStatus('🦖 BEEPER NFT Minted!');
        setShowBannerModal(true);
        setMinting(false);
        return;
      }
      
      // Handle error
      if (!mintResponse.ok) {
        throw new Error(result.error || 'Mint failed');
      }
      
    } catch (err) {
      console.error('Mint error:', err);
      setStatus(`❌ Error: ${err instanceof Error ? err.message : 'Mint failed'}`);
      setMinting(false);
      setQueueStatus(null);
    }
  };
  
  const activeTraitCount = Object.values(traits).filter(Boolean).length;
  
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="w-full h-full rounded-xl" style={{boxShadow: '0 0 20px rgba(119,254,128,0.2), 0 0 40px rgba(119,254,128,0.1)'}}/>
      </div>
      <div className="relative z-10 bg-black/95 backdrop-blur-sm rounded-xl border border-[#77FE80]/40 overflow-hidden">
        <div className="border-b border-[#77FE80]/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#77FE80] animate-pulse"/>
              <div className="w-3 h-3 rounded-full bg-[#5DE066]"/>
              <div className="w-3 h-3 rounded-full bg-[#4CAF50]"/>
            </div>
            <span className="text-sm font-mono text-[#77FE80]">mcpvot.eth</span>
          </div>
          <h2 className="text-center font-mono text-xl sm:text-2xl tracking-wider">
            <span className="text-2xl">🦖</span>
            <span className="text-[#77FE80] mx-2 font-bold">BEEPER NFT</span>
            <span className="text-gray-500 text-lg">{`// x402 V2`}</span>
          </h2>
          <p className="text-center text-sm text-gray-400 mt-2 font-mono">ERC-1155 • IPFS • ERC-4804 • VRF Rarity</p>
        </div>
        <div className="flex justify-center py-6 bg-[#050505]">
          <AnimatedBeeperDino />
        </div>
        <div className="mx-4 mb-4 p-4 bg-[#0a0a0a] rounded-lg border border-[#77FE80]/20">
          {isConnected && address ? (
            <>
              {userProfile.ensName && (
                <div className="mb-3">
                  <div className="text-gray-500 text-xs font-mono tracking-widest">ENS</div>
                  <div className="text-[#77FE80] text-lg font-mono font-bold">{userProfile.ensName}</div>
                </div>
              )}
              {userProfile.basename && (
                <div className="mb-3">
                  <div className="text-gray-500 text-xs font-mono tracking-widest">BASENAME</div>
                  <div className="text-[#77FE80] text-base font-mono">{userProfile.basename}</div>
                </div>
              )}
              {userProfile.farcasterUsername && (
                <div className="mb-3">
                  <div className="text-gray-500 text-xs font-mono tracking-widest">FARCASTER</div>
                  <div className="text-[#77FE80] text-base font-mono">@{userProfile.farcasterUsername}{userProfile.farcasterFid && <span className="text-gray-500 ml-2">#{userProfile.farcasterFid}</span>}</div>
                </div>
              )}
              <div className="pt-3 border-t border-[#77FE80]/20">
                <div className="text-gray-500 text-xs font-mono tracking-widest">WALLET</div>
                <div className="text-[#77FE80] text-base font-mono">{address.slice(0, 10)}...{address.slice(-8)}</div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-gray-500 text-sm font-mono">TRAITS</span>
                <span className="text-[#77FE80] text-base font-mono">{activeTraitCount}/5 Active</span>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-gray-500 text-base font-mono">Connect wallet to see your profile</div>
            </div>
          )}
        </div>
        <div className="mx-4 mb-4 p-4 bg-[#77FE80]/10 rounded-lg border border-[#77FE80]/30">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-gray-400 text-sm font-mono">PRICE</div>
              <div className="text-white text-2xl font-mono font-bold">$0.25</div>
              <div className="text-gray-500 text-sm font-mono">USDC</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm font-mono">REWARD</div>
              <div className="text-[#77FE80] text-2xl font-mono font-bold">69,420</div>
              <div className="text-gray-500 text-sm font-mono">VOT</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#77FE80]/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#77FE80] animate-pulse"></span>
              <span className="text-[#77FE80] text-base font-mono font-bold">⚡ GASLESS EXPERIENCE</span>
            </span>
          </div>
        </div>
        {mintResult && (
          <div className="mx-4 mb-4 p-4 bg-[#77FE80]/10 rounded-lg border border-[#77FE80]/50">
            <div className="text-center">
              <div className="text-4xl mb-2">🦖✅</div>
              <p className="text-[#77FE80] font-mono font-bold text-xl">BEEPER NFT MINTED!</p>
              {mintResult.rarity && <p className="text-[#77FE80] font-mono text-lg mt-2">VRF Rarity: <span className="font-bold">{mintResult.rarity}</span></p>}
              {mintResult.tokenId && <p className="text-gray-400 text-base mt-2 font-mono">Token #{mintResult.tokenId}</p>}
              <div className="flex gap-3 justify-center mt-4">
                <button 
                  onClick={() => setShowBannerModal(true)}
                  className="px-4 py-2 text-base text-black bg-[#77FE80] rounded-lg hover:bg-[#5DE066] font-mono font-bold transition"
                >
                  🖼️ View NFT
                </button>
              </div>
              {shareBonus && <div className="mt-4 text-[#77FE80] font-mono text-lg">� +10,000 VOT bonus claimed!</div>}
            </div>
          </div>
        )}
        
        {/* NFT Banner Modal */}
        {mintResult && generatedSVG && (
          <NFTBannerModal
            isOpen={showBannerModal}
            onClose={() => setShowBannerModal(false)}
            svgContent={generatedSVG}
            mintResult={mintResult}
            onShare={handleShareToFarcaster}
            shareBonus={shareBonus}
          />
        )}
        <div className="p-4">
          {!isConnected ? (
            <button onClick={() => coinbaseConnector && connect({ connector: coinbaseConnector })} className="w-full py-4 px-6 rounded-lg font-mono font-bold text-xl text-black transition-all bg-gradient-to-r from-[#77FE80] to-[#5DE066] hover:shadow-[0_0_30px_rgba(119,254,128,0.5)] active:scale-[0.98]">CONNECT WALLET</button>
          ) : (
            <button onClick={handleMint} disabled={minting || loading} className="w-full py-4 px-6 rounded-lg font-mono font-bold text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#77FE80] to-[#5DE066] text-black hover:shadow-[0_0_30px_rgba(119,254,128,0.5)] active:scale-[0.98]">
              {minting ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⚡</span>MINTING...</span> : loading ? <span className="flex items-center justify-center gap-2"><span className="animate-pulse">🔄</span>LOADING...</span> : <>🦖 MINT BEEPER - $0.25</>}
            </button>
          )}
        </div>
        {status && !mintResult && (
          <div className={`px-4 pb-4 text-center font-mono text-base ${status.includes('Minted') || status.includes('claimed') ? 'text-[#77FE80]' : status.includes('Error') ? 'text-red-400' : 'text-gray-400'}`}>{status}</div>
        )}
        <div className="border-t border-[#77FE80]/20 p-4 text-center">
          <p className="text-base text-gray-400 font-mono">$0.25 USDC • 69,420 VOT • NO BURNS</p>
          <p className="text-base text-[#77FE80]/70 font-mono mt-1">⚡ Gasless x402 V2 • VRF Rarity After Mint</p>
        </div>
      </div>
    </div>
  );
};

export default X402MintVOTMachinePanel;
