// This file contains the validation logic for DNS records
import { z } from 'zod';
import { fqdnLowercaseRegex, nameSchema } from './name';
// -- Single Record Type Validation --

// Design decision: we use a string enum for the record type instead of a numeric enum
// because it's more readable and easier to work with.
// See @namefi-astra/docs/architecture/decisions/dns-record-type-format.md for more details.
export const recordTypeValues = [
  'A',
  'AAAA',
  'CNAME',
  'MX',
  'TXT',
  'NS',
  'SOA',
  'PTR',
  'SRV',
  'CAA',
  'DS',
  'TLSA',
  'SSHFP',
  'HTTPS',
  'SVCB',
  'NAPTR',
  'SPF',
] as const;
export const recordTypeEnum = z.enum(recordTypeValues);
export const RecordType = recordTypeEnum.enum;
export type RecordType = z.infer<typeof recordTypeEnum>;

// RFC 1035, Section 3.3.11
// The Time To Live field is an unsigned 32-bit integer that specifies the time interval
// that the resource record may be cached before it should be discarded.
// All RRs have this field; the semantics of the TTL field are independent of the RR type.
// The TTL field is used by caching name servers to prevent cache poisoning.
// The TTL field is also used by recursive resolvers to prevent infinite loops.
// The TTL field is also used by the name server to prevent cache poisoning.
const ttlSchema = z.number().int().min(0).max(2147483647);

const recordBasicSchema = z.object({
  type: z.string().regex(/^[A-Z]+$/),
  name: nameSchema,
  ttl: ttlSchema,
  rdata: z.string(),
});

// A Record
const aRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.A),
  rdata: z.ipv4({
    error:
      'The input is not a valid IPv4 address, A record value (rdata) must be an IPv4 address, example: "192.168.1.1"',
  }),
});

// AAAA Record
const aaaaRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.AAAA),
  rdata: z.ipv6({
    error:
      'The input is not a valid IPv6 address, AAAA record value (rdata) must be an IPv6 address, example: "2001:0db8:85a3:0000:0000:8a2e:0370:7334"',
  }),
});

// CNAME Record
const cnameRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.CNAME),
  rdata: z.string().regex(fqdnLowercaseRegex, {
    message:
      'The input is not a valid CNAME value (rdata), it must be a fully qualified, normalized, lowercase domain name with a trailing dot (e.g., "example.com.")',
  }),
});

// MX Record
const mxRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.MX),
  // MX records have a priority and a target which is a domain name or an IP address
  rdata: z.string().refine(
    (val) => {
      const [priority, target] = val.split(' ');
      const priorityParsed = z.string().regex(/^\d+$/).safeParse(priority);
      if (!priorityParsed.success) {
        return false;
      }
      const priorityNumber = Number.parseInt(priorityParsed.data);
      if (priorityNumber < 0 || priorityNumber > 65535) {
        return false;
      }
      const targetParsed = z
        .string()
        .regex(fqdnLowercaseRegex)
        .safeParse(target);
      return priorityParsed.success && targetParsed.success;
    },
    {
      message:
        'The input is not a valid MX value (rdata), it must be in the format "<priority> <target>", where priority is an integer (0-65535) and target is a fully qualified, normalized, lowercase domain name with a trailing dot (e.g., "10 mail.example.com.").',
    },
  ),
});

// TXT Record
const txtRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.TXT),
  rdata: z.string().max(255, {
    message:
      'The input is not a valid TXT value (rdata), it must be less than 255 characters',
  }),
});

// NS Record
const nsRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.NS),
  rdata: z.string().regex(fqdnLowercaseRegex, {
    message:
      'The input is not a valid NS value (rdata), it must be a fully qualified, normalized, lowercase domain name with a trailing dot (e.g., "ns1.example.com.")',
  }),
});

// SOA Record
const soaRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.SOA),
  rdata: z.string().refine(
    (val) => {
      const parts = val.split(' ');
      if (parts.length !== 7) return false;

      const [primaryNs, adminEmail, serial, refresh, retry, expire, minimum] =
        parts;

      // Validate primary NS
      if (!z.string().regex(fqdnLowercaseRegex).safeParse(primaryNs).success)
        return false;

      // Validate admin email (with dots instead of @)
      if (!z.string().regex(fqdnLowercaseRegex).safeParse(adminEmail).success)
        return false;

      // Validate numeric fields
      const numericFields = [serial, refresh, retry, expire, minimum];
      for (const field of numericFields) {
        const parsed = z.string().regex(/^\d+$/).safeParse(field);
        if (!parsed.success) return false;
        const num = Number.parseInt(parsed.data);
        if (num < 0 || num > 4294967295) return false; // 32-bit unsigned integer
      }

      return true;
    },
    {
      message:
        'The input is not a valid SOA value (rdata), it must be in the format "<primary_ns> <admin_email> <serial> <refresh> <retry> <expire> <minimum>" where numeric values are 32-bit unsigned integers',
    },
  ),
});

// PTR Record
const ptrRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.PTR),
  rdata: z.string().regex(fqdnLowercaseRegex, {
    message:
      'The input is not a valid PTR value (rdata), it must be a fully qualified, normalized, lowercase domain name with a trailing dot (e.g., "example.com.")',
  }),
});

// SRV Record
const srvRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.SRV),
  rdata: z.string().refine(
    (val) => {
      const parts = val.split(' ');
      if (parts.length !== 4) return false;

      const [priority, weight, port, target] = parts;

      // Validate priority (0-65535)
      const priorityParsed = z.string().regex(/^\d+$/).safeParse(priority);
      if (!priorityParsed.success) return false;
      const priorityNum = Number.parseInt(priorityParsed.data);
      if (priorityNum < 0 || priorityNum > 65535) return false;

      // Validate weight (0-65535)
      const weightParsed = z.string().regex(/^\d+$/).safeParse(weight);
      if (!weightParsed.success) return false;
      const weightNum = Number.parseInt(weightParsed.data);
      if (weightNum < 0 || weightNum > 65535) return false;

      // Validate port (0-65535)
      const portParsed = z.string().regex(/^\d+$/).safeParse(port);
      if (!portParsed.success) return false;
      const portNum = Number.parseInt(portParsed.data);
      if (portNum < 0 || portNum > 65535) return false;

      // Validate target (FQDN or ".")
      if (target === '.') return true;
      return z.string().regex(fqdnLowercaseRegex).safeParse(target).success;
    },
    {
      message:
        'The input is not a valid SRV value (rdata), it must be in the format "<priority> <weight> <port> <target>" where priority, weight, and port are integers (0-65535) and target is a FQDN or "."',
    },
  ),
});

// CAA Record
const caaRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.CAA),
  rdata: z.string().refine(
    (val) => {
      const match = val.match(/^(\d+)\s+([a-zA-Z0-9]+)\s+"([^"]*)"$/);
      if (!match) return false;

      const [, flags, tag] = match;

      // Validate flags (0-255)
      const flagsNum = Number.parseInt(flags);
      if (flagsNum < 0 || flagsNum > 255) return false;

      // Validate tag
      const validTags = ['issue', 'issuewild', 'iodef'];
      if (!validTags.includes(tag)) return false;

      return true;
    },
    {
      message:
        'The input is not a valid CAA value (rdata), it must be in the format \'<flags> <tag> "<value>"\' where flags is 0-255, tag is "issue", "issuewild", or "iodef", and value is in quotes',
    },
  ),
});

// DS Record
const dsRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.DS),
  rdata: z.string().refine(
    (val) => {
      const parts = val.split(' ');
      if (parts.length !== 4) return false;

      const [keyTag, algorithm, digestType, digest] = parts;

      // Validate key tag (0-65535)
      const keyTagParsed = z.string().regex(/^\d+$/).safeParse(keyTag);
      if (!keyTagParsed.success) return false;
      const keyTagNum = Number.parseInt(keyTagParsed.data);
      if (keyTagNum < 0 || keyTagNum > 65535) return false;

      // Validate algorithm (1-255)
      const algorithmParsed = z.string().regex(/^\d+$/).safeParse(algorithm);
      if (!algorithmParsed.success) return false;
      const algorithmNum = Number.parseInt(algorithmParsed.data);
      if (algorithmNum < 1 || algorithmNum > 255) return false;

      // Validate digest type (1-255)
      const digestTypeParsed = z.string().regex(/^\d+$/).safeParse(digestType);
      if (!digestTypeParsed.success) return false;
      const digestTypeNum = Number.parseInt(digestTypeParsed.data);
      if (digestTypeNum < 1 || digestTypeNum > 255) return false;

      // Validate digest (hexadecimal string)
      if (!/^[0-9A-Fa-f]+$/.test(digest)) return false;

      return true;
    },
    {
      message:
        'The input is not a valid DS value (rdata), it must be in the format "<key_tag> <algorithm> <digest_type> <digest>" where key_tag is 0-65535, algorithm and digest_type are 1-255, and digest is hexadecimal',
    },
  ),
});

// TLSA Record
const tlsaRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.TLSA),
  rdata: z.string().refine(
    (val) => {
      const parts = val.split(' ');
      if (parts.length !== 4) return false;

      const [usage, selector, matchingType, certificateData] = parts;

      // Validate usage (0-3)
      const usageParsed = z.string().regex(/^\d+$/).safeParse(usage);
      if (!usageParsed.success) return false;
      const usageNum = Number.parseInt(usageParsed.data);
      if (usageNum < 0 || usageNum > 3) return false;

      // Validate selector (0-1)
      const selectorParsed = z.string().regex(/^\d+$/).safeParse(selector);
      if (!selectorParsed.success) return false;
      const selectorNum = Number.parseInt(selectorParsed.data);
      if (selectorNum < 0 || selectorNum > 1) return false;

      // Validate matching type (0-2)
      const matchingTypeParsed = z
        .string()
        .regex(/^\d+$/)
        .safeParse(matchingType);
      if (!matchingTypeParsed.success) return false;
      const matchingTypeNum = Number.parseInt(matchingTypeParsed.data);
      if (matchingTypeNum < 0 || matchingTypeNum > 2) return false;

      // Validate certificate data (hexadecimal string)
      if (!/^[0-9A-Fa-f]+$/.test(certificateData)) return false;

      return true;
    },
    {
      message:
        'The input is not a valid TLSA value (rdata), it must be in the format "<usage> <selector> <matching_type> <certificate_data>" where usage is 0-3, selector is 0-1, matching_type is 0-2, and certificate_data is hexadecimal',
    },
  ),
});

// SSHFP Record
const sshfpRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.SSHFP),
  rdata: z.string().refine(
    (val) => {
      const parts = val.split(' ');
      if (parts.length !== 3) return false;

      const [algorithm, fingerprintType, fingerprint] = parts;

      // Validate algorithm (1-4: RSA, DSA, ECDSA, Ed25519)
      const algorithmParsed = z.string().regex(/^\d+$/).safeParse(algorithm);
      if (!algorithmParsed.success) return false;
      const algorithmNum = Number.parseInt(algorithmParsed.data);
      if (algorithmNum < 1 || algorithmNum > 4) return false;

      // Validate fingerprint type (1-2: SHA-1, SHA-256)
      const fingerprintTypeParsed = z
        .string()
        .regex(/^\d+$/)
        .safeParse(fingerprintType);
      if (!fingerprintTypeParsed.success) return false;
      const fingerprintTypeNum = Number.parseInt(fingerprintTypeParsed.data);
      if (fingerprintTypeNum < 1 || fingerprintTypeNum > 2) return false;

      // Validate fingerprint (hexadecimal string)
      if (!/^[0-9A-Fa-f]+$/.test(fingerprint)) return false;

      return true;
    },
    {
      message:
        'The input is not a valid SSHFP value (rdata), it must be in the format "<algorithm> <fingerprint_type> <fingerprint>" where algorithm is 1-4, fingerprint_type is 1-2, and fingerprint is hexadecimal',
    },
  ),
});

// HTTPS and SVCB Record (shared validation logic)
const serviceBindingValidation = (val: string) => {
  const parts = val.split(' ');
  if (parts.length < 2) return false;

  const [priority, target, ...params] = parts;

  // Validate priority (0-65535)
  const priorityParsed = z.string().regex(/^\d+$/).safeParse(priority);
  if (!priorityParsed.success) return false;
  const priorityNum = Number.parseInt(priorityParsed.data);
  if (priorityNum < 0 || priorityNum > 65535) return false;

  // Validate target (FQDN or ".")
  if (
    target !== '.' &&
    !z.string().regex(fqdnLowercaseRegex).safeParse(target).success
  ) {
    return false;
  }

  // Validate parameters (key=value pairs)
  for (const param of params) {
    if (!param.includes('=')) return false;
    const [key] = param.split('=');
    if (!/^[a-zA-Z0-9]+$/.test(key)) return false;
  }

  return true;
};

// HTTPS Record
const httpsRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.HTTPS),
  rdata: z.string().refine(serviceBindingValidation, {
    message:
      'The input is not a valid HTTPS value (rdata), it must be in the format "<priority> <target> [params...]" where priority is 0-65535, target is FQDN or ".", and params are key=value pairs',
  }),
});

// SVCB Record
const svcbRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.SVCB),
  rdata: z.string().refine(serviceBindingValidation, {
    message:
      'The input is not a valid SVCB value (rdata), it must be in the format "<priority> <target> [params...]" where priority is 0-65535, target is FQDN or ".", and params are key=value pairs',
  }),
});

// NAPTR Record
const naptrRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.NAPTR),
  rdata: z.string().refine(
    (val) => {
      const match = val.match(
        /^(\d+)\s+(\d+)\s+"([^"]*)"\s+"([^"]*)"\s+"([^"]*)"\s+(.+)$/,
      );
      if (!match) return false;

      const [, order, preference, flags, , , replacement] = match;

      // Validate order (0-65535)
      const orderNum = Number.parseInt(order);
      if (orderNum < 0 || orderNum > 65535) return false;

      // Validate preference (0-65535)
      const preferenceNum = Number.parseInt(preference);
      if (preferenceNum < 0 || preferenceNum > 65535) return false;

      // Validate flags (single character or empty)
      if (flags.length > 1) return false;

      // Validate replacement (FQDN or ".")
      if (
        replacement !== '.' &&
        !z.string().regex(fqdnLowercaseRegex).safeParse(replacement).success
      ) {
        return false;
      }

      return true;
    },
    {
      message:
        'The input is not a valid NAPTR value (rdata), it must be in the format \'<order> <preference> "<flags>" "<service>" "<regexp>" <replacement>\' where order and preference are 0-65535, and replacement is FQDN or "."',
    },
  ),
});

// SPF Record (deprecated - AWS recommends using TXT instead)
const spfRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.SPF),
  rdata: z.string().max(255, {
    message:
      'The input is not a valid SPF value (rdata), it must be less than 255 characters (Note: AWS recommends using TXT records instead of SPF records)',
  }),
});

export const recordSchema = z.union([
  aRecordSchema,
  aaaaRecordSchema,
  cnameRecordSchema,
  mxRecordSchema,
  txtRecordSchema,
  nsRecordSchema,
  soaRecordSchema,
  ptrRecordSchema,
  srvRecordSchema,
  caaRecordSchema,
  dsRecordSchema,
  tlsaRecordSchema,
  sshfpRecordSchema,
  httpsRecordSchema,
  svcbRecordSchema,
  naptrRecordSchema,
  spfRecordSchema,
]);

/**
 * Sanitize and normalize a DNS record object before validation.
 * Returns a new object with sanitized fields, does not mutate the input.
 *
 * - Trims whitespace from all fields
 * - Collapses multiple spaces
 * - Lowercases domain names
 * - Ensures CNAME/MX targets are FQDNs with trailing dot
 * - Ensures MX priority is an integer and target is normalized
 * - Removes non-printable/control characters
 * - Applies best practices for each record type
 *
 * @param record The DNS record object to sanitize
 * @param options Options for the sanitization
 * @returns A new sanitized DNS record object
 */
export function sanitizeDnsRecord(
  record: any,
  options?: {
    usingFullRecordName?: boolean;
  },
): any {
  const { usingFullRecordName = false } = options ?? {};
  // Helper to clean up whitespace and control chars
  const clean = (str: string) => {
    // Remove ASCII control characters (0-31, 127)
    let cleaned = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if ((code >= 32 && code !== 127) || code === 10 || code === 13) {
        cleaned += str[i];
      }
    }
    return cleaned.replace(/\s+/g, ' ').trim();
  };

  // Helper to ensure FQDN with trailing dot
  const ensureFqdn = (str: string) => {
    const s = clean(str).toLowerCase();
    return s.endsWith('.') ? s : `${s}.`;
  };

  // Shallow copy to avoid mutation
  const sanitized = { ...record };

  // Sanitize common fields
  if (typeof sanitized.name === 'string') {
    sanitized.name = clean(sanitized.name).toLowerCase();

    if (usingFullRecordName) {
      sanitized.name = ensureFqdn(sanitized.name);
    }
  }
  if (typeof sanitized.ttl === 'string' || typeof sanitized.ttl === 'number') {
    sanitized.ttl = Number(String(sanitized.ttl).replace(/\D/g, ''));
  }

  // Sanitize rdata based on type
  switch (sanitized.type) {
    case 'CNAME':
    case 'NS':
    case 'PTR':
      if (typeof sanitized.rdata === 'string') {
        sanitized.rdata = ensureFqdn(sanitized.rdata);
      }
      break;
    case 'MX':
      if (typeof sanitized.rdata === 'string') {
        // Collapse whitespace, split into priority and target
        const rdata = clean(sanitized.rdata);
        const [priorityRaw, ...targetParts] = rdata.split(/\s+/);
        const priority = priorityRaw.replace(/\D/g, '');
        const target = ensureFqdn(targetParts.join(' '));
        sanitized.rdata = `${priority} ${target}`;
      }
      break;
    case 'SOA':
      if (typeof sanitized.rdata === 'string') {
        const rdata = clean(sanitized.rdata);
        const parts = rdata.split(/\s+/);
        if (parts.length === 7) {
          const [primaryNs, adminEmail, ...numericParts] = parts;
          const cleanedPrimaryNs = ensureFqdn(primaryNs);
          const cleanedAdminEmail = ensureFqdn(adminEmail);
          const cleanedNumericParts = numericParts.map((part) =>
            part.replace(/\D/g, ''),
          );
          sanitized.rdata = `${cleanedPrimaryNs} ${cleanedAdminEmail} ${cleanedNumericParts.join(' ')}`;
        }
      }
      break;
    case 'SRV':
      if (typeof sanitized.rdata === 'string') {
        const rdata = clean(sanitized.rdata);
        const parts = rdata.split(/\s+/);
        if (parts.length === 4) {
          const [priority, weight, port, target] = parts;
          const cleanedPriority = priority.replace(/\D/g, '');
          const cleanedWeight = weight.replace(/\D/g, '');
          const cleanedPort = port.replace(/\D/g, '');
          const cleanedTarget = target === '.' ? '.' : ensureFqdn(target);
          sanitized.rdata = `${cleanedPriority} ${cleanedWeight} ${cleanedPort} ${cleanedTarget}`;
        }
      }
      break;
    case 'TXT':
    case 'SPF':
      if (typeof sanitized.rdata === 'string') {
        const cleanedRdata = clean(sanitized.rdata);
        // Ensure TXT/SPF records are wrapped in double quotes
        if (!cleanedRdata.startsWith('"') || !cleanedRdata.endsWith('"')) {
          // Remove existing quotes first to avoid double-quoting
          const unquoted = cleanedRdata.replace(/^"|"$/g, '');
          sanitized.rdata = `"${unquoted}"`;
        } else {
          sanitized.rdata = cleanedRdata;
        }
      }
      break;
    case 'CAA':
      if (typeof sanitized.rdata === 'string') {
        const rdata = clean(sanitized.rdata);
        const match = rdata.match(/^(\d+)\s+([a-zA-Z0-9]+)\s+(.+)$/);
        if (match) {
          const [, flags, tag, value] = match;
          const cleanedFlags = flags.replace(/\D/g, '');
          const cleanedTag = tag.toLowerCase();
          // Ensure value is wrapped in quotes
          let cleanedValue = value.trim();
          if (!cleanedValue.startsWith('"') || !cleanedValue.endsWith('"')) {
            const unquoted = cleanedValue.replace(/^"|"$/g, '');
            cleanedValue = `"${unquoted}"`;
          }
          sanitized.rdata = `${cleanedFlags} ${cleanedTag} ${cleanedValue}`;
        }
      }
      break;
    case 'NAPTR':
      if (typeof sanitized.rdata === 'string') {
        const rdata = clean(sanitized.rdata);
        const match = rdata.match(
          /^(\d+)\s+(\d+)\s+"([^"]*)"\s+"([^"]*)"\s+"([^"]*)"\s+(.+)$/,
        );
        if (match) {
          const [, order, preference, flags, service, regexp, replacement] =
            match;
          const cleanedOrder = order.replace(/\D/g, '');
          const cleanedPreference = preference.replace(/\D/g, '');
          const cleanedReplacement =
            replacement === '.' ? '.' : ensureFqdn(replacement);
          sanitized.rdata = `${cleanedOrder} ${cleanedPreference} "${flags}" "${service}" "${regexp}" ${cleanedReplacement}`;
        }
      }
      break;
    case 'DS':
    case 'TLSA':
    case 'SSHFP':
      if (typeof sanitized.rdata === 'string') {
        const rdata = clean(sanitized.rdata);
        const parts = rdata.split(/\s+/);
        if (parts.length >= 3) {
          // Normalize hexadecimal data to uppercase
          const lastPart = parts[parts.length - 1];
          const normalizedHex = lastPart.toUpperCase();
          parts[parts.length - 1] = normalizedHex;
          sanitized.rdata = parts.join(' ');
        }
      }
      break;
    case 'HTTPS':
    case 'SVCB':
      if (typeof sanitized.rdata === 'string') {
        const rdata = clean(sanitized.rdata);
        const parts = rdata.split(/\s+/);
        if (parts.length >= 2) {
          const [priority, target, ...params] = parts;
          const cleanedPriority = priority.replace(/\D/g, '');
          const cleanedTarget = target === '.' ? '.' : ensureFqdn(target);
          const cleanedParams = params.map((param) => clean(param));
          sanitized.rdata = `${cleanedPriority} ${cleanedTarget}${cleanedParams.length ? ' ' + cleanedParams.join(' ') : ''}`;
        }
      }
      break;
    default:
      if (typeof sanitized.rdata === 'string') {
        sanitized.rdata = clean(sanitized.rdata);
      }
      break;
  }

  return sanitized;
}
