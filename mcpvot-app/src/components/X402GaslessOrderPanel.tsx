"use client";

import { sdk } from "@farcaster/miniapp-sdk";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";


import { useX402 } from "@/hooks/useX402";
import { useOptionalFarcasterContext } from "@/providers/FarcasterMiniAppProvider";

interface QuotePayload {
    usdAmount: number;
    tokenAmount?: number;
    votAmount?: number;
    pricePerTokenUsd?: number;
    pricePerVotUsd?: number;
    vaultGasCoverUsd: number;
    expiresAt: string;
    [key: string]: unknown;
}

interface QuoteResponse {
    success: boolean;
    quote?: QuotePayload;
    error?: string;
}

interface FacilitatorReceipt {
    id: string;
    timestamp: string;
    payer: string;
    usdAmount: number;
    usdcAtomicAmount: string;
    status: "queued" | "processed" | "failed";
    memo: string;
    votTokenAddress?: string;
    treasuryAddress?: string;
}

interface OrderResponse {
    success: boolean;
    message?: string;
    error?: string;
    receipt?: FacilitatorReceipt | null;
    payout?: Record<string, unknown> | null;
    conversion?: Record<string, unknown> | null;
    notes?: string[];
    quote?: QuotePayload;
    source?: string;
    paymentHash?: string | null;
    settlementTxHash?: string | null;
    bonusTxHash?: string | null; // VOT bonus TX for MAXX purchases
    facilitatorSignature?: string | null;
}

export interface X402GaslessOrderPanelProps {
    tokenSymbol: string;
    tokenName?: string;
    quoteEndpoint: string;
    orderEndpoint: string;
    x402Endpoint?: string;
    usdOptions?: number[];
    headerTitle?: string;
    description?: string;
    highlightBadge?: string;
    primerDescription?: string;
    farcasterNote?: string;
    disclaimers?: string[];
    ctaLabel?: string;
    orderButtonLabel?: string;
    emptyStateText?: string;
    backgroundClassName?: string;
    gradientStyle?: "cyan" | "emerald" | "violet";
    modalTitleFormatter?: (usdAmount: number, tokenSymbol: string, tokenName: string) => string;
    quoteInstructions?: {
        top?: string;
        bottom?: string;
    };
}

const DEFAULT_USD_OPTIONS = [1, 10, 100, 1000];
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const VOT_TOKEN_ADDRESS = "0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07" as const;
const USDC_DECIMALS = 6;
const VOT_DECIMALS = 18;
const TICKER_FRAGMENTS = ['<ALPHA STATE>', '𒇻 𒅗 𒁹', '$USDC ⇢ $VOT', 'GASLESS LOOP'] as const;

function formatTokenAmount(quote: QuotePayload | undefined, label = "tokens") {
    const amount = quote?.tokenAmount ?? quote?.votAmount;
    if (typeof amount !== "number") {
        return `0 ${label}`;
    }
    return `${amount.toLocaleString()} ${label}`;
}

function shortenAddress(address: string | null | undefined) {
    if (!address) {
        return null;
    }
    if (address.length <= 10) {
        return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatPricePerToken(quote: QuotePayload | undefined) {
    const price = quote?.pricePerTokenUsd ?? quote?.pricePerVotUsd;
    if (typeof price !== "number") {
        return undefined;
    }
    return price.toFixed(6);
}

function deriveGradientClasses(variant: "cyan" | "emerald" | "violet" | undefined) {
    switch (variant) {
        case "emerald":
            return "border-emerald-500/30 shadow-[0_0_35px_rgba(16,185,129,0.2)]";
        case "violet":
            return "border-violet-500/30 shadow-[0_0_35px_rgba(167,139,250,0.2)]";
        case "cyan":
        default:
            return "border-cyan-500/30 shadow-[0_0_35px_rgba(0,180,255,0.35)]";
    }
}

interface PaletteTokens {
    headerTitleClass: string;
    headerSubtitleClass: string;
    highlightBadgeClass: string;
    infoCardClasses: string;
    infoPrimaryTextClass: string;
    accentTextClass: string;
    statusCardClasses: string;
    statusPositiveTextClass: string;
    statusNeutralTextClass: string;
    statusNegativeTextClass: string;
    tickerContainerClasses: string;
    tickerGradientLeft: string;
    tickerGradientRight: string;
    tickerTextClass: string;
    tickerShadow: string;
}

function derivePaletteTokens(variant: "cyan" | "emerald" | "violet" | undefined): PaletteTokens {
    switch (variant) {
        case "emerald":
            return {
                headerTitleClass: "text-emerald-200",
                headerSubtitleClass: "text-emerald-100/85",
                highlightBadgeClass: "border border-emerald-400/40 bg-emerald-400/15 text-emerald-100",
                infoCardClasses: "border border-emerald-400/35 bg-emerald-500/10",
                infoPrimaryTextClass: "text-emerald-100/85",
                accentTextClass: "text-emerald-200",
                statusCardClasses: "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100/80",
                statusPositiveTextClass: "text-emerald-300",
                statusNeutralTextClass: "text-emerald-100/85",
                statusNegativeTextClass: "text-red-300",
                tickerContainerClasses: "border border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.35)]",
                tickerGradientLeft: "from-emerald-500/40",
                tickerGradientRight: "from-emerald-500/40",
                tickerTextClass: "text-emerald-200/90",
                tickerShadow: "rgba(16,185,129,0.55)"
            };
        case "violet":
            return {
                headerTitleClass: "text-violet-200",
                headerSubtitleClass: "text-violet-100/85",
                highlightBadgeClass: "border border-violet-400/40 bg-violet-500/20 text-violet-100",
                infoCardClasses: "border border-violet-400/40 bg-violet-500/10",
                infoPrimaryTextClass: "text-violet-100/85",
                accentTextClass: "text-violet-200",
                statusCardClasses: "border border-violet-400/25 bg-violet-500/10 text-violet-100/80",
                statusPositiveTextClass: "text-emerald-300",
                statusNeutralTextClass: "text-violet-100/85",
                statusNegativeTextClass: "text-red-300",
                tickerContainerClasses: "border border-violet-400/40 bg-violet-500/15 shadow-[0_0_25px_rgba(167,139,250,0.35)]",
                tickerGradientLeft: "from-violet-500/35",
                tickerGradientRight: "from-violet-500/35",
                tickerTextClass: "text-violet-100/90",
                tickerShadow: "rgba(167,139,250,0.55)"
            };
        case "cyan":
        default:
            return {
                headerTitleClass: "text-[#00FFFF] drop-shadow-[0_0_25px_rgba(0,255,255,0.85)]",
                headerSubtitleClass: "text-[#00FF88]/85 drop-shadow-[0_0_18px_rgba(0,255,136,0.55)]",
                highlightBadgeClass: "border border-[#00FFFF]/50 bg-[#00FFFF]/10 text-[#00FFFF] drop-shadow-[0_0_18px_rgba(0,255,255,0.55)]",
                infoCardClasses: "border border-[#00FFFF]/40 bg-[#00FFFF]/10",
                infoPrimaryTextClass: "text-[#00FFFF]/85",
                accentTextClass: "text-[#00FFFF]",
                statusCardClasses: "border border-[#00FFFF]/25 bg-[#001012]/85 text-[#00FFFF]/80",
                statusPositiveTextClass: "text-[#00FF88]",
                statusNeutralTextClass: "text-[#00FFFF]/80",
                statusNegativeTextClass: "text-[#FF7043]",
                tickerContainerClasses: "border border-[#00FFFF]/50 bg-[#001a1a]/80 shadow-[0_0_35px_rgba(0,255,255,0.35)]",
                tickerGradientLeft: "from-[#00FFFF]/40",
                tickerGradientRight: "from-[#00FFFF]/40",
                tickerTextClass: "text-[#00FFFF]/90 drop-shadow-[0_0_12px_rgba(0,255,255,0.55)]",
                tickerShadow: "rgba(0,255,255,0.6)"
            };
    }
}

function getDefaultDisclaimers(tokenSymbol: string) {
    return [
        "Coinbase CDP facilitator handles the x402 charge while the treasury covers network gas.",
        "Settlement completes once the facilitator finalizes on-chain delivery and MCP Memory stores the receipt.",
        `Roadmap: native facilitator clears $${tokenSymbol} directly without USDC bridging.`
    ];
}

const LOCAL_QUOTE_TTL_MS = 20_000;

export function X402GaslessOrderPanel({
    tokenSymbol,
    tokenName,
    quoteEndpoint,
    orderEndpoint,
    x402Endpoint = orderEndpoint,
    usdOptions = DEFAULT_USD_OPTIONS,
    headerTitle,
    description,
    highlightBadge,
    primerDescription,
    farcasterNote,
    disclaimers,
    ctaLabel = "Open x402 Flow",
    orderButtonLabel = "Initiate x402 Payment",
    emptyStateText,
    backgroundClassName = "bg-black/70",
    gradientStyle = "cyan",
    modalTitleFormatter,
    quoteInstructions
}: X402GaslessOrderPanelProps) {
    const displayToken = tokenName || tokenSymbol;
    const { address } = useAccount();
    const farcasterContext = useOptionalFarcasterContext();
    const farcasterUser = farcasterContext?.user;
    const farcasterFid = farcasterUser?.fid;
    const custodyAddress = farcasterUser?.custody_address;
    const isMiniApp = farcasterContext?.isInMiniApp ?? false;

    // x402 hook for payment processing (autoSign=true triggers wallet popup automatically)
    // CRITICAL: Pass tokenSymbol to ensure correct token swap (VOT vs MAXX)
    const {
        isProcessing: x402Processing,
        requirements: x402Requirements,
        initiatePayment: initiateX402Payment,
        error: x402Error,
        reset: resetX402
    } = useX402(x402Endpoint || orderEndpoint, {
        autoSign: true, // Automatically trigger wallet signature when 402 received
        token: tokenSymbol.toUpperCase() as 'VOT' | 'MAXX', // Pass token type to API
        onSuccess: (result) => {
            console.log('✅ x402 payment successful:', result);
        },
        onError: (error) => {
            console.error('❌ x402 payment error:', error);
        }
    });

    // Expose x402 state for UI feedback (used in loading states)
    const isX402Active = x402Processing || !!x402Requirements;
    const hasX402Error = !!x402Error;

    const [usdAmount, setUsdAmount] = useState<number>(usdOptions[0] ?? DEFAULT_USD_OPTIONS[0]);
    const [quote, setQuote] = useState<QuotePayload | undefined>();
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [orderResult, setOrderResult] = useState<OrderResponse | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [quoteCountdown, setQuoteCountdown] = useState<number | null>(null);
    const [quoteLocalExpiry, setQuoteLocalExpiry] = useState<number | null>(null);
    const [shareState, setShareState] = useState<'idle' | 'posting' | 'posted' | 'error'>('idle');
    const [shareError, setShareError] = useState<string | null>(null);
    const { openConnectModal } = useConnectModal();
    // NOTE: Removed chainId, switchChainAsync, walletClient hooks - x402 flow lets wallet handle network via EIP-712 chainId

    const effectiveWalletAddress = useMemo(() => {
        if (address) {
            return address;
        }
        if (custodyAddress && custodyAddress.length > 0) {
            return custodyAddress;
        }
        return null;
    }, [address, custodyAddress]);

    const walletSourceLabel = useMemo(() => {
        if (address) {
            return "Connected Wallet";
        }
        if (custodyAddress) {
            return "Farcaster Custody Wallet";
        }
        return undefined;
    }, [address, custodyAddress]);

    const effectiveWalletDisplay = useMemo(() => shortenAddress(effectiveWalletAddress), [effectiveWalletAddress]);

    const walletAddressForQuery = useMemo(
        () => (effectiveWalletAddress?.startsWith("0x") ? (effectiveWalletAddress as `0x${string}`) : undefined),
        [effectiveWalletAddress]
    );

    const {
        data: rawUsdcBalance,
        isLoading: usdcBalanceLoading,
        refetch: refetchUsdcBalance,
    } = useReadContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: walletAddressForQuery ? [walletAddressForQuery] : undefined,
        query: {
            enabled: Boolean(walletAddressForQuery),
            staleTime: 30_000,
            refetchOnWindowFocus: false,
        },
    });

    const usdcBalance = useMemo(() => {
        if (!rawUsdcBalance) {
            return 0;
        }
        try {
            return parseFloat(formatUnits(rawUsdcBalance, USDC_DECIMALS));
        } catch (error) {
            console.warn("[X402GaslessOrderPanel] Failed to format USDC balance", error);
            return 0;
        }
    }, [rawUsdcBalance]);

    // VOT Balance Hook
    const {
        data: rawVotBalance,
        isLoading: votBalanceLoading,
        refetch: refetchVotBalance,
    } = useReadContract({
        address: VOT_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: walletAddressForQuery ? [walletAddressForQuery] : undefined,
        query: {
            enabled: Boolean(walletAddressForQuery),
            staleTime: 30_000,
            refetchOnWindowFocus: false,
        },
    });

    const votBalance = useMemo(() => {
        if (!rawVotBalance) {
            return 0;
        }
        try {
            return parseFloat(formatUnits(rawVotBalance, VOT_DECIMALS));
        } catch (error) {
            console.warn("[X402GaslessOrderPanel] Failed to format VOT balance", error);
            return 0;
        }
    }, [rawVotBalance]);

    const hasSufficientUsdc = useMemo(() => {
        if (!walletAddressForQuery) {
            return false;
        }
        return usdcBalance + 0.000001 >= usdAmount;
    }, [usdAmount, usdcBalance, walletAddressForQuery]);

    useEffect(() => {
        if (walletAddressForQuery) {
            refetchUsdcBalance();
            refetchVotBalance();
        }
    }, [walletAddressForQuery, usdAmount, refetchUsdcBalance, refetchVotBalance]);

    useEffect(() => {
        if (!quote) {
            setQuoteLocalExpiry(null);
        }
    }, [quote]);

    const quoteExpired = useMemo(() => {
        if (!quote || quoteLocalExpiry === null) {
            return false;
        }
        return quoteLocalExpiry <= Date.now();
    }, [quote, quoteLocalExpiry]);

    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        async function fetchQuote() {
            try {
                setQuoteLoading(true);
                setError(null);
                const response = await fetch(`${quoteEndpoint}?usdAmount=${usdAmount}`, {
                    signal: controller.signal
                });
                if (!response.ok) {
                    throw new Error(`Quote endpoint returned ${response.status}`);
                }
                const data: QuoteResponse = await response.json();
                if (!data.success || !data.quote) {
                    throw new Error(data.error || "Quote not available");
                }
                if (isMounted) {
                    setQuote(data.quote);
                    const serverExpiry = new Date(data.quote.expiresAt).getTime();
                    const now = Date.now();
                    const ttlExpiry = now + LOCAL_QUOTE_TTL_MS;
                    const effectiveExpiry = Number.isFinite(serverExpiry) ? Math.min(serverExpiry, ttlExpiry) : ttlExpiry;
                    setQuoteLocalExpiry(effectiveExpiry);
                }
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") {
                    return;
                }
                if (isMounted) {
                    let message = err instanceof Error ? err.message : "Unable to fetch quote";
                    if (message === "Failed to fetch") {
                        message = "Network request failed. Please check your connection and try again.";
                    }
                    setError(message);
                    setQuote(undefined);
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
    }, [usdAmount, quoteEndpoint, refreshTrigger]);

    useEffect(() => {
        if (!quote) {
            return;
        }
        if (quoteLocalExpiry === null) {
            return;
        }
        const refreshDelay = Math.max(quoteLocalExpiry - Date.now(), 0);
        const timeout = window.setTimeout(() => setRefreshTrigger((value) => value + 1), refreshDelay);
        return () => clearTimeout(timeout);
    }, [quote, quoteLocalExpiry]);

    useEffect(() => {
        if (!quote) {
            setQuoteCountdown(null);
            return;
        }
        if (quoteLocalExpiry === null) {
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

    useEffect(() => {
        if (!showModal) {
            setOrderResult(null);
            setShareState('idle');
            setShareError(null);
        }
    }, [showModal]);

    // NOTE: signTransferAuthorization and generatePermitNonce moved to useX402 hook
    // The hook now handles the complete signature flow with autoSign=true
    // REMOVED: ensureWalletOnBase() - the EIP-712 signature includes chainId, wallet handles network via its own UX

    // NEW: Updated executeX402Purchase to use useX402 hook with proper x402 flow
    // The hook now handles: 1) Initial request 2) 402 response 3) Wallet signature popup 4) Submit with signature
    const executeX402Purchase = useCallback(async (): Promise<OrderResponse> => {
        if (!effectiveWalletAddress) {
            throw new Error("Wallet address not available for facilitator payment.");
        }

        try {
            // NOTE: No network switching here - wallet will handle network via EIP-712 chainId
            
            console.log(`🚀 [x402] Starting ${tokenSymbol} payment: ${usdAmount} USDC for ${effectiveWalletAddress}`);

            // Use the useX402 hook for the complete payment flow
            // This will: 1) Send initial request, 2) Get 402 + requirements, 
            // 3) Trigger wallet signature popup (autoSign=true), 4) Submit signed payment
            // CRITICAL: Pass tokenSymbol to ensure correct token swap (VOT vs MAXX)
            const result = await initiateX402Payment(
                usdAmount.toString(), 
                effectiveWalletAddress,
                tokenSymbol.toUpperCase() as 'VOT' | 'MAXX'
            );
            
            // If result is returned, payment was successful
            if (result && typeof result === 'object' && 'success' in result) {
                console.log('✅ [x402] Payment result:', result);
                return {
                    success: result.success,
                    message: result.message,
                    error: result.error,
                    receipt: result.receipt || null,
                    payout: result.payout || null,
                    conversion: result.conversion || null,
                    settlementTxHash: result.settlementTxHash || result.txHash,
                    bonusTxHash: result.bonusTxHash || null, // VOT bonus for MAXX
                    paymentHash: result.txHash,
                    quote,
                    source: isMiniApp ? "farcaster-miniapp" : "web"
                };
            }
            
            // If no result, hook is still processing (shouldn't reach here with autoSign=true)
            return {
                success: true,
                message: "Payment initiated - awaiting confirmation",
                quote,
                source: isMiniApp ? "farcaster-miniapp" : "web"
            };

        } catch (error) {
            // Handle errors (user rejected signature, network issues, etc.)
            const errorMessage = error instanceof Error ? error.message : 'Payment failed';
            console.error('❌ [x402] Payment error:', errorMessage);
            
            return {
                success: false,
                error: errorMessage,
                quote,
                source: isMiniApp ? "farcaster-miniapp" : "web"
            };
        }
    }, [
        // Essential dependencies for payment logic
        effectiveWalletAddress, 
        isMiniApp, 
        quote, 
        usdAmount, 
        tokenSymbol, // CRITICAL: Added for correct token routing (VOT vs MAXX)
        // x402 hook function
        initiateX402Payment
    ]);

    const payoutDetails = orderResult?.payout as { status?: string; txHash?: string; votFormatted?: number } | null;
    const conversionDetails = orderResult?.conversion as { success?: boolean; error?: string } | null;
    const settlementStatus = orderResult?.receipt?.status ?? (orderResult?.success ? 'processed' : 'pending');
    const payoutConfirmation = payoutDetails && payoutDetails.status === 'sent' ? payoutDetails : null;
    const conversionIssue = conversionDetails && conversionDetails.success === false ? conversionDetails : null;
    
    // Auto-close trigger: DISABLED - keep modal open until user manually closes
    // const shouldAutoClose = orderResult?.success && settlementStatus === 'processed' && showModal;

    // Memoize expensive UI computations
    const progressPercentage = useMemo(() => {
        switch (settlementStatus) {
            case 'pending': return 33;
            case 'confirming': return 66;
            case 'processed': return 100;
            default: return 0;
        }
    }, [settlementStatus]);

    // Memoize celebration content to prevent unnecessary re-renders
    const celebrationContent = useMemo(() => {
        if (settlementStatus !== 'processed') return null;
        
        return {
            title: '𒇻𒁹 Payment Complete!',
            subtitle: 'Intelligence Access Granted',
            amount: formatTokenAmount(quote, displayToken),
            token: displayToken
        };
    }, [settlementStatus, quote, displayToken]);

    // Memoize modal handlers to prevent unnecessary re-renders
    const openModal = useCallback(() => {
        setShareState('idle');
        setShareError(null);
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setIsSubmitting(false);
        setOrderResult(null);
        setShareState('idle');
        setShareError(null);
    }, []);

    // Auto-close modal DISABLED - User requested modal stays open until manually closed
    // useEffect(() => {
    //     if (shouldAutoClose) {
    //         // Show success briefly, then close
    //         const timer = setTimeout(() => {
    //             closeModal();
    //             // Show success toast/notification
    //             if (typeof window !== 'undefined') {
    //                 // You can integrate with your toast system here
    //                 console.log('✅ x402 payment completed successfully!');
    //             }
    //         }, 3000); // Close after 3 seconds
    //         
    //         return () => clearTimeout(timer);
    //     }
    // }, [shouldAutoClose, closeModal]);

    const handleSubmit = async () => {
        if (!quote || quoteExpired) {
            setOrderResult({ success: false, error: "Quote expired. Please refresh and try again.", quote });
            return;
        }

        if (!effectiveWalletAddress) {
            if (openConnectModal && !isMiniApp) {
                openConnectModal();
            }
            setOrderResult({
                success: false,
                error: "No wallet detected. Connect a wallet or launch from the Farcaster mini-app."
            });
            return;
        }

        try {
            setIsSubmitting(true);
            setOrderResult(null);
            const result = await executeX402Purchase();
            setOrderResult(result);

            // Refresh balances after successful purchase
            if (result.success) {
                setTimeout(() => {
                    refetchUsdcBalance();
                    refetchVotBalance();
                }, 2000); // Wait 2 seconds for blockchain confirmation

                // Store settlement reference in localStorage AND pin encrypted to IPFS
                if (typeof window !== 'undefined' && result.settlementTxHash) {
                    const settlementRecord = {
                        txHash: result.settlementTxHash,
                        receiptId: result.receipt?.id,
                        votAmount: result.votAmount || formatTokenAmount(quote, displayToken),
                        usdAmount: usdAmount,
                        wallet: effectiveWalletAddress,
                        timestamp: new Date().toISOString(),
                        network: 'base',
                        votPriceUSD: result.votPriceUSD,
                        facilitator: result.facilitator
                    };

                    try {
                        // Store locally first
                        const txHistory = JSON.parse(localStorage.getItem('vot_tx_history') || '[]');
                        txHistory.unshift(settlementRecord);
                        // Keep last 20 transactions
                        localStorage.setItem('vot_tx_history', JSON.stringify(txHistory.slice(0, 20)));
                        console.log('[X402] Settlement reference stored locally:', result.settlementTxHash);

                        // Pin encrypted copy to IPFS (async, don't block UI)
                        fetch('/api/ipfs/pin-settlement', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(settlementRecord)
                        }).then(async (ipfsRes) => {
                            if (ipfsRes.ok) {
                                const ipfsData = await ipfsRes.json();
                                console.log('[X402] Settlement pinned to IPFS (encrypted):', ipfsData.cid);
                                // Store CID alongside local record
                                const updatedHistory = JSON.parse(localStorage.getItem('vot_tx_history') || '[]');
                                const txIndex = updatedHistory.findIndex((tx: { txHash: string }) => tx.txHash === result.settlementTxHash);
                                if (txIndex >= 0) {
                                    updatedHistory[txIndex].ipfsCid = ipfsData.cid;
                                    localStorage.setItem('vot_tx_history', JSON.stringify(updatedHistory));
                                }
                            }
                        }).catch((ipfsErr) => {
                            console.warn('[X402] IPFS pin failed (local copy preserved):', ipfsErr);
                        });
                    } catch (storageError) {
                        console.warn('[X402] Could not store tx reference:', storageError);
                    }
                }
            }

            if (orderEndpoint && orderEndpoint !== x402Endpoint) {
                const loggingPayload = {
                    usdAmount,
                    walletAddress: effectiveWalletAddress,
                    quoteExpiresAt: quote.expiresAt,
                    farcasterFid,
                    source: result.source,
                    custodyWalletFallback: !address && !!custodyAddress,
                    purchaserWallet: effectiveWalletAddress,
                    x402ReceiptId: result.receipt?.id,
                    paymentHash: result.paymentHash,
                    settlementTxHash: result.settlementTxHash
                };

                fetch(orderEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(loggingPayload)
                }).catch((loggingError) => {
                    console.warn("[X402GaslessOrderPanel] Logging endpoint failed", loggingError);
                });
            }
        } catch (err) {
            let message = err instanceof Error ? err.message : "Order failed";
            if (message === "Failed to fetch") {
                message = "Unable to reach the facilitator. Double-check your connection or try again from the Farcaster mini-app.";
            }
            setOrderResult({
                success: false,
                error: message,
                message,
                quote,
                source: isMiniApp ? "farcaster-miniapp" : "web"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShareCast = useCallback(async () => {
        if (!orderResult?.receipt || !isMiniApp) {
            return;
        }

        const shareQuote = orderResult.quote ?? quote;
        const usdValue = typeof shareQuote?.usdAmount === "number" ? shareQuote.usdAmount : usdAmount;
        const votValue = typeof shareQuote?.votAmount === "number" ? shareQuote.votAmount : undefined;
        const reference = orderResult.receipt.id;
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mcpvot.xyz';
        const txHash = orderResult?.settlementTxHash || orderResult?.paymentHash || '';

        try {
            setShareState('posting');
            setShareError(null);
            const lines = [
                `𒇻 MCPVOT.xyz Facilitator • $${usdValue.toFixed(2)} USDC → ${votValue ? `${votValue.toLocaleString()} $VOT` : '$VOT'} gasless`,
                `Reference #${reference} • Treasury covered gas`,
                txHash ? `𒉿 View TX: basescan.org/tx/${txHash.slice(0, 10)}...` : '',
                ``,
                `#VOT #x402 #Base`
            ].filter(Boolean);
            
            // Embed only the app URL to show mini-app frame preview
            await sdk.actions.composeCast({
                text: lines.join('\n'),
                embeds: [origin]
            });
            setShareState('posted');
        } catch (error) {
            console.error('[X402GaslessOrderPanel] Failed to compose cast', error);
            setShareState('error');
            setShareError('Unable to share transaction. Try again in a few seconds.');
        }
    }, [isMiniApp, orderResult, quote, usdAmount]);

    const modalTitle = modalTitleFormatter
        ? modalTitleFormatter(usdAmount, tokenSymbol, displayToken)
        : `Confirm x402 Payment`;

    const gradientClasses = deriveGradientClasses(gradientStyle);
    const palette = useMemo(() => derivePaletteTokens(gradientStyle), [gradientStyle]);
    const disclaimersToRender = disclaimers ?? getDefaultDisclaimers(tokenSymbol);
    const tickerStyleVariables = useMemo(
        () => ({ "--ticker-shadow": palette.tickerShadow } as CSSProperties),
        [palette.tickerShadow]
    );
    const tickerItems = useMemo(
        () => Array.from({ length: 6 }, (_, index) => TICKER_FRAGMENTS[index % TICKER_FRAGMENTS.length]),
        []
    );

    return (
        <section
            className={`relative overflow-hidden rounded-3xl border ${gradientClasses} ${backgroundClassName} p-5 sm:p-6 backdrop-blur-xl`}
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-16 -left-24 h-48 w-48 rounded-full bg-cyan-500/25 blur-3xl" />
                <div className="absolute -bottom-12 right-[-60px] h-56 w-56 rounded-full bg-blue-500/25 blur-3xl" />
            </div>

            <div className="relative z-10 space-y-6">
                <div
                    className={`relative overflow-hidden rounded-2xl px-5 py-2 ${palette.tickerContainerClasses}`}
                    style={tickerStyleVariables}
                >
                    <div className={`pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r ${palette.tickerGradientLeft} to-transparent`} />
                    <div className={`pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l ${palette.tickerGradientRight} to-transparent`} />
                    <div className="ticker-wrapper">
                        <div className="ticker-track">
                            {tickerItems.map((item, index) => (
                                <span
                                    key={`ticker-item-${index}`}
                                    className={`ticker-item font-mono text-[11px] uppercase tracking-[0.22em] sm:text-sm sm:tracking-[0.3em] leading-[1.4] ${palette.tickerTextClass}`}
                                    aria-hidden={index > 0}
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex-1 min-w-0 space-y-2">
                        <h2
                            className={`break-words font-mono font-extrabold uppercase leading-[1.05] text-3xl tracking-[0.18em] sm:text-4xl sm:tracking-[0.22em] md:text-5xl md:tracking-[0.24em] ${palette.headerTitleClass}`}
                        >
                            {headerTitle ?? `${displayToken} Facilitator`}
                        </h2>
                        <p
                            className={`max-w-3xl break-words font-mono uppercase tracking-[0.18em] text-sm leading-relaxed sm:text-base sm:tracking-[0.22em] md:text-lg md:tracking-[0.24em] ${palette.headerSubtitleClass}`}
                        >
                            {description ?? `Convert USDC into ${displayToken} using the x402 facilitator.`}
                        </p>
                    </div>
                    {highlightBadge && (
                        <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-mono uppercase tracking-[0.35em] ${palette.highlightBadgeClass}`}>
                            <span className="inline-block h-3 w-3 rounded-full bg-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.75)]" />
                            {highlightBadge}
                        </div>
                    )}
                </header>

                {farcasterNote && (
                    <div className={`rounded-2xl px-4 py-3 text-sm ${palette.infoCardClasses} ${palette.infoPrimaryTextClass}`}>
                        {farcasterNote}
                    </div>
                )}

                {(isMiniApp || effectiveWalletDisplay) && (
                    <div className={`rounded-2xl px-4 py-3 text-sm ${palette.infoCardClasses} ${palette.infoPrimaryTextClass}`}>
                        <p className="flex flex-wrap items-center gap-x-1 gap-y-1">
                            <span className={`font-semibold ${palette.accentTextClass}`}>
                                {isMiniApp ? "Farcaster mini-app mode active." : "Wallet context"}
                            </span>
                            {effectiveWalletDisplay ? (
                                <span>
                                    {walletSourceLabel ?? "Detected wallet"}:{" "}
                                    <span className="font-mono text-white text-base">{effectiveWalletDisplay}</span>
                                </span>
                            ) : (
                                <span>Connect a wallet or confirm from Farcaster to continue.</span>
                            )}
                            {typeof farcasterFid === "number" && farcasterFid > 0 && (
                                <span className={`${palette.accentTextClass} opacity-80`}>FID #{farcasterFid}</span>
                            )}
                        </p>
                    </div>
                )}

                {walletAddressForQuery && (
                    <div className={`rounded-2xl px-4 py-3 text-sm ${palette.statusCardClasses}`}>
                        {usdcBalanceLoading ? (
                            <span className={palette.statusNeutralTextClass}>Checking USDC balance…</span>
                        ) : hasSufficientUsdc ? (
                            <span className={`${palette.statusPositiveTextClass} text-base font-semibold`}>✓ Balance check passed — {usdcBalance.toFixed(2)} USDC available.</span>
                        ) : (
                            <span className={`${palette.statusNegativeTextClass} text-base`}>⚠️ Add at least ${usdAmount.toFixed(2)} USDC to this wallet (current balance {usdcBalance.toFixed(2)}).</span>
                        )}
                    </div>
                )}

                <div className="grid gap-5 md:grid-cols-[minmax(200px,260px)_1fr]">
                    <div className="space-y-4">
                        <label
                            htmlFor={`${tokenSymbol}-usd-amount`}
                            className="text-base font-semibold uppercase tracking-[0.22em] text-[#00FFFF]/90 drop-shadow-[0_0_12px_rgba(0,255,255,0.55)]"
                        >
                            Select USDC Amount
                        </label>
                        <select
                            id={`${tokenSymbol}-usd-amount`}
                            value={usdAmount}
                            onChange={(event) => setUsdAmount(parseFloat(event.target.value))}
                            className="w-full rounded-xl border border-[#00FFFF]/50 bg-black/70 px-4 py-4 font-mono text-lg text-[#00FFFF] outline-none transition focus:border-[#00FF88] focus:ring-2 focus:ring-[#00FF88]/40"
                        >
                            {usdOptions.map((option) => (
                                <option key={option} value={option}>
                                    ${option}
                                </option>
                            ))}
                        </select>
                        <p className="text-base text-[#00FF88]/85 font-mono tracking-[0.16em] uppercase">
                            {primerDescription ?? "Treasury covers gas automatically once the facilitator confirms."}
                        </p>
                        {quoteInstructions?.top && (
                            <p className="text-sm text-[#00FFFF]/65 font-mono tracking-[0.16em] uppercase">{quoteInstructions.top}</p>
                        )}
                        <button
                            type="button"
                            onClick={openModal}
                            disabled={!hasSufficientUsdc || !effectiveWalletAddress}
                            className={`w-full group relative overflow-hidden rounded-xl border px-5 py-4 text-base font-semibold transition-all duration-300 ${!effectiveWalletAddress
                                ? "border-orange-500/50 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20"
                                : hasSufficientUsdc
                                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                                    : "border-red-500/50 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {!effectiveWalletAddress ? (
                                    <>
                                        <span className="animate-pulse">𒄿</span>
                                        <span>Connect Wallet to Start</span>
                                    </>
                                ) : hasSufficientUsdc ? (
                                    <>
                                        <span className="animate-pulse">𒇲</span>
                                        <span>{ctaLabel}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>⚠️</span>
                                        <span>Insufficient USDC Balance</span>
                                    </>
                                )}
                            </span>
                            {hasSufficientUsdc && effectiveWalletAddress && (
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            )}
                        </button>
                    </div>

                    <div className="rounded-2xl border border-[#00FFFF]/45 bg-gradient-to-br from-[#001a1a] via-[#002a2a]/80 to-[#001a1a] p-5 text-sm text-[#00FFFF]/90 backdrop-blur-sm shadow-[0_0_25px_rgba(0,255,255,0.18)]">
                        {quoteLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-pulse text-[#00FF88]/80 text-base">Fetching quote...</div>
                            </div>
                        ) : error ? (
                            <div className="rounded-lg border border-[#FF4D6D]/50 bg-[#FF4D6D]/15 p-4 text-[#FFB3C1] text-base">{error}</div>
                        ) : quote ? (
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2 border-b border-cyan-500/20 pb-4">
                                    <span className="text-sm font-medium uppercase tracking-wider text-cyan-300/70">Estimated {displayToken}</span>
                                    <span className="text-4xl sm:text-5xl font-bold text-[#00FFFF] tracking-tight drop-shadow-[0_0_20px_rgba(0,255,255,0.6)]">{formatTokenAmount(quote, displayToken)}</span>
                                </div>

                                <div className="space-y-3">
                                    {formatPricePerToken(quote) && (
                                        <div className="flex items-center justify-between py-2 text-[#00FFFF]/75">
                                            <span className="uppercase tracking-[0.18em] text-sm">Spot Price</span>
                                            <span className="font-mono text-base text-[#00FF88]">${formatPricePerToken(quote)} / {displayToken}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between py-2 text-[#00FFFF]/75">
                                        <span className="uppercase tracking-[0.18em] text-sm">Treasury Gas Cover</span>
                                        <span className="font-mono text-base text-[#00FF88]">${quote.vaultGasCoverUsd.toFixed(2)}</span>
                                    </div>
                                    {typeof quote.priceSource === "string" && quote.priceSource.length > 0 && (
                                        <div className="flex items-center justify-between py-2 text-[#00FFFF]/60">
                                            <span className="uppercase tracking-[0.18em] text-sm">Price feed</span>
                                            <span className="font-mono text-sm text-[#00FF88] uppercase">{quote.priceSource}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between rounded-lg border border-[#00FFFF]/30 bg-[#00FFFF]/10 px-4 py-3 text-[#00FFFF]/75">
                                    <span className="text-sm uppercase tracking-[0.18em]">Quote expires</span>
                                    <div className="flex items-center gap-3">
                                        {quoteCountdown !== null && (
                                            <span className="text-sm font-mono uppercase tracking-[0.2em] text-[#00FF88]">
                                                {quoteCountdown > 0 ? `${quoteCountdown}s` : 'refreshing'}
                                            </span>
                                        )}
                                        <time className="text-sm font-mono text-[#00FF88]" dateTime={quote.expiresAt}>
                                            {new Date(quote.expiresAt).toLocaleTimeString()}
                                        </time>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-8 text-cyan-200/70 text-base">
                                {emptyStateText ?? "Select an amount to start the conversion."}
                            </div>
                        )}
                        {quoteInstructions?.bottom && (
                            <p className="mt-4 text-sm leading-relaxed text-[#00FFFF]/60 font-mono tracking-[0.16em] uppercase">{quoteInstructions.bottom}</p>
                        )}
                    </div>
                </div>

                <ul className="space-y-2 text-sm text-[#00FFFF]/65 font-mono tracking-[0.14em] uppercase">
                    {disclaimersToRender.map((item, index) => (
                        <li key={index}>• {item}</li>
                    ))}
                </ul>
            </div>

            <style jsx>{`
                .ticker-wrapper {
                    overflow: hidden;
                }
                .ticker-track {
                    display: inline-flex;
                    align-items: center;
                    gap: clamp(2.5rem, 8vw, 4.5rem);
                    min-width: 100%;
                    animation: tickerScroll 30s linear infinite;
                    will-change: transform;
                }
                .ticker-track:hover {
                    animation-play-state: paused;
                }
                .ticker-item {
                    white-space: nowrap;
                    color: #c8ffff;
                    text-shadow: 0 0 18px var(--ticker-shadow, rgba(0, 255, 255, 0.76));
                }
                @keyframes tickerScroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                .animation-delay-200 {
                    animation-delay: 200ms;
                }
                .animation-delay-400 {
                    animation-delay: 400ms;
                }
                @media (prefers-reduced-motion: reduce) {
                    .ticker-track {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transform: translateX(0) !important;
                    }
                }
            `}</style>

            {/* Enhanced Success notification outside modal */}
            {orderResult?.success && settlementStatus === 'processed' && !showModal && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-700">
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-emerald-100 shadow-2xl shadow-emerald-500/20 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl animate-bounce">𒇻</div>
                            <div className="flex-1">
                                <div className="font-bold text-emerald-300 text-sm mb-1">Payment Successful!</div>
                                
                                {/* Enhanced VOT Amount Display */}
                                <div className="text-emerald-200/80 mb-2">
                                    <div className="text-lg font-mono font-bold text-white">{formatTokenAmount(quote, displayToken)} {displayToken}</div>
                                    <div className="text-xs text-emerald-200/60">Successfully Delivered</div>
                                </div>
                                
                                {/* Enhanced Transaction Information */}
                                {orderResult.settlementTxHash && (
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-emerald-200/60 font-mono break-all bg-black/30 px-2 py-1 rounded">
                                            Tx: {orderResult.settlementTxHash.slice(0, 12)}...{orderResult.settlementTxHash.slice(-8)}
                                        </div>
                                        <a 
                                            href={`https://basescan.org/tx/${orderResult.settlementTxHash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-full transition-colors text-[10px] border border-emerald-500/40"
                                        >
                                            <span>🔍</span>
                                            <span>View Transaction</span>
                                        </a>
                                    </div>
                                )}
                                
                                <div className="text-[8px] text-emerald-200/50 mt-2">Click outside to dismiss</div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-emerald-300 hover:text-emerald-100 text-sm"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Animated border for extra attention */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse"></div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-cyan-500/40 bg-black/90 text-cyan-100 shadow-xl">
                        {/* Fixed Close Button - Always Visible */}
                        <button
                            type="button"
                            onClick={closeModal}
                            className="absolute right-3 top-3 z-10 flex items-center justify-center w-8 h-8 rounded-full border border-cyan-500/40 bg-black/80 text-cyan-200 hover:bg-cyan-500/30 hover:text-white transition-all shadow-lg"
                            aria-label="Close modal"
                        >
                            ✕
                        </button>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">x402 Facilitator</div>
                                <h3 className="text-2xl font-semibold text-white">{modalTitle}</h3>
                                <p className="mt-2 text-sm text-cyan-200/70">
                                    Confirm to notify the Coinbase facilitator. Treasury covers gas once the facilitator settles on-chain.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs text-cyan-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-cyan-200/60">USD Amount</span>
                                    <span className="font-mono text-sm text-white">${usdAmount.toFixed(2)}</span>
                                </div>
                                {quote && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-cyan-200/60">Estimated {displayToken}</span>
                                        <span className="font-mono text-sm text-white">{formatTokenAmount(quote, displayToken)}</span>
                                    </div>
                                )}
                                {effectiveWalletDisplay ? (
                                    <div className="flex items-center justify-between">
                                        <span className="text-cyan-200/60">Wallet</span>
                                        <span className="font-mono text-sm text-white">{effectiveWalletDisplay}</span>
                                    </div>
                                ) : (
                                    <div className="text-red-300">Wallet not detected. Connect before submitting.</div>
                                )}
                                {walletAddressForQuery && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-cyan-200/60">USDC Balance</span>
                                        <span className={`font-mono text-sm ${hasSufficientUsdc ? "text-emerald-300" : "text-red-300"}`}>
                                            {usdcBalance.toFixed(2)} USDC
                                        </span>
                                    </div>
                                )}
                                {walletAddressForQuery && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-cyan-200/60">VOT Balance</span>
                                        <span className="font-mono text-sm text-purple-300">
                                            {votBalanceLoading ? "..." : votBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} VOT
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-cyan-200/60">Quote expires</span>
                                    <span className="font-mono text-xs text-cyan-100">
                                        {quote ? new Date(quote.expiresAt).toLocaleTimeString() : "--"}
                                    </span>
                                </div>
                                {typeof farcasterFid === "number" && farcasterFid > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-cyan-200/60">FID</span>
                                        <span className="font-mono text-sm text-white">#{farcasterFid}</span>
                                    </div>
                                )}
                            </div>

                            {orderResult ? (
                                <div className={`rounded-2xl border p-4 transition-all duration-700 relative overflow-hidden ${
                                    orderResult.success && settlementStatus === 'processed' 
                                        ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 to-emerald-900/20 shadow-[0_0_30px_rgba(16,185,129,0.25)]' 
                                        : settlementStatus === 'pending' ? 'border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-yellow-900/15' 
                                        : settlementStatus === 'confirming' ? 'border-blue-500/40 bg-gradient-to-br from-blue-500/10 to-blue-900/15'
                                        : 'border-cyan-500/30 bg-cyan-500/10'
                                }`}>
                                    {/* Enhanced animated background for processing states */}
                                    {(settlementStatus === 'pending' || settlementStatus === 'confirming') && (
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute inset-0 opacity-20">
                                                <div className="absolute w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite] transform -skew-x-12"></div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                                        </div>
                                    )}
                                    {/* Success celebration effect */}
                                    {orderResult.success && settlementStatus === 'processed' && (
                                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                            <div className="absolute -top-2 -left-2 w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-30"></div>
                                            <div className="absolute -top-1 -right-3 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-30 animation-delay-200"></div>
                                            <div className="absolute -bottom-1 left-1/4 w-2 h-2 bg-emerald-300 rounded-full animate-ping opacity-30 animation-delay-400"></div>
                                        </div>
                                    )}
                                    
                                    {/* Status Progress Bar - Enhanced */}
                                    {settlementStatus !== 'processed' && (
                                        <div className="mb-4 relative">
                                            <div className="flex justify-between text-xs text-cyan-200/70 mb-2 font-mono tracking-wider">
                                                <span className={settlementStatus === 'pending' ? 'text-yellow-300' : 'text-cyan-200/50'}>① Initiated</span>
                                                <span className={settlementStatus === 'confirming' ? 'text-blue-300' : 'text-cyan-200/50'}>② Processing</span>
                                                <span className="text-cyan-200/50">③ Complete</span>
                                            </div>
                                            <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden border border-cyan-500/20">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                                                        progressPercentage === 33 ? 'w-1/3 bg-gradient-to-r from-yellow-500 to-yellow-400' :
                                                        progressPercentage === 66 ? 'w-2/3 bg-gradient-to-r from-yellow-400 via-blue-400 to-blue-500' :
                                                        progressPercentage === 100 ? 'w-full bg-gradient-to-r from-yellow-400 via-blue-400 to-emerald-400' :
                                                        'w-0 bg-transparent'
                                                    }`}
                                                >
                                                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/40 animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-center">
                                                <span className="text-xs font-mono text-cyan-200/60 animate-pulse">
                                                    {settlementStatus === 'pending' && (tokenSymbol === 'VOT' 
                                                        ? '𒄿 x402: USDC transfer pending...'
                                                        : '𒄿 x402: USDC transfer pending...')}
                                                    {settlementStatus === 'confirming' && (tokenSymbol === 'VOT'
                                                        ? '𒇲 Sending VOT from treasury inventory!'
                                                        : '𒅗 Swapping USDC → ETH → MAXX on KyberSwap...')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {orderResult.success ? (
                                        <div className="space-y-4">
                                            {celebrationContent && (
                                                <div className="text-center animate-in slide-in-from-top duration-500">
                                                    <div className="text-4xl mb-3 animate-bounce">𒇻𒁹𒇲</div>
                                                    <div className="text-xl font-bold text-emerald-300 uppercase tracking-[0.25em] drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]">{celebrationContent.title}</div>
                                                    <div className="text-sm text-emerald-200/90 mt-2 tracking-wide">{celebrationContent.subtitle}</div>
                                                    
                                                    {/* Enhanced VOT Amount Display */}
                                                    <div className="mt-5 space-y-4">
                                                        <div className="p-5 bg-gradient-to-br from-emerald-500/25 to-emerald-900/30 rounded-2xl border border-emerald-400/50 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                                                            <div className="text-xs text-emerald-300 uppercase tracking-[0.2em] mb-2 font-mono">✓ Amount Received</div>
                                                            <div className="text-3xl font-mono font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                                                {celebrationContent.amount}
                                                            </div>
                                                            <div className="text-sm text-emerald-300 mt-2 font-bold tracking-wider">{celebrationContent.token}</div>
                                                            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-200/70">
                                                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                                                <span>Delivered to your wallet</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* MAXX Settlement Transaction */}
                                                        {orderResult.settlementTxHash && (
                                                            <div className="p-3 bg-black/30 rounded-lg border border-emerald-500/30">
                                                                <div className="text-xs text-emerald-300 uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
                                                                    <span className="animate-bounce">𒁹</span>
                                                                    {displayToken === 'MAXX' ? 'MAXX Transfer' : 'VOT Transfer'}
                                                                </div>
                                                                <div className="font-mono text-sm text-emerald-100 break-all mb-2">
                                                                    {orderResult.settlementTxHash.slice(0, 14)}...{orderResult.settlementTxHash.slice(-10)}
                                                                </div>
                                                                <a
                                                                    href={`https://basescan.org/tx/${orderResult.settlementTxHash}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-full transition-colors border border-emerald-500/40"
                                                                >
                                                                    <span className="text-xs">𒆜 View on BaseScan</span>
                                                                </a>
                                                            </div>
                                                        )}
                                                        
                                                        {/* VOT Bonus Transaction (MAXX flow only) */}
                                                        {displayToken === 'MAXX' && orderResult.bonusTxHash && (
                                                            <div className="p-3 bg-black/30 rounded-lg border border-purple-500/30 mt-2">
                                                                <div className="text-xs text-purple-300 uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
                                                                    <span className="animate-pulse">𒋼</span>
                                                                    <span>+10,000 VOT Bonus</span>
                                                                    <span className="animate-spin">𒇲</span>
                                                                </div>
                                                                <div className="font-mono text-sm text-purple-100 break-all mb-2">
                                                                    {orderResult.bonusTxHash.slice(0, 14)}...{orderResult.bonusTxHash.slice(-10)}
                                                                </div>
                                                                <a
                                                                    href={`https://basescan.org/tx/${orderResult.bonusTxHash}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-full transition-colors border border-purple-500/40"
                                                                >
                                                                    <span className="text-xs">𒁕 View Bonus TX</span>
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {settlementStatus === 'pending' && (
                                                <div className="text-center">
                                                    <div className="text-3xl mb-2 flex items-center justify-center gap-2">
                                                        <span className="animate-bounce">𒇲</span>
                                                        <span className="animate-pulse">𒄿</span>
                                                        <span className="animate-bounce delay-100">𒁹</span>
                                                    </div>
                                                    <div className="text-sm font-bold text-yellow-300 uppercase tracking-[0.2em]">Processing Payment</div>
                                                    <div className="text-xs text-yellow-200/80 mt-1">
                                                        {displayToken === 'VOT' 
                                                            ? '𒇲 Receiving USDC via x402 protocol...'
                                                            : '𒇲 Receiving USDC via x402 protocol...'}
                                                    </div>
                                                </div>
                                            )}
                                            {settlementStatus === 'confirming' && (
                                                <div className="text-center">
                                                    <div className="text-3xl mb-2 flex items-center justify-center gap-2">
                                                        <span className="animate-spin">𒅗</span>
                                                        <span className="animate-pulse">𒄿</span>
                                                        <span className="animate-bounce">𒁹</span>
                                                    </div>
                                                    <div className="text-sm font-bold text-blue-300 uppercase tracking-[0.2em]">
                                                        {displayToken === 'VOT' ? '𒇲 Delivering VOT' : '𒁹 Swapping to MAXX'}
                                                    </div>
                                                    <div className="text-xs text-blue-200/80 mt-1">
                                                        {displayToken === 'VOT' 
                                                            ? '𒂗 Sending VOT to your wallet instantly!'
                                                            : '𒋼 USDC → ETH → MAXX via KyberSwap...'}
                                                    </div>
                                                    {displayToken === 'MAXX' && (
                                                        <div className="text-xs text-purple-200/70 mt-2 flex items-center justify-center gap-1">
                                                            <span className="animate-pulse">𒋼</span>
                                                            <span>+ 10,000 VOT bonus incoming!</span>
                                                            <span className="animate-bounce">𒇲</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.2em] text-cyan-300 border-b border-cyan-500/30 pb-2 flex items-center gap-2">
                                                    <span>𒀸</span>
                                                    <span>Order Details</span>
                                                </div>
                                                <div className="space-y-3 mt-3">
                                                    <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
                                                        <span className="text-cyan-200/60 text-xs font-mono">Receipt ID</span>
                                                        <span className="font-mono text-sm text-white break-all max-w-[180px] truncate bg-cyan-500/10 px-2 py-1 rounded" title={orderResult.receipt?.id ?? 'Receipt pending'}>
                                                            {orderResult.receipt?.id ?? '𒄿 Pending...'}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                                        <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all hover:scale-[1.02]">
                                                            <div className="text-cyan-200/50 mb-1 flex items-center gap-1">
                                                                <span>𒄿</span> Status
                                                            </div>
                                                            <div className={`font-mono font-bold text-sm flex items-center gap-2 ${
                                                                settlementStatus === 'processed' ? 'text-emerald-300' :
                                                                settlementStatus === 'pending' ? 'text-yellow-300' :
                                                                settlementStatus === 'confirming' ? 'text-blue-300' : 'text-cyan-200'
                                                            }`}>
                                                                <span className={`w-2 h-2 rounded-full ${
                                                                    settlementStatus === 'processed' ? 'bg-emerald-400' :
                                                                    settlementStatus === 'pending' ? 'bg-yellow-400 animate-pulse' :
                                                                    'bg-blue-400 animate-pulse'
                                                                }`}></span>
                                                                {settlementStatus === 'processed' ? '✓ Complete' : settlementStatus}
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all hover:scale-[1.02]">
                                                            <div className="text-cyan-200/50 mb-1 flex items-center gap-1">
                                                                <span>𒂗</span> Facilitator
                                                            </div>
                                                            <div className="font-mono text-white text-sm">x402 CDP</div>
                                                        </div>
                                                        <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all hover:scale-[1.02]">
                                                            <div className="text-cyan-200/50 mb-1 flex items-center gap-1">
                                                                <span>𒁹</span> Amount
                                                            </div>
                                                            <div className="font-mono text-white text-sm">${orderResult.receipt?.usdAmount !== undefined ? orderResult.receipt.usdAmount.toFixed(2) : usdAmount.toFixed(2)} USDC</div>
                                                        </div>
                                                        <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all hover:scale-[1.02]">
                                                            <div className="text-cyan-200/50 mb-1 flex items-center gap-1">
                                                                <span>𒉿</span> Network
                                                            </div>
                                                            <div className="font-mono text-white text-sm flex items-center gap-1">
                                                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                                                Base
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-200/70">
                                                <span className="text-cyan-200/50">Origin:</span>
                                                <span className="font-mono text-white bg-black/30 px-2 py-1 rounded">{orderResult.source ?? (isMiniApp ? 'farcaster-miniapp' : 'web')}</span>
                                                <span className="text-cyan-200/50">Requested:</span>
                                                <span className="font-mono text-white bg-black/30 px-2 py-1 rounded">
                                                    {orderResult.receipt?.timestamp ? new Date(orderResult.receipt.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                                                </span>
                                            </div>
                                            {orderResult.message && (
                                                <p className="text-xs text-cyan-200/70">{orderResult.message}</p>
                                            )}
                                            {/* Transaction Links Section - Trade History */}
                                            {orderResult.paymentHash || orderResult.settlementTxHash || payoutConfirmation?.txHash ? (
                                                <div className="mt-5 space-y-3">
                                                    <div className="text-xs uppercase tracking-[0.2em] text-cyan-300 border-b border-cyan-500/30 pb-2 flex items-center gap-2">
                                                        <span>𒅗</span>
                                                        <span>Trade History</span>
                                                        <span className="ml-auto text-[10px] text-cyan-200/50 normal-case tracking-normal">On-chain records</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {orderResult.paymentHash && (
                                                            <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/30 hover:border-cyan-400/50 transition-all hover:shadow-[0_0_20px_rgba(0,200,255,0.15)] group">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-cyan-200/70 text-xs font-mono flex items-center gap-2 mb-1">
                                                                            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                                                                            Payment Transaction
                                                                        </div>
                                                                        <div className="font-mono text-sm text-cyan-100 truncate">
                                                                            {orderResult.paymentHash.slice(0, 16)}...{orderResult.paymentHash.slice(-10)}
                                                                        </div>
                                                                    </div>
                                                                    <a
                                                                        href={`https://basescan.org/tx/${orderResult.paymentHash}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="flex items-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition-all text-xs border border-cyan-500/30 group-hover:border-cyan-400/50"
                                                                    >
                                                                        <span>BaseScan</span>
                                                                        <span>↗</span>
                                                                    </a>
                                                                </div>
                                                                <div className="mt-2 flex items-center gap-3 text-[10px] text-cyan-200/50 font-mono">
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                                                        Confirmed
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>Base Network</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {orderResult.settlementTxHash && (
                                                            <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] group">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-emerald-200/70 text-xs font-mono flex items-center gap-2 mb-1">
                                                                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                                                            Settlement Transaction
                                                                        </div>
                                                                        <div className="font-mono text-sm text-emerald-100 truncate">
                                                                            {orderResult.settlementTxHash.slice(0, 16)}...{orderResult.settlementTxHash.slice(-10)}
                                                                        </div>
                                                                    </div>
                                                                    <a
                                                                        href={`https://basescan.org/tx/${orderResult.settlementTxHash}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg transition-all text-xs border border-emerald-500/30 group-hover:border-emerald-400/50"
                                                                    >
                                                                        <span>BaseScan</span>
                                                                        <span>↗</span>
                                                                    </a>
                                                                </div>
                                                                <div className="mt-2 flex items-center gap-3 text-[10px] text-emerald-200/50 font-mono">
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                                                        Settled
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>x402 CDP</span>
                                                                    <span>•</span>
                                                                    <span>⛽ Gasless</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {payoutConfirmation?.txHash && (
                                                            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] group">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-purple-200/70 text-xs font-mono flex items-center gap-2 mb-1">
                                                                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                                                            VOT Delivery
                                                                        </div>
                                                                        <div className="font-mono text-sm text-purple-100 truncate">
                                                                            {payoutConfirmation.txHash.slice(0, 16)}...{payoutConfirmation.txHash.slice(-10)}
                                                                        </div>
                                                                    </div>
                                                                    <a
                                                                        href={`https://basescan.org/tx/${payoutConfirmation.txHash}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-all text-xs border border-purple-500/30 group-hover:border-purple-400/50"
                                                                    >
                                                                        <span>BaseScan</span>
                                                                        <span>↗</span>
                                                                    </a>
                                                                </div>
                                                                <div className="mt-2 flex items-center gap-3 text-[10px] text-purple-200/50 font-mono">
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                                                                        {typeof payoutConfirmation.votFormatted === 'number' ? `${payoutConfirmation.votFormatted.toFixed(4)} VOT` : 'Delivered'}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>Complete</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 rounded-xl">
                                                    <div className="flex items-center gap-3 text-xs text-yellow-200/70">
                                                        <span className="text-lg animate-pulse">𒅗</span>
                                                        <span>Transaction links will appear here as they are confirmed on-chain</span>
                                                    </div>
                                                </div>
                                            )}
                                            {payoutConfirmation && (
                                                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/15 px-3 py-2 text-xs text-cyan-200/80">
                                                    Immediate payout: {typeof payoutConfirmation.votFormatted === 'number'
                                                        ? `${payoutConfirmation.votFormatted.toFixed(4)} VOT`
                                                        : 'VOT delivered'}
                                                    {payoutConfirmation.txHash ? ` • Tx ${payoutConfirmation.txHash.slice(0, 10)}…` : ''}
                                                </div>
                                            )}
                                            {conversionIssue && (
                                                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/80">
                                                    Facilitator conversion still queued: {conversionIssue.error ?? 'check Kyber route'}.
                                                </div>
                                            )}
                                            {Array.isArray(orderResult.notes) && orderResult.notes.length > 0 && (
                                                <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-cyan-200/70 space-y-1">
                                                    {orderResult.notes.map((note, index) => (
                                                        <p key={`note-${index}`}>• {note}</p>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-200/65">
                                                Need help? Share your facilitator receipt reference with support.
                                            </p>
                                            {/* Share on Farcaster - works for both mini-app and web */}
                                            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-3 text-xs text-purple-200/80 space-y-2">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="text-[10px] uppercase tracking-[0.18em] text-purple-200/70 flex items-center gap-2">
                                                        <span>𒅗</span> Share on Farcaster
                                                    </span>
                                                    {isMiniApp ? (
                                                        <button
                                                            type="button"
                                                            onClick={handleShareCast}
                                                            disabled={shareState === 'posting' || shareState === 'posted'}
                                                            className="rounded-lg border border-purple-500/40 bg-purple-500/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-100 transition hover:bg-purple-500/25 disabled:cursor-not-allowed disabled:opacity-70"
                                                        >
                                                            {shareState === 'posting' ? 'Sharing…' : shareState === 'posted' ? 'Cast shared' : 'Cast to Feed'}
                                                        </button>
                                                    ) : (
                                                        <a
                                                            href={(() => {
                                                                const txHash = orderResult.settlementTxHash || orderResult.paymentHash || '';
                                                                const votAmt = celebrationContent?.amount || formatTokenAmount(quote, displayToken);
                                                                const text = [
                                                                    `𒇻 x402 Payment Complete!`,
                                                                    ``,
                                                                    `𒁹 $${usdAmount.toFixed(2)} USDC → ${votAmt} ${displayToken}`,
                                                                    `𒂗 Gasless via x402 CDP Facilitator`,
                                                                    ``,
                                                                    txHash ? `𒉿 TX: ${txHash.slice(0, 10)}...${txHash.slice(-8)}` : '',
                                                                    orderResult.receipt?.id ? `𒀸 Ref: ${orderResult.receipt.id}` : '',
                                                                    ``,
                                                                    `#VOT #x402 #Base`
                                                                ].filter(Boolean).join('\n');
                                                                const params = new URLSearchParams({ text });
                                                                if (txHash) params.append('embeds[]', `https://basescan.org/tx/${txHash}`);
                                                                return `https://warpcast.com/~/compose?${params.toString()}`;
                                                            })()}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-lg border border-purple-500/40 bg-purple-500/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-100 transition hover:bg-purple-500/25 inline-flex items-center gap-1"
                                                        >
                                                            <span>Share on Warpcast</span>
                                                            <span>↗</span>
                                                        </a>
                                                    )}
                                                </div>
                                                {shareState === 'posted' && (
                                                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#00FF88]">Cast published via MCPVOT.xyz facilitator.</p>
                                                )}
                                                {shareState === 'error' && shareError && (
                                                    <p className="text-[10px] uppercase tracking-[0.16em] text-red-300">{shareError}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300">
                                            {orderResult.error ?? orderResult.message ?? "Unable to complete facilitator request."}
                                        </div>
                                    )}
                                </div>
                            ) : isSubmitting || isX402Active ? (
                                <div className="flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-200/80">
                                    {isX402Active ? 'Processing x402 payment...' : 'Submitting facilitator request...'}
                                </div>
                            ) : hasX402Error ? (
                                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300">
                                    x402 Error: {x402Error}
                                </div>
                            ) : null}
                        </div>

                        {/* Fixed Footer - Always Visible at Bottom */}
                        <div className="flex-shrink-0 border-t border-cyan-500/20 bg-black/95 p-4 rounded-b-3xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { resetX402(); closeModal(); }}
                                    className="rounded-xl border border-cyan-500/30 px-6 py-2.5 text-sm text-cyan-200 transition-all hover:bg-cyan-500/10 hover:border-cyan-500/50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isX402Active || quoteExpired || !quote || !hasSufficientUsdc}
                                    className="group relative overflow-hidden rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-6 py-2.5 text-sm font-semibold text-cyan-100 transition-all hover:bg-cyan-400/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {isSubmitting ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-200 border-t-transparent" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{orderButtonLabel}</span>
                                                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                            </>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                </button>
                            </div>

                            {!hasSufficientUsdc && effectiveWalletAddress && (
                                <div className="text-xs text-red-300 mt-2">Add at least ${usdAmount.toFixed(2)} USDC to continue.</div>
                            )}

                            {quoteExpired && (
                                <div className="text-xs text-red-300 mt-2">Quote expired. Refresh the flow to continue.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default X402GaslessOrderPanel;
