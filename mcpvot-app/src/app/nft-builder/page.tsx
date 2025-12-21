'use client';

/**
 * NFT Builder Page - Your Website IS Your NFT!
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  THE NFT = YOUR GENERATED WEBSITE                                        ║
 * ║                                                                          ║
 * ║  Users create a full HTML website that:                                  ║
 * ║  - Gets pinned to IPFS                                                   ║
 * ║  - Becomes their ENS/Base Name contenthash                              ║
 * ║  - Is minted as an ERC-1155 NFT (the IPFS CID is the NFT!)              ║
 * ║  - Viewable at yourname.eth.limo                                         ║
 * ║                                                                          ║
 * ║  Templates are full website templates like ipfs-landing/index.html       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { THEME_PRESETS } from '@/lib/ens-website-generator-v2';
import { CONTRACTS } from '@/lib/x402-vot-facilitator';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';

// =============================================================================
// TYPES
// =============================================================================

interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  features: string[];
  theme: keyof typeof THEME_PRESETS;
  popular?: boolean;
  new?: boolean;
}

interface WebsiteConfig {
  // Identity
  ensName: string;
  baseName: string;
  nickname: string;
  bio: string;
  avatar: string;
  banner: string;
  
  // Social
  twitter: string;
  github: string;
  farcaster: string;
  discord: string;
  telegram: string;
  email: string;
  website: string;
  
  // Crypto
  ethAddress: string;
  btcAddress: string;
  solAddress: string;
  
  // Features
  showPrices: boolean;
  showContracts: boolean;
  showSocials: boolean;
  enableDataRain: boolean;
  enableScanlines: boolean;
  enableBootSequence: boolean;
}

// =============================================================================
// WEBSITE TEMPLATES (Full HTML pages!)
// =============================================================================

const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  {
    id: 'cyberpunk-terminal',
    name: 'Cyberpunk Terminal',
    description: 'Full-featured landing page with data rain, boot sequence, and live prices',
    previewImage: '/templates/preview-cyberpunk.png',
    features: ['Boot Sequence', 'Data Rain', 'Live Prices', 'Contract Display', 'Social Links'],
    theme: 'cyberpunk',
    popular: true,
  },
  {
    id: 'base-professional',
    name: 'Base Professional',
    description: 'Clean Base-branded website with gradients and modern design',
    previewImage: '/templates/preview-base.png',
    features: ['Base Branding', 'Gradient Effects', 'Portfolio Section', 'Links'],
    theme: 'base',
    popular: true,
  },
  {
    id: 'farcaster-social',
    name: 'Farcaster Social',
    description: 'Social-first landing with Farcaster integration and cast embeds',
    previewImage: '/templates/preview-farcaster.png',
    features: ['Farcaster Feed', 'Cast Embeds', 'Purple Theme', 'Social Grid'],
    theme: 'farcaster',
    new: true,
  },
  {
    id: 'minimal-card',
    name: 'Minimal Card',
    description: 'Simple, elegant single-page profile card',
    previewImage: '/templates/preview-minimal.png',
    features: ['Clean Design', 'Fast Load', 'Essential Links', 'Light Mode'],
    theme: 'minimal',
  },
  {
    id: 'matrix-hacker',
    name: 'Matrix Hacker',
    description: 'Green terminal aesthetic with code rain effects',
    previewImage: '/templates/preview-matrix.png',
    features: ['Code Rain', 'Terminal Style', 'Green Theme', 'Hacker Vibe'],
    theme: 'matrix',
  },
  {
    id: 'neon-artist',
    name: 'Neon Artist',
    description: 'Vibrant neon colors for creative portfolios',
    previewImage: '/templates/preview-neon.png',
    features: ['Neon Glow', 'Gallery Section', 'Glitch Effects', 'Color Burst'],
    theme: 'neon',
  },
];

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_CONFIG: WebsiteConfig = {
  ensName: '',
  baseName: '',
  nickname: '',
  bio: '',
  avatar: '',
  banner: '',
  twitter: '',
  github: '',
  farcaster: '',
  discord: '',
  telegram: '',
  email: '',
  website: '',
  ethAddress: '',
  btcAddress: '',
  solAddress: '',
  showPrices: true,
  showContracts: true,
  showSocials: true,
  enableDataRain: true,
  enableScanlines: true,
  enableBootSequence: true,
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function NFTBuilderPage() {
  // Wallet state
  const { address, isConnected } = useAccount();
  
  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('cyberpunk-terminal');
  const [config, setConfig] = useState<WebsiteConfig>(DEFAULT_CONFIG);
  
  // UI state
  const [step, setStep] = useState<'template' | 'customize' | 'preview' | 'mint'>('template');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintedData, setMintedData] = useState<{
    tokenId: number;
    ipfsCid: string;
    ethLimoUrl: string;
  } | null>(null);
  
  // Preview iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: CONTRACTS.USDC_BASE as `0x${string}`,
  });

  // Auto-fill wallet address
  useEffect(() => {
    if (address && !config.ethAddress) {
      setConfig(prev => ({ ...prev, ethAddress: address }));
    }
  }, [address, config.ethAddress]);

  // Generate website HTML
  const generateWebsite = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      const template = WEBSITE_TEMPLATES.find(t => t.id === selectedTemplate);
      const theme = template ? THEME_PRESETS[template.theme] : THEME_PRESETS.cyberpunk;
      
      // Generate full HTML website
      const html = generateCyberpunkWebsite(config, theme);
      setPreviewHtml(html);
    } catch (error) {
      console.error('Failed to generate website:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplate, config]);

  // Update preview when config changes in preview mode
  useEffect(() => {
    if (step === 'preview') {
      generateWebsite();
    }
  }, [step, generateWebsite]);

  // Handle mint
  const handleMint = async () => {
    if (!isConnected || !address) return;
    
    setIsMinting(true);
    
    try {
      // 1. Generate final HTML/SVG
      const template = WEBSITE_TEMPLATES.find(t => t.id === selectedTemplate);
      const theme = template ? THEME_PRESETS[template.theme] : THEME_PRESETS.cyberpunk;
      const svgContent = generateCyberpunkWebsite(config, theme);
      
      // 2. Call x402 facilitator API to pin and mint
      const response = await fetch('/api/x402/mint-builder-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          ensName: config.ensName,
          baseName: config.baseName,
          farcasterFid: config.farcasterFid,
          svgContent,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Mint failed');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Mint failed');
      }
      
      setMintedData({
        tokenId: result.tokenId,
        ipfsCid: result.ipfsCid,
        ethLimoUrl: config.ensName 
          ? `https://${config.ensName}.eth.limo`
          : `https://gateway.pinata.cloud/ipfs/${result.ipfsCid}`,
      });
      setMintSuccess(true);
    } catch (error) {
      console.error('Mint failed:', error);
      alert(error instanceof Error ? error.message : 'Mint failed');
    } finally {
      setIsMinting(false);
    }
  };

  // Render template selection
  const renderTemplateSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#00ffcc] mb-2">Choose Your Website Template</h2>
        <p className="text-gray-400">Your website becomes your NFT - pinned to IPFS forever</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {WEBSITE_TEMPLATES.map((template) => {
          const theme = THEME_PRESETS[template.theme];
          const isSelected = selectedTemplate === template.id;
          
          return (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                isSelected
                  ? 'border-[#00ffcc] bg-[#00ffcc]/10 scale-[1.02]'
                  : 'border-gray-700 hover:border-gray-500 bg-black/50'
              }`}
            >
              {/* Badges */}
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                {template.popular && (
                  <span className="px-2 py-1 bg-[#ff6600] text-black text-xs font-bold rounded">
                    POPULAR
                  </span>
                )}
                {template.new && (
                  <span className="px-2 py-1 bg-[#8a63d2] text-white text-xs font-bold rounded">
                    NEW
                  </span>
                )}
              </div>
              
              {/* Preview mockup */}
              <div 
                className="w-full h-48 rounded-lg mb-4 overflow-hidden relative"
                style={{ backgroundColor: theme.colors.background }}
              >
                {/* Browser chrome mockup */}
                <div className="absolute top-0 left-0 right-0 h-6 bg-gray-900 flex items-center px-2 gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="flex-1 mx-2">
                    <div className="bg-gray-800 rounded text-[8px] text-gray-400 px-2 py-0.5 text-center">
                      yourname.eth.limo
                    </div>
                  </div>
                </div>
                
                {/* Mini website preview */}
                <div className="pt-8 px-3 pb-3 h-full flex flex-col">
                  {/* Header */}
                  <div className="text-center mb-2">
                    <div 
                      className="w-12 h-12 mx-auto rounded-full mb-1"
                      style={{ backgroundColor: theme.colors.cardBg, border: `2px solid ${theme.colors.primary}` }}
                    />
                    <div className="h-2 w-16 mx-auto rounded" style={{ backgroundColor: theme.colors.primary, opacity: 0.6 }} />
                  </div>
                  
                  {/* Content blocks */}
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 h-8 rounded" style={{ backgroundColor: theme.colors.cardBg }} />
                      <div className="flex-1 h-8 rounded" style={{ backgroundColor: theme.colors.cardBg }} />
                    </div>
                    <div className="h-6 w-3/4 mx-auto rounded" style={{ backgroundColor: theme.colors.cardBg }} />
                  </div>
                  
                  {/* Effects indicator */}
                  {theme.effects.dataRain && (
                    <div className="absolute top-8 left-0 right-0 bottom-0 pointer-events-none overflow-hidden opacity-30">
                      <div className="text-[6px] text-green-500 font-mono leading-none">
                        {'01'.repeat(50)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Info */}
              <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{template.description}</p>
              
              {/* Features */}
              <div className="flex flex-wrap gap-1">
                {template.features.slice(0, 3).map((feature) => (
                  <span 
                    key={feature}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
                  >
                    {feature}
                  </span>
                ))}
                {template.features.length > 3 && (
                  <span className="text-xs text-gray-500">+{template.features.length - 3}</span>
                )}
              </div>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute bottom-4 right-4 w-6 h-6 bg-[#00ffcc] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={() => setStep('customize')}
          className="px-8 py-4 bg-[#00ffcc] text-black font-bold rounded-lg hover:bg-[#00ffcc]/80 transition-colors"
        >
          Customize {WEBSITE_TEMPLATES.find(t => t.id === selectedTemplate)?.name} →
        </button>
      </div>
    </div>
  );

  // Render customization form
  const renderCustomization = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#00ffcc] mb-2">Customize Your Website</h2>
        <p className="text-gray-400">Fill in your details to personalize your web3 landing page</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Identity Section */}
        <div className="bg-black/50 border border-gray-700 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-bold text-[#00ffcc] flex items-center gap-2">
            <span>👤</span> Identity
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">ENS Name</label>
              <input
                type="text"
                value={config.ensName}
                onChange={(e) => setConfig({ ...config, ensName: e.target.value })}
                placeholder="yourname.eth"
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Base Name</label>
              <input
                type="text"
                value={config.baseName}
                onChange={(e) => setConfig({ ...config, baseName: e.target.value })}
                placeholder="yourname.base"
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Display Name</label>
            <input
              type="text"
              value={config.nickname}
              onChange={(e) => setConfig({ ...config, nickname: e.target.value })}
              placeholder="Your Name or Alias"
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea
              value={config.bio}
              onChange={(e) => setConfig({ ...config, bio: e.target.value })}
              placeholder="Tell the world about yourself..."
              rows={3}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Avatar URL</label>
              <input
                type="text"
                value={config.avatar}
                onChange={(e) => setConfig({ ...config, avatar: e.target.value })}
                placeholder="https://... or ipfs://..."
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Banner URL</label>
              <input
                type="text"
                value={config.banner}
                onChange={(e) => setConfig({ ...config, banner: e.target.value })}
                placeholder="https://... or ipfs://..."
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none"
              />
            </div>
          </div>
        </div>
        
        {/* Social Section */}
        <div className="bg-black/50 border border-gray-700 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-bold text-[#00ffcc] flex items-center gap-2">
            <span>🔗</span> Social Links
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Twitter/X</label>
              <input
                type="text"
                value={config.twitter}
                onChange={(e) => setConfig({ ...config, twitter: e.target.value })}
                placeholder="@username"
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">GitHub</label>
              <input
                type="text"
                value={config.github}
                onChange={(e) => setConfig({ ...config, github: e.target.value })}
                placeholder="username"
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Farcaster</label>
              <input
                type="text"
                value={config.farcaster}
                onChange={(e) => setConfig({ ...config, farcaster: e.target.value })}
                placeholder="@username"
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Discord</label>
              <input
                type="text"
                value={config.discord}
                onChange={(e) => setConfig({ ...config, discord: e.target.value })}
                placeholder="username#0000"
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Telegram</label>
              <input
                type="text"
                value={config.telegram}
                onChange={(e) => setConfig({ ...config, telegram: e.target.value })}
                placeholder="@username"
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                placeholder="you@email.com"
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Website</label>
            <input
              type="text"
              value={config.website}
              onChange={(e) => setConfig({ ...config, website: e.target.value })}
              placeholder="https://yourwebsite.com"
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-[#00ffcc] focus:outline-none"
            />
          </div>
        </div>
        
        {/* Crypto Section */}
        <div className="bg-black/50 border border-gray-700 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-bold text-[#ff6600] flex items-center gap-2">
            <span>💰</span> Crypto Addresses
          </h3>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ethereum / Base</label>
            <input
              type="text"
              value={config.ethAddress}
              onChange={(e) => setConfig({ ...config, ethAddress: e.target.value })}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-[#00ffcc] focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bitcoin</label>
            <input
              type="text"
              value={config.btcAddress}
              onChange={(e) => setConfig({ ...config, btcAddress: e.target.value })}
              placeholder="bc1... or 1..."
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-[#00ffcc] focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Solana</label>
            <input
              type="text"
              value={config.solAddress}
              onChange={(e) => setConfig({ ...config, solAddress: e.target.value })}
              placeholder="..."
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-[#00ffcc] focus:outline-none"
            />
          </div>
        </div>
        
        {/* Features Section */}
        <div className="bg-black/50 border border-gray-700 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-bold text-[#8a63d2] flex items-center gap-2">
            <span>⚡</span> Website Features
          </h3>
          
          <div className="space-y-3">
            {[
              { key: 'showPrices', label: 'Show Live Prices', desc: 'Display VOT/MAXX prices' },
              { key: 'showContracts', label: 'Show Contracts', desc: 'Display contract addresses' },
              { key: 'showSocials', label: 'Show Social Links', desc: 'Display social media links' },
              { key: 'enableDataRain', label: 'Data Rain Effect', desc: 'Matrix-style background' },
              { key: 'enableScanlines', label: 'Scanlines Effect', desc: 'CRT monitor effect' },
              { key: 'enableBootSequence', label: 'Boot Sequence', desc: 'Terminal startup animation' },
            ].map((feature) => (
              <label key={feature.key} className="flex items-center justify-between p-3 bg-black/30 rounded-lg cursor-pointer hover:bg-black/50 transition-colors">
                <div>
                  <div className="text-white">{feature.label}</div>
                  <div className="text-xs text-gray-500">{feature.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={config[feature.key as keyof WebsiteConfig] as boolean}
                  onChange={(e) => setConfig({ ...config, [feature.key]: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 bg-black text-[#00ffcc] focus:ring-[#00ffcc]"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={() => setStep('template')}
          className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => setStep('preview')}
          className="px-8 py-4 bg-[#00ffcc] text-black font-bold rounded-lg hover:bg-[#00ffcc]/80 transition-colors"
        >
          Preview Website →
        </button>
      </div>
    </div>
  );

  // Render preview
  const renderPreview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#00ffcc] mb-2">Preview Your Website</h2>
        <p className="text-gray-400">This is exactly how your website will look when hosted on IPFS</p>
      </div>
      
      {/* Full-width browser preview */}
      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-gray-700 rounded-lg px-4 py-1.5 text-sm text-gray-300 flex items-center gap-2">
              <span>🔒</span>
              <span>{config.ensName ? `${config.ensName}.eth.limo` : 'ipfs://your-website-cid'}</span>
            </div>
          </div>
          <button
            onClick={generateWebsite}
            className="px-3 py-1 text-sm bg-[#00ffcc]/20 text-[#00ffcc] rounded hover:bg-[#00ffcc]/30"
          >
            Refresh
          </button>
        </div>
        
        {/* Website iframe */}
        <div className="relative" style={{ height: '70vh' }}>
          {isGenerating ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-[#00ffcc] border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-[#00ffcc]">Generating website...</p>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
              title="Website Preview"
            />
          )}
        </div>
      </div>
      
      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/50 border border-gray-700 rounded-xl p-4">
          <h4 className="text-[#00ffcc] font-bold mb-2">📌 IPFS Storage</h4>
          <p className="text-sm text-gray-400">Your website will be permanently pinned to IPFS</p>
        </div>
        <div className="bg-black/50 border border-gray-700 rounded-xl p-4">
          <h4 className="text-[#00ffcc] font-bold mb-2">🏷️ NFT Ownership</h4>
          <p className="text-sm text-gray-400">The IPFS CID becomes your NFT proof of ownership</p>
        </div>
        <div className="bg-black/50 border border-gray-700 rounded-xl p-4">
          <h4 className="text-[#00ffcc] font-bold mb-2">🌐 ENS Integration</h4>
          <p className="text-sm text-gray-400">Set as contenthash for yourname.eth.limo</p>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={() => setStep('customize')}
          className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition-colors"
        >
          ← Edit
        </button>
        <button
          onClick={() => setStep('mint')}
          className="px-8 py-4 bg-gradient-to-r from-[#00ffcc] to-[#00ff66] text-black font-bold rounded-lg hover:opacity-90 transition-colors"
        >
          Mint as NFT →
        </button>
      </div>
    </div>
  );

  // Render mint step
  const renderMint = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#00ffcc] mb-2">
          {mintSuccess ? '🎉 Website Minted!' : 'Mint Your Website NFT'}
        </h2>
        <p className="text-gray-400">
          {mintSuccess 
            ? 'Your website is now live on IPFS and minted as an NFT!'
            : 'Pay $1 USDC to pin your website to IPFS and mint your NFT'}
        </p>
      </div>
      
      {mintSuccess && mintedData ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-[#00ff00]/10 border border-[#00ff00]/30 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">🌐</div>
            <h3 className="text-2xl font-bold text-white mb-2">Your Website is Live!</h3>
            <p className="text-gray-400 mb-6">MCPVOT Builder #{mintedData.tokenId}</p>
            
            <a
              href={mintedData.ethLimoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full p-4 bg-black/50 border border-[#00ffcc] rounded-xl mb-4 hover:bg-[#00ffcc]/10 transition-colors"
            >
              <div className="text-sm text-gray-400 mb-1">Your Website URL</div>
              <div className="text-[#00ffcc] font-bold text-lg">{mintedData.ethLimoUrl} ↗</div>
            </a>
            
            <div className="p-4 bg-black/50 border border-gray-700 rounded-xl mb-6">
              <div className="text-sm text-gray-400 mb-1">IPFS CID (Your NFT)</div>
              <code className="text-sm text-white break-all">{mintedData.ipfsCid}</code>
            </div>
            
            <div className="flex gap-4 justify-center">
              <a href={mintedData.ethLimoUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-[#00ffcc] text-black font-bold rounded-lg hover:bg-[#00ffcc]/80">
                Visit Website ↗
              </a>
              <a href={`https://opensea.io/assets/base/${CONTRACTS.MCPVOT_BUILDER_NFT}/${mintedData.tokenId}`} target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-[#00ffcc] text-[#00ffcc] rounded-lg hover:bg-[#00ffcc]/10">
                OpenSea ↗
              </a>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#00ff00]/10 border border-[#00ff00]/30 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-[#00ff00]">100,000</div>
              <div className="text-sm text-gray-400">VOT Received</div>
            </div>
            <div className="bg-[#ff6600]/10 border border-[#ff6600]/30 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-2xl font-bold text-[#ff6600]">1,000</div>
              <div className="text-sm text-gray-400">VOT Burned</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="bg-black/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">What You Get</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-3 border-b border-gray-800">
                <span className="text-2xl">🌐</span>
                <div className="flex-1">
                  <div className="text-white">Permanent Website</div>
                  <div className="text-xs text-gray-500">Hosted on IPFS forever</div>
                </div>
                <span className="text-[#00ff00]">✓</span>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-gray-800">
                <span className="text-2xl">🏷️</span>
                <div className="flex-1">
                  <div className="text-white">ERC-1155 NFT</div>
                  <div className="text-xs text-gray-500">Ownership proof on Base</div>
                </div>
                <span className="text-[#00ff00]">✓</span>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-gray-800">
                <span className="text-2xl">💰</span>
                <div className="flex-1">
                  <div className="text-white">10,000 VOT Tokens</div>
                  <div className="text-xs text-gray-500">Ecosystem rewards</div>
                </div>
                <span className="text-[#00ff00]">✓</span>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-gray-800">
                <span className="text-2xl">⛽</span>
                <div className="flex-1">
                  <div className="text-white">Gas Sponsored</div>
                  <div className="text-xs text-gray-500">We pay the gas fees</div>
                </div>
                <span className="text-[#00ff00]">FREE</span>
              </div>
              <div className="flex justify-between items-center py-3 text-lg font-bold">
                <span className="text-white">Total Cost</span>
                <span className="text-[#00ffcc]">$1.00 USDC</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-[#00ffcc]/10 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Your USDC Balance:</span>
                <span className="text-white">{usdcBalance ? (Number(usdcBalance.value) / 1e6).toFixed(2) : '0.00'} USDC</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleMint}
            disabled={isMinting || !isConnected}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isMinting ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#00ffcc] to-[#00ff66] text-black hover:opacity-90'}`}
          >
            {isMinting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                Minting Website...
              </span>
            ) : (
              'Mint Website NFT for $1 USDC'
            )}
          </button>
        </div>
      )}
      
      {!mintSuccess && (
        <div className="flex justify-center">
          <button onClick={() => setStep('preview')} className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition-colors">
            ← Back to Preview
          </button>
        </div>
      )}
    </div>
  );

  // Progress indicator
  const renderProgress = () => {
    const steps = [
      { id: 'template', label: 'Template', icon: '📋' },
      { id: 'customize', label: 'Customize', icon: '✏️' },
      { id: 'preview', label: 'Preview', icon: '👁️' },
      { id: 'mint', label: 'Mint', icon: '🚀' },
    ];
    
    const currentIndex = steps.findIndex(s => s.id === step);
    
    return (
      <div className="flex items-center justify-center gap-1 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${i <= currentIndex ? 'bg-[#00ffcc] text-black' : 'bg-gray-800 text-gray-500'}`}>
              {s.icon}
            </div>
            <span className={`ml-2 text-sm hidden md:inline ${i <= currentIndex ? 'text-white' : 'text-gray-500'}`}>{s.label}</span>
            {i < steps.length - 1 && <div className={`w-8 md:w-16 h-0.5 mx-2 ${i < currentIndex ? 'bg-[#00ffcc]' : 'bg-gray-800'}`} />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#00ffcc]">MCPVOT</span>
            <span className="text-sm text-gray-500">Website Builder</span>
          </Link>
          
          {isConnected ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              <div className="w-3 h-3 bg-[#00ff00] rounded-full animate-pulse" />
            </div>
          ) : (
            <button className="px-4 py-2 bg-[#00ffcc] text-black rounded-lg font-bold">Connect Wallet</button>
          )}
        </div>
      </header>
      
      <div className="bg-gradient-to-b from-[#00ffcc]/10 to-transparent py-8">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Your Website = </span>
            <span className="text-[#00ffcc]">Your NFT</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Create a stunning web3 landing page, pin it to IPFS, and mint it as an NFT.
            <br />
            Access it forever at <span className="text-[#00ffcc]">yourname.eth.limo</span>
          </p>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {renderProgress()}
        
        {!isConnected ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔌</div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to start building your website NFT</p>
            <button className="px-8 py-4 bg-[#00ffcc] text-black font-bold rounded-lg">Connect Wallet</button>
          </div>
        ) : (
          <>
            {step === 'template' && renderTemplateSelection()}
            {step === 'customize' && renderCustomization()}
            {step === 'preview' && renderPreview()}
            {step === 'mint' && renderMint()}
          </>
        )}
      </div>
      
      <footer className="border-t border-gray-800 mt-20 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>VOT Machine • Your Website = Your NFT</p>
          <p className="mt-2">
            <Link href="/architecture" className="text-[#00ffcc] hover:underline">Architecture</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}

// Website Generator Function
function generateCyberpunkWebsite(config: WebsiteConfig, theme: typeof THEME_PRESETS.cyberpunk): string {
  const displayName = config.nickname || config.ensName || config.baseName || 'Builder';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${displayName} | MCPVOT Builder</title>
  <meta name="description" content="${config.bio || 'MCPVOT Ecosystem Builder'}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
    :root { --primary: ${theme.colors.primary}; --secondary: ${theme.colors.secondary}; --bg: ${theme.colors.background}; --text: ${theme.colors.text}; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Share Tech Mono', monospace; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; }
    ${config.enableScanlines ? `.scanlines { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px); opacity: 0.3; z-index: 1000; }` : ''}
    .container { max-width: 600px; width: 100%; text-align: center; }
    .avatar { width: 120px; height: 120px; border-radius: 50%; border: 3px solid var(--primary); margin: 0 auto 1.5rem; background: ${theme.colors.cardBg}; display: flex; align-items: center; justify-content: center; font-size: 3rem; overflow: hidden; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .ens-name { color: var(--secondary); margin-bottom: 1rem; }
    .bio { color: rgba(255,255,255,0.7); margin-bottom: 2rem; line-height: 1.6; }
    .links { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-bottom: 2rem; }
    .link { padding: 0.75rem 1.5rem; background: ${theme.colors.cardBg}; border: 1px solid var(--primary); color: var(--primary); text-decoration: none; transition: all 0.3s; }
    .link:hover { background: var(--primary); color: var(--bg); }
    .address { padding: 1rem; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem; word-break: break-all; margin-top: 2rem; }
    .footer { margin-top: 3rem; opacity: 0.5; font-size: 0.8rem; }
  </style>
</head>
<body>
  ${config.enableScanlines ? '<div class="scanlines"></div>' : ''}
  <div class="container">
    <div class="avatar">${config.avatar ? `<img src="${config.avatar}" alt="${displayName}">` : '👤'}</div>
    <h1>${displayName}</h1>
    ${config.ensName ? `<p class="ens-name">${config.ensName}</p>` : ''}
    ${config.baseName ? `<p class="ens-name">${config.baseName}</p>` : ''}
    ${config.bio ? `<p class="bio">${config.bio}</p>` : ''}
    ${config.showSocials ? `<div class="links">
      ${config.twitter ? `<a href="https://twitter.com/${config.twitter.replace('@', '')}" class="link" target="_blank">Twitter</a>` : ''}
      ${config.github ? `<a href="https://github.com/${config.github}" class="link" target="_blank">GitHub</a>` : ''}
      ${config.farcaster ? `<a href="https://warpcast.com/${config.farcaster.replace('@', '')}" class="link" target="_blank">Farcaster</a>` : ''}
      ${config.telegram ? `<a href="https://t.me/${config.telegram.replace('@', '')}" class="link" target="_blank">Telegram</a>` : ''}
      ${config.website ? `<a href="${config.website}" class="link" target="_blank">Website</a>` : ''}
    </div>` : ''}
    ${config.ethAddress ? `<div class="address"><strong>ETH/Base:</strong><br>${config.ethAddress}</div>` : ''}
    <div class="footer">Built with MCPVOT • Powered by x402 Protocol</div>
  </div>
</body>
</html>`;
}
