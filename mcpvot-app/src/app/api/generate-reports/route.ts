import { resolvePythonExecutable } from '@/lib/python';
import { spawn } from 'child_process';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const { tokenData } = await request.json();

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Token data is required' },
                { status: 400 }
            );
        }

        // Run the Python report generator
        const scriptPath = path.join(process.cwd(), 'report_api.py');

        return new Promise<Response>((resolve) => {
            const pythonExecutable = resolvePythonExecutable();

            const pythonProcess = spawn(pythonExecutable, [scriptPath, '--json-input'], {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
                env: process.env
            });

            let stdout = '';
            let stderr = '';

            // Send token data as JSON to stdin
            pythonProcess.stdin.write(JSON.stringify(tokenData));
            pythonProcess.stdin.end();

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(stdout);
                        resolve(NextResponse.json({
                            success: true,
                            reports: result.reports,
                            message: `Generated ${result.total_reports} styled reports with images`
                        }));
                    } catch (parseError) {
                        console.error('Failed to parse Python output:', parseError);
                        resolve(NextResponse.json({
                            success: false,
                            error: 'Failed to parse Python output'
                        }, { status: 500 }));
                    }
                } else {
                    resolve(NextResponse.json({
                        success: false,
                        error: stderr || 'Python script failed'
                    }, { status: 500 }));
                }
            });

            pythonProcess.on('error', (error) => {
                resolve(NextResponse.json({
                    success: false,
                    error: `Failed to start Python process: ${error.message}`
                }, { status: 500 }));
            });
        });

    } catch (error) {
        console.error('Report generation API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET endpoint to list generated reports
export async function GET() {
    try {
        const reportsDir = path.join(process.cwd(), 'reports');
        const imagesDir = path.join(reportsDir, 'images');

        const reports: Array<{ filename: string; path: string; style: string }> = [];
        const images: Array<{ filename: string; path: string; style: string }> = [];

        if (fs.existsSync(reportsDir)) {
            reports.push(
                ...fs.readdirSync(reportsDir)
                    .filter((file) => file.endsWith('.txt'))
                    .map((file) => ({
                        filename: file,
                        path: `/reports/${file}`,
                        style: file.split('_')[0]
                    }))
            );
        }

        if (fs.existsSync(imagesDir)) {
            images.push(
                ...fs.readdirSync(imagesDir)
                    .filter((file) => file.endsWith('.png'))
                    .map((file) => ({
                        filename: file,
                        path: `/reports/images/${file}`,
                        style: file.split('_')[0]
                    }))
            );
        }

        return NextResponse.json({
            success: true,
            reports,
            images,
            total: reports.length + images.length
        });

    } catch (error) {
        console.error('List reports API error:', error);
        return NextResponse.json(
            { error: 'Failed to list reports' },
            { status: 500 }
        );
    }
}
