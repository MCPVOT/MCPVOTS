# MCPVOT Official Addresses

> **Last Updated**: December 12, 2025
> **Network**: Base Mainnet (Chain ID: 8453)

## Core Addresses

### VOT Token Contract

```
0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07
```

- **Type**: ERC-20 Token
- **Network**: Base Mainnet
- **DEXScreener**: [View Chart](https://dexscreener.com/base/0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07)
- **Basescan**: [View Contract](https://basescan.org/token/0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07)

### MCPVOT Treasury Wallet

```
0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa
```

- **ENS Names**: mcpvot.eth, mcpvot.base.eth
- **Role**: Main treasury, x402 facilitator, payment receiver
- **Basescan**: [View Address](https://basescan.org/address/0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa)

### Base App Admin Wallet

```
0xE50bb117e56F1387EAf7A81363E628Ca941c08Fd
```

- **Role**: Farcaster Mini App association, Base Builder owner
- **FID**: 1396524
- **Domain**: mcpvot.xyz

## Base Name Resolution Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| Base L2 Resolver | `0xC6d566A56A1aFf6508b41f6c90ff131615583BCD` | Stores name records (forward & reverse) |
| Reverse Registrar | `0x79EA96012eEa67A83431F1701B3dFf7e37F9E282` | Computes reverse nodes for addresses |
| Base Registrar (NFT) | `0x03c4738Ee98aE44591e1A4A4F3CaB6641d95DD9a` | ERC-721 for .base.eth ownership |

> **Note**: Base uses `ReverseRegistrar.node(address)` instead of standard ENS namehash for reverse resolution. See [BASENAME_RESOLUTION_GUIDE.md](./BASENAME_RESOLUTION_GUIDE.md) for details.

## Supporting Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Payment token |
| WETH | `0x4200000000000000000000000000000000000006` | Wrapped ETH |
| Uniswap V3 Router | `0x2626664c2603336E57B271c5C0b26F421741e481` | Token swaps |
| Warpcast Whitelist NFT | `0x699727F9E01A822EFdcf7333073f0461e5914b4E` | First NFT collection |

## DEXScreener Pool

```
0xb7730dd50a401a0e57c7438e6d532b6aeccea33254834f4ebfe8311e46f2ce2c
```

- **Pair**: VOT/USDC
- **DEX**: Uniswap V3 on Base

## Dune Analytics

- **Query ID**: 6177826
- **Purpose**: VOT Burns Tracker
- **Token Address**: `0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07`

## Deprecated Addresses (DO NOT USE)

| Address | Reason |
|---------|--------|
| `0xFB7a83abe4F4A4E51c77B92E521390B769ff6467` | Old MAXX token - DEPRECATED |
| `0xbac9496721798FF67A45612769fa0d04Ceb22B07` | Old VOT address - DEPRECATED |

## Environment Variables

```bash
# VOT Token
NEXT_PUBLIC_VOT_TOKEN_ADDRESS=0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07
VOT_TOKEN_ADDRESS=0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07
NEXT_PUBLIC_VOT_CONTRACT=0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07

# Treasury
TREASURY_WALLET=0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa
RESOURCE_WALLET_ADDRESS=0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa
X402_FACILITATOR_CONTRACT=0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa

# Supporting
USDC_BASE_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
WETH_BASE_ADDRESS=0x4200000000000000000000000000000000000006
UNISWAP_V3_ROUTER=0x2626664c2603336E57B271c5C0b26F421741e481

# DEXScreener
DEXSCREENER_PAIR_ADDRESS=0xb7730dd50a401a0e57c7438e6d532b6aeccea33254834f4ebfe8311e46f2ce2c
VOT_PRICE_PAIR_ADDRESS=0xb7730dd50a401a0e57c7438e6d532b6aeccea33254834f4ebfe8311e46f2ce2c

# Dune
DUNE_VOT_BURNS_QUERY_ID=6177826
```

## TypeScript Constants

```typescript
// src/lib/constants.ts
export const ADDRESSES = {
  // Core
  VOT_TOKEN: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07' as const,
  TREASURY: '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa' as const,
  BASE_ADMIN: '0xE50bb117e56F1387EAf7A81363E628Ca941c08Fd' as const,
  
  // Supporting
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
  WETH: '0x4200000000000000000000000000000000000006' as const,
  UNISWAP_V3_ROUTER: '0x2626664c2603336E57B271c5C0b26F421741e481' as const,
  
  // NFT
  WARPCAST_WHITELIST: '0x699727F9E01A822EFdcf7333073f0461e5914b4E' as const,
  
  // Burn address
  DEAD: '0x0000000000000000000000000000000000000000' as const,
} as const;

export const DEXSCREENER = {
  PAIR_ADDRESS: '0xb7730dd50a401a0e57c7438e6d532b6aeccea33254834f4ebfe8311e46f2ce2c',
  API_URL: 'https://api.dexscreener.com/latest/dex/pairs/base/',
} as const;

export const DUNE = {
  VOT_BURNS_QUERY_ID: 6177826,
  API_URL: 'https://api.dune.com/api/v1/query/',
} as const;
```

---

*MCPVOT Ecosystem - Official Address Reference*
