"use client";

/**
 * useEIP7702 - Enhanced Hook for EIP-7702 Account Abstraction on Base
 * 
 * Enables LLM agents to execute transactions on behalf of users
 * via signed authorizations (Pectra upgrade - May 2025)
 * 
 * VOT Glyph: 𒉿𒂊𒋫 (pectra) + 𒁲𒇷 (delegate) + 𒇷𒇷𒈦 (llm)
 * 
 * Features:
 * - Sign EIP-7702 authorization for x402 Facilitator
 * - Store authorization in MCP memory for LLM retrieval
 * - Execute delegated transactions via agent
 * - Batch operations in single transaction
 */

import { useCallback, useState } from 'react';
import { createWalletClient, http } from 'viem';
import { useAccount, useWalletClient } from 'wagmi';
import { base } from 'wagmi/chains';

// x402 Facilitator V2 Contract (TODO: Update after deployment)
const X402_FACILITATOR_ADDRESS = '0x000000000000000000000000000000000000dead' as `0x${string}`;

// VOT Token Contract
const VOT_TOKEN_ADDRESS = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07' as `0x${string}`;

// Treasury (gas sponsor)
const TREASURY_ADDRESS = '0x824ea259D42cC35B95E04f87a9D9C7f2ECf4E7fa' as `0x${string}`;

interface EIP7702Config {
    chainId?: number;
    rpcUrl?: string;
    bundlerUrl?: string;
}

interface AuthorizationData {
    chainId: bigint;
    address: `0x${string}`;
    nonce: number;
    signature?: `0x${string}`;
}

interface EIP7702Transaction {
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
    gas?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
}

export function useEIP7702(config: EIP7702Config = {}) {
    const { chainId = 8453, rpcUrl = 'https://mainnet.base.org' } = config;
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Smart Wallet Factory Address on Base
    const FACTORY_ADDRESS = '0x000100abaad02f1cfC8Bbe32bD5a564817339E72' as `0x${string}`;
    
    // Create a Base-compatible wallet client
    const createBaseWalletClient = useCallback(async () => {
        if (!walletClient) {
            throw new Error('No wallet client available');
        }

        return createWalletClient({
            chain: base,
            transport: http(rpcUrl),
            account: walletClient.account,
        });
    }, [walletClient, rpcUrl]);

    // Sign EIP-7702 authorization
    const signAuthorization = useCallback(async (
        delegateAddress: `0x${string}`,
        nonce?: number
    ): Promise<AuthorizationData> => {
        try {
            if (!walletClient?.account) {
                throw new Error('No wallet account available');
            }

            const currentNonce = nonce ?? await walletClient.getNonce({ address });
            
            const authorization = {
                chainId: BigInt(chainId),
                address: delegateAddress,
                nonce: currentNonce,
            };

            // Sign the authorization message
            const signature = await walletClient.signTypedData({
                domain: {
                    name: 'EIP-7702 Authorization',
                    version: '1',
                    chainId: chainId,
                    verifyingContract: delegateAddress,
                },
                types: {
                    Authorization: [
                        { name: 'chainId', type: 'uint256' },
                        { name: 'address', type: 'address' },
                        { name: 'nonce', type: 'uint256' },
                    ],
                },
                primaryType: 'Authorization',
                message: authorization,
            });

            return {
                ...authorization,
                signature,
            };
        } catch (err) {
            console.error('Failed to sign authorization:', err);
            throw err;
        }
    }, [walletClient, chainId, address]);

    // Execute EIP-7702 transaction
    const executeEIP7702Transaction = useCallback(async (
        tx: EIP7702Transaction,
        delegateAddress: `0x${string}`
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            if (!walletClient?.account) {
                throw new Error('No wallet account available');
            }

            // Sign authorization
            const authorization = await signAuthorization(delegateAddress);

            // Create Base wallet client
            const baseWallet = await createBaseWalletClient();

            // Send EIP-7702 transaction (Type 4)
            const txHash = await baseWallet.sendTransaction({
                account: walletClient.account,
                to: tx.to,
                data: tx.data,
                value: tx.value || 0n,
                gas: tx.gas,
                maxFeePerGas: tx.maxFeePerGas,
                maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
                authorizationList: [{
                    chainId: authorization.chainId,
                    address: authorization.address,
                    nonce: authorization.nonce,
                    signature: authorization.signature!,
                }],
                type: '0x04', // EIP-7702 transaction type
            });

            console.log('EIP-7702 transaction submitted:', txHash);
            return txHash;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to execute EIP-7702 transaction';
            setError(errorMessage);
            console.error('EIP-7702 execution error:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [walletClient, signAuthorization, createBaseWalletClient]);

    // Batch multiple operations using EIP-7702
    const executeBatchTransaction = useCallback(async (
        transactions: EIP7702Transaction[],
        delegateAddress: `0x${string}`
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            if (!walletClient?.account) {
                throw new Error('No wallet account available');
            }

            // Sign authorization
            const authorization = await signAuthorization(delegateAddress);

            // Create Base wallet client
            const baseWallet = await createBaseWalletClient();

            // Combine multiple calldata into one transaction
            const batchData = encodeBatchCall(transactions);

            // Send batched EIP-7702 transaction
            const txHash = await baseWallet.sendTransaction({
                account: walletClient.account,
                to: delegateAddress, // Send to delegate contract for batching
                data: batchData,
                value: transactions.reduce((sum, tx) => sum + (tx.value || 0n), 0n),
                gas: undefined, // Let wallet estimate
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
                authorizationList: [{
                    chainId: authorization.chainId,
                    address: authorization.address,
                    nonce: authorization.nonce,
                    signature: authorization.signature!,
                }],
                type: '0x04',
            });

            console.log('Batch EIP-7702 transaction submitted:', txHash);
            return txHash;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to execute batch transaction';
            setError(errorMessage);
            console.error('Batch EIP-7702 execution error:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [walletClient, signAuthorization, createBaseWalletClient]);

    // Get smart wallet address (derived from EOA)
    const getSmartWalletAddress = useCallback(async (): Promise<`0x${string}`> => {
        if (!address) {
            throw new Error('No address available');
        }
        
        // Simple deterministic address derivation
        // In production, you might want to use a more sophisticated method
        const smartWalletAddress = await deriveSmartWalletAddress(address, FACTORY_ADDRESS);
        return smartWalletAddress;
    }, [address]);

    // Enable gas sponsorship (pay with ERC-20)
    const enableERC20GasPayment = useCallback(async (
        tokenAddress: `0x${string}`,
        delegateAddress: `0x${string}`
    ) => {
        return executeEIP7702Transaction({
            to: delegateAddress,
            data: encodeEnableERC20Payment(tokenAddress),
        }, delegateAddress);
    }, [executeEIP7702Transaction]);

    return {
        // State
        isLoading,
        error,
        isConnected,
        
        // Core functions
        signAuthorization,
        executeEIP7702Transaction,
        executeBatchTransaction,
        getSmartWalletAddress,
        enableERC20GasPayment,
        
        // Utilities
        createBaseWalletClient,
    };
}

// Utility functions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function encodeBatchCall(transactions: EIP7702Transaction[]): `0x${string}` {
    // This would encode multiple calls into a single calldata
    // Implementation depends on your delegate contract's batch function
    // For now, return empty calldata - implement based on your contract ABI
    // TODO: Implement based on delegate contract's batch function signature
    return '0x' as `0x${string}`;
}

function encodeEnableERC20Payment(tokenAddress: `0x${string}`): `0x${string}` {
    // Encode call to enable ERC-20 gas payment
    // This should call the delegate contract's enableERC20Payment function
    // keccak256("enableERC20Payment(address)")[0:4] = 0xabc12345 (example)
    return `0xabc12345${tokenAddress.slice(2).padStart(64, '0')}` as `0x${string}`;
}

async function deriveSmartWalletAddress(
    eoaAddress: `0x${string}`
): Promise<`0x${string}`> {
    // Simple deterministic address derivation
    // In production, use proper CREATE2 or factory pattern
    // For now, return the EOA address as placeholder
    return eoaAddress;
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM AGENT INTEGRATION (x402 V2 Facilitator)
// VOT Glyph: 𒇷𒇷𒈦 (llm) + 𒀀𒂗𒋾 (agent) + 𒃲 (mcp)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Store EIP-7702 authorization in MCP memory for LLM agent retrieval
 */
export async function storeAuthorizationForAgent(
    userAddress: `0x${string}`,
    authorization: AuthorizationData,
    scope: 'mint' | 'swap' | 'full' = 'mint',
    expiresInSeconds: number = 86400 // 24 hours default
): Promise<{ success: boolean; memoryId?: string; error?: string }> {
    try {
        const response = await fetch('/api/x402/store-authorization', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress,
                authorization: {
                    chainId: authorization.chainId.toString(),
                    address: authorization.address,
                    nonce: authorization.nonce,
                    signature: authorization.signature,
                },
                scope,
                expiresAt: Date.now() + (expiresInSeconds * 1000),
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            return { success: false, error };
        }

        const { memoryId } = await response.json();
        return { success: true, memoryId };
    } catch (err) {
        return { 
            success: false, 
            error: err instanceof Error ? err.message : 'Failed to store authorization' 
        };
    }
}

/**
 * Revoke stored authorization from MCP memory
 */
export async function revokeAgentAuthorization(
    userAddress: `0x${string}`
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('/api/x402/revoke-authorization', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAddress }),
        });

        return { success: response.ok };
    } catch (err) {
        return { 
            success: false, 
            error: err instanceof Error ? err.message : 'Failed to revoke authorization' 
        };
    }
}

/**
 * Request LLM agent to execute a mint operation
 * This calls the x402 agent API which retrieves the stored authorization
 */
export async function requestAgentMint(
    userAddress: `0x${string}`
): Promise<{ 
    success: boolean; 
    txHash?: string; 
    tokenId?: string;
    votAmount?: string;
    rarity?: string;
    error?: string 
}> {
    try {
        const response = await fetch('/api/x402/agent-mint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAddress }),
        });

        if (!response.ok) {
            const error = await response.text();
            return { success: false, error };
        }

        return await response.json();
    } catch (err) {
        return { 
            success: false, 
            error: err instanceof Error ? err.message : 'Agent mint failed' 
        };
    }
}

/**
 * Request LLM agent to execute a swap operation
 */
export async function requestAgentSwap(
    userAddress: `0x${string}`,
    usdcAmount: string // Amount in USDC (6 decimals)
): Promise<{ 
    success: boolean; 
    txHash?: string; 
    votReceived?: string;
    error?: string 
}> {
    try {
        const response = await fetch('/api/x402/agent-swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAddress, usdcAmount }),
        });

        if (!response.ok) {
            const error = await response.text();
            return { success: false, error };
        }

        return await response.json();
    } catch (err) {
        return { 
            success: false, 
            error: err instanceof Error ? err.message : 'Agent swap failed' 
        };
    }
}

/**
 * Check if user has active authorization stored
 */
export async function checkAgentAuthorization(
    userAddress: `0x${string}`
): Promise<{
    hasAuthorization: boolean;
    scope?: 'mint' | 'swap' | 'full';
    expiresAt?: number;
    error?: string;
}> {
    try {
        const response = await fetch(`/api/x402/check-authorization?address=${userAddress}`);
        
        if (!response.ok) {
            return { hasAuthorization: false };
        }

        return await response.json();
    } catch (err) {
        return { 
            hasAuthorization: false, 
            error: err instanceof Error ? err.message : 'Check failed' 
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR x402 FACILITATOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Encode mint calldata for x402 Facilitator
 */
export function encodeMintCalldata(recipient: `0x${string}`): `0x${string}` {
    // Function signature: mintBeeper(address)
    // Selector: keccak256("mintBeeper(address)")[0:4]
    const selector = '0xa0712d68'; // Example, update with actual
    return `${selector}${recipient.slice(2).padStart(64, '0')}` as `0x${string}`;
}

/**
 * Encode swap calldata for x402 Facilitator  
 */
export function encodeSwapCalldata(
    recipient: `0x${string}`,
    usdcAmount: bigint
): `0x${string}` {
    // Function signature: swapUSDCForVOT(address,uint256)
    const selector = '0x12345678'; // Example, update with actual
    const recipientPadded = recipient.slice(2).padStart(64, '0');
    const amountPadded = usdcAmount.toString(16).padStart(64, '0');
    return `${selector}${recipientPadded}${amountPadded}` as `0x${string}`;
}

/**
 * Contract addresses for x402 ecosystem
 */
export const X402_CONTRACTS = {
    facilitator: X402_FACILITATOR_ADDRESS,
    votToken: VOT_TOKEN_ADDRESS,
    treasury: TREASURY_ADDRESS,
    beeperNFT: '0x...' as `0x${string}`, // TODO: Add after deployment
} as const;