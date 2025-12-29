'use client';

import { ChevronDown, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

// Matrix green palette
const MATRIX_GREEN = '#77FE80';
const MATRIX_BRIGHT = '#88FF99';

// Chain configurations with icons and colors
const SUPPORTED_CHAINS = [
  {
    id: 8453,
    name: 'Base',
    shortName: 'BASE',
    icon: '/base-logo.svg', // Use actual Base logo
    iconFallback: '🔵',
    color: 'from-blue-500/30 to-blue-600/20',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-300',
    explorer: 'https://basescan.org',
    primary: true,
  },
  {
    id: 1,
    name: 'Ethereum',
    shortName: 'ETH',
    icon: null,
    iconFallback: '⟠',
    color: 'from-slate-500/30 to-slate-600/20',
    borderColor: 'border-slate-400/50',
    textColor: 'text-slate-300',
    explorer: 'https://etherscan.io',
  },
  {
    id: 42161,
    name: 'Arbitrum',
    shortName: 'ARB',
    icon: null,
    iconFallback: '🔷',
    color: 'from-sky-500/30 to-sky-600/20',
    borderColor: 'border-sky-500/50',
    textColor: 'text-sky-300',
    explorer: 'https://arbiscan.io',
  },
  {
    id: 10,
    name: 'Optimism',
    shortName: 'OP',
    icon: null,
    iconFallback: '🔴',
    color: 'from-red-500/30 to-red-600/20',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-300',
    explorer: 'https://optimistic.etherscan.io',
  },
  {
    id: 56,
    name: 'BNB Chain',
    shortName: 'BNB',
    icon: null,
    iconFallback: '🟡',
    color: 'from-yellow-500/30 to-yellow-600/20',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-300',
    explorer: 'https://bscscan.com',
  },
] as const;

// Solana is non-EVM, handled separately
const SOLANA_CHAIN = {
  id: 'solana',
  name: 'Solana',
  shortName: 'SOL',
  icon: null,
  iconFallback: '◎',
  color: 'from-purple-500/30 to-green-500/20',
  borderColor: 'border-purple-500/50',
  textColor: 'text-purple-300',
  explorer: 'https://solscan.io',
  isNonEVM: true,
};

// Chain icon component - MUST be defined outside main component to avoid re-creation during render
function ChainIcon({ chain, size = 16 }: { chain: typeof SUPPORTED_CHAINS[number] | typeof SOLANA_CHAIN; size?: number }) {
  // For Base, use a custom styled indicator
  if ('primary' in chain && chain.primary) {
    return (
      <div 
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Glowing green dot for Base */}
        <div 
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ 
            backgroundColor: MATRIX_GREEN,
            boxShadow: `0 0 8px ${MATRIX_GREEN}, 0 0 16px ${MATRIX_GREEN}40`
          }}
        />
      </div>
    );
  }
  return <span style={{ fontSize: size }}>{chain.iconFallback}</span>;
}

interface ChainSelectorProps {
  className?: string;
  variant?: 'default' | 'compact' | 'badge';
  showExplorer?: boolean;
}

export function ChainSelector({
  className = '',
  variant = 'default',
  showExplorer = false,
}: ChainSelectorProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const [isSolanaMode, setIsSolanaMode] = useState(false);

  // Get current chain info
  const currentChain = SUPPORTED_CHAINS.find((c) => c.id === chainId) || SUPPORTED_CHAINS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.chain-selector')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleChainSwitch = useCallback(
    (newChainId: number) => {
      if (switchChain && newChainId !== chainId) {
        console.log(`[Chain] Switching to chain ${newChainId}`);
        switchChain({ chainId: newChainId });
      }
      setIsSolanaMode(false);
      setIsOpen(false);
    },
    [switchChain, chainId]
  );

  const handleSolanaClick = () => {
    // For Solana, we'll show a message since it requires different wallet
    setIsSolanaMode(true);
    setIsOpen(false);
    // Could open Phantom wallet or show instructions
    window.open('https://phantom.app/', '_blank');
  };

  // Compact badge variant (for header) - IMPROVED
  if (variant === 'badge') {
    return (
      <div className={`chain-selector relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={!isConnected}
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-all duration-200 gpu-accelerate min-h-[36px] sm:min-h-[40px]
            ${isConnected ? 'hover:opacity-80 active:scale-[0.98] cursor-pointer' : 'opacity-50 cursor-not-allowed'}
            ${isPending ? 'animate-pulse' : ''}`}
          style={{
            borderColor: isSolanaMode ? 'rgba(168,85,247,0.5)' : `${MATRIX_GREEN}50`,
            background: isSolanaMode 
              ? 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(34,197,94,0.1) 100%)' 
              : `linear-gradient(135deg, rgba(119,254,128,0.08) 0%, rgba(0,0,0,0.9) 100%)`,
            boxShadow: isOpen ? `0 0 20px ${MATRIX_GREEN}30` : 'none',
          }}
        >
          {/* Show different content based on connection state */}
          {isConnected ? (
            <>
              {/* Green dot indicator */}
              <ChainIcon chain={isSolanaMode ? SOLANA_CHAIN : currentChain} size={16} />
              
              {/* Chain name */}
              <span 
                className="text-xs sm:text-sm font-mono font-bold tracking-wide"
                style={{ color: isSolanaMode ? '#a855f7' : MATRIX_GREEN }}
              >
                {isSolanaMode ? SOLANA_CHAIN.shortName : currentChain.shortName}
              </span>
            </>
          ) : (
            <>
              {/* Not connected - show prompt */}
              <span 
                className="text-[10px] sm:text-xs font-mono font-medium tracking-wide"
                style={{ color: `${MATRIX_GREEN}80` }}
              >
                ◈ NETWORK
              </span>
            </>
          )}
          
          {/* Chevron */}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: isSolanaMode ? '#a855f7' : MATRIX_GREEN }}
          />
        </button>

        {/* Dropdown - mobile optimized with proper z-index for MiniApp */}
        {isOpen && (
          <>
            {/* Full screen backdrop overlay for all devices in MiniApp */}
            <div 
              className="fixed inset-0 bg-black/70 z-[99998] backdrop-blur-sm" 
              onClick={() => setIsOpen(false)}
            />
            {/* Dropdown positioned below button with high z-index */}
            <div 
              className="fixed left-4 right-4 top-20 sm:absolute sm:top-full sm:left-0 sm:right-auto sm:mt-2 sm:w-64 w-auto rounded-xl shadow-2xl backdrop-blur-md z-[99999] overflow-hidden gpu-accelerate"
              style={{
                backgroundColor: 'rgba(5,5,5,0.98)',
                border: `2px solid ${MATRIX_GREEN}40`,
                boxShadow: `0 0 40px ${MATRIX_GREEN}20, inset 0 1px 0 ${MATRIX_GREEN}10`,
              }}
            >
              <div className="p-3 max-h-[60vh] overflow-y-auto">
                {/* Header */}
                <div 
                  className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-mono font-bold border-b mb-2"
                  style={{ color: MATRIX_GREEN, borderColor: `${MATRIX_GREEN}30` }}
                >
                  ◈ SELECT NETWORK
                </div>
                
                {/* EVM Chains */}
                {SUPPORTED_CHAINS.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => handleChainSwitch(chain.id)}
                    disabled={isPending}
                    className={`w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg transition-all duration-150 min-h-[52px] sm:min-h-[44px] mb-1
                      ${isPending ? 'opacity-50' : ''}`}
                    style={{
                      background: chainId === chain.id && !isSolanaMode 
                        ? `linear-gradient(135deg, ${MATRIX_GREEN}15 0%, transparent 100%)`
                        : 'transparent',
                      border: chainId === chain.id && !isSolanaMode 
                        ? `1px solid ${MATRIX_GREEN}50`
                        : '1px solid transparent',
                    }}
                  >
                    <ChainIcon chain={chain} size={20} />
                    <span 
                      className="text-sm font-mono font-semibold flex-1 text-left"
                      style={{ color: chain.primary ? MATRIX_GREEN : chain.textColor.replace('text-', '#').includes('#') ? chain.textColor : '#9ca3af' }}
                    >
                      {chain.name}
                    </span>
                    {chainId === chain.id && !isSolanaMode && (
                      <span 
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ 
                          backgroundColor: MATRIX_BRIGHT,
                          boxShadow: `0 0 8px ${MATRIX_GREEN}`
                        }}
                      />
                    )}
                  </button>
                ))}

                {/* Divider */}
                <div 
                  className="my-2 border-t"
                  style={{ borderColor: 'rgba(168,85,247,0.3)' }}
                />
                
                {/* Non-EVM Header */}
                <div className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-purple-400 font-mono font-bold">
                  ◇ NON-EVM
                </div>
                
                {/* Solana */}
                <button
                  onClick={handleSolanaClick}
                  className={`w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg transition-all duration-150 min-h-[52px] sm:min-h-[44px]`}
                  style={{
                    background: isSolanaMode 
                      ? 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, transparent 100%)'
                      : 'transparent',
                    border: isSolanaMode 
                      ? '1px solid rgba(168,85,247,0.5)'
                      : '1px solid transparent',
                  }}
                >
                  <span className="text-xl">{SOLANA_CHAIN.iconFallback}</span>
                  <span className="text-sm font-mono font-semibold text-purple-300 flex-1 text-left">
                    {SOLANA_CHAIN.name}
                  </span>
                  <ExternalLink size={14} className="text-purple-400/60" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Default full variant
  return (
    <div className={`chain-selector relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={!isConnected}
        className={`flex items-center justify-between gap-2 w-full px-4 py-3 rounded-lg border transition-all duration-200 gpu-accelerate
          ${currentChain.borderColor} bg-gradient-to-r ${currentChain.color}
          ${isConnected ? 'hover:opacity-90 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
          ${isPending ? 'animate-pulse' : ''}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{isSolanaMode ? SOLANA_CHAIN.icon : currentChain.icon}</span>
          <div className="text-left">
            <div className={`text-sm font-bold ${isSolanaMode ? SOLANA_CHAIN.textColor : currentChain.textColor}`}>
              {isSolanaMode ? SOLANA_CHAIN.name : currentChain.name}
            </div>
            <div className="text-[10px] text-white/50 font-mono">
              {isPending ? 'Switching...' : isConnected ? 'Connected' : 'Not connected'}
            </div>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${currentChain.textColor}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 border border-cyan-500/30 rounded-lg shadow-2xl backdrop-blur-md z-[10000] overflow-hidden gpu-accelerate">
          <div className="p-2">
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-cyan-500/60 font-mono border-b border-cyan-500/20 mb-1">
              Select Network
            </div>

            {/* EVM Chains */}
            {SUPPORTED_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleChainSwitch(chain.id)}
                disabled={isPending}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 touch-target
                  ${chainId === chain.id && !isSolanaMode ? `bg-gradient-to-r ${chain.color} ${chain.borderColor} border` : 'hover:bg-white/5 active:bg-white/10'}
                  ${isPending ? 'opacity-50' : ''}`}
              >
                <span className="text-xl">{chain.icon}</span>
                <div className="flex-1 text-left">
                  <div className={`text-sm font-semibold ${chain.textColor}`}>{chain.name}</div>
                  <div className="text-[10px] text-white/40 font-mono">Chain ID: {chain.id}</div>
                </div>
                {chainId === chain.id && !isSolanaMode && (
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                )}
                {showExplorer && (
                  <a
                    href={chain.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <ExternalLink size={12} className={chain.textColor} />
                  </a>
                )}
              </button>
            ))}

            {/* Solana Section */}
            <div className="my-2 border-t border-purple-500/20 pt-2">
              <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-purple-500/60 font-mono">
                Non-EVM Networks
              </div>
              <button
                onClick={handleSolanaClick}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 touch-target
                  ${isSolanaMode ? `bg-gradient-to-r ${SOLANA_CHAIN.color} ${SOLANA_CHAIN.borderColor} border` : 'hover:bg-white/5 active:bg-white/10'}`}
              >
                <span className="text-xl">{SOLANA_CHAIN.icon}</span>
                <div className="flex-1 text-left">
                  <div className={`text-sm font-semibold ${SOLANA_CHAIN.textColor}`}>{SOLANA_CHAIN.name}</div>
                  <div className="text-[10px] text-white/40 font-mono">Requires Phantom Wallet</div>
                </div>
                <ExternalLink size={14} className="text-purple-400/60" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChainSelector;
