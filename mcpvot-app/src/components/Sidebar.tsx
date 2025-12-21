
'use client';

import { useState } from 'react';

const navLinks = [
  { id: 'overview', label: 'Overview' },
  { id: 'x402', label: 'x402 Flow' },
  { id: 'rarity', label: 'Rarity' },
  { id: 'mint', label: 'Minting' },
  { id: 'intel', label: 'Intelligence' },
  { id: 'missions', label: 'Missions' },
  { id: 'community', label: 'Community' },
] as const;

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav aria-label="Dashboard sections" className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-300">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={toggleMenu}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-cyan-500/30 bg-black/70 px-4 py-3 text-xs font-semibold transition hover:border-cyan-400/50 hover:text-cyan-100"
          aria-expanded={isOpen}
          aria-controls="dashboard-nav-mobile"
        >
          <span>Sections</span>
          <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>⌄</span>
        </button>

        <div
          id="dashboard-nav-mobile"
          className={`mt-3 grid gap-2 overflow-hidden rounded-2xl border border-cyan-500/20 bg-black/80 px-2 py-3 transition-all duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
        >
          <div className={`flex flex-col gap-2 ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={closeMenu}
                className="rounded-lg border border-cyan-500/10 bg-black/60 px-4 py-2 text-[0.65rem] transition hover:border-cyan-300/40 hover:text-cyan-100"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col gap-3">
        {navLinks.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="rounded-xl border border-cyan-500/20 bg-black/60 px-4 py-2 transition hover:border-cyan-300/40 hover:text-cyan-100"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
};

export default Sidebar;
