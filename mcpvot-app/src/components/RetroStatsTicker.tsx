'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';

// VOT Glyph symbol (Sumerian cuneiform from MCPVOT branding)
const VOT_GLYPH = '𒆷';
const VOT_TOKEN_ADDRESS = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07' as const;

interface StatsData {
  gasPrice: string;
  gasPriceGwei: number;
  votPrice: number;
  votPriceFormatted: string;
  votChange24h: number;
  timestamp: number;
}

interface RetroStatsTickerProps {
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
}

// Global cache to share across all instances
let globalStatsCache: StatsData | null = null;
let globalFetchPromise: Promise<StatsData | null> | null = null;
let lastFetchTime = 0;
const FETCH_INTERVAL = 10000; // 10 seconds

export default function RetroStatsTicker({ 
  className = '', 
  showLabels = true,
  compact = false 
}: RetroStatsTickerProps) {
  const [stats, setStats] = useState<StatsData | null>(globalStatsCache);
  const [isLoading, setIsLoading] = useState(!globalStatsCache);
  const [glitchActive, setGlitchActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get user's VOT balance
  const { address, isConnected } = useAccount();
  const { data: votBalance } = useBalance({
    address,
    token: VOT_TOKEN_ADDRESS,
    query: { enabled: isConnected },
  });

  const fetchStats = useCallback(async () => {
    // Use cached if fresh enough
    if (globalStatsCache && Date.now() - lastFetchTime < FETCH_INTERVAL) {
      setStats(globalStatsCache);
      setIsLoading(false);
      return globalStatsCache;
    }

    // Reuse in-flight request
    if (globalFetchPromise) {
      const result = await globalFetchPromise;
      if (result) setStats(result);
      setIsLoading(false);
      return result;
    }

    // New fetch
    globalFetchPromise = (async () => {
      try {
        const response = await fetch('/api/stats', { 
          cache: 'no-store',
          signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        globalStatsCache = data;
        lastFetchTime = Date.now();
        return data;
      } catch (error) {
        console.warn('[RetroStatsTicker] Fetch failed:', error);
        return null;
      } finally {
        globalFetchPromise = null;
      }
    })();

    const result = await globalFetchPromise;
    if (result) {
      setStats(result);
      // Glitch effect on update
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }
    setIsLoading(false);
    return result;
  }, []);

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, FETCH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStats]);

  const formatGas = (gwei: number) => {
    if (gwei < 0.001) return '<0.001';
    if (gwei < 0.01) return gwei.toFixed(3);
    if (gwei < 1) return gwei.toFixed(2);
    return gwei.toFixed(1);
  };

  // Format VOT price without scientific notation (e.g., $0.0000003)
  const formatVotPrice = (price: number) => {
    if (price === 0) return '$0.00';
    if (price < 0.0000001) return `$${price.toFixed(10)}`;
    if (price < 0.000001) return `$${price.toFixed(9)}`;
    if (price < 0.00001) return `$${price.toFixed(8)}`;
    if (price < 0.0001) return `$${price.toFixed(7)}`;
    if (price < 0.001) return `$${price.toFixed(6)}`;
    if (price < 0.01) return `$${price.toFixed(5)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  // Format VOT balance (e.g., 1.5M, 500K, 1,234)
  const formatVotBalance = () => {
    if (!votBalance) return '0';
    const value = parseFloat(votBalance.formatted);
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-[#00FF88]';
    if (change < 0) return 'text-[#FF4444]';
    return 'text-[#888888]';
  };

  const getChangePrefix = (change: number) => {
    if (change > 0) return '+';
    return '';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 font-mono text-[10px] ${className}`}>
        {/* Gas */}
        <div className="flex items-center gap-1 px-2 py-1 bg-black/80 border border-[#00FF88]/40 rounded">
          <span className="text-[#00FF88]/60">⛽</span>
          <span className={`text-[#00FF88] ${glitchActive ? 'animate-pulse' : ''}`}>
            {isLoading ? '...' : formatGas(stats?.gasPriceGwei ?? 0)}
          </span>
          <span className="text-[#00FF88]/50 text-[8px]">gwei</span>
        </div>
        
        {/* VOT Price */}
        <div className="flex items-center gap-1 px-2 py-1 bg-black/80 border border-[#00FFFF]/40 rounded">
          <span className="text-[#00FFFF]/60">{VOT_GLYPH}</span>
          <span className={`text-[#00FFFF] ${glitchActive ? 'animate-pulse' : ''}`}>
            {isLoading ? '...' : formatVotPrice(stats?.votPrice ?? 0)}
          </span>
        </div>

        {/* VOT Balance */}
        <div className="flex items-center gap-1 px-2 py-1 bg-black/80 border border-[#FF6600]/40 rounded">
          <span className="text-[#FF6600]/60">{VOT_GLYPH}</span>
          <span className={`text-[#FF6600] ${glitchActive ? 'animate-pulse' : ''}`}>
            {isConnected ? formatVotBalance() : '---'}
          </span>
          <span className="text-[#FF6600]/50 text-[8px]">VOT</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Matrix-style ticker bar */}
      <div 
        className={`
          flex items-center justify-center gap-3 sm:gap-6 
          px-3 py-2 
          bg-black/90 
          border-y border-[#00FF88]/30
          font-mono text-[10px] sm:text-xs
          ${glitchActive ? 'animate-pulse' : ''}
        `}
        style={{
          textShadow: '0 0 10px rgba(0,255,136,0.5)',
          boxShadow: 'inset 0 0 20px rgba(0,255,136,0.1)',
        }}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,255,136,0.03)_50%)] bg-[size:100%_4px]" />
        
        {/* Left decoration */}
        <div className="hidden sm:flex items-center gap-1 text-[#00FF88]/40 select-none">
          <span className="animate-pulse">▸</span>
          <span>SYS</span>
        </div>

        {/* BASE GAS */}
        <div className="flex items-center gap-1.5 group">
          {showLabels && (
            <span className="text-[#00FF88]/60 uppercase tracking-wider hidden xs:inline">GAS</span>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#00FF88]/10 border border-[#00FF88]/40 rounded group-hover:border-[#00FF88]/80 transition-colors">
            <span className="text-[#00FF88] text-[8px] sm:text-[10px]">⛽</span>
            <span className={`text-[#00FF88] font-bold tabular-nums ${glitchActive ? 'glitch-text' : ''}`}>
              {isLoading ? (
                <span className="animate-pulse">███</span>
              ) : (
                formatGas(stats?.gasPriceGwei ?? 0)
              )}
            </span>
            <span className="text-[#00FF88]/50 text-[8px]">gwei</span>
          </div>
        </div>

        {/* Divider */}
        <span className="text-[#00FF88]/30 select-none">│</span>

        {/* VOT PRICE */}
        <div className="flex items-center gap-1.5 group">
          {showLabels && (
            <span className="text-[#00FFFF]/60 uppercase tracking-wider hidden xs:inline">{VOT_GLYPH}</span>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#00FFFF]/10 border border-[#00FFFF]/40 rounded group-hover:border-[#00FFFF]/80 transition-colors">
            <span className="text-[#00FFFF] text-[8px] sm:text-[10px]">{VOT_GLYPH}</span>
            <span className={`text-[#00FFFF] font-bold tabular-nums ${glitchActive ? 'glitch-text' : ''}`}>
              {isLoading ? (
                <span className="animate-pulse">$█████</span>
              ) : (
                formatVotPrice(stats?.votPrice ?? 0)
              )}
            </span>
            {/* 24h change */}
            {!isLoading && stats?.votChange24h !== undefined && stats.votChange24h !== 0 && (
              <span className={`text-[8px] tabular-nums ${getChangeColor(stats.votChange24h)}`}>
                {getChangePrefix(stats.votChange24h)}{stats.votChange24h.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <span className="text-[#FF6600]/30 select-none">│</span>

        {/* VOT BALANCE */}
        <div className="flex items-center gap-1.5 group">
          {showLabels && (
            <span className="text-[#FF6600]/60 uppercase tracking-wider hidden xs:inline">BAL</span>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#FF6600]/10 border border-[#FF6600]/40 rounded group-hover:border-[#FF6600]/80 transition-colors">
            <span className="text-[#FF6600] text-[8px] sm:text-[10px]">{VOT_GLYPH}</span>
            <span className={`text-[#FF6600] font-bold tabular-nums ${glitchActive ? 'glitch-text' : ''}`}>
              {isConnected ? formatVotBalance() : '---'}
            </span>
            <span className="text-[#FF6600]/50 text-[8px]">VOT</span>
          </div>
        </div>

        {/* Right decoration */}
        <div className="hidden sm:flex items-center gap-1 text-[#00FF88]/40 select-none">
          <span>LIVE</span>
          <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
