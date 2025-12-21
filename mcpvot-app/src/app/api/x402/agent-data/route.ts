import type { NeynarCast, NeynarFeedResponse, NeynarSearchCastsResult } from '@/lib/neynar/types';
import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk';
import { ethers } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Define interfaces for our data structures to avoid 'any'
interface CastAnalytics {
    totalCasts: number;
    sentiment: SentimentAnalysis;
    topMentions: string[];
    recentActivity: RecentCast[];
    engagement: EngagementMetrics;
}

interface SentimentAnalysis {
    bullish: number;
    bearish: number;
    neutral: number;
}

interface RecentCast {
    hash: string;
    text: string;
    author?: string;
    timestamp: string;
    likes: number;
    recasts: number;
}

interface EngagementMetrics {
    totalLikes: number;
    totalRecasts: number;
    avgEngagement: number;
}

// EIP-8004 Contract Addresses (Base Mainnet)
const EIP8004_CONTRACTS = {
    IdentityRegistry: '0x64B7cEA6C01d3a7c54EDa9Be8248aABbB9cbb1d2',
    ReputationRegistry: '0x58Aad11b3ab5c5817a5905d2264A30A6d771508F',
    ValidationRegistry: '0x593479d55492b85D8BB0302F6eD8A06fe8D85fAa'
};

// EIP-8004 Contract ABIs
const IDENTITY_REGISTRY_ABI = [
    "function getMetadata(uint256 agentId, string calldata key) external view returns (bytes memory)",
    "function totalSupply() external view returns (uint256)",
    "function ownerOf(uint256 tokenId) external view returns (address)"
];

const REPUTATION_REGISTRY_ABI = [
    "function getReputation(uint256 agentId) external view returns (uint256 score, uint256 totalFeedback, uint256 positiveFeedback)",
    "function submitFeedback(uint256 agentId, uint256 score, string calldata comment) external",
    "function getFeedbackHistory(uint256 agentId) external view returns (tuple(uint256 score, string comment, address submitter, uint256 timestamp)[] memory)"
];

const VALIDATION_REGISTRY_ABI = [
    "function validateAgent(uint256 agentId) external view returns (bool isValid, string memory validationReason)",
    "function requestValidation(uint256 agentId, bytes calldata evidence) external",
    "function getValidationHistory(uint256 agentId) external view returns (tuple(bool approved, string reason, address validator, uint256 timestamp)[] memory)"
];

// Initialize Neynar client
const config = new Configuration({
    apiKey: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || '',
});
const neynarClient = new NeynarAPIClient(config);

// Initialize Base provider
const baseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');

// Initialize EIP-8004 contracts
const identityRegistry = new ethers.Contract(EIP8004_CONTRACTS.IdentityRegistry, IDENTITY_REGISTRY_ABI, baseProvider);
const reputationRegistry = new ethers.Contract(EIP8004_CONTRACTS.ReputationRegistry, REPUTATION_REGISTRY_ABI, baseProvider);
const validationRegistry = new ethers.Contract(EIP8004_CONTRACTS.ValidationRegistry, VALIDATION_REGISTRY_ABI, baseProvider);

// Simple in-memory cache per process
type AgentDataPayload = CastAnalytics | NeynarFeedResponse;
type CacheEntry = { data: AgentDataPayload; expiresAt: number; cid: string };
const cache: Record<string, CacheEntry> = {};

// EIP-8004 Integration Functions
async function getAgentReputation(agentId: number) {
    try {
        const [score, totalFeedback, positiveFeedback] = await reputationRegistry.getReputation(agentId);
        return {
            score: Number(score),
            totalFeedback: Number(totalFeedback),
            positiveFeedback: Number(positiveFeedback),
            rating: totalFeedback > 0 ? (Number(positiveFeedback) / Number(totalFeedback)) * 100 : 0
        };
    } catch (error) {
        console.error('Error fetching agent reputation:', error);
        return { score: 0, totalFeedback: 0, positiveFeedback: 0, rating: 0 };
    }
}

async function getAgentValidation(agentId: number) {
    try {
        const [isValid, validationReason] = await validationRegistry.validateAgent(agentId);
        return { isValid, validationReason };
    } catch (error) {
        console.error('Error fetching agent validation:', error);
        return { isValid: false, validationReason: 'Validation check failed' };
    }
}

async function getAgentMetadata(agentId: number) {
    try {
        const metadata: Record<string, string> = {};
        const keys = ['name', 'description', 'category', 'capabilities', 'version'];

        for (const key of keys) {
            try {
                const value = await identityRegistry.getMetadata(agentId, key);
                if (value && value !== '0x') {
                    metadata[key] = ethers.toUtf8String(value);
                }
            } catch {
                // Key doesn't exist, continue
            }
        }

        return metadata;
    } catch (error) {
        console.error('Error fetching agent metadata:', error);
        return {};
    }
}

async function getTotalAgents(): Promise<number> {
    try {
        const total = await identityRegistry.totalSupply();
        return Number(total);
    } catch (error) {
        console.error('Error fetching total agents:', error);
        return 0;
    }
}

async function fetchNeynarData(type: string): Promise<AgentDataPayload> {
    if (type === 'clanker') {
        // Search for Clanker-related casts
        const response = await neynarClient.searchCasts({
            q: 'clanker OR "clanker world" OR $CLANKER',
            limit: 25,
        }) as NeynarSearchCastsResult;

        // Process and analyze the cast data
        const casts = (response.result?.casts ?? []).map(normalizeCast);
        const analytics: CastAnalytics = {
            totalCasts: casts.length,
            sentiment: analyzeSentiment(casts),
            topMentions: extractTopMentions(casts),
            recentActivity: casts.slice(0, 5).map((cast): RecentCast => ({
                hash: cast.hash ?? 'unknown',
                text: truncateText(cast.text ?? ''),
                author: cast.author?.username,
                timestamp: cast.timestamp ?? new Date().toISOString(),
                likes: cast.reactions?.likes_count ?? 0,
                recasts: cast.reactions?.recasts_count ?? 0,
            })),
            engagement: calculateEngagement(casts),
        };

        return analytics;

    } else if (type === 'farcaster') {
        // Get general Farcaster feed data
        const response = await neynarClient.fetchFeed({
            feedType: 'following',
            fid: 1, // Use a default FID
            limit: 10,
        });
        const feedCasts = Array.isArray((response as { casts?: unknown }).casts)
            ? (response as { casts?: NeynarCast[] }).casts ?? []
            : [];

        const payload: NeynarFeedResponse = {
            feedData: {
                casts: feedCasts.map(normalizeCast),
                next: (response as { next?: unknown }).next,
            },
            networkInfo: {
                activeUsers: 'Real-time data from Neynar',
                totalCasts: 'Real-time data from Neynar',
                timestamp: new Date().toISOString(),
            },
        };

        return payload;
    }

    throw new Error(`Unsupported type: ${type}`);
}

function analyzeSentiment(casts: NeynarCast[]): SentimentAnalysis {
    let bullish = 0, bearish = 0, neutral = 0;

    const bullishWords = ['moon', 'pump', 'bullish', 'buy', 'long', 'hodl', 'diamond', 'gem', '🚀', '💎'];
    const bearishWords = ['dump', 'sell', 'bearish', 'short', 'crash', 'rekt', 'paper', 'rug', 'scam'];

    casts.forEach((cast) => {
        const text = (cast.text ?? '').toLowerCase();
        const hasBullish = bullishWords.some(word => text.includes(word));
        const hasBearish = bearishWords.some(word => text.includes(word));

        if (hasBullish && !hasBearish) bullish++;
        else if (hasBearish && !hasBullish) bearish++;
        else neutral++;
    });

    return { bullish, bearish, neutral };
}

function extractTopMentions(casts: NeynarCast[]): string[] {
    const mentions: Record<string, number> = {};

    casts.forEach((cast) => {
        const text = cast.text ?? '';
        const mentionRegex = /\$([A-Z]+)/g;
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            const token = match[1];
            mentions[token] = (mentions[token] || 0) + 1;
        }
    });

    return Object.entries(mentions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([token]) => token);
}

function calculateEngagement(casts: NeynarCast[]): EngagementMetrics {
    const totalLikes = casts.reduce((sum, cast) => sum + (cast.reactions?.likes_count ?? 0), 0);
    const totalRecasts = casts.reduce((sum, cast) => sum + (cast.reactions?.recasts_count ?? 0), 0);
    const avgEngagement = casts.length > 0 ? (totalLikes + totalRecasts) / casts.length : 0;

    return { totalLikes, totalRecasts, avgEngagement };
}

function normalizeCast(cast: NeynarCast): NeynarCast {
    return {
        hash: cast.hash ?? 'unknown',
        text: cast.text ?? '',
        author: cast.author ?? {},
        timestamp: cast.timestamp ?? new Date().toISOString(),
        reactions: {
            likes_count: cast.reactions?.likes_count ?? 0,
            recasts_count: cast.reactions?.recasts_count ?? 0,
        },
    };
}

function truncateText(text: string, maxLength = 200): string {
    if (text.length <= maxLength) {
        return text;
    }
    return `${text.substring(0, maxLength)}...`;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = (searchParams.get('type') || 'clanker').toLowerCase();
        const agentId = searchParams.get('agentId') ? parseInt(searchParams.get('agentId')!) : null;

        if (!['clanker', 'farcaster', 'agents'].includes(type)) {
            return NextResponse.json({ success: false, error: 'Invalid type. Use clanker|farcaster|agents' }, { status: 400 });
        }

        // Handle EIP-8004 agent data requests
        if (type === 'agents') {
            if (agentId !== null) {
                // Get specific agent data
                const [reputation, validation, metadata] = await Promise.all([
                    getAgentReputation(agentId),
                    getAgentValidation(agentId),
                    getAgentMetadata(agentId)
                ]);

                return NextResponse.json({
                    success: true,
                    source: 'eip8004',
                    type: 'agent',
                    agentId,
                    data: {
                        reputation,
                        validation,
                        metadata,
                        owner: await identityRegistry.ownerOf(agentId).catch(() => null)
                    },
                    timestamp: Date.now()
                });
            } else {
                // Get all agents summary
                const totalAgents = await getTotalAgents();
                const agents = [];

                // Get first 10 agents as example
                for (let i = 1; i <= Math.min(totalAgents, 10); i++) {
                    try {
                        const [reputation, validation, metadata] = await Promise.all([
                            getAgentReputation(i),
                            getAgentValidation(i),
                            getAgentMetadata(i)
                        ]);

                        agents.push({
                            id: i,
                            reputation,
                            validation,
                            metadata,
                            owner: await identityRegistry.ownerOf(i).catch(() => null)
                        });
                    } catch (error) {
                        console.error(`Error fetching agent ${i}:`, error);
                    }
                }

                return NextResponse.json({
                    success: true,
                    source: 'eip8004',
                    type: 'agents',
                    data: {
                        totalAgents,
                        agents,
                        note: 'Trustless agent registry data from EIP-8004 contracts'
                    },
                    timestamp: Date.now()
                });
            }
        }

        // Handle Neynar data requests (clanker/farcaster)
        // Cache key includes type
        const key = `neynar:${type}`;
        const now = Date.now();
        const cached = cache[key];
        if (cached && cached.expiresAt > now) {
            return NextResponse.json({
                success: true,
                source: 'cache',
                type,
                cid: cached.cid,
                data: cached.data,
                timestamp: now,
                note: 'Real Neynar API data (cached)'
            });
        }

        const data = await fetchNeynarData(type);
        const cid = `neynar-${type}-${Date.now()}`; // Generate a pseudo-CID for caching
        cache[key] = { data, cid, expiresAt: now + 30_000 }; // 30s TTL for real-time data

        return NextResponse.json({
            success: true,
            source: 'neynar',
            type,
            cid,
            data,
            timestamp: now,
            note: 'Real Neynar API data'
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch x402 agent data';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
