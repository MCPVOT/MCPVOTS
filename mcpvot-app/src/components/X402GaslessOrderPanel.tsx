"use client";

import { sdk } from "@farcaster/miniapp-sdk";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { base } from "viem/chains";
import { useAccount, useChainId, useReadContract, useSwitchChain, useWalletClient } from "wagmi";

import {
    type PaymentRequirements as X402PaymentRequirements
} from "x402/types";

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
    facilitatorSignature?: string | null;
}

interface TransferPermit {
    from: string;
    to: string;
    value: bigint;
    validAfter: bigint;
    validBefore: bigint;
    nonce: `0x${string}`;
    signature: string;
    v: number;
    r: `0x${string}`;
    s: `0x${string}`;
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
const USDC_DECIMALS = 6;
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
    const chainId = useChainId();
    const { switchChainAsync } = useSwitchChain();
    const { data: walletClient } = useWalletClient();

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

    const hasSufficientUsdc = useMemo(() => {
        if (!walletAddressForQuery) {
            return false;
        }
        return usdcBalance + 0.000001 >= usdAmount;
    }, [usdAmount, usdcBalance, walletAddressForQuery]);

    useEffect(() => {
        if (walletAddressForQuery) {
            refetchUsdcBalance();
        }
    }, [walletAddressForQuery, usdAmount, refetchUsdcBalance]);

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

    const ensureWalletOnBase = useCallback(async () => {
        if (!walletClient) {
            throw new Error("Wallet client unavailable. Connect a Base wallet to continue.");
        }

        const currentChainId = walletClient.chain?.id ?? chainId;
        if (currentChainId === base.id) {
            return;
        }

        if (typeof switchChainAsync === "function") {
            try {
                await switchChainAsync({ chainId: base.id });
                return;
            } catch {
                throw new Error("Base network switch rejected. Approve the switch to continue the x402 payment.");
            }
        }

        throw new Error("Switch your wallet to the Base network to continue.");
    }, [walletClient, chainId, switchChainAsync]);

    const generatePermitNonce = () => {
        if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
            throw new Error("Secure random generator unavailable in this environment.");
        }
        const randomBytes = new Uint8Array(32);
        crypto.getRandomValues(randomBytes);
        return `0x${Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
    };

    const signTransferAuthorization = useCallback(async (requirements: X402PaymentRequirements): Promise<TransferPermit> => {
        if (!effectiveWalletAddress || !effectiveWalletAddress.startsWith("0x")) {
            throw new Error("Connect a wallet to sign the x402 permit.");
        }

        if (!walletClient) {
            throw new Error("Wallet client unavailable. Reconnect your wallet and try again.");
        }

        let permitValue: bigint;
        try {
            const normalized = requirements.maxAmountRequired ?? "0";
            permitValue = BigInt(normalized);
        } catch {
            throw new Error("Invalid facilitator payment amount.");
        }

        if (permitValue <= 0n) {
            throw new Error("Facilitator expects a positive payment amount.");
        }

        const payToField = Array.isArray(requirements.payTo) ? requirements.payTo[0] : requirements.payTo;
        if (typeof payToField !== "string" || !payToField.startsWith("0x")) {
            throw new Error("Facilitator instructions missing payTo destination.");
        }

        const nowSeconds = Math.floor(Date.now() / 1000);
        const timeoutSeconds = Number(requirements.maxTimeoutSeconds ?? 300);
        const validAfterSeconds = Math.max(0, nowSeconds - 600);
        const validBeforeSeconds = nowSeconds + (Number.isFinite(timeoutSeconds) ? timeoutSeconds : 300);
        const validAfter = BigInt(validAfterSeconds);
        const validBefore = BigInt(validBeforeSeconds);
        const nonce = generatePermitNonce();

        const domain = {
            name: "USD Coin",
            version: "2",
            chainId: base.id,
            verifyingContract: USDC_ADDRESS
        } as const;

        const message = {
            from: effectiveWalletAddress,
            to: payToField,
            value: permitValue,
            validAfter,
            validBefore,
            nonce
        } as const;

        const signature = await walletClient.signTypedData({
            account: effectiveWalletAddress as `0x${string}`,
            domain,
            primaryType: "TransferWithAuthorization",
            types: {
                TransferWithAuthorization: [
                    { name: "from", type: "address" },
                    { name: "to", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "validAfter", type: "uint256" },
                    { name: "validBefore", type: "uint256" },
                    { name: "nonce", type: "bytes32" }
                ]
            },
            message
        });

        const signatureBody = signature.slice(2);
        const r = `0x${signatureBody.slice(0, 64)}` as `0x${string}`;
        const s = `0x${signatureBody.slice(64, 128)}` as `0x${string}`;
        const recoveryParam = parseInt(signatureBody.slice(128, 130), 16);
        if (Number.isNaN(recoveryParam)) {
            throw new Error("Unable to derive recovery parameter from signature.");
        }
        const v = recoveryParam >= 27 ? recoveryParam : recoveryParam + 27;

        return {
            ...message,
            signature,
            r,
            s,
            v
        };
    }, [effectiveWalletAddress, walletClient]);

    // NOTE: encodePaymentHeader function removed - unused code that was causing parsing errors

    // NEW: Updated executeX402Purchase to use useX402 hook with MCP bug fixes
    const executeX402Purchase = useCallback(async (): Promise<OrderResponse> => {
        if (!effectiveWalletAddress) {
            throw new Error("Wallet address not available for facilitator payment.");
        }

        try {
            // NOTE: requestPayload code removed - unused object literal that was causing parsing errors

            // Use the useX402 hook for payment initiation
            await initiateX402Payment(usdAmount.toString(), effectiveWalletAddress);
            
            // If we get here without 402 status, payment was successful
            return {
                success: true,
                message: "Payment processed successfully",
                quote,
                source: isMiniApp ? "farcaster-miniapp" : "web"
            };

        } catch (error) {
            // Handle 402 response or other errors
            if (x402Requirements) {
                // Payment requires authorization - use the hook's submit method
                await ensureWalletOnBase();
                const permit = await signTransferAuthorization(x402Requirements);
                const result = await submitX402Payment(permit);
                
                return {
                    success: result.success,
                    message: result.message,
                    error: result.error,
                    receipt: result.receipt || null,
                    payout: result.payout || null,
                    conversion: result.conversion || null,
                    quote,
                    source: isMiniApp ? "farcaster-miniapp" : "web"
                };
            }

            // Handle other errors
            const errorMessage = error instanceof Error ? error.message : 'Payment failed';
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
        // Note: These functions should be stable (wrapped in useCallback)
        ensureWalletOnBase, 
        signTransferAuthorization
    ]);

    const payoutDetails = orderResult?.payout as { status?: string; txHash?: string; votFormatted?: number } | null;
    const conversionDetails = orderResult?.conversion as { success?: boolean; error?: string } | null;
    const settlementStatus = orderResult?.receipt?.status ?? (orderResult?.success ? 'processed' : 'pending');
    const payoutConfirmation = payoutDetails && payoutDetails.status === 'sent' ? payoutDetails : null;
    const conversionIssue = conversionDetails && conversionDetails.success === false ? conversionDetails : null;
    
    // Auto-close trigger: payment succeeded and settlement is complete
    const shouldAutoClose = orderResult?.success && settlementStatus === 'processed' && showModal;

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
            title: '🎉✨ Payment Complete!',
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

    // Auto-close modal on successful payment and show success feedback
    useEffect(() => {
        if (shouldAutoClose) {
            // Show success briefly, then close
            const timer = setTimeout(() => {
                closeModal();
                // Show success toast/notification
                if (typeof window !== 'undefined') {
                    // You can integrate with your toast system here
                    console.log('✅ x402 payment completed successfully!');
                }
            }, 3000); // Close after 3 seconds
            
            return () => clearTimeout(timer);
        }
    }, [shouldAutoClose, closeModal]);

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

        try {
            setShareState('posting');
            setShareError(null);
            const lines = [
                `🛰️ MCPVOT.xyz Facilitator • $${usdValue.toFixed(2)} USDC → ${votValue ? `${votValue.toLocaleString()} $VOT` : '$VOT'} gasless`,
                `Reference #${reference} • Treasury covered gas`,
                `Track settlement at ${origin}`
            ];
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
                            className={`break-words font-mono font-extrabold uppercase leading-[1.05] text-2xl tracking-[0.18em] sm:text-3xl sm:tracking-[0.22em] md:text-4xl md:tracking-[0.24em] ${palette.headerTitleClass}`}
                        >
                            {headerTitle ?? `${displayToken} Facilitator`}
                        </h2>
                        <p
                            className={`max-w-3xl break-words font-mono uppercase tracking-[0.18em] text-xs leading-relaxed sm:text-sm sm:tracking-[0.22em] md:text-base md:tracking-[0.24em] ${palette.headerSubtitleClass}`}
                        >
                            {description ?? `Convert USDC into ${displayToken} using the x402 facilitator.`}
                        </p>
                    </div>
                    {highlightBadge && (
                        <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.35em] ${palette.highlightBadgeClass}`}>
                            <span className="inline-block h-2 w-2 rounded-full bg-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.75)]" />
                            {highlightBadge}
                        </div>
                    )}
                </header>

                {farcasterNote && (
                    <div className={`rounded-2xl px-4 py-2 text-[11px] ${palette.infoCardClasses} ${palette.infoPrimaryTextClass}`}>
                        {farcasterNote}
                    </div>
                )}

                {(isMiniApp || effectiveWalletDisplay) && (
                    <div className={`rounded-2xl px-4 py-2 text-[11px] ${palette.infoCardClasses} ${palette.infoPrimaryTextClass}`}>
                        <p className="flex flex-wrap items-center gap-x-1 gap-y-1">
                            <span className={`font-semibold ${palette.accentTextClass}`}>
                                {isMiniApp ? "Farcaster mini-app mode active." : "Wallet context"}
                            </span>
                            {effectiveWalletDisplay ? (
                                <span>
                                    {walletSourceLabel ?? "Detected wallet"}:{" "}
                                    <span className="font-mono text-white">{effectiveWalletDisplay}</span>
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
                    <div className={`rounded-2xl px-4 py-2 text-[11px] ${palette.statusCardClasses}`}>
                        {usdcBalanceLoading ? (
                            <span className={palette.statusNeutralTextClass}>Checking USDC balance…</span>
                        ) : hasSufficientUsdc ? (
                            <span className={palette.statusPositiveTextClass}>Balance check passed — {usdcBalance.toFixed(2)} USDC available.</span>
                        ) : (
                            <span className={palette.statusNegativeTextClass}>Add at least ${usdAmount.toFixed(2)} USDC to this wallet (current balance {usdcBalance.toFixed(2)}).</span>
                        )}
                    </div>
                )}

                <div className="grid gap-5 md:grid-cols-[minmax(180px,220px)_1fr]">
                    <div className="space-y-3">
                        <label
                            htmlFor={`${tokenSymbol}-usd-amount`}
                            className="text-sm font-semibold uppercase tracking-[0.22em] text-[#00FFFF]/90 drop-shadow-[0_0_12px_rgba(0,255,255,0.55)]"
                        >
                            Select USDC Amount
                        </label>
                        <select
                            id={`${tokenSymbol}-usd-amount`}
                            value={usdAmount}
                            onChange={(event) => setUsdAmount(parseFloat(event.target.value))}
                            className="w-full rounded-xl border border-[#00FFFF]/50 bg-black/70 px-3 py-3 font-mono text-[#00FFFF] outline-none transition focus:border-[#00FF88] focus:ring-2 focus:ring-[#00FF88]/40"
                        >
                            {usdOptions.map((option) => (
                                <option key={option} value={option}>
                                    ${option}
                                </option>
                            ))}
                        </select>
                        <p className="text-sm text-[#00FF88]/85 font-mono tracking-[0.16em] uppercase">
                            {primerDescription ?? "Treasury covers gas automatically once the facilitator confirms."}
                        </p>
                        {quoteInstructions?.top && (
                            <p className="text-[11px] text-[#00FFFF]/65 font-mono tracking-[0.16em] uppercase">{quoteInstructions.top}</p>
                        )}
                        <button
                            type="button"
                            onClick={openModal}
                            disabled={!hasSufficientUsdc || !effectiveWalletAddress}
                            className={`w-full group relative overflow-hidden rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ${!effectiveWalletAddress
                                ? "border-orange-500/50 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20"
                                : hasSufficientUsdc
                                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                                    : "border-red-500/50 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {!effectiveWalletAddress ? (
                                    <>
                                        <span className="animate-pulse">⚡</span>
                                        <span>Connect Wallet to Start</span>
                                    </>
                                ) : hasSufficientUsdc ? (
                                    <>
                                        <span className="animate-pulse">✨</span>
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
                                <div className="animate-pulse text-[#00FF88]/80">Fetching quote...</div>
                            </div>
                        ) : error ? (
                            <div className="rounded-lg border border-[#FF4D6D]/50 bg-[#FF4D6D]/15 p-4 text-[#FFB3C1]">{error}</div>
                        ) : quote ? (
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5 border-b border-cyan-500/20 pb-4">
                                    <span className="text-xs font-medium uppercase tracking-wider text-cyan-300/70">Estimated {displayToken}</span>
                                    <span className="text-3xl font-bold text-[#00FFFF] tracking-tight drop-shadow-[0_0_20px_rgba(0,255,255,0.6)]">{formatTokenAmount(quote, displayToken)}</span>
                                </div>

                                <div className="space-y-2.5">
                                    {formatPricePerToken(quote) && (
                                        <div className="flex items-center justify-between py-1.5 text-[#00FFFF]/75">
                                            <span className="uppercase tracking-[0.18em] text-[11px]">Spot Price</span>
                                            <span className="font-mono text-sm text-[#00FF88]">${formatPricePerToken(quote)} / {displayToken}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between py-1.5 text-[#00FFFF]/75">
                                        <span className="uppercase tracking-[0.18em] text-[11px]">Treasury Gas Cover</span>
                                        <span className="font-mono text-sm text-[#00FF88]">${quote.vaultGasCoverUsd.toFixed(2)}</span>
                                    </div>
                                    {typeof quote.priceSource === "string" && quote.priceSource.length > 0 && (
                                        <div className="flex items-center justify-between py-1.5 text-[#00FFFF]/60">
                                            <span className="uppercase tracking-[0.18em] text-[11px]">Price feed</span>
                                            <span className="font-mono text-xs text-[#00FF88] uppercase">{quote.priceSource}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between rounded-lg border border-[#00FFFF]/30 bg-[#00FFFF]/10 px-3 py-2 text-[#00FFFF]/75">
                                    <span className="text-xs uppercase tracking-[0.18em]">Quote expires</span>
                                    <div className="flex items-center gap-2">
                                        {quoteCountdown !== null && (
                                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#00FF88]">
                                                {quoteCountdown > 0 ? `${quoteCountdown}s` : 'refreshing'}
                                            </span>
                                        )}
                                        <time className="text-xs font-mono text-[#00FF88]" dateTime={quote.expiresAt}>
                                            {new Date(quote.expiresAt).toLocaleTimeString()}
                                        </time>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-8 text-cyan-200/70">
                                {emptyStateText ?? "Select an amount to start the conversion."}
                            </div>
                        )}
                        {quoteInstructions?.bottom && (
                            <p className="mt-3 text-[11px] leading-relaxed text-[#00FFFF]/60 font-mono tracking-[0.16em] uppercase">{quoteInstructions.bottom}</p>
                        )}
                    </div>
                </div>

                <ul className="space-y-2 text-[11px] text-[#00FFFF]/65 font-mono tracking-[0.14em] uppercase">
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
                            <div className="text-2xl animate-bounce">🎉</div>
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
                <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/80 p-4">
                    <div className="relative w-full max-w-lg rounded-3xl border border-cyan-500/40 bg-black/90 p-6 text-cyan-100 shadow-xl">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="absolute right-4 top-4 rounded-full border border-cyan-500/40 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-500/20"
                        >
                            Close
                        </button>
                        <div className="space-y-4">
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
                                <div className={`rounded-2xl border p-4 transition-all duration-500 relative overflow-hidden ${
                                    orderResult.success && settlementStatus === 'processed' 
                                        ? 'border-emerald-500/30 bg-emerald-500/10 animate-pulse' 
                                        : settlementStatus === 'pending' ? 'border-yellow-500/30 bg-yellow-500/10' 
                                        : settlementStatus === 'confirming' ? 'border-blue-500/30 bg-blue-500/10'
                                        : 'border-cyan-500/30 bg-cyan-500/10'
                                }`}>
                                    {/* Animated background for active states */}
                                    {(settlementStatus === 'pending' || settlementStatus === 'confirming') && (
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="animate-pulse">
                                                <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12"></div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Status Progress Bar */}
                                    {settlementStatus !== 'processed' && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-cyan-200/60 mb-1">
                                                <span>Initiated</span>
                                                <span>Processing</span>
                                                <span>Settled</span>
                                            </div>
                                            <div className="w-full bg-black/50 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-1000 ${
                                                        progressPercentage === 33 ? 'w-1/3 bg-yellow-400' :
                                                        progressPercentage === 66 ? 'w-2/3 bg-blue-400' :
                                                        progressPercentage === 100 ? 'w-full bg-emerald-400' :
                                                        'w-0 bg-transparent'
                                                    }`}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                    {orderResult.success ? (
                                        <div className="space-y-4">
                                            {celebrationContent && (
                                                <div className="text-center animate-in slide-in-from-top duration-500">
                                                    <div className="text-3xl mb-2">🎉✨</div>
                                                    <div className="text-lg font-bold text-emerald-300 uppercase tracking-[0.2em] animate-pulse">{celebrationContent.title}</div>
                                                    <div className="text-sm text-emerald-200/80 mt-2">{celebrationContent.subtitle}</div>
                                                    
                                                    {/* Enhanced VOT Amount Display */}
                                                    <div className="mt-4 space-y-3">
                                                        <div className="p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                                                            <div className="text-xs text-emerald-300 uppercase tracking-[0.1em] mb-2">Amount Received</div>
                                                            <div className="text-2xl font-mono font-bold text-white animate-pulse">
                                                                {celebrationContent.amount} {celebrationContent.token}
                                                            </div>
                                                            <div className="text-xs text-emerald-200/60 mt-1">Successfully Delivered</div>
                                                        </div>
                                                        
                                                        {/* Transaction Link */}
                                                        {orderResult.settlementTxHash && (
                                                            <div className="p-3 bg-black/30 rounded-lg border border-emerald-500/30">
                                                                <div className="text-xs text-emerald-300 uppercase tracking-[0.1em] mb-2">Settlement Transaction</div>
                                                                <div className="font-mono text-sm text-emerald-100 break-all mb-2">
                                                                    {orderResult.settlementTxHash.slice(0, 14)}...{orderResult.settlementTxHash.slice(-10)}
                                                                </div>
                                                                <a
                                                                    href={`https://basescan.org/tx/${orderResult.settlementTxHash}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-full transition-colors border border-emerald-500/40"
                                                                >
                                                                    <span className="text-xs">🔍 View on BaseScan</span>
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {settlementStatus === 'pending' && (
                                                <div className="text-center animate-pulse">
                                                    <div className="text-2xl mb-2">⏳</div>
                                                    <div className="text-sm font-bold text-yellow-300 uppercase tracking-[0.2em]">Processing Payment</div>
                                                    <div className="text-xs text-yellow-200/80 mt-1">Please wait while we process your x402 CDP payment</div>
                                                </div>
                                            )}
                                            {settlementStatus === 'confirming' && (
                                                <div className="text-center animate-pulse">
                                                    <div className="text-2xl mb-2">🔄</div>
                                                    <div className="text-sm font-bold text-blue-300 uppercase tracking-[0.2em]">Confirming Transaction</div>
                                                    <div className="text-xs text-blue-200/80 mt-1">Finalizing settlement on Base blockchain</div>
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.2em] text-cyan-300 border-b border-cyan-500/30 pb-2">Transaction Details</div>
                                                <div className="space-y-3 mt-3">
                                                    <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                                                        <span className="text-cyan-200/60 text-xs">Receipt ID</span>
                                                        <span className="font-mono text-sm text-white break-all max-w-[200px] truncate" title={orderResult.receipt?.id ?? 'Receipt pending'}>
                                                            {orderResult.receipt?.id ?? 'Receipt pending'}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="p-2 bg-black/30 rounded-lg">
                                                            <div className="text-cyan-200/50">Status</div>
                                                            <div className={`font-mono font-bold ${
                                                                settlementStatus === 'processed' ? 'text-emerald-300' :
                                                                settlementStatus === 'pending' ? 'text-yellow-300' :
                                                                settlementStatus === 'confirming' ? 'text-blue-300' : 'text-cyan-200'
                                                            }`}>
                                                                {settlementStatus}
                                                            </div>
                                                        </div>
                                                        <div className="p-2 bg-black/30 rounded-lg">
                                                            <div className="text-cyan-200/50">Facilitator</div>
                                                            <div className="font-mono text-white">cdp</div>
                                                        </div>
                                                        <div className="p-2 bg-black/30 rounded-lg">
                                                            <div className="text-cyan-200/50">Amount</div>
                                                            <div className="font-mono text-white">${orderResult.receipt?.usdAmount !== undefined ? orderResult.receipt.usdAmount.toFixed(2) : usdAmount.toFixed(2)}</div>
                                                        </div>
                                                        <div className="p-2 bg-black/30 rounded-lg">
                                                            <div className="text-cyan-200/50">Network</div>
                                                            <div className="font-mono text-white">Base</div>
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
                                            {/* Transaction Links Section */}
                                            {orderResult.paymentHash || orderResult.settlementTxHash || payoutConfirmation?.txHash ? (
                                                <div className="mt-4 space-y-3">
                                                    <div className="text-xs uppercase tracking-[0.2em] text-cyan-300 border-b border-cyan-500/30 pb-2">Blockchain Transactions</div>
                                                    <div className="space-y-2">
                                                        {orderResult.paymentHash && (
                                                            <div className="p-3 bg-black/30 rounded-lg border border-cyan-500/20">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <div className="text-cyan-200/60 text-xs">Payment Transaction</div>
                                                                        <div className="font-mono text-sm text-cyan-100 break-all">
                                                                            {orderResult.paymentHash.slice(0, 12)}...{orderResult.paymentHash.slice(-8)}
                                                                        </div>
                                                                    </div>
                                                                    <a
                                                                        href={`https://basescan.org/tx/${orderResult.paymentHash}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-cyan-300 hover:text-cyan-100 transition-colors"
                                                                    >
                                                                        <div className="text-xs">View on BaseScan</div>
                                                                        <div className="text-lg">🔍</div>
                                                                    </a>
                                                                </div>
                                                                <div className="mt-2 flex items-center gap-2 text-xs text-cyan-200/50">
                                                                    <span>• Status: {orderResult.success ? '✅ Confirmed' : '⏳ Pending'}</span>
                                                                    <span>• Network: Base</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {orderResult.settlementTxHash && (
                                                            <div className="p-3 bg-black/30 rounded-lg border border-emerald-500/20">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <div className="text-emerald-200/60 text-xs">Settlement Transaction</div>
                                                                        <div className="font-mono text-sm text-emerald-100 break-all">
                                                                            {orderResult.settlementTxHash.slice(0, 12)}...{orderResult.settlementTxHash.slice(-8)}
                                                                        </div>
                                                                    </div>
                                                                    <a
                                                                        href={`https://basescan.org/tx/${orderResult.settlementTxHash}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-emerald-300 hover:text-emerald-100 transition-colors"
                                                                    >
                                                                        <div className="text-xs">View on BaseScan</div>
                                                                        <div className="text-lg">🔍</div>
                                                                    </a>
                                                                </div>
                                                                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-200/50">
                                                                    <span>• Status: ✅ Settled</span>
                                                                    <span>• x402 CDP</span>
                                                                    <span>• Gasless</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {payoutConfirmation?.txHash && (
                                                            <div className="p-3 bg-black/30 rounded-lg border border-purple-500/20">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <div className="text-purple-200/60 text-xs">VOT Delivery Transaction</div>
                                                                        <div className="font-mono text-sm text-purple-100 break-all">
                                                                            {payoutConfirmation.txHash.slice(0, 12)}...{payoutConfirmation.txHash.slice(-8)}
                                                                        </div>
                                                                    </div>
                                                                    <a
                                                                        href={`https://basescan.org/tx/${payoutConfirmation.txHash}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-purple-300 hover:text-purple-100 transition-colors"
                                                                    >
                                                                        <div className="text-xs">View on BaseScan</div>
                                                                        <div className="text-lg">🔍</div>
                                                                    </a>
                                                                </div>
                                                                <div className="mt-2 flex items-center gap-2 text-xs text-purple-200/50">
                                                                    <span>• Amount: {typeof payoutConfirmation.votFormatted === 'number' ? `${payoutConfirmation.votFormatted.toFixed(4)} VOT` : 'VOT Delivered'}</span>
                                                                    <span>• Status: ✅ Completed</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                                    <div className="text-xs text-yellow-200/70">🔗 Transaction links will appear here as they are processed on-chain</div>
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
                                            {isMiniApp && (
                                                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-3 text-xs text-cyan-200/80 space-y-2">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/70">Share settlement to Farcaster</span>
                                                        <button
                                                            type="button"
                                                            onClick={handleShareCast}
                                                            disabled={shareState === 'posting' || shareState === 'posted'}
                                                            className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-70"
                                                        >
                                                            {shareState === 'posting' ? 'Sharing…' : shareState === 'posted' ? 'Cast shared' : 'Share tx to Farcaster'}
                                                        </button>
                                                    </div>
                                                    {shareState === 'posted' && (
                                                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#00FF88]">Cast published via MCPVOT.xyz facilitator.</p>
                                                    )}
                                                    {shareState === 'error' && shareError && (
                                                        <p className="text-[10px] uppercase tracking-[0.16em] text-red-300">{shareError}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300">
                                            {orderResult.error ?? orderResult.message ?? "Unable to complete facilitator request."}
                                        </div>
                                    )}
                                </div>
                            ) : isSubmitting ? (
                                <div className="flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-200/80">
                                    Submitting facilitator request...
                                </div>
                            ) : null}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-xl border border-cyan-500/30 px-6 py-2.5 text-sm text-cyan-200 transition-all hover:bg-cyan-500/10 hover:border-cyan-500/50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || quoteExpired || !quote || !hasSufficientUsdc}
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
                                <div className="text-xs text-red-300">Add at least ${usdAmount.toFixed(2)} USDC to continue.</div>
                            )}

                            {quoteExpired && (
                                <div className="text-xs text-red-300">Quote expired. Refresh the flow to continue.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default X402GaslessOrderPanel;
