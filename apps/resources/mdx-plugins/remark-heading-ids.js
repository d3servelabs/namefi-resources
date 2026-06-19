const { visit } = require('unist-util-visit');

// Stamp a stable, de-duplicated slug `id` onto every h2/h3 so the article Table
// of Contents can deep-link to sections. A local remark plugin (loaded via
// require.resolve, like remark-static-image-imports) rather than rehype-slug,
// which breaks the Turbopack MDX build (ESM require). getPostToc() in
// lib/content re-derives the SAME ids (identical slugify + identical -N dedup,
// in document order), so ToC anchors always resolve — even when two headings
// normalize to the same base slug (e.g. an H2 and an FAQ question).
//
// KEEP slugify() in sync with src/lib/slugify.ts.
function slugify(text) {
  return text
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

function headingText(node) {
  let text = '';
  visit(node, (child) => {
    if (
      typeof child.value === 'string' &&
      (child.type === 'text' || child.type === 'inlineCode')
    ) {
      text += child.value;
    }
  });
  return text;
}

// De-dup like github-slugger: track every EMITTED id (not just base counts), so
// a heading that slugifies to e.g. `foo-1` can't collide with the suffix minted
// for a duplicate `foo`. KEEP IN SYNC with createHeadingIdDeduper in lib/content.
function createDeduper() {
  const occurrences = new Map();
  return (base) => {
    let result = base;
    while (occurrences.has(result)) {
      const count = (occurrences.get(base) ?? 0) + 1;
      occurrences.set(base, count);
      result = `${base}-${count}`;
    }
    occurrences.set(result, occurrences.get(result) ?? 0);
    return result;
  };
}

module.exports = function remarkHeadingIds() {
  return (tree) => {
    const uniqueId = createDeduper();
    visit(tree, 'heading', (node) => {
      if (node.depth < 2 || node.depth > 3) return;
      const base = slugify(headingText(node));
      if (!base) return;
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.id = uniqueId(base);
    });
  };
};
