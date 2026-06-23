'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

interface SpotlightBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SpotlightProps {
  target?: HTMLElement | null;
  visible: boolean;
  onClose?: () => void;
  padding?: number;
  radius?: number;
}

export function Spotlight({
  target,
  visible,
  onClose,
  padding = 8,
  radius = 12,
}: SpotlightProps) {
  const [box, setBox] = useState<SpotlightBox | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastBoxRef = useRef<SpotlightBox | null>(null);

  // Track viewport for the outer path
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  useLayoutEffect(() => {
    const updateViewport = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Update spotlight position when target element changes or moves
  useLayoutEffect(() => {
    const updateSpotlightPosition = () => {
      if (!target) {
        setBox(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      setBox({
        x: Math.max(0, rect.left - padding),
        y: Math.max(0, rect.top - padding),
        w: rect.width + padding * 2,
        h: rect.height + padding * 2,
      });
    };

    updateSpotlightPosition();

    // Set up observers for position changes
    const resizeObserver = target
      ? new ResizeObserver(updateSpotlightPosition)
      : null;
    resizeObserver?.observe(target as Element);

    window.addEventListener('scroll', updateSpotlightPosition, {
      passive: true,
    });
    window.addEventListener('resize', updateSpotlightPosition);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', updateSpotlightPosition);
      window.removeEventListener('resize', updateSpotlightPosition);
    };
  }, [target, padding]);

  // Continuously track position while visible to catch layout translations (e.g., sidebar animations)
  useEffect(() => {
    if (!visible || !target) return;

    const tick = () => {
      const rect = target.getBoundingClientRect();
      const nextBox: SpotlightBox = {
        x: Math.max(0, rect.left - padding),
        y: Math.max(0, rect.top - padding),
        w: rect.width + padding * 2,
        h: rect.height + padding * 2,
      };

      const prev = lastBoxRef.current;
      // Update only when there is a meaningful change to avoid needless re-renders
      if (
        !prev ||
        Math.abs(prev.x - nextBox.x) > 0.5 ||
        Math.abs(prev.y - nextBox.y) > 0.5 ||
        Math.abs(prev.w - nextBox.w) > 0.5 ||
        Math.abs(prev.h - nextBox.h) > 0.5
      ) {
        lastBoxRef.current = nextBox;
        setBox(nextBox);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [visible, target, padding]);

  // Close spotlight on any key press or any click
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = () => {
      setTimeout(() => onClose?.(), 0);
    };

    const onAnyPointer = () => setTimeout(() => onClose?.(), 0);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', onAnyPointer, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', onAnyPointer, true);
    };
  }, [visible, onClose]);

  // Don't render during SSR
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {visible && box && vw && vh && (
        <motion.div
          key="spotlight-overlay"
          data-slot="spotlight-overlay"
          className="fixed inset-0 z-40 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden="true"
        >
          {/* 1) SVG mask def */}
          <svg
            width="0"
            height="0"
            style={{ position: 'absolute' }}
            role="presentation"
            aria-hidden="true"
          >
            <defs>
              <mask
                id="spot-mask"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={vw}
                height={vh}
              >
                <rect x="0" y="0" width={vw} height={vh} fill="white" />
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  rx={radius}
                  ry={radius}
                  fill="black"
                />
              </mask>
            </defs>
          </svg>

          {/* 2) Visual overlay ONLY (no hit-testing) */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              WebkitMask: 'url(#spot-mask)',
              mask: 'url(#spot-mask)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: 'rgba(0,0,0,0.7)',
              width: '100dvw',
              height: '100dvh',
              willChange: 'backdrop-filter, -webkit-backdrop-filter, mask',
              contain: 'paint',
            }}
          />

          {/* 4) Optional decorative ring (no events) */}
          <div
            className="fixed pointer-events-none"
            style={{
              left: box.x,
              top: box.y,
              width: box.w,
              height: box.h,
              borderRadius: radius,
              outline: '1px solid rgba(255,255,255,0.14)',
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.06) inset, 0 12px 48px rgba(0,0,0,0.35)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
