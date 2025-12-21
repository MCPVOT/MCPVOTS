
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import glyphCatalogData from '@/data/alien-glyph-codex.json' assert { type: 'json' };
import { useLiveData } from '@/hooks/useLiveData';
import { useWebSocketData } from '@/lib/useWebSocketData';
import { motion } from 'framer-motion';

interface EcosystemReportResponse {
    success: boolean;
    reportText?: string;
    metadata?: Record<string, unknown> | null;
    generatedAt?: string | null;
    refreshedAt?: string;
    error?: string;
    message?: string;
}

interface FarcasterReportMetadata {
    metadata?: {
        timestamp?: string | null;
    } | null;
    trending_analysis?: {
        top_casts?: Array<{
            text?: string;
            author?: string;
            likes?: number;
            recasts?: number;
            replies?: number;
        }>;
    } | null;
    token_nft_ecosystem?: {
        token_discussions?: {
            trending_tokens?: Array<{
                symbol?: string;
                mentions?: number;
            }>;
            market_sentiment?: {
                overall_sentiment?: string;
                confidence_percentage?: number;
            };
        };
        nft_discussions?: {
            trending_nfts?: Array<{
                name?: string;
                mentions?: number;
            }>;
        };
        cross_ecosystem_insights?: {
            overlap_percentage?: number;
            overlapping_authors?: number;
            ecosystem_interaction_score?: number;
        };
        ecosystem_health_score?: number;
    } | null;
}

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const CHAR_INTERVAL_MS = 14;

type AccentTone = 'positive' | 'neutral' | 'warning' | 'negative';

function formatTimestamp(timestamp: string | null | undefined): string {
    if (!timestamp) {
        return 'UNKNOWN TIMESTAMP';
    }
    try {
        const date = new Date(timestamp);
        return date.toLocaleString(undefined, {
            hour12: false,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (error) {
        console.warn('Failed to format timestamp', error);
        return timestamp;
    }
}

function formatNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '--';
    }
    return new Intl.NumberFormat(undefined, options).format(value);
}

function formatUsd(value: number | null | undefined, maximumFractionDigits = 2) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '--';
    }
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits,
    }).format(value);
}

function calculateLatencyMinutes(generatedAt: string | null | undefined, refreshedAt: string | null | undefined): number | null {
    if (!generatedAt || !refreshedAt) {
        return null;
    }

    const generated = new Date(generatedAt).getTime();
    const refreshed = new Date(refreshedAt).getTime();

    if (Number.isNaN(generated) || Number.isNaN(refreshed)) {
        return null;
    }

    return Math.abs(refreshed - generated) / 60000;
}

const ACCENT_TEXT: Record<AccentTone, string> = {
    positive: 'text-emerald-300',
    neutral: 'text-cyan-200/75',
    warning: 'text-amber-300',
    negative: 'text-rose-400',
};

interface GlyphRecord {
    id: string;
    glyph: string;
    label: string;
    transliteration: string;
    meaning: string;
    tone: 'cyan' | 'emerald' | 'amber' | 'magenta';
}

const GLYPH_CATALOG = glyphCatalogData as GlyphRecord[];
const GLYPH_LOOKUP = new Map<string, GlyphRecord>(GLYPH_CATALOG.map((glyph) => [glyph.id, glyph]));

const getGlyph = (id: string) => GLYPH_LOOKUP.get(id);

const HEADER_PULSE = {
    initial: { opacity: 0.8 },
    animate: { opacity: [0.6, 1, 0.6] },
    transition: { duration: 3.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' as const },
};

const TITLE_GLOW = {
    initial: { opacity: 0.85, textShadow: '0 0 10px rgba(0,255,255,0.65)' },
    animate: {
        opacity: [0.85, 1, 0.85],
        textShadow: [
            '0 0 10px rgba(0,255,255,0.65)',
            '0 0 20px rgba(0,255,255,0.95)',
            '0 0 10px rgba(0,255,255,0.65)',
        ],
    },
    transition: { duration: 3.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' as const },
};

const SUB_GLOW = {
    initial: { opacity: 0.75 },
    animate: { opacity: [0.6, 0.95, 0.6] },
    transition: { duration: 4.1, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' as const },
};

const FALLBACK_REPORT_CONTENT = `FARCASTER SIGNAL FEED
STATUS: LIVE INTELLIGENCE LINK
UNKNOWN TIMESTAMP

🌐 FARCASTER ECOSYSTEM ANALYSIS REPORT
============================================================
Analysis Timestamp: 2025-11-05T19:29:37.227610
Analysis Period: 24 hours

📊 PLATFORM OVERVIEW:
-------------------------
• Total Channels: 3
• Sample Casts Analyzed: 10
• Top Channels:
  1. #Degen
  2. #FID Punks
  3. #skycastle

📈 TRENDING ANALYSIS:
-------------------------
• Total Trending Casts: 10
• Content Themes:
  - Other: 5 casts
  - Defi Finance: 1 casts
  - Nft Art: 1 casts
  - Trading: 1 casts
  - Technology: 1 casts
  - Social: 1 casts
• Engagement Metrics:
  - Total Likes: 1,310
  - Total Recasts: 252
  - Total Replies: 335
  - Avg Likes/Cast: 131.0
  - Avg Recasts/Cast: 25.2

🔥 TOP TRENDING CASTS:
-------------------------
1. @itsbasil (54❤️, 12🔄)
   "ways to earn $SKY right now:

-$DAU campaign with $CODY
-legendary pull in @ripsapp
-$TIPN campaign soon
-engage with partners using $NOICE
-send p..."
2. @jesse.base.eth (434❤️, 88🔄)
   "it's @baseapp.base.eth"
3. @jacek (204❤️, 44🔄)
   "Hey Degens,

Quick update on the Degen App release: the app is ready to go, but we're still working through a painfully long Apple Review process. We're..."
4. @streetphoto (109❤️, 22🔄)
   "We are down to final generation tests 🫡"
5. @jesse.base.eth (208❤️, 32🔄)
   "an open stack for the global economy"

👥 USER ECOSYSTEM:
-------------------------
• Total Unique Users Analyzed: 9
• Top Influencers by Engagement:
  1. @jesse.base.eth - 642 likes, 2 casts
  2. @jacek - 204 likes, 1 casts
  3. @streetphoto - 109 likes, 1 casts
  4. @skycastle - 92 likes, 1 casts
  5. @jake - 76 likes, 1 casts
  6. @itsbasil - 54 likes, 1 casts
  7. @dwr - 55 likes, 1 casts
  8. @jpfraneto.eth - 42 likes, 1 casts

📝 CONTENT ECOSYSTEM:
-------------------------
• Total Casts Analyzed: 46
• Content Patterns:
  - Average Cast Length: 331 characters
  - Casts with Hashtags: 7
  - Casts with Mentions: 15
  - Casts with Links: 3
  - Content Length Distribution:
    • Short (<50 chars): 3
    • Medium (50-200 chars): 14
    • Long (>200 chars): 29

🪙 TOKEN & NFT ECOSYSTEM:
------------------------------
• Token Discussions: 40 casts
• Unique Token Authors: 37
• Trending Token Symbols:
  1. BASE: 20 mentions
  2. ETH: 4 mentions
  3. BETR: 2 mentions
  4. BTC: 2 mentions
  5. BUILD: 2 mentions
• NFT Discussions: 40 casts
• Unique NFT Authors: 30
• Trending NFT Topics:
  1. On Base Network: 13 mentions
  2. At Warplet Blind: 3 mentions
  3. Shadow. Center Subject: 1 mentions
  4. Styles: Abstract Cubism: 1 mentions
  5. And Would Love: 1 mentions
• Cross-Ecosystem Insights:
  - Authors in Both Token & NFT: 2
  - Overlap Percentage: 3.1%
  - Token-Only Authors: 35
  - NFT-Only Authors: 28

🏥 NETWORK HEALTH:
-------------------------
• API Responsiveness:
  ✅ trending: 81.37ms (excellent)
  ✅ bulk: 79.48ms (excellent)
  ✅ search: 106.35ms (excellent)
🟢 Content Freshness: excellent (-27.1 min avg age)

💡 ECOSYSTEM RECOMMENDATIONS:
-----------------------------------
1. Excellent network activity - ecosystem is thriving

🤖 Generated by x402 MCPVOT Intelligence Protocol v2.1
🌐 Comprehensive Farcaster Ecosystem Analysis
#Farcaster #Web3 #Social #Crypto #Ecosystem #Analysis
█`;

const FALLBACK_REPORT_LINES = FALLBACK_REPORT_CONTENT.split('\n');
const FALLBACK_REFRESHED_AT = '2025-11-05T19:29:37.227610';
const FALLBACK_GENERATED_AT: string | null = null;

const FALLBACK_METADATA: FarcasterReportMetadata = {
    metadata: {
        timestamp: '2025-11-05T19:29:37.227610',
    },
    trending_analysis: {
        top_casts: [
            {
                author: 'itsbasil',
                likes: 54,
                recasts: 12,
                replies: 0,
                text: 'ways to earn $SKY right now: -$DAU campaign with $CODY -legendary pull in @ripsapp -$TIPN campaign soon -engage with partners using $NOICE -send p...',
            },
            {
                author: 'jesse.base.eth',
                likes: 434,
                recasts: 88,
                replies: 0,
                text: "it's @baseapp.base.eth",
            },
            {
                author: 'jacek',
                likes: 204,
                recasts: 44,
                replies: 0,
                text: "Hey Degens, Quick update on the Degen App release: the app is ready to go, but we're still working through a painfully long Apple Review process. We're...",
            },
            {
                author: 'streetphoto',
                likes: 109,
                recasts: 22,
                replies: 0,
                text: 'We are down to final generation tests 🫡',
            },
            {
                author: 'jesse.base.eth',
                likes: 208,
                recasts: 32,
                replies: 0,
                text: 'an open stack for the global economy',
            },
        ],
    },
    token_nft_ecosystem: {
        token_discussions: {
            trending_tokens: [
                { symbol: 'BASE', mentions: 20 },
                { symbol: 'ETH', mentions: 4 },
                { symbol: 'BETR', mentions: 2 },
                { symbol: 'BTC', mentions: 2 },
                { symbol: 'BUILD', mentions: 2 },
            ],
            market_sentiment: {
                overall_sentiment: 'thriving',
                confidence_percentage: 92.4,
            },
        },
        nft_discussions: {
            trending_nfts: [
                { name: 'On Base Network', mentions: 13 },
                { name: 'At Warplet Blind', mentions: 3 },
                { name: 'Shadow. Center Subject', mentions: 1 },
                { name: 'Styles: Abstract Cubism', mentions: 1 },
                { name: 'And Would Love', mentions: 1 },
            ],
        },
        cross_ecosystem_insights: {
            overlap_percentage: 3.1,
            overlapping_authors: 2,
            ecosystem_interaction_score: 0.31,
        },
        ecosystem_health_score: 94,
    },
};

function hasMeaningfulMetadata(metadata: FarcasterReportMetadata | null | undefined): metadata is FarcasterReportMetadata {
    if (!metadata) {
        return false;
    }

    const tokenCount = metadata.token_nft_ecosystem?.token_discussions?.trending_tokens?.length ?? 0;
    const nftCount = metadata.token_nft_ecosystem?.nft_discussions?.trending_nfts?.length ?? 0;
    const castCount = metadata.trending_analysis?.top_casts?.length ?? 0;

    return tokenCount + nftCount + castCount > 0;
}

export default function FarcasterEcosystemReport() {
    const [reportLines, setReportLines] = useState<string[]>([]);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [generatedAt, setGeneratedAt] = useState<string | null>(null);
    const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
    const [reportMetadata, setReportMetadata] = useState<FarcasterReportMetadata | null>(null);
    const [isFallback, setIsFallback] = useState(false);
    const isFetching = useRef(false);
    const typingIndexRef = useRef(0);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { prices, gas, balance, trading, burnStats, isWsConnected } = useLiveData();
    const tradingWs = useWebSocketData(); // Get MAXX price, ETH price, and GAS from trading bot WS

    // Debug: Log WebSocket data when it changes
    useEffect(() => {
        console.log('🔧 Trading WS Connection Status:', {
            isConnected: tradingWs.isConnected,
            hasData: !!tradingWs.data,
            error: tradingWs.error
        });

        if (tradingWs.data) {
            console.log('🔧 Trading WS Data:', {
                maxx_usd: tradingWs.data.maxx_usd,
                eth_usd: tradingWs.data.eth_usd,
                gas_price_gwei: tradingWs.data.gas_price_gwei,
                maxx_balance: tradingWs.data.maxx_balance,
                timestamp: tradingWs.data.timestamp
            });
        } else if (tradingWs.isConnected) {
            console.warn('⚠️ WebSocket connected but no data received yet');
        }
    }, [tradingWs.data, tradingWs.isConnected, tradingWs.error]);

    const clearTypingLoop = () => {
        if (typingTimeoutRef.current !== null) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    };

    const activateFallback = () => {
        clearTypingLoop();
        typingIndexRef.current = 0;
        setDisplayedText('');
        setReportLines(FALLBACK_REPORT_LINES);
        setGeneratedAt(FALLBACK_GENERATED_AT);
        setRefreshedAt(FALLBACK_REFRESHED_AT);
        setReportMetadata(FALLBACK_METADATA);
        setErrorMessage(null);
        setIsFallback(true);
    };

    const fetchReport = async () => {
        if (isFetching.current) {
            return;
        }
        isFetching.current = true;
        setIsLoading((prev) => prev && reportLines.length === 0);

        try {
            const response = await fetch('/api/farcaster-ecosystem-report', {
                cache: 'no-store',
            });

            const payload = (await response.json()) as EcosystemReportResponse;

            if (!response.ok || !payload.success || !payload.reportText) {
                const message = payload.error || payload.message || 'Report unavailable';
                console.warn('Farcaster report unavailable, engaging fallback telemetry.', message);
                activateFallback();
            } else {
                const sanitized = payload.reportText
                    .replace(/\r\n/g, '\n')
                    .split('\n')
                    .map((line) => line.trimEnd());

                const hasContent = sanitized.some((line) => line.trim().length > 0);
                const metadata = (payload.metadata as FarcasterReportMetadata) ?? null;
                const metadataMeaningful = hasMeaningfulMetadata(metadata);
                const usingFallbackLines = !hasContent;
                const usingFallbackMetadata = !metadataMeaningful;
                const resolvedLines = usingFallbackLines ? FALLBACK_REPORT_LINES : sanitized;
                const resolvedMetadata = usingFallbackMetadata ? FALLBACK_METADATA : metadata;

                clearTypingLoop();
                typingIndexRef.current = 0;
                setDisplayedText('');
                setIsTyping(true);
                setReportLines(resolvedLines);
                setGeneratedAt(
                    usingFallbackLines
                        ? FALLBACK_GENERATED_AT
                        : payload.generatedAt ?? resolvedMetadata?.metadata?.timestamp ?? FALLBACK_GENERATED_AT,
                );
                setRefreshedAt(
                    payload.refreshedAt ??
                    (usingFallbackLines
                        ? FALLBACK_REFRESHED_AT
                        : resolvedMetadata?.metadata?.timestamp ?? FALLBACK_REFRESHED_AT),
                );
                setErrorMessage(null);
                setReportMetadata(resolvedMetadata);
                setIsFallback(usingFallbackLines || usingFallbackMetadata);
            }
        } catch (error) {
            console.error('Failed to load Farcaster ecosystem report, using fallback telemetry:', error);
            activateFallback();
        } finally {
            setIsLoading(false);
            isFetching.current = false;
        }
    };

    useEffect(() => {
        fetchReport();

        const interval = setInterval(fetchReport, REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fullReportText = useMemo(() => {
        if (reportLines.length === 0) {
            return '';
        }

        const content = reportLines
            .map((line) => {
                if (line.length === 0) {
                    return '';
                }
                return line.startsWith('>') ? line : `> ${line}`;
            })
            .join('\n');

        return content ? `${content}\n` : '';
    }, [reportLines]);

    useEffect(() => {
        clearTypingLoop();
        typingIndexRef.current = 0;

        if (!fullReportText) {
            setDisplayedText('');
            setIsTyping(false);
            return () => {
                clearTypingLoop();
            };
        }

        setDisplayedText('');
        setIsTyping(true);

        const typeNext = () => {
            const nextIndex = typingIndexRef.current + 1;
            setDisplayedText(fullReportText.slice(0, nextIndex));
            typingIndexRef.current = nextIndex;

            if (nextIndex < fullReportText.length) {
                typingTimeoutRef.current = setTimeout(typeNext, CHAR_INTERVAL_MS);
            } else {
                setIsTyping(false);
                typingTimeoutRef.current = null;
            }
        };

        typeNext();

        return () => {
            clearTypingLoop();
        };
    }, [fullReportText]);

    const x402Glyph = getGlyph('x402');
    const signalGlyph = getGlyph('signal');
    const votGlyph = getGlyph('vot');
    const farcasterGlyph = getGlyph('farcaster');

    const glyphFragments = [signalGlyph, votGlyph, farcasterGlyph].filter((glyph): glyph is GlyphRecord => Boolean(glyph));
    const signalFeedTitle = signalGlyph
        ? `${signalGlyph.transliteration} // ${signalGlyph.label.toUpperCase()} SIGNAL FEED`
        : 'FARCASTER SIGNAL FEED';
    const signalFeedStatus = errorMessage
        ? 'STATUS: DEGRADED / FALLBACK'
        : farcasterGlyph
            ? `${farcasterGlyph.transliteration} RELAY // LIVE INTELLIGENCE LINK`
            : 'STATUS: LIVE INTELLIGENCE LINK';
    const signalBurnLegend = `${signalGlyph?.transliteration ?? 'KU-UL'} SIGNAL // ${votGlyph?.transliteration ?? 'VU-TAR'} BURN VECTOR`;

    const statusText = useMemo(() => {
        if (errorMessage) {
            return 'X402 INTELLIGENCE :: SIGNAL CACHE MODE // ERROR';
        }
        if (isLoading) {
            return 'X402 INTELLIGENCE :: RETRIEVING GASLESS TELEMETRY';
        }
        if (isFallback) {
            return 'X402 INTELLIGENCE :: FALLBACK CACHE ACTIVE';
        }
        return 'X402 INTELLIGENCE :: LIVE GASLESS RELAY';
    }, [errorMessage, isFallback, isLoading]);

    const footerText = useMemo(() => {
        if (errorMessage) {
            return `> STATUS: ${errorMessage} | SIGNAL CACHE MODE :: ACTIVE`;
        }
        const generatedLabel = formatTimestamp(generatedAt);
        const refreshedLabel = formatTimestamp(refreshedAt);
        const votSignature = votGlyph ? ` | ${votGlyph.transliteration} // ${votGlyph.label.toUpperCase()} MIRROR` : '';
        return `> SOURCE GENERATED: ${generatedLabel} | DASHBOARD UPDATED: ${refreshedLabel}${votSignature}`;
    }, [errorMessage, generatedAt, refreshedAt, votGlyph]);

    const ethPrice = useMemo(() => {
        // Priority 1: Use WebSocket ETH price from trading bot (most up-to-date)
        if (tradingWs.data?.eth_usd && tradingWs.data.eth_usd > 0) {
            return tradingWs.data.eth_usd;
        }
        // Priority 2: Use prices from API
        if (prices?.ethPrice && prices.ethPrice > 0) {
            return prices.ethPrice;
        }
        // Priority 3: Calculate from wallet balance
        const ethBalance = balance?.balances.eth;
        if (ethBalance && ethBalance.eth > 0 && ethBalance.usd > 0) {
            return ethBalance.usd / ethBalance.eth;
        }
        return null;
    }, [tradingWs.data?.eth_usd, prices?.ethPrice, balance?.balances.eth]);

    const metrics = useMemo(() => {
        const votPrice = prices?.price ?? null;
        const votChange = prices?.priceChange24h ?? null;
        const votVolume = prices?.volume24h ?? null;

        // Use WebSocket data for MAXX price (from trading bot)
        const maxxPriceUsd = tradingWs.data?.maxx_usd ?? null;
        const maxxBalanceRaw = tradingWs.data?.maxx_balance ?? balance?.balances.maxx?.raw ?? null;
        const maxxBalanceUsd = maxxPriceUsd && maxxBalanceRaw ? maxxPriceUsd * maxxBalanceRaw : null;

        const burnTotal = burnStats?.totalBurned ?? null;
        const burnCount = burnStats?.burnCount ?? null;

        // Use WebSocket data for GAS (from trading bot - most current)
        // Note: gas_price_gwei can be 0, so we need to check for null/undefined specifically
        const gasGwei = (tradingWs.data?.gas_price_gwei !== null && tradingWs.data?.gas_price_gwei !== undefined)
            ? tradingWs.data.gas_price_gwei
            : gas?.gasPrice.gwei ?? null;
        const gasTransfer = gas?.estimates.transfer.costEth ?? null;
        const gasSwap = gas?.estimates.swap.costEth ?? null;

        return [
            {
                id: 'vot-token',
                label: 'VOT TOKEN',
                primary: votPrice !== null ? formatUsd(votPrice, votPrice < 1 ? 6 : 4) : '--',
                secondary:
                    votChange !== null
                        ? `${votChange >= 0 ? '+' : ''}${votChange.toFixed(2)}% 24H`
                        : 'Δ 24H N/A',
                tertiary: votVolume !== null ? `VOL 24H ${formatUsd(votVolume)}` : 'VOL N/A',
                accent: votChange !== null ? (votChange >= 0 ? 'positive' : 'negative') : 'neutral',
            },
            {
                id: 'maxx-price',
                label: 'MAXX PRICE',
                primary: maxxPriceUsd !== null && maxxPriceUsd > 0
                    ? formatUsd(maxxPriceUsd, maxxPriceUsd < 1 ? 6 : 4)
                    : tradingWs.isConnected ? 'SYNCING...' : '--',
                secondary: maxxBalanceRaw !== null ? `HOLDINGS ${formatNumber(maxxBalanceRaw, { maximumFractionDigits: 2 })} MAXX` : 'HOLDINGS N/A',
                tertiary: maxxBalanceUsd !== null ? `VALUE ${formatUsd(maxxBalanceUsd)}` :
                    burnTotal !== null && burnCount !== null
                        ? `BURN ${formatNumber(burnTotal, { maximumFractionDigits: 2 })} VOT · ${burnCount} EVENTS`
                        : 'TELEMETRY N/A',
                accent: maxxPriceUsd !== null && maxxPriceUsd > 0 ? 'positive' : 'warning',
            },
            {
                id: 'network',
                label: 'NETWORK STATE',
                primary: gasGwei !== null ? `${gasGwei.toFixed(2)} GWEI` : '--',
                secondary: gasTransfer !== null ? `TX ${gasTransfer.toFixed(4)} ETH` : 'TX COST N/A',
                tertiary: gasSwap !== null ? `SWAP ${gasSwap.toFixed(4)} ETH` : 'SWAP COST N/A',
                accent: gasGwei !== null && gasGwei <= 20 ? 'positive' : 'neutral',
            },
            {
                id: 'eth',
                label: 'ETH PRICE',
                primary: ethPrice !== null ? formatUsd(ethPrice, 2) : '--',
                secondary: balance?.balances.eth.eth
                    ? `WALLET ${balance.balances.eth.eth.toFixed(4)} ETH`
                    : 'WALLET N/A',
                tertiary: balance?.balances.eth.usd
                    ? `USD HOLDINGS ${formatUsd(balance.balances.eth.usd)}`
                    : 'USD HOLDINGS N/A',
                accent: 'neutral',
            },
        ];
    }, [prices, balance, burnStats, gas, ethPrice, tradingWs.data?.maxx_usd, tradingWs.data?.maxx_balance, tradingWs.data?.gas_price_gwei, tradingWs.isConnected]);

    const recentTrades = useMemo(() => {
        if (!trading?.recentTrades) {
            return [];
        }
        return trading.recentTrades
            .slice(-6)
            .reverse()
            .map((trade) => ({
                ...trade,
                timestamp: new Date(trade.timestamp).toLocaleTimeString(undefined, {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
            }));
    }, [trading]);

    const wsStatus = useMemo(() => {
        const tradingStatus = tradingWs.isConnected ? 'TRADER-WS' : 'OFFLINE';
        const analyticsStatus = isWsConnected ? 'ANALYTICS-WS' : 'POLL';
        return `${tradingStatus} • ${analyticsStatus}`;
    }, [isWsConnected, tradingWs.isConnected]);

    const signalIntegrity = useMemo(() => {
        const latencyMinutes = calculateLatencyMinutes(generatedAt, refreshedAt);
        const tradeStats = trading?.stats;
        const winRate = tradeStats ? tradeStats.winRate : null;
        const totalTrades = tradeStats ? tradeStats.totalTrades : 0;

        let score = 68;

        if (!errorMessage && reportLines.length > 0) {
            score += 14;
        } else {
            score -= 12;
        }

        if (isWsConnected) {
            score += 9;
        } else {
            score -= 6;
        }

        if (latencyMinutes !== null) {
            if (latencyMinutes <= 5) {
                score += 6;
            } else if (latencyMinutes <= 15) {
                score += 2;
            } else if (latencyMinutes >= 30) {
                score -= 6;
            }
        }

        if (burnStats?.lastBurn) {
            score += 4;
        }

        if (totalTrades > 0 && winRate !== null) {
            score += Math.min(8, winRate / 12);
        }

        const clampedScore = Math.max(35, Math.min(99, Math.round(score)));
        const trend = clampedScore >= 85 ? 'STABLE' : clampedScore >= 70 ? 'NOMINAL' : clampedScore >= 55 ? 'WATCH' : 'ALERT';

        return {
            score: clampedScore,
            trend,
            latencyMinutes,
            farcasterStatus: errorMessage ? 'DEGRADED' : 'STABLE',
            wsLink: isWsConnected ? 'REALTIME LINKED' : 'POLL FALLBACK',
            burnSync: burnStats?.lastBurn ? 'ACTIVE' : 'IDLE',
            tradeOps: totalTrades > 0 ? `${totalTrades} OPS` : 'NO OPS',
            winRate: winRate !== null ? `${winRate.toFixed(1)}%` : 'N/A',
            lastBurnAmount:
                burnStats?.lastBurn?.amount !== undefined
                    ? `${burnStats.lastBurn.amount.toFixed(2)} VOT`
                    : 'NO SIGNAL',
        };
    }, [burnStats?.lastBurn, errorMessage, generatedAt, isWsConnected, refreshedAt, reportLines.length, trading?.stats]);

    const signalRows = useMemo(() => {
        const winRateValue = signalIntegrity.winRate.endsWith('%')
            ? Number.parseFloat(signalIntegrity.winRate)
            : Number.NaN;

        return [
            {
                label: 'INTEL STREAM',
                value: signalIntegrity.farcasterStatus,
                detail: `${reportLines.length} LINES`,
                accent: signalIntegrity.farcasterStatus === 'STABLE' ? 'positive' : 'warning',
            },
            {
                label: 'NETWORK LINK',
                value: signalIntegrity.wsLink,
                detail: signalIntegrity.wsLink === 'REALTIME LINKED' ? 'LATENCY OPTIMAL' : 'BUFFERED STREAM',
                accent: signalIntegrity.wsLink === 'REALTIME LINKED' ? 'positive' : 'warning',
            },
            {
                label: 'SOURCE LATENCY',
                value:
                    signalIntegrity.latencyMinutes !== null
                        ? `${signalIntegrity.latencyMinutes.toFixed(1)} MIN`
                        : 'N/A',
                detail: 'SOURCE <-> DASHBOARD',
                accent:
                    signalIntegrity.latencyMinutes !== null && signalIntegrity.latencyMinutes <= 10
                        ? 'positive'
                        : signalIntegrity.latencyMinutes !== null && signalIntegrity.latencyMinutes <= 20
                            ? 'neutral'
                            : signalIntegrity.latencyMinutes === null
                                ? 'neutral'
                                : 'warning',
            },
            {
                label: 'BURN SYNC',
                value: signalIntegrity.burnSync,
                detail: signalIntegrity.lastBurnAmount,
                accent: signalIntegrity.burnSync === 'ACTIVE' ? 'positive' : 'neutral',
            },
            {
                label: 'TRADE OPS',
                value: signalIntegrity.tradeOps,
                detail: signalIntegrity.winRate !== 'N/A' ? `WIN ${signalIntegrity.winRate}` : 'WIN N/A',
                accent:
                    signalIntegrity.tradeOps !== 'NO OPS'
                        ? Number.isFinite(winRateValue) && winRateValue >= 50
                            ? 'positive'
                            : 'neutral'
                        : 'warning',
            },
        ] satisfies Array<{ label: string; value: string; detail: string; accent: AccentTone }>;
    }, [reportLines.length, signalIntegrity]);

    const nftSignalData = useMemo(() => {
        if (!reportMetadata?.token_nft_ecosystem) {
            return null;
        }

        const { token_discussions, nft_discussions, cross_ecosystem_insights, ecosystem_health_score } =
            reportMetadata.token_nft_ecosystem;

        const trendingNfts = (nft_discussions?.trending_nfts ?? [])
            .filter((item): item is { name: string; mentions: number } => Boolean(item?.name) && item?.mentions !== undefined)
            .slice(0, 4);

        const [primaryNft, ...remainingNfts] = trendingNfts;
        const secondaryNfts = remainingNfts.slice(0, 3);

        const trendingTokens = (token_discussions?.trending_tokens ?? [])
            .filter((item): item is { symbol: string; mentions: number } => Boolean(item?.symbol) && item?.mentions !== undefined)
            .slice(0, 6);

        const sentiment = token_discussions?.market_sentiment?.overall_sentiment ?? 'neutral';
        const sentimentConfidence = token_discussions?.market_sentiment?.confidence_percentage ?? null;

        const topCastFragments = (reportMetadata.trending_analysis?.top_casts ?? [])
            .slice(0, 3)
            .map((cast) => ({
                author: cast?.author ?? 'unknown',
                likes: cast?.likes ?? 0,
                recasts: cast?.recasts ?? 0,
                replies: cast?.replies ?? 0,
                snippet: cast?.text ? `${cast.text.slice(0, 120)}${cast.text.length > 120 ? '…' : ''}` : '',
            }));

        return {
            trendingNfts,
            trendingTokens,
            sentiment,
            sentimentConfidence,
            crossStats: {
                overlapPercentage: cross_ecosystem_insights?.overlap_percentage ?? null,
                overlappingAuthors: cross_ecosystem_insights?.overlapping_authors ?? null,
                interactionScore: cross_ecosystem_insights?.ecosystem_interaction_score ?? null,
                healthScore: ecosystem_health_score ?? null,
            },
            primaryNft: primaryNft ?? null,
            secondaryNfts,
            topCastFragments,
        };
    }, [reportMetadata]);

    const nftSentimentConfidence = nftSignalData?.sentimentConfidence;
    const nftCrossStats = nftSignalData?.crossStats;

    return (
        <section className="relative w-full max-w-6xl mx-auto">
            <div className="absolute inset-0 -z-10 bg-black" />
            <div
                className="absolute inset-0 -z-10 opacity-35 mix-blend-screen"
                style={{
                    backgroundImage: 'url(/3667e4a898f671357e7f9bab32f28c36.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            <div className="relative border-2 border-[#00FFFF]/40 bg-black/95 backdrop-blur-lg rounded-xl overflow-hidden shadow-[0_0_60px_rgba(0,255,255,0.18)]">
                <div className="absolute inset-0 pointer-events-none opacity-60">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,255,0.06)_1px,transparent_1px)] bg-[size:110px_110px]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,255,0.22),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(255,136,0,0.16),transparent_55%)]" />
                </div>

                <div className="relative px-4 py-4 md:px-6 md:py-6 space-y-6">
                    {/* X402 Glyph Broadcast Header */}
                    <div className="border-2 border-[#00FFFF]/20 bg-black/60 backdrop-blur-sm rounded-lg p-4 mb-4">
                        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
                                <div className="flex items-center justify-center rounded-lg border border-[#00FF88]/40 bg-[#001414]/80 px-5 py-4 shadow-[0_0_24px_rgba(0,255,136,0.25)]">
                                    <span className="text-4xl md:text-5xl font-mono text-[#00FF88] drop-shadow-[0_0_18px_rgba(0,255,136,0.8)]">
                                        {x402Glyph?.glyph ?? '𒇻'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="font-mono text-xs sm:text-sm uppercase tracking-[0.24em] text-[#00FFFF]/80 drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]">
                                        &gt; {(x402Glyph?.label.toUpperCase() ?? 'X402')}{' // '}{x402Glyph?.transliteration ?? 'AK-SU'}
                                    </div>
                                    <p className="font-mono text-[11px] sm:text-xs leading-relaxed text-[#00FFFF]/60">
                                        {x402Glyph?.meaning ?? 'Prime facilitator spine that synchronizes OTC supply and demand.'}
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {glyphFragments.map((glyph) => (
                                    <div
                                        key={glyph.id}
                                        className="relative overflow-hidden rounded-md border border-[#00FFFF]/20 bg-[#001414]/85 px-3 py-3 shadow-[0_0_22px_rgba(0,255,255,0.2)]"
                                    >
                                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.24),transparent_65%)]" />
                                        <div className="relative flex flex-col items-center gap-1 text-center">
                                            <span className="text-3xl font-mono text-[#00FFFF] drop-shadow-[0_0_16px_rgba(0,255,255,0.75)]">
                                                {glyph.glyph}
                                            </span>
                                            <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#00FFFF]/70">
                                                &gt; {glyph.label.toUpperCase()}{' // '}{glyph.transliteration}
                                            </span>
                                            <span className="font-mono text-[10px] leading-relaxed text-[#FF8800]/80">
                                                {glyph.meaning}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <motion.p
                                className="font-mono text-sm tracking-wider uppercase text-[#00FFFF]/80 drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]"
                                {...HEADER_PULSE}
                            >
                                &gt; X402 INTELLIGENCE
                            </motion.p>
                            <motion.h1
                                className="text-lg md:text-xl font-mono font-bold tracking-wider text-[#00FFFF] uppercase"
                                {...TITLE_GLOW}
                            >
                                &gt; Gasless AI Queries • Real-time Data
                            </motion.h1>
                            <motion.p
                                className="font-mono text-xs tracking-[0.24em] uppercase text-[#00FF88]/70 drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]"
                                {...SUB_GLOW}
                            >
                                &gt; {signalBurnLegend}
                            </motion.p>
                        </div>
                        <div className="font-mono text-base text-[#FF8800]/80 flex flex-col items-start md:items-end gap-0.5">
                            <span>&gt; {statusText}</span>
                            <span>&gt; {wsStatus}</span>
                            <span>&gt; {formatTimestamp(refreshedAt)}</span>
                        </div>
                    </header>

                    <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
                        <div className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                {metrics.map((metric) => (
                                    <div
                                        key={metric.id}
                                        className="relative overflow-hidden border-2 border-[#00FFFF]/40 bg-black/80 shadow-[0_0_20px_rgba(0,255,255,0.12)]"
                                    >
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,255,0.18),transparent_60%)] opacity-70" />
                                        <div className="relative p-4 space-y-1.5 leading-snug">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-[11px] sm:text-sm tracking-[0.12em] sm:tracking-[0.2em] text-[#00FFFF]/60 uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] break-words">&gt; {metric.label}</span>
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${metric.accent === 'positive'
                                                        ? 'bg-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.8)]'
                                                        : metric.accent === 'negative'
                                                            ? 'bg-[#FF0044] shadow-[0_0_12px_rgba(255,0,68,0.75)]'
                                                            : 'bg-[#00FFFF]/80 shadow-[0_0_10px_rgba(0,255,255,0.6)]'
                                                        }`}
                                                />
                                            </div>
                                            <div className="font-mono text-lg sm:text-xl font-bold tracking-[0.1em] sm:tracking-[0.16em] text-[#FFFF00] drop-shadow-[0_0_15px_rgba(255,255,0,0.8)] break-words">
                                                {metric.primary}
                                            </div>
                                            <div className="font-mono text-[11px] sm:text-xs md:text-sm text-[#FF8800]/90 uppercase tracking-[0.1em] sm:tracking-[0.18em] drop-shadow-[0_0_8px_rgba(255,136,0,0.6)] break-words">
                                                &gt; {metric.secondary}
                                            </div>
                                            <div className="font-mono text-[11px] sm:text-xs md:text-sm text-[#00FFFF]/60 uppercase tracking-[0.1em] sm:tracking-[0.18em] break-words">
                                                &gt; {metric.tertiary}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="relative overflow-hidden border-2 border-[#00FFFF]/40 bg-black/80 shadow-[0_0_28px_rgba(0,255,255,0.14)]">
                                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(0,255,255,0.16),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(0,255,136,0.18),transparent_55%)] opacity-70" />

                                <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-2 border-b-2 border-[#00FFFF]/20 p-4">
                                    <div>
                                        <div className="font-mono text-sm tracking-wider text-[#00FFFF]/80 uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]">&gt; {signalFeedTitle}</div>
                                        <div className="mt-0.5 font-mono text-sm tracking-wider text-[#FF8800]/80 uppercase">
                                            &gt; {signalFeedStatus}
                                        </div>
                                        {farcasterGlyph?.meaning && (
                                            <div className="mt-0.5 font-mono text-[10px] tracking-[0.18em] text-[#00FF88]/70 uppercase">
                                                &gt; {farcasterGlyph.meaning}
                                            </div>
                                        )}
                                    </div>
                                    <div className="font-mono text-sm tracking-wider text-[#FF8800]/80 uppercase">
                                        &gt; {formatTimestamp(generatedAt)}
                                    </div>
                                </div>

                                <div className="relative font-mono text-base leading-relaxed text-[#00FF88]/85 tracking-wider p-4 min-h-[240px]">
                                    {isLoading && reportLines.length === 0 ? (
                                        <div className="space-y-2 text-[#00FFFF]/70">
                                            <div>&gt; establishing farcaster uplink…</div>
                                            <div className="flex items-center gap-2">
                                                &gt; compiling signal clusters
                                                <span className="animate-pulse">█</span>
                                            </div>
                                            <div>&gt; aligning warp intelligence matrix…</div>
                                        </div>
                                    ) : errorMessage ? (
                                        <div className="space-y-2 text-[#FF0044]/90">
                                            <div>&gt; {errorMessage}</div>
                                            <div>&gt; REPORT STREAM OFFLINE — REVIEW CACHED TELEMETRY</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <pre className="whitespace-pre-wrap break-words">
                                                {displayedText || ' '}
                                            </pre>
                                            <span
                                                className={`${isTyping ? 'animate-pulse text-[#00FF88]' : 'text-[#00FF88]/60'} block w-min`}
                                            >
                                                █
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="relative border-t-2 border-[#00FFFF]/20 px-4 py-2 font-mono text-sm tracking-wider text-[#FF8800]/80 uppercase">
                                    {footerText}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="relative overflow-hidden border-2 border-[#00FFFF]/40 bg-black/80 shadow-[0_0_28px_rgba(0,255,255,0.14)]">
                                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,136,0,0.22),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(0,255,255,0.2),transparent_60%)] opacity-65" />
                                <div className="relative px-4 py-3 border-b-2 border-[#00FFFF]/20">
                                    <div className="font-mono text-base tracking-wider text-[#00FFFF]/75 uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]">
                                        &gt; NFT 1/1 Signal Deck
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-mono tracking-wider text-[#FF8800]/80 uppercase">
                                        <span>&gt; Sentiment {nftSignalData?.sentiment?.toUpperCase() ?? 'N/A'}</span>
                                        {nftSignalData && nftSentimentConfidence !== null && nftSentimentConfidence !== undefined && (
                                            <span>Confidence {nftSentimentConfidence.toFixed(1)}%</span>
                                        )}
                                        {nftCrossStats && nftCrossStats.healthScore !== null && nftCrossStats.healthScore !== undefined && (
                                            <span>Health {nftCrossStats.healthScore}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="relative grid gap-4 p-5">
                                    {nftSignalData?.primaryNft ? (
                                        <div className="relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-black via-[#041f24] to-black p-6 shadow-[0_0_40px_rgba(0,255,255,0.18)]">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.22),transparent_65%)]" />
                                            <div className="absolute inset-0 opacity-30 mix-blend-screen bg-[linear-gradient(120deg,transparent,rgba(0,255,255,0.3),transparent)] animate-[pulse_6s_linear_infinite]" />
                                            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                                <div className="max-w-sm">
                                                    <div className="font-mono text-[0.6rem] tracking-[0.32em] text-cyan-200/60 uppercase">
                                                        Featured 1/1 Signal
                                                    </div>
                                                    <div className="mt-2 text-3xl font-orbitron tracking-[0.22em] text-white drop-shadow-[0_0_30px_rgba(0,255,255,0.6)]">
                                                        {nftSignalData.primaryNft.name}
                                                    </div>
                                                    <div className="mt-3 flex items-center gap-4 font-mono text-[0.58rem] tracking-[0.26em] text-cyan-200/60 uppercase">
                                                        <span className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-cyan-300/90 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                                                            Mentions {nftSignalData.primaryNft.mentions}
                                                        </span>
                                                        {nftCrossStats?.interactionScore !== null && nftCrossStats?.interactionScore !== undefined && (
                                                            <span>Interaction {nftCrossStats.interactionScore.toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="relative w-full max-w-xs self-stretch overflow-hidden rounded-2xl border border-cyan-400/20 bg-black/60 p-4">
                                                    <div className="font-mono text-[0.55rem] tracking-[0.3em] text-cyan-200/60 uppercase">
                                                        Prime Cast Sync
                                                    </div>
                                                    {nftSignalData.topCastFragments?.length ? (
                                                        <div className="mt-3 space-y-3">
                                                            {nftSignalData.topCastFragments.slice(0, 2).map((cast) => (
                                                                <div key={`${cast.author}-${cast.likes ?? 0}`} className="rounded-xl border border-cyan-400/15 bg-black/70 p-3">
                                                                    <div className="font-mono text-[0.55rem] tracking-[0.28em] text-cyan-200/60 uppercase">
                                                                        @{cast.author}
                                                                    </div>
                                                                    <div className="mt-1 text-[0.66rem] text-cyan-100/85">
                                                                        {cast.snippet || 'Signal cached…'}
                                                                    </div>
                                                                    <div className="mt-2 flex items-center gap-3 font-mono text-[0.52rem] tracking-[0.24em] text-cyan-200/50 uppercase">
                                                                        <span>❤️ {cast.likes}</span>
                                                                        <span>🔄 {cast.recasts}</span>
                                                                        <span>💬 {cast.replies}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 text-[0.6rem] font-mono uppercase tracking-[0.26em] text-cyan-200/50">
                                                            Awaiting cast telemetry…
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-cyan-400/20 bg-black/60 p-6 text-center font-mono text-[0.65rem] tracking-[0.24em] text-cyan-200/60 uppercase">
                                            Awaiting NFT telemetry…
                                        </div>
                                    )}

                                    {(nftSignalData?.secondaryNfts?.length ?? 0) > 0 && (
                                        <div className="grid gap-3 md:grid-cols-3">
                                            {nftSignalData?.secondaryNfts?.map((nft, index) => (
                                                <div key={`${nft.name}-${index}`} className="rounded-xl border border-cyan-400/20 bg-black/60 px-4 py-3 text-center font-mono text-[0.58rem] tracking-[0.24em] text-cyan-200/70 uppercase">
                                                    <div className="text-cyan-200/50">Channel {index + 2}</div>
                                                    <div className="mt-1 text-base font-orbitron tracking-[0.18em] text-white">
                                                        {nft.name}
                                                    </div>
                                                    <div className="mt-2 text-cyan-200/50">Mentions {nft.mentions}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(nftSignalData?.trendingTokens?.length ?? 0) > 0 && (
                                        <div className="rounded-2xl border border-cyan-400/20 bg-black/60 p-5">
                                            <div className="font-mono text-[0.6rem] tracking-[0.32em] text-cyan-200/60 uppercase">
                                                Token Telemetry
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {(nftSignalData?.trendingTokens ?? []).map((token) => (
                                                    <span
                                                        key={token.symbol}
                                                        className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-black/70 px-3 py-1 font-mono text-[0.58rem] tracking-[0.3em] text-cyan-200/70 uppercase shadow-[0_0_12px_rgba(0,255,255,0.18)]"
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400/80 shadow-[0_0_10px_rgba(251,146,60,0.6)]" />
                                                        {token.symbol}
                                                        <span className="text-cyan-200/50">{token.mentions}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {nftCrossStats && (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="rounded-2xl border border-cyan-400/20 bg-black/60 p-4">
                                                <div className="font-mono text-[0.6rem] tracking-[0.32em] text-cyan-200/60 uppercase">
                                                    Cross-Ecosystem
                                                </div>
                                                <div className="mt-3 space-y-2 font-mono text-[0.6rem] tracking-[0.28em] text-cyan-200/70 uppercase">
                                                    <div className="flex items-center justify-between">
                                                        <span>Overlap</span>
                                                        <span>
                                                            {nftCrossStats?.overlapPercentage !== null && nftCrossStats?.overlapPercentage !== undefined
                                                                ? `${nftCrossStats.overlapPercentage.toFixed(2)}%`
                                                                : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span>Authors</span>
                                                        <span>{nftCrossStats?.overlappingAuthors ?? 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span>Interaction</span>
                                                        <span>
                                                            {nftCrossStats?.interactionScore !== null && nftCrossStats?.interactionScore !== undefined
                                                                ? nftCrossStats.interactionScore.toFixed(2)
                                                                : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-cyan-400/20 bg-black/60 p-4">
                                                <div className="font-mono text-[0.6rem] tracking-[0.32em] text-cyan-200/60 uppercase">
                                                    Signal Logs
                                                </div>
                                                <div className="mt-3 space-y-3">
                                                    {(nftSignalData?.topCastFragments ?? []).slice(2, 5).map((cast) => (
                                                        <div key={`${cast.author}-${cast.likes ?? 0}-log`} className="rounded-xl border border-cyan-400/15 bg-black/70 p-3">
                                                            <div className="font-mono text-[0.55rem] tracking-[0.28em] text-cyan-200/60 uppercase">
                                                                @{cast.author}
                                                            </div>
                                                            <div className="mt-1 text-[0.66rem] text-cyan-100/85">
                                                                {cast.snippet || 'Signal cached…'}
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-3 font-mono text-[0.52rem] tracking-[0.24em] text-cyan-200/50 uppercase">
                                                                <span>❤️ {cast.likes}</span>
                                                                <span>🔄 {cast.recasts}</span>
                                                                <span>💬 {cast.replies}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(nftSignalData?.topCastFragments ?? []).length <= 2 && (
                                                        <div className="text-[0.6rem] font-mono uppercase tracking-[0.26em] text-cyan-200/50">
                                                            Awaiting additional cast telemetry…
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="relative overflow-hidden border-2 border-[#00FFFF]/40 bg-black/80 shadow-[0_0_28px_rgba(0,255,255,0.14)]">
                                <div className="absolute inset-0 opacity-60 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(0,255,255,0.2),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(255,136,0,0.18),transparent_62%)]" />
                                <div className="relative px-4 py-3 border-b-2 border-[#00FFFF]/20">
                                    <div className="font-mono text-base tracking-wider text-[#00FFFF]/75 uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]">
                                        &gt; Signal Integrity Matrix
                                    </div>
                                    <div className="mt-1 flex items-end justify-between">
                                        <div>
                                            <div className="font-mono text-sm tracking-wider text-[#FF8800]/80 uppercase">
                                                &gt; Integrity Score
                                            </div>
                                            <div className="text-lg font-mono font-bold tracking-wider text-[#FFFF00] drop-shadow-[0_0_15px_rgba(255,255,0,0.8)]">
                                                {signalIntegrity.score}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-sm tracking-wider text-[#FF8800]/80 uppercase">
                                                &gt; Trend
                                            </div>
                                            <div className="font-mono text-lg font-bold tracking-wider text-[#00FFFF] drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">
                                                {signalIntegrity.trend}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative p-4 space-y-2">
                                    {signalRows.map((row) => (
                                        <div
                                            key={row.label}
                                            className="flex items-center justify-between gap-3 border-b-2 border-[#00FFFF]/10 pb-2 last:border-b-0 last:pb-0"
                                        >
                                            <div>
                                                <div className="font-mono text-sm tracking-wider text-[#00FFFF]/70 uppercase">
                                                    &gt; {row.label}
                                                </div>
                                                <div className="font-mono text-sm tracking-wider text-[#FF8800]/70 uppercase">
                                                    &gt; {row.detail}
                                                </div>
                                            </div>
                                            <div className={`font-mono text-sm tracking-wider uppercase ${ACCENT_TEXT[row.accent]}`}>
                                                {row.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative overflow-hidden border-2 border-[#00FFFF]/40 bg-black/80 shadow-[0_0_28px_rgba(0,255,255,0.15)]">
                                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(0,255,136,0.25),transparent_60%)] opacity-60" />
                                <div className="relative px-4 py-3 border-b-2 border-[#00FFFF]/20">
                                    <div className="font-mono text-base tracking-wider text-[#00FFFF]/75 uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]">
                                        &gt; Trading Console
                                    </div>
                                    <div className="mt-1 font-mono text-sm tracking-wider text-[#FF8800]/80 uppercase">
                                        &gt; Win Rate {trading ? `${trading.stats.winRate.toFixed(1)}%` : '--'} · Total Trades {trading?.stats.totalTrades ?? '--'}
                                    </div>
                                </div>
                                <div className="relative p-4 space-y-1.5 font-mono text-sm tracking-wider uppercase text-[#00FF88]/75">
                                    {recentTrades.length === 0 ? (
                                        <div className="text-[#00FFFF]/50">&gt; Awaiting trade telemetry…</div>
                                    ) : (
                                        recentTrades.map((trade, index) => (
                                            <div
                                                key={`${trade.timestamp}-${index}`}
                                                className="flex items-center justify-between gap-2 border-b-2 border-[#00FFFF]/10 pb-1.5 last:border-b-0 last:pb-0"
                                            >
                                                <span className={`text-sm ${trade.type === 'buy' ? 'text-[#00FF88]' : 'text-[#FF0044]'}`}>
                                                    {trade.type.toUpperCase()}
                                                </span>
                                                <span className="text-sm text-[#00FFFF]/70">
                                                    {trade.amount.toFixed(3)} @ ${trade.price.toFixed(6)}
                                                </span>
                                                <span className={`text-sm ${trade.profit >= 0 ? 'text-[#00FF88]' : 'text-[#FF0044]'}`}>
                                                    {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(4)}
                                                </span>
                                                <span className="text-sm text-[#FF8800]/70">{trade.timestamp}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="relative overflow-hidden border-2 border-[#00FFFF]/40 bg-black/80 shadow-[0_0_28px_rgba(0,255,255,0.15)]">
                                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_bottom_left,rgba(255,136,0,0.25),transparent_60%)] opacity-60" />
                                <div className="relative px-4 py-3 border-b-2 border-[#00FFFF]/20">
                                    <div className="font-mono text-base tracking-wider text-[#00FFFF]/75 uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]">&gt; Gas Utility Index</div>
                                    <div className="mt-1 font-mono text-sm tracking-wider text-[#FF8800]/80 uppercase">
                                        &gt; Last Burn {burnStats?.lastBurn?.burnedAt ? formatTimestamp(burnStats.lastBurn.burnedAt) : 'N/A'}
                                    </div>
                                </div>
                                <div className="relative p-4 font-mono text-sm tracking-wider uppercase text-[#00FF88]/75 space-y-1.5">
                                    {burnStats?.lastBurn ? (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span>&gt; Amount</span>
                                                <span className="text-[#FFFF00]">{burnStats.lastBurn.amount.toFixed(4)} VOT</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>&gt; Tx</span>
                                                <span className="truncate text-sm text-[#00FFFF]/60">{burnStats.lastBurn.transactionHash}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-[#00FFFF]/50">&gt; Awaiting burn telemetry…</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {votGlyph && (
                        <motion.div
                            className="relative overflow-hidden rounded-lg border border-[#00FF88]/35 bg-black/70 px-4 py-4 shadow-[0_0_26px_rgba(0,255,136,0.22)]"
                            initial={{ opacity: 0.85 }}
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                        >
                            <div className="absolute inset-0 pointer-events-none opacity-45 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.28),transparent_65%)]" />
                            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-mono text-[#00FF88] drop-shadow-[0_0_18px_rgba(0,255,136,0.8)]">
                                        {votGlyph.glyph}
                                    </span>
                                    <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#00FFFF]/75">
                                        &gt; {votGlyph.label.toUpperCase()} {' // '} {votGlyph.transliteration}
                                    </span>
                                </div>
                                <p className="font-mono text-[10px] leading-relaxed text-[#FF8800]/80 sm:max-w-xl">
                                    {votGlyph.meaning}
                                </p>
                            </div>
                        </motion.div>
                    )}

                </div>
            </div>
        </section>
    );
}
