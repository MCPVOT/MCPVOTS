/**
 * ENS IPFS Website Machine - x402 Payment Integration
 * 
 * Handles $1 USDC payment via x402 protocol and 10K VOT bonus distribution
 */

import { useCallback, useState } from 'react';
import { parseUnits } from 'viem';
import { base } from 'viem/chains';
import { useAccount, usePublicClient, useSignTypedData } from 'wagmi';

// Configuration
const CONFIG = {
  // VOT Token on Base
  VOT_TOKEN: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07' as `0x${string}`,
  // USDC on Base
  USDC_TOKEN: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
  // Treasury/Facilitator
  TREASURY: '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa' as `0x${string}`,
  // Service price in USDC (1.00 = 1000000 with 6 decimals)
  PRICE_USDC: BigInt(1_000_000), // $1.00
  // VOT bonus tokens (10,000 with 18 decimals)
  VOT_BONUS: parseUnits('10000', 18),
  // Chain ID
  CHAIN_ID: base.id,
  // Service ID for x402
  SERVICE_ID: 'ens-ipfs-machine-v1',
} as const;

// EIP-712 Domain
const DOMAIN = {
  name: 'MCPVOT x402 Payment',
  version: '1',
  chainId: CONFIG.CHAIN_ID,
  verifyingContract: CONFIG.TREASURY,
} as const;

// EIP-712 Types
const PAYMENT_TYPES = {
  Payment: [
    { name: 'serviceId', type: 'string' },
    { name: 'amount', type: 'uint256' },
    { name: 'currency', type: 'address' },
    { name: 'payer', type: 'address' },
    { name: 'recipient', type: 'address' },
    { name: 'deadline', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

// ERC20 ABI for balance checks
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export interface PaymentState {
  status: 'idle' | 'checking' | 'approving' | 'signing' | 'processing' | 'success' | 'error';
  error: string | null;
  txHash: string | null;
  ipfsCid: string | null;
  votBonus: string | null;
}

export interface UseEnsMachinePaymentResult {
  state: PaymentState;
  pay: (websiteData: WebsiteGenerateData) => Promise<void>;
  reset: () => void;
  config: typeof CONFIG;
}

export interface WebsiteGenerateData {
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: string;
  links: Record<string, string>;
  colors: Record<string, string>;
  features: Record<string, boolean>;
}

/**
 * Hook for handling ENS IPFS Machine payments
 */
export function useEnsMachinePayment(): UseEnsMachinePaymentResult {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { signTypedDataAsync } = useSignTypedData();
  
  const [state, setState] = useState<PaymentState>({
    status: 'idle',
    error: null,
    txHash: null,
    ipfsCid: null,
    votBonus: null,
  });
  
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      error: null,
      txHash: null,
      ipfsCid: null,
      votBonus: null,
    });
  }, []);
  
  const pay = useCallback(async (websiteData: WebsiteGenerateData) => {
    if (!isConnected || !address || !publicClient) {
      setState(prev => ({ ...prev, status: 'error', error: 'Please connect your wallet' }));
      return;
    }
    
    try {
      // Step 1: Check USDC balance
      setState(prev => ({ ...prev, status: 'checking' }));
      
      const usdcBalance = await publicClient.readContract({
        address: CONFIG.USDC_TOKEN,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      
      if (usdcBalance < CONFIG.PRICE_USDC) {
        throw new Error(`Insufficient USDC balance. Need $1.00, have $${Number(usdcBalance) / 1_000_000}`);
      }
      
      // Step 2: Check/Request USDC approval
      const allowance = await publicClient.readContract({
        address: CONFIG.USDC_TOKEN,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, CONFIG.TREASURY],
      });
      
      if (allowance < CONFIG.PRICE_USDC) {
        setState(prev => ({ ...prev, status: 'approving' }));
        // In production, we'd trigger wallet approval here
        // For now, we'll rely on the backend to handle approval
      }
      
      // Step 3: Sign EIP-712 payment message
      setState(prev => ({ ...prev, status: 'signing' }));
      
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
      const nonce = BigInt(Math.floor(Math.random() * 1_000_000_000));
      
      const message = {
        serviceId: CONFIG.SERVICE_ID,
        amount: CONFIG.PRICE_USDC,
        currency: CONFIG.USDC_TOKEN,
        payer: address,
        recipient: CONFIG.TREASURY,
        deadline,
        nonce,
      };
      
      const signature = await signTypedDataAsync({
        domain: DOMAIN,
        types: PAYMENT_TYPES,
        primaryType: 'Payment',
        message,
      });
      
      // Step 4: Submit to backend for processing
      setState(prev => ({ ...prev, status: 'processing' }));
      
      const response = await fetch('/api/svg-machine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...websiteData,
          output: 'ipfs',
          payment: {
            signature,
            payer: address,
            amount: CONFIG.PRICE_USDC.toString(),
            deadline: deadline.toString(),
            nonce: nonce.toString(),
          },
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Payment processing failed');
      }
      
      // Step 5: Success!
      setState({
        status: 'success',
        error: null,
        txHash: result.data.txHash || null,
        ipfsCid: result.data.ipfsCid,
        votBonus: '10,000 VOT',
      });
      
    } catch (error) {
      console.error('Payment error:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Payment failed',
      }));
    }
  }, [isConnected, address, publicClient, signTypedDataAsync]);
  
  return {
    state,
    pay,
    reset,
    config: CONFIG,
  };
}

/**
 * Format payment status for display
 */
export function getPaymentStatusMessage(status: PaymentState['status']): string {
  switch (status) {
    case 'idle':
      return 'Ready to pay';
    case 'checking':
      return 'Checking USDC balance...';
    case 'approving':
      return 'Approving USDC...';
    case 'signing':
      return 'Sign payment in wallet...';
    case 'processing':
      return 'Processing payment & generating...';
    case 'success':
      return 'Success! Website pinned to IPFS';
    case 'error':
      return 'Payment failed';
    default:
      return '';
  }
}

export default useEnsMachinePayment;
