import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { promisify } from 'util';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

// Allow explicit override via env var
const envReportDir = process.env.REPORT_DIR || process.env.INTELLIGENCE_CACHE_DIR || process.env.VOT_INTELLIGENCE_DIR;
let reportDir = envReportDir ? path.resolve(envReportDir) : path.join(process.cwd(), '..', 'VOT_Trading_Bot', 'reports');
let jsonReportPath = path.join(reportDir, 'farcaster_ecosystem_report.json');
let textReportPath = path.join(reportDir, 'farcaster_ecosystem_report.txt');
const analyzerCwd = path.join(process.cwd(), '..', 'VOT_Trading_Bot');
const analyzerScript = path.join(analyzerCwd, 'farcaster_ecosystem_analyzer.py');

// Fallback report directory used when the default `reportDir` can't be created due to permissions.
let fallbackReportDir: string | undefined;

async function ensureReportFreshness() {
    try {
        // If the directory is rootish or under /var in a serverless environment, avoid writing there
        if (!envReportDir && reportDir.startsWith('/var')) {
            throw new Error('Default report directory appears to be in /var; switching to temp fallback to avoid permission errors');
        }
        await fs.mkdir(reportDir, { recursive: true });
    } catch (err) {
        console.error('Failed to create initial report directory, will attempt fallback:', err);
        console.error('Failed to create initial report directory, will attempt fallback:', err);
        // Fallback to runtime temp directory to avoid permission issues (e.g., Vercel)
        try {
            const tmp = process.env.TMPDIR || process.env.TEMP || process.env.TMP || '/tmp';
            // Use a temp subdirectory to store reports
            const fallbackDir = path.join(tmp, 'mcpvot_reports');
            await fs.mkdir(fallbackDir, { recursive: true });
            // Update paths to fallback
            fallbackReportDir = fallbackDir;
            reportDir = fallbackDir;
            jsonReportPath = path.join(reportDir, 'farcaster_ecosystem_report.json');
            textReportPath = path.join(reportDir, 'farcaster_ecosystem_report.txt');
        } catch (inner) {
            console.error('Failed to create fallback report directory:', inner);
            throw inner;
        }
    }

    try {
        const stats = await fs.stat(textReportPath);
        const age = Date.now() - stats.mtimeMs;
        if (age < THIRTY_MINUTES_MS) {
            return;
        }
    } catch {
        // File missing or unreadable, trigger regeneration below
    }

    const cwd = fallbackReportDir ? path.join(fallbackReportDir, '..') : analyzerCwd;
    try {
        await execFileAsync('python', [
            '-X',
            'utf8',
            analyzerScript,
            '--hours',
            '24',
            '--output-json',
            jsonReportPath,
            '--output-report',
            textReportPath,
        ], {
            cwd,
            windowsHide: true,
            env: {
                ...process.env,
                PYTHONIOENCODING: 'utf-8',
                PYTHONUTF8: '1',
            },
        });
    } catch (err) {
        // If generation fails, log and allow GET() to return stale or missing reports
        console.error('Failed to generate report via analyzerScript:', err);
        return;
    }
}

export async function GET() {
    try {
        await ensureReportFreshness();

        const [textReport, jsonReportRaw] = await Promise.all([
            fs.readFile(textReportPath, 'utf-8'),
            fs.readFile(jsonReportPath, 'utf-8').catch(() => null),
        ]);

        let metadata: Record<string, unknown> | null = null;
        if (jsonReportRaw) {
            try {
                metadata = JSON.parse(jsonReportRaw);
            } catch {
                metadata = null;
            }
        }

        return NextResponse.json({
            success: true,
            reportText: textReport,
            metadata,
            generatedAt: metadata && typeof metadata === 'object'
                ? (metadata as { timestamp?: string }).timestamp ?? null
                : null,
            refreshedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Farcaster ecosystem report error:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to generate Farcaster ecosystem report',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
