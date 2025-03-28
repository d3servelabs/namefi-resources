// This file contains the validation logic for DNS records
import { z } from 'zod';
import { fqdnLowercaseRegex, nameSchema } from './name';
// -- Single Record Type Validation --

export const recordTypeEnum = z.enum([
  'A',
  'AAAA',
  'CNAME',
  'MX',
  'TXT',
] as const);
export const RecordType = recordTypeEnum.Values;
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
  rdata: z.string().ip({ version: 'v4' }),
});

// AAAA Record
const aaaaRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.AAAA),
  rdata: z.string().ip({ version: 'v6' }),
});

// CNAME Record
const cnameRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.CNAME),
  rdata: z.string().regex(fqdnLowercaseRegex),
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
      message: 'MX rdata must have a priority and a target',
    },
  ),
});

// TXT Record
const txtRecordSchema = recordBasicSchema.extend({
  type: z.literal(RecordType.TXT),
  rdata: z.string(),
});

// TODO add more record types

export const recordSchema = z.union([
  aRecordSchema,
  aaaaRecordSchema,
  cnameRecordSchema,
  mxRecordSchema,
  txtRecordSchema,
]);
