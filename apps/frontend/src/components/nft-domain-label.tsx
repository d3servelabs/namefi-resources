'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

type LabelLayout = {
  text: string;
  fontSize: number;
  lineHeight: number;
};

type LabelConfig = {
  baseFontSize: number;
  minFontSize: number;
  maxLines: number;
  minChunk: number;
};

const SUBDOMAIN_CONFIG: LabelConfig = {
  baseFontSize: 24,
  minFontSize: 12,
  maxLines: 3,
  minChunk: 4,
};

const PARENT_CONFIG: LabelConfig = {
  baseFontSize: 16,
  minFontSize: 11,
  maxLines: 2,
  minChunk: 3,
};

type FontMetrics = {
  fontFamily: string;
  fontStyle: string;
  fontWeight: string;
  letterSpacing: number;
};

function getFontMetrics(element: HTMLElement): FontMetrics {
  const styles = window.getComputedStyle(element);
  const letterSpacing = Number.parseFloat(styles.letterSpacing || '0') || 0;
  return {
    fontFamily: styles.fontFamily,
    fontStyle: styles.fontStyle,
    fontWeight: styles.fontWeight,
    letterSpacing,
  };
}

function measureTextWidth(
  text: string,
  fontSize: number,
  metrics: FontMetrics,
  context: CanvasRenderingContext2D,
): number {
  context.font = `${metrics.fontStyle} ${metrics.fontWeight} ${fontSize}px ${metrics.fontFamily}`;
  const width = context.measureText(text).width;
  if (metrics.letterSpacing === 0 || text.length <= 1) {
    return width;
  }
  return width + metrics.letterSpacing * (text.length - 1);
}

function findMaxFittingLength(
  label: string,
  start: number,
  minLength: number,
  maxLength: number,
  width: number,
  fontSize: number,
  metrics: FontMetrics,
  context: CanvasRenderingContext2D,
): number {
  let low = minLength;
  let high = maxLength;
  let best = -1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const part = label.slice(start, start + mid);
    const partWidth = measureTextWidth(part, fontSize, metrics, context);
    if (partWidth <= width) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best;
}

function splitByWidth({
  label,
  lines,
  width,
  fontSize,
  metrics,
  context,
  minChunk,
}: {
  label: string;
  lines: number;
  width: number;
  fontSize: number;
  metrics: FontMetrics;
  context: CanvasRenderingContext2D;
  minChunk: number;
}): string[] | null {
  if (!label) return [''];
  if (lines <= 1) {
    return measureTextWidth(label, fontSize, metrics, context) <= width
      ? [label]
      : null;
  }

  const parts: string[] = [];
  let cursor = 0;
  const safeMinChunk = Math.max(1, minChunk);

  for (let index = 0; index < lines; index += 1) {
    const remainingLines = lines - index;
    const remainingChars = label.length - cursor;
    const minRemaining = (remainingLines - 1) * safeMinChunk;
    const maxLength = remainingChars - minRemaining;

    if (index === lines - 1) {
      if (remainingChars < safeMinChunk) return null;
      const tail = label.slice(cursor);
      return measureTextWidth(tail, fontSize, metrics, context) <= width
        ? [...parts, tail]
        : null;
    }

    if (maxLength < safeMinChunk) return null;
    const minLength = safeMinChunk;

    if (maxLength < minLength) return null;

    const bestLength = findMaxFittingLength(
      label,
      cursor,
      minLength,
      maxLength,
      width,
      fontSize,
      metrics,
      context,
    );

    if (bestLength < minLength) return null;

    parts.push(label.slice(cursor, cursor + bestLength));
    cursor += bestLength;
  }

  return parts;
}

function getAvailableWidth(element: HTMLElement): number {
  const styles = window.getComputedStyle(element);
  const paddingLeft = Number.parseFloat(styles.paddingLeft || '0') || 0;
  const paddingRight = Number.parseFloat(styles.paddingRight || '0') || 0;
  const raw = element.clientWidth - paddingLeft - paddingRight;
  return Math.max(0, Math.floor(raw - 1));
}

function buildLabelLayout({
  label,
  config,
  width,
  metrics,
  context,
}: {
  label: string;
  config: LabelConfig;
  width: number;
  metrics: FontMetrics;
  context: CanvasRenderingContext2D;
}): LabelLayout {
  if (!label) {
    return {
      text: '',
      fontSize: config.baseFontSize,
      lineHeight: 1.1,
    };
  }

  const safeWidth = Math.max(0, Math.floor(width));
  const fitsAtMin = measureTextWidth(
    label,
    config.minFontSize,
    metrics,
    context,
  );
  const canFitSingleLine = fitsAtMin <= safeWidth;

  if (canFitSingleLine) {
    for (
      let fontSize = config.baseFontSize;
      fontSize >= config.minFontSize;
      fontSize -= 1
    ) {
      const fullWidth = measureTextWidth(label, fontSize, metrics, context);
      if (fullWidth <= safeWidth) {
        return {
          text: label,
          fontSize,
          lineHeight: 1.1,
        };
      }
    }

    return {
      text: label,
      fontSize: config.minFontSize,
      lineHeight: 1.1,
    };
  }

  for (
    let fontSize = config.baseFontSize;
    fontSize >= config.minFontSize;
    fontSize -= 1
  ) {
    const fullWidth = measureTextWidth(label, fontSize, metrics, context);
    if (fullWidth <= safeWidth) {
      return {
        text: label,
        fontSize,
        lineHeight: 1.1,
      };
    }

    for (let lineCount = 2; lineCount <= config.maxLines; lineCount += 1) {
      const lines = splitByWidth({
        label,
        lines: lineCount,
        width: safeWidth,
        fontSize,
        metrics,
        context,
        minChunk: config.minChunk,
      });

      if (lines) {
        return {
          text: lines.join('\n'),
          fontSize,
          lineHeight: 1.1,
        };
      }
    }
  }

  const fallbackLines = splitByWidth({
    label,
    lines: config.maxLines,
    width: safeWidth,
    fontSize: config.minFontSize,
    metrics,
    context,
    minChunk: config.minChunk,
  }) ?? [label];

  return {
    text: fallbackLines.join('\n'),
    fontSize: config.minFontSize,
    lineHeight: 1.1,
  };
}

function useResponsiveLabel<T extends HTMLElement>(
  text: string,
  config: LabelConfig,
) {
  const containerRef = useRef<T | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [layout, setLayout] = useState<LabelLayout>({
    text,
    fontSize: config.baseFontSize,
    lineHeight: 1.1,
  });

  const computeLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = getAvailableWidth(container);
    if (!width) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    const metrics = getFontMetrics(container);
    const nextLayout = buildLabelLayout({
      label: text,
      config,
      width,
      metrics,
      context,
    });

    setLayout((prev) =>
      prev.text === nextLayout.text &&
      prev.fontSize === nextLayout.fontSize &&
      prev.lineHeight === nextLayout.lineHeight
        ? prev
        : nextLayout,
    );
  }, [text, config]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      cancelAnimationFrame(frame);
      timeoutId = setTimeout(() => {
        frame = requestAnimationFrame(computeLayout);
      }, 50);
    };

    frame = requestAnimationFrame(computeLayout);

    const observer = new ResizeObserver(schedule);
    observer.observe(container);

    if (document.fonts?.ready) {
      document.fonts.ready.then(schedule).catch(() => undefined);
    }

    return () => {
      cancelAnimationFrame(frame);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      observer.disconnect();
    };
  }, [computeLayout]);

  return useMemo(
    () => ({
      ref: containerRef,
      layout,
    }),
    [layout],
  );
}

export type NftDomainLabelVariant = 'subdomain' | 'parent';
export type NftDomainLabelTag = 'h2' | 'p' | 'span' | 'div';

export type NftDomainLabelProps = {
  text: string;
  variant?: NftDomainLabelVariant;
  as?: NftDomainLabelTag;
  className?: string;
};

export function NftDomainLabel({
  text,
  variant = 'subdomain',
  as = 'span',
  className,
}: NftDomainLabelProps) {
  const config = variant === 'parent' ? PARENT_CONFIG : SUBDOMAIN_CONFIG;
  const label = useResponsiveLabel<HTMLSpanElement>(text, config);
  const Component = as;

  return (
    <Component className="contents">
      <span
        ref={label.ref}
        className={cn(
          'block w-full min-w-0 font-semibold leading-tight',
          className,
        )}
        style={{
          fontSize: label.layout.fontSize,
          lineHeight: label.layout.lineHeight,
          whiteSpace: 'pre-line',
          overflowWrap: 'anywhere',
        }}
      >
        {label.layout.text}
      </span>
    </Component>
  );
}
