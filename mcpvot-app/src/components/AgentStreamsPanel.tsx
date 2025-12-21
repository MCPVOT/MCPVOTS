"use client";

import { useEffect, useState } from 'react';

type AgentType = 'clanker' | 'farcaster';

interface AgentDataResponse {
    success: boolean;
    type?: AgentType;
    cid?: string;
    data?: unknown;
    source?: 'ipfs' | 'cache';
    error?: string;
    timestamp?: number;
}

function useAgentData(type: AgentType, intervalMs = 60_000) {
    const [state, setState] = useState<AgentDataResponse>({ success: false });

    useEffect(() => {
        let mounted = true;
        let timer: NodeJS.Timeout | null = null;

        const load = async () => {
            try {
                const res = await fetch(`/api/x402/agent-data?type=${type}`, { cache: 'no-store' });
                const json: AgentDataResponse = await res.json();
                if (mounted) setState(json);
            } catch (e) {
                if (mounted) setState({ success: false, error: (e as Error).message });
            }
        };

        load();
        timer = setInterval(load, intervalMs);
        return () => {
            mounted = false;
            if (timer) clearInterval(timer);
        };
    }, [type, intervalMs]);

    return state;
}

export default function AgentStreamsPanel() {
    const clanker = useAgentData('clanker');
    const farcaster = useAgentData('farcaster');

    const renderCard = (label: string, r: AgentDataResponse) => (
        <div className="agent-card">
            <div className="agent-header">
                <span className="dot" data-status={r.success}></span>
                <h4>{label}</h4>
                {r.cid && <code className="cid">{r.cid}</code>}
            </div>
            {r.success && (
                <pre className="agent-json">{JSON.stringify(r.data, null, 2)}</pre>
            )}
            {!r.success && (
                <div className="agent-error">{r.error || 'No data (configure CID)'}
                </div>
            )}
        </div>
    );

    return (
        <div className="agent-grid">
            {renderCard('x402 Clanker Agent', clanker)}
            {renderCard('x402 Farcaster Agent', farcaster)}

            <style jsx>{`
        .agent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          margin: 1rem 0 2rem;
        }
        .agent-card {
          background: rgba(0, 255, 0, 0.06);
          border: 1px solid #00ff00;
          border-radius: 8px;
          overflow: hidden;
        }
        .agent-header { display:flex; align-items:center; gap:.5rem; padding:.5rem .75rem; background: rgba(0,255,0,.08); border-bottom: 1px solid #00ff00; }
        .cid { margin-left:auto; opacity:.85; }
        .dot { width:8px; height:8px; border-radius:50%; background:#f00; box-shadow:0 0 8px #f00; }
        .dot[data-status="true"] { background:#0f0; box-shadow:0 0 8px #0f0; }
        .agent-json { max-height: 220px; overflow: auto; padding:.75rem; margin:0; color:#00ff00; }
        .agent-error { padding:.75rem; color:#ff6; font-size:.9rem; }
      `}</style>
        </div>
    );
}
