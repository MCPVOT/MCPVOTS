# Farcaster Mini App Discovery Troubleshooting Guide

> **Last Updated:** December 20, 2025  
> **App:** x402VOT (MCPVOT)  
> **Domain:** mcpvot.xyz  
> **App ID:** `019a6fd8-654b-d296-e2ef-e0b78aeb9a76`

---

## 🚨 Current Status

| Platform | Discovery Status | Notes |
|----------|-----------------|-------|
| **Base App** | ✅ Found | App appears in Base search |
| **Farcaster/Warpcast** | ⚠️ Not Indexed | Requires usage threshold + time |

---

## 📋 Discovery Requirements Checklist

### 1. Manifest Configuration ✅

**Location:** `/.well-known/farcaster.json`

```bash
# Verify manifest is accessible
curl -s https://mcpvot.xyz/.well-known/farcaster.json
```

**Required Fields:**
- [x] `version`: "1"
- [x] `name`: "x402VOT" (max 32 chars)
- [x] `iconUrl`: 1024x1024px PNG, no alpha
- [x] `homeUrl`: https://mcpvot.xyz
- [x] `description`: Clear description of app functionality
- [x] `noindex`: false (CRITICAL - must be false to appear in search)

**Optional but Recommended:**
- [x] `subtitle`: Max 30 chars, no emojis
- [x] `primaryCategory`: "finance" (valid categories: games, social, finance, utility, productivity, health-fitness, news-media, music, shopping, education, developer-tools, entertainment, art-creativity)
- [x] `tags`: Up to 5 tags, max 20 chars each, lowercase only
- [x] `splashImageUrl`: 200x200px
- [x] `splashBackgroundColor`: Hex color
- [x] `heroImageUrl`: 1200x630px (1.91:1)
- [x] `screenshotUrls`: Portrait 1284x2778, max 3

### 2. Account Association ✅

The manifest must include a cryptographically signed `accountAssociation` object:

```json
{
  "accountAssociation": {
    "header": "base64url encoded - contains FID, type, key",
    "payload": "base64url encoded - contains domain",
    "signature": "base64url encoded signature"
  }
}
```

**Generate at:** https://farcaster.xyz/~/developers/mini-apps/manifest

**CRITICAL:** Domain in payload MUST exactly match hosting domain (including subdomains)

### 3. Manifest Registration ✅

**This is the most commonly missed step!**

Apps must be **registered** at: https://farcaster.xyz/~/developers/mini-apps/manifest

- Registration links manifest to your Farcaster account
- Shows green checkmark when properly associated
- Required for search indexing

### 4. fc:miniapp Meta Tag ✅

**Location:** HTML `<head>` section

```html
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"...","button":{...}}' />
```

Verify with:
```bash
curl -s https://mcpvot.xyz | grep "fc:miniapp"
```

**Schema:**
```json
{
  "version": "1",
  "imageUrl": "https://mcpvot.xyz/branding/embed-preview.png",
  "button": {
    "title": "Launch MCPVOT",
    "action": {
      "type": "launch_frame",
      "name": "MCPVOT x402 Intelligence",
      "url": "https://mcpvot.xyz",
      "splashImageUrl": "https://mcpvot.xyz/branding/splash.png",
      "splashBackgroundColor": "#000000"
    }
  }
}
```

### 5. Image Requirements ✅

| Image | Size | Format | Notes |
|-------|------|--------|-------|
| `iconUrl` | 1024x1024px | PNG | No alpha/transparency |
| `splashImageUrl` | 200x200px | PNG | Shown during load |
| `imageUrl` (embed) | 3:2 ratio | PNG | Shown in feeds |
| `heroImageUrl` | 1200x630px | PNG | 1.91:1 ratio |
| `screenshotUrls` | 1284x2778px | PNG | Portrait, max 3 |

Verify images:
```bash
curl -sI https://mcpvot.xyz/branding/icon.png | grep -i content-type
# Should return: Content-Type: image/png
```

### 6. Domain Requirements ✅

- [x] Production domain (NOT development tunnels)
- [x] HTTPS only
- [x] No ngrok, replit.dev, localtunnel, etc.

### 7. SDK Integration

**Critical:** Must call `sdk.actions.ready()` after app loads to hide splash screen.

```typescript
import { sdk } from '@farcaster/miniapp-sdk';

// After your app is fully loaded
await sdk.actions.ready();
```

**Without this, users see infinite loading screen!**

---

## 🔍 Why App Not Showing in Farcaster Search

According to official Farcaster documentation (https://miniapps.farcaster.xyz/docs/guides/discovery):

### Usage & Engagement Criteria (THE MAIN BLOCKER)

> "Apps must demonstrate basic usage before being indexed"

- **Minimum usage threshold**: Apps need user engagement before appearing
- **Recent activity**: Apps must have been opened recently to remain in search
- **Usage scores** based on:
  - Number of users who opened the app
  - Number of users who added the app
  - Trending score based on recent engagement

### Solutions:

1. **Share app links in Farcaster casts** to generate usage
2. **Ask users to add the app** to their collection
3. **Maintain regular user engagement**
4. **Wait for indexing cycle** (refreshed daily)

---

## 🛠️ Debugging Commands

### 1. Verify Manifest
```bash
curl -s https://mcpvot.xyz/.well-known/farcaster.json | jq .
```

### 2. Check fc:miniapp Meta Tag
```bash
curl -s https://mcpvot.xyz | grep -o 'fc:miniapp.*content="[^"]*"'
```

### 3. Verify Images Return Correct Content-Type
```bash
curl -sI https://mcpvot.xyz/branding/icon.png | grep -i content-type
curl -sI https://mcpvot.xyz/branding/splash.png | grep -i content-type
curl -sI https://mcpvot.xyz/branding/embed-preview.png | grep -i content-type
```

### 4. Preview Tool
```
https://farcaster.xyz/~/developers/mini-apps/preview?url=https%3A%2F%2Fmcpvot.xyz
```

### 5. Check noindex Setting
```bash
curl -s https://mcpvot.xyz/.well-known/farcaster.json | jq '.miniapp.noindex // .frame.noindex'
# Should return: false
```

---

## 📝 Current Manifest (Verified Working)

```json
{
  "miniapp": {
    "version": "1",
    "name": "x402VOT",
    "iconUrl": "https://mcpvot.xyz/branding/icon.png",
    "homeUrl": "https://mcpvot.xyz",
    "splashImageUrl": "https://mcpvot.xyz/branding/splash.png",
    "splashBackgroundColor": "#000000",
    "webhookUrl": "https://mcpvot.xyz/api/webhook",
    "subtitle": "x402 VOT Facilitator",
    "description": "Pay $0.25 USDC, get 69,420 VOT + VRF Rarity NFT. Chainlink VRF-powered 10 tier rarity system. ERC-1155 on-chain SVG NFTs on Base.",
    "screenshotUrls": ["https://mcpvot.xyz/branding/screenshot.png"],
    "primaryCategory": "finance",
    "tags": ["vot", "nft", "base", "defi", "x402"],
    "heroImageUrl": "https://mcpvot.xyz/branding/hero.png",
    "tagline": "VOT Rewards + VRF NFTs",
    "ogTitle": "x402VOT Facilitator",
    "ogDescription": "Pay $0.25 USDC get 69420 VOT plus VRF Rarity NFT on Base",
    "ogImageUrl": "https://mcpvot.xyz/branding/og-image.png",
    "noindex": false,
    "requiredChains": ["eip155:8453"]
  },
  "accountAssociation": {
    "header": "eyJmaWQiOjEzOTY1MjQsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg4N2RhOUI2NTc4RDk4QzBmOWRDQTA5NGI0MTZiODFEOWQxY2Q0ODQ2In0",
    "payload": "eyJkb21haW4iOiJtY3B2b3QueHl6In0",
    "signature": "hxfTxYlA7anfVUmbGP9IRoNc+/JmFqgCdN0lhf+F80og+PxxxD8ruRxYw01zE/ZagDWRmmPAOA8Mt1dAMJWlOBw="
  }
}
```

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| Manifest Registration Tool | https://farcaster.xyz/~/developers/mini-apps/manifest |
| Preview Tool | https://farcaster.xyz/~/developers/mini-apps/preview |
| Discovery Guide | https://miniapps.farcaster.xyz/docs/guides/discovery |
| Publishing Guide | https://miniapps.farcaster.xyz/docs/guides/publishing |
| Specification | https://miniapps.farcaster.xyz/docs/specification |
| AI Agent Checklist | https://miniapps.farcaster.xyz/docs/guides/agents-checklist |
| Developer Rewards | https://farcaster.xyz/~/developers/rewards |
| LLM Full Docs | https://miniapps.farcaster.xyz/llms-full.txt |

---

## 🎯 Action Items to Improve Discoverability

1. **Generate Usage**
   - Share app in Farcaster casts
   - Ask community to open/use the app
   - Post about it in relevant channels

2. **Encourage App Adds**
   - Users can "add" the app to their collection
   - This boosts ranking in search

3. **Maintain Fresh Content**
   - Apps with recent activity rank higher
   - Regular updates keep manifest refreshed

4. **Wait for Reindexing**
   - Farcaster refreshes indexes daily
   - Changes may take 24-48 hours to reflect

5. **Contact Farcaster Team** (if issues persist)
   - @pirosb3, @linda, @deodad on Farcaster

---

## 📊 Technical Verification Results

```
Date: December 20, 2025

✅ Manifest accessible at /.well-known/farcaster.json
✅ Using 'miniapp' key (not deprecated 'frames')
✅ Account association present and signed
✅ Domain matches: mcpvot.xyz
✅ fc:miniapp meta tag in HTML head
✅ noindex: false
✅ Images return Content-Type: image/png
✅ Registered at manifest tool (ID: 019a6fd8-654b-d296-e2ef-e0b78aeb9a76)
✅ Production domain (not dev tunnel)
✅ requiredChains specified: eip155:8453 (Base)

⚠️ Search visibility: Pending usage threshold
```

---

## 🚫 Common Pitfalls to Avoid

1. **DO NOT** use `fc:frame` meta tag for new apps (legacy only)
2. **DO NOT** use `"version": "next"` - must be `"1"`
3. **DO NOT** mix Frame and Mini App terminology
4. **DO NOT** use outdated examples from before 2024
5. **DO NOT** forget to call `sdk.actions.ready()`
6. **DO NOT** use dev tunnel domains (ngrok, replit, etc.)

---

## 📞 Support Contacts

If all technical requirements are met but app still not appearing after 48+ hours:

- **Farcaster Team:** @pirosb3, @linda, @deodad on Warpcast
- **GitHub Issues:** https://github.com/farcasterxyz/miniapps/issues

---

*This document is part of the MCPVOT ecosystem documentation. For updates, check the main repository.*
