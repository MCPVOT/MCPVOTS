'use client';

import Link from 'next/link';

const ROADMAP_PHASES = [
  {
    phase: 1,
    title: 'BASE MAINNET',
    status: 'LIVE',
    statusColor: '#00FF88',
    date: 'December 2024',
    items: [
      'VOT Token deployed on Base (0xc1e1E7aD...)',
      'MAXX Token deployed on Base (0xFB7a83ab...)',
      'BeeperNFT V3: ERC-1155 + On-Chain SVG + VRF Rarity',
      'x402 V2 Facilitator Protocol',
      'Farcaster Mini-App Integration',
      'mcpvot.base.eth Basename',
      'Treasury multi-sig (0x824ea259...)',
    ],
  },
  {
    phase: 2,
    title: 'VOT MACHINE NFT',
    status: 'Q1 2025',
    statusColor: '#FF8800',
    date: 'January - March 2025',
    items: [
      'VOT Machine: Animated HTML landing pages as NFTs',
      'Full cyberpunk boot sequence + data rain matrix',
      'LLM-generated unique taglines per mint',
      '6 trait categories: warplet, tokenomics, agent, dapp, protocol, defi',
      'IPFS permanent storage (1500+ lines HTML per NFT)',
      'ENS subdomain per token: [tokenId].mcpvot.eth',
      'OpenSea collection integration',
    ],
  },
  {
    phase: 3,
    title: 'ENS + CCIP-READ',
    status: 'Q2 2025',
    statusColor: '#5298FF',
    date: 'April - June 2025',
    items: [
      'mcpvot.eth ENS name on L1 Ethereum',
      'Wildcard resolver: *.mcpvot.eth → NFT pages',
      'CCIP-Read (EIP-3668) for L2→L1 resolution',
      'web3://180.mcpvot.eth → Full HTML page',
      'Unruggable Gateway for trustless Base storage proofs',
      'Cross-chain VOT bridging (Base ↔ Ethereum)',
      'ENS Avatar integration with VOT Machine SVGs',
    ],
  },
  {
    phase: 4,
    title: 'ERC-4804 WEB3://',
    status: 'Q3 2025',
    statusColor: '#9F7AEA',
    date: 'July - September 2025',
    items: [
      'Full ERC-4804 compliance for decentralized web',
      'Smart contract serves HTML via web3:// protocol',
      'NFT holders own their subdomain + landing page',
      'Decentralized identity: address → ENS → content',
      'MCP Server integration for AI agent discovery',
      'ERC-8004 Agent payments on web3:// pages',
      'Vercel + IPFS hybrid deployment',
    ],
  },
  {
    phase: 5,
    title: 'MULTI-CHAIN DAO',
    status: '2026',
    statusColor: '#FFD700',
    date: '2026',
    items: [
      'Polygon, Arbitrum, Optimism deployment',
      'Unified VOT liquidity across chains',
      'DAO governance with VOT voting power',
      'Treasury management by community',
      'Agent marketplace with x402 payments',
      'Cross-chain ENS resolution',
      'Protocol revenue sharing',
    ],
  },
];

const TECH_STANDARDS = [
  { name: 'ERC-20', description: 'VOT & MAXX tokens', color: '#00FFFF' },
  { name: 'ERC-1155', description: 'Multi-token NFTs', color: '#9F7AEA' },
  { name: 'ERC-4804', description: 'Web3:// URL standard', color: '#FF8800' },
  { name: 'ERC-8004', description: 'AI Agent payments', color: '#00FF88' },
  { name: 'EIP-3668', description: 'CCIP-Read off-chain lookup', color: '#5298FF' },
  { name: 'Chainlink VRF v2.5', description: 'Verifiable randomness', color: '#FFD700' },
];

export default function RoadmapPage() {
  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Hero */}
      <div className="text-center py-4 sm:py-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent mb-3 sm:mb-4">
          MCPVOT Roadmap
        </h1>
        <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto px-2">
          From Base mainnet to multi-chain DAO. ENS + VOT Machine + AI agents.
        </p>
      </div>

      {/* ENS Vision Banner */}
      <div className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 border border-blue-500/40 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌐</span>
              <h2 className="text-lg sm:text-xl font-bold text-white">ENS + VOT Machine Vision</h2>
            </div>
            <p className="text-gray-400 text-sm">
              Every NFT becomes a <span className="text-cyan-400 font-mono">[tokenId].mcpvot.eth</span> subdomain.
              Access via <span className="text-purple-400 font-mono">web3://180.mcpvot.eth</span> for fully decentralized web.
            </p>
          </div>
          <Link 
            href="/about" 
            className="px-4 py-2 bg-purple-500/20 border border-purple-500/60 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all text-sm font-bold whitespace-nowrap"
          >
            Learn More →
          </Link>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {ROADMAP_PHASES.map((phase) => (
          <div 
            key={phase.phase}
            className="relative pl-6 sm:pl-8 border-l-2"
            style={{ borderColor: `${phase.statusColor}60` }}
          >
            {/* Timeline dot */}
            <div 
              className="absolute -left-2 top-0 w-4 h-4 rounded-full border-2"
              style={{ 
                backgroundColor: phase.status === 'LIVE' ? phase.statusColor : 'black',
                borderColor: phase.statusColor,
                boxShadow: phase.status === 'LIVE' ? `0 0 10px ${phase.statusColor}` : 'none'
              }}
            />
            
            <div className="bg-black/50 border rounded-xl p-4 sm:p-6" style={{ borderColor: `${phase.statusColor}40` }}>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-500">PHASE {phase.phase}</span>
                  <h3 className="text-lg sm:text-xl font-bold" style={{ color: phase.statusColor }}>
                    {phase.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className="px-3 py-1 rounded text-xs font-bold"
                    style={{ 
                      backgroundColor: `${phase.statusColor}20`,
                      color: phase.statusColor,
                      border: `1px solid ${phase.statusColor}60`
                    }}
                  >
                    {phase.status}
                  </span>
                  <span className="text-gray-500 text-xs">{phase.date}</span>
                </div>
              </div>

              {/* Items */}
              <ul className="space-y-2">
                {phase.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <span style={{ color: phase.statusColor }}>
                      {phase.status === 'LIVE' ? '✓' : '○'}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Technical Standards */}
      <div className="bg-black/50 border border-cyan-500/30 rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-cyan-400 mb-4">📐 Technical Standards</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TECH_STANDARDS.map((std) => (
            <div 
              key={std.name}
              className="p-3 bg-black/50 rounded-lg border"
              style={{ borderColor: `${std.color}40` }}
            >
              <div className="font-bold text-sm" style={{ color: std.color }}>{std.name}</div>
              <div className="text-xs text-gray-500">{std.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ENS Architecture */}
      <div className="bg-black/50 border border-purple-500/30 rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-purple-400 mb-4">🏗️ ENS + CCIP-Read Architecture</h2>
        <div className="bg-black/80 rounded p-4 overflow-x-auto">
          <pre className="text-xs text-green-400 font-mono whitespace-pre">
{`┌──────────────────────────────────────────────────────────────────┐
│                    VOT MACHINE RESOLUTION                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User types: web3://180.mcpvot.eth                               │
│         │                                                         │
│         ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ ENS Registry (L1 Ethereum)                               │     │
│  │ → Wildcard resolver for *.mcpvot.eth                     │     │
│  │ → Reverts with OffchainLookup (EIP-3668)                 │     │
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
│  │ Browser fetches: ipfs://QmXxxHtmlPage...                 │     │
│  │ → Full 1500+ line cyberpunk HTML page                    │     │
│  │ → Boot sequence, data rain, identity banner              │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘`}
          </pre>
        </div>
      </div>

      {/* Links */}
      <div className="grid grid-cols-2 gap-4">
        <Link 
          href="/about"
          className="p-4 bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/30 rounded-xl hover:border-cyan-500/60 transition-all text-center"
        >
          <div className="text-2xl mb-2">🚀</div>
          <div className="text-cyan-400 font-bold">About</div>
          <div className="text-gray-500 text-xs">Full details</div>
        </Link>
        <Link 
          href="/docs"
          className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/30 rounded-xl hover:border-purple-500/60 transition-all text-center"
        >
          <div className="text-2xl mb-2">📚</div>
          <div className="text-purple-400 font-bold">Docs</div>
          <div className="text-gray-500 text-xs">Technical docs</div>
        </Link>
      </div>
    </div>
  );
}
