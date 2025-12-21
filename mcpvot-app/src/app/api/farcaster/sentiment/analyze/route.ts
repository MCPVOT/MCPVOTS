import { NextRequest, NextResponse } from 'next/server';

interface SentimentAnalysisRequest {
    text: string;
}

interface SentimentResult {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
}

export async function POST(request: NextRequest) {
    try {
        const { text }: SentimentAnalysisRequest = await request.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Text is required for sentiment analysis' },
                { status: 400 }
            );
        }

        // Call the Python sentiment analyzer for individual text
        const sentiment = await analyzeTextSentiment(text);

        return NextResponse.json(sentiment);

    } catch (error) {
        console.error('Sentiment analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze sentiment' },
            { status: 500 }
        );
    }
}

async function analyzeTextSentiment(text: string): Promise<SentimentResult> {
    // For now, we'll use a simple rule-based approach
    // In production, this would call the Python sentiment analyzer
    const positiveWords = ['bullish', 'moon', 'pump', 'up', 'gain', 'profit', 'buy', 'long', 'green', 'rocket', '🚀', '📈', '🟢'];
    const negativeWords = ['bearish', 'dump', 'down', 'loss', 'sell', 'short', 'red', 'crash', '📉', '🔴'];

    const lowerText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach((word) => {
        const count = (lowerText.match(new RegExp(word, 'g')) || []).length;
        positiveScore += count;
    });

    negativeWords.forEach((word) => {
        const count = (lowerText.match(new RegExp(word, 'g')) || []).length;
        negativeScore += count;
    });

    const totalScore = positiveScore - negativeScore;
    const confidence = Math.min(Math.abs(totalScore) / Math.max(lowerText.split(' ').length / 10, 1), 1);

    let sentiment: 'positive' | 'negative' | 'neutral';
    if (totalScore > 0.5) {
        sentiment = 'positive';
    } else if (totalScore < -0.5) {
        sentiment = 'negative';
    } else {
        sentiment = 'neutral';
    }

    return {
        sentiment,
        score: totalScore,
        confidence,
    };
}
