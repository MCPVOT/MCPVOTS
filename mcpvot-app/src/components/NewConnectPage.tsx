
'use client';

import { EnhancedConnectButton } from '@/components/EnhancedConnectButton';
import { FarcasterAuthButton } from '@/components/FarcasterAuthButton';
import TerminalText from '@/components/TerminalText';
import VOTLogoSVG from '@/components/VOTLogoSVG';
import { useFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const NewConnectPage = () => {
  const { isInMiniApp, user: farcasterUser } = useFarcasterContext();
  const router = useRouter();
  const [isSkipping, setIsSkipping] = useState(false);

  const handleSkipWallet = () => {
    setIsSkipping(true);
    // Navigate directly to dashboard in Farcaster miniapp mode
    // User is already authenticated via Farcaster SDK
    setTimeout(() => {
      router.push('/?skip-wallet=1');
    }, 500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-y-auto safe-top safe-bottom"
      role="main"
      aria-label="MCPVOT Connection Page"
    >
      {/* Background matching IntroScreen - GPU accelerated */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900/20 to-cyan-900/20 will-change-transform" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.1)_0%,transparent_70%)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,255,255,0.05)_25%,rgba(0,255,255,0.05)_50%,transparent_50%)] bg-[length:50px_50px] animate-[move_20s_linear_infinite]"></div>
      </div>

      {/* Main content - centered both horizontally and vertically */}
      <div className="relative w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col items-center">
        {/* Glow effect - GPU accelerated */}
        <div
          className="absolute inset-0 blur-3xl opacity-50 pointer-events-none will-change-opacity"
          style={{
            background: 'radial-gradient(circle, rgba(96,165,250,0.3) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        {/* Logo section - centered */}
        <div className="relative flex justify-center items-center mb-4 sm:mb-6 py-4 sm:py-6">
          <VOTLogoSVG
            size={100}
            className="relative drop-shadow-[0_0_25px_rgba(96,165,250,0.8)] animate-pulse-slow sm:w-32 sm:h-32 lg:w-40 lg:h-40"
            aria-label="VOT Logo"
          />
        </div>

        {/* Title section - centered, dynamic and animated */}
        <div className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-8 w-full">
          <TerminalText
            text="VOT FACILITATOR"
            className="text-3xl sm:text-5xl lg:text-6xl font-orbitron cyber-gradient-text tracking-[0.32em] sm:tracking-[0.38em] drop-shadow-[0_0_32px_rgba(34,211,238,0.4)] animate-pulse"
            glitch={true}
          />
          <p className="text-lg sm:text-xl tracking-[0.28em] text-green-300 font-orbitron-tight animate-pulse">
            BASE NETWORK • ALPHA STATE
          </p>
          <p className="text-base sm:text-lg tracking-[0.18em] text-blue-300/80 font-mono animate-fade-in">
            Real-Time Intelligence Protocol
          </p>
        </div>

        {/* Connection status badge - centered */}
        <div 
          className="flex items-center justify-center gap-2 px-3 py-2 bg-black/60 border border-cyan-400/40 rounded-lg mb-4 sm:mb-6"
          role="status"
          aria-live="polite"
        >
          <div 
            className={`w-2 h-2 rounded-full ${isInMiniApp ? 'bg-green-400 animate-pulse' : 'bg-cyan-400 animate-pulse'}`}
            aria-hidden="true"
          />
          <span className="text-[10px] sm:text-xs text-cyan-400/80 font-orbitron-tight uppercase tracking-wider">
            {isInMiniApp ? 'Farcaster Mini App' : 'Web Browser'}
          </span>
        </div>

        {/* Connection section - centered with improved styling */}
        <div 
          className="relative w-full border-2 border-cyan-400/30 rounded-lg py-4 sm:py-5 px-4 sm:px-5 bg-black/50 backdrop-blur-sm mb-4 sm:mb-6"
          role="region"
          aria-label="Authentication options"
        >
          <div className="text-center mb-4 sm:mb-5">
            <TerminalText
              text="AUTHENTICATION REQUIRED"
              className="text-xs sm:text-sm lg:text-base font-orbitron tracking-[0.25em] sm:tracking-[0.32em] text-cyan-300"
              delay={500}
            />
          </div>

          <ul className="space-y-2 sm:space-y-3 text-[10px] sm:text-xs lg:text-sm font-mono text-blue-200/80 mb-5 sm:mb-6 list-none">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-ping shrink-0" aria-hidden="true" />
              Farcaster token analytics
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-ping shrink-0" aria-hidden="true" />
              VOT trading intelligence
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-ping shrink-0" aria-hidden="true" />
              x402 protocol integration
            </li>
          </ul>

          {/* Buttons container - CENTERED */}
          <div className="flex flex-col items-center gap-3 sm:gap-4 w-full" role="group" aria-label="Connection options">
            {/* Connect Wallet - Primary CTA - CENTERED */}
            <div className="w-full flex justify-center">
              <EnhancedConnectButton />
            </div>
            
            {/* Farcaster Auth - CENTERED */}
            <div className="w-full flex justify-center">
              <FarcasterAuthButton />
            </div>

            {/* Skip wallet button - only in Farcaster miniapp - CENTERED */}
            {isInMiniApp && farcasterUser && (
              <button
                onClick={handleSkipWallet}
                disabled={isSkipping}
                aria-busy={isSkipping}
                className="w-full max-w-xs px-4 py-3.5 min-h-[48px] bg-black/60 border-2 border-cyan-500/30 rounded-lg text-cyan-400/70 font-orbitron text-xs uppercase tracking-[0.2em] hover:bg-cyan-600/10 hover:border-cyan-400/50 hover:text-cyan-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-black"
              >
                {isSkipping ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-cyan-400/50 border-t-cyan-400 rounded-full animate-spin" aria-hidden="true" />
                    <span>LOADING...</span>
                  </span>
                ) : (
                  <span>Skip Wallet • Continue as @{farcasterUser.username}</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer message - centered */}
        <div className="text-center">
          <p className="text-[9px] sm:text-[10px] lg:text-xs tracking-[0.2em] sm:tracking-[0.22em] font-orbitron-tight text-blue-500/70 uppercase">
            Secure Connection • Base Network
          </p>
        </div>
      </div>
    </div>
  );
}; export default NewConnectPage;
