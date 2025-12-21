'use client';

// Client-safe resolver: call server API instead of importing server-only code
import { useEffect, useMemo, useState } from 'react';

interface BaseNameResolverProps {
    address: `0x${string}`;
    className?: string;
    enableDebug?: boolean;
    fallbackToAddress?: boolean;
    maxLength?: number;
}

export default function BaseNameResolver({ 
    address, 
    className = "", 
    enableDebug = false,
    fallbackToAddress = true,
    maxLength = 20
}: BaseNameResolverProps) {
    const [basename, setBasename] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Validate address format
    const isValidAddress = useMemo(() => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }, [address]);

    useEffect(() => {
        const resolveName = async () => {
            if (!address || !isValidAddress) {
                setLoading(false);
                if (!isValidAddress) {
                    setError('Invalid address format');
                }
                return;
            }

            setLoading(true);
            setError(null);
            
            try {
                // Enhanced retry logic with exponential backoff
                let attempts = 0;
                const maxAttempts = 3;
                let lastPayload: { baseName?: string; debug?: Record<string, unknown> } | null = null;
                
                while (attempts < maxAttempts) {
                    try {
                        const url = new URL(`/api/resolve-basename`, typeof window !== 'undefined' ? window.location.origin : 'https://mcpvot.xyz');
                        url.searchParams.set('address', address);
                        if (enableDebug) {
                            url.searchParams.set('debug', 'true');
                        }

                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

                        const res = await fetch(url.toString(), {
                            signal: controller.signal,
                            headers: {
                                'Accept': 'application/json',
                                'Cache-Control': 'no-cache'
                            }
                        });
                        
                        clearTimeout(timeoutId);

                        if (!res.ok) {
                            attempts += 1;
                            if (res.status === 404) {
                                // No basename found, don't retry
                                break;
                            }
                            // Exponential backoff for other errors
                            await new Promise((resolve) => 
                                setTimeout(resolve, Math.min(500 * Math.pow(2, attempts), 3000))
                            );
                            continue;
                        }

                        lastPayload = await res.json();
                        
                        if (enableDebug && lastPayload?.debug) {
                            console.log('[BaseName Debug]', {
                                address: address.slice(0, 6) + '...' + address.slice(-4),
                                result: lastPayload.baseName,
                                debug: lastPayload.debug.slice(-5) // Last 5 log entries
                            });
                        }
                        
                        break;
                    } catch (fetchError: unknown) {
                        attempts += 1;
                        
                        if (fetchError.name === 'AbortError') {
                            setError('Request timeout');
                            break;
                        }
                        
                        // Exponential backoff for network errors
                        if (attempts < maxAttempts) {
                            await new Promise((resolve) => 
                                setTimeout(resolve, Math.min(500 * Math.pow(2, attempts), 3000))
                            );
                        }
                    }
                }

                if (lastPayload?.baseName) {
                    setBasename(lastPayload.baseName);
                } else if (attempts >= maxAttempts) {
                    setError('Failed to resolve name after retries');
                }
                
            } catch (error: unknown) {
                console.error('[BaseName Resolver] Unexpected error:', error);
                setError('Unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        resolveName();
    }, [address, isValidAddress, enableDebug]);

    // Format display name with truncation
    const formatDisplayName = (name: string) => {
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength) + '...';
    };

    // Loading state with enhanced UX
    if (loading) {
        return (
            <span className={`inline-flex items-center gap-1 text-green-400/60 text-xs ${className}`}>
                <span className="animate-pulse">⟳</span>
                <span>resolving</span>
                <span className="animate-pulse">...</span>
            </span>
        );
    }

    // Error state
    if (error) {
        return (
            <span className={`text-red-400/70 font-mono text-xs ${className}`} title={error}>
                {fallbackToAddress ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Error'}
            </span>
        );
    }

    // Successful basename resolution
    if (basename) {
        return (
            <span 
                className={`text-green-400 font-mono text-sm ${className}`}
                title={basename}
            >
                {formatDisplayName(basename)}
            </span>
        );
    }

    // Fallback to truncated address
    if (fallbackToAddress && isValidAddress) {
        return (
            <span 
                className={`text-green-400/70 font-mono text-xs ${className}`}
                title={address}
            >
                {address.slice(0, 6)}...{address.slice(-4)}
            </span>
        );
    }

    // Invalid address fallback
    return (
        <span className={`text-red-400/70 font-mono text-xs ${className}`}>
            Invalid Address
        </span>
    );
}
