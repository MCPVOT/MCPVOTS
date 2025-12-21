'use client';

/**
 * Farcaster Social Components for VOT Machine
 * 
 * - ShareOnFarcasterButton: User-initiated sharing with FIP-2
 * - SocialFeedWidget: Read-only display of NFT discussions
 */

import {
    fetchTokenSocialFeed,
    formatCastTime,
    shareOnFarcaster,
    type FarcasterCast,
    type ShareOptions
} from '@/lib/farcaster-service';
import { useCallback, useEffect, useState } from 'react';

// =============================================================================
// SHARE BUTTON COMPONENT
// =============================================================================

interface ShareButtonProps {
  tokenId: number;
  holderName?: string;
  votReceived?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ShareOnFarcasterButton({
  tokenId,
  holderName,
  votReceived,
  className = '',
  size = 'md',
}: ShareButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleShare = useCallback(() => {
    const options: ShareOptions = {
      tokenId,
      holderName,
      votReceived,
    };
    shareOnFarcaster(options);
  }, [tokenId, holderName, votReceived]);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={handleShare}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        inline-flex items-center gap-2
        ${sizeClasses[size]}
        font-medium
        bg-[#8A63D2] hover:bg-[#7B54C3]
        text-white
        rounded-lg
        transition-all duration-200
        hover:shadow-lg hover:shadow-purple-500/30
        ${isHovered ? 'scale-105' : 'scale-100'}
        ${className}
      `}
    >
      <FarcasterIcon className="w-5 h-5" />
      <span>Share on Farcaster</span>
    </button>
  );
}

// =============================================================================
// SOCIAL FEED WIDGET
// =============================================================================

interface SocialFeedProps {
  tokenId: number;
  limit?: number;
  className?: string;
  showHeader?: boolean;
}

export function SocialFeedWidget({
  tokenId,
  limit = 10,
  className = '',
  showHeader = true,
}: SocialFeedProps) {
  const [casts, setCasts] = useState<FarcasterCast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      setError(null);
      
      const response = await fetchTokenSocialFeed(tokenId, { limit });
      
      if (response.error) {
        setError(response.error);
      } else {
        setCasts(response.casts);
      }
      
      setLoading(false);
    }

    loadFeed();
  }, [tokenId, limit]);

  if (loading) {
    return (
      <div className={`bg-black/50 border border-purple-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-black/50 border border-red-500/30 rounded-lg p-4 ${className}`}>
        <p className="text-red-400 text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-black/50 border border-purple-500/30 rounded-lg overflow-hidden ${className}`}>
      {showHeader && (
        <div className="px-4 py-3 border-b border-purple-500/20 flex items-center gap-2">
          <FarcasterIcon className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-purple-300">Community Discussion</span>
          <span className="text-xs text-gray-500 ml-auto">{casts.length} casts</span>
        </div>
      )}

      <div className="divide-y divide-purple-500/10">
        {casts.length === 0 ? (
          <EmptyFeedState tokenId={tokenId} />
        ) : (
          casts.map((cast) => (
            <CastItem key={cast.hash} cast={cast} />
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function CastItem({ cast }: { cast: FarcasterCast }) {
  return (
    <div className="p-4 hover:bg-purple-500/5 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {cast.author.pfpUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={cast.author.pfpUrl}
              alt={cast.author.displayName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-purple-400 text-sm">
                {cast.author.displayName?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">
              {cast.author.displayName}
            </span>
            <span className="text-gray-500 text-sm">
              @{cast.author.username}
            </span>
            <span className="text-gray-600 text-sm">
              · {formatCastTime(cast.timestamp)}
            </span>
          </div>

          <p className="mt-1 text-gray-300 whitespace-pre-wrap break-words">
            {cast.text}
          </p>

          {/* Reactions */}
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <HeartIcon className="w-4 h-4" />
              {cast.reactions.likes}
            </span>
            <span className="flex items-center gap-1">
              <RecastIcon className="w-4 h-4" />
              {cast.reactions.recasts}
            </span>
            <span className="flex items-center gap-1">
              <ReplyIcon className="w-4 h-4" />
              {cast.replies.count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyFeedState({ tokenId }: { tokenId: number }) {
  return (
    <div className="p-8 text-center">
      <FarcasterIcon className="w-12 h-12 text-purple-500/30 mx-auto mb-4" />
      <p className="text-gray-400 mb-4">
        No discussions yet for VOT #{tokenId}
      </p>
      <p className="text-sm text-gray-500">
        Be the first to share your thoughts!
      </p>
    </div>
  );
}

// =============================================================================
// ICONS
// =============================================================================

function FarcasterIcon({ className = '' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M18.24 4.8H5.76v14.4h12.48V4.8zm-6.24 9.6c-1.99 0-3.6-1.61-3.6-3.6s1.61-3.6 3.6-3.6 3.6 1.61 3.6 3.6-1.61 3.6-3.6 3.6z"/>
    </svg>
  );
}

function HeartIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function RecastIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function ReplyIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

// Named exports are already defined above
// ShareOnFarcasterButton and SocialFeedWidget are exported individually
