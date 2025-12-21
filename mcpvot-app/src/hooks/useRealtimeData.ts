/**
 * useRealtimeData - WebSocket hook for real-time price and gas data
 * Connects to ws://localhost:8080 for streaming ETH/VOT/MAXX prices and Base gas
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface RealtimeData {
    eth_price: number | null;
    vot_price: number | null;
    maxx_price: number | null;
    base_gas_gwei: number | null;
    timestamp: number;
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8765';

export function useRealtimeData() {
    const [data, setData] = useState<RealtimeData>({
        eth_price: null,
        vot_price: null,
        maxx_price: null,
        base_gas_gwei: null,
        timestamp: 0,
        status: 'disconnected'
    });

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const reconnectAttemptsRef = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000;

    const connect = useCallback(function connectWebSocket() {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            setData(prev => ({ ...prev, status: 'connecting' }));

            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log(`✅ WebSocket connected to ${WS_URL}`);
                reconnectAttemptsRef.current = 0;
                setData(prev => ({ ...prev, status: 'connected' }));
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    // Update data from WebSocket message
                    setData(prev => ({
                        ...prev,
                        eth_price: message.eth_price ?? prev.eth_price,
                        vot_price: message.vot_price ?? prev.vot_price,
                        maxx_price: message.maxx_price ?? prev.maxx_price,
                        base_gas_gwei: message.base_gas_gwei ?? prev.base_gas_gwei,
                        timestamp: Date.now(),
                        status: 'connected'
                    }));
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                setData(prev => ({ ...prev, status: 'error' }));
            };

            ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                setData(prev => ({ ...prev, status: 'disconnected' }));
                wsRef.current = null;

                // Auto-reconnect logic
                if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current++;
                    console.log(`🔄 Reconnecting to ${WS_URL}... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, RECONNECT_DELAY);
                } else {
                    console.log('❌ Max reconnect attempts reached');
                }
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            setData(prev => ({ ...prev, status: 'error' }));
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    return { data, reconnect: connect };
}
