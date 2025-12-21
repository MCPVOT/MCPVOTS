'use client';

import { useOptionalFarcasterContext } from '@/providers/FarcasterMiniAppProvider';
import { useCallback, useEffect, useState } from 'react';

// =============================================================================
// ADAPTIVE UI HOOK - Multi-Platform Support
// =============================================================================
// Detects and adapts UI for:
// - Farcaster Mini App (Warpcast)
// - Base Mobile App
// - Desktop Web App
// - PWA Mode
// =============================================================================

export type PlatformType = 'farcaster-mini' | 'base-mobile' | 'web-desktop' | 'web-mobile' | 'pwa';
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AdaptiveUIState {
  // Platform detection
  platform: PlatformType;
  isInMiniApp: boolean;
  isInFarcaster: boolean;
  isMobile: boolean;
  isPWA: boolean;
  
  // Screen dimensions
  screenSize: ScreenSize;
  width: number;
  height: number;
  isPortrait: boolean;
  
  // Safe areas (for notches, rounded corners)
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Interaction modes
  hasTouchSupport: boolean;
  hasHoverSupport: boolean;
  prefersReducedMotion: boolean;
  
  // Adaptive sizing
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // Component configs
  modalMaxHeight: string;
  cardPadding: string;
  buttonHeight: string;
  headerHeight: string;
  bottomNavHeight: string;
}

// Breakpoints matching Tailwind defaults
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Default safe area insets (will be overridden by CSS env vars)
const DEFAULT_SAFE_AREA = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

export function useAdaptiveUI(): AdaptiveUIState {
  const farcasterContext = useOptionalFarcasterContext();
  
  const [state, setState] = useState<AdaptiveUIState>(() => getDefaultState());
  
  // Detect platform and screen characteristics
  const detectPlatform = useCallback((): PlatformType => {
    if (typeof window === 'undefined') return 'web-desktop';
    
    // Check Farcaster mini-app
    if (farcasterContext?.isInMiniApp) {
      return 'farcaster-mini';
    }
    
    // Check URL params for platform hints
    const params = new URLSearchParams(window.location.search);
    if (params.has('miniapp') || params.has('farcaster')) {
      return 'farcaster-mini';
    }
    
    // Check for Base mobile app (web view detection)
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('base-wallet') || params.has('base-mobile')) {
      return 'base-mobile';
    }
    
    // Check PWA mode
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isPWA) {
      return 'pwa';
    }
    
    // Mobile vs Desktop web
    const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isMobileWidth = window.innerWidth < BREAKPOINTS.md;
    
    return (isMobileDevice || isMobileWidth) ? 'web-mobile' : 'web-desktop';
  }, [farcasterContext?.isInMiniApp]);
  
  // Get screen size category
  const getScreenSize = useCallback((width: number): ScreenSize => {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }, []);
  
  // Get safe area insets from CSS environment variables
  const getSafeAreaInsets = useCallback(() => {
    if (typeof window === 'undefined') return DEFAULT_SAFE_AREA;
    
    const computedStyle = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(computedStyle.getPropertyValue('--sat') || '0') || 
           parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0') || 0,
      bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0') ||
              parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0') || 0,
      left: parseInt(computedStyle.getPropertyValue('--sal') || '0') ||
            parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0') || 0,
      right: parseInt(computedStyle.getPropertyValue('--sar') || '0') ||
             parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0') || 0,
    };
  }, []);
  
  // Calculate adaptive sizes based on platform and screen
  const calculateSizes = useCallback((platform: PlatformType, screenSize: ScreenSize, height: number) => {
    const isMiniApp = platform === 'farcaster-mini' || platform === 'base-mobile';
    const isCompact = screenSize === 'xs' || screenSize === 'sm';
    
    // Adaptive font sizes
    const fontSize = {
      xs: isMiniApp ? '10px' : isCompact ? '11px' : '12px',
      sm: isMiniApp ? '12px' : isCompact ? '13px' : '14px',
      base: isMiniApp ? '14px' : isCompact ? '15px' : '16px',
      lg: isMiniApp ? '16px' : isCompact ? '17px' : '18px',
      xl: isMiniApp ? '18px' : isCompact ? '20px' : '24px',
    };
    
    // Adaptive spacing
    const spacing = {
      xs: isMiniApp ? '4px' : '8px',
      sm: isMiniApp ? '8px' : '12px',
      md: isMiniApp ? '12px' : '16px',
      lg: isMiniApp ? '16px' : '24px',
      xl: isMiniApp ? '20px' : '32px',
    };
    
    // Component-specific sizes
    const headerHeight = isMiniApp ? '48px' : isCompact ? '56px' : '64px';
    const bottomNavHeight = isMiniApp ? '56px' : '64px';
    const buttonHeight = isMiniApp ? '44px' : isCompact ? '48px' : '52px';
    const cardPadding = isMiniApp ? '12px' : isCompact ? '16px' : '20px';
    
    // Modal max height (leave room for keyboard on mobile)
    const modalMaxHeight = isMiniApp 
      ? `${Math.min(height - 100, 500)}px`
      : isCompact 
        ? `${height - 120}px`
        : '80vh';
    
    return {
      fontSize,
      spacing,
      headerHeight,
      bottomNavHeight,
      buttonHeight,
      cardPadding,
      modalMaxHeight,
    };
  }, []);
  
  // Update state on window resize and initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const platform = detectPlatform();
      const screenSize = getScreenSize(width);
      const safeAreaInsets = getSafeAreaInsets();
      const sizes = calculateSizes(platform, screenSize, height);
      
      const isMiniApp = platform === 'farcaster-mini' || platform === 'base-mobile';
      const isMobile = platform === 'web-mobile' || isMiniApp;
      
      setState({
        platform,
        isInMiniApp: isMiniApp,
        isInFarcaster: platform === 'farcaster-mini',
        isMobile,
        isPWA: platform === 'pwa',
        screenSize,
        width,
        height,
        isPortrait: height > width,
        safeAreaInsets,
        hasTouchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        hasHoverSupport: window.matchMedia('(hover: hover)').matches,
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        ...sizes,
      });
    };
    
    // Initial update
    updateState();
    
    // Listen for resize
    window.addEventListener('resize', updateState);
    
    // Listen for orientation change
    window.addEventListener('orientationchange', () => {
      // Delay to let browser settle
      setTimeout(updateState, 100);
    });
    
    return () => {
      window.removeEventListener('resize', updateState);
      window.removeEventListener('orientationchange', updateState);
    };
  }, [detectPlatform, getScreenSize, getSafeAreaInsets, calculateSizes, farcasterContext?.isInMiniApp]);
  
  return state;
}

// Default state for SSR
function getDefaultState(): AdaptiveUIState {
  return {
    platform: 'web-desktop',
    isInMiniApp: false,
    isInFarcaster: false,
    isMobile: false,
    isPWA: false,
    screenSize: 'lg',
    width: 1024,
    height: 768,
    isPortrait: false,
    safeAreaInsets: DEFAULT_SAFE_AREA,
    hasTouchSupport: false,
    hasHoverSupport: true,
    prefersReducedMotion: false,
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '24px',
    },
    spacing: {
      xs: '8px',
      sm: '12px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
    modalMaxHeight: '80vh',
    cardPadding: '20px',
    buttonHeight: '52px',
    headerHeight: '64px',
    bottomNavHeight: '64px',
  };
}

// =============================================================================
// UTILITY CLASSES GENERATOR
// =============================================================================

export function getAdaptiveClasses(ui: AdaptiveUIState): {
  container: string;
  card: string;
  button: string;
  text: string;
  heading: string;
  modal: string;
} {
  const base = {
    container: 'w-full mx-auto',
    card: 'rounded-lg border transition-all',
    button: 'font-mono font-bold rounded-lg transition-all active:scale-[0.98]',
    text: 'font-mono',
    heading: 'font-mono font-bold tracking-wider',
    modal: 'bg-black/95 backdrop-blur-sm rounded-xl border overflow-hidden',
  };
  
  if (ui.isInMiniApp) {
    // Farcaster / Base mini app - compact, touch-optimized
    return {
      container: `${base.container} max-w-full px-3`,
      card: `${base.card} p-3 border-[#00FF88]/30 bg-black/80`,
      button: `${base.button} py-3 px-4 min-h-[44px] text-sm`,
      text: `${base.text} text-xs leading-relaxed`,
      heading: `${base.heading} text-base`,
      modal: `${base.modal} max-h-[500px] border-[#00FF88]/40`,
    };
  }
  
  if (ui.isMobile) {
    // Mobile web - slightly larger touch targets
    return {
      container: `${base.container} max-w-lg px-4`,
      card: `${base.card} p-4 border-[#00FF88]/30 bg-black/90`,
      button: `${base.button} py-3.5 px-5 min-h-[48px] text-base`,
      text: `${base.text} text-sm leading-relaxed`,
      heading: `${base.heading} text-lg`,
      modal: `${base.modal} max-h-[80vh] border-[#00FF88]/40`,
    };
  }
  
  // Desktop web - full experience
  return {
    container: `${base.container} max-w-2xl px-6`,
    card: `${base.card} p-5 border-[#00FF88]/30 bg-black/90 hover:border-[#00FF88]/50`,
    button: `${base.button} py-4 px-6 min-h-[52px] text-base hover:shadow-[0_0_30px_rgba(0,255,136,0.3)]`,
    text: `${base.text} text-sm`,
    heading: `${base.heading} text-xl`,
    modal: `${base.modal} max-h-[80vh] border-[#00FF88]/40 hover:border-[#00FF88]/60`,
  };
}

export default useAdaptiveUI;
