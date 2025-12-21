import type { TerminalPalette } from './types';

interface PaletteLibraryEntry extends TerminalPalette {
    source: string;
}

const PALETTE_LIBRARY: Record<string, PaletteLibraryEntry> = {
    'warplet-core': {
        name: 'Warplet Core',
        background: '#03121f',
        grid: '#0d2f44',
        primary: '#00f6ff',
        secondary: '#ff6be6',
        text: '#8cfffb',
        alert: '#ffb347',
        glow: '#48fbe6',
        source: 'warplet_VOT.png',
    },
    'farcaster-oracle': {
        name: 'Farcaster Oracle',
        background: '#160021',
        grid: '#2f0a4a',
        primary: '#ff4de6',
        secondary: '#ffbf40',
        text: '#72f6ff',
        alert: '#ff5f5f',
        glow: '#b244ff',
        source: 'videoframe_4307.png',
    },
    'base-singularity': {
        name: 'Base Singularity',
        background: '#021224',
        grid: '#0b2f4d',
        primary: '#2bd9ff',
        secondary: '#ffc94d',
        text: '#a8ebff',
        alert: '#ff5f5f',
        glow: '#32ffe1',
        source: '3667e4a898f671357e7f9bab32f28c36.jpg',
    },
    'neynar-resonance': {
        name: 'Neynar Resonance',
        background: '#080222',
        grid: '#1d1160',
        primary: '#6a5bff',
        secondary: '#00ffd1',
        text: '#c6b8ff',
        alert: '#ff5f9c',
        glow: '#7c6bff',
        source: 'videoframe_6394.png',
    },
    'legendary-command': {
        name: 'Legendary Command Core',
        background: '#01070f',
        grid: '#12263a',
        primary: '#00f0ff',
        secondary: '#ff8900',
        text: '#f6faff',
        alert: '#ff4545',
        glow: '#35f3ff',
        source: '0e4c410c2d8e21c794a0678f2d593496.jpg',
    },
    'elite-telemetry': {
        name: 'Elite Telemetry',
        background: '#050a13',
        grid: '#1a2737',
        primary: '#ff8800',
        secondary: '#00ffd5',
        text: '#ffe7c2',
        alert: '#ff5454',
        glow: '#ffb347',
        source: '168fbf466c25de2e107a92e25e1ac294.jpg',
    },
    'vanguard-ops': {
        name: 'Vanguard Ops Bay',
        background: '#02111c',
        grid: '#123244',
        primary: '#3cf4ff',
        secondary: '#ff4b90',
        text: '#ffffff',
        alert: '#ff5353',
        glow: '#33ffd9',
        source: '929615c954a2cf00e473f5ea9da565e7.jpg',
    },
    'recon-scout': {
        name: 'Recon Scout',
        background: '#041522',
        grid: '#143346',
        primary: '#8affff',
        secondary: '#ff9afc',
        text: '#c5fff7',
        alert: '#ff5050',
        glow: '#55ffe3',
        source: 'd6cce0e6d05700c76f17c2d9ab246e3e.jpg',
    },
    'epic-core': {
        name: 'EPIC Command Module',
        background: '#1a0a00',
        grid: '#3d2610',
        primary: '#ff9d00',
        secondary: '#ffbb00',
        text: '#ffe8c2',
        alert: '#ff4545',
        glow: '#ffaa33',
        source: 'epic_command.jpg',
    },
    'mcpvot-core': {
        name: 'MCPVOT Protocol Core',
        background: '#001a1a',
        grid: '#0a3d3d',
        primary: '#00ffdd',
        secondary: '#00ddff',
        text: '#c2fff7',
        alert: '#ff5f5f',
        glow: '#33ffe8',
        source: 'mcpvot_protocol.jpg',
    },
};

export function getPalette(key: string): TerminalPalette {
    const entry = PALETTE_LIBRARY[key];
    if (!entry) {
        throw new Error(`Palette "${key}" not found in library`);
    }
    return {
        name: entry.name,
        background: entry.background,
        grid: entry.grid,
        primary: entry.primary,
        secondary: entry.secondary,
        text: entry.text,
        alert: entry.alert,
        glow: entry.glow,
    };
}

export function listPalettes(): PaletteLibraryEntry[] {
    return Object.values(PALETTE_LIBRARY);
}
