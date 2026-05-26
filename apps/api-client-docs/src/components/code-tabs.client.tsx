'use client';

import {
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from 'fumadocs-ui/components/codeblock';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useCallback } from 'react';
import { slugifyTabLabel } from './code-tabs';

const QUERY_PARAM = 'lang';

export function CodeTabsClient({
  items,
  children,
}: {
  items: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const allowedSlugs = items.map(slugifyTabLabel);
  const fromUrl = searchParams.get(QUERY_PARAM);
  const activeSlug =
    fromUrl && allowedSlugs.includes(fromUrl) ? fromUrl : allowedSlugs[0];

  const onValueChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(QUERY_PARAM, next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <CodeBlockTabs value={activeSlug} onValueChange={onValueChange}>
      <CodeBlockTabsList>
        {items.map((label) => (
          <CodeBlockTabsTrigger key={label} value={slugifyTabLabel(label)}>
            {label}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {children}
    </CodeBlockTabs>
  );
}
