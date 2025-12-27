import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VOT Machine | x402 Facilitator Mint',
  description: 'Mint your identity NFT. Pay $1 USDC, receive VOT tokens, get your unique portal on Base.',
  openGraph: {
    title: 'VOT Machine | x402 Facilitator Mint',
    description: 'Mint your identity NFT powered by the x402 VOT Facilitator on Base.',
    images: [
      {
        url: 'https://mcpvot.xyz/og/mint.png',
        width: 1200,
        height: 630,
        alt: 'VOT Machine Mint',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VOT Machine | x402 Mint',
    description: 'Mint your identity NFT. Pay $1 USDC, receive VOT, get your unique portal.',
  },
  other: {
    // Farcaster Frame Metadata
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://mcpvot.xyz/og/mint.png',
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:button:1': '🎰 Mint NFT ($1)',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://mcpvot.xyz/mint',
    'fc:frame:button:2': '📊 Tokenomics',
    'fc:frame:button:2:action': 'link',
    'fc:frame:button:2:target': 'https://mcpvot.xyz/tokenomics',
  },
};

export default function MintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
