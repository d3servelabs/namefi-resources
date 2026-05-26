import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { CodeTabs, Tab } from '@/components/code-tabs';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    CodeTabs,
    Tab,
    ...components,
  };
}
