import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from 'fumadocs-ui/components/codeblock';
import { type ComponentProps, type ReactNode, Suspense } from 'react';
import { CodeTabsClient } from './code-tabs.client';

export function slugifyTabLabel(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface CodeTabsProps {
  items: string[];
  children: ReactNode;
}

export function Tab({
  value,
  children,
  ...rest
}: { value: string; children: ReactNode } & Omit<
  ComponentProps<typeof CodeBlockTab>,
  'value' | 'children'
>) {
  return (
    <CodeBlockTab value={slugifyTabLabel(value)} {...rest}>
      {children}
    </CodeBlockTab>
  );
}

export function CodeTabs(props: CodeTabsProps) {
  return (
    <Suspense fallback={<CodeTabsFallback {...props} />}>
      <CodeTabsClient {...props} />
    </Suspense>
  );
}

function CodeTabsFallback({ items, children }: CodeTabsProps) {
  const defaultValue = slugifyTabLabel(items[0] ?? '');
  return (
    <CodeBlockTabs defaultValue={defaultValue}>
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
