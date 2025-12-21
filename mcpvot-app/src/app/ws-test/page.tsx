'use client';

import { useEffect, useState } from 'react';

export default function WebSocketTest() {
    const [status, setStatus] = useState('Disconnected');
    const [messages, setMessages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const wsUrl = process.env.NEXT_PUBLIC_TRADER_WS_URL || 'ws://localhost:8080';
        console.log('🔧 Attempting to connect to:', wsUrl);

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('✅ Connected!');
            setStatus('Connected ✅');
            setError(null);
        };

        ws.onmessage = (event) => {
            console.log('📨 Message:', event.data);
            try {
                const data = JSON.parse(event.data);
                setMessages(prev => [...prev, JSON.stringify(data, null, 2)].slice(-10));
            } catch {
                setMessages(prev => [...prev, event.data].slice(-10));
            }
        };

        ws.onerror = (err) => {
            console.error('❌ Error:', err);
            setError(`WebSocket error - check if trading bot is running on ${wsUrl}`);
        };

        ws.onclose = (event) => {
            console.log('🔌 Disconnected:', event.code, event.reason);
            setStatus(`Disconnected (${event.code})`);
        };

        return () => {
            ws.close();
        };
    }, []);

    return (
        <div className="min-h-screen bg-black text-green-400 p-8 font-mono">
            <h1 className="text-2xl mb-4">WebSocket Test Page</h1>
            <div className="mb-4">
                <strong>Status:</strong> {status}
            </div>
            {error && (
                <div className="mb-4 text-red-500">
                    <strong>Error:</strong> {error}
                </div>
            )}
            <div className="mb-4">
                <strong>URL:</strong> {process.env.NEXT_PUBLIC_TRADER_WS_URL || 'ws://localhost:8080'}
            </div>
            <div>
                <strong>Messages ({messages.length}):</strong>
                <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                    {messages.map((msg, i) => (
                        <pre key={i} className="bg-gray-900 p-2 rounded text-xs">
                            {msg}
                        </pre>
                    ))}
                </div>
                {messages.length === 0 && (
                    <div className="text-gray-500 mt-2">
                        Waiting for messages from trading bot...
                    </div>
                )}
            </div>
            <div className="mt-8 text-sm text-gray-500">
                <p>This page tests the WebSocket connection to the trading bot.</p>
                <p>You should see tick messages appearing every ~5 seconds.</p>
                <p>If you see errors, make sure the trading bot is running: python maxx_trader_fix.py --ws-enable</p>
            </div>
        </div>
    );
}
