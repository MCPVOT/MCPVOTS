'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import RetroStatsTicker from './RetroStatsTicker';
import ThreeBackground from './ThreeBackground';
import VOTLogoSVG from './VOTLogoSVG';

interface ServiceData {
  id: string;
  name: string;
  price: string;
  currency: string;
  description: string;
}

// x402 V2 Rarity tiers with VRF-powered distribution (Chainlink VRF v2.5)
const RARITY_TIERS = [
  { name: 'NODE', glyph: '𒇻', sumerian: 'DINGIR', weight: 4500, chance: '45.00%', color: '#00FF88', description: 'Common builder' },
  { name: 'VALIDATOR', glyph: '𒁹', sumerian: 'DIŠ', weight: 2500, chance: '25.00%', color: '#00FFFF', description: 'Verified contributor' },
  { name: 'STAKER', glyph: '𒋼', sumerian: 'TA', weight: 1500, chance: '15.00%', color: '#0088FF', description: 'Protocol staker' },
  { name: 'WHALE', glyph: '𒄠', sumerian: 'AM', weight: 800, chance: '8.00%', color: '#FF8800', description: 'High-volume holder' },
  { name: 'OG', glyph: '𒀭', sumerian: 'AN', weight: 400, chance: '4.00%', color: '#9F7AEA', description: 'Early adopter' },
  { name: 'GENESIS', glyph: '𒆳', sumerian: 'KUR', weight: 200, chance: '2.00%', color: '#FF00FF', description: 'Foundation member' },
  { name: 'ZZZ', glyph: '𒌋', sumerian: 'U', weight: 50, chance: '0.50%', color: '#FF0088', description: 'Legendary sleeper' },
  { name: 'FOMO', glyph: '𒀯', sumerian: 'MUL', weight: 30, chance: '0.30%', color: '#FFFF00', description: 'Fear of missing out' },
  { name: 'GM', glyph: '𒆷', sumerian: 'LA', weight: 15, chance: '0.15%', color: '#FFD700', description: 'Ultra rare greeting' },
  { name: 'X402', glyph: '𒈗', sumerian: 'LUGAL', weight: 5, chance: '0.05%', color: '#FF4500', description: 'Mythic protocol master' },
];

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState<'facilitator' | 'vrf' | 'contracts' | 'roadmap'>('facilitator');
  const [scanProgress, setScanProgress] = useState(0);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/x402/agent-data')
      .then(res => res.json())
      .then(data => {
        if (data.services) {
          setServices(data.services.slice(0, 6));
        }
      })
      .catch(err => console.error('Failed to load agent data:', err));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const lines = [
      '> INITIALIZING X402 V2 FACILITATOR...',
      '> VRF ORACLE: ONLINE (Chainlink VRF v2.5)',
      '> CONNECTING TO BASE MAINNET (8453)...',
      '> FACILITATOR V2: 0x1cAb0052...FE9F21 ✅',
      '> VOT CONTRACT: 0xc1e1E7aD...CA9B07',
      '> BEEPER NFT: 0x5eEe623a...bFB9 (On-Chain SVG)',
      '> TREASURY: 0x824ea259...E7fa',
      '> DEFLATIONARY BURN: ACTIVE (1%)',
      '> PRICE: $0.25 USDC → 69,420 VOT + NFT 🎨'
    ];
    lines.forEach((line, i) => {
      setTimeout(() => {
        setTerminalLines(prev => [...prev, line]);
      }, i * 150);
    });
  }, []);

  return (
    <>
      <ThreeBackground />
      <div className="min-h-screen bg-black text-[#00FFFF] font-mono relative overflow-hidden">
        {/* Retro Stats Ticker - Fixed at top */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <RetroStatsTicker />
        </div>
        
        {/* Scan lines effect */}
        <div className="fixed inset-0 pointer-events-none z-[1] bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,255,255,0.03)_50%)] bg-[size:100%_4px]" />
        <div className="fixed inset-0 pointer-events-none z-[1]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>

        {/* Main content - responsive padding, offset for stats ticker */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-6 py-6 sm:py-12 pt-12 sm:pt-16">
          {/* Header - mobile optimized */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <VOTLogoSVG size={48} animated={true} className="drop-shadow-[0_0_40px_rgba(0,255,255,1)] sm:w-16 sm:h-16" />
                <div>
                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-wider text-[#00FFFF] drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">
                    {'>'} x402 V2 FACILITATOR
                  </h1>
                  <p className="text-xs sm:text-sm text-[#00FF88] uppercase tracking-widest mt-1">
                    VOT REWARDS + VRF RARITY NFTs
                  </p>
                </div>
              </div>
              <Link href="/" className="self-start sm:self-auto px-4 sm:px-6 py-2 sm:py-3 bg-black/80 border-2 border-[#00FFFF]/60 rounded font-mono text-xs uppercase tracking-widest hover:bg-[#00FFFF]/10 hover:border-[#00FFFF] transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_40px_rgba(0,255,255,0.8)] active:scale-95">
                {'<-'} BACK TO MINT
              </Link>
            </div>

            {/* Terminal - mobile optimized */}
            <div className="bg-black/80 border-2 border-[#00FFFF]/40 rounded p-3 sm:p-6 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,255,0.2)] overflow-x-auto">
              {terminalLines.map((line, i) => (
                <div key={i} className="text-[10px] sm:text-xs text-[#00FF88] font-mono mb-1 whitespace-nowrap">{line}</div>
              ))}
              <div className="text-xs text-[#00FF88] animate-pulse inline-block">_</div>
            </div>
          </motion.div>

          {/* Tab Navigation - mobile scrollable with snap */}
          <div className="flex gap-2 sm:gap-4 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-hide">
            {[
              { id: 'facilitator' as const, label: 'x402 V2', mobileLabel: 'V2', icon: '$' },
              { id: 'vrf' as const, label: 'VRF RARITY', mobileLabel: 'VRF', icon: '🎲' },
              { id: 'contracts' as const, label: 'CONTRACTS', mobileLabel: 'ADDR', icon: '@' },
              { id: 'roadmap' as const, label: 'ROADMAP', mobileLabel: 'MAP', icon: '🚀' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex-shrink-0 sm:flex-1 px-3 sm:px-6 py-3 sm:py-4 rounded border-2 font-bold uppercase transition-all text-[11px] sm:text-sm tracking-wider active:scale-95 snap-start touch-manipulation ${
                  activeSection === tab.id
                    ? 'border-[#00FFFF] bg-[#00FFFF]/20 shadow-[0_0_30px_rgba(0,255,255,0.6)] text-[#00FFFF]'
                    : 'border-[#00FFFF]/30 bg-black/50 hover:border-[#00FFFF]/60 text-[#00FFFF]/70'
                }`}
              >
                <span className="mr-1 sm:mr-2">[{tab.icon}]</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.mobileLabel}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* x402 V2 FACILITATOR Section */}
            {activeSection === 'facilitator' && (
              <motion.div key="facilitator" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="space-y-4 sm:space-y-6">
                <div className="bg-black/80 border-2 border-[#FF8800]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(255,136,0,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#FF8800] uppercase tracking-wider">
                    {'>'} x402 V2: $0.25 → 69,420 VOT + NFT
                  </h2>
                  
                  {/* THE CORRECT FLOW - V2 */}
                  <div className="bg-black/60 border-2 border-[#FF8800]/60 rounded p-4 sm:p-6 mb-6 sm:mb-8">
                    <div className="text-base sm:text-lg font-bold text-[#FF8800] mb-4 text-center">
                      SIMPLE: PAY $0.25 USDC → GET 69,420 VOT + VRF RARITY NFT
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                      <div className="bg-black/80 border border-[#00FFFF]/40 rounded p-3 sm:p-4 text-center">
                        <div className="text-2xl sm:text-3xl mb-2">💰</div>
                        <div className="text-[#00FFFF] font-bold text-xs sm:text-sm">YOU PAY</div>
                        <div className="text-white text-lg sm:text-xl font-bold">$0.25 USDC</div>
                        <div className="text-gray-400 text-[10px] sm:text-xs mt-1">Fixed price</div>
                      </div>
                      <div className="bg-black/80 border border-[#00FF88]/40 rounded p-3 sm:p-4 text-center">
                        <div className="text-2xl sm:text-3xl mb-2">🪙</div>
                        <div className="text-[#00FF88] font-bold text-xs sm:text-sm">YOU GET</div>
                        <div className="text-white text-lg sm:text-xl font-bold">69,420 VOT</div>
                        <div className="text-gray-400 text-[10px] sm:text-xs mt-1">Direct to wallet</div>
                      </div>
                      <div className="bg-black/80 border border-[#9F7AEA]/40 rounded p-3 sm:p-4 text-center">
                        <div className="text-2xl sm:text-3xl mb-2">🎲</div>
                        <div className="text-[#9F7AEA] font-bold text-xs sm:text-sm">VRF ROLL</div>
                        <div className="text-white text-lg sm:text-xl font-bold">9 Rarities</div>
                        <div className="text-gray-400 text-[10px] sm:text-xs mt-1">Chainlink VRF</div>
                      </div>
                      <div className="bg-black/80 border border-[#FFD700]/40 rounded p-3 sm:p-4 text-center">
                        <div className="text-2xl sm:text-3xl mb-2">🎨</div>
                        <div className="text-[#FFD700] font-bold text-xs sm:text-sm">ERC-1155 NFT</div>
                        <div className="text-white text-lg sm:text-xl font-bold">Minted</div>
                        <div className="text-gray-400 text-[10px] sm:text-xs mt-1">IPFS + ERC-4804</div>
                      </div>
                    </div>
                  </div>

                  {/* ASCII FLOW - Mobile optimized */}
                  <div className="bg-black/90 rounded p-3 sm:p-6 mb-6 sm:mb-8 overflow-x-auto">
                    <pre className="text-[8px] sm:text-xs text-[#00FF88] font-mono whitespace-pre">
{`╔═══════════════════════════════════════════════════════════════════╗
║                   x402 V2 FACILITATOR FLOW                         ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  USER                    FACILITATOR                   CONTRACT    ║
║    │                         │                             │       ║
║    │  1. Pay $0.25 USDC      │                             │       ║
║    ├────────────────────────>│                             │       ║
║    │                         │                             │       ║
║    │  2. Request VRF         │  (Chainlink VRF v2.5)       │       ║
║    │                         ├────────────────────────────>│       ║
║    │                         │                             │       ║
║    │  3. Random rarity       │                             │       ║
║    │                         │<────────────────────────────┤       ║
║    │                         │                             │       ║
║    │  4. 69,420 VOT sent     │                             │       ║
║    │<────────────────────────┤                             │       ║
║    │                         │                             │       ║
║    │  5. ERC-1155 NFT minted │  (IPFS metadata)            │       ║
║    │<────────────────────────┤                             │       ║
║    │                         │                             │       ║
╚═══════════════════════════════════════════════════════════════════╝`}
                    </pre>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-black/60 border border-[#00FF88]/30 rounded p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-bold text-[#00FF88] mb-3 sm:mb-4">WHY x402 V2?</h3>
                      <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
                        <li className="flex items-start gap-2"><span className="text-[#00FF88]">{'>'}</span> Fixed $0.25 price - no gas estimation needed</li>
                        <li className="flex items-start gap-2"><span className="text-[#00FF88]">{'>'}</span> 69,420 VOT per mint - meme number, real value</li>
                        <li className="flex items-start gap-2"><span className="text-[#00FF88]">{'>'}</span> VRF rarity - true randomness, provably fair</li>
                        <li className="flex items-start gap-2"><span className="text-[#00FF88]">{'>'}</span> ERC-4804 compliant - decentralized web3 URLs</li>
                        <li className="flex items-start gap-2"><span className="text-[#00FF88]">{'>'}</span> IPFS permanent storage - your NFT lives forever</li>
                      </ul>
                    </div>
                    <div className="bg-black/60 border border-[#FF8800]/30 rounded p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-bold text-[#FF8800] mb-3 sm:mb-4">MINT BREAKDOWN</h3>
                      <ul className="space-y-2 text-xs sm:text-sm">
                        <li className="flex justify-between"><span className="text-gray-400">You pay:</span><span className="text-white font-bold">$0.25 USDC</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">VOT received:</span><span className="text-[#00FF88] font-bold">69,420 VOT</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">NFT minted:</span><span className="text-[#9F7AEA] font-bold">ERC-1155</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">Rarity:</span><span className="text-[#FFD700] font-bold">VRF Random</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">Burn:</span><span className="text-gray-500">0% (V2)</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VRF RARITY Section */}
            {activeSection === 'vrf' && (
              <motion.div key="vrf" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="space-y-4 sm:space-y-6">
                <div className="bg-black/80 border-2 border-[#9F7AEA]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(159,122,234,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#9F7AEA] uppercase tracking-wider">
                    {'>'} VRF RARITY SYSTEM: 9 TIERS
                  </h2>
                  
                  <div className="bg-black/60 border-l-4 border-[#9F7AEA] p-4 sm:p-6 mb-6 sm:mb-8">
                    <p className="text-gray-300 text-xs sm:text-sm">
                      Every BeeperNFT mint uses <strong className="text-[#FFD700]">Chainlink VRF v2.5</strong> for 
                      <strong className="text-[#00FFFF]"> provably fair</strong> random rarity selection.
                      No manipulation possible - blockchain-verified randomness!
                    </p>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#9F7AEA] mb-4">⟁ VRF RARITY WEIGHTS (Chainlink VRF v2.5)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {RARITY_TIERS.map((rarity) => (
                      <div 
                        key={rarity.name} 
                        className="bg-black/60 border rounded p-3 sm:p-4 hover:scale-[1.02] transition-all active:scale-95"
                        style={{ borderColor: `${rarity.color}60` }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{rarity.glyph}</span>
                            <div className="text-base sm:text-lg font-bold" style={{ color: rarity.color }}>
                              {rarity.name}
                            </div>
                          </div>
                          <div 
                            className="px-2 py-1 rounded text-xs font-mono font-bold"
                            style={{ backgroundColor: `${rarity.color}20`, color: rarity.color }}
                          >
                            {rarity.chance}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">{rarity.sumerian}</span>
                          <span className="text-gray-400">Weight: {rarity.weight}</span>
                        </div>
                        <div className="text-gray-400 text-xs mt-1">{rarity.description}</div>
                        {/* Progress bar showing rarity */}
                        <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${Math.min(100, parseFloat(rarity.chance) * 2)}%`, 
                              backgroundColor: rarity.color,
                              boxShadow: `0 0 10px ${rarity.color}`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-black/60 border border-[#FFD700]/30 rounded p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-[#FFD700] mb-3 sm:mb-4">🔒 VRF GUARANTEES</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
                        <li className="flex items-start gap-2"><span className="text-[#FFD700]">✓</span> On-chain verifiable randomness</li>
                        <li className="flex items-start gap-2"><span className="text-[#FFD700]">✓</span> Tamper-proof random numbers</li>
                        <li className="flex items-start gap-2"><span className="text-[#FFD700]">✓</span> No backend manipulation possible</li>
                      </ul>
                      <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
                        <li className="flex items-start gap-2"><span className="text-[#FFD700]">✓</span> Chainlink VRF v2.5 subscription</li>
                        <li className="flex items-start gap-2"><span className="text-[#FFD700]">✓</span> Gas-efficient packed structs</li>
                        <li className="flex items-start gap-2"><span className="text-[#FFD700]">✓</span> Auditable rarity distribution</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CONTRACTS Section */}
            {activeSection === 'contracts' && (
              <motion.div key="contracts" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="space-y-4 sm:space-y-6">
                <div className="bg-black/80 border-2 border-[#00FF88]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,136,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#00FF88] uppercase tracking-wider">
                    {'>'} SMART CONTRACTS ON BASE
                  </h2>
                  
                  <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    {[
                      { name: 'X402 Facilitator V2', addr: '0x1cAb00527e16842E61836Dd6E7177D5F1EFE9F21', type: 'x402 Protocol (Audited)', color: '#FF4500' },
                      { name: 'VOT Token', addr: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07', type: 'ERC-20', color: '#00FFFF' },
                      { name: 'MAXX Token', addr: '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467', type: 'ERC-20', color: '#FF8800' },
                      { name: 'Treasury', addr: '0x824ea259d42CC35B95E04f87a9d9C7F2EcF4e7fa', type: 'Multi-sig', color: '#00FF88' },
                      { name: 'USDC', addr: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', type: 'Stablecoin', color: '#2775CA' },
                      { name: 'BeeperNFT V3', addr: '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9', type: 'ERC-1155 + On-Chain SVG', color: '#9F7AEA' },
                    ].map((c) => (
                      <div key={c.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-black/60 border rounded gap-2" style={{ borderColor: `${c.color}40` }}>
                        <div>
                          <div className="font-bold text-sm sm:text-base" style={{ color: c.color }}>{c.name}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">{c.type}</div>
                        </div>
                        <a 
                          href={c.addr.startsWith('0x') ? `https://basescan.org/address/${c.addr}` : '#'}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] sm:text-xs font-mono px-2 sm:px-3 py-1 bg-black/80 rounded hover:bg-white/10 transition-all break-all"
                          style={{ color: c.color }}
                        >
                          {c.addr.startsWith('0x') ? `${c.addr.slice(0, 10)}...${c.addr.slice(-6)}` : c.addr}
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-black/60 border border-[#00FF88]/30 rounded p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-bold text-[#00FF88] mb-3 sm:mb-4">INFRASTRUCTURE</h3>
                      <ul className="space-y-2 text-xs sm:text-sm">
                        <li className="flex justify-between"><span className="text-gray-400">Chain:</span><span className="text-white">Base (8453)</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">Oracle:</span><span className="text-white">Chainlink VRF v2.5</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">NFT Storage:</span><span className="text-[#9F7AEA]">Fully On-Chain SVG</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">ENS Name:</span><span className="text-[#00FFFF]">mcpvot.eth</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">Basename:</span><span className="text-[#00FFFF]">mcpvot.base.eth</span></li>
                      </ul>
                    </div>
                    <div className="bg-black/60 border border-[#9F7AEA]/30 rounded p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-bold text-[#9F7AEA] mb-3 sm:mb-4">STANDARDS</h3>
                      <ul className="space-y-2 text-xs sm:text-sm">
                        <li className="flex justify-between"><span className="text-gray-400">Token:</span><span className="text-white">ERC-20</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">NFT:</span><span className="text-white">ERC-1155</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">Web3 URL:</span><span className="text-white">EIP-4804</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">Agent:</span><span className="text-white">ERC-8004</span></li>
                        <li className="flex justify-between"><span className="text-gray-400">Payment:</span><span className="text-white">x402 V2 Protocol</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ROADMAP Section */}
            {activeSection === 'roadmap' && (
              <motion.div key="roadmap" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="space-y-4 sm:space-y-6">
                {/* Social Bonus Section */}
                <div className="bg-black/80 border-2 border-[#FF00FF]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(255,0,255,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#FF00FF] uppercase tracking-wider">
                    {'>'} 🎁 BONUS: +10,000 VOT
                  </h2>
                  
                  <div className="bg-black/60 border-2 border-[#FF00FF]/60 rounded p-4 sm:p-6 mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-[#FF00FF] mb-4">SOCIAL VERIFICATION BONUS</h3>
                    <p className="text-gray-300 text-xs sm:text-sm mb-4">
                      After minting your BeeperNFT V2, claim an extra <span className="text-[#00FF88] font-bold">10,000 VOT</span> by completing these actions:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-black/60 border border-[#00FF88]/30 rounded p-4">
                        <div className="text-[#00FF88] font-bold mb-2">1. FOLLOW @MCPVOT</div>
                        <p className="text-xs text-gray-400">Follow our Farcaster account to stay updated</p>
                        <div className="text-[#FFD700] font-bold mt-2">+5,000 VOT</div>
                      </div>
                      <div className="bg-black/60 border border-[#00FFFF]/30 rounded p-4">
                        <div className="text-[#00FFFF] font-bold mb-2">2. SHARE YOUR MINT</div>
                        <p className="text-xs text-gray-400">Cast about your mint on Warpcast</p>
                        <div className="text-[#FFD700] font-bold mt-2">+5,000 VOT</div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-black/40 border border-[#FFD700]/30 rounded">
                      <p className="text-xs text-[#FFD700]">
                        ⚡ Complete both actions to receive the full <span className="font-bold">10,000 VOT bonus!</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* ENS + VOT Machine Future Plans */}
                <div className="bg-black/80 border-2 border-[#5298FF]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(82,152,255,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#5298FF] uppercase tracking-wider">
                    {'>'} 🌐 ENS + VOT MACHINE ROADMAP
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Phase 1 - Current */}
                    <div className="bg-black/60 border-l-4 border-[#00FF88] rounded p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#00FF88] font-bold">✅ PHASE 1: BASE MAINNET</span>
                        <span className="text-xs bg-[#00FF88]/20 text-[#00FF88] px-2 py-0.5 rounded">LIVE</span>
                      </div>
                      <ul className="text-xs text-gray-400 space-y-1 ml-4">
                        <li>• VOT & MAXX tokens on Base (8453)</li>
                        <li>• BeeperNFT V3: VRF rarity + On-Chain SVG (ERC-4804)</li>
                        <li>• Farcaster Mini-App integration</li>
                        <li>• mcpvot.base.eth Basename</li>
                        <li>• x402 V2 Facilitator Protocol</li>
                      </ul>
                    </div>

                    {/* Phase 2 - VOT Machine */}
                    <div className="bg-black/60 border-l-4 border-[#FF8800] rounded p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#FF8800] font-bold">🔜 PHASE 2: VOT MACHINE NFT</span>
                        <span className="text-xs bg-[#FF8800]/20 text-[#FF8800] px-2 py-0.5 rounded">Q1 2025</span>
                      </div>
                      <ul className="text-xs text-gray-400 space-y-1 ml-4">
                        <li>• <span className="text-[#FF8800]">VOT Machine</span>: Animated HTML landing pages as NFTs</li>
                        <li>• Full cyberpunk boot sequence + data rain matrix</li>
                        <li>• LLM-generated unique taglines per mint</li>
                        <li>• 6 trait categories: warplet, tokenomics, agent, dapp, protocol, defi</li>
                        <li>• IPFS permanent storage (1500+ lines HTML per NFT)</li>
                        <li>• ENS subdomain per token: <span className="text-[#5298FF]">[tokenId].mcpvot.eth</span></li>
                      </ul>
                    </div>

                    {/* Phase 3 - ENS CCIP-Read */}
                    <div className="bg-black/60 border-l-4 border-[#5298FF] rounded p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#5298FF] font-bold">� PHASE 3: ENS + CCIP-READ</span>
                        <span className="text-xs bg-[#5298FF]/20 text-[#5298FF] px-2 py-0.5 rounded">Q2 2025</span>
                      </div>
                      <ul className="text-xs text-gray-400 space-y-1 ml-4">
                        <li>• <span className="text-[#5298FF]">mcpvot.eth</span> ENS on L1 Ethereum</li>
                        <li>• Wildcard resolver: <span className="text-[#00FFFF]">*.mcpvot.eth</span> → NFT pages</li>
                        <li>• CCIP-Read (EIP-3668) for L2→L1 resolution</li>
                        <li>• <span className="text-[#FFD700]">web3://180.mcpvot.eth</span> → Full HTML page</li>
                        <li>• Unruggable Gateway for trustless Base storage proofs</li>
                        <li>• Cross-chain VOT bridging (Base ↔ Ethereum)</li>
                      </ul>
                    </div>

                    {/* Phase 4 - ERC-4804 */}
                    <div className="bg-black/60 border-l-4 border-[#9F7AEA] rounded p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#9F7AEA] font-bold">� PHASE 4: ERC-4804 WEB3://</span>
                        <span className="text-xs bg-[#9F7AEA]/20 text-[#9F7AEA] px-2 py-0.5 rounded">Q3 2025</span>
                      </div>
                      <ul className="text-xs text-gray-400 space-y-1 ml-4">
                        <li>• Full ERC-4804 compliance for decentralized web</li>
                        <li>• Smart contract serves HTML via <span className="text-[#9F7AEA]">web3://</span> protocol</li>
                        <li>• NFT holders own their subdomain + landing page</li>
                        <li>• Decentralized identity: address → ENS → content</li>
                        <li>• MCP Server integration for AI agent discovery</li>
                      </ul>
                    </div>

                    {/* Phase 5 - Multi-chain */}
                    <div className="bg-black/60 border-l-4 border-[#FFD700] rounded p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#FFD700] font-bold">🌍 PHASE 5: MULTI-CHAIN DAO</span>
                        <span className="text-xs bg-[#FFD700]/20 text-[#FFD700] px-2 py-0.5 rounded">2026</span>
                      </div>
                      <ul className="text-xs text-gray-400 space-y-1 ml-4">
                        <li>• Polygon, Arbitrum, Optimism deployment</li>
                        <li>• Unified VOT liquidity across chains</li>
                        <li>• DAO governance with VOT voting power</li>
                        <li>• Treasury management by community</li>
                        <li>• Agent marketplace with x402 payments</li>
                      </ul>
                    </div>
                  </div>

                  {/* ENS Architecture Preview */}
                  <div className="mt-6 bg-black/90 rounded p-3 sm:p-6 overflow-x-auto">
                    <h3 className="text-sm font-bold text-[#5298FF] mb-3">ENS + CCIP-READ ARCHITECTURE</h3>
                    <pre className="text-[8px] sm:text-xs text-[#00FF88] font-mono whitespace-pre">
{`┌──────────────────────────────────────────────────────────────────┐
│                    VOT MACHINE RESOLUTION                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  web3://180.mcpvot.eth                                           │
│         │                                                         │
│         ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ ENS Registry (L1) → Wildcard Resolver                    │     │
│  │                                                          │     │
│  │ resolve("180.mcpvot.eth")                               │     │
│  │         │                                                │     │
│  │         ▼                                                │     │
│  │ revert OffchainLookup(urls, calldata, callback)         │     │
│  └─────────────────────────────────────────────────────────┘     │
│         │                                                         │
│         ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ CCIP-Read Gateway (api.mcpvot.xyz)                       │     │
│  │ → Query Base L2 for NFT #180 metadata                    │     │
│  │ → Return IPFS contenthash with storage proof             │     │
│  └─────────────────────────────────────────────────────────┘     │
│         │                                                         │
│         ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ IPFS: QmXxxHtmlPage...                                   │     │
│  │ → Full 1500+ line cyberpunk HTML page                    │     │
│  │ → Boot sequence, data rain, identity banner              │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘`}
                    </pre>
                  </div>
                </div>

                {/* AI Integration */}
                <div className="bg-black/80 border-2 border-[#FF8800]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(255,136,0,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#FF8800] uppercase tracking-wider">
                    {'>'} 🤖 AI AGENT ECOSYSTEM
                  </h2>
                  <p className="text-gray-300 text-xs sm:text-sm mb-4">Powered by FREE OpenRouter models + MCP Server:</p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { name: 'MiMo-V2-Flash', badge: 'PRIMARY', color: '#00FF88' },
                      { name: 'Devstral 2', badge: 'BACKUP', color: '#00FFFF' },
                      { name: 'DeepSeek V3.1', badge: 'BACKUP', color: '#9F7AEA' },
                      { name: 'KAT-Coder-Pro', badge: 'BACKUP', color: '#FF8800' },
                    ].map((m) => (
                      <div key={m.name} className="bg-black/60 border border-gray-700 rounded p-2 text-xs">
                        <span style={{ color: m.color }}>{m.name}</span>
                        <span className={`ml-2 px-1 py-0.5 rounded text-[10px] ${m.badge === 'PRIMARY' ? 'bg-[#00FF88]/20 text-[#00FF88]' : 'bg-gray-700 text-gray-400'}`}>{m.badge}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-black/60 border border-[#00FFFF]/30 rounded p-4">
                    <h3 className="text-sm font-bold text-[#00FFFF] mb-2">MCP MEMORY SERVER</h3>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• SQLite-based vector memory for AI context</li>
                      <li>• IPFS integration for decentralized storage</li>
                      <li>• Neynar API for Farcaster intelligence</li>
                      <li>• x402 payment tracking & analytics</li>
                    </ul>
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="bg-black/80 border-2 border-[#00FFFF]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                  <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-[#00FFFF] uppercase tracking-wider">
                    {'>'} ⚡ TECH STACK
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-black/60 border border-gray-700 rounded p-3 text-center">
                      <div className="text-lg mb-1">⛓️</div>
                      <div className="text-xs text-gray-400">Chain</div>
                      <div className="text-white font-bold text-sm">Base (8453)</div>
                    </div>
                    <div className="bg-black/60 border border-gray-700 rounded p-3 text-center">
                      <div className="text-lg mb-1">🎲</div>
                      <div className="text-xs text-gray-400">Oracle</div>
                      <div className="text-white font-bold text-sm">Chainlink VRF</div>
                    </div>
                    <div className="bg-black/60 border border-gray-700 rounded p-3 text-center">
                      <div className="text-lg mb-1">📦</div>
                      <div className="text-xs text-gray-400">Storage</div>
                      <div className="text-white font-bold text-sm">IPFS</div>
                    </div>
                    <div className="bg-black/60 border border-gray-700 rounded p-3 text-center">
                      <div className="text-lg mb-1">🌐</div>
                      <div className="text-xs text-gray-400">Identity</div>
                      <div className="text-white font-bold text-sm">ENS + Basename</div>
                    </div>
                    <div className="bg-black/60 border border-gray-700 rounded p-3 text-center">
                      <div className="text-lg mb-1">🎨</div>
                      <div className="text-xs text-gray-400">NFT</div>
                      <div className="text-white font-bold text-sm">ERC-1155</div>
                    </div>
                    <div className="bg-black/60 border border-gray-700 rounded p-3 text-center">
                      <div className="text-lg mb-1">🔗</div>
                      <div className="text-xs text-gray-400">Web3 URL</div>
                      <div className="text-white font-bold text-sm">ERC-4804</div>
                    </div>
                    <div className="bg-black/60 border border-gray-700 rounded p-3 text-center">
                      <div className="text-lg mb-1">🤖</div>
                      <div className="text-xs text-gray-400">Agent</div>
                      <div className="text-white font-bold text-sm">ERC-8004</div>
                    </div>
                    <div className="bg-black/60 border border-gray-700 rounded p-3 text-center">
                      <div className="text-lg mb-1">💳</div>
                      <div className="text-xs text-gray-400">Payment</div>
                      <div className="text-white font-bold text-sm">x402 V2</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Protocol Links - Mobile optimized */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 sm:mt-12">
            <div className="bg-black/80 border-2 border-[#00FFFF]/40 rounded p-4 sm:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,255,0.2)]">
              <h3 className="text-base sm:text-xl font-bold text-[#00FFFF] mb-4 sm:mb-6 uppercase tracking-wider">{'>'} PROTOCOL LINKS</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <a href="https://github.com/MCPVOT" target="_blank" rel="noopener noreferrer" className="block px-3 sm:px-4 py-2 sm:py-3 bg-black/60 border border-[#9F7AEA]/60 rounded text-center text-[#9F7AEA] hover:border-[#9F7AEA] hover:shadow-[0_0_20px_rgba(159,122,234,0.5)] transition-all text-xs sm:text-sm active:scale-95">GitHub</a>
                <a href="https://basescan.org/address/0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07" target="_blank" rel="noopener noreferrer" className="block px-3 sm:px-4 py-2 sm:py-3 bg-black/60 border border-[#00FFFF]/60 rounded text-center text-[#00FFFF] hover:border-[#00FFFF] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all text-xs sm:text-sm active:scale-95">VOT Contract</a>
                <a href="/.well-known/agent-registration.json" target="_blank" rel="noopener noreferrer" className="block px-3 sm:px-4 py-2 sm:py-3 bg-black/60 border border-[#00FF88]/60 rounded text-center text-[#00FF88] hover:border-[#00FF88] hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] transition-all text-xs sm:text-sm active:scale-95">Agent Registry</a>
                <a href="/docs/x402" target="_blank" rel="noopener noreferrer" className="block px-3 sm:px-4 py-2 sm:py-3 bg-black/60 border border-[#FF8800]/60 rounded text-center text-[#FF8800] hover:border-[#FF8800] hover:shadow-[0_0_20px_rgba(255,136,0,0.5)] transition-all text-xs sm:text-sm active:scale-95">x402 Docs</a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scan line animation */}
        <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent opacity-50 pointer-events-none" style={{ transform: `translateY(${scanProgress * 10}px)` }} />
      </div>
    </>
  );
}
