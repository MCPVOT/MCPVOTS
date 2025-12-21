"use client";

import { useEffect, useMemo, useState } from "react";

type Tier = "BASIC" | "PREMIUM" | "LEGENDARY" | "HYBRID";

type Severity = "nominal" | "warning" | "critical";

interface LiveTerminalPreviewProps {
    tokenId?: string;
    tier?: Tier;
    ownerBaseName?: string | null;
    ownerAddress?: string | null;
    votBalance?: number | null;
}

interface TelemetrySnapshot {
    gasPrice: number;
    votPrice: number;
    blockNumber: number;
    tps: number;
    cpu: number;
    memory: number;
    network: number;
    uptime: number;
}

const TIER_COLORS: Record<Tier, { primary: string; accent: string; grid: string }> = {
    BASIC: { primary: "#31FF6A", accent: "#00C853", grid: "#0B2A16" },
    PREMIUM: { primary: "#36D9FF", accent: "#0AA0F6", grid: "#08243D" },
    LEGENDARY: { primary: "#FFC14D", accent: "#FF6F00", grid: "#3D2108" },
    HYBRID: { primary: "#FF7A45", accent: "#F94D1D", grid: "#2F160B" },
};

const LOG_MESSAGES: Array<{ template: string; severity: Severity }> = [
    { template: "Block #{block} processed • Latency {latency}ms", severity: "nominal" },
    { template: "VOT liquidity routed through x402 channel", severity: "nominal" },
    { template: "Base name verification ping: {base}", severity: "nominal" },
    { template: "Intelligence feed sync {sync}% complete", severity: "warning" },
    { template: "Mempool pressure spike detected", severity: "warning" },
    { template: "Predictive model recalibrating parameters", severity: "nominal" },
    { template: "Cross-chain relay handshake finalized", severity: "nominal" },
    { template: "Latency deviation exceeds SLA", severity: "critical" },
    { template: "Warpcast signal strength optimized", severity: "nominal" },
    { template: "x402 signature audit complete", severity: "nominal" },
];

const severityClassMap: Record<Severity, string> = {
    nominal: "text-white/80",
    warning: "text-amber-300",
    critical: "text-red-400",
};

const formatNumber = (value: number, decimals = 2) => value.toFixed(decimals);

const formatVOT = (balance: number | null | undefined) => {
    if (balance == null) {
        return "--";
    }
    if (balance >= 1000) {
        return `${(balance / 1000).toFixed(2)}k`;
    }
    return balance.toFixed(2);
};

export function LiveTerminalPreview({
    tokenId = "0020",
    tier = "LEGENDARY",
    ownerBaseName,
    ownerAddress,
    votBalance,
}: LiveTerminalPreviewProps) {
    const [telemetry, setTelemetry] = useState<TelemetrySnapshot>(() => ({
        gasPrice: 18.2,
        votPrice: 0.0038,
        blockNumber: 21840000,
        tps: 74,
        cpu: 41,
        memory: 72,
        network: 9,
        uptime: 188340,
    }));

    const [logFeed, setLogFeed] = useState<
        Array<{ timestamp: string; message: string; severity: Severity }>
    >(() => []);

    const tierColors = useMemo(() => TIER_COLORS[tier], [tier]);

    const ownerLabel = useMemo(() => {
        if (ownerBaseName) {
            return ownerBaseName;
        }
        if (ownerAddress) {
            return `${ownerAddress.slice(0, 6)}…${ownerAddress.slice(-4)}`;
        }
        return "unlinked.base";
    }, [ownerBaseName, ownerAddress]);

    useEffect(() => {
        const telemetryInterval = setInterval(() => {
            setTelemetry((prev) => {
                const drift = (factor: number) => (Math.random() - 0.5) * factor;
                return {
                    gasPrice: Math.max(5, prev.gasPrice + drift(1.4)),
                    votPrice: Math.max(0.0015, prev.votPrice + drift(0.0003)),
                    blockNumber: prev.blockNumber + Math.floor(Math.random() * 3),
                    tps: Math.max(40, Math.min(140, prev.tps + drift(6))),
                    cpu: Math.max(18, Math.min(94, prev.cpu + drift(5))),
                    memory: Math.max(35, Math.min(98, prev.memory + drift(4))),
                    network: Math.max(4, Math.min(25, prev.network + drift(2))),
                    uptime: prev.uptime + 3,
                };
            });
        }, 3000);

        const logInterval = setInterval(() => {
            setLogFeed((current) => {
                const entry = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
                const now = new Date();
                const pad = (num: number) => String(num).padStart(2, "0");
                const timestamp = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

                const message = entry.template
                    .replace("{block}", telemetry.blockNumber.toLocaleString())
                    .replace("{latency}", formatNumber(Math.random() * 80 + 20, 0))
                    .replace("{sync}", formatNumber(Math.random() * 35 + 60, 0))
                    .replace("{base}", ownerLabel);

                const updated = [{ timestamp, message, severity: entry.severity }, ...current];
                return updated.slice(0, 12);
            });
        }, 3200);

        return () => {
            clearInterval(telemetryInterval);
            clearInterval(logInterval);
        };
    }, [ownerLabel, telemetry.blockNumber]);

    return (
        <section
            className="relative overflow-hidden rounded-3xl border-2 border-white/10 bg-black/70 p-6 shadow-[0_0_40px_rgba(255,74,14,0.25)]"
            style={{
                backgroundImage: `radial-gradient(circle at top, ${tierColors.grid} 0%, transparent 65%)`,
            }}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                    backgroundImage:
                        "linear-gradient(transparent 95%, rgba(255,255,255,0.07) 95%), linear-gradient(90deg, transparent 95%, rgba(255,255,255,0.07) 95%)",
                    backgroundSize: "12px 12px",
                }}
            ></div>

            <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Live Terminal</p>
                        <h2
                            className="font-orbitron-wide text-3xl tracking-[0.3em] text-white"
                            style={{ textShadow: `0 0 18px ${tierColors.primary}` }}
                        >
                            MCPVOT #{tokenId}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                            {tier}
                        </span>
                        <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                            IPFS STREAMING
                        </span>
                    </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr,0.9fr]">
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-3 text-white/80">
                            <MetricCard label="Gas" unit="GWEI" value={telemetry.gasPrice} color={tierColors.primary} />
                            <MetricCard label="VOT" unit="USD" value={telemetry.votPrice} color={tierColors.primary} decimals={4} />
                            <MetricCard label="TPS" unit="OPS" value={telemetry.tps} color={tierColors.accent} />
                            <MetricCard label="Block" value={telemetry.blockNumber} color={tierColors.accent} format={(val) => Number(val).toLocaleString()} />
                        </div>

                        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 shadow-inner">
                            <SystemBar label="CPU" value={telemetry.cpu} color={tierColors.primary} />
                            <SystemBar label="Memory" value={telemetry.memory} color={tierColors.accent} />
                            <SystemBar label="Network" value={telemetry.network} color="#2AF5FF" max={30} />
                            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                                <span>Uptime</span>
                                <span>{formatUptime(telemetry.uptime)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 shadow-inner">
                            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                                <span>Owner</span>
                                <span>VOT Balance</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-sm">
                                <span className="font-semibold text-white" style={{ textShadow: `0 0 12px ${tierColors.primary}` }}>
                                    {ownerLabel}
                                </span>
                                <span className="font-semibold text-white" style={{ textShadow: `0 0 12px ${tierColors.primary}` }}>
                                    {formatVOT(votBalance ?? 482.56)} VOT
                                </span>
                            </div>
                            <p className="mt-2 text-[0.65rem] uppercase tracking-[0.4em] text-white/40">
                                Streamed through x402 agent payment channel
                            </p>
                        </div>

                        <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-4">
                            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/40">Log Stream</p>
                            <div className="grid gap-2 text-[0.7rem] leading-relaxed">
                                {logFeed.map((log) => (
                                    <div key={`${log.timestamp}-${log.message.slice(0, 6)}`} className="flex gap-3">
                                        <span className="text-white/40">[{log.timestamp}]</span>
                                        <span className={`${severityClassMap[log.severity]} transition-colors`}>{log.message}</span>
                                    </div>
                                ))}
                                {logFeed.length === 0 && (
                                    <div className="text-white/50">Boot sequence in progress… awaiting live signals.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function MetricCard({
    label,
    value,
    unit,
    color,
    decimals = 2,
    format,
}: {
    label: string;
    value: number;
    unit?: string;
    color: string;
    decimals?: number;
    format?: (val: number) => string;
}) {
    const displayValue = format ? format(value) : formatNumber(value, decimals);
    return (
        <div
            className="rounded-2xl border border-white/10 bg-black/60 p-4 shadow-inner"
            style={{ boxShadow: `0 0 25px -10px ${color}` }}
        >
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/40">{label}</p>
            <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-semibold text-white" style={{ textShadow: `0 0 14px ${color}` }}>
                    {displayValue}
                </span>
                {unit && <span className="text-[0.6rem] uppercase tracking-[0.3em] text-white/50">{unit}</span>}
            </div>
        </div>
    );
}

function SystemBar({ label, value, color, max = 100 }: { label: string; value: number; color: string; max?: number }) {
    const clamped = Math.min(max, Math.max(0, value));
    const ratio = (clamped / max) * 100;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-white/40">
                <span>{label}</span>
                <span>{Math.round(clamped)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${ratio}%`, background: color }}></div>
            </div>
        </div>
    );
}

function formatUptime(seconds: number) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}
