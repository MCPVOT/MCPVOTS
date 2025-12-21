'use client';

/**
 * VOT Machine - Identity NFT Generator
 * 
 * URL: mcpvot.xyz/machine
 * 
 * Flow:
 * 1. User connects wallet
 * 2. Fetch all identity data (Farcaster, ENS, Basename)
 * 3. Check token holdings (VOT, MAXX, Warplet NFT)
 * 4. Generate personalized NFT with badges
 * 5. Pin to IPFS → Mint ERC-1155 → Get unique portal URL
 */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

// =============================================================================
// TYPES
// =============================================================================

interface UserProfile {
  address: string;
  addressShort: string;
  
  // Identity
  basename?: string;
  ensName?: string;
  farcasterUsername?: string;
  farcasterFid?: number;
  farcasterPfp?: string;
  farcasterBio?: string;
  farcasterFollowers?: number;
  farcasterBanner?: string;
  
  // ENS Records
  ensRecords?: {
    avatar?: string;
    description?: string;
    url?: string;
    twitter?: string;
    github?: string;
    header?: string;
    location?: string;
  };
  
  // Aggregated
  displayName: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  
  // Holdings
  votBalance: string;
  maxxBalance: string;
  hasWarpletNFT: boolean;
  
  // Badges
  badges: Badge[];
  
  // Metadata
  fetchedAt: number;
  source: string;
  
  // Generated NFT
  nftCid?: string;
  nftUrl?: string;
  tokenId?: number;
}

interface Badge {
  id: string;
  name: string;
  emoji: string;
  tier?: string;
  description: string;
  color: string;
}

// =============================================================================
// BADGE CALCULATION
// =============================================================================

function calculateBadges(profile: Partial<UserProfile>): Badge[] {
  const badges: Badge[] = [];
  
  // VOT Holder Tiers
  const votBalance = parseFloat(profile.votBalance || '0');
  if (votBalance >= 1_000_000) {
    badges.push({
      id: 'vot-whale',
      name: 'VOT Whale',
      emoji: '🐋',
      tier: 'Legendary',
      description: '1M+ VOT holder',
      color: '#FFD700',
    });
  } else if (votBalance >= 100_000) {
    badges.push({
      id: 'vot-diamond',
      name: 'Diamond Hands',
      emoji: '💎',
      tier: 'Epic',
      description: '100K+ VOT holder',
      color: '#00D4FF',
    });
  } else if (votBalance >= 10_000) {
    badges.push({
      id: 'vot-fire',
      name: 'VOT Burner',
      emoji: '🔥',
      tier: 'Rare',
      description: '10K+ VOT holder',
      color: '#FF6B00',
    });
  } else if (votBalance > 0) {
    badges.push({
      id: 'vot-holder',
      name: 'VOT Holder',
      emoji: '🌟',
      tier: 'Common',
      description: 'VOT token holder',
      color: '#00FF88',
    });
  }
  
  // MAXX Legacy
  const maxxBalance = parseFloat(profile.maxxBalance || '0');
  if (maxxBalance > 0) {
    badges.push({
      id: 'maxx-og',
      name: 'MAXX OG',
      emoji: '👑',
      tier: 'Legacy',
      description: 'Original MAXX holder',
      color: '#9D4EDD',
    });
  }
  
  // Warplet NFT Holder
  if (profile.hasWarpletNFT) {
    badges.push({
      id: 'warplet-og',
      name: 'Warplet OG',
      emoji: '🎖️',
      tier: 'Exclusive',
      description: 'Warplet NFT holder',
      color: '#FF00FF',
    });
  }
  
  // Farcaster Badge
  if (profile.farcasterFid) {
    const followers = profile.farcasterFollowers || 0;
    if (followers >= 10000) {
      badges.push({
        id: 'fc-influencer',
        name: 'FC Influencer',
        emoji: '📢',
        tier: 'Elite',
        description: '10K+ Farcaster followers',
        color: '#855DCD',
      });
    } else if (followers >= 1000) {
      badges.push({
        id: 'fc-builder',
        name: 'FC Builder',
        emoji: '🏗️',
        tier: 'Advanced',
        description: '1K+ Farcaster followers',
        color: '#855DCD',
      });
    } else {
      badges.push({
        id: 'fc-member',
        name: 'Farcaster',
        emoji: '🟣',
        tier: 'Member',
        description: 'Farcaster verified',
        color: '#855DCD',
      });
    }
  }
  
  // ENS Badge
  if (profile.ensName) {
    badges.push({
      id: 'ens-holder',
      name: 'ENS Identity',
      emoji: '🔵',
      tier: 'Verified',
      description: '.eth domain holder',
      color: '#5298FF',
    });
  }
  
  // Basename Badge
  if (profile.basename) {
    badges.push({
      id: 'base-builder',
      name: 'Base Builder',
      emoji: '🔷',
      tier: 'Based',
      description: '.base.eth name holder',
      color: '#0052FF',
    });
  }
  
  return badges;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function VOTMachinePage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  
  // AI Enhancement State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<{
    analysis?: string;
    bio?: string;
    tagline?: string;
    insights?: string[];
  } | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  
  // Fetch user profile when connected
  const fetchProfile = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/machine/profile?address=${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      
      // Calculate badges
      const badges = calculateBadges(data);
      
      setProfile({
        ...data,
        badges,
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [address]);
  
  useEffect(() => {
    if (isConnected && address) {
      fetchProfile();
    }
  }, [isConnected, address, fetchProfile]);
  
  // Generate NFT
  const handleGenerate = async () => {
    if (!profile) return;
    
    setGenerating(true);
    
    try {
      const response = await fetch('/api/machine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: profile.address,
          profile,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate NFT');
      }
      
      const result = await response.json();
      
      setProfile(prev => prev ? {
        ...prev,
        nftCid: result.cid,
        nftUrl: result.ipfsUrl,
        tokenId: result.tokenId,
      } : null);
      
      setGenerated(true);
    } catch (err) {
      console.error('Error generating NFT:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };
  
  // Find Coinbase Wallet connector
  const coinbaseConnector = connectors.find(
    c => c.id === 'coinbaseWalletSDK' || c.name === 'Coinbase Wallet'
  );
  
  // AI Enhancement - powered by KAT-Coder-Pro
  const handleAIAnalysis = async () => {
    if (!profile) return;
    
    setAiLoading(true);
    setShowAiPanel(true);
    
    try {
      // First get the analysis
      const analysisRes = await fetch('/api/machine/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          profile: {
            address: profile.address,
            displayName: profile.displayName,
            basename: profile.basename,
            ensName: profile.ensName,
            farcasterUsername: profile.farcasterUsername,
            farcasterFid: profile.farcasterFid,
            farcasterBio: profile.bio,
            farcasterFollowers: profile.farcasterFollowers,
            votBalance: profile.votBalance,
            maxxBalance: profile.maxxBalance,
            hasWarpletNFT: profile.hasWarpletNFT,
            badges: profile.badges,
            ensRecords: profile.ensRecords,
          }
        }),
      });
      
      const analysisData = await analysisRes.json();
      
      // Then get engagement insights
      const engagementRes = await fetch('/api/machine/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'engagement',
          profile: {
            address: profile.address,
            displayName: profile.displayName,
            basename: profile.basename,
            ensName: profile.ensName,
            farcasterUsername: profile.farcasterUsername,
            farcasterFid: profile.farcasterFid,
            farcasterBio: profile.bio,
            farcasterFollowers: profile.farcasterFollowers,
            votBalance: profile.votBalance,
            maxxBalance: profile.maxxBalance,
            hasWarpletNFT: profile.hasWarpletNFT,
            badges: profile.badges,
            ensRecords: profile.ensRecords,
          }
        }),
      });
      
      const engagementData = await engagementRes.json();
      
      setAiInsights({
        analysis: analysisData.result?.analysis,
        insights: engagementData.result?.insights,
      });
      
    } catch (err) {
      console.error('AI analysis error:', err);
      setAiInsights({
        analysis: 'AI analysis temporarily unavailable. Please try again.',
      });
    } finally {
      setAiLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/20 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-cyan-400">
            VOT Machine
          </Link>
          {isConnected && (
            <button
              onClick={() => disconnect()}
              className="px-4 py-2 border border-red-500/50 text-red-400 rounded hover:bg-red-500/10"
            >
              Disconnect
            </button>
          )}
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto p-6">
        {/* Not Connected */}
        {!isConnected && (
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              🎰 VOT Machine
            </h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Generate your personalized identity NFT based on your
              Farcaster, ENS, Basename, and token holdings.
            </p>
            
            <button
              onClick={() => coinbaseConnector && connect({ connector: coinbaseConnector })}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg text-lg font-semibold hover:opacity-90 transition"
            >
              Connect Wallet
            </button>
            
            <div className="mt-12 grid grid-cols-3 gap-4 text-center">
              <div className="p-4 border border-cyan-500/20 rounded-lg">
                <div className="text-3xl mb-2">🔵</div>
                <div className="text-sm text-gray-400">ENS Records</div>
              </div>
              <div className="p-4 border border-purple-500/20 rounded-lg">
                <div className="text-3xl mb-2">🟣</div>
                <div className="text-sm text-gray-400">Farcaster</div>
              </div>
              <div className="p-4 border border-blue-500/20 rounded-lg">
                <div className="text-3xl mb-2">🔷</div>
                <div className="text-sm text-gray-400">Basename</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading */}
        {isConnected && loading && (
          <div className="text-center py-20">
            <div className="animate-spin w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Fetching your identity data...</p>
          </div>
        )}
        
        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={fetchProfile}
              className="mt-2 text-sm text-cyan-400 underline"
            >
              Try again
            </button>
          </div>
        )}
        
        {/* Profile Loaded */}
        {isConnected && profile && !loading && (
          <div className="space-y-8">
            {/* Identity Card */}
            <div className="relative bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-2xl overflow-hidden">
              {/* Banner */}
              {profile.banner && (
                <div 
                  className="h-32 bg-cover bg-center"
                  style={{ backgroundImage: `url(${profile.banner})` }}
                />
              )}
              {!profile.banner && (
                <div className="h-32 bg-gradient-to-r from-cyan-500/20 to-purple-500/20" />
              )}
              
              <div className="p-6 -mt-12">
                {/* Avatar */}
                <div className="flex items-end gap-4 mb-4">
                  {profile.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt="Avatar"
                      className="w-24 h-24 rounded-full border-4 border-black"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-black bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-3xl">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="pb-2">
                    <h2 className="text-2xl font-bold">{profile.displayName}</h2>
                    <p className="text-gray-400 text-sm font-mono">{profile.addressShort}</p>
                  </div>
                </div>
                
                {/* Bio */}
                {profile.bio && (
                  <p className="text-gray-300 mb-4">{profile.bio}</p>
                )}
                
                {/* Identity Sources */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.farcasterUsername && (
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                      🟣 @{profile.farcasterUsername}
                    </span>
                  )}
                  {profile.ensName && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                      🔵 {profile.ensName}
                    </span>
                  )}
                  {profile.basename && (
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">
                      🔷 {profile.basename}
                    </span>
                  )}
                </div>
                
                {/* Holdings */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/50 border border-cyan-500/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-cyan-400">{profile.votBalance}</div>
                    <div className="text-sm text-gray-400">VOT Balance</div>
                  </div>
                  <div className="bg-black/50 border border-purple-500/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-400">{profile.maxxBalance}</div>
                    <div className="text-sm text-gray-400">MAXX Balance</div>
                  </div>
                </div>
                
                {/* Badges */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">BADGES EARNED</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.length === 0 && (
                      <span className="text-gray-500">No badges yet. Get some VOT!</span>
                    )}
                    {profile.badges.map(badge => (
                      <div 
                        key={badge.id}
                        className="px-3 py-2 rounded-lg border flex items-center gap-2"
                        style={{ 
                          borderColor: `${badge.color}50`,
                          backgroundColor: `${badge.color}10`,
                        }}
                      >
                        <span className="text-xl">{badge.emoji}</span>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: badge.color }}>
                            {badge.name}
                          </div>
                          <div className="text-xs text-gray-400">{badge.tier}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* AI Enhancement Button */}
                <div className="border-t border-cyan-500/20 pt-4">
                  <button
                    onClick={handleAIAnalysis}
                    disabled={aiLoading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600/20 to-cyan-500/20 border border-purple-500/30 rounded-lg text-sm font-semibold hover:border-purple-500/60 transition flex items-center justify-center gap-2"
                  >
                    {aiLoading ? (
                      <>
                        <span className="animate-pulse">🤖</span>
                        <span>KAT-Coder analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>🤖</span>
                        <span>Get AI Insights</span>
                        <span className="text-xs text-gray-500">(Free)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* AI Insights Panel */}
            {showAiPanel && (
              <div className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-purple-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                    <span>🤖</span>
                    <span>AI Analysis</span>
                    <span className="text-xs font-normal text-gray-500">by KAT-Coder-Pro</span>
                  </h3>
                  <button
                    onClick={() => setShowAiPanel(false)}
                    className="text-gray-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                {aiLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Analyzing your profile...</p>
                  </div>
                ) : aiInsights ? (
                  <div className="space-y-4">
                    {/* Analysis */}
                    {aiInsights.analysis && (
                      <div className="bg-black/30 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-cyan-400 mb-2">📊 Profile Analysis</h4>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{aiInsights.analysis}</p>
                      </div>
                    )}
                    
                    {/* Engagement Insights */}
                    {aiInsights.insights && aiInsights.insights.length > 0 && (
                      <div className="bg-black/30 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-green-400 mb-2">💡 Engagement Tips</h4>
                        <div className="text-gray-300 text-sm space-y-1">
                          {aiInsights.insights.slice(0, 5).map((insight, i) => (
                            <p key={i}>{insight}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Bio Suggestion */}
                    {aiInsights.bio && (
                      <div className="bg-black/30 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">✨ Suggested Bio</h4>
                        <p className="text-gray-300 text-sm italic">&quot;{aiInsights.bio}&quot;</p>
                        {aiInsights.tagline && (
                          <p className="text-purple-400 text-xs mt-2">Tagline: {aiInsights.tagline}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
            
            {/* Generate Button */}
            {!generated && (
              <div className="text-center">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg text-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⚙️</span>
                      Generating NFT...
                    </span>
                  ) : (
                    '🎰 Generate My VOT Machine NFT'
                  )}
                </button>
                <p className="text-gray-500 text-sm mt-2">
                  Creates a personalized HTML page pinned to IPFS
                </p>
              </div>
            )}
            
            {/* Generated Result */}
            {generated && profile.nftUrl && (
              <div className="bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/50 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-400 mb-2">
                  NFT Generated Successfully!
                </h3>
                <p className="text-gray-400 mb-4">
                  Your identity page has been pinned to IPFS
                </p>
                
                <div className="flex flex-col gap-3">
                  <a 
                    href={profile.nftUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-cyan-500 text-black rounded-lg font-semibold hover:bg-cyan-400"
                  >
                    View on IPFS →
                  </a>
                  
                  {profile.tokenId && (
                    <Link 
                      href={`/${profile.tokenId}`}
                      className="px-6 py-3 border border-cyan-500/50 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-500/10"
                    >
                      View at mcpvot.xyz/{profile.tokenId}
                    </Link>
                  )}
                </div>
                
                <p className="text-gray-500 text-xs mt-4 font-mono">
                  CID: {profile.nftCid}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-cyan-500/20 p-4 mt-12">
        <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
          <p>VOT Machine • Powered by IPFS, Farcaster, ENS, and Base</p>
        </div>
      </footer>
    </div>
  );
}
