'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
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

  // Close spotlight on any key press or click outside
  useEffect(() => {
    if (!visible) return;

    const handleClose = () => {
      // Delay to allow the target to receive the event first
      setTimeout(() => onClose?.(), 0);
    };

    document.addEventListener('keydown', handleClose);
    document.addEventListener('pointerdown', handleClose, true);

    return () => {
      document.removeEventListener('keydown', handleClose);
      document.removeEventListener('pointerdown', handleClose, true);
    };
  }, [visible, onClose]);

  // Don't render during SSR
  if (typeof document === 'undefined') return null;

  const overlayStyle =
    'fixed bg-black/70 backdrop-blur-sm pointer-events-auto border-0 p-0 outline-none';

  const handleCloseClick = () => onClose?.();

  return createPortal(
    <AnimatePresence>
      {visible && box && (
        <motion.div
          key="spotlight-overlay"
          className="fixed inset-0 z-[9990] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Dimmed overlay areas - clicking any of these closes the spotlight */}

          {/* Top curtain */}
          <button
            type="button"
            onClick={handleCloseClick}
            className={overlayStyle}
            style={{ left: 0, right: 0, top: 0, height: box.y }}
            aria-label="Close spotlight"
          />

          {/* Left curtain */}
          <button
            type="button"
            onClick={handleCloseClick}
            className={overlayStyle}
            style={{ left: 0, top: box.y, width: box.x, height: box.h }}
            aria-label="Close spotlight"
          />

          {/* Right curtain */}
          <button
            type="button"
            onClick={handleCloseClick}
            className={overlayStyle}
            style={{ left: box.x + box.w, right: 0, top: box.y, height: box.h }}
            aria-label="Close spotlight"
          />

          {/* Bottom curtain */}
          <button
            type="button"
            onClick={handleCloseClick}
            className={overlayStyle}
            style={{ left: 0, right: 0, top: box.y + box.h, bottom: 0 }}
            aria-label="Close spotlight"
          />

          {/* Decorative border around highlighted element */}
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
