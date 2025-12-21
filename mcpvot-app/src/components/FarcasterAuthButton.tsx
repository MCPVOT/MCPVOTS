'use client';

import { SignInButton, useProfile } from '@farcaster/auth-kit';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function FarcasterAuthButton() {
  const profile = useProfile();
  const isAuthenticated = profile?.isAuthenticated ?? false;
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Enhanced cyberpunk terminal styling with GPU acceleration
    const button = buttonRef.current?.querySelector('button');
    if (button) {
      const styles = {
        'width': '100%',
        'max-width': '20rem',
        'background': 'linear-gradient(to right, rgba(251, 146, 60, 0.2), rgba(234, 88, 12, 0.2))',
        'backdrop-filter': 'blur(8px)',
        'border': '1px solid rgba(251, 146, 60, 0.5)',
        'border-radius': '0.75rem',
        'padding': '0.75rem 1.5rem',
        'color': 'rgb(254, 215, 170)',
        'transition': 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
        'box-shadow': '0 0 20px rgba(251, 146, 60, 0.3)',
        'font-family': 'Orbitron, monospace',
        'font-size': '0.875rem',
        'letter-spacing': '0.1em',
        'text-transform': 'uppercase',
        'font-weight': '600',
        'cursor': 'pointer',
        'display': 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        'gap': '0.5rem',
        'will-change': 'transform',
        'transform': 'translateZ(0)',
        'backface-visibility': 'hidden'
      };

      Object.entries(styles).forEach(([property, value]) => {
        button.style.setProperty(property, value, 'important');
      });

      const handleMouseEnter = () => {
        Object.entries({
          'color': 'rgb(255, 237, 213)',
          'border-color': 'rgba(253, 186, 116, 0.8)',
          'box-shadow': '0 0 30px rgba(251, 146, 60, 0.5)',
          'transform': 'scale(1.02)',
          'background': 'linear-gradient(to right, rgba(251, 146, 60, 0.3), rgba(234, 88, 12, 0.3))'
        }).forEach(([property, value]) => {
          button.style.setProperty(property, value, 'important');
        });
      };

      const handleMouseLeave = () => {
        Object.entries({
          'color': 'rgb(254, 215, 170)',
          'border-color': 'rgba(251, 146, 60, 0.5)',
          'box-shadow': '0 0 20px rgba(251, 146, 60, 0.3)',
          'transform': 'scale(1)',
          'background': 'linear-gradient(to right, rgba(251, 146, 60, 0.2), rgba(234, 88, 12, 0.2))'
        }).forEach(([property, value]) => {
          button.style.setProperty(property, value, 'important');
        });
      };

      button.addEventListener('mouseenter', handleMouseEnter);
      button.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        button.removeEventListener('mouseenter', handleMouseEnter);
        button.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [isAuthenticated]);

  const farcasterProfile = profile?.profile as { displayName?: string; username?: string; fid?: number } | undefined;
  const displayName = farcasterProfile?.displayName || farcasterProfile?.username || 'Farcaster User';

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-xs mx-auto">
      <div ref={buttonRef} className="relative w-full">
        <SignInButton />
      </div>

      {isAuthenticated && farcasterProfile && (
        <div className="relative w-full">
          <button
            onClick={() => setShowProfileDetails(!showProfileDetails)}
            className="w-full flex items-center justify-between px-3 py-2 bg-orange-600/20 border border-orange-500/30 text-orange-300 rounded-lg hover:bg-orange-600/30 transition-all duration-200 gpu-accelerate"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.1em]">
                Farcaster Connected: @{farcasterProfile.username || 'user'}
              </span>
            </div>
            <ExternalLink size={12} />
          </button>

          {showProfileDetails && (
            <div className="absolute top-full left-0 z-50 mt-2 p-4 bg-black/95 border border-orange-500/30 rounded-lg shadow-xl backdrop-blur-sm w-full">
              <div className="text-sm text-orange-300 mb-2">{displayName}</div>
              {farcasterProfile.fid && (
                <div className="text-xs text-slate-400">FID: {farcasterProfile.fid}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
