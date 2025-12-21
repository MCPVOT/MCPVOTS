import type { MarqueeItem } from '@/hooks/useIntelligenceStreams';

type Accent = 'green' | 'blue' | 'orange';

export type StatusIndicatorState = 'online' | 'offline' | 'degraded' | 'connecting';

export interface StatusIndicator {
    label: string;
    status: StatusIndicatorState;
    hint?: string;
}

interface StatusTickerProps {
    items: MarqueeItem[];
    accent?: Accent;
    className?: string;
    loading?: boolean;
    statusIndicators?: StatusIndicator[];
    emptyMessage?: string;
}

const accentClassName: Record<Accent, string> = {
    green: 'crt-panel--green',
    blue: 'crt-panel--blue',
    orange: 'crt-panel--orange',
};

const indicatorClassName: Record<StatusIndicatorState, string> = {
    online: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/40',
    offline: 'bg-rose-500/15 text-rose-200 border border-rose-400/40',
    degraded: 'bg-amber-500/15 text-amber-200 border border-amber-400/40',
    connecting: 'bg-sky-500/15 text-sky-200 border border-sky-400/40',
};

const indicatorDotClassName: Record<StatusIndicatorState, string> = {
    online: 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]',
    offline: 'bg-rose-400 shadow-[0_0_6px_rgba(248,113,113,0.7)]',
    degraded: 'bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.7)]',
    connecting: 'bg-sky-300 shadow-[0_0_6px_rgba(125,211,252,0.7)]',
};

const toneClassName = {
    positive: 'ticker__item--positive',
    neutral: 'ticker__item--neutral',
    negative: 'ticker__item--negative',
    warning: 'ticker__item--warning',
} as const;

export default function StatusTicker({
    items,
    accent = 'blue',
    className,
    loading = false,
    statusIndicators = [],
    emptyMessage = 'Awaiting live intelligence…',
}: StatusTickerProps) {
    const accentClass = accentClassName[accent];
    const containerClassName = ['crt-panel', accentClass, 'ticker', 'flex', 'flex-col', 'gap-2', className]
        .filter(Boolean)
        .join(' ');

    const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
    const loopItems = items.length > 0 ? [...items, ...items] : [];
    const trackClassName = ['ticker__track', loopItems.length <= 1 ? 'ticker__track--static' : null]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={containerClassName} aria-label="status ticker" aria-busy={loading}>
            {statusIndicators.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-3 pt-2 text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-slate-200/70">
                    {statusIndicators.map((indicator) => (
                        <span
                            key={indicator.label}
                            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 ${indicatorClassName[indicator.status]}`}
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${indicatorDotClassName[indicator.status]}`}></span>
                            <span>{indicator.label}</span>
                            {indicator.hint && <span className="text-[0.5rem] tracking-[0.3em] text-slate-100/60">{indicator.hint}</span>}
                        </span>
                    ))}
                </div>
            )}

            <div
                className={trackClassName}
                role="list"
                tabIndex={loopItems.length > 0 ? 0 : -1}
                aria-live="polite"
            >
                {loopItems.length > 0 ? (
                    loopItems.map((item, index) => {
                        const toneKey = item.tone ?? 'neutral';
                        const timestampLabel = typeof item.timestamp === 'number' && item.timestamp > 0
                            ? timeFormatter.format(new Date(item.timestamp))
                            : null;

                        return (
                            <span
                                key={`${item.label}-${item.source ?? 'stream'}-${index}`}
                                className={[`ticker__item`, toneClassName[toneKey]].join(' ')}
                                role="listitem"
                            >
                                <span className="ticker__label">{item.label}</span>
                                <strong>{item.message}</strong>
                                {item.source && <span className="ticker__source">{item.source}</span>}
                                {timestampLabel && (
                                    <time className="ticker__timestamp" dateTime={new Date(item.timestamp!).toISOString()}>
                                        {timestampLabel}
                                    </time>
                                )}
                            </span>
                        );
                    })
                ) : (
                    <span className="ticker__item ticker__item--neutral" role="listitem">
                        <strong>{loading ? 'Loading live intelligence…' : emptyMessage}</strong>
                    </span>
                )}
            </div>
        </div>
    );
}
