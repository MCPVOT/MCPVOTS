'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function ArchitecturePage() {
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    const lines = [
      '> INITIALIZING MCPVOT ARCHITECTURE SCAN...',
      '> LOADING ZERO POINT FAILURE TOPOLOGY...',
      '> AI LAYER: ONLINE (OpenRouter Gateway)',
      '> PAYMENT LAYER: x402 FACILITATOR ACTIVE',
      '> STORAGE LAYER: IPFS/PINATA CONNECTED',
      '> MCP SERVERS: 4 NODES SYNCHRONIZED',
      '> ARCHITECTURE DOCUMENTATION: READY'
    ];
    lines.forEach((line, i) => {
      setTimeout(() => {
        setTerminalLines(prev => [...prev, line]);
      }, i * 120);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-[#00FFFF] font-mono relative overflow-hidden">
      {/* CRT Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,255,255,0.03)_50%)] bg-[size:100%_4px]" />
      
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Scan line effect */}
      <div 
        className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent opacity-50 pointer-events-none z-50" 
        style={{ transform: `translateY(${scanProgress * 10}px)` }} 
      />

      <div className="relative z-10 space-y-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold uppercase tracking-wider text-[#00FFFF] drop-shadow-[0_0_20px_rgba(0,255,255,0.8)] mb-2">
            {'>'} SYSTEM ARCHITECTURE
          </h1>
          <p className="text-sm text-[#00FF88] uppercase tracking-widest">
            ZERO POINT OF FAILURE (ZPF) ECOSYSTEM TOPOLOGY
          </p>
        </motion.div>

        {/* Terminal Boot */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="bg-black/80 border-2 border-[#00FFFF]/40 rounded p-6 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,255,0.2)]"
        >
          {terminalLines.map((line, i) => (
            <div key={i} className="text-xs text-[#00FF88] font-mono mb-1">{line}</div>
          ))}
          <div className="text-xs text-[#00FF88] animate-pulse inline-block">_</div>
        </motion.div>

        {/* System Overview ASCII */}
        <motion.section 
          initial={{ opacity: 0, x: -50 }} 
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-[#00FFFF] uppercase tracking-wider">
            {'>'} SYSTEM TOPOLOGY
          </h2>
          <div className="bg-black/90 border-2 border-[#00FFFF]/40 rounded p-6 overflow-x-auto shadow-[0_0_30px_rgba(0,255,255,0.2)]">
            <pre className="text-[10px] sm:text-xs text-[#00FF88] font-mono whitespace-pre">
{`╔═══════════════════════════════════════════════════════════════════════════════════╗
║                           MCPVOT ECOSYSTEM ARCHITECTURE                           ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║            ┌──────────────────────────────────────────────────────┐               ║
║            │                    USER INTERFACE                     │               ║
║            │     [FARCASTER MINI-APP] ◄──► [WEB DASHBOARD]        │               ║
║            └───────────────────────┬──────────────────────────────┘               ║
║                                    │                                              ║
║                                    ▼                                              ║
║  ╔═════════════════╗    ╔═════════════════════╗    ╔═════════════════════════╗   ║
║  ║   AI LAYER      ║    ║   PAYMENT LAYER     ║    ║   STORAGE LAYER         ║   ║
║  ╠═════════════════╣    ╠═════════════════════╣    ╠═════════════════════════╣   ║
║  ║ OpenRouter API  ║    ║  x402 Facilitator   ║    ║   IPFS / Pinata         ║   ║
║  ║ KAT-Coder-Pro   ║◄──►║  VOT Token (Base)   ║◄──►║   On-chain Metadata     ║   ║
║  ║ Fallback Chain  ║    ║  1% BURN Protocol   ║    ║   CID References        ║   ║
║  ╚════════╤════════╝    ╚═════════╤═══════════╝    ╚════════════╤════════════╝   ║
║           │                       │                              │                ║
║           └───────────────────────┼──────────────────────────────┘                ║
║                                   │                                               ║
║                                   ▼                                               ║
║            ╔══════════════════════════════════════════════════════╗               ║
║            ║               MCP SERVER CLUSTER                     ║               ║
║            ╠══════════════════════════════════════════════════════╣               ║
║            ║  [maxx-memory]  [ipfs-mcp]  [neynar]  [vercel]      ║               ║
║            ║   Vector DB      Storage    Farcaster  Deploy        ║               ║
║            ╚══════════════════════════════════════════════════════╝               ║
║                                   │                                               ║
║                                   ▼                                               ║
║            ╔══════════════════════════════════════════════════════╗               ║
║            ║            BASE NETWORK (Chain ID: 8453)             ║               ║
║            ║     [VOT Contract] [Treasury] [LP Pool] [NFTs]       ║               ║
║            ╚══════════════════════════════════════════════════════╝               ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝`}
            </pre>
          </div>
        </motion.section>

        {/* Core Components */}
        <motion.section 
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-[#00FFFF] uppercase tracking-wider">
            {'>'} CORE COMPONENTS
          </h2>
          
          <div className="grid gap-4">
            {/* VOT Token */}
            <div className="bg-black/80 border-2 border-[#00FFFF]/40 rounded p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,255,0.15)] hover:shadow-[0_0_40px_rgba(0,255,255,0.3)] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#00FFFF] mb-2">[$] VOT TOKEN</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Ecosystem utility token deployed via Clanker on Base.
                  </p>
                </div>
                <span className="text-3xl">🪙</span>
              </div>
              <ul className="text-sm text-[#00FF88] space-y-1 mb-3">
                <li>{'>'} 1 Billion total supply (no inflation)</li>
                <li>{'>'} 1% burn on every x402 transaction</li>
                <li>{'>'} Clanker LP with auto rewards</li>
                <li>{'>'} Rank system: Ghost → Singularity</li>
              </ul>
              <code className="text-xs text-[#00FFFF]/60 font-mono">
                0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07
              </code>
            </div>

            {/* x402 Facilitator */}
            <div className="bg-black/80 border-2 border-[#FF8800]/40 rounded p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(255,136,0,0.15)] hover:shadow-[0_0_40px_rgba(255,136,0,0.3)] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#FF8800] mb-2">[x] x402 FACILITATOR</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    ERC-8004 payment gateway enabling AI agent micro-payments.
                  </p>
                </div>
                <span className="text-3xl">🔐</span>
              </div>
              <ul className="text-sm text-[#FF8800] space-y-1 mb-3">
                <li>{'>'} Proxy at x402-proxy.t54.ai</li>
                <li>{'>'} Service discovery via agent-registration.json</li>
                <li>{'>'} Payment verification and routing</li>
                <li>{'>'} 1% VOT burn on each transaction</li>
              </ul>
            </div>

            {/* MCP Servers */}
            <div className="bg-black/80 border-2 border-[#00FF88]/40 rounded p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,136,0.15)] hover:shadow-[0_0_40px_rgba(0,255,136,0.3)] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#00FF88] mb-2">[#] MCP SERVERS</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Model Context Protocol servers for AI tool integration.
                  </p>
                </div>
                <span className="text-3xl">🧠</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-black/60 border border-[#00FF88]/30 rounded p-2">
                  <span className="text-[#00FF88] font-bold">maxx-memory</span>
                  <span className="text-gray-500 text-xs block">Vector Store</span>
                </div>
                <div className="bg-black/60 border border-[#00FF88]/30 rounded p-2">
                  <span className="text-[#00FF88] font-bold">ipfs-mcp</span>
                  <span className="text-gray-500 text-xs block">Storage</span>
                </div>
                <div className="bg-black/60 border border-[#00FF88]/30 rounded p-2">
                  <span className="text-[#00FF88] font-bold">neynar</span>
                  <span className="text-gray-500 text-xs block">Farcaster</span>
                </div>
                <div className="bg-black/60 border border-[#00FF88]/30 rounded p-2">
                  <span className="text-[#00FF88] font-bold">vercel</span>
                  <span className="text-gray-500 text-xs block">Deploy</span>
                </div>
              </div>
            </div>

            {/* MAXX Token */}
            <div className="bg-black/80 border-2 border-[#FFFF00]/40 rounded p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,0,0.15)] hover:shadow-[0_0_40px_rgba(255,255,0,0.3)] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#FFFF00] mb-2">[M] MAXX TOKEN</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    OG ecosystem token with established liquidity and community.
                  </p>
                </div>
                <span className="text-3xl">💎</span>
              </div>
              <ul className="text-sm text-[#FFFF00] space-y-1 mb-3">
                <li>{'>'} Multi-chain (ETH, Base, Blast)</li>
                <li>{'>'} Burn mechanisms via staking contracts</li>
                <li>{'>'} Treasury allocation</li>
              </ul>
              <code className="text-xs text-[#FFFF00]/60 font-mono">
                0xFB7a83abe4F4A4E51c77B92E521390B769ff6467
              </code>
            </div>
          </div>
        </motion.section>

        {/* Data Flow */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-[#00FFFF] uppercase tracking-wider">
            {'>'} NFT GENERATION FLOW
          </h2>
          <div className="bg-black/80 border-2 border-[#00FFFF]/40 rounded p-6 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,255,0.2)]">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {[
                { step: '01', title: 'CONNECT', desc: 'Farcaster Mini-App', color: '#00FFFF' },
                { step: '02', title: 'FETCH', desc: 'Profile via Neynar', color: '#00FF88' },
                { step: '03', title: 'CHECK', desc: 'VOT balance (Base)', color: '#FFFF00' },
                { step: '04', title: 'GENERATE', desc: 'AI uniqueness', color: '#FF8800' },
                { step: '05', title: 'BUILD', desc: 'HTML + Profile', color: '#00FFFF' },
                { step: '06', title: 'PIN', desc: 'IPFS via Pinata', color: '#00FF88' },
                { step: '07', title: 'MINT', desc: 'ERC-1155 NFT', color: '#FF0088' },
              ].map((item) => (
                <div 
                  key={item.step} 
                  className="bg-black/60 border rounded p-3 text-center hover:scale-105 transition-transform"
                  style={{ borderColor: `${item.color}60` }}
                >
                  <div className="text-xs opacity-60 mb-1" style={{ color: item.color }}>{item.step}</div>
                  <div className="text-sm font-bold" style={{ color: item.color }}>{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Tech Stack */}
        <motion.section 
          initial={{ opacity: 0, x: -50 }} 
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-[#00FFFF] uppercase tracking-wider">
            {'>'} TECH STACK
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { name: 'Next.js 15', color: '#00FFFF' },
              { name: 'TypeScript', color: '#00FF88' },
              { name: 'Tailwind', color: '#00FFFF' },
              { name: 'Viem', color: '#FF8800' },
              { name: 'Wagmi', color: '#FF0088' },
              { name: 'Base L2', color: '#0052FF' },
              { name: 'OpenRouter', color: '#00FF88' },
              { name: 'IPFS', color: '#FFFF00' },
              { name: 'Farcaster', color: '#00FFFF' },
              { name: 'MCP', color: '#FF8800' },
              { name: 'SQLite', color: '#00FFFF' },
              { name: 'Vercel', color: '#FFFFFF' },
            ].map(({ name, color }) => (
              <div 
                key={name} 
                className="bg-black/60 border rounded p-3 text-center hover:scale-105 transition-transform"
                style={{ borderColor: `${color}40` }}
              >
                <span className="font-bold text-sm" style={{ color }}>{name}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* API Architecture */}
        <motion.section 
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-[#00FFFF] uppercase tracking-wider">
            {'>'} API ENDPOINTS
          </h2>
          <div className="bg-black/90 border-2 border-[#00FF88]/40 rounded p-6 overflow-x-auto shadow-[0_0_30px_rgba(0,255,136,0.2)]">
            <pre className="text-xs text-[#00FF88] font-mono whitespace-pre">
{`/api
├── /x402
│   ├── /agent-data      # Service discovery
│   ├── /balance         # Facilitator balance
│   └── /nft-metadata    # NFT metadata
│
├── /machine
│   ├── /ai              # Profile analysis
│   └── /generate        # HTML generation
│
├── /svg-machine
│   └── /generate        # SVG templates
│
├── /openrouter          # Direct LLM access
│
├── /farcaster
│   └── /user            # Farcaster data
│
└── /ipfs
    └── /pin             # IPFS pinning`}
            </pre>
          </div>
        </motion.section>

        {/* Zero Point of Failure */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-[#FF8800] uppercase tracking-wider">
            {'>'} ZERO POINT OF FAILURE (ZPF)
          </h2>
          <p className="text-gray-400 text-sm">
            The ecosystem is designed with multiple redundancy layers:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '🔄', title: 'MULTI-LLM FALLBACK', desc: 'Primary → Secondary → Tertiary model chain ensures AI always responds', color: '#00FFFF' },
              { icon: '📦', title: 'DISTRIBUTED STORAGE', desc: 'IPFS + Pinata ensures content availability even if nodes go offline', color: '#00FF88' },
              { icon: '⛓️', title: 'ON-CHAIN STATE', desc: 'Critical state stored on Base L2 - immutable and always available', color: '#FF8800' },
              { icon: '🧠', title: 'LOCAL MEMORY CACHE', desc: 'SQLite vector store provides fast local access with blockchain sync', color: '#FFFF00' },
            ].map(({ icon, title, desc, color }) => (
              <div 
                key={title} 
                className="bg-black/80 border-2 rounded p-5 hover:scale-[1.02] transition-transform"
                style={{ borderColor: `${color}40`, boxShadow: `0 0 20px ${color}15` }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{icon}</span>
                  <div>
                    <h3 className="font-bold" style={{ color }}>{title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Contract Addresses */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-[#00FF88] uppercase tracking-wider">
            {'>'} CONTRACT ADDRESSES
          </h2>
          <div className="bg-black/80 border-2 border-[#00FF88]/40 rounded overflow-hidden shadow-[0_0_30px_rgba(0,255,136,0.2)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#00FF88]/10 border-b border-[#00FF88]/30">
                  <tr>
                    <th className="text-left p-4 text-[#00FF88] font-bold uppercase tracking-wider">Contract</th>
                    <th className="text-left p-4 text-[#00FF88] font-bold uppercase tracking-wider">Network</th>
                    <th className="text-left p-4 text-[#00FF88] font-bold uppercase tracking-wider">Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#00FF88]/20">
                  {[
                    { name: 'VOT Token', network: 'Base', addr: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07', color: '#00FFFF' },
                    { name: 'VOT Treasury', network: 'Base', addr: '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa', color: '#00FF88' },
                    { name: 'MAXX Token', network: 'ETH', addr: '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467', color: '#FFFF00' },
                    { name: 'Clanker LP', network: 'Base', addr: '0x12893E3c01bEe2c0B4F7D9C3b5e26ca6a8DAEa13', color: '#FF8800' },
                  ].map((c) => (
                    <tr key={c.name} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold" style={{ color: c.color }}>{c.name}</td>
                      <td className="p-4 text-gray-400">{c.network}</td>
                      <td className="p-4">
                        <a 
                          href={`https://basescan.org/address/${c.addr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs hover:underline"
                          style={{ color: c.color }}
                        >
                          {c.addr}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
