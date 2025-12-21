import fs from 'fs';
import path from 'path';

function unique<T>(values: Array<T | undefined>): T[] {
    const seen = new Set<T>();
    const result: T[] = [];
    for (const value of values) {
        if (value !== undefined && !seen.has(value)) {
            seen.add(value);
            result.push(value);
        }
    }
    return result;
}

export function resolvePythonExecutable(): string {
    const explicit = process.env.PYTHON_EXECUTABLE;
    if (explicit && fs.existsSync(explicit)) {
        return explicit;
    }

    const venv = process.env.VIRTUAL_ENV;
    if (venv) {
        const scriptsDir = process.platform === 'win32' ? 'Scripts' : 'bin';
        const exeName = process.platform === 'win32' ? 'python.exe' : 'python3';
        const candidates = [
            path.join(venv, scriptsDir, exeName),
            path.join(venv, scriptsDir, 'python')
        ];
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }
    }

    return process.platform === 'win32' ? 'python.exe' : 'python3';
}

export function resolveWorkspaceFile(...segments: string[]): string {
    const cwd = process.cwd();
    const workspaceRoot = process.env.MCPVOT_WORKSPACE_ROOT
        ? path.resolve(process.env.MCPVOT_WORKSPACE_ROOT)
        : undefined;

    const candidates = unique<string>([
        path.join(cwd, ...segments),
        workspaceRoot ? path.join(workspaceRoot, ...segments) : undefined,
        path.join(cwd, '..', ...segments),
        path.join(cwd, '..', '..', ...segments),
    ]);

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    throw new Error(
        `Unable to locate file: ${path.join(...segments)} (searched in ${candidates.join(', ')})`,
    );
}
