import { NeynarAPIClient } from '@neynar/nodejs-sdk';

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

export class FarcasterWorker {
    private client: NeynarAPIClient;
    private mcpEndpoint: string;
    private signals: FarcasterSignal[] = [];

    constructor(apiKey: string) {
        this.client = new NeynarAPIClient({ apiKey });
        this.mcpEndpoint = process.env.MCP_ENDPOINT || 'http://localhost:3001';
    }

    async collectSignals(): Promise<FarcasterSignal[]> {
        try {
            // For now, return empty signals - Farcaster worker needs Neynar API update
            return [];
            /*
            // Search for casts related to Base/DeFi/VOT tokens
            const searchTerms = ['base', 'vot', 'degen', 'pumpfun', 'memecoin'];
            const allSignals: FarcasterSignal[] = [];
            const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

            for (const term of searchTerms) {
                try {
                    const response = await this.client.searchCasts(term, {
                        limit: 50,
                    });

                    if (response.result && response.result.casts) {
                        // Filter by time and convert to signals
                        const recentCasts = response.result.casts.filter(cast =>
                            new Date(cast.timestamp) >= new Date(since)
                        );

                        for (const cast of recentCasts) {
                            const signal: FarcasterSignal = {
                                castHash: cast.hash,
                                authorFid: cast.author.fid,
                                text: cast.text,
                                timestamp: new Date(cast.timestamp),
                                engagement: {
                                    likes: cast.reactions.likes_count || 0,
                                    recasts: cast.reactions.recasts_count || 0,
                                    replies: cast.replies.count || 0,
                                },
                                sentiment: this.analyzeSentiment(cast.text),
                                topics: this.extractTopics(cast.text),
                            };

                            allSignals.push(signal);
                        }
                    }
                } catch (error) {
                    console.warn(`Error searching for term "${term}":`, error);
                    continue;
                }
            }

            // Sort by engagement score
            allSignals.sort((a, b) => {
                const scoreA = a.engagement.likes + a.engagement.recasts * 2 + a.engagement.replies * 3;
                const scoreB = b.engagement.likes + b.engagement.recasts * 2 + b.engagement.replies * 3;
                return scoreB - scoreA;
            });

            this.signals = allSignals.slice(0, 100); // Keep top 100
            return this.signals;
            */
        } catch (error) {
            console.error('Error collecting Farcaster signals:', error);
            return [];
        }
    }

    private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
        const positiveWords = ['bullish', 'moon', 'pump', 'gains', 'profit', 'success', 'amazing', 'great'];
        const negativeWords = ['bearish', 'dump', 'crash', 'loss', 'scam', 'rug', 'terrible', 'bad'];

        const lowerText = text.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    private extractTopics(text: string): string[] {
        const topics: string[] = [];
        const lowerText = text.toLowerCase();

        if (lowerText.includes('base') || lowerText.includes('8453')) topics.push('base');
        if (lowerText.includes('vot') || lowerText.includes('vots')) topics.push('vot');
        if (lowerText.includes('degen')) topics.push('degen');
        if (lowerText.includes('memecoin') || lowerText.includes('meme')) topics.push('memecoin');
        if (lowerText.includes('defi') || lowerText.includes('yield')) topics.push('defi');
        if (lowerText.includes('nft')) topics.push('nft');

        return topics;
    }

    getSignals(): FarcasterSignal[] {
        return this.signals;
    }

    getSentimentSummary() {
        const summary = {
            positive: 0,
            negative: 0,
            neutral: 0,
            total: this.signals.length,
        };

        for (const signal of this.signals) {
            summary[signal.sentiment]++;
        }

        return summary;
    }
}
