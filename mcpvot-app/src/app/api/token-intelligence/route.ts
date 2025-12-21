import { resolvePythonExecutable, resolveWorkspaceFile } from '@/lib/python';
import { spawn } from 'child_process';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tokenAddress = searchParams.get('address');

        if (!tokenAddress) {
            return NextResponse.json(
                { error: 'Token address is required' },
                { status: 400 }
            );
        }

        // Path to the Python intelligence script
        const scriptPath = resolveWorkspaceFile('VOT_Trading_Bot', 'Clanker.world.Trader', 'token_intelligence.py');

        // Run the Python script
        const intelligenceData = await runPythonIntelligence(scriptPath, tokenAddress);

        return NextResponse.json(intelligenceData);
    } catch (error) {
        console.error('Token intelligence API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch intelligence data' },
            { status: 500 }
        );
    }
}

async function runPythonIntelligence(scriptPath: string, tokenAddress: string): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
        const pythonExecutable = resolvePythonExecutable();

        const pythonProcess = spawn(pythonExecutable, [
            scriptPath,
            '--token',
            tokenAddress,
            '--output',
            'json'
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

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Python script error:', stderr);
                reject(new Error(`Python script failed: ${stderr}`));
                return;
            }

            try {
                const jsonStart = stdout.indexOf('{');
                const jsonEnd = stdout.lastIndexOf('}');

                if (jsonStart === -1 || jsonEnd === -1) {
                    throw new Error('No JSON payload detected in Python output');
                }

                const jsonPayload = stdout.slice(jsonStart, jsonEnd + 1);

                const result = JSON.parse(jsonPayload);
                resolve(result as Record<string, unknown>);
            } catch (parseError) {
                console.error('Failed to parse Python output:', parseError);
                console.error('Raw output:', stdout);
                reject(new Error('Failed to parse intelligence data'));
            }
        });

        pythonProcess.on('error', (error) => {
            console.error('Failed to start Python process:', error);
            reject(error);
        });
    });
}
