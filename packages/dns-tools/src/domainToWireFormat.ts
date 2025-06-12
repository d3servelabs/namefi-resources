/**
 * Converts a domain name string (e.g., "example.com") into its DNS wire format.
 *
 * In DNS wire format, domain names are encoded as a sequence of labels,
 * where each label is prefixed with a single byte indicating its length,
 * followed by its ASCII-encoded characters. The name is terminated by a
 * zero byte indicating the root.
 *
 * For example, "example.com" becomes:
 *   [7] e x a m p l e [3] c o m [0]
 *
 * This format is used in DNSSEC digest computations, such as for DS record generation.
 *
 * @param domain - The domain name to convert, e.g., "example.com"
 * @returns A Buffer representing the domain name in DNS wire format
 */

export function domainToWireFormat(_domain: string): Buffer {
  if (!_domain || _domain.trim().length === 0) {
    throw new Error('Domain cannot be empty');
  }
  const domain = _domain.toLowerCase().replace(/\.$/g, '');

  // Validate total domain length (RFC 1035)
  if (domain.length > 253) {
    throw new Error('Domain name too long (max 253 characters)');
  }

  const wire = Buffer.concat(
    domain
      .split('.')
      .map((label) => {
        // Validate label length (RFC 1035)
        if (label.length === 0 || label.length > 63) {
          throw new Error(
            `Invalid label length: ${label.length} (must be 1-63 characters)`,
          );
        }
        const len = Buffer.from([label.length]);
        const data = Buffer.from(label, 'ascii');
        return Buffer.concat([len, data]);
      })
      .concat(Buffer.from([0])), // null root
  );

  return wire;
}
