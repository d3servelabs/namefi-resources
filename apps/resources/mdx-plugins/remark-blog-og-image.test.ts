import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import remarkBlogOgImage from './remark-blog-og-image';

type MdastNode = {
  type: string;
  url?: string;
  alt?: string;
  children?: MdastNode[];
};

type MdastRoot = {
  children: MdastNode[];
};

type RemarkPlugin = (
  tree: MdastRoot,
  file: { path?: string; history?: string[] },
) => void;

const plugin = remarkBlogOgImage() as RemarkPlugin;
const mdxPluginsDirectory = path.dirname(fileURLToPath(import.meta.url));
const resourcesDirectory = path.resolve(mdxPluginsDirectory, '..');
const blogFilePath = path.join(
  resourcesDirectory,
  'data/content/blog/en/dns-is-the-control-plane.md',
);
const expectedImageUrl = '../../assets/dns-is-the-control-plane-og.jpg';

describe('remarkBlogOgImage', () => {
  it('injects a convention-based OG image into blog markdown', () => {
    const tree: MdastRoot = {
      children: [{ type: 'yaml' }, { type: 'mdxjsEsm' }, { type: 'paragraph' }],
    };

    plugin(tree, { path: blogFilePath });

    expect(tree.children).toEqual([
      { type: 'yaml' },
      { type: 'mdxjsEsm' },
      { type: 'image', url: expectedImageUrl, alt: '' },
      { type: 'paragraph' },
    ]);
  });

  it('does not duplicate an existing matching image', () => {
    const tree: MdastRoot = {
      children: [
        { type: 'image', url: expectedImageUrl, alt: '' },
        { type: 'paragraph' },
      ],
    };

    plugin(tree, { path: blogFilePath });

    expect(tree.children).toEqual([
      { type: 'image', url: expectedImageUrl, alt: '' },
      { type: 'paragraph' },
    ]);
  });

  it('leaves non-blog markdown unchanged', () => {
    const tree: MdastRoot = {
      children: [{ type: 'paragraph' }],
    };

    plugin(tree, {
      path: path.join(resourcesDirectory, 'data/content/glossary/en/dns.md'),
    });

    expect(tree.children).toEqual([{ type: 'paragraph' }]);
  });
});
