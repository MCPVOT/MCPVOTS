/**
 * RetroTicker - Animated retro terminal-style price ticker
 * Displays ETH, GAS, VOT, MAXX prices with cyberpunk styling
 */

'use client';

import { useRealtimeData } from '@/hooks/useRealtimeData';

interface TickerItem {
    label: string;
    value: number | null;
    prefix?: string;
    suffix?: string;
    color: string;
    glowColor: string;
}

export default function RetroTicker() {
    const { data } = useRealtimeData();

    // Use fallback data if disconnected
    const displayData = {
        eth_price: data.eth_price || 3456.78,
        base_gas_gwei: data.base_gas_gwei || 0.001,
        vot_price: data.vot_price || 0.0023,
        maxx_price: data.maxx_price || 0.000456,
        status: data.status
    };

    const tickers: TickerItem[] = [
        {
            label: 'ETH',
            value: displayData.eth_price,
            prefix: '$',
            color: 'text-[#00FFFF]',
            glowColor: 'rgba(0, 255, 255, 0.8)'
        },
        {
            label: 'GAS',
            value: displayData.base_gas_gwei,
            suffix: ' GWEI',
            color: 'text-[#00FF88]',
            glowColor: 'rgba(0, 255, 136, 0.8)'
        },
        {
            label: 'VOT',
            value: displayData.vot_price,
            prefix: '$',
            color: 'text-[#FFFF00]',
            glowColor: 'rgba(255, 255, 0, 0.8)'
        },
        {
            label: 'MAXX',
            value: displayData.maxx_price,
            prefix: '$',
            color: 'text-[#FF8800]',
            glowColor: 'rgba(255, 136, 0, 0.8)'
        }
    ];

    return (
        <div className="relative w-full overflow-hidden border-y-2 border-[#00FFFF]/50 shadow-[0_0_25px_rgba(0,255,255,0.4)] bg-black/90 backdrop-blur-md">
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_3px] pointer-events-none animate-scan opacity-30" />

            {/* Animated border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FFFF]/0 via-[#00FFFF]/20 to-[#00FFFF]/0 animate-shimmer-slow pointer-events-none" />

            <div className="relative py-4 px-6">
                <div className="flex items-center justify-around gap-10 font-mono">
                    {tickers.map((ticker, index) => (
                        <div
                            key={ticker.label}
                            className="flex items-center gap-4 transition-all duration-300 hover:scale-110 cursor-pointer group"
                            style={{
                                animation: `fadeIn 0.5s ease-out ${index * 150}ms both`
                            }}
                        >
                            {/* Label with stronger glow */}
                            <div className="relative">
                                <div
                                    className="absolute -inset-2 blur-xl opacity-60 group-hover:opacity-100 transition-opacity"
                                    style={{ backgroundColor: ticker.glowColor }}
                                />
                                <span className="relative text-base font-black tracking-[0.2em] text-slate-100 uppercase group-hover:text-white transition-colors drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                    {ticker.label}
                                </span>
                            </div>

                            {/* Animated separator */}
                            <span className="text-[#00FFFF]/70 group-hover:text-[#00FFFF] transition-colors text-xl animate-pulse-slow">▸</span>

                            {/* Value with enhanced glow */}
                            <div className="relative min-w-[140px] text-right">
                                {ticker.value !== null ? (
                                    <>
                                        <div
                                            className="absolute -inset-3 blur-2xl opacity-50 animate-pulse group-hover:opacity-80 transition-opacity"
                                            style={{ backgroundColor: ticker.glowColor }}
                                        />
                                        <span className={['relative', 'text-xl', 'font-black', ticker.color, 'drop-shadow-[0_0_15px_currentColor]', 'group-hover:drop-shadow-[0_0_20px_currentColor]', 'transition-all', 'font-mono', 'tabular-nums'].filter(Boolean).join(' ')}>
                                            {ticker.prefix}
                                            {ticker.value.toLocaleString('en-US', {
                                                minimumFractionDigits: ticker.suffix ? 3 : 2,
                                                maximumFractionDigits: ticker.suffix ? 3 : 4
                                            })}
                                            {ticker.suffix}
                                        </span>
                                    </>
                                ) : (
                                    <span className="relative text-xl font-black text-slate-700 animate-pulse font-mono">
                                        {ticker.prefix || ''}---{ticker.suffix || ''}
                                    </span>
                                )}
                            </div>

                            {/* Enhanced status indicator */}
                            {index === 0 && (
                                <div className="absolute -right-3 top-1/2 -translate-y-1/2">
                                    <div
                                        className={['w-3', 'h-3', 'rounded-full', 'transition-all', 'duration-300', displayData.status === 'connected' ? 'bg-[#00FF88] animate-pulse shadow-[0_0_20px_rgba(0,255,136,1)]' : displayData.status === 'connecting' ? 'bg-[#FFFF00] animate-pulse shadow-[0_0_20px_rgba(255,255,0,1)]' : 'bg-[#FF8800] shadow-[0_0_20px_rgba(255,136,0,1)]'].filter(Boolean).join(' ')}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Connection status text with better positioning */}
            {displayData.status !== 'connected' && (
                <div className="absolute bottom-1 left-0 right-0 text-center">
                    <span className="text-[0.65rem] text-[#FFFF00] font-bold uppercase tracking-[0.25em] font-mono drop-shadow-[0_0_12px_rgba(255,255,0,1)] animate-pulse-slow">
                        {displayData.status === 'connecting' ? '⟳ CONNECTING TO LIVE DATA...' : '⚠ DISPLAYING CACHED DATA'}
                    </span>
                </div>
            )}
        </div>
    );
}
