/**
 * Beeper Identity Service
 * 
 * Fetches and aggregates user identity data from:
 * - Farcaster (via Neynar API)
 * - ENS (via Ethereum RPC / OnchainKit)
 * - Basenames (via Base RPC / OnchainKit)
 */

import { resolveBaseName } from '@/lib/baseNameUtils';
import { createPublicClient, http } from 'viem';
import { base, mainnet } from 'viem/chains';
import type { BeeperUserData } from './banner-generator';

// Neynar API for Farcaster data
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || '';
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2';

// Viem clients for blockchain queries
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.MAINNET_RPC_URL || 'https://eth.llamarpc.com'),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
  following_count: number;
  verifications: string[];
  active_status: string;
}

interface NeynarUserResponse {
  users: FarcasterUser[];
}

/**
 * Fetch Farcaster user data by FID
 */
export async function fetchFarcasterUser(fid: number): Promise<FarcasterUser | null> {
  if (!NEYNAR_API_KEY) {
    console.warn('[BeeperIdentity] Neynar API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        'api_key': NEYNAR_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[BeeperIdentity] Neynar API error:', response.status);
      return null;
    }

    const data: NeynarUserResponse = await response.json();
    return data.users?.[0] || null;
  } catch (error) {
    console.error('[BeeperIdentity] Failed to fetch Farcaster user:', error);
    return null;
  }
}

/**
 * Fetch Farcaster user by wallet address (reverse lookup)
 * Uses Neynar's bulk-by-address endpoint
 */
export async function fetchFarcasterUserByAddress(address: string): Promise<FarcasterUser | null> {
  if (!NEYNAR_API_KEY) {
    console.warn('[BeeperIdentity] Neynar API key not configured');
    return null;
  }

  try {
    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();
    
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/user/bulk-by-address?addresses=${normalizedAddress}`,
      {
        headers: {
          'api_key': NEYNAR_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[BeeperIdentity] Neynar bulk-by-address error:', response.status);
      return null;
    }

    const data = await response.json();
    
    // Response format: { [address]: [user1, user2, ...] }
    // Get first user associated with this address
    const users = data[normalizedAddress] || data[address];
    
    if (users && users.length > 0) {
      console.log(`[BeeperIdentity] Found Farcaster user by address: @${users[0].username} (FID: ${users[0].fid})`);
      return users[0];
    }
    
    return null;
  } catch (error) {
    console.error('[BeeperIdentity] Failed to fetch Farcaster user by address:', error);
    return null;
  }
}

/**
 * Fetch Farcaster user by username
 */
export async function fetchFarcasterUserByUsername(username: string): Promise<FarcasterUser | null> {
  if (!NEYNAR_API_KEY) {
    console.warn('[BeeperIdentity] Neynar API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${NEYNAR_BASE_URL}/farcaster/user/by_username?username=${username}`, {
      headers: {
        'api_key': NEYNAR_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[BeeperIdentity] Neynar API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('[BeeperIdentity] Failed to fetch Farcaster user by username:', error);
    return null;
  }
}

/**
 * Fetch ENS name for address (Ethereum mainnet)
 * Uses viem's getEnsName for reliable reverse resolution
 */
export async function fetchEnsName(address: string): Promise<string | null> {
  try {
    // Primary: Use viem's ENS reverse resolution
    const ensName = await mainnetClient.getEnsName({
      address: address as `0x${string}`,
    });
    
    if (ensName) {
      console.log('[BeeperIdentity] Found ENS name via viem:', ensName);
      return ensName;
    }

    // Fallback: Use ensideas API
    const response = await fetch(
      `https://api.ensideas.com/ens/resolve/${address}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.name || null;
  } catch (error) {
    console.error('[BeeperIdentity] Failed to fetch ENS name:', error);
    return null;
  }
}

/**
 * Fetch Basename for address (Base L2)
 * Uses multiple resolution methods for reliability
 */
export async function fetchBasename(address: string): Promise<string | null> {
  try {
    console.log('[BeeperIdentity] Basename lookup for:', address.slice(0, 10));
    
    // Method 1: Use resolveBaseName from baseNameUtils (most reliable)
    const basename = await resolveBaseName(address as `0x${string}`);
    
    if (basename) {
      console.log('[BeeperIdentity] Found Basename:', basename);
      return basename;
    }
    
    // Method 2: Direct L2Resolver query via viem
    try {
      const L2_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' as const;
      const REVERSE_REGISTRAR = '0x79EA96012eEa67A83431F1701B3dFf7e37F9E282' as const;
      
      // Get the node for this address
      const node = await baseClient.readContract({
        address: REVERSE_REGISTRAR,
        abi: [{ name: 'node', type: 'function', stateMutability: 'pure', inputs: [{ name: 'addr', type: 'address' }], outputs: [{ name: '', type: 'bytes32' }] }],
        functionName: 'node',
        args: [address as `0x${string}`],
      });
      
      if (node) {
        // Resolve the name
        const name = await baseClient.readContract({
          address: L2_RESOLVER,
          abi: [{ name: 'name', type: 'function', stateMutability: 'view', inputs: [{ name: 'node', type: 'bytes32' }], outputs: [{ name: '', type: 'string' }] }],
          functionName: 'name',
          args: [node],
        });
        
        if (name && typeof name === 'string' && name.length > 0) {
          console.log('[BeeperIdentity] Found Basename via direct RPC:', name);
          return name;
        }
      }
    } catch (rpcError) {
      console.log('[BeeperIdentity] Direct RPC basename lookup failed:', rpcError);
    }

    return null;
  } catch (error) {
    console.error('[BeeperIdentity] Failed to fetch Basename:', error);
    return null;
  }
}

/**
 * Aggregate all identity data for a user
 * Enhanced: Now tries to look up FID from wallet address if FID not provided
 */
export async function fetchBeeperUserData(
  fid: number,
  walletAddress?: string
): Promise<BeeperUserData | null> {
  let farcasterUser: FarcasterUser | null = null;
  
  // Priority 1: If we have a valid FID, fetch Farcaster data by FID
  if (fid && fid > 0) {
    farcasterUser = await fetchFarcasterUser(fid);
    
    if (!farcasterUser) {
      console.warn('[BeeperIdentity] Could not find Farcaster user for FID:', fid);
      // Don't return null - continue with wallet-only mode
    }
  }
  
  // Priority 2: If no FID but have wallet address, try reverse lookup
  if (!farcasterUser && walletAddress) {
    console.log('[BeeperIdentity] No FID provided, attempting wallet address lookup...');
    farcasterUser = await fetchFarcasterUserByAddress(walletAddress);
    
    if (farcasterUser) {
      console.log(`[BeeperIdentity] Found Farcaster via address lookup: @${farcasterUser.username} FID:${farcasterUser.fid}`);
    }
  }

  // Get wallet address from Farcaster verification or use provided
  const address = walletAddress || farcasterUser?.verifications?.[0] || '';
  
  if (!address) {
    console.error('[BeeperIdentity] No wallet address found');
    return null;
  }

  // Fetch ENS and Basename in parallel
  const [ensName, basename] = await Promise.all([
    fetchEnsName(address),
    fetchBasename(address),
  ]);

  // Build user data - use Farcaster if available, otherwise use wallet info
  const userData: BeeperUserData = {
    address,
    fid: farcasterUser?.fid || fid || 0,
    farcasterUsername: farcasterUser?.username || `user_${address.slice(2, 8).toLowerCase()}`,
    farcasterDisplayName: farcasterUser?.display_name || ensName || basename || `Wallet ${address.slice(0, 6)}`,
    farcasterPfpUrl: farcasterUser?.pfp_url || '',
    farcasterFollowers: farcasterUser?.follower_count || 0,
    ensName: ensName || undefined,
    basename: basename || undefined,
  };

  console.log('[BeeperIdentity] Fetched user data:', {
    fid: userData.fid,
    username: userData.farcasterUsername,
    address: `${address.slice(0, 6)}...${address.slice(-4)}`,
    hasEns: !!ensName,
    hasBasename: !!basename,
    hasFarcaster: !!farcasterUser,
  });

  return userData;
}

/**
 * Validate FID eligibility for mint
 */
export async function validateFidEligibility(fid: number): Promise<{
  eligible: boolean;
  reason?: string;
  userData?: BeeperUserData;
}> {
  if (!fid || fid <= 0) {
    return { eligible: false, reason: 'Invalid FID' };
  }

  // Fetch user data
  const userData = await fetchBeeperUserData(fid);
  
  if (!userData) {
    return { eligible: false, reason: 'Could not verify Farcaster identity' };
  }

  if (!userData.address) {
    return { eligible: false, reason: 'No verified wallet address found' };
  }

  // TODO: Check on-chain if FID already minted
  // This would query the BeeperPromoNFT contract's hasMinted mapping

  return { eligible: true, userData };
}

const beeperIdentityService = {
  fetchFarcasterUser,
  fetchFarcasterUserByUsername,
  fetchFarcasterUserByAddress,
  fetchEnsName,
  fetchBasename,
  fetchBeeperUserData,
  validateFidEligibility,
};

export default beeperIdentityService;
