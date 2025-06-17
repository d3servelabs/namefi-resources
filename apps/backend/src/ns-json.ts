// Router for NS JSON

import { db, dnsRecordsTable } from '@namefi-astra/db';
import {
  type NamefiNormalizedDomain,
  fqdnLowercaseToNamefiNormalizedDomain,
} from '@namefi-astra/utils';
import type { RecordType } from '@namefi-astra/zod-dns';
import { fqdnLowercaseSchema, recordTypeEnum } from '@namefi-astra/zod-dns';
import { and, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { isNotEmpty, isNotNil } from 'ramda';
import { z } from 'zod';
import { createLogger } from '#lib/logger';
import { dnsRecordTypeCodes } from './lib/dns/recordTypeCodes';
import type { DnsResponse, DnsTable } from './lib/dns/types';
import { getAnswerForDnsQueryFromPreferences } from './lib/domains/domainPreferences';

const nsJsonRouter = new Hono();

nsJsonRouter.get('/healthz', (c) => c.json({ message: 'OK' }));

const USE_MOCK_DNS_TABLE = false;

// Define route handler for DNS API endpoint
//
// Note: to test this endpoint, you can use the following curl command:
// curl -X GET 'http://localhost:3000/v1/ns-json?name=example.com.&type=1' # Mocked response
// curl -X GET 'http://localhost:3000/v1/ns-json?name=test.com.&type=1' # Response from Astra DB
nsJsonRouter.get('/', async (c) => {
  const _logger = createLogger({ context: 'NS-JSON', query: c.req.query() });
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

  const recordName = fqdnLowercaseToNamefiNormalizedDomain(qname);
  // convert qtype to RecordType (string enum)

  const qTypeString = dnsRecordTypeCodes.inverse.get(qtype);
  const qTypeEnum = recordTypeEnum.parse(qTypeString);

  const response = await getAnswerForDnsQuery(recordName, qTypeEnum);

  if (response) {
    return c.json(response);
  }

  if (USE_MOCK_DNS_TABLE) {
    const response = await getAnswerForDnsQueryMock(recordName, qTypeEnum);
    if (response) {
      return c.json(response);
    }
  }

  c.status(404);
  return c.json({
    error: 'Not Found',
    message: 'No DNS record found for domain',
  });
});

// fallback route when not captured
// biome-ignore lint/suspicious/useAwait: to be added
nsJsonRouter.use('/*', async (c) => {
  const _logger = createLogger({ context: 'NS-JSON', query: c.req.query() });
  _logger.error(`Unhandled request: ${c.req.method} ${c.req.url}`);
  c.status(404);
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

export { nsJsonRouter };

export const getAnswerForDnsQuery = async (
  recordName: NamefiNormalizedDomain,
  qTypeEnum: RecordType,
) => {
  const result: DnsResponse = {
    RCODE: undefined,
    Answer: [],
  };

  const answerFromPreferences = await getAnswerForDnsQueryFromPreferences(
    recordName,
    qTypeEnum,
  );

  if (answerFromPreferences) {
    if (isNotNil(answerFromPreferences.RCODE)) {
      return answerFromPreferences;
    }
    if (
      isNotNil(answerFromPreferences.Answer) &&
      isNotEmpty(answerFromPreferences.Answer)
    ) {
      result.Answer = [
        ...(result.Answer ?? []),
        ...answerFromPreferences.Answer,
      ];
    }
  }

  const records = await db.query.dnsRecordsTable.findMany({
    where: and(
      eq(
        /**
         * This combines the name and zoneName into a single string.
         * it also handles the case where the name is '@'
         * | name | zoneName    | result          |
         * | ---- | ----------- | --------------- |
         * | @    | example.com | example.com     |
         * | www  | example.com | www.example.com |
         * */
        sql`ARRAY_TO_STRING( ARRAY[ CASE WHEN ${dnsRecordsTable.name} = '@' THEN NULL ELSE lower(${dnsRecordsTable.name}) END, lower(${dnsRecordsTable.zoneName})], '.')`,
        recordName,
      ),
      eq(dnsRecordsTable.type, qTypeEnum),
    ),
  });

  result.Answer = [
    ...(result.Answer ?? []),
    ...records.map((record) => ({
      name: recordName,
      type: dnsRecordTypeCodes.get(record.type) as number,
      TTL: record.ttl,
      data: record.rdata,
    })),
  ];

  if (isNotNil(result.Answer) && isNotEmpty(result.Answer)) {
    return {
      ...result,
      RCODE: 0,
    };
  }

  return null;
};

const mockDnsTable: DnsTable = {
  'example.com.': {
    [dnsRecordTypeCodes.get('A') as number]: '24.199.74.33',
    [dnsRecordTypeCodes.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsRecordTypeCodes.get('MX') as number]: '10 mail.example.com',
  },
  '0x801.click.': {
    [dnsRecordTypeCodes.get('A') as number]: '24.199.74.33',
    [dnsRecordTypeCodes.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsRecordTypeCodes.get('MX') as number]: '10 0x801.click',
  },
  '1.0x801.click.': {
    [dnsRecordTypeCodes.get('A') as number]: '24.199.74.33',
    [dnsRecordTypeCodes.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsRecordTypeCodes.get('MX') as number]: '10 1.0x801.click',
    [dnsRecordTypeCodes.get('TXT') as number]: 'abcd',
  },
  '0x002.click.': {
    [dnsRecordTypeCodes.get('A') as number]: '24.199.74.33',
    [dnsRecordTypeCodes.get('AAAA') as number]: '2606:4700:3031:1000:0:0:0:33',
    [dnsRecordTypeCodes.get('MX') as number]: '10 0x002.click',
  },
};

/**
 * Mocked DNS table for testing
 * @param qname - The name of the DNS record
 * @param qtypeEnum - The type of the DNS record
 * @returns The DNS response
 */
export const getAnswerForDnsQueryMock = (
  qname: string,
  qtypeEnum: RecordType,
) => {
  const qtype = dnsRecordTypeCodes.get(qtypeEnum);
  if (!qtype) {
    return null;
  }
  const _logger = createLogger({
    context: 'NS-JSON',
    query: {
      name: qname,
      type: qtype,
    },
  });
  const record = mockDnsTable[qname]?.[qtype];
  if (!record) {
    return null;
  }
  _logger.info(
    {
      qname: qname,
      qtype: qtype,
      foundRecord: record,
    },
    `Found DNS record ${qname} ${qtype}`,
  );

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

  return result;
};
