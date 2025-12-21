'use client';

import { useProfile } from '@farcaster/auth-kit';
import { createContext, useContext } from 'react';

interface FarcasterIdentityContextType {
  isAuthenticated: boolean;
  fid: number | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}

const FarcasterIdentityContext = createContext<FarcasterIdentityContextType | null>(null);

export function FarcasterIdentityProvider({ children }: { children: React.ReactNode }) {
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

export function useFarcasterIdentity() {
  const context = useContext(FarcasterIdentityContext);
  if (!context) {
    throw new Error('useFarcasterIdentity must be used within FarcasterIdentityProvider');
  }
  return context;
}
