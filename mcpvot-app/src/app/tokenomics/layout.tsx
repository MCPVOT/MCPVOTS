import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'VOT Tokenomics • Burn Stats & Distribution',
    description: 'Real-time VOT token burn statistics, supply metrics, and tokenomics dashboard. Track deflationary burns, LP allocation, vault unlock timeline. Powered by x402 Protocol on Base.',
    keywords: ['VOT token', 'tokenomics', 'burn stats', 'deflationary', 'x402 protocol', 'Base blockchain', 'Clanker', 'DeFi analytics', 'supply metrics'],
    openGraph: {
        type: 'website',
        title: '🔥 VOT Tokenomics • Live Burn Stats',
        description: 'Track VOT deflationary burns in real-time. 1% burned per x402 purchase. 70% LP / 30% Vault distribution. Built on Base.',
        url: 'https://mcpvot.xyz/tokenomics',
        images: [
            {
                url: '/branding/og-tokenomics.png',
                width: 1200,
                height: 630,
                alt: 'VOT Tokenomics Dashboard',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '🔥 VOT Tokenomics • Live Burn Stats',
        description: 'Track VOT deflationary burns in real-time. 1% burned per x402 purchase.',
        images: ['/branding/og-tokenomics.png'],
    },
    other: {
        // Farcaster Frame metadata
        'fc:frame': 'vNext',
        'fc:frame:image': 'https://mcpvot.xyz/api/og?page=tokenomics',
        'fc:frame:image:aspect_ratio': '1.91:1',
        'fc:frame:button:1': 'View Burns 🔥',
        'fc:frame:button:1:action': 'link',
        'fc:frame:button:1:target': 'https://mcpvot.xyz/tokenomics',
        'fc:frame:button:2': 'Buy VOT ⚡',
        'fc:frame:button:2:action': 'link',
        'fc:frame:button:2:target': 'https://mcpvot.xyz',
        'fc:frame:button:3': 'Basescan 🔍',
        'fc:frame:button:3:action': 'link',
        'fc:frame:button:3:target': 'https://basescan.org/token/0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
    },
};

export default function TokenomicsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
