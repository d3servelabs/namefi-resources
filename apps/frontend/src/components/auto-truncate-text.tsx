import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useDebounceCallback } from 'usehooks-ts';
import { TruncatedTextWithHover } from './truncated-text-with-hover';
/**
 * If the text is longer than the max length, it will be truncated and a hover card will be shown with the full text.
 * If parent has enough space, the text will be displayed as is.
 *
 * @param text
 * @param minCharactersToDisplay
 * @param className
 * @returns
 */
export const AutoTruncateText = ({
  minCharactersToDisplay,
  className,
  children: text,
}: {
  minCharactersToDisplay: number;
  className?: string;
  children: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [maxLengthForTruncation, setMaxLengthForTruncation] = useState(
    minCharactersToDisplay,
  );

  const _recomputeSizes = useCallback(() => {
    if (text.length === 0) {
      setMaxLengthForTruncation(minCharactersToDisplay);
      return;
    }

    if (!containerRef.current || !measureRef.current) return;

    // Get the computed font size in pixels
    const containerComputedStyle = window.getComputedStyle(
      containerRef.current,
    );

    // Measure actual text width in pixels
    const textWidth = measureRef.current.clientWidth;

    // Get available width in the container (accounting for padding)
    const containerWidth = containerRef.current.clientWidth;
    const paddingLeft =
      Number.parseFloat(containerComputedStyle.paddingLeft) || 0;
    const paddingRight =
      Number.parseFloat(containerComputedStyle.paddingRight) || 0;
    const availableWidth = containerWidth - paddingLeft - paddingRight;

    const charToPxRatio = Math.round(
      textWidth / text.length + 0.3,
    ) /** extra buffer to prevent overflow */;
    const _maxLengthForTruncation = Math.floor(availableWidth / charToPxRatio);
    setMaxLengthForTruncation(
      Math.max(minCharactersToDisplay, _maxLengthForTruncation),
    );
  }, [text, minCharactersToDisplay]);

  const recomputeSizes = useDebounceCallback(_recomputeSizes, 100);

  useEffect(() => {
    // Initial check
    recomputeSizes();

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
      resizeObserver.disconnect();
    };
  }, [recomputeSizes]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Hidden span to measure text with actual font */}
      <span
        ref={measureRef}
        className="invisible absolute pointer-events-none whitespace-nowrap"
        aria-hidden="true"
      >
        {text}
      </span>

      <TruncatedTextWithHover maxLength={maxLengthForTruncation}>
        {text}
      </TruncatedTextWithHover>
    </div>
  );
};
