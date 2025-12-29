'use client';

import RetroStatsTicker from '@/components/RetroStatsTicker';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/docs', label: 'Overview', icon: '📚' },
  { href: '/docs/quickstart', label: 'Quickstart', icon: '🚀' },
  { href: '/docs/sdk', label: 'SDK Reference', icon: '⚡' },
  { href: '/docs/cli', label: 'CLI', icon: '💻' },
  { href: '/docs/x402', label: 'x402 Facilitator', icon: '🔐' },
  { href: '/docs/architecture', label: 'Architecture', icon: '🏗️' },
  { href: '/docs/roadmap', label: 'Roadmap', icon: '🗺️' },
  { href: '/docs/faq', label: 'FAQ', icon: '❓' },
  { href: '/docs/changelog', label: 'Changelog', icon: '📝' },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-cyan-500/30 safe-top">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile menu toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 active:scale-95 transition-all"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            {/* Back to Dashboard button */}
            <Link 
              href="/" 
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/40 rounded-md text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 hover:scale-105 active:scale-95 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            >
              <svg 
                className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Dashboard</span>
            </Link>
            <span className="text-gray-600 hidden sm:inline">/</span>
            <span className="text-lg sm:text-xl font-bold text-cyan-400">Docs</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <a 
              href="https://github.com/MCPVOT" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 text-xs sm:text-sm"
            >
              GitHub
            </a>
            <a 
              href="https://warpcast.com/mcpvot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 text-xs sm:text-sm hidden sm:inline"
            >
              Farcaster
            </a>
          </div>
        </div>
      </header>

      {/* RETRO STATS TICKER - Below header */}
      <div className="fixed top-14 left-0 right-0 z-40">
        <RetroStatsTicker />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex pt-[82px]">
        {/* Sidebar - Hidden on mobile, shown on lg+ */}
        <aside 
          className={`
            fixed top-[82px] bottom-0 w-64 bg-black/95 lg:bg-black/50 border-r border-cyan-500/20 overflow-y-auto z-40 transition-transform duration-300 ease-out
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          role="navigation"
          aria-label="Documentation navigation"
        >
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/docs' && pathname?.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 lg:py-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Links */}
          <div className="p-4 border-t border-cyan-500/20 mt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Quick Links</p>
            <div className="space-y-2 text-sm">
              <a href="https://basescan.org/token/0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07" 
                target="_blank" rel="noopener noreferrer"
                className="block text-gray-400 hover:text-cyan-400 hover:translate-x-1 transition-all duration-200 py-1">
                VOT on BaseScan →
              </a>
              <a href="https://dexscreener.com/base/0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07" 
                target="_blank" rel="noopener noreferrer"
                className="block text-gray-400 hover:text-cyan-400 hover:translate-x-1 transition-all duration-200 py-1">
                DexScreener →
              </a>
              <a href="https://farcaster.xyz/miniapps/FAiT-TnY9rUm/x402vot" 
                target="_blank" rel="noopener noreferrer"
                className="block text-gray-400 hover:text-cyan-400 hover:translate-x-1 transition-all duration-200 py-1">
                Farcaster Mini-App →
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content - Full width on mobile, offset on lg+ */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen safe-bottom">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
