import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Social Rankings • Farcaster Token & NFT Rankings',
    description: 'Real-time token and NFT collection rankings based on Farcaster social graph activity. Personalized rankings by FID. Track trending tokens and NFTs across your network.',
    keywords: ['Farcaster', 'token rankings', 'NFT rankings', 'social graph', 'trending tokens', 'Base', 'DeFi', 'Zapper'],
    openGraph: {
        type: 'website',
        title: '📊 Social Rankings • Farcaster Token & NFT Rankings',
        description: 'Real-time rankings based on your Farcaster social graph. Track what tokens and NFTs your network is trading.',
        url: 'https://mcpvot.xyz/rankings',
        images: [
            {
                url: '/branding/og-rankings.png',
                width: 1200,
                height: 630,
                alt: 'MCPVOT Social Rankings Dashboard',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '📊 Social Rankings • Farcaster Token & NFT Rankings',
        description: 'Real-time rankings based on your Farcaster social graph.',
        images: ['/branding/og-rankings.png'],
    },
    other: {
        // Farcaster Frame metadata
        'fc:frame': 'vNext',
        'fc:frame:image': 'https://mcpvot.xyz/api/og?page=rankings',
        'fc:frame:image:aspect_ratio': '1.91:1',
        'fc:frame:button:1': 'View Rankings 📊',
        'fc:frame:button:1:action': 'link',
        'fc:frame:button:1:target': 'https://mcpvot.xyz/rankings',
        'fc:frame:button:2': 'My Rankings',
        'fc:frame:button:2:action': 'link',
        'fc:frame:button:2:target': 'https://mcpvot.xyz/rankings?fid=',
    },
};

export default function RankingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
