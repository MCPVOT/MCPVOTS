'use client';

export default function CLIPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">💻 MCPVOT CLI</h1>
        <p className="text-gray-400 text-lg">
          Command-line tools for interacting with the MCPVOT ecosystem.
        </p>
      </div>

      {/* Warning Box */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <h3 className="font-bold text-red-400 mb-2">🔐 Security First</h3>
        <p className="text-gray-400 text-sm">
          The CLI uses environment variables for sensitive data. <strong>Never hardcode private keys</strong> or commit them to version control.
        </p>
      </div>

      {/* Installation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Installation</h2>
        
        <h3 className="text-lg font-bold text-gray-300">Option 1: NPM (Coming Soon)</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm">
            <code className="text-green-400">npm install -g @mcpvot/cli</code>
          </pre>
        </div>

        <h3 className="text-lg font-bold text-gray-300 mt-4">Option 2: Use API Directly</h3>
        <p className="text-gray-400 text-sm mb-2">
          Until the CLI is published, you can interact directly with the MCPVOT API using cURL or any HTTP client:
        </p>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm">
            <code className="text-green-400">{`# Check ecosystem status
curl https://mcpvot.xyz/api/x402/agent-data

# Generate NFT
curl -X POST https://mcpvot.xyz/api/machine/generate \\
  -H "Content-Type: application/json" \\
  -d '{"fid": 12345, "enableAI": true}'`}</code>
          </pre>
        </div>

        <h3 className="text-lg font-bold text-gray-300 mt-4">Option 3: Python SDK (Coming Soon)</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm">
            <code className="text-green-400">{`pip install mcpvot-cli`}</code>
          </pre>
        </div>
        
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
          <p className="text-yellow-400 text-sm">
            📢 <strong>Note:</strong> CLI packages are in development. For now, use the REST API endpoints directly at mcpvot.xyz/api
          </p>
        </div>
      </section>

      {/* Environment Setup */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Environment Setup</h2>
        <p className="text-gray-400">
          Create a <code className="text-cyan-400">.env</code> file in your project root:
        </p>
        
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700">
            <span className="text-sm text-gray-400">.env</span>
          </div>
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-yellow-400">{`# MCPVOT API Configuration
MCPVOT_API_URL=https://mcpvot.xyz/api

# Wallet (use a dedicated hot wallet, NOT your main wallet!)
AGENT_WALLET_ADDRESS=0x...    # Your public address
AGENT_PRIVATE_KEY=            # Leave empty for read-only mode

# Optional: Direct API access (advanced)
OPENROUTER_API_KEY=           # For direct LLM calls
PINATA_JWT=                   # For IPFS pinning

# Network
BASE_RPC_URL=https://mainnet.base.org`}</code>
          </pre>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
          <p className="text-yellow-400 text-sm">
            💡 <strong>Tip:</strong> Most CLI commands work in read-only mode without a private key. 
            Only add your key when you need to send transactions.
          </p>
        </div>
      </section>

      {/* Commands */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Commands</h2>

        {/* Status */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">mcpvot status</h3>
          <p className="text-gray-400 text-sm">Check ecosystem status and your wallet info</p>
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <pre className="p-4 text-sm">
              <code className="text-green-400">{`mcpvot status`}</code>
            </pre>
          </div>
          <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-gray-400 border border-gray-800">
{`╔═══════════════════════════════════════════════════╗
║              MCPVOT ECOSYSTEM STATUS               ║
╠═══════════════════════════════════════════════════╣
║ VOT Price: $0.0000123    24h: +5.2%               ║
║ Total Supply: 1,000,000,000 VOT                   ║
║ Burned: 12,345,678 VOT (1.23%)                    ║
╠═══════════════════════════════════════════════════╣
║ Your Wallet: 0x1234...5678                        ║
║ VOT Balance: 50,000 VOT                           ║
║ Rank: 🔧 Builder                                  ║
╚═══════════════════════════════════════════════════╝`}
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-2 mt-6">
          <h3 className="text-lg font-bold text-white">mcpvot balance [address]</h3>
          <p className="text-gray-400 text-sm">Check VOT balance and rank for any address</p>
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <pre className="p-4 text-sm">
              <code className="text-green-400">{`# Your balance (uses AGENT_WALLET_ADDRESS)
mcpvot balance

# Any address
mcpvot balance 0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa`}</code>
            </pre>
          </div>
        </div>

        {/* Generate */}
        <div className="space-y-2 mt-6">
          <h3 className="text-lg font-bold text-white">mcpvot generate</h3>
          <p className="text-gray-400 text-sm">Generate NFT HTML with AI</p>
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <pre className="p-4 text-sm">
              <code className="text-green-400">{`# Interactive mode
mcpvot generate

# With options
mcpvot generate \\
  --fid 12345 \\
  --enable-ai \\
  --output ./nft.html`}</code>
            </pre>
          </div>
        </div>

        {/* AI */}
        <div className="space-y-2 mt-6">
          <h3 className="text-lg font-bold text-white">mcpvot ai</h3>
          <p className="text-gray-400 text-sm">Direct AI interactions</p>
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <pre className="p-4 text-sm">
              <code className="text-green-400">{`# Generate tagline
mcpvot ai tagline --fid 12345

# Profile analysis
mcpvot ai analyze --fid 12345

# Badge suggestions
mcpvot ai badges --fid 12345`}</code>
            </pre>
          </div>
        </div>

        {/* IPFS */}
        <div className="space-y-2 mt-6">
          <h3 className="text-lg font-bold text-white">mcpvot ipfs</h3>
          <p className="text-gray-400 text-sm">IPFS operations</p>
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <pre className="p-4 text-sm">
              <code className="text-green-400">{`# Pin a file
mcpvot ipfs pin ./nft.html

# Get content
mcpvot ipfs get QmXxx...

# List pinned content
mcpvot ipfs list`}</code>
            </pre>
          </div>
        </div>

        {/* Config */}
        <div className="space-y-2 mt-6">
          <h3 className="text-lg font-bold text-white">mcpvot config</h3>
          <p className="text-gray-400 text-sm">View/set configuration</p>
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <pre className="p-4 text-sm">
              <code className="text-green-400">{`# View current config (keys hidden)
mcpvot config

# Set API URL
mcpvot config set api_url https://mcpvot.xyz/api

# Set wallet (saves to .env)
mcpvot config set wallet 0x...`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Python SDK */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Python SDK</h2>
        <p className="text-gray-400">
          For Python agents, use the mcpvot-py package:
        </p>
        
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-blue-400">{`from mcpvot import MCPVOTClient
import os

# Initialize client (reads from .env)
client = MCPVOTClient()

# Check balance
balance = client.get_balance()
print(f"VOT: {balance.formatted}")
print(f"Rank: {balance.rank}")

# Generate NFT HTML
html = client.generate_nft(
    fid=12345,
    enable_ai=True
)

# Pin to IPFS
cid = client.ipfs_pin(html, filename="nft.html")
print(f"IPFS CID: {cid}")

# AI operations
tagline = client.ai.generate_tagline(fid=12345)
analysis = client.ai.analyze_profile(fid=12345)`}</code>
          </pre>
        </div>
      </section>

      {/* Node.js SDK */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Node.js SDK</h2>
        
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-blue-400">{`import { MCPVOTClient } from '@mcpvot/sdk';

// Initialize client
const client = new MCPVOTClient({
  apiUrl: process.env.MCPVOT_API_URL
});

// Check balance
const { balance, rank } = await client.getBalance('0x...');
console.log(\`VOT: \${balance} | Rank: \${rank}\`);

// Generate NFT
const html = await client.generateNFT({
  fid: 12345,
  enableAI: true
});

// Pin to IPFS
const cid = await client.ipfsPin(html);
console.log(\`CID: \${cid}\`);`}</code>
          </pre>
        </div>
      </section>

      {/* Secure Key Management */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Secure Key Management</h2>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-black/50 rounded-lg border border-gray-800">
            <span className="text-green-400">✓</span>
            <div>
              <h3 className="font-bold text-white">Use Environment Variables</h3>
              <p className="text-gray-500 text-sm">Store keys in .env files, never in code</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-black/50 rounded-lg border border-gray-800">
            <span className="text-green-400">✓</span>
            <div>
              <h3 className="font-bold text-white">Dedicated Hot Wallet</h3>
              <p className="text-gray-500 text-sm">Use a separate wallet for CLI operations with limited funds</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-black/50 rounded-lg border border-gray-800">
            <span className="text-green-400">✓</span>
            <div>
              <h3 className="font-bold text-white">Read-Only Default</h3>
              <p className="text-gray-500 text-sm">CLI works without private key for queries</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-black/50 rounded-lg border border-gray-800">
            <span className="text-red-400">✗</span>
            <div>
              <h3 className="font-bold text-white">Never Commit Keys</h3>
              <p className="text-gray-500 text-sm">Add .env to .gitignore</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 mt-4">
          <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700">
            <span className="text-sm text-gray-400">.gitignore</span>
          </div>
          <pre className="p-4 text-sm">
            <code className="text-yellow-400">{`# Never commit these
.env
.env.local
.env.*.local
*.key
*.pem
private_key*`}</code>
          </pre>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Troubleshooting</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-black/50 rounded-lg border border-gray-800">
            <h3 className="font-bold text-white mb-2">Command not found</h3>
            <p className="text-gray-500 text-sm">
              Run <code className="text-cyan-400">npm link</code> in the CLI directory, or add to PATH
            </p>
          </div>
          
          <div className="p-4 bg-black/50 rounded-lg border border-gray-800">
            <h3 className="font-bold text-white mb-2">401 Unauthorized</h3>
            <p className="text-gray-500 text-sm">
              Check your MCPVOT_API_URL environment variable is set correctly
            </p>
          </div>
          
          <div className="p-4 bg-black/50 rounded-lg border border-gray-800">
            <h3 className="font-bold text-white mb-2">Balance shows 0</h3>
            <p className="text-gray-500 text-sm">
              Ensure you are checking the correct network (Base mainnet) and address
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
