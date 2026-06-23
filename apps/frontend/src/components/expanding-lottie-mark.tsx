'use client';

import { LazyLottie } from '@/components/lazy-lottie';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { LottieRefCurrentProps } from 'lottie-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type ExpandingLottieMarkProps = {
  /** react-query cache key for the fetched animation JSON. */
  cacheId: string;
  /** Loads the Lottie JSON (fetched once, cached by `cacheId`). */
  getJson: () => Promise<Record<string, unknown>>;
  /** Intrinsic (expanded) Lottie dimensions, in px. */
  width: number;
  height: number;
  /**
   * Clip width (px) when collapsed — frames the compact mark that sits at the
   * left of the canvas. Measure it from the asset (the mark's content extent).
   */
  collapsedWidth: number;
  /** Show the full wordmark (true) or the collapsed mark (false). */
  expanded: boolean;
  /**
   * Start collapsed on first mount, then play to the expanded state. This is
   * useful for mobile sheets where the logo mounts only after the drawer opens.
   */
  animateInitialExpand?: boolean;
  /** Total morph duration in ms — match the asset's playback length. */
  durationMs: number;
  /**
   * CSS easing for the width grow (`expandEasing`) and shrink (`collapseEasing`),
   * matched to the asset's morph. Use `linear(...)` sampled from the Lottie's
   * own motion for a tight, jitter-free fit.
   */
  expandEasing: string;
  collapseEasing: string;
  className?: string;
};

/**
 * A Lottie that morphs between a compact mark (frame 0) and a full wordmark
 * (last frame), with its container width animating in lockstep so the footprint
 * genuinely grows/shrinks — not a fixed box that morphs in place.
 *
 * Mechanics:
 * - The mark sits at the canvas's left; the wrapper clips it via overflow with
 *   the Lottie pinned to its intrinsic size (`shrink-0`), so it's clipped
 *   left-aligned at natural size rather than scaled to "fit".
 * - The width transition is driven by `expanded` and uses the supplied easings,
 *   so it tracks the Lottie morph instead of a generic curve.
 * - The Lottie plays the morph on `expanded` changes and snaps to the correct
 *   end frame on load (`onDOMLoaded`) so it's never stuck on the wrong frame.
 * - RTL: the wrapper is mirrored so the reveal opens leftward (pinned to the
 *   inline-start edge) and the Lottie is mirrored back so it still reads right.
 */
export function ExpandingLottieMark({
  cacheId,
  getJson,
  width,
  height,
  collapsedWidth,
  expanded,
  animateInitialExpand = false,
  durationMs,
  expandEasing,
  collapseEasing,
  className,
}: ExpandingLottieMarkProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [displayExpanded, setDisplayExpanded] = useState(
    animateInitialExpand && expanded ? false : expanded,
  );
  const prevExpandedRef = useRef(displayExpanded);
  const [lottieReady, setLottieReady] = useState(false);

  // Animate only after the first paint. `expanded` can flip during hydration
  // (e.g. the sidebar's `useIsMobile()` resolves from false → true on mobile);
  // such settling changes should snap into place, not play the morph on load.
  // Only genuine post-mount changes (user toggles) animate.
  const [animationsReady, setAnimationsReady] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimationsReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!(animateInitialExpand && expanded)) {
      setDisplayExpanded(expanded);
      return;
    }

    if (displayExpanded) return;

    setDisplayExpanded(false);
    if (!animationsReady) return;

    if (lottieReady) {
      const raf = requestAnimationFrame(() => {
        setDisplayExpanded(true);
      });
      return () => cancelAnimationFrame(raf);
    }

    // Do not leave the layout collapsed forever if the animation JSON fails
    // or stays in the skeleton state; late Lottie loads still snap correctly.
    const fallbackExpand = window.setTimeout(
      () => setDisplayExpanded(true),
      Math.max(durationMs, 500),
    );
    return () => window.clearTimeout(fallbackExpand);
  }, [
    animateInitialExpand,
    expanded,
    displayExpanded,
    animationsReady,
    lottieReady,
    durationMs,
  ]);

  // Jump to the correct end frame with no animation (initial load + settling).
  const snapToFrame = useCallback(() => {
    const lottie = lottieRef.current;
    if (!lottie) return;
    const totalFrames = lottie.getDuration(true) ?? 0;
    lottie.goToAndStop(
      displayExpanded ? Math.max(totalFrames - 1, 0) : 0,
      true,
    );
  }, [displayExpanded]);

  useEffect(() => {
    const changed = prevExpandedRef.current !== displayExpanded;
    prevExpandedRef.current = displayExpanded;
    const lottie = lottieRef.current;
    if (!lottie) return; // ref not ready yet; onDOMLoaded will snap the frame.
    if (changed && animationsReady) {
      // Play the morph in the right direction on a real expand/collapse toggle.
      lottie.setDirection(displayExpanded ? 1 : -1);
      lottie.play();
    } else {
      snapToFrame();
    }
  }, [displayExpanded, animationsReady, snapToFrame]);

  return (
    <div
      className={cn(
        'flex shrink-0 items-center overflow-hidden rtl:-scale-x-100',
        className,
      )}
      style={{
        height,
        width: displayExpanded ? width : collapsedWidth,
        // Keep the width in sync with the Lottie: no transition until animations
        // are ready (so hydration settling snaps), then the morph-matched easing.
        transition: animationsReady
          ? `width ${durationMs}ms ${displayExpanded ? expandEasing : collapseEasing}`
          : 'none',
      }}
    >
      <LazyLottie
        id={cacheId}
        lottieRef={lottieRef}
        getJson={getJson}
        // shrink-0 keeps the Lottie at its intrinsic width so the wrapper CLIPS
        // it (left-aligned overflow) rather than the flex parent squeezing it
        // and the SVG scaling down to "fit".
        className="shrink-0 rtl:-scale-x-100"
        style={{ width, height }}
        loop={false}
        autoplay={false}
        onDOMLoaded={() => {
          setLottieReady(true);
          snapToFrame();
        }}
      />
    </div>
  );
}
