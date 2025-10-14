// TODO: timeout logic needs to be improved
import { useRef, useState, useCallback, useEffect, useId } from 'react';
import { cn } from '@/lib/cn';
import { useDebounceCallback } from 'usehooks-ts';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './ui/shadcn/hover-card';

/**
 * AutoTruncateText V2 - Standalone component that handles truncation without external dependencies
 *
 * Solves the oscillation issue by:
 * 1. Accounting for the ellipsis ("...") width in calculations
 * 2. Not depending on TruncatedTextWithHover which changes widths
 * 3. Measuring both full text and truncated text with ellipsis
 *
 * @param text - The text to display
 * @param minCharactersToDisplay - Minimum number of characters to show
 * @param className - Additional CSS classes
 * @param ellipsis - The ellipsis string (default: "...")
 */
export const AutoTruncateTextV2 = ({
  minCharactersToDisplay,
  className,
  children: text,
  ellipsis = '...',
}: {
  minCharactersToDisplay: number;
  className?: string;
  children: string;
  ellipsis?: string;
}) => {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const measureFullRef = useRef<HTMLSpanElement>(null);
  const measureEllipsisRef = useRef<HTMLSpanElement>(null);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const [displayLength, setDisplayLength] = useState(text.length);
  const [hoverOpen, setHoverOpen] = useState(false);

  const centerTruncateString = useCallback(
    (str: string, length: number) => {
      if (str.length <= length) return str;

      const charsLength = length - ellipsis.length;
      const firstPartLength = Math.ceil(charsLength / 2);
      const secondPartLength = charsLength - firstPartLength;

      return (
        str.substring(0, firstPartLength) +
        ellipsis +
        str.substring(str.length - secondPartLength)
      );
    },
    [ellipsis],
  );

  const _recomputeSizes = useCallback(() => {
    ellipsis; // to avoid linting error
    if (text.length === 0) {
      setShouldTruncate(false);
      setDisplayLength(text.length);
      return;
    }

    // If refs aren't ready yet, don't proceed
    if (
      !containerRef.current ||
      !measureFullRef.current ||
      !measureEllipsisRef.current
    ) {
      return;
    }

    const containerComputedStyle = window.getComputedStyle(
      containerRef.current,
    );

    // Get available width in the container (accounting for padding)
    const containerWidth = containerRef.current.clientWidth;
    const paddingLeft =
      Number.parseFloat(containerComputedStyle.paddingLeft) || 0;
    const paddingRight =
      Number.parseFloat(containerComputedStyle.paddingRight) || 0;
    const availableWidth = containerWidth - paddingLeft - paddingRight;

    if (availableWidth === 0) {
      return;
    }

    // Measure full text width
    const fullTextWidth = measureFullRef.current.clientWidth;

    // If full text fits, no truncation needed
    if (fullTextWidth <= availableWidth) {
      setShouldTruncate(false);
      setDisplayLength(text.length);
      return;
    }

    // Text needs truncation - find the right length
    // Measure ellipsis width
    const ellipsisWidth = measureEllipsisRef.current.clientWidth;

    // Calculate available width for actual text (minus ellipsis)
    const availableForText = availableWidth - ellipsisWidth;

    // Estimate character width (using full text measurement)
    const avgCharWidth = fullTextWidth / text.length;

    // Calculate how many characters fit (accounting for center truncation distribution)
    // For center truncation, we show roughly half on each side
    const estimatedChars = Math.floor(availableForText / avgCharWidth);

    // Ensure we meet minimum requirements
    const finalLength = Math.max(
      minCharactersToDisplay,
      Math.min(estimatedChars, text.length),
    );

    // Add a small safety margin to prevent edge cases
    const safeLength = Math.max(minCharactersToDisplay, finalLength - 2);

    setShouldTruncate(true);
    setDisplayLength(safeLength);
  }, [text, minCharactersToDisplay, ellipsis]);

  const recomputeSizes = useDebounceCallback(_recomputeSizes, 100);

  useEffect(() => {
    // Initial calculation - keep trying until refs are available
    const tryCompute = () => {
      if (
        containerRef.current &&
        measureFullRef.current &&
        measureEllipsisRef.current
      ) {
        _recomputeSizes();
      } else {
        // Refs not ready yet, retry on next frame
        requestAnimationFrame(tryCompute);
      }
    };

    // Start trying after a small delay to let DOM settle
    const timeoutId = setTimeout(() => {
      tryCompute();
    }, 0);

    // Check on resize using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      recomputeSizes();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current, {
        box: 'border-box',
      });
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [_recomputeSizes, recomputeSizes]);

  const truncatedText = shouldTruncate
    ? centerTruncateString(text, displayLength)
    : text;

  const needsHover = shouldTruncate && text.length > displayLength;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Hidden spans to measure text with actual font */}
      <span
        ref={measureFullRef}
        className="invisible absolute pointer-events-none whitespace-nowrap"
        aria-hidden="true"
      >
        {text}
      </span>
      <span
        ref={measureEllipsisRef}
        className="invisible absolute pointer-events-none whitespace-nowrap"
        aria-hidden="true"
      >
        {ellipsis}
      </span>

      {/* Actual display */}
      {needsHover ? (
        <HoverCard open={hoverOpen} onOpenChange={setHoverOpen}>
          <HoverCardTrigger
            onClick={(e) => {
              e.stopPropagation();
              if (!hoverOpen) {
                setTimeout(() => {
                  setHoverOpen(false);
                }, 3000);
              }
              setHoverOpen((open) => !open);
            }}
          >
            <span id={id} key={id} className="cursor-pointer">
              {truncatedText}
            </span>
          </HoverCardTrigger>
          <HoverCardContent align="center" className="w-full text-sm">
            <div className="break-words">{text}</div>
          </HoverCardContent>
        </HoverCard>
      ) : (
        <span id={id} key={id}>
          {truncatedText}
        </span>
      )}
    </div>
  );
};
