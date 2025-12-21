'use client';

export default function SDKPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">⚡ SDK Reference</h1>
        <p className="text-gray-400 text-lg">
          Complete API reference with curl, TypeScript, and Python examples.
        </p>
      </div>

      {/* Base URL */}
      <section className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
        <p className="text-cyan-400 font-mono">
          Base URL: <code className="bg-black/50 px-2 py-1 rounded">https://mcpvot.xyz/api</code>
        </p>
      </section>

      {/* GET /api/x402/agent-data */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded font-bold text-sm">GET</span>
          <h2 className="text-xl font-bold text-white font-mono">/x402/agent-data</h2>
        </div>
        <p className="text-gray-400">Get ecosystem information for AI agents. No authentication required.</p>
        
        <h3 className="text-lg font-bold text-gray-300">curl</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-green-400">{`curl https://mcpvot.xyz/api/x402/agent-data`}</code>
          </pre>
        </div>

        <h3 className="text-lg font-bold text-gray-300">TypeScript</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-blue-400">{`const response = await fetch('https://mcpvot.xyz/api/x402/agent-data');
const data = await response.json();
console.log(data.contracts.vot); // VOT token address`}</code>
          </pre>
        </div>

        <h3 className="text-lg font-bold text-gray-300">Python</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-yellow-400">{`import requests

response = requests.get('https://mcpvot.xyz/api/x402/agent-data')
data = response.json()
print(data['contracts']['vot'])  # VOT token address`}</code>
          </pre>
        </div>
      </section>

      {/* GET /api/openrouter */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded font-bold text-sm">GET</span>
          <h2 className="text-xl font-bold text-white font-mono">/openrouter</h2>
        </div>
        <p className="text-gray-400">Get available LLM models and service status.</p>
        
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-green-400">{`curl https://mcpvot.xyz/api/openrouter`}</code>
          </pre>
        </div>
      </section>

      {/* POST /api/openrouter */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded font-bold text-sm">POST</span>
          <h2 className="text-xl font-bold text-white font-mono">/openrouter</h2>
        </div>
        <p className="text-gray-400">Unified LLM endpoint with multiple actions.</p>
        
        <h3 className="text-lg font-bold text-gray-300">Actions Available</h3>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          {[
            { action: 'generate_html', desc: 'Generate HTML page for IPFS' },
            { action: 'generate_svg', desc: 'Generate SVG NFT card' },
            { action: 'enhance_template', desc: 'Enhance existing template' },
            { action: 'profile_analysis', desc: 'Analyze Web3 profile' },
            { action: 'generate_bio', desc: 'Create personalized bio' },
            { action: 'generate_tagline', desc: 'Unique cyberpunk tagline' },
            { action: 'generate_boot', desc: 'Boot sequence messages' },
            { action: 'full_uniqueness', desc: 'Complete VOT Machine package' },
            { action: 'custom_css', desc: 'Generate custom CSS' },
            { action: 'raw', desc: 'Direct LLM call' },
          ].map(({ action, desc }) => (
            <div key={action} className="flex justify-between p-2 bg-black/50 rounded border border-cyan-900/50 hover:border-cyan-500/50 transition-colors">
              <code className="text-cyan-400">{action}</code>
              <span className="text-gray-500">{desc}</span>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-bold text-gray-300 mt-4">Example: Generate Tagline</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-green-400">{`curl -X POST https://mcpvot.xyz/api/openrouter \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "generate_tagline",
    "machineContext": {
      "tokenId": 42,
      "ensName": "yourname.eth",
      "votBalance": 10000,
      "rank": "CIRCUIT",
      "isWarpletHolder": false,
      "category": "vot"
    }
  }'`}</code>
          </pre>
        </div>

        <h3 className="text-lg font-bold text-gray-300 mt-4">Example: Full Uniqueness</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-green-400">{`curl -X POST https://mcpvot.xyz/api/openrouter \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "full_uniqueness",
    "machineContext": {
      "tokenId": 1337,
      "basename": "yourname.base.eth",
      "farcasterUsername": "yourhandle",
      "votBalance": 100000,
      "maxxBalance": 50000,
      "rank": "VOID_WALKER",
      "isWarpletHolder": true,
      "category": "vot",
      "userPrompt": "cyberpunk neon aesthetic"
    }
  }'`}</code>
          </pre>
        </div>
      </section>

      {/* POST /api/machine/generate */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded font-bold text-sm">POST</span>
          <h2 className="text-xl font-bold text-white font-mono">/machine/generate</h2>
        </div>
        <p className="text-gray-400">Generate AI-enhanced NFT HTML and pin to IPFS.</p>
        
        <h3 className="text-lg font-bold text-gray-300">Request Body</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto text-gray-300">
{`{
  "address": string,      // Required: Wallet address
  "enableAI": boolean,    // Optional: Enable AI enhancement
  "userPrompt": string,   // Optional: Custom AI prompt
  "tokenId": number,      // Optional: Deterministic token ID
  "profile": {
    "displayName": string,
    "addressShort": string,
    "avatar": string?,
    "banner": string?,
    "bio": string?,
    "basename": string?,
    "ensName": string?,
    "farcasterUsername": string?,
    "farcasterFid": number?,
    "votBalance": string,
    "maxxBalance": string,
    "hasWarpletNFT": boolean,
    "badges": Badge[]
  }
}`}
          </pre>
        </div>

        <h3 className="text-lg font-bold text-gray-300">curl Example</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-green-400">{`curl -X POST https://mcpvot.xyz/api/machine/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "address": "0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa",
    "enableAI": true,
    "userPrompt": "minimal dark theme",
    "profile": {
      "displayName": "mcpvot.eth",
      "addressShort": "0x824e...BE7fa",
      "votBalance": "100000",
      "maxxBalance": "50000",
      "hasWarpletNFT": true,
      "badges": []
    }
  }'`}</code>
          </pre>
        </div>

        <h3 className="text-lg font-bold text-gray-300">Response</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto text-gray-300">
{`{
  "success": true,
  "cid": "QmXyz123...",
  "ipfsUrl": "https://ipfs.io/ipfs/QmXyz123...",
  "aiEnhanced": true,
  "aiUniqueness": {
    "tagline": "Void walker of the digital frontier",
    "colors": {
      "primary": "#00ffff",
      "secondary": "#8b5cf6",
      "accent": "#00d4ff"
    }
  },
  "htmlSize": 15234,
  "timestamp": "2025-12-04T..."
}`}
          </pre>
        </div>
      </section>

      {/* POST /api/machine/ai */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded font-bold text-sm">POST</span>
          <h2 className="text-xl font-bold text-white font-mono">/machine/ai</h2>
        </div>
        <p className="text-gray-400">AI profile analysis and uniqueness generation.</p>
        
        <h3 className="text-lg font-bold text-gray-300">Actions</h3>
        <div className="space-y-2 text-sm">
          {[
            { action: 'analyze', desc: 'Profile analysis with insights' },
            { action: 'generate_bio', desc: 'Bio + tagline generation' },
            { action: 'suggest_badges', desc: 'Badge recommendations' },
            { action: 'nft_metadata', desc: 'ERC-1155 metadata with AI tagline' },
            { action: 'engagement', desc: 'Engagement improvement tips' },
            { action: 'uniqueness', desc: 'Full VOT Machine uniqueness' },
          ].map(({ action, desc }) => (
            <div key={action} className="flex justify-between p-2 bg-black/50 rounded border border-cyan-900/50 hover:border-cyan-500/50 transition-colors">
              <code className="text-cyan-400">{action}</code>
              <span className="text-gray-500">{desc}</span>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-bold text-gray-300 mt-4">Example: Analyze Profile</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-green-400">{`curl -X POST https://mcpvot.xyz/api/machine/ai \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "analyze",
    "profile": {
      "address": "0x...",
      "displayName": "yourname.eth",
      "votBalance": "50000",
      "maxxBalance": "25000",
      "hasWarpletNFT": true,
      "badges": [
        {"id": "vot-holder", "name": "VOT Holder", "emoji": "🪙"}
      ]
    }
  }'`}</code>
          </pre>
        </div>
      </section>

      {/* VOT Ranks */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">VOT Ranks</h2>
        <p className="text-gray-400">Ranks are determined by VOT balance:</p>
        
        <div className="space-y-2">
          {[
            { rank: 'SINGULARITY', min: '1,000,000+', color: 'text-yellow-400', emoji: '🌟' },
            { rank: 'ARCHITECT', min: '500,000+', color: 'text-gray-300', emoji: '🏛️' },
            { rank: 'VOID_WALKER', min: '100,000+', color: 'text-orange-400', emoji: '🌀' },
            { rank: 'CIPHER', min: '50,000+', color: 'text-cyan-400', emoji: '🔐' },
            { rank: 'CIRCUIT', min: '10,000+', color: 'text-green-400', emoji: '⚡' },
            { rank: 'NETRUNNER', min: '1,000+', color: 'text-blue-400', emoji: '🏃' },
            { rank: 'GHOST', min: '< 1,000', color: 'text-gray-500', emoji: '👻' },
          ].map(({ rank, min, color, emoji }) => (
            <div key={rank} className="flex items-center justify-between p-3 bg-black/50 rounded border border-gray-800">
              <div className="flex items-center gap-3">
                <span className="text-xl">{emoji}</span>
                <code className={`font-bold ${color}`}>{rank}</code>
              </div>
              <span className="text-gray-400 font-mono text-sm">{min} VOT</span>
            </div>
          ))}
        </div>
      </section>

      {/* Error Codes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Error Codes</h2>
        <div className="space-y-2">
          {[
            { code: 400, message: 'Bad Request - Missing required fields' },
            { code: 401, message: 'Unauthorized - Invalid API key' },
            { code: 429, message: 'Rate Limited - Too many requests' },
            { code: 500, message: 'Server Error - Check logs' },
            { code: 503, message: 'Service Unavailable - AI backend offline' },
          ].map(({ code, message }) => (
            <div key={code} className="flex items-center gap-4 p-3 bg-black/50 rounded border border-gray-800">
              <code className={`font-bold ${code >= 500 ? 'text-red-400' : code >= 400 ? 'text-yellow-400' : 'text-green-400'}`}>
                {code}
              </code>
              <span className="text-gray-400">{message}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
