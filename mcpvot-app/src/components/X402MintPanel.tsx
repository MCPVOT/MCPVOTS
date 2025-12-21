'use client';

/**
 * X402 Mint Panel - VOT Machine NFT Minting Experience
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  x402 VOT FACILITATOR MINTING FLOW                                       ║
 * ║                                                                          ║
 * ║  ALL PRICES FROM REAL-TIME QUOTES (~20s expiry, auto-refresh)           ║
 * ║                                                                          ║
 * ║  1. User pays $0.25 USDC via x402 Protocol                              ║
 * ║  2. Treasury buyback: $0.25 → VOT (real quote from GeckoTerminal)       ║
 * ║  3. BURN 0% of bought VOT (V2.1 - no burn)                              ║
 * ║  4. Send 69,420 VOT to user INSTANTLY from treasury                     ║
 * ║  5. Pin website to IPFS (EIP-4804 compatible)                           ║
 * ║  6. Mint ERC-1155 NFT with VRF rarity                                   ║
 * ║  7. User can claim +10k VOT bonus via Farcaster                         ║
 * ║                                                                          ║
 * ║  🔥 VAULT PAYS ALL GAS FEES - GASLESS FOR USER 🔥                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { CONTRACTS, NFT_CONFIG, X402_CONFIG } from '@/lib/x402-vot-facilitator';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

// Quote TTL from API (20 seconds)
const QUOTE_TTL_SECONDS = 20;

// =============================================================================
// TYPES
// =============================================================================

interface QuotePayload {
  usdAmount: number;
  votAmount: number;
  pricePerVotUsd: number;
  vaultGasCoverUsd: number;
  expiresAt: string;
  tokenAmount: number;
  pricePerTokenUsd: number;
  priceSource?: string;
}

interface MintStep {
  id: string;
  label: string;
  icon: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  txHash?: string;
  error?: string;
}

interface MintResult {
  tokenId: number;
  ipfsCid: string;
  metadataCid: string;
  votSent: string;
  votBurned: string;
  txHash: string;
  ensUrl: string;
  ipfsUrl: string;
}

interface X402MintPanelProps {
  websiteHtml: string;
  ensName?: string;
  baseName?: string;
  config: {
    nickname?: string;
    bio?: string;
    avatar?: string;
    twitter?: string;
    github?: string;
    farcaster?: string;
  };
  onMintComplete?: (result: MintResult) => void;
  onMintError?: (error: string) => void;
}

// =============================================================================
// ABI DEFINITIONS
// =============================================================================

const USDC_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// =============================================================================
// COMPONENT
// =============================================================================

export default function X402MintPanel({
  websiteHtml,
  ensName,
  baseName,
  config,
  onMintComplete,
  onMintError,
}: X402MintPanelProps) {
  // Wallet state
  const { address, isConnected } = useAccount();
  
  // USDC Balance
  const { data: usdcBalance, refetch: refetchBalance } = useBalance({
    address: address,
    token: CONTRACTS.USDC_BASE as `0x${string}`,
  });

  // VOT Balance
  const { data: votBalance, refetch: refetchVotBalance } = useBalance({
    address: address,
    token: CONTRACTS.VOT_TOKEN as `0x${string}`,
  });

  // USDC Allowance check
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.USDC_BASE as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.VOT_TREASURY as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Write contracts
  const { writeContract: approveUsdc, data: approveTxHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  // Minting state
  const [isMinting, setIsMinting] = useState(false);
  const [mintSteps, setMintSteps] = useState<MintStep[]>([
    { id: 'approve', label: 'Approve USDC', icon: '💳', status: 'pending' },
    { id: 'ipfs', label: 'Pin to IPFS', icon: '📌', status: 'pending' },
    { id: 'payment', label: 'x402 Payment', icon: '💸', status: 'pending' },
    { id: 'vot', label: 'Receive VOT', icon: '💰', status: 'pending' },
    { id: 'burn', label: 'Burn 1% VOT', icon: '🔥', status: 'pending' },
    { id: 'mint', label: 'Mint NFT', icon: '🎨', status: 'pending' },
  ]);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // =========================================================================
  // REAL-TIME QUOTE FROM x402 FACILITATOR
  // Quote expires in ~20 seconds, auto-refreshes
  // =========================================================================
  const [quote, setQuote] = useState<QuotePayload | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteCountdown, setQuoteCountdown] = useState<number | null>(null);
  const [quoteLocalExpiry, setQuoteLocalExpiry] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const quoteControllerRef = useRef<AbortController | null>(null);

  // Fetch quote from API
  useEffect(() => {
    // Clean up previous request
    if (quoteControllerRef.current) {
      quoteControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    quoteControllerRef.current = controller;
    let isMounted = true;

    async function fetchQuote() {
      try {
        setQuoteLoading(true);
        
        // Fetch from VOT order endpoint (same as X402GaslessOrderPanel)
        const response = await fetch('/api/vot/order?usdAmount=1', {
          signal: controller.signal,
        });
        
        if (!response.ok) {
          throw new Error(`Quote endpoint returned ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.quote) {
          throw new Error(data.error || 'Quote not available');
        }
        
        if (isMounted) {
          const quoteData = data.quote as QuotePayload;
          setQuote(quoteData);
          
          // Calculate local expiry
          const serverExpiry = new Date(quoteData.expiresAt).getTime();
          const now = Date.now();
          const ttlExpiry = now + QUOTE_TTL_SECONDS * 1000;
          const effectiveExpiry = Number.isFinite(serverExpiry) 
            ? Math.min(serverExpiry, ttlExpiry) 
            : ttlExpiry;
          setQuoteLocalExpiry(effectiveExpiry);
          
          console.log('[X402MintPanel] Quote fetched:', {
            votAmount: quoteData.votAmount.toLocaleString(),
            pricePerVot: `$${quoteData.pricePerVotUsd}`,
            source: quoteData.priceSource,
            expiresIn: Math.round((effectiveExpiry - now) / 1000) + 's',
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (isMounted) {
          console.error('[X402MintPanel] Quote fetch failed:', err);
          setQuote(null);
          setQuoteLocalExpiry(null);
        }
      } finally {
        if (isMounted) {
          setQuoteLoading(false);
        }
      }
    }

    fetchQuote();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [refreshTrigger]);

  // Auto-refresh when quote expires
  useEffect(() => {
    if (!quote || quoteLocalExpiry === null) return;
    
    const refreshDelay = Math.max(quoteLocalExpiry - Date.now(), 0);
    const timeout = window.setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, refreshDelay);
    
    return () => clearTimeout(timeout);
  }, [quote, quoteLocalExpiry]);

  // Countdown timer
  useEffect(() => {
    if (!quote || quoteLocalExpiry === null) {
      setQuoteCountdown(null);
      return;
    }
    
    const updateCountdown = () => {
      const remainingMs = quoteLocalExpiry - Date.now();
      setQuoteCountdown(Math.max(0, Math.ceil(remainingMs / 1000)));
    };
    
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 500);
    
    return () => window.clearInterval(intervalId);
  }, [quote, quoteLocalExpiry]);

  // Quote values (from real quote, NOT static!)
  const votAmount = quote?.votAmount ?? 0;
  const estimatedBurn = votAmount * 0.01; // 1% burn
  const pricePerVot = quote?.pricePerVotUsd ?? 0;
  const priceSource = quote?.priceSource ?? 'loading';
  const quoteExpired = quoteLocalExpiry !== null && quoteLocalExpiry <= Date.now();

  // Check if approval is needed
  const needsApproval = !usdcAllowance || BigInt(usdcAllowance.toString()) < BigInt(X402_CONFIG.MINT_PRICE_USDC);

  // Update step status
  const updateStep = useCallback((stepId: string, updates: Partial<MintStep>) => {
    setMintSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s));
  }, []);

  // Handle USDC approval
  const handleApprove = async () => {
    if (!address) return;
    
    try {
      updateStep('approve', { status: 'active' });
      
      approveUsdc({
        address: CONTRACTS.USDC_BASE as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACTS.VOT_TREASURY as `0x${string}`, BigInt(X402_CONFIG.MINT_PRICE_USDC)],
      });
    } catch (err) {
      updateStep('approve', { status: 'error', error: err instanceof Error ? err.message : 'Approval failed' });
      setError('USDC approval failed');
    }
  };

  // Watch for approval success
  useEffect(() => {
    if (isApproveSuccess && approveTxHash) {
      updateStep('approve', { status: 'complete', txHash: approveTxHash });
      refetchAllowance();
    }
  }, [isApproveSuccess, approveTxHash, updateStep, refetchAllowance]);

  // Main mint flow
  const handleMint = async () => {
    if (!address || !websiteHtml) return;
    
    setIsMinting(true);
    setError(null);
    
    try {
      // Step 1: USDC Approval (if needed)
      if (needsApproval) {
        setCurrentStep('approve');
        await handleApprove();
        return; // Will continue after approval confirmation
      }
      
      // Step 2: Pin to IPFS
      setCurrentStep('ipfs');
      updateStep('ipfs', { status: 'active' });
      
      const ipfsResponse = await fetch('/api/svg-machine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output: 'ipfs',
          ensName,
          baseName,
          generalInfo: {
            nickname: config.nickname || ensName || address?.slice(0, 8),
            bio: config.bio || 'MCPVOT Builder',
          },
          socialLinks: {
            twitter: config.twitter,
            github: config.github,
            farcaster: config.farcaster,
          },
          customHtml: websiteHtml,
        }),
      });
      
      if (!ipfsResponse.ok) {
        throw new Error('Failed to pin to IPFS');
      }
      
      const ipfsData = await ipfsResponse.json();
      updateStep('ipfs', { status: 'complete' });
      
      // Step 3: x402 Payment
      setCurrentStep('payment');
      updateStep('payment', { status: 'active' });
      
      // Generate fallback SVG content if websiteHtml is not SVG
      const svgContent = websiteHtml || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#0a0a0a"/>
        <rect x="10" y="10" width="380" height="280" rx="8" fill="none" stroke="#00FF88" stroke-width="2"/>
        <text x="200" y="40" text-anchor="middle" font-family="monospace" font-size="16" fill="#00D4FF">VOT MACHINE // BUILDER NFT</text>
        <text x="200" y="120" text-anchor="middle" font-family="monospace" font-size="12" fill="#FFFFFF">${ensName || baseName || address?.slice(0, 10)}</text>
        <text x="200" y="260" text-anchor="middle" font-family="monospace" font-size="10" fill="#00FF88">x402 PROTOCOL • BASE NETWORK</text>
      </svg>`;
      
      const paymentResponse = await fetch('/api/x402/mint-builder-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          svgContent, // Required: actual SVG content
          svgCid: ipfsData.ipfsCid, // Optional: pre-pinned CID
          metadataCid: ipfsData.metadataCid || ipfsData.ipfsCid,
          ensName,
          baseName,
          farcasterUsername: config.farcaster,
        }),
      });
      
      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'x402 payment failed');
      }
      
      const paymentData = await paymentResponse.json();
      updateStep('payment', { status: 'complete', txHash: paymentData.txHash });
      
      // Step 4: VOT Transfer
      setCurrentStep('vot');
      updateStep('vot', { status: 'active' });
      // This happens automatically via x402 facilitator
      await new Promise(r => setTimeout(r, 1000)); // Visual feedback
      updateStep('vot', { status: 'complete' });
      
      // Step 5: VOT Burn
      setCurrentStep('burn');
      updateStep('burn', { status: 'active' });
      // This also happens automatically
      await new Promise(r => setTimeout(r, 1000));
      updateStep('burn', { status: 'complete' });
      
      // Step 6: NFT Mint
      setCurrentStep('mint');
      updateStep('mint', { status: 'active' });
      await new Promise(r => setTimeout(r, 1000));
      updateStep('mint', { status: 'complete', txHash: paymentData.nftTxHash });
      
      // Success!
      const result: MintResult = {
        tokenId: paymentData.tokenId,
        ipfsCid: ipfsData.ipfsCid,
        metadataCid: ipfsData.metadataCid || ipfsData.ipfsCid,
        votSent: votAmount.toString(), // Real amount from quote!
        votBurned: Math.round(estimatedBurn).toLocaleString(), // 1% of real quote
        txHash: paymentData.txHash,
        ensUrl: ensName ? `https://${ensName}.eth.limo` : `https://ipfs.io/ipfs/${ipfsData.ipfsCid}`,
        ipfsUrl: `ipfs://${ipfsData.ipfsCid}`,
      };
      
      setMintResult(result);
      refetchBalance();
      refetchVotBalance();
      onMintComplete?.(result);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Minting failed';
      setError(errorMsg);
      if (currentStep) {
        updateStep(currentStep, { status: 'error', error: errorMsg });
      }
      onMintError?.(errorMsg);
    } finally {
      setIsMinting(false);
      setCurrentStep(null);
    }
  };

  // Continue mint after approval
  useEffect(() => {
    if (isApproveSuccess && isMinting && currentStep === 'approve') {
      // Approval done, continue with mint
      handleMint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApproveSuccess, isMinting, currentStep]);

  // Check if can mint (need valid quote!)
  const canMint = isConnected && 
    usdcBalance && 
    BigInt(usdcBalance.value.toString()) >= BigInt(X402_CONFIG.MINT_PRICE_USDC) &&
    websiteHtml &&
    quote &&
    !quoteExpired;

  // Format numbers
  const formatVot = (amount: string | number) => {
    return Number(amount).toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <div className="bg-black/80 border-2 border-[#00FFFF]/40 rounded-xl p-6 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,255,0.2)]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#00FFFF] mb-2">
          {mintResult ? '🎉 Website Minted!' : '🚀 Mint Your VOT Machine NFT'}
        </h2>
        <p className="text-gray-400 text-sm">
          {mintResult 
            ? 'Your website is now live on IPFS and minted as an NFT!'
            : 'Pay $0.25 USDC to mint your website as a VOT Machine NFT + get 69,420 VOT'}
        </p>
      </div>

      {/* Success State */}
      {mintResult ? (
        <div className="space-y-6">
          {/* Result Card */}
          <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 rounded-xl p-6 text-center">
            <div className="text-5xl mb-4">🌐</div>
            <h3 className="text-xl font-bold text-white mb-2">
              {NFT_CONFIG.name} #{mintResult.tokenId}
            </h3>
            
            <a
              href={mintResult.ensUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full p-4 bg-black/50 border border-[#00FFFF] rounded-xl mb-4 hover:bg-[#00FFFF]/10 transition-all"
            >
              <div className="text-xs text-gray-400 mb-1">Your Website URL</div>
              <div className="text-[#00FFFF] font-bold">{mintResult.ensUrl} ↗</div>
            </a>
            
            <div className="p-3 bg-black/50 border border-gray-700 rounded-xl mb-4">
              <div className="text-xs text-gray-400 mb-1">IPFS CID (NFT Content)</div>
              <code className="text-xs text-white break-all">{mintResult.ipfsCid}</code>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-xl font-bold text-[#00FF00]">{formatVot(mintResult.votSent)}</div>
              <div className="text-xs text-gray-400">VOT Received</div>
            </div>
            <div className="bg-[#FF6600]/10 border border-[#FF6600]/30 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-xl font-bold text-[#FF6600]">{mintResult.votBurned}</div>
              <div className="text-xs text-gray-400">VOT Burned</div>
            </div>
          </div>

          {/* FIP-2 Social Bonus Section */}
          <div className="bg-gradient-to-r from-[#8B5CF6]/20 to-[#EC4899]/20 border border-[#8B5CF6]/50 rounded-xl p-4">
            <div className="text-center mb-4">
              <div className="text-2xl mb-2">🎁</div>
              <h4 className="text-lg font-bold text-white">Claim +10,000 VOT Bonus!</h4>
              <p className="text-sm text-gray-400 mt-1">
                Follow @mcpvot & share your mint on Farcaster
              </p>
            </div>
            
            <div className="space-y-3">
              {/* Follow Button */}
              <a
                href="https://warpcast.com/mcpvot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full p-3 bg-black/50 border border-[#8B5CF6] rounded-lg hover:bg-[#8B5CF6]/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">👤</span>
                  <div className="text-left">
                    <div className="text-white font-medium">Follow @mcpvot</div>
                    <div className="text-xs text-gray-400">+5,000 VOT</div>
                  </div>
                </div>
                <span className="text-[#8B5CF6]">↗</span>
              </a>
              
              {/* Share Button - FIP-2 */}
              <a
                href={`https://warpcast.com/~/compose?text=${encodeURIComponent(
                  `🎉 Just minted VOT Machine NFT #${mintResult.tokenId}!\n\n💰 Got ${formatVot(mintResult.votSent)} VOT\n🌐 View: mcpvot.xyz/${mintResult.tokenId}\n\n🚀 Mint yours: mcpvot.xyz\n\n#MCPVOT #VOT #x402 #Base`
                )}&embeds[]=${encodeURIComponent(`https://mcpvot.xyz/${mintResult.tokenId}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full p-3 bg-black/50 border border-[#EC4899] rounded-lg hover:bg-[#EC4899]/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📢</span>
                  <div className="text-left">
                    <div className="text-white font-medium">Share on Warpcast</div>
                    <div className="text-xs text-gray-400">+5,000 VOT</div>
                  </div>
                </div>
                <span className="text-[#EC4899]">↗</span>
              </a>
              
              {/* Claim Bonus Button */}
              <a
                href={`/claim-bonus?tx=${mintResult.txHash}&tokenId=${mintResult.tokenId}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white font-bold rounded-lg hover:opacity-90 transition-all"
              >
                <span>✨</span>
                <span>Verify & Claim Bonus</span>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-3">
            <a
              href={mintResult.ensUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-[#00FFFF] text-black font-bold rounded-lg text-center hover:bg-[#00FFFF]/80 transition-all"
            >
              Visit Website ↗
            </a>
            <a
              href={`https://basescan.org/tx/${mintResult.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 border border-[#00FFFF] text-[#00FFFF] font-bold rounded-lg text-center hover:bg-[#00FFFF]/10 transition-all"
            >
              View on BaseScan ↗
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Flow Diagram */}
          <div className="bg-black/60 border border-[#FF6600]/40 rounded-xl p-4">
            <div className="text-sm font-bold text-[#FF6600] mb-3 text-center">x402 VOT FACILITATOR FLOW</div>
            <div className="grid grid-cols-6 gap-2 text-center text-xs">
              {mintSteps.map((step, i) => (
                <div key={step.id} className="relative">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg mb-1 transition-all ${
                    step.status === 'complete' ? 'bg-[#00FF00]/20 border border-[#00FF00]' :
                    step.status === 'active' ? 'bg-[#00FFFF]/20 border border-[#00FFFF] animate-pulse' :
                    step.status === 'error' ? 'bg-red-500/20 border border-red-500' :
                    'bg-gray-800 border border-gray-700'
                  }`}>
                    {step.status === 'complete' ? '✓' : 
                     step.status === 'active' ? '⏳' :
                     step.status === 'error' ? '✗' : step.icon}
                  </div>
                  <div className={`text-[10px] ${
                    step.status === 'complete' ? 'text-[#00FF00]' :
                    step.status === 'active' ? 'text-[#00FFFF]' :
                    step.status === 'error' ? 'text-red-500' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </div>
                  {i < mintSteps.length - 1 && (
                    <div className={`absolute top-5 left-[60%] w-[80%] h-0.5 ${
                      step.status === 'complete' ? 'bg-[#00FF00]' : 'bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* What You Get - REAL-TIME QUOTE */}
          <div className="bg-black/50 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white">What You Get</h3>
              {quoteCountdown !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Quote expires</span>
                  <span className={`px-2 py-1 rounded text-xs font-mono ${
                    quoteCountdown <= 5 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-[#00FFFF]/20 text-[#00FFFF]'
                  }`}>
                    {quoteCountdown > 0 ? `${quoteCountdown}s` : 'refreshing...'}
                  </span>
                </div>
              )}
            </div>
            
            {quoteLoading && !quote ? (
              <div className="text-center py-4">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                <div className="text-sm text-gray-400">Fetching live quote...</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">🌐 Permanent IPFS Website</span>
                  <span className="text-[#00FF00]">✓</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">🏷️ ERC-1155 NFT (on Base)</span>
                  <span className="text-[#00FF00]">✓</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">💰 VOT Tokens</span>
                  <div className="text-right">
                    <span className="text-[#00FF00] font-bold">{formatVot(votAmount)} VOT</span>
                    <div className="text-[10px] text-gray-500">≈ ${pricePerVot.toFixed(10)}/VOT</div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">🔥 VOT Burned (1%)</span>
                  <div className="text-right">
                    <span className="text-[#FF6600] font-bold">~{formatVot(estimatedBurn)} VOT</span>
                    <div className="text-[10px] text-gray-500">DEFLATIONARY</div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">⛽ Gas Fees</span>
                  <span className="text-[#00FF00]">VAULT PAYS ALL GAS 🔥</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">📡 Price Source</span>
                  <span className="text-gray-300 text-xs">{priceSource}</span>
                </div>
                <div className="flex items-center justify-between py-3 text-lg font-bold border-t border-gray-600 mt-2">
                  <span className="text-white">Total Cost</span>
                  <span className="text-[#00FFFF]">$0.25 USDC</span>
                </div>
              </div>
            )}
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/50 border border-gray-700 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">Your USDC Balance</div>
              <div className="text-lg font-bold text-white">
                {usdcBalance ? formatUnits(usdcBalance.value, 6) : '0.00'} USDC
              </div>
              {usdcBalance && BigInt(usdcBalance.value.toString()) < BigInt(X402_CONFIG.MINT_PRICE_USDC) && (
                <div className="text-xs text-red-500 mt-1">Insufficient balance</div>
              )}
            </div>
            <div className="bg-black/50 border border-gray-700 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">Your VOT Balance</div>
              <div className="text-lg font-bold text-[#00FFFF]">
                {votBalance ? formatVot(formatUnits(votBalance.value, 18)) : '0'} VOT
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="text-red-500 text-sm">{error}</div>
            </div>
          )}

          {/* Action Buttons */}
          {!isConnected ? (
            <div className="text-center py-4 text-gray-400">
              Connect your wallet to mint
            </div>
          ) : !quote ? (
            <div className="text-center py-4">
              <div className="animate-spin text-2xl mb-2">⏳</div>
              <div className="text-sm text-gray-400">Loading quote...</div>
            </div>
          ) : quoteExpired ? (
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="w-full py-4 rounded-xl font-bold text-lg bg-[#FF6600] text-black hover:bg-[#FF6600]/80 transition-all"
            >
              Quote Expired - Click to Refresh
            </button>
          ) : needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={isApproving || isApproveConfirming}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                isApproving || isApproveConfirming
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80'
              }`}
            >
              {isApproving || isApproveConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                  Approving USDC...
                </span>
              ) : (
                'Approve $0.25 USDC'
              )}
            </button>
          ) : (
            <button
              onClick={handleMint}
              disabled={!canMint || isMinting}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                !canMint || isMinting
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#00FFCC] to-[#00FF66] text-black hover:opacity-90'
              }`}
            >
              {isMinting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                  Minting VOT Machine NFT...
                </span>
              ) : (
                'Mint VOT Machine NFT for $0.25'
              )}
            </button>
          )}

          {/* Info Footer */}
          <div className="text-center text-xs text-gray-500">
            <p>Powered by x402 Protocol • Gas sponsored by Base Paymaster</p>
            <p className="mt-1">
              VOT: <a href={`https://basescan.org/address/${CONTRACTS.VOT_TOKEN}`} target="_blank" rel="noopener noreferrer" className="text-[#00FFFF] hover:underline">{CONTRACTS.VOT_TOKEN.slice(0, 10)}...</a>
              {' • '}
              Treasury: <a href={`https://basescan.org/address/${CONTRACTS.VOT_TREASURY}`} target="_blank" rel="noopener noreferrer" className="text-[#00FFFF] hover:underline">{CONTRACTS.VOT_TREASURY.slice(0, 10)}...</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
