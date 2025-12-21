import { resolvePythonExecutable, resolveWorkspaceFile } from '@/lib/python';
import { spawn } from 'child_process';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

interface CastData {
    text?: string;
    sentiment?: string;
    score?: number;
    timestamp?: string;
    author?: string;
}

interface TokenSentiment {
    token: string;
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
    score: number;
    castCount: number;
    positiveCount: number;
    negativeCount: number;
    recentCasts: Array<{
        text: string;
        sentiment: string;
        score: number;
        timestamp: string;
        author: string;
    }>;
}

// Simple in-memory cache for sentiment data
const sentimentCache = new Map<string, { data: TokenSentiment; timestamp: number }>();
const SENTIMENT_CACHE_DURATION = 60000; // 1 minute for sentiment data

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token') || 'VOT';
        const limit = parseInt(searchParams.get('limit') || '20');
        const hours = parseInt(searchParams.get('hours') || '24');

        // Check cache first
        const cacheKey = `${token}-${limit}-${hours}`;
        const cached = sentimentCache.get(cacheKey);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < SENTIMENT_CACHE_DURATION) {
            console.log(`Sentiment cache hit for ${cacheKey}`);
            return NextResponse.json({
                token,
                sentiment: cached.data,
                timestamp: new Date().toISOString(),
                source: 'neynar-sentiment-analyzer',
                cached: true
            });
        }

        // Call the Python sentiment analyzer
        const sentimentData = await runSentimentAnalysis(token, limit, hours);

        // Cache the result
        sentimentCache.set(cacheKey, {
            data: sentimentData,
            timestamp: now
        });

        return NextResponse.json({
            token,
            sentiment: sentimentData,
            timestamp: new Date().toISOString(),
            source: 'neynar-sentiment-analyzer'
        });

    } catch (error) {
        console.error('Sentiment analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze sentiment' },
            { status: 500 }
        );
    }
}

async function runSentimentAnalysis(token: string, limit: number, hours: number): Promise<TokenSentiment> {
    return new Promise((resolve, reject) => {
        const pythonScript = resolveWorkspaceFile('VOT_Trading_Bot', 'farcaster_sentiment_analyzer.py');
        const pythonExecutable = resolvePythonExecutable();

        const pythonProcess = spawn(pythonExecutable, [
            pythonScript,
            '--token', token,
            '--limit', limit.toString(),
            '--hours', hours.toString(),
            '--json-output'
        ], {
            cwd: path.dirname(pythonScript),
            stdio: ['pipe', 'pipe', 'pipe'],
            env: process.env
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Python process failed:', stderr);
                reject(new Error(`Sentiment analysis failed: ${stderr}`));
                return;
            }

            try {
                const result = JSON.parse(stdout.trim());

                // Transform the result to match our interface
                const sentiment: TokenSentiment = {
                    token: result.token || token,
                    overallSentiment: result.overall_sentiment || 'neutral',
                    score: result.overall_score || 0,
                    castCount: result.total_casts || 0,
                    positiveCount: result.positive_casts || 0,
                    negativeCount: result.negative_casts || 0,
                    recentCasts: (result.recent_casts || []).map((cast: CastData) => ({
                        text: cast.text || '',
                        sentiment: cast.sentiment || 'neutral',
                        score: cast.score || 0,
                        timestamp: cast.timestamp || new Date().toISOString(),
                        author: cast.author || 'unknown'
                    }))
                };

                resolve(sentiment);
            } catch (parseError) {
                console.error('Failed to parse sentiment result:', parseError);
                reject(new Error('Invalid sentiment analysis output'));
            }
        });

        pythonProcess.on('error', (error) => {
            console.error('Failed to start sentiment analysis:', error);
            reject(error);
        });
    });
}
