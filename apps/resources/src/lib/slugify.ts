// Deterministic, unicode-aware heading slug used by getPostToc to build the
// Table of Contents. It must stay in lockstep with mdx-plugins/remark-heading-ids.js,
// the remark plugin that stamps the matching `id` on each rendered heading, so a
// ToC anchor (`#id`) always resolves. Stateless — equal text yields an equal
// slug; de-duplication of repeated slugs is layered on top (identically) by both
// callers. Unicode letters/numbers are kept so non-Latin headings (e.g. zh) get
// meaningful, matching ids.
//
// KEEP IN SYNC with the slugify() copy in mdx-plugins/remark-heading-ids.js.
export function slugify(text: string): string {
  return text
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}
