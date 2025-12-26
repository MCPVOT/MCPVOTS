'use client';

import { useProfile } from '@farcaster/auth-kit';
import { createContext, useContext, useSyncExternalStore } from 'react';

interface FarcasterIdentityContextType {
  isAuthenticated: boolean;
  fid: number | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}

const FarcasterIdentityContext = createContext<FarcasterIdentityContextType | null>(null);

// Default state for when auth-kit is not ready
const defaultState: FarcasterIdentityContextType = {
  isAuthenticated: false,
  fid: null,
  username: null,
  displayName: null,
  pfpUrl: null,
};

// SSR-safe hook to check if we're mounted
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function FarcasterIdentityProviderInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profile } = useProfile();

  return (
    <FarcasterIdentityContext.Provider
      value={{
        isAuthenticated,
        fid: profile?.fid || null,
        username: profile?.username || null,
        displayName: profile?.displayName || profile?.username || null,
        pfpUrl: null,
      }}
    >
      {children}
    </FarcasterIdentityContext.Provider>
  );
}

export function FarcasterIdentityProvider({ children }: { children: React.ReactNode }) {
  const isMounted = useIsMounted();

  // During SSR or before mount, provide default values
  if (!isMounted) {
    return (
      <FarcasterIdentityContext.Provider value={defaultState}>
        {children}
      </FarcasterIdentityContext.Provider>
    );
  }

  // After mount, use the actual auth-kit hook
  return <FarcasterIdentityProviderInner>{children}</FarcasterIdentityProviderInner>;
}

export function useFarcasterIdentity() {
  const context = useContext(FarcasterIdentityContext);
  if (!context) {
    // Return default state instead of throwing during SSR
    return defaultState;
  }
  return context;
}
