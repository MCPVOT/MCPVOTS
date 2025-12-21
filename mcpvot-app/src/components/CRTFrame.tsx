import { ReactNode } from 'react';

type Accent = 'green' | 'blue' | 'orange';

const accentClassName: Record<Accent, string> = {
    green: 'crt-panel--green',
    blue: 'crt-panel--blue',
    orange: 'crt-panel--orange',
};

interface CRTFrameProps {
    title?: string;
    subtitle?: string;
    accent?: Accent;
    actions?: ReactNode;
    className?: string;
    bodyClassName?: string;
    children: ReactNode;
}

export default function CRTFrame({
    title,
    subtitle,
    accent = 'green',
    actions,
    className,
    bodyClassName,
    children,
}: CRTFrameProps) {
    const hasHeader = Boolean(title || subtitle || actions);
    const accentClass = accentClassName[accent];
    const frameClassName = ['crt-panel', 'crt-frame', accentClass, className].filter(Boolean).join(' ');
    const bodyClasses = [hasHeader ? 'mt-4' : undefined, bodyClassName]
        .filter(Boolean)
        .join(' ');

    return (
        <section className={frameClassName}>
            {hasHeader && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-3">
                    <div className="space-y-1">
                        {title && <p className="crt-panel__title">{title}</p>}
                        {subtitle && <p className="crt-panel__subtitle">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em]">{actions}</div>}
                </div>
            )}
            <div className={bodyClasses || undefined}>{children}</div>
        </section>
    );
}
