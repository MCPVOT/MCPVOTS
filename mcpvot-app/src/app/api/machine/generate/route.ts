/**
 * VOT Machine - NFT Generate API (AI-Enhanced v2)
 * 
 * POST /api/machine/generate
 * 
 * Generates a personalized HTML NFT page based on user profile:
 * - Identity (Farcaster, ENS, Basename)
 * - Token holdings and badges
 * - Custom styling based on tier
 * - AI-generated uniqueness (tagline, boot sequence, colors)
 * 
 * Pins result to IPFS via Pinata
 * 
 * AI Backend: kwaipilot/kat-coder-pro:free via openrouter-service
 */

import { getVOTRank } from '@/lib/constants';
import {
    generateVOTMachineUniqueness,
    type VOTMachineContext,
} from '@/lib/openrouter-service';
import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// TYPES
// =============================================================================

interface Badge {
  id: string;
  name: string;
  emoji: string;
  tier?: string;
  description: string;
  color: string;
}

// AI-generated uniqueness
interface AIUniqueness {
  tagline: string;
  bootSequence: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  animations: {
    style: string;
    speed: string;
    intensity: string;
  };
}

interface GenerateRequest {
  address: string;
  enableAI?: boolean; // Enable AI-generated uniqueness
  userPrompt?: string; // Custom AI prompt
  tokenId?: number; // For deterministic generation
  profile: {
    displayName: string;
    addressShort: string;
    avatar?: string;
    banner?: string;
    bio?: string;
    basename?: string;
    ensName?: string;
    farcasterUsername?: string;
    farcasterFid?: number;
    farcasterFollowers?: number;
    votBalance: string;
    maxxBalance: string;
    hasWarpletNFT: boolean;
    badges: Badge[];
    ensRecords?: {
      avatar?: string;
      twitter?: string;
      github?: string;
      url?: string;
    };
    links?: Record<string, string>;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function buildMachineContext(
  profile: GenerateRequest['profile'],
  tokenId: number,
  userPrompt?: string
): VOTMachineContext {
  const votNum = parseFloat(profile.votBalance.replace(/,/g, ''));
  return {
    tokenId,
    ensName: profile.ensName,
    basename: profile.basename,
    farcasterUsername: profile.farcasterUsername,
    votBalance: votNum,
    maxxBalance: parseFloat(profile.maxxBalance.replace(/,/g, '')),
    rank: getVOTRank(votNum),
    isWarpletHolder: profile.hasWarpletNFT,
    category: 'vot',
    userPrompt,
  };
}

// =============================================================================
// HTML TEMPLATE GENERATOR
// =============================================================================

function generateVOTMachineHTML(
  profile: GenerateRequest['profile'],
  aiUniqueness?: AIUniqueness
): string {
  const timestamp = new Date().toISOString();
  
  // Use AI colors or defaults
  const colors = aiUniqueness?.colors || {
    primary: '#00ffff',
    secondary: '#8b5cf6',
    accent: '#00d4ff',
  };
  
  // Use AI tagline or fallback
  const tagline = aiUniqueness?.tagline || profile.bio || 'VOT Machine Identity NFT';
  
  // Use AI boot sequence or default
  const bootSequence = aiUniqueness?.bootSequence || 
    `> INITIALIZING VOT MACHINE...\\n> LOADING IDENTITY: ${profile.displayName}\\n> STATUS: ONLINE`;
  
  const badgesHtml = profile.badges
    .map(b => `
      <div class="badge" style="border-color: ${b.color}40; background: ${b.color}15;">
        <span class="badge-emoji">${b.emoji}</span>
        <span class="badge-name" style="color: ${b.color}">${b.name}</span>
        <span class="badge-tier">${b.tier || ''}</span>
      </div>
    `)
    .join('');
  
  // Determine theme based on highest tier badge
  const hasDiamond = profile.badges.some(b => b.id === 'vot-diamond' || b.id === 'vot-whale');
  const hasOG = profile.badges.some(b => b.id === 'warplet-og' || b.id === 'maxx-og');
  const themeClass = hasDiamond ? 'theme-diamond' : hasOG ? 'theme-og' : 'theme-default';
  
  // Build links section
  const linksHtml = [];
  if (profile.farcasterUsername) {
    linksHtml.push(`<a href="https://warpcast.com/${profile.farcasterUsername}" class="link-btn">🟣 Farcaster</a>`);
  }
  if (profile.ensRecords?.twitter || profile.links?.twitter) {
    const tw = profile.ensRecords?.twitter || profile.links?.twitter?.replace('https://x.com/', '');
    linksHtml.push(`<a href="https://x.com/${tw}" class="link-btn">𝕏 Twitter</a>`);
  }
  if (profile.ensRecords?.github || profile.links?.github) {
    const gh = profile.ensRecords?.github || profile.links?.github?.replace('https://github.com/', '');
    linksHtml.push(`<a href="https://github.com/${gh}" class="link-btn">🐙 GitHub</a>`);
  }
  if (profile.ensRecords?.url || profile.links?.website) {
    linksHtml.push(`<a href="${profile.ensRecords?.url || profile.links?.website}" class="link-btn">🌐 Website</a>`);
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${profile.displayName} | VOT Machine</title>
  <meta property="og:title" content="${profile.displayName} | VOT Machine" />
  <meta property="og:description" content="${tagline}" />
  <meta property="og:image" content="${profile.avatar || 'https://mcpvot.xyz/og-image.png'}" />
  <meta name="fc:frame" content="vNext" />
  <meta name="fc:frame:image" content="${profile.avatar || 'https://mcpvot.xyz/og-image.png'}" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @keyframes pulse { 
      0%, 100% { opacity: 1; } 
      50% { opacity: 0.7; } 
    }
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px ${colors.primary}30; }
      50% { box-shadow: 0 0 40px ${colors.primary}60; }
    }
    @keyframes typewriter {
      from { width: 0; }
      to { width: 100%; }
    }
    
    :root {
      --primary: ${colors.primary};
      --secondary: ${colors.secondary};
      --accent: ${colors.accent};
    }
    
    body {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #000;
      color: #fff;
      min-height: 100vh;
      overflow-x: hidden;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* Boot Sequence */
    .boot-sequence {
      font-family: 'SF Mono', Consolas, monospace;
      font-size: 11px;
      color: var(--primary);
      background: #000;
      padding: 12px;
      border: 1px solid var(--primary)40;
      border-radius: 8px;
      margin-bottom: 16px;
      white-space: pre-line;
      animation: pulse 2s ease-in-out infinite;
    }
    
    /* Banner */
    .banner {
      height: 200px;
      background: ${profile.banner 
        ? `url(${profile.banner}) center/cover` 
        : `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20, ${colors.accent}20)`};
      background-size: 200% 200%;
      animation: gradient 15s ease infinite;
      border-radius: 20px 20px 0 0;
      position: relative;
    }
    
    .banner::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 100px;
      background: linear-gradient(transparent, #000);
    }
    
    /* Profile Card */
    .profile-card {
      background: linear-gradient(180deg, #111 0%, #000 100%);
      border: 1px solid ${colors.primary}30;
      border-radius: 0 0 20px 20px;
      padding: 20px;
      margin-top: -60px;
      position: relative;
      animation: glow 3s ease-in-out infinite;
    }
    
    .theme-diamond .profile-card {
      border-color: ${colors.accent}50;
      animation: glow 2s ease-in-out infinite;
    }
    
    .theme-og .profile-card {
      border-color: #ff00ff50;
    }
    
    /* Avatar */
    .avatar-container {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 4px solid #000;
      background: linear-gradient(135deg, #00ffff, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      font-weight: bold;
      animation: float 3s ease-in-out infinite;
    }
    
    .avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .identity {
      flex: 1;
    }
    
    .display-name {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #00ffff, #fff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .address {
      font-family: 'SF Mono', monospace;
      color: #666;
      font-size: 12px;
    }
    
    /* Bio */
    .bio {
      color: #aaa;
      font-size: 14px;
      line-height: 1.5;
      margin: 16px 0;
    }
    
    /* Identity Tags */
    .identity-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 16px 0;
    }
    
    .tag {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .tag-farcaster { background: #855DCD20; color: #855DCD; }
    .tag-ens { background: #5298FF20; color: #5298FF; }
    .tag-basename { background: #0052FF20; color: #0052FF; }
    
    /* Holdings */
    .holdings {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 20px 0;
    }
    
    .holding-card {
      background: #111;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    
    .holding-value {
      font-size: 24px;
      font-weight: 700;
      color: #00ffff;
    }
    
    .holding-card:last-child .holding-value {
      color: #8b5cf6;
    }
    
    .holding-label {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    
    /* Badges */
    .badges-section {
      margin: 20px 0;
    }
    
    .badges-title {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }
    
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px solid;
      border-radius: 10px;
    }
    
    .badge-emoji { font-size: 18px; }
    .badge-name { font-size: 12px; font-weight: 600; }
    .badge-tier { font-size: 10px; color: #666; }
    
    /* Links */
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 20px 0;
    }
    
    .link-btn {
      padding: 10px 16px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 10px;
      color: #fff;
      text-decoration: none;
      font-size: 12px;
      transition: all 0.2s;
    }
    
    .link-btn:hover {
      background: #222;
      border-color: var(--primary)50;
    }
    
    /* Tagline */
    .tagline {
      font-size: 14px;
      color: var(--primary);
      font-style: italic;
      margin-top: 8px;
      opacity: 0.9;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 20px;
      color: #333;
      font-size: 10px;
    }
    
    .footer a {
      color: var(--primary)50;
      text-decoration: none;
    }
    
    /* Grid overlay effect */
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        linear-gradient(90deg, transparent 98%, ${colors.primary}05 98%),
        linear-gradient(transparent 98%, ${colors.primary}05 98%);
      background-size: 50px 50px;
      pointer-events: none;
      z-index: 1000;
    }
  </style>
</head>
<body class="${themeClass}">
  <div class="container">
    <!-- AI Boot Sequence -->
    <div class="boot-sequence">${bootSequence}</div>
    
    <div class="banner"></div>
    
    <div class="profile-card">
      <div class="avatar-container">
        <div class="avatar">
          ${profile.avatar 
            ? `<img src="${profile.avatar}" alt="${profile.displayName}" />`
            : profile.displayName.charAt(0).toUpperCase()
          }
        </div>
        <div class="identity">
          <h1 class="display-name">${profile.displayName}</h1>
          <p class="address">${profile.addressShort}</p>
          ${aiUniqueness?.tagline ? `<p class="tagline">"${tagline}"</p>` : ''}
        </div>
      </div>
      
      ${profile.bio ? `<p class="bio">${profile.bio}</p>` : ''}
      
      <div class="identity-tags">
        ${profile.farcasterUsername ? `<span class="tag tag-farcaster">🟣 @${profile.farcasterUsername}</span>` : ''}
        ${profile.ensName ? `<span class="tag tag-ens">🔵 ${profile.ensName}</span>` : ''}
        ${profile.basename ? `<span class="tag tag-basename">🔷 ${profile.basename}</span>` : ''}
      </div>
      
      <div class="holdings">
        <div class="holding-card">
          <div class="holding-value">${profile.votBalance}</div>
          <div class="holding-label">VOT Balance</div>
        </div>
        <div class="holding-card">
          <div class="holding-value">${profile.maxxBalance}</div>
          <div class="holding-label">MAXX Balance</div>
        </div>
      </div>
      
      ${profile.badges.length > 0 ? `
        <div class="badges-section">
          <div class="badges-title">Badges Earned</div>
          <div class="badges">${badgesHtml}</div>
        </div>
      ` : ''}
      
      ${linksHtml.length > 0 ? `
        <div class="links">${linksHtml.join('')}</div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>VOT Machine Identity NFT</p>
      ${aiUniqueness ? '<p class="ai-badge">✨ AI-Enhanced</p>' : ''}
      <p>Generated ${timestamp}</p>
      <p><a href="https://mcpvot.xyz">mcpvot.xyz</a></p>
    </div>
  </div>
</body>
</html>`;
}

// =============================================================================
// API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    
    if (!body.address || !body.profile) {
      return NextResponse.json(
        { error: 'Missing address or profile' },
        { status: 400 }
      );
    }
    
    // Generate AI uniqueness if enabled
    let aiUniqueness: AIUniqueness | undefined;
    
    if (body.enableAI) {
      try {
        console.log('[Generate] 🤖 Generating AI uniqueness...');
        const tokenId = body.tokenId || Math.floor(Math.random() * 10000);
        const ctx = buildMachineContext(body.profile, tokenId, body.userPrompt);
        const result = await generateVOTMachineUniqueness(ctx);
        
        aiUniqueness = {
          tagline: result.tagline,
          bootSequence: result.bootSequence,
          colors: result.colors,
          animations: result.animations,
        };
        console.log('[Generate] ✅ AI uniqueness generated:', aiUniqueness.tagline);
      } catch (aiError) {
        console.warn('[Generate] AI generation failed, using defaults:', aiError);
        // Continue without AI uniqueness
      }
    }
    
    // Generate HTML (with AI if available)
    const html = generateVOTMachineHTML(body.profile, aiUniqueness);
    
    // Pin to IPFS via Pinata
    const PINATA_JWT = process.env.PINATA_JWT;
    const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://ipfs.io/ipfs/';
    
    if (!PINATA_JWT) {
      console.warn('[Generate] PINATA_JWT not configured');
      return NextResponse.json(
        { error: 'IPFS pinning not configured' },
        { status: 500 }
      );
    }
    
    // Create form data for pinFileToIPFS
    const formData = new FormData();
    formData.append('file', new Blob([html], { type: 'text/html' }), `vot-machine-${body.address.slice(0, 8)}.html`);
    formData.append('pinataMetadata', JSON.stringify({
      name: `VOT Machine - ${body.profile.displayName}`,
      keyvalues: {
        type: 'vot-machine',
        address: body.address,
        displayName: body.profile.displayName,
        aiEnhanced: body.enableAI ? 'true' : 'false',
        generatedAt: new Date().toISOString(),
      },
    }));
    
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });
    
    if (!pinataResponse.ok) {
      const error = await pinataResponse.text();
      console.error('[Generate] Pinata error:', error);
      return NextResponse.json(
        { error: 'Failed to pin to IPFS' },
        { status: 500 }
      );
    }
    
    const pinataResult = await pinataResponse.json();
    const cid = pinataResult.IpfsHash;
    const ipfsUrl = `${PINATA_GATEWAY}${cid}`;
    
    // TODO: Mint ERC-1155 NFT with this CID
    // For now, return the IPFS data
    // In production, this would trigger a contract mint
    
    return NextResponse.json({
      success: true,
      cid,
      ipfsUrl,
      aiEnhanced: !!aiUniqueness,
      aiUniqueness: aiUniqueness ? {
        tagline: aiUniqueness.tagline,
        colors: aiUniqueness.colors,
      } : undefined,
      htmlSize: html.length, // Report size for debugging
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[Generate] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate NFT',
      },
      { status: 500 }
    );
  }
}

// GET - API Info
export async function GET() {
  return NextResponse.json({
    service: 'VOT Machine NFT Generate API',
    version: API_VERSION,
    aiBackend: AI_MODELS.PRIMARY,
    
    features: {
      aiEnhancement: 'Generate unique taglines, colors, boot sequences',
      ipfsPinning: 'Automatic pinning via Pinata',
      farcasterFrames: 'fc:frame meta tags included',
      themeSupport: 'Diamond, OG, and Default themes',
    },
    
    usage: {
      endpoint: 'POST /api/machine/generate',
      params: {
        address: 'User wallet address (required)',
        profile: 'Profile data object (required)',
        enableAI: 'Enable AI enhancement (optional, default: false)',
        userPrompt: 'Custom AI prompt (optional)',
        tokenId: 'Deterministic token ID (optional)',
      },
      example: {
        address: ECOSYSTEM_INFO.treasury,
        enableAI: true,
        userPrompt: 'cyberpunk neon style',
        profile: {
          displayName: 'mcpvot.eth',
          addressShort: '0x824e...BE7fa',
          votBalance: '100000',
          maxxBalance: '50000',
          hasWarpletNFT: true,
          badges: [],
        },
      },
    },
    
    relatedEndpoints: [
      '/api/machine/ai - AI profile analysis',
      '/api/openrouter - Direct LLM access',
      '/api/svg-machine/generate - SVG-only generation',
    ],
    
    ipfsGateway: URLS.PINATA_GATEWAY,
    ecosystem: ECOSYSTEM_INFO,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
