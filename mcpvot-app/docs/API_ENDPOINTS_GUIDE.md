# MCPVOT API Endpoints Guide

**Last Updated:** December 12, 2025  
**Version:** 2.1  
**MCP Memory Reference:** #235 (Zapper + Farcaster Integration), #283 (Basename Resolution)

---

## Overview

This document provides comprehensive documentation for all MCPVOT API endpoints, including the new Zapper-powered Farcaster integration, VOT burn statistics APIs, and basename resolution.

## Table of Contents

1. [Identity Resolution](#identity-resolution)
2. [x402 Endpoints](#x402-endpoints)
3. [Farcaster Intelligence API](#farcaster-intelligence-api)
4. [Zapper Integration](#zapper-integration)
5. [VOT Burn Statistics](#vot-burn-statistics)
6. [Authentication & Headers](#authentication--headers)
7. [Rate Limits](#rate-limits)

---

## Identity Resolution

### `/api/resolve-basename` - Fast Basename & ENS Resolution

**Purpose:** Resolves Base Names (.base.eth) and ENS names (.eth) for any Ethereum address. Optimized for Vercel with fast response times (~670ms).

#### GET Request

```bash
# Fast mode (default) - parallel basename + ENS resolution
curl "https://mcpvot.xyz/api/resolve-basename?address=0x824ea259c1e92f0c5dc1d85dcbb80290b90be7fa"

# Force cache refresh
curl "https://mcpvot.xyz/api/resolve-basename?address=0x...&force=true"

# Debug mode (full resolution trace)
curl "https://mcpvot.xyz/api/resolve-basename?address=0x...&debug=true"
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | Yes | Ethereum address (0x...) |
| `force` | boolean | No | Clear cache before resolving |
| `fast` | boolean | No | Use fast direct viem calls (default: true) |
| `debug` | boolean | No | Return full resolution trace |

#### Response Schema

```typescript
interface ResolveBasenameResponse {
  address: string;           // Normalized address
  baseName: string | null;   // e.g., "mcpvot.base.eth"
  ensName: string | null;    // e.g., "mcpvot.eth"
  displayName: string;       // Primary name or shortened address
  mode: 'fast' | 'full';     // Resolution mode used
  resolvedIn: string;        // e.g., "670ms"
  timestamp: string;         // ISO timestamp
}
```

#### Example Response

```json
{
  "address": "0x824ea259c1e92f0c5dc1d85dcbb80290b90be7fa",
  "baseName": "mcpvot.base.eth",
  "ensName": "mcpvot.eth",
  "displayName": "mcpvot.base.eth",
  "mode": "fast",
  "resolvedIn": "670ms",
  "timestamp": "2025-12-12T20:30:00.000Z"
}
```

#### Technical Notes

Base uses `ReverseRegistrar.node(address)` instead of standard ENS namehash:

```typescript
// Step 1: Get reverse node
const node = await ReverseRegistrar.node(address);

// Step 2: Get name from L2 resolver  
const name = await L2Resolver.name(node);
```

**Contracts Used:**
- L2 Resolver: `0xC6d566A56A1aFf6508b41f6c90ff131615583BCD`
- Reverse Registrar: `0x79EA96012eEa67A83431F1701B3dFf7e37F9E282`

---

## x402 Endpoints

### `/api/x402/burn-stats` - VOT Burn Statistics

**Purpose:** Returns comprehensive VOT burn statistics from Dune Analytics with tokenomics data.

#### GET Request

```bash
curl https://mcpvot.xyz/api/x402/burn-stats
```

#### Response Schema

```typescript
interface BurnStatsResponse {
  success: boolean;
  data: {
    totalBurned: string;      // Total VOT burned (formatted)
    burnCount: number;        // Number of burn transactions
    burnRate: string;         // Average burn per transaction
    averageBurnSize: string;  // Formatted average
    burned24h: string;        // Last 24 hours
    burned7d: string;         // Last 7 days
    burned30d: string;        // Last 30 days
    tokenomics: {
      totalSupply: string;
      lpAllocation: string;     // 70%
      vaultAllocation: string;  // 30%
      feeStructure: string;     // 1.2%
      burnPerX402: string;      // 1%
    };
    facilitatorStats: {
      totalTransactions: number;
      totalUsdVolume: string;
      totalVotDistributed: string;
    };
    lastUpdated: string;
  };
  source: 'dune';
  cached: boolean;
}
```

#### POST Request (Log Burn Event)

```bash
curl -X POST https://mcpvot.xyz/api/x402/burn-stats \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0x...",
    "amount": "1000000000000000000000",
    "burner": "0x...",
    "timestamp": 1737000000000
  }'
```

### `/api/x402/burns` - Raw Burn Data

**Purpose:** Returns raw burn transaction data from Dune Analytics.

```bash
curl https://mcpvot.xyz/api/x402/burns
```

### `/api/x402/order` - Create VOT Order

**Purpose:** Generate a VOT purchase quote and order intent.

```bash
curl "https://mcpvot.xyz/api/x402/order?usdAmount=5"
```

---

## Farcaster Intelligence API

### `/api/farcaster/intelligence` - Unified Farcaster Intelligence

**Purpose:** Single endpoint for all Farcaster-related data including profiles, portfolios, rankings, and VOT holder verification.

**Base URL:** `https://mcpvot.xyz/api/farcaster/intelligence`

#### Query Types

| Type | Description | Required Params |
|------|-------------|-----------------|
| `profile` | Farcaster profile with badges | `fid` |
| `portfolio` | Full token portfolio | `fid` |
| `token-rankings` | Top tokens by social signal | - |
| `nft-rankings` | Top NFT collections | - |
| `rankings` | Combined token + NFT rankings | - |
| `multiplier` | Calculate holder multiplier | `address` OR `fid` |
| `vot-check` | Check VOT holding status | `address` |
| `full` | Complete profile + portfolio | `fid` |

#### Examples

**Get Farcaster Profile:**
```bash
curl "https://mcpvot.xyz/api/farcaster/intelligence?type=profile&fid=3"
```

**Get Portfolio by FID:**
```bash
curl "https://mcpvot.xyz/api/farcaster/intelligence?type=portfolio&fid=3"
```

**Get Token Rankings:**
```bash
curl "https://mcpvot.xyz/api/farcaster/intelligence?type=token-rankings&limit=25"
```

**Get NFT Rankings:**
```bash
curl "https://mcpvot.xyz/api/farcaster/intelligence?type=nft-rankings&limit=25"
```

**Calculate Holder Multiplier:**
```bash
# By address
curl "https://mcpvot.xyz/api/farcaster/intelligence?type=multiplier&address=0x..."

# By FID
curl "https://mcpvot.xyz/api/farcaster/intelligence?type=multiplier&fid=3"
```

**Check VOT Holding:**
```bash
curl "https://mcpvot.xyz/api/farcaster/intelligence?type=vot-check&address=0x..."
```

**Full Profile + Portfolio:**
```bash
curl "https://mcpvot.xyz/api/farcaster/intelligence?type=full&fid=3"
```

#### Response: Profile

```typescript
interface ProfileResponse {
  success: true;
  type: 'profile';
  data: {
    fid: number;
    username: string;
    displayName: string;
    bio: string;
    avatar: string;
    followers: number;
    following: number;
    badges: {
      isFarcon2024: boolean;
      isCreator: boolean;
      isHolder: boolean;
      isPremium: boolean;
      isOg: boolean;
    };
    connectedAddresses: string[];
  };
}
```

#### Response: Multiplier

```typescript
interface MultiplierResponse {
  success: true;
  type: 'multiplier';
  data: {
    multiplier: {
      base: number;      // 1.0
      farcaster: number; // +0.5
      vot: number;       // +1.0
      maxx: number;      // +0.5
      ens: number;       // +0.25
      basename: number;  // +0.25
      total: number;     // Sum
    };
    holdings: {
      hasVOT: boolean;
      hasMAXX: boolean;
      votBalance: string;
      maxxBalance: string;
    };
    identity: {
      hasFarcaster: boolean;
      hasENS: boolean;
      hasBasename: boolean;
      fid?: number;
      ens?: string;
      basename?: string;
    };
  };
}
```

---

## Zapper Integration

### Service Library: `lib/zapper-service.ts`

The Zapper service provides direct access to Zapper's GraphQL API for:

- **Farcaster Profiles** - Full user data with social badges
- **Portfolios** - Token holdings across all chains  
- **Token Rankings** - Social signal-based token rankings
- **NFT Rankings** - Collection rankings by popularity

#### Usage in Code

```typescript
import zapperService from '@/lib/zapper-service';

// Get Farcaster profile
const profile = await zapperService.getFarcasterProfile(3);

// Get portfolio by FID
const portfolio = await zapperService.getFarcasterPortfolio(3);

// Get portfolio by address
const portfolio2 = await zapperService.getPortfolio('0x...');

// Get token rankings
const tokens = await zapperService.getTokenRankings(25);

// Get NFT rankings  
const nfts = await zapperService.getNFTRankings(25);

// Check VOT holding
const hasVOT = await zapperService.checkVOTHolding('0x...');

// Calculate multiplier
const multiplier = await zapperService.getHolderMultiplier('0x...');
```

#### GraphQL Endpoint

```
POST https://public.zapper.xyz/graphql
```

No API key required for basic queries.

---

## VOT Burn Statistics

### Data Sources

1. **Dune Analytics** (Primary)
   - Query ID: `6177826`
   - Updates: ~10 minute cache
   - Data: All burn transactions

2. **SQLite** (Secondary)
   - Local database backup
   - Faster queries
   - Sync'd from Dune

### Tokenomics Data

| Metric | Value |
|--------|-------|
| Total Supply | 100,000,000 VOT |
| LP Allocation | 70% |
| Vault Allocation | 30% |
| Fee Structure | 1.2% |
| Burn per x402 | 1% |
| Vault Unlock | 2025-11-18 |

### Contract Addresses

| Contract | Address |
|----------|---------|
| VOT Token | `0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07` |
| MAXX Token | `0xFB7a83abe4F4A4E51c77B92E521390B769ff6467` |
| x402 Facilitator | `0x8fAE8FB324900E45BaAd4867fd945De204da2DA4` |
| VOT/WETH Pool | `0xb7730dd50a401a0e57c7438e6d532b6aeccea33254834f4ebfe8311e46f2ce2c` |

---

## Pages & UI

### `/mint` - VOT Machine x402 Mint Experience ⭐ NEW

**Purpose:** Unified mint page for x402 Facilitator NFT minting experience.

**URL:** `https://mcpvot.xyz/mint`

**Platforms:**
- ✅ Farcaster Frame / Mini-App (mobile-first)
- ✅ Base Network Native (chain 8453)
- ✅ Web Desktop (responsive)
- ✅ Mobile Web (PWA-ready)

**Features:**
- Connect wallet (Coinbase Smart Wallet / Farcaster)
- Identity aggregation (Farcaster + ENS + Basename)
- 6-trait system visualization
- 8-tier badge system
- Real-time VOT quote (20s expiry)
- Step-by-step mint progress
- $1 USDC → VOT + NFT flow
- 1% auto-burn visualization

**MCP Memory:** #237, #233, #226

### `/tokenomics` - VOT Tokenomics Dashboard

**Purpose:** Visual dashboard showing VOT burn statistics, supply metrics, fee structure, and x402 protocol details.

**Features:**
- Real-time burn tracking
- Supply distribution charts
- Fee breakdown
- Timeline visualization
- Mobile-first responsive design
- Farcaster Frame ready

### `/rankings` - Social Rankings

**Purpose:** Token and NFT rankings powered by Zapper's social signal data.

**Features:**
- Token rankings by social activity
- NFT collection rankings
- FID-personalized data
- Pagination support
- Search by FID

---

## Authentication & Headers

### Public Endpoints (No Auth Required)

- `GET /api/x402/burn-stats`
- `GET /api/x402/burns`
- `GET /api/farcaster/intelligence`

### Protected Endpoints (API Key Required)

- `POST /api/x402/burn-stats` - Requires internal API key
- `POST /api/x402/order` - Payment verification

### Headers

```typescript
{
  'Content-Type': 'application/json',
  'X-API-Key': process.env.INTERNAL_API_KEY, // For protected endpoints
  'X-Farcaster-FID': '12345' // Optional: User's FID for personalization
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/farcaster/intelligence` | 100 | 1 minute |
| `/api/x402/burn-stats` | 60 | 1 minute |
| `/api/x402/order` | 30 | 1 minute |

### Caching

- Burn stats: 10 minute cache
- Token rankings: 5 minute cache
- NFT rankings: 5 minute cache
- Farcaster profiles: 2 minute cache

---

## Adaptive Multiplier System

The multiplier system rewards ecosystem participation:

| Factor | Multiplier |
|--------|------------|
| Base | 1.0x |
| Farcaster Account | +0.5x |
| VOT Holder | +1.0x |
| MAXX Holder | +0.5x |
| ENS Name | +0.25x |
| Basename | +0.25x |
| **Maximum** | **3.5x** |

### Calculation Example

```typescript
// User with Farcaster + VOT + Basename
const multiplier = {
  base: 1.0,
  farcaster: 0.5,
  vot: 1.0,
  maxx: 0.0,
  ens: 0.0,
  basename: 0.25,
  total: 2.75
};
```

---

## Error Handling

All endpoints return consistent error responses:

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `MISSING_PARAMS` | Required parameters missing |
| `INVALID_TYPE` | Unknown query type |
| `RATE_LIMITED` | Too many requests |
| `EXTERNAL_API_ERROR` | Upstream API failure |
| `NOT_FOUND` | Resource not found |

---

## Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Cyan | `#00FFFF` | Primary accent, headers, buttons, borders |
| Green | `#00FF88` | Success states, active traits, confirmations |
| Orange | `#FF8800` | Warnings, burn stats, alerts |
| Purple | `#9F7AEA` | Farcaster elements, special sections |
| White | `#FFFFFF` | Primary text |
| Gray | `#6b7280` | Disabled, secondary text |

### CSS Classes (from globals.css)

```css
/* Terminal panel */
.bg-black/80 border-2 border-[#00FFFF]/40 rounded backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,255,0.2)]

/* Glow effects */
.drop-shadow-[0_0_20px_rgba(0,255,255,0.6)]
.shadow-[0_0_30px_rgba(0,255,136,0.2)]

/* Typography */
.font-mono .uppercase .tracking-wider

/* Scanlines overlay */
.bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,255,255,0.03)_50%)] bg-[size:100%_4px]

/* Grid pattern */
.bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-[size:4rem_4rem]
```

### Components

| Component | Purpose |
|-----------|---------|
| `ThreeBackground` | 3D particle background |
| `VOTLogoSVG` | Logo with glow effects |
| `ScanlineOverlay` | Terminal scanline + grid |
| `GlyphBackground` | Animated Sumerian glyphs |

### MCP Memory Reference

| ID | Content |
|----|---------|
| #238 | VOT Machine Mint Page Style Redesign |
| #237 | VOT Machine Mint Page |
| #236 | API Documentation Update |
| #235 | Zapper + Farcaster Integration |
| #233 | VOT Machine v3.0 |
| #232 | Sumerian Glyph Codex |
| #226 | NFT Architecture |
| #225 | 8-Tier System |

---

## MCP Memory Integration

All API responses can be stored in MCP memory for analysis:

```typescript
import { mcp_maxx_memory_store_memory } from '@/lib/mcp';

// Store API response
await mcp_maxx_memory_store_memory({
  content: JSON.stringify(response),
  vector: generateEmbedding(response),
  category: 'api_response',
  metadata: {
    endpoint: '/api/farcaster/intelligence',
    type: 'profile',
    timestamp: Date.now()
  }
});
```

---

## Related Documentation

- [MCP Memory Update](./MCP_MEMORY_UPDATE.md)
- [Farcaster Integration](./FARCASTER_INTEGRATION.md)
- [x402 Protocol](./X402_INTEGRATION.md)
- [VOT Burn Tracking](./VOT_BURN_TRACKING.md)

---

*This documentation is part of the MCPVOT ecosystem. For support, visit our Farcaster channel or Discord.*

