'use client';


interface GameEntityProps {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    image?: string;
    type?: 'enemy' | 'ally';
}

export function GameEntity({
    name,
    level,
    hp,
    maxHp,
    atk,
    def
}: GameEntityProps) {
    const hpPercent = (hp / maxHp) * 100; return (
        <div className="entity-card">
            <div className="entity-card__header">
                <div className="entity-card__name">{name}</div>
                <div className="entity-card__level">LV.{level}</div>
            </div>

            {/* HP Bar */}
            <div>
                <div className="text-xs text-cyan-400/70 mb-1 uppercase tracking-widest">HP</div>
                <div className="health-bar">
                    <div
                        className={`health-bar__fill ${hpPercent < 25 ? 'health-bar__fill--critical' : hpPercent < 50 ? 'health-bar__fill--warning' : ''}`}
                        style={{ width: `${hpPercent}%` }}
                    />
                </div>
                <div className="text-xs text-cyan-300 text-right">{hp}/{maxHp}</div>
            </div>

            {/* Stats Grid */}
            <div className="entity-card__stats">
                <div className="entity-card__stat">
                    <div className="entity-card__stat-label">ATK</div>
                    <div className="entity-card__stat-value">{atk}</div>
                </div>
                <div className="entity-card__stat">
                    <div className="entity-card__stat-label">DEF</div>
                    <div className="entity-card__stat-value">{def}</div>
                </div>
            </div>
        </div>
    );
}

export function RetroDataPanel() {
    return (
        <div className="game-panel">
            <div className="game-panel__title">📊 TELEMETRY PANEL</div>
            <div className="space-y-2">
                <div className="game-panel__stat">
                    <span className="game-panel__stat-label">UPTIME:</span>
                    <span className="game-panel__stat-value">99.98%</span>
                </div>
                <div className="game-panel__stat">
                    <span className="game-panel__stat-label">LATENCY:</span>
                    <span className="game-panel__stat-value">42ms</span>
                </div>
                <div className="game-panel__stat">
                    <span className="game-panel__stat-label">THROUGHPUT:</span>
                    <span className="game-panel__stat-value">8.4 MB/s</span>
                </div>
                <div className="game-panel__stat">
                    <span className="game-panel__stat-label">NODES ACTIVE:</span>
                    <span className="game-panel__stat-value">247</span>
                </div>
            </div>
        </div>
    );
}

export function RetroActionGrid() {
    const actions = [
        { icon: '📊', label: 'ANALYZE' },
        { icon: '�', label: 'CONNECT' },
        { icon: '�', label: 'TRADE' },
        { icon: '🎯', label: 'MISSION' },
        { icon: '�', label: 'CAST' },
        { icon: '⚡', label: 'BOOST' },
    ];

    return (
        <div className="space-y-2">
            <div className="text-sm text-cyan-400 uppercase tracking-widest">AVAILABLE ACTIONS</div>
            <div className="grid grid-cols-3 gap-2">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        className="pixel-button text-center py-2 h-14 sm:h-16 flex flex-col items-center justify-center hover:bg-cyan-500/30 transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px] touch-manipulation"
                    >
                        <div className="text-lg sm:text-xl mb-1">{action.icon}</div>
                        <div className="text-[0.65rem] sm:text-xs font-bold">{action.label}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export function PixelDataGrid() {
    const data = [
        { label: 'BLOCK', value: '19284756' },
        { label: 'GAS', value: '42 GWEI' },
        { label: 'NETWORK', value: 'BASE' },
        { label: 'STATUS', value: 'ONLINE' },
    ];

    return (
        <div className="data-grid">
            {data.map((item) => (
                <div key={item.label} className="data-cell">
                    <div className="data-cell__label">{item.label}</div>
                    <div className="data-cell__value">{item.value}</div>
                </div>
            ))}
        </div>
    );
}
