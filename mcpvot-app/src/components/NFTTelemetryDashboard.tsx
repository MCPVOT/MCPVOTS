'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import AgentStreamsPanel from './AgentStreamsPanel';
import RetroCyberScene from './scene/RetroCyberScene';

// Telemetry data interface
interface TelemetryData {
  gasUsed: number;
  txCount: number;
  votEarned: number;
  winRate: number;
  activeAgents: number;
  memoryUsage: number;
  lastActivity: number;
}

// Main NFT Dashboard component
export default function NFTTelemetryDashboard({ tokenId }: { tokenId: string }) {
  const { address } = useAccount();
  const debugBypass = process.env.NEXT_PUBLIC_DEBUG_ALLOW_NFT_DASHBOARD === 'true';
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(debugBypass);
  const [ownershipChecked, setOwnershipChecked] = useState<boolean>(debugBypass);
  const [loading, setLoading] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (debugBypass) {
      setIsOwner(true);
      setOwnershipChecked(true);
      return;
    }

    if (!address) {
      setIsOwner(false);
      setOwnershipChecked(true);
      return;
    }

    let cancelled = false;

    const verifyOwnership = async () => {
      try {
        const response = await fetch(`/api/nft/${tokenId}/owner`);
        const data = await response.json();
        if (!cancelled) {
          setIsOwner(Boolean(data?.owner && address && data.owner.toLowerCase() === address.toLowerCase()));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to check NFT ownership:', err);
          setError('Unable to verify NFT ownership.');
          setIsOwner(false);
        }
      } finally {
        if (!cancelled) {
          setOwnershipChecked(true);
        }
      }
    };

    verifyOwnership();

    return () => {
      cancelled = true;
    };
  }, [address, tokenId, debugBypass]);

  useEffect(() => {
    if (!ownershipChecked) return;
    if (!debugBypass && !isOwner) {
      setTelemetry(null);
      setLoading(false);
      return;
    }

    const load = async () => {
      if (!debugBypass && !address) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/nft/${tokenId}/telemetry${address ? `?address=${address}` : ''}`);
        const json = await response.json();
        if (!json?.success) {
          setError(json?.error ?? 'Telemetry unavailable');
          setTelemetry(null);
        } else {
          setTelemetry(json.data ?? null);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch telemetry:', err);
        setError('Unable to load telemetry data.');
        setTelemetry(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [address, tokenId, isOwner, ownershipChecked, debugBypass]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch {
      setWebglSupported(false);
    }
  }, []);

  const summaryMetrics = useMemo(() => {
    if (!telemetry) return [];
    return [
      {
        label: 'Gas Used',
        value: telemetry.gasUsed.toLocaleString(),
        hint: 'Total compute consumed',
      },
      {
        label: 'Transactions',
        value: telemetry.txCount.toString(),
        hint: 'Executed on-chain swaps',
      },
      {
        label: 'VOT Earned',
        value: telemetry.votEarned.toFixed(2),
        hint: 'Rewards streamed to holder',
      },
      {
        label: 'Win Rate',
        value: `${telemetry.winRate}%`,
        hint: 'Strategy success (24h)',
      },
      {
        label: 'Active Agents',
        value: telemetry.activeAgents.toString(),
        hint: 'Clanker / Farcaster pods live',
      },
      {
        label: 'Memory Usage',
        value: `${telemetry.memoryUsage}%`,
        hint: 'Vault storage footprint',
      },
    ];
  }, [telemetry]);

  const sceneTelemetry = useMemo(() => {
    if (!telemetry) return null;
    return {
      gasPrice: telemetry.gasUsed / 1000,
      tradingVolume: telemetry.votEarned * 10000,
      networkLoad: telemetry.winRate,
    };
  }, [telemetry]);

  if (loading && !telemetry) {
    return (
      <div className="nft-dashboard-loading">
        <div className="matrix-loader">
          <div className="matrix-text">INITIALIZING TELEMETRY MATRIX...</div>
          <div className="matrix-dots">
            {[1, 2, 3].map(i => (
              <span key={i} className="matrix-dot" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nft-dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>MCPVOT #{tokenId} TELEMETRY</h2>
          <p className="subhead">Real-time Base network vitals for your mission NFT.</p>
        </div>
        <div className="dashboard-status">
          <span className="status-dot" data-online={!!telemetry}></span>
          {telemetry ? 'LIVE DATA STREAM' : 'STANDBY MODE'}
        </div>
      </div>

      {!debugBypass && !isOwner && (
        <div className="access-banner">
          <div className="banner-title">Wallet Connected • NFT Ownership Required</div>
          <p className="banner-text">
            This dashboard unlocks once the connected wallet holds MCPVOT #{tokenId}. Swap wallets or mint to activate live telemetry.
          </p>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span className="error-symbol">⚠</span>
          <div>
            <div className="error-title">Telemetry Offline</div>
            <p className="error-text">{error}</p>
          </div>
        </div>
      )}

      <div className="dashboard-3d-view">
        {webglSupported && sceneTelemetry ? (
          <RetroCyberScene
            showNFT
            nftTelemetry={sceneTelemetry ?? undefined}
            darkMode
          />
        ) : (
          <div className="webgl-fallback">
            <div className="fallback-header">{webglSupported ? 'Awaiting Telemetry Stream…' : 'WebGL Disabled'}</div>
            <p className="fallback-text">
              {webglSupported
                ? 'Telemetry packets are syncing from Base. Metrics and agent streams remain available below.'
                : 'Your browser disabled 3D rendering. Live metrics and agent intel continue to update below.'}
            </p>
          </div>
        )}
      </div>

      {/* x402 agent streams (IPFS via MCP) */}
      <AgentStreamsPanel />

      {summaryMetrics.length > 0 && (
        <div className="summary-grid">
          {summaryMetrics.map(metric => (
            <div key={metric.label} className="summary-card">
              <div className="summary-label">{metric.label}</div>
              <div className="summary-value">{metric.value}</div>
              <div className="summary-hint">{metric.hint}</div>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-metrics-grid">
        {telemetry ? (
          <>
            <div className="metric-card">
              <div className="metric-icon">⛽</div>
              <div className="metric-data">
                <div className="metric-value">{telemetry.gasUsed.toLocaleString()}</div>
                <div className="metric-label">Gas Used</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🔄</div>
              <div className="metric-data">
                <div className="metric-value">{telemetry.txCount}</div>
                <div className="metric-label">Transactions</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-data">
                <div className="metric-value">{telemetry.votEarned.toFixed(2)}</div>
                <div className="metric-label">VOT Earned</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🎯</div>
              <div className="metric-data">
                <div className="metric-value">{telemetry.winRate}%</div>
                <div className="metric-label">Win Rate</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🤖</div>
              <div className="metric-data">
                <div className="metric-value">{telemetry.activeAgents}</div>
                <div className="metric-label">Active Agents</div>
              </div>
            </div>
          </>
        ) : (
          <div className="metric-card metric-empty">
            <div className="metric-data">
              <div className="metric-value">Standby</div>
              <div className="metric-label">Telemetry will appear once ownership is confirmed.</div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .nft-dashboard-container {
          width: 100%;
          min-height: 70vh;
          background: radial-gradient(circle at 20% -10%, rgba(0, 255, 140, 0.18), rgba(8, 20, 32, 0.92));
          color: #c7faff;
          font-family: 'Courier New', monospace;
          overflow: hidden;
          border: 1px solid rgba(0, 255, 140, 0.18);
          border-radius: 16px;
          box-shadow: 0 24px 50px rgba(6, 12, 24, 0.55);
          display: flex;
          flex-direction: column;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          padding: 1.25rem 1.75rem;
          border-bottom: 1px solid rgba(0, 255, 140, 0.18);
          background: rgba(10, 18, 32, 0.75);
        }

        .dashboard-header h2 {
          margin: 0;
          font-size: 1.35rem;
          text-shadow: 0 0 18px rgba(0, 255, 140, 0.45);
          letter-spacing: 0.12em;
        }

        .subhead {
          margin: 0.35rem 0 0;
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(199, 250, 255, 0.68);
        }

        .dashboard-status {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 0.35rem 0.6rem;
          border: 1px solid rgba(0, 255, 140, 0.22);
          border-radius: 999px;
          background: rgba(10, 20, 36, 0.75);
        }

        .status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: rgba(255, 99, 132, 0.8);
          box-shadow: 0 0 12px rgba(255, 99, 132, 0.6);
          animation: pulse 2.4s infinite;
        }

        .status-dot[data-online="true"] {
          background: rgba(0, 255, 140, 0.9);
          box-shadow: 0 0 14px rgba(0, 255, 140, 0.55);
        }

        .access-banner,
        .error-banner {
          margin: 1.25rem 1.75rem 0;
          border-radius: 12px;
          padding: 1.1rem 1.25rem;
          display: flex;
          gap: 1rem;
        }

        .access-banner {
          border: 1px solid rgba(255, 214, 102, 0.3);
          background: linear-gradient(135deg, rgba(255, 214, 102, 0.12), rgba(60, 45, 0, 0.2));
          color: rgba(255, 244, 216, 0.86);
          flex-direction: column;
        }

        .banner-title {
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-size: 0.72rem;
        }

        .banner-text {
          margin: 0.3rem 0 0;
          font-size: 0.82rem;
          line-height: 1.6;
        }

        .error-banner {
          align-items: center;
          border: 1px solid rgba(255, 125, 125, 0.35);
          background: linear-gradient(135deg, rgba(255, 105, 120, 0.1), rgba(60, 0, 12, 0.28));
          color: rgba(255, 210, 214, 0.85);
        }

        .error-symbol {
          font-size: 1.5rem;
          line-height: 1;
          filter: drop-shadow(0 0 8px rgba(255, 99, 132, 0.5));
        }

        .error-title {
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-size: 0.75rem;
        }

        .error-text {
          margin: 0.25rem 0 0;
          font-size: 0.82rem;
          line-height: 1.6;
        }

        .dashboard-3d-view {
          position: relative;
          min-height: 320px;
          border-bottom: 1px solid rgba(0, 255, 140, 0.08);
        }

        .webgl-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 2.2rem;
          background: linear-gradient(135deg, rgba(12, 24, 36, 0.92), rgba(22, 36, 52, 0.85));
        }

        .fallback-header {
          font-size: 1.05rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #93f9d9;
          margin-bottom: 0.6rem;
        }

        .fallback-text {
          font-size: 0.85rem;
          max-width: 420px;
          color: rgba(199, 250, 255, 0.7);
          line-height: 1.6;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
          padding: 1.5rem 1.75rem 0.75rem;
        }

        .summary-card {
          background: rgba(16, 30, 42, 0.82);
          border: 1px solid rgba(0, 255, 140, 0.16);
          border-radius: 12px;
          padding: 1rem;
          box-shadow: inset 0 0 22px rgba(0, 255, 140, 0.06);
        }

        .summary-label {
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(147, 249, 217, 0.75);
        }

        .summary-value {
          font-size: 1.35rem;
          margin: 0.45rem 0;
          color: #e8fff4;
          text-shadow: 0 0 16px rgba(0, 255, 180, 0.25);
        }

        .summary-hint {
          font-size: 0.72rem;
          color: rgba(199, 250, 255, 0.65);
          line-height: 1.5;
        }

        .dashboard-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          padding: 1.5rem 1.75rem 1.75rem;
        }

        .metric-card {
          background: rgba(12, 28, 36, 0.78);
          border: 1px solid rgba(0, 255, 140, 0.16);
          border-radius: 10px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
        }

        .metric-card:hover {
          background: rgba(0, 255, 140, 0.12);
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(0, 255, 140, 0.18);
        }

        .metric-card.metric-empty {
          justify-content: center;
          text-align: center;
          background: rgba(12, 20, 32, 0.6);
          border-style: dashed;
          border-color: rgba(0, 255, 140, 0.25);
        }

        .metric-icon {
          font-size: 1.8rem;
        }

        .metric-data {
          flex: 1;
        }

        .metric-value {
          font-size: 1.45rem;
          font-weight: bold;
          margin-bottom: 0.2rem;
          color: #eafff4;
        }

        .metric-label {
          font-size: 0.78rem;
          opacity: 0.78;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .nft-dashboard-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 360px;
          background: radial-gradient(circle, rgba(0, 255, 140, 0.08), rgba(4, 10, 18, 0.95));
          color: #93f9d9;
          font-family: 'Courier New', monospace;
        }

        .matrix-loader {
          text-align: center;
        }

        .matrix-text {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          animation: blink 1.1s infinite;
          letter-spacing: 0.16em;
        }

        .matrix-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .matrix-dot {
          width: 5px;
          height: 5px;
          background: rgba(0, 255, 140, 0.9);
          border-radius: 50%;
          animation: matrixRain 1.6s infinite ease-in-out;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        @keyframes blink {
          0%, 55% { opacity: 1; }
          56%, 100% { opacity: 0.45; }
        }

        @keyframes matrixRain {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(10px); opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .dashboard-status {
            align-self: flex-start;
          }

          .summary-grid,
          .dashboard-metrics-grid {
            padding: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
