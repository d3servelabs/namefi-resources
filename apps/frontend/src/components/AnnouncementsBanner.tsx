'use client';

import { useTRPC } from '@/lib/trpc';
import { useDismissedAnnouncements } from '@/hooks/use-dismissed-announcements';
import { isSafeHref, renderInlineMarkdown } from '@/lib/inline-markdown';
import type { AnnouncementDto } from '@namefi-astra/common/contract/announcements-contract';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@namefi-astra/ui/lib/cn';

const AUTO_ROTATE_MS = 7000;
const STRIP_HEIGHT_VAR = '--announcement-strip-height';
const EXTERNAL_LINK_REGEX = /^https?:\/\//i;
const CTA_CLASS =
  'ms-2 font-semibold underline underline-offset-2 hover:opacity-80';

function isExternalLink(url: string): boolean {
  return EXTERNAL_LINK_REGEX.test(url);
}

// A single leading slash (not `//`, which is protocol-relative / external).
function isInternalPath(url: string): boolean {
  return /^\/(?!\/)/.test(url);
}

/**
 * CTA link. Same-origin `/path` links use Next.js client navigation
 * (`<Link>`); external/mailto links use a plain anchor. The open behavior
 * comes from `target` (admin choice) or auto-resolves: external → new tab,
 * internal → same tab.
 */
function AnnouncementCta({
  url,
  label,
  target,
}: {
  url: string;
  label: string;
  target: AnnouncementDto['linkTarget'];
}) {
  const resolvedTarget = target ?? (isExternalLink(url) ? '_blank' : '_self');
  const rel = resolvedTarget === '_blank' ? 'noopener noreferrer' : undefined;

  if (isInternalPath(url)) {
    return (
      <Link
        href={url as Route}
        data-testid="announcement-link"
        target={resolvedTarget}
        rel={rel}
        className={CTA_CLASS}
      >
        {label}
      </Link>
    );
  }
  return (
    <a
      href={url}
      data-testid="announcement-link"
      target={resolvedTarget}
      rel={rel}
      className={CTA_CLASS}
    >
      {label}
    </a>
  );
}

/** Presentational strip for a single announcement. */
function AnnouncementStrip({
  current,
  hasMultiple,
  collapsed,
  onPrev,
  onNext,
  onDismiss,
}: {
  current: AnnouncementDto;
  hasMultiple: boolean;
  collapsed: boolean;
  onPrev: () => void;
  onNext: () => void;
  onDismiss: () => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  // Only render the CTA when the href passes the safe-scheme allowlist.
  const safeLinkUrl =
    current.linkUrl && isSafeHref(current.linkUrl) ? current.linkUrl : null;

  // Publish the *rendered* strip height so the viewport-fixed header/trigger can
  // offset below it; reset to 0 on unmount (i.e. when no announcement is shown).
  // `stripRef` wraps the collapsing inner box, so as the strip animates closed
  // the height reported here shrinks to 0 and the pinned header/trigger slide up
  // in lockstep.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the shown announcement changes.
  useEffect(() => {
    const root = document.documentElement;
    const el = stripRef.current;
    if (!el) return;
    const update = () =>
      root.style.setProperty(STRIP_HEIGHT_VAR, `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.setProperty(STRIP_HEIGHT_VAR, '0px');
    };
  }, [current.id]);

  // Default to the brand-primary strip; per-announcement overrides win.
  // `backgroundOpacity` (0–100) applies to the background layer only — via
  // color-mix so it works with both the brand-primary oklch var and a custom
  // color, without fading the text.
  const opacity = current.backgroundOpacity;
  const hasOpacity = opacity != null && opacity < 100;
  let backgroundColor: string | undefined;
  if (hasOpacity) {
    const base = current.backgroundColor ?? 'var(--brand-primary)';
    backgroundColor = `color-mix(in srgb, ${base} ${opacity}%, transparent)`;
  } else if (current.backgroundColor) {
    backgroundColor = current.backgroundColor;
  }
  const style: CSSProperties = {
    backgroundColor,
    color: current.textColor ?? undefined,
  };

  return (
    // Collapse to 0 height when scrolled (animating grid-template-rows keeps the
    // height transition smooth without measuring the content). `inert` removes
    // the hidden controls from the tab order while collapsed.
    <div
      data-testid="announcement-banner"
      className={cn(
        'relative z-50 grid w-full shrink-0 transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none',
        collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
      )}
    >
      <div
        ref={stripRef}
        inert={collapsed || undefined}
        className="overflow-hidden"
      >
        <section
          aria-label={current.title || 'Announcement'}
          data-testid="announcement-strip"
          style={style}
          className={cn(
            'relative w-full',
            !backgroundColor && 'bg-brand-primary',
            !current.textColor && 'text-white',
          )}
        >
          <div
            data-testid="announcement-content"
            className="mx-auto flex min-h-9 max-w-6xl items-center justify-center gap-2 px-10 py-1.5 text-center text-sm"
          >
            {hasMultiple ? (
              <button
                type="button"
                data-testid="announcement-prev-button"
                aria-label="Previous announcement"
                onClick={onPrev}
                className="shrink-0 rounded-full p-0.5 opacity-80 hover:opacity-100"
              >
                <ChevronLeft className="size-4 rtl:-scale-x-100" />
              </button>
            ) : null}

            <p data-testid="announcement-body" className="min-w-0 leading-5">
              {current.title ? (
                <strong
                  data-testid="announcement-title"
                  className="me-1 font-semibold"
                >
                  {current.title}
                </strong>
              ) : null}
              {renderInlineMarkdown(current.body, {
                linkClassName: 'font-medium',
                codeClassName: 'bg-white/15',
              })}
              {safeLinkUrl ? (
                <AnnouncementCta
                  url={safeLinkUrl}
                  label={current.linkLabel ?? 'Learn more'}
                  target={current.linkTarget}
                />
              ) : null}
            </p>

            {hasMultiple ? (
              <button
                type="button"
                data-testid="announcement-next-button"
                aria-label="Next announcement"
                onClick={onNext}
                className="shrink-0 rounded-full p-0.5 opacity-80 hover:opacity-100"
              >
                <ChevronRight className="size-4 rtl:-scale-x-100" />
              </button>
            ) : null}
          </div>

          {current.dismissible ? (
            <button
              type="button"
              data-testid="announcement-dismiss-button"
              aria-label="Dismiss announcement"
              onClick={onDismiss}
              className="absolute inset-y-0 right-2 my-auto flex size-6 items-center justify-center rounded-full opacity-80 hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export function AnnouncementsBanner({
  collapsed = false,
}: {
  /** When true, the strip animates closed (height 0) but stays mounted. */
  collapsed?: boolean;
}) {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.announcements.getActive.queryOptions(undefined, {
      refetchInterval: 60_000,
      staleTime: 60_000,
    }),
  );
  const { isDismissed, dismiss } = useDismissedAnnouncements();

  const visible = useMemo(
    () =>
      (data?.items ?? []).filter(
        (item) => !isDismissed(item.id, item.updatedAt),
      ),
    [data?.items, isDismissed],
  );

  const [index, setIndex] = useState(0);
  const count = visible.length;
  const current: AnnouncementDto | undefined =
    count > 0 ? visible[index % count] : undefined;

  // Keep the index in range as the visible set changes (e.g. after a dismissal).
  useEffect(() => {
    if (index >= count && count > 0) setIndex(0);
  }, [count, index]);

  // Auto-rotate through multiple announcements, honoring reduced-motion.
  useEffect(() => {
    if (count <= 1) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const interval = setInterval(
      () => setIndex((i) => (i + 1) % count),
      AUTO_ROTATE_MS,
    );
    return () => clearInterval(interval);
  }, [count]);

  const goPrev = useCallback(
    () => setIndex((i) => (i - 1 + count) % count),
    [count],
  );
  const goNext = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  if (!current) return null;

  return (
    <AnnouncementStrip
      current={current}
      hasMultiple={count > 1}
      collapsed={collapsed}
      onPrev={goPrev}
      onNext={goNext}
      onDismiss={() => dismiss(current.id, current.updatedAt)}
    />
  );
}
