type JsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

// Serializes Schema.org structured data into a <script type="application/ld+json">
// tag. Centralized so individual pages don't repeat the dangerouslySetInnerHTML
// dance and so escape behavior stays consistent (forward-slash in </script> is
// escaped to defend against a closing-tag injection if any string field ever
// contained one).
export function JsonLd({ data }: JsonLdProps) {
  const serialized = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: payload is built from server-side strings, never user-controlled HTML.
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}
