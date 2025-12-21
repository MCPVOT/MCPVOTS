'use client';

export default function QuickstartPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">🚀 Quickstart</h1>
        <p className="text-gray-400 text-lg">
          Get started with the MCPVOT x402 Facilitator in under 5 minutes.
        </p>
      </div>

      {/* Prerequisites */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Prerequisites</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>Base wallet with VOT tokens (for payments)</li>
          <li>cURL or any HTTP client</li>
          <li>Optional: OpenRouter API key for AI features</li>
        </ul>
      </section>

      {/* Step 1: Check System Status */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Step 1: Check System Status</h2>
        <p className="text-gray-400">First, verify the API is online and get ecosystem info:</p>
        
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
            <span className="text-sm text-gray-400">bash</span>
            <button className="text-xs text-gray-500 hover:text-white">Copy</button>
          </div>
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-green-400">{`curl -X GET https://mcpvot.xyz/api/x402/agent-data`}</code>
          </pre>
        </div>

        <p className="text-gray-400 text-sm">Response:</p>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto text-gray-300">
{`{
  "ecosystem": "x402-vot-facilitator",
  "version": "2.0.0",
  "status": "active",
  "contracts": {
    "vot": "0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07",
    "maxx": "0xFB7a83abe4F4A4E51c77B92E521390B769ff6467",
    "treasury": "0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa"
  },
  "chain": {
    "name": "Base",
    "id": 8453
  }
}`}
          </pre>
        </div>
      </section>

      {/* Step 2: Generate AI Content */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Step 2: Generate AI Content</h2>
        <p className="text-gray-400">Use the OpenRouter endpoint to generate content:</p>
        
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
            <span className="text-sm text-gray-400">bash</span>
          </div>
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
      </section>

      {/* Step 3: Generate NFT */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Step 3: Generate NFT HTML + IPFS</h2>
        <p className="text-gray-400">Generate a full NFT page with AI enhancement:</p>
        
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-green-400">{`curl -X POST https://mcpvot.xyz/api/machine/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "address": "0xYourWalletAddress",
    "enableAI": true,
    "userPrompt": "cyberpunk style",
    "profile": {
      "displayName": "yourname.eth",
      "addressShort": "0xYour...ddress",
      "votBalance": "10000",
      "maxxBalance": "5000",
      "hasWarpletNFT": false,
      "badges": []
    }
  }'`}</code>
          </pre>
        </div>

        <p className="text-gray-400 text-sm">Response includes IPFS CID:</p>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto text-gray-300">
{`{
  "success": true,
  "cid": "QmXyz...",
  "ipfsUrl": "https://ipfs.io/ipfs/QmXyz...",
  "aiEnhanced": true,
  "aiUniqueness": {
    "tagline": "Digital cipher navigating the void",
    "colors": {
      "primary": "#00ffff",
      "secondary": "#8b5cf6",
      "accent": "#00d4ff"
    }
  }
}`}
          </pre>
        </div>
      </section>

      {/* Environment Variables */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Environment Variables</h2>
        <p className="text-gray-400">For self-hosting or local development:</p>
        
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
            <span className="text-sm text-gray-400">.env.local</span>
          </div>
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-yellow-400">{`# Required for IPFS pinning
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Required for AI features
OPENROUTER_API_KEY=your_openrouter_key

# Optional: Base RPC (defaults to public)
BASE_RPC_URL=https://mainnet.base.org

# Your keys stay LOCAL - never sent to our servers`}</code>
          </pre>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            ⚠️ <strong>Security Note:</strong> API keys are only needed for self-hosting. 
            The public mcpvot.xyz endpoints use our managed keys - your wallet keys are never required.
          </p>
        </div>
      </section>

      {/* Next Steps */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Next Steps</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/docs/sdk" className="block p-4 bg-black/30 border border-gray-800 rounded-lg hover:border-cyan-500/50 transition-colors">
            <h3 className="font-bold text-white mb-1">SDK Reference →</h3>
            <p className="text-gray-500 text-sm">Full API documentation with all endpoints</p>
          </Link>
          <Link href="/docs/x402" className="block p-4 bg-black/30 border border-gray-800 rounded-lg hover:border-cyan-500/50 transition-colors">
            <h3 className="font-bold text-white mb-1">x402 Facilitator →</h3>
            <p className="text-gray-500 text-sm">Payment protocol for AI agents</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
