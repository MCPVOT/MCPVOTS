# VOT Builder Deployment Plan

> **Last Updated:** December 27, 2025  
> **Status:** Planning Phase  
> **MCP Memory:** #381 (this plan), #380 (audit report)

---

## 🎯 Deployment Sequence (Critical Path)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VOT BUILDER DEPLOYMENT PIPELINE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: Infrastructure (Required First)                                   │
│  ─────────────────────────────────────────                                  │
│  ┌─────────────────────┐                                                    │
│  │ 1. CCIP-Read Gateway │ ← /api/gateway/route.ts (already created)        │
│  │    (Next.js API)     │   Vercel deployment ready                        │
│  └──────────┬──────────┘                                                    │
│             │                                                                │
│  PHASE 2: Smart Contracts                                                   │
│  ───────────────────────                                                    │
│             │                                                                │
│             ▼                                                                │
│  ┌─────────────────────┐                                                    │
│  │ 2. VOTRegistryV2    │ ← Base L2 (Chain 8453)                            │
│  │    (Base Mainnet)    │   ERC-4804 + IPFS + Fusaka EIPs                  │
│  └──────────┬──────────┘                                                    │
│             │                                                                │
│             ▼                                                                │
│  ┌─────────────────────┐                                                    │
│  │ 3. WildcardResolver │ ← L1 Ethereum (Chain 1)                           │
│  │    (L1 Mainnet)      │   Points to Base via CCIP-Read                   │
│  └──────────┬──────────┘                                                    │
│             │                                                                │
│  PHASE 3: ENS Integration                                                   │
│  ────────────────────────                                                   │
│             │                                                                │
│             ▼                                                                │
│  ┌─────────────────────┐                                                    │
│  │ 4. ENS Configuration │ ← mcpvot.eth resolver → WildcardResolver         │
│  │    (L1 Registry)     │   Wildcard: *.builder.mcpvot.eth                 │
│  └──────────┬──────────┘                                                    │
│             │                                                                │
│  PHASE 4: UI Integration                                                    │
│  ───────────────────────                                                    │
│             │                                                                │
│             ▼                                                                │
│  ┌─────────────────────┐                                                    │
│  │ 5. VOT Builder Card │ ← New component above Beeper                      │
│  │    (Dashboard)       │   Adaptive design, $1 USDC flow                  │
│  └──────────┬──────────┘                                                    │
│             │                                                                │
│             ▼                                                                │
│  ┌─────────────────────┐                                                    │
│  │ 6. Merge UI Pages   │ ← Consolidate duplicate routes                    │
│  │    (Cleanup)         │   /about, /docs optimization                     │
│  └─────────────────────┘                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 1: CCIP-Read Gateway (✅ READY)

### Status: Created, Awaiting Deployment

**File:** `src/app/api/gateway/route.ts`

**Endpoint:** `GET /api/gateway?sender={resolver}&data={calldata}`

**Features:**
- Decodes CCIP-Read requests from ENS resolver
- Queries VOTRegistry on Base L2
- Returns signed responses for L1 verification

**Deployment:**
```bash
# Vercel auto-deploys from git push
git push origin master

# Verify endpoint
curl "https://mcpvot.xyz/api/gateway?sender=0x...&data=0x..."
```

---

## 📋 Phase 2: VOTRegistryV2 on Base L2

### Contract: `VOTRegistryV2_Audited.sol`

**Network:** Base Mainnet (Chain ID: 8453)  
**Cost:** ~$5-15 USD in ETH gas

**Key Features (Fusaka/Pectra Compliant):**
- ✅ EIP-7702: Batch operations with signature authorization
- ✅ EIP-7951: secp256r1 passkey verification
- ✅ ERC-4804: web3:// URL protocol
- ✅ EIP-1577: contenthash encoding
- ✅ PeerDAS: Custody column tracking

**Constructor Parameters:**
```solidity
constructor(
    address _owner,           // Treasury multisig
    address _signer,          // Backend signer
    string memory _gatewayUrl // https://mcpvot.xyz/api/gateway
)
```

**Deployment Script:**
```javascript
// scripts/deploy-registry-base.js
const { ethers } = require("hardhat");

async function main() {
  const TREASURY = "0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa";
  const SIGNER = process.env.BACKEND_SIGNER_ADDRESS;
  const GATEWAY = "https://mcpvot.xyz/api/gateway";

  const VOTRegistry = await ethers.getContractFactory("VOTRegistryV2_Audited");
  const registry = await VOTRegistry.deploy(TREASURY, SIGNER, GATEWAY);
  await registry.waitForDeployment();

  console.log("VOTRegistryV2 deployed to:", await registry.getAddress());
  
  // Verify on BaseScan
  await hre.run("verify:verify", {
    address: await registry.getAddress(),
    constructorArguments: [TREASURY, SIGNER, GATEWAY],
  });
}
```

**Hardhat Config:**
```javascript
// hardhat.config.js
module.exports = {
  networks: {
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 8453,
    },
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY,
    },
    customChains: [{
      network: "base",
      chainId: 8453,
      urls: {
        apiURL: "https://api.basescan.org/api",
        browserURL: "https://basescan.org",
      },
    }],
  },
};
```

---

## 📋 Phase 3: WildcardResolverV2 on L1 Ethereum

### Contract: `WildcardResolverV2_Audited.sol`

**Network:** Ethereum Mainnet (Chain ID: 1)  
**Cost:** ~$50-200 USD in ETH gas (variable)

**Key Features:**
- ✅ CCIP-Read (EIP-3668): Off-chain data retrieval
- ✅ Multiple gateway support with rotation
- ✅ secp256r1 passkey signature verification
- ✅ ENS wildcard resolution for *.builder.mcpvot.eth

**Constructor Parameters:**
```solidity
constructor(
    address _owner,            // Treasury multisig
    address _signer,           // Backend signer (same as registry)
    string[] memory _gateways  // Gateway URLs
)
```

**Deployment Script:**
```javascript
// scripts/deploy-resolver-l1.js
const { ethers } = require("hardhat");

async function main() {
  const TREASURY = "0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa";
  const SIGNER = process.env.BACKEND_SIGNER_ADDRESS;
  const GATEWAYS = [
    "https://mcpvot.xyz/api/gateway",
    "https://backup.mcpvot.xyz/api/gateway"
  ];

  const Resolver = await ethers.getContractFactory("WildcardResolverV2_Audited");
  const resolver = await Resolver.deploy(TREASURY, SIGNER, GATEWAYS);
  await resolver.waitForDeployment();

  console.log("WildcardResolverV2 deployed to:", await resolver.getAddress());
  
  // Verify on Etherscan
  await hre.run("verify:verify", {
    address: await resolver.getAddress(),
    constructorArguments: [TREASURY, SIGNER, GATEWAYS],
  });
}
```

---

## 📋 Phase 4: ENS Configuration

### Set Resolver for mcpvot.eth

```javascript
// scripts/configure-ens.js
const { ethers } = require("hardhat");
const namehash = require("eth-ens-namehash");

async function main() {
  const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  const RESOLVER_ADDRESS = "<WildcardResolverV2 address>";
  
  const registry = await ethers.getContractAt("ENS", ENS_REGISTRY);
  
  // Set resolver for mcpvot.eth
  const node = namehash.hash("mcpvot.eth");
  await registry.setResolver(node, RESOLVER_ADDRESS);
  
  // Set resolver for builder.mcpvot.eth (wildcard parent)
  const builderNode = namehash.hash("builder.mcpvot.eth");
  await registry.setResolver(builderNode, RESOLVER_ADDRESS);
  
  console.log("ENS configured for mcpvot.eth and builder.mcpvot.eth");
}
```

### Wildcard DNS Setup

In the ENS resolver, wildcard `*.builder.mcpvot.eth` will:
1. Receive query for `alice.builder.mcpvot.eth`
2. Return OffchainLookup error with gateway URL
3. Gateway fetches contenthash from VOTRegistry on Base
4. Response signed and returned to L1 client

---

## 📋 Phase 5: ERC-4804 web3:// Protocol

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    ERC-4804 RESOLUTION                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User types in browser:                                      │
│  web3://vot-registry.base/builder/alice                      │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────┐                                    │
│  │ ERC-4804 Gateway    │ (Browser extension or gateway)     │
│  │ (e.g., eth.limo)    │                                    │
│  └──────────┬──────────┘                                    │
│             │                                                │
│             ▼                                                │
│  ┌─────────────────────┐                                    │
│  │ VOTRegistryV2       │ request("/builder/alice")          │
│  │ (Base L2)           │                                    │
│  └──────────┬──────────┘                                    │
│             │                                                │
│             ▼                                                │
│  ┌─────────────────────┐                                    │
│  │ Returns HTML/JSON   │ Based on path:                     │
│  │ /builder/{name}     │ → Redirect to IPFS                 │
│  │ /metadata/{tokenId} │ → NFT metadata JSON                │
│  │ /stats              │ → Registry statistics              │
│  └─────────────────────┘                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Supported Endpoints (from contract):

| Path | Response | Content-Type |
|------|----------|--------------|
| `/builder/{name}` | HTML redirect to IPFS | text/html |
| `/metadata/{tokenId}` | NFT metadata | application/json |
| `/stats` | Registry statistics | application/json |
| `/contenthash/{name}` | Raw contenthash | application/octet-stream |

### Testing web3:// URLs:

```bash
# Via eth.limo gateway
curl "https://vot-registry.base.eth.limo/builder/alice"

# Direct ERC-4804 call (requires web3:// capable browser)
# web3://vot-registry.base/builder/alice
```

---

## 📋 Phase 6: VOT Builder Mint Card UI

### Component: `VOTBuilderMintCard.tsx`

**Location:** `src/components/vot/VOTBuilderMintCard.tsx`

**Features:**
- Adaptive responsive design (better than Beeper)
- $1.00 USDC → 69,420 VOT + IPFS site + NFT
- Category selection (14 templates)
- Live preview before mint
- ENS subdomain setup option
- Post-mint: View site, Download SVG, OpenSea link

**Placement in Dashboard:**
```tsx
// Dashboard.tsx
<div className="space-y-3 sm:space-y-4 lg:space-y-6">
  {/* VOT BUILDER - PREMIUM FEATURE */}
  <div className="flex justify-center items-center">
    <div className="relative w-full max-w-xl lg:max-w-2xl xl:max-w-3xl">
      <VOTBuilderMintCard />
    </div>
  </div>

  {/* BEEPER NFT - QUICK MINT */}
  <div className="flex justify-center items-center">
    <div className="relative w-full max-w-xl lg:max-w-2xl xl:max-w-3xl">
      <BeeperMintCardV2 />
    </div>
  </div>
  
  {/* Other panels... */}
</div>
```

---

## 📋 Phase 7: Merge Duplicate UI Pages

### Pages to Consolidate:

| Duplicate | Keep | Action |
|-----------|------|--------|
| `/about` + About modal | `/about` page | Remove modal, use page |
| `/docs` + inline docs | `/docs` page | Consolidate all docs |
| `/mint` variants | Single `/mint` | Route params for type |

---

## 🔐 Security Checklist

- [ ] Backend signer key stored in Vercel env vars
- [ ] Treasury multisig controls contract ownership
- [ ] Rate limiting on gateway API
- [ ] CORS configured for mcpvot.xyz only
- [ ] Signature verification in contracts
- [ ] Emergency pause functionality tested

---

## 💰 Cost Estimates

| Item | Network | Estimated Cost |
|------|---------|----------------|
| VOTRegistryV2 deployment | Base L2 | ~$5-15 |
| WildcardResolverV2 deployment | L1 Ethereum | ~$50-200 |
| ENS resolver configuration | L1 Ethereum | ~$20-50 |
| **Total** | | **~$75-265** |

---

## 📅 Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Gateway Deploy | 1 hour | Git push |
| 2. VOTRegistry Deploy | 2 hours | Gateway live |
| 3. WildcardResolver Deploy | 2 hours | Gateway live |
| 4. ENS Config | 1 hour | Both contracts deployed |
| 5. UI Card | 4 hours | None |
| 6. Merge Pages | 2 hours | None |
| **Total** | **~12 hours** | |

---

## 📚 References

- MCP Memory #380: Audit Report (VOTRegistryV2 + WildcardResolverV2)
- MCP Memory #381: This Deployment Plan
- EIP-3668: CCIP Read - https://eips.ethereum.org/EIPS/eip-3668
- EIP-4804: web3:// URL - https://eips.ethereum.org/EIPS/eip-4804
- EIP-7702: EOA Code - https://eips.ethereum.org/EIPS/eip-7702
- EIP-7951: secp256r1 - https://eips.ethereum.org/EIPS/eip-7951
