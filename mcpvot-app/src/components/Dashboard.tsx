'use client';

import AddMiniAppButton from '@/components/AddMiniAppButton';
import VOTHieroglyphicsBackground from '@/components/VOTHieroglyphicsBackground';
// import FuturisticThreeBackground from '@/components/FuturisticThreeBackground'; // REMOVED: Replaced with VOT Hieroglyphics
// import AlienGlyphCodex from '@/components/AlienGlyphCodex'; // BACKED UP to StoredForLater/AlienGlyphCodex_BACKUP.tsx
import AudioPlayerCompact from '@/components/AudioPlayerCompact';
import { ChainSelector } from '@/components/ChainSelector';
// import { EIP7715DelegationPanel } from '@/components/EIP7715DelegationPanel'; // HIDDEN: Purpose unclear
import { EnhancedConnectButton } from '@/components/EnhancedConnectButton';
import { FarcasterAuthButton } from '@/components/FarcasterAuthButton';
import LoadingScreen from '@/components/LoadingScreen';
import MAXXOrderPanel from '@/components/MAXXOrderPanel';
import NotificationsBadge from '@/components/NotificationsBadge';
// import ThreeBackground from '@/components/ThreeBackground'; // REMOVED: Performance issues on mobile
// import TrendingChannelsSidebar from '@/components/TrendingChannelsSidebar'; // REMOVED: Hidden on mobile, not needed
import VOTOrderPanel from '@/components/VOTOrderPanel';
import X402MintVOTMachinePanel from '@/components/X402MintVOTMachinePanel';
// import X402IntelligenceShowcase from '@/components/X402IntelligenceShowcase'; // BACKED UP to StoredForLater/X402IntelligenceShowcase_BACKUP.tsx
import { useFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import { sdk } from '@farcaster/miniapp-sdk';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const Dashboard = () => {
  const { isInMiniApp, user: farcasterUser } = useFarcasterContext();
  const [isLoading, setIsLoading] = useState(true);
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerOffset, setHeaderOffset] = useState(128);

  useEffect(() => {
    const timeoutMs = isInMiniApp ? 500 : 800;
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [isInMiniApp]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!headerRef.current) {
        return;
      }
      const height = headerRef.current.offsetHeight;
      setHeaderOffset(height + 16);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      if (!headerRef.current) {
        return;
      }
      const height = headerRef.current.offsetHeight;
      setHeaderOffset(height + 16);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isInMiniApp, farcasterUser]);

  // NOTE: Removed duplicate signalReady() call - FarcasterSplashManager handles this now

  useEffect(() => {
    const sessionKey = 'mcpvot-about-update-20251111';
    if (typeof window === 'undefined') {
      return;
    }
    if (window.sessionStorage.getItem(sessionKey)) {
      return;
    }

    window.sessionStorage.setItem(sessionKey, '1');

    fetch('/api/memory/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'about_panel_update',
        content: 'Updated About modal to reflect VOT facilitator roadmap and treasury gas coverage.',
        metadata: {
          source: 'dashboard',
          component: 'AboutModal',
          updatedBy: 'copilot',
          updatedAt: new Date().toISOString()
        }
      })
    }).catch((error) => {
      console.warn('Failed to log about panel update to MCP memory:', error);
    });
  }, []);

  const handleShare = async () => {
    try {
      // Check if we're in a Farcaster environment with SDK available
      if (typeof window !== 'undefined' && sdk?.actions?.composeCast) {
        await sdk.actions.composeCast({
          text: '🚀 Just discovered MCPVOT x402 Intelligence NFT Minting!\n\nMint unique Intelligence NFTs on Base for 2.00 USDC 💎\n\nPublic cap: 33,333 (limit 10 per wallet). Total collection supply: 49,141 — 1 reserved per FID Warplet holder (if a holder does not claim their reserved mint it will be released to the public). Check it out! 👇',
          embeds: [window.location.origin]
        });
      } else {
        // Fallback: copy to clipboard
        const shareText = '🚀 Just discovered MCPVOT x402 Intelligence NFT Minting! Check it out: https://mcpvot.xyz';
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          console.log('Share link copied to clipboard');
        }
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
      <>
        {/* VOT Hieroglyphics background with floating Sumerian glyphs */}
        <VOTHieroglyphicsBackground />

        {/* Grid overlay with subtle scanlines */}
        <div className="fixed inset-0 pointer-events-none z-[1]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e908_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e908_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40" />
          {/* Horizontal scanlines */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,255,0.03)_2px,rgba(0,255,255,0.03)_4px)] opacity-60" />
          {/* Vignette effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
        <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 border-b border-cyan-500/30 bg-black/95 backdrop-blur-md shadow-lg safe-top gpu-accelerate">
          {/* Single Row Header - No horizontal scroll */}
          <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3">
            
            {/* Left: Audio Player only */}
            <div className="flex items-center gap-2 shrink-0">
              <AudioPlayerCompact layout="inline" variant="compact" className="shrink-0" />
            </div>

            {/* Center: Core Navigation - ALWAYS visible on all screens */}
            <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Chain Selector - replaces static BASE badge */}
              <ChainSelector variant="badge" />

              {/* ABOUT - always visible */}
              <Link
                href="/about"
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-black/60 border border-cyan-500/40 rounded-md font-mono text-[10px] sm:text-xs uppercase tracking-wide text-cyan-300 hover:bg-cyan-600/15 hover:border-cyan-400 transition-all"
              >
                <span>ABOUT</span>
              </Link>

              {/* DOCS - always visible */}
              <Link
                href="/docs"
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-black/60 border border-green-500/40 rounded-md font-mono text-[10px] sm:text-xs uppercase tracking-wide text-green-300 hover:bg-green-600/15 hover:border-green-400 transition-all"
              >
                <span>DOCS</span>
              </Link>
            </nav>

            {/* Right: User/Wallet section */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Mini-app specific (Farcaster) */}
              {isInMiniApp && farcasterUser && (
                <>
                  {/* Share - desktop only */}
                  <button
                    onClick={handleShare}
                    className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-black/60 border border-green-500/40 rounded-md font-mono text-[10px] uppercase text-green-300 hover:bg-green-600/15 transition-all"
                  >
                    <span>SHARE</span>
                  </button>

                  {/* FID badge - tablet+ */}
                  <div className="hidden md:flex items-center gap-1 px-2 py-1.5 bg-cyan-600/15 border border-cyan-500/30 rounded-md">
                    <span className="text-[9px] font-mono text-cyan-400/70">FID</span>
                    <span className="text-[11px] font-bold text-cyan-300">{farcasterUser.fid}</span>
                  </div>

                  {/* Notifications - large screens */}
                  <div className="hidden xl:block">
                    <NotificationsBadge fid={farcasterUser.fid} />
                  </div>

                  {/* Add Mini App - large screens */}
                  <div className="hidden xl:block">
                    <AddMiniAppButton />
                  </div>

                  {/* User badge with username */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-cyan-600/20 to-blue-600/15 border border-cyan-500/40 rounded-md backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                    <span className="text-[10px] sm:text-xs font-orbitron text-cyan-300 truncate max-w-[80px] sm:max-w-[120px]">
                      @{farcasterUser.username}
                    </span>
                  </div>
                </>
              )}

              {/* Desktop web: Wallet Connect + Farcaster Auth */}
              {!isInMiniApp && (
                <>
                  <div className="shrink-0">
                    <EnhancedConnectButton />
                  </div>
                  <div className="hidden md:block shrink-0">
                    <FarcasterAuthButton />
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 pb-6 sm:pb-8 lg:pb-12 px-2 sm:px-3 lg:px-4 overflow-x-hidden" style={{ paddingTop: headerOffset }}>
          <div className="w-full max-w-screen-2xl mx-auto">
            {/* Main Content - GPU accelerated cards */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-6 [&>*]:gpu-accelerate">
              {/* x402 VOT Machine NFT Mint - PRIMARY ACTION */}
              <div className="flex justify-center items-center">
                <div className="relative w-full max-w-xl">
                  <X402MintVOTMachinePanel />
                </div>
              </div>

              {/* VOT Facilitator - matching MAXX style */}
              <VOTOrderPanel />

              {/* MAXX Facilitator + VOT Bonus */}
              <MAXXOrderPanel />

              {/* EIP-7702 Delegation - HIDDEN: Purpose unclear, hiding until needed */}
              {/* <EIP7715DelegationPanel /> */}

              {/* x402 Intelligence Showcase - BACKED UP to StoredForLater */}
              {/* <X402IntelligenceShowcase /> */}

              {/* VOT Glyph Codex - BACKED UP to StoredForLater */}
              {/* <AlienGlyphCodex /> */}

              {/* Main Intelligence Dashboard removed: VOT intelligence v2.4.8 deprecated */}
            </div>
          </div>
        </main>

        <footer className="relative z-20 border-t border-cyan-400/30 bg-black/98 backdrop-blur-xl py-3 sm:py-4 lg:py-6 shadow-[0_-5px_20px_rgba(0,255,255,0.15)] safe-bottom gpu-accelerate">
          <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 lg:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-[9px] sm:text-[10px] lg:text-xs flex-wrap justify-center sm:justify-start">
                <a href="https://www.x402.org/ecosystem" target="_blank" rel="noopener noreferrer" className="font-mono text-[#00FFFF]/80 hover:text-[#00FFFF] transition-colors tracking-wider uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] hover:drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">&gt; x402 Ecosystem</a>
                <span className="text-[#00FF88]/40">•</span>
                <a href="https://github.com/MCPVOT" target="_blank" rel="noopener noreferrer" className="font-mono text-[#00FFFF]/80 hover:text-[#00FFFF] transition-colors tracking-wider uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] hover:drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">&gt; GitHub</a>
                <span className="text-[#00FF88]/40">•</span>
                <a href="https://x.com/MCPVOT" target="_blank" rel="noopener noreferrer" className="font-mono text-[#00FFFF]/80 hover:text-[#00FFFF] transition-colors tracking-wider uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] hover:drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">&gt; Twitter</a>
              </div>
              <div className="text-[10px] font-mono text-[#00FF88]/70 uppercase tracking-wider drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]">&gt; © 2025 MCPVOT • Base Chain</div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Dashboard;
