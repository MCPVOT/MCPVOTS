'use client';

import { useCallback, useState } from 'react';
import { formatEther, parseEther } from 'viem';
import { useAccount, useWalletClient } from 'wagmi';

// x402 Facilitator address for VOT gasless transactions
const X402_FACILITATOR_ADDRESS = '0x6CA6d1e2D5347Bfab1d91e883F1915560e09129D';

interface DelegationPermission {
  id: string;
  type: string;
  granted: boolean;
  data: {
    userAddress: string;
    delegateAddress: string;
    chainId: number;
    allowance: string;
    expiration: number;
  };
}

interface EIP7715Response {
  permissions: DelegationPermission[];
  session: {
    duration: number;
    createdAt: number;
  };
  eip7702AuthData?: {
    chainId: number;
    delegateAddress: string;
    signatureRequest: unknown;
  };
}

export function EIP7715DelegationPanel() {
  const { address, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePermission, setActivePermission] = useState<DelegationPermission | null>(null);
  const [allowanceEth, setAllowanceEth] = useState('0.01');
  const [durationHours, setDurationHours] = useState('24');

  const grantPermission = useCallback(async () => {
    if (!address || !walletClient) {
      setError('Connect wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, try native ERC-7715 if wallet supports it (MetaMask Flask)
      const hasNativeSupport = await checkNativeERC7715Support();
      
      if (hasNativeSupport) {
        // Use wallet's native wallet_grantPermissions
        const result = await requestNativePermission(address, allowanceEth, durationHours);
        if (result) {
          setActivePermission(result);
          return;
        }
      }

      // Fallback to our JSON-RPC endpoint
      const response = await fetch('/api/eip7715/grant-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'wallet_grantPermissions',
          params: {
            userAddress: address,
            delegateAddress: X402_FACILITATOR_ADDRESS,
            chainId: chain?.id || 8453,
            allowance: `0x${parseEther(allowanceEth).toString(16)}`,
            expiration: Math.floor(Date.now() / 1000) + (parseInt(durationHours) * 3600),
            permissionType: 'contract-execution',
          },
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const permission = data.result.permissions[0];
      setActivePermission(permission);

      // If we got EIP-7702 auth data, prompt user to sign
      if (data.result.eip7702AuthData) {
        await signDelegation(data.result.eip7702AuthData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant permission');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, walletClient, allowanceEth, durationHours, chain]);

  const revokePermission = useCallback(async () => {
    if (!activePermission) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/eip7715/grant-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'wallet_revokePermissions',
          params: {
            permissionId: activePermission.id,
          },
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      setActivePermission(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke permission');
    } finally {
      setIsLoading(false);
    }
  }, [activePermission]);

  const checkNativeERC7715Support = useCallback(async (): Promise<boolean> => {
    try {
      // Check if MetaMask Flask with Gator Permissions
      const provider = window.ethereum as { request?: (args: { method: string }) => Promise<unknown> } | undefined;
      if (!provider?.request) return false;
      
      const result = await provider.request({
        method: 'wallet_getCapabilities',
      }) as Record<string, { permissions?: boolean }> | null;
      
      // Check if permissions capability exists
      return result && Object.values(result).some(cap => cap?.permissions);
    } catch {
      return false;
    }
  }, []);

  const requestNativePermission = useCallback(async (
    userAddress: string,
    allowance: string,
    duration: string
  ): Promise<DelegationPermission | null> => {
    try {
      const provider = window.ethereum as { request?: (args: { method: string; params: unknown[] }) => Promise<unknown> } | undefined;
      if (!provider?.request) return null;

      const result = await provider.request({
        method: 'wallet_grantPermissions',
        params: [{
          permissions: [{
            type: 'contract-execution',
            data: {
              address: userAddress,
              delegateAddress: X402_FACILITATOR_ADDRESS,
              chainId: chain?.id || 8453,
              allowance: parseEther(allowance).toString(),
              expiration: Math.floor(Date.now() / 1000) + (parseInt(duration) * 3600),
            },
          }],
        }],
      }) as EIP7715Response;

      return result.permissions[0];
    } catch (err) {
      console.log('Native ERC-7715 not available, using fallback:', err);
      return null;
    }
  }, [chain?.id]);

  const signDelegation = useCallback(async (authData: { signatureRequest: unknown }) => {
    if (!walletClient) return;

    try {
      // Sign the EIP-712 typed data for delegation
      const signature = await walletClient.signTypedData(authData.signatureRequest as Parameters<typeof walletClient.signTypedData>[0]);
      console.log('Delegation signed:', signature);
      
      // Store signature for later use in Type 4 transactions
      if (activePermission) {
        localStorage.setItem(`delegation_sig_${activePermission.id}`, signature);
      }
    } catch (err) {
      console.error('Failed to sign delegation:', err);
    }
  }, [walletClient, activePermission]);

  const formatExpiration = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl p-6 border border-purple-500/30">
        <h3 className="text-lg font-bold text-white mb-4">🔗 EIP-7702 Delegation</h3>
        <p className="text-gray-400 text-sm">Connect wallet to enable gasless VOT transactions via delegation.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl p-6 border border-purple-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          🔗 EIP-7702 Delegation
          <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full">
            ERC-7715
          </span>
        </h3>
        {activePermission && (
          <span className="text-xs bg-green-600/30 text-green-300 px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>

      <p className="text-gray-400 text-sm mb-4">
        Grant permission to x402 facilitator for gasless VOT transactions. 
        Not locked to MetaMask—portable to any ERC-7715 wallet.
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {activePermission ? (
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Permission ID</span>
              <span className="text-white font-mono text-xs">
                {activePermission.id.slice(0, 16)}...
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Delegate</span>
              <span className="text-purple-300 font-mono text-xs">
                {activePermission.data.delegateAddress.slice(0, 10)}...
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Allowance</span>
              <span className="text-green-300">
                {formatEther(BigInt(activePermission.data.allowance))} ETH
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Expires</span>
              <span className="text-yellow-300">
                {formatExpiration(activePermission.data.expiration)}
              </span>
            </div>
          </div>

          <button
            onClick={revokePermission}
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 font-semibold transition-all border border-red-500/30 disabled:opacity-50"
          >
            {isLoading ? 'Revoking...' : 'Revoke Permission'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Max Allowance (ETH)</label>
              <input
                type="number"
                value={allowanceEth}
                onChange={(e) => setAllowanceEth(e.target.value)}
                step="0.001"
                min="0.001"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Duration (hours)</label>
              <input
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                min="1"
                max="168"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-3">
            <p className="text-gray-400 text-xs">
              <strong className="text-gray-300">Delegate:</strong>{' '}
              <span className="font-mono">{X402_FACILITATOR_ADDRESS.slice(0, 18)}...</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">
              x402 Facilitator will batch your VOT transactions with zero gas fees.
            </p>
          </div>

          <button
            onClick={grantPermission}
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold transition-all disabled:opacity-50"
          >
            {isLoading ? 'Granting Permission...' : '🔐 Grant Delegation Permission'}
          </button>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <p className="text-gray-500 text-xs">
          Powered by <a href="https://docs.metamask.io/delegation-toolkit" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">MetaMask Delegation Toolkit</a>
        </p>
      </div>
    </div>
  );
}

export default EIP7715DelegationPanel;
