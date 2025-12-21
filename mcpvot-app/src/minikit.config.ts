const ROOT_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mcpvot.xyz';

export const minikitConfig = {
  // ⚠️  ACCOUNT ASSOCIATION REQUIRED ⚠️
  // To complete Base app registration, you need to:
  // 1. Go to https://www.base.dev/preview?tab=account
  // 2. Enter domain: mcpvot.xyz
  // 3. Click "Verify" and sign with MetaMask
  // 4. Copy the generated accountAssociation object below
  accountAssociation: {
    "header": "eyJmaW5hbGUiOiIxNzM4MzY4NjU1IiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDg2YjAyNzE5ODJlNzE5ZTdjZTAzZDk5MjA5YzA2NGJlZTIyNzE5M2UifQ",
    "payload": "eyJkb21haW4iOiJtY3B2b3QtejUyc3lteC1tY3B2b3Rzcy1wcm9qZWN0cy52ZXJjZWwuYXBwIiwiYWRkcmVzcyI6IjB4ODJiMDI3MTk4MmU3MTllN2NlMDNkOTkyMDljMDY0YmVlMjI3MTkzZSJ9",
    "signature": "0x4b8d1f2a9c3e8f7b5a6c9d2e1f8a4b7c9d3e6f8a1b5c9d2e7f4a8b3c6d9e2f5a8b1c4f7a9d3e6b8c5f2a9d4e7b1c6f8a3b5d9e2f7a4c8b1e6d9f3a7b2c5e8f1a4b9c3d6e9f2a7b4c1e8d5f9a2b6c9e3f7a1b8c5d9e2f6a4b1c8d5e9f3a7b2c5e8f1a4b9c3d6e9f2a7b4c1e8d5f9a2b6c9e3f7a1b8c5d9e2f6a4b1c8d5e9f3a7b2c5e8f1a4b9c3d6e9f2a7b4c1e8d5f9a2b6c9e3f7a1b8c5d9e2f6"
  },
  miniapp: {
    version: "1",
    name: "MCPVOT Intelligence", 
    subtitle: "x402 Gasless Intelligence APIs", 
    description: "AI-powered intelligence APIs with x402 gasless payments. Real-time VOT, MAXX, Farcaster ecosystem analytics.",
    screenshotUrls: [`${ROOT_URL}/branding/screenshot.png`],
    iconUrl: `${ROOT_URL}/branding/icon.png`,
    splashImageUrl: `${ROOT_URL}/branding/splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "defi",
    tags: ["ai", "intelligence", "x402", "gasless", "farcaster", "analytics", "vot", "maxx", "nft"],
    heroImageUrl: `${ROOT_URL}/branding/hero.png`,
    tagline: "Gasless Intelligence for Web3",
    ogTitle: "MCPVOT • x402 Gasless Intelligence APIs",
    ogDescription: "AI-powered intelligence APIs with x402 gasless payments ($0 gas for users). Real-time VOT, MAXX, Farcaster ecosystem analytics.",
    ogImageUrl: `${ROOT_URL}/branding/og-image.png`,
  },
  baseBuilder: {
    ownerAddress: '0xE50bb117e56F1387EAf7A81363E628Ca941c08Fd',
  },
} as const;