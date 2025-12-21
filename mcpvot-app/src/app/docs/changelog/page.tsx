'use client';

export default function ChangelogPage() {
  const releases = [
    {
      version: '2.0.0',
      date: 'December 2024',
      tag: 'Latest',
      changes: [
        { type: 'feature', text: 'AI-powered NFT generation with unique taglines, colors, and boot sequences' },
        { type: 'feature', text: 'Comprehensive docs site at /docs' },
        { type: 'feature', text: 'x402 ERC-8004 payment protocol integration' },
        { type: 'feature', text: 'OpenRouter centralized AI service with model fallback chain' },
        { type: 'feature', text: 'VOT rank system (Ghost → Singularity)' },
        { type: 'improvement', text: 'Refactored API routes to use shared constants' },
        { type: 'improvement', text: 'Cache-Control headers on all GET endpoints' },
        { type: 'fix', text: 'Fixed missing import for generateVOTMachineUniqueness' },
      ],
    },
    {
      version: '1.5.0',
      date: 'November 2024',
      changes: [
        { type: 'feature', text: 'Farcaster Mini-App integration' },
        { type: 'feature', text: 'FIP-2 frame button implementation' },
        { type: 'feature', text: '/app redirect for Farcaster clients' },
        { type: 'feature', text: 'VOT tokenomics script for treasury display' },
        { type: 'improvement', text: 'Mobile-responsive VOT Machine interface' },
        { type: 'fix', text: 'Fixed onchainkit provider chain configuration' },
      ],
    },
    {
      version: '1.4.0',
      date: 'November 2024',
      changes: [
        { type: 'feature', text: 'SVG Machine generator with multiple templates' },
        { type: 'feature', text: 'IPFS pinning via Pinata integration' },
        { type: 'feature', text: 'NFT metadata generation endpoint' },
        { type: 'improvement', text: 'Error handling improvements across API routes' },
      ],
    },
    {
      version: '1.3.0',
      date: 'October 2024',
      changes: [
        { type: 'feature', text: 'VOT Machine HTML generator' },
        { type: 'feature', text: 'Profile analysis with Neynar API' },
        { type: 'feature', text: 'Basic wallet connection via OnchainKit' },
        { type: 'improvement', text: 'CRT terminal styling with animations' },
      ],
    },
    {
      version: '1.2.0',
      date: 'October 2024',
      changes: [
        { type: 'feature', text: 'MCP Memory Server (maxx-memory)' },
        { type: 'feature', text: 'IPFS MCP Server (ipfs-mcp)' },
        { type: 'feature', text: 'Vector memory storage with SQLite' },
        { type: 'improvement', text: 'Added ecosystem context to memory system' },
      ],
    },
    {
      version: '1.1.0',
      date: 'September 2024',
      changes: [
        { type: 'feature', text: 'VOT Token deployed via Clanker on Base' },
        { type: 'feature', text: 'Treasury wallet setup' },
        { type: 'feature', text: 'Basic Next.js app structure' },
      ],
    },
    {
      version: '1.0.0',
      date: 'August 2024',
      changes: [
        { type: 'feature', text: 'Initial MAXX ecosystem analysis tools' },
        { type: 'feature', text: 'Trading bot foundations' },
        { type: 'feature', text: 'Ecosystem CLI' },
      ],
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'text-green-400 bg-green-500/20';
      case 'improvement':
        return 'text-blue-400 bg-blue-500/20';
      case 'fix':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'breaking':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">📋 Changelog</h1>
        <p className="text-gray-400 text-lg">
          Version history and updates for the MCPVOT ecosystem.
        </p>
      </div>

      <div className="space-y-8">
        {releases.map((release) => (
          <section 
            key={release.version} 
            className="relative pl-8 border-l-2 border-gray-800"
          >
            {/* Version dot */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyan-500" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">
                  v{release.version}
                </h2>
                {release.tag && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-cyan-500 text-black rounded">
                    {release.tag}
                  </span>
                )}
                <span className="text-gray-500 text-sm">{release.date}</span>
              </div>
              
              <ul className="space-y-2">
                {release.changes.map((change, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${getTypeColor(change.type)}`}>
                      {change.type}
                    </span>
                    <span className="text-gray-400">{change.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      {/* Subscribe */}
      <section className="p-6 bg-gradient-to-r from-cyan-500/10 to-green-500/10 border border-cyan-500/30 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-2">Stay Updated</h2>
        <p className="text-gray-400 mb-4">
          Follow our development progress:
        </p>
        <div className="flex flex-wrap gap-3">
          <a 
            href="https://warpcast.com/mcpvot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors"
          >
            Farcaster
          </a>
          <a 
            href="https://github.com/mcpvot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors"
          >
            GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
