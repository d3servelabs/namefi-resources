// Router for NS JSON

import { Hono } from 'hono';

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
// biome-ignore lint/suspicious/useAwait: to be added
nsJsonRouter.get('/', async (c) => {
  // get qname and qtype from query params
  const qname = c.req.query('name') as string;
  const qtype = c.req.query('type') as string;
  console.log('Received DNS request for domain:', qname, qtype);

  if (!(qname && qtype)) {
    c.status(400);
    return c.json({
      error: 'Missing required parameters',
      message: 'qname and qtype are required',
    });
  }

  const qtypeNum = Number.parseInt(qtype);

  if (Number.isNaN(qtypeNum) || !Number.isInteger(qtype)) {
    console.log(`Invalid Record Type (${qtype})`);
    c.status(400);
    return c.json({
      error: 'Bad Request',
      message: `Invalid Record Type (${qtype})`,
    });
  }

  if (!mockDnsTable[qname]?.[qtypeNum]) {
    console.log('No DNS record found for domain:', qname, qtype);
    console.log('Mock DNS table:', mockDnsTable);
    c.status(404);
    return c.json({
      error: 'Not Found',
      message: 'No DNS record found for domain',
    });
  }

  console.log('Found DNS record for domain:', qname, qtype);
  console.log('Mock DNS table:', mockDnsTable[qname][qtypeNum]);

  const result: DnsResponse = {
    RCODE: 0,
    Answer: [
      {
        name: qname,
        type: qtypeNum,
        TTL: 300,
        data: mockDnsTable[qname][qtypeNum],
      },
    ],
    Question: [
      {
        name: qname,
        type: qtypeNum,
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
