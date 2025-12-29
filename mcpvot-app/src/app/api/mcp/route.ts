/**
 * MCPVOT MCP Server - Model Context Protocol Endpoint
 * 
 * This endpoint implements the MCP specification for AI agents to:
 * - Access MCPVOT ecosystem resources (VOT token, contracts, docs)
 * - Execute tools (mint NFTs, buy tokens, query intelligence)
 * - Interact with x402 facilitator for payments
 * 
 * Machine Hierarchy:
 * VOT Machine (root) → Beeper Machine → Intelligence Machine → Trading Machine
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================================================
// MCP SERVER CONFIGURATION
// =============================================================================

const MCP_SERVER_INFO = {
  name: 'mcpvot',
  version: '1.0.0',
  protocolVersion: '2024-11-05',
  description: 'MCPVOT - Model Context Protocol server for VOT/MAXX ecosystem on Base',
  vendor: 'MCPVOT Team',
  homepage: 'https://mcpvot.xyz',
};

// =============================================================================
// ECOSYSTEM CONSTANTS
// =============================================================================

const CONTRACTS = {
  VOT_TOKEN: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
  MAXX_TOKEN: '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467',
  BEEPER_NFT: '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9',
  TREASURY: '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

const CHAIN = {
  id: 8453,
  name: 'Base Mainnet',
  rpc: 'https://mainnet.base.org',
  explorer: 'https://basescan.org',
};

// =============================================================================
// MCP RESOURCES - Static ecosystem information for AI agents
// =============================================================================

const MCP_RESOURCES = [
  {
    uri: 'mcpvot://ecosystem/overview',
    name: 'MCPVOT Ecosystem Overview',
    description: 'Complete overview of the MCPVOT ecosystem, machine hierarchy, and capabilities',
    mimeType: 'text/markdown',
  },
  {
    uri: 'mcpvot://contracts/addresses',
    name: 'Contract Addresses',
    description: 'All deployed contract addresses on Base mainnet',
    mimeType: 'application/json',
  },
  {
    uri: 'mcpvot://tokens/vot',
    name: 'VOT Token Information',
    description: 'VOT token details, tokenomics, and usage',
    mimeType: 'application/json',
  },
  {
    uri: 'mcpvot://tokens/maxx',
    name: 'MAXX Token Information',
    description: 'MAXX token details and ecosystem role',
    mimeType: 'application/json',
  },
  {
    uri: 'mcpvot://nft/beeper',
    name: 'Beeper NFT Collection',
    description: 'Beeper Machine NFT details, rarity tiers, and minting info',
    mimeType: 'application/json',
  },
  {
    uri: 'mcpvot://x402/facilitator',
    name: 'x402 Facilitator Guide',
    description: 'How to use x402 protocol for gasless payments',
    mimeType: 'text/markdown',
  },
  {
    uri: 'mcpvot://pricing/all',
    name: 'Pricing Information',
    description: 'All service prices and VOT rewards',
    mimeType: 'application/json',
  },
];

// =============================================================================
// MCP TOOLS - Executable actions for AI agents
// =============================================================================

const MCP_TOOLS = [
  // Beeper Machine Tools
  {
    name: 'mint_beeper_nft',
    description: 'Mint a Beeper NFT via x402 payment. Costs $0.25 USDC, rewards 69,420 VOT tokens. Returns NFT with VRF-determined rarity.',
    inputSchema: {
      type: 'object',
      properties: {
        walletAddress: {
          type: 'string',
          description: 'Recipient wallet address (0x...)',
          pattern: '^0x[a-fA-F0-9]{40}$',
        },
        fid: {
          type: 'number',
          description: 'Optional Farcaster FID for identity binding',
        },
        ensName: {
          type: 'string',
          description: 'Optional ENS/Basename for identity',
        },
      },
      required: ['walletAddress'],
    },
  },
  {
    name: 'claim_share_bonus',
    description: 'Claim 10,000 VOT bonus for sharing Beeper NFT on Farcaster. Requires following @mcpvot and casting about the mint.',
    inputSchema: {
      type: 'object',
      properties: {
        fid: {
          type: 'number',
          description: 'Farcaster FID of the claimer',
        },
        castHash: {
          type: 'string',
          description: 'Hash of the cast sharing the NFT',
        },
      },
      required: ['fid'],
    },
  },
  // Trading Machine Tools
  {
    name: 'buy_vot_tokens',
    description: 'Buy VOT tokens via x402 gasless payment. Options: $1, $10, or $100 USDC.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'string',
          enum: ['1', '10', '100'],
          description: 'USDC amount to spend',
        },
        recipientAddress: {
          type: 'string',
          description: 'Address to receive VOT tokens',
          pattern: '^0x[a-fA-F0-9]{40}$',
        },
      },
      required: ['amount', 'recipientAddress'],
    },
  },
  {
    name: 'buy_maxx_tokens',
    description: 'Buy MAXX tokens via x402 payment. Includes 10,000 VOT bonus with every purchase.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'string',
          enum: ['1', '10', '100'],
          description: 'USDC amount to spend',
        },
        recipientAddress: {
          type: 'string',
          description: 'Address to receive MAXX tokens',
          pattern: '^0x[a-fA-F0-9]{40}$',
        },
      },
      required: ['amount', 'recipientAddress'],
    },
  },
  // Free Tools
  {
    name: 'get_burn_stats',
    description: 'Get real-time VOT burn statistics and transparency data. FREE endpoint.',
    inputSchema: {
      type: 'object',
      properties: {
        detailed: {
          type: 'boolean',
          description: 'Include detailed transaction history',
          default: false,
        },
      },
    },
  },
  {
    name: 'get_token_price',
    description: 'Get current VOT and MAXX token prices. FREE endpoint.',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          enum: ['VOT', 'MAXX', 'both'],
          description: 'Which token price to fetch',
          default: 'both',
        },
      },
    },
  },
  {
    name: 'get_ecosystem_status',
    description: 'Get real-time ecosystem health and metrics. FREE endpoint.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// =============================================================================
// RESOURCE CONTENT GENERATORS
// =============================================================================

function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'mcpvot://ecosystem/overview':
      return {
        mimeType: 'text/markdown',
        content: `# MCPVOT Ecosystem Overview

## Machine Hierarchy

\`\`\`
VOT Machine (Root Orchestrator)
├── Beeper Machine - NFT minting & builder identity
├── Intelligence Machine - Analytics & market data  
├── Trading Machine - Token swaps & DeFi operations
└── Memory Machine - Vector storage & recall
\`\`\`

## What is MCPVOT?

MCPVOT is a comprehensive ecosystem on Base blockchain that combines:
- **VOT Token**: Utility token with deflationary mechanics
- **MAXX Token**: Ecosystem governance token
- **Beeper NFTs**: ERC-1155 identity NFTs with VRF rarity
- **x402 Protocol**: Gasless USDC payments for AI agents

## Key Features

1. **Gasless Payments**: Pay with USDC, receive tokens instantly
2. **AI-Native**: Built for AI agent integration via MCP
3. **On-Chain SVG**: NFTs with fully on-chain artwork
4. **ERC-8004**: Web3 URL compatible for content addressing

## Getting Started

1. Connect wallet to Base network (Chain ID: 8453)
2. Use x402 payment flow for any paid operation
3. Receive VOT rewards with every interaction

## Links

- Website: https://mcpvot.xyz
- x402 API: https://mcpvot.xyz/api/x402
- Farcaster: @mcpvot
`,
      };

    case 'mcpvot://contracts/addresses':
      return {
        mimeType: 'application/json',
        content: JSON.stringify({
          chain: CHAIN,
          contracts: {
            VOT_TOKEN: {
              address: CONTRACTS.VOT_TOKEN,
              name: 'VOT Token',
              symbol: 'VOT',
              decimals: 18,
              type: 'ERC-20',
            },
            MAXX_TOKEN: {
              address: CONTRACTS.MAXX_TOKEN,
              name: 'MAXX Token',
              symbol: 'MAXX',
              decimals: 18,
              type: 'ERC-20',
            },
            BEEPER_NFT: {
              address: CONTRACTS.BEEPER_NFT,
              name: 'BeeperNFTV3',
              type: 'ERC-1155',
              features: ['on-chain-svg', 'vrf-rarity', 'identity-bound'],
            },
            TREASURY: {
              address: CONTRACTS.TREASURY,
              name: 'Treasury/Facilitator',
              role: 'x402 payment recipient',
            },
            USDC: {
              address: CONTRACTS.USDC,
              name: 'USD Coin',
              symbol: 'USDC',
              decimals: 6,
            },
          },
        }, null, 2),
      };

    case 'mcpvot://tokens/vot':
      return {
        mimeType: 'application/json',
        content: JSON.stringify({
          name: 'VOT Token',
          symbol: 'VOT',
          address: CONTRACTS.VOT_TOKEN,
          chain: 'Base (8453)',
          decimals: 18,
          totalSupply: '1,000,000,000 VOT',
          description: 'Utility token for the MCPVOT ecosystem',
          uses: [
            'NFT minting rewards',
            'Share bonus rewards',
            'Trading incentives',
            'Governance participation',
          ],
          howToGet: [
            'Mint Beeper NFT → 69,420 VOT',
            'Share on Farcaster → 10,000 VOT bonus',
            'Buy MAXX → 10,000 VOT bonus',
            'Buy directly via x402 facilitator',
          ],
          links: {
            basescan: `https://basescan.org/token/${CONTRACTS.VOT_TOKEN}`,
            dexscreener: 'https://dexscreener.com/base/0xc1e1e7adfdf1553b339d8046704e8e37e2ca9b07',
          },
        }, null, 2),
      };

    case 'mcpvot://tokens/maxx':
      return {
        mimeType: 'application/json',
        content: JSON.stringify({
          name: 'MAXX Token',
          symbol: 'MAXX',
          address: CONTRACTS.MAXX_TOKEN,
          chain: 'Base (8453)',
          decimals: 18,
          description: 'Ecosystem governance and rewards token',
          bonus: '10,000 VOT with every MAXX purchase',
          links: {
            basescan: `https://basescan.org/token/${CONTRACTS.MAXX_TOKEN}`,
          },
        }, null, 2),
      };

    case 'mcpvot://nft/beeper':
      return {
        mimeType: 'application/json',
        content: JSON.stringify({
          name: 'Beeper NFT Collection',
          contract: CONTRACTS.BEEPER_NFT,
          standard: 'ERC-1155',
          mintPrice: '$0.25 USDC',
          votReward: '69,420 VOT',
          features: [
            'On-chain SVG artwork',
            'VRF-determined rarity',
            'Identity binding (FID/ENS)',
            'ERC-8004 web3:// compatible',
          ],
          rarityTiers: [
            { tier: 'x402', chance: '0.05%', color: 'Gold' },
            { tier: 'gm', chance: '0.15%', color: 'Rainbow' },
            { tier: 'fomo', chance: '0.30%', color: 'Red' },
            { tier: 'zzz', chance: '0.50%', color: 'Blue' },
            { tier: 'genesis', chance: '2%', color: 'Purple' },
            { tier: 'og', chance: '4%', color: 'Orange' },
            { tier: 'whale', chance: '8%', color: 'Cyan' },
            { tier: 'staker', chance: '15%', color: 'Green' },
            { tier: 'validator', chance: '25%', color: 'Yellow' },
            { tier: 'node', chance: '45%', color: 'Gray' },
          ],
          shareBonus: {
            amount: '10,000 VOT',
            requirements: [
              'Follow @mcpvot on Farcaster',
              'Cast about your mint with NFT image',
              'One claim per mint',
            ],
          },
        }, null, 2),
      };

    case 'mcpvot://x402/facilitator':
      return {
        mimeType: 'text/markdown',
        content: `# x402 Facilitator Guide

## What is x402?

x402 is a payment protocol that enables gasless USDC payments for AI agents and dApps.

## MCPVOT x402 Facilitator

- **Treasury**: \`${CONTRACTS.TREASURY}\`
- **Network**: Base Mainnet (8453)
- **Asset**: USDC (\`${CONTRACTS.USDC}\`)

## Payment Flow

1. **Request**: Call any paid endpoint
2. **402 Response**: Receive payment requirements
3. **Sign**: Create EIP-3009 USDC authorization
4. **Submit**: Include \`Payment-Signature\` header
5. **Receive**: Get result + VOT rewards

## API Endpoints

- **Discovery**: \`GET https://mcpvot.xyz/api/x402\`
- **Facilitator**: \`POST https://mcpvot.xyz/api/x402/facilitator\`
- **NFT Mint**: \`POST https://mcpvot.xyz/api/beeper/mint-with-payment\`

## Example Request

\`\`\`javascript
// 1. Get payment requirements
const req = await fetch('https://mcpvot.xyz/api/x402');
const { accepts } = await req.json();

// 2. Sign USDC authorization (EIP-3009)
const signature = await signTypedData({...});

// 3. Submit with payment
const result = await fetch('https://mcpvot.xyz/api/beeper/mint-with-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Payment-Signature': base64Encode(signature)
  },
  body: JSON.stringify({ walletAddress: '0x...' })
});
\`\`\`

## Pricing

| Service | Price | VOT Reward |
|---------|-------|------------|
| Beeper NFT Mint | $0.25 | 69,420 VOT |
| Share Bonus | FREE | 10,000 VOT |
| VOT Purchase | $1-100 | Market rate |
| MAXX Purchase | $1-100 | +10,000 VOT bonus |
| Intelligence Query | $0.03 | - |
`,
      };

    case 'mcpvot://pricing/all':
      return {
        mimeType: 'application/json',
        content: JSON.stringify({
          currency: 'USDC',
          network: 'Base',
          services: {
            beeperMint: {
              price: '0.25',
              votReward: '69420',
              description: 'Mint Beeper NFT with VRF rarity',
            },
            shareBonus: {
              price: '0.00',
              votReward: '10000',
              description: 'Claim bonus for sharing on Farcaster',
            },
            votPurchase: {
              options: [
                { price: '1.00', estimatedVot: '~100,000' },
                { price: '10.00', estimatedVot: '~1,000,000' },
                { price: '100.00', estimatedVot: '~10,000,000' },
              ],
            },
            maxxPurchase: {
              options: [
                { price: '1.00', votBonus: '10000' },
                { price: '10.00', votBonus: '10000' },
                { price: '100.00', votBonus: '10000' },
              ],
            },
            intelligence: {
              votQuery: { price: '0.03' },
              ecosystemData: { price: '0.03' },
              clankerIntel: { price: '0.30' },
            },
            freeEndpoints: [
              'get_burn_stats',
              'get_token_price',
              'get_ecosystem_status',
            ],
          },
        }, null, 2),
      };

    default:
      return null;
  }
}

// =============================================================================
// MCP PROTOCOL HANDLERS
// =============================================================================

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

function handleInitialize(): MCPResponse['result'] {
  return {
    protocolVersion: MCP_SERVER_INFO.protocolVersion,
    serverInfo: {
      name: MCP_SERVER_INFO.name,
      version: MCP_SERVER_INFO.version,
    },
    capabilities: {
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
    },
  };
}

function handleListTools(): MCPResponse['result'] {
  return { tools: MCP_TOOLS };
}

function handleListResources(): MCPResponse['result'] {
  return { resources: MCP_RESOURCES };
}

function handleReadResource(params: { uri: string }): MCPResponse['result'] {
  const content = getResourceContent(params.uri);
  if (!content) {
    throw { code: -32602, message: `Resource not found: ${params.uri}` };
  }
  return {
    contents: [
      {
        uri: params.uri,
        mimeType: content.mimeType,
        text: content.content,
      },
    ],
  };
}

async function handleCallTool(params: { name: string; arguments?: Record<string, unknown> }): Promise<MCPResponse['result']> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mcpvot.xyz';
  const args = params.arguments || {};
  
  // Validate tool name
  const toolName = sanitizeInput(params.name);
  
  // Validate wallet addresses in arguments
  if (args.walletAddress && !isValidAddress(args.walletAddress)) {
    throw { code: -32602, message: 'Invalid wallet address format' };
  }
  if (args.recipientAddress && !isValidAddress(args.recipientAddress)) {
    throw { code: -32602, message: 'Invalid recipient address format' };
  }
  
  switch (toolName) {
    case 'get_burn_stats':
      try {
        const res = await fetch(`${baseUrl}/api/burn-stats`);
        const data = await res.json();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch {
        return { content: [{ type: 'text', text: 'Error fetching burn stats' }], isError: true };
      }

    case 'get_token_price':
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: 'Use DexScreener or Birdeye for real-time prices',
            vot: {
              address: CONTRACTS.VOT_TOKEN,
              dexscreener: `https://dexscreener.com/base/${CONTRACTS.VOT_TOKEN}`,
            },
            maxx: {
              address: CONTRACTS.MAXX_TOKEN,
              dexscreener: `https://dexscreener.com/base/${CONTRACTS.MAXX_TOKEN}`,
            },
          }, null, 2),
        }],
      };

    case 'get_ecosystem_status':
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'operational',
            timestamp: new Date().toISOString(),
            chain: CHAIN,
            contracts: CONTRACTS,
            endpoints: {
              api: `${baseUrl}/api/x402`,
              mcp: `${baseUrl}/api/mcp`,
              health: `${baseUrl}/api/health`,
            },
          }, null, 2),
        }],
      };

    case 'mint_beeper_nft':
    case 'buy_vot_tokens':
    case 'buy_maxx_tokens':
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: 'This tool requires x402 payment',
            paymentRequired: true,
            endpoint: params.name === 'mint_beeper_nft' 
              ? `${baseUrl}/api/beeper/mint-with-payment`
              : `${baseUrl}/api/x402/facilitator`,
            x402Discovery: `${baseUrl}/api/x402`,
            instructions: [
              '1. GET /api/x402 to get payment requirements',
              '2. Sign EIP-3009 USDC authorization',
              '3. POST with Payment-Signature header',
            ],
            params: params.arguments,
          }, null, 2),
        }],
      };

    case 'claim_share_bonus':
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: 'Share bonus claim endpoint',
            endpoint: `${baseUrl}/api/beeper/claim-share-bonus`,
            requirements: [
              'Must have minted a Beeper NFT',
              'Must follow @mcpvot on Farcaster',
              'Must have cast about the mint',
            ],
            params: params.arguments,
          }, null, 2),
        }],
      };

    default:
      throw { code: -32601, message: `Unknown tool: ${params.name}` };
  }
}

// =============================================================================
// HTTP HANDLERS
// =============================================================================

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Input validation for wallet addresses
function isValidAddress(address: unknown): address is string {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Sanitize string inputs
function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>\"\']/g, '').slice(0, 1000);
}

export async function GET() {
  // Return server info and capabilities for discovery
  return NextResponse.json({
    ...MCP_SERVER_INFO,
    capabilities: {
      tools: MCP_TOOLS.map(t => ({ name: t.name, description: t.description })),
      resources: MCP_RESOURCES.map(r => ({ uri: r.uri, name: r.name })),
    },
    endpoints: {
      mcp: 'POST /api/mcp (JSON-RPC)',
      discovery: 'GET /api/x402',
      manifest: '/.well-known/mcp-manifest.json',
    },
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32000, message: 'Rate limit exceeded. Max 60 requests per minute.' },
      } as MCPResponse, { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
        }
      });
    }

    const body = await request.json() as MCPRequest;
    
    // Validate JSON-RPC structure
    if (body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body?.id || null,
        error: { code: -32600, message: 'Invalid JSON-RPC request' },
      } as MCPResponse, { status: 400 });
    }
    
    let result: unknown;
    
    switch (body.method) {
      case 'initialize':
        result = handleInitialize();
        break;
      case 'tools/list':
        result = handleListTools();
        break;
      case 'resources/list':
        result = handleListResources();
        break;
      case 'resources/read':
        result = handleReadResource(body.params as { uri: string });
        break;
      case 'tools/call':
        result = await handleCallTool(body.params as { name: string; arguments?: Record<string, unknown> });
        break;
      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          error: { code: -32601, message: `Method not found: ${body.method}` },
        } as MCPResponse, { status: 400 });
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id: body.id,
      result,
    } as MCPResponse, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const err = error as { code?: number; message?: string };
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: err.code || -32603,
        message: err.message || 'Internal error',
      },
    } as MCPResponse, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
