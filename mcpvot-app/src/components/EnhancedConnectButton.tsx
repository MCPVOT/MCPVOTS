"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ENHANCED CONNECT BUTTON - MATRIX STYLE                     ║
 * ║                                                                               ║
 * ║  Platforms Supported:                                                         ║
 * ║  ✅ Farcaster Mini-App (SDK wallet)                                          ║
 * ║  ✅ Base Network (chain 8453)                                                 ║
 * ║  ✅ Web Desktop (responsive)                                                  ║
 * ║  ✅ Mobile Web (WalletConnect deep links)                                     ║
 * ║  ✅ Return from wallet app detection                                          ║
 * ║                                                                               ║
 * ║  Style: Matrix Green (#77FE80) - beep.works inspired                         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { usePlatform } from '@/hooks/usePlatform';
import { Wallet } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

// =============================================================================
// CONSTANTS - MATRIX GREEN PALETTE (matching BEEPER MINT MACHINE)
// =============================================================================

const MATRIX_GREEN = '#77FE80';
const MATRIX_BRIGHT = '#88FF99';
const MATRIX_ACCENT = '#5DE066';
const MATRIX_DIM = '#3a5a3a';
const MATRIX_BG = '#050505';
const PURPLE_ACCENT = '#8A63D2';
const CYAN_ACCENT = '#00D4FF';

interface EnhancedConnectButtonProps {
    className?: string;
    variant?: 'default' | 'compact' | 'header';
}

// Note: useIsMobile is now replaced by the comprehensive usePlatform hook from @/hooks/usePlatform
// Keeping useIsInMiniApp for backwards compatibility with legacy code

// Detect if inside Farcaster/Warpcast MiniApp (computed with useEffect for SSR-safety + reactivity)
const useIsInMiniApp = () => {
    const [isInMiniApp, setIsInMiniApp] = useState(false);
    
    useEffect(() => {
        const checkMiniApp = () => {
            if (typeof window === 'undefined') return false;
            
            try {
                const inIframe = window.parent !== window;
                const userAgent = navigator.userAgent || '';
                const hasFarcasterUserAgent = userAgent.includes('Warpcast') || userAgent.includes('warpcast');
                const hasFarcasterReferrer = document.referrer.includes('warpcast') || 
                                             document.referrer.includes('farcaster');
                
                // Check for Base/Coinbase mobile app context
                const hasCoinbaseUserAgent = userAgent.includes('CoinbaseWallet') || 
                                             userAgent.includes('Coinbase') ||
                                             userAgent.includes('BaseMobileApp');
                const hasCoinbaseReferrer = document.referrer.includes('coinbase') ||
                                            document.referrer.includes('base.org');
                
                // Also check URL params that Farcaster or Base adds
                const urlParams = new URLSearchParams(window.location.search);
                const hasFarcasterParams = urlParams.has('fc_frame') || urlParams.has('fid') || urlParams.has('miniapp');
                const hasBaseParams = urlParams.has('base_app') || urlParams.has('cb_app');
                
                // Check for Farcaster frame context in embedded mode
                const hasFrameContext = window.location.href.includes('frame=') ||
                                        window.location.href.includes('embed=');
                
                // Also check for Farcaster-specific or Coinbase window objects
                const hasFarcasterSDK = typeof (window as {farcaster?: unknown}).farcaster !== 'undefined';
                const hasCoinbaseSDK = typeof (window as {coinbaseWalletExtension?: unknown}).coinbaseWalletExtension !== 'undefined' ||
                                       typeof (window as {CoinbaseWalletSDK?: unknown}).CoinbaseWalletSDK !== 'undefined';
                
                const isMiniApp = inIframe || 
                                  hasFarcasterUserAgent || hasFarcasterReferrer || hasFarcasterParams || 
                                  hasCoinbaseUserAgent || hasCoinbaseReferrer || hasBaseParams ||
                                  hasFrameContext || hasFarcasterSDK || hasCoinbaseSDK;
                
                console.log('[MiniApp] Detection:', {
                    inIframe,
                    hasFarcasterUserAgent,
                    hasFarcasterReferrer,
                    hasFarcasterParams,
                    hasCoinbaseUserAgent,
                    hasCoinbaseReferrer,
                    hasBaseParams,
                    hasFrameContext,
                    hasFarcasterSDK,
                    hasCoinbaseSDK,
                    isMiniApp
                });
                
                setIsInMiniApp(isMiniApp);
            } catch (err) {
                console.warn('[MiniApp] Detection error:', err);
                setIsInMiniApp(false);
            }
        };
        
        checkMiniApp();
        
        // Re-check on URL changes (for SPA navigation)
        window.addEventListener('popstate', checkMiniApp);
        return () => window.removeEventListener('popstate', checkMiniApp);
    }, []);
    
    return isInMiniApp;
};

export function EnhancedConnectButton({ 
    className
}: EnhancedConnectButtonProps) {
    const { address, isConnected, isConnecting } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    const [showWalletModal, setShowWalletModal] = useState(false);
    
    // Use the platform hook for comprehensive device/context detection
    const platform = usePlatform();
    const [walletName, setWalletName] = useState<string | null>(null);
    const [showReconnectBanner, setShowReconnectBanner] = useState(false);
    
    // Legacy hooks for backwards compatibility (called unconditionally)
    const legacyIsInMiniApp = useIsInMiniApp();
    
    // Use platform hook values (more comprehensive than legacy hooks)
    const isMobile = platform.isMobile || platform.shouldShowMobileUI;
    const isInMiniApp = platform.isInMiniApp || legacyIsInMiniApp;
    const walletAppName = platform.walletAppName;
    
    // Detect when returning from wallet app - use refs to avoid lint warnings
    useEffect(() => {
        if (platform.isReturningFromWallet && !isConnected && !isConnecting) {
            console.log('[Wallet] User returned from wallet app - showing reconnect prompt');
            // Use requestAnimationFrame to batch these updates
            requestAnimationFrame(() => {
                setShowReconnectBanner(true);
                setShowWalletModal(true); // Auto-open wallet modal
            });
            // Hide banner after 10 seconds
            const timer = setTimeout(() => setShowReconnectBanner(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [platform.isReturningFromWallet, isConnected, isConnecting]);
    
    // Sort and filter connectors for better mobile UX
    const sortedConnectors = useMemo(() => {
        // Deduplicate by name (keep first occurrence)
        let uniqueConnectors = connectors.filter((connector, index, self) => 
            index === self.findIndex(c => c.name === connector.name)
        );
        
        console.log('[Wallet] Raw connectors:', uniqueConnectors.map(c => c.name));
        console.log('[Wallet] Platform:', { isMobile, isInMiniApp, walletApp: walletAppName });
        
        // Filter out confusing connectors on mobile that don't work well
        // "Injected" shows as "Browser Wallet" which confuses users
        if (isMobile || isInMiniApp) {
            uniqueConnectors = uniqueConnectors.filter(c => 
                c.name !== 'Injected' && 
                !c.name.toLowerCase().includes('browser') &&
                c.name !== 'Browser Wallet'
            );
        }
        
        // In Farcaster MiniApp: prioritize Farcaster connector, then others
        if (isInMiniApp) {
            return uniqueConnectors.sort((a, b) => {
                // Priority order for Farcaster Mini-App environment
                const farcasterOrder: Record<string, number> = {
                    'Farcaster MiniApp': 0,  // Top priority - native Farcaster wallet
                    'Farcaster Frame SDK': 0, // Alternative naming
                    'Farcaster': 0,           // Alternative naming
                    'Coinbase Wallet': 1,     // Good Smart Wallet support on Base
                    'WalletConnect': 2,       // Opens external wallets via deep link
                    'Rainbow': 3,             // Good mobile support
                    'MetaMask': 4,
                    'Phantom': 5,
                    'Trust Wallet': 6,
                    'Binance Web3 Wallet': 7,
                };
                const orderA = farcasterOrder[a.name] ?? 50;
                const orderB = farcasterOrder[b.name] ?? 50;
                return orderA - orderB;
            });
        }
        
        // On mobile (not in Farcaster): prioritize WalletConnect
        if (isMobile) {
            return uniqueConnectors.sort((a, b) => {
                const mobileOrder: Record<string, number> = {
                    'Coinbase Wallet': 0,    // Native Base wallet - works well in mobile browser
                    'WalletConnect': 1,      // Opens any mobile wallet via deep link
                    'MetaMask': 2,           // May have in-app browser  
                    'Phantom': 3,            // May have in-app browser
                    'Rainbow': 4,            // Good mobile support
                    'Trust Wallet': 5,
                    'Binance Web3 Wallet': 6,
                    'Farcaster MiniApp': 7,  // Lower priority on general mobile
                };
                const orderA = mobileOrder[a.name] ?? 50;
                const orderB = mobileOrder[b.name] ?? 50;
                return orderA - orderB;
            });
        }
        
        // Desktop: prioritize direct connections
        return uniqueConnectors.sort((a, b) => {
            const desktopOrder: Record<string, number> = {
                'Coinbase Wallet': 1,
                'MetaMask': 2,
                'Phantom': 3,
                'Rainbow': 4,
                'WalletConnect': 5,
                'Trust Wallet': 6,
            };
            const orderA = desktopOrder[a.name] ?? 99;
            const orderB = desktopOrder[b.name] ?? 99;
            return orderA - orderB;
        });
    }, [connectors, isMobile, isInMiniApp, walletAppName]);

    // Auto-switch to Base network when user connects on wrong network
    useEffect(() => {
        if (isConnected && chainId !== base.id && switchChain) {
            console.log(`[Network] Auto-switching from chain ${chainId} to Base (${base.id})`);
            switchChain({ chainId: base.id });
        }
    }, [isConnected, chainId, switchChain]);

    // Resolve wallet name (ENS/BaseName) when connected
    useEffect(() => {
        const resolveName = async () => {
            if (!address) {
                setWalletName(null);
                return;
            }

            // Set shortened address immediately as fallback
            const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
            setWalletName(shortAddress);

            try {
                // Try BaseName first (Base chain identity)
                console.log('[Name] Resolving BaseName for:', address);
                const baseNameResponse = await fetch(`/api/resolve-basename?address=${address}`);
                if (baseNameResponse.ok) {
                    const baseNameData = await baseNameResponse.json();
                    console.log('[Name] BaseName response:', baseNameData);
                    if (baseNameData.baseName) {
                        setWalletName(baseNameData.baseName);
                        console.log('[Name] Using BaseName:', baseNameData.baseName);
                        return;
                    }
                }

                // Try ENS (Ethereum mainnet identity)
                console.log('[Name] Resolving ENS for:', address);
                const ensResponse = await fetch(`/api/resolve-ens?address=${address}`);
                if (ensResponse.ok) {
                    const ensData = await ensResponse.json();
                    console.log('[Name] ENS response:', ensData);
                    if (ensData.ensName) {
                        setWalletName(ensData.ensName);
                        console.log('[Name] Using ENS:', ensData.ensName);
                        return;
                    }
                }

                // Keep shortened address if no name found
                console.log('[Name] No name found, using address:', shortAddress);
            } catch (error) {
                console.warn('[Name] Resolution failed:', error);
                // Already set to shortAddress above
            }
        };

        resolveName();
    }, [address]);

    // Responsive sizing - looks amazing on any screen
    const getButtonClasses = useCallback((baseClasses: string) => {
        // Consistent sizing across all screens - larger and more visible, centered
        const responsiveClasses = 'w-full max-w-xs px-4 py-2.5 text-sm min-h-[44px]';
        return `${baseClasses} ${responsiveClasses} font-semibold transition-all duration-200 backdrop-blur-sm rounded-lg gpu-accelerate`;
    }, []);

    const isWrongNetwork = isConnected && chainId !== base.id;

    return (
        <div className={`flex justify-center ${className || ''}`}>
            {!isConnected ? (
                <button
                    onClick={() => setShowWalletModal(true)}
                    type="button"
                    className={getButtonClasses(
                        "group relative overflow-hidden font-mono tracking-wider uppercase"
                    )}
                    style={{
                        backgroundColor: `${MATRIX_GREEN}15`,
                        border: `2px solid ${MATRIX_GREEN}60`,
                        color: MATRIX_BRIGHT,
                        boxShadow: `0 0 20px ${MATRIX_GREEN}25`,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = MATRIX_GREEN;
                        e.currentTarget.style.boxShadow = `0 0 30px ${MATRIX_GREEN}40`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${MATRIX_GREEN}60`;
                        e.currentTarget.style.boxShadow = `0 0 20px ${MATRIX_GREEN}25`;
                    }}
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        <Wallet size={18} className="opacity-90 flex-shrink-0" />
                        <span>Connect Wallet</span>
                    </span>
                </button>
            ) : isWrongNetwork ? (
                /* Wrong Network Modal - Matrix Style */
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto"
                    style={{ backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
                    onClick={() => switchChain({ chainId: base.id })}
                >
                    <div 
                        className="p-8 max-w-md w-full mx-4 text-center"
                        style={{
                            backgroundColor: MATRIX_BG,
                            border: `2px solid #ff4444`,
                            borderRadius: '12px',
                            boxShadow: '0 0 40px rgba(255,68,68,0.3)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 
                            className="text-2xl font-mono tracking-wider mb-4"
                            style={{ color: '#ff6666' }}
                        >
                            ⚠️ WRONG NETWORK
                        </h3>
                        <p className="text-base mb-6 font-mono" style={{ color: MATRIX_DIM }}>
                            Please switch to <span style={{ color: CYAN_ACCENT }}>Base</span> to continue.
                        </p>
                        <button
                            onClick={() => switchChain({ chainId: base.id })}
                            className="w-full px-6 py-3 font-mono font-bold rounded-lg transition-all text-lg"
                            style={{
                                backgroundColor: `${MATRIX_GREEN}20`,
                                border: `2px solid ${MATRIX_GREEN}`,
                                color: MATRIX_BRIGHT,
                                boxShadow: `0 0 25px ${MATRIX_GREEN}40`,
                            }}
                        >
                            ⚡ Switch to Base Network
                        </button>
                    </div>
                </div>
            ) : (
                /* Connected: Show wallet name/address with green indicator */
                <button
                    onClick={() => disconnect()}
                    type="button"
                    className={getButtonClasses(
                        "group relative overflow-hidden font-mono tracking-wide transition-all"
                    )}
                    style={{
                        backgroundColor: `${MATRIX_GREEN}10`,
                        border: `2px solid ${MATRIX_GREEN}50`,
                        color: MATRIX_BRIGHT,
                        boxShadow: `0 0 15px ${MATRIX_GREEN}20`,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = MATRIX_GREEN;
                        e.currentTarget.style.boxShadow = `0 0 25px ${MATRIX_GREEN}35`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${MATRIX_GREEN}50`;
                        e.currentTarget.style.boxShadow = `0 0 15px ${MATRIX_GREEN}20`;
                    }}
                >
                    <span className="relative z-10 flex items-center justify-center gap-2.5">
                        <span 
                            className="w-2.5 h-2.5 rounded-full animate-pulse"
                            style={{ 
                                backgroundColor: MATRIX_GREEN,
                                boxShadow: `0 0 10px ${MATRIX_GREEN}`,
                            }}
                        />
                        <span className="font-medium truncate max-w-[120px] sm:max-w-[160px]">
                            {walletName || 'Loading...'}
                        </span>
                    </span>
                </button>
            )}

            {/* Wallet Selection Modal - MATRIX GREEN STYLE */}
            {showWalletModal && (
                <div 
                    className="fixed inset-0 z-[9999] overflow-y-auto"
                    style={{ backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setShowWalletModal(false)}
                >
                    {/* Centering wrapper */}
                    <div className="min-h-full flex items-center justify-center p-4">
                        {/* Modal Container */}
                        <div 
                            className="relative w-full max-w-md"
                            style={{
                                backgroundColor: MATRIX_BG,
                                border: `2px solid ${MATRIX_GREEN}60`,
                                borderRadius: '12px',
                                boxShadow: `0 0 60px ${MATRIX_GREEN}30, inset 0 0 30px ${MATRIX_GREEN}05`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Scanline overlay */}
                            <div 
                                className="absolute inset-0 pointer-events-none opacity-[0.03] rounded-xl"
                                style={{
                                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${MATRIX_GREEN} 2px, ${MATRIX_GREEN} 4px)`,
                                }}
                            />

                        {/* Header */}
                        <div 
                            className="relative p-4 sm:p-6 border-b"
                            style={{ borderColor: `${MATRIX_GREEN}30` }}
                        >
                            <div className="text-center">
                                <h3 
                                    className="text-xl font-mono uppercase tracking-[0.15em] mb-2"
                                    style={{ 
                                        color: MATRIX_BRIGHT,
                                        textShadow: `0 0 20px ${MATRIX_GREEN}80`,
                                    }}
                                >
                                    Choose your preferred wallet provider
                                </h3>
                                <p 
                                    className="text-xs font-mono"
                                    style={{ color: MATRIX_DIM }}
                                >
                                    {isInMiniApp 
                                        ? '🟣 Farcaster Mini-App: Use Warpcast wallet'
                                        : isMobile 
                                            ? '📱 Mobile: Tap to open your wallet app' 
                                            : 'Select a wallet to connect to MCPVOT'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Mobile hint for Farcaster users */}
                        {isMobile && !isInMiniApp && (
                            <div 
                                className="mx-6 mt-4 p-3 rounded-lg font-mono text-xs"
                                style={{ 
                                    backgroundColor: `${PURPLE_ACCENT}15`,
                                    border: `1px solid ${PURPLE_ACCENT}40`,
                                    color: PURPLE_ACCENT,
                                }}
                            >
                                💡 <strong>Tip:</strong> WalletConnect opens your MetaMask, Phantom, or Rainbow app
                            </div>
                        )}
                        
                        {/* Reconnect banner - shows when returning from wallet app */}
                        {showReconnectBanner && (
                            <div 
                                className="mx-6 mt-4 p-3 rounded-lg font-mono text-xs animate-pulse"
                                style={{ 
                                    backgroundColor: `${MATRIX_GREEN}15`,
                                    border: `1px solid ${MATRIX_GREEN}60`,
                                    color: MATRIX_BRIGHT,
                                }}
                            >
                                👋 <strong>Welcome back!</strong> Tap your wallet below to complete connection
                            </div>
                        )}
                        
                        {/* Wallet List - SCROLLABLE */}
                        <div 
                            className="p-4 sm:p-6 space-y-3 overflow-y-auto"
                            style={{ 
                                maxHeight: '50vh',
                                WebkitOverflowScrolling: 'touch',
                            }}
                        >
                            {/* Show loading if no connectors yet */}
                            {sortedConnectors.length === 0 && (
                                <div className="text-center py-8 font-mono text-sm" style={{ color: MATRIX_DIM }}>
                                    <div className="animate-pulse">Loading wallets...</div>
                                </div>
                            )}
                            
                            {/* Wallet buttons - Matrix style */}
                            {sortedConnectors.map((connector) => {
                                // Wallet icon mapping
                                const getWalletIcon = (name: string) => {
                                    const iconMap: Record<string, string> = {
                                        'Coinbase Wallet': '🔷',
                                        'MetaMask': '🦊',
                                        'Rainbow': '🌈',
                                        'WalletConnect': '🔗',
                                        'Trust Wallet': '🛡️',
                                        'Binance Web3 Wallet': '🔶',
                                        'Binance Wallet': '🔶',
                                        'Phantom': '👻',
                                        'Brave Wallet': '🦁',
                                        'OKX Wallet': '🟢',
                                        'Injected': '🔌',
                                        'Safe': '🔐',
                                        'Argent': '⬜',
                                        'Ledger': '💾',
                                        'Farcaster': '🟣',
                                        'Farcaster MiniApp': '🟣',
                                    };
                                    return iconMap[name] || '💼';
                                };
                                
                                // Description for mobile/mini-app
                                const getWalletDescription = (name: string) => {
                                    if (!(isMobile || isInMiniApp)) return null;
                                    const descriptions: Record<string, string> = {
                                        'WalletConnect': '→ Opens MetaMask, Phantom, Rainbow...',
                                        'Coinbase Wallet': '→ Native Base blockchain wallet',
                                        'MetaMask': '→ Opens MetaMask app',
                                        'Phantom': '→ Opens Phantom app',
                                        'Rainbow': '→ Opens Rainbow app',
                                        'Trust Wallet': '→ Opens Trust Wallet app',
                                        'Farcaster MiniApp': '→ Native Warpcast wallet (recommended)',
                                        'Farcaster': '→ Native Warpcast wallet (recommended)',
                                    };
                                    return descriptions[name];
                                };
                                
                                // Determine if this connector is recommended
                                const isFarcasterConnector = connector.name === 'Farcaster' || 
                                                             connector.name === 'Farcaster MiniApp' ||
                                                             connector.id === 'farcaster';
                                const isRecommended = isInMiniApp 
                                    ? isFarcasterConnector  // In mini-app: Farcaster is recommended
                                    : (isMobile && (connector.name === 'WalletConnect' || connector.name === 'Coinbase Wallet'));  // On mobile web: WalletConnect/Coinbase
                                
                                return (
                                    <button
                                        key={connector.id}
                                        onClick={() => {
                                            console.log(`[Wallet] Connecting: ${connector.name} (mobile: ${isMobile}, miniapp: ${isInMiniApp})`);
                                            connect({ connector });
                                            setShowWalletModal(false);
                                        }}
                                        className="w-full px-4 py-3.5 rounded-lg font-mono text-sm flex items-center gap-3 min-h-[56px] transition-all duration-200"
                                        style={{
                                            backgroundColor: isRecommended ? `${MATRIX_GREEN}15` : `${MATRIX_GREEN}08`,
                                            border: `1px solid ${isRecommended ? MATRIX_GREEN : MATRIX_DIM}`,
                                            color: MATRIX_BRIGHT,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = MATRIX_GREEN;
                                            e.currentTarget.style.boxShadow = `0 0 20px ${MATRIX_GREEN}30`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = isRecommended ? MATRIX_GREEN : MATRIX_DIM;
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <span className="text-2xl">{getWalletIcon(connector.name)}</span>
                                        <div className="flex flex-col items-start flex-1">
                                            <span className="flex items-center gap-2">
                                                <span style={{ color: MATRIX_BRIGHT }}>{connector.name}</span>
                                                {isRecommended && (
                                                    <span 
                                                        className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider"
                                                        style={{ 
                                                            backgroundColor: `${MATRIX_GREEN}30`,
                                                            color: MATRIX_GREEN,
                                                        }}
                                                    >
                                                        Recommended
                                                    </span>
                                                )}
                                            </span>
                                            {getWalletDescription(connector.name) && (
                                                <span className="text-[10px]" style={{ color: MATRIX_ACCENT }}>
                                                    {getWalletDescription(connector.name)}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Cancel button */}
                        <div className="p-4 sm:p-6 pt-2">
                            <button
                                onClick={() => setShowWalletModal(false)}
                                className="w-full py-3 rounded-lg font-mono text-sm uppercase tracking-wider transition-all"
                                style={{
                                    backgroundColor: 'transparent',
                                    border: `1px solid ${MATRIX_DIM}`,
                                    color: MATRIX_DIM,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#ff4444';
                                    e.currentTarget.style.color = '#ff6666';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = MATRIX_DIM;
                                    e.currentTarget.style.color = MATRIX_DIM;
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                    </div>
                </div>
            )}
        </div>
    );
}
