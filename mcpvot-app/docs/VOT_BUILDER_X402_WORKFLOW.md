# VOT Builder x402 Facilitator Workflow

> **Last Updated:** June 2025  
> **Status:** Production Ready  
> **Commit:** 6f83342

## Overview

The VOT Builder is an x402 v2.0.0 compliant facilitator that enables AI agents and users to create personalized IPFS-hosted HTML pages through a simple API. Each mint costs $1.00 USDC and rewards 69,420 VOT tokens.

## Compliance Status

| Standard | Status | File |
|----------|--------|------|
| x402 v2.0.0 | ✅ Compliant | `public/.well-known/x402.json` |
| ERC-8004 | ✅ Compliant | `public/.well-known/agent-registration.json` |
| MCP Tools | ✅ Defined | `public/.well-known/mcp-manifest.json` |

---

## Agent/LLM Interface

### Simple Request (All Auto-Generated)

For AI agents, the simplest possible request:

```typescript
// POST /api/x402/mint-builder-nft
{
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f..."
}
```

That's it! Everything else is auto-generated:
- **category**: Random from 14 templates
- **colorTheme**: Matching theme color
- **contentType**: Default "builder-site"

### Custom Request

For agents/users who want control:

```typescript
{
  "userAddress": "0x...",
  "category": "defi",           // Optional: vot, warplet, ens, defi, gaming, minimal, maxx, farcaster, base, burn, x402, mcpvot, ai, cyberpunk
  "colorTheme": "#00FF00",      // Optional: Hex color
  "customTitle": "My Dashboard" // Optional: Page title
}
```

### Response Format

```typescript
{
  "success": true,
  "requestId": "req_abc123",
  "ipfsCid": "bafybeie...",
  "previewUrl": "https://ipfs.io/ipfs/bafybeie...",
  "gatewayUrls": [
    "https://ipfs.io/ipfs/bafybeie...",
    "https://w3s.link/ipfs/bafybeie...",
    "https://gateway.pinata.cloud/ipfs/bafybeie..."
  ],
  "transactionData": {
    "to": "0x...",
    "value": "1000000", // 1.00 USDC
    "data": "0x..."
  },
  "tokenId": 69420,
  "votReward": "69420000000000000000000" // 69,420 VOT
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VOT Builder Workflow                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Agent/User                                                  │
│      │                                                       │
│      ▼                                                       │
│  ┌───────────────────┐                                       │
│  │ /api/x402/mint-   │  Rate Limit Check (Postgres)         │
│  │ builder-nft       │◄─────────────────────────────────────┤
│  │ (route.ts)        │  1 req/wallet/60s + 10 req/min       │
│  └───────────────────┘                                       │
│      │                                                       │
│      ▼                                                       │
│  ┌───────────────────┐                                       │
│  │ mintQueue.ts      │  FIFO Queue                          │
│  │ (464 lines)       │  3-second intervals                  │
│  │                   │  Max 100 pending                     │
│  └───────────────────┘                                       │
│      │                                                       │
│      ▼                                                       │
│  ┌───────────────────┐                                       │
│  │ vot-html-page.ts  │  HTML Generator                      │
│  │ (1877 lines)      │  14 category templates               │
│  │                   │  Boot sequences, CRT effects         │
│  └───────────────────┘                                       │
│      │                                                       │
│      ▼                                                       │
│  ┌───────────────────┐                                       │
│  │ mintExecutor.ts   │  IPFS Pinning                        │
│  │ (557 lines)       │  Fallback: MCP→W3S→Pinata→Mock      │
│  └───────────────────┘                                       │
│      │                                                       │
│      ▼                                                       │
│  ┌───────────────────┐                                       │
│  │ IPFS Gateway      │  Content Delivered                   │
│  │ + VOT Contract    │  69,420 VOT rewarded                 │
│  └───────────────────┘                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/api/x402/mint-builder-nft/route.ts` | 352 | API endpoint orchestration |
| `src/lib/x402/mintQueue.ts` | 464 | FIFO queue with rate limiting |
| `src/lib/x402/mintExecutor.ts` | 557 | IPFS pinning + contract calls |
| `src/lib/x402/vot-html-page.ts` | 1877 | HTML template generator |
| `src/lib/x402/dbStore.ts` | ~120 | Neon PostgreSQL persistence |
| `src/lib/x402/rateLimit.ts` | ~100 | Async rate limiting |

---

## 14 Category Templates

Each category has unique:
- Boot sequence messages
- Color themes
- Visual effects
- Footer quotes

| Category | Theme | Boot Message |
|----------|-------|--------------|
| `vot` | #FFD700 | "VOT MACHINE PROTOCOL v4.2.0" |
| `warplet` | #00BFFF | "WARPLET GATEWAY v3.1.0" |
| `ens` | #5B9BD5 | "ENS IDENTITY PROTOCOL v2.0.0" |
| `defi` | #00FF00 | "DEFI MATRIX v5.0.0" |
| `gaming` | #FF6600 | "GAMING NODE v4.0.0" |
| `minimal` | #FFFFFF | "MINIMAL CORE v1.0.0" |
| `maxx` | #FF0000 | "MAXX PROTOCOL v6.6.6" |
| `farcaster` | #8B5CF6 | "FARCASTER NODE v3.0.0" |
| `base` | #0052FF | "BASE PROTOCOL v4.0.0" |
| `burn` | #FF4500 | "BURN PROTOCOL v6.6.6" |
| `x402` | #00CED1 | "X402 FACILITATOR v2.0.0" |
| `mcpvot` | #9400D3 | "MCP VOT MESH v4.0.0" |
| `ai` | #00FF88 | "AI NEURAL CORE v5.0.0" |
| `cyberpunk` | #FF00FF | "CYBERPUNK GRID v2077" |

---

## Rate Limiting

### Per-Wallet Limit
- **Rate:** 1 request per 60 seconds
- **Storage:** Neon PostgreSQL
- **Key:** `rate_limit:{walletAddress}`

### Global Limit
- **Rate:** 10 requests per minute
- **Storage:** Neon PostgreSQL
- **Key:** `rate_limit:global`

### Health Check
```bash
GET /api/x402/health
```
Returns: Database status, queue length, rate limit stats

---

## IPFS Fallback Chain

Priority order for IPFS pinning:

1. **Local MCP Server** (`ipfs-mcp`) - Fastest
2. **Web3.Storage** - Reliable, free tier
3. **Pinata** - Enterprise fallback
4. **Mock CID** - Development/testing only

---

## Environment Variables

```env
# Database (Required)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# IPFS (At least one required for production)
WEB3_STORAGE_TOKEN=your_token_here
PINATA_JWT=your_jwt_here

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## Discovery Endpoints

### x402 Discovery
```
GET https://your-domain/.well-known/x402.json
```

### ERC-8004 Agent Registration
```
GET https://your-domain/.well-known/agent-registration.json
```

### MCP Tool Manifest
```
GET https://your-domain/.well-known/mcp-manifest.json
```

---

## Related MCP Memories

| Memory ID | Description |
|-----------|-------------|
| #374 | VOT Builder vs Beeper NFT distinction |
| #375 | Deep analysis (3,250 lines, 4 core files) |
| #376 | Improvement recommendations |
| #377 | Complete implementation report |

---

## Git History

```bash
# Latest improvements
6f83342 feat: Add Neon PostgreSQL for persistent rate limiting
a7267d6 fix: Wallet modal scroll for mobile devices
```

---

## Future Improvements

1. **Queue Persistence** - Store queue state in Postgres
2. **Token Counter Sync** - Read from contract's `totalMinted()`
3. **Exponential Backoff** - For IPFS retry logic
4. **Vercel Cron** - Background queue processing

---

## Testing

```bash
# Health check
curl https://your-domain/api/x402/health

# Simple mint (auto-generated)
curl -X POST https://your-domain/api/x402/mint-builder-nft \
  -H "Content-Type: application/json" \
  -d '{"userAddress": "0x..."}'

# Custom mint
curl -X POST https://your-domain/api/x402/mint-builder-nft \
  -H "Content-Type: application/json" \
  -d '{"userAddress": "0x...", "category": "defi", "colorTheme": "#00FF00"}'
```

---

*Documentation auto-generated from codebase analysis. See MCP Memory #377 for session details.*
