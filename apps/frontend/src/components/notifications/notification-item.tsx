'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { NotificationRelatedResource } from '@namefi-astra/common/shared-schemas';
import type { NotificationDto } from '@namefi-astra/common/contract/notifications-contract';
import { Archive, ArchiveRestore, Check, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRef } from 'react';

import {
  LINKABLE_NOTIFICATION_RESOURCE_TYPES,
  resourceHref,
  resourceLabel,
} from './resource-href';
import { useNotificationRenderTracking } from './use-render-tracking';

export type NotificationItemProps = {
  notification: NotificationDto;
  selected: boolean;
  onToggleSelected: (id: string) => void;
  onMarkSeen: (id: string) => void;
  onMarkUnseen: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onAutoMarkSeen: (id: string) => void;
};

const BADGE_IDENTIFIER_MAX_CHARS = 10;

/**
 * Truncate identifiers in resource badges so UUIDs / order IDs don't
 * blow out the footnote. Domain names are kept verbatim — a domain is
 * the kind of identifier the user actively recognizes, so seeing it in
 * full matters. Non-domain ids are shown abbreviated with a `title`
 * tooltip carrying the full value.
 */
function truncateResourceIdentifier(
  resource: NotificationRelatedResource,
): string {
  if (resource.type === 'domain') return resource.identifier;
  if (resource.identifier.length <= BADGE_IDENTIFIER_MAX_CHARS) {
    return resource.identifier;
  }
  return `${resource.identifier.slice(0, BADGE_IDENTIFIER_MAX_CHARS - 1)}…`;
}
export function NotificationItem({
  notification,
  selected,
  onToggleSelected,
  onMarkSeen,
  onMarkUnseen,
  onArchive,
  onUnarchive,
  onAutoMarkSeen,
}: NotificationItemProps) {
  const liRef = useRef<HTMLLIElement | null>(null);
  const linkableResources = notification.relatedResources.filter((r) =>
    LINKABLE_NOTIFICATION_RESOURCE_TYPES.has(r.type),
  );

  useNotificationRenderTracking({
    notificationId: notification.id,
    isSeen: notification.isSeen,
    elementRef: liRef,
    onThresholdReached: () => onAutoMarkSeen(notification.id),
  });

  return (
    <li
      ref={liRef}
      className={cn(
        'group relative flex gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors',
        !notification.isSeen &&
          'border-l-2 border-l-brand-primary bg-white/[0.04]',
        notification.isArchived && 'opacity-60',
      )}
    >
      <div className="pt-0.5">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelected(notification.id)}
          aria-label={`Select ${notification.title}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {notification.title}
            </h3>
            {notification.subtitle && (
              <p className="truncate text-xs text-muted-foreground">
                {notification.subtitle}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {notification.isSeen ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Mark as unseen"
                onClick={() => onMarkUnseen(notification.id)}
              >
                <RotateCcw className="size-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Mark as seen"
                onClick={() => onMarkSeen(notification.id)}
              >
                <Check className="size-3.5" />
              </Button>
            )}
            {notification.isArchived ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Restore from archive"
                onClick={() => onUnarchive(notification.id)}
              >
                <ArchiveRestore className="size-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Archive"
                onClick={() => onArchive(notification.id)}
              >
                <Archive className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        <NotificationBody
          body={notification.body}
          bodyType={notification.bodyType}
        />

        {linkableResources.length > 0 && (
          <footer className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {linkableResources.map((resource, idx) => {
              const href = resourceHref(resource);
              const shownIdentifier = truncateResourceIdentifier(resource);
              const isTruncated = shownIdentifier !== resource.identifier;
              const fullLabel = `${resourceLabel(resource)}: ${resource.identifier}`;
              const shownLabel = `${resourceLabel(resource)}: ${shownIdentifier}`;
              if (!href) {
                return (
                  <span
                    key={`${resource.type}-${resource.identifier}-${idx}`}
                    title={isTruncated ? fullLabel : undefined}
                  >
                    {shownLabel}
                  </span>
                );
              }
              return (
                <Link
                  key={`${resource.type}-${resource.identifier}-${idx}`}
                  href={href as Route}
                  title={isTruncated ? fullLabel : undefined}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-foreground/70 transition-colors hover:border-brand-primary/70 hover:text-foreground"
                >
                  {shownLabel} →
                </Link>
              );
            })}
          </footer>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Inline markdown rendering (safe, no dangerouslySetInnerHTML)
// ---------------------------------------------------------------------------
//
// Supports only: **bold**, *italic*, `code`, and [text](url) links. Anything
// else is rendered as plain text with line breaks preserved. We intentionally
// don't reach for `react-markdown` because the modal lives in the app shell
// and the dep is too heavy for the value (notification bodies are short).

function NotificationBody({
  body,
  bodyType,
}: {
  body: string;
  bodyType: NotificationDto['bodyType'];
}) {
  if (bodyType !== 'markdown') {
    return (
      <p className="mt-1 whitespace-pre-line text-sm text-foreground/85">
        {body}
      </p>
    );
  }
  return (
    <p className="mt-1 whitespace-pre-line text-sm text-foreground/85">
      {renderInlineMarkdown(body)}
    </p>
  );
}

type MdToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; text: string; href: string };

const INLINE_MD_REGEX =
  /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|\[([^\]]+)\]\(([^)]+)\)/g;

function tokenizeMarkdown(input: string): MdToken[] {
  const tokens: MdToken[] = [];
  let lastIndex = 0;
  for (const match of input.matchAll(INLINE_MD_REGEX)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      tokens.push({ type: 'text', value: input.slice(lastIndex, idx) });
    }
    if (match[2]) tokens.push({ type: 'bold', value: match[2] });
    else if (match[4]) tokens.push({ type: 'italic', value: match[4] });
    else if (match[6]) tokens.push({ type: 'code', value: match[6] });
    else if (match[7] && match[8])
      tokens.push({ type: 'link', text: match[7], href: match[8] });
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < input.length) {
    tokens.push({ type: 'text', value: input.slice(lastIndex) });
  }
  return tokens;
}

function isSafeHref(href: string): boolean {
  return (
    href.startsWith('https://') ||
    href.startsWith('http://') ||
    href.startsWith('/') ||
    href.startsWith('mailto:')
  );
}

function renderInlineMarkdown(body: string) {
  return tokenizeMarkdown(body).map((token, i) => {
    switch (token.type) {
      case 'bold':
        return <strong key={i}>{token.value}</strong>;
      case 'italic':
        return <em key={i}>{token.value}</em>;
      case 'code':
        return (
          <code
            key={i}
            className="rounded bg-white/[0.06] px-1 py-0.5 text-[12px]"
          >
            {token.value}
          </code>
        );
      case 'link': {
        const safe = isSafeHref(token.href);
        if (!safe) return <span key={i}>{token.text}</span>;
        return (
          <a
            key={i}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-primary underline-offset-2 hover:underline"
          >
            {token.text}
          </a>
        );
      }
      default:
        return <span key={i}>{token.value}</span>;
    }
  });
}
