// Router for NS JSON

import { fqdnLowercaseSchema } from '@namefi-astra/zod-dns';
import { Hono } from 'hono';
import { z } from 'zod';
const nsJsonRouter = new Hono();

nsJsonRouter.get('/healthz', (c) => c.json({ message: 'OK' }));

const dnsType = {
  A: 1,
  AAAA: 28,
  CNAME: 5,
  MX: 15,
  NS: 2,
  SOA: 6,
  TXT: 16,
} as const;

type DnsTypeKey = keyof typeof dnsType;
type DnsTypeValue = (typeof dnsType)[DnsTypeKey];

interface DnsRecord {
  [key: number]: string;
}

interface DnsTable {
  [domain: string]: DnsRecord;
}

const mockDnsTable: DnsTable = {
  'example.com.': {
    [dnsType.A]: '24.199.74.33',
    [dnsType.AAAA]: '2606:4700:3031:1000:0:0:0:33',
    [dnsType.MX]: '10 mail.example.com',
  },
  '0x801.click.': {
    [dnsType.A]: '24.199.74.33',
    [dnsType.AAAA]: '2606:4700:3031:1000:0:0:0:33',
    [dnsType.MX]: '10 0x801.click',
  },
  '1.0x801.click.': {
    [dnsType.A]: '24.199.74.33',
    [dnsType.AAAA]: '2606:4700:3031:1000:0:0:0:33',
    [dnsType.MX]: '10 1.0x801.click',
    [dnsType.TXT]: 'abcd',
  },
  '0x002.click.': {
    [dnsType.A]: '24.199.74.33',
    [dnsType.AAAA]: '2606:4700:3031:1000:0:0:0:33',
    [dnsType.MX]: '10 0x002.click',
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
// curl -X GET 'http://localhost:3000/v1/ns-json?name=example.com.&type=1'
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
