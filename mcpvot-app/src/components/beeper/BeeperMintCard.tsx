'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    BEEPER MINT CARD - DASHBOARD INTEGRATION                  ║
 * ║                                                                               ║
 * ║  Seamless card component for Dashboard integration                           ║
 * ║  Works in: Mini App (Farcaster) / Base App / Web App                         ║
 * ║                                                                               ║
 * ║  Features:                                                                    ║
 * ║  ✅ Auto-detects wallet/FID from context                                     ║
 * ║  ✅ Matrix green retro terminal style                                        ║
 * ║  ✅ 69,420 VOT reward (NO BURN for promo)                                    ║
 * ║  ✅ +10,000 VOT share & follow bonus                                         ║
 * ║  ✅ Collapsible card for seamless UX                                         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import BeeperMintMachine from '@/components/beeper/BeeperMintMachine';
import { useFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAccount } from 'wagmi';

// Matrix green palette
const MATRIX_GREEN = '#77FE80';
const MATRIX_ACCENT = '#5DE066';
const MATRIX_DIM = '#2a4a2a';

interface BeeperMintCardProps {
  defaultExpanded?: boolean;
  className?: string;
}

export default function BeeperMintCard({ 
  defaultExpanded = false,
  className = '' 
}: BeeperMintCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasMinted, setHasMinted] = useState(false);
  
  // Get user context from both Farcaster and wallet
  const { isInMiniApp, user: farcasterUser } = useFarcasterContext();
  const { address, isConnected } = useAccount();
  
  // Determine user address and FID
  const userAddress = address || farcasterUser?.custody_address || '';
  const farcasterFid = farcasterUser?.fid;
  
  // Check if user can mint
  const canMint = isConnected || (isInMiniApp && farcasterUser);
  
  const handleMintComplete = () => {
    setHasMinted(true);
  };
  
  return (
    <motion.div
      className={`w-full rounded-xl overflow-hidden border-2 ${className}`}
      style={{
        borderColor: `${MATRIX_GREEN}40`,
        backgroundColor: 'rgba(5, 5, 5, 0.95)',
        boxShadow: `0 0 30px ${MATRIX_GREEN}15`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Dino icon with glow */}
          <div 
            className="text-3xl sm:text-4xl"
            style={{ 
              filter: `drop-shadow(0 0 8px ${MATRIX_GREEN})`,
            }}
          >
            🦖
          </div>
          
          <div className="text-left">
            <h3 
              className="font-mono text-lg sm:text-xl uppercase tracking-wider font-bold"
              style={{ color: MATRIX_GREEN }}
            >
              BEEPER PROMO MINT
            </h3>
            <p 
              className="font-mono text-sm sm:text-base"
              style={{ color: MATRIX_ACCENT }}
            >
              $0.25 USDC → 69,420 VOT + NFT
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status badge */}
          {hasMinted ? (
            <span 
              className="px-3 py-1.5 rounded text-sm font-mono uppercase"
              style={{ 
                backgroundColor: `${MATRIX_GREEN}20`,
                color: MATRIX_GREEN,
                border: `1px solid ${MATRIX_GREEN}40`,
              }}
            >
              ✓ MINTED
            </span>
          ) : canMint ? (
            <span 
              className="px-3 py-1.5 rounded text-sm font-mono uppercase animate-pulse"
              style={{ 
                backgroundColor: `${MATRIX_GREEN}10`,
                color: MATRIX_GREEN,
                border: `1px solid ${MATRIX_GREEN}30`,
              }}
            >
              READY
            </span>
          ) : (
            <span 
              className="px-3 py-1.5 rounded text-sm font-mono uppercase"
              style={{ 
                backgroundColor: '#FF880020',
                color: '#FF8800',
                border: '1px solid #FF880040',
              }}
            >
              CONNECT WALLET
            </span>
          )}
          
          {/* Expand/collapse arrow */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: MATRIX_DIM }}
          >
            <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
            </svg>
          </motion.div>
        </div>
      </button>
      
      {/* Expandable Content */}
      <motion.div
        initial={false}
        animate={{ 
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5">
          {/* Info banner */}
          <div 
            className="mb-5 p-4 rounded border font-mono text-sm"
            style={{ 
              borderColor: `${MATRIX_ACCENT}40`,
              backgroundColor: `${MATRIX_ACCENT}10`,
              color: MATRIX_ACCENT,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">💎</span>
              <div>
                <p className="font-bold uppercase text-base">PROMO MINT - NO VOT BURN</p>
                <p className="mt-1 opacity-80 text-sm">
                  Mint your BEEPER NFT for just $0.25 USDC and receive 69,420 VOT!
                  Share on Farcaster + Follow @mcpvot for +10,000 VOT bonus.
                </p>
              </div>
            </div>
          </div>
          
          {/* Mint Machine */}
          {canMint ? (
            <BeeperMintMachine
              userAddress={userAddress}
              farcasterFid={farcasterFid}
              onMintComplete={handleMintComplete}
            />
          ) : (
            <div 
              className="p-8 rounded-lg border-2 text-center"
              style={{ 
                borderColor: MATRIX_DIM,
                backgroundColor: 'rgba(5, 5, 5, 0.8)',
              }}
            >
              <p className="font-mono text-base" style={{ color: MATRIX_DIM }}>
                Connect wallet or open in Farcaster to mint
              </p>
            </div>
          )}
          
          {/* Environment indicator */}
          <div 
            className="mt-5 pt-4 border-t flex items-center justify-between"
            style={{ borderColor: `${MATRIX_DIM}40` }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm uppercase" style={{ color: MATRIX_DIM }}>
                ENV:
              </span>
              <span 
                className="px-3 py-1 rounded text-sm font-mono uppercase"
                style={{ 
                  backgroundColor: isInMiniApp ? '#8A63D220' : '#00FFFF20',
                  color: isInMiniApp ? '#8A63D2' : '#00FFFF',
                }}
              >
                {isInMiniApp ? 'FARCASTER' : 'WEB'}
              </span>
            </div>
            
            {farcasterFid && (
              <span className="font-mono text-sm" style={{ color: MATRIX_DIM }}>
                FID: {farcasterFid}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
