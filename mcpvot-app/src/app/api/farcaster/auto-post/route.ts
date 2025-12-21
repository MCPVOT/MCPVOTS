import { resolvePythonExecutable, resolveWorkspaceFile } from '@/lib/python';
import { spawn } from 'child_process';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

interface TokenIntelligencePayload {
    token_info?: Record<string, unknown>;
    analysis?: Record<string, unknown>;
    dexscreener?: Record<string, unknown>;
    neynar?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
    try {
        const { tokenAddress, includeNft = true, channel = 'mcpvot' } = await request.json();

        if (!tokenAddress) {
            return NextResponse.json(
                { error: 'Token address is required' },
                { status: 400 }
            );
        }

        // Run the Python intelligence analysis
        const scriptPath = resolveWorkspaceFile('VOT_Trading_Bot', 'Clanker.world.Trader', 'token_intelligence.py');

        return new Promise<Response>((resolve) => {
            const pythonExecutable = resolvePythonExecutable();

            const pythonProcess = spawn(pythonExecutable, [
                scriptPath,
                '--token', tokenAddress,
                '--output', 'json'
            ], {
                cwd: path.dirname(scriptPath),
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

            pythonProcess.on('close', async (code) => {
                if (code !== 0) {
                    console.error('Python script failed:', stderr);
                    resolve(NextResponse.json(
                        { error: 'Intelligence analysis failed', details: stderr },
                        { status: 500 }
                    ));
                    return;
                }

                try {
                    // Parse the JSON output
                    const jsonStart = stdout.indexOf('{');
                    const jsonEnd = stdout.lastIndexOf('}');
                    if (jsonStart === -1 || jsonEnd === -1) {
                        throw new Error('No JSON found in output');
                    }

                    const jsonOutput = stdout.substring(jsonStart, jsonEnd + 1);
                    const analysisData = JSON.parse(jsonOutput) as TokenIntelligencePayload;

                    // Format for Farcaster
                    const reportText = formatIntelligenceReport(analysisData, includeNft);

                    // Post to Farcaster
                    const castResponse = await fetch('http://localhost:3000/api/farcaster/cast', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            text: reportText,
                            channel: channel
                        }),
                    });

                    if (!castResponse.ok) {
                        const errorText = await castResponse.text();
                        resolve(NextResponse.json(
                            { error: 'Failed to post to Farcaster', details: errorText },
                            { status: castResponse.status }
                        ));
                        return;
                    }

                    const castResult = await castResponse.json();

                    resolve(NextResponse.json({
                        success: true,
                        analysis: analysisData,
                        cast: castResult,
                        token: tokenAddress
                    }));

                } catch (parseError) {
                    console.error('Failed to parse analysis output:', parseError);
                    resolve(NextResponse.json(
                        { error: 'Failed to parse analysis output', details: parseError instanceof Error ? parseError.message : 'Unknown parse error' },
                        { status: 500 }
                    ));
                }
            });
        });

    } catch (error) {
        console.error('Auto-post API error:', error);
        return NextResponse.json(
            { error: 'Auto-post failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

function formatIntelligenceReport(analysisData: TokenIntelligencePayload, includeNft: boolean = true): string {
    const tokenInfo = (analysisData.token_info ?? {}) as Record<string, unknown>;
    const analysis = (analysisData.analysis ?? {}) as Record<string, unknown>;
    const dexData = (analysisData.dexscreener ?? {}) as Record<string, unknown>;
    const socialData = (analysisData.neynar ?? {}) as Record<string, unknown>;

    const tokenName = (tokenInfo.name as string | undefined) || (tokenInfo.symbol as string | undefined) || 'UNKNOWN';
    const tokenSymbol = (tokenInfo.symbol as string | undefined) || 'UNKNOWN';

    let report = `🔍 MCPVOT TOKEN INTELLIGENCE: ${tokenName} (${tokenSymbol})\n\n`;

    // Intelligence Score
    const intelligenceSection = (analysis.intelligence_score as Record<string, unknown> | undefined) ?? {};
    const intelligenceScore = intelligenceSection.score as number | string | undefined;
    const intelligenceRating = intelligenceSection.rating as string | undefined;
    const recommendation = analysis.recommendation as string | undefined;
    report += `🧠 Intelligence Score: ${intelligenceScore ?? 'N/A'}/100\n`;
    report += `📊 Rating: ${intelligenceRating ?? 'N/A'}\n`;
    report += `🎯 Recommendation: ${recommendation ?? 'N/A'}\n\n`;

    // DEX Data
    if (dexData.price_usd) {
        report += `💰 Price: $${parseFloat(String(dexData.price_usd)).toFixed(6)}\n`;
    }
    if (dexData.price_change_24h) {
        const change = parseFloat(String(dexData.price_change_24h));
        report += `📈 24h Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%\n`;
    }
    if (dexData.liquidity_usd) {
        report += `💧 Liquidity: $${parseFloat(String(dexData.liquidity_usd)).toLocaleString()}\n`;
    }
    if (dexData.volume_24h) {
        report += `📊 24h Volume: $${parseFloat(String(dexData.volume_24h)).toLocaleString()}\n`;
    }

    // Social Intelligence
    const castCount = socialData.cast_count as number | string | undefined;
    if (castCount !== undefined) {
        report += `\n📣 Social Signals:\n`;
        report += `💬 Casts: ${castCount}\n`;

        const uniqueAuthors = socialData.unique_authors as number | string | undefined;
        report += `👥 Authors: ${uniqueAuthors ?? 0}\n`;
        report += `❤️ Likes: ${(socialData.total_likes as number | undefined) ?? 0}\n`;
        report += `🔄 Recasts: ${(socialData.total_recasts as number | undefined) ?? 0}\n`;

        const engagement = socialData.avg_engagement as number | undefined;
        const formattedEngagement = engagement !== undefined ? Number(engagement).toFixed(1) : '0.0';
        report += `💭 Engagement: ${formattedEngagement}\n`;
    }

    // Add NFT intelligence if requested
    if (includeNft) {
        report += `\n🎨 NFT Intelligence Available\n`;
    }

    // Add hashtags
    report += `\n#MCPVOT #TokenIntelligence #Base #DeFi ${tokenSymbol}`;

    // Truncate if too long for Farcaster (3200 char limit)
    if (report.length > 3000) {
        report = report.substring(0, 2997) + '...';
    }

    return report;
}
