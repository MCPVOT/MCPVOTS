'use client';

export default function DexScreenerChart() {
    return (
        <div className="w-full h-full flex flex-col">
            {/* Chart Header */}
            <div className="pixel-frame mb-4 p-3 bg-black/50 border-2 border-cyan-400">
                <div className="flex justify-between items-center">
                    <div className="text-sm font-mono text-cyan-400 tracking-widest">
                        VOT / WETH POOL
                    </div>
                    <div className="text-xs font-mono text-green-400">
                        ◉ LIVE
                    </div>
                </div>
            </div>

            {/* Chart Container */}
            <div className="flex-1 pixel-frame p-4 bg-black/50 border-2 border-green-400 overflow-hidden">
                <div className="w-full h-full rounded-sm overflow-hidden">
                    {/* DEXScreener Embed */}
                    <div id="dexscreener-embed" style={{ position: 'relative', width: '100%', paddingBottom: '125%' }}>
                        <iframe
                            src="https://dexscreener.com/base/0xe7f75ea408664f0b416945dece81a49ffb2e8277b878db0ae922fa8f1a2d07f7?embed=1&loadChartSettings=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15"
                            title="VOT Token Trading"
                            className="w-full h-full border-0"
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                top: 0,
                                left: 0,
                                border: 0,
                                minHeight: '400px',
                                backgroundColor: '#000000'
                            }}
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="pixel-frame mt-4 p-3 bg-black/50 border-2 border-orange-400">
                <div className="text-xs font-mono text-orange-400 space-y-1">
                    <div className="flex justify-between">
                        <span>CONTRACT:</span>
                        <span className="text-cyan-300 break-all">0xFB7a83...f6467</span>
                    </div>
                    <div className="flex justify-between">
                        <span>NETWORK:</span>
                        <span className="text-green-400">BASE CHAIN</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
