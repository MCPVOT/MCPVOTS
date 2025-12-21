import { FarcasterWorker } from './farcaster-worker';
import { IPFSWorker } from './ipfs-worker';
import { OnChainWorker } from './onchain-worker';

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

export class WarpletCollector {
    private farcasterWorker: FarcasterWorker;
    private onchainWorker: OnChainWorker;
    private ipfsWorker: IPFSWorker;

    constructor(
        neynarApiKey: string,
        ipfsUrl?: string
    ) {
        this.farcasterWorker = new FarcasterWorker(neynarApiKey);
        this.onchainWorker = new OnChainWorker();
        this.ipfsWorker = new IPFSWorker(ipfsUrl);
    }

    async collectAllAnalytics(hoursBack: number = 24): Promise<WarpletAnalytics> {
        console.log(`Collecting Warplet analytics for the last ${hoursBack} hours...`);

        // Collect signals in parallel
        const [farcasterSignals, onchainSignals] = await Promise.all([
            this.farcasterWorker.collectSignals(),
            this.onchainWorker.collectSignals(hoursBack),
        ]);

        // Generate summaries
        const farcasterSummary = this.farcasterWorker.getSentimentSummary();
        const onchainSummary = this.onchainWorker.getActivitySummary() as unknown as OnchainSummary;

        // Pin to IPFS
        const [farcasterCid, onchainCid] = await Promise.all([
            this.ipfsWorker.pinAnalyticsBatch(farcasterSignals, 'farcaster'),
            this.ipfsWorker.pinAnalyticsBatch(onchainSignals, 'onchain'),
        ]);

        const analytics: WarpletAnalytics = {
            farcaster: {
                signals: farcasterSignals,
                summary: farcasterSummary,
                cid: farcasterCid,
            },
            onchain: {
                signals: onchainSignals,
                summary: onchainSummary,
                cid: onchainCid,
            },
            combined: {
                totalSignals: farcasterSignals.length + onchainSignals.length,
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            },
        };

        console.log(`Collected ${analytics.combined.totalSignals} total signals`);
        return analytics;
    }

    async getLatestAnalytics(): Promise<WarpletAnalytics | null> {
        // In a real implementation, this would fetch from cache/database
        // For now, return fresh collection
        return this.collectAllAnalytics(24);
    }

    getWorkers() {
        return {
            farcaster: this.farcasterWorker,
            onchain: this.onchainWorker,
            ipfs: this.ipfsWorker,
        };
    }
}
