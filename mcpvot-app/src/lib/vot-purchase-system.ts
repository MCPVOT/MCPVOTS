import { PaymentMemoryService } from '@/lib/payment-memory';
import { VOTTokenService } from '@/lib/vot-token';
import { WarpletCollector } from '@/lib/warplet/collector';

interface PurchaseSignal {
    type: 'sentiment' | 'engagement' | 'trend';
    strength: number; // 0-1 scale
    reason: string;
    timestamp: Date;
}

interface PurchaseDecision {
    shouldBuy: boolean;
    amount: number; // in USD
    confidence: number; // 0-1 scale
    signals: PurchaseSignal[];
    reasoning: string;
}

interface FarcasterSignal {
    castHash: string;
    authorFid: number;
    text: string;
    timestamp: Date;
    engagement: {
        likes: number;
        recasts: number;
        replies: number;
    };
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
}

interface FarcasterSummary {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
}

interface OnchainSignal {
    txHash: string;
    blockNumber: number;
    timestamp: Date;
    type: 'swap' | 'liquidity' | 'mint' | 'burn' | 'transfer';
    tokenAddress: string;
    amount: bigint;
    value: bigint;
    sender: string;
    receiver?: string;
    contract: string;
    significance: 'high' | 'medium' | 'low';
}

interface OnchainSummary {
    swaps: number;
    transfers: number;
    mints: number;
    burns: number;
    liquidity: number;
    total: number;
    highSignificance: number;
}

interface WarpletAnalytics {
    farcaster: {
        signals: FarcasterSignal[];
        summary: FarcasterSummary;
        cid?: string;
    };
    onchain: {
        signals: OnchainSignal[];
        summary: OnchainSummary;
        cid?: string;
    };
    combined: {
        totalSignals: number;
        timestamp: string;
        version: string;
    };
}

export class VOTPurchaseSystem {
    private votService: VOTTokenService;
    private collector: WarpletCollector;
    private memoryService: PaymentMemoryService;
    private lastPurchaseTime: Date | null = null;
    private purchaseCooldown = 5 * 60 * 1000; // 5 minutes

    constructor(
        neynarApiKey: string,
        paymentPrivateKey: string,
        ipfsUrl?: string
    ) {
        this.votService = new VOTTokenService(paymentPrivateKey);
        this.collector = new WarpletCollector(neynarApiKey, ipfsUrl);
        this.memoryService = PaymentMemoryService.getInstance();
    }

    async analyzeAndPurchase(): Promise<PurchaseDecision> {
        try {
            // Get latest analytics
            const analytics = await this.collector.getLatestAnalytics();
            if (!analytics) {
                return {
                    shouldBuy: false,
                    amount: 0,
                    confidence: 0,
                    signals: [],
                    reasoning: 'Failed to collect analytics data'
                };
            }

            // Analyze signals
            const signals = this.analyzeSignals(analytics);
            const decision = this.makePurchaseDecision(signals);

            // Execute purchase if conditions met
            if (decision.shouldBuy && this.canPurchase()) {
                await this.executePurchase(decision.amount, decision);
                this.lastPurchaseTime = new Date();
            }

            return decision;

        } catch (error) {
            console.error('Error in analyzeAndPurchase:', error);
            return {
                shouldBuy: false,
                amount: 0,
                confidence: 0,
                signals: [],
                reasoning: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    private analyzeSignals(analytics: WarpletAnalytics): PurchaseSignal[] {
        const signals: PurchaseSignal[] = [];

        // Analyze Farcaster sentiment
        const farcasterSummary = analytics.farcaster.summary;
        const totalSignals = farcasterSummary.total;

        if (totalSignals > 0) {
            const positiveRatio = farcasterSummary.positive / totalSignals;

            // Strong positive sentiment signal
            if (positiveRatio > 0.6) {
                signals.push({
                    type: 'sentiment',
                    strength: Math.min(positiveRatio, 1),
                    reason: `${(positiveRatio * 100).toFixed(1)}% positive sentiment in Farcaster discussions`,
                    timestamp: new Date()
                });
            }

            // High engagement signal
            const highEngagementSignals = analytics.farcaster.signals.filter(
                (signal: { engagement: { likes: number; recasts: number; replies: number } }) =>
                    (signal.engagement.likes + signal.engagement.recasts + signal.engagement.replies) > 10
            );

            if (highEngagementSignals.length > totalSignals * 0.3) {
                signals.push({
                    type: 'engagement',
                    strength: Math.min(highEngagementSignals.length / totalSignals, 1),
                    reason: `${highEngagementSignals.length} highly engaged posts (${(highEngagementSignals.length / totalSignals * 100).toFixed(1)}% of total)`,
                    timestamp: new Date()
                });
            }
        }

        // Analyze on-chain activity
        const onchainSummary = analytics.onchain.summary;
        if (onchainSummary && onchainSummary.total > 0) {
            signals.push({
                type: 'trend',
                strength: Math.min(onchainSummary.total / 100, 1), // Scale based on activity
                reason: `${onchainSummary.total} on-chain transactions detected`,
                timestamp: new Date()
            });
        }

        return signals;
    }

    private makePurchaseDecision(signals: PurchaseSignal[]): PurchaseDecision {
        if (signals.length === 0) {
            return {
                shouldBuy: false,
                amount: 0,
                confidence: 0,
                signals,
                reasoning: 'No significant signals detected'
            };
        }

        // Calculate weighted confidence
        let totalWeight = 0;
        let weightedConfidence = 0;

        for (const signal of signals) {
            let weight = 1;
            switch (signal.type) {
                case 'sentiment': weight = 0.4; break;
                case 'engagement': weight = 0.4; break;
                case 'trend': weight = 0.2; break;
            }

            totalWeight += weight;
            weightedConfidence += signal.strength * weight;
        }

        const confidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;

        // Decision thresholds
        const shouldBuy = confidence > 0.6 && signals.length >= 2;
        const amount = shouldBuy ? Math.min(confidence * 50, 25) : 0; // Max $25 purchase

        return {
            shouldBuy,
            amount,
            confidence,
            signals,
            reasoning: shouldBuy
                ? `Strong signals detected (confidence: ${(confidence * 100).toFixed(1)}%) - purchasing $${amount.toFixed(2)} worth of VOT`
                : `Insufficient signal strength (confidence: ${(confidence * 100).toFixed(1)}%)`
        };
    }

    private canPurchase(): boolean {
        if (!this.lastPurchaseTime) return true;

        const timeSinceLastPurchase = Date.now() - this.lastPurchaseTime.getTime();
        return timeSinceLastPurchase >= this.purchaseCooldown;
    }

    private async executePurchase(usdAmount: number, decision: PurchaseDecision): Promise<void> {
        try {
            console.log(`Executing VOT purchase for $${usdAmount.toFixed(2)}`);

            // Get current VOT price (simplified - in real implementation, use price feed)
            const votPrice = await this.getVOTPrice();

            // Calculate token amount
            const tokenAmount = usdAmount / votPrice;

            // Execute purchase through VOT service
            const result = await this.votService.microPayment(tokenAmount.toString(), 'warplet-analytics-system');

            // Store payment record in MCP memory
            await this.memoryService.storePaymentRecord({
                timestamp: new Date(),
                amount: usdAmount,
                tokenAmount,
                reason: decision.reasoning,
                signals: decision.signals,
                confidence: decision.confidence,
                status: 'completed',
                transactionHash: result?.txHash // Use txHash from result
            });

            console.log(`Successfully purchased ${tokenAmount.toFixed(4)} VOT tokens`, result);

        } catch (error) {
            console.error('Failed to execute VOT purchase:', error);

            // Store failed payment record
            try {
                await this.memoryService.storePaymentRecord({
                    timestamp: new Date(),
                    amount: usdAmount,
                    tokenAmount: usdAmount / (await this.getVOTPrice()),
                    reason: decision.reasoning,
                    signals: decision.signals,
                    confidence: decision.confidence,
                    status: 'failed'
                });
            } catch (memoryError) {
                console.error('Failed to store failed payment record:', memoryError);
            }

            throw error;
        }
    }

    private async getVOTPrice(): Promise<number> {
        // Simplified price fetching - in production, use proper price feeds
        try {
            // This would integrate with price APIs like Birdeye, CoinGecko, etc.
            // For now, return a placeholder price
            return 0.0001; // $0.0001 per VOT (placeholder)
        } catch (error) {
            console.error('Failed to get VOT price:', error);
            return 0.0001; // Fallback price
        }
    }

    getLastPurchaseTime(): Date | null {
        return this.lastPurchaseTime;
    }

    async getAnalyticsSummary() {
        const analytics = await this.collector.getLatestAnalytics();
        return analytics;
    }
}
