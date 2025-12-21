'use client';

export default function FAQPage() {
  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is MCPVOT?',
          a: 'MCPVOT (MCP + VOT) is an AI-agent ecosystem combining Model Context Protocol servers with the VOT token for decentralized AI services, NFT generation, and agent payments.',
        },
        {
          q: 'What is VOT?',
          a: 'VOT is the ecosystem utility token deployed via Clanker on Base. It powers the x402 payment protocol, determines user ranks (Ghost → Singularity), and has a 1% burn on every transaction.',
        },
        {
          q: 'What is MAXX?',
          a: 'MAXX is the OG ecosystem token that predates VOT. It exists on multiple chains (ETH, Base, Blast) and has its own burn mechanics via staking contracts.',
        },
        {
          q: 'How do VOT and MAXX relate?',
          a: 'They\'re complementary tokens in the same ecosystem. VOT is newer and powers AI agent services via x402. MAXX is the established token with deeper liquidity and community.',
        },
      ],
    },
    {
      category: 'Technical',
      questions: [
        {
          q: 'What is x402?',
          a: 'x402 is a payment protocol (inspired by HTTP 402 Payment Required) enabling AI agents to pay for services. It follows the ERC-8004 standard for agent payments with VOT tokens.',
        },
        {
          q: 'What is MCP?',
          a: 'Model Context Protocol - a standard for AI tools to communicate. MCPVOT runs several MCP servers including maxx-memory (vector storage), ipfs-mcp (storage), and neynar (Farcaster).',
        },
        {
          q: 'How does the AI generate unique content?',
          a: 'We use OpenRouter as an AI gateway with KAT-Coder-Pro as the primary model. It generates taglines, color schemes, boot sequences, and more based on user profiles.',
        },
        {
          q: 'What happens to my data?',
          a: 'Profile data comes from Farcaster (public). Generated content is pinned to IPFS (decentralized). On-chain state is on Base (immutable). We don\'t store private data.',
        },
      ],
    },
    {
      category: 'NFTs & Ranks',
      questions: [
        {
          q: 'How do I get a VOT Machine NFT?',
          a: 'Connect your wallet via the Farcaster Mini-App, pay 100,000 VOT (with 1% burn), and receive an AI-generated ERC-1155 NFT unique to your profile.',
        },
        {
          q: 'What are VOT Ranks?',
          a: 'Ranks are determined by VOT holdings: Ghost (0), Spark (100), Pulse (1K), Circuit (10K), Node (100K), Core (1M), Nexus (10M), Matrix (100M), Singularity (500M+).',
        },
        {
          q: 'Do ranks give any benefits?',
          a: 'Higher ranks unlock different NFT visual styles and may receive priority access to new features. They also show your commitment to the ecosystem.',
        },
        {
          q: 'Is the NFT on-chain?',
          a: 'The ERC-1155 token is on Base. The HTML content is on IPFS with the CID stored in metadata. This means the NFT renders directly from decentralized storage.',
        },
      ],
    },
    {
      category: 'Payments & Tokens',
      questions: [
        {
          q: 'How do I get VOT?',
          a: 'Buy on Uniswap (Base) or receive from the treasury. Search for contract 0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07 on Base network.',
        },
        {
          q: 'What is the 1% burn?',
          a: 'Every x402 payment burns 1% of the VOT used. For a 100,000 VOT NFT mint, 1,000 VOT is burned forever. This makes VOT deflationary over time.',
        },
        {
          q: 'Are services free during alpha?',
          a: 'Yes! During the alpha period, most API endpoints are free to use. x402 payments will be required in production.',
        },
        {
          q: 'What are the service prices?',
          a: 'AI Tagline: 100 VOT, Uniqueness Package: 500 VOT, NFT HTML: 1,000 VOT, NFT + IPFS: 2,500 VOT, SVG Template: 500 VOT, Profile Analysis: 250 VOT.',
        },
      ],
    },
    {
      category: 'Development',
      questions: [
        {
          q: 'How do I integrate MCPVOT into my agent?',
          a: 'Use the REST API at mcpvot.xyz/api. Check /api/x402/agent-data for service discovery. See the SDK docs for curl examples.',
        },
        {
          q: 'Is there a testnet?',
          a: 'We recommend using Base Sepolia for testing. Contact us for testnet VOT tokens.',
        },
        {
          q: 'Can I run my own MCP servers?',
          a: 'Yes! The maxx-memory and ipfs-mcp servers are open source. See the Architecture docs for setup instructions.',
        },
        {
          q: 'How do I report bugs?',
          a: 'Open an issue on GitHub or reach out via Farcaster @mcpvot. Security issues should be reported privately.',
        },
      ],
    },
    {
      category: 'Farcaster',
      questions: [
        {
          q: 'Why Farcaster?',
          a: 'Farcaster provides decentralized social identity, profile data, and the Mini-App framework. It aligns with our decentralization philosophy.',
        },
        {
          q: 'Do I need Farcaster to use MCPVOT?',
          a: 'The Mini-App requires Farcaster. However, the API endpoints can be used by any agent or application with wallet authentication.',
        },
        {
          q: 'What is a Mini-App?',
          a: 'Farcaster Mini-Apps are embedded web applications that run inside Farcaster clients. Users can interact without leaving their social feed.',
        },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">❓ FAQ</h1>
        <p className="text-gray-400 text-lg">
          Frequently asked questions about the MCPVOT ecosystem.
        </p>
      </div>

      {faqs.map((section) => (
        <section key={section.category} className="space-y-4">
          <h2 className="text-2xl font-bold text-cyan-400">{section.category}</h2>
          
          <div className="space-y-3">
            {section.questions.map(({ q, a }) => (
              <details key={q} className="group">
                <summary className="cursor-pointer p-4 bg-black/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                  <span className="font-bold text-white">{q}</span>
                </summary>
                <div className="p-4 pt-2 text-gray-400 text-sm ml-4 border-l-2 border-cyan-500/30">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      {/* Contact */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Still have questions?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <a 
            href="https://warpcast.com/mcpvot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors"
          >
            <span className="text-2xl">💬</span>
            <h3 className="font-bold text-cyan-400 mt-2">Farcaster</h3>
            <p className="text-gray-500 text-sm">Ask on Farcaster @mcpvot</p>
          </a>
          
          <a 
            href="https://github.com/mcpvot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg hover:bg-gray-500/20 transition-colors"
          >
            <span className="text-2xl">🐙</span>
            <h3 className="font-bold text-gray-400 mt-2">GitHub</h3>
            <p className="text-gray-500 text-sm">Open an issue or PR</p>
          </a>
        </div>
      </section>
    </div>
  );
}
