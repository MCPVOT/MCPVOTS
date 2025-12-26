import AnimatedCursor from '@/components/AnimatedCursor';
import FarcasterSplashManager from '@/components/FarcasterSplashManager';
import { Providers } from '@/components/Providers';
import TerminalBackground from '@/components/TerminalBackground';
import '@rainbow-me/rainbowkit/styles.css';
import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });

// Force all pages to be dynamic (prevents static generation errors)
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mcpvot.xyz'),
  title: {
    default: "MCPVOT • x402 V2 Facilitator Machine | VOT Rewards + VRF Rarity NFTs",
    template: "%s | MCPVOT x402"
  },
  description: "x402 V2 Facilitator: Pay $0.25 USDC → Get 69,420 VOT + VRF Rarity NFT. Chainlink VRF-powered rarity with 10 tiers from NODE (45%) to X402 (0.05%). ERC-1155 on-chain SVG NFTs on Base. Live Gas & VOT price. mcpvot.eth | mcpvot.base.eth",
  keywords: ["x402 V2 Facilitator", "VOT token", "VRF rarity", "Chainlink VRF", "ERC-1155 NFT", "Base blockchain", "on-chain SVG", "Farcaster mini-app", "USDC payments", "BeeperNFT", "MAXX token", "ENS subdomain", "mcpvot.eth", "decentralized identity", "ERC-4804", "web3 URL"],
  authors: [{ name: "MCPVOT", url: "https://mcpvot.xyz" }],
  creator: "MCPVOT",
  publisher: "MCPVOT",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mcpvot.xyz',
    siteName: 'MCPVOT x402 V2 Facilitator',
    title: 'x402 V2 Facilitator Machine • $0.25 → 69,420 VOT + NFT',
    description: 'Pay $0.25 USDC, get 69,420 VOT + VRF Rarity NFT. Chainlink VRF randomness with 10 tiers. ERC-1155 on-chain SVG. Live Base Gas & VOT price ticker. Built on Base.',
    images: [
      {
        // Primary OpenGraph image (recommended: 1200x630)
        url: '/branding/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MCPVOT x402 V2 Facilitator — VOT Rewards + VRF Rarity NFTs',
      },
      {
        // Secondary fallback image (square warplet badge)
        url: '/warplet_VOT.png',
        width: 1200,
        height: 1200,
        alt: 'MCPVOT x402 Facilitator with Live Gas & VOT Price',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@MCPVOT',
    creator: '@MCPVOT',
    title: 'x402 V2 Facilitator • $0.25 → 69,420 VOT + NFT',
    description: 'Pay $0.25 USDC, get 69,420 VOT + VRF Rarity NFT. 10 tiers from NODE to X402. Chainlink VRF. ERC-1155 on-chain SVG on Base.',
    images: ['/branding/magnifics_upscale-precision-Pg8OxBAFfF2D6zS8eXNS-splash.png?v=20251113'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/branding/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/branding/icon.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: '/branding/icon.png',
    apple: '/branding/icon.png',
  },
  other: {
    // Base Mini App Discovery (required for Base app directory)
    'base:app_id': '6947436cd77c069a945be34f',
    // Base Builder Code (for onchain activity attribution & rewards)
    'base:builder_code': 'bc_zibnh7q0',
    // x402 V2 Facilitator Discovery (ERC-8004)
    'x402:agent': '/.well-known/agent-registration.json',
    'x402:facilitator': '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa',
    'x402:network': 'base-mainnet-8453',
    'x402:price': '$0.25 USDC',
    'x402:reward': '69,420 VOT + VRF NFT',
    // Contract Addresses
    'contract:beeper-nft': '0x5eEe623ac2AD1F73AAE879b2f44C54b69116bFB9',
    'contract:vot': '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
    'contract:maxx': '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467',
    'contract:treasury': '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa',
    // ENS Identity
    'ens:name': 'mcpvot.eth',
    'basename': 'mcpvot.base.eth',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mcpvot.xyz').trim().replace(/\/$/, '');
  const brandingBaseUrl = `${appUrl}/branding`;
  const miniAppEmbed = JSON.stringify({
    version: "1",
    imageUrl: `${brandingBaseUrl}/embed-preview.png`,  // 3:2 ratio (1200x800)
    button: {
      title: "Launch MCPVOT",
      action: {
        type: "launch_frame",
        name: "MCPVOT x402 Intelligence",
        url: appUrl,
        splashImageUrl: `${brandingBaseUrl}/splash.png`,
        splashBackgroundColor: "#000000",
      },
    },
  });

  return (
    <html lang="en">
      <head>
        {/* Essential viewport meta tag for mobile Farcaster mini-apps */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />

        {/* iOS Safe Area Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Farcaster Mini App Meta Tag (version 1) */}
        <meta name="fc:miniapp" content={miniAppEmbed} />

        {/* x402 Protocol Discovery */}
        <link rel="x402-agent" href="/.well-known/agent-registration.json" />
        <link rel="agent-card" href="/.well-known/agent-card.json" type="application/json" />
        <link rel="mcp-manifest" href="/.well-known/mcp-manifest.json" type="application/json" />

        {/* JSON-LD for AI/LLM/Search Engine Discovery - Schema.org WebAPI */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebAPI',
              name: 'MCPVOT Intelligence API',
              description: 'AI agent intelligence service with VOT token rewards and NFT-gated access tiers. x402 V2 protocol payments on Base (EVM). Real-time token analytics, burn tracking, Farcaster ecosystem data.',
              url: 'https://mcpvot.xyz',
              documentation: 'https://mcpvot.xyz/docs',
              termsOfService: 'https://mcpvot.xyz/terms',
              provider: {
                '@type': 'Organization',
                name: 'MCPVOT',
                url: 'https://mcpvot.xyz',
                sameAs: ['https://github.com/MCPVOT', 'https://warpcast.com/mcpvots'],
              },
              offers: {
                '@type': 'Offer',
                price: '0.01',
                priceCurrency: 'USD',
                description: 'Per-query intelligence with VOT token rewards. NFT tiers: Builder ($1), Architect ($10), Engineer ($100)',
              },
              potentialAction: {
                '@type': 'ConsumeAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://mcpvot.xyz/api/x402/vot-intelligence',
                  httpMethod: 'POST',
                  contentType: 'application/json',
                },
              },
              applicationCategory: ['DeFi', 'AI', 'Blockchain Analytics'],
              operatingSystem: 'Web',
              softwareHelp: 'https://mcpvot.xyz/docs/api',
              releaseNotes: 'https://mcpvot.xyz/docs/changelog',
              screenshot: 'https://mcpvot.xyz/branding/screenshot.png',
              featureList: [
                'x402 V2 gasless payments (USDC on Base)',
                'VOT token rewards on every query',
                'ERC-1155 NFT-gated access tiers',
                'MCP protocol compatible',
                'Real-time token intelligence',
                'Farcaster ecosystem analytics',
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.className} ${orbitron.variable} bg-[#050505] text-[#77FE80] font-mono min-h-screen overflow-y-auto overflow-x-hidden`}>
        <Providers>
          <FarcasterSplashManager />
          <TerminalBackground />
          <AnimatedCursor />
          <main className="min-h-screen relative z-10 pb-safe pt-safe"
               style={{ 
                 WebkitOverflowScrolling: 'touch',
                 paddingBottom: 'env(safe-area-inset-bottom)',
                 paddingTop: 'env(safe-area-inset-top)'
               }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
