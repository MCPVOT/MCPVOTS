import { mcp_maxx_memory_get_memory_stats } from '@/lib/mcp-memory-client';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';

async function fileExists(filePath: string) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

export async function GET() {
    const root = process.cwd();
    const manifestPath = path.join(root, 'mcpvot-app', 'public', '.well-known', 'farcaster.json');
    const brandingDir = path.join(root, 'mcpvot-app', 'public', 'branding');

    const manifestExists = await fileExists(manifestPath);
    let manifest: Record<string, unknown> | { error: string } | null = null;
    if (manifestExists) {
        try {
            const raw = await fs.readFile(manifestPath, 'utf-8');
            manifest = JSON.parse(raw);
        } catch (err) {
            manifest = { error: String(err) };
        }
    }

    const hero = path.join(brandingDir, 'hero.png');
    const splash = path.join(brandingDir, 'splash.png');
    const icon = path.join(brandingDir, 'icon.png');
    const ogImage = path.join(brandingDir, 'og-image.png');

    const memoryStats = await mcp_maxx_memory_get_memory_stats().catch(() => null);

    const checks = {
        manifest: {
            exists: manifestExists,
            valid: !!manifest && !manifest.error,
            errors: manifest?.error ? String(manifest.error) : undefined,
        },
        images: {
            hero: await fileExists(hero),
            splash: await fileExists(splash),
            icon: await fileExists(icon),
            ogImage: await fileExists(ogImage),
        },
        env: {
            serverPrivateKey: !!process.env.SERVER_PRIVATE_KEY,
            cdpApiKeyId: !!process.env.CDP_API_KEY_ID || !!process.env.CDP_CLIENT_KEY,
            cdpApiKeySecret: !!process.env.CDP_API_KEY_SECRET,
            facilitatorConfigured: !!(process.env.CDP_FACILITATOR_URL || process.env.VITE_FACILITATOR_URL || process.env.FACILITATOR_URL),
            productionDomain: String(process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://'),
        }
    };
    checks['memory'] = {
        serviceAvailable: !!memoryStats,
        totalMemories: memoryStats?.total_memories ?? null
    };

    return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        checks,
        manifestSample: manifest ? {
            frame: manifest.frame || null,
            miniApp: manifest.miniApp || null,
            featureFlags: manifest.featureFlags || null,
            accountAssociation: manifest.accountAssociation ? { header: manifest.accountAssociation.header?.slice(0, 16) } : null
        } : null
    });
}
