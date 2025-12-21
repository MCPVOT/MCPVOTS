'use client';

export default function X402Page() {
  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Hero */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">🔐 x402 V2 Facilitator</h1>
        <p className="text-gray-400 text-sm sm:text-lg">
          The next-generation VOT rewards system with VRF-powered NFT rarity.
          Pay $0.25 USDC → Get 69,420 VOT + Random Rarity NFT.
        </p>
      </div>

      {/* Quick Summary Card */}
      <section className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-cyan-400 mb-3 sm:mb-4">⚡ x402 V2 At A Glance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-black/50 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl mb-1">💰</div>
            <div className="text-gray-400 text-xs">You Pay</div>
            <div className="text-white font-bold text-sm sm:text-base">$0.25 USDC</div>
          </div>
          <div className="bg-black/50 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl mb-1">🪙</div>
            <div className="text-gray-400 text-xs">You Get</div>
            <div className="text-green-400 font-bold text-sm sm:text-base">69,420 VOT</div>
          </div>
          <div className="bg-black/50 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl mb-1">🎲</div>
            <div className="text-gray-400 text-xs">VRF Rarity</div>
            <div className="text-purple-400 font-bold text-sm sm:text-base">9 Tiers</div>
          </div>
          <div className="bg-black/50 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl mb-1">🎨</div>
            <div className="text-gray-400 text-xs">NFT Standard</div>
            <div className="text-yellow-400 font-bold text-sm sm:text-base">ERC-1155</div>
          </div>
        </div>
      </section>

      {/* What is x402 V2? */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400">What is x402 V2?</h2>
        <p className="text-gray-300 text-sm sm:text-base">
          x402 V2 is an evolution of the original x402 payment protocol. Key improvements:
        </p>
        <ul className="list-disc list-inside text-gray-400 space-y-2 text-sm sm:text-base">
          <li><strong className="text-white">Fixed $0.25 Price</strong> - Simple, predictable cost per mint</li>
          <li><strong className="text-white">69,420 VOT Reward</strong> - Meme number, real value delivered to wallet</li>
          <li><strong className="text-white">Chainlink VRF v2.5</strong> - Provably fair random rarity selection</li>
          <li><strong className="text-white">ERC-1155 + ERC-4804</strong> - Multi-token NFT with Web3 URL support</li>
          <li><strong className="text-white">IPFS Permanent Storage</strong> - Metadata stored forever via self-hosted IPFS node</li>
          <li><strong className="text-white">0% Burn (V2)</strong> - Full rewards go to builders</li>
        </ul>
      </section>

      {/* VRF Rarity System */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-purple-400">🎲 VRF Rarity Tiers</h2>
        <p className="text-gray-400 text-sm sm:text-base">
          Every mint uses Chainlink VRF v2.5 for verifiable randomness. Your NFT rarity is determined on-chain.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: 'NODE', glyph: '𒇻', sumerian: 'DINGIR', weight: 4500, chance: '45.00%', color: '#00FF88' },
            { name: 'VALIDATOR', glyph: '𒁹', sumerian: 'DIŠ', weight: 2500, chance: '25.00%', color: '#00FFFF' },
            { name: 'STAKER', glyph: '𒋼', sumerian: 'TA', weight: 1500, chance: '15.00%', color: '#0088FF' },
            { name: 'WHALE', glyph: '𒄠', sumerian: 'AM', weight: 800, chance: '8.00%', color: '#FF8800' },
            { name: 'OG', glyph: '𒀭', sumerian: 'AN', weight: 400, chance: '4.00%', color: '#9F7AEA' },
            { name: 'GENESIS', glyph: '𒆳', sumerian: 'KUR', weight: 200, chance: '2.00%', color: '#FF00FF' },
            { name: 'ZZZ', glyph: '𒌋', sumerian: 'U', weight: 50, chance: '0.50%', color: '#FF0088' },
            { name: 'FOMO', glyph: '𒀯', sumerian: 'MUL', weight: 30, chance: '0.30%', color: '#FFFF00' },
            { name: 'GM', glyph: '𒆷', sumerian: 'LA', weight: 15, chance: '0.15%', color: '#FFD700' },
            { name: 'X402', glyph: '𒈗', sumerian: 'LUGAL', weight: 5, chance: '0.05%', color: '#FF4500' },
          ].map((rarity) => (
            <div 
              key={rarity.name}
              className="flex flex-col p-3 bg-black/50 rounded-lg border"
              style={{ borderColor: `${rarity.color}40` }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">{rarity.glyph}</span>
                <span className="font-bold text-sm" style={{ color: rarity.color }}>{rarity.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{rarity.sumerian}</span>
                <span className="text-gray-400 font-mono">{rarity.chance}</span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${Math.min(100, parseFloat(rarity.chance) * 2)}%`, 
                    backgroundColor: rarity.color 
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4 mt-4">
          <p className="text-yellow-400 text-xs sm:text-sm">
            🔒 <strong>Provably Fair:</strong> VRF randomness is verified on-chain. No one can manipulate rarity outcomes.
          </p>
        </div>
      </section>

      {/* Flow Diagram */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400">V3 Payment Flow</h2>
        <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-3 sm:p-6 font-mono text-[10px] sm:text-sm overflow-x-auto">
          <pre className="text-cyan-400">
{`┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   User      │         │  Facilitator │         │  Contract   │
│  (Wallet)   │         │   (Server)   │         │ (BeeperV3)  │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │  1. Pay $0.25 USDC    │                        │
       │──────────────────────>│                        │
       │                       │                        │
       │                       │  2. Request VRF        │
       │                       │───────────────────────>│
       │                       │     (Chainlink VRF)    │
       │                       │                        │
       │                       │  3. Random number      │
       │                       │<───────────────────────│
       │                       │                        │
       │  4. 69,420 VOT sent   │                        │
       │<──────────────────────│                        │
       │                       │                        │
       │  5. ERC-1155 Minted   │                        │
       │<──────────────────────│  (IPFS metadata)       │
       │                       │                        │
       │  [RARITY: VRF BASED]  │                        │
       └───────────────────────┴────────────────────────┘`}
          </pre>
        </div>
      </section>

      {/* Contract Addresses */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400">📜 Contract Addresses</h2>
        <div className="space-y-3 font-mono text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 p-3 bg-black/50 rounded border border-gray-800">
            <span className="text-gray-400">VOT Token</span>
            <code className="text-cyan-400 break-all">0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07</code>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 p-3 bg-black/50 rounded border border-gray-800">
            <span className="text-gray-400">USDC (Base)</span>
            <code className="text-blue-400 break-all">0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</code>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 p-3 bg-black/50 rounded border border-gray-800">
            <span className="text-gray-400">Treasury</span>
            <code className="text-green-400 break-all">0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa</code>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 p-3 bg-black/50 rounded border border-gray-800">
            <span className="text-gray-400">BeeperNFT V3</span>
            <code className="text-purple-400 break-all">0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9</code>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400">🌐 API Endpoints</h2>
        <div className="space-y-3 font-mono text-xs sm:text-sm">
          <div className="p-3 bg-black/50 rounded border border-gray-800">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">POST</span>
              <code className="text-white break-all">/api/x402/mint</code>
            </div>
            <p className="text-gray-500 text-xs">Initiate mint: pay USDC, receive VOT + NFT</p>
          </div>
          <div className="p-3 bg-black/50 rounded border border-gray-800">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">GET</span>
              <code className="text-white break-all">/api/x402/queue?address=0x...</code>
            </div>
            <p className="text-gray-500 text-xs">Check mint queue status and results</p>
          </div>
          <div className="p-3 bg-black/50 rounded border border-gray-800">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">GET</span>
              <code className="text-white break-all">/api/x402/agent-data</code>
            </div>
            <p className="text-gray-500 text-xs">Agent service discovery (ERC-8004)</p>
          </div>
        </div>
      </section>

      {/* Mint Example */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400">💻 Mint Example</h2>
        
        <h3 className="text-base sm:text-lg font-bold text-gray-300">1. Approve USDC Spending</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-3 sm:p-4 text-xs sm:text-sm overflow-x-auto">
            <code className="text-blue-400">{`// Approve $0.25 USDC (250000 with 6 decimals)
const usdcContract = new Contract(USDC_ADDRESS, ERC20_ABI, signer);
await usdcContract.approve(FACILITATOR_ADDRESS, 250000);`}</code>
          </pre>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-gray-300 mt-4">2. Call Mint API</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-3 sm:p-4 text-xs sm:text-sm overflow-x-auto">
            <code className="text-green-400">{`const response = await fetch('/api/x402/mint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: '0xYourWallet...',
    usdcTxHash: '0xApprovalTx...',
    svgContent: '<svg>...</svg>',
    metadata: { name: 'My NFT', description: '...' }
  })
});

const { queuePosition, estimatedTime } = await response.json();`}</code>
          </pre>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-gray-300 mt-4">3. Poll Queue Status</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-3 sm:p-4 text-xs sm:text-sm overflow-x-auto">
            <code className="text-yellow-400">{`const result = await fetch('/api/x402/queue?address=0xYourWallet');
const { status, result: mintResult } = await result.json();

if (status === 'completed') {
  console.log('Token ID:', mintResult.tokenId);
  console.log('Rarity:', mintResult.rarity);  // e.g., "GENESIS"
  console.log('VOT Sent:', mintResult.votSent);
  console.log('IPFS CID:', mintResult.ipfsCid);
  console.log('OpenSea:', mintResult.openSeaUrl);
}`}</code>
          </pre>
        </div>
      </section>

      {/* Technical Standards */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400">📋 Technical Standards</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-gray-800">
            <div className="text-lg sm:text-xl mb-2">🎨</div>
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">ERC-1155</h3>
            <p className="text-gray-500 text-xs">Multi-token standard for efficient NFT minting</p>
          </div>
          <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-gray-800">
            <div className="text-lg sm:text-xl mb-2">🌐</div>
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">ERC-4804</h3>
            <p className="text-gray-500 text-xs">Web3 URL standard for decentralized resources</p>
          </div>
          <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-gray-800">
            <div className="text-lg sm:text-xl mb-2">🤖</div>
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">ERC-8004</h3>
            <p className="text-gray-500 text-xs">Agent payment protocol for AI services</p>
          </div>
          <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-gray-800">
            <div className="text-lg sm:text-xl mb-2">🎲</div>
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">Chainlink VRF v2.5</h3>
            <p className="text-gray-500 text-xs">Verifiable random function for fair rarity</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400">❓ FAQ</h2>
        
        <div className="space-y-3">
          <div className="bg-black/50 border border-gray-800 rounded-lg p-3 sm:p-4">
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">Why $0.25?</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Low barrier to entry while still funding the VOT ecosystem treasury.</p>
          </div>
          <div className="bg-black/50 border border-gray-800 rounded-lg p-3 sm:p-4">
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">Why 69,420 VOT?</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Meme number with real utility. Creates engagement while distributing tokens.</p>
          </div>
          <div className="bg-black/50 border border-gray-800 rounded-lg p-3 sm:p-4">
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">How is rarity determined?</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Chainlink VRF v2.5 generates provably random numbers on-chain. No manipulation possible.</p>
          </div>
          <div className="bg-black/50 border border-gray-800 rounded-lg p-3 sm:p-4">
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">Where is my NFT stored?</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Self-hosted IPFS node. Permanent, decentralized storage.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
