export type TerminalWidgetType = 'radar' | 'bars' | 'metrics' | 'glyph' | 'scroll' | 'badge';

export interface TerminalPalette {
    name: string;
    /** Base CRT background tone */
    background: string;
    /** Grid line tint */
    grid: string;
    /** Primary neon accent */
    primary: string;
    /** Secondary neon accent */
    secondary: string;
    /** Text foreground */
    text: string;
    /** Alert/highlight color */
    alert: string;
    /** Soft glow tone for bloom overlays */
    glow: string;
}

export interface TerminalWidgetBase {
    id: string;
    type: TerminalWidgetType;
    /** Top-left position in normalized viewport units (0-1) */
    position: [number, number];
    /** Width/height in normalized viewport units (0-1) */
    size: [number, number];
    /** Optional z layering order */
    z?: number;
}

export interface RadarWidget extends TerminalWidgetBase {
    type: 'radar';
    rings: number;
    sweepSpeed: number;
    blips: Array<{ angle: number; distance: number; strength: number }>;
}

export interface BarsWidget extends TerminalWidgetBase {
    type: 'bars';
    orientation: 'vertical' | 'horizontal';
    items: Array<{ label: string; value: number; tone?: 'default' | 'accent' | 'alert' }>;
}

export interface MetricsWidget extends TerminalWidgetBase {
    type: 'metrics';
    columns: number;
    metrics: Array<{ label: string; value: string; tone?: 'default' | 'accent' | 'alert' }>;
}

export interface GlyphWidget extends TerminalWidgetBase {
    type: 'glyph';
    glyph: 'mech' | 'sphere' | 'grid' | 'city' | 'signal';
    intensity: number;
}

export interface ScrollWidget extends TerminalWidgetBase {
    type: 'scroll';
    lines: string[];
    speed: number;
}

export interface BadgeWidget extends TerminalWidgetBase {
    type: 'badge';
    label: string;
    value: string;
    tone?: 'default' | 'accent' | 'alert';
}

export type TerminalWidget = RadarWidget | BarsWidget | MetricsWidget | GlyphWidget | ScrollWidget | BadgeWidget;

export interface SceneBlueprint {
    tierId: string;
    tokenId: number;
    seed: number;
    palette: TerminalPalette;
    widgets: TerminalWidget[];
    header: {
        title: string;
        subtitle: string;
        code: string;
        logoVariant?: 'vot' | 'base' | 'warplet' | 'mech' | 'signal';
        ownerAddress?: string; // Wallet address for name resolution
        ownerName?: string; // Resolved Basename/ENS name
    };
    footer: {
        caption: string;
        refreshIntervalSeconds: number;
    };
}
