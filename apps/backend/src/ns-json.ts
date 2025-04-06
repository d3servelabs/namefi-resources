// Router for NS JSON

import { db, dnsRecordsTable } from '@namefi-astra/db';
import { fqdnLowercaseToNamefiNormalizedDomain } from '@namefi-astra/utils';
import { fqdnLowercaseSchema, recordTypeEnum } from '@namefi-astra/zod-dns';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { BiMap } from 'mnemonist';
import { z } from 'zod';

const nsJsonRouter = new Hono();

nsJsonRouter.get('/healthz', (c) => c.json({ message: 'OK' }));

const dnsType = BiMap.from({
  A: 1,
  AAAA: 28,
  CNAME: 5,
  MX: 15,
  NS: 2,
  SOA: 6,
  TXT: 16,
}) as BiMap<string, number>;

interface DnsRecord {
  [key: number]: string;
}

interface DnsTable {
  [domain: string]: DnsRecord;
}

const mockDnsTable: DnsTable = {
  'example.com.': {
    [dnsType.get('A') as number]: '24.199.74.33',
    [dnsType.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsType.get('MX') as number]: '10 mail.example.com',
  },
  '0x801.click.': {
    [dnsType.get('A') as number]: '24.199.74.33',
    [dnsType.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsType.get('MX') as number]: '10 0x801.click',
  },
  '1.0x801.click.': {
    [dnsType.get('A') as number]: '24.199.74.33',
    [dnsType.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsType.get('MX') as number]: '10 1.0x801.click',
    [dnsType.get('TXT') as number]: 'abcd',
  },
  '0x002.click.': {
    [dnsType.get('A') as number]: '24.199.74.33',
    [dnsType.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsType.get('MX') as number]: '10 0x002.click',
  },
};

interface DnsResponse {
  RCODE?: number;
  Answer?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
  Question?: Array<{
    name: string;
    type: number;
  }>;
}

// Define route handler for DNS API endpoint
//
// Note: to test this endpoint, you can use the following curl command:
// curl -X GET 'http://localhost:3000/v1/ns-json?name=example.com.&type=1' # Mocked response
// curl -X GET 'http://localhost:3000/v1/ns-json?name=test.com.&type=1' # Response from Astra DB
nsJsonRouter.get('/', async (c) => {
  // get qname and qtype from query params

  const qnameResult = fqdnLowercaseSchema.safeParse(c.req.query('name'));

  const qtypeResult = z
    .string()
    .superRefine((val, ctx) => {
      if (Number.isNaN(Number(val))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Type must be a numeric DNS record type (1-255). Received: "${val}"`,
        });
      }
    })
    .transform(Number)
    .pipe(z.number().int().min(1).max(255))
    .safeParse(c.req.query('type'));

  if (!(qnameResult.success && qtypeResult.success)) {
    c.status(400);
    return c.json({
      error: 'Bad Request',
      message: `Invalid parameters, expecting name and type but got errors. ${
        qnameResult.error ? `name: ${qnameResult.error}` : ''
      } ${qtypeResult.error ? `type: ${qtypeResult.error}` : ''}`,
    });
  }

  const qname = qnameResult.data;
  const qtype = qtypeResult.data;

  const zoneName = fqdnLowercaseToNamefiNormalizedDomain(qnameResult.data);
  // convert qtype to RecordType (string enum)

  const qTypeString = dnsType.inverse.get(qtype);
  const qTypeEnum = recordTypeEnum.parse(qTypeString);
  const records = await db.query.dnsRecordsTable.findMany({
    where: and(
      eq(dnsRecordsTable.normalizedDomainName, zoneName),
      eq(dnsRecordsTable.type, qTypeEnum),
    ),
  });
  if (records.length > 0) {
    const result: DnsResponse = {
      RCODE: 0,
      Answer: records.map((record) => ({
        name: record.name,
        type: dnsType.get(record.type) as number,
        TTL: record.ttl,
        data: record.rdata,
      })),
    };
    return c.json(result);
  }

  // make a tRPC query to get the DNS record by calling
  if (!mockDnsTable[qname]?.[qtype]) {
    console.log('No DNS record found for domain:', qname, qtype);
    console.log('Mock DNS table:', mockDnsTable);
    c.status(404);
    return c.json({
      error: 'Not Found',
      message: 'No DNS record found for domain',
    });
  }

  console.log('Found DNS record for domain:', qname, qtype);
  console.log('Mock DNS table:', mockDnsTable[qname][qtype]);

  const result: DnsResponse = {
    RCODE: 0,
    Answer: [
      {
        name: qname,
        type: qtype,
        TTL: 300,
        data: mockDnsTable[qname][qtype],
      },
    ],
    Question: [
      {
        name: qname,
        type: qtype,
      },
    ],
  };
  console.log('Sending DNS response:', result);
  return c.json(result);
});

// fallback route when not captured
// biome-ignore lint/suspicious/useAwait: to be added
nsJsonRouter.use('/*', async (c) => {
  console.log('Unhandled request:', c.req.method, c.req.url);
  c.status(404);
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

export { nsJsonRouter };
