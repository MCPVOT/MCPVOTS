
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Detect touch device to disable custom cursor on mobile
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Check if mobile - computed once on mount (SSR-safe)
// Only consider mobile if BOTH touch AND small screen - some laptops have touch
const checkIsMobile = () => {
  if (typeof window === 'undefined') return true; // Assume mobile on SSR
  const hasTouch = isTouchDevice();
  const isSmallScreen = window.innerWidth < 768;
  // Only disable on actual mobile devices (touch + small screen)
  // Large touchscreen laptops should still get custom cursor
  return hasTouch && isSmallScreen;
};

const AnimatedCursor = () => {
  // Initialize mobile check synchronously to avoid flash
  const [isMobile] = useState(checkIsMobile);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(true);
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);
  
  // Use refs for performance - avoid re-renders on every mouse move
  const positionRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const trailIdRef = useRef(0);

  // Throttled position update using RAF for smooth 60fps
  const updatePosition = useCallback(() => {
    setPosition({ ...positionRef.current });
    rafRef.current = null;
  }, []);

  useEffect(() => {
    // Don't run on mobile/touch devices
    if (isMobile) {
      return;
    }

    // Hide default cursor on desktop only
    document.body.style.cursor = 'none';
    const style = document.createElement('style');
    style.innerHTML = '* { cursor: none !important; }';
    document.head.appendChild(style);

    const handleMouseMove = (e: MouseEvent) => {
      positionRef.current = { x: e.clientX, y: e.clientY };
      
      // Use RAF for smooth updates - prevents layout thrashing
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updatePosition);
      }

      // Reduced trail particles (4 instead of 8) for better performance
      setTrail(prev => {
        const newTrail = [...prev, { x: e.clientX, y: e.clientY, id: trailIdRef.current++ }];
        return newTrail.slice(-4);
      });

      // Throttle cursor style check
      const target = e.target as HTMLElement;
      const computedCursor = window.getComputedStyle(target).getPropertyValue('cursor');
      setIsPointer(computedCursor === 'pointer' || computedCursor.includes('pointer'));
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseEnter = () => setVisible(true);
    const handleMouseLeave = () => setVisible(false);

    // Passive event listeners for better scroll performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.body.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    document.body.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.style.cursor = '';
      style.remove();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updatePosition, isMobile]);

  // Don't render on mobile/touch devices
  if (isMobile) return null;
  if (!visible) return null;

  return (
    <>
      {/* Holographic trail particles - GPU accelerated */}
      {trail.map((point, index) => (
        <div
          key={point.id}
          className="fixed pointer-events-none w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 blur-[2px]"
          style={{
            left: point.x,
            top: point.y,
            opacity: (index + 1) / trail.length * 0.5,
            transform: `translate(-50%, -50%) scale(${(index + 1) / trail.length * 0.5})`,
            zIndex: 999998,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* Main cursor - GPU accelerated with will-change */}
      <div
        className="fixed pointer-events-none"
        style={{
          left: position.x,
          top: position.y,
          transform: `translate(-50%, -50%) scale(${isClicking ? 0.8 : isPointer ? 1.4 : 1})`,
          zIndex: 999999,
          willChange: 'transform',
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* Outer holographic ring */}
        <div
          className={`absolute inset-0 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${isPointer
            ? 'border-2 border-cyan-400 bg-cyan-400/10 shadow-[0_0_25px_rgba(6,182,212,0.9),inset_0_0_15px_rgba(6,182,212,0.5)] animate-spin'
            : 'border border-cyan-300/60 bg-cyan-300/5 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
            }`}
          style={{
            animationDuration: isPointer ? '3s' : '6s',
          }}
        />

        {/* Geometric inner core (Sumerian-inspired) */}
        <div className="absolute inset-0 w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" className={`transition-all duration-200 ${isPointer ? 'drop-shadow-[0_0_8px_rgba(74,222,128,1)]' : 'drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]'}`}>
            {/* Central diamond */}
            <path
              d="M 12,4 L 16,12 L 12,20 L 8,12 Z"
              fill="url(#cursorGrad)"
              opacity={isPointer ? "0.9" : "0.7"}
            />
            {/* Circuit nodes */}
            <circle cx="12" cy="4" r="1.5" fill="#4ADE80" opacity={isPointer ? "1" : "0.8"} />
            <circle cx="16" cy="12" r="1.5" fill="#06B6D4" opacity={isPointer ? "1" : "0.8"} />
            <circle cx="12" cy="20" r="1.5" fill="#3B82F6" opacity={isPointer ? "1" : "0.8"} />
            <circle cx="8" cy="12" r="1.5" fill="#8B5CF6" opacity={isPointer ? "1" : "0.8"} />
            {/* Center core */}
            <circle cx="12" cy="12" r="2" fill="#4ADE80" opacity="0.95">
              {isPointer && (
                <animate attributeName="r" values="2;3;2" dur="1s" repeatCount="indefinite" />
              )}
            </circle>
            {/* Gradient definition */}
            <defs>
              <linearGradient id="cursorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Pulsing energy ring (on hover) */}
        {isPointer && (
          <div className="absolute inset-0 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-green-400/40 animate-ping" />
        )}

        {/* Click ripple effect */}
        {isClicking && (
          <div className="absolute inset-0 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400 animate-ping opacity-75" />
        )}
      </div>
    </>
  );
};

export default AnimatedCursor;
