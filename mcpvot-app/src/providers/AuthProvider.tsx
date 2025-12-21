'use client';

import { AuthKitProvider, useProfile, useSignIn } from '@farcaster/auth-kit';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useFarcasterContext } from './FarcasterMiniAppProvider';

const FARCASTER_CONFIG = {
  relay: 'https://relay.farcaster.xyz',
  rpcUrl: 'https://mainnet.base.org',
  domain: 'mcpvot.xyz',
  siweUri: 'https://mcpvot.xyz',
};

interface AuthState {
  method: 'farcaster' | 'wallet' | 'none';
  user: FarcasterUser | WalletUser | AuthKitProfile | null;
  address?: string;
  fid?: number;
  username?: string;
  basename?: string;
}

interface FarcasterUser {
  fid: number;
  username?: string;
  custody_address?: string;
}

interface AuthKitProfile {
  fid?: number;
  pfpUrl?: string;
  username?: string;
  displayName?: string;
  bio?: string;
  custody?: `0x${string}`;
  verifications?: string[];
}

interface WalletUser {
  address: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthKitProvider config={FARCASTER_CONFIG}>
      <AuthContent>{children}</AuthContent>
    </AuthKitProvider>
  );
}

function AuthContent({ children }: { children: ReactNode }) {
  const farcasterContext = useFarcasterContext();
  const { address: walletAddress } = useAccount();
  const { isSuccess } = useSignIn({});
  const { profile } = useProfile();

  const computedAuthState = useMemo(() => {
    // Priority 1: Check if running inside Farcaster Mini App
    if (farcasterContext?.user) {
      return {
        method: 'farcaster' as const,
        user: farcasterContext.user,
        fid: farcasterContext.user.fid,
        username: farcasterContext.user.username,
        address: farcasterContext.user.custody_address,
      };
    }

    // Priority 2: Check if user signed in with AuthKit
    if (isSuccess && profile) {
      return {
        method: 'farcaster' as const,
        user: profile,
        fid: profile.fid,
        username: profile.username,
        address: profile.custody,
      };
    }

    // Priority 3: Check if wallet is connected
    if (walletAddress) {
      return {
        method: 'wallet' as const,
        user: { address: walletAddress },
        address: walletAddress,
      };
    }

    // No authentication
    return {
      method: 'none' as const,
      user: null,
    };
  }, [farcasterContext, isSuccess, profile, walletAddress]);

  const [authState, setAuthState] = useState<AuthState>(computedAuthState);

  useEffect(() => {
    setAuthState(computedAuthState);
  }, [computedAuthState]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

import { createContext, useContext } from 'react';

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  return useContext(AuthContext);
}
