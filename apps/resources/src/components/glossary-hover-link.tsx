'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@namefi-astra/ui/components/shadcn/hover-card';

/**
 * A glossary link that reveals the term's one-line definition on hover/focus.
 * The description is resolved on the server (see mdx-components) and passed in,
 * so this stays a thin leaf client component with no provider or data fetching.
 * The server only renders this component when a description actually exists —
 * description-less glossary links stay plain server-rendered links and never
 * pull in this card's JS. On touch devices a tap just navigates to the entry.
 */
export function GlossaryHoverLink({
  href,
  description,
  className,
  children,
}: {
  href: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger render={<Link href={href} className={className} />}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        className="max-w-xs text-sm leading-snug text-muted-foreground"
      >
        {description}
      </HoverCardContent>
    </HoverCard>
  );
}
