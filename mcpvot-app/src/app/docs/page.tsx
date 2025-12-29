'use client';

import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="space-y-8 sm:space-y-12" role="main" aria-label="MCPVOT Documentation">
      {/* Hero */}
      <header className="text-center py-4 sm:py-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-yellow-400 bg-clip-text text-transparent mb-3 sm:mb-4">
          MCPVOT Documentation
        </h1>
        <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto px-2">
          x402 V2 Facilitator: Pay $0.25 USDC → Get 69,420 VOT + VRF Rarity NFT.
          Built on Base with Chainlink VRF, ERC-1155, and ERC-4804.
        </p>
      </header>

      {/* x402 V2 Feature Banner */}
      <section 
        className="bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-green-500/20 border border-cyan-500/40 rounded-xl p-4 sm:p-6 hover:border-cyan-400/60 transition-all duration-300"
        aria-labelledby="x402-banner-title"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold animate-pulse">NEW</span>
              <h2 id="x402-banner-title" className="text-lg sm:text-xl font-bold text-white">x402 V2 is Live!</h2>
            </div>
            <p className="text-gray-400 text-sm">
              VRF-powered rarity • 69,420 VOT rewards • ERC-1155 NFTs • IPFS storage
            </p>
          </div>
          <Link 
            href="/docs/x402" 
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/60 rounded-lg text-cyan-400 hover:bg-cyan-500/30 hover:scale-105 active:scale-95 transition-all duration-200 text-sm font-bold whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          >
            View x402 V2 Docs →
          </Link>
        </div>
      </section>

      {/* Quick Start Cards */}
      <section aria-label="Documentation sections">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Link 
            href="/docs/quickstart" 
            className="group block p-4 sm:p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/30 rounded-xl hover:border-cyan-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          >
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3" aria-hidden="true">🚀</div>
            <h2 className="text-lg sm:text-xl font-bold text-cyan-400 group-hover:text-cyan-300 mb-1 sm:mb-2">Quickstart</h2>
            <p className="text-gray-400 text-sm">Get started in 5 minutes. Pay $0.25, get 69,420 VOT + NFT.</p>
          </Link>

          <Link 
            href="/docs/x402" 
            className="group block p-4 sm:p-6 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/30 rounded-xl hover:border-purple-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
          >
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3" aria-hidden="true">🎲</div>
            <h2 className="text-lg sm:text-xl font-bold text-purple-400 group-hover:text-purple-300 mb-1 sm:mb-2">x402 V2 + VRF</h2>
            <p className="text-gray-400 text-sm">VRF-powered rarity system with 9 tiers. Chainlink randomness.</p>
          </Link>

          <Link 
            href="/docs/sdk" 
            className="group block p-4 sm:p-6 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/30 rounded-xl hover:border-green-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/50"
          >
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3" aria-hidden="true">⚡</div>
            <h2 className="text-lg sm:text-xl font-bold text-green-400 group-hover:text-green-300 mb-1 sm:mb-2">SDK Reference</h2>
            <p className="text-gray-400 text-sm">Full API reference with TypeScript, Python, and curl examples.</p>
          </Link>

          <Link 
            href="/docs/architecture" 
            className="group block p-4 sm:p-6 bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/30 rounded-xl hover:border-orange-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
          >
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3" aria-hidden="true">🏗️</div>
            <h2 className="text-lg sm:text-xl font-bold text-orange-400 group-hover:text-orange-300 mb-1 sm:mb-2">Architecture</h2>
            <p className="text-gray-400 text-sm">Deep dive into the system design and component interactions.</p>
          </Link>

          <Link 
            href="/docs/roadmap" 
            className="group block p-4 sm:p-6 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 rounded-xl hover:border-blue-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          >
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3" aria-hidden="true">🗺️</div>
            <h2 className="text-lg sm:text-xl font-bold text-blue-400 group-hover:text-blue-300 mb-1 sm:mb-2">Roadmap</h2>
            <p className="text-gray-400 text-sm">ENS + VOT Machine + CCIP-Read. Future plans through 2026.</p>
          </Link>

          <Link 
            href="/docs/x402#intelligence" 
            className="group block p-4 sm:p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 rounded-xl hover:border-emerald-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          >
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3" aria-hidden="true">🧠</div>
            <h2 className="text-lg sm:text-xl font-bold text-emerald-400 group-hover:text-emerald-300 mb-1 sm:mb-2">Intelligence APIs</h2>
            <p className="text-gray-400 text-sm">Token analytics, ecosystem metrics, multi-token analysis. $0.02-$0.10</p>
          </Link>
        </div>
      </section>

      {/* x402 V2 Summary */}
      <section 
        className="bg-black/50 border border-purple-500/30 rounded-xl p-4 sm:p-6 hover:border-purple-500/50 transition-all duration-300"
        aria-labelledby="how-it-works-title"
      >
        <h2 id="how-it-works-title" className="text-lg sm:text-xl font-bold text-purple-400 mb-3 sm:mb-4">🎲 x402 V2: How It Works</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-black/50 rounded-lg p-3 text-center hover:bg-black/70 transition-colors">
            <div className="text-xl mb-1" aria-hidden="true">💰</div>
            <div className="text-gray-400 text-xs">You Pay</div>
            <div className="text-white font-bold">$0.25 USDC</div>
          </div>
          <div className="bg-black/50 rounded-lg p-3 text-center hover:bg-black/70 transition-colors">
            <div className="text-xl mb-1" aria-hidden="true">🪙</div>
            <div className="text-gray-400 text-xs">You Get</div>
            <div className="text-green-400 font-bold">69,420 VOT</div>
          </div>
          <div className="bg-black/50 rounded-lg p-3 text-center hover:bg-black/70 transition-colors">
            <div className="text-xl mb-1" aria-hidden="true">🎲</div>
            <div className="text-gray-400 text-xs">Rarity</div>
            <div className="text-purple-400 font-bold">VRF Random</div>
          </div>
          <div className="bg-black/50 rounded-lg p-3 text-center hover:bg-black/70 transition-colors">
            <div className="text-xl mb-1" aria-hidden="true">🎨</div>
            <div className="text-gray-400 text-xs">NFT</div>
            <div className="text-yellow-400 font-bold">ERC-1155</div>
          </div>
        </div>
        <p className="text-gray-400 text-xs sm:text-sm">
          10 rarity tiers from NODE (45%) to X402 (0.05%). Chainlink VRF ensures provably fair randomness.
        </p>
      </section>

      {/* Contract Addresses */}
      <section 
        className="bg-black/50 border border-cyan-500/30 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all duration-300"
        aria-labelledby="contracts-title"
      >
        <h2 id="contracts-title" className="text-lg sm:text-xl font-bold text-cyan-400 mb-3 sm:mb-4">📜 Contract Addresses (Base)</h2>
        <div className="space-y-3 font-mono text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 p-3 bg-black/50 rounded border border-gray-800 hover:border-cyan-500/30 transition-colors group">
            <span className="text-gray-400">VOT Token</span>
            <code className="text-cyan-400 break-all select-all group-hover:text-cyan-300">0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07</code>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 p-3 bg-black/50 rounded border border-gray-800 hover:border-orange-500/30 transition-colors group">
            <span className="text-gray-400">MAXX Token</span>
            <code className="text-orange-400 break-all select-all group-hover:text-orange-300">0xFB7a83abe4F4A4E51c77B92E521390B769ff6467</code>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 p-3 bg-black/50 rounded border border-gray-800 hover:border-green-500/30 transition-colors group">
            <span className="text-gray-400">Treasury</span>
            <code className="text-green-400 break-all select-all group-hover:text-green-300">0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa</code>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 p-3 bg-black/50 rounded border border-gray-800 hover:border-blue-500/30 transition-colors group">
            <span className="text-gray-400">USDC (Base)</span>
            <code className="text-blue-400 break-all select-all group-hover:text-blue-300">0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</code>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section 
        className="bg-black/50 border border-yellow-500/30 rounded-xl p-4 sm:p-6 hover:border-yellow-500/50 transition-all duration-300"
        aria-labelledby="api-title"
      >
        <h2 id="api-title" className="text-lg sm:text-xl font-bold text-yellow-400 mb-3 sm:mb-4">🌐 API Endpoints</h2>
        <div className="space-y-3 font-mono text-xs sm:text-sm">
          <div className="p-3 bg-black/50 rounded border border-gray-800 hover:border-blue-500/30 transition-colors">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">POST</span>
              <code className="text-white break-all">/api/x402/mint</code>
            </div>
            <p className="text-gray-500 text-xs">Mint NFT: Pay USDC, get VOT + VRF rarity NFT</p>
          </div>
          <div className="p-3 bg-black/50 rounded border border-gray-800 hover:border-green-500/30 transition-colors">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold">GET</span>
              <code className="text-white break-all">/api/x402/queue?address=0x...</code>
            </div>
            <p className="text-gray-500 text-xs">Check mint status, get result with rarity</p>
          </div>
          <div className="p-3 bg-black/50 rounded border border-gray-800 hover:border-green-500/30 transition-colors">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold">GET</span>
              <code className="text-white break-all">/api/x402/agent-data</code>
            </div>
            <p className="text-gray-500 text-xs">Agent service discovery (ERC-8004)</p>
          </div>
          <div className="p-3 bg-black/50 rounded border border-gray-800 hover:border-blue-500/30 transition-colors">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">POST</span>
              <code className="text-white break-all">/api/openrouter</code>
            </div>
            <p className="text-gray-500 text-xs">Unified LLM endpoint (AI generation)</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section aria-label="Features">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-black/30 border border-gray-800 rounded-lg hover:border-purple-500/40 hover:scale-[1.02] transition-all duration-200">
            <div className="text-xl sm:text-2xl mb-1 sm:mb-2" aria-hidden="true">🎲</div>
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">VRF Rarity</h3>
            <p className="text-gray-500 text-xs">Chainlink VRF v2.5 for provably fair randomness</p>
          </div>
          <div className="p-3 sm:p-4 bg-black/30 border border-gray-800 rounded-lg hover:border-cyan-500/40 hover:scale-[1.02] transition-all duration-200">
            <div className="text-xl sm:text-2xl mb-1 sm:mb-2" aria-hidden="true">📦</div>
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">IPFS Storage</h3>
            <p className="text-gray-500 text-xs">Permanent storage via self-hosted IPFS node</p>
          </div>
          <div className="p-3 sm:p-4 bg-black/30 border border-gray-800 rounded-lg hover:border-blue-500/40 hover:scale-[1.02] transition-all duration-200">
            <div className="text-xl sm:text-2xl mb-1 sm:mb-2" aria-hidden="true">🔗</div>
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">Base L2</h3>
            <p className="text-gray-500 text-xs">Fast, cheap transactions on Coinbase L2</p>
          </div>
          <div className="p-3 sm:p-4 bg-black/30 border border-gray-800 rounded-lg hover:border-purple-500/40 hover:scale-[1.02] transition-all duration-200">
            <div className="text-xl sm:text-2xl mb-1 sm:mb-2" aria-hidden="true">🎭</div>
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">Farcaster Native</h3>
            <p className="text-gray-500 text-xs">Mini-app with frame support</p>
          </div>
          <div className="p-3 sm:p-4 bg-black/30 border border-gray-800 rounded-lg hover:border-yellow-500/40 hover:scale-[1.02] transition-all duration-200">
            <div className="text-xl sm:text-2xl mb-1 sm:mb-2" aria-hidden="true">🎨</div>
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">ERC-1155</h3>
            <p className="text-gray-500 text-xs">Multi-token NFT standard with ERC-4804</p>
          </div>
          <div className="p-3 sm:p-4 bg-black/30 border border-gray-800 rounded-lg hover:border-green-500/40 hover:scale-[1.02] transition-all duration-200">
            <div className="text-xl sm:text-2xl mb-1 sm:mb-2" aria-hidden="true">🤖</div>
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">ERC-8004</h3>
            <p className="text-gray-500 text-xs">Standard compliant agent payments</p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="text-center py-6 sm:py-8 border-t border-gray-800">
        <p className="text-gray-500 text-sm mb-4">Ready to get started?</p>
        <Link 
          href="/docs/quickstart"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 hover:from-cyan-500/30 hover:to-purple-500/30 hover:scale-105 active:scale-95 transition-all duration-200 font-bold"
        >
          <span>🚀</span>
          <span>Start Building Now</span>
        </Link>
      </section>
    </div>
  );
}
