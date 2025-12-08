/**
 * XML utility functions for building EPP command structures.
 *
 * EPP XML schemas expect text content to be wrapped in objects with a `#text` property.
 * These utilities simplify creating these structures.
 */

/**
 * Wraps a string into the XML text node format `{ "#text": string }`.
 *
 * @example
 * xmlTextNode("example.com")
 * // Returns: { "#text": "example.com" }
 *
 * @param text - A string to wrap
 * @returns The wrapped text node in XML JSON format
 */
export function xmlTextNode<S extends string | number | boolean>(
  text: S,
): { '#text': `${S}` };

/**
 * Wraps an array of strings into an array of XML text nodes.
 *
 * @example
 * xmlTextNode(["ns1.example.com", "ns2.example.com"])
 * // Returns: [{ "#text": "ns1.example.com" }, { "#text": "ns2.example.com" }]
 *
 * @param text - An array of strings to wrap
 * @returns The wrapped text nodes in XML JSON format
 */
export function xmlTextNode<S extends string | number | boolean>(
  text: S[],
): { '#text': `${S}` }[];

export function xmlTextNode<S extends string | number | boolean>(
  text: S | S[],
): { '#text': `${S}` } | { '#text': `${S}` }[] {
  if (Array.isArray(text)) {
    return text.map((t) => ({ '#text': `${t}` }));
  }
  return { '#text': `${text}` };
}

/**
 * Adds XML namespace declarations to an object.
 *
 * Transforms a namespace record into `@_xmlns` or `@_xmlns:prefix` attributes
 * and merges them with the provided object.
 *
 * @example
 * // Default namespace (empty string prefix)
 * withNamespaces({ "domain:name": { "#text": "example.com" } }, { "": DOMAIN_NS })
 * // Returns: { "@_xmlns": "urn:ietf:params:xml:ns:domain-1.0", "domain:name": { "#text": "example.com" } }
 *
 * @example
 * // Prefixed namespace
 * withNamespaces({ "host:name": { "#text": "ns1.example.com" } }, { host: HOST_NS })
 * // Returns: { "@_xmlns:host": "urn:ietf:params:xml:ns:host-1.0", "host:name": { "#text": "ns1.example.com" } }
 *
 * @param obj - The object to add namespace attributes to
 * @param namespaces - Record of prefix to namespace URI (use "" for default namespace)
 * @returns The object with namespace attributes added
 */
export function withNamespaces<O extends Record<string, unknown>>(
  obj: O,
  namespaces: Record<string, string>,
): O {
  const nsAttrs = Object.fromEntries(
    Object.entries(namespaces).map(([prefix, uri]) => [
      prefix === '' ? '@_xmlns' : `@_xmlns:${prefix}`,
      uri,
    ]),
  );
  return { ...obj, ...nsAttrs } as O;
}
