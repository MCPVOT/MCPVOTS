# Basename Resolution Guide

## Overview

This document describes how MCPVOT resolves Base Names (`.base.eth`) for wallet addresses. The resolution system is optimized for Vercel deployment with fast response times.

## Key Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| Base L2 Resolver | `0xC6d566A56A1aFf6508b41f6c90ff131615583BCD` | Stores name records |
| Reverse Registrar | `0x79EA96012eEa67A83431F1701B3dFf7e37F9E282` | Computes reverse nodes |

## Resolution Method

Base uses a **different reverse resolution pattern** than standard ENS:

### Standard ENS (Mainnet)
```
reverseNode = namehash(address.addr.reverse)
```

### Base L2 (Correct Method)
```typescript
// Step 1: Get the reverse node from ReverseRegistrar
const node = await ReverseRegistrar.node(address);

// Step 2: Query the L2Resolver with that node
const name = await L2Resolver.name(node);
```

## API Endpoints

### `/api/resolve-basename`

Fast basename and ENS resolution endpoint.

**Parameters:**
- `address` (required): Ethereum address (0x...)
- `force` (optional): Clear cache before resolving
- `fast` (optional, default: true): Use fast direct viem calls
- `debug` (optional): Return full resolution trace

**Example Request:**
```
GET /api/resolve-basename?address=0x824ea259c1e92f0c5dc1d85dcbb80290b90be7fa&force=true
```

**Example Response:**
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

## Implementation Files

### `src/lib/svg-machine/templates/user-data-fetcher.ts`

Contains the `fetchBasenameDirect()` function for fast resolution:

```typescript
async function fetchBasenameDirect(address: string): Promise<string | undefined> {
  const TIMEOUT_MS = 5000;
  
  // Step 1: Get reverse node
  const node = await baseClient.readContract({
    address: CONTRACTS.BASE_REVERSE_REGISTRAR,
    abi: reverseRegistrarAbi,
    functionName: 'node',
    args: [address as `0x${string}`],
  });
  
  // Step 2: Get name from resolver
  const name = await baseClient.readContract({
    address: CONTRACTS.BASE_L2_RESOLVER,
    abi: resolverAbi,
    functionName: 'name',
    args: [node],
  });
  
  return name;
}
```

### `src/lib/baseNameUtils.ts`

Full-featured basename resolution with multiple fallbacks:
- Direct RPC via ReverseRegistrar.node()
- OnchainKit getName()
- External API fallbacks (basenames.com, web3.bio, etc.)
- Caching with configurable TTL

### `src/app/api/resolve-basename/route.ts`

API endpoint with:
- Fast mode (direct viem calls)
- Full mode (all fallbacks)
- Debug mode (full trace)
- Parallel ENS resolution

## Common Issues

### Issue: Basename not resolving despite being registered

**Cause:** The name is registered (NFT owned) but records not set.

**Solution:** Go to https://www.base.org/names and click "Set as Primary Name"

This sets both:
1. Forward resolution: name → address
2. Reverse resolution: address → name

### Issue: API timing out

**Cause:** Slow RPC endpoints or external APIs.

**Solution:** The fast mode uses direct viem calls with 4-5s timeouts:
- ReverseRegistrar.node() is a `pure` function (no network call needed for computation)
- L2Resolver.name() is a single RPC call

### Issue: Wrong name returned

**Cause:** Standard ENS namehash being used instead of ReverseRegistrar.node()

**Solution:** Always use the two-step resolution:
1. `ReverseRegistrar.node(address)` → gets the correct reverse node
2. `L2Resolver.name(node)` → gets the name

## Environment Variables

```env
# RPC Endpoints (optional - defaults to public endpoints)
BASE_RPC_URL=https://mainnet.base.org
MAINNET_RPC_URL=https://ethereum-rpc.publicnode.com

# Cache Configuration (optional)
BASENAME_CACHE_DURATION_MS=300000      # 5 minutes for positive cache
BASENAME_NEGATIVE_CACHE_DURATION_MS=60000  # 1 minute for negative cache
BASENAME_ONCHAINKIT_TIMEOUT_MS=5000    # OnchainKit timeout
```

## Testing

```bash
# Test fast resolution
curl "http://localhost:3000/api/resolve-basename?address=0x824ea259c1e92f0c5dc1d85dcbb80290b90be7fa"

# Force cache refresh
curl "http://localhost:3000/api/resolve-basename?address=0x824ea259c1e92f0c5dc1d85dcbb80290b90be7fa&force=true"

# Debug mode (full trace)
curl "http://localhost:3000/api/resolve-basename?address=0x824ea259c1e92f0c5dc1d85dcbb80290b90be7fa&debug=true"
```

## Related Documentation

- [ENS Integration Guide](./ENS_IPFS_ETHGAS_INTEGRATION.md)
- [API Endpoints Guide](./API_ENDPOINTS_GUIDE.md)
- [Addresses Reference](./ADDRESSES.md)

---

*Last Updated: December 12, 2025*
*MCP Memory ID: 283*
