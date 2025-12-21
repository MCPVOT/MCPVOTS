'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/**
 * MCPVOT Architecture - Three.js + SVG Animated Retro Style
 * 
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  x402 • MCP • IPFS • VOT • MAXX Architecture Visualization   ║
 * ║  Mobile-First MiniApp | Farcaster Ready | LLM Agent Friendly ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * x402 VOT/MAXX FACILITATOR NETWORK
 * ERC-8004 Compliant | OpenRouter AI Integrated
 */

// ═══════════════════════════════════════════════════════════════
// BOOT SEQUENCE & CONFIG
// ═══════════════════════════════════════════════════════════════
const BOOT_SEQUENCE = [
  'INITIALIZING x402VOT ARCHITECTURE...',
  'LOADING ERC-8004 PROTOCOL LAYER...',
  'CONNECTING IPFS MEMORY VAULT...',
  'SYNCING BASE NETWORK NODES...',
  'ACTIVATING LLM AGENT INTERFACES...',
  'SCANNING x402 FACILITATOR NETWORK...',
  'CALIBRATING ZERO FAILURE REDUNDANCY...',
  'VOT/MAXX ECOSYSTEM ONLINE',
];

// x402 VOT/MAXX Facilitator Registry (ERC-8004)
const X402_FACILITATORS = [
  {
    id: 'vot-treasury',
    name: 'VOT Treasury',
    address: '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa',
    role: 'TREASURY',
    status: 'active',
    chain: 'BASE',
    erc8004: true,
  },
  {
    id: 'vot-token',
    name: 'VOT Token',
    address: '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07',
    role: 'TOKEN',
    status: 'active',
    chain: 'BASE',
    erc8004: true,
  },
  {
    id: 'maxx-token',
    name: 'MAXX Token',
    address: '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467',
    role: 'TOKEN',
    status: 'active',
    chain: 'BASE',
    erc8004: true,
  },
  {
    id: 'x402-gateway',
    name: 'x402 Agent Gateway',
    address: 'https://x402-proxy.t54.ai',
    role: 'GATEWAY',
    status: 'active',
    chain: 'MULTI',
    erc8004: true,
  },
  {
    id: 'ipfs-vault',
    name: 'IPFS Memory Vault',
    address: 'ipfs://maxx-memory',
    role: 'STORAGE',
    status: 'active',
    chain: 'IPFS',
    erc8004: false,
  },
  {
    id: 'mcp-server',
    name: 'MCP Protocol Server',
    address: 'mcp://maxx-memory',
    role: 'PROTOCOL',
    status: 'active',
    chain: 'LOCAL',
    erc8004: false,
  },
];

// Architecture Layers
const ARCHITECTURE_LAYERS = [
  {
    id: 'presentation',
    name: 'PRESENTATION LAYER',
    components: ['Farcaster MiniApp', 'Next.js 15 Frontend', 'Three.js Visualization', 'Mobile PWA'],
    color: '#00ffcc',
  },
  {
    id: 'protocol',
    name: 'PROTOCOL LAYER',
    components: ['MCP Server', 'x402 Gateway', 'ERC-8004 Registry', 'WebSocket Bridge'],
    color: '#ff6600',
  },
  {
    id: 'data',
    name: 'DATA LAYER',
    components: ['IPFS Storage', 'SQLite Memory', 'Vector Embeddings', 'ENS Records'],
    color: '#0052ff',
  },
  {
    id: 'blockchain',
    name: 'BLOCKCHAIN LAYER',
    components: ['Base Network', 'VOT Token', 'MAXX Token', 'Smart Contracts'],
    color: '#ff0066',
  },
];

// Dynamic Three.js import (SSR safe)
const ThreeScene = dynamic(() => import('@/components/architecture/ThreeScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="text-cyan-400 font-mono animate-pulse">LOADING 3D ENGINE...</div>
    </div>
  ),
});

// ═══════════════════════════════════════════════════════════════
// SVG COMPONENTS - RETRO ANIMATED STYLE
// ═══════════════════════════════════════════════════════════════

// Animated Loading Gauge
const LoadingGauge = ({ progress, label }: { progress: number; label: string }) => (
  <svg viewBox="0 0 120 120" className="w-24 h-24 md:w-32 md:h-32">
    <defs>
      <filter id="techGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    {/* Outer ring */}
    <circle cx="60" cy="60" r="55" fill="none" stroke="#00ffcc" strokeWidth="1" opacity="0.2"/>
    
    {/* Tick marks */}
    <g opacity="0.5">
      <path d="M 60,5 L 60,10 M 115,60 L 110,60 M 60,115 L 60,110 M 5,60 L 10,60" stroke="#00ffcc" strokeWidth="1"/>
    </g>
    
    {/* Progress arc */}
    <circle 
      cx="60" cy="60" r="50" 
      fill="none" 
      stroke="#00ffcc" 
      strokeWidth="3"
      strokeDasharray={`${progress * 3.14} 314`}
      transform="rotate(-90 60 60)"
      filter="url(#techGlow)"
      className="transition-all duration-300"
    />
    
    {/* Inner dashed ring */}
    <circle cx="60" cy="60" r="40" fill="none" stroke="#00ffcc" strokeWidth="1" opacity="0.1"/>
    <circle cx="60" cy="60" r="30" fill="none" stroke="#ff6600" strokeWidth="1" opacity="0.3" strokeDasharray="5 5">
      <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="8s" repeatCount="indefinite"/>
    </circle>
    
    {/* Center display */}
    <rect x="35" y="50" width="50" height="20" fill="#000000" stroke="#00ffcc" strokeWidth="1"/>
    <text x="60" y="64" fontFamily="'Courier New', monospace" fontSize="12" fill="#00ffcc" textAnchor="middle" fontWeight="bold">
      {progress}%
    </text>
    
    {/* Label */}
    <text x="60" y="20" fontFamily="'Courier New', monospace" fontSize="8" fill="#00ffcc" textAnchor="middle" opacity="0.6">
      {label}
    </text>
  </svg>
);

// Radar Scanner SVG
const RadarScanner = () => (
  <svg viewBox="0 0 120 120" className="w-20 h-20 md:w-28 md:h-28">
    <defs>
      <radialGradient id="pulseGradient">
        <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.8"/>
        <stop offset="50%" stopColor="#00ffcc" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#00ffcc" stopOpacity="0"/>
      </radialGradient>
    </defs>
    
    <circle cx="60" cy="60" r="55" fill="none" stroke="#00ffcc" strokeWidth="1" opacity="0.2"/>
    <circle cx="60" cy="60" r="40" fill="none" stroke="#00ffcc" strokeWidth="1" opacity="0.1"/>
    <circle cx="60" cy="60" r="25" fill="none" stroke="#00ffcc" strokeWidth="1" opacity="0.1"/>
    
    {/* Cross hairs */}
    <path d="M 5,60 L 115,60 M 60,5 L 60,115" stroke="#00ffcc" strokeWidth="0.5" opacity="0.3"/>
    
    {/* Sweep */}
    <g>
      <path d="M 60,60 L 60,5" stroke="#00ffcc" strokeWidth="2" opacity="0.8">
        <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="2s" repeatCount="indefinite"/>
      </path>
      <path d="M 60,60 L 60,5 A 55,55 0 0,1 99,21 Z" fill="url(#pulseGradient)" opacity="0.4">
        <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="2s" repeatCount="indefinite"/>
      </path>
    </g>
    
    {/* Blips */}
    <circle r="3" fill="#ff6600">
      <animateMotion path="M 80,30 L 35,75 L 90,85 L 80,30" dur="4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    
    <text x="60" y="110" fontFamily="'Courier New', monospace" fontSize="8" fill="#00ffcc" textAnchor="middle" opacity="0.6">
      NET.SCAN
    </text>
  </svg>
);

// Central Hexagonal Core
const HexCore = ({ label }: { label: string }) => (
  <svg viewBox="0 0 200 200" className="w-32 h-32 md:w-48 md:h-48">
    <defs>
      <filter id="chromatic">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur"/>
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="red"/>
        <feOffset in="red" dx="2" dy="0" result="offsetRed">
          <animate attributeName="dx" values="1;3;1" dur="0.2s" repeatCount="indefinite"/>
        </feOffset>
        <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cyan"/>
        <feOffset in="cyan" dx="-2" dy="0" result="offsetCyan">
          <animate attributeName="dx" values="-1;-3;-1" dur="0.2s" repeatCount="indefinite"/>
        </feOffset>
        <feMerge>
          <feMergeNode in="offsetRed"/>
          <feMergeNode in="offsetCyan"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="hexGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    {/* Outer hexagon */}
    <polygon points="100,10 178,55 178,145 100,190 22,145 22,55"
             fill="none" stroke="#00ffcc" strokeWidth="2" opacity="0.3">
      <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="60s" repeatCount="indefinite"/>
    </polygon>
    
    {/* Inner rotating hexagon */}
    <polygon points="100,25 165,62 165,138 100,175 35,138 35,62"
             fill="none" stroke="#ff6600" strokeWidth="1" opacity="0.5">
      <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="30s" repeatCount="indefinite"/>
    </polygon>
    
    {/* Orbital rings */}
    <ellipse cx="100" cy="100" rx="80" ry="25" fill="none" stroke="#00ffcc" strokeWidth="1" opacity="0.3" strokeDasharray="10 5">
      <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="15s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="100" cy="100" rx="80" ry="25" fill="none" stroke="#00ffcc" strokeWidth="1" opacity="0.3" strokeDasharray="10 5" transform="rotate(60 100 100)">
      <animateTransform attributeName="transform" type="rotate" from="60 100 100" to="420 100 100" dur="18s" repeatCount="indefinite"/>
    </ellipse>
    
    {/* Core box */}
    <rect x="45" y="75" width="110" height="50" fill="#000000" stroke="#00ffcc" strokeWidth="2"/>
    <rect x="47" y="77" width="106" height="46" fill="#000000" stroke="#ff6600" strokeWidth="1" opacity="0.5"/>
    
    {/* Main text with glow */}
    <text x="100" y="108" fontFamily="'Courier New', monospace" fontSize="24" 
          fontWeight="bold" fill="#00ffcc" textAnchor="middle" filter="url(#hexGlow)">
      {label}
    </text>
    
    {/* Glitch overlay */}
    <text x="100" y="108" fontFamily="'Courier New', monospace" fontSize="24" 
          fontWeight="bold" fill="#ff6600" textAnchor="middle" opacity="0" filter="url(#chromatic)">
      {label}
      <animate attributeName="opacity" values="0;0;0;0.8;0;0;0" dur="4s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="translate" values="-2,0;2,0;-1,1;1,-1;0,0" dur="0.15s" repeatCount="indefinite"/>
    </text>
    
    {/* Orbiting particles */}
    <circle r="3" fill="#00ffcc">
      <animateMotion path="M 100,20 Q 180,20 180,100 Q 180,180 100,180 Q 20,180 20,100 Q 20,20 100,20" 
                     dur="3s" repeatCount="indefinite"/>
    </circle>
    <circle r="3" fill="#ff6600">
      <animateMotion path="M 100,180 Q 20,180 20,100 Q 20,20 100,20 Q 180,20 180,100 Q 180,180 100,180" 
                     dur="3.5s" repeatCount="indefinite"/>
    </circle>
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// MINI CARD COMPONENTS - MOBILE FIRST
// ═══════════════════════════════════════════════════════════════

// Facilitator Card
const FacilitatorCard = ({ facilitator, index }: { facilitator: typeof X402_FACILITATORS[0]; index: number }) => {
  const statusColor = facilitator.status === 'active' ? '#00ff00' : '#ff6600';
  
  return (
    <div 
      className="bg-black/80 border border-cyan-400/50 rounded-lg p-3 md:p-4 backdrop-blur-sm
                 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-400/20 transition-all duration-300
                 animate-fadeIn"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs md:text-sm text-cyan-400 font-bold">{facilitator.name}</span>
        <div className="flex items-center gap-2">
          {facilitator.erc8004 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 border border-orange-500/50 rounded text-orange-400 font-mono">
              ERC-8004
            </span>
          )}
          <span 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: statusColor }}
          />
        </div>
      </div>
      
      <div className="font-mono text-[10px] md:text-xs text-cyan-400/70 break-all mb-2">
        {facilitator.address.length > 30 
          ? `${facilitator.address.slice(0, 20)}...${facilitator.address.slice(-8)}`
          : facilitator.address
        }
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-[10px] px-1.5 py-0.5 bg-cyan-400/10 border border-cyan-400/30 rounded text-cyan-400 font-mono">
          {facilitator.role}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/50 rounded text-blue-400 font-mono">
          {facilitator.chain}
        </span>
      </div>
    </div>
  );
};

// Architecture Layer Card
const LayerCard = ({ layer, isActive, onClick }: { 
  layer: typeof ARCHITECTURE_LAYERS[0]; 
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left bg-black/80 border rounded-lg p-3 md:p-4 backdrop-blur-sm
                transition-all duration-300 ${isActive ? 'border-2 shadow-lg' : 'border-white/10 hover:border-white/30'}`}
    style={{ 
      borderColor: isActive ? layer.color : undefined,
      boxShadow: isActive ? `0 0 20px ${layer.color}40` : undefined
    }}
  >
    <div className="flex items-center gap-2 mb-2">
      <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: layer.color }} />
      <span className="font-mono text-xs md:text-sm font-bold" style={{ color: layer.color }}>
        {layer.name}
      </span>
    </div>
    
    <div className="flex flex-wrap gap-1">
      {layer.components.map((comp) => (
        <span 
          key={comp}
          className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-mono"
          style={{ 
            backgroundColor: `${layer.color}15`,
            border: `1px solid ${layer.color}30`,
            color: layer.color
          }}
        >
          {comp}
        </span>
      ))}
    </div>
  </button>
);

// ═══════════════════════════════════════════════════════════════
// MAIN ARCHITECTURE PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ArchitecturePage() {
  const [bootProgress, setBootProgress] = useState(0);
  const [bootMessage, setBootMessage] = useState(BOOT_SEQUENCE[0]);
  const [isBooted, setIsBooted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'facilitators' | 'layers' | '3d'>('overview');
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Boot sequence animation
  useEffect(() => {
    if (isBooted) return;
    
    const bootInterval = setInterval(() => {
      setBootProgress((prev) => {
        const next = prev + 2;
        const msgIndex = Math.min(Math.floor(next / 12.5), BOOT_SEQUENCE.length - 1);
        setBootMessage(BOOT_SEQUENCE[msgIndex]);
        
        if (next >= 100) {
          clearInterval(bootInterval);
          setTimeout(() => setIsBooted(true), 500);
          return 100;
        }
        return next;
      });
    }, 60);

    return () => clearInterval(bootInterval);
  }, [isBooted]);

  // Continuous scan animation
  useEffect(() => {
    if (!isBooted) return;
    
    const scanInterval = setInterval(() => {
      setScanProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 50);

    return () => clearInterval(scanInterval);
  }, [isBooted]);

  // Boot Screen
  if (!isBooted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Circuit board background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="circuit" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 10 10 L 90 10 M 10 10 L 10 50 M 90 10 L 90 30 M 10 50 L 30 50 M 30 50 L 30 90 M 90 30 L 60 30 L 60 90" 
                      stroke="#00ffcc" strokeWidth="0.5" fill="none"/>
                <circle cx="10" cy="10" r="2" fill="#00ffcc"/>
                <circle cx="90" cy="10" r="2" fill="#00ffcc"/>
                <circle cx="30" cy="50" r="2" fill="#ff6600"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)"/>
          </svg>
        </div>

        {/* Scan lines overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-full h-0.5 bg-cyan-400/5 animate-scanline" />
        </div>

        {/* Boot content */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-cyan-400 font-mono text-xs md:text-sm mb-4 text-center">
            SYSTEM BOOT SEQUENCE: x402VOT PROTOCOL
          </div>
          
          <LoadingGauge progress={bootProgress} label="LOADING" />
          
          <div className="mt-4 w-64 md:w-80 h-6 bg-black border border-cyan-400/50 rounded overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-100"
              style={{ width: `${bootProgress}%` }}
            />
          </div>
          
          <div className="mt-4 font-mono text-xs md:text-sm text-cyan-400 text-center animate-pulse">
            {bootMessage}
          </div>

          {/* Data rain effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className="absolute text-cyan-400 font-mono text-xs animate-dataRain"
                style={{ 
                  left: `${10 + i * 10}%`, 
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${8 + i}s`
                }}
              >
                {i % 2 === 0 ? 'x402' : 'VOT'}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main Architecture Interface
  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background patterns */}
      <div className="fixed inset-0 pointer-events-none">
        <svg width="100%" height="100%" className="opacity-5">
          <defs>
            <pattern id="gridPattern" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00ffcc" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridPattern)"/>
        </svg>
      </div>

      {/* Top Status Bar */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-cyan-400/30">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-[10px] md:text-xs text-cyan-400">LIVE ON BASE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] md:text-xs text-orange-400">x402 VOT v2.1</span>
            <Link href="/" className="px-3 py-1.5 bg-black/80 border border-[#00FFFF]/60 rounded font-mono text-[10px] md:text-xs uppercase tracking-wider hover:bg-[#00FFFF]/10 hover:border-[#00FFFF] transition-all text-[#00FFFF]">
              ✕ CLOSE
            </Link>
          </div>
        </div>
      </div>

      {/* Header with animated core */}
      <div className="flex flex-col items-center py-4 md:py-6 px-4">
        <div className="flex items-center gap-4 md:gap-8">
          <RadarScanner />
          <HexCore label="x402VOT" />
          <div className="hidden md:block">
            <LoadingGauge progress={scanProgress} label="SCANNING" />
          </div>
        </div>
        
        <h1 className="mt-4 font-mono text-lg md:text-2xl font-bold text-center">
          <span className="text-white">MCPVOT</span>
          <span className="text-cyan-400">.ETH</span>
        </h1>
        
        <p className="mt-2 font-mono text-[10px] md:text-xs text-cyan-400/70 text-center max-w-md">
          x402 • MCP • IPFS • VOT • MAXX Architecture
        </p>
      </div>

      {/* Navigation Tabs - Mobile Optimized */}
      <div className="sticky top-10 z-40 bg-black/80 backdrop-blur-sm px-2 py-2 border-y border-cyan-400/20">
        <div className="flex gap-1 md:gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(['overview', 'facilitators', 'layers', '3d'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded font-mono text-[10px] md:text-xs whitespace-nowrap
                         transition-all duration-300 border ${
                activeTab === tab
                  ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400 shadow-lg shadow-cyan-400/20'
                  : 'bg-black/50 border-white/10 text-white/70 hover:border-cyan-400/50'
              }`}
            >
              {tab === '3d' ? '3D VIEW' : tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="px-3 py-4 md:px-6 md:py-6 pb-24">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Contract Info Box */}
            <div className="bg-black/80 border-2 border-orange-500/50 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-center">
                <div className="font-mono text-xs text-orange-400 mb-2">
                  OFFICIAL CONTRACT ADDRESS [BASE]
                </div>
                <div className="font-mono text-xs md:text-sm text-white break-all">
                  0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07
                </div>
                <div className="mt-2 flex justify-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 bg-green-500/20 border border-green-500/50 rounded text-green-400 font-mono animate-pulse">
                    █ BASE NETWORK ACTIVE █
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'BACKEND.ID', value: 'active', color: '#00ffcc' },
                { label: 'VOT.LD', value: 'synced', color: '#00ffcc' },
                { label: 'IPFS.INIT', value: 'ready', color: '#00ff00' },
                { label: 'P2P.NODES', value: '837', color: '#ff6600' },
              ].map((stat) => (
                <div key={stat.label} className="bg-black/60 border border-cyan-400/30 rounded-lg p-2 md:p-3">
                  <div className="font-mono text-[9px] md:text-[10px] text-cyan-400/60">{stat.label}</div>
                  <div className="font-mono text-xs md:text-sm font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Mission Telemetry */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'MISSION.ID', value: 'E2CA9807' },
                { label: 'STATUS', value: 'ACTIVE' },
                { label: 'GAS', value: 'OPTIMAL' },
                { label: 'TPS', value: '5000+' },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center bg-black/40 border border-cyan-400/20 rounded px-3 py-2">
                  <span className="font-mono text-[10px] text-cyan-400/60">{stat.label}</span>
                  <span className="font-mono text-[10px] text-cyan-400">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facilitators Tab */}
        {activeTab === 'facilitators' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-mono text-sm md:text-base text-cyan-400 font-bold">
                x402 VOT/MAXX FACILITATORS
              </h2>
              <span className="text-[10px] px-2 py-0.5 bg-cyan-400/10 border border-cyan-400/30 rounded text-cyan-400 font-mono">
                ERC-8004 REGISTRY
              </span>
            </div>
            
            <div className="grid gap-3 md:grid-cols-2">
              {X402_FACILITATORS.map((facilitator, index) => (
                <FacilitatorCard key={facilitator.id} facilitator={facilitator} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Layers Tab */}
        {activeTab === 'layers' && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="font-mono text-sm md:text-base text-cyan-400 font-bold mb-4">
              ARCHITECTURE LAYERS
            </h2>
            
            <div className="grid gap-3">
              {ARCHITECTURE_LAYERS.map((layer) => (
                <LayerCard 
                  key={layer.id} 
                  layer={layer} 
                  isActive={activeLayer === layer.id}
                  onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
                />
              ))}
            </div>

            {/* Layer Diagram */}
            <div className="mt-6 bg-black/60 border border-cyan-400/30 rounded-lg p-4">
              <div className="font-mono text-[10px] text-cyan-400/60 mb-3">LAYER FLOW DIAGRAM</div>
              <div className="flex flex-col items-center gap-2">
                {ARCHITECTURE_LAYERS.map((layer, index) => (
                  <div key={layer.id} className="w-full flex flex-col items-center">
                    <div 
                      className="w-full py-2 px-4 text-center font-mono text-[10px] md:text-xs rounded border"
                      style={{ 
                        borderColor: layer.color,
                        backgroundColor: `${layer.color}10`,
                        color: layer.color
                      }}
                    >
                      {layer.name}
                    </div>
                    {index < ARCHITECTURE_LAYERS.length - 1 && (
                      <div className="h-4 w-0.5 bg-gradient-to-b from-cyan-400 to-transparent" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3D View Tab */}
        {activeTab === '3d' && (
          <div className="animate-fadeIn">
            <h2 className="font-mono text-sm md:text-base text-cyan-400 font-bold mb-4">
              3D ARCHITECTURE VISUALIZATION
            </h2>
            
            <div className="relative w-full aspect-square md:aspect-video bg-black border border-cyan-400/30 rounded-lg overflow-hidden">
              <ThreeScene />
              
              {/* 3D Controls overlay */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                <span className="text-[10px] px-2 py-1 bg-black/80 border border-cyan-400/30 rounded text-cyan-400 font-mono">
                  DRAG TO ROTATE
                </span>
                <span className="text-[10px] px-2 py-1 bg-black/80 border border-cyan-400/30 rounded text-cyan-400 font-mono">
                  PINCH TO ZOOM
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar - Fixed Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-cyan-400/30 px-4 py-3 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-[10px] text-cyan-400">MISSION TELEMETRY</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-400/70">
            Spinning up VOT micropayment thrusters...
          </span>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes dataRain {
          0% { transform: translateY(-20px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-scanline {
          animation: scanline 6s linear infinite;
        }
        
        .animate-dataRain {
          animation: dataRain 10s linear infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
