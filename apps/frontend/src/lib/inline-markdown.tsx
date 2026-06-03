import { cn } from '@namefi-astra/ui/lib/cn';
import type { ReactNode } from 'react';

/**
 * Lightweight, safe inline markdown rendering (no `dangerouslySetInnerHTML`).
 *
 * Supports only `**bold**`, `*italic*`, `` `code` ``, and `[text](url)` links.
 * Anything else renders as plain text. We intentionally avoid `react-markdown`
 * here because the consumers (announcement strip, etc.) live in the app shell
 * and the dep is too heavy for short copy. Mirrors the approach used by the
 * notifications modal (`components/notifications/notification-item.tsx`).
 */

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

/**
 * Allowlist of safe link schemes. Blocks `javascript:`, `data:`, etc. so
 * untrusted hrefs can't execute script when rendered as `<a href>`.
 */
export function isSafeHref(href: string): boolean {
  return (
    href.startsWith('https://') ||
    href.startsWith('http://') ||
    href.startsWith('/') ||
    href.startsWith('mailto:')
  );
}

type InlineMarkdownOptions = {
  /** Extra classes for rendered links. */
  linkClassName?: string;
  /** Extra classes for inline `code`. */
  codeClassName?: string;
};

export function renderInlineMarkdown(
  body: string,
  options: InlineMarkdownOptions = {},
): ReactNode[] {
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
            className={cn(
              'rounded bg-black/10 px-1 py-0.5 text-[0.9em]',
              options.codeClassName,
            )}
          >
            {token.value}
          </code>
        );
      case 'link': {
        if (!isSafeHref(token.href)) return <span key={i}>{token.text}</span>;
        const external = /^https?:\/\//i.test(token.href);
        return (
          <a
            key={i}
            href={token.href}
            {...(external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
            className={cn(
              'underline underline-offset-2 hover:opacity-80',
              options.linkClassName,
            )}
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
