'use client';

import { sdk } from '@farcaster/miniapp-sdk';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  custody_address?: string;
}

interface FarcasterContextType {
  isInMiniApp: boolean;
  user: FarcasterUser | null;
  ready: () => void;
  context: {
    user?: FarcasterUser;
    [key: string]: unknown;
  } | null;
}

const FarcasterContext = createContext<FarcasterContextType | null>(null);

export function useFarcasterContext() {
  const context = useContext(FarcasterContext);
  if (!context) {
    throw new Error('useFarcasterContext must be used within a FarcasterMiniAppProvider');
  }
  return context;
}

export function useOptionalFarcasterContext() {
  return useContext(FarcasterContext);
}

interface FarcasterMiniAppProviderProps {
  children: ReactNode;
}

export default function FarcasterMiniAppProvider({
  children,
}: FarcasterMiniAppProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<{
    user?: FarcasterUser;
    [key: string]: unknown;
  } | null>(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        // Skip Farcaster detection entirely for server-side rendering
        if (typeof window === 'undefined') {
          setIsReady(true);
          return;
        }

        const host = window.location.hostname;
        const isProtocolSecure = window.location.protocol === 'https:';
        const devPort = window.location.port;
        const isLocalNetworkHost =
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host.endsWith('.local') ||
          /^192\.168\./.test(host) ||
          /^10\./.test(host) ||
          /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

        const isInIframe = window.parent !== window;

        console.log('[FarcasterMiniAppProvider] host=', host, 'port=', devPort, 'secure=', isProtocolSecure, 'isLocal=', isLocalNetworkHost, 'iframe=', isInIframe);

        const shouldForceMiniAppByQuery = new URLSearchParams(window.location.search).has('miniapp');
        const forceDisableMiniApp = new URLSearchParams(window.location.search).has('noMiniApp');

        console.log('[FarcasterMiniAppProvider] queryParams -> miniapp?', shouldForceMiniAppByQuery, 'noMiniApp?', forceDisableMiniApp);

        if (forceDisableMiniApp) {
          console.log('ℹ️ Forcing desktop mode via ?noMiniApp flag.');
          setIsInMiniApp(false);
          readyRef.current = true;
          setIsReady(true);
          return;
        }

        // For production (mcpvot.xyz), detect environment properly
        // If accessed directly in browser (not in iframe), treat as web app
        if (host === 'mcpvot.xyz' || shouldForceMiniAppByQuery) {
          console.log('ℹ️ Production host detected - checking environment');
          
          try {
            // Enhanced mobile detection for Warpcast app
            const userAgent = navigator.userAgent || '';
            const isWarpcastApp = userAgent.toLowerCase().includes('warpcast');
            
            // Key distinction: Web app vs Mini-app
            // - Web app: Direct browser access (no iframe, no Farcaster referrer)
            // - Mini-app: Inside Warpcast iframe OR has Farcaster referrer OR Warpcast app
            const isFarcasterEnvironment = (isInIframe && (
              document.referrer.includes('warpcast.com') ||
              document.referrer.includes('farcaster.xyz')
            )) || isWarpcastApp;
            
            // Also check URL params that Farcaster mini-apps typically add
            const urlParams = new URLSearchParams(window.location.search);
            const hasFarcasterParams = urlParams.has('fc_frame') || urlParams.has('fid') || urlParams.has('miniapp');
            
            const shouldBeMiniApp = isFarcasterEnvironment || hasFarcasterParams || shouldForceMiniAppByQuery;
            
            console.log('ℹ️ Environment detection:', { 
              isInIframe, 
              referrer: document.referrer,
              isWarpcastApp,
              isFarcasterEnvironment, 
              hasFarcasterParams,
              shouldBeMiniApp 
            });
            
            if (shouldBeMiniApp) {
              setIsInMiniApp(true);
              console.log('[FarcasterMiniAppProvider] Detected Farcaster mini-app environment');
              
              // Try to get user context from Farcaster SDK (only if available)
              try {
                if (typeof sdk?.getMe === 'function') {
                  const user = await sdk.getMe();
                  if (user) {
                    setContext({ user });
                    console.log('[FarcasterMiniAppProvider] Got user from Farcaster SDK:', user);
                  }
                } else {
                  console.log('[FarcasterMiniAppProvider] Farcaster SDK not available in this environment');
                }
              } catch (error) {
                console.warn('[FarcasterMiniAppProvider] Could not get user from Farcaster SDK:', error);
              }
            } else {
              // NOT in Farcaster - treat as standard web app
              setIsInMiniApp(false);
              console.log('[FarcasterMiniAppProvider] Web app mode - not in Farcaster environment');
            }
          } catch (error) {
            console.warn('[FarcasterMiniAppProvider] Error detecting Farcaster environment:', error);
            // Fallback to web mode
            setIsInMiniApp(false);
          }
        } else if (!shouldForceMiniAppByQuery && isLocalNetworkHost && !isInIframe) {
          console.log('ℹ️ Local development host detected — running in standard web mode.');
          setIsInMiniApp(false);
          readyRef.current = true;
          console.log('[FarcasterMiniAppProvider] setIsReady(true) via local web mode');
          setIsReady(true);
          return;
        }

        // Robust Farcaster mini-app detection:
        // 1. Must be in iframe (window.parent !== window)
        // 2. Must have Farcaster SDK context available
        // 3. Context must contain valid user data
        if (isInIframe) {
          try {
            // Then attempt to get Farcaster context (with timeout guard)
            let ctx = null;
            if (sdk?.context) {
              try {
                ctx = await Promise.race([
                  sdk.context,
                  new Promise<null>((_, reject) =>
                    setTimeout(() => reject(new Error('Miniapp context timeout')), 1500)
                  ),
                ]);
              } catch (contextError) {
                console.log('ℹ️ Farcaster context not available:', contextError);
                ctx = null;
              }
            } else {
              console.log('ℹ️ Farcaster SDK context not available in this environment');
              ctx = null;
            }

            console.log('🎯 FarcasterMiniAppProvider: sdk.context resolved', ctx);
            const hasUser = Boolean(ctx?.user?.fid);

            if (hasUser) {
              console.log('✅ Farcaster Mini App context detected with user:', ctx?.user?.fid);
            } else {
              console.log('⚠️ Farcaster context missing user fid, treating as mini-app shell.');
            }

            setIsInMiniApp(true);
            setContext(ctx ?? null);

            // NOTE: sdk.actions.ready() is now called by FarcasterSplashManager
            // after the app is fully rendered, not during initialization
          } catch (sdkError) {
            console.log('ℹ️ SDK initialization failed - not a Farcaster miniapp:', sdkError);
            setIsInMiniApp(false);
          }
        } else {
          console.log('ℹ️ Not in Farcaster mini-app environment (desktop/web)');
          setIsInMiniApp(false);
        }

        readyRef.current = true;
        console.log('✅ FarcasterMiniAppProvider: initialization complete, setting ready state.');
        console.log('[FarcasterMiniAppProvider] setIsReady(true) via initialization completion');
        setIsReady(true);
      } catch (error) {
        console.error('❌ Failed to initialize Mini App:', error);
        setIsInMiniApp(false); // Default to desktop mode on error
        readyRef.current = true;
        console.log('[FarcasterMiniAppProvider] setIsReady(true) via error fallback');
        setIsReady(true);
      }
    };

    const fallbackTimer = setTimeout(() => {
      if (readyRef.current) {
        return;
      }

      console.warn('⚠️ Farcaster mini-app detection timed out, falling back to desktop mode.');
      setIsInMiniApp(false);

      const readyAction = sdk.actions?.ready;
      if (typeof readyAction === 'function') {
        readyAction()
          .then(() => {
            console.log('✅ Farcaster splash dismissed via fallback ready() call.');
          })
          .catch((error: unknown) => {
            console.error('❌ Fallback ready() failed:', error);
          })
          .finally(() => {
            readyRef.current = true;
            console.log('[FarcasterMiniAppProvider] setIsReady(true) via ready() fallback finally');
            setIsReady(true);
          });
      } else {
        console.log('ℹ️ Fallback ready() skipped — no Farcaster actions available in desktop mode.');
        readyRef.current = true;
        console.log('[FarcasterMiniAppProvider] setIsReady(true) via fallback without ready()');
        setIsReady(true);
      }
    }, 2000);

    initializeMiniApp();

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    console.log('[FarcasterMiniAppProvider] isReady state changed ->', isReady, 'isInMiniApp ->', isInMiniApp);
  }, [isReady, isInMiniApp]);

  const ready = useCallback(() => {
    const readyAction = sdk.actions?.ready;
    if (typeof readyAction !== 'function') {
      console.log('ℹ️ Farcaster ready() skipped — sdk.actions.ready is unavailable in this context.');
      return;
    }

    readyAction().catch((error: unknown) => {
      console.warn('⚠️ Farcaster ready() re-signal failed:', error);
    });
  }, []);

  const contextValue: FarcasterContextType = {
    isInMiniApp,
    user: context?.user || null,
    ready,
    context,
  };

  return (
    <FarcasterContext.Provider value={contextValue}>
      {(!isReady && isInMiniApp) && (
        <div className="miniapp-loading" role="status" aria-live="polite">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <p>INITIALIZING MCPVOT...</p>
            <p className="loading-subtitle">Loading Farcaster Mini App</p>
          </div>
          <style jsx>{`
            .miniapp-loading {
              position: fixed;
              inset: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
              color: #00ff41;
              font-family: 'Courier New', monospace;
              z-index: 9999;
              overflow: hidden;
            }
            .miniapp-loading::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 255, 65, 0.1) 2px,
                rgba(0, 255, 65, 0.1) 4px
              );
              animation: scanline 2s linear infinite;
            }
            .loading-spinner {
              text-align: center;
              position: relative;
              z-index: 1;
            }
            .spinner-ring {
              border: 4px solid rgba(0, 255, 65, 0.1);
              border-top-color: #00ff41;
              border-radius: 50%;
              width: 60px;
              height: 60px;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
              box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes scanline {
              0% { transform: translateY(0); }
              100% { transform: translateY(100px); }
            }
            p {
              text-transform: uppercase;
              letter-spacing: 0.2em;
              font-size: 0.875rem;
              margin: 0.5rem 0;
              text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
            }
            .loading-subtitle {
              font-size: 0.75rem !important;
              opacity: 0.7;
              letter-spacing: 0.1em !important;
            }
          `}</style>
        </div>
      )}
      {children}
    </FarcasterContext.Provider>
  );
}



