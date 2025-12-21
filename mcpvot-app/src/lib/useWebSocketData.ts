import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

interface WebSocketData {
    maxx_usd: number;
    eth_usd?: number;
    eth_balance: number;
    eth_avail: number;
    maxx_balance: number;
    anchor_price_usd: number;
    delta_anchor: number;
    last_action_type: string;
    last_action_usd: number;
    delta_since_last: number;
    state: string;
    target_sell_usd?: number;
    target_buy_usd?: number;
    gas_price_gwei: number;
    gas_limit: number;
    total_gas_usd?: number;
    recent_wallet_trades: Array<Record<string, unknown>>;
    recent_global_trades: Array<Record<string, unknown>>;
    ethermax_alerts: Array<Record<string, unknown>>;
    timestamp: string;
}

const PRIVATE_HOST_PATTERNS = [
    /^localhost$/i,
    /^127(?:\.\d+){3}$/,
    /^0\.0\.0\.0$/,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./
];

const EMBED_HOST_PATTERNS = [
    /\.warpcast\.com$/,
    /^warpcast\.com$/,
    /\.farcaster\.xyz$/,
    /^warpcast$/,
    /\.vercel\.app$/
];

const QUERY_PARAM_KEYS = ['ws', 'wsUrl', 'traderWs'];

const DEFAULT_LOCAL_FALLBACK = 'ws://127.0.0.1:8080';
const PROD_DISABLED_MESSAGE = 'Live trading feed disabled: configure NEXT_PUBLIC_TRADER_WS_URL for production surfaces.';

function buildUrlFromHost(host: string, protocol: 'ws:' | 'wss:', port?: string) {
    const normalizedHost = host.replace(/\/$/, '');
    const hasPort = /:\d+$/.test(normalizedHost);
    const suffix = port && !hasPort ? `:${port}` : '';
    return `${protocol}//${normalizedHost}${suffix}`;
}

function normalizeWebSocketUrl(rawUrl: string, fallbackProtocol: 'ws:' | 'wss:' = 'ws:') {
    try {
        const parsed = new URL(rawUrl, typeof window !== 'undefined' ? window.location.href : undefined);

        if (parsed.protocol === 'http:') {
            parsed.protocol = 'ws:';
        } else if (parsed.protocol === 'https:') {
            parsed.protocol = 'wss:';
        } else if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
            parsed.protocol = fallbackProtocol;
        }

        return parsed.toString().replace(/\/$/, '');
    } catch (error) {
        console.warn('Unable to normalise WebSocket URL, falling back to default:', error);
        return `${fallbackProtocol}//127.0.0.1:8080`;
    }
}

function isPrivateHostname(hostname: string | undefined) {
    if (!hostname) {
        return false;
    }

    return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

function isEmbeddedSurface(hostname: string | undefined) {
    if (!hostname) {
        return false;
    }

    return EMBED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

function sanitizeHostnameForLog(hostname: string | undefined) {
    if (!hostname) {
        return 'unknown-host';
    }
    return isPrivateHostname(hostname) ? '[private-network]' : hostname;
}

function getQueryOverrideUrl() {
    if (typeof window === 'undefined') {
        return null;
    }

    const params = new URLSearchParams(window.location.search || '');
    for (const key of QUERY_PARAM_KEYS) {
        const value = params.get(key);
        if (value) {
            return value;
        }
    }

    if (window.location.hash?.includes('ws=')) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        for (const key of QUERY_PARAM_KEYS) {
            const value = hashParams.get(key);
            if (value) {
                return value;
            }
        }
    }

    return null;
}

function resolveWebSocketUrl() {
    const envUrl = process.env.NEXT_PUBLIC_TRADER_WS_URL?.trim();
    const publicUrl = process.env.NEXT_PUBLIC_TRADER_WS_PUBLIC_URL?.trim();
    const envHost = process.env.NEXT_PUBLIC_TRADER_WS_HOST?.trim();
    const envPort = process.env.NEXT_PUBLIC_TRADER_WS_PORT?.trim() || '8080';
    const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL;

    if (typeof window === 'undefined') {
        if (envUrl) {
            return normalizeWebSocketUrl(envUrl);
        }
        if (envHost) {
            return normalizeWebSocketUrl(buildUrlFromHost(envHost, 'ws:', envPort));
        }
        return DEFAULT_LOCAL_FALLBACK;
    }

    const browserProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    const queryOverride = getQueryOverrideUrl();
    if (queryOverride) {
        console.info('Using WebSocket override from query parameter');
        return normalizeWebSocketUrl(queryOverride, browserProtocol);
    }

    if (envUrl) {
        return normalizeWebSocketUrl(envUrl, browserProtocol);
    }

    if (envHost) {
        return normalizeWebSocketUrl(buildUrlFromHost(envHost, browserProtocol, envPort), browserProtocol);
    }

    const { hostname, port: currentPort } = window.location;
    const embeddedSurface = isEmbeddedSurface(hostname);
    const privateSurface = isPrivateHostname(hostname);

    if ((embeddedSurface || privateSurface) && publicUrl) {
        return normalizeWebSocketUrl(publicUrl, 'wss:');
    }

    if (embeddedSurface && appOrigin) {
        const derived = appOrigin.replace(/^http/, browserProtocol === 'wss:' ? 'wss' : 'ws');
        return normalizeWebSocketUrl(derived, browserProtocol);
    }

    if (privateSurface) {
        const requiresPort = browserProtocol === 'ws:' && !currentPort;
        const portSuffix = requiresPort ? `:${envPort || '8080'}` : '';
        return `${browserProtocol}//${hostname}${currentPort ? `:${currentPort}` : portSuffix}`;
    }

    console.warn('No trader WebSocket URL configured for public deployment. Disabling live data feed.');
    return null;
}

export function useWebSocketData() {
    const [data, setData] = useState<WebSocketData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const wsRef = useRef<WebSocket | null>(null);
    const shouldReconnectRef = useRef(true);

    useEffect(() => {
        // Only run in browser (not during SSR)
        if (typeof window === 'undefined') {
            console.warn('⚠️ WebSocket hook called during SSR - skipping');
            return;
        }

        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let pingTimer: ReturnType<typeof setInterval> | null = null;
        shouldReconnectRef.current = true;

        let attempts = 0;
        let backoffMs = 3000;

        const connect = () => {
            const targetUrl = resolveWebSocketUrl();
            if (!targetUrl) {
                setError(PROD_DISABLED_MESSAGE);
                setIsConnected(false);
                setData(null);
                shouldReconnectRef.current = false;
                return;
            }
            const safeHostname = sanitizeHostnameForLog(window.location.hostname);
            console.log('🔵 Attempting WebSocket connection to:', targetUrl);
            console.log('Browser location:', window.location.href);
            console.log('Protocol:', window.location.protocol);
            console.log('Surface hostname:', safeHostname);

            const ws = new WebSocket(targetUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ WebSocket connected to trading system at', targetUrl);
                setIsConnected(true);
                setError(null);

                // Send periodic pings to keep connection alive
                pingTimer = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        try {
                            ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
                        } catch {
                            console.warn('Failed to send ping:', e);
                        }
                    }
                }, 30000); // Ping every 30 seconds
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('📨 WebSocket message received:', { type: message.type, hasData: !!message.data });

                    if (message.type === 'tick') {
                        console.log('✅ Processing tick data:', {
                            maxx_usd: message.data.maxx_usd,
                            eth_usd: message.data.eth_usd,
                            gas_price_gwei: message.data.gas_price_gwei
                        });

                        const newData: WebSocketData = {
                            maxx_usd: message.data.maxx_usd || 0,
                            eth_usd: message.data.eth_usd ?? undefined,
                            eth_balance: message.data.eth_balance || 0,
                            eth_avail: message.data.eth_avail || 0,
                            maxx_balance: message.data.maxx_balance || 0,
                            anchor_price_usd: message.data.anchor_price_usd || 0,
                            delta_anchor: message.data.delta_anchor || 0,
                            last_action_type: message.data.last_action_type || 'none',
                            last_action_usd: message.data.last_action_usd || 0,
                            delta_since_last: message.data.delta_since_last || 0,
                            state: message.data.state || 'UNKNOWN',
                            target_sell_usd: message.data.target_sell_usd,
                            target_buy_usd: message.data.target_buy_usd,
                            gas_price_gwei: message.data.gas_price_gwei || 0,
                            gas_limit: message.data.gas_limit || 300000,
                            total_gas_usd: message.data.total_gas_usd ?? undefined,
                            recent_wallet_trades: message.data.recent_wallet_trades || [],
                            recent_global_trades: message.data.recent_global_trades || [],
                            ethermax_alerts: message.data.ethermax_alerts || [],
                            timestamp: message.timestamp || new Date().toISOString()
                        };
                        setData(newData);
                        queryClient.invalidateQueries({ queryKey: ['mining-stats'] });
                        queryClient.invalidateQueries({ queryKey: ['staking-info'] });
                        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
                    } else {
                        console.warn('⚠️ Received non-tick message:', message.type);
                    }
                } catch (parseError) {
                    console.error('❌ Failed to parse WebSocket message:', parseError, event.data);
                }
            };

            ws.onclose = (event) => {
                console.log(`🔴 WebSocket disconnected - Code: ${event.code}, Reason: "${event.reason || 'No reason provided'}", WasClean: ${event.wasClean}`);

                // Log detailed close codes
                if (event.code === 1006) {
                    console.error('⚠️ Abnormal closure (1006) - Connection failed or was blocked');
                    console.error('Possible causes: CORS, firewall, server not accepting connections');
                }

                if (pingTimer) {
                    clearInterval(pingTimer);
                    pingTimer = null;
                }

                setIsConnected(false);
                wsRef.current = null;
                setData(null);

                if (shouldReconnectRef.current) {
                    attempts += 1;
                    backoffMs = Math.min(60000, backoffMs * (attempts <= 1 ? 1 : 2));
                    console.log(`Attempting to reconnect in ${backoffMs}ms (attempt ${attempts})...`);
                    reconnectTimer = setTimeout(() => {
                        // If the URL is ws:, try wss: (in case of mixed-content blocking), and vice-versa
                        try {
                            const parsed = new URL(targetUrl);
                            if (parsed.protocol === 'ws:') {
                                parsed.protocol = 'wss:';
                            } else if (parsed.protocol === 'wss:') {
                                parsed.protocol = 'ws:';
                            }
                            const fallbackUrl = parsed.toString();
                            console.log('Trying alternate protocol/fallback URL:', fallbackUrl);
                            // Replace resolveWebSocketUrl to return fallbackUrl next attempt
                            // To keep scope small, open the new ws directly
                            if (wsRef.current === null) {
                                const newWs = new WebSocket(fallbackUrl);
                                wsRef.current = newWs; // then rely on its handlers for reconnect attempts
                                return;
                            }
                        } catch {
                            // ignore parsing error
                        }
                        connect();
                    }, backoffMs);
                }
            };

            ws.onerror = async (wsError) => {
                // OnBrowsers, wsError is often an opaque event with no details. Show additional diagnostics.
                console.error('❌ WebSocket error event:', wsError);
                console.error('WS URL:', targetUrl);
                console.error('ReadyState:', ws.readyState);
                console.error('Protocol:', window.location.protocol);
                console.error('Hostname:', sanitizeHostnameForLog(window.location.hostname));
                setError('Failed to connect to trading system - check if bot is running or verify CORS/Firewall');
                setIsConnected(false);
                setData(null);

                // Quick health check to see if API server is reachable
                try {
                    const health = await fetch('/api/health', { cache: 'no-store' });
                    console.log('API /api/health status:', health.status);
                } catch (err) {
                    console.warn('Health check failed; server likely unreachable from this surface', err);
                }

                // Close socket so onclose flow triggers reconnect/backoff
                try {
                    ws.close();
                } catch {
                    // ignore
                }
            };
        };

        connect();

        return () => {
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
            }
            if (pingTimer) {
                clearInterval(pingTimer);
            }
            shouldReconnectRef.current = false;
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [queryClient]);

    return {
        data,
        isConnected,
        error
    };
}
