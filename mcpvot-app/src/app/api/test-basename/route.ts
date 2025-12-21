import { clearBaseNameCache } from '@/lib/baseNameUtils';
import { clearNameResolverCache, resolveName } from '@/lib/basename/serverResolver';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address') || '0x02feeb0AdE57b6adEEdE5A4EEea6Cf8c21BeB6B1'; // Default to known Base name address
        const forceRefresh = searchParams.get('force') === 'true';

        if (!address) {
            return NextResponse.json({
                error: 'Address parameter required',
                example: '?address=0x4c6b3a7f4c6b3a7f4c6b3a7f4c6b3a7f4c6b3a7f'
            });
        }

        console.log('[API] Testing Base name resolution for:', address, forceRefresh ? '(force refresh)' : '');

        // Check environment
        const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;
        const hasApiKey = !!apiKey && apiKey !== 'your_onchainkit_api_key_here';

        console.log('[API] Environment check:', {
            hasApiKey,
            apiKeyLength: apiKey?.length,
            nodeEnv: process.env.NODE_ENV
        });

        // Force refresh by clearing cache if requested
        if (forceRefresh) {
            console.log('[API] Clearing cache for force refresh');
            clearBaseNameCache(address as `0x${string}`);
            clearNameResolverCache();
        }

        const resolved = await resolveName(address as `0x${string}`);
        const baseName = resolved.basename ?? null;
        const ensName = resolved.ensName ?? null;
        const avatar = resolved.avatar ?? null;
        const displayName = resolved.displayName ?? (baseName || ensName || `${address.slice(0, 6)}...${address.slice(-4)}`);

        return NextResponse.json({
            address,
            baseName,
            ensName,
            avatar,
            displayName,
            hasApiKey,
            apiKeyConfigured: !!apiKey,
            timestamp: new Date().toISOString(),
            note: address === '0x02feeb0AdE57b6adEEdE5A4EEea6Cf8c21BeB6B1' ? 'This is a known address with Base name "zizzamia.base.eth"' : 'Test with ?address=0x02feeb0AdE57b6adEEdE5A4EEea6Cf8c21BeB6B1 for known Base name'
        });
    } catch (error) {
        console.error('[API] Error testing Base name:', error);
        return NextResponse.json({
            error: 'Failed to resolve Base name',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
