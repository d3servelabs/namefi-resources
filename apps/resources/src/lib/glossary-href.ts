// Pure glossary-href parsing — kept free of any server-only imports so it can be
// unit-tested and used from either side of the server/client boundary.

// Internal glossary links look like /<locale>/glossary/<slug>/ (trailing slash
// optional). Anything with a query/hash or extra path segments is not a plain
// glossary entry link and is left as a normal anchor.
const GLOSSARY_HREF = /^\/([a-z]{2})\/glossary\/([^/?#]+)\/?$/;

/** Parse a glossary entry href into its locale + slug, or null if it isn't one. */
export function parseGlossaryHref(
  href: string,
): { locale: string; slug: string } | null {
  const match = GLOSSARY_HREF.exec(href);
  return match ? { locale: match[1], slug: match[2] } : null;
}
