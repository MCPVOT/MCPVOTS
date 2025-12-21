"use client";

import { useEffect, useMemo, useState } from "react";

type IntelMetric = {
    label: string;
    value: string;
    trend: "up" | "down" | "steady";
};

type IntelLog = {
    timestamp: string;
    message: string;
    channel: "BASE" | "VOT" | "NEYNAR" | "TREASURY";
};

const BASE_METRICS_SEED: IntelMetric[] = [
    { label: "BASE GAS (GWEI)", value: "0.12", trend: "steady" },
    { label: "BLOCK HEIGHT", value: "12,993,428", trend: "up" },
    { label: "TREASURY LEDGER", value: "$512,440", trend: "up" },
    { label: "VOT PRICE", value: "$0.0132", trend: "steady" },
    { label: "BUYBACK BOT", value: "SYNCED", trend: "steady" },
    { label: "FARCASTER SIGNAL", value: "+17.6%", trend: "up" }
];

const BASE_INTEL_LOGS: IntelLog[] = [
    { timestamp: "19:42:01", message: "Base RPC handshake stable • wss://base-mainnet", channel: "BASE" },
    { timestamp: "19:42:14", message: "VOT buyback bot armed • 1.00 USDC per mint", channel: "VOT" },
    { timestamp: "19:42:27", message: "Treasury ledger verified • 0x10eB...39e6", channel: "TREASURY" },
    { timestamp: "19:42:39", message: "Gas floor sampling 0.12 gwei • corridor nominal", channel: "BASE" },
    { timestamp: "19:42:51", message: "Neynar sentiment ↑ 12% • pre-mint hype rising", channel: "NEYNAR" },
    { timestamp: "19:43:04", message: "Signal deck streaming • 48 casts parsed", channel: "NEYNAR" },
    { timestamp: "19:43:16", message: "Mint webhook queue primed • x402 ready", channel: "TREASURY" },
    { timestamp: "19:43:28", message: "Base validator drift within 0.4% • safe", channel: "BASE" },
    { timestamp: "19:43:41", message: "Ops bay telemetry sync complete", channel: "VOT" },
    { timestamp: "19:43:53", message: "Recon grid reporting 12,329 entry slots", channel: "BASE" }
];

const TREND_COLOR: Record<IntelMetric["trend"], string> = {
    up: "text-emerald-300",
    down: "text-rose-300",
    steady: "text-cyan-200"
};

const CHANNEL_COLOR: Record<IntelLog["channel"], string> = {
    BASE: "text-cyan-200",
    VOT: "text-amber-200",
    NEYNAR: "text-purple-200",
    TREASURY: "text-emerald-200"
};

type TrendPulse = {
    label: string;
    value: string;
    trend: IntelMetric["trend"];
};

export default function BaseIntelTerminal() {
    const [pulseMetrics, setPulseMetrics] = useState<TrendPulse[]>(BASE_METRICS_SEED);
    const [logPointer, setLogPointer] = useState(0);

    useEffect(() => {
        const driftInterval = setInterval(() => {
            setPulseMetrics((current) =>
                current.map((metric, index) => {
                    if (index === 0) {
                        const drift = (Math.sin(Date.now() / 60000) * 0.01).toFixed(2);
                        const nextValue = Math.max(0.07, parseFloat(metric.value) + parseFloat(drift)).toFixed(2);
                        return { ...metric, value: nextValue, trend: parseFloat(drift) >= 0 ? "up" : "down" };
                    }
                    if (index === 3) {
                        const oscillation = (Math.sin(Date.now() / 45000) * 0.0004).toFixed(4);
                        const updated = (parseFloat(metric.value.replace("$", "")) + parseFloat(oscillation)).toFixed(4);
                        return { ...metric, value: `$${updated}`, trend: parseFloat(oscillation) >= 0 ? "up" : "down" };
                    }
                    return metric;
                })
            );
        }, 4200);

        return () => clearInterval(driftInterval);
    }, []);

    useEffect(() => {
        const logInterval = setInterval(() => {
            setLogPointer((prev) => (prev + 1) % BASE_INTEL_LOGS.length);
        }, 3600);
        return () => clearInterval(logInterval);
    }, []);

    const visibleLogs = useMemo(() => {
        const windowSize = 6;
        return Array.from({ length: windowSize }, (_, offset) => BASE_INTEL_LOGS[(logPointer + offset) % BASE_INTEL_LOGS.length]);
    }, [logPointer]);

    return (
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-[#040b16]/85 shadow-[0_0_40px_rgba(56,189,248,0.18)]">
            <div className="absolute inset-0 opacity-15" style={{
                backgroundImage:
                    "linear-gradient(90deg, rgba(56,189,248,0.12) 1px, transparent 1px), linear-gradient(0deg, rgba(56,189,248,0.12) 1px, transparent 1px)",
                backgroundSize: "48px 48px"
            }} />
            <div className="relative border-b border-cyan-500/30 px-6 py-4 flex items-center justify-between">
                <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.5em] text-cyan-300/70">Base Intelligence Relay</p>
                    <p className="text-xs text-slate-400 font-mono">Core telemetry • Base mainnet</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.9)]" />
                    <span className="text-[0.65rem] font-mono uppercase tracking-[0.4em] text-emerald-300/80">Linked</span>
                </div>
            </div>

            <div className="relative grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-3">
                {pulseMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-slate-700/60 bg-black/55 px-4 py-4 shadow-[0_0_20px_rgba(56,189,248,0.12)]">
                        <p className="text-[0.62rem] uppercase tracking-[0.45em] text-slate-400">{metric.label}</p>
                        <p className={`mt-2 font-mono text-lg ${TREND_COLOR[metric.trend]}`}>{metric.value}</p>
                    </div>
                ))}
            </div>

            <div className="relative border-t border-slate-800/60 bg-black/60">
                <div className="flex items-center justify-between px-6 py-3 text-xs uppercase tracking-[0.4em] text-slate-500">
                    <span>Real-time Terminal Feed</span>
                    <span className="font-mono text-slate-400">{visibleLogs[0]?.timestamp} UTC</span>
                </div>
                <div className="relative px-6 pb-6">
                    <div className="max-h-48 space-y-2 overflow-hidden font-mono text-sm text-slate-300">
                        {visibleLogs.map((log, index) => (
                            <div key={`${log.timestamp}-${log.message}`} className="flex items-start gap-3">
                                <span className="text-cyan-400/70">›</span>
                                <span className={`${CHANNEL_COLOR[log.channel]} ${index === 0 ? "text-opacity-100" : "text-opacity-80"}`}>
                                    [{log.channel}] {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
