'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import { safeToUnicode } from '../utils';

export function DomainNameCell({ domainName }: { domainName: string }) {
  const unicodeName = safeToUnicode(domainName);
  const isPunycode = unicodeName !== domainName;
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0">
        <Link
          href={`/domains/${domainName}?tab=dns-overview`}
          aria-label={`Settings for ${domainName}`}
          className="font-medium hover:underline"
        >
          {unicodeName}
        </Link>
        {isPunycode && (
          <span className="block text-xs text-muted-foreground">
            {domainName}
          </span>
        )}
      </div>
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <a
              {...props}
              href={`https://${domainName}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'text-muted-foreground hover:text-foreground transition-colors',
                props.className,
              )}
              aria-label={`Visit ${domainName}`}
              onClick={(event) => {
                props.onClick?.(event);
                event.stopPropagation();
              }}
            >
              {props.children}
            </a>
          )}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </TooltipTrigger>
        <TooltipContent>Visit {domainName}</TooltipContent>
      </Tooltip>
    </div>
  );
}
