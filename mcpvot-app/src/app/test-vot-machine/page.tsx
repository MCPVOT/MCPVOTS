/**
 * VOT Machine Test Page
 * Preview the responsive VOT Machine NFT generator with sample data
 */
'use client';

import VotMachineResponsive, {
    type ResponsiveOptions,
    type VotMachineData
} from '@/lib/svg-machine/templates/vot-machine-responsive';
import { useState } from 'react';

// Sample data presets
const SAMPLE_DATA: Record<string, VotMachineData> = {
  oracle: {
    displayName: 'vitalik.eth',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    bio: 'Building the future of decentralized identity',
    traits: { vot: true, mcpvot: true, warplet: true, base: true, farcaster: true, ens: true },
    votBalance: '1500000',
    stakingRewards: '45000',
    xpLevel: 42,
    xpProgress: 78,
    tokenId: '1',
    tier: 'oracle',
  },
  architek: {
    displayName: 'builder.base.eth',
    address: '0x1234567890123456789012345678901234567890',
    bio: 'MCPVOT ecosystem architect',
    traits: { vot: true, mcpvot: true, warplet: true, base: true, farcaster: true, ens: false },
    votBalance: '750000',
    xpLevel: 28,
    xpProgress: 45,
    tokenId: '42',
    tier: 'architek',
  },
  newUser: {
    displayName: '0x7890...ABCD',
    address: '0x7890ABCD7890ABCD7890ABCD7890ABCD7890ABCD',
    traits: { vot: true, mcpvot: false, warplet: false, base: true, farcaster: false, ens: false },
    votBalance: '100000',
    xpLevel: 3,
    xpProgress: 25,
    tokenId: '999',
    tier: 'base',
  },
};

export default function TestVotMachinePage() {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof SAMPLE_DATA>('oracle');
  const [format, setFormat] = useState<'svg' | 'html'>('svg');
  const [animations, setAnimations] = useState({
    bootSequence: true,
    glyphStream: true,
    glyphConstellation: true,
    sacredGeometry: true,
    votConstellation: false,
    mcpNetwork: true,
    burnEffect: true,
    identityConvergence: false,
    tierAura: true,
    chainFlow: true,
    glowPulse: true,
    statsCounter: true,
    reducedMotion: false,
  });

  const data = SAMPLE_DATA[selectedPreset];
  
  const options: ResponsiveOptions = {
    format,
    animations,
    targetWidth: 800,
    aspectRatio: '4:3',
  };

  const output = VotMachineResponsive.generateResponsiveVotMachine(data, options);

  const toggleAnimation = (key: keyof typeof animations) => {
    setAnimations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#00FFCC] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-[#00FFCC]/30 pb-4">
          <h1 className="text-3xl font-bold font-mono mb-2">
            🔮 VOT Machine Test Lab
          </h1>
          <p className="text-sm opacity-60">
            Preview and customize the responsive VOT Machine NFT generator
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Preset Selector */}
            <div className="bg-black/50 border border-[#00FFCC]/30 rounded-lg p-4">
              <h2 className="text-sm font-bold mb-3 uppercase tracking-wider">
                📋 Data Preset
              </h2>
              <div className="space-y-2">
                {Object.keys(SAMPLE_DATA).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSelectedPreset(preset as keyof typeof SAMPLE_DATA)}
                    className={`w-full px-3 py-2 rounded text-left text-sm font-mono transition-all
                      ${selectedPreset === preset 
                        ? 'bg-[#00FFCC]/20 border border-[#00FFCC]' 
                        : 'border border-gray-700 hover:border-[#00FFCC]/50'}`}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                    <span className="text-xs opacity-50 ml-2">
                      ({SAMPLE_DATA[preset as keyof typeof SAMPLE_DATA].tier})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selector */}
            <div className="bg-black/50 border border-[#00FFCC]/30 rounded-lg p-4">
              <h2 className="text-sm font-bold mb-3 uppercase tracking-wider">
                📄 Output Format
              </h2>
              <div className="flex gap-2">
                {(['svg', 'html'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 px-3 py-2 rounded text-sm font-mono uppercase
                      ${format === f 
                        ? 'bg-[#00FFCC] text-black' 
                        : 'border border-gray-700 hover:border-[#00FFCC]/50'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Animation Toggles */}
            <div className="bg-black/50 border border-[#00FFCC]/30 rounded-lg p-4">
              <h2 className="text-sm font-bold mb-3 uppercase tracking-wider">
                ✨ Animations
              </h2>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {Object.entries(animations).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => toggleAnimation(key as keyof typeof animations)}
                      className="w-4 h-4 accent-[#00FFCC]"
                    />
                    <span className="text-xs font-mono opacity-70 group-hover:opacity-100">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-black/50 border border-[#00FFCC]/30 rounded-lg p-4">
              <h2 className="text-sm font-bold mb-3 uppercase tracking-wider">
                📊 Current Data
              </h2>
              <div className="text-xs font-mono space-y-1 opacity-70">
                <p>Tier: <span className="text-white">{data.tier}</span></p>
                <p>Traits: <span className="text-white">{VotMachineResponsive.countActiveTraits(data.traits)}/6</span></p>
                <p>VOT: <span className="text-white">{VotMachineResponsive.formatNumber(data.votBalance)}</span></p>
                <p>XP Level: <span className="text-white">{data.xpLevel}</span></p>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-black/50 border border-[#00FFCC]/30 rounded-lg overflow-hidden">
              <div className="border-b border-[#00FFCC]/30 px-4 py-2 flex justify-between items-center">
                <span className="text-sm font-mono opacity-60">Preview</span>
                <span className="text-xs font-mono opacity-40">
                  {format.toUpperCase()} • 800x600
                </span>
              </div>
              
              {format === 'svg' ? (
                <div 
                  className="p-4"
                  dangerouslySetInnerHTML={{ __html: output }}
                />
              ) : (
                <iframe
                  srcDoc={output}
                  className="w-full h-[600px] border-0"
                  title="VOT Machine HTML Preview"
                />
              )}
            </div>

            {/* Code Output */}
            <div className="mt-4 bg-black/50 border border-[#00FFCC]/30 rounded-lg overflow-hidden">
              <div className="border-b border-[#00FFCC]/30 px-4 py-2 flex justify-between items-center">
                <span className="text-sm font-mono opacity-60">Generated Code</span>
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="text-xs font-mono px-2 py-1 bg-[#00FFCC]/10 rounded hover:bg-[#00FFCC]/20 transition-colors"
                >
                  📋 Copy
                </button>
              </div>
              <pre className="p-4 text-xs font-mono overflow-auto max-h-60 opacity-70">
                {output.slice(0, 2000)}...
              </pre>
            </div>
          </div>
        </div>

        {/* Glyph Codex Reference */}
        <div className="mt-8 bg-black/50 border border-[#00FFCC]/30 rounded-lg p-4">
          <h2 className="text-sm font-bold mb-4 uppercase tracking-wider">
            𒆜 VOT Glyph Codex Reference
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-3">
            {VotMachineResponsive.VOT_GLYPH_CODEX.map((glyph) => (
              <div
                key={glyph.id}
                className="text-center p-2 rounded bg-black/30 border border-gray-800 hover:border-[#00FFCC]/50 transition-colors group"
                title={`${glyph.transliteration}: ${glyph.meaning}`}
              >
                <div 
                  className="text-2xl mb-1"
                  style={{ color: VotMachineResponsive.GLYPH_TONE_COLORS[glyph.tone] }}
                >
                  {glyph.glyph}
                </div>
                <div className="text-[8px] font-mono opacity-50 group-hover:opacity-100 truncate">
                  {glyph.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
