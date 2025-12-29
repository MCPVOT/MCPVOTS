'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    usePlatform - Platform Detection Hook                      ║
 * ║                                                                               ║
 * ║  Comprehensive detection for:                                                 ║
 * ║  ✅ Mobile vs Desktop                                                         ║
 * ║  ✅ Farcaster Mini-App (Warpcast)                                             ║
 * ║  ✅ Coinbase Wallet App                                                       ║
 * ║  ✅ In-App Browser (MetaMask, Trust, etc.)                                    ║
 * ║  ✅ PWA / Standalone mode                                                     ║
 * ║  ✅ Return from wallet deep link                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { useCallback, useEffect, useState } from 'react';

export interface PlatformInfo {
  // Device type
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Operating system
  isIOS: boolean;
  isAndroid: boolean;
  
  // Browser/App context
  isInMiniApp: boolean;         // Inside Farcaster Mini-App
  isWarpcastApp: boolean;       // Inside Warpcast native app
  isCoinbaseApp: boolean;       // Inside Coinbase Wallet app
  isInAppBrowser: boolean;      // Inside any wallet's in-app browser
  isPWA: boolean;               // Installed as PWA
  
  // Touch capability
  hasTouch: boolean;
  
  // Screen info
  screenWidth: number;
  screenHeight: number;
  
  // Connection state tracking
  isReturningFromWallet: boolean;
  
  // Derived helpers
  shouldUseBottomSheet: boolean;
  shouldShowMobileUI: boolean;
  walletAppName: string | null;
}

const DEFAULT_PLATFORM: PlatformInfo = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isIOS: false,
  isAndroid: false,
  isInMiniApp: false,
  isWarpcastApp: false,
  isCoinbaseApp: false,
  isInAppBrowser: false,
  isPWA: false,
  hasTouch: false,
  screenWidth: 1920,
  screenHeight: 1080,
  isReturningFromWallet: false,
  shouldUseBottomSheet: false,
  shouldShowMobileUI: false,
  walletAppName: null,
};

export function usePlatform(): PlatformInfo {
  const [platform, setPlatform] = useState<PlatformInfo>(DEFAULT_PLATFORM);
  
  // Track if we're returning from a wallet app
  const [returnFromWallet, setReturnFromWallet] = useState(false);
  
  // Check for wallet return via visibility API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to the app - might be from wallet
        const lastWalletOpen = sessionStorage.getItem('mcpvot_wallet_opened');
        if (lastWalletOpen) {
          const timeSinceOpen = Date.now() - parseInt(lastWalletOpen, 10);
          // If less than 5 minutes, assume returning from wallet
          if (timeSinceOpen < 300000) {
            console.log('[Platform] User returned from wallet app');
            setReturnFromWallet(true);
            // Clear after 5 seconds
            setTimeout(() => setReturnFromWallet(false), 5000);
          }
          sessionStorage.removeItem('mcpvot_wallet_opened');
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Main detection logic
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const detectPlatform = () => {
      const userAgent = navigator.userAgent || '';
      
      // ===== Device Type Detection =====
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i;
      const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;
      
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const screenWidth = window.innerWidth || window.screen.width;
      const screenHeight = window.innerHeight || window.screen.height;
      const isSmallScreen = screenWidth < 768;
      const isMediumScreen = screenWidth >= 768 && screenWidth < 1024;
      
      const isMobile = mobileRegex.test(userAgent) || (hasTouch && isSmallScreen);
      const isTablet = tabletRegex.test(userAgent) || (hasTouch && isMediumScreen);
      const isDesktop = !isMobile && !isTablet;
      
      // ===== OS Detection =====
      const isIOS = /iPhone|iPad|iPod/.test(userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/.test(userAgent);
      
      // ===== App Context Detection =====
      const isInIframe = window.parent !== window;
      
      // Warpcast/Farcaster detection
      const isWarpcastApp = userAgent.toLowerCase().includes('warpcast');
      const hasFarcasterReferrer = document.referrer.includes('warpcast') || 
                                   document.referrer.includes('farcaster');
      const urlParams = new URLSearchParams(window.location.search);
      const hasFarcasterParams = urlParams.has('fc_frame') || 
                                 urlParams.has('fid') || 
                                 urlParams.has('miniapp');
      
      const isInMiniApp = isWarpcastApp || 
                          (isInIframe && hasFarcasterReferrer) || 
                          hasFarcasterParams;
      
      // Coinbase Wallet detection
      const isCoinbaseApp = userAgent.includes('CoinbaseWallet') || 
                            userAgent.includes('Coinbase/') ||
                            (window as unknown as {ethereum?: {isCoinbaseWallet?: boolean}}).ethereum?.isCoinbaseWallet === true;
      
      // In-app browser detection (MetaMask, Trust, Phantom, etc.)
      const ethereum = (window as unknown as {ethereum?: {isMetaMask?: boolean; isTrust?: boolean; isPhantom?: boolean; isCoinbaseWallet?: boolean}}).ethereum;
      const isMetaMaskInApp = userAgent.includes('MetaMaskMobile') || 
                              (ethereum?.isMetaMask && !ethereum?.isCoinbaseWallet);
      const isTrustInApp = userAgent.includes('Trust/') || ethereum?.isTrust;
      const isPhantomInApp = ethereum?.isPhantom;
      
      const isInAppBrowser = isMetaMaskInApp || isTrustInApp || isPhantomInApp || isCoinbaseApp;
      
      // Detect wallet app name
      let walletAppName: string | null = null;
      if (isWarpcastApp) walletAppName = 'Warpcast';
      else if (isCoinbaseApp) walletAppName = 'Coinbase Wallet';
      else if (isMetaMaskInApp) walletAppName = 'MetaMask';
      else if (isTrustInApp) walletAppName = 'Trust Wallet';
      else if (isPhantomInApp) walletAppName = 'Phantom';
      
      // PWA detection
      const isPWA = ('standalone' in window.navigator && (window.navigator as {standalone?: boolean}).standalone) ||
                    window.matchMedia('(display-mode: standalone)').matches;
      
      // ===== Derived Helpers =====
      const shouldUseBottomSheet = isMobile || isTablet || isInMiniApp;
      const shouldShowMobileUI = isMobile || isInMiniApp || isInAppBrowser;
      
      setPlatform({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isInMiniApp,
        isWarpcastApp,
        isCoinbaseApp,
        isInAppBrowser,
        isPWA,
        hasTouch,
        screenWidth,
        screenHeight,
        isReturningFromWallet: returnFromWallet,
        shouldUseBottomSheet,
        shouldShowMobileUI,
        walletAppName,
      });
      
      console.log('[Platform] Detected:', {
        device: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        os: isIOS ? 'iOS' : isAndroid ? 'Android' : 'other',
        context: isInMiniApp ? 'mini-app' : isInAppBrowser ? 'in-app-browser' : 'web',
        walletAppName,
        screenWidth,
      });
    };
    
    detectPlatform();
    
    // Re-detect on resize and orientation change
    window.addEventListener('resize', detectPlatform);
    window.addEventListener('orientationchange', detectPlatform);
    
    return () => {
      window.removeEventListener('resize', detectPlatform);
      window.removeEventListener('orientationchange', detectPlatform);
    };
  }, [returnFromWallet]);
  
  return platform;
}

/**
 * Mark that we're opening a wallet app (for return detection)
 */
export function markWalletOpened() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('mcpvot_wallet_opened', Date.now().toString());
}

/**
 * Hook to get platform-aware button styles
 */
export function usePlatformStyles() {
  const platform = usePlatform();
  
  const getButtonSize = useCallback(() => {
    if (platform.isMobile || platform.isInMiniApp) {
      return 'min-h-[56px] text-base'; // Larger touch targets on mobile
    }
    return 'min-h-[44px] text-sm';
  }, [platform]);
  
  const getModalStyle = useCallback(() => {
    if (platform.shouldUseBottomSheet) {
      return 'items-end'; // Bottom sheet on mobile
    }
    return 'items-center'; // Centered modal on desktop
  }, [platform]);
  
  return {
    platform,
    getButtonSize,
    getModalStyle,
  };
}

export default usePlatform;
