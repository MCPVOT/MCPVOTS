'use client';

import Image from 'next/image';

type Accent = 'green' | 'blue' | 'orange';

interface MiniAppCardProps {
    icon: string;
    name: string;
    tagline: string;
    buttonText: string;
    onClick: () => void;
    devName?: string;
    embedImage?: string;
    liveData?: {
        value: string;
        change?: number;
        changeLabel?: string;
    };
    accent?: Accent;
    className?: string;
}

const accentCardClass: Record<Accent, string> = {
    green: 'cyber-card--green',
    blue: 'cyber-card--blue',
    orange: 'cyber-card--orange',
};

const accentButtonClass: Record<Accent, string> = {
    green: 'neon-button--green',
    blue: 'neon-button--blue',
    orange: 'neon-button--orange',
};

export default function MiniAppCard({
    icon,
    name,
    tagline,
    buttonText,
    onClick,
    devName,
    embedImage,
    liveData,
    accent = 'green',
    className,
}: MiniAppCardProps) {
    const cardClasses = ['cyber-card', accentCardClass[accent], 'hover-glow', className]
        .filter(Boolean)
        .join(' ');
    const buttonClasses = ['neon-button', accentButtonClass[accent], 'w-full', 'justify-center', 'min-h-[44px]', 'py-3', 'px-4', 'text-sm', 'font-semibold', 'transition-all', 'duration-300', 'hover:scale-105', 'active:scale-95']
        .filter(Boolean)
        .join(' ');

    return (
        <div className={cardClasses}>
            {/* Embed Image (if provided) */}
            {embedImage && (
                <div className="w-full h-32 bg-slate-900/70 rounded-lg mb-3 overflow-hidden">
                    <Image
                        src={embedImage}
                        alt={name}
                        width={400}
                        height={128}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
            )}

            <div className="flex items-start space-x-3 mb-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 border border-white/10 bg-white/5">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold tracking-widest uppercase text-slate-100 truncate">
                        {name}
                    </h3>
                    <p className="text-xs text-slate-300/70 mt-1 line-clamp-2">
                        {tagline}
                    </p>
                    {liveData && (
                        <div className="mt-2">
                            <div className="text-sm font-mono font-bold text-slate-100">
                                {liveData.value}
                            </div>
                            {liveData.change !== undefined && liveData.changeLabel && (
                                <div
                                    className={`text-xs font-mono ${liveData.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                        }`}
                                >
                                    {liveData.change >= 0 ? '↗' : '↘'} {Math.abs(liveData.change).toFixed(2)}
                                    {liveData.changeLabel}
                                </div>
                            )}
                        </div>
                    )}
                    {devName && (
                        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400/70 mt-2">
                            by {devName}
                        </p>
                    )}
                </div>
            </div>
            <button
                onClick={onClick}
                className={buttonClasses}
                type="button"
                aria-label={buttonText}
            >
                {buttonText}
            </button>
        </div>
    );
}
