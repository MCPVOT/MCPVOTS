'use client';

import { ChevronDown, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

// Chain configurations with icons and colors
const SUPPORTED_CHAINS = [
  {
    id: 8453,
    name: 'Base',
    shortName: 'BASE',
    icon: '🔵',
    color: 'from-blue-500/30 to-blue-600/20',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-300',
    explorer: 'https://basescan.org',
  },
  {
    id: 1,
    name: 'Ethereum',
    shortName: 'ETH',
    icon: '⟠',
    color: 'from-slate-500/30 to-slate-600/20',
    borderColor: 'border-slate-400/50',
    textColor: 'text-slate-300',
    explorer: 'https://etherscan.io',
  },
  {
    id: 42161,
    name: 'Arbitrum',
    shortName: 'ARB',
    icon: '🔷',
    color: 'from-sky-500/30 to-sky-600/20',
    borderColor: 'border-sky-500/50',
    textColor: 'text-sky-300',
    explorer: 'https://arbiscan.io',
  },
  {
    id: 10,
    name: 'Optimism',
    shortName: 'OP',
    icon: '🔴',
    color: 'from-red-500/30 to-red-600/20',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-300',
    explorer: 'https://optimistic.etherscan.io',
  },
  {
    id: 56,
    name: 'BNB Chain',
    shortName: 'BNB',
    icon: '🟡',
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
  icon: '◎',
  color: 'from-purple-500/30 to-green-500/20',
  borderColor: 'border-purple-500/50',
  textColor: 'text-purple-300',
  explorer: 'https://solscan.io',
  isNonEVM: true,
};

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

  // Compact badge variant (for header)
  if (variant === 'badge') {
    return (
      <div className={`chain-selector relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={!isConnected}
          className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md border transition-all duration-200 gpu-accelerate min-h-[32px] min-w-[50px] sm:min-w-[60px]
            ${currentChain.borderColor} bg-gradient-to-r ${currentChain.color}
            ${isConnected ? 'hover:opacity-80 active:scale-95 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
            ${isPending ? 'animate-pulse' : ''}`}
        >
          <span className="text-sm sm:text-base">{isSolanaMode ? SOLANA_CHAIN.icon : currentChain.icon}</span>
          <span className={`text-[10px] sm:text-xs font-bold ${isSolanaMode ? SOLANA_CHAIN.textColor : currentChain.textColor}`}>
            {isSolanaMode ? SOLANA_CHAIN.shortName : currentChain.shortName}
          </span>
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${currentChain.textColor}`}
          />
        </button>

        {/* Dropdown - mobile optimized with proper z-index for MiniApp */}
        {isOpen && (
          <>
            {/* Full screen backdrop overlay for all devices in MiniApp */}
            <div 
              className="fixed inset-0 bg-black/60 z-[99998]" 
              onClick={() => setIsOpen(false)}
            />
            {/* Dropdown positioned below button with high z-index */}
            <div className="fixed left-4 right-4 top-20 sm:absolute sm:top-full sm:left-0 sm:right-auto sm:mt-2 sm:w-56 w-auto bg-black/98 border-2 border-cyan-500/60 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-md z-[99999] overflow-hidden gpu-accelerate">
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                <div className="px-3 py-2 text-[11px] uppercase tracking-widest text-cyan-400 font-mono font-bold">
                  Select Network
                </div>
                {SUPPORTED_CHAINS.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => handleChainSwitch(chain.id)}
                    disabled={isPending}
                    className={`w-full flex items-center gap-3 px-4 py-4 sm:py-3 rounded-lg transition-all duration-150 min-h-[56px] sm:min-h-[48px]
                      ${chainId === chain.id && !isSolanaMode ? `bg-gradient-to-r ${chain.color} ${chain.borderColor} border-2` : 'hover:bg-cyan-500/10 active:bg-cyan-500/20 border border-transparent'}
                      ${isPending ? 'opacity-50' : ''}`}
                  >
                    <span className="text-2xl sm:text-xl">{chain.icon}</span>
                    <span className={`text-base sm:text-sm font-semibold ${chain.textColor}`}>{chain.name}</span>
                    {chainId === chain.id && !isSolanaMode && (
                      <span className="ml-auto w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                    )}
                  </button>
                ))}

                <div className="my-2 border-t border-cyan-500/30" />
                <div className="px-3 py-2 text-[11px] uppercase tracking-widest text-purple-400 font-mono font-bold">
                  Non-EVM
                </div>
                <button
                  onClick={handleSolanaClick}
                  className={`w-full flex items-center gap-3 px-4 py-4 sm:py-3 rounded-lg transition-all duration-150 min-h-[56px] sm:min-h-[48px]
                    ${isSolanaMode ? `bg-gradient-to-r ${SOLANA_CHAIN.color} ${SOLANA_CHAIN.borderColor} border-2` : 'hover:bg-purple-500/10 active:bg-purple-500/20 border border-transparent'}`}
                >
                  <span className="text-2xl sm:text-xl">{SOLANA_CHAIN.icon}</span>
                  <span className={`text-base sm:text-sm font-semibold ${SOLANA_CHAIN.textColor}`}>{SOLANA_CHAIN.name}</span>
                  <ExternalLink size={14} className="ml-auto text-purple-400/60" />
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
