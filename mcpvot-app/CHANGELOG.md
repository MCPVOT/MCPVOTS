# BEEPER NFT Changelog

## [3.2.0] - 2025-12-26

### 🔧 Wallet Connect Modal - Critical Bug Fix

#### Issue Fixed
- **Problem**: Wallet connect modal not scrollable on PC or mobile
- **Symptoms**: Wallet options cut off, Cancel button hidden, couldn't see all wallets
- **Affected**: Both desktop browsers and mobile web browsers

#### Root Cause
Complex flex layout in `EnhancedConnectButton.tsx` with conflicting:
- `height: isMobile ? '85dvh' : '70vh'`
- `flex-col` with `flex-1` on scroll container
- Scanline overlay with `absolute inset-0` interfering

#### Solution
Complete modal rewrite with simple layout:
1. **Overlay**: `overflow-y-auto` (page scrolls if modal tall)
2. **Modal**: Simple centered div with `min-h-full flex items-center`
3. **Wallet list**: `max-height: 50vh` with `overflow-y-auto`
4. **No flex layout complexity** - just natural document flow
5. **Cancel button always visible** at bottom

#### Commits
- `16bbc9e`: Initial auth/scroll fixes
- `a7267d6`: **FINAL** - Simple scrollable layout ✅

#### MCP Memory
- Stored as memory ID: 372 (category: mcpvot-app-bugfix)

---

## [3.1.0] - 2025-12-18

### 🎬 Banner Generator V3 - IMPROVED

#### Neo-Style Typing Animation
- Slower character reveal (0.08s per char, was 0.06s)
- Later start delays for dramatic effect:
  - Title: 0.5s delay
  - ENS/BASE: 2.5s/3.5s delays  
  - FC/FID/ADDR: 4.5s/5.5s/6.5s delays
- Blinking cursor after each typed field

#### 4 Prominent VOT Hieroglyphics (VRF Rarity-Based)
- Top-left corner: Previous tier glyph (pulsing animation)
- Top-right corner: Next tier glyph (pulsing animation)
- Left of Dino: Main rarity glyph (LARGE 40px, scaling to 44px)
- Right of Dino: Main rarity glyph (offset animation)
- All glyphs pulse/scale based on rarity animSpeed

#### OpenRouter AI Models Updated
- **Primary**: `nex-agi/deepseek-v3.1-nex-n1:free` (DeepSeek V3.1 Nex N1)
- **Fallback 1**: `mistralai/devstral-2512:free` (Devstral 2)
- **Fallback 2**: `nvidia/llama-3.1-nemotron-70b-instruct:free` (Nemotron 70B)
- **Fallback 3**: `xiaomi/mimo-v2-flash:free` (MiMo V2)
- **Fallback 4**: `minimax/minimax-m2:free` (MiniMax M2)

#### Technical Improvements
- New `banner-generator-v3.ts` module
- `generateProminentGlyphs()` function for VRF-based glyph placement
- Improved circuit board background patterns
- Better radar sweep animation
- Smart address display (only if no ENS/Basename)

---

## [3.0.0] - 2025-12-18

### 🦖 BEEPER NFT V3 - Major Release

#### Contract Deployment

- **Contract Address**: `0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9`
- **Network**: Base Mainnet (Chain ID: 8453)
- **Standard**: ERC-1155
- **Deployer/Treasury**: `0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa`

#### New Features

##### VOT Hieroglyphics Language
- Replaced all emojis with Sumerian cuneiform glyphs
- 10 rarity tiers with unique glyphs:
  - 𒇻 DINGIR (NODE) - 45%
  - 𒁹 DIŠ (VALIDATOR) - 25%
  - 𒋼 TA (STAKER) - 15%
  - 𒄠 AM (WHALE) - 8%
  - 𒀭 AN (OG) - 4%
  - 𒆳 KUR (GENESIS) - 2%
  - 𒌋 U (ZZZ) - 0.5%
  - 𒀯 MUL (FOMO) - 0.3%
  - 𒆷 LA (GM) - 0.15%
  - 𒈗 LUGAL (x402) - 0.05%

##### NFT Viewer Page `/beeper/[tokenId]`
- View minted NFT with animated SVG
- Download SVG button
- OpenSea link
- BaseScan transaction link
- Share to Farcaster
- Share to Twitter/X
- VOT hieroglyphics throughout
- Mini App / Farcaster / Base / Web App compatible

##### Enhanced Mint Card UI (BeeperMintCardV2)
- Bright matrix green theme (#77FE80)
- Retro terminal aesthetic
- Clear identity sections (Basename, Farcaster, Wallet)
- On-chain badge indicator
- Gasless experience indicator
- Standards display (ERC-1155, IPFS, ERC-4804, VRF)
- Animated pixel Beeper dino
- Traits counter with glyphs

##### OpenSea Collection Assets
- `/opensea/collection-logo.svg` (500x500 animated)
- `/opensea/collection-banner.svg` (1400x400 animated)
- Both feature VOT hieroglyphics and matrix green theme

#### API Endpoints
- `GET /api/beeper/nft/[tokenId]` - Fetch NFT metadata from chain/IPFS
- `POST /api/beeper/mint` - Execute mint transaction
- `GET /api/identity/resolve` - Resolve ENS/Basename for address

#### OpenRouter Model Updates
- Primary: `nex-agi/deepseek-v3.1-nex-n1:free` (DeepSeek V3.1 Nex N1)
- Fallback 1: `mistralai/devstral-2512:free` (Devstral 2)
- Fallback 2: `kwaipilot/kat-coder-pro:free` (KAT-Coder Pro)
- Fallback 3: `nvidia/nemotron-3-nano-30b-a3b:free` (Nemotron 30B)

#### Technical Details
- On-chain SVG storage
- VRF-based rarity determination
- ERC-4804 (web3://) protocol support
- x402scan compatibility
- MCP Memory ID: 319

---

## [2.0.0] - 2025-12-17

### Banner Generator V2
- Retro VCR/terminal font aesthetic
- Minimal x402 V2 branding
- Advanced animated effects
- Matrix grid pulse & signal wave (replaced data rain)
- Beeper icon (top-left) → beep.works
- VOT logo (bottom-left) → mcpvot.xyz
- ERC-8004 + x402scan compatible

---

## Links

- **OpenSea Collection**: https://opensea.io/collection/beeper-nft-base
- **BaseScan**: https://basescan.org/token/0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9
- **MCPVOT App**: https://mcpvot.xyz
- **Beeper**: https://beep.works
