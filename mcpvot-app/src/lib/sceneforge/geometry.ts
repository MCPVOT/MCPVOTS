import type {
    BadgeWidget,
    BarsWidget,
    GlyphWidget,
    MetricsWidget,
    RadarWidget,
    ScrollWidget,
    TerminalWidget,
} from './types';

type WidgetPosition = [number, number];
type WidgetSize = [number, number];

export function createRadarWidget(
    id: string,
    position: WidgetPosition,
    size: WidgetSize,
    options: Partial<Omit<RadarWidget, 'type' | 'id' | 'position' | 'size'>> = {},
): RadarWidget {
    return {
        id,
        type: 'radar',
        position,
        size,
        rings: 4,
        sweepSpeed: 0.8,
        blips: [],
        ...options,
    };
}

export function createBarsWidget(
    id: string,
    position: WidgetPosition,
    size: WidgetSize,
    options: Partial<Omit<BarsWidget, 'type' | 'id' | 'position' | 'size'>> = {},
): BarsWidget {
    return {
        id,
        type: 'bars',
        position,
        size,
        orientation: 'vertical',
        items: [],
        ...options,
    };
}

export function createMetricsWidget(
    id: string,
    position: WidgetPosition,
    size: WidgetSize,
    options: Partial<Omit<MetricsWidget, 'type' | 'id' | 'position' | 'size'>> = {},
): MetricsWidget {
    return {
        id,
        type: 'metrics',
        position,
        size,
        columns: 2,
        metrics: [],
        ...options,
    };
}

export function createGlyphWidget(
    id: string,
    position: WidgetPosition,
    size: WidgetSize,
    options: Partial<Omit<GlyphWidget, 'type' | 'id' | 'position' | 'size'>> = {},
): GlyphWidget {
    return {
        id,
        type: 'glyph',
        position,
        size,
        glyph: 'grid',
        intensity: 1,
        ...options,
    };
}

export function createScrollWidget(
    id: string,
    position: WidgetPosition,
    size: WidgetSize,
    options: Partial<Omit<ScrollWidget, 'type' | 'id' | 'position' | 'size'>> = {},
): ScrollWidget {
    return {
        id,
        type: 'scroll',
        position,
        size,
        lines: [],
        speed: 1.2,
        ...options,
    };
}

export function createBadgeWidget(
    id: string,
    position: WidgetPosition,
    size: WidgetSize,
    options: Partial<Omit<BadgeWidget, 'type' | 'id' | 'position' | 'size'>> = {},
): BadgeWidget {
    return {
        id,
        type: 'badge',
        position,
        size,
        label: 'STATUS',
        value: 'ONLINE',
        tone: 'accent',
        ...options,
    };
}

export function assembleWidgets(...widgets: TerminalWidget[]): TerminalWidget[] {
    return widgets;
}
